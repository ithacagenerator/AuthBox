import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Injectable()
export class ApiService {

  apiBase = `https://ithacagenerator.org/authbox/v1`;

  constructor(private _http: HttpClient) { }

  public getAuthBoxes() {
    const apiUrl = `${this.apiBase}`;
    return this._http.get(apiUrl);
}
