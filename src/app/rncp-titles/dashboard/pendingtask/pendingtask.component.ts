import { Component, ViewChild, OnInit, OnDestroy, Input, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { RNCPTitlesService } from '../../../service/rncpTitles/rncp-titles.service';
import { SubSink } from 'subsink';
import { DateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntypedFormControl } from '@angular/forms';
import * as moment from 'moment';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { SchoolService } from 'app/service/schools/school.service';
import { startWith, map, debounceTime } from 'rxjs/operators';
import { isNumber } from 'util';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { AssignCorrectorDialogComponent } from 'app/task/assign-corrector-dialog/assign-corrector-dialog.component';
import { Router, ActivatedRoute } from '@angular/router';
import { UtilityService } from 'app/service/utility/utility.service';
import { UploadExpectedDocTaskComponent } from '../upload-expected-doc-task/upload-expected-doc-task.component';
import { SelectedTask } from '../academic-kit.model';
import { PermissionService } from 'app/service/permission/permission.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UsersService } from 'app/service/users/users.service';
import { AssignCorrectorProblematicDialogComponent } from 'app/shared/components/assign-corrector-problematic-dialog/assign-corrector-problematic-dialog.component';
import { NgxPermissionsService } from 'ngx-permissions';
import { ManualTaskDialogComponent } from 'app/task/manual-task-dialog/manual-task-dialog.component';
import { ValidateProblematicTaskDialogComponent } from 'app/shared/components/validate-problematic-task-dialog/validate-problematic-task-dialog.component';
import Swal from 'sweetalert2';
import { ExportCsvService } from 'app/service/export-csv/export-csv.service';
import { SendCopiesDialogComponent } from 'app/shared/send-copies-dialog/send-copies-dialog.component';
import { UploadCvDocTaskComponent } from 'app/rncp-titles/dashboard/upload-cv-doc-task/upload-cv-doc-task.component';
import { UploadPresentationDocumentTaskComponent } from 'app/rncp-titles/dashboard/upload-presentation-document-task/upload-presentation-document-task.component';
import { JustifyAbsenceDialogComponent } from '../justify-absence-dialog/justify-absence-dialog.component';
import { FormFillingService } from 'app/form-filling/form-filling.service';
import { SendJobDescriptionDialogComponent } from 'app/shared/components/send-job-description-dialog/send-job-description-dialog.component';
import { AssignCorrectorOffPlatformJuryDialogComponent } from 'app/task/assign-corrector-off-platform-jury-dialog/assign-corrector-off-platform-jury-dialog.component';
import { TaskBuilderActionDialogComponent } from 'app/shared/components/task-builder-action-dialog/task-builder-action-dialog.component';

@Component({
  selector: 'ms-pendingtask',
  templateUrl: './pendingtask.component.html',
  styleUrls: ['./pendingtask.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseLocalToUtcPipe],
})
export class PendingTaskComponent implements OnInit, OnDestroy {
  @Input() titleId: string;
  @Output() goToCalendar = new EventEmitter<any>();
  selectedClass: any;
  rncpTitles: any;
  noData: any;
  schoolsList = [];
  private subs = new SubSink();
  isReset = false;
  disabledExport = true;
  exportName: 'Export';
  allTasksForExport = [];

  filteredSchool: Observable<any[]>;
  filterSchoolList = [];

  // filteredClass: Observable<any[]>;
  // filterClassList = [];

  filteredTaskType: Observable<any[]>;
  taskTypeList = [];

  filteredSubjectFilter: Observable<any[]>;
  filterSubjectList = [];

  displayedColumns: string[] = [
    'dueDate',
    'school',
    // 'class',
    'assignedFrom',
    'assignedTo',
    'description',
    'test',
    // 'priority'
  ];
  filterColumns: string[] = [
    'dueDateFilter',
    'schoolFilter',
    // 'classFilter',
    'assignedFromFilter',
    'assignedToFilter',
    'descriptionFilter',
    'testFilter',
    // 'priorityFilter',
  ];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource = new MatTableDataSource([]);
  priorityList = [
    { name: 'AllM', id: null },
    { name: '1', id: 1 },
    { name: '2', id: 2 },
    { name: '3', id: 3 },
  ];

  dueDateFilter = new UntypedFormControl('');
  schoolFilter = new UntypedFormControl('');
  // classFilter = new FormControl('');
  assignedFromFilter = new UntypedFormControl('');
  assignedToFilter = new UntypedFormControl('');
  descriptionFilter = new UntypedFormControl(null);
  testFilter = new UntypedFormControl('');
  priorityFilter = new UntypedFormControl('all');

  // Variables for BE filter, sorting, and pagination
  filteredValues = {
    dueDate: {
      date: '',
      time: '',
    },
    school: '',
    class: '',
    assignedFrom: '',
    assignedTo: '',
    task_type: '',
    test: '',
    priority: null,
  };
  pagination = {
    limit: 10,
    page: 0,
  };
  originalTaskType;
  sorting = {
    school_name: null,
    class_name: null,
    from: null,
    to: null,
    subject: null,
    due_date: 'desc',
    task_type: null,
    priority: null,
  };

  maleStudentIcon = '../../../../../assets/img/student_icon.png';
  femaleStudentIcon = '../../../../../assets/img/student_icon_fem.png';
  isWaitingForResponse = false;

  schoolId;
  LoggedInUserTypeId: string;

  isUserVisitor;

  constructor(
    private rncpTitlesService: RNCPTitlesService,
    private schoolService: SchoolService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private translate: TranslateService,
    private acadservice: AcademicKitService,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    public dialog: MatDialog,
    private router: Router,
    private utilityService: UtilityService,
    private route: ActivatedRoute,
    public permissionService: PermissionService,
    private authService: AuthService,
    private usersService: UsersService,
    private permissions: NgxPermissionsService,
    private dateAdapter: DateAdapter<Date>,
    private exportCsvService: ExportCsvService,
    private formFillingService: FormFillingService,
    private utilService: UtilityService
  ) {}

  ngOnInit() {
    this.isUserVisitor = !!this.permissions.getPermission('ADMTC Visitor');

    this.dateAdapter.setLocale(this.translate.currentLang);
    // Check if there is school id in query param, if true will get pending task for this school only, used by chief goup academic
    if (this.route.snapshot.queryParamMap.get('schoolId')) {
      this.schoolId = this.route.snapshot.queryParamMap.get('schoolId');
    }
    this.initSelectedClassListener();
    this.getTitleName();
    this.getUserTypeId();
    // this.getSchoolDropdownList();
    // this.getClassDropdownList();
    this.initFilter();
    // this.subs.sink = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
    //   this.dateAdapter.setLocale(this.translate.currentLang);
    //   if (this.originalTaskType && this.originalTaskType.length) {
    //     this.taskTypeList = [];
    //     this.originalTaskType.forEach((item) => {
    //       this.taskTypeList.push({ value: item.value, name: item.name });
    //     });
    //     this.filteredTaskType = this.descriptionFilter.valueChanges.pipe(
    //       startWith(''),
    //       map((searchTxt) => this.taskTypeList.filter((option) => option.name.toLowerCase().includes(searchTxt.toLowerCase()))),
    //     );
    //   }
    // });
  }

  initSelectedClassListener() {
    this.acadservice.selectedClass$.subscribe((classObj) => {
      if (classObj) {
        this.selectedClass = classObj;
        if (this.paginator) {
          this.paginator.pageIndex = 0;
        }
        this.getPendingTasks();
        this.getSchoolDropdownList();
        this.getEnumTaskTypeDropdownList();
        this.getSubjectEvaluationDropdownList();
      }
    });
  }

  getUserTypeId() {
    const loggedInUserType = this.authService.getPermission();
    if (loggedInUserType[0]) {
      this.usersService.getUserTypeId(loggedInUserType[0]).subscribe((resp) => {
        if (resp && resp[0] && resp[0]._id) {
          this.LoggedInUserTypeId = resp[0]._id;
          this.getPendingTasks();
        }
      });
    } else {
      this.getPendingTasks();
    }
  }

  initFilter() {
    this.subs.sink = this.dueDateFilter.valueChanges.subscribe((dueDate) => {
      const tempDate = moment(dueDate).format('DD/MM/YYYY');
      const newDate = this.parseLocalToUTCPipe.transformDate(tempDate, '00:00');
      const newTime = this.parseLocalToUTCPipe.transform('00:00');
      this.filteredValues['dueDate']['date'] = newDate;
      this.filteredValues['dueDate']['time'] = newTime;
      this.filteredValues.dueDate.date = this.filteredValues.dueDate.date !== 'Invalid date' ? this.filteredValues.dueDate.date : '';
      this.filteredValues.dueDate.time = this.filteredValues.dueDate.date ? this.filteredValues.dueDate.time : '';
      if (!this.isReset) {
        this.paginator.pageIndex = 0;
        this.getPendingTasks();
      }
    });

    this.subs.sink = this.assignedFromFilter.valueChanges.pipe(debounceTime(800)).subscribe((assignedFrom) => {
      this.filteredValues['assignedFrom'] = assignedFrom;
      if (!this.isReset) {
        this.paginator.pageIndex = 0;
        this.getPendingTasks();
      }
    });

    this.subs.sink = this.assignedToFilter.valueChanges.pipe(debounceTime(800)).subscribe((assignedTo) => {
      this.filteredValues['assignedTo'] = assignedTo;
      if (!this.isReset) {
        this.paginator.pageIndex = 0;
        this.getPendingTasks();
      }
    });

    this.subs.sink = this.priorityFilter.valueChanges.subscribe((priority) => {
      this.filteredValues['priority'] = priority;
      if (!this.isReset) {
        this.paginator.pageIndex = 0;
        this.getPendingTasks();
      }
    });

    // this.dataSource.filterPredicate = this.customFilterPredicate();
  }

  setSchoolFilter(schoolId: string) {
    this.filteredValues['school'] = schoolId;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getPendingTasks();
    }
  }

  setClassFilter(classId: string) {
    this.filteredValues['class'] = classId;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getPendingTasks();
    }
  }

  setTaskTypeFilter(task_type: string) {
    this.filteredValues['task_type'] = task_type && task_type!=='All'?task_type:null;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getPendingTasks();
    }
  }

  setSubjectFilter(subjectName: string) {
    this.filteredValues['test'] = subjectName;
    if (!this.isReset) {
      this.paginator.pageIndex = 0;
      this.getPendingTasks();
    }
  }

  getTitleName() {
    this.subs.sink = this.rncpTitlesService.getTitleName(this.titleId).subscribe((result) => {
      if (result) {
        this.rncpTitles = result;
      }
    });
  }

  getPendingTasks() {
    if (!this.selectedClass._id) {
      return;
    }
    this.pagination = {
      limit: 10,
      page: this.paginator.pageIndex,
    };
    const filter = {
      due_date: this.filteredValues.dueDate ? this.filteredValues.dueDate : '',
      school_name: this.filteredValues.school ? this.filteredValues.school : '',
      class_name: this.selectedClass ? this.selectedClass._id : '',
      from: this.filteredValues.assignedFrom ? this.filteredValues.assignedFrom : '',
      to: this.filteredValues.assignedTo ? this.filteredValues.assignedTo : '',
      task_type: this.filteredValues.task_type ? this.filteredValues.task_type : '',
      subject: this.filteredValues.test ? this.filteredValues.test : '',
      priority: this.filteredValues.priority ? this.filteredValues.priority : null,
    };

    const payloadFilter = this.cleanFilterPayload(filter);
    this.isWaitingForResponse = true;

    // check if entity is academic and its not chief group academic then will pass schoolId
    const user = this.utilityService.getCurrentUser();
    if (
      user &&
      user.entities &&
      user.entities[0] &&
      user.entities[0].school_type === 'preparation_center' &&
      user.entities[0].school &&
      user.entities[0].school._id
    ) {
      this.schoolId = user.entities[0].school._id;
    }

    if (this.schoolId) {
      this.subs.sink = this.rncpTitlesService
        .getAllPendingTasksBySchool(this.titleId, this.pagination, this.sorting, payloadFilter, this.schoolId, this.LoggedInUserTypeId)
        .subscribe((result: any[]) => {
          // this.isReset = false;
          this.isWaitingForResponse = false;
          if (result && result.length) {
            const data = _.cloneDeep(result);

            // data.forEach((element, index) => {
            //   if (element && element.due_date) {
            //     element.due_date = this.translateDate(element.due_date);
            //   }
            // });

            this.dataSource.data = data;
            this.paginator.length = data[0].count_document ? data[0].count_document : 0;
          } else {
            this.dataSource.data = [];
            this.paginator.length = 0;
          }
          this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
        });
    } else {
      this.subs.sink = this.rncpTitlesService
        .getAllPendingTasks(this.titleId, this.pagination, this.sorting, payloadFilter, this.LoggedInUserTypeId)
        .subscribe((result: any[]) => {
          // this.isReset = false;
          this.isWaitingForResponse = false;
          if (result && result.length) {
            const data = _.cloneDeep(result);

            // data.forEach((element, index) => {
            //   if (element && element.due_date) {
            //     element.due_date = this.translateDate(element.due_date);
            //   }
            // });

            this.dataSource.data = data;
            this.paginator.length = data[0].count_document ? data[0].count_document : 0;
          } else {
            this.dataSource.data = [];
            this.paginator.length = 0;
          }
          this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
        });
    }
  }

  cleanFilterPayload(data) {
    if (data) {
      if (data.due_date && (!data.due_date.date || !data.due_date.time)) {
        delete data.due_date;
      }
      if (!data.school_name) {
        delete data.school_name;
      }
      if (!data.class_name) {
        delete data.class_name;
      }
      if (!data.from) {
        delete data.from;
      }
      if (!data.to) {
        delete data.to;
      }
      if (!data.task_type) {
        delete data.task_type;
      }
      if (!data.subject) {
        delete data.subject;
      }
      if (!data.priority) {
        delete data.priority;
      }
    }
    return data;
  }

  getSchoolDropdownList() {
    this.subs.sink = this.acadservice.getSchoolDropDownListByClass(this.titleId, this.selectedClass._id).subscribe((schoolList) => {
      let tempSchool = _.cloneDeep(schoolList);

      // *************** Filter school based on school assigned to user if user is acad dir or acad admin
      if (this.utilityService.isUserAcadDirAdmin()) {
        const school = this.utilityService.getUserAllSchoolAcadDirAdmin();
        tempSchool = tempSchool.filter((schoolData) => school.includes(schoolData._id));
      }

      // *************** Filter school based on school id if user is chief group
      if (this.utilityService.isChiefGroupAcademic()) {
        tempSchool = tempSchool.filter((schoolData) => this.schoolId === schoolData._id);
      }

      this.filterSchoolList = _.cloneDeep(tempSchool);
      this.filteredSchool = this.schoolFilter.valueChanges.pipe(
        startWith(''),
        map((searchTxt) => this.filterSchoolList.filter((option) => option.short_name.toLowerCase().includes(searchTxt.toLowerCase()))),
      );
    });
  }

  formatText(text: string) {
    if (!text || typeof text !== 'string') return '';
    const formated = text.toLocaleLowerCase().trim();
    return this.utilService.simpleDiacriticSensitiveRegex(formated);
  }

  getSubjectEvaluationDropdownList() {
    this.subs.sink = this.acadservice.getSubjectEvaluationDropdownList(this.titleId, this.selectedClass._id).subscribe((subjectList) => {
      this.filterSubjectList = _.cloneDeep(subjectList);
      
      // flatten the data
      this.filterSubjectList = this.filterSubjectList.map(subject => {
        subject.name = subject.test.subject_id.subject_name;
        delete subject.test; return subject;
      });

      // remove duplicated data
      this.filterSubjectList = _.uniqBy(this.filterSubjectList, subject => {
        return subject.name;
      });

      this.filteredSubjectFilter = this.testFilter.valueChanges.pipe(
        startWith(''),
        map((searchTxt) => {
          const filtered = this.filterSubjectList.filter((subject) => subject.name.toLowerCase().includes(searchTxt.toLowerCase()));
          return filtered.sort((a, b) => this.formatText(a.name).localeCompare(this.formatText(b.name)));
        }),
      );
    });
  }

  // getClassDropdownList() {
  //   this.subs.sink = this.acadservice.getClassDropDownList(this.titleId).subscribe((classList) => {
  //
  //     this.filterClassList = _.cloneDeep(classList);
  //     this.filteredClass = this.classFilter.valueChanges.pipe(
  //       startWith(''),
  //       map((searchTxt) => this.filterClassList.filter((option) => option.name.toLowerCase().includes(searchTxt.toLowerCase()))),
  //     );
  //   });
  // }

  getEnumTaskTypeDropdownList() {
    this.subs.sink = this.acadservice.getTaskTypeDropdownList(this.titleId, this.selectedClass._id).subscribe((taskList) => {
      this.originalTaskType = _.cloneDeep(taskList);
      this.taskTypeList = this.rncpTitlesService.getTaskTypeList();
      //remove duplicate type
      this.originalTaskType = _.uniqBy(this.originalTaskType, "type");

      this.originalTaskType = this.originalTaskType.map((taskType) => {
        return taskType.type;
      })

      // filter with static data
      this.taskTypeList = this.taskTypeList.filter((taskList) => this.originalTaskType.includes(taskList.value));
      
      this.filteredTaskType = this.descriptionFilter.valueChanges.pipe(
        startWith(''),
        map((searchTxt) => {
          const filtered = this.taskTypeList.filter((option) => option.name.toLowerCase().includes(searchTxt.toLowerCase()));
          return filtered.sort((a, b) => this.formatText(a.name).localeCompare(this.formatText(b.name)));
        })
      );
    });
    // const listType = this.rncpTitlesService.getEnumTaskType();
    // this.originalTaskType = this.rncpTitlesService.getEnumTaskType();
    // this.taskTypeList = this.originalTaskType;
    // listType.forEach((item) => {
    //   const typeEntity = this.getTranslateType(item.name);
    //   this.taskTypeList.push({ value: item.value, name: typeEntity });
    // });
    // this.filteredTaskType = this.descriptionFilter.valueChanges.pipe(
    //   startWith(''),
    //   map((searchTxt) => this.taskTypeList.filter((option) => option.name.toLowerCase().includes(searchTxt.toLowerCase()))),
    // );
  }

  getTranslateType(name) {
    if (name) {
      const value = this.translate.instant('PENDING_TASK_TYPE.' + name);
      return value;
    }
  }

  changePage(event: any) {
    this.getPendingTasks();
  }

  translateDate(date) {
    let value = date;
    if (date && typeof date === 'object' && date.time && date.date) {
      return this.parseUTCtoLocal.transformDate(date.date, date.time);
    } else {
      if (isNumber(date)) {
        value = date.toString();
      }
      if (value.length === 8 && !value.includes('-')) {
        const year: number = +value.substring(0, 4);
        const month: number = +value.substring(4, 6);
        const day: number = +value.substring(6, 8);
        return [year, month, day].join('-');
      }
    }
  }

  sortData(sort) {
    this.sorting = {
      school_name: null,
      class_name: null,
      from: null,
      to: null,
      subject: null,
      due_date: null,
      task_type: null,
      priority: null,
    };

    if (sort.active === 'dueDate' && sort.direction) {
      this.sorting.due_date = `${sort.direction}`;
    } else if (sort.active === 'school' && sort.direction) {
      this.sorting.school_name = `${sort.direction}`;
    } else if (sort.active === 'class' && sort.direction) {
      this.sorting.class_name = `${sort.direction}`;
    } else if (sort.active === 'assignedFrom' && sort.direction) {
      this.sorting.from = `${sort.direction}`;
    } else if (sort.active === 'assignedTo' && sort.direction) {
      this.sorting.to = `${sort.direction}`;
    } else if (sort.active === 'description' && sort.direction) {
      this.sorting.task_type = `${sort.direction}`;
    } else if (sort.active === 'test' && sort.direction) {
      this.sorting.subject = `${sort.direction}`;
    } else if (sort.active === 'priority' && sort.direction) {
      this.sorting.priority = `${sort.direction}`;
    } else {
      this.sorting.due_date = 'desc';
    }
    this.paginator.pageIndex = 0;
    if (sort.active && sort.direction) {
      this.getPendingTasks();
    }
  }

  customFilterPredicate() {
    return function (data, filter: string): boolean {
      const searchString = JSON.parse(filter);
      let newDate = moment(searchString.dueDate).format('YYYY-MM-DD');
      newDate = newDate !== 'Invalid date' ? newDate : '';

      const dueDateFound = data.dueDate.toString().trim().toLowerCase().indexOf(newDate) !== -1;

      const schoolFound =
        searchString.school === ''
          ? true
          : data.user_selection.user_id.entities[0].school
          ? data.user_selection.user_id.entities[0].school.long_name
              .toString()
              .trim()
              .toLowerCase()
              .indexOf(searchString.school.toLowerCase()) !== -1
          : false;

      const assignedFromFound = data.created_by.toString().trim().toLowerCase().indexOf(searchString.assignedFrom.toLowerCase()) !== -1;

      const assignedToFound =
        data.user_selection.user_id.first_name.toString().trim().toLowerCase().indexOf(searchString.assignedTo.toLowerCase()) !== -1;

      const descriptionFound = data.description.toString().trim().toLowerCase().indexOf(searchString.description) !== -1;

      const testFound =
        searchString.test === ''
          ? true
          : data.test
          ? data.test.subject_id.subject_name.toString().trim().toLowerCase().indexOf(searchString.test) !== -1
          : false;

      const priorityFound =
        searchString.priority === 'all' ? true : data.priority.toString().trim().toLowerCase().indexOf(searchString.priority) !== -1;

      return dueDateFound && schoolFound && assignedFromFound && assignedToFound && descriptionFound && testFound && priorityFound;
    };
  }

  resetAllFilter() {
    this.isReset = true;
    this.sort.direction = '';
    this.sort.active = '';
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.filteredValues = {
      dueDate: {
        date: '',
        time: '',
      },
      school: '',
      class: this.selectedClass ? this.selectedClass._id : '',
      assignedFrom: '',
      assignedTo: '',
      task_type: '',
      test: '',
      priority: null,
    };
    this.paginator.pageIndex = 0;
    // this.dataSource.filter = JSON.stringify(this.filteredValues);

    this.dueDateFilter.setValue('');
    this.schoolFilter.setValue('');
    // this.classFilter.setValue('');
    this.assignedFromFilter.setValue('');
    this.assignedToFilter.setValue('');
    this.descriptionFilter.setValue(null);
    this.testFilter.setValue('');
    this.priorityFilter.setValue(null);
    this.getPendingTasks();
    setTimeout(() => {
      this.isReset = false;
    }, 900);
  }

  getTaskTranslation(task): string {
    const taskType = task;
    if (taskType) {
      const convertedTaskType = taskType.replace(/_/g, ' ').toUpperCase();
      return this.translate.instant('TEST.AUTOTASK.' + convertedTaskType);
    } else {
      return taskType;
    }
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
        // const dueDate = new Date(task.dueDate);
        // const dateString = dueDate.getDate() + '/' + (dueDate.getMonth() + 1) + '/' + dueDate.getFullYear();
        const dateString = this.translateDate(task.due_date);
        const esName =
          task.employability_survey_id && task.employability_survey_id.employability_survey_process_id
            ? task.employability_survey_id.employability_survey_process_id.name + ' '
            : '';
        if (this.translate.currentLang.toLowerCase() === 'en') {
          return esName + 'Employability Survey to complete before ' + dateString;
        } else {
          return esName + "Enquête d'employabilité à completer avant le " + dateString;
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
        if (task?.class_id?.jury_process_name) {
          if (task.type === 'student_upload_grand_oral_cv') {
            return this.translate.instant('Grand_Oral_Improvement.Student Upload Grand Oral CV', {
              processName: task?.class_id?.jury_process_name ? task?.class_id?.jury_process_name : 'Grand Oral',
            });
          } else if (task.type === 'student_upload_grand_oral_presentation') {
            return this.translate.instant('Grand_Oral_Improvement.Student Upload Grand Oral Presentation', {
              processName: task?.class_id?.jury_process_name ? task?.class_id?.jury_process_name : 'Grand Oral',
            });
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
            return `${task.jury_id.name} - ${this.translate.instant('Grand_Oral_Improvement.Mark Entry Retake Grand Oral', {
              processName: task?.class_id?.jury_process_name ? task?.class_id?.jury_process_name : 'Grand Oral',
            })}`;
          } else {
            return `${task.jury_id.name} - ${this.translate.instant('Grand_Oral_Improvement.Mark Entry Grand Oral', {
              processName: task?.class_id?.jury_process_name ? task?.class_id?.jury_process_name : 'Grand Oral',
            })}`;
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
            this.rncpTitles['short_name'] +
            ' - ' +
            this.translate.instant('UPLOAD') +
            ' ' +
            task.description +
            ' ' +
            this.translate.instant('DASHBOARD.EXPECTED_DOC_TASK.FOR_FINAL_RETAKE')
          );
        } else if (task.test_group_id && task.test_group_id.name) {
          const testName = task && task.test && task.test.name ? ' / ' + task.test.name : '';
          return `${this.translate.instant('GROUP_TEST_TABLE.GROUP')} ${task.test_group_id.name} ${this.translate.instant('UPLOAD')} ${
            task.description
          } ${testName}`;
        } else {
          return `${task && task.student_id && task.student_id.last_name ? task.student_id.last_name : ''} ${
            task && task.student_id && task.student_id.first_name ? task.student_id.first_name : ''
          } ${
            task && task.student_id && task.student_id.civility ? this.translate.instant(task.student_id.civility) : ''
          } ${this.translate.instant('UPLOAD')} ${task.description}`;
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
      } else if (task.type === 'create_members_of_final_jury') {
        return `${this.translate.instant('JURY_ORGANIZATION.CREATE_PRESIDENT_JURY')} - ${task.description}`;
      } else if (task.type === 'assign_jury') {
        return `${this.translate.instant('JURY_ORGANIZATION.ASSIGN_JURY')} - ${task.description}`;
      } else if (task.type === 'assign_student_for_jury') {
        return `${this.translate.instant('JURY_ORGANIZATION.ASSIGN_STUDENT_JURY')}`;
      } else if (task.type === 'jury_organization_marks_entry' && false) {
        const dueDate = new Date(task.dueDate);
        const dateString = dueDate.getDate() + '/' + (dueDate.getMonth() + 1) + '/' + dueDate.getFullYear();
        const jury_name = task.juryId && task.juryId.name ? task.juryId.name : '';
        const school_name = task.school && task.school.short_name ? task.school.short_name : '';
        return `${jury_name} - ${dateString} - ${school_name} - ${this.translate.instant('QUALITY_CONTROL_TABLE.MARK_ENTRY')}`;
      } else if (task.type === 'input_student_decision_for_retake_v2') {
        return `${this.translate.instant('RETAKE_EXAM.RETAKE_TASK_DECISION')}`;
      } else if (task.type === 'assign_corrector_of_problematic') {
        return `${this.translate.instant('PROBLEMATIC_019.assign_corrector_of_problematic')}`;
      } else if (task.type === 'student_accept_decision_transcript') {
        return `${this.translate.instant('TRANSCRIPT_PROCESS.student_accept_decision')}`;
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
          // const nameCivility =
          //   this.getPendingTask.computeCivility(task.crossCorrectionFor.sex, this.translate.currentLang.toUpperCase()) +
          //   ' ' +
          //   task.crossCorrectionFor.lastName;
          // const schoolWithCorrector = ' ' + task.crossCorrectionFor.entity.school.short_name + ' ' + nameCivility;
          // const value = this.translate.instant('TEST.AUTOTASK.' + 'validatecrosscorrection'.toUpperCase()) + ' ' + schoolWithCorrector;
          // return value;
        } else if (name) {
          const value = this.translate.instant('TEST.AUTOTASK.' + name.toUpperCase());
          return value !== 'TEST.AUTOTASK.' + name.toUpperCase() ? value : name;
        }
      } else if (
        task &&
        task.type &&
        (task.type === 'calendar_step' || (task.test && task.test.correction_type === 'certifier')) &&
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
        (task.type === 'calendar_step' || (task.test && task.test.correction_type === 'certifier')) &&
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
        return this.translate.instant('Grand_Oral_Improvement.Student Upload Retake Grand Oral Certification Passport', {
          processName: task?.class_id?.jury_process_name ? task?.class_id?.jury_process_name : 'Grand Oral',
        });
      } else if (task.type === 'student_upload_retake_grand_oral_cv') {
        return this.translate.instant('Grand_Oral_Improvement.Student Upload Retake Grand Oral CV', {
          processName: task?.class_id?.jury_process_name ? task?.class_id?.jury_process_name : 'Grand Oral',
        });
      } else if (task.type === 'activate_student_contract') {
        return this.translate.instant('activate_student_contract', {
          first_name: task.student_id && task.student_id.first_name ? task.student_id.first_name : '',
          last_name: task.student_id && task.student_id.last_name ? task.student_id.last_name : '',
        });
      } else if (task.type === 'jury_assign_corrector') {
        return (
          task.jury_id.name +
          ' : ' +
          this.translate.instant('Grand_Oral_Improvement.Assign Grand Oral Corrector', {
            processName: task?.class_id?.jury_process_name ? task?.class_id?.jury_process_name : 'Grand Oral',
          })
        );
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
      } else if (name) {
        const value = this.translate.instant('TEST.AUTOTASK.' + name.toUpperCase());
        return value !== 'TEST.AUTOTASK.' + name.toUpperCase() ? value : name;
      } else {
        return '';
      }
    }
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
          this.getPendingTasks();
        }
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

  openTask(task: SelectedTask) {
    // ************** Dont let usertype visitor open any task
    if (!this.permissionService.editPendingTaskPerm()) {
      return;
    }

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
      } else if (
        task.description === 'Marks Entry' ||
        task.description === 'Validate Test' ||
        task.type === 'final_retake_marks_entry' ||
        task.type === 'validate_test_correction_for_final_retake' ||
        task.type === 'validate_jury_organization' ||
        task.type === 'certifier_validation'
      ) {
        this.goToMarkEntry(task);
      } else if (task.description === 'Create Groups') {
        this.goToGroupCreation(task);
      } else if (task.description === 'Assign Corrector of Problematic') {
        this.openAssignCorrectorOfProblematicDialog(task);
      } else if (task.description === 'Assign Cross Corrector') {
        this.openNewWindow(['/crossCorrection', 'assign-cross-corrector', task.rncp._id, task.class_id._id, task.test._id]);
      }
    }
    if (task && task.type) {
      if (task.type === 'document_expected' || task.type === 'upload_final_retake_document') {
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
              this.getPendingTasks();
              this.acadservice.refreshAcadKit(true);
            }
          });
      } else if (task.type === 'add_task' || task.type === 'addTask') {
        this.openManualTask(task);
      } else if (task.type === 'validate_problematic_task') {
        if (task.school && task.rncp && task.class_id && task.student_id) {
          this.openValidateProblematicDialog(task);
        }
      } else if (task.type === 'assign_president_jury' && task.jury_id && task.jury_id._id) {
        this.openNewWindow(['/jury-organization', task.jury_id._id, 'organize-juries', 'assign-president-jury']);
      } else if (task.type === 'assign_member_jury' && task.jury_id && task.jury_id._id) {
        this.openNewWindow(['/jury-organization', task.jury_id._id, 'organize-juries', 'assign-member-jury']);
      } else if ((task.type && task.type === 'academic_pro_evaluation') || task.type === 'soft_skill_pro_evaluation') {
        this.openNewWindow(['/correction-eval-pro-step']);
      } else if (task.type === 'student_accept_decision_transcript') {
        this.openNewWindow(['/school', task.school._id], {
          title: task.rncp._id,
          class: task.class_id._id,
          student: task.student_id._id,
          open: 'student-cards',
          selectedTab: 'Certifications',
          selectedSubTab: 'Certification',
        });
      } else if (task.type === 'send_copies_cross_corrector') {
        this.openSendCopiesDialog(task);
      } else if (task.type === 'send_copies_validate') {
        this.openSendCopiesDialog(task);
      } else if (task.type === 'student_upload_grand_oral_presentation' || task.type === 'student_upload_retake_grand_oral_presentation') {
        this.openPresentationDialog(task);
      } else if (
        task.type === 'online_jury_student_attendance_justification' ||
        task.type === 'online_jury_jury_member_attendance_justification'
      ) {
        this.openAbsenceJuryDialog(task);
      } else if (task.type === 'student_upload_grand_oral_cv' || task.type === 'student_upload_retake_grand_oral_cv') {
        this.openCvDialog(task);
      } else if (task.type === 'assign_members_of_final_jury') {
        this.openNewWindow(['/jury-organization', task.jury_id._id, 'organize-juries', 'assign-student-table']);
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
        if (this.utilityService.isUserStudent()) {
          this.redirectToMyFileJobDescription(task);
        } else {
          this.redirectToStudentCardJobDescription(task);
        }
      } else if (task.type === 'validate_job_description') {
        this.redirectToStudentCardJobDescription(task);
      } else if (task.type === 'revision_job_description') {
        if (this.utilityService.isUserStudent()) {
          this.redirectToMyFileJobDescription(task);
        }
      } else if (task.type === 'activate_student_contract') {
        this.redirectToStudentCardCompany(task);
      } else if (task.type === 'jury_assign_corrector') {
        this.AssignCorrectorOffPlatformJuryDialog(task);
      } else if (task.type === 'task_builder') {
        this.openTaskBuilderDialog(task);
      }
    }
  }

  onSendJobDescription(task) {
    this.subs.sink = this.dialog
      .open(SendJobDescriptionDialogComponent, {
        disableClose: true,
        minWidth: '630px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        data: task,
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          // ... do something here
        }
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

  redirectToMyFileJobDescription(task) {
    this.openNewWindow(['/my-file'], {
      identity: 'Job Desc',
      taskTitle: task.rncp._id,
      taskClass: task.class_id._id,
      taskSchool: task.school._id,
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

  goToJuryMarkEntryTable(id) {
    // this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
    //   this.router.navigate(['/jury-organization', id, 'jury-mark-entry']);
    // });

    this.openNewWindow(['/jury-organization', id, 'jury-mark-entry']);
  }

  goToProcessForm(taskData) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.formFillingService.getOneTaskForFormFilling(taskData._id).subscribe(
      (result) => {
        this.isWaitingForResponse = false;
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
        this.isWaitingForResponse = false;
      },
    );
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
      this.getPendingTasks();
    });
  }

  openAssignCorrectorDialog(task) {
    let validate = true; // for now true, need to change later after clear what user can click what
    if (this.utilityService.isUserEntityADMTC()) {
      validate = true;
    } else if (
      task &&
      task.user_selection &&
      task.user_selection.user_id &&
      task.user_selection.user_id._id &&
      this.isUserLoginSame(task.user_selection.user_id._id)
    ) {
      validate = true;
    } else if (task && task.created_by && task.created_by._id && this.isUserLoginSame(task.created_by._id)) {
      validate = true;
    }

    if (validate) {
      const dialogRef = this.dialog.open(AssignCorrectorDialogComponent, {
        width: '600px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          task: task,
          titleId: this.titleId,
        },
      });
      this.subs.sink = dialogRef.afterClosed().subscribe((result) => {
        if (result === 'reset') {
          this.getPendingTasks();
        }
      });
    }
  }

  openAssignCorrectorOfProblematicDialog(task) {
    const dialogRef = this.dialog.open(AssignCorrectorProblematicDialogComponent, {
      width: '600px',
      minHeight: '100px',
      panelClass: 'certification-rule-pop-up',
      disableClose: true,
      data: {
        edit: false,
        task: task,
      },
    });
    this.subs.sink = dialogRef.afterClosed().subscribe((result) => {
      if (result === 'reset') {
        this.getPendingTasks();
      }
    });
  }

  goToMarkEntry(task) {
    let validate = true; // for now true, need to change later after clear what user can click what
    if (this.utilityService.isUserEntityADMTC()) {
      validate = true;
    } else if (
      task &&
      task.user_selection &&
      task.user_selection.user_id &&
      task.user_selection.user_id._id &&
      this.isUserLoginSame(task.user_selection.user_id._id)
    ) {
      validate = true;
    } else if (task && task.created_by && task.created_by._id && this.isUserLoginSame(task.created_by._id)) {
      validate = true;
    }

    if (validate) {
      this.openNewWindow(['/test-correction', this.titleId, task.test._id], { task: task._id, school: task.school._id });
    }
  }

  goToGroupCreation(task) {
    let validate = true; // for now true, need to change later after clear what user can click what
    if (this.utilityService.isUserEntityADMTC()) {
      validate = true;
    } else if (
      task &&
      task.user_selection &&
      task.user_selection.user_id &&
      task.user_selection.user_id._id &&
      this.isUserLoginSame(task.user_selection.user_id._id)
    ) {
      validate = true;
    } else if (task && task.created_by && task.created_by._id && this.isUserLoginSame(task.created_by._id)) {
      validate = true;
    }

    if (validate) {
      this.openNewWindow(['/group-creation', this.titleId, task.test._id, task._id])
    }
  }

  openExpectedDocumentDialog(task) {
    this.dialog
      .open(UploadExpectedDocTaskComponent, {
        width: '700px',
        disableClose: true,
        data: task,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          // refresh acadkit and mytasktable
          this.getPendingTasks();
        }
      });
  }

  openValidateProblematicDialog(task) {
    const dialogRef = this.dialog.open(ValidateProblematicTaskDialogComponent, {
      width: '600px',
      minHeight: '100px',
      panelClass: 'certification-rule-pop-up',
      disableClose: true,
      data: task,
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
          this.getPendingTasks();
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
          this.getPendingTasks();
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
          this.getPendingTasks();
        }
      });
  }

  openTaskBuilderDialog(task) {
    this.subs.sink = this.dialog
      .open(TaskBuilderActionDialogComponent, {
        width: '800px',
        disableClose: true,
        data: {
          taskId: task._id,
          type: 'task',
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          // refresh acadkit and mytasktable
          this.getPendingTasks();
        }
      });
  }

  getToolTipUser(element) {
    if (element && element.user_selection && element.user_selection.user_id) {
      return (
        element.user_selection.user_id.last_name.toUpperCase() +
        ' ' +
        element.user_selection.user_id.first_name +
        ' ' +
        this.translate.instant(element.user_selection.user_id.civility)
      );
    } else if (element && element.user_selection && element.user_selection.user_type_id) {
      return this.translate.instant(element.user_selection.user_type_id.name);
    } else {
      return '';
    }
  }

  isUserLoginSame(userId): boolean {
    return userId === this.utilityService.getCurrentUser()._id;
  }
  calendarListener(data) {
    this.goToCalendar.emit(data);
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  exportData() {
    Swal.close();
    this.allTasksForExport = [];
    this.getAllStudentExportData(0);
  }

  getAllStudentExportData(pageNumber: number) {
    this.isWaitingForResponse = true;
    const pagination = {
      limit: 500,
      page: pageNumber,
    };
    const filter = {
      due_date: this.filteredValues.dueDate ? this.filteredValues.dueDate : '',
      school_name: this.filteredValues.school ? this.filteredValues.school : '',
      class_name: this.selectedClass ? this.selectedClass._id : '',
      from: this.filteredValues.assignedFrom ? this.filteredValues.assignedFrom : '',
      to: this.filteredValues.assignedTo ? this.filteredValues.assignedTo : '',
      task_type: this.filteredValues.task_type ? this.filteredValues.task_type : '',
      subject: this.filteredValues.test ? this.filteredValues.test : '',
      priority: this.filteredValues.priority ? this.filteredValues.priority : null,
    };
    const payloadFilter = this.cleanFilterPayload(filter);
    // check if entity is academic and its not chief group academic then will pass schoolId
    const user = this.utilityService.getCurrentUser();
    if (
      user &&
      user.entities &&
      user.entities[0] &&
      user.entities[0].school_type === 'preparation_center' &&
      user.entities[0].school &&
      user.entities[0].school._id
    ) {
      this.schoolId = user.entities[0].school._id;
    }
    if (this.schoolId) {
      this.subs.sink = this.rncpTitlesService
        .getAllPendingTasksBySchool(this.titleId, pagination, this.sorting, payloadFilter, this.schoolId, this.LoggedInUserTypeId)
        .subscribe((result: any[]) => {
          if (result && result.length) {
            this.allTasksForExport.push(...result);
            const page = pageNumber + 1;
            this.getAllStudentExportData(page);
          } else {
            this.isWaitingForResponse = false;
            this.exportAllData(this.allTasksForExport);
          }
        });
    } else {
      this.subs.sink = this.rncpTitlesService
        .getAllPendingTasks(this.titleId, pagination, this.sorting, payloadFilter, this.LoggedInUserTypeId)
        .subscribe((result: any[]) => {
          if (result && result.length) {
            this.allTasksForExport.push(...result);
            const page = pageNumber + 1;
            this.getAllStudentExportData(page);
          } else {
            this.isWaitingForResponse = false;
            this.exportAllData(this.allTasksForExport);
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
        const dueDate = item.due_date ? this.translateDate(item.due_date) : '';
        // TODO: From the template get the data location and add the data
        obj[0] = dueDate ? dueDate : '';
        obj[1] = item.school ? item.school.short_name : '';
        obj[2] = item.class_id ? item.class_id.name : '';
        obj[3] = item.created_by
          ? `${item.created_by.last_name.toUpperCase()} ${item.created_by.first_name} ${this.translate.instant(item.created_by.civility)}`
          : '';
        obj[4] = this.getAssignedUser(item);
        obj[5] = this.getTranslateWhat(item.description, item);
        obj[6] = this.getSubjectAndEvaluationName(item);
        obj[7] = item.priority;
        obj[8] = this.translateDate(item.created_date);
        data.push(obj);
      });
      const valueRange = { values: data };
      const today = moment().format('DD-MM-YYYY');
      const title = this.exportName + '_' + today;
      const sheetID = this.translate.currentLang === 'en' ? 0 : 136141499;
      const sheetData = {
        spreadsheetId: '1mrclO5V-2t0EPI23E4J0kyTNkVMqRzXRkclq7fvaMc4',
        sheetId: sheetID,
        range: 'A7',
      };
      this.exportCsvService.createAndUpdateSpreadsheet(valueRange, title, sheetData);
    }
  }

  getAssignedUser(task): string {
    let assignedUser = '';
    if (task.user_selection && task.user_selection.user_id) {
      assignedUser = assignedUser + task.user_selection.user_id.last_name.toUpperCase();
      assignedUser = assignedUser + ' ' + task.user_selection.user_id.first_name;
      assignedUser = assignedUser + ' ' + this.translate.instant(task.user_selection.user_id.civility);
    } else if (task.user_selection && task.user_selection.user_type_id && task.user_selection.user_type_id.name) {
      assignedUser = this.translate.instant(`USER_TYPES.${task.user_selection.user_type_id.name}`);
    }
    return assignedUser;
  }

  getSubjectAndEvaluationName(task): string {
    let subjectAndEvaluationName = '';
    if (task.test && task.test.subject_id && task.test.subject_id.subject_name) {
      subjectAndEvaluationName = subjectAndEvaluationName + task.test.subject_id.subject_name;
    }
    if (subjectAndEvaluationName && task.test && task.test.evaluation_id && task.test.evaluation_id.evaluation) {
      subjectAndEvaluationName = subjectAndEvaluationName + '/' + task.test.evaluation_id.evaluation;
    }
    return subjectAndEvaluationName;
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
          this.getPendingTasks();
        }
      });
  }

  openNewWindow(path: string[], params?: any) {
    const url = this.router.createUrlTree(path, { queryParams: params || {} });
    window.open(url.toString(), '_blank');
  }
}
