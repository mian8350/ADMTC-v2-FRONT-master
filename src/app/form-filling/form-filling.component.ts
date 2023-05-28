import { ChangeDetectorRef, Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'app/service/auth-service/auth.service';
import { SubSink } from 'subsink';
import { FormFillingService } from './form-filling.service';
import * as _ from 'lodash';
import { MatStepper } from '@angular/material/stepper';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-form-filling',
  templateUrl: './form-filling.component.html',
  styleUrls: ['./form-filling.component.scss'],
})
export class FormFillingComponent implements OnInit {
  @ViewChild('stepperForm', { static: false }) private stepper: MatStepper;
  formData: any;
  myInnerHeight = 600;
  selectedIndex = 0;
  subs = new SubSink();
  isWaitingForResponse = false;
  allStepsCompleted = false;
  formDetail: {
    formId?: string;
    userId?: string;
    formType?: string;
    templateId?: string;
    isPreview?: boolean;
    is_final_validator_active?: boolean;
    admission_status?: any;
    revise_request_messages?: any[];
    userTypeId: string;
    isFinalRevisionUser?: boolean;
    isFinalValidatorUser?: boolean;
    currentFinalValidatorValidate?: boolean;
  };

  userId: any;
  isReceiver = false;
  userData: any;
  currentUser: any;
  dataForm: any;
  formattedSteps = [];

  fieldsSurvey = [];

  constructor(
    private formFillingService: FormFillingService,
    private route: ActivatedRoute,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private authService: AuthService,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.route.queryParamMap.subscribe((resp: any) => {
      if (resp.params.hasOwnProperty('templateId')) {
        this.formDetail = _.cloneDeep(resp.params);
        this.fetchFormBuilderTemplate(resp.params.templateId);
      } else {
        this.formDetail = _.cloneDeep(resp.params);
        this.userId = resp.params.userId;
        const formTypes = ['student_admission', 'quality_form', 'quality_file', 'employability_survey']
        if (formTypes.includes(this.formDetail?.formType)) {
          this.fetchStudentAdmissionForm(this.formDetail.formId);
        }
      }
      this.formDetail.isPreview = resp.params['isPreview'] && resp.params['isPreview'] === 'true'; // typeof isPreview is string in the URL
    });
  }
  formatSteps(steps) {
    this.formattedSteps = [];
    if (steps && steps.length) {
      if (this.formDetail && this.formDetail.isPreview) {
        this.formattedSteps = steps;
      } else {
        this.formattedSteps = steps.filter(
          (step) => !((step.is_only_visible_based_on_condition && step.step_status === 'pending') || step.step_status === 'pending'),
        );

      }
    }
  }

  getUserStep() {
    if (this.formData && this.formData.steps && this.formData.steps.length) {
      this.formData.steps.forEach((step) => {
        if (this.formDetail && this.formDetail.userTypeId && step.user_who_complete_step) {
          // const found = this.currentUser.entities.find(ent=>step.user_who_complete_step&&ent.type._id===step.user_who_complete_step._id)
          if (this.formDetail.userTypeId === step.user_who_complete_step._id) {
            if (this.formDetail.formType === 'quality_form') {
              if (this.formData?.user_id?._id === this.userId) {
                step.isCompletingUser = true;
              } else {
                step.isCompletingUser = false;
              }
            } else {
              step.isCompletingUser = true;
            }
          } else {
            step.isCompletingUser = false;
          }
        } else {
          step.isCompletingUser = false;
        }
      });
    }
  }

  getOneUser(resp) {
    this.subs.sink = this.formFillingService.getOneUser(this.userId).subscribe((res) => {
      this.isWaitingForResponse = false;
      if (res) {

        this.userData = res;
        const userData = res;
        if (this.formDetail.formType === 'student_admission' || this.formDetail.formType === 'employability_survey') {
          this.isReceiver =
            this.formData &&
            this.formData.student_id &&
            this.formData.student_id.user_id &&
            this.formData.student_id.user_id._id === this.formDetail.userId
              ? true
              : false;
        } else if (this.formDetail.formType === 'quality_form' || this.formDetail.formType === 'quality_file') {
          this.isReceiver = this.formData && this.formData.user_id && this.formData.user_id._id === this.formDetail.userId ? true : false;
        }

        this.formDetail.isFinalRevisionUser = !!userData.entities.find((ent) => {
          if (ent && ent.type && resp.revision_user_type && ent.type._id === resp.revision_user_type) {
            return true;
          } else {
            return false;
          }
        });

        // For Final Validators
        const finalValidators = this.formData.final_validators.map((validator) => validator._id);
        this.formDetail.isFinalValidatorUser = (this.formData?.final_validator_statuses || []).find(validator => {
          return this.formDetail.userId === validator?.user_id?._id
        })



        // Check if current user final validators already validate
        this.formDetail.currentFinalValidatorValidate = this.checkIfValidatorHasValidated(resp);
      } else {
        // If res is empty, meaning we cannot find the user, either the student is deactivated or user is deleted
        const domainUrl = this.router.url.split('/')[0];
        window.open(`${domainUrl}/`, '_self');
      }
    });
  }

