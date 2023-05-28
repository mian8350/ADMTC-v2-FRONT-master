import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { AbstractControl, UntypedFormArray, UntypedFormGroup, Validators } from '@angular/forms';
import { FormFillingService } from 'app/form-filling/form-filling.service';

@Component({
  selector: 'ms-form-fill-recursive-single-option',
  templateUrl: './form-fill-recursive-single-option.component.html',
  styleUrls: ['./form-fill-recursive-single-option.component.scss'],
})
export class FormFillRecursiveSingleOptionComponent implements OnInit, OnDestroy {
  @Input() inputQuestion: UntypedFormGroup;
  @Input() stepForm: UntypedFormGroup;
  @Input() segmentIndex;
  @Input() questionIndex;
  @Input() pcoQuestionIndex;
  @Input() parentOptionText;
  @Input() isFormDisabled;
  @Input() isFieldRequired;
  selectedOption;
  selectedOptionIndex: number;
  initialValue: any;

  constructor(private formFillingService: FormFillingService) {}

  ngOnInit() {

    this.initialValue = this.inputQuestion.get('parent_child_options').value;
    if (this.isFieldRequired) {
      this.inputQuestion.get('answer').setValidators(Validators.required);
      this.inputQuestion.get('answer').updateValueAndValidity();
    }
    this.setSelectedOption(this.inputQuestion.get('answer').value); // for populating the current answer
  }

  setSelectedOption(settedAnswer: string) {
    if (!settedAnswer || !this.inputQuestion.get('parent_child_options').value) return;
    this.selectedOptionIndex = this.inputQuestion
      .get('parent_child_options')
      .value.findIndex((option) => option.option_text === settedAnswer);
    this.selectedOption = (this.inputQuestion.get('parent_child_options') as UntypedFormArray).at(this.selectedOptionIndex);
  }

  updateQuestionAnswer(chosenOption: any) {
    this.resetAllOptionsObject();

    this.setSelectedOption(chosenOption.value);

    this.formFillingService.triggerFormFillChangeEvent(true);
  }

  resetAllOptionsObject() {
    this.inputQuestion.get('parent_child_options').reset(this.initialValue);
  }

  ngOnDestroy(): void {
    this.inputQuestion.get('answer').clearValidators();
    this.inputQuestion.get('answer').setErrors(null);
    this.inputQuestion.get('answer').updateValueAndValidity();
  }
}
