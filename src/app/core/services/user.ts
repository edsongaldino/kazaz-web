import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from './../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/usuarios`; // Endpoint da API para usuários

  constructor(private http: HttpClient) { }

  // Obter lista de usuários
  getUsers(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  // Criar um novo usuário
  createUser(user: any): Observable<any> {
    return this.http.post(this.apiUrl, user);
  }

  // Atualizar um usuário
  updateUser(user: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/${user.id}`, user);
  }

  // Excluir um usuário
  deleteUser(userId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${userId}`);
  }
}
