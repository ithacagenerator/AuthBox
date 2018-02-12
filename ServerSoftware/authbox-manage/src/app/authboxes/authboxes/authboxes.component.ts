import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material';
import { AuthboxCreateComponent } from '../authbox-create/authbox-create.component';
import { AuthboxEditComponent } from '../authbox-edit/authbox-edit.component';
import { ApiService } from '../../api.service';
import { MatTableDataSource, MatSort, MatSnackBar } from '@angular/material';
import { SuccessStatusSnackComponent } from '../../utilities/snackbars/success-snackbar/success-snackbar.component';
import { ErrorStatusSnackComponent } from '../../utilities/snackbars/error-snackbar/error-snackbar.component';
@Component({
  selector: 'app-auth-boxes',
  templateUrl: './authboxes.component.html',
  styleUrls: ['./authboxes.component.scss']
})
export class AuthBoxesComponent implements AfterViewInit {
  @ViewChild(MatSort) sort: MatSort;
  displayedColumns = [
    'name', 'created', 'updated',
    'lastAuthorizedAt', 'lastAuthorizedBy',
    'lastLockedAt', 'lastLockedBy'];

  dataSource = new MatTableDataSource();
  constructor(
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
    public apiSrvc: ApiService,
    public router: Router
  ) {
    this.refreshAuthBoxes();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  refreshAuthBoxes() {
    this.apiSrvc.getAuthBoxes()
    .then((authboxes) => {
      this.dataSource.data = authboxes;
    })
    .catch((err) => {
      console.error(err);
    });
  }

  newAuthbox() {
    const dialogRef = this.dialog.open(AuthboxCreateComponent, {
      width: '350px',
      data: { }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      if (result) {
        this.apiSrvc.createAuthBox(result)
        .then(() => {
          console.log('Success');
          this.snackBar.openFromComponent(SuccessStatusSnackComponent, {
            duration: 1000,
          });
          this.refreshAuthBoxes();
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

  editAuthBox(authbox) {
    const dialogRef = this.dialog.open(AuthboxEditComponent, {
      width: '350px',
      height: '75%',
      data: { name: authbox.name }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      if (result && result.name) {
        if (!result.id) { delete result.id; }
        if (!result.access_code) { delete result.access_code; }

        if (result.detail) {
          this.router.navigate([`/auth-box/${result.name}`]);
        } else if (result.delete) {
          delete result.delete;
          this.apiSrvc.deleteAuthBox(result)
          .then(() => {
            console.log('Success');
            this.snackBar.openFromComponent(SuccessStatusSnackComponent, {
              duration: 1000,
            });
            this.refreshAuthBoxes();
          })
          .catch((err) => {
            console.error(err);
            this.snackBar.openFromComponent(ErrorStatusSnackComponent, {
              duration: 1000,
            });
          });
        } else {
          this.apiSrvc.updateAuthBox(result)
          .then(() => {
            console.log('Success');
            this.snackBar.openFromComponent(SuccessStatusSnackComponent, {
              duration: 1000,
            });
            this.refreshAuthBoxes();
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

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim(); // Remove whitespace
    filterValue = filterValue.toLowerCase(); // Datasource defaults to lowercase matches
    this.dataSource.filter = filterValue;
  }

  rowSelected(row) {
    console.log(row);
    this.editAuthBox({
      name: row.name,
    });
  }
}
