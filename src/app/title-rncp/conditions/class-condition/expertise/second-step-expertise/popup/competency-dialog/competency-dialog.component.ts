import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { removeSpaces } from 'app/service/customvalidator.validator';

@Component({
  selector: 'ms-competency-dialog',
  templateUrl: './competency-dialog.component.html',
  styleUrls: ['./competency-dialog.component.scss'],
})
export class CompetencyDialogComponent implements OnInit {
  competencyForm: UntypedFormGroup;

  public Editor = DecoupledEditor;
  responsableExist = false;
  public onReady(editor) {

    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }
  constructor(
    public dialogRef: MatDialogRef<CompetencyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: dataInput,
    private fb: UntypedFormBuilder,
  ) {}

  ngOnInit() {
    this.initCompetencyForm(this.data);
  }

  initCompetencyForm(data: dataInput) {
    const defaultData = data && data.data ? data.data : null;
    this.competencyForm = this.fb.group({
      _id: [defaultData && defaultData._id ? defaultData._id : null],
      name: [defaultData && defaultData.name ? defaultData.name : null, [Validators.required, removeSpaces]],
      short_name: [defaultData && defaultData.short_name ? defaultData.short_name : null, [removeSpaces]],
      description: [defaultData && defaultData.description ? defaultData.description : null, [removeSpaces]],
    });
  }

  save() {
    const payload = this.competencyForm.value;
    this.dialogRef.close(payload);
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
    short_name: string;
    description?: string;
  };
}
