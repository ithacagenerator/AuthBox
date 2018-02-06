import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HttpModule } from '@angular/http';
import { AppComponent } from './app.component';

import { ApiService } from './api.service';
import { MembersComponent } from './members/members.component';
import { MemberCreateComponent } from './members/member-create/member-create.component';
import { MemberEditComponent } from './members/member-edit/member-edit.component';
import { MemberDetailComponent } from './members/member-detail/member-detail.component';
import { AuthBoxesComponent } from './authboxes/authboxes/authboxes.component';
import { AuthboxEditComponent } from './authbox--edit/authbox--edit.component';
import { AuthboxCreateComponent } from './authboxes/authbox-create/authbox-create.component';
import { AuthboxDetailComponent } from './authboxes/authbox-detail/authbox-detail.component';


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
    MembersComponent,
    MemberCreateComponent,
    MemberEditComponent,
    MemberDetailComponent,
    AuthBoxesComponent,
    AuthboxEditComponent,
    AuthboxCreateComponent,
    AuthboxDetailComponent
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
