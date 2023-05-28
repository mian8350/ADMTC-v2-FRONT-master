import { FormFillingRevisionDialogComponent } from './../form-filling-revision-dialog/form-filling-revision-dialog.component';
import { FormFillingService } from 'app/form-filling/form-filling.service';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import * as _ from 'lodash';
import { ApplicationUrls } from 'app/shared/settings';
import { DomSanitizer } from '@angular/platform-browser';
import { SubSink } from 'subsink';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'app/service/auth-service/auth.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { environment } from 'environments/environment';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { StepDynamicMessageDialogComponent } from 'app/shared/components/step-dynamic-message-dialog/step-dynamic-message-dialog.component';
import { I } from '@angular/cdk/keycodes';

@Component({
  selector: 'ms-form-fill-contract-singing-process',
  templateUrl: './form-fill-contract-singing-process.component.html',
  styleUrls: ['./form-fill-contract-singing-process.component.scss'],
})
export class FormFillContractSingingProcessComponent implements OnInit, OnDestroy {
  @Input() formDetail: any;
  @Input() formData: any;
  @Input() isReceiver: any;
  @Input() userData: any;
  @Input() stepData: any;

  @Output() triggerRefresh: EventEmitter<any> = new EventEmitter();

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  myInnerHeight = 600;
  documentOnPreviewUrl: any;

  private subs = new SubSink();
  isWaitingForResponse = false;
  userId: any;
  currentUser: any;
  currentUserTypeId: any;
  timeOutVal: any;
  formId: any;
  isCheck = false;
  isValidator = false;
  enabledButton = false;
  isTeacherCheck = false;
  updateDocusignContractProcess = false;
  linkPdf = null;
  formUrl = ``;
  event = '';
  isRevisionUser: any;
  disable = true;
  isUsingStepMessage: boolean = false;
  messageDialogRef: MatDialogRef<StepDynamicMessageDialogComponent>;
  userTypeId;
  isAllowedToEditAfterSubmitStep: boolean;

  constructor(
    private sanitizer: DomSanitizer,
    public router: Router,
    private route: ActivatedRoute,
    private userService: AuthService,
    private translate: TranslateService,
    private dialog: MatDialog,
    private formFillingService: FormFillingService,
    private formBuilderService: FormBuilderService,
  ) { }

