import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConvitesList } from './convites-list';

describe('ConvitesList', () => {
  let component: ConvitesList;
  let fixture: ComponentFixture<ConvitesList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConvitesList]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ConvitesList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
