import { Component, OnInit, ViewChild, Inject, ElementRef, Renderer2, AfterViewChecked, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { FileUploader } from 'ng2-file-upload';
import { Router, ActivatedRoute } from '@angular/router';
import { Test } from '../../../models/test.model';
import { ExpectedDocuments } from '../../../models/expectedDocument.model';
import { DatePipe } from '@angular/common';
import { CustomValidators } from 'ng2-validation';
import { TranslateService } from '@ngx-translate/core';
import { TestService } from '../../../service/test/test.service';
import { RNCPTitlesService } from '../../../service/rncpTitles/rncp-titles.service';
import swal from 'sweetalert2';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Document } from '../../../models/document.model';
import { FileUploadService } from '../../../service/file-upload/file-upload.service';
import { type } from 'os';
import { TestCreationService } from 'app/service/test/test-creation.service';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ExpectedDocumentDialogComponent } from './expected-document-dialog/expected-document-dialog.component';
import { UploadedDocumentDialogComponent } from './uploaded-document-dialog/uploaded-document-dialog.component';
import { SubSink } from 'subsink';
import { AddedDocumentData, DuplicateDialogData, TestCreationPayloadData } from 'app/test/test-creation/test-creation.model';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import Swal from 'sweetalert2';
import { GlobalErrorService } from 'app/service/global-error-service/global-error-service.service';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { DuplicateTestDialogComponent } from '../first-step/duplicate-test-dialog/duplicate-test-dialog.component';

@Component({
  selector: 'ms-third-step',
  templateUrl: './third-step.component.html',
  styleUrls: ['./third-step.component.scss'],
  providers: [DatePipe, ParseUtcToLocalPipe, ParseLocalToUtcPipe, ParseStringDatePipe],
})
export class ThirdStepComponent implements OnInit, OnDestroy, AfterViewChecked {
  @ViewChild('testTimeDiv', { static: false }) testTimeDiv: ElementRef;
  @ViewChild('uploadFileControl', { static: false }) uploadInput: any;
  private subs = new SubSink();
  addDocumentActive = false;
  documentAddedForm: UntypedFormGroup;
  documentAddedList = [];
  expanded = false;
  prepCenterDropdwon: any[];
  expectedDocuments: ExpectedDocuments[] = [];
  userTypes = [];
  test = new Test();
  newDoc = false;
  datePipe: DatePipe;
  newExpectedDoc = false;
  setHours = new Date(new Date().setHours(14, 0));
  //mdDate = new Date();
  mdDate: any;
  relativeDate = false;
  docRelativeDate = false;
  isStudent = false;
  expectedForm: UntypedFormGroup;
  form: UntypedFormGroup;
  // defaultDate = new Date('ddmmyyyy') + '14 00';
  rncpTitleID: any;
  fileTemp: any;
  fileUrl: any;
  documentType = {
    pfe: 'PFE',
    oral: 'Oral',
    ecrit: 'Ecrit',
    interro: 'Interro',
  };
  documentTypes = [
    {
      value: 'Guidelines',
      view: 'Guidelines',
    },
    {
      value: 'Scoring Rules',
      view: 'Scoring Rules',
    },
    {
      value: 'Notification to Student',
      view: 'Notification to Student',
    },
    {
      value: 'Test',
      view: 'Test',
    },
    {
      value: 'Other',
      view: 'Other',
    },
  ];
  userTypePC = [];
  uploader: FileUploader = new FileUploader({
    url: '',
    isHTML5: true,
    disableMultipart: false,
  });
  classID: String;
  rncpTitle: any;
  testCreationData: any;
  addedDocuments: AddedDocumentData[];
  isWaitingForResponse = false;
  isTestPublished = false;
  testProgress;
  isExpectedDocumentDone = [];
  private timeOutVal: any;
  testId = '';
  titleId = '';
  categoryId = '';
  formData: TestCreationPayloadData; // hold the form data from step 1 to step 5

  constructor(
    private fb: UntypedFormBuilder,
    private testService: TestService,
    private appService: RNCPTitlesService,
    private router: Router,
    private translate: TranslateService,
    private fileUploadService: FileUploadService,
    public testCreationService: TestCreationService,
    public dialog: MatDialog,
    private route: ActivatedRoute,
    private rncpTitlesService: RNCPTitlesService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTC: ParseLocalToUtcPipe,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    el: ElementRef,
    private renderer: Renderer2,
    private globalErrorService: GlobalErrorService,
    private acadkitService: AcademicKitService,
  ) {
    this.form = this.fb.group({
      documentType: ['', Validators.required],
      documentName: ['', [Validators.required, Validators.minLength(2)]],
      selectFiles: [''],
      publication_date: this.fb.group({
        type: [''],
        before: [null],
        day: [null],
        publication_date: this.fb.group({
          date: [''],
          time: [''],
        }),
      }),
      numberOfDays: new UntypedFormControl('', [CustomValidators.gte(0)]),
      daysBefore: new UntypedFormControl('before'),
      documentUserType: new UntypedFormControl('', Validators.required),
    });

    this.expectedForm = this.fb.group({
      documentName: new UntypedFormControl('', [Validators.required, Validators.minLength(2)]),
      documentUserType: new UntypedFormControl('', Validators.required),
      deadlineDate: ['', [CustomValidators.date, Validators.required]],
      numberOfDays: new UntypedFormControl('', [CustomValidators.gte(0)]),
      isForAllStudents: new UntypedFormControl(''),
      daysBefore: new UntypedFormControl('before'),
      docUploadDateRetakeExam: new UntypedFormControl(''),
    });
  }

