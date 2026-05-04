import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContratoResponse, CriarContratoRequest, ListarContratosQuery } from '../../models/contrato.models';
import { environment } from '../../../environments/environment';
import { PagedResult } from '../../models/paged-result.model';

@Injectable({ providedIn: 'root' })
export class ContratosService {
  private readonly baseUrl = `${environment.apiUrl}/contratos`;

  constructor(private http: HttpClient) {}

  listar(filtro: ListarContratosQuery) {
    let params = new HttpParams()
      .set('page', filtro.page)
      .set('pageSize', filtro.pageSize);

    if (filtro.imovelId) params = params.set('imovelId', filtro.imovelId);
    if (filtro.tipoImovelId) params = params.set('tipoImovelId', filtro.tipoImovelId);
    if (filtro.tipo) params = params.set('tipo', filtro.tipo);
    if (filtro.status) params = params.set('status', filtro.status);
    if (filtro.contrato) params = params.set('contrato', filtro.contrato);
    if (filtro.imovel) params = params.set('imovel', filtro.imovel);
    if (filtro.documentoParte) params = params.set('documentoParte', filtro.documentoParte);
    if (filtro.vigenciaDe) params = params.set('vigenciaDe', filtro.vigenciaDe);
    if (filtro.vigenciaAte) params = params.set('vigenciaAte', filtro.vigenciaAte);

    return this.http.get<PagedResult<ContratoResponse>>('/contratos', { params });
  }

  obterPorId(id: string): Observable<ContratoResponse> {
    return this.http.get<ContratoResponse>(`${this.baseUrl}/${id}`);
  }

  criarRascunho(req: CriarContratoRequest): Observable<ContratoResponse> {
    return this.http.post<ContratoResponse>(this.baseUrl, req);
  }

  ativar(id: string): Observable<ContratoResponse> {
    return this.http.post<ContratoResponse>(`${this.baseUrl}/${id}/ativar`, {});
  }

  cancelar(id: string): Observable<ContratoResponse> {
    return this.http.post<ContratoResponse>(`${this.baseUrl}/${id}/cancelar`, {});
  }

  encerrar(id: string): Observable<ContratoResponse> {
    return this.http.post<ContratoResponse>(`${this.baseUrl}/${id}/encerrar`, {});
  }
}
