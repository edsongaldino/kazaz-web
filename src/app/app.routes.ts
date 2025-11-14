import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import { Home } from './features/home/home';

export const appRoutes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login').then(m => m.Login) },

  {
    path: '',
    loadComponent: () => import('./features/layout/layout').then(m => m.Layout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },        // ✅ default
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard) },

      // Pessoas (irmãs, sem children/outlet interno)
      { path: 'pessoas', loadComponent: () => import('./features/pessoas/pessoas-list/pessoas-list.component').then(m => m.PessoasListComponent) },
      { path: 'pessoas/novo', loadComponent: () => import('./features/pessoas/pessoa-form/pessoa-form.component').then(m => m.PessoaFormComponent) },
      { path: 'pessoas/editar/:id', loadComponent: () => import('./features/pessoas/pessoa-form/pessoa-form.component').then(m => m.PessoaFormComponent) },

      // Imóveis
      { path: 'imoveis', loadComponent: () => import('./features/imoveis/imoveis-list/imoveis-list').then(m => m.ImoveisListComponent) },
      { path: 'imoveis/novo', loadComponent: () => import('./features/imoveis/imovel-form/imovel-form').then(m => m.ImovelFormComponent) },
      { path: 'imoveis/editar/:id', loadComponent: () => import('./features/imoveis/imovel-form/imovel-form').then(m => m.ImovelFormComponent) },

      // Contratos
      { path: 'contratos', loadComponent: () => import('./features/contratos/contratos-list/contratos-list').then(m => m.ContratosList) },
    ]
  },

  { path: '**', redirectTo: 'dashboard' } // ✅ wildcard explícito
];

