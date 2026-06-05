import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { LeadListItem, LeadsFiltro, LeadStatus } from '../../../models/lead.model';
import { Origem } from '../../../models/origem.model';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { LeadsService } from '../../../core/services/leads.service';
import { OrigensService } from '../../../core/services/origens.service';
import { NotificationService } from '../../../core/services/notification.service';
import { ChipComponent } from '../../../shared/components/chips/chip';
import { ConvertDialogComponent } from '../convert-dialog/convert-dialog';
import { LeadFormComponent } from '../lead-form/lead-form';

@Component({
  selector: 'app-leads-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ReactiveFormsModule,
    MatDialogModule,

    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatTooltipModule,
    ChipComponent
  ],
  templateUrl: './leads-list.html',
  styleUrls: ['./leads-list.scss']
})
export class LeadsListComponent implements OnInit {
  readonly LeadStatus = LeadStatus;
  private readonly fb = inject(FormBuilder);
  private readonly leadsService = inject(LeadsService);
  private readonly origensService = inject(OrigensService);
  private readonly dialog = inject(MatDialog);
  private readonly notify = inject(NotificationService);

  readonly displayedColumns: string[] = [
    'dataCriacao',
    'nome',
    'contato',
    'origem',
    'imovel',
    'status',
    'actions'
  ];

  readonly form = this.fb.group({
    nome: [''],
    email: [''],
    telefone: [''],
    status: [null as LeadStatus | null],
    origemId: [null as string | null]
  });

  readonly statusOptions: { value: LeadStatus; label: string }[] = [
    { value: LeadStatus.Novo, label: 'Novo' },
    { value: LeadStatus.EmAtendimento, label: 'Em Atendimento' },
    { value: LeadStatus.Convertido, label: 'Convertido' },
    { value: LeadStatus.Descartado, label: 'Descartado' }
  ];

  readonly origens = signal<Origem[]>([]);
  readonly items = signal<LeadListItem[]>([]);
  readonly total = signal(0);
  readonly totalNovo = signal(0);
  readonly totalEmAtendimento = signal(0);
  readonly totalConvertido = signal(0);
  readonly totalDescartado = signal(0);
  readonly loading = signal(false);
  readonly errorMsg = signal<string | null>(null);

  readonly pageIndex = signal(0);
  readonly pageSize = signal(10);

  ngOnInit(): void {
    this.carregarOrigens();
    this.carregar();

    this.form.valueChanges
      .pipe(
        debounceTime(400),
        distinctUntilChanged()
      )
      .subscribe(() => {
        this.pageIndex.set(0);
        this.carregar();
      });
  }

  private carregarOrigens(): void {
    this.origensService.getAllLight().then(
      res => this.origens.set(res ?? []),
      () => console.warn('Não foi possível carregar as origens.')
    );
  }

  filtrar(): void {
    this.pageIndex.set(0);
    this.carregar();
  }

  clearFilters(): void {
    this.form.reset({
      nome: '',
      email: '',
      telefone: '',
      status: null,
      origemId: null
    });

    this.pageIndex.set(0);
    this.carregar();
  }

  onPage(event: PageEvent): void {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
    this.carregar();
  }

  carregar(): void {
    const filtro: LeadsFiltro = {
      page: this.pageIndex() + 1,
      pageSize: this.pageSize(),
      nome: this.normalizarTexto(this.form.value.nome),
      email: this.normalizarTexto(this.form.value.email),
      telefone: this.normalizarTexto(this.form.value.telefone),
      status: this.form.value.status,
      origemId: this.form.value.origemId
    };

    this.loading.set(true);
    this.errorMsg.set(null);

    this.leadsService.listar(filtro).subscribe({
      next: (res) => {
        this.items.set(res.items ?? []);
        this.total.set(res.total ?? 0);
        this.totalNovo.set(res.totalNovo ?? 0);
        this.totalEmAtendimento.set(res.totalEmAtendimento ?? 0);
        this.totalConvertido.set(res.totalConvertido ?? 0);
        this.totalDescartado.set(res.totalDescartado ?? 0);
        this.loading.set(false);
      },
      error: () => {
        this.items.set([]);
        this.total.set(0);
        this.loading.set(false);
        this.errorMsg.set('Não foi possível carregar os atendimentos.');
      }
    });
  }

  abrirFormulario(id?: string): void {
    const dialogRef = this.dialog.open(LeadFormComponent, {
      width: '950px',
      maxWidth: '95vw',
      panelClass: 'lead-dialog-panel',
      data: { id }
    });

    dialogRef.afterClosed().subscribe((saved) => {
      if (saved) {
        this.carregar();
      }
    });
  }

  excluir(id: string): void {
    this.notify.confirm(
      'Remover Atendimento?',
      'Esta ação irá apagar o registro deste lead permanentemente.',
      'Sim, Excluir',
      'Cancelar'
    ).then((confirmed) => {
      if (confirmed) {
        this.leadsService.excluir(id).subscribe({
          next: () => {
            this.notify.toastSuccess('Atendimento excluído com sucesso.');
            this.carregar();
          },
          error: (err) => this.notify.handleHttpError(err, 'Erro ao excluir o lead.')
        });
      }
    });
  }

  converter(lead: LeadListItem): void {
    if (lead.status === LeadStatus.Convertido) {
      this.notify.errorCenter('Erro', 'Este lead já foi convertido em cliente.');
      return;
    }

    const dialogRef = this.dialog.open(ConvertDialogComponent, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe((res) => {
      if (res) {
        this.loading.set(true);
        this.leadsService.converter(lead.id, res).subscribe({
          next: (converted) => {
            this.loading.set(false);
            this.notify.successCenter(
              'Convertido!',
              'Lead convertido em cliente com sucesso.',
              'Ver Cliente',
              () => {
                window.location.href = `/pessoas/editar/${converted.pessoaId}`;
              }
            );
            this.carregar();
          },
          error: (err) => {
            this.loading.set(false);
            this.notify.handleHttpError(err, 'Falha ao converter o lead.');
          }
        });
      }
    });
  }

  private normalizarTexto(value?: string | null): string | null {
    const texto = value?.trim();
    return texto ? texto : null;
  }
}
