import { TestBed } from '@angular/core/testing';

import { PreviousCourseService } from './previous-course.service';

describe('PreviousCourseService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: PreviousCourseService = TestBed.get(PreviousCourseService);
    expect(service).toBeTruthy();
  });
});
