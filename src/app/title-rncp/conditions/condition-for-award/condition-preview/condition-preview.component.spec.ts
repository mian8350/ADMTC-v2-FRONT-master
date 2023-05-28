import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConditionPreviewComponent } from './condition-preview.component';

describe('ConditionPreviewComponent', () => {
  let component: ConditionPreviewComponent;
  let fixture: ComponentFixture<ConditionPreviewComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConditionPreviewComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConditionPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
