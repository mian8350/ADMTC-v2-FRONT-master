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
import { debounceTime } from 'rxjs/operators';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import * as moment from 'moment';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { DateAdapter } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { UsersService } from 'app/service/users/users.service';
import { StudentsService } from 'app/service/students/students.service';
@Component({
  selector: 'ms-add-student-card-task-dialog',
  templateUrl: './add-student-card-task-dialog.component.html',
  styleUrls: ['./add-student-card-task-dialog.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class AddStudentCardTaskDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  toggleValue = false;
  internalTaskToggle = false;
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

  constructor(
    private fb: UntypedFormBuilder,
    private dialogRef: MatDialogRef<AddStudentCardTaskDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: { taskData: any; type: string; studentId: any },
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
    private studentService: StudentsService,
  ) { }

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
    // this.getTitleRNCP();
    // this.getUserTypeList();
    this.getOneStudent();
    if (this.parentData.type === 'edit') {
      this.taskData = _.cloneDeep(this.parentData.taskData);
      this.getDataTask(_.cloneDeep(this.parentData.taskData));
    }
  }

  initializeForm() {
    this.form = this.fb.group({
      internalTask: [this.internalTaskToggle, Validators.required],
      rncpTitle: ['', Validators.required],
      categoryChecked: [false, Validators.required],
      users: ['', Validators.required],
      class_id: [''],
      userTypes: [''],
      priority: ['1', Validators.required],
      date: ['', Validators.required],
      description: ['', Validators.required],
      originalRncpTitle: [''],
      originalClass: [''],
      originalUserTypes: [''],
      originalUser: [''],
      documents: this.fb.array([]),
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
      };
      this.form.patchValue(taskData);

    }
  }

  getOneStudent() {
    if (this.parentData.studentId) {
      this.subs.sink = this.studentService.getOneStudent(this.parentData.studentId).subscribe((resp) => {

        this.form.get('rncpTitle').patchValue(resp.rncp_title.short_name);
        this.form.get('originalRncpTitle').patchValue(resp.rncp_title._id);
        this.form.get('class_id').patchValue(resp.current_class.name);
        this.form.get('originalClass').patchValue(resp.current_class._id);

        const studentName = resp.first_name + ' ' + resp.last_name;
        this.form.get('users').patchValue(studentName);
      });
      this.subs.sink = this.studentService.getOneStudentUserId(this.parentData.studentId).subscribe((resp) => {
        if (resp) {
          this.form.get('originalUser').patchValue(resp.user_id._id);
        }
      });
    }
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

  addDocument(docAdd) {
    if (docAdd) {
      this.documents = this.form.get('documents') as UntypedFormArray;
      this.documents.push(this.buildDocuments(docAdd.value))
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

  createTask() {
    if (this.form.invalid) {
      Swal.fire({
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        footer: `<span style="margin-left: auto">FormSave_S1</span>`,
        allowEscapeKey: true,
        type: 'warning',
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
      })
      return;
    }
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
    if (this.parentData.type === 'add') {
      if (schoolId !== '') {
        this.subs.sink = this.rncpTitleService.createTask(payload, schoolId).subscribe((data: any) => {
          Swal.fire({
            title: this.translate.instant('TASKCREATED.TITLE'),
            html: this.translate.instant('TASKCREATED.TEXT'),
            footer: `<span style="margin-left: auto">TASKCREATED</span>`,
            allowEscapeKey: true,
            type: 'success',
            confirmButtonText: this.translate.instant('TASKCREATED.BUTTON'),
          }).then((res) => {
            this.closeDialog(data);
          });
        });
      } else {
        this.subs.sink = this.rncpTitleService.createTaskNonSchool(payload).subscribe((data: any) => {
          Swal.fire({
            title: this.translate.instant('TASKCREATED.TITLE'),
            html: this.translate.instant('TASKCREATED.TEXT'),
            footer: `<span style="margin-left: auto">TASKCREATED</span>`,
            allowEscapeKey: true,
            type: 'success',
            confirmButtonText: this.translate.instant('TASKCREATED.BUTTON'),
          }).then((res) => {
            this.closeDialog(data);
          });
        });
      }
    } else {
      this.subs.sink = this.rncpTitleService.updateTask(payload, this.taskData._id).subscribe((data: any) => {
        Swal.fire({
          title: this.translate.instant('TASKCREATED.TITLE'),
          html: this.translate.instant('TASKCREATED.TEXT'),
          footer: `<span style="margin-left: auto">TASKCREATED</span>`,
          allowEscapeKey: true,
          type: 'success',
          confirmButtonText: this.translate.instant('TASKCREATED.BUTTON'),
        }).then((res) => {
          this.closeDialog(data);
        });
      });
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

  closeDialog(resp?) {
    this.dialogRef.close(resp);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
