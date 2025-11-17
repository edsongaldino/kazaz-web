import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PagedResult } from '../../models/paged-result.model';
import { Origem } from '../../models/origem.model';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OrigensService {
  private apiUrl = `${environment.apiUrl}/origens`;
  constructor(private http: HttpClient) {}

  search(q = '', page = 1, pageSize = 100) {
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    params.set('page', String(page));
    params.set('pageSize', String(pageSize));
    return this.http.get<PagedResult<Origem>>(`${this.apiUrl}?${params.toString()}`);
  }

  async getAllLight(): Promise<Origem[]> {
    // Para select simples — pega até 100 itens; ajuste se precisar
    const res = await firstValueFrom(this.search('', 1, 100));
    return res.items;
  }

  getById(id: string) {
    return this.http.get<Origem>(`${this.apiUrl}/${id}`);
  }

  create(payload: { nome: string; descricao?: string | null }) {
    return this.http.post<{ id: string }>(this.apiUrl, payload);
  }
}
