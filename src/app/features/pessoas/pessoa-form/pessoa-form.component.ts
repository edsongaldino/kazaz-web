import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { PessoasService } from '../../../core/services/pessoas.service';
import { PessoaCreateRequest, PessoaListItem, PessoaUpdateRequest, TipoPessoa } from '../../../models/pessoa.model';
import { onlyDigits, maskCpfCnpj, isValidCpf, isValidCnpj } from '../../../shared/utils/documento.util';
import { take } from 'rxjs/operators';
import { EnderecoComponent } from "../../../shared/components/endereco/endereco";
import { NgxMaskPipe } from 'ngx-mask';
import { MaterialModule } from '../../../shared/material.module';
import { SharedModule } from '../../../shared/shared.module';

// IMPORTANTE: ajuste a assinatura do seu componente de endereço se necessário
// Ex.: <app-endereco [formGroup]="form.controls.endereco" />
// Aqui vamos criar um FormGroup 'endereco' para passarmos para o componente filho.

function docValidatorFor(tipoCtrl: () => TipoPessoa | '') {
  return (control: AbstractControl): ValidationErrors | null => {
    const tipo = tipoCtrl();
    const digits = onlyDigits(control.value);
    if (!digits) return { required: true };
    if (tipo === 'FISICA' && !isValidCpf(digits)) return { cpf: true };
    if (tipo === 'JURIDICA' && !isValidCnpj(digits)) return { cnpj: true };
    return null;
  };
}

@Component({
  selector: 'app-pessoa-form',
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    ReactiveFormsModule,
    EnderecoComponent,
    SharedModule
],
  templateUrl: './pessoa-form.component.html',
  styleUrls: ['./pessoa-form.component.scss']
})
export class PessoaFormComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(PessoasService);

  id = signal<string | null>(null);
  modoEdicao = computed(() => !!this.id());
  loading = signal(false);
  saving = signal(false);
  errorMsg = signal<string | null>(null);

  // form
  form = this.fb.group({
    tipo: ['FISICA' as TipoPessoa, [Validators.required]],
    // PF
    nome: ['',[/* required quando PF (dinâmico abaixo) */]],
    nascimento: [''], // YYYY-MM-DD
    // PJ
    razaoSocial: [''],
    nomeFantasia: [''], // opcional; usaremos "nome" no DTO como fantasia quando PJ
    // comum
    documento: ['', []], // validador dinâmico conforme tipo
    endereco: this.fb.group({
      cep: [''],
      logradouro: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      estado: [null], // ou idEstado
      cidade: [null], // ou idCidade
      uf: [''],       // se o filho usar UF em vez de estado
      // ... qualquer outro que o <app-endereco> exija
    }),
  });

  // máscara do documento no input
  maskDocumento(value: string) {
    const masked = maskCpfCnpj(value);
    this.form.controls.documento.setValue(masked, { emitEvent: false });
  }

  constructor() {
    // id da rota
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      this.carregarEdicao(id);
    }

    // validadores dinâmicos
    this.form.controls.tipo.valueChanges.subscribe(() => this.aplicarValidadoresPorTipo());
    this.aplicarValidadoresPorTipo();

    // normalizar data (opcional — se usar <input type="date"> já vem em yyyy-MM-dd)
  }

  private aplicarValidadoresPorTipo() {
    const tipo = this.form.controls.tipo.value as TipoPessoa;

    // documento
    this.form.controls.documento.setValidators([docValidatorFor(() => this.form.controls.tipo.value || '')]);
    this.form.controls.documento.updateValueAndValidity({ emitEvent: false });

    // PF
    if (tipo === 'FISICA') {
      this.form.controls.nome.addValidators([Validators.required, Validators.minLength(3)]);
      this.form.controls.nascimento.clearValidators(); // deixe opcional ou coloque validação de data válida se quiser
      this.form.controls.razaoSocial.clearValidators();

    } else {
      // PJ
      this.form.controls.razaoSocial.addValidators([Validators.required, Validators.minLength(3)]);
      this.form.controls.nome.clearValidators(); // nome fantasia opcional
      this.form.controls.nascimento.clearValidators();
    }

    // atualizar validity
    this.form.controls.nome.updateValueAndValidity({ emitEvent: false });
    this.form.controls.razaoSocial.updateValueAndValidity({ emitEvent: false });
    this.form.controls.nascimento.updateValueAndValidity({ emitEvent: false });
  }

  private carregarEdicao(id: string) {
    this.loading.set(true);
    this.service.obter(id).pipe(take(1)).subscribe({
      next: (p: PessoaListItem) => {
        this.loading.set(false);
        // mapear retorno para o form
        this.form.patchValue({
          tipo: p.tipo,
          nome: p.tipo === 'FISICA' ? p.nome : '',           // PF
          nomeFantasia: p.tipo === 'JURIDICA' ? p.nome : '', // PJ: se você armazena fantasia em "nome"
          razaoSocial: p.razaoSocial ?? '',
          documento: maskCpfCnpj(p.documento ?? ''),
          nascimento: p.nascimento ?? '',
          // endereco: se tiver endpoint que retorna objeto do endereço, popular aqui
        }, { emitEvent: false });
        this.aplicarValidadoresPorTipo();
      },
      error: err => {
        console.error(err);
        this.loading.set(false);
        this.errorMsg.set('Não foi possível carregar os dados.');
      }
    });
  }

  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const tipo = this.form.controls.tipo.value as TipoPessoa;
    const docDigits = onlyDigits(this.form.controls.documento.value || '');

    // construir DTO
    const dtoCreate: PessoaCreateRequest = {
      tipo,
      documento: docDigits,
      nome: tipo === 'FISICA' ? (this.form.controls.nome.value || '') : (this.form.controls.nomeFantasia.value || ''),
      razaoSocial: tipo === 'JURIDICA' ? (this.form.controls.razaoSocial.value || '') : null,
      nascimento: tipo === 'FISICA' ? (this.form.controls.nascimento.value || null) : null,
      // Endereço:
      // Se seu <app-endereco> gera um objeto { cep, logradouro, ... }, envie em 'endereco'
      // Se ele já cria e devolve um Id, troque para enderecoId.
      endereco: this.form.controls.endereco.getRawValue()
    };

    this.saving.set(true);
    const obs = this.modoEdicao()
      ? this.service.atualizar(this.id()!, { id: this.id()!, ...dtoCreate })
      : this.service.criar(dtoCreate);

    obs.pipe(take(1)).subscribe({
      next: _ => {
        this.saving.set(false);
        this.router.navigate(['/pessoas']);
      },
      error: err => {
        console.error(err);
        this.saving.set(false);
        this.errorMsg.set('Falha ao salvar. Verifique os campos e tente novamente.');
      }
    });
  }

  cancelar() {
    this.router.navigate(['/pessoas']);
  }

  get enderecoForm(): FormGroup {
    return this.form.get('endereco') as FormGroup;
  }
}
