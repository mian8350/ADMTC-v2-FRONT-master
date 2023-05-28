import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TestCorrectionComponent } from './test-correction.component';

describe('TestCorrectionComponent', () => {
  let component: TestCorrectionComponent;
  let fixture: ComponentFixture<TestCorrectionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TestCorrectionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestCorrectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
