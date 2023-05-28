import { Component, OnInit, Inject, OnDestroy, ViewChild, AfterViewChecked, ChangeDetectorRef, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormArray, UntypedFormControl } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { UserService } from 'app/service/user/user.service';
import { SchoolService } from 'app/service/schools/school.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';
import { UtilityService } from 'app/service/utility/utility.service';
import * as _ from 'lodash';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { NgxPermissionsService } from 'ngx-permissions';
import { interval, Observable, of, PartialObserver, Subject } from 'rxjs';
import { startWith, map, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CompanyService } from 'app/service/company/company.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { environment } from 'environments/environment';

interface Entity {
  entity_name: string;
  school_type: string;
  group_of_school: string;
  school: string;
  assigned_rncp_title: string;
  class: string;
  type: string;
}

enum Entities {
  admtc,
  academic,
  serviceProvider,
  groupOfSchools,
}

@Component({
  selector: 'ms-users-dialog',
  templateUrl: './users-dialog.component.html',
  styleUrls: ['./users-dialog.component.scss'],
})
export class UsersDialogComponent implements OnInit, OnDestroy, AfterViewChecked {
  private subs = new SubSink();
  @ViewChild('errorSwal', { static: true }) errorSwal: any;
  @ViewChild('fileUploadDoc', { static: false }) fileUploaderDoc: ElementRef;
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
  FieldsHasPopulated = true;
  fieldReady = false;
  isUserAcadDir = false;
  isUserAcadAdmin = false;
  isUserCertifier = false;
  isUserCertifierDir = false;
  schoolReady = false;
  titleReady = false;
  classReady = false;
  userTypeReady = false;
  buttonNotReady = true;
  isWaitingForResponse = true;
  dataUserExisting: any;
  currUser: any;

  // autocomplete field
  schoolControl = new UntypedFormControl('');
  filteredSchools: Observable<{ label: string; value: string }[]>; // to hold dropdown on static entity input
  filteredSchoolArr: Observable<{ label: string; value: string }[]>[] = []; // to hold dropdown on form array entity input
  titleControl = new UntypedFormControl('');
  filteredTitles: Observable<{ label: string; value: string }[]>;
  filteredTitleArr: Observable<{ label: string; value: string }[]>[] = [];
  companyControl = new UntypedFormControl('');
  filteredCompanies: Observable<{ label: string; value: string }[]>; // to hold dropdown on static entity input
  filteredCompanyArr: Observable<{ label: string; value: string }[]>[] = []; // to hold dropdown on form array entity input

