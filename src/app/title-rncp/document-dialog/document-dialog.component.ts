import { Component, OnInit, Inject, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { Observable } from 'rxjs';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-document-dialog',
  templateUrl: './document-dialog.component.html',
  styleUrls: ['./document-dialog.component.scss'],
})
export class DocumentDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @ViewChild('fileUpload', { static: false }) fileUploader: ElementRef;
  types = [];
  type: any;
  isPublishable: boolean;
  documentForm: UntypedFormGroup;
  selectedFile: any;
  classes = [];
  isWaitingForResponse = false;
  private timeOutVal: any;
  constructor(
    public dialogRef: MatDialogRef<DocumentDialogComponent>,
    private fb: UntypedFormBuilder,
    private acadKitService: AcademicKitService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fileUploadService: FileUploadService,
    private translate: TranslateService,
  ) {}

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }

  ngOnInit() {
    this.types = this.acadKitService.getDocumentTypes();
    this.initUploadDocForm();
    this.getData();
    this.getClassDropdownList();
  }

  initUploadDocForm() {
    this.documentForm = this.fb.group({
      document_name: ['', Validators.required],
      type_of_document: ['', Validators.required],
      document_generation_type: ['', Validators.required],
      s3_file_name: [''],
      published_for_student: [false],
      parent_class_id: [[]],
    });
  }

  getData() {
    if (this.data.docs) {

      this.documentForm.patchValue(this.data.docs);
      if (this.data.docs.parent_class_id && this.data.docs.parent_class_id.length) {
        const temp = [];
        this.data.docs.parent_class_id.forEach((classess) => {
          if (classess._id) {
            temp.push(classess._id);
          }
        });
        this.documentForm.get('parent_class_id').patchValue(temp);
      }
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  openUploadWindow() {
    this.fileUploader.nativeElement.click();
  }

  addFile(fileInput: Event) {
    this.selectedFile = (<HTMLInputElement>fileInput.target).files[0];
    this.documentForm.get('s3_file_name').setValue(this.selectedFile.name);
  }

  removeFile() {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
      html: this.translate.instant('this action will delete File !'),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      clearTimeout(this.timeOutVal);
      if (res.value) {
        this.selectedFile = null;
        this.fileUploader.nativeElement.value = null;
        this.documentForm.get('s3_file_name').setValue('');
        Swal.fire({
          type: 'success',
          title: this.translate.instant('EVENT_S1.TITLE'),
          html: this.translate.instant('File deleted'),
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          allowOutsideClick: false,
        });
      }
    });
  }

  uploadFile() {
    // convert selectedFile size in byte to GB by dividing the value by 1e+9
    const selectedFileSizeInGb = this.selectedFile.size / 1000000000;

    if (selectedFileSizeInGb < 1) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.fileUploadService.singleUpload(this.selectedFile).subscribe((resp) => {
        this.documentForm.get('s3_file_name').setValue(resp.s3_file_name);
        this.submitDocument();
      });
    } else {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('UPLOAD_RESTRICT_TO_FILESIZE.TITLE'),
        html: this.translate.instant('UPLOAD_RESTRICT_TO_FILESIZE.TEXT'),
        footer: `<span style="margin-left: auto">UPLOAD_RESTRICT_TO_FILESIZE</span>`,
        confirmButtonText: this.translate.instant('UPLOAD_RESTRICT_TO_FILESIZE.BUTTON'),
        allowOutsideClick: false,
      });
      this.removeFile();
    }
  }

  submitDocument() {
    if (this.documentForm.get('published_for_student').value && !this.data.isUpdate) {
      this.showPublishForStudentSwal();
    } else if (this.documentForm.get('published_for_student').value && this.data.isUpdate && !this.data.docs.published_for_student) {
      this.showPublishForStudentSwal();
    } else {
      if (this.data.isUpdate) {
        this.updateDocument();
      }
    }
  }

  submitUpdateDocument() {
    if (this.selectedFile) {
      this.uploadFile();
    } else if (this.documentForm.get('published_for_student').value && !this.data.docs.published_for_student) {
      this.showPublishForStudentSwal();
    } else {
      const fileName = this.documentForm.get('document_name').value;
      // this.documentForm.get('s3_file_name').setValue(fileName);
      this.updateDocument();
    }
  }

  showPublishForStudentSwal() {
    Swal.fire({
      type: 'question',
      title: this.translate.instant('PUBLISHDOC_S1.TITLE'),
      html: this.translate.instant('PUBLISHDOC_S1.TEXT', { docname: this.documentForm.get('document_name').value }),
      footer: `<span style="margin-left: auto">PUBLISHDOC_S1</span>`,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('Yes'),
      cancelButtonText: this.translate.instant('No'),
      allowOutsideClick: false,
    }).then(
      (result) => {
        if (result.value) {
          if (this.data.isUpdate) {
            this.updateDocument();
          }
        }
      },
      (dismiss) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  updateDocument() {
    if (this.documentForm.get('published_for_student').value) {
      this.subs.sink = this.acadKitService.updateAcadDoc(this.data.docs._id, this.documentForm.value).subscribe((resp) => {
        this.isWaitingForResponse = false;
        this.dialogRef.close(true);
        const lastStatus = this.data.docs.published_for_student;
        const currentStatus = this.documentForm.get('published_for_student').value;

        if (!lastStatus && currentStatus) {
          // publish document to student
          Swal.fire({
            type: 'success',
            title: this.translate.instant('PUBLISHDOC_S2.TITLE'),
            text: this.translate.instant('PUBLISHDOC_S2.TEXT'),
            footer: `<span style="margin-left: auto">PUBLISHDOC_S2</span>`,
            confirmButtonText: this.translate.instant('PUBLISHDOC_S2.BTN'),
            allowOutsideClick: false,
          });
        } else if (lastStatus && !currentStatus) {
          // unpublish document to student
          Swal.fire({
            type: 'success',
            title: this.translate.instant('PUBLISHDOC_S3.TITLE'),
            footer: `<span style="margin-left: auto">PUBLISHDOC_S3</span>`,
            allowOutsideClick: false,
            confirmButtonText : this.translate.instant('OK'),
          });
        } else {
          Swal.fire({ type: 'success', title: 'Bravo!',            allowOutsideClick: false,
            confirmButtonText : this.translate.instant('OK'), });
        }
      });
    } else {
      this.documentForm.get('parent_class_id').setValue(null);
      this.subs.sink = this.acadKitService.updateAcadDoc(this.data.docs._id, this.documentForm.value).subscribe((resp) => {
        this.isWaitingForResponse = false;
        this.dialogRef.close(true);
        const lastStatus = this.data.docs.published_for_student;
        const currentStatus = this.documentForm.get('published_for_student').value;

        if (!lastStatus && currentStatus) {
          // publish document to student
          Swal.fire({
            type: 'success',
            title: this.translate.instant('PUBLISHDOC_S2.TITLE'),
            text: this.translate.instant('PUBLISHDOC_S2.TEXT'),
            footer: `<span style="margin-left: auto">PUBLISHDOC_S2</span>`,
            confirmButtonText: this.translate.instant('PUBLISHDOC_S2.BTN'),
            allowOutsideClick: false,
          });
        } else if (lastStatus && !currentStatus) {
          // unpublish document to student
          Swal.fire({
            type: 'success',
            title: this.translate.instant('PUBLISHDOC_S3.TITLE'),
            footer: `<span style="margin-left: auto">PUBLISHDOC_S3</span>`,
            allowOutsideClick: false,
            confirmButtonText : this.translate.instant('OK'),
          });
        } else {
          Swal.fire({ type: 'success', title: 'Bravo!' ,            allowOutsideClick: false,
            confirmButtonText : this.translate.instant('OK'),});
        }
      });
    }
  }

  isUploadedFileExist() {
    return this.selectedFile || this.documentForm.get('s3_file_name').value;
  }

  getClassDropdownList() {
    this.subs.sink = this.acadKitService.getClassDropDownList(this.data.rncpId).subscribe((classData) => {
      if (classData) {
        this.classes = classData;
        this.classes = this.classes.sort((a: any, b: any) => a.name.localeCompare(b.name));
      }
    });
  }

  cleanMe() {
    this.documentForm.get('parent_class_id').setValue(null);
  }

  onSelectAll() {
    const selected = this.classes.map((item) => item._id);
    this.documentForm.get('parent_class_id').patchValue(selected);
  }

  onClearAll() {
    this.documentForm.get('parent_class_id').patchValue([]);
  }
}
