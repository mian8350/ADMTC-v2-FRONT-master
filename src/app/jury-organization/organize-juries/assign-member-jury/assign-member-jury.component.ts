import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import { SelectionModel } from '@angular/cdk/collections';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { UntypedFormControl } from '@angular/forms';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import {
  JuryMember,
  JuryOrganizationParameter,
  JuryData,
  JuryDataEntities,
} from 'app/title-rncp/conditions/jury-organization-parameter/jury-organization-parameter.model';
import { ActivatedRoute, Router } from '@angular/router';
import cloneDeep from 'lodash/cloneDeep';
import Swal from 'sweetalert2';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { UsersService } from 'app/service/users/users.service';
import uniq from 'lodash/uniq';
import { UtilityService } from 'app/service/utility/utility.service';

// interface JuryMemberModel {
//   id: string;
//   text: string;
// }
interface JuryMemberPayload {
  _id: string;
  professional_jury_member: string;
  academic_jury_member: string;
  substitution_jury_member: string;
}

interface JuryMemberModel {
  id: string;
  text: string;
}

@Component({
  selector: 'ms-assign-member-jury',
  templateUrl: './assign-member-jury.component.html',
  styleUrls: ['./assign-member-jury.component.scss'],
})
export class AssignMemberJuryComponent implements OnInit, OnDestroy {
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
    'professional_jury_member',
    'academic_jury_member',
    'substitution_jury_member',
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
    'professionalJuryFilter',
    'academicJuryFilter',
    'substitutionJuryFilter',
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
  professionalJuryFilter = new UntypedFormControl('');
  academicJuryFilter = new UntypedFormControl('');
  substitutionJuryFilter = new UntypedFormControl('');
  filteredValues = {
    dateFrom: '',
    dateTo: '',
    dateStart: '',
    school: '',
    city: '',
    rncpTitles: '',
    presidentJury: '',
    professionalJury: '',
    academicJury: '',
    substitutionJury: '',
  };
  isLoading = false;

  isFilteringDateStart = false;
  isFilteringDateFromOrTo = false;

  juryOrgId: string;
  juryOrgData: JuryOrganizationParameter;
  juryMembers: JuryMember[] = [];
  professionalJuries: JuryData[];
  academicJuries: JuryData[];
  subtituteJuries: JuryData[];

  proJuryTypeId: string;
  acadJuryTypeId: string;
  mentorTypeId: string;

  isUserAcadDirMin = false;

  constructor(
    private route: ActivatedRoute,
    private juryOrganizationService: JuryOrganizationService,
    private translate: TranslateService,
    private router: Router,
    private acadKitService: AcademicKitService,
    private usersService: UsersService,
    private utilService: UtilityService,
  ) {}

  ngOnInit() {
    this.juryOrgId = this.route.snapshot.parent.parent.paramMap.get('juryOrgId');
    this.isUserAcadDirMin = this.utilService.isUserAcadDirAdmin();

    this.getJuryOrgData();
    this.getTableData();
    this.initFilterAndSorting();
  }

  getJuryOrgData() {
    this.isLoading = true;
    this.juryOrganizationService.getOneJuryOrganizationDataById(this.juryOrgId).subscribe((resp) => {
      this.isLoading = false;
      this.juryOrgData = cloneDeep(resp);
      this.getUserTypesId();
    });
  }

  getTableData() {
    this.isLoading = true;
    const payload = {
      filter_by_acadir: null,
      school_id: null,
    };

    if (this.utilService.isUserAcadDirAdmin()) {
      const currentUser = this.utilService.getCurrentUser();
      payload.filter_by_acadir = true;
      payload.school_id = currentUser.entities[0].school._id;
    }

    this.subs.sink = this.juryOrganizationService
      .getAllJuryMembers(this.juryOrgId, payload.filter_by_acadir)
      .subscribe((data) => {
        this.isLoading = false;
        this.juryMembers = cloneDeep(data);
        this.juryMembers.forEach((juryMember) => {
          juryMember.jury_serial_number =
            juryMember.jury_serial_number.slice(0, 8) +
            '-' +
            juryMember.jury_serial_number.slice(8, 11) +
            '-' +
            juryMember.jury_serial_number.slice(11, 14);
          // make field professional, academic, and backup jury_member value become _id instead of object
          juryMember.professionalJury = juryMember.professional_jury_member;
          juryMember.professional_jury_member = juryMember.professional_jury_member ? juryMember.professional_jury_member._id : null;
          juryMember.academicJury = juryMember.academic_jury_member;
          juryMember.academic_jury_member = juryMember.academic_jury_member ? juryMember.academic_jury_member._id : null;
          juryMember.substitutionJury = juryMember.substitution_jury_member;
          juryMember.substitution_jury_member = juryMember.substitution_jury_member ? juryMember.substitution_jury_member._id : null;
        });

        this.dataSource.data = this.juryMembers;
        this.dataSource.sort = this.sort;
        this.dataSource.paginator = this.paginator;
      });
  }

