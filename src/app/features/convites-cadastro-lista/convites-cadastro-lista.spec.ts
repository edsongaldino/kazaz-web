import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConvitesCadastroListaComponent } from './convites-cadastro-lista';

describe('Convites', () => {
  let component: ConvitesCadastroListaComponent;
  let fixture: ComponentFixture<ConvitesCadastroListaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConvitesCadastroListaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConvitesCadastroListaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
