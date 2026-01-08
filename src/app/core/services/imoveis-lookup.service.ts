import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface LookupItem { id: string; label: string; }

@Injectable({ providedIn: 'root' })
export class ImoveisLookupService {
  private readonly baseUrl = `${environment.apiUrl}/imoveis`;

  constructor(private http: HttpClient) {}

  buscar(termo: string): Observable<LookupItem[]> {
    const params = new HttpParams().set('termo', termo).set('page', 1).set('pageSize', 10);
    // ajuste conforme seu endpoint real:
    return this.http.get<any>(this.baseUrl, { params }).pipe(
      map(res => (res?.items ?? res ?? []).map((i: any) => ({
        id: i.id,
        label: `${i.codigo ?? ''} - ${i.titulo ?? ''}`.trim() || i.id
      })))
    );
  }
}
