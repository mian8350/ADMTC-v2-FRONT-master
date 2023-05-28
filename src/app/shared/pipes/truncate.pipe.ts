import { Pipe, PipeTransform } from '@angular/core';
import { isNumber } from 'util';

@Pipe({
  name: 'truncate',
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, args: string[]): string {
    if (args === undefined) {
      return value;
    }

    const limit = args.length > 0 ? parseInt(args[0], 10) : 15;
    const trail = args.length > 1 ? args[1] : '...';
    return value.length > limit ? value.substring(0, limit) + trail : value;
  }

  formatDate(value): any {
    if (isNumber(value)) {
      value = value.toString();
    }
    if (value.length === 8 && !value.includes('-')) { // example date: 19980931
      const year: number = parseInt(value.substring(0, 4));
      const month: number = parseInt(value.substring(4, 6));
      const day: number = parseInt(value.substring(6, 8));
      const date = new Date(year, month, day);
      return date;
    }
  }
}
