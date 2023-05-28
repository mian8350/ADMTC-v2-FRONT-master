import { AuthService } from 'app/service/auth-service/auth.service';
import { FormFillingService } from 'app/form-filling/form-filling.service';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { FormFollowUpService } from '../form-follow-up.service';
import { cloneDeep } from 'lodash';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { UntypedFormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import * as moment from 'moment';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import swal from 'sweetalert2';
@Component({
  selector: 'ms-form-detail-table',
  templateUrl: './form-detail-table.component.html',
  styleUrls: ['./form-detail-table.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class FormDetailTableComponent implements OnInit, OnDestroy, AfterViewInit {
  private subs = new SubSink();
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  filteredSchoolOrigin: Observable<any[]>;

  isWaitingForResponse: boolean = false;
  isReset: boolean = false;
  dataLoaded: boolean = false;
  formId: any;
  formType: any;
  noData: any;
  studentAdmissionData: any;
  sortValue = null;
  statusStep = [];
  statusMatrix: any[][] = [];
  studentAdmissionCount: any;
  statusForm: any[] = [];

  dataSource = new MatTableDataSource([]);

  displayedColumns: string[] = ['user', 'school', 'titleManager', 'sendAt', 'action'];
  filterColumns: string[] = ['userFilter', 'schoolFilter', 'titleManagerFilter', 'sendAtFilter', 'actionFilter'];
  stepsFilterDropdown = [
    { value: 'not_started', viewValue: 'Step is not done' },
    { value: 'accept', viewValue: 'Step is completed' },
    { value: 'need_validation', viewValue: 'Step is waiting for validation' },
    { value: 'ask_for_revision', viewValue: 'Step is rejected by the validator' },
  ];

  // *** FILTER FORMS *********************************/
  userFilter = new UntypedFormControl(null);
  schoolFilter = new UntypedFormControl(null);
  titleManagerFilter = new UntypedFormControl(null);
  sendAtFilter = new UntypedFormControl(null);

  // *** FILTER FORMS *********************************/
  filteredValues = {
    school: null,
    user_recipient_last_name: '',
    title_manager_last_name: null,
    steps: null,
    form_builder_id: '',
    send_date: '',
    class_id: '',
    rncp_title_id: '',
  };
  dataTable: any;
  classId: any;
  rncpId: any;
  className: any;
  rncpName: any;
  formName: any;
  private timeOutVal: any;
  optionalStep = [];
  normalStep = [];
  stepData: any;
  currentUser: any;

  constructor(
    private pageTitleService: PageTitleService,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private formFollowUpService: FormFollowUpService,
    private formBuilderService: FormBuilderService,
    private router: Router,
    private rncpTitleService: RNCPTitlesService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
  ) {}

  ngOnInit() {
    this.getParamRoute();
    this.initSearch();
    this.getOneFormData();
    this.getDataRncpClass(); // Set Page Title
    this.currentUser = JSON.parse(localStorage.getItem('userProfile'));

    // this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
    //   this.pageTitleService.setTitle(this.translate.instant('Form Follow Up Table'));
    // });
    this.pageTitleService.setIcon('clipboard-search-outline');
  }

  getParamRoute() {
    if (this.route && this.route.snapshot) {
      const params = this.route.snapshot.params;
      this.formId = params && params.formId ? params.formId : '';

      const queryParams = this.route.snapshot.queryParams;
      this.formType = queryParams && queryParams.form_type ? queryParams.form_type : '';
      this.rncpId = queryParams && queryParams.rncp_id ? queryParams.rncp_id : '';
      this.classId = queryParams && queryParams.class_id ? queryParams.class_id : '';
      this.getDropdownSchool();
    }
  }

  setSchoolFilter(value) {
    this.filteredValues.school = value;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getDataTableFormType();
    }
  }

  getDropdownSchool() {
    this.subs.sink = this.rncpTitleService.getSchoolListByClass(this.rncpId, this.classId).subscribe((resp) => {

      this.filteredSchoolOrigin = this.schoolFilter.valueChanges.pipe(
        startWith(''),
        map((searchTxt: string) =>
          resp.filter((sch) => {
            if (searchTxt) {

              return sch.short_name.toLowerCase().includes(searchTxt.toLowerCase());
            }
            return true;
          }),
        ),
      );

    });
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (!this.isReset) {
            this.getDataTableFormType();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
  }

  getDataTableFormType() {
    if (this.formType === 'student_admission') {
      this.getAllStudentAdmissionProcesses();
    }
    if (this.formType === 'quality_file') {
      this.getAllQualityFile();
    }
  }

  setUpStepsColumns(steps) {
    steps.forEach((element, index) => {
      this.displayedColumns.splice(2 + index, 0, element.name);
      this.filterColumns.splice(2 + index, 0, `${element.name}_filter`);

    });
  }

  constructStepMatrix(resp) {

    resp.forEach((element, index) => {
      const boolArray: any[] = element.steps;
      this.statusMatrix[index] = boolArray;
    });
  }

  // SEARCH TABLE DATA
  initSearch() {
    this.subs.sink = this.userFilter.valueChanges.pipe(debounceTime(500)).subscribe((searchText) => {

      this.paginator.pageIndex = 0;
      this.filteredValues.user_recipient_last_name = searchText;
      this.getDataTableFormType();
    });
    this.subs.sink = this.titleManagerFilter.valueChanges.pipe(debounceTime(500)).subscribe((searchText) => {

      this.paginator.pageIndex = 0;
      this.filteredValues.title_manager_last_name = searchText;
      this.getDataTableFormType();
    });
    this.subs.sink = this.sendAtFilter.valueChanges.pipe(debounceTime(500)).subscribe((searchText) => {

      this.paginator.pageIndex = 0;
      this.filteredValues.send_date = searchText;
      this.getDataTableFormType();
    });
  }

  getOneFormData() {
    this.subs.sink = this.formBuilderService.getFormBuilderTemplateFirstTab(this.formId).subscribe((resp) => {
      if (resp) {
        this.dataTable = resp;
        this.setPageTitle();
        this.stepData = resp.steps;

        // this.statusStep = resp.steps.map((data) => data._id);
        resp.steps.map((data) => {
          if (data.is_only_visible_based_on_condition) {
            this.optionalStep.push(data._id);
          } else {
            this.normalStep.push(data._id);
          }
        });

        if (this.stepData.length) {
          for (let i = 0; i < this.stepData.length; i++) {
            if (!this.stepData[i].is_only_visible_based_on_condition) {
              const findIndex = this.normalStep.findIndex(
                (step) => step && this.stepData[i] && this.stepData[i]._id && step === this.stepData[i]._id,
              );

              if (findIndex >= 0) {
                this.statusStep.push({
                  id: this.normalStep[findIndex],
                  name: `S${findIndex + 1}`,
                });
              }
            } else {
              const findIndex = this.optionalStep.findIndex(
                (step) => step && this.stepData[i] && this.stepData[i]._id === this.stepData[i]._id,
              );

              if (findIndex >= 0) {
                this.statusStep.push({
                  id: this.optionalStep[findIndex],
                  name: `O${findIndex + 1}`,
                });
              }
            }
          }

        }

        if (this.statusStep.length) {
          for (let i = 0; i < this.statusStep.length; i++) {
            this.statusForm[this.statusStep[i].name] = '';
          }
        }

        this.setUpStepsColumns(this.statusStep);
        this.getDataTableFormType();
      }
    });
  }

  sortData(sort: Sort) {
    if (sort.active.includes('step_status')) {
      const indexStep = sort.active.substring(sort.active.length - 1);


      const sortStep = {
        steps: {
          step_id: this.statusStep[indexStep].id,
          step_status: sort.direction ? sort.direction : `asc`,
        },
      };

      this.sortValue = sort.direction ? sortStep : null;
    } else {
      this.sortValue = this.sortValue = sort.direction ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    }
    if (!this.isWaitingForResponse) {
      this.paginator.pageIndex = 0;
      this.getDataTableFormType();
    }
  }

  resetSelection() {
    // this.isReset = true;
    this.paginator.pageIndex = 0;
    this.filteredValues = {
      school: null,
      user_recipient_last_name: '',
      title_manager_last_name: null,
      steps: null,
      form_builder_id: this.formId,
      send_date: '',
      class_id: '',
      rncp_title_id: '',
    };

    // clear all forms in blockForms
    for (const key of Object.keys(this.statusForm)) {
      this.statusForm[key] = '';
    }

    this.sortValue = null;
    this.sort.direction = '';
    this.sort.active = '';
    this.sort.sortChange.emit({active: '', direction: ''});


    this.userFilter.patchValue(null, { emitEvent: false });
    this.sendAtFilter.patchValue(null, { emitEvent: false });
    this.schoolFilter.patchValue(null, { emitEvent: false });
    this.titleManagerFilter.patchValue(null, { emitEvent: false });

    this.getDataTableFormType();
  }

  getAllQualityFile() {
    this.isWaitingForResponse = true;
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.filteredValues.form_builder_id = this.formId;
    this.filteredValues.class_id = this.classId;
    this.filteredValues.rncp_title_id = this.rncpId;

    this.subs.sink = this.formFollowUpService.getAllFormProcesses(pagination, this.filteredValues, this.sortValue).subscribe(
      (resp) => {

        this.isWaitingForResponse = false;
        if (resp && resp.length) {
          this.studentAdmissionData = cloneDeep(resp);
          this.studentAdmissionCount = resp[0].count_document;
          this.dataSource.data = resp;
          this.noData = false;
          this.constructStepMatrix(resp);
        } else {
          this.noData = true;
          this.dataSource.data = [];
          this.paginator.length = 0;
          this.studentAdmissionCount = 0;
        }
      },
      (err) => {
        this.isWaitingForResponse = false;

      },
    );
  }

  getAllStudentAdmissionProcesses() {
    this.isWaitingForResponse = true;

    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.filteredValues.form_builder_id = this.formId;
    this.filteredValues.class_id = this.classId;
    this.filteredValues.rncp_title_id = this.rncpId;
    this.subs.sink = this.formFollowUpService.getAllFormProcesses(pagination, this.filteredValues, this.sortValue).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp && resp.length) {

          this.studentAdmissionData = cloneDeep(resp);
          this.studentAdmissionCount = resp[0].count_document;
          this.dataSource.data = resp;
          this.noData = false;
          this.constructStepMatrix(resp);
        } else {
          this.noData = true;
          this.dataSource.data = [];
          this.paginator.length = 0;
          this.studentAdmissionCount = 0;
        }
      },
      (err) => {
        this.isWaitingForResponse = false;

      },
    );
  }

  updateFilterSteps(id: string, status: any) {
    let step = this.filteredValues.steps ? [...this.filteredValues.steps] : [];
    const indexOfStep = step.findIndex((block) => block && block.block_id && block.block_id === id);
    if (indexOfStep >= 0) {
      step.splice(indexOfStep, 1);
    }

    if (status && status.value !== '') {
      if (this.formType === 'student_admission') {
        step.push({
          step_id: id,
          step_status: status.value,
        });
      } else if (this.formType === 'quality_file') {
        step = [];
        step.push({
          step_id: id,
          step_status: status.value,
        });
      }
    }
    this.filteredValues.steps = step;

    this.getDataTableFormType();
  }

  getStepStatus(stepMatrix, stepId) {
    let stepStatus;
    stepMatrix.forEach((step) => {
      if (step) {
        const stepFound = step && step.form_builder_step && step.form_builder_step._id === stepId;
        if (stepFound) {
          stepStatus = step.step_status;
        }
      }
    });
    return stepStatus;
  }

  getStepColor(stepMatrix, stepId) {
    let stepColor;
    stepMatrix.forEach((step) => {
      if (step) {
        const stepFound = step && step.form_builder_step && step.form_builder_step._id && step.form_builder_step._id === stepId;
        if (stepFound) {
          switch (step.step_status) {
            case 'not_started':
              stepColor = 'black';
              break;
            case 'accept':
              stepColor = 'green';
              break;
            case 'ask_for_revision':
              stepColor = 'red';
              break;
            case 'need_validation':
              stepColor = 'orange';
              break;
            default:
              stepColor = '';
              break;
          }
        }
      }
    });
    return stepColor;
  }

  getDataRncpClass() {
    const pagination = { limit: 1, page: 0 };
    let filter = ``;
    filter += `rncp_title_id : "${this.rncpId}"`;
    filter += `class_id : "${this.classId}"`;
    this.subs.sink = this.formFollowUpService.getRncpClass(filter, pagination).subscribe((resp) => {
      if (resp && resp.length) {

        this.className = resp[0].class_id.name;
        this.rncpName = resp[0].class_id.parent_rncp_title.short_name;
        this.formName = resp[0].form_builder_id.form_builder_name;
      }
    });
  }

  setPageTitle() {
    this.pageTitleService.setIcon('clipboard-search-outline');
    this.pageTitleService.setTitle(
      this.translate.instant('TITLE_FORM_FOLLOW_UP_DETAIL', {
        form_builder_name: this.dataTable.form_builder_name,
      }),
    );

    // Listen to language changes to reset page title
    this.subs.sink = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.pageTitleService.setIcon('clipboard-search-outline');
      this.pageTitleService.setTitle(
        this.translate.instant('TITLE_FORM_FOLLOW_UP_DETAIL', {
          form_builder_name: this.dataTable.form_builder_name,
        }),
      );
    });
  }

  goToForm(form) {
    if (this.formType === 'student_admission' && form && form.student_id) {
      const studentData = form.student_id;
      const userTypeId = '5a067bba1c0217218c75f8ab';
      const domainUrl = this.router.url.split('/')[0];
      window.open(
        `${domainUrl}/form-fill?formId=${studentData.admission_process_id._id}&formType=student_admission&userId=${studentData.user_id._id}&userTypeId=${userTypeId}`,
        '_blank',
      );
    } else if (this.formType === 'quality_file' && form) {
      const studentData = form;
      const userTypeId = this.currentUser.entities[0].type._id;
      const domainUrl = this.router.url.split('/')[0];
      window.open(
        `${domainUrl}/form-fill?formId=${studentData._id}&formType=quality_form&userId=${studentData.user_id._id}&userTypeId=${userTypeId}`,
        '_blank',
      );
    }
  }

  checkSendReminder(data) {
    let timeDisabled = 2;
    this.isWaitingForResponse = true;
    this.subs.sink = this.formFollowUpService.getStepTypeNotificationMessage(this.formId).subscribe(async (resp) => {
      if (resp && resp.length) {
        const typeNotif = resp.filter((data) => data.type === 'notification');


        if (typeNotif && typeNotif.length) {
          const notifReminder = resp.filter((data) => data.trigger_condition === 'reminder');

          if (notifReminder && notifReminder.length) {

            this.subs.sink = this.formFollowUpService.sendReminderFormProcess(data._id, this.translate.currentLang).subscribe((resp) => {
              if (resp) {

                swal.fire({
                  type: 'success',
                  title: 'Bravo',
                });
              }
            });
          } else {

            const confirmation = await this.fireDefaultNotificationReminderSwal(data);
            if (confirmation.value) {
              this.sendReminderFormProcess(data);
            }
          }
        } else {
          const confirmation = await this.fireDefaultNotificationReminderSwal(data);
          if (confirmation.value) {
            this.sendReminderFormProcess(data);
          }
        }
        this.isWaitingForResponse = false;
      } else {
        const confirmation = await this.fireDefaultNotificationReminderSwal(data);
        if (confirmation.value) {
          this.sendReminderFormProcess(data);
        }
        this.isWaitingForResponse = false;
      }
    });
  }

  async fireDefaultNotificationReminderSwal(data) {
    if (!data) return;
    let timeDisabled = 2;
    return await swal.fire({
      title: this.translate.instant('NO_STEP_REMINDER.TITLE', {
        civility: this.translate.instant(data.user_id.civility),
        firstName: data.user_id.first_name,
        lastName: data.user_id.last_name,
      }),
      html: this.translate.instant('NO_STEP_REMINDER.HTML_TEXT', {
        templateName: this.formName,
        stepName: this.checkUserStepStatus(data),
      }),
      type: 'warning',
      showCancelButton: true,
      allowEscapeKey: true,
      confirmButtonText: this.translate.instant('NO_STEP_REMINDER.BUTTON_1', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('NO_STEP_REMINDER.BUTTON_2'),
      onOpen: () => {
        swal.disableConfirmButton();
        const confirmBtnRef = swal.getConfirmButton();
        const time = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('NO_STEP_REMINDER.BUTTON_1') + ' in ' + timeDisabled + ' sec';
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('NO_STEP_REMINDER.BUTTON_1');
          swal.enableConfirmButton();
          clearInterval(time);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    });
  }

  sendReminderFormProcess(data) {
    if (!data) return;
    this.isWaitingForResponse = true;
    this.subs.sink = this.formFollowUpService.sendReminderFormProcess(data._id, this.translate.currentLang).subscribe((resp) => {
      if (resp) {

        swal.fire({
          type: 'success',
          title: 'Bravo',
        });
      }
      this.isWaitingForResponse = false;
    });
  }

  checkUserStepStatus(data) {
    let listStep = `<br>`;
    data.steps.forEach((element, index) => {
      if (element.step_status !== 'accept') {
        listStep += `-` + element.step_title;
      }
    });

    return listStep;
  }

  leaveDetails() {
    this.router.navigate(['form-follow-up']);
  }

  ngOnDestroy(): void {
    // this.pageTitleService.setFormFollowUp(null);
    this.pageTitleService.setIcon('');
    this.pageTitleService.setTitle('');
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }

  translateDate(date) {
    return this.parseUTCtoLocal.transform(date);
    // return moment(trnslateDate).format('DD/MM/YYYY hh:mm');
  }

  toUppercase(data) {
    if(data) {
      return data.toUpperCase();
    }
  }

}
