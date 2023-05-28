import { Component, OnInit, ViewChild, OnDestroy, AfterViewChecked, AfterViewInit } from '@angular/core';
import { RNCPTitlesService } from '../../../service/rncpTitles/rncp-titles.service';
import { DateAdapter } from '@angular/material/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import { TestService } from '../../../service/test/test.service';
import * as _ from 'lodash';
import { UntypedFormControl } from '@angular/forms';
import * as moment from 'moment';
import { Test } from '../../../models/test.model';
import { Router, ActivatedRoute } from '@angular/router';
import swal from 'sweetalert2';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { MatSort, MatSortable, Sort } from '@angular/material/sort';
import { TestCreationService } from '../../../service/test/test-creation.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { DatePipe } from '@angular/common';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { environment } from 'environments/environment';
import { GlobalErrorService } from 'app/service/global-error-service/global-error-service.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-fifth-step',
  templateUrl: './fifth-step.component.html',
  styleUrls: ['./fifth-step.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseLocalToUtcPipe],
})
export class FifthStepComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  test = new Test();
  dataSource = new MatTableDataSource([]);
  datePipe: DatePipe;
  dataArray = [];
  userType;
  expanded = false;
  titleId;
  testId;
  classId;
  taskList = [];
  userTypes = [];
  schoolList = [];
  payload;
  taskData;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  displayedColumns: string[] = ['school.short_name', 'due_date', 'user_selection', 'description'];
  filterColumns: string[] = ['schoolFilter', 'dateFilter', 'userFilter', 'descriptionFilter'];
  schoolFilter = new UntypedFormControl('');
  dueDateFilter = new UntypedFormControl('');
  assignedToFilter = new UntypedFormControl('');
  taskFilter = new UntypedFormControl('');
  filterValues = {
    school: '',
    date: '',
    user: '',
    description: '',
  };
  isWaitingForResponse = false;
  constructor(
    private testService: TestService,
    private router: Router,
    private translate: TranslateService,
    private testCreationService: TestCreationService,
    private authService: AuthService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private parseLocalToUtc: ParseLocalToUtcPipe,
    private route: ActivatedRoute,
    private globalErrorService: GlobalErrorService,
    private rncpTitlesService: RNCPTitlesService,
    private dateAdapter: DateAdapter<Date>
  ) {}

  // ngAfterViewInit() {
  //   this.dataSource.sort = this.sort;
  // }
  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.subs.sink = this.route.parent.paramMap.subscribe((params) => {
      this.titleId = params.get('titleId') ? params.get('titleId') : '';
      this.testId = params.get('testId') ? params.get('testId') : '';
      this.classId = params.get('classId') ? params.get('classId') : '';
    });

    this.subs.sink = this.testCreationService.getAllUserType().subscribe((response) => {
      this.userTypes = response;
      this.subs.sink = this.testCreationService.testCreationData$.subscribe((res) => {
        if (res && res._id) {
          this.subs.sink = this.rncpTitlesService.getSchoolListByClass(res.parent_rncp_title, res.class_id).subscribe((result) => {
            if (result) {
              result = _.cloneDeep(_.filter(result, (school) => school && school._id && school.short_name));
              this.schoolList = _.uniqBy(result, '_id');


              const payload = this.createPayload(res);
              this.isWaitingForResponse = true;
              this.subs.sink = this.testCreationService.generateTasks(payload).subscribe((taskResponse) => {
                if (taskResponse && taskResponse.data && taskResponse.data.GenerateTasks && taskResponse.data.GenerateTasks.length) {
                  this.taskData = _.cloneDeep(taskResponse.data.GenerateTasks);
                  this.formatTasks(taskResponse.data.GenerateTasks);
                  this.dataSource.data = this.taskList;

                  this.dataSource.filterPredicate = this.tableFilter();
                  this.dataSource.sortingDataAccessor = (item, property) => {
                    switch (property) {
                      case 'school.short_name':
                        return item.school.short_name.toLowerCase();
                      case 'due_date':
                        return this.getTranslatedDateInDate(item.due_date);
                      case 'user_selection':
                        return item.user_selection && item.user_selection.user_id
                          ? item.user_selection.user_id.last_name.toLowerCase()
                          : this.translate.instant(item.user_selection.user_type_id.name).toLowerCase();
                      case 'description':
                        return this.getTaskTranslation(item.description).toLowerCase();
                      default:
                        return item[property];
                    }
                  };
                  this.dataSource.sort = this.sort;
                  this.dataSource.paginator = this.paginator;
                  this.isWaitingForResponse = false;
                } else if (
                  taskResponse &&
                  taskResponse.errors &&
                  taskResponse.errors[0] &&
                  taskResponse.errors[0].message
                ) {
                  this.isWaitingForResponse = false;
                  let errMsg = taskResponse.errors[0].message;
                  if (errMsg === 'Cannot Get School For Current Test') {
                    errMsg = this.translate.instant('TEST.TESTCREATE_SPECIALIZATION.text');
                  }
                  Swal.fire({
                    type: 'error',
                    title: this.translate.instant('TEST.TESTCREATE_SPECIALIZATION.title'),
                    text: errMsg,
                    confirmButtonText: this.translate.instant('TEST.TESTCREATE_SPECIALIZATION.confirm_btn')
                  })
                }
                this.isWaitingForResponse = false
              }, err => this.isWaitingForResponse = false);
            } else {
              this.isWaitingForResponse = false
              this.schoolList = [];
            }
          });
        }
      });
      this.filterListener();
    });

    this.subs.sink = this.testCreationService.updateTestPreviousData$.subscribe((data) => {

      if (data === 'fifth') {
        this.goToStep('fourth');
      }
    });

    this.subs.sink = this.testCreationService.updateTestPublishData$.subscribe((data) => {

      if (data === 'fifth') {
        this.publishTask();
      }
    });

    // Caught error from global error handler
    this.subs.sink = this.globalErrorService.globalErrorData$.subscribe(isError => {
      if (isError) {
        this.isWaitingForResponse = false;
        this.globalErrorService.setGlobalError(false);
      }
    })
  }

  ngOnDestroy() {
    this.testCreationService.removePreviousButton();
    this.testCreationService.removePublishButton();
    this.subs.unsubscribe();
  }

  filterListener() {
    this.subs.sink = this.schoolFilter.valueChanges.subscribe((school) => {
      this.filterValues.school = school;
      this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.subs.sink = this.dueDateFilter.valueChanges.subscribe((date) => {
      if (date && typeof date === 'object') {
        this.filterValues.date = moment(date).format('DD/MM/YYYY');
        this.dataSource.filter = JSON.stringify(this.filterValues);
      } else if (date === '') {

        this.filterValues.date = '';
        this.dataSource.filter = JSON.stringify(this.filterValues);
      }
    });
    this.subs.sink = this.assignedToFilter.valueChanges.subscribe((user) => {
      this.filterValues.user = user;
      this.dataSource.filter = JSON.stringify(this.filterValues);
    });
    this.subs.sink = this.taskFilter.valueChanges.subscribe((description) => {
      this.filterValues.description = description;
      this.dataSource.filter = JSON.stringify(this.filterValues);
    });
  }

  tableFilter(): (data: any, filter: string) => boolean {
    const self = this;
    let filterFunction = function (data, filter): boolean {
      let searchString = JSON.parse(filter);

      const schoolFound = data.school.short_name.toString().trim().toLowerCase().indexOf(
        searchString.school && searchString.school.toLowerCase() ? searchString.school.toLowerCase() : ''
      ) !== -1;

      const dateFound =
        self.getTranslatedDate(data.due_date).toString().trim().toLowerCase().indexOf(searchString.date.toString().trim().toLowerCase()) !==
        -1;

      const userFound =
        data.user_selection && data.user_selection.user_id
          ? (data.user_selection.user_id.last_name.toLowerCase() + ' ' + data.user_selection.user_id.first_name.toLowerCase()).indexOf(searchString.user.toLowerCase()) !== -1
          : self.translate.instant(data.user_selection.user_type_id.name).toLowerCase().indexOf(searchString.user.toLowerCase()) !== -1;

      const taskFound = self.getTaskTranslation(data.description).toString().trim().toLowerCase().indexOf(searchString.description.toLowerCase()) !== -1;

      self.paginator.pageIndex = 0;
      return schoolFound && dateFound && userFound && taskFound;
    };
    return filterFunction;
  }

  createPayload(res) {
    const testId = res._id;
    const response = this.testCreationService.getCleanTestCreationData();


    // get school list to populate the schools
    const schools = [];
    if (response && response.date_type === 'different' && response.schools && response.schools.length) {
      response.schools.forEach((school) => {

        const temp = {
          school_id: {
            _id : school.school_id,
            short_name : this.getSchoolName(school.school_id)
          },
          test_date: {
            date: school.test_date.date_utc,
            time: school.test_date.time_utc
          },
        };
        if (temp) {
          schools.push(temp);
        }
      });
    }

    // get expected document user type name for payload
    const expected_documents = [];
    if (response && response.expected_documents && response.expected_documents.length) {
      response.expected_documents.forEach((document) => {
        if (document && document.document_user_type) {
          const temp = {
            _id: document._id,
            document_name: document.document_name,
            document_user_type: {
              _id: document.document_user_type,
              name: this.getUserType(document.document_user_type),
            },
            deadline_date: document.deadline_date,
            is_for_all_student: document.is_for_all_student ? document.is_for_all_student : false,
            is_for_all_group: document.is_for_all_group ? document.is_for_all_group : false
          };

          if (temp && temp.deadline_date.type === 'relative') {
            delete temp.deadline_date.deadline;
          } else {
            delete temp.deadline_date.before;
            delete temp.deadline_date.day;
          }
          if (temp) {
            expected_documents.push(temp);
          }
        }
      });
    }

    // get task data formatted
    const tasks = [];
    if (res && res.calendar && res.calendar.steps && res.calendar.steps.length) {
      res.calendar.steps.forEach((task) => {

        if (task && task.task_type && task.task_type !== 'document_expected') {
          const temp = {
            type: task.task_type,
            start_after: task.start_after,
            // type: task.text,
            description: task.text,
            date: {
              type: task.date.type,
              before: task.date.before,
              days: task.date.day,
              value: task.date.value,
            },
            sender: task.sender,
            actor: {
              _id: task.actor,
              name: this.getUserType(task.actor),
            },
            actor_type: 'user',
            created_by: this.authService.getLocalStorageUser()._id,
          };
          if (temp && temp.date.type === 'relative') {
            delete temp.date.value;
          } else {
            delete temp.date.before;
            delete temp.date.days;
          }
          if (temp && !temp.start_after) {
            delete temp.start_after;
          }
          if (temp) {
            tasks.push(temp);
          }
        }
      });
    }

    this.payload = {
      host: environment.apiUrl,
      // host: 'https://api.v2.zetta-demo.space/graphql',
      test: {
        _id: testId,
        name: response.name,
        correction_type: response.correction_type,
        date_type: response.date_type,
        date: response.date,
        group_test: response.group_test,
        block_of_expertise_id: response.block_of_competence_condition_id,
        subject_id: response.subject_id,
        subject_test_id: response.evaluation_id,
        expected_documents: expected_documents,
        class: response.class_id,
        parent_rncp_title: response.parent_rncp_title,
        schools: schools,
        multiple_dates: response.multiple_dates,
        created_by: this.authService.getLocalStorageUser()._id,
        type: response.type
      },
      tasks: tasks,
    };

    if (schools && !schools.length) {
      delete this.payload.test.schools;
    }



    return this.payload;
  }

  getSchoolName(schoolId: string) {
    const temp = _.find(this.schoolList, (school) => {return school._id === schoolId});
    if (temp && temp.short_name) {
      return temp.short_name;
    } else {
      return ''
    }
  }

  formatTasks(data: any) {
    if (data && data.length) {
      const reformatedSchool = data.map(task => {
        return task.school;
      });

      this.testCreationService.setSchoolData(reformatedSchool);
      data.forEach((data_per_school) => {
        if (data_per_school && data_per_school.tasks && data_per_school.tasks.length) {
          data_per_school.tasks.forEach((task) => {
            this.recursiveFunction(task);
          });
        }
      });
    } else {
      this.testCreationService.setSchoolData([]);
    }
  }

  recursiveFunction(data: any) {
    if (data && !data.is_parent_task) {
      const temp = _.cloneDeep(data);
      if (temp.type !== 'calendar_step') {
        temp.description = temp.type;
      }
      delete temp.child_tasks;
      delete temp.next_tasks;
      this.taskList.push(temp);
    }
    if (data && data.child_tasks && data.child_tasks.length) {
      data.child_tasks.forEach((child_task) => {
        this.recursiveFunction(child_task);
      });
    }
    if (data && data.next_tasks && data.next_tasks.length) {
      data.next_tasks.forEach((next_task) => {
        this.recursiveFunction(next_task);
      });
    }
  }

  getUserType(_id: string) {
    const result = _.find(this.userTypes, (userType) => userType._id === _id);

    return result.name;
  }

  expand(event: boolean) {
    this.expanded = event;
  }

  goToPreviousStep() {
    // this.testService.updateTest(this.test);
    const url = '/create-test/fourth';
    this.router.navigateByUrl(url);
  }

  getTranslatedDate(dateRaw) {
    if (dateRaw && dateRaw.date && dateRaw.time) {
      return this.parseUTCtoLocal.transformDate(dateRaw.date, dateRaw.time);
    } else {
      return '';
    }
  }

  getTranslatedDateInDate(dateRaw) {
    if (dateRaw && dateRaw.date && dateRaw.time) {
      return this.parseUTCtoLocal.transformDateInDateFormat(dateRaw.date, dateRaw.time);
    } else {
      return '';
    }
  }

  getTranslateDateToUTC(dateRaw) {
    if (dateRaw && dateRaw.date && dateRaw.time) {
      return this.parseLocalToUtc.transformDate(dateRaw.date, dateRaw.time);
    } else {
      return '';
    }
  }

  submitTest() {
    const testname = this.test.name;
    this.testService.updateTest(this.test);
    this.subs.sink = this.testService.submitTest().subscribe(
      function (status) {
        if (status) {
          swal
            .fire({
              title: this.translate.instant('CONGRATULATIONS'),
              allowEscapeKey: true,
              text: this.translate.instant('TEST.MESSAGES.TESTCREATIONSUCCESS', {
                value: testname,
              }), // 'Vous venez de créer l\'épreuve',
              type: 'success',
              allowOutsideClick: false,
            })
            .then(() => {
              this.router.navigate(['/rncpTitles']);
            });
        } else {
          swal.fire({
            title: 'Attention',
            text: this.translate.instant('TEST.ERRORS.TESTCREATIONERROR'),
            allowEscapeKey: true,
            type: 'warning',
            allowOutsideClick: false,
            confirmButtonText : this.translate.instant('OK'),
          });
        }
      }.bind(this),
    );
  }

  getAssignedTo(userType) {
    if (userType) {
      const value = this.translate.instant('ADMTCSTAFFKEY.' + userType.toUpperCase());
      return value !== 'ADMTCSTAFFKEY.' + userType.toUpperCase() ? value : userType;
    }
  }

  getTranslateWhat(name, task?: any) {
    if (task) {
      if (task.type.toLowerCase() === 'employabilitysurveyforstudent') {
        const dueDate = new Date(task.dueDate);
        const dateString = dueDate.getDate() + '/' + (dueDate.getMonth() + 1) + '/' + dueDate.getFullYear();
        if (this.translate.currentLang.toLowerCase() === 'en') {
          return 'Employability Survey to complete before ' + dateString;
        } else {
          return "Enquête d'employabilité à completer avant le " + dateString;
        }
      } else if (
        task.type.toLowerCase() === 'admtcjurydecision' ||
        task.type === 'retakeAssignCorrector' ||
        task.type === 'validateTestCorrectionForFinalRetake' ||
        task.type === 'finalRetakeMarksEntry'
      ) {
        let value = this.translate.instant('TEST.AUTOTASK.' + name.toUpperCase());
        value = value !== 'TEST.AUTOTASK.' + name.toUpperCase() ? value : name;
        if (task.classId) {
          value = value + ' - ' + task.classId.name + ' - ' + task.school.shortName;
        } else {
          value = value + ' - ' + task.school.shortName;
        }

        return value;
      } else if (
        task.type === 'documentsExpected' ||
        task.type === 'reuploadExpectedDocument' ||
        task.type === 'uploadFinalRetakeDocument'
      ) {
        if (task.type === 'uploadFinalRetakeDocument') {
          return (
            this.translate.instant('UPLOAD') +
            ' ' +
            task.description +
            ' ' +
            this.translate.instant('DASHBOARD.EXPECTED_DOC_TASK.FOR_FINAL_RETAKE')
          );
        } else {
          return this.translate.instant('UPLOAD') + ' ' + task.description;
        }
      }
    }

    if (task && task.type === 'validateProblematicTask') {
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
    } else if (task && task.type && task.type.toLowerCase() === 'validatecrosscorrection') {
      if (task.crossCorrectionFor) {
        const nameCivility =
          this.testService.computeCivility(task.crossCorrectionFor.sex, this.translate.currentLang.toUpperCase()) +
          ' ' +
          task.crossCorrectionFor.lastName;
        const schoolWithCorrector = ' ' + task.crossCorrectionFor.entity.school.shortName + ' ' + nameCivility;
        const value = this.translate.instant('TEST.AUTOTASK.' + 'validatecrosscorrection'.toUpperCase()) + ' ' + schoolWithCorrector;
        return value;
      } else if (name) {
        const value = this.translate.instant('TEST.AUTOTASK.' + name.toUpperCase());
        return value !== 'TEST.AUTOTASK.' + name.toUpperCase() ? value : name;
      }
    } else if (
      task &&
      task.type &&
      (task.type.toLowerCase() === 'assigncorrectorforcertadmin' ||
        task.type.toLowerCase() === 'certifiermarksentry' ||
        task.type.toLowerCase() === 'certifiervalidation')
    ) {
      if (task.school) {
        const value = this.translate.instant('TEST.AUTOTASK.' + name.toUpperCase()) + ' - ' + task.school.shortName;
        return value;
      } else if (name) {
        const value = this.translate.instant('TEST.AUTOTASK.' + name.toUpperCase());
        return value !== 'TEST.AUTOTASK.' + name.toUpperCase() ? value : name;
      }
    } else if (name) {
      const value = this.translate.instant('TEST.AUTOTASK.' + name.toUpperCase());
      return value !== 'TEST.AUTOTASK.' + name.toUpperCase() ? value : name;
    } else {
      return '';
    }
  }

  getTranslateENTITY(name) {
    let value = this.translate.instant('SETTINGS.USERTYPES.ENTITYNAME.' + name.toUpperCase());
    return value !== 'SETTINGS.USERTYPES.ENTITYNAME.' + name.toUpperCase() ? value : name;
  }

  dataFormatting(data: any) {
    let date;
    if (data.date.type === 'fixed') {
      date = moment(data.date.value).format('YYYY-MM-DD');
    } else {
      date = moment(new Date()).format('YYYY-MM-DD');
    }
    let result = {
      school: {
        shortName: 'Test',
      },
      due_date: date,
      assigned_to: {
        name: '',
        entity: '',
        _id: '',
      },
      description: data.text,
    };

    this.subs.sink = this.testCreationService.getOneUserTypes(data.actor).subscribe((resp) => {
      this.userType = resp;
      result.assigned_to['_id'] = resp._id;
      result.assigned_to['entity'] = resp.entity;
      result.assigned_to['name'] = resp.name;


      this.dataArray.push(result);


      this.dataSource.data = this.dataArray;
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    });
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

  goToStep(selectedStep: string) {
    this.subs.sink = this.route.parent.paramMap.subscribe((params) => {
      const titleId = params.get('titleId');
      const categoryId = params.get('categoryId');
      const testId = params.get('testId');
      this.router.navigate(['/create-test', titleId, { categoryId: categoryId, testId: testId }, selectedStep]);
    });
  }

  createBatchTaskPayload() {
    const temp = _.cloneDeep(this.taskData)
    if (temp && temp.length) {
      temp.forEach((task_per_school) => {
        // Make school from object to string ID
        if (task_per_school && task_per_school.school && task_per_school.school._id) {
          task_per_school.school = task_per_school.school._id;
        }
        if (task_per_school && task_per_school.tasks && task_per_school.tasks.length) {
          task_per_school.tasks.forEach((task) => {
            this.recursiveTaskPayload(task);
          });
        }
      });
    }
    return temp;
  }

  recursiveTaskPayload(data: any) {
    // Make user_type_id from object to string ID
    if (data.user_selection && data.user_selection.user_type_id && data.user_selection.user_type_id._id) {
      data.user_selection.user_type_id = data.user_selection.user_type_id._id;
    }

    // Make user_id from object to string ID, if there is no user_id a.k.a null. then delete the user_id field so it wont send to BE
    if (data.user_selection && data.user_selection.user_id && data.user_selection.user_id._id) {
      data.user_selection.user_id = data.user_selection.user_id._id;
    } else {
      delete data.user_selection.user_id;
    }

    // Make school from object to string ID
    if (data.school && data.school._id) {
      data.school = data.school._id;
    }

    // make student id from object to string
    if (data.student_id && data.student_id._id) {
      data.student_id = data.student_id._id;
    }

    // Go into child_task if it has a child task and do this function
    if (data && data.child_tasks && data.child_tasks.length) {
      data.child_tasks.forEach((child_task) => {
        this.recursiveTaskPayload(child_task);
      });
    }

    // Go into child_task if it has a next task and do this function
    if (data && data.next_tasks && data.next_tasks.length) {
      data.next_tasks.forEach((next_task) => {
        this.recursiveTaskPayload(next_task);
      });
    }
  }

  publishTask() {
    // Send task first
    const payload = this.createBatchTaskPayload();

    let timeDisabledinSec = 6;
    swal.fire({
      type: 'warning',
      title: this.translate.instant('TEST.TESTCREATE_S1.TITLE'),
      html: this.translate.instant('TEST.TESTCREATE_S1.TEXT'),
      confirmButtonText: this.translate.instant('TEST.TESTCREATE_S1.CONFIRM'),
      showCancelButton: true,
      allowOutsideClick: false,
      cancelButtonText: this.translate.instant('TEST.TESTCREATE_S1.CANCEL'),
      onOpen: () => {
        swal.disableConfirmButton();
        const confirmButtonRef = swal.getConfirmButton();

        // TimerLoop for derementing timeDisabledinSec
        const intervalVar = setInterval(() => {
          timeDisabledinSec -= 1;
          confirmButtonRef.innerText = this.translate.instant('TEST.TESTCREATE_S1.CONFIRM') + `(${timeDisabledinSec})`;
        }, 1000);
        const timeoutVar = setTimeout(() => {
          confirmButtonRef.innerText = this.translate.instant('TEST.TESTCREATE_S1.CONFIRM'),
          swal.enableConfirmButton();
          clearInterval(intervalVar);
          clearTimeout(timeoutVar);
        }, timeDisabledinSec * 1000);
      },
    }).then((result => {
      // *************** If user click confirm then result.value will be true
      if (result.value) {
        this.isWaitingForResponse = true;
        this.subs.sink = this.testCreationService.createBatchTask(payload).subscribe((response) => {
          this.isWaitingForResponse = false;
          if (response) {
            this.testCreationService.removePublishButton();
            const payload = this.testCreationService.getCleanTestCreationData();
            if (payload.corrector_assigned && !payload.corrector_assigned.length) {
              delete payload.corrector_assigned;
            }
            payload.is_published = true;
            this.isWaitingForResponse = true;
            this.subs.sink = this.testCreationService.updateTest(this.testId, payload).subscribe((resp) => {

              this.isWaitingForResponse = false;
              if (resp) {
                swal
                  .fire({
                    type: 'success',
                    title: this.translate.instant('PUBLISH_TEST_SUCCESS.TITLE'),
                    text: this.translate.instant('PUBLISH_TEST_SUCCESS.TEXT'),
                    allowOutsideClick: false,
                    confirmButtonText : this.translate.instant('OK'),
                  })
                  .then(() => {
                    this.goToDashBoard();
                  });
              }
            });
          }
        });
      }
    }))
  }

  resetAllFilter() {
    this.filterValues = {
      school: '',
      date: '',
      user: '',
      description: '',
    };
    this.sort.direction = '';
    this.sort.active = '';
    this.sort.sort({id: '', start: 'asc', disableClear: false});

    this.schoolFilter.patchValue('');
    this.dueDateFilter.patchValue('');
    this.assignedToFilter.patchValue('');
    this.taskFilter.patchValue('');

    this.paginator.firstPage();
  }

  resetDate() {
    this.filterValues.date = '';
    this.dueDateFilter.patchValue('');

    this.paginator.firstPage();
  }

  goToDashBoard() {
    this.testCreationService.setTestCreationData(this.testCreationService.getSavedTestCreationDataWithoutSubscribe());
    if (this.titleId) {
      this.router.navigate(['/rncpTitles', this.titleId, 'dashboard']);
    }
  }

  sortData(sort: Sort) {
    this.paginator.pageIndex = 0;

    // switch (sort.active) {
    //   case 'school':
    //     this.sortBySchool(sort.direction);
    //     break;
    //   case 'due_date':
    //     this.sortByDate(sort.direction);
    //     break;
    //   case 'user_selection':
    //     this.sortByUser(sort.direction);
    //     break;
    //   case 'description':
    //     this.sortByTask(sort.direction);
    //     break;
    // }
  }
}
