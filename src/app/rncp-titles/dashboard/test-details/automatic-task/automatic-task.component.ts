import { Component, OnInit, Input } from '@angular/core';
import { TruncatePipe } from '../../../../shared/pipes/truncate.pipe'
import { TranslateService } from '@ngx-translate/core';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'ms-automatic-task',
  templateUrl: './automatic-task.component.html',
  styleUrls: ['./automatic-task.component.scss'],
  providers: [ParseUtcToLocalPipe]
})
export class AutomaticTaskComponent implements OnInit {
  isTaskExist = false;
  datePipe: DatePipe;
  @Input() testData;
  //dummy
  // taskList = [
  //   {name : "Send the Evaluation to Company's Mentor", date : "May 29, 2019"},
  //   {name : "Validation of Mentor Evaluation", date : "Jun 27, 2019"}
  // ]
  @Input() taskList;
  constructor(
    private translate: TranslateService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
  ) { }

  ngOnInit() {
    // if ((this.taskList === (undefined || null)) || (this.taskList.length <= 0) ) {
      // this.documentList = [];
      // this.getDocumentUploaded();
    // } else {
    //   this.isTaskExist = true;
    // }
  }

  getTranslatedDate(dateRaw) {
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

  getTaskTranslation(task: any): string {
    const isAutomaticTask = task.is_automatic_task ? task.is_automatic_task : '';
    const taskType = task.text;

    if (isAutomaticTask) {
      // convert taskType from assign_corrector to be ASSIGN CORRECTOR
      const convertedTaskType = taskType.replace(/_/g, ' ').toUpperCase();
      return this.translate.instant('TEST.AUTOTASK.' + convertedTaskType);
    }
    return taskType;
  }

}
