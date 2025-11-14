import { Component, forwardRef, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { Conjuge } from '../../../../models/conjuge.model';

@Component({
  selector: 'app-dados-conjuge',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatDatepickerModule, MatIconModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DadosConjuge),
    multi: true
  }],
  templateUrl: './dados-conjuge.html'
})
export class DadosConjuge implements ControlValueAccessor {
  disabled = signal(false);

  // ✅ inicialize o fb ANTES do form
  private readonly fb = inject(FormBuilder);

  form = this.fb.group({
    nome: this.fb.control<string | null>(null, { validators: [Validators.maxLength(150)] }),
    cpf: this.fb.control<string | null>(null, { validators: [Validators.minLength(11), Validators.maxLength(14)] }),
    dataNascimento: this.fb.control<Date | null>(null),
    telefone: this.fb.control<string | null>(null),
    email: this.fb.control<string | null>(null, { validators: [Validators.email] })
  });

  private onChange: (value: Conjuge | null) => void = () => {};
  private onTouched: () => void = () => {};

  constructor() {
    this.form.valueChanges.subscribe(v => this.onChange(v as Conjuge));
  }

  writeValue(obj: Conjuge | null): void {
    this.form.patchValue(obj ?? {}, { emitEvent: false });
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    isDisabled ? this.form.disable({ emitEvent: false }) : this.form.enable({ emitEvent: false });
  }
}
