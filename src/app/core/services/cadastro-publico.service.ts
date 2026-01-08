import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  ConvitePublicInfoResponse,
  FinalizarCadastroPublicoRequest,
  FinalizarCadastroPublicoResponse,
} from '../../models/cadastro-publico.models';

@Injectable({ providedIn: 'root' })
export class CadastroPublicoService {
  constructor(private http: HttpClient) {}

  obterConvite(token: string): Observable<ConvitePublicInfoResponse> {
    return this.http.get<ConvitePublicInfoResponse>(`/api/public/cadastro/${token}`);
  }

  iniciar(token: string, req: FinalizarCadastroPublicoRequest): Observable<FinalizarCadastroPublicoResponse> {
    return this.http.post<FinalizarCadastroPublicoResponse>(`/api/public/cadastro/${token}/iniciar`, req);
  }

  concluir(token: string): Observable<FinalizarCadastroPublicoResponse> {
    return this.http.post<FinalizarCadastroPublicoResponse>(`/api/public/cadastro/${token}/concluir`, {});
  }

  status(token: string) {
    return this.http.get<{ contratoId: string; pessoaId: string | null; papel: number; concluido: boolean }>(
        `/api/public/cadastro/${token}/status`
    );
  }
}
