import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import { DUMMY } from './transcript-certiciate-generation.model';
import { startWith, map, tap, debounceTime } from 'rxjs/operators';
import { TranscriptProcessService } from 'app/service/transcript-process/transcript-process.service';
import { UntypedFormControl } from '@angular/forms';
import { UtilityService } from 'app/service/utility/utility.service';
import { SchoolService } from 'app/service/schools/school.service';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { NgxPermissionsService } from 'ngx-permissions';
import { AuthService } from 'app/service/auth-service/auth.service';
import { SelectionModel } from '@angular/cdk/collections';

@Component({
  selector: 'ms-transcript-certificate-genertion',
  templateUrl: './transcript-certificate-genertion.component.html',
  styleUrls: ['./transcript-certificate-genertion.component.scss'],
})
export class TranscriptCertificateGenertionComponent implements OnInit, AfterViewInit, OnDestroy {
  private subs = new SubSink();
  @Input() titleId: string;
  @Input() classId: string;
  @Input() certifierId: string;
  @Input() transcriptId: string;

  dataSource = new MatTableDataSource([]);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  noData: any;
  dataCount = 0;
  isReset = false;
  dataLoaded = false;
  isWaitingForResponse = false;
  displayedColumns: string[] = ['select', 'school', 'student', 'identity', 'transcript', 'es', 'diploma', 'certfier', 'cd'];
  filterColumns: string[] = [
    'selectFilter',
    'schoolFilter',
    'studentFilter',
    'identityFilter',
    'transcriptFilter',
    'esFilter',
    'diplomaFilter',
    'certfierFilter',
    'cdFilter',
  ];
  sortValue = null;
  filteredValues = {
    school_id: '',
    full_name: '',
  };

  schoolList = [];
  originalSchoolList = [];
  filteredSchools: Observable<any[]>;
  schoolFilter = new UntypedFormControl('');
  lastNameFilter = new UntypedFormControl('');

  selection = new SelectionModel<any>(true, []);
  isCheckedAll = false;
  disabledGeneratePdfBtn = true;
  selectType: string;
  userSelected: any[];
  userSelectedId: any[];

  certidegreeStudentList = [];
  isUserCertifier = false;
  isUserCertifierDir = false;
  isUserADMTC = false;
  isUserMentor = false;
  currentUser: any;

  constructor(
    private transcriptService: TranscriptProcessService,
    private utilService: UtilityService,
    private schoolService: SchoolService,
    private permissions: NgxPermissionsService,
    private authService: AuthService,
  ) {}

