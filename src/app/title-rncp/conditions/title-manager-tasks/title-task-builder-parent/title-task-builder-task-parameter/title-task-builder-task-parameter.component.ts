import { Component, EventEmitter, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { TaskService } from 'app/service/task/task.service';
import { UserService } from 'app/service/user/user.service';
import { TaskBuilderActionDialogComponent } from 'app/shared/components/task-builder-action-dialog/task-builder-action-dialog.component';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { cloneDeep, find, uniqBy } from 'lodash';
import * as moment from 'moment';
import { map } from 'rxjs/operators';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';

const DATE_FORMAT = 'DD/MM/YYYY';
const TIME_FORMAT = 'hh:mm';

interface TaskBuilderDropdown {
  _id: string;
  ref_id: string;
  task_title: string;
}
@Component({
  selector: 'ms-title-task-builder-task-parameter',
  templateUrl: './title-task-builder-task-parameter.component.html',
  styleUrls: ['./title-task-builder-task-parameter.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseLocalToUtcPipe],
})
export class TitleTaskBuilderTaskParameterComponent implements OnInit, OnDestroy {
  @Output() onLeaveEmitter = new EventEmitter<boolean>(null);
  type: string | undefined;
  taskId: string | undefined;
  taskBuilderPreviewValue: any;
  taskBuilderForm: UntypedFormGroup;
  taskBuilders: TaskBuilderDropdown[];
  currentTaskDetail;
  currentSelectedNextTaskTitle: UntypedFormControl = new UntypedFormControl(null);
  currentSelectedNextTaskRef: UntypedFormControl = new UntypedFormControl(null);
  schools;
  isWaitingForResponse = false;
  private subs = new SubSink();
  titleId;
  filterValue = {
    class_id: null,
  };
  originalTaskBuilders: any;
  initialForm: any;
  today = new Date();
  isTaskAlreadyGenerated: boolean = false;
  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private fb: UntypedFormBuilder,
    private rncpTitleService: RNCPTitlesService,
    private translate: TranslateService,
    private taskService: TaskService,
    public dialog: MatDialog,
    private userService: UserService,
    private parseUtcToLocal: ParseUtcToLocalPipe,
    private parseLocalToUtc: ParseLocalToUtcPipe,
  ) {}

  taskScopes: any[] = [
    {
      value: 'class',
      display: 'Class',
    },
    {
      value: 'school',
      display: 'School',
    },
  ];

  userTypes: any[];

  isEditTask = false;
  isViewTask = false;

  ngOnInit() {
    this.titleId = this.route.snapshot.params['rncpId'];
    this.taskId = this.route.snapshot.queryParams['taskId'];
    this.type = this.route.snapshot.queryParams['type'];
    this.filterValue.class_id = this.route.snapshot.queryParams['classId'];
    this.initForm();
    this.initNextTaskFunctionality();
    this.getUserTypesDropdown();
    this.getTaskBuildersDropdown();
    this.isViewTask = false;
    if (this.type === 'edit' && this.taskId) {
      this.isEditTask = true;
      this.populateTaskForm();
    } else if (this.type === 'view' && this.taskId) {
      this.isViewTask = true;
      this.populateTaskForm();
    } else {
      this.initialForm = this.taskBuilderForm.getRawValue();
    }
  }

  initForm() {
    this.taskBuilderForm = this.fb.group({
      ref_id: this.fb.control({ value: null, disabled: true }),
      task_title: [null],
      description: [null],
      attachments: this.fb.array([]),
      expected_documents: this.fb.array([]),
      label_submit: ['Submit'],
      label_cancel: ['Cancel'],
      label_reject: ['Reject'],
      label_validate: ['Validate'],
      task_scope: [null, [Validators.required]],
      due_date: [null, [Validators.required]],
      assign_to_id: [null, [Validators.required]],
      assigner_id: [null, [Validators.required]],
      is_rejection_active: [null, [Validators.required]],
      is_other_task_active: [false, [Validators.required]],
      next_task_builder_id: this.fb.array([]),
      previous_task_builder_id: [null],
    });

    // filter out all the added next task from dropdown on every changes in the field;
    this.subs.sink = this.getNextTask().valueChanges.subscribe((change) => {
      if (change && this.originalTaskBuilders && this.originalTaskBuilders.length) this.filterTaskBuilder();
    });

    // on changes in the form, check if form is changed and compare the value. if form is the changed, then set saved validity status
    this.subs.sink = this.taskBuilderForm.valueChanges.subscribe((change) => {
      this.isFormChanged();
      this.formatPreviewValue();
    });
  }

  initNextTaskFormGroup({ _id, ref_id, task_title }) {
    return this.fb.group({
      _id: [_id],
      ref_id: [ref_id],
      task_title: [task_title],
    });
  }

  isFormChanged() {
    if (!this.taskBuilderForm || !this.initialForm) return;
    const secondForm = JSON.stringify(this.initialForm);
    const firstForm = JSON.stringify(this.taskBuilderForm.getRawValue());
    if (firstForm === secondForm) {
      this.taskService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.taskService.childrenFormValidationStatus = false;
      return false;
    }
  }

  getTaskBuildersDropdown() {
    this.isWaitingForResponse = true;
    if (!this.filterValue.class_id) return;
    this.subs.sink = this.rncpTitleService
      .getAllTaskBuilderDropdown(this.filterValue)
      .pipe(
        map((resp) => {
          return this.taskId ? [...resp].filter((task) => task._id !== this.taskId) : resp;
        }),
      )
      .subscribe((resp) => {
        this.isWaitingForResponse = false;
        this.originalTaskBuilders = cloneDeep(resp); // for reference of the unedited version
        this.taskBuilders = [...this.originalTaskBuilders];
        this.filterTaskBuilder();
      });
  }

  filterTaskBuilder() {
    if (!this.originalTaskBuilders || !this.taskBuilders) return;
    this.taskBuilders = this.originalTaskBuilders.filter(
      (task) =>
        !this.getNextTask()
          .value.map((addedNextTask) => addedNextTask._id)
          .includes(task._id),
    );
  }

  getUserTypesDropdown() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.userService.getAllUserTypeExcludeComp().subscribe((resp) => {
      this.userTypes = cloneDeep(resp).map((type) => (type.name === 'ADMTC Director' ? { ...type, name: 'Title Manager' } : type));

      // trigger valueChanges event so that the preview value of assigner and assigned person will be populated
      this.taskBuilderForm.patchValue({});
    });
  }

  // functionality that link behavior of task_ref_id and task_title in the second yellow box
  initNextTaskFunctionality() {
    this.currentSelectedNextTaskRef.valueChanges.subscribe((value) =>
      this.currentSelectedNextTaskTitle.setValue(value, { onlySelf: true, emitEvent: false, emitModelToViewChange: true }),
    );
    this.currentSelectedNextTaskTitle.valueChanges.subscribe((value) =>
      this.currentSelectedNextTaskRef.setValue(value, { onlySelf: true, emitEvent: false, emitModelToViewChange: true }),
    );
  }

  populateTaskForm() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.taskService.getOneTaskBuilder(this.taskId).subscribe(
      (task) => {
        this.isWaitingForResponse = false;
        this.currentTaskDetail = task;
        if (task) {
          let response = cloneDeep(task);
          if (!response.label_cancel) response.label_cancel = 'Cancel';
          if (!response.label_reject) response.label_reject = 'Reject';
          if (!response.label_submit) response.label_submit = 'Submit';
          if (!response.label_validate) response.label_validate = 'Validate';
          if (response.next_task_builder_id && !response.next_task_builder_id.length) response.next_task_builder_id = [];

          if (response.due_date && response.due_date.date && response.due_date.time) {

            const dateUTC = moment.utc(response.due_date.date + response.due_date.time, 'DD/MM/YYYYhh:mm').toDate();
            const dateMomentLocal = moment(dateUTC);
            response.due_date.date = dateMomentLocal.format('DD/MM/YYYY');
            response.due_date.time = dateMomentLocal.format('hh:mm');

          }

          response = this.formatResponse(response);

          this.taskBuilderForm.patchValue(response);

          if (response && response.next_task_builder_id && response.next_task_builder_id.length) {
            response.next_task_builder_id.forEach((element) => this.onAddNextTask(element, false));
          }

          this.filterTaskBuilder();

          // disable the field assigner, assign to, and task scope if task is already generated previously but ungenerated again and edited
          if (response && response.is_already_generated) {
            this.isTaskAlreadyGenerated = true;
            this.getAssigner().disable();
            this.getAssignTo().disable();
            this.getTaskScope().disable();
            this.taskBuilderForm.updateValueAndValidity();
          }

          if (response.attachments && response.attachments.length) {
            for (let i = 0; i < response.attachments.length; i++) {
              const attachments = this.taskBuilderForm.get('attachments') as UntypedFormArray;
              const group = this.initDocumentAttached();
              group.patchValue(response.attachments[i]);
              attachments.push(group);
            }
          }

          if (response.expected_documents && response.expected_documents.length) {
            for (let i = 0; i < response.expected_documents.length; i++) {
              const expectedDocs = this.taskBuilderForm.get('expected_documents') as UntypedFormArray;
              const group = this.initDocumentExpected();
              group.patchValue(response.expected_documents[i]);
              expectedDocs.push(group);
            }
          }

          this.initialForm = this.taskBuilderForm.getRawValue();


        }
      },
      (error) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: error && error['message'] ? error['message'] : error,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  findUserTypeByID(_id) {
    if (this.userTypes && this.userTypes.length) {
      return this.userTypes.find((type) => type && type._id && type._id === _id);
    }
  }

  formatPreviewValue() {
    const value = this.taskBuilderForm.getRawValue();
    if (typeof value.assign_to_id === 'string') value.assign_to_id = this.findUserTypeByID(value.assign_to_id);
    if (typeof value.assigner_id === 'string') value.assigner_id = this.findUserTypeByID(value.assigner_id);
    if (value.due_date && value.due_date instanceof Date) {
      value.due_date = {
        date: moment(value.due_date).format(DATE_FORMAT),
        time: moment(value.due_date).format(TIME_FORMAT),
      };
    }
    this.taskBuilderPreviewValue = value;

  }

  formatResponse(obj) {
    // return only the string _id of all object variables with key "_id"
    Object.entries(obj).forEach(([key, value]: any) => {
      if (value && typeof value === 'object' && value.hasOwnProperty('_id')) {
        obj[key] = value._id;
      }
      // parse string UTC date to local date type
      if (value && typeof value === 'object' && value.hasOwnProperty('date') && value.date && value.time) {
        obj[key] = moment(this.parseUtcToLocal.transformDate(value.date, value.time), 'DD/MM/YYYY').toDate();
      }
    });
    return obj;
  }

  onAddNextTask(task: TaskBuilderDropdown, isAddFromForm = true) {
    if (isAddFromForm) this.currentSelectedNextTaskRef.patchValue(null); // only need to set one of them as null
    this.getNextTask().push(this.initNextTaskFormGroup(task));
  }

  onDeleteNextTask(task: TaskBuilderDropdown, index: number) {
    if ((!task && !index) || this.isViewTask) return;
    const taskName = task.task_title;
    let timeDisabled = 3;
    Swal.fire({
      title: this.translate.instant('DELETE_NEXT_TASK_S1.TITLE', { taskName }),
      text: this.translate.instant('DELETE_NEXT_TASK_S1.TEXT', { taskName }),
      footer: `<span style="margin-left: auto">DELETE_NEXT_TASK_S1</span>`,
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('DELETE_NEXT_TASK_S1.BUTTON_1'),
      cancelButtonText: this.translate.instant('DELETE_NEXT_TASK_S1.BUTTON_2'),
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const time = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_NEXT_TASK_S1.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);

        setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_NEXT_TASK_S1.BUTTON_1');
          Swal.enableConfirmButton();
          clearTimeout(time);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      if (result.value) {
        this.getNextTask().removeAt(index);
      }
    });
  }

  onLeave() {
    this.onLeaveEmitter.emit(true);
  }

  getDate(): UntypedFormControl {
    return this.taskBuilderForm.get('due_date') as UntypedFormControl;
  }

  getAssigner(): UntypedFormControl {
    return this.taskBuilderForm.get('assigner_id') as UntypedFormControl;
  }

  getAssignTo(): UntypedFormControl {
    return this.taskBuilderForm.get('assign_to_id') as UntypedFormControl;
  }

  getTaskScope(): UntypedFormControl {
    return this.taskBuilderForm.get('task_scope') as UntypedFormControl;
  }

  getNextTask(): UntypedFormArray {
    return this.taskBuilderForm.get('next_task_builder_id') as UntypedFormArray;
  }

  getPreviousTask(): UntypedFormControl {
    return this.taskBuilderForm.get('previous_task_builder_id') as UntypedFormControl;
  }

  onPreview() {
    if (!this.isFormChanged()) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Preview_S1.TITLE'),
        text: this.translate.instant('Preview_S1.TEXT'),
        footer: `<span style="margin-left: auto">Preview_S1</span>`,
        showConfirmButton: true,
        confirmButtonText: this.translate.instant('Preview_S1.BUTTON'),
      });
      return;
    }

    this.subs.sink = this.dialog
      .open(TaskBuilderActionDialogComponent, {
        width: '800px',
        disableClose: true,
        data: { taskId: this.taskId, type: 'preview' },
      })
      .afterClosed()
      .subscribe((resp) => {});
  }

  initDocumentAttached() {
    return this.fb.group({
      file_name: [null],
      s3_file_name: [null],
    });
  }

  initDocumentExpected() {
    return this.fb.group({
      expected_document_name: [''],
      is_required: [false],
    });
  }

  onSave() {
    if (
      !this.isTaskAlreadyGenerated &&
      (!this.getAssignTo().valid || !this.getAssigner().valid || !this.getTaskScope().valid || !this.getDate().valid)
    ) {
      this.taskBuilderForm.markAllAsTouched();
      this.taskBuilderForm.markAsDirty();
      return;
    }
    const payload = this.formatPayload(this.taskBuilderForm.value);
    this.type && this.type === 'create' ? this.createTask(payload) : this.updateTask(payload);
  }

  createTask(payload) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.taskService.createTaskBuilder(payload).subscribe(
      (response) => {
        this.isWaitingForResponse = false;
        if (response) {
          this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
              type: 'edit',
              taskId: response._id,
              titleId: this.titleId,
              classId: this.filterValue.class_id,
            },
          });
          this.initialForm = this.taskBuilderForm.getRawValue();
          this.isFormChanged();
          Swal.fire({
            type: 'success',
            title: 'Bravo!',
          });
        }
      },
      (error) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: error && error['message'] ? error['message'] : error,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  updateTask(payload) {
    this.isWaitingForResponse = true;
    this.taskService.updateOneTaskBuilder(this.taskId, payload).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo !'),
          }).then(() => {
            this.initialForm = this.taskBuilderForm.getRawValue();
            this.isFormChanged();
            this.ngOnInit();
          });
        }
      },
      (error) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: error && error['message'] ? error['message'] : error,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  onViewPreviousTask(taskId: string, isPublished) {
    const viewType = isPublished ? 'view' : 'edit';
    if (!taskId) return;
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.router.onSameUrlNavigation = 'reload';
    this.router.navigate(['./'], { relativeTo: this.route,  queryParams: { taskId: taskId, type: viewType, titleId: this.titleId, classId: this.filterValue.class_id }, });
  }

  formatPayload(obj) {
    const result = cloneDeep(obj);
    if (result.rncp_title_id && result.rncp_title_id._id) {
      result.rncp_title_id = result.rncp_title_id._id;
    }
    if (result.assigner_id && result.assigner_id._id) {
      result.assigner_id = result.assigner_id._id;
    }
    if (result.assign_to_id && result.assign_to_id._id) {
      result.assign_to_id = result.assign_to_id._id;
    }
    if (result.previous_task_builder_id && result.previous_task_builder_id._id) {
      result.previous_task_builder_id = result.previous_task_builder_id._id;
    }
    if (result.class_id && result.class_id._id) {
      result.class_id = result.class_id._id;
    }
    if (result.next_task_builder_id && result.next_task_builder_id.length) {
      result.next_task_builder_id = result.next_task_builder_id.map((nextTask) => nextTask._id);
    }
    if (result.due_date instanceof Date) {

      result.due_date = this.parseLocalToUtc.transformJavascriptDate(result.due_date);

    } else if (result.due_date instanceof Date === false && result.due_date.date && result.due_date.time) {

      const dateLocal = this.parseUtcToLocal.transformDate(result.due_date.date, result.due_date.time);
      const dateMomentUTC = this.parseUtcToLocal.transform(result.due_date.time);
      result.due_date = {
        date: dateLocal,
        time: dateMomentUTC,
      };

    }
    const tempResult = _.omitBy(result, _.isNil);


    return tempResult;
  }

  cleanNullValues(obj) {
    const newObj = {};
    Object.entries(obj).forEach(([k, v]) => {

      if (Array.isArray(v) && v.length && typeof v[0] === 'object') {
        newObj[k] = v.map((arrItem) => (arrItem && arrItem.hasOwnProperty('_id') ? arrItem._id : arrItem));
      } else if (v === Object(v) && !Array.isArray(v)) {
        newObj[k] = this.cleanNullValues(v);
      } else if (v != null && !Array.isArray(v)) {
        newObj[k] = obj[k];
      }
    });
    return newObj;
  }

  otherTaskActive(event) {
    if (event.checked) {
      this.currentSelectedNextTaskRef.patchValue(null);
      this.getNextTask().clear();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
