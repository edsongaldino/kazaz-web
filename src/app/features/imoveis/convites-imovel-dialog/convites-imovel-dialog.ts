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

import { ChipComponent } from '../../../shared/components/chips/chip';

import {
  ConviteCadastroContratoDto,
  ConvitesCadastroService
} from '../../../core/services/convites.service';

import {
  convitePapelOptions,
  getConvitePapelLabel,
  getConviteStatusLabel
} from '../../../shared/helpers/convite.helper';

import { ConviteUiService } from '../../../shared/services/convite-ui.service';

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

  modo: 'lista' | 'form' = 'lista';

  convites: ConviteCadastroContratoDto[] = [];

  form = this.fb.group({
    tipo: [null as number | null, Validators.required],
    papel: [null as number | null, Validators.required],
    expiraEmDias: [7 as number | null, [Validators.required, Validators.min(1)]]
  });

  papeis = convitePapelOptions;

  labelPapel = getConvitePapelLabel;

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { imovelId: string; codigo: string; titulo: string }
  ) {}

  ngOnInit(): void {
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

    const payload = {
      tipo: this.form.value.tipo!,
      papel: this.form.value.papel!,
      expiraEmDias: this.form.value.expiraEmDias!
    };

    this.gerando = true;

    this.conviteService.gerarLinksConvite(this.data.imovelId, payload).subscribe({
      next: () => {
        this.snackBar.open('Convite gerado com sucesso.', 'Fechar', { duration: 3000 });

        this.form.reset({
          tipo: null,
          papel: null,
          expiraEmDias: 7
        });

        this.gerando = false;
        this.modo = 'lista';
        this.page = 1;

        this.carregarConvites();
      },
      error: (err) => {
        console.error(err);

        this.gerando = false;
        this.cdr.detectChanges();

        this.snackBar.open('Erro ao gerar convite.', 'Fechar', { duration: 3000 });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.carregarConvites();
  }

  abrirForm(): void {
    this.modo = 'form';
  }

  voltarLista(): void {
    this.modo = 'lista';
  }

  get papeisFiltrados() {
    const tipo = this.form.value.tipo;

    if (tipo === 1) {
      return this.papeis.filter(p => [1, 2, 3].includes(p.value));
    }

    if (tipo === 2) {
      return this.papeis.filter(p => [10, 11].includes(p.value));
    }

    return this.papeis;
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

    this.copiar(item.url);
  }
}