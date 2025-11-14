import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DadosComplementares } from './dados-complementares';

describe('DadosComplementares', () => {
  let component: DadosComplementares;
  let fixture: ComponentFixture<DadosComplementares>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DadosComplementares]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DadosComplementares);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
