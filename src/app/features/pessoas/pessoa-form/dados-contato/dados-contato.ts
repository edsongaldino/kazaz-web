// src/app/pessoas/pessoa-form/dados-contato/dados-contato.component.ts
import { CommonModule } from '@angular/common';
import {
  Component,
  forwardRef,
  signal
} from '@angular/core';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTableModule } from '@angular/material/table';
import { ContatoDto } from '../../../../models/contato.model';
import { DadosContatoDialog } from './dados-contato-dialog/dados-contato-dialog';

@Component({
  selector: 'app-dados-contato',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTableModule
  ],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DadosContato),
      multi: true
    }
  ],
  templateUrl: './dados-contato.html',
  styleUrls: ['./dados-contato.scss']
})
export class DadosContato implements ControlValueAccessor {
  displayedColumns = ['tipo', 'valor', 'principal', 'acoes'];

  private _contatos = signal<ContatoDto[]>([]);
  contatos = this._contatos.asReadonly();

  private onChange: (value: ContatoDto[]) => void = () => {};
  private onTouched: () => void = () => {};
  private isDisabled = false;

  constructor(private dialog: MatDialog) {}

  // ControlValueAccessor
  writeValue(value: ContatoDto[] | null): void {
    this._contatos.set(value ?? []);
  }

  registerOnChange(fn: (value: ContatoDto[]) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  // Helpers internos
  private atualizar(value: ContatoDto[]) {
    this._contatos.set(value);
    this.onChange(value);
    this.onTouched();
  }

  labelTipo(tipo: ContatoDto['tipo']): string {
    switch (tipo) {
      case 'EMAIL':
        return 'E-mail';
      case 'TELEFONE':
        return 'Telefone';
      case 'SITE':
        return 'Site';
      default:
        return 'Outro';
    }
  }

  abrirDialogNovo() {
    if (this.isDisabled) return;
    const ref = this.dialog.open(DadosContatoDialog, {
      width: '480px',
      data: {}
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      this.adicionarContato(result);
    });
  }

  editar(index: number) {
    if (this.isDisabled) return;
    const atual = this.contatos()[index];

    const ref = this.dialog.open(DadosContatoDialog, {
      width: '480px',
      data: { contato: atual }
    });

    ref.afterClosed().subscribe(result => {
      if (!result) return;
      const clone = [...this.contatos()];
      clone[index] = result;
      this.aplicarRegraPrincipal(clone, result, index);
      this.atualizar(clone);
    });
  }

  remover(index: number) {
    if (this.isDisabled) return;
    const clone = [...this.contatos()];
    clone.splice(index, 1);
    this.atualizar(clone);
  }

  private adicionarContato(novo: ContatoDto) {
    const clone = [...this.contatos(), novo];
    this.aplicarRegraPrincipal(clone, novo);
    this.atualizar(clone);
  }

  /**
   * Regra: somente 1 por tipo pode ser principal.
   */
  private aplicarRegraPrincipal(
    lista: ContatoDto[],
    contato: ContatoDto,
    indexIgnorar?: number
  ) {
    if (!contato.principal) return;

    lista.forEach((c, idx) => {
      if (idx === indexIgnorar) return;
      if (c.tipo === contato.tipo) {
        c.principal = false;
      }
    });
  }
}
