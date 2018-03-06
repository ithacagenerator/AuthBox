import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ApiService } from '../../api.service';

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

  public access_methods: any = [];

  constructor(
    public apiSrvc: ApiService,
    public dialogRef: MatDialogRef<MemberCreateComponent>,
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

}
