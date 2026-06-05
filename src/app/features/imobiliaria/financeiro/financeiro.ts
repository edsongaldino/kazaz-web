import { Component, OnInit, TemplateRef, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../shared/material.module';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FinanceiroService } from '../../../core/services/financeiro.service';
import { PessoasLookupService, LookupItem } from '../../../core/services/pessoas-lookup.service';
import { ContratosService } from '../../../core/services/contratos.service';
import { NotificationService } from '../../../core/services/notification.service';
import { FinanceiroLancamentoResponseDto, FinanceiroLancamentoSearchFilterDto, FinanceiroResumoDto, TipoLancamento, StatusLancamento } from '../../../models/financeiro.model';
import { ContratoResponse } from '../../../models/contrato.models';

@Component({
  selector: 'app-financeiro',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule
  ],
  templateUrl: './financeiro.html',
  styleUrls: ['./financeiro.scss']
})
export class FinanceiroComponent implements OnInit {
  private fb = inject(FormBuilder);
  private financeiroService = inject(FinanceiroService);
  private lookupPessoasService = inject(PessoasLookupService);
  private contratosService = inject(ContratosService);
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  // Constants/Enums access in template
  TipoLancamento = TipoLancamento;
  StatusLancamento = StatusLancamento;

  // States
  loading = signal(false);
  loadingSummary = signal(false);
  salvando = signal(false);
  
  lancamentos = signal<FinanceiroLancamentoResponseDto[]>([]);
  resumo = signal<FinanceiroResumoDto>({
    totalReceberPendente: 0,
    totalPagarPendente: 0,
    totalRecebido: 0,
    totalPago: 0,
    saldoLiquido: 0
  });

  clientes = signal<LookupItem[]>([]);
  contratos = signal<ContratoResponse[]>([]);
  total = signal(0);

  // Pagination & Filter
  page = signal(0);
  pageSize = signal(10);
  tipo = signal<TipoLancamento | null>(null);
  status = signal<StatusLancamento | null>(null);
  categoria = signal('');
  dataInicio = signal('');
  dataFim = signal('');

  // Form & Dialog Refs
  formFilter!: FormGroup;
  form!: FormGroup;
  dialogRef?: MatDialogRef<any>;
  editingLancamento: FinanceiroLancamentoResponseDto | null = null;

  @ViewChild('dialogLancamento') dialogTemplate!: TemplateRef<any>;

  // Columns
  displayedColumns: string[] = ['tipo', 'descricao', 'categoria', 'valor', 'dataVencimento', 'status', 'cliente', 'contrato', 'acoes'];

  ngOnInit(): void {
    this.initFilterForm();
    this.initForm();
    this.carregarResumo();
    this.carregarLancamentos();
    this.carregarLookups();
  }

  private initFilterForm(): void {
    this.formFilter = this.fb.group({
      tipo: [null],
      status: [null],
      categoria: [''],
      dataInicio: [''],
      dataFim: ['']
    });
  }

  private initForm(): void {
    this.form = this.fb.group({
      descricao: ['', [Validators.required, Validators.maxLength(200)]],
      valor: [null, [Validators.required, Validators.min(0.01)]],
      tipo: [TipoLancamento.Receita, [Validators.required]],
      status: [StatusLancamento.Pendente, [Validators.required]],
      dataVencimento: ['', [Validators.required]],
      dataPagamento: [null],
      categoria: ['', [Validators.required, Validators.maxLength(100)]],
      clienteId: [null],
      contratoId: [null]
    });

    // Automatically set or clear payment date validation based on status
    this.form.get('status')?.valueChanges.subscribe((val: number) => {
      const pagControl = this.form.get('dataPagamento');
      if (val === StatusLancamento.Pago) {
        pagControl?.setValidators([Validators.required]);
      } else {
        pagControl?.clearValidators();
      }
      pagControl?.updateValueAndValidity();
    });
  }

  carregarResumo(): void {
    this.loadingSummary.set(true);
    this.financeiroService.obterResumo().subscribe({
      next: (res) => {
        this.loadingSummary.set(false);
        this.resumo.set(res);
      },
      error: () => {
        this.loadingSummary.set(false);
        this.notification.toastError('Erro ao carregar resumo financeiro');
      }
    });
  }

  carregarLancamentos(): void {
    this.loading.set(true);
    const filter: FinanceiroLancamentoSearchFilterDto = {
      page: this.page() + 1,
      pageSize: this.pageSize(),
      tipo: this.tipo(),
      status: this.status(),
      categoria: this.categoria(),
      dataInicio: this.dataInicio() || null,
      dataFim: this.dataFim() || null
    };

    this.financeiroService.listar(filter).subscribe({
      next: (res) => {
        this.loading.set(false);
        this.lancamentos.set(res.items);
        this.total.set(res.total);
      },
      error: () => {
        this.loading.set(false);
        this.notification.toastError('Erro ao carregar lançamentos financeiros');
      }
    });
  }

