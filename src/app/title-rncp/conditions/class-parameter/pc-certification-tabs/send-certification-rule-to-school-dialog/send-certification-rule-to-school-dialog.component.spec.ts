import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SendCertificationRuleToSchoolDialogComponent } from './send-certification-rule-to-school-dialog.component';

describe('SendCertificationRuleToSchoolDialogComponent', () => {
  let component: SendCertificationRuleToSchoolDialogComponent;
  let fixture: ComponentFixture<SendCertificationRuleToSchoolDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SendCertificationRuleToSchoolDialogComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SendCertificationRuleToSchoolDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
