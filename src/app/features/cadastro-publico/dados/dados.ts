import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PessoaFormComponent } from '../../pessoas/pessoa-form/pessoa-form.component';

@Component({
  standalone: true,
  imports: [PessoaFormComponent],
  templateUrl: './dados.html',
})

export class CadastroDadosComponent {
  token!: string;

  constructor(private route: ActivatedRoute) {
    this.token = this.route.parent?.snapshot.paramMap.get('token')!;
  }
}
