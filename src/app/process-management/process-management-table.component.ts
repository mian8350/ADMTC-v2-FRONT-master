import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { SubSink } from 'subsink';
import * as moment from 'moment';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Router } from '@angular/router';
import { QuetionaireService } from 'app/questionnaire-tools/quetionaire.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { UntypedFormControl } from '@angular/forms';
import { map } from 'rxjs/operators';
import { CoreService } from 'app/service/core/core.service';
import { TutorialService } from 'app/service/tutorial/tutorial.service';

@Component({
  selector: 'ms-process-management-table',
  templateUrl: './process-management-table.component.html',
  styleUrls: ['./process-management-table.component.scss'],
})
export class ProcessManagementTableComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  private subs = new SubSink();
  dataTutorial: any;
  isTutorialAdded = false;
  tutorialData: any;
  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['name', 'description', 'type', 'titleConnected', 'status', 'action'];
  filterColumns: string[] = ['NameFilter', 'descFilter', 'typeFilter', 'titleFilter', 'statusFilter', 'actionFilter'];
  filteredValues = {
    published_status: '',
    date: '',
    questionnaire_type: '',
    questionnaire_name: '',
  };

  NameFilter = new UntypedFormControl('');
  dateFilter = new UntypedFormControl('');
  byFilter = new UntypedFormControl('all');
  statusFilter = new UntypedFormControl('');
  TypeFilter = new UntypedFormControl('');
  byList = [{ name: 'AllM', id: 'all' }];
  statusList = [
    { name: 'AllM', id: '' },
    { name: 'Published', id: 'publish' },
    { name: 'Not Published', id: 'not_publish' },
  ];
  TypeFilterList = [
    { name: 'All', id: '' },
    { name: 'Employability Survey', id: 'employability_survey' },
    { name: 'Mentor Evaluation', id: 'mentor_evaluation' },
    { name: 'Job Description', id: 'job_description' },
    { name: 'Problematic', id: 'problematic' },
    { name: 'Other', id: 'other' },
  ];

  groupCount = 0;
  noData: any;
  sortValue = null;
  isReset = false;
  dataLoaded = false;
  isWaitingForResponse = false;

  private intVal: any;
  private timeOutVal: any;

  dummyData = [
    {
      name: 'Process 1',
      description: 'Test Description',
      type: 'employability_survey',
      title: [{ short_name: 'V-RMO' }, { short_name: 'V-RMO 2020' }],
      status: 'published_used',
    },
    {
      name: 'Process 2',
      description: 'Test Description 2',
      type: 'job_description',
      title: [{ short_name: 'V-DMOE' }, { short_name: 'V-DMOE 2020' }, { short_name: 'V-DMOE Pigier 2020' }],
      status: 'not_published',
    },
    {
      name: 'Process 3',
      description: 'Test Description 2',
      type: 'mentor_evaluation',
      title: [{ short_name: 'V-DMOE' }, { short_name: 'BTS' }, { short_name: 'V-DMOE Pigier 2020' }, { short_name: 'TFD' }],
      status: 'published_not_used',
    },
  ];

  constructor(
    private questService: QuetionaireService,
    private router: Router,
    public utilService: UtilityService,
    public dialog: MatDialog,
    public permissionService: PermissionService,
    public coreService: CoreService,
    public tutorialService: TutorialService,
  ) {}

  ngOnInit() {
    this.dataSource.data = [];
    this.getAllQuestionnaireTemplate();
    this.initFilter();

    this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
  }



  toggleTutorial(data) {
    this.tutorialService.setTutorialView(data);

    if (this.coreService.sidenavOpen) {
      this.coreService.sidenavOpen = !this.coreService.sidenavOpen;
    }
    this.coreService.sidenavTutorialOpen = !this.coreService.sidenavTutorialOpen;
  }

  ngAfterViewInit() {
    // this.subs.sink = this.paginator.page
    //   .pipe(
    //     startWith(null),
    //     tap(() => {
    //       if (!this.isReset) {
    //         this.getAllQuestionnaireTemplate();
    //       }
    //       this.dataLoaded = true;
    //     }),
    //   )
    //   .subscribe();
  }

  getAllQuestionnaireTemplate() {
    this.dataSource.data = this.dummyData;
    // const pagination = {
    //   limit: this.paginator.pageSize ? this.paginator.pageSize : 2,
    //   page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    // };

    // const filter = _.cloneDeep(this.filteredValues);
    // if (filter) {
    //   if (!filter.published_status) {
    //     delete filter.published_status;
    //   }
    //   if (!filter.date) {
    //     delete filter.date;
    //   }
    //   if (!filter.questionnaire_type) {
    //     delete filter.questionnaire_type;
    //   }
    //   if (!filter.questionnaire_name) {
    //     delete filter.questionnaire_name;
    //   }
    // }

    // this.isWaitingForResponse = true;
    // this.subs.sink = this.questService.getAllQuestionnaireTemplate(filter, this.sortValue, pagination).subscribe((resp: any) => {

    //   if (resp && resp.length) {
    //     this.dataSource.data = resp;
    //     this.groupCount = resp[0].count_document;
    //     this.isWaitingForResponse = false;
    //   } else {
    //     this.dataSource.data = [];
    //     this.groupCount = 0;
    //     this.isWaitingForResponse = false;
    //   }

    //   this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
    //   this.isReset = false;
    // });
  }

  initFilter() {
    // this.subs.sink = this.NameFilter.valueChanges.pipe(debounceTime(800)).subscribe((name) => {

    //   this.filteredValues['questionnaire_name'] = name;
    //   this.getAllQuestionnaireTemplate();
    // });
    // this.subs.sink = this.dateFilter.valueChanges.pipe(debounceTime(800)).subscribe((from_date) => {

    //   const time = moment(from_date).format('DD/MM/YYYY');
    //   this.filteredValues['date'] = time;
    //   this.getAllQuestionnaireTemplate();
    // });
    // this.subs.sink = this.statusFilter.valueChanges.pipe(debounceTime(800)).subscribe((status) => {

    //   this.filteredValues['published_status'] = status;
    //   this.getAllQuestionnaireTemplate();
    // });
    // this.subs.sink = this.TypeFilter.valueChanges.pipe(debounceTime(800)).subscribe((type) => {

    //   this.filteredValues['questionnaire_type'] = type;
    //   this.getAllQuestionnaireTemplate();
    // });
  }

  addQuestionaireTemplate() {
    this.router.navigate(['questionnaire-tools', 'form']);
  }

  sortData(sort: Sort) {

    // if (sort.active === 'questionnaire_name') {
    //   this.sortValue = sort.direction ? { questionnaire_name: sort.direction } : null;
    // } else if (sort.active === 'created_date') {
    //   this.sortValue = sort.direction ? { created_date: sort.direction } : null;
    // } else if (sort.active === 'published_status') {
    //   this.sortValue = sort.direction ? { published_status: sort.direction } : null;
    // } else if (sort.active === 'questionnaire_type') {
    //   this.sortValue = sort.direction ? { questionnaire_type: sort.direction } : null;
    // } else if (sort.active === 'created_by') {
    //   this.sortValue = sort.direction ? { created_by: sort.direction } : null;
    // }
    // this.getAllQuestionnaireTemplate();
  }

  resetSelection() {
    // this.isReset = true;
    // this.paginator.pageIndex = 0;
    // this.sort.sort({ id: '', start: 'asc', disableClear: false });
    // this.filteredValues = {
    //   published_status: '',
    //   date: '',
    //   questionnaire_type: '',
    //   questionnaire_name: '',
    // };
    // this.NameFilter.setValue('', { emitEvent: false });
    // this.dateFilter.setValue('', { emitEvent: false });
    // this.statusFilter.setValue('', { emitEvent: false });
    // this.TypeFilter.setValue('', { emitEvent: false });
    // this.sort.direction = '';
    // this.sort.active = '';
    // this.sortValue = null;
    // this.getAllQuestionnaireTemplate();
  }

  selectTemplate(template) {
    // this.subs.sink = this.questService.getOneQuestionnaireTemplateById(template._id).subscribe((resp) => {
    //   if (resp) {
    //     this.questService.updateQuestionnaire(resp);
    //   } else {
    //     this.questService.resetQuestionnaire();
    //   }
    // });
  }

  editTemplate(template) {

    // this.router.navigate(['questionnaire-tools', 'form', template._id]);
  }

  duplicateTemplate(template) {

    // this.subs.sink = this.dialog
    //   .open(DuplicateTemplateDialogComponent, {
    //     width: '400px',
    //     minHeight: '100px',
    //     panelClass: 'certification-rule-pop-up',
    //     disableClose: true,
    //     data: template,
    //   })
    //   .afterClosed()
    //   .subscribe((response) => {

    //     if (response) {
    //       this.router.navigate(['questionnaire-tools', 'form', response._id]);
    //     }
    //   });
  }

  deleteTemplate(template) {

    // this.subs.sink = this.questService.deleteQuestionnaireTemplate(template._id).subscribe((resp) => {

    //   if (resp) {
    //     Swal.fire({
    //       type: 'success',
    //       title: 'Bravo',
    //     }).then(() => this.getAllQuestionnaireTemplate());
    //   }
    // });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.questService.resetQuestionnaire();
  }
}
