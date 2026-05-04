import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnaliseConviteDialog } from './analise-convite-dialog';

describe('AnaliseConviteDialog', () => {
  let component: AnaliseConviteDialog;
  let fixture: ComponentFixture<AnaliseConviteDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnaliseConviteDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnaliseConviteDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
