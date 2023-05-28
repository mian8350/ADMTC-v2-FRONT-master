import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupScheduleRetakeGoOffPlatformJuryComponent } from './setup-schedule-retake-go-off-platform-jury.component';

describe('SetupScheduleRetakeGoOffPlatformJuryComponent', () => {
  let component: SetupScheduleRetakeGoOffPlatformJuryComponent;
  let fixture: ComponentFixture<SetupScheduleRetakeGoOffPlatformJuryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SetupScheduleRetakeGoOffPlatformJuryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetupScheduleRetakeGoOffPlatformJuryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
