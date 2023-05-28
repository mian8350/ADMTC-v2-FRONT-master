import { ChangeDueDateManagerTitleComponent } from './../../../../shared/components/change-due-date-manager-title-dialog/change-due-date-manager-title/change-due-date-manager-title.component';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { isNumber } from 'util';
import { ActivatedRoute } from '@angular/router';
import { debounceTime, tap, startWith } from 'rxjs/operators';
import { UntypedFormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { cloneDeep } from 'lodash';
import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import { RNCPTitlesService } from './../../../../service/rncpTitles/rncp-titles.service';
import * as moment from 'moment';
import { TaskBuilderActionDialogComponent } from 'app/shared/components/task-builder-action-dialog/task-builder-action-dialog.component';
import { PermissionService } from 'app/service/permission/permission.service';
export interface PeriodicElement {
  School: string;
  dueDate: string;
  user: string;
  task: string;
  test: string;
}
@Component({
  selector: 'ms-manager-tasks-table',
  templateUrl: './manager-tasks-table.component.html',
  styleUrls: ['./manager-tasks-table.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseLocalToUtcPipe],
})
export class ManagerTasksTableComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  displayedColumns: string[] = ['Scope', 'dueDate', 'user', 'task', 'action'];
  filterColumns: string[] = ['ScopeFilter', 'dueDateFilter', 'userFilter', 'taskFilter', 'actionFilter'];
  dataSource = new MatTableDataSource([]);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @Input() classId;
  @Input() rncp;
  @Input() class;

  noData: any;
  isWaitingForResponse = false;
  filteredValues = {
    scope: null,
    due_date: null,
    user_assigned: null,
    description: null,
  };
  dueDateFilter = new UntypedFormControl('');
  taskFilter = new UntypedFormControl('');
  scopeFilter = new UntypedFormControl('');
  userFilter = new UntypedFormControl('');
  sortValue = null;
  isReset = false;
  managerTasks = [];
  rncpId = null;
  scopeDropdown = [
    { value: 'school', name: 'School' },
    { value: 'class', name: 'Class' },
  ];
  isFirstReload = true;
  rncpTitles = null;
  private subs = new SubSink();

  constructor(
    private rncpTitleService: RNCPTitlesService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private parseLocalToUTC: ParseLocalToUtcPipe,
    private dialog: MatDialog,
    private permissionService: PermissionService,
  ) {}

  ngOnInit() {
    const params = this.route.snapshot.params;
    this.rncpId = params && params.titleId ? params.titleId : null

    this.initFilter()
    if (this.classId && this.rncpId) {
      this.getManagerTasks();
    }
    this.getTitleName();
  }
  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (!this.isReset && this.classId && this.rncpId) {
            this.getManagerTasks();
          }
        }),
      )
      .subscribe();
  }
  ngOnChanges() {
    this.initFilter();
    if (this.classId && this.rncpId) {
      this.getManagerTasks();
    }
  }
  getManagerTasks() {
    this.isWaitingForResponse = true;
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.filteredValues['rncp_title_id'] = this.rncpId;
    this.filteredValues['class_id'] = this.classId;
    this.subs.sink = this.rncpTitleService.getAllManagerTasks(this.filteredValues, this.sortValue, pagination).subscribe(
      (resp) => {
        if (resp) {
          this.dataSource.data = cloneDeep(resp);
          if (this.isFirstReload) {
            this.managerTasks = cloneDeep(resp);
            this.isFirstReload = false;
          }
          this.paginator.length = resp.length && resp[0].count_document ? resp[0].count_document : 0;
        } else {
          this.dataSource.data = [];
          this.paginator.length = 0;
          this.managerTasks = [];
        }
        this.isReset = false;
        this.isWaitingForResponse = false;
      },
      (err) => {
        this.isWaitingForResponse = false;
      },
    );
  }
  sortTable(sort: Sort) {
    this.sortValue = sort.direction ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getManagerTasks();
    }
  }
  initFilter() {
    this.subs.sink = this.userFilter.valueChanges.pipe(debounceTime(500)).subscribe((value) => {
      this.filteredValues.user_assigned = value;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getManagerTasks();
      }
    });
    this.subs.sink = this.taskFilter.valueChanges.pipe(debounceTime(500)).subscribe((value) => {
      this.filteredValues.description = value;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getManagerTasks();
      }
    });
    this.subs.sink = this.scopeFilter.valueChanges.pipe(debounceTime(500)).subscribe((value) => {
      this.filteredValues.scope = value;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getManagerTasks();
      }
    });
    this.subs.sink = this.dueDateFilter.valueChanges.subscribe((value) => {
      let date;
      if (value) {
        date = this.parseLocalToUTC.transformDate(moment(value).format('DD/MM/YYYY'), '15:59');
      }
      this.filteredValues.due_date = value && date && date !== 'Invalid date' ? date : null;
      this.filteredValues['offset'] = moment().utcOffset();
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getManagerTasks();
      }
    });
  }
  transformDate(date) {
    moment.locale(this.translate.currentLang);
    if (date && date.date && date.date !== 'Invalid date' && date.time) {
      const localDate = this.parseUTCtoLocal.transformDate(date.date, date.time);
      if (localDate !== 'Invalid date') {
        return moment(localDate, 'DD/MM/YYYY').format('DD/MM/YYYY');
      } else {
        return '';
      }
    } else {
      return '';
    }
  }
  onManagerTask() {
    this.filteredValues['is_only_select_manager_task'] = true;
    this.getManagerTasks();
  }
  reset() {
    this.filteredValues = {
      scope: null,
      due_date: null,
      user_assigned: null,
      description: null,
    };
    this.dueDateFilter.setValue('', { emitEvent: false });
    this.taskFilter.setValue('', { emitEvent: false });
    this.scopeFilter.setValue('', { emitEvent: false });
    this.userFilter.setValue('', { emitEvent: false });
    this.paginator.pageIndex = 0;
    this.sortValue = null;
    this.sort.direction = '';
    this.sort.active = '';
    this.sort.sortChange.emit({active: '', direction: ''});

    this.isReset = true
    this.getManagerTasks()
  }
  getTitleName() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.getTitleName(this.rncpId).subscribe((result) => {
      if (result) {
        this.rncpTitles = result;
      }
      this.isWaitingForResponse = false;
    });
  }
  getTranslateWhat(name, task?: any) {
    if (task) {
      if (task.type.toLowerCase() === 'employability_survey_for_student') {
        // const dueDate = new Date(task.dueDate);
        // const dateString = dueDate.getDate() + '/' + (dueDate.getMonth() + 1) + '/' + dueDate.getFullYear();
        const dateString = this.translateDate(task.due_date);
        if (this.translate.currentLang.toLowerCase() === 'en') {
          return 'Employability Survey to complete before ' + dateString;
        } else {
          return "Enquête d'employabilité à completer avant le " + dateString;
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
        const value = this.translate.instant(task.description);
        return value;
      } else if (
        task.type === 'online_jury_student_attendance_justification' ||
        task.type === 'online_jury_jury_member_attendance_justification'
      ) {
        const value = this.translate.instant(task.description);
        return value;
      } else if (task.type === 'jury_organization_marks_entry') {
        if (task.jury_id && task.jury_id.jury_activity) {
          return `${task.jury_id.name} - ${this.translate.instant('Mark Entry for Grand Oral')}`;
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
        (name === 'Assign Corrector' || name === 'Marks Entry' || name === 'Validate Test')
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
        return this.translate.instant('student_upload_retake_grand_oral_presentation');
      } else if (task.type === 'student_upload_retake_grand_oral_cv') {
        return this.translate.instant('student_upload_retake_grand_oral_cv');
      } else if (task.type === 'activate_student_contract') {
        return this.translate.instant('activate_student_contract', {
          first_name: task.student_id && task.student_id.first_name ? task.student_id.first_name : '',
          last_name: task.student_id && task.student_id.last_name ? task.student_id.last_name : '',
        });
      } else if (task.type === 'jury_assign_corrector') {
        return task.jury_id.name + ' : ' + this.translate.instant('jury_assign_corrector');
      } else if (name) {
        const value = this.translate.instant('TEST.AUTOTASK.' + name.toUpperCase());
        return value !== 'TEST.AUTOTASK.' + name.toUpperCase() ? value : name;
      } else {
        return '';
      }
    }
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
  openDueDate(id) {
    this.dialog
      .open(ChangeDueDateManagerTitleComponent, {
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        width: '700px',
        data: {
          taskId: id,
          titleId: this.rncpId,
          classId: this.classId,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        this.getManagerTasks();
      });
  }

  openTask(task) {
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
          this.getManagerTasks();
        }
      });
  }

  showManagerTaskButton() {
    return (
      this.permissionService.editManagerTaskPendingTaskPerm() && this.permissionService.actionManagerTaskPendingTaskManagerTaskButtonPerm()
    );
  }

  showResetButton() {
    return this.permissionService.actionManagerTaskPendingTaskResetButtonPerm();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
