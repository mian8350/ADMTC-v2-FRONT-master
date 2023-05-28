import { AfterViewInit, Component, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { SubSink } from 'subsink';
import { FormBuilder, UntypedFormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { TranslateService } from '@ngx-translate/core';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { UserService } from 'app/service/user/user.service';
import * as _ from 'lodash';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { MailStudentDialogComponent } from 'app/students/mail-student-dialog/mail-student-dialog.component';

@Component({
  selector: 'ms-title-manager-follow-up-registration',
  templateUrl: './title-manager-follow-up-registration.component.html',
  styleUrls: ['./title-manager-follow-up-registration.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseLocalToUtcPipe],
})
export class TitleManagerFollowUpRegistrationComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  titleId: string;
  classId: string;
  displayedColumns: string[] = [
    'select',
    'name',
    'school',
    // 'studentStatus',
    // 'profileRate',
    // 'announcementCall',
    // 'announcementEmail',
    // 'downPayment',
    // 'registrationDate',
    // 'dueDate',
    'action',
  ];
  filterColumns: String[] = [
    'selectFilter',
    'lastNameFilter',
    'schoolFilter',
    // 'studentStatusFilter',
    // 'profileRateFilter',
    // 'announcementCallFilter',
    // 'announcementEmailFilter',
    // 'downPaymentFilter',
    // 'registrationDateFilter',
    // 'dueDateFilter',
    'actionFilter',
  ];
  dataSource = new MatTableDataSource([]);
  selection = new SelectionModel<any>(true, []);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  private subs = new SubSink();
  isReset: Boolean = false;
  dataLoaded: Boolean = false;
  isLoading: Boolean;
  isWaitingForResponse: Boolean;
  dataCount: number;
  noData: any;
  pageSelected = [];
  allStudentForCheckbox = [];
  dataSelected = [];
  listRegistrationProfile = [];
  isCheckedAll = false;
  sortValue = null;
  followUpData = [];
  admissionSteps = [];
  stepsForm = [];
  stepsMatrix = [];

  // ****** Form Control for filter
  lastNameFilter = new UntypedFormControl('');
  schoolFilter = new UntypedFormControl(null);
  studentStatusFilter = new UntypedFormControl('');
  profileRateFilter = new UntypedFormControl('');
  announcementCallFilter = new UntypedFormControl('');
  announcementEmailFilter = new UntypedFormControl('AllF');
  paymentFilter = new UntypedFormControl('AllM');
  registrationDateFilter = new UntypedFormControl(null);
  dueDateFilter = new UntypedFormControl(null);

  // ****** Array for filter dropdown
  schoolFilterList = [];
  profileRateFilterList = [];
  studentStatusFilterList = [
    { value: 'AllM', key: 'AllM' },
    { value: 'admission_in_progress', key: 'Admitted' },
    { value: 'bill_validated', key: 'Bill validated' },
    { value: 'engaged', key: 'Engaged' },
    { value: 'registered', key: 'Registered' },
    { value: 'resigned', key: 'Resigned' },
    { value: 'resigned_after_engaged', key: 'Resigned after engaged' },
    { value: 'resigned_after_registered', key: 'Resign after registered' },
    { value: 'report_inscription', key: 'Report Inscription +1' },
  ];
  announcementCallFilterList = [
    { value: 'AllF', key: 'AllF' },
    { value: 'done', key: 'Done' },
    { value: 'not_done', key: 'Not done' },
  ];
  announcementEmailFilterList = [
    { value: 'AllF', key: 'AllF' },
    { value: 'not_done', key: 'Not sent' },
    { value: 'today', key: 'Today' },
    { value: 'yesterday', key: 'Yesterday' },
    { value: 'last_7_days', key: 'Last 7 days' },
    { value: 'last_30_days', key: 'Last 30 days' },
    { value: 'this_month', key: 'This month' },
  ];
  DPFilterList = [
    { value: 'AllM', key: 'All' },
    { value: 'paid', key: 'Paid' },
    { value: 'not_paid', key: 'Not Paid' },
    { value: 'pending', key: 'Pending' },
    { value: 'rejected', key: 'Rejected' },
    { value: 'billed', key: 'Billed' },
    { value: 'not_billed', key: 'Not billed' },
    { value: 'partialy_paid', key: 'Partially paid' },
  ];

  stepFilterDropdown = [
    { value: '', key: 'AllM' },
    { value: 'accept', key: 'Completed' },
    { value: 'not_started', key: 'Not Done' },
    { value: 'ask_for_revision', key: 'Rejected By Validator' },
    { value: 'need_validation', key: 'Waiting For Validation' },
  ]

  // *** FILTER FORMS *********************************/
  filteredValues = {
    rncp_title_id: null,
    class_id: null,
    name: '',
    school_id: null,
    admission_status: null,
    steps: null,
  };

  mailStudentsDialog: MatDialogRef<MailStudentDialogComponent>;

  constructor(
    private route: ActivatedRoute,
    private rncpTitleService: RNCPTitlesService,
    private translate: TranslateService,
    private userService: UserService,
    private parseUtcToLocal: ParseUtcToLocalPipe,
    private parseLocalToUtc: ParseLocalToUtcPipe,
    private pageTitleService: PageTitleService,
    public dialog: MatDialog,
  ) { }

  
  ngOnInit() {
    this.titleId = this.route.snapshot.params['titleId'];
    this.classId = this.route.snapshot.params['classId'];
    this.filteredValues.rncp_title_id = this.titleId;
    this.filteredValues.class_id = this.classId;
    if (this.titleId && this.classId) {
      this.getFollowUpData()
    }
    this.getSchoolTableDropDown();
    this.initFilter();
  }
  
  ngOnChanges() {
  }
  
  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (this.dataLoaded) this.fetchAdmission();
        }),
      )
      .subscribe();
  }

  showOptions(info, row) {
  }

  // *** Get Current Follow Up Data to shape dynamic column *** //
  getFollowUpData() {
    this.isWaitingForResponse = true;
    const pagination = {
      limit: this.paginator && this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator && this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    const filter = _.cloneDeep(this.filteredValues);
    this.subs.sink = this.rncpTitleService.getAllStudentAdmissionProcesses(filter, this.sortValue, pagination).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        this.followUpData = _.cloneDeep(resp);
        // this.setPageTitle(this.followUpData);
        this.setPageTitle();


        this.checkAdmissionForm();

        // ASSIGN TO Setup Schedule Info
        if (resp && resp.length) {
          // set up steps for the dynamic columns
          this.admissionSteps = resp[0].form_builder_id.steps.map((step) => step._id);
          if (this.admissionSteps.length) {
            this.admissionSteps.forEach((step, index) => {
              this.stepsForm[`B${index}`] = '';
            });
          }

          this.setUpStepColumns(this.admissionSteps);
          this.fetchAdmission();
        }
      },
      (err) => {
        this.isWaitingForResponse = false;

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: 'OK',
        });
      },
    );
  }

  checkAdmissionForm() {
    this.subs.sink = this.rncpTitleService.getClassById(this.classId).subscribe((resp) => {
      if(resp && !resp.is_admission_enabled) {
        this.regFollowUpS1();
      }
    });
  }

  regFollowUpS1() {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('RegFollowUp_S1.TITLE'),
      text: this.translate.instant('RegFollowUp_S1.TEXT'),
      showConfirmButton: true,
      confirmButtonText: this.translate.instant('RegFollowUp_S1.BUTTON1'),
      allowOutsideClick: false,
    });
  }

  setPageTitle() {
    this.subs.sink = this.rncpTitleService.getOneTitleById(this.titleId).subscribe((data) => {
      const title = data.short_name;
      this.pageTitleService.setTitle(this.translate.instant('Follow_Up.Page Title', {title_name: title}));
      this.subs.sink = this.translate.onLangChange.subscribe(() => {
        this.pageTitleService.setTitle(this.translate.instant('Follow_Up.Page Title', {title_name: title}));
      })
    })
  }

  setUpStepColumns(steps: string[]) {
    steps.forEach((element, index) => {
      this.displayedColumns.splice(3 + index, 0, `S${index + 1}`);
      this.filterColumns.splice(3 + index, 0, `S${index + 1}_filter`);
    });
  }

  fetchAdmission() {
    this.isLoading = true;
    const pagination = {
      limit: this.paginator && this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator && this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    const filter = _.cloneDeep(this.filteredValues);
    this.subs.sink = this.rncpTitleService.getAllStudentAdmissionProcesses(filter, this.sortValue, pagination).   subscribe(
      (resp) => {
        this.isLoading = false;
        if (resp) {
          const formattedResp = _.cloneDeep(resp);
          this.formatDateResp(formattedResp);
          this.constructStepMatrix(formattedResp);
          this.dataSource.data = _.cloneDeep(formattedResp);
          this.dataCount = resp && resp.length ? resp[0].count_document : 0;
          this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
          this.dataLoaded = true;
        }
      },
      (error) => {
        this.isLoading = false;
      },
    );
  }

  // this function parses ISO date and time return from BE and convert it to local time from UTC
  formatDateResp(schedules) {
    for (const schedule of schedules) {
      if (schedule && schedule.signature_date) {
        schedule.signature_date = this.convertUTCToLocalDate(schedule.signature_date);
      }
    }
  }

  // used as reference to display true or false for each blocks cell in the dynamic block columns
  constructStepMatrix(resp) {
    resp.forEach((element, index) => {
      const boolArray: any[] = this.admissionSteps.map((step, index) => this.isStepChecked(element.steps, index));
      this.stepsMatrix[index] = boolArray;

    });
  }

  isStepChecked(elementSteps: any[], index: number) {
    if (!elementSteps || !elementSteps.length) {
      return false;
    }
    // get each steps ids
    const stepsIds = elementSteps.map((step) => step.form_builder_step._id);
    // check if the current admission step id is in the admission steps by getting index
    const isFoundIndex = stepsIds.indexOf(this.admissionSteps[index]);
    if (isFoundIndex >= 0 && elementSteps[isFoundIndex]) {
      return elementSteps[isFoundIndex];
    }
  }

  sortData(sort: Sort) {
    if (sort.active.split('-')[0] === 'step') {
      this.sortValue = { steps: { step_id: sort.active.split('-')[2], value: sort.direction ? sort.direction : `asc` }};
    } else {
      this.sortValue = sort.active ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    }
    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      this.fetchAdmission();
    }
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows || numSelected > numRows;
  }

  isSomeSelected() {
    return this.selection.selected.length > 0;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.dataSelected = [];
      this.pageSelected = [];
      this.isCheckedAll = false;
    } else {
      this.selection.clear();
      this.dataSelected = [];
      this.allStudentForCheckbox = [];
      this.isCheckedAll = true;
      // this.getDataAllForCheckbox(0);
    }
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  stepStatus(status) {
    switch(status) {
      case 'not_started':
        return 'red-icon'
      case 'accept':
        return 'green-icon'
      case 'need_validation':
        return 'orange-icon'
      case 'ask_for_revision':
        return 'red-icon'
      default:
        return ''
    }
  }

  getSchoolTableDropDown(){
    const school_type = 'preparation_center';
    this.subs.sink = this.rncpTitleService.getSchoolDropDown(this.titleId, this.classId, school_type).subscribe((resp) => {
      if(resp) {
        this.schoolFilterList = resp;
        this.schoolFilterList.sort((a: any, b: any) => a.short_name.localeCompare(b.short_name));

      }
    })
  }

  selectSchool() {
    this.filteredValues.school_id = this.schoolFilter.value ? this.schoolFilter.value : null;
    this.paginator.pageIndex = 0;
    this.fetchAdmission();
  }

  updateFilterStepValue(id:string, status: any) {


    let steps = this.filteredValues.steps ? [...this.filteredValues.steps] : [];
    const indexOfStep = steps.findIndex((step) => step && step.step_id && step.step_id === id);

    if(indexOfStep >= 0) {
      steps.splice(indexOfStep, 1)
    }

    if(status && status !== '') {
      steps.push({
        step_id: id,
        value: status
      })
    }
    this.filteredValues.steps = steps;
    this.fetchAdmission();
  }

  initFilter(){
    this.subs.sink = this.lastNameFilter.valueChanges.pipe(debounceTime(400)).subscribe((name) => {
      this.paginator.pageIndex = 0;
      this.filteredValues.name = name;
      this.fetchAdmission();
    })
  }

  // RESET
  reset() {
    this.dataLoaded = false;
    this.selection.clear();
    this.isCheckedAll = false;
    this.paginator.pageIndex = 0;
    this.filteredValues = {
      rncp_title_id: this.titleId,
      class_id: this.classId,
      name: '',
      school_id: null,
      admission_status: null,
      steps: null,
    };

    // clear all forms in blockForms
    for (const key of Object.keys(this.stepsForm)) {
      this.stepsForm[key] = '';
    }

    this.sortValue = null;
    this.lastNameFilter = new UntypedFormControl('');
    this.schoolFilter = new UntypedFormControl(null);
    this.studentStatusFilter = new UntypedFormControl('');
    this.profileRateFilter = new UntypedFormControl('');
    this.announcementCallFilter = new UntypedFormControl('');
    this.announcementEmailFilter = new UntypedFormControl('AllF');
    this.paymentFilter = new UntypedFormControl('AllM');
    this.registrationDateFilter = new UntypedFormControl(null);
    this.dueDateFilter = new UntypedFormControl(null);

    this.fetchAdmission();
  }

  goToStudentCard(student) {
    window.open(
      `./school/${student.school_id._id}?title=${this.titleId}&class=${this.classId}&student=${student.student_id._id}&open=student-cards`,
      '_blank',
    );
  }

  sendMail(data) {
    const dataMail = {
      _id: data.student_id._id,
      civility: data.student_id.civility,
      first_name: data.student_id.first_name,
      last_name: data.student_id.last_name,
      email: data.student_id.email,
      rncp_title: {
        _id: data.rncp_title_id._id,
        short_name: data.rncp_title_id.short_name,
      }
    }
    this.mailStudentsDialog = this.dialog.open(MailStudentDialogComponent, {
      disableClose: true,
      width: '750px',
      data: dataMail,
    });
  }

  convertUTCToLocalDate(data) {
    const date = moment(data.date).format('DD/MM/YYYY');
    const time = data.time;

    const dateTimeInLocal = moment(date + time, 'DD/MM/YYYYHH:mm').local();
    return dateTimeInLocal.format('DD/MM/YYYY');
  }
  
  ngOnDestroy() {
    this.subs.unsubscribe()
  }
}
