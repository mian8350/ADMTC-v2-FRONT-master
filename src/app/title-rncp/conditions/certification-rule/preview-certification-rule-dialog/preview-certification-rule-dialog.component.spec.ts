import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PreviewCertificationRuleDialogComponent } from './preview-certification-rule-dialog.component';

describe('PreviewCertificationRuleDialogComponent', () => {
  let component: PreviewCertificationRuleDialogComponent;
  let fixture: ComponentFixture<PreviewCertificationRuleDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PreviewCertificationRuleDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PreviewCertificationRuleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
