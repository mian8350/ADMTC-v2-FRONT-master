import { Component, OnInit, ViewChild, Inject, ElementRef, AfterViewChecked, Renderer2, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormControl } from '@angular/forms';
import { TestService } from 'app/service/test/test.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { FileUploader } from 'ng2-file-upload';
import { DateAdapter, MatOption } from '@angular/material/core';
import { MatSelectChange } from '@angular/material/select';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Test } from 'app/models/test.model';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TestCreationService } from 'app/service/test/test-creation.service';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import * as _ from 'lodash';
import * as moment from 'moment';
import { AddedDocumentData } from 'app/test/test-creation/test-creation.model';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { MatSelect } from '@angular/material/select';

@Component({
  selector: 'ms-uploaded-document-dialog',
  templateUrl: './uploaded-document-dialog.component.html',
  styleUrls: ['./uploaded-document-dialog.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class UploadedDocumentDialogComponent implements OnInit, AfterViewChecked, OnDestroy {
  private subs = new SubSink();
  @ViewChild('testTimeDiv', { static: false }) testTimeDiv: ElementRef;
  @ViewChild('testTimeDivRelative', { static: false }) testTimeDivRelative: ElementRef;
  @ViewChild('uploadFileControlDoc', { static: false }) uploadInputDoc: any;
  @ViewChild('uploadFileControlImg', { static: false }) uploadInputImg: any;
  @ViewChild('uploadFileControlVid', { static: false }) uploadInputVid: any;
  @ViewChild('uploadFileControlWho') uploadFileControlWho: MatSelect;
  form: UntypedFormGroup;
  expectedForm: UntypedFormGroup;
  mdDate: any;
  fileTemp: any;
  uploadedFile: any;
  fileName: string;
  newDoc = false;
  relativeDate = false;
  docRelativeDate = false;
  test = new Test();
  today: any;
  isFileUploaded = false;
  resultTemp: any;
  type = {
    pfe: 'PFE',
    oral: 'Oral',
    ecrit: 'Ecrit',
    interro: 'Interro',
  };
  types = [
    {
      value: 'Guidelines',
      view: 'Guidelines',
    },
    {
      value: 'Notification to Student',
      view: 'Notification to Student',
    },
    {
      value: 'Other',
      view: 'Other',
    },
    {
      value: 'Scoring Rules',
      view: 'Scoring Rules',
    },
    {
      value: 'Test',
      view: 'Test',
    }
  ];
  userTypePC = [];
  uploader: FileUploader = new FileUploader({
    url: '',
    isHTML5: true,
    disableMultipart: false,
  });
  sliderRelative = new UntypedFormControl(false);
  isEditedFileDeleted = false;
  private timeOutVal: any;
  isWaitingForResponse = false;
  backupName = '';

  fileTypes = [];
  fileTypesControl = new UntypedFormControl('');
  selectedFileType = '';
  selectedMaxSize = 0;

  allSelected = false;

  constructor(
    private fb: UntypedFormBuilder,
    private testService: TestService,
    private translate: TranslateService,
    private fileUploadService: FileUploadService,
    public dialogRef: MatDialogRef<UploadedDocumentDialogComponent>,
    private testCreationService: TestCreationService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private acadKitService: AcademicKitService,
    private utilService: UtilityService,
    private dateAdapter: DateAdapter<Date>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    el: ElementRef,
    private renderer: Renderer2,
  ) {
    const testData = this.testCreationService.getTestCreationDataWithoutSubscribe();
    this.form = this.fb.group({
      type_of_document: ['', Validators.required],
      document_name: ['', [Validators.required, Validators.minLength(2), removeSpaces]],
      parent_folder: [testData.parent_category, Validators.required],
      parent_rncp_title: [testData.parent_rncp_title, Validators.required],
      parent_test: [testData._id, Validators.required],
      document_generation_type: ['uploadedFromTestCreation'],
      s3_file_name: [''],
      publication_date: this.fb.group({
        type: [''],
        before: [null],
        day: [null],
        relative_time: [''],
        publication_date: this.fb.group({
          date: [''],
          time: [''],
        }),
      }),
      selectFiles: [''],
      published_for_user_types_id: new UntypedFormControl('', Validators.required),
    });

    if (this.data) {

      if (this.data.type && this.data.type === 'edit') {
        this.patchDocumentEditIntoForm(this.data.documentData);
      }
    }
  }

  patchDocumentEditIntoForm(documentData: AddedDocumentData) {
    // Create array of userTypes to patch into the form
    const userTypes = [];
    if (documentData.published_for_user_types_id && documentData.published_for_user_types_id.length) {
      documentData.published_for_user_types_id.forEach((userType) => {
        userTypes.push(userType._id);
      });
    }
    // Format the data to match the formcontrol
    const formattedData = {
      type_of_document: documentData.type_of_document,
      document_name: documentData.document_name,
      s3_file_name: documentData.s3_file_name,
      publication_date: {
        type: documentData.publication_date.type,
        before: documentData.publication_date.before,
        day: documentData.publication_date.day,
        publication_date: {
          date: this.parseStringDatePipe.transformStringToDate(
            this.parseUTCToLocalPipe.transformDate(
              documentData.publication_date.publication_date.date,
              documentData.publication_date.publication_date.time,
            ),
          ),
          time: this.parseUTCToLocalPipe.transform(documentData.publication_date.publication_date.time),
        },
        relative_time: this.parseUTCToLocalPipe.transform(documentData.publication_date.relative_time),
      },
      published_for_user_types_id: userTypes,
    };
    // patch into the form
    this.form.patchValue(formattedData);
    this.backupName = this.form.get('s3_file_name').value;

    const extension = this.utilService.getFileExtension(this.form.get('s3_file_name').value).toLocaleLowerCase();
    const fileType = this.utilService.getFileTypeFromExtension(extension);

    this.fileTypesControl.setValue(fileType);
    this.selectedFileType = fileType;

    // Change validators based on the type of publication_date
    if (this.form.get('publication_date').get('type').value === 'relative') {
      this.sliderRelative.patchValue(true);
    } else {
      this.sliderRelative.patchValue(false);
    }
    this.changeValidators();
  }

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.today = new Date();
    this.mdDate = this.getDate();
    this.subs.sink = this.testService.getTest().subscribe((test) => {
      this.test = test;
    });
    this.getUserTypePC();
    this.changeValidators();

    // sort fileTypes alphabetically
    let fileTypes = this.acadKitService.getFileTypes();
    fileTypes = fileTypes.sort((a, b) => a.name.localeCompare(b.name));
    
    this.fileTypes = fileTypes;
  }

  ngAfterViewChecked() {
    if (this.testTimeDiv && this.testTimeDiv.nativeElement) {
      const hostElem = this.testTimeDiv.nativeElement;
      this.renderer.setStyle(hostElem.children[0].children[0].children[0].children[1], 'align-self', 'end');
    }
    if (this.testTimeDivRelative && this.testTimeDivRelative.nativeElement) {
      const hostElem = this.testTimeDivRelative.nativeElement;
      this.renderer.setStyle(hostElem.children[0].children[0].children[0].children[1], 'align-self', 'end');
    }
  }

  getUserTypePC() {
    this.subs.sink = this.testCreationService.getAllUserTypePC().subscribe((response) => {
      if (response && response.length) {
        this.userTypePC = _.filter(response, (usertype) => usertype.name !== 'Online_Student');
      }
      // ********** new requirement to add certifier admin to list (AV-2382)
      this.testCreationService.getCertifierAdmin().subscribe((user) => {
        if (user && user[0]) {
          this.userTypePC.unshift(user[0]);
          this.userTypePC = this.userTypePC.sort((a, b) => (this.translate.instant('USER_TYPES.' + a.name) > this.translate.instant('USER_TYPES.' + b.name) ? 1 : this.translate.instant('USER_TYPES.' + b.name) > this.translate.instant('USER_TYPES.' + a.name) ? -1 : 0))
        }
      });

    });
  }

  getDate() {
    const d = new Date();
    const dformat =
      [d.getMonth() + 1, d.getDate(), d.getFullYear()].join('/') + ' ' + [d.getHours(), d.getMinutes(), d.getSeconds()].join(':');
    return dformat;
  }

  changeDateTypeForDocuments(event: MatSlideToggleChange) {
    this.changeValidators();
  }

  changeValidators() {
    this.docRelativeDate = this.sliderRelative.value;
    if (!this.docRelativeDate) {
      this.form.get('publication_date').get('before').patchValue(null);
      this.form.get('publication_date').get('day').patchValue(null);
      this.form.get('publication_date').get('relative_time').patchValue(null);
      this.form.get('publication_date').get('day').clearValidators();
      this.form.get('publication_date').get('before').clearValidators();
      this.form.get('publication_date').get('before').updateValueAndValidity();
      this.form.get('publication_date').get('day').clearValidators();
      this.form.get('publication_date').get('day').updateValueAndValidity();
      this.form.get('publication_date').get('relative_time').clearValidators();
      this.form.get('publication_date').get('relative_time').updateValueAndValidity();

      this.form.get('publication_date').get('publication_date').get('date').setValidators([Validators.required]);
      this.form.get('publication_date').get('publication_date').get('date').updateValueAndValidity();
      this.form.get('publication_date').get('publication_date').get('time').setValidators([Validators.required]);
      this.form.get('publication_date').get('publication_date').get('time').updateValueAndValidity();
    } else {
      this.form.get('publication_date').get('publication_date').get('date').patchValue('');
      this.form.get('publication_date').get('publication_date').get('time').patchValue('');
      this.form.get('publication_date').get('publication_date').get('date').clearValidators();
      this.form.get('publication_date').get('publication_date').get('date').updateValueAndValidity();
      this.form.get('publication_date').get('publication_date').get('time').clearValidators();
      this.form.get('publication_date').get('publication_date').get('time').updateValueAndValidity();

      this.form.get('publication_date').get('before').setValidators([Validators.required]);
      this.form.get('publication_date').get('before').updateValueAndValidity();
      this.form.get('publication_date').get('day').setValidators([Validators.required]);
      this.form.get('publication_date').get('day').updateValueAndValidity();
      this.form.get('publication_date').get('relative_time').setValidators([Validators.required]);
      this.form.get('publication_date').get('relative_time').updateValueAndValidity();
    }
  }

  checkNumberOfDays() {
    if (this.form.get('publication_date').get('day').value < 0) {
      this.form.get('publication_date').get('day').setValue(1);
    }
  }

  onFileSelected(fileInput: Event) {
    const tempFile = (<HTMLInputElement>fileInput.target).files[0];
    if (this.utilService.countFileSize(tempFile, this.selectedMaxSize)) {
      this.fileTemp = (<HTMLInputElement>fileInput.target).files[0];

      const formData = this.form.value;
      const fileName = `${formData.document_name}-Documents Ajoutés-${formData.type_of_document}-${this.data.testData.name ? this.data.testData.name : ''
        }-${this.data.rncpTitle.short_name ? this.data.rncpTitle.short_name : ''}`;

      let result: any;
      this.isWaitingForResponse = true;

      // this.isWaitingForResponse = false;
      // this.form.patchValue({ selectFiles: this.fileTemp.name });
      // const data = this.form.getRawValue();
      // result = this.dataFormattin(data, this.docRelativeDate, this.form.get('s3_file_name').value);
      // this.form.get('s3_file_name').patchValue(result.s3_file_name);
      // this.fileName = result.s3_file_name;
      // this.resultTemp = result;

      // this.isFileUploaded = true;

      this.testCreationService.acadFileUpload(this.fileTemp, fileName).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          this.form.patchValue({ selectFiles: resp.s3_file_name });
          const data = this.form.getRawValue();
          result = this.dataFormattin(data, this.docRelativeDate, resp.s3_file_name);
          this.form.get('s3_file_name').patchValue(result.s3_file_name);
          this.fileName = result.s3_file_name;
          this.resultTemp = result;

          this.isFileUploaded = true;
        },
        (error) => {

          this.fileTemp = null;
          this.clearUploadQueue();
          Swal.fire({
            type: 'error',
            title: this.translate.instant('UPLOAD_FILE_FAIL.TITLE'),
            text: this.translate.instant('UPLOAD_FILE_FAIL.TEXT'),
            confirmButtonText: this.translate.instant('UPLOAD_FILE_FAIL.BUTTON'),
            allowOutsideClick: false,
            allowEnterKey: false,
            allowEscapeKey: false,
          });
          this.isWaitingForResponse = false;
        },
      );
    } else {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('UPLOAD_RESTRICT_TO_FILESIZE_File.TITLE'),
        html: this.translate.instant('UPLOAD_RESTRICT_TO_FILESIZE_File.TEXT', { size: this.selectedMaxSize }),
        confirmButtonText: this.translate.instant('UPLOAD_RESTRICT_TO_FILESIZE_File.BUTTON'),
        allowOutsideClick: false,
      });
    }
  }

  uploadDocUploaded() {
    const data = _.cloneDeep(this.form.value);
    const userTypes = _.cloneDeep(data.published_for_user_types_id);
    delete data.selectFiles;

    // exclude "AllM" value
    data.published_for_user_types_id = data.published_for_user_types_id.filter(item => item !== 'AllM');

    if (this.docRelativeDate === false) {
      data.publication_date.type = 'fixed';
      data.publication_date.before = null;
      data.publication_date.day = null;
      const newDate = new Date(data.publication_date.publication_date.date);
      const utcDate = this.parseLocalToUTCPipe.transformDate(
        moment(newDate).format('DD/MM/YYYY'),
        data.publication_date.publication_date.time,
      );
      const utcTime = this.parseLocalToUTCPipe.transform(data.publication_date.publication_date.time);
      data.publication_date.publication_date.date = utcDate;
      data.publication_date.publication_date.time = utcTime;
    } else if (this.docRelativeDate === true) {
      data['created_at'] = new Date().toISOString();
      data.publication_date.type = 'relative';
      data.publication_date.relative_time = this.parseLocalToUTCPipe.transform(data.publication_date.relative_time);
    }

    if (this.data && this.data.type) {
      // update acad doc
      this.isWaitingForResponse = true;
      this.subs.sink = this.testCreationService.updateAcadDoc(this.data.documentData._id, data).subscribe((response) => {
        this.isWaitingForResponse = false;

        if (response) {
          // Update payload of update test
          const payload = this.testCreationService.getTestCreationDataWithoutSubscribe();
          payload.documents[this.data.index] = response._id;

          this.testCreationService.setTestCreationData(
            _.merge(_.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe()), payload),
          );
          // store document data to show in third tab
          const addedDocument = this.testCreationService.getAddedDocumentDataWithoutSubscribe();
          const tempAddedDocument = addedDocument;
          const user_type = this.getUserTypeDetail();



          tempAddedDocument[this.data.index] = response;
          this.testCreationService.setAddedDocumentData(tempAddedDocument);
        }
        this.dialogRef.close();
      });
    } else {
      // Create acad doc
      this.testCreationService.createAcadDoc(data).subscribe((response) => {

        if (response) {
          // Update payload of update test
          const payload = this.testCreationService.getTestCreationDataWithoutSubscribe();
          payload.documents.push(response._id);

          this.testCreationService.setTestCreationData(
            _.merge(_.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe()), payload),
          );
          // store document data to show in third tab
          const addedDocument = this.testCreationService.getAddedDocumentDataWithoutSubscribe();
          if (addedDocument === null) {
            const tempAddedDocument = [];
            tempAddedDocument.push(response);
            this.testCreationService.setAddedDocumentData(tempAddedDocument);
          } else {
            const tempAddedDocument = addedDocument;
            tempAddedDocument.push(response);
            this.testCreationService.setAddedDocumentData(tempAddedDocument);
          }
        }
        this.dialogRef.close();
      });
    }
  }

  getUserTypeDetail(): any {

    const userrTypeId = this.form.get('published_for_user_types_id').value;
    const tempUserDetail = [];
    if (userrTypeId && userrTypeId.length) {
      userrTypeId.forEach((id) => {
        tempUserDetail.push(_.find(this.userTypePC, (userType) => userType._id === id));
      });
    }
    return tempUserDetail;
  }

  dataFormattin(data: any, isRelative: boolean, s3_file_name: any): any {

    const final = {
      document_name: data.document_name,
      type_of_document: data.type_of_document,
      s3_file_name: s3_file_name,
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

  cancelNewDoc() {
    if (this.isFileUploaded || this.form.get('s3_file_name').value) {
      this.removeFile(true);
    } else {
      this.newDoc = false;
      this.docRelativeDate = false;
      this.clearUploadQueue();
      this.form.reset();
      this.isFileUploaded = false;
      this.dialogRef.close();
    }
  }

  cancelEditDoc() {
    if (!this.form.get('s3_file_name').value || this.backupName !== this.form.get('s3_file_name').value) {
      this.removeFile();
    }
    this.newDoc = false;
    this.docRelativeDate = false;
    this.clearUploadQueue();
    this.form.reset();
    this.isFileUploaded = false;
    this.dialogRef.close();
  }

  clearUploadQueue() {
    this.uploader.clearQueue();
    this.uploadInputDoc.nativeElement.value = '';
    this.uploadInputImg.nativeElement.value = '';
    this.uploadInputVid.nativeElement.value = '';
  }

  removeFile(closeDialog = false) {
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
        if (this.data.type) {
          this.subs.sink = this.fileUploadService.deleteFileUpload(this.form.get('s3_file_name').value).subscribe();
          this.isEditedFileDeleted = true;
          this.form.get('s3_file_name').patchValue('');
        } else {
          this.subs.sink = this.fileUploadService.deleteFileUpload(this.form.get('s3_file_name').value).subscribe();
          this.isFileUploaded = false;
          this.form.get('s3_file_name').patchValue('');
          this.clearUploadQueue();
        }
        Swal.fire({
          type: 'success',
          title: this.translate.instant('EVENT_S1.TITLE'),
          html: this.translate.instant('File deleted'),
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
        }).then(() => {
          if (closeDialog) {
            this.dialogRef.close();
          }
        });
      }
    });
  }

  isUploadButtonDisabled() {
    if (this.form.valid) {
      return false;
    }
    return true;
  }

  isFormEditedButFileNotExist() {
    let result = false;
    if (this.data.type && this.form.get('s3_file_name').value && !this.isEditedFileDeleted) {
      result = false;
    } else if (this.data.type && (!this.form.get('s3_file_name').value || this.isEditedFileDeleted)) {
      result = true;
    } else {
      result = false;
    }
    return result;
  }

  openUploadWindow() {
    if (this.selectedFileType) {
      switch (this.selectedFileType) {
        case 'docper':
          this.uploadInputDoc.nativeElement.click();
          this.selectedMaxSize = 0;
          break;
        case 'image':
          this.uploadInputImg.nativeElement.click();
          this.selectedMaxSize = 50;
          break;
        case 'video':
          this.uploadInputVid.nativeElement.click();
          this.selectedMaxSize = 200;
          break;
      }
    }
    // this.fileUploader.nativeElement.click();
  }

  setFileType(data: MatSelectChange) {
    this.selectedFileType = data.value;
  }

  close() {
    this.dialogRef.close();
  }

  inputName(event) {
    this.form.get('document_name').markAsTouched();
    this.form.get('document_name').markAsDirty();
  }

  // *************** If Date is picked and time is not yet, it will auto populate time to be 07:00
  datePicked() {
    if (
      this.form.get('publication_date').get('publication_date').get('date').value &&
      !this.form.get('publication_date').get('publication_date').get('time').value
    ) {
      this.form.get('publication_date').get('publication_date').get('time').patchValue('07:00');
    }
  }

  toggleAllSelection() {
    if (this.allSelected) {
      this.uploadFileControlWho.options.forEach((item: MatOption) => item.deselect());
      this.allSelected = false;
    } else {
      this.uploadFileControlWho.options.forEach((item: MatOption) => {
        if (item.value !== null) {
          item.select();
        }

        if (item.value === null) {
          item.deselect()
        }
      });
      this.allSelected = true;
    }
  }

  selectItem() {
    this.uploadFileControlWho.options.forEach((item: MatOption) => {  
      if (item.value === 'AllM' || item.value === null) {
        item.deselect()
      }
    });
    this.allSelected = false;
  }

  // unSelectedAllItems() {
  //   this.uploadFileControlWho.options.forEach((item: MatOption) => {  
  //     if (item.value !== null) {
  //       item.deselect()
  //     }
  //   });

  //   this.allSelected = false;
  // }

  sortDocumentTypeOptions() {
    const sorted = this.types.sort((a, b) => {
      const aTranslated = this.translate.instant('DOCUMENTTYPES.' + a.view.toUpperCase());
      const bTranslated = this.translate.instant('DOCUMENTTYPES.' + b.view.toUpperCase());
      
      if (aTranslated < bTranslated) {
        return -1;
      }
      
      if (aTranslated > bTranslated) {
        return 1;
      }

      return 0;
    });

    this.types = sorted;
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
