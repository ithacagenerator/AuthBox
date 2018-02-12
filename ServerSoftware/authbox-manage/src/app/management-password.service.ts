import { Injectable } from '@angular/core';

@Injectable()
export class ManagementPasswordService {
  password = '';

  constructor() { }

  setPassword(p) {
    this.password = p;
  }

  getPassword() {
    return this.password;
  }
}
