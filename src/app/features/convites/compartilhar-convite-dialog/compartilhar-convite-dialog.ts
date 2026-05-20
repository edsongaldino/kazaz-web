import { Component, Inject, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { NgxMaskDirective } from 'ngx-mask';
import { ConviteCadastroListItemResponse } from '../../../models/cadastro-publico.models';

@Component({
  selector: 'app-compartilhar-convite-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatRadioModule,
    NgxMaskDirective
  ],
  templateUrl: './compartilhar-convite-dialog.html',
  styleUrl: './compartilhar-convite-dialog.scss'
})
export class CompartilharConviteDialog implements OnInit {
  private fb = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<CompartilharConviteDialog>);

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: { convite: ConviteCadastroListItemResponse }
  ) {}

  form!: FormGroup;

  ngOnInit(): void {
    this.form = this.fb.group({
      tipo: ['whatsapp', Validators.required],
      telefone: ['', [Validators.pattern(/^\d{10,11}$/)]],
      email: ['', [Validators.email]]
    });

    // Subscrição para ajustar validações dinamicamente
    this.form.get('tipo')?.valueChanges.subscribe(tipo => {
      this.atualizarValidacoes(tipo);
    });

    this.atualizarValidacoes('whatsapp');
  }

  private atualizarValidacoes(tipo: string): void {
    const telefoneCtrl = this.form.get('telefone');
    const emailCtrl = this.form.get('email');

    if (tipo === 'whatsapp') {
      telefoneCtrl?.setValidators([Validators.pattern(/^\d{10,11}$/)]);
      emailCtrl?.clearValidators();
    } else {
      emailCtrl?.setValidators([Validators.required, Validators.email]);
      telefoneCtrl?.clearValidators();
    }

    telefoneCtrl?.updateValueAndValidity();
    emailCtrl?.updateValueAndValidity();
  }

  get link(): string {
    return this.data.convite.link;
  }

  get previewMessage(): string {
    if (this.form?.get('tipo')?.value === 'whatsapp') {
      return `Olá! Segue o link para o preenchimento do seu cadastro da Kazaz:\n${this.link}`;
    } else {
      return `Assunto: Kazaz - Ficha de Cadastro\n\nOlá!\n\nSegue o link para o preenchimento da sua ficha de cadastro na Kazaz:\n\n${this.link}\n\nAtenciosamente,\nEquipe Kazaz`;
    }
  }

  compartilhar(): void {
    if (this.form.invalid) return;

    const values = this.form.getRawValue();
    if (values.tipo === 'whatsapp') {
      const msg = `Olá! Segue o link para o preenchimento do seu cadastro da Kazaz: ${this.link}`;
      const encodedMsg = encodeURIComponent(msg);
      
      if (values.telefone) {
        // Remove caracteres não numéricos antes de gerar o link (só por garantia, embora a máscara e validação façam isso)
        const numLimpo = values.telefone.replace(/\D/g, '');
        const waUrl = `https://api.whatsapp.com/send?phone=55${numLimpo}&text=${encodedMsg}`;
        window.open(waUrl, '_blank');
      } else {
        const waUrl = `https://api.whatsapp.com/send?text=${encodedMsg}`;
        window.open(waUrl, '_blank');
      }
    } else {
      const assunto = encodeURIComponent('Kazaz - Ficha de Cadastro');
      const corpo = encodeURIComponent(`Olá!\n\nSegue o link para o preenchimento da sua ficha de cadastro na Kazaz:\n\n${this.link}\n\nAtenciosamente,\nEquipe Kazaz`);
      
      const mailtoUrl = values.email
        ? `mailto:${values.email}?subject=${assunto}&body=${corpo}`
        : `mailto:?subject=${assunto}&body=${corpo}`;
        
      window.open(mailtoUrl, '_self');
    }

    this.dialogRef.close(true);
  }

  cancelar(): void {
    this.dialogRef.close(false);
  }
}
