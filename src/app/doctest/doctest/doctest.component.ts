import { Component, OnInit, ViewChild, OnDestroy, AfterViewChecked, ChangeDetectorRef, AfterContentChecked } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatDialogRef, MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { DoctestService } from '../../service/doctest/doctest.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { UntypedFormControl } from '@angular/forms';
import * as moment from 'moment';
import { RNCPTitlesService } from '../../service/rncpTitles/rncp-titles.service';
import { SchoolService } from '../../service/schools/school.service';
import { SelectionModel } from '@angular/cdk/collections';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { UtilityService } from 'app/service/utility/utility.service';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-doctest',
  templateUrl: './doctest.component.html',
  styleUrls: ['./doctest.component.scss'],
})
export class DoctestComponent implements OnInit, AfterContentChecked, OnDestroy {
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  private subs = new SubSink();
  dataSource = new MatTableDataSource([]);
  noData: any;
  displayedColumns: string[] = [
    'select',
    'createdAt',
    'title',
    'school',
    'class',
    'student',
    'expertise',
    'subject',
    'test',
    'documentType',
    'name',
    'action',
  ];
  filterColumns: string[] = [
    'selectFilter',
    'createdAtFilter',
    'titleFilter',
    'schoolFilter',
    'classFilter',
    'studentFilter',
    'expertiseFilter',
    'subjectFilter',
    'testFilter',
    'documentTypeFilter',
    'nameFilter',
    'actionFilter',
  ];

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  selection = new SelectionModel(true, []);

  createdAtFilter = new UntypedFormControl('');
  titleFilter = new UntypedFormControl('');
  schoolFilter = new UntypedFormControl('');
  classFilter = new UntypedFormControl('');
  studentFilter = new UntypedFormControl('');
  expertiseFilter = new UntypedFormControl('');
  subjectFilter = new UntypedFormControl('');
  testFilter = new UntypedFormControl('');
  documentTypeFilter = new UntypedFormControl('all');
  nameFilter = new UntypedFormControl('');

  filteredSchools: Observable<string[]>;
  filteredTitles: Observable<string[]>;
  isUserCertifierAdmin = false;
  isUserCertifierDir = false;
  isUserAcadDir = false;
  isUserAcadAdmin = false;

  // This variable will store all title list
  rncpTitles = [];
  // Will store all list of schools
  schoolsData = [];
  // Will store all class data
  classesData = [];

  // Will store list of subjects data
  subjectsData = [
    {
      _id: '5d96e730e51c882e1e8f2702',
      name: `Project de Fin d'Etudes`,
    },
    {
      _id: '5d96e737ebe5c5983a61ce65',
      name: 'CPC Subject',
    },
    {
      _id: '5d96e73b1013a448a3f865b8',
      name: 'RMO Subject',
    },
  ];
  // Will store list of test data
  testsData = [
    {
      _id: '5d96e8e09d9e87125f317cbe',
      name: `PFE - ECRIT`,
    },
    {
      _id: '5d96e8e5f3b22e821f9401b1',
      name: 'CPC - Test',
    },
    {
      _id: '5d96e8e9e07191a22816d56d',
      name: 'RMO - Test',
    },
  ];
  filteredValues = {
    createdAt: '',
    title: '',
    school: '',
    class: '',
    student: '',
    expertise: '',
    subject: '',
    test: '',
    documentType: 'all',
    name: '',
  };
  documentType = [
    { name: 'AllM', id: 'all' },
    { name: 'DOCUMENTTYPE.DOCEXPECTED', id: 'Doc_Expected' },
    { name: 'DOCUMENTTYPE.CORRECTIONGRID', id: 'Correction_Grid' },
    { name: 'DOCUMENTTYPE.JUSTIFABSENCE', id: 'Justif_Absence' },
    { name: 'DOCUMENTTYPE.INTERNALTASK', id: 'Internal_Task' },
  ];

