import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormGroup, Validators } from '@angular/forms';
import { FormFillingService } from 'app/form-filling/form-filling.service';

@Component({
  selector: 'ms-form-fill-recursive-free-text',
  templateUrl: './form-fill-recursive-free-text.component.html',
  styleUrls: ['./form-fill-recursive-free-text.component.scss']
})
export class FormFillRecursiveFreeTextComponent implements OnInit, OnDestroy {
  @Input() inputQuestion: UntypedFormGroup;
  @Input() stepForm: UntypedFormGroup;
  @Input() segmentIndex;
  @Input() questionIndex;
  @Input() isFormDisabled;
  @Input() pcoQuestionIndex;
  @Input() parentOptionText;
  @Input() isFieldRequired;
  
  constructor(private formFillingService: FormFillingService) { }

  ngOnInit() {
    if (this.isFieldRequired) {
      this.inputQuestion.get('answer').setValidators(Validators.required);
      this.inputQuestion.get('answer').updateValueAndValidity();
    }
  }

  ngOnDestroy(): void {
    this.inputQuestion.get('answer').clearValidators();
    this.inputQuestion.get('answer').setErrors(null);
    this.inputQuestion.get('answer').updateValueAndValidity();
  }
}
