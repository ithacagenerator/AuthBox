import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

// This will just be a modal dialogue for adding a new Authbox tot a member
@Component({
  selector: 'app-member-add-authbox',
  templateUrl: './member-add-authbox.component.html',
  styleUrls: ['./member-add-authbox.component.scss']
})
export class MemberAddAuthboxComponent implements AfterViewInit {
  @ViewChild('authboxes', {static: true}) authboxes;

  selectedAuthboxes = [];

  constructor(
    public dialogRef: MatDialogRef<MemberAddAuthboxComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) { }

  onNoClick(): void {
    this.dialogRef.close();
  }

  updateSelectedAuthboxes() {
    this.selectedAuthboxes = this.authboxes.selectedOptions.selected.map(item => item.value);
  }

  memberHasAccessto(authboxName) {
    if (this.data.member) {
      return (this.data.member.authorizedBoxNames || []).indexOf(authboxName) >= 0;
    } else {
      return false;
    }
  }

  ngAfterViewInit() {
    Promise.resolve().then(() => {
      this.updateSelectedAuthboxes();
    });
  }
}
