import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TestDocumentComponent } from './test-document.component';

describe('TestDocumentComponent', () => {
  let component: TestDocumentComponent;
  let fixture: ComponentFixture<TestDocumentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TestDocumentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestDocumentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
