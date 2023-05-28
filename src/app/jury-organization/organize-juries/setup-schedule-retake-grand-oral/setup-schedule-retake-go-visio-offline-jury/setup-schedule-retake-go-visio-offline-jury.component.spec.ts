import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SetupScheduleRetakeGoVisioOfflineJuryComponent } from './setup-schedule-retake-go-visio-offline-jury.component';

describe('SetupScheduleRetakeGoVisioOfflineJuryComponent', () => {
  let component: SetupScheduleRetakeGoVisioOfflineJuryComponent;
  let fixture: ComponentFixture<SetupScheduleRetakeGoVisioOfflineJuryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SetupScheduleRetakeGoVisioOfflineJuryComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SetupScheduleRetakeGoVisioOfflineJuryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
