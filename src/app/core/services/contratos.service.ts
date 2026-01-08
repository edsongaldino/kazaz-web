import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ContratoResponse, CriarContratoRequest } from '../../models/contrato.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ContratosService {
  private readonly baseUrl = `${environment.apiUrl}/contratos`;

  constructor(private http: HttpClient) {}

  listar(filtro?: { imovelId?: string; tipo?: number; status?: number }): Observable<ContratoResponse[]> {
    let params = new HttpParams();
    if (filtro?.imovelId) params = params.set('imovelId', filtro.imovelId);
    if (filtro?.tipo) params = params.set('tipo', filtro.tipo);
    if (filtro?.status) params = params.set('status', filtro.status);

    return this.http.get<ContratoResponse[]>(this.baseUrl, { params });
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
