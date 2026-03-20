import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { PagedResult } from '../../models/usuario.models';

export type ConviteCadastroContratoDto = {
  id: string;
  contratoId: string;
  papel: number;
  token: string;
  status: number;
  criadoEm: string;
  expiraEm?: string | null;
  pessoaId?: string | null;
  usadoEm?: string | null;
  url?: string | null;
};

@Injectable({ providedIn: 'root' })
export class ConvitesCadastroService {
  private http = inject(HttpClient);

  listar(contratoId?: string) {
    let params: any = {};
    if (contratoId) params.contratoId = contratoId;

    return this.http.get<PagedResult<ConviteCadastroContratoDto>>(
        `/public/cadastro/convites-cadastro-contrato`,
        { params }
    );
  }


}
