import { Injectable } from '@angular/core';
import { HttpClient, HttpRequest, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import { ManagementPasswordService } from './management-password.service';
import 'rxjs/add/operator/map';

@Injectable()
export class ApiService {

  private apiBase = `https://ithacagenerator.org/authbox/v1`;
  private observer: any;
  private login$: Observable<boolean> = Observable.create(observer => this.observer = observer);
  private lastLoginCheck = null;

  constructor(
    private _http: HttpClient,
    private _passwordService: ManagementPasswordService
  ) { }

  getAuthMethods() {
    return new Promise((resolve, reject) => {
      resolve([
        '',
        'Key Pad',
        'RFID Tag'
      ]);
    });
  }

  loginStatus$(): Observable<boolean> {
    return this.login$;
  }

  public checkLoggedIn() {
    const password = this._passwordService.getPassword();
    const apiUrl = `${this.apiBase}/amiloggedin/${password}`;
    return this._http.get(apiUrl).toPromise<any>()
    .then(() => {
      if (this.lastLoginCheck !== true) {
        this.lastLoginCheck = true;
        if (this.observer) { this.observer.next(true); }
      }
      return true;
    })
    .catch((err)  => {
      if (this.lastLoginCheck !== false) {
        this.lastLoginCheck = false;
        if (this.observer) { this.observer.next(false); }
      }
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

  public getMembers() {
    const password = this._passwordService.getPassword();
    const apiUrl = `${this.apiBase}/members/${password}`;
    return this._http.get(apiUrl).toPromise<any>();
  }

  public createMember(member) {
    const password = this._passwordService.getPassword();
    const apiUrl = `${this.apiBase}/members/create/${password}`;
    return this._http.post(apiUrl, member).toPromise<any>();
  }

  public updateMember(member) {
    const password = this._passwordService.getPassword();
    const apiUrl = `${this.apiBase}/member/${password}`;
    return this._http.put(apiUrl, member).toPromise<any>();
  }

  public deleteMember(member) {
    const password = this._passwordService.getPassword();
    const apiUrl = `${this.apiBase}/member/${password}`;
    const req = new HttpRequest('DELETE', apiUrl);
    const newReq = req.clone({body: member});
    return this._http.request(newReq).toPromise<any>();
  }

  public bulkAuthorizeMembers(authboxName, members) {
    const password = this._passwordService.getPassword();
    const apiUrl = `${this.apiBase}/bulk/authorize-members/${authboxName}/${password}`;
    return this._http.put(apiUrl, members).toPromise<any>();
  }

  public getAuthorizationHistory(authboxName: string, sort: string, order: string, filter: string, page: number) {
    const password = this._passwordService.getPassword();
    const apiUrl = `${this.apiBase}/authboxes/history/${authboxName}/${password}`;
    const options = {
      params: new HttpParams()
        .set('sort', sort)
        .set('order', order)
        .set('page', `${page}`)
        .set('filter', filter)
    };
    return this._http.get(apiUrl, options).toPromise<any>();
  }

  public bulkAuthorizeBoxes(memberName, authBoxes) {
    const password = this._passwordService.getPassword();
    const apiUrl = `${this.apiBase}/bulk/authorize-boxes/${memberName}/${password}`;
    return this._http.put(apiUrl, authBoxes).toPromise<any>();
  }

  public getMember(name) {
    const password = this._passwordService.getPassword();
    const apiUrl = `${this.apiBase}/member/${name}/${password}`;
    return this._http.get(apiUrl).toPromise<any>();
  }

  public getMemberHistory(memberName: string, sort: string, order: string, filter: string, page: number) {
    const password = this._passwordService.getPassword();
    const apiUrl = `${this.apiBase}/members/history/${memberName}/${password}`;
    const options = {
      params: new HttpParams()
        .set('sort', sort)
        .set('order', order)
        .set('page', `${page}`)
        .set('filter', filter)
    };
    return this._http.get(apiUrl, options).toPromise<any>();
  }
}
