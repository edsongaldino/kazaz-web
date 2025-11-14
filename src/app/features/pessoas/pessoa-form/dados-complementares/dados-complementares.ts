import { Component, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormControl } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { DadosComplementares } from '../../../../models/dados-complementares.model';

@Component({
  selector: 'app-dados-complementares',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatSelectModule, MatIconModule],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DadosComplementaresComponent),
    multi: true
  }],
  templateUrl: './dados-complementares.html'
})
export class DadosComplementaresComponent implements ControlValueAccessor {
  disabled = signal(false);
  escolaridades = ['Fundamental', 'Médio', 'Técnico', 'Superior', 'Pós-graduação', 'Mestrado', 'Doutorado'];

  private onChange: (value: DadosComplementares | null) => void = () => {};
  private onTouched: () => void = () => {};

  form: FormGroup<{
    profissao: FormControl<string | null>;
    escolaridade: FormControl<string | null>;
    rendaMensal: FormControl<number | null>;
    observacoes: FormControl<string | null>;
  }>;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      profissao: this.fb.control<string | null>(null, { validators: [Validators.maxLength(120)] }),
      escolaridade: this.fb.control<string | null>(null),
      rendaMensal: this.fb.control<number | null>(null),
      observacoes: this.fb.control<string | null>(null, { validators: [Validators.maxLength(2000)] })
    });

    this.form.valueChanges.subscribe(v => this.onChange(v as DadosComplementares));
  }

  writeValue(obj: DadosComplementares | null): void {
    this.form.patchValue(obj ?? {}, { emitEvent: false });
  }
  registerOnChange(fn: any): void { this.onChange = fn; }
  registerOnTouched(fn: any): void { this.onTouched = fn; }
  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
    isDisabled ? this.form.disable({ emitEvent: false }) : this.form.enable({ emitEvent: false });
  }
}
