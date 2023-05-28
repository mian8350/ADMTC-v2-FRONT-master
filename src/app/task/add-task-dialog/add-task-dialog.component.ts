import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl, UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormArray } from '@angular/forms';
import Swal from 'sweetalert2';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { UserService } from 'app/service/user/user.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { SubSink } from 'subsink';
import { AuthService } from 'app/service/auth-service/auth.service';
import * as _ from 'lodash';
import { NgxPermissionsService } from 'ngx-permissions';
import { PermissionService } from 'app/service/permission/permission.service';
import { debounceTime, map, startWith } from 'rxjs/operators';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import * as moment from 'moment';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { DateAdapter } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { UsersService } from 'app/service/users/users.service';
import { treemapSquarify } from 'd3';
import { Observable } from 'rxjs';

@Component({
  selector: 'ms-add-task-dialog',
  templateUrl: './add-task-dialog.component.html',
  styleUrls: ['./add-task-dialog.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class AddTaskDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  toggleValue = false;
  internalTaskToggle = false;
  selfReminderToggle = false;
  form: UntypedFormGroup;
  documents: UntypedFormArray;
  users = [];
  internalChecked;
  private timeOutVal: any;
  isWaitingForResponse = false;
  isUserCertifierAdmin = false;
  isUserCertifierDir = false;
  currentUser: any;
  listUser: any;
  titleList: any;
  originalTitleList: any;
  isCRDir = false;
  isCRAdmin = false;
  rncpTitles: any;
  userTypesList: any;
  userList: any;
  userRecipientList: any;
  rncpTitlesList: any;
  originalUserTypesList: any;
  originalUserList: any;
  originalRncpTitlesList: any;
  isPermission: any;
  selectedTitleId: string[] = [];
  selectedUserTypeId: string[] = [];
  titleReady = false;
  userReady = false;
  userTypeReady = false;
  checked;
  today = new Date();
  taskData: any;
  isADMTC = false;

  classes;
  originalClassList;

  schoolCtrl = new UntypedFormControl(null);
  schoolList = [];
  schoolFiltered: Observable<any[]>;
  isAcademicDirector: boolean;
  schoolSelectedId: any;
  userNotFound: boolean = false;

  constructor(
    private fb: UntypedFormBuilder,
    private dialogRef: MatDialogRef<AddTaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: { taskData: any; type: string },
    private translate: TranslateService,
    private userService: UserService,
    private usersService: UsersService,
    private utilService: UtilityService,
    private auth: AuthService,
    private permission: NgxPermissionsService,
    public permissionService: PermissionService,
    private rncpTitleService: RNCPTitlesService,
    private parseLocaltoUTC: ParseLocalToUtcPipe,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private dateAdapter: DateAdapter<Date>,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });

    this.isPermission = this.auth.getPermission();
    this.isADMTC = this.utilService.isUserEntityADMTC();
    this.isCRAdmin = !!this.permission.getPermission('Certifier Admin');
    this.isCRDir = !!this.permission.getPermission('CR School Director');
    this.currentUser = this.auth.getLocalStorageUser();
    this.isUserCertifierAdmin = this.utilService.isCertifierAdmin();
    this.isUserCertifierDir = this.utilService.isCertifierDirector();
    this.initializeForm();
    this.getTitleRNCP();
    this.getUserTypeList();
    if (this.parentData.type === 'edit') {
      this.taskData = _.cloneDeep(this.parentData.taskData);
      this.getDataTask(_.cloneDeep(this.parentData.taskData));
    }

    this.initFilter();
  }

  initFilter() {
    this.schoolFiltered = this.schoolCtrl.valueChanges.pipe(
      startWith(''),
      map((searchTxt) =>
        searchTxt ? this.schoolList.filter((option) => option.short_name.toLowerCase().includes(searchTxt.toLowerCase())) : this.schoolList,
      ),
    );
  }

  initializeForm() {
    this.form = this.fb.group({
      internalTask: [this.internalTaskToggle, Validators.required],
      rncpTitle: ['', Validators.required],
      categoryChecked: [false, Validators.required],
      users: ['', Validators.required],
      class_id: ['', Validators.required],
      userTypes: [''],
      priority: ['1', Validators.required],
      date: ['', Validators.required],
      description: ['', Validators.required],
      originalRncpTitle: [''],
      originalClass: [''],
      originalUserTypes: [''],
      originalUser: [''],
      documents: this.fb.array([]),
      is_self_reminder_task: [false],
    });
  }

  getDataTask(task) {

    if (task) {
      const taskData = {
        internalTask: false,
        rncpTitle: task.rncp.short_name,
        categoryChecked: false,
        users: task.user_selection.user_id ? task.user_selection.user_id.first_name + ' ' + task.user_selection.user_id.last_name : '',
        userTypes: task.user_selection.user_type_id ? task.user_selection.user_type_id.name : '',
        priority: task.priority ? task.priority.toString() : '',
        date: task.due_date
          ? this.parseStringDatePipe.transformStringToDate(this.parseUTCToLocalPipe.transformDate(task.due_date.date, task.due_date.time))
          : '',
        description: task.description,
        documents: task.expected_document ? task.expected_document : [],
        originalRncpTitle: task.rncp._id,
        originalUserTypes: task.user_selection.user_type_id ? task.user_selection.user_type_id._id : '',
        originalUser: task.user_selection.user_id ? task.user_selection.user_id._id : '',
        is_self_reminder_task: task.is_self_reminder_task ? task.is_self_reminder_task : false,
      };
      if (taskData.userTypes) {
        taskData.categoryChecked = true;
      }
      if (taskData.originalRncpTitle) {
        this.selectedTitle(taskData.originalRncpTitle);
      }
      if (taskData.originalUser) {
        this.selectedUser(this.parentData.taskData.user_selection.user_id, true);
      }
      if (taskData.originalUserTypes) {
        this.selectedUserType(taskData.originalUserTypes);
      }
      this.form.patchValue(taskData);

    }
  }

  categoryChange(event) {
    if (event.checked) {

      this.form.get('users').patchValue(null);
      this.form.get('users').updateValueAndValidity();
      this.form.get('users').clearValidators();
      this.form.get('users').updateValueAndValidity();
      this.form.get('userTypes').setValidators([Validators.required]);
      this.form.get('userTypes').updateValueAndValidity();
    } else {

      this.form.get('userTypes').patchValue(null);
      this.form.get('userTypes').updateValueAndValidity();
      this.form.get('userTypes').clearValidators();
      this.form.get('userTypes').updateValueAndValidity();
      this.form.get('users').setValidators([Validators.required]);
      this.form.get('users').updateValueAndValidity();
    }

  }

  getTitleRNCP() {

    if (this.utilService.isUserCRDirAdmin() || this.utilService.isUserAcadDirAdmin()) {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.subs.sink = this.auth.getUserById(this.currentUser._id).subscribe((res) => {
        const dataUSer = res.entities.filter((ent) => ent.type.name === userType);
        const titles = this.utilService.getAllAssignedTitles(dataUSer);
        const uniqueTitles = _.uniqBy(titles, '_id');


        this.rncpTitlesList = uniqueTitles;
        this.originalRncpTitlesList = uniqueTitles;
      });
    } else {
      const search = '';
      this.rncpTitleService.getRncpTitlesForUrgent(search).subscribe((resp) => {
        this.rncpTitlesList = resp;
        this.originalRncpTitlesList = resp;
      });
    }

    // this.subs.sink = this.form
    //   .get('rncpTitle')
    //   .valueChanges.pipe(debounceTime(400))
    //   .subscribe((searchString) => {
    //     if (searchString) {
    //       this.rncpTitleService.getRncpTitlesForUrgent(searchString.toLowerCase()).subscribe((respp) => {
    //         this.rncpTitlesList = respp;
    //         this.originalRncpTitlesList = respp;
    //       });
    //     }
    //   });
  }

  getUserTypeList() {
    if (this.utilService.isUserCRDirAdmin() || this.utilService.isUserAcadDirAdmin()) {
      const role = this.utilService.isUserCRDirAdmin() ? 'certifier' : 'preparation_center';
      this.subs.sink = this.userService.getAllUserTypeNonOpEntity(role).subscribe((userTypes) => {
        this.userTypesList = userTypes;
        this.originalUserTypesList = userTypes;
        // Add manual for type student if certifier
        if (this.utilService.isUserCRDirAdmin()) {
          const student = {
            _id: '5a067bba1c0217218c75f8ab',
            name: 'Student',
          };
          this.userTypesList.push(student);
          this.originalUserTypesList.push(student);

          this.userTypesList = _.uniqBy(this.userTypesList, '_id');
          this.originalUserTypesList = _.uniqBy(this.originalUserTypesList, '_id');
        }

        this.subs.sink = this.form
          .get('userTypes')
          .valueChanges.pipe(debounceTime(400))
          .subscribe((searchString) => {
            if (searchString) {
              this.userTypesList = this.originalUserTypesList.filter((com) =>
                this.translate
                  .instant('USER_TYPES.' + com.name)
                  .toLowerCase()
                  .trim()
                  .includes(searchString && searchString.length ? searchString.toLowerCase() : ''),
              );
            } else {
              this.userTypesList = this.originalUserTypesList;
            }
          });
      });
    } else {
      this.subs.sink = this.userService.getUserTypesAddTasks().subscribe((userTypes) => {
        this.userTypesList = userTypes;


        this.originalUserTypesList = userTypes;
        this.subs.sink = this.form
          .get('userTypes')
          .valueChanges.pipe(debounceTime(400))
          .subscribe((searchString) => {
            if (searchString) {
              this.userTypesList = this.originalUserTypesList.filter((com) =>
                this.translate
                  .instant('USER_TYPES.' + com.name)
                  .toLowerCase()
                  .trim()
                  .includes(searchString && searchString.length ? searchString.toLowerCase() : ''),
              );
            }
          });
      });
    }
  }

  getClassList(titleId) {
    this.subs.sink = this.rncpTitleService.getClassOfTitle(titleId).subscribe((resp) => {
      let temp = _.cloneDeep(resp);

      if (this.utilService.isUserAcadDirAdmin()) {
        const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
        this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((respp) => {
          const academicUser = respp.entities.filter((ent) => ent.type.name === userType);
          const classes = this.utilService.getAcademicAllAssignedClass(academicUser);

          temp = temp.filter((classData) => classes.includes(classData._id));
        });
      }

      this.classes = temp;
      this.originalClassList = temp;
    });

    this.subs.sink = this.form
      .get('class_id')
      .valueChanges.pipe(debounceTime(400))
      .subscribe((searchString) => {
        if (searchString) {
          this.classes = this.originalClassList
            ? this.originalClassList.filter((com) =>
                com.name
                  .toLowerCase()
                  .trim()
                  .includes(searchString && searchString.length ? searchString.toLowerCase() : ''),
              )
            : '';
        }
      });
  }

  getUserList(titleId, classId?) {
    if (this.isUserCertifierAdmin) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'Certifier Admin');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      dataUnix.forEach((login) => {
        this.subs.sink = this.userService.getUserBySchoolTitleClass(login.school._id, titleId, classId).subscribe((resp) => {
          this.listUser = _.filter(resp, function (user) {
            return _.find(user.entities, function (option) {
              const data =
                option && option.type && option.type.name
                  ? option.type.name !== 'Academic Director'
                  : '' && option && option.type && option.type.name
                  ? option.type.name !== 'Academic Admin'
                  : '' && option && option.type && option.type.name
                  ? option.type.name !== 'Certifier Admin'
                  : '' && option && option.type && option.type.name
                  ? option.type.name !== 'Academic Final Jury Member'
                  : '' && option && option.type && option.type.name
                  ? option.type.name !== 'ADMTC Admin'
                  : '' && option && option.type && option.type.name
                  ? option.type.name !== 'ADMTC Director'
                  : '';
              return data;
            });
          });
          this.userList = _.uniqBy(this.listUser, 'first_name');
          this.originalUserList = _.uniqBy(this.listUser, 'first_name');

          if (resp && resp?.length === 0) {
            this.userNotFound = true;
          } else {
            this.userNotFound = false;
          }
        });
      });
    } else if (this.isUserCertifierDir) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'CR School Director');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      dataUnix.forEach((login) => {
        this.subs.sink = this.userService.getUserBySchoolTitleClass(login.school._id, titleId, classId).subscribe((resp) => {
          this.listUser = _.filter(resp, function (user) {
            return _.find(user.entities, function (option) {
              const data =
                option && option.type && option.type.name
                  ? option.type.name !== 'Academic Director'
                  : '' && option && option.type && option.type.name
                  ? option.type.name !== 'Academic Admin'
                  : '' && option && option.type && option.type.name
                  ? option.type.name !== 'Certifier Admin'
                  : '' && option && option.type && option.type.name
                  ? option.type.name !== 'Academic Final Jury Member'
                  : '' && option && option.type && option.type.name
                  ? option.type.name !== 'ADMTC Admin'
                  : '' && option && option.type && option.type.name
                  ? option.type.name !== 'ADMTC Director'
                  : '';
              return data;
            });
          });
          this.userList = _.uniqBy(this.listUser, 'first_name');
          this.originalUserList = _.uniqBy(this.listUser, 'first_name');


          if (resp && resp?.length === 0) {
            this.userNotFound = true;
          } else {
            this.userNotFound = false;
          }
        });
      });
    } else {
      this.isAcademicDirector = true;
      this.userService.getUserAcademicByTitleId(titleId, classId).subscribe((resp) => {
        this.userList = _.cloneDeep(resp);
        this.originalUserList = _.cloneDeep(resp);
      });
    }
    this.subs.sink = this.form
      .get('users')
      .valueChanges.pipe(debounceTime(400))
      .subscribe((searchString) => {
        if (searchString) {
          this.userList = this.originalUserList
            ? this.originalUserList.filter((com) =>
                com.last_name
                  .toLowerCase()
                  .trim()
                  .includes(searchString && searchString.length ? searchString.toLowerCase() : ''),
              )
            : '';
        }
      });
  }

  getAdmtcUserList() {
    this.usersService.getAllUsersUnderADMTC().subscribe((resp) => {
      this.userList = _.cloneDeep(resp);
      this.originalUserList = _.cloneDeep(resp);
    });
  }

  filterTitleByUserType() {
    const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
    const school = this.currentUser.entities && this.currentUser.entities[0].school ? this.currentUser.entities[0].school.short_name : '';
    this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((respp) => {
      const academicUser = respp.entities.filter((ent) => ent.type.name === userType && ent.school.short_name === school);

      const titles = this.utilService.getAcademicAllAssignedTitle(academicUser);
      this.subs.sink = this.rncpTitleService.getRncpTitlesForAcademic(titles).subscribe((response) => {
        let tempp = _.cloneDeep(response);
        tempp = tempp.filter((title) => titles.includes(title._id));
        this.rncpTitles = tempp;
      });
    });
  }

  selectedTitle(selectedTitle) {
    this.userReady = false;
    this.form.get('originalRncpTitle').setValue(selectedTitle);
    this.getUserList(selectedTitle);
    this.getClassList(selectedTitle);
  }
  selectedClass(selectedClass) {
    this.userReady = false;
    this.form.get('originalClass').setValue(selectedClass);
    const selectedTitle = this.form.get('originalRncpTitle').value;
    this.getUserList(selectedTitle, selectedClass);
  }
  selectedUser(selectedUser, fromEdit?) {

    const entity = this.currentUser.entities.filter((ent) => ent.type.name === this.isPermission[0]);
    const dataUnix = _.uniqBy(entity, 'school.short_name');
    const schoolId = dataUnix && dataUnix[0] && dataUnix[0].school && dataUnix[0].school._id ? dataUnix[0].school._id : '';
    let tempSchool = [];
    if (selectedUser && selectedUser.entities && selectedUser.entities.length > 0) {
      selectedUser.entities.filter((res) => {
        if (res.type.name === 'Academic Director' || res.type.name === 'Academic Admin') {
          if (res?.school && schoolId && res?.school === schoolId) {
            tempSchool.push(res.school);
          }
        }
      });
    } else {
      tempSchool = [];
    }

    this.schoolList = _.uniqBy(tempSchool, '_id');
    this.userReady = false;
    this.form.get('originalUser').setValue(selectedUser._id);
    if (fromEdit) {
      this.selectedSchool(this.parentData.taskData.school);
      this.schoolCtrl.setValue(this.parentData.taskData.school.short_name);
    }
  }
  selectedUserType(selectedUserType) {
    this.userReady = false;
    this.form.get('originalUserTypes').setValue(selectedUserType);
    const data = [];
    data.push(this.form.get('originalRncpTitle').value);
    // if selected user type is student, call API getUserTypeStudent
    if (selectedUserType === '5a067bba1c0217218c75f8ab') {
      this.userService.getUserTypeStudent(data, selectedUserType).subscribe((resp) => {
        this.userRecipientList = resp;
      });
    } else {
      this.userService.getUserType(data, selectedUserType).subscribe((resp) => {
        this.userRecipientList = resp;
      });
    }
    this.selectedTitleId = [this.form.get('originalRncpTitle').value];
    this.selectedUserTypeId = [selectedUserType];
  }

  intenalTaskToggleChange(event) {
    this.internalTaskToggle = event.checked;
    this.form.get('users').patchValue(null, { emitEvent: false }); // reset form value
    this.userList = []; // clean the user dropdown list
    if (event.checked) {
      this.getAdmtcUserList();
      this.form.get('rncpTitle').clearValidators();
      this.form.get('rncpTitle').setErrors(null);
      this.form.get('is_self_reminder_task').patchValue(false);
    } else {
      this.form.get('rncpTitle').setValidators(Validators.required);
      if (this.form.get('rncpTitle').value && this.form.get('class_id').value) {
        this.getUserList(this.form.get('rncpTitle').value, this.form.get('class_id').value);
      }
    }
  }

  selfReminderToggleChange(event) {
    this.selfReminderToggle = event.checked;
    this.form.get('users').patchValue(null, { emitEvent: false }); // reset form value
    this.form.get('originalRncpTitle').patchValue(null);
    this.form.get('originalClass').patchValue(null);
    this.form.get('');
    this.userList = []; // clean the user dropdown list
    if (event.checked) {
      this.getAdmtcUserList();
      this.form.get('rncpTitle').patchValue(null);
      this.form.get('class_id').patchValue(null);
      this.form.get('rncpTitle').clearValidators();
      this.form.get('rncpTitle').setErrors(null);
      this.form.get('internalTask').patchValue(false);
      this.form.get('users').clearValidators();
      this.form.get('users').setErrors(null);
      this.patchTitleAndClassOfCurrentUser();
    } else {
      this.form.get('rncpTitle').setValidators(Validators.required);
      this.form.get('users').setValidators(Validators.required);
      if (this.form.get('rncpTitle').value && this.form.get('class_id').value) {
        this.getUserList(this.form.get('rncpTitle').value, this.form.get('class_id').value);
      }
    }
  }

  patchTitleAndClassOfCurrentUser() {
    const title =
      this.currentUser.entities[0] && this.currentUser.entities[0].assigned_rncp_title
        ? this.currentUser.entities[0].assigned_rncp_title._id
        : null;
    const assignedClass =
      this.currentUser.entities[0] && this.currentUser.entities[0].class ? this.currentUser.entities[0].class._id : null;

    title ? this.form.get('originalRncpTitle').patchValue(title) : null;
    assignedClass ? this.form.get('originalClass').patchValue(assignedClass) : null;
  }

  addDocument(docAdd) {
    if (docAdd) {
      this.documents = this.form.get('documents') as UntypedFormArray;
      this.documents.push(this.buildDocuments(docAdd.value));
    }
    docAdd.value = '';
  }

  buildDocuments(docName?: string) {
    return new UntypedFormGroup({
      name: new UntypedFormControl(docName ? docName : ''),
      isDocumentAssigned: new UntypedFormControl(docName ? true : false),
    });
  }

  removeDocument(i) {

    const emptyDoc = JSON.stringify(this.documents.value[i]);
    const selectedDoc = JSON.stringify(this.buildDocuments('').value);
    if (emptyDoc !== selectedDoc) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('This action will delete document expected !'),
        footer: `<span style="margin-left: auto">DASHBOARD_DELETE</span>`,
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
          this.documents = this.form.get('documents') as UntypedFormArray;
          this.documents.removeAt(i);
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('Document Expected Deleted'),
            footer: `<span style="margin-left: auto">EVENT_S1</span>`,
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        }
      });
    } else {
      this.documents = this.form.get('documents') as UntypedFormArray;
      this.documents.removeAt(i);
    }
  }

  keyupUser(event) {
    this.userReady = true;
  }
  keyupUserType(event) {
    this.userTypeReady = true;
  }
  keyupTitle(event) {
    this.titleReady = true;
  }

  valueChange(event) {
    if (event === 'title') {
      this.titleReady = false;
    } else if (event === 'user') {
      this.userReady = false;
      this.schoolList = [];
      this.schoolCtrl.setValue(null);
    } else if (event === 'type') {
      this.userTypeReady = false;
    }

  }

  createTask() {

    if (!this.internalTaskToggle && !this.selfReminderToggle && this.form.invalid) {
      Swal.fire({
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        footer: `<span style="margin-left: auto">FormSave_S1</span>`,
        allowEscapeKey: true,
        type: 'warning',
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
      });
      return;
    } else if (this.internalTaskToggle) {
      const invalid =
        this.form.get('date').invalid ||
        this.form.get('priority').invalid ||
        this.form.get('users').invalid ||
        this.form.get('description').invalid;

      if (invalid) {
        Swal.fire({
          title: this.translate.instant('FormSave_S1.TITLE'),
          html: this.translate.instant('FormSave_S1.TEXT'),
          footer: `<span style="margin-left: auto">FormSave_S1</span>`,
          allowEscapeKey: true,
          type: 'warning',
          confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
        });
        return;
      }
    } else if (this.selfReminderToggle) {
      const invalidSelf = this.form.get('date').invalid || this.form.get('priority').invalid || this.form.get('description').invalid;

      if (invalidSelf) {
        Swal.fire({
          title: this.translate.instant('FormSave_S1.TITLE'),
          html: this.translate.instant('FormSave_S1.TEXT'),
          footer: `<span style="margin-left: auto">FormSave_S1</span>`,
          allowEscapeKey: true,
          type: 'warning',
          confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
        });
        return;
      }
    }

    // internalTask: [this.internalTaskToggle, Validators.required],
    // rncpTitle: ['', Validators.required],
    // categoryChecked: [false, Validators.required],
    // users: ['', Validators.required],
    // class_id: ['',Validators.required],
    // userTypes: [''],
    // priority: ['1', Validators.required],
    // date: ['', Validators.required],
    // description: ['', Validators.required],
    // originalRncpTitle: [''],
    // originalClass: [''],
    // originalUserTypes: [''],
    // originalUser: [''],
    // documents: this.fb.array([]),
    // is_self_reminder_task: [false],
    const entity = this.currentUser.entities.filter((ent) => ent.type.name === this.isPermission[0]);
    const dataUnix = _.uniqBy(entity, 'school.short_name');
    const schoolId = dataUnix && dataUnix[0] && dataUnix[0].school && dataUnix[0].school._id ? dataUnix[0].school._id : '';
    const payload = _.cloneDeep(this.form.value);
    payload.created_by = this.currentUser._id;
    const document = this.documents ? this.documents.value : [];
    payload.document_expecteds = [];

    document.forEach((element) => {
      const dataDoc = {
        name: element.name,
      };
      payload.document_expecteds.push(dataDoc);
    });

    if (this.form.get('categoryChecked').value) {
      payload.user_selection = {
        selection_type: 'user_type',
        user_type_id: this.selectedUserTypeId[0],
      };
    } else if (this.form.get('is_self_reminder_task').value) {
      payload.user_selection = {
        selection_type: 'user',
        user_id: this.currentUser._id,
      };
    } else {
      payload.user_selection = {
        selection_type: 'user',
        user_id: this.form.get('originalUser').value,
      };
    }
    payload.created_date = {
      date: this.getCurrentUtcDate(),
      time: this.getCurrentUtcTime(),
    };
    payload.due_date = {
      date: this.getDueDate(),
      time: this.getTodayTime(),
    };
    payload.rncp = this.form.get('originalRncpTitle').value;
    payload.priority = parseInt(payload.priority);
    payload.class_id = this.form.get('originalClass').value;
    delete payload.date;
    delete payload.categoryChecked;
    delete payload.originalRncpTitle;
    delete payload.originalUserTypes;
    delete payload.originalUser;
    delete payload.rncpTitle;
    delete payload.users;
    delete payload.userTypes;
    delete payload.internalTask;
    delete payload.documents;
    delete payload.originalClass;
    delete payload.autoClass;
    delete payload.is_self_reminder_task;
    payload.school_id = this.schoolSelectedId;
    this.isWaitingForResponse = true;
    if (this.parentData.type === 'add') {
      if (schoolId !== '') {
        this.subs.sink = this.rncpTitleService.createTask(payload, schoolId).subscribe(
          (data: any) => {
            this.isWaitingForResponse = false;
            Swal.fire({
              title: this.translate.instant('TASKCREATED.TITLE'),
              html: this.translate.instant('TASKCREATED.TEXT'),
              footer: `<span style="margin-left: auto">TASKCREATED</span>`,
              allowEscapeKey: true,
              type: 'success',
              confirmButtonText: this.translate.instant('TASKCREATED.BUTTON'),
            }).then((res) => {
              this.dialogRef.close();
            });
          },
          (err) => {
            if (err['message'] === 'GraphQL error: user not found.') {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('User not Found'),
              });
            }
            this.isWaitingForResponse = false;
          },
        );
      } else {
        this.subs.sink = this.rncpTitleService.createTaskNonSchool(payload).subscribe(
          (data: any) => {
            this.isWaitingForResponse = false;
            Swal.fire({
              title: this.translate.instant('TASKCREATED.TITLE'),
              html: this.translate.instant('TASKCREATED.TEXT'),
              footer: `<span style="margin-left: auto">TASKCREATED</span>`,
              allowEscapeKey: true,
              type: 'success',
              confirmButtonText: this.translate.instant('TASKCREATED.BUTTON'),
            }).then((res) => {
              this.dialogRef.close();
            });
          },
          (err) => {
            if (err['message'] === 'GraphQL error: user not found.') {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('User not Found'),
              });
            }
            this.isWaitingForResponse = false;
          },
        );
      }
    } else {
      this.subs.sink = this.rncpTitleService.updateTask(payload, this.taskData._id).subscribe(
        (data: any) => {
          this.isWaitingForResponse = false;
          Swal.fire({
            title: this.translate.instant('TASKCREATED.TITLE'),
            html: this.translate.instant('TASKCREATED.TEXT'),
            footer: `<span style="margin-left: auto">TASKCREATED</span>`,
            allowEscapeKey: true,
            type: 'success',
            confirmButtonText: this.translate.instant('TASKCREATED.BUTTON'),
          }).then((res) => {
            this.dialogRef.close();
          });
        },
        (err) => {
          if (err['message'] === 'GraphQL error: user not found.') {
            Swal.fire({
              type: 'error',
              title: this.translate.instant('User not Found'),
            });
          }
          this.isWaitingForResponse = false;
        },
      );
    }
  }

  getDueDate() {
    // const dueDateUTC = this.parseLocaltoUTC.transformDate(moment(this.form.get('date').value).format('DD/MM/YYYY'), '00:00');
    // return dueDateUTC;
    return moment(this.form.get('date').value).format('DD/MM/YYYY');
    // const today = moment(this.form.get('date').value).format('DD/MM/YYYY');
    // return today;
  }

  getTodayTime() {
    // return this.parseLocaltoUTC.transform('00:00');
    return '15:59';
  }

  getTodayDate() {
    const todayUTC = this.parseLocaltoUTC.transformDate(moment(this.today).format('DD/MM/YYYY'), '00:00');
    return todayUTC;
    // const today = moment(this.today).format('DD/MM/YYYY');
    // return today;
  }

  getCurrentUtcDate() {
    return moment.utc().format('DD/MM/YYYY');
  }

  getCurrentUtcTime() {
    return moment.utc().format('HH:mm');
  }

  selectedSchool(school) {

    this.schoolSelectedId = school._id;
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
