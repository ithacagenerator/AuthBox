import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApiService } from '../api.service';

import * as moment from 'moment';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  loginSubscription: Subscription;
  periods = [];
  members = [];
  data = [];

  constructor(private apiSrvc: ApiService) {
    this.loginSubscription = this.apiSrvc.loginStatus$().subscribe(async (loggedin) => {
      if (!loggedin) {
        this.periods = [];
        this.members = [];
        this.data = [];
      } else {
        // ask for the data
        try {
          const data = await this.apiSrvc.getHistoricMembership(
            moment().subtract(3, 'months').format('YYYY-MM'),
            moment().format('YYYY-MM'));

          this.periods = data.periods;
          this.members = data.members;
          this.data = data.data;
        } catch (e) {
          console.error(e.message || e, e.stack);
        }
      }
    });
  }

  ngOnInit() {

  }

  ngOnDestroy() {
    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }
  }

  memberStatus(member, period) {
    console.log('hello');
    const p = this.data.find(v => v.period === period);
    if (p) {
      const m = (p.members || []).find(v => v.name === member);
      if (m) {
        return '✔️';
      }
    }
    return ' ';
  }
}
