import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatTableDataSource } from '@angular/material/table';
import { DomSanitizer } from '@angular/platform-browser';
import { ApplicationUrls } from 'app/shared/settings';
import { map, switchMap, take } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { UtilityService } from 'app/service/utility/utility.service';
import { SubSink } from 'subsink';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { FormFillingService } from '../form-filling.service';
import * as _ from 'lodash';
import { ActivatedRoute, Router } from '@angular/router';
import { EMPTY } from 'rxjs';
import { FormFillingRevisionDialogComponent } from '../form-filling-revision-dialog/form-filling-revision-dialog.component';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { StepDynamicMessageDialogComponent } from 'app/shared/components/step-dynamic-message-dialog/step-dynamic-message-dialog.component';

@Component({
  selector: 'ms-form-fill-document-expected',
  templateUrl: './form-fill-document-expected.component.html',
  styleUrls: ['./form-fill-document-expected.component.scss'],
})
export class FormFillDocumentExpectedComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  _stepData;
  @Input() currentStepIndex;
  isRevisionUser: any;
  isPageLoading: boolean;
  documentStep: any;
  is_document_validated: boolean = false;
  isAllowedToEditAfterSubmitStep: boolean = false;
  @Input() set stepData(value: any) {
    if (value) {
      this.isPageLoading = true;
      this._stepData = value;
      this.populateDocumentTables(this._stepData);
    }
  }
  @Input() userData: any;
  @Output() triggerRefresh: EventEmitter<any> = new EventEmitter();
  @Output() updateDocument: EventEmitter<any> = new EventEmitter();
  @Input() formDetail: any;
  @Input() formData: any;
  uploadedFile: File;
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  documentOnPreviewUrl: any;

  get stepData() {
    return this._stepData;
  }

  displayedColumn = ['document', 'status', 'action'];
  dataSource = new MatTableDataSource([]);
  isWaitingForResponse = true;
  loadingPreviewDocument = false;
  noData: any;
  dataCount: any;
  timeOutVal: any;
  subs = new SubSink();

  disable = false;
  isValidated = false;
  isValidator = false;
  formId: any;
  isUsingStepMessage: boolean = false;
  isAccepted = false;
  messageDialogRef: MatDialogRef<StepDynamicMessageDialogComponent>;
  formDatas: any;

  constructor(
    private fileUploadService: FileUploadService,
    private sanitizer: DomSanitizer,
    private translate: TranslateService,
    private utilService: UtilityService,
    private formFillingService: FormFillingService,
    private formBuilderService: FormBuilderService,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit() {
    this.formId = this.route.snapshot.queryParamMap.get('formId');
    this.checkStepNotificationOrMessage();
    if (!this.formDetail.isPreview) {
      this.checkDisableForm();
    }
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

  checkDisableForm() {
    if (this.stepData.isCompletingUser) {
      const finalStep = this.formData.steps && this.formData.steps.length && this.formData.steps.find((step) => step.is_final_step);
      const acceptedStepWithActiveFinalValidator = !!(
        this.stepData?.step_status === 'accept');
      const unsubmittedAdmissionForm = !!(
        (!this.formDetail?.admission_status ||
          this.formDetail?.admission_status === 'not_published') ||
        finalStep?.step_status === 'not_started'
      );
      this.isAllowedToEditAfterSubmitStep = acceptedStepWithActiveFinalValidator && unsubmittedAdmissionForm; // if final validator is active and step is submitted

      if (
        this.stepData.step_status === 'not_started' ||
        this.stepData.step_status === 'ask_for_revision' ||
        (this.formDetail && this.formDetail.admission_status && this.formDetail.admission_status === 'ask_for_revision') ||
        this.isAllowedToEditAfterSubmitStep
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

  // isDocumentRequired() {
  //   const data = _.cloneDeep(this.dataSource.data);
  //   let required = false;

  //   for (const document of data) {
  //     if (document && document.is_required && this.isRequiredDocumentsUploaded()) {
  //       required = true;
  //     }
  //   }
  //   return required;
  // }

  populateDocumentTables(formData) {
    if (!formData && !formData.segments && !formData.segments.length) {
      return;
    }
    let documents = formData.segments.map((segment) => segment.questions).flat();
    documents = documents.map((res) => {
      if (res.document_validation_status === null) {
        this.isValidated = false;
        res.document_validation_status = 'not_validated';
        return res;
      } else {
        this.isValidated = res.document_validation_status === 'validated' ? true : false;
        return res;
      }
    });
    this.documentStep = documents;

    this.dataSource.data = documents;
    this.isWaitingForResponse = false;
    this.isPageLoading = false;
    this.dataCount = documents.length;
    this.dataSource.paginator = this.paginator;
    this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
    if (this.documentStep && this.documentStep.length && this.documentStep[0]) {
      this.setDocumentOnPreviewUrl(this.documentStep[0]);
    }
  }

  onPreviewDocument(element) {
    const serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
    const result = serverimgPath + element.url + '#view=fitH';
    this.documentOnPreviewUrl = this.sanitizer.bypassSecurityTrustResourceUrl(result);
  }

  chooseFile(fileInput: Event, element) {
    const acceptable = ['pdf'];
    const file = (<HTMLInputElement>fileInput.target).files[0];
    if (!file) {
      return;
    }
    const fileType = this.utilService.getFileExtension(file.name).toLocaleLowerCase();
    if (acceptable.includes(fileType)) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe(
        (resp) => {


          if (resp) {
            this.patchAnswerWithUploadedFile(element._id, resp.s3_file_name);
          }
        },
        (err) => {

          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: 'OK',
          });
        },
      );
    } else {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TITLE'),
        text: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TEXT', { file_exts: '.pdf' }),
        allowEscapeKey: false,
        allowOutsideClick: false,
        allowEnterKey: false,
      });
    }
  }

  patchAnswerWithUploadedFile(questionId: string, fileName: string) {
    const indexOfSegment = this.stepData.segments.findIndex((segment) => this.hasQuestion(segment, questionId));
    if (indexOfSegment >= 0) {
      const questionIndex = this.stepData.segments[indexOfSegment].questions.findIndex((question) => question._id === questionId);
      if (questionIndex >= 0) {
        this.stepData.segments[indexOfSegment].questions[questionIndex].answer = fileName;
        // if the validator is student (when user is both receiver and validator), auto select the status to be validated
        if (this.stepData.is_validation_required && !(this.stepData.isCompletingUser && this.isValidator)) {
          this.stepData.segments[indexOfSegment].questions[questionIndex].document_validation_status = 'waiting_for_validation';
        } else {
          this.stepData.segments[indexOfSegment].questions[questionIndex].document_validation_status = 'validated';
          this.stepData.segments[indexOfSegment].questions[questionIndex].is_document_validated = true;
        }
        this.saveUpdatedData(this.stepData);
      }
    }
  }

  hasQuestion(segment: any, questionId: string) {
    return !!segment.questions.find((question) => question._id === questionId);
  }

  setDocumentOnPreviewUrl(element) {
    this.loadingPreviewDocument = true;
    this.documentOnPreviewUrl = null;
    if (element.answer) {
      // const result = googleView + serverimgPath + element.url + '&embedded=true#view=fitH';
      // const result = this.serverimgPath + element.answer + '#view=fitH';
      let isMobile = false;
      if (navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/iPhone/i)) {
        // Why? Because mobile need additional help with gview otherwise normal pdfviewer with iframe will return mime not supported
        isMobile = true;
      }

      const googleView = 'https://docs.google.com/gview?embedded=true&url=';
      const result = (isMobile ? googleView : '') + this.serverimgPath + element.answer + '#view=fitH';
      this.documentOnPreviewUrl = this.cleanUrlFormat(result);
    } else {
      this.loadingPreviewDocument = false;
    }
  }

  loadIframe(event) {

    if (event) {
      this.loadingPreviewDocument = false;
    }
  }

  cleanUrlFormat(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  createPayload(stepData) {
    const payload = stepData;
    delete payload.revise_request_messages;
    if (payload && payload.validator && payload.validator._id) {
      payload.validator = payload.validator._id;
    }
    delete payload.form_builder_step;
    delete payload.is_only_visible_based_on_condition;
    delete payload.step_status;
    delete payload.user_who_complete_step;
    delete payload.isCompletingUser;
    return payload;
  }

  saveUpdatedData(stepDataInput: any, isLoading?) {
    if (isLoading) {
      this.isWaitingForResponse = true;
    }
    const payload = this.createPayload(_.cloneDeep(stepDataInput));
    this.formFillingService.createUpdateFormProcessStepAndQuestion(payload).subscribe((resp) => {
      if (isLoading) {
        this.isWaitingForResponse = false;
        if (resp) {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo!'),
            confirmButtonText: this.translate.instant('OK'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then((res) => {
            return;
          });
        }
      }
      this.populateDocumentTables(this.stepData); // force update table with new data
      if (this.stepData?.step_status === 'accept') {
        this.updateDocument.emit(this.formDetail.formId); // without refresh
      } else {
        this.triggerRefresh.emit(this.formDetail.formId); //  with refresh
      }
      // Need to refresh if upload in the revision status. This will also update the summary.

      // if (this.formDetail && this.formDetail.admission_status === 'ask_for_revision') {
      //   this.triggerRefresh.emit(this.formDetail.formId);
      // }
    });
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
        // this.submitDocumentStep();
        const stepID = this.stepData.form_builder_step._id;
        const formProcessID = this.formDetail.formId;
        const isPreview = typeof this.formDetail.isPreview === 'boolean' ? this.formDetail.isPreview : false;
        const triggerCondition = 'waiting_for_validation';
        this.subs.sink = this.formBuilderService
          .generateFormBuilderStepMessage(stepID, formProcessID, isPreview, triggerCondition)
          .subscribe(
            (resp) => {
              if (resp) {
                this.submitDocumentStep(resp, triggerCondition);
              } else {
                this.submitDocumentStep();
              }
            },
            (error) => {
              this.isWaitingForResponse = false;
              this.submitDocumentStep();
              console.error(error);
            },
          );
      }
    });
  }

  isRequiredDocumentsUploaded(): boolean {
    const data = _.cloneDeep(this.dataSource.data);
    let validate = true;
    if (data.every((document) => document.is_document_validated)) return true;
    for (const document of data) {
      if (document && document.is_required && !document.answer) {
        validate = false;
        return false;
      }
    }

    return validate;
  }

  validateButtonStep(): boolean {
    const data = this.dataSource.data;

    const isSomeNotValidate = data.every((document) => document.is_document_validated === true);

    return !isSomeNotValidate;
  }

  validateDocument(document, event: MatSlideToggleChange) {
    document.is_document_validated = event.checked;
    document.document_validation_status = 'validated';

  }

  saveDataOnFinalRevision() {
    const payload = {
      _id: this.stepData._id,
    };
    this.saveUpdatedData(payload);
  }

  async submitDocumentStep(message?, condition?) {
    if (!this.checkMandatoryDocument(this._stepData) || !this.isRequiredDocumentsUploaded()) {
      await Swal.fire({
        type: 'error',
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
      return;
    }
    this.isPageLoading = true;
    this.subs.sink = this.formFillingService.acceptFormProcessStep(this.formId, this.stepData._id).subscribe((resp) => {
      this.isPageLoading = false;

      if (
        (this.stepData && this.stepData.is_validation_required && this.stepData.validator && this.stepData.validator.name === 'Student') ||
        !this.stepData.is_validation_required
      ) {
        if (message) {
          this.isPageLoading = false;
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
              this.triggerRefresh.emit(this.formId);
            });
        } else {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo'),
            confirmButtonText: this.translate.instant('UserForm_S6.CONFIRM'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then(() => this.triggerRefresh.emit(this.formId));
        }
      } else {
        if (message) {
          this.isPageLoading = false;
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
              this.triggerRefresh.emit(this.formId);
            });
        } else {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('UserForm_S6.TITLE'),
            text: this.translate.instant('UserForm_S6.TEXT'),
            confirmButtonText: this.translate.instant('UserForm_S6.CONFIRM'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then(() => this.triggerRefresh.emit(this.formId));
        }
      }
    });
    // this.swalValidate();
  }

  async checkIfRequiredDocumentUploaded(): Promise<boolean> {
    if (!this.isRequiredDocumentsUploaded()) {
      await Swal.fire({
        type: 'error',
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
      return false;
    } else {
      return true;
    }
  }

  validateDocumentStep(message?, condition?) {
    let timeDisabled = 3;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('UserForm_S9.TITLE'),
      html: this.translate.instant('UserForm_S9.TEXT'),
      confirmButtonText: this.translate.instant('UserForm_S9.CONFIRM'),
      cancelButtonText: this.translate.instant('UserForm_S9.CANCEL'),
      showCancelButton: true,
      allowOutsideClick: false,
      allowEnterKey: false,
      allowEscapeKey: true,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('UserForm_S9.CONFIRM') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('UserForm_S9.CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      if (res.value) {
        if (!this.checkMandatoryDocument(this._stepData) || !this.isRequiredDocumentsUploaded()) {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('FormSave_S1.TITLE'),
            html: this.translate.instant('FormSave_S1.TEXT'),
            confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          });
          return;
        }
        const payload = this.createPayload(_.cloneDeep(this.stepData));
        this.isPageLoading = true;
        this.subs.sink = this.formFillingService
          .createUpdateFormProcessStepAndQuestion(payload)
          .pipe(
            take(1),
            switchMap((resp) => {
              if (resp) {
                return this.formFillingService.acceptFormProcessStep(this.formId, this.stepData._id);
              } else {
                return EMPTY;
              }
            }),
          )
          .subscribe((resp) => {
            this.isPageLoading = false;

            if (message) {
              this.isPageLoading = false;
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
                  this.triggerRefresh.emit(this.formId);
                });
            } else {
              Swal.fire({
                type: 'success',
                title: this.translate.instant('Bravo!'),
                confirmButtonText: this.translate.instant('OK'),
                allowEnterKey: false,
                allowEscapeKey: false,
                allowOutsideClick: false,
              }).then(() => this.triggerRefresh.emit(this.formId));
            }
          });
      } else {
        return;
      }
    });
  }

  nextStepMessage(condition, type?) {
    // StepMessageProcessDialogComponent
    this.isPageLoading = false;
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
      const triggerCondition =
        condition === 'waiting_for_validation' ? (this.stepData.is_validation_required ? condition : 'validated') : condition;
      this.subs.sink = this.formBuilderService.generateFormBuilderStepMessage(stepID, formProcessID, isPreview, triggerCondition).subscribe(
        (resp) => {
          if (resp) {
            if (type === 'validateDocumentStep') {
              this.validateDocumentStep(resp, triggerCondition);
            }
            if (type === 'submitDocumentStep') {
              this.submitDocumentStep(resp, triggerCondition);
            }
          } else {
            this.isWaitingForResponse = false;
            if (type === 'validateDocumentStep') {
              this.validateDocumentStep();
            }
            if (type === 'submitDocumentStep') {
              this.submitDocumentStep();
            }
          }
        },
        (error) => {
          this.isWaitingForResponse = false;
          if (type === 'validateDocumentStep') {
            this.validateDocumentStep();
          }
          if (type === 'submitDocumentStep') {
            this.submitDocumentStep();
          }
          console.error(error);
        },
      );
    } else {
      if (type === 'validateDocumentStep') {
        this.validateDocumentStep();
      }
      if (type === 'submitDocumentStep') {
        this.submitDocumentStep();
      }
    }
    // ...
  }

  onAskForRevisionFinalValidator() {
    this.subs.sink = this.dialog
      .open(FormFillingRevisionDialogComponent, {
        disableClose: true,
        minWidth: '800px',
        panelClass: 'no-padding',
        data: {
          formData: this.formDetail,
          existingMessages: this.formDetail.revise_request_messages ? this.formDetail.revise_request_messages : null,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.triggerRefresh.emit(this.formDetail.formId);
        }
      });
  }

  onCompleteRevisionFinalValidator() {
    this.isWaitingForResponse = true;
    if (!this.checkMandatoryDocument(this._stepData) || !this.isRequiredDocumentsUploaded()) {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
      return;
    }
    this.subs.sink = this.formFillingService.acceptFormProcessStep(this.formDetail.formId, this.stepData._id).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        this.triggerRefresh.emit(this.formDetail.formId);
      }
    });
  }

  onValidateFormFinalValidator() {
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
        if (!this.checkMandatoryDocument(this._stepData) || !this.isRequiredDocumentsUploaded()) {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('FormSave_S1.TITLE'),
            html: this.translate.instant('FormSave_S1.TEXT'),
            confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          });
          return;
        }
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

  onSubmitFormFinalVlidator() {
    this.isWaitingForResponse = true;
    if (!this.checkMandatoryDocument(this._stepData) || !this.isRequiredDocumentsUploaded()) {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
      return;
    }
    this.formFillingService.acceptFormProcessStep(this.formDetail.formId, this.stepData._id).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
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
    });
  }

  checkFormAccept() {
    if (this.formData && this.formData.admission_status === 'submitted') {
      this.isAccepted = true;
    } else if (this.formData && this.formData.admission_status === 'signing_process') {
      this.isAccepted = true;
    }
  }

  checkMandatoryDocument(steps: any): boolean {
    if (!(steps?.segments[0]?.questions && steps?.segments[0]?.questions.length)) {
      return false;
    }

    // array of id document required ['', '','']
    const totalDocumentRequiredId = steps.segments[0].questions.filter((question) => question.is_required).map((question) => question._id);

    // all document uploaded
    const totalDocumentUploaded = steps.segments[0].questions.filter(
      (question) => ['waiting_for_validation', 'validated'].indexOf(question.document_validation_status) !== -1,
    );

    const totalMandatoryDocumentUploaded = totalDocumentUploaded.filter((document) => {
      // if document uploaded required return true
      return totalDocumentRequiredId.indexOf(document._id) !== -1;
    });

    if (steps.segments[0].use_total_mandatory_documents) {
      //if document uploaded required same with document required, can using total document for compare with total mandatory document
      if (totalDocumentRequiredId.length === totalMandatoryDocumentUploaded.length) {
        return totalDocumentUploaded.length >= steps.segments[0].total_mandatory_document;
      } else {
        return false;
      }
    } else {
      return true;
    }
  }
}
