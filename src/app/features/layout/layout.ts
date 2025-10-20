import { Component, computed, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints, LayoutModule } from '@angular/cdk/layout';

import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet, RouterLink, RouterLinkActive,
    LayoutModule,
    MatSidenavModule, MatToolbarModule, MatIconModule, MatListModule, MatButtonModule
  ],
  templateUrl: './layout.html',
  styleUrls: ['./layout.scss'],
})
export class Layout {
  private bpo = inject(BreakpointObserver);
  private router = inject(Router);

  // estado
  isHandset = signal(false);      // < 600px
  sidenavOpened = signal(true);   // aberto por padrão em desktop
  collapsed = signal(false);      // colapsado (ícones-only) em desktop

  mode = computed(() => (this.isHandset() ? 'over' : 'side'));

  constructor() {
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
}
