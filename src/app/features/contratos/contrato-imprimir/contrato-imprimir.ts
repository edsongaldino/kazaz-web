import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MaterialModule } from '../../../shared/material.module';
import { ContratosService } from '../../../core/services/contratos.service';
import { ContratoResponse, ContratoChecklistEntrada, TipoContrato, StatusContrato, PapelContrato } from '../../../models/contrato.models';

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
  private cdr = inject(ChangeDetectorRef);

  id!: string;
  contrato: ContratoResponse | null = null;
  checklistEntrada: ContratoChecklistEntrada | null = null;
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

    try {
      // Carrega o contrato
      const c = await firstValueFrom(this.contratosService.obterPorId(this.id));
      this.contrato = c;

      // Se for locação, também carrega o checklist de entrada
      if (c.tipo === TipoContrato.Locacao) {
        this.checklistEntrada = await firstValueFrom(this.contratosService.obterChecklistEntrada(this.id));
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
}
