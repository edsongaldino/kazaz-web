import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource } from '@angular/material/table';
import { RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MaterialModule } from '../../../shared/material.module';
import { ImoveisService } from '../../../core/services/imoveis.service';
import { ImovelFiltro, ImovelListDto } from '../../../models/imovel.model';
import { StatusImovel } from '../../../models/enums.model';
import { getStatusImovelUi, StatusUi } from '../../../shared/helpers/status-imovel.helper';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../core/services/notification.service';
import { ConvitesImovelDialogComponent } from '../convites-imovel-dialog/convites-imovel-dialog';
import { ChipComponent } from '../../../shared/components/chips/chip';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-imoveis-list',
  standalone: true,
  imports: [
    CommonModule,
    MaterialModule,
    RouterModule,
    ReactiveFormsModule,
    ChipComponent,
    MatTooltipModule
  ],
  templateUrl: './imoveis-list.html',
  styleUrls: ['./imoveis-list.scss'],
})
export class ImoveisListComponent implements OnInit {
  private service = inject(ImoveisService);
  private fb = inject(FormBuilder);
  private notify = inject(NotificationService);

  constructor(private dialog: MatDialog) {}

  getStatusUi = getStatusImovelUi;

  displayedColumns = ['status', 'codigo', 'titulo', 'finalidade', 'nomeTipo', 'acoes'];

  dataSource = new MatTableDataSource<ImovelListDto>([]);
  carregando = true;
  total = 0;

  tipos: Array<{ id: string; nome: string }> = [];
  cidades: Array<{ id: string; nome: string }> = [];

  filtroForm = this.fb.group({
    termo: [''],
    documentoProprietario: [''],
    tipoImovelId: [null as string | null],
    finalidade: [null as number | null],
    cidadeId: [null as string | null],
    status: [null as number | null],
  });

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  private statusUiMap: Record<number, StatusUi> = {
    [StatusImovel.Ativo]: { icon: 'check_circle', color: '#2e7d32', label: 'Ativo' },
    [StatusImovel.Inativo]: { icon: 'cancel', color: '#616161', label: 'Inativo' },
    [StatusImovel.EmNegociacao]: { icon: 'hourglass_top', color: '#ef6c00', label: 'Em negociação' },
    [StatusImovel.Vendido]: { icon: 'paid', color: '#c62828', label: 'Vendido' },
    [StatusImovel.Alugado]: { icon: 'home_work', color: '#1565c0', label: 'Alugado' },
  };

  async ngOnInit(): Promise<void> {
    await this.carregar();
  }

  private montarFiltro(): ImovelFiltro {
    const v = this.filtroForm.getRawValue();

    return {
      page: (this.paginator?.pageIndex ?? 0) + 1,
      pageSize: this.paginator?.pageSize ?? 10,
      termo: (v.termo ?? '').trim() || undefined,
      documentoProprietario: (v.documentoProprietario ?? '').trim() || undefined,
      tipoImovelId: v.tipoImovelId ?? undefined,
      finalidade: v.finalidade ?? undefined,
      cidadeId: v.cidadeId ?? undefined,
      status: v.status ?? undefined
    };
  }

  async carregar(): Promise<void> {
    this.carregando = true;

    try {
      const filtro = this.montarFiltro();
      const resp = await firstValueFrom(this.service.listar(filtro));

      this.dataSource.data = resp.items ?? [];
      this.total = resp.total ?? (resp.items?.length ?? 0);

      queueMicrotask(() => {
        this.dataSource.sort = this.sort;
      });
    } catch (err) {
      this.notify.handleHttpError(err, 'Não foi possível carregar os imóveis.');
      this.dataSource.data = [];
      this.total = 0;
    } finally {
      this.carregando = false;
    }
  }

  aplicarFiltro(): void {
    if (this.paginator) this.paginator.pageIndex = 0;
    this.carregar();
  }

  limparFiltro(): void {
    this.filtroForm.reset({
      termo: '',
      documentoProprietario: '',
      tipoImovelId: null,
      finalidade: null,
      cidadeId: null,
      status: null,
    });

    if (this.paginator) this.paginator.pageIndex = 0;

    this.carregar();
  }

  onPage(): void {
    this.carregar();
  }

  async excluir(id: string): Promise<void> {
    const confirmar = await this.notify.confirm(
      'Excluir imóvel',
      'Tem certeza que deseja excluir este imóvel? Essa ação não poderá ser desfeita.',
      'Sim, excluir',
      'Cancelar'
    );

    if (!confirmar) return;

    try {
      await firstValueFrom(this.service.excluir(id));

      this.notify.toastSuccess('Imóvel excluído com sucesso!');
      await this.carregar();
    } catch (err) {
      this.notify.handleHttpError(err, 'Não foi possível excluir o imóvel.');
    }
  }

  abrirModalConvites(imovel: ImovelListDto): void {
    this.dialog.open(ConvitesImovelDialogComponent, {
      width: '1000px',
      maxWidth: '95vw',
      data: {
        imovelId: imovel.id,
        codigo: imovel.codigo,
        titulo: imovel.titulo
      }
    });
  }
}