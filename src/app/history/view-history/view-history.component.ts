import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogConfig, MatDialogRef, MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { DatePipe } from '@angular/common';
import * as moment from 'moment';

@Component({
  selector: 'ms-view-history',
  templateUrl: './view-history.component.html',
  styleUrls: ['./view-history.component.scss'],
})
export class ViewHistoryComponent implements OnInit {
  viewMessageData;
  datePipe;
  allHistory;
  currentSelectedIndexView;
  mailDialogConfig: MatDialogConfig = {
    disableClose: true,
    width: '720px',
    height: '530px',
  };
  constructor(
    public translate: TranslateService,
    public dialog: MatDialog,
    public dialogref: MatDialogRef<ViewHistoryComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: { viewMessageData: any; allHistory: any[] },
  ) {}

  ngOnInit() {
    this.viewMessageData = this.parentData.viewMessageData;
    this.allHistory = this.parentData.allHistory;
    this.viewMessageData.notification_message = this.viewMessageData.notification_message.replace(/(<a.*?\a>)/gi, '');
    for (let i = 0; i < this.allHistory.length; i++) {
      if (this.allHistory[i]['_id'] === this.viewMessageData['_id']) {
        this.currentSelectedIndexView = i;
      }
    }

  }

  // getTranslatedDate(date) {
  //   this.datePipe = new DatePipe(this.translate.currentLang);
  //   return this.datePipe.transform(date, 'fullDate');
  // }
  getTranslatedDate(dateRaw) {
    if (typeof dateRaw === 'object') {
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
      const formatDate = moment(date, 'DD/MM/YYYY');
      const dateTranslate = this.datePipe.transform(formatDate, 'EEEE d MMMM y');
      return dateTranslate;
    }
  }

  onPreviousMessage(data) {
    if (this.viewMessageData && this.currentSelectedIndexView !== 0) {
      this.currentSelectedIndexView = this.currentSelectedIndexView - 1;
      this.viewMessageData = this.allHistory[this.currentSelectedIndexView];
      const re = new RegExp('<a ([^]+)>[^"]+a>', 'g');
      this.viewMessageData.notification_message = this.viewMessageData.notification_message.replace(re, '');
    }
  }

  onNextMessage(data) {
    if (this.viewMessageData && this.currentSelectedIndexView + 1 < this.allHistory.length) {
      this.currentSelectedIndexView = this.currentSelectedIndexView + 1;
      this.viewMessageData = this.allHistory[this.currentSelectedIndexView];
      const re = new RegExp('<a ([^]+)>[^"]+a>', 'g');
      this.viewMessageData.notification_message = this.viewMessageData.notification_message.replace(re, '');
    }
  }

  checkIsPreviousBtnShow() {
    return this.currentSelectedIndexView !== 0;
  }

  checkIsNextBtnShow() {
    return this.currentSelectedIndexView !== this.allHistory.length - 1;
  }

  closeDialog(): void {
    this.dialogref.close();
  }
}
