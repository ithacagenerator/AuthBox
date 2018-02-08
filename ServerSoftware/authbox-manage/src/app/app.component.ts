import { Component } from '@angular/core';

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
}
