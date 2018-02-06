import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthboxDetailComponent } from './authbox-detail.component';

describe('AuthboxDetailComponent', () => {
  let component: AuthboxDetailComponent;
  let fixture: ComponentFixture<AuthboxDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AuthboxDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthboxDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
