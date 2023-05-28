import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { SubSink } from 'subsink';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { AddSegmentFormBuilderDialogComponent } from './add-segment-form-builder-dialog/add-segment-form-builder-dialog.component';
import { map, startWith } from 'rxjs/operators';
import { UtilityService } from 'app/service/utility/utility.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import * as _ from 'lodash';

@Component({
  selector: 'ms-common-template-step-detail',
  templateUrl: './common-template-step-detail.component.html',
  styleUrls: ['./common-template-step-detail.component.scss'],
})
export class CommonTemplateStepDetailComponent implements OnInit, OnDestroy {
  @Input() templateId;
  @Input() stepId;
  @Input() stepIndex: number;
  @Input() isPublished: boolean;
  @Input() finalValidation: boolean;
  @Input() takenUniqueStep: string[];
  @Output() updateTabs = new EventEmitter();
  @ViewChildren('blockPanel') blockPanel: QueryList<ElementRef>;
  @ViewChildren('questionPanel') questionPanel: QueryList<ElementRef>;
  @ViewChild('fileUploadDoc', { static: false }) fileUploaderDoc: ElementRef;
  templateStepForm: UntypedFormGroup;
  initialStepForm;
  private subs = new SubSink();
  isWaitingForResponse = false;
  currentStepIndex = 0;
  questionnaire: any;

  stepTypeList;
  validatorList: { _id: string; name: string }[];

