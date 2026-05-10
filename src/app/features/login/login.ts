import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

import { Auth } from '../../core/services/auth';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  email = '';
  senha = '';
  errorMessage = '';
  carregando = false;

  constructor(
    private auth: Auth,
    private router: Router,
    private notify: NotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  login() {
    if (this.carregando) return;

    this.errorMessage = '';
    this.carregando = true;
    this.cdr.detectChanges();

    this.auth.login(this.email, this.senha)
      .pipe(
        finalize(() => {
          this.carregando = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.errorMessage = 'E-mail ou senha inválidos.';
          this.notify.toastError('E-mail ou senha inválidos.');
        }
      });
  }
}