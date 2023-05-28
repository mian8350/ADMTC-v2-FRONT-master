import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AutoPromoComponent } from './auto-promo.component';

describe('AutoPromoComponent', () => {
  let component: AutoPromoComponent;
  let fixture: ComponentFixture<AutoPromoComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AutoPromoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoPromoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
