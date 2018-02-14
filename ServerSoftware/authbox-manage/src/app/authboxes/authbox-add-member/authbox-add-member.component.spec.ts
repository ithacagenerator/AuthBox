import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthboxAddMemberComponent } from './authbox-add-member.component';

describe('AuthboxAddMemberComponent', () => {
  let component: AuthboxAddMemberComponent;
  let fixture: ComponentFixture<AuthboxAddMemberComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AuthboxAddMemberComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthboxAddMemberComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
