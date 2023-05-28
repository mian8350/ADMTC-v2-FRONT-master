import { Component, OnInit, Input, OnDestroy, OnChanges } from '@angular/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../service/auth-service/auth.service';
import { UserProfileData } from '../../../users/user.model';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { SubSink } from 'subsink';
import { ApplicationUrls } from 'app/shared/settings';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'ms-title-card-dashboard',
  templateUrl: './title-card-dashboard.component.html',
  styleUrls: ['./title-card-dashboard.component.scss'],
})
export class TitleCardDashboardComponent implements OnInit, OnDestroy, OnChanges {
  @Input() filteredTitles: any[] = [];

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  schoolId;
  myInnerHeight = 600;
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  private subs = new SubSink();
  constructor(
    private rncpTitleService: RNCPTitlesService,
    private router: Router,
    private route: ActivatedRoute,
    public dialog: MatDialog,
    private mailboxService: MailboxService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    if (this.route.snapshot.queryParamMap.get('schoolId')) {
      this.schoolId = this.route.snapshot.queryParamMap.get('schoolId');
    }
    // this.getUrgentMail();
  }

  ngOnChanges() {

    if (this.route.snapshot.queryParamMap.get('schoolId')) {
      this.schoolId = this.route.snapshot.queryParamMap.get('schoolId');
    }
  }

  goToRncpTitle(data: any) {
    if (this.schoolId) {
      window.open(`/rncpTitles/${data?._id}/dashboard?schoolId=${this.schoolId}`, '_blank');
    } else {
      window.open(`/rncpTitles/${data?._id}/dashboard`, '_blank');
    }
  }

  // *************** To Get Height window screen and put in style css height
  getAutomaticHeight() {
    this.myInnerHeight = window.innerHeight - 266;
    return this.myInnerHeight;
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

  imgUrl(src: string) {
    return (src ? this.sanitizer.bypassSecurityTrustUrl(this.serverimgPath + src) : '');
  }

  getFontSize(titleShortName: string) {
    return 26;
    // let fontSize = 24;
    // if (titleShortName.length >= 15) {
    //   fontSize = 22;
    // }
    // if (titleShortName.length >= 17) {
    //   fontSize = 20;
    // }
    // if (titleShortName.length >= 18) {
    //   fontSize = 18;
    // }
    // if (titleShortName.length >= 20) {
    //   fontSize = 15;
    // }
    // if (titleShortName.length >= 26) {
    //   fontSize = 13;
    // }
    // return fontSize;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
