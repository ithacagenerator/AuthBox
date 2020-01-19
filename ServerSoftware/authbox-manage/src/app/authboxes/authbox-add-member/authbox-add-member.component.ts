import { Component, Inject, ViewChild, AfterViewInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

// This will just be a modal dialogue for adding a new Authbox member
@Component({
  selector: 'app-authbox-add-member',
  templateUrl: './authbox-add-member.component.html',
  styleUrls: ['./authbox-add-member.component.scss']
})
export class AuthboxAddMemberComponent implements AfterViewInit {
  @ViewChild('members', {static: true}) members;

  selectedMembers = [];

  constructor(
    public dialogRef: MatDialogRef<AuthboxAddMemberComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  updateSelectedMembers() {
    this.selectedMembers = this.members.selectedOptions.selected.map(item => item.value);
  }

  ngAfterViewInit() {
    Promise.resolve().then(() => {
      this.updateSelectedMembers();
    });
  }
}
