import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { JuryOrganizationParameter } from 'app/title-rncp/conditions/jury-organization-parameter/jury-organization-parameter.model';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import { MyErrorStateMatcher } from 'app/service/customvalidator.validator';
import { startWith, tap } from 'rxjs/operators';

@Component({
  selector: 'ms-assign-number-jury-main-schedule',
  templateUrl: './assign-number-jury-main-schedule.component.html',
  styleUrls: ['./assign-number-jury-main-schedule.component.scss'],
  providers: [ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class AssignNumberJuryMainScheduleComponent implements OnInit {
  private subs = new SubSink();

  @Input() juryOrgData: JuryOrganizationParameter;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<any>;
  @ViewChild('f', { static: false }) form: any;

  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['startDate', 'startTime', 'breakTime', 'breakDuration', 'numberOfStudent', 'endTime'];

  numberOfJury = new UntypedFormControl(0);
  dummyFormArray: UntypedFormArray;
  isGroupTest: boolean;
  isJuryParamSet: boolean;

  juryOrgId;
  schoolId;
  rncpId;
  classId;
  testId;

  schoolData;

  studentLeft = 0;
  studentAllowed = 0;
  initialJuryDataHolder = [];
  juryDataHolder = [];
  isLoading = false;

  matcher = new MyErrorStateMatcher();

  minDate: Date;
  countDocument: number;

  constructor(
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private juryService: JuryOrganizationService,
    private parseLocalToUTC: ParseLocalToUtcPipe,
    private parseUTCToLocal: ParseUtcToLocalPipe,
    private translate: TranslateService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.dummyFormArray = this.fb.array([]);
    this.juryOrgId = this.route.snapshot.paramMap.get('juryOrgId');
    this.schoolId = this.route.snapshot.paramMap.get('schoolId');
    this.rncpId = this.route.snapshot.paramMap.get('rncpId');
    this.classId = this.route.snapshot.paramMap.get('classId');

    this.getSchoolData();
    // this.getJuryGroupData();
    this.checkJuryParam(this.rncpId, this.classId);
    // this.dataSource.data = [1, 2, 3, 1, 2];
    this.getOneJuryOrganization();
    this.numberOfJury.disable();

    this.minDate = new Date();
  }

  getOneJuryOrganization() {
    // this.isLoading = true;
    this.subs.sink = this.juryService.getOneJuryOrganizationForMainSchedule(this.juryOrgId).subscribe(
      (resp) => {
        // this.isLoading = false;
        this.juryOrgData = _.cloneDeep(resp);

        // this.getJuryGroupData();
      },
      (err) => {
        // this.isLoading = false;

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: 'OK',
        });
      },
    );
  }

  getSchoolData() {
    this.subs.sink = this.juryService.findSchoolOnjuryOrganization(this.juryOrgId, this.rncpId, this.schoolId).subscribe((resp) => {
      const response = _.cloneDeep(resp);
      response.schools = response.schools && response.schools[0] ? response.schools[0] : null;
      this.isGroupTest = response.test_id && response.test_id.group_test ? response.test_id.group_test : false;
      this.testId = response.test_id && response.test_id._id ? response.test_id._id : null;

      this.schoolData = response;


      if (!this.isGroupTest) {
        this.studentLeft =
          this.schoolData && this.schoolData.schools && this.schoolData.schools.students && this.schoolData.schools.students.length
            ? this.schoolData.schools.students.length
            : 0;
        this.studentAllowed =
          this.schoolData && this.schoolData.schools && this.schoolData.schools.students && this.schoolData.schools.students.length
            ? this.schoolData.schools.students.length
            : 0;
      } else {
        this.studentLeft =
          this.schoolData && this.schoolData.schools && this.schoolData.schools.test_groups && this.schoolData.schools.test_groups.length
            ? this.schoolData.schools.test_groups.length
            : 0;
        this.studentAllowed =
          this.schoolData && this.schoolData.schools && this.schoolData.schools.test_groups && this.schoolData.schools.test_groups.length
            ? this.schoolData.schools.test_groups.length
            : 0;
      }

      this.getJuryGroupData();

    });
  }

  ngAfterViewInit() {

    // this.subs.sink = this.paginator.page
    //   .pipe(
    //     startWith(null),
    //     tap(() => {
    //       this.getJuryGroupData();
    //     }),
    //   )
    //   .subscribe();
  }

  getJuryGroupData() {
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };



    this.subs.sink = this.juryService
      .getJuryNumberEachSchool(this.juryOrgId, this.rncpId, this.classId, this.schoolId)
      .subscribe((resp) => {
        const respData = _.cloneDeep(resp);


        if (respData && respData.length) {
          this.countDocument = respData.length
          this.numberOfJury.setValue(this.countDocument);
          // this.setTableRow();

          if (this.numberOfJury.value > 0) {

            
            respData.forEach((juryMember) => {
              this.juryDataHolder.push({
                number_students: juryMember.number_students,
                end_time: this.parseUTCToLocal.transform(juryMember['end_time']),
                start_time: this.parseUTCToLocal.transform(juryMember['start_time']),
                date_start: this.convertUTCToLocalDate({ date: juryMember['date_start'], time_start: juryMember['start_time'] }),
                break_time: this.parseUTCToLocal.transform(juryMember['break_time']),
                break_duration: juryMember['break_duration'],
                tempDate: this.convertUTCToLocalDate({ date: juryMember['date_start'], time_start: juryMember['start_time'] }),
                test_id: juryMember.test_id && juryMember.test_id._id ? juryMember.test_id._id : this.testId,
              });
            });
          }

          this.dataSource.data = _.cloneDeep(this.juryDataHolder);
          this.dataSource.paginator = this.paginator 
          this.initialJuryDataHolder = _.cloneDeep(this.juryDataHolder);
          this.table.renderRows();
        }
      });
  }

  isDataChanged(): boolean {
    let isChanged = false;
    const oldData = JSON.stringify(this.initialJuryDataHolder);
    const currentData = JSON.stringify(this.juryDataHolder);
    if (oldData !== currentData) {
      isChanged = true;
    }
    return isChanged;
  }

  checkJuryParam(titleId: string, classId: string) {
    this.subs.sink = this.juryService.getJuryOrganizationParameter(titleId, classId).subscribe((resp) => {

      if (resp && resp.standard_duration) {
        this.isJuryParamSet = true;
        this.numberOfJury.enable();
      } else {
        this.isJuryParamSet = false;
        this.numberOfJury.disable();
      }
    });
  }

  countNumberStudent(): number {
    this.studentLeft = 0;
    for (const hold of this.juryDataHolder) {
      this.studentLeft += hold.number_students;
    }
    return this.studentLeft;
  }

  isStudentExceeded(): boolean {
    let result = false;
    const selectedStudent = this.countNumberStudent();
    let totalStudents = 0;

    if (this.schoolData) {
      if (this.isGroupTest) {
        totalStudents = this.schoolData.schools.test_groups.length;
      } else {
        totalStudents = this.schoolData.schools.students.length;
      }
    }

    if (selectedStudent > totalStudents) {
      result = true;
    }

    return result;
  }

  // ************************** dummy function as example *****************
  setTableRow() {
    this.generateForm();
    this.table.renderRows();
  }

  generateForm() {
    if (this.juryDataHolder.length > this.numberOfJury.value) {
      while (this.juryDataHolder.length > this.numberOfJury.value) {
        this.juryDataHolder.pop();
      }
    } else if (this.juryDataHolder.length < this.numberOfJury.value) {
      while (this.juryDataHolder.length < this.numberOfJury.value) {
        this.juryDataHolder.push({
          break_duration: 60,
          break_time: '12:00',
          date_start: '',
          number_students: null,
          start_time: '09:00',
          end_time: '',
          tempDate: '',
          test_id: this.testId,
        });
      }
    }
    this.countDocument = this.numberOfJury.value
    this.dataSource.data = this.juryDataHolder
    this.dataSource.paginator = this.paginator

  }

  countEndDate(index: number) {



    if (
      this.juryDataHolder[index].number_students &&
      this.juryDataHolder[index].start_time &&
      this.juryDataHolder[index].break_duration >= 0
    ) {
      this.juryDataHolder[index].break_duration = Math.abs(this.juryDataHolder[index].break_duration);
      const payload = {
        rncp_title_id: this.rncpId,
        class_id: this.classId,
        number_student: this.juryDataHolder[index].number_students,
        break_duration: this.juryDataHolder[index].break_duration,
        start_time: this.juryDataHolder[index].start_time,
      };

      this.subs.sink = this.juryService.countEndate(payload).subscribe((resp) => {

        if (resp) {
          this.juryDataHolder[index].end_time = resp ? resp : '';
        }
      });
    }
  }

  updateStudentLeft(index: number) {

    this.countEndDate(index);
    this.countNumberStudent();
  }

  saveForm() {
    const tempPayload = _.cloneDeep(this.juryDataHolder);
    tempPayload.forEach((data) => {
      data.date_start = this.convertLocalDateToUTC({ date: data.tempDate, time_start: data.start_time });
      data.start_time = this.parseLocalToUTC.transform(data.start_time);
      data.end_time = this.parseLocalToUTC.transform(data.end_time);
      data.break_time = this.parseLocalToUTC.transform(data.break_time);
      delete data.tempDate;
      // *************** Delete test id if null on 136 grand oral
      if (data && !data.test_id) {
        delete data.test_id;
      }
    });
    const payload = {
      jury_id: this.juryOrgId,
      rncp_title_id: this.rncpId,
      class_id: this.classId,
      school_id: this.schoolId,
      number_of_jury: this.numberOfJury.value,
      jury_members_input: tempPayload,
    };

    this.subs.sink = this.juryService
      .saveMainSchedule(payload.jury_id, payload.rncp_title_id, payload.class_id, payload.school_id, payload.number_of_jury, tempPayload)
      .subscribe((resp) => {

        if (resp) {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('JURY_PARAM_S22.TITLE'),
            text: this.translate.instant('JURY_PARAM_S22.TEXT'),
            footer: `<span style="margin-left: auto">JURY_PARAM_S22</span>`,
            confirmButtonText: this.translate.instant('JURY_PARAM_S22.BUTTON'),
          }).then((result) => {
            this.initialJuryDataHolder = _.cloneDeep(this.juryDataHolder);
            this.redirectBack();
          });
        }
      });
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

  checkIsFormInvalid() {
    if (this.form && this.form.valid) {
      return false;
    } else {
      return true;
    }
  }

  isNumberStudentValid(): number {
    this.studentLeft = 0;
    for (const hold of this.juryDataHolder) {
      this.studentLeft += hold.number_students;
    }
    let result;

    if (this.schoolData) {
      if (this.isGroupTest) {
        result = this.schoolData.schools.test_groups.length - this.studentLeft;
        return result;
      } else {
        result = this.schoolData.schools.students.length - this.studentLeft;
        return result;
      }
    }
    result = -1;
    return result;
  }

  totalStudentSelected(): number {
    let studentSelected = 0;
    for (const hold of this.juryDataHolder) {
      studentSelected += hold.number_students;
    }

    return this.studentAllowed - studentSelected;
  }

  updateTime(index: number) {

    this.countEndDate(index);
    this.checkBreakTime(index);
  }

  checkBreakTime(index: number) {
    const breakTime = this.juryDataHolder[index].break_time ? moment(this.juryDataHolder[index].break_time, 'HH:mm') : null;
    const startTime = this.juryDataHolder[index].start_time ? moment(this.juryDataHolder[index].start_time, 'HH:mm') : null;


    if (breakTime && startTime && breakTime.isBefore(startTime)) {
      this.juryDataHolder[index].break_time = '';
      this.form.control.markAsTouched();
      this.form.control.markAsDirty();
      Swal.fire({
        type: 'error',
        title: this.translate.instant('JURY_S22.TITLE'),
        html: this.translate.instant('JURY_S22.TEXT'),
        footer: `<span style="margin-left: auto">JURY_S22</span>`,
        confirmButtonText: this.translate.instant('JURY_S22.BUTTON'),
      });
    }
  }

  redirectBack() {
    if (this.isDataChanged()) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('TMTC_S01.TITLE'),
        text: this.translate.instant('TMTC_S01.TEXT'),
        footer: `<span style="margin-left: auto">TMTC_S01</span>`,
        confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.value) {
        } else {
          this.router.navigate(['jury-organization', this.juryOrgId, 'organize-juries', 'assign-jury']);
        }
      });
    } else {
      this.router.navigate(['jury-organization', this.juryOrgId, 'organize-juries', 'assign-jury']);
    }
  }

  getCurrentUrl() {
    return this.router.url;
  }

  //navigate when the red box warning is clicked
  onNoJuryParamSetWarningClick() {
    this.router.navigate(['title-rncp/details/', this.schoolData.rncp_id._id], {
      queryParams: {
        classId: this.schoolData.class_id._id,
        navigatedFrom: this.router.url,
      },
    });
  }
}
