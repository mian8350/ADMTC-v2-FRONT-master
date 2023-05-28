import { Component, OnInit, AfterContentChecked, OnDestroy } from '@angular/core';
import { AuthService } from '../../service/auth-service/auth.service';
import { ViewEncapsulation } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { UserService } from 'app/service/user/user.service';
import { School } from 'app/school/School.model';
import { SchoolService } from 'app/service/schools/school.service';
import { UntypedFormGroup } from '@angular/forms';
import Swal from 'sweetalert2';
import { Router, ActivatedRoute } from '@angular/router';
import { NgxPermissionsService } from 'ngx-permissions';
import { SubSink } from 'subsink';
import { AppPermission } from 'app/models/app-permission.model';
import { UtilityService } from 'app/service/utility/utility.service';
import { environment } from 'environments/environment';
import * as _ from 'lodash';
import { PromoService } from 'app/service/promo/promo.service';
import * as moment from 'moment';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';

@Component({
  // tslint:disable-next-line: component-selector
  selector: 'ms-loginV2-session',
  templateUrl: './loginV2-component.html',
  styleUrls: ['./loginV2-component.scss'],
  providers: [ParseUtcToLocalPipe],
  encapsulation: ViewEncapsulation.None,
})
export class LoginV2Component implements OnInit, AfterContentChecked, OnDestroy {
  private subs = new SubSink();
  array = [{ school: 'School1' }, { school: 'School2' }, { school: 'School3' }];
  _studentDomain = environment.studentEnvironment;

  slideConfig = {
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 1000,
    dots: false,
    arrows: false,
  };

  sessionSlider: any[] = [];
  showSessionSlider = false;

  loginForm: UntypedFormGroup;
  email: string;
  password: string;
  checked: Boolean; // to check if the entity radio button is selected or not
  isLoginSuccess: boolean;
  isEmailInvalid: boolean;
  incorrectLogin = false;
  isUserHasOneEntity = true; // if user has only one entity, dont show the radio button
  isSchoolTypeHasOneSchool = true; // if the selected school type has only one school, dont show the school radio button

  myInnerHeight = 600;
  entities: any[];
  userTypeList = [];
  schools: School[] = [];
  schoolIdList: string[] = [];
  schoolType: string[] = [];
  selectedEntityName: string;
  selectedSchoolType: string;
  selectedUserType: string;
  selectedSchoolId: string;
  entityRadioButton: any[];
  entityVisible: any[];
  schoolTypeVisible: any[];
  resetPassword: any;
  schoolTypeRadioButton: any[];
  isWaitingForResponse = false;
  appData: AppPermission;
  tempUserLogin = null;
  isStudent = false;
  forStudentLogin

  returnUrl = '';

  constructor(
    public authService: AuthService,
    public translate: TranslateService,
    private userService: UserService,
    private schoolService: SchoolService,
    private router: Router,
    private ngxPermissionService: NgxPermissionsService,
    private route: ActivatedRoute,
    public utilService: UtilityService,
    private promoService: PromoService,
    private ParseUTCToLocal: ParseUtcToLocalPipe,
  ) {}

  ngOnInit() {
    this.subs.sink = this.route.paramMap.subscribe((param) => {

      this.resetPassword = param.get('success');
    });
    this.checked = false;
    this.isLoginSuccess = false;
    this.isEmailInvalid = false;
    this.initRadioButton();
    this.getAppData();
    this.getPromotionData();

    if (this.resetPassword === 'reset-success') {

      this.swalNewPassword();
    }

    if (this.route.snapshot.queryParamMap.get('returnUrl')) {

      this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    }
  }

  ngAfterContentChecked() {
    // ng after content checked will be executed when there is event in the page like click, submit,..
    if (this.email && !this.entities && !this.isEmailInvalid) {
      this.getUserEntities();
    }
  }

  getAppData() {
    this.utilService.getAppPermission().subscribe((resp) => {
      this.appData = resp;
    });
  }

  get studentDomain() {
    return `${this._studentDomain}/session/login`;
  }

