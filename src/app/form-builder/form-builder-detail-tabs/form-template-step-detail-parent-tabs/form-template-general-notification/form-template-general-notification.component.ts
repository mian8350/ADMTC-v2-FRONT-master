import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { GeneralNotificationTableComponent } from './general-notification-table/general-notification-table.component';
import { GeneralNotificationDetailsComponent } from './general-notification-details/general-notification-details.component';

@Component({
  selector: 'ms-form-template-general-notification',
  templateUrl: './form-template-general-notification.component.html',
  styleUrls: ['./form-template-general-notification.component.scss']
})
export class FormTemplateGeneralNotificationComponent implements OnInit {
  @Input() templateId;
  @Input() templateType;  
  @Input() isPublished;
  @ViewChild('notifTable', { static: false }) notifMessage: GeneralNotificationTableComponent;
  @ViewChild('notifDetail', { static: false }) notifDetail: GeneralNotificationDetailsComponent;  
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

  }

  getShowDetailNotifOrMessage(value) {

    if (value) {
      this.showDetailsNotif = value.notification;
      this.showDetailsMessage = value.message;
      this.refDataSelected = value.data;
    }
  }

  onSave() {
    this.saveNotifDetail();
  }

  saveNotifDetail() {
    if (!this.notifDetail.formDetails.valid) {
      this.notifDetail.checkFormValidity();
    }
    this.notifDetail.saveNotifData();
  }

  onUpdateTab($event) {
    if (this.isPreviewNotif) {
      this.previewNotification()
    }else{
      this.showDetailsMessage = false;
      this.showDetailsNotif = false;      
    }
  }

  leave() {
    this.checkIfAnyChildrenFormInvalid('leave');
  }

  checkIfAnyChildrenFormInvalid(data?) {
    if (!this.formBuilderService.childrenFormValidationStatus) {
      this.fireUnsavedDataWarningSwal(data);
    } else if (data === 'leave') {
        this.router.navigate(['form-builder']);
    } else if (data === 'notif') {
      this.createNotification()
    }
  }

  fireUnsavedDataWarningSwal(data?) {
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
          if (data === 'leave') {
            this.router.navigate(['form-builder']);
            return;
          } else if (data === 'notif') {
            this.createNotification();
            return;
          }


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
    if(this.notifDetail) {
      if((this.showDetailsNotif && !this.notifDetail.formDetails.valid && !this.notifDetail.isSaveNotifDetail) ||
          this.showDetailsNotif && this.notifDetail.formDetails.valid && !this.notifDetail.isSaveNotifDetail){
        this.checkIfAnyChildrenFormInvalid('notif');
        return;
      } else {

      }
    }
   this.createNotification();
  }  

  createNotification() {
    this.isWaitingForResponse = true;
    // from general notification pass stepId Null and is_for_general
    const payload = {
      type: 'notification',
      form_builder_id: this.templateId ? this.templateId : null,
      step_id: null,
      is_for_general: true
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
    this.preview();
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
    // stepId Null for general notification
    const generalNotification = {
      stepID: null,      
    }
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
            generalNotification.stepID,
            this.templateId,
            true,
            this.translate.currentLang,
            this.notifDetail.formDetails.get('_id').value,
            true
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
}
