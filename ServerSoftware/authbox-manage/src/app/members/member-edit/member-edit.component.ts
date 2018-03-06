import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ApiService } from '../../api.service';

// This will just be a modal dialogue for editing an existing Members
@Component({
  selector: 'app-member-edit',
  templateUrl: './member-edit.component.html',
  styleUrls: ['./member-edit.component.scss']
})
export class MemberEditComponent {
  public access_methods: any = [];
  public checked = false;

  constructor(
    public apiSrvc: ApiService,
    public dialogRef: MatDialogRef<MemberEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {

    this.apiSrvc.getAuthMethods()
    .then((methods) => {
      this.access_methods = methods;
    })
    .catch((err) => {
      this.access_methods = [];
    });

  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  deleteObj() {
    return Object.assign({}, this.data, {delete: true});
  }

  detailObj() {
    return Object.assign({}, this.data, {detail: true});
  }

  saveAllowed() {
    let ret = false;

    if (!this.data.name) { return false; } // name is required

    // either access_code and access_method are both blank
    // or they are both not blank
    if ((!!this.data.access_code) !== (!!this.data.access_method)) {
      return false;
    } else if (!!this.data.access_code) {
      // changing an access code / access method is sufficient as long as name is provided
      ret = true;
    }

    // changing email is sufficient as long as the above constraints hold
    if (this.data.email) {
      ret = true;
    }

    return ret;
  }
}
