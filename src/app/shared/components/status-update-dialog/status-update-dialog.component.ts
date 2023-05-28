import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { environment } from 'environments/environment';
import * as moment from 'moment';
import { ExportCsvService } from 'app/service/export-csv/export-csv.service';
import { CoreService } from 'app/service/core/core.service';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';

@Component({
  selector: 'ms-status-update-dialog',
  templateUrl: './status-update-dialog.component.html',
  styleUrls: ['./status-update-dialog.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class StatusUpdateDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @ViewChild('titleInput', { static: false }) titleautocomplete: MatAutocompleteTrigger;
  @ViewChild('classInput', { static: false }) classautocomplete: MatAutocompleteTrigger;
  @ViewChild('testInput', { static: false }) testautocomplete: MatAutocompleteTrigger;
  statusUpdateForm: UntypedFormGroup;
  exportName: 'Export';

  titleCtrl = new UntypedFormControl(null);
  titleList: any[] = [];
  filteredTitle: Observable<any[]>;

  classCtrl = new UntypedFormControl(null);
  classList: any[] = [];
  filteredClass = [];

  testCtrl = new UntypedFormControl(null);
  testList: any[] = [];
  filteredTest: Observable<any[]>;

  delimeterOptions = [
    {
      value: 'comma',
      name: 'COMMA',
    },
    {
      value: 'semicolon',
      name: 'SEMICOLON',
    },
    {
      value: 'tab',
      name: 'TAB',
    },
  ];

  selectedBar = '';
  selectedClass = [];

  isWaitingForResponse = false;

  isTutorialAdded = false;
  dataTutorial: any;
  tutorialData: any;
  isPermission: any;

  constructor(
    public dialogRef: MatDialogRef<StatusUpdateDialogComponent>,
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private rncpTitleService: RNCPTitlesService,
    private exportCsvService: ExportCsvService,
    public coreService: CoreService,
    public tutorialService: TutorialService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.isPermission = this.authService.getPermission();
    this.initForm();
    this.getTitleDropdown();
    this.resetFilterListener();
    this.getInAppTutorial('Export');
  }

  initForm() {
    this.statusUpdateForm = this.fb.group({
      rncp_id: ['', Validators.required],
      class_id: [null, Validators.required],
      test_id: ['', Validators.required],
      type: [null],
      file_delimeter: [''],
      notification: [false],
      csv: [false],
      google: [false],
    });
  }

  addRncpTitle() {
    if (this.titleCtrl.value && this.titleCtrl.value !== '') {

      const firstTitle = this.titleList.filter((sch) =>
        sch.short_name.toLowerCase().trim().includes(this.titleCtrl.value.toLowerCase().trim()),
      )[0];
      if (firstTitle) {
        this.titleCtrl.setValue(firstTitle.short_name);
        this.getClassDropdown(firstTitle._id);
        this.titleautocomplete.closePanel();
      }
    }
  }

  addClass() {
    if (this.classCtrl.value && this.classCtrl.value !== '') {
      const firstClass = this.classList.filter((sch) =>
        sch.name.toLowerCase().trim().includes(this.classCtrl.value.toLowerCase().trim()),
      )[0];
      if (firstClass) {
        this.classCtrl.setValue(firstClass.name);
        this.selectedClass = firstClass._id;
        // this.getTestDropdown(firstClass._id);
        this.classautocomplete.closePanel();
      }
    }
  }

  addTest() {
    if (this.testCtrl.value && this.testCtrl.value !== '') {
      this.getDelimeterDropdown(this.testCtrl.value);
    }
  }

  getInAppTutorial(type) {
    // const permission = this.isPermission && this.isPermission.length && this.isPermission[0] ? this.isPermission[0] : [];
    const currentUser = this.authService.getLocalStorageUser();
    const userType = currentUser.entities[0].type.name;
    this.subs.sink = this.tutorialService.GetAllInAppTutorialsByModule(type, userType).subscribe((list) => {
      if (list && list.length) {
        this.dataTutorial = list;
        const tutorialData = this.dataTutorial.filter((tutorial) => {
          return tutorial.is_published === true && tutorial.module === type;
        });
        this.tutorialData = tutorialData[0];
        if (this.tutorialData) {
          this.isTutorialAdded = true;
        } else {
          this.isTutorialAdded = false;
        }
      }
    });
  }

  toggleTutorial(data) {
    this.tutorialService.setTutorialView(data);
    if (this.coreService.sidenavOpen) {
      this.coreService.sidenavOpen = !this.coreService.sidenavOpen;
    }
    this.coreService.sidenavTutorialOpen = !this.coreService.sidenavTutorialOpen;
  }

  navTutorialClosed() {
    this.selectedBar = '';
    this.coreService.setTutorialView(null);
  }

  resetFilterListener() {
    this.subs.sink = this.titleCtrl.valueChanges.pipe().subscribe((title) => {
      if (this.statusUpdateForm.get('rncp_id') && !this.isWaitingForResponse) {
        this.statusUpdateForm.get('rncp_id').setValue('');
        this.classList = [];
        this.selectedClass = [];
        this.filteredClass = [];
        this.testList = [];
        this.classCtrl.setValue(null);
        this.testCtrl.setValue(null);
        this.statusUpdateForm.get('type').setValue(null);
        this.statusUpdateForm.get('class_id').setValue(null);
        this.statusUpdateForm.get('test_id').setValue(null);
        this.statusUpdateForm.get('file_delimeter').setValue(null);
      }
    });

    // this.subs.sink = this.classCtrl.valueChanges.pipe().subscribe((classData) => {
    //   if (this.statusUpdateForm.get('class_id') && !this.isWaitingForResponse) {
    //     this.statusUpdateForm.get('class_id').setValue('');
    //     this.testList = [];
    //     this.testCtrl.setValue(null);
    //     this.statusUpdateForm.get('test_id').setValue(null);
    //     this.statusUpdateForm.get('file_delimeter').setValue(null);
    //   }
    // });

    this.subs.sink = this.testCtrl.valueChanges.pipe().subscribe((test) => {
      if (this.statusUpdateForm.get('test_id') && !this.isWaitingForResponse) {
        this.statusUpdateForm.get('test_id').setValue('');
        this.statusUpdateForm.get('file_delimeter').setValue(null);
      }
    });
  }

  getTitleDropdown() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.GetAllTitleDropdownList('').subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        this.titleList = _.cloneDeep(resp);
        this.filteredTitle = this.titleCtrl.valueChanges.pipe(
          startWith(''),
          map((searchTxt) => {
            searchTxt = searchTxt ? searchTxt : '';
            return this.titleList.filter((sch) => sch.short_name.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()));
          }),
        );
      },
      (err) => {
        this.swalError(err);
      },
    );
  }

  getClassDropdown(titleId: string) {
    this.statusUpdateForm.get('rncp_id').setValue(titleId);
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.getClassesByTitle(titleId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        this.classList = resp;
        this.filteredClass = resp;
      },
      (err) => {
        this.swalError(err);
      },
    );

    this.classCtrl.setValue(null);
    this.testCtrl.setValue(null);
    this.statusUpdateForm.get('class_id').setValue(null);
    this.statusUpdateForm.get('test_id').setValue(null);
    this.statusUpdateForm.get('file_delimeter').setValue(null);
  }

  getTaskList(event) {
    this.statusUpdateForm.get('test_id').setValue(null);
    this.testCtrl.setValue(null);
    const selectedType = this.statusUpdateForm.get('type').value;
    if (event === 'manual') {
      const filter = {
        rncp_title : this.statusUpdateForm.get('rncp_id').value,
        class_ids: this.selectedClass ? this.selectedClass : null,
        is_parent_task: true,
        type: 'add_task'
      }
      this.isWaitingForResponse = true;
      this.subs.sink = this.rncpTitleService.getAllManualTask(filter).subscribe((resp) => {
        if (resp) {
          this.isWaitingForResponse = false;
          const testManual = resp;
          this.testList = testManual.map( data => ({...data, fullLabel: data?.class_id?.name + ' - ' +  data?.description}))
        }
      })
    } else if (event === 'notation_grid') {
      this.getTestDropdown(this.selectedClass);
    }
  }

  getSelectedClass() {
    if (this.classCtrl.value && this.classCtrl.value !== '') { 
      this.statusUpdateForm.get('class_id').setValue(this.classCtrl.value);
    } else {
      this.statusUpdateForm.get('class_id').setValue(null);
    }
    this.selectedClass = this.statusUpdateForm.get('class_id').value;
    this.statusUpdateForm.get('type').setValue(null);
    this.statusUpdateForm.get('test_id').setValue(null);
    this.testCtrl.setValue(null);
  }

  getTestDropdown(classId) {
    this.statusUpdateForm.get('class_id').setValue(classId);
    const titleId = this.statusUpdateForm.get('rncp_id').value;
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.getAlltestDropdownListMultipleClass(titleId, classId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        const notationTask = resp;
        this.testList = notationTask.map( data => ({...data, fullLabel: data?.class_id?.name + ' - ' +  data?.name}))
      },
      (err) => {
        this.swalError(err);
      },
    );

    this.testCtrl.setValue(null);
    this.statusUpdateForm.get('test_id').setValue(null);
    this.statusUpdateForm.get('file_delimeter').setValue(null);
  }

  getDelimeterDropdown(testId) {

    this.statusUpdateForm.get('test_id').setValue(testId);
    this.statusUpdateForm.get('file_delimeter').setValue(null);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  submit() {
    const payload = _.cloneDeep(this.statusUpdateForm.value);
    payload['lang'] = this.translate.currentLang;


    // if (payload.google) {
    //   this.subs.sink = this.rncpTitleService
    //     .GetResponseForExportStatusUpdate(payload.rncp_id, payload.class_id, payload.test_id)
    //     .subscribe((resp) => {
    //       this.isWaitingForResponse = false;
    //       if (resp && resp.length) {

    //         this.exportAllData(resp);
    //       }
    //     });
    // } else {
    if (this.statusUpdateForm.get('csv').value) {
      this.exportCSV();
    } else {
      this.sendTaskN7Delimiter();
    }
    // }
  }

  isFormValid() {
    let result = true;

    if (this.statusUpdateForm.invalid) {
      result = false;
      return result;
    } 

    if (
      !this.statusUpdateForm.get('notification').value &&
      !this.statusUpdateForm.get('csv').value &&
      !this.statusUpdateForm.get('google').value
    ) {
      result = false;
      return result;
    } 

    return result;
  }

  swalError(err) {
    this.isWaitingForResponse = false;
    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    });
  }

  exportCSV() {
    const inputOptions = {
      comma: this.translate.instant('Export_S1.COMMA'),
      semicolon: this.translate.instant('Export_S1.SEMICOLON'),
      tab: this.translate.instant('Export_S1.TAB'),
    };
    Swal.fire({
      type: 'question',
      allowOutsideClick: false,
      title: this.translate.instant('Export_S1.TITLE'),
      allowEscapeKey: true,
      confirmButtonText: this.translate.instant('Export_S1.OK'),
      input: 'radio',
      inputOptions: inputOptions,
      showCancelButton: true,
      cancelButtonText: this.translate.instant('DASHBOARD_DELETE.Cancel'),
      cancelButtonColor: '#f44336',
      inputValue: this.translate && this.translate.currentLang === 'fr' ? ';' : '',
      inputValidator: (value) => {
        return new Promise((resolve, reject) => {
          if (value) {
            resolve('');
          } else {
            reject(this.translate.instant('Export_S1.INVALID'));
          }
        });
      },
      onOpen: function () {
        Swal.disableConfirmButton();
        Swal.getContent().addEventListener('click', function (e) {
          Swal.enableConfirmButton();
        });
        const input = Swal.getInput();
        const inputValue = input.getAttribute('value');
        if (inputValue === 'semicolon') {
          Swal.enableConfirmButton();
        }
      },
    }).then((separator) => {

      if (separator.value) {
        this.statusUpdateForm.get('file_delimeter').patchValue(separator.value);
        this.getStatusUpdateCsv();
        // this.dialogRef.close();
        if (this.statusUpdateForm.get('notification').value) {
          this.sendTaskN7();
        }
      }
    });
  }

  getStatusUpdateCsv() {
    const payload = this.statusUpdateForm.value;
    this.isWaitingForResponse = true;


    if (payload.type === 'notation_grid') {
      if (payload.test_id.length > 1) {
        this.subs.sink = this.rncpTitleService.SendEmailStatusUpdate(payload.test_id, payload.file_delimeter).subscribe(
          (response) => {

            this.isWaitingForResponse = false;
            if (response) {
              this.swalStatUpdateS1();
            }
          },
          (err) => {
            this.swalError(err);
          },
        );
      } else {
        this.subs.sink = this.rncpTitleService.GetResponseForStatusUpdate(payload.rncp_id, payload.class_id).subscribe(
          (resp) => {

            this.isWaitingForResponse = false;
            if (resp === 'call_download') {
              const body = {
                test_id: payload.test_id,
                delimiter: payload.file_delimeter,
                lang: this.translate.currentLang,
              };
              this.subs.sink = this.rncpTitleService.downloadFile(body).subscribe((res) => {

                this.downloadFile(res);
              });
  
              Swal.fire({
                type: 'success',
                title: this.translate.instant('Bravo !'),
              }).then((res) => {
                this.dialogRef.close();
              });
            } else if (resp === 'call_email') {
              this.isWaitingForResponse = true;
              this.subs.sink = this.rncpTitleService.SendEmailStatusUpdate(payload.test_id, payload.file_delimeter).subscribe(
                (response) => {

                  this.isWaitingForResponse = false;
                  if (response) {
                    this.swalStatUpdateS1();
                  }
                },
                (err) => {
                  this.swalError(err);
                },
              );
            }
          },
          (err) => {
            this.swalError(err);
          },
        );
      }
    } else if (payload.type === 'manual') {
      if (payload.test_id.length > 1) {
        this.subs.sink = this.rncpTitleService.SendEmailStatusUpdateManualTask(payload.test_id, payload.file_delimeter).subscribe(
          (response) => {

            this.isWaitingForResponse = false;
            if (response) {
              this.swalStatUpdateS1();
            }
          },
          (err) => {
            this.swalError(err);
          },
        );
      } else {
        this.subs.sink = this.rncpTitleService.GetResponseForStatusUpdate(payload.rncp_id, payload.class_id).subscribe(
          (resp) => {

            this.isWaitingForResponse = false;
            if (resp === 'call_download') {
              const body = {
                test_id: null,
                delimiter: payload.file_delimeter,
                lang: this.translate.currentLang,
                task_id:  payload.test_id,
              };
              this.subs.sink = this.rncpTitleService.downloadFile(body).subscribe((res) => {

                this.downloadFile(res);
              });
  
              Swal.fire({
                type: 'success',
                title: this.translate.instant('Bravo !'),
              }).then((res) => {
                this.dialogRef.close();
              });
            } else if (resp === 'call_email') {
              this.isWaitingForResponse = true;
              this.subs.sink = this.rncpTitleService.SendEmailStatusUpdateManualTask(payload.test_id, payload.file_delimeter).subscribe(
                (response) => {

                  this.isWaitingForResponse = false;
                  if (response) {
                    this.swalStatUpdateS1();
                  }
                },
                (err) => {
                  this.swalError(err);
                },
              );
            }
          },
          (err) => {
            this.swalError(err);
          },
        );
      }
    }
  }

  sendTaskN7Delimiter() {
    const inputOptions = {
      comma: this.translate.instant('Export_S1.COMMA'),
      semicolon: this.translate.instant('Export_S1.SEMICOLON'),
      tab: this.translate.instant('Export_S1.TAB'),
    };
    Swal.fire({
      type: 'question',
      allowOutsideClick: false,
      title: this.translate.instant('Export_S1.TITLE'),
      allowEscapeKey: true,
      confirmButtonText: this.translate.instant('Export_S1.OK'),
      input: 'radio',
      inputOptions: inputOptions,
      showCancelButton: true,
      cancelButtonText: this.translate.instant('DASHBOARD_DELETE.Cancel'),
      cancelButtonColor: '#f44336',
      inputValue: this.translate && this.translate.currentLang === 'fr' ? ';' : '',
      inputValidator: (value) => {
        return new Promise((resolve, reject) => {
          if (value) {
            resolve('');
          } else {
            reject(this.translate.instant('Export_S1.INVALID'));
          }
        });
      },
      onOpen: function () {
        Swal.disableConfirmButton();
        Swal.getContent().addEventListener('click', function (e) {
          Swal.enableConfirmButton();
        });
        const input = Swal.getInput();
        const inputValue = input.getAttribute('value');
        if (inputValue === 'semicolon') {
          Swal.enableConfirmButton();
        }
      },
    }).then((separator) => {

      if (separator.value) {
        this.statusUpdateForm.get('file_delimeter').patchValue(separator.value);
        this.sendTaskN7();
      }
    });
  }

  sendTaskN7() {
    this.isWaitingForResponse = true;
    const type = this.statusUpdateForm.get('type').value;
    let payloadStatus = this.statusUpdateForm.value;
    payloadStatus.class_id = this.statusUpdateForm.get('class_id').value[0];
    if (type === 'notation_grid') {
      this.subs.sink = this.rncpTitleService.TaskN7ForStatusUpdate(payloadStatus).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          if (resp) {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo !'),
            }).then((res) => {
              this.dialogRef.close();
            });
          }
        },
        (err) => {
          this.swalError(err);
        },
      );
    } else if (type === 'manual') {
      this.subs.sink = this.rncpTitleService.TaskN7ForStatusUpdateManualTask(this.statusUpdateForm.value).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          if (resp) {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo !'),
            }).then((res) => {
              this.dialogRef.close();
            });
          }
        },
        (err) => {
          this.swalError(err);
        },
      );
    }
  }

  swalStatUpdateS1() {
    Swal.fire({
      type: 'success',
      title: this.translate.instant('StatUpdate_S1.Title'),
      text: this.translate.instant('StatUpdate_S1.Text'),
      confirmButtonText: this.translate.instant('StatUpdate_S1.Button'),
      allowOutsideClick: false,
    }).then((res) => {
      this.dialogRef.close();
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  changeCheckbox(type) {
    if (type === 'csv') {
      this.statusUpdateForm.get('google').setValue(false);
    } else {
      this.statusUpdateForm.get('csv').setValue(false);
    }
  }

  exportAllData(dataa) {
    const exportData = _.uniqBy(dataa, '_id');
    const data = [];
    if (exportData && exportData.length) {
      exportData.forEach((item) => {
        const obj = [];
        // TODO: From the template get the data location and add the data
        // TEMPLATE CSV: https://docs.google.com/spreadsheets/d/1G55wWXJEfAGUBv66lt-ioW56W1lFmDGLaJDnepZ3CT4/edit#gid=0
        obj[0] = null;
        obj[1] = item.rncp_title.short_name ? item.rncp_title.short_name : '';
        obj[2] = item.current_class.name ? item.current_class.name : '';
        obj[3] = this.translate.instant(item.civility);
        obj[4] = item.first_name;
        obj[5] = null;
        obj[6] = item.email ? item.email : '';
        obj[7] = item.test_name ? item.test_name : '';
        obj[8] = item.document_name ? item.document_name : '';
        obj[9] = item.student_document_name ? item.student_document_name : '';
        obj[10] = item.document_link ? item.document_link : '';
        obj[11] = item.upload_date ? item.upload_date : '';
        obj[12] = item.upload_time ? item.upload_time : '';
        obj[13] = item.student_score ? item.student_score : '';
        // obj[14] = `http://localhost:7510/school/${item.school._id}?title=${item.rncp_title._id}&class=${item.current_class._id}&student=${item._id}&open=student-cards&identity=Identity`;
        obj[14] = `http://www.admtc.pro/school/${item.school._id}?title=${item.rncp_title._id}&class=${item.current_class._id}&student=${item._id}&open=student-cards&selectedTab=Identity&selectedSubTab=Identity`;
        obj[15] = item.last_name ? item.last_name : '';
        obj[16] = `http://www.admtc.pro/school/${item.school._id}`;
        obj[17] = item.school.long_name ? item.school.long_name : '';
        data.push(obj);
      });

      const valueRange = { values: data };
      const today = moment().format('DD-MM-YYYY');
      const title = this.exportName + '_' + today;
      const sheetID = this.translate.currentLang === 'en' ? 0 : 1396692774;
      const sheetData = {
        spreadsheetId: '1ayRgubFelMY3MXCEa_0xXuf3yDG0ogUwNCe9J_R03v0',
        sheetId: sheetID,
        range: 'A7',
      };
      this.exportCsvService.createAndUpdateSpreadsheet(valueRange, title, sheetData);
    }

    if (this.statusUpdateForm.get('notification').value) {
      this.sendTaskN7();
    }
  }

  selectedAllClasses() {
    const selected = this.filteredClass.map((item) => item._id);
    this.classCtrl.patchValue(selected);
    this.getDelimeterDropdown(this.classCtrl.value);
    this.getSelectedClass();
  }
  unSelectedAllClasses() {
    this.classCtrl.patchValue(null);
    this.getSelectedClass();
  }

  selectedAllItems() {
    const selected = this.testList.map((item) => item._id);
    this.testCtrl.patchValue(selected);
    this.getDelimeterDropdown(this.testCtrl.value);
  }
  unSelectedAllItems() {
    this.testCtrl.patchValue(null);
  }

  downloadFile(data) {
    const blob = new Blob([data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    let element = document.createElement('a');
    element.href = url;
    element.target = '_blank';
    element.download = 'Pointage.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }
}
