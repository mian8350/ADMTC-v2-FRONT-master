import { SelectionModel } from '@angular/cdk/collections';
import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { EmployabilitySurveyService } from 'app/service/employability-survey/employability-survey.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import { StudentsService } from 'app/service/students/students.service';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { UntypedFormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { SchoolService } from 'app/service/schools/school.service';
import { UtilityService } from 'app/service/utility/utility.service';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { ExportCsvService } from 'app/service/export-csv/export-csv.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-employability-survey-details-result',
  templateUrl: './employability-survey-details-result.component.html',
  styleUrls: ['./employability-survey-details-result.component.scss'],
  providers: [ParseStringDatePipe, ParseUtcToLocalPipe],
})
export class EmployabilitySurveyDetailsResultComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() esProcessId: '';
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  @Input() esType: string;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  private subs = new SubSink();
  selection = new SelectionModel(true, []);
  dataSource = new MatTableDataSource([]);
  displayedColumns = ['select', 'school', 'student', 'status', 'action'];
  filterColumns = ['selectFilter', 'schoolFilter', 'studentFilter', 'statusFilter', 'actionFilter'];

  isLoading;

  selectType;
  userSelected;
  userSelectedId;

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
  };
  isReset = false;
  statusFilter = new UntypedFormControl('');
  studentNameFilter = new UntypedFormControl('');
  schoolFilter = new UntypedFormControl('');
  filteredSchools: Observable<any[]>;
  schoolList = [];
  surveyType = '';
  surveyName = '';

  statusFilterList = [
    {
      name: 'All',
      value: 'AllM',
    },
    { name: 'not_sent', value: 'not_sent' },
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

  studentPrevCourseData = null;
  constructor(
    private esService: EmployabilitySurveyService,
    private studentService: StudentsService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private utilService: UtilityService,
    private schoolService: SchoolService,
    private translate: TranslateService,
    private exportCsvService: ExportCsvService,
  ) {}

  ngOnInit() {
    // this.dataSource.data = this.dummy;
    // this.getSchoolListDropdown();
    // this.initFilter();
    // this.getDataResultES();
    // this.checkEmplyabilitySurveyType();
    // this.currentLang = this.translate.currentLang.toLowerCase();
  }

  ngAfterViewInit() {
    // this.subs.sink = this.paginator.page
    //   .pipe(
    //     startWith(null),
    //     tap(() => {
    //       if (!this.isReset) {
    //         this.getDataResultES();
    //       }
    //       this.dataLoaded = true;
    //     }),
    //   )
    //   .subscribe();
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
    const is_for_one_time = false;
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
    filterQuery = filterQuery + ` included:already_sent_to_student`;
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
          this.getDataResultES();
        }
      } else {
        this.studentNameFilter.setValue('');
        this.filteredValues.student_name = '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getDataResultES();
        }
      }
    });
    this.subs.sink = this.statusFilter.valueChanges.subscribe((statusSearch) => {
      this.filteredValues.latest_survey_status = statusSearch === 'AllM' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getDataResultES();
      }
    });
  }

  previewES(student) {

    if (student && student.student_id && student.student_id.school) {
      this.selectedStudentId = student.student_id._id;
      this.selectedSchoolId = student.student_id.school._id;
      // We need to pass the title and class id here so preview can display the tab IF student ES in prev course
      this.studentPrevCourseData = {
        rncp_title: {
          _id: this.selectedRncpTitleId
        },
        current_class: {
          _id: this.selectedClassId
        }
      }
    } else {
      this.selectedStudentId = null;
      this.selectedSchoolId = null;
      this.studentPrevCourseData = null;
    }



  }

  showOptions(info) {
    const numSelected = this.selection.selected.length;
    if (numSelected > 0) {
      this.disabledExport = false;
    } else {
      this.disabledExport = true;
    }

    if (info === 'all') {
      // this.getAllDataResult(0);
    } else {
      this.selectType = info;
    }
    const data = this.selection.selected;
    this.userSelected = [];
    this.userSelectedId = [];
    data.forEach((user) => {
      this.userSelected.push(user);
      this.userSelectedId.push(user.student_id._id);
    });
  }

  masterToggle() {
    if (this.isAllSelected()) {
      this.selectType = null;
      this.selection.clear();
    } else {
      this.dataSource.data.forEach((row) => this.selection.select(row));
      this.selectType = 'all'
    }
  }

  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  checkboxLabel(element?): string {
    if (!element) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(element) ? 'deselect' : 'select'} row ${element.position + 1}`;
  }

  reset() {
    this.selectType = null;
    this.selection.clear();
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.filteredValues = {
      school: '',
      student_name: '',
      latest_survey_status: '',
    };
    this.statusFilter.setValue('', { emitEvent: false });
    this.studentNameFilter.setValue('', { emitEvent: false });
    this.schoolFilter.setValue('', {emitEvent: false});

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    this.getDataResultES();
  }

  setSchoolFilter(value) {
    this.filteredValues.school = value;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getDataResultES();
    }
  }

  getSchoolListDropdown() {
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
    this.subs.sink = this.esService.getAllEmployabilitySurveyProcessStudentsResultIDs(filter, this.sortValue, this.esProcessId).subscribe(studentIds => {
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
    })
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
    this.subs.sink = this.esService.getAllEmployabilitySurveyProcessStudentsResultIDs(filter, this.sortValue, this.esProcessId).subscribe(studentIds => {
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
    })
    
  }

  SendEmployabilitySurvey(student) {
    if (student && student.student_id && student.student_id.school) {
      const student_id = student.student_id._id;

      this.subs.sink = this.esService.sendEmployabilitySurvey_N4(student_id, this.esProcessId).subscribe(
        (resp) => {

          this.isLoading = false;
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        },
        (err) => {

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
}
