import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ChipComponent } from '../../../shared/components/chips/chip';
import { MaterialModule } from '../../../shared/material.module';
import { ContratosService } from '../../../core/services/contratos.service';
import {
  ContratoResponse,
  StatusContrato,
  TipoContrato
} from '../../../models/contrato.models';

import { MatTable, MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-contratos-lista',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MaterialModule,
    ReactiveFormsModule,
    ChipComponent
  ],
  templateUrl: './contratos-list.html',
  styleUrls: ['./contratos-list.scss'],
})
export class ContratosListaComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);

  @ViewChild(MatTable) table?: MatTable<ContratoResponse>;

  displayedColumns = [
    'numero',
    'imovel',
    'tipoImovel',
    'tipo',
    'status',
    'vigencia',
    'partes',
    'acoes'
  ];

  dataSource = new MatTableDataSource<ContratoResponse>([]);
  carregando = false;

  readonly StatusContrato = StatusContrato;
  readonly TipoContrato = TipoContrato;

  // 🔥 FILTROS
  filtroForm = this.fb.group({
    contrato: [''],
    imovel: [''],
    documentoParte: [''],
    vigenciaDe: [''],
    vigenciaAte: [''],
    status: [null as number | null],
    tipo: [null as number | null]
  });

  constructor(
    private contratosService: ContratosService,
    private snack: MatSnackBar,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando = true;

    const f = this.filtroForm.getRawValue();

    this.contratosService.listar({
      page: 1,
      pageSize: 200,

      contrato: f.contrato?.trim() || undefined,
      imovel: f.imovel?.trim() || undefined,
      documentoParte: f.documentoParte?.trim() || undefined,
      vigenciaDe: f.vigenciaDe || undefined,
      vigenciaAte: f.vigenciaAte || undefined,
      status: f.status ?? undefined,
      tipo: f.tipo ?? undefined
    })
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.carregando = false))
      )
      .subscribe({
        next: (res) => {
          this.dataSource.data = res?.items ?? [];
          console.log(this.dataSource.data);
          // 🔥 resolve bug de render
          queueMicrotask(() => this.table?.renderRows());
        },
        error: (err) => {
          this.snack.open(
            err?.error?.error ?? 'Erro ao listar contratos',
            'Fechar',
            { duration: 4000 }
          );
        }
      });
  }

  aplicarFiltro(): void {
    this.carregar();
  }

  limparFiltro(): void {
    this.filtroForm.reset({
      contrato: '',
      imovel: '',
      documentoParte: '',
      vigenciaDe: '',
      vigenciaAte: '',
      status: null,
      tipo: null
    });

    this.carregar();
  }

  tipoLabel(tipo: number): string {
    return TipoContrato[tipo] ?? `Tipo ${tipo}`;
  }

  statusLabel(status: number): string {
    return StatusContrato[status] ?? `Status ${status}`;
  }

  ativar(c: ContratoResponse): void {
    this.contratosService.ativar(c.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snack.open('Contrato ativado!', 'Fechar', { duration: 2500 });
          this.carregar();
        },
        error: (err) =>
          this.snack.open(
            err?.error?.error ?? 'Erro ao ativar',
            'Fechar',
            { duration: 4000 }
          )
      });
  }

  editar(c: ContratoResponse): void {
    this.router.navigate(['/contratos/editar', c.id]);
  }

  novo(): void {
    this.router.navigate(['/contratos/novo']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}