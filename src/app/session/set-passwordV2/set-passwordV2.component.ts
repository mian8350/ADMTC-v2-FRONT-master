import { environment } from 'environments/environment';
import { Component, ViewEncapsulation, OnInit, OnDestroy } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../service/auth-service/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { ApplicationUrls, GlobalConstants } from '../../shared/settings';
import Swal from 'sweetalert2';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { UserProfileData } from '../../users/user.model';
import { UserService } from '../../service/user/user.service';
import { School } from '../../school/School.model';
import { NgxPermissionsService } from 'ngx-permissions';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { AppPermission } from 'app/models/app-permission.model';
import { UtilityService } from 'app/service/utility/utility.service';
import { PromoService } from 'app/service/promo/promo.service';

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: UntypedFormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const invalidCtrl = !!(control && control.invalid && control.parent.dirty);
    const invalidParent = !!(control && control.parent && control.parent.invalid && control.parent.dirty);

    return invalidCtrl || invalidParent;
  }
}

@Component({
  selector: 'ms-set-password',
  templateUrl: './set-passwordV2.component.html',
  styleUrls: ['./set-passwordV2.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class SetPasswordV2Component implements OnInit, OnDestroy {
  private subs = new SubSink();
  userData: any;
  schools: School[] = [];
  entities: any[];
  schoolIdList: string[] = [];
  password: string;
  confirmPassword: string;
  chechbox = false;
  showCookieInfo = true;
  token: string;
  isForgotPassword = false;
  isAcademic: any;
  isADMTC: any;
  isGroupSchool: any;
  isCompany: any;
  isStudent: any;
  schoolLength: any;
  setPasswordForm: UntypedFormGroup;
  matcher: ErrorStateMatcher;
  isWaitingForResponse = false;
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

  returnUrl = '';
  isReturnUrl = false;
  appData: AppPermission;
  _studentDomain = environment.studentEnvironment;

  constructor(
    private userService: UserService,
    public authService: AuthService,
    public router: Router,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private fb: UntypedFormBuilder,
    private ngxPermissionService: NgxPermissionsService,
    private promoService: PromoService,
    public utilService: UtilityService,
  ) {}

  ngOnInit() {
    this.getAppData();
    this.getPromotionData();
    setTimeout(() => {
      this.checkIfTokenExpired();
    }, 500);
    this.setPasswordForm = this.fb.group(
      {
        password: [''],
        confirmPassword: [''],
      },
      { validator: this.checkPassword },
    );

    this.matcher = new MyErrorStateMatcher();
    const userId = this.route.snapshot.paramMap.get('userId');
    this.getUserById(userId);
    this.subs.sink = this.route.queryParamMap.subscribe((params) => {
      this.token = params.get('token');
      const forgot = params.get('forgot');



      if (forgot) {
        this.isForgotPassword = true;
      }

    });

    if (this.route.snapshot.queryParamMap.get('returnUrl')) {

      this.returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      this.isReturnUrl = true;
    }
  }
  get studentDomain() {
    return `${this._studentDomain}/session/login`;
  }

  checkIfTokenExpired() {
    if (this.route && this.route.snapshot && this.route.snapshot.queryParamMap) {

      const token = this.route.snapshot.queryParamMap.get('token');
      this.authService.checkLinkStatus(token).subscribe((resp) => {

        if (resp) {
          if (resp && resp.errors && resp.errors.length && resp.errors[0].message === 'jwt expired') {
            Swal.fire({
              type: 'error',
              allowOutsideClick: false,
              title: this.translate.instant('USER_LINK_EXPIRED.TITLE'),
              text: this.translate.instant('USER_LINK_EXPIRED.TEXT'),
              footer: `<span style="margin-left: auto">USER_LINK_EXPIRED</span>`,
              showConfirmButton: true,
              allowEnterKey: false,
              allowEscapeKey: false,
              confirmButtonText: this.translate.instant('USER_LINK_EXPIRED.BUTTON'),
            }).then((result) => {
              this.router.navigate(['/session/forgot-password']);
            });
          } else if (resp && resp.data && resp.data.CheckLinkStatus === null) {
            Swal.fire({
              type: 'error',
              allowOutsideClick: false,
              title: this.translate.instant('USER_LINK_EXPIRED.TITLE'),
              text: this.translate.instant('USER_LINK_EXPIRED.TEXT'),
              footer: `<span style="margin-left: auto">USER_LINK_EXPIRED</span>`,
              showConfirmButton: true,
              allowEnterKey: false,
              allowEscapeKey: false,
              confirmButtonText: this.translate.instant('USER_LINK_EXPIRED.BUTTON'),
            }).then((result) => {
              this.router.navigate(['/session/forgot-password']);
            });
          } else if (resp && resp.data && resp.data.CheckLinkStatus === 'Link Already Used') {
              this.router.navigate(['/session/login']);
          }
        }
      });
    }
  }

  getAppData() {
    this.utilService.getAppPermission().subscribe((resp) => {
      this.appData = resp;
    });
  }

  checkPassword(group: UntypedFormGroup) {
    const pass = group.get('password').value;
    const confirmPass = group.get('confirmPassword').value;
    return pass === confirmPass ? null : { missMatch: true };
  }

  /**
   * send method is used to send a reset password link into your email.
   */
  send() {
    if (this.setPasswordForm.get('password').value === this.setPasswordForm.get('confirmPassword').value) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.authService.setPassword(this.token, this.setPasswordForm.get('password').value).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          const test = JSON.stringify(this.userData);
          if (this.isForgotPassword) {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('USER_S1.TITLE'),
              text: this.translate.instant('USER_S1.TEXT'),
              footer: `<span style="margin-left: auto">USER_S1</span>`,
              showConfirmButton: true,
              confirmButtonText: this.translate.instant('USER_S1.BUTTON'),
              allowOutsideClick: false,
            }).then((isComfirm) => {
              let autologin = false;

              if (this.entities && this.entities.length < 2) {
                const entityName = this.entities[0].entity_name; // user has only one entity !!!

                autologin = true;
              } else {
                autologin = false;
                const EntitiesData = this.getUniqueEntity(this.entities);

                if (EntitiesData && EntitiesData.length < 2) {
                  if (EntitiesData[0].entity_name === 'academic') {
                    const typeSchool = this.getUniqueSchoolType(this.entities);

                    if (typeSchool && typeSchool.length < 2) {
                      this.schoolLength = this.getUniqueSchools(this.entities);
                      if (this.schoolLength && this.schoolLength.length > 1) {
                        autologin = false;
                      } else {
                        autologin = true;
                      }
                    } else {
                      autologin = false;
                    }
                  } else {
                    autologin = true;
                  }
                } else {

                  this.isAcademic = null;
                  const entityName = 'academic';
                  this.isAcademic = _.filter(this.entities, function (entity) {
                    return entity.entity_name === entityName;
                  });
                  if (this.isAcademic && this.isAcademic.length) {
                    autologin = true;
                    let typeSchool = this.getUniqueSchoolType(this.entities);
                    typeSchool = _.filter(typeSchool, function (entity) {
                      return entity.school_type !== null;
                    });

                    if (typeSchool && typeSchool.length < 2) {
                      this.schoolLength = this.getUniqueSchools(this.entities);

                      if (this.schoolLength && this.schoolLength.length > 1) {
                        autologin = false;
                      } else {
                        autologin = true;
                      }
                    } else {
                      autologin = false;
                    }
                  } else {
                    autologin = false;
                  }
                }
              }

              if (autologin) {
                const permissions = [];
                const entityName = this.entities[0].entity_name;
                permissions.push(this.entities[0].type.name);

                this.autoLogin(entityName, permissions);
              } else {

                this.router.navigate(['/session/login', 'reset-success']);
              }
            });
          } else {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('USER_S4.TITLE'),
              text: this.translate.instant('USER_S4.TEXT'),
              footer: `<span style="margin-left: auto">USER_S4</span>`,
              showConfirmButton: true,
              confirmButtonText: this.translate.instant('USER_S4.BUTTON'),
              allowOutsideClick: false,
            }).then((isComfirm) => {
              let autologin = false;


              if (this.entities && this.entities.length < 2) {
                const entityName = this.entities[0].entity_name; // user has only one entity !!!

                autologin = true;
              } else {
                autologin = false;
                const EntitiesData = this.getUniqueEntity(this.entities);

                if (EntitiesData && EntitiesData.length < 2) {
                  if (EntitiesData[0].entity_name === 'academic') {
                    const typeSchool = this.getUniqueSchoolType(this.entities);

                    if (typeSchool && typeSchool.length < 2) {
                      this.schoolLength = this.getUniqueSchools(this.entities);
                      if (this.schoolLength && this.schoolLength.length > 1) {
                        autologin = false;
                      } else {
                        autologin = true;
                      }
                    } else {
                      autologin = false;
                    }
                  } else {
                    autologin = true;
                  }
                } else {

                  this.isAcademic = null;
                  const entityName = 'academic';
                  this.isAcademic = _.filter(this.entities, function (entity) {
                    return entity.entity_name === entityName;
                  });
                  if (this.isAcademic && this.isAcademic.length) {
                    autologin = true;
                    let typeSchool = this.getUniqueSchoolType(this.entities);
                    typeSchool = _.filter(typeSchool, function (entity) {
                      return entity.school_type !== null;
                    });

                    if (typeSchool && typeSchool.length < 2) {
                      this.schoolLength = this.getUniqueSchools(this.entities);
                      if (this.schoolLength && this.schoolLength.length > 1) {
                        autologin = false;
                      } else {
                        autologin = true;
                      }
                    } else {
                      autologin = false;
                    }
                  } else {
                    autologin = false;
                  }
                }
              }
              if (autologin) {
                const permissions = [];
                const entityName = this.entities[0].entity_name;
                permissions.push(this.entities[0].type.name);

                // when set password as student should redirect to login page because to check admission
                if (this.entities[0].type.name === 'Student') {
                  this.router.navigate(['/session/login']);
                } else {
                  this.autoLogin(entityName, permissions);
                }
              } else {

                this.router.navigate(['/session/login', 'reset-success']);
              }
            });
          }
        },
        (error) => {
          this.isWaitingForResponse = false;

          Swal.fire({
            type: 'error',
            allowOutsideClick: false,
            title: this.translate.instant('USER_S2.TITLE'),
            text: this.translate.instant('USER_S2.TEXT'),
            footer: `<span style="margin-left: auto">USER_S2</span>`,
            showConfirmButton: true,
            confirmButtonText: this.translate.instant('USER_S1.BUTTON'),
          });
        },
      );
    }
  }

  autoLogin(entity, permissions) {
    this.subs.sink = this.authService
      .loginUser(this.userData.email.toLowerCase(), this.setPasswordForm.get('password').value, this.returnUrl)
      .subscribe((resp) => {
        if (resp) {
          const userLogin = resp['data']['Login']['user'];
          const user = resp['data']['Login'];

          if(this.isStudent){
            this.authService.connectAsStudentFromLoginPage(user, permissions, 'ifr');
          }else{
            this.authService.setLocalUserProfileAndToken(user);
            this.authService.setPermission(permissions);
            this.ngxPermissionService.flushPermissions();
            this.ngxPermissionService.loadPermissions(permissions);  
            if (this.isReturnUrl) {

              this.router.navigateByUrl(this.returnUrl);
            } else {
              this.router.navigateByUrl('/');
            }
          }
        }
      });
  }

  gotoPrivacyPolicy() {
    const privacyPolicylink = document.createElement('a');
    privacyPolicylink.target = '_blank';
    const isStudent = this.entities && this.entities.length && this.entities[0]?.type?.name === 'Student';

    if (isStudent) {
      if (this.translate.currentLang.toLowerCase() === 'en') {
        privacyPolicylink.href = GlobalConstants.privacyPolicy.ENLinkStudent;
      } else {
        privacyPolicylink.href = GlobalConstants.privacyPolicy.FRLinkStudent;
      }
    } else {
      if (this.translate.currentLang.toLowerCase() === 'en') {
        privacyPolicylink.href = GlobalConstants.privacyPolicy.ENLink;
      } else {
        privacyPolicylink.href = GlobalConstants.privacyPolicy.FRLink;
      }
    }

    privacyPolicylink.setAttribute('visibility', 'hidden');
    document.body.appendChild(privacyPolicylink);
    privacyPolicylink.click();
    document.body.removeChild(privacyPolicylink);
  }

  hideConcentText() {
    this.showCookieInfo = false;
  }

  private getUserById(userId: string) {

    this.subs.sink = this.authService.getUserById(userId).subscribe((res) => {
      this.userData = res;
      this.entities = res.entities;
      this.isStudent = this.entities?.length && this.entities[0]?.type?.name === 'Student'
    });
  }

  getUniqueSchools(entities) {
    const newEntity = _.filter(entities, function (entity) {
      return entity.school !== null;
    });
    return _.uniqBy(newEntity, 'school.short_name');
  }
  getUniqueSchoolType(entities) {
    return _.uniqBy(entities, 'school_type');
  }
  getUniqueEntity(entities) {
    return _.uniqBy(entities, 'entity_name');
  }

  getPromotionData() {
    this.subs.sink = this.promoService.getAllPromo().subscribe((promos) => {

      if (promos) {
        const loginPromos = promos.filter((promo) => promo.for_set_password_page);
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
