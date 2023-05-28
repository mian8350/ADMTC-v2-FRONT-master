import { Component, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js'
import { removeSpaces } from 'app/service/customvalidator.validator';

@Component({
  selector: 'ms-add-block-condition-dialog',
  templateUrl: './add-block-condition-dialog.component.html',
  styleUrls: ['./add-block-condition-dialog.component.scss']
})
export class AddBlockConditionDialogComponent implements OnInit {
  blockForm: UntypedFormGroup;

  public Editor = DecoupledEditor;
  responsableExist = false;
  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  constructor(
    public dialogRef: MatDialogRef<AddBlockConditionDialogComponent>,
    private fb: UntypedFormBuilder,
  ) { }

  ngOnInit() {
    this.initBlockForm();
  }

  initBlockForm() {
    this.blockForm = this.fb.group({
      name:  [null, [Validators.required, removeSpaces]]
    })
  }

  save() {
    const payload = this.blockForm.value;
    this.dialogRef.close(payload);
  }

  closeDialog() {
    this.dialogRef.close();
  }
}

