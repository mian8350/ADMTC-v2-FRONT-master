import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { NotationGridFormComponent } from './notation-grid-form.component';

describe('NotationGridFormComponent', () => {
  let component: NotationGridFormComponent;
  let fixture: ComponentFixture<NotationGridFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ NotationGridFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NotationGridFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
