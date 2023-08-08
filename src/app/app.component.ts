import { Component } from '@angular/core';
import {
  trigger,
  animate,
  style,
  group,
  query,
  transition,
} from '@angular/animations';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
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
export class AppComponent {
  title = 'steelmint-announcement-app';

  getState(outlet: any) {
    return outlet.activatedRouteData.state;
  }
}
