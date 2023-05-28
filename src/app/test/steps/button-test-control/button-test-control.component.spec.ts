import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ButtonTestControlComponent } from './button-test-control.component';

describe('ButtonTestControlComponent', () => {
  let component: ButtonTestControlComponent;
  let fixture: ComponentFixture<ButtonTestControlComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ButtonTestControlComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ButtonTestControlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
