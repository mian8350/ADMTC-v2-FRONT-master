import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CheckCompanyDialogComponent } from './check-company-dialog.component';

describe('CheckCompanyDialogComponent', () => {
  let component: CheckCompanyDialogComponent;
  let fixture: ComponentFixture<CheckCompanyDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CheckCompanyDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckCompanyDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
