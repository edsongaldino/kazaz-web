import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { UsuariosService } from '../../../core/services/usuarios.service';
import { UsuarioListDto } from '../../../models/usuario.models';
import { UsuarioDialogComponent } from '../dialog/usuario-dialog';
import { MaterialModule } from '../../../shared/material.module';
import { CommonModule } from '@angular/common';
import { ChangeDetectorRef } from '@angular/core';


@Component({
  selector: 'app-usuarios-lista',
  imports: [MaterialModule, ReactiveFormsModule, CommonModule],
  templateUrl: './lista.html',
  styleUrls: ['./lista.scss'],
})
export class UsuariosListaComponent implements OnInit, OnDestroy {

  private destroy$ = new Subject<void>();

  termoCtrl = new FormControl<string>('', { nonNullable: true });

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
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.termoCtrl.valueChanges
      .pipe(debounceTime(350), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.pageIndex = 0;
        this.carregar();
      });

    this.carregar();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  carregar(): void {
    this.loading = true;
    const page = this.pageIndex + 1;

    this.usuarios.listar(page, this.pageSize, this.termoCtrl.value)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res: any) => {
          const lista =
            Array.isArray(res) ? res :
            Array.isArray(res?.items) ? res.items :
            Array.isArray(res?.data) ? res.data :
            [];

          queueMicrotask(() => {
            this.items = lista;
            this.total = (res?.total ?? lista.length);
            this.loading = false;
            this.cdr.detectChanges();
          });
        },
        error: () => {
          this.loading = false;
          this.snack.open('Erro ao carregar usuários', 'Fechar', { duration: 3500 });
        }
      });
  }

  onPage(e: any) {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
    this.carregar();
  }

  novo(): void {
    const ref = this.dialog.open(UsuarioDialogComponent, {
      width: '520px',
      data: { mode: 'create' as const }
    });

    ref.afterClosed().subscribe((ok: boolean) => {
      if (ok) this.carregar();
    });
  }

  editar(u: UsuarioListDto): void {
    const ref = this.dialog.open(UsuarioDialogComponent, {
      width: '520px',
      data: { mode: 'edit' as const, usuario: u }
    });

    ref.afterClosed().subscribe((ok: boolean) => {
      if (ok) this.carregar();
    });
  }

  ativar(u: UsuarioListDto): void {
    this.usuarios.ativar(u.id).subscribe({
      next: () => { this.snack.open('Usuário ativado', 'Fechar', { duration: 2500 }); this.carregar(); },
      error: () => this.snack.open('Falha ao ativar', 'Fechar', { duration: 3500 })
    });
  }

  desativar(u: UsuarioListDto): void {
    this.usuarios.desativar(u.id).subscribe({
      next: () => { this.snack.open('Usuário desativado', 'Fechar', { duration: 2500 }); this.carregar(); },
      error: () => this.snack.open('Falha ao desativar', 'Fechar', { duration: 3500 })
    });
  }

  excluir(_t87: any) {
    throw new Error('Method not implemented.');
  }

}