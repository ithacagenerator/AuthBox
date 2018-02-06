import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthboxEditComponent } from './authbox-edit.component';

describe('AuthboxEditComponent', () => {
  let component: AuthboxEditComponent;
  let fixture: ComponentFixture<AuthboxEditComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AuthboxEditComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthboxEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
