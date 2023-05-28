import { Component, Input, OnDestroy, OnInit, Output, ViewChild, ViewEncapsulation } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { EventEmitter } from '@angular/core';
import { EMPTY, forkJoin } from 'rxjs';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { FormFillingRevisionDialogComponent } from '../form-filling-revision-dialog/form-filling-revision-dialog.component';
import { FormFillingService } from '../form-filling.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { switchMap, take } from 'rxjs/operators';
import * as _ from 'lodash';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { StepDynamicMessageDialogComponent } from 'app/shared/components/step-dynamic-message-dialog/step-dynamic-message-dialog.component';
import * as moment from 'moment';
import { MatDatepicker } from '@angular/material/datepicker';
import { StudentsService } from 'app/service/students/students.service';
import { SchoolService } from 'app/service/schools/school.service';

@Component({
  selector: 'ms-form-fill-normal-question',
  templateUrl: './form-fill-normal-question.component.html',
  styleUrls: ['./form-fill-normal-question.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe],
})
export class FormFillNormalQuestionComponent implements OnInit, OnDestroy {
  @Input() currentStepIndex: number;
  @Input() stepData: any;
  @Input() formDetail: any;
  @Input() userData: any;
  @Input() formData: any;
  @Input() fieldsSurvey: any;
  @Input() isReceiver: any;
  @Output() triggerRefresh: EventEmitter<any> = new EventEmitter();
  @ViewChild('myDatepickers', { static: false }) dp: any;
  private subs = new SubSink();
  templateStepForm: UntypedFormGroup;
  intVal: any;
  timeOutVal: any;
  // editor: any = DecoupledEditor;
  disable = false;
  isValidator = false;
  formId: any;
  isRevisionUser: any = false;
  isWaitingForResponse = false;
  relationList = ['father', 'mother', 'grandfather', 'grandmother', 'uncle', 'aunt', 'other'];
  nationalities: any[];
  cities: any;
  departments: any;
  regions: any;
  regionsParents: any;
  departmentsParent: any;
  citiesParent: any;
  isUsingStepMessage: boolean = false;
  isAccepted = false;
  messageDialogRef: MatDialogRef<StepDynamicMessageDialogComponent>;
  finalStep: any;
  questionnaireConsts;
  questionnaireFields: string[];
  countryList = [];
  nationalityList = [];
  nationalList = [];
  isAllowedToEditAfterSubmitStep: boolean;
  categoryInsertionFollowUpField = [ 
    { key: "FORMATION_INITIALE", value: "Formation initiale (=convention de stage)" }, 
    { key: "CONTRAT_DAPPRENTISSAGE", value: "Contrat d'apprentissage" }, 
    { key: "CONTRAT_DE_PROFESSIONNALISATION", value: "Contrat de professionnalisation" }, 
    { key: "STATUT_DE_STAGIAIRE_DE_LA_FORMATION_PROFESSIONNELLE", value: "Statut de stagiaire de la formation professionnelle (=demandeur d'emploi / salarié)" }, 
  ]

  constructor(
    private fb: UntypedFormBuilder,
    private dialog: MatDialog,
    private formFillingService: FormFillingService,
    private formBuilderService: FormBuilderService,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUtc: ParseLocalToUtcPipe,
    private rncpTitleService: RNCPTitlesService,
    private utilityService: UtilityService,
    private studentsService: StudentsService,
    private router: Router,
    private studentService: StudentsService,
    private schoolService: SchoolService,
  ) {}

  ngOnInit() {
    this.formId = this.route.snapshot.queryParamMap.get('formId');
    this.nationalities = this.studentsService.getNationalitiesList();
    this.initTemplateStepForm();
    this.populateStepData(_.cloneDeep(this.stepData));
    this.checkStepNotificationOrMessage();
    if (!this.formDetail.isPreview) {
      this.checkDisableForm();
    }


    this.initFormFillChangeEventListener();
    this.questionnaireConsts = this.formBuilderService.getQuestionnaireConst();
    this.checkStaticFieldType();
    this.getCountryAndNationality();
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
  
  initFormFillChangeEventListener() {
    this.formFillingService.formFillChangeEvent$.subscribe((resp) => {
      if (resp) {

      }
    });
  }

  ngOnDestroy(): void {
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
    } else {
      this.disable = true;
    }
    this.isRevisionUser = this.userData.entities.find((ent) => {
      if (ent && ent.type && this.stepData.revision_user_type && ent.type._id === this.stepData.revision_user_type) {
        return true;
      } else {
        return false;
      }
    });
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

  populateStepData(tempStep: any) {
    let isPreviousCourse = false;
    let previousCourseData;
    if (this.formDetail.formType === 'employability_survey') {
      if (this.formData?.class_id?._id && this.formData?.rncp_title_id?._id && this.formData?.school_id?._id) {
        if (this.formData?.student_id?.rncp_title?._id !== this.formData?.rncp_title_id?._id || this.formData?.student_id?.current_class?._id !== this.formData?.class_id?._id || this.formData?.student_id?.school?._id !== this.formData?.school_id?._id) {
          isPreviousCourse = true;
          if (isPreviousCourse && this.formData?.student_id?.previous_courses_id && this.formData?.student_id?.previous_courses_id?.length) {
            previousCourseData = this.formData?.student_id?.previous_courses_id.find((prev) => {
              if (prev?.class_id?._id === this.formData?.class_id?._id && prev?.rncp_id?._id === this.formData?.rncp_title_id?._id && prev?.school_id?._id === this.formData?.school_id?._id) {
                return prev;
              }
            })

          }
        }
      }
    }
    if (tempStep) {
      if (tempStep.segments && tempStep.segments.length) {
        tempStep.segments.forEach((segment, segmentIndex) => {
          if (!this.getSegmentFormarray() || (this.getSegmentFormarray() && this.getSegmentFormarray().length < tempStep.segments.length)) {
            this.addSegmentForm(); // only add if length of segment does not match what has been initialized
          }
          if (segment.questions && segment.questions.length) {
            segment.questions.forEach((question, questionIndex) => {
              if (!this.getQuestionFieldFormArray(segmentIndex)) {
                this.addQuestionFieldForm(segmentIndex);
              } else if (
                this.getQuestionFieldFormArray(segmentIndex) &&
                this.getQuestionFieldFormArray(segmentIndex).length < segment.questions.length
              ) {
                this.addQuestionFieldForm(segmentIndex);
              } else {
                return;
              }

              if (!question.multiple_option_validation) {
                question.multiple_option_validation = {};
              }

              if (question.options && question.options.length) {
                question.options.forEach((option, optionIdx) => {
                  const options = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('options') as UntypedFormArray;
                  const group = this.initOptionFieldForm();
                  options.push(group);
                });
              }

              if (question?.answer_type === 'date' && question?.date_format) {
                const map = {
                  DDMMYYYY: 'DD/MM/YYYY',
                  DDMM: 'DD/MM',
                  MMYYYY: 'MM/YYYY',
                  DD: 'DD',
                  MM: 'MM',
                  YYYY: 'YYYY',
                };
                if (map[question.date_format]) {
                  question.date_format = map[question.date_format];
                }
              }

              if (question?.answer_type === 'date' && question?.date_format && typeof question?.date_value === 'string') {
                question.date_value = moment(question.date_value, question?.date_format).toDate();
              }

              if (
                question.answer_type &&
                question.answer_type === 'date' &&
                question.answer_date &&
                question.answer_date.date &&
                question.answer_date.time
              ) {
                question.answer_date = this.formatStringAnswerToDate(question.answer_date);
              } else if (
                question.answer_type &&
                question.answer_type === 'date' &&
                question.answer_date &&
                question.answer_date.hasOwnProperty('date') &&
                question.answer_date.date === null
              ) {
                question.answer_date = ''; // doing this to prevent passing object to form which will cause it to be eternally invalid
              }

              if (question.answer_type && question.answer_type === 'single_option' && question.is_required) {
                this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('answer').setValidators([Validators.required]);
                this.templateStepForm.updateValueAndValidity();
              }

              if (question.answer_type && question.answer_type === 'email') {
                const validators = [Validators.email];
                if (question.is_required) validators.push(Validators.required);
                this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('answer').setValidators(validators);
                this.templateStepForm.updateValueAndValidity();
              }

              // set checkbox answer type to required as it cannot be set with [required] from the template
              if (question.answer_type && question.answer_type === 'multiple_option') {
                const validators = [];
                if (question.is_required) validators.push(Validators.required);

                if (
                  ((question.answer_multiple && question.answer_multiple.length && !question.is_required) || question.is_required) &&
                  question.multiple_option_validation &&
                  question.multiple_option_validation.condition &&
                  question.multiple_option_validation.number
                ) {
                  const conditions = {
                    'Select at least': (c: UntypedFormControl) => {
                      const condition = c.value && c.value.length && c.value.length >= question.multiple_option_validation.number;
                      return condition ? null : { minSelection: true };
                    },
                    'Select at most': (c: UntypedFormControl) => {
                      const condition = c.value && c.value.length && c.value.length <= question.multiple_option_validation.number;
                      return condition ? null : { maxSelection: true };
                    },
                    'Select exactly': (c: UntypedFormControl) => {
                      const condition = c.value && c.value.length && c.value.length === question.multiple_option_validation.number;
                      return condition ? null : { exactSelection: true };
                    },
                  };
                  validators.push(conditions[question.multiple_option_validation.condition]);
                }
                if (question?.is_field && question?.is_required) {
                  this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('answer').setValidators(Validators.required);
                } else {
                  this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('answer_multiple').setValidators(validators);
                }
                this.templateStepForm.updateValueAndValidity();
              }

              if (question.answer_type && question.answer_type === 'parent_child_option' && question.is_required) {
                this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('answer').setValidators([Validators.required]);
                this.templateStepForm.updateValueAndValidity();
              }

              if (question && question.parent_child_options && question.parent_child_options.length) {
                question.parent_child_options.forEach((parentChildOption1, pcIndex1) => {
                  const parentChildArray1 = this.getQuestionFieldFormArray(segmentIndex)
                    .at(questionIndex)
                    .get('parent_child_options') as UntypedFormArray;
                  if (!parentChildArray1) return;
                  parentChildArray1.push(this.initParentChildOptionForm());
                  if (parentChildOption1.questions && parentChildOption1.questions.length) {
                    parentChildOption1.questions.forEach((pc1Question, pc1QuestionIndex) => {
                      const pcQuestionArray1 = parentChildArray1.at(pcIndex1).get('questions') as UntypedFormArray;
                      pcQuestionArray1.push(this.initParentChildOptionQuestionForm());

                      if (pc1Question && pc1Question.parent_child_options && pc1Question.parent_child_options.length) {
                        this.recursiveParentChild(pcQuestionArray1, pc1Question, pc1QuestionIndex);
                      }
                    });
                  }
                });
              }

              if(this.stepData?.step_status === 'not_started' && !this.formDetail?.isPreview && question?.is_field) {
                if(this.fieldsSurvey?.length) {
                  this.fieldsSurvey.forEach(fieldSurvey => {
                    if(fieldSurvey?.question_label === question?.field_type) {
                      question.answer = fieldSurvey?.question_answer;
                    }
                  });
                }
              }

              if (
                question.is_field &&
                this.formDetail &&
                (this.formDetail.formType === 'student_admission') &&
                this.formData &&
                this.formData.student_id &&
                !question.answer
              ) {
                question.answer = this.populateFieldStudent(question, this.formData.student_id);
              } else if (
                question.is_field &&
                this.formDetail &&
                this.formDetail.formType === 'quality_form' &&
                this.formData &&
                this.formData.user_id &&
                !question.answer
              ) {
                question.answer = this.populateFieldUser(question, this.formData.user_id);
              } else if (
                question.is_field &&
                this.formDetail &&
                this.formDetail.formType === 'employability_survey' &&
                this.formData &&
                this.formData.student_id &&
                !question.answer
              ) {
                if (isPreviousCourse) {
                  const studentData = _.cloneDeep(this.formData.student_id);
                  studentData.rncp_title = previousCourseData?.rncp_id;
                  studentData.current_class = previousCourseData?.class_id;
                  studentData.specialization = previousCourseData?.specialization;
                  studentData.school = previousCourseData?.school_id;
                  question.answer = this.populateFieldStudent(question, studentData);
                } else {
                  question.answer = this.populateFieldStudent(question, this.formData.student_id);
                }
              }
              if (question?.is_field && ['student_date_of_birth', 'certidegree_date_of_issuance'].includes(question?.field_type) && question?.answer) {
                // this.formatDateOfBirth(tempStep, segmentIndex, questionIndex);
                question.answer = this.formatDateOfBirth(question.answer);
              }
              if (this.formData && this.formData.steps && this.formData.steps.length) {
                this.finalStep = this.formData.steps.find((step) => step.is_final_step);
              }
            });
          }
        });
      }
      this.cleanNullValues(tempStep);
      this.templateStepForm.patchValue(tempStep);
      // comment this code because why should save step after patch value, confirmed by bg bayu
      // if (!this.formDetail?.isPreview) this.saveStep().subscribe();

    }
  }
  populateFieldStudent(question, data) {
    if (question.field_type === 'student_civility') {
      return data.civility;
    } else if (question.field_type === 'student_first_name') {
      return data.first_name;
    } else if (question.field_type === 'student_last_name') {
      return data.last_name;
    } else if (question.field_type === 'student_phone') {
      return data.tele_phone;
    } else if (question.field_type === 'student_email') {
      return data.email;
    } else if (question.field_type === 'student_date_of_birth') {
      let date = this.parseStringDatePipe.transformMinusOne(data.date_of_birth);
      date = moment(date).format('DD/MM/YYYY');
      return date;
    } else if (question.field_type === 'student_place_of_birth') {
      return data.place_of_birth;
    } else if (question.field_type === 'student_postal_code_of_birth') {
      return data.postal_code_of_birth;
    } else if (question.field_type === 'student_nationality') {
      return data.nationality;
    } else if (question.field_type === 'student_address' && data.student_address && data.student_address.length) {
      return data.student_address[0].address;
    } else if (question.field_type === 'student_zipcode' && data.student_address && data.student_address.length) {
      return data.student_address[0].postal_code;
    } else if (question.field_type === 'student_country' && data.student_address && data.student_address.length) {
      return data.student_address[0].country;
    } else if (question.field_type === 'student_city' && data.student_address && data.student_address.length) {
      return data.student_address[0].city;
    } else if (question.field_type === 'student_department' && data.student_address && data.student_address.length) {
      return data.student_address[0].department;
    } else if (question.field_type === 'student_region' && data.student_address && data.student_address.length) {
      return data.student_address[0].region;
    } else if (question.field_type === 'student_title' && data.rncp_title) {
      return data.rncp_title.short_name;
    } else if (question.field_type === 'student_class' && data.current_class) {
      return data.current_class.name;
    } else if (question.field_type === 'student_specialization' && data.specialization) {
      return data.specialization.name;
    } else if (data.parents && data.parents.length) {
      if (question.field_type === 'parent_relation') {
        return data.parents[0] && data.parents[0].relation;
      } else if (question.field_type === 'parent_civility') {
        return data.parents[0] && data.parents[0].civility;
      } else if (question.field_type === 'parent_first_name') {
        return data.parents[0] && data.parents[0].name;
      } else if (question.field_type === 'parent_last_name') {
        return data.parents[0] && data.parents[0].family_name;
      } else if (question.field_type === 'parent_phone') {
        return data.parents[0] && data.parents[0].tele_phone;
      } else if (question.field_type === 'parent_email') {
        return data.parents[0] && data.parents[0].email;
      } else if (question.field_type === 'parent2_relation') {
        return data.parents[1] && data.parents[1].relation;
      } else if (question.field_type === 'parent2_civility') {
        return data.parents[1] && data.parents[1].civility;
      } else if (question.field_type === 'parent2_first_name') {
        return data.parents[1] && data.parents[1].name;
      } else if (question.field_type === 'parent2_last_name') {
        return data.parents[1] && data.parents[1].family_name;
      } else if (question.field_type === 'parent2_phone') {
        return data.parents[1] && data.parents[1].tele_phone;
      } else if (question.field_type === 'parent2_email') {
        return data.parents[1] && data.parents[1].email;
      }
      if (data.parents[0] && data.parents[0].parent_address && data.parents[0].parent_address.length) {
        if (question.field_type === 'parent_address') {
          return data.parents[0].parent_address[0].address;
        } else if (question.field_type === 'parent_zipcode') {
          return data.parents[0].parent_address[0].postal_code;
        } else if (question.field_type === 'parent_country') {
          return data.parents[0].parent_address[0].country;
        } else if (question.field_type === 'parent_city') {
          return data.parents[0].parent_address[0].city;
        } else if (question.field_type === 'parent_department') {
          return data.parents[0].parent_address[0].department;
        } else if (question.field_type === 'parent_region') {
          return data.parents[0].parent_address[0].region;
        }
      }
      if (data.parents[1] && data.parents[1].parent_address && data.parents[1].parent_address.length) {
        if (question.field_type === 'parent2_address') {
          return data.parents[1].parent_address[0].address;
        } else if (question.field_type === 'parent2_zipcode') {
          return data.parents[1].parent_address[0].postal_code;
        } else if (question.field_type === 'parent2_country') {
          return data.parents[1].parent_address[0].country;
        } else if (question.field_type === 'parent2_city') {
          return data.parents[1].parent_address[0].city;
        } else if (question.field_type === 'parent2_department') {
          return data.parents[1].parent_address[0].department;
        } else if (question.field_type === 'parent2_region') {
          return data.parents[1].parent_address[0].region;
        }
      }
    }
  }

  populateFieldUser(question, data) {
    if (question.field_type === 'student_civility') {
      return data.civility;
    } else if (question.field_type === 'student_first_name') {
      return data.first_name;
    } else if (question.field_type === 'student_last_name') {
      return data.last_name;
    } else if (question.field_type === 'student_phone') {
      return data.portable_phone ? data.portable_phone : data.office_phone;
    } else if (question.field_type === 'student_email') {
      return data.email;
    } else if (question.field_type === 'student_address' && data.address && data.address.length) {
      return data.address[0].address;
    } else if (question.field_type === 'student_zipcode' && data.address && data.address.length) {
      return data.address[0].postal_code;
    } else if (question.field_type === 'student_country' && data.address && data.address.length) {
      return data.address[0].country;
    } else if (question.field_type === 'student_city' && data.address && data.address.length) {
      return data.address[0].city;
    } else if (question.field_type === 'student_department' && data.address && data.address.length) {
      return data.student_address[0].department;
    } else if (question.field_type === 'student_region' && data.address && data.address.length) {
      return data.address[0].region;
    } else if (question.field_type === 'student_title' && this.formData.rncp_title_id) {
      return this.formData.rncp_title_id.short_name;
    } else if (question.field_type === 'student_class' && this.formData.class_id) {
      return this.formData.class_id.name;
    }
    // else if (question.field_type === 'student_specialization' && this.formData.class_id && this.formData.class_id.specializations && this.formData.class_id.specializations.length) {
    //   const found = this.formData.class_id.specializations.find(spec => spec._id === this.formData.class_id)
    //   if (found) {
    //     return found.name
    //   }
    // }
  }

  cleanNullValues(obj) {
    return Object.keys(obj).forEach((key) => {
      if (obj[key] && typeof obj[key] === 'object') {
        this.cleanNullValues(obj[key]);
      } else if (obj[key] === null) {
        delete obj[key];
      }
    });
  }

  formatStringAnswerToDate(date_answer: { date: string; time: string }) {
    return this.parseStringDatePipe.transformStringToDate(date_answer.date);
  }

  formatDateOfBirth(answer: string) {
    return this.parseStringDatePipe.transformStringToDate(answer);
  }

  // to set options when user tick multiple options
  setOptions(segmentIndex: number, questionIndex: number, value: string, isRequired) {
    const answers = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('answer_multiple');
    const answersValue = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('answer_multiple').value;
    const multipleOption = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('multiple_option_validation').value;

    if (!answers.touched) answers.markAsTouched();
    if (answers.pristine) answers.markAsDirty();
    let currentAnswers = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).value.answer_multiple;
    currentAnswers = currentAnswers ? currentAnswers : []; // if the currentAnswers are null by default, make it into an empty array
    let indexOfExistingValue = currentAnswers.indexOf(value);
    if (indexOfExistingValue >= 0) {
      // if exist remove
      currentAnswers.splice(indexOfExistingValue, 1);
    } else {
      // if not we add
      currentAnswers.push(value);
    }
    this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).patchValue({ answer_multiple: currentAnswers });
    this.getQuestionFieldFormArray(segmentIndex).updateValueAndValidity();
    if (answers.touched && answers.dirty && isRequired === false) {
      if (answersValue && answersValue.length && multipleOption && multipleOption.condition && multipleOption.number) {
        const validators = [];
        const conditions = {
          'Select at least': (c: UntypedFormControl) => {
            const condition = c.value && c.value.length && c.value.length >= multipleOption.number;
            return condition ? null : { minSelection: true };
          },
          'Select at most': (c: UntypedFormControl) => {
            const condition = c.value && c.value.length && c.value.length <= multipleOption.number;
            return condition ? null : { maxSelection: true };
          },
          'Select exactly': (c: UntypedFormControl) => {
            const condition = c.value && c.value.length && c.value.length === multipleOption.number;
            return condition ? null : { exactSelection: true };
          },
        };
        validators.push(conditions[multipleOption.condition]);
        this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('answer_multiple').setValidators(validators);
        this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('answer_multiple').updateValueAndValidity();
      } else {
        this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('answer_multiple').clearValidators();
        this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('answer_multiple').updateValueAndValidity();
      }
    }
  }

  initTemplateStepForm() {
    this.templateStepForm = this.fb.group({
      _id: [null],
      step_title: [''],
      is_validation_required: [false],
      step_type: [null],
      validator: [null],
      direction: [''],
      segments: this.fb.array([]),
    });
  }

  initSegmentForm() {
    return this.fb.group({
      segment_title: [''],
      questions: this.fb.array([]),
    });
  }

  initQuestionFieldForm() {
    return this.fb.group({
      _id: [null],
      ref_id: [{ value: null, disabled: true }],
      field_type: [null],
      is_field: [false],
      is_editable: [false],
      is_required: [false],
      field_position: [null],
      options: this.fb.array([]),
      question_label: [''],
      answer_type: [],
      answer: [null],
      answer_number: [null, [Validators.max(2147483647)]], // max value for int32
      answer_date: [null],
      answer_multiple: [null],
      answer_time: ['00:00'],
      answer_duration: ['00:00:00'],
      date_format: [null],
      date_value: [null],
      text_validation: this.fb.group({
        condition: [''],
        custom_error_text: [''],
        number: [null],
      }),
      numeric_validation: this.fb.group({
        condition: [''],
        custom_error_text: [''],
        number: [null],
        min_number: [null],
        max_number: [null],
      }),
      multiple_option_validation: this.fb.group({
        condition: [null],
        number: [null],
        custom_error_text: [null],
      }),
      parent_child_options: this.fb.array([]),
    });
  }

  initOptionFieldForm(): UntypedFormGroup {
    return this.fb.group({
      option_name: [null],
      is_continue_next_step: [false],
      is_go_to_final_step: [false],
      additional_step_id: [null],
      is_go_to_final_message: [false],
    });
  }

  initParentChildOptionForm() {
    return this.fb.group({
      option_text: [''],
      position: [''],
      questions: this.fb.array([]),
    });
  }

  initParentChildOptionQuestionForm() {
    return this.fb.group({
      question_name: [''],
      answer: [null],
      answer_type: [null],
      answer_number: [null],
      answer_date: this.fb.group({
        date: [null],
        time: [null],
      }),
      is_answer_required: [null],
      parent_child_options: this.fb.array([]),
    });
  }

  recursiveParentChild(pcQuestionArray: UntypedFormArray, pcQuestionData, pcQuestionIndex) {
    pcQuestionData.parent_child_options.forEach((parentChildOption2, pcIndex2) => {
      const parentChildArray = pcQuestionArray.at(pcQuestionIndex).get('parent_child_options') as UntypedFormArray;
      parentChildArray.push(this.initParentChildOptionForm());
      if (parentChildOption2.questions && parentChildOption2.questions.length) {
        parentChildOption2.questions.forEach((pc2Question, pc2QuestionIndex) => {
          const pcQuestionArray2 = parentChildArray.at(pcIndex2).get('questions') as UntypedFormArray;
          pcQuestionArray2.push(this.initParentChildOptionQuestionForm());
          if (pc2Question && pc2Question.parent_child_options && pc2Question.parent_child_options.length) {
            this.recursiveParentChild(pcQuestionArray2, pc2Question, pc2QuestionIndex);
          }
        });
      }
    });
  }

  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  getSegmentFormarray(): UntypedFormArray {
    return this.templateStepForm.get('segments') as UntypedFormArray;
  }

  addSegmentForm() {
    this.getSegmentFormarray().push(this.initSegmentForm());
    if (this.getSegmentFormarray() && this.getSegmentFormarray().length) {
      this.templateStepForm.get('step_type').disable();
    }
  }

  getQuestionFieldFormArray(segmentIndex): UntypedFormArray {
    return this.getSegmentFormarray().at(segmentIndex).get('questions') as UntypedFormArray;
  }

  getNextQuestionField(segmentIndex, questionIndex) {
    return this.getQuestionFieldFormArray(segmentIndex).at(questionIndex + 1);
  }

  getPreviousQuestionField(segmentIndex, questionIndex) {
    const idx = questionIndex === 0 ? 0 : questionIndex - 1;
    return this.getQuestionFieldFormArray(segmentIndex).at(idx);
  }

  addQuestionFieldForm(segmentIndex) {
    this.getQuestionFieldFormArray(segmentIndex).push(this.initQuestionFieldForm());
  }

  getOptionsFormArrayFrom(questionField: UntypedFormGroup) {
    return questionField.get('options') as UntypedFormArray;
  }

  checkTypeForValidation(segmentIndex, index, isRequired) {
    const answerType = this.getQuestionFieldFormArray(segmentIndex).at(index).get('answer_type').value;
    const currentValue = this.getQuestionFieldFormArray(segmentIndex).at(index).get('answer');
    const lengthInput = this.getQuestionFieldFormArray(segmentIndex).at(index).get('text_validation').get('number').value;
    const conditionInput = this.getQuestionFieldFormArray(segmentIndex).at(index).get('text_validation').get('condition').value;
    // const errorTextInput = this.getQuestionFieldFormArray(segmentIndex).at(index).get('text_validation').get('custom_error_text').value;
    if (answerType === 'short_text' || answerType === 'long_text') {
      if (conditionInput === 'Min Character') {
        this.getQuestionFieldFormArray(segmentIndex)
          .at(index)
          .get('answer')
          .addValidators([Validators.minLength(lengthInput)]);
        this.getQuestionFieldFormArray(segmentIndex)
            .at(index)
            .get('answer')
            .updateValueAndValidity();
      } else if (conditionInput === 'Max Character') {
        this.getQuestionFieldFormArray(segmentIndex)
          .at(index)
          .get('answer')
          .addValidators([Validators.maxLength(lengthInput)]);
        this.getQuestionFieldFormArray(segmentIndex)
          .at(index)
          .get('answer')
          .updateValueAndValidity();
      }
    }
    if (!isRequired && !currentValue.value) {
      currentValue.clearValidators();
      currentValue.setErrors(null);
    }
  }

  checkValidationNumeric(segmentIndex, index, isRequired) {
    const inputControl = this.getQuestionFieldFormArray(segmentIndex).at(index).get('answer_number');
    const formValue = this.getQuestionFieldFormArray(segmentIndex).at(index).get('answer_number').value
      ? this.getQuestionFieldFormArray(segmentIndex).at(index).get('answer_number').value
      : 0;


    const min = Number(this.getQuestionFieldFormArray(segmentIndex).at(index).get('numeric_validation').get('min_number').value);
    const max = Number(this.getQuestionFieldFormArray(segmentIndex).at(index).get('numeric_validation').get('max_number').value);
    const number = Number(this.getQuestionFieldFormArray(segmentIndex).at(index).get('numeric_validation').get('number').value);
    const conditionInput = this.getQuestionFieldFormArray(segmentIndex).at(index).get('numeric_validation').get('condition').value;
    if (conditionInput === 'Greater than') {
      if (formValue > number || !inputControl.value) {
        inputControl.setErrors(null);
      } else if (inputControl.value && isRequired) {
        inputControl.setErrors({ errors: true });
      }
    } else if (conditionInput === 'Greater than or equal to') {
      if (formValue >= number || !inputControl.value) {
        inputControl.setErrors(null);
      } else if ((inputControl.value && isRequired) || !isRequired) {
        inputControl.setErrors({ errors: true });
      }
    } else if (conditionInput === 'Less than') {
      if (formValue < number || !inputControl.value) {
        inputControl.setErrors(null);
      } else if ((inputControl.value && isRequired) || !isRequired) {
        inputControl.setErrors({ errors: true });
      }
    } else if (conditionInput === 'Less than or equal to') {
      if (formValue <= number || !inputControl.value) {
        inputControl.setErrors(null);
      } else if ((inputControl.value && isRequired) || !isRequired) {
        inputControl.setErrors({ errors: true });
      }
    } else if (conditionInput === 'Equal to') {
      if (formValue === number || !inputControl.value) {
        inputControl.setErrors(null);
      } else if ((inputControl.value && isRequired) || !isRequired) {
        inputControl.setErrors({ errors: true });
      }
    } else if (conditionInput === 'Not equal to') {
      if (formValue !== number || !inputControl.value) {
        inputControl.setErrors(null);
      } else if ((inputControl.value && isRequired) || !isRequired) {
        inputControl.setErrors({ errors: true });
      }
    } else if (conditionInput === 'Between') {
      const value = Number(inputControl.value);
      if ((min < value && value < max) || !inputControl.value) {
        inputControl.setErrors(null);
      } else if ((inputControl.value && isRequired) || !isRequired) {
        inputControl.setErrors({ errors: true });
      }
    } else if (conditionInput === 'Not between') {
      const value = Number(inputControl.value);
      if (min >= value || value >= max || !inputControl.value) {
        inputControl.setErrors(null);
      } else if ((inputControl.value && isRequired) || !isRequired) {
        inputControl.setErrors({ errors: true });
      }
    } else {
      return;
    }
    if (!inputControl.value && isRequired) {
      inputControl.setErrors({ required: true });
    }
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
        this.isWaitingForResponse = true;
        this.saveStep().subscribe(
          (resps) => {
            if (resps) {
              this.acceptStep().subscribe(
                (resp) => {
                  if (resp) {
                    const stepID = this.stepData.form_builder_step._id;
                    const formProcessID = this.formDetail.formId;
                    const isPreview = typeof this.formDetail.isPreview === 'boolean' ? this.formDetail.isPreview : false;
                    const triggerCondition = 'waiting_for_validation';
                    this.subs.sink = this.formBuilderService
                      .generateFormBuilderStepMessage(stepID, formProcessID, isPreview, triggerCondition)
                      .subscribe((resp) => {
                        this.isWaitingForResponse = false;
                        if (resp) {
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
                                triggerCondition: triggerCondition,
                              },
                            })
                            .afterClosed()
                            .subscribe((result) => {
                              this.isWaitingForResponse = true;
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
                          });
                          this.triggerRefresh.emit(this.formId);
                        }
                      });
                  }
                },
                (err) => {
                  this.isWaitingForResponse = false;
                },
              );
            }
          },
          (err) => {
            this.isWaitingForResponse = false;
          },
        );
      } else return;
    });
  }

  nextStepMessage(type) {
    const payload = this.templateStepForm.value;
    this.formatPayload(payload);
    if (this.templateStepForm.invalid /*  || this.isPhotoMandatory */) {
      this.templateStepForm.markAllAsTouched();
      Swal.fire({
        type: 'info',
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
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
      const triggerCondition = type === 'waiting_for_validation' ? (this.stepData.is_validation_required ? type : 'validated') : type;
      this.subs.sink = this.formBuilderService.generateFormBuilderStepMessage(stepID, formProcessID, isPreview, triggerCondition).subscribe(
        (resp) => {
          if (resp) {
            this.subs.sink = this.saveStep()
              .pipe(
                take(1),
                switchMap((resp) => {
                  if (resp) {
                    return this.acceptStep();
                  } else {
                    this.isWaitingForResponse = false;
                    return EMPTY;
                  }
                }),
              )
              .subscribe((resp) => {
                this.isWaitingForResponse = false;

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
                      triggerCondition: triggerCondition,
                    },
                  })
                  .afterClosed()
                  .subscribe((result) => {
                    this.isWaitingForResponse = true;
                    this.triggerRefresh.emit(this.formId);
                  });
              });
          } else {
            this.isWaitingForResponse = false;
            this.acceptContinueNextStep();
          }
        },
        (error) => {
          this.isWaitingForResponse = false;
          this.acceptContinueNextStep();
          console.error(error);
        },
      );
    } else {
      this.acceptContinueNextStep();
    }
  }

  checkStepAnswerAndRouter() {
    let answerAndRouter = false;
    const stepSegmentData = _.cloneDeep(this.stepData?.segments);
    const formSegmentData = _.cloneDeep(this.templateStepForm?.value?.segments);
    if (stepSegmentData?.length) {
      for (let i = 0; i < stepSegmentData.length; i++) {
        if (stepSegmentData[i]?.questions?.length) {
          for (let j = 0; j < stepSegmentData[i]?.questions?.length; j++) {
            if (stepSegmentData[i]?.questions[j]?.is_router_on) {
              if(stepSegmentData[i]?.questions[j]?.answer !== formSegmentData[i]?.questions[j]?.answer) {
                answerAndRouter = true;
                break;
              }
            }
          }
        }
      }
    }
    return answerAndRouter;
  }

  acceptContinueNextStep() {
    if (this.templateStepForm.invalid) {
      this.templateStepForm.markAllAsTouched();
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
    
    if (this.stepData?.step_status === 'accept' && this.checkStepAnswerAndRouter()) {
      let timeDisabled = 6;
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Update_Form_S1.TITLE'),
        html: this.translate.instant('Update_Form_S1.TEXT'),
        confirmButtonText: this.translate.instant('Update_Form_S1.BUTTON_1'),
        cancelButtonText: this.translate.instant('Update_Form_S1.BUTTON_2'),
        showCancelButton: true,
        allowOutsideClick: false,
        allowEnterKey: false,
        allowEscapeKey: true,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('Update_Form_S1.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('Update_Form_S1.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        if (res.value) {
          let swalTitle: string;
          let swalText: string;
          let swalConfirm: string;
          if (
            this.stepData.isCompletingUser &&
            !this.isValidator &&
            this.stepData.is_validation_required &&
            this.stepData.step_status !== 'accept'
          ) {
            swalTitle = this.translate.instant('UserForm_S6.TITLE');
            swalText = this.translate.instant('UserForm_S6.TEXT');
            swalConfirm = this.translate.instant('UserForm_S6.CONFIRM');
          } else {
            swalTitle = 'Bravo !';
            swalText = null;
            swalConfirm = 'OK';
          }
          this.isWaitingForResponse = true;
          if (!this.formDetail.isPreview) {
            this.subs.sink = this.saveStep()
              .pipe(
                take(1),
                switchMap((resp) => {
                  if (resp) {
                    return this.acceptStep();
                  } else {
                    this.isWaitingForResponse = false;
                    return EMPTY;
                  }
                }),
              )
              .subscribe((resp) => {
                this.isWaitingForResponse = false;

                Swal.fire({
                  type: 'success',
                  title: swalTitle,
                  text: swalText ? swalText : '',
                  confirmButtonText: swalConfirm,
                  allowEnterKey: false,
                  allowEscapeKey: false,
                  allowOutsideClick: false,
                }).then((response) => {
                  this.triggerRefresh.emit(this.formId);
                });
              });
          } else {
            this.triggerRefresh.emit(this.formId);
          }
        }
      });
    } else {
      let swalTitle: string;
      let swalText: string;
      let swalConfirm: string;
      if (
        this.stepData.isCompletingUser &&
        !this.isValidator &&
        this.stepData.is_validation_required &&
        this.stepData.step_status !== 'accept'
      ) {
        swalTitle = this.translate.instant('UserForm_S6.TITLE');
        swalText = this.translate.instant('UserForm_S6.TEXT');
        swalConfirm = this.translate.instant('UserForm_S6.CONFIRM');
      } else {
        swalTitle = 'Bravo !';
        swalText = null;
        swalConfirm = 'OK';
      }
      this.isWaitingForResponse = true;
      if (!this.formDetail.isPreview) {
        this.subs.sink = this.saveStep()
          .pipe(
            take(1),
            switchMap((resp) => {
              if (resp) {
                return this.acceptStep();
              } else {
                this.isWaitingForResponse = false;
                return EMPTY;
              }
            }),
          )
          .subscribe((resp) => {
            this.isWaitingForResponse = false;

            Swal.fire({
              type: 'success',
              title: swalTitle,
              text: swalText ? swalText : '',
              confirmButtonText: swalConfirm,
              allowEnterKey: false,
              allowEscapeKey: false,
              allowOutsideClick: false,
            }).then((response) => {
              this.triggerRefresh.emit(this.formId);
            });
          });
      } else {
        this.triggerRefresh.emit(this.formId);
      }
    }
  }

  saveStep() {
    const payload = this.templateStepForm.value;
    this.formatPayload(payload);
    if (this.isValidator) {
      payload.validator = payload.validator._id;
      return this.formFillingService.createUpdateFormProcessStepAndQuestion(payload);
    } else {
      return this.formFillingService.createUpdateFormProcessStepAndQuestion(payload);
    }
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

  checkFormAccept() {
    if (this.formData && this.formData.admission_status === 'submitted') {
      this.isAccepted = true;
    } else if (this.formData && this.formData.admission_status === 'signing_process') {
      this.isAccepted = true;
    }
  }

  formatPayload(payload) {
    // format the dates
    for (const segment of payload.segments) {
      for (const question of segment.questions) {
        if (question && question.is_field && question.answer instanceof Date) {
          // for parsing back to string format for fields like date of birth
          question.answer = this.parseLocalToUtc.transformDate(question.answer.toLocaleDateString('en-GB'), '15:59');
        }
        if (question && question.answer_date && question.answer_date instanceof Date) {
          question.answer_date = {
            date: this.parseLocalToUtc.transformDate(question.answer_date.toLocaleDateString('en-GB'), '15:59'),
            time: '15:59',
          };
        } else if (question && question.answer_date === '') {

          // doing this to convert the modification above from "" to date object again if user did not fill the date
          question.answer_date = {
            date: null,
            time: null,
          };
        }
        if (question?.answer_type === 'date' && question?.date_value instanceof Date) {
          question.date_value = moment(question.date_value).format(question?.date_format || 'DD/MM/YYYY');
        }
        if (question?.is_field && question?.answer_type === 'multiple_option') {
          question.answer_multiple = [];
          question.answer_multiple.push(question.answer);
        }
        if (typeof question?.date_format === 'string') {
          question.date_format = question.date_format.replaceAll('/', '');
        }
      }
    }
    // format the validator from object to string of IDs
    if (payload && payload.validator && typeof payload.validator === 'object' && payload.validator._id) {
      payload.validator = payload.validator._id;
    }
    // format to remove the revise_request_messages
    if (payload && payload.revise_request_messages) {
      delete payload.revise_request_messages;
    }
  }

  acceptStep() {
    return this.formFillingService.acceptFormProcessStep(this.formId, this.templateStepForm.value._id);
  }

  saveOnFinalValidationRevision() {
    // Check if form is invalid
    if (this.templateStepForm.invalid) {
      this.templateStepForm.markAllAsTouched();
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
    this.subs.sink = this.saveStep().subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        Swal.fire({
          type: 'success',
          title: this.translate.instant('Bravo!'),
          confirmButtonText: this.translate.instant('OK'),
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((resp) => {
          this.triggerRefresh.emit(this.formId);
        });
      }
    });
  }

  swalValidate() {
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

  // Swal for completing the from
  swalCompleteForm() {
    Swal.fire({
      type: 'success',
      title: this.translate.instant('UserForm_S8.TITLE'),
      text: this.translate.instant('UserForm_S8.TEXT'),
      confirmButtonText: this.translate.instant('UserForm_S8.CONFIRM'),
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then(() => {
      return;
    });
  }

  getPostcodeData(data, segmentIndex, index) {


    const typeField = this.getQuestionFieldFormArray(segmentIndex).at(index).get('field_type').value;

    if (typeField === 'student_zipcode' || typeField === 'student_country') {
      let zipcode = this.getZipcodeForm(this.getQuestionFieldFormArray(segmentIndex));
      let isFormCountryFrance = this.checkHasCountry(this.getQuestionFieldFormArray(segmentIndex));
      if (zipcode && zipcode.length > 3) {
        this.subs.sink = this.rncpTitleService.getFilteredZipCode(zipcode, 'France').subscribe((resp) => {
          if (resp && resp.length) {
            this.setAddressDropdownStudent(resp);
            if (isFormCountryFrance) {
              let isFormHasCity = this.checkHasCity(this.getQuestionFieldFormArray(segmentIndex));
              if (isFormHasCity) {
                this.patchFormCity(this.getQuestionFieldFormArray(segmentIndex));
              }
              let isFormHasRegion = this.checkHasRegion(this.getQuestionFieldFormArray(segmentIndex));
              if (isFormHasRegion) {
                this.patchFormRegion(this.getQuestionFieldFormArray(segmentIndex));
              }
              let isFormDepartment = this.checkHasDepartment(this.getQuestionFieldFormArray(segmentIndex));
              if (isFormDepartment) {
                this.patchFormDepartment(this.getQuestionFieldFormArray(segmentIndex));
              }
            }
          }
        });
      }
    }

    if (typeField === 'parent_zipcode' || typeField === 'parent_country') {
      let zipcode = this.getZipcodeFormParent(this.getQuestionFieldFormArray(segmentIndex));
      let isFormCountryFrance = this.checkHasCountryParent(this.getQuestionFieldFormArray(segmentIndex));
      if (zipcode && zipcode.length > 3) {
        this.subs.sink = this.rncpTitleService.getFilteredZipCode(zipcode, 'France').subscribe((resp) => {
          if (resp && resp.length) {
            this.setAddressDropdownParent(resp);
            if (isFormCountryFrance) {
              let isFormHasCity = this.checkHasCityParent(this.getQuestionFieldFormArray(segmentIndex));
              if (isFormHasCity) {
                this.patchFormCityParent(this.getQuestionFieldFormArray(segmentIndex));
              }
              let isFormHasRegion = this.checkHasRegionParent(this.getQuestionFieldFormArray(segmentIndex));
              if (isFormHasRegion) {
                this.patchFormRegionParent(this.getQuestionFieldFormArray(segmentIndex));
              }
              let isFormDepartment = this.checkHasDepartmentParent(this.getQuestionFieldFormArray(segmentIndex));
              if (isFormDepartment) {
                this.patchFormDepartmentParent(this.getQuestionFieldFormArray(segmentIndex));
              }
            }
          }
        });
      }
    }
    // this.getQuestionFieldFormArray(segmentIndex).(datas);
  }

  // student

  getZipcodeFormParent(form) {
    let zipcode;
    for (const element of form.value) {
      if (element.field_type === 'parent_zipcode') {
        zipcode = element.answer;
        break;
      }
    }
    return zipcode;
  }

  getZipcodeForm(form) {
    let zipcode;
    for (const element of form.value) {
      if (element.field_type === 'student_zipcode') {
        zipcode = element.answer;
        break;
      }
    }
    return zipcode;
  }

  patchFormCity(form) {
    let cityData;
    let indexFound;
    for (const [index, element] of form.value.entries()) {
      if (element.field_type === 'student_city') {
        cityData = element;
        cityData.answer = this.cities[0];
        indexFound = index;
        break;
      }
    }

    form.at(indexFound).patchValue(cityData);
    form.updateValueAndValidity();
  }

  patchFormRegion(form) {
    let data;
    let indexFound;
    for (const [index, element] of form.value.entries()) {
      if (element.field_type === 'student_region') {
        data = element;
        data.answer = this.regions[0];
        indexFound = index;
        break;
      }
    }

    form.at(indexFound).patchValue(data);
    form.updateValueAndValidity();
  }

  patchFormDepartment(form) {
    let data;
    let indexFound;
    for (const [index, element] of form.value.entries()) {
      if (element.field_type === 'student_department') {
        data = element;
        data.answer = this.departments[0];
        indexFound = index;
        break;
      }
    }

    form.at(indexFound).patchValue(data);
    form.updateValueAndValidity();
  }

  setAddressDropdownStudent(resp: any) {
    const tempCities = [];
    const tempDepartments = [];
    const tempRegions = [];

    if (resp && resp.length) {
      resp.forEach((address) => {
        tempCities.push(address.city);
        tempDepartments.push(address.department);
        tempRegions.push(address.province);
      });

      this.cities = _.uniq(tempCities);
      this.departments = _.uniq(tempDepartments);
      this.regions = _.uniq(tempRegions);

    }
  }

  checkHasCountry(form) {
    let hasCountry = false;
    let hasZipcode = false;
    for (const element of form.value) {
      if (
        element.field_type === 'student_country' &&
        (this.utilityService.simplifyRegex(element.answer) === 'france' ||
          this.utilityService.simplifyRegex(element.answer) === 'francais' ||
          this.utilityService.simplifyRegex(element.answer) === 'francaise')
      ) {
        hasCountry = true;
      }
      if (element.field_type === 'student_zipcode') {
        hasZipcode = true;
      }
      if (hasCountry && hasZipcode) {
        break;
      }
    }
    return hasCountry && hasZipcode;
  }

  checkHasCity(form) {
    let hasCity = false;
    for (const element of form.value) {
      if (element.field_type === 'student_city') {
        hasCity = true;
        break;
      }
    }
    return hasCity;
  }

  checkHasRegion(form) {
    let hasRegion = false;
    for (const element of form.value) {
      if (element.field_type === 'student_region') {
        hasRegion = true;
        break;
      }
    }
    return hasRegion;
  }

  checkHasDepartment(form) {
    let hasDepartment = false;
    for (const element of form.value) {
      if (element.field_type === 'student_department') {
        hasDepartment = true;
        break;
      }
    }
    return hasDepartment;
  }

  // Parent

  setAddressDropdownParent(resp: any) {
    const tempCities = [];
    const tempDepartments = [];
    const tempRegions = [];

    if (resp && resp.length) {
      resp.forEach((address) => {
        tempCities.push(address.city);
        tempDepartments.push(address.department);
        tempRegions.push(address.province);
      });

      this.citiesParent = _.uniq(tempCities);
      this.departmentsParent = _.uniq(tempDepartments);
      this.regionsParents = _.uniq(tempRegions);

    }
  }

  patchFormCityParent(form) {
    let cityData;
    let indexFound;
    for (const [index, element] of form.value.entries()) {
      if (element.field_type === 'parent_city') {
        cityData = element;
        cityData.answer = this.citiesParent[0];
        indexFound = index;
        break;
      }
    }

    form.at(indexFound).patchValue(cityData);
    form.updateValueAndValidity();
  }

  patchFormRegionParent(form) {
    let data;
    let indexFound;
    for (const [index, element] of form.value.entries()) {
      if (element.field_type === 'parent_region') {
        data = element;
        data.answer = this.regionsParents[0];
        indexFound = index;
        break;
      }
    }

    form.at(indexFound).patchValue(data);
    form.updateValueAndValidity();
  }

  patchFormDepartmentParent(form) {
    let data;
    let indexFound;
    for (const [index, element] of form.value.entries()) {
      if (element.field_type === 'parent_department') {
        data = element;
        data.answer = this.departmentsParent[0];
        indexFound = index;
        break;
      }
    }
    form.at(indexFound).patchValue(data);
    form.updateValueAndValidity();
  }

  checkHasCountryParent(form) {
    let hasCountry = false;
    let hasZipcode = false;
    for (const element of form.value) {
      if (
        element.field_type === 'parent_country' &&
        (this.utilityService.simplifyRegex(element.answer) === 'france' ||
          this.utilityService.simplifyRegex(element.answer) === 'francais' ||
          this.utilityService.simplifyRegex(element.answer) === 'francaise')
      ) {
        hasCountry = true;
      }
      if (element.field_type === 'parent_zipcode') {
        hasZipcode = true;
      }
      if (hasCountry && hasZipcode) {
        break;
      }
    }
    return hasCountry && hasZipcode;
  }

  checkHasCityParent(form) {
    let hasCity = false;
    for (const element of form.value) {
      if (element.field_type === 'parent_city') {
        hasCity = true;
        break;
      }
    }
    return hasCity;
  }

  checkHasRegionParent(form) {
    let hasRegion = false;
    for (const element of form.value) {
      if (element.field_type === 'parent_region') {
        hasRegion = true;
        break;
      }
    }
    return hasRegion;
  }

  checkHasDepartmentParent(form) {
    let hasDepartment = false;
    for (const element of form.value) {
      if (element.field_type === 'parent_department') {
        hasDepartment = true;
        break;
      }
    }
    return hasDepartment;
  }

  preventNonNumericalInput(event) {
    if (event && event.key) {
      if (!event.key.match(/^[0-9]+$/)) {
        event.preventDefault();
      }
    }
  }

  validateDurationInput(event) {
    const sectioned = event.target.value.split(':');
    if (sectioned.length !== 3) {
      event.target.value = '00:00:00'; // fallback to default
      return;
    }
    if (sectioned.length === 3 && sectioned[1].length === 0) {
      event.target.value = '00:00:00'; // fallback to default
      return;
    }
    if (sectioned.length === 3 && sectioned[0].length === 0) {
      event.target.value = '00:00:00'; // fallback to default
      return;
    }
    if (isNaN(sectioned[0])) {
      sectioned[0] = '00';
    }
    for (let i = 1; i < sectioned.length; i++) {

      if (isNaN(sectioned[i]) || sectioned[i] < 0) {
        sectioned[i] = '00';
      }
      if (sectioned[i] > 59 || sectioned[i].length > 2) {
        sectioned[i] = '59';
      }
    }

    event.target.value = sectioned.join(':');

  }

  onKeyDownDuration(e: KeyboardEvent) {
    const navigationKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', ':'];
    if (navigationKeys.indexOf(e.key) > -1) {
      return;
    }
    if (e.key === ' ' || isNaN(Number(e.key))) {
      e.preventDefault();
    }
  }

  getStartView(format: string | undefined): 'month' | 'year' | 'multi-year' {
    if (format === 'DD') {
      return 'month';
    } else if (format === 'MM' || format === 'DD/MM') {
      return 'year';
    } else {
      return 'multi-year';
    }
  }

  closePicker(evt: Date, datepicker: MatDatepicker<Date>, group: UntypedFormGroup, source: 'month' | 'year') {
    const fmt = group.get('date_format').value;
    const isMonth = source === 'month' && ['MM', 'MM/YYYY'].includes(fmt);
    const isYear = source === 'year' && fmt === 'YYYY';
    if (isMonth || isYear) {
      group.get('date_value').setValue(evt);
      datepicker.close();
    }
  }

  getCountryAndNationality() {
    this.subs.sink = this.schoolService.getCountry().subscribe((list: any[]) => {
      this.countryList = list;
    });
    this.nationalList = this.studentService.getNationalitiesList();
    this.nationalityList = this.nationalList;
  } 
}
