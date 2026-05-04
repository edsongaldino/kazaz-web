import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';

import {
  ConviteCadastroListItemResponse
} from '../../../models/cadastro-publico.models';

@Component({
  selector: 'app-analise-convite-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule
  ],
  templateUrl: './analise-convite-dialog.html',
  styleUrl: './analise-convite-dialog.scss'
})
export class AnaliseConviteDialog {
  form!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AnaliseConviteDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ConviteCadastroListItemResponse
  ) {
    this.form = this.fb.group({
      resultado: [null, Validators.required],
      comentario: ['']
    });
  }

  confirmar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.dialogRef.close({
      resultado: this.form.value.resultado,
      comentario: this.form.value.comentario
    });
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}