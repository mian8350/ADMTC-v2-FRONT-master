import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { StudentsService } from 'app/service/students/students.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-import-student-companies-dialog',
  templateUrl: './import-student-companies-dialog.component.html',
  styleUrls: ['./import-student-companies-dialog.component.scss']
})
export class ImportStudentCompaniesDialogComponent implements OnInit, OnDestroy {
  @ViewChild('importFile', { static: false }) importFile: any;

  importForm: UntypedFormGroup;
  file: File;
  fileType: any;
  isWaitingForResponse = false;
  classType: string;

  private subs = new SubSink();
  private timeOutVal: any;

  delimeter = [
    { key: 'COMMA [ , ]', value: 'comma' },
    { key: 'SEMICOLON [ ; ]', value: 'semicolon' },
    { key: 'TAB [ ]', value: 'tab' },
  ];

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<ImportStudentCompaniesDialogComponent>,
    public translate: TranslateService,
    private utilService: UtilityService,
    private studentService: StudentsService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit() {
    this.initForm();

    if (this.data && this.data.classType) {
      this.classType = this.data.classType
    }
  }

  initForm() {
    this.importForm = this.fb.group({
      school: [this.data && this.data.schoolId ? this.data.schoolId : null, [Validators.required]],
      rncp_title: [this.data && this.data.titleId ? this.data.titleId : null, [Validators.required]],
      current_class: [this.data && this.data.classId ? this.data.classId : null, [Validators.required]],
      file_delimeter: [this.data && this.data.delimeter ? this.data.delimeter : null, [Validators.required]],
    });
  }

  handleInputChange(fileInput: Event) {
    this.isWaitingForResponse = true;
    const file = (<HTMLInputElement>fileInput.target).files[0];


    // *************** Accept Reject File Upload outside allowed accept
    const acceptable = ['csv', 'tsv'];
    const fileType = this.utilService.getFileExtension(file.name).toLocaleLowerCase();

    if (acceptable.includes(fileType)) {
      this.file = (<HTMLInputElement>fileInput.target).files[0];
      this.isWaitingForResponse = false;
    } else {
      this.file = null;
      this.isWaitingForResponse = false;
      Swal.fire({
        type: 'error',
        title: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TITLE'),
        text: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TEXT', { file_exts: '.csv, .tsv' }),
        allowEscapeKey: false,
        allowOutsideClick: false,
        allowEnterKey: false,
      });
    }
  }

  openUploadWindow() {
    this.importFile.nativeElement.click();
  }

  submit() {
    if (this.importForm.valid) {
      this.callImportAPI();
    }
  }

  callImportAPI() {
    // ************* call the actual submit
    this.isWaitingForResponse = true;
    this.subs.sink = this.studentService.importStudentCompanies(this.importForm.value, this.translate.currentLang, this.file).subscribe((resp) => {
      this.isWaitingForResponse = false;

      if (resp) {
        // If studdentcompaniesnotadded is exist, then throw error IMPORT_COM_S2 despite studentCompaniesAdded exist.
        // Only display IMPORT_COM_S1 if studentCompaniesAdded exist & there is no studdentcompaniesnotadded
        if (resp.studentCompaniesNotAdded && resp.studentCompaniesNotAdded.length) {
          Swal.fire({
            allowOutsideClick: false,
            type: 'error',
            title: this.translate.instant('IMPORT_COM_S2.TITLE'),
            html: this.translate.instant('IMPORT_COM_S2.TEXT'),
            confirmButtonText: this.translate.instant('IMPORT_COM_S2.BUTTON'),
          }).then(res => {
            this.closeDialog();
          });
        } else if (resp.studentCompaniesAdded && resp.studentCompaniesAdded) {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('IMPORT_COM_S1.TITLE'),
            html: this.translate.instant('IMPORT_COM_S1.TEXT'),
            confirmButtonText: this.translate.instant('IMPORT_COM_S1.BUTTON'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then(res => {
            this.closeDialog('success');
          });
        }
      }
    }, (err) => {
      this.swalError(err);
    });
  }

  swalError(err) {
    this.isWaitingForResponse = false;

    if (err['message'] === 'GraphQL error: Column CSV error.') {
      Swal.fire({
        allowOutsideClick: false,
        type: 'error',
        title: this.translate.instant('IMPORT_COM_S3.TITLE'),
        confirmButtonText: this.translate.instant('IMPORT_COM_S3.BUTTON'),
      }).then(res => {
        this.closeDialog();
      });
    } else if (err['message'] === 'GraphQL error: date not valid.') {
      Swal.fire({
        allowOutsideClick: false,
        type: 'error',
        title: this.translate.instant('IMPORT_COM_S4.TITLE'),
        html: this.translate.instant('IMPORT_COM_S4.TEXT'),
        confirmButtonText: this.translate.instant('IMPORT_COM_S4.BUTTON'),
      }).then(res => {
        this.closeDialog();
      });
    } else {
      Swal.fire({
        type: 'error',
        title: 'Error',
        text: err && err['message'] ? err['message'] : err,
        confirmButtonText: 'OK',
      }).then(res => {
        this.closeDialog();
      });
    }
  }

  closeDialog(resp?) {
    this.dialogRef.close({data : resp ? resp : null});
  }

  ngOnDestroy() {
      this.subs.unsubscribe();
  }

}
