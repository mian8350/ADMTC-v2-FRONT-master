import { Component, OnInit, ElementRef, ViewChild, Inject } from '@angular/core';
import { SubSink } from 'subsink';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';

@Component({
  selector: 'ms-justification-reason-dialog',
  templateUrl: './justification-reason-dialog.component.html',
  styleUrls: ['./justification-reason-dialog.component.scss'],
  providers: [ParseLocalToUtcPipe],
})
export class JustificationReasonDialogComponent implements OnInit {
  private subs = new SubSink();

  @ViewChild('fileUpload', { static: false }) fileUploader: ElementRef;

  justifyReasonForm: UntypedFormGroup;
  uploadDocForm: UntypedFormGroup;
  selectedFile: File;
  fileName: string;
  isWaitingForResponse = false;
  private intVal: any;
  private timeOutVal: any;
  today = new Date();

  constructor(
    private fb: UntypedFormBuilder,
    private fileUploadService: FileUploadService,
    public dialogref: MatDialogRef<JustificationReasonDialogComponent>,
    private parseLocaltoUTC: ParseLocalToUtcPipe,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private acadKitService: AcademicKitService,
  ) {}

  ngOnInit() {
    this.initForm();
    this.initDocForm();
  }

  initForm() {
    this.justifyReasonForm = this.fb.group({
      reason_for_missing_copy: ['', Validators.required],
      document_for_missing_copy: [''],
    });
  }

  initDocForm() {
    let documentName = '';
    if (this.data && this.data.student) {
      documentName =
        this.data.rncp.short_name + ' - ' + this.data.test.name + ' - ' + this.data.student.last_name + ' ' + this.data.student.first_name;
    } else {
      documentName = this.data.rncp.short_name + ' - ' + this.data.test.name + ' - ' + this.data.group.name;
    }
    this.uploadDocForm = this.fb.group({
      document_name: [documentName],
      type_of_document: ['application/pdf'],
      document_generation_type: ['missingCopy'],
      s3_file_name: [''],
      // parent_folder: [this.data.test.parent_category._id],
      parent_rncp_title: [this.data.rncp._id],
      test_correction: [this.data && this.data.student && this.data.student.testCorrectionId ? this.data.student.testCorrectionId : null],
      group_test_correction: [
        this.data && this.data.group && this.data.group.groupTestCorrectionId ? this.data.group.groupTestCorrectionId : null,
      ],
      publication_date: this.fb.group({
        type: ['fixed'],
        before: [null],
        day: [null],
        publication_date: this.fb.group({
          date: [this.getTodayDate()],
          time: [this.getTodayTime()],
        }),
      }),
    });
  }

  openUploadWindow() {
    this.fileUploader.nativeElement.click();
  }

  addFile(fileInput: Event) {
    this.selectedFile = (<HTMLInputElement>fileInput.target).files[0];

    if (this.selectedFile) {
      this.uploadFile();
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.fileUploader.nativeElement.value = null;
  }

  closeDialog() {
    this.dialogref.close();
  }

  uploadFile() {
    // convert selectedFile size in byte to GB by dividing the value by 1e+9
    const selectedFileSizeInGb = this.selectedFile.size / 1000000000;

    if (selectedFileSizeInGb < 1) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.fileUploadService.singleUpload(this.selectedFile).subscribe((resp) => {
        if (resp && resp.s3_file_name) {
          this.uploadDocForm.get('s3_file_name').setValue(resp.s3_file_name);
          this.createAcadDoc();
        }
      },
      (err) => {
        Swal.fire({
          type: 'error',
          title: 'Error !',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: 'OK',
        }).then((res) => {

        });
      },
    );
    } else {
      // all of code in else is only sweet alert and removing invalid file
    }
  }

  createAcadDoc() {
    // call mutation create acad doc
    const payload = this.formatAcadDocPayload(this.uploadDocForm.value);
    this.subs.sink = this.acadKitService.createAcadDocJustify(payload).subscribe((resp) => {

      this.justifyReasonForm.get('document_for_missing_copy').patchValue([resp._id]);
    });
  }

  removeSelectedFile() {
    this.removeFile();
    this.justifyReasonForm.get('document_for_missing_copy').setValue('');
  }

  submit() {
    const payload = this.justifyReasonForm.value;
    if (!payload.document_for_missing_copy) {
      delete payload.document_for_missing_copy;
    }
    this.dialogref.close(payload);
  }

  formatAcadDocPayload(acadDoc) {
    if (acadDoc) {
      if (!acadDoc.test_correction) {
        delete acadDoc.test_correction;
      }
      if (!acadDoc.group_test_correction) {
        delete acadDoc.group_test_correction;
      }
    }
    return acadDoc;
  }


  getTodayDate() {
    const today = moment(this.today).format('DD/MM/YYYY');
    return this.parseLocaltoUTC.transformDate(today, '00:00');
  }

  getTodayTime() {
    return this.parseLocaltoUTC.transform('00:00');
  }
}
