import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import {Subject} from 'rxjs';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-questionnaire-global',
  templateUrl: './questionnaire-global.component.html',
  styleUrls: ['./questionnaire-global.component.scss'],
})
export class QuestionnaireGlobalComponent implements OnInit, OnDestroy {
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  eventsSubject: Subject<void> = new Subject<void>();
  private subs = new SubSink();

  constructor(
    public dialog: MatDialog,
    private mailboxService: MailboxService,
    private router: Router,
    private pageTitleService: PageTitleService,
  ) {}

  ngOnInit() {
    this.pageTitleService.setTitle('Questionnaire Tools');
    // this.getUrgentMail();
  }

  emitEventToChild() {
    this.eventsSubject.next();
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

  ngOnDestroy() {
    this.pageTitleService.setTitle('');
    this.subs.unsubscribe();
  }
  resetAllFilter() {
    this.emitEventToChild();
    // send flag reset to ms-questionnaire-tools component
  }

  addQuestionaireTemplate() {

    this.router.navigate(['questionnaire-tools', 'form']);
  }
}
