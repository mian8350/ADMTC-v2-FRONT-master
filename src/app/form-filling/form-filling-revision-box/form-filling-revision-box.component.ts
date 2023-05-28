import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { SubSink } from 'subsink';
import { FormFillingRevisionDialogComponent } from '../form-filling-revision-dialog/form-filling-revision-dialog.component';

interface Message {
  created_date: string;
  created_time: string;
  created_by: User;
  user_type_id: UserType;
  message: string;
}

interface User {
  _id: string;
  first_name: string;
  last_name: string;
  civility: string;
}

interface UserType {
  _id: string;
  name: string;
}

@Component({
  selector: 'ms-form-filling-revision-box',
  templateUrl: './form-filling-revision-box.component.html',
  styleUrls: ['./form-filling-revision-box.component.scss'],
  providers: [ParseStringDatePipe, ParseUtcToLocalPipe],
})
export class FormFillingRevisionBoxComponent implements OnInit {
  isExpanded = false;
  _subs = new SubSink();
  _messages: Message[] = [];
  _unformattedMessages: Message[] = [];
  @Input() set messages(value: Message[]) {
    this._messages = this.formatMessages(value);
    this._unformattedMessages = value;
  }
  @Input() formDetail;
  @Input() stepId;
  @Input() stepData;
  @Output() triggerRefresh: EventEmitter<any> = new EventEmitter();

  get messages() {
    return this._messages;
  }

  get unformattedMessages() {
    return this._unformattedMessages;
  }

  constructor(private dialog: MatDialog, private parseStringDate: ParseStringDatePipe, private parseUtcToLocal: ParseUtcToLocalPipe) {}

  ngOnInit() {}

  openRevisionDialog() {
    this._subs.sink = this.dialog
      .open(FormFillingRevisionDialogComponent, {
        disableClose: true,
        minWidth: '800px',
        panelClass: 'no-padding',
        data: {
          type: 'reply',
          formData: this.formDetail,
          stepId: this.stepId ? this.stepId : null,
          existingMessages: this.unformattedMessages,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        this.triggerRefresh.emit(null);
      });
  }

  // transform the dates to meet the specification
  formatMessages(messages: Message[]) {
    return messages.map((message) => ({
      ...message,
      created_date: this.parseStringDate.transformStringToDateWithMonthName(message.created_date),
      created_time: this.parseUtcToLocal.transform(message.created_time),
    })).reverse()
  }
}
