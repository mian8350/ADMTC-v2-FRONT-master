import { Component, OnInit, Inject } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { CriteriaEvaluationDialogComponent } from '../../../second-step-expertise/popup/criteria-evaluation-dialog/criteria-evaluation-dialog.component';
import { SpeechToTextDialogComponent } from 'app/shared/components/speech-to-text-dialog/speech-to-text-dialog.component';
import Swal from 'sweetalert2';
import { SubSink } from 'subsink';
import { TestCorrectionService } from 'app/service/test-correction/test-correction.service';

@Component({
  selector: 'ms-question-dialog',
  templateUrl: './question-dialog.component.html',
  styleUrls: ['./question-dialog.component.scss'],
})
export class QuestionDialogComponent implements OnInit {
  private subs = new SubSink();
  evaluationForm: UntypedFormGroup;

  public Editor = DecoupledEditor;
  responsableExist = false;
  public onReady(editor) {

    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }
  constructor(
    public dialogRef: MatDialogRef<CriteriaEvaluationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: UntypedFormBuilder,
    public dialog: MatDialog,
    private testCorrectionService: TestCorrectionService,
  ) {}

  ngOnInit() {
    this.initEvaForm(this.data);

  }

  initEvaForm(data: any) {
    const defaultData = data;
    this.evaluationForm = this.fb.group({
      _id: [defaultData && defaultData._id ? defaultData._id : null],
      name: [defaultData && defaultData.name ? defaultData.name : null, [Validators.required, removeSpaces]],
      criteria_of_evaluation_template_id: [
        defaultData && defaultData.criteria_of_evaluation_template_id ? defaultData.criteria_of_evaluation_template_id : null,
      ],
      block_of_template_competence_id: [
        defaultData && defaultData.block_of_template_competence_id ? defaultData.block_of_template_competence_id : null,
      ],
    });
  }

  save() {
    this.saveNewQuestion();
  }
  openVoiceRecog() {
    this.dialog
      .open(SpeechToTextDialogComponent, {
        width: '800px',
        minHeight: '300px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: '',
      })
      .afterClosed()
      .subscribe((resp) => {

        if (resp.trim()) {
          const voiceText = `${resp}`;
          const justification = this.evaluationForm.get('name').value;
          this.evaluationForm.get('name').setValue(justification ? justification + ' ' + voiceText : voiceText);
        }
      });
  }

  saveNewQuestion() {
    const payload = this.evaluationForm.value;
    if (payload && payload._id) {
      this.subs.sink = this.testCorrectionService
        .updateCriteriaOfEvaluationTemplateQuestion(
          payload._id,
          payload.criteria_of_evaluation_template_id,
          payload.name,
          payload.block_of_template_competence_id,
        )
        .subscribe((ressp) => {
          Swal.fire({
            type: 'success',
            title: 'Bravo!',
            allowOutsideClick: false,
          }).then((result) => {
            this.dialogRef.close('resp');
          });
        });
    } else {
      this.subs.sink = this.testCorrectionService
        .createCriteriaOfEvaluationTemplateQuestion(
          payload.criteria_of_evaluation_template_id,
          payload.name,
          payload.block_of_template_competence_id,
        )
        .subscribe((ressp) => {
          Swal.fire({
            type: 'success',
            title: 'Bravo!',
            allowOutsideClick: false,
          }).then((result) => {
            this.dialogRef.close('resp');
          });
        });
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }
}

interface dataInput {
  type: string;
  data: {
    _id: string;
    name: string;
    description?: string;
  };
}
