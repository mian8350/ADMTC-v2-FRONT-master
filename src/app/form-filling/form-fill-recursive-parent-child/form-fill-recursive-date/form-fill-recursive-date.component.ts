import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { FormFillingService } from 'app/form-filling/form-filling.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import * as moment from 'moment';

@Component({
  selector: 'ms-form-fill-recursive-date',
  templateUrl: './form-fill-recursive-date.component.html',
  styleUrls: ['./form-fill-recursive-date.component.scss'],
  providers: [ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class FormFillRecursiveDateComponent implements OnInit, OnDestroy {
  @Input() inputQuestion;
  @Input() stepForm: UntypedFormGroup;
  @Input() segmentIndex;
  @Input() questionIndex;
  @Input() pcoQuestionIndex;
  @Input() parentOptionText;
  @Input() isFormDisabled;
  @Input() isFieldRequired;
  dateForm: UntypedFormGroup;

  constructor(
    private formFillingService: FormFillingService,
    private parseLocalToUtcPipe: ParseLocalToUtcPipe,
    private parseUtctoLocalPipe: ParseUtcToLocalPipe,
    private fb: UntypedFormBuilder,
  ) {}

  ngOnInit() {
    this.initDateForm();
    this.populateForm();
  }

  initDateForm() {
    this.dateForm = this.fb.group({
      answer_date: [''],
    });
  }

  populateForm() {
    if (this.isFieldRequired) {
      this.inputQuestion.get('answer_date').setValidators(Validators.required);
      this.inputQuestion.get('answer_date').updateValueAndValidity();
    }
    if (!this.inputQuestion.get('answer_date').get('date').value) return;
    this.dateForm
      .get('answer_date')
      .patchValue(this.transformStringToDateInstance(this.inputQuestion.get('answer_date').get('date').value));

  }

  transformStringToDateInstance(dateString: string) {
    return moment(this.parseUtctoLocalPipe.transformDate(dateString, '15:59'), 'DD/MM/YYYY').toDate();
  }

  updateQuestionAnswer(inputAnswer: any) {
    const utcDate = this.parseLocalToUtcPipe.transformDate(moment(inputAnswer.target.value).format('DD/MM/YYYY'), '15:59');

    this.inputQuestion.get('answer_date').get('date').patchValue(utcDate);
    this.inputQuestion.get('answer_date').get('time').patchValue('15:59');
    this.formFillingService.triggerFormFillChangeEvent(true);
  }

  ngOnDestroy(): void {
    this.inputQuestion.get('answer_date').clearValidators();
    this.inputQuestion.get('answer_date').setErrors(null);
    this.inputQuestion.get('answer_date').updateValueAndValidity();
  }
}
