import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DadosContato } from './dados-contato';

describe('DadosContato', () => {
  let component: DadosContato;
  let fixture: ComponentFixture<DadosContato>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DadosContato]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DadosContato);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
