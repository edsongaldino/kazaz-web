import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UploadService } from '../../../core/services/upload.service';
import { DocumentosService } from '../../../core/services/documentos.service';
import { CadastroPublicoService} from '../../../core/services/cadastro-publico.service';
import { DocumentoRequeridoDto, DocumentosRequeridosResponse } from '../../../models/cadastro-publico.models';

type AnexoVm = DocumentoRequeridoDto & {
  enviado: boolean;
  arquivoNome?: string | null;
};

@Component({
  standalone: true,
  selector: 'app-cadastro-documentos',
  imports: [CommonModule],
  templateUrl: './documentos.html',
  styleUrls: ['./documentos.scss'],
})
export class CadastroDocumentosComponent implements OnInit {
  pessoaId: string | null = null;

  erro: string | null = null;
  uploadingRowKey: string | null = null;
  concluindo = false;

  docs: any[] = [];
  requeridos: DocumentoRequeridoDto[] = [];

  get anexosVm(): AnexoVm[] {
    // Map por "chave" (tipoDocumentoId + multiplicidadeIndex)
    const map = new Map<string, any>();

    for (const d of this.docs ?? []) {
      const tid = (d.tipoDocumentoId ?? '').toString();
      const idx = (d.multiplicidadeIndex ?? d.slot ?? null);
      const key = this.key(tid, idx);
      if (!tid) continue;
      if (!map.has(key)) map.set(key, d);
    }

    return (this.requeridos ?? [])
      .slice()
      .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
      .map(r => {
        const doc = map.get(this.key(r.tipoDocumentoId, r.multiplicidadeIndex ?? null));
        return {
          ...r,
          enviado: !!doc,
          arquivoNome: doc?.nome ?? doc?.arquivoNome ?? null
        };
      });
  }

  get todosObrigatoriosEnviados(): boolean {
    const enviados = new Set(this.anexosVm.filter(x => x.enviado).map(x => this.key(x.tipoDocumentoId, x.multiplicidadeIndex ?? null)));
    return (this.requeridos ?? [])
      .filter(x => x.obrigatorio)
      .every(x => enviados.has(this.key(x.tipoDocumentoId, x.multiplicidadeIndex ?? null)));
  }

  constructor(
    private uploadService: UploadService,
    private documentosService: DocumentosService,
    private cadastroPublicoService: CadastroPublicoService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const token = this.getTokenFromRoute();
    if (!token) { this.erro = 'Token não encontrado.'; this.cdr.markForCheck(); return; }

    this.cadastroPublicoService.status(token).subscribe({
      next: (st) => {
        this.pessoaId = st.pessoaId ?? null;
        this.cdr.markForCheck(); // <-- AQUI

        this.cadastroPublicoService.documentosRequeridos(token).subscribe({
          next: (res: any) => {
            this.requeridos = res?.itens ?? [];
            this.pessoaId = res?.pessoaId ?? this.pessoaId;
            this.cdr.markForCheck(); // <-- AQUI
            this.carregarDocs();
          },
          error: (err) => {
            this.erro = 'Erro ao carregar lista de documentos requeridos.';
            this.cdr.markForCheck(); // <-- AQUI
          }
        });
      },
      error: () => {
        this.erro = 'Erro ao carregar status do cadastro.';
        this.cdr.markForCheck(); // <-- AQUI
      }
    });
  }

  triggerFile(tipoDocumentoId: string, multiplicidadeIndex?: number | null): void {
    const id = this.inputId(tipoDocumentoId, multiplicidadeIndex ?? null);
    const el = document.getElementById(id) as HTMLInputElement | null;
    el?.click();
  }

  onFileRow(event: Event, tipoDocumentoId: string, multiplicidadeIndex?: number | null): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    // permite escolher o mesmo arquivo depois
    input.value = '';

    if (!file) return;

    this.enviarDocumento(tipoDocumentoId, multiplicidadeIndex ?? null, file);
  }

  private enviarDocumento(tipoDocumentoId: string, multiplicidadeIndex: number | null, file: File): void {
    this.erro = null;

    if (!this.pessoaId) {
      this.erro = 'Pessoa não definida.';
      return;
    }

    const rowKey = this.key(tipoDocumentoId, multiplicidadeIndex);
    this.uploadingRowKey = rowKey;

    this.uploadService.upload(file, 'pessoa').subscribe({
      next: (up) => {
        this.documentosService.criar({
          nome: up.nome,
          caminho: up.caminho,
          contentType: up.contentType,
          tamanhoBytes: up.tamanhoBytes,
          alvo: 1, // Pessoa
          alvoId: this.pessoaId!,
          tipoDocumentoId: tipoDocumentoId,
          observacao: null,

          // ✅ se você adicionar isso no backend (recomendado)
          multiplicidadeIndex: multiplicidadeIndex
        }).subscribe({
          next: () => {
            this.uploadingRowKey = null;
            this.carregarDocs();
          },
          error: () => {
            this.uploadingRowKey = null;
            this.erro = 'Erro ao salvar documento.';
          },
        });
      },
      error: () => {
        this.uploadingRowKey = null;
        this.erro = 'Erro no upload.';
      },
    });
  }

  concluir(): void {
    this.erro = null;

    const token = this.getTokenFromRoute();
    if (!token) {
      this.erro = 'Token não encontrado.';
      return;
    }

    if (!this.todosObrigatoriosEnviados) {
      this.erro = 'Envie todos os anexos obrigatórios antes de concluir.';
      return;
    }

    this.concluindo = true;

    this.cadastroPublicoService.concluir(token).subscribe({
      next: () => {
        this.concluindo = false;
        // opcional: rota final
        // this.router.navigate(['/cadastro-publico', token, 'finalizado']);
      },
      error: () => {
        this.concluindo = false;
        this.erro = 'Erro ao concluir cadastro.';
      }
    });
  }

  private carregarDocs(): void {
    if (!this.pessoaId) return;

    this.documentosService.listarPorPessoa(this.pessoaId).subscribe({
      next: (d) => { this.docs = d ?? []; this.cdr.markForCheck(); }, // <-- AQUI
      error: () => { this.docs = []; this.cdr.markForCheck(); },
    });
  }

  // ---------- helpers ----------
  private key(tipoDocumentoId: string, multiplicidadeIndex: number | null): string {
    return `${tipoDocumentoId}::${multiplicidadeIndex ?? 0}`;
  }

  private inputId(tipoDocumentoId: string, multiplicidadeIndex: number | null): string {
    return `file_${tipoDocumentoId}_${multiplicidadeIndex ?? 0}`;
  }

  private getTokenFromRoute(): string | null {
    let r: ActivatedRoute | null = this.route;
    while (r) {
      const t = r.snapshot.paramMap.get('token');
      if (t) return t;
      r = r.parent;
    }
    return null;
  }
}
