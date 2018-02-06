import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { from } from 'rxjs/observable/from';
import 'rxjs/add/operator/switchMap';

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
