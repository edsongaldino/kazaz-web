import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { ImovelDto, ImovelCreateRequest, ImovelUpdateRequest } from './../../models/imovel.model';
import { PagedResult } from '../../models/paged-result.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ImoveisService {

  private apiUrl = `${environment.apiUrl}/origens`;
  constructor(private http: HttpClient) {}

  listar(): Observable<PagedResult<ImovelDto>> {
    return this.http.get<PagedResult<ImovelDto>>(this.apiUrl);
  }

  obterPorId(id: string): Observable<ImovelDto> {
    // Backend pode retornar mais campos — o form só usa { codigo, enderecoId }.
    return this.http.get<ImovelDto>(`${this.apiUrl}/${id}`);
  }

  criar(dto: ImovelCreateRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.apiUrl, dto);
  }

  atualizar(id: string, dto: ImovelUpdateRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, dto);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
