import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ManagementPasswordService } from './management-password.service';
import 'rxjs/add/operator/map';

@Injectable()
export class ApiService {

  apiBase = `https://ithacagenerator.org/authbox/v1`;

  constructor(
    private _http: HttpClient,
    private _passwordService: ManagementPasswordService
  ) { }

  public getAuthBoxes() {
    const password = this._passwordService.getPassword();
    const apiUrl = `${this.apiBase}/authboxes/${password}`;
    return this._http.get(apiUrl).toPromise<any>();
  }

  public createAuthBox(box) {
    const password = this._passwordService.getPassword();
    const apiUrl = `${this.apiBase}/authboxes/create/${password}`;
    return this._http.post(apiUrl, box).toPromise<any>();
  }

  public updateAuthBox(box) {
    const password = this._passwordService.getPassword();
    const apiUrl = `${this.apiBase}/authbox/${box.name}/${password}`;
    return this._http.put(apiUrl, box).toPromise<any>();
  }
}
