import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
// import { StepMessageProcessDialogComponent } from 'app/form-builder/step-message-process/step-message-process.component';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { MessagesDetailsComponent } from './messages-details/messages-details.component';
import { NotificationDetailsComponent } from './notification-details/notification-details.component';
import { NotificationMessageTableComponent } from './notification-message-table/notification-message-table.component';
import * as _ from 'lodash';
import { StepDynamicMessageDialogComponent } from 'app/shared/components/step-dynamic-message-dialog/step-dynamic-message-dialog.component';

@Component({
  selector: 'ms-step-notification-messages-tab',
  templateUrl: './step-notification-messages-tab.component.html',
  styleUrls: ['./step-notification-messages-tab.component.scss'],
})
export class StepNotificationMessagesTabComponent implements OnInit, OnDestroy {
  @Input() templateId;
  @Input() templateType;
  @Input() stepId;
  @Input() isPublished;
  @ViewChild('notifTable', { static: false }) notifMessage: NotificationMessageTableComponent;
  @ViewChild('notifDetail', { static: false }) notifDetail: NotificationDetailsComponent;
  @ViewChild('messageDetail', { static: false }) messageDetail: MessagesDetailsComponent;
  private subs = new SubSink();
  showDetailsNotif = false;
  showDetailsMessage = false;
  refDataSelected: any;
  isWaitingForResponse = false;
  stepType: any;
  stepData: any;
  isPreviewNotif = false

  constructor(
    private router: Router,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private formBuilderService: FormBuilderService,
    private translate: TranslateService,
  ) { }

  ngOnInit() {


    this.getStepData();
  }

