import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { TestCreationRespData } from 'app/test/test-creation/test-creation.model';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-free-control-form',
  templateUrl: './free-control-form.component.html',
  styleUrls: ['./free-control-form.component.scss']
})
export class FreeControlFormComponent implements OnInit {
  private subs = new SubSink();
  @Input() testCorrectionForm: UntypedFormGroup;
  @Input() testData: TestCreationRespData;

  constructor() { }

  ngOnInit() {
  }

  validateAdditionalTotal() {
    const additionalTotal = +this.getCorrectionForm().get('additional_total').value;
    if (!additionalTotal) {
      this.getCorrectionForm().get('additional_total').setValue(0);
    } else if (additionalTotal > 20) {
      this.getCorrectionForm().get('additional_total').setValue(20);
    } else if (additionalTotal < 0) {
      this.getCorrectionForm().get('additional_total').setValue(0);
    } else if (additionalTotal % 1 !== 0) {
      // if decimal value, limit only 2 number behind comma
      this.getCorrectionForm().get('additional_total').setValue(additionalTotal.toFixed(2));
      this.getCorrectionForm().get('total').setValue(additionalTotal.toFixed(2));
    }

  }

  getCorrectionForm() {
    return this.testCorrectionForm.get('correction_grid').get('correction') as UntypedFormGroup;
  }

}
