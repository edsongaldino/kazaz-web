import { Component, OnInit } from '@angular/core';
import { UserService } from '../../../core/services/user';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lista',
  imports: [CommonModule],
  templateUrl: './lista.html',
  styleUrl: './lista.scss'
})
export class Lista implements OnInit{

  users: any[] = [];
  errorMessage: string = '';

  constructor(private userService: UserService, private router: Router) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.userService.getUsers().subscribe({
      next: (response) => {
        this.users = response;
      },
      error: (err) => {
        this.errorMessage = 'Erro ao carregar usuários';
        console.error(err);
      }
    });
  }

  deleteUser(userId: string) {
    this.userService.deleteUser(userId).subscribe({
      next: () => {
        this.loadUsers(); // Recarrega a lista de usuários
      },
      error: (err) => {
        this.errorMessage = 'Erro ao excluir usuário';
        console.error(err);
      }
    });
  }

}
