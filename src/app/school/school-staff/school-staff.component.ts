import { AddUserDialogComponent } from './../../shared/components/add-user-dialog/add-user-dialog.component';
import { UserDeactivationDialogComponent } from './../../users/user-deactivation-dialog/user-deactivation-dialog.component';
import { Component, OnInit, Input, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntypedFormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { UserTableData } from '../../users/user.model';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import * as moment from 'moment';
import { UsersService } from '../../service/users/users.service';
import { ExportCsvService } from '../../service/export-csv/export-csv.service';
import { SchoolStaffDialogComponent } from './school-staff-dialog/school-staff-dialog.component';
import { UserService } from 'app/service/user/user.service';
import { SchoolService } from 'app/service/schools/school.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SelectionModel } from '@angular/cdk/collections';
import { startWith, map, debounceTime } from 'rxjs/operators';
import { UtilityService } from 'app/service/utility/utility.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxPermissionsService } from 'ngx-permissions';
import { LoginAsUserDialogComponent } from 'app/shared/components/login-as-user-dialog/login-as-user-dialog.component';
import { SubSink } from 'subsink';
import { SchoolComposeEmailDialogComponent } from '../school-compose-email-dialog/school-compose-email-dialog.component';
import { PermissionService } from 'app/service/permission/permission.service';
import { CoreService } from 'app/service/core/core.service';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import { IncorrectUsersEmailDialogComponent } from 'app/shared/components/incorrect-users-email-dialog/incorrect-users-email-dialog.component';

@Component({
  selector: 'ms-school-staff',
  templateUrl: './school-staff.component.html',
  styleUrls: ['./school-staff.component.scss'],
})
export class SchoolStaffComponent implements OnInit, OnDestroy {
  @Input() schoolId: string;
  private subs = new SubSink();

  displayedColumns: string[] = [];
  filterColumns: string[] = [];
  dataSource = new MatTableDataSource([]);
  selection = new SelectionModel<any>(true, []);
  userDialogComponent: MatDialogRef<SchoolStaffDialogComponent>;
  AddUserDialogComponent: MatDialogRef<AddUserDialogComponent>;
  mailSchoolStaff: MatDialogRef<SchoolComposeEmailDialogComponent>;
  UserDeactivationDialogComponent: MatDialogRef<UserDeactivationDialogComponent>;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  schoolsCount = 0;
  noData: any;
  nameFilter = new UntypedFormControl('');
  schoolFilter = new UntypedFormControl('');
  titleFilter = new UntypedFormControl('');
  userTypeFilter = new UntypedFormControl('');
  entityFilter = new UntypedFormControl('');
  statusFilter = new UntypedFormControl('');

  filteredTitle: Observable<any[]>;
  filteredUserTypes: Observable<any[]>;
  filterTitleList = [];

  filteredTaskType: Observable<any[]>;
  filterTaskTypeList = [];

  titleNames = ['AllM'];
  filteredTitleNames: Observable<string[]>;

  statusFilterList = [
    { key: 'AllM', value: '' },
    { key: 'Active', value: 'active' },
    { key: 'Incorrect Email', value: 'incorrect_email' },
    { key: 'Pending', value: 'pending' },
  ];

  userTypeList = [];
  originalUserTypeList: any;

  countRNCPTitles = 0;
  RNCPTitles: any[];
  users: UserTableData[];
  exportName: 'Export';
  isPCUserType: any;
  currentUser: any;
  isCRUserType: any;

  // Configuration of the Popup Size and display
  configCat: MatDialogConfig = {
    disableClose: true,
    minWidth: '95%',
    minHeight: '81%',
  };

  deleteConfig: MatDialogConfig = {
    disableClose: true,
    panelClass: 'no-max-height',
    width: '600px',
    maxHeight: '75vh',
  };

  filteredValues = {
    name: '',
    title: '',
    userType: '',
    status: '',
  };

  sortValue = null;
  isReset = false;
  dataLoaded = false;
  isWaitingForResponse = false;

  operation: string;
  selectedIndex = null;
  userEntities: any[];
  searchText: string;
  isUserAdmtc = false;
  isUserAcadir = false;
  isUserAcadAdmin = false;
  isUserAcadFinalJuryMember = false;
  isUserCrdir = false;
  isUserCrAdmin = false;
  isOnlyPc = false;
  isOnlyCR = false;
  isPcAndCr = false;

  schoolIsCR = false;
  schoolIsPC = false;
  schoolIsPCCR = false;
  userTypesList = [];
  originalUserTypesList = [];
  isAutoFilter = false;
  selectedFilterName: string;

  isTutorialAdded = false;
  dataTutorial: any;
  tutorialData: any;
  isPermission: any;

  private timeOutVal: any;

  constructor(
    private translate: TranslateService,
    private usersService: UsersService,
    private userService: UserService,
    public dialog: MatDialog,
    private exportCsvService: ExportCsvService,
    private schoolService: SchoolService,
    private rncpTitleService: RNCPTitlesService,
    private utilService: UtilityService,
    private authService: AuthService,
    private router: Router,
    private ngxPermissionService: NgxPermissionsService,
    public permissionService: PermissionService,
    private route: ActivatedRoute,
    public coreService: CoreService,
    public tutorialService: TutorialService,
  ) {}

  ngOnInit() {
    this.isPermission = this.authService.getPermission();
    this.currentUser = this.authService.getLocalStorageUser();
    this.isUserAdmtc = this.utilService.isUserEntityADMTC();

    this.isUserAcadir = !!this.ngxPermissionService.getPermission('Academic Director');
    this.isUserAcadAdmin = !!this.ngxPermissionService.getPermission('Academic Admin');
    this.isUserAcadFinalJuryMember = !!this.ngxPermissionService.getPermission('Academic Final Jury Member');

    this.isUserCrdir = !!this.ngxPermissionService.getPermission('CR School Director');
    this.isUserCrAdmin = !!this.ngxPermissionService.getPermission('Certifier Admin');


    if (this.isUserCrdir || this.isUserCrAdmin) {
      this.displayedColumns = ['name', 'title', 'userType', 'status'];
      this.filterColumns = ['nameFilter', 'titleFilter', 'userTypeFilter', 'statusFilter'];
    } else {
      this.displayedColumns = ['name', 'title', 'userType', 'status', 'action'];
      this.filterColumns = ['nameFilter', 'titleFilter', 'userTypeFilter', 'statusFilter', 'actionFilter'];
    }

    const userId = this.route.snapshot.queryParamMap.get('schoolstaff');
    const userTypeFilter = this.route.snapshot.queryParamMap.get('userTypeFilter');
    
    if (userId) {
      this.isAutoFilter = true;
      this.autoFilterUser(userId);
    } else if (userTypeFilter) {
      this.setUserType(userTypeFilter);
    } else {
      this.getSchoolStaff();
    }
    
    this.getInAppTutorial('School Staff');
    this.initializeUserFilter();

    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.setFilteredUserType(this.userTypeList)
    });
  }

  getSchoolStaff() {
    if (this.isUserAdmtc) {
      this.subs.sink = this.userService.getAllUserTypeDropdown().subscribe((userTypes: any) => {
        this.userTypeList = userTypes;
        this.userTypesList = userTypes.map(type => type._id);
        this.setFilteredUserType(userTypes);
        this.getAllUserBySchool();
      });
    } else if (this.isUserCrAdmin || this.isUserCrdir) {
      this.subs.sink = this.userService.getUserTypesByEntityAndSchoolType('academic', 'certifier', true).subscribe((userTypes) => {
        this.userTypeList = userTypes;
        this.userTypesList = userTypes.map(type => type._id);
        this.setFilteredUserType(this.userTypeList);
        this.getAllUserBySchool();
      });
    } else if (this.isUserAcadir || this.isUserAcadAdmin || this.isUserAcadFinalJuryMember) {
      this.subs.sink = this.userService.getUserTypesByEntityAndSchoolType('academic', 'preparation_center', true).subscribe((userTypes) => {
        this.userTypeList = userTypes;
        this.userTypesList = userTypes.map(type => type._id);
        this.setFilteredUserType(this.userTypeList);
        this.getAllUserBySchool();
      });
    }
  }

  // ngAfterViewInit() {
  //   this.subs.sink = this.paginator.page
  //     .pipe(
  //       startWith(null),
  //       tap(() => {
  //         if (!this.isReset) {
  //           this.getAllUserBySchool();
  //         }
  //         this.dataLoaded = true;
  //       }),
  //     )
  //     .subscribe();
  // }

  sortData(sort: Sort) {
    if (sort.active === 'last_name') {
      this.sortValue = sort.direction ? { full_name: sort.direction } : null;
    } else if (sort.active === 'title') {
      this.sortValue = sort.direction ? { title: sort.direction } : null;
    } else if (sort.active === 'userType') {
      this.sortValue = sort.direction ? { user_type: sort.direction } : null;
    } else if (sort.active === 'status') {
      this.sortValue = sort.direction ? { user_status: sort.direction } : null;
    }
    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllUserBySchool();
      }
    }
  }

  initTitleFilterDropdown(titleId?: string[]) {
    this.subs.sink = this.rncpTitleService
      .getRncpTitleListSearch(this.schoolId)
      .pipe(
        map((titles) => {
          if (!titleId?.length) return titles;
          return titles.filter((title) => titleId.includes(title._id));
        }),
      )
      .subscribe((resp) => {
        this.filteredTitleNames = this.titleFilter.valueChanges.pipe(
          startWith(''),
          map((searchText: string) => {
            if (searchText === undefined || searchText === '') return resp;
            return _.cloneDeep(resp).filter((title) => title?.short_name?.toLowerCase()?.includes(searchText?.toLowerCase()));
          }),
        );
      });
  }

  initializeUserFilter() {
    this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe({
      next: (resp) => {
        const userType = this.currentUser.entities ? this.currentUser?.entities[0]?.type?.name : '';
        const school = this.currentUser.entities ? this.currentUser?.entities[0]?.school?._id : '';
        const academicUser = resp.entities.filter((ent) => ent?.type?.name === userType && ent?.school?._id === school);
        // const titleId = this.utilService.getAcademicAllAssignedTitle(academicUser) || null;
        this.initTitleFilterDropdown();
      },
      error: (err) => {
        // this.authService.postErrorLog(err);
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
        return;
      },
    });

    if (this.isPcAndCr) {
      this.userTypeList = this.usersService.UserTypeAcademicList;
      this.userTypeList = _.orderBy(this.userTypeList, ['name'], ['asc']);
      this.setFilteredUserType(this.userTypeList)
    } else if (this.isOnlyPc) { 
      this.subs.sink = this.userService.getUserTypesByEntityAndSchoolType('academic', 'preparation_center', true).subscribe((userTypes) => {
        this.userTypeList = userTypes;
        this.setFilteredUserType(this.userTypeList)
      });
    } else if (this.isOnlyCR) {
      this.subs.sink = this.userService.getUserTypesByEntityAndSchoolType('academic', 'certifier').subscribe((userTypes) => {
        this.userTypeList = userTypes;
        this.setFilteredUserType(this.userTypeList)
      });
    }

    this.subs.sink = this.nameFilter.valueChanges.pipe(debounceTime(800)).subscribe((name) => {
      this.filteredValues.name = name;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getSchoolStaff();
      }
    });

  }

  setFilteredUserType(userTypeList) {
    const translatedUserType = userTypeList.map((item) => {
      return { _id: item._id, name: this.translate.instant('USER_TYPES.' + item.name) };
    }).sort((a, b) => a.name.localeCompare(b.name));

    this.filteredUserTypes = this.userTypeFilter.valueChanges.pipe(
      startWith(''),
      map((searchTxt) =>
      translatedUserType.filter((type) => type && this.utilService.simpleDiacriticSensitiveRegex(type.name).toLowerCase().trim().includes(searchTxt ? this.utilService.simpleDiacriticSensitiveRegex(searchTxt).toLowerCase().trim() : '')),
      ),
    );
    if(this.filteredValues.userType) {
      const searchType = userTypeList.find( data => data?._id === this.filteredValues.userType);
      const translatedValue = this.translate.instant('USER_TYPES.' + searchType?.name)
      this.userTypeFilter.setValue(translatedValue, { emitEvent: false })
    }
  }

  getSchoolDataPCCR() {
    this.isAutoFilter = false;
    this.isWaitingForResponse = true;

    this.subs.sink = this.schoolService.getSchoolPreparationCenterAndCertifier(this.schoolId).subscribe((resp) => {
      if (resp) {
        // if (this.isUserAcadir) {
        this.isOnlyPc = true;
        this.isWaitingForResponse = false;

        const temp = this.usersService.PCUsertypeList;
        temp.push(this.usersService.mentor);
        this.userTypesList =  this.isUserCrAdmin ? this.usersService.CRUsertypeList : temp;
        this.originalUserTypesList = temp;
        
        // } else {
        //   if (resp.certifier_ats && resp.certifier_ats.length && resp.preparation_center_ats && resp.preparation_center_ats.length) {
        //     this.isPcAndCr = true;
        //     this.userTypesList = this.usersService.PCUsertypeList.concat(this.usersService.CRUsertypeList);
        //     this.originalUserTypesList = this.usersService.PCUsertypeList.concat(this.usersService.CRUsertypeList);
        //   } else if (resp.preparation_center_ats && resp.preparation_center_ats.length) {
        //     this.isOnlyPc = true;
        //     this.userTypesList = this.usersService.PCUsertypeList;
        //     this.originalUserTypesList = this.usersService.PCUsertypeList;
        //   } else if (resp.certifier_ats && resp.certifier_ats.length) {
        //     this.isOnlyCR = true;
        //     this.userTypesList = this.usersService.CRUsertypeList;
        //     this.originalUserTypesList = this.usersService.CRUsertypeList;
        //   }
        // }
      }
      this.initializeUserFilter();
      this.getAllUserBySchool();
    });
  }

  getAllSchoolStaff() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.userService.getAllUserTypeDropdown().subscribe((resp: any) => {
      this.userTypeList = resp;
      this.userTypesList = resp.map(type => type._id);
      this.setFilteredUserType(resp);
      this.getAllUserBySchool();
      this.isWaitingForResponse = false;
    });
  }

  getAllUserBySchool() {
    this.isWaitingForResponse = true;

    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };

    let filter = ``;
    filter += this.filteredValues.name ? `full_name : "${this.filteredValues.name}"` : '';
    // filter += this.filteredValues.title ? `title: "${this.filteredValues.title}"` : '';
    // filter += this.filteredValues.userType ? `user_type: "${this.filteredValues.userType}"` : '';
    filter += this.filteredValues.status ? ` user_status: ${this.filteredValues.status}` : '';

    let titles = [];
    
    // *************** IF user is acad dir or admin, then will only get school staff with his own title
    if (this.utilService.isUserAcadDirAdmin()) {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';

      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((resp) => {
        const dataUSer = resp.entities.filter((ent) => ent.type.name === userType);
        titles = this.utilService.getAcademicAllAssignedTitle(dataUSer);
      });
      
      if (this.filteredValues.title && titles?.length) {
        titles = titles.filter((title) => title === this.filteredValues?.title);
      }

      if (this.filteredValues.title && !titles?.length) {
        titles.push(this.filteredValues.title);
      }
    } else {
      if (this.filteredValues.title) {
        titles.push(this.filteredValues.title);
      }
    }

    const tableFrom = 'school_staff';

    this.subs.sink = this.usersService
      .getAllUserInStaffSchool(
        this.schoolId,
        pagination,
        this.sortValue,
        filter,
        this.userTypesList,
        this.utilService.getCurrentUserType(),
        titles,
        tableFrom,
      )
      .subscribe((resp) => {
        if (resp && resp.length) {
          this.users = resp;
          this.dataSource.data = this.filterUsersEntities(resp);
          this.dataSource.sort = this.sort;
          this.paginator.length = resp[0].count_document ? resp[0].count_document : 0;
        } else {
          this.dataSource.data = [];
          this.paginator.length = 0;
        }
        this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
        this.isReset = false;
        this.isWaitingForResponse = false;
      });
  }

  filterUsersEntities(users) {
    const array = _.cloneDeep(users) || []
    for (const user of array) {
      if (this.currentUser?.entities[0]?.entity_name !== 'academic') break
      user.entities = (user?.entities || []).filter(entity => entity?.school?._id && entity?.school?._id === this.schoolId)
    }
    return array
  }

  changePage(event: any) {
    this.getAllUserBySchool();
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
        this.isTutorialAdded = !!this.tutorialData;
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

  setStatus(value) {
    this.filteredValues['status'] = value;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getAllUserBySchool();
    }
  }

  setTitle(value) {
    if (value === '0') {
      this.filteredValues['title'] = '';
    } else {
      this.filteredValues['title'] = value;
    }
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getAllUserBySchool();
    }
  }

  setUserType(value) {
    // const mentor = { _id: '5a2e603f53b95d22c82f9590', name: 'Mentor' };
    // this.userTypeList = this.usersService.UserTypeAcademicList;
    // this.userTypeList.push(mentor);
    // this.userTypeList = _.orderBy(this.userTypeList, ['name'], ['asc']);
    if (value === '0') {
      this.filteredValues['userType'] = '';
      this.userTypesList = this.originalUserTypesList;
    } else {
      this.filteredValues['userType'] = value;
      this.userTypesList = [];
      this.userTypesList.push(value);
      const foundFilterName = this.usersService.UserTypeAcademicList.find((res) => res._id === value);
      if (foundFilterName) {
        this.selectedFilterName = foundFilterName.name;
      }
    }
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getAllUserBySchool();
    }
  }

  addUser() {
    this.subs.sink = this.schoolService.getSchoolIdAndShortName(this.schoolId).subscribe((resp) => {
      this.subs.sink = this.dialog
        .open(AddUserDialogComponent, {
          disableClose: true,
          panelClass: 'certification-rule-pop-up',
          minWidth: '50%',
          // minHeight: '81%',
          data: {
            operation: 'add',
            school: resp,
          },
        })
        .afterClosed()
        .subscribe((isRegistered) => {});
    });
  }

  editUser(userData: UserTableData) {
    this.subs.sink = this.schoolService.getSchoolIdAndShortName(this.schoolId).subscribe((resp) => {
      // this.router.navigate(['/users/user-management-detail'], { queryParams: { userId: userData._id, isFromActiveUserTab:true } });
      window.open(`./users/user-management-detail/?userId=${userData._id}&isFromActiveUserTab=true`, '_blank');
      // this.subs.sink = this.dialog
      //   .open(SchoolStaffDialogComponent, {
      //     ...this.configCat,
      //     data: {
      //       userData: userData,
      //       operation: 'edit',
      //       school: resp,
      //     },
      //   })
      //   .afterClosed()
      //   .subscribe((isRegistered) => {
      //     if (isRegistered) {
      //       this.getAllUserBySchool();
      //     }
      //   });
    });
  }

  incorrectPassword(userId: string, civility: string, firstName: string, lastName: string) {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('INCORRECT_EMAIL.TITLE', {
        director: this.translate.instant('Academic Director/Certifier Admin'),
      }),
      html: this.translate.instant('INCORRECT_EMAIL.TEXT', {
        civility: this.translate.instant(civility),
        firstName: firstName,
        lastName: lastName,
      }),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('INCORRECT_EMAIL.CANCEL'),
      confirmButtonText: this.translate.instant('INCORRECT_EMAIL.SEND'),
      footer: `<span style="margin-left: auto">INCORRECT_EMAIL</span>`,
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
            });
            this.getAllUserBySchool();
          });
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
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonClass: 'btn-danger',
      allowOutsideClick: false,
      confirmButtonText: this.translate.instant('Deactivate_S1.BUTTON_1'),
      cancelButtonText: this.translate.instant('Deactivate_S1.BUTTON_2'),
      footer: `<span style="margin-left: auto">Deactivate_S1</span>`,
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

            this.getAllUserBySchool();
          });
      }
    });
  }

  deactiveUser(userId: string, civility: string, firstName: string, lastName: string) {
    let timeDisabled = 5;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('Attention'),
      html: this.translate.instant('DELETE_USER.QUESTION', {
        civility: this.translate.instant(civility),
        firstName: firstName,
        lastName: lastName,
      }),
      showCancelButton: true,
      confirmButtonText: this.translate.instant('SWEET_ALERT.DELETE.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('SWEET_ALERT.DELETE.CANCEL'),
      footer: `<span style="margin-left: auto">INCORRECT_EMAIL</span>`,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const time = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM') + ' in ' + timeDisabled + ' sec';
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(time);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((isConfirm) => {
      clearTimeout(this.timeOutVal);
      if (isConfirm.value) {
        this.subs.sink = this.userService.deleteUser(userId).subscribe((resp) => {
          if (resp) {
            if (!resp.errors) {
              Swal.fire({
                allowOutsideClick: false,
                confirmButtonText: this.translate.instant('OK'),
                type: 'success',
                title: this.translate.instant('DELETE_USER.SUCCESS_TITLE'),
                text: this.translate.instant('DELETE_USER.SUCCESS_TEXT'),
                footer: `<span style="margin-left: auto">INCORRECT_EMAIL</span>`,
              });
              this.getAllUserBySchool();
            } else if (resp.errors && resp.errors[0] && resp.errors[0].message === 'the mentor is already used in student contract') {
              Swal.fire({
                allowOutsideClick: false,
                confirmButtonText: this.translate.instant('DeleteMent_S1.BUTTON'),
                type: 'error',
                title: this.translate.instant('DeleteMent_S1.TITLE'),
                text: this.translate.instant('DeleteMent_S1.TEXT'),
                footer: `<span style="margin-left: auto">DeleteMent_S1</span>`,
              });
              this.getAllUserBySchool();
            } else if (resp.errors && resp.errors[0] && resp.errors[0].message === 'user should transfer the responsibility first') {
              Swal.fire({
                allowOutsideClick: false,
                confirmButtonText: this.translate.instant('DeleteTypeUser.Btn-Confirm'),
                type: 'error',
                title: this.translate.instant('DeleteTypeUser.Title'),
                text: this.translate.instant('DeleteTypeUser.Body'),
                footer: `<span style="margin-left: auto">DeleteTypeUser</span>`,
              });
              this.getAllUserBySchool();
            } else if (resp.errors && resp.errors[0] && resp.errors[0].message === 'user still have todo tasks') {
              Swal.fire({
                allowOutsideClick: false,
                confirmButtonText: this.translate.instant('DeleteUserTodo.Btn-Confirm'),
                type: 'warning',
                title: this.translate.instant('DeleteUserTodo.Title'),
                text: this.translate.instant('DeleteUserTodo.Body'),
                footer: `<span style="margin-left: auto">DeleteUserTodo</span>`,
              });
              this.getAllUserBySchool();
            } else if (resp.errors && resp.errors[0] && resp.errors[0].message) {
              Swal.fire({
                allowOutsideClick: false,
                confirmButtonText: this.translate.instant('OK'),
                type: 'error',
                title: this.translate.instant('Error'),
                text: resp.errors[0].message,
              });
            }
          }
        });
      }
    });
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  resetSelection() {
    this.isReset = true;
    this.paginator.pageIndex = 0;

    this.filteredValues = {
      name: '',
      title: '',
      userType: '',
      status: '',
    };

    this.nameFilter.setValue('');
    this.titleFilter.setValue('');
    this.userTypeFilter.setValue('');
    this.statusFilter.setValue('');

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    this.userTypesList = this.originalUserTypesList;
    this.getAllUserBySchool();
  }

  exportData() {
    const data = [];
    this.subs.sink = this.usersService.getAllStaffExport(this.schoolId).subscribe((resp) => {
      if (resp && resp.length) {
        for (const item of resp) {
          const obj = [];
          let titles = '';
          let userType = '';
          for (const entity of item.entities) {
            titles = titles
              ? titles + ', ' + (entity.assigned_rncp_title ? entity.assigned_rncp_title.short_name : '')
              : entity.assigned_rncp_title
              ? entity.assigned_rncp_title.short_name
              : '';
            userType = userType ? userType + ', ' + entity.type.name : entity.type.name;
          }

          // TODO: From the template get the data location and add the data
          obj[0] = item.last_name + ' ' + item.first_name + ' ' + item.civility;
          obj[1] = titles;
          obj[2] = userType;
          obj[3] = item.user_status;
          data.push(obj);
        }
        const valueRange = { values: data };
        const today = moment().format('DD-MM-YYYY');
        const title = this.exportName + '_' + today;
        const sheetID = this.translate.currentLang.toLowerCase() === 'en' ? 0 : 1797809470;
        const sheetData = {
          spreadsheetId: '1XfE9uExKqLNP6e_HixcxHtoo-81UwBmsUS_kuLocm6U',
          sheetId: sheetID,
          range: 'A7',
        };
        this.exportCsvService.createAndUpdateSpreadsheet(valueRange, title, sheetData);
        Swal.close();
      }
    });
  }

  connectAsUser(user: UserTableData) {
    const currentUser = this.utilService.getCurrentUser();

    if (user.entities && user.entities.length === 1) {
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
            allowEscapeKey: true,
            confirmButtonText: this.translate.instant('UNDERSTOOD'),
            footer: `<span style="margin-left: auto">USER_S7_SUPERUSER</span>`,
          }).then((result) => {
            this.authService.setLocalUserProfileAndToken(resp);
            this.authService.setPermission([user.entities[0].type.name]);
            this.ngxPermissionService.flushPermissions();
            this.ngxPermissionService.loadPermissions([user.entities[0].type.name]);
            this.userService.reloadCurrentUser(true);
            this.router.navigate(['/mailbox/inbox']);
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

  autoFilterUser(userId) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.usersService.getOneUserInStaffSchool(userId).subscribe(
      (response) => {
        const resp = [response];
        if (resp && resp.length) {
          this.users = resp;
          this.dataSource.data = this.filterUsersEntities(resp);
          this.dataSource.sort = this.sort;
          this.paginator.length = resp.length ? resp.length : 0;
        } else {
          this.dataSource.data = [];
          this.paginator.length = 0;
        }
        this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
        this.isReset = false;
        this.isWaitingForResponse = false;
      },
      (err) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  /*
   * Will render tooltip message for column school
   * */
  renderTooltipSchool(entities: any[]): string {
    let tooltip = '';
    for (const entity of entities) {
      if (entity.school) {
        tooltip = tooltip + `${entity.school.short_name}, `;
      }
    }
    return tooltip;
  }

  /*
   * Render tooltip for column title*/
  renderTooltipTitle(entities) {
    let tooltip = '';
    const title = _.uniqBy(entities, 'assigned_rncp_title.short_name');
    for (const entity of title) {
      if (entity && entity.assigned_rncp_title && entity.assigned_rncp_title.short_name) {
        tooltip = tooltip + this.translate.instant(entity.assigned_rncp_title.short_name) + `, `;
      }
    }
    return tooltip;
  }

  /*
   * Render tooltip for column type
   * */
  renderTooltipType(entities) {
    let tooltip = '';
    const type = _.uniqBy(entities, 'type.name');
    for (const entity of type) {
      if (entity && entity.type) {
        tooltip = tooltip + this.translate.instant('USER_TYPES.' + entity.type.name) + `, `;
      }
    }
    return tooltip;
  }

  /*
   * Render tooltip for column type
   * */
  renderTooltipEntity(entities: any[]): string {
    let tooltip = '';
    for (const entity of entities) {
      if (entity.entity_name) {
        tooltip = tooltip + this.translate.instant(entity.entity_name) + `, `;
      }
    }
    return tooltip;
  }

  sendMail(data) {
    this.mailSchoolStaff = this.dialog.open(SchoolComposeEmailDialogComponent, {
      disableClose: true,
      width: '750px',
      data: data,
    });
  }

  getUniqueTitle(title) {
    return _.uniqBy(title, 'assigned_rncp_title.short_name');
  }

  getUniqueUserType(title) {
    title = title.filter((resp) => {
      return resp.type !== null && resp.type.name !== 'President of Jury';
    });
    return _.uniqBy(title, 'type.name');
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
