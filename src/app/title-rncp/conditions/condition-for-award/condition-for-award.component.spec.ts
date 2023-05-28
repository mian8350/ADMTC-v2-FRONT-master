import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ConditionForAwardComponent } from './condition-for-award.component';

describe('ConditionForAwardComponent', () => {
  let component: ConditionForAwardComponent;
  let fixture: ComponentFixture<ConditionForAwardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ConditionForAwardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConditionForAwardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
