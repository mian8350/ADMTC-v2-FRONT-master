import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DuplicateGroupDialogComponent } from './duplicate-group-dialog.component';

describe('DuplicateGroupDialogComponent', () => {
  let component: DuplicateGroupDialogComponent;
  let fixture: ComponentFixture<DuplicateGroupDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ DuplicateGroupDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DuplicateGroupDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
