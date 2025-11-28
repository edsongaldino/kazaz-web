import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlContainer, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dados-complementares',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatFormFieldModule, MatInputModule, MatIconModule],
  templateUrl: './dados-complementares.html',
})
export class DadosComplementaresComponent {
  constructor(private controlContainer: ControlContainer) {}

  get form(): FormGroup {
    return this.controlContainer.control as FormGroup;
  }
}
