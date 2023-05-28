import { SelectionModel } from '@angular/cdk/collections';
import { cloneDeep } from 'lodash';
import { RNCPTitlesService } from './../../../../service/rncpTitles/rncp-titles.service';
import { SubSink } from 'subsink';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { Sort, MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Component, OnInit, Input, OnDestroy, ViewChild, AfterViewInit, EventEmitter, Output } from '@angular/core';
import { ChangeDueDateTaskDialogComponent } from 'app/shared/components/change-due-date-task-dialog/change-due-date-task-dialog.component';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { TaskService } from 'app/service/task/task.service';
import * as moment from 'moment';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import { ClassTaskStatus } from '../title-manager-tasks.component';
import { SchoolService } from 'app/service/schools/school.service';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { TaskBuilderActionDialogComponent } from 'app/shared/components/task-builder-action-dialog/task-builder-action-dialog.component';
import { KeyValue } from '@angular/common';
import * as _ from 'lodash';
import { Observable, of } from 'rxjs';
import { UtilityService } from 'app/service/utility/utility.service';

@Component({
  selector: 'ms-title-preview-generated-tasks',
  templateUrl: './title-preview-generated-tasks.component.html',
  styleUrls: ['./title-preview-generated-tasks.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class TitlePreviewGeneratedTasksComponent implements OnInit, AfterViewInit, OnDestroy {
  private subs = new SubSink();
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @Input() classId;
  @Input() rncpId: string;
  @Input() classTaskStatus: ClassTaskStatus;
  @Output() onAllTaskPublished: EventEmitter<boolean> = new EventEmitter(false);
  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['select', 'ref_id', 'school', 'dueDate', 'task', 'assigner', 'assignTo', 'status', 'action'];
  filterColumns: string[] = [
    'selectFilter',
    'taskRefFilter',
    'schoolFilter',
    'dueDateFilter',
    'taskFilter',
    'assignerFilter',
    'assignToFilter',
    'statusFilter',
    'actionFilter',
  ];
  taskRefFilter = new UntypedFormControl('');
  schoolFilter = new UntypedFormControl(null);
  dueDateFilter = new UntypedFormControl('');
  taskFilter = new UntypedFormControl('');
  assignerFilter = new UntypedFormControl('');
  assignToFilter = new UntypedFormControl('');
  statusFilter = new UntypedFormControl('');
  isWaitingForResponse = false;

  dialogConfig: MatDialogConfig = {
    disableClose: true,
    width: '800px',
  };
  statusDropdown = [
    { value: 'todo', name: 'ToDo' },
    { value: 'done', name: 'Done' },
    { value: 'deleted', name: 'Deleted' },
    { value: 'pending', name: 'Pending' },
    { value: 'validated', name: 'validated' },
    { value: 'validation_in_process', name: 'Validation in process' },
    { value: 'reject', name: 'Reject' },
  ];
  filteredStatusDropdown = [...this.statusDropdown];
  filteredValue = {
    school_id: null,
    due_date: null,
    offset: null,
    task: null,
    created_by: null,
    user_id: null,
    status: null,
    ref_id: null,
  };
  sortValue = null;
  userDropdown: any[] = [];
  initialSchoolDropdown = [];
  filteredSchoolDropdown: Observable<any[]>;
  dataCount = 0;
  previewTaskBuilder = [];
  selection = new SelectionModel<any>(true, []);
  dataLoaded: boolean;
  isReset: any;
  firstTimeLoaded: boolean = true;
  isAllChecked: boolean = false;
  minDate = new Date();

  filterNoSchool = false;

  constructor(
    private rncpTitleService: RNCPTitlesService,
    private dialog: MatDialog,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private taskService: TaskService,
    private schoolService: SchoolService,
    private parseUtcToLocal: ParseUtcToLocalPipe,
    private utilityService: UtilityService,
  ) {}

  ngOnInit() {
    this.getAllTasks();
    this.getSchoolDropdownList();
    this.sinkFilter();
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {

          if (!this.firstTimeLoaded) {
            this.getAllTasks();
          }
        }),
      )
      .subscribe();
  }

  onMasterToggle($event) {
    if (this.isAllChecked) {
      this.selection.clear();
      this.isAllChecked = false;
    } else if (!this.isAllChecked) {
      this.dataSource.data.forEach((row) => row && row._id && this.selection.select(row._id));
      this.isAllChecked = $event.checked;
    }
  }

  onIndividualToggle($event, row) {
    if (row && row._id) this.selection.toggle(row._id);
    // const isAllSelected = this.selection.selected.length === this.dataSource.data.length;
    // if ($event.checked === false) this.isAllChecked = false;
    // if ($event.checked && isAllSelected) this.isAllChecked = true;
  }

  onSchoolFilterType() {
    // if (this.schoolFilter.value) {
    //   const filterString = this.schoolFilter.value;
    //   this.filteredSchoolDropdown = this.initialSchoolDropdown.filter((school) => {
    //     return school && school.short_name && school.short_name.toLowerCase().trim().includes(filterString);
    //   });
    // } else {
    //   this.filteredSchoolDropdown = [...this.initialSchoolDropdown];
    // }
  }

  onStatusFilterType() {
    if (this.statusFilter.value) {
      const filterString = this.statusFilter.value;
      this.filteredStatusDropdown = this.statusDropdown.filter((status) => {
        const name = this.translate.instant(status.name);
        return name.toLowerCase().trim().includes(filterString);
      });
    } else {
      this.filteredStatusDropdown = [...this.statusDropdown];
    }
  }

  onSchoolSelect(school) {
    if(school === 'noschool') {
      this.filterNoSchool = true;
    } else {
      this.filterNoSchool = false;
    }
    
    this.filteredValue.school_id = school ? school._id : null;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getAllTasks();
    }
  }

  onStatusSelect(status) {
    if (!status) return;
    this.filteredValue.status = status === 'All' ? null : status.value;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getAllTasks();
    }
  }

  sinkFilter() {
    // this.subs.sink = this.schoolFilter.valueChanges.pipe(debounceTime(500)).subscribe((schoolName: string) => {
    //   const school = this.initialSchoolDropdown.find((school) => {
    //     if (!school || !school.short_name) return false;
    //     return school.short_name.toLowerCase().trim() === schoolName.toLowerCase().trim();
    //   });
    //   this.filteredValue.school_id = school && school._id ? school._id : null;
    //   this.paginator.pageIndex = 0;
    //   if (!this.isReset) {
    //     this.getAllTasks();
    //   }
    // });
    this.subs.sink = this.taskRefFilter.valueChanges.pipe(debounceTime(500)).subscribe((taskRef) => {
      this.filteredValue.ref_id = taskRef ? taskRef : null;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllTasks();
      }
    });

    this.subs.sink = this.taskFilter.valueChanges.pipe(debounceTime(500)).subscribe((taskName: string) => {
      this.filteredValue.task = taskName || null;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllTasks();
      }
    });

    this.subs.sink = this.dueDateFilter.valueChanges.subscribe((due_date: Date) => {
      if (!due_date) return;
      this.filteredValue.due_date = moment(due_date).format('DD/MM/YYYY');
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllTasks();
      }
    });

    this.subs.sink = this.assignerFilter.valueChanges.pipe(debounceTime(500)).subscribe((assignerName: string) => {
      const task = this.dataSource.data.find((task) => {
        if (!task || !task.created_by) return false;
        if (task && task.created_by && task.created_by.first_name && task.created_by.last_name) {
          const fullName = task.created_by.first_name + task.created_by.last_name;
          return fullName.toLowerCase().trim().includes(assignerName.toLowerCase().trim());
        }
      });
      this.filteredValue.created_by = assignerName && task && task.created_by && task.created_by._id ? task.created_by._id : null;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllTasks();
      }
    });

    this.subs.sink = this.assignToFilter.valueChanges.pipe(debounceTime(500)).subscribe((assignerName: string) => {
      const task = this.dataSource.data.find((task) => {
        if (!task || !task.user_selection || !task.user_selection.user_id) return false;
        if (
          task &&
          task.user_selection &&
          task.user_selection.user_id &&
          task.user_selection.user_id.first_name &&
          task.user_selection.user_id.last_name
        ) {
          const fullName = task.user_selection.user_id.first_name + task.user_selection.user_id.last_name;
          return fullName.toLowerCase().trim().includes(assignerName.toLowerCase().trim());
        }
      });
      this.filteredValue.user_id =
        assignerName && task && task.user_selection && task.user_selection.user_id && task.user_selection.user_id._id
          ? task.user_selection.user_id._id
          : null;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllTasks();
      }
    });

    this.subs.sink = this.schoolFilter.valueChanges.subscribe((school) => {
      if (typeof school === 'string') {
        const result = this.initialSchoolDropdown.filter((schoolData) =>
          this.utilityService.simplifyRegex(schoolData.short_name).includes(this.utilityService.simplifyRegex(school)),
        );

        this.filteredSchoolDropdown = of(result);
      }
    });

    // this.subs.sink = this.statusFilter.valueChanges.pipe(debounceTime(500)).subscribe((value) => {
    //   const status = this.statusDropdown.find((status) => {
    //     const name = this.translate.instant(status.name);
    //     return name.toLowerCase().trim().includes(value.toLowerCase().trim());
    //   });

    //   this.filteredValue.status = status && status.value ? status.value : null;
    //   this.paginator.pageIndex = 0;
    //   if (!this.isReset) {
    //     this.getAllTasks();
    //   }
    // });
  }

  reset() {
    this.selection.clear();
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.filteredValue = {
      school_id: null,
      due_date: null,
      offset: null,
      task: null,
      created_by: null,
      user_id: null,
      status: null,
      ref_id: null,
    };
    this.taskRefFilter.setValue('', { emitEvent: false });
    this.schoolFilter.setValue('', { emitEvent: false });
    this.dueDateFilter.setValue('', { emitEvent: false });
    this.taskFilter.setValue('', { emitEvent: false });
    this.assignerFilter.setValue('', { emitEvent: false });
    this.assignToFilter.setValue('', { emitEvent: false });
    this.statusFilter.setValue('', { emitEvent: false });

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    this.isAllChecked = false;
    this.filterNoSchool = false;
    this.getAllTasks();
  }

  getSchoolDropdownList() {
    const schoolType = 'preparation_center';
    const titleId = this.rncpId;
    const classId = this.classId;

    if (titleId && classId) {
      this.subs.sink = this.schoolService.getAllSchoolAsDropdownList(schoolType, titleId, classId).subscribe((response) => {
        response.sort((a, b) => {
          if (a.short_name < b.short_name) return -1;
          if (a.short_name > b.short_name) return 1;
          return 0;
        });
        // this.initialSchoolDropdown = [...response];
        // this.filteredSchoolDropdown = [...this.initialSchoolDropdown];
        if (response) {
          this.initialSchoolDropdown = _.cloneDeep(response);
          this.filteredSchoolDropdown = of(this.initialSchoolDropdown);

        }
      });
    }
  }

  OriginalOrder = (a: KeyValue<number, string>, b: KeyValue<number, string>): number => {
    return 0;
  };

  getAllTasks() {
    this.isWaitingForResponse = true;
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.filteredValue['offset'] = moment().utcOffset();

    this.subs.sink = this.taskService
      .getGeneratedTaskBuilderPreview(this.rncpId, this.classId, pagination, this.filteredValue, this.sortValue)
      .subscribe(
        (resp) => {
          this.firstTimeLoaded = false;
          this.dataLoaded = true;
          if (resp) {
            // for (let i = 0; i < resp.length; i++) {
            //   if (resp[i].due_date && resp[i].due_date.date && resp[i].due_date.time) {
            //     const utcDate = moment.utc(resp[i].due_date.date + resp[i].due_date.time, 'DD/MM/YYYYhh:mm').toDate();
            //     const localMoment = moment(utcDate).local();
            //     resp[i].due_date.date = localMoment.format('DD/MM/YYYY');
            //     resp[i].due_date.time = localMoment.format('hh:mm');
            //   }
            // }
            let taskData;
            if(this.filterNoSchool){
              taskData = cloneDeep(resp).filter((noschool => {
                return noschool.school === null;
              }));
              this.paginator.length = taskData && taskData.length && taskData.length ? taskData.length : 0;
              this.dataCount = taskData && taskData.length && taskData.length ? taskData.length : 0;
            } else {
              taskData = cloneDeep(resp);

              this.paginator.length = resp && resp.length && resp[0].count_document ? resp[0].count_document : 0;
              this.dataCount = resp && resp.length && resp[0].count_document ? resp[0].count_document : 0;
            }
            this.dataSource.data =  cloneDeep(taskData);

          } else {
            this.dataSource.data = [];
            this.paginator.length = 0;
          }
          this.isReset = false;
          this.isWaitingForResponse = false;
        },
        (err) => {
          this.isWaitingForResponse = false;

        },
      );
  }

  localizeDate(due_date: { date: string; time: string }) {
    if (!due_date || !due_date.date || !due_date.time) return '';
    return this.parseUtcToLocal.transformDate(due_date.date, due_date.time);
  }

  sortData(sort: Sort) {
    this.sortValue = sort.direction ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;

    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllTasks();
      }
    }
  }

  openChangeDueDateDialog() {
    const firstTask = this.dataSource.data.find((task) => task._id === this.selection.selected[0]);
    this.dialog
      .open(ChangeDueDateTaskDialogComponent, {
        ...this.dialogConfig,
        data: {
          _ids: [...this.selection.selected],
          due_date: firstTask && firstTask.due_date ? firstTask.due_date : null,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.getAllTasks();
        }
      });
  }

  onChangeIndividualDueDate(task) {
    if (task) {
      this.dialog
        .open(ChangeDueDateTaskDialogComponent, {
          ...this.dialogConfig,
          data: {
            _ids: [task._id],
            due_date: task.due_date,
          },
        })
        .afterClosed()
        .subscribe((resp) => {
          if (resp) {
            this.getAllTasks();
          }
        });
    }
  }

  getAllSelectionData() {
    this.isWaitingForResponse = true;
    this.filteredValue['offset'] = moment().utcOffset();
    this.subs.sink = this.taskService
      .getGeneratedTaskBuilderIdPreview(this.rncpId, this.classId, this.filteredValue, this.sortValue)
      .subscribe(
        (response) => {
          if (response && response.length) {
            response.forEach((task) => task && task._id && this.selection.select(task._id));

            this.publishMultipleTasks();
          }
          this.isWaitingForResponse = false;
        },
        (error) => {
          console.error(error);
          this.isWaitingForResponse = false;
        },
      );
  }

  async onPublishAll() {
    const confirmation = await this.fireCountdownSwal('PUBLISHTASK_S2', {});
    if (confirmation.value) {
      if (this.isAllChecked) {
        this.getAllSelectionData();
      } else {
        this.publishMultipleTasks();
      }
    }
  }

  publishMultipleTasks() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.taskService.publishGeneratedTaskBuilder(this.rncpId, this.classId, this.selection.selected).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo'),
            confirmButtonText: this.translate.instant('OK'),
            allowOutsideClick: false,
            allowEscapeKey: false,
          }).then((res) => {
            if (res.value) {
              this.isAllChecked = false;
              this.selection.clear();
              this.onAllTaskPublished.emit(true);
              this.getAllTasks();
            }
          });
        }
      },
      (error) => {
        this.isWaitingForResponse = false;
        this.fireSwalError(error);
      },
    );
  }

  getStatusColor(element) {
    if (!element) return;
    const currentStatus: string = this.getStatus(element);
    const statuses: any[] = [
      { value: 'todo', color: 'yellow' },
      { value: 'done', color: 'green' },
      { value: 'pending', color: 'black' },
      { value: 'validated', color: 'green' },
      { value: 'validation_in_process', color: 'orange' },
      { value: 'reject', color: 'red' },
      { value: 'deleted', color: 'white' },
    ];
    return statuses.find((status) => status.value === currentStatus) ? statuses.find((status) => status.value === currentStatus).color : '';
  }

  getStatus(element): string {
    if (!element) return;
    let status = '';
    if (element.status === 'deleted') {
      status = 'deleted';
    } else {
      switch (element.task_status) {
        case 'pending':
          status = 'pending';
          break;
        case 'todo':
          status =
            element.validation_status && element.validation_status === 'pending'
              ? 'todo'
              : element.validation_status === 'rejected'
              ? 'reject'
              : element.validation_status === 'validation_in_process'
              ? 'validation_in_process'
              : '';
          break;
        case 'done':
          status = element.is_rejection_active ? 'validated' : 'done';
          break;
      }
    }

    return status;
  }

  async onDeleteTask(task) {
    if (!task) return;
    const textInput = {
      taskTitle: task.description,
      assignedPerson: `${this.translate.instant(task.user_selection.user_id.civility)} ${task.user_selection.user_id.first_name} ${
        task.user_selection.user_id.last_name
      }`,
    };
    const confirmation = await this.fireCountdownSwal('DELETE_TASK_S2', textInput);
    if (confirmation.value) this.deleteTask(task._id);
  }

  deleteTask(taskId: string) {
    this.subs.sink = this.taskService.deleteManualTask(taskId).subscribe(async (resp) => {
      if (resp) {
        await this.fireSwalBravo();
        this.getAllTasks();
      }
    },
    (error) => {
      this.isWaitingForResponse = false;
      if (error['message'] === 'GraphQL error: This task have next task') {
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('DELETE_TASK_S3.TITLE'),
          html: this.translate.instant('DELETE_TASK_S3.TEXT'),
          footer: `<span style="margin-left: auto">DELETE_TASK_S3</span>`,
          confirmButtonText: this.translate.instant('DELETE_TASK_S3.BUTTON_1'),
        })
      }

    },
    );
  }

  async publishGeneratedTask(task) {
    if (!task) return;
    const textInput = {
      taskName: task.description ? task.description : '',
      assignedPerson: `${this.translate.instant(task.user_selection.user_id.civility)} ${task.user_selection.user_id.first_name} ${
        task.user_selection.user_id.last_name
      }`,
    };
    const confirmation = await this.fireCountdownSwal('PUBLISHTASK_S3', textInput);
    if (confirmation.value) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.taskService.publishGeneratedTaskBuilder(this.rncpId, this.classId, [task._id]).subscribe(
        async (resp) => {
          if (resp) {
            await this.fireSwalBravo();
            this.getAllTasks();
          }
        },
        (error) => {
          this.isWaitingForResponse = false;
          this.fireSwalError(error);
        },
      );
    }
  }

  async unpublishGeneratedTask(task) {
    if (!task) return;
    const textInput = {
      taskName: task.description ? task.description : '',
      assignedPerson: `${this.translate.instant(task.user_selection.user_id.civility)} ${task.user_selection.user_id.first_name} ${
        task.user_selection.user_id.last_name
      }`,
    };
    const confirmation = await this.fireCountdownSwal('UNPUBLISHTASK_S1', textInput);
    if (confirmation.value) {
      this.subs.sink = this.taskService.unpublishGeneratedTaskBuilder(task._id).subscribe(
        async (resp) => {
          if (resp) {
            await this.fireSwalBravo();
            this.getAllTasks();
          }
        },
        (error) => {
          if (error && error.message) {
            const errorObject = JSON.parse(error.message.split(' ').slice(2).join(' '));
            if (errorObject.message && errorObject.message === 'Can not unpublished acad task that have next task') {
              Swal.fire({
                type: 'warning',
                title: this.translate.instant('UNPUBLISHTASK_S2.TITLE'),
                html: this.translate.instant('UNPUBLISHTASK_S2.TEXT'),
                footer: `<span style="margin-left: auto">UNPUBLISHTASK_S2</span>`,
                confirmButtonText: this.translate.instant('UNPUBLISHTASK_S2.BUTTON_1'),
                showCancelButton: true,
                cancelButtonText: this.translate.instant('UNPUBLISHTASK_S2.BUTTON_2'),
              });
            }
          }
        },
      );
    }
  }

  fireSwalError(error) {
    if (error.message && error.message.startsWith('GraphQL error: Cannot publish task as previous task not published:')) {
      const pattern = /\{([^{}]*)\}/g;
      const touples = error.message.match(pattern);
      let taskListHTML = '';
      touples.forEach((touple) => {
        touple = touple.replace('{', '').replace('}', '').split(', ');
        const [taskTitle, civility, firstName, lastName] = touple;
        taskListHTML += `<p>${taskTitle} - ${civility} ${firstName} ${lastName.toUpperCase()}</p>`;
      });
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('PUBLISH_S4.TITLE'),
        html: this.translate.instant('PUBLISH_S4.HTML', { taskListHTML }),
        footer: `<span style="margin-left: auto">PUBLISH_S4</span>`,
        confirmButtonText: this.translate.instant('PUBLISH_S4.BUTTON_1'),
      });
    } else {
      Swal.fire({
        type: 'error',
        title: 'Error',
        text: error && error['message'] ? error['message'] : error,
        confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
      });
    }
  }

  async fireSwalBravo() {
    return await Swal.fire({
      type: 'success',
      title: this.translate.instant('Bravo'),
      confirmButtonText: this.translate.instant('OK'),
      allowOutsideClick: false,
      allowEscapeKey: false,
    });
  }

  async fireCountdownSwal(localizationRef: string, textInput: any) {
    let timeout = 2;
    let confirmInterval;
    return await Swal.fire({
      type: 'warning',
      title: this.translate.instant(`${localizationRef}.TITLE`),
      html: this.translate.instant(`${localizationRef}.TEXT`, textInput),
      footer: `<span style="margin-left: auto">${localizationRef}</span>`,
      confirmButtonText: this.translate.instant(`${localizationRef}.BUTTON_1`) + ` (${timeout})`,
      cancelButtonText: this.translate.instant(`${localizationRef}.BUTTON_2`),
      showCancelButton: true,
      onOpen: () => {
        timeout--;
        Swal.disableConfirmButton();
        const confirmButtonRef = Swal.getConfirmButton();
        confirmInterval = setInterval(() => {
          if (timeout > 0) {
            (confirmButtonRef.innerText = this.translate.instant(`${localizationRef}.BUTTON_1`) + ` (${timeout})`), timeout--;
          } else {
            Swal.enableConfirmButton();
            confirmButtonRef.innerText = this.translate.instant(`${localizationRef}.BUTTON_1`);
            clearInterval(confirmInterval);
          }
        }, 1000);
      },
    });
  }

  openTask(task) {
    this.subs.sink = this.dialog
      .open(TaskBuilderActionDialogComponent, {
        width: '800px',
        disableClose: true,
        data: {
          taskId: task._id,
          type: 'done',
        },
      })
      .afterClosed()
      .subscribe((resp) => {});
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
