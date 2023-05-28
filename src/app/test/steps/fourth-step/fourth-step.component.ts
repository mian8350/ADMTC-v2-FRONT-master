import { Component, OnInit, OnDestroy, ViewChildren, QueryList, ElementRef, AfterViewChecked, Renderer2 } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormArray, Validators, UntypedFormControl } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { DatePipe } from '@angular/common';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { TestCreationService } from '../../../service/test/test-creation.service';
import { SubSink } from 'subsink';
import * as moment from 'moment';
import * as _ from 'lodash';
import { TestCreationPayloadData, AutomaticTask, Task, Step, Calendar, Sender, DuplicateDialogData } from 'app/test/test-creation/test-creation.model';
import { DateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { UserService } from 'app/service/user/user.service';
import { UsersService } from 'app/service/users/users.service';
import Swal from 'sweetalert2';
import { GlobalErrorService } from 'app/service/global-error-service/global-error-service.service';
import { DuplicateTestDialogComponent } from '../first-step/duplicate-test-dialog/duplicate-test-dialog.component';

interface FourthStepForm {
  calendar: Calendar;
}

interface SortTask {
  value: string;
  text: string;
}

interface UserType {
  _id: string;
  name: string;
}

@Component({
  selector: 'ms-fourth-step',
  templateUrl: './fourth-step.component.html',
  styleUrls: ['./fourth-step.component.scss'],
  providers: [DatePipe, ParseUtcToLocalPipe, ParseLocalToUtcPipe, ParseStringDatePipe],
})
export class FourthStepComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChildren('taskTimeDiv') taskTimeDiv: QueryList<ElementRef>;
  private subs = new SubSink();

  // form variables
  formData: TestCreationPayloadData; // hold the form data from step 1 to step 5
  fourthStepForm: UntypedFormGroup;
  minDate = new Date();
  userTypes: UserType[];
  entitiesName: string[];
  users = [];

  // utility variables
  isWaitingForResponse = false;
  isOnInit = true;
  testId = '';
  titleId = '';
  categoryId = '';
  isWaitingSenderData = false;
  isSortingMode = false;

  // sort variables
  sortOptions: SortTask[] = [];
  isSortDescending = new UntypedFormControl(false);

  testProgress;
  private timeOutVal: any;

  constructor(
    private fb: UntypedFormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private translate: TranslateService,
    public testCreationService: TestCreationService,
    private userService: UserService,
    private usersService: UsersService,
    private renderer: Renderer2,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private globalErrorService: GlobalErrorService,
    public dialog: MatDialog,
    private dateAdapter: DateAdapter<Date>
  ) {}

  ngAfterViewChecked() {
    const hostElemPC = this.taskTimeDiv;
    if (hostElemPC && hostElemPC.length) {
      hostElemPC.forEach((hostelem) => {
        const hostElem = hostelem.nativeElement;
        this.renderer.setStyle(hostElem.children[0].children[0].children[0].children[1], 'align-self', 'end');
      });
    }
  }

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.subs.sink = this.route.parent.paramMap.subscribe((params) => {
      this.titleId = params.get('titleId');
      this.categoryId = params.get('categoryId');
      this.testId = params.get('testId');
      this.sortOptions = this.testCreationService.getSortFourthStepTask();
      this.initFormData();
      this.getTestCreationData();
      this.getUserTypes();
    });

    // Caught error from global error handler
    this.subs.sink = this.globalErrorService.globalErrorData$.subscribe(isError => {
      if (isError) {
        this.isWaitingForResponse = false;
        this.globalErrorService.setGlobalError(false);
      }
    })
  }

  getUserTypes() {
    this.entitiesName = this.userService.getEntitiesName();
    this.subs.sink = this.testCreationService.getAllUserType().subscribe((resp) => {
      this.userTypes = resp;
    });
  }

  getTestCreationData() {
    this.subs.sink = this.testCreationService.isTestCreationLoaded$.subscribe((isLoaded) => {
      if (isLoaded) {
        this.formData = this.testCreationService.getTestCreationDataWithoutSubscribe();

        this.testCreationService.getCalendarSteps(this.formData._id).subscribe(resp => {
          this.getAutomaticTasks();
        })
      }
    });

    // Get Test Progress
    this.subs.sink = this.testCreationService.testProgressData$.subscribe((testProgress) => {
      this.testProgress = testProgress;
    });

    // triggered when click previous button in top left corner
    this.subs.sink = this.testCreationService.updateTestPreviousData$.subscribe((data) => {
      if (data === 'fourth') {
        this.goToStep('third');
      }
    });
    // triggered when click continue button in top right corner
    this.subs.sink = this.testCreationService.updateTestContinueData$.subscribe((data) => {
      if (data === 'fourth') {
        // this.saveTest(true);
        this.goToStep('fifth');
      }
    });
  }

  goToStep(selectedStep: string, duplicateTestId?: string, ishardRefresh?: boolean) {
    this.subs.sink = this.route.parent.paramMap.subscribe((params) => {
      const titleId = params.get('titleId');
      const categoryId = params.get('categoryId');
      const testId = params.get('testId');
      if (ishardRefresh && duplicateTestId) {
        this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
          this.router.navigate(
            ['/create-test', titleId, { categoryId: categoryId, testId: testId }, selectedStep],
            { queryParams: duplicateTestId ? {duplicate: duplicateTestId} : null}
          );
        })
      } else {
        this.router.navigate(
          ['/create-test', titleId, { categoryId: categoryId, testId: testId }, selectedStep],
          { queryParams: duplicateTestId ? {duplicate: duplicateTestId} : null}
        );
      }
    });
  }

  getAutomaticTasks() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.testCreationService.getAutomaticTask(this.formData._id).subscribe((resp) => {
      this.isWaitingForResponse = false;

      if (resp && resp.tasks_list && resp.tasks_list.length) {
        resp.tasks_list.forEach((task, index) => {
          this.setAutomaticTaskFormData(task, index);
        });
      }

      // get all the manual task, and assign it to task form
      const data: TestCreationPayloadData = _.cloneDeep(this.formData);
      data.calendar.steps.forEach((task, index) => {
        if (!task.is_automatic_task) {
          // convert date from UTC to local
          if (task.date.value && task.date.type === 'fixed') {
            task.date.value.date = this.parseStringDatePipe.transformStringToDate(
              this.parseUTCToLocalPipe.transformDate(task.date.value.date, task.date.value.time),
            );
            task.date.value.time = this.parseLocalToUTCPipe.transform(task.date.value.time);
          }
          if (task.sender_entity && task.sender_type) {
            this.getInitialSenders(task.sender_entity, task.sender_type, index);
          }
          task.isEditMode = false;
          this.addTaskForm();
          this.taskForms.at(this.taskForms.length - 1).patchValue(task);
        }
      });

      this.updateTestCreationData();
      if (!this.formData.is_published) {
        this.autoSaveTest();
      }
    });
  }

  setAutomaticTaskFormData(task: Task, index: number) {
    // input data from getAutomaticTask API to calendar step form
    const formData: Step = {
      actor: task.actor._id, // user type id
      text: task.description ? task.description : task.task_type,
      sender: task.reminder ? task.reminder._id : null,
      senderData: {
        _id: task.reminder ? task.reminder._id : null,
        civility: task.reminder ? task.reminder.civility : '',
        first_name: task.reminder ? task.reminder.first_name : '',
        last_name: task.reminder ? task.reminder.last_name : '',
      },
      date: {
        type: task.date.type,
        before: task.date.before,
        day: task.date.day,
        value: {
          date: task.date.value
            ? this.parseStringDatePipe.transformStringToDate(
                this.parseUTCToLocalPipe.transformDate(task.date.value.date, task.date.value.time),
              )
            : '',
          time: task.date.value ? this.parseUTCToLocalPipe.transform(task.date.value.time) : '',
        },
      },
      task_type: task.task_type,
      start_after: task.start_after,
      isEditMode: false,
      is_automatic_task: true,
    };
    this.addTaskForm();
    this.taskForms.at(index).patchValue(formData);
  }

  setFourthStepFormData() {
    const data: TestCreationPayloadData = _.cloneDeep(this.formData);

    data.calendar.steps.forEach((task, index) => {
      // convert date from UTC to local
      if (task.date.value && task.date.type === 'fixed') {
        task.date.value.date = this.parseStringDatePipe.transformStringToDate(
          this.parseUTCToLocalPipe.transformDate(task.date.value.date, task.date.value.time),
        );
        task.date.value.time = this.parseLocalToUTCPipe.transform(task.date.value.time);
      }
      task.isEditMode = false;
      this.addTaskForm();
      if (task.sender_entity && task.sender_type) {
        this.getInitialSenders(task.sender_entity, task.sender_type, index);
      }
    });

    // populate fourth step form
    this.fourthStepForm.patchValue(data);
    this.updateTestCreationData();
  }

  updateTestCreationData() {
    // set every changes in the form to the test creation data
    this.subs.sink = this.fourthStepForm.valueChanges.subscribe((changes) => {
      const payload: FourthStepForm = this.fourthStepForm.getRawValue();
      // reset the formarray data before merging
      this.formData.calendar.steps = null;
      // convert date in fourthStepForm to UTC
      payload.calendar.steps.forEach((task) => {
        if (task.date.value && task.date.type === 'fixed') {
          task.date.value.date = this.parseLocalToUTCPipe.transformDate(
            moment(task.date.value.date).format('DD/MM/YYYY'),
            task.date.value.time,
          );
          task.date.value.time = this.parseLocalToUTCPipe.transform(task.date.value.time);
        }
      });
      if (!this.isSortingMode) {
        // assign data to parent test creation form
        this.testCreationService.setTestCreationData(_.merge(_.cloneDeep(this.formData), payload));
      }
      if (this.isOnInit) {
        this.testCreationService.setSavedTestCreationData(_.merge(_.cloneDeep(this.formData), payload));
      }
      this.isOnInit = false;

    });
    // trigger valueChanges manually when load for the first time
    this.fourthStepForm.updateValueAndValidity({ emitEvent: true });
  }

  initFormData() {
    this.fourthStepForm = this.fb.group({
      calendar: this.fb.group({
        steps: this.fb.array([]),
      }),
    });
  }

  initTaskForm() {
    return this.fb.group({
      created_from: ['manual'],
      text: ['', Validators.required], // "what" field (assign corrector: Marks Entry, Assign Corrector)
      actor: [null, Validators.required], // "who" field (academic director, student, etc)
      date: this.fb.group({
        type: ['fixed'], // "Relative Date" toggle
        before: [false], // before or after radio
        day: [1], // before or after x day
        value: this.fb.group({
          // "when" field
          date: [''],
          time: [''],
        }),
      }),
      sender_entity: [null],
      sender_type: [null],
      sender: [null, Validators.required], // "Who is the reminder" field
      senderData: this.fb.group({
        _id: [null],
        civility: [''],
        first_name: [''],
        last_name: [''],
      }),
      isEditMode: [true], // flag to show edit mode or preview mode
      is_automatic_task: [false], // flag to determine if the task is auto generated from API or created manually
      task_type: ['manual_task'],
      start_after: [''],
    });
  }

  get taskForms(): UntypedFormArray {
    return this.fourthStepForm.get('calendar').get('steps') as UntypedFormArray;
  }

  addTaskForm() {
    this.taskForms.push(this.initTaskForm());
    this.users.push([null]);
  }

  addManualTaskForm() {
    this.addTaskForm();
    this.setFixedDateValidation(this.taskForms.at(this.taskForms.length - 1));
    this.isSortingMode = false;
  }

  setManualTask(task: UntypedFormGroup) {
    if (!task.valid) {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('SORRY'),
        text: this.translate.instant('TEST.ERRORS.FILLALL')
      })
    } else {
      task.get('isEditMode').setValue(false);
    }
  }

  removeTaskWithoutSwal(index: number) {
    this.taskForms.removeAt(index);
    this.users.splice(index, 1);
    this.isSortingMode = false;
  }

  removeTaskForm(index: number) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
      html: this.translate.instant('this action will delete task !'),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      clearTimeout(this.timeOutVal);
      if (res.value) {
        this.taskForms.removeAt(index);
        this.users.splice(index, 1);
        this.isSortingMode = false;
        Swal.fire({
          type: 'success',
          title: this.translate.instant('EVENT_S1.TITLE'),
          html: this.translate.instant('task deleted'),
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
        });
      }
    });
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    this.testCreationService.removePreviousButton();
    this.testCreationService.removeContinueButton();
    this.subs.unsubscribe();
  }

  getActorType(userTypeId: string): string {
    const userTypeFound: UserType = _.find(this.userTypes, (userType) => userType._id === userTypeId);
    if (userTypeFound) {
      return this.translate.instant(userTypeFound.name);
    }
    return '';
  }

  getTaskTranslation(task: UntypedFormGroup): string {
    const isAutomaticTask = task.get('is_automatic_task').value;
    const taskType = task.get('text').value;

    if (isAutomaticTask) {
      // convert taskType from assign_corrector to be ASSIGN CORRECTOR
      const convertedTaskType = taskType.replace(/_/g, ' ').toUpperCase();
      return this.translate.instant('TEST.AUTOTASK.' + convertedTaskType);
    }
    return taskType;
  }

  getReminderName(task: UntypedFormGroup): string {
    const civility = task.get('senderData').get('civility').value
      ? this.translate.instant(task.get('senderData').get('civility').value)
      : '';
    const firstName = task.get('senderData').get('first_name').value;
    const lastName = task.get('senderData').get('last_name').value;

    // case when task is expected document for student, return 'Academic Director'
    const userTypeId = task.get('actor').value;
    const userTypeFound: UserType = _.find(this.userTypes, (userType) => userType._id === userTypeId);
    if (userTypeFound && userTypeFound.name && userTypeFound.name.toLowerCase().trim() === 'student') {
      return this.translate.instant('Academic Director');
    }

    return `${civility} ${firstName} ${lastName}`;
  }

  getDeadline(task: UntypedFormGroup): string {
    const dateType = task.get('date').get('type').value;
    // if different date checked in step 1 and the task is "mark entry"
    if (this.formData.date_type === 'different' && task.get('task_type').value === 'mark_entry') {
      return this.translate.instant('Same as school test date');
    }
    // if fixed date
    if (dateType === 'fixed') {
      const date: Date = task.get('date').get('value').get('date').value;
      return new DatePipe(this.translate.currentLang).transform(date);
    } else {
      // if relative date
      const beforeOrAfter = task.get('date').get('before').value ? this.translate.instant('BEFORE') : this.translate.instant('AFTER');
      const days = `${task.get('date').get('day').value} ${this.translate.instant('DAYS')}`;
      return `${beforeOrAfter} ${days}`;
    }
  }

  toggleRelativeDate(event: MatSlideToggleChange, task: UntypedFormGroup) {
    const dateType = event.checked ? 'relative' : 'fixed';
    if (dateType === 'relative') {
      this.setRelativeDateValidation(task);
    } else {
      this.setFixedDateValidation(task);
    }
    task.get('date').get('type').setValue(dateType);
  }

  setRelativeDateValidation(task) {
    task.get('date').get('value').get('date').setValue('');
    task.get('date').get('value').get('date').clearValidators();
    task.get('date').get('value').get('date').updateValueAndValidity();
    task.get('date').get('value').get('time').setValue('');
    task.get('date').get('value').get('time').clearValidators();
    task.get('date').get('value').get('time').updateValueAndValidity();
    task.get('date').get('day').setValidators([Validators.required]);
    task.get('date').get('day').updateValueAndValidity();
  }

  setFixedDateValidation(task) {
    task.get('date').get('day').setValue(1);
    task.get('date').get('day').clearValidators();
    task.get('date').get('day').updateValueAndValidity();
    task.get('date').get('value').get('date').setValidators([Validators.required]);
    task.get('date').get('value').get('date').updateValueAndValidity();
    task.get('date').get('value').get('time').setValidators([Validators.required]);
    task.get('date').get('value').get('time').updateValueAndValidity();
  }

  setRelativeDate(task: UntypedFormGroup) {
    const dateType = task.get('date').get('type').value;
    if (dateType === 'relative') {
      return true;
    }
    return false;
  }

  selectEntity(task: UntypedFormGroup) {
    task.get('sender').setValue(null);
    task.get('sender_type').setValue(null);
  }

  getSenders(selectedType: MatSelectChange, selectedEntity: string, index: number) {
    this.taskForms.at(index).get('sender').setValue(null);

    this.isWaitingSenderData = true;
    if (selectedEntity === 'academic') {
      this.subs.sink = this.usersService.getSenderUsers(selectedEntity, selectedType.value, this.titleId).subscribe((resp) => {
        this.users[index] = resp;
        this.isWaitingSenderData = false;
      });
    } else {
      this.subs.sink = this.usersService.getSenderUsers(selectedEntity, selectedType.value, '').subscribe((resp) => {
        this.users[index] = resp;
        this.isWaitingSenderData = false;
      });
    }
  }

  getInitialSenders(entity: string, typeId: string, index: number) {
    if (entity === 'academic') {
      this.subs.sink = this.usersService.getSenderUsers(entity, typeId, this.titleId).subscribe((resp) => {
        this.users[index] = resp;
        this.isWaitingSenderData = false;
      });
    } else {
      this.subs.sink = this.usersService.getSenderUsers(entity, typeId, '').subscribe((resp) => {
        this.users[index] = resp;
        this.isWaitingSenderData = false;
      });
    }
  }

  setSenderData(event: MatSelectChange, index: number) {
    const userFound = _.find(this.users[index], (user) => user._id === event.value);
    this.taskForms.at(index).get('senderData').setValue(userFound);

  }

  dateUpdateService(index: number) {
    if (
      this.taskForms.at(index).get('date').get('value').get('date').value &&
      this.taskForms.at(index).get('date').get('value').get('time').value
    ) {
      // update service

    }
  }

  autoSaveTest() {

    const formData = _.cloneDeep(this.testCreationService.getCleanTestCreationData());
    this.isWaitingForResponse = true;
    this.subs.sink = this.testCreationService.updateTest(this.formData._id, formData).subscribe((response) => {
      this.isWaitingForResponse = false;
      if (response) {
        const temp: TestCreationPayloadData = this.testCreationService.getTestCreationDataWithoutSubscribe();
        if (temp.current_tab && temp.current_tab === 'fourth') {
          temp.current_tab = 'fifth';
        }
        // make isedit mode in all task form false
        this.taskForms.controls.forEach((task) => task.get('isEditMode').setValue(false));
        // save data to service
        this.testCreationService.setTestCreationData(temp);
        this.testCreationService.setSavedTestCreationData(this.testCreationService.getTestCreationDataWithoutSubscribe());
      }
    });
  }

  saveTest() {
    const formData = _.cloneDeep(this.testCreationService.getCleanTestCreationData());
    if (formData.current_tab && formData.current_tab === 'fourth') {
      formData.current_tab = 'fifth';
    }

    this.isWaitingForResponse = true;
    this.subs.sink = this.testCreationService.updateTest(this.formData._id, formData).subscribe((response) => {
      this.isWaitingForResponse = false;
      if (response) {
        const temp: TestCreationPayloadData = this.testCreationService.getTestCreationDataWithoutSubscribe();
        if (temp.current_tab && temp.current_tab === 'fourth') {
          temp.current_tab = 'fifth';
        }
        // make isedit mode in all task form false
        this.taskForms.controls.forEach((task) => task.get('isEditMode').setValue(false));
        // save data to service
        this.testCreationService.setTestCreationData(temp);
        this.testCreationService.setSavedTestCreationData(this.testCreationService.getTestCreationDataWithoutSubscribe());
        Swal.fire({
          type: 'success',
          title: 'Bravo !',
          text: this.translate.instant('TEST.SAVE_FIRST_TAB.TITLE_CREATE'),
        });
      }
    });
  }

  sortTask(selectedSort: string) {
    this.isSortingMode = true;
    const tasks: Step[] = _.cloneDeep(this.taskForms.value);
    const formData: TestCreationPayloadData = _.cloneDeep(this.formData);
    let sortedArr: Step[] = [];

    if (selectedSort === 'text') {
      sortedArr = _.orderBy(tasks, (task: Step) => task.text.toUpperCase(), [this.isSortDescending.value ? 'desc' : 'asc']);
    }
    if (selectedSort === 'sender') {
      sortedArr = _.orderBy(tasks, (task: Step) => task.senderData.first_name.toUpperCase(), [
        this.isSortDescending.value ? 'desc' : 'asc',
      ]);
    }
    if (selectedSort === 'actor') {
      sortedArr = _.orderBy(
        tasks,
        (task: Step) => {
          const name = this.getActorType(task.actor);
          return name ? name.toUpperCase() : false;
        },
        [this.isSortDescending.value ? 'desc' : 'asc'],
      );
    }
    if (selectedSort === 'date') {
      const fixedDateTasks = _.filter(tasks, (task: Step) => task.date.type === 'fixed');
      const relativeDateTasks = _.filter(tasks, (task: Step) => task.date.type === 'relative');
      sortedArr = _.orderBy(fixedDateTasks, (task: Step) => task.date.value.date, [this.isSortDescending.value ? 'desc' : 'asc']);
      sortedArr.push(..._.orderBy(relativeDateTasks, (task: Step) => task.date.day, [this.isSortDescending.value ? 'desc' : 'asc']));
    }

    if (sortedArr.length) {
      formData.calendar.steps = sortedArr;
      this.fourthStepForm.patchValue(formData);
      this.generateDummySenderDropdown(this.taskForms.value);
    }
  }

  generateDummySenderDropdown(tasks: Step[]) {
    // generate dummy dropdown data for sender field when the form get shuffled
    this.users = [];
    tasks.forEach((task) => {
      this.users.push([
        {
          _id: task.senderData._id,
          civility: task.senderData.civility,
          first_name: task.senderData.first_name,
          last_name: task.senderData.last_name,
        },
      ]);
    });

  }

  openDuplicateDialog() {
    const formData = _.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe());
    const dialogRef = this.dialog.open(DuplicateTestDialogComponent, {
      minWidth: '400px',
      minHeight: '100px',
      panelClass: 'certification-rule-pop-up',
      disableClose: true,
      data: {
        titleId: this.titleId,
        testId: this.testId,
        // we pass class, block, subject, and evaluation id when duplicate in edit test
        // so the duplicate target will auto populated with current test data
        classId: formData && formData.class_id ? formData.class_id : '',
        subjectId: formData && formData.subject_id ? formData.subject_id : '',
        blockId: formData && formData.block_of_competence_condition_id ? formData.block_of_competence_condition_id : '',
        evalId: formData && formData.evaluation_id ? formData.evaluation_id : ''
      }
    });
    dialogRef.afterClosed().subscribe((data: DuplicateDialogData) => {
      if (data?.duplicateFrom && this.titleId && this.categoryId) {
        if (this.testId) {
          // when duplicate in edit test page, we send testId in url
          this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
            this.router.navigate(
              ['/create-test', this.titleId, { categoryId: this.categoryId, testId: this.testId }, 'first'],
              { queryParams: this.getDuplicateUrlParam(data) }
            );
          })
        } else {
          // when duplicate in create test page
          this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
            this.router.navigate(
              ['/create-test', this.titleId, { categoryId: this.categoryId }, 'first'],
              { queryParams: this.getDuplicateUrlParam(data) }
            );
          })
        }
      }
    });
  }

  // *************** If Date is picked and time is not yet, it will auto populate time to be 07:00
  datePicked(taskIndex) {
    if (
      this.taskForms.at(taskIndex).get('date').get('value').get('date').value &&
      !this.taskForms.at(taskIndex).get('date').get('value').get('time').value
    ) {
      this.taskForms.at(taskIndex).get('date').get('value').get('time').patchValue('07:00');
    }
  }

  getDuplicateUrlParam(data: DuplicateDialogData) {
    if (data && data.duplicateFrom) {
      return ({
        duplicate: data.duplicateFrom,
        class: data.classId,
        block: data.blockId,
        subject: data.subjectId,
        eval: data.evalId
      })
    } else {
      return null;
    }
  }
}
