import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import Swal from 'sweetalert2';
import { NotificationService } from '../../../core/services/notification.service';

import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AnaliseConviteDialog } from '../analise-convite-dialog/analise-convite-dialog';
import { CompartilharConviteDialog } from '../compartilhar-convite-dialog/compartilhar-convite-dialog';
import { ChipComponent } from '../../../shared/components/chips/chip';
import { DocumentoPipe } from '../../../shared/pipes/documento-pipe';

import {
  ConviteCadastroListItemResponse,
  ListarConvitesCadastroQuery
} from '../../../models/cadastro-publico.models';

import { ConvitesCadastroService } from '../../../core/services/convites.service';

import {
  convitePapelOptions,
  conviteStatusOptions
} from '../../../shared/helpers/convite.helper';

import { ConviteUiService } from '../../../shared/services/convite-ui.service';

@Component({
  selector: 'app-convites-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatDialogModule,
    ChipComponent,
    DocumentoPipe
  ],
  templateUrl: './convites-list.html',
  styleUrl: './convites-list.scss'
})
export class ConvitesList implements OnInit {
  private convitesService = inject(ConvitesCadastroService);
  private conviteUi = inject(ConviteUiService);
  private dialog = inject(MatDialog);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);
  private notify = inject(NotificationService);
  private router = inject(Router);

  carregando = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  filtroForm = this.fb.group({
    status: [null as number | null],
    papel: [null as number | null],
    nome: [''],
    documento: [''],
    imovel: [''],
    preenchidoDe: [''],
    preenchidoAte: ['']
  });

  displayedColumns: string[] = [
    'numeroContrato',
    'nomeImovel',
    'pessoa',
    'papel',
    'status',
    'criadoEm',
    'acoes'
  ];

  dataSource = new MatTableDataSource<ConviteCadastroListItemResponse>([]);

  total = 0;
  pageSize = 10;

  statusOptions = conviteStatusOptions;
  papelOptions = convitePapelOptions;

  async ngOnInit() {
    await this.carregar();
  }

  async carregar() {
    this.carregando = true;
    const filtro = this.filtroForm.getRawValue();

    try {
      const resp = await firstValueFrom(
        this.convitesService.listarParaAnalise({
          page: (this.paginator?.pageIndex ?? 0) + 1,
          pageSize: this.paginator?.pageSize ?? this.pageSize,
          status: filtro.status ?? undefined,
          papel: filtro.papel ?? undefined,
          nome: filtro.nome?.trim() || undefined,
          documento: filtro.documento?.trim() || undefined,
          imovel: filtro.imovel?.trim() || undefined,
          preenchidoDe: filtro.preenchidoDe || undefined,
          preenchidoAte: filtro.preenchidoAte || undefined
        })
      );

      this.dataSource.data = resp.items ?? [];
      this.total = resp.total ?? 0;
    } catch (err) {
      console.error(err);
      this.dataSource.data = [];
      this.total = 0;
    } finally {
      this.carregando = false;
      this.cdr.detectChanges();
    }
  }

  async aplicarFiltro() {
    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }

    await this.carregar();
  }

  async limparFiltro() {
    this.filtroForm.reset({
      status: null,
      papel: null,
      nome: '',
      documento: '',
      imovel: '',
      preenchidoDe: '',
      preenchidoAte: ''
    });

    if (this.paginator) {
      this.paginator.pageIndex = 0;
    }

    await this.carregar();
  }

  async alterarPagina() {
    await this.carregar();
  }

  copiarLink(link: string): void {
    this.conviteUi.copiarLink(link);
  }

  abrirConvite(item: ConviteCadastroListItemResponse): void {
    if (item.pessoaId) {
      this.conviteUi.verDados(item.token);
      return;
    }

    this.conviteUi.abrirLink(item.link);
  }

  abrirAnalise(convite: ConviteCadastroListItemResponse): void {
    const dialogRef = this.dialog.open(AnaliseConviteDialog, {
      width: '1400px',
      maxWidth: '95vw',
      height: '90vh',
      maxHeight: '95vh',
      panelClass: 'analise-convite-panel',
      data: convite
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (!result) return;

      try {
        await firstValueFrom(
          this.convitesService.analisar(convite.id, result)
        );

        await this.carregar();

        if (result.resultado === 1) {
          // Aprovado
          const irParaContrato = await Swal.fire({
            title: 'Cadastro Aprovado!',
            text: 'O cadastro foi aprovado com sucesso. Deseja ir para a edição do contrato para incluir este cliente?',
            icon: 'success',
            showCancelButton: true,
            confirmButtonText: 'Sim, ir para o contrato',
            cancelButtonText: 'Não, permanecer aqui',
            confirmButtonColor: '#2e7d32',
            cancelButtonColor: '#757575'
          });

          if (irParaContrato.isConfirmed && convite.contratoId) {
            this.router.navigate(['/contratos/editar', convite.contratoId]);
          }
        } else if (result.resultado === 3) {
          // Correção Solicitada
          await Swal.fire({
            title: 'Correção Solicitada!',
            html: `
              <p style="font-size: 14px; color: #555; margin-bottom: 15px;">
                O status do convite foi alterado para correção. Compartilhe o link de preenchimento abaixo com o cliente:
              </p>
              <div style="display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 15px;">
                <input type="text" id="link-correcao-input" readonly value="${convite.link}" 
                  style="width: 70%; padding: 8px 12px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; background-color: #f9f9f9; text-overflow: ellipsis;" />
                <button type="button" id="btn-copiar-link" 
                  style="padding: 10px 16px; font-size: 14px; background-color: #1976d2; color: #fff; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;">
                  Copiar Link
                </button>
              </div>
            `,
            icon: 'info',
            confirmButtonText: 'Ok',
            confirmButtonColor: '#1976d2',
            didOpen: () => {
              const btnCopiar = document.getElementById('btn-copiar-link');
              const input = document.getElementById('link-correcao-input') as HTMLInputElement;
              btnCopiar?.addEventListener('click', () => {
                if (input) {
                  input.select();
                }
                this.conviteUi.copiarLink(convite.link);
              });
            }
          });
        } else if (result.resultado === 2) {
          // Reprovado
          this.notify.toastSuccess('Convite reprovado com sucesso.');
        }
      } catch (err) {
        console.error(err);
        this.notify.handleHttpError(err, 'Erro ao processar a análise do convite.');
      }
    });
  }

  imprimirFicha(item: ConviteCadastroListItemResponse): void {
    if (item.token) {
      this.conviteUi.imprimirFicha(item.token);
    }
  }

  compartilharConvite(convite: ConviteCadastroListItemResponse): void {
    this.dialog.open(CompartilharConviteDialog, {
      width: '600px',
      maxWidth: '90vw',
      data: { convite }
    });
  }
}