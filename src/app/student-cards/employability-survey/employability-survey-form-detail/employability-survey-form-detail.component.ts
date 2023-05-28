import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { EmployabilitySurveyService } from 'app/service/employability-survey/employability-survey.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { StudentsService } from 'app/service/students/students.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import * as moment from 'moment';
import { forkJoin } from 'rxjs';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { RejectionReasonDialogComponent } from '../../job-description/rejection-reason-dialog/rejection-reason-dialog.component';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'app/service/auth-service/auth.service';

@Component({
  selector: 'ms-employability-survey-form-detail',
  templateUrl: './employability-survey-form-detail.component.html',
  styleUrls: ['./employability-survey-form-detail.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class EmployabilitySurveyFormDetailComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @Input() studentId = '';
  @Input() studentPrevCourseData?: any;
  @Input() schoolId: string;
  @Input() selectedESId = '';
  @Input() inFullScreen?;
  @Input() source?;
  @Output() backToParent = new EventEmitter<boolean>();
  @Output() getAllESData = new EventEmitter<boolean>();

  questionResponseForm: UntypedFormGroup;
  questionResponseFormId;

  isWaitingForResponse = false;
  isADMTC = false;
  isAcadDirAdmin = false;
  isStudent = false;
  isCertifierDirAdmin = false;
  is_es_new_flow_form_builder: boolean = false;

  studentData;
  esData;
  currentUser;

  isInFullScreen = false;

  intVal: any;
  timeOutVal: any;

  statusCard = {
    sent_to_student: false,
    completed_by_student: false,
    rejected_by_validator: false,
    validated_by_validator: false,
  };

  allowEditForm = false;

  validator;

  relatedBlockIndex = [];

  rejectionList;
  isBlockRequired = false;
  public Editor = DecoupledEditor;
  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  is_expired: boolean = false;

  constructor(
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    public utilService: UtilityService,
    public translate: TranslateService,
    private authService: AuthService,
    private studentService: StudentsService,
    private rncpTitleService: RNCPTitlesService,
    private fb: UntypedFormBuilder,
    private ESService: EmployabilitySurveyService,
    public dialog: MatDialog,
    private router: Router,
  ) {}

  ngOnInit() {
    this.getDataInit();
  }

  getDataInit() {
    this.isWaitingForResponse = true;
    // ************ Get Data User for permission of button
    this.isADMTC = this.utilService.isUserEntityADMTC();
    this.isAcadDirAdmin = this.utilService.isUserAcadDirAdmin();
    this.isCertifierDirAdmin = this.utilService.isUserCRDirAdmin();
    this.isStudent = this.utilService.isUserStudent();
    this.currentUser = this.getCurrentUser();


    // ************ Get Data of Job Desc
    this.initForm();
    const forkParam = [];
    if (this.studentPrevCourseData) {
      // student's previous course data
      forkParam.push(
        this.studentService.getStudentsPreviousESDetailData(
          this.schoolId,
          this.studentPrevCourseData.rncp_title._id,
          this.studentPrevCourseData.current_class._id,
          this.studentId,
        ),
      );
    } else {
      forkParam.push(this.studentService.getStudentsESDetailData(this.studentId));
    }
    forkParam.push(this.ESService.getOneESData(this.selectedESId));
    forkJoin(forkParam).subscribe((response) => {
      if (response && response.length) {
        let count = 0;
        if (response[count]) {
          const tempData = this.studentPrevCourseData ? _.cloneDeep(response[count][0]) : _.cloneDeep(response[count]);
          this.studentData = tempData;
          count++;
        }

        if (response[count]) {
          const tempData = _.cloneDeep(response[count]);
          this.esData = tempData;
          this.is_es_new_flow_form_builder =
            tempData.employability_survey_process_id && tempData.employability_survey_process_id.is_es_new_flow_form_builder
              ? tempData.employability_survey_process_id.is_es_new_flow_form_builder
              : false;
          count++;
        }
      }

      if (this.esData && this.esData.questionnaire_response_id) {
        this.processStatusCard();
        this.processRejectionList(this.esData);
        this.formatDataOnFetch(this.esData);
      } else if (this.esData && this.esData.form_process_id) {
        this.processStatusCard();
      }
      this.isWaitingForResponse = false;
    });
  }

  getCurrentUser() {
    return this.authService.getCurrentUser();
  }

  initForm() {
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

  initMissionActivityAutonomyForm() {
    return this.fb.group({
      mission: ['', [Validators.required, removeSpaces]],
      activity: ['', [Validators.required, removeSpaces]],
      autonomy_level: ['', [Validators.required, removeSpaces]],
    });
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

  processStatusCard() {
    // *************** Reset first, so if triggered by ngonchanges, data of old job desc(other student) not corrupting the data
    this.statusCard = {
      sent_to_student: false,
      completed_by_student: false,
      rejected_by_validator: false,
      validated_by_validator: false,
    };
    this.allowEditForm = false;
    this.validator = this.esData.validator;
    let isMatch = false;



    // *************** Check if validator and current user is matched
    switch (this.validator) {
      case 'operator':
        if (this.isADMTC) {
          isMatch = true;
        }
        break;
      case 'certifier':
        if (this.isCertifierDirAdmin || this.isADMTC) {
          isMatch = true;
        }
        break;
      case 'academic_director':
        if (this.isAcadDirAdmin || this.isADMTC) {
          isMatch = true;
        }
        break;
      case 'no_validator':
        if (this.isADMTC) {
          isMatch = true;
        }
        break;
      case null:
        if (this.isADMTC) {
          isMatch = true;
        }
        break;
      default:
        isMatch = false;
        break;
    }

    // *************** Set status condition here
    if (this.esData) {
      switch (this.esData.survey_status) {
        case 'sent_to_student':
          this.statusCard.sent_to_student = true;
          if (this.isStudent || isMatch) {
            this.allowEditForm = true;
          }
          break;
        case 'completed_by_student':
          this.statusCard.sent_to_student = true;
          this.statusCard.completed_by_student = true;
          if (isMatch) {
            this.allowEditForm = true;
          }
          break;
        case 'rejected_by_validator':
          this.statusCard.sent_to_student = true;
          this.statusCard.completed_by_student = false;
          this.statusCard.rejected_by_validator = true;
          if (this.isStudent || isMatch) {
            this.allowEditForm = true;
          }
          break;
        case 'validated_by_validator':
          this.statusCard.sent_to_student = true;
          this.statusCard.completed_by_student = true;
          this.statusCard.rejected_by_validator = false;
          this.statusCard.validated_by_validator = true;
          this.allowEditForm = false;
          break;
        default:
          break;
      }
      // const is_expired =
      //   this.esData.employability_survey_parameter_id.is_expired !== null &&
      //   this.esData.employability_survey_parameter_id.is_expired !== false;
      // if (is_expired) {
      //   this.is_expired = true;
      // }
    }
  }

  formatDataOnFetch(temp) {

    // *************** START Format response to patch to job desc form
    this.questionResponseFormId = '';
    if (temp && temp.questionnaire_response_id) {
      this.questionResponseFormId = temp.questionnaire_response_id._id;
      const tempResponse = temp.questionnaire_response_id;
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
      this.questionResponseForm.patchValue(tempResponse);
      this.questionResponseForm.markAllAsTouched();
    }

    // *************** END Format data to patch to job desc form
    this.autoPopulateFieldsAnswer();
    this.updateActivatedBlock();
    this.removeUnSelectedIndexBlock();
  }

  processRejectionList(temp) {
    if (temp && temp.rejection_details && temp.rejection_details.length) {
      const tempRejection = _.cloneDeep(temp.rejection_details);
      tempRejection.forEach((rejection) => {
        if (rejection && rejection.date && rejection.date.date && rejection.date.time) {
          rejection.date.date = this.parseStringDatePipe.transformStringToDate(
            this.parseUTCToLocalPipe.transformDate(rejection.date.date, rejection.date.time),
          );
          rejection.date.time = this.parseUTCToLocalPipe.transform(rejection.date.time);
        }
      });

      // this.rejectionList = tempRejection.reverse();
      this.rejectionList = tempRejection;

    }
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

  autoPopulateFieldsAnswer() {
    const competences = this.questionResponseForm.get('competence').value;
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
              } else if (quest.questionnaire_field_key === 'PARENT_RELATION' && !quest.answer) {
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

  isFieldMandatory(competence, compIndex: number) {
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
      } else {
        finalDecide = false;
      }
    }
    return finalDecide;
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
                } else if (question.question_type === 'continues_student' && question.options && question.options.length) {
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
      const resetDate = { date: null, time: null };
      competences.forEach((comp, compIndex) => {
        if (comp.block_type === 'visible_on_option') {
          if (this.relatedBlockIndex && this.relatedBlockIndex.length) {
            if (!this.relatedBlockIndex.includes(compIndex)) {
              if (comp.segment && comp.segment.length) {
                comp.segment.forEach((segment, segmentIndex) => {
                  if (segment.question && segment.question.length) {
                    segment.question.forEach((question, quesIndex) => {
                      this.questionResponseForm
                        .get('competence')
                        .get(compIndex.toString())
                        .get('segment')
                        .get(segmentIndex.toString())
                        .get('question')
                        .get(quesIndex.toString())
                        .get('answer')
                        .setValue(null);
                      this.questionResponseForm
                        .get('competence')
                        .get(compIndex.toString())
                        .get('segment')
                        .get(segmentIndex.toString())
                        .get('question')
                        .get(quesIndex.toString())
                        .get('answer_multiple')
                        .setValue([]);
                      this.questionResponseForm
                        .get('competence')
                        .get(compIndex.toString())
                        .get('segment')
                        .get(segmentIndex.toString())
                        .get('question')
                        .get(quesIndex.toString())
                        .get('answer_number')
                        .setValue(null);
                      this.questionResponseForm
                        .get('competence')
                        .get(compIndex.toString())
                        .get('segment')
                        .get(segmentIndex.toString())
                        .get('question')
                        .get(quesIndex.toString())
                        .get('answer_date')
                        .setValue(resetDate);
                    });
                  }
                });
              }
            }
          }
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
              });
            }
          });
        }
      });
    }

    return payload;
  }

  saveForm() {
    this.isWaitingForResponse = true;
    const payloadQuest = this.createPayloadResponse();
    this.subs.sink = this.ESService.updateQuestionnaireResponse(payloadQuest, this.questionResponseFormId).subscribe(
      (response) => {
        this.isWaitingForResponse = false;
        if (response) {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Survey_S4.TITLE'),
            html: this.translate.instant('Survey_S4.TEXT', {
              validator: this.translate.instant('056_ES.validator_dropdown.' + this.validator),
            }),
            confirmButtonText: this.translate.instant('Survey_S4.BUTTON'),
            footer: `<span style="margin-left: auto">Survey_S4</span>`,
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          });
        }
      },
      (err) => {
        this.swalError(err);
      },
    );
  }

  submitForm(type) {
    if (type === 'student') {
      this.submitFormCallAPI('student');
    } else if (type === 'validator') {
      const fullName =
        this.translate.instant(this.studentData.civility) + ' ' + this.studentData.last_name + ' ' + this.studentData.first_name;
      Swal.fire({
        type: 'question',
        html: this.translate.instant('Survey_S5.TEXT', { studentFullName: fullName }),
        confirmButtonText: this.translate.instant('Survey_S5.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('Survey_S5.BUTTON_2'),
        footer: `<span style="margin-left: auto">Survey_S5</span>`,
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.value) {
          this.submitFormCallAPI(type);
        }
      });
    }
  }

  submitFormCallAPI(type) {
    const payloadQuest = this.createPayloadResponse();
    this.isWaitingForResponse = true;
    this.subs.sink = this.ESService.updateQuestionnaireResponse(payloadQuest, this.questionResponseFormId).subscribe(
      (response1) => {
        if (response1) {
          this.subs.sink = this.ESService.submitStudentFormES(this.selectedESId).subscribe(
            (response) => {
              this.isWaitingForResponse = false;
              if (response) {
                if (type === 'student') {
                  Swal.fire({
                    type: 'success',
                    title: this.translate.instant('Survey_S3.TITLE'),
                    html: this.translate.instant('Survey_S3.TEXT', {
                      validator: this.translate.instant('056_ES.validator_dropdown.' + this.validator),
                    }),
                    confirmButtonText: this.translate.instant('Survey_S3.BUTTON'),
                    footer: `<span style="margin-left: auto">Survey_S3</span>`,
                    allowEnterKey: false,
                    allowEscapeKey: false,
                    allowOutsideClick: false,
                  }).then((responseSwal) => {
                    this.getDataInit();
                  });
                } else if (type === 'validator') {
                  Swal.fire({
                    type: 'success',
                    html: this.translate.instant('Survey_S6.TEXT'),
                    confirmButtonText: this.translate.instant('Survey_S6.BUTTON'),
                    footer: `<span style="margin-left: auto">Survey_S6</span>`,
                    allowEnterKey: false,
                    allowEscapeKey: false,
                    allowOutsideClick: false,
                  }).then((responseSwal) => {
                    this.getDataInit();
                  });
                }
              }
            },
            (err) => {
              this.swalError(err);
            },
          );
        }
      },
      (err) => {
        this.swalError(err);
      },
    );
  }

  createPayloadReject(dialogResult) {
    const tempPayload = {
      rejection_details: _.cloneDeep(this.esData.rejection_details),
    };

    if (tempPayload && tempPayload.rejection_details && tempPayload.rejection_details.length) {
      // ************** Translate to UTC here
    }

    const reason = dialogResult.reason;
    const date = {
      date: this.parseLocalToUTCPipe.transformDate(moment().format('DD/MM/YYYY'), '00:01'),
      time: this.parseLocalToUTCPipe.transform('00:01'),
    };

    const dataRejection = {
      reason: reason,
      date: date,
    };

    tempPayload.rejection_details.push(dataRejection);



    return tempPayload;
  }

  rejectForm() {
    const rejectionCount = this.rejectionList ? this.rejectionList.length : 0;
    if (rejectionCount < 3) {
      Swal.fire({
        type: 'question',
        title: this.translate.instant('Employability_S1.TITLE'),
        html: this.translate.instant('Employability_S1.TEXT'),
        confirmButtonText: this.translate.instant('Employability_S1.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('Employability_S1.BUTTON_2'),
        footer: `<span style="margin-left: auto">Employability_S1</span>`,
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.value) {
          this.rejectFormCallApi();
        }
      });
    } else {
      Swal.fire({
        type: 'question',
        title: this.translate.instant('Employability_S2.TITLE'),
        html: this.translate.instant('Employability_S2.TEXT'),
        confirmButtonText: this.translate.instant('Employability_S2.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('Employability_S2.BUTTON_2'),
        footer: `<span style="margin-left: auto">Employability_S2</span>`,
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.value) {
          this.rejectFormCallApi();
        }
      });
    }
  }

  rejectFormCallApi() {
    this.dialog
      .open(RejectionReasonDialogComponent, {
        width: '600px',
        minHeight: '300px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
      })
      .afterClosed()
      .subscribe((respReason) => {

        if (respReason && respReason.submit) {
          const payloadRejection = this.createPayloadReject(respReason);
          this.subs.sink = this.ESService.rejectFormESReason(this.selectedESId, payloadRejection).subscribe(
            (response) => {

              if (response) {
                this.subs.sink = this.ESService.rejectFormESStatus(this.selectedESId, this.translate.currentLang).subscribe(
                  (resp) => {

                    if (resp) {
                      Swal.fire({
                        type: 'success',
                        title: this.translate.instant('Employability_S1B.TITLE'),
                        html: this.translate.instant('Employability_S1B.TEXT'),
                        confirmButtonText: this.translate.instant('Employability_S1B.BUTTON'),
                        footer: `<span style="margin-left: auto">Employability_S1B</span>`,
                        allowEnterKey: false,
                        allowEscapeKey: false,
                        allowOutsideClick: false,
                      }).then((responseSwal) => {
                        this.getDataInit();
                      });
                    }
                  },
                  (err) => {
                    this.swalError(err);
                  },
                );
              }
            },
            (err) => {
              this.swalError(err);
            },
          );
        }
      });
  }

  translateDateRejection(date) {
    const lang = this.translate.currentLang;
    const options: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    if (lang === 'en' && date) {
      return date.toLocaleDateString('en-US', options);
    } else if (lang === 'fr' && date) {
      return date.toLocaleDateString('fr', options);
    } else {
      return '';
    }
  }

  goBackToParent() {
    this.backToParent.emit(true);
    this.getAllESData.emit();
  }

  goBackToOriginalRoute() {




    if (this.source && this.source === 'studentcard') {
      this.router.navigate(['/school', this.esData.school_id._id], {
        queryParams: {
          title: this.esData.rncp_id._id,
          class: this.esData.class_id._id,
          student: this.esData.student_id._id,
          open: 'student-cards',
          selectedTab: 'EmployabilitySurvey',
        },
      });
    } else if (this.source && this.source === 'myfile') {
      this.router.navigate(['/my-file'], {
        queryParams: {
          identity: 'employabilitysurvey',
        },
      });
    }
  }

  goToFormFilling() {



    const domainUrl = this.router.url.split('/')[0];
    const processId = this.esData.form_process_id && this.esData.form_process_id._id ? this.esData.form_process_id._id : null;
    const userId = this.currentUser && this.currentUser._id ? this.currentUser._id : null;
    const userTypeId = this.currentUser.entities[0].type._id;

    if (userId && processId) {
      window.open(
        `${domainUrl}/form-fill?formId=${processId}&formType=employability_survey&userId=${userId}&userTypeId=${userTypeId}`,
        '_blank',
      );
    }
  }

  goToFullScreen() {





    let source = '';

    if (this.router.url && this.router.url.includes('my-file')) {
      source = 'myfile';
    } else if (this.router.url && this.router.url.includes('school')) {
      source = 'studentcard';
    }

    // this.router.navigate(['/academic/employability-survey', this.esData.school_id._id, this.esData.student_id._id, this.esData._id], {
    //   queryParams: { source: source },
    // });

    const url = this.router.serializeUrl(
      this.router.createUrlTree(
        ['/academic/employability-survey', this.esData.school_id._id, this.esData.student_id._id, this.esData._id],
        {
          queryParams: { source: source },
        },
      ),
    );

    window.open(url, '_blank');

    this.goBackToParent();
  }

  swalError(err) {
    this.isWaitingForResponse = false;

    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: 'OK',
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
