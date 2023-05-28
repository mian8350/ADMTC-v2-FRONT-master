import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AddExpertiseDialogComponent } from './add-expertise-dialog.component';

describe('AddExpertiseDialogComponent', () => {
  let component: AddExpertiseDialogComponent;
  let fixture: ComponentFixture<AddExpertiseDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AddExpertiseDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddExpertiseDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
