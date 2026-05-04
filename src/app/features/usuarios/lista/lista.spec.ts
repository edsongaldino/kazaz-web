import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsuariosListaComponent } from './lista';

describe('UsuariosListaComponent', () => {
  let component: UsuariosListaComponent;
  let fixture: ComponentFixture<UsuariosListaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UsuariosListaComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(UsuariosListaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});