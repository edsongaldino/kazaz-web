import { Component, OnInit, TemplateRef, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
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

import { ConfiguracoesService } from '../../core/services/configuracoes.service';
import { ContratosService } from '../../core/services/contratos.service';
import { NotificationService } from '../../core/services/notification.service';
import { TipoDocumento, RegraDocumentoCadastro } from '../../models/configuracoes.models';

@Component({
  selector: 'app-configuracoes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTabsModule,
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
  templateUrl: './configuracoes.html',
  styleUrls: ['./configuracoes.scss']
})
export class ConfiguracoesComponent implements OnInit {
  private configService = inject(ConfiguracoesService);
  private contratosService = inject(ContratosService);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);
  private notification = inject(NotificationService);

  carregando = false;

  // Listas de dados
  tiposDocumento: TipoDocumento[] = [];
  regras: RegraDocumentoCadastro[] = [];
  globalStepsEntrada: any[] = [];
  globalStepsSaida: any[] = [];

  // FormGroups
  formTipoDoc!: FormGroup;
  formRegra!: FormGroup;
  formGlobalStep!: FormGroup;

  // Estados de Edição
  editingTipoDocId: string | null = null;
  editingRegraId: string | null = null;

  // Refs de Diálogo
  dialogRef?: MatDialogRef<any>;

  // Templates de Diálogo
  @ViewChild('dialogTipoDoc') tempTipoDoc!: TemplateRef<any>;
  @ViewChild('dialogRegra') tempRegra!: TemplateRef<any>;
  @ViewChild('dialogGlobalStep') tempGlobalStep!: TemplateRef<any>;

  // Columns exibidas nas tabelas
  colsTipoDoc: string[] = ['nome', 'alvo', 'obrigatorio', 'ordem', 'ativo', 'acoes'];
  colsRegra: string[] = ['tipoPessoa', 'tipoContrato', 'papelContrato', 'tipoDocumento', 'obrigatorio', 'ordem', 'multiplicidade', 'rotulo', 'ativo', 'acoes'];
  colsGlobalStep: string[] = ['label', 'tipoField', 'card', 'acoes'];

  ngOnInit(): void {
    this.carregarDados();
    this.initForms();
  }

  carregarDados(): void {
    this.carregando = true;
    
    // Carrega tudo em paralelo
    this.configService.obterTiposDocumento().subscribe({
      next: (res) => {
        this.tiposDocumento = res;
      },
      error: (err) => {
        this.notification.toastError('Erro ao carregar tipos de documento');
      }
    });

    this.configService.obterRegrasDocumento().subscribe({
      next: (res) => {
        this.regras = res;
      },
      error: (err) => {
        this.notification.toastError('Erro ao carregar regras de documentos');
      }
    });

    this.contratosService.obterEtapasGlobais('entrada').subscribe({
      next: (res) => {
        this.globalStepsEntrada = res;
      },
      error: (err) => {
        this.notification.toastError('Erro ao carregar etapas globais de entrada');
      }
    });

    this.contratosService.obterEtapasGlobais('saida').subscribe({
      next: (res) => {
        this.globalStepsSaida = res;
        this.carregando = false;
      },
      error: (err) => {
        this.globalStepsSaida = [];
        this.carregando = false;
        this.notification.toastError('Erro ao carregar etapas globais de saída');
      }
    });
  }

  private initForms(): void {
    this.formTipoDoc = this.fb.group({
      nome: ['', [Validators.required, Validators.maxLength(150)]],
      alvo: [1, [Validators.required]],
      obrigatorio: [false],
      ordem: [0, [Validators.required, Validators.min(0)]],
      ativo: [true],
      descricao: ['']
    });

    this.formRegra = this.fb.group({
      tipoPessoa: [0, [Validators.required]],
      tipoContrato: [0, [Validators.required]],
      papelContrato: [0, [Validators.required]],
      tipoDocumentoId: ['', [Validators.required]],
      obrigatorio: [true],
      ordem: [0, [Validators.required, Validators.min(0)]],
      multiplicidade: [1, [Validators.required, Validators.min(1)]],
      rotulo: ['', [Validators.maxLength(200)]],
      ativo: [true]
    });

    this.formGlobalStep = this.fb.group({
      tipoChecklist: ['entrada', [Validators.required]],
      label: ['', [Validators.required, Validators.maxLength(150)]],
      tipoField: ['text', [Validators.required]],
      card: ['', [Validators.required, Validators.maxLength(150)]],
      novoCardNome: ['']
    });
  }

  // ---------- Tipos de Documento CRUD ----------
  abrirNovoTipoDoc(): void {
    this.editingTipoDocId = null;
    this.formTipoDoc.reset({
      nome: '',
      alvo: 1,
      obrigatorio: false,
      ordem: 0,
      ativo: true,
      descricao: ''
    });
    this.dialogRef = this.dialog.open(this.tempTipoDoc, { width: '500px' });
  }

  abrirEditarTipoDoc(doc: TipoDocumento): void {
    this.editingTipoDocId = doc.id;
    this.formTipoDoc.reset({
      nome: doc.nome,
      alvo: doc.alvo,
      obrigatorio: doc.obrigatorio,
      ordem: doc.ordem,
      ativo: doc.ativo,
      descricao: doc.descricao
    });
    this.dialogRef = this.dialog.open(this.tempTipoDoc, { width: '500px' });
  }

  salvarTipoDoc(): void {
    if (this.formTipoDoc.invalid) {
      this.formTipoDoc.markAllAsTouched();
      this.notification.toastError('Preencha os campos obrigatórios corretamente.');
      return;
    }

    const raw = this.formTipoDoc.value;
    this.carregando = true;

    if (this.editingTipoDocId) {
      this.configService.atualizarTipoDocumento(this.editingTipoDocId, raw).subscribe({
        next: () => {
          this.notification.toastSuccess('Tipo de documento atualizado!');
          this.dialogRef?.close();
          this.carregarDados();
        },
        error: (err) => {
          this.carregando = false;
          this.notification.toastError(err?.error?.error ?? 'Erro ao atualizar tipo de documento.');
        }
      });
    } else {
      this.configService.criarTipoDocumento(raw).subscribe({
        next: () => {
          this.notification.toastSuccess('Tipo de documento criado!');
          this.dialogRef?.close();
          this.carregarDados();
        },
        error: (err) => {
          this.carregando = false;
          this.notification.toastError(err?.error?.error ?? 'Erro ao criar tipo de documento.');
        }
      });
    }
  }

  async excluirTipoDoc(doc: TipoDocumento): Promise<void> {
    const confirm = await this.notification.confirm(
      'Excluir Tipo de Documento?',
      `Deseja realmente excluir "${doc.nome}"? Esta ação só será permitida se não houverem regras vinculadas a ele.`,
      'Sim, excluir',
      'Cancelar'
    );

    if (!confirm) return;

    this.carregando = true;
    this.configService.excluirTipoDocumento(doc.id).subscribe({
      next: () => {
        this.notification.toastSuccess('Tipo de documento excluído!');
        this.carregarDados();
      },
      error: (err) => {
        this.carregando = false;
        this.notification.toastError(err?.error?.error ?? 'Erro ao excluir tipo de documento. Verifique dependências.');
      }
    });
  }

  // ---------- Regras de Cadastro CRUD ----------
  abrirNovaRegra(): void {
    this.editingRegraId = null;
    this.formRegra.reset({
      tipoPessoa: 0,
      tipoContrato: 0,
      papelContrato: 0,
      tipoDocumentoId: '',
      obrigatorio: true,
      ordem: 0,
      multiplicidade: 1,
      rotulo: '',
      ativo: true
    });
    this.dialogRef = this.dialog.open(this.tempRegra, { width: '600px' });
  }

  abrirEditarRegra(regra: RegraDocumentoCadastro): void {
    this.editingRegraId = regra.id;
    this.formRegra.reset({
      tipoPessoa: regra.tipoPessoa,
      tipoContrato: regra.tipoContrato,
      papelContrato: regra.papelContrato,
      tipoDocumentoId: regra.tipoDocumentoId,
      obrigatorio: regra.obrigatorio,
      ordem: regra.ordem,
      multiplicidade: regra.multiplicidade,
      rotulo: regra.rotulo,
      ativo: regra.ativo
    });
    this.dialogRef = this.dialog.open(this.tempRegra, { width: '600px' });
  }

  salvarRegra(): void {
    if (this.formRegra.invalid) {
      this.formRegra.markAllAsTouched();
      this.notification.toastError('Preencha os campos obrigatórios corretamente.');
      return;
    }

    const raw = this.formRegra.value;
    this.carregando = true;

    if (this.editingRegraId) {
      this.configService.atualizarRegraDocumento(this.editingRegraId, raw).subscribe({
        next: () => {
          this.notification.toastSuccess('Regra de documento atualizada!');
          this.dialogRef?.close();
          this.carregarDados();
        },
        error: (err) => {
          this.carregando = false;
          this.notification.toastError(err?.error?.error ?? 'Erro ao atualizar regra.');
        }
      });
    } else {
      this.configService.criarRegraDocumento(raw).subscribe({
        next: () => {
          this.notification.toastSuccess('Regra de documento criada!');
          this.dialogRef?.close();
          this.carregarDados();
        },
        error: (err) => {
          this.carregando = false;
          this.notification.toastError(err?.error?.error ?? 'Erro ao criar regra.');
        }
      });
    }
  }

  async excluirRegra(regra: RegraDocumentoCadastro): Promise<void> {
    const confirm = await this.notification.confirm(
      'Excluir Regra de Documento?',
      `Deseja excluir esta regra do tipo "${regra.tipoDocumentoNome}"? Novas pessoas cadastradas deixarão de ser validadas sob esta regra.`,
      'Sim, excluir',
      'Cancelar'
    );

    if (!confirm) return;

    this.carregando = true;
    this.configService.excluirRegraDocumento(regra.id).subscribe({
      next: () => {
        this.notification.toastSuccess('Regra excluída!');
        this.carregarDados();
      },
      error: (err) => {
        this.carregando = false;
        this.notification.toastError('Erro ao excluir regra.');
      }
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
      error: (err) => {
        this.carregando = false;
        this.notification.toastError('Erro ao remover etapa global.');
      }
    });
  }

  // ---------- Helpers de Formatação ----------
  getLabelTipoPessoa(val: number): string {
    switch (val) {
      case 1: return 'Pessoa Física (PF)';
      case 2: return 'Pessoa Jurídica (PJ)';
      default: return 'Qualquer tipo';
    }
  }

  getLabelTipoContrato(val: number): string {
    switch (val) {
      case 1: return 'Locação';
      case 2: return 'Venda';
      case 3: return 'Compra';
      default: return 'Qualquer contrato';
    }
  }

  getLabelPapelContrato(val: number): string {
    switch (val) {
      case 1: return 'Locador';
      case 2: return 'Locatário';
      case 3: return 'Fiador';
      case 10: return 'Vendedor';
      case 11: return 'Comprador';
      default: return 'Qualquer papel';
    }
  }

  getLabelAlvo(val: number): string {
    return val === 1 ? 'Cliente (Pessoa)' : 'Imóvel';
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
