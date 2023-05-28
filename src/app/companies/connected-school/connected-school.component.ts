import { Component, OnInit, Output, Input, EventEmitter, AfterViewInit, OnDestroy, ViewChild, OnChanges } from '@angular/core';
import { SubSink } from 'subsink';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { startWith, tap, map } from 'rxjs/operators';
import { UntypedFormControl, FormBuilder } from '@angular/forms';
import { CompanyService } from 'app/service/company/company.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { DomSanitizer } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { UtilityService } from 'app/service/utility/utility.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { ConnectSchoolDialogComponent } from '../connect-school-dialog/connect-school-dialog.component';
import { ConnectMentorDialogComponent } from '../connect-mentor-dialog/connect-mentor-dialog.component';
import { PermissionService } from 'app/service/permission/permission.service';

interface Filter {
  school_name: string;
  shortName: string;
  classes: string;
}

@Component({
  selector: 'ms-connected-school',
  templateUrl: './connected-school.component.html',
  styleUrls: ['./connected-school.component.scss'],
})
export class ConnectedSchoolComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  private subs = new SubSink();
  @Input() companyData: any;
  @Input() companyId: string;
  // connected schools table variables
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['school_name', 'rncpTitles', 'classes', 'action'];
  filterColumns: string[] = ['school_nameFilter', 'shortNameFilter', 'classesFilter', 'actionFilter'];
  school_nameFilter = new UntypedFormControl('');
  shortNameFilter = new UntypedFormControl('');
  classesFilter = new UntypedFormControl('');
  filteredValues: Filter = {
    school_name: '',
    shortName: '',
    classes: '',
  };
  timeOutSwal: any;

  countries: string[] = [];
  filteredCountry: string[][] = [];
  cities: string[][] = [];
  filteredCities: string[][] = [];
  departments: string[][] = []; // in API, this field called "academy"
  filteredDepartments: string[][] = [];
  regions: string[][] = []; // in API, this field called "province"
  filteredRegions: string[][] = [];

  schoolList: any[] = [];
  titleList: any[] = [];
  classList: any[] = [];
  schoolDataList: any[] = [];
  titleDataList: any[] = [];
  classDataList: any[] = [];

  sortValue = null;
  isWaitingForResponse = false;
  noData: any;
  connectData: any;
  isReset = false;
  dataLoaded = false;
  entityData: any;
  CurUser: any;
  isUserAdmtc = false;
  isUserAcadir = false;

  constructor(
    private companyService: CompanyService,
    public dialog: MatDialog,
    private translate: TranslateService,
    private utilService: UtilityService,
    private CurUserService: AuthService,
    public permissionService: PermissionService
  ) { }

  ngOnInit() {
    // *************** Get Data Country
    this.countries = this.companyService.getCountries();

    // Cek User Type & Permission Access User to Company Data
    this.CurUser = this.CurUserService.getLocalStorageUser();
    this.entityData = this.CurUser.entities.find((entity) => entity.type.name === 'Academic Director');
    this.isUserAdmtc = this.utilService.isUserEntityADMTC();
    this.isUserAcadir = this.utilService.isUserAcadir();
    // ======================================================
    this.getDataConnect();
  }

  ngOnChanges() {
    clearInterval();
    clearTimeout();
    this.subs.unsubscribe();
    this.getDataConnect();
  }

  // *************** Sorting Data Table Connected School
  sortData(sort: Sort) {
    if (sort.active === 'short_name') {
      this.sortValue = sort.direction ? { short_name: sort.direction } : null;
    } else if (sort.active === 'class_name') {
      this.sortValue = sort.direction ? { class_name: sort.direction } : null;
    } else if (sort.active === 'rncp_title_name') {
      this.sortValue = sort.direction ? { rncp_title_name: sort.direction } : null;
    }

    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      if (!this.isReset) {
        this.getDataConnect();
      }
    }
  }

  // *************** Open Connect School Dialog
  onConnectSchool() {
    this.subs.sink = this.dialog
      .open(ConnectSchoolDialogComponent, {
        minWidth: '400px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: this.companyId,
      })
      .afterClosed()
      .subscribe((e) => {
        if (e) {
          this.getDataConnect();
        }
      });
  }

  // *************** Get Data Connected School List
  getDataConnect() {
    this.titleList = [];
    this.titleDataList = [];
    this.classList = [];
    this.classDataList = [];
    this.schoolList = [];
    this.schoolDataList = [];
    this.isWaitingForResponse = true;
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };

    let filter = ``;
    filter += this.filteredValues.school_name ? `school : "${this.filteredValues.school_name}"` : '';
    filter += this.filteredValues.shortName ? `rncp_title_name: "${this.filteredValues.shortName}"` : '';
    filter += this.filteredValues.classes ? `class_name: "${this.filteredValues.classes}"` : '';

    this.subs.sink = this.companyService.getAllSchools(this.companyId, pagination, this.sortValue, filter).subscribe(
      (response) => {
        if (response && response.length) {
          // this.dataSource.data = response;
          this.connectData = response;
          this.dataSource.sort = this.sort;
          this.paginator.length = response[0].count_document ? response[0].count_document : 0;
          this.getDataFilter(this.dataSource.data);
          this.connectData.forEach((element, index) => {
            const getTitlePc = [];
            const getTitleCr = [];
            if (element && element.preparation_center_ats) {
              element.preparation_center_ats.forEach((element1) => {
                const pc = {
                  _id: element1.rncp_title_id._id,
                  name: element1.rncp_title_id.short_name,
                  class: element1.rncp_title_id.classes
                };
                getTitlePc.push(pc);
              });
            }
            if (element && element.certifier_ats) {
              element.certifier_ats.forEach((element2) => {
                const cr = {
                  _id: element2._id,
                  name: element2.short_name,
                  class: element2.classes
                };
                getTitleCr.push(cr);
              });
            }
            const result = _.concat(getTitleCr, getTitlePc);
            this.connectData[index].title = _.uniqBy(result, 'name');
          });
          this.dataSource.data = this.connectData;
        } else {
          this.dataSource.data = [];
          this.paginator.length = 0;
        }
        this.isReset = false
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
        this.isWaitingForResponse = false;
      },
      (err) => {
        this.CurUserService.postErrorLog(err);

      },
    );
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {

          if (!this.isReset) {
            this.getDataConnect();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
  }

  // *************** Get Data Filter Table
  getDataFilter(data) {

    data.forEach((element) => {
      const schoolData = {
        _id: element._id,
        name: element.short_name,
      };
      this.schoolList.push(schoolData);
      this.schoolDataList.push(schoolData);
      if (element && element.preparation_center_ats) {
        element.preparation_center_ats.forEach((element1) => {
          if (element1 && element1.rncp_title_id) {
            const titleData = {
              _id: element1.rncp_title_id._id,
              name: element1.rncp_title_id.short_name,
            };
            this.titleList.push(titleData);
            this.titleDataList.push(titleData);
          }
          if (element1 && element1.rncp_title_id) {
            element1.rncp_title_id.classes.forEach((element2) => {
              if (element2) {
                const classData = {
                  _id: element2._id,
                  name: element2.name,
                };
                this.classList.push(classData);
                this.classDataList.push(classData);
              }
            });
          } else {
            this.classList = [];
            this.classDataList = [];
          }
        });
      } else {
        this.titleList = [];
        this.titleDataList = [];
        this.classList = [];
        this.classDataList = [];
      }
    });
    this.schoolList = _.orderBy(this.schoolList, ['name'], ['asc']);
    this.schoolDataList = _.orderBy(this.schoolDataList, ['name'], ['asc']);
    this.classList = _.orderBy(this.classList, ['name'], ['asc']);
    this.classDataList = _.orderBy(this.classDataList, ['name'], ['asc']);
    this.titleList = _.orderBy(this.titleList, ['name'], ['asc']);
    this.titleDataList = _.orderBy(this.titleDataList, ['name'], ['asc']);
  }

  // *************** Function to filter table
  setSchoolFilter(data: string) {
    this.filteredValues.school_name = data === 'AllM' ? '' : data;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getDataConnect();
    }
  }
  setTitleFilter(data: string) {
    this.filteredValues.shortName = data === 'AllM' ? '' : data;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getDataConnect();
    }
  }
  setClassFilter(data: string) {
    this.filteredValues.classes = data === 'AllM' ? '' : data;
    this.paginator.pageIndex = 0;
    if (!this.isReset) {
      this.getDataConnect();
    }
  }
  filterTitle() {
    this.subs.sink = this.shortNameFilter.valueChanges.subscribe((search) => {
      this.titleList = this.titleDataList.filter((title) => title.name.toLowerCase().trim().includes(search));
    });
  }
  filterSchool() {
    this.subs.sink = this.school_nameFilter.valueChanges.subscribe((search) => {
      this.schoolList = this.schoolDataList.filter((title) => title.name.toLowerCase().trim().includes(search));
    });
  }
  filterClass() {
    this.subs.sink = this.classesFilter.valueChanges.subscribe((search) => {
      this.classList = this.classDataList.filter((title) => title.name.toLowerCase().trim().includes(search));
    });
  }
  // *************** End of Function to filter table


  // *************** Function to Disconnect School From Company
  disconnectSchool(schoolId, school) {
    let timeDisabled = 5;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('DISCONNECT_SCHOOL.TITLE'),
      html: this.translate.instant('DISCONNECT_SCHOOL.TEXT', {
        school: school,
      }),
      showCancelButton: true,
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON1', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON2'),
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const time = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DISCONNECT_SCHOOL.BUTTON1') + ' in ' + timeDisabled + ' sec';
        }, 1000);

        this.timeOutSwal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DISCONNECT_SCHOOL.BUTTON1');
          Swal.enableConfirmButton();
          clearTimeout(time);
        }, timeDisabled * 1000);
      },
    }).then((isConfirm) => {
      clearTimeout(this.timeOutSwal);
      if (isConfirm.value) {
        this.subs.sink = this.companyService.disconnectSchoolFromCompany(this.companyId, schoolId).subscribe(
          (resp) => {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('DISCONNECT_SCHOOL.SUCCESS_TITLE'),
              text: this.translate.instant('DISCONNECT_SCHOOL.SUCCESS_TEXT', {
                school: school,
              }),
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            });
            this.paginator.pageIndex = 0;
            this.getDataConnect();
          },
          (err) => {
            const text = String(err);
            const message = text.slice(21);
            const alert = message;

            if (alert.includes('Cannot Disconnect the School, because mentor already connected to the Job Description')) {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('DISCONNECT_SCHOOL.TITLE'),
                text: this.translate.instant('Cannot Disconnect the School, because mentor already connected to the Job Description'),
                confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
              });
            } else if (alert.includes('Cannot Disconnect the School, because mentor already connected to the Mentor Evaluation')) {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('DISCONNECT_SCHOOL.TITLE'),
                text: this.translate.instant('Cannot Disconnect the School, because mentor already connected to the Mentor Evaluation'),
                confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
              });
            }
          },
        );
      }
    });
  }

  // *************** Function to make data table is unix
  getUnique(title) {
    return _.uniqBy(title, 'name');
  }
  getUniqueTitle(title) {
    return _.uniqBy(title, 'name');
  }
  getUniqueSchool(title) {
    return _.uniqBy(title, 'name');
  }
  uniqTitle(titlepc, titlecr) {
    const dataCrExpected = [];
    const dataPcExpected = [];
    titlecr.forEach((element) => {
      const cr = {
        _id: element._id,
        name: element.short_name,
      };
      dataCrExpected.push(cr);
    });
    titlepc.forEach((element) => {
      const pc = {
        _id: element.rncp_title_id._id,
        name: element.rncp_title_id.short_name,
      };
      dataPcExpected.push(pc);
    });

    const result = _.concat(dataCrExpected, dataPcExpected);
    return _.uniqBy(result, 'name');
  }
  uniqueClass(classes) {
    return _.uniqBy(classes, 'name');
  }
  // *************** End of Function to make data table is unix


  // *************** Function to Generate tooltip data table
  renderTooltipTitle(entities: any[]): string {
    let tooltip = '';
    for (const entity of entities) {
      if (entity && entity.name) {
        tooltip = tooltip + this.translate.instant(entity.name) + `, `;
      }
    }
    return tooltip.substring(0, tooltip.length - 2);
  }
  renderTooltipClass(entities: any[]): string {
    let tooltip = '';
    for (const entity of entities) {
      if (entity && entity.class) {
        const type = _.uniqBy(entity.class, 'name');
        for (const entity1 of type) {
          if (entity1) {
            tooltip = tooltip + this.translate.instant(entity1.name) + `, `;
          }
        }
      }
    }
    return tooltip.substring(0, tooltip.length - 2);
  }
  // *************** End of Function to Generate tooltip data table

  // *************** Function to get Data class
  getListOfClass(titlepc, titlecr) {
    const dataCrExpected = [];
    const dataPcExpected = [];
    titlecr.forEach((element) => {
      const cr = {
        _id: element._id,
        name: element.short_name,
        class: element.classes
      };
      dataCrExpected.push(cr);
    });
    titlepc.forEach((element) => {
      const pc = {
        _id: element.rncp_title_id._id,
        name: element.rncp_title_id.short_name,
        class: element.rncp_title_id.classes
      };
      dataPcExpected.push(pc);
    });

    const result = _.concat(dataCrExpected, dataPcExpected);
    return _.uniqBy(result, 'name');
  }

  // *************** Function to reset table connected school
  resetFilters() {
    this.school_nameFilter.setValue('', { emitEvent: false });
    this.shortNameFilter.setValue('', { emitEvent: false });
    this.classesFilter.setValue('', { emitEvent: false });
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    this.filteredValues = {
      school_name: '',
      shortName: '',
      classes: '',
    };

    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.dataLoaded = false

    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    this.getDataConnect();
  }

  // *************** Function to open Connect mentor to school dialog
  connectMentor(schoolId, name) {
    this.subs.sink = this.dialog
      .open(ConnectMentorDialogComponent, {
        minWidth: '500px',
        width: '800px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          companyId: this.companyId,
          schoolId: schoolId,
          schoolName: name,
        },
      })
      .afterClosed()
      .subscribe((e) => {
        if (e) {
          this.getDataConnect();
        }
      });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
