import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'limitTo',
})
export class LimiteToPipe implements PipeTransform {
  transform(value: string, limit : number, completeWords :boolean) {

    const ellipsis = '...';
    let result = value || '';

    if (value) {
      if (completeWords){
        const words = value.split(/\s|,|-/);
        let l=words.length - limit;
        if (words.length > Math.abs(limit)) {
          if (limit < 0) {
            limit *= -1;
            result = ellipsis + words.slice(words.length - limit, words.length).join(' ');
          } else {
            result = words.slice(0, limit).join(' ') + ellipsis;
          }
        }
      } else if (value.length>limit) {
        result=value.substring(0, limit) + ellipsis ;
      }
      return result

    }

    return result;
  }
}
