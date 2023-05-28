import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { AbstractControl, FormGroup, UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { SubSink } from 'subsink';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { removeSpaces } from 'app/service/customvalidator.validator';
import Swal from 'sweetalert2';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { AddSegmentFormBuilderDialogComponent } from '../../common-template-step-detail/add-segment-form-builder-dialog/add-segment-form-builder-dialog.component';
import { cloneDeep } from 'lodash';
import { ApplicationUrls } from 'app/shared/settings';
import * as _ from 'lodash';
import { concat, forkJoin, of, Subject, zip } from 'rxjs';
import { catchError, concatMap, debounceTime, map, startWith, take, tap, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'ms-common-template-step-detail-tab',
  templateUrl: './common-template-step-detail-tab.component.html',
  styleUrls: ['./common-template-step-detail-tab.component.scss'],
})
export class CommonTemplateStepDetailTabComponent implements OnInit, OnDestroy {
  @Input() templateId;
  @Input() stepId;
  @Input() step;
  @Input() templateType;
  @Input() stepIndex: number;
  @Input() isPublished: boolean;
  @Input() finalValidation: boolean;
  @Input() takenUniqueStep: string[];
  @Output() updateTabs = new EventEmitter();
  @ViewChildren('blockPanel') blockPanel: QueryList<ElementRef>;
  @ViewChildren('questionPanel') questionPanel: QueryList<ElementRef>;
  @ViewChild('fileUploadDoc', { static: false }) fileUploaderDoc: ElementRef;
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  templateStepForm: UntypedFormGroup;
  initialStepForm;
  private subs = new SubSink();
  isWaitingForResponse = false;
  currentStepIndex = 0;
  parentAnswerType: string;
  questionnaireFields: string[];
  // stepTypeList;
  // validatorList: { _id: string; name: string }[];
  questionnaireConsts;
  docListType;
  selectedDocType;
  listUploadDocumentPDF: any;
  conditionalStepsDropdown: any[];
  filteredConditionalStepsDropdown: any[];
  initialStepData: any;
  totalQuestionDocumentExpected: number = 0;

  public Editor = DecoupledEditor;
  public config = {
    toolbar: ['heading', 'bold', 'italic', 'underline', 'strikethrough', 'numberedList', 'bulletedList', 'undo', 'redo'],
    height: '20rem',
  };

  public configTypeCondition = {
    toolbar: [
      'heading',
      '|',
      'fontSize',
      'fontFamily',
      'fontColor',
      'fontBackgroundColor',
      '|',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      '|',
      'alignment',
      '|',
      'numberedList',
      'bulletedList',
      'todoList',
      '|',
      'indent',
      'outdent',
      '|',
      'link',
      'blockQuote',
      'imageUpload',
      'insertTable',
      'horizontalLine',
      'pageBreak',
      '|',
      'undo',
      'redo',
    ],
    link: {
      addTargetToExternalLinks: true,
    },
    table: {
      contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'],
    },
  };
  photo: string;
  filteredFieldTypeQuestion: any;
  public inputFieldTypeQuestion$ = new Subject<string | null>();
  isLoadingFilter = false;
  isFinalStep: any;
  _selectedFieldTypeSet: Set<any>;

  onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  constructor(
    private fb: UntypedFormBuilder,
    // private formBuilderService: FormBuilderService,
    private router: Router,
    private translate: TranslateService,
    public dialog: MatDialog,
    private formBuilderService: FormBuilderService,
    private utilService: UtilityService,
    private fileUploadService: FileUploadService,
  ) {}

  ngOnInit() {

    this.initTemplateStepForm();
    this.getDropdown();
    this.populateStepData();
    this.initFormUpdateListener();
    // this.initSegmentForm();
    this.initSegmentListener(); // on changes, reflect to preview


    this.isFinalStep = this.step[this.stepIndex].is_final_step;
    if (this.isPublished) {
      this.templateStepForm.disable();
    }
    // this.subs.sink = this.translate.onLangChange.subscribe(() => {
    //   this.translateAdditionalStep()
    // });
  }

