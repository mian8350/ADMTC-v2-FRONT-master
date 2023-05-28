import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { JuryOrganizationDetailComponent } from './jury-organization-detail.component';

describe('JuryOrganizationDetailComponent', () => {
  let component: JuryOrganizationDetailComponent;
  let fixture: ComponentFixture<JuryOrganizationDetailComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JuryOrganizationDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JuryOrganizationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
