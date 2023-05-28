import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, FormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { ChildOptions } from 'app/questionnaire-tools/questionaire.model';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-step-parent-child-nesting',
  templateUrl: './step-parent-child-nesting.component.html',
  styleUrls: ['./step-parent-child-nesting.component.scss'],
})
export class StepParentChildNestingComponent implements OnInit, OnDestroy {
  _parentAnswerType: string;

  @Input('parent_child_options') parent_child_options: ChildOptions;
  @Input('optionIndex') optionIndex: number;
  @Input('segmentIndex') segmentIndex: number;
  @Input('questionIndex') questionIndex: number;
  @Input('formBuilderForm') formBuilderForm: UntypedFormGroup;
  @Input('question') question;
  @Input('isViewOnly') isViewOnly;
  @Input('isForPDF') isForPDF;
  @Input() set parentAnswerType(value: string) {
    this._parentAnswerType = value;
  }
  currentAnswerType: string[] = [];
  answerTypes: any[];
  editMode: boolean = false;

  get parentAnswerType() {
    return this._parentAnswerType;
  }

  optionTextForm: FormControl<String> = new FormControl(null, Validators.required);
  counter = 0;
  isNestingValid = true;
  questions: UntypedFormArray;
  parentChildValidation: boolean = true;
  private subs = new SubSink();

  constructor(private fb: UntypedFormBuilder, public formBuilderService: FormBuilderService, private translate: TranslateService) {}

  ngOnInit() {
    // this.questions = new FormArray(this.addQuestions());



    this.initParentFormBuilderListener();
    this.answerTypes = this.setAnswerTypes();
    this.setCurrentAnswerType();
    if (this.parent_child_options?.option_text) {
      this.optionTextForm.patchValue(this.parent_child_options?.option_text);
    }

    if (!this.parent_child_options?.option_text) {
      this.editMode = true;
    }
  }

  initParentFormBuilderListener() {
    this.subs.sink = this.formBuilderForm.valueChanges.subscribe((event) => {
      if (event) {
        this.checkNestingValid();
      }
    });
  }

  setAnswerTypes() {
    const typesIncluded = ['numeric', 'date', 'time', 'duration', 'short_text', 'long_text', 'single_option', 'email'];
    return this.formBuilderService.getQuestionnaireConst().questionAnswerTypes.filter((type) => typesIncluded.includes(type.key));
  }

  setCurrentAnswerType() {
    this.parent_child_options.questions.forEach((question, index) => {
      this.currentAnswerType[index] = question.answer_type;
    });
  }

  get existingChildOnEdit() {
    return this.formBuilderService.existingChildOnEdit;
  }

  // *************** Code Copied from V1

  checkNestingValid() {
    const formValue = { ...this.formBuilderForm.getRawValue() };
    const parentChildOptions = [].concat.apply(
      [],
      formValue.segments.map((segment) => segment.questions.map((question) => question.parent_child_options)),
    );
    this.formBuilderService.parentChildValidation = [].concat(...parentChildOptions).every((option) => this.validateParentChild(option));
  }

  validateParentChild(parent_child_option: any): boolean {
    if (!parent_child_option || !parent_child_option.option_text) return false;
    if (parent_child_option && parent_child_option.questions && parent_child_option.questions.length) {
      for (const question of parent_child_option.questions) {
        if (!question.question_name || !question.answer_type) {
          return false;
        }

        if (question && question.parent_child_options && question.parent_child_options.length) {
          return question.parent_child_options.every((option) => this.validateParentChild(option));
        }
      }
    }
    return true;
  }

  async removeOption(optionIndex) {
    const input = {
      answerName: this.question.parent_child_options[optionIndex].option_text,
    };
    const confirmation = await this.fireCountdownSwal('Form_S5', input, input);
    if (confirmation.value) {
      this.question.parent_child_options.splice(optionIndex, 1);
      this.formBuilderService.updateCurrentStepDetailForm(this.formBuilderForm.value);
      this.checkNestingValid();
    }
    if (this.editMode) {
      this.formBuilderService.existingChildOnEdit = false; // if on edit mode and user delete option, set global edit to false
    }
  }

  async removeQuestion(questionIndex) {
    const input = {
      questionName: this.parent_child_options.questions[questionIndex].question_name,
    };
    const confirmation = await this.fireCountdownSwal('Form_S4', input, input);
    if (confirmation.value) {
      this.parent_child_options.questions.splice(questionIndex, 1);
      this.currentAnswerType.splice(questionIndex, 1);
      this.formBuilderService.updateCurrentStepDetailForm(this.formBuilderForm.value);
      this.checkNestingValid();
    }
  }

