import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ContratosList } from './contratos-list';

describe('ContratosList', () => {
  let component: ContratosList;
  let fixture: ComponentFixture<ContratosList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ContratosList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ContratosList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
