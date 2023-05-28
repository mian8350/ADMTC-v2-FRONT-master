import { Component, Input, OnDestroy, OnInit, ViewChild, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { CoreService } from 'app/service/core/core.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import * as moment from 'moment';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { EmployabilitySurveyService } from 'app/service/employability-survey/employability-survey.service';
import { Observable } from 'rxjs';
import { SchoolService } from 'app/service/schools/school.service';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import { SelectionModel } from '@angular/cdk/collections';
import { Router } from '@angular/router';

@Component({
  selector: 'ms-employability-survey-details-parameters',
  templateUrl: './employability-survey-details-parameters.component.html',
  styleUrls: ['./employability-survey-details-parameters.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class EmployabilitySurveyDetailsParametersComponent implements OnInit, OnDestroy, AfterViewInit {
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
  // Student Parameter Table
  dataSource = new MatTableDataSource([]);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatTable, { static: false }) table: MatTable<any>;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  displayedColumns: string[] = ['select', 'school', 'student', 'finalTranscripResult'];
  filterColumns: string[] = ['selectFilter', 'schoolFilter', 'studentFilter', 'finalTranscripResultFilter'];
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

  isFormLoading = false;

  enumValidatorList = ['no_validator', 'operator', 'certifier', 'academic_director'];
  validatorFiltered: string[][] = [];
  // End Parameter Form

  filteredValues = {
    student_name: '',
    school: '',
    included: '',
    final_transcript_result: '',
  };

  dataLoaded = false;
  studentList = [];
  studentNameFilter = new UntypedFormControl('');
  transcriptResultFilter = new UntypedFormControl('');
  includedFilter = new UntypedFormControl('');

  includedFilterList = [
    {
      name: 'All',
      value: 'AllM',
    },
    {
      name: 'Already Send To Student',
      value: 'already_sent_to_student',
    },
    {
      name: 'Not Send To Student yet',
      value: 'not_sent_to_student',
    },
  ];

  listTranscriptResult = [
    { name: 'All', value: 'AllM' },
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

  today = new Date();
  loadingDropdown = false;
  private timeOutVal: any;
  title: any;
  allResultData = [];
  isSaveFromToggle = false;
  comparisonToggle;
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
  ) {}

  ngOnInit() {







    if (this.esType !== 'continuous') {
      this.displayedColumns.push('included');
      this.filterColumns.push('includedFilter');
    }

    this.coreService.sidenavOpen = false;
    this.dataInit();
    this.getSchoolListDropdown();
    this.initFilter();

    this.subs.sink = this.translate.onLangChange.pipe().subscribe((lang) => {
      const tempES = _.cloneDeep(this.getESFormArray().value);
      if (tempES && tempES.length) {
        tempES.forEach((survey, surveyIndex) => {
          if (survey && survey.validator && this.enumValidatorList.includes(survey.validator)) {
            this.getESFormArray().at(surveyIndex).get('validator').patchValue(survey.validator, { emitEvent: true });
          }
        });
      }
    });
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
    this.sortValue = sort.active ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
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
    this.selection.clear();
    this.isWaitingForResponse = true;
    const filter = this.cleanFilterData();
    this.subs.sink = this.esService
      .getAllEmployabilitySurveyProcessStudentsParameter(pagination, filter, this.sortValue, this.esProcessId)
      .subscribe((result: any) => {

        if (result && result.length) {
          this.dataSource.data = result;
          this.paginator.length = result[0].count_document;
          this.dataCount = result[0].count_document;
          this.initialTable = _.cloneDeep(this.dataSource.data);
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
          this.getDataResuslES();
        }
      } else {
        this.studentNameFilter.setValue('');
        this.filteredValues.student_name = '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getDataResuslES();
        }
      }
    });
    this.subs.sink = this.transcriptResultFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.final_transcript_result = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getDataResuslES();
      }
    });
    this.subs.sink = this.includedFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.included = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getDataResuslES();
      }
    });
  }

  getESData() {
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
          this.initialForm = _.cloneDeep(this.employabilitySurveyForm.value);


          if (resp && resp.students) {
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
  }

  initESFormGroupOneTime() {
    return this.fb.group({
      _id: [null],
      is_already_sent: [false],
      questionnaire_template_id: [null, Validators.required],
      send_date: ['', Validators.required],
      send_time: ['23:59'],
      expiration_date: ['', Validators.required],
      expiration_time: ['23:59'],
      with_rejection_flow: [false],
      is_required_for_certificate: [false],
      validator: ['no_validator', Validators.required],
      // *************** If send_only_to_pass_student false, mean will send to all student
      send_only_to_pass_student: [false],
      // *************** If send_only_to_not_mention_continue_study false, mean will send to all student situation
      send_only_to_not_mention_continue_study: [false],
      students_already_sent: [[]],
    });
  }

  initESFormGroupContinuous() {
    return this.fb.group({
      _id: [null],
      is_already_sent: [false],
      questionnaire_template_id: [null, Validators.required],
      expiration_date: ['', Validators.required],
      expiration_time: ['23:59'],
      with_rejection_flow: [false],
      is_required_for_certificate: [false],
      send_date_continuous: ['', Validators.required],
      validator: ['no_validator', Validators.required],
      // *************** If send_only_to_pass_student false, mean will send to all student
      send_only_to_pass_student: [false],
      // *************** If send_only_to_not_mention_continue_study false, mean will send to all student situation
      send_only_to_not_mention_continue_study: [false],
      // *************** If is_send_es_if_prev_not_answered false, mean will send immediately on the send date set in the parameter
      is_send_es_if_prev_not_answered: [false],
      students_already_sent: [[]],
    });
  }

  getESFormArray(): UntypedFormArray {
    return this.employabilitySurveyForm.get('employability_surveys') as UntypedFormArray;
  }

  addESFormGroup() {

    if (this.esType && this.esType === 'one_time') {
      this.getESFormArray().push(this.initESFormGroupOneTime());
    } else {
      this.getESFormArray().push(this.initESFormGroupContinuous());
    }
    this.ESQuestionaireListFiltered.push(this.ESQuestionaireList);
    this.validatorFiltered.push(this.enumValidatorList);

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
        }
      });
    } else {
      this.getESFormArray().removeAt(esIndex);
    }
  }

  formatESData(rawData) {
    const formattedData = _.cloneDeep(rawData);
    if (formattedData && formattedData.employability_surveys && formattedData.employability_surveys.length) {
      formattedData.employability_surveys.forEach((esForm, esIndex) => {



        if (esIndex > 0 && !this.isSaveFromToggle) {
          this.addESFormGroup();
        }
        if (esForm && esForm.questionnaire_template_id && esForm.questionnaire_template_id._id) {
          esForm.questionnaire_template_id = esForm.questionnaire_template_id._id;
          this.displayFn(esForm.questionnaire_template_id);
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
        if (esForm.validator.validator) {
          this.displayValidator(esForm.validator.validator);
        }
        if (esForm.students_already_sent && esForm.students_already_sent.length) {
          esForm.students_already_sent = esForm.students_already_sent.map((object) => object._id);
        }
        esForm = _.omitBy(esForm, _.isNil);
      });
    }
    return formattedData;
  }

  getDataQuestionaire() {
    this.loadingDropdown = true;
    this.subs.sink = this.rncpTitleService.getQuestionaireES().subscribe(
      (resp) => {

        if (resp) {
          this.ESQuestionaireList = resp;
          this.ESQuestionaireList = this.ESQuestionaireList.sort((ESQuestionaireA, ESQuestionaireB) => {
            if (
              this.utilService.simplifyRegex(ESQuestionaireA.questionnaire_name) <
              this.utilService.simplifyRegex(ESQuestionaireB.questionnaire_name)
            ) {
              return -1;
            } else if (
              this.utilService.simplifyRegex(ESQuestionaireA.questionnaire_name) >
              this.utilService.simplifyRegex(ESQuestionaireB.questionnaire_name)
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
        ESQuestionaire = foundESQuestionaire.questionnaire_name;
      }
      return ESQuestionaire;
    }
  }

  dateSendUpdate(esIndex) {
    if (this.getESFormArray().at(esIndex).get('send_date').value && !this.getESFormArray().at(esIndex).get('send_time').value) {
      this.getESFormArray().at(esIndex).get('send_time').patchValue('23:59');
    }
  }

  dateExpUpdate(esIndex) {
    if (this.getESFormArray().at(esIndex).get('expiration_date').value && !this.getESFormArray().at(esIndex).get('expiration_time').value) {
      this.getESFormArray().at(esIndex).get('expiration_time').patchValue('23:59');
    }
  }

  createPayload() {
    const payload = _.cloneDeep(this.employabilitySurveyForm.value);
    if (payload.employability_surveys && payload.employability_surveys.length) {
      payload.employability_surveys.forEach((esForm) => {
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
      });
    }
    // if (this.dataSource && this.dataSource.data) {
    //   const students = _.cloneDeep(this.dataSource.data);
    //   if (students && students.length) {
    //     students.forEach((student) => {
    //       if (student && student.student_id && student.student_id._id) {
    //         student.student_id = student.student_id._id;
    //       }
    //     });
    //   }
    //   payload['students'] = students;
    // }
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
      if (this.esData && this.esData.employability_survey_type === 'one_time') {
        this.getESFormArray().at(esIndex).get('questionnaire_template_id').patchValue(esID._id);
      } else if (this.esData && this.esData.employability_survey_type === 'continuous') {
        if (esID.is_continue_study) {
          this.getESFormArray().at(esIndex).get('questionnaire_template_id').patchValue(esID._id);
        } else {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('TEMPLATE_ESX.TITLE'),
            text: this.translate.instant('TEMPLATE_ESX.TEXT'),
            confirmButtonText: this.translate.instant('TEMPLATE_ESX.BUTTON'),
          });
          this.getESFormArray().at(esIndex).get('questionnaire_template_id').patchValue(null);
        }
      }
    } else {
      this.getESFormArray().at(esIndex).get('questionnaire_template_id').patchValue(null);
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
    const searchString = this.getESFormArray().at(esIndex).get('questionnaire_template_id').value;
    if (searchString) {
      this.ESQuestionaireListFiltered[esIndex] = this.ESQuestionaireList.filter((es) => {


        return this.utilService.simplifyRegex(es.questionnaire_name).includes(this.utilService.simplifyRegex(searchString));
      });

    } else {
      this.ESQuestionaireListFiltered[esIndex] = this.ESQuestionaireList;

    }
  }

  filterValidator(esIndex) {
    const searchString = this.getESFormArray().at(esIndex).get('validator').value;
    if (searchString) {
      this.validatorFiltered[esIndex] = this.enumValidatorList.filter((val) => {
        return this.utilService
          .simplifyRegex(this.translate.instant('056_ES.validator_dropdown.' + val))
          .includes(this.utilService.simplifyRegex(searchString));
      });

    } else {
      this.validatorFiltered[esIndex] = this.enumValidatorList;

    }
  }

  saveValidator(esIndex, validator) {
    this.getESFormArray().at(esIndex).get('validator').patchValue(validator);

    if (validator === 'no_validator') {
      this.getESFormArray().at(esIndex).get('with_rejection_flow').patchValue(false);
    }
  }
  // end of dynamic form

  saveESProcess() {

    const payload = this.createPayload();


    this.isFormLoading = true;
    this.subs.sink = this.esService.updateESParameters(payload, this.esProcessId).subscribe(
      (resp) => {
        if (resp) {
          this.isFormLoading = false;
          this.esService.isDataSavedStatus = true;
          this.initialForm = _.cloneDeep(this.employabilitySurveyForm.value);
          this.initialTable = _.cloneDeep(this.dataSource.data);
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo'),
          }).then((res) => {
            this.initForm();
            this.getDataResuslES();
            this.getESData();
          });
        }
      },
      (err) => {
        this.isFormLoading = false;
      },
    );
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

  getSchoolListDropdown() {
    this.loadingDropdown = true;
    this.subs.sink = this.schoolService.getschoolAndCity().subscribe((schoolList) => {
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

  setSchoolFilter(value) {
    this.filteredValues.school = value;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
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
      this.selection.clear();
      this.isCheckedAll = false;
    } else {
      this.isCheckedAll = true;
      this.dataSource.data.forEach((row) => this.selection.select(row));
    }
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  showOptions(info) {
    this.selectType = info;
    const numSelected = this.selection.selected.length;
    const data = this.selection.selected;
    if (numSelected > 0) {
      this.disabledExport = false;
    } else {
      this.disabledExport = true;
    }
    this.userSelected = [];
    this.userSelectedId = [];
    data.forEach((user) => {
      if (user && user.student_id) {
        this.userSelected.push(user);
        this.userSelectedId.push(user.student_id._id);
      }
    });
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

  reset() {
    this.selection.clear();
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.filteredValues = {
      student_name: '',
      school: '',
      included: '',
      final_transcript_result: '',
    };
    this.studentNameFilter.setValue('', { emitEvent: false });
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
    // if (firstForm === form) {
    //   return true;
    // } else {
    //   return false;
    // }
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

          if (resp) {
            this.isSaveFromToggle = true;
            this.getESData();
          }
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
    this.router.navigate(['/employability-survey']);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  triggerToggleSendSurveyToMultipleStudents() {
    const filter = this.cleanFilterData();
    if (this.selectType === 'one' && this.userSelected.length) {
      this.subs.sink = this.esService.toggleSendSurveyToMultipleStudents(this.esProcessId, this.userSelectedId).subscribe(
        (list) => {
          if (list) {
            this.isSaveFromToggle = true;
            this.getESData();
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
            this.isSaveFromToggle = true;
            this.getESData();
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