  getUserTypesId() {
    this.isLoading = true;
    this.acadKitService.getAllUserTypes().subscribe((resp) => {
      this.isLoading = false;
      // professional jury => pro jury + mentor
      const professionalJuryType = resp.find((type) => type.name === 'Professional Jury Member');
      this.proJuryTypeId = professionalJuryType ? professionalJuryType._id : null;
      const mentorType = resp.find((type) => type.name === 'Mentor');
      this.mentorTypeId = mentorType ? mentorType._id : null;
      // academic => user acad jury member
      const academicJuryType = resp.find((type) => type.name === 'Academic Final Jury Member');
      this.acadJuryTypeId = academicJuryType ? academicJuryType._id : null;
      this.getJuries();
    });
  }

  getJuries() {
    let school = [];
    let rncpTitle = [];
    if (this.juryOrgData && this.juryOrgData.rncp_titles) {
      this.juryOrgData.rncp_titles.forEach((title) => {
        if (title.rncp_id && title.rncp_id._id) {
          rncpTitle.push(title.rncp_id._id);
        }
        if (title.schools) {
          title.schools.forEach((sch) => {
            if (sch.school && sch.school._id) {
              school.push(sch.school._id);
            }
          });
        }
      });
    }
    school = uniq(school);
    rncpTitle = uniq(rncpTitle);

    if (school.length && rncpTitle.length) {
      this.getProfessionalJuries(school, rncpTitle);
      this.getAcademicJuries(school, rncpTitle);
      this.getSubtituteJuries(school, rncpTitle);
    }
  }

  getProfessionalJuries(school: string[], rncpTitle: string[]) {
    this.isLoading = true;
    this.juryOrganizationService.getJuries([this.proJuryTypeId, this.mentorTypeId], school, rncpTitle).subscribe((resp) => {
      this.isLoading = false;
      this.professionalJuries = resp;

    });
  }

  getAcademicJuries(school: string[], rncpTitle: string[]) {
    this.isLoading = true;
    this.juryOrganizationService.getJuries([this.acadJuryTypeId], school, rncpTitle).subscribe((resp) => {
      this.isLoading = false;
      this.academicJuries = resp;

    });
  }

  getSubtituteJuries(school: string[], rncpTitle: string[]) {
    const juryTypesUnderAcadir = this.usersService.PCUsertypeList;
    this.isLoading = true;
    this.juryOrganizationService.getJuries(juryTypesUnderAcadir, school, rncpTitle).subscribe((resp) => {
      this.isLoading = false;
      this.subtituteJuries = resp;

    });
  }

