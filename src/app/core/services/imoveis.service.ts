import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Observable } from 'rxjs';
import { ImovelDto, ImovelCreateRequest, ImovelUpdateRequest } from './../../models/imovel.model';
import { PagedResult } from '../../models/paged-result.model';

@Injectable({ providedIn: 'root' })
export class ImoveisService {
  private http = inject(HttpClient);
  private baseUrl = '/imoveis';

  listar(): Observable<PagedResult<ImovelDto>> {
    return this.http.get<PagedResult<ImovelDto>>(this.baseUrl);
  }

  obterPorId(id: string): Observable<ImovelDto> {
    // Backend pode retornar mais campos — o form só usa { codigo, enderecoId }.
    return this.http.get<ImovelDto>(`${this.baseUrl}/${id}`);
  }

  criar(dto: ImovelCreateRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.baseUrl, dto);
  }

  atualizar(id: string, dto: ImovelUpdateRequest): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, dto);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
