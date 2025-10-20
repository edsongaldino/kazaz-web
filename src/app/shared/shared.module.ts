import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { MaterialModule } from './material.module'; // onde está centralizado o Angular Material
import { EnderecoComponent } from './components/endereco/endereco';
import { NgxMaskDirective } from 'ngx-mask';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressBar } from '@angular/material/progress-bar';

@NgModule({
  declarations: [
     // seus componentes reutilizáveis aqui
  ],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    NgxMaskDirective,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBar
  ],
  exports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    NgxMaskDirective,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressBar
  ]
})
export class SharedModule {}
