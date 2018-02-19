import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberAddAuthboxComponent } from './member-add-authbox.component';

describe('MemberAddAuthboxComponent', () => {
  let component: MemberAddAuthboxComponent;
  let fixture: ComponentFixture<MemberAddAuthboxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MemberAddAuthboxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MemberAddAuthboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
