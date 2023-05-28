import { Component, Input, OnChanges, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { DateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { removeSpaces, requiredTrueIfValidator } from 'app/service/customvalidator.validator';
import { ProblematicService } from 'app/service/problematic/problematic.service';
import { StudentsService } from 'app/service/students/students.service';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ProblematicRejectionDialogComponent } from 'app/shared/components/problematic-rejection-dialog/problematic-rejection-dialog.component';
import { SpeechToTextDialogComponent } from 'app/shared/components/speech-to-text-dialog/speech-to-text-dialog.component';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { STYLE } from 'app/title-rncp/conditions/class-condition/score/second-step-score/condition-score-preview/pdf-styles';
import { environment } from 'environments/environment';
import * as _ from 'lodash';
import * as moment from 'moment';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { ProblematicPDFComponent } from '../problematic-pdf/problematic-pdf.component';
import { RespProblematicImported } from '../problematic.model';

@Component({
  selector: 'ms-new-problematic-form',
  templateUrl: './new-problematic-form.component.html',
  styleUrls: ['./new-problematic-form.component.scss'],
  providers: [ParseLocalToUtcPipe, ParseUtcToLocalPipe, ParseStringDatePipe],
})
export class NewProblematicFormComponent implements OnInit, OnDestroy, OnChanges {
  private subs = new SubSink();
  @Input() studentId = '';
  @Input() studentPrevCourseData?: any;
  @Input() schoolId: string;
  @Input() classId: string;
  @Input() titleId: string;
  @Input() historyData: string;
  @Input() problematicId: string;

  @ViewChild('problematicPDF', { static: false }) problematicPDF: ProblematicPDFComponent;
  problematicType = 'new';
  problematicForm: UntypedFormGroup;
  questionResponseForm: UntypedFormGroup;
  questionResponseFormId: string;

  intVal: any;
  timeOutVal: any;

  studentData;
  problematicData;
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

  IsFinalTranscriptStarted = false;
  isStudent = false;
  isADMTC = false;
  isAcadDirAdmin = false;
  isCertifierDirAdmin = false;
  allowEditForm = false;

  relatedBlockIndex = [];

  isWaitingForResponse = false;

  public Editor = DecoupledEditor;
  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  constructor(
    private problematicService: ProblematicService,
    private fb: UntypedFormBuilder,
    private studentService: StudentsService,
    public utilService: UtilityService,
    private translate: TranslateService,
    public dialog: MatDialog,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private dateAdapter: DateAdapter<Date>,
    private transcriptBuilderService: TranscriptBuilderService,
  ) {}

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.checkFinalTranscripsIsStarted();
    this.problematicForm = null;
    this.questionResponseForm = null;
    this.getDataInit();
  }

  ngOnChanges() {
    this.subs.unsubscribe();
    this.getDataInit();
  }

  getDataInit() {
    // ************ Get Data User for permission of button
    this.isADMTC = this.utilService.isUserEntityADMTC();
    this.isAcadDirAdmin = this.utilService.isUserAcadDirAdmin();
    this.isCertifierDirAdmin = this.utilService.isUserCRDirAdmin();
    this.isStudent = this.utilService.isUserStudent();






    // ************** Reset Data
    this.statusCard = {
      sent_to_student: false,
      sent_to_acadDpt: false,
      rejected_by_acadDpt: false,
      validated_by_acadDpt: false,
      sent_to_certifier: false,
      rejected_by_certifier: false,
      validated_by_certifier: false,
      resubmitted_to_certifier: false,
    };
    this.problematicForm = null;
    this.problematicData = null;
    this.questionResponseForm = null;

    // this.initForm();
    this.getStudentData();
    this.getProblematicData();
    this.getProblematicCorrectorData();
  }

  initForm() {
    this.problematicForm = this.fb.group({
      student_id: [this.studentId, [Validators.required]],
      school_id: [this.schoolId, [Validators.required]],
      rncp_id: [this.titleId, [Validators.required]],
      class_id: [this.classId, [Validators.required]],
      date: this.fb.group({
        date_utc: moment().format('DD/MM/YYYY'),
        time_utc: ['00:01'],
      }),
      general_comments: this.fb.array([]),
      signature_of_the_student: [
        false,
        [requiredTrueIfValidator(() => this.problematicData && this.problematicData.problematic_status === 'sent_to_student')],
      ],
      signature_of_the_acad_dir: [
        false,
        [requiredTrueIfValidator(() => this.problematicData && this.problematicData.problematic_status === 'sent_to_acadDpt')],
      ],
      signature_of_the_certifier: [
        false,
        [requiredTrueIfValidator(() => this.problematicData && this.problematicData.problematic_status === 'sent_to_certifier')],
      ],
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
        footer: `<span style="margin-left: auto">DASHBOARD_DELETE</span>`,
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
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
        footer: `<span style="margin-left: auto">DASHBOARD_DELETE</span>`,
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
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

  getStudentData() {
    if (this.studentPrevCourseData) {
      this.subs.sink = this.studentService
        .getStudentsPreviousCourseJobDescIdentityData(
          this.schoolId,
          this.studentPrevCourseData.rncp_title._id,
          this.studentPrevCourseData.current_class._id,
          this.studentId,
        )
        .subscribe((resp_student) => {
          // student's previous course data
          if (resp_student && resp_student[0]) {
            const tempData = _.cloneDeep(resp_student[0]);
            this.setStudentData(tempData);
          }
        });
    } else {
      this.subs.sink = this.studentService.getStudentsJobDescIdentityData(this.studentId).subscribe((resp_student) => {
        const tempData = _.cloneDeep(resp_student);
        this.setStudentData(tempData);
      });
    }
  }

  setStudentData(tempData) {
    if (this.historyData) {
      tempData.companies = tempData.companies.filter(
        (company) => company.problematic_id && company.problematic_id._id === this.problematicId,
      );
    } else {
      if (tempData && tempData.companies && tempData.companies.length) {
        tempData.companies = tempData.companies.filter((company) => company.status === 'active');
      }
    }
    this.studentData = tempData;
  }

  getProblematicData() {
    this.subs.sink = this.problematicService.getOneProblematicTemplate(this.problematicId).subscribe((resp_prob) => {


      this.problematicData = _.cloneDeep(resp_prob);
      this.initForm();

      // *************** Process the status of the job desc
      this.processStatusCard();

      const formattedData = this.formatProblematic(_.cloneDeep(resp_prob));
      this.problematicForm.patchValue(formattedData);

      const formattedResponseData = this.formatResponseTemplate(_.cloneDeep(resp_prob));
      this.questionResponseForm.patchValue(formattedResponseData);
      this.autoPopulateFieldsAnswer();





    });
  }

  getProblematicCorrectorData() {
    const currentUser = this.utilService.getCurrentUser();
    this.subs.sink = this.problematicService.getAllProblematicCorrector(this.titleId, this.schoolId, currentUser._id).subscribe((resp) => {

      if (resp && resp.length) {
        this.isCertifierDirAdmin = true;
        this.processStatusCard();
      }
    });
  }

  getQuestionCommentsArray(compIndex, segmentIndex, questionIndex): UntypedFormArray {
    return this.getQuestionArray(compIndex, segmentIndex).at(questionIndex).get('comments') as UntypedFormArray;
  }

  getGeneralCommentsArray(): UntypedFormArray {
    return this.problematicForm.get('general_comments') as UntypedFormArray;
  }

  formatProblematic(resp_prob: RespProblematicImported) {
    const temp: any = resp_prob;
    if (temp.student_id && temp.student_id._id) {
      temp.student_id = temp.student_id._id;
    }
    if (temp.school_id && temp.school_id._id) {
      temp.school_id = temp.school_id._id;
    }
    if (temp.rncp_id && temp.rncp_id._id) {
      temp.rncp_id = temp.rncp_id._id;
    }
    if (temp.class_id && temp.class_id._id) {
      temp.class_id = temp.class_id._id;
    }

    if (temp.date && temp.date.date_utc && temp.date.time_utc) {
      temp.date = {
        date_utc: this.parseUTCToLocalPipe.transformDate(temp.date.date_utc, temp.date.time_utc),
        time_utc: this.parseUTCToLocalPipe.transform(temp.date.time_utc),
      };
    } else {
      delete temp.date;
    }

    if (temp.general_comments && temp.general_comments.length) {
      temp.general_comments.forEach((gen_comment) => {
        this.getGeneralCommentsArray().push(this.initCommentFormGroup());
        if (gen_comment.date && gen_comment.date.date_utc && gen_comment.date.time_utc) {
          gen_comment.date = {
            date_utc: this.parseUTCToLocalPipe.transformDate(gen_comment.date.date_utc, gen_comment.date.time_utc),
            time_utc: this.parseUTCToLocalPipe.transform(gen_comment.date.time_utc),
          };
        } else {
          delete gen_comment.date;
        }
      });
    }

    // *************** If the status of the problematic is sent_to_certifier or resubmitted,
    // then add one field that will be the new input for certifier
    if (temp.problematic_status === 'sent_to_certifier' || temp.problematic_status === 'resubmitted_to_certifier') {
      this.getGeneralCommentsArray().push(this.initCommentFormGroup());
    }

    const tempResult = _.omitBy(temp, _.isNil);

    return tempResult;
  }

  formatResponseTemplate(resp_resp) {
    const temp = _.cloneDeep(resp_resp);
    // *************** START Format response to patch to job desc form
    this.questionResponseFormId = '';
    if (temp && temp.questionnaire_template_response_id) {
      this.questionResponseFormId = temp.questionnaire_template_response_id._id;
      const tempResponse = temp.questionnaire_template_response_id;
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
                          (comment.date.date_utc = this.parseUTCToLocalPipe.transformDate(comment.date.date_utc, comment.date.time_utc)),
                            (comment.date.time_utc = this.parseUTCToLocalPipe.transform(comment.date.time_utc));
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
    // *************** END Format data to patch to problematic
    this.updateActivatedBlock();
    this.removeUnSelectedIndexBlock();
  }

  autoPopulateFieldsAnswer() {
    const competences = this.getCompetenceForm().value;
    competences.forEach((competence, compIndex) => {
      if (competence && competence.segment && competence.segment.length) {
        competence.segment.forEach((segment, segmentIndex) => {
          if (segment && segment.question && segment.question.length) {
            segment.question.forEach((quest, quesIndex) => {
              if (quest.questionnaire_field_key === 'STUDENT_CIVILITY' && !quest.answer) {
                const answer = this.studentData && this.studentData.civility ? this.studentData.civility : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'STUDENT_FIRST_NAME' && !quest.answer) {
                const answer = this.studentData && this.studentData.first_name ? this.studentData.first_name : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'STUDENT_LAST_NAME' && !quest.answer) {
                const answer = this.studentData && this.studentData.last_name ? this.studentData.last_name : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'STUDENT_ADDR_1' && !quest.answer) {
                const answer =
                  this.studentData &&
                  this.studentData.student_address &&
                  this.studentData.student_address[0] &&
                  this.studentData.student_address[0].address
                    ? this.studentData.student_address[0].address
                    : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'STUDENT_ADDR_2' && !quest.answer) {
                const answer =
                  this.studentData &&
                  this.studentData.student_address &&
                  this.studentData.student_address[1] &&
                  this.studentData.student_address[1].address
                    ? this.studentData.student_address[1].address
                    : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'STUDENT_POSTAL_CODE' && !quest.answer) {
                const answer =
                  this.studentData &&
                  this.studentData.student_address &&
                  this.studentData.student_address[0] &&
                  this.studentData.student_address[0].postal_code
                    ? this.studentData.student_address[0].postal_code
                    : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'STUDENT_CITY' && !quest.answer) {
                const answer =
                  this.studentData &&
                  this.studentData.student_address &&
                  this.studentData.student_address[0] &&
                  this.studentData.student_address[0].city
                    ? this.studentData.student_address[0].city
                    : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'STUDENT_COUNTRY' && !quest.answer) {
                const answer =
                  this.studentData &&
                  this.studentData.student_address &&
                  this.studentData.student_address[0] &&
                  this.studentData.student_address[0].country
                    ? this.studentData.student_address[0].country
                    : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'STUDENT_MOBILE' && !quest.answer) {
                const answer = this.studentData && this.studentData.tele_phone ? this.studentData.tele_phone : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'STUDENT_FIX_PHONE' && !quest.answer) {
                // *************** Not Sure what is fix phone
                const answer = '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'STUDENT_PERSONAL_EMAIL' && !quest.answer) {
                const answer = this.studentData && this.studentData.email ? this.studentData.email : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'STUDENT_PROFESSIONAL_EMAIL' && !quest.answer) {
                const answer = this.studentData && this.studentData.professional_email ? this.studentData.professional_email : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'STUDENT_DIPLOMA' && !quest.answer) {
                // *************** Not Sure what is diploma, does not exists in v2 student
                const answer = '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'STUDENT_SCHOOL' && !quest.answer) {
                // *************** Not Sure what is diploma, does not exists in v2 student
                const answer = this.studentData && this.studentData.school ? this.studentData.school.short_name : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              }
              else if (quest.questionnaire_field_key === 'PARENT_RELATION' && !quest.answer) {
                const answer =
                  this.studentData && this.studentData.parents && this.studentData.parents[0] && this.studentData.parents[0].relation
                    ? this.studentData.parents[0].relation
                    : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'PARENT_CIVILITY' && !quest.answer) {
                const answer =
                  this.studentData && this.studentData.parents && this.studentData.parents[0] && this.studentData.parents[0].civility
                    ? this.studentData.parents[0].civility
                    : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'PARENT_FIRST_NAME' && !quest.answer) {
                const answer =
                  this.studentData && this.studentData.parents && this.studentData.parents[0] && this.studentData.parents[0].name
                    ? this.studentData.parents[0].name
                    : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'PARENT_LAST_NAME' && !quest.answer) {
                const answer =
                  this.studentData && this.studentData.parents && this.studentData.parents[0] && this.studentData.parents[0].family_name
                    ? this.studentData.parents[0].family_name
                    : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'PARENT_ADDR_1' && !quest.answer) {
                const answer =
                  this.studentData &&
                  this.studentData.parents &&
                  this.studentData.parents[0] &&
                  this.studentData.parents[0].parent_address &&
                  this.studentData.parents[0].parent_address[0] &&
                  this.studentData.parents[0].parent_address[0].address
                    ? this.studentData.parents[0].parent_address[0].address
                    : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'PARENT_ADDR_2' && !quest.answer) {
                const answer =
                  this.studentData &&
                  this.studentData.parents &&
                  this.studentData.parents[0] &&
                  this.studentData.parents[0].parent_address &&
                  this.studentData.parents[0].parent_address[1] &&
                  this.studentData.parents[0].parent_address[1].address
                    ? this.studentData.parents[0].parent_address[1].address
                    : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'PARENT_POSTAL_CODE' && !quest.answer) {
                const answer =
                  this.studentData &&
                  this.studentData.parents &&
                  this.studentData.parents[0] &&
                  this.studentData.parents[0].parent_address &&
                  this.studentData.parents[0].parent_address[0] &&
                  this.studentData.parents[0].parent_address[0].postal_code
                    ? this.studentData.parents[0].parent_address[0].postal_code
                    : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'PARENT_CITY' && !quest.answer) {
                const answer =
                  this.studentData &&
                  this.studentData.parents &&
                  this.studentData.parents[0] &&
                  this.studentData.parents[0].parent_address &&
                  this.studentData.parents[0].parent_address[0] &&
                  this.studentData.parents[0].parent_address[0].city
                    ? this.studentData.parents[0].parent_address[0].city
                    : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'PARENT_COUNTRY' && !quest.answer) {
                const answer =
                  this.studentData &&
                  this.studentData.parents &&
                  this.studentData.parents[0] &&
                  this.studentData.parents[0].parent_address &&
                  this.studentData.parents[0].parent_address[0] &&
                  this.studentData.parents[0].parent_address[0].country
                    ? this.studentData.parents[0].parent_address[0].country
                    : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'PARENT_MOBILE' && !quest.answer) {
                const answer =
                  this.studentData && this.studentData.parents && this.studentData.parents[0] && this.studentData.parents[0].tele_phone
                    ? this.studentData.parents[0].tele_phone
                    : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'PARENT_JOB' && !quest.answer) {
                const answer =
                  this.studentData && this.studentData.parents && this.studentData.parents[0] && this.studentData.parents[0].job
                    ? this.studentData.parents[0].job
                    : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'PARENT_PERSONAL_EMAIL' && !quest.answer) {
                const answer =
                  this.studentData && this.studentData.parents && this.studentData.parents[0] && this.studentData.parents[0].email
                    ? this.studentData.parents[0].email
                    : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              } else if (quest.questionnaire_field_key === 'PARENT_PROFESSIONAL_EMAIL' && !quest.answer) {
                const answer =
                  this.studentData &&
                  this.studentData.parents &&
                  this.studentData.parents[0] &&
                  this.studentData.parents[0].professional_email
                    ? this.studentData.parents[0].professional_email
                    : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              }
            });
          }
        });
      }
    });
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

  processStatusCard() {
    // ************** Reset first, so if triggered by ngonchanges, data of old job desc(other student) not corrupting the data
    this.statusCard = {
      sent_to_student: false,
      sent_to_acadDpt: false,
      rejected_by_acadDpt: false,
      validated_by_acadDpt: false,
      sent_to_certifier: false,
      rejected_by_certifier: false,
      validated_by_certifier: false,
      resubmitted_to_certifier: false,
    };
    this.allowEditForm = false;
    if (this.problematicData) {
      switch (this.problematicData.problematic_status) {
        case 'sent_to_student':
          this.statusCard.sent_to_student = true;
          if (this.isADMTC || this.isStudent || this.isAcadDirAdmin) {
            this.allowEditForm = true;
          }
          break;
        case 'sent_to_acadDpt':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_acadDpt = true;
          if (this.isADMTC || this.isAcadDirAdmin) {
            this.allowEditForm = true;
          }
          break;
        case 'rejected_by_acadDpt':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_acadDpt = true;
          this.statusCard.rejected_by_acadDpt = true;
          if (this.isADMTC || this.isStudent || this.isAcadDirAdmin) {
            this.allowEditForm = true;
          }
          break;
        case 'validated_by_acadDpt':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_acadDpt = true;
          this.statusCard.validated_by_acadDpt = true;
          if (this.isADMTC || this.isCertifierDirAdmin || this.isAcadDirAdmin) {
            this.allowEditForm = true;
          }
          break;
        case 'sent_to_certifier':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_acadDpt = true;
          this.statusCard.validated_by_acadDpt = true;
          this.statusCard.sent_to_certifier = true;
          if (this.isADMTC || this.isCertifierDirAdmin) {
            this.allowEditForm = true;
          }
          break;
        case 'rejected_by_certifier':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_acadDpt = true;
          this.statusCard.validated_by_acadDpt = true;
          this.statusCard.sent_to_certifier = true;
          this.statusCard.rejected_by_certifier = true;
          if (this.isADMTC || this.isStudent || this.isAcadDirAdmin) {
            this.allowEditForm = true;
          }
          break;
        case 'validated_by_certifier':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_acadDpt = true;
          this.statusCard.validated_by_acadDpt = true;
          this.statusCard.sent_to_certifier = true;
          this.statusCard.validated_by_certifier = true;
          break;
        case 'resubmitted_to_certifier':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_acadDpt = true;
          this.statusCard.validated_by_acadDpt = true;
          this.statusCard.sent_to_certifier = true;
          this.statusCard.resubmitted_to_certifier = true;
          if (this.isADMTC || this.isCertifierDirAdmin) {
            this.allowEditForm = true;
          }
          break;
        default:
          break;
      }
    }

    // ************** ADMTC always able to edit the form
    if (this.isADMTC) {
      this.allowEditForm = true;
    }


  }

  createPayload() {
    const payload = _.cloneDeep(this.problematicForm.value);

    if (payload.date) {
      if (payload.date.date_utc && payload.date.time_utc) {
        payload.date.date_utc = this.parseLocalToUTCPipe.transformDate(payload.date.date_utc, payload.date.time_utc);
        payload.date.time_utc = this.parseLocalToUTCPipe.transform(payload.date.time_utc);
      }
    }

    if (payload.general_comments && payload.general_comments.length) {
      payload.general_comments.forEach((gen_comment) => {
        if (gen_comment && gen_comment.date && gen_comment.date.date_utc && gen_comment.date.time_utc) {
          gen_comment.date.date_utc = this.parseLocalToUTCPipe.transformDate(gen_comment.date.date_utc, gen_comment.date.time_utc);
          gen_comment.date.time_utc = this.parseLocalToUTCPipe.transform(gen_comment.date.time_utc);
        }
      });
    }

    return payload;
  }

  createPayloadResponse() {
    const payload = _.cloneDeep(this.questionResponseForm.value);

    if (payload && payload.competence && payload.competence.length) {
      payload.competence.forEach((competence, compIndex) => {
        if (competence && competence.segment && competence.segment.length) {
          competence.segment.forEach((segment, segmentIndex) => {
            if (segment && segment.question && segment.question.length) {
              segment.question.forEach((question, questIndex) => {
                if (question.answer_date.date) {
                  if (!question.answer_date.time) {
                    question.answer_date.time = '00:00';
                  }
                  question.answer_date.date = this.parseLocalToUTCPipe.transformDate(
                    moment(question.answer_date.date).format('DD/MM/YYYY'),
                    question.answer_date.time,
                  );
                  question.answer_date.time = this.parseLocalToUTCPipe.transform(question.answer_date.time);
                }
                if (question.comments && question.comments.length) {
                  question.comments.forEach((comment) => {
                    if (comment && comment.date && comment.date.date_utc && comment.date.time_utc) {
                      comment.date.date_utc = this.parseLocalToUTCPipe.transformDate(comment.date.date_utc, comment.date.time_utc);
                      comment.date.time_utc = this.parseLocalToUTCPipe.transform(comment.date.time_utc);
                    }
                  });
                }
              });
            }
          });
        }
      });
    }

    return payload;
  }

  createPayloadRejectAcad(result) {

    const payload = {
      _id: this.problematicId,
      reason_of_rejection: result && result.description ? result.description : '',
      rejection_date: {
        date: this.getCurrentUtcDate(),
        time: this.getCurrentUtcTime(),
      },
      task_input: result,
      lang: this.translate.currentLang,
    };


    return payload;
  }

  getCurrentUtcDate() {
    return moment.utc().format('DD/MM/YYYY');
  }

  getCurrentUtcTime() {
    return moment.utc().format('HH:mm');
  }

  createPayloadRejectCertifier() {
    const payload = {
      _id: this.problematicId,
      rejection_date: {
        date: this.parseLocalToUTCPipe.transformDate(moment().format('DD/MM/YYYY'), '00:01'),
        time: this.parseLocalToUTCPipe.transform('00:01'),
      },
      lang: this.translate.currentLang,
    };


    return payload;
  }

  saveForm() {
    const payloadResponse = this.createPayloadResponse();


    this.subs.sink = this.problematicService
      .updateQuestionnaireResponse(payloadResponse, this.questionResponseFormId)
      .subscribe((response) => {
        if (response) {
          const payload = this.createPayload();

          this.subs.sink = this.problematicService
            .updateProblematic(payload, this.problematicId, this.translate.currentLang)
            .subscribe((resp) => {

              if (this.isADMTC || this.isAcadDirAdmin) {
                Swal.fire({
                  type: 'info',
                  title: this.translate.instant('PROB_S15.TITLE'),
                  html: this.translate.instant('PROB_S15.TEXT'),
                  footer: `<span style="margin-left: auto">PROB_S15</span>`,
                  confirmButtonText: this.translate.instant('PROB_S15.BUTTON'),
                  allowEnterKey: false,
                  allowEscapeKey: false,
                  allowOutsideClick: false,
                });
              } else {
                Swal.fire({
                  type: 'info',
                  title: this.translate.instant('PROB_S2.TITLE'),
                  html: this.translate.instant('PROB_S2.TEXT'),
                  footer: `<span style="margin-left: auto">PROB_S2</span>`,
                  confirmButtonText: this.translate.instant('PROB_S2.BUTTON'),
                  allowEnterKey: false,
                  allowEscapeKey: false,
                  allowOutsideClick: false,
                });
              }
            });
        }
      });
  }

  submitForm(type: string) {
    if (type === 'certifier') {
      const fullName =
        this.translate.instant(this.studentData.civility) + ' ' + this.studentData.last_name + ' ' + this.studentData.first_name;
      Swal.fire({
        type: 'question',
        title: this.translate.instant('PROB_S6.TITLE'),
        html: this.translate.instant('PROB_S6.TEXT', { studentFullName: fullName }),
        footer: `<span style="margin-left: auto">PROB_S6</span>`,
        confirmButtonText: this.translate.instant('PROB_S6.BUTTON1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('PROB_S6.BUTTON2'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.value) {
          this.submitCallApi(type);
        }
      });
    } else if (type === 'academic' || type === 'student') {
      this.submitCallApi(type);
    }
  }

  submitCallApi(type: string) {
    const payloadResponse = this.createPayloadResponse();


    this.isWaitingForResponse = true;
    this.subs.sink = this.problematicService.updateQuestionnaireResponse(payloadResponse, this.questionResponseFormId).subscribe(
      (response) => {
        this.isWaitingForResponse = false;
        if (response) {
          const payload = this.createPayload();
          this.isWaitingForResponse = true;
          this.subs.sink = this.problematicService.updateProblematic(payload, this.problematicId, this.translate.currentLang).subscribe(
            (resp) => {

              this.isWaitingForResponse = false;
              if (resp) {
                this.isWaitingForResponse = true;
                this.subs.sink = this.problematicService
                  .submitStudentFormProblematic(this.problematicId, this.translate.currentLang)
                  .subscribe(
                    (resp_submit) => {

                      this.isWaitingForResponse = false;
                      if (resp_submit && type === 'student') {
                        if (this.problematicData && this.problematicData.problematic_status) {
                          if (this.problematicData.problematic_status === 'sent_to_student') {
                            this.triggerSwalProbS3();
                          } else {
                            this.triggerSwalProbS10();
                          }
                        }
                      } else if (resp_submit && type === 'academic') {
                        this.triggerSwalProbS4();
                      } else if (resp_submit && type === 'certifier') {
                        this.triggerSwalProbS7();
                      }
                    },
                    (err) => {
                      this.isWaitingForResponse = false;
                      Swal.fire({
                        type: 'error',
                        title: 'Error',
                        text: err && err['message'] ? err['message'] : err,
                        confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
                      });
                    },
                  );
              }
            },
            (err) => {
              this.isWaitingForResponse = false;
              Swal.fire({
                type: 'error',
                title: 'Error',
                text: err && err['message'] ? err['message'] : err,
                confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
              });
            },
          );
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  rejectFormAcad() {
    const fullName =
      this.translate.instant(this.studentData.civility) + ' ' + this.studentData.last_name + ' ' + this.studentData.first_name;
    Swal.fire({
      type: 'question',
      title: this.translate.instant('PROB_S5.TITLE'),
      html: this.translate.instant('PROB_S5.TEXT', { studentFullName: fullName }),
      confirmButtonText: this.translate.instant('PROB_S5.BUTTON1'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('PROB_S5.BUTTON2'),
      footer: `<span style="margin-left: auto">PROB_S5</span>`,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((res) => {
      if (res.value) {
        this.dialog
          .open(ProblematicRejectionDialogComponent, {
            width: '600px',
            minHeight: '300px',
            disableClose: true,
            data: this.studentData,
          })
          .afterClosed()
          .subscribe((result) => {
            if (result) {
              const payloadResponse = this.createPayloadResponse();
              const payloadReject = this.createPayloadRejectAcad(result);

              this.subs.sink = this.problematicService
                .updateQuestionnaireResponse(payloadResponse, this.questionResponseFormId)
                .subscribe((response) => {
                  if (response) {
                    const payload = this.createPayload();
                    this.subs.sink = this.problematicService
                      .updateProblematic(payload, this.problematicId, this.translate.currentLang)
                      .subscribe((resp) => {

                        if (resp) {
                          const payloadReject = this.createPayloadRejectAcad(result);
                          this.subs.sink = this.problematicService.rejectFormProblematicAcad(payloadReject).subscribe((response) => {

                            if (response) {
                              this.ngOnInit();
                            }
                          });
                        }
                      });
                  }
                });
            }
          });
      }
    });
  }

  rejectFormCertifier() {
    const fullName =
      this.translate.instant(this.studentData.civility) + ' ' + this.studentData.last_name + ' ' + this.studentData.first_name;
    Swal.fire({
      type: 'question',
      title: this.translate.instant('PROB_S8.TITLE'),
      html: this.translate.instant('PROB_S8.TEXT', { studentFullName: fullName }),
      confirmButtonText: this.translate.instant('PROB_S8.BUTTON1'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('PROB_S8.BUTTON2'),
      footer: `<span style="margin-left: auto">PROB_S8</span>`,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        const payloadResponse = this.createPayloadResponse();
        this.subs.sink = this.problematicService
          .updateQuestionnaireResponse(payloadResponse, this.questionResponseFormId)
          .subscribe((response) => {
            if (response) {
              const payload = this.createPayload();
              this.subs.sink = this.problematicService
                .updateProblematic(payload, this.problematicId, this.translate.currentLang)
                .subscribe((resp) => {

                  if (resp) {
                    const payloadReject = this.createPayloadRejectCertifier();
                    this.subs.sink = this.problematicService.rejectFormProblematicCertifier(payloadReject).subscribe((response) => {

                      if (response) {
                        this.ngOnInit();
                      }
                    });
                  }
                });
            }
          });
      }
    });
  }

  triggerSwalProbS3() {
    Swal.fire({
      type: 'success',
      title: this.translate.instant('PROB_S3.TITLE'),
      html: this.translate.instant('PROB_S3.TEXT'),
      confirmButtonText: this.translate.instant('PROB_S3.BUTTON'),
      footer: `<span style="margin-left: auto">PROB_S3</span>`,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      this.problematicForm = null;
      this.ngOnInit();
    });
  }

  triggerSwalProbS4() {
    Swal.fire({
      type: 'success',
      title: this.translate.instant('PROB_S4.TITLE'),
      html: this.translate.instant('PROB_S4.TEXT'),
      confirmButtonText: this.translate.instant('PROB_S4.BUTTON'),
      footer: `<span style="margin-left: auto">PROB_S4</span>`,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      this.problematicForm = null;
      this.ngOnInit();
    });
  }

  triggerSwalProbS7() {
    const fullName =
      this.translate.instant(this.studentData.civility) + ' ' + this.studentData.last_name + ' ' + this.studentData.first_name;
    Swal.fire({
      type: 'success',
      title: this.translate.instant('PROB_S7.TITLE'),
      html: this.translate.instant('PROB_S7.TEXT', { studentFullName: fullName }),
      confirmButtonText: this.translate.instant('PROB_S7.BUTTON'),
      footer: `<span style="margin-left: auto">PROB_S7</span>`,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      this.problematicForm = null;
      this.ngOnInit();
    });
  }

  triggerSwalProbS9() {
    const fullName =
      this.translate.instant(this.studentData.civility) + ' ' + this.studentData.last_name + ' ' + this.studentData.first_name;
    Swal.fire({
      type: 'success',
      title: this.translate.instant('PROB_S9.TITLE'),
      html: this.translate.instant('PROB_S9.TEXT', { studentFullName: fullName }),
      confirmButtonText: this.translate.instant('PROB_S9.BUTTON'),
      footer: `<span style="margin-left: auto">PROB_S9</span>`,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      this.problematicForm = null;
      this.ngOnInit();
    });
  }

  triggerSwalProbS10() {
    Swal.fire({
      type: 'success',
      title: this.translate.instant('PROB_S10.TITLE'),
      html: this.translate.instant('PROB_S10.TEXT'),
      confirmButtonText: this.translate.instant('PROB_S10.BUTTON'),
      footer: `<span style="margin-left: auto">PROB_S10</span>`,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      this.problematicForm = null;
      this.ngOnInit();
    });
  }

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

  showSignature(isStudent: boolean, signatureValue: boolean) {
    let result = true;
    if (isStudent) {
      result = false;
      if (signatureValue) {
        result = true;
      }
    }
    return result;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
  exportPdf() {

    const html = STYLE + this.problematicPDF.getPdfNewHtml();
    const filename = 'Problematic-PDF -';
    this.studentData.school.short_name;

    this.subs.sink = this.transcriptBuilderService.generateProblematicPDF(this.problematicId, this.studentId).subscribe((data: any) => {

      const link = document.createElement('a');
      link.setAttribute('type', 'hidden');
      // link.download = data;
      link.href = `${environment.apiUrl}/fileuploads/${data}`.replace('/graphql', '');
      link.target = '_blank';
      // document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  checkFinalTranscripsIsStarted() {
    if (this.titleId && this.classId) {
      this.subs.sink = this.studentService.IsFinalTranscriptStarted(this.titleId, this.classId).subscribe((resp) => {

        this.IsFinalTranscriptStarted = resp;
        // ************* AV-3422, Allow ADMTC to able edit anytime, so give exception for ADMTC DIR/ADMIN usertype
        if (this.IsFinalTranscriptStarted && !this.isADMTC) {
          this.allowEditForm = false;
        }
      });
    }
  }

  openVoiceRecog(form: UntypedFormControl) {

    this.dialog
      .open(SpeechToTextDialogComponent, {
        width: '800px',
        minHeight: '300px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: form.value,
      })
      .afterClosed()
      .subscribe((resp) => {

        form.setValue(resp);
      });
  }
}
