import { TestBed } from '@angular/core/testing';

import { TranscriptProcessService } from './transcript-process.service';

describe('TranscriptProcessService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TranscriptProcessService = TestBed.get(TranscriptProcessService);
    expect(service).toBeTruthy();
  });
});
