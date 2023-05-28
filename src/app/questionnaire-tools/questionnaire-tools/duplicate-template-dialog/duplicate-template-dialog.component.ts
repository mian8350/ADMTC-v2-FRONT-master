import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormGroup, Validators } from '@angular/forms';
import { UntypedFormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { QuetionaireService } from 'app/questionnaire-tools/quetionaire.service';
import { removeSpaces } from 'app/service/customvalidator.validator';

@Component({
  selector: 'ms-duplicate-template-dialog',
  templateUrl: './duplicate-template-dialog.component.html',
  styleUrls: ['./duplicate-template-dialog.component.scss']
})
export class DuplicateTemplateDialogComponent implements OnInit {
  duplicateTemplateForm: UntypedFormGroup;

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<DuplicateTemplateDialogComponent>,
    private questService: QuetionaireService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit() {
    this.initForm();

  }

  initForm() {
    this.duplicateTemplateForm = this.fb.group({
      ques_id: [this.data._id, Validators.required],
      ques_name: ['', [Validators.required, removeSpaces]]
    })
  }

  submit() {
    // this.dialogRef.close(this.duplicateTemplateForm.value);

    this.questService.duplicateQuestionnaireTemplate(this.duplicateTemplateForm.value).subscribe(resp => {

      this.dialogRef.close(resp);
    })
  }

  closeDialog() {
    this.dialogRef.close();
  }

}
