import { Routes } from '@angular/router';
import { Login } from './features/login/login';
import { Home } from './features/home/home';
import { UsuariosListaComponent } from './features/usuarios/lista/lista';
import { ContratosListaComponent } from './features/contratos/contratos-list/contratos-list';
import { ContratoFormComponent } from './features/contratos/contrato-form/contrato-form';
import { ContratoImprimirComponent } from './features/contratos/contrato-imprimir/contrato-imprimir';
import { authGuard, authChildGuard } from './core/guards/auth.guard';
import { cadastroPublicoGuard } from './core/guards/cadastro-publico.guard';

export const appRoutes: Routes = [

  // 👇 ROTA RAIZ
  { path: '', pathMatch: 'full', redirectTo: 'login' },

  { path: 'login', loadComponent: () => import('./features/login/login').then(m => m.Login) },

  // 🌐 Público
  {
    path: 'cadastro-publico/:token',
    loadComponent: () => import('./features/layout/public/public-layout').then(m => m.PublicLayout),
    canActivate: [cadastroPublicoGuard],
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
      {
        path: 'acompanhamento',
        loadComponent: () =>
          import('./features/cadastro-publico/acompanhamento/acompanhamento')
            .then(m => m.CadastroAcompanhamentoComponent),
      },
      {
        path: 'pessoas/editar/:id',
        loadComponent: () =>
          import('./features/cadastro-publico/dados/dados').then(m => m.CadastroDadosComponent),
        data: { mode: 'admin-edit' },
      }
    ],
  },

  // 🔒 PROTEGIDO
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    loadComponent: () => import('./features/layout/admin/admin-layout').then(m => m.AdminLayout),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard) },

      { path: 'leads', loadComponent: () => import('./features/leads/leads-list/leads-list').then(m => m.LeadsListComponent) },
      { path: 'leads/novo', loadComponent: () => import('./features/leads/lead-form/lead-form').then(m => m.LeadFormComponent) },
      { path: 'leads/editar/:id', loadComponent: () => import('./features/leads/lead-form/lead-form').then(m => m.LeadFormComponent) },

      { path: 'pessoas', loadComponent: () => import('./features/pessoas/pessoas-list/pessoas-list.component').then(m => m.PessoasListComponent) },
      { path: 'pessoas/novo', loadComponent: () => import('./features/pessoas/pessoa-form/pessoa-form.component').then(m => m.PessoaFormComponent) },
      { path: 'pessoas/editar/:id', loadComponent: () => import('./features/pessoas/pessoa-form/pessoa-form.component').then(m => m.PessoaFormComponent) },

      { path: 'imoveis', loadComponent: () => import('./features/imoveis/imoveis-list/imoveis-list').then(m => m.ImoveisListComponent) },
      { path: 'imoveis/novo', loadComponent: () => import('./features/imoveis/imovel-form/imovel-form').then(m => m.ImovelFormComponent) },
      { path: 'imoveis/editar/:id', loadComponent: () => import('./features/imoveis/imovel-form/imovel-form').then(m => m.ImovelFormComponent) },

      { path: 'admin/usuarios', component: UsuariosListaComponent },
      { path: 'usuarios', redirectTo: 'admin/usuarios', pathMatch: 'full' },

      { path: 'contratos', component: ContratosListaComponent },
      { path: 'contratos/novo', component: ContratoFormComponent },
      { path: 'contratos/editar/:id', component: ContratoFormComponent },

      {
        path: 'convites',
        loadComponent: () =>
          import('./features/convites/convites-list/convites-list')
            .then(m => m.ConvitesList),
      },
      {
        path: 'configuracoes/documentos',
        loadComponent: () =>
          import('./features/configuracoes/documentos/documentos')
            .then(m => m.RegrasDocumentosComponent),
      },
      {
        path: 'configuracoes/checklist',
        loadComponent: () =>
          import('./features/configuracoes/checklist/checklist')
            .then(m => m.RegrasChecklistComponent),
      },
      { path: 'configuracoes', redirectTo: 'configuracoes/documentos', pathMatch: 'full' },
      {
        path: 'imobiliaria/dados',
        loadComponent: () =>
          import('./features/imobiliaria/dados-imobiliaria/dados-imobiliaria')
            .then(m => m.DadosImobiliariaComponent),
      },
      {
        path: 'imobiliaria/colaboradores',
        loadComponent: () =>
          import('./features/imobiliaria/colaboradores/colaboradores')
            .then(m => m.ColaboradoresListComponent),
      },
      {
        path: 'imobiliaria/financeiro',
        loadComponent: () =>
          import('./features/imobiliaria/financeiro/financeiro')
            .then(m => m.FinanceiroComponent),
      },
      {
        path: 'imobiliaria/prestadores',
        loadComponent: () =>
          import('./features/imobiliaria/prestadores/prestadores')
            .then(m => m.PrestadoresListComponent),
      },
      {
        path: 'imobiliarias',
        loadComponent: () =>
          import('./features/imobiliarias/imobiliarias')
            .then(m => m.ImobiliariasComponent),
      },
    ]
  },

  { path: 'contratos/imprimir/:id', component: ContratoImprimirComponent, canActivate: [authGuard] },

  { path: '**', redirectTo: 'login' }
];