  ngOnInit() {
    this.checkStepNotificationOrMessage();




    this.formId = this.route.snapshot.queryParamMap.get('formId');
    this.userId = this.route.snapshot.queryParamMap.get('userId');
    this.userTypeId = this.route.snapshot.queryParamMap.get('userTypeId');
    this.event = this.route.snapshot.queryParamMap.get('event');

    if (!this.formDetail.isPreview) {
      this.checkDisableForm();
    }
    if (this.event && this.event === 'signing_complete') {
      this.isCheck = true;
      this.updateSign();
    }
    this.getUser();
    if (this.formDetail && this.formDetail.isPreview && this.formDetail.templateId) {
      this.getOneFormBuilder()
    } else {
      if (!this.event || this.event !== 'signing_complete') {
        if (this.stepData && this.stepData.form_builder_step && this.stepData.form_builder_step._id && this.stepData._id) {
          this.getTemplatePDF(this.stepData.form_builder_step._id);
        }
      }
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
  getOneFormBuilder() {
    this.isWaitingForResponse = true
    this.subs.sink = this.formFillingService.getOneFormBuilder(this.formDetail.templateId).subscribe(resp => {
      if (resp) {
        if (resp.steps && resp.steps.length) {
          const steps = _.cloneDeep(resp.steps)
          const find = steps.find(step => step.step_title === this.stepData.step_title)
          if (find) {
            this.getTemplatePDF(find._id)
          } else {
            this.isWaitingForResponse = false
          }
        } else {
          this.isWaitingForResponse = false
        }
      } else {
        this.isWaitingForResponse = false
      }
    }, err => {
      this.isWaitingForResponse = false
    })
  }
  isUser() {
    let isUser = false;
    if (this.stepData && this.stepData.contract_signatory_status && this.stepData.contract_signatory_status.length) {
      this.stepData.contract_signatory_status.forEach((element) => {
        if (element.user_id && element.user_id._id === this.userId) {
          isUser = true;
        }
      });
    }
    return isUser;
  }
  isStudent() {
    let isUser = false;
    if (
      this.stepData &&
      this.stepData.user_recipient_signatory &&
      this.stepData.user_recipient_signatory.user_id &&
      this.stepData.user_recipient_signatory.user_id._id === this.userId
    ) {
      isUser = true;
    }
    return isUser;
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

  getUser() {
    this.currentUser = this.userService.getLocalStorageUser();
    if (this.currentUser && this.currentUser.length) {
      const isPermission = this.userService.getPermission();
      const currentUserEntity = this.currentUser.entities.find((resp) => resp.type.name === isPermission[0]);
      this.currentUserTypeId = currentUserEntity.type._id;

    }
  }

  getContractProcess() {
    // this.formData = [];
    this.isWaitingForResponse = true;
    this.formFillingService.getOneFormProcessStep(this.stepData._id).subscribe((resp) => {
      if (resp) {

        if (resp.form_builder_step && resp.form_builder_step._id) {
          this.getTemplatePDF(resp.form_builder_step._id);
        }
      }
      this.isWaitingForResponse = false;
    });
  }

  getTemplatePDF(templateId) {
    this.isWaitingForResponse = true;
    const preview = this.formDetail && this.formDetail.isPreview ? true : false;
    this.formFillingService
      .generateFormBuilderContractTemplatePDF(templateId, preview, this.translate.currentLang, this.stepData._id)
      .subscribe(
        (resp) => {
          if (resp) {

            this.linkPdf = resp;
            this.setPreviewUrl(this.serverimgPath + resp);
          }
          this.isWaitingForResponse = false;
        },
        (err) => {
          this.isWaitingForResponse = false;
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          });
        },
      );
  }

  getAutomaticHeight() {
    this.myInnerHeight = window.innerHeight - 359;
    return this.myInnerHeight;
  }

  setPreviewUrl(url) {
    const randomData = Math.random();
    if (url) {
      this.documentOnPreviewUrl = this.cleanUrlFormat(url + '?var=' + randomData);
    }
  }

  cleanUrlFormat(url) {
    if (url) {
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
  }

  checkDisableForm() {
    if (this.stepData.isCompletingUser) {
      const finalStep = this.formData.steps && this.formData.steps.length && this.formData.steps.find((step) => step.is_final_step);
      const acceptedStepWithActiveFinalValidator = !!(this.stepData?.step_status === 'accept' && this.formDetail?.is_final_validator_active);
      const unsubmittedAdmissionForm = !!(
        (!this.formDetail?.admission_status ||
          this.formDetail?.admission_status === 'signing_process' ||
          this.formDetail?.admission_status === 'not_published') &&
        finalStep?.step_status === 'not_started'
      );
      this.isAllowedToEditAfterSubmitStep = acceptedStepWithActiveFinalValidator && unsubmittedAdmissionForm; // if final validator is active and step is submitted

      if (
        this.stepData.step_status === 'not_started' ||
        this.stepData.step_status === 'ask_for_revision' ||
        (this.formDetail && this.formDetail.admission_status && this.formDetail.admission_status === 'ask_for_revision') ||
        (this.isAllowedToEditAfterSubmitStep)
        // (acceptedStepWithActiveFinalValidator && !this.formDetail.admission_status && finalStep?.step_status === 'ask_for_revision')
      ) {
        this.disable = false;
      } else {
        this.disable = true;
      }
    } 
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
    if (this.isValidator && !this.stepData.isCompletingUser) {
      if (this.stepData.step_status === 'need_validation') {
        this.disable = false;
      } else {
        this.disable = true;
      }
    }
  }

  onAskForRevision() {
    this.subs.sink = this.dialog
      .open(FormFillingRevisionDialogComponent, {
        disableClose: true,
        minWidth: '800px',
        panelClass: 'no-padding',
        data: {
          formData: this.formDetail,
          stepId: this.stepData._id,
          existingMessages: this.stepData.revise_request_messages ? this.stepData.revise_request_messages : null,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.triggerRefresh.emit(this.formId);

        }
      });
  }
  onSubmitSignature() {
    if (this.checkFormValidity()) {
      let thisUserHasSigned = false;
      if (this.userId === this.formId) {
        if (this.stepData.user_recipient_signatory && this.stepData.user_recipient_signatory.is_already_sign) {
          thisUserHasSigned = true;
        }
        if (!thisUserHasSigned) {
          Swal.fire({
            type: 'warning',
            title: this.translate.instant('Invalid_Form_Warning.TITLE'),
            html: this.translate.instant('Missing Signature'),
            confirmButtonText: this.translate.instant('Invalid_Form_Warning.BUTTON'),
          });
        } else {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('DOCUSIGN_S1.TITLE'),
            html: this.translate.instant('DOCUSIGN_S1.TEXT'),
            confirmButtonText: this.translate.instant('DOCUSIGN_S1.BUTTON'),
          });
        }
      } else {
        if (this.stepData && this.stepData.contract_signatory_status && this.stepData.contract_signatory_status.length) {
          this.stepData.contract_signatory_status.forEach((element) => {

            if (element.user_id._id === this.userId) {
              if (element.is_already_sign) {
                thisUserHasSigned = true;
              }
            }
          });
        }
        if (!thisUserHasSigned) {
          Swal.fire({
            type: 'warning',
            title: this.translate.instant('Invalid_Form_Warning.TITLE'),
            html: this.translate.instant('Missing Signature'),
            confirmButtonText: this.translate.instant('Invalid_Form_Warning.BUTTON'),
          });
        } else {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('DOCUSIGN_S1.TITLE'),
            html: this.translate.instant('DOCUSIGN_S1.TEXT'),
            confirmButtonText: this.translate.instant('DOCUSIGN_S1.BUTTON'),
          });
        }
      }
    } else {
      Swal.fire({
        type: 'info',
        title: this.translate.instant('DOCUSIGN_S2.TITLE'),
        html: this.translate.instant('DOCUSIGN_S2.TEXT'),
        confirmButtonText: this.translate.instant('DOCUSIGN_S2.BUTTON_1'),
        cancelButtonText: this.translate.instant('DOCUSIGN_S2.BUTTON_2'),
        showCancelButton: true,
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((resp) => {
        if (resp.value) {
          this.isWaitingForResponse = true;
          if (this.formDetail.formId !== this.userId) {
            // this.subs.sink = this.contractService.SubmitContractProcess(this.formDetail.formId, this.userId).subscribe(
            //   (resssp) => {
            //     if (resssp) {
            //       this.isWaitingForResponse = false;
            //       this.openStepValidation();
            //     }
            //   },
            //   (err) => {
            //     this.triggerRefresh.emit(this.formId);
            //     this.isWaitingForResponse = false;
            //     Swal.fire({
            //       type: 'error',
            //       title: 'Error',
            //       text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
            //       confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            //     });
            //   },
            // );
          } else {
            // this.router.navigate(['/session/login']); // without validator
            const payload = {
              teacher_signatory: { teacher_id: this.formDetail.formId, is_already_sign: true },
            };
            // this.subs.sink = this.contractService.UpdateContractProcess(this.formDetail.formId, payload).subscribe(
            //   (ressp) => {
            //     this.subs.sink = this.contractService.SubmitContractProcessTeacher(this.formDetail.formId).subscribe(
            //       (resssp) => {
            //         if (resssp) {
            //           this.isWaitingForResponse = false;
            //           this.openStepValidation();
            //         }
            //       },
            //       (err) => {
            //         this.triggerRefresh.emit(this.formId);
            //         this.isWaitingForResponse = false;
            //         Swal.fire({
            //           type: 'error',
            //           title: 'Error',
            //           text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
            //           confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            //         });
            //       },
            //     );
            //   },
            //   (err) => {
            //     this.triggerRefresh.emit(this.formId);
            //     this.isWaitingForResponse = false;
            //     Swal.fire({
            //       type: 'error',
            //       title: 'Error',
            //       text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
            //       confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            //     });
            //   },
            // );
          }
        }
      });
    }
  }

  openStepValidation() {
    // this.subs.sink = this.dialog
    //   .open(StepMessageProcessContractDialogComponent, {
    //     width: '600px',
    //     minHeight: '100px',
    //     panelClass: 'certification-rule-pop-up',
    //     disableClose: true,
    //     data: {
    //       pre_contract_template_step_id: null,
    //       contract_process_id: this.formId,
    //       is_preview: false,
    //       is_contract: true,
    //     },
    //   })
    //   .afterClosed()
    //   .subscribe((ressp) => {
    //     this.triggerRefresh.emit(this.formId);
    //     this.getContractProcess();
    //   });
  }

  openStepValidationSign() {
    // this.subs.sink = this.dialog
    //   .open(StepMessageProcessContractDialogComponent, {
    //     width: '600px',
    //     minHeight: '100px',
    //     panelClass: 'certification-rule-pop-up',
    //     disableClose: true,
    //     data: {
    //       pre_contract_template_step_id: null,
    //       contract_process_id: this.formId,
    //       is_preview: false,
    //       is_contract: true,
    //     },
    //   })
    //   .afterClosed()
    //   .subscribe((ressp) => {
    //     this.getContractProcess();
    //   });
  }

  checkFormValidity(): boolean {
    this.isCheck = true;
    if (this.stepData && this.stepData.contract_signatory_status && this.stepData.contract_signatory_status.length) {
      this.stepData.contract_signatory_status.forEach((element) => {
        if (!element.is_already_sign) {
          this.isCheck = false;
        }
      });
    }
    if (!this.isCheck) {
      return true;
    } else {
      return false;
    }
  }

  rejectAndStopProcess() {
    let timeDisabled = 10;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('StopProcess.TITLE'),
      html: this.translate.instant('StopProcess.TEXT'),
      confirmButtonText: this.translate.instant('StopProcess.CONFIRM'),
      cancelButtonText: this.translate.instant('StopProcess.CANCEL'),
      showCancelButton: true,
      allowOutsideClick: false,
      allowEnterKey: false,
      allowEscapeKey: true,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('StopProcess.CONFIRM') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('StopProcess.CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      if (res.value) {
        clearTimeout(this.timeOutVal);
        this.isWaitingForResponse = true;
        // this.contractService.RejectAndStopContractProcess(this.formId).subscribe((resp) => {
        //   this.isWaitingForResponse = false;
        //   Swal.fire({
        //     type: 'success',
        //     title: this.translate.instant('Bravo!'),
        //     confirmButtonText: this.translate.instant('OK'),
        //     allowEnterKey: false,
        //     allowEscapeKey: false,
        //     allowOutsideClick: false,
        //   }).then((ress) => {
        //     this.router.navigate(['/teacher-contract/contract-management']);
        //   });
        // });
      } else {
        clearTimeout(this.timeOutVal);
        return;
      }
    });
  }
  checkAllUserAlreadySubmit(id, type?) {
    let isSigned = false;
    // if (this.stepData && this.stepData.step_status && this.stepData.step_status !== 'accept') {
    //   isSigned = false;
    // } else {
    //   isSigned = true;
    // }

    const receiverStatus = this.stepData && this.stepData.user_recipient_signatory && this.stepData.user_recipient_signatory.is_already_sign ? this.stepData.user_recipient_signatory : false;
    const contractSignatory = this.stepData.contract_signatory_status;
    if (contractSignatory && contractSignatory.length) { // Not using forEach or filter for easy breaking loop 
      for (let i = contractSignatory.length - 1; i >= 0; i--) {
        if (contractSignatory[i] && !contractSignatory[i].is_already_sign) {
          isSigned = false;
          break;
        } else {
          isSigned = true;
        }
      }
    }
    return isSigned && receiverStatus;
  }

  downloadPDF() {
    const link = document.createElement('a');
    link.setAttribute('type', 'hidden');
    link.href = this.serverimgPath + this.linkPdf + '?download=true';
    link.target = '_blank';
    link.click();
    link.remove();
  }

  signingUser() {
    this.isWaitingForResponse = true;
    const domainUrl = location.origin;
    const url = `${domainUrl}/form-fill?formId=${this.formId}&formType=${this.formDetail.formType}&userId=${this.userId}&userTypeId=${this.userTypeId}`;
    this.subs.sink = this.formFillingService.getContractProcessURL(this.stepData._id, this.formId, url).subscribe(
      (resp) => {
        if (resp) {
          this.isWaitingForResponse = false;
          // window.open(resp.toString(), '_self');
          window.location.href = resp;
        } else {
          this.triggerRefresh.emit(this.formId);
          this.isWaitingForResponse = false;
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  signingReceiver() {
    this.isWaitingForResponse = true;
    const domainUrl = location.origin;
    const url = `${domainUrl}/form-fill?formId=${this.formId}&formType=${this.formDetail.formType}&userId=${this.userId}&userTypeId=${this.userTypeId}`;
    this.subs.sink = this.formFillingService.getContractProcessURL(this.stepData._id, this.formId, url).subscribe(
      (resp) => {
        if (resp) {
          this.isWaitingForResponse = false;

          // window.open(resp.toString(), '_self');
          window.location.href = resp;
        } else {
          this.triggerRefresh.emit(this.formId);
          this.isWaitingForResponse = false;
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  updateSign() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.formFillingService.acceptFormProcessStep(this.formId, this.stepData._id).subscribe(
      (resssp) => {

        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'success',
          title: this.translate.instant('DOCUSIGN_S1.TITLE'),
          html: this.translate.instant('DOCUSIGN_S1.TEXT'),
          confirmButtonText: this.translate.instant('DOCUSIGN_S1.BUTTON'),
        })
          .then(() => {
            if (
              this.formDetail &&
              this.stepData &&
              this.stepData.form_builder_step &&
              typeof this.stepData._id === 'string' &&
              typeof this.formDetail.formId === 'string' &&
              typeof this.stepData.form_builder_step._id === 'string'
            ) {
              const stepID = this.stepData.form_builder_step._id;
              const formProcessID = this.formDetail.formId;
              const isPreview = typeof this.formDetail.isPreview === 'boolean' ? this.formDetail.isPreview : false;
              return this.formBuilderService.generateFormBuilderStepMessage(stepID, formProcessID, isPreview,'send').toPromise();
            }
          })
          .then((resp) => {
            if (resp) {
              return this.dialog
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
                    triggerCondition:'send'
                  },
                })
                .afterClosed()
                .toPromise();
            }
          })
          .then(() => {
            // instead emitting triggerRefresh, we need to reload the page to remove query param EVENT so update signing, not called every time
            const domainUrl = location.origin;
            const url = `${domainUrl}/form-fill?formId=${this.formId}&formType=${this.formDetail.formType}&userId=${this.userId}&userTypeId=${this.userTypeId}`;
            window.location.href = url;
          })
          .catch((error) => {
            this.isWaitingForResponse = false;
            console.error(error);
          });
        // if (resssp) {
        //   this.isWaitingForResponse = false;
        //   this.openStepValidationSign();
        // } else {
        //   this.triggerRefresh.emit(this.formId);
        // }
      },
      (err) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  userSigned() {
    let disabled = false;
    if (this.stepData && this.stepData.contract_signatory_status && this.stepData.contract_signatory_status.length) {
      this.stepData.contract_signatory_status.forEach((element) => {
        if (element.user_id._id === this.userId && element.is_already_sign) {
          disabled = true;
        }
      });
    }
    return disabled;
  }
  expand() {
    window.open(this.serverimgPath + this.linkPdf, '_blank').focus();
  }
}
