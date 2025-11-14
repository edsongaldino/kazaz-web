import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface EnderecoOption {
  id: string;
  label: string; // monte no backend algo como "Rua X, 123 - Centro / Cuiabá-MT"
}

@Injectable({ providedIn: 'root' })
export class EnderecosService {
  private http = inject(HttpClient);
  private baseUrl = '/api/enderecos'; // ajuste se for diferente

  listar(): Promise<EnderecoOption[]> {
    return firstValueFrom(this.http.get<EnderecoOption[]>(this.baseUrl));
  }
}
