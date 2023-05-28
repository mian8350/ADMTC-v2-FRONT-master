import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ClassTitleGovRegistrationTabComponent } from './class-title-gov-registration-tab.component';

describe('ClassTitleGovRegistrationTabComponent', () => {
  let component: ClassTitleGovRegistrationTabComponent;
  let fixture: ComponentFixture<ClassTitleGovRegistrationTabComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ClassTitleGovRegistrationTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClassTitleGovRegistrationTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
