import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { CadastroPublicoService } from '../services/cadastro-publico.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const cadastroPublicoGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
) => {
  const service = inject(CadastroPublicoService);
  const router = inject(Router);

  // find token in route params
  let token = route.paramMap.get('token');
  let parent = route.parent;
  while (!token && parent) {
    token = parent.paramMap.get('token');
    parent = parent.parent;
  }

  if (!token) {
    return router.createUrlTree(['/login']);
  }

  return service.status(token).pipe(
    map(st => {
      // 2 = Preenchido, 3 = EmAnalise, 4 = Aprovado, 5 = Reprovado
      const statusFinalizado = [2, 3, 4, 5].includes(st.status);
      const isAcompanhamento = state.url.endsWith('/acompanhamento');

      if (statusFinalizado && !isAcompanhamento) {
        return router.createUrlTree(['/cadastro-publico', token, 'acompanhamento']);
      }

      if (!statusFinalizado && isAcompanhamento) {
        return router.createUrlTree(['/cadastro-publico', token]);
      }

      return true;
    }),
    catchError(() => {
      return of(router.createUrlTree(['/login']));
    })
  );
};
