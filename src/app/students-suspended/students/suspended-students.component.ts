import { DomSanitizer } from '@angular/platform-browser';
import { Observable } from 'rxjs';
import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { StudentsService } from '../../service/students/students.service';
import { SubSink } from 'subsink';
import { UntypedFormControl } from '@angular/forms';
import * as _ from 'lodash';
import swal from 'sweetalert2';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { startWith, map, debounceTime, tap } from 'rxjs/operators';
import { StudentTableData } from 'app/students/student.model';
import { UtilityService } from 'app/service/utility/utility.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { NgxPermissionsService } from 'ngx-permissions';
import Swal from 'sweetalert2';
import { Router } from '@angular/router';
import { UsersService } from 'app/service/users/users.service';
import { UserService } from 'app/service/user/user.service';
import * as moment from 'moment';
import { ExportCsvService } from 'app/service/export-csv/export-csv.service';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { SchoolService } from 'app/service/schools/school.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { MailStudentDialogComponent } from 'app/students/mail-student-dialog/mail-student-dialog.component';
import { ExportEsCsvDialogComponent } from 'app/students/export-es-csv-dialog/export-es-csv-dialog.component';
import { SchoolStudentDeactivatedDialogComponent } from 'app/school/school-student-deactivated/school-student-deactivated-dialog/school-student-deactivated-dialog.component';
import { ResignationReasonDialogComponent } from 'app/students/resignation-reason-dialog/resignation-reason-dialog.component';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { IncorrectUsersEmailDialogComponent } from 'app/shared/components/incorrect-users-email-dialog/incorrect-users-email-dialog.component';
import { environment } from 'environments/environment';
import { PageTitleService } from 'app/core/page-title/page-title.service';

@Component({
  selector: 'ms-suspended-students',
  templateUrl: './suspended-students.component.html',
  styleUrls: ['./suspended-students.component.scss'],
  providers: [ParseStringDatePipe],
})
export class SuspendedStudentsComponent implements OnInit, OnDestroy, AfterViewInit {
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  displayedColumns: string[] = [
    'select',
    'last_name',
    'jobDescription',
    'problematic',
    'mentor',
    'empSurvey',
    'is_thumbups_green',
    'certifier',
    'school',
    'rncp_title',
    'class',
    'registration_status',
    'status',
    'action',
  ];
  filterColumns: string[] = [
    'selectFilter',
    'lastNameFilter',
    'jobFilter',
    'probFilter',
    'mentorFilter',
    'empSurveyFilter',
    'transcriptFilter',
    'certifierFilter',
    'schoolFilter',
    'titleFilter',
    'classFilter',
    'registrationFilter',
    'statusFilter',
    'actionFilter',
  ];
  transcripList = [
    {
      value: 'AllM',
      name: 'All',
    },
    {
      value: true,
      name: 'OK',
    },
    {
      value: false,
      name: 'NOT_OK',
    },
  ];
  maleStudentIcon = '../../../../../assets/img/student_icon.png';
  femaleStudentIcon = '../../../../../assets/img/student_icon_fem.png';
  schoolDeactivateStudentDialog: MatDialogRef<SchoolStudentDeactivatedDialogComponent>;
  dataSource = new MatTableDataSource([]);
  selection = new SelectionModel<any>(true, []);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  private subs = new SubSink();
  noData: any;
  currentUser: any;
  isWaitingForResponse = false;
  isCheckedAll = false;
  // Preparation for Filters : List of filters data + Filters ID, need to implement the english translation to it, FR works !
  // No Filter Function implemented for the moment / Only Statik

  isSendVerification = false;
  isUserCertifier = false;
  disabledExport = true;
  isUserCertifierDir = false;
  isUserMentor = false;
  isUserADMTC = false;
  disabledVerification = true;
  userForExport: any[];
  allStudentForExport = [];

  lastNameFilter = new UntypedFormControl('');
  statusFilter = new UntypedFormControl('AllM');
  titleStatusFilter = new UntypedFormControl('AllM');
  jobFilter = new UntypedFormControl('AllF');
  probFilter = new UntypedFormControl('AllF');
  mentorFilter = new UntypedFormControl('AllM');
  empSurveyFilter = new UntypedFormControl('AllF');
  transcriptFilter = new UntypedFormControl('AllM');
  certifierFilter = new UntypedFormControl('AllM');
  schoolFilter = new UntypedFormControl('');
  schoolFilterList = [];
  filteredSchools: Observable<any[]>;
  userTypeFilter = new UntypedFormControl('AllM');
  userTypeFilterList = ['AllM'];
  entityFilter = new UntypedFormControl('AllM');
  entityFilterList = ['AllM'];
  titleFilter = new UntypedFormControl('');
  titleFilterList = [];
  filteredTitles: Observable<any[]>;
  statusFilterList = [
    { key: 'AllM', value: 'AllM' },
    { key: 'Registered', value: 'active' },
    { key: 'Pending', value: 'pending' },
    { key: 'Incorrect Email', value: 'incorrect_email' },
  ];
  titleStatusFilterList = [
    { key: 'AllM', value: 'AllM' },
    { key: 'suspended', value: 'suspended' },
  ];
  jobFilterList = [
    { key: 'AllF', value: 'AllF' },
    { key: 'Initial', value: 'initial' },
    { key: 'JOB_STATUS.Sent to Student', value: 'sent_to_student' },
    { key: 'JOB_STATUS.Sent to Mentor', value: 'sent_to_mentor' },
    { key: 'JOB_STATUS.Sent to School', value: 'sent_to_school' },
    // { key: 'JOB_STATUS.Validated by Mentor', value: 'validated_by_mentor' },
    { key: 'JOB_STATUS.Rejected by Academic Dpt', value: 'rejected_by_acad_dir' },
    { key: 'JOB_STATUS.Validated by Academic Dpt', value: 'validated_by_acad_staff' },
    { key: 'JOB_STATUS.Expedite by Acad Staff', value: 'expedite_by_acad_staff' },
    { key: 'JOB_STATUS.Expedite by Acad Staff Student', value: 'expedite_by_acad_staff_student' },
  ];

  probFilterList = [
    { key: 'AllF', value: 'AllF' },
    { key: 'Sent to Student', value: 'sent_to_student' },
    { key: 'Sent to Acad. Dpt', value: 'sent_to_acadDpt' },
    { key: 'Rejected by Acad Dpt', value: 'rejected_by_acadDpt' },
    { key: 'Validated by Acad. Dpt', value: 'validated_by_acadDpt' },
    { key: 'Sent to Certifier', value: 'sent_to_certifier' },
    { key: 'Rejected by Certifier', value: 'rejected_by_certifier' },
    { key: 'Validated by Certifier', value: 'validated_by_certifier' },
    { key: 'resubmitted_to_certifier', value: 'resubmitted_to_certifier' },
    { key: 'resubmitted_to_acadDpt', value: 'resubmitted_to_acadDpt' },
  ];

  mentorFilterList = [
    { key: 'AllM', value: 'AllM' },
    { key: 'Initial', value: 'initial' },
    { key: 'Sent to Mentor', value: 'sent_to_mentor' },
    { key: 'Filled by Mentor', value: 'filled_by_mentor' },
    { key: 'Validated by Acad Staff', value: 'validated_by_acad_staff' },
    { key: 'Expedited by Acad Staff', value: 'expedited_by_acad_staff' },
  ];

  empSurveyFilterList = [
    { key: 'AllF', value: 'AllF' },
    { key: 'not_sent', value: 'not_sent' },
    { key: 'Sent To Student', value: 'sent_to_student' },
    { key: 'Completed By Student', value: 'completed_by_student' },
    { key: 'Rejected By Validator', value: 'rejected_by_validator' },
    { key: 'Validated By Validator', value: 'validated_by_validator' },
  ];

  certifierFilterList = [
    { key: 'AllM', value: 'AllM' },
    { key: 'Passed', value: 'pass' },
    { key: 'Failed', value: 'failed' },
    { key: 'Eliminated', value: 'eliminated' },
    { key: 'Initial', value: 'initial' },
    { key: 'Re-Take', value: 'retaking' },
    { key: 'Pass after retake', value: 'student_retake_pass' },
    { key: 'FAIL after retake', value: 'student_retake_fail' },
  ];

  title_ids;
  school_ids;
  filteredValues = {
    full_name: '',
    status: '',
    job_description: '',
    problematic: '',
    mentor_evaluation: '',
    employability_survey: '',
    toward_administration: '',
    final_transcript: '',
    school_id: '',
    rncp_title_id: '',
    certifier_school: '',
    class_id: '',
    student_title_status: '',
    rncp_title_ids: null,
    school_ids: null,
    class_ids: null,
    statuses: null,
    student_title_statuses: null,
  };

  isLoading = false;
  exportName: 'Export';
  selectType: any;
  userSelected: any[];
  isReset = false;
  dataLoaded = false;
  sortValue = null;
  private timeOutVal: any;
  private intervalVal: any;
  titleList = [];
  originalTitleList = [];
  schoolList = [];
  originalSchoolList = [];
  dataCount = 0;

