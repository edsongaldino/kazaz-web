import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';  // Se precisar de rotas

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule], // Adiciona dependências diretamente no componente
  templateUrl: './app.html',
  styleUrls: ['./app.scss']
})
export class AppComponent {
  title = 'frontend';
}
