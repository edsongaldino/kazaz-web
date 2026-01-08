import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { RouterModule } from '@angular/router';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { UsuariosService } from '../../../core/services/usuarios.service';
import { PerfisService } from '../../../core/services/perfis.service';
import { PerfilDto, UsuarioListDto } from '../../../models/usuario.models';
import { MaterialModule } from '../../../shared/material.module';

type DialogData =
  | { mode: 'create'; usuario?: never }
  | { mode: 'edit'; usuario: UsuarioListDto };

type UsuarioForm = {
  nome: FormControl<string>;
  email: FormControl<string>;
  senha: FormControl<string>;
  ativo: FormControl<boolean>;
  perfilId: FormControl<string | null>;
};

type UsuarioCreatePayload = {
  nome: string;
  email: string;
  senha: string;
  ativo: boolean;
  perfilId: string;
};

type UsuarioUpdatePayload = {
  nome: string;
  email: string;
  ativo: boolean;
  perfilId: string;
};

@Component({
  selector: 'app-usuario-dialog',
  standalone: true,
  imports: [CommonModule, MaterialModule, RouterModule, ReactiveFormsModule],
  templateUrl: './usuario-dialog.html',
  styleUrls: ['./usuario-dialog.scss']
})
export class UsuarioDialogComponent implements OnInit {
  perfis: PerfilDto[] = [];
  saving = false;

  form: FormGroup<UsuarioForm>;

  constructor(
    private fb: FormBuilder,
    private usuarios: UsuariosService,
    private perfisSvc: PerfisService,
    private ref: MatDialogRef<UsuarioDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {
    this.form = this.fb.group<UsuarioForm>({
      nome: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(3)]
      }),
      email: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email]
      }),
      senha: this.fb.control('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(6)]
      }),
      ativo: this.fb.control(true, { nonNullable: true }),
      perfilId: this.fb.control<string | null>(null, {
        validators: [Validators.required]
      })
    });

    // ✅ Modo edição: não usa senha (não remove para não quebrar tipagem)
    if (this.data.mode === 'edit') {
      this.form.patchValue({
        nome: this.data.usuario.nome,
        email: this.data.usuario.email,
        ativo: this.data.usuario.ativo,
        perfilId: this.data.usuario.perfilId ?? null
      });

      const senhaCtrl = this.form.controls.senha;
      senhaCtrl.clearValidators();
      senhaCtrl.setValue('');
      senhaCtrl.disable({ emitEvent: false });
      senhaCtrl.updateValueAndValidity({ emitEvent: false });
    }
  }

  private isEditMode(): this is { data: { mode: 'edit'; usuario: UsuarioListDto } } {
    return this.data.mode === 'edit';
  }


  ngOnInit(): void {
    this.perfisSvc.listar().subscribe({
      next: (res: any) => {
        const lista =
          Array.isArray(res) ? res :
          Array.isArray(res?.data) ? res.data :
          Array.isArray(res?.items) ? res.items :
          [];

        this.perfis = lista;
      },
      error: () => console.error('Erro ao carregar perfis')
    });
  }

  close(ok: boolean) {
    this.ref.close(ok);
  }

  salvar(): void {
    if (this.form.invalid) return;

    this.saving = true;

    if (this.data.mode === 'create') {
      const payload = this.form.getRawValue() as any;

      this.usuarios.criar(payload).subscribe({
        next: () => {
          this.saving = false;
          this.close(true);
        },
        error: () => (this.saving = false)
      });

      return;
    }

    // ✅ A PARTIR DAQUI O TS SABE QUE É EDIT
    const usuario = this.data.usuario; // <- NÃO é undefined aqui

    const payload = {
      nome: this.form.controls.nome.value,
      email: this.form.controls.email.value,
      ativo: this.form.controls.ativo.value,
      perfilId: this.form.controls.perfilId.value!,
    };

    this.usuarios.atualizar(usuario.id, payload).subscribe({
      next: () => {
        this.saving = false;
        this.close(true);
      },
      error: () => (this.saving = false)
    });
  }

}