  checkUserReceiver() {
    if (this.formDetail.formType === 'student_admission' || this.formDetail.formType === 'employability_survey') {
      this.isReceiver =
        this.formData &&
        this.formData.student_id &&
        this.formData.student_id.user_id &&
        this.formData.student_id.user_id._id === this.formDetail.userId
          ? true
          : false;
    } else if (this.formDetail.formType === 'quality_form' || this.formDetail.formType === 'quality_file') {
      this.isReceiver = this.formData && this.formData.user_id && this.formData.user_id._id === this.formDetail.userId ? true : false;
    }
  }

  checkIfValidatorHasValidated(resp): boolean {
    if (!this.formDetail.isFinalValidatorUser) {
      return false;
    }
    return this.getAllValidatorsWhoValidated(resp).includes(this.formDetail.userId);
  }

  getAllValidatorsWhoValidated(resp): any[] {
    return resp && resp.final_validator_statuses && resp.final_validator_statuses.length
      ? resp.final_validator_statuses
          .filter((status) => status && status.user_id && status.user_id._id && status.is_already_sign)
          .map((status) => status.user_id._id)
      : [];
  }

  getAutomaticHeight() {
    this.myInnerHeight = window.innerHeight - 103;
    return this.myInnerHeight;
  }

  fetchStudentAdmissionForm(formId: string, isRefresh: boolean = false, isStay?: boolean) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.formFillingService.getOneFormProcess(formId).subscribe((resp) => {
      if (resp) {
        if (resp.revision_user_type && typeof resp.revision_user_type === 'object' && resp.revision_user_type._id) {
          resp.revision_user_type = resp.revision_user_type._id;
        }
        if (resp.hasOwnProperty('admission_status')) {
          this.formDetail.admission_status = resp.admission_status;
        }
        if (resp.revise_request_messages && resp.revise_request_messages.length) {
          this.formDetail.revise_request_messages = resp.revise_request_messages;
        }
        if (resp.hasOwnProperty('is_final_validator_active')) {
          this.formDetail.is_final_validator_active = resp.is_final_validator_active;
        }
        if (resp.form_builder_id && typeof resp.form_builder_id._id === 'string') {
          this.formDetail.templateId = resp.form_builder_id._id;
        }
        this.formatStepRevisionUserTypeObjectToStringId(resp);
        this.formData = [];
        this.formData = resp;
        if(this.formDetail?.formType === 'student_admission' && this.formData?.status === 'deleted') {
          const domainUrl = this.router.url.split('/')[0];
          window.open(
            `${domainUrl}/form-fill?formId=${this.formData?.student_id?.admission_process_id?._id}&formType=student_admission&userId=${this.userId}&userTypeId=${this.formDetail?.userTypeId}`,
            '_self'
          );
        }
        if (this.formDetail?.formType === 'student_admission' || this.formDetail?.formType === 'employability_survey') {
          this.getAllFormBuilderFieldTypesStudent(this.formData?.student_id?._id);
        } else if (this.formDetail?.formType === 'quality_form' || this.formDetail.formType === 'quality_file') {
          this.getAllFormBuilderFieldTypesUser(this.formData?.user_id?._id);
        }
        const studentTypeId = '5a067bba1c0217218c75f8ab';
        const stepNeedValidation = this.formData?.steps.find(step => step?.step_status === 'need_validation');
        if(this.formDetail?.formType === 'student_admission' && this.formDetail?.userTypeId === studentTypeId && stepNeedValidation) {
          Swal.fire({
            type: 'info',
            title: this.translate.instant('FORMWAITINGVALIDATION.TEXT'),
            allowOutsideClick: false,
            confirmButtonText: this.translate.instant('FORMWAITINGVALIDATION.BUTTON'),
          })
        }
        this.formatSteps(this.formData.steps);
        this.allStepsCompleted = this.checkIfAllStepsCompleted();
        this.checkUserReceiver();
        if(!isStay) {
          if (this.isReceiver || !isRefresh) {
            this.fetchAndSetLatestCompletedStepIndex(this.formattedSteps, isRefresh);
          }
        }
        this.setupStepState(this.formData);
        this.getUserStep();
        this.getOneUser(resp);
        this.isWaitingForResponse = false;
      } else {
        this.isWaitingForResponse = false;
      }
    });
  }

  getAllFormBuilderFieldTypesStudent(studentId){
    this.isWaitingForResponse = true;
    this.subs.sink = this.formFillingService.getAllFormBuilderFieldTypesStudent(studentId).subscribe(
      (resp) => {
        if(resp) {
          this.fieldsSurvey = _.cloneDeep(resp);
          this.isWaitingForResponse = false;
        } else {
          this.isWaitingForResponse = false;
        }
      }
    );
  }
  getAllFormBuilderFieldTypesUser(userId){
    this.isWaitingForResponse = true;
    this.subs.sink = this.formFillingService.getAllFormBuilderFieldTypesUser(userId).subscribe(
      (resp) => {
        if(resp) {
          this.fieldsSurvey = _.cloneDeep(resp);
          this.isWaitingForResponse = false;
        } else {
          this.isWaitingForResponse = false;
        }
      }
    );
  }

  formatStepRevisionUserTypeObjectToStringId(payload) {
    if (payload && payload.steps && payload.steps.length) {
      payload.steps = payload.steps.map((step) => {
        if (step && step.revision_user_type && typeof step.revision_user_type === 'object' && step.revision_user_type._id) {
          // step.revision_user_type = step.revision_user_type._id;
          return { ...step, revision_user_type: step.revision_user_type._id };
        } else {
          return { ...step };
        }
      });
    }
  }

  fetchAndSetLatestCompletedStepIndex(steps: any[], isRefresh?) {
    let currentValue = 0;
    for (const step of steps) {
      if (step.step_status === 'accept') {
        currentValue += 1;
      } else {
        break;
      }
    }    
    // if allStepsCompleted then summary step is available which means index should be the last one or step.length
    this.changeDetectorRef.detectChanges();



    if (this.isFinalStepAskForRevision() && this.formData.admission_status === "ask_for_revision" && this.formData.is_final_validator_active === true && isRefresh) {

      if (this.stepper) {
        this.stepper.selectedIndex = this.selectedIndex;
      }
    } else if (this.isReceiver && this.isFinalStepNeedValidationForReceiver() && this.formattedSteps && this.formattedSteps.length) {

      // if receiver already complete all form AND only waiting for final validation, then let them go to final index/final message
      this.selectedIndex = this.formattedSteps.length - 1
      if (this.stepper) {
        this.stepper.selectedIndex = currentValue; // for some reason i need to do this too since the view does not respond to the selectedIndex binding above
      }
    } else {
      currentValue = this.allStepsCompleted && currentValue > steps.length - 1 ? steps.length - 1 : currentValue;
      this.selectedIndex = currentValue; // this binding is apparently too slow for the DOM init after change
      if (this.stepper) {
        this.stepper.selectedIndex = currentValue; // for some reason i need to do this too since the view does not respond to the selectedIndex binding above
      }
    }
    // this.stepper.selectedIndex = currentValue;

  }

  isFinalStepAskForRevision() {
    const finalStep = this.formattedSteps.find((step) => step.is_final_step === true);
    if(finalStep && finalStep.is_validation_required && finalStep.step_status === 'ask_for_revision') {
      return true;
    } else {
      return false;
    }
  }

  isFinalStepNeedValidationForReceiver() {
    const finalStep = this.formattedSteps.find((step) => step.is_final_step === true);

    if(finalStep && finalStep.is_validation_required && finalStep.step_status === 'need_validation') {
      return true;
    } else {
      return false;
    }
  }

  fetchFormBuilderTemplate(templateId: string) {
    this.subs.sink = this.formFillingService.getOneRandomFormProcess(templateId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        this.formData = resp;
        this.formatSteps(this.formData.steps);
        this.allStepsCompleted = this.checkIfAllStepsCompleted();
      }
    });
  }

  moveToNextStep() {
    this.selectedIndex += 1;
  }

  moveToPrevStep() {
    this.selectedIndex -= 1;
  }

  checkIfAllStepsCompleted(): boolean {
    return this.formattedSteps.every((step) => step.step_status === 'accept');
  }

  setupStepState(formData) {
    // const stepState = [];
    // for (const step of formData.steps) {
    //   stepState.push({
    //     step: step.step_title,
    //     completed: false,
    //   });
    // }
    // this.formFillingService.stepState = stepState;

  }

  getStepState() {

    // return this.contractService.stepState;
  }

  onStepChange(event) {
    this.selectedIndex = event.selectedIndex;
  }
}