  getUserEntities(continueLogin?: string, value?: { email: string; password: string }) {
    this.schoolIdList = [];
    this.schools = [];
    this.userTypeList = [];
    this.selectedEntityName = '';

    const regexMail =
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const isEmail = regexMail.test(this.email);

    if (this.email && isEmail) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.userService.getUserEntities(this.email.toLowerCase()).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          this.initRadioButton();
          if (resp) {
            this.entities = resp['entities'];
            this.setSelectedRadioBtn();
            this.isEmailInvalid = false;

            // *************** For user that tried to login but does not have permission will need to call getuserentities first
            if (continueLogin && continueLogin === 'continue-login' && value) {

              this.login(value);
            }
          } else {
            this.isEmailInvalid = true;
          }
        },
        (err) => {
          this.isWaitingForResponse = false;
          // this.authService.postErrorLog(JSON.stringify(err));
          // dont do anything
        },
      );
    }
  }

  initRadioButton() {
    this.entityRadioButton = [
      { label: 'admtc', isVisible: false },
      { label: 'academic', isVisible: false },
      { label: 'company', isVisible: false },
      { label: 'group_of_schools', isVisible: false },
    ];
    this.schoolTypeRadioButton = [
      { label: 'certifier', isVisible: false },
      { label: 'preparation_center', isVisible: false },
    ];
  }

  getAutomaticHeight() {
    this.myInnerHeight = window.innerHeight - 103;
    return this.myInnerHeight;
  }

  setSelectedRadioBtn() {
    // if user only has 1 entity, then don't need to show entity radio button

    const unixUserType = _.uniqBy(this.entities, 'type.name');
    const unixEntities = _.uniqBy(this.entities, 'entity_name');

    this.isStudent = false;
    if (unixUserType && unixUserType.length) {
      const findUserTypeStudent = unixUserType.find((user) => user && user.type && user.type._id === '5a067bba1c0217218c75f8ab');
      if (findUserTypeStudent) {
        this.isStudent = true;
      } else {
        this.isStudent = false;
      }
    }
    if ((this.entities.length === 1 && unixUserType.length === 1) || (this.isStudent && unixUserType && unixUserType.length === 1)) {
      this.selectedEntityName = this.entities[0].entity_name;
      this.selectedSchoolType = this.entities[0] && this.entities[0].school_type ? this.entities[0].school_type : '';
      this.selectedUserType = this.entities[0] && this.entities[0].type ? this.entities[0].type._id : '';
      this.checked = true;
      this.isUserHasOneEntity = true;
    } else {
      let autologin = false;
      // const tempEntities = _.uniqBy(this.entities, 'entity_name');

      let unixSchoolType = [];
      let unixSchool = [];
      if (unixEntities && unixEntities.length && unixEntities[0].entity_name === 'academic') {
        unixSchoolType = _.uniqBy(this.entities, 'school_type');
        unixSchool = _.uniqBy(this.entities, 'school._id');
      }

      // ************** ADMTC auto login
      if (
        (this.entities && unixEntities.length === 1 && unixSchoolType.length <= 1 && unixSchool.length <= 1 && unixUserType.length === 1) ||
        (unixEntities.length && unixEntities[0].entity_name === 'admtc')
      ) {
        autologin = true;
      } else {
        autologin = false;
      }

      // ************** Student auto login
      // if (
      //   (this.entities && unixEntities.length === 1) && unixUserType.length === 1 || unixEntities[0].entity_name === 'admtc'
      // ) {
      //   autologin = true;
      // }

      // *************** User with 1 entity auto login
      if (this.entities && this.entities.length === 1) {
        autologin = true;
      }



      if (autologin) {
        autologin = false;
        this.entities.forEach((entity) => {
          this.schoolType.push(entity.school_type);
        });
        if (this.schoolType.length < 2) {
          autologin = true;
        } else {
          autologin = false;
          let schoolType = this.schoolType[0];

          this.schoolType.forEach((s) => {
            return (autologin = s === schoolType);
          });
        }
      }

      if (autologin) {
        this.selectedEntityName = this.entities[0].entity_name;
        this.selectedSchoolType = this.entities[0] && this.entities[0].school_type ? this.entities[0].school_type : '';
        this.selectedUserType = this.entities[0] && this.entities[0].type ? this.entities[0].type._id : '';
        this.checked = true;
        this.isUserHasOneEntity = true;
      } else {
        this.checked = false;
        this.isUserHasOneEntity = autologin;
        this.setRadioBtnVisibility();
      }
    }
  }

  // show user's entity and school type radio button
  setRadioBtnVisibility() {
    this.schoolTypeVisible = [];
    this.entityVisible = [];
    for (const entity of this.entities) {
      for (let i = 0; i < this.entityRadioButton.length; i++) {
        if (entity.entity_name === this.entityRadioButton[i].label) {
          this.entityRadioButton[i].isVisible = true;
          this.entityVisible.push(this.entityRadioButton[i]);
          this.entityVisible = _.uniqBy(this.entityVisible, 'label');
        }
      }
      for (let i = 0; i < this.schoolTypeRadioButton.length; i++) {
        if (entity.school_type === this.schoolTypeRadioButton[i].label) {
          this.schoolTypeRadioButton[i].isVisible = true;
          this.schoolTypeVisible.push(this.schoolTypeRadioButton[i]);
          this.schoolTypeVisible = _.uniqBy(this.schoolTypeVisible, 'label');
        }
      }
    }
  }

  login(value: { email: string; password: string }) {
    if (value && value.email) {
      value.email = value.email.toLowerCase();



      if (!this.checked && this.tempUserLogin) {
        this.checkedSwal();
        return;
      }

      if (value.email && value.password) {
        // check if user has only one entity
        if (this.isUserHasOneEntity) {
          this.callLoginAPi(value);
        } else {
          // switch to make sure the user select school type and school id if they login as academic entity
          if (!this.selectedEntityName) {
            this.checkedSwal();
          } else {
            switch (this.selectedEntityName) {
              case 'admtc':
              case 'company':
              case 'group_of_schools':
                this.callLoginAPi(value);
                break;
              case 'academic':
                if (this.selectedSchoolType && this.selectedSchoolId) {
                  if (this.userTypeList.length > 0 && !this.selectedUserType) {
                    Swal.fire({
                      type: 'warning',
                      title: this.translate.instant('USER_S18.TITLE'),
                      html: this.translate.instant('USER_S18.TEXT'),
                      footer: `<span style="margin-left: auto">USER_S18</span>`,
                      allowOutsideClick: false,
                      confirmButtonText: this.translate.instant('USER_S18.BUTTON'),
                    });
                  } else {
                    this.callLoginAPi(value);
                  }
                } else {
                  this.checkedSwal();
                }
                break;
            }
          }
        }
      }
    }
  }

  callLoginAPi(value: { email: string; password: string }) {
    this.isWaitingForResponse = true;

    this.subs.sink = this.authService.loginUser(value.email.toLowerCase(), value.password, this.returnUrl).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          const user = resp['data']['Login'];
          const userLogin = resp['data']['Login']['user'];
          this.tempUserLogin = userLogin;
          const entities = userLogin.entities.filter((ent) => {
            if (this.selectedEntityName === 'academic') {
              if (this.selectedSchoolId) {
                return (
                  ent.entity_name === this.selectedEntityName &&
                  ent.school_type === this.selectedSchoolType &&
                  ent.school._id === this.selectedSchoolId &&
                  ent.type._id === this.selectedUserType
                );
              } else {
                return (
                  ent.entity_name === this.selectedEntityName &&
                  ent.school_type === this.selectedSchoolType &&
                  ent.type._id === this.selectedUserType
                );
              }
            } else {
              return ent.entity_name === this.selectedEntityName;
            }
          });
          const sortedEntities = this.utilService.sortEntitiesByHierarchy(entities);
          const permissions = [];
          const permissionsId = [];
          if (sortedEntities && sortedEntities.length > 0) {
            sortedEntities.forEach((entity) => {
              permissions.push(entity.type.name);
              permissionsId.push(entity.type._id);
            });
          }

          const temp = userLogin;
          temp.entities = sortedEntities;
          user.user = temp;
          if (permissions && permissions.length) {
            // We need to validate if its student, we need to check if they have done their student admission
            // If student_title_status is admission, meaning that student need to complete their admission first(check the admission_status), else they can login
            // If admission_status received_inprogress then route to form
            // If admission_status received_not_completed show swal error they need to check with acad dept
            // If admission_status received_completed then allow login.
            const studentTypeId = '5a067bba1c0217218c75f8ab';
            let validationAdmission = true;
            if (permissionsId.findIndex((permission) => permission === studentTypeId) > -1) {
              // Check First if student_title_status is in admission or not.
              validationAdmission =
                userLogin && userLogin.student_id && userLogin.student_id.student_title_status === 'admission' ? false : true;
              // If admission_status received_inprogress then route to form admission
              if (!validationAdmission && (userLogin?.student_id?.admission_status === 'received_inprogress' || userLogin?.student_id?.admission_status === 'received_not_completed')) {
                this.isWaitingForResponse = true;
                this.authService.checkStudentAllowedToLoggin(userLogin?.student_id?._id).subscribe(
                  (resp) => {
                    if(resp) {
                      this.isWaitingForResponse = false;


                      // Add Checker if student already submit their form or not. if form is still active and they already submit form(waiting validation)
                      // Then allow direct login
                      if ((resp === 'allowed not pass due date' || resp === 'allowed pass due date') && userLogin?.last_admission_status === 'admission_need_validation') {
                        this.authService.setLocalUserProfileAndToken(user);
                        this.authService.setPermission([permissions[0]]);
                        this.ngxPermissionService.flushPermissions();
                        this.ngxPermissionService.loadPermissions([permissions[0]]);
                        const domainUrl = this.router.url.split('/')[0];
                        if (this.returnUrl && permissionsId.findIndex((permission) => permission === '5a067bba1c0217218c75f8ab') === -1) {
                          this.router.navigateByUrl(this.returnUrl);
                        } else if (
                          permissionsId.findIndex(
                            (permission) => permission === '5a2e603c53b95d22c82f958f' || permission === '5a2e603f53b95d22c82f9590',
                          ) > -1
                        ) {
                          // use window.open to hard reload the page so the styling in login page doesnt broke the styling in other page
                          window.open(`${domainUrl}/students-card`, '_self');
                        } else if (permissionsId.findIndex((permission) => permission === '5a66cd0813f5aa05902fac1e') > -1) {
                          window.open(`${domainUrl}/school`, '_self');
                        } else if (permissionsId.findIndex((permission) => permission === '5a067bba1c0217218c75f8ab') > -1) {
                          this.studentLogin(user, permissions[0], 'ifr');
                        } else {
                          window.open(`${domainUrl}/`, '_self');
                        }

                        return;
                      }

                      if(resp === 'allowed not pass due date') {
                        Swal.fire({
                          type: 'warning',
                          title: this.translate.instant('UserForm_S19.TITLE'),
                          html: this.translate.instant('UserForm_S19.TEXT'),
                          confirmButtonText: this.translate.instant('UserForm_S19.CONFIRM'),
                          footer: `<span style="margin-left: auto">UserForm_S19</span>`,
                          showCancelButton: true,
                          cancelButtonColor: '#3085d6',
                          cancelButtonText: this.translate.instant('UserForm_S19.CANCEL'),
                        }).then((result) => {
                          if (result.value) {
                            const domainUrl = this.router.url.split('/')[0];
                            window.open(
                              `${domainUrl}/form-fill?formId=${userLogin.student_id.admission_process_id._id}&formType=student_admission&userId=${userLogin._id}&userTypeId=${studentTypeId}`,
                              '_blank',
                            );
                          } else if (result.dismiss) {
                            this.authService.setLocalUserProfileAndToken(user);
                            this.authService.setPermission([permissions[0]]);
                            this.ngxPermissionService.flushPermissions();
                            this.ngxPermissionService.loadPermissions([permissions[0]]);
                            const domainUrl = this.router.url.split('/')[0];
                            if (this.returnUrl && permissionsId.findIndex((permission) => permission === '5a067bba1c0217218c75f8ab') === -1) {
                              this.router.navigateByUrl(this.returnUrl);
                            } else if (
                              permissionsId.findIndex(
                                (permission) => permission === '5a2e603c53b95d22c82f958f' || permission === '5a2e603f53b95d22c82f9590',
                              ) > -1
                            ) {
                              // use window.open to hard reload the page so the styling in login page doesnt broke the styling in other page
                              window.open(`${domainUrl}/students-card`, '_self');
                            } else if (permissionsId.findIndex((permission) => permission === '5a66cd0813f5aa05902fac1e') > -1) {
                              window.open(`${domainUrl}/school`, '_self');
                            } else if (permissionsId.findIndex((permission) => permission === '5a067bba1c0217218c75f8ab') > -1) {
                              this.studentLogin(user, permissions[0], 'ifr');
                            } else {
                              window.open(`${domainUrl}/`, '_self');
                            }
                          }
                        });
                      } else if(resp === 'allowed pass due date'){
                        Swal.fire({
                          type: 'warning',
                          title: this.translate.instant('UserForm_S20.TITLE'),
                          html: this.translate.instant('UserForm_S20.TEXT'),
                          footer: `<span style="margin-left: auto">UserForm_S20</span>`,
                          confirmButtonText: this.translate.instant('UserForm_S20.CONFIRM'),
                        }).then((result) => {
                          if (result.value) {
                            const domainUrl = this.router.url.split('/')[0];
                            window.open(
                              `${domainUrl}/form-fill?formId=${userLogin.student_id.admission_process_id._id}&formType=student_admission&userId=${userLogin._id}&userTypeId=${studentTypeId}`,
                              '_blank',
                            );
                          }
                        });
                      } else if(resp === 'not allowed') {
                        Swal.fire({
                          type: 'warning',
                          title: this.translate.instant('StudAdmission_S01.Title'),
                          html: this.translate.instant('StudAdmission_S01.Text'),
                          footer: `<span style="margin-left: auto">StudAdmission_S01</span>`,
                          confirmButtonText: this.translate.instant('StudAdmission_S01.Button'),
                        })
                      }
                    }
                  (err) => {
                    this.isWaitingForResponse = false;
                  }
                })
                // this.checkStudentAdmissionDueDate(user, userLogin, permissions, permissionsId);
              }
              // If admission_status received_completed then allow login.
              else if (!validationAdmission && userLogin.student_id.admission_status === 'received_completed') {
                validationAdmission = true;
              }
            }

            // Allow login if validation admission is OK
            if (validationAdmission) {
              this.authService.setLocalUserProfileAndToken(user);
              this.authService.setPermission([permissions[0]]);
              this.ngxPermissionService.flushPermissions();
              this.ngxPermissionService.loadPermissions([permissions[0]]);
              const domainUrl = this.router.url.split('/')[0];
              if (this.returnUrl && permissionsId.findIndex((permission) => permission === '5a067bba1c0217218c75f8ab') === -1) {
                this.router.navigateByUrl(this.returnUrl);
              } else if (
                permissionsId.findIndex(
                  (permission) => permission === '5a2e603c53b95d22c82f958f' || permission === '5a2e603f53b95d22c82f9590',
                ) > -1
              ) {
                // use window.open to hard reload the page so the styling in login page doesnt broke the styling in other page
                window.open(`${domainUrl}/students-card`, '_self');
              } else if (permissionsId.findIndex((permission) => permission === '5a66cd0813f5aa05902fac1e') > -1) {
                window.open(`${domainUrl}/school`, '_self');
              } else if (permissionsId.findIndex((permission) => permission === '5a067bba1c0217218c75f8ab') > -1) {
                this.studentLogin(user, permissions[0], 'ifr');
              } else {
                window.open(`${domainUrl}/`, '_self');
              }
            }
          } else {
            this.getUserEntities('continue-login', value);
          }
        } else {
          this.tempUserLogin = null;
        }
      },
      (err) => {
        this.tempUserLogin = null;
        this.isWaitingForResponse = false;
        this.incorrectLogin = true;
        const ErrorMessage = JSON.stringify(err);
        if (ErrorMessage && !ErrorMessage.includes('Password Not Valid')) {
          this.authService.postErrorLog(JSON.stringify(err));
        }
      },
    );
  }

  getSchools(schoolType: string) {
    this.schoolIdList = [];
    this.schools = [];
    this.userTypeList = [];
    this.selectedSchoolType = schoolType;

    // get entity of selected school type
    const entitiesOfSchoolType = this.entities.filter((entity) => {
      return entity.school_type === this.selectedSchoolType;
    });

    // get all school id of filtered school
    entitiesOfSchoolType.forEach((entity) => {
      const index = this.schoolIdList.findIndex((indexEn) => {
        return indexEn === entity.school._id;
      });
      if (index < 0) {
        this.schoolIdList.push(entity.school._id);
      }
    });

    // get all filtered school data from API
    for (let i = 0; i < this.schoolIdList.length; i++) {
      this.subs.sink = this.schoolService.getSchoolIdAndShortName(this.schoolIdList[i]).subscribe((resp) => {
        this.schools.push({
          _id: resp._id,
          shortName: resp.short_name,
        });
        this.schools = _.uniqBy(this.schools, 'shortName');

        if (this.schools.length === 1) {
          this.setSelectedSchool(this.schools[0]);
          this.isSchoolTypeHasOneSchool = true;
        } else {
          this.checked = false;
          this.isSchoolTypeHasOneSchool = false;
        }
      });
    }
    this.getUserType();
  }

  getUserType() {
    this.userTypeList = [];
    let entitySelected = [];
    if (this.selectedEntityName) {
      entitySelected = this.entities.filter((entity) => {
        return entity.entity_name === this.selectedEntityName;
      });
    }
    if (this.selectedEntityName === 'academic') {
      if (this.selectedSchoolType) {
        entitySelected = entitySelected.filter((entity) => {
          return entity.school_type === this.selectedSchoolType;
        });
      }
      if (this.selectedSchoolId) {
        entitySelected = entitySelected.filter((entity) => {
          return entity.school && entity.school._id === this.selectedSchoolId;
        });
      }
    }
    if (entitySelected && entitySelected.length) {
      this.userTypeList = entitySelected.map((entity) => {
        return { value: entity.type._id, label: entity.type.name };
      });
      this.userTypeList = _.uniqBy(this.userTypeList, 'value');
    }
  }

  setSelectedUserType(data) {
    this.selectedUserType = data.value;
  }

  setEntityChecked(entity: string) {
    // if checked false, sweet alert will appear to prevent user to log in.
    // if user select entity ADMTC, company or group of school. then let them log in
    this.checked = entity !== 'academic';
    this.selectedEntityName = entity;

  }

  setSelectedSchool(school: School) {
    this.selectedSchoolId = school._id;
    // dont show swal if user already select school radio button
    this.checked = true;
    this.getUserType();
  }

  checkStudentAdmissionDueDate(user, userLogin, permissions, permissionsId) {
    const studentTypeId = '5a067bba1c0217218c75f8ab';
    const today = moment();
    let admissionDate = moment();
    let admissionSevenDate = moment();
    if (userLogin && userLogin.student_id && userLogin.student_id) {
      const studentData = _.cloneDeep(userLogin.student_id);
      if (studentData.admission_due_date && studentData.admission_due_date.date && studentData.admission_due_date.time) {
        admissionDate = this.ParseUTCToLocal.transformDateInDateFormat(
          studentData.admission_due_date.date,
          studentData.admission_due_date.time,
        );
      }
      if (studentData.admission_due_date_seven && studentData.admission_due_date_seven.date && studentData.admission_due_date_seven.time) {
        admissionSevenDate = this.ParseUTCToLocal.transformDateInDateFormat(
          studentData.admission_due_date_seven.date,
          studentData.admission_due_date_seven.time,
        );
      }
    }

    if (today.isSameOrBefore(admissionDate)) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('UserForm_S19.TITLE'),
        html: this.translate.instant('UserForm_S19.TEXT'),
        confirmButtonText: this.translate.instant('UserForm_S19.CONFIRM'),
        footer: `<span style="margin-left: auto">UserForm_S19</span>`,
        showCancelButton: true,
        cancelButtonColor: '#3085d6',
        cancelButtonText: this.translate.instant('UserForm_S19.CANCEL'),
      }).then((result) => {
        if (result.value) {
          const domainUrl = this.router.url.split('/')[0];
          window.open(
            `${domainUrl}/form-fill?formId=${userLogin.student_id.admission_process_id._id}&formType=student_admission&userId=${userLogin._id}&userTypeId=${studentTypeId}`,
            '_blank',
          );
        } else if (result.dismiss) {
          this.authService.setLocalUserProfileAndToken(user);
          this.authService.setPermission([permissions[0]]);
          this.ngxPermissionService.flushPermissions();
          this.ngxPermissionService.loadPermissions([permissions[0]]);
          const domainUrl = this.router.url.split('/')[0];
          if (this.returnUrl && permissionsId.findIndex((permission) => permission === '5a067bba1c0217218c75f8ab') === -1) {
            this.router.navigateByUrl(this.returnUrl);
          } else if (
            permissionsId.findIndex(
              (permission) => permission === '5a2e603c53b95d22c82f958f' || permission === '5a2e603f53b95d22c82f9590',
            ) > -1
          ) {
            // use window.open to hard reload the page so the styling in login page doesnt broke the styling in other page
            window.open(`${domainUrl}/students-card`, '_self');
          } else if (permissionsId.findIndex((permission) => permission === '5a66cd0813f5aa05902fac1e') > -1) {
            window.open(`${domainUrl}/school`, '_self');
          } else if (permissionsId.findIndex((permission) => permission === '5a067bba1c0217218c75f8ab') > -1) {
            this.studentLogin(user, permissions[0], 'ifr');
          } else {
            window.open(`${domainUrl}/`, '_self');
          }
        }
      });
    } else if (today.isAfter(admissionDate)) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('UserForm_S20.TITLE'),
        html: this.translate.instant('UserForm_S20.TEXT'),
        footer: `<span style="margin-left: auto">UserForm_S20</span>`,
        confirmButtonText: this.translate.instant('UserForm_S20.CONFIRM'),
      }).then((result) => {
        if (result.value) {
          const domainUrl = this.router.url.split('/')[0];
          window.open(
            `${domainUrl}/form-fill?formId=${userLogin.student_id.admission_process_id._id}&formType=student_admission&userId=${userLogin._id}&userTypeId=${studentTypeId}`,
            '_blank',
          );
        }
      });
    }
  }

  studentLogin(user: any, permissions: any, frame: string) {
    this.forStudentLogin = true;
    this.authService.removeLocalUserProfile();
    const iframe = document.getElementById(frame) as HTMLIFrameElement;

    if (iframe) {
      this.authService.connectAsStudentFromLoginPage(user, permissions, frame);
    } else {
      setTimeout(() => {
        this.studentLogin(user, permissions, frame);
      }, 100);
    }
  }

  checkedSwal() {
    if (!this.checked) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('REGISTER_MESSAGE.TITLE'),
        footer: `<span style="margin-left: auto">REGISTER_MESSAGE</span>`,
        allowOutsideClick: false,
        confirmButtonText: this.translate.instant('OK'),
      });
    }
  }

  swalNewPassword() {
    Swal.fire({
      title: this.translate.instant('LOGIN_AFTER_RESET.TITLE'),
      html: this.translate.instant('LOGIN_AFTER_RESET.TEXT'),
      footer: `<span style="margin-left: auto">LOGIN_AFTER_RESET</span>`,
      type: 'warning',
      confirmButtonText: this.translate.instant('LOGIN_AFTER_RESET.BUTTON'),
      allowOutsideClick: false,
    }).then((result) => {});
  }

  getPromotionData() {
    this.subs.sink = this.promoService.getAllPromo().subscribe((promos) => {

      if (promos) {
        const loginPromos = promos.filter((promo) => promo.for_login_page);
        if (loginPromos && loginPromos.length > 0) {
          this.sessionSlider.push(...loginPromos);
          this.showSessionSlider = true;
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
