import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DashboardResumo } from '../../models/dashboard.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  constructor(private http: HttpClient) {}

  obterResumo(): Observable<DashboardResumo> {
    return this.http.get<DashboardResumo>(`${this.baseUrl}/resumo`);
  }
}