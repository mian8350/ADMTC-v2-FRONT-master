import { TestBed } from '@angular/core/testing';

import { WorkProgressService } from './work-progress.service';

describe('WorkProgressService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: WorkProgressService = TestBed.get(WorkProgressService);
    expect(service).toBeTruthy();
  });
});
