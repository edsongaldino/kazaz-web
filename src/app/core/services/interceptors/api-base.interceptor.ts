import { HttpInterceptorFn } from '@angular/common/http';
import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformServer } from '@angular/common';

// Em DEV:
// - Browser usa PROXY: base = /api
// - SSR chama API direto: base = https://localhost:7035/api
const BROWSER_BASE = '/api';
const SERVER_BASE  = 'https://localhost:7035/api';

export const apiBaseInterceptor: HttpInterceptorFn = (req, next) => {
  const platformId = inject(PLATFORM_ID);
  const isServer = isPlatformServer(platformId);

  // só prefixa URLs relativas (começando com '/')
  if (req.url.startsWith('/')) {
    const base = isServer ? SERVER_BASE : BROWSER_BASE;
    const url = base.replace(/\/+$/, '') + req.url;
    return next(req.clone({ url }));
  }
  return next(req);
};