  isUserHasSameSchool(schoolId: string, userEntities: JuryDataEntities[]): boolean {
    if (schoolId && userEntities.length) {
      return !!userEntities.find((entity) => (entity.school && entity.school._id ? entity.school._id === schoolId : false));
    }
    return false;
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

    this.subs.sink = this.professionalJuryFilter.valueChanges.subscribe((jury) => {
      this.filteredValues['professionalJury'] = jury;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.academicJuryFilter.valueChanges.subscribe((jury) => {
      this.filteredValues['academicJury'] = jury;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.substitutionJuryFilter.valueChanges.subscribe((jury) => {
      this.filteredValues['substitutionJury'] = jury;
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
          return item.president_of_jury && item.president_of_jury.last_name ? item.president_of_jury.last_name : null;
        case 'professional_jury_member':
          return item.professionalJury && item.professionalJury.last_name ? item.professionalJury.last_name : null;
        case 'academic_jury_member':
          return item.academicJury && item.academicJury.last_name ? item.academicJury.last_name : null;
        case 'substitution_jury_member':
          return item.substitutionJury && item.substitutionJury.last_name ? item.substitutionJury.last_name : null;
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

      const presidentJuryFound = data.president_of_jury
        ? data.president_of_jury.last_name.toString().trim().toLowerCase().indexOf(searchString.presidentJury) !== -1
        : true;

      const professionalJuryFound = data.professionalJury
        ? data.professionalJury.last_name.toString().trim().toLowerCase().indexOf(searchString.professionalJury) !== -1
        : true;

      const academicJuryFound = data.academicJury
        ? data.academicJury.last_name.toString().trim().toLowerCase().indexOf(searchString.academicJury) !== -1
        : true;

      const substituteJuryFound = data.substitutionJury
        ? data.substitutionJury.last_name.toString().trim().toLowerCase().indexOf(searchString.substitutionJury) !== -1
        : true;

      // isFilteringDateStart is to let component know that we are currently filtering for date_start
      // so dateFrom filter will be resetted if there is any value assigned to that field
      this.isFilteringDateStart = false;
      this.isFilteringDateFromOrTo = false;

      return (
        dateFromFound &&
        dateToFound &&
        dateStartFound &&
        schoolFound &&
        cityFound &&
        rncpTitlesFound &&
        presidentJuryFound &&
        professionalJuryFound &&
        academicJuryFound &&
        substituteJuryFound
      );
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
      professionalJury: '',
      academicJury: '',
      substitutionJury: '',
    };
    this.dateFromFilter.setValue('');
    this.dateToFilter.setValue('');
    this.dateStartFilter.setValue(newDate);

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
      professionalJury: '',
      academicJury: '',
      substitutionJury: '',
    };
    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.dateFromFilter.setValue('');
    this.dateToFilter.setValue('');
    this.dateStartFilter.setValue('');
    this.schoolFilter.setValue('');
    this.cityFilter.setValue('');
    this.rncpTitlesFilter.setValue('');
    this.presidentJuryFilter.setValue('');
    this.professionalJuryFilter.setValue('');
    this.academicJuryFilter.setValue('');
    this.substitutionJuryFilter.setValue('');
  }

  saveAssignMemberJury() {
    const payload = this.createJuryMemberPayload();

    Swal.fire({
      type: 'question',
      title: this.translate.instant('JURY_ORGANIZATION.JURY_S10.TITLE'),
      text: this.translate.instant('JURY_ORGANIZATION.JURY_S10.TEXT', { juryName: this.juryOrgData.name }),
      footer: `<span style="margin-left: auto">JURY_S10</span>`,
      confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S10.CONFIRM_BTN'),
      cancelButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S10.CANCEL_BTN'),
      showCancelButton: true,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        this.juryOrganizationService.assignMemberOfJury(this.translate.currentLang, this.juryOrgId, payload, false).subscribe((resp) => {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('JURY_ORGANIZATION.JURY_S19.TITLE'),
            confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S19.OK'),
            footer: `<span style="margin-left: auto">JURY_S19</span>`,
            allowOutsideClick: false,
          }).then((ok) => {
            this.router.navigate(['/jury-organization']);
          });
        });
      }
    });
  }

  submitAssignMemberJury() {
    const payload = this.createJuryMemberPayload();

    Swal.fire({
      type: 'question',
      title: this.translate.instant('JURY_ORGANIZATION.JURY_S11.TITLE'),
      html: this.translate.instant('JURY_ORGANIZATION.JURY_S11.TEXT', { juryName: this.juryOrgData.name }),
      footer: `<span style="margin-left: auto">JURY_S11</span>`,
      confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S11.CONFIRM_BTN'),
      cancelButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S11.CANCEL_BTN'),
      showCancelButton: true,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        this.juryOrganizationService.assignMemberOfJury(this.translate.currentLang, this.juryOrgId, payload, true).subscribe((resp) => {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('JURY_ORGANIZATION.JURY_S18b.TITLE'),
            allowOutsideClick: false,
          }).then((ok) => {
            this.router.navigate(['/jury-organization']);
          });
        });
      }
    });
  }

  cancelAssignMemberJury() {
    Swal.fire({
      type: 'question',
      title: this.translate.instant('JURY_ORGANIZATION.JURY_S9.TITLE'),
      text: this.translate.instant('JURY_ORGANIZATION.JURY_S9.TEXT', { juryName: this.juryOrgData.name }),
      footer: `<span style="margin-left: auto">JURY_S9</span>`,
      confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S9.CONFIRM_BTN'),
      cancelButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S9.CANCEL_BTN'),
      showCancelButton: true,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        this.router.navigate(['/jury-organization']);
      }
    });
  }

  createJuryMemberPayload() {
    const juryMembers: JuryMemberPayload[] = this.dataSource.data.map((member: JuryMemberPayload) => {
      return {
        _id: member._id,
        professional_jury_member: member.professional_jury_member,
        academic_jury_member: member.academic_jury_member,
        substitution_jury_member: member.substitution_jury_member,
      };
    });
    return juryMembers;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
