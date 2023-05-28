import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { Observable, of } from 'rxjs';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';

@Component({
  selector: 'ms-edit-expected-document-dialog',
  templateUrl: './edit-expected-document-dialog.component.html',
  styleUrls: ['./edit-expected-document-dialog.component.scss']
})
export class EditExpectedDocumentDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();

  @ViewChild('fileUploadDoc', { static: false }) fileUploaderDoc: ElementRef;
  @ViewChild('fileUploadImg', { static: false }) fileUploaderImg: ElementRef;
  @ViewChild('fileUploadVid', { static: false }) fileUploaderVid: ElementRef;

  uploadDocForm: UntypedFormGroup;
  selectedFile: File;
  fileName: string;
  docName: string;
  isWaitingForResponse = false;
  acadDoc;
  uploadedDocId;
  private intVal: any;
  private timeOutVal: any;

  fileTypesControl = new UntypedFormControl('');
  fileTypes = [];
  selectedFileType = '';
  selectedMaxSize = 0;

  docper = ['doc', 'docx', 'ppt', 'pptx', 'txt', 'pdf', 'xlsx', 'xls'];
  img = ['tiff', 'pjp', 'jfif', 'gif', 'svg', 'bmp', 'png', 'jpeg', 'svgz', 'jpg', 'webp', 'ico', 'xbm', 'dib', 'tif', 'pjpeg', 'avif'];
  vid = ['ogm', 'wmv', 'mpg', 'webm', 'ogv', 'mov', 'asx', 'mpeg', 'mp4', 'm4v', 'avi'];

  studentId = '5a067bba1c0217218c75f8ab';

  allowedFileList = '';

  industryCtrl = new UntypedFormControl(null);
  industryList: any[] = [];
  filteredIndustry: Observable<any[]>;

  documentData;
  selectedTask;
  isManualTaskDocument = false;

  constructor(
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public docId: string,
    public dialogref: MatDialogRef<EditExpectedDocumentDialogComponent>,
    private fb: UntypedFormBuilder,
    private fileUploadService: FileUploadService,
    private acadKitService: AcademicKitService,
    private utilService: UtilityService,
  ) { }

  ngOnInit() {
    this.initUploadDocForm();
    this.getExpectedDocumentData();
    this.initFilterIndustry();
  }

  initUploadDocForm() {
    this.uploadDocForm = this.fb.group({
      document_name: [''],
      s3_file_name: [''],
      document_title: [''],
      document_industry: ['none'],
    });
    this.industryCtrl.patchValue('none');
  }

  getExpectedDocumentData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.acadKitService.getExpectedDocumentDetails(this.docId).subscribe(resp => {
      this.isWaitingForResponse = false;

      this.documentData = _.cloneDeep(resp);
      const response = _.cloneDeep(resp);
      this.selectedTask = response.task_id;

      // if document has no document_expected_id and parent_test, it mean this document come from manual task
      if (!response.document_expected_id && !response.parent_test) {
        this.isManualTaskDocument = true;
      }
      if (!response.document_title) {
        response.document_title = ''
      }
      if (!response.document_industry) {
        response.document_industry = 'none'
      }

      this.uploadDocForm.patchValue(response);
      this.industryCtrl.patchValue(response.document_industry ? response.document_industry : 'none');
      this.generateDocName();


      // *************** populate the file type
      if (response && response.document_expected_id && response.document_expected_id.file_type) {
        this.fileTypesControl.patchValue(response.document_expected_id.file_type);
        this.selectedFileType = response.document_expected_id.file_type;
        this.populateAllowedFileList();
      } else {
        this.fileTypesControl.patchValue('docper');
        this.selectedFileType = 'docper';
        this.populateAllowedFileList();
      }
    }, (err) => {
      this.swalError(err);
    })
  }

  populateAllowedFileList() {
    if (this.selectedFileType) {
      this.allowedFileList = '';
      switch (this.selectedFileType) {
        case 'docper':
          this.docper.forEach((extension, index) => {
            if (index !== this.docper.length - 1) {
              this.allowedFileList += '.' + extension + ', ';
            } else {
              this.allowedFileList += '.' + extension;
            }
          });
          break;
        case 'image':
          this.img.forEach((extension, index) => {
            if (index !== this.img.length - 1) {
              this.allowedFileList += '.' + extension + ', ';
            } else {
              this.allowedFileList += '.' + extension;
            }
          });
          break;
        case 'video':
          this.vid.forEach((extension, index) => {
            if (index !== this.vid.length - 1) {
              this.allowedFileList += '.' + extension + ', ';
            } else {
              this.allowedFileList += '.' + extension;
            }
          });
          break;
        default:
          this.allowedFileList = '';
          break;
      }


    }
  }

  generateDocName() {


    this.docName = this.documentData.document_name;
  }

  openUploadWindow() {
    // this.fileUploader.nativeElement.click();
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
  }

  extSelected() {
    // this.fileUploader.nativeElement.click();
    if (this.selectedFileType) {
      switch (this.selectedFileType) {
        case 'docper':
          return this.docper;
        case 'image':
          return this.img;
        case 'video':
          return this.vid;
      }
    }
  }

  addFile(fileInput: Event) {
    // this.isWaitingForResponse = true;
    // this.selectedFile = (<HTMLInputElement>fileInput.target).files[0];

    const acceptable = this.extSelected();
    const tempFile = (<HTMLInputElement>fileInput.target).files[0];
    const fileType = this.utilService.getFileExtension(tempFile.name).toLocaleLowerCase();
    if (acceptable.includes(fileType)) {
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
        type: 'warning',
        title: this.translate.instant('EXT_NOT_ACCEPT.TITLE'),
        html: this.translate.instant('EXT_NOT_ACCEPT.TEXT'),
        confirmButtonText: this.translate.instant('EXT_NOT_ACCEPT.BUTTON'),
        allowOutsideClick: false,
      });
    }


    // this.isWaitingForResponse = false;
  }

  removeFile() {
    this.selectedFile = null;
    this.uploadDocForm.get('s3_file_name').patchValue('');
    this.fileUploaderDoc.nativeElement.value = null;
    this.fileUploaderImg.nativeElement.value = null;
    this.fileUploaderVid.nativeElement.value = null;


  }

  closeDialog() {
    this.dialogref.close();
  }

  uploadFile() {
    // convert selectedFile size in byte to GB by dividing the value by 1e+9

    if (!this.selectedFile && this.uploadDocForm.get('s3_file_name')) {
      this.updateAcadDoc();
    } else {
      const selectedFileSizeInGb = this.selectedFile.size / 1000000000;
      if (selectedFileSizeInGb < 1) {
        this.isWaitingForResponse = true;
        this.subs.sink = this.fileUploadService.singleUpload(this.selectedFile).subscribe(
          (resp) => {
            this.isWaitingForResponse = false;
            if (resp && resp.s3_file_name) {
              this.uploadDocForm.get('s3_file_name').setValue(resp.s3_file_name);
              this.updateAcadDoc();
            } else {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('FILE_UPLOAD_FAIL.TITLE'),
                html: this.translate.instant('FILE_UPLOAD_FAIL.TEXT'),
                confirmButtonText: this.translate.instant('FILE_UPLOAD_FAIL.BUTTON'),
              });
            }
          },
          (err) => {
            this.isWaitingForResponse = false;
            Swal.fire({
              type: 'error',
              title: this.translate.instant('FILE_UPLOAD_FAIL.TITLE'),
              html: this.translate.instant('FILE_UPLOAD_FAIL.TEXT'),
              confirmButtonText: this.translate.instant('FILE_UPLOAD_FAIL.BUTTON'),
            });
          },
        );
      } else {
        // all of code in else is only sweet alert and removing invalid file
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('UPLOAD_RESTRICT_TO_FILESIZE.TITLE'),
          html: this.translate.instant('UPLOAD_RESTRICT_TO_FILESIZE.TEXT'),
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
              confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
              allowOutsideClick: false,
            });
          }
        });
      }
    }
  }

  updateAcadDoc() {
    // call mutation create acad doc
    this.isWaitingForResponse = true;
    const payload = _.cloneDeep(this.uploadDocForm.value);
    this.subs.sink = this.acadKitService.updateAcadDoc(this.docId, payload).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        this.uploadedDocId = resp._id;
        this.dialogref.close(true);
      },
      (err) => {
        this.swalError(err);
      },
    );
  }

  swalError(err) {
    this.isWaitingForResponse = false;

    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: 'OK',
    });
  }

  initFilterIndustry() {
    // ************ Populate the dropdown of industry
    this.industryList = this.utilService.getIndustryList();
    this.filteredIndustry = of(this.industryList);

    this.subs.sink = this.industryCtrl.valueChanges.pipe().subscribe((input) => {
      if (typeof input === 'string' && input.length >= 3) {
        const result = this.industryList.filter((industry) =>
          this.utilService
            .simplifyRegex(this.translate.instant('INDUSTRYLIST.' + industry))
            .includes(this.utilService.simplifyRegex(input)),
        );

        this.filteredIndustry = of(result);
      } else if (!input) {
        this.filteredIndustry = of(this.industryList);
      }
    });
  }

  selectIndustry(industry) {
    this.uploadDocForm.get('document_industry').patchValue(industry);
  }

  displayIndustrySelected(industrySelected): string {
    if (industrySelected) {
      return this.translate.instant('INDUSTRYLIST.' + industrySelected);
    } else {
      return '';
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
