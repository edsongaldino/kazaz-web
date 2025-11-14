import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DadosSocio } from './dados-socio';

describe('DadosSocio', () => {
  let component: DadosSocio;
  let fixture: ComponentFixture<DadosSocio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DadosSocio]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DadosSocio);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
