import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
  ElementRef,
  ViewEncapsulation,
} from '@angular/core';
import { DateAdapter, MatOption } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelect } from '@angular/material/select';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { UntypedFormControl } from '@angular/forms';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TranscriptProcessService } from 'app/service/transcript-process/transcript-process.service';
import { SubSink } from 'subsink';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import cloneDeep from 'lodash/cloneDeep';
import { forkJoin, Observable } from 'rxjs';
import { BlockTranscript, StudentTranscript } from 'app/transcript-process/transcript-process.model';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { environment } from 'environments/environment';
import { ImportTranscriptDecisionDialogComponent } from './import-transcript-decision-dialog/import-transcript-decision-dialog.component';
import { PDFResultService } from 'app/service/transcript-pdf-result/transcript-pdf-result.service';
import { StudentsService } from 'app/service/students/students.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { BoardSubmissionDialogComponent } from '../board-submission-dialog/board-submission-dialog.component';
import { CoreService } from 'app/service/core/core.service';

@Component({
  selector: 'ms-transcript-student-result-table',
  templateUrl: './transcript-student-result-table.component.html',
  styleUrls: ['./transcript-student-result-table.component.scss'],
})
export class TranscriptStudentResultTableComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  private subs = new SubSink();
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild('matSelect', { static: false }) matSelect: MatSelect;
  @ViewChild('allSelected', { static: false }) allSelected: MatOption;

  @Input() checkValidationForm;
  @Input() transcriptDecision;
  @Input() titleId: string;
  @Input() classId: string;
  @Input() certifierId: string;
  @Input() transcriptId: string;
  @Input() containerWidth: number;
  @Input() refreshTable: boolean;
  @Output() selectStudentId = new EventEmitter<string>(null);
  @Output() transcriptDetailData = new EventEmitter<any>(null);
  @Output() typeClass = new EventEmitter<any>();
  @Output() transcriptData = new EventEmitter<any>();

  dataSource = new MatTableDataSource([]);
  selection = new SelectionModel<any>(true, []);
  isCheckedAll = false;
  studentTranscriptList: StudentTranscript[] = [];
  transcriptDetail: any;
  noData;
  dataCount = 0;
  isReset = false;
  dataLoaded = false;
  isWaitingForResponse = false;
  sortValue = null;
  filteredValues = { school_id: '', student_name: '' };
  formatedFilteredValues = { decision_school_board: ['pass', 'fail', 'retake', 'initial'], student_title_status: null, suggestion: ['pass', 'fail', 'retake'] };

  filterColumns: string[] = [];
  displayedColumns: string[] = [];

  schools = [];
  filteredSchools: Observable<any[]>;
  schoolFilter = new UntypedFormControl('');
  studentFilter = new UntypedFormControl('');
  decisionFilter = new UntypedFormControl(['pass', 'fail', 'retake', 'initial']);
  suggestedFilter = new UntypedFormControl(['pass', 'fail', 'retake']);

  selectType: any;
  studentDetailData: any;
  entityData: any;
  classType: string;
  classSubType: string;
  userSelected: any[];
  userSelectedId: any[];
  blocks = [];
  specializationBlocks = [];
  tableWidth: number;
  tableWidthInPx: string;
  private timeOutVal: any;
  isTranscriptCompleted = false;
  selectStudentIdLog: string;

  activeRowIndex;

  decisionFilterList = [
    { key: 'No Decision', value: 'initial' },
    { key: 'Pass', value: 'pass' },
    { key: 'Fail', value: 'fail' },
    { key: 'Retake', value: 'retake' },
  ];

  suggestedFilterList = [
    { key: 'Pass', value: 'pass' },
    { key: 'Fail', value: 'fail' },    
    { key: 'Retake', value: 'retake' },
  ];

  statusFilter = new UntypedFormControl('');
  statusList = [
    {
      name: 'current_active',
      value: 'current_active',
    },
    {
      name: 'deactivated',
      value: 'deactivated',
    },
    {
      name: 'completed',
      value: 'completed',
    },
    {
      name: 'suspended',
      value: 'suspended',
    },
  ];

  isPublished: any;
  isPublishFilter = new UntypedFormControl('');
  publishList = [
    {
      name: 'PUBLISHED',
      value: 'yes',
    },
    {
      name: 'NOT_PUBLISHED',
      value: 'no',
    },
  ];
  statusListFiltered: Observable<any[]>;

  className: string;
  titleName: string;

  @ViewChild('tableElement', { static: true }) tableElement: ElementRef;

  constructor(
    private router: Router,
    private transcriptService: TranscriptProcessService,
    private cdRef: ChangeDetectorRef,
    private translate: TranslateService,
    public dialog: MatDialog,
    private pdfResultService: PDFResultService,
    private studentService: StudentsService,
    private utilService: UtilityService,
    private rncpTitleService: RNCPTitlesService,
    private coreService: CoreService
  ) {}

  ngOnInit() {
    this.coreService.sidenavOpen = false;
    this.initFilter();
    this.cdRef.detectChanges();
    this.transcriptService.isTranscriptCompleted$.subscribe((complete) => (this.isTranscriptCompleted = complete));
    
    this.decisionFilterList = [
      { key: this.translate.instant('No Decision'), value: 'initial' },
      { key: this.translate.instant('Pass'), value: 'pass' },
      { key: this.translate.instant('Fail'), value: 'fail' },
      { key: this.translate.instant('Retake'), value: 'retake' },
    ];
    this.translate.onLangChange.subscribe(() => {
      this.decisionFilterList = [
        { key: this.translate.instant('No Decision'), value: 'initial' },
        { key: this.translate.instant('Pass'), value: 'pass' },
        { key: this.translate.instant('Fail'), value: 'fail' },
        { key: this.translate.instant('Retake'), value: 'retake' },
      ];
    });
    
    this.suggestedFilterList = [
      { key: this.translate.instant('Pass'), value: 'pass' },
      { key: this.translate.instant('Fail'), value: 'fail' },
      { key: this.translate.instant('Retake'), value: 'retake' },
    ];
    
    this.translate.onLangChange.subscribe(() => {
      this.suggestedFilterList = [
        { key: this.translate.instant('Pass'), value: 'pass' },
        { key: this.translate.instant('Fail'), value: 'fail' },
        { key: this.translate.instant('Retake'), value: 'retake' },
      ];
    });

    this.transcriptService.isReloadAfterSave$.subscribe((resp) => {
      if(resp) {
        this.getTableData();
        this.activeRowIndex = null;
        this.transcriptService.isReloadAfterSave.next(false);
        this.selectStudentId.emit(null);
      }
    })
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (!this.isReset) {
            this.getTableData();
          }
          this.dataLoaded = true;
          this.activeRowIndex = null;
        }),
      )
      .subscribe();
  }

  ngOnChanges() {
    const offsetHeight = this.tableElement.nativeElement.clientHeight;
    this.transcriptService.setTableAttribute(offsetHeight);
    if (this.refreshTable) {
      this.getTableData();
    }
  }

  sortData(sort: Sort) {
    // dynamically set key property of sort object
    this.sortValue = sort.direction ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getTableData();
      }
    }
  }

  getTableData() {
    this.isWaitingForResponse = true;
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    const filter = this.getFilterInStringFormat();

    const forkParam = [];
    const blockGet = this.transcriptService.getOneTranscriptDetailProcess(this.transcriptId);
    forkParam.push(blockGet);
        
    const studentGet = this.transcriptService.getAllStudentTranscripts(
      this.transcriptId,
      this.titleId,
      this.classId,
      pagination,
      this.sortValue,
      filter,
      this.isTranscriptCompleted,
      this.formatedFilteredValues,
      this.isPublished,
    );
    forkParam.push(studentGet);

    this.subs.sink = forkJoin(forkParam).subscribe((resp: any) => {
      this.isWaitingForResponse = false;
      if (resp && resp.length && resp.length === 2) {
        this.transcriptDetail = resp[0];        
        this.studentTranscriptList = resp[1];
        this.getBlockData();
        this.getStudentTranscripts();
      } else {
        this.dataSource.data = [];
        this.paginator.pageIndex = 0;
        this.dataCount = 0;
        this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
      }
    });
  }

  getBlockData() {
    this.transcriptDetailData.emit(this.transcriptDetail);
    if (this.transcriptDetail.class_id && this.transcriptDetail.class_id.type_evaluation) {
      this.classType = this.transcriptDetail.class_id.type_evaluation;
      this.classSubType = this.transcriptDetail.class_id.sub_type_evaluation;
      this.typeClass.emit(this.classType);
    }
    if (this.transcriptDetail.class_id && this.transcriptDetail.rncp_title_id) {
      this.className = this.transcriptDetail.class_id.name;
      this.titleName = this.transcriptDetail.rncp_title_id.short_name;
    }
    // get all blocks for B1, B2, B3.., S1, S2, S3... columns
    this.blocks = [] // resetting the array
    this.specializationBlocks = [] // resetting the array
    for (const block of this.transcriptDetail.block_competence_condition_details) {
      if (block.is_block_selected && !block?.block_id?.is_specialization) {
        this.blocks.push(block.block_id)
      } else if (block.is_block_selected && block?.block_id?.is_specialization) {
        this.specializationBlocks.push(block.block_id)
      }
    }


    this.getTableWidth();
    this.setBlockTableColumns();
  }

  setBlockTableColumns() {
    this.filterColumns = ['selectFilter', 'schoolFilter', 'studentFilter', 'statusFilter'];
    this.displayedColumns = ['select', 'school', 'student', 'status'];
    for (let i = 0; i < this.blocks.length; i++) {
      this.filterColumns.push(`B${i + 1}filter`);
      this.displayedColumns.push(`B${i + 1}`);
    }
    for (let i = 0; i < this.specializationBlocks.length; i++) {
      this.filterColumns.push(`S${i + 1}filter`);
      this.displayedColumns.push(`S${i + 1}`);
    }
    // setting the displayed column after block dynamic columns
    if (this.classType !== 'expertise') {
      this.filterColumns.push('sugestedFilter');
      this.displayedColumns.push('sugested');
    }
    if (this.transcriptDetail.jury_decision && this.classType !== 'expertise') {
      // show column "decision" if jury decision toggle is on
      this.filterColumns.push('juryDecissionFilter');
      this.displayedColumns.push('juryDecission');
    }
    if (this.classType === 'expertise') {
      //  show column "suggested" if class is eval by competence/expertise
      this.filterColumns.push('sugestedFilter');
      this.displayedColumns.push('sugested');
      // show column "grandOral" if class is eval by competence/expertise
      this.filterColumns.push('grandOralFilter');
      this.displayedColumns.push('grandOral');
    }
    this.filterColumns.push('actionFilter');
    this.displayedColumns.push('action');

  }

  getTableWidth() {
    // all of number in static column width you can find in scss file that has selector .mat-column-blablabla
    let staticColumnWidth = 50 + 100 + 150 + 90 + 90 + 70;
    if (this.classType === 'expertise') {
      // add column grandOral to table width if class is eval by competence/expertise
      staticColumnWidth = staticColumnWidth + 90;
    }

    // calculate dynamic column width, "60" is width in px of column U1, U2, etc. so it represent 60px of width.
    const dynamicColumnWidth = 60 * this.blocks.length;

    // then combine static column with dynamic column so we get overall table width.
    this.tableWidth = staticColumnWidth + dynamicColumnWidth;
    this.tableWidthInPx = (staticColumnWidth + dynamicColumnWidth).toString() + 'px';


  }

  getStudentTranscripts() {
    const allDataBlock = [...this.blocks, ...this.specializationBlocks];
    this.studentTranscriptList.forEach((student) => {
      student['block_columns'] = [];
      // student['block_expertise'] = [];
      allDataBlock.forEach((block) => {
        let blockResult;
        if (student.student_id.final_transcript_result_id) {
          blockResult = student.student_id.final_transcript_result_id.block_of_competence_conditions.find((studentBlock) => {
            return studentBlock.block_id ? studentBlock.block_id._id === block._id : false;
          });
        }
        const emplyBlock = {
          block_id: null,
          pass_fail_status: null,
          total_mark: null,
          total_point: null,
        };
        student['block_columns'].push(blockResult ? blockResult : emplyBlock);
        // let blockExpertiseResult;
        // if (student.student_id.final_transcript_result_id) {
        //   if (
        //     student.student_id.final_transcript_result_id.block_of_competence_templates &&
        //     student.student_id.final_transcript_result_id.block_of_competence_templates.length
        //   ) {
        //     blockExpertiseResult = student.student_id.final_transcript_result_id.block_of_competence_templates.find((studentBlock) => {
        //       return studentBlock.block_id ? studentBlock.block_id._id === block._id : false;
        //     });
        //   }
        //   if (
        //     student.student_id.final_transcript_result_id.block_of_soft_skill_templates &&
        //     student.student_id.final_transcript_result_id.block_of_soft_skill_templates.length
        //   ) {
        //     blockExpertiseResult = student.student_id.final_transcript_result_id.block_of_soft_skill_templates.find((studentBlock) => {
        //       return studentBlock.block_id ? studentBlock.block_id._id === block._id : false;
        //     });
        //   }
        // }
        // const emplyBlockExpertise = {
        //   block_id: {
        //     _id: null
        //   },
        //   grand_oral_block_phrase_obtained_id: {
        //     name: null,
        //     phrase_type: null,
        //   }
        // };
        // student['block_expertise'].push(blockExpertiseResult ? blockExpertiseResult : emplyBlockExpertise);
      });
    });


    this.dataSource.data = this.studentTranscriptList;


    if (this.activeRowIndex !== null) {
      let selectedData;
      if (this.studentTranscriptList && this.studentTranscriptList.length && this.studentTranscriptList[this.activeRowIndex]) {
        selectedData = this.studentTranscriptList[this.activeRowIndex];

        this.openStudentTranscriptLog(selectedData, this.activeRowIndex);
      } else {
        this.selectStudentId.emit(null);
      }
    }

    this.dataCount = this.studentTranscriptList && this.studentTranscriptList.length ? this.studentTranscriptList[0].count_document : 0;
    this.noData = this.dataSource.connect().pipe(map((data) => !data || (data && data.length === 0)));
    // set isReset back to false after 400 milisecond so the subscription that has debounceTime not triggered
    setTimeout(() => (this.isReset = false), 400);
  }

  getIndexSpecialization(element, specialBlockId){
    const indexBlock = element.block_competence_condition_details.findIndex(data => data?.block_id?._id === specialBlockId?._id);
    return indexBlock;
  }

  getBlockDecision(studentTranscript: StudentTranscript, blockIndex: number, blockId: string, blockIdComp, blockDecision): string {
    if (this.classType === 'expertise') {
      if (studentTranscript && studentTranscript.block_competence_condition_details) {
        const selectedBlocks = studentTranscript.block_competence_condition_details.find((blc) => blc.block_id._id === blockDecision);
        if (selectedBlocks && selectedBlocks.decision_school_board_id) {
          return selectedBlocks.decision_school_board_id.phrase_type;
        } else {
          if (
            studentTranscript &&
            studentTranscript.student_id &&
            studentTranscript.student_id.final_transcript_result_id &&
            studentTranscript.student_id.final_transcript_result_id.block_of_competence_templates &&
            studentTranscript.student_id.final_transcript_result_id.block_of_competence_templates.length
          ) {
            const selectedBlock = studentTranscript.student_id.final_transcript_result_id.block_of_competence_templates.find(
              (blc) => blc.block_id._id === blockIdComp,
            );
            if (selectedBlock && selectedBlock.grand_oral_block_phrase_obtained_id) {
              return selectedBlock.grand_oral_block_phrase_obtained_id.phrase_type;
            }
          }
        }
      }
    } else {
      if (studentTranscript && studentTranscript.block_competence_condition_details) {
        const selectedBlock = studentTranscript.block_competence_condition_details.find((blc) => blc.block_id._id === blockId);
        if (selectedBlock && selectedBlock.decision_school_board_id) {
          return selectedBlock.decision_school_board_id.condition_type;
        }
      }
      if (studentTranscript.block_columns && studentTranscript.block_columns.length) {
        return studentTranscript.block_columns[blockIndex].pass_fail_status ? 'pass' : 'fail';
        // return 'pass';
      }
    }
    return '';
  }

  getBlockScore(block: BlockTranscript, dataPhrase, blockId, blockDecision) {
    // add condition when we should use total_point or total_mark
    if (this.classType === 'expertise') {
      if (dataPhrase && dataPhrase.block_competence_condition_details) {
        const selectedBlocks = dataPhrase.block_competence_condition_details.find((blc) => blc.block_id._id === blockDecision);
        if (selectedBlocks && selectedBlocks.decision_school_board_id) {
          return selectedBlocks.decision_school_board_id.name;
        } else {
          if (
            dataPhrase &&
            dataPhrase.student_id &&
            dataPhrase.student_id.final_transcript_result_id &&
            dataPhrase.student_id.final_transcript_result_id.block_of_competence_templates &&
            dataPhrase.student_id.final_transcript_result_id.block_of_competence_templates.length
          ) {
            const selectedBlock = dataPhrase.student_id.final_transcript_result_id.block_of_competence_templates.find(
              (blc) => blc.block_id._id === blockId,
            );
            if (selectedBlock && selectedBlock.grand_oral_block_phrase_obtained_id) {
              return selectedBlock.grand_oral_block_phrase_obtained_id.name;
            }
          }
        }
      }
    } else {
      if (block && block.total_mark !== null) {
        const score = block.total_mark % 1 === 0 ? block.total_mark : block.total_mark.toFixed(2);
        return score;
      }
    }
    return null;
  }

  isBlockRetakeAccepted(studentTranscript: StudentTranscript, blockIndex: number, blockId: string, blockIdComp, blockDecision): boolean {
    if (studentTranscript && studentTranscript.block_competence_condition_details) {
      const selectedBlock = studentTranscript.block_competence_condition_details.find((blc) => blc.block_id._id === blockId);
      if (selectedBlock && selectedBlock.retake_blocks && selectedBlock.retake_blocks.length) {
        for (const retake_block of selectedBlock.retake_blocks) {
          if (retake_block && retake_block.decision_student) {

            return retake_block.decision_student;
          }
        }
      }
    }
    return false;
  }

  getFilterInStringFormat(): string {
    const filterData = cloneDeep(this.filteredValues);
    let filterQuery = '';
    Object.keys(filterData).forEach((key) => {
      if (filterData[key]) {
        filterQuery = filterQuery + ` ${key}:"${filterData[key]}"`;
      }
    });
    return filterQuery;
  }

  initFilter() {
    this.studentFilter.valueChanges.pipe(debounceTime(400)).subscribe((searchTxt) => {
      const symbol = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      this.selectStudentId.emit(null);
      this.activeRowIndex = null;
      if (!searchTxt.match(symbol) && !searchTxt.match(symbol1)) {
        this.filteredValues.student_name = searchTxt ? searchTxt.toLowerCase() : '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getTableData();
        }
      } else {
        this.studentFilter.setValue('');
        this.filteredValues.student_name = '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getTableData();
        }
      }
    });
    this.transcriptService.getSchoolsOfRncpTitle(this.titleId).subscribe((resp) => {

      this.schools = resp;
      this.schools = this.schools.sort((schoolA, schoolB) => {
        if (this.utilService.simplifyRegex(schoolA.short_name) < this.utilService.simplifyRegex(schoolB.short_name)) {
          return -1;
        } else if (this.utilService.simplifyRegex(schoolA.short_name) > this.utilService.simplifyRegex(schoolB.short_name)) {
          return 1;
        } else {
          return 0;
        }
      });
      this.filteredSchools = this.schoolFilter.valueChanges.pipe(
        startWith(''),
        map((searchTxt: string) =>
          this.schools.filter((sch) => {
            if (searchTxt) {
              return sch.short_name.toLowerCase().includes(searchTxt.toLowerCase());
            }
            return true;
          }),
        ),
      );
    });
    // this.decisionFilter.valueChanges.pipe(debounceTime(1000)).subscribe((search: any[]) => {
    //   this.selectStudentId.emit(null);
    //   this.activeRowIndex = null;
    //   let temp = _.cloneDeep(search);
    //   if (search && search.length) {
    //     temp = search.filter((value) => value !== 0);
    //   }
    //   this.formatedFilteredValues.decision_school_board = temp;
    //   if (!this.isReset) {
    //     if (temp.length === this.decisionFilterList.length) {
    //       if (!search.includes(0)) {
    //         search.push(0);
    //         this.decisionFilter.patchValue(search, { emitEvent: false });
    //       }
    //     } else {
    //       if (search.includes(0)) {
    //         this.decisionFilter.patchValue(temp, { emitEvent: false });
    //       }
    //     }
    //     if (this.matSelect) {
    //       this.matSelect.close();
    //     }
    //     this.getTableData();
    //   }
    // });

    // Need to change to BE Filter and sort
    this.statusListFiltered = this.statusFilter.valueChanges.pipe(
      startWith(''),
      map((searchText) =>
        this.statusList.filter((stat) =>
          stat
            ? this.utilService
                .simplifyRegex(this.translate.instant('student_status.' + stat.value))
                .toLowerCase()
                .includes(searchText.toLowerCase())
            : false,
        ),
      ),
    );
  }

  filterSchool(schoolId: string) {
    this.filteredValues.school_id = schoolId;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.selectStudentId.emit(null);
      this.activeRowIndex = null;
      this.getTableData();
    }
  }

  filterStatus(value) {

    if (value !== 'All') {
      this.formatedFilteredValues['student_title_status'] = value;
    } else {
      this.formatedFilteredValues['student_title_status'] = null;
    }
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.selectStudentId.emit(null);
      this.activeRowIndex = null;
      this.getTableData();
    }
  }

  filterIsPublish(value) {

    if (value !== 'All') {
      this.isPublished = value;
    } else {
      this.isPublished = null;
    }
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.selectStudentId.emit(null);
      this.activeRowIndex = null;
      this.getTableData();
    }
  }

  selectSuggested() {
    let suggestedValues = this.suggestedFilter.value;

    if(suggestedValues.includes('All')) {
      const allValue = suggestedValues.findIndex((el) => el === 'All');
      if (allValue !== 0){
        suggestedValues = '';
      } else if (allValue === 0){
        suggestedValues.splice(allValue, 1);
      }
      this.suggestedFilter.setValue(['All']);
    }

    if(suggestedValues && suggestedValues.length) {
      this.suggestedFilter.setValue(suggestedValues);
      this.formatedFilteredValues['suggestion'] = suggestedValues;
    } else {
      this.formatedFilteredValues['suggestion'] = null;
    }

    this.getTableData();
  }

  selectDecision() {
    let decisionValues = this.decisionFilter.value;
    if(decisionValues.includes('All')) {
      const allValue = decisionValues.findIndex((el) => el === 'All');
      if (allValue !== 0){
        decisionValues = '';
      } else if (allValue === 0){
        decisionValues.splice(allValue, 1);
      }
      this.decisionFilter.setValue(['All']);
    }

    if(decisionValues && decisionValues.length) {
      this.decisionFilter.setValue(decisionValues);
      this.formatedFilteredValues['decision_school_board'] = decisionValues;
    } else {
      this.formatedFilteredValues['decision_school_board'] = null;
    }
    this.getTableData();
  }

  selectedAllDecision(event) {
    if (event.checked) {
      this.decisionFilter.patchValue(['pass', 'fail', 'retake', 'initial'], { emitEvent: false });
    } else {
      this.decisionFilter.patchValue([], { emitEvent: false });
    }
  }

  selectedAllSuggested(event) {
    if (event.checked) {
      this.suggestedFilter.patchValue(['pass', 'fail', 'retake'], { emitEvent: false });
    } else {
      this.suggestedFilter.patchValue([], { emitEvent: false });
    }
  }

  checkAllSuggested() {
    const suggestedFilter = this.suggestedFilter.value.length;
    const suggestedFilterList = this.suggestedFilterList.length;
    if (suggestedFilter === suggestedFilterList) {
      return true;
    } else {
      return false;
    }
  }

  checkSuggestedIndeterminate() {
    const suggestedFilter = this.suggestedFilter.value.length;
    const suggestedFilterList = this.suggestedFilterList.length;
    if (suggestedFilter !== suggestedFilterList && suggestedFilter !== 0) {
      return true;
    } else {
      return false;
    }
  }

  selectAllDecision() {
    if (this.classType === 'expertise') {
    } else {
      this.decisionFilter.patchValue(['pass', 'fail', 'retake', 'initial']);
    }
  }

  checkAllDecision() {
    const decisionFilter = this.decisionFilter.value.length;
    const decisionFilterList = this.decisionFilterList.length;
    if (decisionFilter === decisionFilterList) {
      return true;
    } else {
      return false;
    }
  }

  checkDecisionIndeterminate() {
    const decisionFilter = this.decisionFilter.value.length;
    const decisionFilterList = this.decisionFilterList.length;
    if (decisionFilter !== decisionFilterList && decisionFilter !== 0) {
      return true;
    } else {
      return false;
    }
  }

  toggleAllSelection() {
    if (this.allSelected.selected) {
      this.decisionFilter.patchValue([...this.decisionFilterList.map((item) => item.value), 0]);
    }
  }

  reset() {
    this.selectStudentId.emit(null);
    this.activeRowIndex = null;
    this.selection.clear();
    this.userSelected = [];
    this.userSelectedId = [];
    this.isReset = true;
    this.filteredValues = { school_id: '', student_name: '' };
    this.formatedFilteredValues = { decision_school_board: ['pass', 'fail', 'retake', 'initial'], student_title_status: null, suggestion: ['pass', 'fail', 'retake'] };
    this.paginator.pageIndex = 0;
    this.sortValue = null;
    // this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.sort.active = '';
    this.sort.direction = '';
    this.sort.sortChange.emit({active: '', direction: ''});
    
    this.schoolFilter.setValue('');
    this.studentFilter.setValue('');
    this.statusFilter.setValue('');
    this.isPublishFilter.patchValue('');
    this.suggestedFilter.patchValue(['pass', 'fail', 'retake']);
    this.isPublished = null;
    this.decisionFilter.patchValue(['pass', 'fail', 'retake', 'initial'], { emitEvent: false }), this.getTableData();
  }

  leave() {
    const validation = this.checkValidationForm && this.transcriptDecision && this.checkValidationForm(this.transcriptDecision);

    if (!validation && this.transcriptDecision) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('TMTC_S01.TITLE'),
        text: this.translate.instant('TMTC_S01.TEXT'),
        confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
        allowOutsideClick: false,
      }).then((res) => {
        if (res.dismiss) {
          this.router.navigate(['/transcript-process']);
        }
      });
    } else {
      this.router.navigate(['/transcript-process']);
    }
  }

  openStudentTranscriptLog(transcriptData, rowIndex) {
    this.activeRowIndex = rowIndex;
    this.transcriptData.emit(transcriptData);

    if (transcriptData.student_id && transcriptData.student_id._id) {
      this.selectStudentId.emit(transcriptData.student_id._id);
      this.selectStudentIdLog = transcriptData.student_id._id;
    }
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length ? this.dataSource.data[0].count_document : 0;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected() || this.isCheckedAll) {
      this.selection.clear();
      this.userSelected = [];
      this.userSelectedId = [];
      this.isCheckedAll = false;
    } else {
      this.isCheckedAll = true;
      this.dataSource.data.forEach((row) => this.selection.select(row));
    }
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  showOptions(info, event) {
    if(info === 'one' && !event.checked && this.isCheckedAll) {
      this.isCheckedAll = false;
    }

    const numSelected = this.selection.selected.length;
    this.selectType = info;
    const data = this.selection.selected;


    this.userSelected = [];
    this.userSelectedId = [];
    data.forEach((user) => {
      this.userSelected.push(user);
      this.userSelectedId.push(user._id);
    });
  }

  publishStudentTranscript() {
    let timeDisabled = 2;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('TRANSCRIPT_S10.TITLE'),
      html: this.translate.instant('TRANSCRIPT_S10.TEXT'),
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('TRANSCRIPT_S10.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('TRANSCRIPT_S10.CANCEL'),
      allowOutsideClick: false,
      allowEnterKey: false,
      footer: `<span style="margin-left: auto;">TRANSCRIPT_S10</span>`,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('TRANSCRIPT_S10.CONFIRM') + ` (${timeDisabled})`;
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('TRANSCRIPT_S10.CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      if (result.value) {
        const payload = {
          transcript_process_id: this.transcriptId,
          student_transcript_ids: this.userSelectedId,
          is_all: null,
          school_id: null,
          student_name: null,
        };

        if (this.isAllSelected() || this.isCheckedAll) {
          payload.student_transcript_ids = null;
          payload.is_all = true;
          if (this.filteredValues.school_id) {
            payload.school_id = this.filteredValues.school_id;
          }
          if (this.filteredValues.student_name) {
            payload.student_name = this.filteredValues.student_name;
          }
        }

        // If the class is expertise, do not check the retakeblock, just call the publish
        if (this.classType === 'expertise') {
          this.callApiPublishStudentTranscriptAll(payload);
        } else {
          this.isWaitingForResponse = true;
          this.subs.sink = this.transcriptService
            .CheckRetakeBlockWhenPublishStudentTranscript(
              payload.transcript_process_id,
              payload.student_transcript_ids,
              payload.is_all,
              payload.school_id,
              payload.student_name,
            )
            .subscribe(
              (resp) => {
                this.isWaitingForResponse = false;
                // if has result more than 0
                if (resp && resp.length > 0) {
                  let blockListOrder = '';
                  blockListOrder += '<ul style="text-align: start; margin-left: 20px">';
                  resp.forEach((block) => {
                    if (block && block.block_of_competence_condition) {
                      blockListOrder += `<li> ${this.utilService.cleanHTML(block.block_of_competence_condition)} </li>`;
                    }
                  });
                  blockListOrder += '</ul>';
                  Swal.fire({
                    type: 'warning',
                    title: this.translate.instant('TRANSCRIPT_CHECK_RETAKE_BLOCK_S1.TITLE'),
                    html: this.translate.instant('TRANSCRIPT_CHECK_RETAKE_BLOCK_S1.TEXT', { listOfBlock: blockListOrder }),
                    confirmButtonText: this.translate.instant('TRANSCRIPT_CHECK_RETAKE_BLOCK_S1.BUTTON'),
                  });
                } else {
                  this.callApiPublishStudentTranscriptAll(payload);
                }
              },
              (err) => (this.isWaitingForResponse = false),
            );
        }
      }
    });
  }

  publishStudentTranscriptOne(element) {
    let timeDisabled = 2;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('TRANSCRIPT_S10.TITLE'),
      html: this.translate.instant('TRANSCRIPT_S10.TEXT'),
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('TRANSCRIPT_S10.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('TRANSCRIPT_S10.CANCEL'),
      allowOutsideClick: false,
      allowEnterKey: false,
      footer: `<span style="margin-left: auto;">TRANSCRIPT_S10</span>`,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('TRANSCRIPT_S10.CONFIRM') + ` (${timeDisabled})`;
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('TRANSCRIPT_S10.CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      if (result.value) {
        const data = [];
        data.push(element._id);

        // if class ie expertise then do not need doing retake block check, just publish
        if (this.classType === 'expertise') {
          this.callApiPublishStudentTranscriptOne(data);
        } else {
          this.isWaitingForResponse = true;
          this.subs.sink = this.transcriptService.CheckRetakeBlockWhenPublishStudentTranscriptOne(this.transcriptId, data).subscribe(
            (resp) => {
              this.isWaitingForResponse = false;
              // if has result more than 0
              if (resp && resp.length > 0) {
                let blockListOrder = '';
                blockListOrder += '<ul style="text-align: start; margin-left: 20px">';
                resp.forEach((block) => {
                  if (block && block.block_of_competence_condition) {
                    blockListOrder += `<li> ${this.utilService.cleanHTML(block.block_of_competence_condition)} </li>`;
                  }
                });
                blockListOrder += '</ul>';

                Swal.fire({
                  type: 'warning',
                  title: this.translate.instant('TRANSCRIPT_CHECK_RETAKE_BLOCK_S1.TITLE'),
                  html: this.translate.instant('TRANSCRIPT_CHECK_RETAKE_BLOCK_S1.TEXT', { listOfBlock: blockListOrder }),
                  confirmButtonText: this.translate.instant('TRANSCRIPT_CHECK_RETAKE_BLOCK_S1.BUTTON'),
                });
              }
              // when has no result, publish student transcript
              else {
                this.callApiPublishStudentTranscriptOne(data);
              }
            },
            (err) => (this.isWaitingForResponse = false),
          );
        }
      }
    });
  }

  callApiPublishStudentTranscriptAll(payload) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.transcriptService
      .publishStudentTranscript(
        payload.transcript_process_id,
        payload.student_transcript_ids,
        payload.is_all,
        payload.school_id,
        payload.student_name,
      )
      .subscribe(
        (ressp) => {
          this.isWaitingForResponse = false;

          Swal.fire({
            type: 'success',
            title: this.translate.instant('TRANSCRIPT_S19.TITLE'),
            html: this.translate.instant('TRANSCRIPT_S19.TEXT'),
            confirmButtonText: this.translate.instant('TRANSCRIPT_S19.BUTTON'),
          }).then((res) => {
            this.selection.clear();
            this.userSelected = [];
            this.userSelectedId = [];
            this.getTableData();
            this.refreshSelectedStudentTranscriptHistory();
          });
        },
        (err) => {
          this.isWaitingForResponse = false;
          if (err && err.message && err.message === 'GraphQL error: Sorry, the last process of publishing student result is still in process') {
            this.swalTranscript_S20();
          } else {
            this.swalTranscript_S11();
          }
        },
      );
  }

  callApiPublishStudentTranscriptOne(data) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.transcriptService.publishStudentTranscriptOne(this.transcriptId, data).subscribe(
      (ressp) => {
        this.isWaitingForResponse = false;

        Swal.fire({
          type: 'success',
          title: this.translate.instant('TRANSCRIPT_S19.TITLE'),
          html: this.translate.instant('TRANSCRIPT_S19.TEXT'),
          confirmButtonText: this.translate.instant('TRANSCRIPT_S19.BUTTON'),
        }).then((res) => {
          this.selection.clear();
          this.userSelected = [];
          this.userSelectedId = [];
          this.getTableData();
          this.refreshSelectedStudentTranscriptHistory();
        });
      },
      (err) => {
        this.isWaitingForResponse = false;
        if (err && err.message && err.message === 'GraphQL error: Sorry, the last process of publishing student result is still in process') {
          this.swalTranscript_S20();
        } else {
          this.swalTranscript_S11();
        }
      },
    );
  }

  refreshSelectedStudentTranscriptHistory() {
    this.selectStudentId.emit(null);
    setTimeout(() => {
      this.selectStudentId.emit(this.selectStudentIdLog);
    }, 400);
  }

  swalTranscript_S11() {
    this.isWaitingForResponse = false;
    Swal.fire({
      type: 'error',
      title: this.translate.instant('TRANSCRIPT_S11.TITLE'),
      html: this.translate.instant('TRANSCRIPT_S11.TEXT'),
      confirmButtonText: this.translate.instant('TRANSCRIPT_S11.BUTTON'),
      footer: '<span style="margin-left: auto;">TRANSCRIPT_S11</span>',
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    });
  }
  
  swalTranscript_S20() {
    this.isWaitingForResponse = false;
    Swal.fire({
      type: 'error',
      title: this.translate.instant('TRANSCRIPT_S20.TITLE'),
      html: this.translate.instant('TRANSCRIPT_S20.TEXT', {title: this.titleName, class: this.className}),
      confirmButtonText: this.translate.instant('TRANSCRIPT_S20.BUTTON'),
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    });
  }

  csvTypeSelectionDownload() {
    this.subs.sink = this.dialog
      .open(BoardSubmissionDialogComponent, {
        disableClose: true,
        width: '615px',
      })
      .afterClosed()
      .subscribe((res) => {
        if (res) {
          const fileType = res;
          this.downloadCSVTemplate(fileType);
        }
      });

    // const inputOptions = {
    //   ',': this.translate.instant('IMPORT_DECISION_S1.COMMA'),
    //   ';': this.translate.instant('IMPORT_DECISION_S1.SEMICOLON'),
    //   tab: this.translate.instant('IMPORT_DECISION_S1.TAB'),
    // };

    // Swal.fire({
    //   type: 'question',
    //   title: this.translate.instant('IMPORT_DECISION_S1.TITLE'),
    //   width: 465,
    //   allowEscapeKey: true,
    //   showCancelButton: true,
    //   cancelButtonText: this.translate.instant('IMPORT_DECISION_S1.CANCEL'),
    //   confirmButtonText: this.translate.instant('IMPORT_DECISION_S1.OK'),
    //   input: 'radio',
    //   inputOptions: inputOptions,
    //   inputValue: this.translate && this.translate.currentLang === 'fr' ? ';' : '',
    //   inputValidator: (value) => {
    //     return new Promise((resolve, reject) => {
    //       if (value) {
    //         resolve('');
    //         Swal.enableConfirmButton();
    //       } else {
    //         Swal.disableConfirmButton();
    //         reject(this.translate.instant('IMPORT_DECISION_S1.INVALID'));
    //       }
    //     });
    //   },
    //   onOpen: function () {
    //     Swal.disableConfirmButton();
    //     Swal.getContent().addEventListener('click', function (e) {
    //       Swal.enableConfirmButton();
    //     });
    //     const input = Swal.getInput();
    //     const inputValue = input.getAttribute('value');
    //     if (inputValue === ';') {
    //       Swal.enableConfirmButton();
    //     }
    //   },
    // }).then((separator) => {
    //   if (separator.value) {
    //     const fileType = separator.value;
    //     this.downloadCSVTemplate(fileType);
    //   }
    // });
  }

  downloadCSVTemplate(file) {
    const fileType = file.file_type;
    let url = environment.apiUrl;
    url = url.replace('graphql', '');
    const element = document.createElement('a');
    let path = '';
    const lang = this.translate.currentLang.toLowerCase();
    if (lang === 'en') {
      if (fileType === ',') {
        path = 'comma';
      } else if (fileType === ';') {
        path = 'semicolon';
      } else if (fileType === 'tab') {
        path = 'tab';
      }
    } else {
      if (fileType === ',') {
        path = 'comma';
      } else if (fileType === ';') {
        path = 'semicolon';
      } else if (fileType === 'tab') {
        path = 'tab';
      }
    }
    const importStudentTemlate = `download/scholarBoardCSV/${this.transcriptId}/${lang}/`;
    const isForComp = `/${this.classType === 'expertise' ? true : false}`;

    let decision = '?decisionFilter=';
    let count = 0;
    if (file.decision_type && file.decision_type.length) {
      for (const entity of file.decision_type) {
        count++;
        if (count > 1) {
          if (entity) {
            decision = decision + ',';
            decision = decision + entity.replaceAll('"', '');
          }
        } else {
          if (entity) {
            decision = decision + entity.replaceAll('"', '');
          }
        }
      }
    }
    element.href = url + importStudentTemlate + path + isForComp + decision;

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

    // const currentLang = this.translate.currentLang;

    Swal.fire({
      type: 'question',
      title: this.translate.instant('IMPORT_DECISION_S1.TITLE'),
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

    this.dialog
      .open(ImportTranscriptDecisionDialogComponent, {
        width: '500px',
        minHeight: '200px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          transcriptId: this.transcriptId,
          delimeter: fileType,
          classType: this.classType,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.getTableData();
          // this.ngOnInit();
        }
      });
  }

  openFinalTranscriptPDF(element) {

    if (
      element.student_id &&
      element.student_id.final_transcript_pdf_histories &&
      element.student_id.final_transcript_pdf_histories.length
    ) {
      const pdfGenerationLink = element.student_id.final_transcript_pdf_histories.find(
        (list) => list.transcript_process_id._id === this.transcriptId && list.student_transcript_id._id === element._id,
      );
      if (pdfGenerationLink && pdfGenerationLink.final_transcript_pdf_link) {
        const link = document.createElement('a');
        link.setAttribute('type', 'hidden');
        link.href = `${environment.apiUrl}/fileuploads/${pdfGenerationLink.final_transcript_pdf_link}`.replace('/graphql', '');
        link.target = '_blank';
        link.click();
        link.remove();
      } else {
        this.regeneratePDF(element);
      }
    } else {
      this.regeneratePDF(element);
    }
  }

  regeneratePDF(element) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.studentService.GenerateFinalTranscriptPDF(this.transcriptId, element.student_id._id).subscribe(
      (data) => {
        this.getTableData();
        this.isWaitingForResponse = false;
        const link = document.createElement('a');
        link.setAttribute('type', 'hidden');
        link.href = `${environment.apiUrl}/fileuploads/${data}`.replace('/graphql', '');
        link.target = '_blank';
        link.click();
        link.remove();
      },
      (err) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  downloadResultFile(element, row) {
    this.isWaitingForResponse = true;
    let index = row;

    const payload = {
      rncp_id: this.titleId,
      student_id: element.student_id._id,
      lang: this.translate.currentLang,
      is_from_mark_entry: false,
      grand_oral_id:
        element.student_id && element.student_id.jury_organization_id && element.student_id.jury_organization_id._id
          ? element.student_id.jury_organization_id._id
          : null,
    };

    this.subs.sink = this.rncpTitleService.downloadGrandOralResult(payload).subscribe((resp) => {
      let fileName;
      fileName = _.cloneDeep(resp['fileName']);

      this.isWaitingForResponse = false;
      const a = document.createElement('a');
      a.target = 'blank';
      a.href = `${environment.apiUrl}/fileuploads/${fileName.fileName}?download=true`.replace('/graphql', '');
      a.download = fileName.fileName;
      a.click();
      a.remove();
      // const newBlob = new Blob([resp], { type: "text/pdf" });
      // const data = window.URL.createObjectURL(newBlob);
      // const link = document.createElement('a');
      // link.href = data;
      // link.target = '_blank';
      // link.download = this.translate.instant('Grand Oral Result') + '.pdf';
      // document.body.appendChild(link);
      // link.click();
      // link.remove();
    });
  }

  checkSchoolBoardIsDone(decision) {
    let display = false;
    decision.block_competence_condition_details.forEach((element) => {
      if (element.decision_school_board !== 'initial') {
        display = true;
      }
    });
    return display;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.transcriptService.setTranscriptCompleted(false);
  }
}
