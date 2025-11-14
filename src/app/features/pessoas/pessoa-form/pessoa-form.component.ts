import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, signal, computed, ViewChild, ChangeDetectorRef, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PessoasService } from '../../../core/services/pessoas.service';
import { PessoaCreateRequest, PessoaDto, PessoaUpdateRequest, TipoPessoa } from '../../../models/pessoa.model';
import { onlyDigits, maskCpfCnpj, isValidCpf, isValidCnpj } from '../../../shared/utils/documento.util';
import { take } from 'rxjs/operators';
import { EnderecoComponent } from "../../../shared/components/endereco/endereco";
import { NgxMaskPipe } from 'ngx-mask';
import { MaterialModule } from '../../../shared/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { firstValueFrom } from 'rxjs';
import { CidadeService } from '../../../core/services/cidade.service';
import { MatSelectChange } from '@angular/material/select';
import { Origem } from '../../../models/origem.model';
import { OrigensService } from '../../../core/services/origens.service';
import { DadosComplementaresComponent } from './dados-complementares/dados-complementares';
import { DadosConjuge } from './dados-conjuge/dados-conjuge';

// ---- NOVO: tipo local para estado civil (ajuste se já existir em outro lugar)
type EstadoCivil = 'SOLTEIRO' | 'CASADO' | 'DIVORCIADO' | 'VIUVO' | 'SEPARADO';

function docValidatorFor(tipoCtrl: () => TipoPessoa | '') {
  return (control: AbstractControl): ValidationErrors | null => {
    const tipo = tipoCtrl();
    const digits = onlyDigits(control.value);
    if (!digits) return { required: true };
    if (tipo === 'PF' && !isValidCpf(digits)) return { cpf: true };
    if (tipo === 'PJ' && !isValidCnpj(digits)) return { cnpj: true };
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
    SharedModule,
    DadosComplementaresComponent
  ],
  templateUrl: './pessoa-form.component.html',
  styleUrls: ['./pessoa-form.component.scss']
})
export class PessoaFormComponent implements OnInit{
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private origensService = inject(OrigensService);
  private router = inject(Router);
  private service = inject(PessoasService);
  private cidadeService = inject(CidadeService);

  @ViewChild(EnderecoComponent) enderecoCmp!: EnderecoComponent;

  id = signal<string | null>(null);
  modoEdicao = computed(() => !!this.id());
  loading = signal(false);
  saving = signal(false);
  errorMsg = signal<string | null>(null);
  origens: Origem[] = [];

  // ---- FORM
  form = this.fb.group({
    tipo: ['PF' as TipoPessoa, [Validators.required]],
    // PF
    nome: ['',[/* required quando PF (dinâmico abaixo) */]],
    dataNascimento: [''],
    rg: [''],
    orgaoExpedidor: [''],
    nacionalidade: [''],
    // ---- NOVO: estado civil (controla exibição/validação do cônjuge)
    estadoCivil: ['SOLTEIRO' as EstadoCivil, [Validators.required]],
    // PJ
    razaoSocial: [''],
    nomeFantasia: [''], // opcional; usaremos "nome" no DTO como fantasia quando PJ
    // comum
    documento: ['', []], // validador dinâmico conforme tipo
    origemId: [null as string | null, [Validators.required]],
    endereco: this.fb.group({
      cep: [''],
      logradouro: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      estadoId: [null],
      cidadeId: [null]
    }),
    // ---- NOVO: grupos extras
    conjuge: this.fb.group({
      nome: [null as string | null],
      cpf: [null as string | null],
      dataNascimento: [null as string | null],
      telefone: [null as string | null],
      email: [null as string | null, [Validators.email]]
    }),
    dadosComplementares: this.fb.group({
      profissao: [null as string | null],
      escolaridade: [null as string | null],
      rendaMensal: [null as number | null],
      observacoes: [null as string | null]
    })
  });

  // máscara do documento no input
  maskDocumento(value: string) {
    const masked = maskCpfCnpj(value);
    this.form.controls.documento.setValue(masked, { emitEvent: false });
  }

