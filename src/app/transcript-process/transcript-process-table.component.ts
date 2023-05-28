import { PermissionService } from 'app/service/permission/permission.service';
import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
// import { Observable } from 'apollo-link';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { SubSink } from 'subsink';
import { MatDialog } from '@angular/material/dialog';
import { TranscriptProcessDialogComponent } from './transcript-process-dialog/transcript-process-dialog.component';
import { TranscriptProcessService } from 'app/service/transcript-process/transcript-process.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';
import { startWith, tap, debounceTime, map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { UtilityService } from 'app/service/utility/utility.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { CoreService } from 'app/service/core/core.service';

@Component({
  selector: 'ms-transcript-process-table',
  templateUrl: './transcript-process-table.component.html',
  styleUrls: ['./transcript-process-table.component.scss'],
})
export class TranscriptProcessTableComponent implements OnInit, AfterViewInit, OnDestroy {
  typeList = [
    { id: 'all', name: 'All' },
    { id: 'Final Transcript', name: 'TRANSCRIPT_PROCESS.Final Transcript' },
    { id: 'Transcript', name: 'TRANSCRIPT_PROCESS.Transcript' },
  ];

  statusList = [
    { id: 'all', name: 'All' },
    { id: 'Initial Setup', name: 'TRANSCRIPT_PROCESS.INITIAL_SETUP' },
    { id: 'Input Decision', name: 'TRANSCRIPT_PROCESS.INPUT_DECISION' },
    { id: 'Retake', name: 'TRANSCRIPT_PROCESS.RETAKE' },
    { id: 'Completed', name: 'TRANSCRIPT_PROCESS.COMPLETED' },
  ];

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  private subs = new SubSink();
  displayedColumns: string[] = ['transcriptName', 'title', 'class', 'certifier', 'type', 'status', 'action'];
  filterColumns: string[] = [
    'transcriptNameFilter',
    'titleFilter',
    'classFilter',
    'certifierFilter',
    'typeFilter',
    'statusFilter',
    'actionFilter',
  ];
  dataSource = new MatTableDataSource([]);

  transcriptNameFilter = new UntypedFormControl('');
  transcriptNameFilterList = [];
  filteredTranscriptName: Observable<string[]>;

  titlesArray: any[] = [];
  filteredTitles: Observable<string[]>;
  nameFilter = new UntypedFormControl('');

  titleFilter = new UntypedFormControl('');
  rncpTitleFilterList = [];
  filteredRncpTitle: Observable<string[]>;

  classFilter = new UntypedFormControl('');
  classFilterList = [];
  filteredClass: Observable<string[]>;

  certifierFilter = new UntypedFormControl('');
  certifierFilterList = [];
  filteredCertifier: Observable<string[]>;

  typeFilter = new UntypedFormControl('all');
  typeFilterList = [];
  filteredType: Observable<string[]>;

  statusFilter = new UntypedFormControl('all');
  statusFilterList = [];
  filteredStatus: Observable<string[]>;

  filteredValues = {
    name: '',
    rncp_title_id: '',
    class_id: '',
    certifier_id: '',
    type: 'all',
    status: 'all',
  };

  noData;
  dataCount = 0;
  sortValue = null;
  isReset = false;
  isWaitingForResponse = false;
  dataLoaded = false;

  // tempData = [
  //   {
  //     transcript_name: 'dummytest',
  //     title: {
  //       _id: '01',
  //       short_name: 'Dummy Title 2021',
  //     },
  //     class: {
  //       _id: '02',
  //       name: 'Dummy Class 2021',
  //     },
  //     certifier: {
  //       _id: '03',
  //       name: 'Dummy Certifier 2021',
  //     },
  //     type: '',
  //     status: 'initial_setup',
  //   },
  //   {
  //     transcript_name: 'dummytest2',
  //     title: {
  //       _id: '01',
  //       short_name: 'Dummy Title 2022',
  //     },
  //     class: {
  //       _id: '02',
  //       name: 'Dummy Class 2022',
  //     },
  //     certifier: {
  //       _id: '03',
  //       name: 'Dummy Certifier 2022',
  //     },
  //     type: '',
  //     status: 'input_decision',
  //   },
  // ];

  constructor(
    private pageTitleService: PageTitleService,
    private router: Router,
    public dialog: MatDialog,
    private transcriptService: TranscriptProcessService,
    private translate: TranslateService,
    private utilityService: UtilityService,
    private rncpTitleService: RNCPTitlesService,
    public permissionService: PermissionService
  ) {}

  ngOnInit() {
    this.pageTitleService.setTitle('List of Student Transcript Process');
    this.pageTitleService.setIcon('bullseye-arrow');

    this.getDataTranscriptProcessTable();
    // this.dataSource.data = this.tempData;
    this.filterListener();
    this.getAllDropdownLists();
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (!this.isReset) {
            this.getDataTranscriptProcessTable();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
  }


  getAllDropdownLists() {
    this.subs.sink = this.transcriptService.getTableTranscriptProcess(null, null, this.filteredValues).subscribe(
      (resp) => {


        this.rncpTitleFilterList = _.uniqBy(resp, 'rncp_title_id._id').map((data) => data.rncp_title_id);
        this.classFilterList = _.uniqBy(resp, 'class_id._id').map((data) => data.class_id);
        this.certifierFilterList = _.uniqBy(resp, 'certifier_id._id').map((data) => data.certifier_id);
        // this.typeFilterList = _.uniqBy(resp, 'type').map((data)=>data.type).filter((data)=>data !== null);


        this.getTitleDropdownList();
        this.getClassDropdownList();
        this.getCertifierDropdownList();
      },
      (err) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  setTitleFilter(titleId: string) {
    this.filteredValues.rncp_title_id = titleId;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getDataTranscriptProcessTable();
    }
  }

  setClassFilter(classId: string) {
    this.filteredValues.class_id = classId;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getDataTranscriptProcessTable();
    }
  }

  setCertifierFilter(certifierId: string) {
    this.filteredValues.certifier_id = certifierId;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getDataTranscriptProcessTable();
    }
  }

  getDataTranscriptProcessTable() {
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };

    if (this.typeFilter.value === 'Final Transcript') {
      this.filteredValues.type = 'final_transcript';
    } else if (this.typeFilter.value === 'Transcript') {
      this.filteredValues.type = 'transcript';
    } else {
      delete this.filteredValues.type;
    }

    if (this.statusFilter.value === 'Initial Setup') {
      this.filteredValues.status = 'initial_setup';
    } else if (this.statusFilter.value === 'Input Decision') {
      this.filteredValues.status = 'input_decision';
    } else if (this.statusFilter.value === 'Retake') {
      this.filteredValues.status = 'retake';
    } else if (this.statusFilter.value === 'Completed') {
      this.filteredValues.status = 'completed';
    } else {
      delete this.filteredValues.status;
    }

    this.isWaitingForResponse = true;

    this.subs.sink = this.transcriptService.getTableTranscriptProcess(pagination, this.sortValue, this.filteredValues).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;

        const response = _.cloneDeep(resp);
        if (response && response.length) {
          this.dataSource.data = response;
          this.dataCount = response[0] && response[0].count_document ? response[0].count_document : 0;
        } else {
          this.dataSource.data = [];
          this.dataCount = 0;
        }
        this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
        this.getAllDropdownLists();
      },
      (err) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  filterListener() {
    this.subs.sink = this.transcriptNameFilter.valueChanges.pipe(debounceTime(800)).subscribe((name) => {
      const symbol = /[!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      // if (!name.match(symbol) && !name.match(symbol1)) {
        this.filteredValues.name = name ? name.toLowerCase() : '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getDataTranscriptProcessTable();
        }
      // } else {
      //   this.transcriptNameFilter.setValue('');
      //   this.filteredValues.name = '';
      //   this.paginator.pageIndex = 0;
      //   if (!this.isReset) {
      //     this.getDataTranscriptProcessTable();
      //   }
      // }
      this.isReset = false;
    });

    this.subs.sink = this.statusFilter.valueChanges.subscribe((status) => {
      this.filteredValues.status = status;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getDataTranscriptProcessTable();
      }
    });

    this.subs.sink = this.typeFilter.valueChanges.subscribe((type) => {
      this.filteredValues.type = type;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getDataTranscriptProcessTable();
      }
    });
  }

  getTitleDropdownList() {
    this.filteredRncpTitle = this.titleFilter.valueChanges.pipe(
      startWith(''),
      map((searchTxt) =>
        this.rncpTitleFilterList.filter((titleItem) => {
          return titleItem.short_name.toLowerCase().includes(searchTxt.toLowerCase());
        }),
      ),
    );
  }

  getClassDropdownList() {
    this.filteredClass = this.classFilter.valueChanges.pipe(
      startWith(''),
      map((searchTxt) =>
        this.classFilterList.filter((classItem) => {
          return classItem.name.toLowerCase().includes(searchTxt.toLowerCase());
        }),
      ),
    );
  }

  getCertifierDropdownList() {
    this.filteredCertifier = this.certifierFilter.valueChanges.pipe(
      startWith(''),
      map((searchTxt) =>
        this.certifierFilterList.filter((certifierItem) => {
          return certifierItem.short_name.toLowerCase().includes(searchTxt.toLowerCase());
        }),
      ),
    );
  }

  sortData(sort: Sort) {
    this.sortValue = sort.direction ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getDataTranscriptProcessTable();
      }
    }
  }

  goToTranscriptDetail(data) {

    this.transcriptService.setTranscriptCompleted(data.transcript_process_status === 'completed');
    if (data && data.transcript_process_status === 'initial_setup') {
      this.router.navigate(['transcript-process', data._id]);
    } else {
      this.router.navigate(['transcript-process', data._id], { queryParams: { tab: 'resultInput' } });
    }
  }

  addStudentTranscript() {
    this.dialog
      .open(TranscriptProcessDialogComponent, {
        disableClose: true,
        width: '650px',
        panelClass: 'certification-rule-pop-up',
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {

          this.router.navigate(['transcript-process', result]);

          // this.getDataTranscriptProcessTable();
          // refresh table data
        }
      });
  }

  deleteTranscriptProcessData(transcript) {

    const transcriptId = transcript._id;
    const transcriptName = transcript.name;
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('TRANSCRIPT_S2.TITLE'),
      html: this.translate.instant('TRANSCRIPT_S2.TEXT'),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('TRANSCRIPT_S2.CONFIRM'),
      cancelButtonText: this.translate.instant('TRANSCRIPT_S2.CANCEL'),
      onOpen: () => {
        Swal.disableConfirmButton();
        // const cancelBtnRef = swal.cancelButtonText;
        const confirmBtnRef = Swal.getConfirmButton();
        const time = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('TRANSCRIPT_S2.CONFIRM') + ` (${timeDisabled})`;
          // cancelBtnRef.innerText = this.translate.instant('TRANSCRIPT_S2.PUBLISH.CANCEL');
        }, 1000);

        setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('TRANSCRIPT_S2.CONFIRM');
          // Swal.showCancelButton = this.translate.instant(
          //   'TRANSCRIPT_PROCESS.TRANSCRIPT_S10.BUTTON_NO'
          // );
          Swal.enableConfirmButton();
          clearTimeout(time);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      if (result.value) {
        const deleteTranscriptProcessData = this.transcriptService.deleteTranscriptProcess(transcriptId).subscribe((resp) => {
          if (resp && resp.data) {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('TRANSCRIPT_S3.TITLE'),
              text: this.translate.instant('TRANSCRIPT_S3.TEXT'),
              confirmButtonText: this.translate.instant('TRANSCRIPT_S3.BUTTON'),
            }).then(() => {
              this.getDataTranscriptProcessTable();
              this.getAllDropdownLists();
            });
          }
        });
        this.subs.add(deleteTranscriptProcessData);
      }
    });
  }

  resetAllFilter() {
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    this.filteredValues = {
      name: '',
      rncp_title_id: '',
      class_id: '',
      certifier_id: '',
      type: 'all',
      status: 'all',
    };

    this.transcriptNameFilter.setValue('');
    this.titleFilter.setValue('');
    this.classFilter.setValue('');
    this.certifierFilter.setValue('');
    this.typeFilter.setValue('all');
    this.statusFilter.setValue('all');

    this.getDataTranscriptProcessTable();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.pageTitleService.setIcon('');
    this.pageTitleService.setTitle('');
  }
}
