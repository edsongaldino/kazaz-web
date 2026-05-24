import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';

import { ChipComponent } from '../../../shared/components/chips/chip';

import {
  ConviteCadastroContratoDto,
  ConvitesCadastroService,
  GerarConviteCadastroRequest
} from '../../../core/services/convites.service';

import {
  getConvitePapelLabel,
  getConviteStatusLabel
} from '../../../shared/helpers/convite.helper';

import { ConviteUiService } from '../../../shared/services/convite-ui.service';

/** Forma de Garantia — espelha o enum do backend */
export enum FormaGarantia {
  Fiador = 1,
  SeguroFianca = 2
}

@Component({
  selector: 'app-convites-imovel-dialog',
  standalone: true,
  templateUrl: './convites-imovel-dialog.html',
  styleUrls: ['./convites-imovel-dialog.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatCheckboxModule,
    MatIconModule,
    MatDividerModule,
    MatPaginator,
    ChipComponent
  ]
})
export class ConvitesImovelDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private conviteService = inject(ConvitesCadastroService);
  private conviteUi = inject(ConviteUiService);
  private snackBar = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);

  loading = false;
  gerando = false;

  page = 1;
  pageSize = 5;
  total = 0;

  modo: 'lista' | 'form' | 'resultado' = 'lista';

  convites: ConviteCadastroContratoDto[] = [];

  /** Links gerados na última ação — exibidos na tela de resultado */
  linksGerados: { papel: number; token: string; url: string }[] = [];
  contratoGeradoNumero: string | null = null;

  formasGarantia = [
    { value: FormaGarantia.Fiador, label: 'Fiador' },
    { value: FormaGarantia.SeguroFianca, label: 'Seguro Fiança' }
  ];

  tiposContrato = [
    { value: 1, label: 'Locação' },
    { value: 2, label: 'Venda' }
  ];

  form = this.fb.group({
    tipo: [1 as number | null, Validators.required],
    formaGarantia: [null as number | null],
    administradoPeloProprietario: [false],
    expiraEmDias: [7 as number | null, [Validators.required, Validators.min(1)]]
  });

  labelPapel = getConvitePapelLabel;

  get ehLocacao(): boolean {
    return this.form.value.tipo === 1;
  }

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { imovelId: string; codigo: string; titulo: string }
  ) {}

  ngOnInit(): void {
    // Torna formaGarantia obrigatória quando for locação
    this.form.get('tipo')!.valueChanges.subscribe(tipo => {
      const ctrl = this.form.get('formaGarantia')!;
      if (tipo === 1) {
        ctrl.setValidators([Validators.required]);
      } else {
        ctrl.clearValidators();
        ctrl.setValue(null);
      }
      ctrl.updateValueAndValidity();
    });

    this.carregarConvites();
  }

  carregarConvites(): void {
    this.loading = true;

    this.conviteService
      .listarPorImovel(this.data.imovelId, this.page, this.pageSize)
      .subscribe({
        next: (res) => {
          this.convites = res?.items ?? [];
          this.total = res?.total ?? 0;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(err);
          this.convites = [];
          this.total = 0;
          this.loading = false;
          this.cdr.detectChanges();
          this.snackBar.open('Erro ao carregar convites.', 'Fechar', { duration: 3000 });
        }
      });
  }

  gerarNovo(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.value;

    const payload: GerarConviteCadastroRequest = {
      tipo: v.tipo!,
      formaGarantia: v.tipo === 1 ? v.formaGarantia : null,
      administradoPeloProprietario: v.administradoPeloProprietario ?? false,
      expiraEmDias: v.expiraEmDias!
    };

    this.gerando = true;

    this.conviteService.gerarLinksConvite(this.data.imovelId, payload).subscribe({
      next: (res) => {
        this.linksGerados = res.links ?? [];
        this.contratoGeradoNumero = res.numero;
        this.gerando = false;
        this.modo = 'resultado';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.gerando = false;
        this.cdr.detectChanges();
        const msg = err?.error?.error ?? 'Erro ao gerar convite.';
        this.snackBar.open(msg, 'Fechar', { duration: 4000 });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.carregarConvites();
  }

  abrirForm(): void {
    this.form.reset({
      tipo: 1,
      formaGarantia: null,
      administradoPeloProprietario: false,
      expiraEmDias: 7
    });
    this.modo = 'form';
  }

  voltarLista(): void {
    this.linksGerados = [];
    this.contratoGeradoNumero = null;
    this.page = 1;
    this.modo = 'lista';
    this.carregarConvites();
  }

  getStatusLabel(item: ConviteCadastroContratoDto): string {
    return getConviteStatusLabel(item.status);
  }

  copiar(url?: string | null): void {
    this.conviteUi.copiarLink(url);
  }

  verDados(item: ConviteCadastroContratoDto): void {
    this.conviteUi.verDados(item.token);
  }

  getLabelAcao(item: ConviteCadastroContratoDto): string {
    return item.usadoEm ? 'Ver dados' : 'Copiar link';
  }

  onAcao(item: ConviteCadastroContratoDto): void {
    if (item.usadoEm) {
      this.verDados(item);
      return;
    }
    this.copiar(item.url || item.link);
  }

  getLabelPapelLink(papel: number): string {
    return this.labelPapel(papel);
  }

  copiarLink(url: string): void {
    navigator.clipboard.writeText(url).then(() => {
      this.snackBar.open('Link copiado!', 'Fechar', { duration: 2000 });
    });
  }
}