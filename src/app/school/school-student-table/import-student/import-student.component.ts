import { Component, OnInit, Input, ViewChild, OnDestroy } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { StudentsService } from 'app/service/students/students.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { TranslateService } from '@ngx-translate/core';
import { SchoolService } from 'app/service/schools/school.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import Swal from 'sweetalert2';
import { SubSink } from 'subsink';
import { environment } from 'environments/environment';
import { ApplicationUrls } from 'app/shared/settings';
import { AuthService } from 'app/service/auth-service/auth.service';
import { HttpHeaders } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'ms-import-student',
  templateUrl: './import-student.component.html',
  styleUrls: ['./import-student.component.scss'],
})
export class ImportStudentComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @Input() schoolId: string;
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  importForm: UntypedFormGroup;
  importDummyForm: UntypedFormGroup;
  @ViewChild('importFile', { static: false }) importFile: any;
  path: string;
  fileName: string;
  file: any;
  fileType: any;
  templateCSVDownloadName: string = 'comma';
  currentUser: any;
  server = ApplicationUrls.baseApi;
  isAcadir = false;
  isClose = false;
  isCancel = false;
  isWaitingForResponse = false;

  titles = [];
  classes = [];
  scholars = [];
  delimeter = [
    { key: 'COMMA [ , ]', value: ',', text: 'COMMA' },
    { key: 'SEMICOLON [ ; ]', value: ';', text: 'SEMICOLON' },
    { key: 'TAB [ ]', value: 'tab', text: 'TAB' },
  ];
  private intVal: any;
  private timeOutVal: any;

  constructor(
    private route: ActivatedRoute,
    private fb: UntypedFormBuilder,
    private studentService: StudentsService,
    private schoolService: SchoolService,
    private titleService: RNCPTitlesService,
    private translate: TranslateService,
    private userService: AuthService,
    private httpClient: HttpClient,
    private fileUploadService: FileUploadService,
  ) {}

  ngOnInit() {
    this.initImportForm();
    this.initDummyImportForm();
    this.getTitleData();
    this.currentUser = this.userService.getLocalStorageUser();
    this.currentUser.entities.forEach((element) => {
      if (element.type.name === 'Academic Director') {

        this.isAcadir = true;
      }
    });
    this.dataIsChanged();
  }

  initImportForm() {
    this.importForm = this.fb.group({
      school: [this.schoolId, Validators.required],
      rncp_title: [this.selectedRncpTitleId, Validators.required],
      current_class: [this.selectedClassId, Validators.required],
      // scholar_season : [null, Validators.required],
      file_delimeter: ['', Validators.required],
    });
  }

  initDummyImportForm() {
    this.importDummyForm = this.fb.group({
      school: [this.schoolId, Validators.required],
      rncp_title: [this.selectedRncpTitleId, Validators.required],
      current_class: [this.selectedClassId, Validators.required],
      // scholar_season : [null, Validators.required],
      file_delimeter: ['', Validators.required],
    });
  }

  getTitleData() {
    const titleId = this.importForm.get('rncp_title').value ? this.importForm.get('rncp_title').value : '';
    if (this.isAcadir) {
      if (titleId) {
        this.subs.sink = this.titleService.getOneTitleByIdForCourse(titleId).subscribe((response) => {
          if (response) {
            this.titles.push(response);
            this.importForm.get('rncp_title').patchValue(response._id);
            if (response.classes && response.classes.length) {
              this.classes = response.classes;
            }
          }
          this.getTitleAcadir();
        });
      } else {
        this.getTitleAcadir();
      }
    } else {
      if (titleId) {
        this.subs.sink = this.titleService.getOneTitleByIdForCourse(titleId).subscribe((response) => {
          if (response) {
            this.titles.push(response);
            this.importForm.get('rncp_title').patchValue(response._id);
            if (response.classes && response.classes.length) {
              this.classes = response.classes;
            }
          }
          this.getRncpTitles();
        });
      } else {
        this.getRncpTitles();
      }
    }
  }

  getRncpTitles() {
    this.subs.sink = this.titleService.getRncpTitlesBySchoolId(this.schoolId).subscribe((resp) => {
      this.titles = resp;
    });
  }

  getTitleAcadir() {
    this.subs.sink = this.titleService.getTitleByAcadir(this.schoolId).subscribe((resp) => {
      this.titles = resp;
    });
  }

  getScholarSeasons() {
    this.subs.sink = this.titleService.getScholarSeasons().subscribe((response) => {
      if (response) {
        this.scholars = response;
      }
    });
  }

  changeTitle() {
    const titleId = this.importForm.get('rncp_title').value;
    this.importForm.get('current_class').setValue(null);
    const titleSelected = this.importForm.get('rncp_title').value;
    const classSelected = this.importForm.get('current_class').value;
    const delimeterSelected = this.importForm.get('file_delimeter').value;
    this.dataIsChanged();
    if (!this.file && !titleSelected && !classSelected && !delimeterSelected) {
      this.schoolService.setImportFormFilled(false);
    }
    if (titleId) {
      this.subs.sink = this.titleService.getClassOfTitle(titleId).subscribe((resp) => {
        this.classes = resp;
      });
    } else {
      this.classes = [];
    }
  }

  changeScholar() {}

  openUploadWindow() {
    this.importFile.nativeElement.click();
  }

  resetImport() {
    this.importForm.get('rncp_title').setValue(null);
    this.importForm.get('current_class').setValue(null);
    this.importForm.get('file_delimeter').setValue('');
    this.path = '';
    this.fileName = '';
    this.schoolService.setImportFormFilled(false);
    if (this.isAcadir) {
      this.getTitleAcadir();
    } else {
      this.getRncpTitles();
    }
  }

  onCancelImport() {
    const titleSelected = this.importForm.get('rncp_title').value;
    const classSelected = this.importForm.get('current_class').value;
    const delimeterSelected = this.importForm.get('file_delimeter').value;
    if (this.file || titleSelected || classSelected || delimeterSelected) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('TMTC_S01_IMPORT.TITLE'),
        text: this.translate.instant('TMTC_S01_IMPORT.TEXT'),
        confirmButtonText: this.translate.instant('TMTC_S01_IMPORT.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('TMTC_S01_IMPORT.BUTTON_2'),
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.value) {
        } else {
          this.schoolService.setImportStudent(false);
          this.schoolService.setImportFormFilled(false);
        }
      });
    } else {
      this.schoolService.setImportStudent(false);
      this.schoolService.setImportFormFilled(false);
    }
  }

  handleInputChange(fileInput: Event) {
    this.dataIsChanged();
    this.isWaitingForResponse = true;
    const file = (<HTMLInputElement>fileInput.target).files[0];
    this.file = (<HTMLInputElement>fileInput.target).files[0];
    this.path = '';
    this.fileName = '';
    if (file) {
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          if (resp) {
            this.path = resp.file_url;
            this.fileName = resp.file_name;
          }
        },
        (err) => {
          Swal.fire({
            type: 'error',
            title: 'Error !',
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          }).then((res) => {

          });
        },
      );
    }
    this.resetFileState();
  }

  resetFileState() {
    this.importFile.nativeElement.value = '';
  }

  submitStudent() {
    this.isWaitingForResponse = true;
    const data = this.importForm.value;
    if (this.importForm.valid) {
      const doc = this.file;
      const titleSelected = this.importForm.get('rncp_title').value;
      const classSelected = this.importForm.get('current_class').value;
      if (titleSelected && classSelected) {
        this.schoolService.setSelectedRncpTitleId(titleSelected);
        this.schoolService.setSelectedClassId(classSelected);
      }
      const lang = this.translate.currentLang.toLowerCase();
      this.subs.sink = this.schoolService.importStudent(data, doc, lang).subscribe(
        (response) => {
          this.isWaitingForResponse = false;
          if (response.studentsNotAdded && (response.studentsNotAdded.length > 0 || !response.studentsAdded)) {
            const noOfSuccessfullStudentImport = response.studentsAdded ? response.studentsAdded.length : 0;
            const noOfUnsuccessfullStudentImport = response.studentsNotAdded ? response.studentsNotAdded.length : 0;
            Swal.fire({
              title: this.translate.instant('STUDENT_IMPORT.UNSUCCESSFULL_IMPORT.TITLE'),
              html: this.translate.instant('STUDENT_IMPORT.UNSUCCESSFULL_IMPORT.TEXT', {
                noOfSuccessfullStudentImport: noOfSuccessfullStudentImport,
                noOfUnsuccessfullStudentImport: noOfUnsuccessfullStudentImport,
              }),
              type: 'info',
              allowEscapeKey: true,
              confirmButtonText: this.translate.instant('STUDENT_IMPORT.UNSUCCESSFULL_IMPORT.BUTTON'),
            }).then((result) => {
              this.schoolService.setImportStudent(false);
              this.schoolService.setImportFormFilled(false);
            });
          } else if (response.studentsNotAdded && response.studentsNotAdded.length < 1) {
            Swal.fire({
              title: this.translate.instant('STUDENT_IMPORT.SUCCESSFULL_IMPORT.TITLE'),
              html: this.translate.instant('STUDENT_IMPORT.SUCCESSFULL_IMPORT.TEXT'),
              type: 'success',
              allowEscapeKey: true,
              confirmButtonText: this.translate.instant('STUDENT_IMPORT.SUCCESSFULL_IMPORT.BUTTON'),
            }).then((result) => {
              this.schoolService.setImportStudent(false);
              this.schoolService.setImportFormFilled(false);
            });
          } else {
            Swal.fire({
              title: this.translate.instant('STUDENT_IMPORT.DELIMITER_UNSUCCESSFULL_IMPORT.TITLE'),
              type: 'error',
              allowEscapeKey: true,
              confirmButtonText: this.translate.instant('STUDENT_IMPORT.UNSUCCESSFULL_IMPORT.BUTTON'),
            }).then((result) => {
              this.schoolService.setImportStudent(false);
              this.schoolService.setImportFormFilled(false);
            });
          }
        },
        (err) => {
          this.isWaitingForResponse = false;
          // Swal.fire({ type: 'error', title: 'Error' });
          Swal.fire({
            title: this.translate.instant('STUDENT_IMPORT.DELIMITER_UNSUCCESSFULL_IMPORT.TITLE'),
            type: 'error',
            allowEscapeKey: true,
            confirmButtonText: this.translate.instant('STUDENT_IMPORT.UNSUCCESSFULL_IMPORT.BUTTON'),
          }).then((result) => {
            this.schoolService.setImportStudent(false);
            this.schoolService.setImportFormFilled(false);
          });
        },
      );
    } else {
      this.isWaitingForResponse = false;
      Swal.fire({ type: 'error', title: 'Error' });
      this.importForm.markAllAsTouched();

    }
  }

  csvTypeSelection() {
    const inputOptions = {
      ',': this.translate.instant('Import_S1.COMMA'),
      ';': this.translate.instant('Import_S1.SEMICOLON'),
      tab: this.translate.instant('Import_S1.TAB'),
    };

    Swal.fire({
      type: 'question',
      title: this.translate.instant('Import_S1.TITLE'),
      width: 465,
      allowEscapeKey: true,
      showCancelButton: true,
      cancelButtonText: this.translate.instant('Import_S1.CANCEL'),
      confirmButtonText: this.translate.instant('Import_S1.OK'),
      input: 'radio',
      inputOptions: inputOptions,
      inputValidator: (value) => {
        return new Promise((resolve, reject) => {
          if (value) {
            resolve('');
            Swal.enableConfirmButton();
          } else {
            Swal.disableConfirmButton();
            reject(this.translate.instant('Import_S1.INVALID'));
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

  dataIsChanged() {
    this.schoolService.setImportFormFilled(false);
    const emptyForm = JSON.stringify(this.importDummyForm.value);
    const formFIlled = JSON.stringify(this.importForm.value);
    if (emptyForm !== formFIlled) {
      this.schoolService.setImportFormFilled(true);
    }
  }

  downloadCSVTemplate() {
    let url = environment.apiUrl;
    url = url.replace('graphql', '');
    let element = document.createElement('a');
    let path = '';
    let delimeter = null;
    const lang = this.translate.currentLang.toLowerCase();
    switch (this.fileType) {
      case ',':
        delimeter = 'comma'
        break;
      case ';':
        delimeter = 'semicolon'
        break;
      case 'tab':
        delimeter = 'tab'
        break;
      default:
        delimeter = null
        break;
    }
    const importStudentTemlate = `download/downloadStudentTemplate/${this.selectedClassId}/${delimeter}/${lang}`;
    element.href = url + importStudentTemlate;

    element.target = '_blank';
    // element.setAttribute('download', 'student.csv');
    element.download = 'Student Import CSV';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    clearInterval(this.intVal);
    this.subs.unsubscribe();
  }
}