  getStepData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.formBuilderService.getOneFormBuilderStepType(this.stepId).subscribe(
      (response) => {
        this.isWaitingForResponse = false;
        if (response) {
          const step = _.cloneDeep(response);
          this.stepType = step.step_type;
          this.stepData = step;
        }
      },
      (err) => (this.isWaitingForResponse = false),
    );
  }

  getShowDetailNotifOrMessage(value) {

    if (value) {
      this.showDetailsNotif = value.notification;
      this.showDetailsMessage = value.message;
      this.refDataSelected = value.data;
    }
  }

  onSave() {
    if (this.showDetailsNotif && !this.showDetailsMessage) {
      this.saveNotifDetail();
    } else if (!this.showDetailsNotif && this.showDetailsMessage) {
      this.saveMessageDetail();
    } else {
      return;
    }
  }

  saveNotifDetail() {
    if (!this.notifDetail.formDetails.valid) {
      this.notifDetail.checkFormValidity();
    }
    this.notifDetail.saveNotifData();
  }
  saveMessageDetail() {
    if (!this.messageDetail.messageForm.valid) {
      this.messageDetail.checkFormValidity();
    }
    this.messageDetail.saveMessageData();
  }

  onUpdateTab($event) {
    if (this.isPreviewNotif) {
      this.previewNotification()
    }else{
      this.showDetailsMessage = false;
      this.showDetailsNotif = false;
      this.notifMessage.reloadTable();
    }
  }

  leave() {
    this.checkIfAnyChildrenFormInvalid('leave');
  }

  checkIfAnyChildrenFormInvalid(source?: 'message' | 'notif' | 'leave') {
    if (!this.formBuilderService.childrenFormValidationStatus) {
      this.fireUnsavedDataWarningSwal(source);
    } else if (source === 'leave') {
      this.router.navigate(['form-builder']);
    } else if (source === 'notif') {
      this.createNotification();
    } else if (source === 'message') {
      this.createMessage();
    }
  }

  fireUnsavedDataWarningSwal(source?: string) {
    if (!this.isPublished || this.templateType === 'employability_survey') {
      return Swal.fire({
        type: 'warning',
        title: this.translate.instant('TMTC_S01.TITLE'),
        text: this.translate.instant('TMTC_S01.TEXT'),
        confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.value) {
          // I will save first          
          return;
        } else {
          // discard changes
          this.formBuilderService.childrenFormValidationStatus = true;

          if (source === 'leave') {
            this.router.navigate(['form-builder']);
            return;
          }

          source === 'notif' ? this.addNotification() : this.addMessage();
          return;
        }
      });
    } else {
      // discard changes
      this.formBuilderService.childrenFormValidationStatus = true;
      this.router.navigate(['form-builder']);
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  addNotification() {
    if (this.notifDetail) {
      if (
        !this.formBuilderService.childrenFormValidationStatus &&
        ((this.showDetailsNotif && !this.notifDetail.formDetails.valid && !this.notifDetail.isSaveNotifDetail) ||
          (this.showDetailsNotif && this.notifDetail.formDetails.valid && !this.notifDetail.isSaveNotifDetail))
      ) {
        this.checkIfAnyChildrenFormInvalid('notif');
        return;
      }
    }
    this.createNotification();
  }

  createNotification() {
    this.isWaitingForResponse = true;
    const payload = {
      type: 'notification',
      form_builder_id: this.templateId ? this.templateId : null,
      step_id: this.stepId ? this.stepId : null,
    };

    this.subs.sink = this.formBuilderService.createStepNotificationAndMessage(payload).subscribe(
      (resp) => {
        if (resp) {
          this.isWaitingForResponse = false;

          this.notifMessage.reloadTable();
          this.showDetailsNotif = true;
          this.showDetailsMessage = false;
          this.refDataSelected = resp;
        }
      },
      (error) => {
        this.isWaitingForResponse = false;

        this.hasNotification(error);
      },
    );
  }

  addMessage() {
    if (this.messageDetail) {
      if (
        !this.formBuilderService.childrenFormValidationStatus &&
        ((this.showDetailsMessage && !this.messageDetail.messageForm.valid && !this.messageDetail.isSaveMessage) ||
          (this.showDetailsMessage && this.messageDetail.messageForm.valid && !this.messageDetail.isSaveMessage))
      ) {
        this.checkIfAnyChildrenFormInvalid('message');
        return;
      }
    }
    this.createMessage();
  }

  createMessage() {
    this.isWaitingForResponse = true;
    const payload = {
      type: 'message',
      form_builder_id: this.templateId ? this.templateId : null,
      step_id: this.stepId ? this.stepId : null,
    };

    this.subs.sink = this.formBuilderService.createStepNotificationAndMessage(payload).subscribe(
      (resp) => {
        if (resp) {
          this.isWaitingForResponse = false;

          this.notifMessage.reloadTable();
          this.showDetailsNotif = false;
          this.showDetailsMessage = true;
          this.refDataSelected = resp;
        }
      },
      (error) => {
        this.isWaitingForResponse = false;

        this.hasMessage(error);
      },
    );
  }

  hasNotification(err) {

    if (err['message'] === 'GraphQL error: Step Notification already exist') {
      Swal.fire({
        type: 'info',
        title: this.translate.instant('Sorry'),
        text: this.translate.instant('The notification for this step has been created, user can only add 1 notification for 1 step'),
        confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
      });
    }
  }

  hasMessage(err) {

    if (err['message'] === 'GraphQL error: Step Message already exist') {
      Swal.fire({
        type: 'info',
        title: this.translate.instant('Sorry'),
        text: this.translate.instant('The message for this step has been created, user can only add 1 message for 1 step'),
        confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
      });
    }
  }

  onPreview() {
    this.showDetailsNotif ? this.preview() : this.previewMessage()
  }

  preview() {
    this.isPreviewNotif = false
    if (this.isPublished && this.templateType !== 'employability_survey') {
      this.previewNotification()
    } else {
      if (this.showDetailsNotif && !this.showDetailsMessage) {
        this.isPreviewNotif = true
        this.saveNotifDetail();
      }
    }
  }
  previewNotification() {
    this.isPreviewNotif = false
    Swal.fire({
      type: 'warning',
      allowEnterKey: false,
      allowEscapeKey: false,
      showCancelButton: true,
      allowOutsideClick: false,
      html: this.translate.instant('Notif_S7.TEXT', { templateName: this.refDataSelected.ref_id }),
      title: this.translate.instant('Notif_S7.TITLE'),
      cancelButtonText: this.translate.instant('Notif_S7.BUTTON2'),
      confirmButtonText: this.translate.instant('Notif_S7.BUTTON1'),
    }).then((confirm) => {

      if (confirm.value) {
        this.subs.sink = this.formBuilderService
          .SendPreviewStepNotification(
            this.stepId,
            this.templateId,
            true,
            this.translate.currentLang,
            this.notifDetail.formDetails.get('_id').value,
          )
          .subscribe(
            (resp) => {
              Swal.fire({
                type: 'success',
                title: 'Bravo!',
                confirmButtonText: 'OK',
                allowEnterKey: false,
                allowEscapeKey: false,
                allowOutsideClick: false,
              }).then(() => { });
            },
            (err) => {
              Swal.fire({
                type: 'error',
                title: 'Error',
                text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
                confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
              });
            },
          );
      }
    });
  }

  previewMessage() {
    this.subs.sink = this.dialog
      .open(StepDynamicMessageDialogComponent, {
        width: '600px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          step_id: this.stepId,
          is_preview: true,
          dataPreview: this.refDataSelected,
          triggerCondition:null
        },
      })
      .afterClosed()
      .subscribe((resp) => { });
  }
}
