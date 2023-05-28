import { AlertFunctionalityUserDialogComponent } from './../shared/components/alert-functionality-user-dialog/alert-functionality-user-dialog.component';
import { AlertService } from './../service/alert-functionality/alert-functionality.service';
import { debounceTime, filter } from 'rxjs/operators';
import { Component, OnInit, OnDestroy, ViewChild, HostListener, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { MenuItems } from '../core/menu/menu-items/menu-items';
import { PageTitleService } from '../core/page-title/page-title.service';
import { TranslateService } from '@ngx-translate/core';
import { Router, NavigationEnd } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { AuthService } from '../service/auth-service/auth.service';
import { CoreService } from '../service/core/core.service';
import { Location } from '@angular/common';
import { UserService } from 'app/service/user/user.service';
import { SubSink } from 'subsink';
import { NgxPermissionsService } from 'ngx-permissions';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { BannerConnectAsSnackbarComponent } from 'app/shared/components/banner-connect-as-snackbar/banner-connect-as-snackbar.component';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { environment } from 'environments/environment';
import { ContactUsDialogComponent } from 'app/need-help/contact-us/contact-us-dialog.component';
import { PermissionService } from 'app/service/permission/permission.service';
import * as _ from 'lodash';
import { UtilityService } from 'app/service/utility/utility.service';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import { CertificationRuleService } from 'app/service/certification-rule/certification-rule.service';
import { CertificationRulePopUpComponent } from 'app/title-rncp/conditions/certification-rule/certification-rule-pop-up/certification-rule-pop-up.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';

declare var require: any;

const screenfull = require('screenfull');

@Component({
  selector: 'ms-gene-layout',
  templateUrl: './main-material.html',
  styleUrls: ['./main-material.scss'],
})
export class MainComponent implements OnInit, OnDestroy, AfterViewChecked {
  private subs = new SubSink();
  currentUrl: any;
  dataTutorial: any;
  tutorialData: any;
  root: any = 'ltr';
  layout: any = 'ltr';
  currentLang: any = 'fr';
  customizerIn = false;
  showSettings = false;
  chatpanelOpen = false;
  sidenavOpen = true;
  isMobile = false;
  isFullscreen = false;
  collapseSidebarStatus: boolean;
  header: string;
  dark: boolean;
  compactSidebar: boolean;
  isMobileStatus: boolean;
  sidenavMode = 'side';
  popupDeleteResponse: any;
  sidebarColor: any;
  url: string;
  pageTitle = '';
  pageIcon = '';
  additionalInfo: string;
  juryData: any;
  currentUser: any;
  currentEntity: any;
  windowSize: number;
  chatList;
  isTutorialAdded = false;
  isLoginAsOther = false;
  isSnackbarOpen = false;
  isCompanyUser = false;
  isPermission: any;
  alertData;
  config: MatDialogConfig = {
    disableClose: true,
    width: '800px',
  };
  helpOption = [
    {
      name: 'Contact Us',
      value: 'contact_us',
    },
    {
      name: 'Tutorial',
      value: 'tutorial',
    },
  ];
  selectedBar = '';
  tutorialIcon = '../../assets/img/tutorial.png';
  // @HostListener('window:scroll', ['$event']) // for window scroll events
  private _routerEventsSubscription: Subscription;
  contactUsDialogComponent: MatDialogRef<ContactUsDialogComponent>;
  private _router: Subscription;
  @ViewChild('sidenav', { static: true }) sidenav;
  @ViewChild('sidenavTutorial', { static: true }) sidenavTutorial;

  sideBarFilterClass: any = [
    {
      sideBarSelect: 'sidebar-color-1',
      colorSelect: 'sidebar-color-dark',
    },
    {
      sideBarSelect: 'sidebar-color-2',
      colorSelect: 'sidebar-color-primary',
    },
    {
      sideBarSelect: 'sidebar-color-3',
      colorSelect: 'sidebar-color-accent',
    },
    {
      sideBarSelect: 'sidebar-color-4',
      colorSelect: 'sidebar-color-warn',
    },
    {
      sideBarSelect: 'sidebar-color-5',
      colorSelect: 'sidebar-color-green',
    },
  ];

  headerFilterClass: any = [
    {
      headerSelect: 'header-color-1',
      colorSelect: 'header-color-dark',
    },
    {
      headerSelect: 'header-color-2',
      colorSelect: 'header-color-primary',
    },
    {
      headerSelect: 'header-color-3',
      colorSelect: 'header-color-accent',
    },
    {
      headerSelect: 'header-color-4',
      colorSelect: 'header-color-warning',
    },
    {
      headerSelect: 'header-color-5',
      colorSelect: 'header-color-green',
    },
  ];
  currentURL: any;
  showSidebar: boolean = true;
  constructor(
    public menuItems: MenuItems,
    private pageTitleService: PageTitleService,
    public translate: TranslateService,
    private router: Router,
    public authService: AuthService,
    public coreService: CoreService,
    private location: Location,
    private userService: UserService,
    private ngxPermissionService: NgxPermissionsService,
    private _snackBar: MatSnackBar,
    private rncpTitleService: RNCPTitlesService,
    public dialog: MatDialog,
    public permissionService: PermissionService,
    public utilService: UtilityService,
    private cdr: ChangeDetectorRef,
    public tutorialService: TutorialService,
    private alertService: AlertService,
    private certificationService: CertificationRuleService,
    private mailboxService: MailboxService
  ) {
  }

  ngOnInit() {
    this.isPermission = this.authService.getPermission();
    this.getCurrentUser();
    if (
      (this.router.url === '/dashboard/courses' ||
        this.router.url === '/courses/courses-list' ||
        this.router.url === '/courses/course-detail' ||
        this.router.url === '/ecommerce/shop' ||
        this.router.url === '/ecommerce/checkout' ||
        this.router.url === '/ecommerce/invoice') &&
      window.innerWidth < 1920
    ) {
      this.coreService.sidenavOpen = false;
    }
    if (this.router.url !== this.currentURL) {
      this.currentURL = this.router.url;
      this.pageTitleService.setIcon(null);
      this.subs.unsubscribe();
      if (
        this.currentURL &&
        (this.currentURL.includes('/title-rncp/task-builder/key-tables') || this.currentURL.includes('/form-builder/key-table'))
      ) {
        this.showSidebar = false;
      } else {
        this.showSidebar = true;
      }
    }
    this.currentUser = this.authService.getLocalStorageUser();
    this.currentEntity = this.authService.getUserEntity();
    this.coreService.collapseSidebarStatus = this.coreService.collapseSidebar;
    this.subs.sink = this.pageTitleService.title.subscribe((val: string) => {
      this.header = val;
      this.pageTitle = val;
    });

    this.subs.sink = this.pageTitleService.icon.subscribe((val: string) => {
      this.pageIcon = val;
    });

    this.subs.sink = this.pageTitleService.additionalInfo.subscribe((val: string) => {
      this.additionalInfo = val;
    });

    this.subs.sink = this.pageTitleService.retakeJuryData.subscribe((val: string) => {
      this.juryData = val;
    });

    this.subs.sink = this.pageTitleService.grandOral.subscribe((val: string) => {
      this.juryData = val;
    });

    this._router = this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
      this.coreService.collapseSidebarStatus = this.coreService.collapseSidebar;
      this.url = event.url;
      this.customizeSidebar();
    });
    this.url = this.router.url;
    this.customizeSidebar();
    // ********** Check if user is using connect as, then show snackbar
    this.subs.sink = this.authService.isConnectAsUser$.pipe(debounceTime(100)).subscribe((resp) => {
      if (resp) {
        if (!this.isSnackbarOpen) {
          this._snackBar.openFromComponent(BannerConnectAsSnackbarComponent, {
            data: {
              currentUser: JSON.parse(localStorage.getItem('userProfile')),
            },
            verticalPosition: 'top',
            horizontalPosition: 'center',
            panelClass: 'banner-connect-snackbar',
          });
          this.isSnackbarOpen = true;
        }
      } else {
        this._snackBar.dismiss();
        this.isSnackbarOpen = false;
      }
    });

    setTimeout(() => {
      this.windowSize = window.innerWidth;
      this.resizeSideBar();
    }, 0);

    this._routerEventsSubscription = this.router.events.pipe(debounceTime(200)).subscribe((event) => {
      if (event instanceof NavigationEnd && this.isMobile) {
        this.sidenav.close();
      }
      if (this.location.path() !== '') {
        // Close sidebar if change route
        // this.coreService.sidenavOpen = false;
        this.coreService.sidenavTutorialOpen = false;

        // this page title will be displayed in main-material.html
        this.setPageTitleTutorial();
      }
    });
    this.checkAlert();
    this.getCertificationRule();
    this.getUrgentMail();
  }

  getUrgentMail() {
    this.subs.sink = this.mailboxService.getUrgentMail().subscribe((mailList: any[]) => {
      if (mailList && mailList.length) {
        this.subs.sink = this.dialog
          .open(ReplyUrgentMessageDialogComponent, {
            disableClose: true,
            width: '825px',
            panelClass: 'certification-rule-pop-up',
            data: mailList,
          })
          .afterClosed()
          .subscribe((resp) => {
            this.subs.sink = this.mailboxService.getUrgentMail().subscribe((mailUrgent: any[]) => {
              if (mailUrgent && mailUrgent.length) {
                this.dialog.open(ReplyUrgentMessageDialogComponent, {
                  disableClose: true,
                  width: '825px',
                  panelClass: 'certification-rule-pop-up',
                  data: mailUrgent,
                });
              }
            });
          });
      }
    });
  }

  checkAlert() {
    let userTypeId = null;
    if (
      this.currentUser &&
      this.currentUser.entities &&
      this.currentUser.entities.length &&
      this.currentUser.entities[0] &&
      this.currentUser.entities[0].type
    ) {
      userTypeId = this.currentUser.entities[0].type._id;
    }
    this.alertData = [];
    this.subs.sink = this.alertService.getAlertFunctionalityForUser(userTypeId).subscribe((resp) => {
      if (resp) {
        this.alertData = _.cloneDeep(resp);
        if (this.alertData && this.alertData.length) {
          this.dialog.open(AlertFunctionalityUserDialogComponent, {
            disableClose: true,
            minWidth: '70vw',
            minHeight: '25vh',
            maxHeight: '85vh',
            maxWidth: '70vw',
            panelClass: 'certification-rule-pop-up',
            data: this.alertData[0],
          });
        }
      }
    });
  }

  setPageTitleTutorial() {
    switch (this.router.url) {
      case '/school':
        this.pageTitle = 'List of schools';
        this.isTutorialAdded = false;
        this.getInAppTutorial('List of schools');
        break;
      case '/user-permission':
        this.pageTitle = 'User Permission';
        this.isTutorialAdded = false;
        // this.getInAppTutorial('List of schools');
        break;
      case '/school-detail':
        this.pageTitle = 'List of schools';
        this.isTutorialAdded = false;
        this.getInAppTutorial('List of schools');
        break;
      case '/academic-journeys/summary':
        this.pageTitle = 'Academic Journey';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Summary');
        break;
      case '/academic-journeys/my-profile':
        this.pageTitle = 'My Profile';
        this.isTutorialAdded = false;
        this.getInAppTutorial('My Profile');
        break;
      case '/academic-journeys/my-diploma':
        this.pageTitle = 'My Diploma';
        this.isTutorialAdded = false;
        this.getInAppTutorial('My Diploma');
        break;
      case '/academic-journeys/my-experience':
        this.pageTitle = 'My Experience';
        this.isTutorialAdded = false;
        this.getInAppTutorial('My Experience');
        break;
      case '/academic-journeys/my-skill':
        this.pageTitle = 'My Skill';
        this.isTutorialAdded = false;
        this.getInAppTutorial('My Skill');
        break;
      case '/academic-journeys/my-language':
        this.pageTitle = 'My Language';
        this.isTutorialAdded = false;
        this.getInAppTutorial('My Language');
        break;
      case '/academic-journeys/my-interest':
        this.pageTitle = 'My Interest';
        this.isTutorialAdded = false;
        this.getInAppTutorial('My Interest');
        break;
      case '/users':
        this.pageTitle = 'List of users';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Users');
        break;
      case '/task':
        this.pageTitle = 'NAV.MY_TASK';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Tasks');
        break;
      case '/student-task':
        this.pageTitle = 'NAV.STUDENT_TASK';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Tasks');
        break;
      case '/user-task':
        this.pageTitle = 'NAV.USER_TASK';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Tasks');
        break;
      case '/notifications':
        this.pageTitle = 'List of notifications';
        this.isTutorialAdded = false;
        this.getInAppTutorial('History of notifications');
        break;
      case '/doctest':
        this.pageTitle = 'List of Tests';
        this.isTutorialAdded = false;
        this.getInAppTutorial('List of Tests');
        break;
      case '/questionnaireTools':
        this.pageTitle = 'List of questionnaire';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Questionnary tools');
        break;
      // case '/jury-organization':
      //   this.pageTitle = 'List of jury organizations';
      //   this.isTutorialAdded = false;
      //   this.getInAppTutorial('Jury Organization');
      //   break;
      case '/transcript-process':
        // this.pageTitle = 'List of jury organizations';
        // this.isTutorialAdded = false;
        this.getInAppTutorial('Transcript');
        break;
      case '/ideas':
        this.pageTitle = 'List of 1001 ideas';
        this.isTutorialAdded = false;
        this.getInAppTutorial('List of 1001 ideas');
        break;
      case '/tutorial':
        this.pageTitle = 'List of tutorials';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Tutorial');
        break;
      case '/students-card':
        this.pageTitle = 'List of students';
        this.isTutorialAdded = false;
        this.getInAppTutorial('List of Students');
        break;
      case '/students':
        this.pageTitle = 'List of Active Students';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Active students');
        break;
      case '/completed-students':
        this.pageTitle = 'List of Completed Students';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Completed students');
        break;
      case '/deactivated-students':
        this.pageTitle = 'List of Deactivated Students';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Deactivated students');
        break;
      case '/suspended-students':
        this.pageTitle = 'List of Suspended Students';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Suspended students');
        break;
      case '/platform':
        this.pageTitle = 'List of platform';
        this.isTutorialAdded = false;
        this.getInAppTutorial('List of platform');
        break;
      case '/alert-functionality':
        this.pageTitle = 'List of alert';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Message - List of Alerts');
        break;
      case '/rncpTitles':
        this.pageTitle = 'List of RNCP Title';
        this.isTutorialAdded = false;
        this.getInAppTutorial('RNCP Title');
        break;
      case '/rncpTitles/dashboard':
        this.pageTitle = 'List of pending task and calendar step';
        this.isTutorialAdded = false;
        this.getInAppTutorial('List of pending task and calendar step');
        break;
      case '/companies':
        this.pageTitle = 'List of companies';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Companies');
        break;
      case '/companies/entities':
        this.pageTitle = 'NAV.Companies Entity';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Companies');
        break;
      case '/companies/branches':
        this.pageTitle = 'NAV.Companies Branches';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Companies');
        break;
      case '/quality-control':
        this.pageTitle = 'List of quality control';
        this.isTutorialAdded = false;
        this.getInAppTutorial('List of quality control');
        break;
      case '/certidegree':
        this.pageTitle = 'List of CertiDegree';
        this.isTutorialAdded = false;
        this.getInAppTutorial('List of CertiDegree');
        break;
      case '/crossCorrection':
        this.pageTitle = 'List of Cross Correction';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Cross correction');
        break;
      case '/mailbox/inbox':
        this.pageTitle = 'Inbox';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Mailbox');
        break;
      case '/mailbox/sentBox':
        this.pageTitle = 'Sent';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Mailbox');
        break;
      case '/mailbox/important':
        this.pageTitle = 'Important';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Mailbox');
        break;
      case '/mailbox/trash':
        this.pageTitle = 'Trash';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Mailbox');
        break;
      case '/mailbox/draft':
        this.pageTitle = 'Draft';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Mailbox');
        break;
      case '/title-rncp':
        this.pageTitle = 'RNCP Title Management';
        this.isTutorialAdded = false;
        this.getInAppTutorial('RNCP Title Management');
        break;
      case '/group-of-schools':
        this.pageTitle = 'List of Group of School';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Group of schools');
        break;
      case '/questionnaire-tools':
        this.pageTitle = 'Questionnaire Tools';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Questionnary tools');
        break;
      case '/process-management':
        this.pageTitle = 'Process Management';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Process Management');
        break;
      case '/promo/auto-promo':
        this.pageTitle = 'Promo';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Promo');
        break;
      case '/grand-oral':
        this.pageTitle = 'Compléter la grille pour grand oral';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Compléter la grille pour grand oral');
        break;
      case '/jury-organization/all-jury-schedule':
        this.pageTitle = 'Schedule of Jury';
        this.isTutorialAdded = false;
        this.getInAppTutorial('Schedule of Jury');
        break;
      case '/title-rncp/details':
        break;
      case '/tutorial-app':
        this.pageTitle = 'InApp Tutorials';
        this.isTutorialAdded = false;
        this.getInAppTutorial('InApp Tutorials');
        break;
      case '/certidegree/':
        this.pageTitle = '';
        this.isTutorialAdded = false;
        this.getInAppTutorial('List of CertiDegree');
        break;
      case '/employability-survey':
        this.pageTitle = 'List of Employability Survey';
        this.isTutorialAdded = false;
        this.getInAppTutorial('List of Employability Survey');
        break;
      case '/form-builder':
        this.pageTitle = 'List of Form Template';
        this.isTutorialAdded = false;
        this.getInAppTutorial('List of Form Template');
        break;
      case '/form-follow-up':
        this.pageTitle = 'Form Follow Up Table';
        this.isTutorialAdded = false;
        this.getInAppTutorial('List of Form Template');
        break;
      default:
        // this.pageTitle = '';
        this.isTutorialAdded = false;
        break;
    }

    // For jury organization, need to check using include. so cannot use in switchase because it has juryorgid
    if (this.router.url.includes('/jury-organization') && !this.router.url.includes('/organize-juries/setup-schedule')) {
      this.pageTitle = 'List of jury organizations';
      this.isTutorialAdded = false;
      this.getInAppTutorial('Jury Organization');
    }
    if (this.router.url.includes('/jury-organization') && this.router.url.includes('/setup-schedule')) {
      this.pageTitle = 'retake-setup-schedule';
      this.isTutorialAdded = false;
      this.getInAppTutorial('Jury Organization');
    }
    if (this.router.url.includes('/jury-organization') && this.router.url.includes('/setup-schedule-go')) {
      this.pageTitle = 'grandOral-setup-schedule';
      this.isTutorialAdded = false;
      this.getInAppTutorial('Jury Organization');
    }
  }

  goToRetakeGrandOral(id) {
    if (id) {
      this.router.navigate([`/jury-organization/${id}/organize-juries/grand-oral-jury-parameter`]);
    }
  }

  goToGrandOral(id) {
    if (id) {
      this.router.navigate([`/jury-organization/${id}/organize-juries/grand-oral-jury-parameter`]);
    }
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  getCurrentUser() {
    this.userService.reloadCurrentUser$.subscribe((isReload) => {
      if (isReload) {
        this.currentUser = this.authService.getLocalStorageUser();
        this.userService.reloadCurrentUser(false);
        this.checkAlert();
      }
    });
  }

  ngOnDestroy() {
    this._router.unsubscribe();
    this.subs.unsubscribe();
  }

  /**
   *As router outlet will emit an activate event any time a new component is being instantiated.
   */
  onActivate(e, scrollContainer) {
    scrollContainer.scrollTop = 0;
  }

  /**
   * toggleFullscreen method is used to show a template in fullscreen.
   */
  toggleFullscreen() {
    if (screenfull.enabled) {
      screenfull.toggle();
      this.isFullscreen = !this.isFullscreen;
    }
  }

  /**
   * customizerFunction is used to open and close the customizer.
   */
  customizerFunction() {
    this.customizerIn = !this.customizerIn;
  }

  /**
   * addClassOnBody method is used to add a add or remove class on body.
   */
  addClassOnBody(event) {
    const body = document.body;
    if (event.checked) {
      body.classList.add('dark-theme-active');
    } else {
      body.classList.remove('dark-theme-active');
    }
  }

  /**
   * changeRTL method is used to change the layout of template.
   */
  changeRTL(isChecked) {
    if (isChecked) {
      this.layout = 'rtl';
    } else {
      this.layout = 'ltr';
    }
  }

  /**
   * toggleSidebar method is used a toggle a side nav bar.
   */
  toggleSidebar() {
    this.selectedBar = '';
    this.coreService.sidenavMode = 'side';
    this.coreService.sidenavOpen = !this.coreService.sidenavOpen;
    if (this.coreService.sidenavTutorialOpen) {
      this.coreService.sidenavTutorialOpen = !this.coreService.sidenavTutorialOpen;
    }
  }

  /**
   * logOut method is used to log out the  template.
   */
  logOut() {
    this.authService.logOut();
  }

  /**
   * relogin method is used to log in as previous user.
   */
  backToPreviousLogin() {
    const user = _.cloneDeep(JSON.parse(localStorage.getItem('backupUser')));
    this.authService.loginAsPreviousUser();

    const userLogin = user;

    const entities = userLogin.entities;

    const sortedEntities = this.utilService.sortEntitiesByHierarchy(entities);
    const permissions = [];
    const permissionsId = [];
    if (sortedEntities && sortedEntities.length > 0) {
      sortedEntities.forEach((entity) => {
        permissions.push(entity.type.name);
        permissionsId.push(entity.type._id);
      });
    }

    this.authService.setPermission([permissions[0]]);
    this.ngxPermissionService.flushPermissions();
    this.ngxPermissionService.loadPermissions([permissions[0]]);

    this.userService.reloadCurrentUser(true);
    this.router.navigateByUrl('/mailbox/inbox', { skipLocationChange: true }).then(() => {
      if (this.ngxPermissionService.getPermission('Mentor') || this.ngxPermissionService.getPermission('HR')) {
        this.router.navigate(['/students-card']);
      } else if (this.ngxPermissionService.getPermission('Chief Group Academic')) {
        this.router.navigate(['/school-group']);
      } else if (this.ngxPermissionService.getPermission('Student')) {
        this.router.navigate(['/my-file']);
      } else {
        this.router.navigate(['/']);
      }
    });
  }

  openPrivacyPolicy() {
    const urlFr = `${environment.apiUrl}/privacy-policy/FR_USER.html`.replace('/graphql', '');
    const urlEn = `${environment.apiUrl}/privacy-policy/EN_USER.html`.replace('/graphql', '');
    window.open(this.translate.currentLang === 'fr' ? urlFr : urlEn, '_blank');
  }

  /**
   * sidebarFilter function filter the color for sidebar section.
   */
  sidebarFilter(selectedFilter) {
    for (let i = 0; i < this.sideBarFilterClass.length; i++) {
      document.getElementById('main-app').classList.remove(this.sideBarFilterClass[i].colorSelect);
      if (this.sideBarFilterClass[i].colorSelect === selectedFilter.colorSelect) {
        document.getElementById('main-app').classList.add(this.sideBarFilterClass[i].colorSelect);
      }
    }
    document.querySelector('.radius-circle').classList.remove('radius-circle');
    document.getElementById(selectedFilter.sideBarSelect).classList.add('radius-circle');
  }

  /**
   * headerFilter function filter the color for header section.
   */
  headerFilter(selectedFilter) {
    for (let i = 0; i < this.headerFilterClass.length; i++) {
      document.getElementById('main-app').classList.remove(this.headerFilterClass[i].colorSelect);
      if (this.headerFilterClass[i].colorSelect === selectedFilter.colorSelect) {
        document.getElementById('main-app').classList.add(this.headerFilterClass[i].colorSelect);
      }
    }
    document.querySelector('.radius-active').classList.remove('radius-active');
    document.getElementById(selectedFilter.headerSelect).classList.add('radius-active');
  }

  /**
   *chatMenu method is used to toggle a chat menu list.
   */
  /* chatMenu() {
    document.getElementById('gene-chat').classList.toggle('show-chat-list');
  } */

  /**
   * onChatOpen method is used to open a chat window.
   */
  /*   onChatOpen() {
    document.getElementById('chat-open').classList.toggle('show-chat-window');
  } */

  /**
   * onChatWindowClose method is used to close the chat window.
   */
  /*  chatWindowClose() {
    document.getElementById('chat-open').classList.remove('show-chat-window');
  } */

  collapseSidebar(event) {
    document.getElementById('main-app').classList.toggle('collapsed-sidebar');
  }

  // onResize method is used to set the side bar according to window width.
  @HostListener('window:resize', ['$event'])
  onResize(event) {
    this.windowSize = event.target.innerWidth;
    this.resizeSideBar();
  }

  // customizeSidebar method is used to change the side bar behaviour.
  customizeSidebar() {
    if (
      (this.url === '/dashboard/courses' ||
        this.url === '/courses/courses-list' ||
        this.url === '/courses/course-detail' ||
        this.url === '/ecommerce/shop' ||
        this.url === '/ecommerce/checkout' ||
        this.url === '/ecommerce/invoice') &&
      this.windowSize < 1920
    ) {
      this.coreService.sidenavMode = 'over';
      this.coreService.sidenavOpen = false;
      if (!document.getElementById('main-app').classList.contains('sidebar-overlay')) {
        document.getElementById('main-app').className += ' sidebar-overlay';
      }
    } else if (
      window.innerWidth > 1200 &&
      (this.url === '/dashboard/crypto' ||
        this.url === '/crypto/marketcap' ||
        this.url === '/crypto/wallet' ||
        this.url === '/crypto/trade')
    ) {
      this.collapseSidebarStatus = this.coreService.collapseSidebar;
      if (this.collapseSidebarStatus === false && window.innerWidth > 1200) {
        document.getElementById('main-app').className += ' collapsed-sidebar';
        this.coreService.collapseSidebar = true;
        this.coreService.sidenavOpen = true;
        this.coreService.sidenavMode = 'side';
        document.getElementById('main-app').classList.remove('sidebar-overlay');
      }
    } else if (
      window.innerWidth > 1200 &&
      !(
        this.url === '/dashboard/courses' ||
        this.url === '/courses/courses-list' ||
        this.url === '/courses/course-detail' ||
        this.url === '/ecommerce/shop' ||
        this.url === '/ecommerce/checkout' ||
        this.url === '/ecommerce/invoice'
      )
    ) {
      this.coreService.sidenavMode = 'side';
      if (this.showSidebar) {
        this.coreService.sidenavOpen = true;
      } else {
        this.coreService.sidenavOpen = false;
      }
      // for responsive
      const main_div = document.getElementsByClassName('app');
      for (let i = 0; i < main_div.length; i++) {
        if (main_div[i].classList.contains('sidebar-overlay')) {
          document.getElementById('main-app').classList.remove('sidebar-overlay');
        }
      }
    } else if (window.innerWidth < 1200) {
      // for responsive
      this.coreService.sidenavMode = 'over';
      this.coreService.sidenavOpen = false;
      const main_div = document.getElementsByClassName('app');
      for (let i = 0; i < main_div.length; i++) {
        if (!main_div[i].classList.contains('sidebar-overlay')) {
          document.getElementById('main-app').className += ' sidebar-overlay';
        }
      }
    }
  }

  getInAppTutorial(type) {
    // const permission = this.isPermission && this.isPermission.length && this.isPermission[0] ? this.isPermission[0] : [];
    const userType = this.currentUser.entities[0].type.name;
    this.subs.sink = this.tutorialService.GetAllInAppTutorialsByModule(type, userType).subscribe((list) => {
      if (list && list.length) {
        this.dataTutorial = list;
        const tutorialData = this.dataTutorial.filter((tutorial) => {
          return tutorial.is_published === true && tutorial.module === type;
        });
        this.tutorialData = tutorialData[0];
        if (this.tutorialData) {
          this.isTutorialAdded = true;
        } else {
          this.isTutorialAdded = false;
        }
      }
    });
  }

  toggleTutorial(data) {
    this.tutorialService.setTutorialView(data);
    if (this.coreService.sidenavOpen) {
      this.coreService.sidenavOpen = !this.coreService.sidenavOpen;
    }
    this.coreService.sidenavTutorialOpen = !this.coreService.sidenavTutorialOpen;
  }

  navTutorialClosed() {
    this.selectedBar = '';
    this.coreService.setTutorialView(null);
  }

  // To resize the side bar according to window width.
  resizeSideBar() {
    if (this.windowSize < 1200) {
      this.isMobileStatus = true;
      this.isMobile = this.isMobileStatus;
      this.coreService.sidenavMode = 'over';
      this.coreService.sidenavOpen = false;
      // for responsive
      const main_div = document.getElementsByClassName('app');
      for (let i = 0; i < main_div.length; i++) {
        if (!main_div[i].classList.contains('sidebar-overlay')) {
          if (document.getElementById('main-app')) {
            document.getElementById('main-app').className += ' sidebar-overlay';
          }
        }
      }
    } else if (
      (this.url === '/dashboard/courses' ||
        this.url === '/courses/courses-list' ||
        this.url === '/courses/course-detail' ||
        this.url === '/ecommerce/shop' ||
        this.url === '/ecommerce/checkout' ||
        this.url === '/ecommerce/invoice') &&
      this.windowSize < 1920
    ) {
      this.customizeSidebar();
    } else {
      this.isMobileStatus = false;
      this.isMobile = this.isMobileStatus;
      this.coreService.sidenavMode = 'side';
      if (this.showSidebar) {
        this.coreService.sidenavOpen = true;
      } else {
        this.coreService.sidenavOpen = false;
      }
      // for responsive
      const main_div = document.getElementsByClassName('app');
      for (let i = 0; i < main_div.length; i++) {
        if (main_div[i].classList.contains('sidebar-overlay')) {
          document.getElementById('main-app').classList.remove('sidebar-overlay');
        }
      }
    }
  }
  onScrollContainer(event) {
    if (event && event.path && event.path[8].URL.search('/title-rncp/details/') !== -1) {
      this.rncpTitleService.setEventScroll(event);
    }
  }

  openNeedHelp() {
    this.contactUsDialogComponent = this.dialog.open(ContactUsDialogComponent, this.config);
  }

  openTutorial() {
    this.router.navigate(['tutorial']);
  }

  getUserSchool() {
    this.isCompanyUser = this.utilService.isUserCompany();
    if (this.isCompanyUser) {
      return '';
    } else {
      return this.currentUser &&
        this.currentUser.entities[0] &&
        this.currentUser.entities[0].school &&
        this.currentUser.entities[0].school.short_name
        ? ' - ' + this.currentUser.entities[0].school.short_name
        : '';
    }
  }

  getCertificationRule() {
    const userData = this.authService.getLocalStorageUser();

    const userType = userData?.entities[0]?.type?.name;

    const titleId = userData?.entities[0]?.assigned_rncp_title?._id;
    const classId = userData?.entities[0]?.class?._id;
    const schoolId = userData?.entities[0]?.school?._id;
    const userId = userData?._id;
    let isForPC;
    let forkParam = [];
    let titleShortName;
    let titleLongName;
    let titleData;
    let certifData;
    let certificationRuleSentId;

    if (userType === 'Academic Director') {
      if (userId && schoolId) {
        forkParam.push(this.rncpTitleService.getRncpTitleById(titleId));
        forkParam.push(this.certificationService.getOneCertificationRuleSentForPC(null, null, userId, schoolId));
      }

      this.subs.sink = forkJoin(forkParam).subscribe((resp) => {
        if (resp && resp.length) {
          let count = 0;
          if (resp[count]) {
            titleData = _.cloneDeep(resp[count]);
            count++;
          }

          if (resp[count]) {
            certifData = _.cloneDeep(resp[count]);
            count++;
          }

          if (titleData && certifData) {
            titleShortName = titleData.short_name;
            titleLongName = titleData.long_name;
            isForPC = certifData.is_for_preparation_center ?? false;
            certificationRuleSentId = certifData._id;
            let titleIdCertif = certifData.rncp_id._id;
            let classIdCertif = certifData.class_id._id;
            if (userId && schoolId && isForPC) {
              this.showCertificationRule(
                titleIdCertif,
                classIdCertif,
                userId,
                schoolId,
                isForPC,
                titleShortName,
                titleLongName,
                certificationRuleSentId,
              );
            }
          }
        }

        console.log('titleData, certifData', titleData, certifData);

        if (titleData && certifData) {
          titleShortName = titleData.short_name;
          titleLongName = titleData.long_name;
          isForPC = certifData.is_for_preparation_center ?? false;
          certificationRuleSentId = certifData._id;
          let titleIdCertif = certifData.rncp_id._id;
          let classIdCertif = certifData.class_id._id;
          if (userId && schoolId && isForPC) {
            this.showCertificationRule(
              titleIdCertif,
              classIdCertif,
              userId,
              schoolId,
              isForPC,
              titleShortName,
              titleLongName,
              certificationRuleSentId,
            );
          }
        }
      });
    }
  }

  showCertificationRule(titleId, classId, userId, schoolId, isForPC, titleShortName, titleLongName, certificationRuleSentId) {
    this.dialog
      .open(CertificationRulePopUpComponent, {
        panelClass: 'reply-message-pop-up',
        disableClose: true,
        maxWidth: '820px',
        data: {
          isForPC: isForPC,
          titleId: titleId,
          classId: classId,
          userId: userId,
          schoolId: schoolId,
          titleName: titleShortName,
          titleLongName: titleLongName,
          certificationRuleSentId: certificationRuleSentId,
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result === 'cert_rule_check') {
          this.getCertificationRule();
        }
      });
  }
}
