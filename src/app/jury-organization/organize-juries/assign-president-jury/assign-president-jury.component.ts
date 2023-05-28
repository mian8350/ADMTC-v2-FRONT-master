import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import { SelectionModel } from '@angular/cdk/collections';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { UntypedFormControl, UntypedFormGroup, Validators, UntypedFormBuilder } from '@angular/forms';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import {
  JuryMember,
  JuryOrganizationParameter,
  JuryData,
} from 'app/title-rncp/conditions/jury-organization-parameter/jury-organization-parameter.model';
import { ActivatedRoute, Router } from '@angular/router';
import cloneDeep from 'lodash/cloneDeep';
import Swal from 'sweetalert2';
import { UsersService } from 'app/service/users/users.service';
import { removeSpaces } from 'app/service/customvalidator.validator';

// interface JuryMemberModel {
//   id: string;
//   text: string;
// }
interface JuryMemberPayload {
  _id: string;
  president_of_jury: string;
}

@Component({
  selector: 'ms-assign-president-jury',
  templateUrl: './assign-president-jury.component.html',
  styleUrls: ['./assign-president-jury.component.scss'],
})
export class AssignPresidentJuryComponent implements OnInit, OnDestroy {
  addGroupForm: UntypedFormGroup;
  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = [
    'select',
    'jury_serial_number',
    'date_start',
    'school',
    'city',
    'rncpTitles',
    'students',
    'president_of_jury',
  ];
  filterColumns: string[] = [
    'selectFilter',
    'jurySerialNumberFilter',
    'dateStartFilter',
    'schoolFilter',
    'cityFilter',
    'rncpTitlesFilter',
    'studentsFilter',
    'presidentJuryFilter',
  ];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  private subs = new SubSink();
  selection = new SelectionModel(true, []);

  dateFromFilter = new UntypedFormControl('');
  dateToFilter = new UntypedFormControl('');
  dateStartFilter = new UntypedFormControl('');
  schoolFilter = new UntypedFormControl('');
  cityFilter = new UntypedFormControl('');
  rncpTitlesFilter = new UntypedFormControl('');
  presidentJuryFilter = new UntypedFormControl('');
  filteredValues = {
    dateFrom: '',
    dateTo: '',
    dateStart: '',
    school: '',
    city: '',
    rncpTitles: '',
    presidentJury: '',
  };
  isLoading = false;
  isSubmit = false;
  isSave = false;

  isFilteringDateStart = false;
  isFilteringDateFromOrTo = false;

  juryOrgId: string;
  juryOrgData: JuryOrganizationParameter;
  juryMembers: JuryMember[] = [];
  presidentOfJuries: JuryData[];
  allData = null;

  constructor(
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private juryOrganizationService: JuryOrganizationService,
    private translate: TranslateService,
    private router: Router,
    private usersService: UsersService,
  ) {}

  ngOnInit() {
    this.juryOrgId = this.route.snapshot.parent.parent.paramMap.get('juryOrgId');
    this.getJuryOrgData();
    this.getTableData();
    this.initFilterAndSorting();
  }
  initForm() {
    this.addGroupForm = this.fb.group({
      name: ['', [Validators.required, removeSpaces]],
    });
  }

  getJuryOrgData() {
    this.isLoading = true;
    this.juryOrganizationService.getOneJuryOrganizationDataById(this.juryOrgId).subscribe((resp) => {
      this.isLoading = false;
      this.juryOrgData = cloneDeep(resp);
      // this.getPresidentOfJuries();
      this.getPresidentOfJuryUserType();
    });
  }

  isPresidentJuryPopulated() {
    let isAnyRowPopulated = false;
    // use for loop so we can break
    for (const row of this.dataSource.data) {
      // check if there is any president_of_jury field populated, then return true
      if (row.president_of_jury) {
        isAnyRowPopulated = true;
        break;
      }
    }
    return isAnyRowPopulated;
  }

  getTableData() {
    this.isLoading = true;
    this.subs.sink = this.juryOrganizationService.getAllJuryMembers(this.juryOrgId).subscribe((data) => {
      this.isLoading = false;
      this.juryMembers = cloneDeep(data);
      this.juryMembers.forEach((juryMember) => {
        juryMember.jury_serial_number =
          juryMember.jury_serial_number.slice(0, 8) +
          '-' +
          juryMember.jury_serial_number.slice(8, 11) +
          '-' +
          juryMember.jury_serial_number.slice(11, 14);
        // make field president_of_jury value become _id instead of object
        juryMember.presidentJury = juryMember.president_of_jury;
        juryMember.president_of_jury = juryMember.president_of_jury ? juryMember.president_of_jury._id : null;
      });

      this.dataSource.data = this.juryMembers;
      this.checkSubmitEnable();
      this.allData = cloneDeep(this.juryMembers);
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
    });
  }

