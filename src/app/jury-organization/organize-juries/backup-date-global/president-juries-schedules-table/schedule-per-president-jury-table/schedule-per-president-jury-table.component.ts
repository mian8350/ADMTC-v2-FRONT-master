import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormArray } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { MyErrorStateMatcher } from 'app/service/customvalidator.validator';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
  selector: 'ms-schedule-per-president-jury-table',
  templateUrl: './schedule-per-president-jury-table.component.html',
  styleUrls: ['./schedule-per-president-jury-table.component.scss'],
  providers: [ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class SchedulePerPresidentJuryTableComponent implements OnInit, OnChanges, OnDestroy {
  @Input() juryOrgId;
  @Input() presidentId;
  @Input() globalBackupId;
  @Output() updateSaved = new EventEmitter<boolean>();

  private subs = new SubSink();
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<any>;
  @ViewChild('f', { static: false }) form: any;

  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['startDate', 'startTime', 'breakTime', 'breakDuration', 'numberOfSession', 'endTime', 'action'];

  dummyFormArray: UntypedFormArray;

  initialJuryDataHolder = [];
  juryDataHolder = [];

  matcher = new MyErrorStateMatcher();

  minDate = new Date();

  isWaitingForResponse = false;

  juryOrgData;
  presidentData;
  datesData;

  dataCount: number;

  constructor(
    private juryOrganizationService: JuryOrganizationService,
    private parseLocalToUTC: ParseLocalToUtcPipe,
    private parseUTCToLocal: ParseUtcToLocalPipe,
    private translate: TranslateService,
  ) {}

  ngOnInit() {}

  ngOnChanges() {
    this.paginator.pageIndex = 0;
    this.juryDataHolder = [];
    this.dataSource.data = this.juryDataHolder;
    this.dataSource.paginator = this.paginator;
    this.dataCount = this.juryDataHolder.length;
    // this.table.renderRows();
    this.GetJuryOrgData();
    this.GetPresidentJuryBackupSchedule();
  }

  GetJuryOrgData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.juryOrganizationService.getTitleClassOfJuryOrganization(this.juryOrgId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;

        this.juryOrgData = resp;
      },
      (err) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  GetPresidentJuryBackupSchedule() {
    this.isWaitingForResponse = true;
    this.updateSaved.emit(false);
    this.subs.sink = this.juryOrganizationService.getBackupScheduleOfPresidentJury(this.juryOrgId, this.presidentId).subscribe(
      (resp) => {

        this.isWaitingForResponse = false;
        if (resp) {
          this.presidentData = resp.president_of_jury_id;
          this.datesData = resp.dates;

          const respData = _.cloneDeep(this.datesData);


          if (respData && respData.length) {
            respData.forEach((juryMember) => {
              this.juryDataHolder.push({
                start_date: this.convertUTCToLocalDate({ date: juryMember['start_date'], time_start: juryMember['start_hour'] }),
                start_hour: this.parseUTCToLocal.transform(juryMember['start_hour']),
                break_time: this.parseUTCToLocal.transform(juryMember['break_time']),
                break_duration: juryMember['break_duration'],
                number_of_session: juryMember.number_of_session,
                finish_hour: this.parseUTCToLocal.transform(juryMember['finish_hour']),
                tempDate: this.convertUTCToLocalDate({ date: juryMember['start_date'], time_start: juryMember['start_hour'] }),
                isDatePassed: this.validateDate(this.convertUTCToLocalDate({ date: juryMember['start_date'], time_start: juryMember['start_hour']})),
              });
            });
            this.dataSource.data = _.cloneDeep(this.juryDataHolder);
            this.dataCount = this.juryDataHolder.length;
            this.dataSource.paginator = this.paginator;
            this.initialJuryDataHolder = _.cloneDeep(this.juryDataHolder);
            // this.table.renderRows();
          }
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  addDate() {
    this.juryDataHolder.push({
      start_date: '',
      start_hour: '09:00',
      break_time: '12:00',
      break_duration: 60,
      number_of_session: null,
      finish_hour: '',
      tempDate: '',
      isDatePassed: false,
      // test_id: this.testId,
    });
    // this.table.renderRows();
    this.dataSource.data = this.juryDataHolder;
    this.dataSource.paginator = this.paginator;
    this.dataCount = this.juryDataHolder.length;
  }

  deleteDate(index) {
    this.juryDataHolder.splice(index, 1);
    // this.table.renderRows();
    this.dataSource.data = this.juryDataHolder;
    this.dataSource.paginator = this.paginator;
    this.dataCount = this.juryDataHolder.length;
  }

  checkComparison() {
    let dataTable = _.cloneDeep(this.juryDataHolder);
    delete dataTable.tempDate;
    delete dataTable.isDatePassed;
    dataTable = dataTable.map((res) => {
      return {
        start_date: this.convertLocalDateToUTC({ date: res['start_date'], time_start: res['start_hour'] }),
        start_hour: this.parseLocalToUTC.transform(res['start_hour']),
        break_time: this.parseLocalToUTC.transform(res['break_time']),
        break_duration: res['break_duration'],
        number_of_session: res.number_of_session,
        finish_hour: this.parseLocalToUTC.transform(res['finish_hour']),
      };
    });
    const savedData = JSON.stringify(dataTable);
    const updateForm = JSON.stringify(this.datesData);

    if (savedData === updateForm) {
      return true;
    } else {
      return false;
    }
  }

  checkIsFormInvalid() {
    if (this.form && !this.form.invalid) {
      return false;
    } else {
      return true;
    }
  }

  updateTime(index: number) {

    this.countEndDate(index);
    this.checkBreakTime(index);
  }

  checkBreakTime(index: number) {
    const breakTime = this.juryDataHolder[index].break_time ? moment(this.juryDataHolder[index].break_time, 'HH:mm') : null;
    const startTime = this.juryDataHolder[index].start_hour ? moment(this.juryDataHolder[index].start_hour, 'HH:mm') : null;

    if (breakTime && startTime && breakTime.isBefore(startTime)) {
      this.juryDataHolder[index].break_time = '';
      this.form.control.markAsTouched();
      this.form.control.markAsDirty();
      Swal.fire({
        type: 'error',
        title: this.translate.instant('JURY_S22.TITLE'),
        html: this.translate.instant('JURY_S22.TEXT'),
        confirmButtonText: this.translate.instant('JURY_S22.BUTTON'),
        footer: `<span style="margin-left: auto">JURY_S22</span>`
      });
    }
  }

  countEndDate(index: number) {




    const titleId =
      this.juryOrgData && this.juryOrgData.rncp_titles && this.juryOrgData.rncp_titles[0] && this.juryOrgData.rncp_titles[0].rncp_id
        ? this.juryOrgData.rncp_titles[0].rncp_id._id
        : null;
    const classId =
      this.juryOrgData && this.juryOrgData.rncp_titles && this.juryOrgData.rncp_titles[0] && this.juryOrgData.rncp_titles[0].class_id
        ? this.juryOrgData.rncp_titles[0].class_id._id
        : null;

    if (
      this.juryDataHolder[index].number_of_session &&
      this.juryDataHolder[index].start_hour &&
      this.juryDataHolder[index].break_duration >= 0
    ) {
      this.juryDataHolder[index].break_duration = Math.abs(this.juryDataHolder[index].break_duration);
      const payload = {
        rncp_title_id: titleId,
        class_id: classId,
        number_student: this.juryDataHolder[index].number_of_session,
        break_duration: this.juryDataHolder[index].break_duration,
        start_time: this.juryDataHolder[index].start_hour,
      };

      this.subs.sink = this.juryOrganizationService.countEndate(payload).subscribe((resp) => {

        if (resp) {
          this.juryDataHolder[index].finish_hour = resp ? resp : '';
        }
      });
    }
  }

  saveForm() {
    const tempPayload = _.cloneDeep(this.juryDataHolder);
    tempPayload.forEach((data) => {
      data.start_date = this.convertLocalDateToUTC({ date: data.tempDate, time_start: data.start_hour });
      data.start_hour = this.parseLocalToUTC.transform(data.start_hour);
      data.finish_hour = this.parseLocalToUTC.transform(data.finish_hour);
      data.break_time = this.parseLocalToUTC.transform(data.break_time);
      delete data.tempDate;
      delete data.isDatePassed;
      // *************** Delete test id if null on 136 grand oral
      if (data && !data.test_id) {
        delete data.test_id;
      }
    });



    const payload = {
      global_backup_id: this.globalBackupId,
      president_of_jury_id: this.presidentId,
      jury_members_input: tempPayload,
    };



    this.subs.sink = this.juryOrganizationService
      .savePresidentBackupSchedule(payload.global_backup_id, payload.president_of_jury_id, tempPayload)
      .subscribe((resp) => {

        this.updateSaved.emit(true);
        Swal.fire({
          type: 'success',
          title: this.translate.instant('JURY_PARAM_S22.TITLE'),
          text: this.translate.instant('JURY_PARAM_S22.TEXT'),
          confirmButtonText: this.translate.instant('JURY_PARAM_S22.BUTTON'),
          footer: `<span style="margin-left: auto">JURY_PARAM_S22</span>`
        }).then(() => {
          this.juryDataHolder = [];
          this.dataSource.data = this.juryDataHolder;
          this.dataSource.paginator = this.paginator;
          this.dataCount = this.juryDataHolder.length;
          this.GetJuryOrgData();
          this.GetPresidentJuryBackupSchedule();
        });
      });

    // this.subs.sink = this.juryOrganizationService
    //   .savePresidentBackupSchedule(null, null, tempPayload)
    //   .subscribe((resp) => {

    //     if (resp) {
    //       Swal.fire({
    //         type: 'success',
    //         title: this.translate.instant('JURY_PARAM_S22.TITLE'),
    //         text: this.translate.instant('JURY_PARAM_S22.TEXT'),
    //         confirmButtonText: this.translate.instant('JURY_PARAM_S22.BUTTON'),
    //       }).then((result) => {
    //         // this.redirectBack();
    //       });
    //     }
    //   });
  }

  convertUTCToLocalDate(data) {

    const date = moment(data.date).format('DD/MM/YYYY');
    const time = data.time_start;

    const dateTimeInLocal = moment(date + time, 'DD/MM/YYYYHH:mm');


    return dateTimeInLocal.toISOString();
  }

  convertLocalDateToUTC(data) {

    const date = moment(data.date).format('DD/MM/YYYY');
    const time = data.time_start;

    const dateTimeInUTC = moment(date + time, 'DD/MM/YYYYHH:mm');

    return dateTimeInUTC.toISOString();
  }

  validateDate(date) {
    let result = false;
    if (date && moment(date).isBefore(new Date(), 'day')) {
      result = true;
    }
    return result;


    // if (this.juryDataHolder[dateIndex]['tempDate'] && moment(this.juryDataHolder[dateIndex]['tempDate']).isBefore(this.minDate)) {
    //   this.juryDataHolder[dateIndex]['tempDate'] = null;
    //   Swal.fire({
    //     type: 'error',
    //     title: this.translate.instant('Error'),
    //     text: this.translate.instant('Cannot select past date')
    //   })
    // }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
