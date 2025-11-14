import { CommonModule } from '@angular/common';
import { Component, ViewChild, ChangeDetectorRef, inject, signal, computed } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { take, map } from 'rxjs/operators';
import { firstValueFrom, Observable } from 'rxjs';
import { MaterialModule } from '../../../shared/material.module';
import { SharedModule } from '../../../shared/shared.module';
import { EnderecoComponent } from '../../../shared/components/endereco/endereco';

import {
  ImovelDto,
  ImovelCreateRequest,
  ImovelUpdateRequest,
} from '../../../models/imovel.model';
import { ImoveisService } from '../../../core/services/imoveis.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-imovel-form',
  standalone: true,
  imports: [
    MaterialModule,
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    EnderecoComponent,
    SharedModule,
  ],
  templateUrl: './imovel-form.html',
  styleUrls: ['./imovel-form.scss'],
})
export class ImovelFormComponent {
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private service = inject(ImoveisService);
  private cdr = inject(ChangeDetectorRef);

  @ViewChild(EnderecoComponent) enderecoCmp!: EnderecoComponent;

  id = signal<string | null>(null);
  modoEdicao = computed(() => !!this.id());
  loading = signal(false);
  saving = signal(false);
  errorMsg = signal<string | null>(null);

  form = this.fb.group({
    codigo: ['', [Validators.required, Validators.maxLength(50)]],
    endereco: this.fb.group({
      cep: [''],
      logradouro: [''],
      numero: [''],
      complemento: [''],
      bairro: [''],
      estadoId: [null],
      cidadeId: [null],
    }),
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.id.set(id);
      this.carregarEdicao(id);
    }
  }

  get enderecoForm(): FormGroup {
    return this.form.get('endereco') as FormGroup;
  }

  private async carregarEdicao(id: string) {
    try {
      this.loading.set(true);
      const imovel: ImovelDto = await firstValueFrom(this.service.obterPorId(id));

      this.form.patchValue(
        {
          codigo: imovel.codigo,
        },
        { emitEvent: false }
      );

      if (imovel.endereco) {
        // Preenche o subform como em Pessoas
        this.enderecoForm.patchValue(
          {
            cep: imovel.endereco.cep ?? '',
            logradouro: imovel.endereco.logradouro ?? '',
            numero: imovel.endereco.numero ?? '',
            complemento: imovel.endereco.complemento ?? '',
            bairro: imovel.endereco.bairro ?? '',
            estadoId: imovel.endereco.estadoId ?? null,
            cidadeId: imovel.endereco.cidadeId ?? null,
          },
          { emitEvent: true }
        );

        // Se seu EnderecoComponent precisa carregar cidades baseado no estado:
        this.enderecoCmp?.onEstadoChange?.();
      }

      this.loading.set(false);
    } catch (err) {
      console.error(err);
      this.loading.set(false);
      this.errorMsg.set('Não foi possível carregar os dados do imóvel.');
    } finally {
      this.cdr.markForCheck();
    }
  }

  salvar() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const codigo = this.form.controls['codigo'].value || '';
    const enderecoReq = this.enderecoForm.getRawValue();

    const createReq: ImovelCreateRequest = {
      codigo,
      endereco: enderecoReq,
    };

    const updateReq: ImovelUpdateRequest = {
      id: this.id()!,
      codigo,
      endereco: enderecoReq,
    };

    this.saving.set(true);

    const obs$: Observable<void> = this.modoEdicao()
        ? this.service.atualizar(this.id()!, updateReq)
        : this.service.criar(createReq).pipe(map(() => void 0)); 

      obs$.pipe(take(1)).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/imoveis']);
        },
        error: (err: HttpErrorResponse) => {
          console.error(err);
          this.saving.set(false);
          this.errorMsg.set('Falha ao salvar. Verifique os campos e tente novamente.');
        },
      });
  }

  cancelar() {
    this.router.navigate(['/imoveis']);
  }
}
