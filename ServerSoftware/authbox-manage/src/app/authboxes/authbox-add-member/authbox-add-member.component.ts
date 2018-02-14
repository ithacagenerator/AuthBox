import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

// This will just be a modal dialogue for adding a new Authbox member
// Needs to collect fields for 'id', 'name' and 'access_code' (i.e. the secret used by the box)
// the access_code must be consistent with the authorization code configured in the physical box
// the access_code should provide an auto-generated randomized suggestion
@Component({
  selector: 'app-authbox-add-member',
  templateUrl: './authbox-add-member.component.html',
  styleUrls: ['./authbox-add-member.component.scss']
})
export class AuthboxAddMemberComponent {

  constructor(
    public dialogRef: MatDialogRef<AuthboxAddMemberComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }


}
