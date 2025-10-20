import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";

export interface CepRes { cep:string; logradouro?:string; bairro?:string; localidade?:string; uf?:string; ibge?:string; }

@Injectable({ providedIn: 'root' })
export class CepService {
  private http = inject(HttpClient);
  buscar(cep: string) { return this.http.get<CepRes>(`https://viacep.com.br/ws/${cep}/json/`); }
}
