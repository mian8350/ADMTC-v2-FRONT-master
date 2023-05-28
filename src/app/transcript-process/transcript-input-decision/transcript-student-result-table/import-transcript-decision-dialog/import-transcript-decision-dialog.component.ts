import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { TranscriptProcessService } from 'app/service/transcript-process/transcript-process.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { environment } from 'environments/environment';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-import-transcript-decision-dialog',
  templateUrl: './import-transcript-decision-dialog.component.html',
  styleUrls: ['./import-transcript-decision-dialog.component.scss'],
})
export class ImportTranscriptDecisionDialogComponent implements OnInit, OnDestroy {
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
    public dialogRef: MatDialogRef<ImportTranscriptDecisionDialogComponent>,
    private rncpTitleService: RNCPTitlesService,
    public translate: TranslateService,
    private utilService: UtilityService,
    private transcriptService: TranscriptProcessService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit() {
    this.initForm();

    if (this.data && this.data.classType) {
      this.classType = this.data.classType
    }
  }

  initForm() {
    this.importForm = this.fb.group({
      transcript_process_id: [this.data && this.data.transcriptId ? this.data.transcriptId : null, [Validators.required]],
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
    if (this.data) {
      this.callCheckImportAPI();
    }
  }

  callCheckImportAPI() {
    // ************* To check if there is decision already imputted in the student or not
    this.isWaitingForResponse = true;
    const isExpertise = this.classType === 'expertise' ? true : false;


      this.subs.sink = this.transcriptService
        .checkStudentAlreadyHaveSubmissionDecision(this.importForm.value, this.translate.currentLang, this.file, isExpertise)
        .subscribe((resp) => {
          this.isWaitingForResponse = false;

          if (resp && resp.length) {
            this.swalComfirmationContinueImport();
          } else {
            this.callImportAPI();
          }
        }, (err) => {
          this.isWaitingForResponse = false;
          if (err['message'] === 'GraphQL error: Error: Some student already have decision published') {
            Swal.fire({
              type: 'error',
              title: this.translate.instant('TRANSCRIPT_S17.TITLE'),
              text: this.translate.instant('TRANSCRIPT_S17.TEXT'),
              confirmButtonText: this.translate.instant('TRANSCRIPT_S17.BUTTON'),
            });
          } else {
            Swal.fire({
              type: 'error',
              title: 'Error',
              text: err && err['message'] ? err['message'] : err,
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            });
          }
        });
  }

  swalComfirmationContinueImport() {
    let timeDisabled = 5;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('TRANSCRIPT_S16.TITLE'),
      html: this.translate.instant('TRANSCRIPT_S16.TEXT'),
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('TRANSCRIPT_S16.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('TRANSCRIPT_S16.CANCEL'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('TRANSCRIPT_S16.CONFIRM') + ` (${timeDisabled})`;
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('TRANSCRIPT_S16.CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then(res => {
      if (res.value) {
        this.callImportAPI();
      }
    })
  }

  callImportAPI() {
    // ************* call the actual submit
    this.isWaitingForResponse = true;

      if(this.classType !== 'expertise') {
        this.subs.sink = this.transcriptService
          .importScholarBoardDecision(this.importForm.value, this.translate.currentLang, this.file)
          .subscribe((resp) => {
            this.isWaitingForResponse = false;

            if (resp) {
              Swal.fire({
                type: 'success',
                title: this.translate.instant('TRANSCRIPT_S7.TITLE'),
                html: this.translate.instant('TRANSCRIPT_S7.TEXT'),
                confirmButtonText: this.translate.instant('TRANSCRIPT_S7.BUTTON'),
                allowEnterKey: false,
                allowEscapeKey: false,
                allowOutsideClick: false,
              }).then(() => {
                this.dialogRef.close(true);
              });
            }
          }, (err) => {
            this.isWaitingForResponse = false;
            Swal.fire({
              type: 'error',
              title: this.translate.instant('TRANSCRIPT_S8.TITLE'),
              html: this.translate.instant('TRANSCRIPT_S8.TEXT'),
              confirmButtonText: this.translate.instant('TRANSCRIPT_S8.BUTTON'),
              allowEnterKey: false,
              allowEscapeKey: false,
              allowOutsideClick: false,
            })
          });
      } else {
        this.subs.sink = this.transcriptService
        .importScholarBoardSubmissionCSVForEvalByExpertise(this.importForm.value, this.translate.currentLang, this.file)
        .subscribe((resp) => {
          this.isWaitingForResponse = false;

          if (resp) {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('TRANSCRIPT_S7.TITLE'),
              html: this.translate.instant('TRANSCRIPT_S7.TEXT'),
              confirmButtonText: this.translate.instant('TRANSCRIPT_S7.BUTTON'),
              allowEnterKey: false,
              allowEscapeKey: false,
              allowOutsideClick: false,
            }).then(() => {
              this.dialogRef.close(true);
            });
          }
        }, (err) => {
          this.isWaitingForResponse = false;
          Swal.fire({
            type: 'error',
            title: this.translate.instant('TRANSCRIPT_S8.TITLE'),
            html: this.translate.instant('TRANSCRIPT_S8.TEXT'),
            confirmButtonText: this.translate.instant('TRANSCRIPT_S8.BUTTON'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          })
        });
      }
  }

  swalError(err) {

    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
