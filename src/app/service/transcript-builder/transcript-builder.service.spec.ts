import { TestBed } from '@angular/core/testing';

import { TranscriptBuilderService } from './transcript-builder.service';

describe('TranscriptBuilderService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TranscriptBuilderService = TestBed.get(TranscriptBuilderService);
    expect(service).toBeTruthy();
  });
});
