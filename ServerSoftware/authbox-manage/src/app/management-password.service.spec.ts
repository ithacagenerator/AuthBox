import { TestBed, inject } from '@angular/core/testing';

import { ManagementPasswordService } from './management-password.service';

describe('ManagementPasswordService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ManagementPasswordService]
    });
  });

  it('should be created', inject([ManagementPasswordService], (service: ManagementPasswordService) => {
    expect(service).toBeTruthy();
  }));
});
