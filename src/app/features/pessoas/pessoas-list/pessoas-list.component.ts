import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { PessoaListItem, PessoasFiltro } from '../../../models/pessoa.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { PessoasService } from '../../../core/services/pessoas.service';
import { ChipComponent } from '../../../shared/components/chips/chip';
import { DocumentoPipe } from '../../../shared/pipes/documento-pipe';

@Component({
  selector: 'app-clientes-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,

    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    DocumentoPipe,
    ChipComponent
  ],
  templateUrl: './pessoas-list.component.html',
  styleUrl: './pessoas-list.component.scss'
})
export class PessoasListComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly pessoasService = inject(PessoasService);

  readonly displayedColumns: string[] = [
    'nome',
    'documento',
    'tipo',
    'quantidadeContratos',
    'papeis',
    'actions'
  ];

  readonly form = this.fb.group({
    nome: [''],
    documento: [''],
    tipo: [''],
    papel: [null as number | null]
  });

  readonly items = signal<PessoaListItem[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  ngOnInit(): void {
    this.carregar();

    this.form.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.pageIndex.set(0);
        this.carregar();
      });
  }

  filtrar(): void {
    this.pageIndex.set(0);
    this.carregar();
  }

  clearFilters(): void {
    this.form.reset({
      nome: '',
      documento: '',
      tipo: '',
      papel: null
    });

    this.pageIndex.set(0);
    this.carregar();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.carregar();
  }

  carregar(): void {
    const filtro: PessoasFiltro = {
      page: this.pageIndex() + 1,
      pageSize: this.pageSize(),
      nome: this.normalizarTexto(this.form.value.nome),
      documento: this.somenteNumeros(this.form.value.documento),
      tipo: this.normalizarTexto(this.form.value.tipo),
      papel: this.form.value.papel
    };

    console.log(filtro);

    this.loading.set(true);
    this.errorMsg.set(null);

    this.pessoasService.listar(filtro).subscribe({
      next: (res) => {
        this.items.set(res.items ?? []);
        this.total.set(res.total ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.total.set(0);
        this.loading.set(false);
        this.errorMsg.set('Não foi possível carregar os clientes.');
      }
    });
  }

  private normalizarTexto(value?: string | null): string | null {
    const texto = value?.trim();
    return texto ? texto : null;
  }

  private somenteNumeros(value?: string | null): string | null {
    const digits = (value ?? '').replace(/\D/g, '');
    return digits ? digits : null;
  }
}