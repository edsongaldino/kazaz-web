import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PageEvent } from '@angular/material/paginator';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { UsuariosService } from '../../../core/services/usuarios.service';
import { UsuarioListDto, UsuariosQuery } from '../../../models/usuario.models';
import { UsuarioDialogComponent } from '../dialog/usuario-dialog';
import { MaterialModule } from '../../../shared/material.module';
import { NotificationService } from '../../../core/services/notification.service';
import { ChipComponent } from '../../../shared/components/chips/chip';

@Component({
  selector: 'app-usuarios-lista',
  imports: [MaterialModule, ReactiveFormsModule, CommonModule, ChipComponent],
  templateUrl: './lista.html',
  styleUrls: ['./lista.scss'],
})
export class UsuariosListaComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.group({
    termo: [''],
    perfilId: [null as string | null],
    ativo: [null as boolean | null]
  });

  displayedColumns: string[] = ['nome', 'email', 'perfil', 'ativo', 'acoes'];

  items: UsuarioListDto[] = [];
  total = 0;

  pageIndex = 0;
  pageSize = 10;

  loading = false;

  constructor(
    private usuarios: UsuariosService,
    private dialog: MatDialog,
    private snack: MatSnackBar,
    private notify: NotificationService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.form.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.carregar();
      });

    setTimeout(() => this.carregar(), 0);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  filtrar(): void {
    this.pageIndex = 0;
    this.carregar();
  }

  clearFilters(): void {
    this.form.reset({
      termo: '',
      perfilId: null,
      ativo: null,
    });

    this.pageIndex = 0;
    this.carregar();
  }

  carregar(): void {
    this.loading = true;

    const filtro: UsuariosQuery = {
      page: this.pageIndex + 1,
      pageSize: this.pageSize,
      termo: this.normalizarTexto(this.form.value.termo),
      perfilId: this.form.value.perfilId,
      ativo: this.form.value.ativo,
    };

    this.usuarios
      .listar(filtro)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          setTimeout(() => {
            this.items = [...(res.items ?? [])];
            this.total = res.total ?? 0;
            this.loading = false;

            this.cdr.detectChanges();
          }, 0);
        },
        error: () => {
          setTimeout(() => {
            this.items = [];
            this.total = 0;
            this.loading = false;

            this.cdr.detectChanges();

            this.snack.open('Erro ao carregar usuários', 'Fechar', { duration: 3500 });
          }, 0);
        },
      });
  }

  onPage(e: PageEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.carregar();
  }

  novo(): void {
    const ref = this.dialog.open(UsuarioDialogComponent, {
      width: '520px',
      data: { mode: 'create' as const },
    });

    ref.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((ok: boolean) => {
        if (ok) {
          this.notify.successCenter('Usuário criado com sucesso!');
          this.carregar();
        }
      });
  }

  editar(u: UsuarioListDto): void {
    const ref = this.dialog.open(UsuarioDialogComponent, {
      width: '520px',
      data: { mode: 'edit' as const, usuario: u },
    });

    ref.afterClosed()
      .pipe(takeUntil(this.destroy$))
      .subscribe((ok: boolean) => {
        if (ok) {
          this.notify.successCenter('Usuário atualizado com sucesso!');
          this.carregar();
        }
      });
  }

  ativar(u: UsuarioListDto): void {
    this.usuarios.ativar(u.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snack.open('Usuário ativado', 'Fechar', { duration: 2500 });
          this.carregar();
        },
        error: () => this.snack.open('Falha ao ativar', 'Fechar', { duration: 3500 }),
      });
  }

  desativar(u: UsuarioListDto): void {
    this.usuarios.desativar(u.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snack.open('Usuário desativado', 'Fechar', { duration: 2500 });
          this.carregar();
        },
        error: () => this.snack.open('Falha ao desativar', 'Fechar', { duration: 3500 }),
      });
  }

  async excluir(usuarioId: string): Promise<void> {
    const confirmar = await this.notify.confirm(
      'Excluir usuário',
      'Tem certeza que deseja excluir este usuário? Essa ação não poderá ser desfeita.',
      'Sim, excluir',
      'Cancelar'
    );

    if (!confirmar) return;

    try {
      await this.usuarios.remover(usuarioId).toPromise();

      this.notify.toastSuccess('Usuário excluído com sucesso!');
      this.carregar();
    } catch (err) {
      this.notify.handleHttpError(err, 'Não foi possível excluir o usuário.');
    }
  }

  private normalizarTexto(value?: string | null): string | null {
    const texto = value?.trim();
    return texto ? texto : null;
  }
}