import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentoCreateDto } from '../../models/cadastro-publico.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DocumentosService {
  private apiUrl = `${environment.apiUrl}/documentos`;

  constructor(private http: HttpClient) {}

  criar(dto: DocumentoCreateDto): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(this.apiUrl, dto);
  }

  listarPorPessoa(pessoaId: string, contratoId?: string | null): Observable<any[]> {
    const url = contratoId
      ? `${this.apiUrl}/pessoa/${pessoaId}?contratoId=${contratoId}`
      : `${this.apiUrl}/pessoa/${pessoaId}`;
    return this.http.get<any[]>(url);
  }

  remover(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
