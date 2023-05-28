import { Observable } from 'rxjs';
import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { MatAutocompleteSelectedEvent, MatAutocomplete } from '@angular/material/autocomplete';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { StudentsService } from '../../service/students/students.service';
import { SubSink } from 'subsink';
import { UntypedFormControl } from '@angular/forms';
import * as _ from 'lodash';
import swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { DeactivateStudentDialogComponent } from '../deactivate-student-dialog/deactivate-student-dialog.component';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { ExportEsCsvDialogComponent } from '../export-es-csv-dialog/export-es-csv-dialog.component';
import { MailStudentDialogComponent } from '../mail-student-dialog/mail-student-dialog.component';
import { startWith, map, debounceTime, tap } from 'rxjs/operators';
import { UtilityService } from 'app/service/utility/utility.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { NgxPermissionsService } from 'ngx-permissions';
import Swal from 'sweetalert2';
import { ActivatedRoute, Router } from '@angular/router';
import { UsersService } from 'app/service/users/users.service';
import { UserService } from 'app/service/user/user.service';
import * as moment from 'moment';
import { ExportCsvService } from 'app/service/export-csv/export-csv.service';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { SchoolService } from 'app/service/schools/school.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ExportGroupsDialogComponent } from 'app/shared/components/export-groups-dialog/export-groups-dialog.component';
import { UserEmailDialogComponent } from '../../users/user-email-dialog/user-email-dialog.component';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { GoogleMeetService } from 'app/service/export-csv/google-meets.service';
import { TransferStudentDialogComponent } from '../transfer-student-dialog/transfer-student-dialog.component';
import { CreateSendEmployabilitySurveyForStudentDialogComponent } from '../create-send-employability-survey-for-student-dialog/create-send-employability-survey-for-student-dialog.component';
import { IncorrectUsersEmailDialogComponent } from 'app/shared/components/incorrect-users-email-dialog/incorrect-users-email-dialog.component';

@Component({
  selector: 'ms-students-problematic',
  templateUrl: './students-problematic.component.html',
  styleUrls: ['./students-problematic.component.scss'],
  providers: [ParseStringDatePipe],
})
export class StudentsProblematicComponent implements OnInit, OnDestroy, AfterViewInit {
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  displayedColumns: string[] = ['select', 'last_name', 'problematic', 'school', 'rncp_title', 'class', 'action'];
  filterColumns: string[] = ['selectFilter', 'lastNameFilter', 'probFilter', 'schoolFilter', 'titleFilter', 'classFilter', 'actionFilter'];
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

  isPermission: any;
  isSendVerification = false;
  isUserCertifier = false;
  disabledExport = true;
  isUserCertifierDir = false;
  isUserMentor = false;
  isUserADMTC = false;
  disabledVerification = true;
  userForExport: any[];
  allStudentForExport = [];
  meetResp;
  lastNameFilter = new UntypedFormControl('');
  statusFilter = new UntypedFormControl('AllM');
  titleStatusFilter = new UntypedFormControl('AllM');
  jobFilter = new UntypedFormControl('AllF');
  probFilter = new UntypedFormControl('AllF');
  mentorFilter = new UntypedFormControl('AllM');
  evalProFilter = new UntypedFormControl('AllM');
  empSurveyFilter = new UntypedFormControl('AllF');
  transcriptFilter = new UntypedFormControl('AllM');
  certifierFilter = new UntypedFormControl('AllM');
  identityFilter = new UntypedFormControl('AllM');
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
    { key: 'current_active', value: 'current_active' },
    { key: 'retaking', value: 'retaking' },
    { key: 'admission', value: 'admission' },
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

  verificationFilterList = [
    { key: 'AllM', value: 'AllM' },
    { key: 'Not Send', value: 'not_sent' },
    { key: 'Sent to Student', value: 'sent_to_student' },
    { key: 'Completed', value: 'details_confirmed' },
    { key: 'Due date passed', value: 'due_date_passed' },
  ];

  identityStatus = 'certificate_issued';

  filteredValues = {
    full_name: '',
    identity_verification_status: '',
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
    academic_softskill_status: '',
    class_id: '',
    student_title_status: '',
  };
  title_ids;
  school_ids;
  isLoading = false;
  exportName: 'Export';
  selectType: any;
  entityData: any;
  userSelected: any[];
  userSelectedId: any[];
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