  mailStudentsDialog: MatDialogRef<MailStudentDialogComponent>;
  exportESCSVDialog: MatDialogRef<ExportEsCsvDialogComponent>;

  originalClassList = [];
  classList = [];
  classFilter = new UntypedFormControl('');
  filteredClass: Observable<any[]>;
  isConnect=true;

  _studentDomainBaseUrl: string = environment.studentEnvironment;
  studentSafeUrl;

  titleSuperFilter = new UntypedFormControl([]);
  classSuperFilter = new UntypedFormControl([]);
  schoolSuperFilter = new UntypedFormControl([]);
  registrationStatusSuperFilter = new UntypedFormControl([]);
  admissionStatusSuperFilter = new UntypedFormControl([]);
  titleSuperFilterList = [];
  classSuperFilterList = [];
  schoolSuperFilterList = [];
  registrationStatusSuperFilterList = [
    { key: 'active', value: 'Registered' },
    { key: 'pending', value: 'pending' },
    { key: 'incorrect_email', value: 'incorrect_email' },
  ];
  admissionStatusSuperFilterList = [
    { key: 'suspended', value: 'suspended' }
  ];

  superTitle = ''
  superClass = ''
  superSchool = ''
  superRegStatus = ''
  superAdmStatus = ''

  constructor(
    private studentService: StudentsService,
    private translate: TranslateService,
    public dialog: MatDialog,
    private utilService: UtilityService,
    private authService: AuthService,
    private permissions: NgxPermissionsService,
    private router: Router,
    private userService: UserService,
    private exportCsvService: ExportCsvService,
    private mailboxService: MailboxService,
    public permissionService: PermissionService,
    private schoolService: SchoolService,
    private rncpTitleService: RNCPTitlesService,
    private sanitizer: DomSanitizer,
    private parseStringDatePipe: ParseStringDatePipe,
    private pageTitleService: PageTitleService
  ) { }

