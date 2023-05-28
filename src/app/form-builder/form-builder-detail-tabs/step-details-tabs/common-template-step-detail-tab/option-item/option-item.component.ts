import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { FormControl, FormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-option-item',
  templateUrl: './option-item.component.html',
  styleUrls: ['./option-item.component.scss']
})
export class OptionItemComponent implements OnInit {

  public editMode: boolean = false;
  updatedText: UntypedFormControl = new FormControl(null, Validators.required);
  _option: FormGroup;

  // Inputs
  @Input() set optionFormGroup(optionValue: FormGroup) {
    this._option = optionValue;
    this.updatedText.patchValue(optionValue.value.option_name || '');
  };
  @Input() optionIndex: number;
  @Input() isPublished: boolean;
  @Input() isFinalStep: boolean;
  @Input() filter
  @Input() questionField: UntypedFormControl;
  @Input() filteredConditionalStepsDropdown: any[];

  // Outputs
  @Output() removeOptionEvent = new EventEmitter<string>();
  @Output() nextStepTypeEvent = new EventEmitter<any>();
  @Output() selectNextStepAtEvent = new EventEmitter<any>();
  @Output() updateOptionEvent = new EventEmitter<any>();

  get option() {
    return this._option;
  }


  constructor(private translate: TranslateService) { }

  ngOnInit(): void {
  }

  onUpdateOptionTextEvent() {
    if (this.updatedText.invalid) {
      this.updatedText.markAsTouched();
      return;
    }
    this.updateOptionEvent.emit(this.updatedText.value);
    this.editMode = false;
  }

  onRemoveOptionEvent() {
    this.removeOptionEvent.emit();
  }

  onNextStepType(event) {
    this.nextStepTypeEvent.emit(event);
  }

  onSelectNextStepAt(optionIndex: number, questionField: UntypedFormControl, optionType: string) {
    this.selectNextStepAtEvent.emit({optionIndex, questionField, optionType});
  }

  displayNextStepWithFn(value) {
    if (value === 'Continue Next Step' || value === 'Go To Final Step' || value === 'Complete the form' ) {
      return this.translate.instant(value);
    } else {
      return value;
    }
  }

}
