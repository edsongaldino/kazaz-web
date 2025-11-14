import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { ImoveisService } from '../../../core/services/imoveis.service';
import { ImovelDto } from '../../../models/imovel.model';
import { firstValueFrom } from 'rxjs'; // 👈 IMPORTANTE
import { MatPaginator } from '@angular/material/paginator';
import { MaterialModule } from '../../../shared/material.module';
import { MatSort } from '@angular/material/sort';

@Component({
  selector: 'app-imoveis-list',
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterModule],
  templateUrl: './imoveis-list.html',
  styleUrls: ['./imoveis-list.scss'],
})
export class ImoveisListComponent implements OnInit {
  private service = inject(ImoveisService);

  displayedColumns = ['codigo', 'enderecoId', 'acoes'];
  dataSource = new MatTableDataSource<ImovelDto>([]);
  carregando = true;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  async ngOnInit() {
    const resp = await firstValueFrom(this.service.listar());
    this.dataSource.data = resp.items ?? [];
    this.carregando = false;
    queueMicrotask(() => { // garante que a view já tem os elementos
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
    });
  }

  async excluir(id: string) {
    if (!confirm('Confirma a exclusão?')) return;
    await firstValueFrom(this.service.excluir(id));
    this.dataSource.data = this.dataSource.data.filter(x => x.id !== id);
  }
}
