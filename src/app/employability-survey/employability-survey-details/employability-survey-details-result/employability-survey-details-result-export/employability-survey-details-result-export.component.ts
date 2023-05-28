import { Component, Inject, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { EmployabilitySurveyService } from 'app/service/employability-survey/employability-survey.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { SubSink } from 'subsink';
import * as moment from 'moment';
import * as _ from 'lodash';
import { ExportCsvService } from 'app/service/export-csv/export-csv.service';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { take } from 'rxjs/operators';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import Swal from 'sweetalert2';

@Component({
  templateUrl: './employability-survey-details-result-export.component.html',
  styleUrls: ['./employability-survey-details-result-export.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class EmployabilitySurveyDetailsResultExportComponent implements OnInit, OnDestroy {
  isLoading = false;
  sortValue = null;
  surveyType = '';
  surveyName = '';
  filteredValues = {
    school: '',
    student_name: '',
    latest_survey_status: '',
  };
  employabilitySurveys = [];

  @Input() esProcessId: '';
  private subs = new SubSink();
  form: UntypedFormGroup;

  constructor(
    private dialogRef: MatDialogRef<EmployabilitySurveyDetailsResultExportComponent>,
    private utilService: UtilityService,
    private esService: EmployabilitySurveyService,
    private translate: TranslateService,
    private exportCsvService: ExportCsvService,
    private fb: UntypedFormBuilder,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  ngOnInit() {

    this.initForm();
    this.getListEmployabilitySurveys();
    if (this.data.type === 'one_time') {
      this.form.get('surveyType').clearValidators();
      this.form.get('surveyType').updateValueAndValidity();
    }
  }

  initForm() {
    this.form = this.fb.group({
      exportName: ['Export', Validators.required],
      surveyType: ['', Validators.required],
    });
  }

  getListEmployabilitySurveys() {
    this.subs.sink = this.esService.checkEmplyabilitySurveyType(this.data.id).subscribe((resp) => {
      if (resp) {
        this.surveyType = resp.employability_survey_type;
        resp.employability_surveys.forEach((item, index) => {
          if (item._id) {
            const es = {
              name: `${this.translate.instant('ES')} ${index + 1}`,
              value: item._id,
            };
            this.employabilitySurveys.push(es);
          }
        });

      }
    });
  }

  getFinalResultAfterReTake(result: string) {
    if (result === 'PASS1' || result === 'PASS2' || result === 'PASS3') {
      return 'PASS';
    } else if (result === 'FAILED' || result === 'ELIMINATED') {
      return 'FAILED';
    }
  }

  finalTranscriptStatus(item) {
    let finalTranscriptStatus = '';

    if (item.final_transcript_id && item.final_transcript_id.jury_decision_for_final_transcript) {
      if (item.final_transcript_id.jury_decision_for_final_transcript === 'retaking') {
        if (!item.final_transcript_id.after_final_retake_decision) {
          if (item.final_transcript_id.student_decision === 'retaking' || item.final_transcript_id.student_decision === '') {
            finalTranscriptStatus = this.translate.instant('ES_FINAL_TRANSCRIPT.RETAKE');
          } else if (item.final_transcript_id.student_decision === 'failed') {
            finalTranscriptStatus = this.translate.instant('ES_FINAL_TRANSCRIPT.FINAL_RESULT_FAIL');
          }
        }
        if (item.final_transcript_id.after_final_retake_decision) {
          if (!item.final_transcript_id.has_jury_finally_decided) {
            if (item.final_transcript_id.student_decision === 'retaking' || item.final_transcript_id.student_decision === '') {
              finalTranscriptStatus = this.translate.instant('ES_FINAL_TRANSCRIPT.RETAKE');
            } else if (item.final_transcript_id.student_decision === 'failed') {
              finalTranscriptStatus = this.translate.instant('ES_FINAL_TRANSCRIPT.FINAL_RESULT_FAIL');
            }
          } else {
            if (this.getFinalResultAfterReTake(item.final_transcript_id.after_final_retake_decision) === 'FAILED') {
              finalTranscriptStatus = this.translate.instant('ES_FINAL_TRANSCRIPT.FINAL_RESULT_FAIL');
            }
            if (this.getFinalResultAfterReTake(item.final_transcript_id.after_final_retake_decision) === 'PASS') {
              finalTranscriptStatus = this.translate.instant('ES_FINAL_TRANSCRIPT.PASS');
            }
          }
        }
      } else if (item.final_transcript_id.jury_decision_for_final_transcript === 'pass') {
        finalTranscriptStatus = this.translate.instant('ES_FINAL_TRANSCRIPT.PASS');
      } else if (item.final_transcript_id.jury_decision_for_final_transcript === 'eliminated') {
        finalTranscriptStatus = this.translate.instant('ES_FINAL_TRANSCRIPT.ELIMINATED');
      } else if (item.final_transcript_id.jury_decision_for_final_transcript === 'failed') {
        finalTranscriptStatus = this.translate.instant('ES_FINAL_TRANSCRIPT.FINAL_RESULT_FAIL');
      }
    }
    return finalTranscriptStatus;
  }

  checkFormValidity() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    } else {
      // this.onExportData();
      this.exportCSV();
    }
  }

  async getEmployabilitySurveyCSVContinuous({ esProcessId, exportData, esSelected }): Promise<any> {
    return await this.esService.getEmployabilitySurveyCSVDialog(esProcessId, exportData, esSelected).pipe(take(1)).toPromise();
  }

  async getEmployabilitySurveyCSVOneTime({ esProcessId, exportData }): Promise<any> {
    return await this.esService.getEmployabilitySurveyCSV(esProcessId, exportData).pipe(take(1)).toPromise();
  }

  formatResponseAndImplantToSheet(resp) {
    const parentData = [];
    const data = [];
    const questions = [];
    this.isLoading = false;

    if (resp && resp.length && resp[0].student_responses && resp[0].student_responses.length) {
      if (
        resp[0].student_responses[0].questionnaire_response_id &&
        resp[0].student_responses[0].questionnaire_response_id.competence &&
        resp[0].student_responses[0].questionnaire_response_id.competence.length
      ) {
        resp[0].student_responses[0].questionnaire_response_id.competence.forEach((competence) => {
          if (competence && competence.segment && competence.segment.length) {
            competence.segment.forEach((segment) => {
              if (segment && segment.question && segment.question.length) {
                segment.question.forEach((question) => {
                  if (question && question.questionnaire_field_key) {
                    questions.push(this.translate.instant('QUESTIONNAIRE_FIELDS.' + question.questionnaire_field_key));
                  } else if (question && question.question_name) {
                    questions.push(question.question_name);
                  }
                });
              }
            });
          }
        });
        if (questions && questions.length) {
          const objQuestions = [];
          let count = 0;
          questions.forEach((question) => {
            objQuestions[8 + count] = question;
            count++;
          });
          data.push(objQuestions);
        }
      }
      const objHead = [];
      objHead[0] = this.translate.instant('EXPORT_ES.RNCP Title');
      objHead[1] = this.translate.instant('EXPORT_ES.Class');
      objHead[2] = this.translate.instant('EXPORT_ES.School');
      objHead[3] = this.translate.instant('EXPORT_ES.Student Civility');
      objHead[4] = this.translate.instant('EXPORT_ES.Student First Name');
      objHead[5] = this.translate.instant('EXPORT_ES.Student Last Name');
      objHead[6] = this.translate.instant('EXPORT_ES.Student Email');
      objHead[7] = this.translate.instant('EXPORT_ES.Certifier');
      resp.forEach((es, inEs) => {
        es.student_responses.forEach((item) => {
          const formProcessData = item.form_process_id;
          let questionForm = [];
          let finalQuestionForm = [];
          let listQuestionForm = [];
          let stepArrayForm = [];
          if (formProcessData && formProcessData.steps && formProcessData.steps.length) {
            stepArrayForm = _.map(formProcessData.steps, 'segments');
            questionForm = _.concat(questionForm, ...stepArrayForm);
            finalQuestionForm = _.map(questionForm, 'questions');
            listQuestionForm = _.concat(listQuestionForm, ...finalQuestionForm);
          }
          if (listQuestionForm && listQuestionForm.length) {
            listQuestionForm.forEach((quest, idx) => {
              if (quest && (quest.field_type || quest.question_label)) {
                if (quest && quest.is_field) {
                  objHead[idx + 8] = this.translate.instant('FORM_BUILDER_FIELD.' + quest.field_type);
                } else {
                  objHead[idx + 8] = quest.question_label;
                }
              }
            });
          }
          const obj = [];
          const finalTranscript = this.finalTranscriptStatus(item.student_id);
          // TODO: From the template get the data location and add the data
          // TEMPLATE CSV: https://docs.google.com/spreadsheets/d/1f0cE3dQjaJ-_3rVO6mi8GcuXTBQiO1KWl-A9gRryAkU/edit#gid=0
          obj[0] = item.rncp_id ? item.rncp_id.short_name : '-';
          obj[1] = item.class_id ? item.class_id.name : '-';
          obj[2] = item.school_id ? item.school_id.short_name : '-';
          obj[3] = item.student_id ? this.translate.instant(item.student_id.civility) : '-';
          obj[4] = item.student_id ? item.student_id.first_name : '-';
          obj[5] = item.student_id ? item.student_id.last_name : '-';
          obj[6] = item.student_id ? item.student_id.email : '-';
          obj[7] = finalTranscript ? finalTranscript : '-';
          if (
            item.questionnaire_response_id &&
            item.questionnaire_response_id.competence &&
            item.questionnaire_response_id.competence.length
          ) {
            const answerResponse = [];
            item.questionnaire_response_id.competence.forEach((competence) => {
              if (competence && competence.segment && competence.segment.length) {
                competence.segment.forEach((segment) => {
                  if (segment && segment.question && segment.question.length) {
                    segment.question.forEach((question) => {
                      if (question && question.questionnaire_field_key) {
                        answerResponse.push(question.answer ? this.utilService.cleanHTML(question.answer) : '-');
                      } else if (question && question.question_name) {
                        answerResponse.push(question.answer ? this.utilService.cleanHTML(question.answer) : '-');
                      } else if (question && question.field_type) {
                        answerResponse.push(question.answer ? this.utilService.cleanHTML(question.answer) : '-');
                      } else if (question && question.question_label) {
                        answerResponse.push(question.answer ? this.utilService.cleanHTML(question.answer) : '-');
                      }
                    });
                  }
                });
              }
            });

            if (answerResponse && answerResponse.length) {
              let count = 0;
              answerResponse.forEach((question) => {
                obj[8 + count] = question;
                count++;
              });
            }
          }
          if (listQuestionForm && listQuestionForm.length) {
            listQuestionForm.forEach((quest, idx) => {
              if (quest && (quest.field_type || quest.question_label)) {
                if (quest && quest.is_field) {
                  obj[idx + 8] = quest.answer ? quest.answer : '-';
                } else {
                  if (quest && quest.answer_type) {
                    switch (quest.answer_type) {
                      case 'numeric':
                        obj[idx + 8] = quest.answer_number ? quest.answer_number : '-';
                        break;
                      case 'date':
                        if (quest.answer_date && quest.answer_date.date && quest.answer_date.time) {
                          const date = this.parseUTCToLocalPipe.transformDate(quest.answer_date.date, quest.answer_date.time);
                          obj[idx + 8] = date && date !== 'Invalid date' ? date : '-';
                        }
                        break;
                      case 'time':
                        obj[idx + 8] = quest.answer_time ? quest.answer_time : '-';
                        break;
                      case 'duration':
                        obj[idx + 8] = quest.answer_duration ? quest.answer_duration : '-';
                        break;
                      case 'email':
                        obj[idx + 8] = quest.answer ? quest.answer : '-';
                        break;
                      case 'short_text':
                        obj[idx + 8] = quest.answer ? quest.answer : '-';
                        break;
                      case 'long_text':
                        obj[idx + 8] = quest.answer ? quest.answer : '-';
                        break;
                      case 'multiple_option':
                        obj[idx + 8] = quest.answer_multiple ? quest.answer_multiple : '-';
                        break;
                      case 'single_option':
                        obj[idx + 8] = quest.answer ? quest.answer : '-';
                        break;
                      case 'parent_child_option':
                        obj[idx + 8] = quest.answer ? quest.answer : '-';
                        break;
                    }
                  }
                }
              }
            });
          }
          data.push(obj);
        });
        data.unshift(objHead);
        parentData[inEs] = data;
      });

      const valueRange = { values: parentData };
      const today = moment().format('DD-MM-YYYY');
      const title = this.form.get('exportName').value + '_' + today;
      const sheetID = this.translate.currentLang === 'en' ? 0 : 1435366860;
      const sheetData = {
        spreadsheetId: '1F3btScBkSFYz3w9uzyFToV--6ETmUOCr03RL4MlJmsQ',
        sheetId: sheetID,
        range: 'A6',
      };
      this.exportCsvService.executeSurveySheetContinues(valueRange, title, sheetData, this.surveyName);
      this.dialogRef.close();
    }
  }

  async onExportData() {
    const esProcessId = this.data.id;
    const esSelected = this.form.get('surveyType').value;
    const exportData = this.data.data;
    const studentLimitPerMutation = 200;

    if (!exportData || !exportData.length) return;

    this.isLoading = true;

    let studentIds = [...exportData];
    let mergedResponse = [
      {
        student_responses: [],
      },
    ];
    // if there are more than {studentLimitPerMutation} Ids, separate the mutation calls to reduce load to BE
    // this way it prevents user for waiting for 10+ minutes for one huge mutation call
    while (studentIds.length > 0) {
      let currentIterationStudentIds = studentIds.splice(0, studentLimitPerMutation);
      let response =
        this.data.type === 'continuous'
          ? await this.getEmployabilitySurveyCSVContinuous({ esProcessId, exportData: currentIterationStudentIds, esSelected })
          : await this.getEmployabilitySurveyCSVOneTime({ exportData: currentIterationStudentIds, esProcessId });

      if (response && response.length) {
        mergedResponse[0].student_responses.push.apply(mergedResponse[0].student_responses, response[0].student_responses);
      }
    }

    this.formatResponseAndImplantToSheet(mergedResponse);
  }

  exportCSV() {
    const esProcessId = this.data.id;
    const esSelected = this.form.get('surveyType').value;
    const fileName = this.form.get('exportName').value;
    const exportData = this.data.data && this.data.data !== 'all' ? this.data.data : null;
    this.isLoading = true;
    if (this.data.type === 'one_time') {
      this.subs.sink = this.esService
        .GenerateEmployabilitySurveyCSV(esProcessId, exportData, this.employabilitySurveys[0].value, this.data.delimiter, fileName)
        .subscribe(
          (resp) => {
            this.isLoading = false;
            if (resp) {

              Swal.fire({
                type: 'success',
                title: this.translate.instant('StatUpdate_S1.Title'),
                text: this.translate.instant('StatUpdate_S1.Text'),
                confirmButtonText: this.translate.instant('StatUpdate_S1.Button'),
                allowEnterKey: false,
                allowEscapeKey: false,
                allowOutsideClick: false,
              }).then((res) => {
                this.closeDialog();
              });
            }
          },
          (err) => {
            this.isLoading = false;

            Swal.fire({
              type: 'error',
              title: 'Error',
              text: err && err['message'] ? err['message'] : err,
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            });
          },
        );
    } else {
      this.subs.sink = this.esService
        .GenerateEmployabilitySurveyCSV(esProcessId, exportData, esSelected, this.data.delimiter, fileName)
        .subscribe(
          (resp) => {
            this.isLoading = false;
            if (resp) {

              Swal.fire({
                type: 'success',
                title: this.translate.instant('StatUpdate_S1.Title'),
                text: this.translate.instant('StatUpdate_S1.Text'),
                confirmButtonText: this.translate.instant('StatUpdate_S1.Button'),
                allowEnterKey: false,
                allowEscapeKey: false,
                allowOutsideClick: false,
              }).then((res) => {
                this.closeDialog();
              });
            }
          },
          (err) => {
            this.isLoading = false;

            Swal.fire({
              type: 'error',
              title: 'Error',
              text: err && err['message'] ? err['message'] : err,
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            });
          },
        );
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