  checkSubmitEnable() {
    const isSavedBefore = this.isAllDataPopulated();
    if (isSavedBefore) {
      this.isSubmit = true;
    } else {
      this.isSubmit = false;
    }
  }

  checkComparasion() {
    const dataSource = JSON.stringify(this.dataSource.data);
    const savedDataSource = JSON.stringify(this.allData);
    const payload = this.createJuryMemberPayload();
    const isNoEmptyPresidentOfJury = payload.filter((resp) => resp.president_of_jury);
    if (isNoEmptyPresidentOfJury && isNoEmptyPresidentOfJury.length) {
      if (dataSource === savedDataSource) {
        this.checkSubmitEnable();
        return true;
      } else {
        this.isSubmit = false;
        return false;
      }
    } else {
      this.isSubmit = false;
      return true;
    }
  }

  getPresidentOfJuryUserType() {
    this.isLoading = true;
    this.usersService.getUserTypeId('President of Jury').subscribe((resp) => {
      this.isLoading = false;
      if (resp && resp[0] && resp[0]._id) {
        const presidentUserTypeId = resp[0]._id;
        this.getPresidentOfJuries(presidentUserTypeId);
      }
    });
  }

  getPresidentOfJuries(presidentUserTypeId: string) {
    const userTypeName = 'President of Jury';
    const school = [];
    let rncpTitle = [];

    if (this.juryOrgData && this.juryOrgData.certifier && this.juryOrgData.certifier._id) {
      school.push(this.juryOrgData.certifier._id);
    }
    if (this.juryOrgData && this.juryOrgData.rncp_titles) {
      rncpTitle = this.juryOrgData.rncp_titles.map((title) => title.rncp_id._id);
    }
    if (presidentUserTypeId && school.length && rncpTitle.length) {
      this.isLoading = true;
      this.juryOrganizationService.getJuries([presidentUserTypeId], school, rncpTitle).subscribe((resp) => {
        this.isLoading = false;
        this.presidentOfJuries = resp;


        this.presidentOfJuries.sort((a, b) => {
          let nameA = a.last_name;
          let nameB = b.last_name;
          if (nameA < nameB) {
            return -1;
          }
          if (nameA > nameB) {
            return 1;
          }
          return 0;
        });
      });
    }
  }

