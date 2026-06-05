import { Component, OnInit, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../shared/material.module';
import { NgxMaskDirective } from 'ngx-mask';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { HttpEvent, HttpEventType } from '@angular/common/http';
import { ColaboradoresService } from '../../../core/services/colaboradores.service';
import { PerfisService } from '../../../core/services/perfis.service';
import { UploadService } from '../../../core/services/upload.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ColaboradorResponseDto, ColaboradorSearchFilterDto, ColaboradorDocumentoInputDto, CargoColaborador, CargoColaboradorLabels } from '../../../models/colaborador.model';
import { PerfilDto } from '../../../models/usuario.models';
import { DocumentoPipe } from '../../../shared/pipes/documento-pipe';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-colaboradores',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    NgxMaskDirective,
    DocumentoPipe
  ],
  templateUrl: './colaboradores.html',
  styleUrls: ['./colaboradores.scss']
})
export class ColaboradoresListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private colaboradoresService = inject(ColaboradoresService);
  private perfisService = inject(PerfisService);
  private uploadService = inject(UploadService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  formatTelefone(tel?: string | null): string {
    if (!tel) return '-';
    const digits = tel.replace(/\D/g, '');
    if (digits.length === 11) {
      return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    if (digits.length === 10) {
      return digits.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return tel;
  }

  // States
  loading = signal(false);
  salvando = signal(false);
  perfis = signal<PerfilDto[]>([]);
  colaboradores = signal<ColaboradorResponseDto[]>([]);
  total = signal(0);
  
  cargoLabels = CargoColaboradorLabels;
  cargosList = Object.keys(CargoColaboradorLabels).map(k => Number(k) as CargoColaborador);
  
  // Document states for form
  documentosLocal = signal<ColaboradorDocumentoInputDto[]>([]);
  uploadingDoc = signal(false);
  uploadProgress = signal(0);
  novoDocNome = signal('');
  
  // Pagination / Filter
  page = signal(0);
  pageSize = signal(10);
  termo = signal('');
  ativo = signal<boolean | null>(null);

  // Form & Dialog references
  formFilter!: FormGroup;
  form!: FormGroup;
  dialogRef?: MatDialogRef<any>;
  editingColaborador: ColaboradorResponseDto | null = null;

  @ViewChild('dialogColaborador') dialogTemplate!: TemplateRef<any>;

  // Table columns
  displayedColumns: string[] = ['nome', 'cpf', 'cargo', 'email', 'telefone', 'usuario', 'ativo', 'acoes'];

  ngOnInit(): void {
    this.initFilterForm();
    this.initForm();
    this.carregarColaboradores();
    this.carregarPerfis();
  }

  private initFilterForm(): void {
    this.formFilter = this.fb.group({
      termo: [''],
      ativo: [null]
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(150)]],
      cpf: ['', [Validators.required]],
      cargo: [null, [Validators.required]],
      email: ['', [Validators.required, Validators.email, Validators.maxLength(150)]],
      telefone: [''],
      dataAdmissao: [null],
      ativo: [true],
      // User creation options
      criarUsuario: [false],
      senha: [''],
      perfilId: [null]
    });

    // Toggle password/profile validators based on criarUsuario checkbox
    this.form.get('criarUsuario')?.valueChanges.subscribe((val: boolean) => {
      const senhaControl = this.form.get('senha');
      const perfilControl = this.form.get('perfilId');
      if (val) {
        senhaControl?.setValidators([Validators.required, Validators.minLength(6)]);
        perfilControl?.setValidators([Validators.required]);
      } else {
        senhaControl?.clearValidators();
        perfilControl?.clearValidators();
      }
      senhaControl?.updateValueAndValidity();
      perfilControl?.updateValueAndValidity();
    });
  }

  carregarColaboradores(): void {
    this.loading.set(true);
    const filter: ColaboradorSearchFilterDto = {
      page: this.page() + 1, // backend is 1-indexed for page
      pageSize: this.pageSize(),
      termo: this.termo(),
      ativo: this.ativo()
    };

    this.colaboradoresService.listar(filter).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.colaboradores.set(res.items);
        this.total.set(res.total);
      },
      error: () => {
        this.loading.set(false);
        this.notification.toastError('Erro ao carregar colaboradores');
      }
    });
  }

  private carregarPerfis(): void {
    this.perfisService.listar().subscribe({
      next: (res) => {
        this.perfis.set(res);
      },
      error: () => {
        this.notification.toastError('Erro ao carregar perfis de acesso');
      }
    });
  }

  filtrar(): void {
    const filterVal = this.formFilter.value;
    this.termo.set(filterVal.termo || '');
    this.ativo.set(filterVal.ativo);
    this.page.set(0);
    this.carregarColaboradores();
  }

  limparFiltros(): void {
    this.formFilter.reset({
      termo: '',
      ativo: null
    });
    this.termo.set('');
    this.ativo.set(null);
    this.page.set(0);
    this.carregarColaboradores();
  }

  onPage(event: any): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.carregarColaboradores();
  }

  abrirNovo(): void {
    this.editingColaborador = null;
    this.documentosLocal.set([]);
    this.novoDocNome.set('');
    this.uploadingDoc.set(false);
    this.uploadProgress.set(0);
    this.form.reset({
      nome: '',
      cpf: '',
      cargo: null,
      email: '',
      telefone: '',
      dataAdmissao: null,
      ativo: true,
      criarUsuario: false,
      senha: '',
      perfilId: null
    });
    this.form.get('criarUsuario')?.enable();

    this.dialogRef = this.dialog.open(this.dialogTemplate, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-panel'
    });
  }

  abrirEditar(colab: ColaboradorResponseDto): void {
    this.editingColaborador = colab;
    this.documentosLocal.set(
      (colab.documentos || []).map(d => ({
        id: d.id,
        nome: d.nome,
        documentoId: d.documentoId,
        caminho: d.caminho,
        documentoNome: d.documentoNome,
        contentType: d.contentType,
        tamanhoBytes: d.tamanhoBytes
      }))
    );
    this.novoDocNome.set('');
    this.uploadingDoc.set(false);
    this.uploadProgress.set(0);
    this.form.reset({
      nome: colab.nome,
      cpf: colab.cpf,
      cargo: colab.cargo,
      email: colab.email,
      telefone: colab.telefone || '',
      dataAdmissao: colab.dataAdmissao ? colab.dataAdmissao.split('T')[0] : null,
      ativo: colab.ativo,
      criarUsuario: false,
      senha: '',
      perfilId: null
    });

    // Cannot create user during edit via this checkbox since it is a create-only feature
    this.form.get('criarUsuario')?.disable();

    this.dialogRef = this.dialog.open(this.dialogTemplate, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-panel'
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notification.toastError('Por favor, corrija os erros no formulário antes de salvar.');
      return;
    }

    this.salvando.set(true);
    const values = this.form.getRawValue();

    if (this.editingColaborador) {
      // Editar
      const bodyUpdate = {
        nome: values.nome,
        cpf: values.cpf.replace(/\D/g, ''),
        cargo: values.cargo,
        email: values.email,
        telefone: values.telefone ? values.telefone.replace(/\D/g, '') : null,
        ativo: values.ativo,
        dataAdmissao: values.dataAdmissao || null,
        documentos: this.documentosLocal()
      };

      this.colaboradoresService.atualizar(this.editingColaborador.id, bodyUpdate).subscribe({
        next: () => {
          this.salvando.set(false);
          this.notification.toastSuccess('Colaborador atualizado com sucesso!');
          this.dialogRef?.close();
          this.carregarColaboradores();
        },
        error: () => {
          this.salvando.set(false);
          this.notification.toastError('Erro ao atualizar colaborador');
        }
      });
    } else {
      // Criar
      const bodyCreate = {
        nome: values.nome,
        cpf: values.cpf.replace(/\D/g, ''),
        cargo: values.cargo,
        email: values.email,
        telefone: values.telefone ? values.telefone.replace(/\D/g, '') : null,
        ativo: values.ativo,
        dataAdmissao: values.dataAdmissao || null,
        criarUsuario: values.criarUsuario,
        senha: values.criarUsuario ? values.senha : null,
        perfilId: values.criarUsuario ? values.perfilId : null,
        documentos: this.documentosLocal()
      };

      this.colaboradoresService.criar(bodyCreate).subscribe({
        next: () => {
          this.salvando.set(false);
          this.notification.toastSuccess('Colaborador cadastrado com sucesso!');
          this.dialogRef?.close();
          this.carregarColaboradores();
        },
        error: () => {
          this.salvando.set(false);
          this.notification.toastError('Erro ao cadastrar colaborador');
        }
      });
    }
  }

  // Document management methods
  uploadDocumento(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = ''; // allow selecting the same file later

    if (!file) return;

    const label = this.novoDocNome().trim() || file.name;
    this.uploadingDoc.set(true);
    this.uploadProgress.set(0);

    const folder = 'colaborador-docs';
    this.uploadService.uploadWithProgress(file, folder).subscribe({
      next: (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          const percentDone = event.total ? Math.round((100 * event.loaded) / event.total) : 0;
          this.uploadProgress.set(percentDone);
        } else if (event.type === HttpEventType.Response) {
          const response = event.body;
          if (response) {
            const newDoc: ColaboradorDocumentoInputDto = {
              nome: label,
              caminho: response.caminho,
              documentoNome: response.nome,
              contentType: response.contentType,
              tamanhoBytes: response.tamanhoBytes
            };
            this.documentosLocal.update(docs => [...docs, newDoc]);
            this.novoDocNome.set(''); // Reset label input
            this.notification.toastSuccess('Documento enviado com sucesso!');
          }
          this.uploadingDoc.set(false);
          this.uploadProgress.set(0);
        }
      },
      error: () => {
        this.uploadingDoc.set(false);
        this.uploadProgress.set(0);
        this.notification.toastError('Erro ao fazer upload do documento');
      }
    });
  }

  removerDocumentoLocal(index: number): void {
    this.documentosLocal.update(docs => docs.filter((_, i) => i !== index));
  }

  obterDownloadUrl(caminho: string): string {
    return `${environment.apiUrl}/uploads?caminho=${encodeURIComponent(caminho)}`;
  }

  obterCargoLabel(cargo: any): string {
    const enumVal = Number(cargo) as CargoColaborador;
    return this.cargoLabels[enumVal] || '-';
  }

  excluir(colab: ColaboradorResponseDto): void {
    this.notification.confirm(
      'Remover Colaborador',
      `Tem certeza que deseja remover o colaborador ${colab.nome}?`
    ).then((confirmed: boolean) => {
      if (confirmed) {
        this.loading.set(true);
        this.colaboradoresService.excluir(colab.id).subscribe({
          next: () => {
            this.notification.toastSuccess('Colaborador removido com sucesso!');
            this.carregarColaboradores();
          },
          error: (err) => {
            this.loading.set(false);
            this.notification.toastError(
              err.error?.message || 'Erro ao remover colaborador'
            );
          }
        });
      }
    });
  }
}
