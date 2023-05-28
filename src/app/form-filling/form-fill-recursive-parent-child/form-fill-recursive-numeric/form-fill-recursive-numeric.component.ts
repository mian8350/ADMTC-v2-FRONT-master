import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormGroup, Validators } from '@angular/forms';
import { FormFillingService } from 'app/form-filling/form-filling.service';

@Component({
  selector: 'ms-form-fill-recursive-numeric',
  templateUrl: './form-fill-recursive-numeric.component.html',
  styleUrls: ['./form-fill-recursive-numeric.component.scss'],
})
export class FormFillRecursiveNumericComponent implements OnInit, OnDestroy {
  @Input() inputQuestion: UntypedFormGroup;
  @Input() stepForm: UntypedFormGroup;
  @Input() segmentIndex;
  @Input() questionIndex;
  @Input() pcoQuestionIndex;
  @Input() parentOptionText;
  @Input() isFormDisabled;
  @Input() isFieldRequired;

  constructor(private formFillingService: FormFillingService) {}

  ngOnInit() {
    if (this.isFieldRequired) {
      this.inputQuestion.get('answer_number').setValidators(Validators.required);
      this.inputQuestion.get('answer_number').updateValueAndValidity();
    }
  }

  preventNonNumericalInput(event) {
    if (event && event.key) {
      if (!event.key.match(/^[0-9]+$/)) {
        event.preventDefault();
      }
    }
  }

  ngOnDestroy(): void {
    this.inputQuestion.get('answer_number').clearValidators();
    this.inputQuestion.get('answer_number').setErrors(null);
    this.inputQuestion.get('answer_number').updateValueAndValidity();
  }
}
