import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassTitleGovRegistrationGenerationTabComponent } from './class-title-gov-registration-generation-tab.component';

describe('ClassTitleGovRegistrationGenerationTabComponent', () => {
  let component: ClassTitleGovRegistrationGenerationTabComponent;
  let fixture: ComponentFixture<ClassTitleGovRegistrationGenerationTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClassTitleGovRegistrationGenerationTabComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassTitleGovRegistrationGenerationTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
