import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AddCompanyStaffDialogComponent } from './add-company-staff-dialog.component';

describe('AddCompanyStaffDialogComponent', () => {
  let component: AddCompanyStaffDialogComponent;
  let fixture: ComponentFixture<AddCompanyStaffDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddCompanyStaffDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddCompanyStaffDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
