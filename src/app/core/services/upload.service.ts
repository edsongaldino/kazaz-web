import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { UploadArquivoResponse } from '../../models/cadastro-publico.models';

@Injectable({ providedIn: 'root' })
export class UploadService {
  constructor(private http: HttpClient) {}

  upload(file: File, folder = 'pessoa'): Observable<UploadArquivoResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<UploadArquivoResponse>(`/api/uploads?folder=${encodeURIComponent(folder)}`, form);
  }
}
