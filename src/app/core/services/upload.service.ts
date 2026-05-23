import { Injectable } from '@angular/core';
import { HttpClient, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UploadArquivoResponse } from '../../models/cadastro-publico.models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UploadService {
  private apiUrl = `${environment.apiUrl}/uploads`;

  constructor(private http: HttpClient) {}

  upload(file: File, folder = 'pessoa'): Observable<UploadArquivoResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<UploadArquivoResponse>(`${this.apiUrl}?folder=${encodeURIComponent(folder)}`, form);
  }

  uploadWithProgress(file: File, folder = 'pessoa'): Observable<HttpEvent<UploadArquivoResponse>> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<UploadArquivoResponse>(
      `${this.apiUrl}?folder=${encodeURIComponent(folder)}`,
      form,
      {
        reportProgress: true,
        observe: 'events'
      }
    );
  }
}
