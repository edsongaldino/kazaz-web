import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult } from '../../models/usuario.models';
import { AnalisarConviteRequest, ConviteCadastroListItemResponse, ListarConvitesCadastroQuery } from '../../models/cadastro-publico.models';
import { environment } from '../../../environments/environment';

export type ConviteCadastroContratoDto = {
  id: string;
  contratoId: string;
  numeroContrato: string;
  tipo: number | string;
  papel: number;
  token: string;
  status: number;
  criadoEm: string;
  expiraEm?: string | null;
  pessoaId?: string | null;
  usadoEm?: string | null;
  url?: string | null;
  link?: string | null;
};

export type GerarConviteCadastroRequest = {
  tipo: number;
  /** Se informado, adiciona convites a um contrato existente */
  contratoId?: string | null;
  /** Forma de garantia: 1 = Fiador, 2 = Seguro Fiança. Obrigatório para locação. */
  formaGarantia?: number | null;
  administradoPeloProprietario: boolean;
  expiraEmDias: number;
};

@Injectable({ providedIn: 'root' })
export class ConvitesCadastroService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/public/cadastro/convites-cadastro-contrato`;

  // mantém compatibilidade com a tela atual
  listarPorContrato(contratoId?: string): Observable<PagedResult<ConviteCadastroContratoDto>> {
    let params = new HttpParams();

    if (contratoId) {
      params = params.set('contratoId', contratoId);
    }

    return this.http.get<PagedResult<ConviteCadastroContratoDto>>(this.baseUrl, {
      params
    });
  }

  // novo método para o modal por imóvel
  listarPorImovel(imovelId: string, page = 1, pageSize = 5) {
    let params = new HttpParams()
      .set('imovelId', imovelId)
      .set('page', page)
      .set('pageSize', pageSize);

    return this.http.get<PagedResult<ConviteCadastroContratoDto>>(
      this.baseUrl,
      { params }
    );
  }

  gerarLinksConvite(
    imovelId: string,
    body: GerarConviteCadastroRequest
  ) {
    return this.http.post<{ contratoId: string; numero: string; links: any[] }>(
      `${environment.apiUrl}/contratos/rascunho/${imovelId}/gerar-links`,
      body
    );
  }

  // tela nova: listagem geral de convites para análise
  listarParaAnalise(filtro: ListarConvitesCadastroQuery) {
    let params = new HttpParams()
      .set('page', filtro.page)
      .set('pageSize', filtro.pageSize);

    if (filtro.contratoId) params = params.set('contratoId', filtro.contratoId);
    if (filtro.imovelId) params = params.set('imovelId', filtro.imovelId);
    if (filtro.status) params = params.set('status', filtro.status);
    if (filtro.papel) params = params.set('papel', filtro.papel);
    if (filtro.nome) params = params.set('nome', filtro.nome);
    if (filtro.documento) params = params.set('documento', filtro.documento);
    if (filtro.imovel) params = params.set('imovel', filtro.imovel);
    if (filtro.preenchidoDe) params = params.set('preenchidoDe', filtro.preenchidoDe);
    if (filtro.preenchidoAte) params = params.set('preenchidoAte', filtro.preenchidoAte);

    return this.http.get<PagedResult<ConviteCadastroListItemResponse>>(
      this.baseUrl,
      { params }
    );
  }

  analisar(conviteId: string, request: AnalisarConviteRequest) {
    return this.http.post<void>(
      `${environment.apiUrl}/public/cadastro/${conviteId}/analise`,
      request
    );
  }
}