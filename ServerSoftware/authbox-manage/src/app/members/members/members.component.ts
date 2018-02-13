import { Component, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { MemberCreateComponent } from '../member-create/member-create.component';
import { MemberEditComponent } from '../member-edit/member-edit.component';
import { ApiService } from '../../api.service';
import { MatTableDataSource, MatSort, MatSnackBar } from '@angular/material';
import { SuccessStatusSnackComponent } from '../../utilities/snackbars/success-snackbar/success-snackbar.component';
import { ErrorStatusSnackComponent } from '../../utilities/snackbars/error-snackbar/error-snackbar.component';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.scss']
})
export class MembersComponent implements AfterViewInit, OnDestroy {

  constructor(
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
    public apiSrvc: ApiService
  ) { }

  ngAfterViewInit() {

  }

  ngOnDestroy() {

  }

  refreshMembers() {

  }

  public newMember() {
    const dialogRef = this.dialog.open(MemberCreateComponent, {
      width: '350px',
      data: { }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      if (result) {
        this.apiSrvc.createMember(result)
        .then(() => {
          console.log('Success');
          this.snackBar.openFromComponent(SuccessStatusSnackComponent, {
            duration: 1000,
          });
          this.refreshMembers();
        })
        .catch((err) => {
          console.error(err);
          this.snackBar.openFromComponent(ErrorStatusSnackComponent, {
            duration: 1000,
          });
        });
      }
    });
  }
}
