import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  PagedResult,
  UsuarioCreateDto,
  UsuarioListDto,
  UsuarioUpdateDto
} from './../../models/usuario.models';
import { Console } from 'console';

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  listar(page: number, pageSize: number, termo?: string): Observable<PagedResult<UsuarioListDto>> {
    let params = new HttpParams()
      .set('page', page)
      .set('pageSize', pageSize);

    if (termo?.trim()) params = params.set('termo', termo.trim());

    return this.http.get<PagedResult<UsuarioListDto>>(this.baseUrl, { params });
  }

  obterPorId(id: string): Observable<UsuarioListDto> {
    return this.http.get<UsuarioListDto>(`${this.baseUrl}/${id}`);
  }

  criar(dto: UsuarioCreateDto): Observable<UsuarioListDto> {
    console.log(dto);
    return this.http.post<UsuarioListDto>(this.baseUrl, dto);
  }

  atualizar(id: string, dto: UsuarioUpdateDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, dto);
  }

  ativar(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/ativar`, {});
  }

  desativar(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/desativar`, {});
  }

  resetSenha(id: string, novaSenha: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/reset-senha`, { novaSenha });
  }

  remover(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
