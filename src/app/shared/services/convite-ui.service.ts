import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class ConviteUiService {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);

  copiarLink(url?: string | null): void {
    if (!url) return;

    navigator.clipboard.writeText(url);
    this.snackBar.open('Link copiado.', 'Fechar', { duration: 2000 });
  }

  abrirLink(link?: string | null): void {
    if (!link) return;

    window.open(link, '_blank');
  }

  verDados(token: string): void {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(
        ['/cadastro-publico', token],
        { queryParams: { modo: 'visualizar' } }
      )
    );

    window.open(url, '_blank');
  }

}