import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { ApplicationUrls } from 'app/shared/settings';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { FormFillingRevisionDialogComponent } from '../form-filling-revision-dialog/form-filling-revision-dialog.component';
import { FormFillingService } from '../form-filling.service';
import { environment } from 'environments/environment';
import * as moment from 'moment';
import * as _ from 'lodash';
import { StepDynamicMessageDialogComponent } from 'app/shared/components/step-dynamic-message-dialog/step-dynamic-message-dialog.component';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';

@Component({
  selector: 'ms-form-fill-dynamic-summary',
  templateUrl: './form-fill-dynamic-summary.component.html',
  styleUrls: ['./form-fill-dynamic-summary.component.scss'],
})
export class FormFillDynamicSummaryComponent implements OnInit, OnDestroy {
  _stepData;
  isUsingStepMessage: boolean = false;
  messageDialogRef: MatDialogRef<StepDynamicMessageDialogComponent>;
  @Input() currentStepIndex;
  @Input() formDetail: any;
  // @Input() userData;
  @Input() stepData: any;
  @Input() set userData(value: any) {
    this._userData = value;
    if (value) {
      if (this.formDetail.formId) {
        this.getStudentAdmissionData();
      }
    }
  }
  @Input() isReceiver;
  @Output() triggerRefresh: EventEmitter<any> = new EventEmitter();

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  private subs = new SubSink();
  private _userData: any;

  get userData() {
    return this._userData;
  }

  isValidator: boolean;
  isRevisionUser: any;
  isWaitingForResponse = false;
  isLoading = false;
  timeOutVal: any;

  templateSummaryForm: UntypedFormGroup;
  templateStep = [];

  documentExpectedDisplays: { stepIndex: number; selectedDocumentUrl: any }[] = [];
  formData: any;
  formattedSignatureDate: string;
  signature = false;
  hasValidatorValidated: boolean = false;
  isAccepted = false;
  questionnaireConsts;
  questionnaireFields: string[];

  isFinalValidator: Boolean = false;

  constructor(
    private sanitizer: DomSanitizer,
    private translate: TranslateService,
    private router: Router,
    private dialog: MatDialog,
    private formFillingService: FormFillingService,
    private formBuilderService: FormBuilderService,
    private fb: UntypedFormBuilder,
  ) { }

  ngOnInit() {
    this.checkStepNotificationOrMessage();
    if (this.formDetail.isPreview === true && this.formDetail.templateId) {
      this.getRandomStudentAdmissionData();
    }
    this.translate.onLangChange.subscribe((resp) => {
      moment.locale(resp.lang);
      this.checkSignature();
    });

    this.initTemplateSummaryForm();
    if (this.formDetail.formId) {
      this.getStudentAdmissionData();
    }
    this.questionnaireConsts = this.formBuilderService.getQuestionnaireConst();
    this.checkStaticFieldType();


    // check validator usertype id with param usertype id
    if(this.formDetail?.userTypeId === this.stepData?.validator?._id){
      this.isFinalValidator = true;
    } else {
      this.isFinalValidator = false;
    }
  }

  checkStaticFieldType(){
    if(this.formDetail.formType === 'quality_form') {
      this.questionnaireFields = this.questionnaireConsts.qualityFileQuestionnaireFields;
    } else if(this.formDetail.formType === 'student_admission' || this.formDetail.formType === 'employability_survey'){
      this.questionnaireFields = this.questionnaireConsts.questionnaireFields;
    } else if(this.formDetail.isPreview) {      
      this.questionnaireFields = this.questionnaireConsts.qualityFileQuestionnaireFields.concat(this.questionnaireConsts.questionnaireFields);
      //remove duplicate 
      this.questionnaireFields = this.questionnaireFields.filter((fieldType, index) => this.questionnaireFields.indexOf(fieldType) === index);      
    }
  }

