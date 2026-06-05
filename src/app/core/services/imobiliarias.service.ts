import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ImobiliariaResponseDto, ImobiliariaUpdateDto, ImobiliariaCriarDto } from '../../models/imobiliaria.model';
import { PagedResult } from '../../models/usuario.models';

@Injectable({ providedIn: 'root' })
export class ImobiliariasService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/imobiliarias`;

  listar(page: number, pageSize: number, termo?: string | null): Observable<PagedResult<ImobiliariaResponseDto>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (termo) {
      params = params.set('termo', termo);
    }

    return this.http.get<PagedResult<ImobiliariaResponseDto>>(this.apiUrl, { params });
  }

  obterPorId(id: string): Observable<ImobiliariaResponseDto> {
    return this.http.get<ImobiliariaResponseDto>(`${this.apiUrl}/${id}`);
  }

  criar(body: ImobiliariaCriarDto): Observable<ImobiliariaResponseDto> {
    return this.http.post<ImobiliariaResponseDto>(this.apiUrl, body);
  }

  atualizar(id: string, body: ImobiliariaUpdateDto): Observable<ImobiliariaResponseDto> {
    return this.http.put<ImobiliariaResponseDto>(`${this.apiUrl}/${id}`, body);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
