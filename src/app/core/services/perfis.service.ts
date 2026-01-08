import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PerfilDto } from '../../models/usuario.models';

@Injectable({ providedIn: 'root' })
export class PerfisService {
  private readonly baseUrl = `${environment.apiUrl}/perfis`;

  constructor(private http: HttpClient) {}

  listar(): Observable<PerfilDto[]> {
    return this.http.get<PerfilDto[]>(this.baseUrl);
  }
}