  deactivateStudentDialog: MatDialogRef<DeactivateStudentDialogComponent>;
  mailStudentsDialog: MatDialogRef<MailStudentDialogComponent>;
  mailUser: MatDialogRef<UserEmailDialogComponent>;
  exportESCSVDialog: MatDialogRef<ExportEsCsvDialogComponent>;
  deleteStudentConfig: MatDialogConfig = {
    disableClose: true,
    panelClass: 'no-max-height',
    width: '600px',
    maxHeight: '75vh',
  };
  dataES: any;
  invalidES = false;
  originalClassList = [];
  classList = [];
  classFilter = new UntypedFormControl('');
  filteredClass: Observable<any[]>;
  entityProblematic: any;

  constructor(
    private studentService: StudentsService,
    private translate: TranslateService,
    public dialog: MatDialog,
    private utilService: UtilityService,
    private authService: AuthService,
    private permissions: NgxPermissionsService,
    private router: Router,
    private route: ActivatedRoute,
    private userService: UserService,
    private exportCsvService: ExportCsvService,
    private mailboxService: MailboxService,
    public permissionService: PermissionService,
    private schoolService: SchoolService,
    private rncpTitleService: RNCPTitlesService,
    private parseStringDatePipe: ParseStringDatePipe,
    private pageTitleService: PageTitleService,
    private googleMeetService: GoogleMeetService,
  ) {}

  ngOnInit() {
    this.isPermission = this.authService.getPermission();
    this.pageTitleService.setTitle('List of Active Students');
    this.currentUser = this.authService.getLocalStorageUser();
    if (this.isPermission && this.isPermission.length && this.isPermission[0]) {

      this.entityProblematic = this.currentUser.entities.filter((list) => list.type.name === this.isPermission[0]);
    } else {
      this.entityProblematic = this.currentUser.entities;
    }
    this.isUserCertifier = this.permissions.getPermission('Certifier Admin') ? true : false;
    this.isUserCertifierDir = this.permissions.getPermission('CR School Director') ? true : false;
    this.isUserADMTC = this.utilService.isUserEntityADMTC();
    this.isUserMentor = this.utilService.isMentor();
    this.entityData = this.currentUser.entities.find(
      (entity) => entity.type.name === 'Academic Director' || entity.type.name === 'Academic Admin',
    );
    this.paginator.pageSize = 10;
    this.getRncpTitleList();
    this.getSchoolDropdownList();
    this.initFilter();
    this.getStudentData();
    this.getClassDropdownList();

    const schoolFilter = this.route.snapshot.queryParamMap.get('schoolFilter');

    if (schoolFilter) {
      this.filteredValues.school_id = schoolFilter;
      this.paginator.pageIndex = 0;
      this.getStudentData();
    } else {
      this.getStudentData();
    }
  }

  goToSchoolDetails(schoolId: string) {
    // this.router.navigate(['school', schoolId]);
    window.open(`./school/${schoolId}`, '_blank');
  }

