import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-duplicate-form-builder-dialog',
  templateUrl: './duplicate-form-builder-dialog.component.html',
  styleUrls: ['./duplicate-form-builder-dialog.component.scss'],
})
export class DuplicateFormBuilderDialogComponent implements OnInit, OnDestroy {
  duplicateTemplateForm: UntypedFormGroup;
  private subs = new SubSink();
  isWaitingForResponse: boolean = false;

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<DuplicateFormBuilderDialogComponent>,
    private formBuilderService: FormBuilderService,
    private translate: TranslateService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) public parentData: any,
  ) {}

  ngOnInit() {
    this.initForm();

  }

  initForm() {
    this.duplicateTemplateForm = this.fb.group({
      form_builder_id: [this.parentData, Validators.required],
      form_builder_name: ['', [Validators.required, removeSpaces]],
    });
  }

  submit() {
    // this.dialogRef.close(this.duplicateTemplateForm.value);

    const payload = this.duplicateTemplateForm.getRawValue();
    this.isWaitingForResponse = true;
    this.subs.sink = this.formBuilderService.duplicateFormBuilder(payload.form_builder_id, payload.form_builder_name).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo !'),
            confirmButtonText: this.translate.instant('OK'),
          }).then(() => this.dialogRef.close(true));
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.swalError(err);
      },
    );
  }

  swalError(err) {

    if (err['message'] === 'GraphQL error: pre contract template name already exist') {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('UserForm_S3.TITLE'),
        text: this.translate.instant('UserForm_S3.TEXT'),
        confirmButtonText: this.translate.instant('UserForm_S3.BUTTON 1'),
      });
    } else {
      Swal.fire({
        type: 'error',
        title: 'Error',
        text: err && err['message'] ? err['message'] : err,
        confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
      });
    }
  }
  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
