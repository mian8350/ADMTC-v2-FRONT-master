import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CompanyStaffComponent } from './company-staff.component';

describe('CompanyStaffComponent', () => {
  let component: CompanyStaffComponent;
  let fixture: ComponentFixture<CompanyStaffComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CompanyStaffComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompanyStaffComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
