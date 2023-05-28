import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { UserTableData } from 'app/users/user.model';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';
import { TaskService } from 'app/service/task/task.service';
import * as moment from 'moment';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';

@Component({
  selector: 'ms-justify-absence-dialog',
  templateUrl: './justify-absence-dialog.component.html',
  styleUrls: ['./justify-absence-dialog.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class JustifyAbsenceDialogComponent implements OnInit, OnDestroy {
  justifyAbsenceForm: UntypedFormGroup;
  private subs = new SubSink();
  decisionList = [];
  templateList = [];
  isWaitingForResponse = false;
  juryData: any;
  sessionDate: any;
  sessionTime: string;

  constructor(
    public dialogRef: MatDialogRef<JustifyAbsenceDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: any,
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private taskService: TaskService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
  ) {}

  ngOnInit() {
    this.initForm();
    this.getDataTask();
  }

  getDataTask() {
    if (this.parentData && this.parentData._id) {
      this.subs.sink = this.taskService.getTaskForJury(this.parentData._id).subscribe((resp) => {
        if (resp && resp.jury_member_id) {
          this.subs.sink = this.taskService.getJuryFromTask(resp.jury_member_id).subscribe((jury) => {
            if (jury) {
              this.juryData = _.cloneDeep(jury);
              if (this.parentData.type === 'online_jury_student_attendance_justification') {
                const student = jury.students.find((stud) => stud.student_id._id === this.parentData.student_id._id);
                this.juryData.students = student;
                if (this.juryData.students.test_hours_start && this.juryData.students.date_test) {
                  this.sessionTime = this.parseUTCtoLocal.transform(this.juryData.students.test_hours_start);
                  this.sessionDate = this.convertUTCToLocalDate(this.juryData.students);
                }
              }
            }
          });
        }
      });
    }
  }

  initForm() {
    this.justifyAbsenceForm = this.fb.group({
      task_id: [this.parentData._id, Validators.required],
      reason: [null, Validators.required],
    });
  }

  submitAbsence() {
    const payload = this.justifyAbsenceForm.value;

    if (this.parentData.type === 'online_jury_student_attendance_justification') {
      this.subs.sink = this.taskService.studentJustification(payload.task_id, payload.reason).subscribe((resp) => {
        if (resp) {
          Swal.fire({
            type: 'success',
            title: 'Bravo',
          });
          this.dialogRef.close(payload);
        }
      });
    } else if (this.parentData.type === 'online_jury_jury_member_attendance_justification') {
      this.subs.sink = this.taskService.juryJustification(payload.task_id, payload.reason).subscribe((resp) => {
        if (resp) {
          Swal.fire({
            type: 'success',
            title: 'Bravo',
          });
          this.dialogRef.close(payload);
        }
      });
    }
  }

  convertUTCToLocalDate(data) {
    const date = moment(data.date_test).format('DD/MM/YYYY');
    const time = data.test_hours_start;

    if (date === 'Invalid date') {
      const dates = new Date(parseInt(data.date_test));
      let fdate = dates.getFullYear() + '/' + ('0' + (dates.getMonth() + 1)).slice(-2) + '/' + ('0' + dates.getDate()).slice(-2);
      fdate = moment(fdate).format('DD/MM/YYYY');

      // Will display time in 10:30:23 format
      const dateTimeInLocal = moment(fdate + time, 'DD/MM/YYYYHH:mm');
      return dateTimeInLocal.format('DD/MM/YYYY');
    } else {
      const dateTimeInLocal = moment(date + time, 'DD/MM/YYYYHH:mm');
      return dateTimeInLocal.format('DD/MM/YYYY');
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
