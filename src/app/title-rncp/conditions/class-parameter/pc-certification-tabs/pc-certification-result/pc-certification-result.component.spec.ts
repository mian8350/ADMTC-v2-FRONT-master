import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PcCertificationResultComponent } from './pc-certification-result.component';

describe('PcCertificationResultComponent', () => {
  let component: PcCertificationResultComponent;
  let fixture: ComponentFixture<PcCertificationResultComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PcCertificationResultComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PcCertificationResultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
