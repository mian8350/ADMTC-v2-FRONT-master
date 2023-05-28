import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'ms-form-fill-recursive-duration',
  templateUrl: './form-fill-recursive-duration.component.html',
  styleUrls: ['./form-fill-recursive-duration.component.scss']
})
export class FormFillRecursiveDurationComponent implements OnInit, OnDestroy {
  @Input() inputQuestion: UntypedFormGroup;
  @Input() stepForm: UntypedFormGroup;
  @Input() segmentIndex;
  @Input() questionIndex;
  @Input() pcoQuestionIndex;
  @Input() parentOptionText;
  @Input() isFormDisabled;
  @Input() isFieldRequired;
  
  constructor() { }

  ngOnInit() {
    if (this.isFieldRequired) {
      this.inputQuestion.get('answer').setValidators(Validators.required);
      this.inputQuestion.get('answer').updateValueAndValidity();
    }
  }

  validateDurationInput(event) {
    const sectioned = event.target.value.split(':');
    if (sectioned.length !== 3) {
      event.target.value = '00:00:00'; // fallback to default
      return;
    }
    if (sectioned.length === 3 && sectioned[1].length === 0) {
      event.target.value = '00:00:00'; // fallback to default
      return;
    }
    if (sectioned.length === 3 && sectioned[0].length === 0) {
      event.target.value = '00:00:00'; // fallback to default
      return;
    }
    if (isNaN(sectioned[0])) {
      sectioned[0] = '00';
    }
    for (let i = 1; i < sectioned.length; i++) {

      if (isNaN(sectioned[i]) || sectioned[i] < 0) {
        sectioned[i] = '00';
      }
      if (sectioned[i] > 59 || sectioned[i].length > 2) {
        sectioned[i] = '59';
      }
    }

    event.target.value = sectioned.join(':');

  }

  onKeyDownDuration(e: KeyboardEvent) {
    const navigationKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', ':'];
    if (navigationKeys.indexOf(e.key) > -1) {
      return;
    }
    if (e.key === ' ' || isNaN(Number(e.key))) {
      e.preventDefault();
    }
  }

  ngOnDestroy(): void {
    this.inputQuestion.get('answer').clearValidators();
    this.inputQuestion.get('answer').setErrors(null);
    this.inputQuestion.get('answer').updateValueAndValidity();
  }

}
