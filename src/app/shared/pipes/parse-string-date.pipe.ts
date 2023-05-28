import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';
@Pipe({
  name: 'parseStringDate'
})
export class ParseStringDatePipe implements PipeTransform {

  transform(date: any): any {
    const originalDate = String(date);

    if (originalDate.length === 8) {
      // convert from yyyymmdd to date format accepted by mat datepicker
      const year: number = +originalDate.substring(0, 4);
      const month: number = +originalDate.substring(4, 6);
      const day: number = +originalDate.substring(6, 8);
      return new Date(year, month, day);
    } else if (originalDate.includes('/')) {
      // convert from mm/dd/yyyy to date format accepted by mat datepicker
      const dateStringArray = originalDate.split('/');
      const year = +dateStringArray[2];
      const month = +dateStringArray[0] - 1;
      const day = +dateStringArray[1];
      return new Date(year, month, day);

    } else {
      return date
    }
  }

  transformMinusOne(date: any): any {
    const originalDate = String(date);

    if (originalDate.length === 8) {
      // convert from yyyymmdd to date format accepted by mat datepicker
      const year: number = +originalDate.substring(0, 4);
      const month: number = +originalDate.substring(4, 6);
      const day: number = +originalDate.substring(6, 8);
      return new Date(year, month, day);
    } else if (originalDate.includes('/')) {
      // convert from mm/dd/yyyy to date format accepted by mat datepicker
      const dateStringArray = originalDate.split('/');
      const year = +dateStringArray[2];
      const month = +dateStringArray[0] - 1;
      const day = +dateStringArray[1];
      return new Date(year, month, day);

    } else {
      return date
    }
  }

  transformDDMMYYYY(date: any): any {
    const originalDate = String(date);

    if (originalDate.length === 8) {
      // convert from yyyymmdd to date format accepted by mat datepicker
      const year: number = +originalDate.substring(0, 4);
      const month: number = +originalDate.substring(4, 6);
      const day: number = +originalDate.substring(6, 8);
      return new Date(year, month, day);
    } else if (originalDate.includes('/')) {
      // convert from DD/MM/YYYY to date format accepted by mat datepicker
      const dateTimeInLocal = moment(date, 'DD/MM/YYYY');
      return dateTimeInLocal.toDate();

    } else {
      return date
    }
  }

  transformStringToDate(date: any) {
    const originalDate = String(date);
    const dateStringArray = originalDate.split('/');
    const year = +dateStringArray[2];
    const day = +dateStringArray[0];
    const month = +dateStringArray[1] - 1;
    return new Date(year, month, day);
  }

  transformWithPlusOne(date: any): any {
    const originalDate = String(date);

    if (originalDate.length === 8) {
      // convert from yyyymmdd to date format accepted by mat datepicker
      const year: number = +originalDate.substring(0, 4);
      const month: number = +originalDate.substring(4, 6);
      const day: number = +originalDate.substring(6, 8) + 1;
      return new Date(year, month, day);
    } else {
      return date
    }
  }

  transformISOStringToDateObject(s) {
    const stringDate = s.split(/\D+/);
    return new Date(Date.UTC(stringDate[0], --stringDate[1], stringDate[2], stringDate[3], stringDate[4], stringDate[5], stringDate[6]));
  }

  transformStringToDateWithMonthName(date: string) {
    const originalDate = String(date);
    const dateStringArray = originalDate.split('/');
    const year = +dateStringArray[2];
    const day = +dateStringArray[0];
    const month = +dateStringArray[1] - 1;
    let currentDate = new Date(year, month, day);
    return currentDate.toLocaleDateString('en-GB', {year: 'numeric', month: 'short', day: 'numeric'});
  }
}
