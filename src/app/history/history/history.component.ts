import { Component, ViewChild, OnInit, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { HistoryService } from '../../service/history/history.service';
import * as _ from 'lodash';
import { SubSink } from 'subsink';
import { UntypedFormControl } from '@angular/forms';
import { DatePipe } from '@angular/common';
import * as moment from 'moment';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { startWith, map, tap, debounceTime } from 'rxjs/operators';
import { ViewHistoryComponent } from '../view-history/view-history.component';
import { SendMailDialogComponent } from 'app/mailbox/send-mail-dialog/send-mail-dialog.component';
import { NotificationHistory } from 'app/models/notification-history.model';
import { SchoolService } from 'app/service/schools/school.service';
import { Observable } from 'rxjs';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { UtilityService } from 'app/service/utility/utility.service';

@Component({
  selector: 'ms-history',
  templateUrl: './history.component.html',
  styleUrls: ['./history.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class HistoryComponent implements OnInit, AfterViewInit, OnDestroy {
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  @Input() type: string;
  private subs = new SubSink();
  datePipe: DatePipe;
  dataSource = new MatTableDataSource([]);
  noData: any;
  displayedColumns: string[] = [
    'sentDate',
    'sentTime',
    'notificationReference',
    'notificationSubject',
    'title',
    'school',
    'from',
    'to',
    'subjectName',
    'testName',
    'action',
  ];
  filterColumns: string[] = [
    'dateFilter',
    'timeFilter',
    'notifRefFilter',
    'notifSubjectFilter',
    'titleFilter',
    'schoolFilter',
    'fromFilter',
    'toFilter',
    'subjectNameFilter',
    'testNameFilter',
    'actionFilter',
  ];

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  notifRefArray: any[] = [];
  filteredRefArray: Observable<any[]>;
  notifSubjectArray = [];
  titleArray: { _id: string; short_name: string }[] = [];
  filteredTitleArray: Observable<{ _id: string; short_name: string }[]>;
  schoolArray: { _id: string; short_name: string }[] = [];
  filteredSchoolArray: Observable<{ _id: string; short_name: string }[]>;
  testNameArray = [];

  dateFilter = new UntypedFormControl('');
  timeFilter = new UntypedFormControl('');
  fromDateFilter = new UntypedFormControl('');
  toDateFilter = new UntypedFormControl('');
  notifRefFilter = new UntypedFormControl('');
  notifSubjectFilter = new UntypedFormControl('');
  titleFilter = new UntypedFormControl('');
  schoolFilter = new UntypedFormControl('');
  fromFilter = new UntypedFormControl('');
  toFilter = new UntypedFormControl('');
  subjectNameFilter = new UntypedFormControl('');
  testNameFilter = new UntypedFormControl('');

  filteredValues = {
    sent_date: '',
    sent_time: '',
    from_date: '',
    to_date: '',
    notif_ref: '',
    notif_sub: '',
    rncp_id: '',
    school_id: '',
    from_user: '',
    to_user: '',
    subject_name: '',
    test_name: '',
  };
  sortValue = null;

  historyList: NotificationHistory[] = [];
  isReset = false;
  dataLoaded = false;
  isWaitingForResponse = false;
  historyCount: number;
  filterDateStatus = null

  public dialogRefViewHistory: MatDialogRef<ViewHistoryComponent>;
  public sendMailDialogComponent: MatDialogRef<SendMailDialogComponent>;
  config: MatDialogConfig = { disableClose: true, width: '800px' };

  constructor(
    private historyService: HistoryService,
    private datepipe: DatePipe,
    private translate: TranslateService,
    public permissionService: PermissionService,
    private dialog: MatDialog,
    private schoolService: SchoolService,
    private rncpTitleService: RNCPTitlesService,
    private mailboxService: MailboxService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private dateAdapter: DateAdapter<Date>,
    private utilService: UtilityService,
  ) {}

  ngOnInit() {
    this.sortValue = null;
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
      const notifRefFilterValue = this.notifRefFilter.value;
      const titleFilterValue = this.titleFilter.value;
      const schoolFilterValue = this.schoolFilter.value;

      if(notifRefFilterValue === 'All' || notifRefFilterValue === 'Tous') {
        this.notifRefFilter.setValue(this.translate.instant('AllM'));
      }
      if(titleFilterValue === 'All' || titleFilterValue === 'Tous') {
        this.titleFilter.setValue(this.translate.instant('AllM'));
      }
      if(schoolFilterValue === 'All' || schoolFilterValue === 'Tous') {
        this.schoolFilter.setValue(this.translate.instant('AllM'));
      }
    });
    this.getNotificationhistories();
    this.initFilter();
    this.getTitleDropdownData();
    this.getSchoolDropdownData();
    this.getNotifRefDropdownData();
    // this.getUrgentMail();
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (!this.isReset) {
            this.getNotificationhistories();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
  }

  sortData(sort: Sort) {
    // dynamically set key property of sort object
    this.sortValue = sort.direction ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getNotificationhistories();
      }
    }
  }

  getToUserTooltip(users: any[]) {
    let tooltipText = '';
    if (users && users.length) {
      users.forEach((user, index) => {
        if (user) {
          tooltipText =
            tooltipText +
            `
          ${user.last_name ? user.last_name.toUpperCase() : ''}
          ${user.first_name}
          ${user.civility ? this.translate.instant(user.civility) : ''}`;
          tooltipText = index < users.length - 1 ? tooltipText + ',' : tooltipText + '';
        }
      });
    }
    return tooltipText;
  }

  getNotificationhistories() {
    this.isWaitingForResponse = true;
    let date_thirty_day;
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };

    if (this.type === 'latest') {
      date_thirty_day = 'lower_than_thirty_day';
    } else if (this.type === 'archived') {
      date_thirty_day = 'more_than_thirty_day';
    }

    const filter = this.cleanFilterData();
    this.subs.sink = this.historyService.getNotificationHistories(pagination, this.sortValue, filter, date_thirty_day).subscribe(
      (HistoryList) => {
        this.isWaitingForResponse = false;
        this.historyList = HistoryList;
        this.dataSource.data = HistoryList;
        this.historyCount = HistoryList && HistoryList.length ? HistoryList[0].count_document : 0;
        this.noData = this.dataSource.connect().pipe(map((data) => !data || (data && data.length === 0)));
        // set isReset back to false after 400 milisecond so the subscription that has debounceTime not triggered
        setTimeout(() => (this.isReset = false), 400);
        this.isWaitingForResponse = false;
      },
      (e) => (this.isWaitingForResponse = false),
    );
  }

  cleanFilterData() {
    // this function is to convert object filteredValues to string for graphql filter
    // convert from object like this: {date: "", from_date: "", to_date: "", notif_ref: "", notif_sub: "", …}
    // to string like this: "from_user:admin, subject_name:testing"
    const filterData = _.cloneDeep(this.filteredValues);
    let filterQuery = '';
    Object.keys(filterData).forEach((key) => {
      // only add key that has value to the query. so it wont send filter with empty string
      if (filterData[key]) {
        filterQuery = filterQuery + ` ${key}:"${filterData[key]}"`;
      }

    });

    return filterQuery;
  }

  initFilter() {
    this.subs.sink = this.dateFilter.valueChanges.subscribe((date) => {
      this.filterDateStatus = null
      this.fromDateFilter.setValue(null, { emitEvent: false })
      this.toDateFilter.setValue(null, { emitEvent: false })
      if (date) {
        const dateString = moment(date).format('DD/MM/YYYY');
        this.filteredValues.sent_date = this.parseLocalToUTCPipe.transformDateTime(dateString, '00:00');
      }
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getNotificationhistories();
      }
    });
    this.subs.sink = this.timeFilter.valueChanges.subscribe((date) => {
      this.filteredValues.sent_time = date ? this.parseLocalToUTCPipe.transform(date) : '';
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getNotificationhistories();
      }
    });
    this.subs.sink = this.fromDateFilter.valueChanges.subscribe((date) => {
      this.filterDateStatus = null
      if (date) {
        const dateString = moment(date).format('DD/MM/YYYY');
        this.filteredValues.from_date = this.parseLocalToUTCPipe.transformDateTime(dateString, '00:00');
      }
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getNotificationhistories();
      }
    });
    this.subs.sink = this.toDateFilter.valueChanges.subscribe((date) => {
      this.filterDateStatus = null
      if (date) {
        const dateString = moment(date).format('DD/MM/YYYY');
        this.filteredValues.to_date = this.parseLocalToUTCPipe.transformDateTime(dateString, '00:00');
      }
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getNotificationhistories();
      }
    });
    // this.subs.sink = this.notifRefFilter.valueChanges.subscribe((notifRef) => {
    //   this.filteredValues.notif_ref = notifRef;
    //   this.paginator.pageIndex = 0;
    //   if (!this.isReset) {
    //     this.getNotificationhistories();
    //   }
    // });
    this.subs.sink = this.notifSubjectFilter.valueChanges.pipe(debounceTime(400)).subscribe((notifSubj) => {
      this.filteredValues.notif_sub = notifSubj;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getNotificationhistories();
      }
    });
    this.subs.sink = this.fromFilter.valueChanges.pipe(debounceTime(400)).subscribe((from) => {
      this.filteredValues.from_user = from;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getNotificationhistories();
      }
    });
    this.subs.sink = this.toFilter.valueChanges.pipe(debounceTime(400)).subscribe((to) => {
      this.filteredValues.to_user = to;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getNotificationhistories();
      }
    });
    this.subs.sink = this.subjectNameFilter.valueChanges.pipe(debounceTime(400)).subscribe((subj) => {
      this.filteredValues.subject_name = subj;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getNotificationhistories();
      }
    });
    this.subs.sink = this.testNameFilter.valueChanges.pipe(debounceTime(400)).subscribe((test) => {
      this.filteredValues.test_name = test;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getNotificationhistories();
      }
    });
  }

  filterSchool(schoolId: string) {
    this.filteredValues.school_id = schoolId;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getNotificationhistories();
    }
  }

  filterTitle(titleId: string) {
    this.filteredValues.rncp_id = titleId;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getNotificationhistories();
    }
  }

  filterNotifArray(resp: any) {
    this.filteredValues.notif_ref = resp;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getNotificationhistories();
    }
  }

  getTitleDropdownData() {
    this.subs.sink = this.rncpTitleService.getRncpTitleListData().subscribe((resp) => {
      this.titleArray = resp;
      this.filteredTitleArray = this.titleFilter.valueChanges.pipe(
        startWith(''),
        map((searchTxt: string) =>
          this.titleArray.filter((ttl) => {
            if (searchTxt) {
              return ttl.short_name.toLowerCase().includes(searchTxt.toLowerCase());
            }
            return true;
          }),
        ),
      );
    });
  }

  getSchoolDropdownData() {
    this.subs.sink = this.schoolService.getSchoolShortNames().subscribe((resp) => {
      this.schoolArray = resp;
      this.filteredSchoolArray = this.schoolFilter.valueChanges.pipe(
        startWith(''),
        map((searchTxt: string) =>
          this.schoolArray.filter((sch) => {
            if (searchTxt) {
              return sch.short_name.toLowerCase().includes(searchTxt.toLowerCase());
            }
            return true;
          }),
        ),
      );
    });
  }

  getNotifRefDropdownData() {
    this.subs.sink = this.historyService.GetNotificationReferences().subscribe((resp) => {
      this.notifRefArray = resp;
      this.notifRefArray = this.notifRefArray.sort((notifRefA, notifRefB) => {
        if (this.utilService.simplifyRegex(notifRefA) < this.utilService.simplifyRegex(notifRefB)) {
          return -1;
        } else if (this.utilService.simplifyRegex(notifRefA) > this.utilService.simplifyRegex(notifRefB)) {
          return 1;
        } else {
          return 0;
        }
      });
      this.filteredRefArray = this.notifRefFilter.valueChanges.pipe(
        startWith(''),
        map((searchTxt: string) =>
          this.notifRefArray.filter((resNotifArray) => {
            if (searchTxt) {
              return resNotifArray.toLowerCase().includes(searchTxt.toLowerCase());
            }
            return true;
          }),
        ),
      );
    });
  }

  translateDate(dateRaw) {
    if (dateRaw && dateRaw.date_utc && dateRaw.time_utc) {
      const date = this.parseUTCToLocalPipe.transformDate(dateRaw.date_utc, dateRaw.time_utc);
      const datee = date !== 'Invalid date' ? moment(date, 'DD/MM/YYYY').format('DD/MM/YYYY') : '';
      return date !== '' ? moment(datee, 'DD/MM/YYYY').format('DD/MM/YYYY') : '';
    } else {
      return '';
    }
  }

  translateTime(timeRaw) {
    const time = this.parseUTCToLocalPipe.transform(timeRaw.time_utc)
      ? this.parseUTCToLocalPipe.transform(timeRaw.time_utc)
      : this.parseUTCToLocalPipe.transform('15:59');
    return time;
  }

  resetAllFilter() {
    this.resetFilterObject();
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.sortValue = null;
    this.dateFilter.setValue('');
    this.timeFilter.setValue('');
    this.fromDateFilter.setValue('');
    this.toDateFilter.setValue('');
    this.notifRefFilter.setValue('');
    this.notifSubjectFilter.setValue('');
    this.titleFilter.setValue('');
    this.schoolFilter.setValue('');
    this.fromFilter.setValue('');
    this.toFilter.setValue('');
    this.subjectNameFilter.setValue('');
    this.testNameFilter.setValue('');
    this.filterDateStatus = null
    this.getNotificationhistories();
  }

  todayDetails() {
    this.resetFilterObject();
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.sortValue = null;
    this.dateFilter.setValue('');
    this.timeFilter.setValue('');
    this.fromDateFilter.setValue('');
    this.toDateFilter.setValue('');
    this.notifRefFilter.setValue('');
    this.notifSubjectFilter.setValue('');
    this.titleFilter.setValue('');
    this.schoolFilter.setValue('');
    this.fromFilter.setValue('');
    this.toFilter.setValue('');
    this.subjectNameFilter.setValue('');
    this.testNameFilter.setValue('');
    this.filterDateStatus = 'today'
    const from = moment()
    this.filteredValues.from_date = this.parseLocalToUTCPipe.transformDateTime(from.format('DD/MM/YYYY'), '00:00');
    this.filteredValues.to_date = null
    this.fromDateFilter.setValue(from.toDate(), { emitEvent: false });
    this.toDateFilter.setValue(null, { emitEvent: false });
    this.getNotificationhistories();
  }

  filterDateRange(dateRange) {
    this.resetFilterObject();
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.sortValue = null;
    this.dateFilter.setValue('');
    this.timeFilter.setValue('');
    this.fromDateFilter.setValue('');
    this.toDateFilter.setValue('');
    this.notifRefFilter.setValue('');
    this.notifSubjectFilter.setValue('');
    this.titleFilter.setValue('');
    this.schoolFilter.setValue('');
    this.fromFilter.setValue('');
    this.toFilter.setValue('');
    this.subjectNameFilter.setValue('');
    this.testNameFilter.setValue('');
    this.filterDateStatus = dateRange

    if (dateRange === 'yesterday') {
      const from = moment().subtract(1, 'days')
      const to = moment()
      this.filteredValues.from_date = this.parseLocalToUTCPipe.transformDateTime(from.format('DD/MM/YYYY'), '00:00');
      this.filteredValues.to_date = this.parseLocalToUTCPipe.transformDateTime(to.format('DD/MM/YYYY'), '00:00');
      this.fromDateFilter.setValue(from.toDate(), { emitEvent: false });
      this.toDateFilter.setValue(to.toDate(), { emitEvent: false });
    } else if (dateRange === 'lastWeek') {
      const from = moment().subtract(7, 'days')
      const to = moment()
      this.filteredValues.from_date = this.parseLocalToUTCPipe.transformDateTime(from.format('DD/MM/YYYY'), '00:00');
      this.filteredValues.to_date = this.parseLocalToUTCPipe.transformDateTime(to.format('DD/MM/YYYY'), '00:00');
      this.fromDateFilter.setValue(from.toDate(), { emitEvent: false });
      this.toDateFilter.setValue(to.toDate(), { emitEvent: false });
    } else if (dateRange === 'lastMonth') {
      const from = moment().subtract(1, 'months')
      const to = moment()
      this.filteredValues.from_date = this.parseLocalToUTCPipe.transformDateTime(from.format('DD/MM/YYYY'), '00:00');
      this.filteredValues.to_date = this.parseLocalToUTCPipe.transformDateTime(to.format('DD/MM/YYYY'), '00:00');
      this.fromDateFilter.setValue(from.toDate(), { emitEvent: false });
      this.toDateFilter.setValue(to.toDate(), { emitEvent: false });
    }

    this.getNotificationhistories();
  }

  resetFilterObject() {
    this.filteredValues = {
      sent_date: '',
      sent_time: '',
      from_date: '',
      to_date: '',
      notif_ref: '',
      notif_sub: '',
      rncp_id: '',
      school_id: '',
      from_user: '',
      to_user: '',
      subject_name: '',
      test_name: '',
    };
  }

  viewHistory(data) {
    this.dialog
      .open(ViewHistoryComponent, {
        disableClose: true,
        width: '768px',
        minHeight: '435px',
        panelClass: 'certification-rule-pop-up',
        data: {
          viewMessageData: data,
          allHistory: this.historyList,
        },
      })
      .afterClosed()
      .subscribe((result) => (this.dialogRefViewHistory = null));
  }

  sendForwardMessage(data) {

    // data.notificationMessage = data.notificationMessage.replace(new RegExp('<a ([^]+)>[^"]+a>', 'g'), '');
    // const convertToMailSchema = {
    //   sender_property: { sender: data && data.from ? data.from : null },
    //   is_urgent_mail: false,
    //   recipient_properties: [{ recipient: data.to }],
    //   attachments: [],
    //   subject: data.notificationSubject,
    //   created_at: '2020-09-09T07:55:00.057Z',
    //   message: data.notificationMessage
    // }

    // this.sendMailDialogComponent = this.dialog.open(SendMailDialogComponent, this.config);
    // this.sendMailDialogComponent.componentInstance.tags = ['foward-mail'];
    // this.sendMailDialogComponent.componentInstance.subjectName = data.notificationSubject;
    // this.sendMailDialogComponent.componentInstance.currentMailData = convertToMailSchema;
    // this.subs.sink = this.sendMailDialogComponent.afterClosed().subscribe((result) => this.sendMailDialogComponent = null);
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

  getTodayTime(time) {
    return this.parseLocalToUTCPipe.transform(time);
  }

  renderTooltipTitleOrSchool(entities: any[]): string {
    let tooltip = '';
    let count = 0;
    let cerData = _.cloneDeep(entities);
    for (const entity of cerData) {
      count++;
      if(entity) {
        if (count > 1) {
          tooltip = tooltip + ', ';
          tooltip = tooltip + `${entity.short_name}`;
        } else {
          tooltip = tooltip + `${entity.short_name}`;
        }
      }
    }
    return tooltip;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
