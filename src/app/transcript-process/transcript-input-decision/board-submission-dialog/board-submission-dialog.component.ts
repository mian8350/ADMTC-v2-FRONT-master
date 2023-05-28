import { Component, OnInit, Inject, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { UserTableData } from 'app/users/user.model';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-board-submission-dialog',
  templateUrl: './board-submission-dialog.component.html',
  styleUrls: ['./board-submission-dialog.component.scss'],
})
export class BoardSubmissionDialogComponent implements OnInit, OnDestroy {
  boardSubmissionForm: UntypedFormGroup;
  private subs = new SubSink();
  decisionList = [];
  templateList = [];
  isWaitingForResponse = false;

  constructor(
    public dialogRef: MatDialogRef<BoardSubmissionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: UserTableData,
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.initForm();
    const list = [
      {
        label: this.translate.instant('ALLL'),
        value: 'all',
      },
      {
        label: this.translate.instant('No Decision'),
        value: 'initial',
      },
      {
        label: this.translate.instant('pass'),
        value: 'pass',
      },
      {
        label: this.translate.instant('fail'),
        value: 'fail',
      },
      {
        label: this.translate.instant('retake'),
        value: 'retake',
      },
    ];
    const listTemplate = [
      {
        label: this.translate.instant('IMPORT_DECISION_S1.COMMA'),
        value: ',',
      },
      {
        label: this.translate.instant('IMPORT_DECISION_S1.SEMICOLON'),
        value: ';',
      },
      {
        label: this.translate.instant('IMPORT_DECISION_S1.TAB'),
        value: 'tab',
      },
    ];
    this.decisionList = list;
    this.templateList = listTemplate;
  }

  initForm() {
    this.boardSubmissionForm = this.fb.group({
      decision_type: [null, Validators.required],
      file_type: [null, Validators.required],
    });
  }

  decisionType(type) {
    const decision = this.boardSubmissionForm.get('decision_type').value;
    if (decision.includes('all')) {
      const data = ['initial', 'pass', 'fail', 'retake']
      this.boardSubmissionForm.get('decision_type').patchValue(data);
    }
  }

  submitCsv() {
    const payload = this.boardSubmissionForm.value;

    this.dialogRef.close(payload);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
