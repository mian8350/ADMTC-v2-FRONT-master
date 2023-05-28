import { Component, ViewChild, OnInit, OnDestroy, OnChanges, Input, AfterViewInit } from '@angular/core';
import { RNCPTitlesService } from '../../../service/rncpTitles/rncp-titles.service';
import { SubSink } from 'subsink';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { DateAdapter } from '@angular/material/core';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AddCalendarEventDialogComponent } from '../add-calendar-event-dialog/add-calendar-event-dialog.component';
import swal from 'sweetalert2';
import { FormControl, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import * as moment from 'moment';
import { Observable } from 'rxjs';
import { map, startWith, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { AcademicKitService } from '../../../service/rncpTitles/academickit.service';
import { isNumber } from 'util';
import * as _ from 'lodash';
import { ActivatedRoute } from '@angular/router';
import { NgxPermissionsService } from 'ngx-permissions';
import { PermissionService } from 'app/service/permission/permission.service';
import { UtilityService } from 'app/service/utility/utility.service';

@Component({
  selector: 'ms-calendar',
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss'],
})
export class CalendarComponent implements OnInit, OnDestroy {
  @Input() rncpTitle: any;
  noData: any;
  private subs = new SubSink();
  calendarDialogComponent: MatDialogRef<AddCalendarEventDialogComponent>;

  displayedColumns: string[] = ['from_date', 'to_date', 'name', 'school'];
  filterColumns: string[] = ['fromDateFilter', 'toDateFilter', 'nameFilter', 'schoolFilter'];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource = new MatTableDataSource([]);
  filteredSchools: Observable<string[]>;
  schoolsArray: any[] = [];
  schools: Observable<any[]>;
  schoolsL = [];
  // classesL = [];
  // classes: Observable<any[]>;
  eventDropdownList = [];

  filterGroup: UntypedFormGroup;
  // fromDateFilter = new FormControl('');
  // toDateFilter = new FormControl('');
  // nameFilter = new FormControl('');
  // classFilter = new FormControl('');
  // schoolFilter = new FormControl('');

  filteredValues = {
    from_date: '',
    to_date: '',
    name: '',
    class_name: '',
    school_name: '',
  };

  backupFilteredValues = {
    from_date: '',
    to_date: '',
    name: '',
    class_name: '',
    school_name: '',
  };

  pagination = {
    limit: 10,
    page: 0,
  };

  sorting: any = {
    from_date: 'desc',
    to_date: null,
    name: null,
  };

  isWaitingForResponse = false;
  isUserAcadir = false;
  isUserADMTCdir = false;
  isUserADMTCAdmin = false;
  timeOutVar;

  schoolId;
  selectedClass: any;

  constructor(
    private rncpTitlesService: RNCPTitlesService,
    public dialog: MatDialog,
    public translate: TranslateService,
    private acadservice: AcademicKitService,
    private fb: UntypedFormBuilder,
    private route: ActivatedRoute,
    private permissions: NgxPermissionsService,
    public permissionService: PermissionService,
    private utilService: UtilityService,
    private dateAdapter: DateAdapter<Date>,
  ) {}

  // ngAfterViewInit() {
  //   this.dataSource.sort = this.sort;
  // }

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.isUserAcadir = !!this.permissions.getPermission('Academic Director');
    this.isUserADMTCdir = !!this.permissions.getPermission('ADMTC Director');
    this.isUserADMTCAdmin = !!this.permissions.getPermission('ADMTC Admin');
    if (this.isUserADMTCdir || this.isUserADMTCAdmin) {
      this.displayedColumns.push('action');
      this.filterColumns.push('actionFilter');
    }
    // Check if there is school id in query param, if true will get pending task for this school only
    if (this.route.snapshot.queryParamMap.get('schoolId')) {
      this.schoolId = this.route.snapshot.queryParamMap.get('schoolId');
    }

    // const testDate = new TruncatePipe();
    // const realDate = testDate.formatDate("20191018");

    this.initSelectedClassListener();
    this.initFormFilter();
    // this.getEventData();
    this.setFilterAndSort();
    // this.getClassDropdownList();
    // this.getSchoolDropdownList();
    // this.rncpTitle = this.rncpTitlesService.getSelectedRncpTitle();
  }

  initFormFilter() {
    this.filterGroup = this.fb.group({
      fromDateFilter: [],
      toDateFilter: [],
      nameFilter: [],
      // classFilter: [],
      schoolFilter: [],
    });
  }

  initSelectedClassListener() {
    this.acadservice.selectedClass$.subscribe(classObj => {
      if (classObj) {

        this.selectedClass = classObj;
        this.filteredValues.class_name = classObj.name;
        this.getEventData();
        this.getSchoolDropdownList();
      }
    })
  }

  getEventData() {
    if(!this.selectedClass || !this.selectedClass._id) {
      return;
    }
    this.isWaitingForResponse = true;
    this.backupFilteredValues = this.filteredValues;

    const payloadFilter: any = this.filteredValues;
    // if coming from school as chief group academic, then only filter by schoolID
    if (this.schoolId && this.utilService.isChiefGroupAcademic()) {
      payloadFilter.school_id = this.schoolId;
    }


    this.subs.sink = this.acadservice
      .getAllEventWithParam(this.pagination, payloadFilter, this.sorting, this.rncpTitle._id, this.selectedClass._id)
      .subscribe((response) => {
        const tempArray = [];
        let totalDoc = 0;
        const data = _.cloneDeep(response);

        data.forEach((element) => {
          if (element && element.count_document) {
            totalDoc = element.count_document;
          }

          if (element && element.from_date) {
            const newDate = moment(element.from_date).format('YYYYMMDD');
            element.from_date = this.transform(newDate);
            element.from_date = this.translateDate(newDate);
          }
          if (element && element.to_date) {
            const newDate = moment(element.to_date).format('YYYYMMDD');
            element.to_date = this.transform(newDate);
            element.to_date = this.translateDate(newDate);
          }
          if (element && element.user_types && element.user_types.length) {
            const temp = [];
            element.user_types.forEach((user) => {
              if (user && user._id) {
                temp.push(user._id);
              }
            });
            element.user_types = temp;
          }
        });
        this.isWaitingForResponse = false;
        this.dataSource.data = data;
        this.paginator.pageIndex = this.pagination.page;
        this.paginator.length = totalDoc;
        this.noData = this.dataSource.connect().pipe(map((dataa) => dataa.length === 0));
      });
  }

  getEventDropdown(name) {
    const tempFilter = _.cloneDeep(this.filteredValues);
    tempFilter['name'] = name;
    this.subs.sink = this.acadservice.getAllEventDropdown(tempFilter, this.rncpTitle._id).subscribe((response) => {
      this.eventDropdownList = _.cloneDeep(response);
    });
  }

  changePage(event: PageEvent) {

    this.pagination.page = event.pageIndex;
    this.getEventData();
  }

  changeSort(event: Sort) {

    if (event) {
      if (event.active === 'from_date') {
        this.sorting = event.direction ? {from_date: event.direction}: null;
      } else if (event.active === 'to_date') {
        this.sorting = event.direction ? {to_date: event.direction}: null;
      } else if(event.active === 'name') {
        this.sorting = event.direction ? {name: event.direction}: null;
      }

      this.getEventData();
    }
  }

  setFilterAndSort() {
    // this.filteredSchools = this.schoolFilter.valueChanges.pipe(
    //   startWith(''),
    //   map((value) => this._filterSchool(value)),
    // );

    this.subs.sink = this.filterGroup
      .get('fromDateFilter')
      .valueChanges.pipe(debounceTime(800))
      .subscribe((from_date) => {
        this.filteredValues['from_date'] = from_date;
        this.getEventData();
      });

    this.subs.sink = this.filterGroup
      .get('toDateFilter')
      .valueChanges.pipe(debounceTime(800))
      .subscribe((to_date) => {
        this.filteredValues['to_date'] = to_date;
        this.getEventData();
      });

    this.subs.sink = this.filterGroup
      .get('nameFilter')
      .valueChanges.pipe(debounceTime(800))
      .subscribe((name) => {
        this.filteredValues['name'] = name;
        this.getEventData();
      });

    // this.subs.sink = this.filterGroup
    //   .get('classFilter')
    //   .valueChanges.pipe(debounceTime(800))
    //   .subscribe((className) => {
    //     if (className.length === 0 || className.length >= 3) {
    //       this.filteredValues['class_name'] = className;
    //     }
    //   });

    this.subs.sink = this.filterGroup
      .get('schoolFilter')
      .valueChanges.pipe(debounceTime(800))
      .subscribe((school) => {
        if (school.length === 0 || school.length >= 3) {
          this.filteredValues['school_name'] = school;
        }
      });

    // this.subs.sink = this.filterGroup.valueChanges
    //   .pipe(debounceTime(800))
    //   .pipe(distinctUntilChanged((a, b) => _.isEqual(a, b)))
    //   .subscribe(() => {
    //     if (JSON.stringify(this.filteredValues) !== JSON.stringify(this.backupFilteredValues)) {

    //       this.pagination.page = 0;
    //       this.getEventData();
    //     }
    //   });
  }

  private _filterSchool(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.schoolsArray.filter((option) => option.toLowerCase().includes(filterValue));
  }

  processData(rawValue) {
    const data = {
      _id: rawValue._id,
      from_date: this.translateDate(rawValue.from_date),
      to_date: this.translateDate(rawValue.to_date),
      name: rawValue.name,
      schools: rawValue.schools,
    };
    return data;
  }

  translateDate(date) {
    let value = date;
    if (isNumber(date)) {
      value = date.toString();
    }
    if (value.length === 8 && !value.includes('-')) {
      const year: number = +value.substring(0, 4);
      const month: number = +value.substring(4, 6);
      const day: number = +value.substring(6, 8);
      return [year, month, day].join('-');
    }
  }

  transform(time: string, args?: any): string {
    if (time) {
      const localTime = moment(time, 'YYYYMMDD').subtract(-moment().utcOffset(), 'm').format('YYYYMMDD');
      return localTime;
    }
    return '';
  }

  delete(data) {
    let timeDisabled = 5;
    swal
      .fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('DASHBOARD_DELETE.deletedMessage'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          swal.disableConfirmButton();
          const confirmBtnRef = swal.getConfirmButton();
          const time = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);
          this.timeOutVar = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
            swal.enableConfirmButton();
            clearInterval(time);
            clearTimeout(this.timeOutVar);
          }, timeDisabled * 1000);
        },
      })
      .then((result) => {
        clearTimeout(this.timeOutVar);
        if (result.value) {
          this.subs.sink = this.acadservice.deleteEvent(data).subscribe((resp) => {

            this.dataSource.data = this.dataSource.data.filter((element) => element._id !== data);
          });
          swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('EVENT_S1.TEXT'),
            footer: `<span style=""margin-left: auto"">EVENT_S1</span>`,
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
            allowOutsideClick: false,
          });
        }
      });
  }

  resetAllFilter() {
    this.filteredValues = {
      from_date: '',
      to_date: '',
      name: '',
      class_name: this.selectedClass && this.selectedClass.name ? this.selectedClass.name : '',
      school_name: '',
    };

    this.eventDropdownList = [];

    this.filterGroup.get('fromDateFilter').setValue('', { emitEvent: false });
    this.filterGroup.get('toDateFilter').setValue('', { emitEvent: false });
    this.filterGroup.get('nameFilter').setValue('', { emitEvent: false });
    this.filterGroup.get('schoolFilter').setValue('', { emitEvent: false });
    // this.filterGroup.get('classFilter').setValue('', { emitEvent: false });

    this.pagination.page = 0;
    this.sort.sort({ id: '', start: 'asc', disableClear: false });
    // this.sort.direction = 'desc';
    // this.sort.active = 'from_date';
    // this.sorting.from_date = 'desc';
    // this.sorting.to_date = null;
    // this.sorting.name = null;

    // this.getClassDropdownList();    
    this.getSchoolDropdownList();
    this.getEventData();
  }

  getSchoolDropdownList() {
    this.subs.sink = this.acadservice.getSchoolDropDownListByClass(this.rncpTitle._id, this.selectedClass._id).subscribe((schol) => {
      let tempSchool = _.cloneDeep(schol);

      // *************** Filter school based on school assigned to user if user is acad dir or acad admin
      if (this.utilService.isUserAcadDirAdmin()) {
        const school = this.utilService.getUserAllSchoolAcadDirAdmin();
        tempSchool = tempSchool.filter((schoolData) => school.includes(schoolData._id));
      }

      // *************** Filter school based on school id if user is chief group
      if (this.utilService.isChiefGroupAcademic()) {
        tempSchool = tempSchool.filter((schoolData) => this.schoolId === schoolData._id);
      }

      this.schoolsL = tempSchool;
      this.schools = this.filterGroup.get('schoolFilter').valueChanges.pipe(
        startWith(''),
        map((searchTxt) => this.schoolsL.filter((option) => option.short_name.toLowerCase().includes(searchTxt.toLowerCase()))),
      );
    });
  }

  // getClassDropdownList() {
  //   this.subs.sink = this.acadservice.getClassDropDownList(this.rncpTitle._id).subscribe((classData) => {
  //     this.classesL = _.cloneDeep(classData);
  //     this.classes = this.filterGroup.get('classFilter').valueChanges.pipe(
  //       startWith(''),
  //       map((searchTxt) => this.classesL.filter((option) => option.name.toLowerCase().includes(searchTxt.toLowerCase()))),
  //     );
  //   });
  // }

  setSchoolFilter(schoolName: string) {
    this.filteredValues['school_name'] = schoolName;
    this.getEventData();
  }

  // setNameFilter(eventName: string) {
  //   this.filteredValues['name'] = eventName;
  //   this.getEventData();
  // }

  // setClassFilter(className: string) {
  //   this.filteredValues['class_name'] = className;
  //   this.getEventData();
  // }

  addEvent() {
    this.subs.sink = this.dialog
      .open(AddCalendarEventDialogComponent, {
        disableClose: true,
        width: '450px',
        data: {
          rncpId: this.rncpTitle._id,
          classId: this.selectedClass._id,
          type: 'add',
        },
        panelClass: 'certification-rule-pop-up',
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {


          this.getEventData();
        }
      });
  }

  calenderEdit(data) {

    this.subs.sink = this.dialog
      .open(AddCalendarEventDialogComponent, {
        disableClose: true,
        width: '450px',
        data: {
          rncpId: this.rncpTitle._id,
          classId: this.selectedClass._id,
          data: _.cloneDeep(data),
          type: 'edit',
        },
        panelClass: 'certification-rule-pop-up',
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {

          this.getEventData();
        }
      });
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVar);
    this.subs.unsubscribe();
  }

  /*
   * Render tooltip for column School
   * */
  renderTooltipSchool(entities) {
    let tooltip = '';
    let count = 0;
    const type = _.uniqBy(entities, 'short_name');
    for (const entity of type) {
      count++;
      if (count > 1) {
        if (entity) {
          tooltip = tooltip + ', ';
          tooltip = tooltip + this.translate.instant(entity.short_name);
        }
      } else {
        if (entity) {
          tooltip = tooltip + this.translate.instant(entity.short_name);
        }
      }
    }
    return tooltip;
  }
  /*
   * Render tooltip for column School
   * */
  renderTooltipAllSchool() {
    let tooltip = '';
    let count = 0;
    const type = this.schoolsL;
    for (const entity of type) {
      count++;
      if (count > 1) {
        if (entity) {
          tooltip = tooltip + ', ';
          tooltip = tooltip + this.translate.instant(entity.short_name);
        }
      } else {
        if (entity) {
          tooltip = tooltip + this.translate.instant(entity.short_name);
        }
      }
    }
    return tooltip;
  }

  /*
   * Render tooltip for column type
   * */
  renderTooltipClass(classes) {
    let tooltip = '';
    let count = 0;
    const type = _.uniqBy(classes, 'name');
    for (const classData of type) {
      count++;
      if (count > 1) {
        if (classData) {
          tooltip = tooltip + ', ';
          tooltip = tooltip + this.translate.instant(classData.name);
        }
      } else {
        if (classData) {
          tooltip = tooltip + this.translate.instant(classData.name);
        }
      }
    }
    return tooltip;
  }
}
