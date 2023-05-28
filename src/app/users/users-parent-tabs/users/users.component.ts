import { AddUserDialogComponent } from './../../../shared/components/add-user-dialog/add-user-dialog.component';
import { Component, OnInit, ViewChild, OnDestroy, ChangeDetectorRef, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { UsersService } from 'app/service/users/users.service';
import { UntypedFormControl } from '@angular/forms';
import Swal from 'sweetalert2';
import { SelectionModel } from '@angular/cdk/collections';
import { UserService } from 'app/service/user/user.service';
import * as moment from 'moment';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { SchoolService } from 'app/service/schools/school.service';
import { startWith, map, tap, debounceTime } from 'rxjs/operators';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import * as _ from 'lodash';
import { LoginAsUserDialogComponent } from 'app/shared/components/login-as-user-dialog/login-as-user-dialog.component';
import { AuthService } from 'app/service/auth-service/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { NgxPermissionsService } from 'ngx-permissions';
import { SubSink } from 'subsink';
import { UtilityService } from 'app/service/utility/utility.service';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { TransferResponsibilityDialogComponent } from 'app/shared/components/transfer-responsibility-dialog/transfer-responsibility-dialog.component';
import { UsersDialogComponent } from 'app/users/users-dialog/users-dialog.component';
import { UserTableData } from 'app/users/user.model';
import { UserEmailDialogComponent } from 'app/users/user-email-dialog/user-email-dialog.component';
import { ExportCsvService } from 'app/service/export-csv/export-csv.service';
import { UserDeactivationDialogComponent } from '../../user-deactivation-dialog/user-deactivation-dialog.component';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { IncorrectUsersEmailDialogComponent } from 'app/shared/components/incorrect-users-email-dialog/incorrect-users-email-dialog.component';

@Component({
  selector: 'ms-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class UsersComponent implements OnInit, AfterViewInit, OnDestroy {
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  private subs = new SubSink();
  displayedColumns: string[] = ['select', 'name', 'createdAt', 'school', 'title', 'class', 'userType', 'entity', 'status', 'action'];
  filterColumns: string[] = [
    'selectFilter',
    'nameFilter',
    'createdAtFilter',
    'schoolFilter',
    'titleFilter',
    'classFilter',
    'userTypeFilter',
    'entityFilter',
    'statusFilter',
    'actionFilter',
  ];
  dataSource = new MatTableDataSource([]);
  selection = new SelectionModel<any>(true, []);
  userDialogComponent: MatDialogRef<UsersDialogComponent>;
  AddUserDialogComponent: MatDialogRef<AddUserDialogComponent>;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  entitySuperFilterList = [
    { value: 'admtc', key: 'admtc' },
    { value: 'academic', key: 'academic' },
    { value: 'company', key: 'company' },
    { value: 'group_of_schools', key: 'group_of_schools' },
  ];
  userTypeSuperFilterList = [];
  statusSuperFilterList = [
    { value: 'active', key: 'active' },
    { value: 'pending', key: 'pending' },
    { value: 'incorrect_email', key: 'incorrect_email' },
  ];
  titleSuperFilterList = [];
  classSuperFilterList = [];
  schoolSuperFilterList = [];

  entitySuperFilter = new UntypedFormControl([]);
  schoolSuperFilter = new UntypedFormControl([]);
  titleSuperFilter = new UntypedFormControl([]);
  classSuperFilter = new UntypedFormControl([]);
  userTypeSuperFilter = new UntypedFormControl([]);
  statusSuperFilter = new UntypedFormControl([]);

  nameFilter = new UntypedFormControl('');
  schoolFilter = new UntypedFormControl('');
  titleFilter = new UntypedFormControl('');
  classFilter = new UntypedFormControl('');
  userTypeFilter = new UntypedFormControl('');
  entityFilter = new UntypedFormControl('');
  statusFilter = new UntypedFormControl('AllM');
  createdAtFilter = new UntypedFormControl('');

  schools = [];
  filteredSchoolNames: Observable<any[]>;
  titles = [];
  classes = [];
  filteredTitleNames: Observable<any[]>;
  filteredClasses: Observable<any[]>;
  statusFilterList = ['AllM', 'active', 'pending', 'incorrect_email'];
  userTypeListFilter: Observable<any[]>;
  userTypeList = [];
  entityList = ['AllM', 'admtc', 'academic', 'company', 'group_of_schools'];
  countRNCPTitles = 0;
  RNCPTitles: any[];
  users: UserTableData[];
  // originalUsers: to preserve original data of users because this.users data being manipulated when login as certifier admin/dir
  originalUsers: UserTableData[];
  userForExport: any[];
  allStudentForExport = [];
  exportName: 'Export';
  dataLoaded = false;
  groupSchool = false;
  usersCount = 0;
  sortValue: any;
  dataUser: any;
  selectType: any;

  // Configuration of the Popup Size and display
  configCat: MatDialogConfig = {
    disableClose: true,
    panelClass: 'certification-rule-pop-up',
    minWidth: '95%',
    minHeight: '81%',
  };

  filteredValues = {
    full_name: null,
    school: null,
    title: null,
    class: [],
    class_ids: null,
    user_type: null,
    entity: null,
    entity_name: null,
    user_status: null,
    users_status: null,
    created_date: null,
  };

  operation: string;
  selectedIndex = null;
  userEntities: any[];
  loggedInUserSchools: { value: string; label: string }[] = [];
  searchText: string;
  isReset = false;
  isWaitingForResponse = false;
  isUserAdmtc = false;
  disabledExport = true;
  noData: any;
  entityData: any;
  isUserAcadDir = true;
  isUserCerAdmin = false;
  isUserADMTC = false;
  isUserAcadAdmin = false;
  currentUser: any;
  userSelected: any[];
  private timeOutVal: any;
  private intVal: any;
  mailUser: MatDialogRef<UserEmailDialogComponent>;
  showSpinner = false;
  originalUserType: any[];

  superEntity = [];
  superUserType = [];
  superStatus = [];
  superTitle = [];
  superClass = [];
  superSchool = [];

  isAutoFilter = false;

  UserDeactivationDialogComponent: MatDialogRef<UserDeactivationDialogComponent>;
  deleteConfig: MatDialogConfig = {
    disableClose: true,
    panelClass: 'no-max-height',
    width: '600px',
    maxHeight: '75vh',
  };

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
    private mailboxService: MailboxService,
    public permissionService: PermissionService,
    private route: ActivatedRoute,
    public parseUtcToLocal: ParseUtcToLocalPipe,
  ) {}

  ngOnInit() {
    this.isUserADMTC = this.utilService.isUserEntityADMTC();
    if (!!this.ngxPermissionService.getPermission('CR School Director') || !!this.ngxPermissionService.getPermission('Certifier Admin')) {
      this.entityList = ['AllM', 'academic'];
    } else {
      this.entityList = ['AllM', 'admtc', 'academic', 'company', 'group_of_schools'];
    }
    this.isUserAdmtc = this.utilService.isUserEntityADMTC();
    this.currentUser = this.authService.getLocalStorageUser();
    this.isUserAcadDir = this.ngxPermissionService.getPermission('Academic Director') ? true : false;
    this.isUserCerAdmin = !!this.ngxPermissionService.getPermission('Certifier Admin');
    this.isUserAcadAdmin = this.utilService.isUserAcadAdmin();
    this.entityData = this.currentUser.entities.find(
      (entity) => entity.type.name === 'Academic Director' || entity.type.name === 'Academic Admin',
    );
    this.initializeUserFilter();
    // ************ If has queryparam user, then filter the specific user, if not then search all users
    const userId = this.route.snapshot.queryParamMap.get('user');
    const status = this.route.snapshot.queryParamMap.get('status');
    if (userId) {
      this.isAutoFilter = true;
      if (status) {
        this.autoFilterUserExport(userId);
      } else {
        this.autoFilterUser(userId);
      }
    } else {
      this.getAllUser();
    }

    // this.getAllUser();
    // this.getUrgentMail();
    if ((this.isUserAcadDir || this.isUserAcadAdmin) && this.entityData) {
      this.goSchoolStaff(this.entityData);
    }

    this.entitySuperFilterList = [
      { value: 'admtc', key: this.translate.instant('admtc') },
      { value: 'academic', key: this.translate.instant('academic') },
      { value: 'company', key: this.translate.instant('company') },
      { value: 'group_of_schools', key: this.translate.instant('group_of_schools') },
    ];

    this.statusSuperFilterList = [
      { value: 'active', key: this.translate.instant('active') },
      { value: 'pending', key: this.translate.instant('pending') },
      { value: 'incorrect_email', key: this.translate.instant('incorrect_email') },
    ];

    this.getTitleDropdownList();

    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      if (this.originalUserType && this.originalUserType.length) {
        this.userTypeList = [];
        this.originalUserType.forEach((item) => {
          const typeEntity = this.getTranslateType(item.name_with_entity);
          this.userTypeList.push({ _id: item._id, name_with_entity: typeEntity });
        });
        this.userTypeList = this.userTypeList.sort(this.keysrt('text'));
        this.userTypeSuperFilterList = this.userTypeList;
        this.userTypeSuperFilterList = _.sortBy(this.userTypeSuperFilterList, 'name_with_entity');
        this.userTypeListFilter = this.userTypeFilter.valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            this.userTypeList
              .filter((title) =>
                title && title.name_with_entity
                  ? this.utilService
                      .simpleDiacriticSensitiveRegex(this.translate.instant(title?.name_with_entity))
                      ?.toLowerCase()
                      ?.includes(this.utilService.simpleDiacriticSensitiveRegex(searchText)?.toLowerCase())
                  : false,
              )
              .sort((a: any, b: any) => a.name_with_entity.localeCompare(b.name_with_entity)),
          ),
        );
        this.userTypeFilter.patchValue(this.getTranslatedSelectedUserTypeValue());
      }

      this.entitySuperFilterList = [
        { value: 'admtc', key: this.translate.instant('admtc') },
        { value: 'academic', key: this.translate.instant('academic') },
        { value: 'company', key: this.translate.instant('company') },
        { value: 'group_of_schools', key: this.translate.instant('group_of_schools') },
      ];

      this.statusSuperFilterList = [
        { value: 'active', key: this.translate.instant('active') },
        { value: 'pending', key: this.translate.instant('pending') },
        { value: 'incorrect_email', key: this.translate.instant('incorrect_email') },
      ];

      const titleFilterValue = this.titleFilter.value;
      const userTypeFilterValue = this.userTypeFilter.value;
      const schoolFilterValue = this.schoolFilter.value;

      if (titleFilterValue === 'All' || titleFilterValue === 'Tous') {
        this.titleFilter.setValue(this.translate.instant('AllM'), { emitEvent: false });
      }
      if (userTypeFilterValue === 'All' || userTypeFilterValue === 'Tous') {
        this.userTypeFilter.setValue(this.translate.instant('AllM'), { emitEvent: false });
      }
      if (schoolFilterValue === 'All' || schoolFilterValue === 'Tous') {
        this.schoolFilter.setValue(this.translate.instant('AllM'), { emitEvent: false });
      }
    });
  }

  getTranslatedSelectedUserTypeValue(): string {
    if (!this.filteredValues.user_type || !this.userTypeFilter.value) return;
    const selectedUserFilter = this.originalUserType.find((type) => type?._id === this.filteredValues.user_type[0]);
    return this.getTranslateType(selectedUserFilter?.name_with_entity) || '';
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (!this.isReset && !this.isAutoFilter) {
            this.getAllUser();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
  }

  getTitleDropdownList() {
    this.subs.sink = this.rncpTitleService.getTitleDropdownList().subscribe((resp) => {
      if (resp) {
        this.titleSuperFilterList = _.cloneDeep(resp);
      }
    });
  }

  getClassDropdownList(titleFilterValue?) {
    this.subs.sink = this.rncpTitleService.getClassDropdownList(titleFilterValue).subscribe((resp) => {
      if (resp) {
        this.classSuperFilterList = _.cloneDeep(resp);
        this.classSuperFilterList = _.uniqBy(this.classSuperFilterList, 'name');
      }
    });
  }

  getSchoolDropdownList(titleFilterValue?, classFilterValue?, statusFilterValue?) {
    this.subs.sink = this.schoolService.getSchoolDropdownList(titleFilterValue, classFilterValue, statusFilterValue).subscribe((resp) => {
      if (resp) {
        this.schoolSuperFilterList = _.cloneDeep(resp);
      }
    });
  }

  selectEntitySuperFilter() {
    const entityFilterValue = this.entitySuperFilter.value;
    if (entityFilterValue && entityFilterValue.length) {
        this.superEntity = entityFilterValue;
    } else {
      this.superEntity = null;
    }
  }

  selectUserTypeSuperFilter() {
    const userTypeFilterValue = this.userTypeSuperFilter.value;
    if (userTypeFilterValue && userTypeFilterValue.length) {
      this.superUserType = userTypeFilterValue;
    } else {
      this.superUserType = null;
    }
  }

  selectStatusSuperFilter() {
    const statusFilterValue = this.statusSuperFilter.value;
    const tempInitialStatus = this.filteredValues['users_status'];
    if (statusFilterValue && statusFilterValue.length) {
      this.superStatus = statusFilterValue;
    } else {
      if (tempInitialStatus === null) {
        this.superStatus = null;
      } else {
        this.superStatus = null;
      }
    }
  }

  selectTitleSuperFilter() {
    this.schoolSuperFilterList = [];
    this.classSuperFilterList = [];
    this.classSuperFilter.setValue([]);
    this.schoolSuperFilter.setValue([]);
    const titleFilterValue = this.titleSuperFilter.value;
    if (titleFilterValue && titleFilterValue.length) {
      this.superTitle = titleFilterValue;
      this.getClassDropdownList(titleFilterValue);
    } else {
      this.classSuperFilterList = [];
      this.schoolSuperFilterList = [];
      this.superTitle = null;
    }
  }

  selectClassSuperFilter() {
    this.schoolSuperFilterList = [];
    this.schoolSuperFilter.setValue([]);
    const classFilterValue = this.classSuperFilter.value;
    const titleFilterValue = this.titleSuperFilter.value;
    if (classFilterValue && classFilterValue.length) {
      this.superClass = classFilterValue;
      this.getSchoolDropdownList(titleFilterValue, classFilterValue);
    } else {
      this.schoolSuperFilterList = [];
      this.superClass = null;
    }
  }

  selectSchoolSuperFilter() {
    const schoolFilterValue = this.schoolSuperFilter.value;
    const tempInitialSchool = this.filteredValues['school'];
    if (schoolFilterValue && schoolFilterValue.length) {
      this.superSchool = schoolFilterValue;
    } else {
      if (tempInitialSchool === null) {
        this.superSchool = null;
      } else {
        this.superSchool = null;
      }
    }
  }

  applyFilter() {
    this.filteredValues.entity = this.superEntity;
    this.filteredValues.school = this.superSchool;
    this.filteredValues.title = this.superTitle;
    this.filteredValues.class = this.superClass;
    this.filteredValues.users_status = this.superStatus;
    this.filteredValues.user_type = this.superUserType;
    if (!this.isReset) {
      this.paginator.pageIndex = 0;
      this.sort.direction = '';
      this.sort.active = '';
      this.sort.sortChange.emit({active: '', direction: ''});
      this.getAllUser();
    }
  }

  checkAllSuperFilter(typeFilter) {
    if (typeFilter === 'entity') {
      const entitySuperFilter = this.entitySuperFilter.value.length;
      const entitySuperFilterList = this.entitySuperFilterList.length;
      if (entitySuperFilter === entitySuperFilterList) {
        return true;
      } else {
        return false;
      }
    }

    if (typeFilter === 'userType') {
      const userTypeSuperFilter = this.userTypeSuperFilter.value.length;
      const userTypeSuperFilterList = this.userTypeSuperFilterList.length;
      if (userTypeSuperFilter === userTypeSuperFilterList) {
        return true;
      } else {
        return false;
      }
    }

    if (typeFilter === 'status') {
      const statusSuperFilter = this.statusSuperFilter.value.length;
      const statusSuperFilterList = this.statusSuperFilterList.length;
      if (statusSuperFilter === statusSuperFilterList) {
        return true;
      } else {
        return false;
      }
    }

    if (typeFilter === 'title') {
      const titleSuperFilter = this.titleSuperFilter.value.length;
      const titleSuperFilterList = this.titleSuperFilterList.length;
      if (titleSuperFilter === titleSuperFilterList) {
        return true;
      } else {
        return false;
      }
    }

    if (typeFilter === 'class') {
      const classSuperFilter = this.classSuperFilter.value.length;
      const classSuperFilterList = this.classSuperFilterList.length;
      if (classSuperFilter === classSuperFilterList) {
        return true;
      } else {
        return false;
      }
    }

    if (typeFilter === 'school') {
      const schoolSuperFilter = this.schoolSuperFilter.value.length;
      const schoolSuperFilterList = this.schoolSuperFilterList.length;
      if (schoolSuperFilter === schoolSuperFilterList) {
        return true;
      } else {
        return false;
      }
    }
  }

  checkSuperFilterIndeterminate(typeFilter) {
    if (typeFilter === 'entity') {
      const entitySuperFilter = this.entitySuperFilter.value.length;
      const entitySuperFilterList = this.entitySuperFilterList.length;
      if (entitySuperFilter !== entitySuperFilterList && entitySuperFilter !== 0) {
        return true;
      } else {
        return false;
      }
    }

    if (typeFilter === 'userType') {
      const userTypeSuperFilter = this.userTypeSuperFilter.value.length;
      const userTypeSuperFilterList = this.userTypeSuperFilterList.length;
      if (userTypeSuperFilter !== userTypeSuperFilterList && userTypeSuperFilter !== 0) {
        return true;
      } else {
        return false;
      }
    }

    if (typeFilter === 'status') {
      const statusSuperFilter = this.statusSuperFilter.value.length;
      const statusSuperFilterList = this.statusSuperFilterList.length;
      if (statusSuperFilter !== statusSuperFilterList && statusSuperFilter !== 0) {
        return true;
      } else {
        return false;
      }
    }

    if (typeFilter === 'title') {
      const titleSuperFilter = this.titleSuperFilter.value.length;
      const titleSuperFilterList = this.titleSuperFilterList.length;
      if (titleSuperFilter !== titleSuperFilterList && titleSuperFilter !== 0) {
        return true;
      } else {
        return false;
      }
    }

    if (typeFilter === 'class') {
      const classSuperFilter = this.classSuperFilter.value.length;
      const classSuperFilterList = this.classSuperFilterList.length;
      if (classSuperFilter !== classSuperFilterList && classSuperFilter !== 0) {
        return true;
      } else {
        return false;
      }
    }

    if (typeFilter === 'school') {
      const schoolSuperFilter = this.schoolSuperFilter.value.length;
      const schoolSuperFilterList = this.schoolSuperFilterList.length;
      if (schoolSuperFilter !== schoolSuperFilterList && schoolSuperFilter !== 0) {
        return true;
      } else {
        return false;
      }
    }
  }

  selectedAllSuperFilter(typeFilter, event) {
    if (typeFilter === 'entity') {
      const entitySuperFilterList = this.entitySuperFilterList.map((entity) => entity.value);
      if (event.checked) {
        this.entitySuperFilter.patchValue(entitySuperFilterList, { emitEvent: false });
      } else {
        this.entitySuperFilter.patchValue([], { emitEvent: false });
      }
    }

    if (typeFilter === 'userType') {
      const userTypeSuperFilterList = this.userTypeSuperFilterList.map((type) => type._id);
      if (event.checked) {
        this.userTypeSuperFilter.patchValue(userTypeSuperFilterList, { emitEvent: false });
      } else {
        this.userTypeSuperFilter.patchValue([], { emitEvent: false });
      }
    }

    if (typeFilter === 'status') {
      const statusSuperFilterList = this.statusSuperFilterList.map((status) => status.value);
      if (event.checked) {
        this.statusSuperFilter.patchValue(statusSuperFilterList, { emitEvent: false });
      } else {
        this.statusSuperFilter.patchValue([], { emitEvent: false });
      }
    }

    if (typeFilter === 'title') {
      const titleSuperFilterList = this.titleSuperFilterList.map((title) => title._id);
      if (event.checked) {
        this.titleSuperFilter.patchValue(titleSuperFilterList, { emitEvent: false });
      } else {
        this.titleSuperFilter.patchValue([], { emitEvent: false });
      }
    }

    if (typeFilter === 'class') {
      const classSuperFilterList = this.classSuperFilterList.map((cls) => cls.name);
      if (event.checked) {
        this.classSuperFilter.patchValue(classSuperFilterList, { emitEvent: false });
      } else {
        this.classSuperFilter.patchValue([], { emitEvent: false });
      }
    }

    if (typeFilter === 'school') {
      const schoolSuperFilterList = this.schoolSuperFilterList.map((school) => school._id);
      if (event.checked) {
        this.schoolSuperFilter.patchValue(schoolSuperFilterList, { emitEvent: false });
      } else {
        this.schoolSuperFilter.patchValue([], { emitEvent: false });
      }
    }
  }

  sortData(sort: Sort) {
    if (sort.active === 'last_name') {
      this.sortValue = sort.direction ? { last_name: sort.direction } : null;
    } else if (sort.active === 'title') {
      this.sortValue = sort.direction ? { title: sort.direction } : null;
    } else if (sort.active === 'userType') {
      this.sortValue = sort.direction ? { user_type: sort.direction } : null;
    } else if (sort.active === 'user_status') {
      this.sortValue = sort.direction ? { user_status: sort.direction } : null;
    } else if (sort.active === 'created_date') {
      this.sortValue = sort.direction ? { created_date: sort.direction } : null;
    } else {
      this.sortValue = null;
    }
    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllUser();
      }
    }
  }

  initializeUserFilter() {
    if (this.isUserADMTC) {
      this.subs.sink = this.schoolService.getSchoolShortNames().subscribe((resp) => {
        this.schools = resp;
        this.filteredSchoolNames = this.schoolFilter.valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            this.schools.filter((school) =>
              school && school.short_name
                ? this.utilService
                    .simpleDiacriticSensitiveRegex(school.short_name)
                    .toLowerCase()
                    .includes(this.utilService.simpleDiacriticSensitiveRegex(searchText).toLowerCase())
                : false,
            ),
          ),
        );
      });
    } else {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';


      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((res) => {
        const dataUSer = res.entities.filter((ent) => ent.type.name === userType);

        const school_ids = this.utilService.getAcademicAllAssignedSchool(dataUSer);

        this.subs.sink = this.schoolService.getAllSchoolsByUserOwn(school_ids).subscribe((resp: any) => {
          this.schools = resp;
          this.filteredSchoolNames = this.schoolFilter.valueChanges.pipe(
            startWith(''),
            map((searchText) =>
              this.schools.filter((school) =>
                school && school.short_name
                  ? this.utilService
                      .simpleDiacriticSensitiveRegex(school.short_name)
                      .toLowerCase()
                      .includes(this.utilService.simpleDiacriticSensitiveRegex(searchText).toLowerCase())
                  : false,
              ),
            ),
          );
        });
      });
    }
    if (this.isUserADMTC) {
      this.subs.sink = this.rncpTitleService.getRncpTitleListData().subscribe((resp) => {
        this.titles = resp;
        this.filteredTitleNames = this.titleFilter.valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            this.titles
              .filter((title) =>
                title && title.short_name
                  ? this.utilService
                      .simpleDiacriticSensitiveRegex(title.short_name)
                      .toLowerCase()
                      .includes(this.utilService.simpleDiacriticSensitiveRegex(searchText).toLowerCase())
                  : false,
              )
              .sort((a: any, b: any) => a.short_name.localeCompare(b.short_name)),
          ),
        );
      });
    } else {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((res) => {
        const dataUSer = res.entities.filter((ent) => ent.type.name === userType);
        const title_ids = this.utilService.getAcademicAllAssignedTitle(dataUSer);
        this.subs.sink = this.rncpTitleService.getAllRncpTitleListData(false, title_ids).subscribe((rncpTitles) => {
          this.titles = rncpTitles;
          this.filteredTitleNames = this.titleFilter.valueChanges.pipe(
            startWith(''),
            map((searchText) =>
              this.titles
                .filter((title) =>
                  title && title.short_name
                    ? this.utilService
                        .simpleDiacriticSensitiveRegex(title.short_name)
                        .toLowerCase()
                        .includes(this.utilService.simpleDiacriticSensitiveRegex(searchText).toLowerCase())
                    : false,
                )
                .sort((a: any, b: any) => a.short_name.localeCompare(b.short_name)),
            ),
          );
        });
      });
    }

    this.getAllClasses();

    if (!!this.ngxPermissionService.getPermission('CR School Director') || !!this.ngxPermissionService.getPermission('Certifier Admin')) {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].school_type : '';
      this.subs.sink = this.userService.getAllUserTypeForUser(userType).subscribe((resp) => {
        this.userTypeList = [];
        const listType = _.cloneDeep(resp);
        listType.forEach((item) => {
          const typeEntity = this.getTranslateType(item.name_with_entity);
          this.userTypeList.push({ _id: item._id, name_with_entity: typeEntity });
        });
        this.originalUserType = _.cloneDeep(resp);
        this.userTypeList = this.userTypeList.sort(this.keysrt('text'));
        this.userTypeSuperFilterList = this.userTypeList;
        this.userTypeSuperFilterList = _.sortBy(this.userTypeSuperFilterList, 'name_with_entity');
        this.originalUserType = _.cloneDeep(resp);
        this.userTypeSuperFilterList = this.userTypeList;
        this.userTypeSuperFilterList = _.sortBy(this.userTypeSuperFilterList, 'name_with_entity');
        this.userTypeListFilter = this.userTypeFilter.valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            this.userTypeList
              .filter((title) =>
                title && title.name_with_entity
                  ? this.utilService
                      .simpleDiacriticSensitiveRegex(this.translate.instant(title?.name_with_entity))
                      ?.toLowerCase()
                      ?.includes(this.utilService.simpleDiacriticSensitiveRegex(searchText)?.toLowerCase())
                  : false,
              )
              .sort((a: any, b: any) => a.name_with_entity.localeCompare(b.name_with_entity)),
          ),
        );
        // this.userTypeList.unshift({ _id: 'AllM', name_with_entity: 'AllM' });
      });
    } else if (!this.isUserADMTC) {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].school_type : '';
      this.subs.sink = this.userService.getAllUserTypeNonOp(userType).subscribe((resp) => {
        const listType = _.cloneDeep(resp);
        this.userTypeList = [];
        listType.forEach((item) => {
          const typeEntity = this.getTranslateType(item.name_with_entity);
          this.userTypeList.push({ _id: item._id, name_with_entity: typeEntity });
        });
        this.originalUserType = _.cloneDeep(resp);
        this.userTypeList = this.userTypeList.sort(this.keysrt('text'));
        this.userTypeSuperFilterList = this.userTypeList;
        this.userTypeSuperFilterList = _.sortBy(this.userTypeSuperFilterList, 'name_with_entity');
        this.userTypeListFilter = this.userTypeFilter.valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            this.userTypeList
              .filter((title) =>
                title && title.name_with_entity
                  ? this.utilService
                      .simpleDiacriticSensitiveRegex(this.translate.instant(title?.name_with_entity))
                      ?.toLowerCase()
                      ?.includes(this.utilService.simpleDiacriticSensitiveRegex(searchText)?.toLowerCase())
                  : false,
              )
              .sort((a: any, b: any) => a.name_with_entity.localeCompare(b.name_with_entity)),
          ),
        );
        // this.userTypeList.unshift({ _id: 'AllM', name_with_entity: 'AllM' });
      });
    } else {
      this.subs.sink = this.userService.getAllUserTypeDropdown().subscribe((resp) => {
        const listType = _.cloneDeep(resp);
        this.userTypeList = [];
        listType.forEach((item) => {
          const value = this.translate.instant('USER_TYPES_WITH_ENTITY.' + item.name_with_entity);
          this.userTypeList.push({ _id: item._id, name_with_entity: value });
        });
        this.originalUserType = _.cloneDeep(resp);
        this.userTypeList = this.userTypeList.sort(this.keysrt('text'));
        this.userTypeSuperFilterList = this.userTypeList;
        this.userTypeSuperFilterList = _.sortBy(this.userTypeSuperFilterList, 'name_with_entity');
        this.userTypeListFilter = this.userTypeFilter.valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            this.userTypeList
              .filter((title) =>
                title && title.name_with_entity
                  ? this.utilService
                      .simpleDiacriticSensitiveRegex(this.translate.instant(title?.name_with_entity))
                      ?.toLowerCase()
                      ?.includes(this.utilService.simpleDiacriticSensitiveRegex(searchText)?.toLowerCase())
                  : false,
              )
              .sort((a: any, b: any) => a.name_with_entity.localeCompare(b.name_with_entity)),
          ),
        );
        // this.userTypeList.unshift({ _id: 'AllM', name_with_entity: 'AllM' });
      });
    }

    this.subs.sink = this.nameFilter.valueChanges.pipe(debounceTime(400)).subscribe((name) => {
      const symbol = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      if (!name.match(symbol) && !name.match(symbol1)) {
        this.filteredValues.full_name = name;
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getAllUser();
        }
      } else {
        this.nameFilter.setValue('');
        this.filteredValues.full_name = '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getAllUser();
        }
      }
    });

    this.subs.sink = this.entityFilter.valueChanges.subscribe((entity) => {
      this.filteredValues.entity_name = entity === 'AllM' ? '' : entity;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllUser();
      }
    });
    this.subs.sink = this.statusFilter.valueChanges.subscribe((status) => {
      this.filteredValues.user_status = status === 'AllM' ? '' : status;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllUser();
      }
    });

    this.subs.sink = this.createdAtFilter.valueChanges.subscribe((date) => {
      const dateParsed = moment(date).toISOString();
      this.filteredValues.created_date = dateParsed;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllUser();
      }
    });
  }

  keysrt(key) {
    return function (a, b) {
      if (a[key] > b[key]) {
        return 1;
      } else if (a[key] < b[key]) {
        return -1;
      }
      return 0;
    };
  }

  setSchoolFilter(schoolId: string) {
    if (schoolId !== null) {
      this.getRncpTitles(schoolId);
    } else {
      this.getAllRncpTitles();
      this.getAllSchool();
    }
    // this.filteredValues.user_status = status === 'AllM' ? '' : status;
    this.filteredValues.school = schoolId === null ? null : [schoolId];
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getAllUser();
    }
  }

  setTitleFilter(titleId: string, name) {
    this.filteredValues.title = titleId === null ? null : [titleId];
    this.paginator.pageIndex = 0;
    this.classFilter.setValue('', { emitEvent: false });
    this.filteredValues.class = [];
    if (name !== null) {
      this.getSchoolCascade(name);
      this.getAllClassesBasedOnTitle(titleId);
    } else {
      this.getAllSchool();
      this.getAllRncpTitles();
      this.getAllClasses();
    }
    if (!this.isReset) {
      this.getAllUser();
    }
  }

  setClassFilter(className: any) {
    if (className && className.length) {
      this.filteredValues.class = this.classFilter.value;
    } else {
      this.filteredValues.class = [];
    }
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getAllUser();
    }
  }

  setTypeFilter(userType: string) {
    this.filteredValues.user_type = userType === null ? null : [userType];
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getAllUser();
    }
  }

  /*
   * Implement Populate Data User Table
   * */
  getAllUser() {
    this.isWaitingForResponse = true;
    this.isAutoFilter = false;
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    const cr = !!this.ngxPermissionService.getPermission('CR School Director');
    const ca = !!this.ngxPermissionService.getPermission('Certifier Admin');
    let filter = ``;

    let userTypeFilter;
    if (this.filteredValues.user_type && this.filteredValues.user_type.length) {
      userTypeFilter = this.filteredValues.user_type.map((item) => '"' + item + '"');
    }

    let entityFilter;
    if (this.filteredValues.entity && this.filteredValues.entity.length) {
      entityFilter = this.filteredValues.entity.map((item) => item);
    }

    let usersStatusFilter;
    if (this.filteredValues.users_status && this.filteredValues.users_status.length) {
      usersStatusFilter = this.filteredValues.users_status.map((item) => item);
    }

    let titleFilter;
    if (this.filteredValues.title && this.filteredValues.title.length) {
      titleFilter = this.filteredValues.title.map((item) => '"' + item + '"');
    }

    let class_idsFilter;
    if (this.filteredValues.class_ids && this.filteredValues.class_ids.length) {
      class_idsFilter = this.filteredValues.class_ids.map((item) => '"' + item + '"');
    }

    let schoolFilter;
    if (this.filteredValues.school && this.filteredValues.school.length) {
      schoolFilter = this.filteredValues.school.map((item) => '"' + item + '"');
    }

    // because we cant send null id for filter, so we manupulate the filter to be string for graphql
    if (!!this.ngxPermissionService.getPermission('CR School Director') || !!this.ngxPermissionService.getPermission('Certifier Admin')) {
      filter += this.filteredValues.full_name ? `full_name : "${this.filteredValues.full_name}"` : '';
      filter += userTypeFilter ? `user_type: [${userTypeFilter.toString()}]` : '';
      filter += entityFilter ? `entity: [${entityFilter}]` : '';
      filter += this.filteredValues.entity_name ? `entity_name: ${this.filteredValues.entity_name}` : '';
      filter += usersStatusFilter ? `users_status: [${usersStatusFilter}]` : '';
      filter += this.filteredValues.user_status ? ` user_status: ${this.filteredValues.user_status}` : '';
      filter += this.filteredValues.created_date ? ` created_date: "${this.filteredValues.created_date}"` : '';
    } else {
      let classFilter;
      if (this.filteredValues.class && this.filteredValues.class.length) {
        classFilter = this.filteredValues.class.map((item) => {
          const cls = item.replaceAll(`"`, `'`);
          return '"' + cls + '"';
        });
      }
      filter += this.filteredValues.full_name ? `full_name : "${this.filteredValues.full_name}"` : '';
      filter += userTypeFilter ? `user_type: [${userTypeFilter.toString()}]` : '';
      filter += schoolFilter ? `school: [${schoolFilter.toString()}]` : '';
      filter += titleFilter ? `title: [${titleFilter.toString()}]` : '';
      filter += class_idsFilter ? `class_ids: [${class_idsFilter.toString()}]` : '';
      filter += classFilter ? `classes_name: [${classFilter.toString()}]` : '';
      filter += entityFilter ? `entity: [${entityFilter}]` : '';
      filter += this.filteredValues.entity_name ? `entity_name: ${this.filteredValues.entity_name}` : '';
      filter += usersStatusFilter ? `users_status: [${usersStatusFilter}]` : '';
      filter += this.filteredValues.user_status ? ` user_status: ${this.filteredValues.user_status}` : '';
      filter += this.filteredValues.created_date ? ` created_date: "${this.filteredValues.created_date}"` : '';
    }

    if (!!this.ngxPermissionService.getPermission('CR School Director') || !!this.ngxPermissionService.getPermission('Certifier Admin')) {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((res) => {
        const dataUSer = res.entities.filter((ent) => ent.type.name === userType);
        let title_ids = this.utilService.getAcademicAllAssignedTitle(dataUSer);
        let schoolIds = this.utilService.getAcademicAllAssignedSchool(dataUSer);
        if (this.filteredValues.school || this.filteredValues.title) {
          title_ids = this.filteredValues.title ? this.filteredValues.title : this.utilService.getAcademicAllAssignedTitle(dataUSer);
          schoolIds = this.filteredValues.school ? this.filteredValues.school : this.utilService.getAcademicAllAssignedSchool(dataUSer);
        }
        if (title_ids && title_ids.length) {
          this.subs.sink = this.usersService
            .getAllUserFromCRWithSchool(pagination, this.sortValue, filter, title_ids, schoolIds)
            .subscribe((resp) => {
              this.users = resp;
              this.originalUsers = _.cloneDeep(this.users);
              this.users.forEach((userlist, index) => {
                this.groupSchool = false;
                userlist.entities.forEach((enty) => {
                  if (enty.school === null) {
                    this.groupSchool = true;
                  }
                });
                userlist['mergedSchool'] = this.getMergedUniqueSchool(userlist.entities, userlist._id);
              });
              this.filterCertifierEntites();
            });
        }
      });
    } else {
      this.subs.sink = this.usersService.getAllUser(pagination, this.sortValue, filter).subscribe(
        (resp) => {
          this.users = resp;
          this.users.forEach((userlist, index) => {
            this.groupSchool = false;


            userlist.entities.forEach((enty) => {
              if (enty.school === null) {
                this.groupSchool = true;
              }
            });
            userlist['mergedSchool'] = this.getMergedUniqueSchool(userlist.entities, userlist._id);
          });

          this.dataSource.data = this.users;

          this.usersCount = this.users && this.users.length ? this.users[0].count_document : 0;
          this.isReset = false;
          this.isWaitingForResponse = false;
          this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
        },
        (err) => {
          this.isWaitingForResponse = false;
        },
      );
    }
  }

  /*
   * Implement Populate Data User Table for Export Spreadsheet
   * */

  getTranslateType(name) {
    if (name) {
      const value = this.translate.instant('USER_TYPES_WITH_ENTITY.' + name);
      return value;
    }
  }

  displayAllActionBtn(user: any) {
    let isDisplayActionBtn = true;
    // if user type not admtc, hide action button for my own account in table so I cant delete or edit my own account
    if (
      user._id === this.currentUser._id &&
      !this.ngxPermissionService.getPermission('ADMTC Admin') &&
      !this.ngxPermissionService.getPermission('ADMTC Director')
    ) {
      isDisplayActionBtn = false;
    }
    // if I am certifier admin, I cant edit or delete CR school dir
    if (this.ngxPermissionService.getPermission('Certifier Admin')) {
      const CRSchoolDirId = '5a2e1ecd53b95d22c82f954f';
      user.entities.forEach((entity) => {
        if (entity.type && entity.type._id && entity.type._id === CRSchoolDirId) {
          isDisplayActionBtn = false;
        }
      });
    }
    return isDisplayActionBtn;
  }

  customFilterPredicate() {
    return function (data, filter: string): boolean {
      const searchString = JSON.parse(filter);
      const nameFound = data.last_name
        ? data.last_name.toString().trim().toLowerCase().indexOf(searchString.name.toLowerCase()) !== -1
        : true;

      const schoolFound = searchString.school
        ? data.entities.find(
            (entity) =>
              entity.school &&
              entity.school.short_name &&
              entity.school.short_name.toLowerCase().indexOf(searchString.school.toLowerCase()) !== -1,
          )
        : true;

      const titleFound = data.entities.find(
        (entity) =>
          entity.assigned_rncp_title &&
          entity.assigned_rncp_title.short_name &&
          entity.assigned_rncp_title.short_name.toLowerCase().indexOf(searchString.title.toLowerCase()) !== -1,
      );

      const userTypeFound = data.entities.find(
        (entity) => entity.type && entity.type.name && entity.type.name.toLowerCase().indexOf(searchString.userType.toLowerCase()) !== -1,
      );

      const entityFound =
        searchString.entity.toLowerCase() === 'allm' ||
        data.entities.find(
          (entity) => entity.entity_name && entity.entity_name.toLowerCase().indexOf(searchString.entity.toLowerCase()) !== -1,
        );

      const statusFound =
        searchString.status.toLowerCase() === 'allm' ||
        (data.user_status && data.user_status.trim().toLowerCase() === searchString.status.trim().toLowerCase());

      return nameFound && schoolFound && titleFound && userTypeFound && entityFound && statusFound;
    };
  }

  addUser() {
    this.subs.sink = this.dialog
      .open(AddUserDialogComponent, {
        disableClose: true,
        panelClass: 'certification-rule-pop-up',
        minWidth: '50%',
        // minHeight: '81%',
        data: {
          operation: 'add',
        },
      })
      .afterClosed()
      .subscribe((isRegistered) => {});
  }

  editUser(userData: UserTableData) {

    if (this.ngxPermissionService.getPermission('CR School Director') || this.ngxPermissionService.getPermission('Certifier Admin')) {
      userData = this.originalUsers.find((user) => user._id === userData._id);
    }
    // this.router.navigate(['/users/user-management-detail'], { queryParams: { userId: userData._id, isFromActiveUserTab:true } });
    window.open(`./users/user-management-detail/?userId=${userData._id}&isFromActiveUserTab=true`, '_blank');

    // this.subs.sink = this.dialog
    //   .open(UsersDialogComponent, {
    //     ...this.configCat,
    //     data: {
    //       userData: userData,
    //       operation: 'edit',
    //     },
    //   })
    //   .afterClosed()
    //   .subscribe((isRegistered) => {
    //     this.getAllUser();
    //   });
  }

  autoFilterUser(userId) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.usersService.getOneUserForTableUser(userId).subscribe(
      (resp) => {
        const response = [resp];
        this.users = response;
        this.users.forEach((userlist, index) => {
          this.groupSchool = false;
          userlist.entities.forEach((enty) => {
            if (enty.school === null) {
              this.groupSchool = true;
            }
          });
          userlist['mergedSchool'] = this.getMergedUniqueSchool(userlist.entities, userlist._id);
        });

        this.dataSource.data = this.users;
        this.usersCount = this.users && this.users.length ? this.users.length : 0;
        this.isReset = false;
        this.isWaitingForResponse = false;
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
      },
      (err) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  autoFilterUserExport(userId) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.usersService.getOneUserForTableUser(userId).subscribe(
      (resp) => {
        const response = [resp];
        this.users = response;
        this.users.forEach((userlist, index) => {
          this.groupSchool = false;
          userlist.entities.forEach((enty) => {
            if (enty.school === null) {
              this.groupSchool = true;
            }
          });
        });

        this.dataSource.data = this.users;
        this.usersCount = this.users && this.users.length ? this.users.length : 0;
        this.isReset = false;
        this.isWaitingForResponse = false;
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
      },
      (err) => {
        this.isWaitingForResponse = false;
      },
    );

    this.subs.sink = this.usersService.getOneUserToEdit(userId).subscribe((resp) => {
      if (resp) {
        this.subs.sink = this.dialog
          .open(UsersDialogComponent, {
            ...this.configCat,
            data: {
              userData: resp,
              operation: 'edit',
            },
          })
          .afterClosed()
          .subscribe((isRegistered) => {
            this.getAllUser();
          });
      }
    });
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

  goSchoolStaff(student) {
    this.router.navigate(['/school', student.school._id], {
      queryParams: { title: student.assigned_rncp_title._id, class: student.class._id, student: '', open: 'school-staff' },
    });
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
    }).then((isConfirm: any) => {
      // if (isConfirm.value) {
      //   this.subs.sink = this.userService.inactiveEmail(this.translate.currentLang, userId).subscribe((resp) => {
      //     Swal.fire({
      //       type: 'success',
      //       title: 'Bravo!',
      //       allowOutsideClick: false,
      //       confirmButtonText: this.translate.instant('OK'),
      //     });
      //     this.getAllUser();
      //   });
      // }
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

            this.getAllUser();
          });
      }
    });
  }

  // deactiveUser(userId: string, civility: string, firstName: string, lastName: string) {
  //   let timeDisabled = 5;
  //   Swal.fire({
  //     allowOutsideClick: false,
  //     type: 'question',
  //     title: this.translate.instant('Attention'),
  //     html: this.translate.instant('DELETE_USER.QUESTION', {
  //       civility: this.translate.instant(civility),
  //       firstName: firstName,
  //       lastName: lastName,
  //     }),
  //     showCancelButton: true,
  //     confirmButtonText: this.translate.instant('SWEET_ALERT.DELETE.CONFIRM', { timer: timeDisabled }),
  //     cancelButtonText: this.translate.instant('SWEET_ALERT.DELETE.CANCEL'),
  //     onOpen: () => {
  //       Swal.disableConfirmButton();
  //       const confirmBtnRef = Swal.getConfirmButton();
  //       this.intVal = setInterval(() => {
  //         timeDisabled -= 1;
  //         confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM') + ' in ' + ` (${timeDisabled})` + ' sec';
  //       }, 1000);

  //       this.timeOutVal = setTimeout(() => {
  //         confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM');
  //         Swal.enableConfirmButton();
  //         // clearTimeout(time);
  //         clearInterval(this.intVal);
  //       }, timeDisabled * 1000);
  //       // clearTimeout(this.timeOutVal);
  //     },
  //   })
  //     .then((isConfirm) => {
  //       if (isConfirm.value) {
  //         this.subs.sink = this.userService.deleteUser(userId).subscribe((resp) => {

  //           if (resp) {
  //             if (!resp.errors) {
  //               Swal.fire({
  //                 allowOutsideClick: false,
  //                 confirmButtonText: this.translate.instant('OK'),
  //                 type: 'success',
  //                 title: this.translate.instant('DELETE_USER.SUCCESS_TITLE'),
  //                 text: this.translate.instant('DELETE_USER.SUCCESS_TEXT'),
  //               });
  //               this.getAllUser();
  //             } else if (resp.errors && resp.errors[0] && resp.errors[0].message === 'the mentor is already used in student contract') {
  //               Swal.fire({
  //                 allowOutsideClick: false,
  //                 confirmButtonText: this.translate.instant('DeleteMent_S1.BUTTON'),
  //                 type: 'error',
  //                 title: this.translate.instant('DeleteMent_S1.TITLE'),
  //                 text: this.translate.instant('DeleteMent_S1.TEXT'),
  //               });
  //               this.getAllUser();
  //             } else if (resp.errors && resp.errors[0] && resp.errors[0].message === 'user should transfer the responsibility first') {
  //               Swal.fire({
  //                 allowOutsideClick: false,
  //                 confirmButtonText: this.translate.instant('DeleteTypeUser.Btn-Confirm'),
  //                 type: 'error',
  //                 title: this.translate.instant('DeleteTypeUser.Title'),
  //                 text: this.translate.instant('DeleteTypeUser.Body'),
  //               });
  //               this.getAllUser();
  //             } else if (resp.errors && resp.errors[0] && resp.errors[0].message === 'user still have todo tasks') {
  //               Swal.fire({
  //                 allowOutsideClick: false,
  //                 confirmButtonText: this.translate.instant('DeleteUserTodo.Btn-Confirm'),
  //                 type: 'warning',
  //                 title: this.translate.instant('DeleteUserTodo.Title'),
  //                 text: this.translate.instant('DeleteUserTodo.Body'),
  //               });
  //               this.getAllUser();
  //             } else if (resp.errors && resp.errors[0] && resp.errors[0].message) {
  //               Swal.fire({
  //                 allowOutsideClick: false,
  //                 confirmButtonText: this.translate.instant('OK'),
  //                 type: 'error',
  //                 title: this.translate.instant('Error'),
  //                 text: resp.errors[0].message,
  //               });
  //             }
  //           }
  //         });
  //       }
  //     })
  // }

  confirmDeactivation(element) {



    // const userType = element.entities[0].type.name
    // const title = element.entities[0].assigned_rncp_title.short_name
    // // userDetails: {
    //   userId, firstName, lastName, civility, element
    // }
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

            this.getAllUser();
            // if (result.value) {
            //   this.getAllUser()
            // }
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

  /** Reset Functionality User Table */
  resetSelection() {
    this.isReset = true;
    this.selection.clear();
    this.filteredValues = {
      full_name: null,
      school: null,
      title: null,
      class: [],
      class_ids: null,
      user_type: null,
      entity: null,
      entity_name: null,
      user_status: null,
      users_status: null,
      created_date: null,
    };
    this.sort.direction = '';
    this.sort.active = '';
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.sortValue = null;
    this.paginator.pageIndex = 0;
    this.nameFilter.setValue('', { emitEvent: false });
    this.schoolFilter.setValue('', { emitEvent: false });
    this.classFilter.setValue('', { emitEvent: false });
    this.titleFilter.setValue('', { emitEvent: false });
    this.userTypeFilter.setValue('', { emitEvent: false });
    this.entityFilter.setValue('', { emitEvent: false });
    this.statusFilter.setValue('AllM', { emitEvent: false });
    this.createdAtFilter.setValue('', { emitEvent: false });
    this.entitySuperFilter.patchValue([], { emitEvent: false });
    this.schoolSuperFilter.patchValue([], { emitEvent: false });
    this.titleSuperFilter.patchValue([], { emitEvent: false });
    this.classSuperFilter.patchValue([], { emitEvent: false });
    this.userTypeSuperFilter.patchValue([], { emitEvent: false });
    this.statusSuperFilter.patchValue([], { emitEvent: false });
    this.getAllRncpTitles();
    this.getAllSchool();
    this.getAllUser();
    this.getAllClasses();
    this.classSuperFilterList = [];
    this.schoolSuperFilterList = [];

    this.superEntity = []
    this.superUserType = []
    this.superStatus = []
    this.superTitle = []
    this.superClass = []
    this.superSchool = []
  }

  getAllStudentExportData(pageNumber: number) {
    this.isWaitingForResponse = true;
    const pagination = {
      limit: 500,
      page: pageNumber,
    };
    const cr = !!this.ngxPermissionService.getPermission('CR School Director');
    const ca = !!this.ngxPermissionService.getPermission('Certifier Admin');
    let filter = ``;
    // because we cant send null id for filter, so we manupulate the filter to be string for graphql
    if (!!this.ngxPermissionService.getPermission('CR School Director') || !!this.ngxPermissionService.getPermission('Certifier Admin')) {
      filter += this.filteredValues.full_name ? `full_name : "${this.filteredValues.full_name}"` : '';
      filter += this.filteredValues.user_type ? `user_type: "${this.filteredValues.user_type}"` : '';
      filter += this.filteredValues.entity ? `entity: ${this.filteredValues.entity}` : '';
      filter += this.filteredValues.user_status ? ` user_status: ${this.filteredValues.user_status}` : '';
      filter += this.filteredValues.created_date ? ` created_date: "${this.filteredValues.created_date}"` : '';
    } else {
      let classFilter;
      if (this.filteredValues.class && this.filteredValues.class.length) {
        classFilter = this.filteredValues.class.map((item) => '"' + item + '"');
      }

      filter += this.filteredValues.full_name ? `full_name : "${this.filteredValues.full_name}"` : '';
      filter += this.filteredValues.user_type ? `user_type: "${this.filteredValues.user_type}"` : '';
      filter += this.filteredValues.school ? `school: "${this.filteredValues.school}"` : '';
      filter += this.filteredValues.title ? `title: "${this.filteredValues.title}"` : '';
      filter += classFilter ? `classes_name: [${classFilter.toString()}]` : '';
      filter += this.filteredValues.entity ? `entity: ${this.filteredValues.entity}` : '';
      filter += this.filteredValues.user_status ? ` user_status: ${this.filteredValues.user_status}` : '';
      filter += this.filteredValues.created_date ? ` created_date: "${this.filteredValues.created_date}"` : '';
    }

    if (!!this.ngxPermissionService.getPermission('CR School Director') || !!this.ngxPermissionService.getPermission('Certifier Admin')) {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((res) => {
        const dataUSer = res.entities.filter((ent) => ent.type.name === userType);
        let title_ids = this.utilService.getAcademicAllAssignedTitle(dataUSer);
        let schoolIds = this.utilService.getAcademicAllAssignedSchool(dataUSer);
        if (this.filteredValues.school || this.filteredValues.title) {
          title_ids = this.filteredValues.title ? this.filteredValues.title : this.utilService.getAcademicAllAssignedTitle(dataUSer);
          schoolIds = this.filteredValues.school ? this.filteredValues.school : this.utilService.getAcademicAllAssignedSchool(dataUSer);
        }
        if (title_ids && title_ids.length) {
          this.subs.sink = this.usersService
            .getAllUserFromCRWithSchool(pagination, this.sortValue, filter, title_ids, schoolIds)
            .subscribe((resp) => {
              if (resp && resp.length) {
                this.allStudentForExport.push(...resp);
                const page = pageNumber + 1;

                // recursively get student data by 500 until we dont get student data anymore
                // we use this way because if we get all the data at once, it will trigger cors policy error because response too big
                this.getAllStudentExportData(page);
              } else {
                this.isWaitingForResponse = false;
                this.exportAllData(this.allStudentForExport);
              }
            });
        }
      });
    } else {
      this.subs.sink = this.usersService.getAllUser(pagination, this.sortValue, filter).subscribe(
        (resp) => {
          if (resp && resp.length) {
            this.allStudentForExport.push(...resp);
            const page = pageNumber + 1;
            // recursively get student data by 500 until we dont get student data anymore
            // we use this way because if we get all the data at once, it will trigger cors policy error because response too big
            this.getAllStudentExportData(page);
          } else {
            this.isWaitingForResponse = false;
            this.exportAllData(this.allStudentForExport);
          }
        },
        (err) => {
          this.isWaitingForResponse = false;
        },
      );
    }
  }

  exportAllData(dataa) {
    const data = [];
    if (dataa) {
      this.isWaitingForResponse = true;
      for (const item of dataa) {

        const obj = [];
        let schoolName = '';
        let schoolId = '';
        let entityName = '';
        let titles = '';
        let classes = '';
        let userType = '';
        let groupSchool = '';

        for (const entity of this.getUniqueUserType(item.entities)) {
          // userType = userType ? userType + ', ' + (entity.type ? this.translate.instant(entity.type.name) : '') : entity.type ? this.translate.instant(entity.type.name) : '';
          userType = userType
            ? userType + ', ' + (entity.type ? this.translate.instant(`USER_TYPES.${entity.type.name}`) : '')
            : entity.type
            ? this.translate.instant(`USER_TYPES.${entity.type.name}`)
            : '';
        }

        for (const entity of this.getUniqueRncpTitles(item.entities)) {
          titles = titles
            ? titles + ', ' + (entity.assigned_rncp_title ? entity.assigned_rncp_title.short_name : '')
            : entity.assigned_rncp_title
            ? entity.assigned_rncp_title.short_name
            : '';
        }

        for (const entity of this.getUniqueClassesFromEntities(item.entities)) {
          classes = classes ? classes + ', ' + (entity.class ? entity.class.name : '') : entity.class ? entity.class.name : '';
        }

        let count = 0;
        for (const entity of this.getUniqueSchools(item.entities)) {
          if (entity.school) {
            count++;
            if (count === 1) {
              schoolId = entity.school._id;
            }
          }
          schoolName = schoolName
            ? schoolName + ', ' + (entity.school ? entity.school.short_name : '')
            : entity.school
            ? entity.school.short_name
            : '';
        }

        for (const entity of this.getUniqueGroupSchools(item.entities)) {
          groupSchool = groupSchool ? groupSchool + ', ' + (entity ? entity.short_name : '') : entity ? entity.short_name : '';
        }

        for (const entity of this.getUniqueEntities(item.entities)) {
          entityName = entityName
            ? entityName + ', ' + (entity.entity_name ? this.translate.instant(entity.entity_name) : '')
            : this.translate.instant(entity.entity_name)
            ? this.translate.instant(entity.entity_name)
            : '';
        }

        // TODO: From the template get the data location and add the data
        obj[0] = item.civility ? this.translate.instant(item.civility) : '-';
        obj[1] = item.first_name ? item.first_name : '-';
        obj[2] = item.last_name;
        obj[3] =
          '=HYPERLINK("' + `http://www.admtc.pro/users?user=${item._id}&status=exports` + '"; "' + this.translate.instant('LINK') + '")';
        obj[4] = schoolName ? schoolName : '-';
        obj[5] = schoolId
          ? '=HYPERLINK("' + `http://www.admtc.pro/school/${schoolId}` + '"; "' + this.translate.instant('LINK') + '")'
          : '-';
        obj[6] = groupSchool ? groupSchool : '-';
        obj[7] = titles ? titles : '-';
        obj[8] = classes ? classes : '-';
        obj[9] = entityName ? entityName : '-';
        obj[10] = userType ? userType : '-';
        obj[11] = item.user_status ? this.translate.instant(item.user_status) : '-';
        obj[12] = item.email ? item.email : '-';
        data.push(obj);
      }
      this.isWaitingForResponse = false;
      const valueRange = { values: data };
      const today = moment().format('DD-MM-YYYY');
      const title = this.exportName + '_' + today;
      const sheetID = this.translate.currentLang === 'en' ? 0 : 1356168900;
      const sheetData = {
        spreadsheetId: '1ev46dt3k1XyVBsAULBxA50zHJnxZTT2lv33hKNLVjbY',
        sheetId: sheetID,
        range: 'A7',
      };
      this.exportCsvService.createAndUpdateSpreadsheet(valueRange, title, sheetData);
    }
  }

  exportData() {
    Swal.close();
    const data = [];
    if (this.selectType === 'one') {



      this.userSelected = this.selection.selected;
      if (this.userSelected) {
        this.isWaitingForResponse = true;
        for (const item of this.userSelected) {

          const obj = [];
          let schoolName = '';
          let schoolId = '';
          let entityName = '';
          let titles = '';
          let classes = '';
          let userType = '';
          let groupSchool = '';

          for (const entity of this.getUniqueUserType(item.entities)) {
            userType = userType
              ? userType + ', ' + (entity.type ? this.translate.instant(`USER_TYPES.${entity.type.name}`) : '')
              : entity.type
              ? this.translate.instant(`USER_TYPES.${entity.type.name}`)
              : '';
          }

          for (const entity of this.getUniqueRncpTitles(item.entities)) {
            titles = titles
              ? titles + ', ' + (entity.assigned_rncp_title ? entity.assigned_rncp_title.short_name : '')
              : entity.assigned_rncp_title
              ? entity.assigned_rncp_title.short_name
              : '';
          }

          for (const entity of this.getUniqueClassesFromEntities(item.entities)) {
            classes = classes ? classes + ', ' + (entity.class ? entity.class.name : '') : entity.class ? entity.class.name : '';
          }

          let count = 0;
          for (const entity of this.getUniqueSchools(item.entities)) {
            if (entity.school) {
              count++;
              if (count === 1) {
                schoolId = entity.school._id;
              }
            }
            schoolName = schoolName
              ? schoolName + ', ' + (entity.school ? entity.school.short_name : '')
              : entity.school
              ? entity.school.short_name
              : '';
          }

          for (const entity of this.getUniqueGroupSchools(item.entities)) {
            groupSchool = groupSchool ? groupSchool + ', ' + (entity ? entity.short_name : '') : entity ? entity.short_name : '';
          }

          for (const entity of this.getUniqueEntities(item.entities)) {
            entityName = entityName
              ? entityName + ', ' + (entity.entity_name ? this.translate.instant(entity.entity_name) : '')
              : this.translate.instant(entity.entity_name)
              ? this.translate.instant(entity.entity_name)
              : '';
          }

          // TODO: From the template get the data location and add the data
          obj[0] = item.civility ? this.translate.instant(item.civility) : '-';
          obj[1] = item.first_name ? item.first_name : '-';
          obj[2] = item.last_name;
          obj[3] =
            '=HYPERLINK("' + `http://www.admtc.pro/users?user=${item._id}&status=exports` + '"; "' + this.translate.instant('LINK') + '")';
          obj[4] = schoolName ? schoolName : '-';
          obj[5] = schoolId
            ? '=HYPERLINK("' + `http://www.admtc.pro/school/${schoolId}` + '"; "' + this.translate.instant('LINK') + '")'
            : '-';
          obj[6] = groupSchool ? groupSchool : '-';
          obj[7] = titles ? titles : '-';
          obj[8] = classes ? classes : '-';
          obj[9] = entityName ? entityName : '-';
          obj[10] = userType ? userType : '-';
          obj[11] = item.user_status ? this.translate.instant(item.user_status) : '-';
          obj[12] = item.email ? item.email : '-';
          data.push(obj);
        }

        this.isWaitingForResponse = false;
        const valueRange = { values: data };
        const today = moment().format('DD-MM-YYYY');
        const title = this.exportName + '_' + today;
        const sheetID = this.translate.currentLang === 'en' ? 0 : 1356168900;
        const sheetData = {
          spreadsheetId: '1ev46dt3k1XyVBsAULBxA50zHJnxZTT2lv33hKNLVjbY',
          sheetId: sheetID,
          range: 'A7',
        };
        this.exportCsvService.createAndUpdateSpreadsheet(valueRange, title, sheetData);
      }
    } else {
      this.allStudentForExport = [];
      this.getAllStudentExportData(0);
    }
  }

  /*
   * Will render tooltip message for column school merged
   * */
  renderTooltipMergedSchool(schools: { short_name: string; _id: string }[]): string {
    let tooltip = '';
    for (let i = 1; i < schools.length; i++) {
      tooltip = tooltip + schools[i].short_name + `, `;
    }
    return tooltip.substring(0, tooltip.length - 2);
  }

  /*
   * Will render tooltip message for column school
   * */
  renderTooltipSchool(entities: any[]): string {
    let tooltip = '';
    const type = _.uniqBy(entities, 'school.short_name');
    for (const entity of type) {
      if (entity.school) {
        tooltip = tooltip + entity.school.short_name + `, `;
      }
    }
    return tooltip.substring(0, tooltip.length - 2);
  }

  // ************* render tooltip for column school IF entity is company
  renderTooltipSchoolCompany(schools: any[]): string {
    let tooltip = '';
    const type = _.uniqBy(schools, 'school.short_name');
    for (const school of type) {
      if (school.short_name) {
        tooltip = tooltip + school.short_name + `, `;
      }
    }
    return tooltip.substring(0, tooltip.length - 2);
  }

  /*
   * Render tooltip for column title*/
  renderTooltipTitle(entities: any[]): string {
    let tooltip = '';
    let count = 0;
    const type = _.uniqBy(entities, 'assigned_rncp_title.short_name');
    for (const entity of type) {
      count++;
      if (count > 1) {
        if (entity.assigned_rncp_title) {
          tooltip = tooltip ? tooltip + ', ' : '';
          tooltip = tooltip + `${entity.assigned_rncp_title.short_name}`;
        }
      } else {
        if (entity.assigned_rncp_title) {
          tooltip = tooltip + `${entity.assigned_rncp_title.short_name}`;
        }
      }
    }
    return tooltip;
  }

  renderTooltipClasses(entities: any[]): string {
    let tooltip = '';
    let count = 0;
    const type = _.uniqBy(entities, 'class');
    if (!type.length) {
      return;
    }
    for (const entity of type) {
      count++;
      if (count > 1) {
        if (entity.class) {
          tooltip = tooltip ? tooltip + ', ' : '';
          tooltip = tooltip + `${entity.class.name}`;
        }
      } else {
        if (entity.class) {
          tooltip = tooltip + `${entity.class.name}`;
        }
      }
    }
    return tooltip;
  }

  renderTooltipTitleGroupofSchool(entity): string {
    let tooltip = '';
    let count = 0;
    const tempData = this.getUniquGroupTitles(entity);
    for (const title of tempData) {
      count++;
      if (count > 1) {
        if (title && title.rncp_title_id && title.rncp_title_id.short_name) {
          tooltip = tooltip ? tooltip + ', ' : '';
          tooltip = tooltip + `${title.rncp_title_id.short_name}`;
        }
      } else {
        if (title && title.rncp_title_id && title.rncp_title_id.short_name) {
          tooltip = tooltip + `${title.rncp_title_id.short_name}`;
        }
      }
    }
    return tooltip;
  }

  renderTooltipTitleAdmtcDir(entity) {
    const data = entity.titles_in_charge;
    const tempData = [];
    for (var i = 0; i < data.length; i++) {
      tempData.push(data[i].short_name);
    }
    let tooltip = tempData.toString();
    return tooltip;
  }
  /*
   * Render tooltip for column type
   * */
  renderTooltipType(entities: any[]): string {
    let tooltip = '';
    let count = 0;
    const type = _.uniqBy(entities, 'type.name');
    for (const entity of type) {
      count++;
      if (count > 1) {
        if (entity.type) {
          tooltip = tooltip + ', ';
          tooltip = tooltip + this.translate.instant('USER_TYPES.' + entity.type.name);
        }
      } else {
        if (entity.type) {
          tooltip = tooltip + this.translate.instant('USER_TYPES.' + entity.type.name);
        }
      }
    }
    return tooltip;
  }

  /*
   * Render tooltip for column type
   * */
  renderTooltipEntity(entities: any[]): string {
    let tooltip = '';
    let count = 0;
    const type = _.uniqBy(entities, 'entity_name');
    for (const entity of type) {
      count++;
      if (count > 1) {
        if (entity?.entity_name) {
          tooltip = tooltip + ', ';
          tooltip = tooltip + this.translate.instant(entity?.entity_name);
        }
      } else {
        if (entity?.entity_name) {
          tooltip = tooltip + this.translate.instant(entity?.entity_name);
        }
      }
    }
    return tooltip;
  }

  /*
   * Render tooltip for column type
   * */
  renderTooltipGroupSchool(entities: any[]): string {
    let tooltip = '';
    let count = 0;
    const type = _.uniqBy(entities, 'short_name');
    for (const entity of type) {
      count++;
      if (count > 1) {
        if (entity && entity.short_name) {
          tooltip = tooltip + ', ';
          tooltip = tooltip + entity.short_name;
        }
      } else {
        if (entity && entity.entity_name) {
          tooltip = tooltip + entity.short_name;
        }
      }
    }
    return tooltip;
  }

  getUniqueEntities(entities) {
    return _.uniqBy(entities, 'entity_name');
  }

  getUniqueRncpTitles(entities) {
    return _.uniqBy(entities, 'assigned_rncp_title.short_name');
  }

  getUniqueClassesFromEntities(entities) {
    return _.uniqBy(entities, 'class.name');
  }

  getUniquGroupTitles(entity) {

    let result = [];
    if (
      entity &&
      entity.group_of_school &&
      entity.group_of_school.headquarter &&
      entity.group_of_school.headquarter.preparation_center_ats &&
      entity.group_of_school.headquarter.preparation_center_ats.length
    ) {
      result = result.concat(entity.group_of_school.headquarter.preparation_center_ats);
    }
    if (entity && entity.group_of_school && entity.group_of_school.school_members && entity.group_of_school.school_members.length) {
      const temp = [];
      entity.group_of_school.school_members.forEach((school) => {
        if (school && school.preparation_center_ats && school.preparation_center_ats.length) {
          school.preparation_center_ats.forEach((title) => {
            temp.push(title);
          });
        }
      });
      result = result.concat(temp);
    }

    return _.uniqBy(result, 'rncp_title_id.short_name');
  }

  getUniqueSchools(entities) {
    return _.uniqBy(entities, 'school.short_name');
  }

  getMergedUniqueSchool(entities, user) {
    const mergedSchools = [];
    if (entities && entities.length) {
      entities.forEach((entity) => {
        if (entity.school !== null && entity.entity_name !== 'company') {
          mergedSchools.push(entity.school);
        } else if (
          entity.school === null &&
          entity.group_of_schools &&
          entity.group_of_schools.length > 0 &&
          entity.entity_name !== 'company'
        ) {
          entity.group_of_schools.forEach((school) => {
            mergedSchools.push(school);
          });
        } else if (entity.entity_name === 'company' && entity.companies && entity.companies.length) {
          entity.companies.forEach((company) => {

            const companyId = company && company._id ? company._id : '';
            if (company !== null) {
              if (company.school_ids && company.school_ids.length) {
                company.school_ids.forEach((school) => {
                  let schoolName = school;
                  if (school.companies) {
                    const found = school.companies.find(
                      (connect) => connect && connect.company_id && connect.company_id._id && connect.company_id._id === companyId,
                    );
                    if (found) {
                      if (found.mentor_ids.length) {
                        const foundmentor = found.mentor_ids.filter((mentor) => mentor && mentor._id === user);
                        if (foundmentor.length) {
                          mergedSchools.push(schoolName);
                        }
                      }
                    }
                  }
                });
              }
            }
          });
        }
      });
    }

    return _.uniqBy(mergedSchools, 'short_name');
  }

  getUniqueSchoolsCompany(schools) {
    const school = _.filter(schools, function (schoolData) {
      return schoolData !== null;
    });
    return _.uniqBy(school, 'school.short_name');
  }

  getUniqueGroupSchools(entity) {
    let data = entity.group_of_schools;
    if (entity.group_of_school) {
      if (entity.group_of_school.headquarter) {
        data.push(entity.group_of_school.headquarter);
      }
      if (entity.group_of_school.school_members && entity.group_of_school.school_members.length) {
        data = data.concat(entity.group_of_school.school_members);
      }
    }
    return _.uniqBy(data, 'short_name');
  }
  getUniqueUserType(entities) {
    return _.uniqBy(entities, 'type.name');
  }

  sendMail(data) {
    this.mailUser = this.dialog.open(UserEmailDialogComponent, {
      disableClose: true,
      width: '750px',
      data: data,
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

  showOptions(info) {
    const numSelected = this.selection.selected.length;
    this.selectType = info;
    if (numSelected > 0) {
      this.disabledExport = false;
    } else {
      this.disabledExport = true;
    }
  }

  getRncpTitles(school) {
    this.rncpTitleService.GetAllTitleDropdownListBySchool(school).subscribe(
      (rncpTitles) => {
        this.titles = rncpTitles;
        this.filteredTitleNames = this.titleFilter.valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            this.titles
              .filter((title) => (title && title.short_name ? title.short_name.toLowerCase().includes(searchText.toLowerCase()) : false))
              .sort((a: any, b: any) => a.short_name.localeCompare(b.short_name)),
          ),
        );
      },
      (err) => {

      },
    );
  }

  getAllRncpTitles() {
    if (this.isUserADMTC) {
      this.subs.sink = this.rncpTitleService.getRncpTitleListData().subscribe((resp) => {
        this.titles = resp;
        this.filteredTitleNames = this.titleFilter.valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            this.titles
              .filter((title) =>
                title && title.short_name
                  ? this.utilService
                      .simpleDiacriticSensitiveRegex(title.short_name)
                      .toLowerCase()
                      .includes(this.utilService.simpleDiacriticSensitiveRegex(searchText).toLowerCase())
                  : false,
              )
              .sort((a: any, b: any) => a.short_name.localeCompare(b.short_name)),
          ),
        );
      });
    } else {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((res) => {
        const dataUSer = res.entities.filter((ent) => ent.type.name === userType);
        const title_ids = this.utilService.getAcademicAllAssignedTitle(dataUSer);
        this.subs.sink = this.rncpTitleService.getAllRncpTitleListData(false, title_ids).subscribe(
          (rncpTitles) => {
            this.titles = rncpTitles;
            this.filteredTitleNames = this.titleFilter.valueChanges.pipe(
              startWith(''),
              map((searchText) =>
                this.titles
                  .filter((title) =>
                    title && title.short_name
                      ? this.utilService
                          .simpleDiacriticSensitiveRegex(title.short_name)
                          .toLowerCase()
                          .includes(this.utilService.simpleDiacriticSensitiveRegex(searchText).toLowerCase())
                      : false,
                  )
                  .sort((a: any, b: any) => a.short_name.localeCompare(b.short_name)),
              ),
            );
          },
          (err) => {

          },
        );
      });
    }
  }

  getAllClasses() {
    this.subs.sink = this.rncpTitleService.getClasses().subscribe((resp) => {
      const temp = _.cloneDeep(resp);
      this.classes = _.uniqBy(temp, 'name').sort((a: any, b: any) => a.name.localeCompare(b.name));
      this.filteredClasses = this.classFilter.valueChanges.pipe(
        startWith(''),
        map((searchText) =>
          this.classes
            .filter((classObj) =>
              classObj && classObj.name
                ? this.utilService
                    .simpleDiacriticSensitiveRegex(classObj.name)
                    .toLowerCase()
                    .includes(this.utilService.simpleDiacriticSensitiveRegex(searchText).toLowerCase())
                : false,
            )
            .sort((a: any, b: any) => a.name.localeCompare(b.name)),
        ),
      );
    });
  }

  getAllClassesBasedOnTitle(titleId: string) {
    this.subs.sink = this.rncpTitleService.getClassByRncpTitle(titleId).subscribe((resp) => {
      const temp = _.cloneDeep(resp);
      this.classes = _.uniqBy(temp, 'name').sort((a: any, b: any) => a.name.localeCompare(b.name));
      this.filteredClasses = this.classFilter.valueChanges.pipe(
        startWith(''),
        map((searchText) =>
          this.classes
            .filter((classObj) =>
              classObj && classObj.name
                ? this.utilService
                    .simpleDiacriticSensitiveRegex(classObj.name)
                    .toLowerCase()
                    .includes(this.utilService.simpleDiacriticSensitiveRegex(searchText).toLowerCase())
                : false,
            )
            .sort((a: any, b: any) => a.name.localeCompare(b.name)),
        ),
      );
    });
  }

  getSchoolCascade(titlee) {
    this.schoolService.getSchoolCascade(titlee).subscribe(
      (resp) => {
        this.schools = resp;
        this.filteredSchoolNames = this.schoolFilter.valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            this.schools.filter((school) =>
              school && school.short_name
                ? this.utilService
                    .simpleDiacriticSensitiveRegex(school.short_name)
                    .toLowerCase()
                    .includes(this.utilService.simpleDiacriticSensitiveRegex(searchText).toLowerCase())
                : false,
            ),
          ),
        );
      },
      (err) => {

      },
    );
  }

  getAllSchool() {
    if (this.isUserADMTC) {
      this.subs.sink = this.schoolService.getSchoolShortNames().subscribe((resp) => {
        this.schools = resp;
        this.filteredSchoolNames = this.schoolFilter.valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            this.schools.filter((school) =>
              school && school.short_name
                ? this.utilService
                    .simpleDiacriticSensitiveRegex(school.short_name)
                    .toLowerCase()
                    .includes(this.utilService.simpleDiacriticSensitiveRegex(searchText).toLowerCase())
                : false,
            ),
          ),
        );
      });
    } else {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((res) => {
        const dataUSer = res.entities.filter((ent) => ent.type.name === userType);
        const school_ids = this.utilService.getAcademicAllAssignedSchool(dataUSer);

        this.subs.sink = this.schoolService.getAllSchoolsByUserOwn(school_ids).subscribe((resp: any) => {
          this.schools = resp;
          this.filteredSchoolNames = this.schoolFilter.valueChanges.pipe(
            startWith(''),
            map((searchText) =>
              this.schools.filter((school) =>
                school && school.short_name
                  ? this.utilService
                      .simpleDiacriticSensitiveRegex(school.short_name)
                      .toLowerCase()
                      .includes(this.utilService.simpleDiacriticSensitiveRegex(searchText).toLowerCase())
                  : false,
              ),
            ),
          );
        });
      });
    }
  }

  // getUrgentMail() {
  //   this.subs.sink = this.mailboxService.getUrgentMail().subscribe((mailList: any[]) => {
  //     if (mailList && mailList.length) {
  //       this.subs.sink = this.dialog
  //         .open(ReplyUrgentMessageDialogComponent, {
  //           disableClose: true,
  //           width: '825px',
  //           panelClass: 'certification-rule-pop-up',
  //           data: mailList,
  //         })
  //         .afterClosed()
  //         .subscribe((resp) => {
  //           this.subs.sink = this.mailboxService.getUrgentMail().subscribe((mailUrgent: any[]) => {
  //             if (mailUrgent && mailUrgent.length) {
  //               this.replyUrgentMessageDialogComponent = this.dialog.open(ReplyUrgentMessageDialogComponent, {
  //                 disableClose: true,
  //                 width: '825px',
  //                 panelClass: 'certification-rule-pop-up',
  //                 data: mailUrgent,
  //               });
  //             }
  //           });
  //         });
  //     }
  //   });
  // }

  filterCertifierEntites() {
    // get schools of current logged in user
    this.subs.sink = this.schoolService.getSchoolsOfUser().subscribe((schools) => {
      const schoolArray = schools.map((school) => {
        return { value: school._id, label: school.short_name };
      });
      this.loggedInUserSchools = schoolArray;

      // filter entities so logged in user (certifier) can only see list of school, title, and user type certifier in the table
      this.users.forEach((user) => {
        const entities = user.entities.filter((entity) => {
          if (entity && entity.school && entity.school._id) {
            const isUserTypeExist = entity.school_type === 'certifier';
            const isSchoolExist = this.loggedInUserSchools.find((school) => school.value === entity.school._id);
            return isUserTypeExist && isSchoolExist;
          }
        });
        user.entities = entities;
      });

      this.dataSource.data = this.users;
      this.usersCount = this.users && this.users.length ? this.users[0].count_document : 0;
      this.isReset = false;
      this.isWaitingForResponse = false;
      this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
    });
  }

  openTransferDialog() {
    this.dialog.open(TransferResponsibilityDialogComponent, {
      disableClose: true,
      panelClass: 'certification-rule-pop-up',
      width: '615px',
      autoFocus: false,
    });
  }

  utcToLocal(dates) {
    const stillUtc = moment(dates).toDate();
    const local = moment(stillUtc).local().format('DD/MM/YYYY');
    return local;
  }

  sendMailToAcadir(user) {
    this.mailUser = this.dialog.open(UserEmailDialogComponent, {
      disableClose: true,
      width: '750px',
      data: { ...user, multipleEntities: true, userType: 'Mentor', sendToAcadir: true },
    });
  }

  isUserAMentor(user) {
    if (user && user.students_connected && user.entities) {
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

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    clearInterval(this.intVal);
    this.subs.unsubscribe();
  }
}
