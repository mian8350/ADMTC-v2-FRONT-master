import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'ms-postpone-dialog',
  templateUrl: './postpone-dialog.component.html',
  styleUrls: ['./postpone-dialog.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseLocalToUtcPipe]
})
export class PostponeDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  postponeForm: UntypedFormGroup;

  isWaitingForResponse = false;

  select_from_current_president_of_jury = false;
  juryOrgId;
  studentId;
  groupId;

  // *************** Variable from V1
  dates = [];
  juryData: any;
  timeslots = [];
  selectedDate = '';
  today = new Date(new Date().setHours(0, 0, 0, 0));

  // Controls for auto complete
  dateCtrl = new UntypedFormControl(null);
  dateList: any[] = [];
  filteredDate: Observable<any[]>;

  timeCtrl = new UntypedFormControl(null);
  timeList: any[] = [];
  filteredTime: Observable<any[]>;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<PostponeDialogComponent>,
    private juryService: JuryOrganizationService,
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private parseUtcToLocal: ParseUtcToLocalPipe,
    private parseLocalToUTC: ParseLocalToUtcPipe
  ) { }

  ngOnInit() {

    if (this.data && this.data.juryData) {
      this.juryData = this.data.juryData;
      if (this.juryData.jury_organization_id && this.juryData.jury_organization_id._id) {
        this.juryOrgId = this.juryData.jury_organization_id._id
      }
      if (this.juryData.students && this.juryData.students.student_id && this.juryData.students.student_id._id) {
        this.studentId = this.juryData.students.student_id._id
      }
      if (this.juryData.test_groups && this.juryData.test_groups.group_id && this.juryData.test_groups.group_id._id) {
        this.groupId = this.juryData.test_groups.group_id._id
      }
    }

    if (this.data && this.data.select_from_current_president_of_jury) {
      this.select_from_current_president_of_jury = this.data.select_from_current_president_of_jury
    }

    this.initForm();
    this.getDatesGlobalList();
    this.initAutoCompleteListener()

    // Old code before Backup Global
    // this.dates = this.data;
    // if (this.data) {
    //   if (this.data.dates) {
    //     this.dates = this.data.dates;
    //   } else {
    //     this.dates = [];
    //   }
    //   if (this.data.juryData) {
    //     this.juryData = this.data.juryData
    //   }
    // }
  }

  initForm() {
    this.postponeForm = this.fb.group({
      lang: [this.translate.currentLang],
      jury_id: [
        this.juryData && this.juryData.jury_organization_id && this.juryData.jury_organization_id._id ? this.juryData.jury_organization_id._id : null,
        [Validators.required],
      ],
      student_id: [
        this.juryData && this.juryData.students && this.juryData.students.student_id && this.juryData.students.student_id._id
          ? this.juryData.students.student_id._id
          : null,
      ],
      test_group_id: [
        this.juryData && this.juryData.test_groups && this.juryData.test_groups.group_id && this.juryData.test_groups.group_id._id
          ? this.juryData.test_groups.group_id._id
          : null,
      ],
      jury_member_id: [this.juryData && this.juryData._id ? this.juryData._id : null, [Validators.required]],
      // backup_schedule_id: [null, [Validators.required]],
      test_hours_start: [null, [Validators.required]],
      test_hours_finish: [null, [Validators.required]],
      date_test: [null, [Validators.required]],
      reason: ['', [Validators.required]],
    });
  }

  initAutoCompleteListener() {
    this.subs.sink = this.dateCtrl.valueChanges.pipe().subscribe((title) => {
      if (this.postponeForm.get('date_test') && !this.isWaitingForResponse) {
        this.postponeForm.get('date_test').setValue('');
        this.timeList = [];
        this.timeCtrl.setValue(null);
        this.postponeForm.get('test_hours_start').patchValue('');
        this.postponeForm.get('test_hours_finish').patchValue('');
      }
    });

    this.subs.sink = this.timeCtrl.valueChanges.pipe().subscribe((classData) => {
      if (this.postponeForm.get('test_hours_start') && !this.isWaitingForResponse) {
        this.postponeForm.get('test_hours_start').patchValue('');
        this.postponeForm.get('test_hours_finish').patchValue('');
      }
    });
  }

  selectDate(date: any) {
    if (date && date.timeslot && date.timeslot.length) {
      this.timeslots = date.timeslot;
    } else {
      this.timeslots = [];
    }
    this.postponeForm.get('test_hours_start').patchValue('');
    this.postponeForm.get('test_hours_finish').patchValue('');
    if (date && date.backup_schedule_id) {
      this.postponeForm.get('backup_schedule_id').patchValue(date.backup_schedule_id);
    }
    this.selectedDate = date.label;

  }

  selectTime(timeslot: any) {

    if (timeslot && timeslot.date_start) {
      this.postponeForm.get('date_test').patchValue(timeslot.date_start);
    }
    if (timeslot && timeslot.test_hours_start) {
      this.postponeForm.get('test_hours_start').patchValue(timeslot.test_hours_start);
    }
    if (timeslot && timeslot.test_hours_finish) {
      this.postponeForm.get('test_hours_finish').patchValue(timeslot.test_hours_finish);
    }
  }

  convertLocalDateToUTC(data) {

    const date = moment(data.date).format('DD/MM/YYYY');
    const time = data.time_start;

    const dateTimeInUTC = moment(date + time, 'DD/MM/YYYYHH:mm');

    return dateTimeInUTC.toISOString();
  }

  convertUTCToLocalDate(data) {
    const date = moment(data.date).format('DD/MM/YYYY');
    const time = data.time_start;

    const dateTimeInLocal = moment(date + time, 'DD/MM/YYYYHH:mm');
    return dateTimeInLocal.toISOString();
  }

  convertUTCToLocalDateFormatted(data) {
    const date = moment(data.date).format('DD/MM/YYYY');
    const time = data.time_start;

    const dateTimeInLocal = moment(date + time, 'DD/MM/YYYYHH:mm');
    return dateTimeInLocal.format('DD/MM/YYYY');
  }

  createPayload() {
    const tempPayload = _.cloneDeep(this.postponeForm.value);

    // Delete unused field
    if (tempPayload && tempPayload.test_group_id) {
      delete tempPayload.student_id
    } else {
      delete tempPayload.test_group_id
    }

    // Change time to UTC
    if (tempPayload) {
      if (tempPayload.date_test) {
        tempPayload.date_test = this.convertLocalDateToUTC({ date: tempPayload.date_test, time_start: tempPayload.test_hours_start });
      }
      if (tempPayload.test_hours_start) {
        tempPayload.test_hours_start = this.parseLocalToUTC.transform(tempPayload.test_hours_start);
      }
      if (tempPayload.test_hours_finish) {
        tempPayload.test_hours_finish = this.parseLocalToUTC.transform(tempPayload.test_hours_finish);
      }
    }
    return tempPayload;
  }

  saveForm() {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('Jury_S24.TITLE'),
      text: this.translate.instant('Jury_S24.TEXT', {
        date: this.selectedDate,
        time: `${this.postponeForm.get('test_hours_start').value} - ${this.postponeForm.get('test_hours_finish').value}`
      }),
      footer: `<span style="margin-left: auto">Jury_S24</span>`,
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant(
        'Jury_S24.BUTTON_YES'
      ),
      cancelButtonText: this.translate.instant(
        'Jury_S24.BUTTON_NO'
      ),
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const time = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText =
            this.translate.instant('Jury_S24.BUTTON_YES') + ` (${timeDisabled})`;
        }, 1000);

        setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant(
            'Jury_S24.BUTTON_YES'
          );
          Swal.enableConfirmButton();
          clearTimeout(time);
        }, timeDisabled * 1000);
      }
    }).then(result => {
      if (result.value) {
        const payload = this.createPayload();

        this.isWaitingForResponse = true;
        this.subs.sink = this.juryService.SavePostponeScheduleGlobal(payload).subscribe(resp => {
          this.isWaitingForResponse = false;

          if (resp) {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Jury_S24b.TITLE'),
              text: this.translate.instant('Jury_S24b.TEXT', {
                date: this.selectedDate,
                time: `${this.postponeForm.get('test_hours_start').value} - ${this.postponeForm.get('test_hours_finish').value}`
              }),
              footer: `<span style="margin-left: auto">Jury_S24b</span>`,
              confirmButtonText: this.translate.instant('Jury_S24b.BUTTON')
            }).then(() => {
              this.dialogRef.close(true);
            })
          }
          // else if(response.message && response.message === 'Time Slot Already Assigned To Other Student / Group') {
          //   swal({
          //     type: 'error',
          //     title: this.translate.instant('Jury_S25.TITLE'),
          //     text: this.translate.instant('Jury_S25.TEXT'),
          //     confirmButtonText: this.translate.instant('Jury_S25.BUTTON')
          //   })
          // }
        }, (err) => {
          this.isWaitingForResponse = false;
          if (err['message'] === 'GraphQL error: Time Slot Already Assigned To Other Student / Group') {
            Swal.fire({
              title: this.translate.instant('Jury_S25.TITLE'),
              html: this.translate.instant('Jury_S25.TEXT'),
              footer: `<span style="margin-left: auto">Jury_S25</span>`,
              type: 'error',
              showConfirmButton: true,
              confirmButtonText: this.translate.instant('Jury_S25.BUTTON'),
            });
          } else {
            Swal.fire({
              type: 'error',
              title: 'Error',
              text: err && err['message'] ? err['message'] : err,
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            });
          }
        })
      }
    })
  }

  cancel() {
    this.dialogRef.close(false);
  }


  // Start of functionality for global backup
  getDatesGlobalList() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.juryService.GetAllGlobalBackupScheduleDates(this.juryOrgId, this.select_from_current_president_of_jury, this.studentId, this.groupId).subscribe(resp => {
      this.isWaitingForResponse = false;

      if (resp && resp.length) {
        let dates = resp.map(date => {
          return {
            original_date: [date.date],
            date_start: this.convertUTCToLocalDate({ date: date.date, time_start: date.start_time }),
            label: this.convertUTCToLocalDateFormatted({ date: date.date, time_start: date.start_time }),
          }
        });

        dates = dates.filter((date) => date && date.original_date.length && date.original_date[0] && moment(date.original_date[0]).isSameOrAfter(new Date(), 'day'));

        const tempDates = [];
        dates.forEach(date => {
          const foundDates = tempDates.find(tempDate => tempDate.label === date.label);
          if (date && tempDates && foundDates) {
            // update the original date if there is same label
            foundDates.original_date = [...foundDates.original_date, ...date.original_date]
          } else {
            // push new date if not same label
            tempDates.push(date);
          }
        });


        this.dates = _.sortBy(_.cloneDeep(tempDates), 'date_start');
      } else {
        Swal.fire({
          type: 'error',
          title: this.translate.instant('JURY_S23_BACKUP.TITLE'),
          html: this.translate.instant('JURY_S23_BACKUP.TEXT'),
          footer: `<span style="margin-left: auto">JURY_S23_BACKUP</span>`,
          confirmButtonText: this.translate.instant('JURY_S23_BACKUP.BUTTON'),
        }).then(result => {
          this.dialogRef.close();
        })
      }

      this.dateList = _.cloneDeep(this.dates);
      this.filteredDate = this.dateCtrl.valueChanges.pipe(
        startWith(''),
        map((searchTxt) => {
          searchTxt = searchTxt ? searchTxt : '';
          return this.dateList.filter((sch) => sch.label.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()));
        }),
      );
    }, (err) => { this.isWaitingForResponse = false })
  }

  selectDateGlobal(date) {
    // if (date && date.timeslot && date.timeslot.length) {
    //   this.timeslots = date.timeslot;
    // } else {
    //   this.timeslots = [];
    // }
    // this.postponeForm.get('test_hours_start').patchValue('');
    // this.postponeForm.get('test_hours_finish').patchValue('');
    // if (date && date.backup_schedule_id) {
    //   this.postponeForm.get('backup_schedule_id').patchValue(date.backup_schedule_id);
    // }
    this.selectedDate = date.label;
    this.isWaitingForResponse = true;
    // this.postponeForm.get('date_test').patchValue(date.date_start);
    this.postponeForm.get('test_hours_start').patchValue('');
    this.postponeForm.get('test_hours_finish').patchValue('');
    this.subs.sink = this.juryService.GetAllGlobalBackupScheduleTimes(this.juryOrgId, date.original_date, this.select_from_current_president_of_jury, this.studentId, this.groupId).subscribe(resp => {
      this.isWaitingForResponse = false;

      if (resp && resp.length) {
        const timeslots = resp.map(time => {
          return {
            date_start: this.convertUTCToLocalDate({ date: time.date_test, time_start: time.start_hour }),
            label: this.convertUTCToLocalDateFormatted({ date: time.date_test, time_start: time.start_hour }),
            test_hours_start: this.parseUtcToLocal.transform(time.start_hour),
            test_hours_finish: this.parseUtcToLocal.transform(time.finish_hour),
            labeltime: this.parseUtcToLocal.transform(time.start_hour) + '-' + this.parseUtcToLocal.transform(time.finish_hour),
          }
        });
        this.timeslots = _.uniqBy(timeslots, 'labeltime')

      } else {
        this.timeslots = [];
      }

      this.timeList = _.cloneDeep(this.timeslots);
      this.filteredTime = this.timeCtrl.valueChanges.pipe(
        startWith(''),
        map((searchTxt) => {
          searchTxt = searchTxt ? searchTxt : '';
          return this.timeList.filter((sch) => sch.labeltime.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()));
        }),
      );
    })
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
