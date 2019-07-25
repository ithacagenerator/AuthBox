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
  @ViewChild(MatSort) sort: MatSort;
  displayedColumns = [
    'name', 'email', 'authorizedBoxNames', 'created', 'updated'];

  dataSource = new MatTableDataSource();
  private loginSubscription: Subscription;

  constructor(
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
    public apiSrvc: ApiService,
    public router: Router
  ) {
    this.refreshMembers();
    this.loginSubscription = this.apiSrvc.loginStatus$().subscribe((loggedin) => {
      if (!loggedin) {
        this.dataSource.data = [];
      }
      this.refreshMembers();
    });
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy() {
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }
  }

  refreshMembers() {
    this.apiSrvc.getMembers()
    .then((members) => {
      this.dataSource.data = members;
    })
    .catch((err) => {
      // console.error(err);
    });
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

  public editMember(member) {
    const dialogRef = this.dialog.open(MemberEditComponent, {
      width: '350px',
      height: '75%',
      data: { name: member.name, email: member.email }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      if (result && result.name) {
        if (!result.id) { delete result.id; }
        if (!result.access_code) { delete result.access_code; }

        if (result.detail) {
          this.router.navigate([`/member/${result.name || result.email}`]);
        } else if (result.delete) {
          delete result.delete;
          this.apiSrvc.deleteMember(result)
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
        } else {
          this.apiSrvc.updateMember(result)
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
      }
    });
  }

  public applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }

  public rowSelected(row) {
    console.log(row);
    this.editMember({
      name: row.name,
      email: row.email
    });
  }
}
