import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Cidade } from '../../models/cidade.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CidadeDto { id: string; nome: string; ibge: string; estadoId: string; uf: string; }

@Injectable({ providedIn: 'root' })

export class CidadeService {
  private apiUrl = `${environment.apiUrl}/cidades`;
  constructor(private http: HttpClient) {}
  listarPorEstado(estadoId: string) { return this.http.get<{id:string;nome:string}[]>(`${this.apiUrl}/estados/${estadoId}/cidades`); }
  obterPorIbge(ibge: string) { return this.http.get<CidadeDto>(`${this.apiUrl}/ibge/${ibge}`); }
  obterPorId(id: string) { return this.http.get<CidadeDto>(`${this.apiUrl}/${id}`); }
}
