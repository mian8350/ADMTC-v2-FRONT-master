import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FinalCommentComponent } from './final-comment.component';

describe('FinalCommentComponent', () => {
  let component: FinalCommentComponent;
  let fixture: ComponentFixture<FinalCommentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FinalCommentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FinalCommentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
