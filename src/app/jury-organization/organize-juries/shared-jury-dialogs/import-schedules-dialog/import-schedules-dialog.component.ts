import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { TranscriptProcessService } from 'app/service/transcript-process/transcript-process.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { environment } from 'environments/environment';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as moment from 'moment';

@Component({
  selector: 'ms-import-schedules-dialog',
  templateUrl: './import-schedules-dialog.component.html',
  styleUrls: ['./import-schedules-dialog.component.scss'],
})
export class ImportSchedulesDialogComponent implements OnInit {
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

  isFileUploaded = true;

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<ImportSchedulesDialogComponent>,
    private rncpTitleService: RNCPTitlesService,
    public translate: TranslateService,
    private utilService: UtilityService,
    private transcriptService: TranscriptProcessService,
    private juryOrganizationService: JuryOrganizationService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit() {
    this.initForm();

  }

  initForm() {
    this.importForm = this.fb.group({
      rncp_id: [this.data && this.data.titleId ? this.data.titleId : null, [Validators.required]],
      school_id: [this.data && this.data.schoolId ? this.data.schoolId : null],
      class_id: [this.data && this.data.classId ? this.data.classId : null, [Validators.required]],
      file_delimeter: [this.data && this.data.delimeter ? this.data.delimeter : null, [Validators.required]],
      offset: moment().utcOffset(),
      jury_id: [this.data && this.data.juryId ? this.data.juryId: null]
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
      this.isFileUploaded = true;
    } else {
      this.isFileUploaded = false;
      this.file = null;
      this.isWaitingForResponse = false;
      Swal.fire({
        type: 'error',
        title: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TITLE'),
        text: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TEXT', { file_exts: '.csv, .tsv' }),
        footer: `<span style="margin-left: auto">UPLOAD_ERROR</span>`,
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
    if (this.importForm.invalid || !this.file) {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        footer: `<span style="margin-left: auto">FormSave_S1</span>`,
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
      if (!this.file) {
        this.isFileUploaded = false;
      } else {
        this.isFileUploaded = true;
      }
    } else {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('RGO_S7.TITLE'),
        html: this.translate.instant('RGO_S7.TEXT'),
        footer: `<span style="margin-left: auto">RGO_S7</span>`,
        confirmButtonText: this.translate.instant('RGO_S7.BUTTON_1'),
        cancelButtonText: this.translate.instant('RGO_S7.BUTTON_2'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
        showCancelButton: true,
        confirmButtonClass: 'btn-danger',
      }).then((confirm) => {
        if (confirm.value) {
          this.callImportAPI();
          // return;
        }

      });
    }
  }

  callImportAPI() {
    // ************* call the actual submit
    this.isWaitingForResponse = true;
    this.subs.sink = this.juryOrganizationService
      .importJuryOrganizationSchedule(this.importForm.value, this.translate.currentLang, this.file)
      .subscribe(
        (resp) => {
          this.isWaitingForResponse = false;

          if (resp && resp.schedulesNotAdded && resp.schedulesNotAdded.length) {
            const notImported = resp.schedulesNotAdded.length;
            const imported = resp.schedulesAdded.length;
            Swal.fire({
              allowOutsideClick: false,
              type: 'warning',
              title: this.translate.instant('GENIMPORT_S4.TITLE'),
              html: this.translate.instant('GENIMPORT_S4.TEXT', {imported: imported, not_imported: notImported}),
              footer: `<span style="margin-left: auto">GENIMPORT_S4</span>`,
              confirmButtonText: this.translate.instant('GENIMPORT_S4.BUTTON'),
            }).then((res) => {
              this.dialogRef.close(true);
            });
          } else if (resp && resp.schedulesAdded && resp.schedulesAdded.length) {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('GENIMPORT_S3.TITLE'),
              html: this.translate.instant('GENIMPORT_S3.TEXT'),
              footer: `<span style="margin-left: auto">GENIMPORT_S3</span>`,
              confirmButtonText: this.translate.instant('GENIMPORT_S3.BUTTON'),
            }).then(() => {
              this.dialogRef.close(true);
            });
          }
        },
        (err) => {
          this.isWaitingForResponse = false;
          this.swalError(err);
        },
      );
  }

  swalError(err) {
    this.isWaitingForResponse = false;

    if (err['message'] === 'GraphQL error: The File to import does not carry the selected delimiter.') {
      Swal.fire({
        allowOutsideClick: false,
        type: 'error',
        title: this.translate.instant('IMPORT_COM_S3.TITLE'),
        footer: `<span style="margin-left: auto">IMPORT_COM_S3</span>`,
        confirmButtonText: this.translate.instant('IMPORT_COM_S3.BUTTON'),
      }).then((res) => {
        this.closeDialog();
      });
    } else if (err['message'] === 'GraphQL error: schedule already published.') {
      Swal.fire({
        allowOutsideClick: false,
        type: 'error',
        title: this.translate.instant('RGO_S8.TITLE'),
        html: this.translate.instant('RGO_S8.TEXT'),
        footer: `<span style="margin-left: auto">RGO_S8</span>`,
        confirmButtonText: this.translate.instant('RGO_S8.BUTTON'),
      }).then((res) => {
        this.closeDialog();
      });
    } else if (err['message'] === 'GraphQL error: Sorry the file you upload is not correct.') {
      Swal.fire({
        allowOutsideClick: false,
        type: 'error',
        title: this.translate.instant('GENIMPORT_S2.TITLE'),
        html: this.translate.instant('GENIMPORT_S2.TEXT'),
        footer: `<span style="margin-left: auto">GENIMPORT_S2</span>`,
        confirmButtonText: this.translate.instant('GENIMPORT_S2.BUTTON'),
      }).then((res) => {
        this.closeDialog();
      });
    } else {
      Swal.fire({
        type: 'error',
        title: 'Error',
        text: err && err['message'] ? err['message'] : err,
        confirmButtonText: 'OK',
      }).then((res) => {
        this.closeDialog();
      });
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
