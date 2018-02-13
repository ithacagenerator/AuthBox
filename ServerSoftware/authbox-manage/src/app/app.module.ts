import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { ApiService } from './api.service';
import { ManagementPasswordService } from './management-password.service';
import { MembersComponent } from './members/members/members.component';
import { MemberCreateComponent } from './members/member-create/member-create.component';
import { MemberEditComponent } from './members/member-edit/member-edit.component';
import { MemberDetailComponent } from './members/member-detail/member-detail.component';
import { AuthBoxesComponent } from './authboxes/authboxes/authboxes.component';
import { AuthboxEditComponent } from './authboxes/authbox-edit/authbox-edit.component';
import { AuthboxCreateComponent } from './authboxes/authbox-create/authbox-create.component';
import { AuthboxDetailComponent } from './authboxes/authbox-detail/authbox-detail.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { SuccessStatusSnackComponent } from './utilities/snackbars/success-snackbar/success-snackbar.component';
import { ErrorStatusSnackComponent } from './utilities/snackbars/error-snackbar/error-snackbar.component';

import {
  MatButtonModule,
  MatInputModule,
  MatFormFieldModule,
  MatIconModule,
  MatDialogModule,
  MatTableModule,
  MatSnackBarModule,
  MatCheckboxModule
} from '@angular/material';
import { MatSortModule } from '@angular/material/sort';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

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
    AuthboxDetailComponent,
    DashboardComponent,
    SuccessStatusSnackComponent,
    ErrorStatusSnackComponent
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    BrowserAnimationsModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatDialogModule,
    MatTableModule,
    MatSortModule,
    MatSnackBarModule,
    MatCheckboxModule
  ],
  providers: [
    ApiService,
    ManagementPasswordService
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    SuccessStatusSnackComponent,
    ErrorStatusSnackComponent,
    AuthboxCreateComponent,
    AuthboxEditComponent,
    MemberEditComponent,
    MemberCreateComponent
  ]
})
export class AppModule { }
