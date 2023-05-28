import { Component, OnInit, Input, SimpleChanges, OnDestroy, ViewChild, AfterViewInit, OnChanges } from '@angular/core';
import { SubSink } from 'subsink';
import { SchoolService } from 'app/service/schools/school.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialogRef, MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { UntypedFormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { DeactivateStudentDialogComponent } from 'app/students/deactivate-student-dialog/deactivate-student-dialog.component';
import { MailStudentDialogComponent } from 'app/students/mail-student-dialog/mail-student-dialog.component';
import { ExportEsCsvDialogComponent } from 'app/students/export-es-csv-dialog/export-es-csv-dialog.component';
import { StudentsService } from 'app/service/students/students.service';
import { TranslateService } from '@ngx-translate/core';
import { StudentTableData } from 'app/students/student.model';
import { startWith, map, debounceTime, tap } from 'rxjs/operators';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { ExportCsvService } from 'app/service/export-csv/export-csv.service';
import { ApplicationUrls } from 'app/shared/settings';
import { environment } from 'environments/environment';
import * as _ from 'lodash';
import { UtilityService } from 'app/service/utility/utility.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { PermissionService } from 'app/service/permission/permission.service';
import { forkJoin } from 'rxjs';
import {
  SchoolStudentTableEvaluation,
  SchoolStudentTableSubject,
  TestDropdown,
} from 'app/title-rncp/conditions/jury-decision-parameter/jury-decision-parameter.model';
import { ResignationReasonDialogComponent } from 'app/students/resignation-reason-dialog/resignation-reason-dialog.component';
import { SchoolStudentDeactivatedDialogComponent } from '../school-student-deactivated/school-student-deactivated-dialog/school-student-deactivated-dialog.component';
import { Router } from '@angular/router';
import { ValidateStudentDocExpectedComponent } from './validate-student-doc-expected/validate-student-doc-expected.component';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UserService } from 'app/service/user/user.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { ProblematicService } from 'app/service/problematic/problematic.service';
import { TestCreationService } from 'app/service/test/test-creation.service';
import { SendProEvaluationDialogComponent } from 'app/shared/components/send-pro-evaluation-dialog/send-pro-evaluation-dialog.component';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import { CoreService } from 'app/service/core/core.service';
import { ValidateStudentCvPresentationComponent } from './validate-student-cv-presentation/validate-student-cv-presentation.component';
import { IncorrectUsersEmailDialogComponent } from 'app/shared/components/incorrect-users-email-dialog/incorrect-users-email-dialog.component';
import { TransferStudentResignationDialogComponent } from 'app/shared/components/transfer-student-resignation-dialog/transfer-student-resignation-dialog.component';
import { DeactivateStudentResignationDialogComponent } from 'app/shared/components/deactivate-student-resignation-dialog/deactivate-student-resignation-dialog.component';
import { ResignationActiveNonMarkPrevCourseDialogComponent } from 'app/shared/components/resignation-active-non-mark-prev-course-dialog/resignation-active-non-mark-prev-course-dialog.component';
import { SuspendStudentResignationDialogComponent } from 'app/shared/components/suspend-student-resignation-dialog/suspend-student-resignation-dialog.component';
import { ResignationActiveMarkPrevCourseDialogComponent } from 'app/shared/components/resignation-active-mark-prev-course-dialog/resignation-active-mark-prev-course-dialog.component';

interface SearchValue {
  full_name: string;
  status: string;
  job_description: string;
  problematic: string;
  mentor_evaluation: string;
  employability_survey: string;
  toward_administration: string;
  final_transcript: string;
  academic_softskill_status: string;
  student_title_status: string;
  company_status:any
}

