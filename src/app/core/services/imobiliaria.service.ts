import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ImobiliariaResponseDto, ImobiliariaUpdateDto } from '../../models/imobiliaria.model';

@Injectable({ providedIn: 'root' })
export class ImobiliariaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/imobiliaria`;

  obter(): Observable<ImobiliariaResponseDto> {
    return this.http.get<ImobiliariaResponseDto>(this.apiUrl);
  }

  salvar(body: ImobiliariaUpdateDto): Observable<ImobiliariaResponseDto> {
    return this.http.put<ImobiliariaResponseDto>(this.apiUrl, body);
  }
}
