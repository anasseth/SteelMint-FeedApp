import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {

  constructor(private spinner: NgxSpinnerService) { }

  convertSecondsToTimestamp(seconds: number) {
    var date = new Date(1970, 0, 1);
    date.setSeconds(seconds);
    return date;
  }

  showSpinner() {
    this.spinner.show()
  }

  hideSpinner() {
    this.spinner.hide();
  }
}