  ngOnInit() {

    this.getUserTypePC();
    this.subs.sink = this.route.parent.paramMap.subscribe((params) => {
      this.titleId = params.get('titleId');
      this.categoryId = params.get('categoryId');
      this.testId = params.get('testId');
      if (this.titleId) {
        this.subs.sink = this.rncpTitlesService.getOneTitleById(this.titleId).subscribe((resp) => {
          if (resp) {
            this.rncpTitle = resp;
          }
        });
      }
    });

    this.formData = _.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe());

    this.subs.sink = this.testCreationService.testCreationData$.subscribe((resp) => {

      if (resp) {
        this.testCreationData = resp;

      }
    });

    this.subs.sink = this.testCreationService.addedDocumentData$.subscribe((AddedDocument) => {
      this.addedDocuments = AddedDocument;

    });

    // Get Test Progress
    this.subs.sink = this.testCreationService.testProgressData$.subscribe((testProgress) => {
      this.testProgress = testProgress;
      this.isExpectedDocumentDone = [];
      if (
        testProgress &&
        testProgress.document_expected_done_count &&
        testProgress.document_expected_done_count.length &&
        this.testCreationData &&
        this.testCreationData.expected_documents &&
        this.testCreationData.expected_documents.length
      ) {
        this.testCreationData.expected_documents.forEach((expectedDoc, index) => {
          this.isExpectedDocumentDone.push(false);
          const temp = _.find(
            testProgress.document_expected_done_count,
            (expectedDocTask) => expectedDocTask.document_expected_id === expectedDoc._id,
          );


          if (temp && temp.count) {
            this.isExpectedDocumentDone[index] = true;
          } else {
            this.isExpectedDocumentDone[index] = false;
          }
        });

      }
    });

    // On click continue
    this.subs.sink = this.testCreationService.updateTestContinueData$.subscribe((data) => {
      if (data === 'third') {
        this.goToFourthStep();
      }
    });

    // On click previous
    this.subs.sink = this.testCreationService.updateTestPreviousData$.subscribe((data) => {
      if (data === 'third') {
        this.goToSecondStep();
      }
    });

    // Caught error from global error handler
    this.subs.sink = this.globalErrorService.globalErrorData$.subscribe((isError) => {
      if (isError) {
        this.isWaitingForResponse = false;
        this.globalErrorService.setGlobalError(false);
      }
    });

    this.mdDate = this.getDate();

    this.datePipe = new DatePipe(this.translate.currentLang);
    this.sortDocumentType();

    this.subs.sink = this.testService.getTest().subscribe((test) => {
      this.test = test;
    });

    this.uploader.onAfterAddingFile = (file) => {
      file.withCredentials = false;
    };

    this.uploader.onErrorItem = (item, response, status, headers) => {
      swal.fire({
        title: 'Attention',
        text: this.translate.instant('TEST.ERRORS.UPLOADERROR'),
        allowEscapeKey: true,
        type: 'warning',
      });
    };

    this.uploader.onSuccessItem = (item, response, status, headers) => {
      const res = JSON.parse(response);
      if (res.status === 'OK') {
      } else {
        swal.fire({
          title: 'Attention',
          text: this.translate.instant('TEST.ERRORS.UPLOADERROR'),
          allowEscapeKey: true,
          type: 'warning',
        });
      }
      this.clearUploadQueue();
      this.form.reset();
      this.form.controls['publication_date'].setValue(new Date().toLocaleString('en-GB'));
      this.testService.updateTest(this.test);
      this.newDoc = false;
    };

