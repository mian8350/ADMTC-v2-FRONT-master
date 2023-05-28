import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AllJuryScheduleComponent } from './all-jury-schedule.component';

describe('AllJuryScheduleComponent', () => {
  let component: AllJuryScheduleComponent;
  let fixture: ComponentFixture<AllJuryScheduleComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AllJuryScheduleComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AllJuryScheduleComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
