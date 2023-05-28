import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-general-document-dialog',
  templateUrl: './general-document-dialog.component.html',
  styleUrls: ['./general-document-dialog.component.scss']
})
export class GeneralDocumentDialogComponent implements OnInit, OnDestroy {
  @ViewChild('fileUploadDoc', { static: false }) fileUploaderDoc: ElementRef;
  uploadDocForm: UntypedFormGroup;
  selectedFile: File;
  isWaitingForResponse = false;

  private subs = new SubSink();

  fileTypesControl = new UntypedFormControl('');
  fileTypes = [];
  selectedFileType = '';
  selectedMaxSize = 0;

  constructor(
    public dialogRef: MatDialogRef<GeneralDocumentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData,
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private utilService: UtilityService,
    private fileUploadService: FileUploadService,
  ) { }

  ngOnInit() {
    this.initUploadDocForm();


    if (this.parentData.type === 'edit' && this.parentData.documentData) {
      this.uploadDocForm.patchValue(this.parentData.documentData);
    }
  }

  initUploadDocForm() {
    this.uploadDocForm = this.fb.group({
      document_name: ['', [Validators.required]],
      s3_file_name: [''],
    });
  }

  closeDialog() {

    this.dialogRef.close();
  }

  openUploadWindow() {
    this.fileUploaderDoc.nativeElement.click();
    this.selectedMaxSize = 0;
  }

  addFile(fileInput: Event) {
    const acceptable = ['pdf'];
    const file = (<HTMLInputElement>fileInput.target).files[0];
    const fileType = this.utilService.getFileExtension(file.name).toLocaleLowerCase();
    if (acceptable.includes(fileType)) {
      const tempFile = (<HTMLInputElement>fileInput.target).files[0];
      if (this.utilService.countFileSize(tempFile, this.selectedMaxSize)) {
        this.selectedFile = (<HTMLInputElement>fileInput.target).files[0];
        this.uploadDocForm.get('s3_file_name').setValue(this.selectedFile.name);
      } else {
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('UPLOAD_RESTRICT_TO_FILESIZE_File.TITLE'),
          html: this.translate.instant('UPLOAD_RESTRICT_TO_FILESIZE_File.TEXT', { size: this.selectedMaxSize }),
          confirmButtonText: this.translate.instant('UPLOAD_RESTRICT_TO_FILESIZE_File.BUTTON'),
          allowOutsideClick: false,
        });
      }
    } else {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TITLE'),
        text: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TEXT', {file_exts: '.pdf'}),
        allowEscapeKey: false,
        allowOutsideClick: false,
        allowEnterKey: false
      });
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.fileUploaderDoc.nativeElement.value = null;
    this.uploadDocForm.get('s3_file_name').setValue('');
    if (this.parentData && this.parentData.isUpdate && this.parentData.document && this.parentData.document.s3_file_name) {
      this.uploadDocForm.get('s3_file_name').setValue(this.parentData.document.s3_file_name);
    }
  }

  uploadSubmitDerogationDocument() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.fileUploadService.singleUpload(this.selectedFile).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        this.uploadDocForm.get('s3_file_name').setValue(resp.s3_file_name);
        this.submitDerogationDocument();
      } else {
        Swal.fire({
          type: 'error',
          title: 'Error',
          allowOutsideClick: false,
          confirmButtonText: this.translate.instant('ok')
        });
      }
    })
  }

  submitDerogationDocument() {
    this.dialogRef.close(this.uploadDocForm.value);
  }

  isUploadedFileExist() {
    return this.selectedFile || this.uploadDocForm.get('s3_file_name').value;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
