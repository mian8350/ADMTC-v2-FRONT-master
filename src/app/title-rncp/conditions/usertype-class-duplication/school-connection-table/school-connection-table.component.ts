import { map } from 'rxjs/operators';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { UntypedFormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Component, OnInit, ViewChild, Input, AfterViewInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-school-connection-table',
  templateUrl: './school-connection-table.component.html',
  styleUrls: ['./school-connection-table.component.scss'],
})
export class SchoolConnectionTableComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() currentClassId;
  @Output() isRefresh = new EventEmitter<Boolean>();
  @Output() triggerSpinner = new EventEmitter<Boolean>();
  originClassId;
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['school', 'class'];
  filterColumns: string[] = ['schoolFilter', 'classFilter'];
  schoolFilter = new UntypedFormControl('');
  currentClass = null;
  originData;
  isWaitingForResponse: boolean = false;
  noData: any;
  isDisable: boolean = false;
  private timeOutVal: any;

  private subs = new SubSink();
  constructor(private rncpTitleService: RNCPTitlesService, private translate: TranslateService) {}

  ngOnInit() {
    this.getOriginClass();
    this.initFilter();
  }
  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }
  initFilter() {
    this.subs.sink = this.schoolFilter.valueChanges.subscribe((school) => {
      this.dataSource.filter = JSON.stringify(school);
    });
    this.dataSource.filterPredicate = this.customFilterPredicate();

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'school':
          return item.school_id ? item.school_id.short_name : null;
        default:
          return item[property];
      }
    };

    this.dataSource.sort = this.sort;
  }
  customFilterPredicate() {
    return (data, filter: string) => {
      const searchString = JSON.parse(filter);
      const schoolFound = searchString
        ? data.school_id
          ? data.school_id.short_name.toLowerCase().trim().includes(searchString.toLowerCase().trim())
          : false
        : true;
      return schoolFound;
    };
  }
  getOriginClass() {
    this.isDisable = false;
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.getClassById(this.currentClassId).subscribe((resp) => {
      if (resp) {
        this.isWaitingForResponse = false;
        this.originClassId = resp.origin_class ? resp.origin_class._id : null;
        this.currentClass = resp.name;
        if (resp.class_duplication_status === 'school_connected' || resp.class_duplication_status == 'usertype_duplicated') {
          this.isDisable = true;
        }
        this.getAllSchoolConnectWithClass();
      }
    });
  }

  getAllSchoolConnectWithClass() {
    this.isWaitingForResponse = true;
    // this.originClassId = '5cde77a55bdb94110a93e696'
    this.subs.sink = this.rncpTitleService.getAllSchoolConnectWithClass(this.originClassId, this.currentClassId).subscribe((resp) => {
      if (resp) {
        this.originData = _.cloneDeep(resp);
        if (!this.isDisable) {
          this.dataSource.data = this.originData
            .map((el) => {
              return {
                school_id: {
                  _id: el.school_id._id,
                  short_name: el.school_id.short_name,
                },
                connect_to_class: true,
              };
            })
            .sort((a, b) =>
              a.school_id.short_name.toLowerCase() > b.school_id.short_name.toLowerCase()
                ? 1
                : a.school_id.short_name.toLowerCase() < b.school_id.short_name.toLowerCase()
                ? -1
                : 0,
            );
        } else {
          this.dataSource.data = this.originData.sort((a, b) =>
            a.school_id.short_name.toLowerCase() > b.school_id.short_name.toLowerCase()
              ? 1
              : a.school_id.short_name.toLowerCase() < b.school_id.short_name.toLowerCase()
              ? -1
              : 0,
          );
        }
      } else {
        this.dataSource.data = [];
        this.paginator.length = 0;
      }
      this.isWaitingForResponse = false;
      this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
    });
  }

  reset() {
    this.paginator.pageIndex = 0;
    this.schoolFilter.setValue(null, { emitEvent: false });
    this.dataSource.filter = JSON.stringify(this.schoolFilter.value);
    this.getAllSchoolConnectWithClass();
  }

  assignClassToSchool() {

    const schools = _.cloneDeep(this.dataSource.data);
    schools.forEach((data) => {
      if (data.school_id) {
        data.school_id = data.school_id._id;
      }
    });
    const schoolSelected = schools.filter((school) => school.connect_to_class === true);


    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('Duplicate_School.TITLE'),
      html: this.translate.instant('Duplicate_School.TEXT', { school_selected: schoolSelected.length }),
      footer: `<span style="margin-left: auto">Duplicate_School</span>`,
      type: 'warning',
      showCancelButton: true,
      confirmButtonText: this.translate.instant('Duplicate_School.BUTTON_1', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('Duplicate_School.BUTTON_2'),
      allowEscapeKey: false,
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('Duplicate_School.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('Duplicate_School.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      clearTimeout(this.timeOutVal);
      if (res.value) {
        this.triggerSpinner.emit(true);
        this.subs.sink = this.rncpTitleService.connectMultipleSchoolToClass(this.currentClassId, schools).subscribe(
          (resp) => {
            if (resp) {
              this.triggerSpinner.emit(false);

              this.isRefresh.emit(true);
              Swal.fire({
                type: 'success',
                title: this.translate.instant('Bravo'),
                confirmButtonText: this.translate.instant('OK'),
              }).then(() => {
                this.getOriginClass();
              });
            } else {
              this.triggerSpinner.emit(false);
            }
          },
          (err) => {
            this.triggerSpinner.emit(false);
          },
        );
      }
    });
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
