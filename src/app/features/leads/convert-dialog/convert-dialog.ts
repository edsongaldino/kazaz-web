import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
  selector: 'app-convert-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    NgxMaskDirective
  ],
  templateUrl: './convert-dialog.html',
  styleUrls: ['./convert-dialog.scss']
})
export class ConvertDialogComponent {
  private readonly fb = inject(FormBuilder);
  private readonly dialogRef = inject(MatDialogRef<ConvertDialogComponent>);

  readonly form = this.fb.group({
    tipoPessoa: ['PF' as 'PF' | 'PJ', Validators.required],
    documento: ['']
  });

  get mask(): string {
    return this.form.value.tipoPessoa === 'PF' ? '000.000.000-00' : '00.000.000/0000-00';
  }

  get docLabel(): string {
    return this.form.value.tipoPessoa === 'PF' ? 'CPF' : 'CNPJ';
  }

  confirmar(): void {
    if (this.form.invalid) {
      return;
    }
    this.dialogRef.close(this.form.value);
  }

  cancelar(): void {
    this.dialogRef.close();
  }
}
