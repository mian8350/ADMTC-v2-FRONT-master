import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import { SelectionModel } from '@angular/cdk/collections';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { UntypedFormControl } from '@angular/forms';
import * as moment from 'moment';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { startWith, tap } from 'rxjs/operators';
import { UtilityService } from 'app/service/utility/utility.service';
import { JuryData } from 'app/title-rncp/conditions/jury-organization-parameter/jury-organization-parameter.model';
import { UsersService } from 'app/service/users/users.service';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import uniq from 'lodash/uniq';

@Component({
  selector: 'ms-assign-student',
  templateUrl: './assign-student.component.html',
  styleUrls: ['./assign-student.component.scss'],
})
export class AssignStudentComponent implements OnInit, AfterViewInit, OnDestroy {
  dataSource = new MatTableDataSource([]);
  displayedColumns = [];
  filterColumns = [];
  // displayedColumns: string[] = [
  //   'select',
  //   'jury_serial_number',
  //   'dateStart',
  //   'location',
  //   'city',
  //   'rncpTitles',
  //   'students',
  //   'presidentJury',
  //   'professionalJury',
  //   'academicJury',
  //   'substitutionJury',
  //   'status',
  //   'action',
  // ];
  // filterColumns: string[] = [
  //   'selectFilter',
  //   'jurySerialNumberFilter',
  //   'dateFilter',
  //   'locationFilter',
  //   'cityFilter',
  //   'rncpTitlesFilter',
  //   'studentsFilter',
  //   'presidentJuryFilter',
  //   'professionalJuryFilter',
  //   'academicJuryFilter',
  //   'substitutionJuryFilter',
  //   'statusFilter',
  //   'actionFilter',
  // ];
  statusList = [
    { id: 'all', name: 'AllM' },
    { id: 'Sent to Students', name: 'JURY_ORGANIZATION.SENTTOSTUDENT' },
    { id: 'Not Sent', name: 'JURY_ORGANIZATION.NOTSENT' },
  ];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  private subs = new SubSink();
  selection = new SelectionModel(true, []);
  dateFilter = new UntypedFormControl('');
  locationFilter = new UntypedFormControl('');
  cityFilter = new UntypedFormControl('');
  rncpTitlesFilter = new UntypedFormControl('');
  presidentJuryFilter = new UntypedFormControl('');
  professionalJuryFilter = new UntypedFormControl('');
  academicJuryFilter = new UntypedFormControl('');
  substitutionJuryFilter = new UntypedFormControl('');
  statusFilter = new UntypedFormControl('all');
  filteredValues = {
    date: '',
    location: '',
    city: '',
    rncpTitles: '',
    presidentJury: '',
    professionalJury: '',
    academicJury: '',
    substitutionJury: '',
    status: 'all',
  };
  isLoading = false;

  juryOrgId;
  juryOrganization;
  juryOrgData;
  onlineJuryOrganization;
  juryMemberRequired;
  dataCount = 0;
  sortValue = null;

  isUserAcadDirMin = false;

  professionalJuries: JuryData[];
  academicJuries: JuryData[];
  subtituteJuries: JuryData[];

  proJuryTypeId: string;
  acadJuryTypeId: string;
  mentorTypeId: string;

