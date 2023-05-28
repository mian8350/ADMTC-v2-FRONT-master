import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource, MatTable } from '@angular/material/table';
import { CrossCorrectionService } from 'app/service/cross-correction/cross-correction.service';
import { UsersDialogComponent } from 'app/users/users-dialog/users-dialog.component';
import { forkJoin, Observable } from 'rxjs';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { CrossCorrection } from 'app/cross-correction/cross-correction.model';
import { Router } from '@angular/router';
import { NgSelectComponent } from '@ng-select/ng-select';
import { select } from 'd3-selection';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { ExportCsvService } from 'app/service/export-csv/export-csv.service';

@Component({
  selector: 'ms-assign-cross-corrector-table',
  templateUrl: './assign-cross-corrector-table.component.html',
  styleUrls: ['./assign-cross-corrector-table.component.scss'],
})
export class AssignCrossCorrectorTableComponent implements OnInit {
  private subs = new SubSink();

  dataSource = new MatTableDataSource([]);
  @ViewChild(MatTable, { static: true }) table: MatTable<any>;
  @Input() title;
  @Input() titleId;
  @Input() testId;
  @Input() params;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  SelectedTitleName;
  className: string;
  titleName: string;
  testName: string;
  noData: any;
  dataCount = 0;
  dataLoaded = false;
  isWaitingForResponse = false;
  displayedColumns: string[] = ['students', 'schoolOrigin', 'schoolCorrecting', 'crossCorrector'];
  filterColumns: string[] = ['studentsFilter', 'schoolOriginFilter', 'schoolCorrectingFilter', 'crossCorrectorFilter'];
  sortValue = null;
  filteredValues = {
    students: '',
    schoolOrigin: '',
    schoolCorrecting: '',
    crossCorrector: '',
  };
  exportList = [
    { value: 'Comma [,]', name: 'Comma [,]' },
    { value: 'Semicolon [;]', name: 'Semicolon [;]' },
    { value: 'Tab []', name: 'Tab []' },
  ];
  exportFilter = new UntypedFormControl('Comma [,]');

  schoolOriginList = [];
  filteredSchoolOrigin: Observable<any[]>;
  schoolOriginFilter = new UntypedFormControl('');
  lastNameFilter = new UntypedFormControl(null);

  schoolCorrectorList = [];
  filteredSchoolCorrector: Observable<any[]>;
  schoolCorrectorFilter = new UntypedFormControl('');

  schoolCorrectingList = [];
  filteredSchoolCorrecting: Observable<any[]>;
  schoolCorrectingFilter = new UntypedFormControl('');

  crossCorrectorUserList = [];
  crossCorrectorUserListPerIndex = [];

  crossCorrectorList = [];
  filteredcrossCorrector: Observable<any[]>;
  crossCorrectorFilter = new UntypedFormControl('');

  assignCorrectorList = [];

  allSchoolData = [];

  schoolAndCorrectorList = [];
  AllStudentsLists: any[] = [];

  total: number = 0;
  assigned: number = 0;
  currentTitleData: any;

  options = {
    fieldSeparator: ',',
    quoteStrings: '"',
    decimalseparator: '.',
    showLabels: false,
    headers: [''],
    showTitle: true,
    useBom: false,
    keys: ['school', 'address', 'city', 'code'],
  };

  fileName: any;

  schools = [];

  data = [
    {
      name: 'Test, 1',
      age: 13,
      average: 8.2,
      approved: true,
      description: "using 'Content here, content here' ",
    },
    {
      name: 'Test 2',
      age: 11,
      average: 8.2,
      approved: true,
      description: "using 'Content here, content here' ",
    },
    {
      name: 'Test 3',
      age: 10,
      average: 8.2,
      approved: true,
      description: "using 'Content here, content here' ",
    },
  ];

  exportEntry = [];

  configCat: MatDialogConfig = {
    disableClose: true,
    panelClass: 'certification-rule-pop-up',
    minWidth: '95%',
    minHeight: '81%',
  };

