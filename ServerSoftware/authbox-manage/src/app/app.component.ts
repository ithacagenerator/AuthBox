import { Component } from '@angular/core';
import { ManagementPasswordService } from './management-password.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  navItems = [
    { name: 'Dashboard', route: '/dashboard' },
    { name: 'Auth Boxes', route: '/auth-boxes' },
    { name: 'Members', route: '/members' }
  ];

  password = '';

  constructor(private passwordSrvc: ManagementPasswordService) {

  }

  onPasswordChange(value) {
    this.passwordSrvc.setPassword(this.password);
  }
}
