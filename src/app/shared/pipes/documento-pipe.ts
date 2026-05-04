import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'documento',
  standalone: true
})
export class DocumentoPipe implements PipeTransform {

  transform(documento?: string | null): string {
    if (!documento) return '-';

    const digits = documento.replace(/\D/g, '');

    if (digits.length === 11) {
      return digits.replace(
        /(\d{3})(\d{3})(\d{3})(\d{2})/,
        '$1.$2.$3-$4'
      );
    }

    if (digits.length === 14) {
      return digits.replace(
        /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
        '$1.$2.$3/$4-$5'
      );
    }

    return documento;
  }
}