  ngOnInit() {
    this.pageTitleService.setTitle('List of Suspended Students');
    this.currentUser = this.authService.getLocalStorageUser();
    this.isUserCertifier = this.permissions.getPermission('Certifier Admin') ? true : false;
    this.isUserCertifierDir = this.permissions.getPermission('CR School Director') ? true : false;
    this.isUserMentor = this.utilService.isMentor();
    this.isUserADMTC = this.utilService.isUserEntityADMTC();
    this.paginator.pageSize = 10;
    this.registrationStatusSuperFilterList = [
      { key: 'active', value: this.translate.instant('Registered') },
      { key: 'pending', value: this.translate.instant('pending') },
      { key: 'incorrect_email', value: this.translate.instant('incorrect_email') },
    ];
    this.admissionStatusSuperFilterList = [
      { key: 'suspended', value: this.translate.instant('suspended') }
    ];
    this.getRncpTitleList();
    this.getSchoolDropdownList();
    this.getClassDropdownList();
    this.getTitleDropdownList();    
    this.initFilter();
    this.getStudentData();
    this.studentSafeUrl = this.safeUrl();
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.registrationStatusSuperFilterList = [
        { key: 'active', value: this.translate.instant('Registered') },
        { key: 'pending', value: this.translate.instant('pending') },
        { key: 'incorrect_email', value: this.translate.instant('incorrect_email') }
      ];
      this.admissionStatusSuperFilterList = [
        { key: 'suspended', value: this.translate.instant('suspended') }
      ];
    })
    // this.getUrgentMail();
    // this.initializeStudent();
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (!this.isReset) {
            this.getStudentData();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
  }

  goToSchoolDetails(schoolId: string) {
    // this.router.navigate(['school', schoolId]);
    window.open(`./school/${schoolId}`, '_blank');
  }

  safeUrl() {
    const url = `${environment.studentEnvironment}/session/login`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  sortData(sort: Sort) {
    this.sortValue = sort.direction ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;

    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getStudentData();
      }
    }
  }

  getStudentData() {
    this.isLoading = true;
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    let filter = this.cleanFilterData();

    if (!!this.permissions.getPermission('Chief Group Academic')) {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((res) => {
        const dataUSer = res.entities.filter((ent) => ent.type.name === userType);
        this.school_ids = this.utilService.getAcademicAllAssignedSchool(dataUSer);
        this.subs.sink = this.studentService
          .getAllStudentsChiefGroupSuspended(pagination, this.school_ids, this.sortValue, filter)
          .subscribe((students: any) => {
            if (students && students.length) {
              this.dataSource.data = students;
              this.paginator.length = students[0].count_document;
              this.dataCount = students[0].count_document;
            } else {
              this.dataSource.data = [];
              this.paginator.length = 0;
              this.dataCount = 0;
            }
            this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
            this.isReset = false;
            this.isLoading = false;
          });
      });
    } else if (!!this.permissions.getPermission('CR School Director') || !!this.permissions.getPermission('Certifier Admin')) {
      const schoolids = this.currentUser.entities ? this.currentUser.entities[0].school._id : '';
      this.filteredValues.certifier_school = schoolids;
      filter = this.cleanFilterData();
      this.subs.sink = this.studentService.getAllStudentsCRSuspended(pagination, this.sortValue, filter).subscribe((students: any) => {
        if (students && students.length) {
          this.dataSource.data = students;
          this.paginator.length = students[0].count_document;
          this.dataCount = students[0].count_document;
        } else {
          this.dataSource.data = [];
          this.paginator.length = 0;
          this.dataCount = 0;
        }
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
        this.isReset = false;
        this.isLoading = false;
      });
    } else if (!!this.permissions.getPermission('Mentor')) {
      const mentor_id = this.currentUser._id;
      this.subs.sink = this.studentService
        .getAllStudentsMentorSuspended(pagination, mentor_id, this.sortValue, filter)
        .subscribe((students: any) => {
          if (students && students.length) {
            this.dataSource.data = students;
            this.paginator.length = students[0].count_document;
            this.dataCount = students[0].count_document;
          } else {
            this.dataSource.data = [];
            this.paginator.length = 0;
            this.dataCount = 0;
          }
          this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
          this.isReset = false;
          this.isLoading = false;
        });
    } else {
      this.subs.sink = this.studentService.getAllStudentsSuspended(pagination, this.sortValue, filter).subscribe((students: any) => {

        if (students && students.length) {
          this.dataSource.data = students;
          this.paginator.length = students[0].count_document;
          this.dataCount = students[0].count_document;
        } else {
          this.dataSource.data = [];
          this.paginator.length = 0;
          this.dataCount = 0;
        }
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
        this.isReset = false;
        this.isLoading = false;
      });
    }
  }

  cleanFilterData() {
    const filterData = _.cloneDeep(this.filteredValues);
    const filter = {};

    const isNotEmptyStr = (data) => typeof data === 'string' && data !== '';
    const isNotEmptyArr = (data) => Array.isArray(data) && data.length > 0;

    // exclude props with empty string or array value
    for (let [key, value] of Object.entries(filterData)) {
      
      // if value is array, check if it's not empty or even contains empty strings
      if (isNotEmptyArr(value)) {
        let arr: any = value;
        filter[key] = arr.filter(item => isNotEmptyStr(item));
      }

      // check if value is not empty string
      if (isNotEmptyStr(value)) filter[key] = value;
    }

    return filter;

    // const filterData = _.cloneDeep(this.filteredValues);
    // let filterQuery = '';
    // let rncp_title_idsFilter;
    // let school_idsFilter;
    // let class_idsFilter;
    // if (this.filteredValues.rncp_title_ids && this.filteredValues.rncp_title_ids.length ) {
    //   rncp_title_idsFilter = this.filteredValues.rncp_title_ids.map((item) => '"' + item + '"');
    // }
    // if (this.filteredValues.school_ids && this.filteredValues.school_ids.length ) {
    //   school_idsFilter = this.filteredValues.school_ids.map((item) => '"' + item + '"');
    // }
    // if (this.filteredValues.class_ids && this.filteredValues.class_ids.length ) {
    //   class_idsFilter = this.filteredValues.class_ids.map((item) => '"' + item + '"');
    // }
    // Object.keys(filterData).forEach((key) => {
    //   // only add key that has value to the query. so it wont send filter with empty string
    //   if (filterData[key]) {
    //     if (key === 'full_name' || key === 'school_id' || key === 'rncp_title_id' || key === 'certifier_school' || key === 'class_id') {
    //       filterQuery = filterQuery + ` ${key}:"${filterData[key]}"`;    
    //     }else if(key === 'rncp_title_ids' ){                            
    //       filterQuery = filterQuery + ` rncp_title_ids :[${rncp_title_idsFilter}]`;                           
    //     }else if( key === 'school_ids') {
    //       filterQuery = filterQuery + ` school_ids:[${school_idsFilter}]`;
    //     }else if( key === 'class_ids') {
    //       filterQuery = filterQuery + ` class_ids:[${class_idsFilter}]`;
    //     }else if( key === 'statuses' || key === 'student_title_statuses') {
    //       filterQuery = filterQuery + ` ${key}:[${filterData[key]}]`;
    //     } else {
    //       filterQuery = filterQuery + ` ${key}:${filterData[key]}`;          
    //     }
    //   }
    // });
    // return 'filter: {' + filterQuery + '}';
  }

  exportESCSV() {
    this.exportESCSVDialog = this.dialog.open(ExportEsCsvDialogComponent, {
      disableClose: true,
      width: '600px',
      data: this.dataSource.data,
    });
  }
  getFinalResultAfterReTake(result: string) {
    if (result === 'PASS1' || result === 'PASS2' || result === 'PASS3') {
      return 'PASS';
    } else if (result === 'FAILED' || result === 'ELIMINATED') {
      return 'FAILED';
    }
  }

  requestStudEmailCorrection(student) {

    swal
      .fire({
        type: 'question',
        title: this.translate.instant('USER_S5.TITLE'),
        html: this.translate.instant('USER_S5.TEXT', {
          userCivility: this.translate.instant(student.civility),
          userFirstName: student.first_name,
          userLastName: student.last_name,
        }),
        showCancelButton: true,
        allowEscapeKey: true,
        confirmButtonText: this.translate.instant('USER_S5.SEND'),

        cancelButtonText: this.translate.instant('CANCEL'),
        allowOutsideClick: false,
      })
      .then((res) => {
        if (res.value) {
          const deleteConfig: MatDialogConfig = {
            disableClose: true,
            panelClass: 'no-max-height',
            width: '600px',
            maxHeight: '75vh',
          };

          // sendEmailToAcadDir();
          this.dialog
            .open(IncorrectUsersEmailDialogComponent, {
              ...deleteConfig,
              data: {
                studentId: student._id,
                schoolId: student.school._id,
                rncpId: student.rncp_title && student.rncp_title._id ? student.rncp_title._id : '',
                lang: this.translate.currentLang.toLowerCase(),
                isFromUserTable: false,
              },
            })
            .afterClosed()
            .subscribe((resp) => (resp ? this.getStudentData() : null));
        }
      });
  }

  thumbsToggle(flag, student) {
    const update = flag !== null ? flag : false;

    if (update) {
      let timeDisabled = 3;
      Swal.fire({
        title: this.translate.instant('THUMBSUP.SW2.TITLE'),
        html: this.translate.instant('THUMBSUP.SW2.TEXT'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CANCEL'),
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          this.intervalVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM') + ' in ' + timeDisabled + ' sec';
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM');
            Swal.enableConfirmButton();
            clearInterval(this.intervalVal);
            // clearTimeout(time);
          }, timeDisabled * 1000);
          // clearTimeout(this.timeOutVal);
        },
      }).then((inputValue) => {
        if (inputValue.value) {
          // call API for thumb up here
          const payload = {
            is_thumbups_green: false,
          };
          const lang = this.translate.currentLang.toLowerCase();
          this.subs.sink = this.schoolService.updateStudent(student._id, payload, lang).subscribe(
            (resp) => {
              if (resp) {
                Swal.fire({ type: 'success', title: 'Bravo!', allowOutsideClick: false, confirmButtonText: this.translate.instant('OK') });
                this.getStudentData();
              }
            },
            (err) => {
              const text = err;
              const index = text.indexOf('/');
              const message = text.slice(21, index - 1);
              const pattern = text.slice(index);
              let str = '';

              if (pattern === '/^[a-zA-ZÀ-ÖØ-öø-ÿ ]*$/') {
                str = 'must be letters';
              } else if (pattern === '/^[a-zA-ZÀ-ÖØ-öø-ÿ -]*$/') {
                str = 'must be letters and "-"';
              } else if (pattern === '/^[0-9]+$/') {
                str = 'must be numbers';
              } else if (pattern === '/^[a-fA-F0-9]{24}$/') {
                str = 'must be Id';
              } else if (pattern === '/^[a-zA-Z0-9À-ÖØ-öø-ÿ -]*$/') {
                str = 'must be letters, numbers, and "-"';
              }
              const alert = message + ' ' + str;

              if (
                err['message'] === 'GraphQL error: Error: Email Registered As Student' ||
                err['message'] === 'GraphQL error: Error: Email Registered As User'
              ) {
                Swal.fire({
                  type: 'error',
                  title: this.translate.instant('ADDSTUDENT_ST.TITLE'),
                  html: this.translate.instant('ADDSTUDENT_ST.TEXT'),
                  footer: `<span style="margin-left: auto">ADDSTUDENT_ST</span>`,
                  confirmButtonText: this.translate.instant('ADDSTUDENT_ST.BUTTON'),
                });
              } else {
                Swal.fire({
                  type: 'error',
                  title: 'Error !',
                  text: alert,
                });
              }
            },
          );
        }
      });
    } else {
      let timeDisabled = 3;
      Swal.fire({
        title: this.translate.instant('THUMBSUP.SW1.TITLE'),
        html: this.translate.instant('THUMBSUP.SW1.TEXT'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CANCEL'),
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          this.intervalVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM') + ' in ' + timeDisabled + ' sec';
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM');
            Swal.enableConfirmButton();
            // clearTimeout(time);
            clearInterval(this.intervalVal);
          }, timeDisabled * 1000);
          // clearTimeout(this.timeOutVal);
        },
      }).then((inputValue) => {
        if (inputValue.value) {
          // call API for thumb up here
          const payload = {
            is_thumbups_green: true,
          };
          const lang = this.translate.currentLang.toLowerCase();
          this.subs.sink = this.schoolService.updateStudent(student._id, payload, lang).subscribe(
            (resp) => {
              if (resp) {
                Swal.fire({ type: 'success', title: 'Bravo!' });
                this.getStudentData();
              }
            },
            (err) => {
              const text = err;
              const index = text.indexOf('/');
              const message = text.slice(21, index - 1);
              const pattern = text.slice(index);
              let str = '';

              if (pattern === '/^[a-zA-ZÀ-ÖØ-öø-ÿ ]*$/') {
                str = 'must be letters';
              } else if (pattern === '/^[a-zA-ZÀ-ÖØ-öø-ÿ -]*$/') {
                str = 'must be letters and "-"';
              } else if (pattern === '/^[0-9]+$/') {
                str = 'must be numbers';
              } else if (pattern === '/^[a-fA-F0-9]{24}$/') {
                str = 'must be Id';
              } else if (pattern === '/^[a-zA-Z0-9À-ÖØ-öø-ÿ -]*$/') {
                str = 'must be letters, numbers, and "-"';
              }
              const alert = message + ' ' + str;

              if (
                err['message'] === 'GraphQL error: Error: Email Registered As Student' ||
                err['message'] === 'GraphQL error: Error: Email Registered As User'
              ) {
                Swal.fire({
                  type: 'error',
                  title: this.translate.instant('ADDSTUDENT_ST.TITLE'),
                  html: this.translate.instant('ADDSTUDENT_ST.TEXT'),
                  footer: `<span style="margin-left: auto">ADDSTUDENT_ST</span>`,
                  confirmButtonText: this.translate.instant('ADDSTUDENT_ST.BUTTON'),
                });
              } else {
                Swal.fire({
                  type: 'error',
                  title: 'Error !',
                  text: alert,
                });
              }
            },
          );
        }
      });
    }
  }

  sendMail(data) {
    this.mailStudentsDialog = this.dialog.open(MailStudentDialogComponent, {
      disableClose: true,
      width: '750px',
      data: data,
    });
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.isCheckedAll = false;
    } else {
      this.isCheckedAll = true;
      this.dataSource.data.forEach((row) => this.selection.select(row));
    }
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  resetFilter() {
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.classSuperFilterList = [];
    this.schoolSuperFilterList = [];

    this.filteredValues = {
      full_name: '',
      status: '',
      job_description: '',
      problematic: '',
      mentor_evaluation: '',
      employability_survey: '',
      toward_administration: '',
      final_transcript: '',
      school_id: '',
      rncp_title_id: '',
      certifier_school: '',
      class_id: '',
      student_title_status: '',
      rncp_title_ids: null,
      school_ids: null,
      class_ids: null,
      statuses: null,
      student_title_statuses: null,
    };

    this.lastNameFilter.setValue('', { emitEvent: false });
    this.statusFilter.setValue('AllM', { emitEvent: false });
    this.jobFilter.setValue('AllF', { emitEvent: false });
    this.probFilter.setValue('AllF', { emitEvent: false });
    this.mentorFilter.setValue('AllM', { emitEvent: false });
    this.empSurveyFilter.setValue('AllF', { emitEvent: false });
    this.transcriptFilter.setValue('AllM', { emitEvent: false });
    this.certifierFilter.setValue('AllM', { emitEvent: false });
    this.schoolFilter.setValue('', { emitEvent: false });
    this.titleFilter.setValue('', { emitEvent: false });
    this.titleStatusFilter.setValue('AllM', { emitEvent: false });
    this.classFilter.setValue('', { emitEvent: false });
    this.schoolSuperFilter.patchValue([], { emitEvent: false });
    this.titleSuperFilter.patchValue([], { emitEvent: false });
    this.classSuperFilter.patchValue([], { emitEvent: false });
    this.registrationStatusSuperFilter.patchValue([], { emitEvent: false });
    this.admissionStatusSuperFilter.patchValue([], { emitEvent: false });

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    this.getRncpTitleList();
    this.getSchoolDropdownList();
    this.getStudentData();
    this.getClassDropdownList();

    this.superTitle = ''
    this.superClass = ''
    this.superSchool = ''
    this.superRegStatus = ''
    this.superAdmStatus = ''
  }

  connectAsUser(student) {

    const currentUser = this.utilService.getCurrentUser();
    const studentUserId = student && student.user_id && student.user_id._id ? student.user_id._id : null;
    const unixUserType = _.uniqBy(student.entities, 'type.name');

    if (currentUser && studentUserId) {
      this.isConnect = true
      this.subs.sink = this.authService.loginAsUser(currentUser._id, studentUserId).subscribe((resp) => {

        if (resp && resp.user) {

          const tempUser = resp.user;
          Swal.fire({
            type: 'success',
            title: this.translate.instant('SUCCESS'),
            html: this.translate.instant('USER_S7_SUPERUSER.TEXT', {
              UserCivility: this.translate.instant(student.civility),
              UserFirstName: student.first_name,
              UserLastName: student.last_name,
            }),
            footer: `<span style="margin-left: auto">USER_S7_SUPERUSER</span>`,
            allowEscapeKey: true,
            allowOutsideClick: false,
            confirmButtonText: this.translate.instant('UNDERSTOOD'),
          }).then((result) => {
            const studentType = '5a067bba1c0217218c75f8ab'
            if (tempUser.entities[0].type._id === studentType) {
              this.authService.connectAsStudent(resp, tempUser.entities[0].type.name, 'ifr')
            } else {
              this.authService.backupLocalUserProfileAndToken();
              this.authService.setLocalUserProfileAndToken(resp);
              this.authService.setPermission([tempUser.entities[0].type.name]);
              this.permissions.flushPermissions();
              this.permissions.loadPermissions([tempUser.entities[0].type.name]);
              this.userService.reloadCurrentUser(true);
              if (this.permissions.getPermission('Mentor') || this.permissions.getPermission('HR')) {
                this.router.navigate(['/students-card']);
              } else if (this.permissions.getPermission('Chief Group Academic')) {
                this.router.navigate(['/school-group']);
              }
              // else if (this.permissions.getPermission('Student')) {
              //   this.router.navigate(['/my-file']);
              // } 
              else {
                this.router.navigate(['/rncpTitles']);
              }
            }
          });
        } else {
          this.isConnect = false
        }
      });
    }
  }

  editStudent(student) {

    // this.router.navigate(['/school', student.school._id], {
    //   queryParams: { title: student.rncp_title._id, class: student.current_class._id, student: student._id, open: 'student-cards' },
    // });
    window.open(
      `./school/${student.school._id}?title=${student.rncp_title._id}&class=${student.current_class._id}&student=${student._id}&studentStatus=suspended&open=student-cards`,
      '_blank',
    );
  }

  computeStatusJuryDecision(status: string) {
    if (status === 'Eliminated' || status === 'Failed') {
      return 'red';
    } else if (status === 'Re-Take') {
      return 'yellow';
    } else if (status === 'Passed') {
      return 'green';
    }
    return '';
  }

  showOptions(info) {
    const numSelected = this.selection.selected.length;
    this.selectType = info;
    const data = this.selection.selected;
    this.userSelected = [];
    data.forEach((user) => {
      this.userSelected.push(user);
    });
  }

  finalTranscriptStatus(item) {
    let finalTranscriptStatus = '';

    if (item.final_transcript_id && item.final_transcript_id.jury_decision_for_final_transcript) {
      if (item.final_transcript_id.jury_decision_for_final_transcript === 'retaking') {
        if (!item.final_transcript_id.after_final_retake_decision) {
          if (item.final_transcript_id.student_decision === 'retaking' || item.final_transcript_id.student_decision === '') {
            finalTranscriptStatus = this.translate.instant('FINAL_TRANSCRIPT.RETAKE');
          } else if (item.final_transcript_id.student_decision === 'failed') {
            finalTranscriptStatus = this.translate.instant('FINAL_TRANSCRIPT.FINAL_RESULT_FAIL');
          }
        }
        if (item.final_transcript_id.after_final_retake_decision) {
          if (!item.final_transcript_id.has_jury_finally_decided) {
            if (item.final_transcript_id.student_decision === 'retaking' || item.final_transcript_id.student_decision === '') {
              finalTranscriptStatus = this.translate.instant('FINAL_TRANSCRIPT.RETAKE');
            } else if (item.final_transcript_id.student_decision === 'failed') {
              finalTranscriptStatus = this.translate.instant('FINAL_TRANSCRIPT.FINAL_RESULT_FAIL');
            }
          } else {
            if (this.getFinalResultAfterReTake(item.final_transcript_id.after_final_retake_decision) === 'FAILED') {
              finalTranscriptStatus = this.translate.instant('FINAL_TRANSCRIPT.FINAL_RESULT_FAIL');
            }
            if (this.getFinalResultAfterReTake(item.final_transcript_id.after_final_retake_decision) === 'PASS') {
              finalTranscriptStatus = this.translate.instant('FINAL_TRANSCRIPT.PASS');
            }
          }
        }
      } else if (item.final_transcript_id.jury_decision_for_final_transcript === 'pass') {
        finalTranscriptStatus = this.translate.instant('FINAL_TRANSCRIPT.PASS');
      } else if (item.final_transcript_id.jury_decision_for_final_transcript === 'eliminated') {
        finalTranscriptStatus = this.translate.instant('FINAL_TRANSCRIPT.ELIMINATED');
      } else if (item.final_transcript_id.jury_decision_for_final_transcript === 'failed') {
        finalTranscriptStatus = this.translate.instant('FINAL_TRANSCRIPT.FINAL_RESULT_FAIL');
      }
    }
    return finalTranscriptStatus;
  }

  exportData() {
    Swal.close();
    const data = [];

    if (this.selectType === 'one' && this.userSelected.length) {
      if (this.userSelected) {
        this.userSelected.forEach((item) => {
          const obj = [];
          const titleId = item.rncp_title ? item.rncp_title._id : '';
          const schoolId = item.school ? item.school._id : '';
          const classId = item.current_class ? item.current_class._id : '';

          let companies = [];
          if (item.companies && item.companies.length) {
            companies = item.companies.filter((resp) => {
              return resp.status === 'active';
            });
          }
          const finalTranscript = this.finalTranscriptStatus(item);
          const datebirth = item.date_of_birth ? this.parseStringDatePipe.transform(item.date_of_birth) : '';
          // const dateDeactivation = item.date_of_resignation ? this.parseStringDatePipe.transform(item.date_of_resignation) : '';
          // TODO: From the template get the data location and add the data
          // TEMPLATE CSV: https://docs.google.com/spreadsheets/d/1bI9vpbxkitfTNPjfpKExH7sSUXGke3_PpUePyqS65mA/edit#gid=0
          // TEMPLATE CSV Duplicate With column Class : https://docs.google.com/spreadsheets/d/1qXz_irV4sC02tsjBKp9yTTmA3MK0tzNJkHZg0EIYT1s/edit#gid=0
          // TEMPLATE CSV Duplicate With column Specialization : https://docs.google.com/spreadsheets/d/1bZuwnlWDaWNYWv6gnK3p2iVt5iuHWBhEkFEI6R7ngIo/edit#gid=0
          obj[0] = item.rncp_title ? item.rncp_title.short_name : '-';
          obj[1] = item.current_class ? item.current_class.name : '-';
          obj[2] = item.school ? item.school.short_name : '-';
          obj[3] = item.school
            ? '=HYPERLINK("' + `http://www.admtc.pro/school/${schoolId}` + '"; "' + this.translate.instant('LINK') + '")'
            : '-';
          obj[4] = item.specialization && item?.specialization?.name ? item?.specialization?.name : '-';
          obj[5] = this.translate.instant(item.civility);
          obj[6] = item.first_name;
          obj[7] = item.last_name;
          // obj[7] =
          //   '=HYPERLINK("' +
          //   `http://www.admtc.pro/school/${schoolId}?title=${titleId}&class=${classId}&student=${item._id}&open=student-cards&selectedTab=Identity&selectedSubTab=Identity` +
          //   '"; "' +
          //   this.translate.instant('LINK') +
          //   '")';
          obj[8] = '-';
          obj[9] = item.createdAt ? moment(parseInt(item.createdAt)).format('DD/MM/YYYY') : '-';
          obj[10] = datebirth ? moment(datebirth, 'DD/MM/YYYY').format('DD/MM/YYYY') : '-';
          obj[11] = item.place_of_birth;
          obj[12] = item.incorrect_email
            ? this.translate.instant('incorrect_email')
            : item.status
              ? this.translate.instant(item.status)
              : '-';
          obj[13] = item.student_title_status ? this.translate.instant(item.student_title_status) : '-';
          obj[14] = item.date_of_resignation ? item.date_of_resignation : '-';
          obj[15] = item.reason_for_resignation ? item.reason_for_resignation : '-';
          obj[16] = item.email ? item.email : '-';
          obj[17] = item.tele_phone ? item.tele_phone : '-';
          obj[18] =
            item.academic_journey_id && item.academic_journey_id.diplomas && item.academic_journey_id.diplomas.length
              ? this.translate.instant('PUBLISHDOC_S1.YES')
              : this.translate.instant('PUBLISHDOC_S1.NO');
          obj[19] = finalTranscript;
          obj[20] =
            item.job_description_id && item.job_description_id.job_description_status
              ? this.translate.instant(item.job_description_id.job_description_status)
              : '-';
          obj[21] = item.problematic_id ? this.translate.instant(item.problematic_id.problematic_status) : '-';
          obj[22] = item.is_thumbups_green
            ? item.is_thumbups_green
              ? this.translate.instant('THUMBSUP.OK')
              : this.translate.instant('THUMBSUP.NOT_OK')
            : '-';
          obj[23] = companies && companies.length ? companies[0].company.company_name : '';
          obj[24] =
            companies && companies.length && companies[0].mentor && companies[0].mentor.civility
              ? this.translate.instant(companies[0].mentor.civility) +
              ' ' +
              companies[0].mentor.first_name +
              ' ' +
              companies[0].mentor.last_name
              : '';
          obj[25] = companies && companies.length && companies[0].mentor ? companies[0].mentor.email : '';
          data.push(obj);
        });

        const valueRange = { values: data };
        const today = moment().format('DD-MM-YYYY');
        const title = this.exportName + '_' + today;
        const sheetID = this.translate.currentLang === 'en' ? 0 : 35264123;
        const sheetData = {
          spreadsheetId: '1bZuwnlWDaWNYWv6gnK3p2iVt5iuHWBhEkFEI6R7ngIo',
          sheetId: sheetID,
          range: 'A7',
        };
        this.exportCsvService.createAndUpdateSpreadsheet(valueRange, title, sheetData);
      }
    } else {
      this.allStudentForExport = [];
      this.getAllStudentExportData(0);
    }
  }

  getAllStudentExportData(pageNumber: number) {
    this.isWaitingForResponse = true;
    const pagination = {
      limit: 500,
      page: pageNumber,
    };
    let filter = this.cleanFilterData();
    if (!!this.permissions.getPermission('Chief Group Academic')) {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((res) => {
        const dataUSer = res.entities.filter((ent) => ent.type.name === userType);
        this.school_ids = this.utilService.getAcademicAllAssignedSchool(dataUSer);
        this.subs.sink = this.studentService
          .getAllStudentsChiefGroupSuspended(pagination, this.school_ids, this.sortValue, filter)
          .subscribe((students: any) => {
            if (students && students.length) {
              this.allStudentForExport.push(...students);
              const page = pageNumber + 1;

              // recursively get student data by 500 until we dont get student data anymore
              // we use this way because if we get all the data at once, it will trigger cors policy error because response too big
              this.getAllStudentExportData(page);
            } else {
              this.isWaitingForResponse = false;
              if (this.isSendVerification) {
                this.sentVerificationToAllStudent(this.allStudentForExport);
              } else {
                this.exportAllData(this.allStudentForExport);
              }
            }
          });
      });
    } else if (!!this.permissions.getPermission('CR School Director') || !!this.permissions.getPermission('Certifier Admin')) {
      const schoolids = this.currentUser.entities ? this.currentUser.entities[0].school._id : '';

      this.filteredValues.certifier_school = schoolids;
      filter = this.cleanFilterData();
      this.subs.sink = this.studentService.getAllStudentsCRSuspended(pagination, this.sortValue, filter).subscribe((students: any) => {
        if (students && students.length) {
          this.allStudentForExport.push(...students);
          const page = pageNumber + 1;

          // recursively get student data by 500 until we dont get student data anymore
          // we use this way because if we get all the data at once, it will trigger cors policy error because response too big
          this.getAllStudentExportData(page);
        } else {
          this.isWaitingForResponse = false;
          if (this.isSendVerification) {
            this.sentVerificationToAllStudent(this.allStudentForExport);
          } else {
            this.exportAllData(this.allStudentForExport);
          }
        }
      });
    } else if (!!this.permissions.getPermission('Mentor')) {
      const mentor_id = this.currentUser._id;
      this.subs.sink = this.studentService
        .getAllStudentsMentorSuspended(pagination, mentor_id, this.sortValue, filter)
        .subscribe((students: any) => {
          if (students && students.length) {
            this.allStudentForExport.push(...students);
            const page = pageNumber + 1;

            // recursively get student data by 500 until we dont get student data anymore
            // we use this way because if we get all the data at once, it will trigger cors policy error because response too big
            this.getAllStudentExportData(page);
          } else {
            this.isWaitingForResponse = false;
            if (this.isSendVerification) {
              this.sentVerificationToAllStudent(this.allStudentForExport);
            } else {
              this.exportAllData(this.allStudentForExport);
            }
          }
        });
    } else {
      this.subs.sink = this.studentService.getAllStudentsSuspended(pagination, this.sortValue, filter).subscribe((students: any) => {

        if (students && students.length) {
          this.allStudentForExport.push(...students);
          const page = pageNumber + 1;

          // recursively get student data by 500 until we dont get student data anymore
          // we use this way because if we get all the data at once, it will trigger cors policy error because response too big
          this.getAllStudentExportData(page);
        } else {
          this.isWaitingForResponse = false;
          if (this.isSendVerification) {
            this.sentVerificationToAllStudent(this.allStudentForExport);
          } else {
            this.exportAllData(this.allStudentForExport);
          }
        }
      });
    }
  }

  exportAllData(dataa) {
    const exportData = _.uniqBy(dataa, '_id');
    const data = [];
    if (exportData && exportData.length) {
      exportData.forEach((item) => {
        const obj = [];
        const titleId = item.rncp_title ? item.rncp_title._id : '';
        const schoolId = item.school ? item.school._id : '';
        const classId = item.current_class ? item.current_class._id : '';
        let companies = [];
        if (item.companies && item.companies.length) {
          companies = item.companies.filter((resp) => {
            return resp.status === 'active';
          });
        }
        const finalTranscript = this.finalTranscriptStatus(item);
        const datebirth = item.date_of_birth ? this.parseStringDatePipe.transform(item.date_of_birth) : '';
        // const dateDeactivation = item.date_of_resignation ? this.parseStringDatePipe.transform(item.date_of_resignation) : '';
        // TODO: From the template get the data location and add the data
        // TEMPLATE CSV: https://docs.google.com/spreadsheets/d/1bI9vpbxkitfTNPjfpKExH7sSUXGke3_PpUePyqS65mA/edit#gid=0
        // TEMPLATE CSV Duplicate With column Class : https://docs.google.com/spreadsheets/d/1qXz_irV4sC02tsjBKp9yTTmA3MK0tzNJkHZg0EIYT1s/edit#gid=0
        // TEMPLATE CSV Duplicate With column Specialization : https://docs.google.com/spreadsheets/d/1bZuwnlWDaWNYWv6gnK3p2iVt5iuHWBhEkFEI6R7ngIo/edit#gid=0
        obj[0] = item.rncp_title ? item.rncp_title.short_name : '-';
        obj[1] = item.current_class ? item.current_class.name : '-';
        obj[2] = item.school ? item.school.short_name : '-';
        obj[3] = item.school
          ? '=HYPERLINK("' + `http://www.admtc.pro/school/${schoolId}` + '"; "' + this.translate.instant('LINK') + '")'
          : '-';
        obj[4] = item.specialization && item?.specialization?.name ? item?.specialization?.name : '-';
        obj[5] = this.translate.instant(item.civility);
        obj[6] = item.first_name;
        obj[7] = item.last_name;
        // obj[7] =
        //   '=HYPERLINK("' +
        //   `http://www.admtc.pro/school/${schoolId}?title=${titleId}&class=${classId}&student=${item._id}&open=student-cards&selectedTab=Identity&selectedSubTab=Identity` +
        //   '"; "' +
        //   this.translate.instant('LINK') +
        //   '")';
        obj[8] = '-';
        obj[9] = item.createdAt ? moment(parseInt(item.createdAt)).format('DD/MM/YYYY') : '-';
        obj[10] = datebirth ? moment(datebirth, 'DD/MM/YYYY').format('DD/MM/YYYY') : '-';
        obj[11] = item.place_of_birth;
        obj[12] = item.incorrect_email
          ? this.translate.instant('incorrect_email')
          : item.status
            ? this.translate.instant(item.status)
            : '-';
        obj[13] = item.student_title_status ? this.translate.instant(item.student_title_status) : '-';
        obj[14] = item.date_of_resignation ? item.date_of_resignation : '-';
        obj[15] = item.reason_for_resignation ? item.reason_for_resignation : '-';
        obj[16] = item.email ? item.email : '-';
        obj[17] = item.tele_phone ? item.tele_phone : '-';
        obj[18] =
          item.academic_journey_id && item.academic_journey_id.diplomas && item.academic_journey_id.diplomas.length
            ? this.translate.instant('PUBLISHDOC_S1.YES')
            : this.translate.instant('PUBLISHDOC_S1.NO');
        obj[19] = finalTranscript;
        obj[20] =
          item.job_description_id && item.job_description_id.job_description_status
            ? this.translate.instant(item.job_description_id.job_description_status)
            : '-';
        obj[21] = item.problematic_id ? this.translate.instant(item.problematic_id.problematic_status) : '-';
        obj[22] = item.is_thumbups_green
          ? item.is_thumbups_green
            ? this.translate.instant('THUMBSUP.OK')
            : this.translate.instant('THUMBSUP.NOT_OK')
          : '-';
        obj[23] = companies && companies.length ? companies[0].company.company_name : '';
        obj[24] =
          companies && companies.length && companies[0].mentor && companies[0].mentor.civility
            ? this.translate.instant(companies[0].mentor.civility) +
            ' ' +
            companies[0].mentor.first_name +
            ' ' +
            companies[0].mentor.last_name
            : '';
        obj[25] = companies && companies.length && companies[0].mentor ? companies[0].mentor.email : '';
        data.push(obj);
      });
      this.isWaitingForResponse = false;

      const valueRange = { values: data };
      const today = moment().format('DD-MM-YYYY');
      const title = this.exportName + '_' + today;
      const sheetID = this.translate.currentLang === 'en' ? 0 : 35264123;
      const sheetData = {
        spreadsheetId: '1bZuwnlWDaWNYWv6gnK3p2iVt5iuHWBhEkFEI6R7ngIo',
        sheetId: sheetID,
        range: 'A7',
      };
      this.exportCsvService.createAndUpdateSpreadsheet(valueRange, title, sheetData);
    }
  }

  sentVerificationToAllStudent(data) {
    const dataStudentID = data.map((student) => {
      return student._id;
    });

    this.subs.sink = this.studentService.SendStudentIdentityVerification(dataStudentID).subscribe((resp) => {
      this.isSendVerification = false;
      if (!this.isReset) {
        this.getStudentData();
      }
      swal.fire({
        title: 'Bravo!',
        type: 'success',
        allowEscapeKey: true,
        allowOutsideClick: false,
        confirmButtonText: this.translate.instant('VERIFY_SX.BUTTON_1'),
      });
    });
  }

  // getUrgentMail() {
  //   this.subs.sink = this.mailboxService.getUrgentMail().subscribe((mailList: any[]) => {
  //     if (mailList && mailList.length) {
  //       this.subs.sink = this.dialog
  //         .open(ReplyUrgentMessageDialogComponent, {
  //           disableClose: true,
  //           width: '825px',
  //           panelClass: 'certification-rule-pop-up',
  //           data: mailList,
  //         })
  //         .afterClosed()
  //         .subscribe((resp) => {
  //           this.subs.sink = this.mailboxService.getUrgentMail().subscribe((mailUrgent: any[]) => {
  //             if (mailUrgent && mailUrgent.length) {
  //               this.replyUrgentMessageDialogComponent = this.dialog.open(ReplyUrgentMessageDialogComponent, {
  //                 disableClose: true,
  //                 width: '825px',
  //                 panelClass: 'certification-rule-pop-up',
  //                 data: mailUrgent,
  //               });
  //             }
  //           });
  //         });
  //     }
  //   });
  // }

  getRncpTitleList() {
    if (this.isUserADMTC) {
      this.subs.sink = this.rncpTitleService.getRncpTitleListData().subscribe((titles) => {
        // filtering out data with empty name
        let tempTitles = _.cloneDeep(titles);
        if (tempTitles && tempTitles.length) {

          tempTitles = tempTitles.filter((title) => title && title.short_name && this.utilService.disregardSpace(title.short_name) !== '');
        }
        this.titleList = _.cloneDeep(tempTitles);
        this.titleFilterList = _.cloneDeep(tempTitles);
        this.originalTitleList = _.cloneDeep(tempTitles);
        this.filteredTitles = this.titleFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.titleList
              .filter((option) => (option ? option.short_name.toLowerCase().includes(searchTxt.toLowerCase()) : ''))
              .sort((firstTitle, secondTitle) => {
                if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstTitle.short_name)).toLowerCase() <
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondTitle.short_name)).toLowerCase()
                ) {
                  return -1;
                } else if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstTitle.short_name)).toLowerCase() >
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondTitle.short_name)).toLowerCase()
                ) {
                  return 1;
                } else {
                  return 0;
                }
              }),
          ),
        );
      });
    } else {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((res) => {
        const dataUSer = res.entities.filter((ent) => ent.type.name === userType);
        const title_ids = this.utilService.getAcademicAllAssignedTitle(dataUSer);
        this.subs.sink = this.rncpTitleService.getAllRncpTitleListData(false, title_ids).subscribe((titles) => {
          // filtering out data with empty name
          let tempTitles = _.cloneDeep(titles);
          if (tempTitles && tempTitles.length) {

            tempTitles = tempTitles.filter(
              (title) => title && title.short_name && this.utilService.disregardSpace(title.short_name) !== '',
            );
          }
          this.titleList = _.cloneDeep(tempTitles);
          this.titleFilterList = _.cloneDeep(tempTitles);
          this.originalTitleList = _.cloneDeep(tempTitles);
          this.filteredTitles = this.titleFilter.valueChanges.pipe(
            startWith(''),
            map((searchTxt) =>
              this.titleList
                .filter((option) => (option ? option.short_name.toLowerCase().includes(searchTxt.toLowerCase()) : ''))
                .sort((firstTitle, secondTitle) => {
                  if (
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstTitle.short_name)).toLowerCase() <
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondTitle.short_name)).toLowerCase()
                  ) {
                    return -1;
                  } else if (
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstTitle.short_name)).toLowerCase() >
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondTitle.short_name)).toLowerCase()
                  ) {
                    return 1;
                  } else {
                    return 0;
                  }
                }),
            ),
          );
        });
      });
    }
  }

  getSchoolDropdownList() {
    if (this.isUserADMTC) {
      this.subs.sink = this.schoolService.getschoolAndCity().subscribe((schoolList) => {
        let tempSchools = _.cloneDeep(schoolList);
        if (tempSchools && tempSchools.length) {
          tempSchools = tempSchools.filter(
            (school) => school && school.short_name && this.utilService.disregardSpace(school.short_name) !== '',
          );
        }

        this.schoolList = _.cloneDeep(tempSchools);
        this.originalSchoolList = _.cloneDeep(tempSchools);
        this.filteredSchools = this.schoolFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.schoolList
              .filter((option) => option.short_name.toLowerCase().includes(searchTxt.toLowerCase()))
              .sort((firstData, secondData) => {
                if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.short_name)).toLowerCase() <
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.short_name)).toLowerCase()
                ) {
                  return -1;
                } else if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.short_name)).toLowerCase() >
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.short_name)).toLowerCase()
                ) {
                  return 1;
                } else {
                  return 0;
                }
              }),
          ),
        );
      });
    } else if (!!this.permissions.getPermission('CR School Director') || !!this.permissions.getPermission('Certifier Admin')) {
      const currentUser = this.utilService.getCurrentUser();
      const schoolids = currentUser.entities ? currentUser.entities[0].school._id : '';
      const certifier_school = schoolids;
      this.subs.sink = this.schoolService.getAllSchoolsByCRToFilter(certifier_school).subscribe((schoolList: any) => {
        let tempSchools = _.cloneDeep(schoolList);
        if (tempSchools && tempSchools.length) {
          tempSchools = tempSchools.filter(
            (school) => school && school.short_name && this.utilService.disregardSpace(school.short_name) !== '',
          );
        }

        this.schoolList = _.cloneDeep(tempSchools);
        this.originalSchoolList = _.cloneDeep(tempSchools);
        this.filteredSchools = this.schoolFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.schoolList
              .filter((option) => option.short_name.toLowerCase().includes(searchTxt.toLowerCase()))
              .sort((firstData, secondData) => {
                if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.short_name)).toLowerCase() <
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.short_name)).toLowerCase()
                ) {
                  return -1;
                } else if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.short_name)).toLowerCase() >
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.short_name)).toLowerCase()
                ) {
                  return 1;
                } else {
                  return 0;
                }
              }),
          ),
        );
      });
    } else {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((res) => {
        const dataUSer = res.entities.filter((ent) => ent.type.name === userType);
        const school_ids = this.utilService.getAcademicAllAssignedSchool(dataUSer);
        this.subs.sink = this.schoolService.getAllSchoolsByUserOwn(school_ids).subscribe((schoolList: any) => {
          let tempSchools = _.cloneDeep(schoolList);
          if (tempSchools && tempSchools.length) {
            tempSchools = tempSchools.filter(
              (school) => school && school.short_name && this.utilService.disregardSpace(school.short_name) !== '',
            );
          }

          this.schoolList = _.cloneDeep(tempSchools);
          this.originalSchoolList = _.cloneDeep(tempSchools);
          this.filteredSchools = this.schoolFilter.valueChanges.pipe(
            startWith(''),
            map((searchTxt) =>
              this.schoolList
                .filter((option) => option.short_name.toLowerCase().includes(searchTxt.toLowerCase()))
                .sort((firstData, secondData) => {
                  if (
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.short_name)).toLowerCase() <
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.short_name)).toLowerCase()
                  ) {
                    return -1;
                  } else if (
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.short_name)).toLowerCase() >
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.short_name)).toLowerCase()
                  ) {
                    return 1;
                  } else {
                    return 0;
                  }
                }),
            ),
          );
        });
      });
    }
  }

  getClassDropdownList() {
    this.subs.sink = this.studentService.getClassList().subscribe((classData) => {

      const temp = _.cloneDeep(classData);      
      this.classList = _.uniqBy(temp, 'name').sort((a: any, b: any) => a.name.localeCompare(b.name));
      this.originalClassList = _.cloneDeep();
      this.filteredClass = this.classFilter.valueChanges.pipe(
        startWith(''),
        map((searchTxt) =>
          this.classList
            .filter((option) => option.name.toLowerCase().includes(searchTxt.toLowerCase()))
            .sort((a: any, b: any) => a.name.localeCompare(b.name)),
        ),
      );
    });
  }

  enterClassFilter(event: MatAutocomplete) {

    // this.titleList = 'test';
    if (event && event.options && event.options.length > 1) {
      let classId = '';
      event.options.forEach((option, optionIndex) => {
        if (optionIndex === 1 && option) {

          const foundClass = this.classList.find((res) => option.value === res.name);
          if (foundClass) {
            classId = foundClass._id;
            this.classFilter.setValue(foundClass.name);
          }
        }
      });
      if (classId) {
        this.setClassData(classId);
      }
    } else {
      this.classFilter.setValue('');
      this.setClassData(null);
    }
  }

  setClassData(classId: string) {
    // check if previously selected then select again, if yes then reset dropdown before filtering again
    if (this.filteredValues.class_id && this.filteredValues.class_id !== classId) {
      this.classList = this.originalClassList;
    }
    this.filteredValues.class_id = classId;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getStudentData();
    }
  }

  setSchoolFilter(schoolId: string, schoolData?) {
    // check if previously selected then select again, if yes then reset dropdown before filtering again
    if (this.filteredValues.school_id && this.filteredValues.school_id !== schoolId) {
      this.titleList = this.originalTitleList;
    }

    this.filteredValues.school_id = schoolId;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getStudentData();
    }

    this.filterTitleBasedOnSchool(schoolId, schoolData);
  }

  filterTitleBasedOnSchool(schoolId, schoolData) {
    if (schoolId && schoolData) {
      const tempCertFilter = this.titleList.filter((titleCert) =>
        schoolData.certifier_ats.some((titleSchool) => titleSchool._id === titleCert._id),
      );


      const tempPCFilter = this.titleList.filter((titleCert) =>
        schoolData.preparation_center_ats.some(
          (titleSchool) => titleSchool.rncp_title_id && titleSchool.rncp_title_id._id === titleCert._id,
        ),
      );

      const result = tempCertFilter.concat(tempPCFilter);
      this.titleList = result;
      this.titleList = _.uniqBy(this.titleList, 'short_name');
    } else {
      this.titleList = this.originalTitleList;
    }
    this.titleFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });
  }
  setTitleData(titleId: string) {
    // check if previously selected then select again, if yes then reset dropdown before filtering again
    if (this.filteredValues.rncp_title_id && this.filteredValues.rncp_title_id !== titleId) {
      this.schoolList = this.originalSchoolList;
    }

    this.filteredValues.rncp_title_id = titleId;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getStudentData();
    }

    this.filterSchoolDropdownBasedOnTitle(titleId, 'pc');
    this.filterClassDropdownBasedOnTitle(titleId);
  }

  filterSchoolDropdownBasedOnTitle(titleId, type) {
    let tempSchoolFilterPC = [];
    let tempSchoolFilterCert = [];
    // Change dropdown of school to relate with the PC title
    tempSchoolFilterPC = this.schoolList.filter(
      (school) =>
        school &&
        school.preparation_center_ats &&
        school.preparation_center_ats.length &&
        school.preparation_center_ats.some((title) => title && title.rncp_title_id && title.rncp_title_id._id === titleId),
    );

    // Change dropdown of school to relate with the certifier title
    tempSchoolFilterCert = this.schoolList.filter(
      (school) =>
        school &&
        school.certifier_ats &&
        school.certifier_ats.length &&
        school.certifier_ats.some((title) => title && title._id === titleId),
    );

    if ((titleId && tempSchoolFilterPC && tempSchoolFilterPC.length) || (tempSchoolFilterCert && tempSchoolFilterCert.length)) {
      const result = tempSchoolFilterPC.concat(tempSchoolFilterCert);
      if (result && result.length) {
        this.schoolList = result;
        this.schoolList = _.uniqBy(this.schoolList, 'short_name');
      } else {
        this.schoolList = [];
      }
    } else {
      this.schoolList = this.originalSchoolList;
    }

    this.schoolFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });
  }

  filterClassDropdownBasedOnTitle(titleId) {
    this.subs.sink = this.studentService.getClassListFilter(titleId).subscribe((res) => {
      if (res) {
        this.classList = _.cloneDeep(res);
        this.classFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });
      }
    });
  }

  initFilter() {
    this.subs.sink = this.lastNameFilter.valueChanges.pipe(debounceTime(400)).subscribe((statusSearch) => {
      const symbol = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      // if (!statusSearch.match(symbol) && !statusSearch.match(symbol1)) {

      this.filteredValues.full_name = statusSearch ? statusSearch.toLowerCase() : '';
      this.paginator.pageIndex = 0;

      if (!this.isReset) {
        this.getStudentData();
      }

      // } else {
      //   this.lastNameFilter.setValue('');
      //   this.filteredValues.full_name = '';
      //   this.paginator.pageIndex = 0;
      //   if (!this.isReset) {
      //     this.getStudentData();
      //   }
      // }
    });
    this.subs.sink = this.statusFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.status = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getStudentData();
      }
    });
    this.subs.sink = this.titleStatusFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.student_title_status = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getStudentData();
      }
    });
    this.subs.sink = this.jobFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.job_description = statusSearch === 'AllF' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getStudentData();
      }
    });
    this.subs.sink = this.probFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.problematic = statusSearch === 'AllF' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getStudentData();
      }
    });
    this.subs.sink = this.mentorFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.mentor_evaluation = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getStudentData();
      }
    });
    this.subs.sink = this.empSurveyFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.employability_survey = statusSearch === 'AllF' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getStudentData();
      }
    });
    this.subs.sink = this.transcriptFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.toward_administration = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getStudentData();
      }
    });
    this.subs.sink = this.certifierFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.final_transcript = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getStudentData();
      }
    });
  }
  viewReason(data) {
    this.dialog.open(ResignationReasonDialogComponent, {
      disableClose: true,
      panelClass: 'certification-rule-pop-up',
      width: '500px',
      data: {
        date: data.date_of_resignation,
        reason: data.reason_for_resignation,
      },
    });
  }

  updateStudent(data) {
    let timeDisabled = 5;
    swal
      .fire({
        title: this.translate.instant('REACTIVATE_STUDENT.TITLE'),
        html: this.translate.instant('REACTIVATE_STUDENT.TEXT', {
          Civility: this.translate.instant(data.civility),
          LName: data.last_name,
          FName: data.first_name,
        }),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('REACTIVATE_STUDENT.REACTIVATE', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('DEACTIVATEDSUCCESS.DEACTIVATEDSTUDENTACTION.Cancel'),
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          this.intervalVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('REACTIVATE_STUDENT.REACTIVATE') + ' in ' + timeDisabled + ' sec';
          }, 1000);
          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('REACTIVATE_STUDENT.REACTIVATE');
            Swal.enableConfirmButton();
            // clearTimeout(time);
            clearInterval(this.intervalVal);
          }, timeDisabled * 1000);
          // clearTimeout(this.timeOutVal);
        },
      })
      .then((inputValue) => {
        if (inputValue.value) {
          this.schoolDeactivateStudentDialog = this.dialog.open(SchoolStudentDeactivatedDialogComponent, {
            panelClass: 'certification-rule-pop-up',
            disableClose: true,
            width: '500px',
            data: data,
          });
          this.subs.sink = this.schoolDeactivateStudentDialog.afterClosed().subscribe((result) => {
            if (result) {
              this.getStudentData();
              this.schoolDeactivateStudentDialog = null;
            }
          });
        }
      });
  }

  getESToolTip(surveyStatus, surveyValidator) {
    let tooltip = surveyStatus;
    if (surveyStatus === 'rejected_by_validator' || surveyStatus === 'validated_by_validator') {
      tooltip = tooltip + '_' + surveyValidator;
    }
    return tooltip;
  }

  selectTitleSuperFilter() {
    const titleFilterValue = this.titleSuperFilter.value;
    const tempInitialTitle = this.filteredValues['rncp_title_ids']  

    if (titleFilterValue && titleFilterValue.length) {
      this.superTitle = titleFilterValue
      this.paginator.pageIndex = 0;
      this.getClassDropdownListByTitle(titleFilterValue);
    } else {
      if(tempInitialTitle === null) {
        this.superTitle = null
      } else {
        this.filteredValues.class_ids = null;
        this.filteredValues.school_ids = null;    
        this.classSuperFilterList = [];
        this.schoolSuperFilterList = [];
        this.paginator.pageIndex = 0;    
        this.superTitle = null
      }
    }
  }

  selectClassSuperFilter(){
    const classFilterValue = this.classSuperFilter.value;
    const tempInitialClass = this.filteredValues['class_ids']  
    const titleFilterValue = this.titleSuperFilter.value;

    if (classFilterValue && classFilterValue.length) {
      this.superClass = classFilterValue
      this.paginator.pageIndex = 0;
      this.getSchoolDropdownListByValues(titleFilterValue, classFilterValue);
    } else {
      if(tempInitialClass === null) {
        this.superClass = null
      } else {
        this.superClass = null
        this.filteredValues.class_ids = null;
        this.filteredValues.school_ids = null;  
        this.schoolSuperFilterList = [];      
        this.paginator.pageIndex = 0;
      }
    }
  }

  selectSchoolSuperFilter(){
    const schoolFilterValue = this.schoolSuperFilter.value;
    const tempInitialSchool = this.filteredValues['school_ids'];

    if(schoolFilterValue && schoolFilterValue.length) {
      this.superSchool = schoolFilterValue
      this.paginator.pageIndex = 0;
    } else {
      if(tempInitialSchool === null) {
          this.superSchool = null
        } else {
          this.superSchool = null
          this.paginator.pageIndex = 0;
        }
    }
  }

  selectAdmissionStatusSuperFilter(){
    const admStatusFilterValue = this.admissionStatusSuperFilter.value;

    if (admStatusFilterValue  && admStatusFilterValue .length) {
      this.superAdmStatus = admStatusFilterValue
      this.paginator.pageIndex = 0;
    } else {
      this.superAdmStatus = null;
    }
  }

  selectRegistrationStatusSuperFilter(){
    const regStatusFilterValue = this.registrationStatusSuperFilter.value;

    if(regStatusFilterValue && regStatusFilterValue.length) {
      this.superRegStatus = regStatusFilterValue
    } else {
      this.superRegStatus = null;
    }
  }

  applyFilter() {
    this.filteredValues.rncp_title_ids = this.superTitle;
    this.filteredValues.class_ids = this.superClass;
    this.filteredValues.school_ids = this.superSchool;
    this.filteredValues.student_title_statuses = this.superAdmStatus;
    this.filteredValues.statuses = this.superRegStatus;

    if (!this.isReset) {
      this.paginator.pageIndex = 0;
      this.sort.direction = '';
      this.sort.active = '';
      this.sort.sortChange.emit({active: '', direction: ''});
      this.getStudentData();
    }
  }

  
  getTitleDropdownList() {
    this.subs.sink = this.rncpTitleService.getTitleDropdownList().subscribe((resp) => {
      if (resp) {
        this.titleSuperFilterList = _.cloneDeep(resp);
      }
    })
  }

  getClassDropdownListByTitle(titleFilterValue?) {
    this.subs.sink = this.rncpTitleService.getClassDropdownList(titleFilterValue).subscribe((resp) => {
      if (resp) {
        this.classSuperFilterList = _.cloneDeep(resp);
        this.classSuperFilterList = _.uniqBy(this.classSuperFilterList, 'name');
      }
    })
  }  
  getSchoolDropdownListByValues(titleFilterValue?, classFilterValue?, statusFilterValue?) {
    this.subs.sink = this.schoolService.getSchoolDropdownList(titleFilterValue, null, statusFilterValue, classFilterValue).subscribe((resp) => {
      if (resp) {
        this.schoolSuperFilterList = _.cloneDeep(resp);
      }
    })
  }

  checkAllSuperFilter(typeFilter){
    if (typeFilter === 'admissionStatus') {
      const admissionStatusSuperFilter = this.admissionStatusSuperFilter.value.length;
      const admissionStatusSuperFilterList = this.admissionStatusSuperFilterList.length;
      if (admissionStatusSuperFilter === admissionStatusSuperFilterList) {
        return true;
      } else {
        return false;
      }
    }

    if (typeFilter === 'registrationStatus') {
      const registrationStatusSuperFilter = this.registrationStatusSuperFilter.value.length;
      const registrationStatusSuperFilterList = this.registrationStatusSuperFilterList.length;
      if (registrationStatusSuperFilter === registrationStatusSuperFilterList) {
        return true;
      } else {
        return false;
      }
    }    

    if (typeFilter === 'title') {
      const titleSuperFilter = this.titleSuperFilter.value.length;
      const titleSuperFilterList = this.titleSuperFilterList.length;
      if (titleSuperFilter === titleSuperFilterList) {
        return true;
      } else {
        return false;
      }
    }

    if (typeFilter === 'class') {
      const classSuperFilter = this.classSuperFilter.value.length;
      const classSuperFilterList = this.classSuperFilterList.length;
      if (classSuperFilter === classSuperFilterList) {
        return true;
      } else {
        return false;
      }
    }

    if (typeFilter === 'school') {
      const schoolSuperFilter = this.schoolSuperFilter.value.length;
      const schoolSuperFilterList = this.schoolSuperFilterList.length;
      if (schoolSuperFilter === schoolSuperFilterList) {
        return true;
      } else {
        return false;
      }
    }
  }

  checkSuperFilterIndeterminate(typeFilter){
    if (typeFilter === 'admissionStatus') {
      const admissionStatusSuperFilter = this.admissionStatusSuperFilter.value.length;
      const admissionStatusSuperFilterList = this.admissionStatusSuperFilterList.length;
      if (admissionStatusSuperFilter !== admissionStatusSuperFilterList && admissionStatusSuperFilter !== 0) {
        return true;
      } else {
        return false;
      }
    }

    if (typeFilter === 'registrationStatus') {
      const registrationStatusSuperFilter = this.registrationStatusSuperFilter.value.length;
      const registrationStatusSuperFilterList = this.registrationStatusSuperFilterList.length;
      if (registrationStatusSuperFilter !== registrationStatusSuperFilterList && registrationStatusSuperFilter !== 0) {
        return true;
      } else {
        return false;
      }
    }    

    if (typeFilter === 'title') {
      const titleSuperFilter = this.titleSuperFilter.value.length;
      const titleSuperFilterList = this.titleSuperFilterList.length;
      if (titleSuperFilter !== titleSuperFilterList && titleSuperFilter !== 0) {
        return true;
      } else {
        return false;
      }
    }

    if (typeFilter === 'class') {
      const classSuperFilter = this.classSuperFilter.value.length;
      const classSuperFilterList = this.classSuperFilterList.length;
      if (classSuperFilter !== classSuperFilterList && classSuperFilter !== 0) {
        return true;
      } else {
        return false;
      }
    }

    if (typeFilter === 'school') {
      const schoolSuperFilter = this.schoolSuperFilter.value.length;
      const schoolSuperFilterList = this.schoolSuperFilterList.length;
      if (schoolSuperFilter !== schoolSuperFilterList && schoolSuperFilter !== 0) {
        return true;
      } else {
        return false;
      }
    }
  }

  selectedAllSuperFilter(typeFilter, event){
    if (typeFilter === 'admissionStatus') {
      const admissionStatusSuperFilterList = this.admissionStatusSuperFilterList.map((type) => type?.key)
      if (event.checked) {
        this.admissionStatusSuperFilter.patchValue(admissionStatusSuperFilterList, { emitEvent: false });
      } else {
        this.admissionStatusSuperFilter.patchValue([], { emitEvent: false });
      }
    }

    if (typeFilter === 'registrationStatus') {
      const registrationStatusSuperFilterList = this.registrationStatusSuperFilterList.map((type) => type?.key)
      if (event.checked) {
        this.registrationStatusSuperFilter.patchValue(registrationStatusSuperFilterList, { emitEvent: false });
      } else {
        this.registrationStatusSuperFilter.patchValue([], { emitEvent: false });
      }
    }  

    if (typeFilter === 'title') {
      const titleSuperFilterList = this.titleSuperFilterList.map((title) => title?._id)
      if (event.checked) {
        this.titleSuperFilter.patchValue(titleSuperFilterList, { emitEvent: false });
      } else {
        this.titleSuperFilter.patchValue([], { emitEvent: false });
      }
    }

    if (typeFilter === 'class') {
      const classSuperFilterList = this.classSuperFilterList.map((cls) => cls?._id);
      if (event.checked) {
        this.classSuperFilter.patchValue(classSuperFilterList, { emitEvent: false });
      } else {
        this.classSuperFilter.patchValue([], { emitEvent: false });
      }
    }

    if (typeFilter === 'school') {
      const schoolSuperFilterList = this.schoolSuperFilterList.map((school) => school?._id)
      if (event.checked) {
        this.schoolSuperFilter.patchValue(schoolSuperFilterList, { emitEvent: false });
      } else {
        this.schoolSuperFilter.patchValue([], { emitEvent: false });
      }
    }
  }

  ngOnDestroy() {
    this.pageTitleService.setTitle('');
    this.subs.unsubscribe();
  }
}
