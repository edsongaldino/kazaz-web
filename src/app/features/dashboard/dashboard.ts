import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { MaterialModule } from '../../shared/material.module';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardResumo } from '../../models/dashboard.model';

type GraficoItem = {
  label: string;
  quantidade: number;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MaterialModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss']
})
export class Dashboard implements OnInit {
  loading = false;

  resumo: DashboardResumo = {
    totalImoveis: 0,
    totalClientes: 0,
    totalContratos: 0,
    totalConvites: 0,

    imoveisAtivos: 0,
    imoveisEmNegociacao: 0,
    imoveisVendidos: 0,
    imoveisAlugados: 0,

    imoveisPorTipo: [],
    imoveisPorFinalidade: [],
    convitesPorStatus: []
  };

  imoveisPorTipo: GraficoItem[] = [];
  imoveisPorFinalidade: GraficoItem[] = [];
  convitesPorStatus: GraficoItem[] = [];

  constructor(
    private dashboardService: DashboardService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.carregarResumo();
  }

  carregarResumo(): void {
    this.loading = true;

    this.dashboardService.obterResumo()
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          this.resumo = res;

          this.imoveisPorTipo = res.imoveisPorTipo ?? [];
          this.imoveisPorFinalidade = res.imoveisPorFinalidade ?? [];
          this.convitesPorStatus = res.convitesPorStatus ?? [];
        },
        error: (err) => {
          console.error('Erro ao carregar dashboard', err);
        }
      });
  }

  get pieTipoBackground(): string {
    return this.buildPieBackground(this.imoveisPorTipo);
  }

  get pieFinalidadeBackground(): string {
    return this.buildPieBackground(this.imoveisPorFinalidade);
  }

  get pieConvitesBackground(): string {
    return this.buildPieBackground(this.convitesPorStatus);
  }

  private buildPieBackground(items: GraficoItem[]): string {
    const colors = ['#2563eb', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
    const total = items.reduce((acc, item) => acc + item.quantidade, 0);

    if (!total) {
      return '#e5e7eb';
    }

    let current = 0;

    const parts = items.map((item, index) => {
      const start = current;
      const value = (item.quantidade / total) * 100;
      current += value;

      return `${colors[index % colors.length]} ${start}% ${current}%`;
    });

    return `conic-gradient(${parts.join(', ')})`;
  }
}