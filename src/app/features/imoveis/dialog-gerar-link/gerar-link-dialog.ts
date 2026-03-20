import { Component, Inject } from '@angular/core';
import { FormBuilder, Validators, ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

export type GerarLinkDialogData = {
  imovelId: string;
  gerarLinks: (body: { tipo: number; expiraEmDias: number; incluirFiador: boolean }) => any;
};

type GerarLinksResponse = {
  contratoId: string;
  numero: string;
  links: { papel: number; token: string; url: string }[];
};

type GerarLinkForm = {
  tipo: FormControl<number>;
  expiraEmDias: FormControl<number>;
  incluirFiador: FormControl<boolean>;
};

@Component({
  standalone: true,
  selector: 'app-gerar-link-dialog',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
  ],
  templateUrl: './gerar-link-dialog.html',
  styleUrls: ['./gerar-link-dialog.scss'],
})
export class GerarLinkDialogComponent {
  loading = false;
  result: GerarLinksResponse | null = null;

  form: FormGroup<GerarLinkForm>;

  constructor(
    private fb: FormBuilder,
    private snack: MatSnackBar,
    private router: Router,
    private ref: MatDialogRef<GerarLinkDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: GerarLinkDialogData
  ) {
    this.form = this.fb.group<GerarLinkForm>({
      tipo: new FormControl(1, { nonNullable: true, validators: [Validators.required] }),
      expiraEmDias: new FormControl(7, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
      incluirFiador: new FormControl(false, { nonNullable: true }),
    });
  }

  gerar(): void {
    if (this.form.invalid) return;

    this.loading = true;
    const body = this.form.getRawValue();

    if (body.tipo !== 1) body.incluirFiador = false;

    this.data.gerarLinks(body).subscribe({
      next: (r: GerarLinksResponse) => {
        this.result = r;
        this.loading = false;
        this.ref.close();
        this.router.navigate(['/convites'], { queryParams: { contratoId: r.contratoId } });
      },
      error: () => {
        this.loading = false;
        this.snack.open('Erro ao gerar links', 'Fechar', { duration: 3000 });
      }
    });
  }

  async copiar(url: string) {
    try {
      await navigator.clipboard.writeText(url);
      this.snack.open('Link copiado!', 'OK', { duration: 2000 });
    } catch {
      this.snack.open('Não foi possível copiar', 'Fechar', { duration: 3000 });
    }
  }

  papelLabel(papel: number): string {
    if (papel === 1) return 'Locador';
    if (papel === 2) return 'Locatário';
    if (papel === 3) return 'Fiador';
    if (papel === 10) return 'Vendedor';
    if (papel === 11) return 'Comprador';
    return `Papel ${papel}`;
  }

  close(): void {
    this.ref.close();
  }
}
