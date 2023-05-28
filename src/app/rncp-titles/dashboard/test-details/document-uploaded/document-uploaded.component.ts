import { Component, OnInit, Input } from '@angular/core';
import { AcademicKitService } from '../../../../service/rncpTitles/academickit.service'
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { environment } from 'environments/environment';
import { UtilityService } from 'app/service/utility/utility.service';
import * as moment from 'moment';
import { AcadKitDocument } from '../../academic-kit.model';

@Component({
  selector: 'ms-document-uploaded',
  templateUrl: './document-uploaded.component.html',
  styleUrls: ['./document-uploaded.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseStringDatePipe]
})
export class DocumentUploadedComponent implements OnInit {
  isDocExist = false;
  datePipe: DatePipe;
  @Input() documentList;
  @Input() testData;
  constructor(
    private acadService: AcademicKitService,
    private translate: TranslateService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private parseDateToString: ParseStringDatePipe,
    private utilService: UtilityService
  ) { }

  ngOnInit() {
    this.filterDisplayedDoc();
  }

  filterDisplayedDoc() {
    // when login as user other than operator/ADMTC, check for document's publication date
    // if date still in the future, dont show the document. if date has passed, show the document
    if (this.testData.documents && this.testData.documents.length && !this.utilService.isUserEntityADMTC()) {
      this.testData.documents = this.testData.documents.filter(document => this.isDocumentTimePassedCurrentTime(document))
    }
  }

  isDocumentTimePassedCurrentTime(document: AcadKitDocument) {
    let validate = false;

    if (document) {
      const test = document.parent_test ? document.parent_test : null;
      const timeToday = moment();
      // ADMTC will always able to see the document regardless the user or the publication time
      if (this.utilService.isUserEntityADMTC()) {
        return true;
      }
      // Check if user is the correct WHO in the test creation tab 3
      if (!this.utilService.checkIsCurrentUserIncluded(document.published_for_user_types_id)) {
        return false;
      }

      if (document && document.publication_date) {
        if (document.publication_date.type === 'fixed') {
          const timePublication = this.parseUTCtoLocal.transformDateInDateFormat(
            document.publication_date.publication_date.date,
            document.publication_date.publication_date.time,
          );


          if (timeToday.isSameOrAfter(timePublication)) {
            validate = true;
          }
        } else if (document.publication_date.type === 'relative') {
          if ((test && test.date_type === 'marks') || test.date_type === 'different') {
            let timePublication = this.parseUTCtoLocal.transformDateInDateFormat(test.date.date_utc, test.date.time_utc);
            if (document.publication_date.relative_time) {
              const localDate = this.parseUTCtoLocal.transformDate(test.date.date_utc, test.date.time_utc);
              const localRelativeTime = this.parseUTCtoLocal.transform(document.publication_date.relative_time);
              timePublication = moment(localDate + localRelativeTime, 'DD/MM/YYYYHH:mm');
            }

            if (test.date_type === 'different') {
              const schools = this.utilService.getUserAllAssignedSchool();
              let school = '';
              if (schools && schools.length) {
                school = schools[0];
              }

              const tempDateSchool = test.schools;
              const foundSchool = tempDateSchool.find(
                (schoolData) => schoolData && schoolData.school_id && schoolData.school_id._id && schoolData.school_id._id === school,
              );

              if (foundSchool && foundSchool.test_date) {
                let schoolTime = foundSchool.test_date.time_utc;
                if (document.publication_date.relative_time) {
                  schoolTime = document.publication_date.relative_time
                  const localDate = this.parseUTCtoLocal.transformDate(foundSchool.test_date.date_utc, foundSchool.test_date.time_utc);
                  const localRelativeTime = this.parseUTCtoLocal.transform(document.publication_date.relative_time);

                  timePublication = moment(localDate + localRelativeTime, 'DD/MM/YYYYHH:mm');
                } else {
                  timePublication = this.parseUTCtoLocal.transformDateInDateFormat(
                    foundSchool.test_date.date_utc,
                    foundSchool.test_date.time_utc,
                  );
                }
              }
            }

            if (document.publication_date.before) {
              timePublication = timePublication.subtract(document.publication_date.day, 'd');
            } else {
              timePublication = timePublication.add(document.publication_date.day, 'd');
            }
            if (timeToday.isSameOrAfter(timePublication)) {
              validate = true;
            }
          } else if (test && test.date_type === 'fixed') {
            let timePublication = this.parseUTCtoLocal.transformDateInDateFormat(test.date.date_utc, test.date.time_utc).add(3, 'days');

            if (document.publication_date.relative_time) {
              const localDate = this.parseUTCtoLocal.transformDate(test.date.date_utc, test.date.time_utc);
              const localRelativeTime = this.parseUTCtoLocal.transform(document.publication_date.relative_time);
              timePublication = moment(localDate + localRelativeTime, 'DD/MM/YYYYHH:mm');
            }

            if (document.publication_date.before) {
              timePublication = timePublication.subtract(document.publication_date.day, 'd');
            } else {
              timePublication = timePublication.add(document.publication_date.day, 'd');
            }

            if (timeToday.isSameOrAfter(timePublication)) {
              validate = true;
            }
          }
        }
      }
    }
    return validate;
  }

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

  downloadDocumentAdded(documentData) {
    const url = `${environment.apiUrl}/fileuploads/${documentData.s3_file_name}?download=true`.replace('/graphql', '');
    window.open(url, '_blank');
    // window.open(documentData.file_path, '_blank');
  }

}
