import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { Correction } from 'app/test/test-creation/test-creation.model';
import { MatCheckboxChange } from '@angular/material/checkbox';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-elimination',
  templateUrl: './elimination.component.html',
  styleUrls: ['./elimination.component.scss']
})
export class EliminationComponent implements OnInit {
  @Input() testCorrectionForm: UntypedFormGroup;
  @Output() calculateFinalMark = new EventEmitter<boolean>();

  constructor(
    private translate: TranslateService
  ) { }

  ngOnInit() {
  }

  getCorrectionForm() {
    return this.testCorrectionForm.get('correction_grid').get('correction') as UntypedFormGroup;
  }

  eliminateStudent(event: MatCheckboxChange) {
    if (event.checked) {
      Swal.fire({
        title: this.translate.instant('TESTCORRECTIONS.MESSAGE.ELIMINATION-WARNING-TITLE'),
        html: this.translate.instant('TESTCORRECTIONS.MESSAGE.ELIMINATION-WARNING-TEXT'),
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: this.translate.instant('TESTCORRECTIONS.MESSAGE.ELIMINATION-WARNING-CONFIRM'),
        cancelButtonText: this.translate.instant('TESTCORRECTIONS.MESSAGE.ELIMINATION-WARNING-CANCLE')
      }).then(result => {
        if (result.value) {
          this.getCorrectionForm().get('total').setValue(0);
          this.getCorrectionForm().get('additional_total').setValue(0);
        } else {
          this.getCorrectionForm().get('elimination').setValue(false);
        }
      })
    } else {
      // if uncheck elimination, calculate total and additional total
      this.calculateFinalMark.emit(true);
    }
  }
}
