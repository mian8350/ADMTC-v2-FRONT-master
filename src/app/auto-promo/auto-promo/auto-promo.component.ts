import { Component, OnInit, ChangeDetectorRef, ViewChild, ElementRef, OnDestroy, AfterViewInit } from '@angular/core';
import Swal from 'sweetalert2';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { SwalPartialTargets } from '@sweetalert2/ngx-sweetalert2';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormControl } from '@angular/forms';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PromoService } from '../../service/promo/promo.service';
import { CoreService } from 'app/service/core/core.service';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { SubSink } from 'subsink';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import * as _ from 'lodash';
import { AddPromoDialogComponent } from '../add-promo-dialog/add-promo-dialog.component';
import { UtilityService } from 'app/service/utility/utility.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { PermissionService } from 'app/service/permission/permission.service';

@Component({
  selector: 'ms-auto-promo',
  templateUrl: './auto-promo.component.html',
  styleUrls: ['./auto-promo.component.scss'],
})
export class AutoPromoComponent implements OnInit, OnDestroy, AfterViewInit {
  private subs = new SubSink();
  translatePipe: TranslatePipe;
  promoForm: UntypedFormGroup;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  displayedColumns: string[] = [
    'ref',
    'title',
    'sub_title',
    'description',
    'for_login_page',
    'for_set_password_page',
    'for_forgot_password_page',
    'action',
  ];
  filterColumns: string[] = [
    'refFilter',
    'titleFilter',
    'sub_titleFilter',
    'descriptionFilter',
    'for_login_pageFilter',
    'for_first_timeFilter',
    'for_ecole_pageFilter',
    'actionFilter',
  ];
  isLoading = false;
  dataSource = new MatTableDataSource([]);
  noData: any;
  dataLoaded = false;
  isReset = false;
  sortValue = null;

  refFilter = new UntypedFormControl();
  titleFilter = new UntypedFormControl();
  sub_titleFilter = new UntypedFormControl();
  for_login_pageFilter = new UntypedFormControl();
  for_login_pageFilterList = [
    {
      id: '',
      name: 'All',
    },
    {
      id: true,
      name: 'Active',
    },
    {
      id: false,
      name: 'Non Active',
    },
  ];
  for_first_timeFilter = new UntypedFormControl();
  for_first_timeFilterList = [
    {
      id: '',
      name: 'All',
    },
    {
      id: true,
      name: 'Active',
    },
    {
      id: false,
      name: 'Non Active',
    },
  ];
  for_ecole_pageFilter = new UntypedFormControl();
  for_ecole_pageFilterList = [
    {
      id: '',
      name: 'All',
    },
    {
      id: true,
      name: 'Active',
    },
    {
      id: false,
      name: 'Non Active',
    },
  ];
  idForDeletion;
  private timeOutVal: any;
  promoDialogComponent: MatDialogRef<AddPromoDialogComponent>;
  config: MatDialogConfig = {
    disableClose: true,
    width: '650px',
    panelClass: 'certification-rule-pop-up',
  };

  filteredValues = {
    ref: '',
    title: '',
    sub_title: '',
    for_login_page: '',
    for_set_password_page: '',
    for_forgot_password_page: '',
  };
  isEditable = true;
  createAble = true;
  dataCount = 0;

  operation = 'Save';
  currentUser: any;
  isWaitingForResponse = false;
  selectedIndex = null;

  constructor(
    private translate: TranslateService,
    private _ref: ChangeDetectorRef,
    public readonly swalTargets: SwalPartialTargets,
    private fb: UntypedFormBuilder,
    private promoService: PromoService,
    public coreService: CoreService,
    private pageTitleService: PageTitleService,
    public dialog: MatDialog,
    public utilService: UtilityService,
    private permissions: NgxPermissionsService,
    public permissionService: PermissionService,
  ) {}

