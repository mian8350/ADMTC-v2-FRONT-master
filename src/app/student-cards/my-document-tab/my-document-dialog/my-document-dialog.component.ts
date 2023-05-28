import { Component, ElementRef, EventEmitter, Inject, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { TranslateService } from '@ngx-translate/core';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { StudentsService } from 'app/service/students/students.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import * as _ from 'lodash';

@Component({
  selector: 'ms-my-document-dialog',
  templateUrl: './my-document-dialog.component.html',
  styleUrls: ['./my-document-dialog.component.scss'],
})
export class MyDocumentDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @ViewChild('fileUploadDoc', { static: false }) fileUploaderDoc: ElementRef;
  @ViewChild('fileUploadImg', { static: false }) fileUploaderImg: ElementRef;
  @ViewChild('fileUploadVid', { static: false }) fileUploaderVid: ElementRef;
  uploadDocForm: UntypedFormGroup;
  documentTypes = [];
  selectedFile: File;
  isWaitingForResponse = false;
  classes = [];
  private intVal: any;
  private timeOutVal: any;

  fileTypesControl = new UntypedFormControl('');
  fileTypes = [];
  selectedFileType = '';
  selectedMaxSize = 0;

  isGrandOralCVorPresentation = false;
  isDocumentExpected = false;
  isEdit = false;

  constructor(
    public dialogRef: MatDialogRef<MyDocumentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: any,
    private fb: UntypedFormBuilder,
    private acadKitService: AcademicKitService,
    private fileUploadService: FileUploadService,
    private translate: TranslateService,
    private utilService: UtilityService,

    private studentService: StudentsService,
  ) {}

  //fix upload issue
  ngOnInit() {
    this.documentTypes = this.acadKitService.getCreateDocumentTypes();
    this.fileTypes = this.acadKitService.getFileTypes();
    this.initUploadDocForm();

    if (this.parentData.isUpdate) {
      this.isEdit = true;
      const payload = _.cloneDeep(this.parentData.document);
      const extension = this.utilService.getFileExtension(this.parentData.document.s3_file_name);
      const fileType = this.utilService.getFileTypeFromExtension(extension);

      if (payload && payload.parent_rncp_title && payload.parent_rncp_title._id) {
        payload.parent_rncp_title = payload.parent_rncp_title._id;
      }
      if (payload && payload.parent_class_id && payload.parent_class_id.length) {
        payload.parent_class_id = payload.parent_class_id.map((classData) => classData._id);
      }
      if (payload && payload.school_id && payload.school_id._id) {
        payload.school_id = payload.school_id._id;
      }
      if (payload && payload.uploaded_for_student && payload.uploaded_for_student._id) {
        payload.uploaded_for_student = payload.uploaded_for_student._id;
      }
      if (payload && payload.created_by && payload.created_by._id) {
        payload.created_by = payload.created_by._id;
      }

      this.fileTypesControl.setValue(fileType);
      this.selectedFileType = fileType;
      this.uploadDocForm.patchValue(payload);
    }
  }

  initUploadDocForm() {
    this.uploadDocForm = this.fb.group({
      document_name: ['', Validators.required],
      type_of_document: ['', Validators.required],
      s3_file_name: [''],
      uploaded_for_student: [this.parentData.studentId],
      school_id: [this.parentData.schoolId],
      parent_rncp_title: [this.parentData.titleId],
      parent_class_id: [this.parentData.classId],
      document_generation_type: ['my_document_table'],
      created_by: [this.utilService.getCurrentUser()._id],
    });
  }

  setFileType(data: MatSelectChange) {
    this.selectedFileType = data.value;
  }

  uploadFile() {
    // convert selectedFile size in byte to GB by dividing the value by 1e+9
    const selectedFileSizeInGb = this.selectedFile.size / 1000000000;

    if (selectedFileSizeInGb < 1) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.fileUploadService.singleUpload(this.selectedFile).subscribe((resp) => {
        const fileName = this.uploadDocForm.get('document_name').value;
        this.uploadDocForm.get('s3_file_name').setValue(resp.s3_file_name);
        this.submitMyDocument();
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

      let timeDisabled = 5;
      Swal.fire({
        allowOutsideClick: false,
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('this action will delete file !'),
        footer: `<span style="margin-left: auto">DASHBOARD_DELETE</span>`,
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          this.intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);
          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(this.intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.removeFile();
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('file deleted'),
            footer: `<span style="margin-left: auto">EVENT_S1</span>`,
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
            allowOutsideClick: false,
          });
        }
      });
    }
  }

  openUploadWindow() {
    if (this.selectedFileType) {
      switch (this.selectedFileType) {
        case 'docper':
          this.fileUploaderDoc.nativeElement.click();
          this.selectedMaxSize = 0;
          break;
        case 'image':
          this.fileUploaderImg.nativeElement.click();
          this.selectedMaxSize = 50;
          break;
        case 'video':
          this.fileUploaderVid.nativeElement.click();
          this.selectedMaxSize = 200;
          break;
      }
    }
    // this.fileUploader.nativeElement.click();
  }

  fileValidation() {
    let result = true;
    const temp = this.uploadDocForm.value;
    if (temp && temp.published_for_student === true) {
      result = false;
      if (temp.parent_class_id && temp.parent_class_id.length > 0) {
        result = true;
      }
    }
    return result;
  }

  isUploadedFileExist() {
    return this.selectedFile || this.uploadDocForm.get('s3_file_name').value;
  }

  addFile(fileInput: Event) {
    const tempFile = (<HTMLInputElement>fileInput.target).files[0];
    if (this.utilService.countFileSize(tempFile, this.selectedMaxSize)) {
      this.selectedFile = (<HTMLInputElement>fileInput.target).files[0];

      this.uploadDocForm.get('s3_file_name').setValue(this.selectedFile.name);
    } else {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('UPLOAD_RESTRICT_TO_FILESIZE_File.TITLE'),
        html: this.translate.instant('UPLOAD_RESTRICT_TO_FILESIZE_File.TEXT', { size: this.selectedMaxSize }),
        footer: `<span style="margin-left: auto">UPLOAD_RESTRICT_TO_FILESIZE_File</span>`,
        confirmButtonText: this.translate.instant('UPLOAD_RESTRICT_TO_FILESIZE_File.BUTTON'),
        allowOutsideClick: false,
      });
    }
  }

  // submit document
  submitMyDocument() {
    if (this.parentData.isUpdate) {
      this.submitUpdateDocument();
    } else {
      const payload = this.uploadDocForm.value;
      this.subs.sink = this.acadKitService.createAcadDoc(payload).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          this.dialogRef.close(true);
          Swal.fire({
            type: 'success',
            title: 'Bravo !',
            text: this.translate.instant('ACAD_KIT.DOC.UPLOADSUCCESS'),
            allowOutsideClick: false,
            confirmButtonText: this.translate.instant('OK'),
          }).then((res) => {
            this.dialogRef.close('success');
          });
        },
        (err) => {
          this.swalError(err);
        },
      );
    }
  }

  submitUpdateDocument() {
    this.updateAcadDoc();
  }

  updateAcadDoc() {
    const payload = this.uploadDocForm.value;
    this.subs.sink = this.acadKitService.updateAcadDoc(this.parentData.document._id, payload).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        this.dialogRef.close(true);
        Swal.fire({
          type: 'success',
          title: 'Bravo !',
          allowOutsideClick: false,
          confirmButtonText: this.translate.instant('OK'),
        }).then((res) => {
          this.dialogRef.close('success');
        });
      },
      (err) => {
        this.swalError(err);
      },
    );
  }

  // swall error
  swalError(err) {
    this.isWaitingForResponse = false;
    if (err['message'] === 'GraphQL error: Name already Exists. Please pick another name') {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Uniquename_S1.TITLE'),
        html: this.translate.instant('Uniquename_S1.TEXT'),
        footer: `<span style="margin-left: auto">Uniquename_S1</span>`,
        showConfirmButton: true,
        confirmButtonText: this.translate.instant('Uniquename_S1.BUTTON'),
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

  // in bellow funcion automatic generate
  showPublishForStudentSwal() {
    throw new Error('Method not implemented.');
  }

  closeDialog() {

    this.dialogRef.close();
  }

  removeFile() {
    this.selectedFile = null;
    this.fileUploaderDoc.nativeElement.value = null;
    this.fileUploaderImg.nativeElement.value = null;
    this.fileUploaderVid.nativeElement.value = null;
    this.uploadDocForm.get('s3_file_name').setValue('');
    if (this.parentData && this.parentData.isUpdate && this.parentData.document && this.parentData.document.s3_file_name) {
      this.uploadDocForm.get('s3_file_name').setValue(this.parentData.document.s3_file_name);
    }
  }

  ngOnDestroy() {
    clearInterval(this.intVal);
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
