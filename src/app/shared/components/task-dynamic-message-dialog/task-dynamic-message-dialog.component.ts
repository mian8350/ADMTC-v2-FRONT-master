import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/service/auth-service/auth.service';
import { TaskService } from 'app/service/task/task.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-task-dynamic-message-dialog',
  templateUrl: './task-dynamic-message-dialog.component.html',
  styleUrls: ['./task-dynamic-message-dialog.component.scss'],
})
export class TaskDynamicMessageDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  isWaitingForResponse = false;
  currentUser: any;
  method: any;
  dataMessage: any;
  validationStepList: any;
  isVideoLink = false;
  generateVideo = true;
  candidateSchool = [];
  buttonDisabled = true;
  public time = 125;
  countdownHabis = false;
  count = 5;
  timeout = setInterval(() => {
    if (this.count > 0) {
      this.count -= 1;
    } else {
      clearInterval(this.timeout);
    }
  }, 1000);

  constructor(
    public dialogRef: MatDialogRef<TaskDynamicMessageDialogComponent>,
    private taskService: TaskService,
    public userService: AuthService,
    public translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit() {
    if (this.data.dataFrom === 'previewMessage') {
      this.dataMessage = this.data.dataPreview;
    } else {
      this.getTaskMessage();
    }


    this.currentUser = this.userService.getLocalStorageUser();
  }

  getTaskMessage() {
    if (this.data.task_id) {
      this.subs.sink = this.taskService
        .getTaskMessageWithTaskId(this.data.task_builder_id, this.data.isPreview, this.data.trigger_condition, this.data.task_id)
        .subscribe((resp) => {
          if (resp) {
            this.dataMessage = resp;

          } else {
            // this.closeDialog();
          }
        });
    } else {
      this.subs.sink = this.taskService
        .getTaskMessage(this.data.task_builder_id, this.data.isPreview, this.data.trigger_condition)
        .subscribe((resp) => {
          if (resp) {
            this.dataMessage = resp;

          } else {
            // this.closeDialog();
          }
        });
    }
  }

  confirmValidation(type) {
    this.dialogRef.close(true);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
