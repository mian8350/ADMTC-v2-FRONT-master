import { Component, OnInit, Input, OnDestroy, ViewChild, OnChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { CoreService } from '../../service/core/core.service';
import { MenuItems } from '../../core/menu/menu-items/menu-items';
import { UntypedFormControl } from '@angular/forms';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UserProfileData } from 'app/users/user.model';
import { SubSink } from 'subsink';
import { UrgentMessageDialogComponent } from 'app/urgent-message/urgent-message-dialog.component';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { PermissionService } from 'app/service/permission/permission.service';
import { MailToGroupDialogComponent } from 'app/mailbox/mail-to-group-dialog/mail-to-group-dialog.component';
import { environment } from 'environments/environment';
import { ContactUsDialogComponent } from 'app/need-help/contact-us/contact-us-dialog.component';
import { ApplicationUrls } from '../settings';
import * as _ from 'lodash';
import { ParseStringDatePipe } from '../pipes/parse-string-date.pipe';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ImagePreviewDialogComponent } from '../components/image-preview-dialog/image-preview-dialog.component';
@Component({
  selector: 'ms-tutorial-bar',
  templateUrl: './tutorial-bar.component.html',
  styleUrls: ['./tutorial-bar.component.scss'],
  providers: [ParseStringDatePipe],
})
export class TutorialBarComponent implements OnInit, OnDestroy, OnChanges {
  private subs = new SubSink();
  @Input() menuList: any;
  @Input() verticalMenuStatus: boolean;
  @ViewChild('fileUpload', { static: false }) uploadInput: any;

