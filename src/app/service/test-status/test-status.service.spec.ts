import { TestBed } from '@angular/core/testing';

import { TestStatusService } from './test-status.service';

describe('TestStatusService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TestStatusService = TestBed.get(TestStatusService);
    expect(service).toBeTruthy();
  });
});
