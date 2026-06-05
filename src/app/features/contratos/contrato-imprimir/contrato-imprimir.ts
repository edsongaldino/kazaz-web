import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MaterialModule } from '../../../shared/material.module';
import { ContratosService } from '../../../core/services/contratos.service';
import { ContratoResponse, ContratoChecklistEntrada, ContratoChecklistSaida, TipoContrato, StatusContrato, PapelContrato } from '../../../models/contrato.models';
import { ImoveisService } from '../../../core/services/imoveis.service';
import { PessoasService } from '../../../core/services/pessoas.service';
import { ImovelDto } from '../../../models/imovel.model';
import { PessoaDto } from '../../../models/pessoa.model';

@Component({
  selector: 'app-contrato-imprimir',
  standalone: true,
  imports: [CommonModule, MaterialModule],
  templateUrl: './contrato-imprimir.html',
  styleUrls: ['./contrato-imprimir.scss']
})
export class ContratoImprimirComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private contratosService = inject(ContratosService);
  private imoveisService = inject(ImoveisService);
  private pessoasService = inject(PessoasService);
  private cdr = inject(ChangeDetectorRef);

  id!: string;
  opcao: string | null = null;
  contrato: ContratoResponse | null = null;
  imovelDetalhado: ImovelDto | null = null;
  partesDetalhadas: { [pessoaId: string]: PessoaDto } = {};
  checklistEntrada: ContratoChecklistEntrada | null = null;
  checklistSaida: ContratoChecklistSaida | null = null;
  etapasPersonalizadasEntrada: any[] = [];
  etapasPersonalizadasSaida: any[] = [];
  carregando = true;

  readonly TipoContrato = TipoContrato;
  readonly StatusContrato = StatusContrato;
  readonly PapelContrato = PapelContrato;

  async ngOnInit() {
    this.id = this.route.snapshot.paramMap.get('id')!;
    if (!this.id) {
      this.router.navigate(['/contratos']);
      return;
    }

    this.opcao = this.route.snapshot.queryParamMap.get('opcao');

    try {
      // Carrega o contrato
      const c = await firstValueFrom(this.contratosService.obterPorId(this.id));
      this.contrato = c;

      // Carrega dados completos do imóvel e das partes se a opção for contrato (ou todos se null)
      if (!this.opcao || this.opcao === 'contrato') {
        if (c.imovelId) {
          try {
            this.imovelDetalhado = await firstValueFrom(this.imoveisService.obterPorId(c.imovelId));
          } catch (e) {
            console.error('Erro ao carregar detalhes do imóvel:', e);
          }
        }
        if (c.partes && c.partes.length > 0) {
          for (const parte of c.partes) {
            try {
              const pessoa = await firstValueFrom(this.pessoasService.obter(parte.pessoaId));
              this.partesDetalhadas[parte.pessoaId] = pessoa;
            } catch (e) {
              console.error(`Erro ao carregar pessoa ${parte.pessoaId}:`, e);
            }
          }
        }
      }

      // Se for locação, também carrega os checklists de entrada e saída (se a opção for apropriada ou todos se null)
      if (c.tipo === TipoContrato.Locacao) {
        if (!this.opcao || this.opcao === 'entrada') {
          this.checklistEntrada = await firstValueFrom(this.contratosService.obterChecklistEntrada(this.id));
          if (this.checklistEntrada?.etapasPersonalizadasJson) {
            try {
              this.etapasPersonalizadasEntrada = JSON.parse(this.checklistEntrada.etapasPersonalizadasJson);
            } catch (e) {
              this.etapasPersonalizadasEntrada = [];
            }
          }
        }

        if (!this.opcao || this.opcao === 'saida') {
          this.checklistSaida = await firstValueFrom(this.contratosService.obterChecklistSaida(this.id));
          if (this.checklistSaida?.etapasPersonalizadasJson) {
            try {
              this.etapasPersonalizadasSaida = JSON.parse(this.checklistSaida.etapasPersonalizadasJson);
            } catch (e) {
              this.etapasPersonalizadasSaida = [];
            }
          }
        }
      }

      this.carregando = false;
      this.cdr.detectChanges();

      // Aguarda renderização e aciona a impressão
      setTimeout(() => {
        window.print();
      }, 1000);
    } catch (err) {
      console.error('Erro ao carregar dados para impressão', err);
      this.carregando = false;
      this.cdr.detectChanges();
    }
  }

  tipoLabel(tipo: number): string {
    return TipoContrato[tipo] ?? `Tipo ${tipo}`;
  }

  statusLabel(status: number): string {
    return StatusContrato[status] ?? `Status ${status}`;
  }

  papelLabel(papel: number): string {
    return PapelContrato[papel] ?? `Papel ${papel}`;
  }

  fechar(): void {
    window.close();
  }

  imprimir(): void {
    window.print();
  }

  obterEstadoCivil(val: any): string {
    const estado = Number(val);
    switch (estado) {
      case 1: return 'Solteiro(a)';
      case 2: return 'Casado(a)';
      case 3: return 'União Estável';
      case 4: return 'Separado(a)';
      case 5: return 'Divorciado(a)';
      case 6: return 'Viúvo(a)';
      default: return 'Não informado';
    }
  }
}
