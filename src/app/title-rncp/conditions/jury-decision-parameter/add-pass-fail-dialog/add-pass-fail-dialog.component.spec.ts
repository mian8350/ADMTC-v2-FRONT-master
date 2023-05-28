import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AddPassFailDialogComponent } from './add-pass-fail-dialog.component';

describe('AddPassFailDialogComponent', () => {
  let component: AddPassFailDialogComponent;
  let fixture: ComponentFixture<AddPassFailDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddPassFailDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddPassFailDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
