import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PcCertificationParameterComponent } from './pc-certification-parameter.component';

describe('PcCertificationParameterComponent', () => {
  let component: PcCertificationParameterComponent;
  let fixture: ComponentFixture<PcCertificationParameterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PcCertificationParameterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PcCertificationParameterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
