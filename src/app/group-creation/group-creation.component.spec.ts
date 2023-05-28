import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { GroupCreationComponent } from './group-creation.component';

describe('GroupCreationComponent', () => {
  let component: GroupCreationComponent;
  let fixture: ComponentFixture<GroupCreationComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ GroupCreationComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GroupCreationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