  constructor(
    private juryService: JuryOrganizationService,
    private translate: TranslateService,
    private dateAdapter: DateAdapter<Date>,
    private route: ActivatedRoute,
    private router: Router,
    private utilService: UtilityService,
    private usersService: UsersService,
    private acadKitService: AcademicKitService,
    private changeDetectorRefs: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.juryOrgId = this.route.snapshot.parent.parent.paramMap.get('juryOrgId');

    this.isUserAcadDirMin = this.utilService.isUserAcadDirAdmin();



    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });

    this.getAssignStudentTableData();
    this.getJuryOrganizationData();
    this.getUserTypesId();
  }

  initFilterAndSorting() {
    this.subs.sink = this.dateFilter.valueChanges.subscribe((date) => {
      this.filteredValues['date'] = date;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.locationFilter.valueChanges.subscribe((location) => {
      this.filteredValues['location'] = location;
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

    this.subs.sink = this.professionalJuryFilter.valueChanges.subscribe((professionalJury) => {
      this.filteredValues['professionalJury'] = professionalJury;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.academicJuryFilter.valueChanges.subscribe((academicJury) => {
      this.filteredValues['academicJury'] = academicJury;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.substitutionJuryFilter.valueChanges.subscribe((substitutionJury) => {
      this.filteredValues['substitutionJury'] = substitutionJury;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.statusFilter.valueChanges.subscribe((status) => {
      this.filteredValues['status'] = status;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.dataSource.filterPredicate = this.customFilterPredicate();

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'location':
          return item.school ? item.school.short_name : null;
        case 'rncpTitles':
          return item.rncp_title ? item.rncp_title.short_name : null;
        case 'city':
          return item.school && item.school.school_address && item.school.school_address[0] && item.school.school_address[0].city
            ? item.school.school_address[0].city
            : null;
        case 'presidentJury':
          return item.president_of_jury && item.president_of_jury.last_name ? item.president_of_jury.last_name : null;
        case 'professionalJury':
          return item.professional_jury_member && item.professional_jury_member.last_name ? item.professional_jury_member.last_name : null;
        case 'academicJury':
          return item.academic_jury_member && item.academic_jury_member.last_name ? item.academic_jury_member.last_name : null;
        case 'substitutionJury':
          return item.substitution_jury_member && item.substitution_jury_member.last_name ? item.substitution_jury_member.last_name : null;
        default:
          return item[property];
      }
    };
  }

  customFilterPredicate() {
    return function (data, filter: string): boolean {
      const searchString = JSON.parse(filter);
      let newDate = moment(searchString.date).format('YYYY-MM-DD');
      newDate = newDate !== 'Invalid date' ? newDate : '';

      const dateFound = data.date_start ? data.date_start.toString().trim().toLowerCase().indexOf(newDate) !== -1 : true;

      const locationFound = data.school
        ? data.school.short_name.toString().trim().toLowerCase().indexOf(searchString.location.toLowerCase()) !== -1
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

      const professionalJuryFound = data.professional_jury_member
        ? data.professional_jury_member.last_name.toString().trim().toLowerCase().indexOf(searchString.professionalJury) !== -1
        : true;

      const academicJuryFound = data.academic_jury_member
        ? data.academic_jury_member.last_name.toString().trim().toLowerCase().indexOf(searchString.academicJury) !== -1
        : true;

      const substitutionJuryFound = data.substitution_jury_member
        ? data.substitution_jury_member.last_name.toString().trim().toLowerCase().indexOf(searchString.substitutionJury) !== -1
        : true;

      let status = '';
      if (data.is_student_assigned === true) {
        status = 'Sent to Students';
      } else if (data.is_student_assigned === false) {
        status = 'Not Sent';
      } else {
        status = 'all';
      }
      const statusFound =
        searchString.status === 'all' ? true : status.toString().trim().toLowerCase().indexOf(searchString.status.toLowerCase()) !== -1;

      return (
        dateFound &&
        locationFound &&
        cityFound &&
        rncpTitlesFound &&
        presidentJuryFound &&
        professionalJuryFound &&
        academicJuryFound &&
        substitutionJuryFound &&
        statusFound
      );
    };
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          this.getAssignStudentTableData();
        }),
      )
      .subscribe();
  }

  getAssignStudentTableData() {
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };

    const payload = {
      filter_by_acadir: null,
    };

    if (this.utilService.isUserAcadDirAdmin()) {
      payload.filter_by_acadir = true;
    }

    this.isLoading = true;
    this.subs.sink = this.juryService
      .getAllJuryMembersAssignStudentTabNoPagination(this.juryOrgId, this.sortValue, payload.filter_by_acadir)
      .subscribe(
        (resp) => {
          this.isLoading = false;
          const response = _.cloneDeep(resp);
          this.dataCount = 0;
          if (response && response.length) {
            response.forEach((juryMember) => {
              juryMember.jury_serial_number =
                juryMember.jury_serial_number.slice(0, 8) +
                '-' +
                juryMember.jury_serial_number.slice(8, 11) +
                '-' +
                juryMember.jury_serial_number.slice(11, 14);
            });
            this.dataSource.data = response;
            this.dataCount = response && response.length ? response.length : 0;
            this.dataSource.paginator = this.paginator;
          } else {
            this.dataSource.data = [];
            this.dataCount = 0;
          }

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

  sortData(sort: Sort) {
    this.sortValue = sort.active ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    this.paginator.pageIndex = 0;
    this.getAssignStudentTableData();
    // if (this.dataLoaded) {
    //   this.paginator.pageIndex = 0;
    //   this.getAllJuryOrganizationsList();
    //   if (!this.isReset) {
    //     this.getAllJuryOrganizationsList();
    //   }
    // }
  }

  getJuryOrganizationData() {
    this.isLoading = true;
    this.subs.sink = this.juryService.getOneJuryOrganizationDataById(this.juryOrgId).subscribe(
      (resp) => {
        if (resp) {
          this.juryOrganization = _.cloneDeep(resp);
          this.juryOrgData = _.cloneDeep(resp);

          if (this.juryOrganization.jury_activity === 'visio_jury') {
            this.onlineJuryOrganization = true;
          }
          if (this.juryOrganization.jury_member_required) {
            this.juryMemberRequired = this.juryOrganization.jury_member_required;
          }

          let tempDisplayed = [];
          let tempFilterDisplayed = [];
          if (this.juryMemberRequired) {
            tempDisplayed = [
              'select',
              'jury_serial_number',
              'date_start',
              'location',
              'city',
              'rncpTitles',
              'students',
              'presidentJury',
              // 'professionalJury',
              // 'academicJury',
              // 'substitutionJury',
              'status',
              'action',
            ];
            tempFilterDisplayed = [
              'selectFilter',
              'jurySerialNumberFilter',
              'dateFilter',
              'locationFilter',
              'cityFilter',
              'rncpTitlesFilter',
              'studentsFilter',
              'presidentJuryFilter',
              // 'professionalJuryFilter',
              // 'academicJuryFilter',
              // 'substitutionJuryFilter',
              'statusFilter',
              'actionFilter',
            ];
          } else {
            tempDisplayed = [
              'select',
              'jury_serial_number',
              'date_start',
              'location',
              'city',
              'rncpTitles',
              'students',
              'presidentJury',
              'status',
              'action',
            ];
            tempFilterDisplayed = [
              'selectFilter',
              'jurySerialNumberFilter',
              'dateFilter',
              'locationFilter',
              'cityFilter',
              'rncpTitlesFilter',
              'studentsFilter',
              'presidentJuryFilter',
              'statusFilter',
              'actionFilter',
            ];
          }

          this.displayedColumns = tempDisplayed;
          this.filterColumns = tempFilterDisplayed;
          this.dataSource.sort = this.sort;
          this.initFilterAndSorting();


          this.isLoading = false;
        }
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

  goToAssignStudentPerJury(juryData: any) {

    this.router.navigate([
      'jury-organization',
      this.juryOrgId,
      'assign-student',
      juryData.school._id,
      juryData.rncp_title._id,
      juryData.class._id,
      juryData.jury_serial_number,
    ]);
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

  resetAllFilter() {
    this.filteredValues = {
      date: '',
      location: '',
      city: '',
      rncpTitles: '',
      presidentJury: '',
      professionalJury: '',
      academicJury: '',
      substitutionJury: '',
      status: 'all',
    };
    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.dateFilter.setValue('');
    this.locationFilter.setValue('');
    this.cityFilter.setValue('');
    this.rncpTitlesFilter.setValue('');
    this.presidentJuryFilter.setValue('');
    this.professionalJuryFilter.setValue('');
    this.academicJuryFilter.setValue('');
    this.substitutionJuryFilter.setValue('');
    this.statusFilter.setValue('all');
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
    this.juryService.getJuries([this.proJuryTypeId, this.mentorTypeId], school, rncpTitle).subscribe((resp) => {
      this.isLoading = false;
      this.professionalJuries = resp;

    });
  }

  getAcademicJuries(school: string[], rncpTitle: string[]) {
    this.isLoading = true;
    this.juryService.getJuries([this.acadJuryTypeId], school, rncpTitle).subscribe((resp) => {
      this.isLoading = false;
      this.academicJuries = resp;

    });
  }

  getSubtituteJuries(school: string[], rncpTitle: string[]) {
    const juryTypesUnderAcadir = this.usersService.PCUsertypeList;
    this.isLoading = true;
    this.juryService.getJuries(juryTypesUnderAcadir, school, rncpTitle).subscribe((resp) => {
      this.isLoading = false;
      this.subtituteJuries = resp;

    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
