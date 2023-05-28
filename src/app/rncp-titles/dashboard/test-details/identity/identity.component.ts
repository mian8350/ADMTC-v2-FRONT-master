import { Component, OnInit, Input } from '@angular/core';
import { AcademicKitService } from '../../../../service/rncpTitles/academickit.service';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-identity',
  templateUrl: './identity.component.html',
  styleUrls: ['./identity.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class IdentityComponent implements OnInit {
  @Input() testData;
  datePipe: DatePipe;
  constructor(private acadService: AcademicKitService, private translate: TranslateService, private parseUTCtoLocal: ParseUtcToLocalPipe) {}

  ngOnInit() {

    // if (this.testData.max_score == (undefined || null) ) {
    //   this.getData();
    // } else {
    //   this.testData = this.processData(this.testData);
    // }
  }

  getTranslatedDate(dateRaw) {
    if (dateRaw && dateRaw.date_utc && dateRaw.time_utc) {
      return this.parseUTCtoLocal.transformDate(dateRaw.date_utc, dateRaw.time_utc);
    } else if (typeof dateRaw === 'object') {
      const date = new Date(dateRaw.year, dateRaw.month, dateRaw.date, dateRaw.hour, dateRaw.minute);
      this.datePipe = new DatePipe(this.translate.currentLang);
      return this.datePipe.transform(date, 'EEE d MMM, y');
    } else {
      let date = dateRaw;
      if (typeof date === 'number') {
        date = date.toString();
      }
      if (date.length === 8) {
        const year: number = parseInt(date.substring(0, 4));
        const month: number = parseInt(date.substring(4, 6));
        const day: number = parseInt(date.substring(6, 8));
        date = new Date(year, month, day);
      }
      this.datePipe = new DatePipe(this.translate.currentLang);
      return this.datePipe.transform(date, 'EEE d MMM, y');
    }
  }

  translateDate(date: Number) {
    const value = date.toString();
    if (value.length === 8 && !value.includes('-')) {
      // example date: 19980931
      const year: number = parseInt(value.substring(0, 4));
      const month: number = parseInt(value.substring(4, 6));
      const day: number = parseInt(value.substring(6, 8));
      const date = new Date(year, month, day);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
  }
}
