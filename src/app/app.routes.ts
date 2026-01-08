import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import { Home } from './features/home/home';
import { UsuariosListaComponent } from './features/usuarios/lista/lista';
import { ContratosListaComponent } from './features/contratos/contratos-list/contratos-list';
import { ContratoFormComponent } from './features/contratos/contrato-form/contrato-form';

export const appRoutes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login').then(m => m.Login) },

  // 🌐 Público (sem menu)
  {
    path: 'cadastro-publico/:token',
    loadComponent: () => import('./features/layout/public/public-layout').then(m => m.PublicLayout),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/cadastro-publico/dados/dados')
            .then(m => m.CadastroDadosComponent),
      },
      {
        path: 'documentos',
        loadComponent: () =>
          import('./features/cadastro-publico/documentos/documentos')
            .then(m => m.CadastroDocumentosComponent),
      },
    ],
  },

  {
    path: '',
    loadComponent: () => import('./features/layout/admin/admin-layout').then(m => m.AdminLayout),
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

      //Usuário
      { path: 'admin/usuarios', component: UsuariosListaComponent },

      // opcional: redirect
      { path: 'usuarios', redirectTo: 'admin/usuarios', pathMatch: 'full' },

      // Contratos
      { path: 'contratos', component: ContratosListaComponent },
      { path: 'contratos/novo', component: ContratoFormComponent },
      { path: 'contratos/editar/:id', component: ContratoFormComponent },
    ]
  },

  { path: '**', redirectTo: 'dashboard' } // ✅ wildcard explícito
];