  questionnaireConsts;
  docListType;
  selectedDocType;
  listUploadDocumentPDF: any;

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
    // this.initSegmentForm();
    this.initSegmentListener(); // on changes, reflect to preview

  }

  populateStepData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.formBuilderService.getOneFormBuilderStep(this.stepId).subscribe((step) => {
      this.isWaitingForResponse = false;

      if (step) {
        if (step.validator && step.validator._id) {
          step.validator = step.validator._id;
        }
        if (step.segments.length) {
          if (step.segments[0].document_for_condition) {
            this.selectedDocType = step.segments[0].document_for_condition;
          }
          if (step.segments[0].acceptance_pdf) {
            this.listUploadDocumentPDF = step.segments[0].acceptance_pdf;
          }
        }
        if (step.segments && step.segments.length) {
          step.segments.forEach((segment, segmentIndex) => {
            this.addSegmentForm();
            if (segment && segment.questions && segment.questions.length) {
              segment.questions.forEach((question, questionIndex) => {
                this.addQuestionFieldForm(segmentIndex);
              });
            }
          });
        }
        if (step.step_type && this.takenUniqueStep.includes(step.step_type) && !this.stepTypeList.includes(step.step_type)) {
          // readds the unique type to the dropdown if the one taking the unique step is this current step
          // needs to readds to allow for translation and re-selection of the same step
          this.stepTypeList.push(step.step_type);
        }
        this.templateStepForm.patchValue(step);
        this.formBuilderService.setStepData(step);
        this.initialStepForm = this.templateStepForm.getRawValue();
        if (this.isPublished) {
          this.templateStepForm.disable();
          this.getSegmentFormarray().disable();
          if (this.getQuestionsFormarray.length) {
            this.getQuestionsFormarray().disable();
          }
        }
      }
    });
  }

  getDropdown() {
    this.stepTypeList = this.formBuilderService.getStepTypeList().filter((type) => !this.takenUniqueStep.includes(type));
    this.getUserTypeList();
    this.questionnaireConsts = this.formBuilderService.getQuestionnaireConst();
    this.docListType = this.formBuilderService.getConditionDocTypeList();

  }

  initTemplateStepForm() {
    this.templateStepForm = this.fb.group({
      _id: [null],
      step_title: ['', [Validators.required, removeSpaces]],
      is_validation_required: [false],
      step_type: [null, [Validators.required]],
      validator: [null],
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
      options: [[]],
      question_label: [''],
      answer_type: [
        this.templateStepForm &&
        this.templateStepForm.get('step_type').value &&
        this.templateStepForm.get('step_type').value === 'document_expected'
          ? 'document_pdf_upload'
          : null,
      ],
    });
  }

  getUserTypeList() {
    this.subs.sink = this.formBuilderService.getUserTypesForValidator().subscribe((resp) => {
      let tempData = resp;
      this.validatorList = tempData;
    });
  }

  initSegmentListener() {
    // listen to changes in template step form to pass data to preview
    this.subs.sink = this.templateStepForm.valueChanges.subscribe((formData) => {
      this.formBuilderService.setStepData(this.templateStepForm.value);
    });
  }

  getSegmentFormarray(): UntypedFormArray {
    return this.templateStepForm.get('segments') as UntypedFormArray;
  }

  getQuestionsFormarray(): UntypedFormArray {
    return this.getSegmentFormarray().get('questions') as UntypedFormArray;
  }

  onChangeValidationRequirement(option) {

    if (option && !option.checked) {
      this.templateStepForm.get('validator').patchValue(null);
      this.templateStepForm.get('validator').clearValidators(); // have to clear validators due to late detection of [required]
      this.templateStepForm.get('validator').setErrors(null); // have to set error to null due to asynchronous issue with the toggle and late [required] detection
    }
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
          }
          setTimeout(() => {
            if (this.blockPanel && this.blockPanel.last && this.blockPanel.length) {


              this.blockPanel.toArray()[this.blockPanel.length - 1].nativeElement.scrollIntoView({ behavior: 'smooth' });
            }
          }, 500);

        });
    } else {
      this.getSegmentFormarray().push(this.initSegmentForm());
    }
  }

  removeSegmentForm(segmentIndex) {
    this.getSegmentFormarray().removeAt(segmentIndex);
  }

  getQuestionFieldFormArray(segmentIndex): UntypedFormArray {
    return this.getSegmentFormarray().at(segmentIndex).get('questions') as UntypedFormArray;
  }

  addQuestionFieldForm(segmentIndex) {
    this.getQuestionFieldFormArray(segmentIndex).push(this.initQuestionFieldForm());
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
  }

  checkIsParentChild(question) {
    if (question && question.answer_type === 'parent_child') {
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

  addMoreAnswers(segmentIndex, questionIndex) {
    const optionValue = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('answer').value;

    if (optionValue) {
      const childOptions = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('parent_child_options').value;
      const optionPosition = childOptions.length;

      childOptions.push({
        option_text: optionValue,
        position: optionPosition,
        questions: [],
      });

      this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('answer').patchValue('');
      this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('parent_child_options').patchValue(childOptions);


    }
  }

  addMoreOptions(segmentIndex, questionIndex, optionText) {
    // const optionValue = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('answer').value;

    const options = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('options').value;
    options.push(optionText.value);
    this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('options').patchValue(options);

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

        let options = this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('options').value;
        options = options.splice(optionIndex, 1);
        // this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('options').patchValue(options);

        Swal.fire({
          title: 'Deleted!',
          text: this.translate.instant('MENTOREVALUATION.QUESTIONNAIRE.Messages.deletedOptionSuccess'),
          allowEscapeKey: true,
          type: 'success',
        });
      }
    });
  }

  updateFieldToggle(event: MatSlideToggleChange, segmentIndex: number, questionIndex: number) {
    if (event.checked) {
      this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('is_editable').patchValue(false);
    } else {
      this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('field_type').patchValue(null); // make field type to null if is_field is turned off
      this.getQuestionFieldFormArray(segmentIndex).at(questionIndex).get('is_editable').patchValue(true);
    }
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

  cleanNullValues(obj) {
    return Object.keys(obj).forEach((key) => {
      if (obj[key] && typeof obj[key] === 'object') {
        this.cleanNullValues(obj[key]);
      } else if (obj[key] === null) {
        delete obj[key];
      }
    });
  }

  saveStepData() {
    this.isWaitingForResponse = true;
    const payload = this.templateStepForm.getRawValue();
    this.cleanNullValues(payload);

    this.subs.sink = this.formBuilderService.createUpdateFormBuilderStep(payload).subscribe(
      (resp) => {
        if (resp) {
          this.isWaitingForResponse = false;
          this.initialStepForm = this.templateStepForm.getRawValue();
          this.initTemplateStepForm();
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
        }
      },
    );
  }

  isFormChanged() {
    const initialStepForm = JSON.stringify(this.initialStepForm);
    const currentForm = JSON.stringify(this.templateStepForm.getRawValue());
    if (initialStepForm === currentForm) {
      this.formBuilderService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.formBuilderService.childrenFormValidationStatus = false;
      return false;
    }
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

  handleStepCondition() {
    // *************** We are deleting the segment first before changing steps
    const segmentData = this.getSegmentFormarray().value;
    if (segmentData && segmentData.length) {
      segmentData.forEach((segment, segmentIndex) => {
        // *************** cannot use segment index as removeAt parameter, since we remove from 0 to n.
        // But segment in formarray is already deleted in 0, so all form index is reduced by 1.
        // Thats why its better to always delete the zero index then doing that with same amount of time with segment length
        this.getSegmentFormarray().removeAt(0);
      });
    }

    if (
      this.templateStepForm.get('step_type').value === 'condition_acceptance' ||
      this.templateStepForm.get('step_type').value === 'document_expected'
    ) {
      this.addSegmentForm();
    }
  }

  handleDocumentSelected(value, index) {

    this.deletePDF(); // clean data of previous uploaded doc if any

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

  chooseFile(fileInput: Event, index) {
    const acceptable = ['pdf'];
    const file = (<HTMLInputElement>fileInput.target).files[0];
    const fileType = this.utilService.getFileExtension(file.name).toLocaleLowerCase();
    if (acceptable.includes(fileType)) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe(
        (resp) => {

          this.isWaitingForResponse = false;
          if (resp) {
            this.listUploadDocumentPDF = '';
            this.getSegmentFormarray().at(index).get('acceptance_pdf').patchValue(resp.s3_file_name);

            this.listUploadDocumentPDF = resp.s3_file_name;
            this.fileUploaderDoc.nativeElement = '';
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

  deletePDF() {
    this.listUploadDocumentPDF = '';
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