  addQuestion() {
    this.parent_child_options.questions.push({
      question_type: 'parent_child',
      question_name: '',
      // '_id': [q ? q._id ? q._id : q.id ? q.id : '' : ''],
      is_field: false,
      is_answer_required: false,
      options: [],
      answer: '',
      questionnaire_field_key: '',
      sort_order: 1,
      parent_child_options: [],
      answer_multiple: [],
      answer_type: null,
    });
    this.currentAnswerType.push('');
    this.formBuilderService.updateCurrentStepDetailForm(this.formBuilderForm.value);
    this.checkNestingValid();
  }

  addOption(question, questionIndex) {
    if (question) {
      this.parent_child_options.questions[questionIndex].parent_child_options.push({ option_text: '', position: 1, questions: [] });
    } else {
      this.question.parent_child_options.push({ option_text: '', position: 1, questions: [] });
    }
    this.formBuilderService.updateCurrentStepDetailForm(this.formBuilderForm.value);
    this.formBuilderService.existingChildOnEdit = true;
    this.checkNestingValid();
  }

  updatequestion_name(questionIndex, name) {
    this.parent_child_options.questions[questionIndex].question_name = name.value;
    this.formBuilderService.updateCurrentStepDetailForm(this.formBuilderForm.value);
    this.checkNestingValid();
  }

  updateQuestionType(questionIndex, type) {
    this.parent_child_options.questions[questionIndex].question_type = 'parent_child';
    this.parent_child_options.questions[questionIndex].answer_type = type;
    this.currentAnswerType[questionIndex] = type;
    this.resetChildrenQuestions(questionIndex);
    if (type !== 'single_option') {
      this.parent_child_options.questions[questionIndex].parent_child_options.push({ option_text: '', position: 1, questions: [] });
    }
    this.formBuilderService.updateCurrentStepDetailForm(this.formBuilderForm.value);
    this.checkNestingValid();
  }

  resetChildrenQuestions(questionIndex) {
    this.parent_child_options.questions[questionIndex].parent_child_options = [];
  }

  onEdit() {
    if (this.parent_child_options?.option_text) {
      this.optionTextForm.patchValue(this.parent_child_options?.option_text);
    }
    this.editMode = true;
    this.formBuilderService.existingChildOnEdit = true;
  }

  onCancel() {
    if (this.optionTextForm.invalid || !this.parent_child_options?.option_text) {
      this.optionTextForm.markAsTouched();
      return;
    }
    this.formBuilderService.existingChildOnEdit = false;
    this.editMode = false;
  }

  updateOptionName() {
    if (this.optionTextForm.invalid) {
      this.optionTextForm.markAsTouched();
      return;
    }
    this.parent_child_options.option_text = this.optionTextForm.value;
    this.formBuilderService.updateCurrentStepDetailForm(this.formBuilderForm.value);
    this.checkNestingValid();
    this.formBuilderService.existingChildOnEdit = false;
    this.editMode = false;
  }

  async fireCountdownSwal(localizationRef: string, titleInput: any, textInput: any) {
    const titleHasFalsyProperty = Object.values(titleInput).some((value) => !value);
    const textHasFalsyProperty = Object.values(textInput).some((value) => !value);

    if (titleHasFalsyProperty && textHasFalsyProperty) return Promise.resolve({ value: 'ok' });

    let timeout = 2;
    let confirmInterval;
    return await Swal.fire({
      type: 'warning',
      title: this.translate.instant(`${localizationRef}.TITLE`, titleInput),
      html: this.translate.instant(`${localizationRef}.TEXT`, textInput),
      confirmButtonText: this.translate.instant(`${localizationRef}.BUTTON_1`) + ` (${timeout})`,
      cancelButtonText: this.translate.instant(`${localizationRef}.BUTTON_2`),
      showCancelButton: true,
      onOpen: () => {
        timeout--;
        Swal.disableConfirmButton();
        const confirmButtonRef = Swal.getConfirmButton();
        confirmInterval = setInterval(() => {
          if (timeout > 0) {
            (confirmButtonRef.innerText = this.translate.instant(`${localizationRef}.BUTTON_1`) + ` (${timeout})`), timeout--;
          } else {
            Swal.enableConfirmButton();
            confirmButtonRef.innerText = this.translate.instant(`${localizationRef}.BUTTON_1`);
            clearInterval(confirmInterval);
          }
        }, 1000);
      },
    });
  }

  dropPCOption(event: CdkDragDrop<any[]>, segmentIndex: number, questionIndex: number) {
    if (event?.previousContainer === event?.container) {
      moveItemInArray(event?.container?.data, event?.previousIndex, event?.currentIndex);
      ((this.formBuilderForm?.get('segments') as UntypedFormArray)?.at(segmentIndex)?.get('questions') as UntypedFormArray)
        ?.at(questionIndex)
        ?.get('parent_child_options')
        ?.updateValueAndValidity({ onlySelf: false });
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
