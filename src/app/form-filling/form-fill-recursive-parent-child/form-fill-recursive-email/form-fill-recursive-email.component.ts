import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormGroup, Validators } from '@angular/forms';
import { FormFillingService } from 'app/form-filling/form-filling.service';

@Component({
  selector: 'ms-form-fill-recursive-email',
  templateUrl: './form-fill-recursive-email.component.html',
  styleUrls: ['./form-fill-recursive-email.component.scss'],
})
export class FormFillRecursiveEmailComponent implements OnInit, OnDestroy {
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
    this.inputQuestion.get('answer').setValidators([Validators.email]);
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
