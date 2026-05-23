import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of } from 'rxjs';
import { DateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';

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
import { NotificationService } from '../../../core/services/notification.service';

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

export interface CustomStep {
  id: string;
  label: string;
  tipo: 'text' | 'date' | 'boolean' | 'textarea';
  card: string;
  valor: any;
  isGlobal?: boolean;
}

@Component({
  selector: 'app-contrato-form',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, MaterialModule, MatCheckboxModule],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' }
  ],
  templateUrl: './contrato-form.html',
  styleUrls: ['./contrato-form.scss'],
})
export class ContratoFormComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  id: string | null = null;
  etapasPersonalizadasEntrada: CustomStep[] = [];
  etapasPersonalizadasSaida: CustomStep[] = [];
  formNovaEtapa!: FormGroup;
  tipoChecklistAtual: 'entrada' | 'saida' = 'entrada';

  readonly staticCardsEntrada = ["Assinatura & Entrega", "Contas & Utilidades", "IPTU", "Vistoria & Manutenção", "Bônus de Locação"];
  readonly staticCardsSaida = ["Rescisão & Saída", "Valores & Garantias", "Encerramento de Contas", "Entrega Física & Divulgação"];
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

  readonly checklistEntradaItems = [
    { key: 'assinadoEm', label: 'Assinatura', icon: 'assignment', domId: 'field-ent-assinado' },
    { key: 'seguroIncendio', label: 'Seg. Incêndio', icon: 'local_fire_department', domId: 'field-ent-seguro' },
    { key: 'chaves', label: 'Chaves', icon: 'vpn_key', domId: 'field-ent-chaves' },
    { key: 'energia', label: 'Energia', icon: 'bolt', domId: 'field-ent-energia' },
    { key: 'agua', label: 'Água', icon: 'opacity', domId: 'field-ent-agua' },
    { key: 'gas', label: 'Gás', icon: 'local_gas_station', domId: 'field-ent-gas' },
    { key: 'condominio', label: 'Condomínio', icon: 'domain', domId: 'field-ent-condominio' },
    { key: 'iptu', label: 'IPTU Principal', icon: 'receipt', domId: 'field-ent-iptu' },
    { key: 'iptuGaragem', label: 'IPTU Garagem', icon: 'directions_car', domId: 'field-ent-iptuGaragem' },
    { key: 'vistoriaEntradaEm', label: 'Vistoria Entrada', icon: 'build', domId: 'field-ent-vistoria' },
    { key: 'manutencao', label: 'Manutenção', icon: 'construction', domId: 'field-ent-manutencao' },
    { key: 'observacoesFinais', label: 'Obs. Finais', icon: 'comment', domId: 'field-ent-obs' },
    { key: 'bonusLocacao', label: 'Bônus Locação', icon: 'attach_money', domId: 'field-ent-bonus' },
    { key: 'dataPagamentoBonus', label: 'Pagto Bônus', icon: 'calendar_month', domId: 'field-ent-pagtoBonus' }
  ];

  readonly checklistSaidaItems = [
    { key: 'avisoSaidaEm', label: 'Aviso Saída', icon: 'calendar_month', domId: 'field-sai-aviso' },
    { key: 'motivoSaida', label: 'Motivo Saída', icon: 'help_outline', domId: 'field-sai-motivo' },
    { key: 'chaves', label: 'Chaves Dev.', icon: 'vpn_key', domId: 'field-sai-chaves' },
    { key: 'avisoProprietario', label: 'Aviso Prop.', icon: 'campaign', domId: 'field-sai-avisoProp' },
    { key: 'aluguel', label: 'Acerto Aluguel', icon: 'attach_money', domId: 'field-sai-aluguel' },
    { key: 'multaContratual', label: 'Multa Contrat.', icon: 'money_off', domId: 'field-sai-multa' },
    { key: 'cancelamentoSeguroFianca', label: 'Seguro Fiança', icon: 'verified_user', domId: 'field-sai-seguro' },
    { key: 'energia', label: 'Energia (UC)', icon: 'bolt', domId: 'field-sai-energia' },
    { key: 'gas', label: 'Gás', icon: 'local_gas_station', domId: 'field-sai-gas' },
    { key: 'agua', label: 'Água', icon: 'opacity', domId: 'field-sai-agua' },
    { key: 'condominio', label: 'Condomínio', icon: 'domain', domId: 'field-sai-condominio' },
    { key: 'iptu', label: 'IPTU Final', icon: 'receipt', domId: 'field-sai-iptu' },
    { key: 'vistoriaSaidaEm', label: 'Vistoria Saída', icon: 'build', domId: 'field-sai-vistoria' },
    { key: 'pinturaManutencao', label: 'Pintura/Manut.', icon: 'construction', domId: 'field-sai-pintura' },
    { key: 'reativarImovelNoSite', label: 'Reativar Site', icon: 'language', domId: 'field-sai-reativar' }
  ];

  get partes(): FormArray<ParteFg> {
    return this.form.controls.partes;
  }

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private contratosService: ContratosService,
    private pessoasLookup: PessoasLookupService,
    private imoveisLookup: ImoveisLookupService,
    private dateAdapter: DateAdapter<Date>,
    private dialog: MatDialog,
    private notification: NotificationService
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

    this.formNovaEtapa = this.fb.group({
      label: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
      tipo: this.fb.control('text', { nonNullable: true, validators: [Validators.required] }),
      card: this.fb.control('', { nonNullable: true, validators: [Validators.required] }),
      novoCardNome: this.fb.control(''),
      isGlobal: this.fb.control(false, { nonNullable: true }),
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
          this.notification.toastError(err?.error?.error ?? 'Erro ao carregar contrato');
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

          // Limpa controles dinâmicos de execuções anteriores
          this.etapasPersonalizadasEntrada.forEach(s => {
            this.formChecklistEntrada.removeControl(s.id);
          });

          if (res.etapasPersonalizadasJson) {
            try {
              this.etapasPersonalizadasEntrada = JSON.parse(res.etapasPersonalizadasJson);
            } catch (e) {
              this.etapasPersonalizadasEntrada = [];
            }
          } else {
            this.etapasPersonalizadasEntrada = [];
          }

          this.etapasPersonalizadasEntrada.forEach(step => {
            let val = step.valor;
            if (step.tipo === 'date' && typeof val === 'string' && val) {
              val = this.parseDateOnly(val);
            }
            if (step.tipo === 'boolean') {
              if (val === true || val === 'true') {
                val = 'Sim';
              } else if (val === false || val === 'false') {
                val = 'Não';
              }
            }
            this.formChecklistEntrada.addControl(step.id, this.fb.control(val));
          });

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

          // Limpa controles dinâmicos de execuções anteriores
          this.etapasPersonalizadasSaida.forEach(s => {
            this.formChecklistSaida.removeControl(s.id);
          });

          if (res.etapasPersonalizadasJson) {
            try {
              this.etapasPersonalizadasSaida = JSON.parse(res.etapasPersonalizadasJson);
            } catch (e) {
              this.etapasPersonalizadasSaida = [];
            }
          } else {
            this.etapasPersonalizadasSaida = [];
          }

          this.etapasPersonalizadasSaida.forEach(step => {
            let val = step.valor;
            if (step.tipo === 'date' && typeof val === 'string' && val) {
              val = this.parseDateOnly(val);
            }
            if (step.tipo === 'boolean') {
              if (val === true || val === 'true') {
                val = 'Sim';
              } else if (val === false || val === 'false') {
                val = 'Não';
              }
            }
            this.formChecklistSaida.addControl(step.id, this.fb.control(val));
          });

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
        this.notification.toastError('Já existe um fiador neste contrato.');
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
      this.notification.toastError('Esse tipo de parte já foi informado.');
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
      this.notification.toastError('Essa parte é obrigatória.');
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

  private toDateOnlyString(d: any): string | null {
    if (!d) return null;
    if (typeof d === 'string') {
      const trimmed = d.trim();
      if (!trimmed) return null;
      if (trimmed.includes('-')) return trimmed;
      if (trimmed.includes('/')) {
        const parts = trimmed.split('/');
        if (parts.length === 3) {
          return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
      const parsed = new Date(trimmed);
      if (!isNaN(parsed.getTime())) {
        d = parsed;
      } else {
        return null;
      }
    }
    if (d instanceof Date) {
      if (isNaN(d.getTime())) return null;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    return null;
  }

  private parseDateOnly(s: string): Date {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  // ---------- Actions ----------
  salvarRascunho(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notification.toastError('Corrija os campos obrigatórios.');
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
          this.notification.toastSuccess('Contrato criado como rascunho!');
          this.router.navigate(['/contratos/editar', res.id]);
        },
        error: (err) => {
          this.carregando = false;
          this.notification.toastError(err?.error?.error ?? 'Erro ao salvar rascunho');
        }
      });
  }

  salvarAlteracoes(): void {
    if (!this.id) return;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notification.toastError('Corrija os campos obrigatórios.');
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
          this.notification.toastSuccess('Contrato atualizado com sucesso!');
        },
        error: (err) => {
          this.carregando = false;
          this.notification.toastError(err?.error?.error ?? 'Erro ao salvar alterações');
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

    try {
      this.etapasPersonalizadasEntrada.forEach(step => {
        let val = this.formChecklistEntrada.get(step.id)?.value;
        if (step.tipo === 'date' && val) {
          val = this.toDateOnlyString(val);
        }
        step.valor = val;
      });

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
        dataPagamentoBonus: this.toDateOnlyString(raw.dataPagamentoBonus),
        etapasPersonalizadasJson: JSON.stringify(this.etapasPersonalizadasEntrada)
      };

      this.contratosService.salvarChecklistEntrada(this.id, req)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.checklistEntrada = res;
            this.carregandoChecklistEntrada = false;
            this.notification.toastSuccess('Checklist de Entrada salvo!');
          },
          error: (err) => {
            this.carregandoChecklistEntrada = false;
            this.notification.toastError(err?.error?.error ?? 'Erro ao salvar checklist de entrada');
          }
        });
    } catch (e: any) {
      this.carregandoChecklistEntrada = false;
      console.error('Erro ao salvar checklist de entrada:', e);
      this.notification.toastError('Erro ao salvar: ' + e.message);
    }
  }

  salvarChecklistSaida(): void {
    if (!this.id) return;
    this.carregandoChecklistSaida = true;

    try {
      this.etapasPersonalizadasSaida.forEach(step => {
        let val = this.formChecklistSaida.get(step.id)?.value;
        if (step.tipo === 'date' && val) {
          val = this.toDateOnlyString(val);
        }
        step.valor = val;
      });

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
        cancelamentoSeguroFianca: raw.cancelamentoSeguroFianca,
        etapasPersonalizadasJson: JSON.stringify(this.etapasPersonalizadasSaida)
      };

      this.contratosService.salvarChecklistSaida(this.id, req)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res) => {
            this.checklistSaida = res;
            this.carregandoChecklistSaida = false;
            this.notification.toastSuccess('Checklist de Saída salvo!');
          },
          error: (err) => {
            this.carregandoChecklistSaida = false;
            this.notification.toastError(err?.error?.error ?? 'Erro ao salvar checklist de saída');
          }
        });
    } catch (e: any) {
      this.carregandoChecklistSaida = false;
      console.error('Erro ao salvar checklist de saída:', e);
      this.notification.toastError('Erro ao salvar: ' + e.message);
    }
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
          this.notification.toastSuccess('Contrato ativado!');
        },
        error: (err) => {
          this.carregando = false;
          this.notification.toastError(err?.error?.error ?? 'Erro ao ativar');
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
          this.notification.toastSuccess('Contrato cancelado.');
        },
        error: (err) => {
          this.carregando = false;
          this.notification.toastError(err?.error?.error ?? 'Erro ao cancelar');
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
          this.notification.toastSuccess('Contrato encerrado.');
          this.router.navigate(['/contratos']);
        },
        error: (err) => {
          this.carregando = false;
          this.notification.toastError(err?.error?.error ?? 'Erro ao encerrar');
        }
      });
  }

  isFieldCompleted(formGroup: FormGroup, key: string): boolean {
    const control = formGroup?.get(key);
    if (!control) return false;
    const val = control.value;
    if (val instanceof Date) return true;
    if (typeof val === 'string') return val.trim().length > 0;
    return val !== null && val !== undefined && val !== '';
  }

  getFieldValueDisplay(formGroup: FormGroup, key: string): string {
    const control = formGroup?.get(key);
    if (!control) return '';
    const val = control.value;
    if (val instanceof Date) {
      const d = String(val.getDate()).padStart(2, '0');
      const m = String(val.getMonth() + 1).padStart(2, '0');
      const y = val.getFullYear();
      return `${d}/${m}/${y}`;
    }
    if (typeof val === 'string') {
      const trimmed = val.trim();
      return trimmed.length > 15 ? trimmed.substring(0, 13) + '...' : trimmed;
    }
    return val ? String(val) : '';
  }

  getCompletedCount(formGroup: FormGroup, items: any[]): number {
    if (!formGroup) return 0;
    return items.filter(item => this.isFieldCompleted(formGroup, item.key)).length;
  }

  getCompletionPercentage(formGroup: FormGroup, items: any[]): number {
    if (!formGroup || items.length === 0) return 0;
    return Math.round((this.getCompletedCount(formGroup, items) / items.length) * 100);
  }

  scrollToField(domId: string): void {
    const el = document.getElementById(domId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('highlight-field-glow');
      setTimeout(() => {
        el.classList.remove('highlight-field-glow');
      }, 1500);
    }
  }

  onTabChanged(index: number): void {
    if (index === 1) {
      this.tipoChecklistAtual = 'entrada';
    } else if (index === 2) {
      this.tipoChecklistAtual = 'saida';
    }
  }

  getCardsDisponiveis(): string[] {
    if (this.tipoChecklistAtual === 'entrada') {
      const customs = this.etapasPersonalizadasEntrada.map(s => s.card);
      return [...new Set([...this.staticCardsEntrada, ...customs])];
    } else {
      const customs = this.etapasPersonalizadasSaida.map(s => s.card);
      return [...new Set([...this.staticCardsSaida, ...customs])];
    }
  }

  getCustomStepsForCard(etapas: CustomStep[], cardName: string): CustomStep[] {
    return etapas.filter(s => s.card === cardName);
  }

  getCustomCards(etapas: CustomStep[], staticCards: string[]): string[] {
    const cards = etapas.map(s => s.card);
    const uniqueCards = [...new Set(cards)];
    return uniqueCards.filter(c => !staticCards.includes(c));
  }

  getEntradaTrackerItems() {
    const statics = this.checklistEntradaItems.map(item => ({
      key: item.key,
      label: item.label,
      icon: item.icon,
      domId: item.domId,
      isCustom: false
    }));
    const customs = this.etapasPersonalizadasEntrada.map(step => ({
      key: step.id,
      label: step.label,
      icon: this.getCustomStepIcon(step.tipo),
      domId: 'field-' + step.id,
      isCustom: true
    }));
    return [...statics, ...customs];
  }

  getSaidaTrackerItems() {
    const statics = this.checklistSaidaItems.map(item => ({
      key: item.key,
      label: item.label,
      icon: item.icon,
      domId: item.domId,
      isCustom: false
    }));
    const customs = this.etapasPersonalizadasSaida.map(step => ({
      key: step.id,
      label: step.label,
      icon: this.getCustomStepIcon(step.tipo),
      domId: 'field-' + step.id,
      isCustom: true
    }));
    return [...statics, ...customs];
  }

  getCustomStepIcon(tipo: string): string {
    switch (tipo) {
      case 'date': return 'calendar_month';
      case 'boolean': return 'check_box';
      case 'textarea': return 'notes';
      default: return 'text_fields';
    }
  }

  onCardSelectionChange(val: string): void {
    const ctrl = this.formNovaEtapa.controls['novoCardNome'];
    if (val === 'novo') {
      ctrl.setValidators([Validators.required]);
    } else {
      ctrl.clearValidators();
    }
    ctrl.updateValueAndValidity();
  }

  abrirDialogAdicionarEtapa(tipoChecklist: 'entrada' | 'saida'): void {
    this.tipoChecklistAtual = tipoChecklist;
    this.formNovaEtapa.reset({
      label: '',
      tipo: 'text',
      card: '',
      novoCardNome: '',
      isGlobal: false
    });
    this.formNovaEtapa.controls['novoCardNome'].clearValidators();
    this.formNovaEtapa.controls['novoCardNome'].updateValueAndValidity();

    this.dialog.open(this.dialogTemplate, {
      width: '450px',
      disableClose: true
    });
  }

  @ViewChild('dialogEtapa') dialogTemplate!: TemplateRef<any>;

  confirmarAdicionarEtapa(): void {
    if (this.formNovaEtapa.invalid) {
      this.formNovaEtapa.markAllAsTouched();
      return;
    }

    const raw = this.formNovaEtapa.value;
    const cardName = raw.card === 'novo' ? raw.novoCardNome! : raw.card!;

    if (raw.isGlobal) {
      this.carregando = true;
      this.contratosService.criarEtapaGlobal({
        tipoChecklist: this.tipoChecklistAtual,
        label: raw.label!,
        tipoField: raw.tipo!,
        card: cardName
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (created) => {
          this.carregando = false;
          const id = 'global_' + created.id;
          const newStep: CustomStep = {
            id,
            label: created.label,
            tipo: created.tipoField as any,
            card: created.card,
            valor: '',
            isGlobal: true
          };
          this.adicionarEtapaLocal(newStep);
          this.dialog.closeAll();
          this.notification.toastSuccess('Nova etapa global adicionada!');
        },
        error: (err) => {
          this.carregando = false;
          this.notification.toastError(err?.error?.error ?? 'Erro ao criar etapa global');
        }
      });
    } else {
      const id = 'custom_' + Date.now();
      const newStep: CustomStep = {
        id,
        label: raw.label!,
        tipo: raw.tipo as any,
        card: cardName,
        valor: '',
        isGlobal: false
      };
      this.adicionarEtapaLocal(newStep);
      this.dialog.closeAll();
      this.notification.toastSuccess('Nova etapa adicionada ao checklist!');
    }
  }

  private adicionarEtapaLocal(newStep: CustomStep): void {
    if (this.tipoChecklistAtual === 'entrada') {
      this.etapasPersonalizadasEntrada.push(newStep);
      this.formChecklistEntrada.addControl(newStep.id, this.fb.control(newStep.valor));
      this.formChecklistEntrada.markAsDirty();
    } else {
      this.etapasPersonalizadasSaida.push(newStep);
      this.formChecklistSaida.addControl(newStep.id, this.fb.control(newStep.valor));
      this.formChecklistSaida.markAsDirty();
    }
  }

  async removerEtapaPersonalizada(id: string, tipoChecklist: 'entrada' | 'saida'): Promise<void> {
    const isGlobal = id.startsWith('global_');
    if (isGlobal) {
      const confirm = await this.notification.confirm(
        'Excluir etapa global?',
        'Esta etapa será excluída permanentemente de TODOS os contratos. Esta ação não pode ser desfeita.',
        'Sim, excluir',
        'Cancelar'
      );
      if (!confirm) return;

      this.carregando = true;
      const globalId = id.replace('global_', '');
      this.contratosService.excluirEtapaGlobal(globalId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.carregando = false;
            this.removerEtapaLocal(id, tipoChecklist);
            this.notification.toastSuccess('Etapa global removida com sucesso!');
          },
          error: (err) => {
            this.carregando = false;
            this.notification.toastError(err?.error?.error ?? 'Erro ao remover etapa global');
          }
        });
    } else {
      this.removerEtapaLocal(id, tipoChecklist);
      this.notification.toastSuccess('Etapa removida com sucesso!');
    }
  }

  private removerEtapaLocal(id: string, tipoChecklist: 'entrada' | 'saida'): void {
    if (tipoChecklist === 'entrada') {
      this.etapasPersonalizadasEntrada = this.etapasPersonalizadasEntrada.filter(s => s.id !== id);
      this.formChecklistEntrada.removeControl(id);
      this.formChecklistEntrada.markAsDirty();
    } else {
      this.etapasPersonalizadasSaida = this.etapasPersonalizadasSaida.filter(s => s.id !== id);
      this.formChecklistSaida.removeControl(id);
      this.formChecklistSaida.markAsDirty();
    }
  }

  voltar(): void {
    this.router.navigate(['/contratos']);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
