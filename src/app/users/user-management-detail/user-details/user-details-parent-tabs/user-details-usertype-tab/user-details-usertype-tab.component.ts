import { NgxPermissionsService } from 'ngx-permissions';
import { PermissionService } from './../../../../../service/permission/permission.service';
import { ModifyUserTypeDialogComponent } from './modify-user-type-dialog/modify-user-type-dialog.component';
import { Component, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { map, tap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { SelectionModel } from '@angular/cdk/collections';
import { UntypedFormControl } from '@angular/forms';
import { UserService } from 'app/service/user/user.service';
import Swal from 'sweetalert2';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UsersService } from 'app/service/users/users.service';

interface Entities {
  entity_name: string;
  type: {
    _id: string;
    name: string;
  };
  school: {
    _id: string;
    short_name: string;
  };
  companies: {
    company_name: string;
    _id: string;
  }[];
  campus: {
    _id: string;
    name: string;
  };
  class: {
    _id: string;
    name: string;
  };
  assigned_rncp_title: {
    _id: string;
    short_name: string;
  };
}
@Component({
  selector: 'ms-user-details-usertype-tab',
  templateUrl: './user-details-usertype-tab.component.html',
  styleUrls: ['./user-details-usertype-tab.component.scss'],
})
export class UserDetailsUsertypeTabComponent implements OnInit, OnChanges {
  @Input() userId: string;
  @Input() status: string;
  scholarPeriodCount;
  dataSource = new MatTableDataSource([]);
  noData: any;
  isReset: Boolean = false;
  dataLoaded: Boolean = false;
  displayedColumns: string[] = ['user_type', 'entity', 'company', 'school', 'rncp_title', 'class', 'action'];
  filterColumns: string[] = [
    'user_type_filter',
    'entityFilter',
    'companyFilter',
    'schoolFilter',
    'rncpFilter',
    'classFilter',
    'actionFilter',
  ];
  filteredValues = {
    type: null,
    entity: null,
    company: null,
    school: null,
    rncp: null,
    class: null,
  };

  userTypeFilter = new UntypedFormControl(null);
  entityFilter = new UntypedFormControl(null);
  companyFilter = new UntypedFormControl(null);
  schoolFilter = new UntypedFormControl(null);
  rncpFilter = new UntypedFormControl(null);
  classFilter = new UntypedFormControl(null);

  isWaitingForResponse = false;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  isLoading: Boolean = false;
  dataCount = 0;
  intackChannelCount = 0;
  private subs = new SubSink();

  private timeOutVal: any;
  types = [];
  entities = [];
  schools = [];
  titles = [];
  classes = [];
  companies = [];
  originalEntityList: any;
  isOperator: boolean;

  currentUser: any;
  user: any;
  isDisplayActionBtn: boolean = true;
  userIsAcadDirAdmin = false;
  userIsCRDirAdmin = false;

  constructor(
    private translate: TranslateService,
    private dialog: MatDialog,
    private userService: UsersService,
    private authService: AuthService,
    private userS: UserService,
    public permissionService: PermissionService,
    private ngxPermissionService: NgxPermissionsService,
  ) {}

  ngOnInit() {
    this.initFilter();
    this.checkIsOperator();
    this.checkUserType();
    this.userS.childrenFormValidationStatus = true;
    this.currentUser = this.authService.getLocalStorageUser();
  }

  displayAllActionBtn() {
    // if user type not admtc, hide action button for my own account in table so I cant delete or edit my own account
    if (
      this.userId === this.currentUser._id &&
      !this.ngxPermissionService.getPermission('ADMTC Admin') &&
      !this.ngxPermissionService.getPermission('ADMTC Director')
    ) {
      this.isDisplayActionBtn = false;
    }
    // if I am certifier admin, I cant edit or delete CR school dir
    if (this.ngxPermissionService.getPermission('Certifier Admin')) {
      const CRSchoolDirId = '5a2e1ecd53b95d22c82f954f';
      this.user.entities.forEach((entity) => {
        if (entity.type && entity.type._id && entity.type._id === CRSchoolDirId) {
          this.isDisplayActionBtn = false;
        }
      });
    }
  }

  ngOnChanges() {
    this.resetTable();
    this.isDisplayActionBtn = true;
    this.fetchUserDetail();
    this.subs.sink = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.fetchUserDetail();
    });
    this.fetchTableData();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        tap(() => {
          if (!this.isReset) {
            this.fetchUserDetail();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
  }

  checkIsOperator() {
    this.isOperator = this.authService.getCurrentUser().entities.some((entity) => entity.entity_name && entity.entity_name === 'operator');
  }

  checkUserType() {
    const entities = this.authService.getLocalStorageUser()?.entities || []
    this.userIsAcadDirAdmin = entities.some(entity => ['Academic Director', 'Academic Admin'].includes(entity?.type?.name))
    this.userIsCRDirAdmin = entities.some(entity => ['CR School Director', 'Certifier Admin'].includes(entity?.type?.name))
  }

  fetchUserDetail() {
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    const filter = this.cleanFilterData();
  }

  fetchTableData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.userS.getOneUserCard(this.userId, this.status).subscribe((resp: any) => {
      if (resp) {
        this.user = resp;
        this.displayAllActionBtn();
        if (resp && resp.entities && resp.entities.length) {
          const user = _.cloneDeep(resp);
          const entities = _.filter(user.entities, entity => {
            if (!this.userIsAcadDirAdmin && !this.userIsCRDirAdmin) {
              return true
            }
            const userSchoolId = this.currentUser?.entities[0]?.school?._id
            return entity?.school?._id && entity?.school?._id === userSchoolId
          })
          this.dataSource.paginator = this.paginator;
          this.originalEntityList = resp;
          this.dataSource.data = _.cloneDeep(entities);
          this.dataCount = Number(entities?.length)
          this.dataSource.sort = this.sort;
          this.setDropdowns(user.entities);
        } else {
          this.dataSource.data = [];
          this.paginator.length = 0;
          this.dataCount = 0;
          this.emptyFilterList();
        }
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
        this.isReset = false;
        this.isWaitingForResponse = false;
      }
    });
  }

  getOneUserDeactivated(userId: string) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.userS.getUserDeactivation(userId).subscribe(
      (resp) => {
        if (resp && resp.entities && resp.entities.length) {
          const user = _.cloneDeep(resp);
          this.dataSource.paginator = this.paginator;
          this.originalEntityList = _.cloneDeep(user);
          this.dataSource.data = _.cloneDeep(user.entities);
          this.dataCount = user.entities.length;
          this.dataSource.sort = this.sort;
          this.setDropdowns(user.entities);
        } else {
          this.dataSource.data = [];
          this.paginator.length = 0;
          this.dataCount = 0;
          this.emptyFilterList();
        }
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
        this.isReset = false;
        this.isWaitingForResponse = false;
      },
      (error) => {

        this.isWaitingForResponse = false;
      },
    );
  }

  emptyFilterList() {}

  setDropdowns(entities: Entities[]) {
    // types
    this.types = _.uniqBy(
      entities.filter((entity) => {
        if (!this.userIsAcadDirAdmin && !this.userIsCRDirAdmin) {
          return entity?.type?.name
        }
        const userSchoolId = this.currentUser?.entities[0]?.school?._id
        return entity?.type?.name && entity?.school?._id && entity?.school?._id === userSchoolId
      }).map((entity) => ({ ...entity.type, name: entity.type.name })),
      'name',
    );
    //entities
    this.entities = _.uniqBy(entities.filter((entity) => {
      if (!this.userIsAcadDirAdmin && !this.userIsCRDirAdmin) {
        return entity?.entity_name
      }
      const userSchoolId = this.currentUser?.entities[0]?.school?._id
      return entity?.entity_name && entity?.school?._id && entity?.school?._id === userSchoolId
    }).map((entity) => entity.entity_name));
    this.schools = _.uniqBy(
      entities.filter(entity => {
        if (!this.userIsAcadDirAdmin && !this.userIsCRDirAdmin) {
          return entity?.school
        }
        const userSchoolId = this.currentUser?.entities[0]?.school?._id
        return entity?.school?._id && entity?.school?._id === userSchoolId
      }).map((entity) => entity.school),
      'short_name',
    );
    // companies
    const companiesArray = [].concat.apply([], entities.filter((entity) => {
      if (!this.userIsAcadDirAdmin && !this.userIsCRDirAdmin) {
        return entity
      }
      const userSchoolId = this.currentUser?.entities[0]?.school?._id
      return entity?.school?._id && entity?.school?._id === userSchoolId
    }).map((entity) => entity.companies));
    this.companies = _.uniqBy(companiesArray, '_id');

    // schools
    if (this.schools && this.schools.length === 0) {
      this.schools = [
        {
          _id: '',
          short_name: this.translate.instant('NOT RECORD FOUND'),
          disabled: true,
        },
      ];
    }
    // titles
    this.titles = _.uniqBy(
      entities
        .filter((entity) => {
          if (!this.userIsAcadDirAdmin && !this.userIsCRDirAdmin) {
            return entity?.assigned_rncp_title?.short_name
          }
          const userSchoolId = this.currentUser?.entities[0]?.school?._id
          return entity?.assigned_rncp_title?.short_name && entity?.school?._id === userSchoolId
        })
        .map((entity) => ({ ...entity.assigned_rncp_title, name: entity.assigned_rncp_title.short_name })),
      'short_name',
    );
    // classes
    this.classes = _.uniqBy(
      entities
        .filter((entity) => {
          if (!this.userIsAcadDirAdmin && !this.userIsCRDirAdmin) {
            return entity?.class?.name
          }
          const userSchoolId = this.currentUser?.entities[0]?.school?._id
          return entity?.class?.name && entity?.school?._id === userSchoolId
        })
        .map((entity) => ({ ...entity.class, name: entity.class.name })),
      'name',
    );
  }

  // init listener to the filters
  initFilter() {
    this.subs.sink = this.userTypeFilter.valueChanges.subscribe((type) => {
      this.filteredValues['type'] = type;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.entityFilter.valueChanges.subscribe((entity) => {
      this.filteredValues['entity'] = entity;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.companyFilter.valueChanges.subscribe((company) => {
      this.filteredValues['company'] = company;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.schoolFilter.valueChanges.subscribe((school) => {
      this.filteredValues['school'] = school;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.rncpFilter.valueChanges.subscribe((rncp) => {
      this.filteredValues['rncp'] = rncp;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.classFilter.valueChanges.subscribe((class_name) => {
      this.filteredValues['class'] = class_name;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.dataSource.filterPredicate = this.customFilterPredicate();
    this.dataSource.sortingDataAccessor = this.customSortingBehavior();
  }

  // custom filter logic
  customFilterPredicate() {
    return (data, filter: string) => {
      const searchString = JSON.parse(filter);
      // if (searchString.type) {
      //   data.ty
      // }
      const typeFound = searchString.type ? (data.type ? searchString.type === data.type.name : false) : true;
      const entityFound = searchString.entity ? (data.entity_name ? searchString.entity === data.entity_name : false) : true;
      const schoolFound = searchString.school ? (data.school ? searchString.school === data.school.short_name : false) : true;
      const companyFound = searchString.company
        ? data.companies && data.companies.length
          ? searchString.company === data.companies[0].company_name
          : false
        : true;
      const rncpFound = searchString.rncp
        ? data.assigned_rncp_title
          ? searchString.rncp === data.assigned_rncp_title.short_name
          : false
        : true;
      const classFound = searchString.class ? (data.class ? searchString.class === data.class.name : false) : true;

      return typeFound && entityFound && companyFound && schoolFound && rncpFound && classFound;
    };
  }

  customSortingBehavior() {
    return (this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'user_type':
          return item.type ? item.type.name : null;
        case 'entity':
          return item ? item.entity_name : null;
        case 'company':
          return item.companies && item.companies.length ? item.companies[0].company_name : null;
        case 'school':
          return item.school ? item.school.short_name : null;
        case 'rncp_title':
          return item.assigned_rncp_title ? item.assigned_rncp_title.short_name : null;
        case 'class':
          return item.class ? item.class.name : null;
        default:
          return item[property];
      }
    });
  }

  // on reset button click
  resetTable() {
    this.isReset = true;
    this.paginator.pageIndex = 0;

    this.filteredValues = {
      type: '',
      entity: '',
      company: '',
      school: '',
      rncp: '',
      class: '',
    };

    this.sort.direction = '';
    this.sort.active = '';
    this.userTypeFilter.patchValue(null, { emitEvent: false });
    this.entityFilter.patchValue(null, { emitEvent: false });
    this.companyFilter.patchValue(null, { emitEvent: false });
    this.schoolFilter.patchValue(null, { emitEvent: false });
    this.rncpFilter.patchValue(null, { emitEvent: false });
    this.classFilter.patchValue(null, { emitEvent: false });

    this.dataSource.filter = JSON.stringify(this.filteredValues);
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
        this.fetchTableData();
      });
  }

  cleanFilterData() {
    const filterData = _.cloneDeep(this.filteredValues);
    let filterQuery = '';
    Object.keys(filterData).forEach((key) => {
      // only add key that has value to the query. so it wont send filter with empty string
      if (filterData[key] || filterData[key] === false) {
        filterQuery = filterQuery + ` ${key}:"${filterData[key]}"`;
      }
    });
    return 'filter: {' + filterQuery + '}';
  }

  onRemoveEntity(entityId: string) {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('deleteUserType.TITLE'),
      text: this.translate.instant('deleteUserType.TEXT'),
      footer: `<span style="margin-left: auto">deleteUserType</span>`,
      showCancelButton: true,
      allowEscapeKey: true,
      confirmButtonText: this.translate.instant('SWEET_ALERT.DELETE.CONFIRM'),
      cancelButtonText: this.translate.instant('SWEET_ALERT.DELETE.CANCEL'),
    }).then((result) => {
      clearTimeout(this.timeOutVal);
      if (result.value) {
        this.updateUserEntities(entityId);
      }
    });
  }

  temporarilyDisableConfirmButton(timeDisabled) {
    const confirmBtnRef = Swal.getConfirmButton();
    confirmBtnRef.setAttribute('disabled', '');
    const time = setInterval(() => {
      timeDisabled -= 1;
      confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM') + ' in ' + timeDisabled + ' sec';
    }, 1000);

    this.timeOutVal = setTimeout(() => {
      confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM');
      confirmBtnRef.removeAttribute('disabled');
      clearInterval(time);
      clearTimeout(this.timeOutVal);
    }, timeDisabled * 1000);
  }

  createPayload(entityToDelete) {
    let filteredEntities = [];
    const originalEntity = _.cloneDeep(this.originalEntityList);
    filteredEntities = originalEntity.entities.filter((entity) => JSON.stringify(entity) !== JSON.stringify(entityToDelete));

    return filteredEntities.map((entity) => {
      for (const [key, value] of Object.entries(entity)) {
        if (value && Array.isArray(value)) {
          entity[key] = value.filter((obj) => obj.hasOwnProperty('_id')).map((obj) => obj._id);
        }
        if (value && typeof value === 'object' && value.hasOwnProperty('_id')) {
          entity[key] = value['_id'];
        }
      }
      return entity;
    });
  }

  // convert objects with key '_id' and only return this _id value | so obj: {_id: 'a'} => obj: 'a'
  // extractStringIdFromObject(obj) {
  //   for (const [key, value] of Object.entries(obj)) {
  //     if (Array.isArray(value)) {
  //       obj[key] = value.map(item => this.extractStringIdFromObject(item));
  //     }
  //     else if (value && typeof value === 'object' && value.hasOwnProperty('_id')) {
  //       obj[key] = value['_id'];
  //     }
  //   }
  //   return obj;
  // }

  updateUserEntities(entityToDelete) {
    this.isWaitingForResponse = true;
    const entities = this.createPayload(entityToDelete);

    const payload = {
      civility: this.originalEntityList.civility,
      first_name: this.originalEntityList.first_name,
      last_name: this.originalEntityList.last_name,
      email: this.originalEntityList.email,
      entities: entities,
    };
    this.subs.sink = this.userService.updateUser(this.userId, payload).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          Swal.fire({
            type: 'success',
            title: 'Bravo!',
            confirmButtonText: 'OK',
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then(() => {
            this.fetchTableData();
          });
        }
      },
      (error) => {
        this.isWaitingForResponse = false;
        this.swalError(error);
        return;
      },
    );
  }

  getRncpTitleList(data){
    const rncpList = [];
    for (var i = 0; i < data.length; i++) {
      rncpList.push(data[i].short_name)
    }
    return rncpList.toString();
  }

  swalError(err) {
    this.isWaitingForResponse = false;
    if (err['message'] === 'GraphQL error: user should transfer the responsibility first') {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('deleteUserType_1.TITLE'),
        text: this.translate.instant('deleteUserType_1.TEXT'),
        confirmButtonText: this.translate.instant('deleteUserType_1.BUTTON'),
        footer: `<span style="margin-left: auto">deleteUserType_1</span>`,
      });
    } else {
      Swal.fire({
        type: 'error',
        title: 'Error',
        text: err && err['message'] ? err['message'] : err,
        confirmButtonText: 'OK',
      });
    }
  }
}
