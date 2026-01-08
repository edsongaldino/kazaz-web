import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CadastroPublicoService } from '../../../core/services/cadastro-publico.service';

@Component({
  standalone: true,
  selector: 'app-cadastro-dados',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './dados.html',
  styleUrls: ['./dados.scss'],
})
export class CadastroDadosComponent {
  loading = false;
  erro: string | null = null;

  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private service: CadastroPublicoService,
    private route: ActivatedRoute,
    private router: Router
  ) {

    this.form = this.fb.group({
      nome: ['', [Validators.required, Validators.minLength(3)]],
      enderecoId: [''],
    });
    
  }

  salvar(): void {
    if (this.form.invalid) return;

    const token = this.route.snapshot.paramMap.get('token')!;
    this.loading = true;
    this.erro = null;

    this.service.iniciar(token, {
      nome: this.form.value.nome!,
      enderecoId: this.form.value.enderecoId || null,
      documentos: [],
    }).subscribe({
      next: (res) => {
        this.router.navigate(['documentos'], { relativeTo: this.route });
      },
      error: () => {
        this.loading = false;
        this.erro = 'Erro ao salvar os dados.';
      },
    });
  }
}
