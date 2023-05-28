import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { UtilityService } from 'app/service/utility/utility.service';
import { TranslateService } from '@ngx-translate/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs/operators';
import { SelectionModel } from '@angular/cdk/collections';
import { forkJoin } from 'rxjs';
import { truncate } from 'fs';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';

@Component({
  selector: 'ms-class-grand-oral-jury-parameter',
  templateUrl: './class-grand-oral-jury-parameter.component.html',
  styleUrls: ['./class-grand-oral-jury-parameter.component.scss'],
})
export class ClassGrandOralJuryParameterComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  private subs = new SubSink();
  @Input() titleId: '';
  @Input() classId: '';
  @Input() type;
  @Input() activity;
  @Input() selectedTitleClassData;
  @Input() index: '';
  @Input() current_status;
  @Input() isParametersSaved;
  @Output() saveTitleClass = new EventEmitter();
  @ViewChild(MatPaginator, { static: false }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: false }) sort: MatSort;
  @ViewChild(MatTable, { static: false }) table: MatTable<any>;
  selection = new SelectionModel<any>(true, []);
  @Output() selectionParent = new EventEmitter();

  noData;
  dataCount = 0;
  isWaitingForResponse = false;
  blocks;
  expandedToggle: boolean[][] = [];

  displayedColumns: string[] = ['select', 'school'];
  filterColumns: string[] = ['selectFilter', 'schoolFilter'];
  formattedSchool = [];
  filteredValues = { school: '' };
  schoolFilter = new UntypedFormControl('');

  dataSource = new MatTableDataSource([]);

  parameterForm: UntypedFormGroup;
  dateDocFilter = new UntypedFormControl('');
  dateReqFilter = new UntypedFormControl('');
  dateJuryFilter = new UntypedFormControl('');

  juryOrgId: string;

  isSubmit = false;
  allData = null;

  grandOralParameterData;
  savedSchoolData;

  today = new Date();
  dayAfterToday = new Date();

  constructor(
    private juryService: JuryOrganizationService,
    private fb: UntypedFormBuilder,
    private utilService: UtilityService,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.initComponent();
    this.juryOrgId = this.route.snapshot.parent.parent.paramMap.get('juryOrgId');
    this.dayAfterToday.setDate(this.dayAfterToday.getDate());



    // this.subs.sink = this.juryService.getOneJuryOrganizationDataById(this.juryOrgId).subscribe(resp=>{
    //   this.type = resp.type
    // })
  }

  ngOnChanges(changes: SimpleChanges) {
    if (!changes.hasOwnProperty('isParametersSaved')) {
      this.initComponent();
    }
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  initComponent() {

    this.initForm();
    this.getBlockSchoolList();
  }

  initForm() {
    this.parameterForm = this.fb.group({
      send_grand_oral_pdf_to_jury: [false],
      send_grand_oral_pdf_to_jury_schedule: [null],
      student_required_upload_presentation: [false],
      student_required_upload_presentation_schedule: [null],
      student_required_upload_cv: [false],
      student_required_upload_cv_schedule: [null],
      send_grand_oral_pdf_to_student: [false],
      send_grand_oral_pdf_to_student_schedule: [null],
      grand_oral_proposition: [false],
      blocks_for_grand_oral: this.fb.array([]),
      grand_oral_retake_end_date: [null],
    });

    if (this.type === 'retake_grand_oral') {
      this.parameterForm.get('grand_oral_retake_end_date').setValidators([Validators.required]);
      this.parameterForm.get('grand_oral_retake_end_date').updateValueAndValidity();
    }
  }

  initBlockForm(blockId, isBlockSelected, isPreviousBlock) {
    return this.fb.group({
      block_id: [blockId ? blockId : '', [Validators.required]],
      is_selected: [isBlockSelected ? isBlockSelected : false],
      // is_block_coming_from_previous_process: [isPreviousBlock ? isPreviousBlock : false],
    });
  }

  getBlockConditionDetails(): UntypedFormArray {
    return this.parameterForm.get('blocks_for_grand_oral') as UntypedFormArray;
  }

  getBlockSchoolList() {
    // *************** Populate school table
    this.selection.clear();
    if (this.selectedTitleClassData && this.selectedTitleClassData.schools && this.selectedTitleClassData.schools.length) {
      const response = _.cloneDeep(this.selectedTitleClassData.schools);
      const tempResponse = response.map((school, schoolIndex) => {
        const formattedSchool = {
          _id: school._id,
          short_name: school.school.short_name,
          school: school.school,
          is_school_selected_for_grand_oral: school.is_school_selected_for_grand_oral ? school.is_school_selected_for_grand_oral : false,
          // block_already_selected: [],
          students: school.students,
        };
        return formattedSchool;
      });

      this.dataSource.data = tempResponse;
      this.dataCount = tempResponse.length ? tempResponse.length : 0;
      this.dataSource.paginator = this.paginator;



      // *************** Check all the list of school that already selected on init or if type is retake_grand_oral
      this.dataSource.data.forEach((row) => {
        if ((row && row.is_school_selected_for_grand_oral) || this.type === 'retake_grand_oral') {
          this.selection.select(row._id);
          this.selectionParent.emit(this.selection);
        }
      });

      this.dataCount = tempResponse.length ? tempResponse.length : 0;
      this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
      this.formattedSchool = tempResponse.map((school) => school._id);
      this.setFilterAndSorting();
    } else {
      this.formattedSchool = [];
      this.dataSource.data = [];
      this.dataCount = this.dataSource.data.length ? this.dataSource.data.length : 0;
      this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
    }

    // *************** Populate Block List
    if (
      this.selectedTitleClassData &&
      this.selectedTitleClassData.blocks_for_grand_oral &&
      this.selectedTitleClassData.blocks_for_grand_oral.length
    ) {
      const response = _.cloneDeep(this.selectedTitleClassData.blocks_for_grand_oral);
      this.blocks = response;
      if (this.blocks && this.blocks.length) {
        this.blocks.forEach((block, blockIndex) => {
          if (block && block.block_id._id && block.block_id._id) {
            this.getBlockConditionDetails().push(this.initBlockForm(block.block_id._id, block.is_selected, false));
            this.expandedToggle.push([]);
            if (block.block_id.subjects && block.block_id.subjects.length) {
              block.block_id.subjects.forEach((subject, subjectIndex) => {
                this.expandedToggle[blockIndex].push(false);
              });
            }
          }
        });
      }
      this.parameterForm.patchValue(this.selectedTitleClassData);

      // if type is retake_grand_oral, auto check all the blocks
      if (this.type === 'retake_grand_oral') {
        this.getBlockConditionDetails().controls.forEach((control) => {
          control.get('is_selected').patchValue(true);
        });
      }
    }
  }

  setFilterAndSorting() {
    this.subs.sink = this.schoolFilter.valueChanges.subscribe((searchTxt) => {
      this.filteredValues.school = searchTxt;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'school':
          return item.short_name ? item.short_name : null;
        default:
          return item[property];
      }
    };
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = this.customFilterPredicate();
  }

  customFilterPredicate() {
    return function (data, filter: string): boolean {
      const searchString = JSON.parse(filter);

      const schoolFound = data.short_name
        ? data.short_name.toString().trim().toLowerCase().indexOf(searchString.school.toLowerCase()) !== -1
        : true;

      return schoolFound;
    };
  }

  changeDate(event: MatSlideToggleChange, sliderType: string) {
    if (!event.checked) {
      switch (sliderType) {
        case 'send_grand_oral_pdf_to_jury':
          this.parameterForm.get('send_grand_oral_pdf_to_jury_schedule').patchValue(null);
          break;
        case 'student_required_upload_presentation':
          this.parameterForm.get('student_required_upload_presentation_schedule').patchValue(null);
          break;
        case 'student_required_upload_cv':
          this.parameterForm.get('student_required_upload_cv_schedule').patchValue(null);
          break;
        case 'send_grand_oral_pdf_to_student':
          this.parameterForm.get('send_grand_oral_pdf_to_student_schedule').patchValue(null);
          break;
        default:
          break;
      }
    }
  }

  openToggle(blockIndex, subjectIndex) {
    this.expandedToggle[blockIndex][subjectIndex] = !this.expandedToggle[blockIndex][subjectIndex];
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  masterToggle() {
    this.isAllSelected()
      ? this.selection.clear()
      : this.dataSource.data.forEach((row) => {
          this.selection.select(row._id);
          this.selectionParent.emit(this.selection);
        });
  }

  reset() {
    if (this.dataSource && this.dataSource.paginator) {
      this.dataSource.paginator.pageIndex = 0;
    }
    // this.sort.sort({ id: null, start: 'desc', disableClear: false });
    this.filteredValues.school = '';
    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.schoolFilter.setValue('');
    if (this.type !== 'retake_grand_oral' && this.current_status !== 'set_up_grand_oral_parameter') {
      this.selection.clear();
      this.selectionParent.emit(this.selection);
    }
  }

  isSchoolAlreadySelectedBlock(school) {
    const tempBlock = _.cloneDeep(this.getBlockConditionDetails().value);
    const filteredBlock = tempBlock.filter((block) => block.is_selected);
    const filteredBlockIds = filteredBlock.map((block) => block.block_id);
    if (filteredBlockIds && filteredBlockIds.length) {
      const found = filteredBlockIds.block_already_selected.filter((block_id) => filteredBlockIds.includes(block_id));
      if (found && found.length) {
        return true;
      }
    }

    return false;
  }

  getToolTipError(school) {
    const tempBlock = _.cloneDeep(this.getBlockConditionDetails().value);
    const filteredBlock = tempBlock.filter((block) => block.is_selected);
    const filteredBlockIds = filteredBlock.map((block) => block.block_id);

    if (filteredBlockIds && filteredBlockIds.length) {
      const found = school.block_already_selected.filter((block_id) => filteredBlockIds.includes(block_id));
      if (found && found.length) {
        const block = this.blocks.find((blockData) => blockData._id === found[0]);
        const blockName = this.utilService.cleanHTML(block.block_of_competence_condition);
        const text = `School ${school.short_name} already has grand jury with block ${blockName} previously`;
        return this.translate.instant('GRAND_ORAL.TEXT_SCHOOL_ALREADY_USE_BLOCK', { schoolName: school.short_name, blockName: blockName });
      }
    }

    return '';
  }

  noBlockSelected() {
    const tempBlock = _.cloneDeep(this.getBlockConditionDetails().value);
    const filteredBlock = tempBlock.filter((block) => block.is_selected);
    if (filteredBlock && filteredBlock.length) {
      return false;
    }
    return true;
  }

  submit() {
    // if (this.checkAllSchool()) {
    // Swal.fire({
    //   type: 'error',
    //   title: this.translate.instant('ERROR_SELECT_SCHOOL_GRAND_ORAL.TITLE'),
    //   text: this.translate.instant('ERROR_SELECT_SCHOOL_GRAND_ORAL.BODY'),
    //   confirmButtonText: this.translate.instant('ERROR_SELECT_SCHOOL_GRAND_ORAL.BUTTON'),
    // });
    // } else {

    // prevent user from submitting if they have not saved
    if (this.parameterForm.invalid) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Invalid_Form_Warning.TITLE'),
        html: this.translate.instant('Invalid_Form_Warning.TEXT'),
        footer: `<span style="margin-left: auto">Invalid_Form_Warning</span>`,
        confirmButtonText: this.translate.instant('Invalid_Form_Warning.BUTTON'),
      });
      this.parameterForm.markAllAsTouched();
      return;
    }
    if (this.current_status === 'set_up_grand_oral_parameter' && !this.isParametersSaved) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('GO_S3.TITLE'),
        html: this.translate.instant('GO_S3.TEXT'),
        footer: `<span style="margin-left: auto">GO_S3</span>`,
        confirmButtonText: this.translate.instant('GO_S3.BUTTON'),
      });
      return;
    }
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('Grand_Oral_Improvement.GO_S1.TITLE', {
        processName: this.selectedTitleClassData?.class_id?.jury_process_name
          ? this.selectedTitleClassData?.class_id?.jury_process_name
          : 'Grand Oral'
      }),
      html: this.translate.instant('Grand_Oral_Improvement.GO_S1.TEXT', {
        processName: this.selectedTitleClassData?.class_id?.jury_process_name
          ? this.selectedTitleClassData?.class_id?.jury_process_name
          : 'Grand Oral'
}),
      footer: `<span style="margin-left: auto">GO_S1</span>`,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('GO_S1.BUTTON 1'),
      cancelButtonText: this.translate.instant('GO_S1.BUTTON 2'),
      allowOutsideClick: false,
      width: '620px',
    }).then((resp) => {
      if (resp) {
        this.isWaitingForResponse = true;
        this.subs.sink = this.juryService.submitGrandOralParameter(this.juryOrgId).subscribe(
          (res) => {
            this.isWaitingForResponse = false;
            if (resp.value) {
              Swal.fire({
                type: 'success',
                title: this.translate.instant('Bravo !'),
              }).then((res) => {
                if (this.type === 'retake_grand_oral') {
                  // this.router.navigate(['jury-organization']);
                  // Block use to setup schedule for hotfix phase 2
                  this.router.navigate(['/jury-organization', 'setup-schedule'], { queryParams: { id: this.juryOrgId } });
                } else if (this.type === 'grand_oral') {
                  this.router.navigate(['/jury-organization', 'setup-schedule-go'], { queryParams: { id: this.juryOrgId } });
                } else {
                  this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
                    this.router.navigate(['/jury-organization', this.juryOrgId, 'organize-juries', 'assign-jury']);
                  });
                }
              });
            }
          },
          (err) => {
            this.isWaitingForResponse = false;
            Swal.fire({
              type: 'error',
              title: this.translate.instant('Grand_Oral_Improvement.ERROR_SELECT_SCHOOL_GRAND_ORAL.TITLE'),
              text: this.translate.instant('Grand_Oral_Improvement.ERROR_SELECT_SCHOOL_GRAND_ORAL.BODY', {
                processName: this.selectedTitleClassData?.class_id?.jury_process_name
                  ? this.selectedTitleClassData?.class_id?.jury_process_name
                  : 'Grand Oral',
              }),
              footer: `<span style="margin-left: auto">ERROR_SELECT_SCHOOL_GRAND_ORAL</span>`,
              confirmButtonText: this.translate.instant('Grand_Oral_Improvement.ERROR_SELECT_SCHOOL_GRAND_ORAL.BUTTON'),
            });
          },
        );
      }
    });
    // }
  }

  checkAllSchool() {
    let condition = false;

    this.selection.selected.forEach((school) => {
      if (this.isSchoolAlreadySelectedBlock(school)) {
        condition = true;
      }
    });
    return condition;
  }

  createPayload() {
    const schoolList = _.cloneDeep(this.dataSource.data);
    const parameterValue = _.cloneDeep(this.parameterForm.value);
    // **************** Format the date format into isostring
    if (parameterValue.send_grand_oral_pdf_to_student_schedule) {
      parameterValue.send_grand_oral_pdf_to_student_schedule = this.convertLocalDateToUTC(
        parameterValue.send_grand_oral_pdf_to_student_schedule,
      );
    }
    if (parameterValue.send_grand_oral_pdf_to_jury_schedule) {
      parameterValue.send_grand_oral_pdf_to_jury_schedule = this.convertLocalDateToUTC(parameterValue.send_grand_oral_pdf_to_jury_schedule);
    }
    if (parameterValue.student_required_upload_presentation_schedule) {
      parameterValue.student_required_upload_presentation_schedule = this.convertLocalDateToUTC(
        parameterValue.student_required_upload_presentation_schedule,
      );
    }
    if (parameterValue.student_required_upload_cv_schedule) {
      parameterValue.student_required_upload_cv_schedule = this.convertLocalDateToUTC(parameterValue.student_required_upload_cv_schedule);
    }
    if (parameterValue.grand_oral_retake_end_date) {
      parameterValue.grand_oral_retake_end_date = this.convertLocalDateToUTC(parameterValue.grand_oral_retake_end_date);
    }

    // *************** Format data of blocks
    if (parameterValue && parameterValue.blocks_for_grand_oral && parameterValue.blocks_for_grand_oral.length) {
      parameterValue.blocks_for_grand_oral = parameterValue.blocks_for_grand_oral.map((block) => {
        return {
          block_id: block.block_id._id,
          is_selected: block.is_selected,
        };
      });
    }

    return {
      ...parameterValue,
      rncp_id: this.selectedTitleClassData.rncp_id._id,
      class_id: this.selectedTitleClassData.class_id._id,
      schools: schoolList.map((school) => {
        return {
          school: school.school._id,
          students: school.students.map((res) => res._id),
          is_school_selected_for_grand_oral: this.selection.isSelected(school._id),
        };
      }),
    };
  }

  save() {
    if (this.parameterForm.invalid) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Invalid_Form_Warning.TITLE'),
        html: this.translate.instant('Invalid_Form_Warning.TEXT'),
        footer: `<span style="margin-left: auto">Invalid_Form_Warning</span>`,
        confirmButtonText: this.translate.instant('Invalid_Form_Warning.BUTTON'),
      });
      this.parameterForm.markAllAsTouched();
      return;
    }
    this.saveTitleClass.emit(this.createPayload());
  }

  convertLocalDateToUTC(data) {
    const date = moment(data).format('DD/MM/YYYY');
    const time = '08:00';

    const dateTimeInUTC = moment(date + time, 'DD/MM/YYYYHH:mm');
    return dateTimeInUTC.toISOString();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
