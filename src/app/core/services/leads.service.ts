import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ConvertLeadRequest, LeadCreateRequest, LeadListItem, LeadsFiltro, LeadsPageResponse, LeadUpdateRequest } from '../../models/lead.model';

@Injectable({ providedIn: 'root' })
export class LeadsService {
  private apiUrl = `${environment.apiUrl}/leads`;

  constructor(private http: HttpClient) {}

  listar(q: LeadsFiltro): Observable<LeadsPageResponse> {
    let params = new HttpParams();

    if (q.page != null) {
      params = params.set('page', String(q.page));
    }
    if (q.pageSize != null) {
      params = params.set('pageSize', String(q.pageSize));
    }
    if (q.nome) {
      params = params.set('nome', q.nome.trim());
    }
    if (q.email) {
      params = params.set('email', q.email.trim());
    }
    if (q.telefone) {
      params = params.set('telefone', q.telefone.trim());
    }
    if (q.status) {
      params = params.set('status', q.status);
    }
    if (q.origemId) {
      params = params.set('origemId', q.origemId);
    }

    return this.http.get<LeadsPageResponse>(this.apiUrl, { params });
  }

  obter(id: string): Observable<LeadListItem> {
    return this.http.get<LeadListItem>(`${this.apiUrl}/${id}`);
  }

  criar(body: LeadCreateRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, body);
  }

  atualizar(id: string, body: LeadUpdateRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, body);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  converter(id: string, body: ConvertLeadRequest): Observable<{ pessoaId: string }> {
    return this.http.post<{ pessoaId: string }>(`${this.apiUrl}/${id}/convert`, body);
  }
}
