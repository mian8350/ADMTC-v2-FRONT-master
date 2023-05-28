import { SchoolService } from 'app/service/schools/school.service';
import { Component, ViewChild, OnInit, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { MatDialogRef, MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import * as _ from 'lodash';
import { UntypedFormControl } from '@angular/forms';
import * as moment from 'moment';
import { debounceTime, startWith, tap, map } from 'rxjs/operators';
import { SelectionModel } from '@angular/cdk/collections';
import { SendMailDialogComponent } from '../send-mail-dialog/send-mail-dialog.component';
import { MailToGroupDialogComponent } from '../mail-to-group-dialog/mail-to-group-dialog.component';
import { TranslateService } from '@ngx-translate/core';
import swal from 'sweetalert2';
import { UserService } from '../../service/user/user.service';
import { AuthService } from '../../service/auth-service/auth.service';
import { UrgentMessageDialogComponent } from 'app/urgent-message/urgent-message-dialog.component';
import { ReplyUrgentMessageDialogComponent } from '../reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { NgxPermissionsService } from 'ngx-permissions';
import { CertificationRulePopUpComponent } from 'app/title-rncp/conditions/certification-rule/certification-rule-pop-up/certification-rule-pop-up.component';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { CertificationRuleService } from 'app/service/certification-rule/certification-rule.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { PageTitleService } from 'app/core/page-title/page-title.service';

@Component({
  selector: 'ms-draft',
  templateUrl: '../mailbox/mailbox.component.html',
  styleUrls: ['../mailbox/mailbox.component.scss'],
})
export class DraftComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() isStudentUserCard: Boolean = false;
  @Input() studentId;
  @Input() userId;

  user_id: any;

  inbox = false;
  cc = false;
  important = false;
  draft = true;
  trash = false;
  sent = false;

  IsReplyBtn = false;
  IsReplyAllBtn = false;
  IsForwardBtn = false;
  IsDeleteBtn = false;
  IsImportantBtn = false;
  IsMovetoInboxBtn = false;
  hideResetButton = false;
  noData: any;

  isSearching = false;
  selectedMails = [];

  mailCategories;
  selection = new SelectionModel(true, []);
  dataSource = new MatTableDataSource([]);
  sendMailDialogComponent: MatDialogRef<SendMailDialogComponent>;
  urgentMessageDialogComponent: MatDialogRef<UrgentMessageDialogComponent>;
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  mailToGroupDialogComponent: MatDialogRef<MailToGroupDialogComponent>;
  certificationRuleDialogComponent: MatDialogRef<CertificationRulePopUpComponent>;
  selectedRncpTitleLongName: any;
  selectedRncpTitleName: any;
  configCertificatioRule: MatDialogConfig = {
    disableClose: true,
  };
  config: MatDialogConfig = {
    disableClose: true,
    width: '800px',
  };
  urgentMessageConfig: MatDialogConfig = {
    disableClose: true,
    width: '600px',
    panelClass: 'certification-rule-pop-up',
  };

  displayedColumns: string[] = ['select', 'created_at', 'from', 'to', 'subject'];
  filterColumns: string[] = ['selectFilter', 'createdAtFilter', 'fromFilter', 'toFilter', 'subjectFilter'];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  private subs = new SubSink();

  /*Searching and filter*/
  dateFilter = new UntypedFormControl('');
  subjectFilter = new UntypedFormControl('');
  fromFilter = new UntypedFormControl('');
  toFilter = new UntypedFormControl('');

  filteredValues = {
    date: '',
    from: '',
    to: '',
    subject: '',
  };

  dataLoaded = false;
  sortValue: any;
  isWaitingForResponse = false;
  dataCount: number;
  selectedMailCategory = 'draft';

  inboxCount = 0;
  ccCount = 0;
  importantCount = 0;
  mailsList = [];
  mailList = [];
  getCountOfCC = [];
  recpList = [];
  ccList = [];
  viewMessageData: any;
  draftData: any;
  mailSelected = [];
  checked = [];
  countSelected: boolean;

  senderId: string;
  senderName: string;
  senderEmail: string;

  recipientId: string;
  receipientName: string;
  receipientEmail: string;
  subject: string;
  message: string;
  messageDate: string;
  isReset = false;
  viewBcc = false;
  bccList = [];
  private timeOutVal: any;
  isADMTCDir = false;
  isADMTCAdmin = false;
  titleName: any;
  typeName: any;
  currentUser: any;
  isWaitRecipientGroup = false;

  constructor(
    private mailboxService: MailboxService,
    private userService: AuthService,
    public translate: TranslateService,
    public dialog: MatDialog,
    private permissions: NgxPermissionsService,
    private rncpTitlesService: RNCPTitlesService,
    private certificationRuleService: CertificationRuleService,
    public permissionService: PermissionService,
    private studentService: SchoolService,
    private pageTitleService: PageTitleService,
  ) {}

  ngOnInit() {
    if(!this.isStudentUserCard) {
      this.pageTitleService.setTitle('Draft');
    };
    this.currentUser = this.userService.getLocalStorageUser();
    this.isADMTCAdmin = !!this.permissions.getPermission('ADMTC Admin');
    this.isADMTCDir = !!this.permissions.getPermission('ADMTC Director');
    this.countSelected = false;
    this.sortValue = { latest_email: 'asc' };
    this.getDraftMail();
    this.initDraftMail();
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (!this.isReset) {
            this.getDraftMail();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
  }

  sortData(sort: Sort) {
    this.sortValue = sort.direction ? { [sort.active]: sort.direction } : null;
    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getDraftMail();
      }
    }
  }

  cleanFilterData() {
    const filterData = _.cloneDeep(this.filteredValues);
    let filterQuery = '';
    Object.keys(filterData).forEach((key) => {
      if (filterData[key]) {
        filterQuery = filterQuery + ` ${key}:"${filterData[key]}"`;
      }
    });
    return filterQuery;
  }
  ngOnChanges() {
    this.viewMessageData = null;
    this.paginator.pageIndex = 0;
    this.getDraftMail();
  }

  getDraftMail() {
    this.isWaitingForResponse = true;
    const type = this.selectedMailCategory;
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex,
    };
    const filter = this.cleanFilterData();
    if (this.studentId) {
      this.studentService.GetOneStudent(this.studentId).subscribe((resp) => {

        this.user_id = resp.user_id._id;
        this.getNonMainMail(pagination, this.sortValue, type, filter, this.user_id);
      });
    } else if (this.userId) {
      this.getNonMainMail(pagination, this.sortValue, type, filter, this.userId);
    } else {
      this.getNonMainMail(pagination, this.sortValue, type, filter);
    }
  }

  getNonMainMail(pagination, sortValue, type, filter, userId?) {
    const user = userId ? userId : null;
    this.subs.sink = this.mailboxService.getNonMainMail(pagination, sortValue, type, filter, user).subscribe((mailList: any[]) => {
      this.isReset = false;
      this.isWaitingForResponse = false;
      if (mailList && mailList.length) {
        this.draftData = mailList;
        this.dataSource.data = mailList;
        this.dataSource.sort = this.sort;
        this.mailList = mailList;
        this.paginator.length = mailList[0] ? mailList[0].count_document : 0;

        // refresh preview if preview already selected
        if (this.viewMessageData) {
          const foundMail = mailList.find((mail) => mail._id === this.viewMessageData._id);
          this.viewMessageData = foundMail ? foundMail : null;
        }
      } else {
        this.dataSource.data = [];
        this.paginator.length = 0;
        // refresh preview if preview already selected
        if (this.viewMessageData) {
          this.viewMessageData = null;
        }
      }
      this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
    });
  }

  sendMailToGroup() {
    this.mailToGroupDialogComponent = this.dialog.open(MailToGroupDialogComponent, this.config);
  }

  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.dataSource.data.forEach((row) => this.selection.select(row));
  }
  checkboxLabel(row?): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data ? this.dataSource.data.length : null;
    const data = this.selection.selected;
    this.mailSelected = [];
    data.forEach((mail) => {
      this.mailSelected.push(mail._id);
    });
    return numSelected === numRows;
  }

  initDraftMail() {
    this.subs.sink = this.dateFilter.valueChanges.subscribe((date) => {
      const newDate = moment(date).format('MM/DD/YYYY');
      this.filteredValues.date = date;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getDraftMail();
      }
    });

    this.subs.sink = this.fromFilter.valueChanges.pipe(debounceTime(400)).subscribe((value) => {
      const symbol = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      if (!value.match(symbol) && !value.match(symbol1)) {
        this.filteredValues.from = value ? value.toLowerCase() : '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getDraftMail();
        }
      } else {
        this.fromFilter.setValue('');
        this.filteredValues.from = '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getDraftMail();
        }
      }
    });

    this.subs.sink = this.toFilter.valueChanges.pipe(debounceTime(400)).subscribe((to) => {
      const symbol = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      if (!to.match(symbol) && !to.match(symbol1)) {
        this.filteredValues.to = to ? to.toLowerCase() : '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getDraftMail();
        }
      } else {
        this.toFilter.setValue('');
        this.filteredValues.to = '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getDraftMail();
        }
      }
    });

    this.subs.sink = this.subjectFilter.valueChanges.pipe(debounceTime(400)).subscribe((subject) => {
      const symbol = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      if (!subject.match(symbol) && !subject.match(symbol1)) {
        this.filteredValues.subject = subject ? subject.toLowerCase() : '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getDraftMail();
        }
      } else {
        this.subjectFilter.setValue('');
        this.filteredValues.subject = '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getDraftMail();
        }
      }
    });

    this.mailCategories = this.mailboxService.getMailCategories();
  }

  resetFilter() {
    this.isReset = true;
    this.filteredValues = {
      date: '',
      from: '',
      to: '',
      subject: '',
    };
    this.sort.direction = '';
    this.sort.active = '';
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.sortValue = this.sortValue = { latest_email: 'asc' };
    this.dataSource.data = [];
    this.paginator.pageIndex = 0;
    this.dateFilter.setValue('');
    this.subjectFilter.setValue('');
    this.fromFilter.setValue('');
    this.toFilter.setValue('');
    this.getDraftMail();
  }

  ngOnDestroy() {
    if(!this.isStudentUserCard) {
      this.pageTitleService.setTitle('');
    };
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
    this.dataSource.data = [];
  }

  changePage(event: any) {
    if (!this.isReset) {
      this.getDraftMail();
    }
  }

  onSelectMessage(data, index: number) {
    this.viewMessageData = data;
    if (data.user_type_selection && !data.is_group_parent) {
      this.getRecipientName(data);
      this.isWaitRecipientGroup = true;
    } else {
      this.isWaitRecipientGroup = false;
    }
    this.getCountOfCC = data.recipient_properties;
    this.recpList = [];
    this.ccList = [];
    this.draftData.forEach((mail) => {
      if (mail._id === this.viewMessageData._id) {
        if (data.is_group_parent) {
          this.OpenDraftGroupMail(mail);
        } else {
          this.OpenDraftPopUp(mail);
        }
      }
    });
    this.getCountOfCC.forEach((element, indexx) => {
      if (element.rank === 'a') {
        this.recpList.push(element);
      }
      if (element.rank === 'cc') {
        this.ccList.push(element);
      }
      if (element.rank === null) {
        this.viewMessageData.recipient_properties[0].rank = 'a';
        this.recpList.push(element);
      }
    });
    this.viewMessageData['$$index'] = index;
  }

  OpenDraftPopUp(MailData) {
    if (MailData._id) {
      this.config.data = {};
      this.sendMailDialogComponent = this.dialog.open(SendMailDialogComponent, this.config);
      this.sendMailDialogComponent.componentInstance.isDraftMail = true;
      this.sendMailDialogComponent.componentInstance.DraftData = MailData;
      this.subs.sink = this.sendMailDialogComponent.afterClosed().subscribe((result) => {
        if (!this.isReset) {
          this.getDraftMail();
        }
        this.sendMailDialogComponent = null;
      });
    }
  }

  OpenDraftGroupMail(MailData) {
    if (MailData._id) {
      this.config.data = {};
      this.mailToGroupDialogComponent = this.dialog.open(MailToGroupDialogComponent, this.config);
      this.mailToGroupDialogComponent.componentInstance.isDraftMail = true;
      this.mailToGroupDialogComponent.componentInstance.DraftData = MailData;
      this.subs.sink = this.mailToGroupDialogComponent.afterClosed().subscribe((result) => {
        if (!this.isReset) {
          this.getDraftMail();
        }
        this.mailToGroupDialogComponent = null;
      });
    }
  }
  onPreviousMessage(data) {
    this.viewBcc = false;
    this.recpList = [];
    this.ccList = [];
    this.bccList = [];
    const currentIndex = this.viewMessageData['$$index'] - 1;
    this.viewMessageData = this.mailList[currentIndex];
    this.viewMessageData['$$index'] = currentIndex;

    this.getCountOfCC = this.mailList[currentIndex].recipient_properties;

    this.getCountOfCC.forEach((element, index) => {
      if (element.rank !== null && element.rank !== undefined) {
        if (element.rank === 'a') {
          this.recpList.push(element);
        }

        if (element.rank === 'cc') {
          this.ccList.push(element);
          element.recipients.forEach((mail) => {
            if (element.rank === 'cc' && mail.email === this.currentUser.email) {
              this.viewBcc = true;
            }
          });
        }

        if (this.viewBcc) {
          if (element.rank === 'c') {
            this.bccList.push(element);
          }
        }

        element.recipients.forEach((mail) => {
          if (element.rank === 'c' && mail.email === this.currentUser.email) {
            this.recpList.push(element);
          }
        });
      } else {
        data.recipient_properties[0].rank = 'a';
        this.recpList.push(data.recipient_properties[0]);
      }
    });
  }
  onNextMessage(data) {
    if (this.viewMessageData && this.viewMessageData['$$index'] + 1 < this.mailList.length) {
      this.viewBcc = false;
      this.recpList = [];
      this.ccList = [];
      this.bccList = [];
      const currentIndex = this.viewMessageData['$$index'] + 1;
      this.viewMessageData = this.mailList[currentIndex];
      this.viewMessageData['$$index'] = currentIndex;
      this.getCountOfCC = this.mailList[currentIndex].recipient_properties;

      this.getCountOfCC.forEach((element, index) => {
        if (element.rank !== null && element.rank !== undefined) {
          if (element.rank === 'a') {
            this.recpList.push(element);
          }

          if (element.rank === 'cc') {
            this.ccList.push(element);
            element.recipients.forEach((mail) => {
              if (element.rank === 'cc' && mail.email === this.currentUser.email) {
                this.viewBcc = true;
              }
            });
          }

          if (this.viewBcc) {
            if (element.rank === 'c') {
              this.bccList.push(element);
            }
          }

          element.recipients.forEach((mail) => {
            if (element.rank === 'c' && mail.email === this.currentUser.email) {
              this.recpList.push(element);
            }
          });
        } else {
          data.recipient_properties[0].rank = 'a';
          this.recpList.push(data.recipient_properties[0]);
        }
      });
    }
  }

  checkIsPreviousBtnShow() {
    const prevBtn = this.viewMessageData['$$index'] === 0 ? false : true;
    return prevBtn;
  }
  checkIsNextBtnShow() {
    return this.viewMessageData['$$index'] === this.mailList.length - 1 ? false : true;
  }

  OpenMailPopupRequest(data, tag) {
    this.config.data = {};
    this.sendMailDialogComponent = this.dialog.open(SendMailDialogComponent, this.config);
    this.sendMailDialogComponent.componentInstance.tags = [tag];
    this.sendMailDialogComponent.componentInstance.currentMailData = data;
    if (this.selectedMailCategory === 'sent') {
      this.sendMailDialogComponent.componentInstance.isSenderReq = false;
    }

    this.subs.sink = this.sendMailDialogComponent.afterClosed().subscribe((result) => {
      if (result === 'updateMailList') {
        if (!this.isReset) {
          this.getDraftMail();
        }
      }
      this.sendMailDialogComponent = null;
    });
  }

  getFileName(fileName: String): string {
    if (fileName) {
      return fileName.substring(fileName.lastIndexOf('/') + 1);
    }
    return '';
  }

  downloadFile(file) {

    const a = document.createElement('a');
    a.target = 'blank';
    a.href = file.path;
    a.download = file.file_name;
    a.click();
    a.remove();
  }

  public openDialog(data) {
    let timeDisabled = 5;
    let title = 'Are you sure?';
    let message = 'You are about to delete this message';
    if (this.translate.currentLang === 'fr') {
      title = 'tes-vous sr?';
      message = 'Vous allez supprimer ce message';
    }
    const sender_property = {
      mail_type: 'trash',
    };
    // const sender_property = {
    //   mail_type: 'trash',
    // };
    swal
      .fire({
        title: this.translate.instant('MailBox.MESSAGES.ATTENTION'),
        text: this.translate.instant('MailBox.MESSAGES.ASKMSG'),
        footer: `<span style="margin-left: auto">MailBox.MESSAGES.ATTENTION</span>`,
        type: 'warning',
        showCancelButton: true,
        allowEscapeKey: true,
        confirmButtonText: this.translate.instant('SWEET_ALERT.DELETE.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('SWEET_ALERT.DELETE.CANCEL'),
        onOpen: () => {
          swal.disableConfirmButton();
          const confirmBtnRef = swal.getConfirmButton();
          const time = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM') + ' in ' + timeDisabled + ' sec';
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM');
            swal.enableConfirmButton();
            clearInterval(time);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      })
      .then((result) => {
        clearTimeout(this.timeOutVal);
        if (result.value) {
          this.viewMessageData = [];
          const ids = [];
          ids.push(data._id);
          this.subs.sink = this.mailboxService.updateMultipleMailSender(ids, sender_property).subscribe((datas: any) => {
            swal.fire({
              type: 'info',
              title: this.translate.instant('MailBox.MESSAGES.DELMSG'),
              text: '',
              footer: `<span style="margin-left: auto">MailBox.MESSAGES.DELMSG</span>`,
              confirmButtonText: this.translate.instant('MailBox.MESSAGES.THANK'),
            });
            if (!this.isReset) {
              this.getDraftMail();
            }
          });
        }
      });
  }
  sendMail() {
    this.sendMailDialogComponent = this.dialog.open(SendMailDialogComponent, this.config);
    this.subs.sink = this.sendMailDialogComponent.afterClosed().subscribe((result) => {
      if (!this.isReset) {
        this.getDraftMail();
      }
      this.sendMailDialogComponent = null;
    });
  }

  // this function execute when we click to delete mail
  onDeleteMail() {
    let timeDisabled = 5;
    const sender_property = {
      mail_type: 'trash',
    };

    let title = 'Are you sure?';
    let message = 'You are about to delete this message';
    if (this.translate.currentLang === 'fr') {
      title = 'tes-vous sr?';
      message = 'Vous allez supprimer ce message';
    }

    swal
      .fire({
        title: this.translate.instant('MailBox.MESSAGES.ATTENTION'),
        text: this.translate.instant('MailBox.MESSAGES.ASKMSG'),
        footer: `<span style="margin-left: auto">MailBox.MESSAGES.ATTENTION</span>`,
        type: 'warning',
        showCancelButton: true,
        allowEscapeKey: true,
        confirmButtonText: this.translate.instant('SWEET_ALERT.DELETE.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('SWEET_ALERT.DELETE.CANCEL'),
        onOpen: () => {
          swal.disableConfirmButton();
          const confirmBtnRef = swal.getConfirmButton();
          const time = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM') + ' in ' + timeDisabled + ' sec';
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM');
            swal.enableConfirmButton();
            clearInterval(time);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      })
      .then((result) => {
        clearTimeout(this.timeOutVal);
        if (result.value) {
          this.viewMessageData = [];
          this.subs.sink = this.mailboxService.updateMultipleMailSender(this.mailSelected, sender_property).subscribe((data: any) => {
            swal.fire({
              type: 'success',
              title: this.translate.instant('MailBox.MESSAGES.DELMSG'),
              text: '',
              footer: `<span style="margin-left: auto">MailBox.MESSAGES.DELMSG</span>`,
              confirmButtonText: this.translate.instant('MailBox.MESSAGES.THANK'),
            });
            if (!this.isReset) {
              this.getDraftMail();
            }
          });
        }
      });
  }
  mailMoveTo(mail_type) {
    const recipient_properties = {
      mail_type: mail_type,
    };
    this.viewMessageData = [];
    this.subs.sink = this.mailboxService.updateMultipleMailRecipient(this.mailSelected, recipient_properties).subscribe((data: any) => {
      if (!this.isReset) {
        this.getDraftMail();
      }
    });
  }
  showOptions() {
    const numSelected = this.selection.selected.length;
    if (numSelected > 0) {
      this.countSelected = true;
    } else {
      this.countSelected = false;
    }
  }

  sendUrgentMessage() {
    this.urgentMessageDialogComponent = this.dialog.open(UrgentMessageDialogComponent, this.urgentMessageConfig);
  }
  receiveEmail() {
    if (!this.isReset) {
      this.getDraftMail();
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

  getCertificationRule() {
    const studentData = this.userService.getLocalStorageUser();
    const titleId = studentData.entities[0].assigned_rncp_title._id;
    const classId = studentData.entities[0].class._id;
    const studentId = studentData._id;
    this.subs.sink = this.rncpTitlesService.getRncpTitleById(titleId).subscribe((resp) => {
      this.selectedRncpTitleName = resp.short_name;
      this.selectedRncpTitleLongName = resp.long_name;
    });
    this.subs.sink = this.certificationRuleService
      .getCertificationRuleSentWithStudent(titleId, classId, studentId)
      .subscribe((dataRule: any) => {
        if (dataRule) {
          // this.showCertificationRule(titleId, classId);
        } else {
          // this.getUrgentMail();
        }
      });
  }

  showCertificationRule(selectedRncpTitleId, selectedClassId) {
    this.dialog
      .open(CertificationRulePopUpComponent, {
        panelClass: 'reply-message-pop-up',
        ...this.configCertificatioRule,
        data: {
          callFrom: 'global',
          titleId: selectedRncpTitleId,
          classId: selectedClassId,
          titleName: this.selectedRncpTitleName,
          titleLongName: this.selectedRncpTitleLongName,
        },
      })
      .afterClosed()
      .subscribe((result) => {
        // this.getUrgentMail();
      });
  }
  getMessage(data) {
    if (data) {
      data = data.replaceAll('<table>', '<table class="notif-table full-width" border="1">');
      if (data && data.includes('<a')) {
        if (data && !data.includes('target')) {
          data = data.replaceAll('<a', '<a target="blank"');
        }
      }
      return data;
    } else {
      return '';
    }
  }

  getRecipientName(data) {
    if (data.group_detail.rncp_titles && data.group_detail.rncp_titles.length) {
      this.subs.sink = this.mailboxService.getOneTitle(data.group_detail.rncp_titles[0]._id).subscribe((resp) => {
        if (resp) {
          this.titleName = resp.short_name;
        }
      });
    }
    if (data.group_detail.user_types && data.group_detail.user_types.length) {
      this.subs.sink = this.mailboxService.getOneUserTypes(data.group_detail.user_types[0]._id).subscribe((respp) => {
        if (respp) {
          this.typeName = respp.name;
        }
      });
    }
    this.isWaitRecipientGroup = false;
  }

  momentlang(event) {
    const data = new Date(event);
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return data.toLocaleDateString('fr-ca', options);
  }

  showActionSubMenuMailbox(submenu, buttonName) {
    return this.permissionService.showActionSubMenuMailboxPerm(submenu, buttonName)
  }
}
