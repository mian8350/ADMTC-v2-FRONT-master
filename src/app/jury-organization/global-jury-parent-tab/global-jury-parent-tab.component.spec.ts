import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GlobalJuryParentTabComponent } from './global-jury-parent-tab.component';

describe('GlobalJuryParentTabComponent', () => {
  let component: GlobalJuryParentTabComponent;
  let fixture: ComponentFixture<GlobalJuryParentTabComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GlobalJuryParentTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GlobalJuryParentTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
