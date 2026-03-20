import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  signal,
  computed,
  ViewChild,
  ChangeDetectorRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
  FormGroup
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PessoasService } from '../../../core/services/pessoas.service';
import {
  PessoaCreateRequest,
  PessoaDto,
  PessoaUpdateRequest,
  TipoPessoa
} from '../../../models/pessoa.model';
import {
  onlyDigits,
  maskCpfCnpj,
  isValidCpf,
  isValidCnpj
} from '../../../shared/utils/documento.util';
import { take } from 'rxjs/operators';
import { EnderecoComponent } from '../../../shared/components/endereco/endereco';
import { MaterialModule } from '../../../shared/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { firstValueFrom, Subject, of, Observable } from 'rxjs';
import { CidadeService } from '../../../core/services/cidade.service';
import { Origem } from '../../../models/origem.model';
import { OrigensService } from '../../../core/services/origens.service';
import { DadosComplementaresComponent } from './dados-complementares/dados-complementares';
import { DadosConjuge } from './dados-conjuge/dados-conjuge';
import { ContatoDto } from '../../../models/contato.model';
import { DadosContato } from './dados-contato/dados-contato';
import { EstadoCivil } from '../../../models/enums.model';
import { Input } from '@angular/core';
import { CadastroPublicoService } from '../../../core/services/cadastro-publico.service';

// ✅ novos operators para o lookup por CPF
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  switchMap,
  takeUntil,
  tap
} from 'rxjs/operators';
import { NotificationService } from '../../../core/services/notification.service';

function isPessoaDto(x: any): x is PessoaDto {
  return (
    !!x &&
    typeof x === 'object' &&
    typeof x.id === 'string' &&
    typeof x.tipoPessoa === 'string' &&
    typeof x.documento === 'string'
  );
}

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

export type PessoaFormMode = 'public' | 'admin-edit';

