import { Component, OnInit, Inject } from '@angular/core';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js'
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'ms-ckeditor-input-dialog',
  templateUrl: './ckeditor-input-dialog.component.html',
  styleUrls: ['./ckeditor-input-dialog.component.scss']
})
export class CkeditorInputDialogComponent implements OnInit {

  textInputControl = new UntypedFormControl('');

  // ckeditor configuration
  public Editor = DecoupledEditor;
  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(
      editor.ui.view.toolbar.element,
      editor.ui.getEditableElement()
    );
  }

  constructor(
    public dialogRef: MatDialogRef<CkeditorInputDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: string
  ) { }

  ngOnInit() {
    if (this.parentData) {
      this.textInputControl.setValue(this.parentData);
    }
  }

  closeDialog() {
    this.dialogRef.close(false);
  }

  submit() {
    this.dialogRef.close(this.textInputControl.value);
  }

}
