import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PessoaCreateRequest, PessoaDto, PessoaListItem, PessoasFiltro, PessoasPageResponse, PessoaUpdateRequest } from '../../models/pessoa.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PessoasService {

  private apiUrl = `${environment.apiUrl}/pessoas`;
  constructor(private http: HttpClient) {}

  listar(q: PessoasFiltro): Observable<PessoasPageResponse> {
    let params = new HttpParams();

    if (q.page != null)
      params = params.set('page', String(q.page));

    if (q.pageSize != null)
      params = params.set('pageSize', String(q.pageSize));

    if (q.nome)
      params = params.set('nome', q.nome.trim());

    if (q.documento)
      params = params.set('documento', q.documento.trim());

    if (q.tipo)
      params = params.set('tipo', q.tipo);

    if (q.papel != null)
      params = params.set('papel', String(q.papel));

    return this.http.get<PessoasPageResponse>(this.apiUrl, { params });
  }

  obter(id: string): Observable<PessoaDto> {
    return this.http.get<PessoaDto>(`${this.apiUrl}/${id}`);
  }

  criar(body: PessoaCreateRequest): Observable<PessoaListItem> {
    console.log(body);
    return this.http.post<PessoaListItem>(this.apiUrl, body);
  }

  atualizar(id: string, body: PessoaUpdateRequest): Observable<PessoaListItem> {
    console.log(body);
    return this.http.put<PessoaListItem>(`${this.apiUrl}/${id}`, body);
  }

  excluir(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  obterPorDocumento(documento: string): Observable<PessoaDto> {
    return this.http.get<PessoaDto>(`${this.apiUrl}/por-documento/${documento}`);
  }
  
}
