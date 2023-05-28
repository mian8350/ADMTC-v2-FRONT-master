import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { JuryOrganizationComponent } from './jury-organization.component';

describe('JuryOrganizationComponent', () => {
  let component: JuryOrganizationComponent;
  let fixture: ComponentFixture<JuryOrganizationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JuryOrganizationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JuryOrganizationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
