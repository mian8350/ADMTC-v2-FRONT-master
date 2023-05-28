import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { environment } from 'environments/environment';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-import-template-eval-competence-dialog',
  templateUrl: './import-template-eval-competence-dialog.component.html',
  styleUrls: ['./import-template-eval-competence-dialog.component.scss']
})
export class ImportTemplateEvalCompetenceDialogComponent implements OnInit, OnDestroy {
  @ViewChild('importFile', { static: false }) importFile: any;

  importForm: UntypedFormGroup;
  file: File;
  fileType: any;
  isWaitingForResponse = false;

  private subs = new SubSink();

  delimeter = [
    { key: 'COMMA [ , ]', value: ',' },
    { key: 'SEMICOLON [ ; ]', value: ';' },
    { key: 'TAB [ ]', value: 'tab' },
  ];

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<ImportTemplateEvalCompetenceDialogComponent>,
    private rncpTitleService: RNCPTitlesService,
    public translate: TranslateService,
    private utilService: UtilityService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit() {
    this.initForm();

  }

  initForm() {
    this.importForm = this.fb.group({
      rncp_title_id: [this.data && this.data.titleId ? this.data.titleId : null, [Validators.required, removeSpaces]],
      class_id: [this.data && this.data.classId ? this.data.classId : null, [Validators.required]],
      file_delimeter: [this.data && this.data.delimeter ? this.data.delimeter : null, [Validators.required]]
    })
  }

  handleInputChange(fileInput: Event) {
    this.isWaitingForResponse = true;
    const file = (<HTMLInputElement>fileInput.target).files[0];


    // *************** Accept Reject File Upload outside allowed accept
    const acceptable = ['csv', 'tsv'];
    const fileType = this.utilService.getFileExtension(file.name).toLocaleLowerCase();

    if (acceptable.includes(fileType)) {
      this.isWaitingForResponse = false;
      this.file = (<HTMLInputElement>fileInput.target).files[0];
    } else {
      this.file = null;
      this.isWaitingForResponse = false;
      Swal.fire({
        type: 'error',
        title: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TITLE'),
        text: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TEXT', {file_exts: '.csv, .tsv'}),
        footer: `<span style="margin-left: auto">UPLOAD_ERROR</span>`,
        allowEscapeKey: false,
        allowOutsideClick: false,
        allowEnterKey: false
      })
    }
  }

  openUploadWindow() {
    this.importFile.nativeElement.click();
  }

  csvTypeSelection() {
    const inputOptions = {
      ',': this.translate.instant('IMPORT_TEMPLATE_S1.COMMA'),
      ';': this.translate.instant('IMPORT_TEMPLATE_S1.SEMICOLON'),
      tab: this.translate.instant('IMPORT_TEMPLATE_S1.TAB'),
    };

    Swal.fire({
      type: 'question',
      title: this.translate.instant('IMPORT_TEMPLATE_S1.TITLE'),
      width: 465,
      allowEscapeKey: true,
      showCancelButton: true,
      footer: `<span style="margin-left: auto">IMPORT_TEMPLATE_S1</span>`,
      cancelButtonText: this.translate.instant('IMPORT_TEMPLATE_S1.CANCEL'),
      confirmButtonText: this.translate.instant('IMPORT_TEMPLATE_S1.OK'),
      input: 'radio',
      inputOptions: inputOptions,
      inputValidator: (value) => {
        return new Promise((resolve, reject) => {
          if (value) {
            resolve('');
            Swal.enableConfirmButton();
          } else {
            Swal.disableConfirmButton();
            reject(this.translate.instant('IMPORT_TEMPLATE_S1.INVALID'));
          }
        });
      },
      onOpen: function () {
        Swal.disableConfirmButton();
        Swal.getContent().addEventListener('click', function (e) {
          Swal.enableConfirmButton();
        });
      },
    }).then((separator) => {
      if (separator.value) {
        this.fileType = separator.value;
        this.downloadCSVTemplate();
      }
    });
  }

  downloadCSVTemplate() {
    let url = environment.apiUrl;
    url = url.replace('graphql', '');
    let element = document.createElement('a');
    let path = '';
    const lang = this.translate.currentLang.toLowerCase();
    if (lang === 'en') {
      if (this.fileType === ',') {
        path = 'comma_en.csv';
      } else if (this.fileType === ';') {
        path = 'semicolon_en.csv';
      } else if (this.fileType === 'tab') {
        path = 'tab_en.csv';
      }
    } else {
      if (this.fileType === ',') {
        path = 'comma_fr.csv';
      } else if (this.fileType === ';') {
        path = 'semicolon_fr.csv';
      } else if (this.fileType === 'tab') {
        path = 'tab_fr.csv';
      }
    }
    let importStudentTemlate = 'download/file?type=template&name=';
    if (this.data.type === 'academic') {
      importStudentTemlate = importStudentTemlate + '_academic_skill_'
    } else if (this.data.type === 'soft_skill') {
      importStudentTemlate = importStudentTemlate + '_soft_skill_'
    }
    element.href = url + importStudentTemlate + path;

    element.target = '_blank';
    element.download = 'Template Import CSV';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  submit() {
    if (this.data) {
      this.isWaitingForResponse = true;
      if (this.data.type === 'academic') {
        this.subs.sink = this.rncpTitleService.importStep2Template(this.importForm.value, this.file).subscribe(resp => {

          if (resp) {
            this.isWaitingForResponse = false;
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo')
            }).then(() => {
              this.dialogRef.close(true);
            })
          }
        })
      } else if (this.data.type === 'soft_skill') {
        this.subs.sink = this.rncpTitleService.importStep3Template(this.importForm.value, this.file).subscribe(resp => {

          if (resp) {
            this.isWaitingForResponse = false;
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo')
            }).then(() => {
              this.dialogRef.close(true);
            })
          }
        })
      }
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
