import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PdfDetailComponent } from './pdf-detail.component';

describe('PdfDetailComponent', () => {
  let component: PdfDetailComponent;
  let fixture: ComponentFixture<PdfDetailComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PdfDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PdfDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