@Component({
  selector: 'app-pessoa-form',
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    EnderecoComponent,
    SharedModule,
    DadosComplementaresComponent,
    DadosContato,
    DadosConjuge
  ],
  templateUrl: './pessoa-form.component.html',
  styleUrls: ['./pessoa-form.component.scss']
})
export class PessoaFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private origensService = inject(OrigensService);
  private router = inject(Router);
  private service = inject(PessoasService);
  private cidadeService = inject(CidadeService);
  private notify = inject(NotificationService);
  private cadastroPublicoService = inject(CadastroPublicoService);


  @Input() mode: PessoaFormMode = 'admin-edit'; // padrão interno
  @Input() token: string | null = null;         // no público
  @Input() hideOrigem = false;                  // no público geralmente sim
  @Input() hideHeaderActions = false;           // no público pode esconder "Voltar"

  @ViewChild(EnderecoComponent) enderecoCmp!: EnderecoComponent;

  // ✅ expõe enum pro template
  EstadoCivil = EstadoCivil;

  // ✅ evita reset do cônjuge durante load
  private carregandoEdicao = false;

  // ✅ para matar subscriptions
  private destroy$ = new Subject<void>();

  // ✅ guarda pessoa encontrada no lookup (se quiser usar no save depois)
  pessoaEncontradaId = signal<string | null>(null);
  cpfLookupLoading = signal(false);

  id = signal<string | null>(null);
  modoEdicao = computed(() => !!this.id());
  loading = signal(false);
  saving = signal(false);
  errorMsg = signal<string | null>(null);
  origens: Origem[] = [];

  // FORM
  form = this.fb.group({
    tipo: ['PF' as TipoPessoa, [Validators.required]],

    // PF
    nome: ['', []],
    dataNascimento: [''],
    rg: [''],
    orgaoExpedidor: [''],
    nacionalidade: [''],
    estadoCivil: [EstadoCivil.Solteiro as EstadoCivil, [Validators.required]],

    // PJ
    dataAbertura: [''],
    razaoSocial: [''],
    nomeFantasia: [''],
    inscricaoEstadual: [''],

    // comum
    documento: ['', []],
    origemId: [null as string | null, [Validators.required]],

    endereco: this.fb.group({
      cep: [''],
      logradouro: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      estadoId: [null as string | null],
      cidadeId: [null as string | null]
    }),

    conjuge: this.fb.group({
      nome: [null as string | null],
      cpf: [null as string | null],
      rg: [null as string | null],
      orgaoExpedidor: [null as string | null],
      dataNascimento: [null as string | null],
      telefone: [null as string | null],
      email: [null as string | null, [Validators.email]]
    }),

    dadosComplementares: this.fb.group({
      profissao: [null as string | null],
      escolaridade: [null as string | null],
      rendaMensal: [null as number | null],
      observacoes: [null as string | null]
    }),

    contatos: this.fb.control<ContatoDto[] | null>(null)
  });

  constructor(private cdr: ChangeDetectorRef) {
    this.form.controls.tipo.valueChanges.subscribe(() =>
      this.aplicarValidadoresPorTipo()
    );
    this.form.controls.estadoCivil.valueChanges.subscribe(() =>
      this.aplicarObrigatoriedadeConjuge()
    );

    this.aplicarValidadoresPorTipo();
    this.aplicarObrigatoriedadeConjuge();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // máscara do documento no input
  maskDocumento(value: string) {
    const v = value ?? '';
    const masked = v ? maskCpfCnpj(v) : '';
    this.form.controls.documento.setValue(masked, { emitEvent: false });
  }

  async ngOnInit(): Promise<void> {
    this.origens = await this.origensService.getAllLight();

    // ✅ ativa lookup por CPF (funciona no admin e no public)
    this.setupDocumentoLookup();

    if (this.mode === 'admin-edit') {
      const id = this.route.snapshot.paramMap.get('id');
      if (id) {
        this.id.set(id);
        await this.carregarEdicao(id);
      }
      return;
    }

    // ===== PUBLIC =====
    // 1) pega token
    const token = this.token ?? this.route.snapshot.paramMap.get('token');
    if (!token) {
      this.errorMsg.set('Token inválido.');
      return;
    }

    // 2) se no público você vai esconder "Origem", precisa ajustar validação
    if (this.hideOrigem) {
      const convite = this.origens.find(o => (o.nome ?? '').trim().toLowerCase() === 'site');

      if (!convite) {
        this.errorMsg.set('Origem padrão "Site" não encontrada. Cadastre a origem no sistema.');
        return;
      }

      this.form.controls.origemId.setValue(convite.id, { emitEvent: false });
    }

    // defaults
    this.form.controls.tipo.setValue('PF', { emitEvent: false });
  }

  // ✅ Carrega pessoa no form (serve para edição e para lookup por CPF)
  private async carregarPessoaNoForm(p: PessoaDto) {
    this.carregandoEdicao = true;

    const pf: any = p.dadosPessoaFisica ?? null;
    const pj: any = p.dadosPessoaJuridica ?? null;

    this.form.patchValue(
      {
        tipo: p.tipoPessoa,

        // PF
        nome: p.tipoPessoa === 'PF' ? p.nome : '',
        dataNascimento: pf?.dataNascimento ?? '',
        rg: pf?.rg ?? '',
        orgaoExpedidor: pf?.orgaoExpedidor ?? '',
        nacionalidade: pf?.nacionalidade ?? '',
        estadoCivil: (pf?.estadoCivil ?? EstadoCivil.Solteiro) as EstadoCivil,

        // PJ
        dataAbertura: pj?.dataAbertura ?? '',
        inscricaoEstadual: pj?.inscricaoEstadual ?? '',
        razaoSocial: pj?.razaoSocial ?? '',
        nomeFantasia: pj?.nomeFantasia ?? '',

        // comum
        documento: maskCpfCnpj(p.documento ?? ''),
        origemId: p.origemId ?? null,
        contatos: p.contatos ?? []
      },
      { emitEvent: false }
    );

    // ✅ conjuge vem no ROOT
    const conj: any = (p as any).conjuge ?? null;
    if (conj) {
      this.conjugeForm.patchValue(conj, { emitEvent: false });
    }

    // ✅ dadosComplementares vem no ROOT
    const dc: any = (p as any).dadosComplementares ?? null;
    if (dc) {
      this.dadosComplementaresForm.patchValue(dc, { emitEvent: false });
    }

    // revalida
    this.aplicarValidadoresPorTipo();
    this.aplicarObrigatoriedadeConjuge();

    // endereço
    if (p.endereco?.cidadeId) {
      const cidadeApi = await firstValueFrom(
        this.cidadeService.obterPorId(p.endereco.cidadeId)
      );

      const estadoId = cidadeApi.estadoId;
      const cidadeId = cidadeApi.id;

      this.enderecoForm.patchValue(
        {
          cep: p.endereco.cep ?? '',
          logradouro: p.endereco.logradouro ?? '',
          numero: p.endereco.numero ?? '',
          complemento: p.endereco.complemento ?? '',
          bairro: p.endereco.bairro ?? '',
          estadoId: estadoId,
          cidadeId: null
        },
        { emitEvent: true }
      );

      await Promise.resolve();
      await this.enderecoCmp?.onEstadoChange?.();

      setTimeout(() => {
        this.enderecoForm.get('cidadeId')?.setValue(cidadeId, { emitEvent: false });
      }, 50);
    }

    this.carregandoEdicao = false;
  }

  // ✅ Lookup por CPF usando a API /por-documento (que você disse que já está pronta)
  private setupDocumentoLookup() {
    this.form.controls.documento.valueChanges
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        map(v => onlyDigits(v || '')),
        tap(d => {
          if (d.length < 11) this.pessoaEncontradaId.set(null);
        }),
        filter(d => d.length === 11),
        filter(_ => (this.form.controls.tipo.value as TipoPessoa) === 'PF'),
        tap(() => this.cpfLookupLoading.set(true)),
        switchMap((cpf): Observable<PessoaDto | null> =>
          this.service.obterPorDocumento(cpf).pipe(
            catchError(() => of<PessoaDto | null>(null))
          )
        ),
        tap(() => this.cpfLookupLoading.set(false)),
        takeUntil(this.destroy$)
      )
      .subscribe((p: unknown) => {
        void this.onPessoaLookupResult(p);
      });
  }

  private async onPessoaLookupResult(p: unknown) {
    // null/undefined -> nada encontrado
    if (p == null) {
      this.pessoaEncontradaId.set(null);
      return;
    }

    // se não for PessoaDto, ignora (segurança)
    if (!isPessoaDto(p)) {
      this.pessoaEncontradaId.set(null);
      return;
    }

    // se estiver editando pela rota, não sobrescreve
    if (this.modoEdicao()) return;

    this.pessoaEncontradaId.set(p.id);
    await this.carregarPessoaNoForm(p);

    this.cdr.detectChanges();
  }

  private aplicarValidadoresPorTipo() {
    const tipo = this.form.controls.tipo.value as TipoPessoa;

    // documento
    this.form.controls.documento.setValidators([
      docValidatorFor(() => this.form.controls.tipo.value || '')
    ]);
    this.form.controls.documento.updateValueAndValidity({ emitEvent: false });

    // PF x PJ
    if (tipo === 'PF') {
      this.form.controls.nome.addValidators([
        Validators.required,
        Validators.minLength(3)
      ]);
      this.form.controls.dataNascimento.clearValidators();
      this.form.controls.razaoSocial.clearValidators();
    } else {
      this.form.controls.razaoSocial.addValidators([
        Validators.required,
        Validators.minLength(3)
      ]);
      this.form.controls.nome.clearValidators();
      this.form.controls.dataNascimento.clearValidators();

      (this.form.controls.conjuge as FormGroup).reset();
    }

    this.form.controls.nome.updateValueAndValidity({ emitEvent: false });
    this.form.controls.razaoSocial.updateValueAndValidity({ emitEvent: false });
    this.form.controls.dataNascimento.updateValueAndValidity({ emitEvent: false });

    this.aplicarObrigatoriedadeConjuge();
  }

  private aplicarObrigatoriedadeConjuge() {
    const tipo = this.form.controls.tipo.value as TipoPessoa;
    const casado = Number(this.form.controls.estadoCivil.value) === EstadoCivil.Casado;

    const g = this.form.controls.conjuge as FormGroup;
    const nomeCtrl = g.get('nome')!;
    const cpfCtrl = g.get('cpf')!;

    if (tipo === 'PF' && casado) {
      nomeCtrl.addValidators([Validators.required, Validators.minLength(3)]);
      cpfCtrl.addValidators([
        (c: AbstractControl) => {
          const digits = onlyDigits(c.value || '');
          if (!digits) return { required: true };
          return isValidCpf(digits) ? null : { cpf: true };
        }
      ]);
    } else {
      nomeCtrl.clearValidators();
      cpfCtrl.clearValidators();

      if (!this.carregandoEdicao) g.reset();
    }

    nomeCtrl.updateValueAndValidity({ emitEvent: false });
    cpfCtrl.updateValueAndValidity({ emitEvent: false });
  }

  private async carregarEdicao(id: string) {
    try {
      this.loading.set(true);
      this.carregandoEdicao = true;

      this.origens = await this.origensService.getAllLight();

      const p: PessoaDto = await firstValueFrom(this.service.obter(id));
      await this.carregarPessoaNoForm(p);

      this.carregandoEdicao = false;
      this.loading.set(false);
    } catch (err) {
      console.error(err);
      this.carregandoEdicao = false;
      this.loading.set(false);
      this.errorMsg.set('Não foi possível carregar os dados.');
    }
  }

  private buildDto(): PessoaCreateRequest & { id?: string } {
    const tipo = this.form.controls.tipo.value as TipoPessoa;
    const docDigits = onlyDigits(this.form.controls.documento.value || '');
    const casado = Number(this.form.controls.estadoCivil.value) === EstadoCivil.Casado;

    const dadosPF =
      tipo === 'PF'
        ? {
            nome: this.form.controls.nome.value || '',
            cpf: docDigits,
            dataNascimento: this.form.controls.dataNascimento.value || null,
            rg: this.form.controls.rg.value || null,
            orgaoExpedidor: this.form.controls.orgaoExpedidor.value || null,
            nacionalidade: this.form.controls.nacionalidade.value || null,
            estadoCivil: Number(this.form.controls.estadoCivil.value) as EstadoCivil
          }
        : null;

    const dadosPJ =
      tipo === 'PJ'
        ? {
            cnpj: docDigits,
            inscricaoEstadual: this.form.controls.inscricaoEstadual.value || '',
            razaoSocial: this.form.controls.razaoSocial.value || '',
            nomeFantasia: this.form.controls.nomeFantasia.value || null,
            dataAbertura: this.form.controls.dataAbertura.value || null
          }
        : null;

    const dto: PessoaCreateRequest & { id?: string } = {
      tipo,
      documento: docDigits,
      origemId: this.form.controls.origemId.value ?? null,
      endereco: this.form.controls.endereco.getRawValue(),
      dadosPessoaFisica: dadosPF,
      dadosPessoaJuridica: dadosPJ,
      contatos: (this.form.controls.contatos.value ?? []) as ContatoDto[],
      dadosComplementares: this.form.get('dadosComplementares')?.value ?? null,
      conjuge:
        casado && (this.form.controls.conjuge as FormGroup).valid
          ? (this.form.controls.conjuge.getRawValue() as any)
          : null
    };

    // ✅ AQUI ESTÁ O PULO DO GATO
    const pessoaId = this.pessoaEncontradaId();
    if (pessoaId) {
      dto.id = pessoaId;
    }

    return dto;
  }


  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const dto = this.buildDto();
    const pessoaId = this.pessoaEncontradaId();

    this.saving.set(true);

    let obs;

    if (this.mode === 'admin-edit') {
      obs = this.modoEdicao()
        ? this.service.atualizar(this.id()!, { id: this.id()!, ...dto } as PessoaUpdateRequest)
        : this.service.criar(dto);

    } else {
      // ✅ MODO PÚBLICO
      obs = pessoaId
        ? this.service.atualizar(pessoaId, { id: pessoaId, ...dto } as PessoaUpdateRequest)
        : this.service.criar(dto);
    }

    obs.pipe(take(1)).subscribe({
      next: async (res: any) => {
        this.saving.set(false);

        if (this.mode === 'public') {
          const token =
            this.route.snapshot.paramMap.get('token') ??
            this.route.parent?.snapshot.paramMap.get('token');

          if (!token) {
            this.notify.errorCenter('Token não encontrado para abrir a etapa de documentos.');
            return;
          }

          // 1) Descobre o pessoaId salvo
          let pessoaIdFinal =
            this.pessoaEncontradaId() ||
            res?.id || res?.pessoaId || null;

          // fallback: se criou e não voltou id, busca pelo documento
          if (!pessoaIdFinal) {
            const docDigits = onlyDigits(this.form.controls.documento.value || '');
            const p = await firstValueFrom(this.service.obterPorDocumento(docDigits));
            pessoaIdFinal = p?.id ?? null;
          }

          if (!pessoaIdFinal) {
            this.notify.errorCenter('Não foi possível identificar a pessoa salva.');
            return;
          }

          // 2) Vincula o token à pessoa (ESSENCIAL)
          await firstValueFrom(this.cadastroPublicoService.vincularPessoa(token, pessoaIdFinal));

          // 3) Agora sim navega
          this.notify.toastSuccess('Dados salvos!');
          this.router.navigateByUrl(`/cadastro-publico/${token}/documentos`);
          return;
        }

        // admin
        this.notify.successCenter('Os dados foram salvos!');
        this.router.navigate(['/pessoas']);
      },
      error: err => {
        console.error(err);
        this.saving.set(false);
        this.notify.errorCenter('Falha ao salvar. Verifique os campos e tente novamente');
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

  get conjugeForm(): FormGroup {
    return this.form.get('conjuge') as FormGroup;
  }

  get dadosComplementaresForm(): FormGroup {
    return this.form.get('dadosComplementares') as FormGroup;
  }
}
