import { UserDeactivationDialogComponent } from './../../user-deactivation-dialog/user-deactivation-dialog.component';
import { Router } from '@angular/router';
import { UtilityService } from './../../../service/utility/utility.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { PermissionService } from 'app/service/permission/permission.service';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { UserEmailDialogComponent } from 'app/users/user-email-dialog/user-email-dialog.component';
import { AfterViewInit, Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatTabGroup } from '@angular/material/tabs';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UsersService } from 'app/service/users/users.service';
import { ApplicationUrls } from 'app/shared/settings';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { environment } from 'environments/environment';
import { UserService } from 'app/service/user/user.service';
import * as moment from 'moment';
import { UserTableData } from 'app/users/user.model';
import { LoginAsUserDialogComponent } from 'app/shared/components/login-as-user-dialog/login-as-user-dialog.component';
import { ModifyUserTypeDialogComponent } from './user-details-parent-tabs/user-details-usertype-tab/modify-user-type-dialog/modify-user-type-dialog.component';
import { IncorrectUsersEmailDialogComponent } from 'app/shared/components/incorrect-users-email-dialog/incorrect-users-email-dialog.component';

@Component({
  selector: 'ms-user-details',
  templateUrl: './user-details.component.html',
  styleUrls: ['./user-details.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class UserDetailsComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  @Input() userId;
  @Input() status;
  @Input() tab;
  @Output() reload: EventEmitter<any> = new EventEmitter();
  @Output() loading: EventEmitter<boolean> = new EventEmitter();
  @ViewChild('candidateMatGroup', { static: false }) candidateMatGroup: MatTabGroup;
  @ViewChild('admissionStatus', { static: false }) matMenuTrigger: MatMenuTrigger;
  user: any = {};
  isWaitingForResponse: Boolean = true;
  private subs = new SubSink();
  tabs = {
    'note-tab': 'Add a Note',
    'history-tab': 'Candidate history',
    'edit-tab': 'Modifications',
    'evolution-tab': 'Evolution',
  };
  mailUser: MatDialogRef<UserEmailDialogComponent>;

  maleCandidateIcon = '../../../../../assets/img/student_icon.png';
  femaleCandidateIcon = '../../../../../assets/img/student_icon_fem.png';
  neutralStudentIcon = '../../../../../assets/img/student_icon_neutral.png';
  userProfilePic = '../../../../../assets/img/user-1.jpg';
  userProfilePic1 = '../../../../../assets/img/user-3.jpg';
  userProfilePic2 = '../../../../../assets/img/user-5.jpg';
  greenHeartIcon = '../../../../../assets/img/enagement_icon_green.png';
  selectedIndex = 0;
  userData = [];
  personalSituation = false;
  restrictiveCondition = false;
  studentStatusList = [];
  listStatusAdmitted = [{ value: 'resign', key: 'Resign' }];
  listStatusEngaged = [{ value: 'resigned_after_engaged', key: 'Resign after engaged' }];
  listStatusRegistered = [{ value: 'resigned_after_registered', key: 'Resign after registered' }];
  currentUser: any;
  UserDeactivationDialogComponent: MatDialogRef<UserDeactivationDialogComponent>;
  deleteConfig: MatDialogConfig = {
    disableClose: true,
    panelClass: 'no-max-height',
    width: '600px',
    maxHeight: '75vh',
  };
  private timeOutVal: any;
  private intVal: any;
  constructor(
    public dialog: MatDialog,
    private translate: TranslateService,
    private authService: AuthService,
    private usersService: UsersService,
    private userService: UserService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    public permissionService: PermissionService,
    private ngxPermissionService: NgxPermissionsService,
    private utilService: UtilityService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.moveToTab(this.tab);
  }
  ngAfterViewInit() {
    this.moveToTab(this.tab);
  }
  ngOnChanges() {
    this.getOneUser();
    this.currentUser = this.authService.getCurrentUser();
  }

  getOneUser() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.userService.getOneUserCard(this.userId, this.status).subscribe(
      (user) => {
        this.isWaitingForResponse = false;
        if (user) {
          this.user = user;
          if (this.user.entities && !this.user.entities.length) {

            this.swalNoUsertype(user);
          }
        }
      },
      (error) => {

        this.isWaitingForResponse = false;
      },
    );
  }

  swalNoUsertype(user) {
    Swal.fire({
      allowOutsideClick: false,
      type: 'warning',
      title: this.translate.instant('AddUser_S1.TITLE', {
        civility: this.translate.instant(user.civility),
        first_name: user.first_name,
        last_name: user.last_name,
      }),
      html: this.translate.instant('AddUser_S1.TEXT', {
        civility: this.translate.instant(user.civility),
        first_name: user.first_name,
        last_name: user.last_name,
      }),
      footer: `<span style="margin-left: auto">AddUser_S1</span>`,
      showCancelButton: true,
      cancelButtonText: this.translate.instant('AddUser_S1.BUTTON 2'),
      confirmButtonText: this.translate.instant('AddUser_S1.BUTTON 1'),
    }).then((isConfirm) => {
      if (isConfirm.value) {

        this.addUserType();
      }
    });
  }

  addUserType() {
    this.subs.sink = this.dialog
      .open(ModifyUserTypeDialogComponent, {
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        width: '1100px',
        data: {
          userId: this.userId,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        this.getOneUser();
      });
  }

  convertUTCToLocalDate(data) {
    const date = moment.utc(data).format('DD/MM/YYYY');
    const time = moment.utc(data).format('HH:mm');

    const timeLocal = this.parseUTCtoLocal.transform(time);
    const dateLocal = this.parseUTCtoLocal.transformDate(date, time);

    return dateLocal + ' - ' + timeLocal;
  }

  formatDate(data) {
    if(!data || !data.date && !data.time) {
      return '-'
    }    
    const timeLocal = this.parseUTCtoLocal.transform(data.time);
    const dateLocal = this.parseUTCtoLocal.transformDate(data.date, data.time);

    return dateLocal + ' ' + timeLocal;
  }

  transformDateTime(dateTime) {
    return moment(dateTime).format('DD/MM/YYYY') + ' - ' + moment(dateTime).format('HH:MM');
  }

  sendMail(data) {
    this.dialog.open(UserEmailDialogComponent, {
      disableClose: true,
      width: '750px',
      data: data,
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    clearInterval(this.intVal);
    this.subs.unsubscribe();
  }

  moveToTab(tab) {
    if (tab) {
      switch (tab) {
        case 'Identity':
          this.selectedIndex = 2;
          break;
        case 'Contact':
          this.selectedIndex = 3;
          break;
        default:
          this.selectedIndex = 0;
      }
    }
  }

  nextStep(value) {
    if (value) {
      this.moveToTab(value);
    }
  }

  reloadData(value) {
    if (value) {
      this.getOneUser();
      this.reload.emit(true);
    }
  }

  loadingData(value) {
    this.loading.emit(value);
  }

  downloadCV() {
    const fileUrl = this.user.curriculum_vitae ? this.user.curriculum_vitae.s3_path : null;
    if (fileUrl) {
      const a = document.createElement('a');
      a.target = 'blank';
      a.href = `${environment.apiUrl}/fileuploads/${fileUrl}?download=true`.replace('/graphql', '');
      a.click();
      a.remove();
    }
  }

  connectAsUser(user: UserTableData) {
    const currentUser = this.utilService.getCurrentUser();
    const unixUserType = _.uniqBy(user.entities, 'type.name');
    const unixEntities = _.uniqBy(user.entities, 'entity_name');
    let unixSchoolType = [];
    let unixSchool = [];
    if (unixEntities && unixEntities.length && unixEntities[0].entity_name === 'academic') {
      unixSchoolType = _.uniqBy(user.entities, 'school_type');
      unixSchool = _.uniqBy(user.entities, 'school._id');
    }

    if (user.entities && unixEntities.length === 1 && unixSchoolType.length <= 1 && unixSchool.length <= 1 && unixUserType.length === 1) {
      this.subs.sink = this.authService.loginAsUser(currentUser._id, user._id).subscribe((resp) => {
        if (resp) {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('SUCCESS'),
            html: this.translate.instant('USER_S7_SUPERUSER.TEXT', {
              UserCivility: this.translate.instant(user.civility),
              UserFirstName: user.first_name,
              UserLastName: user.last_name,
            }),
            footer: `<span style="margin-left: auto">USER_S7_SUPERUSER</span>`,
            allowEscapeKey: true,
            allowOutsideClick: false,
            confirmButtonText: this.translate.instant('UNDERSTOOD'),
          }).then((result) => {
            this.authService.backupLocalUserProfileAndToken();
            const tempResp = _.cloneDeep(resp);


            let sortedEntities = [];
            sortedEntities = this.utilService.sortEntitiesByHierarchy(tempResp.user.entities);
            const temp = tempResp.user;
            temp.entities = sortedEntities;
            tempResp.user = temp;

            this.authService.setLocalUserProfileAndToken(tempResp);
            this.authService.setPermission([sortedEntities[0].type.name]);
            this.ngxPermissionService.flushPermissions();
            this.ngxPermissionService.loadPermissions([sortedEntities[0].type.name]);
            this.userService.reloadCurrentUser(true);
            if (this.ngxPermissionService.getPermission('Mentor') || this.ngxPermissionService.getPermission('HR')) {
              this.router.navigate(['/students-card']);
            } else if (this.ngxPermissionService.getPermission('Chief Group Academic')) {
              this.router.navigate(['/school-group']);
            } else if (this.ngxPermissionService.getPermission('Student')) {
              this.router.navigate(['/my-file']);
            } else {
              this.router.navigate(['/rncpTitles']);
            }
          });
        }
      });
    } else {
      // if user has multiple entity, show dialog to choose entity
      this.dialog.open(LoginAsUserDialogComponent, {
        disableClose: true,
        panelClass: 'certification-rule-pop-up',
        width: '615px',
        data: user,
      });
    }
  }
  incorrectPassword(userId: string, civility: string, firstName: string, lastName: string) {
    let timeDisabled = 5;
    Swal.fire({
      allowOutsideClick: false,
      type: 'warning',
      title: this.translate.instant('INCORRECT_EMAIL.TITLE', {
        director: this.translate.instant('Academic Director/Certifier Admin'),
      }),
      html: this.translate.instant('INCORRECT_EMAIL.TEXT', {
        civility: this.translate.instant(civility),
        firstName: firstName,
        lastName: lastName,
      }),
      footer: `<span style="margin-left: auto">INCORRECT_EMAIL</span>`,
      showCancelButton: true,
      cancelButtonText: this.translate.instant('INCORRECT_EMAIL.CANCEL'),
      confirmButtonText: this.translate.instant('INCORRECT_EMAIL.SEND', { timer: timeDisabled }),
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('INCORRECT_EMAIL.SEND') + ' in ' + timeDisabled + ' sec';
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('INCORRECT_EMAIL.SEND');
          Swal.enableConfirmButton();
          clearInterval(this.intVal);
        }, timeDisabled * 1000);
      },
    }).then((isConfirm) => {
      if (isConfirm.value) {
        this.subs.sink = this.dialog
          .open(IncorrectUsersEmailDialogComponent, {
            ...this.deleteConfig,
            data: {
              userId,
              civility,
              firstName,
              lastName,
              isFromUserTable: true,
            },
          })
          .afterClosed()
          .subscribe((result) => {
            Swal.fire({
              type: 'success',
              title: 'Bravo!',
              allowOutsideClick: false,
              confirmButtonText: this.translate.instant('OK'),
            });
            this.reload.emit({ reload: true });
          });
        // this.getAllUser();
      }
    });
  }

  confirmDeactivation(element) {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('Deactivate_S1.TITLE'),
      html: this.translate.instant('Deactivate_S1.TEXT', {
        Civility: this.translate.instant(element.civility),
        LName: element.last_name,
        FName: element.first_name,
      }),
      footer: `<span style="margin-left: auto">Deactivate_S1</span>`,
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonClass: 'btn-danger',
      allowOutsideClick: false,
      confirmButtonText: this.translate.instant('Deactivate_S1.BUTTON_1'),
      cancelButtonText: this.translate.instant('Deactivate_S1.BUTTON_2'),
    }).then((data: any) => {
      if (data.value) {
        this.subs.sink = this.dialog
          .open(UserDeactivationDialogComponent, {
            ...this.deleteConfig,
            data: {
              element,
            },
          })
          .afterClosed()
          .subscribe((result) => {
            this.reload.emit({ reload: true, deactivation: true });
            // this.getAllUser()
          });
      }
    });
  }

  sendReminderRegistration(data) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.usersService.sendReminderUserN1(this.translate.currentLang, data._id).subscribe((resp) => {
      this.isWaitingForResponse = false;

      Swal.fire({
        type: 'success',
        title: this.translate.instant('Bravo !'),
        text: this.translate.instant('Email Sent'),
      });
    });
  }

  getUniqueUserType(entities) {
    return _.uniqBy(entities, 'type.name');
  }

  sendMailToAcadir(user) {
    this.mailUser = this.dialog.open(UserEmailDialogComponent, {
      disableClose: true,
      width: '750px',
      data: { ...user, multipleEntities: true, userType: 'Mentor', sendToAcadir: true },
    });
  }

  isUserAMentor(user) {
    if(user && user.students_connected && user.entities){      
      const user_entities = user.entities;
      if (
        [user, user.students_connected, user.students_connected.length, user_entities, user_entities.length].some((condition) => !condition)
      )
        return false;
      return !!this.getUniqueUserType(user_entities).find(
        (entity) => entity && entity.type && entity.type.name && entity.type.name === 'Mentor' && entity.school && entity.school._id,
      );
    }
  }

  // openWhatsapp(element) {
  //   const whatsAppUrl = 'https://api.whatsapp.com/send?phone=' + element.telephone + '&text=';
  //   const whatsAppText = this.translate.instant('whatsapp message', {
  //     name: element.first_name,
  //     dev: `${this.translate.instant(this.candidate.civility)} ${this.candidate.first_name} ${this.candidate.last_name}`,
  //     school: element.school.short_name,
  //     campus: element.campus.name,
  //     position: element.position ? element.position : '',
  //   });


  //   window.open(whatsAppUrl + whatsAppText, '_blank');
  // }

  // callCandidates(element) {
  //   Swal.fire({
  //     type: 'info',
  //     title: this.translate.instant('CANDIDAT_S3.TITLE'),
  //     html: this.translate.instant('CANDIDAT_S3.TEXT', {
  //       candidateName: this.translate.instant(element.civility) + ' ' + element.first_name + ' ' + element.last_name,
  //     }),
  //     showCancelButton: true,
  //     allowEscapeKey: true,
  //     allowOutsideClick: false,
  //     reverseButtons: true,
  //     confirmButtonText: this.translate.instant('CANDIDAT_S3.BUTTON_1'),
  //     cancelButtonText: this.translate.instant('CANDIDAT_S3.BUTTON_2'),
  //   }).then((res) => {
  //     if (res.value) {
  //       const payload = _.cloneDeep(element);
  //       if (payload && payload.date_of_birth) {
  //         payload.date_of_birth = moment(payload.date_of_birth).format('DD/MM/YYYY');
  //       }
  //       delete payload._id;
  //       delete payload.student_mentor_id;
  //       delete payload.admission_member_id;
  //       delete payload.count_document;
  //       delete payload.user_id;
  //       delete payload.date_added;
  //       delete payload.announcement_call;
  //       delete payload.candidate_unique_number;
  //       delete payload.billing_id;
  //       if (payload && payload.campus) {
  //         payload.campus = payload.campus._id;
  //       }
  //       if (payload && payload.intake_channel) {
  //         payload.intake_channel = payload.intake_channel._id;
  //       }
  //       if (payload && payload.scholar_season) {
  //         payload.scholar_season = payload.scholar_season._id;
  //       }
  //       if (payload && payload.level) {
  //         payload.level = payload.level._id;
  //       }
  //       if (payload && payload.school) {
  //         payload.school = payload.school._id;
  //       }
  //       if (payload && payload.sector) {
  //         payload.sector = payload.sector._id;
  //       }
  //       if (payload && payload.speciality) {
  //         payload.speciality = payload.speciality._id;
  //       }
  //       if (payload && payload.registration_profile) {
  //         payload.registration_profile = payload.registration_profile._id;
  //       }
  //       if (payload && payload.type_of_formation_id) {
  //         payload.type_of_formation_id = payload.type_of_formation_id._id;
  //       }
  //       this.subs.sink = this.candidateService.UpdateCandidateCall(element._id, payload).subscribe((resp) => {

  //         Swal.fire({
  //           type: 'success',
  //           title: this.translate.instant('CANDIDAT_S4.MESSAGE'),
  //           html: this.translate.instant('CANDIDAT_S4.TEXT', {
  //             candidateName: this.translate.instant(element.civility) + ' ' + element.first_name + ' ' + element.last_name,
  //           }),
  //           allowOutsideClick: false,
  //           confirmButtonText: this.translate.instant('CANDIDAT_S4.BUTTON'),
  //         }).then((resss) => {
  //           // this.viewCandidateInfo(element._id, 'note-tab');
  //         });
  //       });
  //     }
  //   });
  // }
}
