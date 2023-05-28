import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassTitleGovRegistrationGeneratedTabComponent } from './class-title-gov-registration-generated-tab.component';

describe('ClassTitleGovRegistrationGeneratedTabComponent', () => {
  let component: ClassTitleGovRegistrationGeneratedTabComponent;
  let fixture: ComponentFixture<ClassTitleGovRegistrationGeneratedTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClassTitleGovRegistrationGeneratedTabComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassTitleGovRegistrationGeneratedTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
