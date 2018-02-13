import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ManagementPasswordService } from './management-password.service';
import 'rxjs/add/operator/map';

@Injectable()
export class ApiService {

  private apiBase = `https://ithacagenerator.org/authbox/v1`;
  private observer: any;
  private login$: Observable<boolean> = Observable.create(observer => this.observer = observer);

  constructor(
    private _http: HttpClient,
    private _passwordService: ManagementPasswordService
  ) { }

  loginStatus$(): Observable<boolean> {
    return this.login$;
  }

  public checkLoggedIn() {
    const password = this._passwordService.getPassword();
    const apiUrl = `${this.apiBase}/amiloggedin/${password}`;
    return this._http.get(apiUrl).toPromise<any>()
    .then(() => {
      this.observer.next(true);
      return true;
    })
    .catch((err)  => {
      this.observer.next(false);
      throw err;
    });
  }

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
    const apiUrl = `${this.apiBase}/authbox/${password}`;
    return this._http.put(apiUrl, box).toPromise<any>();
  }

  public deleteAuthBox(box) {
    const password = this._passwordService.getPassword();
    const apiUrl = `${this.apiBase}/authbox/${password}`;
    const req = new HttpRequest('DELETE', apiUrl);
    const newReq = req.clone({body: box});
    return this._http.request(newReq).toPromise<any>();
  }
}