  populateStepData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.formBuilderService.getOneFormBuilderStep(this.stepId).subscribe((response) => {
      this.isWaitingForResponse = false;
      const step = cloneDeep(response);


      if (step) {
        // if (step.validator && step.validator._id) {
        //   step.validator = step.validator._id;
        // }
        if (step.segments.length) {
          if (step.segments[0].document_for_condition) {
            this.selectedDocType = step.segments[0].document_for_condition;
          }
          if (step.segments[0].acceptance_pdf) {
            this.listUploadDocumentPDF = step.segments[0].acceptance_pdf;
          }
        }
        // if (step.step_type && this.takenUniqueStep.includes(step.step_type) && !this.stepTypeList.includes(step.step_type)) {
        //   // readds the unique type to the dropdown if the one taking the unique step is this current step
        //   // needs to readds to allow for translation and re-selection of the same step
        //   this.stepTypeList.push(step.step_type);
        // }
        this.handleStepCondition(step);
        this.templateStepForm.patchValue(step);
        this.toggleFieldTotalMandatoryDisableStatus();

        this.formBuilderService.setStepData(step);
        if (this.isFinalStep) {
          this.changesRouterOn();

        }
        this.initialStepForm = _.cloneDeep(this.templateStepForm.value);
        this.initialStepData = _.cloneDeep(step);
        this.isFormChanged();
        this.initValueChanges();
        if (this.isPublished) {
          this.templateStepForm.disable();
          this.getSegmentFormarray().disable();
          if (this.getQuestionsFormarray.length) {
            this.getQuestionsFormarray().disable();
          }
        }
      }

      this.filterSelectedFieldOption();
      this.initTypeAhead();
    });
  }

  // toggle field total mandatory document for step document expected disable status
  toggleFieldTotalMandatoryDisableStatus(from?: string): void {
    if (this.templateStepForm.get('step_type').value === 'document_expected') {
      const lengthQuestion = this.getQuestionFieldFormArray(0).length;
      this.totalQuestionDocumentExpected = lengthQuestion;

      if (lengthQuestion === 0) {

        this.getSegmentFormarray().at(0).get('total_mandatory_document').disable();
        if (from === 'remove') {
          this.getSegmentFormarray().at(0).get('total_mandatory_document').setValue(lengthQuestion);
        }
      } else {

        this.getSegmentFormarray().at(0).get('total_mandatory_document').enable();
      }
      this.getSegmentFormarray().at(0).updateValueAndValidity();
    }
  }

  initFormUpdateListener() {
    this.subs.sink = this.formBuilderService.stepDetailFormData$.subscribe((resp) => {
      if (resp) {
        this.templateStepForm.patchValue(resp, { emitEvent: true });

      }
    });
  }

  initValueChanges() {
    this.subs.sink = this.templateStepForm.valueChanges.subscribe(() => {
      this.isFormChanged();
    });
  }

  getDropdown() {
    // this.stepTypeList = this.formBuilderService.getStepTypeList().filter((type) => !this.takenUniqueStep.includes(type));
    // this.getUserTypeList();
    const filter = {
      form_builder_id: this.templateId,
      is_only_visible_based_on_condition: true,
    };
    this.questionnaireConsts = this.formBuilderService.getQuestionnaireConst();
    this.docListType = this.formBuilderService.getConditionDocTypeList();
    if (this.templateType === 'quality_file') {
      this.docListType = this.docListType.filter((val) => val !== 'use_from_certification_rule');
    }

    this.isWaitingForResponse = true;
    this.subs.sink = this.formBuilderService.getAllFormBuilderSteps(filter).subscribe(
      (resp) => {
        this.conditionalStepsDropdown = resp.filter((step) => step && step._id && step._id !== this.stepId);
        this.filteredConditionalStepsDropdown = [...this.conditionalStepsDropdown];
        this.isWaitingForResponse = false;
      },
      (err) => {
        console.error(err);
        this.isWaitingForResponse = false;
      },
    );

    if (this.templateType && this.templateType === 'quality_file') {
      this.questionnaireFields = this.questionnaireConsts.qualityFileQuestionnaireFields;
    } else if (this.templateType && (this.templateType === 'student_admission' || this.templateType === 'employability_survey')) {
      this.questionnaireFields = this.questionnaireConsts.questionnaireFields;
    }
  }

  initTemplateStepForm() {
    this.templateStepForm = this.fb.group({
      _id: [null],
      step_title: ['', [Validators.required, removeSpaces]],
      step_type: [null, [Validators.required]],
      direction: [''],
      segments: this.fb.array([]),
    });
  }

  initSegmentForm() {
    return this.fb.group({
      _id: [null],
      segment_title: ['', [Validators.required]],
      questions: this.fb.array([]),
      document_for_condition: [null],
      acceptance_text: [''],
      acceptance_pdf: [''],
      is_rejection_allowed: [false],
      is_on_reject_complete_the_step: [false],
      is_download_mandatory: [false],
      accept_button: [null],
      reject_button: [null],
      use_total_mandatory_documents: [false],
      total_mandatory_document: [null],
    });
  }

  initQuestionFieldForm() {
    return this.fb.group({
      _id: [null],
      ref_id: [{ value: null, disabled: true }],
      field_type: [null],
      is_field: [
        this.templateStepForm &&
        this.templateStepForm.get('step_type').value &&
        this.templateStepForm.get('step_type').value === 'document_expected'
          ? false
          : true,
      ],
      is_editable: [false],
      is_required: [false],
      field_position: [null],
      options: this.fb.array([]),
      question_label: [''],
      is_router_on: [false],
      is_required_for_next_es: [false],
      date_format: ['DD/MM/YYYY'],
      answer_type: [
        this.templateStepForm &&
        this.templateStepForm.get('step_type').value &&
        this.templateStepForm.get('step_type').value === 'document_expected'
          ? 'document_pdf_upload'
          : null,
      ],
      numeric_validation: this.fb.group({
        condition: [null],
        number: [null],
        min_number: [null],
        max_number: [null],
        custom_error_text: [null],
      }),
      multiple_option_validation: this.fb.group({
        condition: [null],
        number: [null],
        custom_error_text: [null],
      }),
      text_validation: this.fb.group({
        condition: [null],
        number: [null],
        custom_error_text: [null],
      }),
      special_question: this.fb.group({
        summary_header: [null],
        summary_footer: [null],
      }),
      parent_child_options: [[]],
      final_message_question: this.fb.group({
        final_message_image: this.fb.group({
          name: null,
          s3_file_name: null,
        }),
        final_message_summary_header: null,
        final_message_summary_footer: null,
      }),
    });
  }

  initOptionFieldForm(): UntypedFormGroup {
    return this.fb.group({
      option_name: [null],
      is_continue_next_step: [false],
      is_go_to_final_step: [false],
      is_go_to_final_message: [false],
      additional_step_id: [null],
      additional_step_name: [null], // This won't be sent to BE
    });
  }

  // getUserTypeList() {
  //   this.subs.sink = this.formBuilderService.getUserTypesForValidator().subscribe((resp) => {
  //     let tempData = resp;
  //     this.validatorList = tempData;
  //   });
  // }

  initSegmentListener() {
    // listen to changes in template step form to pass data to preview
    this.subs.sink = this.templateStepForm.valueChanges.subscribe((formData) => {
      this.formBuilderService.setStepData(this.templateStepForm.value);
    });
  }

  initTypeAhead() {
    this.filteredFieldTypeQuestion = concat(
      of([]),
      this.inputFieldTypeQuestion$.pipe(
        startWith(''),
        debounceTime(300),
        distinctUntilChanged(),
        concatMap((searchTxt: any) => {
          if (searchTxt && searchTxt.length > 2) {
            this.isLoadingFilter = true;
            const filter = {
              question_label: searchTxt,
            };
            const is_for_dropdown = true;
            return zip(
              of(this.questionnaireFields).pipe(
                map((data) => data.filter((value) => this.translate.instant(value).toLowerCase().includes(searchTxt.toLowerCase()))),
              ),
              this.formBuilderService.getAllFormBuilderFieldTypes(filter, is_for_dropdown).pipe(
                take(1),
                tap(() => {
                  this.isLoadingFilter = false;
                }),
                catchError((err) => {
                  this.isLoadingFilter = false;
                  return of([]);
                }),
              ),
            );
            // of(this.questionnaireFields),
            // );
          } else {
            return of(this.questionnaireFields);
          }
        }),
        map((questionLabels) => {
          questionLabels = questionLabels.flat();
          return questionLabels
            .map((question) => this.convertQuestionLabel(question, typeof question !== 'string'))
            .filter((question) => !question.isCustomQuestion ? question : !this.selectedFieldTypeSet.has(question.questionLabel));
        }),
      ),
    );

  }

  // if from static is custom false, from dynamic is custom true
  convertQuestionLabel(question: any, isCustomQuestion: boolean) {
    return {
      questionLabel: isCustomQuestion ? question.question_label : question,
      isCustomQuestion,
      answerType: isCustomQuestion ? question.answer_type : null,
      options: isCustomQuestion ? question.options : null,
    };
  }

  getSegmentFormarray(): UntypedFormArray {
    return this.templateStepForm.get('segments') as UntypedFormArray;
  }

  getQuestionsFormarray(): UntypedFormArray {
    return this.getSegmentFormarray().get('questions') as UntypedFormArray;
  }

  customValidation(question, type) {
    let errorText: string;
    let condition: string;
    let number: number;

    if (type === 'numeric') {
      errorText = question.get('numeric_validation').get('custom_error_text').value;
      condition = question.get('numeric_validation').get('condition').value;
      number = question.get('numeric_validation').get('number').value;
    } else if (type === 'text_validation') {
      errorText = question.get('text_validation').get('custom_error_text').value;
      condition = question.get('text_validation').get('condition').value;
      number = question.get('text_validation').get('number').value;
    } else {
      errorText = question.get('multiple_option_validation').get('custom_error_text').value;
      condition = question.get('multiple_option_validation').get('condition').value;
      number = question.get('multiple_option_validation').get('number').value;
    }

    let result = true;
    if (!condition && !number && !errorText) {
      result = false;
    }
    return result;
  }

  // onChangeValidationRequirement(option) {

  //   if (option && !option.checked) {
  //     this.templateStepForm.get('validator').patchValue(null);
  //     this.templateStepForm.get('validator').clearValidators(); // have to clear validators due to late detection of [required]
  //     this.templateStepForm.get('validator').setErrors(null); // have to set error to null due to asynchronous issue with the toggle and late [required] detection
  //   }
  // }

  onAnswerTypeChange($event, questionField) {

    if ($event === 'numeric') {
      const group = questionField.get('text_validation') as UntypedFormGroup;
      group.get('condition').patchValue(null);
      group.get('number').patchValue(null);
      group.get('custom_error_text').patchValue(null);
      group.updateValueAndValidity();
    } else if ($event === 'short_text' || $event === 'long_text') {
      const group = questionField.get('numeric_validation') as UntypedFormGroup;
      group.get('condition').patchValue(null);
      group.get('number').patchValue(null);
      group.get('custom_error_text').patchValue(null);
      group.updateValueAndValidity();
    } else if ($event === 'multiple_option') {
      const group = questionField.get('multiple_option_validation') as UntypedFormGroup;
      group.get('condition').patchValue(null);
      group.get('number').patchValue(null);
      group.get('custom_error_text').patchValue(null);
      group.updateValueAndValidity();
    } else {
      const groupText = questionField.get('text_validation') as UntypedFormGroup;
      groupText.get('condition').patchValue(null);
      groupText.get('number').patchValue(null);
      groupText.get('custom_error_text').patchValue(null);
      groupText.updateValueAndValidity();

      const groupNumeric = questionField.get('numeric_validation') as UntypedFormGroup;
      groupNumeric.get('condition').patchValue(null);
      groupNumeric.get('number').patchValue(null);
      groupNumeric.get('custom_error_text').patchValue(null);
      groupNumeric.updateValueAndValidity();

      const groupMultipleOption = questionField.get('multiple_option_validation') as UntypedFormGroup;
      groupMultipleOption.get('condition').patchValue(null);
      groupMultipleOption.get('number').patchValue(null);
      groupMultipleOption.get('custom_error_text').patchValue(null);
      groupMultipleOption.updateValueAndValidity();
    }
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

  addSegmentForm(dialog?: string) {
    if (dialog === 'Open Dialog') {
      this.subs.sink = this.dialog
        .open(AddSegmentFormBuilderDialogComponent, {
          width: '400px',
          minHeight: '100px',
          panelClass: 'certification-rule-pop-up',
          disableClose: true,
        })
        .afterClosed()
        .subscribe((response) => {
          if (response) {
            this.getSegmentFormarray().push(this.initSegmentForm());
            this.getSegmentFormarray()
              .at(this.getSegmentFormarray().length - 1)
              .get('segment_title')
              .patchValue(response.addSegment);

            setTimeout(() => {
              if (this.blockPanel && this.blockPanel.last && this.blockPanel.length) {


                this.blockPanel.toArray()[this.blockPanel.length - 1].nativeElement.scrollIntoView({ behavior: 'smooth' });
              }
            }, 500);

          }
        });
    } else {
      this.getSegmentFormarray().push(this.initSegmentForm());
    }
  }

  removeSegmentForm(segmentIndex) {
    this.getSegmentFormarray().removeAt(segmentIndex);
    this.filterSelectedFieldOption();
  }

  getQuestionFieldFormArray(segmentIndex): UntypedFormArray {

    return this.getSegmentFormarray().at(segmentIndex).get('questions') as UntypedFormArray;
  }

  getOptionsFormArrayFrom(questionField: UntypedFormGroup) {
    return questionField.get('options') as UntypedFormArray;
  }

  addQuestionFieldForm(segmentIndex, questionType = null) {
    const group = this.initQuestionFieldForm();
    if (typeof questionType === 'string') this.onAnswerTypeChange(questionType, group);
    this.getQuestionFieldFormArray(segmentIndex).push(group);
    if (this.templateStepForm.get('step_type').value === 'document_expected') {
      this.totalQuestionDocumentExpected++;
      this.getSegmentFormarray().at(0).get('total_mandatory_document').setValidators(Validators.max(this.totalQuestionDocumentExpected));
      this.toggleFieldTotalMandatoryDisableStatus();
      this.templateStepForm.updateValueAndValidity();
    }

  }

  scrollIntoLastQuestion(segmentIndex) {
    setTimeout(() => {
      if (this.questionPanel && this.questionPanel.length) {
        this.getQuestionFieldFormArray(segmentIndex).updateValueAndValidity();
        let length = 0;
        for (let index = segmentIndex; index >= 0; index--) {
          length += this.getQuestionFieldFormArray(index).length;
        }
        this.questionPanel.toArray()[length - 1].nativeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 1000);
  }

  removeQuestionFieldForm(segmentIndex, questionIndex) {
    this.getQuestionFieldFormArray(segmentIndex).removeAt(questionIndex);
    if (this.templateStepForm.get('step_type').value === 'document_expected') {
      this.totalQuestionDocumentExpected--;
      this.getSegmentFormarray().at(0).get('total_mandatory_document').setValidators(Validators.max(this.totalQuestionDocumentExpected));
      this.templateStepForm.updateValueAndValidity();
      this.toggleFieldTotalMandatoryDisableStatus('remove');
    }
    this.filterSelectedFieldOption();
  }

  checkIsParentChild(question) {
    if (question && question.answer_type === 'parent_child_option' && question.is_field === false) {
      return true;
    }
    return false;
  }

  checkIsMutiOption(question) {
    if (
      question &&
      (question.answer_type === 'multiple_option' || question.answer_type === 'single_option') &&
      question.is_field === false
    ) {
      return true;
    }
    return false;
  }

  addMoreAnswers(segmentIndex, questionIndex, elementRef) {
    // if use enter for add more and option empty
    if (!elementRef.value) {
      return;
    }
    if (elementRef.value) {
      const childOptions = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('parent_child_options').value;
      const optionPosition = childOptions.length;

      childOptions.push({
        option_text: elementRef.value,
        position: optionPosition,
        questions: [],
      });

      elementRef.value = '';
      this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('parent_child_options').patchValue(childOptions);


    }
  }

  addMoreOptions(segmentIndex, questionIndex, optionText) {
    //if enter with empty option text
    if (!optionText.value) {
      return;
    }

    const option = this.initOptionFieldForm();
    const options = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('options') as UntypedFormArray;
    option.patchValue({ option_name: optionText.value });
    options.push(option);

  }

  removeOption(segmentIndex, questionIndex, optionIndex) {
    Swal.fire({
      title: this.translate.instant('MENTOREVALUATION.QUESTIONNAIRE.Messages.deletedOptionWarningTitle'),
      // html: self.translate.instant('MENTOREVALUATION.QUESTIONNAIRE.Messages.deletedOptionWarningMessage'),
      type: 'warning',
      showCancelButton: true,
      allowEscapeKey: true,
      confirmButtonText: this.translate.instant('YES'),
      cancelButtonText: this.translate.instant('NO'),
    }).then((res) => {
      if (res.value) {

        const options = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('options') as UntypedFormArray;
        options.removeAt(optionIndex);
        // this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('options').patchValue(options);

        Swal.fire({
          title: this.translate.instant('MENTOREVALUATION.QUESTIONNAIRE.Messages.deleted'),
          text: this.translate.instant('MENTOREVALUATION.QUESTIONNAIRE.Messages.deletedOptionSuccess'),
          allowEscapeKey: true,
          type: 'success',
        });
      }
    });
  }

  updateOptionText(segmentIndex: number, questionIndex: number, optionIndex: number, updatedName: string) {
    const options = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('options') as UntypedFormArray;
    options.at(optionIndex).get('option_name').patchValue(updatedName);
  }

  updateFieldToggle(event: MatSlideToggleChange, segmentIndex: number, questionIndex: number) {
    if (event.checked) {
      this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('answer_type').patchValue(null); // make answer type to null if is_field is turned on
      this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('is_editable').patchValue(false);
    } else {
      this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('field_type').patchValue(null); // make field type to null if is_field is turned off
      this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('is_editable').patchValue(true);
    }
  }

  updateRequiredToggle(segmentIndex: number, questionIndex: number) {
    this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('is_router_on').patchValue(false);
    this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('is_required_for_next_es').patchValue(false);
    this.resetAdditionalStep(segmentIndex, questionIndex);

  }

  resetAdditionalStep(segmentIndex: number, questionIndex: number) {
    const options = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('options') as UntypedFormArray;
    options.value.map((option, idxOption) => {
      if (option.is_continue_next_step) {
        options.at(idxOption).get('is_continue_next_step').patchValue(false);
      }
      if (option.is_go_to_final_step) {
        options.at(idxOption).get('is_go_to_final_step').patchValue(false);
      }
      if (option.additional_step_id) {
        options.at(idxOption).get('additional_step_id').patchValue(null);
      }
      if (option.additional_step_name) {
        options.at(idxOption).get('additional_step_name').patchValue(null);
      }
    });
  }

  updateEditableToggle(event: MatSlideToggleChange, segmentIndex: number, questionIndex: number) {
    if (event.checked) {
      this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('is_required').patchValue(true);
    } else {
      this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('is_required').patchValue(false);
    }
  }

  dropSegment(event: CdkDragDrop<string[]>) {
    if (!this.isPublished) {
      if (event.previousContainer === event.container) {
        const subModuleDrop = event.container.data;

        moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
        this.getSegmentFormarray().updateValueAndValidity({ onlySelf: false });
        // this.formBuilderService.setStepData(this.templateStepForm.value);
      } else {

        transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
        this.getSegmentFormarray().updateValueAndValidity({ onlySelf: false });
        // this.formBuilderService.setStepData(this.templateStepForm.value);
      }
    }
  }

  dropQuestion(event: CdkDragDrop<string[]>, segmentIndex: number) {

    if (event.previousContainer === event.container) {
      const subModuleDrop = event.container.data;

      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.getQuestionFieldFormArray(segmentIndex).updateValueAndValidity({ onlySelf: false });
      // this.formBuilderService.setStepData(this.templateStepForm.value)
    } else {

      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
      this.getQuestionFieldFormArray(segmentIndex).updateValueAndValidity({ onlySelf: false });
      // this.formBuilderService.setStepData(this.templateStepForm.value)
    }
  }

  dropOption(event: CdkDragDrop<any[]>, segmentIndex: number, questionIndex: number) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('options').updateValueAndValidity({ onlySelf: false });
    }
  }

  dropPCOption(event: CdkDragDrop<any[]>, segmentIndex: number, questionIndex: number) {
    if (event?.previousContainer === event?.container) {
      moveItemInArray(event?.container?.data, event?.previousIndex, event?.currentIndex);
      this.getQuestionFieldFormArray(segmentIndex)?.at(questionIndex)?.get('parent_child_options')?.updateValueAndValidity({ onlySelf: false });
    }
  }

  onNextStepType($event) {
    if (!$event.target.value) {
      this.filteredConditionalStepsDropdown = [...this.conditionalStepsDropdown];
    } else {
      this.filteredConditionalStepsDropdown = this.conditionalStepsDropdown.filter((step) => {
        const isSane = step && typeof step.step_title === 'string';
        return isSane && step.step_title.toLowerCase().trim().includes($event.target.value.toLowerCase().trim());
      });
    }
  }

  onSelectNextStepAt(event) {
    const { optionIndex: idx, questionField: field, optionType: value } = event;
    const options = field.get('options') as UntypedFormArray;
    const option = options.at(idx) as UntypedFormGroup;
    if (typeof value === 'string') {
      option.patchValue({
        additional_step_id: null,
        additional_step_name: value,
        is_continue_next_step: value === 'Continue Next Step',
        is_go_to_final_step: value === 'Go To Final Step',
        is_go_to_final_message: value === 'Complete the form',
      });
    } else if (typeof value === 'object' && typeof value._id === 'string' && typeof value.step_title === 'string') {
      const isFinalStep = value.is_final_step ? value.is_final_step : false;
      option.patchValue({
        additional_step_id: value._id,
        additional_step_name: value.step_title,
        is_continue_next_step: !isFinalStep,
        is_go_to_final_step: isFinalStep,
        is_go_to_final_message: false,
      });
    }
    this.filteredConditionalStepsDropdown = [...this.conditionalStepsDropdown];
  }

  onAllowRejectionChange($event: MatSlideToggleChange, segmentRef: UntypedFormGroup) {
    if (!$event.checked) {
      segmentRef.get('is_on_reject_complete_the_step').setValue(false);
      segmentRef.get('reject_button').setValue(null);
      segmentRef.get('reject_button').markAsUntouched();
      segmentRef.get('reject_button').markAsPristine();
      segmentRef.get('reject_button').clearValidators();
      segmentRef.get('reject_button').setErrors(null);
    } else if ($event.checked) {
      segmentRef.get('reject_button').setValidators([Validators.required]);
    }
  }

  cleanNullValues(obj) {
    return Object.keys(obj).forEach((key) => {
      if (obj[key] && typeof obj[key] === 'object') {
        this.cleanNullValues(obj[key]);
      } else if (obj[key] === null) {
        delete obj[key];
      } else if (key === 'additional_step_name') {
        delete obj[key];
      }
    });
  }

  saveStepData() {
    this.isWaitingForResponse = true;
    const payload = { ...this.initialStepData, ...this.templateStepForm.getRawValue() };
    this.cleanNullValues(payload);
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
                DD: 'DD',
                MM: 'MM',
                YYYY: 'YYYY',
              };
              question.date_format = map[question.date_format];
            }
          });
        }
      });
    }
    if (payload.validator && payload.validator._id) {
      payload.validator = payload.validator._id;
    }
    if (payload.user_who_complete_step && payload.user_who_complete_step._id) {
      payload.user_who_complete_step = payload.user_who_complete_step._id;
    }

    this.subs.sink = this.formBuilderService.createUpdateFormBuilderStep(payload).subscribe(
      (resp) => {
        if (resp) {
          this.isWaitingForResponse = false;
          this.initialStepForm = _.cloneDeep(this.templateStepForm.value);
          this.initTemplateStepForm();
          this.isFormChanged();
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo!'),
            confirmButtonText: this.translate.instant('OK'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then((action) => {
            this.formBuilderService.setStepData(null);
            this.updateTabs.emit(true);
            this.populateStepData();
            this.initSegmentListener();
          });
        } else {
          this.isWaitingForResponse = false;
        }
      },
      (error) => {
        this.isWaitingForResponse = false;
        if (error.message && error.message === 'GraphQL error: pre contract template step name already exist') {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('Uniquename_S1.TITLE'),
            text: this.translate.instant('Uniquename_S1.TEXT'),
            confirmButtonText: this.translate.instant('Uniquename_S1.BUTTON'),
          });
        } else {
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: error && error['message'] ? error['message'] : error,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          });
        }
      },
    );
  }

  isFormChanged() {
    const initialStepForm = JSON.stringify(this.initialStepForm);
    const currentForm = JSON.stringify(this.templateStepForm.value);


    if (initialStepForm === currentForm) {
      this.formBuilderService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.formBuilderService.childrenFormValidationStatus = false;
      return false;
    }
  }

  formIsSame() {
    this.templateStepForm.updateValueAndValidity({ emitEvent: false, onlySelf: true });
    const initialData = _.cloneDeep(this.initialStepForm);
    const currentData = _.cloneDeep(this.templateStepForm.value);
    const equalForm = _.isEqual(initialData, currentData);
    return equalForm;
  }

  selectDocumentExpectedType(event, segmentIndex, questionIndex) {
    let text = '';
    switch (event) {
      case 'diploma':
        text = 'Diplôme';
        break;
      case 'exemption_block_justification':
        text = 'Dispense';
        break;
      case 'derogation':
        text = 'Dérogation';
        break;
      default:
        text = '';
        break;
    }
    this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('question_label').patchValue(text);
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

  handleStepCondition(step) {
    if (step.segments && step.segments.length) {
      step.segments.forEach((segment, segmentIndex) => {
        this.addSegmentForm();
        if (segment && segment.questions && segment.questions.length) {
          segment.questions.forEach((question, questionIndex) => {
            // if BE return null instead object create null into object
            if (!question.numeric_validation) question.numeric_validation = {};
            if (!question.final_message_question) question.final_message_question = {};
            if (!question.text_validation) question.text_validation = {};
            if (!question.multiple_option_validation) question.multiple_option_validation = {};
            if (question.final_message_question && !question.final_message_question.final_message_image) {
              question.final_message_question.final_message_image = {};
            }
            if (!question.special_question) question.special_question = {};
            if (!question.parent_child_options) question.parent_child_options = [];
            this.addQuestionFieldForm(segmentIndex, question.answer_type);

            if (question?.answer_type === 'date') {
              const map = {
                DDMMYYYY: 'DD/MM/YYYY',
                DDMM: 'DD/MM',
                MMYYYY: 'MM/YYYY',
                DD: 'DD',
                MM: 'MM',
                YYYY: 'YYYY',
              };
              question.date_format = map[question?.date_format] ?? question?.date_format ?? 'DD/MM/YYYY';
            }

            if (question && question.options && question.options.length) {
              question.options.forEach((option, optionIdx) => {
                const question = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex) as UntypedFormGroup;
                const options = question.get('options') as UntypedFormArray;
                const group = this.initOptionFieldForm();
                let matchedStep;
                if (this.conditionalStepsDropdown && this.conditionalStepsDropdown.length) {
                  matchedStep = this.conditionalStepsDropdown.find((step) => {
                    const isSane =
                      step &&
                      typeof step.step_title === 'string' &&
                      typeof step._id === 'string' &&
                      option &&
                      typeof option.additional_step_id === 'string';
                    return isSane && step._id === option.additional_step_id;
                  });
                }
                group.patchValue({
                  additional_step_name: (() => {
                    if (matchedStep && matchedStep.step_title) return matchedStep.step_title;
                    else if (option && option.is_continue_next_step) return this.translate.instant('Continue Next Step');
                    else if (option && option.is_go_to_final_step) return this.translate.instant('Go To Final Step');
                    else if (option && option.is_go_to_final_message) return this.translate.instant('Complete the form');
                    else return null;
                  })(),
                });
                options.push(group);
              });
            }
          });
        }
      });
    } else if (
      (step.step_type && step.step_type === 'condition_acceptance') ||
      (step.step_type && step.step_type === 'document_expected')
    ) {
      this.addSegmentForm();
    } else if (step.step_type && (step.step_type === 'summary' || step.step_type === 'final_message')) {
      this.addCampusValidationForm();
    }
  }
  addCampusValidationForm() {
    this.getSegmentFormarray().push(this.initSegmentForm());

    this.templateStepForm.value.segments.forEach((segments, segmentIndex) => {
      this.addQuestionFieldForm(segmentIndex);
    });
  }

  handleDocumentSelected(value, index) {

    this.deletePDF(index); // clean data of previous uploaded doc if any

    this.selectedDocType = value;
    // switch (value) {
    //   case 'upload_pdf':
    //     this.getSegmentFormarray().at(index).get('acceptance_text').patchValue(null);
    //     break;

    //   case 'ck_editor':
    //     this.getSegmentFormarray().at(index).get('acceptance_pdf').patchValue(null);
    //     break;

    //   default:
    //     this.getSegmentFormarray().at(index).get('acceptance_text').patchValue(null);
    //     this.getSegmentFormarray().at(index).get('acceptance_pdf').patchValue(null);
    //     break;
    // }
    this.getSegmentFormarray().at(index).get('acceptance_text').patchValue(null); // make the text to nul on changes to type
    this.getSegmentFormarray().at(index).get('acceptance_pdf').patchValue(null); // make the acceptance_pdf to null on changes to type
    this.templateStepForm.updateValueAndValidity();

    this.formBuilderService.setStepData(this.templateStepForm.value); // set the new templateform to the preview
  }

  openUploadWindow() {
    this.fileUploaderDoc.nativeElement.click();
  }

  chooseFile(fileInput: Event, index, questionIndex) {

    const acceptable = ['jpg', 'jpeg', 'png', 'pdf'];
    const file = (<HTMLInputElement>fileInput.target).files[0];

    const fileType = this.utilService.getFileExtension(file.name).toLocaleLowerCase();
    if (acceptable.includes(fileType)) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe(
        (resp) => {

          this.isWaitingForResponse = false;
          if (resp) {
            if (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/jpg') {
              this.photo = resp.file_url;

              this.getQuestionFieldFormArray(index)
                .at(questionIndex)
                .get('final_message_question')
                .get('final_message_image')
                .get('s3_file_name')
                .patchValue(resp.s3_file_name);
              this.getQuestionFieldFormArray(index)
                .at(questionIndex)
                .get('final_message_question')
                .get('final_message_image')
                .get('name')
                .patchValue(resp.file_name);
              // this.getQuestionFieldFormArray(index).at(questionIndex).value.final_message_question.final_message.name;
            } else {
              this.listUploadDocumentPDF = '';
              this.getSegmentFormarray().at(index).get('acceptance_pdf').patchValue(resp.s3_file_name);

              this.listUploadDocumentPDF = resp.s3_file_name;
              this.fileUploaderDoc.nativeElement = '';
            }
          }
        },
        (err) => {
          this.isWaitingForResponse = false;

          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: 'OK',
          });
        },
      );
    } else {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TITLE'),
        text: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TEXT', { file_exts: '.jpg, .jpeg, .png, .pdf' }),
        allowEscapeKey: false,
        allowOutsideClick: false,
        allowEnterKey: false,
      });
    }
  }

  removeImage(segmentIndex, questionIndex) {
    let timeout = 5;
    let confirmInterval;
    const imageName = this.getQuestionFieldFormArray(segmentIndex)
      .at(questionIndex)
      .get('final_message_question')
      .get('final_message_image')
      .get('name').value;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('Delete_Image_S1.TITLE', { imageName }),
      html: this.translate.instant('Delete_Image_S1.TEXT', { imageName }),
      confirmButtonText: this.translate.instant('Delete_Image_S1.BUTTON_1', { timeout }),
      cancelButtonText: this.translate.instant('Delete_Image_S1.BUTTON_2'),
      showCancelButton: true,
      onOpen: () => {
        timeout--;
        Swal.disableConfirmButton();
        const confirmButtonRef = Swal.getConfirmButton();
        confirmInterval = setInterval(() => {
          if (timeout > 0) {
            confirmButtonRef.innerText = this.translate.instant('Delete_Image_S1.BUTTON_1', { timeout });
            timeout--;
          } else {
            Swal.enableConfirmButton();
            confirmButtonRef.innerText = this.translate.instant('YES');
            clearInterval(confirmInterval);
          }
        }, 1000);
      },
    }).then((result) => {
      clearInterval(confirmInterval);
      if (result.value) {
        this.getQuestionFieldFormArray(segmentIndex)
          .at(questionIndex)
          .get('final_message_question')
          .get('final_message_image')
          .get('s3_file_name')
          .setValue('');
        this.getQuestionFieldFormArray(segmentIndex)
          .at(questionIndex)
          .get('final_message_question')
          .get('final_message_image')
          .get('name')
          .setValue('');
      }
    });
  }

  deletePDF(index) {
    this.listUploadDocumentPDF = '';
    this.getSegmentFormarray().at(index).get('acceptance_text').patchValue(null); // make the text to nul on changes to type
    this.getSegmentFormarray().at(index).get('acceptance_pdf').patchValue(null); // make the acceptance_pdf to null on changes to type
    this.templateStepForm.updateValueAndValidity();
    this.formBuilderService.setStepData(this.templateStepForm.value); // set the new templateform to the preview
  }

  get parentChildValidation() {

    return this.formBuilderService.parentChildValidation && !this.formBuilderService.existingChildOnEdit;
  }

  validationOptionParentAndChild() {
    let validation;
    this.templateStepForm.value.segments.forEach((segments, segmentIndex) => {
      segments.questions.forEach((question, questionIndex) => {
        if (question.answer_type === 'parent_child_option' && !question.is_field) {
          if (question && question.parent_child_options && question.parent_child_options.length < 2) {

            validation = true;
          } else {
            validation = false;
          }
        }
      });
    });
    return validation;
  }

  changesRouterOn() {

    const dataSegment = this.getSegmentFormarray().length;

    for (let segmentIndex = 0; segmentIndex < dataSegment; segmentIndex++) {
      const dataQuestion = this.getQuestionFieldFormArray(segmentIndex).length;

      for (let questionIndex = 0; questionIndex < dataQuestion; questionIndex++) {
        this.updateRequiredToggle(segmentIndex, questionIndex);

      }
    }
  }

  handleChangeInAnswerType(segmentIndex: number, questionIndex: number, answerType) {
    const questionRef: AbstractControl = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex);
    const currentLabel = questionRef.get('question_label').value;
    const currentIsFieldValue = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('is_field').value;
    const currentIsRequired = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('is_required').value;
    const currentIsEditable = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('is_editable').value;

    // resetting the form group
    questionRef.reset(this.initQuestionFieldForm());

    // re patching several important non-null values
    questionRef.get('parent_child_options').patchValue([]);
    questionRef.get('is_editable').patchValue(currentIsEditable);
    questionRef.get('is_required').patchValue(currentIsRequired); // patch the is_required  so it is not null
    questionRef.get('is_field').patchValue(currentIsFieldValue); // patch the is_field so it is not null
    questionRef.get('answer_type').patchValue(answerType);
    questionRef.get('question_label').patchValue(currentLabel);
    (this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('options') as UntypedFormArray).clear();
    questionRef.updateValueAndValidity();
  }

  handleChangeInFieldTypeDynamic(segmentIndex, questionIndex, field) {
    const questionRef: AbstractControl = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex);
    //  if custom question patch field type and answer type
    if (field.isCustomQuestion) {
      const currentIsFieldValue = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('is_field').value;
      const currentIsRequired = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('is_required').value;
      const currentIsEditable = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('is_editable').value;
      // resetting the form group
      questionRef.reset(this.initQuestionFieldForm());
      // re patching several important non-null values
      questionRef.get('parent_child_options').patchValue([]);
      questionRef.get('is_editable').patchValue(currentIsEditable);
      questionRef.get('is_required').patchValue(currentIsRequired); // patch the is_required  so it is not null
      questionRef.get('is_field').patchValue(currentIsFieldValue); // patch the is_field so it is not null
      questionRef.get('answer_type').patchValue(field.answerType);
      questionRef.get('field_type').patchValue(field.questionLabel);
      (this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('options') as UntypedFormArray).clear();
      if (field.answerType === 'multiple_option') {
        const options = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('options') as UntypedFormArray;
        if (field.options && field.options.length) {
          field.options.forEach((option) => {
            const optionField = this.initOptionFieldForm();
            optionField.patchValue({ option_name: option?.option_name });
            options.push(optionField);
          });
        }
      }
      questionRef.updateValueAndValidity();
    } else {
      questionRef.get('answer_type').patchValue(null);
      questionRef.updateValueAndValidity();
    }
    this.filterSelectedFieldOption();
  }

  onUseTotalMandatory($event: MatSlideToggleChange, segmentRef: UntypedFormGroup) {
    if (!$event.checked) {
      segmentRef.get('use_total_mandatory_documents').setValue(false);
      segmentRef.get('total_mandatory_document').setValue(null);
      segmentRef.get('total_mandatory_document').markAsUntouched();
      segmentRef.get('total_mandatory_document').markAsPristine();
      segmentRef.get('total_mandatory_document').clearValidators();
      segmentRef.get('total_mandatory_document').setErrors(null);
    } else if ($event.checked) {
      segmentRef.get('use_total_mandatory_documents').setValue(true);
      segmentRef.get('total_mandatory_document').setValidators([Validators.required, Validators.max(this.totalQuestionDocumentExpected)]);
    }
  }

  get selectedFieldTypeSet() {
    return this._selectedFieldTypeSet;
  }

  filterSelectedFieldOption() {
    let selectedFields = new Set();
    this.getSegmentFormarray().value.forEach((data) => {
      data?.questions.forEach((question) => {
        if (question.field_type) {
          // selectedFieldType.push(question.field_type);
          selectedFields.add(question.field_type);
        }
      });
    });
    this._selectedFieldTypeSet = selectedFields;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
