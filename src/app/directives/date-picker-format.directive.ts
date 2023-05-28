import { Directive, Inject, Input, Optional } from '@angular/core';
import { NgControl } from '@angular/forms';
import { DateAdapter, MAT_DATE_FORMATS, NativeDateAdapter } from '@angular/material/core';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import * as moment from 'moment';
import { DatePipe } from '@angular/common';

export interface DateParse {
  dateInput: string;
}

export type DateDisplay = DateParse & {
  monthYearLabel?: string;
  dateA11yLabel?: string;
  monthYearA11yLabel?: string;
};

export class CustomDateFormat {
  private _parse: DateParse = {
    dateInput: 'DD/MM/YYYY',
  };
  private _display: DateDisplay = {
    dateInput: 'DD/MM/YYYY',
    monthYearLabel: 'MMM YYYY',
    dateA11yLabel: 'LL',
    monthYearA11yLabel: 'MMM YYYY',
  };

  set parse(parse: DateParse) {
    this._parse = Object.assign({}, this._parse, parse);
  }

  get parse(): DateParse {
    return this._parse;
  }

  set display(display: DateDisplay) {
    this._display = Object.assign({}, this._display, display);
  }

  get display(): DateDisplay {
    return this._display;
  }

  updateDateFormat(parse: DateParse, display?: DateDisplay) {
    this.parse = parse;
    if (!display) {
      display = parse;
    }
    this.display = display;
  }
}

class CustomDateAdapter extends NativeDateAdapter {
  private readonly _angularDateFormats = {
    'DD/MM/YYYY': 'dd/MM/yyyy',
    'DD/MM': 'dd/MM',
    'MM/YYYY': 'MM/yyyy',
    'YYYY': 'yyyy',
    'MM': 'MM',
    'DD': 'dd',
  };

  parse(value: any, parseFormat?: any): Date {
    if (typeof value == 'number') {
      return new Date(value);
    }
    return value ? moment(value, parseFormat).toDate() : null;
  }

  format(date: Date, displayFormat: string): string {
    if (!this.isValid(date)) {
      throw Error('NativeDateAdapter: Cannot format invalid date.');
    }
    const pipe = new DatePipe(this.locale);
    return pipe.transform(date, this._angularDateFormats[displayFormat]);
  }
}

@Directive({
  selector: '[datePickerFormat]',
  providers: [
    {
      provide: DateAdapter,
      useClass: CustomDateAdapter,
    },
    {
      provide: MAT_DATE_FORMATS,
      useClass: CustomDateFormat,
    },
  ],
})
export class DatePickerFormatDirective {
  @Input() public configDateParse: DateParse;
  @Input() public configDateDisplay: DateDisplay;

  @Input('datePickerFormat')
  set datePickerFormat(format: string) {
    if (this.configDateParse) {
      this.matDateFormat.updateDateFormat(this.configDateParse, this.configDateDisplay);
    } else {
      this.matDateFormat.updateDateFormat({ dateInput: format });
    }

    const value = this.ngControl.value;
    this.ngControl.valueAccessor?.writeValue(value);
  }

  constructor(@Inject(MAT_DATE_FORMATS) public matDateFormat: CustomDateFormat, @Optional() private ngControl: NgControl) {}
}
