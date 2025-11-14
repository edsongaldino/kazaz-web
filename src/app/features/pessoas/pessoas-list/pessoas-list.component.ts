import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { merge, Subject } from 'rxjs';
import { PessoasService } from '../../../core/services/pessoas.service';
import { PessoasPageResponse, PessoaListItem } from '../../../models/pessoa.model';

function onlyDigits(v: string) { return v.replace(/\D/g, ''); }
function formatCpf(cpf?: string | null) {
  if (!cpf) return '';
  const d = onlyDigits(cpf).padStart(11, '0');
  return d.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
}

@Component({
  selector: 'app-pessoas-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './pessoas-list.component.html',
  styleUrls: ['./pessoas-list.component.scss']
})
export class PessoasListComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(PessoasService);

  displayedColumns = ['nome', 'documento', 'tipo', 'actions'];

  // filtros (ambos convergem para `termo`)
  form = this.fb.group({
    nome: [''],
    cpf: [''],
  });

  // paginação
  pageIndex = signal(0); // UI 0-based
  pageSize  = signal(10);

  // estados/dados
  loading = signal(false);
  errorMsg = signal<string | null>(null);
  total = signal(0);
  items = signal<PessoaListItem[]>([]);

  private page$ = new Subject<PageEvent>();

  // helpers
  protected formatCpf = formatCpf;

  constructor() {
    // estado inicial via query params
    this.route.queryParamMap.pipe(
      map(q => ({
        page: +(q.get('page') ?? '1'),
        pageSize: +(q.get('pageSize') ?? '10'),
        termo: q.get('termo') ?? '',
      })),
      tap(q => {
        // distribui `termo` nos campos (heurística simples)
        const maybeCpf = q.termo?.match(/\d{9,11}/)?.[0] ?? '';
        const maybeNome = q.termo?.replace(maybeCpf, '').trim() ?? '';

        this.form.patchValue({ nome: maybeNome, cpf: maybeCpf }, { emitEvent: false });
        this.pageIndex.set(Math.max(0, (q.page || 1) - 1));
        this.pageSize.set(q.pageSize || 10);
      }),
      switchMap(() => this.load())
    ).subscribe();

    // filtros com debounce
    const formChanges$ = this.form.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      tap(() => this.pageIndex.set(0)),
      switchMap(() => this.updateUrlAndLoad())
    );

    // paginação
    const pageChanges$ = this.page$.pipe(
      tap(e => { this.pageIndex.set(e.pageIndex); this.pageSize.set(e.pageSize); }),
      switchMap(() => this.updateUrlAndLoad())
    );

    merge(formChanges$, pageChanges$).subscribe();
  }

  onPage(e: PageEvent) { this.page$.next(e); }

  clearFilters() {
    this.form.reset({ nome: '', cpf: '' });
  }

  private buildTermo(): string | null {
    const v = this.form.getRawValue();
    const nome = (v.nome || '').trim();
    const cpf = onlyDigits(v.cpf || '');
    // Estratégia: prioriza CPF se informado; senão usa nome; se ambos, concatena (o backend fará contains geral).
    if (cpf && nome) return `${nome} ${cpf}`;
    if (cpf) return cpf;
    if (nome) return nome;
    return null;
  }

  private updateUrlAndLoad() {
    const page = this.pageIndex() + 1;
    const pageSize = this.pageSize();
    const termo = this.buildTermo() || undefined;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page, pageSize, termo },
      queryParamsHandling: '',
    });

    return this.load();
  }

  private load() {
    this.loading.set(true);
    this.errorMsg.set(null);

    return this.service.listar({
      page: this.pageIndex() + 1,
      pageSize: this.pageSize(),
      termo: this.buildTermo(),
    }).pipe(
      tap({
        next: (res: PessoasPageResponse) => {
          console.log(res.items);
          this.items.set(res.items ?? []);
          this.total.set(res.total ?? 0);
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.items.set([]);
          this.total.set(0);
          this.loading.set(false);
          this.errorMsg.set('Falha ao carregar pessoas.');
        }
      })
    );
  }
}
