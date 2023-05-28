import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import * as moment from 'moment';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js'
import Swal from 'sweetalert2';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { DateAdapter } from '@angular/material/core';
import { Router } from '@angular/router';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { removeSpaces } from 'app/service/customvalidator.validator';

@Component({
  selector: 'ms-questionnaire-simulation-problematic',
  templateUrl: './questionnaire-simulation-problematic.component.html',
  styleUrls: ['./questionnaire-simulation-problematic.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class QuestionnaireSimulationProblematicComponent implements OnInit, OnDestroy {
  @Input() selectedQuestionnaire;

  private subs = new SubSink();

  allowEditForm = true;
  problematicForm: UntypedFormGroup;
  questionResponseForm: UntypedFormGroup;
  questionResponseFormId = '';

  intVal: any;
  timeOutVal: any;

  statusCard = {
    sent_to_student: false,
    sent_to_acadDpt: false,
    rejected_by_acadDpt: false,
    validated_by_acadDpt: false,
    sent_to_certifier: false,
    rejected_by_certifier: false,
    validated_by_certifier: false,
    resubmitted_to_certifier: false,
  };

  relatedBlockIndex = [];

  isWaitingForResponse = false;

  public Editor = DecoupledEditor;
  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  constructor(
    public translate: TranslateService,
    private fb: UntypedFormBuilder,
    private dateAdapter: DateAdapter<Date>,
    private router: Router,
    public utilService: UtilityService,
    private fileUploadService: FileUploadService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
  ) { }

  ngOnInit() {


    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });

    this.processStatusCard();
    this.initForm();
    const temp = _.cloneDeep(this.selectedQuestionnaire);

    const formattedResponseData = this.formatResponseTemplate(_.cloneDeep(temp));
    this.questionResponseForm.patchValue(formattedResponseData);
    // this.formatDataOnFetch(temp);
  }

  processStatusCard() {
    // Reset first, so if triggered by ngonchanges, data of old job desc(other student) not corrupting the data
    this.statusCard = {
      sent_to_student: true,
      sent_to_acadDpt: false,
      rejected_by_acadDpt: false,
      validated_by_acadDpt: false,
      sent_to_certifier: false,
      rejected_by_certifier: false,
      validated_by_certifier: false,
      resubmitted_to_certifier: false,
    };
    this.allowEditForm = true;

  }

  initForm() {
    this.problematicForm = this.fb.group({
      student_id: [''],
      school_id: [''],
      rncp_id: [''],
      class_id: [''],
      date: this.fb.group({
        date_utc: moment().format('DD/MM/YYYY'),
        time_utc: ['00:01'],
      }),
      general_comments: this.fb.array([]),
      signature_of_the_student: [false],
      signature_of_the_acad_dir: [ false],
      signature_of_the_certifier: [false],
    });

    this.questionResponseForm = this.fb.group({
      questionnaire_name: ['', Validators.required],
      questionnaire_grid: this.fb.group({
        orientation: [''],
        header: this.fb.group({
          title: [''],
          text: [''],
          direction: [''],
        }),
        footer: this.fb.group({
          text: [''],
          text_below: [false],
        }),
      }),
      competence: this.fb.array([]),
    });
  }

  // *************** START Form Related Functionality
  initQuestionFormGroup() {
    return this.fb.group({
      question: [''],
      answer: [''],
      comments: this.fb.array([]),
    });
  }

  initCommentFormGroup() {
    return this.fb.group({
      comment: [''],
      date: this.fb.group({
        date_utc: moment().format('DD/MM/YYYY'),
        time_utc: ['00:01'],
      }),
    });
  }

  initCompetenceForm() {
    return this.fb.group({
      competence_name: ['', Validators.required],
      sort_order: [null],
      tied_to_option: [null],
      block_type: [null],
      segment: this.fb.array([]),
    });
  }

  initSegmentForm() {
    return this.fb.group({
      segment_name: ['', [Validators.required]],
      sort_order: [null],
      question: this.fb.array([]),
    });
  }

  initQuestionForm() {
    return this.fb.group({
      question_name: [''],
      sort_order: [null],
      question_type: [''],
      answer: [''],
      answer_number: [null],
      answer_date: this.fb.group({
        date: [''],
        time: ['00:01'],
      }),
      answer_multiple: [[]],
      questionnaire_field_key: [''],
      is_field: [false],
      is_answer_required: [''],
      options: this.fb.array([]),
      parent_child_options: this.fb.array([]),
      missions_activities_autonomy: this.fb.array([]),
      multiple_textbox: this.fb.array([]),
      comments: this.fb.array([]),
    });
  }

  initOptionsForm() {
    return this.fb.group({
      option_text: [''],
      position: [null],
      related_block_index: [null],
      tied_to_block: [''],
    });
  }

  initMissionActivityAutonomyForm() {
    return this.fb.group({
      mission: ['', [Validators.required, removeSpaces]],
      activity: ['', [Validators.required, removeSpaces]],
      autonomy_level: ['', [Validators.required, removeSpaces]],
    });
  }

  initParentChildOptionForm() {
    return this.fb.group({
      option_text: [''],
      position: [''],
      questions: this.fb.array([]),
    });
  }

  initMultipleTextBoxForm() {
    return this.fb.group({
      text: [''],
    });
  }

  addCompetenceForm() {
    this.getCompetenceForm().push(this.initCompetenceForm());
  }

  addSegmentForm(compIndex) {
    this.getSegmentArray(compIndex).push(this.initSegmentForm());
  }

  addQuestionForm(compIndex, segmentIndex) {
    this.getQuestionArray(compIndex, segmentIndex).push(this.initQuestionForm());
  }

  addOptionsForm(compIndex, segmentIndex, quesIndex) {
    this.getOptionsArray(compIndex, segmentIndex, quesIndex).push(this.initOptionsForm());
  }

  addMissionActivityToForm(compIndex, segmentIndex, quesIndex) {
    this.getMissionActivityArray(compIndex, segmentIndex, quesIndex).push(this.initMissionActivityAutonomyForm());
  }

  addMultipleTextboxToForm(compIndex, segmentIndex, quesIndex) {
    this.getMultipleTextboxArray(compIndex, segmentIndex, quesIndex).push(this.initMultipleTextBoxForm());
  }

  addCommentsForQuestionForm(compIndex, segmentIndex, quesIndex) {
    this.getQuestionCommentsArray(compIndex, segmentIndex, quesIndex).push(this.initCommentFormGroup());
  }

  removeMissionActivityFromForm(compIndex, segmentIndex, quesIndex, missionIndex) {
    const emptyMission = JSON.stringify(this.initMissionActivityAutonomyForm().value);
    const selectedMission = JSON.stringify(this.getMissionActivityArray(compIndex, segmentIndex, quesIndex).at(missionIndex).value);

    if (emptyMission !== selectedMission) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('this action will delete Mission Activity Entry !'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
        footer: `<span style="margin-left: auto">DASHBOARD_DELETE</span>`,
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          this.intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);
          clearInterval(this.timeOutVal);
          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(this.intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.getMissionActivityArray(compIndex, segmentIndex, quesIndex).removeAt(missionIndex);
        }
      });
    } else {
      this.getMissionActivityArray(compIndex, segmentIndex, quesIndex).removeAt(missionIndex);
    }
  }

  removeMultipleTextboxFromForm(compIndex, segmentIndex, quesIndex, textboxIndex) {
    const emptyTextbox = JSON.stringify(this.initMultipleTextBoxForm().value);
    const selectedTextbox = JSON.stringify(this.getMultipleTextboxArray(compIndex, segmentIndex, quesIndex).at(textboxIndex).value);

    if (emptyTextbox !== selectedTextbox) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('this action will delete Mission Activity Entry !'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
        footer: `<span style="margin-left: auto">DASHBOARD_DELETE</span>`,
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          this.intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);
          clearInterval(this.timeOutVal);
          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(this.intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.getMultipleTextboxArray(compIndex, segmentIndex, quesIndex).removeAt(textboxIndex);
        }
      });
    } else {
      this.getMultipleTextboxArray(compIndex, segmentIndex, quesIndex).removeAt(textboxIndex);
    }
  }

  getCompetenceForm(): UntypedFormArray {
    return this.questionResponseForm.get('competence') as UntypedFormArray;
  }

  getSegmentArray(compIndex): UntypedFormArray {
    return this.getCompetenceForm().at(compIndex).get('segment') as UntypedFormArray;
  }

  getQuestionArray(compIndex, segmentIndex): UntypedFormArray {
    return this.getSegmentArray(compIndex).at(segmentIndex).get('question') as UntypedFormArray;
  }

  getOptionsArray(compIndex, segmentIndex, quesIndex) {
    return this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('options') as UntypedFormArray;
  }

  getMissionActivityArray(compIndex, segmentIndex, quesIndex) {
    return this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('missions_activities_autonomy') as UntypedFormArray;
  }

  getMultipleTextboxArray(compIndex, segmentIndex, quesIndex) {
    return this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('multiple_textbox') as UntypedFormArray;
  }

  getQuestionCommentsArray(compIndex, segmentIndex, questionIndex): UntypedFormArray {
    return this.getQuestionArray(compIndex, segmentIndex).at(questionIndex).get('comments') as UntypedFormArray;
  }

  getGeneralCommentsArray(): UntypedFormArray {
    return this.problematicForm.get('general_comments') as UntypedFormArray;
  }
  // *************** END Form Related Functionality

  // *************** START Formatting data
  formatResponseTemplate(resp_resp) {
    const temp = _.cloneDeep(resp_resp);
    // *************** START Format response to patch to job desc form
    this.questionResponseFormId = '';
    if (temp) {
      this.questionResponseFormId = temp._id;
      const tempResponse = temp;
      if (tempResponse.competence && tempResponse.competence.length) {
        tempResponse.competence.forEach((competence, compIndex) => {
          this.addCompetenceForm();
          if (competence && competence.segment && competence.segment.length) {
            competence.segment.forEach((segment, segmentIndex) => {
              this.addSegmentForm(compIndex);
              if (segment && segment.question && segment.question.length) {
                segment.question.forEach((question, quesIndex) => {
                  this.addQuestionForm(compIndex, segmentIndex);
                  // *************** If question has option, then create form for it
                  if (question && question.options && question.options.length) {
                    question.options.forEach((option) => {
                      this.addOptionsForm(compIndex, segmentIndex, quesIndex);
                    });
                  }

                  // *************** If question have comment, then create form for it
                  if (question && question.comments && question.comments.length) {
                    question.comments.forEach((comment) => {
                      this.addCommentsForQuestionForm(compIndex, segmentIndex, quesIndex);
                      // *************** Also change the format of the date
                      if (comment.date && comment.date.date_utc && comment.date.time_utc) {
                        if (typeof comment.date.date_utc === 'string' && comment.date.date_utc.length === 10) {
                          comment.date.date_utc = this.parseUTCToLocalPipe.transformDate(comment.date.date_utc, comment.date.time_utc),
                          comment.date.time_utc = this.parseUTCToLocalPipe.transform(comment.date.time_utc);
                        }
                      }
                    });
                  }
                  // *************** If the status of the problematic is sent_to_certifier or resubmitted,
                  // then add one field that will be the new input for certifier
                  if (temp.problematic_status === 'sent_to_certifier' || temp.problematic_status === 'resubmitted_to_certifier') {
                    this.addCommentsForQuestionForm(compIndex, segmentIndex, quesIndex);
                  }

                  // *************** If Question has parent_child_options, then create form for it, using recursive function
                  if (question && question.parent_child_options && question.parent_child_options.length) {
                    question.parent_child_options.forEach((parentChildOption1, pcIndex1) => {
                      const parentChildArray1 = this.getQuestionArray(compIndex, segmentIndex)
                        .at(quesIndex)
                        .get('parent_child_options') as UntypedFormArray;
                      parentChildArray1.push(this.initParentChildOptionForm());
                      if (parentChildOption1.questions && parentChildOption1.questions.length) {
                        parentChildOption1.questions.forEach((pc1Question, pc1QuestionIndex) => {
                          const pcQuestionArray1 = parentChildArray1.at(pcIndex1).get('questions') as UntypedFormArray;
                          pcQuestionArray1.push(this.initQuestionForm());

                          if (pc1Question && pc1Question.parent_child_options && pc1Question.parent_child_options.length) {
                            this.recursiveParentChild(pcQuestionArray1, pc1Question, pc1QuestionIndex);
                          }
                        });
                      }
                    });
                  }

                  // *************** If question type is mission activities, then check if user already created it before or not,
                  //  if true then just populate. if not then create one entry by default
                  if (
                    question &&
                    question.question_type === 'mission_activity' &&
                    question.missions_activities_autonomy &&
                    question.missions_activities_autonomy.length
                  ) {
                    question.missions_activities_autonomy.forEach((activity) => {
                      this.addMissionActivityToForm(compIndex, segmentIndex, quesIndex);
                    });
                  } else if (question.question_type === 'mission_activity') {
                    this.addMissionActivityToForm(compIndex, segmentIndex, quesIndex);
                  }

                  // *************** If question type is multiple textbox, then check if user already created it before or not,
                  //  if true then just populate. if not then create one entry by default
                  if (
                    question &&
                    question.question_type === 'multiple_textbox' &&
                    question.multiple_textbox &&
                    question.multiple_textbox.length
                  ) {
                    question.multiple_textbox.forEach((textbox) => {
                      this.addMultipleTextboxToForm(compIndex, segmentIndex, quesIndex);
                    });
                  } else if (question.question_type === 'multiple_textbox') {
                    this.addMultipleTextboxToForm(compIndex, segmentIndex, quesIndex);
                  }

                  // ********** If question type is date, then transform from utc do local
                  if (question && question.question_type === 'date') {
                    if (question.answer_date && question.answer_date.date && question.answer_date.time) {
                      if (typeof question.answer_date.date === 'string' && question.answer_date.date.length === 10) {
                        question.answer_date.date = this.parseStringDatePipe.transformStringToDate(
                          this.parseUTCToLocalPipe.transformDate(question.answer_date.date, question.answer_date.time),
                        );
                        question.answer_date.time = this.parseUTCToLocalPipe.transform(question.answer_date.time);
                      }
                    }
                  }
                });
              }
            });
          }
        });
      }
      // this.questionResponseForm.patchValue(tempResponse);
      const tempResult = _.omitBy(tempResponse, _.isNil);

      return tempResult;
    }
    // *************** END Format data to patch to job desc form
    this.updateActivatedBlock();
    this.removeUnSelectedIndexBlock();
  }

  recursiveParentChild(pcQuestionArray: UntypedFormArray, pcQuestionData, pcQuestionIndex) {
    pcQuestionData.parent_child_options.forEach((parentChildOption2, pcIndex2) => {
      const parentChildArray = pcQuestionArray.at(pcQuestionIndex).get('parent_child_options') as UntypedFormArray;
      parentChildArray.push(this.initParentChildOptionForm());
      if (parentChildOption2.questions && parentChildOption2.questions.length) {
        parentChildOption2.questions.forEach((pc2Question, pc2QuestionIndex) => {
          const pcQuestionArray2 = parentChildArray.at(pcIndex2).get('questions') as UntypedFormArray;
          pcQuestionArray2.push(this.initQuestionForm());
          if (pc2Question && pc2Question.parent_child_options && pc2Question.parent_child_options.length) {
            this.recursiveParentChild(pcQuestionArray2, pc2Question, pc2QuestionIndex);
          }
        });
      }
    });
  }


  // *************** END Formatting data



  renderBlockHideAndShow(competence, compIndex: number) {
    if (competence.block_type === 'always_visible') {
      return true;
    } else if (competence.block_type === 'router') {
      return true;
    }
    let finalDecide = false;

    for (let i = 0; i < this.relatedBlockIndex.length; i++) {
      if (compIndex === this.relatedBlockIndex[i]) {
        finalDecide = true;
        break;
      }
    }
    return finalDecide;
  }

  selectionForMultiple(event: MatCheckboxChange, option: string, compIndex: number, segmentIndex: number, quesIndex: number) {
    if (event && event.checked) {
      const data = _.cloneDeep(this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer_multiple').value);
      if (!data.includes(option)) {
        data.push(option);
      }
      this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer_multiple').patchValue(data);
    } else {
      const data = _.cloneDeep(this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer_multiple').value);
      if (data.includes(option)) {
        const index = data.indexOf(option);
        data.splice(index, 1);
      }
      this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer_multiple').patchValue(data);
    }
  }

  isCheckboxMultipleOn(option: string, compIndex: number, segmentIndex: number, quesIndex: number) {
    let result = false;
    const data = this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer_multiple').value;
    if (data && data.length && option) {
      if (data.includes(option)) {
        result = true;
      }
    }
    return result;
  }

  onChangeSingleOption(comp) {
    if (comp.block_type === 'router') {
      this.updateActivatedBlock();
      this.removeUnSelectedIndexBlock();
    }
  }

  updateActivatedBlock() {
    this.relatedBlockIndex = [];
    const competences = this.getCompetenceForm().value;
    if (competences && competences.length) {
      competences.forEach((comp, compIndex) => {
        if (comp.block_type === 'router' && comp.segment && comp.segment.length) {
          comp.segment.forEach((segment, segmentIndex) => {
            if (segment.question && segment.question.length) {
              segment.question.forEach((question, quesIndex) => {
                if (question.question_type === 'single_option' && question.options && question.options.length) {
                  question.options.forEach((option) => {
                    if (option.related_block_index && option.option_text === question.answer) {
                      this.relatedBlockIndex.push(option.related_block_index);
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  }

  removeUnSelectedIndexBlock() {
    const competences = this.getCompetenceForm().value;
    for (let i = 0; i < competences.length; i++) {
      if (competences[i].block_type === 'visible_on_option') {
        const findIndex = _.find(this.relatedBlockIndex, function (element) {
          return element === i;
        });
        if (findIndex === undefined) {
          for (let j = 0; j < competences[i].segment.length; j++) {
            for (let k = 0; k < competences[i].segment[j].question.length; k++) {
              competences[i].segment[j].question[k].answer = '';
              competences[i].segment[j].question[k].answer_multiple = [];

              if (competences[i].segment[j].question[k].question_type === 'parent_child') {
                const parentChild1 = competences[i].segment[j].question[k].parent_child_options;
                for (let p1 = 0; p1 < parentChild1.length; p1++) {
                  for (let p2 = 0; p2 < competences[i].segment[j].question[k].parent_child_options[p1].questions.length; p2++) {
                    competences[i].segment[j].question[k].parent_child_options[p1].questions[p2].answer = '';
                    for (
                      let p3 = 0;
                      p3 < competences[i].segment[j].question[k].parent_child_options[p1].questions[p2].parent_child_options.length;
                      p3++
                    ) {
                      for (
                        let p4 = 0;
                        p4 <
                        competences[i].segment[j].question[k].parent_child_options[p1].questions[p2].parent_child_options[p3].questions
                          .length;
                        p4++
                      ) {
                        competences[i].segment[j].question[k].parent_child_options[p1].questions[p2].parent_child_options[p3].questions[
                          p4
                        ].answer = '';
                        for (
                          let p5 = 0;
                          p5 <
                          competences[i].segment[j].question[k].parent_child_options[p1].questions[p2].parent_child_options[p3].questions[
                            p4
                          ].parent_child_options.length;
                          p5++
                        ) {
                          for (
                            let p6 = 0;
                            p6 <
                            competences[i].segment[j].question[k].parent_child_options[p1].questions[p2].parent_child_options[p3].questions[
                              p4
                            ].parent_child_options[p5].questions.length;
                            p6++
                          ) {
                            competences[i].segment[j].question[k].parent_child_options[p1].questions[p2].parent_child_options[p3].questions[
                              p4
                            ].parent_child_options[p5].questions[p6].answer = '';
                          } // End for p6
                        } // End for p5
                      } // End for p4
                    } // End for p3
                  } // End for p2
                } // End for p1
              } // End if checking parentChild type
            } // End loop index k
          } // End loop index j
        }
      } // End if
    } // End loop with index i
    //
  }

  onChangeParentChild(
    value,
    option,
    index: { competenceIndex: number; segmentIndex: number; questionIndex: number },
    parent: number,
    child: number,
  ) {


    const competences = this.getCompetenceForm().value;
    const parentChild1 = competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options;
    for (let p1 = 0; p1 < parentChild1.length; p1++) {
      for (
        let p2 = 0;
        p2 <
        competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[p1].questions
          .length;
        p2++
      ) {
        competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[p1].questions[
          p2
        ].answer = '';
        for (
          let p3 = 0;
          p3 <
          competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[p1].questions[
            p2
          ].parent_child_options.length;
          p3++
        ) {
          for (
            let p4 = 0;
            p4 <
            competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[p1].questions[
              p2
            ].parent_child_options[p3].questions.length;
            p4++
          ) {
            competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[p1].questions[
              p2
            ].parent_child_options[p3].questions[p4].answer = '';
            for (
              let p5 = 0;
              p5 <
              competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[p1]
                .questions[p2].parent_child_options[p3].questions[p4].parent_child_options.length;
              p5++
            ) {
              for (
                let p6 = 0;
                p6 <
                competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[p1]
                  .questions[p2].parent_child_options[p3].questions[p4].parent_child_options[p5].questions.length;
                p6++
              ) {
                competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[
                  p1
                ].questions[p2].parent_child_options[p3].questions[p4].parent_child_options[p5].questions[p6].answer = '';
              } // End for p6
            } // End for p5
          } // End for p4
        } // End for p3
      } // End for p2
    } // End for p1
  } // End if checking parentChild type

  onChangeParentChild2(
    value,
    option,
    index: { competenceIndex: number; segmentIndex: number; questionIndex: number },
    parent: number,
    child: number,
  ) {
    const competences = this.getCompetenceForm().value;
    for (
      let i = 0;
      i <
      competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[parent].questions[
        child
      ].parent_child_options.length;
      i++
    ) {
      if (
        competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[parent].questions[
          child
        ].parent_child_options[i].questions[child] !== undefined
      ) {
        competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[parent].questions[
          child
        ].parent_child_options[i].questions[child].answer = '';
      }
    }

    // this.getCompetenceForm().patchValue(competences);
  }

  cancelPreview() {
    this.router.navigate(['/questionnaire-tools']);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
