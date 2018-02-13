import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

// This will just be a modal dialogue for creating a new Member
// Needs to collect fields for 'name', 'email' and 'access_code'
// (i.e. the numeric code they enter to identify themselves)
// the access_code should provide an auto-generated randomized suggestion

@Component({
  selector: 'app-member-create',
  templateUrl: './member-create.component.html',
  styleUrls: ['./member-create.component.scss']
})
export class MemberCreateComponent {

  constructor(
    public dialogRef: MatDialogRef<MemberCreateComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

}
