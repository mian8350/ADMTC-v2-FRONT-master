import { Component, OnInit, Input, OnChanges, OnDestroy } from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-final-comment',
  templateUrl: './final-comment.component.html',
  styleUrls: ['./final-comment.component.scss'],
})
export class FinalCommentComponent implements OnInit, OnDestroy {
  @Input() testCorrectionForm: UntypedFormGroup;
  private subs = new SubSink();

  constructor() {}

  ngOnInit() {}

  removeSpaces() {
    this.subs.sink = this.testCorrectionForm
      .get('correction_grid')
      .get('correction')
      .get('final_comment')
      .valueChanges.subscribe((resp) => {
        if (resp && !resp.replace(/\s/g, '').length) {
          this.testCorrectionForm.get('correction_grid').get('correction').get('final_comment').setValue('');
        }
      });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
