import { CertidegreeService } from './../../../service/certidegree/certidegree.service';
import {
  Component,
  OnInit,
  Output,
  Input,
  EventEmitter,
  OnDestroy,
  OnChanges,
  ElementRef,
  ViewChild,
  ChangeDetectorRef,
  AfterViewChecked,
} from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { DateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/service/auth-service/auth.service';
import { CompanyService } from 'app/service/company/company.service';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SchoolService } from 'app/service/schools/school.service';
import { StudentsService } from 'app/service/students/students.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { SubSink } from 'subsink';
import { removeSpaces, requiredTrueIfValidator } from 'app/service/customvalidator.validator';
import { forkJoin } from 'rxjs';
import { UtilityService } from 'app/service/utility/utility.service';
import { JobDescService } from 'app/service/job-desc/job-desc.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { RejectionReasonDialogComponent } from '../rejection-reason-dialog/rejection-reason-dialog.component';
import { Router } from '@angular/router';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { JobPDFComponent } from '../job-description-pdf/job-description-pdf.component';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { STYLE } from 'app/title-rncp/conditions/class-condition/score/second-step-score/condition-score-preview/pdf-styles';
import { environment } from 'environments/environment';

@Component({
  selector: 'ms-job-by-score',
  templateUrl: './job-by-score.component.html',
  styleUrls: ['./job-by-score.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class JobDescScoreComponent implements OnInit, OnDestroy, OnChanges, AfterViewChecked {
  private subs = new SubSink();
  @Input() studentId = '';
  @Input() studentPrevCourseData: any;
  @Input() schoolId: string;
  @Input() classId: string;
  @Input() titleId: string;
  @Input() typeDisplay: boolean;
  @Input() jobDescriptionId: string;
  @Output() continue = new EventEmitter<boolean>();

  @ViewChild('jobDescriptionPDF', { static: false }) jobDescriptionPDF: JobPDFComponent;
  @ViewChild('fileUploadDoc', { static: false }) fileUploaderDoc: ElementRef;

  jobDescriptionType = 'score';
  classData: any;
  studentData: any;
  jobDescData: any;
  statusCard = {
    sent_to_student: false,
    sent_to_mentor: false,
    validated_by_mentor: false,
    sent_to_school: false,
    rejected_by_acad_dir: false,
    validated_by_acad_staff: false,
    expedite_by_acad_staff: false,
    expedite_by_acad_staff_student: false,
  };

  jobDescForm: UntypedFormGroup;
  questionResponseForm: UntypedFormGroup;
  questionResponseFormId: string;
  jobDescTemp;

  autonomyLevel = ['Decide Alone', 'Decide After Info', 'Decide After Approval', 'Execute'];
  industrySectorList = [];

  intVal: any;
  timeOutVal: any;

  isStudent = false;
  isADMTC = false;
  isMentor = false;
  isAcadDirAdmin = false;
  allowEditForm = false;

  isWaitingForResponse = false;
  myInnerHeight = 1920;
  scrollEvent: any;

  relatedBlockIndex = [];

  public Editor = DecoupledEditor;
  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }
  invalidFormControls = [];

  constructor(
    private fb: UntypedFormBuilder,
    private studentService: StudentsService,
    public dialog: MatDialog,
    private rncpTitleService: RNCPTitlesService,
    public utilService: UtilityService,
    private jobDescService: JobDescService,
    public translate: TranslateService,
    private fileUploadService: FileUploadService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private dateAdapter: DateAdapter<Date>,
    private transcriptBuilderService: TranscriptBuilderService,
    private certiDegreeService: CertidegreeService,
  ) {
    this.industrySectorList = this.jobDescService.getIndustrySectorList();
  }

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.getDataInit();
  }

  ngOnChanges() {
    this.jobDescTemp = null;
    this.subs.unsubscribe();
    this.getDataInit();
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  // *************** To Get Height window screen and put in style css height
  getAutomaticHeight() {
    if (this.router.url.includes('/my-file')) {
      this.myInnerHeight = window.innerHeight - 193;
      return this.myInnerHeight;
    } else if (this.router.url.includes('/students-card')) {
      this.myInnerHeight = window.innerHeight - 271;
      return this.myInnerHeight;
    } else if (this.typeDisplay) {
      this.myInnerHeight = window.innerHeight - 128;
      return this.myInnerHeight;
    } else {
      this.myInnerHeight = window.innerHeight - 356;
      return this.myInnerHeight;
    }
  }

  getDataInit() {
    this.isWaitingForResponse = true;
    // ************ Get Data User for permission of button
    this.isADMTC = this.utilService.isUserEntityADMTC();
    this.isAcadDirAdmin = this.utilService.isUserAcadDirAdmin();
    this.isMentor = this.utilService.isUserMentor();
    this.isStudent = this.utilService.isUserStudent();

    // ************ Get Data of Job Desc
    const forkParam = [];
    forkParam.push(this.rncpTitleService.getClassById(this.classId));
    if (this.studentPrevCourseData) {
      // student's previous course data
      forkParam.push(
        this.studentService.getStudentsPreviousCourseJobDescIdentityData(
          this.schoolId,
          this.studentPrevCourseData.rncp_title._id,
          this.studentPrevCourseData.current_class._id,
          this.studentId,
        ),
      );
    } else {
      forkParam.push(this.studentService.getStudentsJobDescIdentityData(this.studentId));
    }

    forkJoin(forkParam).subscribe((response) => {
      if (response && response.length) {
        let count = 0;
        if (response[count]) {
          this.classData = _.cloneDeep(response[count]);
          count++;
        }
        if (response[count]) {
          const tempData = this.studentPrevCourseData ? _.cloneDeep(response[count][0]) : _.cloneDeep(response[count]);
          if (this.jobDescriptionId) {
            if (tempData && tempData.companies && tempData.companies.length) {
              tempData.companies = tempData.companies.filter(
                (company) => company.job_description_id && company.job_description_id._id === this.jobDescriptionId,
              );
            }
          } else {
            if (tempData && tempData.companies && tempData.companies.length) {
              tempData.companies = tempData.companies.filter((company) => company.status === 'active');
            }
          }
          this.studentData = tempData;
          count++;
        }
      }
      if (this.jobDescriptionId) {
        this.subs.sink = this.jobDescService.getOneJobDescNewScore(this.jobDescriptionId).subscribe((resp) => {
          this.jobDescData = _.cloneDeep(resp);
          // *************** Process the status of the job desc
          this.processStatusCard();

          // *************** Process the form
          const temp = _.cloneDeep(resp);
          this.initForm();
          if(this.jobDescData?.job_description_status === 'validated_by_acad_staff') {
            this.jobDescForm.disable();
          }
          this.formatDataOnFetch(temp);
        });
      } else {
        if (this.studentData && this.studentData.job_description_id && this.studentData.job_description_id._id) {
          this.subs.sink = this.jobDescService.getOneJobDescNewScore(this.studentData.job_description_id._id).subscribe((resp) => {
            this.jobDescData = _.cloneDeep(resp);

            // *************** Process the status of the job desc
            this.processStatusCard();

            // *************** Process the form
            const temp = _.cloneDeep(resp);
            this.initForm();
            if(this.jobDescData?.job_description_status === 'validated_by_acad_staff') {
              this.jobDescForm.disable();
            }
            this.formatDataOnFetch(temp);
          });
        }
      }

      this.initForm();
      this.isWaitingForResponse = false;
    });
  }

  formatDataOnFetch(temp) {
    // *************** START Format data to patch to job desc form
    if (temp && temp.rncp_id && temp.rncp_id._id) {
      temp.rncp_id = temp.rncp_id._id;
    }
    if (temp && temp.school_id && temp.school_id._id) {
      temp.school_id = temp.school_id._id;
    }
    if (temp && temp.student_id && temp.student_id._id) {
      temp.student_id = temp.student_id._id;
    }
    // ************** Previously user can input date mission and it will be populated. Now we use date of contract instead


    if (temp.date_of_the_mission && temp.date_of_the_mission.from && temp.date_of_the_mission && temp.date_of_the_mission.to) {
      if (temp.date_of_the_mission && temp.date_of_the_mission.from) {
        const startTime = temp.date_of_the_mission.from.time ? temp.date_of_the_mission.from.time : '15:59';
        temp.date_of_the_mission.from.date = this.parseStringDatePipe.transformStringToDate(
          this.parseUTCToLocalPipe.transformDate(temp.date_of_the_mission.from.date, startTime),
        );
        temp.date_of_the_mission.from.time = this.parseUTCToLocalPipe.transform(startTime)
          ? this.parseUTCToLocalPipe.transform(startTime)
          : this.parseUTCToLocalPipe.transform('15:59');
        // temp.date_of_the_mission.from.time = this.parseUTCToLocalPipe.transform(temp.date_of_the_mission.from.time);
      }
      if (temp.date_of_the_mission && temp.date_of_the_mission.to) {
        const endTime = temp.date_of_the_mission.to.time ? temp.date_of_the_mission.to.time : '15:59';
        temp.date_of_the_mission.to.date = this.parseStringDatePipe.transformStringToDate(
          this.parseUTCToLocalPipe.transformDate(temp.date_of_the_mission.to.date, endTime),
        );
        temp.date_of_the_mission.to.time = this.parseUTCToLocalPipe.transform(endTime)
          ? this.parseUTCToLocalPipe.transform(endTime)
          : this.parseUTCToLocalPipe.transform('15:59');
        // temp.date_of_the_mission.to.time = this.parseUTCToLocalPipe.transform(temp.date_of_the_mission.to.time);
      }
    } else {
      if (this.studentData.companies) {
        const activeCompany = _.find(this.studentData.companies, (company) => company.status === 'active');
        if (activeCompany && activeCompany.start_date && activeCompany.end_date) {
          const startTime = activeCompany.start_date.time ? activeCompany.start_date.time : '15:59';
          const endTime = activeCompany.end_date.time ? activeCompany.end_date.time : '15:59';
          temp.date_of_the_mission = {
            from: {
              date: this.parseStringDatePipe.transformStringToDate(
                this.parseUTCToLocalPipe.transformDate(activeCompany.start_date.date, startTime),
              ),
              time: this.parseUTCToLocalPipe.transform(startTime)
                ? this.parseUTCToLocalPipe.transform(startTime)
                : this.parseUTCToLocalPipe.transform('15:59'),
              // time: this.parseUTCToLocalPipe.transform(activeCompany.start_date.time),
            },
            to: {
              date: this.parseStringDatePipe.transformStringToDate(
                this.parseUTCToLocalPipe.transformDate(activeCompany.end_date.date, endTime),
              ),
              time: this.parseUTCToLocalPipe.transform(endTime)
                ? this.parseUTCToLocalPipe.transform(endTime)
                : this.parseUTCToLocalPipe.transform('15:59'),
              // time: this.parseUTCToLocalPipe.transform(activeCompany.end_date.time),
            },
          };
        } else {
          temp.date_of_the_mission = {
            from: {
              date: null,
              time: this.parseUTCToLocalPipe.transform('15:59'),
            },
            to: {
              date: null,
              time: this.parseUTCToLocalPipe.transform('15:59'),
            },
          };
        }
      }
    }

    // if (temp && !temp.date_of_the_mission) {
    //   temp.date_of_the_mission = {
    //     from: {
    //       date: null,
    //       time: '00:01',
    //     },
    //     to: {
    //       date: null,
    //       time: '23:59',
    //     },
    //   };
    // } else {
    //   if (temp.date_of_the_mission && temp.date_of_the_mission.from) {
    //     temp.date_of_the_mission.from.date = this.parseStringDatePipe.transformStringToDate(
    //       this.parseUTCToLocalPipe.transformDate(temp.date_of_the_mission.from.date, temp.date_of_the_mission.from.time),
    //     );
    //     temp.date_of_the_mission.from.time = this.parseUTCToLocalPipe.transform(temp.date_of_the_mission.from.time);
    //   }
    //   if (temp.date_of_the_mission && temp.date_of_the_mission.to) {
    //     temp.date_of_the_mission.to.date = this.parseStringDatePipe.transformStringToDate(
    //       this.parseUTCToLocalPipe.transformDate(temp.date_of_the_mission.to.date, temp.date_of_the_mission.to.time),
    //     );
    //     temp.date_of_the_mission.to.time = this.parseUTCToLocalPipe.transform(temp.date_of_the_mission.to.time);
    //   }
    // }

    if (temp && !temp.company_presentation) {
      temp.company_presentation = {
        file_name: null,
        file_url: null,
      };
    }
    if (temp && temp.job_desc_rejections && temp.job_desc_rejections.length) {
      temp.job_desc_rejections.forEach((reason) => {
        this.addRejectionForm();
        if (reason.rejection_date) {
          reason.rejection_date.date = this.parseStringDatePipe.transformStringToDate(
            this.parseUTCToLocalPipe.transformDate(reason.rejection_date.date, reason.rejection_date.time),
          );
          reason.rejection_date.time = this.parseUTCToLocalPipe.transform(reason.rejection_date.time);
        }
      });
    } else {
      temp.job_desc_rejections = [];
    }
    this.jobDescForm.patchValue(temp);
    this.jobDescTemp = this.jobDescForm.value;
    this.jobDescForm.valueChanges.subscribe((resp) => {
      this.isFormSame();
    });
    // *************** END Format data to patch to job desc form

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
    }
    // *************** END Format data to patch to job desc form



    this.autoPopulateFieldsAnswer();
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
              } else if (quest.questionnaire_field_key === 'STUDENT_SCHOOL' && !quest.answer) {
                const answer = this.studentData && this.studentData.school && this.studentData.school.short_name ? this.studentData.school.short_name : '';
                this.getQuestionArray(compIndex, segmentIndex).at(quesIndex).get('answer').patchValue(answer);
              }
               else if (quest.questionnaire_field_key === 'STUDENT_DIPLOMA' && !quest.answer) {
                // *************** Not Sure what is diploma, does not exists in v2 student
                const answer = '';
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

  initForm() {
    this.jobDescForm = this.fb.group({
      rncp_id: [this.titleId, [Validators.required]],
      school_id: [this.schoolId, [Validators.required]],
      job_name: ['', [Validators.required]],
      student_id: [this.studentId, [Validators.required]],
      date_of_the_mission: this.fb.group({
        from: this.fb.group({
          date: ['', Validators.required],
          time: [this.parseUTCToLocalPipe.transform('15:59'), Validators.required],
        }),
        to: this.fb.group({
          date: ['', Validators.required],
          time: [this.parseUTCToLocalPipe.transform('15:59'), Validators.required],
        }),
      }),
      main_mission_of_the_department: ['', [Validators.required]],
      organization_of_the_department: ['', [Validators.required]],
      main_mission: ['', [Validators.required]],
      company_web_url: [''],
      company_presentation: this.fb.group({
        file_name: [''],
        file_url: [''],
      }),
      company_main_activity: [''],
      industry_sector: [''],
      signature_of_the_student: [
        false,
        [requiredTrueIfValidator(() => this.jobDescData && this.jobDescData.job_description_status === 'sent_to_student')],
      ],
      signature_of_the_company_mentor: [
        false,
        [requiredTrueIfValidator(() => this.jobDescData && this.jobDescData.job_description_status === 'sent_to_mentor')],
      ],
      signature_of_the_acadir: [
        false,
        [requiredTrueIfValidator(() => this.jobDescData && this.jobDescData.job_description_status === 'sent_to_school')],
      ],
      job_desc_rejections: this.fb.array([]),
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

  isFormSame() {

    const secondForm = JSON.stringify(this.jobDescTemp);
    const formType = JSON.stringify(this.jobDescForm.value);
    if (secondForm === formType) {
      this.certiDegreeService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.certiDegreeService.childrenFormValidationStatus = false;
      return false;
    }
  }

  // *************** START of Form Functionality
  initRejectionForm() {
    return this.fb.group({
      reason_of_rejection: [''],
      rejection_date: this.fb.group({
        date: ['', Validators.required],
        time: ['00:00', Validators.required],
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

  getRejectionArray(): UntypedFormArray {
    return this.jobDescForm.get('job_desc_rejections') as UntypedFormArray;
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

  addRejectionForm() {
    this.getRejectionArray().push(this.initRejectionForm());
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
  // *************** END of Form Functionality

  // ************** Called on init to check the status of job desc
  processStatusCard() {
    // Reset first, so if triggered by ngonchanges, data of old job desc(other student) not corrupting the data
    this.statusCard = {
      sent_to_student: false,
      sent_to_mentor: false,
      validated_by_mentor: false,
      sent_to_school: false,
      rejected_by_acad_dir: false,
      validated_by_acad_staff: false,
      expedite_by_acad_staff: false,
      expedite_by_acad_staff_student: false,
    };
    this.allowEditForm = false;
    if (this.jobDescData) {
      switch (this.jobDescData.job_description_status) {
        case 'sent_to_student':
          this.statusCard.sent_to_student = true;
          if (this.isADMTC || this.isAcadDirAdmin || this.isStudent) {
            this.allowEditForm = true;
          }
          break;
        case 'sent_to_mentor':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_mentor = true;
          if (this.isADMTC || this.isAcadDirAdmin || this.isMentor) {
            this.allowEditForm = true;
          }
          break;
        case 'validated_by_mentor':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_mentor = true;
          this.statusCard.validated_by_mentor = true;
          break;
        case 'sent_to_school':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_school = true;
          if (this.classData && this.classData.is_mentor_selected_in_job_description) {
            this.statusCard.sent_to_mentor = true;
            this.statusCard.validated_by_mentor = true;
          }
          if (this.isADMTC || this.isAcadDirAdmin) {
            this.allowEditForm = true;
          }
          break;
        case 'rejected_by_acad_dir':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_school = true;
          this.statusCard.rejected_by_acad_dir = true;
          if (this.classData && this.classData.is_mentor_selected_in_job_description) {
            this.statusCard.sent_to_mentor = true;
            this.statusCard.validated_by_mentor = true;
          }
          if (this.isADMTC || this.isAcadDirAdmin || this.isStudent) {
            this.allowEditForm = true;
          }
          break;
        case 'validated_by_acad_staff':
        case 'expedite_by_acad_staff':
        case 'expedite_by_acad_staff_student':
          this.statusCard.sent_to_student = true;
          this.statusCard.sent_to_school = true;
          this.statusCard.validated_by_acad_staff = true;
          this.statusCard.expedite_by_acad_staff = true;
          this.statusCard.expedite_by_acad_staff_student = true;
          if (this.classData && this.classData.is_mentor_selected_in_job_description) {
            this.statusCard.sent_to_mentor = true;
            this.statusCard.validated_by_mentor = true;
          }
          if (this.isADMTC || this.isAcadDirAdmin) {
            this.allowEditForm = true;
          }
          break;
        default:
          break;
      }
    }

  }

  createPayloadJobDesc() {
    const payload = _.cloneDeep(this.jobDescForm.value);

    if (payload.date_of_the_mission) {
      payload.date_of_the_mission.from.date = this.parseLocalToUTCPipe.transformDate(
        moment(payload.date_of_the_mission.from.date).format('DD/MM/YYYY'),
        payload.date_of_the_mission.from.time,
      );
      payload.date_of_the_mission.to.date = this.parseLocalToUTCPipe.transformDate(
        moment(payload.date_of_the_mission.to.date).format('DD/MM/YYYY'),
        payload.date_of_the_mission.to.time,
      );
      payload.date_of_the_mission.from.time = this.parseLocalToUTCPipe.transform(payload.date_of_the_mission.from.time);
      payload.date_of_the_mission.to.time = this.parseLocalToUTCPipe.transform(payload.date_of_the_mission.to.time);
    }

    if (payload.job_desc_rejections && payload.job_desc_rejections.length) {
      payload.job_desc_rejections.forEach((reason) => {
        if (reason.rejection_date) {
          reason.rejection_date.date = this.parseLocalToUTCPipe.transformDate(
            moment(reason.rejection_date.date).format('DD/MM/YYYY'),
            reason.rejection_date.time,
          );
          reason.rejection_date.time = this.parseLocalToUTCPipe.transform(reason.rejection_date.time);
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
                    question.answer_date.time = '17:00';
                  }
                  question.answer_date.date = this.parseLocalToUTCPipe.transformDate(
                    moment(question.answer_date.date).format('DD/MM/YYYY'),
                    question.answer_date.time,
                  );
                  question.answer_date.time = this.parseLocalToUTCPipe.transform(question.answer_date.time)
                    ? this.parseLocalToUTCPipe.transform(question.answer_date.time)
                    : '17:00';
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
    const payloadQuest = this.createPayloadResponse();



    let timeDisabled = 10;
    this.subs.sink = this.jobDescService.updateQuestionnaireResponse(payloadQuest, this.questionResponseFormId).subscribe((response) => {
      if (response) {
        const payload = this.createPayloadJobDesc();
        this.subs.sink = this.jobDescService
          .updateJobDescription(payload, this.studentData.job_description_id._id, this.translate.currentLang)
          .subscribe((resp) => {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('JOBDESC_S9.TITLE'),
              html: this.translate.instant('JOBDESC_S9.TEXT'),
              footer: `<span style="margin-left: auto">JOBDESC_S9</span>`,
              confirmButtonText: this.translate.instant('JOBDESC_S9.BUTTON'),
              allowEnterKey: false,
              allowEscapeKey: false,
              allowOutsideClick: false,
              onOpen: () => {
                Swal.disableConfirmButton();
                const confirmBtnRef = Swal.getConfirmButton();
                const time = setInterval(() => {
                  timeDisabled -= 1;
                  confirmBtnRef.innerText = this.translate.instant('JOBDESC_S9.BUTTON') + ` (${timeDisabled})`;
                }, 1000);

                setTimeout(() => {
                  confirmBtnRef.innerText = this.translate.instant('JOBDESC_S9.BUTTON');
                  Swal.enableConfirmButton();
                  clearTimeout(time);
                }, timeDisabled * 1000);
              },
            });
          });
      }
    });
  }

  checkIsFormInvalid(form) {
    Object.keys(form.controls).forEach((controlEl) => {
      const control = form.get(controlEl);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched();
        if (control.parent && control.invalid && control.parent.get('question_name')) {
          this.invalidFormControls.push(control.parent.get('question_name').value);
        }
        if (control.invalid) {
          switch (controlEl) {
            case 'job_name':
              this.invalidFormControls.push(this.translate.instant('JOB_DESCRIPTION_TEXT.Job Name'));
              break;
            case 'main_mission_of_the_department':
              this.invalidFormControls.push(this.translate.instant('JOB_DESCRIPTION_TEXT.Main Mission Of The Department'));
              break;
            case 'organization_of_the_department':
              this.invalidFormControls.push(this.translate.instant('JOB_DESCRIPTION_TEXT.Organisation of the Department'));
              break;
            case 'main_mission':
              this.invalidFormControls.push(this.translate.instant('JOB_DESCRIPTION_TEXT.Main Mission'));
              break;
            case 'signature_of_the_student':
              this.invalidFormControls.push(this.translate.instant('JOB_DESCRIPTION_SIGNATURE.Signature For Student'));
              break;
            case 'signature_of_the_company_mentor':
              this.invalidFormControls.push(this.translate.instant('JOB_DESCRIPTION_SIGNATURE.Signature For Mentor'));
              break;
            case 'signature_of_the_acadir':
              this.invalidFormControls.push(this.translate.instant('JOB_DESCRIPTION_SIGNATURE.Signature For Acad Dir'));
              break;
            case 'mission':
              this.invalidFormControls.push(this.translate.instant('mission'));
              break;
            case 'activity':
              this.invalidFormControls.push(this.translate.instant('activity'));
              break;
            case 'autonomy_level':
              this.invalidFormControls.push(this.translate.instant('autonomy level'));
              break;
            default:
              break;
          }
        }
      } else if (control instanceof UntypedFormGroup || control instanceof UntypedFormArray) {
        if ((controlEl === 'multiple_textbox' || controlEl === 'parent_child_options') && control.invalid) {
          this.invalidFormControls.push(control.parent.get('question_name').value);
        }
        control.markAllAsTouched();
        this.checkIsFormInvalid(control);
      }
    });
  }

  submitForm(type) {
    this.invalidFormControls = [];
    const payloadQuest = this.createPayloadResponse();
    if (this.jobDescForm.invalid || this.questionResponseForm.invalid) {
      this.checkIsFormInvalid(this.questionResponseForm);
      this.checkIsFormInvalid(this.jobDescForm);
      let li = '';
      this.invalidFormControls.forEach((item) => {
        return (li = li + `<li>${item}</li>`);
      });
      const formatTextSwal = `<ul style="text-align: start;">${li}</ul>`;
      this.formInvalidSwal(formatTextSwal);
    } else {
      if (type === 'mentor') {
        Swal.fire({
          title: this.translate.instant('JOBDESC_S3.TITLE'),
          text: this.translate.instant('JOBDESC_S3.TEXT'),
          footer: `<span style="margin-left: auto">JOBDESC_S3</span>`,
          type: 'warning',
          allowEscapeKey: true,
          showCancelButton: true,
          confirmButtonText: this.translate.instant('JOBDESC_S3.BUTTON_1'),
          cancelButtonText: this.translate.instant('JOBDESC_S3.BUTTON_2'),
          allowOutsideClick: false,
          allowEnterKey: false,
        }).then((res) => {
          if (res.value) {
            this.subs.sink = this.jobDescService
              .updateQuestionnaireResponse(payloadQuest, this.questionResponseFormId)
              .subscribe((response1) => {
                if (response1) {
                  const payload = this.createPayloadJobDesc();
                  this.subs.sink = this.jobDescService
                    .updateJobDescription(payload, this.studentData.job_description_id._id, this.translate.currentLang)
                    .subscribe((resp) => {
                      if (resp) {
                        this.subs.sink = this.jobDescService
                          .submitStudentFormEval(this.studentData.job_description_id._id, this.translate.currentLang)
                          .subscribe((response) => {
                            if (response) {
                              Swal.fire({
                                type: 'success',
                                title: this.translate.instant('JOBDESC_S3B.TITLE'),
                                text: this.translate.instant('JOBDESC_S3B.TEXT'),
                                footer: `<span style="margin-left: auto">JOBDESC_S3B</span>`,
                                confirmButtonText: this.translate.instant('JOBDESC_S3B.BUTTON'),
                                allowEnterKey: false,
                                allowEscapeKey: false,
                                allowOutsideClick: false,
                              }).then((responseSwal) => {
                                this.getDataInit();
                              });
                            }
                          });
                      }
                    });
                }
              });
          }
        });
      } else if (type === 'academic') {
        Swal.fire({
          title: this.translate.instant('JOBDESC_S4.TITLE'),
          text: this.translate.instant('JOBDESC_S4.TEXT'),
          footer: `<span style="margin-left: auto">JOBDESC_S4</span>`,
          type: 'warning',
          allowEscapeKey: true,
          showCancelButton: true,
          confirmButtonText: this.translate.instant('JOBDESC_S4.BUTTON_1'),
          cancelButtonText: this.translate.instant('JOBDESC_S4.BUTTON_2'),
          allowOutsideClick: false,
          allowEnterKey: false,
        }).then((res) => {
          if (res.value) {
            this.subs.sink = this.jobDescService
              .updateQuestionnaireResponse(payloadQuest, this.questionResponseFormId)
              .subscribe((response1) => {
                if (response1) {
                  const payload = this.createPayloadJobDesc();
                  this.subs.sink = this.jobDescService
                    .updateJobDescription(payload, this.studentData.job_description_id._id, this.translate.currentLang)
                    .subscribe((resp) => {
                      if (resp) {
                        this.subs.sink = this.jobDescService
                          .submitStudentFormEval(this.studentData.job_description_id._id, this.translate.currentLang)
                          .subscribe((response) => {
                            if (response) {
                              Swal.fire({
                                type: 'success',
                                title: this.translate.instant('JOBDESC_S4B.TITLE'),
                                html: this.translate.instant('JOBDESC_S4B.TEXT'),
                                footer: `<span style="margin-left: auto">JOBDESC_S4B</span>`,
                                confirmButtonText: this.translate.instant('JOBDESC_S4B.BUTTON'),
                                allowEnterKey: false,
                                allowEscapeKey: false,
                                allowOutsideClick: false,
                              }).then((responseSwal) => {
                                this.getDataInit();
                              });
                            }
                          });
                      }
                    });
                }
              });
          }
        });
      } else {
        this.subs.sink = this.jobDescService
          .updateQuestionnaireResponse(payloadQuest, this.questionResponseFormId)
          .subscribe((response1) => {
            if (response1) {
              const payload = this.createPayloadJobDesc();
              this.subs.sink = this.jobDescService
                .updateJobDescription(payload, this.studentData.job_description_id._id, this.translate.currentLang)
                .subscribe((resp) => {
                  if (resp) {
                    this.subs.sink = this.jobDescService
                      .submitStudentFormEval(this.studentData.job_description_id._id, this.translate.currentLang)
                      .subscribe((response) => {
                        if (response) {
                          Swal.fire({
                            type: 'success',
                            title: this.translate.instant('JOBDESC_S10.TITLE'),
                            text: this.translate.instant('JOBDESC_S10.TEXT'),
                            footer: `<span style="margin-left: auto">JOBDESC_S10</span>`,
                            confirmButtonText: this.translate.instant('JOBDESC_S10.BUTTON'),
                            allowEnterKey: false,
                            allowEscapeKey: false,
                            allowOutsideClick: false,
                          }).then((responseSwal) => {
                            this.getDataInit();
                          });
                        }
                      });
                  }
                });
            }
          });
      }
    }
  }

  formInvalidSwal(formatTextSwal) {
    Swal.fire({
      type: 'error',
      title: this.translate.instant('TMTC_S02.TITLE'),
      html: `${this.translate.instant('TMTC_S02.TEXT')} <br><br>
             ${this.translate.instant('Required section')} : <br> 
             ${formatTextSwal}`,
      footer: `<span style="margin-left: auto">TMTC_S02</span>`,
      confirmButtonText: this.translate.instant('TMTC_S02.BUTTON_1'),
      allowOutsideClick: false,
    });
    this.jobDescForm.markAllAsTouched();
    this.questionResponseForm.markAllAsTouched();
  }

  rejectForm() {
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
          const jobDescId = this.studentData.job_description_id._id;
          const currentLang = this.translate.currentLang;
          const reason = respReason.reason;
          const date = {
            date: this.parseLocalToUTCPipe.transformDate(moment().format('DD/MM/YYYY'), '00:01'),
            time: this.parseLocalToUTCPipe.transform('00:01'),
          };

          const payloadQuest = this.createPayloadResponse();
          this.subs.sink = this.jobDescService
            .updateQuestionnaireResponse(payloadQuest, this.questionResponseFormId)
            .subscribe((response1) => {
              if (response1) {
                const payload = this.createPayloadJobDesc();
                payload.signature_of_the_acadir = false;
                this.subs.sink = this.jobDescService.updateJobDescription(payload, jobDescId, currentLang).subscribe((resp) => {
                  if (resp) {
                    this.subs.sink = this.jobDescService
                      .rejectStudentFormEval(jobDescId, currentLang, reason, date)
                      .subscribe((response) => {
                        if (response) {
                          Swal.fire({
                            type: 'success',
                            title: this.translate.instant('JOBDESC_S8.TITLE'),
                            text: this.translate.instant('JOBDESC_S8.TEXT', {
                              reason: reason,
                            }),
                            footer: `<span style="margin-left: auto">JOBDESC_S8</span>`,
                            confirmButtonText: this.translate.instant('JOBDESC_S8.BUTTON'),
                            allowEnterKey: false,
                            allowEscapeKey: false,
                            allowOutsideClick: false,
                          }).then((responseSwal) => {
                            this.getDataInit();
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

  openUploadWindow() {
    this.fileUploaderDoc.nativeElement.click();
  }

  translateDate(date: any) {
    if (date) {
      return moment(date).format('DD/MM/YYYY');
    } else {
      return moment().format('DD/MM/YYYY');
    }
  }

  uploadFile(fileInput: Event) {
    this.isWaitingForResponse = true;
    const file = (<HTMLInputElement>fileInput.target).files[0];


    // *************** Accept Reject File Upload outside allowed accept
    const acceptable = ['doc', 'docx', 'ppt', 'pptx', 'txt', 'pdf', 'xlsx', 'xls'];
    const fileType = this.utilService.getFileExtension(file.name).toLocaleLowerCase();
    if (acceptable.includes(fileType)) {
      // this.file = (<HTMLInputElement>fileInput.target).files[0];
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe((resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          this.jobDescForm.get('company_presentation').get('file_name').patchValue(resp.file_name);
          this.jobDescForm.get('company_presentation').get('file_url').patchValue(resp.file_url);
        }
      });
    } else {
      this.isWaitingForResponse = false;
      Swal.fire({
        type: 'error',
        title: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TITLE'),
        text: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TEXT', { file_exts: '.doc, .docx, .ppt, .pptx, .txt, .pdf, .xlsx, .xls' }),
        footer: `<span style="margin-left: auto">UPLOAD_ERROR</span>`,
        allowEscapeKey: false,
        allowOutsideClick: false,
        allowEnterKey: false,
      });
    }
  }

  downloadFile(fileUrl: string) {
    window.open(fileUrl, '_blank');
  }

  onScroll(event) {
    this.scrollEvent = event;
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

  openFullScreen() {
    if (this.isStudent) {
      window.open(
        `./my-file?school=${this.schoolId}&student=${this.studentId}&title=${this.titleId}&class=${this.classId}&type=jobfullscreen`,
        '_blank',
      );
    } else if (this.isMentor) {
      window.open(
        `./students-card?school=${this.schoolId}&student=${this.studentId}&title=${this.titleId}&class=${this.classId}&type=jobfullscreen`,
        '_blank',
      );
    } else {
      window.open(
        `./school/${this.schoolId}?student=${this.studentId}&title=${this.titleId}&class=${this.classId}&type=jobfullscreen`,
        '_blank',
      );
    }
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
  }
  exportPdf() {

    const html = STYLE + this.jobDescriptionPDF.getPdfScoreHtml();
    const filename = `Student Job Description PDF`;
    this.transcriptBuilderService.generatePdf(html, filename).subscribe((res: any) => {
      const link = document.createElement('a');
      link.setAttribute('type', 'hidden');
      link.download = res.filename;
      link.href = environment.PDF_SERVER_URL + res.filePath;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }
}
