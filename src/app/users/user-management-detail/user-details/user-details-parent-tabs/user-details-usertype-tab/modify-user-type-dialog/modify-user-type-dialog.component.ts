import { Component, OnInit, Inject, OnDestroy, ViewChild, AfterViewChecked, ChangeDetectorRef, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators, FormArray, UntypedFormControl } from '@angular/forms';
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
  selector: 'ms-modify-user-type-dialog',
  templateUrl: './modify-user-type-dialog.component.html',
  styleUrls: ['./modify-user-type-dialog.component.scss']
})
export class ModifyUserTypeDialogComponent implements OnInit, OnDestroy, AfterViewChecked {

  private subs = new SubSink();
  @ViewChild('errorSwal', { static: true }) errorSwal: any;
  userForm: UntypedFormGroup;
  userEntityForm: UntypedFormGroup;
  currentUser: any;
  nowIndex = 0;
  selectedEntity: string;
  selectedSchoolType: string;
  selectedSchool: string;
  selectedRncpTitle: string;
  FieldsHasPopulated = true;
  isUserAcadDir = false;
  isUserAcadAdmin = false;
  isUserCertifier = false;
  isUserCertifierDir = false;
  schoolReady = false;
  titleReady = false;
  classReady = false;
  userTypeReady = false;
  buttonNotReady = true;
  isWaitingForResponse = false;
  dataUserExisting: any;
  currUser: any;
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
    public dialogRef: MatDialogRef<ModifyUserTypeDialogComponent>,
    private userService: UserService,
    private schoolService: SchoolService,
    private rncpTitleService: RNCPTitlesService,
    private translate: TranslateService,
    private utilService: UtilityService,
    private permissions: NgxPermissionsService,
    private companyService: CompanyService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit() {
    this.currUser = this.authService.getLocalStorageUser();
    this.initUserEntityForm()
    this.getLoggedInUserSchools();

    this.isUserAcadDir = this.utilService.isUserAcadir();
    this.isUserAcadAdmin = this.utilService.isUserAcadAdmin();
    this.isUserCertifier = !!this.permissions.getPermission('Certifier Admin');
    this.isUserCertifierDir = !!this.permissions.getPermission('CR School Director');
    if (this.isUserAcadDir || this.isUserAcadAdmin) {
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
    }
    this.setUserEntityFormValidator();
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

  disabledSpinner() {
    this.isWaitingForResponse = false;
  }

  initUserEntityForm() {
    this.userEntityForm = this.fb.group({
      entity_name: [null, Validators.required],
      school_type: [null],
      group_of_school: [],
      school: [null],
      assigned_rncp_title: [null],
      class: [null],
      type: [null, Validators.required],
      companies: [null],
    });
  }

  submit() {
    this.isWaitingForResponse = true
    if (this.userEntityForm.invalid) {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        footer: `<span style="margin-left: auto">FormSave_S1</span>`,
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
      this.userEntityForm.markAllAsTouched()
      this.isWaitingForResponse = false
      return;
    }
    const payload = {
      entities: this.userEntityForm.value
    }
    const currUsertype = this.userTypesList.filter(type => type.value == payload.entities.type)
    this.subs.sink = this.userService.updateUserEntities(this.parentData.userId, payload).subscribe(resp => {
      if (resp) {
        this.isWaitingForResponse = false
        Swal.fire({
          type: 'success',
          title: this.translate.instant('Bravo!'),
          confirmButtonText: this.translate.instant('OK'),
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then(resp => {
          this.closeDialog()
        })
      }
    },
      (err) => {
        this.isWaitingForResponse = false
        this.isWaitingForResponse = false;
        if (err['message'] === 'GraphQL error: Selected Class Already Have Academic Director') {
          Swal.fire({
            title: this.translate.instant('USER_S15.TITLE'),
            html: this.translate.instant('USER_S15.TEXT'),
            type: 'error',
            footer: `<span style="margin-left: auto">USER_S15</span>`,
            showConfirmButton: true,
            confirmButtonText: this.translate.instant('USER_S15.OK'),
          });
        } else if (err['message'] === 'GraphQL error: Selected title Already Have Certifier Admin') {
          Swal.fire({
            title: this.translate.instant('USERADD_S2.TITLE'),
            html: this.translate.instant('USERADD_S2.TEXT'),
            type: 'warning',
            footer: `<span style="margin-left: auto">USERADD_S2</span>`,
            showConfirmButton: true,
            confirmButtonText: this.translate.instant('USERADD_S2.BUTTON'),
          });
        } else if (err['message'] === 'GraphQL error: Sorry, This usertype already exists !') {
          Swal.fire({
            title: this.translate.instant('USERTYPE_S1.TITLE'),
            html: this.translate.instant('USERTYPE_S1.TEXT', {
              usertype: this.translate.instant('USER_TYPES.' + currUsertype[0].label)
            }),
            type: 'warning',
            footer: `<span style="margin-left: auto">USERTYPE_S1</span>`,
            showConfirmButton: true,
            confirmButtonText: this.translate.instant('USERADD_S2.BUTTON'),
          }).then(confirm => {
            this.closeDialog()
          })
        }
        else {
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          });
        }
      }
    )
  }

  closeDialog() {
    this.dialogRef.close();
  }

  /*
   * Get Data Class Dropdown
   * */
  getClassSelected(event, index?: string) {
    if (this.selectedEntity !== 'admtc') {
      this.userEntityForm.get('type').setValue(null);
    }
    if (this.selectedEntity === 'academic') {
      this.getUserTypesByEntityAndSchoolType(index);
    }
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
    this.userEntityForm.get('companies').setValue(company.value);
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
    this.userEntityForm.get('school').setValue(school);
    this.userEntityForm.get('titleCtrl').setValue('');
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

    // filter title by user login
    let userLogin = '';
    if (this.isUserAcadDir || this.isUserAcadAdmin) {
      userLogin = 'acadir';
    } else if (this.isUserCertifier || this.isUserCertifierDir) {
      userLogin = 'certifier';
    } else {
      userLogin = null;
    }

    this.subs.sink = this.rncpTitleService
      .getRncpTitlesBySchoolTypeAndUserLogin(this.selectedSchoolType, this.selectedSchool, userLogin)
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
    this.getClasse(title);
    this.userEntityForm.get('assigned_rncp_title').setValue(title);
  }

  selectTitleArr(title: string, index: number) {
    this.userEntityForm.get('assigned_rncp_title').setValue(title);
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

  // *************** Function to close sweat alert
  closeSwal() {
    Swal.close();
    this.dialogRef.close();
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
      this.userEntityForm.get('titleCtrl').setValue('');
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
    this.subs.sink = this.userService.getUserEditData(this.currentUser._id, this.currentUser.status).subscribe((resp) => {
      this.dataUserExisting = resp;
      this.timer.subscribe(this.timerObserver);
      this.errorSwal.show();
    });
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
}

