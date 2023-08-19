import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  trigger,
  animate,
  style,
  group,
  query,
  transition,
} from '@angular/animations';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {

  userId!: string;

  constructor(public router: Router, public ActivatedRoute: ActivatedRoute) { }

  ngOnInit(): void {
    this.ActivatedRoute.queryParams.subscribe(
      (param) => {
        if (param.userId) {
          this.userId = param.userId;
        }
      }
    )
    setTimeout(() => {
      this.router.navigate(['/feed'], { queryParams: { userId: this.userId } });
    }, 3000);
  }
}
