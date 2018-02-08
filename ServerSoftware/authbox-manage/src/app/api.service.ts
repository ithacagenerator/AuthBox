import { Injectable } from '@angular/core';
import { Http, Response } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/map';

@Injectable()
export class ApiService {

  apiBase = `https://ithacagenerator.org/authbox/v1`;

  constructor(private _http: Http) { }

  public getAuthBoxes() {
    const apiUrl = `${this.apiBase}`;
    return this._http.get(apiUrl)
      .map(res => {
        return res.json().results.map(item => {
          return item;
        });
    });
  }
}
