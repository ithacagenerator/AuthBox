import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

// This will just be a modal dialogue for editing an existing Members
@Component({
  selector: 'app-member-edit',
  templateUrl: './member-edit.component.html',
  styleUrls: ['./member-edit.component.scss']
})
export class MemberEditComponent {
  checked = false;

  constructor(
    public dialogRef: MatDialogRef<MemberEditComponent>,
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
