import { Component, OnInit, Inject, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormControl, Validators } from '@angular/forms';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { TestCorrectionService } from 'app/service/test-correction/test-correction.service';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { TestCorrection } from 'app/test-correction/test-correction.model';
import { NgxPermissionsService } from 'ngx-permissions';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { of } from 'rxjs';

interface ExpectedDocPayload {
  document_name: string;
  document: string;
  validation_status: string;
}

@Component({
  selector: 'ms-upload-question-dialog',
  templateUrl: './upload-question-dialog.component.html',
  styleUrls: ['./upload-question-dialog.component.scss'],
})
export class UploadQuestionDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();

  @ViewChild('fileUploadDoc', { static: false }) fileUploaderDoc: ElementRef;
  @ViewChild('fileUploadImg', { static: false }) fileUploaderImg: ElementRef;
  @ViewChild('fileUploadVid', { static: false }) fileUploaderVid: ElementRef;

  selectedBlocId: any;
  storedS3FileName: string;
  uploadQuestionForm: UntypedFormGroup;
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

  docper = ['pdf'];
  img = ['tiff', 'pjp', 'jfif', 'gif', 'svg', 'bmp', 'png', 'jpeg', 'svgz', 'jpg', 'webp', 'ico', 'xbm', 'dib', 'tif', 'pjpeg', 'avif'];
  vid = ['ogm', 'wmv', 'mpg', 'webm', 'ogv', 'mov', 'asx', 'mpeg', 'mp4', 'm4v', 'avi'];

  studentId = '5a067bba1c0217218c75f8ab';

  allowedFileList = '';

  industryCtrl = new UntypedFormControl(null);
  industryList: any[] = [];
  filteredIndustry: Observable<any[]>;
  blocList: any[];

  constructor(
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public selectedTask: any,
    public dialogref: MatDialogRef<UploadQuestionDialogComponent>,
    private fb: UntypedFormBuilder,
    private fileUploadService: FileUploadService,
    private acadKitService: AcademicKitService,
    private testCorrectionService: TestCorrectionService,
    private utilService: UtilityService,
    private permissions: NgxPermissionsService,
  ) {}

  ngOnInit() {

    this.inituploadQuestionForm();
    this.populateBlocList();
    this.selectedFileType = 'docper';
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
        default:
          this.allowedFileList = '';
          break;
      }


    }
  }

  populateBlocList() {
    this.blocList = this.selectedTask.map(bloc => {
      const temp = Object.assign({}, bloc);
      temp.name = this.utilService.cleanHTML(temp.name);
      return temp
    });
  }
  inituploadQuestionForm() {
    this.uploadQuestionForm = this.fb.group({
      selectedBloc: ['', Validators.required],
      questionFile: [''],
      s3_file_name: ['', Validators.required],
    });
  }

  addFile(fileInput: Event) {
    const acceptable = this.extSelected();
    const tempFile = (<HTMLInputElement>fileInput.target).files[0];
    if (tempFile && tempFile.name) {
      const fileType = this.utilService.getFileExtension(tempFile.name).toLocaleLowerCase();
      if (acceptable.includes(fileType)) {
        if (this.utilService.countFileSize(tempFile, this.selectedMaxSize)) {
          this.selectedFile = (<HTMLInputElement>fileInput.target).files[0];

          this.uploadQuestionForm.get('s3_file_name').setValue(this.selectedFile.name);
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
      } else {
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('EXT_NOT_ACCEPT.TITLE'),
          html: this.translate.instant('EXT_NOT_ACCEPT.TEXT'),
          footer: `<span style="margin-left: auto">EXT_NOT_ACCEPT</span>`,
          confirmButtonText: this.translate.instant('EXT_NOT_ACCEPT.BUTTON'),
          allowOutsideClick: false,
        });
      }
    }
  }
  openUploadWindow() {
    if (this.selectedFileType) {
      switch (this.selectedFileType) {
        case 'docper':
          this.fileUploaderDoc.nativeElement.click();
          this.selectedMaxSize = 0;
          break;
      }
    }
  }
  extSelected() {
    if (this.selectedFileType) {
      switch (this.selectedFileType) {
        case 'docper':
          return this.docper;
      }
    }
  }

  removeFile() {
    this.selectedFile = null;
    this.fileUploaderDoc.nativeElement.value = null;
    this.fileUploaderImg.nativeElement.value = null;
    this.fileUploaderVid.nativeElement.value = null;
  }

  closeDialog() {
    this.dialogref.close();
  }

  uploadFile() {
    // convert selectedFile size in byte to GB by dividing the value by 1e+9
    const selectedFileSizeInGb = this.selectedFile.size / 1000000000;
    if (selectedFileSizeInGb < 1) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.fileUploadService.singleUpload(this.selectedFile).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          if (resp && resp.s3_file_name) {
            this.uploadQuestionForm.get('s3_file_name').setValue(resp.s3_file_name);
            this.saveNewQuestion();
          } else {
            Swal.fire({
              type: 'error',
              title: this.translate.instant('FILE_UPLOAD_FAIL.TITLE'),
              html: this.translate.instant('FILE_UPLOAD_FAIL.TEXT'),
              footer: `<span style="margin-left: auto">FILE_UPLOAD_FAIL</span>`,
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
            footer: `<span style="margin-left: auto">FILE_UPLOAD_FAIL</span>`,
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
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
            allowOutsideClick: false,
          });
        }
      });
    }
  }
  getDocExpected(testCorrection: TestCorrection): ExpectedDocPayload[] {
    const expectedDocs: ExpectedDocPayload[] = [];
    testCorrection.expected_documents.forEach((doc) => {
      if (doc.document && doc.document._id) {
        expectedDocs.push({
          document_name: doc.document_name,
          validation_status: doc.validation_status,
          document: doc.document._id,
        });
      }
    });
    return expectedDocs;
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

  setFileType(data: MatSelectChange) {
    this.selectedFileType = data.value;
  }

  onSelectBloc(selectedBloc: any) {
    this.selectedBlocId = selectedBloc._id;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  saveNewQuestion() {
    const s3 = this.uploadQuestionForm.get('s3_file_name').value;
    this.subs.sink = this.testCorrectionService.saveNewQuestion(s3, this.selectedBlocId).subscribe(({data, error}) => {
      if (error) {
        this.swalError(error);
        return;
      }
      Swal.fire({
        type: 'success',
        title: 'Bravo!',
        allowOutsideClick: false,
      }).then((result) => {
        this.dialogref.close(true);
      });
    })
  }
}
