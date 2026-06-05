import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { LeadStatus } from '../../../models/lead.model';
import { Origem } from '../../../models/origem.model';
import { ImovelListDto } from '../../../models/imovel.model';

import { LeadsService } from '../../../core/services/leads.service';
import { OrigensService } from '../../../core/services/origens.service';
import { ImoveisService } from '../../../core/services/imoveis.service';
import { NotificationService } from '../../../core/services/notification.service';
import { NgxMaskDirective } from 'ngx-mask';

@Component({
  selector: 'app-lead-form',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule,
    NgxMaskDirective
  ],
  templateUrl: './lead-form.html',
  styleUrls: ['./lead-form.scss']
})
export class LeadFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly leadsService = inject(LeadsService);
  private readonly origensService = inject(OrigensService);
  private readonly imoveisService = inject(ImoveisService);
  private readonly notify = inject(NotificationService);

  private readonly dialogRef = inject(MatDialogRef<LeadFormComponent>, { optional: true });
  private readonly dialogData = inject(MAT_DIALOG_DATA, { optional: true });

  readonly leadId = signal<string | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);

  get isDialog(): boolean {
    return !!this.dialogRef;
  }

  readonly origens = signal<Origem[]>([]);
  readonly imoveis = signal<ImovelListDto[]>([]);

  readonly statusOptions: { value: LeadStatus; label: string }[] = [
    { value: LeadStatus.Novo, label: 'Novo' },
    { value: LeadStatus.EmAtendimento, label: 'Em Atendimento' },
    { value: LeadStatus.Convertido, label: 'Convertido' },
    { value: LeadStatus.Descartado, label: 'Descartado' }
  ];

  readonly form = this.fb.group({
    nome: ['', [Validators.required, Validators.maxLength(150)]],
    email: ['', [Validators.email, Validators.maxLength(150)]],
    telefone: ['', [Validators.maxLength(50)]],
    origemId: [null as string | null],
    imovelId: [null as string | null],
    status: [LeadStatus.Novo, Validators.required],
    mensagem: ['', [Validators.maxLength(2000)]]
  });

  ngOnInit(): void {
    this.carregarOrigens();
    this.carregarImoveis();

    const id = this.dialogData?.id || this.route.snapshot.paramMap.get('id');
    if (id) {
      this.leadId.set(id);
      this.carregarLead(id);
    }
  }

  private carregarOrigens(): void {
    this.origensService.getAllLight().then(
      res => this.origens.set(res ?? []),
      () => console.warn('Não foi possível carregar as origens.')
    );
  }

  private carregarImoveis(): void {
    this.imoveisService.listar({ page: 1, pageSize: 100 }).subscribe({
      next: (res) => this.imoveis.set(res.items ?? []),
      error: () => console.warn('Não foi possível carregar os imóveis.')
    });
  }

  private carregarLead(id: string): void {
    this.loading.set(true);
    this.leadsService.obter(id).subscribe({
      next: (lead) => {
        this.form.patchValue({
          nome: lead.nome,
          email: lead.email,
          telefone: lead.telefone,
          origemId: lead.origemId,
          imovelId: lead.imovelId,
          status: lead.status,
          mensagem: lead.mensagem
        });
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.notify.handleHttpError(err, 'Erro ao carregar os dados do atendimento.');
        this.router.navigate(['/leads']);
      }
    });
  }

  salvar(): void {
    if (this.form.invalid) {
      return;
    }

    this.saving.set(true);
    const body = {
      nome: this.form.value.nome!.trim(),
      email: this.form.value.email?.trim() || null,
      telefone: this.form.value.telefone?.trim() || null,
      origemId: this.form.value.origemId || null,
      imovelId: this.form.value.imovelId || null,
      mensagem: this.form.value.mensagem?.trim() || null,
      status: this.form.value.status!
    };

    const id = this.leadId();
    if (id) {
      this.leadsService.atualizar(id, { id, ...body }).subscribe({
        next: () => {
          this.saving.set(false);
          this.notify.toastSuccess('Atendimento atualizado com sucesso.');
          if (this.dialogRef) {
            this.dialogRef.close(true);
          } else {
            this.router.navigate(['/leads']);
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.notify.handleHttpError(err, 'Erro ao atualizar o atendimento.');
        }
      });
    } else {
      this.leadsService.criar(body).subscribe({
        next: () => {
          this.saving.set(false);
          this.notify.toastSuccess('Atendimento cadastrado com sucesso.');
          if (this.dialogRef) {
            this.dialogRef.close(true);
          } else {
            this.router.navigate(['/leads']);
          }
        },
        error: (err) => {
          this.saving.set(false);
          this.notify.handleHttpError(err, 'Erro ao criar o atendimento.');
        }
      });
    }
  }

  cancelar(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.router.navigate(['/leads']);
    }
  }
}
