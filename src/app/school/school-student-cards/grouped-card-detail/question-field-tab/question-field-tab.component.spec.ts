import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionFieldTabComponent } from './question-field-tab.component';

describe('QuestionFieldTabComponent', () => {
  let component: QuestionFieldTabComponent;
  let fixture: ComponentFixture<QuestionFieldTabComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ QuestionFieldTabComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuestionFieldTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
