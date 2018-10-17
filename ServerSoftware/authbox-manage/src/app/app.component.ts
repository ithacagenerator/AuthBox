import { Component } from '@angular/core';
import { ManagementPasswordService } from './management-password.service';
import { ApiService } from './api.service';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  navItems = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'Auth Boxes', route: '/auth-boxes' },
    { name: 'Members', route: '/members' }
  ];

  password = '';
  loggedin = false;

  constructor(
    private passwordSrvc: ManagementPasswordService,
    private apiSrvc: ApiService
  ) {

  }

  onPasswordChange(clear) {
    if (clear === true) {
      this.password = '';
    }
    this.passwordSrvc.setPassword(this.password);
    this.apiSrvc.checkLoggedIn()
    .then(() => {
      this.loggedin = true;
    })
    .catch((err) => {
      this.loggedin = false;
    });
  }
}