  async ngOnInit(): Promise<void> {
    this.origens = await this.origensService.getAllLight();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      await this.carregarEdicao(id);
    }
  }

  constructor(private cdr: ChangeDetectorRef) {
    // reações
    this.form.controls.tipo.valueChanges.subscribe(() => this.aplicarValidadoresPorTipo());
    this.form.controls.estadoCivil.valueChanges.subscribe(() => this.aplicarObrigatoriedadeConjuge());
    this.aplicarValidadoresPorTipo();
    this.aplicarObrigatoriedadeConjuge();
  }

  private aplicarValidadoresPorTipo() {
    const tipo = this.form.controls.tipo.value as TipoPessoa;

    // documento
    this.form.controls.documento.setValidators([docValidatorFor(() => this.form.controls.tipo.value || '')]);
    this.form.controls.documento.updateValueAndValidity({ emitEvent: false });

    // PF x PJ
    if (tipo === 'PF') {
      this.form.controls.nome.addValidators([Validators.required, Validators.minLength(3)]);
      this.form.controls.dataNascimento.clearValidators();
      this.form.controls.razaoSocial.clearValidators();
    } else {
      this.form.controls.razaoSocial.addValidators([Validators.required, Validators.minLength(3)]);
      this.form.controls.nome.clearValidators();
      this.form.controls.dataNascimento.clearValidators();
      // Quando vira PJ, garantimos que cônjuge não participe do payload
      this.form.controls.conjuge.reset();
    }

    this.form.controls.nome.updateValueAndValidity({ emitEvent: false });
    this.form.controls.razaoSocial.updateValueAndValidity({ emitEvent: false });
    this.form.controls.dataNascimento.updateValueAndValidity({ emitEvent: false });

    // Reaplica obrigatoriedade do cônjuge conforme PF/CASADO
    this.aplicarObrigatoriedadeConjuge();
  }

  // ---- NOVO: obrigatoriedade condicional do cônjuge
  private aplicarObrigatoriedadeConjuge() {
    const tipo = this.form.controls.tipo.value as TipoPessoa;
    const casado = this.form.controls.estadoCivil.value === 'CASADO';

    const g = this.form.controls.conjuge as FormGroup;
    const nomeCtrl = g.get('nome')!;
    const cpfCtrl = g.get('cpf')!;

    if (tipo === 'PF' && casado) {
      nomeCtrl.addValidators([Validators.required, Validators.minLength(3)]);
      cpfCtrl.addValidators([(c: AbstractControl) => {
        const digits = onlyDigits(c.value || '');
        if (!digits) return { required: true };
        return isValidCpf(digits) ? null : { cpf: true };
      }]);
    } else {
      nomeCtrl.clearValidators();
      cpfCtrl.clearValidators();
      // limpamos se deixou de ser casado para não “vazar” no payload
      g.reset();
    }
    nomeCtrl.updateValueAndValidity({ emitEvent: false });
    cpfCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private async carregarEdicao(id: string) {
    try {
      this.loading.set(true);

      this.origens = await this.origensService.getAllLight();

      const p: PessoaDto = await firstValueFrom(this.service.obter(id));

      console.log(p);

      // Tentamos obter estadoCivil/conjuge/dadosComplementares se já existirem no DTO da API
      const anyP = p as any;

      this.form.patchValue({
        tipo: p.tipoPessoa,
        nome: p.tipoPessoa === 'PF' ? p.nome : '',
        nomeFantasia: p.tipoPessoa === 'PJ' ? p.nome : '',
        razaoSocial: p.razaoSocial ?? '',
        documento: maskCpfCnpj(p.documento ?? ''),
        dataNascimento: p.dataNascimento ?? '',
        origemId: p.origemId,
        estadoCivil: (anyP.estadoCivil as EstadoCivil) ?? 'SOLTEIRO',
        conjuge: anyP.conjuge ?? null,
        dadosComplementares: anyP.dadosComplementares ?? null
      }, { emitEvent: false });

      this.aplicarValidadoresPorTipo();

      if (!p.endereco) { this.loading.set(false); return; }

      const cidadeApi = await firstValueFrom(this.cidadeService.obterPorId(p.endereco.cidadeId));
      const estadoId = cidadeApi.estadoId;
      const cidadeId = cidadeApi.id;

      this.enderecoForm.patchValue({
        cep: p.endereco.cep ?? '',
        logradouro: p.endereco.logradouro ?? '',
        numero: p.endereco.numero ?? '',
        complemento: p.endereco.complemento ?? '',
        bairro: p.endereco.bairro ?? '',
        estadoId: estadoId,
        cidadeId: null, // zera antes
      }, { emitEvent: true });

      await Promise.resolve();
      this.enderecoCmp?.onEstadoChange?.();

      setTimeout(() => {
        this.enderecoForm.get('cidadeId')?.setValue(cidadeId, { emitEvent: false });
      }, 100);

      this.loading.set(false);
    } catch (err) {
      console.error(err);
      this.loading.set(false);
      this.errorMsg.set('Não foi possível carregar os dados.');
    }
  }

  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const tipo = this.form.controls.tipo.value as TipoPessoa;
    const docDigits = onlyDigits(this.form.controls.documento.value || '');
    const casado = this.form.controls.estadoCivil.value === 'CASADO';

    // Montagem base
    const dtoCreate: any /* PessoaCreateRequest estendido */ = {
      tipo,
      documento: docDigits,
      nome: tipo === 'PF' ? (this.form.controls.nome.value || '') : (this.form.controls.nomeFantasia.value || ''),
      razaoSocial: tipo === 'PJ' ? (this.form.controls.razaoSocial.value || '') : null,
      dataNascimento: tipo === 'PF' ? (this.form.controls.dataNascimento.value || null) : null,
      endereco: this.form.controls.endereco.getRawValue(),
      origemId: this.form.controls.origemId.value ?? null,
      // ---- NOVO
      estadoCivil: this.form.controls.estadoCivil.value as EstadoCivil,
      dadosComplementares: (this.form.controls.dadosComplementares.getRawValue() ?? null)
    };

    // inclui/ignora cônjuge
    if (tipo === 'PF' && casado) {
      dtoCreate.conjuge = (this.form.controls.conjuge.getRawValue() ?? null);
    } else {
      dtoCreate.conjuge = null;
    }

    this.saving.set(true);
    const obs = this.modoEdicao()
      ? this.service.atualizar(this.id()!, { id: this.id()!, ...dtoCreate } as PessoaUpdateRequest as any)
      : this.service.criar(dtoCreate as PessoaCreateRequest as any);

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

  hintOrigem(oid: string | null): string {
    if (!oid) return 'Sem origem vinculada';
    const o = this.origens.find(x => x.id === oid);
    return o ? `Selecionado: ${o.nome}` : '';
  }

  get enderecoForm(): FormGroup {
    return this.form.get('endereco') as FormGroup;
  }

  private waitFor(check: () => boolean, { interval = 25, timeout = 3000 } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const timer = setInterval(() => {
        if (check()) { clearInterval(timer); resolve(); }
        else if (Date.now() - start > timeout) { clearInterval(timer); reject(new Error('timeout')); }
      }, interval);
    });
  }
}
