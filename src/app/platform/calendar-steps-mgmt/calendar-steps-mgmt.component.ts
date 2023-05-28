import { Observable } from 'rxjs';
import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PlatformService } from '../../service/platform/platform.service';
import { SubSink } from 'subsink';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { AddCalendarStepsDialogComponent } from '../add-calendar-steps-dialog/add-calendar-steps-dialog.component';
import { UntypedFormControl } from '@angular/forms';
import * as moment from 'moment';
import * as _ from 'lodash';
import { startWith, map } from 'rxjs/operators';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
export class CalenderStep {
  constructor() {}
}
@Component({
  selector: 'ms-calendar-steps-mgmt',
  templateUrl: './calendar-steps-mgmt.component.html',
  styleUrls: ['./calendar-steps-mgmt.component.scss'],
})
export class CalendarStepsMgmtComponent implements OnInit, OnDestroy {
  calendarStepDialogComponent: MatDialogRef<AddCalendarStepsDialogComponent>;
  config: MatDialogConfig = {
    disableClose: true,
    width: '600px',
  };
  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['what', 'who', 'before', 'after', 'numberdays', 'action'];
  filterColumns: string[] = ['whatFilter', 'whoFilter', 'beforeFilter', 'afterFilter', 'numberdaysFilter', 'actionFilter'];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  private subs = new SubSink();

  whatFilter = new UntypedFormControl('');
  whoFilter = new UntypedFormControl('');
  whoFilterList = ['Academic Director'];
  filteredWho: Observable<string[]>;
  beforeFilter = new UntypedFormControl('');
  afterFilter = new UntypedFormControl('');
  numberFilter = new UntypedFormControl('');
  noData: any;
  filteredValues = {
    what: '',
    who: '',
    before: '',
    after: '',
    numberOfDays: '',
  };

  constructor(
    private platformService: PlatformService,
    public dialog: MatDialog,
    private dateAdapter: DateAdapter<Date>,
    public translate: TranslateService,
    ) {}

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.dataSource.sort = this.sort;
    this.dataSource.paginator = this.paginator;
    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.dataSource.filterPredicate = this.customFilterPredicate();

    this.subs.sink = this.platformService.getCalendarSteps().subscribe((calendarSteps: any[]) => {
      this.dataSource.data = calendarSteps;
      this.noData = this.dataSource.connect().pipe(map(dataa => dataa.length === 0));
    });
    this.subs.sink = this.whatFilter.valueChanges.subscribe(what => {
      this.filteredValues['what'] = what;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.whoFilter.valueChanges.subscribe(who => {
      this.filteredValues['who'] = who;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.filteredWho = this.whoFilter.valueChanges.pipe(
      startWith(''),
      map(value => this.whoFilterList.filter(option => option.toLowerCase().includes(value.toLowerCase()))),
    );

    this.subs.sink = this.beforeFilter.valueChanges.subscribe(before => {
      const newDate = moment(before).format('YYYY-MM-DD');
      this.filteredValues['before'] = newDate !== 'Invalid date' ? newDate : '';
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.afterFilter.valueChanges.subscribe(date => {
      const newDate = moment(date).format('YYYY-MM-DD');
      this.filteredValues['after'] = newDate !== 'Invalid date' ? newDate : '';
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.numberFilter.valueChanges.subscribe(number => {
      this.filteredValues['numberOfDays'] = number;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
  }

  customFilterPredicate() {
    return function(data, filter: string): boolean {
      const searchString = JSON.parse(filter);
      const whatFound = data.what
        ? data.what
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.what.toLowerCase()) !== -1
        : true;

      const whoFound = searchString.who
        ? data.who &&
          data.who
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.who.toLowerCase()) !== -1
        : true;

      const beforeFound = data.before
        ? moment(data.before)
            .format('YYYY-MM-DD')
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.before.toLowerCase()) !== -1
        : true;

      const afterFound = data.after
        ? moment(data.after)
            .format('YYYY-MM-DD')
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.after.toLowerCase()) !== -1
        : true;

      const numberFound = data.numberdays ? data.numberdays.indexOf(searchString.numberOfDays) !== -1 : true;

      return whatFound && whoFound && beforeFound && afterFound && numberFound;
    };
  }

  resetFilter() {
    this.numberFilter.setValue('');
    this.afterFilter.setValue('');
    this.beforeFilter.setValue('');
    this.whatFilter.setValue('');
    this.whoFilter.setValue('');

    this.filteredValues = {
      numberOfDays: '',
      before: '',
      after: '',
      what: '',
      who: '',
    };
    this.dataSource.filter = JSON.stringify(this.filteredValues);
  }

  sortingFilter(event) {}

  addNewCalender() {
    this.calendarStepDialogComponent = this.dialog.open(AddCalendarStepsDialogComponent, this.config);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
