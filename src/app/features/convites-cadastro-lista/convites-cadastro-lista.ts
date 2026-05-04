import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Clipboard, ClipboardModule } from '@angular/cdk/clipboard';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { debounceTime, distinctUntilChanged, startWith } from 'rxjs';

import { ConvitesCadastroService, ConviteCadastroContratoDto } from '../../core/services/convites.service';
import { environment } from '../../../environments/environment';
import { ChangeDetectorRef } from '@angular/core';

@Component({
  selector: 'app-convites-cadastro-lista',
  standalone: true,
  imports: [
    CommonModule,
    ClipboardModule,
    ReactiveFormsModule,
    MatSnackBarModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatProgressBarModule,
    MatIconModule,
    MatInputModule,
    MatSlideToggleModule,
  ],
  templateUrl: './convites-cadastro-lista.html',
  styleUrls: ['./convites-cadastro-lista.scss'],
})
export class ConvitesCadastroListaComponent {
  private api = inject(ConvitesCadastroService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private clipboard = inject(Clipboard);
  private snack = inject(MatSnackBar);
  private cdr = inject(ChangeDetectorRef);


  carregando = false;

  displayedColumns: string[] = ['contrato', 'papel', 'status', 'criadoEm', 'expiraEm', 'usadoEm', 'acoes'];

  termoCtrl = new FormControl<string>('', { nonNullable: true });

  // ✅ quando true = lista geral; false = filtra pelo contratoId (se existir)
  verTodosCtrl = new FormControl<boolean>(false, { nonNullable: true });

  contratoId?: string;

  items: ConviteCadastroContratoDto[] = [];
  view: ConviteCadastroContratoDto[] = [];

  private get appUrl(): string {
    return (environment as any).appUrl ?? window.location.origin;
  }

  ngOnInit() {
    this.route.queryParamMap.subscribe((qp) => {
      this.contratoId = qp.get('contratoId') ?? undefined;

      // ⚠️ importante: não altere controles/flags e carregue no mesmo ciclo
      queueMicrotask(() => {
        if (this.contratoId) this.verTodosCtrl.setValue(false, { emitEvent: false });
        this.load();
        this.cdr.detectChanges(); // ✅ mata o NG0100
      });
    });

    this.termoCtrl.valueChanges
      .pipe(startWith(this.termoCtrl.value), debounceTime(250), distinctUntilChanged())
      .subscribe((t) => this.applyFilter(t));

    this.verTodosCtrl.valueChanges.subscribe(() => {
      // só recarrega; não navega nem muda query aqui
      this.load();
    });
  }

  load() {
    const usarContratoId = this.verTodosCtrl.value ? undefined : this.contratoId;

    this.carregando = true;

    this.api.listarPorContrato(usarContratoId).subscribe({
      next: (res) => {
        this.items = res?.items ?? [];
        this.applyFilter(this.termoCtrl.value);
        this.carregando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);
        this.items = [];
        this.view = [];
        this.carregando = false;
        this.snack.open('Erro ao carregar convites', 'OK', { duration: 3000 });
        this.cdr.detectChanges();
      },
    });
  }

  applyFilter(termo: string) {
    const t = (termo ?? '').trim().toLowerCase();
    if (!t) {
      this.view = [...this.items];
      return;
    }

    this.view = this.items.filter((c) => {
      const alvo = `${c.contratoId} ${c.token} ${this.papelLabel(c.papel)} ${this.statusLabel(c.status)}`.toLowerCase();
      return alvo.includes(t);
    });
  }

  linkDoConvite(c: ConviteCadastroContratoDto) {
    if (c.url) return c.url;
    return `${this.appUrl.replace(/\/$/, '')}/convites/${c.token}`;
  }

  copiar(c: ConviteCadastroContratoDto) {
    this.clipboard.copy(this.linkDoConvite(c));
    this.snack.open('Link copiado!', 'OK', { duration: 2000 });
  }

  async compartilhar(c: ConviteCadastroContratoDto) {
    const url = this.linkDoConvite(c);
    if ((navigator as any).share) {
      await (navigator as any).share({ title: 'Convite', text: 'Acesse o convite:', url });
      return;
    }
    this.copiar(c);
  }

  papelLabel(papel: number) {
    const map: Record<number, string> = { 1: 'Locatário', 2: 'Fiador', 3: 'Proprietário' };
    return map[papel] ?? `Papel ${papel}`;
  }

  statusLabel(status: number) {
    const map: Record<number, string> = { 0: 'Pendente', 1: 'Usado', 2: 'Expirado', 3: 'Cancelado' };
    return map[status] ?? `Status ${status}`;
  }

  contratoShort(id: string) {
    return `${id.slice(0, 8)}...`;
  }
}