  redirectLink(param, identity) {
    this.router.navigate(['/school', param.school._id], {
      queryParams: {
        title: param.rncp_title._id,
        class: param.current_class._id,
        student: param._id,
        open: 'student-cards',
        selectedTab: 'Identity',
        selectedSubTab: 'Identity',
      },
    });
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

  sortData(sort: Sort) {
    this.sortValue = sort.active ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
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
    const filter = this.cleanFilterData();
    this.subs.sink = this.studentService
      .getAllStudentsProblematic(
        pagination,
        this.sortValue,
        filter,
        this.entityProblematic[0].assigned_rncp_title._id,
        this.entityProblematic[0].school._id,
        this.currentUser._id
      )
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
  }

  cleanFilterData() {
    const filterData = _.cloneDeep(this.filteredValues);
    let filterQuery = '';
    Object.keys(filterData).forEach((key) => {
      // only add key that has value to the query. so it wont send filter with empty string
      if (filterData[key]) {

        if (key === 'full_name' || key === 'school_id' || key === 'rncp_title_id' || key === 'certifier_school' || key === 'class_id') {
          filterQuery = filterQuery + ` ${key}:"${filterData[key]}"`;
        } else {
          filterQuery = filterQuery + ` ${key}:${filterData[key]}`;
        }
      } else {
        if (key === 'problematic' && !filterData[key]) {
          filterQuery = filterQuery + ` problematic: sent_to_certifier`;
        }
      }
    });
    return 'filter: {' + filterQuery + '}';
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

  deactivateStudent(selectedStudent) {
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
    let timeDisabled = 5;
    swal
      .fire({
        title: this.translate.instant('DEACTIVATEDSUCCESS.CONFIRMDEACTIVETITLE'),
        html: this.translate.instant('DEACTIVATEDSUCCESS.CONFIRMDEACTIVE', {
          Civility: this.translate.instant(selectedStudent.civility),
          LName: selectedStudent.last_name,
          FName: selectedStudent.first_name,
        }),
        footer: `<span style="margin-left: auto">DEACTIVATEDSUCCESS</span>`,
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonClass: 'btn-danger',
        allowOutsideClick: false,
        confirmButtonText: this.translate.instant('DEACTIVATEDSUCCESS.DEACTIVATEDSTUDENTACTION.Resignation'),
        cancelButtonText: this.translate.instant('DEACTIVATEDSUCCESS.DEACTIVATEDSTUDENTACTION.Cancel'),
        onOpen: () => {
          swal.disableConfirmButton();
          const confirmBtnRef = swal.getConfirmButton();
          const time = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText =
              this.translate.instant('DEACTIVATEDSUCCESS.DEACTIVATEDSTUDENTACTION.Resignation') + ' in ' + timeDisabled + ' sec';
          }, 1000);
          setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('DEACTIVATEDSUCCESS.DEACTIVATEDSTUDENTACTION.Resignation');
            swal.enableConfirmButton();
            clearTimeout(time);
          }, timeDisabled * 1000);
        },
      })
      .then((data: any) => {
        if (data.value) {
          this.subs.sink = this.dialog
            .open(DeactivateStudentDialogComponent, {
              ...this.deleteStudentConfig,
              data: { studentDetails: selectedStudent },
            })
            .afterClosed()
            .subscribe((result) => {
              if (result) {
                this.getStudentData();
              }
            });
        }
      });
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
        footer: `<span style="margin-left: auto">USER_S5</span>`,
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
    this.selection.clear();
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });

    this.filteredValues = {
      full_name: '',
      identity_verification_status: '',
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
      academic_softskill_status: '',
      class_id: '',
      student_title_status: '',
    };

    this.lastNameFilter.setValue('', { emitEvent: false });
    this.statusFilter.setValue('AllM', { emitEvent: false });
    this.evalProFilter.setValue('AllM', { emitEvent: false });
    this.jobFilter.setValue('AllF', { emitEvent: false });
    this.probFilter.setValue('AllF', { emitEvent: false });
    this.mentorFilter.setValue('AllM', { emitEvent: false });
    this.empSurveyFilter.setValue('AllF', { emitEvent: false });
    this.transcriptFilter.setValue('AllM', { emitEvent: false });
    this.certifierFilter.setValue('AllM', { emitEvent: false });
    this.identityFilter.setValue('AllM', { emitEvent: false });
    this.schoolFilter.setValue('', { emitEvent: false });
    this.titleFilter.setValue('', { emitEvent: false });
    this.titleStatusFilter.setValue('AllM', { emitEvent: false });
    this.classFilter.setValue('', { emitEvent: false });

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    this.getRncpTitleList();
    this.getSchoolDropdownList();
    this.getStudentData();
    this.getClassDropdownList();
  }

  editStudent(student) {

    window.open(
      `./students-card-problematic/${student.school._id}?title=${student.rncp_title._id}&class=${student.current_class._id}&open=student-cards`,
      '_blank',
    );
  }

  showOptions(info) {
    const numSelected = this.selection.selected.length;
    if (numSelected > 0) {
      this.disabledVerification = false;
      this.disabledExport = false;
    } else {
      this.disabledVerification = true;
      this.disabledExport = true;
    }
    this.selectType = info;
    const data = this.selection.selected;
    this.userSelected = [];
    this.userSelectedId = [];
    data.forEach((user) => {
      this.userSelected.push(user);
      this.userSelectedId.push(user._id);
    });
  }

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
        const schoolFilter = this.route.snapshot.queryParamMap.get('schoolFilter');
        if (schoolFilter) {
          this.getSchool(this.schoolList, schoolFilter);
        }
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
        const schoolFilter = this.route.snapshot.queryParamMap.get('schoolFilter');
        if (schoolFilter) {
          this.getSchool(this.schoolList, schoolFilter);
        }
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
        const title_ids = this.utilService.getAcademicAllAssignedTitle(dataUSer);
        this.subs.sink = this.schoolService.getAllSchoolsByTitleUserOwn(title_ids).subscribe((schoolList: any) => {
          let tempSchools = _.cloneDeep(schoolList);
          if (tempSchools && tempSchools.length) {
            tempSchools = tempSchools.filter(
              (school) => school && school.short_name && this.utilService.disregardSpace(school.short_name) !== '',
            );
          }

          this.schoolList = _.cloneDeep(tempSchools);
          const schoolFilter = this.route.snapshot.queryParamMap.get('schoolFilter');
          if (schoolFilter) {
            this.getSchool(this.schoolList, schoolFilter);
          }
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

  getSchool(schoolList, schoolId) {
    const foundSchool = schoolList.find((school) => school._id === schoolId);
    if (foundSchool) {
      this.schoolFilter.setValue(foundSchool.short_name);
    }
  }

  enterSchoolFilter(event: MatAutocomplete) {

    if (event && event.options && event.options.length > 1) {
      let schoolId = '';
      let schoolData;
      event.options.forEach((option, optionIndex) => {
        if (optionIndex === 1 && option) {

          const foundSchool = this.schoolList.find((school) => option.value === school.short_name);
          if (foundSchool) {
            schoolId = foundSchool._id;
            schoolData = foundSchool;
            this.schoolFilter.setValue(foundSchool.short_name);
          }
        }
      });
      if (schoolId && schoolData) {
        this.setSchoolFilter(schoolId, schoolData);
      }
    } else {
      this.schoolFilter.setValue('');
      this.setSchoolFilter(null);
    }
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

  enterTitleFilter(event: MatAutocomplete) {

    // this.titleList = 'test';
    if (event && event.options && event.options.length > 1) {
      let titleId = '';
      event.options.forEach((option, optionIndex) => {
        if (optionIndex === 1 && option) {

          const foundTitle = this.titleList.find((title) => option.value === title.short_name);
          if (foundTitle) {
            titleId = foundTitle._id;
            this.titleFilter.setValue(foundTitle.short_name);
          }
        }
      });
      if (titleId) {
        this.setTitleData(titleId);
      }
    } else {
      this.titleFilter.setValue('');
      this.setTitleData(null);
    }
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

  initFilter() {
    this.subs.sink = this.lastNameFilter.valueChanges.pipe(debounceTime(400)).subscribe((statusSearch) => {
      const symbol = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      if (!statusSearch.match(symbol) && !statusSearch.match(symbol1)) {
        this.filteredValues.full_name = statusSearch ? statusSearch.toLowerCase() : '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getStudentData();
        }
      } else {
        this.lastNameFilter.setValue('');
        this.filteredValues.full_name = '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getStudentData();
        }
      }
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
    this.subs.sink = this.evalProFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.academic_softskill_status = statusSearch === 'AllM' ? '' : statusSearch;
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
    this.subs.sink = this.identityFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.identity_verification_status = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getStudentData();
      }
    });
  }

  showTransferStudentDialog() {
    this.dialog
      .open(TransferStudentDialogComponent, {
        disableClose: true,
        panelClass: 'certification-rule-pop-up',
        width: '615px',
        data: {
          schoolList: this.schoolList,
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.getStudentData();
        }
      });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  getESToolTip(surveyStatus, surveyValidator) {
    let tooltip = surveyStatus;
    if (surveyStatus === 'rejected_by_validator' || surveyStatus === 'validated_by_validator') {
      tooltip = tooltip + '_' + surveyValidator;
    }
    return tooltip;
  }

  openExportGroups() {
    this.dialog.open(ExportGroupsDialogComponent, {
      disableClose: true,
      panelClass: 'certification-rule-pop-up',
      width: '600px',
    });
  }

  openSendES() {
    this.dataSendES();
  }

  openDialogES() {
    this.dialog
      .open(CreateSendEmployabilitySurveyForStudentDialogComponent, {
        disableClose: true,
        width: '650px',
        panelClass: 'certification-rule-pop-up',
        data: this.dataES ? this.dataES : '',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {

          this.sendOneTimeEmployabilitySurvey(result);
        }
      });
  }

  dataSendES() {
    this.invalidES = true;
    this.isWaitingForResponse = true;
    const students = [];
    let class_id = '';
    let rncp_title_id = '';
    if (this.selection.selected.length > 0) {
      if (this.isCheckedAll) {
        // panggil be
        const filter = this.cleanFilterData();
        this.subs.sink = this.studentService.checkStudentWithinSameClassAndTitle(filter).subscribe(
          (res) => {

            if (res) {
              res.students.forEach((resp) => {
                students.push(resp._id);
              });
              class_id = res && res.class_id && res.class_id._id ? res.class_id._id : '';
              rncp_title_id = res && res.rncp_title && res.rncp_title._id ? res.rncp_title._id : '';
              this.dataES = {
                students,
                class_id,
                rncp_title_id,
              };
              // this.dataES = res;
              this.isWaitingForResponse = false;
              this.openDialogES();
            } else {
              this.dataES = null;
            }
          },
          (err) => {
            if (err['message'] === 'GraphQL error: Student not in same class and title') {
              this.invalidES = true;
              this.isWaitingForResponse = false;
              this.swalDifferentClass();
            } else {
              this.swalError(err);
            }
          },
        );
      } else {
        const filteredClassSelected = _.uniqBy(this.selection.selected, 'current_class._id');
        if (filteredClassSelected.length === 1 && !this.isCheckedAll) {
          this.selection.selected.forEach((resp) => {
            students.push(resp._id);
            class_id = resp && resp.current_class && resp.current_class._id ? resp.current_class._id : '';
            rncp_title_id = resp && resp.rncp_title && resp.rncp_title._id ? resp.rncp_title._id : '';
          });
          this.dataES = {
            students,
            class_id,
            rncp_title_id,
          };
          this.isWaitingForResponse = false;
          this.invalidES = false;

          this.openDialogES();
        } else {
          // swal error
          this.invalidES = true;
          this.isWaitingForResponse = false;
          this.swalDifferentClass();
        }
      }
    }
  }

  swalError(err) {
    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: 'OK',
    });
  }

  sendOneTimeEmployabilitySurvey(payload) {
    this.isWaitingForResponse = true;
    this.studentService.SendOneTimeEmployabilitySurvey(payload).subscribe(
      (res) => {
        if (res) {

          this.isWaitingForResponse = false;
          Swal.fire({
            title: 'Bravo',
            type: 'success',
          }).then(() => {
            this.router.navigate(['/employability-survey/details/', res._id]);
          });
        }
      },
      (err) => (this.isWaitingForResponse = false),
    );
  }

  getClassDropdownList() {
    this.subs.sink = this.studentService.getClassList().subscribe((classData) => {

      this.classList = _.cloneDeep(classData);
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

    // this.filterSchoolDropdownBasedOnClass(classId, 'pc');
    this.filterTitleDropdownBasedOnClass(classId);
  }

  filterTitleDropdownBasedOnClass(classId) {
    let tempTitleFilter = [];

    tempTitleFilter = this.titleList.filter(
      (title) => title && title.classes && title.classes.length && title.classes.some((classres) => classres && classres._id === classId),
    );

    if (classId && tempTitleFilter && tempTitleFilter.length) {
      this.titleList = tempTitleFilter;
      this.titleList = _.uniqBy(this.titleList, '_id');
      if (this.titleList.length === 0) {
        this.titleList = [];
      }
    } else {
      this.titleList = this.originalTitleList;
    }
    this.titleFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });
  }

  filterSchoolDropdownBasedOnClass(classId, type) {
    let tempSchoolFilterPC = [];
    const tempSchoolFilterCert = [];
    // Change dropdown of school to relate with the classid
    tempSchoolFilterPC = this.schoolList.filter(
      (school) =>
        school &&
        school.preparation_center_ats &&
        school.preparation_center_ats.length &&
        school.preparation_center_ats.some((title) => {
          // title && title.rncp_title_id && title.rncp_title_id._id === titleId
          if (title && title.rncp_title_id && title.rncp_title_id.classes.length > 0) {
            title.rncp_title_id.classes.some((res) => res._id === classId);

            return title;
          }
        }),
    );

    // // Change dropdown of school to relate with classid
    // tempSchoolFilterCert = this.schoolList.filter(
    //   (school) =>
    //   school &&
    //   school.certifier_ats &&
    //   school.certifier_ats.length &&
    //   school.certifier_ats.some((title) =>{
    //     if(title && title.classes.length > 0) {
    //       title.classes.some(resp => resp._id === classId)
    //     }
    //   }),
    // );



    if (classId && tempSchoolFilterPC && tempSchoolFilterPC.length) {
      const result = tempSchoolFilterPC;
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

  swalDifferentClass() {
    Swal.fire({
      type: 'error',
      title: this.translate.instant('SwalNotSameClass.TITLE'),
      text: this.translate.instant('SwalNotSameClass.TEXT'),
      confirmButtonText: this.translate.instant('SwalNotSameClass.BUTTON1'),
    });
  }
}
