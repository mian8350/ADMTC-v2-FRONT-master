import { Component, OnInit, ViewChild, OnDestroy, AfterViewChecked, ChangeDetectorRef, Input } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { TaskService } from '../../service/task/task.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { UntypedFormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { AddTaskDialogComponent } from '../add-task-dialog/add-task-dialog.component';
import { AddTestTaskDialogComponent } from '../add-test-task-dialog/add-test-task-dialog.component';
import * as moment from 'moment';
import { forkJoin, Observable, of } from 'rxjs';
import { map, startWith, debounceTime, switchMap } from 'rxjs/operators';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { AssignCorrectorDialogComponent } from '../assign-corrector-dialog/assign-corrector-dialog.component';
import { UtilityService } from 'app/service/utility/utility.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { Router, ActivatedRoute } from '@angular/router';
import { UploadExpectedDocTaskComponent } from 'app/rncp-titles/dashboard/upload-expected-doc-task/upload-expected-doc-task.component';
import { AuthService } from 'app/service/auth-service/auth.service';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { CertificationRulePopUpComponent } from 'app/title-rncp/conditions/certification-rule/certification-rule-pop-up/certification-rule-pop-up.component';
import { CertificationRuleService } from 'app/service/certification-rule/certification-rule.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { AssignCorrectorProblematicDialogComponent } from 'app/shared/components/assign-corrector-problematic-dialog/assign-corrector-problematic-dialog.component';
import Swal from 'sweetalert2';
import { ManualTaskDialogComponent } from '../manual-task-dialog/manual-task-dialog.component';
import { ValidateProblematicTaskDialogComponent } from 'app/shared/components/validate-problematic-task-dialog/validate-problematic-task-dialog.component';
import { GroupCreationService } from 'app/service/group-creation/group-creation.service';
import { SendCopiesDialogComponent } from '../../shared/send-copies-dialog/send-copies-dialog.component';
import { UploadCvDocTaskComponent } from 'app/rncp-titles/dashboard/upload-cv-doc-task/upload-cv-doc-task.component';
import { UploadPresentationDocumentTaskComponent } from 'app/rncp-titles/dashboard/upload-presentation-document-task/upload-presentation-document-task.component';
import { JustifyAbsenceDialogComponent } from 'app/rncp-titles/dashboard/justify-absence-dialog/justify-absence-dialog.component';
import { FormFillingService } from 'app/form-filling/form-filling.service';
import { StudentsService } from 'app/service/students/students.service';
import { AddStudentCardTaskDialogComponent } from '../add-student-card-task-dialog/add-student-card-task-dialog.component';
import { SendJobDescriptionDialogComponent } from 'app/shared/components/send-job-description-dialog/send-job-description-dialog.component';
import { AssignCorrectorOffPlatformJuryDialogComponent } from '../assign-corrector-off-platform-jury-dialog/assign-corrector-off-platform-jury-dialog.component';
import { TaskBuilderActionDialogComponent } from 'app/shared/components/task-builder-action-dialog/task-builder-action-dialog.component';
import { PageTitleService } from 'app/core/page-title/page-title.service';

enum DateRangeEnum {
  today = 'today',
  yesterday = 'yesterday',
  last_7_days = 'last_7_days',
  last_30_days = 'last_30_days',
}

@Component({
  selector: 'ms-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseLocalToUtcPipe],
})
export class TaskComponent implements OnInit, OnDestroy, AfterViewChecked {
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  dataSource = new MatTableDataSource([]);
  searchInternalTask = false;

  // both input only applies if task is called from student card
  @Input() isFromStudentCard;
  @Input() passedStudentId;

  displayedColumns: string[] = [
    'dueDate',
    'taskStatus',
    'createdBy',
    'assigned',
    'priority',
    'createdDate',
    'rncp',
    'class',
    'subject',
    'description',
    'Action',
  ];
  filterColumns: string[] = [
    'dueDateFilter',
    'taskStatusFilter',
    'createdByFilter',
    'assignedFilter',
    'priorityFilter',
    'createdDateFilter',
    'rncpFilter',
    'classFilter',
    'subjectFilter',
    'descriptionFilter',
    'ActionFilter',
  ];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  private subs = new SubSink();
  taskDialogComponent: MatDialogRef<AddTaskDialogComponent>;
  taskStudentDialogComponent: MatDialogRef<AddStudentCardTaskDialogComponent>;
  taskManualDialogComponent: MatDialogRef<ManualTaskDialogComponent>;
  testTaskDialogComponent: MatDialogRef<AddTestTaskDialogComponent>;
  certificationRuleDialogComponent: MatDialogRef<CertificationRulePopUpComponent>;
  cvDialogComponent: MatDialogRef<UploadCvDocTaskComponent>;
  presentationDialogComponent: MatDialogRef<UploadPresentationDocumentTaskComponent>;
  selectedRncpTitleLongName: any;
  selectedRncpTitleName: any;
  configCertificatioRule: MatDialogConfig = {
    disableClose: true,
  };
  config: MatDialogConfig = {
    disableClose: true,
    width: '600px',
  };
  taskDetails = [];
  noData: any;
  createdDateArray = [];
  rncpTitleArray = [];
  filteredRncpTitle: Observable<string[]>;
  dueDateFilter = new UntypedFormControl('');
  taskStatusFilter = new UntypedFormControl('todo');
  createdByFilter = new UntypedFormControl();
  assignedFilter = new UntypedFormControl();
  priorityFilter = new UntypedFormControl('');
  createdDateFilter = new UntypedFormControl('');
  rncpFilter = new UntypedFormControl('');
  classFilter = new UntypedFormControl('');
  subjectFilter = new UntypedFormControl();
  descriptionFilter = new UntypedFormControl();
  currentUser: any;

  isWaitingForResponse = false;
  isWaitingForResponseTask = false;

  pagination = {
    limit: 10,
    page: 0,
  };

  filterValues = {
    test_id: '',
    is_not_parent_task: true,
    task_status: 'todo',
    from: '',
    to: '',
    rncp_title: '',
    class_id: '',
    priority: '',
    due_date: {
      date: '',
      time: '',
    },
    created_at: {
      date: '',
      time: '',
    },
    subject_test: '',
    description: '',
    school_id: '',
    user_id: '',
    task_due_date: null,
    task_table_type: null,
    evaluation_test: '',
  };

  sortingValues = {
    due_date: 'desc',
    status: '',
    from: '',
    to: '',
    priority: '',
    created_at: '',
    rncp_title: '',
    subject_test: '',
    class_name: '',
    evaluation_test: '',
  };

  filteredClass: Observable<any[]>;
  filterClassList = [];

  filteredTitle: Observable<any[]>;
  filterTitleList = [];

  filteredTaskType: Observable<any[]>;
  taskTypeList = [];

  private intVal: any;
  private timeOutVal: any;

  /*
    Variable from param, used by notif url
  */
  taskId = '';
  CurUser: any;
  isEditable = true;
  accessInternal = true;
  isAcadDir = true;
  juryOrganizationName: any;
  myFilter;
  userId: any;

  currentRoute: string;

  constructor(
    private taskService: TaskService,
    private datepipe: DatePipe,
    public dialog: MatDialog,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private translate: TranslateService,
    private studentService: StudentsService,
    private utilService: UtilityService,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private rncpTitlesService: RNCPTitlesService,
    private cdref: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private mailboxService: MailboxService,
    private permissions: NgxPermissionsService,
    private certificationRuleService: CertificationRuleService,
    public permissionService: PermissionService,
    private dateAdapter: DateAdapter<Date>,
    private groupCreationService: GroupCreationService,
    private formFillingService: FormFillingService,
    private pageTitleService: PageTitleService
  ) {}

  ngOnInit() {
    this.currentRoute = this.router.url;
    if(this.currentRoute === '/task') {
      this.pageTitleService.setTitle('NAV.MY_TASK');
    } else if(this.currentRoute === '/student-task') {
      this.pageTitleService.setTitle('NAV.STUDENT_TASK');
    } else if(this.currentRoute === '/user-task') {
      this.pageTitleService.setTitle('NAV.USER_TASK');
    };
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.isAcadDir = !!this.permissions.getPermission('Academic Director');
    this.fromNotifURL();
    this.CurUser = this.authService.getLocalStorageUser();
    this.userTypeChecking();

    this.getTitleList();
    this.getClassList();
    this.getEnumTaskTypeDropdownList();
    this.onLangChangeCheck();

    if (this.isFromStudentCard && this.passedStudentId) {
      this.studentService.getOneStudentUserId(this.passedStudentId).subscribe((resp) => {
        if (resp) {
          this.filterValues.user_id = resp.user_id._id;
          this.userId = resp.user_id._id;
          this.getMyTask();
        }
      });
    } else {
      this.getMyTask();
    }

    this.filterListener();
    if (!!this.permissions.getPermission('Student')) {
      this.getCertificationRule();
    } else {
      // this.getUrgentMail();
    }
  }

