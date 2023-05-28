import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { TaskService } from 'app/service/task/task.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import * as moment from 'moment';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-change-due-date-task-dialog',
  templateUrl: './change-due-date-task-dialog.component.html',
  styleUrls: ['./change-due-date-task-dialog.component.scss'],
  providers: [ParseLocalToUtcPipe],
})
export class ChangeDueDateTaskDialogComponent implements OnInit, OnDestroy {
  taskDueDateForm: UntypedFormGroup;
  private subs = new SubSink();
  isWaitingForResponse: boolean;

  constructor(
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
    private dialogRef: MatDialogRef<ChangeDueDateTaskDialogComponent>,
    private fb: UntypedFormBuilder,
    private parseLocalToUTC: ParseLocalToUtcPipe,
    private translate: TranslateService,
    private taskService: TaskService,
  ) {}

  ngOnInit() {
    this.initTaskDueDateForm();
    this.patchTaskDueDateForm();
  }

  ngOnDestroy() {}

  initTaskDueDateForm() {
    this.taskDueDateForm = this.fb.group({
      _ids: [[], [Validators.required]],
      due_date: [null, [Validators.required]],
    });
  }

  patchTaskDueDateForm() {
    if (this.dialogData) {
      if (this.dialogData && this.dialogData._ids && this.dialogData._ids.length === 1) {
        this.dialogData.due_date = moment(this.dialogData.due_date.date, 'DD/MM/YYYY');
      }
      this.taskDueDateForm.patchValue(this.dialogData);
      this.taskDueDateForm.markAsUntouched();
    }
  }

  createPayload() {
    const payload = this.taskDueDateForm.value;
    payload.due_date = {
      date: this.parseLocalToUTC.transformDate(moment(payload.due_date).format('DD/MM/YYYY'), '15:59'),
      time: '15:59',
    };
    return payload;
  }

  onEnter() {
    if (this.taskDueDateForm.get('due_date').invalid) {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S2.TITLE'),
        text: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S2.TEXT'),
      }).then(() => {
        this.taskDueDateForm.markAllAsTouched();
        this.taskDueDateForm.markAsDirty();
      });
      return;
    }
    this.changeDueDate();
  }

  changeDueDate() {
    const payload = this.createPayload();

    this.isWaitingForResponse = true;
    this.subs.sink = this.taskService.updateMultipleTaskBuilderDueDate(payload).subscribe(async (resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        await this.fireSwalBravo();
        this.dialogRef.close(resp);
      }
    });
  }

  async fireSwalBravo() {
    return await Swal.fire({
      type: 'success',
      title: this.translate.instant('Bravo'),
      confirmButtonText: this.translate.instant('OK'),
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
