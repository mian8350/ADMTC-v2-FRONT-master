import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { JuryGroupFormComponent } from './jury-group-form.component';

describe('JuryGroupFormComponent', () => {
  let component: JuryGroupFormComponent;
  let fixture: ComponentFixture<JuryGroupFormComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ JuryGroupFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JuryGroupFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
