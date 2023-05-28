import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MultipleDateFormComponent } from './multiple-date-form.component';

describe('MultipleDateFormComponent', () => {
  let component: MultipleDateFormComponent;
  let fixture: ComponentFixture<MultipleDateFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MultipleDateFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MultipleDateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
