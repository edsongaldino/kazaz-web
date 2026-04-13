import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChangeDetectorRef } from '@angular/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { getChipConfig } from '../../../shared/helpers/chip.helper';
import { ChipComponent } from '../../../shared/components/chips/chip';
import { Router } from '@angular/router';
import {
  ConvitesCadastroService,
  ConviteCadastroContratoDto
} from '../../../core/services/convites.service';

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
  private snackBar = inject(MatSnackBar);

  loading = false;
  gerando = false;

  page = 1;
  pageSize = 5;
  total = 0;

  modo: 'lista' | 'form' = 'lista';

  convites: ConviteCadastroContratoDto[] = [];
  contratos: { id: string; numero: string; tipo: string | number }[] = [];

  form = this.fb.group({
    tipo: [null as number | null, Validators.required],
    papel: [null as number | null, Validators.required],
    expiraEmDias: [7 as number | null, [Validators.required, Validators.min(1)]]
  });

  papeis = [
    { value: 1, label: 'Locador' },
    { value: 2, label: 'Locatário' },
    { value: 3, label: 'Fiador' },
    { value: 10, label: 'Vendedor' },
    { value: 11, label: 'Comprador' }
  ];

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: { imovelId: string; codigo: string; titulo: string },
    private cdr: ChangeDetectorRef,
    private router: Router
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

          setTimeout(() => {
            this.loading = false;
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          console.error(err);

          setTimeout(() => {
            this.convites = [];
            this.total = 0;
            this.loading = false;
            this.cdr.detectChanges();
          });

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

        setTimeout(() => {
          this.form.patchValue({
            tipo: null,
            papel: null,
            expiraEmDias: 7
          });

          this.gerando = false;
          this.modo = 'lista';
          this.page = 1;
          this.carregarConvites();
        });
      },
      error: (err) => {
        console.error(err);

        setTimeout(() => {
          this.gerando = false;
        });

        this.snackBar.open('Erro ao gerar convite.', 'Fechar', { duration: 3000 });
      }
    });
  }

  onPageChange(event: PageEvent): void {
    this.page = event.pageIndex + 1;
    this.pageSize = event.pageSize;
    this.carregarConvites();
  }

  copiar(url?: string | null): void {
    if (!url) return;

    navigator.clipboard.writeText(url);
    this.snackBar.open('Link copiado.', 'Fechar', { duration: 2000 });
  }

  getStatusLabel(item: ConviteCadastroContratoDto): string {
    if (item.usadoEm) return 'Usado';

    if (item.expiraEm && new Date(item.expiraEm) < new Date()) {
      return 'Expirado';
    }

    switch (item.status) {
      case 1: return 'Pendente';
      case 2: return 'Usado';
      case 3: return 'Expirado';
      case 4: return 'Cancelado';
      default: return String(item.status);
    }
  }

  getPapelLabel(papel: number): string {
    switch (papel) {
      case 1: return 'Locador';
      case 2: return 'Locatário';
      case 3: return 'Fiador';
      case 10: return 'Vendedor';
      case 11: return 'Comprador';
      default: return String(papel);
    }
  }

  abrirForm(): void {
    this.modo = 'form';
  }

  voltarLista(): void {
    this.modo = 'lista';
  }

  getStatusClass(item: any): string {
    const label = this.getStatusLabel(item);

    switch (label) {
      case 'Pendente':
        return 'status-pendente';
      case 'Usado':
        return 'status-usado';
      case 'Expirado':
        return 'status-expirado';
      case 'Cancelado':
        return 'status-cancelado';
      default:
        return 'status-default';
    }
  }

  get papeisFiltrados() {
    const tipo = this.form.value.tipo;

    if (tipo === 1) {
      return this.papeis.filter(p => p.value === 1 || p.value === 2 || p.value === 3);
    }

    if (tipo === 2) {
      return this.papeis.filter(p => p.value === 10 || p.value === 11);
    }

    return this.papeis;
  }

  verDados(item: any): void {
    this.router.navigate(
      ['/cadastro-publico', item.token],
      { queryParams: { modo: 'visualizar' } }
    );
  }

  getLabelAcao(item: any): string {
    return item.usadoEm ? 'Ver dados' : 'Copiar link';
  }

  onAcao(item: any): void {
    if (item.usadoEm) {
      this.verDados(item);
      return;
    }

    this.copiar(item.url);
  }

}