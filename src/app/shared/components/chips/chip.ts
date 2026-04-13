import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { getChipConfig } from '../../helpers/chip.helper';
import { ChipVariant } from '../../../models/chip.model';
import { MatIconModule } from '@angular/material/icon';

type ChipCategory = 'status' | 'finalidade' | 'tipo' | 'tipoCadastro' | 'papel';

@Component({
  selector: 'app-chip',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './chip.html',
  styleUrls: ['./chip.scss']
})
export class ChipComponent {
  @Input() label?: string;
  @Input() variant: ChipVariant = 'default';
  @Input() category?: ChipCategory;
  @Input() value?: string | number | null;

  get resolvedLabel(): string {
    if (this.category) {
      return getChipConfig(this.category, this.value).label;
    }

    return this.label ?? '-';
  }

  get resolvedVariant(): ChipVariant {
    if (this.category) {
      return getChipConfig(this.category, this.value).variant;
    }

    return this.variant;
  }

  get classes(): string[] {
    return ['app-chip', `app-chip--${this.resolvedVariant}`];
  }

  get resolvedIcon(): string | undefined {
    if (this.category) {
        return getChipConfig(this.category, this.value).icon;
    }

    return undefined;
  }

}