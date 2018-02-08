
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { MembersComponent } from './members/members/members.component';
import { MemberCreateComponent } from './members/member-create/member-create.component';
import { MemberEditComponent } from './members/member-edit/member-edit.component';
import { MemberDetailComponent } from './members/member-detail/member-detail.component';
import { AuthBoxesComponent } from './authboxes/authboxes/authboxes.component';
import { AuthboxEditComponent } from './authboxes/authbox-edit/authbox-edit.component';
import { AuthboxCreateComponent } from './authboxes/authbox-create/authbox-create.component';
import { AuthboxDetailComponent } from './authboxes/authbox-detail/authbox-detail.component';
import { DashboardComponent } from './dashboard/dashboard.component';

const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'auth-boxes/create', component: AuthboxCreateComponent },
  { path: 'auth-boxes', component: AuthBoxesComponent },
  { path: 'auth-box/:id', component: AuthboxDetailComponent },
  { path: 'auth-box/edit/:id', component: AuthboxEditComponent },
  { path: 'members/create', component: MemberCreateComponent },
  { path: 'members', component: MembersComponent },
  { path: 'member/:id', component: MemberDetailComponent },
  { path: 'member/edit/:id', component: MemberEditComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
