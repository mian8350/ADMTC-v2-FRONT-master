import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TitleRncpDetailsComponent } from './title-rncp-details.component';

describe('TitleRncpDetailsComponent', () => {
  let component: TitleRncpDetailsComponent;
  let fixture: ComponentFixture<TitleRncpDetailsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TitleRncpDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TitleRncpDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
