import { TranslateService } from '@ngx-translate/core';
import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { removeSpaces } from 'app/service/customvalidator.validator';
import Swal from 'sweetalert2';
@Component({
  selector: 'ms-add-segment-form-builder-dialog',
  templateUrl: './add-segment-form-builder-dialog.component.html',
  styleUrls: ['./add-segment-form-builder-dialog.component.scss']
})
export class AddSegmentFormBuilderDialogComponent implements OnInit {


  addSegmentForm: UntypedFormGroup;

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<AddSegmentFormBuilderDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.initForm();

  }

  initForm() {
    this.addSegmentForm = this.fb.group({
      addSegment: ['', [Validators.required, removeSpaces]]
    })
  }

  submit() {
    // this.dialogRef.close(this.duplicateTemplateForm.value);

    if (this.addSegmentForm.invalid) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
      this.addSegmentForm.markAllAsTouched();
      return;
    }
    this.dialogRef.close(this.addSegmentForm.value);
  }

  closeDialog() {
    this.dialogRef.close();
  }

}
