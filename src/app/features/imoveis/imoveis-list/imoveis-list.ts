import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MaterialModule } from '../../../shared/material.module';
import { ImoveisService } from '../../../core/services/imoveis.service';
import { ImovelListDto } from '../../../models/imovel.model';
import { StatusImovel } from '../../../models/enums.model';
import { getFinalidadeImovelLabel } from '../../../shared/helpers/finalidade-imovel.helper';
import { getStatusImovelUi, StatusUi } from '../../../shared/helpers/status-imovel.helper';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

// ✅ ajuste se quiser colocar em arquivo separado
export interface ImovelFiltro {
  codigo?: string | null;
  tipoImovelId?: string | null;
  finalidade?: number | null;
  cidadeId?: string | null;
  status?: number | null;
  page?: number;
  pageSize?: number;
}

@Component({
  selector: 'app-imoveis-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterModule, ReactiveFormsModule],
  templateUrl: './imoveis-list.html',
  styleUrls: ['./imoveis-list.scss'],
})
export class ImoveisListComponent implements OnInit {
  private service = inject(ImoveisService);
  private fb = inject(FormBuilder);

  getFinalidadeLabel = getFinalidadeImovelLabel;
  getStatusUi = getStatusImovelUi;

  displayedColumns = ['status', 'codigo', 'titulo', 'finalidade', 'nomeTipo', 'acoes'];
  dataSource = new MatTableDataSource<ImovelListDto>([]);
  carregando = true;

  total = 0;

  // 🔽 aqui você vai popular com sua API/catalogo
  tipos: Array<{ id: string; nome: string }> = [];
  cidades: Array<{ id: string; nome: string }> = [];

  filtroForm = this.fb.group({
    codigo: [''],
    tipoImovelId: [null as string | null],
    finalidade: [null as number | null],
    cidadeId: [null as string | null],
    status: [null as number | null],
  });

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // ✅ Mapa status -> UI (ícone/cor/texto)
  private statusUiMap: Record<number, StatusUi> = {
    [StatusImovel.Ativo]: { icon: 'check_circle', color: '#2e7d32', label: 'Ativo' },
    [StatusImovel.Inativo]: { icon: 'cancel', color: '#616161', label: 'Inativo' },
    [StatusImovel.EmNegociacao]: { icon: 'hourglass_top', color: '#ef6c00', label: 'Em negociação' },
    [StatusImovel.Vendido]: { icon: 'paid', color: '#c62828', label: 'Vendido' },
    [StatusImovel.Alugado]: { icon: 'home_work', color: '#1565c0', label: 'Alugado' },
  };

  async ngOnInit() {
    // ✅ se você tiver chamadas para carregar combos, chame aqui
    // await this.carregarCombos();

    // ⚠️ NÃO use paginator/sort do MatTableDataSource pra paginar server-side.
    // A paginação será disparada via evento do paginator (no HTML).

    await this.carregar(); // primeira carga
  }

  private montarFiltro(): ImovelFiltro {
    const v = this.filtroForm.getRawValue();

    return {
      codigo: (v.codigo ?? '').trim() || null,
      tipoImovelId: v.tipoImovelId,
      finalidade: v.finalidade,
      cidadeId: v.cidadeId,
      status: v.status,
      page: (this.paginator?.pageIndex ?? 0) + 1,
      pageSize: this.paginator?.pageSize ?? 10,
    };
  }

  async carregar() {
    this.carregando = true;

    const filtro = this.montarFiltro();
    const resp = await firstValueFrom(this.service.listar(filtro));

    this.dataSource.data = resp.items ?? [];
    this.total = resp.total ?? (resp.items?.length ?? 0);

    this.carregando = false;

    // sort pode continuar client-side (opcional).
    // paginator NÃO (porque é server-side). Mas o MatTable ainda usa o paginator pra UI.
    queueMicrotask(() => {
      this.dataSource.sort = this.sort;
    });
  }

  aplicarFiltro() {
    if (this.paginator) this.paginator.pageIndex = 0;
    this.carregar();
  }

  limparFiltro() {
    this.filtroForm.reset({
      codigo: '',
      tipoImovelId: null,
      finalidade: null,
      cidadeId: null,
      status: null,
    });

    if (this.paginator) this.paginator.pageIndex = 0;
    this.carregar();
  }

  onPage() {
    this.carregar();
  }

  async excluir(id: string) {
    if (!confirm('Confirma a exclusão?')) return;
    await firstValueFrom(this.service.excluir(id));

    // recarrega pra manter total/paginação consistente
    await this.carregar();
  }
}
