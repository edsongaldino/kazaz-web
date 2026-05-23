import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { UploadService } from '../../../core/services/upload.service';
import { DocumentosService } from '../../../core/services/documentos.service';
import { CadastroPublicoService} from '../../../core/services/cadastro-publico.service';
import { NotificationService } from '../../../core/services/notification.service';
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
  contratoId: string | null = null;

  erro: string | null = null;
  uploadingRowKey: string | null = null;
  uploadProgressMap: { [key: string]: number } = {};
  concluindo = false;

  docs: any[] = [];
  requeridos: DocumentoRequeridoDto[] = [];
  anexosVmList: AnexoVm[] = [];

  get anexosVm(): AnexoVm[] {
    return this.anexosVmList;
  }

  private atualizarAnexosVm(): void {
    const map = new Map<string, any>();

    for (const d of this.docs ?? []) {
      const tid = (d.tipoDocumentoId ?? '').toString();
      const idx = (d.multiplicidadeIndex ?? d.slot ?? null);
      const key = this.key(tid, idx);
      if (!tid) continue;
      if (!map.has(key)) map.set(key, d);
    }

    this.anexosVmList = (this.requeridos ?? [])
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

    this.cdr.markForCheck();
  }

  trackByFn(index: number, item: any): string {
    return `${item.tipoDocumentoId}::${item.multiplicidadeIndex ?? 0}`;
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
    private cdr: ChangeDetectorRef,
    private notify: NotificationService
  ) {}

  ngOnInit(): void {
    const token = this.getTokenFromRoute();
    console.log('[Documentos] ngOnInit chamado com token:', token);
    if (!token) {
      this.erro = 'Token não encontrado.';
      console.error('[Documentos] Token ausente na rota.');
      this.cdr.markForCheck();
      return;
    }

    this.cadastroPublicoService.status(token).subscribe({
      next: (st) => {
        console.log('[Documentos] Status retornado:', st);
        this.pessoaId = st.pessoaId ?? null;
        this.cdr.markForCheck(); // <-- AQUI

        this.cadastroPublicoService.documentosRequeridos(token).subscribe({
          next: (res: any) => {
            console.log('[Documentos] Documentos requeridos retornados:', res);
            this.requeridos = res?.itens ?? [];
            this.pessoaId = res?.pessoaId ?? this.pessoaId;
            this.contratoId = res?.contratoId ?? this.contratoId;
            console.log('[Documentos] IDs definidos após carregar requeridos:', {
              pessoaId: this.pessoaId,
              contratoId: this.contratoId
            });
            this.cdr.markForCheck(); // <-- AQUI
            this.carregarDocs();
          },
          error: (err) => {
            console.error('[Documentos] Erro ao carregar documentos requeridos:', err);
            this.erro = 'Erro ao carregar lista de documentos requeridos.';
            this.cdr.markForCheck(); // <-- AQUI
          }
        });
      },
      error: (err) => {
        console.error('[Documentos] Erro ao carregar status:', err);
        this.erro = 'Erro ao carregar status do cadastro.';
        this.cdr.markForCheck(); // <-- AQUI
      }
    });
  }

  triggerFile(tipoDocumentoId: string, multiplicidadeIndex?: number | null): void {
    console.log('[Documentos] triggerFile chamado para:', { tipoDocumentoId, multiplicidadeIndex });
    const id = this.inputId(tipoDocumentoId, multiplicidadeIndex ?? null);
    console.log('[Documentos] Procurando input com ID:', id);
    const el = document.getElementById(id) as HTMLInputElement | null;
    console.log('[Documentos] Elemento input encontrado:', el);
    if (el) {
      el.click();
    } else {
      console.error('[Documentos] Elemento input não encontrado no DOM!');
    }
  }

  onFileRow(event: Event, tipoDocumentoId: string, multiplicidadeIndex?: number | null): void {
    console.log('[Documentos] onFileRow chamado:', { tipoDocumentoId, multiplicidadeIndex });
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    // permite escolher o mesmo arquivo depois
    input.value = '';

    if (!file) {
      console.warn('[Documentos] Nenhum arquivo selecionado.');
      return;
    }

    console.log('[Documentos] Arquivo selecionado:', { nome: file.name, tamanho: file.size });
    this.enviarDocumento(tipoDocumentoId, multiplicidadeIndex ?? null, file);
  }

  private enviarDocumento(tipoDocumentoId: string, multiplicidadeIndex: number | null, file: File): void {
    this.erro = null;
    console.log('[Documentos] enviarDocumento:', {
      tipoDocumentoId,
      multiplicidadeIndex,
      pessoaId: this.pessoaId,
      contratoId: this.contratoId
    });

    if (!this.pessoaId) {
      this.erro = 'Pessoa não definida.';
      console.error('[Documentos] Erro: pessoaId nulo ou indefinido.');
      this.cdr.markForCheck();
      return;
    }

    if (!this.contratoId) {
      this.erro = 'Contrato não definido.';
      console.error('[Documentos] Erro: contratoId nulo ou indefinido.');
      this.cdr.markForCheck();
      return;
    }

    const rowKey = this.key(tipoDocumentoId, multiplicidadeIndex);
    this.uploadingRowKey = rowKey;
    this.uploadProgressMap[rowKey] = 0;
    this.cdr.markForCheck();

    const folder = `pessoa/${this.pessoaId}/${this.slugDocumento(tipoDocumentoId)}`;
    console.log('[Documentos] Iniciando upload com progress para pasta:', folder);

    this.uploadService.uploadWithProgress(file, folder).subscribe({
      next: (event: HttpEvent<any>) => {
        if (event.type === HttpEventType.UploadProgress) {
          const percentDone = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
          this.uploadProgressMap[rowKey] = percentDone;
          console.log(`[Documentos] Progresso do upload (${rowKey}): ${percentDone}%`);
          this.cdr.markForCheck();
        } else if (event.type === HttpEventType.Response) {
          const up = event.body;
          console.log('[Documentos] Upload concluído com sucesso, salvando no banco:', up);
          if (up) {
            this.documentosService.criar({
              nome: up.nome,
              caminho: up.caminho,
              contentType: up.contentType,
              tamanhoBytes: up.tamanhoBytes,
              alvo: 1, // Pessoa
              alvoId: this.pessoaId!,
              tipoDocumentoId: tipoDocumentoId,
              contratoId: this.contratoId!,
              observacao: null,
              multiplicidadeIndex: multiplicidadeIndex
            }).subscribe({
              next: (res) => {
                console.log('[Documentos] Registro de documento criado no banco:', res);
                this.uploadingRowKey = null;
                delete this.uploadProgressMap[rowKey];
                this.carregarDocs();
              },
              error: (err) => {
                console.error('[Documentos] Erro ao salvar registro de documento:', err);
                this.uploadingRowKey = null;
                delete this.uploadProgressMap[rowKey];
                this.erro = 'Erro ao salvar documento.';
                this.cdr.markForCheck();
              },
            });
          }
        }
      },
      error: (err) => {
        console.error('[Documentos] Erro na requisição de upload:', err);
        this.uploadingRowKey = null;
        delete this.uploadProgressMap[rowKey];
        this.erro = 'Erro no upload.';
        this.cdr.markForCheck();
      },
    });
  }

  private slugDocumento(tipoDocumentoId: string): string {
    const doc = this.requeridos.find(x => x.tipoDocumentoId === tipoDocumentoId);
    const nome = doc?.nome ?? 'documento';

    return nome
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-_]/g, '');
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
        this.notify.toastSuccess('Cadastro finalizado com sucesso! Nossa equipe irá avaliar seus dados.');
        this.router.navigate(['/cadastro-publico', token, 'acompanhamento']);
      },
      error: () => {
        this.concluindo = false;
        this.erro = 'Erro ao concluir cadastro.';
        this.cdr.markForCheck();
      }
    });
  }

  private carregarDocs(): void {
    if (!this.pessoaId) {
      this.atualizarAnexosVm();
      return;
    }

    this.documentosService.listarPorPessoa(this.pessoaId, this.contratoId).subscribe({
      next: (d) => { 
        this.docs = d ?? []; 
        this.atualizarAnexosVm();
      },
      error: () => { 
        this.docs = []; 
        this.atualizarAnexosVm();
      },
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
