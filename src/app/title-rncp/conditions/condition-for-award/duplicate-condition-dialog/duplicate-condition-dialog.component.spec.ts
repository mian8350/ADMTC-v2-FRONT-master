import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DuplicateConditionDialogComponent } from './duplicate-condition-dialog.component';

describe('DuplicateConditionDialogComponent', () => {
  let component: DuplicateConditionDialogComponent;
  let fixture: ComponentFixture<DuplicateConditionDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DuplicateConditionDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DuplicateConditionDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