  userForExport: any[];
  allStudentForExport = [];
  exportName: 'Export';
  constructor(
    private crossCorrectionService: CrossCorrectionService,
    public dialog: MatDialog,
    private router: Router,
    private mailboxService: MailboxService,
    private translate: TranslateService,
    private exportCsvService: ExportCsvService,
  ) {}

  ngOnInit() {
    this.initData();
    this.iniStudentFilter();
    this.getCurrentTitle();
    this.getDropdownSchoolOrigin();
    this.getDropdownSchoolCorrecting();
    // this.exportCsv();
    // this.getCorrectorCsv();
    this.getDropdownCrossCorrector();
  }

  getCurrentTitle() {
    this.mailboxService.getOneTitle(this.params.titleId).subscribe((resp) => {
      this.currentTitleData = resp;

    });
  }

  exportCsv() {
    const allStudents = this.AllStudentsLists;


    this.schoolCorrectorList.forEach((school) => {

      const students = _.filter(allStudents, function (s) {
        return s.school_origin_id._id === school._id;
      });

      if (students.length > 0) {
        let entryToMake = [];
        this.schoolCorrectorList.forEach((schoolCorrecting) => {
          if (schoolCorrecting._id !== school._id) {
            entryToMake = _.filter(students, function (s) {
              return s.school_correcting_id === s.school_correcting_id._id;
            });

            if (entryToMake.length > 0) {
              this.exportEntry.push({
                rncp: this.SelectedTitleName,
                schoolOriginShortName: school.shortName,
                schoolOriginAddress:
                  school.schoolAddress.address1 + ', ' + school.schoolAddress.city + ', ' + school.schoolAddress.postalCode,
                noOfActiveStudents: students.length,
                schoolCorrectingshortName: entryToMake[0].schoolCorrectingId.shortName,
                schoolCorrectingAddress:
                  entryToMake[0].schoolCorrectingId.schoolAddress.address1 +
                  ', ' +
                  entryToMake[0].schoolCorrectingId.schoolAddress.city +
                  ', ' +
                  entryToMake[0].schoolCorrectingId.schoolAddress.postalCode,
                studentToBeCorrected: entryToMake.length,
              });
            }
          }
        });
      }
    });

    // this.options = {
    //   fieldSeparator: this.exportFilter.value,
    //   quoteStrings: '"',
    //   decimalseparator: '.',
    //   showLabels: true,
    //   showTitle: false,
    //   useBom: true,
    //   approved:
    //   headers: [this.translate.instant('Students')],
    // };
    const setCSVFileName = (this.SelectedTitleName + ' ' + moment().format('DD-MM-YYYY')).replace(/  +/g, ' ');

    // new Angular2Csv(exportEntry, setCSVFileName, options);

  }

