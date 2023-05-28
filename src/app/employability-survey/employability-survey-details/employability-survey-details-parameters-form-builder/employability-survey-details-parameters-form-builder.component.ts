import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import * as _ from 'lodash';
import { CoreService } from 'app/service/core/core.service';
import { TranslateService } from '@ngx-translate/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { UtilityService } from 'app/service/utility/utility.service';
import { EmployabilitySurveyService } from 'app/service/employability-survey/employability-survey.service';
import { SchoolService } from 'app/service/schools/school.service';

@Component({
  selector: 'ms-employability-survey-details-parameters-form-builder',
  templateUrl: './employability-survey-details-parameters-form-builder.component.html',
  styleUrls: ['./employability-survey-details-parameters-form-builder.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class EmployabilitySurveyDetailsParametersFormBuilderComponent implements OnInit, OnDestroy, AfterViewInit {
  @Input() esProcessId: '';
  @Input() esName: '';
  @Input() esType: any;
  // For Parameter Form
  private subs = new SubSink();
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  @Input() selectedClassName: string;
  @Input() classData: any;

  @Output() selectedIndexChange = new EventEmitter<number>();  
  @Output() triggerRefresh = new EventEmitter<boolean>();  
  // Student Parameter Table
  dataSource = new MatTableDataSource([]);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatTable, { static: false }) table: MatTable<any>;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChildren('esPanel') esPanel: QueryList<ElementRef>;

  displayedColumns: string[] = ['select', 'school', 'student', 'studentStatus', 'titleStatus', 'finalTranscripResult'];
  filterColumns: string[] = [
    'selectFilter',
    'schoolFilter',
    'studentFilter',
    'studentStatusFilter',
    'titleStatusFilter',
    'finalTranscripResultFilter',
  ];
  isWaitingForResponse = false;
  dataCount: any;
  published = false;
  disabledExport = true;
  dummyData = [
    {
      school: 'dummyTitle',
      student: 'dummyStudent',
      certifier: 'true',
      included: 'true',
    },
    {
      school: 'dummyTitle 2',
      student: 'dummyStudent 2',
      certifier: 'false',
      included: 'false',
    },
  ];

  schoolFilter = new UntypedFormControl('');
  filteredSchools: Observable<any[]>;
  schoolList = [];

  employabilitySurveyForm: UntypedFormGroup;
  ESQuestionaireList: any;
  ESQuestionaireListFiltered: [][] = [];
  ESConditionQuestion = [];
  ESConditionQuestionFiltered = [];
  ESConditionAnswer = [];
  ESConditionAnswerFiltered = [];

  isFormLoading = false;

  enumValidatorList = ['no_validator', 'operator', 'certifier', 'academic_director'];
  validatorFiltered: string[][] = [];
  // End Parameter Form

  filteredValues = {
    student_name: '',
    school: '',
    included: '',
    final_transcript_result: '',
    student_status: '',
    student_title_status: '',
  };

  dataLoaded = false;
  studentList = [];
  statusFilterList = ['AllM', 'active', 'pending', 'incorrect_email'];
  // statusTitleFilterList = ['AllM', 'current_active', 'deactivated', 'completed', 'suspended', 'retaking', 'admission'];
  statusTitleFilterList = [
    {
      name: 'Active',
      value: 'current_active'
    },
    {
      name: 'Deactivated',
      value: 'deactivated'
    },
    {
      name: 'Completed',
      value: 'completed'
    },
    {
      name: 'Suspended',
      value: 'suspended'
    },
    {
      name: 'Retake',
      value: 'retaking'
    },
    {
      name: 'Admission not completed',
      value: 'admission'
    },
  ];
  studentNameFilter = new UntypedFormControl('');
  studentStatusFilter = new UntypedFormControl('');
  titleStatusFilterCtrl = new UntypedFormControl('');
  transcriptResultFilter = new UntypedFormControl('');
  includedFilter = new UntypedFormControl('');

  includedFilterList = [
    {
      name: 'Send To Student',
      value: 'already_sent_to_student',
    },
    {
      name: 'Excluded',
      value: 'not_sent_to_student',
    },
    {
      name: 'Included',
      value: 'included',
    },
    {
      name: 'Generated',
      value: 'generated',
    },
  ];

  listTranscriptResult = [
    { name: 'Eliminated', value: 'eliminated' },
    { name: 'Initial', value: 'initial' },
    { name: 'Passed', value: 'pass' },
    { name: 'Failed', value: 'failed' },
    { name: 'Re-Take', value: 'retaking' },
  ];
  sortValue: { [x: string]: 'asc' | 'desc' };

  esData;
  selection = new SelectionModel<any>(true, []);
  isCheckedAll = false;
  selectType;
  userSelected = [];
  userSelectedId = [];
  isReset = false;
  noData: any;
  initialForm: UntypedFormGroup;
  initialTable: any;
  buttonValidation = false;
  studentData: any;
  dateTypes = [
    'relative_date',
    'exact_date'
  ]

  today = new Date();
  loadingDropdown = false;
  private timeOutVal: any;
  title: any;
  allResultData = [];
  isSaveFromToggle = false;
  comparisonToggle;
  triggered: any;

  dateTypeExpiration = [];

  constructor(
    public coreService: CoreService,
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private rncpTitleService: RNCPTitlesService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private utilService: UtilityService,
    private esService: EmployabilitySurveyService,
    private schoolService: SchoolService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {







    if (this.esType !== 'continuous') {
      this.displayedColumns.push('included');
      this.filterColumns.push('includedFilter');
    }

    if (this.esType === 'continuous') {
      this.displayedColumns = this.displayedColumns.filter((res) => res !== 'select');
      this.filterColumns = this.filterColumns.filter((res) => res !== 'selectFilter');
    }

    this.coreService.sidenavOpen = false;
    this.dataInit();
    this.getSchoolListDropdown();
    this.initFilter();
    this.sortFilterDropdown();
    // this.subs.sink = this.translate.onLangChange.pipe().subscribe((lang) => {
    //   const tempES = _.cloneDeep(this.getESFormArray().value);
    //   if (tempES && tempES.length) {
    //     tempES.forEach((survey, surveyIndex) => {
    //       if (survey && survey.validator && this.enumValidatorList.includes(survey.validator)) {
    //         this.getESFormArray().at(surveyIndex).get('validator').patchValue(survey.validator, { emitEvent: true });
    //       }
    //     });
    //   }
    // });
    // this.statusTitleFilterList = _.sortBy(this.statusTitleFilterList, 'name');
    // this.listTranscriptResult = _.sortBy(this.listTranscriptResult, this.translate.instant('name'));
    
  }

  sortFilterDropdown() {
    this.statusFilterList = _.sortBy(this.statusFilterList);
    
    this.statusTitleFilterList = this.statusTitleFilterList.sort((a, b) => {
      if (this.utilService.simplifyRegex(this.translate.instant(a.value)) > this.utilService.simplifyRegex(this.translate.instant(b.value))) {
        return 1;
      } else if (this.utilService.simplifyRegex(this.translate.instant(b.value)) > this.utilService.simplifyRegex(this.translate.instant(a.value))) {
        return -1;
      } else {
        return 0;
      }
    });

    this.listTranscriptResult = this.listTranscriptResult.sort((a, b) => {
      if (this.utilService.simplifyRegex(this.translate.instant(a.name)) > this.utilService.simplifyRegex(this.translate.instant(b.name))) {
        return 1;
      } else if (this.utilService.simplifyRegex(this.translate.instant(b.name)) > this.utilService.simplifyRegex(this.translate.instant(a.name))) {
        return -1;
      } else {
        return 0;
      }
    });

    this.includedFilterList = this.includedFilterList.sort((a, b) => {
      if (this.utilService.simplifyRegex(this.translate.instant(a.name)) > this.utilService.simplifyRegex(this.translate.instant(b.name))) {
        return 1;
      } else if (this.utilService.simplifyRegex(this.translate.instant(b.name)) > this.utilService.simplifyRegex(this.translate.instant(a.name))) {
        return -1;
      } else {
        return 0;
      }
    });
    
    this.subs.sink = this.translate.onLangChange.pipe().subscribe(() => {
      this.statusTitleFilterList = this.statusTitleFilterList.sort((a, b) => {
        if (this.utilService.simplifyRegex(this.translate.instant(a.value)) > this.utilService.simplifyRegex(this.translate.instant(b.value))) {
          return 1;
        } else if (this.utilService.simplifyRegex(this.translate.instant(b.value)) > this.utilService.simplifyRegex(this.translate.instant(a.value))) {
          return -1;
        } else {
          return 0;
        }
      });
      
      this.listTranscriptResult = this.listTranscriptResult.sort((a, b) => {
        if (this.utilService.simplifyRegex(this.translate.instant(a.name)) > this.utilService.simplifyRegex(this.translate.instant(b.name))) {
          return 1;
        } else if (this.utilService.simplifyRegex(this.translate.instant(b.name)) > this.utilService.simplifyRegex(this.translate.instant(a.name))) {
          return -1;
        } else {
          return 0;
        }
      });

      this.includedFilterList = this.includedFilterList.sort((a, b) => {
        if (this.utilService.simplifyRegex(this.translate.instant(a.name)) > this.utilService.simplifyRegex(this.translate.instant(b.name))) {
          return 1;
        } else if (this.utilService.simplifyRegex(this.translate.instant(b.name)) > this.utilService.simplifyRegex(this.translate.instant(a.name))) {
          return -1;
        } else {
          return 0;
        }
      });
    })
  }

  dataInit() {
    this.initForm();
    this.enumValidatorList = this.enumValidatorList.sort((validatorA, validatorB) => {
      if (
        this.utilService.simplifyRegex(this.translate.instant('056_ES.validator_dropdown.' + validatorA)) <
        this.utilService.simplifyRegex(this.translate.instant('056_ES.validator_dropdown.' + validatorB))
      ) {
        return -1;
      } else if (
        this.utilService.simplifyRegex(this.translate.instant('056_ES.validator_dropdown.' + validatorA)) >
        this.utilService.simplifyRegex(this.translate.instant('056_ES.validator_dropdown.' + validatorB))
      ) {
        return 1;
      } else {
        return 0;
      }
    });
    this.validatorFiltered.push(this.enumValidatorList);
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (!this.isReset) {
            this.getDataResuslES();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
  }

  sortData(sort: Sort) {
    this.sortValue = sort.direction ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getDataResuslES();
      }
    }
  }

  getDataResuslES() {
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    // this.selection.clear();
    this.isWaitingForResponse = true;
    this.dataSource.data = [];
    const filter = this.cleanFilterData();
    this.subs.sink = this.esService
      .getAllEmployabilitySurveyProcessStudentsParameter(pagination, filter, this.sortValue, this.esProcessId)
      .subscribe((result: any) => {

        if (result && result.length) {
          this.studentData = _.cloneDeep(result);
          this.dataSource.data = result;
          this.paginator.length = result[0].count_document;
          this.dataCount = result[0].count_document;
          this.initialTable = _.cloneDeep(this.dataSource.data);
          this.checkButtonValidation()
        } else {
          this.dataSource.data = [];
          this.paginator.length = 0;
          this.dataCount = 0;
        }
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
        this.isReset = false;
        this.isWaitingForResponse = false;
      });
  }

  cleanFilterData() {
    const filterData = _.cloneDeep(this.filteredValues);
    let filterQuery = '';
    Object.keys(filterData).forEach((key) => {
      // only add key that has value to the query. so it wont send filter with empty string
      if (filterData[key]) {
        if (key === 'student_name' || key === 'school') {
          filterQuery = filterQuery + ` ${key}:"${filterData[key]}"`;
        } else {
          filterQuery = filterQuery + ` ${key}:${filterData[key]}`;
        }
      }
    });
    return 'filter: {' + filterQuery + '}';
  }

  initFilter() {
    this.subs.sink = this.studentNameFilter.valueChanges.pipe(debounceTime(400)).subscribe((statusSearch) => {
      const symbol = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      if (!statusSearch.match(symbol) && !statusSearch.match(symbol1)) {
        this.filteredValues.student_name = statusSearch ? statusSearch.toLowerCase() : '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.clearSelection();
          this.getDataResuslES();
        }
      } else {
        this.studentNameFilter.setValue('');
        this.filteredValues.student_name = '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.clearSelection();
          this.getDataResuslES();
        }
      }
    });
    this.subs.sink = this.transcriptResultFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.final_transcript_result = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.clearSelection();
        this.getDataResuslES();
      }
    });
    this.subs.sink = this.studentStatusFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.student_status = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.clearSelection();
        this.getDataResuslES();
      }
    });
    this.subs.sink = this.includedFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.included = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.clearSelection();
        this.getDataResuslES();
      }
    });

    this.subs.sink = this.titleStatusFilterCtrl.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.student_title_status = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.clearSelection();
        this.getDataResuslES();
      }
    });
  }

  checkButtonValidation(){
    if(this.esType && this.esType === 'one_time'){
      this.buttonValidation  = this.studentData.some((student)=>{
        return !student.is_already_generated && student.is_send_to_student === true && student.is_already_send_to_student === false;
      })

    }
  }

  getESData() {
    this.reset();
    if (this.isReset) {
      this.isWaitingForResponse = true;
    } else {
      this.isFormLoading = true;
    }
    this.subs.sink = this.esService.getOneEmployabilitySurveyProcess(this.esProcessId).subscribe(
      (resp) => {
        if (resp) {
          this.title = resp.rncp_title_id;
          if (this.isReset) {
            this.isWaitingForResponse = false;
          } else {
            this.isFormLoading = false;
          }

          this.published = resp.is_published;
          if (resp.employability_surveys.length) {
            this.triggered = resp.employability_surveys[0].is_already_triggered;
          }
          this.esData = {
            _id: resp._id,
            name: resp.name,
            rncp_title_id: resp.rncp_title_id,
            class_id: resp.class_id,
            employability_surveys: resp.employability_surveys,
            is_have_student_participant: resp.is_have_student_participant,
            employability_survey_type: resp.employability_survey_type,
          };
          const formattedData = this.formatESData(resp);
          const omittedData = _.omitBy(formattedData, _.isNil);
          this.employabilitySurveyForm.patchValue(omittedData);
          if(resp.employability_surveys && resp.employability_surveys.length){
            resp.employability_surveys.forEach((es, esIndex) => {
              if(esIndex > 0){
                this.formatESConditionQuestion(esIndex, true); 
              }
            });
          } else {
            this.dateTypeExpiration.push('relative_date');
          }
          this.initialForm = _.cloneDeep(this.employabilitySurveyForm.value);
          this.fireValidationCheck();


          if (resp && resp.students && resp.students.length) {
            this.dataCount = resp.students.length;
            const dataUpdate = resp.students.sort(
              (item1, item2) =>
                item2.is_send_to_student - item1.is_send_to_student ||
                item1.student_id.school.short_name.localeCompare(item2.student_id.school.short_name) ||
                item1.student_id.last_name.localeCompare(item2.student_id.last_name),
            );
            const schoolsId = [];
            resp.students.forEach((el) => {
              schoolsId.push(el.student_id.school._id);
            });
            this.schoolList = this.schoolList.filter((resSchool) => schoolsId.includes(resSchool._id));
            this.schoolFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });
          }
          this.isSaveFromToggle = false;

        }
      },
      (err) => {
        (this.isFormLoading = false), (this.isWaitingForResponse = false);
      },
    );
  }

  getDropdownCondition() {
    this.esData.employability_surveys.forEach((es, esIndex) => {
      if(esIndex > 0){
        if (es.es_condition_questions && es.es_condition_questions.length) {
          es.es_condition_questions.forEach((condition, i) => {
            this.addConditionQuestion(esIndex, true);
          })
        }
      }
    });
  }

  patchStudentsAlreadySentArray(studentList: string[]) {
    if (!this.employabilitySurveyForm) {
      return;
    }
    const control = this.employabilitySurveyForm.get('students_already_sent') as UntypedFormArray;
    for (const id of studentList) {
      control.push(this.fb.control(id));
    }
    this.initialForm = _.cloneDeep(this.employabilitySurveyForm.value);
  }

  initForm() {
    this.employabilitySurveyForm = this.fb.group({
      name: [this.esName],
      employability_surveys: this.fb.array([
        this.esType && this.esType === 'one_time' ? this.initESFormGroupOneTime() : this.initESFormGroupContinuous(),
      ]),
    });
    this.initialForm = _.cloneDeep(this.employabilitySurveyForm.value);
    this.employabilitySurveyForm.valueChanges.subscribe(change => {
      this.fireValidationCheck();
    })
  }

  initESFormGroupOneTime() {
    return this.fb.group({
      _id: [null],
      is_already_sent: [false],
      form_builder_id: [null, Validators.required],
      send_date: ['', Validators.required],
      send_time: ['23:59'],
      expiration_date: ['', Validators.required],
      expiration_time: ['23:59'],
      with_rejection_flow: [false],
      is_required_for_certificate: [false],
      // validator: ['no_validator', Validators.required],
      // *************** If send_only_to_pass_student false, mean will send to all student
      // send_only_to_pass_student: [false],
      // *************** If send_only_to_not_mention_continue_study false, mean will send to all student situation
      // send_only_to_not_mention_continue_study: [false],
      students_already_sent: [[]],
    });
  }

  initESFormGroupContinuous() {
    return this.fb.group({
      _id: [null],
      is_already_sent: [false],
      form_builder_id: [null, Validators.required],
      expiration_date_continous: [''],
      expiration_date: [''],
      expiration_time: ['23:59'],
      with_rejection_flow: [false],
      is_required_for_certificate: [false],
      send_date_continuous: [''],
      send_date: [''],
      send_time: ['23:59'],
      date_type: ['relative_date', Validators.required],
      expiration_date_type: ['relative_date'],
      // validator: ['no_validator', Validators.required],
      // *************** If send_only_to_pass_student false, mean will send to all student
      // send_only_to_pass_student: [false],
      // *************** If send_only_to_not_mention_continue_study false, mean will send to all student situation
      // send_only_to_not_mention_continue_study: [false],
      // *************** If is_send_es_if_prev_not_answered false, mean will send immediately on the send date set in the parameter
      is_send_es_if_prev_not_answered: [false],
      is_send_es_based_on_prev_question: [false],
      es_condition_questions: this.fb.array([]),
      students_already_sent: [[]],
    });
  }

  initESConditionQuestion() {
    return this.fb.group({
      connection: [null], 
      question: [''],
      answer: ['']
    });
  }

  getESFormArray(): UntypedFormArray {
    return this.employabilitySurveyForm.get('employability_surveys') as UntypedFormArray;
  }

  getConditionQuestions(esIndex): UntypedFormArray {
    return this.getESFormArray().at(esIndex).get('es_condition_questions') as UntypedFormArray;
  }

  addESFormGroup() {

    if (this.esType && this.esType === 'one_time') {
      this.getESFormArray().push(this.initESFormGroupOneTime());
    } else {
      this.getESFormArray().push(this.initESFormGroupContinuous());
      this.dateTypeExpiration.push('relative_date');
      setTimeout(() => {
        if(this.esPanel && this.esPanel.length) {
          this.esPanel.toArray()[this.esPanel.length-1].nativeElement.scrollIntoView({ behavior: 'smooth' })
        }
      })

    }
    this.ESQuestionaireListFiltered.push(this.ESQuestionaireList);
    // this.validatorFiltered.push(this.enumValidatorList);

    this.ESConditionQuestion.push([]);
    this.ESConditionAnswer.push([]);
    this.ESConditionQuestionFiltered.push([]);
    this.ESConditionAnswerFiltered.push([]);
  }

  removeESFormGroup(esIndex) {
    let emptyES;
    if (this.esType && this.esType === 'one_time') {
      emptyES = JSON.stringify(this.initESFormGroupOneTime().value);
    } else {
      emptyES = JSON.stringify(this.initESFormGroupContinuous().value);
    }
    // const emptyES = JSON.stringify(this.initESFormGroup().value);
    const selectedES = JSON.stringify(this.getESFormArray().at(esIndex).value);
    if (emptyES !== selectedES) {
      Swal.fire({
        title: this.translate.instant('WARN_DELETE_ES.TITLE'),
        text: this.translate.instant('WARN_DELETE_ES.TEXT'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('WARN_DELETE_ES.BUTTON_1'),
        cancelButtonText: this.translate.instant('WARN_DELETE_ES.BUTTON_2'),
        allowOutsideClick: false,
        allowEnterKey: false,
      }).then((result) => {
        if (result.value) {
          this.getESFormArray().removeAt(esIndex);
          if(this.getESFormArray().length - 1 >= esIndex){
            this.onSendBasedOnPrevous({checked: false}, esIndex)
            this.onSendBasedOnPrevous({checked: true}, esIndex)
          }
          this.ESConditionQuestionFiltered.splice(esIndex, 1);
          this.ESConditionAnswerFiltered.splice(esIndex, 1);
          this.ESConditionQuestion.splice(esIndex, 1);
          this.ESConditionAnswer.splice(esIndex, 1);
        }
      });
    } else {
      this.getESFormArray().removeAt(esIndex);
      if (this.esType && this.esType !== 'one_time') {
        this.dateTypeExpiration.splice(esIndex, 1);
      }
    }
  }

  addConditionQuestion(esIndex, fromPopulate?) {
    if(!fromPopulate){
      this.getConditionQuestions(esIndex).push(this.initESConditionQuestion());
    }
    this.ESConditionQuestionFiltered[esIndex-1].push(this.ESConditionQuestion[esIndex-1]);
    this.ESConditionAnswerFiltered[esIndex-1].push(this.ESConditionAnswer[esIndex-1]);


  }

  removeConditionQuestion(esIndex, conditionQuestionIndex) {
    this.getConditionQuestions(esIndex).removeAt(conditionQuestionIndex);
    this.ESConditionQuestionFiltered[esIndex-1].splice(conditionQuestionIndex, 1);
    this.ESConditionAnswerFiltered[esIndex-1].splice(conditionQuestionIndex, 1);
  }

  clearAnswer(esIndex, conditionQuestionIndex) {
    this.getConditionQuestions(esIndex).at(conditionQuestionIndex).get('answer').setValue('');
  }

  onSendBasedOnPrevous(event, esIndex) {
    if(event.checked) {
      this.formatESConditionQuestion(esIndex);
    } else {
      this.getConditionQuestions(esIndex).clear();
      this.ESConditionQuestionFiltered[esIndex-1] = [];
      this.ESConditionAnswerFiltered[esIndex-1] = [];
      this.ESConditionQuestion[esIndex-1] = [];
      this.ESConditionAnswer[esIndex-1] = [];
    }
  }

  formatESConditionQuestion(esIndex, fromPopulate?) {
    const formBuilderId = this.getESFormArray().at(esIndex-1).get('form_builder_id').value;

    this.isFormLoading = true;
    this.subs.sink = this.esService.getAllRequiredQuestionES(formBuilderId).subscribe(
      (resp) => {
        if(resp) {

          this.isFormLoading = false;
          const conditionQuestion = _.cloneDeep(resp);
          const conditionQuestionArray = [];
          const conditionAnswerArray = [];
          if(conditionQuestion && conditionQuestion.length){
            conditionQuestion.forEach((condition) => {
              conditionQuestionArray.push({_id: condition._id, question: condition.question_label});
              if(condition.options && condition.options.length){
                condition.options.forEach(option => {
                  conditionAnswerArray.push({_id: condition._id, answer: option.option_name});
                });
              }
            });
          }
          this.ESConditionQuestion[esIndex-1] = conditionQuestionArray;
          this.ESConditionQuestion[esIndex-1] = _.uniqBy(this.ESConditionQuestion[esIndex-1], '_id');
          this.ESConditionAnswer[esIndex-1] = conditionAnswerArray;

          if (fromPopulate) {
            // To populate data condition question
            if(this.esData && this.esData.employability_surveys && this.esData.employability_surveys.length){
              this.esData.employability_surveys.forEach((es, index) => {
                if(esIndex === index){
                  if (es.es_condition_questions && es.es_condition_questions.length) {
                    es.es_condition_questions.forEach((condition, i) => {
                      this.ESConditionQuestionFiltered[esIndex-1].push(this.ESConditionQuestion[esIndex-1]);
                      this.ESConditionAnswerFiltered[esIndex-1].push(this.ESConditionAnswer[esIndex-1]);
                    })
                  }
                  let conditionPatchArray = [];
                  if (es.es_condition_questions && es.es_condition_questions.length) {
                    es.es_condition_questions.forEach((condition, i) => {
                      this.getConditionQuestions(esIndex).push(this.initESConditionQuestion());
                      const tempCondition = {
                        connection: condition.connection,
                        question: condition.question._id,
                        answer: condition.answer
                      }
                      conditionPatchArray.push(tempCondition);
                    });
                    if(this.ESConditionQuestion && this.ESConditionQuestion.length){
                        this.getConditionQuestions(esIndex).patchValue(conditionPatchArray);
                    }
                  }
                }
              });
            }
            this.initialForm = _.cloneDeep(this.employabilitySurveyForm.value);
            this.fireValidationCheck();
          } else {
            this.addConditionQuestion(esIndex, fromPopulate);
          }
        } else {
          this.isFormLoading = false;
        }
      },
      (err) => {
        this.isFormLoading = false;  
      })
  }

  formatESData(rawData) {
    const formattedData = _.cloneDeep(rawData);
    this.dateTypeExpiration = [];
    if (formattedData && formattedData.employability_surveys && formattedData.employability_surveys.length) {
      formattedData.employability_surveys.forEach((esForm, esIndex) => {


        if (this.esType && this.esType !== 'one_time') {
          this.dateTypeExpiration.push(esForm?.expiration_date_type);
        }

        if (esIndex > 0 && !this.isSaveFromToggle) {
          this.addESFormGroup();
        }
        if (esForm && esForm.form_builder_id && esForm.form_builder_id._id) {
          esForm.form_builder_id = esForm.form_builder_id._id;
          this.displayFn(esForm.form_builder_id);
        }
        if (esForm.send_date && esForm.send_time) {
          esForm.send_date = this.parseStringDatePipe.transformStringToDate(
            this.parseUTCToLocalPipe.transformDate(esForm.send_date, esForm.send_time),
          );
          esForm.send_time = this.parseUTCToLocalPipe.transform(esForm.send_time);
        }
        if (esForm.expiration_date && esForm.expiration_time) {
          esForm.expiration_date = this.parseStringDatePipe.transformStringToDate(
            this.parseUTCToLocalPipe.transformDate(esForm.expiration_date, esForm.expiration_time),
          );
          esForm.expiration_time = this.parseUTCToLocalPipe.transform(esForm.expiration_time);
        }

        if (esForm.students_already_sent && esForm.students_already_sent.length) {
          esForm.students_already_sent = esForm.students_already_sent.map((object) => object._id);
        }

        if (esForm.es_condition_questions === null) {
          esForm.es_condition_questions = [];
        }

        esForm = _.omitBy(esForm, _.isNil);
      });
    }
    return formattedData;
  }

  getDataQuestionaire() {
    this.loadingDropdown = true;
    this.subs.sink = this.rncpTitleService.getESFormBuilderTemplate().subscribe(
      (resp) => {

        if (resp) {
          this.ESQuestionaireList = resp;
          this.ESQuestionaireList = this.ESQuestionaireList.sort((ESQuestionaireA, ESQuestionaireB) => {
            if (
              this.utilService.simplifyRegex(ESQuestionaireA.form_builder_name) <
              this.utilService.simplifyRegex(ESQuestionaireB.form_builder_name)
            ) {
              return -1;
            } else if (
              this.utilService.simplifyRegex(ESQuestionaireA.form_builder_name) >
              this.utilService.simplifyRegex(ESQuestionaireB.form_builder_name)
            ) {
              return 1;
            } else {
              return 0;
            }
          });


          this.ESQuestionaireListFiltered.push(this.ESQuestionaireList);

          this.loadingDropdown = false;
          this.getDataResuslES();
          this.getESData();
        }
      },
      (err) => (this.loadingDropdown = false),
    );
  }

  displayFn(ESQuestionaireId: any) {
    if (ESQuestionaireId) {
      const foundESQuestionaire = _.find(this.ESQuestionaireList, (res) => res._id === ESQuestionaireId);
      let ESQuestionaire = '';
      if (foundESQuestionaire) {
        ESQuestionaire = foundESQuestionaire.form_builder_name;
      }
      return ESQuestionaire;
    }
  }

  displayConditionQuestion(esIndex, id) {
    if(id) {
      const foundQuestion = _.find(this.ESConditionQuestion[esIndex-1], (res) => res._id === id);
      let ESConditionQuestion = '';
      if (foundQuestion) {
        ESConditionQuestion = foundQuestion.question;
      }
      return ESConditionQuestion;
    }
  }

  dateSendUpdate(esIndex) {
    if (this.getESFormArray() && this.getESFormArray().at(esIndex) && this.getESFormArray().at(esIndex).get('send_date').value && !this.getESFormArray().at(esIndex).get('send_time').value) {
      this.getESFormArray().at(esIndex).get('send_time').patchValue('23:59');
    }
  }

  dateExpUpdate(esIndex) {
    if (this.getESFormArray() && this.getESFormArray().at(esIndex) && this.getESFormArray().at(esIndex).get('expiration_date').value && !this.getESFormArray().at(esIndex).get('expiration_time').value) {
      this.getESFormArray().at(esIndex).get('expiration_time').patchValue('23:59');
    }
  }

  createPayload() {
    const payload = _.cloneDeep(this.employabilitySurveyForm.value);
    if (payload.employability_surveys && payload.employability_surveys.length) {
      payload.employability_surveys.forEach((esForm, index) => {
        if (esForm && esForm.send_date && esForm.send_time) {
          esForm.send_date = this.parseLocalToUTCPipe.transformDate(moment(esForm.send_date).format('DD/MM/YYYY'), esForm.send_time);
          esForm.send_time = this.parseLocalToUTCPipe.transform(esForm.send_time);
        }
        if (esForm && esForm.expiration_date && esForm.expiration_time) {
          esForm.expiration_date = this.parseLocalToUTCPipe.transformDate(
            moment(esForm.expiration_date).format('DD/MM/YYYY'),
            esForm.expiration_time,
          );
          esForm.expiration_time = this.parseLocalToUTCPipe.transform(esForm.expiration_time);
        }
        if (esForm && !esForm._id) {
          delete esForm._id;
        }
        if (esForm.date_type == 'relative_date') {
          delete esForm.send_date
        }
        if(esForm.date_type == 'exact_date'){
          delete esForm.send_date_continuous
        }
        if (this.dateTypeExpiration[index] && esForm.expiration_date_type == 'relative_date') {
          delete esForm.expiration_date;
        }
        if(!this.dateTypeExpiration[index] || esForm.expiration_date_type == 'exact_date'){
          delete esForm.expiration_date_continous;
        }
        if (!this.dateTypeExpiration[index]) {
          esForm.expiration_date_type = null;
        }
        if(!esForm.is_send_es_based_on_prev_question) {
          delete esForm.is_send_es_based_on_prev_question;
          delete esForm.es_condition_questions;
        }
      });
    }
    return payload;
  }

  save() {
    const payload = this.createPayload();

    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.updateClassParameter(this.selectedClassId, payload).subscribe(
      (response) => {
        this.isWaitingForResponse = false;

        if (response && response.data && response.data.UpdateClass && !response.errors) {
          const resp = response.data.UpdateClass;
          Swal.fire({
            type: 'success',
            title: 'Bravo!',
            text: this.translate.instant('CLASS_UPDATED_SWAL', { className: resp.name }),
          });
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  saveQuestionnaireID(esIndex, esID?: any) {
    if (esID && esID._id) {
      this.getESFormArray().at(esIndex).get('form_builder_id').patchValue(esID._id);
    } else {
      this.getESFormArray().at(esIndex).get('form_builder_id').patchValue(null);
    }

    // To clear getConditionQuestions form and set togle is_send_es_based_on_prev_question the next ES
    if(this.getESFormArray().length && this.getESFormArray().length > 1 && esIndex + 1 < this.getESFormArray().length){
      this.getESFormArray().at(esIndex + 1).get('is_send_es_based_on_prev_question').setValue(false);
      this.getConditionQuestions(esIndex + 1).clear();
      this.ESConditionQuestionFiltered[esIndex] = [];
      this.ESConditionAnswerFiltered[esIndex] = [];
      this.ESConditionQuestion[esIndex] = [];
      this.ESConditionAnswer[esIndex] = [];
    }
  }

  displayValidator(value) {
    if (value) {

      if (this.enumValidatorList.includes(value)) {
        return this.translate.instant('056_ES.validator_dropdown.' + value);
      }
    } else {
      return null;
    }
  }

  filterES(esIndex: number) {
    const searchString = this.getESFormArray().at(esIndex).get('form_builder_id').value;
    if (searchString) {
      this.ESQuestionaireListFiltered[esIndex] = this.ESQuestionaireList.filter((es) => {


        return this.utilService.simplifyRegex(es.form_builder_name).includes(this.utilService.simplifyRegex(searchString));
      });

    } else {
      this.ESQuestionaireListFiltered[esIndex] = this.ESQuestionaireList;

    }
  }

  getFilterConditionQuestion(esIndex, conditionQuestionIndex) {
    const searchString = this.getConditionQuestions(esIndex).at(conditionQuestionIndex).get('question').value;
    if(searchString) {
      this.ESConditionQuestionFiltered[esIndex-1][conditionQuestionIndex] = this.ESConditionQuestion[esIndex-1].filter((data) => {
        return this.utilService.simplifyRegex(data.question).includes(this.utilService.simplifyRegex(searchString));
      });
    } else {
      this.ESConditionQuestionFiltered[esIndex-1][conditionQuestionIndex] = this.ESConditionQuestion[esIndex-1];
    }
  }

  getFilterConditionAnswer(esIndex, conditionQuestionIndex) {
    const searchString = this.getConditionQuestions(esIndex).at(conditionQuestionIndex).get('answer').value;
    if(searchString) {
      this.ESConditionAnswerFiltered[esIndex-1][conditionQuestionIndex] = this.ESConditionAnswer[esIndex-1].filter((data) => {
        return this.utilService.simplifyRegex(data.answer).includes(this.utilService.simplifyRegex(searchString));
      }); 
    } else {
      this.ESConditionAnswerFiltered[esIndex-1][conditionQuestionIndex] = this.ESConditionAnswer[esIndex-1];
    }
  }

  checkisTriggered(esData){
    return esData.employability_surveys.some((es)=>{
      return es.is_already_triggered === true;
    })
  }

  saveESProcess() {

    const payload = this.createPayload();


    this.isFormLoading = true;

    if (this.esType === 'continuous' && this.checkisTriggered(this.esData)) {
      this.isFormLoading = true;
          let timeDisabled = 3;
          Swal.fire({
            type: 'question',
            title: this.translate.instant('Survey_S1.TITLE'),
            html: this.translate.instant('Survey_S1.TEXT', { titles: this.title.short_name, classes: this.selectedClassName }),
            showCancelButton: true,
            confirmButtonText: this.translate.instant('Survey_S1.BUTTON1', { timer: timeDisabled }),
            cancelButtonText: this.translate.instant('Survey_S1.BUTTON2'),
            allowOutsideClick: false,
            onOpen: () => {
              Swal.disableConfirmButton();
              const confirmBtnRef = Swal.getConfirmButton();
              const intVal = setInterval(() => {
                timeDisabled -= 1;
                confirmBtnRef.innerText = this.translate.instant('Survey_S1.BUTTON1') + ` (${timeDisabled})`;
              }, 1000);
              this.timeOutVal = setTimeout(() => {
                confirmBtnRef.innerText = this.translate.instant('Survey_S1.BUTTON1');
                Swal.enableConfirmButton();
                clearInterval(intVal);
                clearTimeout(this.timeOutVal);
              }, timeDisabled * 1000);
            },
          }).then((result) => {
            if (result.value) {
              this.subs.sink = this.esService.updateESParameters(payload, this.esProcessId).subscribe(
                (resp) => {
                  if (resp.data) {
                    this.isFormLoading = false;
                    this.esService.isDataSavedStatus = true;
                    this.initialTable = _.cloneDeep(this.dataSource.data);
                    Swal.fire({
                      type: 'success',
                      title: this.translate.instant('Bravo'),
                    }).then((res) => {
                      this.initForm();
                      this.getDataResuslES();
                      this.getESData();
                      this.triggerRefresh.emit(true);            
                    });
                  } else {
                    this.isFormLoading = false;
                    if (resp.errors[0].message === 'Employability process name already exist') {
                      this.swalErrorNameExist();
                    } 

                  }
                },
                (err) => {
                  this.isFormLoading = false;
                },
              );
            } else {
              this.isFormLoading = false;
            }
          });
    }else{
      this.subs.sink = this.esService.updateESParameters(payload, this.esProcessId).subscribe(
        (resp) => {
          if (resp.data) {
            this.isFormLoading = false;
            this.esService.isDataSavedStatus = true;
            this.initialTable = _.cloneDeep(this.dataSource.data);
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo'),
            }).then((res) => {
              this.initForm();
              this.getDataResuslES();
              this.getESData();
              this.triggerRefresh.emit(true);            
            });
          } else {
            this.isFormLoading = false;
            if (resp.errors[0].message === 'Employability process name already exist') {
              this.swalErrorNameExist();
            } 

          }
        },
        (err) => {
          this.isFormLoading = false;
        },
      );
    }
   
  }

  swalErrorNameExist() {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('Uniquename_S2.TITLE'),
      text: this.translate.instant('Uniquename_S2.TEXT'),
      confirmButtonText: this.translate.instant('Uniquename_S2.BUTTON'),
    });
  }

  saveSilentProcess() {

    const payload = this.createPayload();


    this.isFormLoading = true;
    this.subs.sink = this.esService.updateESParameters(payload, this.esProcessId).subscribe(
      (resp) => {
        if (resp) {
          this.isFormLoading = false;
          this.esService.isDataSavedStatus = true;
          this.initialForm = _.cloneDeep(this.employabilitySurveyForm.value);
          this.initialTable = _.cloneDeep(this.dataSource.data);

          this.isFormLoading = false;
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo'),
          }).then((res) => {
            this.selectedIndexChange.emit(1);

          });
        }
      },
      (err) => {
        this.isFormLoading = false;
      },
    );
  }

  sendEStoStudent() {

    const payload = this.createPayload();


    this.isFormLoading = true;
    this.subs.sink = this.esService.updateESParameters(payload, this.esProcessId).subscribe(
      (resp) => {
        if (resp) {
          this.initialForm = _.cloneDeep(this.employabilitySurveyForm.value);
          this.isFormLoading = true;
          let timeDisabled = 3;
          Swal.fire({
            type: 'question',
            title: this.translate.instant('Survey_S1.TITLE'),
            html: this.translate.instant('Survey_S1.TEXT', { titles: this.title.short_name, classes: this.selectedClassName }),
            showCancelButton: true,
            confirmButtonText: this.translate.instant('Survey_S1.BUTTON1', { timer: timeDisabled }),
            cancelButtonText: this.translate.instant('Survey_S1.BUTTON2'),
            allowOutsideClick: false,
            onOpen: () => {
              Swal.disableConfirmButton();
              const confirmBtnRef = Swal.getConfirmButton();
              const intVal = setInterval(() => {
                timeDisabled -= 1;
                confirmBtnRef.innerText = this.translate.instant('Survey_S1.BUTTON1') + ` (${timeDisabled})`;
              }, 1000);
              this.timeOutVal = setTimeout(() => {
                confirmBtnRef.innerText = this.translate.instant('Survey_S1.BUTTON1');
                Swal.enableConfirmButton();
                clearInterval(intVal);
                clearTimeout(this.timeOutVal);
              }, timeDisabled * 1000);
            },
          }).then((result) => {
            if (result.value) {
              this.subs.sink = this.esService.sendEmployabilitySurvey(this.esProcessId, this.translate.currentLang).subscribe(
                (ressp) => {

                  this.isFormLoading = false;
                  this.esService.isDataSavedStatus = true;
                  this.initialForm = _.cloneDeep(this.employabilitySurveyForm.value);
                  this.initialTable = _.cloneDeep(this.dataSource.data);
                  Swal.fire({
                    type: 'success',
                    title: this.translate.instant('Bravo'),
                    text: this.translate.instant('ES_SENT_STUDENT'),
                  }).then((res) => {

                    this.selectedIndexChange.emit(1);
                    this.triggerRefresh.emit(true);                    
                  });
                },
                (err) => (this.isFormLoading = false),
              );
            } else {
              this.isFormLoading = false;
            }
          });
        }
      },
      (err) => {
        this.isFormLoading = false;
      },
    );
  }


  onChangeDateType(esIndex, value) {
    this.getESFormArray().at(esIndex).get('send_date').patchValue('');
    this.getESFormArray().at(esIndex).get('send_date_continuous').patchValue(null);
    this.getESFormArray().at(esIndex).get('expiration_date').patchValue('');
    this.getESFormArray().at(esIndex).get('expiration_date_continous').patchValue(null);

    if (this.dateTypeExpiration[esIndex]){
      if (value?.value) {
        this.getESFormArray().at(esIndex).get('expiration_date_type').patchValue(value?.value);
      }
    } else {
      this.getESFormArray().at(esIndex).get('expiration_date_type').patchValue('');
    }
    


    // switch (value.value) {
    //   case 'relative_date':
    //     this.getESFormArray().at(esIndex).get('send_date').clearValidators();
    //     this.getESFormArray().at(esIndex).get('send_date').setErrors(null);
    //     this.getESFormArray().at(esIndex).get('send_date_continuous').setValidators([Validators.required]);
    //     break;
    
    //   case 'exact_date':
    //     this.getESFormArray().at(esIndex).get('send_date_continuous').clearValidators();
    //     this.getESFormArray().at(esIndex).get('send_date_continuous').setErrors(null);
    //     this.getESFormArray().at(esIndex).get('send_date').setValidators([Validators.required]);
    //     break;
    // }
  }

  getSchoolListDropdown() {
    if (this.classData._id && this.classData._id) {
      this.loadingDropdown = true;
      this.subs.sink = this.schoolService.getschoolDropdownPCwithClass('preparation_center', this.classData._id).subscribe((schoolList) => {
        if (schoolList) {
          this.schoolList = _.cloneDeep(schoolList);
          this.filteredSchools = this.schoolFilter.valueChanges.pipe(
            startWith(''),
            map((searchTxt) =>
              this.schoolList
                .filter((option) => option.short_name.toLowerCase().includes(searchTxt.toLowerCase()))
                .sort((firstData, secondData) => {
                  if (
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.short_name)).toLowerCase() <
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.short_name)).toLowerCase()
                  ) {
                    return -1;
                  } else if (
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.short_name)).toLowerCase() >
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.short_name)).toLowerCase()
                  ) {
                    return 1;
                  } else {
                    return 0;
                  }
                }),
            ),
          );
          this.getDataQuestionaire();
        }
      });
    }
  }

  setSchoolFilter(value) {
    this.filteredValues.school = value;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.clearSelection();
      this.getDataResuslES();
    }
  }

  customFilterPredicate() {
    const self = this;
    return function (data, filter: string) {
      const searchString = JSON.parse(filter);

      const nameFound = searchString.studentName
        ? self
            .simpleDiacriticSensitiveRegex((data.student_id.last_name + ' ' + data.student_id.first_name).toString().trim().toLowerCase())
            .indexOf(self.simpleDiacriticSensitiveRegex(searchString.studentName.toLowerCase())) !== -1
        : true;

      const schoolId = searchString.schoolId ? data.student_id.school._id.indexOf(searchString.schoolId) !== -1 : true;

      const transcriptStatus =
        searchString.transcript_status !== 'All'
          ? searchString.transcript_status !== 'no_decision'
            ? data &&
              data.student_id &&
              data.student_id.final_transcript_id &&
              data.student_id.final_transcript_id.jury_decision_for_final_transcript === searchString.transcript_status
            : data &&
              data.student_id &&
              data.student_id.final_transcript_id &&
              (!data.student_id.final_transcript_id.jury_decision_for_final_transcript ||
                data.student_id.final_transcript_id.jury_decision_for_final_transcript === 'initial')
            ? true
            : false
          : true;

      const includeds =
        searchString.included !== 'All'
          ? searchString.included
            ? data.is_send_to_student.toString() === searchString.included
            : true
          : true;





      return nameFound && schoolId && transcriptStatus && includeds;
    };
  }

  simpleDiacriticSensitiveRegex(text: string): string {
    if (text) {
      return text
        .replace(/[a,á,à,ä]/g, 'a')
        .replace(/[e,é,ë,è]/g, 'e')
        .replace(/[i,í,ï,Î,î]/g, 'i')
        .replace(/[o,ó,ö,ò,ô]/g, 'o')
        .replace(/[u,ü,ú,ù]/g, 'u')
        .replace(/[ ,-]/g, ' ');
    } else {
      return '';
    }
  }

  selectTranscriptStatus(value) {
    this.filteredValues.final_transcript_result = value;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getDataResuslES();
    }
  }

  selectSendStudentStatus(value) {
    if (value !== 'All') {
      this.filteredValues.included = value;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getDataResuslES();
      }
    }
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.clearSelection();
    } else {
      this.isCheckedAll = true;
      this.userSelected = [];
      this.userSelectedId = [];
      this.getAllDataForCheckbox(0);
      // this.dataSource.data.forEach((row) => this.selection.select(row));
    }
  }

  getAllDataForCheckbox(pageNumber) {
    this.isWaitingForResponse = true;
    const pagination = {
      limit: 300,
      page: pageNumber,
    };
    const filter = this.cleanFilterData();
    this.subs.sink = this.esService
      .getAllEmployabilitySurveyProcessStudentsParameter(pagination, filter, this.sortValue, this.esProcessId)
      .subscribe(
        (result) => {
          if (result && result.length) {
            this.userSelected.push(...result);
            this.userSelected.forEach((element) => {
              if (element && element.student_id && element.student_id._id) this.userSelectedId.push(element.student_id._id);
            });
            const page = pageNumber + 1;
            this.getAllDataForCheckbox(page);
          } else {
            this.isWaitingForResponse = false;
            if (this.isCheckedAll) {
              if (this.userSelected && this.userSelected.length) {
                this.userSelected.forEach((element) => {
                  this.selection.select(element.student_id._id);
                });
              }
            }
          }
        },
        (error) => {
          this.isWaitingForResponse = false;
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: error && error['message'] ? error['message'] : error,
            confirmButtonText: this.translate.instant('ok'),
          });
        },
      );
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows || numSelected > numRows;
  }

  showOptions(event, row, type) {
    if (this.selection.selected.length !== this.dataCount) {
      this.isCheckedAll = false;
    } else {
      this.isCheckedAll = true;
    }

    if (event && event.checked) {
      this.userSelected.push(row);
      this.userSelectedId.push(row.student_id._id);
    } else {
      this.userSelected = this.userSelected.filter((element) => element.student_id._id !== row.student_id._id);
      this.userSelectedId = this.userSelectedId.filter((element) => element !== row.student_id._id);
    }

    this.selectType = type;
    // const numSelected = this.selection.selected.length;
    // const data = this.selection.selected;
    // if (numSelected > 0) {
    //   this.disabledExport = false;
    // } else {
    //   this.disabledExport = true;
    // }
    // this.userSelected = [];
    // this.userSelectedId = [];
    // data.forEach((user) => {
    //   if (user && user.student_id) {
    //     this.userSelected.push(user);
    //     this.userSelectedId.push(user.student_id._id);
    //   }
    // });
  }

  updateIncludedToggle() {
    if (this.userSelectedId.length > 0) {
      const filteredData = [];
      if (!!this.dataSource.filter) {
        this.dataSource.filteredData.forEach((resp) => {
          filteredData.push(resp.student_id._id);
        });
        this.userSelectedId = filteredData;
      }
      const updatedData = this.dataSource.data;
      updatedData.map((res) => {
        if (res && res.student_id) {
          if (this.userSelectedId.includes(res.student_id._id)) {
            res.is_send_to_student = true;
          }
        }
      });
      this.triggerToggleSendSurveyToMultipleStudents();
      if (this.isCheckedAll) {
        this.isCheckedAll = false;
      }
      this.disabledExport = true;
      this.selection.clear();
    }
  }
  excludeStudents() {
    if (this.userSelectedId.length > 0) {
      const filteredData = [];
      if (!!this.dataSource.filter) {
        this.dataSource.filteredData.forEach((resp) => {
          filteredData.push(resp.student_id._id);
        });
        this.userSelectedId = filteredData;
      }
      const updatedData = this.dataSource.data;
      updatedData.map((res) => {
        if (res && res.student_id) {
          if (this.userSelectedId.includes(res.student_id._id)) {
            res.is_send_to_student = false;
          }
        }
      });
      this.toggleExcludeSurveyToMultipleStudents();
      if (this.isCheckedAll) {
        this.isCheckedAll = false;
      }
      this.disabledExport = true;
      this.selection.clear();
    }
  }

  clearSelection() {
    this.selection.clear();
    this.isCheckedAll = false;
    this.userSelected = [];
    this.userSelectedId = [];
  }

  reset() {
    this.selection.clear();
    this.isCheckedAll = false;
    this.userSelected = [];
    this.userSelectedId = [];
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.filteredValues = {
      student_name: '',
      student_status: '',
      school: '',
      included: '',
      final_transcript_result: '',
      student_title_status: '',
    };
    this.studentNameFilter.setValue('', { emitEvent: false });
    this.studentStatusFilter.setValue('', { emitEvent: false });
    this.titleStatusFilterCtrl.setValue('', { emitEvent: false });
    this.transcriptResultFilter.setValue('', { emitEvent: false });
    this.schoolFilter.setValue('');
    this.includedFilter.setValue('', { emitEvent: false });

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    this.getDataResuslES();
  }

  checkExpirateDate(date) {
    let isPast = false;
    if (date) {
      const today = moment();
      const duration = moment(date).diff(today, 'days');
      if (duration >= 0) {
        isPast = false;
      } else {
        isPast = true;
      }
    } else {
      isPast = true;
    }
    return isPast;
  }

  isFormChanged() {
    const firstForm = JSON.stringify(this.initialForm);
    const form = JSON.stringify(this.employabilitySurveyForm.value);
    return _.isEqual(firstForm, form);
  }

  isStudentTableModifiedCheck() {
    const firstForm = JSON.stringify(this.initialTable);
    const form = JSON.stringify(this.dataSource.data);
    if (firstForm === form) {
      return true;
    } else {
      return false;
    }
  }

  onStudentIncludedToggle(element) {
    let student_id = element.student_id._id;
    let is_send_to_student = element.is_send_to_student;
    if (element && element.student_id) {
      this.subs.sink = this.esService.toggleSendSurveyToStudent(this.esProcessId, student_id, is_send_to_student).subscribe(
        (resp) => {

          this.getDataResuslES()
        },
        (err) => {
          this.isWaitingForResponse = false;

          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: 'OK',
          });
        },
      );
    }
  }

  isDataSaved() {
    return this.esService.isDataSavedStatus;
  }

  getFinalResultAfterReTake(result: string) {
    if (result === 'PASS1' || result === 'PASS2' || result === 'PASS3') {
      return 'PASS';
    } else if (result === 'FAILED' || result === 'ELIMINATED') {
      return 'FAILED';
    }
  }

  leave() {
    this.checkIfAnyChildrenFormInvalid();
  }

  checkIfAnyChildrenFormInvalid() {
    if (!this.esService.childrenFormValidationStatus) {
      this.fireUnsavedDataWarningSwal();
    } else {
      this.router.navigate(['/employability-survey']);
    }
  }

  fireUnsavedDataWarningSwal() {
    if (!this.published) {
      return Swal.fire({
        type: 'warning',
        title: this.translate.instant('GNS_S01.TITLE'),
        text: this.translate.instant('GNS_S01.TEXT'),
        confirmButtonText: this.translate.instant('GNS_S01.BUTTON 1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('GNS_S01.BUTTON 2'),
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((result) => {
        if (result.value) {
          // I will save first
          return;
        } else {
          // discard changes
          this.esService.childrenFormValidationStatus = true;
          this.router.navigate(['/employability-survey']);
        }
      });
    } else {
      // discard changes
      this.esService.childrenFormValidationStatus = true;
      this.router.navigate(['/employability-survey']);
    }
  }


  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  triggerToggleSendSurveyToMultipleStudents() {
    const filter = this.cleanFilterData();
    this.isWaitingForResponse = true;
    if (this.selectType === 'one' && this.userSelected.length) {
      this.subs.sink = this.esService.toggleSendSurveyToMultipleStudents(this.esProcessId, this.userSelectedId).subscribe(
        (list) => {
          if (list) {
            this.isWaitingForResponse = false;
            this.isSaveFromToggle = true;
            this.getDataResuslES()
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
    } else {
      this.subs.sink = this.esService.toggleSendSurveyToMultipleAllStudents(this.esProcessId, filter).subscribe(
        (list) => {
          if (list) {
            this.isWaitingForResponse = false;
            this.isSaveFromToggle = true;
            this.getDataResuslES()
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
  }

  toggleExcludeSurveyToMultipleStudents() {
    this.isWaitingForResponse = true;
    const filter = this.cleanFilterData();
    if (this.selectType === 'one' && this.userSelected.length) {
      this.subs.sink = this.esService.toggleExcludeSurveyToMultipleStudents(this.esProcessId, this.userSelectedId).subscribe(
        (list) => {
          if (list) {
            this.isWaitingForResponse = false;
            this.isSaveFromToggle = true;
            this.getDataResuslES()
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
    } else {
      this.subs.sink = this.esService.toggleExcludeSurveyToMultipleAllStudents(this.esProcessId, filter).subscribe(
        (list) => {
          if (list) {
            this.isWaitingForResponse = false;
            this.isSaveFromToggle = true;
            this.getDataResuslES()
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
  }

  checkSendDateContinuous(esIndex) {
    const sendDate = this.getESFormArray().at(esIndex).get('send_date_continuous').value;
    if (sendDate <= 0) {
      const sendDate = this.getESFormArray().at(esIndex).get('send_date_continuous').setValue(1);
    }
  }

  checkExpirationDateContinuous(esIndex) {
    const sendDate = this.getESFormArray().at(esIndex).get('expiration_date_continous').value;
    if (sendDate <= 0) {
      const sendDate = this.getESFormArray().at(esIndex).get('expiration_date_continous').setValue(1);
    }
  }

  fireValidationCheck() {
    if (this.isFormChanged()) {
      this.esService.childrenFormValidationStatus = true;
    } else {
      this.esService.childrenFormValidationStatus = false;
    }
  }

  checkValidationButtonSend() {
    let isDisabled = true;
    if (this.esData && this.esData.employability_surveys && this.esData.employability_surveys.length) {
      const esStatusSent = this.esData.employability_surveys.find((resp) => resp.is_already_sent === false);
      if (esStatusSent && !esStatusSent.is_already_sent) {
        isDisabled = false;
      } else {
        isDisabled = true;
      }
    }
    return isDisabled;
  }
}
