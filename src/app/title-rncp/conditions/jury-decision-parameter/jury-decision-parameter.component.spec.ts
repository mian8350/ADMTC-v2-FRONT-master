import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { JuryDecisionParameterComponent } from './jury-decision-parameter.component';

describe('JuryDecisionParameterComponent', () => {
  let component: JuryDecisionParameterComponent;
  let fixture: ComponentFixture<JuryDecisionParameterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JuryDecisionParameterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JuryDecisionParameterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
