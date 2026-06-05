import { Component, OnInit, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MaterialModule } from '../../../shared/material.module';
import { NgxMaskDirective } from 'ngx-mask';
import { EnderecoComponent } from '../../../shared/components/endereco/endereco';
import { ImobiliariaService } from '../../../core/services/imobiliaria.service';
import { CidadeService } from '../../../core/services/cidade.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ImobiliariaResponseDto, ImobiliariaUpdateDto } from '../../../models/imobiliaria.model';

@Component({
  selector: 'app-dados-imobiliaria',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MaterialModule,
    NgxMaskDirective,
    EnderecoComponent
  ],
  templateUrl: './dados-imobiliaria.html',
  styleUrls: ['./dados-imobiliaria.scss']
})
export class DadosImobiliariaComponent implements OnInit {
  private fb = inject(FormBuilder);
  private imobiliariaService = inject(ImobiliariaService);
  private cidadeService = inject(CidadeService);
  private notification = inject(NotificationService);

  @ViewChild(EnderecoComponent) enderecoCmp?: EnderecoComponent;

  loading = signal(false);
  salvando = signal(false);

  form!: FormGroup;
  enderecoForm!: FormGroup;

  ngOnInit(): void {
    this.initForms();
    this.carregarDados();
  }

  private initForms(): void {
    // Endereço form group
    this.enderecoForm = this.fb.group({
      cep: ['', [Validators.required]],
      logradouro: ['', [Validators.required]],
      numero: ['', [Validators.required]],
      complemento: [''],
      bairro: ['', [Validators.required]],
      estadoId: [null, [Validators.required]],
      cidadeId: [null, [Validators.required]],
      estado: [''],
      cidade: ['']
    });

    // Main form group
    this.form = this.fb.group({
      razaoSocial: ['', [Validators.required, Validators.maxLength(150)]],
      nomeFantasia: ['', [Validators.required, Validators.maxLength(150)]],
      cnpj: ['', [Validators.required]],
      creci: ['', [Validators.required, Validators.maxLength(50)]],
      dataFundacao: [null],
      logoUrl: [''],
      email: ['', [Validators.email]],
      telefone: [''],
      endereco: this.enderecoForm
    });
  }

  private carregarDados(): void {
    this.loading.set(true);
    this.imobiliariaService.obter().subscribe({
      next: (res: ImobiliariaResponseDto) => {
        this.loading.set(false);
        if (res) {
          this.form.patchValue({
            razaoSocial: res.razaoSocial,
            nomeFantasia: res.nomeFantasia,
            cnpj: res.cnpj,
            creci: res.creci,
            dataFundacao: res.dataFundacao ? res.dataFundacao.split('T')[0] : null,
            logoUrl: res.logoUrl,
            email: res.email,
            telefone: res.telefone
          });

          if (res.endereco && res.endereco.cidadeId) {
            this.cidadeService.obterPorId(res.endereco.cidadeId).subscribe({
              next: async (cidade) => {
                this.enderecoForm.patchValue({
                  cep: res.endereco!.cep,
                  logradouro: res.endereco!.logradouro,
                  numero: res.endereco!.numero,
                  complemento: res.endereco!.complemento,
                  bairro: res.endereco!.bairro,
                  estadoId: cidade.estadoId,
                  cidadeId: null
                });

                await Promise.resolve();
                await this.enderecoCmp?.onEstadoChange?.();

                setTimeout(() => {
                  this.enderecoForm.get('cidadeId')?.setValue(cidade.id, { emitEvent: false });
                }, 50);
              }
            });
          }
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.notification.toastError('Erro ao carregar dados da imobiliária');
      }
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.notification.toastError('Por favor, preencha todos os campos obrigatórios corretamente.');
      return;
    }

    this.salvando.set(true);

    const values = this.form.value;
    const body: ImobiliariaUpdateDto = {
      razaoSocial: values.razaoSocial,
      nomeFantasia: values.nomeFantasia,
      cnpj: values.cnpj.replace(/\D/g, ''),
      creci: values.creci,
      dataFundacao: values.dataFundacao || null,
      logoUrl: values.logoUrl || null,
      email: values.email || null,
      telefone: values.telefone ? values.telefone.replace(/\D/g, '') : null,
      endereco: {
        cep: this.enderecoForm.get('cep')?.value.replace(/\D/g, ''),
        logradouro: this.enderecoForm.get('logradouro')?.value,
        numero: this.enderecoForm.get('numero')?.value,
        complemento: this.enderecoForm.get('complemento')?.value || null,
        bairro: this.enderecoForm.get('bairro')?.value,
        cidadeId: this.enderecoForm.get('cidadeId')?.value
      }
    };

    this.imobiliariaService.salvar(body).subscribe({
      next: () => {
        this.salvando.set(false);
        this.notification.toastSuccess('Dados da imobiliária salvos com sucesso!');
        this.carregarDados();
      },
      error: (err) => {
        this.salvando.set(false);
        this.notification.toastError('Erro ao salvar dados da imobiliária');
      }
    });
  }
}
