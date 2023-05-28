import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { UntypedFormControl, Validators } from '@angular/forms';
import { QualityControlService } from 'app/service/quality-control/quality-control.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';

interface rncpTitle {
  id: string;
  text: string;
}

@Component({
  selector: 'ms-quality-control',
  templateUrl: './quality-control.component.html',
  styleUrls: ['./quality-control.component.scss'],
})
export class QualityControlComponent implements OnInit, OnDestroy {
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  dataSource = new MatTableDataSource([]);
  noData: any;
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
  displayedColumns: string[] = ['studentLastName', 'school', 'testMarks', 'QCMarks', 'difference'];
  filterColumns: string[] = ['nameFilter', 'schoolFilter', 'testCorrectionFilter', 'qualityControlFilter', 'differentFilter'];
  @ViewChild(MatPaginator, { static: false }) set paginator(content) {
    this.dataSource.paginator = content;
  }
  @ViewChild(MatSort, { static: false }) set sort(content) {
    this.dataSource.sort = content;
  }
  private subs = new SubSink();
  nameFilter = new UntypedFormControl('');
  schoolFilter = new UntypedFormControl('');
  testCorrectionFilter = new UntypedFormControl('');
  qualityControlFilter = new UntypedFormControl('');
  differentFilter = new UntypedFormControl('');
  filteredValues = {
    name: '',
    school: '',
    testMarks: '',
    QCMarks: '',
    difference: '',
  };

  constructor(
    private qualityControlService: QualityControlService,
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

    this.subs.sink = this.schoolFilter.valueChanges.subscribe(school => {
      this.filteredValues['school'] = school;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.dataSource.filterPredicate = this.customFilterPredicate();
    // this.getUrgentMail();
  }

  private _filteredRncpTitle(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.titles.filter(option => option.toLowerCase().includes(filterValue));
  }

  customFilterPredicate() {
    return function(data, filter: string): boolean {
      const searchString = JSON.parse(filter);
      const lastNameFound =
        data.studentLastName
          .toString()
          .trim()
          .toLowerCase()
          .indexOf(searchString.name.toLowerCase()) !== -1;
      const schoolFound =
        data.school
          .toString()
          .trim()
          .toLowerCase()
          .indexOf(searchString.school.toLowerCase()) !== -1;
      const testCorrectionFound =
        data.testMarks
          .toString()
          .trim()
          .toLowerCase()
          .indexOf(searchString.testMarks) !== -1;
      const qualityControlFound =
        data.QCMarks.toString()
          .trim()
          .toLowerCase()
          .indexOf(searchString.QCMarks) !== -1;
      const differentFound =
        data.difference
          .toString()
          .trim()
          .toLowerCase()
          .indexOf(searchString.difference) !== -1;

      return lastNameFound && schoolFound && testCorrectionFound && qualityControlFound && differentFound;
    };
  }

  OnSelectRNCPTitle(option) {
    this.classArray = [];
    this.classes = [];
    this.classe = new UntypedFormControl('', [Validators.required]);
    this.test = new UntypedFormControl('', [Validators.required]);
    this.tests = [];
    this.dataSource.data = [];
    this.noData = this.dataSource.connect().pipe(map(data => data.length === 0));

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
    this.noData = this.dataSource.connect().pipe(map(data => data.length === 0));
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
    this.subs.sink = this.qualityControlService.getQualityControl().subscribe((qualityControl: any[]) => {
      this.dataSource.data = qualityControl;
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator ? this.paginator : null;
      // this.paginator.length = 0;
      this.noData = this.dataSource.connect().pipe(map(data => data.length === 0));
    });
  }

  resetSelection() {
    this.filteredValues = {
      name: '',
      school: '',
      testMarks: '',
      QCMarks: '',
      difference: '',
    };

    this.dataSource.filter = JSON.stringify(this.filteredValues);

    this.nameFilter.setValue('');
    this.schoolFilter.setValue('');
    this.testCorrectionFilter.setValue('');
    this.qualityControlFilter.setValue('');
    this.differentFilter.setValue('');
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
