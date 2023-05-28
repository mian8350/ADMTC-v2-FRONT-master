import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TranscriptBuilderComponent } from './transcript-builder.component';

describe('TranscriptBuilderComponent', () => {
  let component: TranscriptBuilderComponent;
  let fixture: ComponentFixture<TranscriptBuilderComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TranscriptBuilderComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranscriptBuilderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
