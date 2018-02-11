import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { from } from 'rxjs/observable/from';
import 'rxjs/add/operator/switchMap';

/*
  This class should display:
  1. The name of the Authbox
  2. Which member has currently authorized it (if any)
  3. A list of members who are currently authorized to use it
  4. A button to add a new Authbox
*/

@Component({
  selector: 'app-authbox-detail',
  templateUrl: './authbox-detail.component.html',
  styleUrls: ['./authbox-detail.component.css']
})
export class AuthboxDetailComponent implements OnInit {

  authbox$;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.authbox$ = this.route.paramMap
      .switchMap((params: ParamMap) => {
        return from([params.get('id')]);
      });
  }

}
