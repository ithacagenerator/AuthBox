import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { MatDialog } from '@angular/material';
import { ApiService } from '../../api.service';
import { MatTableDataSource, MatPaginator, MatSort, MatSnackBar } from '@angular/material';
import { SuccessStatusSnackComponent } from '../../utilities/snackbars/success-snackbar/success-snackbar.component';
import { ErrorStatusSnackComponent } from '../../utilities/snackbars/error-snackbar/error-snackbar.component';
import { MemberAddAuthboxComponent } from '../member-add-authbox/member-add-authbox.component';

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

@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.scss']
})
export class MemberDetailComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  private member$: Observable<any>;
  private memberSub: Subscription;
  private loginSubscription: Subscription;
  public memberName;
  public authboxes;
  public memberObj;

  displayedColumns = ['box_name', 'authorized', 'deauthorized'];
  dataSource = new MatTableDataSource();

  resultsLength = 0;
  isLoadingResults = true;

  observer;
  filterUpdate$ = Observable.create((obs) => this.observer = obs);

  constructor(
    private route: ActivatedRoute,
    public dialog: MatDialog,
    public snackBar: MatSnackBar,
    public apiSrvc: ApiService,
    public router: Router
  ) {
    this.refreshAuthboxes();
    this.loginSubscription = this.apiSrvc.loginStatus$().subscribe((loggedin) => {
      if (!loggedin) {
        this.authboxes = null;
      }
      this.refreshAuthboxes();
      this.refreshMember();
    });
  }

  ngOnInit() {
    this.member$ = this.route.paramMap
      .switchMap((params: ParamMap) => {
        return from([params.get('id')]);
      });

    this.memberSub = this.member$.subscribe((name) => {
      this.memberName = name;
      this.refreshMember();
    });

    this.sort.sortChange.subscribe(() => this.paginator.pageIndex = 0);

    merge(this.filterUpdate$, this.sort.sortChange, this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.isLoadingResults = true;
          return this.apiSrvc.getMemberHistory(this.memberName,
            this.sort.active, this.sort.direction, this.dataSource.filter,
            this.paginator.pageIndex);
        }),
        map((data) => {
          // Flip flag to show that loading has finished.
          this.isLoadingResults = false;
          this.resultsLength = data.total_count;
          return data.items;
        }),
        catchError((err) => {
          console.log(err);
          this.isLoadingResults = false;
          return observableOf([]);
        })
      ).subscribe((data) => {
        this.dataSource.data = data;
      });
  }

  ngAfterViewInit() {

  }

  ngOnDestroy() {
    if (this.memberSub) { this.memberSub.unsubscribe(); }
    if (this.loginSubscription) { this.loginSubscription.unsubscribe(); }
  }

  authorizedBoxes() {
    if (this.memberObj) {
      return this.memberObj.authorizedBoxNames;
    }
    return [];
  }

  refreshAuthboxes() {
    this.apiSrvc.getAuthBoxes()
    .then((boxes) => {
      this.authboxes = boxes;
    })
    .catch((err) => {
      // console.error(err);
    });
  }

  refreshMember() {
    if (this.memberName) {
      this.apiSrvc.getMember(this.memberName)
      .then((member) => {
        this.memberObj = member;
      });
    }
  }

  addAuthorizedBox() {
    const dialogRef = this.dialog.open(MemberAddAuthboxComponent, {
      width: '350px',
      height: '75%',
      data: { authboxes: this.authboxes, member: this.memberObj }
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);
      // update all the members who are authorized
      if (result) {
        this.apiSrvc.bulkAuthorizeBoxes(this.memberName, result)
        .then(() => {
          console.log('Success');
          this.snackBar.openFromComponent(SuccessStatusSnackComponent, {
            duration: 1000,
          });
          this.refreshAuthboxes();
          this.refreshMember();
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
    this.observer.next('thing');
  }
}