@Component({
  selector: 'ms-school-student-table',
  templateUrl: './school-student-table.component.html',
  styleUrls: ['./school-student-table.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class SchoolStudentTableComponent implements OnInit, AfterViewInit, OnDestroy {
  private subs = new SubSink();

  @Input() schoolId: string;
  @Input() status: string;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  isWaitingForResponse = false;
  studentsCount = 0;
  tableWidth: string;
  isAddUser: Boolean;
  isImportStudent: Boolean;
  isImportFormFilled: Boolean;
  studentSelected: any;
  selectedRncpTitleId: string;
  selectedClassId: string;
  exportName: 'Export';
  noData: any;
  isReset = false;
  sortValue = null;
  dataLoaded = false;
  safeStudentUrl;

  selectType;
  userSelected = [];
  userSelectedId = [];
  classData;
  today = new Date();

  evalProFilter = new UntypedFormControl('AllM');
  dataSource = new MatTableDataSource([]);
  selection = new SelectionModel(true, []);
  titleStatusFilter = new UntypedFormControl('AllM');
  displayedColumns: string[] = [
    'select',
    'last_name',
    'status',
    'companyStatus',
    'jobDescription',
    'problematic',
    'mentor',
    'empSurvey',
    'is_thumbups_green',
    'certifier',
    'evaluation',
  ];
  filterColumns: string[] = [
    'selectFilter',
    'nameFilter',
    'statusFilter',
    'compFilter',
    'jobFilter',
    'probFilter',
    'mentorFilter',
    'empSurveyFilter',
    'transcriptFilter',
    'certifierFilter',
    'evaluationFilter',
  ];

  displayedColumnsGrandOral: string[] = [
    'select',
    'last_name',
    'status',
    'companyStatus',
    'jobDescription',
    'problematic',
    'mentor',
    'empSurvey',
    'is_thumbups_green',
    'certifier',
    'cv',
    'gop',
    'evaluation',
  ];
  filterColumnsGrandOral: string[] = [
    'selectFilter',
    'nameFilter',
    'statusFilter',
    'compFilter',
    'jobFilter',
    'probFilter',
    'mentorFilter',
    'empSurveyFilter',
    'transcriptFilter',
    'certifierFilter',
    'cvFilter',
    'gopFilter',
    'evaluationFilter',
  ];

  transcripList = [
    {
      value: '',
      name: 'All',
    },
    {
      value: 'true',
      name: 'OK',
    },
    {
      value: 'false',
      name: 'NOT_OK',
    },
  ];

  maleStudentIcon = '../../../../../assets/img/student_icon.png';
  femaleStudentIcon = '../../../../../assets/img/student_icon_fem.png';
  schoolDeactivateStudentDialog: MatDialogRef<SchoolStudentDeactivatedDialogComponent>;

  filteredValues: SearchValue = {
    full_name: '',
    status: '',
    job_description: '',
    problematic: '',
    mentor_evaluation: '',
    employability_survey: '',
    toward_administration: '',
    final_transcript: '',
    academic_softskill_status: '',
    student_title_status: '',
    company_status:''
  };

  myInnerWidth = 1400;
  nameFilter = new UntypedFormControl('');

  statusFilter = new UntypedFormControl('');
  statusFilterList = [
    { key: 'Active', value: 'active' },
    { key: 'Pending', value: 'pending' },
  ];

  companyFilter = new UntypedFormControl('AllM');
  companyFilterList = [
    { key: 'AllM', value: 'AllM' },
    { key: 'Active Contract', value: 'active' },
    { key: 'No Active Contract', value: 'inactive' },
  ];

  jobFilter = new UntypedFormControl('');
  // jobFilterList = ['Sent to student', 'Sent to school', 'Validated by Academic Dpt'];

  probFilter = new UntypedFormControl('');
  // probFilterList = [
  //   'Sent to student',
  //   'Sent to Acad. Dpt',
  //   'Rejected by Acad Dpt',
  //   'Validated by Acad. Dpt',
  //   'Sent to Certifier',
  //   'Rejected by Certifier',
  //   'Validated by Certifier',
  // ];

  titleStatusFilterList = [
    { key: 'AllM', value: 'AllM' },
    { key: 'current_active', value: 'current_active' },
    { key: 'retaking', value: 'retaking' },
    { key: 'admission', value: 'admission' },
    { key: 'admission_need_validation', value: 'admission_need_validation' },
    { key: 'admission_ask_for_revision', value: 'admission_ask_for_revision' },
  ];

  jobFilterList = [
    { key: 'AllF', value: '' },
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

  mentorFilter = new UntypedFormControl('');
  mentorFilterList = [
    { key: 'AllM', value: '' },
    { key: 'Initial', value: 'initial' },
    { key: 'Sent to Mentor', value: 'sent_to_mentor' },
    { key: 'Filled by Mentor', value: 'filled_by_mentor' },
    { key: 'Validated by Acad Staff', value: 'validated_by_acad_staff' },
    { key: 'Expedited by Acad Staff', value: 'expedited_by_acad_staff' },
  ];

  empSurveyFilter = new UntypedFormControl('');
  empSurveyFilterList = [
    { key: 'AllF', value: 'AllF' },
    { key: 'not_sent', value: 'not_sent' },
    { key: 'Sent To Student', value: 'sent_to_student' },
    { key: 'Completed By Student', value: 'completed_by_student' },
    { key: 'Rejected By Validator', value: 'rejected_by_validator' },
    { key: 'Validated By Validator', value: 'validated_by_validator' },
  ];

  evalProFilterList = [
    { key: 'AllM', value: 'AllM' },
    { key: 'both_sent', value: 'both_sent' },
    { key: 'eval_pro_sent', value: 'eval_pro_sent' },
    { key: 'soft_skill_pro_sent', value: 'soft_skill_pro_sent' },
    { key: 'both_not_sent', value: 'both_not_sent' },
    { key: 'both_opened', value: 'both_opened' },
    { key: 'eval_pro_opened', value: 'eval_pro_opened' },
    { key: 'soft_skill_pro_opened', value: 'soft_skill_pro_opened' },
    { key: 'both_submitted', value: 'both_submitted' },
    { key: 'eval_pro_submitted', value: 'eval_pro_submitted' },
    { key: 'soft_skill_pro_submitted', value: 'soft_skill_pro_submitted' },
  ];

  certifierFilter = new UntypedFormControl('');
  certifierFilterList = [
    { key: 'AllM', value: '' },
    { key: 'Passed', value: 'pass' },
    { key: 'Failed', value: 'failed' },
    { key: 'Eliminated', value: 'eliminated' },
    { key: 'Initial', value: 'initial' },
    { key: 'Re-Take', value: 'retaking' },
    { key: 'Pass after retake', value: 'student_retake_pass' },
    { key: 'FAIL after retake', value: 'student_retake_fail' },
  ];

  // mentorFilterList = ['Sent to student', 'Sent to school', 'Validated by Academic Dpt'];
  // empSurveyFilterList = ['Sent to student', 'Completed by Student', 'Rejected by Acad Dir', 'Validated by Acad Dir'];

  transcriptFilter = new UntypedFormControl('');
  transcriptFilterList = ['OK', 'NOT_OK'];

  // certifierFilterList = ['Eliminated', 'Failed', 'Re-Take', 'Passed'];

  // dialog config
  deactivateStudentDialog: MatDialogRef<DeactivateStudentDialogComponent>;
  mailStudentsDialog: MatDialogRef<MailStudentDialogComponent>;
  exportESCSVDialog: MatDialogRef<ExportEsCsvDialogComponent>;
  deleteStudentConfig: MatDialogConfig = {
    disableClose: true,
    panelClass: 'no-max-height',
    width: '600px',
    maxHeight: '75vh',
  };

  // Dummy data
  tempJobDescription = 'Sent to student';
  tempProblematic = 'Sent to Acad. Dpt';
  tempMentor = 'Validated by Academic Dpt';
  tempEmpSurvey = 'Rejected by Acad Dir';
  tempFinalTranscriptStatus = 'Re-Take';
  testColumns = [];

  subjectsList: SchoolStudentTableSubject[] = [];
  testsList: SchoolStudentTableEvaluation[] = [];
  studentsList: StudentTableData[] = [];
  private timeOutVal: any;
  private intervalVal: any;
  isUserCertifier = false;
  isUserCertifierDir = false;
  isUserADMTC = false;
  isUserAcadir = false;
  isUserAcadAdmin = false;
  isUserADMTCDirMin = false;
  isUserAcadDirMin = false;

  isWaitingForPDF = false;

  // Tutorial Variables
  isTutorialAdded = false;
  dataTutorial: any;
  tutorialData: any;
  isPermission: any;
  isConnect=false

  constructor(
    private studentService: StudentsService,
    private schoolService: SchoolService,
    private translate: TranslateService,
    private exportCsvService: ExportCsvService,
    public dialog: MatDialog,
    private utilityService: UtilityService,
    private permissions: NgxPermissionsService,
    public permissionService: PermissionService,
    private router: Router,
    private authService: AuthService,
    private userService: UserService,
    private titleService: RNCPTitlesService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private problematicService: ProblematicService,
    private rncpTitlesService: RNCPTitlesService,
    private testCreationService: TestCreationService,
    public coreService: CoreService,
    public tutorialService: TutorialService,
  ) { }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (this.selectedRncpTitleId && this.selectedClassId && this.schoolId && !this.isReset) {
            this.getDataFromParam();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
  }

  ngOnInit() {
    this.safeStudentUrl = `${environment.studentEnvironment}/session/login`;
    this.isPermission = this.authService.getPermission();


    this.isUserCertifier = this.permissions.getPermission('Certifier Admin') ? true : false;
    this.isUserCertifierDir = this.permissions.getPermission('CR School Director') ? true : false;
    this.isUserAcadir = this.permissions.getPermission('Academic Director') ? true : false;
    this.isUserAcadAdmin = this.permissions.getPermission('Academic Admin') ? true : false;
    this.isUserADMTC = this.permissions.getPermission('Academic Director') ? true : false;
    this.isUserADMTCDirMin = this.utilityService.isUserEntityADMTC();
    this.isUserAcadDirMin = this.utilityService.isUserAcadDirAdmin();

    this.subs.sink = this.schoolService.selectedStudentName$.subscribe((res) => {
      if (res) {
        this.filteredValues.full_name = res;
        if (this.selectedRncpTitleId && this.selectedClassId && this.schoolId) {
          this.paginator.pageIndex = 0;
          this.getDataFromParam();
        }
      }
    });

    this.subs.sink = this.schoolService.selectedRncpTitleId$.subscribe((id) => {

      this.selectedRncpTitleId = id;
    });
    this.subs.sink = this.schoolService.selectedClassId$.subscribe((id) => {

      this.selectedClassId = id;

      if (this.selectedRncpTitleId && this.selectedClassId && this.schoolId) {
        this.paginator.pageIndex = 0;
        this.getDataFromParam();
      }
    });
    this.subs.sink = this.schoolService.addNewStudent$.subscribe((resp) => {
      this.isAddUser = resp;

    });
    this.subs.sink = this.schoolService.importStudent$.subscribe((resp) => {
      this.isImportStudent = resp;

    });
    this.subs.sink = this.schoolService.importFormFilled$.subscribe((resp) => {
      this.isImportFormFilled = resp;

    });

    this.initFilter();
    // this.triggerFilter();
  }

  getDataFromParam() {
    this.isWaitingForResponse = true;
    const forkParam = [];
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    const filter = this.cleanFilterData();

    // get evaluation/test data for table's column header
    const subjectsGet = this.studentService.GetAllSubjects(this.selectedRncpTitleId, this.selectedClassId);
    forkParam.push(subjectsGet);
    // get student data for table data
    const studentsGet = this.studentService.getStudentsbyClassTitle(
      this.selectedRncpTitleId,
      this.selectedClassId,
      this.schoolId,
      this.status,
      pagination,
      this.sortValue,
      filter,
    );
    forkParam.push(studentsGet);
    // get class data, to check if problematic and job desc already pass activation date or not
    const classGet = this.titleService.getClassById(this.selectedClassId);
    forkParam.push(classGet);

    this.subs.sink = forkJoin(forkParam).subscribe((response: any) => {
      this.isWaitingForResponse = false;
      this.isReset = false;
      const resp = _.cloneDeep(response);
      if (resp && resp.length) {
        let count = 0;
        resp.forEach((responseEach) => {
          if (responseEach && count === 0) {
            this.subjectsList = responseEach;
            count++;
          } else if (responseEach && count === 1) {
            this.studentsList = responseEach;
            count++;
          } else if (responseEach && count === 2) {
            this.classData = responseEach;
            count++;
          }
        });
        this.getEvaluationData();
        this.setStudentTableData();
      } else {
        this.dataSource.data = [];
        this.paginator.pageIndex = 0;
        this.studentsCount = 0;
        this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
      }

      // To fetch tutorial data
      if (!this.tutorialData) {

        let tutorialType = '';
        switch (this.status) {
          case 'active_pending':
            tutorialType = 'Active students';
            break;
          case 'completed':
            tutorialType = 'Completed students';
            break;
          case 'suspended':
            tutorialType = 'Suspended students';
            break;
          default:
            break;
        }
        this.getInAppTutorial(tutorialType);
      }
    });
  }

  getInAppTutorial(type) {
    // const permission = this.isPermission && this.isPermission.length && this.isPermission[0] ? this.isPermission[0] : [];
    const currentUser = this.authService.getLocalStorageUser();
    const userType = currentUser.entities[0].type.name;
    this.subs.sink = this.tutorialService.GetAllInAppTutorialsByModule(type, userType).subscribe((list) => {
      if (list && list.length) {
        this.dataTutorial = list;
        const tutorialData = this.dataTutorial.filter((tutorial) => {
          return tutorial.is_published === true && tutorial.module === type;
        });
        this.tutorialData = tutorialData[0];
        if (this.tutorialData) {
          this.isTutorialAdded = true;
        } else {
          this.isTutorialAdded = false;
        }
      }
    });
  }

  toggleTutorial(data) {
    this.tutorialService.setTutorialView(data);
    if (this.coreService.sidenavOpen) {
      this.coreService.sidenavOpen = !this.coreService.sidenavOpen;
    }
    this.coreService.sidenavTutorialOpen = !this.coreService.sidenavTutorialOpen;
  }

  cleanFilterData() {
    const filterData = _.cloneDeep(this.filteredValues);
    let filterQuery = '';
    Object.keys(filterData).forEach((key) => {

      // only add key that has value to the query. so it wont send filter with empty string
      if (filterData[key]) {
        if (key === 'full_name') {
          filterQuery = filterQuery + ` ${key}:"${filterData[key]}"`;
        } else {
          filterQuery = filterQuery + ` ${key}:${filterData[key]}`;
        }
      }
    });
    return 'filter: {' + filterQuery + '}';
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
    Swal.fire({
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
    }).then((inputValue) => {
      if (inputValue.value) {
        this.schoolDeactivateStudentDialog = this.dialog.open(SchoolStudentDeactivatedDialogComponent, {
          panelClass: 'certification-rule-pop-up',
          disableClose: true,
          width: '500px',
          data: data,
        });
        this.subs.sink = this.schoolDeactivateStudentDialog.afterClosed().subscribe((result) => {
          if (result) {
            this.getDataFromParam();
            this.schoolDeactivateStudentDialog = null;
          }
        });
      }
    });
  }

  // *************** To Get Width window screen and put in style css height
  getAutomaticWidth() {
    this.myInnerWidth = window.innerWidth - 240;
    return this.myInnerWidth;
  }

  getTableWidth() {
    // all of number in static column width you can find in scss file that has selector .mat-column-blablabla
    const staticColumnWidth = 50 + 250 + 60 * 8 + 80 + 170;

    // calculate dynamic column width, "60" is width in px of column U1, U2, etc. so it represent 60px of width.
    const dynamicColumnWidth = 60 * this.testsList.length;

    // then combine static column with dynamic column so we get overall table width.
    const totalWidthInPx = (staticColumnWidth + dynamicColumnWidth).toString() + 'px';
    return totalWidthInPx;
  }

  changePage(event: PageEvent) {
    // this.getDataFromParam();
  }

  sortData(sort: Sort) {
    // dynamically set key property of sort object
    this.sortValue = sort.active && sort.direction ? { [sort.active]: sort.direction } : null;
    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getDataFromParam();
      }
    }
  }

  removeTestWithNoMark() {


    // check if all students has no mark for a test(evaluation), then remove that test from testsList array
    // if there is one student already has mark for that test, then dont remove that test from testsList array
    this.testsList = this.testsList.filter((evaluation) => {
      let isAnyStudentHasMark = false;
      for (const student of this.studentsList) {
        student.tests_result = student.tests_result && student.tests_result.length ? student.tests_result : [];
        // check if student has mark for this test(evaluation)
        const testResultExist = student.tests_result.find((testRes) => testRes.evaluation._id === evaluation._id);
        if (testResultExist) {
          isAnyStudentHasMark = true;
          break;
        }
      }
      return isAnyStudentHasMark;
    });
    // for expertise class, we only need to show column that at least 1 student has document_expected
    if (this.classData.type_evaluation === 'expertise') {
      // check if all students has no document_expected for a test(evaluation), then remove that test from testsList array
      this.testsList = this.testsList.filter((evaluation, evalIndex) => {
        let isAnyStudentHasDocExpected = false;
        for (const student of this.studentsList) {
          // find the current corrected_tests by comparing student's corrected_tests evaluation id with testsList's evaluation id
          student.corrected_tests = student.corrected_tests ? student.corrected_tests : [];
          const currentCorrectedTest = student.corrected_tests.filter((correctedTest) => {
            return correctedTest.test && correctedTest.test.evaluation_id && correctedTest.test.evaluation_id._id === evaluation._id;
          });
          // if there is any document expected, show the column
          if (
            currentCorrectedTest.length > 0 &&
            currentCorrectedTest[0].correction &&
            currentCorrectedTest[0].correction.expected_documents &&
            currentCorrectedTest[0].correction.expected_documents.length > 0 &&
            currentCorrectedTest[0].correction.expected_documents[0].validation_status
          ) {
            isAnyStudentHasDocExpected = true;
            break;
          }
        }
        return isAnyStudentHasDocExpected;
      });
    }

  }

  getEvaluationData() {
    this.testsList = [];
    if (this.subjectsList && this.subjectsList.length) {
      // sort subject by order
      this.subjectsList.sort((a, b) => a.order - b.order);
      this.subjectsList.forEach((subject) => {
        // sort evaluation/test on each subjects by order
        subject.evaluations.sort((a, b) => a.order - b.order);
        // add evaluation/test on each subjects to testsList array
        this.testsList.push(...subject.evaluations);
      });
    }

    this.removeTestWithNoMark();

    if (this.status === 'active_pending') {
      if (this.testsList && this.testsList.length) {
        this.testColumns = [];
        this.resetColumnDefault();
        for (let i = 0; i <= this.testsList.length - 1; i++) {
          this.testColumns.push((i + 1).toString());
          this.displayedColumns.push((i + 1).toString());
          this.filterColumns.push((i + 1).toString() + 'filter');
        }
      }
      if (!this.displayedColumns.includes('titleStatus') && !this.filterColumns.includes('titleStatusFilter')) {
        this.displayedColumns.push('titleStatus');
        this.filterColumns.push('titleStatusFilter');
      }
      if (!this.displayedColumns.includes('action') && !this.filterColumns.includes('actionFilter')) {
        this.displayedColumns.push('action');
        this.filterColumns.push('actionFilter');
      }
      this.displayedColumns = _.uniqBy(this.displayedColumns);
      this.filterColumns = _.uniqBy(this.filterColumns);
      this.tableWidth = this.getTableWidth();



    } else {
      this.testColumns = [];
      this.resetColumnDefault();
      this.testsList = [];
      this.displayedColumns.push('action');
      this.filterColumns.push('actionFilter');
      this.tableWidth = this.getTableWidth();
    }
  }

  setStudentTableData() {
    let isAllSelected = false;
    if (this.isAllSelected() && this.dataSource && this.dataSource.data && this.dataSource.data.length) {
      isAllSelected = true;
    }

    // Filtering CSV document and Presentation Document to only active and match title & class
    this.studentsList = this.studentsList.map((student) => {
      const tempStudent = _.cloneDeep(student);
      if (tempStudent['student_cv'] && tempStudent['student_cv'].length) {
        tempStudent['student_cv'] = tempStudent['student_cv']
          .filter(
            (cv) =>
              cv &&
              cv.parent_rncp_title &&
              cv.parent_rncp_title._id === this.selectedRncpTitleId &&
              cv.parent_class_id &&
              cv.parent_class_id.find((classData) => classData && classData._id === this.selectedClassId),
          )
          .reverse();
        tempStudent['student_presentation'] = tempStudent['student_presentation']
          .filter(
            (cv) =>
              cv &&
              cv.parent_rncp_title &&
              cv.parent_rncp_title._id === this.selectedRncpTitleId &&
              cv.parent_class_id &&
              cv.parent_class_id.find((classData) => classData && classData._id === this.selectedClassId),
          )
          .reverse();
      }
      return tempStudent;
    });

    this.assignStudentMarkForEachColumn();

    const temp = _.cloneDeep(this.studentsList)
    if(temp&&temp.length){
      temp.forEach(student => {
        if (student && student.companies && student.companies.length) {
          const findActiveCompany = student.companies.find(company => company.status === 'active')
          if (findActiveCompany) {
            student.isActive = true
          } else {
            student.isActive = false
          }
        } else {
          student.isActive = false
        }
      })
    }
    this.dataSource.data = temp;

    this.studentsCount = this.studentsList && this.studentsList.length ? this.studentsList[0].count_document : 0;
    this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));

    if (isAllSelected) {
      this.selection.clear();
      this.dataSource.data.forEach((row) => this.selection.select(row._id));
    }
  }

  assignStudentMarkForEachColumn() {
    // create test_columns field in student to give data for each columns U1, U2, U3 in the table
    this.studentsList.forEach((student) => {
      student['test_columns'] = [];
      this.testsList.forEach((evaluation, evalIndex) => {
        // assign the data for test_columns by getting data from student's tests_result
        const testResult = student.tests_result.find((result) => result.evaluation._id === evaluation._id && !!result.test_correction);
        student['test_columns'].push(testResult ? testResult : null);
      });
    });

  }

  initFilter() {
    this.subs.sink = this.nameFilter.valueChanges.pipe(debounceTime(400)).subscribe((statusSearch) => {
      const symbol = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      if (!statusSearch.match(symbol) && !statusSearch.match(symbol1)) {
        this.filteredValues.full_name = statusSearch ? statusSearch.toLowerCase() : '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.selection.clear();
          this.getDataFromParam();
        }
      } else {
        this.nameFilter.setValue('');
        this.filteredValues.full_name = '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.selection.clear();
          this.getDataFromParam();
        }
      }
    });
    this.subs.sink = this.statusFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.status = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.selection.clear();
        this.getDataFromParam();
      }
    });
    this.subs.sink = this.titleStatusFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.student_title_status = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.selection.clear();
        this.getDataFromParam();
      }
    });
    this.subs.sink = this.jobFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.job_description = statusSearch === 'AllF' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.selection.clear();
        this.getDataFromParam();
      }
    });
    this.subs.sink = this.probFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.problematic = statusSearch === 'AllF' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.selection.clear();
        this.getDataFromParam();
      }
    });
    this.subs.sink = this.mentorFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.mentor_evaluation = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.selection.clear();
        this.getDataFromParam();
      }
    });
    this.subs.sink = this.empSurveyFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.employability_survey = statusSearch === 'AllF' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.selection.clear();
        this.getDataFromParam();
      }
    });
    this.subs.sink = this.transcriptFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.toward_administration = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.selection.clear();
        this.getDataFromParam();
      }
    });
    this.subs.sink = this.certifierFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.final_transcript = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.selection.clear();
        this.getDataFromParam();
      }
    });
    this.subs.sink = this.evalProFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.academic_softskill_status = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getDataFromParam();
      }
    });
    this.subs.sink = this.companyFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.company_status = statusSearch === 'AllM' ? null : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getDataFromParam();
      }
    });
  }

  exportCSV() {
    const inputOptions = {
      ',': this.translate.instant('Export_S1.COMMA'),
      ';': this.translate.instant('Export_S1.SEMICOLON'),
      tab: this.translate.instant('Export_S1.TAB'),
    };

    Swal.fire({
      type: 'question',
      allowOutsideClick: false,
      title: this.translate.instant('Export_S1.TITLE'),
      allowEscapeKey: true,
      confirmButtonText: this.translate.instant('Export_S1.OK'),
      input: 'radio',
      inputOptions: inputOptions,
      inputValidator: (value) => {
        return new Promise((resolve, reject) => {
          if (value) {
            // resolve();
          } else {
            reject(this.translate.instant('Export_S1.INVALID'));
          }
        });
      },
    }).then((data) => {
      // this.exportStudents();
    });
  }

  exportESCSV() {
    this.exportESCSVDialog = this.dialog.open(ExportEsCsvDialogComponent, {
      disableClose: true,
      width: '600px',
      data: this.dataSource.data,
    });
  }

  onResignationStudend(selectedStudent){
    this.isWaitingForResponse = true;
    this.subs.sink = this.studentService.checkAllowDeactivateStudent(selectedStudent._id).subscribe((student) => {
      this.isWaitingForResponse = false;
      if(student === 'ResignationStud_S1'){
        const studentData = { ...selectedStudent, transfer_from: 'ResignationStud_S1' }
        this.swalResignationStudS1(studentData);
      } else if (student === 'ResignationStud_S2'){
        const studentData = { ...selectedStudent, transfer_from: 'ResignationStud_S2' }
        this.swalResignationStudS2(studentData);
      } else if (student === 'ResignationStud_S3'){
        const studentData = { ...selectedStudent, transfer_from: 'ResignationStud_S3' }
        this.dialogResignationStudS3(studentData);
      } else if (student === 'ResignationStud_S4'){
        const studentData = { ...selectedStudent, transfer_from: 'ResignationStud_S4' }
        this.dialogResignationStudS4(studentData);
      }
    });
  }

  swalResignationStudS1(studentData){
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('RESIGNATION_STUD_S1_BLOCK.TITLE'),
      html: this.translate.instant('RESIGNATION_STUD_S1_BLOCK.TEXT', {
        civ : this.translate.instant(studentData.civility),
        fname : studentData.first_name,
        lname : studentData.last_name,
        schoolcommercialname : studentData.school.short_name,
        titlecommercialname : studentData.rncp_title.short_name,
        classname : studentData.current_class.name,
        ft_status : this.translate.instant('certification.' + studentData?.final_transcript_id?.jury_decision_for_final_transcript)
      }),
      confirmButtonText: '<span style="color: #323232">' + this.translate.instant('RESIGNATION_STUD_S1_BLOCK.BUTTON') + '</span>',
      confirmButtonColor: '#ffd740',
      cancelButtonText: this.translate.instant('DEACTIVATEDSUCCESS.DEACTIVATEDSTUDENTACTION.Cancel'),
      cancelButtonColor: '#ff4040',
      showCancelButton: true,
      footer: `<span style="margin-left: auto">RESIGNATIONSTUD_S1</span>`,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
      width: 800
    }).then((resp) => {
      if(resp?.value) {
        this.subs.sink = this.dialog.open(TransferStudentResignationDialogComponent, {
          disableClose: true,
          panelClass: 'certification-rule-pop-up',
          width: '750px',
          data: studentData
        }).afterClosed().subscribe((resp) => {
          if (resp) {
            this.getDataFromParam()
          }
        }) 
      }
    })
  }

  swalResignationStudS2(studentData){
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('RESIGNATION_STUD_S1_BLOCK.TITLE'),
      html: this.translate.instant('RESIGNATION_STUD_S2_BLOCK.TEXT',{
        civ : this.translate.instant(studentData.civility),
        fname : studentData.first_name,
        lname : studentData.last_name,
        schoolcommercialname : studentData.school.short_name,
        titlecommercialname : studentData.rncp_title.short_name,
        classname : studentData.current_class.name
      }),
      confirmButtonText: this.translate.instant('RESIGNATION_STUD_S2_BLOCK.BUTTON_CONFRIM'),
      showCancelButton: false,
      footer: `<span style="margin-left: auto">RESIGNATIONSTUD_S2</span>`,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
      width: 800
    })
  }

  dialogResignationStudS3(studentData){
    this.dialog.open(ResignationActiveMarkPrevCourseDialogComponent,{
      disableClose: true,
      width: '1000px',
      panelClass: 'certification-rule-pop-up',
      data: studentData
    }).afterClosed().subscribe((resp)=>{
      if(resp?.action === 'transfer'){
        delete resp?.action;
        this.subs.sink = this.dialog.open(TransferStudentResignationDialogComponent, {
          disableClose: true,
          panelClass: 'certification-rule-pop-up',
          width: '750px',
          data: { ...resp }
        }).afterClosed().subscribe((resp) => {
          if (resp) {
            this.getDataFromParam()
          }
        }) 
      } else if(resp?.action === 'suspend') {
        delete resp?.action;
        this.subs.sink = this.dialog.open(SuspendStudentResignationDialogComponent, {
          disableClose: true,
          panelClass: 'certification-rule-pop-up',
          width: '650px',
          data: { ...resp }
        }).afterClosed().subscribe((resp) => {
          if (resp) {
            this.getDataFromParam()
          }
        }) 
      }
    });
  }

  dialogResignationStudS4(studentData){
    this.subs.sink = this.dialog.open(ResignationActiveNonMarkPrevCourseDialogComponent, {
      disableClose: true,
      panelClass: 'certification-rule-pop-up',
      width: '750px',
      data: { ...studentData }
    }).afterClosed().subscribe((resp) => {
      if(resp?.action === 'transfer') {
        delete resp?.action;
        this.subs.sink = this.dialog.open(TransferStudentResignationDialogComponent, {
          disableClose: true,
          panelClass: 'certification-rule-pop-up',
          width: '750px',
          data: { ...resp }
        }).afterClosed().subscribe((resp) => {
          if (resp) {
            this.getDataFromParam()
          }
        }) 
      } else if (resp?.action === 'deactivate') {
        delete resp?.action;
        this.subs.sink = this.dialog.open(DeactivateStudentResignationDialogComponent, {
          disableClose: true,
          panelClass: 'certification-rule-pop-up',
          width: '600px',
          data: {...resp}
        }).afterClosed().subscribe((resp) => {
          if (resp) {
            this.getDataFromParam()
          }
        }) 
      }
    })
  }

  // deactivateStudent(selectedStudent) {
    // Swal.fire({
    //   type: 'error',
    //   title: this.translate.instant('DEACTIVATE_STUDENT_BLOCK.TITLE'),
    //   html: this.translate.instant('DEACTIVATE_STUDENT_BLOCK.TEXT'),
    //   confirmButtonText: this.translate.instant('DEACTIVATE_STUDENT_BLOCK.BUTTON'),
    //   allowEnterKey: false,
    //   allowEscapeKey: false,
    //   allowOutsideClick: false,
    // });

    // ************** On 15/03/2021, Block the deactivated Student for now and display the SWAL DEACTIVATE_STUDENT_BLOCK
  //   let timeDisabled = 5;
  //   Swal.fire({
  //     title: this.translate.instant('DEACTIVATEDSUCCESS.CONFIRMDEACTIVETITLE'),
  //     html: this.translate.instant('DEACTIVATEDSUCCESS.CONFIRMDEACTIVE', {
  //       Civility: this.translate.instant(selectedStudent.civility),
  //       LName: selectedStudent.last_name,
  //       FName: selectedStudent.first_name,
  //     }),
  //     type: 'warning',
  //     allowEscapeKey: true,
  //     showCancelButton: true,
  //     confirmButtonClass: 'btn-danger',
  //     allowOutsideClick: false,
  //     confirmButtonText: this.translate.instant('DEACTIVATEDSUCCESS.DEACTIVATEDSTUDENTACTION.Resignation', { timer: timeDisabled }),
  //     cancelButtonText: this.translate.instant('DEACTIVATEDSUCCESS.DEACTIVATEDSTUDENTACTION.Cancel'),
  //     onOpen: () => {
  //       Swal.disableConfirmButton();
  //       const confirmBtnRef = Swal.getConfirmButton();
  //       this.intervalVal = setInterval(() => {
  //         timeDisabled -= 1;
  //         confirmBtnRef.innerText =
  //           this.translate.instant('DEACTIVATEDSUCCESS.DEACTIVATEDSTUDENTACTION.Resignation') + ' in ' + timeDisabled + ' sec';
  //       }, 1000);

  //       this.timeOutVal = setTimeout(() => {
  //         confirmBtnRef.innerText = this.translate.instant('DEACTIVATEDSUCCESS.DEACTIVATEDSTUDENTACTION.Resignation');
  //         Swal.enableConfirmButton();
  //         // clearTimeout(time);
  //         clearInterval(this.intervalVal);
  //       }, timeDisabled * 1000);
  //       // clearTimeout(this.timeOutVal);
  //     },
  //   }).then((result) => {
  //     if (result.value) {
  //       this.deactivateStudentDialog = this.dialog.open(DeactivateStudentDialogComponent, {
  //         ...this.deleteStudentConfig,
  //         data: { studentDetails: selectedStudent },
  //       });
  //       this.deactivateStudentDialog.afterClosed().subscribe((res) => {
  //         if (res) {
  //           this.getDataFromParam();
  //           this.selection.clear();
  //         }
  //       });
  //     }
  //   });
  // }

  requestStudEmailCorrection(student) {

    Swal.fire({
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
      allowOutsideClick: false,
      cancelButtonText: this.translate.instant('CANCEL'),
    }).then((res) => {
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
          .subscribe((resp) => (resp ? this.getDataFromParam() : null));
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
                this.getDataFromParam();
              }
            },
            (err) => {
              const text = String(err);
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

              Swal.fire({
                type: 'error',
                title: 'Error !',
                text: alert,
              });
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
                this.getDataFromParam();
              }
            },
            (err) => {
              const text = String(err);
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

              Swal.fire({
                type: 'error',
                title: 'Error !',
                text: alert,
              });
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
  masterToggle(event: MatCheckboxChange) {

    if (event && event.checked) {
      this.selectType = 'all';
      this.isAllSelected() ? this.selection.clear() : this.dataSource.data.forEach((row) => this.selection.select(row._id));
    } else {
      this.selectType = 'one';
      this.selection.clear();
    }
  }

  resetFilter() {
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });

    this.filteredValues = {
      full_name: '',
      status: '',
      job_description: '',
      problematic: '',
      mentor_evaluation: '',
      employability_survey: '',
      toward_administration: '',
      final_transcript: '',
      academic_softskill_status: '',
      student_title_status: '',
      company_status:''
    };

    this.nameFilter.setValue('');
    this.statusFilter.setValue('');
    this.jobFilter.setValue('');
    this.probFilter.setValue('');
    this.mentorFilter.setValue('');
    this.empSurveyFilter.setValue('');
    this.transcriptFilter.setValue('');
    this.certifierFilter.setValue('');
    this.statusFilter.setValue('');
    this.titleStatusFilter.setValue('');
    this.companyFilter.setValue('AllM', { emitEvent: false });

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    this.selection.clear();
    this.getDataFromParam();
  }

  resetColumnDefault() {
    if (this.studentsList && this.studentsList.length && this.studentsList[0]['is_grand_oral_started']) {
      this.displayedColumns = [
        'select',
        'last_name',
        'status',
        'companyStatus',
        'jobDescription',
        'problematic',
        'mentor',
        'empSurvey',
        'is_thumbups_green',
        'certifier',
        'cv',
        'gop',
        'evaluation',
      ];
      this.filterColumns = this.filterColumns = [
        'selectFilter',
        'nameFilter',
        'statusFilter',
        'compFilter',
        'jobFilter',
        'probFilter',
        'mentorFilter',
        'empSurveyFilter',
        'transcriptFilter',
        'certifierFilter',
        'cvFilter',
        'gopFilter',
        'evaluationFilter',
      ];
    } else {
      this.displayedColumns = [
        'select',
        'last_name',
        'status',
        'companyStatus',
        'jobDescription',
        'problematic',
        'mentor',
        'empSurvey',
        'is_thumbups_green',
        'certifier',
        'evaluation',
      ];
      this.filterColumns = [
        'selectFilter',
        'nameFilter',
        'statusFilter',
        'compFilter',
        'jobFilter',
        'probFilter',
        'mentorFilter',
        'empSurveyFilter',
        'transcriptFilter',
        'certifierFilter',
        'evaluationFilter',
      ];
    }
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

  goToStudentDetail(student) {
    // Student detail component hasnt exist yet

    // this.studentSelected = student;
    // this.schoolService.setCurrentStudentId(student._id);
    // this.router.navigate(['/school', student.school._id], {
    //   queryParams: { title: student.rncp_title._id, class: this.selectedClassId, student: student._id, open: 'student-cards' },
    // });
    window.open(
      `./school/${student.school._id}?title=${student.rncp_title._id}&class=${student.current_class._id}&student=${student._id}&open=student-cards`,
      '_blank',
    );
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    clearInterval(this.intervalVal);
    this.subs.unsubscribe();
  }

  exportData() {
    const data = [];
    if (this.dataSource.data) {
      for (const item of this.dataSource.data) {
        const obj = [];

        const uValue = 9;

        // TODO: From the template get the data location and add the data
        obj[0] = item.last_name + ' ' + item.first_name + ' ' + item.civility;
        obj[1] = item.status;
        obj[2] = this.tempJobDescription;
        obj[3] = this.tempProblematic;
        obj[4] = this.tempMentor;
        obj[5] = this.tempEmpSurvey;
        obj[6] = item.is_thumbups_green;
        obj[7] = this.tempFinalTranscriptStatus;
        obj[8] = uValue;
        obj[9] = uValue;
        obj[10] = uValue;
        obj[11] = uValue;
        obj[12] = uValue;
        obj[13] = uValue;
        obj[14] = uValue;
        obj[15] = uValue;
        obj[16] = uValue;
        obj[17] = uValue;
        obj[18] = uValue;
        obj[19] = uValue;
        obj[20] = uValue;
        obj[21] = uValue;
        obj[22] = uValue;
        obj[23] = uValue;
        obj[24] = uValue;
        obj[25] = uValue;
        obj[26] = uValue;
        obj[27] = uValue;
        obj[28] = uValue;
        obj[29] = uValue;
        obj[30] = uValue;
        obj[31] = uValue;
        obj[32] = uValue;
        obj[33] = uValue;
        obj[34] = uValue;
        obj[35] = uValue;
        obj[36] = uValue;
        obj[37] = uValue;
        obj[38] = uValue;
        obj[39] = uValue;
        obj[40] = uValue;
        obj[41] = uValue;
        obj[42] = uValue;
        obj[43] = uValue;
        obj[44] = uValue;
        obj[45] = uValue;
        obj[46] = uValue;
        obj[47] = uValue;
        data.push(obj);
      }

      const valueRange = { values: data };
      const today = moment().format('DD-MM-YYYY');
      const title = this.exportName + '_' + today;
      const sheetID = this.translate.currentLang === 'en' ? 0 : 136141499;
      const sheetData = {
        spreadsheetId: '1f0cE3dQjaJ-_3rVO6mi8GcuXTBQiO1KWl-A9gRryAkU',
        sheetId: sheetID,
        range: 'A7',
      };
      this.exportCsvService.createAndUpdateSpreadsheet(valueRange, title, sheetData);
      Swal.close();
    }
  }

  getTestDocStatus(correctedTests, subjectTestId): string {
    let statusDoc = '';
    if (correctedTests) {
      const currentCorrectedTest = correctedTests.filter(function (correctedTest) {
        return correctedTest.test && correctedTest.test.evaluation_id && correctedTest.test.evaluation_id._id === subjectTestId;
      });

      if (
        currentCorrectedTest.length > 0 &&
        currentCorrectedTest[0].correction &&
        currentCorrectedTest[0].correction.expected_documents &&
        currentCorrectedTest[0].correction.expected_documents.length > 0
      ) {
        const docValidated = currentCorrectedTest[0].correction.expected_documents.filter((resp) => {
          return resp.validation_status === 'validated' || resp.validation_status === 'uploaded';
        });
        if (docValidated && docValidated.length) {
          statusDoc = docValidated[0].validation_status;
        } else {
          statusDoc = currentCorrectedTest[0].correction.expected_documents[0].validation_status;
        }
        return statusDoc;
      }
    }

    return 'initial';
  }

  openUploadedDocument(correctedTests, subjectTestId) {
    let url = environment.apiUrl;
    const currentCorrectedTest = correctedTests.filter(function (correctedTest) {
      return correctedTest.test && correctedTest.test.evaluation_id._id === subjectTestId;
    });
    if (
      currentCorrectedTest.length > 0 &&
      currentCorrectedTest[0].correction.expected_documents &&
      currentCorrectedTest[0].correction.expected_documents.length > 0
    ) {
      const docValidated = currentCorrectedTest[0].correction.expected_documents.filter((resp) => {
        return resp.validation_status === 'validated' || resp.validation_status === 'uploaded';
      });
      if (docValidated && docValidated.length) {
        const doc = docValidated[0].document;
        url = `${environment.apiUrl}/fileuploads/${doc.s3_file_name}?download=true`.replace('/graphql', '');
        window.open(url, '_blank');
      }
    }
  }

  rejectOrValidateDoc(event, correctedTests, subjectTestId, studentId) {
    event.preventDefault();
    const currentCorrectedTest = correctedTests.filter(function (correctedTest) {
      return correctedTest.test && correctedTest.test.evaluation_id._id === subjectTestId;
    });


    if (
      currentCorrectedTest.length > 0 &&
      currentCorrectedTest[0].correction.expected_documents &&
      currentCorrectedTest[0].correction.expected_documents[0] &&
      currentCorrectedTest[0].correction.expected_documents[0].document &&
      currentCorrectedTest[0].test &&
      currentCorrectedTest[0].test._id &&
      currentCorrectedTest[0].correction &&
      currentCorrectedTest[0].correction._id &&
      studentId
    ) {
      let doc = {
        _id: '',
        s3_file_name: '',
      };
      const docValidated = currentCorrectedTest[0].correction.expected_documents.filter((resp) => {
        return resp.validation_status === 'validated' || resp.validation_status === 'uploaded';
      });
      if (docValidated && docValidated.length) {
        doc = docValidated[0].document;
      } else {
        doc = currentCorrectedTest[0].correction.expected_documents[0].document;
      }

      this.isWaitingForResponse = true;
      // Check the limitation to edit document
      this.subs.sink = this.studentService.getLimitationForDocument(doc._id).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          if (resp && resp.acad_allow) {
            this.dialog
              .open(ValidateStudentDocExpectedComponent, {
                panelClass: 'certification-rule-pop-up',
                width: '450px',
                data: {
                  docId: doc._id,
                  studentId: studentId,
                  testId: currentCorrectedTest[0].test._id,
                  correctionId: currentCorrectedTest[0].correction._id,
                  docData: currentCorrectedTest[0],
                },
              })
              .afterClosed()
              .subscribe((result) => {
                if (result) {
                  this.getDataFromParam();
                }
              });
          } else {
            Swal.fire({
              type: 'error',
              title: this.translate.instant('DELETEDOC_S3.TITLE'),
              html: this.translate.instant('DELETEDOC_S3.TEXT', {
                docName: currentCorrectedTest[0].correction.expected_documents[0].document_name,
                dueDate: this.parseUTCToLocalPipe.transformDate(resp.due_date.date, resp.due_date.time),
              }),
              confirmButtonText: this.translate.instant('DELETEDOC_S3.BUTTON'),
            });
          }
        },
        (err) => {
          this.isWaitingForResponse = false;
        },
      );
    }
  }

  openCVPresentation(doc, type) {
    let url = environment.apiUrl;
    if (type === 'cv') {
      url = `${environment.apiUrl}/fileuploads/${doc.s3_file_name}?download=true`.replace('/graphql', '');
      window.open(url, '_blank');
    } else if (type === 'gop') {
      url = `${environment.apiUrl}/fileuploads/${doc.s3_file_name}?download=true`.replace('/graphql', '');
      window.open(url, '_blank');
    }
  }

  rejectOrValidateCVPresentation(event, document, student, type) {
    event.preventDefault();
    if (
      document &&
      (document.presentation_document_status === 'validated' ||
        document.presentation_document_status === 'uploaded' ||
        document.cv_document_status === 'validated' ||
        document.cv_document_status === 'uploaded')
    ) {
      this.isWaitingForResponse = true;
      // Check the limitation to edit document
      this.subs.sink = this.studentService.getLimitationForDocument(document._id).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          if (resp && resp.acad_allow) {
            this.dialog
              .open(ValidateStudentCvPresentationComponent, {
                panelClass: 'certification-rule-pop-up',
                width: '450px',
                data: {
                  document: document,
                  student: student,
                  type: type,
                },
              })
              .afterClosed()
              .subscribe((result) => {
                if (result) {
                  this.getDataFromParam();
                }
              });
          } else {
            const docName = type === 'cv' ? 'Grand Oral CV' : 'Grand Oral Presentation';
            Swal.fire({
              type: 'error',
              title: this.translate.instant('DELETEDOC_S3.TITLE'),
              html: this.translate.instant('DELETEDOC_S3.TEXT', {
                docName: this.translate.instant(docName),
                dueDate: this.parseUTCToLocalPipe.transformDate(resp.due_date.date, resp.due_date.time),
              }),
              confirmButtonText: this.translate.instant('DELETEDOC_S3.BUTTON'),
            });
          }
        },
        (err) => {
          this.isWaitingForResponse = false;
        },
      );
    }
  }

  downloadStudentTestCorrection(correctedTests, subjectTestId) {
    let url = environment.apiUrl;
    url = url.replace('graphql', '');
    const currentCorrectedTest = correctedTests.filter(function (correctedTest) {
      return correctedTest.test && correctedTest.test.evaluation_id._id === subjectTestId;
    });
    if (currentCorrectedTest.length > 0 && currentCorrectedTest[0].correction.mark_entry_document) {
      const doc = currentCorrectedTest[0].correction.mark_entry_document;
      const element = document.createElement('a');
      element.href = `${environment.apiUrl}/fileuploads/${doc.s3_file_name}?download=true`.replace('/graphql', '');
      element.target = '_blank';
      element.setAttribute('download', doc.s3_file_name);
      element.click();
      element.remove();
    }
  }

  getMarksForStudent(student, subjectTestId) {
    const currentCorrectedTest = student.corrected_tests.filter(function (corrected_tests) {
      return corrected_tests.test && corrected_tests.test.evaluation_id && corrected_tests.test.evaluation_id._id === subjectTestId;
    });

    if (currentCorrectedTest.length > 0) {
      // if ((currentCorrectedTest[0].test.correctionType === 'pc' || currentCorrectedTest[0].test.correctionType === 'cp') &&
      //     (this.utilityService.checkUserIsAcademicDirector() || this.utilityService.checkUserIsFromGroupOfSchools())) {
      // This if block is only temprory, we don't show marks to the acad-director
      // until jury enters their decision when correction type of test is "pc"
      //   return '';
      // }

      if (
        ((student.final_transcript_id &&
          student.final_transcript_id.jury_decision_for_final_transcript &&
          student.final_transcript_id.jury_decision_for_final_transcript === 'retaking') ||
          (student.final_transcript_id &&
            student.final_transcript_id.student_decision &&
            student.final_transcript_id.student_decision === 'retaking')) &&
        (this.isUserAcadir || this.isUserADMTC)
      ) {
        const testRetake = _.find(student.final_transcript_id.retake_test_for_students, { test_id: currentCorrectedTest[0].test._id });
        if (testRetake) {
          return '';
        }
        // return '';
      }

      if (currentCorrectedTest[0].test.type === 'mentor-evaluation') {
        return this.getTotal(currentCorrectedTest[0]);
      } else {
        if (
          currentCorrectedTest[0].test.correction_type !== 'prep_center' &&
          currentCorrectedTest[0].test.correction_type !== 'certifier'
        ) {
          const checkCorrectionStatus = currentCorrectedTest[0].test.correction_status_for_schools.filter((s) => {
            return (
              s.school === student.school._id &&
              (s.correction_status === 'validated_by_acad_dir' || s.correction_status === 'validated_by_certi_admin')
            );
          });
          if (checkCorrectionStatus.length > 0) {
            return currentCorrectedTest[0] && currentCorrectedTest[0].correction ? this.getTotal(currentCorrectedTest[0]) : '';
          } else {
            return '';
          }
        } else {
          if ((student.final_transcript_id && student.final_transcript_id.is_validated) || this.isUserADMTC) {
            return this.getTotal(currentCorrectedTest[0]);
          } else {
            return '';
          }
        }
      }
    }
  }

  getTotal(currentCorrectedTest) {
    const total = currentCorrectedTest.correction.correction_grid.correction.total;
    const additionalTotal = currentCorrectedTest.correction.correction_grid.correction.additional_total;

    // Check if AdditionalTotal needs to be displayed.
    if (currentCorrectedTest.test.correction_grid.correction.total_zone.display_additional_total) {
      if (additionalTotal || additionalTotal === 0) {
        return additionalTotal;
      }
    }

    // return total score
    if (total) {
      return total;
    } else {
      return '';
    }
  }

  getTooltip(index) {
    if (this.testsList && this.testsList.length) {
      return this.testsList[index] && this.testsList[index].evaluation ? this.testsList[index].evaluation : '';
    } else {
      return '';
    }
  }

  editStudent(student) {

    // this.router.navigateByUrl('/', { skipLocationChange: true }).then(() =>
    //   this.router.navigate(['/school', student.school._id], {
    //     queryParams: { title: student.rncp_title._id, class: student.current_class._id, student: student._id, open: 'student-cards' },
    //   }),
    // );

    window.open(
      `./school/${student.school._id}?title=${student.rncp_title._id}&class=${student.current_class._id}&student=${student._id}&open=student-cards`,
      '_blank',
    );
  }

  getFinalResultAfterReTake(result: string) {
    if (result === 'PASS1' || result === 'PASS2' || result === 'PASS3') {
      return 'PASS';
    } else if (result === 'FAILED' || result === 'ELIMINATED') {
      return 'FAILED';
    }
  }

  connectAsUser(student) {

    const currentUser = this.utilityService.getCurrentUser();
    const studentUserId = student && student.user_id && student.user_id._id ? student.user_id._id : null;
    const unixUserType = _.uniqBy(student.entities, 'type.name');

    if (currentUser && studentUserId) {
      this.isConnect=true
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
            allowEscapeKey: true,
            allowOutsideClick: false,
            confirmButtonText: this.translate.instant('UNDERSTOOD'),
          }).then((result) => {
            const studentType = '5a067bba1c0217218c75f8ab'
            if (tempUser.entities[0].type._id === studentType) {
              this.authService.connectAsStudent(resp,tempUser.entities[0].type.name, 'ifr')
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
        }else{
          this.isConnect=false
        }
      });
    }
  }

  getESToolTip(surveyStatus, surveyValidator) {
    let tooltip = surveyStatus;
    if (surveyStatus === 'rejected_by_validator' || surveyStatus === 'validated_by_validator') {
      tooltip = tooltip + '_' + surveyValidator;
    }
    return tooltip;
  }

  showOptions(info) {
    this.selectType = info;
  }

  sendMultipleProblematic() {
    if (this.selectType === 'all') {
    } else {
      this.subs.sink = this.problematicService.sendMultipleProblematic(this.selection.selected, this.translate.currentLang).subscribe(
        (resp) => {

          if (resp) {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo'),
            });
          }
        },

      );
    }
  }

  isProblematicPassActivationDate() {
    let result = false;
    const problematicDate = this.classData && this.classData.problematic_activation_date && this.classData.problematic_activation_date.date;
    const problematicTime = this.classData && this.classData.problematic_activation_date && this.classData.problematic_activation_date.time;
    const problematicStartDate = this.parseStringDatePipe.transformStringToDate(
      this.parseUTCToLocalPipe.transformDate(problematicDate, problematicTime),
    );
    if (moment(this.today).isAfter(problematicStartDate)) {
      result = true;
    }
    return result;
  }

  getEvalProInZip() {
    this.isWaitingForPDF = true;
    if (this.isAllSelected()) {
      const pagination = null;
      const filter = this.cleanFilterData();
      this.subs.sink = this.studentService
        .getStudentsbyIDsClassTitle(
          this.selectedRncpTitleId,
          this.selectedClassId,
          this.schoolId,
          this.status,
          pagination,
          this.sortValue,
          filter,
        )
        .subscribe((resp) => {

          const studentIds = resp.map((student) => {
            return student._id;
          });

          this.generatePDFZip(studentIds);
        });
    } else {
      this.generatePDFZip(this.selection.selected);
    }



  }

  generatePDFZip(studentIds) {
    // *************** First, check if the test academic pro eval and softskill pro eval exist, or at least 1 exist.
    this.subs.sink = this.schoolService.checkPublishedAutoProEvalTest(this.selectedRncpTitleId, this.selectedClassId).subscribe(
      (resp) => {

        this.isWaitingForPDF = false;
        if (resp && resp.published && resp.published.length) {
          const forkParam = [];
          // Get the title data here, needed to pass to pdf later
          let rncpTitle;
          forkParam.push(this.rncpTitlesService.getOneTitleById(this.selectedRncpTitleId));

          // ********** We need to get the data of the tests, so we use forkparam to loop and request at the same time.
          resp.published.forEach((test) => {
            forkParam.push(this.testCreationService.getTestCreationData(test.test_id._id));
          });

          const testData = [];
          this.isWaitingForPDF = true;
          this.subs.sink = forkJoin(forkParam).subscribe(
            (response) => {
              // First request is always test, the rest are tests
              if (response && response.length) {
                response.forEach((responFork, responIndex) => {
                  if (responIndex === 0) {
                    rncpTitle = responFork;
                  } else {
                    testData.push(responFork);
                  }
                });
              }

              this.dialog
                .open(SendProEvaluationDialogComponent, {
                  panelClass: 'send-pro-evaluation-pop-up',
                  disableClose: true,
                  data: {
                    classId: this.selectedClassId,
                    schoolId: this.schoolId,
                    rncpTitle: rncpTitle,
                    testData: testData,
                    studentIds: studentIds,
                  },
                })
                .afterClosed()
                .subscribe((result) => {

                  this.isWaitingForPDF = false;
                  if (result) {
                    if (resp.unpublished.length === 0) {
                      this.swalPROEVAL_S1();
                    } else {
                      // *************** If at academic pro eval or softskill pro eval does not exist
                      this.swalPROEVAL_S2(resp.published[0].test_type);
                    }
                  }
                });
            },
            (err) => {
              this.isWaitingForPDF = false;
            },
          );
        } else {
          // *************** If both academic pro eval and softskill pro eval does not exist
          this.swalPROEVAL_S3();
        }
      },
      (err) => {
        this.isWaitingForPDF = false;
      },
    );
  }

  displayTestResult(correctedTests, subjectTestId) {
    if (correctedTests) {
      const currentCorrectedTest = correctedTests.filter(function (correctedTest) {
        return correctedTest.test && correctedTest.test.evaluation_id && correctedTest.test.evaluation_id._id === subjectTestId;
      });

      if (currentCorrectedTest && currentCorrectedTest.length && currentCorrectedTest[0].is_visible) {
        return true;
      } else {
        return false;
      }
    }
  }

  swalPROEVAL_S1() {
    Swal.fire({
      type: 'success',
      title: this.translate.instant('PROEVAL_S1.TITLE'),
      html: this.translate.instant('PROEVAL_S1.TEXT'),
      confirmButtonText: this.translate.instant('PROEVAL_S1.BUTTON'),
    });
  }

  swalPROEVAL_S2(type) {
    const translatedType = this.translate.instant(type);
    Swal.fire({
      type: 'success',
      title: this.translate.instant('PROEVAL_S2.TITLE'),
      html: this.translate.instant('PROEVAL_S2.TEXT', { testType: translatedType }),
      confirmButtonText: this.translate.instant('PROEVAL_S2.BUTTON'),
    });
  }

  swalPROEVAL_S3() {
    Swal.fire({
      type: 'error',
      title: this.translate.instant('PROEVAL_S3.TITLE'),
      html: this.translate.instant('PROEVAL_S3.TEXT'),
      confirmButtonText: this.translate.instant('PROEVAL_S3.BUTTON'),
    });
  }
}
