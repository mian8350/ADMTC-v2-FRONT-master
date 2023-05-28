import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CreateClassDialogComponent } from './create-class-dialog.component';

describe('CreateClassDialogComponent', () => {
  let component: CreateClassDialogComponent;
  let fixture: ComponentFixture<CreateClassDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateClassDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateClassDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
