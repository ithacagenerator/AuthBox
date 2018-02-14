import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { MatDialog } from '@angular/material';
import { ApiService } from '../../api.service';
import { MatTableDataSource, MatSort, MatSnackBar } from '@angular/material';
import { SuccessStatusSnackComponent } from '../../utilities/snackbars/success-snackbar/success-snackbar.component';
import { ErrorStatusSnackComponent } from '../../utilities/snackbars/error-snackbar/error-snackbar.component';
import { AuthboxAddMemberComponent } from '../authbox-add-member/authbox-add-member.component';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { from } from 'rxjs/observable/from';
import 'rxjs/add/operator/switchMap';

/*
  This class should display:
  1. The name of the Authbox
  2. Which member has currently authorized it (if any)
  3. A list of members who are currently authorized to use it
  4. A button to add a new Authorized Member
*/

@Component({
  selector: 'app-authbox-detail',
  templateUrl: './authbox-detail.component.html',
  styleUrls: ['./authbox-detail.component.scss']
})
export class AuthboxDetailComponent implements OnInit, OnDestroy {

  private authbox$: Observable<any>;
  private authboxSub: Subscription;
  public authboxName;

  constructor(
    private route: ActivatedRoute,
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
    public apiSrvc: ApiService,
    public router: Router
  ) { }

  ngOnInit() {
    this.authbox$ = this.route.paramMap
      .switchMap((params: ParamMap) => {
        return from([params.get('id')]);
      });

    this.authboxSub = this.authbox$.subscribe((id) => {
      this.authboxName = id;
    });
  }

  ngOnDestroy() {
    if (this.authboxSub) { this.authboxSub.unsubscribe(); }
  }

  addAuthorizedMember() {
    const dialogRef = this.dialog.open(AuthboxAddMemberComponent, {
      width: '350px',
      height: '75%',
      data: { }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);
    });
  }
}
