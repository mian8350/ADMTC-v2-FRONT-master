import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TranscriptCertificateGenertionComponent } from './transcript-certificate-genertion.component';

describe('TranscriptCertificateGenertionComponent', () => {
  let component: TranscriptCertificateGenertionComponent;
  let fixture: ComponentFixture<TranscriptCertificateGenertionComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TranscriptCertificateGenertionComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranscriptCertificateGenertionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
