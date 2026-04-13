import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { PagedResult } from '../../models/usuario.models';

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
};

export type GerarConviteCadastroRequest = {
  contratoId: string;
  papel: number;
  expiraEm?: string | null;
};

@Injectable({ providedIn: 'root' })
export class ConvitesCadastroService {
  private http = inject(HttpClient);
  private readonly baseUrl = `/public/cadastro/convites-cadastro-contrato`;

  // mantém compatibilidade com a tela atual
  listar(contratoId?: string): Observable<PagedResult<ConviteCadastroContratoDto>> {
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
    body: { tipo: number; papel: number; expiraEmDias: number }
  ) {
    return this.http.post(
      `/contratos/rascunho/gerar-links`,
      body,
      { params: { imovelId } }
    );
  }
  
}