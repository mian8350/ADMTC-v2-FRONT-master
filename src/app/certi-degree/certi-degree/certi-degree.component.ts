import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import { UntypedFormControl, Validators } from '@angular/forms';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { CertidegreeService } from '../../service/certidegree/certidegree.service';
import { SelectionModel } from '@angular/cdk/collections';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';

interface DataModel {
  id: string;
  name: string;
}
interface rncpTitle {
  id: string;
  text: string;
}
@Component({
  selector: 'ms-certi-degree',
  templateUrl: './certi-degree.component.html',
  styleUrls: ['./certi-degree.component.scss'],
})
export class CertiDegreeComponent implements OnInit, OnDestroy {
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  rncpTitles: rncpTitle[] = [];
  titles: string[] = [];
  classArray = [];
  classes: string[] = [];
  scholarSeasonArray = [{ name: '2019-2020', id: '1' }, { name: '2018-2019', id: '2' }];
  scholarSeasons = [];
  noData: any;
  filteredRncpTitle: Observable<string[]>;
  filteredClass: Observable<string[]>;
  filteredScholarSeason: Observable<string[]>;
  rncpTitle = new UntypedFormControl('', [Validators.required]);
  classe = new UntypedFormControl('', [Validators.required]);
  scholarSeason = new UntypedFormControl('', [Validators.required]);
  transcriptDetails: DataModel[] = [{ name: 'AllM', id: 'all' }, { name: 'THUMBSUP.OK', id: 'yes' }, { name: 'THUMBSUP.NOT_OK', id: 'no' }];
  empSurveyDetails: DataModel[] = [
    { name: 'AllM', id: 'all' },
    { name: 'Sent to student', id: 'Sent to student' },
    { name: 'Completed by Student', id: 'Completed by Student' },
    { name: 'Rejected by Acad Dir', id: 'Rejected by Acad Dir' },
    { name: 'Validated by Acad Dir', id: 'Validated by Acad Dir' },
  ];
  diplomaDetails: DataModel[] = [{ name: 'AllM', id: 'all' }, { name: 'UPLOADED', id: 'yes' }, { name: 'NOTUPLOADED', id: 'no' }];
  certifierDetails: DataModel[] = [
    { name: 'AllM', id: 'all' },
    { name: 'PASS', id: 'Pass' },
    { name: 'FAIL', id: 'Fail' },
    { name: 'Eliminated', id: 'Eliminated' },
  ];
  certidegreeDetails: DataModel[] = [
    { name: 'AllM', id: 'all' },
    { name: 'Sent to student', id: 'Sent to student' },
    { name: 'DETAILNEEDREVISION', id: 'Details need revision' },
    { name: 'REVISIONDONE', id: 'Revision Done' },
    { name: 'CERTIFICATEISSUED', id: 'Certificate Issued' },
  ];
  selection = new SelectionModel(true, []);
  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['select', 'name', 'transcript', 'empSurvey', 'diploma', 'certifier', 'certidegree', 'school'];

  filterColumns: string[] = [
    'selectFilter',
    'nameFilter',
    'transcriptFilter',
    'empSurveyFilter',
    'diplomaFilter',
    'certifierFilter',
    'certidegreeFilter',
    'schoolFilter',
  ];
  filteredValues = {
    name: '',
    transcript: 'all',
    empSurvey: 'all',
    diploma: 'all',
    certifier: 'all',
    certidegree: 'all',
    school: '',
  };
  @ViewChild(MatPaginator, { static: false }) set paginator(content) {
    this.dataSource.paginator = content;
  }
  @ViewChild(MatSort, { static: false }) set sort(content) {
    this.dataSource.sort = content;
  }
  private subs = new SubSink();
  nameFilter = new UntypedFormControl('');
  transcriptFilter = new UntypedFormControl('all');
  empSurveyFilter = new UntypedFormControl('all');
  diplomaFilter = new UntypedFormControl('all');
  certifierFilter = new UntypedFormControl('all');
  certidegreeFilter = new UntypedFormControl('all');
  schoolFilter = new UntypedFormControl('');

