import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthBoxesComponent } from './authboxes.component';

describe('AuthBoxesComponent', () => {
  let component: AuthBoxesComponent;
  let fixture: ComponentFixture<AuthBoxesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AuthBoxesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AuthBoxesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
