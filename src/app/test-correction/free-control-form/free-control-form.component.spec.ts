import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { FreeControlFormComponent } from './free-control-form.component';

describe('FreeControlFormComponent', () => {
  let component: FreeControlFormComponent;
  let fixture: ComponentFixture<FreeControlFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ FreeControlFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FreeControlFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
