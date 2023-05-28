import { Pipe, PipeTransform } from '@angular/core';
import * as moment from 'moment';

@Pipe({
  name: 'parseLocalToUtc'
})
export class ParseLocalToUtcPipe implements PipeTransform {

  transform(time: any, args?: any): any {
    if (time) {
      const utcTime = moment(time, 'HH:mm').add(-(moment().utcOffset()), 'm').format('HH:mm');
      return utcTime;
    }
    return '';
  }

  transformDate(date: string, time: string): string {
    if (date) {
      const dateTimeInLocal = moment(date + time, 'DD/MM/YYYYHH:mm').add(-(moment().utcOffset()), 'm');
      return dateTimeInLocal.format('DD/MM/YYYY');
    }
    return '';
  }

  transformDateTime(date: string, time: string): string {
    if (date) {
      const dateTimeInLocal = moment(date + time, 'DD/MM/YYYYHH:mm').add(-(moment().utcOffset()), 'm');
      return dateTimeInLocal.format('DD/MM/YYYYHH:mm');
    }
    return '';
  }

  transformJavascriptDate(date: Date) {
    if (date) {
      const tempDate = moment(date).format('DD/MM/YYYY');
      const tempTime = moment(date).format('HH:mm');
      const dateTimeInLUTC = moment(tempDate + tempTime, 'DD/MM/YYYYHH:mm').add(-(moment().utcOffset()), 'm');
      return {date: dateTimeInLUTC.format('DD/MM/YYYY'), time: dateTimeInLUTC.format('HH:mm')};
    } else {
      return '';
    }
  }

}
