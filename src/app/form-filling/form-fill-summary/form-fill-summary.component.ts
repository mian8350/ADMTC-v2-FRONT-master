import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { FormFillingService } from '../form-filling.service';
import { SubSink } from 'subsink';
import { MatDialog } from '@angular/material/dialog';
import { FormFillingRevisionDialogComponent } from '../form-filling-revision-dialog/form-filling-revision-dialog.component';
import * as moment from 'moment';
import { DomSanitizer } from '@angular/platform-browser';
import { ApplicationUrls } from 'app/shared/settings';
import { environment } from 'environments/environment';
import * as _ from 'lodash';
import { Router } from '@angular/router';

@Component({
  selector: 'ms-form-fill-summary',
  templateUrl: './form-fill-summary.component.html',
  styleUrls: ['./form-fill-summary.component.scss'],
})
export class FormFillSummaryComponent implements OnInit {
  @Input() formDetail;
  @Input() isReceiver: any;
  @Input() set userDataInput(value: any) {
    this._userData = value;
    if (value) {
      if (this.formDetail.formId) {
        this.getStudentAdmissionData();
      }
    }
  }
  @Output() triggerRefresh: EventEmitter<any> = new EventEmitter();

  private subs = new SubSink();
  private _userData: any;

  get userData() {
    return this._userData;
  }

  isUserValidator = true; // temporary
  isUserStudent = false; // temporary
  timeOutVal: any;
  formData: any;
  templateStep = [];
  isValidator = false;
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  signature = false;
  isAccepted = false;
  isLoading = false;
  formattedSignatureDate: string;
  isWaitingForResponse = false;
  hasValidatorValidated: boolean = false;
  documentExpectedDisplays: { stepIndex: number; selectedDocumentUrl: any }[] = [];

  constructor(
    private translate: TranslateService,
    private formFillingService: FormFillingService,
    private dialog: MatDialog,
    private sanitizer: DomSanitizer,
    private router: Router,
  ) {}

  ngOnInit() {
    if (this.formDetail.templateId) {
      this.getRandomStudentAdmissionData();
    }
    this.translate.onLangChange.subscribe((resp) => {
      moment.locale(resp.lang);
      this.checkSignature();
    });
  }

  checkDisableForm() {
    const finalValidators = this.formData.final_validators.map((validator) => validator._id);
    this.isValidator = !!this.userData.entities.find((ent) => {
      if (ent && ent.type && this.formData.is_final_validator_active && finalValidators.includes(ent.type._id)) {
        return true;
      } else {
        return false;
      }
    });
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

  checkFormAccept() {
    if (this.formData && this.formData.admission_status === 'submitted') {
      this.isAccepted = true;
    } else if (this.formData && this.formData.admission_status === 'signing_process') {
      this.isAccepted = true;
    }
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

  getRandomStudentAdmissionData() {
    this.formData = [];
    this.templateStep = [];
    this.isWaitingForResponse = true;
    this.subs.sink = this.formFillingService.GetOneRandomStudentAdmissionProcess(this.formDetail.templateId).subscribe((resp) => {
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

  onAskForRevision() {
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

  onCompleteRevision() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.formFillingService.acceptStudentAdmissionProcessStep(this.formDetail.formId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        this.triggerRefresh.emit(this.formDetail.formId);
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
        this.subs.sink = this.formFillingService
          .validateStudentAdmissionProcess(this.formDetail.formId, this.formDetail.userTypeId)
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

  getDocumentSelectedUrl(index: number) {
    return this.documentExpectedDisplays.find((doc) => doc.stepIndex === index).selectedDocumentUrl || null;
  }

  setDocumentDisplayed(stepIndex: number, docUrl: string) {
    const docIndex = this.documentExpectedDisplays.findIndex((doc) => doc.stepIndex === stepIndex);
    if (docIndex >= 0) {
      this.documentExpectedDisplays[docIndex].selectedDocumentUrl = this.setPreviewUrl(docUrl);
    }
  }

  submitForm() {
    this.isWaitingForResponse = true;
    this.formFillingService.acceptStudentAdmissionSummary(this.formDetail.formId).subscribe((resp) => {
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

  // Swal for complete revision
  swalCompleteRevision() {
    let timeDisabled = 3;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('UserForm_S5.TITLE'),
      html: this.translate.instant('UserForm_S5.TEXT'),
      confirmButtonText: this.translate.instant('UserForm_S5.CONFIRM'),
      cancelButtonText: this.translate.instant('UserForm_S5.CANCEL'),
      showCancelButton: true,
      allowOutsideClick: false,
      allowEnterKey: false,
      allowEscapeKey: true,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('UserForm_S5.CONFIRM') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('UserForm_S5.CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      if (res.value) {
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
      } else {
        return;
      }
    });
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
}
