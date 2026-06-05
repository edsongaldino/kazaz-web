import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ColaboradorCreateDto, ColaboradorResponseDto, ColaboradorSearchFilterDto, ColaboradorUpdateDto } from '../../models/colaborador.model';

@Injectable({ providedIn: 'root' })
export class ColaboradoresService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/colaboradores`;

  listar(q: ColaboradorSearchFilterDto): Observable<{ items: ColaboradorResponseDto[]; total: number }> {
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
    if (q.ativo != null) {
      params = params.set('ativo', String(q.ativo));
    }

    return this.http.get<{ items: ColaboradorResponseDto[]; total: number }>(this.apiUrl, { params });
  }

  obter(id: string): Observable<ColaboradorResponseDto> {
    return this.http.get<ColaboradorResponseDto>(`${this.apiUrl}/${id}`);
  }

  criar(body: ColaboradorCreateDto): Observable<ColaboradorResponseDto> {
    return this.http.post<ColaboradorResponseDto>(this.apiUrl, body);
  }

  atualizar(id: string, body: ColaboradorUpdateDto): Observable<ColaboradorResponseDto> {
    return this.http.put<ColaboradorResponseDto>(`${this.apiUrl}/${id}`, body);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
