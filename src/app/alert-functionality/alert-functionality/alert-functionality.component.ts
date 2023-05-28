import { PermissionService } from 'app/service/permission/permission.service';
import { AddNewAlertDialogComponent } from './add-new-alert-dialog/add-new-alert-dialog.component';
import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import { UntypedFormControl } from '@angular/forms';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { AlertService } from '../../service/alert-functionality/alert-functionality.service';
import * as moment from 'moment';
import { Observable, of } from 'rxjs';
import * as _ from 'lodash';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import { UserService } from '../../service/user/user.service';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { DuplicateAlertDialogComponent } from './duplicate-alert-dialog/duplicate-alert-dialog.component';
import { Router } from '@angular/router';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import Swal from 'sweetalert2';
import { AuthService } from 'app/service/auth-service/auth.service';
import { AlertUserResponseDialogComponent } from './alert-user-response-dialog/alert-user-response-dialog.component';
import { cloneDeep } from 'apollo-utilities';
import { PageTitleService } from 'app/core/page-title/page-title.service';

@Component({
  selector: 'ms-alert-functionality',
  templateUrl: './alert-functionality.component.html',
  styleUrls: ['./alert-functionality.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseLocalToUtcPipe],
})
export class AlertFunctionalityComponent implements OnInit, AfterViewInit, OnDestroy {
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  dataSource = new MatTableDataSource([]);
  noData: any;
  listUserType = [];
  originUserType = [];
  isWaitingForResponse = false;
  filteredRecipient: Observable<any[]>;
  displayedColumns: string[] = ['createdAt', 'name', 'recipient', 'published', 'requiredResponse', 'action'];
  filterColumns: string[] = [
    'createdAtFilter',
    'nameFilter',
    'recipientFilter',
    'publishedFilter',
    'requiredResponseFilter',
    'actionFilter',
  ];
  filteredValues = {
    publication_date: null,
    required_response: null,
    published: null,
    user_type: null,
    name: null,
  };
  sortValue = null;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private subs = new SubSink();

  // Form Control to get filter from table
  createdAtFilter = new UntypedFormControl('');
  usertypeFilter = new UntypedFormControl('');
  nameFilter = new UntypedFormControl('');
  recipientFilter = new UntypedFormControl('');
  publishedFilter = new UntypedFormControl('all');
  requiredResponseFilter = new UntypedFormControl('all');

  // Alert count used for BE Pagination
  alertCount;

  // CurrentUserLoggedin
  currentUser;

  constructor(
    private translate: TranslateService,
    private alertService: AlertService,
    private userService: UserService,
    public dialog: MatDialog,
    private mailboxService: MailboxService,
    private dateAdapter: DateAdapter<Date>,
    private router: Router,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private parseLocalToUTC: ParseLocalToUtcPipe,
    private authService: AuthService,
    private pageTitleService: PageTitleService,
    public permissionService: PermissionService
  ) {}

  ngOnInit() {
    this.pageTitleService.setTitle('List of alert');

    this.currentUser = this.authService.getCurrentUser();

    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });

    this.getAlertFunctionalitiesTable();
    this.initFilter();
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      if (
        this.recipientFilter.value &&
        this.listUserType &&
        this.originUserType &&
        this.listUserType.length &&
        this.originUserType.length
      ) {
        const foundUserType = _.find(this.listUserType, (type) => type.name_with_entity === this.recipientFilter.value);
        const found = foundUserType ? _.find(this.originUserType, (type) => type._id === foundUserType._id) : null;
        const currLang = found ? this.translate.instant('USER_TYPES_WITH_ENTITY.' + found.name_with_entity) : this.recipientFilter.value;
        this.recipientFilter.setValue(currLang);
      }
      this.getUserTypeFilterDropdown();
    });

    // this.dataSource.sort = this.sort;
    // this.dataSource.paginator = this.paginator;
    // this.dataSource.filter = JSON.stringify(this.filteredValues);

    // this.subs.sink = this.userService.getAllUserType().subscribe((userType) => {
    //   this.listUserType = userType.map((type) => {
    //     return type.name + ' / ' + type.entity;
    //   });

    // this.filteredRecipient = this.recipientFilter.valueChanges.pipe(
    //   startWith(''),
    //   map((value) => this._filterRecepient(value)),
    // );

    // this.resetSearch();
    // });

    // this.subs.sink = this.createdAtFilter.valueChanges.subscribe((date) => {
    //   const newDate = moment(date).format('YYYY-MM-DD');
    //   this.filteredValues['createdAt'] = newDate !== 'Invalid date' ? newDate : '';
    //   this.dataSource.filter = JSON.stringify(this.filteredValues);
    // });

    // this.subs.sink = this.nameFilter.valueChanges.subscribe((name) => {
    //   this.filteredValues.name = name;
    //   this.dataSource.filter = JSON.stringify(this.filteredValues);
    // });

    // this.subs.sink = this.publishedFilter.valueChanges.subscribe((published) => {
    //   this.filteredValues.published = published;
    //   this.dataSource.filter = JSON.stringify(this.filteredValues);
    // });

    // this.dataSource.filterPredicate = this.customFilterPredicate();
    // this.getUrgentMail();
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          this.getAlertFunctionalitiesTable();
        }),
      )
      .subscribe();
  }

  getAlertFunctionalitiesTable() {
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.isWaitingForResponse = true;

    const filter = _.cloneDeep(this.filteredValues);
    filter['offset'] = moment().utcOffset();

    this.subs.sink = this.alertService.GetAllAlertFunctionalities(pagination, filter, this.sortValue).subscribe((resp: any) => {

      if (resp && resp.length) {
        this.dataSource.data = resp;
        this.alertCount = resp[0].count_document;
      } else {
        this.dataSource.data = [];
        this.alertCount = 0;
      }
      this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
      this.getUserType();
      this.isWaitingForResponse = false;
    });
  }
  renderTooltipType(recipients) {
    let tooltip = '';
    let count = 0;
    // const type = _.uniqBy(recipients, 'name');
    if (recipients && recipients.length) {
      for (const entity of recipients) {
        count++;
        if (count > 1) {
          tooltip = tooltip + ', ';
          tooltip = tooltip + this.translate.instant('USER_TYPES.' + entity.name);
        } else {
          tooltip = tooltip + this.translate.instant('USER_TYPES.' + entity.name);
        }
      }
    }
    return tooltip;
  }

  getUserType() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.alertService.getAlertUserTypes().subscribe((userType) => {
      this.isWaitingForResponse = false;

      this.originUserType = cloneDeep(userType);
      this.getUserTypeFilterDropdown();
    });
  }
  getUserTypeFilterDropdown() {
    if (this.originUserType && this.originUserType.length) {
      this.listUserType = [];
      this.originUserType.forEach((item) => {
        const typeWithEntity = this.translate.instant('USER_TYPES_WITH_ENTITY.' + item.name_with_entity);
        this.listUserType.push({ _id: item._id, name_with_entity: typeWithEntity });
      });

      this.filteredRecipient = this.recipientFilter.valueChanges.pipe(
        startWith(''),
        map((searchTxt: string) =>
          searchTxt
            ? this.listUserType
                .filter((user) => user.name_with_entity.toLowerCase().includes(searchTxt.toLowerCase()))
                .sort((a: any, b: any) => (a.name_with_entity > b.name_with_entity ? 1 : a.name_with_entity < b.name_with_entity ? -1 : 0))
            : this.listUserType,
        ),
      );
    }
  }

  initFilter() {
    // Filter publication date
    this.subs.sink = this.createdAtFilter.valueChanges.pipe(debounceTime(500)).subscribe((input) => {
      this.paginator.pageIndex = 0;
      this.filteredValues.publication_date = input ? this.parseLocalToUTC.transformDate(moment(input).format('DD/MM/YYYY'), '15:59') : null;
      this.getAlertFunctionalitiesTable();
    });

    this.subs.sink = this.nameFilter.valueChanges.pipe(debounceTime(500)).subscribe((input) => {
      this.paginator.pageIndex = 0;
      this.filteredValues.name = input;
      this.getAlertFunctionalitiesTable();
    });

    this.subs.sink = this.publishedFilter.valueChanges.pipe().subscribe((input) => {
      this.paginator.pageIndex = 0;
      switch (input) {
        case 'all':
          this.filteredValues.published = null;
          break;
        case 'true':
          this.filteredValues.published = true;
          break;
        case 'false':
          this.filteredValues.published = false;
          break;
        default:
          break;
      }
      this.getAlertFunctionalitiesTable();
    });

    this.subs.sink = this.requiredResponseFilter.valueChanges.pipe().subscribe((input) => {
      this.paginator.pageIndex = 0;
      switch (input) {
        case 'all':
          this.filteredValues.required_response = null;
          break;
        case 'true':
          this.filteredValues.required_response = true;
          break;
        case 'false':
          this.filteredValues.required_response = false;
          break;
        default:
          break;
      }
      this.getAlertFunctionalitiesTable();
    });
  }
  setRecipientFilter(id) {
    this.filteredValues.user_type = id ? id : null;
    this.paginator.pageIndex = 0;
    this.getAlertFunctionalitiesTable();
  }

  resetSearch() {
    // this.isReset = true;
    this.paginator.pageIndex = 0;
    this.filteredValues = {
      publication_date: null,
      required_response: null,
      published: null,
      user_type: null,
      name: null,
    };

    this.sortValue = null;
    this.createdAtFilter.patchValue('', { emitEvent: false });
    this.usertypeFilter.patchValue('', { emitEvent: false });
    this.nameFilter.patchValue('', { emitEvent: false });
    this.recipientFilter.patchValue('', { emitEvent: false });
    this.publishedFilter.patchValue('all', { emitEvent: false });
    this.requiredResponseFilter.patchValue('all', { emitEvent: false });

    this.sortValue = null;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.getUserTypeFilterDropdown();
    this.getAlertFunctionalitiesTable();
  }

  filterRecepient(value: string) {
    const filterValue = value.toLowerCase();
    // Later on need to put selection of usertype to filteredValues
    // return this.listUserType.filter((option) => option.toLowerCase().includes(filterValue));
  }

  // customFilterPredicate() {
  //   return function (data, filter: string): boolean {
  //     const searchString = JSON.parse(filter);

  //     let newDate = moment(searchString.createdAt).format('YYYY-MM-DD');
  //     newDate = newDate !== 'Invalid date' ? newDate : '';

  //     const dateFound = data.createdAt.toString().trim().toLowerCase().indexOf(newDate) !== -1;

  //     const nameFound = data.name.toString().trim().toLowerCase().indexOf(searchString.name.toLowerCase()) !== -1;

  //     const recipientFound = data.creator.types.find(
  //       (type) => type.name && (type.name + ' / ' + type.entity).toLowerCase().indexOf(searchString.recipient.toLowerCase()) !== -1,
  //     );

  //     const publishedFound =
  //       searchString.published === 'all'
  //         ? true
  //         : data.published.toString().trim().toLowerCase().indexOf(searchString.published.toLowerCase()) !== -1;

  //     const requiredResponseFound =
  //       searchString.requiredResponse === 'all'
  //         ? true
  //         : data.requiredResponse.toString().trim().toLowerCase().indexOf(searchString.requiredResponse) !== -1;
  //     return dateFound && nameFound && recipientFound && publishedFound && requiredResponseFound;
  //   };
  // }

  // resetSearch() {
  //   this.filteredValues = {
  //     published: null,
  //     user_type: null,
  //     name: null,
  //   };
  //   this.dataSource.filter = JSON.stringify(this.filteredValues);
  //   this.nameFilter.setValue(null);
  //   this.publishedFilter.setValue(null);
  //   this.usertypeFilter.setValue(null);
  // }

  ngOnDestroy() {
    this.pageTitleService.setTitle('');
    this.subs.unsubscribe();
  }

  addNewAlert() {
    this.dialog
      .open(AddNewAlertDialogComponent, {
        disableClose: true,
        width: '830px',
        maxHeight: '620px',
        panelClass: 'certification-rule-pop-up',
        data: {
          type: 'create',
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.getAlertFunctionalitiesTable();
        }
      });
  }

  editAlert(data) {
    this.dialog
      .open(AddNewAlertDialogComponent, {
        disableClose: true,
        width: '830px',
        maxHeight: '620px',
        panelClass: 'certification-rule-pop-up',
        data: {
          type: 'edit',
          alertData: data,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.getAlertFunctionalitiesTable();
        }
      });
  }

  sortData(sort: Sort) {
    if (sort.active === 'createdAt') {
      this.sortValue = sort.direction ? { published_date: sort.direction } : null;
    } else if (sort.active === 'name') {
      this.sortValue = sort.direction ? { name: sort.direction } : null;
    } else if (sort.active === 'published') {
      this.sortValue = sort.direction ? { is_published: sort.direction } : null;
    } else if (sort.active === 'requiredResponse') {
      this.sortValue = sort.direction ? { required_response: sort.direction } : null;
    } else if(sort.active === 'recipients') {
      this.sortValue = sort.direction ? { recipients: sort.direction } : null;
    }
    this.paginator.pageIndex = 0;

    this.getAlertFunctionalitiesTable();
  }

  deleteAlert(template) {

    let timeLeftInSec = 6;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('ALERT_S5.TITLE'),
      html: this.translate.instant('ALERT_S5.HTML', { alertTitle: template && template.name ? template.name : '' }),
      allowOutsideClick: false,
      showCancelButton: true,
      footer: `<span style="margin-left: auto">ALERT_S5</span>`,
      cancelButtonText: this.translate.instant('ALERT_S5.BUTTON_2'),
      confirmButtonText: this.translate.instant('ALERT_S5.BUTTON_1', { timeLeft: `(${timeLeftInSec})` }),
      onBeforeOpen: () => {
        Swal.disableConfirmButton();
        const confirmButton = Swal.getConfirmButton();
        const timeInterval = setInterval(() => {
          timeLeftInSec--;
          confirmButton.innerText = this.translate.instant('ALERT_S5.BUTTON_1', { timeLeft: `(${timeLeftInSec})` });
        }, 1000);
        const timeout = setTimeout(() => {
          Swal.enableConfirmButton();
          confirmButton.innerText = this.translate.instant('ALERT_S5.BUTTON_1', { timeLeft: '' });
          clearInterval(timeInterval);
          clearTimeout(timeout);
        }, timeLeftInSec * 1000);
      },
    }).then((result) => {
      if (result.value) {
        this.isWaitingForResponse=true
        this.subs.sink = this.alertService.DeleteAlertFunctionality(template._id).subscribe((resp) => {

          this.isWaitingForResponse=false
          if (resp) {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('ALERT_S6.TITLE'),
              html: this.translate.instant('ALERT_S6.HTML', { alertTitle: template && template.name ? template.name : '' }),
              confirmButtonText: this.translate.instant('ALERT_S6.BUTTON'),
              footer: `<span style="margin-left: auto">ALERT_S6</span>`,
            }).then(() => this.getAlertFunctionalitiesTable());
          }
        });
      }
    });
  }
  // renderTooltipRecipient(entities) {
  //   let tooltip = '';
  //   const type = _.uniqBy(entities, 'name');
  //   for (const entity of type) {
  //     if (entity) {
  //       tooltip = tooltip + this.translate.instant(entity.name) + `, `;
  //     }
  //   }
  //   return tooltip;
  // }
  duplicate(alert) {

    this.dialog
      .open(AddNewAlertDialogComponent, {
        disableClose: true,
        width: '830px',
        maxHeight: '620px',
        panelClass: 'certification-rule-pop-up',
        data: {
          type: 'duplicate',
          alertData: alert,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.getAlertFunctionalitiesTable();
        }
      });
  }
  duplicateMessage(template) {

    this.subs.sink = this.dialog
      .open(DuplicateAlertDialogComponent, {
        width: '400px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: template,
      })
      .afterClosed()
      .subscribe((resp) => {

        if (resp) {
          this.router.navigate(['alert-functionality', 'form', resp._id]);
        }
      });
  }

  userResponses(template) {

    this.subs.sink = this.dialog
      .open(AlertUserResponseDialogComponent, {
        width: '500px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: template,
      })
      .afterClosed()
      .subscribe((resp) => {

        if (resp) {
          this.router.navigate(['alert-functionality', 'form', resp._id]);
        }
      });
  }

  translateDate(dateData) {
    if (dateData && dateData.date && dateData.time) {
      const date = this.parseUTCToLocalPipe.transformDate(dateData.date, dateData.time);
      const datee = date !== 'Invalid date' ? moment(date, 'DD/MM/YYYY').format('DD/MM/YYYY') : '';
      return date !== '' ? moment(datee, 'DD/MM/YYYY').format('DD/MM/YYYY') : '';
    } else {
      return '';
    }
  }
}