  getCorrectorCsv() {
    const filter = {
      rncp_title_id: this.params.titleId,
      class_id: this.params.classId,
      test_id: this.params.test_id,
    };

    this.subs.sink = this.crossCorrectionService.getCorrectorCsv(filter).subscribe((res) => {

      this.schools = res.map((school) => {
        return {
          school: school.school_correcting_id.short_name ? school.school_correcting_id.short_name : '',
          address:
            school.school_correcting_id.school_address && school.school_correcting_id.school_address.length
              ? school.school_correcting_id.school_address[0].address1
              : '',
          city:
            school.school_correcting_id.school_address && school.school_correcting_id.school_address.length
              ? school.school_correcting_id.school_address[0].city
              : '',
          code:
            school.school_correcting_id.school_address && school.school_correcting_id.school_address.length
              ? school.school_correcting_id.school_address[0].postal_code
              : '',
        };
        // const headerTable = [school: 'Title', address: 'School ORIGIN', city: 'Address Sch', code: 'Student Sch. ORIGIN']
        // this.schools.unshift(headerTable);
      });
      this.options = {
        fieldSeparator: ',',
        quoteStrings: '"',
        decimalseparator: '.',
        showLabels: false,
        headers: [
          this.translate.instant('CROSSCORRECTION_EXPORT_COLUMNS.RNCPTITLE'),
          this.translate.instant('CROSSCORRECTION_EXPORT_COLUMNS.SCHOOL_ORIGIN'),
          this.translate.instant('CROSSCORRECTION_EXPORT_COLUMNS.SCHOOL_ORIGIN_ADDRESS'),
          this.translate.instant('CROSSCORRECTION_EXPORT_COLUMNS.ACTIVE_STUDENTS'),
          this.translate.instant('CROSSCORRECTION_EXPORT_COLUMNS.SCHOOL_CORRECTING'),
          this.translate.instant('CROSSCORRECTION_EXPORT_COLUMNS.SCHOOL_CORRECTIN_ADDRESS'),
          this.translate.instant('CROSSCORRECTION_EXPORT_COLUMNS.STUDENTS_TO_BE_CORRECTED'),
        ],
        showTitle: true,
        useBom: false,
        keys: ['school', 'address', 'city', 'code'],
      };

      // this.fileName = this.params.titleId + this.params.classId + this.params.test_id;


    });
    this.subs.sink = this.crossCorrectionService.getOneTest(this.params.testId).subscribe((res) => {

      if (res) {
        this.className = res.class_id.name;
        this.titleName = res.parent_rncp_title.short_name;
        this.testName = res.name;
      }
      this.fileName = (this.className + ' ' + this.testName + ' ' + moment().format('DD-MM-YYYY')).replace(/  +/g, ' ');
    });
  }

  getDropdownSchoolOrigin() {
    const filter = {
      rncp_title_id: this.params.titleId,
      class_id: this.params.classId,
      test_id: this.params.test_id,
    };
    this.subs.sink = this.crossCorrectionService.getSchoolOriginDropdown(filter).subscribe((res) => {

      this.schoolOriginList = _.uniqBy(res, 'school_origin_id._id');

      this.filteredSchoolOrigin = this.schoolOriginFilter.valueChanges.pipe(
        startWith(''),
        map((searchTxt: string) =>
          this.schoolOriginList.filter((sch) => {
            if (searchTxt) {
              return sch.school_origin_id.short_name.toLowerCase().includes(searchTxt.toLowerCase());
            }
            return true;
          }),
        ),
      );
    });
  }

  getDropdownCrossCorrector() {
    const filter = {
      rncp_title_id: this.params.titleId,
      class_id: this.params.classId,
      test_id: this.params.test_id,
    };
    this.subs.sink = this.crossCorrectionService.getCrossCorrectorDropdown(filter).subscribe((res) => {

      this.crossCorrectorUserList = _.uniqBy(res, 'school_correcting_corrector_id._id');
      this.crossCorrectorUserList = this.crossCorrectorUserList.filter((res) => res.school_correcting_corrector_id);
      this.filteredcrossCorrector = this.crossCorrectorFilter.valueChanges.pipe(
        startWith(''),
        map((searchTxt: string) =>
          this.crossCorrectorUserList.filter((sch) => {
            if (searchTxt) {
              return sch.school_correcting_corrector_id._id.toLowerCase().includes(searchTxt.toLowerCase());
            }
            return true;
          }),
        ),
      );
    });
  }

  getDropdownSchoolCorrecting() {
    const filter = {
      rncp_title_id: this.params.titleId,
      class_id: this.params.classId,
      test_id: this.params.test_id,
    };
    this.subs.sink = this.crossCorrectionService.getSchoolCorrectingDropdown(filter).subscribe((res) => {
      this.schoolCorrectorList = _.uniqBy(res, 'school_correcting_id._id');
      this.schoolCorrectorList = this.schoolCorrectorList.filter((sch) => sch.school_correcting_id);
      this.filteredSchoolCorrector = this.schoolCorrectorFilter.valueChanges.pipe(
        startWith(''),
        map((searchTxt: string) =>
          this.schoolCorrectorList.filter((sch) => {
            if (searchTxt) {
              return sch.school_correcting_id.short_name.toLowerCase().includes(searchTxt.toLowerCase());
            }
            return true;
          }),
        ),
      );
    });
  }

