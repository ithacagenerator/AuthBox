import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material';
import { AuthboxCreateComponent } from '../authbox-create/authbox-create.component';
import { AuthboxEditComponent } from '../authbox-edit/authbox-edit.component';
import { ApiService } from '../../api.service';
import { MatTableDataSource, MatSort } from '@angular/material';

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
    public apiSrvc: ApiService
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
      width: '250px',
      data: { }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      if (result) {
        this.apiSrvc.createAuthBox(result)
        .then(() => {
          console.log('Success');
          this.refreshAuthBoxes();
        })
        .catch((err) => {
          console.error(err);
        });
      }
    });
  }

  editAuthBox(authbox) {
    const dialogRef = this.dialog.open(AuthboxEditComponent, {
      width: '250px',
      data: { name: authbox.name }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      if (result && result.name) {
        if (!result.id) { delete result.id; }
        if (!result.access_code) { delete result.access_code; }
        this.apiSrvc.updateAuthBox(result)
        .then(() => {
          console.log('Success');
          this.refreshAuthBoxes();
        })
        .catch((err) => {
          console.error(err);
        });
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

export interface Element {
  name: string;
  position: number;
  weight: number;
  symbol: string;
}