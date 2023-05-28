import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PenaltiesBonusesComponent } from './penalties-bonuses.component';

describe('PenaltiesBonusesComponent', () => {
  let component: PenaltiesBonusesComponent;
  let fixture: ComponentFixture<PenaltiesBonusesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PenaltiesBonusesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PenaltiesBonusesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
