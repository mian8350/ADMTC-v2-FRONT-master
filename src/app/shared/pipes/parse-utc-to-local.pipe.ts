import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'parseUtcToLocal'
})
export class ParseUtcToLocalPipe implements PipeTransform {

  transform(time: string, args?: any): string {
    if (time) {
      const localTime = moment(time, 'HH:mm').subtract(-(moment().utcOffset()), 'm').format('HH:mm');
      return localTime;
    }
    return '';
  }

  transformDate(date: string, time: string): string {
    if (date && time) {
      const dateTimeInLocal = moment(date + time, 'DD/MM/YYYYHH:mm').subtract(-(moment().utcOffset()), 'm');
      return dateTimeInLocal.format('DD/MM/YYYY');
    }
  }

  transformDateInDateFormat(date: string, time: string) {
    if (date && time) {
      const dateTimeInLocal = moment(date + time, 'DD/MM/YYYYHH:mm').subtract(-(moment().utcOffset()), 'm');
      return dateTimeInLocal;
    }
  }

  transformISODateToString(dateInIso: string) {
    if (dateInIso) {
      const dateTimeInLocal = moment(dateInIso).subtract(-(moment().utcOffset()), 'm');
      return dateTimeInLocal.format('DD/MM/YYYY')
    }
  }

  fixDateFormat(date: string): string {
    if (date.includes('-')) {
      // if date format is 2020-05-19, change it to "24/11/2020"
      const dateArr = date.split('-');
      date = `${dateArr[2]}/${dateArr[1]}/${dateArr[0]}`;
    }
    return date;
  }

  fixTimeFormat(time: string): string {
    if (time && !time.includes(':')) {
      // if time format is not hour:minute, change it to this format
      time = '00:00';
    }
    return time;
  }

  transformDateToJavascriptDate(date: string, time: string) {
    date = this.fixDateFormat(date);
    time = this.fixTimeFormat(time);
    if (date && time) {
      const dateTimeInLocal = moment(date + time, 'DD/MM/YYYYHH:mm').subtract(-(moment().utcOffset()), 'm');
      return dateTimeInLocal.toDate();
    }
  }

  transformDateToStringFormat(date: string, time: string): string {
    if (date && time) {
      const dateTimeInLocal = moment(date + time, 'DD/MM/YYYYHH:mm').subtract(-(moment().utcOffset()), 'm');
      return dateTimeInLocal.format('MMM DD, YYYY');
    }
  }

}
