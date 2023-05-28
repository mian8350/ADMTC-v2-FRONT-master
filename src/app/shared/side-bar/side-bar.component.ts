import { Component, OnInit, Input, OnDestroy, ViewChild, OnChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { CoreService } from '../../service/core/core.service';
import { MenuItems } from '../../core/menu/menu-items/menu-items';
import { UntypedFormControl } from '@angular/forms';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { UserService } from 'app/service/user/user.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UserProfileData } from 'app/users/user.model';
import { VersionService } from 'app/version/version.service';
import { SubSink } from 'subsink';
import { UrgentMessageDialogComponent } from 'app/urgent-message/urgent-message-dialog.component';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { PermissionService } from 'app/service/permission/permission.service';
import { MailToGroupDialogComponent } from 'app/mailbox/mail-to-group-dialog/mail-to-group-dialog.component';
import { environment } from 'environments/environment';
import { DomSanitizer } from '@angular/platform-browser';
import { UtilityService } from 'app/service/utility/utility.service';
import Swal from 'sweetalert2';
import { ContactUsDialogComponent } from 'app/need-help/contact-us/contact-us-dialog.component';
import { NgxPermissionsService } from 'ngx-permissions';
import { ApplicationUrls } from '../settings';
import { AcademicJourneyService } from 'app/service/academic-journey/academic-journey.service';
import * as _ from 'lodash';
import { ParseStringDatePipe } from '../pipes/parse-string-date.pipe';
import { ExportGroupsDialogComponent } from '../components/export-groups-dialog/export-groups-dialog.component';
import { QuickSearchListDialogComponent } from '../components/quick-search-list-dialog/quick-search-list-dialog.component';
import { UsersService } from 'app/service/users/users.service';
import { StatusUpdateDialogComponent } from '../components/status-update-dialog/status-update-dialog.component';
import { StudentsService } from 'app/service/students/students.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import * as moment from 'moment';
@Component({
  selector: 'ms-side-bar',
  templateUrl: './side-bar.component.html',
  styleUrls: ['./side-bar.component.scss'],
  providers: [ParseStringDatePipe],
})
export class SideBarComponent implements OnInit, OnDestroy, OnChanges {
  private subs = new SubSink();
  @Input() menuList: any;
  @Input() verticalMenuStatus: boolean;
  @ViewChild('fileUpload', { static: false }) uploadInput: any;

  isLoadingUpload = false;
  isStudent = false;
  studentId = '';
  acadJourneyId = '';
  studentData: any;
  currentUser: UserProfileData;
  profilePic = new UntypedFormControl('');
  frontendVersion: string;
  backendVersion: string;
  maleUserIcon = '../../../../assets/img/student_icon.png';
  femaleUserIcon = '../../../../assets/img/student_icon_fem.png';
  urgentMessageConfig: MatDialogConfig = {
    disableClose: true,
    width: '600px',
    panelClass: 'certification-rule-pop-up',
  };
  config: MatDialogConfig = {
    disableClose: true,
    width: '800px',
  };
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  urgentMessageDialogComponent: MatDialogRef<UrgentMessageDialogComponent>;
  contactUsDialogComponent: MatDialogRef<ContactUsDialogComponent>;
  mailToGroupDialogComponent: MatDialogRef<MailToGroupDialogComponent>;

  userSearch = new UntypedFormControl('');

  isADMTC = false;
  isCertifierUser = false;
  isChiefGroupSchool = false;
  isAcadDirAdmin = false;
  isCertifierDirAdmin = false;
  isWaitingForResponse = false;

  // Configuration of the Popup Size and display
  configCat: MatDialogConfig = {
    disableClose: true,
    panelClass: 'certification-rule-pop-up',
    minWidth: '95%',
    minHeight: '81%',
  };

  envLink = environment.apiUrl;
  menus: any;
  selectedYear;

  constructor(
    public translate: TranslateService,
    private router: Router,
    public coreService: CoreService,
    public menuItems: MenuItems,
    private authService: AuthService,
    private fileUploadService: FileUploadService,
    private userService: UserService,
    private versionService: VersionService,
    public dialog: MatDialog,
    public permissionService: PermissionService,
    private sanitizer: DomSanitizer,
    public utilService: UtilityService,
    private permissions: NgxPermissionsService,
    private acadJourneyService: AcademicJourneyService,
    private studentService: StudentsService,
  ) {}

  ngOnInit() {
    this.getYearCertificationsList();
    this.currentUser = this.authService.getLocalStorageUser();


    this.getCurrentUser();
    const profilePicUrl = this.currentUser.profile_picture ? this.currentUser.profile_picture : 'assets/img/pro-thumb.jpg';
    this.profilePic.patchValue(profilePicUrl);
    this.getVersion();
    this.setUpMenu();

    this.subs.sink = this.authService.isConnectAsUser$
      .pipe(distinctUntilChanged())
      .pipe(debounceTime(100))
      .subscribe((resp) => {
        if (resp) {
          this.setUpMenu();
        }
      });
    // // ************ Get Data User for permission of button quick search
    // this.isADMTC = this.utilService.isUserEntityADMTC();
    // this.isAcadDirAdmin = this.utilService.isUserAcadDirAdmin();
    // this.isCertifierDirAdmin = this.utilService.isUserCRDirAdmin(); 
  }

  ngOnChanges() {

    this.currentUser = this.authService.getLocalStorageUser();

    // ************ Get Data User for permission of button quick search
    // this.isADMTC = this.utilService.isUserEntityADMTC();
    // this.isAcadDirAdmin = this.utilService.isUserAcadDirAdmin();
    // this.isCertifierDirAdmin = this.utilService.isUserCRDirAdmin();
  }

  onPaste(event) {
    // ************ case email
    const email = event.clipboardData.getData('text/plain').trim();
    const regexMail =
    /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    const isEmail = regexMail.test(email);
    // ************ Automatically Search if match email
      if(isEmail) {
        this.quickSearchEmail(email, 'email');
      }
  }

  setUpMenu() {
    this.isStudent = !!this.permissions.getPermission('Student');

    if (this.isStudent) {
      const tmpMenus = this.menuList.getAll();
      this.menus = tmpMenus.map((data) => {
        if (data.state && data.state === 'academic-journeys') {
          data.permissions = 'academic_journeys_false';
        }
        return data;
      });
      this.getDataStudent();
    } else if (this.isChiefGroupSchool) {
      this.menus = this.menuList.getAll();
      this.menus = this.menus.filter(menuitem => menuitem?.state !== 'rncpTitles')
    } else {
      this.menus = this.menuList.getAll();

    }
  }

  getCurrentUser() {
    this.subs.sink = this.userService.reloadCurrentUser$.subscribe((isReload) => {
      if (isReload) {
        this.currentUser = this.authService.getLocalStorageUser();
        this.userService.reloadCurrentUser(false);
        this.isStudent = !!this.permissions.getPermission('Student');
        this.isChiefGroupSchool = !!this.permissions.getPermission('Chief Group Academic');
        if (this.isStudent) {
          this.getDataStudent();
        }
      }
    });
    this.subs.sink = this.userService.reloadPhotoUser$.subscribe((isReload) => {
      if (isReload) {

        this.userService.reloadPhotoUser(false);
        this.currentUser = this.authService.getLocalStorageUser();
      }
    });
  }

  sendUrgentMessage() {
    this.urgentMessageDialogComponent = this.dialog.open(UrgentMessageDialogComponent, this.urgentMessageConfig);
  }

  sendMailToGroup() {
    this.mailToGroupDialogComponent = this.dialog.open(MailToGroupDialogComponent, this.config);
  }

  handleInputChange(fileInput: Event) {
    const acceptable = ['jpg', 'jpeg', 'png'];
    const file = (<HTMLInputElement>fileInput.target).files[0];
    if (file) {
      this.isLoadingUpload = true;
      const fileType = this.utilService.getFileExtension(file.name).toLocaleLowerCase();
      if (acceptable.includes(fileType)) {
        this.subs.sink = this.fileUploadService.singleUpload(file).subscribe((res) => {
          this.isLoadingUpload = false;
          this.profilePic.patchValue(res.s3_file_name);
          this.currentUser.profile_picture = res.s3_file_name;

          const payload = {};
          payload['email'] = this.currentUser.email;
          payload['profile_picture'] = res.s3_file_name;
          payload['first_name'] = this.currentUser.first_name;
          payload['last_name'] = this.currentUser.last_name;

          this.subs.sink = this.userService.updateUser(this.currentUser._id, payload).subscribe((resp) => {
            if (resp) {
              const temp = this.currentUser;
              temp.profile_picture = res.s3_file_name;
              localStorage.setItem('userProfile', JSON.stringify(temp));
            }
            // this.subs.sink = this.userService.getUserProfileData(resp.email).subscribe((user) => {
            //   this.authService.setLocalUserProfile(user);
            // });
          });
        });
      } else {
        this.isLoadingUpload = false;
        Swal.fire({
          type: 'error',
          title: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TITLE'),
          text: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TEXT', { file_exts: '.jpg, .jpeg, .png' }),
          allowEscapeKey: false,
          allowOutsideClick: false,
          allowEnterKey: false,
        });
      }
    }
    this.resetFileState();
  }

  resetFileState() {
    this.uploadInput.nativeElement.value = '';
  }

  openUploadWindow() {
    const file = this.uploadInput.nativeElement.click();
  }

  // render to the crm page
  onClick() {
    const first = location.pathname.split('/')[1];
    if (first === 'horizontal') {
      this.router.navigate(['/horizontal/guide/table_1']);
    } else {
      // this.router.navigate(['/guide/table_1']);
      if (this.permissions.getPermission('Mentor') || this.permissions.getPermission('HR')) {
        this.router.navigate(['/students-card']);
      } else if (this.permissions.getPermission('Chief Group Academic')) {
        this.router.navigate(['/school-group']);
      } else if (this.permissions.getPermission('Student')) {
        this.router.navigate(['/my-file']);
      } else {
        this.router.navigate(['/rncpTitles']);
      }
    }
  }

  openExportGroups() {
    this.dialog.open(ExportGroupsDialogComponent, {
      disableClose: true,
      panelClass: 'certification-rule-pop-up',
      width: '600px',
    });
  }

  openStatusUpdateDialog() {
    this.dialog.open(StatusUpdateDialogComponent, {
      disableClose: true,
      panelClass: 'certification-rule-pop-up',
      width: '600px',
    });
  }

  getVersion() {
    // frontend, also
    const packages = require('../../../../package.json');
    this.frontendVersion = packages.version;
    const storedVersion = localStorage.getItem('version');


    if (!storedVersion) {
      localStorage.setItem('version', this.frontendVersion);
    } else if (storedVersion && storedVersion !== this.frontendVersion) {
      this.authService.logOut();
    }

    // backend
    this.versionService.getBackendVersion().subscribe((resp) => (this.backendVersion = resp));
  }

  imgURL(src: string) {
    return this.sanitizer.bypassSecurityTrustUrl(src);
  }

  getDataStudent() {

    this.subs.sink = this.acadJourneyService.GetStudentId(this.currentUser._id).subscribe((student) => {
      this.studentId = student.student_id._id;

      // *************** function in one line below is used to determine whether to display the menu 'academic journey'
      this.checkStudentAdmissionStatusAndAcadJourney(student.student_id._id);
    });
  }

  quickSearch(type: string) {
    this.isADMTC = this.utilService.isUserEntityADMTC();
    this.isAcadDirAdmin = this.utilService.isUserAcadDirAdmin();
    this.isCertifierDirAdmin = this.utilService.isUserCRDirAdmin();
    this.isCertifierUser = this.utilService.isUserLoginCRStaff();



    const lastName = this.userSearch.value;
    if (type && lastName) {
      if (type === 'user' || type === 'mentor') {
        this.quickSearchUser(lastName, type);
      } else if (type === 'student') {
        this.quickSearchStudent(lastName, type);
      } else if (type === 'school') {
        this.quickSearchSchool(lastName, type);
      } else if (type === 'jury') {
        this.quickSearchJury(lastName, type);
      } else if (type === 'title') {
        this.quickSearchTitle(lastName, type);
      } else if (type === 'email') {
        this.quickSearchEmail(lastName, type);
      }
    }

    this.userSearch.patchValue('');
  }
  quickSearchEmail(email, type) {
    if (this.isADMTC) {
      this.getAllUsersQuickSearchEmail(email, type);
    } else if (this.isCertifierUser) {
      this.isWaitingForResponse = true;
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe(
        (resp) => {
          if (resp?.entities?.length) {
            const dataUSer = resp.entities.filter((ent) => ent.type.name === userType);
            const titleIds = this.utilService.getAcademicAllAssignedTitle(dataUSer);
            const schoolIds = null;
            this.getAllUsersQuickSearchEmail(email, type, schoolIds, titleIds);
          } else {
            this.isWaitingForResponse = false;
          }
        },
        (err) => {
          this.swalError(err);
        },
      );
    } else {
      this.isWaitingForResponse = true;
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe(
        (resp) => {
          if (resp?.entities?.length) {
            const dataUSer = resp.entities.filter((ent) => ent.type.name === userType);
            const titleIds = this.utilService.getAcademicAllAssignedTitle(dataUSer);
            const schoolIds = this.isAcadDirAdmin
              ? this.utilService.getUserAllSchoolAcadDirAdmin()
              : this.utilService.getAcademicAllAssignedSchool(dataUSer);
            this.getAllUsersQuickSearchEmail(email, type, schoolIds, titleIds);
          } else {
            this.isWaitingForResponse = false;
          }
        },
        (err) => {
          this.swalError(err);
        },
      );
    }
  }
  getAllUsersQuickSearchEmail(email, type, schoolIds?, titleIds?) {
    const pagination = {
      page: 0,
      limit: 10,
    };
    const school = schoolIds ? schoolIds : [];
    const title = titleIds ? titleIds : [];
    this.isWaitingForResponse = true;
    this.subs.sink = this.userService.getUserQuickSearchEmail(email, school, title, pagination).subscribe(
      (resp) => {
        if (resp?.length === 1 && resp[0]) {
          if (resp[0]?.student_id) {
            this.goToStudent(resp[0]?.student_id);
          } else {
            this.goToUserCard(resp[0]?._id);
          }
          this.userSearch.patchValue('')
        } else if (resp?.length > 1) {
          this.subs.sink = this.dialog
            .open(QuickSearchListDialogComponent, {
              width: '900px',
              panelClass: 'no-padding-pop-up',
              disableClose: true,
              data: {
                data: resp,
                data2: {
                  school: school,
                  title: title,
                  email: email,
                },
                type: type,
              },
            })
            .afterClosed()
            .subscribe((result) => {

            });
        } else {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('User not Found'),
            allowEscapeKey: false,
            allowOutsideClick: false,
            allowEnterKey: false,
          });
        }
        this.isWaitingForResponse = false;
      },
      (err) => {
        this.swalError(err);
      },
    );
  }

  quickSearchUser(lastName: string, type: string) {
    const payload = {
      school: [],
      title: [],
      exclude_company: null,
      short_name: lastName,
    };
    let titles = [];

    let schoolIds = [];

    if (this.isAcadDirAdmin) {
      schoolIds = this.utilService.getUserAllSchoolAcadDirAdmin();
      if (schoolIds && schoolIds.length === 0) {
        schoolIds = null;
      }
    } else if (this.isCertifierDirAdmin) {
      const schoolids = this.currentUser.entities ? this.currentUser.entities[0].school._id : '';
      schoolIds = [schoolids];
    }

    if (this.isAcadDirAdmin) {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.isWaitingForResponse = true;
      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((response) => {
        this.isWaitingForResponse = false;
        const dataUSer = response.entities.filter((ent) => ent.type.name === userType);
        titles = this.utilService.getAcademicAllAssignedTitle(dataUSer);
        payload['title'] = titles;
        payload['school'] = this.utilService.getUserAllSchoolAcadDirAdmin();

        this.quickSearchUserCallAPI(lastName, type, payload);
      });
    } else if (this.isCertifierDirAdmin) {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.isWaitingForResponse = true;
      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((res) => {
        this.isWaitingForResponse = false;
        const dataUSer = res.entities.filter((ent) => ent.type.name === userType);
        const title_ids = this.utilService.getAcademicAllAssignedTitle(dataUSer);
        const schoolIdsUniq = this.utilService.getAcademicAllAssignedSchool(dataUSer);
        payload['title'] = title_ids;
        payload['school'] = schoolIdsUniq;
        this.quickSearchUserCallAPI(lastName, type, payload);
      });
    } else {
      this.quickSearchUserCallAPI(lastName, type, payload);
    }
  }

  quickSearchUserCallAPI(lastName: string, type: string, payload) {
    if (type === 'mentor') {
      payload['entity'] = ['company'];
      payload['user_type'] = ['5a2e603f53b95d22c82f9590'];
      if (this.isAcadDirAdmin) {
        payload['company_schools'] = payload['school'];
      }
      payload['school'] = null;
      payload['title'] = null;
      payload['exclude_company'] = false;
    } else if (type === 'user') {
      payload['exclude_company'] = true;
    }

    this.isWaitingForResponse = true;
    this.subs.sink = this.userService
      .getUserQuickSearch(
        lastName,
        payload.school,
        payload.title,
        payload.entity,
        payload.user_type,
        payload.company_schools,
        payload.exclude_company,
      )
      .subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          if (resp && resp.length) {
            if (resp.length === 1) {
              // ************ auto redirect
              if (type === 'user' || type === 'mentor') {
                this.goToUserCard(resp[0]?._id);
              }
            } else {
              // ************ open pop up
              this.dialog
                .open(QuickSearchListDialogComponent, {
                  width: type === 'user' ? '900px' : '850px',
                  panelClass: 'no-padding-pop-up',
                  disableClose: true,
                  data: {
                    data: resp,
                    type: type,
                  },
                })
                .afterClosed()
                .subscribe((result) => {

                });
            }
          } else {
            if (type === 'user') {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('User not Found'),
              });
            } else if (type === 'mentor') {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('Mentor not Found'),
              });
            }
          }
        },
        (err) => {
          this.swalError(err);
        },
      );
  }

  quickSearchStudent(lastName: string, type: string) {
    const payload = {
      filter: {
        last_name: lastName,
      },
      short_name: lastName,
    };
    let schoolIds = [];

    if (this.isAcadDirAdmin) {
      schoolIds = this.utilService.getUserAllSchoolAcadDirAdmin();
      if (schoolIds && schoolIds.length === 0) {
        schoolIds = null;
      }
    } else if (this.isCertifierDirAdmin) {
      const schoolids = this.currentUser.entities ? this.currentUser.entities[0].school._id : '';
      schoolIds = null;
    }

    this.isWaitingForResponse = true;
    if (this.isAcadDirAdmin) {
      schoolIds = this.utilService.getUserAllSchoolAcadDirAdmin();

      if (schoolIds && schoolIds.length === 0) {
        schoolIds = null;
      }
    } else if (this.isCertifierDirAdmin) {
      const schoolids = this.currentUser.entities ? this.currentUser.entities[0].school._id : '';
      payload.filter['certifier_school'] = schoolids;
    }

    this.isWaitingForResponse = true;
    const fromQuickSearch = true;
    this.subs.sink = this.userService.getStudentQuickSearch(payload.filter, schoolIds, fromQuickSearch).subscribe(
      (response) => {
        this.getDataStudentQuickSearch(response, type);
      },
      (err) => {
        this.swalError(err);
        this.isWaitingForResponse = false;
      },
    );
  }

  quickSearchSchool(lastName: string, type: string) {
    const payload = {
      short_name: lastName,
    };
    let schoolIds = [];

    if (this.isAcadDirAdmin) {
      schoolIds = this.utilService.getUserAllSchoolAcadDirAdmin();

      if (schoolIds && schoolIds.length === 0) {
        schoolIds = null;
      }
    } else if (this.isCertifierDirAdmin) {
      const schoolids = this.currentUser.entities ? this.currentUser.entities[0].school._id : '';
      schoolIds = [schoolids];

    }

    this.isWaitingForResponse = true;
    this.subs.sink = this.userService.getSchoolQuickSearch(payload.short_name, schoolIds).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp && resp.length) {
          if (resp.length === 1) {
            // ************ auto redirect
            this.goToSchool(resp[0]);
          } else {
            // ************ open pop up
            this.dialog
              .open(QuickSearchListDialogComponent, {
                width: '750px',
                panelClass: 'no-padding-pop-up',
                disableClose: true,
                data: {
                  data: resp,
                  type: type,
                },
              })
              .afterClosed()
              .subscribe((result) => {
                // if (result) {
                //   this.goToSchool(result);
                // }
              });
          }
        } else {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('School not Found'),
          });
        }
      },
      (err) => {
        this.swalError(err);
      },
    );
  }

  quickSearchJury(lastName: string, type: string) {
    this.isWaitingForResponse = true;
    let firstTime = false;
    if (this.selectedYear) {
      this.subs.sink = this.userService.getScheduleJuryBasedOnName(lastName, this.selectedYear).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          if (resp && resp.schedules && resp.schedules.length) {
            if (resp.schedules.length === 1) {
              // ************ auto redirect
              this.goToJury(resp.schedules[0]);
            } else {
              // ************ open pop up
              if (resp && resp.schedules.length > 1 && !firstTime) {
                this.openDialogJury(resp, type);
              }
              firstTime = true;
            }
          } else {
            Swal.fire({
              type: 'error',
              title: this.translate.instant('Jury schedule not found'),
            });
          }
        },
        (err) => {
          this.isWaitingForResponse = false;
        },
      );
    } else {
      this.isWaitingForResponse = false;
    }
  }

  quickSearchTitle(lastName: string, type: string) {
    this.isWaitingForResponse = true;
    const userTypeLogginId = this.currentUser?.entities[0]?.type?._id;
    const payload = {
      title_name: lastName,
      user_type_login: userTypeLogginId,
    };
    this.subs.sink = this.userService.getTitleQuickSearch(payload.title_name, payload.user_type_login).subscribe(
      (resp: any) => {
        this.isWaitingForResponse = false;
        if (resp && resp.length) {
          // auto redirect
          if (resp.length === 1) {
            // ************ auto redirect
            this.goToTitle(resp[0]);
          } else {
            // ************ open pop up
            this.dialog
              .open(QuickSearchListDialogComponent, {
                width: '750px',
                panelClass: 'no-padding-pop-up',
                disableClose: true,
                data: {
                  data: resp,
                  type: type,
                },
              })
              .afterClosed()
              .subscribe((result) => {
                // if (result) {
                //   this.goToSchool(result);
                // }
              });
          }
        } else {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('Title not found'),
          });
        }
      },
      (err) => {
        this.swalError(err);
      },
    );
  }

  openDialogJury(resp, type) {
    const mappedData = resp.schedules.map((map) => {
      let user;
      if (map && map.user) {
        user = map.user;
        user['position'] = map.position;
        return user;
      }
    });

    this.dialog
      .open(QuickSearchListDialogComponent, {
        width: type === 'jury' ? '900px' : '850px',
        panelClass: 'no-padding-pop-up',
        disableClose: true,
        data: {
          data: mappedData,
          type: type,
        },
      })
      .afterClosed()
      .subscribe((result) => {

      });
  }

  goToJury(jury) {
    this.isWaitingForResponse = true;
    if (this.selectedYear) {
      this.isWaitingForResponse = false;
      window.open(
        `./global-jury-organization/all-jury-schedule?open=all-tab&position=${jury.position}&userData=${jury.user.last_name}&latestYear=${this.selectedYear}&userId=${jury.user._id}`,
        '_blank',
      );
    } else {
      this.isWaitingForResponse = false;
    }
  }

  goToSchool(school, extraQueryString?) {
    window.open(`./school/${school._id}?open=school-staff${extraQueryString ? '&' + extraQueryString : ''}`, '_blank');
  }

  goToTitle(title) {
    window.open(`./rncpTitles/${title?._id}/dashboard`, '_blank');
  }

  goToActiveStudent(school, extraQueryString?) {
    window.open(`./students/${school._id}?${extraQueryString ? extraQueryString : ''}`, '_blank');
  }

  goToStudent(student) {
    window.open(
      `./school/${student.school._id}?title=${student.rncp_title._id}&class=${student.current_class._id}&student=${student._id}&open=student-cards&selectedTab=Identity&selectedSubTab=Identity&studentStatus=active`,
      '_blank',
    );
  }

  goToStudentSuspended(student) {
    window.open(
      `./school/${student.school._id}?title=${student.rncp_title._id}&class=${student.current_class._id}&student=${student._id}&open=suspended-student&student-name=${student.last_name}`,
      '_blank',
    );
  }

  goToStudentDeactived(student) {
    window.open(
      `./school/${student.school._id}?title=${student.rncp_title._id}&class=${student.current_class._id}&student=${student._id}&open=deactivated-student&student-name=${student.last_name}`,
      '_blank',
    );
  }

  goToUser(user, type) {
    if (type === 'mentor') {
      if (this.isADMTC) {
        window.open(`./users/?user=${user._id}`, '_blank');
      } else if (this.isAcadDirAdmin) {

        const schools = this.utilService.getUserAllSchoolAcadDirAdmin();
        const filteredEntities = user.entities.filter(
          (entity) => entity && entity.entity_name === 'company' && entity.companies && entity.companies.length,
        );
        let selectedEntity;

        if (filteredEntities && filteredEntities.length) {
          selectedEntity = filteredEntities[0];


          let selectedCompany;

          if (selectedEntity && selectedEntity.companies && selectedEntity.companies.length) {
            selectedEntity.companies.forEach((company) => {
              if (company && company.school_ids && company.school_ids.length) {
                company.school_ids.forEach((school) => {
                  if (school && school._id && schools.includes(school._id)) {
                    selectedCompany = company;
                  }
                });
              }
            });
          }

          if (selectedCompany) {
            window.open(
              `/companies/branches?selectedCompanyId=${selectedCompany._id}&
            selectedCompanyName=${selectedCompany.company_name}&
            selectedMentorId=${user._id}&companyTab=companyStaff`,
              '_blank',
            );
          } else {
            Swal.fire({
              type: 'error',
              title: this.translate.instant('Mentor not Found'),
            });
          }
        } else {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('Mentor not Found'),
          });
        }
      }
    } else {
      if (this.isAcadDirAdmin) {

        const entityCurrentUser = this.currentUser.entities[0];
        if (entityCurrentUser) {
          window.open(`./school/${entityCurrentUser.school._id}?open=school-staff&schoolstaff=${user._id}`, '_blank');
        }
      } else {
        window.open(`./users/?user=${user._id}`, '_blank');
      }
    }
  }
  goToUserCard(userId) {
    window.open(`./users/user-management-detail/?userId=${userId}&isFromActiveUserTab=true`, '_blank');
  }
  swalError(err) {
    this.isWaitingForResponse = false;

    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    });
  }

  getDataStudentQuickSearch(resp, type) {
    this.isWaitingForResponse = false;
    if (resp && resp.length) {
      if (resp.length === 1) {
        // ************ auto redirect
        if (resp[0].student_title_status === 'suspended') {
          this.goToStudentSuspended(resp[0]);
        } else if (resp[0].student_title_status === 'deactivated') {
          this.goToStudentDeactived(resp[0]);
        } else {
          this.goToStudent(resp[0]);
        }
      } else {
        // ************ open pop up
        this.dialog
          .open(QuickSearchListDialogComponent, {
            width: '750px',
            panelClass: 'no-padding-pop-up',
            disableClose: true,
            data: {
              data: resp,
              type: type,
            },
          })
          .afterClosed()
          .subscribe((result) => {
            if (result) {

            }
          });
      }
    } else {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('Student not Found'),
      });
    }
  }

  // *************** function below is used to determine whether to display the menu 'academic journey'
  // checks if the student's admission status is completed and if student has academic journey step in his admission process
  checkStudentAdmissionStatusAndAcadJourney(studentId: string) {
    this.subs.sink = this.studentService.getStudentAdmissionFormStatus(studentId).subscribe((response) => {
      const studentData = _.cloneDeep(response);
      const admissionStatus = studentData && studentData.admission_status ? studentData.admission_status : null;
      const admissionData = studentData && studentData.admission_process_id ? studentData.admission_process_id : null;
      let hasAcadJourney;
      if (admissionData && admissionData.steps && admissionData.steps.length) {
        hasAcadJourney = admissionData.steps.some((step) => step && step.step_type === 'academic_journey');
      }
      if (studentData && admissionStatus && admissionStatus === 'received_completed' && hasAcadJourney) {
        this.menus = this.menus.map((data) => {
          if (data.state && data.state === 'academic-journeys') {
            data.permissions = 'academic_journeys.show_perm';
          }
          return data;
        });
      }

    });
  }

  getYearCertificationsList() {
    this.subs.sink = this.studentService.getListYearOfCertifications().subscribe((res) => {
      let tempList: any;
      const currentYear = moment().year();
      tempList = _.cloneDeep(res).filter((year) => year && year.year && Number(year.year) <= currentYear);
      const selectedYearOfYear = tempList.reverse().find((year) => year && year.has_completed_student);
      this.selectedYear = selectedYearOfYear.year;
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
