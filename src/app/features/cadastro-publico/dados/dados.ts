import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PessoaFormComponent, PessoaFormMode } from '../../pessoas/pessoa-form/pessoa-form.component';

@Component({
  standalone: true,
  imports: [PessoaFormComponent],
  templateUrl: './dados.html',
})
export class CadastroDadosComponent {
  token!: string;
  mode: PessoaFormMode = 'public';

  constructor(private route: ActivatedRoute) {
    this.token = this.route.parent?.snapshot.paramMap.get('token')!;

    const modo = this.route.snapshot.queryParamMap.get('modo');

    if (modo === 'visualizar') {
      this.mode = 'public-view';
    }
  }
}