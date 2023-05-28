import { Component, NgZone, OnInit, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { bufferCount, debounceTime, map, startWith, take, tap } from 'rxjs/operators';
import { UntypedFormControl } from '@angular/forms';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { JuryOrganizationParameter } from 'app/title-rncp/conditions/jury-organization-parameter/jury-organization-parameter.model';
import { ActivatedRoute, Router } from '@angular/router';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import Swal from 'sweetalert2';
import { SubSink } from 'subsink';
import { cloneDeep } from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';
import { CoreService } from 'app/service/core/core.service';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import * as moment from 'moment';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { JuryKitDialogComponent } from 'app/jury-organization/jury-kit-dialog/jury-kit-dialog.component';
import * as _ from 'lodash';
import { AssignJuriesMultipleComponent } from '../../shared-jury-dialogs/assign-juries-multiple/assign-juries-multiple.component';
import { ImportSchedulesDialogComponent } from '../../shared-jury-dialogs/import-schedules-dialog/import-schedules-dialog.component';
import { SetSessionJuriesIndividualComponent } from '../../shared-jury-dialogs/set-session-juries-individual/set-session-juries-individual.component';
import { SetSessionMultipleComponent } from '../../shared-jury-dialogs/set-session-multiple/set-session-multiple.component';

@Component({
  selector: 'ms-setup-schedule-retake-go-visio-offline-jury',
  templateUrl: './setup-schedule-retake-go-visio-offline-jury.component.html',
  styleUrls: ['./setup-schedule-retake-go-visio-offline-jury.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseLocalToUtcPipe],
})
export class SetupScheduleRetakeGoVisioOfflineJuryComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  // @ViewChild(MatTable, { static: false }) table: MatTable<any>;
  @ViewChild(MatTable, { static: false }) table: MatTable<any>;

  blockMatrix: boolean[][] = [];
  juryOrganizationId: string;
  private subs = new SubSink();
  isWaitingForResponse: boolean = false;
  displayedColumns: string[] = [
    'select',
    'student',
    'school',
    'date',
    'start',
    'duration',
    'end',
    'president',
    'professional',
    'academic',
    'subtitute',
    'status',
    'action',
  ];
  filterColumns: string[] = [
    'selectFilter',
    'studentFilter',
    'schoolFilter',
    'dateFilter',
    'startFilter',
    'durationFilter',
    'endFilter',
    'presidentFilter',
    'professionalFilter',
    'academicFilter',
    'subtituteFilter',
    'statusFilter',
    'actionFilter',
  ];
  dataSource = new MatTableDataSource([]);
  dataCount: number;
  noData: any;
  selection = new SelectionModel<any>(true, []);
  sortValue: any;
  isReset: boolean;

  // *** JURY DATA *** //
  juryData: JuryOrganizationParameter;
  juryBlocks: string[] = [];
  specializationBlock: string[] = [];
  allDataBlock: string[] = []; 
  setupScheduleInfo;

  // Super Filter
  schoolSuperList = [];
  schoolSuperFilter = new UntypedFormControl('');
  statusSuperList = [
    {
      name: 'current_active',
      value: 'current_active',
    },
    {
      name: 'deactivated',
      value: 'deactivated',
    },
    {
      name: 'retaking',
      value: 'retaking',
    },
    {
      name: 'suspended',
      value: 'suspended',
    },
  ];
  statusSuperFilter = new UntypedFormControl('');

  // *** FILTER FORMS *********************************/
  filteredValues = {
    school_id: null,
    student_status: null,
    student_name: '',
    date_test: '',
    start_time: '',
    end_time: '',
    president_jury_name: '',
    profesional_jury_name: '',
    academic_jury_name: '',
    substitution_jury_name: '',
    is_publish: null,
    block: null,
  };

  blockForms = {};
  blockSpecializationForms = {};
  selectedValues = [];

  statusFilterDropdown = [
    { value: true, viewValue: 'Published' },
    { value: false, viewValue: 'Unpublished' },
  ];

  blockFilterDropdown = [
    { value: true, viewValue: 'Selected' },
    { value: false, viewValue: 'Not Selected' },
  ];

  schoolList = [];
  schoolFilter = new UntypedFormControl(null);

  // search types
  studentFilter = new UntypedFormControl(null);
  dateFilter = new UntypedFormControl(null);
  startFilter = new UntypedFormControl(null);
  endFilter = new UntypedFormControl(null);
  presidentFilter = new UntypedFormControl(null);
  professionalFilter = new UntypedFormControl(null);
  academicFilter = new UntypedFormControl(null);
  subtituteFilter = new UntypedFormControl(null);
  statusFilter = new UntypedFormControl(null);

  dataLoaded = false;
  allSelected: boolean = false;
  schoolAddressHide: boolean = true;
  schoolAddress: any;

  constructor(
    public dialog: MatDialog,
    private juryOrganizationService: JuryOrganizationService,
    private parseUTCToLocal: ParseUtcToLocalPipe,
    private parseLocalToUTC: ParseLocalToUtcPipe,
    private pageTitleService: PageTitleService,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private coreService: CoreService,
    private router: Router,
    private ngZone: NgZone,
  ) { }

  ngOnInit() {
    this.initSearch();
    this.route.queryParams.subscribe((params) => {
      if (params['id']) {
        this.juryOrganizationId = params['id'];
        this.getJuryData();
      }
    });
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (this.dataLoaded) this.fetchSchedules();
        }),
      )
      .subscribe();

    // only emit if there has been 50 emissions, and take only 3 emits.
    // Used to prevent too many calls to update sticky table and take(n) is not enough
    // this makes the rendering much lighter
    this.subs.sink = this.ngZone.onMicrotaskEmpty.pipe(bufferCount(50), take(3)).subscribe((resp) => {
      this.table.updateStickyColumnStyles();
    });
  }

  openJuryKit() {

    this.dialog
      .open(JuryKitDialogComponent, {
        panelClass: 'certification-rule-pop-up',
        width: '600px',
        data: this.juryData,
        disableClose: true,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          // After updating jury kit, cannot save with school error. data us mutated with getAssignJuryData
          // this.getAssignJuryData();
          // this.router.navigate(['/jury-organization/setup-schedule/'], {
          //   queryParams: { id: this.juryOrganizationId },
          // });
          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() =>
            this.router.navigate(['/jury-organization/setup-schedule/'], {
              queryParams: { id: this.juryOrganizationId },
            }),
          );
        }
      });
  }

  csvTypeSelectionDownload() {
    const inputOptions = {
      ',': this.translate.instant('IMPORT_TEMPLATE_S1.COMMA'),
      ';': this.translate.instant('IMPORT_TEMPLATE_S1.SEMICOLON'),
      tab: this.translate.instant('IMPORT_TEMPLATE_S1.TAB'),
    };

    Swal.fire({
      type: 'question',
      title: this.translate.instant('IMPORT_TEMPLATE_S1.TITLE'),
      footer: `<span style="margin-left: auto">IMPORT_TEMPLATE_S1</span>`,
      width: 465,
      allowEscapeKey: true,
      showCancelButton: true,
      cancelButtonText: this.translate.instant('IMPORT_TEMPLATE_S1.CANCEL'),
      confirmButtonText: this.translate.instant('IMPORT_TEMPLATE_S1.OK'),
      input: 'radio',
      inputOptions: inputOptions,
      // inputValidator: (value) => {
      //   return new Promise((resolve, reject) => {
      //     if (value) {
      //       resolve(value);
      //       Swal.enableConfirmButton();
      //     } else {
      //       Swal.disableConfirmButton();
      //       reject(this.translate.instant('IMPORT_TEMPLATE_S1.INVALID'));
      //     }
      //   });
      // },
      onOpen: function () {
        Swal.disableConfirmButton();
        Swal.getContent().addEventListener('click', function (e) {
          Swal.enableConfirmButton();
        });
      },
    }).then((separator) => {
      if (separator.value) {
        const fileType = separator.value;
        this.downloadCSVTemplate(fileType, this.setupScheduleInfo.rncp_id._id, this.setupScheduleInfo.class_id._id);
      }
    });
  }
  downloadCSVTemplate(fileType, rncpId, classId) {
    let url = environment.apiUrl;
    url = url.replace('graphql', '');
    const element = document.createElement('a');
    const lang = this.translate.currentLang;
    const schoolId = this.schoolSuperFilter.value ? this.schoolSuperFilter.value : '';
    let delimeter = null;
    switch (fileType) {
      case ',':
        delimeter = 'comma';
        break;
      case ';':
        delimeter = 'semicolon';
        break;
      case 'tab':
        delimeter = 'tab';
        break;
      default:
        delimeter = null;
        break;
    }
    const path = `download/retakeGrandOralCSV/${false}/${rncpId}/${classId}/${lang}/${delimeter}/${schoolId}`;
    element.href = url + path;


    element.target = '_blank';
    element.download = 'Template Import CSV';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  csvTypeSelectionUpload() {
    const inputOptions = {
      ',': this.translate.instant('IMPORT_DECISION_S1.COMMA'),
      ';': this.translate.instant('IMPORT_DECISION_S1.SEMICOLON'),
      tab: this.translate.instant('IMPORT_DECISION_S1.TAB'),
    };

    Swal.fire({
      type: 'question',
      title: this.translate.instant('IMPORT_DECISION_S1.TITLE'),
      footer: `<span style="margin-left: auto">IMPORT_DECISION_S1</span>`,
      width: 465,
      allowEscapeKey: true,
      showCancelButton: true,
      cancelButtonText: this.translate.instant('IMPORT_DECISION_S1.CANCEL'),
      confirmButtonText: this.translate.instant('IMPORT_DECISION_S1.OK'),
      input: 'radio',
      inputOptions: inputOptions,
      inputValue: this.translate && this.translate.currentLang === 'fr' ? ';' : '',
      inputValidator: (value) => {
        return new Promise((resolve, reject) => {
          if (value) {
            resolve('');
            Swal.enableConfirmButton();
          } else {
            Swal.disableConfirmButton();
            reject(this.translate.instant('IMPORT_DECISION_S1.INVALID'));
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
        if (inputValue === ';') {
          Swal.enableConfirmButton();
        }
      },
    }).then((separator) => {
      if (separator.value) {
        const fileType = separator.value;
        this.openImportDialog(fileType);
      }
    });
  }

  openImportDialog(fileType) {
    let delimeter = null;
    switch (fileType) {
      case ',':
        delimeter = 'comma';
        break;
      case ';':
        delimeter = 'semicolon';
        break;
      case 'tab':
        delimeter = 'tab';
        break;
      default:
        delimeter = null;
        break;
    }
    // const schoolId;
    const titleId = this.setupScheduleInfo && this.setupScheduleInfo.rncp_id ? this.setupScheduleInfo.rncp_id._id : null;
    const classId = this.setupScheduleInfo && this.setupScheduleInfo.class_id ? this.setupScheduleInfo.class_id._id : null;
    this.dialog
      .open(ImportSchedulesDialogComponent, {
        width: '500px',
        minHeight: '200px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          juryId: this.juryOrganizationId,
          schoolId: this.schoolSuperFilter.value ? this.schoolSuperFilter.value : '',
          titleId: titleId,
          classId: classId,
          delimeter: delimeter,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.fetchSchedules();
          this.selection.clear();
          this.allSelected = false;
        }
      });
  }

  assignJuries() {
    const school = this.schoolSuperList.find((el) => el._id === this.schoolSuperFilter.value);
    const studentIds = [...this.dataSource.data]
      .filter((data) => this.selection.selected.includes(data._id))
      .map((el) => el.student_id._id);
    this.dialog
      .open(AssignJuriesMultipleComponent, {
        disableClose: true,
        width: '750px',
        panelClass: 'certification-rule-pop-up',
        data: {
          juryId: this.juryData._id,
          rncpId: this.setupScheduleInfo.rncp_id._id,
          classId: this.setupScheduleInfo.class_id._id,
          certifier: this.juryData.certifier,
          studentIds: studentIds,
          numberStudent: studentIds.length,
          schoolId: school._id,
          schoolName: school.short_name,
          is_all_selected: this.allSelected,
          count_document:
            this.dataSource.data && this.dataSource.data.length && this.dataSource.data[0].count_document
              ? this.dataSource.data[0].count_document
              : 0,
          filter: this.allSelected ? this.filteredValues : null,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.fetchSchedules();
          this.selection.clear();
          this.allSelected = false;
        }
      });
  }

  onSetSession() {
    this.dialog
      .open(SetSessionMultipleComponent, {
        disableClose: true,
        minWidth: '600px',
        maxWidth: '600px',
        panelClass: 'certification-rule-pop-up',
        data: {
          juryId: this.juryData._id,
          is_all_selected: this.allSelected,
          students: this.allSelected ? null : [...this.dataSource.data].filter((data) => this.selection.selected.includes(data._id)),
          school: this.schoolSuperList.find((school) => school._id === this.schoolSuperFilter.value) || null,
          rncp_id: this.setupScheduleInfo.rncp_id._id || null,
          class_id: this.setupScheduleInfo.class_id._id || null,
          count_document:
            this.dataSource.data && this.dataSource.data.length && this.dataSource.data[0].count_document
              ? this.dataSource.data[0].count_document
              : 0,
          filter: this.allSelected ? this.filteredValues : null,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.selection.clear();
          this.allSelected = false;
          this.fetchSchedules();
        }
      });
  }
  multiplePublish() {
    const studentIds = [...this.dataSource.data]
      .filter((data) => this.selection.selected.includes(data._id))
      .map((el) => el.student_id._id);

    Swal.fire({
      type: 'warning',
      title: this.translate.instant('RGO_S9.TITLE'),
      html: this.translate.instant('RGO_S9.TEXT', {
        numberStudent: this.allSelected ? this.dataSource.data[0].count_document : studentIds.length,
      }),
      footer: `<span style="margin-left: auto">RGO_S9</span>`,
      confirmButtonText: this.translate.instant('RGO_S9.BUTTON_1'),
      cancelButtonText: this.translate.instant('RGO_S9.BUTTON_2'),
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
      showCancelButton: true,
      confirmButtonClass: 'btn-danger',
    }).then((confirm) => {
      if (confirm.value) {
        this.juryOrganizationService
          .publishJuryOrganizationSchedule(
            this.juryOrganizationId,
            this.juryData.rncp_titles[0].rncp_id._id,
            this.juryData.rncp_titles[0].class_id._id,
            this.filteredValues,
            this.allSelected,
            studentIds, // will be ignored in the service if all selected is true
          )
          .subscribe(
            (resp) => {
              if (resp.schedule_not_triggered.length) {
                this.swalRGOS9b();
              } else {
                Swal.fire({
                  type: 'success',
                  title: this.translate.instant('Bravo!'),
                  confirmButtonText: this.translate.instant('OK'),
                  allowEnterKey: false,
                  allowEscapeKey: false,
                  allowOutsideClick: false,
                }).then((resp) => {
                  this.fetchSchedules();
                });
              }
            },
            (error) => {
              this.swalError(error);
              // if (
              //   error.message.includes('cannot publish, the schedule already published') ||
              //   error.message.includes('cannot publish, the schedule doesnt have jury')
              // ) {
              // Swal.fire({
              //   type: 'success',
              //   title: this.translate.instant('RGO_S9b.TITLE'),
              //   html: this.translate.instant('RGO_S9b.TEXT'),
              //   confirmButtonText: this.translate.instant('RGO_S9b.BUTTON'),
              //   allowEnterKey: false,
              //   allowEscapeKey: false,
              //   allowOutsideClick: false,
              // }).then(resp => {
              //   this.fetchSchedules();
              // })
              // }
            },
          );
      }
    });
  }

  individualPublish(element) {
    if (element.is_published) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('RGO_S3.TITLE', {
          civility: this.translate.instant(element.student_id.civility),
          first_name: element.student_id.first_name,
          last_name: element.student_id.last_name,
        }),
        html: this.translate.instant('RGO_S3.TEXT'),
        footer: `<span style="margin-left: auto">RGO_S3</span>`,
        confirmButtonText: this.translate.instant('RGO_S3.BUTTON_1'),
        cancelButtonText: this.translate.instant('RGO_S3.BUTTON_2'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
        showCancelButton: true,
        confirmButtonClass: 'btn-danger',
      }).then((confirm) => {
        if (confirm.value) {
          this.unpublishRetakeGrandOral(element);
        }
      });
    } else {
      this.subs.sink = this.juryOrganizationService.getOneJuryOrganizationSchedule(element._id).subscribe((resp) => {
        if (resp.date_test === null || resp.start_time === null || resp.test_duration === null || resp.president_of_jury === null) {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('RGO_S1.TITLE'),
            html: this.translate.instant('RGO_S1.TEXT'),
            footer: `<span style="margin-left: auto">RGO_S1</span>`,
            confirmButtonText: this.translate.instant('RGO_S1.BUTTON'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          });
          return;
        }
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('RGO_S2.TITLE'),
          html: this.translate.instant('RGO_S2.TEXT', {
            civility: this.translate.instant(element.student_id.civility),
            first_name: element.student_id.first_name,
            last_name: element.student_id.last_name,
            date: element.date_test,
            time: element.start_time,
            duration: element.test_duration,
            president: element.president_of_jury.last_name + ' ' + element.president_of_jury.first_name,
          }),
          footer: `<span style="margin-left: auto">RGO_S2</span>`,
          confirmButtonText: this.translate.instant('RGO_S2.BUTTON_1'),
          cancelButtonText: this.translate.instant('RGO_S2.BUTTON_2'),
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
          showCancelButton: true,
          confirmButtonClass: 'btn-danger',
        }).then((confirm) => {
          if (confirm.value) {
            this.juryOrganizationService
              .publishJuryOrganizationSchedule(
                this.juryOrganizationId,
                this.juryData.rncp_titles[0].rncp_id._id,
                this.juryData.rncp_titles[0].class_id._id,
                this.filteredValues,
                false,
                element.student_id._id,
              )
              .subscribe((resp) => {
                if (resp) {
                  Swal.fire({
                    type: 'success',
                    title: this.translate.instant('Bravo !'),
                  }).then((resp) => {
                    this.fetchSchedules();
                  });
                }
              });
          }
        });
      });
    }
  }

  unpublishRetakeGrandOral(element) {
    this.isWaitingForResponse = true;
    this.juryOrganizationService
      .unPublishJuryOrganizationSchedule(
        this.juryOrganizationId,
        this.juryData.rncp_titles[0].rncp_id._id,
        this.juryData.rncp_titles[0].class_id._id,
        element.student_id._id,
      )
      .subscribe(
        async (resp) => {
          this.isWaitingForResponse = false;
          if (resp) {
            await Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo'),
            });
            this.fetchSchedules();
          }
        },
        (error) => {
          this.isWaitingForResponse = false;
          return;
        },
      );
  }

  // *** Get Current Jury Data +++ //
  getJuryData() {
    this.subs.sink = this.juryOrganizationService.getOneJuryOrganizationDataById(this.juryOrganizationId).subscribe(
      (resp) => {
        this.juryData = cloneDeep(resp);
        this.setPageTitle(this.juryData);

        // ASSIGN TO Setup Schedule Info
        if (resp && resp.rncp_titles[0]) {
          this.setupScheduleInfo = resp.rncp_titles[0];
          if (this.setupScheduleInfo && this.setupScheduleInfo.schools && this.setupScheduleInfo.schools.length) {
            this.schoolSuperList = this.setupScheduleInfo.schools.map((school) => {
              return school.school;
            });
            this.schoolSuperList = _.sortBy(this.schoolSuperList, 'short_name');
            this.schoolList = this.schoolSuperList;
          }

          // set up blocks for the dynamic columns
          resp.rncp_titles[0].blocks_for_grand_oral.map((block) => {
            if (block?.block_id?.is_specialization) {
              this.specializationBlock = [...this.specializationBlock, block.block_id._id]
            } else {
              this.juryBlocks = [...this.juryBlocks, block.block_id._id]
            }
          });
          if (this.juryBlocks.length) {
            this.juryBlocks.forEach((block, index) => {
              this.blockForms[`B${index}`] = '';
            });
          }
          if (this.specializationBlock.length) {
            this.specializationBlock.forEach((block, index) => {
              this.blockSpecializationForms[`S${index}`] = '';
            });
          }
          this.allDataBlock = this.juryBlocks.concat(this.specializationBlock);

          this.setUpBlockColumns(this.juryBlocks, this.specializationBlock);
          this.fetchSchedules();
        }
      },
      (err) => {

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: 'OK',
        });
      },
    );
  }

  fetchSchedules() {
    this.isWaitingForResponse = true;
    const pagination = {
      limit: this.paginator && this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator && this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    const filter = _.cloneDeep(this.filteredValues);
    filter['offset'] = moment().utcOffset();
    this.subs.sink = this.juryOrganizationService
      .getAllJuryOrganizationSchedule(this.juryOrganizationId, pagination, filter, this.sortValue)
      .subscribe(
        (schedules) => {
          this.isWaitingForResponse = false;
          if (schedules) {
            const formattedResp = cloneDeep(schedules);
            this.formatDateResp(formattedResp);
            this.constructBlockMatrix(formattedResp);
            this.dataSource.data = cloneDeep(formattedResp);
            this.dataCount = schedules && schedules.length ? schedules[0].count_document : 0;
            this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
            this.dataLoaded = true;
          }
        },
        (error) => {
          this.isWaitingForResponse = false;
        },
      );
  }

  // used as reference to display true or false for each blocks cell in the dynamic block columns
  constructBlockMatrix(resp) {
    resp.forEach((element, index) => {
      const boolArray: boolean[] = this.allDataBlock.map((block, blockIndex) =>
        this.isBlockChecked(element.blocks_for_grand_oral, blockIndex),
      );
      this.blockMatrix[index] = boolArray;
    });
  }

  isBlockChecked(elementBlocks: any[], index: number): boolean {
    if (!elementBlocks || !elementBlocks.length) {
      return false;
    }
    const blockIds = elementBlocks.map((block) => block.block_id._id); // get per schedule block ids
    const isFoundIndex = blockIds.indexOf(this.allDataBlock[index]); // check if the current juryBlock id is in the schedule blocks by getting index
    return isFoundIndex >= 0 && elementBlocks[isFoundIndex] && elementBlocks[isFoundIndex].is_retaking; // if found, check if the particular schedule block has is_retaking set to true or not
  }

  // this function parses ISO date and time return from BE and convert it to local time from UTC
  formatDateResp(schedules) {
    for (const schedule of schedules) {
      if (schedule && schedule.date_test) {
        // schedule.date_test = this.parseUTCToLocal.transformISODateToString(schedule.date_test);
        schedule.date_test = this.convertUTCToLocalDate({ date: schedule.date_test, time_start: schedule.start_time });
      }
      if (schedule && schedule.start_time) {
        schedule.start_time = this.parseUTCToLocal.transform(schedule.start_time);
      }
      if (schedule && schedule.end_time) {
        schedule.end_time = this.parseUTCToLocal.transform(schedule.end_time);
      }
    }
  }

  sortData(sort: Sort) {
    if (sort.active.split('-')[0] === 'block') {
      this.sortValue = { block_id: sort.active.split('-')[2], block_status: sort.direction ? sort.direction : `asc` };
    } else {
      this.sortValue = sort.active ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    }
    this.paginator.pageIndex = 0;
    this.fetchSchedules();
  }

  // SEARCH TABLE DATA
  initSearch() {
    this.subs.sink = this.studentFilter.valueChanges.pipe(debounceTime(500)).subscribe((searchText) => {

      this.paginator.pageIndex = 0;
      this.filteredValues.student_name = searchText;
      this.fetchSchedules();
    });
    this.subs.sink = this.dateFilter.valueChanges.pipe(debounceTime(500)).subscribe((searchText) => {

      this.paginator.pageIndex = 0;
      this.filteredValues.date_test = searchText
        ? this.parseLocalToUTC.transformDate(moment(searchText).format('DD/MM/YYYY'), '15:59')
        : null;
      this.fetchSchedules();
    });
    this.subs.sink = this.startFilter.valueChanges.pipe(debounceTime(500)).subscribe((searchText) => {

      this.paginator.pageIndex = 0;
      this.filteredValues.start_time = searchText ? this.parseLocalToUTC.transform(searchText) : null;
      this.fetchSchedules();
    });
    this.subs.sink = this.endFilter.valueChanges.pipe(debounceTime(500)).subscribe((searchText) => {

      this.paginator.pageIndex = 0;
      this.filteredValues.end_time = searchText ? this.parseLocalToUTC.transform(searchText) : null;
      this.fetchSchedules();
    });
    this.subs.sink = this.presidentFilter.valueChanges.pipe(debounceTime(500)).subscribe((searchText) => {

      this.paginator.pageIndex = 0;
      this.filteredValues.president_jury_name = searchText;
      this.fetchSchedules();
    });
    this.subs.sink = this.professionalFilter.valueChanges.pipe(debounceTime(500)).subscribe((searchText) => {

      this.paginator.pageIndex = 0;
      this.filteredValues.profesional_jury_name = searchText;
      this.fetchSchedules();
    });
    this.subs.sink = this.academicFilter.valueChanges.pipe(debounceTime(500)).subscribe((searchText) => {

      this.paginator.pageIndex = 0;
      this.filteredValues.academic_jury_name = searchText;
      this.fetchSchedules();
    });
    this.subs.sink = this.subtituteFilter.valueChanges.pipe(debounceTime(500)).subscribe((searchText) => {

      this.paginator.pageIndex = 0;
      this.filteredValues.substitution_jury_name = searchText;
      this.fetchSchedules();
    });
    this.subs.sink = this.statusFilter.valueChanges.pipe(debounceTime(500)).subscribe((searchText) => {

      this.paginator.pageIndex = 0;
      this.filteredValues.is_publish = searchText;
      this.fetchSchedules();
    });
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.allSelected = false;
    } else {
      this.dataSource.data.forEach((row) => this.selection.select(row));
      this.allSelected = true;
    }
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  /*
   * Check is all student checked*/
  isAllSelected() {
    if (!this.dataSource.data) return;
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }
  setUpBlockColumns(blocks: string[], specialBlocks: string[]) {
    blocks.forEach((element, index) => {
      this.displayedColumns.splice(3 + index, 0, `B${index + 1}`);
      this.filterColumns.splice(3 + index, 0, `B${index + 1}_filter`);
    });
    specialBlocks.forEach((element, index) => {
      this.displayedColumns.splice(3 + blocks.length + index, 0, `S${index + 1}`);
      this.filterColumns.splice(3 + blocks.length + index, 0, `S${index + 1}_filter`);
    });
  }

  selectSuperFilterSchool() {

    this.getDataSchool(this.schoolSuperFilter.value);
    // The filter to fetch new data

    this.schoolFilter.patchValue(null, { emitEvent: false }); // clear the school filter inside
    this.filteredValues.school_id = this.schoolSuperFilter.value ? this.schoolSuperFilter.value : null;
    this.paginator.pageIndex = 0;
    this.selection.clear();
    this.sortValue = null;
    this.fetchSchedules();

    // To filter the dropdown on school filter inside table
    if (this.schoolSuperFilter.value) {
      this.schoolList = this.schoolSuperList.filter((school) => school._id === this.schoolSuperFilter.value);
    } else {
      this.schoolList = this.schoolSuperList;
    }
  }

  getDataSchool(data) {
    if (data === '') {
      this.schoolAddressHide = true;
    } else {

      const result = this.schoolSuperList.find((item) => item._id === data);
      this.schoolAddress = result;

      this.schoolAddressHide = false;
    }
  }

  selectSuperFilterStatus() {

    this.filteredValues.student_status = this.statusSuperFilter.value ? this.statusSuperFilter.value : null;
    this.paginator.pageIndex = 0;
    this.selection.clear();
    this.sortValue = null;
    this.fetchSchedules();
  }

  selectSchoolType() {
    this.schoolSuperFilter.patchValue(null, { emitEvent: false });
    this.filteredValues.school_id = this.schoolFilter.value ? this.schoolFilter.value : null;
    if (!this.schoolFilter.value) {
      this.schoolList = this.schoolSuperList;
    }
    this.paginator.pageIndex = 0;
    this.fetchSchedules();
  }

  // Open Dialog setSessionAsignJury
  setSessionAsignJury(dataTable: any) {
    const school = this.schoolSuperList.find((el) => el._id === this.schoolSuperFilter.value);
    const studentIds = [...this.dataSource.data]
      .filter((data) => this.selection.selected.includes(data._id))
      .map((el) => el.student_id._id);

    this.dialog
      .open(SetSessionJuriesIndividualComponent, {
        disableClose: true,
        width: '750px',
        panelClass: 'certification-rule-pop-up',
        data: {
          _id: dataTable._id,
          juryOrgData: this.juryData,
          schoolId: dataTable.school._id,
          juryOrgId: this.juryOrganizationId,
          studentIds: studentIds,
          numberStudent: studentIds.length,
          is_postpone: false,
          // schoolName: school.short_name,
          // juryOrgData: this.juryData,
          // schoolId: school._id,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.fetchSchedules();
        }
      });
  }

  setPageTitle(data) {
    if (data) {
      this.pageTitleService.setRetakeJuryData(data);
    }
  }

  // route
  goPreviousStep() {
    this.router.navigate(['jury-organization', this.juryData._id, 'organize-juries', 'grand-oral-jury-parameter']);
  }

  allJuryOrganization() {
    this.router.navigate(['jury-organization']);
  }

  // RESET
  resetSelection() {
    // this.isReset = true;
    this.selection.clear();
    this.allSelected = false;
    this.paginator.pageIndex = 0;
    this.filteredValues = {
      school_id: this.schoolSuperFilter.value ? this.schoolSuperFilter.value : null,
      student_status: null,
      student_name: '',
      date_test: '',
      start_time: '',
      end_time: '',
      president_jury_name: '',
      profesional_jury_name: '',
      academic_jury_name: '',
      substitution_jury_name: '',
      is_publish: null,
      block: null,
    };

    // clear all forms in blockForms
    for (const key of Object.keys(this.blockForms)) {
      this.blockForms[key] = '';
    }
    for (const key of Object.keys(this.blockSpecializationForms)) {
      this.blockSpecializationForms[key] = '';
    }

    this.sortValue = null;
    this.studentFilter.patchValue(null, { emitEvent: false });
    this.dateFilter.patchValue(null, { emitEvent: false });
    this.startFilter.patchValue(null, { emitEvent: false });
    this.endFilter.patchValue(null, { emitEvent: false });
    this.presidentFilter.patchValue(null, { emitEvent: false });
    this.professionalFilter.patchValue(null, { emitEvent: false });
    this.academicFilter.patchValue(null, { emitEvent: false });
    this.subtituteFilter.patchValue(null, { emitEvent: false });
    this.statusFilter.patchValue(null, { emitEvent: false });
    this.schoolFilter.patchValue(null, { emitEvent: false });

    this.fetchSchedules();
  }

  updateFilterBlockValue(id: string, status: any) {
    let blocks = this.filteredValues.block ? [...this.filteredValues.block] : [];
    const indexOfBlock = blocks.findIndex((block) => block && block.block_id && block.block_id === id);
    if (indexOfBlock >= 0) {
      blocks.splice(indexOfBlock, 1);
    }
    if (status && status.value !== '') {
      blocks.push({
        block_id: id,
        block_status: status.value,
      });
    }
    this.filteredValues.block = blocks;
    this.fetchSchedules();
  }

  swalRGOS9b() {
    Swal.fire({
      type: 'success',
      title: this.translate.instant('RGO_S9b.TITLE'),
      html: this.translate.instant('RGO_S9b.TEXT'),
      footer: `<span style="margin-left: auto">RGO_S9b</span>`,
      confirmButtonText: this.translate.instant('RGO_S9b.BUTTON'),
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((resp) => {
      this.fetchSchedules();
    });
  }

  convertUTCToLocalDate(data) {

    const date = moment(data.date).format('DD/MM/YYYY');
    const time = data.time_start;

    const dateTimeInLocal = moment(date + time, 'DD/MM/YYYYHH:mm');


    // return dateTimeInLocal.toISOString();
    return dateTimeInLocal.format('DD/MM/YYYY');
  }

  swalError(err) {
    this.isWaitingForResponse = false;

    if (
      err['message'] === 'GraphQL error: cannot publish, the schedule already published' ||
      err['message'] === 'GraphQL error: cannot publish, the schedule doesnt have jury'
    ) {
      this.swalRGOS9b();
    } else {
      Swal.fire({
        type: 'error',
        title: 'Error',
        text: err && err['message'] ? err['message'] : err,
        confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
      });
    }
  }

  getDataBlockSpecialization(row, specialId) {
    let result = false;
    row.blocks_for_grand_oral.forEach( data => {
      if (data?.block_id?._id === specialId) {
        result = true
      }
    })
    return result;
  }

  goToScheduleJuries() {
    this.router.navigate(['jury-organization', this.juryOrganizationId, 'schedule-juries']);
  }

  ngOnDestroy() {
    this.pageTitleService.setRetakeJuryData(null);
    this.subs.unsubscribe();
  }
}