  ngOnInit() {
    this.currentUser = this.authService.getLocalStorageUser();
    this.isUserADMTC = this.utilService.isUserEntityADMTC();
    this.getSchoolDropdownList();
    this.initFilter();
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (!this.isReset) {
            this.getCertidegreeStudent();
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
        this.getCertidegreeStudent();
      }
    }
  }

  getCertidegreeStudent() {
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.isWaitingForResponse = true;
    this.transcriptService.getAllCertidegreeStudent(this.titleId, pagination, this.sortValue, this.filteredValues).subscribe(resp => {
      this.isWaitingForResponse = false;
      this.certidegreeStudentList = resp;
      this.dataSource.data = this.certidegreeStudentList;
      this.dataCount = this.certidegreeStudentList.length ? this.certidegreeStudentList[0].count_document : 0;
      this.noData = this.dataSource.connect().pipe(map((data) => !data || (data && data.length === 0)));
      // set isReset back to false after 400 milisecond so the subscription that has debounceTime not triggered
      setTimeout(() => (this.isReset = false), 400);
    }, err => this.isWaitingForResponse = false)
  }

  generateCertidegreePdf() {

  }

  getESToolTip(surveyStatus, surveyValidator) {
    let tooltip = surveyStatus;
    if (surveyStatus === 'rejected_by_validator' || surveyStatus === 'validated_by_validator') {
      tooltip = tooltip + '_' + surveyValidator;
    }
    return tooltip;
  }

  enterSchoolFilter(event: MatAutocomplete) {

    if (event && event.options && event.options.length > 1) {
      let schoolId = '';
      let schoolData;
      event.options.forEach((option, optionIndex) => {
        if (optionIndex === 1 && option) {

          const foundSchool = this.schoolList.find((school) => option.value === school.short_name);
          if (foundSchool) {
            schoolId = foundSchool._id;
            schoolData = foundSchool;
            this.schoolFilter.setValue(foundSchool.short_name);
          }
        }
      });
      if (schoolId && schoolData) {
        this.setSchoolFilter(schoolId, schoolData);
      }
    } else {
      this.schoolFilter.setValue('');
      this.setSchoolFilter(null);
    }
  }

  setSchoolFilter(schoolId: string, schoolData?) {
    this.filteredValues.school_id = schoolId;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getCertidegreeStudent();
    }
  }

  initFilter() {
    this.subs.sink = this.lastNameFilter.valueChanges.pipe(debounceTime(400)).subscribe((statusSearch) => {
      const symbol = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      if (!statusSearch.match(symbol) && !statusSearch.match(symbol1)) {
        this.filteredValues.full_name = statusSearch ? statusSearch.toLowerCase() : '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getCertidegreeStudent();
        }
      } else {
        this.lastNameFilter.setValue('');
        this.filteredValues.full_name = '';
        this.paginator.pageIndex = 0;
        if (!this.isReset) {
          this.getCertidegreeStudent();
        }
      }
    });
  }

  getFinalResultAfterReTake(result: string) {
    if (result === 'PASS1' || result === 'PASS2' || result === 'PASS3') {
      return 'PASS';
    } else if (result === 'FAILED' || result === 'ELIMINATED') {
      return 'FAILED';
    }
  }

  getSchoolDropdownList() {
    if (this.isUserADMTC) {
      this.subs.sink = this.schoolService.getschoolAndCity().subscribe((schoolList) => {
        let tempSchools = _.cloneDeep(schoolList);
        if (tempSchools && tempSchools.length) {
          tempSchools = tempSchools.filter(
            (school) => school && school.short_name && this.utilService.disregardSpace(school.short_name) !== '',
          );
        }

        this.schoolList = _.cloneDeep(tempSchools);
        this.originalSchoolList = _.cloneDeep(tempSchools);
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
      });
    } else if (this.permissions.getPermission('CR School Director') || this.permissions.getPermission('Certifier Admin')) {
      const currentUser = this.utilService.getCurrentUser();
      const schoolids = currentUser.entities ? currentUser.entities[0].school._id : '';
      const certifier_school = schoolids;
      this.subs.sink = this.schoolService.getAllSchoolsByCRToFilter(certifier_school).subscribe((schoolList: any) => {
        let tempSchools = _.cloneDeep(schoolList);
        if (tempSchools && tempSchools.length) {
          tempSchools = tempSchools.filter(
            (school) => school && school.short_name && this.utilService.disregardSpace(school.short_name) !== '',
          );
        }

        this.schoolList = _.cloneDeep(tempSchools);
        this.originalSchoolList = _.cloneDeep(tempSchools);
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
      });
    } else {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((res) => {
        const dataUSer = res.entities.filter((ent) => ent.type.name === userType);
        const title_ids = this.utilService.getAcademicAllAssignedTitle(dataUSer);
        this.subs.sink = this.schoolService.getAllSchoolsByTitleUserOwn(title_ids).subscribe((schoolList: any) => {
          let tempSchools = _.cloneDeep(schoolList);
          if (tempSchools && tempSchools.length) {
            tempSchools = tempSchools.filter(
              (school) => school && school.short_name && this.utilService.disregardSpace(school.short_name) !== '',
            );
          }

          this.schoolList = _.cloneDeep(tempSchools);
          this.originalSchoolList = _.cloneDeep(tempSchools);
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
        });
      });
    }
  }

  resetFilter() {
    this.selection.clear();
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });

    this.filteredValues = {
      school_id: '',
      full_name: '',
    };

    this.lastNameFilter.setValue('');
    this.schoolFilter.setValue('');

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    this.getSchoolDropdownList();
    this.getCertidegreeStudent();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
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

  showOptions(info) {
    const numSelected = this.selection.selected.length;
    if (numSelected > 0) {
      this.disabledGeneratePdfBtn = false;
    } else {
      this.disabledGeneratePdfBtn = true;
    }
    this.selectType = info;
    const data = this.selection.selected;
    this.userSelected = [];
    this.userSelectedId = [];
    data.forEach((user) => {
      this.userSelected.push(user);
      this.userSelectedId.push(user._id);
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
