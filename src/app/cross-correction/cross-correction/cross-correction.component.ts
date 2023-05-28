import { Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { CrossCorrectionService } from '../../service/cross-correction/cross-correction.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { UntypedFormControl, Validators } from '@angular/forms';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';

interface rncpTitle {
  id: string;
  text: string;
}

@Component({
  selector: 'ms-cross-correction',
  templateUrl: './cross-correction.component.html',
  styleUrls: ['./cross-correction.component.scss'],
})
export class CrossCorrectionComponent implements OnInit, OnDestroy {
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  dataSource = new MatTableDataSource([]);
  noData: any;
  noData1: any;
  dataSource1 = new MatTableDataSource([]);
  rncpTitles: rncpTitle[] = [];
  titles: string[] = [];
  classArray = [];
  classes: string[] = [];
  tests = [];
  testArray = [{ name: 'Etude de marché - Ecrit', id: '1' }, { name: 'test Quality control 14 May', id: '2' }];
  filteredRncpTitle: Observable<string[]>;
  filteredClass: Observable<string[]>;
  filteredTest: Observable<string[]>;
  rncpTitle = new UntypedFormControl('', [Validators.required]);
  classe = new UntypedFormControl('', [Validators.required]);
  test = new UntypedFormControl('', [Validators.required]);
  displayedColumns: string[] = ['name', 'schoolOrigin', 'schoolCorrecting', 'crossCorrector'];
  filterColumns: string[] = ['nameFilter', 'schoolOriginFilter', 'schoolCorrectingFilter', 'crossCorrectorFilter'];
  displayedColumn1: string[] = ['shortName', 'students', 'correction', 'diff'];
  filterColumns1: string[] = ['shortNameFilter', 'studentsFilter', 'correctionFilter', 'diffFilter'];

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild('table2Sort', { static: true }) sort2: MatSort;
  @ViewChild('table1Sort', { static: true }) sort1: MatSort;
  private subs = new SubSink();
  schoolOriginArray: any[] = [];
  schoolCorrectingArray: any[] = [];
  filteredSchoolOrigin: Observable<string[]>;
  filteredSchoolCorrecting: Observable<string[]>;

  nameFilter = new UntypedFormControl('');
  schoolOriginFilter = new UntypedFormControl();
  schoolCorrectingFilter = new UntypedFormControl();
  crossCorrectorFilter = new UntypedFormControl('');
  shortNameFilter = new UntypedFormControl('');
  studentsFilter = new UntypedFormControl('');
  filteredValues = {
    name: '',
    schoolOrigin: '',
    schoolCorrecting: '',
    crossCorrector: '',
  };
  filteredValues1 = {
    shortName: '',
    students: '',
  };

  constructor(
    private crossCorectionService: CrossCorrectionService,
    private rncpTitleService: RNCPTitlesService,
    public dialog: MatDialog,
    private mailboxService: MailboxService,
    ) {}

  ngOnInit() {
    this.subs.sink = this.rncpTitleService.getShortRncpTitles().subscribe(data => {
      this.rncpTitles = data;
      this.rncpTitles.forEach(el => {
        if (this.titles.indexOf(el.text) === -1) {
          this.titles.push(el.text);
        }
      });
      this.filteredRncpTitle = this.rncpTitle.valueChanges.pipe(
        startWith(''),
        map(value => this._filteredRncpTitle(value)),
      );
    });

    this.subs.sink = this.nameFilter.valueChanges.subscribe(name => {
      this.filteredValues['name'] = name;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.schoolOriginFilter.valueChanges.subscribe(schoolOrigin => {
      this.filteredValues['schoolOrigin'] = schoolOrigin;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.schoolCorrectingFilter.valueChanges.subscribe(schoolCorrecting => {
      this.filteredValues['schoolCorrecting'] = schoolCorrecting;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.crossCorrectorFilter.valueChanges.subscribe(crossCorrector => {
      this.filteredValues['crossCorrector'] = crossCorrector;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.shortNameFilter.valueChanges.subscribe(shortName => {
      this.filteredValues1['shortName'] = shortName;
      this.dataSource1.filter = JSON.stringify(this.filteredValues1);
    });

    this.subs.sink = this.studentsFilter.valueChanges.subscribe(students => {
      this.filteredValues1['students'] = students;
      this.dataSource1.filter = JSON.stringify(this.filteredValues1);
    });

    this.dataSource.filterPredicate = this.customFilterPredicate();
    this.dataSource1.filterPredicate = this.customFilterPredicate1();
    // this.getUrgentMail();
  }
  private _filteredRncpTitle(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.titles.filter(option => option.toLowerCase().includes(filterValue));
  }

  private _filterSchoolOrigin(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.schoolOriginArray.filter(option => option.toLowerCase().includes(filterValue));
  }

  private _filterSchoolCorrecting(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.schoolCorrectingArray.filter(option => option.toLowerCase().includes(filterValue));
  }

  customFilterPredicate() {
    return function(data, filter: string): boolean {
      const searchString = JSON.parse(filter);
      const nameFound =
        data.name
          .toString()
          .trim()
          .toLowerCase()
          .indexOf(searchString.name.toLowerCase()) !== -1;

      const schoolOriginFound =
        data.schoolOrigin
          .toString()
          .trim()
          .toLowerCase()
          .indexOf(searchString.schoolOrigin.toLowerCase()) !== -1;

      const schoolCorrectingFound =
        data.schoolCorrecting
          .toString()
          .trim()
          .toLowerCase()
          .indexOf(searchString.schoolCorrecting.toLowerCase()) !== -1;

      const crossCorrectorFound =
        data.crossCorrecor
          .toString()
          .trim()
          .toLowerCase()
          .indexOf(searchString.crossCorrector.toLowerCase()) !== -1;

      return nameFound && schoolOriginFound && schoolCorrectingFound && crossCorrectorFound;
    };
  }

  customFilterPredicate1() {
    return function(data, filter: string): boolean {
      const searchString = JSON.parse(filter);
      const shortNameFound =
        data.shortName
          .toString()
          .trim()
          .toLowerCase()
          .indexOf(searchString.shortName.toLowerCase()) !== -1;

      const studentFound =
        data.students
          .toString()
          .trim()
          .indexOf(searchString.students) !== -1;

      return shortNameFound && studentFound;
    };
  }

  OnSelectRNCPTitle(option) {
    this.classArray = [];
    this.classes = [];
    this.classe = new UntypedFormControl('', [Validators.required]);
    this.test = new UntypedFormControl('', [Validators.required]);
    this.tests = [];
    this.dataSource.data = [];
    this.dataSource1.data = [];
    this.noData = this.dataSource.connect().pipe(map(data => data.length === 0));
    this.noData1 = this.dataSource1.connect().pipe(map(data => data.length === 0));

    this.subs.sink = this.rncpTitleService.getAcadClass().subscribe((data: any) => {
      this.classArray = data.data;
      this.classArray.forEach(el => {
        if (this.classes.indexOf(el.name) === -1) {
          this.classes.push(el.name);
        }
      });
      this.filteredClass = this.classe.valueChanges.pipe(
        startWith(''),
        map(value => this._filterClasses(value)),
      );
    });
  }
  private _filterClasses(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.classes.filter(option => option.toLowerCase().includes(filterValue));
  }

  OnSelectClass(option) {
    this.test = new UntypedFormControl('', [Validators.required]);
    this.tests = [];
    this.dataSource.data = [];
    this.dataSource1.data = [];
    this.noData = this.dataSource.connect().pipe(map(data => data.length === 0));
    this.noData1 = this.dataSource1.connect().pipe(map(data => data.length === 0));
    this.testArray.forEach(el => {
      if (this.tests.indexOf(el.name) === -1) {
        this.tests.push(el.name);
      }
    });
    this.filteredTest = this.test.valueChanges.pipe(
      startWith(''),
      map(value => this._filterTest(value)),
    );
  }
  private _filterTest(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.tests.filter(option => option.toLowerCase().includes(filterValue));
  }

  onSelectTest(option) {
    this.dataSource.data = [];
    this.dataSource1.data = [];
    this.subs.sink = this.crossCorectionService.getCrossCorrectionStudents().subscribe((students: any[]) => {
      this.dataSource.data = students;
      this.dataSource.sort = this.sort1;
      this.dataSource.paginator = this.paginator;
      this.noData = this.dataSource.connect().pipe(map(data => data.length === 0));

      this.dataSource.data.forEach(el => {
        if (this.schoolOriginArray.indexOf(el.schoolOrigin) === -1) {
          this.schoolOriginArray.push(el.schoolOrigin);
        }
      });

      this.dataSource.data.forEach(el => {
        if (this.schoolCorrectingArray.indexOf(el.schoolCorrecting) === -1) {
          this.schoolCorrectingArray.push(el.schoolCorrecting);
        }
      });

      this.filteredSchoolOrigin = this.schoolOriginFilter.valueChanges.pipe(
        startWith(''),
        map(value => this._filterSchoolOrigin(value)),
      );
      this.filteredSchoolCorrecting = this.schoolCorrectingFilter.valueChanges.pipe(
        startWith(''),
        map(value => this._filterSchoolCorrecting(value)),
      );
    });

    this.subs.sink = this.crossCorectionService.getCrossCorrectionSchools().subscribe((schools: any[]) => {
      this.dataSource1.data = schools;
      this.dataSource1.sort = this.sort2;
      this.dataSource1.paginator = this.paginator;
      this.noData1 = this.dataSource1.connect().pipe(map(data => data.length === 0));
    });
  }

  resetAllFilter() {
    this.filteredValues = {
      name: '',
      schoolOrigin: '',
      schoolCorrecting: '',
      crossCorrector: '',
    };
    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.nameFilter.setValue('');
    this.schoolOriginFilter.setValue('');
    this.schoolCorrectingFilter.setValue('');
    this.crossCorrectorFilter.setValue('');
  }

  resetAllFilter1() {
    this.filteredValues1 = {
      shortName: '',
      students: '',
    };
    this.dataSource1.filter = JSON.stringify(this.filteredValues1);
    this.shortNameFilter.setValue('');
    this.studentsFilter.setValue('');
  }

  sorting(event) {
    if (event.active === 'name') {
      const sortBy = 'name';
      const sortMode = event.direction;
      this.dataSource.data = _.orderBy(this.dataSource.data, [sortBy], [sortMode]);
    }

    if (event.active === 'schoolOrigin') {
      const sortBy = 'schoolOrigin';
      const sortMode = event.direction;
      this.dataSource.data = _.orderBy(this.dataSource.data, [sortBy], [sortMode]);
    }

    if (event.active === 'schoolCorrecting') {
      const sortBy = 'schoolCorrecting';
      const sortMode = event.direction;
      this.dataSource.data = _.orderBy(this.dataSource.data, [sortBy], [sortMode]);
    }

    if (event.active === 'crossCorrector') {
      const sortBy = 'crossCorrecor';
      const sortMode = event.direction;
      this.dataSource.data = _.orderBy(this.dataSource.data, [sortBy], [sortMode]);
    }
  }

  sortingTable1(event) {
    if (event.active === 'shortName') {
      const sortBy = 'shortName';
      const sortMode = event.direction;
      this.dataSource1.data = _.orderBy(this.dataSource1.data, [sortBy], [sortMode]);
    }

    if (event.active === 'students') {
      const sortBy = 'students';
      const sortMode = event.direction;
      this.dataSource1.data = _.orderBy(this.dataSource1.data, [sortBy], [sortMode]);
    }

    if (event.active === 'correction') {
      const sortBy = 'correction';
      const sortMode = event.direction;
      this.dataSource1.data = _.orderBy(this.dataSource1.data, [sortBy], [sortMode]);
    }

    if (event.active === 'diff') {
      const sortBy = 'diff';
      const sortMode = event.direction;
      this.dataSource1.data = _.orderBy(this.dataSource1.data, [sortBy], [sortMode]);
    }
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

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
