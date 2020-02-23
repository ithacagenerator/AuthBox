import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { ApiService } from '../api.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MomentDateAdapter, MAT_MOMENT_DATE_ADAPTER_OPTIONS } from '@angular/material-moment-adapter';

import * as moment from 'moment';
import { Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { DateAdapter, MAT_DATE_LOCALE, MAT_DATE_FORMATS } from '@angular/material';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {

  loginSubscription: Subscription;
  periods = [];
  periodHeaders = [];
  members = [];
  data = [];
  years = [];

  constructor(
    private apiSrvc: ApiService,
    public dialog: MatDialog) {
    this.loginSubscription = this.apiSrvc.loginStatus$().subscribe(async (loggedin) => {
      if (!loggedin) {
        this.periods = [];
        this.members = [];
        this.data = [];
      } else {
        await this.fetchHistoricalData(moment().subtract(3, 'months').format('YYYY-MM'),
        moment().format('YYYY-MM'));
      }
    });
  }

  async fetchHistoricalData(from, to) {
    // ask for the data
    try {
      const data = await this.apiSrvc.getHistoricMembership(from, to);

      this.periods = data.periods;
      this.members = data.members.sort((a, b) => {
        const aLast = a.split(' ').slice(-1)[0];
        const bLast = b.split(' ').slice(-1)[0];
        if (aLast < bLast) { return -1; }
        if (aLast > bLast) { return +1; }
        return 0;
      });
      this.data = data.data;

      const years = new Set();
      this.periods.forEach(p => {
        years.add(p.split('-')[0]);
      });
      this.years = Array.from(years).map(v => {
        return {
          count: this.periods.filter(y => y.indexOf(v) >= 0).length,
          year: v
        };
      });

      this.periodHeaders = this.periods.map(v => {
        return moment(v.split('-')[1], 'MM').format('MMM');
      });
    } catch (e) {
      console.error(e.message || e, e.stack);
    }
  }

  ngOnInit() {

  }

  ngOnDestroy() {
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }
  }

  memberStatus(member, period) {
    const p = this.data.find(v => v.period === period);
    if (p) {
      const m = (p.members || []).find(v => v.name === member);
      if (m) {
        return '✓';
      }
    }
    return ' ';
  }

  checkMarkClass(member, period) {
    const p = this.data.find(v => v.period === period);
    if (p) {
      const m = (p.members || []).find(v => v.name === member);
      if (m) {
        // console.log(m.status);
        return `checkmark-${m.status}`;
      }
    }
    return '';
  }

  newMembersCount(data, i) {
    return data[i].members.filter(v => v.status === 'new').length;
  }

  activeMembersCount(data, i) {
    return data[i].members.filter(v => v.status === 'active' || v.status === '').length;
  }

  terminalMembersCount(data, i) {
    return data[i].members.filter(v => v.status === 'terminal').length;
  }

  openCalendarDialog(): void {
    const dialogRef = this.dialog.open(CalendarDialogComponent, {
      width: '350px',
      height: '75%',
      data: {}
    });

    dialogRef.afterClosed().subscribe(async (result) => {
      console.log('The dialog was closed', result);
      await this.fetchHistoricalData(result.start, result.end);
    });
  }
}

export const MY_FORMATS = {
  parse: {
    dateInput: 'MM/YYYY',
  },
  display: {
    dateInput: 'MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMMM YYYY',
  },
};
@Component({
  selector: 'app-calendar-dialog',
  template: `
    <h1 mat-dialog-title>Choose Date Range</h1>
    <div mat-dialog-content>
      <mat-form-field>
        <mat-label>Choose From Date</mat-label>
        <input matInput [matDatepicker]="fromPicker" [formControl]="fcFromDate">
        <mat-datepicker-toggle matSuffix [for]="fromPicker"></mat-datepicker-toggle>
        <mat-datepicker #fromPicker startView="year"
          (monthSelected)="chosenFromMonthHandler($event, fromPicker)"
          (yearSelected)="chosenFromYearHandler($event, fromPicker)"
        ></mat-datepicker>
      </mat-form-field>
      <mat-form-field>
        <mat-label>Choose To Date</mat-label>
        <input matInput [matDatepicker]="toPicker" [formControl]="fcToDate">
        <mat-datepicker-toggle matSuffix [for]="toPicker"></mat-datepicker-toggle>
        <mat-datepicker #toPicker startView="year"
          (monthSelected)="chosenToMonthHandler($event, toPicker)"
          (yearSelected)="chosenToYearHandler($event, toPicker)"
        ></mat-datepicker>
      </mat-form-field>
    </div>
    <div mat-dialog-actions>
      <button mat-button (click)="onNoClick()">Cancel</button>
      <button mat-button
        [disabled]="!datesAreValid"
        [mat-dialog-close]="dates"
        cdkFocusInitial>Save</button>
    </div>
  `,
    providers: [
      { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS },
    ]
})
export class CalendarDialogComponent {
  fcFromDate = new FormControl(moment());
  fcToDate = new FormControl(moment());
  dates = {start: moment().format('YYYY-MM'), end: moment().format('YYYY-MM')};
  datesAreValid = true;

  constructor(
    public dialogRef: MatDialogRef<CalendarDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any) {}

  chosenFromYearHandler(normalizedYear) {
    const ctrlValue = this.fcFromDate.value;
    ctrlValue.year(normalizedYear.year());
    this.fcFromDate.setValue(ctrlValue);
    this.datesAreValid = this.fcFromDate.value.isSameOrBefore(this.fcToDate.value);
  }

  chosenToYearHandler(normalizedYear) {
    const ctrlValue = this.fcToDate.value;
    ctrlValue.year(normalizedYear.year());
    this.fcToDate.setValue(ctrlValue);
    this.datesAreValid = this.fcFromDate.value.isSameOrBefore(this.fcToDate.value);
  }

  chosenFromMonthHandler(normalizedMonth, dp) {
    this.dates.start = moment(normalizedMonth).format('YYYY-MM');
    this.chosenFromYearHandler(normalizedMonth);
    const ctrlValue = this.fcFromDate.value;
    ctrlValue.month(normalizedMonth.month());
    this.fcFromDate.setValue(ctrlValue);
    this.datesAreValid = this.fcFromDate.value.isSameOrBefore(this.fcToDate.value);
    dp.close();
  }

  chosenToMonthHandler(normalizedMonth, dp) {
    this.dates.end = moment(normalizedMonth).format('YYYY-MM');
    this.chosenToYearHandler(normalizedMonth);
    const ctrlValue = this.fcToDate.value;
    ctrlValue.month(normalizedMonth.month());
    this.fcToDate.setValue(ctrlValue);
    this.datesAreValid = this.fcFromDate.value.isSameOrBefore(this.fcToDate.value);
    dp.close();
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
