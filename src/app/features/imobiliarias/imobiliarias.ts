import { Component, OnInit, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../shared/material.module';
import { NgxMaskDirective } from 'ngx-mask';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { EnderecoComponent } from '../../shared/components/endereco/endereco';
import { ImobiliariasService } from '../../core/services/imobiliarias.service';
import { CidadeService } from '../../core/services/cidade.service';
import { NotificationService } from '../../core/services/notification.service';
import { ImobiliariaResponseDto, ImobiliariaCriarDto, ImobiliariaUpdateDto } from '../../models/imobiliaria.model';
import { DocumentoPipe } from '../../shared/pipes/documento-pipe';

@Component({
  selector: 'app-imobiliarias',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    NgxMaskDirective,
    EnderecoComponent,
    DocumentoPipe
  ],
  templateUrl: './imobiliarias.html',
  styleUrls: ['./imobiliarias.scss']
})
export class ImobiliariasComponent implements OnInit {
  private fb = inject(FormBuilder);
  private service = inject(ImobiliariasService);
  private cidadeService = inject(CidadeService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  @ViewChild(EnderecoComponent) enderecoCmp?: EnderecoComponent;
  @ViewChild('dialogImobiliaria') dialogTemplate!: TemplateRef<any>;

  loading = signal(false);
  salvando = signal(false);
  items = signal<ImobiliariaResponseDto[]>([]);
  total = signal(0);

  // Pagination & Filter
  page = signal(0);
  pageSize = signal(10);
  termo = signal('');

  form!: FormGroup;
  enderecoForm!: FormGroup;
  dialogRef?: MatDialogRef<any>;
  editingItem: ImobiliariaResponseDto | null = null;

  displayedColumns: string[] = ['nomeFantasia', 'razaoSocial', 'cnpj', 'creci', 'email', 'telefone', 'acoes'];

  ngOnInit(): void {
    this.initForm();
    this.carregarDados();
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
      razaoSocial: ['', [Validators.required, Validators.maxLength(150)]],
      nomeFantasia: ['', [Validators.required, Validators.maxLength(150)]],
      cnpj: ['', [Validators.required]],
      creci: ['', [Validators.required, Validators.maxLength(50)]],
      dataFundacao: [null],
      logoUrl: [''],
      email: ['', [Validators.email]],
      telefone: [''],
      endereco: this.enderecoForm,
      // Admin fields (only for creation)
      adminNome: ['', []],
      adminEmail: ['', []],
      adminSenha: ['', []]
    });
  }

  carregarDados(): void {
    this.loading.set(true);
    this.service.listar(this.page() + 1, this.pageSize(), this.termo()).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.items.set(res.items);
        this.total.set(res.total);
      },
      error: () => {
        this.loading.set(false);
        this.notification.toastError('Erro ao carregar imobiliárias.');
      }
    });
  }

  pesquisar(val: string): void {
    this.termo.set(val);
    this.page.set(0);
    this.carregarDados();
  }

  limparFiltros(searchVal: HTMLInputElement): void {
    searchVal.value = '';
    this.termo.set('');
    this.page.set(0);
    this.carregarDados();
  }

  mudarPagina(event: any): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.carregarDados();
  }

  abrirNovo(): void {
    this.editingItem = null;
    this.initForm();
    
    // Admin fields are required during creation
    this.form.get('adminNome')?.setValidators([Validators.required, Validators.maxLength(100)]);
    this.form.get('adminEmail')?.setValidators([Validators.required, Validators.email, Validators.maxLength(150)]);
    this.form.get('adminSenha')?.setValidators([Validators.required, Validators.minLength(6)]);
    
    this.form.get('adminNome')?.updateValueAndValidity();
    this.form.get('adminEmail')?.updateValueAndValidity();
    this.form.get('adminSenha')?.updateValueAndValidity();

    this.dialogRef = this.dialog.open(this.dialogTemplate, {
      panelClass: 'custom-dialog-panel',
      width: '800px',
      disableClose: true
    });
  }

  abrirEditar(item: ImobiliariaResponseDto): void {
    this.editingItem = item;
    this.initForm();

    // Admin fields not needed for editing
    this.form.get('adminNome')?.clearValidators();
    this.form.get('adminEmail')?.clearValidators();
    this.form.get('adminSenha')?.clearValidators();
    
    this.form.get('adminNome')?.updateValueAndValidity();
    this.form.get('adminEmail')?.updateValueAndValidity();
    this.form.get('adminSenha')?.updateValueAndValidity();

    this.form.patchValue({
      razaoSocial: item.razaoSocial,
      nomeFantasia: item.nomeFantasia,
      cnpj: item.cnpj,
      creci: item.creci,
      dataFundacao: item.dataFundacao ? item.dataFundacao.split('T')[0] : null,
      logoUrl: item.logoUrl,
      email: item.email,
      telefone: item.telefone
    });

    if (item.endereco && item.endereco.cidadeId) {
      this.cidadeService.obterPorId(item.endereco.cidadeId).subscribe({
        next: (cidade) => {
          this.enderecoForm.patchValue({
            cep: item.endereco!.cep,
            logradouro: item.endereco!.logradouro,
            numero: item.endereco!.numero,
            complemento: item.endereco!.complemento,
            bairro: item.endereco!.bairro,
            estadoId: cidade.estadoId,
            cidadeId: null
          });

          // Wait for endereco component state-city resolver to complete
          setTimeout(() => {
            this.enderecoForm.patchValue({
              cidadeId: item.endereco!.cidadeId
            });
          }, 300);
        }
      });
    }

    this.dialogRef = this.dialog.open(this.dialogTemplate, {
      panelClass: 'custom-dialog-panel',
      width: '800px',
      disableClose: true
    });
  }

  excluir(item: ImobiliariaResponseDto): void {
    this.notification.confirm('Excluir Imobiliária?', `Atenção: isto removerá permanentemente a imobiliária "${item.nomeFantasia}" e todos os seus usuários vinculados!`)
      .then((confirmado: boolean) => {
        if (confirmado) {
          this.service.excluir(item.id).subscribe({
            next: () => {
              this.notification.toastSuccess('Imobiliária excluída com sucesso.');
              this.carregarDados();
            },
            error: () => {
              this.notification.toastError('Erro ao excluir imobiliária.');
            }
          });
        }
      });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.enderecoForm.markAllAsTouched();
      return;
    }

    const raw = this.form.value;
    const body: ImobiliariaCriarDto = {
      razaoSocial: raw.razaoSocial,
      nomeFantasia: raw.nomeFantasia,
      cnpj: raw.cnpj,
      creci: raw.creci,
      dataFundacao: raw.dataFundacao,
      logoUrl: raw.logoUrl,
      email: raw.email,
      telefone: raw.telefone,
      endereco: raw.endereco ? {
        cep: raw.endereco.cep,
        logradouro: raw.endereco.logradouro,
        numero: raw.endereco.numero,
        complemento: raw.endereco.complemento,
        bairro: raw.endereco.bairro,
        cidadeId: raw.endereco.cidadeId
      } : null,
      adminNome: raw.adminNome,
      adminEmail: raw.adminEmail,
      adminSenha: raw.adminSenha
    };

    this.salvando.set(true);
    if (this.editingItem) {
      // Update
      const updateBody: ImobiliariaUpdateDto = {
        razaoSocial: body.razaoSocial,
        nomeFantasia: body.nomeFantasia,
        cnpj: body.cnpj,
        creci: body.creci,
        dataFundacao: body.dataFundacao,
        logoUrl: body.logoUrl,
        email: body.email,
        telefone: body.telefone,
        endereco: body.endereco
      };

      this.service.atualizar(this.editingItem.id, updateBody).subscribe({
        next: () => {
          this.salvando.set(false);
          this.notification.toastSuccess('Imobiliária atualizada com sucesso.');
          this.dialogRef?.close();
          this.carregarDados();
        },
        error: (err) => {
          this.salvando.set(false);
          const msg = err.error?.message || 'Erro ao atualizar imobiliária.';
          this.notification.toastError(msg);
        }
      });
    } else {
      // Create
      this.service.criar(body).subscribe({
        next: () => {
          this.salvando.set(false);
          this.notification.toastSuccess('Imobiliária cadastrada e login liberado com sucesso.');
          this.dialogRef?.close();
          this.carregarDados();
        },
        error: (err) => {
          this.salvando.set(false);
          const msg = err.error?.message || 'Erro ao cadastrar imobiliária.';
          this.notification.toastError(msg);
        }
      });
    }
  }

  fecharModal(): void {
    this.dialogRef?.close();
  }

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
}
