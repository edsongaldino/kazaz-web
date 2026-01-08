import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { UploadService } from '../../../core/services/upload.service';
import { DocumentosService } from '../../../core/services/documentos.service';
import { CadastroPublicoService } from '../../../core/services/cadastro-publico.service';

@Component({
  standalone: true,
  selector: 'app-cadastro-documentos',
  imports: [CommonModule],
  templateUrl: './documentos.html',
  styleUrls: ['./documentos.scss'],
})
export class CadastroDocumentosComponent implements OnInit {
  pessoaId: string | null = null;

  file: File | null = null;
  erro: string | null = null;
  uploading = false;
  concluindo = false;

  docs: any[] = [];

  // ⚠️ depois trocamos por lista dinâmica
  tipoDocumentoId = 'COLE_AQUI_GUID_DO_TIPO_DOCUMENTO';

  constructor(
    private uploadService: UploadService,
    private documentosService: DocumentosService,
    private cadastroPublicoService: CadastroPublicoService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const token = this.route.parent?.snapshot.paramMap.get('token');
    if (!token) {
      this.erro = 'Token não encontrado.';
      return;
    }

    // ✅ Opção A: buscar PessoaId pelo token (endpoint /status)
    this.cadastroPublicoService.status(token).subscribe({
      next: (st) => {
        if (!st.pessoaId) {
          this.erro = 'Você precisa preencher seus dados antes de enviar documentos.';
          // opcional: voltar para a primeira etapa
          this.router.navigate(['../'], { relativeTo: this.route });
          return;
        }

        this.pessoaId = st.pessoaId;
        this.carregar();
      },
      error: () => {
        this.erro = 'Erro ao carregar status do cadastro.';
      }
    });
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.file = input.files?.[0] ?? null;
  }

  enviar(): void {
    this.erro = null;

    if (!this.pessoaId) {
      this.erro = 'Pessoa não definida.';
      return;
    }

    if (!this.file) {
      this.erro = 'Selecione um arquivo.';
      return;
    }

    if (!this.tipoDocumentoId || this.tipoDocumentoId.startsWith('COLE_AQUI')) {
      this.erro = 'Configure o TipoDocumentoId antes de enviar.';
      return;
    }

    this.uploading = true;

    // 1) Upload do arquivo (salva no disco e retorna caminho)
    this.uploadService.upload(this.file, 'pessoa').subscribe({
      next: (up) => {
        // 2) Registra no banco via /api/documentos
        this.documentosService.criar({
          nome: up.nome,
          caminho: up.caminho,
          contentType: up.contentType,
          tamanhoBytes: up.tamanhoBytes,
          alvo: 1, // Pessoa
          alvoId: this.pessoaId!,
          tipoDocumentoId: this.tipoDocumentoId,
          observacao: null,
        }).subscribe({
          next: () => {
            this.uploading = false;
            this.file = null;
            this.carregar();
          },
          error: () => {
            this.uploading = false;
            this.erro = 'Erro ao salvar documento.';
          },
        });
      },
      error: () => {
        this.uploading = false;
        this.erro = 'Erro no upload.';
      },
    });
  }

  concluir(): void {
    this.erro = null;

    const token = this.route.parent?.snapshot.paramMap.get('token');
    if (!token) {
      this.erro = 'Token não encontrado.';
      return;
    }

    this.concluindo = true;

    this.cadastroPublicoService.concluir(token).subscribe({
      next: () => {
        this.concluindo = false;
        // opcional: ir para uma página "obrigado"
        // this.router.navigate(['/cadastro-finalizado']);
      },
      error: () => {
        this.concluindo = false;
        this.erro = 'Erro ao concluir cadastro.';
      }
    });
  }

  private carregar(): void {
    if (!this.pessoaId) return;

    this.documentosService.listarPorPessoa(this.pessoaId).subscribe({
      next: (d) => this.docs = d,
      error: () => this.docs = [],
    });
  }
}