  setSchoolOrigin(school) {
    if (school && school.school_origin_id && school.school_origin_id._id) {
      this.filteredValues.schoolOrigin = school.school_origin_id._id;
    } else {
      this.filteredValues.schoolOrigin = '';
    }
    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.paginator.pageIndex = 0;
    // const list = this.assignCorrectorList;
    // if (school) {
    //   let filterExist;
    //   if (this.schoolCorrectorFilter.value && this.schoolCorrectorFilter.value !== 'All') {
    //     filterExist = list.filter((res) => res.school_correcting_data.short_name === this.schoolCorrectorFilter.value);
    //   } else {
    //     filterExist = list;
    //   }
    //   const filters = filterExist.filter((res) => res.school_origin_id._id === school.school_origin_id._id);
    //   this.dataSource.data = filters;
    // } else {
    //   if (this.schoolCorrectorFilter.value && this.schoolCorrectorFilter.value !== 'All') {
    //     const filter = list.filter((res) => res.school_correcting_data.short_name === this.schoolCorrectorFilter.value);
    //     this.dataSource.data = filter;
    //   } else {
    //     this.dataSource.data = list;
    //   }
    // }
  }

  iniStudentFilter() {
    this.subs.sink = this.lastNameFilter.valueChanges.pipe(debounceTime(100)).subscribe((statusSearch) => {

      const symbol = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      if (!statusSearch.match(symbol) && !statusSearch.match(symbol1)) {
        this.filteredValues.students = statusSearch ? statusSearch.toLowerCase() : '';
      } else {
        this.lastNameFilter.setValue('');
        this.filteredValues.students = '';
      }
      this.dataSource.filter = JSON.stringify(this.filteredValues);
      this.paginator.pageIndex = 0;
    });
  }

  setSchoolCorrecting(school) {
    if (school && school.school_correcting_id && school.school_correcting_id._id) {
      this.filteredValues.schoolCorrecting = school.school_correcting_id._id;
    } else {
      this.filteredValues.schoolCorrecting = '';
    }
    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.paginator.pageIndex = 0;
    // const list = this.assignCorrectorList;
    // if (school) {
    //   let filterExist;
    //   if (this.schoolOriginFilter.value && this.schoolOriginFilter.value !== 'All') {
    //     filterExist = list.filter((res) => res.school_origin_id.short_name === this.schoolOriginFilter.value);
    //   } else {
    //     filterExist = list;
    //   }
    //   const filter = filterExist.filter((res) => res.school_correcting_data._id === school.school_correcting_id._id);
    //   this.dataSource.data = filter;
    // } else {
    //   if (this.schoolOriginFilter.value && this.schoolOriginFilter.value !== 'All') {
    //     const filter = list.filter((res) => res.school_origin_id.short_name === this.schoolOriginFilter.value);
    //     this.dataSource.data = filter;
    //   } else {
    //     this.dataSource.data = list;
    //   }
    // }
  }

  setCrossCorrector(corrector) {
    if (corrector && corrector.school_correcting_corrector_id && corrector.school_correcting_corrector_id._id) {
      this.filteredValues.crossCorrector = corrector.school_correcting_corrector_id._id;
    } else {
      this.filteredValues.crossCorrector = '';
    }
    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.paginator.pageIndex = 0;
  }

