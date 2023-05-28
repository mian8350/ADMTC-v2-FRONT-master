import { Component, Input, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';

@Component({
  selector: 'ms-form-fill-recursive-parent-child',
  templateUrl: './form-fill-recursive-parent-child.component.html',
  styleUrls: ['./form-fill-recursive-parent-child.component.scss']
})
export class FormFillRecursiveParentChildComponent implements OnInit {
  @Input() stepForm;
  @Input() segmentIndex;
  @Input() questionIndex;
  @Input() inputOption;
  @Input() pcoOptionIndex;
  @Input() parentSelectedOption: string;
  @Input() isFormDisabled;
  @Input() isFieldRequired;

  constructor() { }

  ngOnInit() {

  }

}
