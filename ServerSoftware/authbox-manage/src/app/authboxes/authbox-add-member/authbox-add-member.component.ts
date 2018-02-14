import { Component, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

// This will just be a modal dialogue for adding a new Authbox member
@Component({
  selector: 'app-authbox-add-member',
  templateUrl: './authbox-add-member.component.html',
  styleUrls: ['./authbox-add-member.component.scss']
})
export class AuthboxAddMemberComponent {
  @ViewChild('members') members;

  constructor(
    public dialogRef: MatDialogRef<AuthboxAddMemberComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  selectedMembers() {
    if (this.members) {
      return this.members.selectedOptions.selected.map(item => item.value);
    }
    return [];
  }
}
