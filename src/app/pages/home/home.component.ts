import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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
  animations: [
    trigger('routerTransition', [
      transition('* <=> *', [
        query(':enter, :leave', style({ position: 'fixed', width: '100%' })),
        group([
          query(':enter', [
            style({ transform: 'translateX(100%)' }),
            animate('0.5s ease-in-out', style({ transform: 'translateX(0%)' })),
          ]),
          query(':leave', [
            style({ transform: 'translateX(0%)' }),
            animate(
              '0.5s ease-in-out',
              style({ transform: 'translateX(-100%)' })
            ),
          ]),
        ]),
      ]),
    ]),
  ],
})
export class HomeComponent implements OnInit {
  constructor(public router: Router) {}

  ngOnInit(): void {
    setTimeout(() => {
      this.router.navigate(['/feed']);
    }, 3000);
  }
}
