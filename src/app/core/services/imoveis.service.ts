import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ImovelDto,
  ImovelUpsertRequest,
  ImovelListDto,
  TipoImovelDto,
  ImovelFiltro
} from './../../models/imovel.model';

import { CaracteristicaCatalogoDto } from '../../models/caracteristica.model';

import { PagedResult } from '../../models/paged-result.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ImoveisService {
  private readonly baseUrl = environment.apiUrl;           // ex: https://api.seudominio.com
  private readonly apiUrl = `${this.baseUrl}/imoveis`;     // ✅ corrigido (era /origens)

  constructor(private http: HttpClient) {}

  listar(filtro?: ImovelFiltro): Observable<PagedResult<ImovelListDto>> {
    let params = new HttpParams();

    if (filtro) {
      if (filtro.page) params = params.set('page', filtro.page);
      if (filtro.pageSize) params = params.set('pageSize', filtro.pageSize);

      if (filtro.codigo)
        params = params.set('codigo', filtro.codigo);

      if (filtro.tipoImovelId)
        params = params.set('tipoImovelId', filtro.tipoImovelId);

      if (filtro.finalidade)
        params = params.set('finalidade', filtro.finalidade);

      if (filtro.cidadeId)
        params = params.set('cidadeId', filtro.cidadeId);

      if (filtro.status)
        params = params.set('status', filtro.status);
    }

    return this.http.get<PagedResult<ImovelListDto>>(this.apiUrl, { params });
  }

  obterPorId(id: string): Observable<ImovelDto> {
    return this.http.get<ImovelDto>(`${this.apiUrl}/${id}`);
  }

  criar(dto: ImovelUpsertRequest): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.apiUrl, dto);
  }

  atualizar(id: string, dto: ImovelUpsertRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/${id}`, dto);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ---------- Catálogos ----------
  listarTiposImovel(): Observable<TipoImovelDto[]> {
    return this.http.get<TipoImovelDto[]>(`${this.baseUrl}/tipos-imovel`);
  }

  listarCaracteristicas(): Observable<CaracteristicaCatalogoDto[]> {
    return this.http.get<CaracteristicaCatalogoDto[]>(`${this.baseUrl}/caracteristicas`);
  }
}
