import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { CadastroPublicoService } from '../../../core/services/cadastro-publico.service';
import { getConvitePapelLabel, getConviteStatusLabel } from '../../../shared/helpers/convite.helper';

@Component({
  standalone: true,
  selector: 'app-cadastro-acompanhamento',
  imports: [CommonModule],
  templateUrl: './acompanhamento.html',
  styleUrls: ['./acompanhamento.scss'],
})
export class CadastroAcompanhamentoComponent implements OnInit {
  token: string | null = null;
  erro: string | null = null;
  loading = true;

  contratoId: string | null = null;
  pessoaId: string | null = null;
  papelLabel = '';
  status = 1;
  statusLabel = '';
  ultimoComentario: string | null = null;

  constructor(
    private cadastroPublicoService: CadastroPublicoService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.token = this.getTokenFromRoute();
    if (!this.token) {
      this.erro = 'Token não encontrado.';
      this.loading = false;
      this.cdr.markForCheck();
      return;
    }

    this.carregarStatus();
  }

  private carregarStatus(): void {
    if (!this.token) return;

    this.cadastroPublicoService.status(this.token).subscribe({
      next: (st) => {
        this.contratoId = st.contratoId;
        this.pessoaId = st.pessoaId;
        this.papelLabel = getConvitePapelLabel(st.papel);
        this.status = st.status;
        this.statusLabel = getConviteStatusLabel(st.status);
        this.ultimoComentario = st.ultimoComentarioAnalise ?? null;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.erro = 'Erro ao carregar o status do cadastro.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  private getTokenFromRoute(): string | null {
    let r: ActivatedRoute | null = this.route;
    while (r) {
      const t = r.snapshot.paramMap.get('token');
      if (t) return t;
      r = r.parent;
    }
    return null;
  }
}
