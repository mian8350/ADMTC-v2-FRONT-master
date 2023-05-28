import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EliminationComponent } from './elimination.component';

describe('EliminationComponent', () => {
  let component: EliminationComponent;
  let fixture: ComponentFixture<EliminationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EliminationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EliminationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
