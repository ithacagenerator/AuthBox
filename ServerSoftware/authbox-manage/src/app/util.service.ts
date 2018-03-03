import { Injectable } from '@angular/core';

@Injectable()
export class UtilService {

  constructor() { }

  public isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
}
