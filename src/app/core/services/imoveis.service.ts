import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import {
  ImovelDto,
  ImovelUpsertRequest,
  ImovelListDto,
  TipoImovelDto
} from './../../models/imovel.model';

import { CaracteristicaCatalogoDto } from '../../models/caracteristica.model';

import { PagedResult } from '../../models/paged-result.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ImoveisService {
  private readonly baseUrl = environment.apiUrl;           // ex: https://api.seudominio.com
  private readonly apiUrl = `${this.baseUrl}/imoveis`;     // ✅ corrigido (era /origens)

  constructor(private http: HttpClient) {}

  // Se sua listagem é paginada no backend, mantenha PagedResult
  listar(page = 1, pageSize = 10, termo?: string): Observable<PagedResult<ImovelListDto>> {
    const params: any = { page, pageSize };
    if (termo) params.termo = termo;

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
