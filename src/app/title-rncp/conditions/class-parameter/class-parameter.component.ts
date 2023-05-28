import { Component, OnInit, Input, OnDestroy, Output, EventEmitter, OnChanges, ChangeDetectorRef, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import Swal from 'sweetalert2';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';
import { removeSpaces } from 'app/service/customvalidator.validator';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { DateAdapter } from '@angular/material/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatTabGroup } from '@angular/material/tabs';
import { forkJoin } from 'rxjs';
import { AfterViewChecked } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CoreService } from 'app/service/core/core.service';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import { AuthService } from 'app/service/auth-service/auth.service';

@Component({
  selector: 'ms-class-parameter',
  templateUrl: './class-parameter.component.html',
  styleUrls: ['./class-parameter.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class ClassParameterComponent implements OnInit, OnDestroy, OnChanges, AfterViewChecked {
  private subs = new SubSink();
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  @Input() selectedClassName: string;
  @Output() updateClassParam = new EventEmitter();
  @ViewChild('sliderMatTabGroup', { static: false }) sliderMatTabGroup: MatTabGroup;

  isTutorialAdded = false;
  dataTutorial: any;
  tutorialData: any;
  originDataForm = [];

  selectedIndex = 0;
  isWaitingForResponse = false;
  contractActive = false;
  jobActive = false;
  problemActive = false;
  esActive = false;
  mentorActive = false;
  identityActive = false;
  isDisabledButton = false;
  deletedSpecialization = [];

  today = new Date();
  classData = null;
  // ************* For Job Desc Template
  quetionaireList: any;
  originalQuetionaireList: any;
  // ************ For Problematic Tempalte
  problematicQuetionaireList: any;
  classParameterForm: UntypedFormGroup;
  isPermission: any;

  timeOutVal;

  // Variables related to specialization in class
  specialization_input = new UntypedFormControl('', removeSpaces);
  admissionActive = false;
  admissionData: any;

  qualityFormActive = false;
  qualityFormData: any;

  constructor(
    private fb: UntypedFormBuilder,
    private rncpTitleService: RNCPTitlesService,
    public translate: TranslateService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private cdr: ChangeDetectorRef,
    private dateAdapter: DateAdapter<Date>,
    private route: ActivatedRoute,
    public coreService: CoreService,
    private authService: AuthService,
    public tutorialService: TutorialService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.isPermission = this.authService.getPermission();
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });

    this.initClassParameterForm();
    this.getFormData();
    this.getInAppTutorial('Class');
  }

  ngOnChanges() {
    this.initClassParameterForm();
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  toggleTutorial(data) {
    this.tutorialService.setTutorialView(data);
    if (this.coreService.sidenavOpen) {
      this.coreService.sidenavOpen = !this.coreService.sidenavOpen;
    }
    this.coreService.sidenavTutorialOpen = !this.coreService.sidenavTutorialOpen;
  }

  initClassParameterForm() {
    this.classParameterForm = this.fb.group({
      name: [this.selectedClassName, [Validators.required, removeSpaces]],
      parent_rncp_title: [this.selectedRncpTitleId],
      description: [''],
      allow_job_description: [null],
      allow_problematic: [null],
      allow_mentor_evaluation: [null],
      allow_employability_survey: [null],
      year_of_certification: [''],
      identity_verification: this.fb.group({
        allow_auto_send_identity_verification: [false],
        identity_verification_activation_date: this.fb.group({
          date_utc: [''],
          time_utc: [''],
        }),
        identity_verification_due_date: this.fb.group({
          date_utc: [''],
          time_utc: [''],
        }),
      }),
      registration_period: this.fb.group({
        start_date: this.fb.group({
          date: [''],
          time: [''],
        }),
        end_date: this.fb.group({
          date: [''],
          time: [''],
        }),
      }),
      specializations: this.fb.array([]),
      is_admission_enabled: [null],
      admission_process: this.fb.group({
        form_builder_id: this.fb.group({
          _id: [''],
          form_builder_name: [''],
        }),
        due_date: [null],
      }),
      is_admission_due_date_enabled: [false],
      is_quality_form_enabled: [null],
    });
  }

  getInAppTutorial(type) {
    // const permission = this.isPermission && this.isPermission.length && this.isPermission[0] ? this.isPermission[0] : [];
    const currentUser = this.authService.getLocalStorageUser();
    const userType = currentUser.entities[0].type.name;
    this.subs.sink = this.tutorialService.GetAllInAppTutorialsByModule(type, userType).subscribe((list) => {
      if (list && list.length) {
        this.dataTutorial = list;
        const tutorialData = this.dataTutorial.filter((tutorial) => {
          return tutorial.is_published === true && tutorial.module === type;
        });
        this.tutorialData = tutorialData[0];
        if (this.tutorialData) {
          this.isTutorialAdded = true;
        } else {
          this.isTutorialAdded = false;
        }
      }
    });
  }

  getIdentityForm(): UntypedFormGroup {
    return this.classParameterForm.get('identity_verification') as UntypedFormGroup;
  }
  getPeriodForm(): UntypedFormGroup {
    return this.classParameterForm.get('registration_period') as UntypedFormGroup;
  }

  getFormData(from?) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.getClassById(this.selectedClassId).subscribe((response) => {
      this.isWaitingForResponse = false;
      const resp = _.cloneDeep(response);
      this.classData = _.cloneDeep(resp);

      this.contractControl(resp);

      if (resp.admission_process && resp.admission_process) {
        this.admissionData = resp.admission_process;
        this.classParameterForm.get('admission_process').setValue(resp.admission_process);
      }
      
      if(resp.is_admission_due_date_enabled) {
        this.admissionData['is_admission_due_date_enabled'] = resp.is_admission_due_date_enabled ? resp.is_admission_due_date_enabled : null;
      } else if(resp?.admission_process?.due_date) {
        this.admissionData['is_admission_due_date_enabled'] = true;
        resp.is_admission_due_date_enabled = true;
      }

      if (resp.is_admission_enabled) {
        this.admissionActive = true;
        this.contractActive = true;
        this.classParameterForm.get('is_admission_enabled').setValue(true);
      }

      if (resp.allow_job_description || resp.is_job_desc_active) {
        this.jobActive = true;
        this.contractActive = true;
        this.classParameterForm.get('allow_job_description').setValue(true);
      }

      if (resp.is_quality_form_enabled) {
        this.qualityFormActive = true;
        this.contractActive = true;
        this.qualityFormData = resp.quality_form;
      }

      if (resp.allow_problematic) {
        this.jobActive = true;
        this.contractActive = true;
      }
      if (resp.allow_employability_survey) {
        this.esActive = true;
        this.contractActive = true;
      }
      if (resp.identity_verification) {
        if (resp.identity_verification.allow_auto_send_identity_verification) {
          this.contractActive = true;
          // Formatting the activation date of identity verification
          if (resp.identity_verification.identity_verification_activation_date) {
            resp.identity_verification.identity_verification_activation_date.date_utc = this.parseStringDatePipe.transformStringToDate(
              this.parseUTCToLocalPipe.transformDate(
                resp.identity_verification.identity_verification_activation_date.date_utc,
                resp.identity_verification.identity_verification_activation_date.time_utc,
              ),
            );
            resp.identity_verification.identity_verification_activation_date.time_utc = this.parseUTCToLocalPipe.transform(
              resp.identity_verification.identity_verification_activation_date.time_utc,
            );
          } else {
            resp.identity_verification.identity_verification_activation_date = {
              date_utc: '',
              time_utc: '',
            };
          }

          // Formatting the due date of identity verification
          if (resp.identity_verification.identity_verification_due_date) {
            resp.identity_verification.identity_verification_due_date.date_utc = this.parseStringDatePipe.transformStringToDate(
              this.parseUTCToLocalPipe.transformDate(
                resp.identity_verification.identity_verification_due_date.date_utc,
                resp.identity_verification.identity_verification_due_date.time_utc,
              ),
            );
            resp.identity_verification.identity_verification_due_date.time_utc = this.parseUTCToLocalPipe.transform(
              resp.identity_verification.identity_verification_due_date.time_utc,
            );
          } else {
            resp.identity_verification.identity_verification_due_date = {
              date_utc: '',
              time_utc: '',
            };
          }
        } else {
          resp.identity_verification = {
            allow_auto_send_identity_verification: false,
            identity_verification_activation_date: {
              date_utc: '',
              time_utc: '',
            },
            identity_verification_due_date: {
              date_utc: '',
              time_utc: '',
            },
          };
        }
      } else {
        resp.identity_verification = {
          allow_auto_send_identity_verification: false,
          identity_verification_activation_date: {
            date_utc: '',
            time_utc: '',
          },
          identity_verification_due_date: {
            date_utc: '',
            time_utc: '',
          },
        };
      }

      if (resp.registration_period) {
        if (resp.registration_period.start_date.date && resp.registration_period.start_date.time) {
          resp.registration_period.start_date.time = this.parseUTCToLocalPipe.transform(resp.registration_period.start_date.time);
        } else {
          resp.registration_period.start_date = {
            date: '',
            time: '',
          };
        }

        if (resp.registration_period.end_date.date && resp.registration_period.end_date.time) {
          resp.registration_period.end_date.time = this.parseUTCToLocalPipe.transform(resp.registration_period.end_date.time);
        } else {
          resp.registration_period.end_date = {
            date: '',
            time: '',
          };
        }
      }

      if (resp.type_evaluation === 'expertise') {
        this.mentorActive = false;
        resp.allow_mentor_evaluation = false;
      }

      if (resp.specializations && resp.specializations.length > 0 && !from) {
        resp.specializations.forEach((specialization) => {
          this.specializationArray.push(this.initSpecializationForm(specialization.name, specialization.is_specialization_assigned));
        });
      } else {
        resp.specialization = [];
      }

      const omitResp = _.omitBy(resp, _.isNil);
      this.classParameterForm.patchValue(omitResp);
      this.originDataForm  = _.cloneDeep(this.classParameterForm.value);
      this.isFormSame()
      this.initFormListener();

      // Check if there is queryparam for class id and es, will route to ES
      if (
        this.route.snapshot.queryParamMap.get('classId') &&
        this.route.snapshot.queryParamMap.get('classId') === this.selectedClassId &&
        this.route.snapshot.queryParamMap.get('classParamTab')
      ) {
        this.timeOutVal = setTimeout(() => {
          this.goToTab(this.route.snapshot.queryParamMap.get('classParamTab'));
          clearTimeout(this.timeOutVal);
        }, 500);
      }

      if(from && from === 'saveBtn') {
        let payload = this.createPayload();
        delete payload.admission_process;
        payload.parent_rncp_title = payload.parent_rncp_title._id;

        this.updateClassParam.emit(payload);
      }
    });
  }

  initSpecializationForm(nameInput?: string, isAssigned?: boolean, id?:string) {
    return this.fb.group({
      _id: [id ? id : null],
      name: nameInput ? nameInput : [null],
      is_specialization_assigned: isAssigned ? isAssigned : [false],
      rncp_title_id: this.selectedRncpTitleId,
      class_id: this.selectedClassId,
    });
  }

  addSpecialization() {
    if (this.specialization_input.value && this.specialization_input.value !== '') {
      const duplicatedValue = (this.specializationArray.value || []).find(specialization => {
        return String(specialization?.name ?? '').toLowerCase() === String(this.specialization_input.value).toLowerCase()
      })
      if (duplicatedValue) {
        return Swal.fire({
            title: this.translate.instant('Specialization_S1.TITLE'),
            html: this.translate.instant('Specialization_S1.TEXT'),
            footer: `<span style="margin-left: auto">Specialization_S1</span>`,
            confirmButtonText: this.translate.instant('Specialization_S1.BUTTON'),
            type: 'warning',
            allowOutsideClick: false,
        })
      }
      this.specializationArray.push(this.initSpecializationForm(this.specialization_input.value));
      this.specialization_input.setValue('');
    }
  }

  removeSpecialization(index: number) {

    const tempData = this.specializationArray.at(index).value;
    this.deletedSpecialization.push(tempData);

    if (tempData.is_specialization_assigned) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('TITLE_IDENTITY.REMOVE_SPEC_TITLE'),
        text: this.translate.instant('TITLE_IDENTITY.REMOVE_SPEC_TEXT'),
        confirmButtonText: this.translate.instant('TITLE_IDENTITY.REMOVE_SPEC_BUTTON_1'),
        showCancelButton: true,
        allowOutsideClick: false,
        cancelButtonText: this.translate.instant('TITLE_IDENTITY.REMOVE_SPEC_BUTTON_2'),
      }).then((result) => {
        if (result.value) {
          this.specializationArray.removeAt(index);
        }
      });
    } else {
      this.specializationArray.removeAt(index);
    }
  }
  
  restoreDeletedSpecialization() {
    if(this.deletedSpecialization.length) {
      this.deletedSpecialization.forEach((data) => {
        this.specializationArray.push(this.initSpecializationForm(data.name, data.is_specialization_assigned, data._id));
      });
    }
    this.deletedSpecialization = [];
  }
  
  get specializationArray() {
    return this.classParameterForm.get('specializations') as UntypedFormArray;
  }

  createPayload() {
    const payload = _.cloneDeep(this.classParameterForm.getRawValue());
    if (payload.identity_verification && payload.identity_verification.allow_auto_send_identity_verification) {
      // Formatting activation date of identity verification
      if (
        payload.identity_verification.identity_verification_activation_date &&
        payload.identity_verification.identity_verification_activation_date.date_utc &&
        payload.identity_verification.identity_verification_activation_date.time_utc
      ) {
        payload.identity_verification.identity_verification_activation_date = {
          date_utc: this.getConvertDate(
            payload.identity_verification.identity_verification_activation_date.date_utc,
            payload.identity_verification.identity_verification_activation_date.time_utc,
          ),
          time_utc: this.getTodayTime(payload.identity_verification.identity_verification_activation_date.time_utc),
        };
      }
      // Formatting due date of identity verification,
      // but first check if the date_utc due date is filled but time_utc are not, if thats the case we need to put default time 15:59
      if (
        payload.identity_verification.identity_verification_due_date &&
        payload.identity_verification.identity_verification_due_date.date_utc &&
        !payload.identity_verification.identity_verification_due_date.time_utc
      ) {
        payload.identity_verification.identity_verification_due_date.time_utc = this.parseUTCToLocalPipe.transform('15:59');
      }
      if (
        payload.identity_verification.identity_verification_due_date &&
        payload.identity_verification.identity_verification_due_date.date_utc &&
        payload.identity_verification.identity_verification_due_date.time_utc
      ) {
        payload.identity_verification.identity_verification_due_date = {
          date_utc: this.getConvertDate(
            payload.identity_verification.identity_verification_due_date.date_utc,
            payload.identity_verification.identity_verification_due_date.time_utc,
          ),
          time_utc: this.getTodayTime(payload.identity_verification.identity_verification_due_date.time_utc),
        };
      }
    }

    if (
      payload.registration_period.start_date &&
      payload.registration_period.start_date.date &&
      !payload.registration_period.start_date.time
    ) {
      payload.registration_period.start_date.date = this.convertLocalDateToUTC(
        payload.registration_period.start_date.date,
      );
      payload.registration_period.start_date.time = this.parseUTCToLocalPipe.transform('15:59');
    }

    if (
      payload.registration_period.start_date &&
      payload.registration_period.start_date.date &&
      payload.registration_period.start_date.time
    ) {
      payload.registration_period.start_date = {
        date: this.convertLocalDateToUTC(payload.registration_period.start_date.date),
        time: this.getTodayTime(payload.registration_period.start_date.time),
      };
    }

    if (payload.registration_period.end_date && payload.registration_period.end_date.date && !payload.registration_period.end_date.time) {
      payload.registration_period.end_date.date = this.convertLocalDateToUTC(
        payload.registration_period.end_date.date,
      );
      payload.registration_period.end_date.time = this.parseUTCToLocalPipe.transform('15:59');
    }

    if (payload.registration_period.end_date && payload.registration_period.end_date.date && payload.registration_period.end_date.time) {
      payload.registration_period.end_date = {
        date: this.convertLocalDateToUTC(payload.registration_period.end_date.date),
        time: this.getTodayTime(payload.registration_period.end_date.time),
      };
    }
    return payload;
  }

  checkFormValidity(): boolean {

    if (this.classParameterForm.invalid) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        footer: `<span style="margin-left: auto">FormSave_S1</span>`,
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
      this.classParameterForm.markAllAsTouched();
      return true;
    } else {
      return false;
    }
  }

  save() {

    // return;
    if (this.checkFormValidity()) {
      return;
    } else {
      let payload = this.createPayload();
      delete payload.admission_process;
      payload.parent_rncp_title = payload.parent_rncp_title._id;
      this.isWaitingForResponse = true;
      this.subs.sink = this.rncpTitleService.updateClassParameter(this.selectedClassId, payload).subscribe((response) => {
        this.isWaitingForResponse = false;

        if (response && response.data && response.data.UpdateClass && !response.errors) {
          const resp = response.data.UpdateClass;
          this.rncpTitleService.childrenFormValidationStatus = true;
          Swal.fire({
            type: 'success',
            title: 'Bravo!',
            text: this.translate.instant('CLASS_UPDATED_SWAL', { className: resp.name }),
          }).then((result) => {
            this.deletedSpecialization = [];
            this.getFormData('saveBtn');
          });
        } else if (response.errors && response.errors.length && response.errors[0].message === 'Cannot create class with slash') {
          Swal.fire({
            title: this.translate.instant('ADDTITLE_SZ.TITLE'),
            text: this.translate.instant('ADDTITLE_SZ.TEXT'),
            footer: `<span style="margin-left: auto">ADDTITLE_SZ</span>`,
            confirmButtonText: this.translate.instant('ADDTITLE_SZ.BUTTON'),
            type: 'error',
            allowOutsideClick: false,
          });
        } else if (response.errors && response.errors.length && response.errors[0].message === 'Specialization with same name already exist, please choose another name') {
          Swal.fire({
            title: this.translate.instant('Specialization_S1.TITLE'),
            html: this.translate.instant('Specialization_S1.TEXT'),
            footer: `<span style="margin-left: auto">Specialization_S1</span>`,
            confirmButtonText: this.translate.instant('Specialization_S1.BUTTON'),
            type: 'warning',
            allowOutsideClick: false,
          });
        } else if (response.errors && response.errors.length && response.errors[0].message.includes('It is already connected to school or block')) {
          Swal.fire({
            title: this.translate.instant('Specialization_S2.TITLE'),
            html: this.translate.instant('Specialization_S2.TEXT'),
            footer: `<span style="margin-left: auto">Specialization_S2</span>`,
            confirmButtonText: this.translate.instant('Specialization_S2.BUTTON'),
            type: 'warning',
            allowOutsideClick: false,
          }).then((result) => {
            this.restoreDeletedSpecialization();
          });
        } else if (response?.errors[0]?.message?.includes('Cannot update specialization, because jury already created for current title')) {
          Swal.fire({
            type: 'warning',
            width: 600,
            title: this.translate.instant('Specialization_S4.TITLE'),
            html: this.translate.instant('Specialization_S4.TEXT'),
            confirmButtonText: this.translate.instant('Specialization_S4.BUTTON'),
            allowOutsideClick: false,
            footer: `<span style="margin-left: auto;">Specialization_S4</span>`
          })
        } else if (response?.errors[0]?.message?.includes('Specialization cannot be deleted / removed because it\'s connected to block template condition')) {
          Swal.fire({
            title: this.translate.instant('Specialization_S6.TITLE'),
            html: this.translate.instant('Specialization_S6.TEXT'),
            footer: `<span style="margin-left: auto;">Specialization_S6</span>`,
            confirmButtonText: this.translate.instant('Specialization_S6.BUTTON'),
            type: 'warning',
            allowOutsideClick: false,
          }).then(() => {
            this.restoreDeletedSpecialization();
          })
        } else {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('TMCLASS_S05.TITLE'),
            text: this.translate.instant('TMCLASS_S05.TEXT', { ClassName: this.classParameterForm.get('name').value }),
            footer: `<span style="margin-left: auto">TMCLASS_S05</span>`,
            confirmButtonText: this.translate.instant('TMCLASS_S05.BUTTON_1'),
          }).then((result) => {
            this.classParameterForm.get('name').patchValue(this.selectedClassName);
          });
        }
      }, (err) => {
        Swal.fire({
          type: 'error',
          title: this.translate.instant('SORRY'),
          html: err?.message ? this.translate.instant(err.message) : err,
          confirmButtonText: 'OK',
          allowOutsideClick: false,
        })
      });
    }
  }

  getConvertDate(date, time) {
    const today = moment(date).format('DD/MM/YYYY');
    return this.parseLocalToUTCPipe.transformDate(today, time);
  }

  getTodayTime(time) {
    return this.parseLocalToUTCPipe.transform(time);
  }

  getDataQuestionaire() {
    const forkParam = [];
    forkParam.push(this.rncpTitleService.getQuestionaireJobDesc());
    forkParam.push(this.rncpTitleService.getQuestionaireProblematic());

    this.subs.sink = forkJoin(forkParam).subscribe((resp) => {
      if (resp && resp.length) {
        let count = 0;
        if (resp[count]) {
          this.quetionaireList = resp[count];
          this.originalQuetionaireList = resp[count];
          count++;
        }
        if (resp[count]) {
          this.problematicQuetionaireList = resp[count];
          count++;
        }
      }
    });
  }

  contractControl(data) {
    if (
      data.is_admission_enabled ||
      data.allow_job_description ||
      data.allow_problematic ||
      data.allow_mentor_evaluation ||
      (data.identity_verification && data.identity_verification.allow_auto_send_identity_verification)
    ) {
      this.contractActive = true;
    }

    this.jobActive = data.allow_job_description;
    this.problemActive = data.allow_problematic;
    this.mentorActive = data.allow_mentor_evaluation;
    this.identityActive = data.identity_verification ? data.identity_verification.allow_auto_send_identity_verification : false;
    this.admissionActive = data.is_admission_enabled ? data.is_admission_enabled : false;

    this.checkTabActive();
  }

  toggleJob(event) {
    if (event.checked) {
      this.jobActive = true;
      this.selectedIndex = 2;
    } else {
      this.jobActive = false;
      this.checkTabActive();
    }
    if (this.jobActive || this.problemActive || this.mentorActive || this.esActive || this.identityActive) {
      this.contractActive = true;
    } else {
      this.contractActive = false;
    }
  }

  toggleQualityForm(event) {
    if (event.checked) {
      this.qualityFormActive = true;
      this.selectedIndex = 2;
    } else {
      this.qualityFormActive = false;
      this.checkTabActive();
    }

    if (
      this.jobActive ||
      this.problemActive ||
      this.mentorActive ||
      this.esActive ||
      this.identityActive ||
      this.admissionActive ||
      this.qualityFormActive
    ) {
      this.contractActive = true;
    } else {
      this.contractActive = false;
    }
  }

  toggleProblematic(event) {
    if (event.checked) {
      this.problemActive = true;
      this.selectedIndex = 3;
    } else {
      this.problemActive = false;
      this.checkTabActive();
    }
    if (this.jobActive || this.problemActive || this.mentorActive || this.esActive || this.identityActive) {
      this.contractActive = true;
    } else {
      this.contractActive = false;
    }
  }

  toggleMentor(event) {
    if (event.checked) {
      this.mentorActive = true;
      this.selectedIndex = 4;
    } else {
      this.mentorActive = false;
      this.checkTabActive();
    }
    if (this.jobActive || this.problemActive || this.mentorActive || this.esActive || this.identityActive) {
      this.contractActive = true;
    } else {
      this.contractActive = false;
    }
  }

  toggleVerification(event) {
    if (event.checked) {
      this.identityActive = true;
      this.selectedIndex = 5;
    } else {
      this.identityActive = false;
      this.checkTabActive();
    }
    if (this.jobActive || this.problemActive || this.mentorActive || this.esActive || this.identityActive) {
      this.contractActive = true;
    } else {
      this.contractActive = false;
    }
  }

  toggleAdmission(event) {


    if (event.checked) {
      this.admissionActive = true;
      this.changeDetectorRef.detectChanges();
      this.selectedIndex = 1;
      if (this.sliderMatTabGroup) {
        this.sliderMatTabGroup.selectedIndex = 1;
      }

    } else {
      this.admissionActive = false;
      this.checkTabActive();
    }
    if (this.jobActive || this.problemActive || this.mentorActive || this.esActive || this.identityActive || this.admissionActive) {
      this.contractActive = true;
    } else {
      this.contractActive = false;
    }
  }

  goToTab(destination: string) {

    if (this.sliderMatTabGroup) {
      let index = null;
      this.sliderMatTabGroup._tabs.forEach((tab, tabIndex) => {

        if (tab.textLabel === destination) {
          index = tabIndex;
        }
      });
      if (index !== null) {
        this.selectedIndex = index;
      }
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  checkTabActive() {


    if (this.jobActive || this.problemActive || this.mentorActive || this.esActive || this.identityActive || this.admissionActive || this.qualityFormActive) {
      if (this.admissionActive) {
        this.selectedIndex = 1;
      } else if (this.jobActive) {
        this.selectedIndex = 2;
      } else if (this.qualityFormActive) {
        this.selectedIndex = 3;
      } else if (this.problemActive) {
        this.selectedIndex = 4;
      } else if (this.mentorActive) {
        this.selectedIndex = 5;
      } else if (this.esActive) {
        this.selectedIndex = 6;
      } else if (this.identityActive) {
        this.selectedIndex = 7;
      }
    }
  }

  disabledButton() {
    if (this.classParameterForm.get('allow_job_description').value) {

      const date = this.classParameterForm.get('date').value;
      const time = this.classParameterForm.get('time').value;
      if (this.classData && this.classData.type_evaluation !== 'expertise') {
        const form_template = this.classParameterForm.get('form_template').value;
        if (date && time && form_template && this.classParameterForm.valid && !this.isWaitingForResponse) {
          this.isDisabledButton = false;

        } else {
          this.isDisabledButton = true;

        }
      } else {
        if (date && time && this.classParameterForm.valid && !this.isWaitingForResponse) {
          this.isDisabledButton = false;

        } else {
          this.isDisabledButton = true;

        }
      }
    } else {

      if (this.classParameterForm.invalid || this.isWaitingForResponse) {

        this.isDisabledButton = true;
      } else {

        this.isDisabledButton = false;
      }
    }
  }

  get myDate() {
    const dateValue = this.classParameterForm.get('year_of_certification').value;
    if (!dateValue) {
       return '' 
    } else {
      return dateValue;
    }
    
  }
  closedYearSelected(event: any, year?: any) {
    const ctrlValue = moment(event).format('YYYY').toString();
    this.classParameterForm.get('year_of_certification').patchValue(ctrlValue);


    year.close();
  }

  convertLocalDateToUTC(data) {
    const date = moment(data).format('DD/MM/YYYY');
    const time = '15:59';

    const dateTimeInUTC = moment(date + time, 'DD/MM/YYYYHH:mm');
    return dateTimeInUTC.toISOString();
  }

  goToFormFolowUp(){
    this.router.navigate([`form-follow-up/`], { queryParams: { titleId: this.selectedRncpTitleId, classId: this.selectedClassId } });
  }

  isFormSame() {
    const secondForm = JSON.stringify(this.originDataForm);
    const changesForm = JSON.stringify(this.classParameterForm.value);
    if (secondForm === changesForm) {
      this.rncpTitleService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.rncpTitleService.childrenFormValidationStatus = false;
      return false;
    } 
  }

  initFormListener() {
    this.subs.sink = this.classParameterForm.valueChanges.subscribe((resp) => {
      this.isFormSame();
    });    
  }

  refreshData(event) {
    this.getFormData();
    if(event === 'admission') {
      this.selectedIndex = 1;
    }
  }
}