  isStaticFieldType(fieldType){

    if(this.questionnaireFields && this.questionnaireFields.length) {
      if(this.questionnaireFields.includes(fieldType)) {
        return true;
      } else {
        return false;
      }
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
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

  initTemplateSummaryForm() {
    this.templateSummaryForm = this.fb.group({
      signature: [null],
    });
  }

  getStudentAdmissionData() {
    this.formData = [];
    this.templateStep = [];
    this.isWaitingForResponse = true;
    this.subs.sink = this.formFillingService.getOneFormProcess(this.formDetail.formId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        this.formData = _.cloneDeep(resp);
        this.documentExpectedDisplays = [];
        const templateSteps = [];
        this.formData.steps.forEach((step, stepIndex) => {
          if (step && step.length !== 0) {
            // push to documentExpectedDetails all the document expected steps detail
            if (
              step.step_type &&
              step.step_type === 'document_expected' &&
              step.segments &&
              step.segments.length &&
              step.segments[0].questions[0]
            ) {
              this.documentExpectedDisplays.push({
                stepIndex,
                selectedDocumentUrl: this.setPreviewUrl(step.segments[0].questions[0].answer) || null,
              });
            }
            templateSteps.push(step);
          }
        });
        this.templateStep = templateSteps;

        this.checkDisableForm();
        this.checkFormAccept();
        this.checkSignature();
        this.hasValidatorValidated = this.checkIfValidatorHasValidated(resp);
      }
    });
  }

