import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DadosConjuge } from './dados-conjuge';

describe('DadosConjuge', () => {
  let component: DadosConjuge;
  let fixture: ComponentFixture<DadosConjuge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DadosConjuge]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DadosConjuge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
