import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { DateAdapter } from '@angular/material/core';
import { MatDialogRef, MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { UntypedFormControl } from '@angular/forms';
import { IdeasService } from 'app/service/ideas/ideas.service';
import { DatePipe } from '@angular/common';
import * as moment from 'moment';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { CertificationRuleService } from 'app/service/certification-rule/certification-rule.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { CertificationRulePopUpComponent } from 'app/title-rncp/conditions/certification-rule/certification-rule-pop-up/certification-rule-pop-up.component';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { PermissionService } from 'app/service/permission/permission.service';

@Component({
  selector: 'ms-ideas',
  templateUrl: './ideas.component.html',
  styleUrls: ['./ideas.component.scss'],
})
export class IdeasComponent implements OnInit, OnDestroy {
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  certificationRuleDialogComponent: MatDialogRef<CertificationRulePopUpComponent>;
  selectedRncpTitleLongName: any;
  selectedRncpTitleName: any;
  configCertificatioRule: MatDialogConfig = {
    disableClose: true,
  };
  categoryList = [
    { name: 'AllM', id: 'all' },
    { name: 'CATEGORYDROPDOWN.LIFEATSCHOOL', id: 'Life​ ​at​ ​the​ ​school' },
    { name: 'CATEGORYDROPDOWN.LIFEATCOMPANY', id: 'Life​ ​at​ ​Company' },
    { name: 'CATEGORYDROPDOWN.ACADEMICCONTENT', id: 'Academic​ ​content' },
    { name: 'CATEGORYDROPDOWN.COURSEORGANIZATION', id: 'Organization​ ​of​ the ​courses' },
    { name: 'CATEGORYDROPDOWN.EVENTORGANIZATION', id: 'Organization​ ​of​ ​events' },
    { name: 'CATEGORYDROPDOWN.INTEGRATIONASSISTANCE', id: 'Assistance​ ​for​ ​integration' },
  ];

  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['createdAt', 'user', 'userType', 'school', 'category', 'suggestion', 'points_count', 'action'];
  filterColumns: string[] = [
    'dateFilter',
    'userFilter',
    'userTypeFilter',
    'schoolFilter',
    'categoryFilter',
    'suggestionFilter',
    'pointFilter',
    'actionFilter',
  ];
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  noData = false;
  private subs = new SubSink();
  userTypeArray: any[] = [];
  schoolsArray: any[] = [];
  filteredSchools: Observable<string[]>;
  filteredUserType: Observable<string[]>;
  dateFilter = new UntypedFormControl('');
  userFilter = new UntypedFormControl('');
  userTypeFilter = new UntypedFormControl('');
  schoolFilter = new UntypedFormControl('');
  categoryFilter = new UntypedFormControl('all');
  suggestionFilter = new UntypedFormControl('');
  filteredValues = {
    createdAt: '',
    user: '',
    userType: '',
    school: '',
    category: 'all',
    suggestion: '',
  };

  constructor(
    private ideasService: IdeasService,
    private datepipe: DatePipe,
    private translate: TranslateService,
    public dialog: MatDialog,
    private mailboxService: MailboxService,
    private permissions: NgxPermissionsService,
    private certificationRuleService: CertificationRuleService,
    private authService: AuthService,
    private rncpTitlesService: RNCPTitlesService,
    public permissionService: PermissionService,
    private dateAdapter: DateAdapter<Date>
    ) {}

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.subs.sink = this.dateFilter.valueChanges.subscribe((createdAt) => {
      this.filteredValues['createdAt'] = createdAt;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.userFilter.valueChanges.subscribe((user) => {
      this.filteredValues['user'] = user;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.userTypeFilter.valueChanges.subscribe((userType) => {
      this.filteredValues['userType'] = userType;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.schoolFilter.valueChanges.subscribe((school) => {
      this.filteredValues['school'] = school;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.categoryFilter.valueChanges.subscribe((category) => {
      this.filteredValues['category'] = category;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.suggestionFilter.valueChanges.subscribe((suggestion) => {
      this.filteredValues['suggestion'] = suggestion;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.dataSource.filterPredicate = this.customFilterPredicate();

    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'user':
          return item.user ? item.user.lastName : null;
        case 'school':
          return item.user.entity ? item.user.entity.school : null;
        case 'userType':
          return item.user.types ? item.user.types[0].name : null;
        default:
          return item[property];
      }
    };
    this.getIdeasList();
    if (!!this.permissions.getPermission('Student')) {
      this.getCertificationRule();
    } else {
      // this.getUrgentMail();
    }
  }
  getIdeasList() {
    this.subs.sink = this.ideasService.getIdeas().subscribe((ideas: any[]) => {
      this.dataSource.data = ideas;
      this.dataSource.sort = this.sort;
      this.dataSource.paginator = this.paginator;
      this.dataSource.filter = JSON.stringify(this.filteredValues);

      if (this.dataSource.data && this.dataSource.data.length) {

        this.noData = false;
      } else {

        this.noData = true;
      }
      this.dataSource.data.forEach((el) => {
        if (this.schoolsArray.indexOf(el.user.entity.school) === -1) {
          this.schoolsArray.push(el.user.entity.school);
        }
      });
      this.dataSource.data.forEach((element) => {
        element.user.types.forEach((el) => {
          if (this.userTypeArray.indexOf(el.name) === -1) {
            this.userTypeArray.push(el.name);
          }
        });
      });

      this.filteredSchools = this.schoolFilter.valueChanges.pipe(
        startWith(''),
        map((value) => this._filterSchool(value)),
      );
      this.filteredUserType = this.userTypeFilter.valueChanges.pipe(
        startWith(''),
        map((value) => this._filterUserType(value)),
      );
    });
  }

  private _filterSchool(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.schoolsArray.filter((option) => option.toLowerCase().includes(filterValue));
  }

  private _filterUserType(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.userTypeArray.filter((option) => option.toLowerCase().includes(filterValue));
  }

  customFilterPredicate() {
    return function (data, filter: string): boolean {
      const searchString = JSON.parse(filter);
      let newDate = moment(searchString.createdAt).format('YYYY-MM-DD');
      newDate = newDate !== 'Invalid date' ? newDate : '';
      const createdAtFound = data.createdAt.toString().trim().toLowerCase().indexOf(newDate) !== -1;
      const lastNameFound = data.user.lastName.toString().trim().toLowerCase().indexOf(searchString.user.toLowerCase()) !== -1;
      const userTypeFound =
        searchString.userType.trim().toLowerCase() === ''
          ? true
          : data.user.types.filter((d) => d.name.trim().toLowerCase().indexOf(searchString.userType.trim().toLowerCase()) > -1).length > 0;

      const schoolFound = data.user.entity.school
        ? data.user.entity.school.toString().trim().toLowerCase().indexOf(searchString.school.toLowerCase()) !== -1
        : null;
      const categoryFound =
        searchString.category.toLowerCase() === 'all'
          ? true
          : data.category.trim().toLowerCase().localeCompare(searchString.category.trim().toLowerCase()) === 0;

      const suggestionFound = data.suggestion.toString().trim().toLowerCase().indexOf(searchString.suggestion) !== -1;

      return lastNameFound && createdAtFound && userTypeFound && schoolFound && categoryFound && suggestionFound;
    };
  }

  addEvent(event) {
    let date = this.datepipe.transform(event.value, 'yyyy-MM-dd');
    this.filteredValues = {
      createdAt: date,
      user: '',
      userType: '',
      school: '',
      category: 'all',
      suggestion: '',
    };
    this.dataSource.filter = JSON.stringify(this.filteredValues);
  }

  resetSelection() {
    this.filteredValues = {
      createdAt: '',
      user: '',
      userType: '',
      school: '',
      category: 'all',
      suggestion: '',
    };

    this.dataSource.filter = JSON.stringify(this.filteredValues);

    this.dateFilter.setValue('');
    this.userFilter.setValue('');
    this.userTypeFilter.setValue('');
    this.schoolFilter.setValue('');
    this.categoryFilter.setValue('all');
    this.suggestionFilter.setValue('');
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
  getCertificationRule() {
    const studentData = this.authService.getLocalStorageUser();
    const titleId = studentData.entities[0].assigned_rncp_title._id;
    const classId = studentData.entities[0].class._id;
    const studentId = studentData._id;
    this.subs.sink = this.rncpTitlesService.getRncpTitleById(titleId).subscribe((resp) => {
      this.selectedRncpTitleName = resp.short_name;
      this.selectedRncpTitleLongName = resp.long_name;
    });
    this.subs.sink = this.certificationRuleService
      .getCertificationRuleSentWithStudent(titleId, classId, studentId)
      .subscribe((dataRule: any) => {
        if (dataRule) {
          // this.showCertificationRule(titleId, classId);
        }
      });
  }

  showCertificationRule(selectedRncpTitleId, selectedClassId) {
    this.dialog.open(CertificationRulePopUpComponent, {
      panelClass: 'reply-message-pop-up',
      ...this.configCertificatioRule,
      data: {
        callFrom: 'global',
        titleId: selectedRncpTitleId,
        classId: selectedClassId,
        titleName: this.selectedRncpTitleName,
        titleLongName: this.selectedRncpTitleLongName,
      },
    }).afterClosed().subscribe((result) => {
      // this.getUrgentMail();
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
