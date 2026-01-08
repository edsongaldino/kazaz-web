import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';

import { MaterialModule } from '../../../shared/material.module';
import { ContratosService } from '../../../core/services/contratos.service';
import {
  ContratoResponse,
  CriarContratoRequest,
  PapelContrato,
  StatusContrato,
  TipoContrato,
} from '../../../models/contrato.models';

import { PessoasLookupService, LookupItem } from '../../../core/services/pessoas-lookup.service';
import { ImoveisLookupService } from '../../../core/services/imoveis-lookup.service';

type ParteFg = FormGroup<{
  pessoa: FormControl<LookupItem | null>;
  pessoaId: FormControl<string>;
  papel: FormControl<number>;
  percentual: FormControl<number | null>;
}>;

type ContratoFormFg = FormGroup<{
  tipo: FormControl<number>;

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
  pessoasFiltradasPorIndex: Record<number, LookupItem[]> = {};

  // ✅ agora inicializa no ngOnInit
  form!: ContratoFormFg;

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
    private imoveisLookup: ImoveisLookupService
  ) {}

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

    // se está editando, carrega
    if (this.id) {
      this.carregarContrato(this.id);
    }
  }

  private buildForm(): void {
    this.form = this.fb.group({
      tipo: this.fb.control<number>(TipoContrato.Locacao, { nonNullable: true, validators: [Validators.required] }),

      imovel: this.fb.control<LookupItem | null>(null, { validators: [Validators.required] }),
      imovelId: this.fb.control<string>('', { nonNullable: true, validators: [Validators.required] }),

      inicioVigencia: this.fb.control<Date | null>(null, { validators: [Validators.required] }),
      fimVigencia: this.fb.control<Date | null>(null),

      partes: this.fb.array<ParteFg>([]),
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

          // seta tipo (isso vai rebuildPartes automaticamente)
          this.form.controls.tipo.setValue(c.tipo, { emitEvent: true });

          // imovelId e placeholder
          this.form.controls.imovelId.setValue(c.imovelId);
          this.form.controls.imovel.setValue({ id: c.imovelId, label: `Imóvel ${c.imovelId}` });

          // datas
          this.form.controls.inicioVigencia.setValue(this.parseDateOnly(c.inicioVigencia));
          this.form.controls.fimVigencia.setValue(c.fimVigencia ? this.parseDateOnly(c.fimVigencia) : null);

          // partes: preenche pelos papéis existentes
          this.partes.clear();
          for (const p of c.partes ?? []) {
            this.partes.push(this.criarParteFg(p.papel, {
              id: p.pessoaId,
              label: p.pessoaNome
            }, p.percentual ?? null));
          }

          this.validarFimObrigatorio(c.tipo);
          this.form.markAsPristine();
        },
        error: (err) => {
          this.carregando = false;
          this.snack.open(err?.error?.error ?? 'Erro ao carregar contrato', 'Fechar', { duration: 4000 });
          this.router.navigate(['/contratos']);
        },
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
  }

  addFiador(): void {
    const tipo = this.form.controls.tipo.value;
    if (tipo !== TipoContrato.Locacao) return;

    const jaTemFiador = this.partes.controls.some(p => p.controls.papel.value === PapelContrato.Fiador);
    if (jaTemFiador) return;

    this.partes.push(this.criarParteFg(PapelContrato.Fiador));
  }

  removerParte(index: number): void {
    const papel = this.partes.at(index).controls.papel.value;

    if (papel === PapelContrato.Locador || papel === PapelContrato.Locatario ||
        papel === PapelContrato.Vendedor || papel === PapelContrato.Comprador) {
      this.snack.open('Essa parte é obrigatória.', 'Fechar', { duration: 2500 });
      return;
    }
    this.partes.removeAt(index);
  }

  private criarParteFg(papel: number, pessoa?: LookupItem | null, percentual?: number | null): ParteFg {
    const fg = this.fb.group({
      pessoa: this.fb.control<LookupItem | null>(pessoa ?? null, { validators: [Validators.required] }),
      pessoaId: this.fb.control<string>(pessoa?.id ?? '', { nonNullable: true, validators: [Validators.required] }),
      papel: this.fb.control<number>(papel, { nonNullable: true, validators: [Validators.required] }),
      percentual: this.fb.control<number | null>(percentual ?? null),
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

  onPessoaInput(index: number): void {
    const ctrl = this.partes.at(index).controls.pessoa;

    ctrl.valueChanges
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
      .subscribe((items) => (this.pessoasFiltradasPorIndex[index] = items));
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

  private toDateOnlyString(d: Date | null): string | null {
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
        papel: p.controls.papel.value,
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

  ativar(): void {
    if (!this.id) return;

    this.carregando = true;
    this.contratosService.ativar(this.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.carregando = false;
          this.contrato = res;
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
            this.snack.open('Contrato encerrado.', 'Fechar', { duration: 2500 });

            // ✅ volta pra lista
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