  ngOnInit() {
    this.pageTitleService.setTitle('Promo');
    this.initPromosi();
    this.getPromosiData();
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (!this.isReset) {
            this.getPromosiData();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
  }

  cleanFilterData() {
    const filterData = _.cloneDeep(this.filteredValues);
    let filterQuery = '';
    Object.keys(filterData).forEach((key) => {
      if (
        (key === 'for_login_page' && filterData[key]) ||
        (key === 'for_set_password_page' && filterData[key]) ||
        (key === 'for_forgot_password_page' && filterData[key])
      ) {
        filterQuery = filterQuery + ` ${key}:${filterData[key]}`;
      } else if (filterData[key]) {
        filterQuery = filterQuery + ` ${key}:"${filterData[key]}"`;
      }
    });
    return 'filter: {' + filterQuery + '}';
  }

  sortData(sort: Sort) {
    this.sortValue = sort.direction ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getPromosiData();
      }
    }
  }

  getPromosiData() {
    this.isWaitingForResponse = true;
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    const filter = this.cleanFilterData();
    this.subs.sink = this.promoService.getAllPromosi(pagination, this.sortValue, filter).subscribe((promosiList) => {
      this.isWaitingForResponse = false;
      if (promosiList && promosiList.length) {
        this.dataSource.data = promosiList;
        this.paginator.length = promosiList[0].count_document;
        this.dataCount = promosiList[0].count_document;
      } else {
        this.dataSource.data = [];
        this.paginator.length = 0;
        this.dataCount = 0;
      }
      this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
      this.isReset = false;
    });
  }

  initPromosi() {
    this.subs.sink = this.refFilter.valueChanges.pipe(debounceTime(400)).subscribe((statusSearch) => {
      const symbol = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      if (!statusSearch.match(symbol) && !statusSearch.match(symbol1)) {
        this.filteredValues.ref = statusSearch ? statusSearch.toLowerCase() : '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getPromosiData();
        }
      } else {
        this.refFilter.setValue('');
        this.filteredValues.ref = '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getPromosiData();
        }
      }
    });
    this.subs.sink = this.titleFilter.valueChanges.pipe(debounceTime(400)).subscribe((statusSearch) => {
      const symbol = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      if (!statusSearch.match(symbol) && !statusSearch.match(symbol1)) {
        this.filteredValues.title = statusSearch ? statusSearch.toLowerCase() : '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getPromosiData();
        }
      } else {
        this.titleFilter.setValue('');
        this.filteredValues.title = '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getPromosiData();
        }
      }
    });
    this.subs.sink = this.sub_titleFilter.valueChanges.pipe(debounceTime(400)).subscribe((statusSearch) => {
      const symbol = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      if (!statusSearch.match(symbol) && !statusSearch.match(symbol1)) {
        this.filteredValues.sub_title = statusSearch ? statusSearch.toLowerCase() : '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getPromosiData();
        }
      } else {
        this.sub_titleFilter.setValue('');
        this.filteredValues.sub_title = '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getPromosiData();
        }
      }
    });
  }

  resetAllFilter() {
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });

    this.refFilter.setValue('');
    this.titleFilter.setValue('');
    this.sub_titleFilter.setValue('');
    this.for_login_pageFilter.setValue('');
    this.for_first_timeFilter.setValue('');
    this.for_ecole_pageFilter.setValue('');

    this.filteredValues = {
      ref: '',
      title: '',
      sub_title: '',
      for_login_page: '',
      for_set_password_page: '',
      for_forgot_password_page: '',
    };

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    this.getPromosiData();
  }

  removePromo(data) {
    let timeDisabled = 5;
    Swal.fire({
      title: 'Attention',
      html: this.translate.instant('promosi.Are you sure you want to delete this item?'),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      allowOutsideClick: false,
      confirmButtonText: this.translate.instant('SWEET_ALERT.DELETE.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('SWEET_ALERT.DELETE.CANCEL'),
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM') + ' in ' + timeDisabled + ' sec';
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
        // clearTimeout(this.timeOutVal);
      },
    }).then((res) => {
      if (res.value) {
        this.subs.sink = this.promoService.deletePromo(data._id).subscribe((resp) => {
          Swal.fire({
            type: 'success',
            title: 'Bravo !',
            confirmButtonText: this.translate.instant('TUTORIAL_SZ.BUTTON'),
          });
          this.getPromosiData();
        });
      }
    });
  }

  promoDialog(data) {
    if (!data) {
      this.subs.sink = this.dialog
        .open(AddPromoDialogComponent, this.config)
        .afterClosed()
        .subscribe((resp) => {
          this.getPromosiData();
        });
    } else {
      this.subs.sink = this.dialog
        .open(AddPromoDialogComponent, {
          disableClose: true,
          width: '650px',
          data: data,
          panelClass: 'certification-rule-pop-up',
        })
        .afterClosed()
        .subscribe((resp) => {
          this.getPromosiData();
        });
    }
  }

  setLogin(value) {
    if (value === '') {
      this.filteredValues['for_login_page'] = '';
    } else {
      this.filteredValues['for_login_page'] = value;
    }
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getPromosiData();
    }
  }

  setPass(value) {
    if (value === '') {
      this.filteredValues['for_set_password_page'] = '';
    } else {
      this.filteredValues['for_set_password_page'] = value;
    }
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getPromosiData();
    }
  }

  setForgotPass(value) {
    if (value === '') {
      this.filteredValues['for_forgot_password_page'] = '';
    } else {
      this.filteredValues['for_forgot_password_page'] = value;
    }
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getPromosiData();
    }
  }
  ngOnDestroy() {
    this.pageTitleService.setTitle('');
    this.subs.unsubscribe();
  }
}
