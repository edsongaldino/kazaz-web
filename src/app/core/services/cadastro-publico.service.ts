import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CadastroPublicoDetalhesDto,
  ConvitePublicInfoResponse,
  DocumentoRequeridoDto,
  DocumentosRequeridosResponse,
  FinalizarCadastroPublicoRequest,
  FinalizarCadastroPublicoResponse,
} from '../../models/cadastro-publico.models';

@Injectable({ providedIn: 'root' })
export class CadastroPublicoService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  obterConvite(token: string): Observable<ConvitePublicInfoResponse> {
    return this.http.get<ConvitePublicInfoResponse>(`${this.baseUrl}/public/cadastro/${token}`);
  }

  iniciar(token: string, req: FinalizarCadastroPublicoRequest): Observable<FinalizarCadastroPublicoResponse> {
    return this.http.post<FinalizarCadastroPublicoResponse>(`${this.baseUrl}/public/cadastro/${token}/iniciar`, req);
  }

  concluir(token: string): Observable<FinalizarCadastroPublicoResponse> {
    return this.http.post<FinalizarCadastroPublicoResponse>(`${this.baseUrl}/public/cadastro/${token}/concluir`, {});
  }

  status(token: string) {
    return this.http.get<{ contratoId: string; pessoaId: string | null; papel: number; concluido: boolean }>(
      `${this.baseUrl}/public/cadastro/${token}/status`
    );
  }

  vincularPessoa(token: string, pessoaId: string) {
    return this.http.put<void>(`${this.baseUrl}/public/cadastro/${token}/vincular-pessoa`, { pessoaId });
  }

  documentosRequeridos(token: string) {
    return this.http.get<DocumentosRequeridosResponse>(
      `${this.baseUrl}/cadastro-publico/${token}/documentos-requeridos`
    );
  }

  obterDetalhes(token: string): Observable<CadastroPublicoDetalhesDto> {
    return this.http.get<CadastroPublicoDetalhesDto>(
      `${this.baseUrl}/public/cadastro/${token}/detalhes`
    );
  }

}