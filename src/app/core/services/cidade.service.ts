import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Cidade } from '../../models/cidade.model';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CidadeDto { id: string; nome: string; ibge: string; estadoId: string; uf: string; }

@Injectable({ providedIn: 'root' })

export class CidadeService {
  private http = inject(HttpClient);
  listarPorEstado(estadoId: string) { return this.http.get<{id:string;nome:string}[]>(`/estados/${estadoId}/cidades`); }
  obterPorIbge(ibge: string) { return this.http.get<CidadeDto>(`/cidades/ibge/${ibge}`); }
  obterPorId(id: string) { return this.http.get<CidadeDto>(`/cidades/${id}`); }
}
