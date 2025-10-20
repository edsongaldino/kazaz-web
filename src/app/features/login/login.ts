import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router } from '@angular/router';  // Para navegação de rotas
import { FormsModule } from '@angular/forms'; 
import { Auth } from '../../core/services/auth';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  email: string = '';
  senha: string = '';
  errorMessage: string = '';

  constructor(private http: HttpClient, private auth : Auth, private router: Router) {}

  login() {
    this.auth.login(this.email, this.senha).subscribe({
      next: (response) => {
        // Salva o token no localStorage
        localStorage.setItem('authToken', response.token);
        // Redireciona para a página inicial (home)
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.errorMessage = 'Falha ao autenticar. Verifique suas credenciais.';
        console.error(err);
      }
    });
  }
}
