import { Component, OnInit, ViewChild, ElementRef, Inject, OnDestroy } from '@angular/core';
import { AcadKitDocument } from '../academic-kit.model';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { SubSink } from 'subsink';
import { UtilityService } from 'app/service/utility/utility.service';

interface ParentData {
  titleId: string;
  classId: string;
  folderId: string;
  isUpdate: boolean;
  document: AcadKitDocument;
  docGenerationType?: string;
  isFolder07: boolean;
}

@Component({
  selector: 'ms-document-upload-dialog',
  templateUrl: './document-upload-dialog.component.html',
  styleUrls: ['./document-upload-dialog.component.scss'],
})
export class DocumentUploadDialogComponent implements OnInit, OnDestroy {
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
    public dialogRef: MatDialogRef<DocumentUploadDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: ParentData,
    private fb: UntypedFormBuilder,
    private acadKitService: AcademicKitService,
    private fileUploadService: FileUploadService,
    private translate: TranslateService,
    private utilService: UtilityService,
  ) { }

  ngOnInit() {
    if (this.parentData.isUpdate) {
      this.documentTypes = this.acadKitService.getDocumentTypes();
      this.isEdit = true;
    } else {
      this.documentTypes = this.acadKitService.getCreateDocumentTypes();
    }
    this.fileTypes = this.acadKitService.getFileTypes();
    this.initUploadDocForm();
    this.getDocFormData();
    this.getClassDropdownList();

    if (this.parentData && this.parentData.document && this.parentData.document.type_of_document) {
      const validationGrandOral =
        this.parentData.document.type_of_document === 'student_upload_grand_oral_presentation' ||
        this.parentData.document.type_of_document === 'student_upload_grand_oral_cv';
      if (validationGrandOral) {
        this.isGrandOralCVorPresentation = true;
      }
      if (this.parentData.document.type_of_document === 'documentExpected') {
        this.isDocumentExpected = true;
      }
    }
  }

  initUploadDocForm() {
    this.uploadDocForm = this.fb.group({
      document_name: ['', Validators.required],
      type_of_document: ['', Validators.required],
      s3_file_name: [''],
      published_for_student: [false],
      visible_to_school: [false],
      parent_rncp_title: [null],
      parent_folder: [null],
      parent_class_id: [[]],
      document_generation_type: this.parentData.docGenerationType,
    });
  }

  getDocFormData() {
    this.uploadDocForm.get('parent_rncp_title').setValue(this.parentData.titleId);
    this.uploadDocForm.get('parent_folder').setValue(this.parentData.folderId);
    const temp = [];

    if (this.parentData.document && this.parentData.document.parent_class_id && this.parentData.document.parent_class_id.length) {
      this.parentData.document.parent_class_id.forEach((classess) => {
        if (classess._id) {
          temp.push(classess._id);
        }
      });
    } else if (this.parentData.classId) {
      temp.push(this.parentData.classId);
    }
    this.uploadDocForm.get('parent_class_id').setValue(temp);

    if (this.parentData.isUpdate) {
      this.uploadDocForm.patchValue(this.parentData.document);
      this.uploadDocForm.get('parent_class_id').setValue(temp);

      const extension = this.utilService.getFileExtension(this.parentData.document.s3_file_name);
      const fileType = this.utilService.getFileTypeFromExtension(extension);

      this.fileTypesControl.setValue(fileType);
      this.selectedFileType = fileType;

      if (this.parentData.document.type_of_document === 'student_upload_grand_oral_presentation' ||
        this.parentData.document.type_of_document === 'student_upload_grand_oral_cv') {
          const doc_name = this.parentData.document.document_name;
          if (doc_name && doc_name.includes('Student Upload Retake Grand Oral Certification passport')) {
            const doc_presentation = `${this.translate.instant('Student Upload Retake Grand Oral Certification passport')} ${this.parentData?.document?.parent_rncp_title?.short_name ? ' - ' + this.parentData?.document?.parent_rncp_title?.short_name : ''}`;
            this.uploadDocForm.get('document_name').patchValue(doc_presentation);
          } else if (doc_name && doc_name.includes('Student Upload Retake Grand Oral CV')) {
            const doc_cv = `${this.translate.instant('Student Upload Retake Grand Oral CV')} ${this.parentData?.document?.parent_rncp_title?.short_name ? ' ' + this.parentData?.document?.parent_rncp_title?.short_name : ''}`;
            this.uploadDocForm.get('document_name').patchValue(doc_cv);
          }
      }
    }

  }

  closeDialog() {

    this.dialogRef.close();
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

    // this.selectedFile = (<HTMLInputElement>fileInput.target).files[0];

    // this.uploadDocForm.get('s3_file_name').setValue(this.selectedFile.name);
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

  uploadFile() {
    // convert selectedFile size in byte to GB by dividing the value by 1e+9
    const selectedFileSizeInGb = this.selectedFile.size / 1000000000;

    if (selectedFileSizeInGb < 1) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.fileUploadService.singleUpload(this.selectedFile).subscribe((resp) => {
        const fileName = this.uploadDocForm.get('document_name').value;
        this.uploadDocForm.get('s3_file_name').setValue(resp.s3_file_name);
        this.submitAcadKitDocument();
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

  submitAcadKitDocument() {
    if (this.uploadDocForm.get('published_for_student').value && !this.parentData.isUpdate) {
      this.showPublishForStudentSwal();
    } else if (
      this.uploadDocForm.get('published_for_student').value &&
      this.parentData.isUpdate &&
      !this.parentData.document.published_for_student
    ) {
      this.showPublishForStudentSwal();
    } else {
      if (this.parentData.isUpdate) {
        this.updateAcadKitDocument();
      } else {
        this.createAcadKitDocument();
      }
    }
  }

  submitUpdateDocument() {

    if (this.selectedFile) {
      this.uploadFile();
    } else if (this.uploadDocForm.get('published_for_student').value && !this.parentData.document.published_for_student) {
      this.showPublishForStudentSwal();
    } else {
      // const fileName = this.uploadDocForm.get('document_name').value;
      // this.uploadDocForm.get('s3_file_name').setValue(fileName);
      this.updateAcadKitDocument();
    }
  }

  showPublishForStudentSwal() {
    Swal.fire({
      type: 'question',
      allowOutsideClick: false,
      title: this.translate.instant('PUBLISHDOC_S1.TITLE'),
      html: this.translate.instant('PUBLISHDOC_S1.TEXT', { docname: this.uploadDocForm.get('document_name').value }),
      footer: `<span style="margin-left: auto">PUBLISHDOC_S1</span>`,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('Yes'),
      cancelButtonText: this.translate.instant('No'),
    }).then(
      (result) => {
        if (result.value) {
          if (this.parentData.isUpdate) {
            this.updateAcadKitDocument();
          } else {
            this.createAcadKitDocument();
          }
        }
      },
      (dismiss) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  createAcadKitDocument() {
    const payload = this.uploadDocForm.value;
    if (!this.parentData.docGenerationType) {
      delete payload.docGenerationType;
    }
    this.isWaitingForResponse = true;
    this.subs.sink = this.acadKitService.createAcadDoc(payload).subscribe((resp) => {
      this.isWaitingForResponse = false;
      this.dialogRef.close(true);

      if (this.uploadDocForm.get('published_for_student').value) {
        Swal.fire({
          allowOutsideClick: false,
          type: 'success',
          title: this.translate.instant('PUBLISHDOC_S2.TITLE'),
          text: this.translate.instant('PUBLISHDOC_S2.TEXT'),
          footer: `<span style="margin-left: auto">PUBLISHDOC_S2</span>`,
          confirmButtonText: this.translate.instant('PUBLISHDOC_S2.BTN'),
        });
      } else {
        Swal.fire({
          type: 'success',
          title: 'Bravo !',
          text: this.translate.instant('ACAD_KIT.DOC.UPLOADSUCCESS'),
          allowOutsideClick: false,
          confirmButtonText: this.translate.instant('OK'),
        });
      }
    });
  }

  updateAcadKitDocument() {
    const payload = _.cloneDeep(this.uploadDocForm.value);

    // delete the parent folder from payload because we dont want to mess up with the folder where this document from
    delete payload.parent_folder;

    // Do not need to update document generation type, its used only for acad doc creation
    delete payload.document_generation_type;

    if (!this.parentData.docGenerationType) {
      delete payload.docGenerationType;
      // delete payload.document_generation_type;
    }
    if (this.uploadDocForm.get('published_for_student').value) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.acadKitService.updateAcadDoc(this.parentData.document._id, payload).subscribe((resp) => {
        this.isWaitingForResponse = false;
        const lastStatus = this.parentData.document.published_for_student;
        const currentStatus = this.uploadDocForm.get('published_for_student').value;

        if (!lastStatus && currentStatus) {
          // publish document to student
          Swal.fire({
            type: 'success',
            title: this.translate.instant('PUBLISHDOC_S2.TITLE'),
            text: this.translate.instant('PUBLISHDOC_S2.TEXT'),
            footer: `<span style="margin-left: auto">PUBLISHDOC_S2</span>`,
            confirmButtonText: this.translate.instant('PUBLISHDOC_S2.BTN'),
            allowOutsideClick: false,
          }).then(result => {
            this.dialogRef.close(true);
          })
        } else if (lastStatus && !currentStatus) {
          // unpublish document to student
          Swal.fire({
            type: 'success',
            title: this.translate.instant('PUBLISHDOC_S3.TITLE'),
            footer: `<span style="margin-left: auto">PUBLISHDOC_S3</span>`,
            allowOutsideClick: false,
            confirmButtonText: this.translate.instant('OK'),
          }).then(result => {
            this.dialogRef.close(true);
          })
        } else {
          Swal.fire({ type: 'success', title: 'Bravo!', allowOutsideClick: false, confirmButtonText: this.translate.instant('OK') }).then(resp => {this.dialogRef.close(true)})
        }
      });
    } else {
      this.uploadDocForm.get('parent_class_id').setValue(null);
      // Delete parent_rncp_title from payload, we don't want to mess other doc data except the file
      delete payload.parent_rncp_title
      if (this.parentData.document.type_of_document === 'student_upload_grand_oral_presentation' ||
        this.parentData.document.type_of_document === 'student_upload_grand_oral_cv') {
          payload.document_name = this.parentData.document?.document_name;
      }
      this.isWaitingForResponse = true;
      this.subs.sink = this.acadKitService.updateAcadDoc(this.parentData.document._id, payload).subscribe((resp) => {
        this.isWaitingForResponse = false;
        const lastStatus = this.parentData.document.published_for_student;
        const currentStatus = this.uploadDocForm.get('published_for_student').value;

        if (!lastStatus && currentStatus) {
          // publish document to student
          Swal.fire({
            type: 'success',
            title: this.translate.instant('PUBLISHDOC_S2.TITLE'),
            text: this.translate.instant('PUBLISHDOC_S2.TEXT'),
            footer: `<span style="margin-left: auto">PUBLISHDOC_S2</span>`,
            confirmButtonText: this.translate.instant('PUBLISHDOC_S2.BTN'),
            allowOutsideClick: false,
          }).then(result => {this.dialogRef.close(true)})
        } else if (lastStatus && !currentStatus) {
          // unpublish document to student
          Swal.fire({
            type: 'success',
            title: this.translate.instant('PUBLISHDOC_S3.TITLE'),
            footer: `<span style="margin-left: auto">PUBLISHDOC_S3</span>`,
            allowOutsideClick: false,
            confirmButtonText: this.translate.instant('OK'),
          }).then(result => {this.dialogRef.close(true)})
        } else {
          Swal.fire({ type: 'success', title: 'Bravo!', allowOutsideClick: false, confirmButtonText: this.translate.instant('OK') }).then(result => {this.dialogRef.close(true)})
        }
      });
    }
  }

  isUploadedFileExist() {
    return this.selectedFile || this.uploadDocForm.get('s3_file_name').value;
  }

  getClassDropdownList() {
    this.subs.sink = this.acadKitService.getClassDropDownList(this.parentData.titleId).subscribe((classData) => {
      if (classData) {
        this.classes = classData;
        this.classes = this.classes.sort((a: any, b: any) => a.name.localeCompare(b.name));
      }
    });
  }

  setFileType(data: MatSelectChange) {
    this.selectedFileType = data.value;
  }

  cleanMe() {
    const classId =
      this.parentData && this.parentData?.document && this.parentData?.document?.parent_class_id?.length
        ? this.parentData?.document?.parent_class_id[0]?._id
        : this.parentData?.classId;
    this.uploadDocForm.get('published_for_student').value
      ? this.uploadDocForm.get('parent_class_id').setValue(null)
      : this.uploadDocForm.get('parent_class_id').setValue([classId]);

  }

  onSelectAll() {
    const selected = this.classes.map((item) => item._id);
    this.uploadDocForm.get('parent_class_id').patchValue(selected);
  }

  onClearAll() {
    this.uploadDocForm.get('parent_class_id').patchValue([]);
  }

  closePopUp() {

    this.dialogRef.close();
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

  ngOnDestroy() {
    clearInterval(this.intVal);
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
