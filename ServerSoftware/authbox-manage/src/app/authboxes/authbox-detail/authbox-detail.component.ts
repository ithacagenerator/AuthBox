import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { MatDialog } from '@angular/material';
import { ApiService } from '../../api.service';
import { MatTableDataSource, MatPaginator, MatSort, MatSnackBar } from '@angular/material';
import { SuccessStatusSnackComponent } from '../../utilities/snackbars/success-snackbar/success-snackbar.component';
import { ErrorStatusSnackComponent } from '../../utilities/snackbars/error-snackbar/error-snackbar.component';
import { AuthboxAddMemberComponent } from '../authbox-add-member/authbox-add-member.component';

import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';
import { from } from 'rxjs/observable/from';
import { merge } from 'rxjs/observable/merge';
import { of as observableOf } from 'rxjs/observable/of';
import { catchError } from 'rxjs/operators/catchError';
import { map } from 'rxjs/operators/map';
import { startWith } from 'rxjs/operators/startWith';
import { switchMap } from 'rxjs/operators/switchMap';
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
export class AuthboxDetailComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  private authbox$: Observable<any>;
  private authboxSub: Subscription;
  private loginSubscription: Subscription;
  public authboxName;
  public members;

  displayedColumns = ['member', 'authorized', 'deauthorized'];
  dataSource = new MatTableDataSource();

  resultsLength = 0;
  isLoadingResults = true;

  constructor(
    private route: ActivatedRoute,
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
    public apiSrvc: ApiService,
    public router: Router
  ) {
    this.refreshMembers();
    this.loginSubscription = this.apiSrvc.loginStatus$().subscribe((loggedin) => {
      if (!loggedin) {
        this.members = null;
      }
      this.refreshMembers();
    });
  }

  ngOnInit() {
    this.authbox$ = this.route.paramMap
      .switchMap((params: ParamMap) => {
        return from([params.get('id')]);
      });

    this.authboxSub = this.authbox$.subscribe((id) => {
      this.authboxName = id;
    });

    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    merge(this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return this.apiSrvc.getAuthorizationHistory(this.authboxName,
            this.sort.active, this.sort.direction, this.dataSource.filter,
            this.paginator.pageIndex);
        }),
        map((data) => {
          // Flip flag to show that loading has finished.
          this.isLoadingResults = false;
          this.resultsLength = data.total_count;

          return data.items;
        }),
        catchError(() => {
          this.isLoadingResults = false;
          return observableOf([]);
        })
      ).subscribe(data => this.dataSource.data = data);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy() {
    if (this.authboxSub) { this.authboxSub.unsubscribe(); }
    if (this.loginSubscription) { this.loginSubscription.unsubscribe(); }
  }

  authorizedMembers() {
    if (this.members) {
      return this.members.filter(m =>
        m.authorizedBoxNames.indexOf(this.authboxName) >= 0);
    }
    return [];
  }

  refreshMembers() {
    this.apiSrvc.getMembers()
    .then((members) => {
      this.members = members;
    })
    .catch((err) => {
      // console.error(err);
    });
  }

  addAuthorizedMember() {
    const dialogRef = this.dialog.open(AuthboxAddMemberComponent, {
      width: '350px',
      height: '75%',
      data: { members: this.members, name: this.authboxName }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);
      // update all the members who are authorized
      if (result) {
        this.apiSrvc.bulkAuthorizeMembers(this.authboxName, result)
        .then(() => {
          console.log('Success');
          this.snackBar.openFromComponent(SuccessStatusSnackComponent, {
            duration: 1000,
          });
          this.refreshMembers();
        })
        .catch((err) => {
          console.error(err);
          this.snackBar.openFromComponent(ErrorStatusSnackComponent, {
            duration: 1000,
          });
        });
      }
    });
  }

  applyFilter(filterValue: string) {
    filterValue = filterValue.trim();
    filterValue = filterValue.toLowerCase();
    this.dataSource.filter = filterValue;
  }
}
