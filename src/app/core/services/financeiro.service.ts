import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { FinanceiroLancamentoCreateDto, FinanceiroLancamentoResponseDto, FinanceiroLancamentoSearchFilterDto, FinanceiroLancamentoUpdateDto, FinanceiroResumoDto } from '../../models/financeiro.model';

@Injectable({ providedIn: 'root' })
export class FinanceiroService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/financeiro`;

  listar(q: FinanceiroLancamentoSearchFilterDto): Observable<{ items: FinanceiroLancamentoResponseDto[]; total: number }> {
    let params = new HttpParams();

    if (q.page != null) {
      params = params.set('page', String(q.page));
    }
    if (q.pageSize != null) {
      params = params.set('pageSize', String(q.pageSize));
    }
    if (q.tipo != null) {
      params = params.set('tipo', String(q.tipo));
    }
    if (q.status != null) {
      params = params.set('status', String(q.status));
    }
    if (q.categoria) {
      params = params.set('categoria', q.categoria);
    }
    if (q.dataInicio) {
      params = params.set('dataInicio', q.dataInicio);
    }
    if (q.dataFim) {
      params = params.set('dataFim', q.dataFim);
    }

    return this.http.get<{ items: FinanceiroLancamentoResponseDto[]; total: number }>(this.apiUrl, { params });
  }

  obterResumo(): Observable<FinanceiroResumoDto> {
    return this.http.get<FinanceiroResumoDto>(`${this.apiUrl}/resumo`);
  }

  obter(id: string): Observable<FinanceiroLancamentoResponseDto> {
    return this.http.get<FinanceiroLancamentoResponseDto>(`${this.apiUrl}/${id}`);
  }

  criar(body: FinanceiroLancamentoCreateDto): Observable<FinanceiroLancamentoResponseDto> {
    return this.http.post<FinanceiroLancamentoResponseDto>(this.apiUrl, body);
  }

  atualizar(id: string, body: FinanceiroLancamentoUpdateDto): Observable<FinanceiroLancamentoResponseDto> {
    return this.http.put<FinanceiroLancamentoResponseDto>(`${this.apiUrl}/${id}`, body);
  }

  excluir(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
