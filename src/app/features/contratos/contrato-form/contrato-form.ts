import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';

import { MaterialModule } from '../../../shared/material.module';
import { ContratosService } from '../../../core/services/contratos.service';
import {
  ContratoResponse,
  ContratoChecklistEntrada,
  ContratoChecklistSaida,
  CriarContratoRequest,
  AtualizarContratoRequest,
  PapelContrato,
  StatusContrato,
  TipoContrato,
} from '../../../models/contrato.models';

import { PessoasLookupService, LookupItem } from '../../../core/services/pessoas-lookup.service';
import { ImoveisLookupService } from '../../../core/services/imoveis-lookup.service';

type ParteFg = FormGroup<{
  pessoa: FormControl<LookupItem | null>;
  pessoaId: FormControl<string>;
  papel: FormControl<number | null>;
  percentual: FormControl<number | null>;
}>;

type ContratoFormFg = FormGroup<{
  tipo: FormControl<number>;
  status: FormControl<number>;
  imovel: FormControl<LookupItem | null>;
  imovelId: FormControl<string>;
  inicioVigencia: FormControl<Date | null>;
  fimVigencia: FormControl<Date | null>;
  partes: FormArray<ParteFg>;
}>;

@Component({
  selector: 'app-contrato-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MaterialModule],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }
  ],
  templateUrl: './contrato-form.html',
  styleUrls: ['./contrato-form.scss'],
})
export class ContratoFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  id: string | null = null;
  carregando = false;
  contrato: ContratoResponse | null = null;

  readonly TipoContrato = TipoContrato;
  readonly StatusContrato = StatusContrato;
  readonly PapelContrato = PapelContrato;

  // lookups
  imoveisFiltrados: LookupItem[] = [];
  sugestoesPessoas = new Map<any, LookupItem[]>();

  form!: ContratoFormFg;

  // Checklists
  carregandoChecklistEntrada = false;
  checklistEntrada: ContratoChecklistEntrada | null = null;
  formChecklistEntrada!: FormGroup;

  carregandoChecklistSaida = false;
  checklistSaida: ContratoChecklistSaida | null = null;
  formChecklistSaida!: FormGroup;

  get partes(): FormArray<ParteFg> {
    return this.form.controls.partes;
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private snack: MatSnackBar,
    private contratosService: ContratosService,
    private pessoasLookup: PessoasLookupService,
    private imoveisLookup: ImoveisLookupService,
    private dateAdapter: DateAdapter<Date>
  ) {
    this.dateAdapter.setLocale('pt-BR');
  }

  ngOnInit(): void {
    this.buildForm();

    this.id = this.route.snapshot.paramMap.get('id');

    // inicia partes conforme tipo default
    this.rebuildPartes(this.form.controls.tipo.value);
    this.validarFimObrigatorio(this.form.controls.tipo.value);

    // quando muda tipo, recria partes
    this.form.controls.tipo.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((tipo) => {
        this.rebuildPartes(tipo);
        this.validarFimObrigatorio(tipo);
      });

    // autocomplete imóvel
    this.form.controls.imovel.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((val) => {
          const termo = typeof val === 'string' ? val : (val?.label ?? '');
          if (!termo || termo.length < 2) return of<LookupItem[]>([]);
          return this.imoveisLookup.buscar(termo);
        })
      )
      .subscribe((items) => (this.imoveisFiltrados = items));

    if (this.id) {
      this.carregarContrato(this.id);
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      tipo: this.fb.control<number>(TipoContrato.Locacao, { nonNullable: true, validators: [Validators.required] }),
      status: this.fb.control<number>(StatusContrato.Rascunho, { nonNullable: true, validators: [Validators.required] }),
      imovel: this.fb.control<LookupItem | null>(null, { validators: [Validators.required] }),
      imovelId: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required] }),
      inicioVigencia: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
      fimVigencia: this.fb.control<Date | null>(null),
      partes: this.fb.array<ParteFg>([]),
    });

    this.formChecklistEntrada = this.fb.group({
      assinadoEm: this.fb.control<Date | null>(null),
      seguroIncendio: this.fb.control<string>(''),
      chaves: this.fb.control<string>(''),
      energia: this.fb.control<string>(''),
      agua: this.fb.control<string>(''),
      gas: this.fb.control<string>(''),
      condominio: this.fb.control<string>(''),
      iptuGaragem: this.fb.control<string>(''),
      iptu: this.fb.control<string>(''),
      vistoriaEntradaEm: this.fb.control<Date | null>(null),
      manutencao: this.fb.control<string>(''),
      observacoesFinais: this.fb.control<string>(''),
      bonusLocacao: this.fb.control<string>(''),
      dataPagamentoBonus: this.fb.control<Date | null>(null),
    });

    this.formChecklistSaida = this.fb.group({
      motivoSaida: this.fb.control<string>(''),
      aluguel: this.fb.control<string>(''),
      multaContratual: this.fb.control<string>(''),
      avisoSaidaEm: this.fb.control<Date | null>(null),
      chaves: this.fb.control<string>(''),
      avisoProprietario: this.fb.control<string>(''),
      energia: this.fb.control<string>(''),
      gas: this.fb.control<string>(''),
      agua: this.fb.control<string>(''),
      condominio: this.fb.control<string>(''),
      iptu: this.fb.control<string>(''),
      vistoriaSaidaEm: this.fb.control<Date | null>(null),
      pinturaManutencao: this.fb.control<string>(''),
      reativarImovelNoSite: this.fb.control<string>(''),
      cancelamentoSeguroFianca: this.fb.control<string>(''),
    });
  }

  private carregarContrato(id: string): void {
    this.carregando = true;
    this.contratosService.obterPorId(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (c) => {
          this.contrato = c;
          this.carregando = false;

          // Evita loops de eventos ao carregar os dados
          this.form.controls.tipo.setValue(c.tipo, { emitEvent: false });
          this.form.controls.status.setValue(c.status, { emitEvent: false });
          this.form.controls.imovelId.setValue(c.imovelId, { emitEvent: false });
          
          const imovelLabel = c.codigoImovel ? `${c.codigoImovel} - ${c.tituloImovel}` : `Imóvel ${c.imovelId}`;
          this.form.controls.imovel.setValue({ id: c.imovelId, label: imovelLabel }, { emitEvent: false });

          this.form.controls.inicioVigencia.setValue(this.parseDateOnly(c.inicioVigencia), { emitEvent: false });
          this.form.controls.fimVigencia.setValue(c.fimVigencia ? this.parseDateOnly(c.fimVigencia) : null, { emitEvent: false });

          // preenche partes vindas do back
          this.partes.clear();
          for (const p of c.partes ?? []) {
            this.partes.push(this.criarParteFg(p.papel, {
              id: p.pessoaId,
              label: p.pessoaNome
            }, p.percentual ?? null));
          }

          this.validarFimObrigatorio(c.tipo);
          this.form.markAsPristine();

          // Se for locação, carrega os checklists
          if (c.tipo === TipoContrato.Locacao) {
            this.carregarChecklistEntrada(id);
            this.carregarChecklistSaida(id);
          }
        },
        error: (err) => {
          this.carregando = false;
          this.snack.open(err?.error?.error ?? 'Erro ao carregar contrato', 'Fechar', { duration: 4000 });
          this.router.navigate(['/contratos']);
        },
      });
  }

  private carregarChecklistEntrada(id: string): void {
    this.carregandoChecklistEntrada = true;
    this.contratosService.obterChecklistEntrada(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.checklistEntrada = res;
          this.carregandoChecklistEntrada = false;

          this.formChecklistEntrada.patchValue({
            assinadoEm: res.assinadoEm ? this.parseDateOnly(res.assinadoEm) : null,
            seguroIncendio: res.seguroIncendio ?? '',
            chaves: res.chaves ?? '',
            energia: res.energia ?? '',
            agua: res.agua ?? '',
            gas: res.gas ?? '',
            condominio: res.condominio ?? '',
            iptuGaragem: res.iptuGaragem ?? '',
            iptu: res.iptu ?? '',
            vistoriaEntradaEm: res.vistoriaEntradaEm ? this.parseDateOnly(res.vistoriaEntradaEm) : null,
            manutencao: res.manutencao ?? '',
            observacoesFinais: res.observacoesFinais ?? '',
            bonusLocacao: res.bonusLocacao ?? '',
            dataPagamentoBonus: res.dataPagamentoBonus ? this.parseDateOnly(res.dataPagamentoBonus) : null,
          });
        },
        error: () => {
          this.carregandoChecklistEntrada = false;
        }
      });
  }

  private carregarChecklistSaida(id: string): void {
    this.carregandoChecklistSaida = true;
    this.contratosService.obterChecklistSaida(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.checklistSaida = res;
          this.carregandoChecklistSaida = false;

          this.formChecklistSaida.patchValue({
            motivoSaida: res.motivoSaida ?? '',
            aluguel: res.aluguel ?? '',
            multaContratual: res.multaContratual ?? '',
            avisoSaidaEm: res.avisoSaidaEm ? this.parseDateOnly(res.avisoSaidaEm) : null,
            chaves: res.chaves ?? '',
            avisoProprietario: res.avisoProprietario ?? '',
            energia: res.energia ?? '',
            gas: res.gas ?? '',
            agua: res.agua ?? '',
            condominio: res.condominio ?? '',
            iptu: res.iptu ?? '',
            vistoriaSaidaEm: res.vistoriaSaidaEm ? this.parseDateOnly(res.vistoriaSaidaEm) : null,
            pinturaManutencao: res.pinturaManutencao ?? '',
            reativarImovelNoSite: res.reativarImovelNoSite ?? '',
            cancelamentoSeguroFianca: res.cancelamentoSeguroFianca ?? '',
          });
        },
        error: () => {
          this.carregandoChecklistSaida = false;
        }
      });
  }

  // ---------- UI helpers ----------
  displayLookup = (item: LookupItem | null): string => item?.label ?? '';

  tipoLabel(tipo: number): string {
    return TipoContrato[tipo] ?? `Tipo ${tipo}`;
  }

  papelLabel(papel: number): string {
    return PapelContrato[papel] ?? `Papel ${papel}`;
  }

  statusLabel(status: number): string {
    return StatusContrato[status] ?? `Status ${status}`;
  }

  // ---------- Regras de papéis ----------
  get papeisDisponiveis(): number[] {
    const tipo = this.form.controls.tipo.value;

    if (tipo === TipoContrato.Locacao) {
      return [PapelContrato.Locador, PapelContrato.Locatario, PapelContrato.Fiador];
    }

    return [PapelContrato.Vendedor, PapelContrato.Comprador];
  }

  isParteObrigatoria(papel: number | null): boolean {
    const tipo = this.form.controls.tipo.value;

    if (tipo === TipoContrato.Locacao) {
      return papel === PapelContrato.Locador || papel === PapelContrato.Locatario;
    }

    return papel === PapelContrato.Vendedor || papel === PapelContrato.Comprador;
  }

  papelDisabled(papel: number, indexAtual: number): boolean {
    const tipo = this.form.controls.tipo.value;

    if (tipo === TipoContrato.Locacao) {
      if (papel === PapelContrato.Locador || papel === PapelContrato.Locatario) {
        return this.partes.controls.some((p, i) =>
          i !== indexAtual && p.controls.papel.value === papel
        );
      }

      if (papel === PapelContrato.Fiador) {
        return this.partes.controls.some((p, i) =>
          i !== indexAtual && p.controls.papel.value === PapelContrato.Fiador
        );
      }
    }

    return false;
  }

  addParte(): void {
    const tipo = this.form.controls.tipo.value;

    if (tipo === TipoContrato.Locacao) {
      const jaTemFiador = this.partes.controls.some(p => p.controls.papel.value === PapelContrato.Fiador);
      if (jaTemFiador) {
        this.snack.open('Já existe um fiador neste contrato.', 'Fechar', { duration: 2500 });
        return;
      }
    }

    this.partes.push(this.criarParteFg(null));
  }

  onPapelChanged(index: number): void {
    const fg = this.partes.at(index);
    const papel = fg.controls.papel.value;

    if (papel != null && this.papelDisabled(papel, index)) {
      fg.controls.papel.setValue(null);
      this.snack.open('Esse tipo de parte já foi informado.', 'Fechar', { duration: 2500 });
      return;
    }

    fg.controls.pessoa.setValue(null);
    fg.controls.pessoaId.setValue('');
    fg.controls.percentual.setValue(null);
  }

  // ---------- Partes ----------
  private rebuildPartes(tipo: number): void {
    this.partes.clear();

    if (tipo === TipoContrato.Locacao) {
      this.partes.push(this.criarParteFg(PapelContrato.Locador));
      this.partes.push(this.criarParteFg(PapelContrato.Locatario));
    } else {
      this.partes.push(this.criarParteFg(PapelContrato.Vendedor));
      this.partes.push(this.criarParteFg(PapelContrato.Comprador));
    }

    this.sugestoesPessoas.clear();
  }

  removerParte(index: number): void {
    const fg = this.partes.at(index);
    const papel = fg.controls.papel.value;

    if (this.isParteObrigatoria(papel)) {
      this.snack.open('Essa parte é obrigatória.', 'Fechar', { duration: 2500 });
      return;
    }

    this.sugestoesPessoas.delete(fg);
    this.partes.removeAt(index);
  }

  private criarParteFg(papel: number | null, pessoa?: LookupItem | null, percentual?: number | null): ParteFg {
    const fg = this.fb.group({
      pessoa: this.fb.control<LookupItem | null>(pessoa ?? null, { validators: [Validators.required] }),
      pessoaId: this.fb.control<string>(pessoa?.id ?? '', { nonNullable: true, validators: [Validators.required] }),
      papel: this.fb.control<number | null>(papel, { validators: [Validators.required] }),
      percentual: this.fb.control<number | null>(percentual ?? null),
    });

    // Subscrição reativa limpa para autocomplemento de Pessoa por item da lista
    fg.controls.pessoa.valueChanges
      .pipe(
        takeUntil(this.destroy$),
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((val) => {
          const termo = typeof val === 'string' ? val : (val?.label ?? '');
          if (!termo || termo.length < 2) return of<LookupItem[]>([]);
          return this.pessoasLookup.buscar(termo);
        })
      )
      .subscribe((items) => {
        this.sugestoesPessoas.set(fg, items);
      });

    fg.controls.pessoa.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((v) => {
        if (v && typeof v !== 'string') {
          fg.controls.pessoaId.setValue(v.id);
        } else {
          fg.controls.pessoaId.setValue('');
        }
      });

    return fg;
  }

  // ---------- Imóvel ----------
  onImovelSelected(item: LookupItem): void {
    this.form.controls.imovelId.setValue(item.id);
  }

  // ---------- Validations ----------
  private validarFimObrigatorio(tipo: number): void {
    const fim = this.form.controls.fimVigencia;

    if (tipo === TipoContrato.Locacao) {
      fim.addValidators([Validators.required]);
    } else {
      fim.clearValidators();
    }
    fim.updateValueAndValidity({ emitEvent: false });
  }

  private toDateOnlyString(d: Date | null | undefined): string | null {
    if (!d) return null;
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private parseDateOnly(s: string): Date {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // ---------- Actions ----------
  salvarRascunho(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open('Corrija os campos obrigatórios.', 'Fechar', { duration: 3000 });
      return;
    }

    const req: CriarContratoRequest = {
      tipo: this.form.controls.tipo.value,
      imovelId: this.form.controls.imovelId.value,
      inicioVigencia: this.toDateOnlyString(this.form.controls.inicioVigencia.value)!,
      fimVigencia: this.toDateOnlyString(this.form.controls.fimVigencia.value),
      partes: this.partes.controls.map(p => ({
        pessoaId: p.controls.pessoaId.value,
        papel: p.controls.papel.value!,
        percentual: p.controls.percentual.value ?? null
      })),
    };

    this.carregando = true;
    this.contratosService.criarRascunho(req)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.carregando = false;
          this.snack.open('Contrato criado como rascunho!', 'Fechar', { duration: 2500 });
          this.router.navigate(['/contratos/editar', res.id]);
        },
        error: (err) => {
          this.carregando = false;
          this.snack.open(err?.error?.error ?? 'Erro ao salvar rascunho', 'Fechar', { duration: 4000 });
        }
      });
  }

  salvarAlteracoes(): void {
    if (!this.id) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snack.open('Corrija os campos obrigatórios.', 'Fechar', { duration: 3000 });
      return;
    }

    const req: AtualizarContratoRequest = {
      imovelId: this.form.controls.imovelId.value,
      inicioVigencia: this.toDateOnlyString(this.form.controls.inicioVigencia.value)!,
      fimVigencia: this.toDateOnlyString(this.form.controls.fimVigencia.value),
      status: this.form.controls.status.value,
      partes: this.partes.controls.map(p => ({
        pessoaId: p.controls.pessoaId.value,
        papel: p.controls.papel.value!,
        percentual: p.controls.percentual.value ?? null
      })),
    };

    this.carregando = true;
    this.contratosService.atualizar(this.id, req)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.carregando = false;
          this.contrato = res;
          this.form.markAsPristine();
          this.snack.open('Contrato atualizado com sucesso!', 'Fechar', { duration: 2500 });
        },
        error: (err) => {
          this.carregando = false;
          this.snack.open(err?.error?.error ?? 'Erro ao salvar alterações', 'Fechar', { duration: 4000 });
        }
      });
  }

  imprimirContratoChecklist(): void {
    if (!this.id) return;
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/contratos/imprimir', this.id])
    );
    window.open(url, '_blank');
  }

  salvarChecklistEntrada(): void {
    if (!this.id) return;
    this.carregandoChecklistEntrada = true;

    const raw = this.formChecklistEntrada.value;
    const req: ContratoChecklistEntrada = {
      contratoId: this.id,
      assinadoEm: this.toDateOnlyString(raw.assinadoEm),
      seguroIncendio: raw.seguroIncendio,
      chaves: raw.chaves,
      energia: raw.energia,
      agua: raw.agua,
      gas: raw.gas,
      condominio: raw.condominio,
      iptuGaragem: raw.iptuGaragem,
      iptu: raw.iptu,
      vistoriaEntradaEm: this.toDateOnlyString(raw.vistoriaEntradaEm),
      manutencao: raw.manutencao,
      observacoesFinais: raw.observacoesFinais,
      bonusLocacao: raw.bonusLocacao,
      dataPagamentoBonus: this.toDateOnlyString(raw.dataPagamentoBonus)
    };

    this.contratosService.salvarChecklistEntrada(this.id, req)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.checklistEntrada = res;
          this.carregandoChecklistEntrada = false;
          this.snack.open('Checklist de Entrada salvo!', 'Fechar', { duration: 2500 });
        },
        error: (err) => {
          this.carregandoChecklistEntrada = false;
          this.snack.open(err?.error?.error ?? 'Erro ao salvar checklist de entrada', 'Fechar', { duration: 4000 });
        }
      });
  }

  salvarChecklistSaida(): void {
    if (!this.id) return;
    this.carregandoChecklistSaida = true;

    const raw = this.formChecklistSaida.value;
    const req: ContratoChecklistSaida = {
      contratoId: this.id,
      motivoSaida: raw.motivoSaida,
      aluguel: raw.aluguel,
      multaContratual: raw.multaContratual,
      avisoSaidaEm: this.toDateOnlyString(raw.avisoSaidaEm),
      chaves: raw.chaves,
      avisoProprietario: raw.avisoProprietario,
      energia: raw.energia,
      gas: raw.gas,
      agua: raw.agua,
      condominio: raw.condominio,
      iptu: raw.iptu,
      vistoriaSaidaEm: this.toDateOnlyString(raw.vistoriaSaidaEm),
      pinturaManutencao: raw.pinturaManutencao,
      reativarImovelNoSite: raw.reativarImovelNoSite,
      cancelamentoSeguroFianca: raw.cancelamentoSeguroFianca
    };

    this.contratosService.salvarChecklistSaida(this.id, req)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.checklistSaida = res;
          this.carregandoChecklistSaida = false;
          this.snack.open('Checklist de Saída salvo!', 'Fechar', { duration: 2500 });
        },
        error: (err) => {
          this.carregandoChecklistSaida = false;
          this.snack.open(err?.error?.error ?? 'Erro ao salvar checklist de saída', 'Fechar', { duration: 4000 });
        }
      });
  }

  ativar(): void {
    if (!this.id) return;

    this.carregando = true;
    this.contratosService.ativar(this.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.carregando = false;
          this.contrato = res;
          this.form.controls.status.setValue(res.status, { emitEvent: false });
          this.snack.open('Contrato ativado!', 'Fechar', { duration: 2500 });
        },
        error: (err) => {
          this.carregando = false;
          this.snack.open(err?.error?.error ?? 'Erro ao ativar', 'Fechar', { duration: 4000 });
        }
      });
  }

  cancelar(): void {
    if (!this.id) return;

    this.carregando = true;
    this.contratosService.cancelar(this.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.carregando = false;
          this.contrato = res;
          this.form.controls.status.setValue(res.status, { emitEvent: false });
          this.snack.open('Contrato cancelado.', 'Fechar', { duration: 2500 });
        },
        error: (err) => {
          this.carregando = false;
          this.snack.open(err?.error?.error ?? 'Erro ao cancelar', 'Fechar', { duration: 4000 });
        }
      });
  }

  encerrar(): void {
    if (!this.id) return;

    this.carregando = true;
    this.contratosService.encerrar(this.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.carregando = false;
          this.contrato = res;
          this.form.controls.status.setValue(res.status, { emitEvent: false });
          this.snack.open('Contrato encerrado.', 'Fechar', { duration: 2500 });
          this.router.navigate(['/contratos']);
        },
        error: (err) => {
          this.carregando = false;
          this.snack.open(err?.error?.error ?? 'Erro ao encerrar', 'Fechar', { duration: 4000 });
        }
      });
  }

  voltar(): void {
    this.router.navigate(['/contratos']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
