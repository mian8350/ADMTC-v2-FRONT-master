import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EvalByCompetenceFormComponent } from './eval-by-competence-form.component';

describe('EvalByCompetenceFormComponent', () => {
  let component: EvalByCompetenceFormComponent;
  let fixture: ComponentFixture<EvalByCompetenceFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EvalByCompetenceFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EvalByCompetenceFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
