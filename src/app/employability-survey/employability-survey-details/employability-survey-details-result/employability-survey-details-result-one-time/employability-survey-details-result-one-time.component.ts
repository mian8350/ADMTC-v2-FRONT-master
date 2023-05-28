import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { EmployabilitySurveyService } from 'app/service/employability-survey/employability-survey.service';
import { ExportCsvService } from 'app/service/export-csv/export-csv.service';
import { SchoolService } from 'app/service/schools/school.service';
import { StudentsService } from 'app/service/students/students.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { Observable } from 'rxjs';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { EmployabilitySurveyDetailsResultExportComponent } from '../employability-survey-details-result-export/employability-survey-details-result-export.component';
import { Router } from '@angular/router';
import { AuthService } from 'app/service/auth-service/auth.service';

@Component({
  selector: 'ms-employability-survey-details-result-one-time',
  templateUrl: './employability-survey-details-result-one-time.component.html',
  styleUrls: ['./employability-survey-details-result-one-time.component.scss'],
  providers: [ParseStringDatePipe, ParseUtcToLocalPipe],
})
export class EmployabilitySurveyDetailsResultOneTimeComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() esProcessId: '';
  @Input() esType: '';
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  private subs = new SubSink();
  selection = new SelectionModel(true, []);
  dataSource = new MatTableDataSource([]);
  displayedColumns = ['select', 'school', 'student', 'studentStatus','titleStatus','finalTranscripResult', 'status', 'action'];
  filterColumns = [
    'selectFilter',
    'schoolFilter',
    'studentFilter',
    'studentStatusFilter',
    'titleStatusFilter',
    'finalTranscripResultFilter',
    'statusFilter',
    'actionFilter',
  ];

  isLoading;

  selectType;
  userSelected = [];
  userSelectedId = [];

  studentData;
  esData;
  selectedStudentId;
  selectedSchoolId;
  disabledExport = true;
  exportName: 'Export';
  userForExport: any[];
  allStudentForExport = [];

  dataCount;
  noData: any;
  currentLang: any;

  filteredValues = {
    school: '',
    student_name: '',
    latest_survey_status: '',
    student_title_status: '',
    es_id: '',
    student_status: '',
    final_transcript_result: '',
  };
  isReset = false;
  studentStatusFilter = new UntypedFormControl('');
  statusFilter = new UntypedFormControl('');
  transcriptResultFilter = new UntypedFormControl('');
  studentNameFilter = new UntypedFormControl('');
  schoolFilter = new UntypedFormControl('');
  titleStatusFilterCtrl = new UntypedFormControl('');
  filteredSchools: Observable<any[]>;
  schoolList = [];
  surveyType = '';
  surveyName = '';

  studentStatusFilterList = ['AllM', 'active', 'pending', 'incorrect_email'];
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
  listTranscriptResult = [
    { name: 'Eliminated', value: 'eliminated' },
    { name: 'Initial', value: 'initial' },
    { name: 'Passed', value: 'pass' },
    { name: 'Failed', value: 'failed' },
    { name: 'Re-Take', value: 'retaking' },
  ];

  statusFilterList = [
    {
      name: 'All',
      value: 'AllM',
    },
    {
      name: 'not_sent',
      value: 'not_sent',
    },
    {
      name: 'sent_to_student',
      value: 'sent_to_student',
    },
    {
      name: 'completed_by_student',
      value: 'completed_by_student',
    },
    {
      name: 'rejected_by_validator',
      value: 'rejected_by_validator',
    },
    {
      name: 'validated_by_validator',
      value: 'validated_by_validator',
    },
  ];

  sortValue = null;
  dataLoaded = false;
  allResultData = [];
  isCheckedAll = false;
  isWaitingForResponse = false;
  isExport = false;
  studentPrevCourseData = null;
  constructor(
    private esService: EmployabilitySurveyService,
    private utilService: UtilityService,
    private schoolService: SchoolService,
    private translate: TranslateService,
    private exportCsvService: ExportCsvService,
    private dialog: MatDialog,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // this.dataSource.data = this.dummy;
    this.getSchoolListDropdown();
    this.initFilter();
    this.getDataResultES();
    this.checkEmplyabilitySurveyType();
    this.currentLang = this.translate.currentLang.toLowerCase();
    this.sortFilterDropdown();
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (!this.isReset) {
            this.getDataResultES();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
  }

  sortFilterDropdown() {
    this.studentStatusFilterList = _.sortBy(this.studentStatusFilterList);
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
    })
  }

  sortData(sort: Sort) {
    this.sortValue = sort.active ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getDataResultES();
      }
    }
  }

  getDataResultES() {
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    // if (this.selectType === 'one') {
    //   this.selection.clear();
    // }
    this.isLoading = true;
    const filter = this.cleanFilterData();
    const is_for_one_time = true
    this.subs.sink = this.esService
      .getAllEmployabilitySurveyProcessStudentsResult(pagination, filter, this.sortValue, this.esProcessId, is_for_one_time)
      .subscribe((result: any) => {

        if (result && result.length) {
          this.dataSource.data = result;
          this.paginator.length = result[0].count_document;
          this.dataCount = result[0].count_document;

        } else {
          this.dataSource.data = [];
          this.paginator.length = 0;
          this.dataCount = 0;
        }
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
        this.isReset = false;
        this.isLoading = false;

        // *************** If the selection is all selected, then when we change page, we also need to select all the entry also
        if (this.selectType === 'all') {
          // We clear first so selection does not contain previous selection after change page
          this.selection.clear();
          this.dataSource.data.forEach((row) => this.selection.select(row));
        }
      });
  }

  checkEmplyabilitySurveyType() {
    this.subs.sink = this.esService.checkEmplyabilitySurveyType(this.esProcessId).subscribe((resp) => {
      if (resp) {
        this.surveyType = resp.employability_survey_type;
      }
    });
  }

  cleanFilterData(forExport?: boolean) {
    const filterData = _.cloneDeep(this.filteredValues);
    let filterQuery = '';
    Object.keys(filterData).forEach((key) => {
      // only add key that has value to the query. so it wont send filter with empty string
      if (filterData[key]) {
        if (key === 'student_name' || key === 'school' || key === 'es_id') {
          filterQuery = filterQuery + ` ${key}:"${filterData[key]}"`;
        } else {
          filterQuery = filterQuery + ` ${key}:${filterData[key]}`;
        }
      }
    });

    if (forExport) {
      filterQuery = filterQuery + ` included:already_sent_to_student`;
    }
    // filterQuery = filterQuery + ` included:already_sent_to_student`;
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
          this.getDataResultES();
        }
      } else {
        this.studentNameFilter.setValue('');
        this.filteredValues.student_name = '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.clearSelection();
          this.getDataResultES();
        }
      }
    });

    this.subs.sink = this.studentStatusFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.student_status = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.clearSelection();
        this.getDataResultES();
      }
    });
    
    this.subs.sink = this.transcriptResultFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.final_transcript_result = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.clearSelection();
        this.getDataResultES();
      }
    });
    
    this.subs.sink = this.statusFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.latest_survey_status = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.clearSelection();
        this.getDataResultES();
      }
    });
    this.subs.sink = this.titleStatusFilterCtrl.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.student_title_status = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.clearSelection();
        this.getDataResultES();
      }
    });
  }

  previewES(student) {

    if (student && student.student_id && student.student_id.school) {
      this.selectedStudentId = student.student_id._id;
      this.selectedSchoolId = student.employability_surveys[0]?.school_id?._id;
      // We need to pass the title and class id here so preview can display the tab IF student ES in prev course
      this.studentPrevCourseData = {
        rncp_title: {
          _id: this.selectedRncpTitleId,
        },
        current_class: {
          _id: this.selectedClassId,
        },
      };
    } else {
      this.selectedStudentId = null;
      this.selectedSchoolId = null;
      this.studentPrevCourseData = null;
    }



  }

  leave() {
    this.router.navigate(['/employability-survey']);
  }

  showOptions(event, row, type) {
    if(this.selection.selected.length !== this.dataCount) {
      this.isCheckedAll = false;
    } else {
      this.isCheckedAll = true;
    }


    if(event && event.checked) {
      this.userSelected.push(row);
      this.userSelectedId.push(row.student_id._id);
    } else {
      this.userSelected = this.userSelected.filter((element) => element.student_id._id !== row.student_id._id);
      this.userSelectedId = this.userSelectedId.filter((element) => element !== row.student_id._id);
    }

    this.selectType = type;

    const numSelected = this.selection.selected.length;
    if (numSelected > 0) {
      this.disabledExport = false;
    } else {
      this.disabledExport = true;
    }

    // if (info === 'all') {
    //   // this.getAllDataResult(0);
    // } else {
    //   this.selectType = info;
    // }
    // const data = this.selection.selected;
    // this.userSelected = [];
    // this.userSelectedId = [];
    // data.forEach((user) => {
    //   this.userSelected.push(user);
    //   this.userSelectedId.push(user.student_id._id);
    // });
  }

  masterToggle(event) {
    if (this.isAllSelected() || this.isExport) {
      event.source.checked = false;
      this.clearSelection();
    } else {
      this.isCheckedAll = true;
      this.userSelected = [];
      this.userSelectedId = [];
      this.getAllDataForCheckbox(0);
    }
  }

  getAllDataForCheckbox(pageNumber) {
    this.isLoading = true;
    const pagination = {
      limit: 300,
      page: pageNumber
    };
    const forExport = true;
    const is_for_one_time = true;
    const filter = this.cleanFilterData(forExport);
    this.subs.sink = this.esService
      .getAllEmployabilitySurveyProcessStudentsResult(pagination, filter, this.sortValue, this.esProcessId, is_for_one_time)
      .subscribe((result) => {
      if(result && result.length) {
        this.userSelected.push(...result);
        this.userSelected.forEach((element) => { 
          if(element && element.student_id && element.student_id._id ) 
            this.userSelectedId.push(element.student_id._id) 
          });
        const page = pageNumber + 1;
        this.getAllDataForCheckbox(page);
      } else {
        this.isLoading = false;
        if(this.isCheckedAll) {
          this.isExport = true;
          if(this.userSelected && this.userSelected.length){
            this.userSelected.forEach(element => {
              this.selection.select(element.student_id._id);
            });
          }
        }
      }
      },
      (error) => {
        this.isLoading = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: error && error['message'] ? error['message'] : error,
          confirmButtonText: this.translate.instant('ok'),
        });
      });
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows || numSelected > numRows;
  }

  checkboxLabel(element?): string {
    if (!element) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(element) ? 'deselect' : 'select'} row ${element.position + 1}`;
  }

  clearSelection() {
    this.selection.clear();
    this.isCheckedAll = false;
    this.userSelected = [];
    this.userSelectedId = [];
    this.isExport = false;
  }

  reset() {
    this.isExport = false;
    this.isCheckedAll = false;
    this.selectType = null;
    this.selection.clear();
    this.userSelected = [];
    this.userSelectedId = [];
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.filteredValues = {
      school: '',
      student_name: '',
      latest_survey_status: '',
      student_title_status: '',
      es_id: '',
      student_status: '',
      final_transcript_result: '',
    };
    this.statusFilter.setValue('', { emitEvent: false });
    this.studentNameFilter.setValue('', { emitEvent: false });
    this.schoolFilter.setValue('', { emitEvent: false });
    this.titleStatusFilterCtrl.setValue('', { emitEvent: false });
    this.studentStatusFilter.setValue('', { emitEvent: false });
    this.transcriptResultFilter.setValue('', { emitEvent: false });

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    this.getDataResultES();
  }

  setSchoolFilter(value) {
    this.filteredValues.school = value;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.clearSelection();
      this.getDataResultES();
    }
  }

  getSchoolListDropdown() {
    this.subs.sink = this.schoolService.getSchoolsBySchoolTypeandClass('preparation_center', this.selectedClassId).subscribe((schoolList) => {
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
      }
    });
  }

  // selectStatus(value) {
  //   if (value && value !== 'All') {
  //     this.filteredValues.latest_survey_status = value;
  //     this.dataSource.filter = JSON.stringify(this.filteredValues);
  //   } else {
  //     if (this.filteredValues.latest_survey_status) {
  //       delete this.filteredValues.latest_survey_status;
  //       this.dataSource.filter = JSON.stringify(this.filteredValues);
  //     }
  //   }
  // }

  exportData() {
    Swal.close();
    const data = [];
    const questions = [];

    if (this.selectType === 'one' && this.userSelectedId.length) {
      this.isLoading = true;
      this.subs.sink = this.esService.getEmployabilitySurveyCSV(this.esProcessId, this.userSelectedId).subscribe((resp) => {
        this.isLoading = false;
        if (resp && resp.length && resp[0].student_responses && resp[0].student_responses.length) {
          if (
            resp[0].student_responses[0].questionnaire_response_id &&
            resp[0].student_responses[0].questionnaire_response_id.competence &&
            resp[0].student_responses[0].questionnaire_response_id.competence.length
          ) {
            resp[0].student_responses[0].questionnaire_response_id.competence.forEach((competence) => {
              if (competence && competence.segment && competence.segment.length) {
                competence.segment.forEach((segment) => {
                  if (segment && segment.question && segment.question.length) {
                    segment.question.forEach((question) => {
                      if (question && question.questionnaire_field_key) {
                        questions.push(this.translate.instant('QUESTIONNAIRE_FIELDS.' + question.questionnaire_field_key));
                      } else if (question && question.question_name) {
                        questions.push(question.question_name);
                      }
                    });
                  }
                });
              }
            });
            if (questions && questions.length) {
              const objQuestions = [];
              let count = 0;
              questions.forEach((question) => {
                objQuestions[8 + count] = question;
                count++;
              });
              data.push(objQuestions);
            }
          }
          resp[0].student_responses.forEach((item) => {
            const obj = [];
            const finalTranscript = this.finalTranscriptStatus(item.student_id);
            // TODO: From the template get the data location and add the data
            // TEMPLATE CSV: https://docs.google.com/spreadsheets/d/1f0cE3dQjaJ-_3rVO6mi8GcuXTBQiO1KWl-A9gRryAkU/edit#gid=0
            obj[0] = item.rncp_id ? item.rncp_id.short_name : '-';
            obj[1] = item.class_id ? item.class_id.name : '-';
            obj[2] = item.school_id ? item.school_id.short_name : '-';
            obj[3] = item.student_id ? this.translate.instant(item.student_id.civility) : '-';
            obj[4] = item.student_id ? item.student_id.first_name : '-';
            obj[5] = item.student_id ? item.student_id.last_name : '-';
            obj[6] = item.student_id ? item.student_id.email : '-';
            obj[7] = finalTranscript ? finalTranscript : '-';
            if (
              item.questionnaire_response_id &&
              item.questionnaire_response_id.competence &&
              item.questionnaire_response_id.competence.length
            ) {
              const answerResponse = [];
              item.questionnaire_response_id.competence.forEach((competence) => {
                if (competence && competence.segment && competence.segment.length) {
                  competence.segment.forEach((segment) => {
                    if (segment && segment.question && segment.question.length) {
                      segment.question.forEach((question) => {
                        if (question && question.questionnaire_field_key) {
                          answerResponse.push(question.answer ? this.utilService.cleanHTML(question.answer) : '-');
                        } else if (question && question.question_name) {
                          answerResponse.push(question.answer ? this.utilService.cleanHTML(question.answer) : '-');
                        }
                      });
                    }
                  });
                }
              });

              if (answerResponse && answerResponse.length) {
                let count = 0;
                answerResponse.forEach((question) => {
                  obj[8 + count] = question;
                  count++;
                });
              }
            }
            data.push(obj);
          });

          const valueRange = { values: data };
          const today = moment().format('DD-MM-YYYY');
          const title = this.exportName + '_' + today;
          const sheetID = this.translate.currentLang === 'en' ? 1169011143 : 1862776450;
          const sheetData = {
            spreadsheetId: '1eciie67KearY2OWA_XqqfqdxhpTWy8px1nNIPNK4_mE',
            sheetId: sheetID,
            range: 'A6',
          };
          this.exportCsvService.executeSurveySheetOneTimes(valueRange, title, sheetData);
        }
      });
    } else {
      this.allStudentForExport = [];
      this.exportAllData();
    }
  }

  exportAllData() {
    // const exportData = this.dataSource.data.map((list) => list.student_id._id);
    this.isLoading = true;
    const filter = this.cleanFilterData();
    this.subs.sink = this.esService
      .getAllEmployabilitySurveyProcessStudentsResultIDs(filter, this.sortValue, this.esProcessId)
      .subscribe((studentIds) => {
        const exportData = studentIds.map((student) => student.student_id._id);
        this.subs.sink = this.esService.getEmployabilitySurveyCSV(this.esProcessId, exportData).subscribe((resp) => {
          const data = [];
          this.isLoading = false;
          const questions = [];
          if (resp && resp.length && resp[0].student_responses && resp[0].student_responses.length) {
            if (
              resp[0].student_responses[0].questionnaire_response_id &&
              resp[0].student_responses[0].questionnaire_response_id.competence &&
              resp[0].student_responses[0].questionnaire_response_id.competence.length
            ) {
              resp[0].student_responses[0].questionnaire_response_id.competence.forEach((competence) => {
                if (competence && competence.segment && competence.segment.length) {
                  competence.segment.forEach((segment) => {
                    if (segment && segment.question && segment.question.length) {
                      segment.question.forEach((question) => {
                        if (question && question.questionnaire_field_key) {
                          questions.push(this.translate.instant('QUESTIONNAIRE_FIELDS.' + question.questionnaire_field_key));
                        } else if (question && question.question_name) {
                          questions.push(question.question_name);
                        }
                      });
                    }
                  });
                }
              });
              if (questions && questions.length) {
                const objQuestions = [];
                let count = 0;
                questions.forEach((question) => {
                  objQuestions[8 + count] = question;
                  count++;
                });
                data.push(objQuestions);
              }
            }
            resp[0].student_responses.forEach((item) => {
              const obj = [];
              const finalTranscript = this.finalTranscriptStatus(item.student_id);
              // TODO: From the template get the data location and add the data
              // TEMPLATE CSV: https://docs.google.com/spreadsheets/d/1f0cE3dQjaJ-_3rVO6mi8GcuXTBQiO1KWl-A9gRryAkU/edit#gid=0
              obj[0] = item.rncp_id ? item.rncp_id.short_name : '-';
              obj[1] = item.class_id ? item.class_id.name : '-';
              obj[2] = item.school_id ? item.school_id.short_name : '-';
              obj[3] = item.student_id ? this.translate.instant(item.student_id.civility) : '-';
              obj[4] = item.student_id ? item.student_id.first_name : '-';
              obj[5] = item.student_id ? item.student_id.last_name : '-';
              obj[6] = item.student_id ? item.student_id.email : '-';
              obj[7] = finalTranscript ? finalTranscript : '-';
              if (
                item.questionnaire_response_id &&
                item.questionnaire_response_id.competence &&
                item.questionnaire_response_id.competence.length
              ) {
                const answerResponse = [];
                item.questionnaire_response_id.competence.forEach((competence) => {
                  if (competence && competence.segment && competence.segment.length) {
                    competence.segment.forEach((segment) => {
                      if (segment && segment.question && segment.question.length) {
                        segment.question.forEach((question) => {
                          if (question && question.questionnaire_field_key) {
                            answerResponse.push(question.answer ? this.utilService.cleanHTML(question.answer) : '-');
                          } else if (question && question.question_name) {
                            answerResponse.push(question.answer ? this.utilService.cleanHTML(question.answer) : '-');
                          }
                        });
                      }
                    });
                  }
                });

                if (answerResponse && answerResponse.length) {
                  let count = 0;
                  answerResponse.forEach((question) => {
                    obj[8 + count] = question;
                    count++;
                  });
                }
              }
              data.push(obj);
            });

            const valueRange = { values: data };
            const today = moment().format('DD-MM-YYYY');
            const title = this.exportName + '_' + today;
            const sheetID = this.translate.currentLang === 'en' ? 1169011143 : 1862776450;
            const sheetData = {
              spreadsheetId: '1eciie67KearY2OWA_XqqfqdxhpTWy8px1nNIPNK4_mE',
              sheetId: sheetID,
              range: 'A6',
            };
            this.exportCsvService.executeSurveySheetOneTimes(valueRange, title, sheetData);
          }
        });
      });
  }

  exportDataContinues() {
    Swal.close();
    const parentData = [];
    const data = [];
    const questions = [];

    if (this.selectType === 'one' && this.userSelectedId.length) {
      this.isLoading = true;
      this.subs.sink = this.esService.getEmployabilitySurveyCSV(this.esProcessId, this.userSelectedId).subscribe((resp) => {
        this.isLoading = false;
        if (resp && resp.length && resp[0].student_responses && resp[0].student_responses.length) {
          if (
            resp[0].student_responses[0].questionnaire_response_id &&
            resp[0].student_responses[0].questionnaire_response_id.competence &&
            resp[0].student_responses[0].questionnaire_response_id.competence.length
          ) {
            resp[0].student_responses[0].questionnaire_response_id.competence.forEach((competence) => {
              if (competence && competence.segment && competence.segment.length) {
                competence.segment.forEach((segment) => {
                  if (segment && segment.question && segment.question.length) {
                    segment.question.forEach((question) => {
                      if (question && question.questionnaire_field_key) {
                        questions.push(this.translate.instant('QUESTIONNAIRE_FIELDS.' + question.questionnaire_field_key));
                      } else if (question && question.question_name) {
                        questions.push(question.question_name);
                      }
                    });
                  }
                });
              }
            });
            if (questions && questions.length) {
              const objQuestions = [];
              let count = 0;
              questions.forEach((question) => {
                objQuestions[8 + count] = question;
                count++;
              });
              data.push(objQuestions);
            }
          }
          resp.forEach((es, inEs) => {
            es.student_responses.forEach((item) => {
              const obj = [];
              const finalTranscript = this.finalTranscriptStatus(item.student_id);
              // TODO: From the template get the data location and add the data
              // TEMPLATE CSV: https://docs.google.com/spreadsheets/d/1f0cE3dQjaJ-_3rVO6mi8GcuXTBQiO1KWl-A9gRryAkU/edit#gid=0
              obj[0] = item.rncp_id ? item.rncp_id.short_name : '-';
              obj[1] = item.class_id ? item.class_id.name : '-';
              obj[2] = item.school_id ? item.school_id.short_name : '-';
              obj[3] = item.student_id ? this.translate.instant(item.student_id.civility) : '-';
              obj[4] = item.student_id ? item.student_id.first_name : '-';
              obj[5] = item.student_id ? item.student_id.last_name : '-';
              obj[6] = item.student_id ? item.student_id.email : '-';
              obj[7] = finalTranscript ? finalTranscript : '-';
              if (
                item.questionnaire_response_id &&
                item.questionnaire_response_id.competence &&
                item.questionnaire_response_id.competence.length
              ) {
                const answerResponse = [];
                item.questionnaire_response_id.competence.forEach((competence) => {
                  if (competence && competence.segment && competence.segment.length) {
                    competence.segment.forEach((segment) => {
                      if (segment && segment.question && segment.question.length) {
                        segment.question.forEach((question) => {
                          if (question && question.questionnaire_field_key) {
                            answerResponse.push(question.answer ? this.utilService.cleanHTML(question.answer) : '-');
                          } else if (question && question.question_name) {
                            answerResponse.push(question.answer ? this.utilService.cleanHTML(question.answer) : '-');
                          }
                        });
                      }
                    });
                  }
                });

                if (answerResponse && answerResponse.length) {
                  let count = 0;
                  answerResponse.forEach((question) => {
                    obj[8 + count] = question;
                    count++;
                  });
                }
              }
              data.push(obj);
            });
            parentData[inEs] = data;
          });

          const valueRange = { values: parentData };
          const today = moment().format('DD-MM-YYYY');
          const title = this.exportName + '_' + today;
          const sheetID = this.translate.currentLang === 'en' ? 1169011143 : 1862776450;
          const sheetData = {
            spreadsheetId: '1eciie67KearY2OWA_XqqfqdxhpTWy8px1nNIPNK4_mE',
            sheetId: sheetID,
            range: 'A6',
          };
          this.exportCsvService.executeSurveySheetContinues(valueRange, title, sheetData, this.surveyName);
        }
      });
    } else {
      this.allStudentForExport = [];
      this.exportAllDataContinues();
    }
  }

  exportAllDataContinues() {
    // const exportData = this.dataSource.data.map((list) => list.student_id._id);
    this.isLoading = true;
    const filter = this.cleanFilterData();
    this.subs.sink = this.esService
      .getAllEmployabilitySurveyProcessStudentsResultIDs(filter, this.sortValue, this.esProcessId)
      .subscribe((studentIds) => {
        const exportData = studentIds.map((student) => student.student_id._id);
        this.subs.sink = this.esService.getEmployabilitySurveyCSV(this.esProcessId, exportData).subscribe((resp) => {
          const parentData = [];
          const data = [];
          this.isLoading = false;
          const questions = [];
          if (resp && resp.length && resp[0].student_responses && resp[0].student_responses.length) {
            if (
              resp[0].student_responses[0].questionnaire_response_id &&
              resp[0].student_responses[0].questionnaire_response_id.competence &&
              resp[0].student_responses[0].questionnaire_response_id.competence.length
            ) {
              resp[0].student_responses[0].questionnaire_response_id.competence.forEach((competence) => {
                if (competence && competence.segment && competence.segment.length) {
                  competence.segment.forEach((segment) => {
                    if (segment && segment.question && segment.question.length) {
                      segment.question.forEach((question) => {
                        if (question && question.questionnaire_field_key) {
                          questions.push(this.translate.instant('QUESTIONNAIRE_FIELDS.' + question.questionnaire_field_key));
                        } else if (question && question.question_name) {
                          questions.push(question.question_name);
                        }
                      });
                    }
                  });
                }
              });
              if (questions && questions.length) {
                const objQuestions = [];
                let count = 0;
                questions.forEach((question) => {
                  objQuestions[8 + count] = question;
                  count++;
                });
                data.push(objQuestions);
              }
            }
            resp.forEach((es, inEs) => {
              es.student_responses.forEach((item) => {
                const obj = [];
                const finalTranscript = this.finalTranscriptStatus(item.student_id);
                // TODO: From the template get the data location and add the data
                // TEMPLATE CSV: https://docs.google.com/spreadsheets/d/1f0cE3dQjaJ-_3rVO6mi8GcuXTBQiO1KWl-A9gRryAkU/edit#gid=0
                obj[0] = item.rncp_id ? item.rncp_id.short_name : '-';
                obj[1] = item.class_id ? item.class_id.name : '-';
                obj[2] = item.school_id ? item.school_id.short_name : '-';
                obj[3] = item.student_id ? this.translate.instant(item.student_id.civility) : '-';
                obj[4] = item.student_id ? item.student_id.first_name : '-';
                obj[5] = item.student_id ? item.student_id.last_name : '-';
                obj[6] = item.student_id ? item.student_id.email : '-';
                obj[7] = finalTranscript ? finalTranscript : '-';
                if (
                  item.questionnaire_response_id &&
                  item.questionnaire_response_id.competence &&
                  item.questionnaire_response_id.competence.length
                ) {
                  const answerResponse = [];
                  item.questionnaire_response_id.competence.forEach((competence) => {
                    if (competence && competence.segment && competence.segment.length) {
                      competence.segment.forEach((segment) => {
                        if (segment && segment.question && segment.question.length) {
                          segment.question.forEach((question) => {
                            if (question && question.questionnaire_field_key) {
                              answerResponse.push(question.answer ? this.utilService.cleanHTML(question.answer) : '-');
                            } else if (question && question.question_name) {
                              answerResponse.push(question.answer ? this.utilService.cleanHTML(question.answer) : '-');
                            }
                          });
                        }
                      });
                    }
                  });

                  if (answerResponse && answerResponse.length) {
                    let count = 0;
                    answerResponse.forEach((question) => {
                      obj[8 + count] = question;
                      count++;
                    });
                  }
                }
                data.push(obj);
              });
              parentData[inEs] = data;
            });

            const valueRange = { values: parentData };
            const today = moment().format('DD-MM-YYYY');
            const title = this.exportName + '_' + today;
            const sheetID = this.translate.currentLang === 'en' ? 1169011143 : 1862776450;
            const sheetData = {
              spreadsheetId: '1eciie67KearY2OWA_XqqfqdxhpTWy8px1nNIPNK4_mE',
              sheetId: sheetID,
              range: 'A6',
            };
            this.exportCsvService.executeSurveySheetContinues(valueRange, title, sheetData, this.surveyName);
          }
        });
      });
  }

  SendEmployabilitySurvey(student) {
    if (student && student.student_id && student.student_id.school) {
      const student_id = student.student_id._id;

      this.isWaitingForResponse = true;
      this.subs.sink = this.esService.sendEmployabilitySurvey_N4(student_id, this.esProcessId).subscribe(
        (resp) => {
          this.isWaitingForResponse = false

          this.isLoading = false;
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        },
        (err) => {
          this.isWaitingForResponse = false;

          const error = err && err.stack ? JSON.stringify(err.stack) : err;
          this.authService.postErrorLog(error);
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

  finalTranscriptStatus(item) {
    let finalTranscriptStatus = '';

    if (item.final_transcript_id && item.final_transcript_id.jury_decision_for_final_transcript) {
      if (item.final_transcript_id.jury_decision_for_final_transcript === 'retaking') {
        if (!item.final_transcript_id.after_final_retake_decision) {
          if (item.final_transcript_id.student_decision === 'retaking' || item.final_transcript_id.student_decision === '') {
            finalTranscriptStatus = this.translate.instant('FINAL_TRANSCRIPT.RETAKE');
          } else if (item.final_transcript_id.student_decision === 'failed') {
            finalTranscriptStatus = this.translate.instant('FINAL_TRANSCRIPT.FINAL_RESULT_FAIL');
          }
        }
        if (item.final_transcript_id.after_final_retake_decision) {
          if (!item.final_transcript_id.has_jury_finally_decided) {
            if (item.final_transcript_id.student_decision === 'retaking' || item.final_transcript_id.student_decision === '') {
              finalTranscriptStatus = this.translate.instant('FINAL_TRANSCRIPT.RETAKE');
            } else if (item.final_transcript_id.student_decision === 'failed') {
              finalTranscriptStatus = this.translate.instant('FINAL_TRANSCRIPT.FINAL_RESULT_FAIL');
            }
          } else {
            if (this.getFinalResultAfterReTake(item.final_transcript_id.after_final_retake_decision) === 'FAILED') {
              finalTranscriptStatus = this.translate.instant('FINAL_TRANSCRIPT.FINAL_RESULT_FAIL');
            }
            if (this.getFinalResultAfterReTake(item.final_transcript_id.after_final_retake_decision) === 'PASS') {
              finalTranscriptStatus = this.translate.instant('FINAL_TRANSCRIPT.PASS');
            }
          }
        }
      } else if (item.final_transcript_id.jury_decision_for_final_transcript === 'pass') {
        finalTranscriptStatus = this.translate.instant('FINAL_TRANSCRIPT.PASS');
      } else if (item.final_transcript_id.jury_decision_for_final_transcript === 'eliminated') {
        finalTranscriptStatus = this.translate.instant('FINAL_TRANSCRIPT.ELIMINATED');
      } else if (item.final_transcript_id.jury_decision_for_final_transcript === 'failed') {
        finalTranscriptStatus = this.translate.instant('FINAL_TRANSCRIPT.FINAL_RESULT_FAIL');
      }
    }
    return finalTranscriptStatus;
  }

  getFinalResultAfterReTake(result: string) {
    if (result === 'PASS1' || result === 'PASS2' || result === 'PASS3') {
      return 'PASS';
    } else if (result === 'FAILED' || result === 'ELIMINATED') {
      return 'FAILED';
    }
  }

  getAllDataResult(pageNumber: number) {
    const pagination = {
      limit: 50,
      page: pageNumber,
    };
    const filter = this.cleanFilterData();
    this.subs.sink = this.esService.checkAllResultIsSent(pagination, filter, this.sortValue, this.esProcessId).subscribe((result: any) => {
      if (result && result.length) {
        this.allStudentForExport.push(...result);
        const page = pageNumber + 1;
        this.getAllDataResult(page);
      } else {
        this.allResultData = this.allStudentForExport;
      }
    });
  }

  checkIsAlreadySendToStudent() {
    let disabled = false;
    if (this.selectType === 'one' && this.userSelected.length) {
      const data = this.userSelected.filter((resp) => resp && resp.is_already_send_to_student === false);
      if (data && data.length) {
        disabled = true;
      } else {
        disabled = false;
      }
    } else {
      const data = this.allResultData.filter((resp) => resp && resp.is_already_send_to_student === false);
      if (data && data.length) {
        disabled = true;
      } else {
        disabled = false;
      }
    }
    return disabled;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  dialogExportAllResult() {
    const filter = this.cleanFilterData();
    this.isLoading = true;
    this.subs.sink = this.esService
      .getAllEmployabilitySurveyProcessStudentsResultIDs(filter, this.sortValue, this.esProcessId)
      .subscribe((studentIds) => {
        this.isLoading = false;
        const exportData = studentIds.map((student) => student.student_id._id);
        this.subs.sink = this.dialog
          .open(EmployabilitySurveyDetailsResultExportComponent, {
            disableClose: false,
            width: '400px',
            data: { data: exportData, id: this.esProcessId, type: 'one_time' },
          })
          .afterClosed()
          .subscribe((result) => {
            // if (result) {
            //   this.getAllJuryOrganizationData();
            // }
          });
      });
  }

  dialogExportResult() {
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
        if (this.selectType == 'one' && this.userSelectedId.length) {
          this.subs.sink = this.dialog
            .open(EmployabilitySurveyDetailsResultExportComponent, {
              disableClose: false,
              width: '400px',
              data: { data: this.userSelectedId, id: this.esProcessId, type: 'one_time', delimiter: separator.value },
            })
            .afterClosed()
            .subscribe((result) => {
              // if (result) {
              //   this.getAllJuryOrganizationData();
              // }
            });
        } else {
          // https://zettabyte-goa.atlassian.net/browse/AV-7917 we improve export from BE side
          // this.dialogExportAllResult();
          this.subs.sink = this.dialog
            .open(EmployabilitySurveyDetailsResultExportComponent, {
              disableClose: false,
              width: '400px',
              data: { data: 'all', id: this.esProcessId, type: 'one_time', delimiter: separator.value },
            })
            .afterClosed()
            .subscribe((result) => {
              // if (result) {
              //   this.getAllJuryOrganizationData();
              // }
            });
        }
      }
    });
  }
}
