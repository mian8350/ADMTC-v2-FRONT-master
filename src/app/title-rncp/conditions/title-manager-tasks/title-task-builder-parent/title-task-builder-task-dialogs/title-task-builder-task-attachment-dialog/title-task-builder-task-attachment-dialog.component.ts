import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-title-task-builder-task-attachment-dialog',
  templateUrl: './title-task-builder-task-attachment-dialog.component.html',
  styleUrls: ['./title-task-builder-task-attachment-dialog.component.scss'],
})
export class TitleTaskBuilderTaskAttachmentDialogComponent implements OnInit, OnDestroy {
  documentNameFormControl: UntypedFormControl;
  attachmentFilesFormArray: UntypedFormArray;
  isUploadingFile: boolean = false;

  private subs: SubSink = new SubSink();

  constructor(
    @Inject(MAT_DIALOG_DATA) public parentData: any,
    private dialogRef: MatDialogRef<TitleTaskBuilderTaskAttachmentDialogComponent>,
    private dialog: MatDialog,
    private fb: UntypedFormBuilder,
    private fileUpServ: FileUploadService,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.initForms();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  closeDialog() {
    this.dialogRef.close();
  }

  initForms() {
    this.documentNameFormControl = this.fb.control(null);
    this.attachmentFilesFormArray = this.fb.array([]);
  }

  createFileFormGroup(): UntypedFormGroup {
    return this.fb.group({
      file_name: [null, [Validators.required]],
      s3_file_name: [null, [Validators.required]],
    });
  }

  onEnter() {
    if (this.attachmentFilesFormArray.value) {
      const payload = {
        attachments: this.attachmentFilesFormArray.value,
      };
      this.dialogRef.close(payload);
    }
  }

  onFileInput($event) {

    const [file] = $event.target.files;
    this.isUploadingFile = true;
    this.subs.sink = this.fileUpServ.singleUpload(file, this.documentNameFormControl.value).subscribe(
      (response) => {
        this.isUploadingFile = false;
        const newFileFormGroup = this.createFileFormGroup();
        newFileFormGroup.patchValue({
          file_name: this.documentNameFormControl.value,
          s3_file_name: response.s3_file_name,
        });
        this.attachmentFilesFormArray.push(newFileFormGroup);
        this.documentNameFormControl.setValue('');
        this.documentNameFormControl.markAsPristine();
        this.documentNameFormControl.markAsUntouched();
      },
      (error) => {
        this.isUploadingFile = false;
        console.error(error);
      },
    );
  }

  onDeleteFileAt(idx: number) {
    const attachmentName = this.attachmentFilesFormArray.at(idx).get('file_name').value;
    let timeout = 5;
    let confirmInterval;

    Swal.fire({
      type: 'warning',
      title: this.translate.instant('DELETE_ATTACHMENT_S1.TITLE'),
      html: this.translate.instant('DELETE_ATTACHMENT_S1.HTML_TEXT', { attachmentName }),
      footer: `<span style="margin-left: auto">DELETE_ATTACHMENT_S1</span>`,
      confirmButtonText: this.translate.instant('DELETE_ATTACHMENT_S1.CONFIRM_BUTTON_TIMEOUT', { timeout }),
      cancelButtonText: this.translate.instant('NO'),
      showCancelButton: true,
      onOpen: () => {
        timeout--;
        Swal.disableConfirmButton();
        const confirmButtonRef = Swal.getConfirmButton();
        confirmInterval = setInterval(() => {
          if (timeout > 0) {
            confirmButtonRef.innerText = this.translate.instant('DELETE_ATTACHMENT_S1.CONFIRM_BUTTON_TIMEOUT', { timeout });
            timeout--;
          } else {
            Swal.enableConfirmButton();
            confirmButtonRef.innerText = this.translate.instant('YES');
            clearInterval(confirmInterval);
          }
        }, 1000);
      },
    }).then((result) => {
      clearInterval(confirmInterval);
      if (result.value) {
        this.attachmentFilesFormArray.removeAt(idx);
      }
    });
  }
}
