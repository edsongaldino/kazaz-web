import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { MaterialModule } from '../../material.module';
import { NgxMaskDirective } from 'ngx-mask';
import { NotificationService } from '../../../core/services/notification.service';
import { catchError, of, timeout, firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

type EstadoDto = { id: string; nome: string; uf: string };
type CidadeDto = { id: string; nome: string; ibge?: string };

@Component({
  selector: 'app-endereco',
  standalone: true,
  templateUrl: './endereco.html',
  styleUrls: ['./endereco.scss'],
  imports: [CommonModule, ReactiveFormsModule, MaterialModule, NgxMaskDirective],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EnderecoComponent implements OnInit {
  // IMPORTANTÍSSIMO: terminar com /api (ex.: /api ou https://localhost:7035/api)
  private api = (environment.apiUrl).replace(/\/+$/, '');
  private apiUrl = (p: string) => `${this.api}${p.startsWith('/') ? '' : '/'}${p}`;

  @Input() formGroup!: FormGroup;

  estados: EstadoDto[] = [];
  cidades: CidadeDto[] = [];
  private estadosLoaded = false;

  trackEstado = (_: number, x: EstadoDto) => x.id;
  trackCidade = (_: number, x: CidadeDto) => x.id;

  constructor(private http: HttpClient, private notify: NotificationService) {}

  async ngOnInit(): Promise<void> {
    this.ensureControls();
    await this.ensureEstadosLoaded();

    const estadoId = this.formGroup.get('estadoId')?.value as string | null;
    if (estadoId) {
      await this.loadCidadesByEstadoId(estadoId);
    } else {
      const uf = String(this.formGroup.get('estado')?.value || '').toUpperCase();
      if (uf) {
        const est = this.estados.find(e => e.uf === uf);
        this.formGroup.patchValue({ estadoId: est?.id ?? null });
        if (est?.id) await this.loadCidadesByEstadoId(est.id);
      }
    }
  }

  private ensureControls() {
    const fg = this.formGroup;
    if (!fg.get('cep'))          fg.addControl('cep',          new FormControl('', Validators.required));
    if (!fg.get('numero'))       fg.addControl('numero',       new FormControl(''));
    if (!fg.get('complemento'))  fg.addControl('complemento',  new FormControl(''));
    if (!fg.get('logradouro'))   fg.addControl('logradouro',   new FormControl(''));
    if (!fg.get('bairro'))       fg.addControl('bairro',       new FormControl(''));
    if (!fg.get('countryCode'))  fg.addControl('countryCode',  new FormControl('BR'));
    if (!fg.get('estadoId'))     fg.addControl('estadoId',     new FormControl<string | null>(null));
    if (!fg.get('cidadeId'))     fg.addControl('cidadeId',     new FormControl<string | null>(null));
    if (!fg.get('estado'))       fg.addControl('estado',       new FormControl(''));
    if (!fg.get('cidade'))       fg.addControl('cidade',       new FormControl(''));
  }

  private async ensureEstadosLoaded() {
    if (this.estadosLoaded && this.estados.length) return;

    const xs = await firstValueFrom(
      this.http.get<EstadoDto[]>(this.apiUrl('estados')).pipe(
        timeout(10000),
        catchError(err => {
          console.error('GET /estados', err);
          this.notify.errorCenter('Falha ao carregar estados', `URL: ${this.apiUrl('/estados')}`);
          return of<EstadoDto[]>([]);
        })
      )
    );

    this.estados = (xs ?? []).map(e => ({ id: e.id, nome: e.nome, uf: String(e.uf || '').toUpperCase() }));
    this.estadosLoaded = true;
  }

  private async loadCidadesByEstadoId(estadoId: string): Promise<void> {
    const cs = await firstValueFrom(
      this.http.get<CidadeDto[]>(this.apiUrl(`estados/${estadoId}/cidades`)).pipe(
        timeout(10000),
        catchError(err => {
          console.error(`GET /estados/${estadoId}/cidades`, err);
          this.notify.errorCenter('Falha ao carregar cidades', `URL: ${this.apiUrl(`/estados/${estadoId}/cidades`)}`);
          return of<CidadeDto[]>([]);
        })
      )
    );
    this.cidades = cs ?? [];
  }

  async onEstadoChange() {
    const estadoId = this.formGroup.get('estadoId')?.value as string | null;
    this.formGroup.patchValue({ cidadeId: null, cidade: '' });
    if (!estadoId) { this.cidades = []; return; }

    const est = this.estados.find(e => e.id === estadoId);
    if (est) this.formGroup.patchValue({ estado: est.uf });
    await this.loadCidadesByEstadoId(estadoId);
  }

  onCidadeChange() {
    const cidadeId = this.formGroup.get('cidadeId')?.value as string | null;
    const chosen = this.cidades.find(c => c.id === cidadeId);
    this.formGroup.patchValue({ cidade: chosen?.nome ?? '' });
  }

  async buscarCep(): Promise<void> {
    const raw = this.formGroup.get('cep')?.value ?? '';
    const cep = String(raw).replace(/\D/g, '');
    if (cep.length !== 8) { this.notify.errorCenter('CEP inválido', 'Digite 8 dígitos.'); return; }

    const dados = await firstValueFrom(
      this.http.get<any>(`https://viacep.com.br/ws/${cep}/json/`).pipe(
        timeout(8000),
        catchError(() => { this.notify.errorCenter('Serviço indisponível', 'ViaCEP falhou.'); return of<any>(null); })
      )
    );
    if (!dados || dados?.erro) { this.notify.errorCenter('CEP não encontrado', 'Confira o CEP.'); return; }

    this.formGroup.patchValue({
      countryCode: 'BR',
      logradouro: dados.logradouro ?? this.formGroup.get('logradouro')?.value,
      bairro: dados.bairro ?? this.formGroup.get('bairro')?.value,
      complemento: dados.complemento ?? this.formGroup.get('complemento')?.value
    });

    const uf = String(dados.uf || '').toUpperCase();
    const localidade = String(dados.localidade || '');
    const ibge = String(dados.ibge || '').padStart(7, '0');

    await this.ensureEstadosLoaded();

    const est = this.estados.find(x => x.uf === uf) || null;
    this.formGroup.patchValue({ estado: uf, estadoId: est?.id ?? null, cidadeId: null, cidade: '' });

    if (!est?.id) { this.notify.errorCenter('UF não encontrada', `UF: ${uf}.`); this.cidades = []; return; }

    await this.loadCidadesByEstadoId(est.id);

    let chosen: CidadeDto | undefined;
    if (/\d{7}/.test(ibge)) chosen = this.cidades.find(c => String((c as any).ibge || '').padStart(7, '0') === ibge);
    if (!chosen && localidade) chosen = this.cidades.find(c => normalize(c.nome) === normalize(localidade));
    if (chosen) this.formGroup.patchValue({ cidadeId: chosen.id, cidade: chosen.nome });
    else this.notify.errorCenter('Cidade não encontrada', 'Selecione manualmente.');
  }
}

function normalize(s?: string) {
  return (s ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}
