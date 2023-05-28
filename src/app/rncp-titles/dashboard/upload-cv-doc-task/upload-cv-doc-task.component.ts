import { Component, OnInit, Inject, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { SelectedTask } from '../academic-kit.model';
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

interface CvDocPayload {
  document_name: string;
  document: string;
  validation_status: string;
}

@Component({
  selector: 'ms-upload-cv-doc-task',
  templateUrl: './upload-cv-doc-task.component.html',
  styleUrls: ['./upload-cv-doc-task.component.scss'],
})
export class UploadCvDocTaskComponent implements OnInit, OnDestroy {
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

  docper = ['pdf'];
  img = ['tiff', 'pjp', 'jfif', 'gif', 'svg', 'bmp', 'png', 'jpeg', 'svgz', 'jpg', 'webp', 'ico', 'xbm', 'dib', 'tif', 'pjpeg', 'avif'];
  vid = ['ogm', 'wmv', 'mpg', 'webm', 'ogv', 'mov', 'asx', 'mpeg', 'mp4', 'm4v', 'avi'];

  studentId = '5a067bba1c0217218c75f8ab';

  allowedFileList = '';

  industryCtrl = new UntypedFormControl(null);
  industryList: any[] = [];
  filteredIndustry: Observable<any[]>;

  constructor(
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public selectedTask: SelectedTask,
    public dialogref: MatDialogRef<UploadCvDocTaskComponent>,
    private fb: UntypedFormBuilder,
    private fileUploadService: FileUploadService,
    private acadKitService: AcademicKitService,
    private testCorrectionService: TestCorrectionService,
    private utilService: UtilityService,
    private permissions: NgxPermissionsService,
  ) {}

  ngOnInit() {

    this.fileTypes = this.acadKitService.getFileTypes();
    // ************ Populate the dropdown of industry
    this.industryList = this.utilService.getIndustryList();
    this.filteredIndustry = of(this.industryList);
    this.getDocFileName();
    this.generateDocName();
    this.initUploadDocForm();
    this.populateUploadDocForm();
    this.initFilterIndustry();

    // *************** populate the file type
    if (this.selectedTask && this.selectedTask.expected_document && this.selectedTask.expected_document.file_type) {
      this.fileTypesControl.patchValue(this.selectedTask.expected_document.file_type);
      this.selectedFileType = this.selectedTask.expected_document.file_type;
      this.populateAllowedFileList();
    } else {
      this.fileTypesControl.patchValue('docper');
      this.selectedFileType = 'docper';
      this.populateAllowedFileList();
    }
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
        // case 'image':
        //   this.img.forEach((extension, index) => {
        //     if (index !== this.img.length - 1) {
        //       this.allowedFileList += '.' + extension + ', ';
        //     } else {
        //       this.allowedFileList += '.' + extension;
        //     }
        //   });
        //   break;
        // case 'video':
        //   this.vid.forEach((extension, index) => {
        //     if (index !== this.vid.length - 1) {
        //       this.allowedFileList += '.' + extension + ', ';
        //     } else {
        //       this.allowedFileList += '.' + extension;
        //     }
        //   });
        //   break;
        default:
          this.allowedFileList = '';
          break;
      }


    }
  }

  getDocFileName() {
    this.fileName = `${this.selectedTask.description ? this.selectedTask.description : ''}-${
      this.selectedTask.rncp && this.selectedTask.rncp.short_name ? this.selectedTask.rncp.short_name : ''
    }-${this.selectedTask.test && this.selectedTask.test.name ? this.selectedTask.test.name : ''}`;
  }

  generateDocName() {
    const juryProcessName = _.cloneDeep(this.selectedTask);
    if (this.selectedTask.for_each_student) {
      this.docName =
        this.translate.instant('UPLOAD') +
        ' ' +
        this.selectedTask.description +
        `${this.translate.instant('for')} ` +
        (this.selectedTask.student_id
          ? this.selectedTask.student_id.last_name +
            ' ' +
            this.selectedTask.student_id.first_name +
            ' ' +
            this.translate.instant(this.selectedTask.student_id.civility)
          : '');
    } else {
      this.docName = this.translate.instant('Grand_Oral_Improvement.'+this.selectedTask.description, {
        processName: juryProcessName?.class_id?.jury_process_name ? juryProcessName?.class_id?.jury_process_name : 'Grand Oral'
      });
    }
  }

  initUploadDocForm() {
    this.uploadDocForm = this.fb.group({
      document_name: [this.fileName ? this.fileName : ''],
      type_of_document: ['documentExpected'],
      document_generation_type: ['documentExpected'],
      s3_file_name: [''],
      parent_test: [null],
      // parent_folder: [null],
      parent_rncp_title: [null],
      parent_class_id: [[]],
      created_by: [null],
      task_id: [null],
      uploaded_for_student: [null],
      uploaded_for_group: [null],
      school_id: [null],
      document_expected_id: [null],
      document_title: [null],
      document_industry: ['none'],
    });
  }

  populateUploadDocForm() {
    if (this.selectedTask) {
      if (this.fileName) {
        this.uploadDocForm.get('document_name').setValue(this.fileName);
      }
      if (this.selectedTask.test && this.selectedTask.test._id) {
        this.uploadDocForm.get('parent_test').setValue(this.selectedTask.test._id);
      }
      // if (this.selectedTask.test && this.selectedTask.test.parent_category && this.selectedTask.test.parent_category._id) {
      //   this.uploadDocForm.get('parent_folder').setValue(this.selectedTask.test.parent_category._id);
      // }
      if (this.selectedTask.rncp && this.selectedTask.rncp._id) {
        this.uploadDocForm.get('parent_rncp_title').setValue(this.selectedTask.rncp._id);
      }
      if (this.selectedTask.class_id && this.selectedTask.class_id._id) {
        this.uploadDocForm.get('parent_class_id').setValue([this.selectedTask.class_id._id]);
      }
      if (this.selectedTask.created_by && this.selectedTask.created_by._id) {
        this.uploadDocForm.get('created_by').setValue(this.selectedTask.created_by._id);
      }
      if (this.selectedTask._id && this.selectedTask._id) {
        this.uploadDocForm.get('task_id').setValue(this.selectedTask._id);
      }
      if (this.selectedTask.school && this.selectedTask.school._id) {
        this.uploadDocForm.get('school_id').setValue(this.selectedTask.school._id);
      }
      if (this.selectedTask.expected_document_id) {
        this.uploadDocForm.get('document_expected_id').setValue(this.selectedTask.expected_document_id);
      }

      // For student
      if (
        this.selectedTask.user_selection &&
        this.selectedTask.user_selection.user_id &&
        this.selectedTask.user_selection.user_id.student_id &&
        this.selectedTask.user_selection.user_id.student_id._id
      ) {
        this.uploadDocForm.get('uploaded_for_student').setValue(this.selectedTask.user_selection.user_id.student_id._id);
      }

      // for each student
      if (this.selectedTask.for_each_student && this.selectedTask.student_id && this.selectedTask.student_id._id) {
        this.uploadDocForm.get('uploaded_for_student').setValue(this.selectedTask.student_id._id);
      }

      // for group
      if (this.selectedTask.for_each_group && this.selectedTask.test_group_id && this.selectedTask.test_group_id._id) {
        this.uploadDocForm.get('uploaded_for_group').setValue(this.selectedTask.test_group_id._id);
      }


    }
  }

  openUploadWindow() {
    // this.fileUploader.nativeElement.click();
    if (this.selectedFileType) {
      switch (this.selectedFileType) {
        case 'docper':
          this.fileUploaderDoc.nativeElement.click();
          this.selectedMaxSize = 0;
          break;
        // case 'image':
        //   this.fileUploaderImg.nativeElement.click();
        //   this.selectedMaxSize = 50;
        //   break;
        // case 'video':
        //   this.fileUploaderVid.nativeElement.click();
        //   this.selectedMaxSize = 200;
        //   break;
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


    // this.isWaitingForResponse = false;
  }

  removeFile() {
    this.selectedFile = null;
    // this.fileUploader.nativeElement.value = null;
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
            this.uploadDocForm.get('s3_file_name').setValue(resp.s3_file_name);
            this.createAcadDoc();
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

  createAcadDoc() {
    // call mutation create acad doc
    this.isWaitingForResponse = true;
    const payload = _.cloneDeep(this.uploadDocForm.value);
    if (!payload.uploaded_for_student) {
      delete payload.uploaded_for_student;
    }
    if (!payload.uploaded_for_group) {
      delete payload.uploaded_for_group;
    }
    payload.type_of_document = 'student_upload_grand_oral_cv';
    payload.document_generation_type = 'student_upload_grand_oral_cv';
    payload.jury_organization_id = this.selectedTask.jury_id && this.selectedTask.jury_id._id ? this.selectedTask.jury_id._id : null;
    this.subs.sink = this.acadKitService.createAcadDoc(payload).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        this.markTaskAsDone();
        // add document to folder 06
        this.uploadedDocId = resp._id;
      },
      (err) => {
        this.swalError(err);
      },
    );
  }

  addDocToFolder06(documentId: string) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.acadKitService
      .AddDocumentToAcadKitZeroSix(this.selectedTask.school._id, this.selectedTask.test._id, documentId)
      .subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          // update test correction
          this.submitTestCorrection();
        },
        (err) => {
          this.swalError(err);
        },
      );
  }

  submitTestCorrection() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.testCorrectionService
      .getAllTestCorrectionNonCorrector(this.selectedTask.test._id, this.selectedTask.school._id)
      .subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          if (
            this.selectedTask.user_selection &&
            this.selectedTask.user_selection.user_type_id &&
            this.selectedTask.user_selection.user_type_id.name.toLowerCase() === 'student'
          ) {
            if (this.selectedTask.test && this.selectedTask.test.group_test) {
              // if document expected task is for student in a group
              this.markTaskAsDone();
            } else {
              // if document expected task for student and not a group test, then create or update test correction
              this.createUpdateCorrection(resp);
            }
          } else if (
            this.selectedTask.user_selection &&
            this.selectedTask.user_selection.user_type_id &&
            this.selectedTask.user_selection.user_type_id.name.toLowerCase() !== 'student' &&
            this.selectedTask.for_each_student &&
            this.selectedTask.student_id &&
            this.selectedTask.student_id._id
          ) {
            // if document expected task for non-student, but for_each_student true, then create or update test correction
            this.createUpdateCorrection(resp);
          } else {
            // if document expected task for non-student and for_each_student false, then mark task as done
            this.markTaskAsDone();
          }
        },
        (err) => {
          this.swalError(err);
        },
      );
  }

  getDocExpected(testCorrection: TestCorrection): CvDocPayload[] {
    const expectedDocs: CvDocPayload[] = [];
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

  createUpdateCorrection(resp: TestCorrection[]) {
    let testCorrectionId = '';
    let expectedDocs: CvDocPayload[] = [];
    // check if student of upload expected document task already have test correction
    resp.forEach((testCorrection) => {
      if (this.selectedTask.for_each_student) {
        if (testCorrection.student && testCorrection.student._id === this.selectedTask.student_id._id) {
          testCorrectionId = testCorrection._id;
          expectedDocs = this.getDocExpected(testCorrection);
        }
      } else {
        if (testCorrection.student && testCorrection.student._id === this.selectedTask.user_selection.user_id.student_id._id) {
          testCorrectionId = testCorrection._id;
          expectedDocs = this.getDocExpected(testCorrection);
        }
      }
    });
    // set payload
    const testCorrectionPayload = {
      test: this.selectedTask.test._id,
      school_id: this.selectedTask.school._id,
      final_retake: this.selectedTask.type === 'upload_final_retake_document',
      expected_documents:
        this.selectedTask.test.date_type === 'multiple_date'
          ? // when the test is multiple date, replace the old document with the new document
            [
              {
                document_name: this.fileName,
                document: this.uploadedDocId ? this.uploadedDocId : null,
                validation_status:
                  this.permissions.getPermission('Student') || this.permissions.getPermission('Academic Director')
                    ? 'validated'
                    : 'uploaded',
              },
            ]
          : [
              ...expectedDocs,
              {
                document_name: this.fileName,
                document: this.uploadedDocId ? this.uploadedDocId : null,
                validation_status:
                  this.permissions.getPermission('Student') || this.permissions.getPermission('Academic Director')
                    ? 'validated'
                    : 'uploaded',
              },
            ],
      student: this.selectedTask.for_each_student
        ? this.selectedTask.student_id._id
        : this.selectedTask.user_selection.user_id.student_id._id,
    };
    // if already have correction, update test correction
    if (testCorrectionId) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.testCorrectionService.updateTestCorrection(testCorrectionId, testCorrectionPayload).subscribe(
        (testCorrResp) => {
          // mark task as done
          this.isWaitingForResponse = false;
          this.markTaskAsDone();
        },
        (err) => {
          this.swalError(err);
        },
      );
    } else {
      this.isWaitingForResponse = true;
      this.subs.sink = this.testCorrectionService.createTestCorrection(testCorrectionPayload).subscribe(
        (testCorrResp) => {
          // mark task as done
          this.isWaitingForResponse = false;
          this.markTaskAsDone();
        },
        (err) => {
          this.swalError(err);
        },
      );
    }
  }

  markTaskAsDone() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.testCorrectionService.markDoneTask(this.selectedTask._id, this.translate.currentLang).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'success',
          title: 'Bravo!',
          allowOutsideClick: false,
        }).then((result) => {
          this.dialogref.close(true);
          // if (result.value) {
          //   this.dialogref.close(true);
          // }
        });
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

  setFileType(data: MatSelectChange) {
    this.selectedFileType = data.value;
  }

  initFilterIndustry() {
    this.subs.sink = this.industryCtrl.valueChanges.pipe().subscribe((input) => {
      if (typeof input === 'string' && input.length >= 3) {
        const result = this.industryList.filter((industry) =>
          this.utilService
            .simplifyRegex(this.translate.instant('INDUSTRYLIST.' + industry))
            .includes(this.utilService.simplifyRegex(input)),
        );

        this.filteredIndustry = of(result);
      } else if (input.length === 0) {
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

  // addIndustry() {
  //   if (this.industryCtrl.value && this.industryCtrl.value !== '') {
  //     const firstIndustry = this.industryList.filter((industry) => industry.toLowerCase().trim().includes(this.industryCtrl.value.toLowerCase().trim()))[0];
  //     if (firstIndustry) {
  //       this.industryCtrl.setValue(firstIndustry);
  //       this.industryAutocomplete.closePanel();
  //     }
  //   }


  // }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
