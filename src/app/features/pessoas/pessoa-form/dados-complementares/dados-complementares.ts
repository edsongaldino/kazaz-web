import { Component, Host, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlContainer, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dados-complementares',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule
  ],
  templateUrl: './dados-complementares.html',
  styleUrls: ['./dados-complementares.scss']
})
export class DadosComplementaresComponent {
  constructor(@Optional() @Host() private controlContainer: ControlContainer) {}

  get form(): FormGroup {
    return this.controlContainer?.control as FormGroup;
  }
}