  juryOrgId;
  juryName;
  isUserADMTC;
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
  };
  config: MatDialogConfig = {
    disableClose: true,
    width: '800px',
  };
  configImage: MatDialogConfig = {
    disableClose: true,
    width: '1400px',
  };
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  urgentMessageDialogComponent: MatDialogRef<UrgentMessageDialogComponent>;
  contactUsDialogComponent: MatDialogRef<ContactUsDialogComponent>;
  imagePreviewDialogComponent: MatDialogRef<ImagePreviewDialogComponent>;
  mailToGroupDialogComponent: MatDialogRef<MailToGroupDialogComponent>;

  filteredValues = {
    _id: '',
    module: '',
    sub_module: '',
    is_published: true,
  };
  moduleSelected = '';
  dataTutorial: any;

  envLink = environment.apiUrl;
  selected = 0;
  constructor(
    public translate: TranslateService,
    private router: Router,
    public coreService: CoreService,
    public menuItems: MenuItems,
    private authService: AuthService,
    public dialog: MatDialog,
    public permissionService: PermissionService,
    private tutorialService: TutorialService,
    public utilService: UtilityService,
  ) { }

  ngOnInit() {
    this.isUserADMTC = this.utilService.isUserEntityADMTC();
    this.dataTutorial = null;
    this.currentUser = this.authService.getLocalStorageUser();
    this.subs.sink = this.tutorialService.currentStep.subscribe((val) => {
      this.selected = val;
      this.getOneTutorial();
    });
    this.subs.sink = this.tutorialService.tutorialData.subscribe((val) => {
      if (val) {
        this.dataTutorial = val;
      } else {
        this.getOneTutorial();
      }

      if (this.dataTutorial && this.dataTutorial.module === 'Jury Organization') {
        this.subs.sink = this.tutorialService.juryName.subscribe((vals) => {
          if (vals) {
            this.juryName = vals;
          }
        });
      }
    });
  }

  ngOnChanges() {
    this.dataTutorial = null;
    this.currentUser = this.authService.getLocalStorageUser();
    switch (this.router.url) {
      case '/candidates':
        this.moduleSelected = 'Candidate Follow Up';
        break;
      case '/admission-member':
        this.moduleSelected = 'Admission Member';
        break;
      case '/finance-follow-up':
        this.moduleSelected = 'Finance Follow Up';
        break;
      case '/finance-member':
        this.moduleSelected = 'Financial Member';
        break;
      case '/finance-history':
        this.moduleSelected = 'History Finance';
        break;
      case '/cheque-transaction':
        this.moduleSelected = 'Cheques';
        break;
      case '/finance-import':
        this.moduleSelected = 'Reconciliation & Lettrage';
        break;
      default:
        this.moduleSelected = null;
        break;
    }
    this.subs.sink = this.tutorialService.tutorialData.subscribe((val) => {
      if (val) {
        this.dataTutorial = val;
      } else {
        this.getOneTutorial();
      }
    });
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  getOneTutorial() {
    if (this.moduleSelected) {
      this.filteredValues.module = this.moduleSelected;
      const filter = this.cleanFilterData();
      this.subs.sink = this.tutorialService.GetOneInAppTutorial(filter).subscribe((list) => {
        this.dataTutorial = list;
      });
    }
  }

  openNeedHelp() {
    this.contactUsDialogComponent = this.dialog.open(ContactUsDialogComponent, this.config);
  }

  openImage(data) {
    this.subs.sink = this.dialog
      .open(ImagePreviewDialogComponent, {
        disableClose: true,
        width: '98%',
        height: '98%',
        panelClass: 'image-preview-pop-up',
        data: data,
      })
      .afterClosed()
      .subscribe((resp) => { });
  }

  cleanFilterData() {
    const filterData = _.cloneDeep(this.filteredValues);
    let filterQuery = '';
    Object.keys(filterData).forEach((key) => {
      // only add key that has value to the query. so it wont send filter with empty string
      if (filterData[key] || filterData[key] === false) {
        if (key === '_id' || key === 'module' || key === 'sub_module') {
          filterQuery = filterQuery + ` ${key}:"${filterData[key]}"`;
        } else {
          filterQuery = filterQuery + ` ${key}:${filterData[key]}`;
        }
      }
    });
    return 'filter: {' + filterQuery + '}';
  }

  dataModuleNoEmpty() {
    let isNotEmpty = false;
    const subModule =
      this.dataTutorial && this.dataTutorial.sub_modules && this.dataTutorial.sub_modules.length ? this.dataTutorial.sub_modules : [];
    if (subModule && subModule.length) {
      if (subModule[0].sub_module) {
        isNotEmpty = true;
      }
    }
    return isNotEmpty;
  }
  dataItemNoEmpty(index) {
    let isNotEmpty = false;
    const items =
      this.dataTutorial &&
        this.dataTutorial.sub_modules &&
        this.dataTutorial.sub_modules[index] &&
        this.dataTutorial.sub_modules[index].items &&
        this.dataTutorial.sub_modules[index].items.length
        ? this.dataTutorial.sub_modules[index].items
        : [];
    if (items && items.length) {
      if (items[0].title) {
        isNotEmpty = true;
      }
    }
    return isNotEmpty;
  }

  toggleSidebar() {
    this.coreService.sidenavOpen = !this.coreService.sidenavOpen;
    this.coreService.sidenavTutorialOpen = !this.coreService.sidenavTutorialOpen;
  }

  viewTutorial(data) {
    if (!data.includes('http')) {
      data = 'http://' + data;
    }
    window.open(data, '_blank');
  }

  getMessage(data) {
    if (data && data.includes('<img')) {
      const imgs = _.cloneDeep(data);
      let img = imgs.split('src="');
      if (data && data.includes('<figcaption>')) {
        img = img[1].split('"><figcaption>');
        img = img[0];
      } else {
        img = img[1].split('"></figure>');
        img = img[0];
      }
      if (img) {
        this.openImage(img.toString());
      }

    }
    return '';
  }

  panic() {
    const currentUser = this.utilService.getCurrentUser();
    const whatsAppUrl = 'https://api.whatsapp.com/send?phone=6593722206&text=';
    let whatsAppText = '';
    if (this.isUserADMTC) {
      whatsAppText = this.translate.instant('PANIC.MESSAGE_ADMTC', {
        userName: `${this.translate.instant(currentUser.civility)} ${currentUser.first_name} ${currentUser.last_name}`,
        userType:
          currentUser.entities && currentUser.entities[0] && currentUser.entities[0].type && currentUser.entities[0].type.name
            ? this.translate.instant(currentUser.entities[0].type.name)
            : '',
        juryName: this.juryName ? this.juryName : '',
      });
    } else {
      whatsAppText = this.translate.instant('PANIC.MESSAGE', {
        userName: `${this.translate.instant(currentUser.civility)} ${currentUser.first_name} ${currentUser.last_name}`,
        userType:
          currentUser.entities && currentUser.entities[0] && currentUser.entities[0].type && currentUser.entities[0].type.name
            ? this.translate.instant(currentUser.entities[0].type.name)
            : '',
        school:
          currentUser.entities && currentUser.entities[0] && currentUser.entities[0].school && currentUser.entities[0].school.short_name
            ? currentUser.entities[0].school.short_name
            : '',
        juryName: this.juryName ? this.juryName : '',
      });
    }


    window.open(whatsAppUrl + whatsAppText, '_blank');
  }
}
