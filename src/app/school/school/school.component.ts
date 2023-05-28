import { Component, ViewChild, OnInit, OnDestroy, AfterViewInit, OnChanges } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AddSchoolDialogComponent } from '../add-school-dialog/add-school-dialog.component';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { SchoolService } from '../../service/schools/school.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { AddRncpDialogComponent } from '../add-rncp-dialog/add-rncp-dialog.component';
import { UntypedFormControl } from '@angular/forms';
import { SchoolComposeEmailDialogComponent } from '../school-compose-email-dialog/school-compose-email-dialog.component';
import { SelectionModel } from '@angular/cdk/collections';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { startWith, map, tap, debounceTime } from 'rxjs/operators';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { GlobalErrorService } from '../../service/global-error-service/global-error-service.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { UtilityService } from 'app/service/utility/utility.service';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { TranslateService } from '@ngx-translate/core';
import { UsersService } from 'app/service/users/users.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { ExportCsvService } from 'app/service/export-csv/export-csv.service';
import { PageTitleService } from 'app/core/page-title/page-title.service';
@Component({
  selector: 'ms-school',
  templateUrl: './school.component.html',
  styleUrls: ['./school.component.scss'],
})
export class SchoolComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  dataSource = new MatTableDataSource([]);
  titleData: any;
  noData: any;
  disabledExport = true;
  isLoading = false;
  userForExport: any[];
  allStudentForExport = [];
  exportName: 'Export';
  selectType: any;
  entityData: any;
  userSelected:any = [];
  userSelectedId: any[];
  isCheckedAll = false;
  displayedColumns: string[] = ['select', 'commercialName', 'legalName', 'city', 'rncpTitlePreparation', 'rncpTitleCertifier', 'class', 'status', 'action'];
  filterColumns: string[] = [
    'selectFilter',
    'commercialNameFilter',
    'legalNameFilter',
    'cityFilter',
    'rncpTitlePreparationFilter',
    'rncpTitleCertifierFilter',
    'classFilter',
    'statusFilter',
    'actionFilter',
  ];
  filteredValues = {
    school: '',
    city: '',
    preparation_center: '',
    certifier: '',
    school_type: '',
    class_name: '',
    school_ids: [],
    rncp_title_ids: [],
    class_names: [],
    legal_name_exact: ''
  };

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  private subs = new SubSink();
  sortValue = null;
  isReset = false;
  dataLoaded = false;
  schoolsCount = 0;
  isWaitingForResponse = false;

  isCertifierAdmin = false;
  isCertifierDirector = false;
  schoolDialogComponent: MatDialogRef<AddSchoolDialogComponent>;
  titleDialogComponent: MatDialogRef<AddRncpDialogComponent>;
  sendEmailDialogComponent: MatDialogRef<SchoolComposeEmailDialogComponent>;
  config: MatDialogConfig = {
    disableClose: true,
    width: '800px',
  };

  schoolFilter = new UntypedFormControl('');
  filteredSchool: Observable<any[]>;
  filterSchoolList = [];

  legalFilter = new UntypedFormControl('');
  filteredLegal: Observable<any[]>;
  filterLegalList = [];

  cityFilter = new UntypedFormControl('');
  filteredCity: Observable<any[]>;
  filterCityList: string[] = [];

  titlePreparationFilterList = [];
  rncpTitlePreparationFilter = new UntypedFormControl('');
  filteredTitlesPreparation: Observable<any[]>;

  titleCertifierFilterList = [];
  rncpTitleCertifierFilter = new UntypedFormControl('');
  classFilter = new UntypedFormControl('');
  filteredTitlesCertifier: Observable<any[]>;

  statusFilter = new UntypedFormControl('');

  selection = new SelectionModel<any>(true, []);
  currentUser;
  originalTitleList = [];
  originalSchoolList = [];
  originalLegalList = [];
  dataUnselect = [];
  titlePcFromCr: any;
  titleCrFromCr: any;
  currentLang: any;
  iconPc = '../../../assets/img/icon-pc.png';
  iconCp = '../../../assets/img/icon-cp.png';
  filteredClass: Observable<any[]>;
  originalClasslList: any;
  filteredUniqClass = [];
  superTitle = new UntypedFormControl(null);
  superClass = new UntypedFormControl(null);
  superStatus = new UntypedFormControl(null);
  superSchool = new UntypedFormControl(null);
  titleList = [];
  classList = [];
  statussList = [
    {
      _id: 'preparation_center',
      name: 'Preparation Center'
    },
    {
      _id: 'certifier',
      name: 'Certifier'
    }
  ];
  statusList = [];
  schoolList = [];
  delimeter: any;
  superFilterTitle = [];
  superFilterClass = [];
  superFilterStatus = '';
  superFilterSchool = [];

  constructor(
    private schoolService: SchoolService,
    private rncpTitleService: RNCPTitlesService,
    private router: Router,
    public dialog: MatDialog,
    private globalErrorService: GlobalErrorService,
    private permissions: NgxPermissionsService,
    private utilService: UtilityService,
    private mailboxService: MailboxService,
    public permissionService: PermissionService,
    public translate: TranslateService,
    private usersService: UsersService,
    private authService: AuthService,
    private exportCsvService: ExportCsvService,
    private pageTitleService: PageTitleService,
  ) {

    this.subs.sink = this.globalErrorService.globalErrorData$.subscribe((isError) => {

      if (isError) {


        this.isWaitingForResponse = false;

        this.globalErrorService.setGlobalError(false);

      }
    });
  }

  ngOnInit() {
    this.pageTitleService.setTitle('List of schools');
    this.getAllSuperFilterDropdown();
    this.getSchoolDropdownList();
    this.getClassDropdownList();
    this.initializeStatusFilter();
    this.getAllSchools();
    // this.getUrgentMail();
    this.getRncpTitleList();
    this.currentLang = this.translate.currentLang.toLowerCase();

    this.isCertifierAdmin = this.utilService.isUserCRDirAdmin();
    if (this.isCertifierAdmin) {
      // remove class and status column
      const classIndex = this.displayedColumns.indexOf('class');
      this.displayedColumns.splice(classIndex, 1);
      const statusIndex = this.displayedColumns.indexOf('status');
      this.displayedColumns.splice(statusIndex, 1);

      // also remove the filter columns
      const classFilterIndex = this.filterColumns.indexOf('classFilter');
      this.filterColumns.splice(classFilterIndex, 1);
      const statusFilterIndex = this.filterColumns.indexOf('statusFilter');
      this.filterColumns.splice(statusFilterIndex, 1);
    }
  }

  ngOnChanges() {
    if (this.currentLang === 'en') {
      this.iconPc = '../../../assets/img/icon-pc.png';
    } else {
      this.iconPc = '../../../assets/img/icon-cp.png';
    }

  }

  redirectToSchoolDetail() {
    this.currentUser = this.utilService.getCurrentUser();
    if (this.currentUser.entities && this.currentUser.entities && this.currentUser.entities[0] && this.currentUser.entities[0].school) {
      const isPcSchoolDir = this.permissions.getPermission('PC School Director') ? true : false;
      const isAcadDir = !!this.permissions.getPermission('Academic Director');
      const isAcadAdmin = !!this.permissions.getPermission('Academic Admin');
      // if PC school director, then redirect to school detail
      if (isPcSchoolDir || isAcadDir || isAcadAdmin) {
        // this.goToSchoolDetails(currentUser.entities[0].school._id);
        this.router.navigate(['school', this.currentUser.entities[0].school._id]);
      }
    }
  }

  ngAfterViewInit() {
    // this.dataSource.sort = this.sort;
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          this.redirectToSchoolDetail();
          if (!this.isReset) {
            this.getAllSchools();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
  }

  sortData(sort: Sort) {
    if (sort.active === 'short_name') {
      this.sortValue = sort.direction ? { short_name: sort.direction } : null;
    } else if (sort.active === 'city') {
      this.sortValue = sort.direction ? { city: sort.direction } : null;
    } else if (sort.active === 'preparation_center_ats') {
      this.sortValue = sort.direction ? { preparation_center_ats: sort.direction } : null;
    } else if (sort.active === 'certifier_ats') {
      this.sortValue = sort.direction ? { certifier_ats: sort.direction } : null;
    } else if (sort.active === 'long_name') {
      this.sortValue = sort.direction ? { long_name: sort.direction } : null;
    } else if (sort.active === 'class_name') {
      this.sortValue = sort.direction ? { class_name: sort.direction } : null;
    } else {
      this.sortValue = null;
    }

    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllSchools();
      }
    }
  }

  getAllSuperFilterDropdown() {
    // Title
    this.subs.sink = this.rncpTitleService.getTitleDropdownList().subscribe((resp) => {
      if (resp && resp.length) {
        const titleList = _.cloneDeep(resp);
        this.titleList = titleList.sort((a, b) => a.short_name.localeCompare(b.short_name));
      }
    });

    // Class
    // this.getClassListDropdown();

    // School
    // this.getSchoolListDropdown();
  }

  getClassListDropdown(titleId?) {
    const _id = titleId && titleId.length ? titleId : null;
    this.subs.sink = this.rncpTitleService.getClassDropdownList(_id).subscribe((resp) => {
      if (resp && resp.length) {
        const classList = _.cloneDeep(resp);
        const filteredClassList = _.uniqBy(classList, 'name');
        this.classList = filteredClassList.sort((a, b) => a.name.localeCompare(b.name));
      } else {
        this.classList = [];
      }
    })
  }

  getSchoolListDropdown(titleId?, className?, status?) {
    const title = titleId && titleId.length ? titleId : null;
    const class_names = className && className.length ? className : null;
    const school_status = status ? status : null;
    this.subs.sink = this.schoolService.getSchoolDropdownList(title, class_names, school_status).subscribe((resp) => {
      if (resp && resp.length) {
        const schoolList = _.cloneDeep(resp);
        this.schoolList = schoolList.sort((a, b) => a.short_name.localeCompare(b.short_name));
      } else {
        this.schoolList = [];
      }
    })
  }

  attachTooltip(schools: any[]): any[] {
    if(!schools || schools.length === 0) {
      return;
    }
    return schools.map(school => {
      return {
        ...school,
        unique_certifier_ats: this.getUniqueCertifier(school.certifier_ats).map(certifier => certifier.short_name),
        unique_preparation_center: this.getUniquePrepCenter(school.preparation_center_ats).map(prepCenter => prepCenter.rncp_title_id.short_name),
        unique_class: this.getUniqueClass(school)
      }
    })
  }

  getAllSchools() {
    const currentUser = this.utilService.getCurrentUser();

    this.isWaitingForResponse = true;
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };

    // because we cant send null id for filter, so we manupulate the filter to be string for graphql
    let filter = ``;
    filter += this.filteredValues.school && !this.filteredValues.school_ids.length ? `school : "${this.filteredValues.school}" ` : '';
    filter += !this.filteredValues.school && this.filteredValues.school_ids.length ? `school_ids : [${this.filteredValues.school_ids}] ` : '';
    filter += this.filteredValues.city ? `city: "${this.filteredValues.city}"` : '';
    filter += this.filteredValues.preparation_center && !this.filteredValues.rncp_title_ids.length ? `preparation_center: "${this.filteredValues.preparation_center}" ` : '';
    filter += this.filteredValues.certifier && !this.filteredValues.rncp_title_ids.length ? `certifier: "${this.filteredValues.certifier}" ` : '';
    filter += !this.filteredValues.certifier && !this.filteredValues.preparation_center && this.filteredValues.rncp_title_ids.length ? `rncp_title_ids: [${this.filteredValues.rncp_title_ids.toString()}] ` : '';
    filter += this.filteredValues.school_type ? `school_type: ${this.filteredValues.school_type} ` : '';
    filter += this.filteredValues.class_name && !this.filteredValues.class_names.length ? `class_name: "${this.filteredValues.class_name}" ` : '';
    filter += !this.filteredValues.class_name && this.filteredValues.class_names.length ? `class_names_exact: [${this.filteredValues.class_names}] ` : '';
    filter += this.filteredValues.legal_name_exact ? `legal_name_exact: "${this.filteredValues.legal_name_exact}" ` : '';
    // Check for dropdown school, title cert and title PC. Should reset dropdown after reset as well
    if (!this.filteredValues.school) {
      if (!!this.permissions.getPermission('CR School Director')) {
        this.titleCertifierFilterList = this.titleCrFromCr;
        this.titlePreparationFilterList = this.titlePcFromCr;
      } else {
        this.titleCertifierFilterList = this.originalTitleList;
        this.titlePreparationFilterList = this.originalTitleList;
      }
      this.rncpTitleCertifierFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });
      this.rncpTitlePreparationFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });
    }
    if (!this.filteredValues.preparation_center && !this.filteredValues.certifier) {
      this.filterSchoolList = this.originalSchoolList;
      this.schoolFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });
      this.filterLegalList = this.originalLegalList;
      this.legalFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });
    }

    if (!!this.permissions.getPermission('CR School Director') || !!this.permissions.getPermission('Certifier Admin')) {
      const schoolids = currentUser.entities ? currentUser.entities[0].school._id : '';
      const certifier_school = schoolids;
      let school_ids = [];
      if (!!this.permissions.getPermission('Certifier Admin')) {
        school_ids = this.utilService.getUserAllSchoolCerAdmin();
      } else if (!!this.permissions.getPermission('CR School Director')) {
        school_ids = this.utilService.getAllSchoolFromCRUser();
      }
      this.subs.sink = this.schoolService
        .getAllSchoolsByCR(pagination, this.sortValue, filter, certifier_school)
        .subscribe((schoolList: any) => {
          if (schoolList && schoolList.length) {
            schoolList = this.attachTooltip(_.cloneDeep(schoolList));
            this.dataSource.data = schoolList;
            this.getRncpTitleList();
            this.schoolsCount = schoolList && schoolList.length ? schoolList[0].count_document : 0;
          } else {
            this.dataSource.data = [];
            this.schoolsCount = 0;
          }
          this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
          this.isReset = false;
          this.isWaitingForResponse = false;
        });
    } else if (!!this.permissions.getPermission('Chief Group Academic')) {
      const entity = currentUser.entities[0];
      let schoolList = [];

      if (entity && entity.group_of_school) {
        if (entity.group_of_school.headquarter && entity.group_of_school.headquarter._id) {
          schoolList.push(entity.group_of_school.headquarter._id);
        }
        if (entity.group_of_school.school_members && entity.group_of_school.school_members.length) {
          entity.group_of_school.school_members.forEach((school) => {
            schoolList.push(school._id);
          });
        }
      }

      if (schoolList && schoolList.length) {
        this.subs.sink = this.schoolService
          .getAllSchoolsChiefGroupOfSchool(pagination, this.sortValue, filter, schoolList)
          .subscribe((schoolList: any[]) => {
            if (schoolList && schoolList.length) {
              schoolList = this.attachTooltip(_.cloneDeep(schoolList));
              this.dataSource.data = schoolList;
              this.schoolsCount = schoolList && schoolList.length ? schoolList[0].count_document : 0;
            } else {
              this.dataSource.data = [];
              this.schoolsCount = 0;
            }
            this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
            this.isReset = false;
            this.isWaitingForResponse = false;
          });
      } else {
        this.dataSource.data = [];
        this.schoolsCount = 0;
        this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
        this.isReset = false;
        this.isWaitingForResponse = false;
      }
    } else if (!!this.permissions.getPermission('Corrector of Problematic')) {
      const correctorProblematicId = '5a2e1ecd53b95d22c82f9551';
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((resp) => {
        const dataUSer = resp.entities.filter((ent) => ent.type.name === userType);
        const assignedTitleIds = this.utilService.getAcademicAllAssignedTitle(dataUSer);
        this.subs.sink = this.schoolService
          .getAllSchoolsCorretorProblematic(pagination, this.sortValue, filter, correctorProblematicId, assignedTitleIds)
          .subscribe((schoolList: any[]) => {
            if (schoolList && schoolList.length) {
              schoolList = this.attachTooltip(_.cloneDeep(schoolList));
              this.dataSource.data = schoolList;
              this.schoolsCount = schoolList && schoolList.length ? schoolList[0].count_document : 0;
            } else {
              this.dataSource.data = [];
              this.schoolsCount = 0;
            }
            this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
            this.isReset = false;
            this.isWaitingForResponse = false;
          });
      });
    } else {
      this.subs.sink = this.schoolService.getAllSchools(pagination, this.sortValue, filter).subscribe((schoolList: any[]) => {
        if (schoolList && schoolList.length) {
          schoolList = this.attachTooltip(_.cloneDeep(schoolList));
          this.dataSource.data = schoolList;
          this.schoolsCount = schoolList && schoolList.length ? schoolList[0].count_document : 0;
        } else {
          this.dataSource.data = [];
          this.schoolsCount = 0;
        }
        this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
        this.isReset = false;
        this.isWaitingForResponse = false;
      });
    }
  }

  getRncpTitleList() {
    const currentUser = this.utilService.getCurrentUser();
    this.subs.sink = this.rncpTitleService.getRncpTitleListData().subscribe((titles) => {
      // filtering out data with empty name
      let tempTitles = _.cloneDeep(titles);
      if (tempTitles && tempTitles.length) {

        tempTitles = tempTitles.filter((title) => title && title.short_name && this.utilService.disregardSpace(title.short_name) !== '');
      }

      if (!!this.permissions.getPermission('CR School Director') || !!this.permissions.getPermission('Certifier Admin')) {
        const schoolids = currentUser.entities ? currentUser.entities[0].school._id : '';
        const certifier_school = schoolids;
        this.subs.sink = this.schoolService.getAllSchoolsByCRToFilter(certifier_school).subscribe((resp: any) => {
          const titleCrArray = [];
          const titlePcArray = [];

          resp.forEach((elementPc) => {
            const tempTitlePcArray = elementPc.preparation_center_ats.map((title) => {
              return { _id: title.rncp_title_id._id, short_name: title.rncp_title_id.short_name };
            });
            titlePcArray.push(tempTitlePcArray);

            const tempTitleCrArray = elementPc.certifier_ats.map((title) => {
              return { _id: title._id, short_name: title.short_name };
            });
            titleCrArray.push(tempTitleCrArray);
          });
          const titlePc = titlePcArray[0];
          const titleCr = titleCrArray[0];

          this.dataSource.data.forEach(data => {
            const filteredUniqData = this.getUniquePrepCenter(data.preparation_center_ats).map(pc => pc.rncp_title_id);
            if(filteredUniqData.length) {
              titlePc.push(...filteredUniqData)
            }
          });
          this.titlePcFromCr = _.uniqBy(titlePc, '_id');
          this.titleCrFromCr = _.uniqBy(titleCr, '_id');

          this.titlePreparationFilterList = this.titlePcFromCr;
          this.titleCertifierFilterList = this.titleCrFromCr;

          this.filteredTitlesPreparation = this.rncpTitlePreparationFilter.valueChanges.pipe(
            startWith(''),
            map((searchTxt) =>
              this.titlePreparationFilterList
                .filter((option) => option.short_name.toLowerCase().includes(searchTxt.toLowerCase()))
                .sort((firstTitle, secondTitle) => {
                  if (
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstTitle.short_name)).toLowerCase() <
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondTitle.short_name)).toLowerCase()
                  ) {
                    return -1;
                  } else if (
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstTitle.short_name)).toLowerCase() >
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondTitle.short_name)).toLowerCase()
                  ) {
                    return 1;
                  } else {
                    return 0;
                  }
                }),
            ),
          );
          this.filteredTitlesCertifier = this.rncpTitleCertifierFilter.valueChanges.pipe(
            startWith(''),
            map((searchTxt) =>
              this.titleCertifierFilterList
                .filter((option) => option.short_name.toLowerCase().includes(searchTxt.toLowerCase()))
                .sort((firstTitle, secondTitle) => {
                  if (
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstTitle.short_name)).toLowerCase() <
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondTitle.short_name)).toLowerCase()
                  ) {
                    return -1;
                  } else if (
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstTitle.short_name)).toLowerCase() >
                    this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondTitle.short_name)).toLowerCase()
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
        this.titlePreparationFilterList = _.cloneDeep(tempTitles);
        this.titleCertifierFilterList = _.cloneDeep(tempTitles);
        this.originalTitleList = _.cloneDeep(tempTitles);

        this.filteredTitlesPreparation = this.rncpTitlePreparationFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.titlePreparationFilterList
              .filter((option) => (option ? option.short_name.toLowerCase().includes(searchTxt.toLowerCase()) : ''))
              .sort((firstTitle, secondTitle) => {
                if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstTitle.short_name)).toLowerCase() <
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondTitle.short_name)).toLowerCase()
                ) {
                  return -1;
                } else if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstTitle.short_name)).toLowerCase() >
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondTitle.short_name)).toLowerCase()
                ) {
                  return 1;
                } else {
                  return 0;
                }
              }),
          ),
        );
        this.filteredTitlesCertifier = this.rncpTitleCertifierFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.titleCertifierFilterList
              .filter((option) => (option ? option.short_name.toLowerCase().includes(searchTxt.toLowerCase()) : ''))
              .sort((firstTitle, secondTitle) => {
                if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstTitle.short_name)).toLowerCase() <
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondTitle.short_name)).toLowerCase()
                ) {
                  return -1;
                } else if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstTitle.short_name)).toLowerCase() >
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondTitle.short_name)).toLowerCase()
                ) {
                  return 1;
                } else {
                  return 0;
                }
              }),
          ),
        );
      }

      // this.triggerFilteredTitleDropdown();
    });
  }

  getSchoolDropdownList() {
    const currentUser = this.utilService.getCurrentUser();
    if (!!this.permissions.getPermission('CR School Director') || !!this.permissions.getPermission('Certifier Admin')) {
      const schoolids = currentUser.entities ? currentUser.entities[0].school._id : '';
      const certifier_school = schoolids;
      this.subs.sink = this.schoolService.getAllSchoolsByCRToFilter(certifier_school).subscribe((resp: any) => {
        let tempSchools = _.cloneDeep(resp);
        let legalSchools = _.cloneDeep(resp)
        if (tempSchools && tempSchools.length) {
          tempSchools = tempSchools.filter(
            (school) => school && school.short_name && this.utilService.disregardSpace(school.short_name) !== '',
          );
        }
        if (legalSchools && legalSchools.length) {
          legalSchools = legalSchools.filter(
            (school) => school && school.long_name && this.utilService.disregardSpace(school.long_name) !== '',
          );
        }

        this.filterSchoolList = _.cloneDeep(tempSchools);
        this.originalSchoolList = _.cloneDeep(tempSchools);
        this.filteredSchool = this.schoolFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.filterSchoolList
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

        this.filterLegalList = _.cloneDeep(legalSchools);
        this.originalLegalList = _.cloneDeep(legalSchools);
        this.filterLegalList = _.uniqBy(this.filterLegalList, 'long_name');
        this.originalLegalList = _.uniqBy(this.filterLegalList, 'long_name');
        this.filteredLegal = this.legalFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.filterLegalList
              .filter((option) => option.long_name.toLowerCase().includes(searchTxt.toLowerCase()))
              .sort((firstData, secondData) => {
                if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.long_name)).toLowerCase() <
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.long_name)).toLowerCase()
                ) {
                  return -1;
                } else if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.long_name)).toLowerCase() >
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.long_name)).toLowerCase()
                ) {
                  return 1;
                } else {
                  return 0;
                }
              }),
          ),
        );

        // this.subs.sink = this.schoolFilter.valueChanges.pipe(debounceTime(100)).subscribe(value => {
        //   if (value === '' && this.filteredValues.school) {
        //     this.setSchoolFilter(null);
        //   }
        // })

        for (const school of tempSchools) {
          if (school.school_address && school.school_address.length) {
            for (const addr of school.school_address) {
              if (addr.is_main_address) {
                this.filterCityList.push(addr.city);
              }
            }
          }
        }

        this.filterCityList = _.uniq(this.filterCityList);
        this.filterCityList = this.filterCityList.filter((city) => city && this.utilService.disregardSpace(city) !== '');
        this.filteredCity = this.cityFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.filterCityList
              .filter((option) => option.toLowerCase().includes(searchTxt.toLowerCase()))
              .sort((firstData, secondData) => {
                if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData)).toLowerCase() <
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData)).toLowerCase()
                ) {
                  return -1;
                } else if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData)).toLowerCase() >
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData)).toLowerCase()
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
      this.subs.sink = this.schoolService.getschoolAndCity().subscribe((schoolList) => {
        let tempSchools = _.cloneDeep(schoolList);
        let tempLegalSchools = _.cloneDeep(schoolList);
        if (tempSchools && tempSchools.length) {
          tempSchools = tempSchools.filter(
            (school) => school && school.short_name && this.utilService.disregardSpace(school.short_name) !== '',
          );
        }
        if (tempLegalSchools && tempLegalSchools.length) {
          tempLegalSchools = tempLegalSchools.filter(
            (school) => school && school.long_name && this.utilService.disregardSpace(school.long_name) !== '',
          );
        }

        this.filterSchoolList = _.cloneDeep(tempSchools);
        this.originalSchoolList = _.cloneDeep(tempSchools);
        this.filteredSchool = this.schoolFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.filterSchoolList
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

        this.filterLegalList = _.cloneDeep(tempLegalSchools);
        this.originalLegalList = _.cloneDeep(tempLegalSchools);
        this.filterLegalList = _.uniqBy(this.filterLegalList, 'long_name');
        this.originalLegalList = _.uniqBy(this.filterLegalList, 'long_name');
        this.filteredLegal = this.legalFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.filterLegalList
              .filter((option) => option.long_name.toLowerCase().includes(searchTxt.toLowerCase()))
              .sort((firstData, secondData) => {
                if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.long_name)).toLowerCase() <
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.long_name)).toLowerCase()
                ) {
                  return -1;
                } else if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.long_name)).toLowerCase() >
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.long_name)).toLowerCase()
                ) {
                  return 1;
                } else {
                  return 0;
                }
              }),
          ),
        );

        // this.subs.sink = this.schoolFilter.valueChanges.pipe(debounceTime(100)).subscribe(value => {
        //   if (value === '' && this.filteredValues.school) {
        //     this.setSchoolFilter(null);
        //   }
        // })

        for (const school of tempSchools) {
          if (school.school_address && school.school_address.length) {
            for (const addr of school.school_address) {
              if (addr.is_main_address) {
                this.filterCityList.push(addr.city);
              }
            }
          }
        }

        this.filterCityList = _.uniq(this.filterCityList);
        this.filterCityList = this.filterCityList.filter((city) => city && this.utilService.disregardSpace(city) !== '');
        this.filteredCity = this.cityFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.filterCityList
              .filter((option) => option.toLowerCase().includes(searchTxt.toLowerCase()))
              .sort((firstData, secondData) => {
                if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData)).toLowerCase() <
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData)).toLowerCase()
                ) {
                  return -1;
                } else if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData)).toLowerCase() >
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData)).toLowerCase()
                ) {
                  return 1;
                } else {
                  return 0;
                }
              }),
          ),
        );
      });
    }
  }

  getSchoolCommercialCascadeDropdownList(legal_name) {
    let legalName;
    if(legal_name) {
      legalName = legal_name;
    } else {
      legalName = '';
    }
    const currentUser = this.utilService.getCurrentUser();
    if (!!this.permissions.getPermission('CR School Director') || !!this.permissions.getPermission('Certifier Admin')) {
      const schoolids = currentUser.entities ? currentUser.entities[0].school._id : '';
      const certifier_school = schoolids;
      this.subs.sink = this.schoolService.getAllSchoolsByCRToFilterBasedLegalName(certifier_school, legalName).subscribe((resp: any) => {
        let tempSchools = _.cloneDeep(resp);
        if (tempSchools && tempSchools.length) {
          tempSchools = tempSchools.filter(
            (school) => school && school.short_name && this.utilService.disregardSpace(school.short_name) !== '',
          );
        }

        this.filterSchoolList = _.cloneDeep(tempSchools);
        this.originalSchoolList = _.cloneDeep(tempSchools);
        this.filteredSchool = this.schoolFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.filterSchoolList
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

        for (const school of tempSchools) {
          if (school.school_address && school.school_address.length) {
            for (const addr of school.school_address) {
              if (addr.is_main_address) {
                this.filterCityList.push(addr.city);
              }
            }
          }
        }

        this.filterCityList = _.uniq(this.filterCityList);
        this.filterCityList = this.filterCityList.filter((city) => city && this.utilService.disregardSpace(city) !== '');
        this.filteredCity = this.cityFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.filterCityList
              .filter((option) => option.toLowerCase().includes(searchTxt.toLowerCase()))
              .sort((firstData, secondData) => {
                if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData)).toLowerCase() <
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData)).toLowerCase()
                ) {
                  return -1;
                } else if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData)).toLowerCase() >
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData)).toLowerCase()
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
      this.subs.sink = this.schoolService.getschoolAndCityBasedLegalName(legalName).subscribe((schoolList) => {
        let tempSchools = _.cloneDeep(schoolList);

        if (tempSchools && tempSchools.length) {
          tempSchools = tempSchools.filter(
            (school) => school && school.short_name && this.utilService.disregardSpace(school.short_name) !== '',
          );
        }

        this.filterSchoolList = _.cloneDeep(tempSchools);
        this.originalSchoolList = _.cloneDeep(tempSchools);
        this.filteredSchool = this.schoolFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.filterSchoolList
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

        for (const school of tempSchools) {
          if (school.school_address && school.school_address.length) {
            for (const addr of school.school_address) {
              if (addr.is_main_address) {
                this.filterCityList.push(addr.city);
              }
            }
          }
        }

        this.filterCityList = _.uniq(this.filterCityList);
        this.filterCityList = this.filterCityList.filter((city) => city && this.utilService.disregardSpace(city) !== '');
        this.filteredCity = this.cityFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.filterCityList
              .filter((option) => option.toLowerCase().includes(searchTxt.toLowerCase()))
              .sort((firstData, secondData) => {
                if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData)).toLowerCase() <
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData)).toLowerCase()
                ) {
                  return -1;
                } else if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData)).toLowerCase() >
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData)).toLowerCase()
                ) {
                  return 1;
                } else {
                  return 0;
                }
              }),
          ),
        );
      });
    }
  }
  getSchoolLegalCascadeDropdownList(schoolId) {
    let idSchool;
    if(schoolId) {
      idSchool = schoolId;
    } else {
      idSchool = '';
    }
    const currentUser = this.utilService.getCurrentUser();
    if (!!this.permissions.getPermission('CR School Director') || !!this.permissions.getPermission('Certifier Admin')) {
      const schoolids = currentUser.entities ? currentUser.entities[0].school._id : '';
      const certifier_school = schoolids;
      this.subs.sink = this.schoolService.getAllSchoolsByCRToFilterBasedId(certifier_school, idSchool).subscribe((resp: any) => {
        let legalSchools = _.cloneDeep(resp)

        if (legalSchools && legalSchools.length) {
          legalSchools = legalSchools.filter(
            (school) => school && school.long_name && this.utilService.disregardSpace(school.long_name) !== '',
          );
        }

        this.filterLegalList = _.cloneDeep(legalSchools);
        this.originalLegalList = _.cloneDeep(legalSchools);
        this.filterLegalList = _.uniqBy(this.filterLegalList, 'long_name');
        this.originalLegalList = _.uniqBy(this.filterLegalList, 'long_name');
        this.filteredLegal = this.legalFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.filterLegalList
              .filter((option) => option.long_name.toLowerCase().includes(searchTxt.toLowerCase()))
              .sort((firstData, secondData) => {
                if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.long_name)).toLowerCase() <
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.long_name)).toLowerCase()
                ) {
                  return -1;
                } else if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.long_name)).toLowerCase() >
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.long_name)).toLowerCase()
                ) {
                  return 1;
                } else {
                  return 0;
                }
              }),
          ),
        );

        for (const school of legalSchools) {
          if (school.school_address && school.school_address.length) {
            for (const addr of school.school_address) {
              if (addr.is_main_address) {
                this.filterCityList.push(addr.city);
              }
            }
          }
        }

        this.filterCityList = _.uniq(this.filterCityList);
        this.filterCityList = this.filterCityList.filter((city) => city && this.utilService.disregardSpace(city) !== '');
        this.filteredCity = this.cityFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.filterCityList
              .filter((option) => option.toLowerCase().includes(searchTxt.toLowerCase()))
              .sort((firstData, secondData) => {
                if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData)).toLowerCase() <
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData)).toLowerCase()
                ) {
                  return -1;
                } else if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData)).toLowerCase() >
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData)).toLowerCase()
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
      this.subs.sink = this.schoolService.getschoolAndCityBasedId(idSchool).subscribe((schoolList) => {
        let tempLegalSchools = _.cloneDeep(schoolList);

        if (tempLegalSchools && tempLegalSchools.length) {
          tempLegalSchools = tempLegalSchools.filter(
            (school) => school && school.long_name && this.utilService.disregardSpace(school.long_name) !== '',
          );
        }

        this.filterLegalList = _.cloneDeep(tempLegalSchools);
        this.originalLegalList = _.cloneDeep(tempLegalSchools);
        this.filterLegalList = _.uniqBy(this.filterLegalList, 'long_name');
        this.originalLegalList = _.uniqBy(this.filterLegalList, 'long_name');
        this.filteredLegal = this.legalFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.filterLegalList
              .filter((option) => option.long_name.toLowerCase().includes(searchTxt.toLowerCase()))
              .sort((firstData, secondData) => {
                if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.long_name)).toLowerCase() <
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.long_name)).toLowerCase()
                ) {
                  return -1;
                } else if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData.long_name)).toLowerCase() >
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData.long_name)).toLowerCase()
                ) {
                  return 1;
                } else {
                  return 0;
                }
              }),
          ),
        );

        for (const school of tempLegalSchools) {
          if (school.school_address && school.school_address.length) {
            for (const addr of school.school_address) {
              if (addr.is_main_address) {
                this.filterCityList.push(addr.city);
              }
            }
          }
        }
        this.filterCityList = _.uniq(this.filterCityList);
        this.filterCityList = this.filterCityList.filter((city) => city && this.utilService.disregardSpace(city) !== '');
        this.filteredCity = this.cityFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.filterCityList
              .filter((option) => option.toLowerCase().includes(searchTxt.toLowerCase()))
              .sort((firstData, secondData) => {
                if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData)).toLowerCase() <
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData)).toLowerCase()
                ) {
                  return -1;
                } else if (
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(firstData)).toLowerCase() >
                  this.utilService.simpleDiacriticSensitiveRegex(this.utilService.disregardSpace(secondData)).toLowerCase()
                ) {
                  return 1;
                } else {
                  return 0;
                }
              }),
          ),
        );
      });
    }
  }

  getClassDropdownList(rncp_id?: string) {
    this.subs.sink = this.schoolService.getClassDropdownList(rncp_id).subscribe((resp) => {
      if (resp) {
        const originalClasslList = _.cloneDeep(resp);
        const uniqClass = _.uniqBy(originalClasslList, 'name')
        this.filteredUniqClass = _.cloneDeep(uniqClass);
        // this.filteredClass = uniqClass;

        this.filteredClass = this.classFilter.valueChanges.pipe(
          startWith(''),
          map((searchTxt) =>
            this.filteredUniqClass
            .filter((classObj) => (classObj && classObj.name ? classObj.name.toLowerCase().includes(searchTxt.toLowerCase()) : false))
            .sort((a: any, b: any) => a.name.localeCompare(b.name)),
          ),
        );
      }
    })
  }

  initializeStatusFilter() {
    this.subs.sink = this.statusFilter.valueChanges.subscribe((statusSearch) => {
      this.superStatus.setValue(null); // Reset super filter to avoid conflict
      this.filteredValues.school_type = statusSearch === 'All' ? '' : statusSearch;
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getAllSchools();
      }
    });

    // this.subs.sink = this.classFilter.valueChanges.pipe(debounceTime(300)).subscribe((statusSearch) => {
    //   this.filteredValues.class_name = statusSearch === 'All' ? '' : statusSearch;
    //   this.paginator.pageIndex = 0;
    //   if (!this.isReset) {
    //     this.getAllSchools();
    //   }
    // });
  }

  setCityFilter(citySearch: string) {
    this.filteredValues.city = citySearch;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getAllSchools();
    }
  }

  setSchoolFilter(schoolId: string, schoolData?) {
    this.filteredValues.school_ids = [];
    this.filteredValues.class_names = [];
    this.filteredValues.rncp_title_ids = [];
    // check if previously selected then select again, if yes then reset dropdown before filtering again
    if (this.filteredValues.school && this.filteredValues.school !== schoolId) {
      if (!!this.permissions.getPermission('CR School Director')) {
        this.titleCertifierFilterList = this.titleCrFromCr;
        this.titlePreparationFilterList = this.titlePcFromCr;
      } else {
        this.titleCertifierFilterList = this.originalTitleList;
        this.titlePreparationFilterList = this.originalTitleList;
      }
    }

    this.superClass.setValue(null);
    this.superSchool.setValue(null);
    this.superTitle.setValue(null);
    this.superStatus.setValue(null);

    this.filteredValues.school = schoolId;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getAllSchools();
    }

    this.filterTitleBasedOnSchool(schoolId, schoolData);
    this.getSchoolLegalCascadeDropdownList(schoolData?._id);
  }

  setLegalFilter(legalName: string, schoolData?) {
    this.filteredValues.school_ids = [];
    this.filteredValues.class_names = [];
    this.filteredValues.rncp_title_ids = [];
    // check if previously selected then select again, if yes then reset dropdown before filtering again
    if (this.filteredValues.legal_name_exact && this.filteredValues.legal_name_exact !== legalName) {
      if (!!this.permissions.getPermission('CR School Director')) {
        this.titleCertifierFilterList = this.titleCrFromCr;
        this.titlePreparationFilterList = this.titlePcFromCr;
      } else {
        this.titleCertifierFilterList = this.originalTitleList;
        this.titlePreparationFilterList = this.originalTitleList;
      }
    }

    this.superClass.setValue(null);
    this.superSchool.setValue(null);
    this.superTitle.setValue(null);
    this.superStatus.setValue(null);

    this.filteredValues.legal_name_exact = legalName;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getAllSchools();
    }

    const longName = legalName ? legalName : '';

    this.filterTitleBasedOnSchool(schoolData?._id, schoolData);
    this.getSchoolCommercialCascadeDropdownList(longName);
  }

  setPrepCentFilter(titleId: string) {
    this.filteredValues.school_ids = [];
    this.filteredValues.class_names = [];
    this.filteredValues.rncp_title_ids = [];
    // check if previously selected then select again, if yes then reset dropdown before filtering again
    if (this.filteredValues.preparation_center && this.filteredValues.preparation_center !== titleId) {
      this.filterSchoolList = this.originalSchoolList;
      this.filterLegalList = this.originalLegalList;
      this.classFilter.setValue('');
    }

    this.superClass.setValue(null);
    this.superSchool.setValue(null);
    this.superTitle.setValue(null);
    this.superStatus.setValue(null);

    this.filteredValues.preparation_center = titleId;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getAllSchools();
    }

    this.classFilter.setValue('');
    this.filteredValues.class_name = '';
    this.filterSchoolDropdownBasedOnTitle(titleId, 'pc');
    this.filterLegalDropdownBasedOnTitle(titleId, 'pc');
    this.getClassDropdownList(titleId);
  }

  setCertifierFilter(titleId: string) {
    this.filteredValues.school_ids = [];
    this.filteredValues.class_names = [];
    this.filteredValues.rncp_title_ids = [];
    // check if previously selected then select again, if yes then reset dropdown before filtering again
    if (this.filteredValues.certifier && this.filteredValues.certifier !== titleId) {
      this.filterSchoolList = this.originalSchoolList;
      this.filterLegalList = this.originalLegalList;
    }
    this.superClass.setValue(null);
    this.superSchool.setValue(null);
    this.superTitle.setValue(null);
    this.superStatus.setValue(null);

    this.filteredValues.certifier = titleId;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getAllSchools();
    }
    this.classFilter.setValue('');
    this.filteredValues.class_name = '';
    this.filterSchoolDropdownBasedOnTitle(titleId, 'certifier');
    this.filterLegalDropdownBasedOnTitle(titleId, 'certifier');
    this.getClassDropdownList(titleId);
  }

  setClassFilter(class_name: string){
    if (this.filteredValues.class_name && this.filteredValues.class_name !== class_name) {
      this.filterSchoolList = this.originalSchoolList;
      this.filterLegalList = this.originalLegalList;
    }
    this.filteredValues.class_name = class_name;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getAllSchools();
    }

  }

  filterTitleBasedOnSchool(schoolId, schoolData) {
    if (schoolId && schoolData) {
      // Filter certifier list dropdown
      if (schoolData.certifier_ats && schoolData.certifier_ats.length) {
        const tempCertFilter = this.titleCertifierFilterList.filter((titleCert) =>
          schoolData.certifier_ats.some((titleSchool) => titleSchool._id === titleCert._id),
        );

        if (tempCertFilter && tempCertFilter.length) {
          this.titleCertifierFilterList = tempCertFilter;
        } else {
          this.titleCertifierFilterList = [];
        }
      } else {
        this.titleCertifierFilterList = [];
      }

      // Filter PC list dropdown
      if (schoolData.preparation_center_ats && schoolData.preparation_center_ats.length) {
        const tempPCFilter = this.titlePreparationFilterList.filter((titleCert) =>
          schoolData.preparation_center_ats.some(
            (titleSchool) => titleSchool.rncp_title_id && titleSchool.rncp_title_id._id === titleCert._id,
          ),
        );

        if (tempPCFilter && tempPCFilter.length) {
          this.titlePreparationFilterList = tempPCFilter;
        } else {
          this.titlePreparationFilterList = [];
        }
      } else {
        this.titlePreparationFilterList = [];
      }
    } else {
      // if select ALL
      if (!!this.permissions.getPermission('CR School Director')) {
        this.titleCertifierFilterList = this.titleCrFromCr;
        this.titlePreparationFilterList = this.titlePcFromCr;
      } else {
        this.titleCertifierFilterList = this.originalTitleList;
        this.titlePreparationFilterList = this.originalTitleList;
      }
    }

    this.rncpTitleCertifierFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });
    this.rncpTitlePreparationFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });
  }

  filterSchoolDropdownBasedOnTitle(titleId, type) {
    let tempSchoolFilterPC = [];
    let tempSchoolFilterCert = [];
    // Change dropdown of school to relate with the PC title
    if (titleId && type === 'pc') {
      tempSchoolFilterPC = this.filterSchoolList.filter(
        (school) =>
          school &&
          school.preparation_center_ats &&
          school.preparation_center_ats.length &&
          school.preparation_center_ats.some((title) => title && title.rncp_title_id && title.rncp_title_id._id === titleId),
      );
    }

    // Change dropdown of school to relate with the certifier title
    if (titleId && type === 'certifier') {
      tempSchoolFilterCert = this.filterSchoolList.filter(
        (school) =>
          school &&
          school.certifier_ats &&
          school.certifier_ats.length &&
          school.certifier_ats.some((title) => title && title._id === titleId),
      );
    }

    if ((titleId && tempSchoolFilterPC && tempSchoolFilterPC.length) || (tempSchoolFilterCert && tempSchoolFilterCert.length)) {
      const result = tempSchoolFilterPC.concat(tempSchoolFilterCert);

      if (result && result.length) {
        this.filterSchoolList = result;
      } else {
        this.filterSchoolList = [];
      }
    } else {
      this.filterSchoolList = this.originalSchoolList;
    }

    this.schoolFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });

    // this.triggerFilteredSchoolDropdown();
  }

  filterLegalDropdownBasedOnTitle(titleId, type) {
    let tempSchoolFilterPC = [];
    let tempSchoolFilterCert = [];
    // Change dropdown of school to relate with the PC title
    if (titleId && type === 'pc') {
      tempSchoolFilterPC = this.originalSchoolList.filter(
        (school) =>
          school &&
          school.preparation_center_ats &&
          school.preparation_center_ats.length &&
          school.preparation_center_ats.some((title) => title && title.rncp_title_id && title.rncp_title_id._id === titleId),
      );
    }

    // Change dropdown of school to relate with the certifier title
    if (titleId && type === 'certifier') {
      tempSchoolFilterCert = this.originalSchoolList.filter(
        (school) =>
          school &&
          school.certifier_ats &&
          school.certifier_ats.length &&
          school.certifier_ats.some((title) => title && title._id === titleId),
      );
    }

    if ((titleId && tempSchoolFilterPC && tempSchoolFilterPC.length) || (tempSchoolFilterCert && tempSchoolFilterCert.length)) {
      const result = tempSchoolFilterPC.concat(tempSchoolFilterCert);

      if (result && result.length) {
        this.filterLegalList = result;
      } else {
        this.filterLegalList = [];
      }
    } else {
      this.filterLegalList = this.originalLegalList;
    }

    this.legalFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });

    // this.triggerFilteredSchoolDropdown();
  }

  setSuperFilterTitle() {
    this.superFilterClass = [];
    this.superFilterStatus = '';
    this.superFilterSchool = [];
    this.superClass.setValue(null);
    this.superStatus.setValue(null);
    this.superSchool.setValue(null);
    const selectedTitle = this.superTitle.value;
    const selectedStatus = this.superStatus.value;
    const selectedClass = this.superClass.value;
    const arrayToString = selectedTitle && selectedTitle.length ? selectedTitle.map((val) => '"' + val + '"') : [];

    this.superFilterTitle = selectedTitle && selectedTitle.length ? arrayToString : [];
    // this.filteredValues.rncp_title_ids = selectedTitle && selectedTitle.length ? arrayToString : [];
    // this.filteredValues.preparation_center = '';
    // this.filteredValues.certifier = '';

    if (selectedTitle && selectedTitle.length) {
      this.getClassListDropdown(selectedTitle);
      // this.getSchoolListDropdown(selectedTitle, selectedClass, selectedStatus);
      // this.getAllSchools();
    } else {
      this.classList = [];
    }
  }

  setSuperFilterClass() {
    this.superFilterStatus = '';
    this.superFilterSchool = [];
    this.superStatus.setValue(null);
    this.superSchool.setValue(null);
    const selectedTitle = this.superTitle.value;
    const selectedStatus = this.superStatus.value;
    const selectedClass = this.superClass.value;
    const cleanDoubleQuote = selectedClass && selectedClass.length ? selectedClass.map((val) => val.replaceAll(`"`, `'`)) : [];
    const arrayToString = cleanDoubleQuote && cleanDoubleQuote.length ? cleanDoubleQuote.map((val) => '"' + val + '"') : [];

    this.superFilterClass = selectedClass && selectedClass.length ? arrayToString : [];
    // this.filteredValues.class_names = selectedClass && selectedClass.length ? arrayToString : [];
    // this.filteredValues.class_name = '';

    if (selectedClass && selectedClass.length) {
      this.statusList = this.statussList;
      // this.getSchoolListDropdown(selectedTitle, selectedClass, selectedStatus);
      // this.getAllSchools();
    } else {
      this.statusList = [];
    }
  }

  setSuperFilterStatus() {
    this.superFilterSchool = [];
    this.superSchool.setValue(null);
    const selectedTitle = this.superTitle.value;
    const selectedClass = this.superClass.value;
    const selectedStatus = this.superStatus.value;
    this.superFilterStatus = selectedStatus ? selectedStatus : '';
    // this.filteredValues.school_type = selectedStatus ? selectedStatus : '';


    if (selectedStatus) {
      this.getSchoolListDropdown(selectedTitle, selectedClass, selectedStatus);
      // this.getAllSchools();
    } else {
      this.schoolList = [];
    }
  }

  setSuperFilterSchool() {
    this.schoolFilter.setValue('');
    this.legalFilter.setValue('');
    const selectedSchool = this.superSchool.value;
    const arrayToString = selectedSchool && selectedSchool.length ? selectedSchool.map((val) => '"' + val + '"') : [];

    this.superFilterSchool = selectedSchool && selectedSchool.length ? arrayToString : [];
    // this.filteredValues.school_ids = selectedSchool && selectedSchool.length ? arrayToString : [];

    // if (!this.isReset) {
    //   this.getAllSchools();
    // }
  }

  onAddSchool() {
    this.router.navigate(['school', 'create']);
  }

  goToSchoolDetails(schoolId: string) {
    // this.router.navigate(['school', schoolId]);
    window.open(`./school/${schoolId}`, '_blank');
  }

  getSelectedTitle(titles: any[]) {
    if (titles) {
      return titles.filter((title) => title.yesNo).map((title) => title.name);
    }
  }

  resetSelection() {
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.filteredValues = {
      school: '',
      city: '',
      preparation_center: '',
      certifier: '',
      school_type: '',
      class_name: '',
      school_ids: [],
      rncp_title_ids: [],
      class_names: [],
      legal_name_exact: '',
    };

    this.superFilterTitle = [];
    this.superFilterClass = [];
    this.superFilterStatus = '';
    this.superFilterSchool = [];
    this.classList = [];
    this.schoolList = [];
    this.statusList = [];

    this.schoolFilter.setValue('');
    this.legalFilter.setValue('');
    this.cityFilter.setValue('');
    this.rncpTitlePreparationFilter.setValue('');
    this.rncpTitleCertifierFilter.setValue('');
    this.statusFilter.setValue('');
    this.classFilter.setValue('');
    this.superClass.setValue(null);
    this.superSchool.setValue(null);
    this.superStatus.setValue(null);
    this.superTitle.setValue(null);

    this.userSelected = [];
    this.userSelectedId = [];
    this.selection.clear();
    this.isCheckedAll = false;
    this.dataUnselect = [];

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    this.getAllSuperFilterDropdown();
    this.getSchoolDropdownList();
    this.getAllSchools();
    this.getClassDropdownList();
    this.getRncpTitleList();
  }

  sendMail(school) {
    this.subs.sink = this.schoolService.getAcadofSchool(school._id).subscribe((AcadSchoolList) => {
      this.sendEmailDialogComponent = this.dialog.open(SchoolComposeEmailDialogComponent, {
        disableClose: true,
        width: '800px',
        data: AcadSchoolList,
      });
    });
  }

  ngOnDestroy() {
    this.pageTitleService.setTitle('');
    this.subs.unsubscribe();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows || numSelected > numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.dataUnselect = [];
      this.isCheckedAll = false;
    } else {
      this.isCheckedAll = true;
      this.dataSource.data.forEach((row) => this.selection.select(row));
    }
  }

  getUniquePrepCenter(prepCenters) {
    let prepData = _.cloneDeep(prepCenters);
    if (!!this.permissions.getPermission('Certifier Admin')) {
      const titles = this.utilService.getAllTitleIdFromCRUser();
      prepData = prepCenters.filter((element) => {
        return titles.includes(element.rncp_title_id._id);
      });
    }
    return _.uniqBy(prepData, 'rncp_title_id.short_name');
  }

  getUniqueCertifier(certifiers) {
    let cerData = _.cloneDeep(certifiers);
    if (!!this.permissions.getPermission('Certifier Admin')) {
      const titles = this.utilService.getAllTitleIdFromCRUser();
      cerData = certifiers.filter((option) => {
        return titles.includes(option._id);
      });
    }
    return _.uniqBy(cerData, 'short_name');
  }

  getUniqueClass(classes) {
    let classData = []
    classes.preparation_center_ats.forEach(element => {
      if (element.class_id && element.class_id.name) {
        classData.push(element.class_id.name)
      }
    });
    classes.certifier_ats.forEach(element => {
      if (element.classes && element.classes.name) {
        classData.push(element.classes.name)
      }
    })
    return _.uniqBy(classData);
  }

  /*
   * Render tooltip for column title*/
  renderTooltipTitle(entities: any[]): string {
    let tooltip = '';
    let count = 0;
    let prepData = _.cloneDeep(entities);
    if (!!this.permissions.getPermission('Certifier Admin')) {
      const titles = this.utilService.getAllTitleIdFromCRUser();
      prepData = entities.filter((element) => {
        return titles.includes(element.rncp_title_id._id);
      });
    }
    for (const entity of prepData) {
      count++;
      if (count > 1) {
        if (entity && entity.rncp_title_id) {
          tooltip = tooltip + ', ';
          tooltip = tooltip + `${entity.rncp_title_id.short_name}`;
        }
      } else {
        if (entity && entity.rncp_title_id) {
          tooltip = tooltip + `${entity.rncp_title_id.short_name}`;
        }
      }
    }
    return tooltip;
  }

  goToStudentCard(schoolId) {
    if (!!this.permissions.getPermission('Corrector of Problematic')) {
      this.router.navigate(['/students-card-problematic', schoolId]);
    } else {
      this.router.navigate(['/school', schoolId], {
        queryParams: { open: 'student-cards', studentStatus: 'active' },
      });
    }
  }

  /*
   * Render tooltip for column title*/
  renderTooltipTitleCertifier(entities: any[]): string {
    let tooltip = '';
    let count = 0;
    let cerData = _.cloneDeep(entities);
    if (!!this.permissions.getPermission('Certifier Admin')) {
      const titles = this.utilService.getAllTitleIdFromCRUser();
      cerData = entities.filter((option) => {
        return titles.includes(option._id);
      });
    }
    for (const entity of cerData) {
      count++;
      if (count > 1) {
        tooltip = tooltip + ', ';
        tooltip = tooltip + `${entity.short_name}`;
      } else {
        tooltip = tooltip + `${entity.short_name}`;
      }
    }
    return tooltip;
  }

  renderTooltipClass(entities: any[]): string {
    let tooltip = '';
    let count = 0;
    let cerData = _.cloneDeep(entities);
    for (const entity of cerData) {
      count++;
      if (entity) {
        if (count > 1) {
          tooltip = tooltip + ', ';
          tooltip = tooltip + `${entity}`;
        } else {
          tooltip = tooltip + `${entity}`;
        }
      }
    }
    return tooltip;
  }

  // getUrgentMail() {
  //   this.subs.sink = this.mailboxService.getUrgentMail().subscribe((mailList: any[]) => {
  //     if (mailList && mailList.length) {
  //       this.subs.sink = this.dialog
  //         .open(ReplyUrgentMessageDialogComponent, {
  //           disableClose: true,
  //           width: '825px',
  //           panelClass: 'certification-rule-pop-up',
  //           data: mailList,
  //         })
  //         .afterClosed()
  //         .subscribe((resp) => {
  //           this.subs.sink = this.mailboxService.getUrgentMail().subscribe((mailUrgent: any[]) => {
  //             if (mailUrgent && mailUrgent.length) {
  //               this.replyUrgentMessageDialogComponent = this.dialog.open(ReplyUrgentMessageDialogComponent, {
  //                 disableClose: true,
  //                 width: '825px',
  //                 panelClass: 'certification-rule-pop-up',
  //                 data: mailUrgent,
  //               });
  //             }
  //           });
  //         });
  //     }
  //   });
  // }

  dialogExportResult() {
    this.delimeter = null;
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
        this.delimeter = separator.value;

        if (this.selectType == 'one' && this.userSelected.length) {
          const schoolIds = this.userSelected.map((school) => school._id);
          this.generateSchoolCSV(schoolIds);
        } else {
          this.allStudentForExport = [];
          this.getAllStudentExportData(0);
        }
      }
    });
  }

  generateSchoolCSV(schoolIds) {
    this.subs.sink = this.schoolService.GenerateSchoolCSV(schoolIds, this.delimeter).subscribe((resp) => {
      if (resp) {

        Swal.fire({
          type: 'success',
          title: this.translate.instant('Bravo!'),
          confirmButtonText: this.translate.instant('OK'),
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        })
      }
    })
  }

  generateAllSchoolCSV(dataa) {
    if (dataa && dataa.length) {
      const schoolID = dataa.map((school) => school._id);
      this.subs.sink = this.schoolService.GenerateSchoolCSV(schoolID, this.delimeter).subscribe((resp) => {
        if (resp) {

          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo!'),
            confirmButtonText: this.translate.instant('OK'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          })
        }
      })
    }
  }

  exportData() {
    Swal.close();
    const data = [];

    if (this.selectType === 'one' && this.userSelected.length) {
      if (this.userSelected) {
        this.userSelected.forEach((item) => {
          const obj = [];
          const classData = this.getUniqueClass(item)
          let Address = '';
          let Acadir = '';
          for (const address of item.school_address) {
            Address = Address
              ? Address +
                ', ' +
                (address.postal_code ? address.postal_code + ', ' : '') +
                ' ' +
                (address.address1 ? address.address1 + ', ' : '') +
                ' ' +
                (address.city ? address.city + ' - ' : '') +
                ' ' +
                (address.country ? address.country : '')
              : (address.postal_code ? address.postal_code + ', ' : '') +
                ' ' +
                (address.address1 ? address.address1 + ', ' : '') +
                ' ' +
                (address.city ? address.city + ' - ' : '') +
                ' ' +
                (address.country ? address.country : '');
          }

          for (const entity of item.get_specific_users) {
            Acadir = Acadir
              ? Acadir +
                ', ' +
                (entity.civility ? this.translate.instant(entity.civility) : '') +
                ' ' +
                (entity.first_name ? entity.first_name : '') +
                ' ' +
                (entity.last_name ? entity.last_name : '')
              : (entity.civility ? this.translate.instant(entity.civility) : '') +
                ' ' +
                (entity.first_name ? entity.first_name : '') +
                ' ' +
                (entity.last_name ? entity.last_name : '');
          }
          // TODO: From the template get the data location and add the data
          // TEMPLATE CSV: https://docs.google.com/spreadsheets/d/1G55wWXJEfAGUBv66lt-ioW56W1lFmDGLaJDnepZ3CT4/edit#gid=0
          // TEMPLATE CSV Duplicate With Replace Column (Short name : School Commercial Name) (Long Name : School Legal Name) new Column SIRET: https://docs.google.com/spreadsheets/d/1JDbTkD7XtewkdRuihMb4gzeAZzeiwySCwWver8edm0s/edit#gid=786167743
          obj[0] = item.short_name ? '=HYPERLINK("' + `http://www.admtc.pro/school/${item._id}` + '"; "' + item.short_name + '")' : '-';
          obj[1] = item.long_name ? item.long_name : '';
          obj[2] = item.school_siret ? item.school_siret: '';
          obj[3] = this.renderTooltipTitle(item.preparation_center_ats);
          obj[4] = this.renderTooltipTitleCertifier(item.certifier_ats);
          obj[5] = this.renderTooltipClass(classData)
          obj[6] = Address;
          obj[7] = Acadir;
          // obj[6] = `http://localhost:7510/school/${item._id}`;
          data.push(obj);
        });

        const valueRange = { values: data };
        const today = moment().format('DD-MM-YYYY');
        const title = this.exportName + '_' + today;
        const sheetID = this.translate.currentLang === 'en' ? 786167743 : 0;
        const sheetData = {
          spreadsheetId: '1JDbTkD7XtewkdRuihMb4gzeAZzeiwySCwWver8edm0s',
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
      limit: 500,
      page: pageNumber,
    };
    let filter = ``;
    filter += this.filteredValues.school && !this.filteredValues.school_ids.length ? `school : "${this.filteredValues.school}" ` : '';
    filter += !this.filteredValues.school && this.filteredValues.school_ids.length ? `school_ids : [${this.filteredValues.school_ids}] ` : '';
    filter += this.filteredValues.city ? `city: "${this.filteredValues.city}"` : '';
    filter += this.filteredValues.preparation_center && !this.filteredValues.rncp_title_ids.length ? `preparation_center: "${this.filteredValues.preparation_center}" ` : '';
    filter += this.filteredValues.certifier && !this.filteredValues.rncp_title_ids.length ? `certifier: "${this.filteredValues.certifier}" ` : '';
    filter += !this.filteredValues.certifier && !this.filteredValues.preparation_center && this.filteredValues.rncp_title_ids.length ? `rncp_title_ids: [${this.filteredValues.rncp_title_ids.toString()}] ` : '';
    filter += this.filteredValues.school_type ? `school_type: ${this.filteredValues.school_type} ` : '';
    filter += this.filteredValues.class_name && !this.filteredValues.class_names.length ? `class_name: "${this.filteredValues.class_name}" ` : '';
    filter += !this.filteredValues.class_name && this.filteredValues.class_names.length ? `class_names_exact: [${this.filteredValues.class_names}] ` : '';

    // Check for dropdown school, title cert and title PC. Should reset dropdown after reset as well
    if (!this.filteredValues.school) {
      if (!!this.permissions.getPermission('CR School Director')) {
        this.titleCertifierFilterList = this.titleCrFromCr;
        this.titlePreparationFilterList = this.titlePcFromCr;
      } else {
        this.titleCertifierFilterList = this.originalTitleList;
        this.titlePreparationFilterList = this.originalTitleList;
      }
      this.rncpTitleCertifierFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });
      this.rncpTitlePreparationFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });
    }
    if (!this.filteredValues.preparation_center && !this.filteredValues.certifier) {
      this.filterSchoolList = this.originalSchoolList;
      this.schoolFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });
      this.filterLegalList = this.originalLegalList;
      this.legalFilter.updateValueAndValidity({ emitEvent: true, onlySelf: true });
    }

    if (!!this.permissions.getPermission('CR School Director') || !!this.permissions.getPermission('Certifier Admin')) {
      const schoolids = currentUser.entities ? currentUser.entities[0].school._id : '';
      const certifier_school = schoolids;
      let school_ids = [];
      if (!!this.permissions.getPermission('Certifier Admin')) {
        school_ids = this.utilService.getUserAllSchoolCerAdmin();
      } else if (!!this.permissions.getPermission('CR School Director')) {
        school_ids = this.utilService.getAllSchoolFromCRUser();
      }
      this.subs.sink = this.schoolService
        .getAllSchoolsIDByCR(pagination, this.sortValue, filter, certifier_school)
        .subscribe((schoolList: any) => {
          if (schoolList && schoolList.length) {
            this.allStudentForExport.push(...schoolList);
            if (this.isCheckedAll && this.dataUnselect && this.dataUnselect.length) {
              this.allStudentForExport = this.allStudentForExport.filter((list) => !this.dataUnselect.includes(list._id))
            }
            const page = pageNumber + 1;

            // recursively get student data by 500 until we dont get student data anymore
            // we use this way because if we get all the data at once, it will trigger cors policy error because response too big
            this.getAllStudentExportData(page);
          } else {
            this.isLoading = false;
            this.generateAllSchoolCSV(this.allStudentForExport);
          }
        });
    } else if (!!this.permissions.getPermission('Chief Group Academic')) {
      const entity = currentUser.entities[0];
      const schoolList = [];

      if (entity && entity.group_of_school) {
        if (entity.group_of_school.headquarter && entity.group_of_school.headquarter._id) {
          schoolList.push(entity.group_of_school.headquarter._id);
        }
        if (entity.group_of_school.school_members && entity.group_of_school.school_members.length) {
          entity.group_of_school.school_members.forEach((school) => {
            schoolList.push(school._id);
          });
        }
      }

      if (schoolList && schoolList.length) {
        this.subs.sink = this.schoolService
          .getAllSchoolsIDChiefGroupOfSchool(pagination, this.sortValue, filter, schoolList)
          .subscribe((schoolLists: any[]) => {
            if (schoolList && schoolList.length) {
              this.allStudentForExport.push(...schoolList);
              const page = pageNumber + 1;
              if (this.isCheckedAll && this.dataUnselect && this.dataUnselect.length) {
                this.allStudentForExport = this.allStudentForExport.filter((list) => !this.dataUnselect.includes(list._id))
              }

              // recursively get student data by 500 until we dont get student data anymore
              // we use this way because if we get all the data at once, it will trigger cors policy error because response too big
              this.getAllStudentExportData(page);
            } else {
              this.isLoading = false;
              this.generateAllSchoolCSV(this.allStudentForExport);
            }
          });
      }
    } else if (!!this.permissions.getPermission('Corrector of Problematic')) {
      const correctorProblematicId = '5a2e1ecd53b95d22c82f9551';
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((resp) => {
        const dataUSer = resp.entities.filter((ent) => ent.type.name === userType);
        const assignedTitleIds = this.utilService.getAcademicAllAssignedTitle(dataUSer);
        this.subs.sink = this.schoolService
          .getAllSchoolsIDCorretorProblematic(pagination, this.sortValue, filter, correctorProblematicId, assignedTitleIds)
          .subscribe((schoolList: any[]) => {
            if (schoolList && schoolList.length) {
              this.allStudentForExport.push(...schoolList);
              const page = pageNumber + 1;
              if (this.isCheckedAll && this.dataUnselect && this.dataUnselect.length) {
                this.allStudentForExport = this.allStudentForExport.filter((list) => !this.dataUnselect.includes(list._id))
              }

              // recursively get student data by 500 until we dont get student data anymore
              // we use this way because if we get all the data at once, it will trigger cors policy error because response too big
              this.getAllStudentExportData(page);
            } else {
              this.isLoading = false;
              this.generateAllSchoolCSV(this.allStudentForExport);
            }
          });
      });
    } else {
      this.subs.sink = this.schoolService.getAllSchoolsID(pagination, this.sortValue, filter).subscribe((schoolList: any[]) => {
        if (schoolList && schoolList.length) {
          this.allStudentForExport.push(...schoolList);
          const page = pageNumber + 1;
          if (this.isCheckedAll && this.dataUnselect && this.dataUnselect.length) {
            this.allStudentForExport = this.allStudentForExport.filter((list) => !this.dataUnselect.includes(list._id))
          }

          // recursively get student data by 500 until we dont get student data anymore
          // we use this way because if we get all the data at once, it will trigger cors policy error because response too big
          this.getAllStudentExportData(page);
        } else {
          this.isLoading = false;
          this.generateAllSchoolCSV(this.allStudentForExport);
        }
      });
    }
  }

  exportAllData(dataa) {
    const exportData = _.uniqBy(dataa, '_id');
    const data = [];
    if (exportData && exportData.length) {
      exportData.forEach((item) => {
        const obj = [];
        const classData = this.getUniqueClass(item)
        let Address = '';
        let Acadir = '';
        for (const address of item.school_address) {
          Address = Address
            ? Address +
              ', ' +
              (address.postal_code ? address.postal_code + ', ' : '') +
              ' ' +
              (address.address1 ? address.address1 + ', ' : '') +
              ' ' +
              (address.city ? address.city + ' - ' : '') +
              ' ' +
              (address.country ? this.translate.instant(address.country) : '')
            : (address.postal_code ? address.postal_code + ', ' : '') +
              ' ' +
              (address.address1 ? address.address1 + ', ' : '') +
              ' ' +
              (address.city ? address.city + ' - ' : '') +
              ' ' +
              (address.country ? this.translate.instant(address.country) : '');
        }

        for (const entity of item.get_specific_users) {
          Acadir = Acadir
            ? Acadir +
              ', ' +
              (entity.civility ? this.translate.instant(entity.civility) : '') +
              ' ' +
              (entity.first_name ? entity.first_name : '') +
              ' ' +
              (entity.last_name ? entity.last_name : '')
            : (entity.civility ? this.translate.instant(entity.civility) : '') +
              ' ' +
              (entity.first_name ? entity.first_name : '') +
              ' ' +
              (entity.last_name ? entity.last_name : '');
        }
        // TODO: From the template get the data location and add the data
        // TEMPLATE CSV: https://docs.google.com/spreadsheets/d/1G55wWXJEfAGUBv66lt-ioW56W1lFmDGLaJDnepZ3CT4/edit#gid=0
        // TEMPLATE CSV Duplicate With Replace Column (Short name : School Commercial Name) (Long Name : School Legal Name) new Column SIRET: https://docs.google.com/spreadsheets/d/1JDbTkD7XtewkdRuihMb4gzeAZzeiwySCwWver8edm0s/edit#gid=786167743
        obj[0] = item.short_name ? '=HYPERLINK("' + `http://www.admtc.pro/school/${item._id}` + '"; "' + item.short_name + '")' : '-';
        obj[1] = item.long_name ? item.long_name : '';
        obj[2] = item.school_siret ? item.school_siret: '';
        obj[3] = this.renderTooltipTitle(item.preparation_center_ats);
        obj[4] = this.renderTooltipTitleCertifier(item.certifier_ats);
        obj[5] = this.renderTooltipClass(classData)
        obj[6] = Address;
        obj[7] = Acadir;
        // obj[6] = `http://localhost:7510/school/${item._id}`;
        data.push(obj);
      });

      const valueRange = { values: data };
      const today = moment().format('DD-MM-YYYY');
      const title = this.exportName + '_' + today;
      const sheetID = this.translate.currentLang === 'en' ? 786167743 : 0;
      const sheetData = {
        spreadsheetId: '1JDbTkD7XtewkdRuihMb4gzeAZzeiwySCwWver8edm0s',
        sheetId: sheetID,
        range: 'A7',
      };
      this.exportCsvService.createAndUpdateSpreadsheet(valueRange, title, sheetData);
    }
  }
  showOptions(info, row?) {
    if (this.isCheckedAll) {
      if (row) {
        if (!this.dataUnselect.includes(row?._id)) {
          this.dataUnselect.push(row?._id);
          this.selection.deselect(row?._id);
        } else {
          const indx = this.dataUnselect.findIndex((list) => list === row?._id);
          this.dataUnselect.splice(indx, 1);
          this.selection.select(row?._id);
        }
      }
    } else {
      if (row) {
        if (this.userSelected && this.userSelected.length) {
          const dataFilter = this.userSelected.filter((resp) => resp._id === row._id);
          if (dataFilter && dataFilter.length < 1) {
            this.userSelected.push(row)
          } else {
            const indexFilter = this.userSelected.findIndex((resp) => resp._id === row._id);
            this.userSelected.splice(indexFilter, 1);
          }
        } else {
          this.userSelected.push(row)
        }
      }
    }
    const numSelected = this.selection.selected.length;
    if (numSelected > 0) {
      this.disabledExport = false;
    } else {
      this.disabledExport = true;
    }
    this.selectType = info;
  }
  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }
  getUniqueRncpTitles(entities) {
    return _.uniqBy(entities, 'assigned_rncp_title.short_name');
  }
  getUniqueRncpTitlesCR(entities) {
    return _.uniqBy(entities, 'assigned_rncp_title.short_name');
  }

  isAllDropdownSelected(type) {
    if (type === 'title') {
      const selected = this.superTitle.value;
      const isAllSelected = selected && selected.length !==0 && selected.length === this.titleList.length;
      return isAllSelected;
    } else if (type === 'class') {
      const selected = this.superClass.value;
      const isAllSelected = selected && selected.length !==0 && selected.length === this.classList.length;
      return isAllSelected;
    } else if (type === 'school') {
      const selected = this.superSchool.value;
      const isAllSelected = selected && selected.length !==0 && selected.length === this.schoolList.length;
      return isAllSelected;
    }
  }

  isSomeDropdownSelected(type) {
    if (type === 'title') {
      const selected = this.superTitle.value;
      const isIndeterminate = selected && selected.length !== 0 && selected.length !== this.titleList.length;
      return isIndeterminate;
    } else if (type === 'class') {
      const selected = this.superClass.value;
      const isIndeterminate = selected && selected.length !== 0 && selected.length !== this.classList.length;
      return isIndeterminate;
    } else if (type === 'school') {
      const selected = this.superSchool.value;
      const isIndeterminate = selected && selected.length !== 0 && selected.length !== this.schoolList.length;
      return isIndeterminate;
    }
  }

  selectAllTitle(event) {
    if (event.checked) {
      const titleIds = this.titleList.map((el) => el._id);
      this.superTitle.patchValue(titleIds, { emitEvent: false });
    } else {
      this.superTitle.patchValue(null, { emitEvent: false });
    }
  }

  selectAllClass(event) {
    if (event.checked) {
      const classNames = this.classList.map((el) => el.name);
      this.superClass.patchValue(classNames, { emitEvent: false });
    } else {
      this.superClass.patchValue(null, { emitEvent: false });
    }
  }

  selectAllSchool(event) {
    if (event.checked) {
      const schoolIds = this.schoolList.map((el) => el._id);
      this.superSchool.patchValue(schoolIds, { emitEvent: false });
    } else {
      this.superSchool.patchValue(null, { emitEvent: false });
    }
  }

  applyFilter() {
    this.filteredValues.rncp_title_ids = this.superFilterTitle;
    this.filteredValues.class_names = this.superFilterClass;
    this.filteredValues.school_type = this.superFilterStatus;
    this.filteredValues.school_ids = this.superFilterSchool;

    if (!this.isReset) {
      this.paginator.pageIndex = 0;
      this.sort.direction = '';
      this.sort.active = '';
      this.sort.sortChange.emit({active: '', direction: ''});
      this.getAllSchools();
    }
  }

  showAddSchoolButton() {
    return this.permissionService.showAddSchoolPerm();
  }

  showExportSchoolButton() {
    return this.permissionService.showBtnExportListOfSchoolPerm();
  }

  showEditSchoolButton() {
    return this.permissionService.showBtnEditListOfSchoolPerm();
  }

  showStudentDetailButton() {
    return this.permissionService.showBtnStudentDetailListOfSchoolPerm();
  }

  showSendEmailButton() {
    return this.permissionService.showBtnSendEmailListOfSchoolPerm();
  }
}
