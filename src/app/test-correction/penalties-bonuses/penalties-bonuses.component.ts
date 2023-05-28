import { Component, OnInit, Input, OnDestroy, Output, EventEmitter } from '@angular/core';
import { FormBuilder, UntypedFormGroup, Validators, UntypedFormArray } from '@angular/forms';
import { Correction } from 'app/test/test-creation/test-creation.model';
import { SubSink } from 'subsink';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'ms-penalties-bonuses',
  templateUrl: './penalties-bonuses.component.html',
  styleUrls: ['./penalties-bonuses.component.scss'],
})
export class PenaltiesBonusesComponent implements OnInit, OnDestroy {
  private subs = new SubSink();

  @Input() testCorrectionForm: UntypedFormGroup;
  @Input() correctionData: Correction;
  @Output() calculateFinalMark = new EventEmitter<boolean>();

  constructor() {}

  ngOnInit() {
  }

  getCorrectionForm() {
    return this.testCorrectionForm.get('correction_grid').get('correction') as UntypedFormGroup;
  }

  getPenaltiesFieldForm() {
    return this.getCorrectionForm().get('penalties') as UntypedFormArray;
  }

  getBonusesFieldForm() {
    return this.getCorrectionForm().get('bonuses') as UntypedFormArray;
  }

  validateNumericBonusPenalty(field: UntypedFormGroup, index: number, type: string) {
    field.get('rating').valueChanges.pipe(debounceTime(400)).subscribe(rating => {
      let maxRating = 0;
      const decimal =  /^[-+]?[0-9]+\.[0-9]+$/;
      if (type === 'penalties' && this.correctionData && this.correctionData.penalties && this.correctionData.penalties.length) {
        maxRating = this.correctionData.penalties[index].count;
      }
      if (type === 'bonuses' && this.correctionData && this.correctionData.bonuses && this.correctionData.bonuses.length) {
        maxRating = this.correctionData.bonuses[index].count;
      }
      if (rating && rating > 0 && rating.toString().match(decimal) && rating.toString().length > 5) {
        field.get('rating').setValue(Number(rating).toFixed(2));
      } else if (rating < 0) {
        field.get('rating').setValue(0);
      } else if (rating > maxRating) {
        field.get('rating').setValue(maxRating);
      } else {
        field.get('rating').setValue(rating);
      }
      this.calculateFinalMark.emit(true);
    })
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
