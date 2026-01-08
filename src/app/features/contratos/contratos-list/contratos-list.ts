import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, RouterModule } from '@angular/router';

import { MaterialModule } from '../../../shared/material.module';
import { ContratosService } from '../../../core/services/contratos.service';
import { ContratoResponse, StatusContrato, TipoContrato } from '../../../models/contrato.models';

import { MatTable, MatTableDataSource } from '@angular/material/table';

@Component({
  selector: 'app-contratos-lista',
  standalone: true,
  imports: [CommonModule, RouterModule, MaterialModule],
  templateUrl: './contratos-list.html',
  styleUrls: ['./contratos-list.scss'],
})
export class ContratosListaComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @ViewChild(MatTable) table?: MatTable<ContratoResponse>;

  displayedColumns = ['numero', 'tipo', 'status', 'vigencia', 'partes', 'acoes'];

  dataSource = new MatTableDataSource<ContratoResponse>([]);
  carregando = false;

  readonly StatusContrato = StatusContrato;
  readonly TipoContrato = TipoContrato;

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

    this.contratosService.listar()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.carregando = false))
      )
      .subscribe({
        next: (res) => {
          this.dataSource.data = res ?? [];

          // força a tabela a re-renderizar (resolve o “só aparece no F5”)
          queueMicrotask(() => this.table?.renderRows());
        },
        error: (err) => {
          this.snack.open(err?.error?.error ?? 'Erro ao listar contratos', 'Fechar', { duration: 4000 });
        }
      });
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
        error: (err) => this.snack.open(err?.error?.error ?? 'Erro ao ativar', 'Fechar', { duration: 4000 })
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