  private carregarLookups(): void {
    // Load clients for autocomplete/select lookup
    this.lookupPessoasService.buscar('').subscribe({
      next: (res) => {
        this.clientes.set(res);
      }
    });

    // Load contracts
    this.contratosService.listar({ page: 1, pageSize: 100 }).subscribe({
      next: (res) => {
        this.contratos.set(res.items);
      }
    });
  }

  filtrar(): void {
    const f = this.formFilter.value;
    this.tipo.set(f.tipo);
    this.status.set(f.status);
    this.categoria.set(f.categoria || '');
    this.dataInicio.set(f.dataInicio || '');
    this.dataFim.set(f.dataFim || '');
    this.page.set(0);
    this.carregarLancamentos();
  }

  limparFiltros(): void {
    this.formFilter.reset({
      tipo: null,
      status: null,
      categoria: '',
      dataInicio: '',
      dataFim: ''
    });
    this.tipo.set(null);
    this.status.set(null);
    this.categoria.set('');
    this.dataInicio.set('');
    this.dataFim.set('');
    this.page.set(0);
    this.carregarLancamentos();
  }

  onPage(event: any): void {
    this.page.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.carregarLancamentos();
  }

  abrirNovo(): void {
    this.editingLancamento = null;
    this.form.reset({
      descricao: '',
      valor: null,
      tipo: TipoLancamento.Receita,
      status: StatusLancamento.Pendente,
      dataVencimento: new Date().toISOString().split('T')[0],
      dataPagamento: null,
      categoria: '',
      clienteId: null,
      contratoId: null
    });

    this.dialogRef = this.dialog.open(this.dialogTemplate, {
      width: '900px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'custom-dialog-panel'
    });
  }

  abrirEditar(lanc: FinanceiroLancamentoResponseDto): void {
    this.editingLancamento = lanc;
    this.form.reset({
      descricao: lanc.descricao,
      valor: lanc.valor,
      tipo: lanc.tipo,
      status: lanc.status,
      dataVencimento: lanc.dataVencimento ? lanc.dataVencimento.split('T')[0] : '',
      dataPagamento: lanc.dataPagamento ? lanc.dataPagamento.split('T')[0] : null,
      categoria: lanc.categoria,
      clienteId: lanc.clienteId,
      contratoId: lanc.contratoId
    });

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

    const payload = {
      descricao: values.descricao,
      valor: Number(values.valor),
      tipo: Number(values.tipo) as TipoLancamento,
      status: Number(values.status) as StatusLancamento,
      dataVencimento: values.dataVencimento,
      dataPagamento: values.status === StatusLancamento.Pago ? values.dataPagamento : null,
      categoria: values.categoria,
      clienteId: values.clienteId || null,
      contratoId: values.contratoId || null
    };

    if (this.editingLancamento) {
      this.financeiroService.atualizar(this.editingLancamento.id, payload).subscribe({
        next: () => {
          this.salvando.set(false);
          this.notification.toastSuccess('Lançamento atualizado com sucesso!');
          this.dialogRef?.close();
          this.carregarLancamentos();
          this.carregarResumo();
        },
        error: () => {
          this.salvando.set(false);
          this.notification.toastError('Erro ao atualizar lançamento');
        }
      });
    } else {
      this.financeiroService.criar(payload).subscribe({
        next: () => {
          this.salvando.set(false);
          this.notification.toastSuccess('Lançamento cadastrado com sucesso!');
          this.dialogRef?.close();
          this.carregarLancamentos();
          this.carregarResumo();
        },
        error: () => {
          this.salvando.set(false);
          this.notification.toastError('Erro ao cadastrar lançamento');
        }
      });
    }
  }

  excluir(lanc: FinanceiroLancamentoResponseDto): void {
    this.notification.confirm(
      'Remover Lançamento',
      `Tem certeza que deseja remover o lançamento "${lanc.descricao}"?`
    ).then((confirmed: boolean) => {
      if (confirmed) {
        this.loading.set(true);
        this.financeiroService.excluir(lanc.id).subscribe({
          next: () => {
            this.notification.toastSuccess('Lançamento removido com sucesso!');
            this.carregarLancamentos();
            this.carregarResumo();
          },
          error: (err) => {
            this.loading.set(false);
            this.notification.toastError(
              err.error?.message || 'Erro ao remover lançamento'
            );
          }
        });
      }
    });
  }
}
