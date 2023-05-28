import { Component, OnInit, Output, Input, EventEmitter, Inject, OnDestroy } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { StudentsService } from 'app/service/students/students.service';
import { SubSink } from 'subsink';
import { removeSpaces } from 'app/service/customvalidator.validator';

@Component({
  selector: 'ms-school-student-deactivated-dialog',
  templateUrl: './school-student-deactivated-dialog.component.html',
  styleUrls: ['./school-student-deactivated-dialog.component.scss'],
})
export class SchoolStudentDeactivatedDialogComponent implements OnInit, OnDestroy {
  reactivateForm: UntypedFormGroup;
  isWaitingForResponse = false;
  private subs = new SubSink();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public translate: TranslateService,
    public dialogref: MatDialogRef<SchoolStudentDeactivatedDialogComponent>,
    private fb: UntypedFormBuilder,
    private studentService: StudentsService,
    private dateAdapter: DateAdapter<Date>
  ) {}

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.initReactivatedForm();
  }

  initReactivatedForm() {
    this.reactivateForm = this.fb.group({
      date_of_reactivation: [this.getTodayDate(), Validators.required],
      reason_for_reactivation: ['', [Validators.required, removeSpaces]],
    });
  }

  closeDialog(): void {
    this.dialogref.close();
  }

  reactivatedStudent() {
    this.isWaitingForResponse = true;
    const reactivate = this.reactivateForm.value;
    if (this.reactivateForm.valid) {
      const studentId = this.data._id;
      const date = reactivate.date_of_reactivation;
      const reason = reactivate.reason_for_reactivation;

      this.subs.sink = this.studentService.reactivateStudent(studentId, date, reason).subscribe((d) => {
        this.isWaitingForResponse = false;
        if (d) {
          Swal.fire({
            allowOutsideClick: false,
            confirmButtonText: this.translate.instant('ok'),
            title: this.translate.instant('IMP_STUDENT.MESSAGES.SUCCESS'),
            text: this.translate.instant('IMP_STUDENT.MESSAGES.REACTIVATEDSUCCESS'),
            type: 'success',
          }).then((inputValue) => {
            if (inputValue.value) {
              this.dialogref.close(true);
            }
          });
        } else {
          Swal.fire({
            title: 'Attention',
            text: this.translate.instant('STUDENT.FAILEDMESSAGE'),
            allowEscapeKey: false,
            type: 'warning',
            allowOutsideClick: false,
            confirmButtonText: this.translate.instant('ok')
          }).then((inputValue) => {
            this.dialogref.close();
          });
        }
      }, 
        (err) => {
          if(err['message']?.includes('Email Registered As Student')) {
            Swal.fire({
              title: this.translate.instant('DISABLE_REACTIVATION.title'),
              text: this.translate.instant('DISABLE_REACTIVATION.text' , {
                civility : this.translate.instant(this.data?.civility),
                lastName : this.data?.last_name,
                firstName : this.data?.first_name,
              }),
              allowEscapeKey: false,
              type: 'warning',
              allowOutsideClick: false,
              confirmButtonText: this.translate.instant('DISABLE_REACTIVATION.button'),
              footer: `<span style="margin-left: auto">REACTIVATE_S1</span>`,
            }).then(() => {
              this.dialogref.close(true);
            });
          }
        }
      );
    } else {
      this.reactivateForm.markAllAsTouched();
    }
  }

  getTodayDate() {
    return moment().format('DD/MM/YYYY');
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
