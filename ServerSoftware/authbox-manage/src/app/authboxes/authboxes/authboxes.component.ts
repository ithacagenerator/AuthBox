import { Component, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material';
import { AuthboxCreateComponent } from '../authbox-create/authbox-create.component';

@Component({
  selector: 'app-auth-boxes',
  templateUrl: './authboxes.component.html',
  styleUrls: ['./authboxes.component.scss']
})
export class AuthBoxesComponent implements OnInit {

  name: string;
  id: string;
  access_code: string;

  constructor(public dialog: MatDialog) { }

  ngOnInit() {
  }

  newAuthbox() {
    const dialogRef = this.dialog.open(AuthboxCreateComponent, {
      width: '250px',
      data: { name: this.name, id: this.id, access_code: this.access_code }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      console.log(result);
    });
  }
}
