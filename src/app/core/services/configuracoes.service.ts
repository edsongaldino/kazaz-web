import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TipoDocumento, RegraDocumentoCadastro } from '../../models/configuracoes.models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfiguracoesService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  // ---------- Tipos de Documento ----------
  obterTiposDocumento(): Observable<TipoDocumento[]> {
    return this.http.get<TipoDocumento[]>(`${this.apiUrl}/tipos-documento/todos`);
  }

  criarTipoDocumento(req: Partial<TipoDocumento>): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.apiUrl}/tipos-documento`, req);
  }

  atualizarTipoDocumento(id: string, req: Partial<TipoDocumento>): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/tipos-documento/${id}`, req);
  }

  excluirTipoDocumento(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/tipos-documento/${id}`);
  }

  // ---------- Regras de Documentos ----------
  obterRegrasDocumento(): Observable<RegraDocumentoCadastro[]> {
    return this.http.get<RegraDocumentoCadastro[]>(`${this.apiUrl}/regras-documento-cadastro`);
  }

  criarRegraDocumento(req: any): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`${this.apiUrl}/regras-documento-cadastro`, req);
  }

  atualizarRegraDocumento(id: string, req: any): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/regras-documento-cadastro/${id}`, req);
  }

  excluirRegraDocumento(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/regras-documento-cadastro/${id}`);
  }
}
