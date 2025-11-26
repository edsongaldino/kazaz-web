import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DadosContatoDialog } from './dados-contato-dialog';

describe('DadosContatoDialog', () => {
  let component: DadosContatoDialog;
  let fixture: ComponentFixture<DadosContatoDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DadosContatoDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DadosContatoDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
