import { CommonModule } from '@angular/common';
import { Component, inject, Inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ContatoDto, TipoContato } from '../../../../../models/contato.model';

export interface DadosContatoDialogData {
  contato?: ContatoDto | null;
}

@Component({
  selector: 'app-dados-contato-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './dados-contato-dialog.html',
  styleUrls: ['./dados-contato-dialog.scss']
})
export class DadosContatoDialog {

  private fb = inject(FormBuilder);

  form = this.fb.group({
    tipo: ['EMAIL' as TipoContato, Validators.required],
    valor: ['', Validators.required],
    principal: [false, Validators.required]
  });

  constructor(
    private dialogRef: MatDialogRef<DadosContatoDialog>,
    @Inject(MAT_DIALOG_DATA) public data: DadosContatoDialogData
  ) {
    if (data?.contato) {
      this.form.patchValue(data.contato);
    }

    this.configurarValidacoesDinamicas();
  }

  private configurarValidacoesDinamicas() {
    const tipoCtrl = this.form.controls.tipo;
    const valorCtrl = this.form.controls.valor;

    const aplicarValidacao = (tipo: TipoContato | null) => {
      valorCtrl.clearValidators();
      if (tipo === 'EMAIL') {
        valorCtrl.setValidators([Validators.required, Validators.email]);
      } else {
        valorCtrl.setValidators([Validators.required]);
      }
      valorCtrl.updateValueAndValidity();
    };

    aplicarValidacao(tipoCtrl.value);

    tipoCtrl.valueChanges.subscribe(tipo => aplicarValidacao(tipo));
  }

  salvar() {
    if (this.form.invalid) return;
    this.dialogRef.close(this.form.value as ContatoDto);
  }

  cancelar() {
    this.dialogRef.close();
  }
}
