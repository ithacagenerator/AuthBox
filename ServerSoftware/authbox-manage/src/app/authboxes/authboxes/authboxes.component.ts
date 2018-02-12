import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { AuthboxCreateComponent } from '../authbox-create/authbox-create.component';
import { AuthboxEditComponent } from '../authbox-edit/authbox-edit.component';
import { ApiService } from '../../api.service';
import { ManagementPasswordService } from '../../management-password.service';
@Component({
  selector: 'app-auth-boxes',
  templateUrl: './authboxes.component.html',
  styleUrls: ['./authboxes.component.scss']
})
export class AuthBoxesComponent implements OnInit {

  name: string;
  id: string;
  access_code: string;

  constructor(
    public dialog: MatDialog,
    public apiSrvc: ApiService,
    public passwordSrvc: ManagementPasswordService
  ) { }

  ngOnInit() {
  }

  newAuthbox() {
    const dialogRef = this.dialog.open(AuthboxCreateComponent, {
      width: '250px',
      data: { }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      console.log(result);
    });
  }

  editAuthBox(authbox) {
    const dialogRef = this.dialog.open(AuthboxEditComponent, {
      width: '250px',
      data: { }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      console.log(result);
    });
  }

}
