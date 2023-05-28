import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { cloneDeep } from 'lodash';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import * as moment from 'moment';

@Component({
  selector: 'ms-set-session-multiple',
  templateUrl: './set-session-multiple.component.html',
  styleUrls: ['./set-session-multiple.component.scss'],
  providers: [ParseLocalToUtcPipe],
})
export class SetSessionMultipleComponent implements OnInit, OnDestroy {
  sessionsForm: UntypedFormGroup;
  isWaitingForResponse: boolean;
  checkSeason: boolean;
  private subs = new SubSink();

  constructor(
    @Inject(MAT_DIALOG_DATA)
    public data: {
      is_all_selected: boolean;
      count_document: number;
      students: any;
      school: any;
      rncp_id: string;
      class_id: string;
      juryId: string;
      filter?: any;
    },
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<SetSessionMultipleComponent>,
    private translate: TranslateService,
    private juryOrganizationService: JuryOrganizationService,
    private localToUtc: ParseLocalToUtcPipe,
  ) {}

  ngOnInit() {
    this.initSessionForm();
    this.addSession();
  }

  initSessionForm() {
    this.sessionsForm = this.fb.group({
      sessions: this.fb.array([]),
    });
  }

  initSessionGroup() {
    return this.fb.group({
      date_test: ['', Validators.required],
      start_time: ['', Validators.required],
      break_time: ['', Validators.required],
      break_duration: ['', Validators.required],
      session_per_day: ['', Validators.required],
      presentation_duration: ['', Validators.required],
      each_block_duration: ['', Validators.required],
    });
  }

  get sessions() {
    return this.sessionsForm.get('sessions') as UntypedFormArray;
  }

  addSession() {
    this.sessions.push(this.initSessionGroup());
  }

  removeSession(index: number) {
    this.sessions.removeAt(index);
  }

  setSession() {
    const payload = this.createPayload();
    this.subs.sink = this.juryOrganizationService.setupJuryOrganizationScheduleMultipleSession(payload).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;

        if (resp.message && resp.message !== 'success') {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo'),
            text: this.translate.instant('RGO_S6.TEXT'),
            footer: `<span style="margin-left: auto">RGO_S6</span>`,
            confirmButtonText: this.translate.instant('RGO_S6.BUTTON_1'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then((resp) => {

            this.closeDialog(resp);
          });
        } else {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo'),
            confirmButtonText: this.translate.instant('UserForm_S6.CONFIRM'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then((resp) => {

            this.closeDialog(resp);
          });
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.swalError(err);
        return;
      },
    );
  }

  async save() {
    if (!(await this.checkFormValidity())) return;
    if (!this.isSessionLengthMatchStudentsNumber()) {
      this.sessions.controls.forEach((element) => {
        element.get('session_per_day').patchValue('', { emitEvent: false });
      });

      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Unequal Number of Session'),
        text: this.translate.instant('The number of session does not match the number of selected students'),
        confirmButtonText: this.translate.instant('OK'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((resp) => {
        return;
      });
    } else {
      this.isWaitingForResponse = true;
      const payload = this.createForCheckPayload();
      this.subs.sink = this.juryOrganizationService
        .checkJuryOrganizationScheduleMultipleSession(payload.jury_id, payload.student_ids, payload.is_all_selected, payload.filter)
        .subscribe(
          (resp) => {

            // let sessionIsSet = false;
            // if (!this.data.is_all_selected) {
            //   const studentIds = this.data.students.map((student) => student.student_id._id);
            //   studentIds.forEach((el) => {
            //     sessionIsSet = resp.some((id) => id.student_id._id === el && id.date_test !== null);
            //   });
            // } else {
            //   sessionIsSet = resp.some((schedule) => schedule.is_session_already_set || schedule.date_test);
            // }
            if (resp && resp.length) {
              Swal.fire({
                type: 'warning',
                title: this.translate.instant('RGO_S4.TITLE'),
                html: this.translate.instant('RGO_S4.TEXT'),
                footer: `<span style="margin-left: auto">RGO_S4</span>`,
                confirmButtonText: this.translate.instant('RGO_S4.BUTTON_1'),
                cancelButtonText: this.translate.instant('RGO_S4.BUTTON_2'),
                allowEnterKey: false,
                allowEscapeKey: false,
                allowOutsideClick: false,
                showCancelButton: true,
                confirmButtonClass: 'btn-danger',
              }).then((confirm) => {
                if (confirm.value) {
                  this.setSession();
                } else {
                  this.isWaitingForResponse = false;
                  return;
                }
              });
            } else {
              this.setSession();
            }
          },
          (err) => {
            this.swalError(err);
          },
        );
    }
  }

  createForCheckPayload() {
    return {
      is_all_selected: this.data.is_all_selected ? this.data.is_all_selected : false,
      student_ids: this.data.is_all_selected ? null : this.data.students.map((student) => student.student_id._id), // dont send student_ids if is_all_selected is checked
      jury_id: this.data.juryId,
      filter: this.data.filter,
    };
  }

  createPayload() {
    const formValue = cloneDeep(this.sessions.value);
    for (const form of formValue) {
      form.date_test = this.convertLocalDateToUTC({ date: form.date_test, time_start: form.start_time });
      form.start_time = this.localToUtc.transform(form.start_time);
      form.break_time = this.localToUtc.transform(form.break_time);
    }
    return {
      is_all_selected: this.data.is_all_selected ? this.data.is_all_selected : false,
      retake_grand_oral_multiple_session_input: formValue,
      student_ids: this.data.is_all_selected ? null : this.data.students.map((student) => student.student_id._id), // dont send student_ids if is_all_selected is checked
      rncp_id: this.data.rncp_id,
      class_id: this.data.class_id,
      school_id: this.data.school._id,
      jury_id: this.data.juryId,
      filter: this.data.filter,
    };
  }

  async checkFormValidity(): Promise<boolean> {
    if (this.sessionsForm.invalid) {
      const action = await Swal.fire({
        type: 'warning',
        title: this.translate.instant('Invalid_Form_Warning.TITLE'),
        html: this.translate.instant('Invalid_Form_Warning.TEXT'),
        footer: `<span style="margin-left: auto">Invalid_Form_Warning</span>`,
        confirmButtonText: this.translate.instant('Invalid_Form_Warning.BUTTON'),
      });
      this.markAllFieldsAsTouched(this.sessionsForm);
      return false;
    } else {
      return true;
    }
  }

  isSessionLengthMatchStudentsNumber(): boolean {
    const totalSessionLength = this.sessions.value.reduce((prev, current) => {
      return prev + current.session_per_day;
    }, 0);

    return this.data.is_all_selected ? totalSessionLength === this.data.count_document : totalSessionLength === this.data.students.length;
  }

  // make all field as touched so error can show
  markAllFieldsAsTouched(formGroup: UntypedFormGroup) {
    Object.keys(formGroup.controls).forEach((field) => {
      const control = formGroup.get(field);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched({ onlySelf: true });
      } else if (control instanceof UntypedFormGroup) {
        this.markAllFieldsAsTouched(control);
      } else if (control instanceof UntypedFormArray) {
        control.markAllAsTouched();
      }
    });
  }

  swalError(err) {
    this.isWaitingForResponse = false;

    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    });
  }

  convertLocalDateToUTC(data) {

    const date = moment(data.date).format('DD/MM/YYYY');
    const time = data.time_start;

    const dateTimeInUTC = moment(date + time, 'DD/MM/YYYYHH:mm');

    return dateTimeInUTC.toISOString();
  }

  closeDialog(resp?) {
    this.dialogRef.close(resp);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