  constructor(
    private translate: TranslateService,
    private certidegreeService: CertidegreeService,
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

    this.subs.sink = this.transcriptFilter.valueChanges.subscribe(transcript => {
      this.filteredValues['transcript'] = transcript;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.empSurveyFilter.valueChanges.subscribe(empSurvey => {
      this.filteredValues['empSurvey'] = empSurvey;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.diplomaFilter.valueChanges.subscribe(diploma => {
      this.filteredValues['diploma'] = diploma;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.certifierFilter.valueChanges.subscribe(certifier => {
      this.filteredValues['certifier'] = certifier;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.certidegreeFilter.valueChanges.subscribe(certidegree => {
      this.filteredValues['certidegree'] = certidegree;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.schoolFilter.valueChanges.subscribe(school => {
      this.filteredValues['school'] = school;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.dataSource.filterPredicate = this.customFilterPredicate();

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'transcript':
          return item.creator ? item.creator.isAdministrative : null;
        case 'empSurvey':
          return item.creator.EmployabilitySurvey ? item.creator.EmployabilitySurveySort : null;
        case 'diploma':
          return item.creator ? item.creator.diplomaUploaded : null;
        case 'certifier':
          return item.creator.certifierStatus ? item.creator.certifierStatusSort : null;
        case 'certidegree':
          return item.creator.certidegree ? item.creator.certidegreeSort : null;
        case 'school':
          return item.school ? item.school.shortName : null;
        default:
          return item[property];
      }
    };
    // this.getUrgentMail();
  }

  private _filteredRncpTitle(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.titles.filter(option => option.toLowerCase().includes(filterValue));
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

      let transcript = '';
      data.creator.isAdministrative ? (transcript = 'yes') : (transcript = 'no');
      const transcriptFound =
        searchString.transcript === 'all'
          ? true
          : transcript
              .toString()
              .trim()
              .toLowerCase()
              .indexOf(searchString.transcript.toLowerCase()) !== -1;

      const empSurveyFound =
        searchString.empSurvey === 'all'
          ? true
          : data.creator.EmployabilitySurvey
          ? data.creator.EmployabilitySurvey.toString()
              .trim()
              .toLowerCase()
              .indexOf(searchString.empSurvey.toLowerCase()) !== -1
          : false;

      let diploma = '';
      data.creator.diplomaUploaded ? (diploma = 'yes') : (diploma = 'no');
      const diplomaFound =
        searchString.diploma === 'all'
          ? true
          : diploma
              .toString()
              .trim()
              .toLowerCase()
              .indexOf(searchString.diploma.toLowerCase()) !== -1;

      const certifierFound =
        searchString.certifier === 'all'
          ? true
          : data.creator.certifierStatus
          ? data.creator.certifierStatus
              .toString()
              .trim()
              .toLowerCase()
              .indexOf(searchString.certifier.toLowerCase()) !== -1
          : false;

      const certidegreeFound =
        searchString.certidegree === 'all'
          ? true
          : data.creator.certidegree
          ? data.creator.certidegree
              .toString()
              .trim()
              .toLowerCase()
              .indexOf(searchString.certidegree.toLowerCase()) !== -1
          : false;

      const schoolFound =
        searchString.school !== ''
          ? data.school
            ? data.school.shortName
                .toString()
                .trim()
                .toLowerCase()
                .indexOf(searchString.school.toLowerCase()) !== -1
            : false
          : true;

      return nameFound && transcriptFound && empSurveyFound && diplomaFound && certifierFound && certidegreeFound && schoolFound;
    };
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.dataSource.data.forEach(row => this.selection.select(row));
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  /*
   * Check is all student checked*/
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  OnSelectRNCPTitle(option) {
    this.classArray = [];
    this.classes = [];
    this.dataSource.data = [];
    this.classe = new UntypedFormControl('', [Validators.required]);
    this.scholarSeason = new UntypedFormControl('', [Validators.required]);
    this.scholarSeasons = [];
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
    this.scholarSeason = new UntypedFormControl('', [Validators.required]);
    this.scholarSeasons = [];
    this.dataSource.data = [];
    this.noData = this.dataSource.connect().pipe(map(data => data.length === 0));
    this.scholarSeasonArray.forEach(el => {
      if (this.scholarSeasons.indexOf(el.name) === -1) {
        this.scholarSeasons.push(el.name);  
      }
    });
    this.filteredScholarSeason = this.scholarSeason.valueChanges.pipe(
      startWith(''),
      map(value => this._filterScholarSeason(value)),
    );
  }
  private _filterScholarSeason(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.scholarSeasons.filter(option => option.toLowerCase().includes(filterValue));
  }

  onSelectSeason(option) {
    this.dataSource.data = [];
    this.subs.sink = this.certidegreeService.getAlert().subscribe((resp: any) => {
      this.dataSource.data = resp.data;
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.noData = this.dataSource.connect().pipe(map(data => data.length === 0));

      this.dataSource.data.forEach(el => {
        if (el.creator.EmployabilitySurvey === 'Sent to student') {
          el.creator.EmployabilitySurveySort = 1;
        } else if (el.creator.EmployabilitySurvey === 'Completed by Student') {
          el.creator.EmployabilitySurveySort = 2;
        } else if (el.creator.EmployabilitySurvey === 'Rejected by Acad Dir') {
          el.creator.EmployabilitySurveySort = 3;
        } else if (el.creator.EmployabilitySurvey === 'Validated by Acad Dir') {
          el.creator.EmployabilitySurveySort = 4;
        } else {
          el.creator.EmployabilitySurveySort = 5;
        }
      });
      this.dataSource.data.forEach(el => {
        if (el.creator.certifierStatus === 'Pass') {
          el.creator.certifierStatusSort = 1;
        } else if (el.creator.certifierStatus === 'Fail') {
          el.creator.certifierStatusSort = 2;
        } else if (el.creator.certifierStatus === 'Eliminated') {
          el.creator.certifierStatusSort = 3;
        } else {
          el.creator.EmployabilitySurveySort = 4;
        }
      });
      this.dataSource.data.forEach(el => {
        if (el.creator.certidegree === 'Sent to student') {
          el.creator.certidegreeSort = 1;
        } else if (el.creator.certidegree === 'Details need revision') {
          el.creator.certidegreeSort = 2;
        } else if (el.creator.certidegree === 'Revision Done') {
          el.creator.certidegreeSort = 3;
        } else if (el.creator.certidegree === 'Certificate Issued') {
          el.creator.certidegreeSort = 4;
        } else {
          el.creator.certidegreeSort = 5;
        }
      });
    });
  }

  resetAllFilter() {
    this.filteredValues = {
      name: '',
      transcript: 'all',
      empSurvey: 'all',
      diploma: 'all',
      certifier: 'all',
      certidegree: 'all',
      school: '',
    };
    this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.nameFilter.setValue('');
    this.transcriptFilter.setValue('all');
    this.empSurveyFilter.setValue('all');
    this.diplomaFilter.setValue('all');
    this.certifierFilter.setValue('all');
    this.certidegreeFilter.setValue('all');
    this.schoolFilter.setValue('');
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
