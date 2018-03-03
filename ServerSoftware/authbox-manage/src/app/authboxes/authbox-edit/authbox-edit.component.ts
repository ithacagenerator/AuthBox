import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { UtilService } from '../../util.service';

// This will just be a modal dialogue for editing an existing Authbox
@Component({
  selector: 'app-authbox-edit',
  templateUrl: './authbox-edit.component.html',
  styleUrls: ['./authbox-edit.component.scss']
})
export class AuthboxEditComponent {
  checked = false;

  constructor(
    public dialogRef: MatDialogRef<AuthboxEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public util: UtilService) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  deleteObj() {
    return Object.assign({}, this.data, {delete: true});
  }

  detailObj() {
    return Object.assign({}, this.data, {detail: true});
  }

  validToSubmit() {
    return this.data.name &&
      (this.data.access_code ||
        this.data.id ||
        this.util.isNumeric(this.data.idle_timeout_ms));
  }
}
