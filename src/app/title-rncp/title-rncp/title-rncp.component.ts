import { Component, OnDestroy, OnInit } from '@angular/core';
import { SubSink } from 'subsink';
import { UntypedFormControl } from '@angular/forms';
import { RNCPTitlesService } from '../../service/rncpTitles/rncp-titles.service';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { startWith, debounceTime } from 'rxjs/operators';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { GlobalErrorService } from '../../service/global-error-service/global-error-service.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { PermissionService } from 'app/service/permission/permission.service';

@Component({
  selector: 'ms-title-rncp',
  templateUrl: './title-rncp.component.html',
  styleUrls: ['./title-rncp.component.scss'],
})
export class TitleRNCPComponent implements OnInit, OnDestroy {
  rncpTitles: any[] = [];
  filteredTitles: any[] = [];
  listOfCertifier = [];
  selectedCertifier = '';
  tabIndex = 0;
  isWaitingForResponse = GlobalErrorService.isWatingForResponse;
  private subs = new SubSink();
  searchForm = new UntypedFormControl('');
  private timeOutVal: any;
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;

  constructor(
    private rncpTitleService: RNCPTitlesService,
    private router: Router,
    public translate: TranslateService,
    private pageTitleService: PageTitleService,
    private globalErrorService: GlobalErrorService,
    private utilService: UtilityService,
    public dialog: MatDialog,
    private mailboxService: MailboxService,
    public permissionService: PermissionService,
  ) {

    this.subs.sink = this.globalErrorService.globalErrorData$.subscribe(
      (isError) => {

        if (isError) {


          this.isWaitingForResponse = GlobalErrorService.isWatingForResponse;

          this.globalErrorService.setGlobalError(false);
          this.isWaitingForResponse = GlobalErrorService.isWatingForResponse;


        }
      },
      (error1) => {},
      () => {
        this.isWaitingForResponse = GlobalErrorService.isWatingForResponse;
      },
    );
  }

  ngOnInit() {
    this.setPageTitle();
    this.pageTitleService.setTitle('RNCP Title Management');
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.getRncpTitlesDetails().subscribe((titles: any[]) => {
      this.isWaitingForResponse = false;
      this.rncpTitles = titles;
      this.filteredTitles = titles;
      this.rncpTitles = _.orderBy(this.rncpTitles, ['short_name'], ['asc']);
      this.filteredTitles = _.orderBy(this.filteredTitles, ['short_name'], ['asc']);
      this.rncpTitles = this.rncpTitles.sort((a, b) => {
        return a.short_name.toLowerCase().localeCompare(b.short_name.toLowerCase());
      });
      this.filteredTitles = this.filteredTitles.sort((a, b) => {
        return a.short_name.toLowerCase().localeCompare(b.short_name.toLowerCase());
      });
      this.rncpTitles.forEach((title) => {
        if (title.certifier) {
          this.listOfCertifier.push(title.certifier.short_name);
        }
      });
      this.listOfCertifier = [...new Set(this.listOfCertifier)];
      this.listOfCertifier = this.listOfCertifier.sort((a, b) => {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      });
    });

    this.filterRncpTitle();
    // this.getUrgentMail();
  }

  setPageTitle() {
    // this.pageTitleService.setTitle('NAV.TITLE_MANAGEMENT');
    // add .svg icon inside src/assets/icons then register it in app.module
    // this.pageTitleService.setIcon('certificate');
  }

  resetSearch() {
    this.tabIndex = 0;
    this.searchForm.setValue('');
    this.filteredTitles = this.rncpTitles;
    this.selectedCertifier = 'all';
  }

  filterRncpTitle() {
    this.subs.sink = this.searchForm.valueChanges.pipe(startWith('')).subscribe((searchString: string) => {
      if (this.tabIndex !== 0) {
        this.tabIndex = 0;
      }
      this.timeOutVal = setTimeout(() => {
        this.filteredTitles = this.rncpTitles.filter((title) => {
          if (title.short_name || title.long_name) {
            return (
              this.utilService
                .simpleDiacriticSensitiveRegex(title.short_name)
                .toLowerCase()
                .indexOf(this.utilService.simpleDiacriticSensitiveRegex(searchString).toLowerCase().trim()) !== -1 ||
              this.utilService
                .simpleDiacriticSensitiveRegex(title.long_name)
                .toLowerCase()
                .indexOf(this.utilService.simpleDiacriticSensitiveRegex(searchString).toLowerCase().trim()) !== -1
            );
          } else {
            return false;
          }
        });
      }, 500);
      // clearTimeout(this.timeOutVal);
    });
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
    this.pageTitleService.setTitle('');
    this.pageTitleService.setIcon('');
  }

  // Filter title by certifier
  filterTitleByCertifier(certifier: string, index: number) {
    if (index) {
      this.tabIndex = index;
    }
    if (certifier === 'all' || certifier === '' || certifier === 'All' || certifier === 'Tous') {
      this.filteredTitles = this.rncpTitles;
    } else {
      this.filteredTitles = this.rncpTitles.filter((title) => {
        const certi = title.certifier ? title.certifier.short_name === certifier : '';
        return certi;
      });
    }
  }

  createNewTitle() {
    this.router.navigate([`/title-rncp/create`]);
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
}
