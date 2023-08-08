import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {

  constructor() { }

  convertSecondsToTimestamp(seconds: number) {
    var date = new Date(1970, 0, 1);
    date.setSeconds(seconds);
    return date;
  }
}
