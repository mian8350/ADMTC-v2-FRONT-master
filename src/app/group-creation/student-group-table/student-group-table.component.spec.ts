import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { StudentGroupTableComponent } from './student-group-table.component';

describe('StudentGroupTableComponent', () => {
  let component: StudentGroupTableComponent;
  let fixture: ComponentFixture<StudentGroupTableComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ StudentGroupTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(StudentGroupTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
