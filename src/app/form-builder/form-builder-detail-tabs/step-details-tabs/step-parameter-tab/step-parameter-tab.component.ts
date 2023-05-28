import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService, LangChangeEvent } from '@ngx-translate/core';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { UserService } from 'app/service/user/user.service';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatTableDataSource } from '@angular/material/table';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { AddFormSignatoryDialogComponent } from '../../form-template-step-detail-parent-tabs/form-template-step-detail/add-form-signatory-dialog/add-form-signatory-dialog.component';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
  selector: 'ms-step-parameter-tab',
  templateUrl: './step-parameter-tab.component.html',
  styleUrls: ['./step-parameter-tab.component.scss'],
})
export class StepParameterTabComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() isPublished: boolean;
  @Input() stepId;
  @Input() step;
  @Input() templateType;
  @Output() updateTabs = new EventEmitter();
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  private subs = new SubSink();
  stepParamatersForm: UntypedFormGroup;
  initialData: any;
  validatorList;
  statusList;
  stepTypes: string[] = [];
  initialStepCompleterUserTypes: any[] = [];
  initialStepValidatorUserTypes: any[] = [];
  filteredStepCompleterUserTypes: any[] = [];
  filteredStepValidatorUserTypes: any[] = [];
  isWaitingForResponse = false;
  completerFilter = new UntypedFormControl(null);
  validatorFilter = new UntypedFormControl(null);
  initialStepData: any;
  dataSource = new MatTableDataSource([]);
  displayedColumns = ['number', 'userType', 'action'];
  noData;
  signatoryCount;
  timeOutVal: any;
  userCompleted = [];

  isValidationRequired;

  public Editor = DecoupledEditor;
  public config = {
    toolbar: ['heading', 'bold', 'italic', 'underline', 'strikethrough', 'numberedList', 'bulletedList', 'undo', 'redo'],
    height: '20rem',
  };
  userValidator: { _id: any; name: any }[];

  onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  constructor(
    private translate: TranslateService,
    private fb: UntypedFormBuilder,
    private formBuilderService: FormBuilderService,
    private router: Router,
    private userService: UserService,
    public dialog: MatDialog,
  ) {}

  ngOnInit() {


    this.initStepParamatersForm();
    this.populateStepData();
    this.getStepTypeList();
    this.getUserTypeList();
    this.getStatusStepList();

    if (this.isPublished) {
      this.stepParamatersForm.disable();
      this.completerFilter.disable();
      this.validatorFilter.disable();
    }
    this.subs.sink = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      if (
        this.stepParamatersForm.get('user_who_complete_step').value &&
        this.completerFilter.value &&
        this.initialStepCompleterUserTypes &&
        this.initialStepCompleterUserTypes.length
      ) {
        const found = _.find(
          this.initialStepCompleterUserTypes,
          (res) => res._id === this.stepParamatersForm.get('user_who_complete_step').value,
        );
        let result = '';
        if (found) {
          this.completerFilter.setValue(this.translate.instant('USER_TYPES.' + found.name));
        }
      }
      this.userCompleted = this.initialStepCompleterUserTypes.map((user) => {
        return { _id: user._id, name: this.translate.instant('USER_TYPES.' + user.name) };
      });
      this.filteredStepCompleterUserTypes = this.userCompleted;

      if (
        this.stepParamatersForm.get('validator').value &&
        this.validatorFilter.value &&
        this.initialStepValidatorUserTypes &&
        this.initialStepValidatorUserTypes.length
      ) {
        const found = _.find(this.initialStepValidatorUserTypes, (res) => res._id === this.stepParamatersForm.get('validator').value);

        if (found) {
          this.validatorFilter.setValue(this.translate.instant('USER_TYPES.' + found.name));
        }
      }
      this.userValidator = this.initialStepValidatorUserTypes.map((user) => {
        return { _id: user._id, name: this.translate.instant('USER_TYPES.' + user.name) };
      });
      this.filteredStepValidatorUserTypes = this.userValidator;
    });
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }

  populateStepData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.formBuilderService.getOneFormBuilderStep(this.stepId).subscribe(
      (response) => {
        this.isWaitingForResponse = false;
        if (response) {
          const step = _.cloneDeep(response);

          this.isValidationRequired = response?.is_validation_required

          if (!step.contract_signatory) {
            step.contract_signatory = [];
          }

          if (
            step.user_who_complete_step &&
            typeof step.user_who_complete_step._id === 'string' &&
            typeof step.user_who_complete_step.name === 'string'
          ) {
            this.completerFilter.patchValue(this.translate.instant('USER_TYPES.' + step.user_who_complete_step.name));
            step.user_who_complete_step = step.user_who_complete_step._id;
          }

          if (step.is_validation_required) {
            this.stepParamatersForm.get('validator').setValidators(Validators.required);
            this.stepParamatersForm.get('validator').updateValueAndValidity();
          }

          if (step.validator && typeof step.validator._id === 'string' && typeof step.validator.name === 'string') {
            this.validatorFilter.patchValue(this.translate.instant('USER_TYPES.' + step.validator.name));
            step.validator = step.validator._id;
          }

          this.getSignatory().clear();
          if (step.contract_signatory && step.contract_signatory.length) {
            step.contract_signatory.forEach((signatory) => {
              if (signatory) {
                this.pushSignatory();
              }
            });
          }
          if (
            step.step_type === 'final_message' ||
            step.step_type === 'summary' ||
            step.step_type === 'step_with_signing_process'
          ) {
            step.user_who_complete_step = null;
          }
          
          this.initialStepData = _.cloneDeep(step);
          this.stepParamatersForm.patchValue(step);
          this.initialData = _.cloneDeep(this.stepParamatersForm.value);
          if (
            step.step_type === 'final_message' ||
            step.step_type === 'summary' ||
            step.step_type === 'step_with_signing_process'
          ) {
            this.stepParamatersForm.get('user_who_complete_step').clearValidators();
            this.stepParamatersForm.get('user_who_complete_step').updateValueAndValidity();
          }
          
          this.isFormUnchanged();
          this.initValueChanges();
          this.updateTableData();
        }
      },
      (err) => (this.isWaitingForResponse = false),
    );
  }

  initValueChanges() {
    this.subs.sink = this.stepParamatersForm.valueChanges.subscribe(() => {
      this.isFormUnchanged();
    });

    if(this.stepParamatersForm.get('step_type').value === 'final_message' || this.stepParamatersForm.get('step_type').value === 'step_with_signing_process') {
      this.stepParamatersForm.get('custom_button_text').get('save_text').clearValidators();
      this.stepParamatersForm.get('custom_button_text').get('save_text').updateValueAndValidity();
      this.stepParamatersForm.get('custom_button_text').get('submit_text').clearValidators();
      this.stepParamatersForm.get('custom_button_text').get('submit_text').updateValueAndValidity();
    } else {
      this.stepParamatersForm.get('custom_button_text').get('save_text').setValidators(Validators.required);
      this.stepParamatersForm.get('custom_button_text').get('save_text').updateValueAndValidity();
      this.stepParamatersForm.get('custom_button_text').get('submit_text').setValidators(Validators.required);
      this.stepParamatersForm.get('custom_button_text').get('submit_text').updateValueAndValidity();
    }

    if(this.isValidationRequired) {
      this.stepParamatersForm.get('custom_button_text').get('ask_revision_text').patchValue(this.initialStepData?.custom_button_text?.ask_revision_text);
      this.stepParamatersForm.get('custom_button_text').get('ask_revision_text').setValidators(Validators.required);
      this.stepParamatersForm.get('custom_button_text').get('ask_revision_text').updateValueAndValidity();
      this.stepParamatersForm.get('custom_button_text').get('validate_text').patchValue(this.initialStepData?.custom_button_text?.validate_text);
      this.stepParamatersForm.get('custom_button_text').get('validate_text').setValidators(Validators.required);
      this.stepParamatersForm.get('custom_button_text').get('validate_text').updateValueAndValidity();
      this.stepParamatersForm.get('custom_button_text').get('complete_revision_text').patchValue(this.initialStepData?.custom_button_text?.complete_revision_text);
      this.stepParamatersForm.get('custom_button_text').get('complete_revision_text').setValidators(Validators.required);
      this.stepParamatersForm.get('custom_button_text').get('complete_revision_text').updateValueAndValidity();
    } else {
      this.stepParamatersForm.get('custom_button_text').get('ask_revision_text').patchValue('');
      this.stepParamatersForm.get('custom_button_text').get('ask_revision_text').clearValidators();
      this.stepParamatersForm.get('custom_button_text').get('ask_revision_text').updateValueAndValidity();
      this.stepParamatersForm.get('custom_button_text').get('validate_text').patchValue('');
      this.stepParamatersForm.get('custom_button_text').get('validate_text').clearValidators();
      this.stepParamatersForm.get('custom_button_text').get('validate_text').updateValueAndValidity();
      this.stepParamatersForm.get('custom_button_text').get('complete_revision_text').patchValue('');
      this.stepParamatersForm.get('custom_button_text').get('complete_revision_text').clearValidators();
      this.stepParamatersForm.get('custom_button_text').get('complete_revision_text').updateValueAndValidity();
    }

    if(this.stepParamatersForm.get('step_type').value === 'step_with_signing_process') {
      this.stepParamatersForm.get('custom_button_text').get('sign_contract_text').setValidators(Validators.required);
      this.stepParamatersForm.get('custom_button_text').get('sign_contract_text').updateValueAndValidity();
    } else {
      this.stepParamatersForm.get('custom_button_text').get('sign_contract_text').clearValidators();
      this.stepParamatersForm.get('custom_button_text').get('sign_contract_text').updateValueAndValidity();
    }

    this.subs.sink = this.stepParamatersForm.get('step_type').valueChanges.subscribe(() => {
      if (
        this.stepParamatersForm.get('step_type').value === 'final_message' ||
        this.stepParamatersForm.get('step_type').value === 'step_with_signing_process'
      ) {
        this.completerFilter.patchValue(null);
        this.stepParamatersForm.get('user_who_complete_step').patchValue(null);
        this.stepParamatersForm.get('user_who_complete_step').clearValidators();
        this.stepParamatersForm.get('user_who_complete_step').updateValueAndValidity();
        this.validatorFilter.patchValue(null);
        this.stepParamatersForm.get('validator').patchValue(null);
        this.stepParamatersForm.get('validator').clearValidators();
        this.stepParamatersForm.get('validator').updateValueAndValidity();
      } else if (this.stepParamatersForm.get('step_type').value === 'summary') {
        this.completerFilter.patchValue(null);
        this.stepParamatersForm.get('user_who_complete_step').patchValue(null);
        this.stepParamatersForm.get('user_who_complete_step').clearValidators();
        this.stepParamatersForm.get('user_who_complete_step').updateValueAndValidity();
      } else {
        this.stepParamatersForm.get('user_who_complete_step').setValidators(Validators.required);
        this.stepParamatersForm.get('user_who_complete_step').updateValueAndValidity();
      }

      if(this.stepParamatersForm.get('step_type').value === 'final_message' || this.stepParamatersForm.get('step_type').value === 'step_with_signing_process') {
        this.stepParamatersForm.get('custom_button_text').get('save_text').patchValue('');
        this.stepParamatersForm.get('custom_button_text').get('save_text').clearValidators();
        this.stepParamatersForm.get('custom_button_text').get('save_text').updateValueAndValidity();
        this.stepParamatersForm.get('custom_button_text').get('submit_text').patchValue('');
        this.stepParamatersForm.get('custom_button_text').get('submit_text').clearValidators();
        this.stepParamatersForm.get('custom_button_text').get('submit_text').updateValueAndValidity();
      } else {
        this.stepParamatersForm.get('custom_button_text').get('save_text').patchValue('');
        this.stepParamatersForm.get('custom_button_text').get('save_text').setValidators(Validators.required);
        this.stepParamatersForm.get('custom_button_text').get('save_text').updateValueAndValidity();
        this.stepParamatersForm.get('custom_button_text').get('submit_text').patchValue('');
        this.stepParamatersForm.get('custom_button_text').get('submit_text').setValidators(Validators.required);
        this.stepParamatersForm.get('custom_button_text').get('submit_text').updateValueAndValidity();
      }

      if(this.stepParamatersForm.get('step_type').value === 'step_with_signing_process') {
        this.stepParamatersForm.get('custom_button_text').get('sign_contract_text').patchValue('');
        this.stepParamatersForm.get('custom_button_text').get('sign_contract_text').setValidators(Validators.required);
        this.stepParamatersForm.get('custom_button_text').get('sign_contract_text').updateValueAndValidity();
      } else {
        this.stepParamatersForm.get('custom_button_text').get('sign_contract_text').patchValue('');
        this.stepParamatersForm.get('custom_button_text').get('sign_contract_text').clearValidators();
        this.stepParamatersForm.get('custom_button_text').get('sign_contract_text').updateValueAndValidity();
      }

      this.stepParamatersForm.patchValue({
        user_who_complete_step: null,
        is_validation_required: false,
        validator: null,
        is_only_visible_based_on_condition: false,
        is_include_in_summary: false,
        is_final_step: false,
      });
    });
  }

  getStepTypeList() {
    this.stepTypes = this.formBuilderService.getStepTypeList();
  }

  getUserTypeList() {
    this.isWaitingForResponse = true;
    const userTypes = [
      {
        _id: "5a2e1ecd53b95d22c82f954e",
        name: "ADMTC Admin",
      },
      {
        _id: '5a2e1ecd53b95d22c82f954b',
        name: 'ADMTC Director',
      },
      {
        _id: '5a2e1ecd53b95d22c82f9550',
        name: 'Certifier Admin',
      },
    ];
    const validatorUserTypes = _.cloneDeep(userTypes);

    userTypes.push({
      _id: '5a2e1ecd53b95d22c82f9554',
      name: 'Academic Director',
    })

    // For student admission and employability survey. In recipient allow student
    if (this.templateType === 'student_admission' || this.templateType === 'employability_survey') {
      userTypes.push(
        {
          _id: '5a067bba1c0217218c75f8ab',
          name: 'Student',
        },
      );
    }

    if(this.templateType !== 'quality_file') {
      validatorUserTypes.push(
        {
          _id: '5a2e1ecd53b95d22c82f9554',
          name: 'Academic Director',
        },
      );
    }

    // For student admission. In validator allow student
    if (this.templateType === 'student_admission') {
      validatorUserTypes.push(
        {
          _id: '5a067bba1c0217218c75f8ab',
          name: 'Student',
        },
      );
    }

    this.initialStepCompleterUserTypes = [...userTypes];
    this.userCompleted = userTypes.map((user) => {
      return { _id: user._id, name: this.translate.instant('USER_TYPES.' + user.name) };
    });
    this.filteredStepCompleterUserTypes = this.userCompleted;

    this.initialStepValidatorUserTypes = [...validatorUserTypes];
    this.userValidator = validatorUserTypes.map((user) => {
      return { _id: user._id, name: this.translate.instant('USER_TYPES.' + user.name) };
    });
    this.filteredStepValidatorUserTypes = this.userValidator;
    this.isWaitingForResponse = false;
  }
  getStatusStepList() {
    // this.statusList = this.formBuilderService.getStatusStepParameters();

  }

  initStepParamatersForm() {
    this.stepParamatersForm = this.fb.group({
      _id: [null],
      step_title: [null],
      step_type: [null],
      user_who_complete_step: [null, Validators.required],
      is_validation_required: [false],
      validator: [null],
      is_only_visible_based_on_condition: [false],
      is_include_in_summary: [false],
      is_final_step: [false],
      is_contract_signatory_in_order: [false],
      direction: [''],
      contract_signatory: this.fb.array([]),
      custom_button_text: this.fb.group({
        save_text: [''],
        submit_text: [''],
        ask_revision_text: [''],
        validate_text: [''],
        complete_revision_text: [''],
        sign_contract_text: [''],
      })
    });
  }

  initSignatoryForm() {
    return this.fb.group({
      _id: [null],
      name: [''],
    });
  }

  pushSignatory() {
    this.getSignatory().push(this.initSignatoryForm());
  }

  getSignatory(): UntypedFormArray {
    return this.stepParamatersForm.get('contract_signatory') as UntypedFormArray;
  }

  updateTableData() {
    this.dataSource.data = this.getSignatory().value;
    this.signatoryCount = this.getSignatory().length;
  }

  onMoveItem(event: CdkDragDrop<any[]>) {
    const prevIndex = this.dataSource.data.findIndex((d) => d === event.item.data);
    const temp = _.cloneDeep(this.stepParamatersForm.getRawValue());
    if (temp.contract_signatory && temp.contract_signatory.length) {
      moveItemInArray(temp.contract_signatory, prevIndex, event.currentIndex);
    }
    this.stepParamatersForm.patchValue(temp);
    this.saveStepData(true, null, true);
  }

  deleteSignatory(rowIndex, userType) {
    const user_type = this.translate.instant('USER_TYPES.' + userType.name);
    let timeDisabled = 3;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('UserForm_S13.TITLE'),
      html: this.translate.instant('UserForm_S13.TEXT', { user_type: user_type }),
      confirmButtonText: this.translate.instant('UserForm_S13.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('UserForm_S13.CANCEL'),
      showCancelButton: true,
      allowOutsideClick: false,
      allowEnterKey: false,
      allowEscapeKey: true,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('UserForm_S13.CONFIRM') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('UserForm_S13.CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      if (result.value) {
        const temp = _.cloneDeep(this.stepParamatersForm.getRawValue());
        if (temp && temp.contract_signatory && temp.contract_signatory[rowIndex]) {
          temp.contract_signatory.splice(rowIndex, 1);
        }

        this.saveStepData(false, temp, true);
      }
    });
  }

  openTableKey() {
    const url = this.router.createUrlTree(['form-builder/key-table'], {
      queryParams: {
        lang: this.translate.currentLang,
        stepId: this.stepId,
      },
    });
    window.open(url.toString(), '_blank', 'height=570,width=520,scrollbars=yes,top=250,left=900');
  }

  onStepCompleterFilter($event) {
    if (!$event.target.value) {
      // const userCompleted = this.initialStepCompleterUserTypes.map(user => { return { _id: user._id, name: this.translate.instant('USER_TYPES.' + user.name) } })
      this.filteredStepCompleterUserTypes = this.userCompleted;
    } else {
      this.filteredStepCompleterUserTypes = this.userCompleted.filter((type) => {
        return typeof type.name === 'string' && type.name.trim().toLowerCase().includes($event.target.value.trim().toLowerCase());
      });

    }
  }

  onSelectStepCompleter(userType) {
    const validatorId = this.stepParamatersForm.get('validator').value;
    if (userType && typeof userType._id === 'string' && userType._id !== validatorId) {
      this.stepParamatersForm.get('user_who_complete_step').patchValue(userType._id);
    } else if (typeof validatorId === 'string' && userType._id === validatorId) {
      Swal.fire({
        type: 'warning',
        title: 'Ooops!',
        text: 'User who complete this step can not be the same as user who validate this step',
      });
    }
  }

  onStepValidatorFilter($event) {
    if (!this.validatorFilter.value) {
      this.filteredStepValidatorUserTypes = this.userValidator;
      this.stepParamatersForm.get('validator').patchValue(null);
    } else {
      this.filteredStepValidatorUserTypes = this.userValidator.filter((type) => {
        return typeof type.name === 'string' && type.name.trim().toLowerCase().includes($event.target.value.trim().toLowerCase());
      });

    }
  }

  onSelectStepValidator(userType) {
    const completerId = this.stepParamatersForm.get('user_who_complete_step').value;
    if (userType && typeof userType._id === 'string' && userType._id !== completerId) {
      this.stepParamatersForm.get('validator').patchValue(userType._id);
    } else if (typeof completerId === 'string' && userType._id === completerId) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Parameter_S1.TITLE'),
        text: this.translate.instant('Parameter_S1.TEXT'),
      });
    }
  }

  onValidationParameterChange(event: MatSlideToggleChange) {
    if (event && !event.checked) {
      this.validatorFilter.patchValue(null);
      this.stepParamatersForm.get('validator').patchValue(null);
      this.stepParamatersForm.get('validator').clearValidators(); // have to clear validators due to late detection of [required]
      this.stepParamatersForm.get('validator').updateValueAndValidity(); // Always use update value and validity after use clear validators
      this.stepParamatersForm.get('custom_button_text').get('ask_revision_text').patchValue('');
      this.stepParamatersForm.get('custom_button_text').get('ask_revision_text').clearValidators();
      this.stepParamatersForm.get('custom_button_text').get('ask_revision_text').updateValueAndValidity();
      this.stepParamatersForm.get('custom_button_text').get('validate_text').patchValue('');
      this.stepParamatersForm.get('custom_button_text').get('validate_text').clearValidators();
      this.stepParamatersForm.get('custom_button_text').get('validate_text').updateValueAndValidity();
      this.stepParamatersForm.get('custom_button_text').get('complete_revision_text').patchValue('');
      this.stepParamatersForm.get('custom_button_text').get('complete_revision_text').clearValidators();
      this.stepParamatersForm.get('custom_button_text').get('complete_revision_text').updateValueAndValidity();
    } else {
      this.stepParamatersForm.get('validator').patchValue(null);
      this.stepParamatersForm.get('validator').setValidators(Validators.required);
      this.stepParamatersForm.get('validator').updateValueAndValidity();
      this.stepParamatersForm.get('custom_button_text').get('ask_revision_text').patchValue(this.initialStepData?.custom_button_text?.ask_revision_text);
      this.stepParamatersForm.get('custom_button_text').get('ask_revision_text').setValidators(Validators.required);
      this.stepParamatersForm.get('custom_button_text').get('ask_revision_text').updateValueAndValidity();
      this.stepParamatersForm.get('custom_button_text').get('validate_text').patchValue(this.initialStepData?.custom_button_text?.validate_text);
      this.stepParamatersForm.get('custom_button_text').get('validate_text').setValidators(Validators.required);
      this.stepParamatersForm.get('custom_button_text').get('validate_text').updateValueAndValidity();
      this.stepParamatersForm.get('custom_button_text').get('complete_revision_text').patchValue(this.initialStepData?.custom_button_text?.complete_revision_text);
      this.stepParamatersForm.get('custom_button_text').get('complete_revision_text').setValidators(Validators.required);
      this.stepParamatersForm.get('custom_button_text').get('complete_revision_text').updateValueAndValidity();
    }
  }

  // old onchange status function
  // onChangeStatusRequirement(event: any) {

  //   if (event && !event.checked) {
  //     this.stepParamatersForm.get('status').patchValue(null);
  //     this.stepParamatersForm.get('status').clearValidators(); // have to clear validators due to late detection of [required]
  //     this.stepParamatersForm.get('status').setErrors(null); // have to set error to null due to asynchronous issue with the toggle and late [required] detection
  //   }
  // }

  // on change status from 009
  onChangeStatusRequirement(event: any) {

    if (event && !event.checked) {
      // if (this.stepParamatersForm.value && !this.stepParamatersForm.get('candidate_status_after_validated').value) {
      //   this.stepParamatersForm.get('candidate_status_after_validated').patchValue(null);
      // }
      this.stepParamatersForm.get('candidate_status_after_validated').patchValue(null);
      this.stepParamatersForm.get('candidate_status_after_validated').clearValidators();
      this.stepParamatersForm.get('candidate_status_after_validated').setErrors(null);
    }
  }

  onChangeSummaryRequirement(event: any) {
    if (event && !event.checked) {
      return;
    }
  }

  addSignatory() {

    this.subs.sink = this.dialog
      .open(AddFormSignatoryDialogComponent, {
        width: '400px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          signatory: this.getSignatory().value,
          templateType: this.templateType,
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result && result.length) {
          result.forEach((userType) => {
            this.pushSignatory();
            this.getSignatory()
              .at(this.getSignatory().length - 1)
              .patchValue({ _id: userType, name: '' });
          });
          this.saveStepData(false, null, true);
        }
      });
  }

  changeStepType(stepType) {
    this.stepParamatersForm.get('user_who_complete_step').patchValue(null);
    // this.stepParamatersForm.get('user_who_complete_step').clearValidators();
    this.stepParamatersForm.get('user_who_complete_step').updateValueAndValidity();
    this.completerFilter.patchValue(null);

    this.validatorFilter.patchValue(null);
    this.stepParamatersForm.get('validator').patchValue(null);
    this.stepParamatersForm.get('validator').clearValidators();
    this.stepParamatersForm.get('validator').updateValueAndValidity();

    const stepTitle = this.stepParamatersForm.get('step_title').value;
    const stepId = this.stepParamatersForm.get('_id').value;

    this.stepParamatersForm.reset();
    this.stepParamatersForm.get('_id').patchValue(stepId);
    this.stepParamatersForm.get('step_title').patchValue(stepTitle);
    this.stepParamatersForm.get('step_type').patchValue(stepType);

    /* const temp = _.cloneDeep(this.stepParamatersForm.getRawValue());
    temp.step_type = stepType;
    this.saveStepData(true, temp); */
  }

  saveStepData(noNeedSwal?: boolean, customPayload?, addSignatory?) {
    if(addSignatory) { // remove validator on sign contract button text so can save after add signaotry
      this.stepParamatersForm.get('custom_button_text').get('sign_contract_text').clearValidators();
      this.stepParamatersForm.get('custom_button_text').get('sign_contract_text').updateValueAndValidity();
    }

    if (
      this.stepParamatersForm.get('step_type').value === 'final_message' ||
      this.stepParamatersForm.get('step_type').value === 'summary' ||
      this.stepParamatersForm.get('step_type').value === 'step_with_signing_process'
    ) {
      this.stepParamatersForm.get('user_who_complete_step').patchValue(null);
      this.stepParamatersForm.get('user_who_complete_step').clearValidators();
      this.stepParamatersForm.get('user_who_complete_step').updateValueAndValidity();
    }
    if (this.isPublished) {
      Swal.fire({
        type: 'info',
        title: this.translate.instant('UserForm_S18.TITLE'),
        text: this.translate.instant('UserForm_S18.TEXT'),
        confirmButtonText: this.translate.instant('UserForm_S18.CONFIRM'),
      });
    } else {
      if (this.checkFormValidity()) {
        return;
      } else {
        this.isWaitingForResponse = true;
        let payload;
        if (customPayload) {
          payload = _.cloneDeep(customPayload);
        } else {
          payload = { ...this.initialStepData, ...this.stepParamatersForm.getRawValue() };
        }
        const signatoryIds = [];
        if (payload.step_type !== this.initialStepData.step_type) payload.segments = null;
        if (payload.step_type === 'step_with_signing_process') {
          payload.contract_signatory.forEach((signatory) => {
            signatoryIds.push(signatory._id);
          });
        }
        if (payload.hasOwnProperty('count_document')) delete payload.count_document;
        if (payload.segments && payload.segments.length) {
          payload.segments.forEach((segment) => {
            if (segment.questions && segment.questions.length) {
              segment.questions.forEach((question) => {
                if (question.hasOwnProperty('count_document')) delete question.count_document;
                if (question?.date_format) {
                  const map = {
                    'DD/MM/YYYY': 'DDMMYYYY',
                    'DD/MM': 'DDMM',
                    'MM/YYYY': 'MMYYYY',
                    'DD': 'DD',
                    'MM': 'MM',
                    'YYYY': 'YYYY'
                  }
                  question.date_format = map[question.date_format]
                }
              });
            }
          });
        }
        payload.contract_signatory = signatoryIds;

        // const stepValid = this.checkStepTypeChange();
        // if (stepValid) {
        this.subs.sink = this.formBuilderService.createUpdateFormBuilderStep(payload).subscribe(
          (resp) => {
            if (resp) {
              // this.initialData = _.cloneDeep(this.stepParamatersForm.value);
              // this.isFormUnchanged();
              this.isWaitingForResponse = false;
              if (noNeedSwal) {
                this.formBuilderService.setStepData(null);
                this.updateTabs.emit(this.stepParamatersForm.get('step_type').value);
                // this.ngOnInit();
                this.populateStepData();
              } else {
                Swal.fire({
                  type: 'success',
                  title: this.translate.instant('Bravo!'),
                  confirmButtonText: this.translate.instant('OK'),
                  allowEnterKey: false,
                  allowEscapeKey: false,
                  allowOutsideClick: false,
                }).then((action) => {
                  this.formBuilderService.setStepData(null);
                  this.updateTabs.emit(this.stepParamatersForm.get('step_type').value);
                  // this.ngOnInit();
                  this.populateStepData();
                });
              }
            } else {
              this.isWaitingForResponse = false;
            }
          },
          (error) => {
            this.isWaitingForResponse = false;

            if (error.message && error.message === 'GraphQL error: final message step already exist') {
              Swal.fire({
                type: 'error',
                title: 'Error',
                text: 'A template can not have multiple final messages',
              }).then(() => {
                return this.populateStepData();
              });
            } else if (error.message && error.message === 'GraphQL error: pre contract template step name already exist') {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('Uniquename_S1.TITLE'),
                text: this.translate.instant('Uniquename_S1.TEXT'),
                confirmButtonText: this.translate.instant('Uniquename_S1.BUTTON'),
              }).then(() => {
                return this.populateStepData();
              });
            } else if (error.message && error.message === 'GraphQL error: final step already exist') {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('Form_S2.TITLE'),
                text: this.translate.instant('Form_S2.TEXT'),
                confirmButtonText: this.translate.instant('Form_S2.BUTTON1'),
              });
            } else if (
              error.message &&
              error.message === 'GraphQL error: Sorry, this template already has step Contract Signing Process !'
            ) {
              this.swallStepTypeDuplicate();
            } else {
              throw error;
            }
          },
        );
        // } else {
        //   this.isWaitingForResponse = false;
        // }
      }
    }
    if(addSignatory) { //add again validtor on sign contract button text after save
      this.stepParamatersForm.get('custom_button_text').get('sign_contract_text').setValidators(Validators.required);
      this.stepParamatersForm.get('custom_button_text').get('sign_contract_text').updateValueAndValidity();
    }
  }

  checkStepTypeChange() {
    const currStepType = this.stepParamatersForm.get('step_type').value;
    const currIdStep = this.stepParamatersForm.get('_id').value;
    for (let i = 1; i < this.step.length; i++) {
      if (this.step[i].step_type === 'step_with_signing_process') {
        if (this.step[i]._id === currIdStep && currStepType !== 'step_with_signing_process') {
          return true;
        } else if (this.step[i]._id !== currIdStep && currStepType === 'step_with_signing_process') {
          this.swallStepTypeDuplicate();
          return false;
        } else {
          return true;
        }
      } else {
        return true;
      }
    }
    return true;
  }

  swallStepTypeDuplicate() {
    Swal.fire({
      type: 'error',
      title: this.translate.instant('Form_S3.TITLE'),
      text: this.translate.instant('Form_S3.TEXT'),
      confirmButtonText: this.translate.instant('Form_S3.BUTTON1'),
    }).then(() => {
      // return this.ngOnInit();
      return this.populateStepData();
    });
  }

  checkFormValidity(): boolean {
    if (this.stepParamatersForm.invalid) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Invalid_Form_Warning.TITLE'),
        html: this.translate.instant('Invalid_Form_Warning.TEXT'),
        confirmButtonText: this.translate.instant('Invalid_Form_Warning.BUTTON'),
      });
      this.stepParamatersForm.markAllAsTouched();
      return true;
    } else {
      return false;
    }
  }

  leave() {
    this.checkIfAnyChildrenFormInvalid();
  }

  checkIfAnyChildrenFormInvalid() {
    if (!this.formBuilderService.childrenFormValidationStatus) {
      this.fireUnsavedDataWarningSwal();
    } else {
      this.router.navigate(['form-builder']);
    }
  }

  // old function 031
  // isFormUnchanged() {
  //   const initialData = JSON.stringify(this.initialData);
  //   const currentData = JSON.stringify(this.stepParamatersForm.getRawValue());



  //   if (initialData === currentData) {
  //     this.formBuilderService.childrenFormValidationStatus = true;
  //     return true;
  //   } else {
  //     this.formBuilderService.childrenFormValidationStatus = false;
  //     return false;
  //   }
  // }

  // function from 009
  isFormUnchanged() {
    const initialData = JSON.stringify(this.initialData);
    const currentData = JSON.stringify(this.stepParamatersForm.value);
    if (initialData === currentData) {
      this.formBuilderService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.formBuilderService.childrenFormValidationStatus = false;
      return false;
    }
  }

  formIsSame() {
    const initialData = _.cloneDeep(this.initialData);
    const currentData = _.cloneDeep(this.stepParamatersForm.value);
    const equalForm = _.isEqual(initialData, currentData);
    return equalForm;
  }

  fireUnsavedDataWarningSwal() {
    if (!this.isPublished) {
      return Swal.fire({
        type: 'warning',
        title: this.translate.instant('TMTC_S01.TITLE'),
        text: this.translate.instant('TMTC_S01.TEXT'),
        confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.value) {
          // I will save first
          return;
        } else {
          // discard changes
          this.formBuilderService.childrenFormValidationStatus = true;
          this.router.navigate(['form-builder']);
        }
      });
    } else {
      // discard changes
      this.formBuilderService.childrenFormValidationStatus = true;
      this.router.navigate(['form-builder']);
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
