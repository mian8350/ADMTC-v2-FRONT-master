import { Component, OnInit, Input } from '@angular/core';
import { AcademicKitService } from '../../../../service/rncpTitles/academickit.service'
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-document-expected',
  templateUrl: './document-expected.component.html',
  styleUrls: ['./document-expected.component.scss'],
  providers: [ParseUtcToLocalPipe]
})
export class DocumentExpectedComponent implements OnInit {
  isDocExist = false;
  datePipe: DatePipe;
  @Input() documentList;
  @Input() testData;
  constructor(
    private acadService: AcademicKitService,
    private translate: TranslateService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
  ) { }

  ngOnInit() {}

  getTranslatedDateDocument(dateRaw) {
    if (dateRaw && dateRaw.date && dateRaw.time) {
      return this.parseUTCtoLocal.transformDateToStringFormat(dateRaw.date, dateRaw.time);
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
}
