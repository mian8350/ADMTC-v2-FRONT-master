import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import { SelectionModel } from '@angular/cdk/collections';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { ActivatedRoute, Router } from '@angular/router';
import { UntypedFormControl } from '@angular/forms';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { JuryKitDialogComponent } from 'app/jury-organization/jury-kit-dialog/jury-kit-dialog.component';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import {
  JuryOrganizationParameter,
  JuryOrganizationParameterTitle,
  JuryOrganizationParameterTitleSchool,
  SaveScheduleOfJuryRncpTitlePayload,
} from 'app/title-rncp/conditions/jury-organization-parameter/jury-organization-parameter.model';
import { TranslateService } from '@ngx-translate/core';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { UtilityService } from 'app/service/utility/utility.service';
import { constants } from 'http2';
import { truncate } from 'fs';

interface AssignedJuryPerSchool extends JuryOrganizationParameterTitle, JuryOrganizationParameterTitleSchool {}

@Component({
  selector: 'ms-assign-jury',
  templateUrl: './assign-jury.component.html',
  styleUrls: ['./assign-jury.component.scss'],
  providers: [ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class AssignJuryComponent implements OnInit, OnDestroy {
  private subs = new SubSink();

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['select', 'school', 'city', 'rncpTitle', 'students', 'date', 'backupDate', 'status', 'action'];
  filterColumns: string[] = [
    'selectFilter',
    'schoolFilter',
    'cityFilter',
    'rncpTitleFilter',
    'studentsFilter',
    'dateFilter',
    'backupDateFilter',
    'statusFilter',
    'actionFilter',
  ];

  schoolFilter = new UntypedFormControl('');
  schoolFilterList = [];
  filteredSchool: Observable<string[]>;

  cityFilter = new UntypedFormControl('');

  rncpTitleFilter = new UntypedFormControl('');
  rncpTitleFilterList = [];
  filteredRncpTitle: Observable<string[]>;

  statusFilter = new UntypedFormControl('all');
  filteredValues = {
    school: '',
    city: '',
    rncp_titles: '',
    status: 'all',
  };

  selection = new SelectionModel(true, []);
  schoolArray: any[] = [];
  filteredSchools: Observable<string[]>;
  retake_centers = [];
  name: string;
  statusList = [
    { id: 'all', name: 'AllM' },
    { id: 'yes', name: 'Active' },
    { id: 'no', name: 'Non Active' },
  ];
  isLoading = false;

  savedSCheduleJury = {
    rncp_titles: [],
    sent_to_certifier: false,
    lang: this.translate.currentLang,
  };

  juryOrgId: string;
  juryOrgData: JuryOrganizationParameter;
  // array of jury in each school of each titles
  // assignedJuryPerSchool: AssignedJuryPerSchool[] = [];
  assignedJuryPerSchool = [];
  // payload for rncp_titles field in SaveScheduleOfJury mutation
  jurySchedulesPerTitle: SaveScheduleOfJuryRncpTitlePayload[] = [];

  testData;
  grandOralParameterData: any;

  constructor(
    private juryOrganizationService: JuryOrganizationService,
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private juryService: JuryOrganizationService,
    private translate: TranslateService,
    private parseLocalToUTC: ParseLocalToUtcPipe,
    private parseUTCToLocal: ParseUtcToLocalPipe,
    private utilService: UtilityService,
  ) {}

  ngOnInit() {
    this.juryOrgId = this.route.snapshot.parent.parent.paramMap.get('juryOrgId');
    this.getAssignJuryData();
    this.grandOralParameterData = this.juryService.getGrandOralParameter();
    // this.subs.sink = this.juryOrganizationService.getAssignJury().subscribe((data: any) => {
    //   this.dataSource.data = data.assignJury;

    //   this.dataSource.sort = this.sort;
    //   this.dataSource.paginator = this.paginator;
    //   this.retake_centers = data.retake_centers;
    //   this.dataSource.data.forEach(el => {
    //     if (this.schoolArray.indexOf(el.school.shortName) === -1) {
    //       this.schoolArray.push(el.school.shortName);
    //     }
    //   });
    //   this.dataSource.data.forEach(el => {
    //     el.length = el.students.length
    //   })
    //   this.filteredSchools = this.schoolFilter.valueChanges.pipe(
    //     startWith(''),
    //     map(value => this._filterSchool(value)),
    //   );
    // });
    // this.name = this.route.snapshot.paramMap.get('id');

    // this.subs.sink = this.schoolFilter.valueChanges.subscribe(school => {
    //   this.filteredValues['school'] = school;
    //   this.dataSource.filter = JSON.stringify(this.filteredValues);
    // });

    // this.subs.sink = this.cityFilter.valueChanges.subscribe(city => {
    //   this.filteredValues['city'] = city;
    //   this.dataSource.filter = JSON.stringify(this.filteredValues);
    // });

    // this.subs.sink = this.rncpTitleFilter.valueChanges.subscribe(rncp_titles => {
    //   this.filteredValues['rncp_titles'] = rncp_titles;
    //   this.dataSource.filter = JSON.stringify(this.filteredValues);
    // });

    // this.subs.sink = this.statusFilter.valueChanges.subscribe(status => {
    //   this.filteredValues['status'] = status;
    //   this.dataSource.filter = JSON.stringify(this.filteredValues);
    // });
    // this.dataSource.filterPredicate = this.customFilterPredicate();
  }

  checkRedirect() {
    if (this.grandOralParameterData && this.grandOralParameterData.length === 0) {
      this.router
        .navigateByUrl('/', { skipLocationChange: true })
        .then(() => this.router.navigate(['jury-organization', this.juryOrgId, 'organize-juries', 'grand-oral-jury-parameter']));
    } else if (this.grandOralParameterData.length > 0) {
      const checknull = this.grandOralParameterData.includes(null);
      if (checknull) {
        this.router
          .navigateByUrl('/', { skipLocationChange: true })
          .then(() => this.router.navigate(['jury-organization', this.juryOrgId, 'organize-juries', 'grand-oral-jury-parameter']));
      }
    }
  }

  getAssignJuryData() {
    this.isLoading = true;
    this.subs.sink = this.juryService.getOneJuryOrganizationDataById(this.juryOrgId).subscribe(
      (resp) => {
        this.isLoading = false;
        this.juryOrgData = _.cloneDeep(resp);

        if (this.juryOrgData.type === 'grand_oral') {
          // this.checkRedirect();
        }
        this.getAssignJuryTableData();
      },
      (err) => {
        this.isLoading = false;

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: 'OK',
        });
      },
    );
  }

  getAssignJuryTableData() {
    if (this.juryOrgData && this.juryOrgData.rncp_titles && this.juryOrgData.rncp_titles.length) {
      this.assignedJuryPerSchool = [];
      this.mapDataJuryOrganization();
    }


    // this.assignedJuryPerSchool = this.assignedJuryPerSchool.filter((res) => res.is_school_selected_for_grand_oral);
    this.dataSource.data = this.assignedJuryPerSchool;
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;


    this.schoolFilterList = this.assignedJuryPerSchool.map((allData) => {
      return allData.school;
    });


    if (this.juryOrgData.type === 'grand_oral') {
      //   if (this.grandOralParameterData && this.grandOralParameterData.length > 0) {
      // const grandOralMap = this.mappingGrandOralSchoolSelected();
      // const filteredSchoolListSelected = this.updateSelectedFilterSchools(grandOralMap);
      const assignedJuryPerSchool = _.cloneDeep(this.assignedJuryPerSchool);
      this.assignedJuryPerSchool = assignedJuryPerSchool.filter((res) => res.is_school_selected_for_grand_oral);
      this.schoolFilterList = this.assignedJuryPerSchool.map((allData) => {
        return allData.school;
      });
      this.dataSource.data = _.uniq(this.assignedJuryPerSchool);

    }
    this.schoolFilterList = _.uniq(this.schoolFilterList);
    this.filteredSchool = of(this.schoolFilterList);
    this.rncpTitleFilterList = this.assignedJuryPerSchool.map((allData) => {
      return allData.rncp_id;
    });
    this.rncpTitleFilterList = _.uniq(this.rncpTitleFilterList);
    this.filteredRncpTitle = of(this.rncpTitleFilterList);


    this.isAllJuryAssigned();

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'school':
          return item.school && item.school.short_name ? item.school.short_name : null;
        case 'rncp_titles':
          return item.rncp_id && item.rncp_id.short_name ? item.rncp_id.short_name : null;
        case 'city':
          return item.school && item.school.school_address && item.school.school_address[0] ? item.school.school_address[0].city : null;
        case 'status':
          return item ? item.is_jury_assigned : null;
        case 'students':
          return item.students && item.students.length ? item.students.length : null;
        default:
          return item[property];
      }
    };

    this.subs.sink = this.schoolFilter.valueChanges.subscribe((school) => {
      // this.filteredValues['school'] = school;
      // this.dataSource.filter = JSON.stringify(this.filteredValues);
      if (typeof school === 'string') {
        const result = this.schoolFilterList.filter((schoolData) =>
          this.utilService.simplifyRegex(schoolData.short_name).includes(this.utilService.simplifyRegex(school)),
        );

        this.filteredSchool = of(result);
      }
    });

    this.subs.sink = this.cityFilter.valueChanges.subscribe((city) => {
      this.filteredValues['city'] = city;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.rncpTitleFilter.valueChanges.subscribe((rncp_titles) => {
      // this.filteredValues['rncp_titles'] = rncp_titles;
      // this.dataSource.filter = JSON.stringify(this.filteredValues);
      if (typeof rncp_titles === 'string') {
        const result = this.rncpTitleFilterList.filter((title) =>
          this.utilService.simplifyRegex(title.short_name).includes(this.utilService.simplifyRegex(rncp_titles)),
        );

        this.filteredRncpTitle = of(result);
      }
    });

    this.subs.sink = this.statusFilter.valueChanges.subscribe((status) => {
      this.filteredValues['status'] = status;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.dataSource.filterPredicate = this.customFilterPredicate();
  }

  mappingGrandOralSchoolSelected() {
    let grandOralMap = [];
    this.grandOralParameterData.map((res) => {
      if (res) {
        res.schools.map((school) => {
          if (school) {
            grandOralMap.push(school);
          }
        });
      }
    });
    return grandOralMap;
  }

  updateSelectedFilterSchools(grandOralMap) {
    let filteredSchoolListSelected = [];
    for (let arr in this.schoolFilterList) {
      for (let filter in grandOralMap) {
        if (this.schoolFilterList[arr]._id == grandOralMap[filter]._id) {
          filteredSchoolListSelected.push(this.schoolFilterList[arr]);
        }
      }
    }
    return filteredSchoolListSelected;
  }

  updateDataSourceSchoolSelected(assignedJuryPerSchool, filteredSchoolListSelected) {
    let newDataSource = [];
    for (let arr in assignedJuryPerSchool) {
      for (let filter in filteredSchoolListSelected) {
        if (assignedJuryPerSchool[arr].school._id == filteredSchoolListSelected[filter]._id) {
          newDataSource.push(assignedJuryPerSchool[arr]);
        }
      }
    }
    return newDataSource;
  }

  mapDataJuryOrganization() {
    _.forEach(this.juryOrgData.rncp_titles, (title, key) => {
      this.savedSCheduleJury.rncp_titles.push({
        rncp_id: title.rncp_id ? title.rncp_id['_id'] : '',
        class_id: title.class_id ? title.class_id['_id'] : '',
        test_id: title.test_id ? title.test_id['_id'] : '',
        schools: [],
      });
      _.forEach(title.schools, (school, key2) => {
        if (this.juryOrgData && this.juryOrgData.type === 'retake_jury') {
          this.assignedJuryPerSchool.push({
            rncp_id: title['rncp_id'],
            school: school.school,
            number_of_jury: school['number_of_jury'] ? school['number_of_jury'] : undefined,
            date_finish: school.date_finish
              ? this.convertUTCToLocalDate({ date: school.date_finish, time_start: school.time_finish ? school.time_finish : '07:00' })
              : '',
            date_start: school.date_start
              ? this.convertUTCToLocalDate({ date: school.date_start, time_start: school.time_start ? school.time_start : '07:00' })
              : '',
            time_start: school.time_start ? this.parseUTCToLocal.transform(school.time_start) : '',
            time_finish: school.time_finish ? this.parseUTCToLocal.transform(school.time_finish) : '',
            backup_time_start: school.time_finish ? this.parseUTCToLocal.transform(school.time_finish) : '',
            backup_time_finish: school.time_finish ? this.parseUTCToLocal.transform(school.time_finish) : '',
            backup_date_start: school.backup_date_start
              ? this.convertUTCToLocalDate({
                  date: school.backup_date_start,
                  time_start: school.backup_time_start ? school.backup_time_start : '07:00',
                })
              : '',
            backup_date_finish: school.backup_date_finish
              ? this.convertUTCToLocalDate({
                  date: school.backup_date_finish,
                  time_start: school.backup_time_finish ? school.backup_time_finish : '07:00',
                })
              : '',
            class_id: title.class_id ? title.class_id['_id'] : '',
            test_id: title.test_id ? title.test_id['_id'] : '',
            // retake_center: school.retake_center ? school.retake_center : null,
            students:
              school.students && school.students.length
                ? school.students.map((data) => {
                    if (data && data._id) {
                      return data._id;
                    }
                  })
                : [],
            is_jury_assigned: school['is_jury_assigned'],
            test_groups:
              school.test_groups && school.test_groups.length
                ? school.test_groups.map((data) => {
                    if (data && data._id) {
                      return data._id;
                    }
                  })
                : [],
            testData: title.test_id,
          });
        } else if (this.juryOrgData && this.juryOrgData.type === 'grand_oral') {
          this.assignedJuryPerSchool.push({
            rncp_id: title['rncp_id'],
            school: school.school,
            number_of_jury: school['number_of_jury'] ? school['number_of_jury'] : undefined,
            date_finish: school.date_finish
              ? this.convertUTCToLocalDate({ date: school.date_finish, time_start: school.time_finish ? school.time_finish : '07:00' })
              : '',
            date_start: school.date_start
              ? this.convertUTCToLocalDate({ date: school.date_start, time_start: school.time_start ? school.time_start : '07:00' })
              : '',
            is_school_selected_for_grand_oral: school.is_school_selected_for_grand_oral,
            time_start: school.time_start ? this.parseUTCToLocal.transform(school.time_start) : '',
            time_finish: school.time_finish ? this.parseUTCToLocal.transform(school.time_finish) : '',
            backup_time_start: school.time_finish ? this.parseUTCToLocal.transform(school.time_finish) : '',
            backup_time_finish: school.time_finish ? this.parseUTCToLocal.transform(school.time_finish) : '',
            backup_date_start: school.backup_date_start
              ? this.convertUTCToLocalDate({
                  date: school.backup_date_start,
                  time_start: school.backup_time_start ? school.backup_time_start : '07:00',
                })
              : '',
            backup_date_finish: school.backup_date_finish
              ? this.convertUTCToLocalDate({
                  date: school.backup_date_finish,
                  time_start: school.backup_time_finish ? school.backup_time_finish : '07:00',
                })
              : '',
            class_id: title.class_id ? title.class_id['_id'] : '',
            test_id: title.test_id ? title.test_id['_id'] : '',
            students: school.students,
            is_jury_assigned: school['is_jury_assigned'],
            test_groups:
              school.test_groups && school.test_groups.length
                ? school.test_groups.map((data) => {
                    if (data && data._id) {
                      return data._id;
                    }
                  })
                : [],
            testData: title.test_id,
          });
        } else {
          this.assignedJuryPerSchool.push({
            rncp_id: title['rncp_id'],
            school: school.school,
            number_of_jury: school['number_of_jury'] ? school['number_of_jury'] : undefined,
            date_finish: school.date_finish
              ? this.convertUTCToLocalDate({ date: school.date_finish, time_start: school.time_finish ? school.time_finish : '07:00' })
              : '',
            date_start: school.date_start
              ? this.convertUTCToLocalDate({ date: school.date_start, time_start: school.time_start ? school.time_start : '07:00' })
              : '',
            time_start: school.time_start ? this.parseUTCToLocal.transform(school.time_start) : '',
            time_finish: school.time_finish ? this.parseUTCToLocal.transform(school.time_finish) : '',
            backup_time_start: school.time_finish ? this.parseUTCToLocal.transform(school.time_finish) : '',
            backup_time_finish: school.time_finish ? this.parseUTCToLocal.transform(school.time_finish) : '',
            backup_date_start: school.backup_date_start
              ? this.convertUTCToLocalDate({
                  date: school.backup_date_start,
                  time_start: school.backup_time_start ? school.backup_time_start : '07:00',
                })
              : '',
            backup_date_finish: school.backup_date_finish
              ? this.convertUTCToLocalDate({
                  date: school.backup_date_finish,
                  time_start: school.backup_time_finish ? school.backup_time_finish : '07:00',
                })
              : '',
            class_id: title.class_id ? title.class_id['_id'] : '',
            test_id: title.test_id ? title.test_id['_id'] : '',
            // retake_center: school.retake_center ? school.retake_center : null,
            students:
              school.students && school.students.length
                ? school.students.map((data) => {
                    if (data && data._id) {
                      return data._id;
                    }
                  })
                : [],
            is_jury_assigned: school['is_jury_assigned'],
            test_groups:
              school.test_groups && school.test_groups.length
                ? school.test_groups.map((data) => {
                    if (data && data._id) {
                      return data._id;
                    }
                  })
                : [],
            testData: title.test_id,
          });
        }
      });
    });
  }

  setSchoolFilter(schoolId: string) {
    this.filteredValues['school'] = schoolId ? schoolId : '';
    this.dataSource.filter = JSON.stringify(this.filteredValues);
  }

  setTitleFilter(titleId: string) {
    this.filteredValues['rncp_titles'] = titleId ? titleId : '';
    this.dataSource.filter = JSON.stringify(this.filteredValues);
  }

  private _filterSchool(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.schoolArray.filter((option) => option.toLowerCase().includes(filterValue));
  }

  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.dataSource.data.forEach((row) => this.selection.select(row));
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

  selectRetakeCenter(event, element) {
    this.dataSource.data.forEach((el) => {
      if (el._id === element._id) {
        el.retake_center = event.source.value;
      }
    });
  }

  goToAssignNumberJury(juryData: any) {

    const validated = this.validateTestBeforeAssignNumber(juryData);
    if (validated) {
      this.router.navigate([
        'jury-organization',
        this.juryOrgId,
        'assign-number-of-jury',
        juryData.school._id,
        juryData.rncp_id._id,
        juryData.class_id,
      ]);
    } else {
      this.showSwalTestNotValidated();
    }
  }

  validateTestBeforeAssignNumber(juryData): boolean {
    let result = true;

    // *************** Validate if test is published
    if (juryData && juryData.testData) {
      result = juryData.testData && juryData.testData.is_published ? juryData.testData.is_published : false;
    }

    // ************** Validate if test is group test, the school already assign the group
    if (juryData && juryData.testData && juryData.testData.group_test) {
      result = juryData.test_groups && juryData.test_groups.length ? true : false;
    }

    return result;
  }

  showSwalTestNotValidated() {
    Swal.fire({
      type: 'error',
      title: this.translate.instant('JURY_ASSIGN_NUMBER_NOT_VALID.TITLE'),
      html: this.translate.instant('JURY_ASSIGN_NUMBER_NOT_VALID.TEXT'),
      footer: `<span style="margin-left: auto">JURY_ASSIGN_NUMBER_NOT_VALID</span>`,
      confirmButtonText: this.translate.instant('JURY_ASSIGN_NUMBER_NOT_VALID.BUTTON'),
    });
  }

  customFilterPredicate() {
    return function (data, filter: string): boolean {
      const searchString = JSON.parse(filter);

      const schoolFound =
        data.school && data.school._id
          ? data.school._id.toString().trim().toLowerCase().indexOf(searchString.school.toLowerCase()) !== -1
          : false;

      const cityFound =
        data.school && data.school.school_address && data.school.school_address[0] && data.school.school_address[0].city
          ? data.school.school_address[0].city.toString().trim().toLowerCase().indexOf(searchString.city.toLowerCase()) !== -1
          : false;

      const rncp_titlesFound =
        data.rncp_id && data.rncp_id._id
          ? data.rncp_id._id.toString().trim().toLowerCase().indexOf(searchString.rncp_titles.toLowerCase()) !== -1
          : data.rncp_id._id;

      let status = '';
      if (data.is_jury_assigned === true) {
        status = 'yes';
      } else if (data.is_jury_assigned === false) {
        status = 'no';
      } else {
        status = 'all';
      }
      const statusFound =
        searchString.status === 'all' ? true : status.toString().trim().toLowerCase().indexOf(searchString.status.toLowerCase()) !== -1;

      return schoolFound && cityFound && rncp_titlesFound && statusFound;
    };
  }

  resetAllFilter() {
    this.filteredValues = {
      school: '',
      city: '',
      rncp_titles: '',
      status: 'all',
    };
    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.schoolFilter.setValue('');
    this.cityFilter.setValue('');
    this.rncpTitleFilter.setValue('');
    this.statusFilter.setValue('all');
  }

  openJuryKit() {

    this.dialog
      .open(JuryKitDialogComponent, {
        panelClass: 'certification-rule-pop-up',
        width: '600px',
        data: this.juryOrgData,
        disableClose: true,
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          // After updating jury kit, cannot save with school error. data us mutated with getAssignJuryData
          // this.getAssignJuryData();
          this.router
            .navigateByUrl('/', { skipLocationChange: true })
            .then(() => this.router.navigate(['jury-organization', this.juryOrgId, 'organize-juries', 'assign-jury']));
        }
      });
  }

  isAllJuryAssigned(): boolean {
    let isAllAssigned = false;
    for (const jury of this.assignedJuryPerSchool) {
      if (jury.is_jury_assigned) {
        isAllAssigned = true;
      } else {
        isAllAssigned = false;
        break;
      }
    }

    if (this.juryOrgData && this.juryOrgData.type === 'retake_jury') {
      isAllAssigned = true;
      for (const jury of this.assignedJuryPerSchool) {
        if (jury.is_jury_assigned) {
          isAllAssigned = true;
        } else {
          isAllAssigned = false;
          break;
        }
        // if (!jury.retake_center) {
        //   isAllAssigned = false;
        //   break;
        // }
      }
    }

    return isAllAssigned;
  }

  submitToCertifier() {
    this.mapDataBeforeSaved();
    this.savedSCheduleJury.sent_to_certifier = true;

    Swal.fire({
      type: 'question',
      title: this.translate.instant('JURY_ORGANIZATION.JURY_S5.TITLE'),
      html: this.translate.instant('JURY_ORGANIZATION.JURY_S5.TEXT', {
        juryOrgName: this.juryOrgData.name,
      }),
      footer: `<span style="margin-left: auto">JURY_S5</span>`,
      showCancelButton: true,
      allowEscapeKey: true,
      confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S5.CONFIRM_BTN'),
      cancelButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S5.CANCEL_BTN'),
    }).then(
      (isComfirm) => {
        if (isComfirm.value) {
          this.subs.sink = this.juryService
            .sendAssignNumberJuryToCertifier(
              this.juryOrgId,
              this.savedSCheduleJury.lang,
              this.savedSCheduleJury.sent_to_certifier,
              this.savedSCheduleJury.rncp_titles,
            )
            .subscribe((data) => {
              Swal.fire({
                type: 'success',
                title: this.translate.instant('Bravo !'),
              }).then((res) => {
                this.router
                  .navigateByUrl('/', { skipLocationChange: true })
                  .then(() => this.router.navigate(['jury-organization', this.juryOrgId, 'organize-juries', 'assign-president-jury']));
              });
            });
        }
      },
      (dismiss) => {},
    );
  }

  mapDataBeforeSaved() {


    this.savedSCheduleJury.lang = this.translate.currentLang;
    for (let i = 0; i < this.savedSCheduleJury.rncp_titles.length; i++) {
      for (let j = 0; j < this.assignedJuryPerSchool.length; j++) {
        if (this.assignedJuryPerSchool[j].rncp_id['_id'] === this.savedSCheduleJury.rncp_titles[i]['rncp_id']) {
          this.savedSCheduleJury.rncp_titles[i].schools.push({
            school: this.assignedJuryPerSchool[j]['school']['_id'],
            number_of_jury: this.assignedJuryPerSchool[j] ? this.assignedJuryPerSchool[j]['number_of_jury'] : 0,
            date_start: this.assignedJuryPerSchool[j]
              ? this.convertLocalDateToUTC({
                  date: this.assignedJuryPerSchool[j]['date_start'],
                  time_start: this.assignedJuryPerSchool[j]['time_start'],
                })
              : '',
            date_finish: this.assignedJuryPerSchool[j]
              ? this.convertLocalDateToUTC({
                  date: this.assignedJuryPerSchool[j]['date_finish'],
                  time_start: this.assignedJuryPerSchool[j]['time_finish'],
                })
              : '',
            backup_date_start: this.assignedJuryPerSchool[j]
              ? this.convertLocalDateToUTC({
                  date: this.assignedJuryPerSchool[j]['backup_date_start'],
                  time_start: this.assignedJuryPerSchool[j]['backup_time_start'],
                })
              : '',
            backup_date_finish: this.assignedJuryPerSchool[j]
              ? this.convertLocalDateToUTC({
                  date: this.assignedJuryPerSchool[j]['backup_date_finish'],
                  time_start: this.assignedJuryPerSchool[j]['backup_time_finish'],
                })
              : '',
            time_start: this.assignedJuryPerSchool[j] ? this.parseLocalToUTC.transform(this.assignedJuryPerSchool[j]['time_start']) : '',
            time_finish: this.assignedJuryPerSchool[j] ? this.parseLocalToUTC.transform(this.assignedJuryPerSchool[j]['time_finish']) : '',
            backup_time_start: this.assignedJuryPerSchool[j]
              ? this.parseLocalToUTC.transform(this.assignedJuryPerSchool[j]['backup_time_start'])
              : '',
            backup_time_finish: this.assignedJuryPerSchool[j]
              ? this.parseLocalToUTC.transform(this.assignedJuryPerSchool[j]['backup_time_finish'])
              : '',
            students: this.assignedJuryPerSchool[j] ? this.assignedJuryPerSchool[j]['students'] : [],
            test_groups: this.assignedJuryPerSchool[j] ? this.assignedJuryPerSchool[j]['test_groups'] : [],
            is_jury_assigned: this.assignedJuryPerSchool[j] ? this.assignedJuryPerSchool[j]['is_jury_assigned'] : '',
          });

          // if (this.juryOrgData && this.juryOrgData.type === 'retake_jury') {
          //   this.savedSCheduleJury.rncp_titles[i].schools.push({
          //     rncp_id: this.assignedJuryPerSchool[j]['rncp_id']['_id'],
          //     school: this.assignedJuryPerSchool[j]['school']['_id'],
          //     number_of_jury: this.assignedJuryPerSchool[j] ? this.assignedJuryPerSchool[j]['number_of_jury'] : 0,
          //     date_start: this.assignedJuryPerSchool[j]
          //       ? this.convertLocalDateToUTC({
          //           date: this.assignedJuryPerSchool[j]['date_start'],
          //           time_start: this.assignedJuryPerSchool[j]['time_start'],
          //         })
          //       : '',
          //     date_finish: this.assignedJuryPerSchool[j]
          //       ? this.convertLocalDateToUTC({
          //           date: this.assignedJuryPerSchool[j]['date_finish'],
          //           time_start: this.assignedJuryPerSchool[j]['time_finish'],
          //         })
          //       : '',
          //     backup_date_start: this.assignedJuryPerSchool[j]
          //       ? this.convertLocalDateToUTC({
          //           date: this.assignedJuryPerSchool[j]['backup_date_start'],
          //           time_start: this.assignedJuryPerSchool[j]['backup_time_start'],
          //         })
          //       : '',
          //     backup_date_finish: this.assignedJuryPerSchool[j]
          //       ? this.convertLocalDateToUTC({
          //           date: this.assignedJuryPerSchool[j]['backup_date_finish'],
          //           time_start: this.assignedJuryPerSchool[j]['backup_time_finish'],
          //         })
          //       : '',
          //     time_start: this.assignedJuryPerSchool[j] ? this.parseLocalToUTC.transform(this.assignedJuryPerSchool[j]['time_start']) : '',
          //     time_finish: this.assignedJuryPerSchool[j]
          //       ? this.parseLocalToUTC.transform(this.assignedJuryPerSchool[j]['time_finish'])
          //       : '',
          //     backup_time_start: this.assignedJuryPerSchool[j]
          //       ? this.parseLocalToUTC.transform(this.assignedJuryPerSchool[j]['backup_time_start'])
          //       : '',
          //     backup_time_finish: this.assignedJuryPerSchool[j]
          //       ? this.parseLocalToUTC.transform(this.assignedJuryPerSchool[j]['backup_time_finish'])
          //       : '',
          //     students: this.assignedJuryPerSchool[j] ? this.assignedJuryPerSchool[j]['students'] : [],
          //     test_groups: this.assignedJuryPerSchool[j] ? this.assignedJuryPerSchool[j]['test_groups'] : [],
          //     // retake_center: this.assignedJuryPerSchool[j] ? this.assignedJuryPerSchool[j]['retake_center']['_id'] : '',
          //     is_jury_assigned: this.assignedJuryPerSchool[j] ? this.assignedJuryPerSchool[j]['is_jury_assigned'] : '',
          //   });
          // } else {
          //   this.savedSCheduleJury.rncp_titles[i].schools.push({
          //     school: this.assignedJuryPerSchool[j]['school']['_id'],
          //     number_of_jury: this.assignedJuryPerSchool[j] ? this.assignedJuryPerSchool[j]['number_of_jury'] : 0,
          //     date_start: this.assignedJuryPerSchool[j]
          //       ? this.convertLocalDateToUTC({
          //           date: this.assignedJuryPerSchool[j]['date_start'],
          //           time_start: this.assignedJuryPerSchool[j]['time_start'],
          //         })
          //       : '',
          //     date_finish: this.assignedJuryPerSchool[j]
          //       ? this.convertLocalDateToUTC({
          //           date: this.assignedJuryPerSchool[j]['date_finish'],
          //           time_start: this.assignedJuryPerSchool[j]['time_finish'],
          //         })
          //       : '',
          //     backup_date_start: this.assignedJuryPerSchool[j]
          //       ? this.convertLocalDateToUTC({
          //           date: this.assignedJuryPerSchool[j]['backup_date_start'],
          //           time_start: this.assignedJuryPerSchool[j]['backup_time_start'],
          //         })
          //       : '',
          //     backup_date_finish: this.assignedJuryPerSchool[j]
          //       ? this.convertLocalDateToUTC({
          //           date: this.assignedJuryPerSchool[j]['backup_date_finish'],
          //           time_start: this.assignedJuryPerSchool[j]['backup_time_finish'],
          //         })
          //       : '',
          //     time_start: this.assignedJuryPerSchool[j] ? this.parseLocalToUTC.transform(this.assignedJuryPerSchool[j]['time_start']) : '',
          //     time_finish: this.assignedJuryPerSchool[j]
          //       ? this.parseLocalToUTC.transform(this.assignedJuryPerSchool[j]['time_finish'])
          //       : '',
          //     backup_time_start: this.assignedJuryPerSchool[j]
          //       ? this.parseLocalToUTC.transform(this.assignedJuryPerSchool[j]['backup_time_start'])
          //       : '',
          //     backup_time_finish: this.assignedJuryPerSchool[j]
          //       ? this.parseLocalToUTC.transform(this.assignedJuryPerSchool[j]['backup_time_finish'])
          //       : '',
          //     students: this.assignedJuryPerSchool[j] ? this.assignedJuryPerSchool[j]['students'] : [],
          //     test_groups: this.assignedJuryPerSchool[j] ? this.assignedJuryPerSchool[j]['test_groups'] : [],
          //     is_jury_assigned: this.assignedJuryPerSchool[j] ? this.assignedJuryPerSchool[j]['is_jury_assigned'] : '',
          //   });
          // }
        }
      }
    }
    if (this.juryOrgData.type === 'grand_oral') {
      this.mapBlockGrandOral();
    }
  }

  mapBlockGrandOral() {

    // for push block grand oral
    for (let i = 0; i < this.juryOrgData.rncp_titles.length; i++) {
      for (let j = 0; j < this.savedSCheduleJury.rncp_titles.length; j++) {
        if (this.juryOrgData.rncp_titles[i]['rncp_id']['_id'] === this.savedSCheduleJury.rncp_titles[j]['rncp_id']) {

          this.savedSCheduleJury.rncp_titles[i].schools = this.juryOrgData.rncp_titles[j]['schools'].map((res) => {
            return {
              backup_date_finish: res.backup_time_finish,
              backup_date_start: res.backup_date_start,
              backup_time_finish: res.backup_time_finish,
              backup_time_start: res.backup_time_start,
              date_finish: res.date_finish,
              date_start: res.date_start,
              is_jury_assigned: res.is_jury_assigned,
              is_school_selected_for_grand_oral: res.is_school_selected_for_grand_oral,
              number_of_jury: res.number_of_jury,
              retake_center: res.retake_center,
              school: res.school._id,
              students: res.students.map((st) => st._id),
              test_groups: res.test_groups,
              time_finish: res.time_finish,
              time_start: res.time_start,
            };
          });
          this.savedSCheduleJury.rncp_titles[i].blocks_for_grand_oral = this.juryOrgData.rncp_titles[j]['blocks_for_grand_oral'].map(
            (res: any) => {
              return {
                block_id: res.block_id._id,
                is_selected: res.is_selected,
              };
            },
          );
          this.savedSCheduleJury.rncp_titles[i].send_grand_oral_pdf_to_jury =
            this.juryOrgData.rncp_titles[j]['send_grand_oral_pdf_to_jury'];
          this.savedSCheduleJury.rncp_titles[i].send_grand_oral_pdf_to_jury_schedule =
            this.juryOrgData.rncp_titles[j]['send_grand_oral_pdf_to_jury_schedule'];
          this.savedSCheduleJury.rncp_titles[i].send_grand_oral_pdf_to_student =
            this.juryOrgData.rncp_titles[j]['send_grand_oral_pdf_to_student'];
          this.savedSCheduleJury.rncp_titles[i].send_grand_oral_pdf_to_student_schedule =
            this.juryOrgData.rncp_titles[j]['send_grand_oral_pdf_to_student_schedule'];
          this.savedSCheduleJury.rncp_titles[i].student_required_upload_cv = this.juryOrgData.rncp_titles[j]['student_required_upload_cv'];
          this.savedSCheduleJury.rncp_titles[i].student_required_upload_cv_schedule =
            this.juryOrgData.rncp_titles[j]['student_required_upload_cv_schedule'];
          this.savedSCheduleJury.rncp_titles[i].student_required_upload_presentation =
            this.juryOrgData.rncp_titles[j]['student_required_upload_presentation'];
          this.savedSCheduleJury.rncp_titles[i].student_required_upload_presentation_schedule =
            this.juryOrgData.rncp_titles[j]['student_required_upload_presentation_schedule'];
          this.savedSCheduleJury.rncp_titles[i].grand_oral_proposition =
            this.juryOrgData.rncp_titles[j]['grand_oral_proposition'];
        }
      }
    }

  }

  convertUTCToLocalDate(data) {
    const date = moment(data.date).format('DD/MM/YYYY');
    const time = data.time_start;

    const dateTimeInLocal = moment(date + time, 'DD/MM/YYYYHH:mm');
    return dateTimeInLocal.toISOString();
  }

  convertLocalDateToUTC(data) {

    const date = moment(data.date).format('DD/MM/YYYY');
    const time = data.time_start;

    const dateTimeInUTC = moment(date + time, 'DD/MM/YYYYHH:mm');

    return dateTimeInUTC.toISOString();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
