import { Component, Inject, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../../service/user/user.service';
import { SchoolService } from '../../../service/schools/school.service';
import { RNCPTitlesService } from '../../../service/rncpTitles/rncp-titles.service';
import { TranslateService } from '@ngx-translate/core';
import { CustomValidators } from 'ng2-validation';
import Swal from 'sweetalert2';
import { SubSink } from 'subsink';
import { debounceTime, takeUntil } from 'rxjs/operators';
import * as _ from 'lodash';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { UtilityService } from 'app/service/utility/utility.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { interval, Observable, PartialObserver, Subject } from 'rxjs';
import { environment } from 'environments/environment';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { AuthService } from 'app/service/auth-service/auth.service';

interface Entity {
  entity_name: string;
  school_type: string;
  group_of_schools: string;
  school: string;
  assigned_rncp_title: string;
  class: string;
  type: string;
}

@Component({
  selector: 'ms-school-staff-dialog',
  templateUrl: './school-staff-dialog.component.html',
  styleUrls: ['./school-staff-dialog.component.scss'],
})
export class SchoolStaffDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  userForm: UntypedFormGroup;
  userEntityForm: UntypedFormGroup;
  currentUser: any;
  nowIndex = 0;
  operation: string;
  isRegistered: boolean;
  selectedEntity: string;
  selectedSchoolType: string;
  selectedSchool: string;
  selectedRncpTitle: string;
  FieldsHasPupulated = true;
  fieldReady = false;
  schoolReady = false;
  titleReady = false;
  classReady = false;
  userTypeReady = false;
  buttonNotReady = true;
  isWaitingForResponse = true;

  // dropdown data
  entitiesName: any[];
  schoolTypes: any[];
  schools: any[] = [];
  rncpTitles: any[] = [];
  classes: any[] = [];
  userTypes: any[] = [];
  // dropdown data
  entitiesNameList: any[];
  schoolTypesList: any[];
  schoolsList: any[] = [];
  rncpTitlesList: any[] = [];
  classesList: any[] = [];
  userTypesList: any[] = [];
  private timeOutVal: any;
  ispause = new Subject();
  public time = 120;
  timer: Observable<number>;
  timerObserver: PartialObserver<number>;
  countdownHabis = false;
  dataUserExisting: any;
  @ViewChild('errorSwal', { static: true }) errorSwal: any;
  @ViewChild('fileUploadDoc', { static: false }) fileUploaderDoc: ElementRef;
  userLogin: any;
  isUserAcadir = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public parentData: any, // data that come from parent component's dialog.open()
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<SchoolStaffDialogComponent>,
    private userService: UserService,
    private schoolService: SchoolService,
    private rncpTitleService: RNCPTitlesService,
    private translate: TranslateService,
    private utilService: UtilityService,
    private permissions: NgxPermissionsService,
    private fileUploadService: FileUploadService,
    private authService: AuthService,
    private ngxPermissionService: NgxPermissionsService,
  ) {}

  ngOnInit() {
    this.isRegistered = false;
    this.initUserForm();
    this.initUserEntityForm();
    this.getAllDropdownData();

    if (this.parentData) {

      this.currentUser = this.parentData.userData;
      this.operation = this.parentData.operation;
      if (this.operation === 'edit') {

        this.addEntitiesForm();
      } else {
        // add validator to userEntityForm when create new user
        this.setUserEntityFormValidator();
        this.isWaitingForResponse = false;
      }
    }
    this.timer = interval(1000).pipe(takeUntil(this.ispause));
    this.timerObserver = {
      next: (a: number) => {
        if (this.time === 0) {
          this.ispause.next();
        }
        this.time -= 1;
      },
    };
    this.userLogin = this.getCurrentUser();

    this.isUserAcadir = !!this.ngxPermissionService.getPermission('Academic Director');
  }

  getAllDropdownData() {
    this.entitiesName = ['academic'];
    this.entitiesNameList = ['academic'];
    this.schoolTypes = ['preparation_center'];
    this.schoolTypesList = ['preparation_center'];
    this.schools = [{ value: this.parentData.school._id, label: this.parentData.school.short_name }];
    this.schoolsList = [{ value: this.parentData.school._id, label: this.parentData.school.short_name }];

    if (this.permissions.getPermission('Academic Director')) {
      // if login as acadir, make the title dropdown only show the title that handled by acadir
      this.subs.sink = this.rncpTitleService.getTitleByAcadir(this.parentData.school._id).subscribe((rncpTitles) => {
        const rncpArray = rncpTitles.map((title) => ({ value: title._id, label: title.short_name }));
        this.rncpTitles = rncpArray;
        this.rncpTitlesList = rncpArray;
      });
      this.subs.sink = this.userService.getUserTypesByEntityAndSchoolType('academic', 'preparation_center').subscribe((userTypes) => {
        let userTypesArray = userTypes.map((type) => ({ value: type._id, label: type.name }));
        // remove acadir and pc school director from dropdown
        userTypesArray = userTypesArray.filter((type) => type.label !== 'Academic Director' && type.label !== 'PC School Director');
        this.userTypes = userTypesArray;
        this.userTypesList = userTypesArray;
      });
    } else {
      this.subs.sink = this.rncpTitleService
        .getRncpTitlesBySchoolTypeAndId('preparation_center', this.parentData.school._id)
        .subscribe((rncpTitles) => {
          const rncpArray = rncpTitles.map((title) => ({ value: title._id, label: title.short_name }));
          this.rncpTitles = rncpArray;
          this.rncpTitlesList = rncpArray;
        });
      this.subs.sink = this.userService.getUserTypesByEntityAndSchoolType('academic', 'preparation_center').subscribe((userTypes) => {
        let userTypesArray = userTypes.map((type) => ({ value: type._id, label: type.name }));
        userTypesArray = this.filterUserType(userTypesArray);
        this.userTypes = userTypesArray;
        this.userTypesList = userTypesArray;
      });
    }
  }

  filterUserType(userTypes: { value: string; label: string }[]) {
    let types = userTypes;
    if (this.permissions.getPermission('Academic Admin')) {
      // if acad admin, remove user type academic director
      types = userTypes.filter((type) => type.label !== 'Academic Director');
    }
    return types;
  }

  getCurrentUser() {
    return this.authService.getLocalStorageUser();
  }

  addEntitiesForm() {
    const entities = this.currentUser.entities;
    for (let i = 0; i < entities.length; i++) {
      if (i >= 0) {
        this.addEntities();
      }
    }
    this.getEntitiesData();
  }

  getEntitiesData() {
    this.subs.sink = this.userService.getUserDialogData(this.currentUser._id).subscribe((resp) => {
      this.currentUser = resp;
      this.userForm.patchValue(this.currentUser);
      this.userForm.markAllAsTouched();

      const entities: any[] = resp.entities.map((entity) => {
        const data = {};
        data['entity_name'] = entity.entity_name;
        if (entity.school_type) {
          data['school_type'] = entity.school_type;
        }
        if (entity.group_of_schools) {
          data['group_of_schools'] = entity.group_of_schools.map((school) => school._id);
        }
        if (entity.school) {
          data['school'] = entity.school._id;
        }
        if (entity.assigned_rncp_title) {
          data['assigned_rncp_title'] = entity.assigned_rncp_title._id;
        }
        if (entity.class) {
          data['class'] = entity.class._id;
        }
        if (entity.type) {
          data['type'] = entity.type._id;
        }
        return data;
      });
      if (entities && entities.length) {
        for (let i = 0; i < entities.length; i++) {
          this.nowIndex = i;
          // populate entities of user
          this.entities.get(i.toString()).patchValue(entities[i]);
          if (entities[i].assigned_rncp_title) {
            // add classes dropdown for each entity
            this.classes.push([]);
            this.subs.sink = this.rncpTitleService.getClassesByTitle(entities[i].assigned_rncp_title).subscribe((classes) => {
              this.classes[i] = classes.map((classData) => ({ value: classData._id, label: classData.name }));
            });
          }
        }
      }
      this.disabledSpinner();
      this.fieldReady = true;
      this.nowIndex = this.nowIndex + 1;
      this.FieldsHasPupulated = true;
    });
  }

  /*
   * Get Data Class Dropdown
   * */
  getClasses(event, index?: string) {
    this.selectedRncpTitle = event;

    // reset the fields if form has populated
    if (this.FieldsHasPupulated) {
      this.entities.get(index).get('class').setValue(null);
      this.entities.get(index).get('type').setValue(null);
      this.classes[index] = [];
    }
    this.subs.sink = this.rncpTitleService.getClassesByTitle(this.selectedRncpTitle).subscribe((allClass) => {
      if (this.isUserAcadir) {
        const userType = this.userLogin.entities ? this.userLogin.entities[0].type.name : '';
        this.subs.sink = this.authService.getUserById(this.userLogin._id).subscribe((respp) => {
          const academicUser = respp.entities.filter((ent) => ent.type.name === userType);
          const classes = this.utilService.getAcademicAllAssignedClass(academicUser);
          this.classes[index] = allClass.filter(classItem => classes.includes(classItem._id))
            .sort((classA: any, classB: any) => classA.name.localeCompare(classB.name))
            .map((classObj) => ({ value: classObj._id, label: classObj.name }));

        });
      } else {
        this.classes[index] = allClass.map((classData) => ({ value: classData._id, label: classData.name }));
      }
    })
  }

  /*
   * Get Data Class Dropdown for First Entity
   * */
  getClasse(event) {
    this.selectedRncpTitle = event;
    this.userEntityForm.get('class').setValue(null);
    this.userEntityForm.get('type').setValue(null);
    this.rncpTitleService.getClassesByTitle(this.selectedRncpTitle).subscribe((allClass) => {
      if (this.isUserAcadir) {
        const userType = this.userLogin.entities ? this.userLogin.entities[0].type.name : '';
        this.subs.sink = this.authService.getUserById(this.userLogin._id).subscribe((respp) => {
          const academicUser = respp.entities.filter((ent) => ent.type.name === userType);
          const classes = this.utilService.getAcademicAllAssignedClass(academicUser);
          this.classesList = allClass
            .filter((classItem) => classes.includes(classItem._id))
            .sort((classA: any, classB: any) => classA.name.localeCompare(classB.name))
            .map((classObj) => ({ value: classObj._id, label: classObj.name }));

        });
      } else {
        this.classesList = allClass.map((classData) => ({ value: classData._id, label: classData.name }));
      }
    });
  }

  pushToEntities() {
    if (this.checkIsEntityExist()) {
      return;
    }

    this.addEntities();
    this.FieldsHasPupulated = false;
    if (this.userEntityForm.get('assigned_rncp_title').value) {
      this.getClasses(this.userEntityForm.get('assigned_rncp_title').value, this.nowIndex.toString());
    }
    this.entities.get(this.nowIndex.toString()).patchValue(this.userEntityForm.value);
    this.FieldsHasPupulated = true;
    this.userEntityForm.reset();
    // remove validator from userEntityForm
    this.removetUserEntityFormValidator();
    // dropdown data
    this.classesList = [];
    this.nowIndex++;
  }

  removeEntities(index: number) {
    const entity = this.userForm.get('entities').get(index.toString()).get('entity_name').value;
    const type = this.userForm.get('entities').get(index.toString()).get('type').value;
    if (entity || type) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('this action will delete entity !'),
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
          this.entities.removeAt(index);
          this.nowIndex = this.nowIndex - 1;
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('entity deleted'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        }
      });
    } else {
      this.entities.removeAt(index);
      this.nowIndex = this.nowIndex - 1;
    }
  }

  pushEntityToPayload(payload) {
    this.addEntities();

    this.entities.get(this.nowIndex.toString()).get('entity_name').setValue(payload.entity_name);
    this.entities.get(this.nowIndex.toString()).get('school_type').setValue(payload.school_type);
    this.entities.get(this.nowIndex.toString()).get('type').setValue(payload.type);
    this.entities.get(this.nowIndex.toString()).get('group_of_schools').setValue(payload.group_of_schools);
    this.entities.get(this.nowIndex.toString()).get('school').setValue(payload.school);
    this.entities.get(this.nowIndex.toString()).get('assigned_rncp_title').setValue(payload.assigned_rncp_title);
    this.entities.get(this.nowIndex.toString()).get('class').setValue(payload.class);

    this.userEntityForm.get('school_type').setValue('');
    this.userEntityForm.get('school').setValue('');
    this.userEntityForm.get('assigned_rncp_title').setValue('');
    this.userEntityForm.get('entity_name').setValue('');
    this.userEntityForm.get('class').setValue(null);
    this.userEntityForm.get('group_of_schools').setValue('');
    this.userEntityForm.get('type').setValue('');
    this.userEntityForm.reset();
    this.nowIndex++;
  }

  setUserEntityFormValidator() {
    this.userEntityForm.get('entity_name').setValidators([Validators.required]);
    this.userEntityForm.get('entity_name').updateValueAndValidity();
    this.userEntityForm.get('type').setValidators([Validators.required]);
    this.userEntityForm.get('type').updateValueAndValidity();
  }

  removetUserEntityFormValidator() {
    this.userEntityForm.get('entity_name').clearValidators();
    this.userEntityForm.get('entity_name').updateValueAndValidity();
    this.userEntityForm.get('type').clearValidators();
    this.userEntityForm.get('type').updateValueAndValidity();
  }

  /*
   * Initialization Field for Form Add/Edit User
   * */
  initUserForm() {
    this.userForm = this.fb.group({
      entities: this.fb.array([]),
      civility: [null, Validators.required],
      first_name: [null, [Validators.required, removeSpaces]],
      last_name: [null, [Validators.required, removeSpaces]],
      email: [null, [CustomValidators.email, Validators.required]],
      position: [null, removeSpaces],
      office_phone: ['', [Validators.maxLength(10), Validators.minLength(10), CustomValidators.number]],
      direct_line: ['', [Validators.maxLength(10), Validators.minLength(10), CustomValidators.number]],
      portable_phone: ['', [Validators.maxLength(10), Validators.minLength(10), CustomValidators.number]],
      curriculum_vitae: this.fb.group({
        s3_path: [''],
        file_path: [''],
        name: [''],
      }),
    });
  }

  /*
   * Initialization Field for Form Add/Edit User
   * */
  initUserEntityForm() {
    this.userEntityForm = this.fb.group({
      entity_name: ['academic'],
      school_type: ['preparation_center'],
      group_of_schools: [],
      school: [this.parentData.school._id],
      assigned_rncp_title: [null],
      class: [null],
      type: [null],
    });
  }

  isDisplayedEntityExist() {
    // this function is to check if any entity of a user has
    // entity: academic, school_type: prep center, and school: same as selected school.
    // if there is no entities that match that requirement, dont display entities form array.
    let isExist = false;
    this.entities.value.forEach((entity: Entity) => {
      if (
        entity.entity_name === 'academic' &&
        entity.school_type === 'preparation_center' &&
        entity.school === this.parentData.school._id
      ) {
        isExist = true;
      }
    });
    return isExist;
  }

  disabledSpinner() {
    this.isWaitingForResponse = false;
  }

  /*
   * Initialization Field Entity => Group Array
   * */
  initEntitiesFormGroup() {
    return this.fb.group({
      entity_name: [null, Validators.required],
      school_type: [null],
      group_of_schools: [],
      school: [null],
      assigned_rncp_title: [null],
      class: [null],
      type: [null, Validators.required],
    });
  }

  addEntities() {
    this.entities.push(this.initEntitiesFormGroup());
  }

  get entities() {
    return this.userForm.get('entities') as UntypedFormArray;
  }

  submit() {
    if (this.checkIsEntityExist()) {
      return;
    }

    let payload = this.userForm.getRawValue();
    const payloadEntity = this.userEntityForm.getRawValue();
    if (payloadEntity && payloadEntity.entity_name && payloadEntity.type) {
      this.pushEntityToPayload(payloadEntity);
    }
    payload = this.userForm.getRawValue();

    for (let i = 0; i < payload.entities.length; i++) {
      // dont send school_type if the value is empty
      if (!payload.entities[i]['school_type']) {
        delete payload.entities[i]['school_type'];
      }
      if (payload.entities[i]['entity_name'] === 'admtc' || payload.entities[i]['school_type'] === 'certifier') {
        delete payload.entities[i]['class'];
      }
    }

    if (this.operation === 'edit') {
      this.subs.sink = this.userService.updateUser(this.currentUser._id, payload).subscribe(
        (resp) => {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('USER_UPDATED.TITLE'),
            text: this.translate.instant('USER_UPDATED.TEXT'),
            footer: `<span style="margin-left: auto">USER_UPDATED</span>`,
            confirmButtonText: this.translate.instant('USER_UPDATED.OK'),
          });
          this.isRegistered = true;
          this.closeDialog();
        },
        (err) => {
          if (err['message'] === 'GraphQL error: Selected Class Already Have Academic Director') {
            Swal.fire({
              title: this.translate.instant('USER_S15.TITLE'),
              html: this.translate.instant('USER_S15.TEXT'),
              type: 'error',
              footer: `<span style="margin-left: auto">USER_S15</span>`,
              showConfirmButton: true,
              confirmButtonText: this.translate.instant('USER_S15.OK'),
            });
          } else if (err['message'] === 'GraphQL error: user should transfer the responsibility first') {
            Swal.fire({
              allowOutsideClick: false,
              confirmButtonText: this.translate.instant('DeleteTypeUserModify.Btn-Confirm'),
              type: 'error',
              title: this.translate.instant('DeleteTypeUserModify.Title'),
              text: this.translate.instant('DeleteTypeUserModify.Body'),
              footer: `<span style="margin-left: auto">DeleteTypeUserModify</span>`,
            });
          } else {
            Swal.fire({
              type: 'error',
              title: 'Error',
              text: err && err['message'] ? err['message'] : err,
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            });
          }
        },
      );
    } else {
      this.subs.sink = this.userService.registerUser(payload).subscribe(
        (resp) => {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('USER_S9.TITLE'),
            text: this.translate.instant('USER_S9.TEXT', {
              civility: this.translate.instant(resp.civility),
              lastName: resp.first_name,
              firstName: resp.last_name,
            }),
            footer: `<span style="margin-left: auto">USER_S9</span>`,
            confirmButtonText: this.translate.instant('USER_S9.OK'),
          });
          this.isRegistered = true;
          this.closeDialog();
        },
        (err) => {
          if (err['message'] === 'GraphQL error: Selected Class Already Have Academic Director') {
            Swal.fire({
              title: this.translate.instant('USER_S15.TITLE'),
              html: this.translate.instant('USER_S15.TEXT'),
              type: 'error',
              showConfirmButton: true,
              confirmButtonText: this.translate.instant('USER_S15.OK'),
              footer: `<span style="margin-left: auto">USER_S15</span>`,
            });
          } else if (err['message'] === 'GraphQL error: user was already created but the status is deleted') {
            this.getDataUser();
          } else if (err['message'] === 'GraphQL error: Email Exist') {
            Swal.fire({
              title: this.translate.instant('USER_S16.TITLE'),
              html: this.translate.instant('USER_S16.TEXT'),
              type: 'error',
              showConfirmButton: true,
              confirmButtonText: this.translate.instant('USER_S16.OK'),
              footer: `<span style="margin-left: auto">USER_S16</span>`,
            });
          } else {
            Swal.fire({
              type: 'error',
              title: 'Error',
              text: err && err['message'] ? err['message'] : err,
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            });
          }
        },
      );
    }
  }

  closeDialog() {
    this.dialogRef.close(this.isRegistered);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }

  checkIsEntityExist() {
    // to prevent adding 2 same entity
    const selectedEntity: Entity = this.userEntityForm.value;
    const entities: Entity[] = this.entities.value;
    let isExist = false;
    entities.forEach((entity) => {
      if (JSON.stringify(selectedEntity) === JSON.stringify(entity)) {
        Swal.fire({ type: 'warning', title: this.translate.instant('ENTITY_EXIST') });
        isExist = true;
      }
    });
    return isExist;
  }
  // *************** Function to countdown button submit
  secondsToHms(d) {
    d = Number(d);
    const s = Math.floor((d % 25) % 5);
    let sDisplay = s > 0 ? s + (s === 1 ? '' : '') : '5';
    sDisplay = sDisplay + 's';
    if (s === 1) {
      this.countdownHabis = true;
    }
    if (this.countdownHabis) {
      sDisplay = this.translate.instant('USER_REGISTERED.BUTTON1');
    }
    return sDisplay;
  }

  registerExistingUser() {
    // to prevent adding 2 same entity
    const selectedEntity: Entity = this.userEntityForm.value;
    const entities: Entity[] = this.entities.value;
    let isEntityExist = false;
    entities.forEach((entity) => {
      isEntityExist = JSON.stringify(selectedEntity) === JSON.stringify(entity);
    });
    if (isEntityExist) {
      Swal.fire({ type: 'warning', title: this.translate.instant('ENTITY_EXIST') });
      return;
    }

    let payload = this.userForm.getRawValue();
    const payloadEntity = this.userEntityForm.getRawValue();
    if (payloadEntity && payloadEntity.entity_name && payloadEntity.type) {
      this.pushEntityToPayload(payloadEntity);
    }
    payload = this.userForm.getRawValue();

    for (let i = 0; i < payload.entities.length; i++) {
      // dont send school_type if the value is empty
      if (!payload.entities[i]['school_type']) {
        delete payload.entities[i]['school_type'];
      }
      if (payload.entities[i]['entity_name'] === 'admtc' || payload.entities[i]['school_type'] === 'certifier') {
        delete payload.entities[i]['class'];
      }
      // delete dummy field that hold autocomplete data from payload
      delete payload.entities[i]['schoolCtrl'];
      delete payload.entities[i]['titleCtrl'];
    }

    this.isWaitingForResponse = true;
    this.subs.sink = this.userService.registerUserExisting(payload).subscribe(
      (resp) => {
        Swal.fire({
          type: 'success',
          title: this.translate.instant('USER_S9.TITLE'),
          text: this.translate.instant('USER_S9.TEXT', {
            civility: this.translate.instant(resp.civility),
            lastName: resp.first_name,
            firstName: resp.last_name,
          }),
          footer: `<span style="margin-left: auto">USER_S9</span>`,
          confirmButtonText: this.translate.instant('USER_S9.OK'),
        });
        this.isWaitingForResponse = false;
        this.isRegistered = true;
        this.closeDialog();
      },
      (err) => {
        this.isWaitingForResponse = false;
        if (err['message'] === 'GraphQL error: Selected Class Already Have Academic Director') {
          Swal.fire({
            title: this.translate.instant('USER_S15.TITLE'),
            html: this.translate.instant('USER_S15.TEXT'),
            type: 'error',
            showConfirmButton: true,
            confirmButtonText: this.translate.instant('USER_S15.OK'),
            footer: `<span style="margin-left: auto">USER_S15</span>`,
          });
        } else if (err['message'] === 'GraphQL error: Email Exist') {
          Swal.fire({
            title: this.translate.instant('USER_S16.TITLE'),
            html: this.translate.instant('USER_S16.TEXT'),
            type: 'error',
            showConfirmButton: true,
            confirmButtonText: this.translate.instant('USER_S16.OK'),
            footer: `<span style="margin-left: auto">USER_S16</span>`,
          });
        } else if (err['message'] === 'GraphQL error: User was already created but the status is deleted') {
          // this.timer.subscribe(this.timerObserver);
          // this.errorSwal.show();
          this.registerExistingUser();
        } else {
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          });
        }
      },
    );
  }

  checkIfTitleAvailable(value) {
    if (value && this.rncpTitles && this.rncpTitles.length) {
      const result = _.find(this.rncpTitles, (title) => title.value === value);
      if (result) {
        return true;
      } else {
        return false;
      }
    }
    return true;
  }

  // *************** Function to close sweat alert
  closeSwal() {
    Swal.close();
    this.dialogRef.close();
  }

  openUpdateUser() {
    // to prevent adding 2 same entity
    const selectedEntity: Entity = this.userEntityForm.value;
    const entities: Entity[] = this.entities.value;

    const payload = _.cloneDeep(this.dataUserExisting);
    const payloadEntity = this.userEntityForm.getRawValue();
    payload.status = 'active';
    delete payload._id;
    delete payload.entities;
    this.isWaitingForResponse = true;
    this.subs.sink = this.userService.updateUserExisting(this.dataUserExisting._id, payload).subscribe(
      (resp) => {
        Swal.fire({
          type: 'success',
          title: this.translate.instant('USER_UPDATED.TITLE'),
          text: this.translate.instant('USER_UPDATED.TEXT'),
          footer: `<span style="margin-left: auto">USER_UPDATED</span>`,
          confirmButtonText: this.translate.instant('USER_UPDATED.OK'),
        });
        this.isWaitingForResponse = false;
        this.isRegistered = true;
        this.closeDialog();
      },
      (err) => {
        this.isWaitingForResponse = false;
        if (err['message'] === 'GraphQL error: Selected Class Already Have Academic Director') {
          Swal.fire({
            title: this.translate.instant('USER_S15.TITLE'),
            html: this.translate.instant('USER_S15.TEXT'),
            type: 'error',
            showConfirmButton: true,
            confirmButtonText: this.translate.instant('USER_S15.OK'),
            footer: `<span style="margin-left: auto">USER_S15</span>`,
          });
        } else {
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          });
        }
      },
    );
  }
  getDataUser() {
    this.subs.sink = this.userService.getUserDialogData(this.currentUser._id).subscribe((resp) => {

      this.dataUserExisting = resp;
      this.timer.subscribe(this.timerObserver);
      this.errorSwal.show();
    });
  }

  openUploadWindow() {
    this.fileUploaderDoc.nativeElement.click();
  }

  chooseFile(fileInput: Event) {
    const acceptable = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls'];
    if ((<HTMLInputElement>fileInput.target).files.length > 0) {
      const file = (<HTMLInputElement>fileInput.target).files[0];
      const fileType = this.utilService.getFileExtension(file.name).toLocaleLowerCase();
      if (acceptable.includes(fileType)) {
        this.subs.sink = this.fileUploadService.singleUpload(file).subscribe(
          (resp) => {
            if (resp) {
              this.userForm.get('curriculum_vitae').get('s3_path').setValue(resp.s3_file_name);
              this.userForm.get('curriculum_vitae').get('file_path').setValue(resp.file_url);
            }
          },
          (err) => {
            Swal.fire({
              type: 'error',
              title: 'Error !',
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            }).then((res) => {

            });
          },
        );
      } else {
        Swal.fire({
          type: 'error',
          title: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TITLE'),
          text: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TEXT', { file_exts: '.jpg, .jpeg, .png, .pdf' }),
          allowEscapeKey: false,
          allowOutsideClick: false,
          allowEnterKey: false,
        });
      }
    }
  }

  downloadCV() {
    const fileUrl = this.userForm.get('curriculum_vitae').get('s3_path').value;
    const a = document.createElement('a');
    a.target = 'blank';
    a.href = `${environment.apiUrl}/fileuploads/${fileUrl}?download=true`.replace('/graphql', '');
    a.click();
    a.remove();
  }

  editCV() {
    this.userForm.get('curriculum_vitae').get('s3_path').setValue('');
    this.userForm.get('curriculum_vitae').get('file_path').setValue('');
  }

  deleteCV() {
    this.userForm.get('curriculum_vitae').get('s3_path').setValue('');
    this.userForm.get('curriculum_vitae').get('file_path').setValue('');
    this.userForm.get('curriculum_vitae').get('name').setValue('');
  }
}