  constructor(
    private docTestService: DoctestService,
    private titleService: RNCPTitlesService,
    private schoolService: SchoolService,
    private cdref: ChangeDetectorRef,
    private utilService: UtilityService,
    public permissionService: PermissionService,
    public dialog: MatDialog,
    private mailboxService: MailboxService,
    private translate: TranslateService,
    private dateAdapter: DateAdapter<Date>
  ) {}

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.isUserCertifierAdmin = this.utilService.isCertifierAdmin();
    this.isUserCertifierDir = this.utilService.isCertifierDirector();
    this.isUserAcadAdmin = this.utilService.isUserAcadAdmin();
    this.isUserAcadDir = this.utilService.isUserAcadir();
    this.subs.sink = this.docTestService.getDocTest().subscribe((docTestList: any[]) => {
      this.dataSource.data = docTestList;
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.noData = this.dataSource.connect().pipe(map(data => data.length === 0));

      this.dataSource.data.forEach(el => {
        if (el.documentType === 'Doc_Expected') {
          el.docTypeOrder = 1;
        }
        if (el.documentType === 'Correction_Grid') {
          el.docTypeOrder = 2;
        }
        if (el.documentType === 'Justif_Absence') {
          el.docTypeOrder = 3;
        }
        if (el.documentType === 'Internal_Task') {
          el.docTypeOrder = 4;
        }
      });

      this.filteredSchools = this.schoolFilter.valueChanges.pipe(
        startWith(''),
        map(value => this._filterSchool(value)),
      );

      this.filteredTitles = this.titleFilter.valueChanges.pipe(
        startWith(''),
        map(value => this._filterTitle(value)),
      );
    });

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'title':
          return item.uploadedForStudent.rncpTitle ? item.uploadedForStudent.rncpTitle.shortName : null;
        case 'school':
          return item.uploadedForStudent.school ? item.uploadedForStudent.school.shortName : null;
        case 'class':
          return item.uploadedForStudent.currentClass ? item.uploadedForStudent.currentClass.name : null;
        case 'student':
          return item.uploadedForStudent ? item.uploadedForStudent.lastName : null;
        case 'expertise':
          return item.parentTest.subjectId.expertise ? item.parentTest.subjectId.expertise.blockOfExperise : null;
        case 'subject':
          return item.parentTest.subjectId ? item.parentTest.subjectId.subjectName : null;
        case 'test':
          return item.parentTest ? item.parentTest.name : null;
        case 'documentType':
          return item.documentType ? item.docTypeOrder : null;
        default:
          return item[property];
      }
    };

    this.subs.sink = this.titleService.getRncpTitles().subscribe(titles => {
      titles.forEach(el => {
        if (this.rncpTitles.indexOf(el.shortName) === -1) {
          this.rncpTitles.push(el.shortName);
        }
      });
    });

    this.subs.sink = this.schoolService.getSchools().subscribe(schools => {
      schools.forEach(el => {
        if (this.schoolsData.indexOf(el.shortName) === -1) {
          this.schoolsData.push(el.shortName);
        }
      });
    });

    this.subs.sink = this.titleService.getAcadClass().subscribe(classes => {
      this.classesData = classes['data'];
    });

    this.initialFilter();
    // this.getUrgentMail();
  }

  private _filterSchool(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.schoolsData.filter(option => option.toLowerCase().includes(filterValue));
  }

  private _filterTitle(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.rncpTitles.filter(option => option.toLowerCase().includes(filterValue));
  }

  initialFilter() {
    this.subs.sink = this.createdAtFilter.valueChanges.subscribe(createdAt => {
      this.filteredValues['createdAt'] = createdAt;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.titleFilter.valueChanges.subscribe(title => {
      this.filteredValues['title'] = title;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.schoolFilter.valueChanges.subscribe(school => {
      this.filteredValues['school'] = school;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.classFilter.valueChanges.subscribe(classe => {
      this.filteredValues['class'] = classe;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.studentFilter.valueChanges.subscribe(student => {
      this.filteredValues['student'] = student;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.documentTypeFilter.valueChanges.subscribe(documentType => {
      this.filteredValues['documentType'] = documentType;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.nameFilter.valueChanges.subscribe(docName => {
      this.filteredValues['name'] = docName;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.expertiseFilter.valueChanges.subscribe(expert => {
      this.filteredValues['expertise'] = expert;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.testFilter.valueChanges.subscribe(expert => {
      this.filteredValues['test'] = expert;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.subjectFilter.valueChanges.subscribe(expert => {
      this.filteredValues['subject'] = expert;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.dataSource.filterPredicate = this.customFilterPredicate();
  }

  customFilterPredicate() {
    return function(data, filter: string): boolean {
      const searchString = JSON.parse(filter);

      let newDate = moment(searchString.createdAt).format('YYYY-MM-DD');
      newDate = newDate !== 'Invalid date' ? newDate : '';

      const dateFound =
        newDate === '' ||
        moment(data.createdAt)
          .format('YYYY-MM-DD')
          .toString()
          .trim()
          .toLowerCase()
          .indexOf(newDate) !== -1;

      const titleFound =
        data.uploadedForStudent &&
        data.uploadedForStudent.rncpTitle &&
        data.uploadedForStudent.rncpTitle.shortName
          .toString()
          .trim()
          .toLowerCase()
          .indexOf(searchString.title.toLowerCase()) !== -1;

      const schoolFound =
        data.uploadedForStudent &&
        data.uploadedForStudent.school &&
        data.uploadedForStudent.school.shortName &&
        data.uploadedForStudent.school.shortName
          .toString()
          .trim()
          .toLowerCase()
          .indexOf(searchString.school.toLowerCase()) !== -1;

      const classFound =
        searchString.class === '' ||
        searchString.class === 'all' ||
        (data.uploadedForStudent &&
          data.uploadedForStudent.currentClass &&
          data.uploadedForStudent.currentClass.name &&
          data.uploadedForStudent.currentClass.name
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.class.toLowerCase()) !== -1);

      const studentFound =
        searchString.student === '' ||
        (data.uploadedForStudent &&
          data.uploadedForStudent &&
          data.uploadedForStudent.lastName &&
          data.uploadedForStudent.lastName
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.student.toLowerCase()) !== -1);

      const docNameFound =
        searchString.name === '' ||
        (data.name &&
          data.name
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.name.toLowerCase()) !== -1);

      const docTypeFound =
        searchString.documentType === 'all' ||
        (data.documentType &&
          data.documentType
            .toString()
            .trim()
            .toLowerCase()
            .indexOf(searchString.documentType.toLowerCase()) !== -1);

      const expertiseFound =
        data.parentTest &&
        data.parentTest.subjectId &&
        data.parentTest.subjectId.expertise &&
        data.parentTest.subjectId.expertise._id &&
        data.parentTest.subjectId.expertise.blockOfExperise &&
        data.parentTest.subjectId.expertise.blockOfExperise
          .toString()
          .trim()
          .toLowerCase()
          .indexOf(searchString.expertise) !== -1;

      const subjectFound =
        data.parentTest &&
        data.parentTest.subjectId &&
        data.parentTest.subjectId.subjectName &&
        data.parentTest.subjectId.subjectName
          .toString()
          .trim()
          .toLowerCase()
          .indexOf(searchString.subject) !== -1;

      const testFound =
        data.parentTest &&
        data.parentTest.name &&
        data.parentTest.name
          .toString()
          .trim()
          .toLowerCase()
          .indexOf(searchString.test) !== -1;

      return (
        dateFound &&
        titleFound &&
        schoolFound &&
        classFound &&
        docTypeFound &&
        studentFound &&
        docNameFound &&
        expertiseFound &&
        subjectFound &&
        testFound
      );
    };
  }

  resetAllFilter() {
    this.filteredValues = {
      createdAt: '',
      title: '',
      school: '',
      class: '',
      student: '',
      expertise: '',
      subject: '',
      test: '',
      documentType: 'all',
      name: '',
    };

    this.dataSource.filter = JSON.stringify(this.filteredValues);

    this.createdAtFilter.setValue('');
    this.titleFilter.setValue('');
    this.schoolFilter.setValue('');
    this.classFilter.setValue('');
    this.studentFilter.setValue('');
    this.expertiseFilter.setValue('');
    this.subjectFilter.setValue('');
    this.testFilter.setValue('');
    this.documentTypeFilter.setValue('all');
    this.nameFilter.setValue('');
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

  ngAfterContentChecked() {
    this.cdref.detectChanges();
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
