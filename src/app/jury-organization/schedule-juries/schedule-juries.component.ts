import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit, Input } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import { SelectionModel } from '@angular/cdk/collections';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { UntypedFormControl } from '@angular/forms';
import * as moment from 'moment';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import * as _ from 'lodash';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import Swal from 'sweetalert2';
import { JuryOrganizationParameter } from 'app/title-rncp/conditions/jury-organization-parameter/jury-organization-parameter.model';
import { environment } from 'environments/environment';
import { TaskService } from 'app/service/task/task.service';
import { PostponeDialogComponent } from './postpone-dialog/postpone-dialog.component';
import { Observable } from 'rxjs';
import { ApplicationUrls } from 'app/shared/settings';
import { NgxPermissionsService } from 'ngx-permissions';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { ExportCsvService } from 'app/service/export-csv/export-csv.service';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import { CoreService } from 'app/service/core/core.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { GoogleMeetService } from 'app/service/export-csv/google-meets.service';
import { SetSessionJuriesIndividualComponent } from '../organize-juries/shared-jury-dialogs/set-session-juries-individual/set-session-juries-individual.component';
import { UserEmailDialogComponent } from 'app/users/user-email-dialog/user-email-dialog.component';

@Component({
  selector: 'ms-schedule-juries',
  templateUrl: './schedule-juries.component.html',
  styleUrls: ['./schedule-juries.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseLocalToUtcPipe],
})
export class ScheduleJuriesComponent implements OnInit, AfterViewInit, OnDestroy {
  dataSource = new MatTableDataSource([]);

  displayedColumns: string[] = [];
  filterColumns: string[] = [];

  @Input() studentData: any = null;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  private subs = new SubSink();
  selection = new SelectionModel(true, []);

  isReset = false;
  dataLoaded = false;
  noData: any;

  isCheckedAll = false;
  dateFromFilter = new UntypedFormControl('');
  dateToFilter = new UntypedFormControl('');
  schoolFilter = new UntypedFormControl('');
  rncpTitlesFilter = new UntypedFormControl('');
  lastNameFilter = new UntypedFormControl('');
  regionFilter = new UntypedFormControl('');
  dateFilter = new UntypedFormControl('');
  timeFilter = new UntypedFormControl('');
  presidentJuryFilter = new UntypedFormControl('');
  professionalJuryFilter = new UntypedFormControl('');
  academicJuryFilter = new UntypedFormControl('');
  substitutionJuryFilter = new UntypedFormControl('');
  rehearsalFilter = new UntypedFormControl('');
  markEntryStatusFilter = new UntypedFormControl('');
  // markEntryFilter = new FormControl('');

  rehearsalFilterList = [
    { key: 'AllM', value: '' },
    { key: 'Both Done', value: 'all_done' },
    { key: 'Both Not Done', value: 'all_not_done' },
    { key: 'Rehearsal Done', value: 'rehearsal_done' },
    { key: 'Aide Jury Done', value: 'whatsapp_done' },
  ];

  // markEntryList = [
  //   { key: 'AllM', value: '' },
  //   { key: 'Virgin', value: 'red' },
  //   { key: 'Started', value: 'orange' },
  //   { key: 'Complete', value: 'green' },
  // ];

  markEntryStatusList = [
    { value: '', key: 'AllM' },
    { value: 'green', key: 'Validated' },
    { value: 'purple', key: 'Submitted' },
    { value: 'orange', key: 'In Progress' },
    { value: 'red', key: 'Not Submitted' },
  ]

  schools = [];
  filteredSchools: Observable<any[]>;
  rncpTitles = [];
  filteredTitles: Observable<any[]>;
  presidentJuries = [];
  filteredPresidents: Observable<any[]>;
  professionalJuries = [];
  filteredPros: Observable<any[]>;
  academicJuries = [];
  filteredAcademics: Observable<any[]>;
  substituteJuries = [];
  filteredSubs: Observable<any[]>;

  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  filteredValues = {
    date_start: '',
    date_finish: '',
    school: '',
    rncp_title: '',
    name_of_participant: '',
    region: '',
    date: '',
    start_time: '',
    president_of_jury: '',
    professional_jury_member: '',
    academic_jury_member: '',
    substitution_jury_member: '',
    rehearsal_reminder: null,
    offset: moment().utcOffset(),
    mark_entry_status: null,
  };
  isLoading = false;
  sortValue = null;

  juryOrgId;
  dataCount;
  juryOrganization: JuryOrganizationParameter;
  onlineJuryOrganization;
  juryMemberRequired;
  isNewFlow;

  isPresidentJury;
  isUserADMTC;
  isCertifierAdmin;
  isAcadDirMin;
  isUserStudent;
  isJuryCorector;
  today = new Date(new Date().setHours(0, 0, 0, 0));

  juryStudentName = '';
  exportName: 'Export';
  disabledExport = true;
  selectType: any;
  userSelected: any[];
  userSelectedId: any[];
  allStudentForExport = [];
  private timeOutVal: any;
  tutorialData: any;
  isTutorialAdded: boolean = false;
  isPermission: any;
  isAllowDisplayJuryKitCurrentUser: boolean = false;

  isDropdownLoading = false;
  isLoadingTable: boolean;
  isWaitingResponse: boolean = false;

  constructor(
    private juryService: JuryOrganizationService,
    private translate: TranslateService,
    private dateAdapter: DateAdapter<Date>,
    private authService: AuthService,
    private utilService: UtilityService,
    private route: ActivatedRoute,
    private parseUtcToLocal: ParseUtcToLocalPipe,
    private parseLocalToUtc: ParseLocalToUtcPipe,
    private router: Router,
    private taskService: TaskService,
    public dialog: MatDialog,
    private permissions: NgxPermissionsService,
    private acadKitService: AcademicKitService,
    private exportCsvService: ExportCsvService,
    private tutorialService: TutorialService,
    private coreService: CoreService,
    private googleMeetService: GoogleMeetService,
  ) {}

  ngOnInit() {
    this.isUserStudent = this.permissions.getPermission('Student') ? true : false;
    this.juryOrgId = this.route.snapshot.parent.paramMap.get('juryOrgId');

    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });

    this.isPresidentJury = this.utilService.isUserPresidentOfJury();
    this.isUserADMTC = this.utilService.isUserEntityADMTC();
    this.isCertifierAdmin = this.utilService.isUserCRDirAdmin();
    this.isAcadDirMin = this.utilService.isUserAcadDirAdmin();
    this.isJuryCorector = this.utilService.isUserJuryCorrector();
    this.allowDisplayJuryKitCurrentUser();
    // Note Jury Corrector are same as Grand Oral Corrector



    this.populateData('ngOnInit');
    // if (this.juryOrgId) {
    //   this.getAllScheduleJuryMember('ngOnInit');
    //   this.getJuryTableDropdownData();
    //   this.getJuryOrganizationData();
    // } else if (this.studentData) {
    //   this.getAllScheduleStudent();
    // }

    this.isPermission = this.authService.getPermission();
    this.getInAppTutorial('Jury Organization');

    this.subs.sink = this.lastNameFilter.valueChanges.pipe(debounceTime(500)).subscribe((lastName) => {
      this.filteredValues['name_of_participant'] = lastName;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllScheduleJuryMember('ngOnInit 1');
        this.getJuryTableDropdownData();
      }
    });

    this.subs.sink = this.regionFilter.valueChanges.pipe(debounceTime(500)).subscribe((region) => {
      this.filteredValues['region'] = region;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllScheduleJuryMember('ngOnInit 2');
        this.getJuryTableDropdownData();
      }
    });
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (this.juryOrgId && !this.isReset) {
            this.getAllScheduleJuryMember('ngAfterViewInit');
            this.getJuryTableDropdownData();
          } else if (this.studentData) {
            this.getAllScheduleStudent();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
  }

  populateData(type?: string) {
    if (this.juryOrgId) {
      this.getAllScheduleJuryMember('ngOnInit');
      this.getJuryTableDropdownData();
      this.getJuryOrganizationData();
    } else if (this.studentData) {
      this.getAllScheduleStudent();
    }
  }

  getJuryTableDropdownData() {
    this.isDropdownLoading = true;
    this.subs.sink = this.juryService
      .getJuriesSchedulesDropdown(this.utilService.getCurrentUserType(), this.filteredValues, this.juryOrgId)
      .subscribe(
        (resp) => {
          if (resp) {
            this.presidentJuries = resp['president_of_jurys'].filter((president) => president && president._id);
            this.professionalJuries = resp['professional_jury_members'].filter((profMember) => profMember && profMember._id);
            this.academicJuries = resp['academic_jury_members'].filter((acadMember) => acadMember && acadMember._id);
            this.substituteJuries = resp['substitution_jury_members'].filter((subMember) => subMember && subMember._id);
            this.schools = resp['schools'].filter((school) => school && school._id);
            this.rncpTitles = resp['rncp_titles'].filter((title) => title && title._id);

            this.schools = _.uniqBy(this.schools, '_id');
            this.rncpTitles = _.uniqBy(this.rncpTitles, '_id');
            this.presidentJuries = _.uniqBy(this.presidentJuries, '_id');
            this.professionalJuries = _.uniqBy(this.professionalJuries, '_id');
            this.academicJuries = _.uniqBy(this.academicJuries, '_id');
            this.substituteJuries = _.uniqBy(this.substituteJuries, '_id');
            this.sortingDropdown();
            this.initFilter();
            this.isDropdownLoading = false;
          }
        },
        (err) => (this.isDropdownLoading = false),
      );
  }

  sortingDropdown() {
    // sorting dropdown list to become alphabethical
    this.schools.sort((a, b) => {
      let schoolA = a.short_name;
      let schoolB = b.short_name;
      if (schoolA < schoolB) {
        return -1;
      }
      if (schoolA > schoolB) {
        return 1;
      }
      return 0;
    });
    this.presidentJuries.sort((a, b) => {
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
    this.professionalJuries.sort((a, b) => {
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
    this.academicJuries.sort((a, b) => {
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
    this.substituteJuries.sort((a, b) => {
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
  }

  getAllScheduleJuryMember(data) {

    const payload = {
      user_type_login_id: this.utilService.getCurrentUserType(),
      jury_id: this.juryOrgId,
      student_id: null,
    };
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.isLoadingTable = true;
    this.subs.sink = this.juryService
      .getJuriesSchedules(payload.user_type_login_id, payload.jury_id, pagination, payload.student_id, this.sortValue, this.filteredValues)
      .subscribe(
        (resp) => {

          if (resp && resp.length) {
            const response = _.cloneDeep(resp);

            response.forEach((schedule) => {
              if (schedule && schedule.time) {
                const time = schedule.time;
                if (time && time.date && time.start && time.finish) {
                  schedule.time.utcDate = time.date;
                  schedule.time.utcStart = time.start;
                  schedule.time.utcFinish = time.finish;
                  schedule.time.date = this.convertUTCToLocalDate({ date: time.date, time_start: time.start });
                  schedule.time.start = this.parseUtcToLocal.transform(time.start);
                  schedule.time.finish = this.parseUtcToLocal.transform(time.finish);
                }
              }
            });



            this.dataSource.data = response;
            this.dataCount = response[0] && response[0].count_document ? response[0].count_document : 0;
            this.isLoadingTable = false;
          } else {
            this.dataSource.data = [];
            this.dataCount = 0;
            this.isLoadingTable = false;
            this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
          }
          // set isReset back to false after 400 milisecond so the subscription that has debounceTime not triggered
          setTimeout(() => (this.isReset = false), 400);
        },
        (err) => {
          this.isLoadingTable = false;

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
    // dynamically set key property of sort object
    this.sortValue = sort.direction ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (this.juryOrgId && !this.isReset) {
        this.getAllScheduleJuryMember('sortData');
        this.getJuryTableDropdownData();
      } else if (this.studentData) {
        this.getAllScheduleStudent();
      }
    }
  }

  initFilter() {
    this.subs.sink = this.dateFromFilter.valueChanges.subscribe((date) => {
      this.filteredValues.date_start = date ? moment(date).format('DD/MM/YYYY') : '';
      this.filteredValues.date = '';
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllScheduleJuryMember('dateFromFilter');
        this.getJuryTableDropdownData();
      }
    });
    this.subs.sink = this.dateToFilter.valueChanges.subscribe((date) => {
      this.filteredValues.date_finish = date ? moment(date).format('DD/MM/YYYY') : '';
      this.filteredValues.date = '';
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllScheduleJuryMember('dateToFilter');
        this.getJuryTableDropdownData();
      }
    });
    this.subs.sink = this.dateFilter.valueChanges.subscribe((date) => {
      this.filteredValues.date = date ? moment(date).format('DD/MM/YYYY') : '';
      this.filteredValues.date_start = '';
      this.filteredValues.date_finish = '';
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllScheduleJuryMember('dateFilter');
        this.getJuryTableDropdownData();
      }
    });
    this.subs.sink = this.timeFilter.valueChanges.subscribe((time) => {
      this.filteredValues.start_time = time ? this.parseLocalToUtc.transform(time) : '';
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllScheduleJuryMember('timeFilter');
        this.getJuryTableDropdownData();
      }
    });
    this.subs.sink = this.lastNameFilter.valueChanges.pipe(debounceTime(400)).subscribe((data) => {
      this.filteredValues.name_of_participant = data;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllScheduleJuryMember('lastNameFilter');
        this.getJuryTableDropdownData();
      }
    });
    this.subs.sink = this.regionFilter.valueChanges.pipe(debounceTime(400)).subscribe((data) => {
      this.filteredValues.region = data;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllScheduleJuryMember('regionFilter');
        this.getJuryTableDropdownData();
      }
    });
    this.subs.sink = this.rehearsalFilter.valueChanges.pipe(debounceTime(400)).subscribe((data) => {
      this.filteredValues.rehearsal_reminder = data ? data : null;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllScheduleJuryMember('rehearsalFilter');
      }
    });
    this.subs.sink = this.markEntryStatusFilter.valueChanges.pipe(debounceTime(400)).subscribe((data) => {
      this.filteredValues.mark_entry_status = data ? data : null;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllScheduleJuryMember('markEntryFilter');
      }
    });
    this.filteredSchools = this.schoolFilter.valueChanges.pipe(
      startWith(''),
      map((searchTxt) =>
        this.schools.filter((school) => school && school.short_name.toLowerCase().includes(searchTxt ? searchTxt.toLowerCase() : '')),
      ),
    );
    this.filteredTitles = this.rncpTitlesFilter.valueChanges.pipe(
      startWith(''),
      map((searchTxt) =>
        this.rncpTitles.filter((title) => title && title.short_name.toLowerCase().includes(searchTxt ? searchTxt.toLowerCase() : '')),
      ),
    );
    this.filteredPresidents = this.presidentJuryFilter.valueChanges.pipe(
      startWith(''),
      map((searchTxt) =>
        this.presidentJuries.filter((jury) => jury && jury.last_name.toLowerCase().includes(searchTxt ? searchTxt.toLowerCase() : '')),
      ),
    );
    this.filteredPros = this.professionalJuryFilter.valueChanges.pipe(
      startWith(''),
      map((searchTxt) =>
        this.professionalJuries.filter((jury) => jury && jury.last_name.toLowerCase().includes(searchTxt ? searchTxt.toLowerCase() : '')),
      ),
    );
    this.filteredAcademics = this.academicJuryFilter.valueChanges.pipe(
      startWith(''),
      map((searchTxt) =>
        this.academicJuries.filter((jury) => jury && jury.last_name.toLowerCase().includes(searchTxt ? searchTxt.toLowerCase() : '')),
      ),
    );
    this.filteredSubs = this.substitutionJuryFilter.valueChanges.pipe(
      startWith(''),
      map((searchTxt) =>
        this.substituteJuries.filter((jury) => jury && jury.last_name.toLowerCase().includes(searchTxt ? searchTxt.toLowerCase() : '')),
      ),
    );
  }

  setSchoolFilter(id: string) {
    this.filteredValues.school = id;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getJuryTableDropdownData();
      this.getAllScheduleJuryMember('setSchoolFilter');
    }
  }

  setTitleFilter(id: string) {
    this.filteredValues.rncp_title = id;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getJuryTableDropdownData();
      this.getAllScheduleJuryMember('setTitleFilter');
    }
  }

  setPresidentFilter(id: string) {
    this.filteredValues.president_of_jury = id;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getJuryTableDropdownData();
      this.getAllScheduleJuryMember('setPresidentFilter');
    }
  }

  setProJuryFilter(id: string) {
    this.filteredValues.professional_jury_member = id;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getJuryTableDropdownData();
      this.getAllScheduleJuryMember('setProJuryFilter');
    }
  }

  setAcadJuryFilter(id: string) {
    this.filteredValues.academic_jury_member = id;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getJuryTableDropdownData();
      this.getAllScheduleJuryMember('setAcadJuryFilter');
    }
  }

  setSubsJuryFilter(id: string) {
    this.filteredValues.substitution_jury_member = id;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getJuryTableDropdownData();
      this.getAllScheduleJuryMember('setSubsJuryFilter');
    }
  }

  getAllScheduleStudent() {
    const payload = {
      user_type_login_id: this.utilService.getCurrentUserType(),
      student_id: this.studentData._id,
    };
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };

    this.isLoading = true;
    this.subs.sink = this.juryService
      .getStudentJuriesSchedules(payload.student_id, payload.user_type_login_id, pagination, this.sortValue)
      .subscribe(
        (resp) => {

          if (resp && resp.length) {
            const response = _.cloneDeep(resp);
            this.juryStudentName = resp[0].jury_organization_id ? resp[0].jury_organization_id.name : '';
            this.tutorialService.setJuryName(this.juryStudentName);
            response.forEach((schedule) => {
              if (schedule && schedule.time) {
                const time = schedule.time;
                if (time && time.date && time.start && time.finish) {
                  schedule.time.utcDate = time.date;
                  schedule.time.utcStart = time.start;
                  schedule.time.utcFinish = time.finish;
                  schedule.time.date = this.convertUTCToLocalDate({ date: time.date, time_start: time.start });
                  schedule.time.start = this.parseUtcToLocal.transform(time.start);
                  schedule.time.finish = this.parseUtcToLocal.transform(time.finish);
                }
              }
              if (
                schedule &&
                schedule.jury_organization_id &&
                (schedule.jury_organization_id.jury_activity === 'visio_jury' || schedule.jury_organization_id.online_jury_organization)
              ) {
                this.onlineJuryOrganization = true;
              }
              if (schedule && schedule.jury_organization_id && schedule.jury_organization_id.jury_member_required) {
                this.juryMemberRequired = true;
              }
            });

            let tempDisplayed = [];
            let tempFilterDisplayed = [];
            if (this.juryMemberRequired) {
              tempDisplayed = [
                'select',
                'lastName',
                'region',
                'date',
                'start',
                'presidentJury',
                'professionalJury',
                'academicJury',
                'substitutionJury',
              ];
              tempFilterDisplayed = [
                'selectFilter',
                'lastNameFilter',
                'regionFilter',
                'dateFilter',
                'startFilter',
                'presidentJuryFilter',
                'professionalJuryFilter',
                'academicJuryFilter',
                'substitutionJuryFilter',
              ];

              if (this.onlineJuryOrganization) {
                tempDisplayed.push('visioJury');
                tempDisplayed.push('action');
                tempFilterDisplayed.push('visioJuryFilter');
                tempFilterDisplayed.push('actionFilter');
              } else {
                tempDisplayed.push('action');
                tempFilterDisplayed.push('actionFilter');
              }
            } else {
              tempDisplayed = ['select', 'lastName', 'region', 'date', 'start', 'presidentJury'];
              tempFilterDisplayed = ['selectFilter', 'lastNameFilter', 'regionFilter', 'dateFilter', 'startFilter', 'presidentJuryFilter'];

              if (this.onlineJuryOrganization) {
                tempDisplayed.push('visioJury');
                tempDisplayed.push('action');
                tempFilterDisplayed.push('visioJuryFilter');
                tempFilterDisplayed.push('actionFilter');
              } else {
                tempDisplayed.push('action');
                tempFilterDisplayed.push('actionFilter');
              }
            }

            this.displayedColumns = tempDisplayed;
            this.filterColumns = tempFilterDisplayed;



            this.dataSource.data = response;
            this.dataCount = response[0] && response[0].count_document ? response[0].count_document : 0;
            this.isLoading = false;
          } else {
            this.dataSource.data = [];
            this.dataCount = 0;
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

  downloadJuryKit() {
    // download here
    this.isWaitingResponse = true;
    this.subs.sink = this.juryService.getSurvivalKitZipUrl(this.juryOrgId).subscribe(
      (resp) => {

        if (resp) {
          this.downloadFile(resp);
        }
        this.isWaitingResponse = false;
      },
      (err) => {
        this.isWaitingResponse = false;

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: 'OK',
        });
      },
    );
  }

  downloadFile(fileUrl: string) {
    const a = document.createElement('a');
    a.target = 'blank';
    a.href = `${environment.apiUrl}/fileuploads/${fileUrl}?download=true`.replace('/graphql', '');
    a.download = fileUrl;
    a.click();
    a.remove();
  }

  getJuryOrganizationData() {
    this.isLoading = true;
    this.subs.sink = this.juryService.getOneJuryOrganizationDataById(this.juryOrgId).subscribe(
      (resp) => {
        if (resp) {
          this.juryOrganization = _.cloneDeep(resp);

          if (this.juryOrganization.jury_activity === 'visio_jury' || this.juryOrganization.online_jury_organization) {
            this.onlineJuryOrganization = true;
          }
          if (this.juryOrganization.jury_member_required) {
            this.juryMemberRequired = this.juryOrganization.jury_member_required;
          }
          if (this.juryOrganization && this.juryOrganization.name) {
            this.tutorialService.setJuryName(this.juryOrganization.name);
          }

          this.isNewFlow = this.juryOrganization.is_new_flow;

          let tempDisplayed = [];
          let tempFilterDisplayed = [];
          if (this.juryMemberRequired || this.isNewFlow) {
            tempDisplayed = [
              'select',
              'school',
              'rncpTitles',
              'lastName',
              'region',
              'date',
              'start',
              'presidentJury',
              'professionalJury',
              'academicJury',
              'substitutionJury',
            ];
            tempFilterDisplayed = [
              'selectFilter',
              'schoolFilter',
              'rncpTitlesFilter',
              'lastNameFilter',
              'regionFilter',
              'dateFilter',
              'startFilter',
              'presidentJuryFilter',
              'professionalJuryFilter',
              'academicJuryFilter',
              'substitutionJuryFilter',
            ];
          } else {
            tempDisplayed = ['select', 'school', 'rncpTitles', 'lastName', 'region', 'date', 'start', 'presidentJury'];
            tempFilterDisplayed = [
              'selectFilter',
              'schoolFilter',
              'rncpTitlesFilter',
              'lastNameFilter',
              'regionFilter',
              'dateFilter',
              'startFilter',
              'presidentJuryFilter',
            ];
          }

          if (this.isUserADMTC && this.onlineJuryOrganization) {
            tempDisplayed.push('rehearsalDone');
            tempFilterDisplayed.push('rehearsalDoneFilter');
          }
          tempDisplayed.push('markEntryStatus');
          tempFilterDisplayed.push('markEntryStatusFilter');
          tempDisplayed.push('action');
          tempFilterDisplayed.push('actionFilter');
          if (this.juryOrganization.type === 'retake_jury') {
            tempDisplayed.push('retakeCenter');
            tempFilterDisplayed.push('retakeCenterFilter');
          }

          this.displayedColumns = tempDisplayed;
          this.filterColumns = tempFilterDisplayed;

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

  launchSession(row) {

    if (
      ((row.students && row.students.student_id && row.students.student_id._id) ||
        (row.test_groups && row.test_groups.group_id && row.test_groups.group_id._id)) &&
      row._id &&
      row.time
    ) {
      if (row && row.jury_organization_id && row.jury_organization_id.is_google_meet) {
        this.launchGoogleMeet(row);
        return;
      }

      if (!this.isMeetingEnded(row)) {
        if (this.isMeetingStarted(row)) {
          const timeDiff = this.calculateTimeDiff(row);
          if (row.students && row.students.student_id && row.students.student_id._id) {
            this.subs.sink = this.juryService.launchJurySessionForJury(row._id, row.students.student_id._id, timeDiff).subscribe((resp) => {
              if (resp) {
                window.open(resp.meetingURL, '_blank');
              }
            });
          } else if (row.test_groups && row.test_groups.group_id && row.test_groups.group_id._id) {
            this.subs.sink = this.juryService
              .launchJurySessionForJuryGroup(row._id, row.test_groups.group_id._id, timeDiff)
              .subscribe((resp) => {
                if (resp) {
                  window.open(resp.meetingURL, '_blank');
                }
              });
          }
        } else {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('JURY_S27.TITLE'),
            html: this.translate.instant('JURY_S27.TEXT'),
            footer: `<span style="margin-left: auto">JURY_S27</span>`,
            confirmButtonText: this.translate.instant('JURY_S27.BUTTON'),
          });
        }
      } else {
        Swal.fire({
          type: 'error',
          title: this.translate.instant('JURY_S28.TITLE'),
          html: this.translate.instant('JURY_S28.TEXT'),
          footer: `<span style="margin-left: auto">JURY_S28</span>`,
          confirmButtonText: this.translate.instant('JURY_S28.BUTTON'),
        });
      }
    } else {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('Error'),
        html: this.translate.instant('Data is Not Complete'),
        confirmButtonText: this.translate.instant('OK'),
      });
    }
  }

  launchSessionStudent(row) {

    if (
      ((row.students && row.students.student_id && row.students.student_id._id) ||
        (row.test_groups && row.test_groups.group_id && row.test_groups.group_id._id)) &&
      row._id &&
      row.time
    ) {
      if (row && row.jury_organization_id && row.jury_organization_id.is_google_meet) {
        this.launchGoogleMeet(row);
        return;
      }

      if (!this.isMeetingEnded(row)) {
        if (this.isMeetingStarted(row)) {
          const timeDiff = this.calculateTimeDiff(row);

          if (this.utilService.isUserStudent()) {
            this.subs.sink = this.juryService
              .launchJurySessionForStudent(row._id, this.utilService.getCurrentUser()._id, timeDiff)
              .subscribe(
                (resp) => {
                  if (resp) {
                    window.open(resp.meetingURL, '_blank');
                  }
                },
                (err) => {

                  Swal.fire({
                    type: 'error',
                    title: 'Error',
                    text: err && err['message'] ? err['message'] : err,
                    confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
                  });
                },
              );
          }
        } else {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('JURY_S27.TITLE'),
            html: this.translate.instant('JURY_S27.TEXT'),
            footer: `<span style="margin-left: auto">JURY_S27</span>`,
            confirmButtonText: this.translate.instant('JURY_S27.BUTTON'),
          });
        }
      } else {
        Swal.fire({
          type: 'error',
          title: this.translate.instant('JURY_S28.TITLE'),
          html: this.translate.instant('JURY_S28.TEXT'),
          footer: `<span style="margin-left: auto">JURY_S28</span>`,
          confirmButtonText: this.translate.instant('JURY_S28.BUTTON'),
        });
      }
    } else {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('Error'),
        html: this.translate.instant('Data is Not Complete'),
        confirmButtonText: this.translate.instant('OK'),
      });
    }
  }

  isMeetingEnded(row) {
    const now = new Date();
    const today = moment(new Date(now.getTime() + now.getTimezoneOffset() * 60000));
    const date = moment(row.time.utcDate).format('DD/MM/YYYY');
    const time = row.time.utcFinish;
    const startSession = moment(date + row.time.utcStart, 'DD/MM/YYYYHH:mm');
    const stopSession = moment(date + time, 'DD/MM/YYYYHH:mm').add(15, 'minutes');

    if (stopSession.isBefore(startSession)) {
      stopSession.add(1, 'day');
    }

    return today.isAfter(stopSession);
  }

  isMeetingStarted(row) {
    const now = new Date();
    const today = moment(new Date(now.getTime() + now.getTimezoneOffset() * 60000));
    const todayPlus15Min = moment(today).add(15, 'minutes');
    const date = moment(row.time.utcDate).format('DD/MM/YYYY');
    const time_start = row.time.utcStart;
    const time_finish = row.time.utcFinish;
    const startSession = moment(date + time_start, 'DD/MM/YYYYHH:mm');
    const stopSession = moment(date + time_finish, 'DD/MM/YYYYHH:mm').add(15, 'minutes');




    if (stopSession.isBefore(startSession)) {
      stopSession.add(1, 'day');
    }

    return todayPlus15Min.isAfter(startSession) && today.isBefore(stopSession);
  }

  joinRehearsalRoom() {
    let timeDisabled = 6;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('JURY_S30.TITLE'),
      html: this.translate.instant('JURY_S30.TEXT', {
        image: '<img src="../../../assets/img/access-jury-btn.png" height="30px">',
      }),
      footer: `<span style="margin-left: auto">JURY_S30</span>`,
      allowEscapeKey: false,
      allowOutsideClick: false,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('JURY_S30.OK'),
      cancelButtonText: this.translate.instant('CANCEL'),
      onOpen: () => {
        Swal.disableConfirmButton();
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('JURY_S30.OK') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('JURY_S30.OK');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then(
      (isConfirm) => {
        clearTimeout(this.timeOutVal);
        this.timeOutVal = null;
        if (isConfirm.value) {
          this.subs.sink = this.juryService.JoinRehearsalRoom(this.juryOrgId).subscribe((resp) => {
            if (resp) {
              window.open(resp.meetingURL, '_blank');
            }
          });
        }
      },
      function (dismiss) {},
    );
  }

  joinRehearsalRoomStudent(row) {
    let timeDisabled = 6;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('JURY_S30.TITLE'),
      html: this.translate.instant('JURY_S30.TEXT', {
        image: '<img src="../../../assets/img/access-jury-btn.png" height="30px">',
      }),
      footer: `<span style="margin-left: auto">JURY_S30</span>`,
      allowEscapeKey: false,
      allowOutsideClick: false,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('JURY_S30.OK'),
      cancelButtonText: this.translate.instant('CANCEL'),
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('JURY_S30.OK') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('JURY_S30.OK');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then(
      (isConfirm) => {
        clearTimeout(this.timeOutVal);
        this.timeOutVal = null;
        if (isConfirm.value) {
          const duration = this.calculateDateTimeDiff(row);


          if (row.students && row.students.student_id && row.students.student_id._id) {
            this.subs.sink = this.juryService.JoinStudentRehearsalRoom(row._id, row.students.student_id._id, duration).subscribe((resp) => {
              if (resp) {
                window.open(resp.meetingURL, '_blank');
              }
            });
          } else if (row.test_groups && row.test_groups.group_id && row.test_groups.group_id._id) {
            this.subs.sink = this.juryService
              .JoinStudentRehearsalRoom(row._id, row.test_groups.group_id._id, duration)
              .subscribe((resp) => {
                if (resp) {
                  window.open(resp.meetingURL, '_blank');
                }
              });
          }
        }
      },
      function (dismiss) {},
    );
  }

  helpStudent(row) {
    let timeDisabled = 6;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('JURY_S30.TITLE'),
      html: this.translate.instant('JURY_S30.TEXT', {
        image: '<img src="../../../assets/img/access-jury-btn.png" height="30px">',
      }),
      footer: `<span style="margin-left: auto">JURY_S30</span>`,
      allowEscapeKey: false,
      allowOutsideClick: false,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('JURY_S30.OK'),
      cancelButtonText: this.translate.instant('CANCEL'),
      onOpen: () => {
        Swal.disableConfirmButton();
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('JURY_S30.OK') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('JURY_S30.OK');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then(
      (isConfirm) => {
        if (isConfirm.value) {
          const duration = this.calculateDateTimeDiff(row);
          if (row.students && row.students.student_id && row.students.student_id._id) {
            this.subs.sink = this.juryService.JoinStudentRehearsalRoom(row._id, row.students.student_id._id, duration).subscribe((resp) => {
              if (resp) {
                window.open(resp.meetingURL, '_blank');
              }
            });
          } else if (row.test_groups && row.test_groups.group_id && row.test_groups.group_id._id) {
            this.subs.sink = this.juryService
              .JoinStudentRehearsalRoom(row._id, row.test_groups.group_id._id, duration)
              .subscribe((resp) => {
                if (resp) {
                  window.open(resp.meetingURL, '_blank');
                }
              });
          }
        }
      },
      function (dismiss) {},
    );
  }

  generatePDFGrandOral(data) {

    if (data.jury_organization_id && data.jury_organization_id._id) {
      if (
        data &&
        data.students &&
        data.students.student_id &&
        data.students.student_id.grand_oral_pdfs &&
        data.students.student_id.grand_oral_pdfs.length
      ) {
        const currentUser = this.authService.getCurrentUser();
        // if (
        //   currentUser &&
        //   currentUser.entities &&
        //   currentUser.entities[0] &&
        //   currentUser.entities[0].type &&
        //   currentUser.entities[0].type._id &&
        //   data['jury_organization_id'] &&
        //   data['jury_organization_id']['_id']
        // ) {
        //   const userType = currentUser.entities[0].type._id;

        //   this.subs.sink = this.acadKitService
        //     .getGrandOralPDF(data.jury_organization_id._id, data.students.student_id._id, userType)
        //     .subscribe((resp) => {

        //       const url = `${environment.apiUrl}/fileuploads/${resp}`.replace('/graphql', '');
        //       window.open(url, '_blank');
        //     });
        // }
        const grandOralPDF = data.students.student_id.grand_oral_pdfs.filter(
          (list) => list.grand_oral_id._id === data.jury_organization_id._id,
        );
        if (grandOralPDF && grandOralPDF.length && grandOralPDF[0].grand_oral_pdf_jury) {
          const element = document.createElement('a');
          element.href = this.serverimgPath + grandOralPDF[0].grand_oral_pdf_jury;
          element.target = '_blank';
          element.setAttribute('download', data);
          element.click();
        } else {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('NOT RECORD FOUND'),
            confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_MARK_ERROR.BUTTON'),
          });
        }
      }
    }
  }

  checkPDFGrandOral(data) {
    let checked = false;
    if (data.jury_organization_id && data.jury_organization_id._id) {
      if (
        data &&
        data.students &&
        data.students.student_id &&
        data.students.student_id.grand_oral_pdfs &&
        data.students.student_id.grand_oral_pdfs.length
      ) {
        const grandOralPDF = data.students.student_id.grand_oral_pdfs.filter(
          (list) => list.grand_oral_id._id === data.jury_organization_id._id,
        );
        if (grandOralPDF && grandOralPDF.length && grandOralPDF[0].grand_oral_pdf_jury) {
          checked = true;
        } else {
          checked = false;
        }
      }
    }
    return checked;
  }

  goToMarkEntry(row) {

    if (
      row &&
      row.mark_entry_assigned &&
      row.mark_entry_assigned.task_id &&
      row.mark_entry_assigned.task_id._id &&
      row.mark_entry_task_status &&
      row.mark_entry_task_status.toLowerCase() !== 'done'
    ) {
      this.subs.sink = this.taskService.getOneTask(row.mark_entry_assigned.task_id._id).subscribe((response) => {
        if (response) {
          const task = response;
          window.open(`./test-correction/${task.rncp._id}/${task.test._id}?task=${task._id}&school=${task.school._id}`, '_blank');
        } else {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('JURY_ORGANIZATION.JURY_MARK_ERROR.TITLE'),
            html: this.translate.instant('JURY_ORGANIZATION.JURY_MARK_ERROR.TEXT'),
            footer: `<span style="margin-left: auto">JURY_MARK_ERROR</span>`,
            confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_MARK_ERROR.BUTTON'),
          });
        }
      });
    } else {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('JURY_ORGANIZATION.JURY_MARK_ERROR.TITLE'),
        html: this.translate.instant('JURY_ORGANIZATION.JURY_MARK_ERROR.TEXT'),
        footer: `<span style="margin-left: auto">JURY_MARK_ERROR</span>`,
        confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_MARK_ERROR.BUTTON'),
      });
    }
  }

  goToMarkEntryGrandOral(row) {

    const taskId = row.mark_entry_assigned.task_id;
    const markEntryTaskStatus = row.mark_entry_task_status.toLowerCase();

    const correctorGO =
      taskId &&
      taskId._id &&
      markEntryTaskStatus &&
      (markEntryTaskStatus === 'todo' || markEntryTaskStatus === 'in_progress') &&
      (this.isPresidentJury || this.isJuryCorector);

    const certifier =
      taskId &&
      taskId._id &&
      markEntryTaskStatus &&
      this.isCertifierAdmin;

    if (this.isUserADMTC || correctorGO || certifier) {
      window.open(`./grand-oral?juryId=${row.jury_organization_id._id}&studentId=${row.students.student_id._id}`, '_blank');
    } else {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('JURY_ORGANIZATION.JURY_MARK_ERROR.TITLE'),
        html: this.translate.instant('JURY_ORGANIZATION.JURY_MARK_ERROR.TEXT'),
        footer: `<span style="margin-left: auto">JURY_MARK_ERROR</span>`,
        confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_MARK_ERROR.BUTTON'),
      });
    }
  }

  isDisplayPostponeButton(row) {
    if (
      (this.isPresidentJury || this.isCertifierAdmin) &&
      ((row.students && row.students.student_id && row.students.student_id._id) ||
        (row.test_groups && row.test_groups.group_id && row.test_groups.group_id._id)) &&
      !this.isMeetingEnded(row)
    ) {
      return true;
    } else if (
      this.isUserADMTC &&
      ((row.students && row.students.student_id && row.students.student_id._id) ||
        (row.test_groups && row.test_groups.group_id && row.test_groups.group_id._id))
    ) {
      return true;
    }
    return false;
  }

  checkJuryType() {
    if (
      this.juryOrganization.type === 'retake_grand_oral' ||
      (this.juryOrganization.type === 'grand_oral' && this.juryOrganization.is_new_flow)
    ) {
      return true;
    } else {
      return false;
    }
  }

  openPostponeMeetingDialog(row) {


    const juryOrgId = row && row.jury_organization_id && row.jury_organization_id._id ? row.jury_organization_id._id : null;
    // const titleId = row && row.rncp_title && row.rncp_title._id ? row.rncp_title._id : null;
    // const classId = row && row.class && row.class._id ? row.class._id : null;
    // const schoolId = row && row.school && row.school._id ? row.school._id : null;
    // let datesAll = [];
    const presidentJuryId = row && row.president_of_jury && row.president_of_jury._id ? row.president_of_jury._id : null;

    this.subs.sink = this.juryService.CheckPresidentJuryHaveBackupDate(row._id).subscribe((res) => {

      if (typeof res === 'boolean') {
        const dialogRef = this.dialog.open(PostponeDialogComponent, {
          width: '400px',
          panelClass: 'no-padding-pop-up',
          disableClose: true,
          data: {
            select_from_current_president_of_jury: res,
            juryData: row,
          },
        });
        dialogRef.afterClosed().subscribe((result) => {
          if (result) {
            if (this.juryOrgId) {
              this.getAllScheduleJuryMember('openPostponeMeetingDialog');
            } else if (this.studentData) {
              this.getAllScheduleStudent();
            }
          }
        });
      } else {
        // when doesnt have date
      }
    });

    // this.subs.sink = this.juryService.getBackupSchedulesForPostpone(juryOrgId, titleId, classId, schoolId).subscribe(
    //   (resp) => {
    //     if (resp) {
    //       const schedules = _.cloneDeep(resp);
    //       if (schedules && schedules.length) {
    //         const dates = [];
    //         schedules.forEach((schedule) => {
    //           const temp: any = [];
    //           temp.push({
    //             backup_schedule_id: schedule._id,
    //             date_start: this.convertUTCToLocalDate({ date: schedule.date_start, time_start: schedule.start_time }),
    //             start_time: this.parseUtcToLocal.transform(schedule.start_time),
    //             timeslot: schedule.students.length ? schedule.students : schedule.test_groups,
    //             label: this.convertUTCToLocalDateFormatted({ date: schedule.date_start, time_start: schedule.start_time }),
    //           });

    //           if (temp && temp.length) {
    //             temp.forEach((rawDate) => {
    //               if (rawDate && rawDate.timeslot && rawDate.timeslot.length) {
    //                 rawDate.timeslot.forEach((time) => {
    //                   time.date_start = this.convertUTCToLocalDate({ date: time.date_start, time_start: time.test_hours_start });
    //                   time['label'] = this.convertUTCToLocalDateFormatted({ date: time.date_start, time_start: time.test_hours_start });
    //                   time.test_hours_start = this.parseUtcToLocal.transform(time.test_hours_start);
    //                   time.test_hours_finish = this.parseUtcToLocal.transform(time.test_hours_finish);
    //                 });
    //               }
    //               if (moment(rawDate.dateStart).isSameOrAfter(moment(this.today))) {
    //                 dates.push(rawDate);
    //               }
    //             });
    //           }
    //         });
    //         datesAll = dates;

    //         const dialogRef = this.dialog.open(PostponeDialogComponent, {
    //           width: '400px',
    //           panelClass: 'no-padding-pop-up',
    //           disableClose: true,
    //           data: {
    //             dates: datesAll,
    //             juryData: row,
    //           },
    //         });
    //         dialogRef.afterClosed().subscribe((result) => {
    //           if (result) {
    //             if (this.juryOrgId) {
    //               this.getAllScheduleJuryMember();
    //             } else if (this.studentData) {
    //               this.getAllScheduleStudent();
    //             }
    //           }
    //         });
    //       } else {
    //         Swal.fire({
    //           type: 'error',
    //           title: this.translate.instant('JURY_S23_BACKUP.TITLE'),
    //           html: this.translate.instant('JURY_S23_BACKUP.TEXT'),
    //           confirmButtonText: this.translate.instant('JURY_S23_BACKUP.BUTTON'),
    //         });
    //       }
    //     }
    //   },
    //   (err) => {
    //     datesAll = [];

    //     Swal.fire({
    //       type: 'error',
    //       title: 'Error',
    //       text: err && err['message'] ? err['message'] : err,
    //       confirmButtonText: 'OK',
    //     });
    //   },
    // );
  }

  openRetakeGrandOralPostponeDialog(element) {
    this.dialog
      .open(SetSessionJuriesIndividualComponent, {
        panelClass: 'certification-rule-pop-up',
        data: {
          _id: element._id,
          juryOrgData: this.juryOrganization,
          schoolId: element.school._id,
          juryOrgId: this.juryOrgId,
          is_postpone: true,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {

          this.populateData();
        }
      });
  }

  getRecordedMeeting(row) {
    window.open(row.recorded_video_link, '_blank');
  }

  checkVisibility(rowData: any) {
    if (this.isUserADMTC) {
      return true;
    }
    if (this.studentData) {
      if (!rowData.replay_visible_for_student) {
        return false;
      } else {
        return true;
      }
    } else {
      if (this.isCertifierAdmin || this.isPresidentJury) {
        if (!rowData.replay_visible_for_certifier) {
          return false;
        } else {
          return true;
        }
      } else if (this.isAcadDirMin) {
        if (!rowData.replay_visible_For_academic_director) {
          return false;
        } else {
          return true;
        }
      } else {
        if (!rowData.replay_visible_for_jury_member) {
          return false;
        } else {
          return true;
        }
      }
    }
  }

  isWithin8HoursAfterMeetingEnded(row) {
    const now = new Date();
    const today = moment(new Date(now.getTime() + now.getTimezoneOffset() * 60000));

    const date = moment(row.time.utcDate).format('DD/MM/YYYY');
    const time = row.time.utcFinish;
    const stopSession = moment(date + time, 'DD/MM/YYYYHH:mm');
    const stopSessionPlus8Hours = moment(stopSession).add(8, 'hours');

    return today.isSameOrBefore(stopSessionPlus8Hours);
  }

  customFilterPredicate() {
    return function (data, filter: string): boolean {
      const searchString = JSON.parse(filter);
      let newDate = moment(searchString.date).format('YYYY-MM-DD');
      newDate = newDate !== 'Invalid date' ? newDate : '';
      const dateFound = data.time.date.toString().trim().toLowerCase().indexOf(newDate) !== -1;
      const schoolFound = data.school.shortName.toString().trim().toLowerCase().indexOf(searchString.school.toLowerCase()) !== -1;

      const rncpTitlesFound =
        data.rncpTitle.shortName.toString().trim().toLowerCase().indexOf(searchString.rncpTitles.toLowerCase()) !== -1;

      const lastNameFound = data.student.lastName.toString().trim().toLowerCase().indexOf(searchString.lastName.toLowerCase()) !== -1;

      const regionFound = data.student.address.city.toString().trim().toLowerCase().indexOf(searchString.region) !== -1;

      const presidentJuryFound = data.presidentJury.toString().trim().toLowerCase().indexOf(searchString.presidentJury) !== -1;

      const professionalJuryFound = data.professionalJury.toString().trim().toLowerCase().indexOf(searchString.professionalJury) !== -1;

      const academicJuryFound = data.academicJury.toString().trim().toLowerCase().indexOf(searchString.academicJury) !== -1;

      const substitutionJuryFound = data.substitutionJury.toString().trim().toLowerCase().indexOf(searchString.substitutionJury) !== -1;

      return (
        dateFound &&
        schoolFound &&
        rncpTitlesFound &&
        lastNameFound &&
        regionFound &&
        presidentJuryFound &&
        professionalJuryFound &&
        academicJuryFound &&
        substitutionJuryFound
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

  resetAllFilter() {
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sortValue = null;
    // this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.filteredValues = {
      date_start: '',
      date_finish: '',
      school: '',
      rncp_title: '',
      name_of_participant: '',
      region: '',
      date: '',
      start_time: '',
      president_of_jury: '',
      professional_jury_member: '',
      academic_jury_member: '',
      substitution_jury_member: '',
      rehearsal_reminder: null,
      offset: moment().utcOffset(),
      mark_entry_status: null,
    };
    this.dateFromFilter.setValue('', { emitEvent: false });
    this.dateToFilter.setValue('', { emitEvent: false });
    this.schoolFilter.setValue('', { emitEvent: false });
    this.rncpTitlesFilter.setValue('', { emitEvent: false });
    this.lastNameFilter.setValue('', { emitEvent: false });
    this.regionFilter.setValue('', { emitEvent: false });
    this.dateFilter.setValue('', { emitEvent: false });
    this.timeFilter.setValue('', { emitEvent: false });
    this.presidentJuryFilter.setValue('', { emitEvent: false });
    this.professionalJuryFilter.setValue('', { emitEvent: false });
    this.academicJuryFilter.setValue('', { emitEvent: false });
    this.substitutionJuryFilter.setValue('', { emitEvent: false });
    this.rehearsalFilter.setValue(null, { emitEvent: false });
    this.markEntryStatusFilter.setValue(null, {emitEvent: false});

    if (this.juryOrgId) {
      this.getAllScheduleJuryMember('resetAllFilter');
      this.getJuryTableDropdownData();
    } else if (this.studentData) {
      this.getAllScheduleStudent();
    }
  }

  convertUTCToLocalDate(data) {
    const date = moment(data.date).format('DD/MM/YYYY');
    const time = data.time_start;

    const dateTimeInLocal = moment(date + time, 'DD/MM/YYYYHH:mm');
    return dateTimeInLocal.toISOString();
  }

  isBeforeMeetingStarted(row) {
    const now = new Date();
    const today = moment(new Date(now.getTime() + now.getTimezoneOffset() * 60000));

    const date = moment(row.time.utcDate).format('DD/MM/YYYY');
    const time_start = row.time.utcStart;
    const startSession = moment(date + time_start, 'DD/MM/YYYYHH:mm');
    const startSessionMinus15Minute = moment(startSession).subtract(15, 'minutes');

    return today.isBefore(startSessionMinus15Minute);
  }

  calculateDateTimeDiff(row): number {
    const now = new Date();
    const today = moment(new Date(now.getTime() + now.getTimezoneOffset() * 60000));

    const date = moment(row.time.utcDate).format('DD/MM/YYYY');
    const time_start = row.time.utcStart;
    const startSession = moment(date + time_start, 'DD/MM/YYYYHH:mm').subtract(15, 'minutes');

    return startSession.diff(today, 'minutes');
  }

  calculateTimeDiff(row): number {
    const hour = moment().hour();
    const minute = moment().minute();

    const currentTime = moment(`${hour.toString()}:${minute.toString()}`, 'HH:mm:ss');
    const startSession = moment(row.time.start, 'HH:mm');
    const endSession = moment(row.time.finish, 'HH:mm');
    const duration = moment(endSession).diff(startSession, 'minutes');

    // if duration from current time to start time is more than 0, return that duration
    if (moment(startSession).diff(currentTime, 'minutes') >= 0) {
      return moment(startSession).diff(currentTime, 'minutes') + duration;
    } else {
      // return duration from current time to end time
      return moment(endSession).diff(currentTime, 'minutes');
    }
  }

  getInAppTutorial(type) {
    // const permission = this.isPermission && this.isPermission.length && this.isPermission[0] ? this.isPermission[0] : [];
    const currentUser = this.utilService.getCurrentUser();
    const userType = currentUser.entities[0].type.name;
    this.subs.sink = this.tutorialService.GetAllInAppTutorialsByModule(type, userType).subscribe((list) => {
      if (list && list.length) {
        const tutorialData = list.filter((tutorial) => {
          return tutorial.is_published === true && tutorial.module === type;
        });
        this.tutorialData = tutorialData[0];
        if (this.tutorialData) {
          this.isTutorialAdded = true;
        } else {
          this.isTutorialAdded = false;
        }
      }
    });
  }

  toggleTutorial() {
    this.tutorialService.setTutorialView(this.tutorialData);

    if (this.coreService.sidenavOpen) {
      this.coreService.sidenavOpen = !this.coreService.sidenavOpen;
    }
    this.coreService.sidenavTutorialOpen = !this.coreService.sidenavTutorialOpen;
  }

  panic() {
    const currentUser = this.utilService.getCurrentUser();
    const whatsAppUrl = 'https://api.whatsapp.com/send?phone=6593722206&text=';
    let whatsAppText = '';
    if (this.isUserADMTC) {
      whatsAppText = this.translate.instant('PANIC.MESSAGE_ADMTC', {
        userName: `${this.translate.instant(currentUser.civility)} ${currentUser.first_name} ${currentUser.last_name}`,
        userType:
          currentUser.entities && currentUser.entities[0] && currentUser.entities[0].type && currentUser.entities[0].type.name
            ? this.translate.instant(currentUser.entities[0].type.name)
            : '',
        juryName: this.juryOrganization.name,
      });
    } else {
      whatsAppText = this.translate.instant('PANIC.MESSAGE', {
        userName: `${this.translate.instant(currentUser.civility)} ${currentUser.first_name} ${currentUser.last_name}`,
        userType:
          currentUser.entities && currentUser.entities[0] && currentUser.entities[0].type && currentUser.entities[0].type.name
            ? this.translate.instant(currentUser.entities[0].type.name)
            : '',
        school:
          currentUser.entities && currentUser.entities[0] && currentUser.entities[0].school && currentUser.entities[0].school.short_name
            ? currentUser.entities[0].school.short_name
            : '',
        juryName: this.juryOrganization.name,
      });
    }


    window.open(whatsAppUrl + whatsAppText, '_blank');
  }

  panicStudent(row) {

    let message = '';
    const currentUser = this.authService.getCurrentUser();

    this.subs.sink = this.juryService.whatsappButtonClicked(currentUser.student_id._id, row.jury_organization_id._id).subscribe((resp) => {
      const whatsAppUrl = 'https://api.whatsapp.com/send?phone=6593722206&text=';
      message += this.translate.instant('PANIC.MESSAGE_STUDENT_1', {
        userName: `${this.translate.instant(currentUser.civility)} ${currentUser.first_name} ${currentUser.last_name}`,
        userType:
          currentUser.entities && currentUser.entities[0] && currentUser.entities[0].type && currentUser.entities[0].type.name
            ? this.translate.instant(currentUser.entities[0].type.name)
            : '',
        school:
          currentUser.entities && currentUser.entities[0] && currentUser.entities[0].school && currentUser.entities[0].school.short_name
            ? currentUser.entities[0].school.short_name
            : '',
        juryName: row && row.jury_organization_id && row.jury_organization_id.name ? row.jury_organization_id.name : '',
      });
      message += this.translate.instant('PANIC.MESSAGE_STUDENT_2', {
        dateSession: row && row.time && row.time.date ? moment(row.time.date).format('DD/MM/YYYY') : '',
        time: row && row.time && row.time.start ? row.time.start : '',
      });
      message += this.translate.instant('PANIC.MESSAGE_STUDENT_3');
      const whatsAppText = message;


      window.open(whatsAppUrl + whatsAppText, '_blank');
    });
  }

  searchTodayResult() {
    const newDate = moment(new Date()).format('YYYY-MM-DD');
    this.dateFromFilter.setValue(newDate, { emitEvent: true });
  }

  convertUTCToLocalDateFormatted(data) {
    const date = moment(data.date).format('DD/MM/YYYY');
    const time = data.time_start;

    const dateTimeInLocal = moment(date + time, 'DD/MM/YYYYHH:mm');
    return dateTimeInLocal.format('DD/MM/YYYY');
  }

  // panicTooltip() {
  //   return this.translate.instant('PANIC.BTN_TITLE') + this.translate.instant('PANIC.PANIC.BTN_TEXT_CLEAN');
  // }

  sendMail(data) {
    this.subs.sink = this.dialog.open(UserEmailDialogComponent, {
      disableClose: true,
      width: '750px',
      data: { ...data, sendToCorrector: true },
    }).afterClosed().subscribe(() => {});
  }

  showOptions(info) {
    const numSelected = this.selection.selected.length;
    if (numSelected > 0) {
      this.disabledExport = false;
    } else {
      this.disabledExport = true;
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

  exportData() {
    Swal.close();
    const data = [];
    if (this.selectType === 'one') {
      if (this.userSelected) {
        this.isLoading = true;
        for (const item of this.userSelected) {
          const obj = [];
          let name = '-';
          let professional = '-';
          let academic = '-';
          let substite = '-';
          if (item.students && item.students.student_id) {
            const civility = item.students.student_id.civility ? this.translate.instant(item.students.student_id.civility) : '';
            const last_name = item.students.student_id.last_name ? item.students.student_id.last_name.toUpperCase() : '';
            const first_name = item.students.student_id.first_name ? this.translate.instant(item.students.student_id.first_name) : '';
            name = last_name + ' ' + first_name + ' ' + civility;
          }
          if (item.substitution_jury_member) {
            let last_name = '';
            let first_name = '-';
            if (item.substitution_jury_member.last_name) {
              last_name = item.substitution_jury_member.last_name;
            }
            if (item.substitution_jury_member.first_name) {
              first_name = item.substitution_jury_member.first_name;
            }
            substite = last_name + ' ' + first_name;
          } else {
            let last_name = '';
            let first_name = '-';
            if (item.students && item.students.substitution_jury_member && item.students.substitution_jury_member.last_name) {
              last_name = item.students.substitution_jury_member.last_name;
            }
            if (item.students && item.students.substitution_jury_member && item.students.substitution_jury_member.first_name) {
              first_name = item.students.substitution_jury_member.first_name;
            }
            substite = last_name + ' ' + first_name;
          }

          if (item.academic_jury_member) {
            let last_name = '';
            let first_name = '-';
            if (item.academic_jury_member.last_name) {
              last_name = item.academic_jury_member.last_name;
            }
            if (item.academic_jury_member.first_name) {
              first_name = item.academic_jury_member.first_name;
            }
            academic = last_name + ' ' + first_name;
          } else {
            let last_name = '';
            let first_name = '-';
            if (item.students && item.students.academic_jury_member && item.students.academic_jury_member.last_name) {
              last_name = item.students.academic_jury_member.last_name;
            }
            if (item.students && item.students.academic_jury_member && item.students.academic_jury_member.first_name) {
              first_name = item.students.academic_jury_member.first_name;
            }
            academic = last_name + ' ' + first_name;
          }

          if (item.professional_jury_member) {
            let last_name = '';
            let first_name = '-';
            if (item.professional_jury_member.last_name) {
              last_name = item.professional_jury_member.last_name;
            }
            if (item.professional_jury_member.first_name) {
              first_name = item.professional_jury_member.first_name;
            }
            professional = last_name + ' ' + first_name;
          } else {
            let last_name = '';
            let first_name = '-';
            if (item.students && item.students.professional_jury_member && item.students.professional_jury_member.last_name) {
              last_name = item.students.professional_jury_member.last_name;
            }
            if (item.students && item.students.professional_jury_member && item.students.professional_jury_member.first_name) {
              first_name = item.students.professional_jury_member.first_name;
            }
            professional = last_name + ' ' + first_name;
          }

          // TODO: From the template get the data location and add the data
          obj[0] = this.juryOrganization && this.juryOrganization.name ? this.juryOrganization.name : '-';
          obj[1] = item.school && item.school.short_name ? item.school.short_name : '-';
          obj[2] = item.rncp_title && item.rncp_title.short_name ? item.rncp_title.short_name : '-';
          obj[3] = name ? name : '-';
          obj[4] =
            item.students &&
            item.students.student_id &&
            item.students.student_id.student_address &&
            item.students.student_id.student_address.length &&
            item.students.student_id.student_address[0].city
              ? item.students.student_id.student_address[0].city
              : '-';
          obj[5] = item.time && item.time.date ? moment(item.time.date).format('DD/MM/YYYY') : '-';
          obj[6] = item.time && item.time.start ? item.time.start + ' - ' + item.time.finish : '-';
          obj[7] =
            item.president_of_jury && item.president_of_jury.last_name
              ? item.president_of_jury.last_name + ' ' + item.president_of_jury.first_name
              : '-';
          obj[8] = professional ? professional : '-';
          obj[9] = academic ? academic : '-';
          obj[10] = substite ? substite : '-';
          data.push(obj);
        }
        this.isLoading = false;
        const valueRange = { values: data };
        const today = moment().format('DD-MM-YYYY');
        const title = this.exportName + '_' + today;
        const sheetID = this.translate.currentLang === 'en' ? 0 : 51608686;
        const sheetData = {
          spreadsheetId: '1K3Z8dmqdwQcZsDYW3NALosXavnRc1hE5UFhtbEDmdnc',
          sheetId: sheetID,
          range: 'A7',
        };
        this.exportCsvService.createAndUpdateSpreadsheet(valueRange, title, sheetData);
      }
    } else {
      this.allStudentForExport = [];
      this.getAllStudentExportData(0);
    }
  }

  getAllStudentExportData(pageNumber: number) {
    const currentUser = this.utilService.getCurrentUser();
    this.isLoading = true;
    const pagination = {
      limit: 50,
      page: pageNumber,
    };

    const payload = {
      user_type_login_id: this.utilService.getCurrentUserType(),
      jury_id: this.juryOrgId,
      student_id: null,
    };

    this.isLoading = true;
    this.subs.sink = this.juryService
      .getJuriesSchedules(payload.user_type_login_id, payload.jury_id, pagination, payload.student_id, this.sortValue, this.filteredValues)
      .subscribe((resp) => {

        if (resp && resp.length) {
          const response = _.cloneDeep(resp);
          response.forEach((schedule) => {
            if (schedule && schedule.time) {
              const time = schedule.time;
              if (time && time.date && time.start && time.finish) {
                schedule.time.utcDate = time.date;
                schedule.time.utcStart = time.start;
                schedule.time.utcFinish = time.finish;
                schedule.time.date = this.convertUTCToLocalDate({ date: time.date, time_start: time.start });
                schedule.time.start = this.parseUtcToLocal.transform(time.start);
                schedule.time.finish = this.parseUtcToLocal.transform(time.finish);
              }
            }
          });
          this.allStudentForExport.push(...response);
          const page = pageNumber + 1;

          // recursively get student data by 500 until we dont get student data anymore
          // we use this way because if we get all the data at once, it will trigger cors policy error because response too big
          this.getAllStudentExportData(page);
        } else {
          this.isLoading = false;
          this.exportAllData(this.allStudentForExport);
        }
        // set isReset back to false after 400 milisecond so the subscription that has debounceTime not triggered
        setTimeout(() => (this.isReset = false), 400);
      });
  }

  exportAllData(dataa) {
    const exportData = _.cloneDeep(dataa);
    const data = [];
    if (exportData && exportData.length) {
      exportData.forEach((item) => {
        const obj = [];
        let name = '-';
        let professional = '-';
        let academic = '-';
        let substite = '-';
        if (item.students && item.students.student_id) {
          const civility = item.students.student_id.civility ? this.translate.instant(item.students.student_id.civility) : '';
          const last_name = item.students.student_id.last_name ? item.students.student_id.last_name.toUpperCase() : '';
          const first_name = item.students.student_id.first_name ? this.translate.instant(item.students.student_id.first_name) : '';
          name = last_name + ' ' + first_name + ' ' + civility;
        }
        if (item.substitution_jury_member) {
          let last_name = '';
          let first_name = '-';
          if (item.substitution_jury_member.last_name) {
            last_name = item.substitution_jury_member.last_name;
          }
          if (item.substitution_jury_member.first_name) {
            first_name = item.substitution_jury_member.first_name;
          }
          substite = last_name + ' ' + first_name;
        } else {
          let last_name = '';
          let first_name = '-';
          if (item.students && item.students.substitution_jury_member && item.students.substitution_jury_member.last_name) {
            last_name = item.students.substitution_jury_member.last_name;
          }
          if (item.students && item.students.substitution_jury_member && item.students.substitution_jury_member.first_name) {
            first_name = item.students.substitution_jury_member.first_name;
          }
          substite = last_name + ' ' + first_name;
        }

        if (item.academic_jury_member) {
          let last_name = '';
          let first_name = '-';
          if (item.academic_jury_member.last_name) {
            last_name = item.academic_jury_member.last_name;
          }
          if (item.academic_jury_member.first_name) {
            first_name = item.academic_jury_member.first_name;
          }
          academic = last_name + ' ' + first_name;
        } else {
          let last_name = '';
          let first_name = '-';
          if (item.students && item.students.academic_jury_member && item.students.academic_jury_member.last_name) {
            last_name = item.students.academic_jury_member.last_name;
          }
          if (item.students && item.students.academic_jury_member && item.students.academic_jury_member.first_name) {
            first_name = item.students.academic_jury_member.first_name;
          }
          academic = last_name + ' ' + first_name;
        }

        if (item.professional_jury_member) {
          let last_name = '';
          let first_name = '-';
          if (item.professional_jury_member.last_name) {
            last_name = item.professional_jury_member.last_name;
          }
          if (item.professional_jury_member.first_name) {
            first_name = item.professional_jury_member.first_name;
          }
          professional = last_name + ' ' + first_name;
        } else {
          let last_name = '';
          let first_name = '-';
          if (item.students && item.students.professional_jury_member && item.students.professional_jury_member.last_name) {
            last_name = item.students.professional_jury_member.last_name;
          }
          if (item.students && item.students.professional_jury_member && item.students.professional_jury_member.first_name) {
            first_name = item.students.professional_jury_member.first_name;
          }
          professional = last_name + ' ' + first_name;
        }

        // TODO: From the template get the data location and add the data
        obj[0] = this.juryOrganization && this.juryOrganization.name ? this.juryOrganization.name : '-';
        obj[1] = item.school && item.school.short_name ? item.school.short_name : '-';
        obj[2] = item.rncp_title && item.rncp_title.short_name ? item.rncp_title.short_name : '-';
        obj[3] = name ? name : '-';
        obj[4] =
          item.students &&
          item.students.student_id &&
          item.students.student_id.student_address &&
          item.students.student_id.student_address.length &&
          item.students.student_id.student_address[0].city
            ? item.students.student_id.student_address[0].city
            : '-';
        obj[5] = item.time && item.time.date ? moment(item.time.date).format('DD/MM/YYYY') : '-';
        obj[6] = item.time && item.time.start ? item.time.start + ' - ' + item.time.finish : '-';
        obj[7] =
          item.president_of_jury && item.president_of_jury.last_name
            ? item.president_of_jury.last_name + ' ' + item.president_of_jury.first_name
            : '-';
        obj[8] = professional ? professional : '-';
        obj[9] = academic ? academic : '-';
        obj[10] = substite ? substite : '-';
        data.push(obj);
      });
      this.isLoading = false;
      const valueRange = { values: data };
      const today = moment().format('DD-MM-YYYY');
      const title = this.exportName + '_' + today;
      const sheetID = this.translate.currentLang === 'en' ? 0 : 51608686;
      const sheetData = {
        spreadsheetId: '1K3Z8dmqdwQcZsDYW3NALosXavnRc1hE5UFhtbEDmdnc',
        sheetId: sheetID,
        range: 'A7',
      };
      this.exportCsvService.createAndUpdateSpreadsheet(valueRange, title, sheetData);
    }
  }

  inverseRehearsal(schedule) {
    if (schedule) {
      const juryOrgId = schedule.jury_organization_id && schedule.jury_organization_id._id ? schedule.jury_organization_id._id : null;

      // If student
      if (juryOrgId && schedule.students && schedule.students.student_id && schedule.students.student_id._id) {
        this.isLoading = true;
        this.subs.sink = this.juryService.updateSendRehearsalReminderFlagRehearsal(juryOrgId, schedule.students.student_id._id).subscribe(
          (resp) => {
            this.isLoading = false;
            if (resp) {
              Swal.fire({
                type: 'success',
                title: this.translate.instant('Bravo !'),
                confirmButtonText: this.translate.instant('OK'),
              }).then((result) => {
                this.getAllScheduleJuryMember('inverseRehearsal');
              });
            }
          },
          (err) => {
            this.isLoading = false;
          },
        );
      }
      // If groups
      else if (juryOrgId && schedule.test_groups && schedule.test_groups.group_id && schedule.test_groups.group_id._id) {
        this.isLoading = true;
        this.subs.sink = this.juryService.updateSendRehearsalReminderFlagRehearsal(juryOrgId, schedule.test_groups.group_id._id).subscribe(
          (resp) => {
            this.isLoading = false;
            if (resp) {
              Swal.fire({
                type: 'success',
                title: this.translate.instant('Bravo !'),
                confirmButtonText: this.translate.instant('OK'),
              }).then((result) => {
                this.getAllScheduleJuryMember('inverseRehearsal');
              });
            }
          },
          (err) => {
            this.isLoading = false;
          },
        );
      }
    }
  }

  inverseAideJury(schedule) {
    if (schedule) {
      const juryOrgId = schedule.jury_organization_id && schedule.jury_organization_id._id ? schedule.jury_organization_id._id : null;

      // If student
      if (juryOrgId && schedule.students && schedule.students.student_id && schedule.students.student_id._id) {
        this.isLoading = true;
        this.subs.sink = this.juryService.updateSendRehearsalReminderFlagWhatsapp(juryOrgId, schedule.students.student_id._id).subscribe(
          (resp) => {
            this.isLoading = false;
            if (resp) {
              Swal.fire({
                type: 'success',
                title: this.translate.instant('Bravo !'),
                confirmButtonText: this.translate.instant('OK'),
              }).then((result) => {
                this.getAllScheduleJuryMember('inverseRehearsal');
              });
            }
          },
          (err) => {
            this.isLoading = false;
          },
        );
      }
      // If groups
      else if (juryOrgId && schedule.test_groups && schedule.test_groups.group_id && schedule.test_groups.group_id._id) {
        this.isLoading = true;
        this.subs.sink = this.juryService.updateSendRehearsalReminderFlagWhatsapp(juryOrgId, schedule.test_groups.group_id._id).subscribe(
          (resp) => {
            this.isLoading = false;
            if (resp) {
              Swal.fire({
                type: 'success',
                title: this.translate.instant('Bravo !'),
                confirmButtonText: this.translate.instant('OK'),
              }).then((result) => {
                this.getAllScheduleJuryMember('inverseRehearsal');
              });
            }
          },
          (err) => {
            this.isLoading = false;
          },
        );
      }
    }
  }

  checkRehearsalDone(schedule) {
    let isDone = false;

    if (schedule) {
      const juryOrgId = schedule.jury_organization_id && schedule.jury_organization_id._id ? schedule.jury_organization_id._id : null;

      // If student
      if (
        juryOrgId &&
        schedule.students &&
        schedule.students.student_id &&
        schedule.students.student_id.jury_organizations &&
        schedule.students.student_id.jury_organizations.length
      ) {
        const foundJury = schedule.students.student_id.jury_organizations.find((jury) => jury.jury_id && jury.jury_id._id === juryOrgId);
        if (foundJury && foundJury.already_open_rehearsal_room) {
          isDone = true;
        }
      }
      // If groups
      else if (
        juryOrgId &&
        schedule.test_groups &&
        schedule.test_groups.group_id &&
        schedule.test_groups.group_id.jury_organizations &&
        schedule.test_groups.group_id.jury_organizations.length
      ) {
        const foundJury = schedule.test_groups.group_id.jury_organizations.find((jury) => jury.jury_id && jury.jury_id._id === juryOrgId);
        if (foundJury && foundJury.already_open_rehearsal_room) {
          isDone = true;
        }
      }
    }

    return isDone;
  }

  checkAideJuryDone(schedule) {
    let isDone = false;

    if (schedule) {
      const juryOrgId = schedule.jury_organization_id && schedule.jury_organization_id._id ? schedule.jury_organization_id._id : null;

      // If student
      if (
        juryOrgId &&
        schedule.students &&
        schedule.students.student_id &&
        schedule.students.student_id.jury_organizations &&
        schedule.students.student_id.jury_organizations.length
      ) {
        const foundJury = schedule.students.student_id.jury_organizations.find((jury) => jury.jury_id && jury.jury_id._id === juryOrgId);
        if (foundJury && foundJury.already_contact_whatsapp) {
          isDone = true;
        }
      }
      // If groups
      else if (
        juryOrgId &&
        schedule.students &&
        schedule.students.test_groups &&
        schedule.students.test_groups.jury_organizations &&
        schedule.students.test_groups.jury_organizations.length
      ) {
        const foundJury = schedule.students.test_groups.jury_organizations.find((jury) => jury.jury_id && jury.jury_id._id === juryOrgId);
        if (foundJury && foundJury.already_contact_whatsapp) {
          isDone = true;
        }
      }
    }

    return isDone;
  }

  launchGoogleMeet(data) {
    let validation = true;
    if (this.isUserADMTC || this.isPresidentJury || this.isCertifierAdmin) {
      validation = !this.isMeetingEnded(data);
    } else {
      if (!this.isMeetingEnded(data)) {
        if (this.isMeetingStarted(data)) {
          validation = true;
        } else {
          validation = false;
          Swal.fire({
            type: 'error',
            title: this.translate.instant('JURY_S27.TITLE'),
            html: this.translate.instant('JURY_S27.TEXT'),
            footer: `<span style="margin-left: auto">JURY_S27</span>`,
            confirmButtonText: this.translate.instant('JURY_S27.BUTTON'),
          });
        }
      } else {
        validation = false;
        Swal.fire({
          type: 'error',
          title: this.translate.instant('JURY_S28.TITLE'),
          html: this.translate.instant('JURY_S28.TEXT'),
          footer: `<span style="margin-left: auto">JURY_S28</span>`,
          confirmButtonText: this.translate.instant('JURY_S28.BUTTON'),
        });
      }
    }

    if (validation) {
      if (data.students && data.students.google_meet_url) {
        window.open(data.students.google_meet_url);
      } else if (this.isUserADMTC || this.isPresidentJury || this.isCertifierAdmin) {
        this.googleMeetService.createAndUpdateMeet(data);
      } else {
        Swal.fire({
          type: 'error',
          title: this.translate.instant('SWAL_MEET_NOT_GENERATED'),
          footer: `<span style="margin-left: auto">SWAL_MEET_NOT_GENERATED</span>`,
          confirmButtonText: this.translate.instant('OK'),
        });
      }
    }
  }

  displayLaunchSession(schedule) {
    if (schedule && schedule.jury_organization_id && schedule.jury_organization_id.is_google_meet) {
      if (this.isUserADMTC || this.isPresidentJury || this.isCertifierAdmin) {
        return !this.isMeetingEnded(schedule);
      } else {
        return !this.isMeetingEnded(schedule);
      }
    } else {
      return !this.isMeetingEnded(schedule);
    }
  }

  checkGrandOralStatus(element) {
    if (element.mark_entry_task_status === 'validated') {
      return '#00FF00';
    } else if (element.mark_entry_task_status === 'done') {
      return '#AA00FF';
    } else if (element.mark_entry_task_status === 'in_progress') {
      return '#ff7600';
    } else if (element.mark_entry_task_status === 'todo') {
      return '#ff0000';
    }
  }

  downloadPreviousGrandOral(fileUrl: any) {

    const a = document.createElement('a');
    a.target = 'blank';
    a.href = `${environment.apiUrl}/fileuploads/${fileUrl}?download=true`.replace('/graphql', '');
    a.click();
    a.remove();
  }

  openDocAcadRecomendation(data) {
    if (data.academic_recommendation_document_id) {
      const url = `${environment.apiUrl}/fileuploads/${data.academic_recommendation_document_id.s3_file_name}?download=true`.replace(
        '/graphql',
        '',
      );
      window.open(url, '_blank');
    }
  }

  allowDisplayJuryKitCurrentUser() {
    this.subs.sink = this.juryService.allowDisplayJuryKitCurrentUser(this.juryOrgId).subscribe((resp) => {
      if(resp) {
        this.isAllowDisplayJuryKitCurrentUser = resp;
      }
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
