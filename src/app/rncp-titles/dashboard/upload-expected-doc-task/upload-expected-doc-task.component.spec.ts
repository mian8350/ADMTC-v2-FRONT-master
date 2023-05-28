import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UploadExpectedDocTaskComponent } from './upload-expected-doc-task.component';

describe('UploadExpectedDocTaskComponent', () => {
  let component: UploadExpectedDocTaskComponent;
  let fixture: ComponentFixture<UploadExpectedDocTaskComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadExpectedDocTaskComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadExpectedDocTaskComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
