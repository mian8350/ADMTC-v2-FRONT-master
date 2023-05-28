import { Component, OnInit, Output, Input, EventEmitter, OnDestroy, OnChanges } from '@angular/core';
import { StudentsService } from 'app/service/students/students.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-employability-survey',
  templateUrl: './employability-survey.component.html',
  styleUrls: ['./employability-survey.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class EmployabilitySurveyComponent implements OnInit, OnChanges, OnDestroy {
  private subs = new SubSink();
  @Input() fromComponent = '';
  @Input() studentId = '';
  @Input() schoolId: string;
  @Input() studentPrevCourseData: any;
  @Input() currentTitleId: string = ''
  @Input() currentClassId: string = ''
  @Input() esProcessId?;
  selectedEsForm;

  studentData;
  esData;

  isWaitingForResponse = false;

  constructor(
    private studentService: StudentsService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.getAllESData();
  }

  ngOnChanges() {
    this.selectedEsForm = null;
    this.studentData = null;
    this.esData = null;

    this.getAllESData();
  }

  getAllESData() {
    if (this.studentPrevCourseData) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.studentService
        .getStudentsPreviousESData(
          this.schoolId,
          this.studentPrevCourseData.rncp_title._id,
          this.studentPrevCourseData.current_class._id,
          this.studentId,
        )
        .subscribe((response) => {
          this.isWaitingForResponse = false;
          // student's previous course data
          if (response && response[0]) {
            const temp = _.cloneDeep(response[0]);
            this.setAllESData(temp);
          }
        });
    } else {
      this.isWaitingForResponse = true;
      this.subs.sink = this.studentService.getStudentsESData(this.studentId, this.currentTitleId, this.currentClassId).subscribe((resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          let temp = _.cloneDeep(resp);

          // If there is es process id in input, meaning its coming from preview of ES Process menu. So we need to filter out
          if (this.esProcessId && temp && temp.employability_survey_ids && temp.employability_survey_ids.length) {
            temp.employability_survey_ids = temp.employability_survey_ids.filter(
              (ES) => ES.employability_survey_process_id && ES.employability_survey_process_id._id === this.esProcessId,
            );
          }




          this.setAllESData(temp);
        }
      });
    }
  }

  setAllESData(temp) {
    const formattedData = this.formatData(temp);
    this.studentData = temp;
    if (formattedData && formattedData.length) {
      if (this.fromComponent === 'resultTable') {
        this.esData = formattedData.filter((es) => {
          return es.employability_survey_process_id._id === this.esProcessId;
        }).reverse();
      } else {
        this.esData = formattedData.reverse();
      }
    } else {
      this.esData = null;
    }
  }

  formatData(data) {
    if (data.employability_survey_ids && data.employability_survey_ids.length) {
      data.employability_survey_ids.forEach((esForm) => {
        if (esForm?.send_date && esForm?.send_time) {
          esForm.send_date = this.parseStringDatePipe.transformStringToDate(
            this.parseUTCToLocalPipe.transformDate(
              esForm?.send_date,
              esForm?.send_time,
            ),
          );
        }
        if (esForm?.expiration_date && esForm?.expiration_time) {
          esForm.expiration_date = this.parseStringDatePipe.transformStringToDate(
            this.parseUTCToLocalPipe.transformDate(
              esForm?.expiration_date,
              esForm?.expiration_time,
            ),
          );
        }
      });
    }

    return data.employability_survey_ids;
  }

  goToDetails(esForm) {

    if (esForm && esForm._id) {
      this.selectedEsForm = esForm._id;
    } else {
      this.selectedEsForm = null;
    }
  }

  backToAllES(event: boolean) {
    if (event) {
      this.selectedEsForm = null;
    }
  }

  getESToolTip(surveyStatus, surveyValidator) {
    let tooltip = surveyStatus;
    if (surveyStatus === 'rejected_by_validator' || surveyStatus === 'validated_by_validator') {
      tooltip = tooltip + '_' + surveyValidator;
    }
    return tooltip;
  }

  translateDate(date) {
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const lang = this.translate.currentLang;
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (lang === 'en' && date) {
      // return date.toLocaleDateString('en-US', options);
      const dateTemp = new Date(date);
      const day = days[dateTemp.getDay()];
      const month = months[dateTemp.getMonth()];
      const dateNumber = dateTemp.getDate();
      const year = dateTemp.getFullYear();
      const formattedDate = `${this.translate.instant('day.' + day)} ${dateNumber} ${this.translate.instant(month)} ${year}`;
      return formattedDate;
    } else if (lang === 'fr' && date) {
      // return date.toLocaleDateString('fr', options);
      const dateTemp = new Date(date);
      const day = days[dateTemp.getDay()];
      const month = months[dateTemp.getMonth()];
      const dateNumber = dateTemp.getDate();
      const year = dateTemp.getFullYear();
      const formattedDate = `${this.translate.instant('day.' + day)} ${dateNumber} ${this.translate.instant(month)} ${year}`;
      return formattedDate;
    } else {
      return '';
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