  getRandomStudentAdmissionData() {
    this.formData = [];
    this.templateStep = [];
    this.isWaitingForResponse = true;
    this.subs.sink = this.formFillingService.getOneRandomFormProcess(this.formDetail.templateId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        this.formData = resp;
        resp.steps.forEach((step) => {
          if (step && step.length !== 0) {
            this.templateStep.push(step);
          }
        });
      }
    });
  }

  checkDisableForm() {
    if (this.userData && this.userData.entities && this.userData.entities.length) {
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
    }

  }

  checkFormAccept() {
    if (this.formData && this.formData.admission_status === 'submitted') {
      this.isAccepted = true;
    } else if (this.formData && this.formData.admission_status === 'signing_process') {
      this.isAccepted = true;
    }
  }

  checkSignature() {
    if (this.formData && this.formData.signature_date && this.formData.signature_date.date) {
      this.signature = true;
      this.formattedSignatureDate = this.formatSignatureDate();
    } else {
      this.signature = false;
    }
  }

  formatSignatureDate() {
    moment.locale(this.translate.currentLang);
    const duration = moment.duration({ hours: environment.timezoneDiff });
    const acceptance_date = moment(this.formData.signature_date.date + this.formData.signature_date.time, 'DD/MM/YYYYHH:mm')
      .add(duration)
      .format();
    return moment(acceptance_date).format('DD MMMM YYYY - HH:mm');
  }

  checkIfValidatorHasValidated(payload): boolean {
    if (!this.isValidator) {
      return false;
    }
    return this.getAllValidatorsWhoValidated(payload).includes(this.formDetail.userId);
  }

  getAllValidatorsWhoValidated(payload): any[] {
    return payload && payload.final_validator_statuses && payload.final_validator_statuses.length
      ? payload.final_validator_statuses
        .filter((status) => status && status.user_id && status.user_id._id && status.is_already_sign)
        .map((status) => status.user_id._id)
      : [];
  }

  downloadPDF() {
    this.isLoading = true;
    this.subs.sink = this.formFillingService.generateAdmissionProcessSumarry(this.formDetail.formId).subscribe(
      (data) => {
        const link = document.createElement('a');
        link.setAttribute('type', 'hidden');
        link.href = `${environment.apiUrl}/fileuploads/${data}`.replace('/graphql', '');
        link.target = '_blank';
        link.click();
        link.remove();
        this.isLoading = false;
      },
      (err) => {
        this.isLoading = false;
      },
    );
  }

  getDocumentSelectedUrl(index: number) {
    return this.documentExpectedDisplays.find((doc) => doc.stepIndex === index).selectedDocumentUrl || null;
  }

  setDocumentDisplayed(stepIndex: number, docUrl: string) {
    const docIndex = this.documentExpectedDisplays.findIndex((doc) => doc.stepIndex === stepIndex);
    if (docIndex >= 0) {
      this.documentExpectedDisplays[docIndex].selectedDocumentUrl = this.setPreviewUrl(docUrl);
    }
  }

  setPreviewUrl(url) {
    if (!url) {
      return null;
    }
    const result = this.serverimgPath + url + '#view=fitH';
    const previewURL = this.cleanUrlFormat(result);
    return previewURL;
  }

  cleanUrlFormat(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  onAskForRevision() {
    this.subs.sink = this.dialog
      .open(FormFillingRevisionDialogComponent, {
        disableClose: true,
        minWidth: '800px',
        panelClass: 'no-padding',
        data: {
          formData: this.formDetail,
          stepId: this.stepData.is_final_step && this.formData.is_final_validator_active ? null : this.stepData._id,
          existingMessages: this.formDetail.revise_request_messages ? this.formDetail.revise_request_messages : null,
          formBuilderStepId: this.stepData.form_builder_step._id,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.triggerRefresh.emit(this.formDetail.formId);
        }
      });
  }

  onCompleteRevision() {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('UserForm_S5b.TITLE'),
      html: this.translate.instant('UserForm_S5b.TEXT'),
      footer: `<span style="margin-left: auto">UserForm_S5b</span>`,
      confirmButtonText: this.translate.instant('UserForm_S5b.CONFIRM'),
      cancelButtonText: this.translate.instant('UserForm_S5b.CANCEL'),
      showCancelButton: true,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((swalResp) => {
      if(swalResp.value){
        this.isWaitingForResponse = true;
        this.subs.sink = this.formFillingService.acceptFormProcessStep(this.formDetail.formId, this.stepData._id).subscribe((resp) => {
          this.isWaitingForResponse = false;
          if (resp) {
            this.triggerRefresh.emit(this.formDetail.formId);
          }
        });
      }else {
        return
      }
    })

    
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
        this.subs.sink = this.formFillingService.acceptFormProcessStep(this.formDetail.formId, this.stepData._id).subscribe((res) => {
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

  submitForm(message?, condition?) {
    this.isWaitingForResponse = true;
    this.formFillingService.acceptFormProcessStep(this.formDetail.formId, this.stepData._id).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        if(message) {
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
              is_preview:  typeof this.formDetail.isPreview === 'boolean' ? this.formDetail.isPreview : false,
              dataPreview: null,
              triggerCondition:condition
            },
          })
          .afterClosed()
          .subscribe((result) => {
            this.isWaitingForResponse = true;
            this.triggerRefresh.emit(this.formDetail.formId);
          });
        } else{
          if (
            this.formData &&
            this.formData.final_validators &&
            this.formData.final_validators.length &&
            this.formData.is_final_validator_active
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
              this.triggerRefresh.emit(this.formDetail.formId);
              // this.router.navigate(['/']);
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
              this.triggerRefresh.emit(this.formDetail.formId);
              // this.router.navigate(['/']);
            });
          }
        }
      }
    });
  }

  checkQuestionChildType(data){
    if(data && data.answer_number && data.answer_type === 'numeric' ) {
      return data.answer_number;
    } else if (data && data.answer_date && data.answer_date.date && data.answer_type === 'date') {
      return data.answer_date.date;
    } else {
      return data.answer;
    }
  }

  nextStepMessage(type) {
    if (this.templateSummaryForm.invalid /*  || this.isPhotoMandatory */) {
      this.templateSummaryForm.markAllAsTouched();
      Swal.fire({
        type: 'info',
        title: this.translate.instant('FormSave_S1s.TITLE'),
        html: this.translate.instant('FormSave_S1s.TEXT'),
        confirmButtonText: this.translate.instant('FormSave_S1s.BUTTON 1'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
      return;
    }
    let stepId = null;
    if (this.stepData && this.stepData._id) {
      stepId = this.stepData._id;
    }
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
      const isPreview = typeof this.formDetail.isPreview === 'boolean' ? this.formDetail.isPreview : false;
      const trigerCondition = type === 'waiting_for_validation' ? (this.stepData.is_validation_required ? type : 'validated') : type
      this.subs.sink = this.formBuilderService.generateFormBuilderStepMessage(stepID, formProcessID, isPreview, type).subscribe(
        (resp) => {
          if (resp) {
            this.isWaitingForResponse = false;
            this.submitForm(resp, trigerCondition);
          } else {
            this.isWaitingForResponse = false;
            this.submitForm();
          }
        },
        (error) => {
          this.isWaitingForResponse = false;
          this.submitForm();
          console.error(error);
        },
      );
    } else {
      this.submitForm();
    }
  }  
}
