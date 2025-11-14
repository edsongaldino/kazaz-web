import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PessoaCreateRequest, PessoaDto, PessoaListItem, PessoasPageResponse, PessoaUpdateRequest } from '../../models/pessoa.model';
import { environment } from '../../../environments/environment';

export interface PessoasQuery {
  page?: number;      // 1-based (controller já usa 1-based)
  pageSize?: number;
  termo?: string | null;
}

@Injectable({ providedIn: 'root' })
export class PessoasService {

  private apiUrl = `${environment.apiUrl}/pessoas`;
  constructor(private http: HttpClient) {}

  listar(q: PessoasQuery): Observable<PessoasPageResponse> {
    let params = new HttpParams();
    if (q.page != null) params = params.set('page', String(q.page));
    if (q.pageSize != null) params = params.set('pageSize', String(q.pageSize));
    if (q.termo) params = params.set('termo', q.termo.trim());

    return this.http.get<PessoasPageResponse>(this.apiUrl, { params });
  }

  obter(id: string): Observable<PessoaDto> {
    return this.http.get<PessoaDto>(`${this.apiUrl}/${id}`);
  }

  criar(body: PessoaCreateRequest): Observable<PessoaListItem> {
    return this.http.post<PessoaListItem>(this.apiUrl, body);
  }

  atualizar(id: string, body: PessoaUpdateRequest): Observable<PessoaListItem> {
    return this.http.put<PessoaListItem>(`${this.apiUrl}/${id}`, body);
  }

  excluir(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
