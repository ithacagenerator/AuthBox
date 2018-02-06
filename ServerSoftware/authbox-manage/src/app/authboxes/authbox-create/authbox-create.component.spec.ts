import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthboxCreateComponent } from './authbox-create.component';

describe('AuthboxCreateComponent', () => {
  let component: AuthboxCreateComponent;
  let fixture: ComponentFixture<AuthboxCreateComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AuthboxCreateComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthboxCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
