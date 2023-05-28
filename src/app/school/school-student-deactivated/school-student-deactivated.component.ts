import { Component, OnInit, ViewChild, OnDestroy, Input, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { StudentsService } from '../../service/students/students.service';
import { UntypedFormControl } from '@angular/forms';
import * as _ from 'lodash';
import swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { SelectionModel } from '@angular/cdk/collections';
import { ExportEsCsvDialogComponent } from '../../students/export-es-csv-dialog/export-es-csv-dialog.component';
import { MailStudentDialogComponent } from '../../students/mail-student-dialog/mail-student-dialog.component';
import { SubSink } from 'subsink';
import { SchoolService } from 'app/service/schools/school.service';
import Swal from 'sweetalert2';
import { startWith, tap, debounceTime, map } from 'rxjs/operators';
import { SchoolStudentDeactivatedDialogComponent } from './school-student-deactivated-dialog/school-student-deactivated-dialog.component';
import * as moment from 'moment';
import { ExportCsvService } from 'app/service/export-csv/export-csv.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { ResignationReasonDialogComponent } from 'app/students/resignation-reason-dialog/resignation-reason-dialog.component';
import { CoreService } from 'app/service/core/core.service';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { IncorrectUsersEmailDialogComponent } from 'app/shared/components/incorrect-users-email-dialog/incorrect-users-email-dialog.component';

@Component({
  selector: 'ms-school-student-deactivated',
  templateUrl: './school-student-deactivated.component.html',
  styleUrls: ['./school-student-deactivated.component.scss'],
})
export class SchoolStudentDeactivatedComponent implements OnInit, AfterViewInit, OnDestroy {
  private subs = new SubSink();

  @Input() schoolId: string;
  noData: any;

  selectedRncpTitleId: string;
  selectedClassId: string;
  isWaitingForResponse = false;
  isWaitingForResponseExport = false;
  studentsCount = 0;
  exportName: 'Export';
  tableWidth: string;
  studentDeactive: any;
  selectType: any;
  userSelected: any[];

  displayedColumns: string[] = ['select', 'name', 'status', 'job_description', 'problematic', 'mentor_evaluation', 'action'];
  filterColumns: string[] = ['selectFilter', 'nameFilter', 'statusFilter', 'jobFilter', 'probFilter', 'mentorFilter', 'actionFilter'];
  dataSource = new MatTableDataSource([]);
  selection = new SelectionModel(true, []);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  reactivateStudentConfig: MatDialogConfig = {
    disableClose: true,
    width: '500px',
  };
  // Preparation for Filters : List of filters data + Filters ID, need to implement the english translation to it, FR works !
  // No Filter Function implemented for the moment / Only Statik
  nameFilter = new UntypedFormControl('');
  jobFilter = new UntypedFormControl('AllF');
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
  searchPendingTask = '';
  probFilter = new UntypedFormControl('AllF');
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

  mentorFilter = new UntypedFormControl('AllM');
  mentorFilterList = [
    { key: 'AllM', value: 'AllM' },
    { key: 'Initial', value: 'initial' },
    { key: 'Sent to Mentor', value: 'sent_to_mentor' },
    { key: 'Filled by Mentor', value: 'filled_by_mentor' },
    { key: 'Validated by Acad Staff', value: 'validated_by_acad_staff' },
    { key: 'Expedited by Acad Staff', value: 'expedited_by_acad_staff' },
  ];

  filteredValues = {
    last_name: '',
    job_description: null,
    problematic: null,
    mentor_evaluation: null,
  };

  disabledExport = true;
  sortValue = null;
  isReset = false;
  dataLoaded = false;
  schoolsCount = 0;

  // Dummy data
  tempJobDescription = 'Sent to student';
  tempProblematic = 'Sent to Acad. Dpt';
  tempMentor = 'Validated by Academic Dpt';

  schoolDeactivateStudentDialog: MatDialogRef<SchoolStudentDeactivatedDialogComponent>;
  mailStudentsDialog: MatDialogRef<MailStudentDialogComponent>;
  exportESCSVDialog: MatDialogRef<ExportEsCsvDialogComponent>;
  private intervalVal: any;
  private timeOutVal: any;

  // Tutorial Variables
  isTutorialAdded = false;
  dataTutorial: any;
  tutorialData: any;
  isPermission: any;

  constructor(
    private studentService: StudentsService,
    private translate: TranslateService,
    public dialog: MatDialog,
    private schoolService: SchoolService,
    private exportCsvService: ExportCsvService,
    public permissionService: PermissionService,
    public coreService: CoreService,
    public tutorialService: TutorialService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.isPermission = this.authService.getPermission();
    this.subs.sink = this.schoolService.selectedRncpTitleId$.subscribe((id) => (this.selectedRncpTitleId = id));
    this.subs.sink = this.schoolService.selectedClassId$.subscribe((id) => {
      this.selectedClassId = id;
      if (this.selectedRncpTitleId && this.selectedRncpTitleId !== '' && this.selectedClassId && this.selectedClassId !== '') {
        this.getStudentData();
      }
    });
    this.subs.sink = this.schoolService.selectedStudentName$.subscribe((res) => {
      if (res) {
        this.filteredValues.last_name = res;
        if (this.selectedRncpTitleId && this.selectedRncpTitleId !== '' && this.selectedClassId && this.selectedClassId !== '') {
          this.getStudentData();
        }
      }
    });
    this.initializeStudent();
    this.getInAppTutorial('Deactivated students');
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (!this.isReset) {
            if (this.selectedRncpTitleId && this.selectedRncpTitleId !== '' && this.selectedClassId && this.selectedClassId !== '') {
              this.getStudentData();
            }
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
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

  sortData(sort: Sort) {
    if (sort.active === 'name') {
      this.sortValue = sort.direction ? { full_name: sort.direction } : null;
    } else if (sort.active === 'job_description') {
      this.sortValue = sort.direction ? { job_description: sort.direction } : null;
    } else if (sort.active === 'status') {
      this.sortValue = sort.direction ? { status: sort.direction } : null;
    } else if (sort.active === 'problematic') {
      this.sortValue = sort.direction ? { problematic: sort.direction } : null;
    } else if (sort.active === 'mentor_evaluation') {
      this.sortValue = sort.direction ? { mentor_evaluation: sort.direction } : null;
    }
    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        if (this.selectedRncpTitleId && this.selectedRncpTitleId !== '' && this.selectedClassId && this.selectedClassId !== '') {
          this.getStudentData();
        }
      }
    }
  }

  getStudentData() {
    this.isWaitingForResponse = true;
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    const filterValue = _.cloneDeep(this.filteredValues);
    this.subs.sink = this.studentService
      .getDeactivatedStudent(this.selectedRncpTitleId, this.selectedClassId, this.schoolId, pagination, this.sortValue, filterValue)
      .subscribe((students: any) => {
        this.isReset = false;
        if (students && students.length) {
          this.dataSource.data = students;
          this.dataSource.sort = this.sort;
          this.dataSource.paginator = this.paginator;
        } else {
          this.dataSource.data = [];
          this.paginator.length = 0;
        }
        this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
        this.isWaitingForResponse = false;
      });
  }

  initializeStudent() {
    this.subs.sink = this.nameFilter.valueChanges.pipe(debounceTime(800)).subscribe((name) => {
      this.filteredValues['last_name'] = name;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        if (this.selectedRncpTitleId && this.selectedRncpTitleId !== '' && this.selectedClassId && this.selectedClassId !== '') {
          this.getStudentData();
        }
      }
    });
    // this.subs.sink = this.jobFilter.valueChanges.pipe(debounceTime(800)).subscribe(job => {
    //   this.filteredValues['job_description'] = job;
    //   this.paginator.pageIndex = 0;
    //   if (!this.isReset) {
    //     if (this.selectedRncpTitleId && this.selectedRncpTitleId !== '' && this.selectedClassId && this.selectedClassId !== '') {
    //       this.getStudentData();
    //     }
    //   }
    // });
    // this.subs.sink = this.probFilter.valueChanges.pipe(debounceTime(800)).subscribe(job => {
    //   this.filteredValues['problematic'] = job;
    //   this.paginator.pageIndex = 0;
    //   if (!this.isReset) {
    //     if (this.selectedRncpTitleId && this.selectedRncpTitleId !== '' && this.selectedClassId && this.selectedClassId !== '') {
    //       this.getStudentData();
    //     }
    //   }
    // });
    // this.subs.sink = this.mentorFilter.valueChanges.pipe(debounceTime(800)).subscribe(mentor => {
    //   this.filteredValues['mentor'] = mentor;
    //   this.paginator.pageIndex = 0;
    //   if (!this.isReset) {
    //     if (this.selectedRncpTitleId && this.selectedRncpTitleId !== '' && this.selectedClassId && this.selectedClassId !== '') {
    //       this.getStudentData();
    //     }
    //   }
    // });
  }

  cleanFilterData() {
    const filterData = _.cloneDeep(this.filteredValues);
    let filterQuery = '';
    Object.keys(filterData).forEach((key) => {

      // only add key that has value to the query. so it wont send filter with empty string
      if (filterData[key]) {
        if (key === 'last_name') {
          filterQuery = filterQuery + ` ${key}:"${filterData[key]}"`;
        } else {
          filterQuery = filterQuery + ` ${key}:${filterData[key]}`;
        }
      }
    });
    return 'filter: {' + filterQuery + '}';
  }
  setJobDesc(value) {
    this.filteredValues['job_description'] = 'AllF' ? null : value;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      if (this.selectedRncpTitleId && this.selectedRncpTitleId !== '' && this.selectedClassId && this.selectedClassId !== '') {
        this.getStudentData();
      }
    }
  }

  setProblem(value) {
    this.filteredValues['problematic'] = 'AllF' ? null : value;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      if (this.selectedRncpTitleId && this.selectedRncpTitleId !== '' && this.selectedClassId && this.selectedClassId !== '') {
        this.getStudentData();
      }
    }
  }

  setMentor(value) {
    this.filteredValues['mentor_evaluation'] = 'AllM' ? null : value;;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      if (this.selectedRncpTitleId && this.selectedRncpTitleId !== '' && this.selectedClassId && this.selectedClassId !== '') {
        this.getStudentData();
      }
    }
  }

  exportCSV() {
    const inputOptions = {
      ',': this.translate.instant('Export_S1.COMMA'),
      ';': this.translate.instant('Export_S1.SEMICOLON'),
      tab: this.translate.instant('Export_S1.TAB'),
    };

    swal
      .fire({
        type: 'question',
        title: this.translate.instant('Export_S1.TITLE'),
        allowEscapeKey: true,
        confirmButtonText: this.translate.instant('Export_S1.OK'),
        input: 'radio',
        inputOptions: inputOptions,
        inputValidator: (value) => {
          return new Promise((resolve, reject) => {
            if (value) {
              resolve('');
            } else {
              reject(this.translate.instant('Export_S1.INVALID'));
            }
          });
        },
      })
      .then((data) => {
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

  requestStudEmailCorrection(student) {
    swal
      .fire({
        type: 'question',
        title: this.translate.instant('USER_S5.TITLE'),
        html: this.translate.instant('USER_S5.TEXT', {
          userCivility: student.civility,
          userFirstName: student.firstName,
          userLastName: student.lastName,
        }),
        showCancelButton: true,
        allowEscapeKey: true,
        confirmButtonText: this.translate.instant('USER_S5.SEND'),

        cancelButtonText: this.translate.instant('CANCEL'),
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

  thumbsToggle(flag, student, index) {
    if (flag) {
      let timeDisabled = 3;
      swal
        .fire({
          title: this.translate.instant('THUMBSUP.SW2.TITLE'),
          html: this.translate.instant('THUMBSUP.SW2.TEXT'),
          type: 'warning',
          allowEscapeKey: true,
          showCancelButton: true,
          confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
          cancelButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CANCEL'),
          onOpen: () => {
            swal.disableConfirmButton();
            const confirmBtnRef = swal.getConfirmButton();
            this.intervalVal = setInterval(() => {
              timeDisabled -= 1;
              confirmBtnRef.innerText = this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM') + ' in ' + timeDisabled + ' sec';
            }, 1000);

            this.timeOutVal = setTimeout(() => {
              confirmBtnRef.innerText = this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM');
              swal.enableConfirmButton();
              clearInterval(this.intervalVal);
            }, timeDisabled * 1000);
            // clearTimeout(this.timeOutVal);
          },
        })
        .then((inputValue) => {
          if (inputValue.value) {
            student['allowFinalTranscriptGen'] = false;
          }
        });
    } else {
      let timeDisabled = 3;
      swal
        .fire({
          title: this.translate.instant('THUMBSUP.SW1.TITLE'),
          html: this.translate.instant('THUMBSUP.SW1.TEXT'),
          type: 'warning',
          allowEscapeKey: true,
          showCancelButton: true,
          confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
          cancelButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CANCEL'),
          onOpen: () => {
            swal.disableConfirmButton();
            const confirmBtnRef = swal.getConfirmButton();
            this.intervalVal = setInterval(() => {
              timeDisabled -= 1;
              confirmBtnRef.innerText = this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM') + ' in ' + timeDisabled + ' sec';
            }, 1000);

            this.timeOutVal = setTimeout(() => {
              confirmBtnRef.innerText = this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM');
              swal.enableConfirmButton();
              clearInterval(this.intervalVal);
              // clearTimeout(time);
            }, timeDisabled * 1000);
            // clearTimeout(this.timeOutVal);
          },
        })
        .then((inputValue) => {
          if (inputValue.value) {
            student['allowFinalTranscriptGen'] = true;
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

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  /*
   * Check is all student checked*/
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data ? this.dataSource.data.length : null;
    return numSelected === numRows;
  }

  resetFilter() {
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });

    this.filteredValues = {
      last_name: '',
      job_description: null,
      problematic: null,
      mentor_evaluation: null,
    };

    this.nameFilter.setValue('', { emitEvent: false });
    this.jobFilter.setValue('', { emitEvent: false });
    this.probFilter.setValue('', { emitEvent: false });
    this.mentorFilter.setValue('', { emitEvent: false });

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;

    if (this.selectedRncpTitleId && this.selectedRncpTitleId !== '' && this.selectedClassId && this.selectedClassId !== '') {
      this.getStudentData();
    }
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

  showOptions(info) {
    const numSelected = this.selection.selected.length;
    if (numSelected > 0) {
      this.disabledExport = false;
    } else {
      this.disabledExport = true;
    }
    this.selectType = info;
    const data = this.selection.selected;
    this.userSelected = [];
    data.forEach((user) => {
      this.userSelected.push(user);
    });
  }

  exportData() {
    Swal.close();
    const data = [];

    if (this.selectType === 'one' && this.userSelected.length) {
      if (this.userSelected) {
        for (const item of this.userSelected) {
          const obj = [];

          // TODO: From the template get the data location and add the data
          obj[0] = this.translate.instant(item.civility);
          obj[1] =
            '=HYPERLINK("' +
            `http://www.admtc.pro/school/${item.school._id}?title=${item.rncp_title._id}&class=${item.current_class._id}&student=${item._id}&open=student-cards&selectedTab=Identity&selectedSubTab=Identity` +
            '"; "' +
            item.last_name +
            '")';
          obj[2] = item.first_name;
          obj[3] = item.status ? this.translate.instant(item.status) : '-';
          obj[4] =
            item.job_description_id && item.job_description_id.job_description_status
              ? this.translate.instant(item.job_description_id.job_description_status)
              : '-';
          obj[5] = item.problematic_id ? this.translate.instant(item.problematic_id.problematic_status) : '-';
          obj[6] = item.mentor_evaluation_id ? this.translate.instant(item.mentor_evaluation_id.mentor_evaluation_status) : '-';
          data.push(obj);
        }

        const valueRange = { values: data };
        const today = moment().format('DD-MM-YYYY');
        const title = this.exportName + '_' + today;
        const sheetID = this.translate.currentLang === 'en' ? 0 : 1435366860;
        const sheetData = {
          spreadsheetId: '1ZjaKXgnhzlxLMmG1KodGbHPezAyu2XAEZHhpwKklU0Q',
          sheetId: sheetID,
          range: 'A7',
        };
        this.exportCsvService.createAndUpdateSpreadsheet(valueRange, title, sheetData);
      }
    } else {
      this.isWaitingForResponseExport = true;
      const filterValue = this.cleanFilterData();
      this.subs.sink = this.studentService
        .getAllDeactivatedStudent(this.selectedRncpTitleId, this.selectedClassId, this.schoolId, this.sortValue, filterValue)
        .subscribe((students: any) => {
          this.isWaitingForResponseExport = false;
          if (students && students.length) {
            this.studentDeactive = students;
            for (const item of students) {
              const obj = [];

              // TODO: From the template get the data location and add the data
              obj[0] = this.translate.instant(item.civility);
              obj[1] =
                '=HYPERLINK("' +
                `http://www.admtc.pro/school/${item.school._id}?title=${item.rncp_title._id}&class=${item.current_class._id}&student=${item._id}&open=student-cards&selectedTab=Identity&selectedSubTab=Identity` +
                '"; "' +
                item.last_name +
                '")';
              obj[2] = item.first_name;
              obj[3] = item.status ? this.translate.instant(item.status) : '-';
              obj[4] =
                item.job_description_id && item.job_description_id.job_description_status
                  ? this.translate.instant(item.job_description_id.job_description_status)
                  : '-';
              obj[5] = item.problematic_id ? this.translate.instant(item.problematic_id.problematic_status) : '-';
              obj[6] = item.mentor_evaluation_id ? this.translate.instant(item.mentor_evaluation_id.mentor_evaluation_status) : '-';
              data.push(obj);
            }

            const valueRange = { values: data };
            const today = moment().format('DD-MM-YYYY');
            const title = this.exportName + '_' + today;
            const sheetID = this.translate.currentLang === 'en' ? 0 : 1435366860;
            const sheetData = {
              spreadsheetId: '1ZjaKXgnhzlxLMmG1KodGbHPezAyu2XAEZHhpwKklU0Q',
              sheetId: sheetID,
              range: 'A7',
            };
            this.exportCsvService.createAndUpdateSpreadsheet(valueRange, title, sheetData);
          }
        });
    }
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    clearInterval(this.intervalVal);
    this.subs.unsubscribe();
  }
}