  customFilterPredicate() {
    return (data: any, filter: string): boolean => {
      const searchString: any = JSON.parse(filter);

      let schoolOriginFound =
        data.school_origin_id && searchString.schoolOrigin ? data.school_origin_id._id === searchString.schoolOrigin : true;
      let schoolCorrectingFound = true;
      let crossCorrectingFound = true;
      const student =
        data.student_id.last_name.toLowerCase().trim().includes(searchString.students) ||
        data.student_id.first_name.toLowerCase().trim().includes(searchString.students);
      let studentsFound = data.student_id && searchString.students ? student : true;
      if (searchString.crossCorrector) {
        studentsFound = data.student_id && searchString.students ? student : true;
        schoolOriginFound =
          data.school_origin_id && searchString.schoolOrigin ? data.school_origin_id._id === searchString.schoolOrigin : true;
        crossCorrectingFound =
          data.school_correcting_corrector_data && searchString.crossCorrector
            ? data.school_correcting_corrector_data._id === searchString.crossCorrector
            : false;
        if (searchString.schoolCorrecting) {
          schoolCorrectingFound =
            data.school_correcting_id && searchString.schoolCorrecting
              ? data.school_correcting_id === searchString.schoolCorrecting
              : false;
          return studentsFound && schoolOriginFound && crossCorrectingFound && schoolCorrectingFound;
        } else {
          return studentsFound && schoolOriginFound && crossCorrectingFound;
        }
      } else if (searchString.schoolCorrecting) {
        studentsFound = data.student_id && searchString.students ? student : true;
        schoolOriginFound =
          data.school_origin_id && searchString.schoolOrigin ? data.school_origin_id._id === searchString.schoolOrigin : true;
        schoolCorrectingFound =
          data.school_correcting_id && searchString.schoolCorrecting ? data.school_correcting_id === searchString.schoolCorrecting : false;
        if (searchString.crossCorrector) {
          crossCorrectingFound =
            data.school_correcting_corrector_data && searchString.crossCorrector
              ? data.school_correcting_corrector_data._id === searchString.crossCorrector
              : false;
          return studentsFound && schoolOriginFound && schoolCorrectingFound && crossCorrectingFound;
        } else {
          return studentsFound && schoolOriginFound && schoolCorrectingFound;
        }
      } else {
        return schoolOriginFound && schoolCorrectingFound && studentsFound && crossCorrectingFound;
      }
    };
  }

