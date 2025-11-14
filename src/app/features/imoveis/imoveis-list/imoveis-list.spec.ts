import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImoveisList } from './imoveis-list';

describe('ImoveisList', () => {
  let component: ImoveisList;
  let fixture: ComponentFixture<ImoveisList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImoveisList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImoveisList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
