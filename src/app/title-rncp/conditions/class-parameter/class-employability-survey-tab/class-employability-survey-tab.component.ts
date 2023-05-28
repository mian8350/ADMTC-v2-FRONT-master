import { ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { UtilityService } from 'app/service/utility/utility.service';
import { Observable, of } from 'rxjs';

@Component({
  selector: 'ms-class-employability-survey-tab',
  templateUrl: './class-employability-survey-tab.component.html',
  styleUrls: ['./class-employability-survey-tab.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class ClassEmployabilitySurveyTabComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  @Input() selectedClassName: string;
  @Input() classData: any;

  employabilitySurveyForm: UntypedFormGroup;
  ESQuestionaireList: any;
  ESQuestionaireListFiltered: [][] = [];

  isWaitingForResponse = false;

  enumValidatorList = ['operator', 'certifier', 'academic_director'];
  validatorFiltered: string[][] = [];

  constructor(
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private rncpTitleService: RNCPTitlesService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private utilService: UtilityService,
  ) {}

  ngOnInit() {
    this.dataInit();

    this.subs.sink = this.translate.onLangChange.pipe().subscribe((lang) => {
      const tempES = _.cloneDeep(this.getESFormArray().value);
      if (tempES && tempES.length) {
        tempES.forEach((survey, surveyIndex) => {
          if (survey && survey.validator && this.enumValidatorList.includes(survey.validator)) {
            this.getESFormArray().at(surveyIndex).get('validator').patchValue(survey.validator, {emitEvent: true});
          }
        });
      }
    })
  }

  dataInit() {
    this.getDataQuestionaire();
    this.initForm();
    this.getESData();
    this.enumValidatorList = this.enumValidatorList.sort((validatorA, validatorB) => {
      if (
        this.utilService.simplifyRegex(this.translate.instant('056_ES.validator_dropdown.' + validatorA)) <
        this.utilService.simplifyRegex(this.translate.instant('056_ES.validator_dropdown.' + validatorB))
      ) {
        return -1;
      } else if (
        this.utilService.simplifyRegex(this.translate.instant('056_ES.validator_dropdown.' + validatorA)) >
        this.utilService.simplifyRegex(this.translate.instant('056_ES.validator_dropdown.' + validatorB))
      ) {
        return 1;
      } else {
        return 0;
      }
    });
    this.validatorFiltered.push(this.enumValidatorList);
  }

  initForm() {
    this.employabilitySurveyForm = this.fb.group({
      parent_rncp_title: [this.selectedRncpTitleId, [Validators.required]],
      allow_employability_survey: [true],
      employability_surveys: this.fb.array([this.initESFormGroup()]),
    });
  }

  initESFormGroup() {
    return this.fb.group({
      _id: [null],
      questionnaire_template_id: [null],
      employability_survey_sent: [false],
      send_date: ['', [Validators.required]],
      send_time: ['', [Validators.required]],
      expiration_date: ['', [Validators.required]],
      expiration_time: ['', [Validators.required]],
      with_rejection_flow: [false],
      is_required_for_certificate: [false],
      validator: ['', [Validators.required]],
      send_only_to_pass_latest_retake_student: [false],
      // *************** If send_only_to_pass_student false, mean will send to all student
      send_only_to_pass_student: [false],
      // *************** If send_only_to_not_mention_continue_study false, mean will send to all student situation
      send_only_to_not_mention_continue_study: [false],
    });
  }

  getESFormArray(): UntypedFormArray {
    return this.employabilitySurveyForm.get('employability_surveys') as UntypedFormArray;
  }

  addESFormGroup() {

    this.getESFormArray().push(this.initESFormGroup());
    this.ESQuestionaireListFiltered.push(this.ESQuestionaireList);
    this.validatorFiltered.push(this.enumValidatorList);

  }

  removeESFormGroup(esIndex) {
    const emptyES = JSON.stringify(this.initESFormGroup().value);
    const selectedES = JSON.stringify(this.getESFormArray().at(esIndex).value);
    if (emptyES !== selectedES) {
      Swal.fire({
        title: this.translate.instant('WARN_DELETE_ES.TITLE'),
        text: this.translate.instant('WARN_DELETE_ES.TEXT'),
        footer: `<span style="margin-left: auto">WARN_DELETE_ES</span>`,
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('WARN_DELETE_ES.BUTTON_1'),
        cancelButtonText: this.translate.instant('WARN_DELETE_ES.BUTTON_2'),
        allowOutsideClick: false,
        allowEnterKey: false,
      }).then((result) => {
        if (result.value) {
          this.getESFormArray().removeAt(esIndex);
        }
      });
    } else {
      this.getESFormArray().removeAt(esIndex);
    }
  }

  getESData() {
    this.subs.sink = this.rncpTitleService.getClassESById(this.selectedClassId).subscribe((resp) => {
      if (resp) {
        const formattedData = this.formatESData(resp);
        const omittedData = _.omitBy(formattedData, _.isNil);
        this.employabilitySurveyForm.patchValue(omittedData);


      }
    });
  }

  formatESData(rawData) {
    const formattedData = _.cloneDeep(rawData);
    if (formattedData && formattedData.parent_rncp_title && formattedData.parent_rncp_title._id) {
      formattedData.parent_rncp_title = formattedData.parent_rncp_title._id;
    }
    if (formattedData && formattedData.employability_surveys && formattedData.employability_surveys.length) {
      formattedData.employability_surveys.forEach((esForm, esIndex) => {



        if (esIndex > 0) {
          this.addESFormGroup();
        }
        if (esForm && esForm.questionnaire_template_id && esForm.questionnaire_template_id._id) {
          esForm.questionnaire_template_id = esForm.questionnaire_template_id._id;
          this.displayFn(esForm.questionnaire_template_id);
        }
        if (esForm.send_date && esForm.send_time) {
          esForm.send_date = this.parseStringDatePipe.transformStringToDate(
            this.parseUTCToLocalPipe.transformDate(esForm.send_date, esForm.send_time),
          );
          esForm.send_time = this.parseUTCToLocalPipe.transform(esForm.send_time);
        }
        if (esForm.expiration_date && esForm.expiration_time) {
          esForm.expiration_date = this.parseStringDatePipe.transformStringToDate(
            this.parseUTCToLocalPipe.transformDate(esForm.expiration_date, esForm.expiration_time),
          );
          esForm.expiration_time = this.parseUTCToLocalPipe.transform(esForm.expiration_time);
        }
        if (esForm.validator.validator) {
          this.displayValidator(esForm.validator.validator);
        }
        esForm = _.omitBy(esForm, _.isNil);
      });
    }
    return formattedData;
  }

  getDataQuestionaire() {
    this.subs.sink = this.rncpTitleService.getQuestionaireES().subscribe((resp) => {

      if (resp) {
        this.ESQuestionaireList = resp;
        this.ESQuestionaireList = this.ESQuestionaireList.sort((ESQuestionaireA, ESQuestionaireB) => {
          if (
            this.utilService.simplifyRegex(ESQuestionaireA.questionnaire_name) <
            this.utilService.simplifyRegex(ESQuestionaireB.questionnaire_name)
          ) {
            return -1;
          } else if (
            this.utilService.simplifyRegex(ESQuestionaireA.questionnaire_name) >
            this.utilService.simplifyRegex(ESQuestionaireB.questionnaire_name)
          ) {
            return 1;
          } else {
            return 0;
          }
        });


        this.ESQuestionaireListFiltered.push(this.ESQuestionaireList);

      }
    });
  }

  displayFn(ESQuestionaireId: any) {
    if (ESQuestionaireId) {
      const foundESQuestionaire = _.find(this.ESQuestionaireList, (res) => res._id === ESQuestionaireId);
      let ESQuestionaire = '';
      if (foundESQuestionaire) {
        ESQuestionaire = foundESQuestionaire.questionnaire_name;
      }
      return ESQuestionaire;
    }
  }

  dateSendUpdate(esIndex) {
    if (this.getESFormArray().at(esIndex).get('send_date').value && !this.getESFormArray().at(esIndex).get('send_time').value) {
      this.getESFormArray().at(esIndex).get('send_time').patchValue('23:59');
    }
  }

  dateExpUpdate(esIndex) {
    if (this.getESFormArray().at(esIndex).get('expiration_date').value && !this.getESFormArray().at(esIndex).get('expiration_time').value) {
      this.getESFormArray().at(esIndex).get('expiration_time').patchValue('23:59');
    }
  }

  createPayload() {
    const payload = _.cloneDeep(this.employabilitySurveyForm.value);
    if (payload.employability_surveys && payload.employability_surveys.length) {
      payload.employability_surveys.forEach((esForm) => {
        if (esForm && esForm.send_date && esForm.send_time) {
          esForm.send_date = this.parseLocalToUTCPipe.transformDate(moment(esForm.send_date).format('DD/MM/YYYY'), esForm.send_time);
          esForm.send_time = this.parseLocalToUTCPipe.transform(esForm.send_time);
        }
        if (esForm && esForm.expiration_date && esForm.expiration_time) {
          esForm.expiration_date = this.parseLocalToUTCPipe.transformDate(
            moment(esForm.expiration_date).format('DD/MM/YYYY'),
            esForm.expiration_time,
          );
          esForm.expiration_time = this.parseLocalToUTCPipe.transform(esForm.expiration_time);
        }
        if (esForm && !esForm._id) {
          delete esForm._id;
        }
      });
    }
    return payload;
  }

  save() {
    const payload = this.createPayload();
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.updateClassParameter(this.selectedClassId, payload).subscribe(
      (response) => {
        this.isWaitingForResponse = false;

        if (response && response.data && response.data.UpdateClass && !response.errors) {
          const resp = response.data.UpdateClass;
          Swal.fire({
            type: 'success',
            title: 'Bravo!',
            text: this.translate.instant('CLASS_UPDATED_SWAL', { className: resp.name }),
          });
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  saveQuestionnaireID(esIndex, esID?: any) {
    if (esID && esID._id) {
      // For now remove the validation to check for continous study
      this.getESFormArray().at(esIndex).get('questionnaire_template_id').patchValue(esID._id);
      // if (esID.is_continue_study) {
      //   this.getESFormArray().at(esIndex).get('questionnaire_template_id').patchValue(esID._id);
      // } else {
      //   Swal.fire({
      //     type: 'error',
      //     title: this.translate.instant('TEMPLATE_ESX.TITLE'),
      //     text: this.translate.instant('TEMPLATE_ESX.TEXT'),
      //     confirmButtonText: this.translate.instant('TEMPLATE_ESX.BUTTON'),
      //   });
      //   this.getESFormArray().at(esIndex).get('questionnaire_template_id').patchValue(null);
      // }
    } else {
      this.getESFormArray().at(esIndex).get('questionnaire_template_id').patchValue(null);
    }
  }

  displayValidator(value) {
    if (value) {

      if (this.enumValidatorList.includes(value)) {
        return this.translate.instant('056_ES.validator_dropdown.' + value);
      }
    } else {
      return null;
    }
  }

  filterES(esIndex: number) {
    let searchString = this.getESFormArray().at(esIndex).get('questionnaire_template_id').value;
    if (searchString) {
      this.ESQuestionaireListFiltered[esIndex] = this.ESQuestionaireList.filter((es) => {


        return this.utilService.simplifyRegex(es.questionnaire_name).includes(this.utilService.simplifyRegex(searchString));
      });

    } else {
      this.ESQuestionaireListFiltered[esIndex] = this.ESQuestionaireList;

    }
  }

  filterValidator(esIndex) {
    let searchString = this.getESFormArray().at(esIndex).get('validator').value;
    if (searchString) {
      this.validatorFiltered[esIndex] = this.enumValidatorList.filter((val) => {
        return this.utilService
          .simplifyRegex(this.translate.instant('056_ES.validator_dropdown.' + val))
          .includes(this.utilService.simplifyRegex(searchString));
      });

    } else {
      this.validatorFiltered[esIndex] = this.enumValidatorList;

    }
  }

  saveValidator(esIndex, validator) {
    this.getESFormArray().at(esIndex).get('validator').patchValue(validator);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