  initFilterAndSorting() {
    this.subs.sink = this.dateFromFilter.valueChanges.subscribe((date) => {
      this.filteredValues['dateFrom'] = '';
      if (!this.isFilteringDateStart) {
        this.filteredValues['dateFrom'] = date;
        this.isFilteringDateFromOrTo = true;
        this.dateStartFilter.setValue('');
        this.dataSource.filter = JSON.stringify(this.filteredValues);
      }
    });

    this.subs.sink = this.dateToFilter.valueChanges.subscribe((date) => {
      this.filteredValues['dateTo'] = '';
      if (!this.isFilteringDateStart) {
        this.filteredValues['dateTo'] = date;
        this.isFilteringDateFromOrTo = true;
        this.dataSource.filter = JSON.stringify(this.filteredValues);
      }
    });

    this.subs.sink = this.dateStartFilter.valueChanges.subscribe((dateStart) => {
      this.filteredValues['dateStart'] = '';
      if (!this.isFilteringDateFromOrTo) {
        this.filteredValues['dateStart'] = dateStart;
        this.isFilteringDateStart = true;
        this.dateFromFilter.setValue('');
        this.dateToFilter.setValue('');
        this.dataSource.filter = JSON.stringify(this.filteredValues);
      }
    });

    this.subs.sink = this.schoolFilter.valueChanges.subscribe((school) => {
      this.filteredValues['school'] = school;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.cityFilter.valueChanges.subscribe((city) => {
      this.filteredValues['city'] = city;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.rncpTitlesFilter.valueChanges.subscribe((rncpTitles) => {
      this.filteredValues['rncpTitles'] = rncpTitles;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.presidentJuryFilter.valueChanges.subscribe((presidentJury) => {
      this.filteredValues['presidentJury'] = presidentJury;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.dataSource.filterPredicate = this.customFilterPredicate();

    this.dataSource.sortingDataAccessor = (item: JuryMember, property) => {
      switch (property) {
        case 'school':
          return item.school ? item.school.short_name : null;
        case 'city':
          return item.school.school_address && item.school.school_address[0] ? item.school.school_address[0].city : null;
        case 'rncpTitles':
          return item.rncp_title ? item.rncp_title.short_name : null;
        case 'president_of_jury':
          return item.presidentJury && item.presidentJury.last_name ? item.presidentJury.last_name : null;
        default:
          return item[property];
      }
    };
  }

  filterDate(operation: string, searchData, tableData, searchDataExtra?): boolean {
    const searchDataMoment = moment(searchData);
    const searchDataExtraMoment = moment(searchDataExtra ? searchDataExtra : '');
    const tableDataMoment = moment(new Date(tableData));

    if (searchDataMoment.isValid() && tableDataMoment.isValid()) {
      let dateStartFound = true;
      if (operation === 'isSame') {
        dateStartFound = tableDataMoment.isSame(searchDataMoment, 'days');
      } else if (operation === 'isAfter') {
        dateStartFound = tableDataMoment.isAfter(searchDataMoment, 'days');
      } else if (operation === 'isBetween' && searchDataExtraMoment.isValid()) {
        dateStartFound = tableDataMoment.isBetween(searchDataMoment, searchDataExtraMoment, 'days');
      }
      return dateStartFound;
    }
    return true;
  }

  customFilterPredicate() {
    return (data: JuryMember, filter: string): boolean => {
      const searchString: any = JSON.parse(filter);
      const dateFromFound = this.filterDate('isAfter', searchString.dateFrom, data.date_start);
      const dateToFound = this.filterDate('isBetween', searchString.dateFrom, data.date_start, searchString.dateTo);
      const dateStartFound = this.filterDate('isSame', searchString.dateStart, data.date_start);

      const schoolFound = data.school
        ? data.school.short_name.toString().trim().toLowerCase().indexOf(searchString.school.toLowerCase()) !== -1
        : true;

      const cityFound =
        data.school && data.school.school_address && data.school.school_address[0]
          ? data.school.school_address[0].city.toString().trim().toLowerCase().indexOf(searchString.city.toLowerCase()) !== -1
          : true;

      const rncpTitlesFound = data.rncp_title
        ? data.rncp_title.short_name.toString().trim().toLowerCase().indexOf(searchString.rncpTitles.toLowerCase()) !== -1
        : true;

      const presidentJuryFound = data.presidentJury
        ? data.presidentJury.last_name.toString().trim().toLowerCase().indexOf(searchString.presidentJury) !== -1
        : true;

      // isFilteringDateStart is to let component know that we are currently filtering for date_start
      // so dateFrom filter will be resetted if there is any value assigned to that field
      this.isFilteringDateStart = false;
      this.isFilteringDateFromOrTo = false;

      return dateFromFound && dateToFound && dateStartFound && schoolFound && cityFound && rncpTitlesFound && presidentJuryFound;
    };
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

  selectPresidentJury(event, element) {
    this.dataSource.data.forEach((el) => {
      if (el._id === element._id) {
        el.president_of_jury = event.source.value;
      }
    });
  }

  searchTodayResult() {
    this.isFilteringDateStart = true;
    const newDate = moment(new Date()).format('YYYY-MM-DD');

    this.filteredValues = {
      dateFrom: '',
      dateTo: '',
      dateStart: newDate,
      school: '',
      city: '',
      rncpTitles: '',
      presidentJury: '',
    };
    this.dateFromFilter.setValue('');
    this.dateToFilter.setValue('');
    this.dateStartFilter.setValue(newDate);

    this.dataSource.filter = JSON.stringify(this.filteredValues);
  }

  searchYesterdayResult() {
    this.isFilteringDateStart = true;
    const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

    this.filteredValues = {
      dateFrom: '',
      dateTo: '',
      dateStart: yesterday,
      school: '',
      city: '',
      rncpTitles: '',
      presidentJury: '',
    };
    this.dateFromFilter.setValue('');
    this.dateToFilter.setValue('');
    this.dateStartFilter.setValue(yesterday);

    this.dataSource.filter = JSON.stringify(this.filteredValues);
  }

  searchWeekResult() {
    this.isFilteringDateStart = true;
    const week = moment().subtract(7, 'days').format('YYYY-MM-DD');

    this.filteredValues = {
      dateFrom: '',
      dateTo: '',
      dateStart: week,
      school: '',
      city: '',
      rncpTitles: '',
      presidentJury: '',
    };
    this.dateFromFilter.setValue('');
    this.dateToFilter.setValue('');
    this.dateStartFilter.setValue(week);

    this.dataSource.filter = JSON.stringify(this.filteredValues);
  }

  searchMonthResult() {
    this.isFilteringDateStart = true;
    const month = moment().subtract(30, 'days').format('YYYY-MM-DD');

    this.filteredValues = {
      dateFrom: '',
      dateTo: '',
      dateStart: month,
      school: '',
      city: '',
      rncpTitles: '',
      presidentJury: '',
    };
    this.dateFromFilter.setValue('');
    this.dateToFilter.setValue('');
    this.dateStartFilter.setValue(month);

    this.dataSource.filter = JSON.stringify(this.filteredValues);
  }

  resetAllFilter() {
    this.filteredValues = {
      dateFrom: '',
      dateTo: '',
      dateStart: '',
      school: '',
      city: '',
      rncpTitles: '',
      presidentJury: '',
    };
    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.dateFromFilter.setValue('');
    this.dateToFilter.setValue('');
    this.dateStartFilter.setValue('');
    this.schoolFilter.setValue('');
    this.cityFilter.setValue('');
    this.rncpTitlesFilter.setValue('');
    this.presidentJuryFilter.setValue('');
  }

  checkEmptyPresidentOfJury(payload) {
    let found = false;
    for (let i = 0; i < payload.length; i++) {
      if (!payload[i].president_of_jury) {
        found = true;
        break;
      }
    }
    return found;
  }

  saveAssignPresidentJury() {
    const payload = this.createJuryMemberPayload();

    Swal.fire({
      type: 'question',
      title: this.translate.instant('JURY_ORGANIZATION.JURY_S7.TITLE'),
      text: this.translate.instant('JURY_ORGANIZATION.JURY_S7.TEXT', { juryOrgName: this.juryOrgData.name }),
      footer: `<span style="margin-left: auto">JURY_S7</span>`,
      confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S7.CONFIRM_BTN'),
      cancelButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S7.CANCEL_BTN'),
      showCancelButton: true,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        this.isSubmit = true;
        this.juryOrganizationService.assignPresidentOfJury(this.translate.currentLang, this.juryOrgId, payload, false).subscribe((resp) => {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('JURY_ORGANIZATION.JURY_S19.TITLE'),
            footer: `<span style="margin-left: auto">JURY_S19</span>`,
            confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S19.OK'),
            allowOutsideClick: false,
          }).then((ok) => {
            this.isLoading = false;
            this.getTableData();
            // this.router.navigate(['/jury-organization']);
          });
        });
      }
    });
  }

  submitAssignPresidentJury() {
    // add validation to check if all president of jury field has filled
    if (!this.isAllDataPopulated()) {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('JURY_ORGANIZATION.JURY_S8z.TITLE'),
        text: this.translate.instant('JURY_ORGANIZATION.JURY_S8z.TEXT'),
        footer: `<span style="margin-left: auto">JURY_S8z</span>`,
        confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S8z.CONFIRM_BTN'),
        allowOutsideClick: false,
      });
      return;
    }
    const payload = this.createJuryMemberPayload();

    Swal.fire({
      type: 'question',
      title: this.translate.instant('JURY_ORGANIZATION.JURY_S8.TITLE'),
      html: this.translate.instant('JURY_ORGANIZATION.JURY_S8.TEXT', { juryOrgName: this.juryOrgData.name }),
      footer: `<span style="margin-left: auto">JURY_S8</span>`,
      confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S8.CONFIRM_BTN'),
      cancelButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S8.CANCEL_BTN'),
      showCancelButton: true,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        this.juryOrganizationService.assignPresidentOfJury(this.translate.currentLang, this.juryOrgId, payload, true).subscribe((resp) => {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('JURY_ORGANIZATION.JURY_S18b.TITLE'),
            allowOutsideClick: false,
          }).then((ok) => {
            this.router
              .navigateByUrl('/', { skipLocationChange: true })
              .then(() => this.router.navigate(['jury-organization', this.juryOrgId, 'organize-juries', 'assign-backup-date']));
          });
        });
      }
    });
  }

  cancelAssignPresidentJury() {
    Swal.fire({
      type: 'question',
      title: this.translate.instant('JURY_ORGANIZATION.JURY_S6.TITLE'),
      text: this.translate.instant('JURY_ORGANIZATION.JURY_S6.TEXT', { juryOrgName: this.juryOrgData.name }),
      footer: `<span style="margin-left: auto">JURY_S6</span>`,
      confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S6.CONFIRM_BTN'),
      cancelButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S6.CANCEL_BTN'),
      showCancelButton: true,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        this.router.navigate(['/jury-organization']);
      }
    });
  }

  createJuryMemberPayload() {
    const juryMembers: JuryMemberPayload[] = this.dataSource.data.map((member) => {
      return {
        _id: member._id,
        president_of_jury: member.president_of_jury,
      };
    });
    return juryMembers;
  }

  isAllDataPopulated() {
    let isAllPopulated = true;
    for (const juryMember of this.dataSource.data) {
      if (!juryMember.president_of_jury) {
        isAllPopulated = false;
        break;
      }
    }
    return isAllPopulated;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
