import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

// Em DEV:
// - Browser usa PROXY: base = /api
// - SSR chama API direto: base = https://localhost:7035/api
const BROWSER_BASE = '/api';
const SERVER_BASE = '/api';

export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const isServer = isPlatformServer(platformId);

  let clonedReq = req;

  // Adiciona o token de autenticação se estiver no browser e o token existir
  if (!isServer) {
    const token = localStorage.getItem('authToken');
    if (token) {
      clonedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }
  }

  // só prefixa URLs relativas (começando com '/')
  if (clonedReq.url.startsWith('/')) {
    const base = isServer ? SERVER_BASE : BROWSER_BASE;
    const url = base.replace(/\/+$/, '') + clonedReq.url;
    return next(clonedReq.clone({ url }));
  }
  return next(clonedReq);
};
