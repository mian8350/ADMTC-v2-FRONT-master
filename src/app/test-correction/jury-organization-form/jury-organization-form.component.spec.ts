import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { JuryOrganizationFormComponent } from './jury-organization-form.component';

describe('JuryOrganizationFormComponent', () => {
  let component: JuryOrganizationFormComponent;
  let fixture: ComponentFixture<JuryOrganizationFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JuryOrganizationFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JuryOrganizationFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