  ngAfterViewChecked() {
    this.cdref.detectChanges();
  }

  fromNotifURL() {
    this.subs.sink = this.route.queryParamMap.subscribe((queryParams) => {

      this.taskId = queryParams.get('task');

      if (this.taskId) {
        this.taskService.getOneTask(this.taskId).subscribe((response) => {

          if (response && response.task_status && response.task_status === 'todo') {
            this.openTask(response);
          } else if (response && response.task_status && response.task_status === 'done') {
            this.editTask(response);
          }
        });
      }
    });
  }

  getTitleList() {
    if (this.utilService.isUserEntityADMTC()) {
      this.subs.sink = this.taskService.GetADMTCTitleDropdownList().subscribe((resp) => {
        this.filterTitleList = resp;

        // Sorting value when its uppercase and lowercase
        const sorted = this.filterTitleList.sort((a, b) => {
          const aTranslated = this.translate.instant(a.short_name.toLowerCase());
          const bTranslated = this.translate.instant(b.short_name.toLowerCase());

          if (aTranslated < bTranslated) {
            return -1;
          }

          if (aTranslated > bTranslated) {
            return 1;
          }

          return 0;
        });

        this.filterTitleList = sorted;
        // this.filterTitleList = _.sortBy(this.filterTitleList, 'short_name')
        this.filteredTitle = this.rncpFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) => this.filterTitleList.filter((option) => option.short_name.toLowerCase().includes(searchTxt.toLowerCase()))),
        );
      });
    } else {
      const userType = this.CurUser.entities ? this.CurUser.entities[0].type.name : '';
      this.subs.sink = this.authService.getUserById(this.CurUser._id).subscribe((res) => {
        let dataUSer;
        if (userType === 'Academic Director' || userType === 'Academic Admin') {
          const removeDuplicate = _.uniqBy(res?.entities, 'assigned_rncp_title._id');
          dataUSer = removeDuplicate;
        } else {
          dataUSer = res.entities.filter((ent) => ent.type.name === userType);
        }
        this.filterTitleList = this.utilService.getAllAssignedTitles(dataUSer);

        // Sorting value when its uppercase and lowercase
        const sorted = this.filterTitleList.sort((a, b) => {
          const aTranslated = this.translate.instant(a.short_name.toLowerCase());
          const bTranslated = this.translate.instant(b.short_name.toLowerCase());

          if (aTranslated < bTranslated) {
            return -1;
          }

          if (aTranslated > bTranslated) {
            return 1;
          }

          return 0;
        });

        this.filterTitleList = sorted;
        // this.filterTitleList = _.sortBy(this.filterTitleList, 'short_name')
        this.filteredTitle = this.rncpFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) => this.filterTitleList.filter((option) => option.short_name.toLowerCase().includes(searchTxt.toLowerCase()))),
        );
      });
    }
  }

  getClassList() {
    this.subs.sink = this.rncpTitlesService.getClasses().subscribe((resp) => {
      if (this.utilService.isUserEntityADMTC()) {
        this.filterClassList = resp;

        // Sorting value when its uppercase and lowercase
        const sorted = this.filterClassList.sort((a, b) => {
          const aTranslated = this.translate.instant(a.name.toLowerCase());
          const bTranslated = this.translate.instant(b.name.toLowerCase());

          if (aTranslated < bTranslated) {
            return -1;
          }

          if (aTranslated > bTranslated) {
            return 1;
          }

          return 0;
        });

        this.filterClassList = sorted;
        // this.filterClassList = _.sortBy(this.filterClassList, 'name')
        this.initClassFilter();
      } else {
        const userType = this.CurUser.entities ? this.CurUser.entities[0].type.name : '';
        this.subs.sink = this.authService.getUserById(this.CurUser._id).subscribe((res) => {
          const dataUser = res.entities.filter((ent) => {
            if (userType === 'Academic Admin') {
              return ent.type.name === userType || ent.type.name === 'Academic Director';
            } else {
              return ent.type.name === userType;
            }
          });
          const userClasses = this.utilService.getAcademicAllAssignedClass(dataUser);
          this.filterClassList = _.sortBy(resp, 'name')
            .filter((classItem) => userClasses.includes(classItem._id))
            .sort((classA: any, classB: any) => classA.name.toLowerCase().localeCompare(classB.name.toLowerCase()));
          this.filteredClass = of(this.filterClassList);
          this.initClassFilter();
        });
      }
    });
  }

  initClassFilter() {
    this.filteredClass = this.classFilter.valueChanges.pipe(
      startWith(''),
      map((searchTxt) => this.filterClassList.filter((option) => option.name.toLowerCase().includes(searchTxt.toLowerCase()))),
    );
  }

  getEnumTaskTypeDropdownList() {
    this.taskTypeList = [];
    const tempTaskTypeList = this.rncpTitlesService.getEnumTaskType();
    if (tempTaskTypeList?.length) {
      tempTaskTypeList.forEach((item) => {
        this.taskTypeList.push({
          name: item.name,
          value: item.value,
          initName: this.utilService.simpleDiacriticSensitiveRegex(this.translate.instant('PENDING_TASK_TYPE.' + item.name)),
        });
      });
    }

    this.taskTypeList = _.sortBy(this.taskTypeList, 'initName');
    // this.filteredTaskType = this.descriptionFilter.valueChanges.pipe(
    //   startWith(''),
    //   map((searchTxt) => {
    //     return this.taskTypeList.filter((option) => this.utilService.simpleDiacriticSensitiveRegex(this.translate.instant('PENDING_TASK_TYPE.' + option.name)).toLowerCase().includes(searchTxt.toLowerCase()))}),
    // );
    this.filteredTaskType = this.descriptionFilter.valueChanges.pipe(
      startWith(''),
      map((searchTxt) => this.taskTypeList.filter((option) => this.utilService.simpleDiacriticSensitiveRegex(this.translate.instant('PENDING_TASK_TYPE.' + option.name)).toLowerCase().includes(this.utilService.simpleDiacriticSensitiveRegex(searchTxt.toLowerCase())))),
    );
  }


  onLangChangeCheck() {
    
    this.subs.sink = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.getEnumTaskTypeDropdownList();

    });
  }

  getMyTask() {
    this.pagination = {
      limit: 10,
      page: this.paginator.pageIndex,
    };
    const sorting = this.cleanSortingPayload();
    const filter = this.cleanFilterPayload();
    this.isWaitingForResponse = true;
    this.taskService.getMyTask(this.pagination, sorting, filter).subscribe((resp) => {
      this.isWaitingForResponse = false;
      resp?.map((task) => {
        if(task?.task_status === 'test_flow_complete') {
          if(task?.description === 'Validate Test') {
            task.task_status = 'done';
          } else {
            task.task_status = 'cancelled';
          }
        }
      })
      this.dataSource.data = resp;
      if (resp && resp.length) {
        this.paginator.length = resp[0].count_document ? resp[0].count_document : 0;
      } else {
        this.paginator.length = 0;
      }
    });
  }

  changePage(event: any) {
    this.getMyTask();
  }

  sortData(sort) {

    this.sortingValues = {
      due_date: '',
      status: '',
      from: '',
      to: '',
      priority: '',
      created_at: '',
      rncp_title: '',
      subject_test: '',
      class_name: '',
      evaluation_test: '',
    };

    if (sort.active === 'dueDate' && sort.direction) {
      this.sortingValues.due_date = `${sort.direction}`;
    } else if (sort.active === 'taskStatus' && sort.direction) {
      this.sortingValues.status = `${sort.direction}`;
    } else if (sort.active === 'createdBy' && sort.direction) {
      this.sortingValues.from = `${sort.direction}`;
    } else if (sort.active === 'assigned' && sort.direction) {
      this.sortingValues.to = `${sort.direction}`;
    } else if (sort.active === 'priority' && sort.direction) {
      this.sortingValues.priority = `${sort.direction}`;
    } else if (sort.active === 'createdDate' && sort.direction) {
      this.sortingValues.created_at = `${sort.direction}`;
    } else if (sort.active === 'rncp' && sort.direction) {
      this.sortingValues.rncp_title = `${sort.direction}`;
    } else if (sort.active === 'subject' && sort.direction) {
      // this.sortingValues.subject_test = `${sort.direction}`;
      this.sortingValues.evaluation_test = `${sort.direction}`;
    } else if (sort.active === 'class' && sort.direction) {
      this.sortingValues.class_name = `${sort.direction}`;
    } else {
      this.sortingValues.due_date = 'desc';
    }
    this.paginator.pageIndex = 0;
    if (sort.active && sort.direction) {
      this.getMyTask();
    }
  }

  filterListener() {
    this.subs.sink = this.taskStatusFilter.valueChanges.pipe(debounceTime(800)).subscribe((task_status) => {

      this.filterValues.task_status = task_status;
      this.paginator.pageIndex = 0;
      this.getMyTask();
    });

    this.subs.sink = this.dueDateFilter.valueChanges.subscribe((dueDate) => {

      const tempDate = moment(dueDate).format('DD/MM/YYYY');
      const newDate = this.parseLocalToUTCPipe.transformDate(tempDate, '00:00');
      const newTime = this.parseLocalToUTCPipe.transform('00:00');
      this.filterValues.task_due_date = null;
      this.filterValues.due_date.date = newDate;
      this.filterValues.due_date.time = newTime;
      this.filterValues.due_date.date = this.filterValues.due_date.date !== 'Invalid date' ? this.filterValues.due_date.date : '';
      this.filterValues.due_date.time = this.filterValues.due_date.date ? this.filterValues.due_date.time : '';
      this.paginator.pageIndex = 0;
      this.getMyTask();
    });

    this.subs.sink = this.createdDateFilter.valueChanges.subscribe((createdDate) => {
      const tempDate = moment(createdDate).format('DD/MM/YYYY');
      const newDate = this.parseLocalToUTCPipe.transformDate(tempDate, '00:00');
      const newTime = this.parseLocalToUTCPipe.transform('00:00');
      this.filterValues.created_at.date = newDate;
      this.filterValues.created_at.time = newTime;
      this.filterValues.created_at.date = this.filterValues.created_at.date !== 'Invalid date' ? this.filterValues.created_at.date : '';
      this.filterValues.created_at.time = this.filterValues.created_at.date ? this.filterValues.created_at.time : '';
      this.paginator.pageIndex = 0;
      this.getMyTask();
    });

    this.subs.sink = this.priorityFilter.valueChanges.pipe(debounceTime(800)).subscribe((priority) => {
      if (priority && typeof priority === 'string') {
        priority = parseInt(priority, 10);
      }
      this.filterValues.priority = priority;
      this.paginator.pageIndex = 0;
      this.getMyTask();
    });

    this.subs.sink = this.createdByFilter.valueChanges.pipe(debounceTime(800)).subscribe((from) => {
      this.filterValues.from = from;
      this.paginator.pageIndex = 0;
      this.getMyTask();
    });

    this.subs.sink = this.assignedFilter.valueChanges.pipe(debounceTime(800)).subscribe((to) => {
      this.filterValues.to = to;
      this.paginator.pageIndex = 0;
      this.getMyTask();
    });

    this.subs.sink = this.subjectFilter.valueChanges.pipe(debounceTime(800)).subscribe((subject) => {
      // this.filterValues.subject_test = subject;
      this.filterValues.evaluation_test = subject;
      this.paginator.pageIndex = 0;
      this.getMyTask();
    });
  }

  filterBasedOnDate(dateRanges: string) {
    this.dueDateFilter.patchValue(null, { emitEvent: false });
    this.filterValues.due_date = { time: '', date: '' };
    this.filterValues.task_due_date = DateRangeEnum[dateRanges];
    this.paginator.pageIndex = 0;
    this.getMyTask();
  }

  setTitleFilter(titleId: string) {
    this.filterValues['rncp_title'] = titleId;
    this.paginator.pageIndex = 0;
    if (titleId) {
      this.filterClassDropdownBasedOnTitle(titleId);
    } else {
      this.classFilter.patchValue('', { emitEvent: false });
      this.filterValues['class_id'] = '';
      this.getClassList();
    }
    this.getMyTask();
  }

  setClassFilter(classId: string) {
    this.filterValues['class_id'] = classId;
    this.paginator.pageIndex = 0;
    this.getMyTask();
  }

  setTaskTypeFilter(task_type: string) {
    this.filterValues['description'] = task_type;
    this.paginator.pageIndex = 0;
    this.getMyTask();
  }

  filterClassDropdownBasedOnTitle(titleId) {
    this.subs.sink = this.rncpTitlesService.getClassesByTitle(titleId).subscribe((res) => {
      if (res) {
        this.filterClassList = _.cloneDeep(res);
        this.classFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });
      }
    });
  }

  cleanFilterPayload() {
    const payloadFilter = _.cloneDeep(this.filterValues);
    if (payloadFilter) {
      if (!payloadFilter.test_id) {
        delete payloadFilter.test_id;
      }
      if (!payloadFilter.task_status) {
        delete payloadFilter.task_status;
      }
      if (!payloadFilter.from) {
        delete payloadFilter.from;
      }
      if (!payloadFilter.to) {
        delete payloadFilter.to;
      }
      if (!payloadFilter.rncp_title) {
        delete payloadFilter.rncp_title;
      }
      if (!payloadFilter.priority) {
        delete payloadFilter.priority;
      }
      if (!payloadFilter.subject_test) {
        delete payloadFilter.subject_test;
      }
      if (!payloadFilter.evaluation_test) {
        delete payloadFilter.evaluation_test;
      }
      if (!payloadFilter.description) {
        delete payloadFilter.description;
      }
      if (payloadFilter.due_date && (!payloadFilter.due_date.date || !payloadFilter.due_date.time)) {
        delete payloadFilter.due_date;
      }
      if (payloadFilter.created_at && (!payloadFilter.created_at.date || !payloadFilter.created_at.time)) {
        delete payloadFilter.created_at;
      }
      // check if entity is academic and its not chief group academic then will pass schoolId
      const user = this.utilService.getCurrentUser();
      if (
        user &&
        user.entities &&
        user.entities[0] &&
        user.entities[0].school_type === 'preparation_center' &&
        user.entities[0].school &&
        user.entities[0].school._id
      ) {
        payloadFilter.school_id = user.entities[0].school._id;
      }
      if (!payloadFilter.school_id) {
        delete payloadFilter.school_id;
      }
      if (['/task', '/student-task', '/user-task'].includes(this.currentRoute)) {
        payloadFilter.task_table_type =
          this.currentRoute === '/task'
            ? 'my_task'
            : this.currentRoute === '/student-task'
            ? 'student_task'
            : this.currentRoute === '/user-task'
            ? 'user_task'
            : null;
      }
      if (this.isFromStudentCard && this.passedStudentId) {
        delete payloadFilter.task_table_type;
      }
    }
    return payloadFilter;
  }

  cleanSortingPayload() {
    const payloadSorting = _.cloneDeep(this.sortingValues);
    if (payloadSorting) {
      if (!payloadSorting.due_date) {
        delete payloadSorting.due_date;
      }
      if (!payloadSorting.status) {
        delete payloadSorting.status;
      }
      if (!payloadSorting.from) {
        delete payloadSorting.from;
      }
      if (!payloadSorting.to) {
        delete payloadSorting.to;
      }
      if (!payloadSorting.priority) {
        delete payloadSorting.priority;
      }
      if (!payloadSorting.created_at) {
        delete payloadSorting.created_at;
      }
      if (!payloadSorting.rncp_title) {
        delete payloadSorting.rncp_title;
      }
      if (!payloadSorting.subject_test) {
        delete payloadSorting.subject_test;
      }
      if (!payloadSorting.evaluation_test) {
        delete payloadSorting.evaluation_test;
      }
      if (!payloadSorting.class_name) {
        delete payloadSorting.class_name;
      }
    }
    return payloadSorting;
  }

  translateDate(date) {
    const value = date;
    if (date && typeof date === 'object' && date.time && date.date) {
      return this.parseUTCtoLocal.transformDate(date.date, date.time);
    } else {
      return '';
    }
  }

  reset() {
    this.pagination = {
      limit: 10,
      page: 0,
    };

    this.filterValues = {
      test_id: '',
      is_not_parent_task: true,
      task_status: 'todo',
      from: '',
      to: '',
      priority: '',
      rncp_title: '',
      class_id: '',
      due_date: {
        date: '',
        time: '',
      },
      created_at: {
        date: '',
        time: '',
      },
      subject_test: '',
      evaluation_test: '',
      description: '',
      school_id: '',
      user_id: this.isFromStudentCard ? this.userId : '',
      task_due_date: null,
      task_table_type: null,
    };

    this.sortingValues = {
      due_date: 'desc',
      status: '',
      from: '',
      to: '',
      priority: '',
      created_at: '',
      rncp_title: '',
      subject_test: '',
      class_name: '',
      evaluation_test: '',
    };

    this.dueDateFilter.patchValue('', { emitEvent: false });
    this.taskStatusFilter.patchValue('todo', { emitEvent: false });
    this.createdByFilter.patchValue('', { emitEvent: false });
    this.assignedFilter.patchValue('', { emitEvent: false });
    this.priorityFilter.patchValue('', { emitEvent: false });
    this.createdDateFilter.patchValue('', { emitEvent: false });
    this.rncpFilter.patchValue('');
    this.classFilter.patchValue('', { emitEvent: false });
    this.subjectFilter.patchValue('', { emitEvent: false });
    this.descriptionFilter.patchValue('');

    // reset the sorting arrow
    this.sort.sort({ id: null, start: 'desc', disableClear: false });
    this.getMyTask();
    this.getClassList();
  }

  // This function copied from v1
  getTranslateWhat(name, task?: any) {
    if (task) {
      const juryProcessName = task?.class_id?.jury_process_name;
      
      const templateType =
        task.form_process_id && task.form_process_id.form_builder_id && task.form_process_id.form_builder_id.template_type
          ? task.form_process_id.form_builder_id.template_type
          : '';

      if (task.type.toLowerCase() === 'employability_survey_for_student') {
        const dateString = this.translateDate(task.due_date);

        // const dueDate = new Date(task.dueDate.date);
        // const dateString = dueDate.getDate() + '/' + (dueDate.getMonth() + 1) + '/' + dueDate.getFullYear();
        const esName =
          task.employability_survey_id && task.employability_survey_id.employability_survey_process_id
            ? task.employability_survey_id.employability_survey_process_id.name + ' '
            : '';
        if (this.translate.currentLang.toLowerCase() === 'en') {
          return esName + 'Employability Survey to complete before ' + dateString;
        } else {
          return esName + "Enquête d'employabilité à completer avant le " + dateString;
        }
      } else if (task.type === 'certifier_validation') {
        if (this.translate.currentLang === 'en') {
          return `${'Validate the test correction'} - ${task.school ? task.school.short_name : ''}`;
        } else {
          return `${'Valider la correction'} - ${task.school ? task.school.short_name : ''}`;
        }
      } else if (
        task.type.toLowerCase() === 'admtc_jury_decision' ||
        task.type === 'retake_assign_corrector' ||
        task.type === 'validate_test_correction_for_final_retake' ||
        task.type === 'final_retake_marks_entry'
      ) {
        let value = this.translate.instant('TEST.AUTOTASK.' + name.toUpperCase());
        value = value !== 'TEST.AUTOTASK.' + name.toUpperCase() ? value : name;
        if (task.classId) {
          value = value + ' - ' + task.classId.name + ' - ' + task.school.short_name;
        } else {
          value = value + ' - ' + task.school.short_name;
        }
        return value;
      } else if (task.type === 'student_upload_grand_oral_cv' || task.type === 'student_upload_grand_oral_presentation') {
        if (juryProcessName) {
          if (task.type === 'student_upload_grand_oral_cv') {
            return this.translate.instant('Grand_Oral_Improvement.Student Upload Grand Oral CV', {processName : juryProcessName});
          } else if (task.type === 'student_upload_grand_oral_presentation') {
            return this.translate.instant('Grand_Oral_Improvement.Student Upload Grand Oral Presentation', {processName : juryProcessName});
          }
        } else {
          return this.translate.instant(task.description);
        }
      } else if (
        task.type === 'online_jury_student_attendance_justification' ||
        task.type === 'online_jury_jury_member_attendance_justification'
      ) {
        const value = this.translate.instant(task.description);
        return value;
      } else if (task.type === 'jury_organization_marks_entry') {
        if (task.jury_id && task.jury_id.jury_activity) {
          if (task.jury_id.type === 'retake_grand_oral') {
            const description = juryProcessName ? this.translate.instant('Grand_Oral_Improvement.Mark Entry for Retake Grand Oral', {processName : juryProcessName}) 
            : this.translate.instant('Mark Entry for Retake Grand Oral');
            return `${task.jury_id.name} - ${description}`;
          } else {
            const description = juryProcessName ? this.translate.instant('Grand_Oral_Improvement.Mark Entry for Grand Oral', {processName : juryProcessName}) 
            : this.translate.instant('Mark Entry for Grand Oral');
            return `${task.jury_id.name} - ${description}`;
          }
        } else {
          return `${this.translate.instant('Mark Entry')} - ${
            task && task.student_id && task.student_id.last_name ? task.student_id.last_name : ''
          } ${task && task.student_id && task.student_id.first_name ? task.student_id.first_name : ''} ${
            task && task.student_id && task.student_id.civility ? this.translate.instant(task.student_id.civility) : ''
          }`;
        }
      } else if (
        task.type === 'document_expected' ||
        task.type === 'reupload_expected_document' ||
        task.type === 'upload_final_retake_document'
      ) {
        if (task.type === 'upload_final_retake_document') {
          return (
            (task.rncp && task.rncp.short_name ? task.rncp.short_name : '') +
            ' - ' +
            this.translate.instant('UPLOAD') +
            ' ' +
            task.description +
            ' ' +
            this.translate.instant('DASHBOARD.EXPECTED_DOC_TASK.FOR_FINAL_RETAKE')
          );
        } else if (task.type === 'document_expected') {
          if (task.for_each_student) {
            return (
              (task.student_id
                ? task.student_id.last_name + ' ' + task.student_id.first_name + ' ' + this.translate.instant(task.student_id.civility)
                : '') +
              ' ' +
              (task && task.test_group_id ? task.test_group_id.name : '') +
              ' ' +
              this.translate.instant('UPLOAD') +
              ' ' +
              task.description

              // this.translate.instant('UPLOAD') +
              // ' ' +
              // task.description +
              // ' for ' +
              // (task.student_id ? task.student_id.last_name + ' ' + task.student_id.first_name + ' ' + task.student_id.civility : '')
            );
          } else {
            return (
              (task && task.test_group_id ? task.test_group_id.name : '') +
              ' ' +
              this.translate.instant('UPLOAD') +
              ' ' +
              task.description +
              ' / ' +
              (task.test ? task.test.name : '')
            );
          }
        } else {
          return this.translate.instant('UPLOAD') + ' ' + task.description;
        }
      } else if (
        task.type === 'calendar_step' &&
        task.test &&
        task.test.groupTest &&
        task.test.correctionType === 'certifier' &&
        task.description.toLowerCase() === 'assign corrector'
      ) {
        let value = this.translate.instant('TEST.AUTOTASK.' + name.toUpperCase());
        value = value + ' - ' + task.school.short_name;
        return value;
      } else if (task.type === 'assign_president_jury') {
        return `${this.translate.instant('JURY_ORGANIZATION.ASSIGN_PRESIDENT_JURY')} - ${task.description}`;
      } else if (task.type === 'assign_student_for_jury') {
        return `${this.translate.instant('JURY_ORGANIZATION.TASK_ASSIGN_STUDENT_GROUP')} - ${
          task.jury_id && task.jury_id.name ? task.jury_id.name : ''
        } - ${task.school.short_name}`;
      } else if (task.type === 'student_accept_decision_transcript') {
        return `${this.translate.instant('TRANSCRIPT_PROCESS.student_accept_decision')}`;
      } else if (task.type === 'assign_members_of_final_jury') {
        return `${this.translate.instant('JURY_ORGANIZATION.ASSIGN_MEMBER')} - ${
          task.jury_id && task.jury_id.name ? task.jury_id.name : ''
        }`;
      } else if (task.type === 'create_members_of_final_jury') {
        return `${this.translate.instant('JURY_ORGANIZATION.CREATE_PRESIDENT_JURY')} - ${task.description}`;
      } else if (task.type === 'assign_jury') {
        return `${this.translate.instant('JURY_ORGANIZATION.ASSIGN_JURY')} - ${task.description}`;
      } else if (task.type === 'jury_organization_marks_entry') {
        const dueDate = task.due_date && task.due_date.date ? task.due_date.date : '';
        // const dueDate = this.parseStringDate.transformStringToDate(task.due_date.date);
        // const dateString = dueDate.getDate() + '/' + (dueDate.getMonth() + 1) + '/' + dueDate.getFullYear();
        // const jury_name = task.juryId && task.juryId.name ? task.juryId.name : '';
        // const school_name = task.school && task.school.short_name ? task.school.short_name : '';
        const school_name = task.school && task.school.short_name ? task.school.short_name : '';
        return `${dueDate} - ${school_name} - ${this.translate.instant('QUALITY_CONTROL_TABLE.MARK_ENTRY')}`;
      } else if (task.type === 'input_student_decision_for_retake_v2') {
        return `${this.translate.instant('RETAKE_EXAM.RETAKE_TASK_DECISION')}`;
      } else if (task.type === 'assign_corrector_of_problematic') {
        return `${this.translate.instant('PROBLEMATIC_019.assign_corrector_of_problematic')}`;
      } else if (task && task.type === 'validate_problematic_task') {
        if (this.translate.currentLang.toLowerCase() === 'en') {
          let taskDetails = name.split(' : ');
          taskDetails[taskDetails.length - 1] = 'Validate Problematics';
          taskDetails = taskDetails.join(' : ');
          return taskDetails;
        } else {
          let taskDetails = name.split(' : ');
          taskDetails[taskDetails.length - 1] = 'Notes de problématique à valider';
          taskDetails = taskDetails.join(' : ');
          return taskDetails;
        }
      } else if (task && task.type && task.type.toLowerCase() === 'validate_cross_correction') {
        if (task.crossCorrectionFor) {
          return '';
        } else if (name) {
          const value = this.translate.instant('TEST.AUTOTASK.' + name.toUpperCase());
          return value !== 'TEST.AUTOTASK.' + name.toUpperCase() ? value : name;
        }
      } else if (
        task &&
        task.type &&
        (task.type === 'calendar_step' || task.test ? task.test.correction_type === 'certifier' : false) &&
        (name === 'Assign Corrector' || name === 'Validate Test')
      ) {
        if (task.school && task.type) {
          const value =
            this.translate.instant('TEST.AUTOTASK.' + name.replace(/_/g, ' ').toUpperCase()) +
            ' ' +
            this.translate.instant('for') +
            ' ' +
            task.school.short_name;
          return value;
        } else if (name) {
          const value = this.translate.instant('TEST.AUTOTASK.' + name.toUpperCase());
          return value !== 'TEST.AUTOTASK.' + name.toUpperCase() ? value : name;
        }
      } else if (
        task &&
        task.type &&
        (task.type === 'calendar_step' || task.test ? task.test.correction_type === 'certifier' : false) &&
        name === 'Marks Entry'
      ) {
        if (task.school && task.type && task.test.correction_type === 'certifier') {
          const value =
            this.translate.instant('TEST.AUTOTASK.' + name.replace(/_/g, ' ').toUpperCase()) +
            ' ' +
            this.translate.instant('for') +
            ' ' +
            task.school.short_name;
          return value;
        } else if (name) {
          const value = this.translate.instant('TEST.AUTOTASK.' + name.toUpperCase());
          return value !== 'TEST.AUTOTASK.' + name.toUpperCase() ? value : name;
        }
      } else if (task && task.type && task.type === 'problematic_task') {
        // return `${this.translate.instant('PROBLEMATIC_019.PROBLEMATICFORM.TASK_DESCP_INIT')}: ${name}`;
        return this.translate.instant('PROBLEMATIC_019.PROBLEMATICFORM.problematic_rejected_by_school');
      } else if (
        task.type === 'student_complete_admission_process' ||
        task.type === 'revision_admission_proses' ||
        task.type === 'final_validate_admission_process'
      ) {
        return this.translate.instant('163_TASKS.' + task.type);
      } else if (task.type === 'validate_admission_process') {
        const stepName =
          task.student_admission_process_step_id && task.student_admission_process_step_id.step_title
            ? task.student_admission_process_step_id.step_title
            : '';
        return this.translate.instant('163_TASKS.' + task.type, { stepName: stepName });
      } else if (task.type === 'job_description_task') {
        return this.translate.instant('job_description_task', {
          civility: task.student_id && task.student_id.civility ? this.translate.instant(task.student_id.civility) : '',
          first_name: task.student_id && task.student_id.first_name ? task.student_id.first_name : '',
          last_name: task.student_id && task.student_id.last_name ? task.student_id.last_name : '',
        });
      } else if (task.type === 'complete_job_description') {
        return this.translate.instant('complete_job_description');
      } else if (task.type === 'validate_job_description') {
        return this.translate.instant('validate_job_description', {
          civility: task.student_id && task.student_id.civility ? this.translate.instant(task.student_id.civility) : '',
          first_name: task.student_id && task.student_id.first_name ? task.student_id.first_name : '',
          last_name: task.student_id && task.student_id.last_name ? task.student_id.last_name : '',
        });
      } else if (task.type === 'revision_job_description') {
        return this.translate.instant('revision_job_description');
      } else if (task.type === 'student_upload_retake_grand_oral_presentation') {
        const description = juryProcessName ? this.translate.instant('Grand_Oral_Improvement.Student Upload Retake Grand Oral Certification passport', {processName : juryProcessName}) 
          : this.translate.instant('student_upload_retake_grand_oral_presentation');
        return this.translate.instant(description);
      } else if (task.type === 'student_upload_retake_grand_oral_cv') {
        const description = juryProcessName ? this.translate.instant('Grand_Oral_Improvement.Student Upload Retake Grand Oral CV', {processName : juryProcessName}) 
          : this.translate.instant('student_upload_retake_grand_oral_cv');
        return description;
      } else if (task.type === 'activate_student_contract') {
        return this.translate.instant('activate_student_contract', {
          first_name: task.student_id && task.student_id.first_name ? task.student_id.first_name : '',
          last_name: task.student_id && task.student_id.last_name ? task.student_id.last_name : '',
        });
      } else if (
        task &&
        task.form_process_step_id &&
        task.form_process_step_id.step_type &&
        task.form_process_step_id.step_type === 'step_with_signing_process'
      ) {
        if (templateType === 'quality_file') {
          return this.translate.instant('contract_signing_desc_quality');
        } else if (templateType === 'student_admission') {
          return this.translate.instant('contract_signing_desc_student');
        }
      } else if (task.type === 'complete_form_process') {
        return this.translate.instant('TASKS_' + templateType + '.complete_form_process');
      } else if (task.type === 'revision_form_proses') {
        return this.translate.instant('TASKS_' + templateType + '.revision_form_process');
      } else if (task.type === 'validate_form_process') {
        if (templateType === 'student_admission') {
          const stepName =
            task.student_admission_process_step_id && task.student_admission_process_step_id.step_title
              ? task.student_admission_process_step_id.step_title
              : '';
          return this.translate.instant('TASKS_student_admission.validate_admission_process', { stepName: stepName });
        } else {
          let studentString = '';
          if (task && task.student_id) {
            const studentData = task.student_id;
            studentString =
              this.translate.instant(studentData.civility) + ' ' + studentData.first_name + ' ' + studentData.last_name + ' : ';
          }
          return studentString + this.translate.instant('TASKS_' + templateType + '.validate_form_process');
        }
      } else if (task.type === 'final_validate_form_process') {
        let studentString = '';
        if (task && task.student_id) {
          const studentData = task.student_id;
          studentString = this.translate.instant(studentData.civility) + ' ' + studentData.first_name + ' ' + studentData.last_name + ' : ';
        }
        return studentString + this.translate.instant('TASKS_' + templateType + '.final_validate_form_process');
      } else if (task.type === 'jury_assign_corrector') {
        if (task.jury_id.type === 'retake_grand_oral') {
          const description = juryProcessName ? this.translate.instant('Grand_Oral_Improvement.Assign Retake Grand Oral Corrector', {processName : juryProcessName}) 
          : this.translate.instant('jury_retake_assign_corrector');
          return description;
        } else if (task.jury_id.type === 'grand_oral') {
          const description = juryProcessName ? this.translate.instant('Grand_Oral_Improvement.Assign Grand Oral Corrector', {processName : juryProcessName}) 
          : this.translate.instant('jury_assign_corrector');
          return description;
        } else {
          const description = juryProcessName ? this.translate.instant('Grand_Oral_Improvement.Assign Grand Oral Corrector', {processName : juryProcessName}) 
          : this.translate.instant('jury_assign_corrector');
          return description;
        }
      } else if (
        task.type === 'task_builder' &&
        (task.validation_status === 'validation_in_process' || task.validation_status === 'validate')
      ) {
        return this.translate.instant('validation_task', {
          title: task.description ? task.description : '',
        });
      } else if (name) {
        const value = this.translate.instant('TEST.AUTOTASK.' + name.toUpperCase());
        return value !== 'TEST.AUTOTASK.' + name.toUpperCase() ? value : name;
      } else {
        return '';
      }
    }
  }

  validateOpenTask(task: any) {
    const isTaskBuilder = task?.task_status === 'done' && task?.type === 'task_builder'
    const isTodo = task?.task_status === 'todo'
    return isTodo || isTaskBuilder // validation here is based on condition inside function openTask
  }

  openTask(task: any) {

    if (task && task.task_status && task.task_status === 'todo') {
      if (task && task.description) {
        if (task.description === 'Assign Corrector' || task.type === 'retake_assign_corrector') {
          this.openAssignCorrectorDialog(task);
        } else if (
          task.description === 'Marks Entry' &&
          task.type === 'jury_organization_marks_entry' &&
          task.jury_id &&
          task.jury_id.type &&
          (task.jury_id.type === 'grand_oral' || task.jury_id.type === 'retake_grand_oral')
        ) {
          this.goToMarkEntryGrandOral(task);
        } else if (
          task.description === 'jury_organization_marks_entry' &&
          task.type === 'jury_organization_marks_entry' &&
          task.jury_id &&
          task.jury_id.type &&
          (task.jury_id.type === 'grand_oral' || task.jury_id.type === 'retake_grand_oral') &&
          task.jury_id.jury_activity === 'off_platform_jury'
        ) {
          this.goToJuryMarkEntryTable(task.jury_id._id);
        } else if (task.description === 'Marks Entry' || task.type === 'final_retake_marks_entry') {
          this.goToMarkEntry(task);
        } else if (
          task.description === 'Validate Test' ||
          task.type === 'validate_test_correction_for_final_retake' ||
          task.type === 'validate_jury_organization' ||
          task.type === 'certifier_validation'
        ) {
          this.goToMarkEntry(task);
        } else if (task.description === 'Create Groups') {
          this.goToGroupCreation(task);
        }
        if (task.description === 'Assign Corrector of Problematic') {
          this.openAssignCorrectorOfProblematicDialog(task);
        } else if (task.description === 'Assign Cross Corrector') {
          this.openNewWindow(['/crossCorrection', 'assign-cross-corrector', task.rncp._id, task.class_id._id, task.test._id]);
        }
      }
      if (task && task.type) {
        if (task && task.type === 'validate_problematic_task') {
          if (task && task.school && task.rncp && task.class_id && task.student_id) {
            this.openValidateProblematicDialog(task);
          }
        } else if (task && task.type === 'problematic_task') {
          if (task && task.school && task.rncp && task.class_id && task.student_id) {
            this.openNewWindow(['/academic/problematic', task.school._id, task.rncp._id, task.class_id._id, task.student_id._id]);
          }
        } else if (task.type === 'add_task' || task.type === 'addTask') {
          this.openManualTask(task);
        } else if (task.type === 'employability_survey_for_student') {
          const is_es_new_flow_form_builder =
            task.employability_survey_id.employability_survey_process_id &&
            task.employability_survey_id.employability_survey_process_id.is_es_new_flow_form_builder
              ? task.employability_survey_id.employability_survey_process_id.is_es_new_flow_form_builder
              : false;

          if (is_es_new_flow_form_builder) {
            this.openNewES(task);
          } else {

            this.openEmployabilitySurvey(task);
          }
        } else if ((task.type && task.type === 'document_expected') || task.type === 'upload_final_retake_document') {
          this.openExpectedDocumentDialog(task);
        } else if ((task.type && task.type === 'academic_pro_evaluation') || task.type === 'soft_skill_pro_evaluation') {
          this.openNewWindow(['/correction-eval-pro-step']);
        } else if (
          task.type === 'student_upload_grand_oral_presentation' ||
          task.type === 'student_upload_retake_grand_oral_presentation'
        ) {
          this.openPresentationDialog(task);
        } else if (
          task.type === 'online_jury_student_attendance_justification' ||
          task.type === 'online_jury_jury_member_attendance_justification'
        ) {
          this.openAbsenceJuryDialog(task);
        } else if (task.type === 'student_upload_grand_oral_cv' || task.type === 'student_upload_retake_grand_oral_cv') {
          this.openCvDialog(task);
        } else if (task.type === 'student_confirm_certificate') {
          // when we login as student, redirect him to my file menu, tab "details of certification"
          if (this.utilService.isUserStudent()) {
            this.redirectToMyFileDetailOfCertificationTab(task);
          }
        } else if (task.type === 'assign_jury') {
          this.redirectToAssignJury(task);
        } else if (task.type === 'assign_president_jury' && task.jury_id && task.jury_id._id) {
          this.openNewWindow(['/jury-organization', task.jury_id._id, 'organize-juries', 'assign-president-jury']);
        } else if (task.type === 'assign_member_jury' && task.jury_id && task.jury_id._id) {
          this.openNewWindow(['/jury-organization', task.jury_id._id, 'organize-juries', 'assign-member-jury']);
        } else if (task.type === 'student_accept_decision_transcript') {
          if (this.utilService.isUserStudent()) {
            this.openNewWindow(['/my-file'], { identity: 'Certification' });
          } else {
            this.openNewWindow(['/school', task.school._id], {
              title: task.rncp._id,
              class: task.class_id._id,
              student: task.student_id._id,
              open: 'student-cards',
              selectedTab: 'Certification',
              selectedSubTab: 'Certification',
            });
          }
        } else if (task.type === 'send_copies_cross_corrector') {
          this.openSendCopiesDialog(task);
        } else if (task.type === 'send_copies_validate') {
          this.openSendCopiesDialog(task);
        } else if (task.type === 'assign_student_for_jury' || task.type === 'assign_members_of_final_jury') {
          this.redirectToAssignStudentTable(task);
        } else if (
          task.type === 'complete_form_process' ||
          task.type === 'revision_form_proses' ||
          task.type === 'validate_form_process' ||
          task.type === 'final_validate_form_process'
        ) {
          this.goToProcessForm(task);
        } else if (task.type === 'job_description_task') {
          this.onSendJobDescription(task);
        } else if (task.type === 'complete_job_description') {
          this.redirectToStudentCardJobDescription(task);
        } else if (task.type === 'validate_job_description') {
          this.redirectToStudentCardJobDescription(task);
        } else if (task.type === 'revision_job_description') {
          this.redirectToMyFileJobDescription(task);
        } else if (task.type === 'activate_student_contract') {
          this.redirectToStudentCardCompany(task);
        } else if (task.type === 'jury_assign_corrector') {
          this.AssignCorrectorOffPlatformJuryDialog(task);
        } else if (task.type === 'task_builder') {
          this.openTaskBuilderDialog(task, 'task');
        }
      }
    } else if (task && task.task_status && task.task_status === 'done' && task.type === 'task_builder') {
      this.openTaskBuilderDialog(task, 'done');
    }
  }

  goToJuryMarkEntryTable(id) {
    // this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
    //   this.router.navigate(['/jury-organization', id, 'jury-mark-entry']);
    // });

    this.openNewWindow(['/jury-organization', id, 'jury-mark-entry']);
  }

  onSendJobDescription(task) {
    this.subs.sink = this.dialog
      .open(SendJobDescriptionDialogComponent, {
        minWidth: '630px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        data: task,
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.getMyTask();
        }
      });
  }

  goToProcessForm(taskData) {
    this.isWaitingForResponseTask = true;
    this.subs.sink = this.formFillingService.getOneTaskForFormFilling(taskData._id).subscribe(
      (result) => {
        this.isWaitingForResponseTask = false;
        if (result) {

          const domainUrl = this.router.url.split('/')[0];
          const processId = result.form_process_id && result.form_process_id._id ? result.form_process_id._id : null;
          const userId =
            result.user_selection && result.user_selection.user_id && result.user_selection.user_id._id
              ? result.user_selection.user_id._id
              : null;
          const userTypeId = this.authService.getCurrentUser().entities[0].type._id;
          if (processId && userId) {

            if (
              taskData &&
              taskData.form_process_id &&
              taskData.form_process_id.form_builder_id &&
              taskData.form_process_id.form_builder_id.template_type === 'student_admission'
            ) {
              window.open(
                `${domainUrl}/form-fill?formId=${processId}&formType=student_admission&userId=${userId}&userTypeId=${userTypeId}`,
                '_blank',
              );
            } else if (
              taskData &&
              taskData.form_process_id &&
              taskData.form_process_id.form_builder_id &&
              taskData.form_process_id.form_builder_id.template_type === 'quality_file'
            ) {
              window.open(
                `${domainUrl}/form-fill?formId=${processId}&formType=quality_form&userId=${userId}&userTypeId=${userTypeId}`,
                '_blank',
              );
            } else if (
              taskData &&
              taskData.form_process_id &&
              taskData.form_process_id.form_builder_id &&
              taskData.form_process_id.form_builder_id.template_type === 'employability_survey'
            ) {
              window.open(
                `${domainUrl}form-fill?formId=${processId}&formType=employability_survey&userId=${userId}&userTypeId=${userTypeId}`,
                '_blank',
              );
            }
          }
        }
      },
      (err) => {
        this.isWaitingForResponseTask = false;
        this.swalError(err);
      },
    );
  }

  redirectToMyFileDetailOfCertificationTab(task) {
    this.openNewWindow(['/my-file'], {
      identity: 'Detail of Certification',
      taskTitle: task.rncp._id,
      taskClass: task.class_id._id,
      taskSchool: task.school._id,
    });
  }

  redirectToStudentCardJobDescription(task) {
    this.openNewWindow(['/school', task.school._id], {
      title: task.rncp._id,
      class: task.class_id._id,
      student: task.student_id._id,
      open: 'student-cards',
      selectedTab: 'Company',
      selectedSubTab: 'JobDescription',
      // identity: 'Job Desc',
    });
  }

  redirectToStudentCardCompany(task) {
    this.openNewWindow(['/school', task.school._id], {
      title: task.rncp._id,
      class: task.class_id._id,
      student: task.student_id._id,
      open: 'student-cards',
      selectedTab: 'Company',
      selectedSubTab: 'Company',
    });
  }

  redirectToMyFileJobDescription(task) {
    this.openNewWindow(['/my-file'], {
      identity: 'Job Desc',
      taskTitle: task.rncp._id,
      taskClass: task.class_id._id,
      taskSchool: task.school._id,
    });
  }

  redirectToAssignJury(taskData) {
    const juryId = taskData && taskData.jury_id && taskData.jury_id._id ? taskData.jury_id._id : null;
    if (juryId) {
      this.openNewWindow(['jury-organization', juryId, 'organize-juries', 'assign-jury']);
    }
  }

  redirectToAssignStudentTable(taskData) {
    const juryId = taskData && taskData.jury_id && taskData.jury_id._id ? taskData.jury_id._id : null;
    if (juryId) {
      this.openNewWindow(['jury-organization', juryId, 'organize-juries', 'assign-student-table']);
    }
  }

  editTask(task) {

    if (task && task.task_status && task.task_status === 'done') {
      if (task && task.description) {
        if (task.description === 'Assign Corrector' || task.type === 'retake_assign_corrector') {
          // ************* Check the test progress, only able to edit when there is no mark entry done
          const forkParam = [];
          forkParam.push(this.groupCreationService.CheckIfTestCorrectionMarkExistsForStudentGroupTest(task.test._id, task.school._id));
          // forkParam.push(this.taskService.checkMarkEntryStarted(task.test._id, task.school._id));
          forkParam.push(this.taskService.getTestProgress(task.test._id, task.school._id));
          this.isWaitingForResponseTask = true;
          this.subs.sink = forkJoin(forkParam).subscribe(
            (resp: any[]) => {
              this.isWaitingForResponseTask = false;
              let validation = true;

              if (resp && resp.length) {
                const GetAllTestCorrections = resp[0];
                const GetTestProgress = resp[1];

                if (GetAllTestCorrections) {
                  validation = false;
                }

                if (GetTestProgress && GetTestProgress.mark_entry_done && GetTestProgress.mark_entry_done.length) {
                  validation = false;
                }
              }
              if (validation) {
                this.openAssignCorrectorDialog(task, true);
              } else {
                Swal.fire({
                  type: 'error',
                  title: this.translate.instant('TEST.CHANGE_S1.title'),
                  footer: `<span style="margin-left: auto">CHANGE_S1</span>`,
                  text: this.translate.instant('TEST.CHANGE_S1.text'),
                  confirmButtonText: this.translate.instant('TEST.CHANGE_S1.confirm_btn'),
                });
              }
            },
            (err) => {
              this.isWaitingForResponseTask = false;
              this.swalError(err);
            },
          );
        } else if (task.description === 'Marks Entry' || task.type === 'final_retake_marks_entry') {
          this.goToMarkEntry(task);
        } else if (task.description === 'Validate Test' || task.type === 'validate_test_correction_for_final_retake') {
          this.goToMarkEntry(task);
        } else if (task.description === 'Create Groups') {
          this.goToGroupCreation(task);
        } else if (task.type === 'jury_assign_corrector') {
          this.AssignCorrectorOffPlatformJuryDialog(task);
        }
        // if (task.description === 'Assign Corrector of Problematic') {
        //   this.openAssignCorrectorOfProblematicDialog(task, true);
        // }
      } else {
        if (task.type === 'jury_assign_corrector') {
          // this.isWaitingForResponseTask = true;
          // this.subs.sink = this.taskService.getJuryMarkEntryOffPlatform(this.utilService.getCurrentUserType(), task.jury_id._id, true).subscribe(
          //   (resp) => {
          //     this.isWaitingForResponseTask = false;
          //     if (resp && resp.length) {
          this.AssignCorrectorOffPlatformJuryDialog(task, true);
          //     }
          //   },
          //   (err) => {
          //     this.isWaitingForResponseTask = false;
          //     this.swalError(err);
          //   }
          // )
        }
      }
    } else {
      if (task.type === 'add_task' || task.type === 'addTask') {
        this.editManualTask(task);
      }
    }
  }

  showEditTask(task) {
    if (task && task.task_status && task.task_status === 'done') {
      if (task && task.description) {
        if (task.description === 'Assign Corrector' || task.type === 'retake_assign_corrector' || task.type === 'jury_assign_corrector') {
          return true;
        }
      }
    } else {
      if (task.type === 'add_task' || task.type === 'addTask') {
        return true;
      }
    }

    return false;
  }

  openEmployabilitySurvey(task) {
    this.openNewWindow(['/academic/employability-survey', task.school._id, task.student_id._id, task.employability_survey_id._id]);
  }

  openNewES(task) {
    const currentUser = this.authService.getLocalStorageUser();
    const domainUrl = this.router.url.split('/')[0];
    const processId =
      task.employability_survey_id && task.employability_survey_id.form_process_id._id
        ? task.employability_survey_id.form_process_id._id
        : null;
    const userId = currentUser && currentUser._id ? currentUser._id : null;
    const userTypeId = currentUser.entities[0].type._id;

    if (userId && processId) {
      window.open(
        `${domainUrl}form-fill?formId=${processId}&formType=employability_survey&userId=${userId}&userTypeId=${userTypeId}`,
        '_blank',
      );
    }
  }

  goToMarkEntryGrandOral(row) {
    this.openNewWindow(['/grand-oral'], { juryId: row.jury_id._id, studentId: row.student_id ? row.student_id._id : null });
  }

  openManualTask(task) {
    const dialogRef = this.dialog.open(ManualTaskDialogComponent, {
      width: '600px',
      minHeight: '100px',
      panelClass: 'certification-rule-pop-up',
      disableClose: true,
      data: { taskData: task },
    });
    this.subs.sink = dialogRef.afterClosed().subscribe((result) => {
      this.getMyTask();
    });
  }

  openValidateProblematicDialog(task) {
    const dialogRef = this.dialog.open(ValidateProblematicTaskDialogComponent, {
      width: '500px',
      minHeight: '100px',
      panelClass: 'certification-rule-pop-up',
      disableClose: true,
      data: task,
    });
  }

  editManualTask(task) {
    this.taskDialogComponent = this.dialog.open(AddTaskDialogComponent, {
      ...this.config,
      data: { taskData: task, type: 'edit' },
      panelClass: 'certification-rule-pop-up',
    });
    this.subs.sink = this.taskDialogComponent.afterClosed().subscribe((result) => {
      this.getMyTask();
    });
  }

  openAssignCorrectorDialog(task, isEdit = false) {
    const dialogRef = this.dialog.open(AssignCorrectorDialogComponent, {
      width: '600px',
      minHeight: '100px',
      panelClass: 'certification-rule-pop-up',
      disableClose: true,
      data: {
        edit: isEdit,
        task: task,
        titleId: task.rncp._id,
      },
    });
    this.subs.sink = dialogRef.afterClosed().subscribe((result) => {
      if (result === 'reset') {
        this.getMyTask();
      }
    });
  }

  openSendCopiesDialog(task) {
    const dialogRef = this.dialog
      .open(SendCopiesDialogComponent, {
        width: '600px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: task,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.getMyTask();
        }
      });
  }

  openAssignCorrectorOfProblematicDialog(task, isEdit = false) {
    const dialogRef = this.dialog.open(AssignCorrectorProblematicDialogComponent, {
      width: '600px',
      minHeight: '100px',
      panelClass: 'certification-rule-pop-up',
      disableClose: true,
      data: {
        edit: isEdit,
        task: task,
      },
    });
    this.subs.sink = dialogRef.afterClosed().subscribe((result) => {
      if (result === 'reset') {
        this.getMyTask();
      }
    });
  }

  goToMarkEntry(task) {
    this.openNewWindow(['/test-correction', task.rncp._id, task.test._id], {  task: task._id, school: task.school._id });
  }

  goToGroupCreation(task) {
    this.openNewWindow(['/group-creation', task.rncp._id, task.test._id, task._id]);
  }

  openExpectedDocumentDialog(task) {
    this.dialog
      .open(UploadExpectedDocTaskComponent, {
        width: '700px',
        disableClose: true,
        data: task,
        panelClass: 'expected-doc-task',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          // refresh acadkit and mytasktable
          this.getMyTask();
        }
      });
  }

  openCvDialog(task) {
    this.dialog
      .open(UploadCvDocTaskComponent, {
        width: '700px',
        disableClose: true,
        data: task,
        panelClass: 'expected-doc-task',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          // refresh acadkit and mytasktable
          this.getMyTask();
        }
      });
  }

  openPresentationDialog(task) {
    this.dialog
      .open(UploadPresentationDocumentTaskComponent, {
        width: '700px',
        disableClose: true,
        data: task,
        panelClass: 'expected-doc-task',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          // refresh acadkit and mytasktable
          this.getMyTask();
        }
      });
  }

  AssignCorrectorOffPlatformJuryDialog(task, isEdit = false) {
    this.dialog
      .open(AssignCorrectorOffPlatformJuryDialogComponent, {
        width: '700px',
        disableClose: true,
        data: {
          edit: isEdit,
          task: task,
          titleId: task.rncp._id,
        },
        panelClass: 'expected-doc-task',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          // refresh acadkit and mytasktable
          this.getMyTask();
        }
      });
  }

  openTaskBuilderDialog(task, type) {
    this.subs.sink = this.dialog
      .open(TaskBuilderActionDialogComponent, {
        width: '800px',
        disableClose: true,
        data: {
          taskId: task._id,
          type: type,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.getMyTask();
        }
      });
  }

  openAbsenceJuryDialog(task) {
    this.dialog
      .open(JustifyAbsenceDialogComponent, {
        width: '700px',
        disableClose: true,
        data: task,
        panelClass: 'expected-doc-task',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.getMyTask();
        }
      });
  }

  addTask() {

    if (this.isFromStudentCard && this.passedStudentId) {
      this.taskStudentDialogComponent = this.dialog.open(AddStudentCardTaskDialogComponent, {
        ...this.config,
        data: { taskData: '', type: 'add', studentId: this.passedStudentId },
      });
      this.subs.sink = this.taskStudentDialogComponent.afterClosed().subscribe((result) => {
        this.getMyTask();
      });
    } else {
      this.taskDialogComponent = this.dialog.open(AddTaskDialogComponent, {
        ...this.config,
        data: { taskData: '', type: 'add' },
        panelClass: 'certification-rule-pop-up',
      });
      this.subs.sink = this.taskDialogComponent.afterClosed().subscribe((result) => {
        this.getMyTask();
      });
    }
  }

  addTestTask() {
    this.testTaskDialogComponent = this.dialog.open(AddTestTaskDialogComponent, this.config);
    this.subs.sink = this.taskDialogComponent.afterClosed().subscribe((result) => {
      this.getMyTask();
    });
  }

  displayTranslatedType(taskType): string {

    // return ''
    if (taskType) {
      const foundTask = _.find(this.taskTypeList, (type) => type.value === taskType);
      const taskName = foundTask.name;
      return this.translate.instant('PENDING_TASK_TYPE.' + taskName);
    } else {
      return '';
    }
  }

  getToolTipUser(element) {
    if (element?.user_selection?.user_id) {
      return (
        this.translate.instant(element?.user_selection?.user_id?.civility) +
        ' ' +
        element?.user_selection?.user_id?.first_name +
        ' ' +
        element?.user_selection?.user_id?.last_name.toUpperCase()
      );
    } else if (element?.user_selection?.user_type_id) {
      return this.translate.instant(element?.user_selection?.user_type_id?.name);
    } else {
      return '';
    }
  }

  userTypeChecking() {
    const entityData = _.filter(this.CurUser.entities, function (entity) {
      return (
        entity.type.name === 'CR School Director' ||
        entity.type.name === 'Certifier Admin' ||
        entity.type.name === 'Academic Director' ||
        entity.type.name === 'Academic Admin' ||
        entity.type.name === 'Corrector' ||
        entity.type.name === 'Animator Business game' ||
        entity.type.name === 'Cross Corrector' ||
        entity.type.name === 'Teacher'
      );
    });

    if (entityData && entityData.length) {
      this.isEditable = false;
      this.accessInternal = false;
    } else {
      this.isEditable = true;
      this.accessInternal = true;
    }
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

  getCertificationRule() {
    const studentData = this.authService.getLocalStorageUser();
    const titleId = studentData.entities[0].assigned_rncp_title._id;
    const classId = studentData.entities[0].class._id;
    const studentId = studentData._id;
    this.subs.sink = this.rncpTitlesService.getRncpTitleById(titleId).subscribe((resp) => {
      this.selectedRncpTitleName = resp.short_name;
      this.selectedRncpTitleLongName = resp.long_name;
    });
    this.subs.sink = this.certificationRuleService
      .getCertificationRuleSentWithStudent(titleId, classId, studentId)
      .subscribe((dataRule: any) => {
        if (dataRule) {
          // this.showCertificationRule(titleId, classId);
        } else {
          // this.getUrgentMail();
        }
      });
  }

  showCertificationRule(selectedRncpTitleId, selectedClassId) {
    this.dialog
      .open(CertificationRulePopUpComponent, {
        panelClass: 'reply-message-pop-up',
        ...this.configCertificatioRule,
        data: {
          callFrom: 'global',
          titleId: selectedRncpTitleId,
          classId: selectedClassId,
          titleName: this.selectedRncpTitleName,
          titleLongName: this.selectedRncpTitleLongName,
        },
      })
      .afterClosed()
      .subscribe((result) => {
        // this.getUrgentMail();
      });
  }

  validateEditTask(task) {
    let allow = false;
    if (task.task_status !== 'done') {
      if (task.created_by && task.created_by._id === this.CurUser._id && (task.type === 'add_task' || task.type === 'addTask')) {
        allow = true;
      }
    } else if (task.task_status === 'done') {
      if (
        (task.created_by && task.created_by._id === this.CurUser._id && (task.type === 'add_task' || task.type === 'addTask')) ||
        task.type === 'jury_assign_corrector' ||
        task.description === 'Assign Corrector'
      ) {
        allow = true;
        // this.editManualTask(task);
      }
    }

    return allow;
  }

  validateDeleteTask(task) {
    let allow = false;
    if (task.task_status !== 'done') {
      if (task.created_by && task.created_by._id === this.CurUser._id && task.type === 'add_task') {
        allow = true;
      }
    }
    return allow;
  }

  deleteTask(task) {

    if (task && task.type === 'add_task') {
      let timeDisabled = 6;
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('SWAL_DELETE_TASK.TITLE'),
        html: this.translate.instant('SWAL_DELETE_TASK.TEXT'),
        footer: `<span style="margin-left: auto">SWAL_DELETE_TASK</span>`,
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('SWAL_DELETE_TASK.BUTTON_1', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('SWAL_DELETE_TASK.BUTTON_2'),
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          this.intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('SWAL_DELETE_TASK.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);
          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('SWAL_DELETE_TASK.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(this.intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.subs.sink = this.taskService.deleteManualTask(task._id).subscribe(
            (resp) => {
              if (resp) {

                Swal.fire({
                  type: 'success',
                  title: this.translate.instant('SWAL_DELETE_SUCCESS.TITLE'),
                  footer: `<span style="margin-left: auto">SWAL_DELETE_SUCCESS</span>`,
                  text: this.translate.instant('SWAL_DELETE_SUCCESS.TEXT'),
                  confirmButtonText: this.translate.instant('SWAL_DELETE_SUCCESS.BUTTON'),
                }).then((response) => {
                  this.getMyTask();
                });
              }
            },
            (err) => {
              Swal.fire({
                type: 'error',
                title: 'Error',
                text: err && err['message'] ? err['message'] : err,
                confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
              });
            },
          );
        }
      });
    }
  }

  swalError(err) {

    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    });
  }

  taskFrom(task) {
    let colorTask;
    if (task?.created_by?.entities?.length) {
      let entityTitleManager = task?.created_by?.entities.find((entity) => entity?.type?.name === 'ADMTC Director');
      if (entityTitleManager) {
        colorTask = 'red-text';
      }
    }
    return colorTask;
  }


  showActionButton(typeButton) {
    const route = this.checkRoutes();
    if (route) {
      return this.permissionService.showActionButtonTaskPerm(route, typeButton);
    } else {
      return false;
    }
  }

  checkRoutes() {
    const routes =
      this.currentRoute === '/task'
        ? 'my_task'
        : this.currentRoute === '/student-task'
        ? 'student_task'
        : this.currentRoute === '/user-task'
        ? 'user_task'
        : '';

    return routes;
  }

  openNewWindow(path: string[], params?: any) {
    const url = this.router.createUrlTree(path, { queryParams: params || {} });
    window.open(url.toString(), '_blank');
  }

  ngOnDestroy() {
    this.pageTitleService.setTitle('');
    this.subs.unsubscribe();
  }
}
