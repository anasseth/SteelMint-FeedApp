import { Injectable } from '@angular/core';
import { NgxSpinnerService } from 'ngx-spinner';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {

  constructor(private spinner: NgxSpinnerService) { }

  convertSecondsToTimestamp(seconds: number) {
    var date = new Date(1970, 0, 1);
    date.setSeconds(seconds)
    return this.convertUTCDateToLocalDate(date);
  }

  convertUTCDateToLocalDate(date:any) {
    var newDate = new Date(date.getTime()+date.getTimezoneOffset()*60*1000);
    var offset = date.getTimezoneOffset() / 60;
    var hours = date.getHours();
    newDate.setHours(hours - offset);
    return newDate.toLocaleString();   
}

  showSpinner() {
    this.spinner.show()
  }

  hideSpinner() {
    this.spinner.hide();
  }
}
