import { Component, Input, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { FormFillingService } from 'app/form-filling/form-filling.service';
import { ApplicationUrls } from 'app/shared/settings';
import { environment } from 'environments/environment';
import * as moment from 'moment';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';

@Component({
  selector: 'ms-admission-form',
  templateUrl: './admission-form.component.html',
  styleUrls: ['./admission-form.component.scss'],
})
export class AdmissionFormComponent implements OnInit {
  _formId: string;
  @Input() set formId(value) {
    this._formId = value;
    this.getStudentAdmissionData(this.formId);
  }

  get formId() {
    return this._formId;
  }

  private subs = new SubSink();
  private _userData: any;

  get userData() {
    return this._userData;
  }

  defaultQuestions;

  formData: any;
  templateStep = [];
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  signature = false;
  isLoading = false;
  formattedSignatureDate: string;
  isWaitingForResponse = false;

  constructor(public translate: TranslateService, private formFillingService: FormFillingService, private sanitizer: DomSanitizer, private formBuilderService: FormBuilderService) {}

  ngOnInit() {
    this.translate.onLangChange.subscribe((resp) => {
      moment.locale(resp.lang);
      this.checkSignature();
    });
    const questionnaireConsts = this.formBuilderService.getQuestionnaireConst();
    this.defaultQuestions = questionnaireConsts.questionnaireFields;
  }

  checkSignature() {
    if (this.formData && this.formData.signature_date && this.formData.signature_date.date && this.formData.signature_date.time) {
      this.signature = true;
      this.formattedSignatureDate = this.formatSignatureDate(this.formData.signature_date.date, this.formData.signature_date.time);
    } else {
      this.signature = false;
    }
  }

  formatSignatureDate(signature_date: string, signature_time: string) {
    moment.locale(this.translate.currentLang);
    const duration = moment.duration({ hours: environment.timezoneDiff });
    const acceptance_date = moment(signature_date + signature_time, 'DD/MM/YYYYHH:mm')
      .add(duration)
      .format();
    return moment(acceptance_date).format('DD MMMM YYYY - HH:mm');
    // const parseParisTime = moment(signature_time, 'HH:mm').add(duration).format('HH:mm');
    // let acceptance_date = signature_date ? moment(signature_date, 'DD/MM/YYYY').format('DD/MMM/YYYY') : '',
    //   acceptance_datetime = acceptance_date + ',' + (signature_date ? parseParisTime : '');
    // return moment(acceptance_datetime, 'DD/MMM/YYYY,hh:mm').format('DD MMMM YYYY - hh:mm');
  }

  getStudentAdmissionData(formId: string) {
    this.formData = [];
    this.templateStep = [];
    this.isWaitingForResponse = true;
    this.subs.sink = this.formFillingService.getOneStudentAdmissionProcess(formId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {

        this.formData = _.cloneDeep(resp);

        this.formData.steps.forEach((step) => {
          if (step && step.length !== 0) {
            if (
              step &&
              step.step_type === 'condition_acceptance' &&
              step.signature_date &&
              step.signature_date.date &&
              step.signature_date.time
            ) {
              step.signature_date = this.formatSignatureDate(step.signature_date.date, step.signature_date.time);

            }
            this.templateStep.push(step);
          }
        });

        this.checkSignature();
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

  setPreviewUrl(url) {
    const result = this.serverimgPath + url + '#view=fitH';
    const previewURL = this.cleanUrlFormat(result);
    return previewURL;
  }

  cleanUrlFormat(url) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  downloadPDF() {
    this.isLoading = true;
    this.subs.sink = this.formFillingService.generateAdmissionProcessSumarry(this.formId, true).subscribe(
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

  translateLabel(question) {
    if(this.defaultQuestions.includes(question)) {
      return this.translate.instant('FORM_BUILDER_FIELD.' + question);
    } else {
      return question;
    }
  }
  getQuestionAnswer(question) {
    if(question?.field_type === 'student_civility' || question?.field_type === 'parent_civility') {
      if (question?.answer) {
        const answer = this.translate.instant(question?.answer);
        return answer;
      } else {
        return '';
      }
    } else if(question?.answer_type === 'multiple_option') {
      return question?.answer_multiple.join(', ');
    } else {
      return question?.answer;
    }
  }
}
