import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import { Home } from './features/home/home';

export const appRoutes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login').then(m => m.Login),
  },
  {
    path: '',
    loadComponent: () => import('./features/layout/layout').then(m => m.Layout),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'pessoas',
        children: [
          {
            path: '',
            loadComponent: () => import('./features/pessoas/pessoas-list/pessoas-list.component')
              .then(m => m.PessoasListComponent)
          },
          {
            path: 'novo',
            loadComponent: () => import('./features/pessoas/pessoa-form/pessoa-form.component')
              .then(m => m.PessoaFormComponent)
          },
          {
            path: 'editar/:id',
            loadComponent: () => import('./features/pessoas/pessoa-form/pessoa-form.component')
              .then(m => m.PessoaFormComponent)
          }
        ]
      },
    ]
  },
  { path: '**', redirectTo: '' }
];

