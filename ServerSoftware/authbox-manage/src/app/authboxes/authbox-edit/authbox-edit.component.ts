import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

// This will just be a modal dialogue for editing an existing Authbox
@Component({
  selector: 'app-authbox-edit',
  templateUrl: './authbox-edit.component.html',
  styleUrls: ['./authbox-edit.component.css']
})
export class AuthboxEditComponent {
  checked = false;

  constructor(
    public dialogRef: MatDialogRef<AuthboxEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  deleteObj() {
    return Object.assign({}, this.data, {delete: true});
  }

  detailObj() {
    return Object.assign({}, this.data, {detail: true});
  }

}
