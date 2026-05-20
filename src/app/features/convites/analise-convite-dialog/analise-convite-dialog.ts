import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, inject, ChangeDetectorRef } from '@angular/core';
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
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import {
  ConviteCadastroListItemResponse
} from '../../../models/cadastro-publico.models';
import { CadastroPublicoService } from '../../../core/services/cadastro-publico.service';
import { CidadeService } from '../../../core/services/cidade.service';
import { DocumentosService } from '../../../core/services/documentos.service';
import { NotificationService } from '../../../core/services/notification.service';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

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
    MatRadioModule,
    MatTabsModule,
    MatIconModule,
    MatCardModule,
    MatProgressBarModule
  ],
  templateUrl: './analise-convite-dialog.html',
  styleUrl: './analise-convite-dialog.scss'
})
export class AnaliseConviteDialog implements OnInit {
  form!: FormGroup;
  loading = false;
  detalhes: any = null;
  cidadeNome: string | null = null;
  estadoUf: string | null = null;

  private cadastroPublicoService = inject(CadastroPublicoService);
  private cidadeService = inject(CidadeService);
  private documentosService = inject(DocumentosService);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<AnaliseConviteDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ConviteCadastroListItemResponse
  ) {
    this.form = this.fb.group({
      resultado: [null, Validators.required],
      comentario: ['']
    });

    // Torna comentário obrigatório se for "Solicitar correção" (3)
    this.form.get('resultado')?.valueChanges.subscribe(val => {
      const commentCtrl = this.form.get('comentario');
      if (val === 3) {
        commentCtrl?.setValidators([Validators.required]);
      } else {
        commentCtrl?.clearValidators();
      }
      commentCtrl?.updateValueAndValidity();
    });
  }

  async ngOnInit() {
    await this.carregarDetalhes();
  }

  async carregarDetalhes() {
    if (!this.data.token) return;
    this.loading = true;
    try {
      const res = await firstValueFrom(
        this.cadastroPublicoService.obterDetalhes(this.data.token)
      );
      this.detalhes = res;

      if (res?.pessoa?.endereco?.cidadeId) {
        try {
          const city = await firstValueFrom(
            this.cidadeService.obterPorId(res.pessoa.endereco.cidadeId)
          );
          this.cidadeNome = city.nome;
          this.estadoUf = city.uf;
        } catch (e) {
          console.error('Erro ao buscar cidade', e);
        }
      }
    } catch (err) {
      console.error(err);
      this.notify.errorCenter('Erro ao carregar detalhes do convite.');
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  visualizarDocumento(doc: any): void {
    const baseUrl = environment.apiUrl.replace('/api', '');
    const url = `${baseUrl}/files/${doc.caminho}`;
    window.open(url, '_blank');
  }

  async invalidarDocumento(doc: any) {
    const confirmou = confirm(
      `Deseja realmente invalidar/remover o documento "${doc.nome}" (${doc.tipoDocumentoNome})? O arquivo será excluído e o cliente precisará enviar um novo.`
    );
    if (!confirmou) return;

    try {
      this.loading = true;
      await firstValueFrom(this.documentosService.remover(doc.id));
      this.notify.toastSuccess('Documento invalidado e excluído com sucesso!');
      await this.carregarDetalhes();
    } catch (err) {
      console.error(err);
      this.notify.errorCenter('Falha ao remover documento.');
    } finally {
      this.loading = false;
    }
  }

  confirmar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      if (this.form.get('comentario')?.hasError('required')) {
        this.notify.errorCenter('O comentário é obrigatório ao solicitar correção.');
      }
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