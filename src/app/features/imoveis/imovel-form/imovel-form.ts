import { CommonModule } from '@angular/common';
import { Component, ViewChild, ChangeDetectorRef, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup, FormControl } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { take, map } from 'rxjs/operators';
import { firstValueFrom, Observable } from 'rxjs';
import { MaterialModule } from '../../../shared/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { EnderecoComponent } from '../../../shared/components/endereco/endereco';

import { ImovelDto, ImovelCreateRequest, ImovelUpdateRequest } from '../../../models/imovel.model';
import { ImoveisService } from '../../../core/services/imoveis.service';
import { HttpErrorResponse } from '@angular/common/http';

// Ajuste conforme seu backend
type TipoImovelItem = { id: string; nome: string };
type CaracteristicaItem = { id: string; nome: string; tipoValor: 'bool'|'int'|'decimal'|'texto'|'data'|'moeda'; unidade?: string|null; grupo?: string|null; ordem?: number|null };

@Component({
  selector: 'app-imovel-form',
  standalone: true,
  imports: [MaterialModule, CommonModule, ReactiveFormsModule, RouterModule, EnderecoComponent, SharedModule],
  templateUrl: './imovel-form.html',
  styleUrls: ['./imovel-form.scss'],
})
export class ImovelFormComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(ImoveisService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild(EnderecoComponent) enderecoCmp!: EnderecoComponent;

  id = signal<string | null>(null);
  modoEdicao = computed(() => !!this.id());
  loading = signal(false);
  saving = signal(false);
  errorMsg = signal<string | null>(null);

  // catálogos
  tiposImovel = signal<TipoImovelItem[]>([]);
  caracteristicasCatalogo = signal<CaracteristicaItem[]>([]);
  caracteristicasLoading = signal(false);

  // enums (valores numéricos)
  finalidades = [
    { value: 1, label: 'Venda' },
    { value: 2, label: 'Aluguel' },
    { value: 3, label: 'Temporada' },
    { value: 4, label: 'Uso próprio' },
  ];

  statusOptions = [
    { value: 1, label: 'Ativo' },
    { value: 2, label: 'Inativo' },
    { value: 3, label: 'Em negociação' },
    { value: 4, label: 'Vendido' },
    { value: 5, label: 'Alugado' },
  ];

  // Form
  form = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(50)]],
    titulo: [''],
    tipoImovelId: [null as string | null, Validators.required],
    finalidade: [1, Validators.required],
    status: [1, Validators.required],
    observacoes: [''],

    endereco: this.fb.group({
      cep: [''],
      logradouro: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      estadoId: [null],
      cidadeId: [null],
    }),

    // dinâmico: uma chave por caracteristicaId
    caracteristicas: this.fb.group({}),
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
    }

    this.init();
  }

  get enderecoForm(): FormGroup {
    return this.form.get('endereco') as FormGroup;
  }

  get caracForm(): FormGroup {
    return this.form.get('caracteristicas') as FormGroup;
  }

  // agrupamento para UI
  gruposCaracteristicas = computed(() => {
    const grupos = new Set<string>();
    for (const c of this.caracteristicasCatalogo()) {
      grupos.add((c.grupo ?? 'Geral').trim() || 'Geral');
    }
    return Array.from(grupos).sort((a, b) => a.localeCompare(b));
  });

  caracteristicasPorGrupo = computed(() => {
    const map = new Map<string, CaracteristicaItem[]>();
    for (const c of this.caracteristicasCatalogo()) {
      const g = ((c.grupo ?? 'Geral').trim() || 'Geral');
      const arr = map.get(g) ?? [];
      arr.push(c);
      map.set(g, arr);
    }
    // ordenar por ordem/nome dentro do grupo
    for (const [k, arr] of map.entries()) {
      arr.sort((a, b) => ((a.ordem ?? 0) - (b.ordem ?? 0)) || a.nome.localeCompare(b.nome));
      map.set(k, arr);
    }
    return map;
  });

  trackByGrupo = (_: number, g: string) => g;
  trackByCarac = (_: number, c: CaracteristicaItem) => c.id;

  getCaracControl(caracteristicaId: string): FormControl {
    return this.caracForm.get(caracteristicaId) as FormControl;
  }

  private async init() {
    try {
      this.loading.set(true);

      // Carregar catálogos em paralelo
      this.caracteristicasLoading.set(true);

      const [tipos, caracs] = await Promise.all([
        firstValueFrom(this.service.listarTiposImovel()),         // você implementa no service
        firstValueFrom(this.service.listarCaracteristicas()),     // você implementa no service
      ]);

      this.tiposImovel.set(tipos);
      this.caracteristicasCatalogo.set(caracs);

      this.mountCaracteristicasControls(caracs);

      // se edição: carregar imóvel depois de montar controles
      if (this.id()) {
        await this.carregarEdicao(this.id()!);
      }

      this.caracteristicasLoading.set(false);
      this.loading.set(false);
    } catch (err) {
      console.error(err);
      this.loading.set(false);
      this.caracteristicasLoading.set(false);
      this.errorMsg.set('Não foi possível carregar os dados necessários.');
    } finally {
      this.cdr.markForCheck();
    }
  }

  private mountCaracteristicasControls(caracs: CaracteristicaItem[]) {
    // cria um control por característica
    const group: Record<string, FormControl> = {};

    for (const c of caracs) {
      // defaults
      let initial: any = null;
      if (c.tipoValor === 'bool') initial = false;

      group[c.id] = new FormControl(initial);
    }

    this.form.setControl('caracteristicas', new FormGroup(group));
  }

  private async carregarEdicao(id: string) {
    const imovel: ImovelDto = await firstValueFrom(this.service.obterPorId(id));

    this.form.patchValue(
      {
        codigo: imovel.codigo,
        titulo: (imovel as any).titulo ?? '',
        tipoImovelId: (imovel as any).tipoImovelId ?? null,
        finalidade: (imovel as any).finalidade ?? 1,
        status: (imovel as any).status ?? 1,
        observacoes: (imovel as any).observacoes ?? '',
      },
      { emitEvent: false }
    );

    if ((imovel as any).endereco) {
      const e = (imovel as any).endereco;
      this.enderecoForm.patchValue(
        {
          cep: e.cep ?? '',
          logradouro: e.logradouro ?? '',
          numero: e.numero ?? '',
          complemento: e.complemento ?? '',
          bairro: e.bairro ?? '',
          estadoId: e.estadoId ?? null,
          cidadeId: e.cidadeId ?? null,
        },
        { emitEvent: true }
      );

      this.enderecoCmp?.onEstadoChange?.();
    }

    // preencher características (assumindo retorno: caracteristicas: [{ caracteristicaId, valorBool, valorInt, valorDecimal, valorTexto, valorData }])
    const caracs = ((imovel as any).caracteristicas ?? []) as any[];
    for (const ic of caracs) {
      const ctrl = this.caracForm.get(ic.caracteristicaId);
      if (!ctrl) continue;

      // decide qual valor usar (um deles vem preenchido)
      const value =
        ic.valorBool ?? ic.valorInt ?? ic.valorDecimal ?? ic.valorTexto ?? ic.valorData ?? null;

      ctrl.setValue(value, { emitEvent: false });
    }
  }

  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    // montar lista de características preenchidas (não mandar tudo vazio)
    const caracsPayload = this.buildCaracteristicasPayload();

    const payloadBase = {
      codigo: raw.codigo ?? '',
      titulo: raw.titulo ?? null,
      finalidade: raw.finalidade,
      status: raw.status,
      tipoImovelId: raw.tipoImovelId!,
      endereco: raw.endereco, // EnderecoCreateDto
      observacoes: raw.observacoes ?? null,
      caracteristicas: caracsPayload,
      vinculos: [] as any[], // próximo passo
    };

    const obs$: Observable<void> = this.modoEdicao()
      ? this.service.atualizar(this.id()!, payloadBase as any)
      : this.service.criar(payloadBase as any).pipe(map(() => void 0));

    this.saving.set(true);

    obs$.pipe(take(1)).subscribe({
      next: () => {
        this.saving.set(false);
        this.router.navigate(['/imoveis']);
      },
      error: (err: HttpErrorResponse) => {
        console.error(err);
        this.saving.set(false);
        this.errorMsg.set('Falha ao salvar. Verifique os campos e tente novamente.');
      },
    });
  }

  private buildCaracteristicasPayload() {
    const values = this.caracForm.getRawValue() as Record<string, any>;
    const catalogo = this.caracteristicasCatalogo();

    const result: any[] = [];

    for (const c of catalogo) {
      const v = values[c.id];

      // não enviar vazio (exceto bool, que false pode ser relevante — mas normalmente só mandamos se true)
      if (c.tipoValor === 'bool') {
        if (v === true) {
          result.push({ caracteristicaId: c.id, valorBool: true });
        }
        continue;
      }

      if (v === null || v === undefined || v === '') continue;

      if (c.tipoValor === 'int') result.push({ caracteristicaId: c.id, valorInt: Number(v) });
      else if (c.tipoValor === 'decimal' || c.tipoValor === 'moeda')
        result.push({ caracteristicaId: c.id, valorDecimal: Number(v) });
      else if (c.tipoValor === 'texto')
        result.push({ caracteristicaId: c.id, valorTexto: String(v) });
      else if (c.tipoValor === 'data') {
        // se vier Date do datepicker, converte pra yyyy-mm-dd
        const iso = v instanceof Date ? v.toISOString().slice(0, 10) : String(v);
        result.push({ caracteristicaId: c.id, valorData: iso });
      }
    }

    return result;
  }

  cancelar() {
    this.router.navigate(['/imoveis']);
  }
}
