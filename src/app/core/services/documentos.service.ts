import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentoCreateDto } from '../../models/cadastro-publico.models';

@Injectable({ providedIn: 'root' })
export class DocumentosService {
  constructor(private http: HttpClient) {}

  criar(dto: DocumentoCreateDto): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`/documentos`, dto);
  }

  listarPorPessoa(pessoaId: string, contratoId?: string | null): Observable<any[]> {
    const url = contratoId
      ? `/documentos/pessoa/${pessoaId}?contratoId=${contratoId}`
      : `/documentos/pessoa/${pessoaId}`;
    return this.http.get<any[]>(url);
  }

  remover(id: string): Observable<void> {
    return this.http.delete<void>(`/documentos/${id}`);
  }
}
