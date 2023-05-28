import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PcCertificationTabsComponent } from './pc-certification-tabs.component';

describe('PcCertificationTabsComponent', () => {
  let component: PcCertificationTabsComponent;
  let fixture: ComponentFixture<PcCertificationTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PcCertificationTabsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PcCertificationTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
