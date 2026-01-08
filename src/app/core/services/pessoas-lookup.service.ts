import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LookupItem { id: string; label: string; }

@Injectable({ providedIn: 'root' })
export class PessoasLookupService {
  private readonly baseUrl = `${environment.apiUrl}/pessoas`;

  constructor(private http: HttpClient) {}

  buscar(termo: string): Observable<LookupItem[]> {
    const params = new HttpParams().set('termo', termo).set('page', 1).set('pageSize', 10);
    // ajuste conforme seu endpoint real:
    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map(res => (res?.items ?? res ?? []).map((p: any) => ({
        id: p.id,
        label: p.nome ?? p.nomeCompleto ?? p.razaoSocial ?? p.id
      })))
    );
  }
}
