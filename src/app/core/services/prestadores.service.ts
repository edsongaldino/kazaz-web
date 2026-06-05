import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PrestadorServicoCreateDto, PrestadorServicoResponseDto, PrestadorServicoSearchFilterDto, PrestadorServicoUpdateDto } from '../../models/prestador.model';

@Injectable({ providedIn: 'root' })
export class PrestadoresService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/prestadores`;

  listar(q: PrestadorServicoSearchFilterDto): Observable<{ items: PrestadorServicoResponseDto[]; total: number }> {
    let params = new HttpParams();

    if (q.page != null) {
      params = params.set('page', String(q.page));
    }
    if (q.pageSize != null) {
      params = params.set('pageSize', String(q.pageSize));
    }
    if (q.termo) {
      params = params.set('termo', q.termo);
    }
    if (q.especialidade) {
      params = params.set('especialidade', q.especialidade);
    }
    if (q.ativo != null) {
      params = params.set('ativo', String(q.ativo));
    }

    return this.http.get<{ items: PrestadorServicoResponseDto[]; total: number }>(this.apiUrl, { params });
  }

  obter(id: string): Observable<PrestadorServicoResponseDto> {
    return this.http.get<PrestadorServicoResponseDto>(`${this.apiUrl}/${id}`);
  }

  criar(body: PrestadorServicoCreateDto): Observable<PrestadorServicoResponseDto> {
    return this.http.post<PrestadorServicoResponseDto>(this.apiUrl, body);
  }

  atualizar(id: string, body: PrestadorServicoUpdateDto): Observable<PrestadorServicoResponseDto> {
    return this.http.put<PrestadorServicoResponseDto>(`${this.apiUrl}/${id}`, body);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
