import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, Inject, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';
import { PessoasService } from '../../../core/services/pessoas.service';
import { ImoveisService } from '../../../core/services/imoveis.service';
import { PessoaListItem } from '../../../models/pessoa.model';
import { NotificationService } from '../../../core/services/notification.service';
import { firstValueFrom } from 'rxjs';

export interface VincularProprietarioDialogData {
  imovelId: string;
  codigo: string;
  titulo: string;
}

@Component({
  selector: 'app-vincular-proprietario-dialog',
  standalone: true,
  templateUrl: './vincular-proprietario-dialog.html',
  styleUrls: ['./vincular-proprietario-dialog.scss'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule
  ]
})
export class VincularProprietarioDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private pessoasService = inject(PessoasService);
  private imoveisService = inject(ImoveisService);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private dialogRef = inject(MatDialogRef<VincularProprietarioDialogComponent>);

  form = this.fb.group({
    busca: ['']
  });

  pessoas: PessoaListItem[] = [];
  loading = false;
  vinculando: string | null = null; // pessoaId em processamento

  private busca$ = new Subject<string>();

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: VincularProprietarioDialogData
  ) {}

  ngOnInit(): void {
    this.busca$
      .pipe(
        debounceTime(350),
        distinctUntilChanged(),
        switchMap(nome => {
          this.loading = true;
          this.cdr.detectChanges();
          return this.pessoasService.listar({ page: 1, pageSize: 20, nome });
        })
      )
      .subscribe({
        next: res => {
          this.pessoas = res.items ?? [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: () => {
          this.pessoas = [];
          this.loading = false;
          this.cdr.detectChanges();
        }
      });

    this.form.get('busca')!.valueChanges.subscribe(v => {
      const nome = (v ?? '').trim();
      if (nome.length >= 2) {
        this.busca$.next(nome);
      } else {
        this.pessoas = [];
      }
    });
  }

  async vincular(pessoa: PessoaListItem): Promise<void> {
    if (this.vinculando) return;
    this.vinculando = pessoa.id;
    this.cdr.detectChanges();

    try {
      await firstValueFrom(
        this.imoveisService.adicionarProprietario(this.data.imovelId, pessoa.id)
      );
      this.notify.toastSuccess(`${pessoa.nome} vinculado(a) como proprietário(a).`);
      this.dialogRef.close(true);
    } catch (err) {
      this.notify.handleHttpError(err, 'Não foi possível vincular o proprietário.');
    } finally {
      this.vinculando = null;
      this.cdr.detectChanges();
    }
  }

  fechar(): void {
    this.dialogRef.close(false);
  }
}
