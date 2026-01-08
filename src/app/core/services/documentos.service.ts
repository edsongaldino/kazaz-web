import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DocumentoCreateDto } from '../../models/cadastro-publico.models';

@Injectable({ providedIn: 'root' })
export class DocumentosService {
  constructor(private http: HttpClient) {}

  criar(dto: DocumentoCreateDto): Observable<{ id: string }> {
    return this.http.post<{ id: string }>(`/api/documentos`, dto);
  }

  listarPorPessoa(pessoaId: string): Observable<any[]> {
    return this.http.get<any[]>(`/api/documentos/pessoa/${pessoaId}`);
  }
}
