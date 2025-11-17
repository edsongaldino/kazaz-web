import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface EnderecoOption {
  id: string;
  label: string; // monte no backend algo como "Rua X, 123 - Centro / Cuiabá-MT"
}

@Injectable({ providedIn: 'root' })
export class EnderecosService {

  private apiUrl = `${environment.apiUrl}/enderecos`;
  constructor(private http: HttpClient) {}

  listar(): Promise<EnderecoOption[]> {
    return firstValueFrom(this.http.get<EnderecoOption[]>(this.apiUrl));
  }
}
