import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { ApplicationUrls } from 'app/shared/settings';
import { environment } from 'environments/environment';
import { SubSink } from 'subsink';
import { FormFillingRevisionDialogComponent } from '../form-filling-revision-dialog/form-filling-revision-dialog.component';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { FormFillingService } from '../form-filling.service';
import { ActivatedRoute, Router } from '@angular/router';
import { StepDynamicMessageDialogComponent } from 'app/shared/components/step-dynamic-message-dialog/step-dynamic-message-dialog.component';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';

@Component({
  selector: 'ms-form-fill-condition-acceptance',
  templateUrl: './form-fill-condition-acceptance.component.html',
  styleUrls: ['./form-fill-condition-acceptance.component.scss'],
})
export class FormFillConditionAcceptanceComponent implements OnInit, OnDestroy {
  _stepData;
  @Input() currentStepIndex;
  @Input() formDetail: any;
  @Input() userData;
  @Input() formData: any;
  isValidator: boolean;
  isRevisionUser: any;
  isWaitingForResponse = false;
  myInnerHeight: number;
  isUsingStepMessage: boolean = false;
  hasValidatorValidated: boolean = false;
  signature = false;
  isAccepted = false;
  messageDialogRef: MatDialogRef<StepDynamicMessageDialogComponent>;
  @Input() set stepData(value: any) {
    if (value) {
      this._stepData = value;
      if (this._stepData.segments[0] && this._stepData.segments[0].acceptance_pdf) {
        this.setPreviewUrl(this._stepData.segments[0].acceptance_pdf);
      }
    }
  }
  @Output() triggerRefresh: EventEmitter<any> = new EventEmitter();

  timeOutVal: any;
  private subs: SubSink = new SubSink();

  get stepData() {
    return this._stepData;
  }

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  rawUrl: string;
  documentOnPreviewUrl: any;
  userHasDownloaded = false;
  _subs = new SubSink();
  formId: any;

  canAcceptCondition = false;

