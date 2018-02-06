import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HttpModule } from '@angular/http';
import { AppComponent } from './app.component';

import { ApiService } from './api.service';
import { AuthBoxesComponent } from './auth-boxes/auth-boxes.component';
import { MembersComponent } from './members/members.component';


const appRoutes: Routes = [
  { path: '',
    redirectTo: '/auth-boxes',
    pathMatch: 'full'
  },
  {
    path: 'auth-boxes',
    component: AuthBoxesComponent
  },
  {
    path: 'members',
    component: MembersComponent
  }
];

@NgModule({
  declarations: [
    AppComponent,
    AuthBoxesComponent,
    MembersComponent
  ],
  imports: [
    RouterModule.forRoot(
      appRoutes,
      { enableTracing: true } // <-- debugging purposes only
    ),
    BrowserModule,
    HttpModule
  ],
  providers: [ApiService],
  bootstrap: [AppComponent]
})
export class AppModule { }
