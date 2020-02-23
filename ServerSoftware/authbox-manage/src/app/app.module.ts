import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';

import { UtilService } from './util.service';
import { ApiService } from './api.service';
import { ManagementPasswordService } from './management-password.service';
import { MembersComponent } from './members/members/members.component';
import { MemberCreateComponent } from './members/member-create/member-create.component';
import { MemberEditComponent } from './members/member-edit/member-edit.component';
import { MemberDetailComponent } from './members/member-detail/member-detail.component';
import { MemberAddAuthboxComponent } from './members/member-add-authbox/member-add-authbox.component';
import { AuthBoxesComponent } from './authboxes/authboxes/authboxes.component';
import { AuthboxEditComponent } from './authboxes/authbox-edit/authbox-edit.component';
import { AuthboxCreateComponent } from './authboxes/authbox-create/authbox-create.component';
import { AuthboxDetailComponent } from './authboxes/authbox-detail/authbox-detail.component';
import { AuthboxAddMemberComponent } from './authboxes/authbox-add-member/authbox-add-member.component';
import { DashboardComponent, CalendarDialogComponent } from './dashboard/dashboard.component';
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
  MatCheckboxModule,
  MatListModule,
  MatPaginatorModule,
  MatSelectModule,
  MatDatepickerModule,
  MatNativeDateModule
} from '@angular/material';
import { MatSortModule } from '@angular/material/sort';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MomentDateModule } from '@angular/material-moment-adapter';

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
    AuthboxAddMemberComponent,
    DashboardComponent,
    CalendarDialogComponent,
    SuccessStatusSnackComponent,
    ErrorStatusSnackComponent,
    MemberAddAuthboxComponent,
  ],
  imports: [
    AppRoutingModule,
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
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
    MatCheckboxModule,
    MatListModule,
    MatPaginatorModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MomentDateModule
  ],
  providers: [
    ApiService,
    ManagementPasswordService,
    UtilService,
    MatDatepickerModule
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    SuccessStatusSnackComponent,
    ErrorStatusSnackComponent,
    AuthboxCreateComponent,
    AuthboxEditComponent,
    AuthboxAddMemberComponent,
    MemberCreateComponent,
    MemberEditComponent,
    MemberAddAuthboxComponent,
    CalendarDialogComponent
  ]
})
export class AppModule { }