  constructor(
    private formFillingService: FormFillingService,
    private formBuilderService: FormBuilderService,
    private sanitizer: DomSanitizer,
    private dialog: MatDialog,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {

    this.formId = this.route.snapshot.queryParamMap.get('formId');
    this.checkStepNotificationOrMessage();
    if (this.userData && !this.formDetail.isPreview) {
      this.checkEntities();
    }

    this.canAcceptCondition = this.stepData?.segments[0]?.is_download_mandatory;
    this.hasValidatorValidated = this.formDetail?.currentFinalValidatorValidate;
    this.checkFormAccept();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  setPreviewUrl(url) {
    this.rawUrl = url;
    const result = this.serverimgPath + url + '#view=fitH';
    this.documentOnPreviewUrl = this.cleanUrlFormat(result);
  }

  cleanUrlFormat(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  checkEntities() {
    this.isValidator = !!this.userData.entities.find((ent) => {
      if (
        ent &&
        ent.type &&
        this.stepData.is_validation_required &&
        this.stepData.validator &&
        ent.type._id === this.stepData.validator._id
      ) {
        return true;
      } else {
        return false;
      }
    });
    this.isRevisionUser = this.userData.entities.find((ent) => {
      if (ent && ent.type && this.stepData.revision_user_type && ent.type._id === this.stepData.revision_user_type) {
        return true;
      } else {
        return false;
      }
    });
  }

  onAskForRevision() {
    this._subs.sink = this.dialog
      .open(FormFillingRevisionDialogComponent, {
        disableClose: true,
        minWidth: '800px',
        panelClass: 'no-padding',
        data: {
          formData: this.formDetail,
          stepId: this.stepData.is_final_step && this.formData.is_final_validator_active ? null : this.stepData._id,
          existingMessages: this.stepData.revise_request_messages ? this.stepData.revise_request_messages : null,
          formBuilderStepId: this.stepData.form_builder_step._id,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.triggerRefresh.emit(this.formId);

        }
      });
  }

  onCompleteRevision() {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('UserForm_S5.TITLE'),
      text: this.translate.instant('UserForm_S5.TEXT'),
      confirmButtonText: this.translate.instant('UserForm_S5.CONFIRM'),
      cancelButtonText: this.translate.instant('UserForm_S5.CANCEL'),
      showCancelButton: true,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((resp) => {
      if (resp.value) {
        const stepID = this.stepData.form_builder_step._id;
        const formProcessID = this.formDetail.formId;
        const triggerCondition = 'waiting_for_validation';
        const isPreview = typeof this.formDetail.isPreview === 'boolean' ? this.formDetail.isPreview : false;
        this.subs.sink = this.formBuilderService.generateFormBuilderStepMessage(stepID, formProcessID, isPreview, triggerCondition).subscribe(
          (resp) => {
            if (resp) {
              this.isWaitingForResponse = false;
              this.acceptFormWithAcceptance(null, resp, triggerCondition);
            } else {
              this.isWaitingForResponse = false;
              this.acceptFormWithAcceptance();
            }
          },
          (error) => {
            this.isWaitingForResponse = false;
            console.error(error);
            this.acceptFormWithAcceptance()
          },
        );
      }
      else return;
    });
  }

  onDownload() {
    // window.open(fileUrl, '_blank');downloadDoc() {
    const a = document.createElement('a');
    a.target = 'blank';
    a.href = `${environment.apiUrl}/fileuploads/${this.rawUrl}?download=true`.replace('/graphql', '');
    a.download = this.rawUrl;
    // a.href = this.documentOnPreviewUrl;
    // a.download = fileUrl;
    a.click();
    a.remove();
    this.userHasDownloaded = true;
    this.canAcceptCondition = false;
  }

  checkStepNotificationOrMessage() {


    if (
      this.formDetail &&
      this.formDetail.templateId &&
      this.stepData &&
      this.stepData.form_builder_step &&
      typeof this.stepData._id === 'string' &&
      typeof this.formDetail.formId === 'string' &&
      typeof this.formDetail.templateId === 'string' &&
      typeof this.stepData.form_builder_step._id === 'string'
    ) {
      const formBuilderID = this.formDetail.templateId;
      const formBuilderStepID = this.stepData.form_builder_step._id;
      const pagination = { limit: 20, page: 0 };

      this.isWaitingForResponse = true;
      this.subs.sink = this.formBuilderService.getAllStepNotificationsAndMessages(formBuilderID, formBuilderStepID, pagination).subscribe(
        (response) => {
          this.isWaitingForResponse = false;
          if (response && response.length) {
            this.isUsingStepMessage = !!response.find((item) => item && item.type && item.type === 'message');
          } // default value of isUsingStepMessage is false so no need an else block
        },
        (error) => {
          this.isWaitingForResponse = false;
          console.error(error);
        },
      );
    }
  }

  nextStepMessage(condition, type: string) {
    const actions = {
      onSave: () => this.onSave(),
      onAccept: () => this.acceptFormWithAcceptance('accepted'),
      onReject: () => this.acceptFormWithAcceptance('rejected'),
    };
    if (
      this.isUsingStepMessage &&
      this.formDetail &&
      this.formDetail.templateId &&
      this.stepData &&
      this.stepData.form_builder_step &&
      typeof this.stepData._id === 'string' &&
      typeof this.formDetail.formId === 'string' &&
      typeof this.formDetail.templateId === 'string' &&
      typeof this.stepData.form_builder_step._id === 'string'
    ) {
      const stepID = this.stepData.form_builder_step._id;
      const formProcessID = this.formDetail.formId;
      const triggerCondition = condition === 'waiting_for_validation' ? (this.stepData.is_validation_required ? condition : 'validated') : condition;
      const isPreview = typeof this.formDetail.isPreview === 'boolean' ? this.formDetail.isPreview : false;
      this.subs.sink = this.formBuilderService.generateFormBuilderStepMessage(stepID, formProcessID, isPreview, triggerCondition).subscribe(
        (resp) => {
          if (resp) {
            this.isWaitingForResponse = false;
            if (type === 'onSave') {
              this.onSave(resp, triggerCondition)
            } else if (type === 'onAccept') {
              this.acceptFormWithAcceptance('accepted', resp, triggerCondition)
            } else if (type === 'onReject') {
              this.acceptFormWithAcceptance('rejected', resp, triggerCondition)
            }
          } else {
            this.isWaitingForResponse = false;
            actions[type]();
          }
        },
        (error) => {
          this.isWaitingForResponse = false;
          actions[type]();
          console.error(error);
        },
      );
    } else {
      actions[type]();
    }
  }

  onSave(message?, condition?) {

    this.isWaitingForResponse = true;
    const payload = {
      _id: this.stepData._id,
    };
    this._subs.sink = this.formFillingService.createUpdateFormProcessStepAndQuestion(payload).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        if(message){
          this.subs.sink = this.dialog
          .open(StepDynamicMessageDialogComponent, {
            minWidth: '600px',
            minHeight: '100px',
            maxWidth: '75vw',
            maxHeight: '75vh',
            panelClass: 'certification-rule-pop-up',
            disableClose: true,
            data: {
              step_id: this.stepData.form_builder_step._id,
              form_process_id: this.formDetail.formId,
              is_preview: typeof this.formDetail.isPreview === 'boolean' ? this.formDetail.isPreview : false,
              dataPreview: null,
              triggerCondition: condition,
            },
          })
          .afterClosed()
          .subscribe((result) => {
            this.isWaitingForResponse = true;
            this.triggerRefresh.emit(this.formId);
          });
        } else{
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo!'),
            confirmButtonText: this.translate.instant('OK'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then((res) => {
            this.triggerRefresh.emit(this.formId);
          });
        }
      }
    });
  }

  validateForm() {
    let timeDisabled = 3;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('UserForm_S10.TITLE'),
      html: this.translate.instant('UserForm_S10.TEXT'),
      confirmButtonText: this.translate.instant('UserForm_S10.CONFIRM'),
      cancelButtonText: this.translate.instant('UserForm_S10.CANCEL'),
      showCancelButton: true,
      allowOutsideClick: false,
      allowEnterKey: false,
      allowEscapeKey: true,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('UserForm_S10.CONFIRM') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('UserForm_S10.CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      if (res.value) {
        this.isWaitingForResponse = true;
        this.subs.sink = this.formFillingService.acceptFormProcessStep(this.formDetail.formId, this.stepData._id)
          .subscribe((res) => {
            if (res) {
              this.isWaitingForResponse = false;
              Swal.fire({
                type: 'success',
                title: this.translate.instant('Bravo!'),
                confirmButtonText: this.translate.instant('OK'),
                allowEnterKey: false,
                allowEscapeKey: false,
                allowOutsideClick: false,
              }).then((res) => {
                this.triggerRefresh.emit(this.formDetail.formId);
              });
            }
          });
      } else {
        return;
      }
    });
  }

  submitForm() {
    this.isWaitingForResponse = true;
    this.formFillingService.acceptStudentAdmissionSummary(this.formDetail.formId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        if (
          this.formDetail &&
          this.formDetail.final_validators &&
          this.formDetail.final_validators.length &&
          this.formDetail.is_final_validator_active
        ) {
          // with validator
          Swal.fire({
            type: 'success',
            title: this.translate.instant('UserForm_S7.TITLE'),
            text: this.translate.instant('UserForm_S7.TEXT'),
            confirmButtonText: this.translate.instant('UserForm_S7.CONFIRM'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then(() => {
            // this.triggerRefresh.emit(this.formDetail.formId);
            this.router.navigate(['/']);
          });
        } else {
          // without validator
          Swal.fire({
            type: 'success',
            title: this.translate.instant('UserForm_S8.TITLE'),
            text: this.translate.instant('UserForm_S8.TEXT'),
            confirmButtonText: this.translate.instant('UserForm_S8.CONFIRM'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then(() => {
            // this.triggerRefresh.emit(this.formDetail.formId);
            this.router.navigate(['/']);
          });
        }
      }
    });
  }

  checkFormAccept() {
    if (this.formDetail && this.formDetail.admission_status === 'submitted') {
      this.isAccepted = true;
    } else if (this.formDetail && this.formDetail.admission_status === 'signing_process') {
      this.isAccepted = true;
    }
  }

  acceptFormWithAcceptance(acceptance: 'accepted' | 'rejected' = null, message?, condition?) {

    this.isWaitingForResponse = true;
    this.formFillingService.acceptFormProcessStep(this.formId, this.stepData._id, acceptance).subscribe(
      (resp) => {
        if (resp) {
          this.isWaitingForResponse = false;
          if(message){
            this.subs.sink = this.dialog
            .open(StepDynamicMessageDialogComponent, {
              minWidth: '600px',
              minHeight: '100px',
              maxWidth: '75vw',
              maxHeight: '75vh',
              panelClass: 'certification-rule-pop-up',
              disableClose: true,
              data: {
                step_id: this.stepData.form_builder_step._id,
                form_process_id: this.formDetail.formId,
                is_preview: typeof this.formDetail.isPreview === 'boolean' ? this.formDetail.isPreview : false,
                dataPreview: null,
                triggerCondition: condition,
              },
            })
            .afterClosed()
            .subscribe((result) => {
              this.isWaitingForResponse = true;
              this.triggerRefresh.emit(this.formId);
            });
          } else{
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo!'),
              confirmButtonText: this.translate.instant('OK'),
              allowEnterKey: false,
              allowEscapeKey: false,
              allowOutsideClick: false,
            }).then((res) => {
              this.triggerRefresh.emit(this.formId);
            });
          }
        }
      },
      (error) => {
        this.isWaitingForResponse = false;
        console.error(error);
        throw error;
      },
    );
  }

  getAutomaticHeight() {
    this.myInnerHeight = window.innerHeight - 500;
    return this.myInnerHeight;
  }
}
