import { Component, OnInit, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../shared/material.module';
import { NgxMaskDirective } from 'ngx-mask';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EnderecoComponent } from '../../../shared/components/endereco/endereco';
import { PrestadoresService } from '../../../core/services/prestadores.service';
import { CidadeService } from '../../../core/services/cidade.service';
import { NotificationService } from '../../../core/services/notification.service';
import { PrestadorServicoResponseDto, PrestadorServicoSearchFilterDto, EspecialidadePrestador, EspecialidadePrestadorLabels } from '../../../models/prestador.model';
import { DocumentoPipe } from '../../../shared/pipes/documento-pipe';

@Component({
  selector: 'app-prestadores',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    NgxMaskDirective,
    EnderecoComponent,
    DocumentoPipe
  ],
  templateUrl: './prestadores.html',
  styleUrls: ['./prestadores.scss']
})
export class PrestadoresListComponent implements OnInit {
  private fb = inject(FormBuilder);
  private prestadoresService = inject(PrestadoresService);
  private cidadeService = inject(CidadeService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  @ViewChild(EnderecoComponent) enderecoCmp?: EnderecoComponent;

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
  prestadores = signal<PrestadorServicoResponseDto[]>([]);
  total = signal(0);

  especialidadeLabels = EspecialidadePrestadorLabels;
  especialidadesList = Object.keys(EspecialidadePrestadorLabels).map(k => Number(k) as EspecialidadePrestador);

  // Pagination / Filter
  page = signal(0);
  pageSize = signal(10);
  termo = signal('');
  especialidade = signal<EspecialidadePrestador | null>(null);
  ativo = signal<boolean | null>(null);

  // Form & Dialog references
  formFilter!: FormGroup;
  form!: FormGroup;
  enderecoForm!: FormGroup;
  dialogRef?: MatDialogRef<any>;
  editingPrestador: PrestadorServicoResponseDto | null = null;

  @ViewChild('dialogPrestador') dialogTemplate!: TemplateRef<any>;

  // Columns
  displayedColumns: string[] = ['nome', 'especialidade', 'cpfCnpj', 'telefone', 'email', 'cidade', 'ativo', 'acoes'];

  ngOnInit(): void {
    this.initFilterForm();
    this.initForm();
    this.carregarPrestadores();
  }

  private initFilterForm(): void {
    this.formFilter = this.fb.group({
      termo: [''],
      especialidade: [null],
      ativo: [null]
    });
  }

  private initForm(): void {
    this.enderecoForm = this.fb.group({
      cep: ['', [Validators.required]],
      logradouro: ['', [Validators.required]],
      numero: ['', [Validators.required]],
      complemento: [''],
      bairro: ['', [Validators.required]],
      estadoId: [null, [Validators.required]],
      cidadeId: [null, [Validators.required]],
      estado: [''],
      cidade: ['']
    });

    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(150)]],
      especialidade: [null, [Validators.required]],
      cpfCnpj: ['', [Validators.required]],
      telefone: ['', [Validators.required]],
      email: ['', [Validators.email]],
      ativo: [true],
      observacoes: [''],
      endereco: this.enderecoForm
    });
  }

  carregarPrestadores(): void {
    this.loading.set(true);
    const filter: PrestadorServicoSearchFilterDto = {
      page: this.page() + 1,
      pageSize: this.pageSize(),
      termo: this.termo(),
      especialidade: this.especialidade(),
      ativo: this.ativo()
    };

    this.prestadoresService.listar(filter).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.prestadores.set(res.items);
        this.total.set(res.total);
      },
      error: () => {
        this.loading.set(false);
        this.notification.toastError('Erro ao carregar prestadores de serviço');
      }
    });
  }

  filtrar(): void {
    const f = this.formFilter.value;
    this.termo.set(f.termo || '');
    this.especialidade.set(f.especialidade);
    this.ativo.set(f.ativo);
    this.page.set(0);
    this.carregarPrestadores();
  }

  limparFiltros(): void {
    this.formFilter.reset({
      termo: '',
      especialidade: null,
      ativo: null
    });
    this.termo.set('');
    this.especialidade.set(null);
    this.ativo.set(null);
    this.page.set(0);
    this.carregarPrestadores();
  }

  onPage(event: any): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.carregarPrestadores();
  }

  abrirNovo(): void {
    this.editingPrestador = null;
    this.form.reset({
      nome: '',
      especialidade: null,
      cpfCnpj: '',
      telefone: '',
      email: '',
      ativo: true,
      observacoes: ''
    });

    this.enderecoForm.reset({
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      estadoId: null,
      cidadeId: null,
      estado: '',
      cidade: ''
    });

    this.dialogRef = this.dialog.open(this.dialogTemplate, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-panel'
    });
  }

  abrirEditar(prest: PrestadorServicoResponseDto): void {
    this.editingPrestador = prest;
    this.form.reset({
      nome: prest.nome,
      especialidade: prest.especialidade,
      cpfCnpj: prest.cpfCnpj,
      telefone: prest.telefone,
      email: prest.email || '',
      ativo: prest.ativo,
      observacoes: prest.observacoes || ''
    });

    this.enderecoForm.reset({
      cep: '',
      logradouro: '',
      numero: '',
      complemento: '',
      bairro: '',
      estadoId: null,
      cidadeId: null,
      estado: '',
      cidade: ''
    });

    if (prest.endereco && prest.endereco.cidadeId) {
      this.cidadeService.obterPorId(prest.endereco.cidadeId).subscribe({
        next: async (cidade) => {
          this.enderecoForm.patchValue({
            cep: prest.endereco!.cep,
            logradouro: prest.endereco!.logradouro,
            numero: prest.endereco!.numero,
            complemento: prest.endereco!.complemento || '',
            bairro: prest.endereco!.bairro,
            estadoId: cidade.estadoId,
            cidadeId: null
          });

          await Promise.resolve();
          await this.enderecoCmp?.onEstadoChange?.();

          setTimeout(() => {
            this.enderecoForm.get('cidadeId')?.setValue(cidade.id, { emitEvent: false });
          }, 50);
        }
      });
    }

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
    const values = this.form.value;

    const body = {
      nome: values.nome,
      especialidade: values.especialidade,
      cpfCnpj: values.cpfCnpj.replace(/\D/g, ''),
      telefone: values.telefone.replace(/\D/g, ''),
      email: values.email || null,
      ativo: values.ativo,
      observacoes: values.observacoes || null,
      endereco: this.enderecoForm.get('cep')?.value ? {
        cep: this.enderecoForm.get('cep')?.value.replace(/\D/g, ''),
        logradouro: this.enderecoForm.get('logradouro')?.value,
        numero: this.enderecoForm.get('numero')?.value,
        complemento: this.enderecoForm.get('complemento')?.value || null,
        bairro: this.enderecoForm.get('bairro')?.value,
        cidadeId: this.enderecoForm.get('cidadeId')?.value
      } : null
    };

    if (this.editingPrestador) {
      this.prestadoresService.atualizar(this.editingPrestador.id, body).subscribe({
        next: () => {
          this.salvando.set(false);
          this.notification.toastSuccess('Prestador de serviço atualizado com sucesso!');
          this.dialogRef?.close();
          this.carregarPrestadores();
        },
        error: () => {
          this.salvando.set(false);
          this.notification.toastError('Erro ao atualizar prestador de serviço');
        }
      });
    } else {
      this.prestadoresService.criar(body).subscribe({
        next: () => {
          this.salvando.set(false);
          this.notification.toastSuccess('Prestador de serviço cadastrado com sucesso!');
          this.dialogRef?.close();
          this.carregarPrestadores();
        },
        error: () => {
          this.salvando.set(false);
          this.notification.toastError('Erro ao cadastrar prestador de serviço');
        }
      });
    }
  }

  obterEspecialidadeLabel(especialidade: any): string {
    const enumVal = Number(especialidade) as EspecialidadePrestador;
    return this.especialidadeLabels[enumVal] || '-';
  }

  excluir(prest: PrestadorServicoResponseDto): void {
    this.notification.confirm(
      'Remover Prestador de Serviço',
      `Tem certeza que deseja remover o prestador ${prest.nome}?`
    ).then((confirmed: boolean) => {
      if (confirmed) {
        this.loading.set(true);
        this.prestadoresService.excluir(prest.id).subscribe({
          next: () => {
            this.notification.toastSuccess('Prestador de serviço removido com sucesso!');
            this.carregarPrestadores();
          },
          error: (err) => {
            this.loading.set(false);
            this.notification.toastError(
              err.error?.message || 'Erro ao remover prestador de serviço'
            );
          }
        });
      }
    });
  }
}