  // dropdown data
  entitiesName: any[];
  schoolTypes: any[];
  schools: any[] = [];
  rncpTitles: any[] = [];
  classes: any[] = [];
  userTypes: any[] = [];
  companies: any[] = [];
  // dropdown data
  entitiesNameList: any[];
  schoolTypesList: any[];
  schoolsList: { value: string; label: string }[] = [];
  loggedInUserSchools: { value: string; label: string }[] = [];
  rncpTitlesList: any[] = [];
  classesList: any[] = [];
  userTypesList: any[] = [];
  groupOfSchoolList = [];
  companiesList: any[] = [];
  companiesListFull: any[] = [];
  private timeOutVal: any;
  ispause = new Subject();
  public time = 120;
  timer: Observable<number>;
  timerObserver: PartialObserver<number>;
  countdownHabis = false;
  disableChooseEntities: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public parentData: any, // data that come from parent component's dialog.open()
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<UsersDialogComponent>,
    private userService: UserService,
    private schoolService: SchoolService,
    private rncpTitleService: RNCPTitlesService,
    private translate: TranslateService,
    private utilService: UtilityService,
    private permissions: NgxPermissionsService,
    private companyService: CompanyService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private fileUploadService: FileUploadService,
  ) {}

  ngOnInit() {

    this.currUser = this.authService.getLocalStorageUser();
    this.isRegistered = false;
    this.initUserForm();
    this.initUserEntityForm();
    this.getLoggedInUserSchools();

    this.isUserAcadDir = this.utilService.isUserAcadir();
    this.isUserAcadAdmin = this.utilService.isUserAcadAdmin();
    this.isUserCertifier = !!this.permissions.getPermission('Certifier Admin');
    this.isUserCertifierDir = !!this.permissions.getPermission('CR School Director');
    if (this.isUserAcadDir || this.isUserAcadDir) {
      this.entitiesName = this.userService.getEntitiesNameForAcadir();
      this.entitiesNameList = this.userService.getEntitiesNameForAcadir();
      this.schoolTypes = this.userService.getSchoolTypeForAcadir();
      this.schoolTypesList = this.userService.getSchoolTypeForAcadir();
    } else if (this.isUserCertifier || this.isUserCertifierDir) {
      this.entitiesName = this.userService.getEntitiesNameForAcadir();
      this.entitiesNameList = this.userService.getEntitiesNameForAcadir();
      this.schoolTypes = this.userService.getSchoolTypeForCertifier();
      this.schoolTypesList = this.userService.getSchoolTypeForCertifier();
    } else {
      this.entitiesName = this.userService.getEntitiesNameToUserMenu();
      this.entitiesNameList = this.userService.getEntitiesNameToUserMenu();
      this.schoolTypes = this.userService.getSchoolType();
      this.schoolTypesList = this.userService.getSchoolType();
    }

    if (this.parentData) {
      this.currentUser = this.parentData.userData;

      this.operation = this.parentData.operation;
      if (this.operation === 'edit') {
        this.FieldsHasPopulated = false;
        this.addEntitiesForm();
      } else if (this.operation === 'populateEntities') {
        this.FieldsHasPopulated = false;
        this.disableChooseEntities = true;
        this.populateEntity(this.parentData.entities);
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
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  getLoggedInUserSchools() {
    // call API only when we login as certifier user
    if (this.permissions.getPermission('CR School Director') || this.permissions.getPermission('Certifier Admin')) {
      this.subs.sink = this.schoolService.getSchoolsOfUser().subscribe((schools) => {
        const schoolArray = schools.map((school) => {
          return { value: school._id, label: school.short_name };
        });
        this.loggedInUserSchools = schoolArray;
      });
    }
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

    this.subs.sink = this.userService.getUserEditData(this.currentUser._id,this.currentUser.status).subscribe((resp) => {

      this.currentUser = resp;

      this.userForm.patchValue(this.currentUser);
      this.userForm.markAllAsTouched();
      this.populateEntity(resp.entities);

    });
  }

  populateEntity(resp) {
    const entities: any[] = resp.map((entity) => {

      const data = {};
      data['entity_name'] = entity.entity_name;
      if (entity.school_type) {
        data['school_type'] = entity.school_type;
      }
      if (entity.group_of_school && entity.group_of_school._id) {
        data['group_of_school'] = entity.group_of_school._id;
      }
      if (entity.school) {
        data['school'] = entity.school._id;
        data['schoolCtrl'] = entity.school.short_name;
      }
      if (entity.assigned_rncp_title) {
        data['assigned_rncp_title'] = entity.assigned_rncp_title._id;
        data['titleCtrl'] = entity.assigned_rncp_title.short_name;
      }
      if (entity.class) {
        data['class'] = entity.class._id;
      }
      if (entity.type) {
        data['type'] = entity.type._id;
      }
      if (entity.companies && entity.companies.length) {

        data['companies'] = entity.companies[0]._id;
        data['companyCtrl'] = entity.companies[0].company_name;
      }

      return data;
    });

    for (let i = 0; i < entities.length; i++) {
      if (i >= 0 && i >= this.entities.length) {
        this.addEntities();
      }
    }

    if (entities && entities.length) {
      for (let i = 0; i < entities.length; i++) {
        this.nowIndex = i;
        this.schools.push([]);
        this.rncpTitles.push([]);
        this.classes.push([]);
        this.userTypes.push([]);
        this.companies.push([]);




        this.entities.get(i.toString()).patchValue(entities[i]);


        this.getUserTypes(entities[i].entity_name, i.toString());

        if (entities[i].school_type) {
          this.getSchools(entities[i].school_type, i.toString());
          this.getUserTypesByEntityAndSchoolType(i.toString());
        } else {
          this.schoolReady = true;
          if (this.userTypeReady && this.schoolReady && this.classReady && this.titleReady) {
            this.disabledSpinner();
          }
        }

        if (entities[i].school) {
          this.getRncpTitles(entities[i].school, i.toString());
        } else {
          this.titleReady = true;
          if (this.userTypeReady && this.schoolReady && this.classReady && this.titleReady) {
            this.disabledSpinner();
          }
        }

        if (entities[i].assigned_rncp_title) {
          this.getClasses(entities[i].assigned_rncp_title, i.toString());
        } else {
          this.classReady = true;
          if (this.userTypeReady && this.schoolReady && this.classReady && this.titleReady) {
            this.disabledSpinner();
          }
        }


        if (entities[i].companies) {
          this.getCompanies(entities[i].companyCtrl, i.toString());
        }

        if (this.selectedEntity === 'admtc' && entities[i].type === '5a2e1ecd53b95d22c82f954d') {
          this.rncpTitleService.getRncpTitlesForUrgent('').subscribe((respp) => {
            const rncpArray = respp.map((title) => {
              return { value: title._id, label: title.short_name };
            });
            this.rncpTitles[i] = rncpArray;
            this.filteredTitleArr[i] = this.entities
              .get(i.toString())
              .get('titleCtrl')
              .valueChanges.pipe(
                startWith(''),
                map((searchTxt) =>
                  this.rncpTitles[i].filter((ttl) => ttl.label.toLowerCase().trim().includes(searchTxt.toLowerCase().trim())),
                ),
              );
          });
        }
      }
    } else {
      this.disabledSpinner();
    }
    this.fieldReady = true;
    this.nowIndex = this.nowIndex + 1;
    this.FieldsHasPopulated = true;
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
      entity_name: [null],
      school_type: [null],
      group_of_school: [],
      school: [null],
      assigned_rncp_title: [null],
      class: [null],
      type: [null],
      companies: [null],
    });
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
      group_of_school: [],
      school: [null],
      schoolCtrl: [''], // dummy field to hold autocomplete
      assigned_rncp_title: [null],
      titleCtrl: [''], // dummy field to hold autocomplete
      class: [null],
      type: [null, Validators.required],
      companies: [null],
      companyCtrl: [''], // dummy field to hold autocomplete
    });
  }

  addEntities() {
    this.entities.push(this.initEntitiesFormGroup());
  }

  removeEntities(index: number) {
    const entity = this.userForm.get('entities').get(index.toString()).get('entity_name').value;
    const type = this.userForm.get('entities').get(index.toString()).get('type').value;
    if (entity || type) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('USERMODIFY_S1.TITLE'),
        html: this.translate.instant('USERMODIFY_S1.TEXT'),
        footer: `<span style="margin-left: auto">USERMODIFY_S1</span>`,
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('USERMODIFY_S1.BUTTON_1', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('USERMODIFY_S1.BUTTON_2'),
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('USERMODIFY_S1.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('USERMODIFY_S1.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.entities.removeAt(index);
          this.classes.splice(index, 1);
          this.nowIndex = this.nowIndex - 1;
          Swal.fire({
            type: 'success',
            title: this.translate.instant('USERMODIFY_S1B.TITLE'),
            html: this.translate.instant('USERMODIFY_S1B.TEXT'),
            footer: `<span style="margin-left: auto">USERMODIFY_S1B</span>`,
            confirmButtonText: this.translate.instant('USERMODIFY_S1B.BUTTON'),
          });
        }
      });
    } else {
      this.entities.removeAt(index);
      this.nowIndex = this.nowIndex - 1;
    }
  }

  get entities() {
    return this.userForm.get('entities') as UntypedFormArray;
  }

  companyTypeSelected(index: string) {
    // hide element if return true
    return this.entities.get(index).get('entity_name').value === 'company';
  }

  groupSchoolCompanySelected(index: string) {
    // hide element if return true
    return this.entities.get(index).get('entity_name').value === 'group_of_schools';
  }

  groupOfSchoolSelected(index: string) {
    return this.entities.get(index).get('entity_name').value === 'group_of_schools';
  }

  setSelectedSchools(school: string, index: string) {
    this.entities.get(index).get('group_of_school').setValue(school);
  }

  submit() {
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


    // return;
    payload = this.userForm.getRawValue();

    for (let i = 0; i < payload.entities.length; i++) {
      // dont send school_type if the value is empty
      if (!payload.entities[i]['school_type']) {
        delete payload.entities[i]['school_type'];
      }
      // *************** delete class data if ADMTC(non-visitor) and certifier
      if (
        (payload.entities[i]['entity_name'] === 'admtc' && payload.entities[i]['type'] !== '5a2e1ecd53b95d22c82f954d') ||
        payload.entities[i]['school_type'] === 'certifier'
      ) {
        delete payload.entities[i]['class'];
      }
      // delete dummy field that hold autocomplete data from payload
      delete payload.entities[i]['schoolCtrl'];
      delete payload.entities[i]['titleCtrl'];
      delete payload.entities[i]['companyCtrl'];
    }

    this.isWaitingForResponse = true;
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
              footer: `<span style="margin-left: auto">USER_S15</span>`,
              confirmButtonText: this.translate.instant('USER_S15.OK'),
            });
          } else if (err['message'] === 'GraphQL error: Selected title Already Have Certifier Admin') {
            Swal.fire({
              title: this.translate.instant('USERADD_S2.TITLE'),
              html: this.translate.instant('USERADD_S2.TEXT'),
              type: 'warning',
              showConfirmButton: true,
              footer: `<span style="margin-left: auto">USERADD_S2</span>`,
              confirmButtonText: this.translate.instant('USERADD_S2.BUTTON'),
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
              footer: `<span style="margin-left: auto">USER_S15</span>`,
              confirmButtonText: this.translate.instant('USER_S15.OK'),
            });
          } else if (err['message'] === 'GraphQL error: user was already created but the status is deleted') {
            Swal.fire({
              title: this.translate.instant('USERCREATE_S1.TITLE'),
              html: this.translate.instant('USERCREATE_S1.TEXT'),
              type: 'warning',
              showConfirmButton: true,
              footer: `<span style="margin-left: auto">USERCREATE_S1</span>`,
              confirmButtonText: this.translate.instant('USERCREATE_S1.BUTTON_1'),
              showCancelButton: true,
              cancelButtonText: this.translate.instant('USERCREATE_S1.BUTTON_2'),
              width: '500px',
            }).then((isConfirm) => {
              if (isConfirm.value) {


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
                  }
                );
              } else {
                return 1;
              }
            });
            // this.getDataUser();
          } else if (err['message'] === 'GraphQL error: Email Exist') {
            Swal.fire({
              title: this.translate.instant('USER_S16.TITLE'),
              html: this.translate.instant('USER_S16.TEXT'),
              type: 'error',
              showConfirmButton: true,
              footer: `<span style="margin-left: auto">USER_S16</span>`,
              confirmButtonText: this.translate.instant('USER_S16.OK'),
            });
          } else if (err['message'] === 'GraphQL error: Selected title Already Have Certifier Admin') {
            Swal.fire({
              title: this.translate.instant('USERADD_S2.TITLE'),
              html: this.translate.instant('USERADD_S2.TEXT'),
              type: 'warning',
              showConfirmButton: true,
              footer: `<span style="margin-left: auto">USERADD_S2</span>`,
              confirmButtonText: this.translate.instant('USERADD_S2.BUTTON'),
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

  /*
   * Get Data School Dropdown
   * */
  getSchools(event, index?: string) {
    this.selectedSchoolType = event;

    // reset the fields
    if (this.FieldsHasPopulated) {
      this.entities.get(index).get('school').setValue(null);
      this.entities.get(index).get('schoolCtrl').setValue('');
      this.entities.get(index).get('assigned_rncp_title').setValue(null);
      this.entities.get(index).get('titleCtrl').setValue('');
      this.entities.get(index).get('class').setValue(null);
      this.entities.get(index).get('type').setValue(null);
      this.entities.get(index).get('companies').setValue(null);
      this.entities.get(index).get('companyCtrl').setValue('');
      this.userTypes[index] = [];
      this.rncpTitles[index] = [];
      this.schools[index] = [];
      this.classes[index] = [];
    }

    this.subs.sink = this.schoolService.getSchoolsBySchoolTypeAndUser(this.selectedSchoolType).subscribe(
      (schools) => {
        const schoolArray = schools.map((school) => {
          return { value: school._id, label: school.short_name };
        });
        this.schoolReady = true;
        this.schools[index] = schoolArray;

        this.filteredSchoolArr[index] = this.entities
          .get(index)
          .get('schoolCtrl')
          .valueChanges.pipe(
            startWith(this.entities.get(index).get('schoolCtrl').value),
            map((searchTxt) =>
              this.schools[index].filter((sch) => sch.label.toLowerCase().trim().includes(searchTxt.toLowerCase().trim())),
            ),
          );

        if (this.userTypeReady && this.schoolReady && this.classReady && this.titleReady) {
          this.disabledSpinner();
        }
      },
      (err) => {
        this.schoolReady = true;
        if (this.userTypeReady && this.schoolReady && this.classReady && this.titleReady) {
          this.disabledSpinner();
        }
      },
    );
  }

  /*
   * Get Data Title Dropdown
   * */
  getRncpTitles(event, index?: string) {
    this.selectedSchool = event;

    // reset the fields
    if (this.FieldsHasPopulated) {
      this.entities.get(index).get('assigned_rncp_title').setValue(null);
      this.entities.get(index).get('class').setValue(null);
      this.entities.get(index).get('type').setValue(null);
      this.userTypes[index] = [];
      this.rncpTitles[index] = [];
      this.classes[index] = [];
    }

    this.subs.sink = this.rncpTitleService.getRncpTitlesBySchoolTypeAndId(this.selectedSchoolType, this.selectedSchool).subscribe(
      (rncpTitles) => {
        let temp = _.cloneDeep(rncpTitles);

        // *************** IF user CR Admin/Dir, then will only get title of their assigned title
        if (this.utilService.isUserCRDirAdmin()) {
          const userType = this.currUser.entities ? this.currUser.entities[0].type.name : '';
          this.subs.sink = this.authService.getUserById(this.currUser._id).subscribe((resp) => {
            const dataUSer = resp.entities.filter((ent) => ent.type.name === userType);
            const titles = this.utilService.getAcademicAllAssignedTitle(dataUSer);
            temp = temp.filter((titl) => titles.includes(titl._id));
          });
        }

        const rncpArray = temp.map((title) => {
          return { value: title._id, label: title.short_name };
        });

        this.titleReady = true;
        this.rncpTitles[index] = rncpArray;


        this.filteredTitleArr[index] = this.entities
          .get(index)
          .get('titleCtrl')
          .valueChanges.pipe(
            startWith(this.entities.get(index).get('titleCtrl').value),
            map((searchTxt) =>
              this.rncpTitles[index].filter((ttl) => ttl.label.toLowerCase().trim().includes(searchTxt.toLowerCase().trim())),
            ),
          );

        if (this.userTypeReady && this.schoolReady && this.classReady && this.titleReady) {
          this.disabledSpinner();
        }
      },
      (err) => {
        this.titleReady = true;
        if (this.userTypeReady && this.schoolReady && this.classReady && this.titleReady) {
          this.disabledSpinner();
        }
      },
    );
  }

  /*
   * Get Data Class Dropdown
   * */
  getClasses(event, index?: string) {
    this.selectedRncpTitle = event;

    // reset the fields
    if (this.FieldsHasPopulated) {
      if (this.selectedEntity !== 'admtc') {
        this.entities.get(index).get('type').setValue(null);
        this.userTypes[index] = [];
      }
      this.entities.get(index).get('class').setValue(null);
      this.classes[index] = [];
    }

    this.subs.sink = this.rncpTitleService.getClassesByTitleAndPC(this.selectedRncpTitle, this.selectedSchool).subscribe(
      (classes) => {
        const classArray = classes.map((classData) => {
          return { value: classData._id, label: classData.name };
        });
        this.classReady = true;
        this.classes[index] = classArray;
        if (this.userTypeReady && this.schoolReady && this.classReady && this.titleReady) {
          this.disabledSpinner();
        }
      },
      (err) => {
        this.classReady = true;
        if (this.userTypeReady && this.schoolReady && this.classReady && this.titleReady) {
          this.disabledSpinner();
        }
      },
    );
    if (this.selectedSchoolType === 'certifier') {
      this.getUserTypesByEntityAndSchoolType(index);
    }
  }

  /*
   * Get Data Class Dropdown
   * */
  getClassSelected(event, index?: string) {

    if (this.selectedEntity !== 'admtc') {
      this.entities.get(index).get('type').setValue(null);
    }
    if (this.selectedEntity === 'academic') {
      this.getUserTypesByEntityAndSchoolType(index);
    }

  }

  /*
   * Get Data Company Dropdown
   * */
  getCompanies(event, index?: string) {
    const selectedCompany = event;


    this.subs.sink = this.entities
      .get(index)
      .get('companyCtrl')
      .valueChanges.pipe(debounceTime(300))
      .subscribe((companyInput) => {
        this.subs.sink = this.companyService.getCompanyDropdownList(companyInput).subscribe((company) => {
          const companyArray = company.map((companyData) => {
            return { value: companyData._id, label: companyData.company_name };
          });
          this.companies[index] = companyArray;
          this.filteredCompanyArr[index] = of(this.companies[index]);

          // this.filteredCompanyArr[index] = this.entities
          // .get(index)
          // .get('companyCtrl')
          // .valueChanges.pipe(
          //   startWith(this.entities.get(index).get('companyCtrl').value),
          //   map((searchTxt) =>
          //   this.companies[index].filter((sch) => sch.label.toLowerCase().trim().includes(searchTxt.toLowerCase().trim())),
          //   ),
          // );
        });
      });
  }

  /*
   * Get Data User Type Dropdown
   * */
  getUserTypes(event, index?: string) {
    this.selectedEntity = event;




    // reset the fields
    if (this.FieldsHasPopulated) {
      this.entities.get(index).get('school_type').setValue(null);
      this.entities.get(index).get('group_of_school').setValue(null);
      this.entities.get(index).get('school').setValue(null);
      this.entities.get(index).get('assigned_rncp_title').setValue(null);
      this.entities.get(index).get('class').setValue(null);
      this.entities.get(index).get('type').setValue(null);
      this.userTypes[index] = [];
      this.rncpTitles[index] = [];
      this.schools[index] = [];
      this.classes[index] = [];
    }

    if (this.selectedEntity === 'group_of_schools') {
      this.subs.sink = this.schoolService.getAllGroupOfSchoolsDropdown().subscribe((resp) => {

        let temp = _.cloneDeep(resp);
        if (temp) {
          temp = temp.sort((groupA, groupB) => {
            if (this.utilService.simplifyRegex(groupA.group_name) < this.utilService.simplifyRegex(groupB.group_name)) {
              return -1;
            } else if (this.utilService.simplifyRegex(groupA.group_name) > this.utilService.simplifyRegex(groupB.group_name)) {
              return 1;
            } else {
              return 0;
            }
          });
        }
        this.groupOfSchoolList = _.cloneDeep(temp);
      });
    }

    if (this.selectedEntity === 'company') {
      // this.subs.sink =  this.companyService.getAllCompaniesDropdown().subscribe(resp => {

      //   let temp = _.cloneDeep(resp);
      //   if (temp) {
      //     temp = temp.sort((groupA, groupB) => {
      //       if (this.utilService.simplifyRegex(groupA.group_name) < this.utilService.simplifyRegex(groupB.group_name)) {
      //         return -1;
      //       } else if (this.utilService.simplifyRegex(groupA.group_name) > this.utilService.simplifyRegex(groupB.group_name)) {
      //         return 1;
      //       } else {
      //         return 0;
      //       }
      //     });
      //   }
      //   this.companiesListFull = _.cloneDeep(temp);
      //   this.filteredCompanyArr[index] = this.entities
      //   .get(index)
      //   .get('companyCtrl')
      //   .valueChanges.pipe(
      //     startWith(this.entities.get(index).get('companyCtrl').value),
      //     map((searchTxt) =>
      //       this.companiesListFull.filter((company) =>
      //          company.company_name.toLowerCase().trim().includes(searchTxt.toLowerCase().trim())),
      //     ),
      //   );
      // })
    }

    this.subs.sink = this.userService.getUserTypesByEntity(this.selectedEntity).subscribe(
      (userTypes) => {
        let userTypesArray = userTypes.map((type) => {
          return { value: type._id, label: type.name };
        });
        userTypesArray = this.filterUserType(userTypesArray);
        this.userTypeReady = true;
        this.userTypes[index] = userTypesArray;
        this.disabledSpinner();
      },
      (err) => {
        this.userTypeReady = true;
        this.disabledSpinner();
      },
    );
  }

  filterUserType(userTypes: { value: string; label: string }[]) {
    let types = userTypes;
    if (this.permissions.getPermission('ADMTC Admin')) {
      // if admtc admin, remove user type admtc director
      types = userTypes.filter((type) => type.label !== 'ADMTC Director');
    } else if (this.isUserCertifier) {
      // if certifier admin, remove user type cr school director and certifier admin
      types = userTypes.filter((type) => type.label !== 'CR School Director' && type.label !== 'Certifier Admin');
    } else if (this.isUserCertifierDir) {
      // if CR School Director, remove user type cr school director
      types = userTypes.filter((type) => type.label !== 'CR School Director');
    } else if (this.isUserAcadAdmin) {
      // if acad admin, remove user type academic director
      types = userTypes.filter((type) => type.label !== 'Academic Director');
    } else if (this.isUserAcadDir) {
      // if acad admin, remove user type academic director
      types = userTypes.filter((type) => type.label !== 'Academic Director');
    }
    return types;
  }

  /*
   * Get Data User Type By Entity and School Type Dropdown
   * */
  getUserTypesByEntityAndSchoolType(index: string) {
    this.subs.sink = this.userService
      .getUserTypesByEntityAndSchoolType(this.selectedEntity, this.selectedSchoolType)
      .subscribe((userTypes) => {
        let userTypesArray = userTypes.map((type) => {
          return { value: type._id, label: type.name };
        });
        userTypesArray = this.filterUserType(userTypesArray);
        this.userTypes[index] = userTypesArray;
      });
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }

  // New Reqruinment

  // *************** Get Data company dropdown
  selectCompany(company: string) {

    this.userEntityForm.get('companies').setValue(company);

  }

  selectCompanyArr(company: { value: string; label: string }, index: number) {
    this.entities.at(index).get('companies').setValue(company.value);
    this.getCompanies(company.value, index.toString());
  }

  /*
   * Get Data School Dropdown
   * */
  getSchool(event) {
    this.selectedSchoolType = event;
    // reset the fields
    if (this.FieldsHasPopulated) {
      this.userEntityForm.get('school').setValue(null);
      this.schoolControl.setValue('');
      this.userEntityForm.get('assigned_rncp_title').setValue(null);
      this.titleControl.setValue('');
      this.userEntityForm.get('class').setValue(null);
      this.userEntityForm.get('type').setValue(null);
      this.userTypesList = [];
      this.schoolsList = [];
      this.rncpTitlesList = [];
      this.classesList = [];
    }

    this.subs.sink = this.schoolService.getSchoolsBySchoolTypeAndUser(this.selectedSchoolType).subscribe((schools) => {
      const schoolArray = schools.map((school) => {
        return { value: school._id, label: school.short_name };
      });
      this.schoolsList = schoolArray;
      this.filteredSchools = this.schoolControl.valueChanges.pipe(
        startWith(''),
        map((searchTxt) => this.schoolsList.filter((sch) => sch.label.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()))),
      );
    });
  }

  selectSchool(school: string) {
    this.userEntityForm.get('school').setValue(school);
    this.titleControl.setValue('');
    this.getRncpTitle(school);
  }

  selectSchoolArr(school: string, index: number) {
    this.entities.at(index).get('school').setValue(school);
    this.entities.at(index).get('titleCtrl').setValue('');
    this.getRncpTitles(school, index.toString());
  }

  /*
   * Get Data Title Dropdown for First Entity
   * */
  getRncpTitle(event) {
    this.selectedSchool = event;

    // reset the fields
    if (this.FieldsHasPopulated) {
      this.userEntityForm.get('assigned_rncp_title').setValue(null);
      this.userEntityForm.get('class').setValue(null);
      this.userEntityForm.get('type').setValue(null);
      this.userTypesList = [];
      this.rncpTitlesList = [];
      this.classesList = [];
    }

    this.subs.sink = this.rncpTitleService
      .getRncpTitlesBySchoolTypeAndId(this.selectedSchoolType, this.selectedSchool)
      .subscribe((rncpTitles) => {
        let temp = _.cloneDeep(rncpTitles);

        // *************** IF user is CR Admin/Dir, then will only get title of their assigned title
        if (this.utilService.isUserCRDirAdmin()) {
          const userType = this.currUser.entities ? this.currUser.entities[0].type.name : '';
          this.subs.sink = this.authService.getUserById(this.currUser._id).subscribe((resp) => {
            const dataUSer = resp.entities.filter((ent) => ent.type.name === userType);
            const titles = this.utilService.getAcademicAllAssignedTitle(dataUSer);
            temp = temp.filter((titl) => titles.includes(titl._id));
          });
        }

        const rncpArray = temp.map((title) => {
          return { value: title._id, label: title.short_name };
        });

        this.rncpTitlesList = rncpArray;
        this.filteredTitles = this.titleControl.valueChanges.pipe(
          startWith(''),
          map((searchTxt) => this.rncpTitlesList.filter((ttl) => ttl.label.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()))),
        );
      });
  }

  selectTitle(title: string) {
    this.userEntityForm.get('assigned_rncp_title').setValue(title);
    this.getClasse(title);
  }

  selectTitleArr(title: string, index: number) {
    this.entities.at(index).get('assigned_rncp_title').setValue(title);
    this.getClasses(title, index.toString());
  }

  /*
   * Get Data Class Dropdown for First Entity
   * */
  getClasse(event) {
    this.selectedRncpTitle = event;
    this.userEntityForm.get('class').setValue(null);
    if (this.selectedEntity !== 'admtc') {
      this.userEntityForm.get('type').setValue(null);
      this.userTypesList = [];
    }
    this.classesList = [];

    this.subs.sink = this.rncpTitleService.getClassesByTitleAndPC(this.selectedRncpTitle, this.selectedSchool).subscribe((classes) => {
      const classArray = classes.map((classData) => {
        return { value: classData._id, label: classData.name };
      });
      this.classesList = classArray;
    });
    if (this.selectedSchoolType === 'certifier') {
      this.getTypesByEntityAndSchoolType();
    }
  }
  /*
   * Get Data Class Dropdown for First Entity
   * */
  classSelected(event) {
    if (this.selectedEntity !== 'admtc') {
      this.userEntityForm.get('type').setValue('');
    }
    if (this.selectedEntity === 'academic') {
      this.getTypesByEntityAndSchoolType();
    }
  }

  /*
   * Get Data User Type Dropdown for First Entity
   * */
  getUserType(event) {
    this.selectedEntity = event;

    // reset the fields
    if (this.FieldsHasPopulated) {
      this.userEntityForm.get('school_type').setValue(null);
      this.userEntityForm.get('group_of_school').setValue(null);
      this.userEntityForm.get('school').setValue(null);
      this.schoolControl.setValue('');
      this.userEntityForm.get('assigned_rncp_title').setValue(null);
      this.titleControl.setValue('');
      this.userEntityForm.get('class').setValue(null);
      this.userEntityForm.get('type').setValue(null);
      // if entity selected, then add validator to userEntityForm
      this.setUserEntityFormValidator();
      this.userTypesList = [];
      this.schoolsList = [];
      this.rncpTitlesList = [];
      this.classesList = [];
    }
    this.subs.sink = this.userService.getUserTypesByEntity(this.selectedEntity).subscribe((userTypes) => {
      let userTypesArray = userTypes.map((type) => {
        return { value: type._id, label: type.name };
      });
      userTypesArray = this.filterUserType(userTypesArray);
      this.userTypesList = userTypesArray;

      if (this.userTypesList && this.userTypesList.length === 1) {
        this.userEntityForm.get('type').setValue(userTypesArray[0].value);
      } else if (this.selectedEntity === 'company') {
        const mentor = this.userTypesList.find((type) => type && type.label === 'Mentor');

        this.userEntityForm.get('type').setValue(mentor.value);
      }
    });
    if (this.selectedEntity === 'group_of_schools') {
      this.subs.sink = this.schoolService.getAllGroupOfSchoolsDropdown().subscribe((resp) => {

        let temp = _.cloneDeep(resp);
        if (temp) {
          temp = temp.sort((groupA, groupB) => {
            if (this.utilService.simplifyRegex(groupA.group_name) < this.utilService.simplifyRegex(groupB.group_name)) {
              return -1;
            } else if (this.utilService.simplifyRegex(groupA.group_name) > this.utilService.simplifyRegex(groupB.group_name)) {
              return 1;
            } else {
              return 0;
            }
          });
        }
        this.groupOfSchoolList = temp;
      });
    } else if (this.selectedEntity === 'admtc') {
      this.rncpTitleService.getRncpTitlesForUrgent('').subscribe((respp) => {
        const rncpArray = respp.map((title) => {
          return { value: title._id, label: title.short_name };
        });
        this.rncpTitlesList = rncpArray;
        this.filteredTitles = this.titleControl.valueChanges.pipe(
          startWith(''),
          map((searchTxt) => this.rncpTitlesList.filter((ttl) => ttl.label.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()))),
        );
      });
    } else if (this.selectedEntity === 'company') {
      this.subs.sink = this.companyControl.valueChanges
        .pipe(debounceTime(300))
        .pipe(distinctUntilChanged())
        .subscribe((resp) => {
          if (resp && resp.length > 3) {
            this.subs.sink = this.companyService.getCompanyDropdownList(resp).subscribe((response) => {


              const companyArray = response.map((company) => {
                return { value: company._id, label: company.company_name };
              });

              this.companiesList = companyArray;
              this.filteredCompanies = of(this.companiesList);
            });
          }
        });
    }
  }

  /*
   * Get Data User Type By Entity and School Type Dropdown for First Entity
   * */
  getTypesByEntityAndSchoolType() {
    this.subs.sink = this.userService
      .getUserTypesByEntityAndSchoolType(this.selectedEntity, this.selectedSchoolType)
      .subscribe((userTypes) => {
        let userTypesArray = userTypes.map((type) => {
          return { value: type._id, label: type.name };
        });
        userTypesArray = this.filterUserType(userTypesArray);
        this.userTypesList = userTypesArray;
      });
  }

  groupSchoolCompany() {
    // hide element if return true
    return this.userEntityForm.get('entity_name').value === 'group_of_schools';
  }

  companyType() {
    return this.userEntityForm.get('entity_name').value === 'company';
  }

  groupOfSchool() {
    return this.userEntityForm.get('entity_name').value === 'group_of_schools';
  }

  pushToEntities() {
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


    this.addEntities();
    this.FieldsHasPopulated = false;
    const oldIndex = this.nowIndex.toString();
    const newIndex = (this.entities.length - 1).toString();
    this.getUserTypes(this.userEntityForm.get('entity_name').value, newIndex);
    if (this.userEntityForm.get('school_type').value) {
      this.getSchools(this.userEntityForm.get('school_type').value, newIndex);
    }
    if (this.userEntityForm.get('school').value) {
      this.getRncpTitles(this.userEntityForm.get('school').value, newIndex);
    }
    if (this.userEntityForm.get('assigned_rncp_title').value) {
      this.getClasses(this.userEntityForm.get('assigned_rncp_title').value, newIndex);
    }
    if (this.userEntityForm.get('type').value) {
      this.getClassSelected(this.userEntityForm.get('type').value, newIndex);
    }
    this.selectedEntity = this.userEntityForm.get('entity_name').value;
    if (this.selectedEntity !== 'academic') {
      this.subs.sink = this.userService.getUserTypesByEntity(this.selectedEntity).subscribe(
        (userTypes) => {
          let userTypesArray = userTypes.map((type) => {
            return { value: type._id, label: type.name };
          });
          userTypesArray = this.filterUserType(userTypesArray);
          this.userTypeReady = true;
          this.userTypes[newIndex] = userTypesArray;
          this.disabledSpinner();
        },
        (err) => {
          this.userTypeReady = true;
          this.disabledSpinner();
        },
      );
    } else if (this.selectedEntity === 'academic') {
      this.selectedSchoolType = this.userEntityForm.get('school_type').value;
      this.getUserTypesByEntityAndSchoolType(newIndex);
    }
    this.entities.get(newIndex).get('type').setValue(this.userEntityForm.get('type').value);

    const newEntity = {
      ...this.userEntityForm.value,
      schoolCtrl: this.schoolControl.value, // add dummy field to hold autocomplete
      titleCtrl: this.titleControl.value, // add dummy field to hold autocomplete
      companyCtrl: this.companyControl.value, // add dummy field to hold autocomplete
    };
    this.entities.get(newIndex).patchValue(newEntity);


    this.FieldsHasPopulated = true;
    this.userEntityForm.get('school_type').setValue('');
    this.userEntityForm.get('school').setValue('');
    this.schoolControl.setValue('');
    this.userEntityForm.get('assigned_rncp_title').setValue('');
    this.titleControl.setValue('');
    this.userEntityForm.get('entity_name').setValue('');
    this.userEntityForm.get('class').setValue('');
    this.userEntityForm.get('group_of_school').setValue('');
    this.userEntityForm.get('type').setValue('');
    this.userEntityForm.reset();
    // remove validator from userEntityForm
    this.removetUserEntityFormValidator();
    // dropdown data
    this.schoolsList = [];
    this.rncpTitlesList = [];
    this.classesList = [];
    this.userTypesList = [];
    this.nowIndex++;
  }

  pushEntityToPayload(payload) {
    this.addEntities();
    const oldIndex = this.nowIndex.toString();
    const newIndex = (this.entities.length - 1).toString();

    this.getUserTypes(payload.entity_name, newIndex.toString());
    if (payload.school_type) {
      this.getSchools(payload.school_type, newIndex.toString());
    }
    if (payload.school) {
      this.getRncpTitles(payload.school, newIndex.toString());
    }
    if (payload.assigned_rncp_title) {
      this.getClasses(payload.assigned_rncp_title, newIndex.toString());
    }

    this.entities.get(newIndex.toString()).get('entity_name').setValue(payload.entity_name);
    this.entities.get(newIndex.toString()).get('school_type').setValue(payload.school_type);
    this.entities.get(newIndex.toString()).get('type').setValue(payload.type);
    this.entities.get(newIndex.toString()).get('group_of_school').setValue(payload.group_of_school);
    this.entities.get(newIndex.toString()).get('school').setValue(payload.school);
    this.entities.get(newIndex.toString()).get('assigned_rncp_title').setValue(payload.assigned_rncp_title);
    this.entities.get(newIndex.toString()).get('class').setValue(payload.class);
    this.entities.get(newIndex.toString()).get('companies').setValue(payload.companies);

    this.userEntityForm.get('school_type').setValue('');
    this.userEntityForm.get('school').setValue('');
    this.schoolControl.setValue('');
    this.userEntityForm.get('assigned_rncp_title').setValue('');
    this.titleControl.setValue('');
    this.userEntityForm.get('entity_name').setValue('');
    this.userEntityForm.get('class').setValue(null);
    this.userEntityForm.get('group_of_school').setValue('');
    this.userEntityForm.get('type').setValue('');
    this.companyControl.setValue('');
    this.userEntityForm.get('companies').setValue('');
    this.userEntityForm.reset();
    this.nowIndex++;
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
      delete payload.entities[i]['companyCtrl'];
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
            footer: `<span style="margin-left: auto">USER_S15</span>`,
            confirmButtonText: this.translate.instant('USER_S15.OK'),
          });
        } else if (err['message'] === 'GraphQL error: Email Exist') {
          Swal.fire({
            title: this.translate.instant('USER_S16.TITLE'),
            html: this.translate.instant('USER_S16.TEXT'),
            type: 'error',
            showConfirmButton: true,
            footer: `<span style="margin-left: auto">USER_S16</span>`,
            confirmButtonText: this.translate.instant('USER_S16.OK'),
          });
        } else if (err['message'] === 'User was already created but the status is deleted') {
          this.timer.subscribe(this.timerObserver);
          this.errorSwal.show();
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

  userTypeSelected(value) {
    if (this.selectedEntity === 'admtc' && value !== '5a2e1ecd53b95d22c82f954d') {
      this.titleControl.setValue('');
      this.rncpTitlesList = [];
      this.filteredTitles = null;
    } else if (this.selectedEntity === 'admtc' && value === '5a2e1ecd53b95d22c82f954d' && this.rncpTitlesList.length < 1) {
      this.rncpTitleService.getRncpTitlesForUrgent('').subscribe((respp) => {
        const rncpArray = respp.map((title) => {
          return { value: title._id, label: title.short_name };
        });
        this.rncpTitlesList = rncpArray;
        this.filteredTitles = this.titleControl.valueChanges.pipe(
          startWith(''),
          map((searchTxt) => this.rncpTitlesList.filter((ttl) => ttl.label.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()))),
        );
      });
    }
  }

  userTypeSaved(value, index) {
    if (this.selectedEntity === 'admtc' && value !== '5a2e1ecd53b95d22c82f954d') {
      this.rncpTitles[index] = [];
      this.filteredTitleArr[index] = null;
      this.entities.get(index.toString()).get('titleCtrl').setValue('');
    } else if (this.selectedEntity === 'admtc' && value === '5a2e1ecd53b95d22c82f954d' && this.rncpTitlesList.length < 1) {
      this.rncpTitleService.getRncpTitlesForUrgent('').subscribe((respp) => {
        const rncpArray = respp.map((title) => {
          return { value: title._id, label: title.short_name };
        });
        this.rncpTitlesList = rncpArray;
        this.filteredTitleArr[index] = this.titleControl.valueChanges.pipe(
          startWith(''),
          map((searchTxt) => this.rncpTitlesList.filter((ttl) => ttl.label.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()))),
        );
      });
    }
  }

  getDataUser() {
    this.subs.sink = this.userService.getUserEditData(this.currentUser._id,this.currentUser.status).subscribe((resp) => {

      this.dataUserExisting = resp;
      this.timer.subscribe(this.timerObserver);
      this.errorSwal.show();
    });
  }

  openUploadWindow() {
    this.fileUploaderDoc.nativeElement.click();
  }

  displayEntityRow(entity) {
    // If there is a user whose registered in 2 different school and 2 different school type,
    // I should only see the one as “Certifier” and “for My school”
    let showRow = false;
    if (this.permissions.getPermission('CR School Director') || this.permissions.getPermission('Certifier Admin')) {
      if (entity && entity.school_type && entity.school) {
        const isSchoolTypeExist = entity.school_type === 'certifier';
        const isSchoolExist = this.loggedInUserSchools.find((school) => school.value === entity.school);
        if (isSchoolTypeExist && isSchoolExist) {
          showRow = true;
        }
      }
    } else {
      showRow = true;
    }
    return showRow;
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
          footer: `<span style="margin-left: auto">UPLOAD_ERROR</span>`,
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
