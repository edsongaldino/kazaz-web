import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';

import { ContratosService } from '../../../core/services/contratos.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-regras-checklist',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCheckboxModule,
    MatProgressBarModule
  ],
  templateUrl: './checklist.html',
  styleUrls: ['./checklist.scss']
})
export class RegrasChecklistComponent implements OnInit {
  private contratosService = inject(ContratosService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private notification = inject(NotificationService);

  carregando = false;

  // Listas de dados
  globalStepsEntrada: any[] = [];
  globalStepsSaida: any[] = [];

  // FormGroups
  formGlobalStep!: FormGroup;

  // Refs de Diálogo
  dialogRef?: MatDialogRef<any>;

  // Templates de Diálogo
  @ViewChild('dialogGlobalStep') tempGlobalStep!: TemplateRef<any>;

  // Columns exibidas nas tabelas
  colsGlobalStep: string[] = ['label', 'tipoField', 'card', 'acoes'];

  ngOnInit(): void {
    this.carregarDados();
    this.initForms();
  }

  carregarDados(): void {
    this.carregando = true;

    this.contratosService.obterEtapasGlobais('entrada').subscribe({
      next: (res) => {
        this.globalStepsEntrada = res;
      },
      error: () => {
        this.notification.toastError('Erro ao carregar etapas globais de entrada');
      }
    });

    this.contratosService.obterEtapasGlobais('saida').subscribe({
      next: (res) => {
        this.globalStepsSaida = res;
        this.carregando = false;
      },
      error: () => {
        this.globalStepsSaida = [];
        this.carregando = false;
        this.notification.toastError('Erro ao carregar etapas globais de saída');
      }
    });
  }

  private initForms(): void {
    this.formGlobalStep = this.fb.group({
      tipoChecklist: ['entrada', [Validators.required]],
      label: ['', [Validators.required, Validators.maxLength(150)]],
      tipoField: ['text', [Validators.required]],
      card: ['', [Validators.required, Validators.maxLength(150)]],
      novoCardNome: ['']
    });
  }

  // ---------- Etapas Globais CRUD ----------
  abrirNovaEtapaGlobal(tipo: 'entrada' | 'saida'): void {
    this.formGlobalStep.reset({
      tipoChecklist: tipo,
      label: '',
      tipoField: 'text',
      card: '',
      novoCardNome: ''
    });
    this.dialogRef = this.dialog.open(this.tempGlobalStep, { width: '500px' });
  }

  onCardSelectionChange(val: string): void {
    const control = this.formGlobalStep.get('novoCardNome');
    if (val === 'novo') {
      control?.setValidators([Validators.required, Validators.maxLength(150)]);
    } else {
      control?.clearValidators();
    }
    control?.updateValueAndValidity();
  }

  getCardsDisponiveis(): string[] {
    const tipo = this.formGlobalStep.get('tipoChecklist')?.value;
    if (tipo === 'entrada') {
      return ['Assinatura & Entrega', 'Contas & Utilidades', 'IPTU', 'Vistoria & Manutenção', 'Bônus de Locação'];
    } else {
      return ['Rescisão & Saída', 'Valores & Garantias', 'Encerramento de Contas', 'Entrega Física & Divulgação'];
    }
  }

  salvarEtapaGlobal(): void {
    if (this.formGlobalStep.invalid) {
      this.formGlobalStep.markAllAsTouched();
      this.notification.toastError('Preencha os campos obrigatórios corretamente.');
      return;
    }

    const raw = this.formGlobalStep.value;
    const cardName = raw.card === 'novo' ? raw.novoCardNome : raw.card;

    this.carregando = true;

    this.contratosService.criarEtapaGlobal({
      tipoChecklist: raw.tipoChecklist,
      label: raw.label,
      tipoField: raw.tipoField,
      card: cardName
    }).subscribe({
      next: () => {
        this.notification.toastSuccess('Etapa global adicionada!');
        this.dialogRef?.close();
        this.carregarDados();
      },
      error: (err) => {
        this.carregando = false;
        this.notification.toastError(err?.error?.error ?? 'Erro ao adicionar etapa global.');
      }
    });
  }

  async excluirEtapaGlobal(step: any): Promise<void> {
    const confirm = await this.notification.confirm(
      'Excluir etapa global?',
      `Esta etapa "${step.label}" será excluída permanentemente de TODOS os contratos. Esta ação não pode ser desfeita.`,
      'Sim, excluir',
      'Cancelar'
    );

    if (!confirm) return;

    this.carregando = true;
    this.contratosService.excluirEtapaGlobal(step.id).subscribe({
      next: () => {
        this.notification.toastSuccess('Etapa global removida com sucesso!');
        this.carregarDados();
      },
      error: () => {
        this.carregando = false;
        this.notification.toastError('Erro ao remover etapa global.');
      }
    });
  }

  getLabelTipoField(val: string): string {
    switch (val) {
      case 'date': return 'Data';
      case 'boolean': return 'Sim/Não';
      case 'textarea': return 'Texto Longo';
      default: return 'Texto Curto';
    }
  }
}
