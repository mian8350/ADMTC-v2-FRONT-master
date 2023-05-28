import { AfterViewInit, OnDestroy, ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TestStatusService } from 'app/service/test-status/test-status.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { UntypedFormControl } from '@angular/forms';
import { map, startWith, tap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { PageTitleService } from 'app/core/page-title/page-title.service';

@Component({
  selector: 'ms-test-status-table',
  templateUrl: './test-status-table.component.html',
  styleUrls: ['./test-status-table.component.scss'],
})
export class TestStatusTableComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  private subs = new SubSink();

  dataSource = new MatTableDataSource([]);

  selectedRncpTitleId: string;
  selectedClassId: string;
  isWaitingForResponse = false;
  currentUser;

  titleCtrl = new UntypedFormControl(null);
  rncpTitles: any[] = [];
  filteredTitle: Observable<any[]>;

  classCtrl = new UntypedFormControl(null);
  classes: any[] = [];
  filteredClass: Observable<any[]>;

  schoolCtrl = new UntypedFormControl(null);
  schools: any[] = [];
  filteredSchool: Observable<any[]>;

  filteredValues = {
    school_id: null,
  };
  sortValue = null;

  displayedColumns: string[] = ['school'];
  filterColumns: string[] = ['schoolFilter'];
  schoolCount = 0;
  noData: any;
  tableWidth: string;

  schoolFilter = new UntypedFormControl('');

  schoolList = [];
  testsList = [];
  testColumns;

  isSchoolDataRequested = false;

  constructor(
    private testStatusService: TestStatusService,
    private pageTitleService: PageTitleService,
    private translate: TranslateService
    ) {}

  ngOnInit() {
    this.getRncpTitles();
    this.pageTitleService.setTitle(this.translate.instant('Test Status'));
    this.pageTitleService.setIcon('bullseye-arrow');
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.pageTitleService.setTitle(this.translate.instant('Test Status'));
    });
  }

  ngAfterViewInit() {
    if (this.paginator) {
      this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          this.getSchoolTabelData();
        }),
      )
      .subscribe();
    }
  }

  getRncpTitles() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.testStatusService.getRncpTitlesDropdownForTestStatus().subscribe(
      (resp) => {

        this.isWaitingForResponse = false;
        const allowedYear = ['2021', '2022', '2023', '2024', '2025']
        const filteredTitlesByYear = resp.filter((title) => title && title.year_of_certification && allowedYear.some(year => title.year_of_certification.includes(year)));
        this.rncpTitles = filteredTitlesByYear;
        // this.filteredTitle = of(this.rncpTitles)
        this.filteredTitle = this.titleCtrl.valueChanges.pipe(
          startWith(''),
          map((searchTxt) => {
            searchTxt = searchTxt ? searchTxt : '';
            return this.rncpTitles.filter((sch) => sch.short_name.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()));
          }),
        );
      },
      (err) => {
        this.swalError(err);
      },
    );
  }

  getClasses() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.testStatusService.getClassForTestStatus(this.selectedRncpTitleId).subscribe(
      (resp) => {

        this.isWaitingForResponse = false;
        this.classes = resp;
        // this.filteredClass = of(this.classes)
        this.filteredClass = this.classCtrl.valueChanges.pipe(
          startWith(''),
          map((searchTxt) => {
            searchTxt = searchTxt ? searchTxt : '';
            return this.classes.filter((cls) => cls.name.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()));
          }),
        );

        if (resp && resp.length === 1) {
          this.classCtrl.patchValue(this.classes[0].name, {emitEvent: false});
          this.selectClass(this.classes[0]._id);
        }
      },
      (err) => {
        this.swalError(err);
      },
    );
  }

  selectTitle(titleId) {
    this.selectedRncpTitleId = titleId;
    this.selectedClassId = null;
    this.classCtrl.patchValue(null, {emitEvent: false});
    if (this.selectedRncpTitleId !== '0') {
      this.getClasses();
    } else {
      this.selectedRncpTitleId = null;
    }
  }

  selectClass(classId) {
    this.selectedClassId = classId;
    if (this.selectedClassId !== '0') {
      this.resetFilter();
      this.getSchoolTabelData();
      this.getDropdownSchool();
    } else {
      this.selectedClassId = null;
    }
  }

  getDropdownSchool() {
    this.subs.sink = this.testStatusService.getSchoolTestStatusDropdown(this.selectedRncpTitleId, this.selectedClassId).subscribe(
      (resp) => {

        this.schools = resp;
        // this.filteredClass = of(this.classes)
        this.filteredSchool = this.schoolCtrl.valueChanges.pipe(
          startWith(''),
          map((searchTxt) => {
            searchTxt = searchTxt ? searchTxt : '';
            return this.schools.filter((sch) => sch.short_name.toLowerCase().trim().includes(searchTxt.toLowerCase().trim()));
          }),
        );
      },
      (err) => {
        this.swalError(err);
      },
    );
  }

  getSchoolTabelData() {
    // this.isSchoolDataRequested = false;
    if (this.selectedRncpTitleId && this.selectedClassId) {
      this.isWaitingForResponse = true;
      const pagination = {
        limit: this.paginator && this.paginator.pageSize ? this.paginator.pageSize : 10,
        page: this.paginator && this.paginator.pageIndex ? this.paginator.pageIndex : 0,
      };

      this.subs.sink = this.testStatusService.getSchoolTestStatus(this.selectedRncpTitleId, this.selectedClassId, pagination, this.sortValue, this.filteredValues).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          this.resetColumnDefault();
          if (resp && resp.length) {
            this.schoolList = _.cloneDeep(resp);
            this.testsList = [];
            if (this.schoolList && this.schoolList[0] && this.schoolList[0].test_correction_statuses) {
              this.testsList = this.schoolList[0].test_correction_statuses;
            }



            this.testColumns = [];

            for (let i = 0; i <= this.testsList.length - 1; i++) {
              this.testColumns.push({
                _id : (i + 1).toString(),
                test_name: this.testsList[i] && this.testsList[i].test_id ? this.testsList[i].test_id.name : ''
              });
              this.displayedColumns.push((i + 1).toString());
              this.filterColumns.push((i + 1).toString() + 'filter');
            }
            this.tableWidth = this.getTableWidth();




            this.dataSource.data = _.cloneDeep(resp);
            this.schoolCount = resp && resp.length ? resp[0].count_document : 0;
            this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
            this.isSchoolDataRequested = true;
          } else {
            this.testColumns = [];
            this.testsList = [];
            this.tableWidth = this.getTableWidth();
            this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
            this.isSchoolDataRequested = true;
          }
        },
        (err) => {
          this.resetColumnDefault();
          this.swalError(err);
        },
      );
    }
  }

  filterSchool(schoolId) {
    this.filteredValues.school_id = schoolId;
    this.paginator.pageIndex = 0
    this.getSchoolTabelData();
  }

  getTableWidth() {
    // all of number in static column width you can find in scss file that has selector .mat-column-blablabla
    const staticColumnWidth = 250;

    // calculate dynamic column width, "60" is width in px of column U1, U2, etc. so it represent 60px of width.
    const dynamicColumnWidth = 60 * this.testsList.length;

    // then combine static column with dynamic column so we get overall table width.
    const totalWidthInPx = (staticColumnWidth + dynamicColumnWidth).toString() + 'px';
    return totalWidthInPx;
  }

  sortData(sort: Sort) {
    this.sortValue = sort.active && sort.direction ? { [sort.active]: sort.direction } : null;
    this.paginator.pageIndex = 0;
    this.getSchoolTabelData();
  }

  resetColumnDefault() {
    this.displayedColumns = ['school'];
    this.filterColumns = ['schoolFilter'];
  }

  resetFilter() {
    this.paginator.pageIndex = 0;
    this.filteredValues = {
      school_id: null
    };
    this.schoolCtrl.setValue('', {emitEvent: false});
    this.sortValue = null;
    this.getSchoolTabelData();
  }

  swalError(err) {
    this.isWaitingForResponse = false;

    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: 'OK',
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.pageTitleService.setTitle('');
    this.pageTitleService.setIcon('');
  }
}
