import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-upload-document',
  templateUrl: './upload-document.component.html',
  styleUrls: ['./upload-document.component.scss'],
})
export class UploadDocumentComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  fileName = new UntypedFormControl('', Validators.required);
  fileUrl: string;
  isWaitingForResponse = false;

  constructor(public dialogRef: MatDialogRef<UploadDocumentComponent>, private fileUploadService: FileUploadService) {}

  ngOnInit() {}

  addFile(fileUpload: HTMLInputElement) {
    fileUpload.onchange = () => {
      const file = fileUpload.files[0];
      if (file.type === 'application/pdf') {
        this.isWaitingForResponse = true;
        this.subs.sink = this.fileUploadService.singleUpload(file).subscribe((resp) => {
          this.isWaitingForResponse = false;
          this.dialogRef.close({
            fileName: this.fileName.value,
            fileUrl: resp.file_url,
            s3FileName: resp.s3_file_name,
          });
        });
      }
    };
    fileUpload.click();
  }

  closeDialog() {
    this.dialogRef.close();
  }
  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