  setSort() {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'students':
          return item.student_id ? item.student_id.first_name : null;
        case 'schoolOrigin':
          return item.school_origin_id ? item.school_origin_id.short_name : null;
        default:
          return item[property];
      }
    };
    this.dataSource.sort = this.sort;
  }

  initData() {
    this.isWaitingForResponse = true;
    const filter = {
      rncp_title_id: this.params.titleId,
      class_id: this.params.classId,
      test_id: this.params.testId,
    };

    const forkParam = [];
    forkParam.push(this.crossCorrectionService.getSchoolsCorrectingDropdown(this.params.titleId, this.params.classId));
    forkParam.push(this.crossCorrectionService.getCrossCorrectionList(filter));

    this.isWaitingForResponse = true;
    this.subs.sink = forkJoin(forkParam).subscribe(
      (resp: any[]) => {
        this.isWaitingForResponse = false;
        if (resp && resp.length) {
          // *************** resp 0 is for getting school and corrector list
          if (resp[0]) {
            this.schoolCorrectingList = resp[0].map((item) => item.school);
            this.schoolAndCorrectorList = resp[0].map((item) => {
              if (item && item.cross_correctors.length) {
                item.cross_correctors = item.cross_correctors.map((corrector) => {
                  return {
                    ...corrector,
                    // add full name so we can display full name in ng-select
                    full_name: `${corrector.last_name ? corrector.last_name.toUpperCase() : ''} ${corrector.first_name}`,
                  };
                });
              }
              return item;
            });
          }
          // *************** resp 1 is for student table data itself
          if (resp[1]) {
            if (resp[1] && resp[1].length) {
              this.assignCorrectorList = this.mapCrossCorrectionData(resp[1]);
            } else {
              this.saveAllDataWhileLoadingItForFirstTime();
            }




            // ************** Set the behavioursubject of allstudentdata into the service, so the school table can use those data to calculate
            this.crossCorrectionService.setAllStudentsLists(this.assignCorrectorList);
            // ************** Set dropdown data for each row in the table
            this.assignCorrectorList.forEach((list) => {
              list.school_correcting_dropdown = this.schoolCorrectingList.filter((sch) => {
                if (sch._id && list.school_origin_id && list.school_origin_id._id) {
                  return sch._id !== list.school_origin_id._id;
                }
                return false;
              });
              list.cross_corrector_dropdown = this.getCrossCorrectorDropdown(list);
            });
            // ************** Set cross corrector per index of student
            // this.assignCorrectorList.forEach((list, rowIndex) => {
            //   this.crossCorrectorUserListPerIndex.push([]);
            //   if (list && list.school_correcting_id) {
            //     this.updateDropdownCrossCorrector(list.school_correcting_id, rowIndex);
            //   }
            // });

            // ************** populate table data
            this.dataSource.data = this.assignCorrectorList;
            this.total = this.assignCorrectorList.length ? this.assignCorrectorList.length : 0;
            this.noData = this.dataSource.connect().pipe(map((data) => !data || (data && data.length === 0)));
            this.setSort();
            this.dataSource.filterPredicate = this.customFilterPredicate();
            this.getUnssigned();
            this.dataSource.paginator = this.paginator;
          }
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  saveAllDataWhileLoadingItForFirstTime() {
    this.subs.sink = this.crossCorrectionService
      .getAllStudentCrossCorrectionFirstTime(this.params.titleId, this.params.classId)
      .subscribe((resp) => {

        const students = _.cloneDeep(resp);
        const dataPost = [];
        if (students && students.length) {
          students.forEach((student) => {
            const newObject = {};
            newObject['class_id'] = this.params.classId;
            newObject['rncp_title_id'] = this.params.titleId;
            newObject['test_id'] = this.params.testId;
            newObject['school_origin_id'] = student['school']['_id'];
            newObject['student_id'] = student['_id'];
            dataPost.push(newObject);
          });

          this.subs.sink = this.crossCorrectionService.CreateAndUpdateCrossCorrector(dataPost).subscribe((response) => {

            this.reloadPage();
          });
        }
      });
  }

  reloadPage() {
    this.router
      .navigateByUrl('/', { skipLocationChange: true })
      .then(() =>
        this.router.navigate(['/crossCorrection', 'assign-cross-corrector', this.params.titleId, this.params.classId, this.params.testId]),
      );
  }

  mapCrossCorrectionData(res: CrossCorrection[]): any[] {
    const correctionList = res.map((corr) => {
      return {
        ...corr,
        // make school_correcting_id has value id. for short_name and _id, we put it in school_correcting_data
        school_correcting_data: corr.school_correcting_id ? corr.school_correcting_id : null,
        school_correcting_id: corr.school_correcting_id ? corr.school_correcting_id._id : null,
        // make school_correcting_corrector_id has value id. for short_name and _id, we put it in school_correcting_corrector_data
        school_correcting_corrector_data: corr.school_correcting_corrector_id ? corr.school_correcting_corrector_id : null,
        school_correcting_corrector_id: corr.school_correcting_corrector_id ? corr.school_correcting_corrector_id._id : null,
        // dummy field to hold School Correcting and Cross Corrector dropdown
        school_correcting_dropdown: [],
        cross_corrector_dropdown: [],
      };
    });
    return correctionList;
  }

  getUnssigned() {
    this.assigned = 0;
    const list = _.cloneDeep(this.assignCorrectorList);
    for (let index = 0; index < list.length; index++) {
      const element = list[index].school_correcting_corrector_id;
      const isEmpty: boolean = _.isEmpty(element);
      if (isEmpty) {
        this.assigned += 1;
      }
    }
  }

  refreshCorrector() {
    this.getUnssigned();
  }

  resetFilter() {
    this.filteredValues = {
      students: '',
      schoolOrigin: '',
      schoolCorrecting: '',
      crossCorrector: '',
    };
    this.lastNameFilter.setValue('');
    this.crossCorrectorFilter.setValue('');
    this.paginator.pageIndex = 0;
    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.schoolOriginFilter.setValue('');
    this.schoolCorrectorFilter.setValue('');
  }

  displayFn(school: any) {
    if (school) {
      const list = _.cloneDeep(this.schoolCorrectingList);
      const found = _.find(list, (res) => res.school._id === school);
      let result = '';
      if (found) {
        result = found.school.short_name;
      }
      return result;
    }
  }

  addCorrector(corrector, select: NgSelectComponent) {
    select.close();
    const selectedSchool = corrector.school_correcting_dropdown.find((sch) => sch._id === corrector.school_correcting_id);


    const entities = [
      {
        assigned_rncp_title: {
          _id: this.params.titleId,
          short_name: this.currentTitleData ? this.currentTitleData.short_name : '',
        },
        class: {
          _id: this.params.classId,
        },
        companies: null,
        entity_name: 'academic',
        group_of_school: null,
        school: {
          _id: selectedSchool ? selectedSchool._id : null,
          short_name: selectedSchool ? selectedSchool.short_name : '',
        },
        school_type: 'preparation_center',
        type: {
          _id: '5a9e7ddf8228f45eb2e9bc77',
        },
      },
    ];
    this.dialog
      .open(UsersDialogComponent, {
        ...this.configCat,
        data: {
          operation: 'populateEntities',
          entities: entities,
        },
      })
      .afterClosed()
      .subscribe((result) => {
        this.reloadPage();
      });
  }

  getPayload() {
    const payload = _.cloneDeep(this.dataSource.data);
    payload.forEach((corr) => {
      // delete all dummy field that only used in FE
      delete corr.school_correcting_data;
      delete corr.school_correcting_corrector_data;
      delete corr.school_correcting_dropdown;
      delete corr.cross_corrector_dropdown;
      delete corr.count_document;
      // convert object to id
      if (corr.scholar_season_id && corr.scholar_season_id._id) {
        corr.scholar_season_id = corr.scholar_season_id._id;
      }
      if (corr.test_id && corr.test_id._id) {
        corr.test_id = corr.test_id._id;
      }
      if (corr.rncp_title_id && corr.rncp_title_id._id) {
        corr.rncp_title_id = corr.rncp_title_id._id;
      }
      if (corr.class_id && corr.class_id._id) {
        corr.class_id = corr.class_id._id;
      }
      if (corr.school_origin_id && corr.school_origin_id._id) {
        corr.school_origin_id = corr.school_origin_id._id;
      }
      if (corr.student_id && corr.student_id._id) {
        corr.student_id = corr.student_id._id;
      }
    });
    return payload;
  }

  setCrossCorrectorDropdown(correction) {
    const selectedIdx = this.dataSource.data.findIndex((dt) => dt._id === correction._id);
    this.dataSource.data[selectedIdx].school_correcting_corrector_id = null;
    this.dataSource.data[selectedIdx].cross_corrector_dropdown = this.getCrossCorrectorDropdown(correction);
    this.crossCorrectionService.setAllStudentsLists(this.dataSource.data);
    this.getUnssigned();

  }

  getCrossCorrectorDropdown(correction) {
    const foundSchoolCor = this.schoolAndCorrectorList.find((schoolCor) => {
      if (schoolCor.school && schoolCor.school._id && correction.school_correcting_id) {
        return schoolCor.school._id === correction.school_correcting_id;
      }
      return false;
    });
    return foundSchoolCor ? foundSchoolCor.cross_correctors : [];
  }

  updateSchoolCrossCorrector(event, rowIndex, type) {
    const dataIndex = rowIndex + this.paginator.pageIndex * this.paginator.pageSize;


    // *************** Reset the corrector field if the school corrector is removed
    if (type === 'school_correcting' && !event) {
      this.dataSource.data[dataIndex].school_correcting_corrector_id = null;
      this.table.renderRows();
    }

    // ************** Populate the index of data cross corrector based on school if selected
    if (type === 'school_correcting' && event && event._id && this.crossCorrectorUserListPerIndex[dataIndex]) {
      this.updateDropdownCrossCorrector(event._id, dataIndex);
    }

    // ************** Set the behavioursubject of allstudentdata into the service, so the school table can use those data to calculate
    this.crossCorrectionService.setAllStudentsLists(this.dataSource.data);
  }

  // ************** Function populate the index of data cross corrector based on school if selected
  updateDropdownCrossCorrector(schoolId, rowIndex) {
    const foundSchoolCor = this.schoolAndCorrectorList.find((schoolCor) => schoolCor.school && schoolCor.school._id === schoolId);
    this.crossCorrectorUserListPerIndex[rowIndex] = foundSchoolCor.cross_correctors;
  }
  // downloadCSV() {
  //   this.status = ["approved", "rejected", "pending"];
  //   var data = [
  //     {
  //       name: "Test 1",
  //       age: 13,
  //       average: 8.2,
  //       status: this.status[0],
  //       description: "Kuala Lmpuer, Malaysia"
  //     },
  //     {
  //       name: 'Test 2',
  //       age: 11,
  //       average: 8.2,
  //       status: this.status[1],
  //       description: "Jakarta, Indonesia"
  //     },
  //     {
  //       name: 'Test 3',
  //       age: 10,
  //       average: 8.2,
  //       status: this.status[2],
  //       description: "Bangkok, Thailand"
  //     },
  //   ];

  //   var options = {
  //     title: 'User Details',
  //     fieldSeparator: ',',
  //     quoteStrings: '"',
  //     decimalseparator: '.',
  //     showLabels: true,
  //     showTitle: true,
  //     useBom: true,
  //     headers: ['Name', 'Age', 'Average', 'Status', 'Address']
  //   };

  //   new Angular2Csv(data, this.formula, options);
  // }
  exportData() {
    Swal.close();
    const data = [];
    this.isWaitingForResponse = true;
    this.subs.sink = this.crossCorrectionService.GetDataForCrossCorrectorCsv(this.titleId, this.testId).subscribe((res) => {
      if (res && res.length) {
        this.isWaitingForResponse = false;
        res.forEach((item) => {
          const obj = [];
          // TODO: From the template get the data location and add the data
          // TEMPLATE CSV: https://docs.google.com/spreadsheets/d/1DzBsPlOo1UZ9zB8smN4M7HrddslsqklYdrpJXd4vu9o/edit#gid=0
          obj[0] = item.rncp ? item.rncp : '';
          obj[1] = item.school_origin ? item.school_origin : '';
          obj[2] = item.school_origin_address ? item.school_origin_address : '';
          obj[3] = item.students_count_school_origin ? item.students_count_school_origin : '';
          obj[4] = item.school_correcting ? item.school_correcting : '';
          obj[5] = item.school_correcting_address ? item.school_correcting_address : '';
          obj[6] = item.students_count_school_correcting ? item.students_count_school_correcting : '';
          data.push(obj);
        });

        const valueRange = { values: data };
        const today = moment().format('DD-MM-YYYY');
        const title = this.exportName + '_' + today;
        const sheetID = this.translate.currentLang === 'en' ? 0 : 1175008579;
        const sheetData = {
          spreadsheetId: '1DzBsPlOo1UZ9zB8smN4M7HrddslsqklYdrpJXd4vu9o',
          sheetId: sheetID,
          range: 'A7',
        };
        this.exportCsvService.createAndUpdateSpreadsheet(valueRange, title, sheetData);
      } else {
        this.isWaitingForResponse = false;
      }
    });
  }
}
