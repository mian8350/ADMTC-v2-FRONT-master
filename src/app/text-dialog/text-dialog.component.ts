import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormBuilder } from '@angular/forms';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js'

@Component({
  selector: 'ms-text-dialog',
  templateUrl: './text-dialog.component.html',
  styleUrls: ['./text-dialog.component.scss']
})
export class TextDialogComponent implements OnInit {

  editorForm: UntypedFormGroup;
  config;

  // ckeditor configuration
  public Editor = DecoupledEditor;
  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(
      editor.ui.view.toolbar.element,
      editor.ui.getEditableElement()
    );
  }

  constructor(
    public dialogRef: MatDialogRef <TextDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { textInput: string; type: string; },
    private fb: UntypedFormBuilder
  ) { }

  ngOnInit() {
    this.initiateTextForm();
    this.setFormData();
  }

  initiateTextForm() {
    this.editorForm = this.fb.group({
      textInput: ['']
    })
  }

  setFormData() {
    this.editorForm.get('textInput').patchValue(this.data.textInput);
  }

  submit() {
    this.dialogRef.close(this.editorForm.get('textInput').value);
  }

  closeDialog() {
    this.dialogRef.close();
  }

}
