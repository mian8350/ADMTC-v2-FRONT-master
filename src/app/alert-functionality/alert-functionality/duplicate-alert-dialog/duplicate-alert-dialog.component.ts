import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { QuetionaireService } from 'app/questionnaire-tools/quetionaire.service';
import { removeSpaces } from 'app/service/customvalidator.validator';

@Component({
  selector: 'ms-duplicate-alert-dialog',
  templateUrl: './duplicate-alert-dialog.component.html',
  styleUrls: ['./duplicate-alert-dialog.component.scss'],
})
export class DuplicateAlertDialogComponent implements OnInit {
  // duplicateAlert: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<DuplicateAlertDialogComponent>, // private fb: FormBuilder,
  ) // private questService: QuetionaireService,
  // @Inject(MAT_DIALOG_DATA) public data: any,
  {}

  ngOnInit() {
    // this.initForm();

  }

  // initForm() {
  //   this.duplicateAlert = this.fb.group({
  //     ques_id: [this.data._id, Validators.required],
  //     ques_name: ['', [Validators.required, removeSpaces]]
  //   })
  // }

  submit() {

    // this.questService.duplicateQuestionnaireTemplate(this.duplicateAlert).subscribe(resp => {

    //   this.dialogRef.close(resp)
    // })
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
