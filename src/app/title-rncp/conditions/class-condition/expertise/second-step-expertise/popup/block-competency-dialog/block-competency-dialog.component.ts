import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { removeSpaces } from 'app/service/customvalidator.validator';

@Component({
  selector: 'ms-block-competency-dialog',
  templateUrl: './block-competency-dialog.component.html',
  styleUrls: ['./block-competency-dialog.component.scss'],
})
export class BlockCompetencyDialogComponent implements OnInit {
  blockForm: UntypedFormGroup;

  public Editor = DecoupledEditor;
  responsableExist = false;
  public onReady(editor) {

    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }
  constructor(
    public dialogRef: MatDialogRef<BlockCompetencyDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: dataInput,
    private fb: UntypedFormBuilder,
  ) {}

  ngOnInit() {
    this.initBlockForm(this.data);
  }

  initBlockForm(data: dataInput) {
    const defaultData = data && data.data ? data.data : null;
    this.blockForm = this.fb.group({
      _id: [defaultData && defaultData._id ? defaultData._id : null],
      name: [defaultData && defaultData.name ? defaultData.name : null, [Validators.required, removeSpaces]],
      description: [defaultData && defaultData.description ? defaultData.description : null, [removeSpaces]],
      note: [defaultData && defaultData.note ? defaultData.note : null, [removeSpaces]],
      // block_rncp_reference: [defaultData && defaultData.block_rncp_reference ? defaultData.block_rncp_reference : null, [removeSpaces]]
    });
  }

  save() {
    const payload = this.blockForm.value;
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
    description?: string;
    note?: string;
    block_rncp_reference?: string;
  };
}
