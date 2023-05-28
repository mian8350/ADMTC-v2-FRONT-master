import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { JuryStudentFormComponent } from './jury-student-form.component';

describe('JuryStudentFormComponent', () => {
  let component: JuryStudentFormComponent;
  let fixture: ComponentFixture<JuryStudentFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JuryStudentFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JuryStudentFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