    this.subs.sink = this.testService.getUserTypesByEntity().subscribe((res: any) => {
      res.data.forEach((element) => {
        this.userTypes.push(element);
      });
      this.userTypes = this.userTypes.sort(this.keysrt('name'));
    });
  }

  ngAfterViewChecked() {
    if (this.testTimeDiv && this.testTimeDiv.nativeElement) {
      const hostElem = this.testTimeDiv.nativeElement;
      this.renderer.setStyle(hostElem.children[0].children[0].children[0].children[1], 'align-self', 'end');
    }
  }

  getUserTypePC() {
    this.subs.sink = this.testCreationService.getAllUserTypePC().subscribe((response) => {
      if (response && response.length) {
        this.userTypePC = _.filter(response, (usertype) => usertype.name !== 'Online_Student');

        // Need to add certifier admin to list (RA_0176)
        this.testCreationService.getCertifierAdmin().subscribe((user) => {
          if (user && user[0] && user[0]._id) {
            this.userTypePC.unshift(user[0]);
            this.userTypePC = this.userTypePC.sort((a, b) =>
              this.translate.instant('USER_TYPES.' + a.name) > this.translate.instant('USER_TYPES.' + b.name)
                ? 1
                : this.translate.instant('USER_TYPES.' + b.name) > this.translate.instant('USER_TYPES.' + a.name)
                ? -1
                : 0,
            );
          }
        });
      }
    });
  }

  getDate() {
    const d = new Date();
    const dformat =
      [d.getMonth() + 1, d.getDate(), d.getFullYear()].join('/') + ' ' + [d.getHours(), d.getMinutes(), d.getSeconds()].join(':');
    return dformat;
  }

  uploadFile(fileUpload: HTMLInputElement) {
    fileUpload.onchange = () => {
      const file = fileUpload.files[0];

      let publication_dateObject: any;
      if (this.docRelativeDate === true) {
        publication_dateObject = {
          type: 'relative',
          before: this.form.get('daysBefore').value === 'after' ? false : true,
          days: this.form.get('numberOfDays') ? this.form.get('numberOfDays').value : 10,
        };
      } else {
        const getDate: Date = this.form.get('publication_date').value ? this.form.get('publication_date').value : this.mdDate;

        const publication_dateObj = {
          year: getDate.getFullYear(),
          month: getDate.getMonth() + 1,
          date: getDate.getDate(),
          hour: getDate.getHours(),
          minute: getDate.getMinutes(),
          timeZone: getDate.getTimezoneOffset().toString(),
        };
        publication_dateObject = {
          type: 'fixed',
          publication_date: publication_dateObj,
        };
      }
    };
    fileUpload.click();
  }

  keysrt(key) {
    return function (a, b) {
      if (a[key] > b[key]) return 1;
      if (a[key] < b[key]) return -1;
      return 0;
    };
  }

  sortDocumentType() {
    this.documentTypes = this.documentTypes.sort(this.keysrt('view'));
  }

  getDocType(val) {
    const view = this.documentTypes.find((doc) => {
      return (doc.value = val);
    }).value;
    return this.translate.instant('DOCUMENTTYPES.' + view.toUpperCase());
  }

  openUploadWindow() {
    if (this.form.valid) {
      this.uploadInput.nativeElement.click();
    } else {
      this.form.controls['documentName'].markAsTouched();
      this.form.controls['documentType'].markAsTouched();
    }
  }

  removeDocument(index: number, document: any) {
    swal
      .fire({
        title: 'Attention',
        text: this.translate.instant('CONFIRMDELETE', {
          value: this.translate.instant('DOCUMENT.THISDOCUMENT'),
        }),
        type: 'question',
        showCancelButton: true,
        allowEscapeKey: true,
        confirmButtonText: this.translate.instant('YES'),
        cancelButtonText: this.translate.instant('NO'),
      })
      .then((result) => {
        if (result.value) {
          swal.fire('Deleted!', 'Your file has been deleted.', 'success');
          this.test.documents.splice(index, 1);
          this.testService.updateTest(this.test);
        }
      });
  }

  removeAddDocument(index: number, document: any) {

    let timeDisabled = 5;
    Swal.fire({
      text: this.translate.instant('CONFIRMDELETE', {
        value: this.translate.instant('DOCUMENT.THISDOCUMENT'),
      }),
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
        // delete file of acad doc first
        this.subs.sink = this.fileUploadService.deleteFileUpload(document.s3_file_name).subscribe();

        // delete the acad doc
        this.subs.sink = this.acadkitService.deleteAcadDoc(document._id).subscribe((res) => {});

        // delete from test creation service
        const payloadTest = this.testCreationService.getTestCreationDataWithoutSubscribe();
        payloadTest.documents.splice(index, 1);
        this.testCreationService.setTestCreationData(payloadTest);

        // Delete from added document service
        const addedDocumentData = this.testCreationService.getAddedDocumentDataWithoutSubscribe();
        addedDocumentData.splice(index, 1);
        this.testCreationService.setAddedDocumentData(addedDocumentData);
        Swal.fire({
          type: 'success',
          title: this.translate.instant('EVENT_S1.TITLE'),
          html: this.translate.instant('Added document deleted'),
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
        });
      }
    });
  }

  removeExpectedDocument(documentData, index: number) {
    let timeDisabled = 5;
    Swal.fire({
      title: 'Attention',
      text: this.translate.instant('CONFIRMDELETE', {
        value: this.translate.instant('DOCUMENT.THISDOCUMENT'),
      }),
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
        const payload = this.testCreationService.getTestCreationDataWithoutSubscribe();
        payload.expected_documents.splice(index, 1);

        this.testCreationService.setTestCreationData(payload);
        Swal.fire({
          type: 'success',
          title: this.translate.instant('EVENT_S1.TITLE'),
          html: this.translate.instant('diploma deleted'),
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          allowOutsideClick: false,
        }).then((result) => {
          if (result.value) {
          }
        });
      }
    });
  }

  upload() {
    if (this.form.valid) {
      const self = this;
      let timeDisabledinSec = 6;
      swal
        .fire({
          title: this.translate.instant('EXPECTED_DOC_TASK_UPLOAD_WARNING.TITLE', { testName: this.test.name }),
          text: this.translate.instant('EXPECTED_DOC_TASK_UPLOAD_WARNING.TEXT'),
          type: 'warning',
          allowEscapeKey: false,
          allowOutsideClick: false,
          showCancelButton: true,
          confirmButtonText: this.translate.instant('EXPECTED_DOC_TASK_UPLOAD_WARNING.OK_IN', { timer: timeDisabledinSec }),
          cancelButtonText: this.translate.instant('EXPECTED_DOC_TASK_UPLOAD_WARNING.NO'),
          onOpen: () => {
            swal.disableConfirmButton();
            const confirmButtonRef = swal.getConfirmButton();

            // TimerLoop for derementing timeDisabledinSec
            const timerLoop = setInterval(() => {
              timeDisabledinSec -= 1;
              confirmButtonRef.innerText = this.translate.instant('EXPECTED_DOC_TASK_UPLOAD_WARNING.OK_IN', { timer: timeDisabledinSec });
            }, 1000);
            setTimeout(() => {
              confirmButtonRef.innerText = 'OK';
              swal.enableConfirmButton();
              clearTimeout(timerLoop);
            }, timeDisabledinSec * 1000);
          },
        })
        .then(
          function (isConfirm) {
            self.uploader.queue[0].upload();
          },
          function (dismiss) {
            self.clearUploadQueue();
          }.bind(this),
        );
    } else {
      this.form.controls['documentName'].markAsTouched();
      this.form.controls['documentType'].markAsTouched();
    }
  }

  clearUploadQueue() {
    this.uploader.clearQueue();
    this.uploadInput.nativeElement.value = '';
  }

  getDocumentUserType(documentUserType) {
    if (documentUserType.name) {
      return documentUserType.name;
    } else {
      for (const element of this.userTypes) {
        if (element._id === documentUserType) {
          return element.name;
        }
      }
    }
  }

  passExpectedFormData() {
    if (this.expectedForm.value.documenName !== '' && this.expectedForm.value.documenUserType !== '') {
      if (this.expectedForm.value.documenName !== null && this.expectedForm.value.documenUserType !== null) {
        if (!this.relativeDate) {
          const expectedDocuments: ExpectedDocuments = {
            document_name: this.expectedForm.value.documentName,
            document_user_type: this.expectedForm.value.documentUserType,
            is_for_all_student: this.expectedForm.value.isForAllStudents ? true : false,
            deadline_date: {
              type: 'fixed',
              deadline: this.expectedForm.value.deadlineDate.toISOString(),
            },
            doc_upload_date_retake_exam: this.expectedForm.value.deadlineDate.toISOString(),
          };
          this.test.expected_documents.push(expectedDocuments);

          this.testService.updateTest(this.test);
          this.newExpectedDoc = false;
          this.expectedForm.reset();
        } else {
          const expectedDocuments: ExpectedDocuments = {
            document_name: this.expectedForm.value.documentName,
            document_user_type: this.expectedForm.value.documentUserType,
            is_for_all_student: this.expectedForm.value.isForAllStudents ? true : false,
            deadline_date: {
              type: 'relative',
              before: this.expectedForm.value.daysBefore === 'before',
              day: this.expectedForm.value.numberOfDays,
            },
            doc_upload_date_retake_exam: new Date().toString(),
          };
          this.test.expected_documents.push(expectedDocuments);

          this.testService.updateTest(this.test);
          this.newExpectedDoc = false;
          this.expectedForm.reset();
        }
      }
      this.expectedForm.reset();
    }
  }

  addNewDoc() {
    const dialogRef = this.dialog.open(UploadedDocumentDialogComponent, {
      width: '800px',
      minHeight: '100px',
      panelClass: 'certification-rule-pop-up',
      disableClose: true,
      data: { rncpTitle: this.rncpTitle, testData: this.testCreationData },
    });
    dialogRef.afterClosed().subscribe((result) => {});
  }

  editAddedDocument(index: number, document) {
    const dialogRef = this.dialog.open(UploadedDocumentDialogComponent, {
      width: '800px',
      minHeight: '100px',
      panelClass: 'certification-rule-pop-up',
      disableClose: true,
      data: { rncpTitle: this.rncpTitle, testData: this.testCreationData, type: 'edit', index: index, documentData: document },
    });
    this.subs.sink = dialogRef.afterClosed().subscribe((result) => {});
  }

  cancelNewDoc() {
    this.newDoc = false;
    this.docRelativeDate = false;
    this.clearUploadQueue();
    this.form.reset();
  }

  addNewExpectedDoc() {
    // this.newExpectedDoc = true;
    const dialogRef = this.dialog.open(ExpectedDocumentDialogComponent, {
      width: '800px',
      minHeight: '100px',
      panelClass: 'certification-rule-pop-up',
      disableClose: true,
    });
    this.subs.sink = dialogRef.afterClosed().subscribe((result) => {});
  }

  editExpectedDocument(index: number, document) {

    const dialogRef = this.dialog.open(ExpectedDocumentDialogComponent, {
      width: '800px',
      minHeight: '100px',
      panelClass: 'certification-rule-pop-up',
      disableClose: true,
      data: { type: 'edit', index: index, documentData: document },
    });
    this.subs.sink = dialogRef.afterClosed().subscribe((result) => {});
  }

  cancelNewExpectedDoc() {
    this.newExpectedDoc = false;
    this.expectedForm.reset();
    this.expectedForm.patchValue({
      daysBefore: 'before',
    });
    this.relativeDate = false;
    this.form.controls['publication_date'].setValue(new Date().toLocaleString('en-GB'));
    this.isStudent = false;
  }

  click(event) {

  }

  changeDateTypeForDocuments(event: MatSlideToggleChange) {

    this.docRelativeDate = event.checked;
    if (!this.docRelativeDate) {
      this.form.value.publication_date = this.mdDate;
      this.form = this.fb.group({
        documentName: new UntypedFormControl(this.form.value.documentName, [Validators.required, Validators.minLength(2)]),
        documentType: new UntypedFormControl(this.form.value.documentType, Validators.required),
        publication_date: new UntypedFormControl(this.mdDate, [CustomValidators.date, Validators.required]),
      });
    } else {
      this.form = this.fb.group({
        documentName: new UntypedFormControl(this.form.value.documentName, [Validators.required, Validators.minLength(2)]),
        documentType: new UntypedFormControl(this.form.value.documentType, Validators.required),
        numberOfDays: new UntypedFormControl('', [CustomValidators.gte(0), Validators.required]),
        daysBefore: new UntypedFormControl('before'),
        publication_date: new UntypedFormControl(this.mdDate),
      });
    }
  }

  changeDateType(event: MatSlideToggleChange) {
    this.relativeDate = event.checked;

    if (!this.relativeDate) {
      this.expectedForm = this.fb.group({
        documentName: new UntypedFormControl(this.expectedForm.value.documentName, [Validators.required, Validators.minLength(2)]),
        documentUserType: new UntypedFormControl(this.expectedForm.value.documentUserType, Validators.required),
        isForAllStudents: new UntypedFormControl(this.expectedForm.value.isForAllStudents, Validators.required),
        deadlineDate: new UntypedFormControl('', [CustomValidators.date, Validators.required]),
        docUploadDateRetakeExam: this.expectedForm.value.docUploadDateRetakeExam,
      });
    } else {
      this.expectedForm = this.fb.group({
        documentName: new UntypedFormControl(this.expectedForm.value.documentName, [Validators.required, Validators.minLength(2)]),
        documentUserType: new UntypedFormControl(this.expectedForm.value.documentUserType, Validators.required),
        isForAllStudents: new UntypedFormControl(this.expectedForm.value.isForAllStudents, Validators.required),
        numberOfDays: new UntypedFormControl('', [CustomValidators.gte(0), Validators.required]),
        daysBefore: new UntypedFormControl('before'),
        docUploadDateRetakeExam: this.expectedForm.value.docUploadDateRetakeExam,
      });
    }
  }

  checkNumberOfDays() {
    if (this.expectedForm.value.numberOfDays < 0) {
      this.expectedForm.patchValue({
        numberOfDays: 0,
      });
    }
  }

  checkNumberOfDaysForDocuments() {
    if (this.form.value.numberOfDays < 0) {
      this.form.patchValue({
        numberOfDays: 0,
      });
    }
  }

  checkIfStudent(name: string, isSystemType) {
    if (!this.test.group_test) {
      if (name === ('STUDENT' || 'étudiant'.toUpperCase()) && isSystemType === true) {
        this.isStudent = false;
        this.expectedForm.value.isForAllStudents = false;
        this.expectedForm.controls['isForAllStudents'].setValue(false);
      } else {
        this.isStudent = true;
        this.expectedForm.value.isForAllStudents = true;
        this.expectedForm.controls['isForAllStudents'].setValue(true);
      }
    } else {
      this.expectedForm.value.isForAllStudents = false;
      this.expectedForm.controls['isForAllStudents'].setValue(false);
    }
  }

  getTranslateADMTCSTAFFKEY(name) {
    if (name) {
      name = name.first_name + name.last_name;
      const value = this.translate.instant('ADMTCSTAFFKEY.' + name.toUpperCase());
      return value !== 'ADMTCSTAFFKEY.' + name.toUpperCase() ? value : name;
    }
  }

  getTranslatedDate(dateRaw) {
    if (dateRaw && dateRaw.date && dateRaw.time) {
      return this.parseUTCtoLocal.transformDate(dateRaw.date, dateRaw.time);
    } else if (typeof dateRaw === 'object') {
      const date = new Date(dateRaw.year, dateRaw.month, dateRaw.date, dateRaw.hour, dateRaw.minute);
      this.datePipe = new DatePipe(this.translate.currentLang);
      return this.datePipe.transform(date, 'EEE d MMM, y');
    } else {
      let date = dateRaw;
      if (typeof date === 'number') {
        date = date.toString();
      }
      if (date.length === 8) {
        const year: number = parseInt(date.substring(0, 4));
        const month: number = parseInt(date.substring(4, 6));
        const day: number = parseInt(date.substring(6, 8));
        date = new Date(year, month, day);
      }
      this.datePipe = new DatePipe(this.translate.currentLang);
      return this.datePipe.transform(date, 'EEE d MMM, y');
    }
  }

  getTranslatedDateExpected(dateRaw) {
    if (dateRaw && dateRaw.date && dateRaw.time) {
      return this.parseUTCtoLocal.transformDate(dateRaw.date, dateRaw.time);
    } else {
      return this.parseStringDatePipe.transformStringToDate(dateRaw);
    }
  }

  getTranslatedTime(time) {
    if (time) {
      return this.parseUTCtoLocal.transform(time);
    } else {
      return '';
    }
  }

  getTranslateTestDate(date) {
    if (date && date.date_utc && date.time_utc) {
      return this.parseUTCtoLocal.transformDate(date.date_utc, date.time_utc);
    } else {
      return this.parseStringDatePipe.transformStringToDate(date);
    }
  }

  expand(event: boolean) {
    this.expanded = event;
  }

  onFileSelected(fileInput: Event) {
    this.fileTemp = (<HTMLInputElement>fileInput.target).files[0];

  }

  uploadDocUploaded() {

    let result: any;
    const formData = this.form.value;
    const fileName = `${formData.documentName}-Documents Ajoutés-${formData.documentType}-${
      this.rncpTitle.short_name ? this.rncpTitle.short_name : ''
    }-${this.testCreationData.name ? this.testCreationData.name : ''}`;

    this.subs.sink = this.testCreationService.acadFileUpload(this.fileTemp, fileName).subscribe((resp) => {
      this.form.patchValue({ selectFiles: this.fileTemp.name });
      const data = this.form.getRawValue();
      result = this.dataFormatting(data, this.docRelativeDate, resp.file_url, resp.file_name);
      const fileName = result.file_name;
      const resultTemp = result;

      // this.isFileUploaded = true;

      const testData = this.testCreationService.getTestCreationDataWithoutSubscribe();

      const acadDocumentInput = {
        parent_category: testData.parent_category,
        parent_rncp_title: testData.parent_rncp_title,
        parent_test: testData._id,
        name: resultTemp.name,
        type: resultTemp.type,
        file_path: resultTemp.file_path,
        file_name: resultTemp.file_name,
        document_type: 'uploadedFromTestCreation',
        created_at: new Date().toString(),
        publication_date: {
          type: resultTemp.publication_date.type,
          before: false,
          day: null,
          publication_date: {
            date: null,
            time: null,
          },
        },
      };
      if (this.docRelativeDate === false) {
        acadDocumentInput['publication_date']['type'] = 'fixed';
        acadDocumentInput['publication_date']['before'] = null;
        acadDocumentInput['publication_date']['day'] = null;
        const isoDate = resultTemp.publication_date.publication_date.date;
        const newDate = new Date(isoDate);

        const utcDate = this.parseLocalToUTC.transformDate(
          moment(newDate).format('DD/MM/YYYY'),
          resultTemp.publication_date.publication_date.time,
        );
        const utcTime = this.parseLocalToUTC.transform(resultTemp.publication_date.publication_date.time);
        acadDocumentInput['publication_date']['publication_date']['date'] = utcDate;
        acadDocumentInput['publication_date']['publication_date']['time'] = utcTime;
      } else if (this.docRelativeDate === true) {
        acadDocumentInput['created_at'] = new Date().toISOString();
        acadDocumentInput['publication_date']['type'] = 'relative';
        acadDocumentInput['publication_date']['day'] = data.numberOfDays;
        if (data.daysBefore === 'before') {
          acadDocumentInput['publication_date']['before'] = true;
        } else {
          acadDocumentInput['publication_date']['before'] = false;
        }
      }

      this.subs.sink = this.testCreationService.createAcadDoc(acadDocumentInput).subscribe((response) => {

        if (response) {
          // Update payload of update test
          const payload = this.testCreationService.getTestCreationDataWithoutSubscribe();
          payload.documents.push({
            doc_id: response._id,
            document_user_types: data.documentUserType,
          });

          this.testCreationService.setTestCreationData(
            _.merge(_.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe()), payload),
          );
          // store document data to show in third tab
          const addedDocument = this.testCreationService.getAddedDocumentDataWithoutSubscribe();

          if (addedDocument === null) {
            const tempAddedDocument = [];
            // const user_type = this.getUserTypeDetail();
            tempAddedDocument.push(response);
            this.testCreationService.setAddedDocumentData(tempAddedDocument);
          } else {
            const tempAddedDocument = addedDocument;
            // const user_type = this.getUserTypeDetail();
            tempAddedDocument.push(response);
            this.testCreationService.setAddedDocumentData(tempAddedDocument);
          }
          this.cancelNewDoc();
        }
      });
    });
  }

  dataFormattin(data: any, isRelative: boolean, file_url: any): any {
    let final = {
      name: data.documentName,
      type: data.documentType,
      filePath: file_url,
      fileName: data.selectFiles,
      publication_date: {},
    };
    if (isRelative) {
      if (data.daysBefore === 'before') {
        final['publication_date']['before'] = true;
      } else {
        final['publication_date']['before'] = false;
      }
      final['publication_date']['type'] = 'relative';
      final['publication_date']['days'] = data.numberOfDays;
    } else {
      (final['publication_date']['type'] = 'fixed'), (final['publication_date']['publication_date'] = data.publication_date.toISOString());
    }
    return final;
  }

  dataFormatting(data: any, isRelative: boolean, file_url: any, file_name: any): any {

    let final = {
      name: data.documentName,
      type: data.documentType,
      file_path: file_url,
      file_name: file_name,
      publication_date: {
        type: null,
        before: null,
        day: null,
        publication_date: {
          date: null,
          time: null,
        },
      },
    };
    if (isRelative) {
      if (data.daysBefore === 'before') {
        final['publication_date']['before'] = true;
      } else {
        final['publication_date']['before'] = false;
      }
      final['publication_date']['type'] = 'relative';
      final['publication_date']['days'] = data.numberOfDays;
    } else {
      final['publication_date']['type'] = 'fixed';
      final['publication_date']['publication_date']['date'] = data.publication_date.publication_date.date.toISOString();
      final['publication_date']['publication_date']['time'] = data.publication_date.publication_date.time;
    }
    return final;
  }

  getUserTypeName(ID: String) {
    const filtered = _.find(this.userTypePC, (userType) => userType._id === ID);
    if (filtered && filtered.name) {
      return this.translate.instant('USER_TYPES.' + filtered.name);
    } else {
      return '';
    }
  }

  isUploadButtonDisabled() {
    if (this.form.valid) {
      return false;
    }
    return true;
  }

  getUserTypeDetail(): any {
    const userrTypeId = this.form.get('documentUserType').value;
    const tempUserDetail = [];
    if (userrTypeId && userrTypeId.length) {
      userrTypeId.forEach((id) => {
        tempUserDetail.push(_.find(this.userTypePC, (userType) => userType._id === id));
      });
    }
    return tempUserDetail;
  }

  saveTest(leave?, isPublish?: boolean) {
    const payload = _.cloneDeep(this.testCreationService.getCleanTestCreationData());
    const formData = _.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe());
    if (payload.current_tab && payload.current_tab === 'third') {
      payload.current_tab = 'fourth';
    }
    this.isWaitingForResponse = true;
    this.subs.sink = this.testCreationService.updateTest(formData._id, payload).subscribe((response) => {

      this.isWaitingForResponse = false;
      if (response) {
        const temp = this.testCreationService.getTestCreationDataWithoutSubscribe();
        if (temp && temp.expected_documents && temp.expected_documents.length) {
          temp.expected_documents.forEach((document, index) => {
            if (document && response.expected_documents && response.expected_documents.length) {
              document['_id'] = response.expected_documents[index]._id;
            }
          });
        }
        if (temp.current_tab && temp.current_tab === 'third') {
          temp.current_tab = 'fourth';
        }
        this.testCreationService.setTestCreationData(temp);
        this.testCreationService.setSavedTestCreationData(this.testCreationService.getTestCreationDataWithoutSubscribe());
        swal
          .fire({
            type: 'success',
            title: 'Bravo !',
            text: this.translate.instant('TEST.SAVE_FIRST_TAB.TITLE_CREATE'),
          })
          .then(() => {
            if (leave) {
              // this.goToSecondStep();
            } else {
              // this.reloadFirstStep();
            }
          });
      }
    });
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    this.testCreationService.removeContinueButton();
    this.testCreationService.removePreviousButton();
    this.subs.unsubscribe();
  }

  goToFourthStep() {
    const data = this.testCreationService.getTestCreationDataWithoutSubscribe();
    if (data?.parent_rncp_title && data?.parent_category && data?._id) {
      this.router.navigate(['/create-test', data.parent_rncp_title, { categoryId: data.parent_category, testId: data._id }, 'fourth']);
    }
  }

  goToSecondStep() {
    const data = this.testCreationService.getTestCreationDataWithoutSubscribe();
    if (data?.parent_rncp_title && data?.parent_category && data?._id) {
      this.router.navigate(['/create-test', data.parent_rncp_title, { categoryId: data.parent_category, testId: data._id }, 'second']);
    }
  }

  isDocumentTaskDone(expectedDocument: any) {
    if (this.testCreationData.is_published) {


    } else {
      return false;
    }
  }

  getUserTypeToolTip(document) {
    let userTypeList = '';
    if (document.published_for_user_types_id && document.published_for_user_types_id.length) {
      document.published_for_user_types_id.forEach((userType, index) => {
        let text = '';
        if (index !== document.published_for_user_types_id.length - 1) {
          text = `${this.translate.instant(userType.name)}, `;
        } else {
          text = `${this.translate.instant(userType.name)}`;
        }
        userTypeList += text;
      });
    }
    return userTypeList;
  }

  goToStep(selectedStep: string, duplicateTestId?: string, ishardRefresh?: boolean) {
    this.subs.sink = this.route.parent.paramMap.subscribe((params) => {
      const titleId = params.get('titleId');
      const categoryId = params.get('categoryId');
      const testId = params.get('testId');
      if (ishardRefresh && duplicateTestId) {
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate(['/create-test', titleId, { categoryId: categoryId, testId: testId }, selectedStep], {
            queryParams: duplicateTestId ? { duplicate: duplicateTestId } : null,
          });
        });
      } else {
        this.router.navigate(['/create-test', titleId, { categoryId: categoryId, testId: testId }, selectedStep], {
          queryParams: duplicateTestId ? { duplicate: duplicateTestId } : null,
        });
      }
    });
  }

  openDuplicateDialog() {
    const formData = _.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe());
    const dialogRef = this.dialog.open(DuplicateTestDialogComponent, {
      minWidth: '400px',
      minHeight: '100px',
      panelClass: 'certification-rule-pop-up',
      disableClose: true,
      data: {
        titleId: this.titleId,
        testId: this.testId,
        // we pass class, block, subject, and evaluation id when duplicate in edit test
        // so the duplicate target will auto populated with current test data
        classId: formData && formData.class_id ? formData.class_id : '',
        subjectId: formData && formData.subject_id ? formData.subject_id : '',
        blockId: formData && formData.block_of_competence_condition_id ? formData.block_of_competence_condition_id : '',
        evalId: formData && formData.evaluation_id ? formData.evaluation_id : '',
      },
    });
    dialogRef.afterClosed().subscribe((data: DuplicateDialogData) => {
      if (data?.duplicateFrom && this.titleId && this.categoryId) {
        if (this.testId) {
          // when duplicate in edit test page, we send testId in url
          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate(['/create-test', this.titleId, { categoryId: this.categoryId, testId: this.testId }, 'first'], {
              queryParams: this.getDuplicateUrlParam(data),
            });
          });
        } else {
          // when duplicate in create test page
          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate(['/create-test', this.titleId, { categoryId: this.categoryId }, 'first'], {
              queryParams: this.getDuplicateUrlParam(data),
            });
          });
        }
      }
    });
  }

  getFileTypeName(value) {
    const data = [
      { value: 'docper', name: 'Document/Presentation' },
      { value: 'image', name: 'Image' },
      { value: 'video', name: 'Video' },
    ];
    data.forEach((type) => {
      if (value === type.value) {
        return type.name;
      }
    });
  }

  getDuplicateUrlParam(data: DuplicateDialogData) {
    if (data && data.duplicateFrom) {
      return {
        duplicate: data.duplicateFrom,
        class: data.classId,
        block: data.blockId,
        subject: data.subjectId,
        eval: data.evalId,
      };
    } else {
      return null;
    }
  }
}
