import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints, LayoutModule } from '@angular/cdk/layout';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Auth } from '../../../core/services/auth';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet, RouterLink, RouterLinkActive,
    LayoutModule,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatListModule, MatButtonModule, MatTooltipModule
  ],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.scss'],
})
export class AdminLayout implements OnInit {
  private bpo = inject(BreakpointObserver);
  private router = inject(Router);

  usuarioLogado: any = null;

  // estado
  isHandset = signal(false);      // < 600px
  sidenavOpened = signal(true);   // aberto por padrão em desktop
  collapsed = signal(false);      // colapsado (ícones-only) em desktop

  mode = computed(() => (this.isHandset() ? 'over' : 'side'));

  constructor(private auth: Auth) {
    // observa breakpoint
    this.bpo.observe([Breakpoints.Handset]).subscribe(state => {
      this.isHandset.set(state.matches);
      if (state.matches) {
        this.sidenavOpened.set(false);
        this.collapsed.set(false);
      } else {
        this.sidenavOpened.set(true);
      }
    });

    // fecha o sidenav em mobile quando navega
    effect(() => {
      const sub = this.router.events.subscribe(() => {
        if (this.isHandset()) this.sidenavOpened.set(false);
      });
      return () => sub.unsubscribe();
    });
  }

  ngOnInit(): void {
    this.getUsuarioFromToken();
  }

  toggleSidenav() {
    if (this.isHandset()) {
      // em mobile pode abrir/fechar
      this.sidenavOpened.update(v => !v);
    } else {
      // em desktop não fecha, só alterna colapso
      this.toggleCollapse();
    }
  }

  toggleCollapse() {
    if (!this.isHandset()) this.collapsed.update(v => !v);
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  private getUsuarioFromToken() {
  const usuario = this.auth.getUsuario();

  if (usuario) {
    this.usuarioLogado = {
      nome: usuario.nome || 'Usuário',
      perfilNome: usuario.perfilNome || usuario.perfil || 'Administrador'
    };

    return;
  }

  const token = this.auth.getToken();
    if (!token) return;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));

      this.usuarioLogado = {
        nome:
          payload.name ||
          payload.unique_name ||
          payload.nome ||
          payload.email ||
          'Usuário',
        perfilNome:
          payload.role ||
          payload.perfilNome ||
          payload.perfil ||
          'Administrador'
      };
    } catch {
      this.usuarioLogado = {
        nome: 'Usuário',
        perfilNome: 'Administrador'
      };
    }
  }
}
