import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { Sort, MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntypedFormControl } from '@angular/forms';
import { Observable, of, forkJoin } from 'rxjs';
import { SchoolService } from 'app/service/schools/school.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { Router } from '@angular/router';
import { GlobalErrorService } from 'app/service/global-error-service/global-error-service.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { UtilityService } from 'app/service/utility/utility.service';
import { AddGroupOfSchoolDialogComponent } from './add-group-of-school-dialog/add-group-of-school-dialog.component';
import { SubSink } from 'subsink';
import { map, debounceTime, startWith, tap } from 'rxjs/operators';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { TranslateService } from '@ngx-translate/core';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { PageTitleService } from 'app/core/page-title/page-title.service';

@Component({
  selector: 'ms-group-of-schools-table',
  templateUrl: './group-of-schools-table.component.html',
  styleUrls: ['./group-of-schools-table.component.scss'],
})
export class GroupOfSchoolsTableComponent implements OnInit, AfterViewInit, OnDestroy {
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  private subs = new SubSink();
  dataSource = new MatTableDataSource([]);

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;

  displayedColumns: string[] = ['groupName', 'headQuarter', 'schoolMember', 'rncpTitle', 'action'];
  filterColumns: string[] = ['groupNameFilter', 'headQuarterFilter', 'schoolMemberFilter', 'rncpTitleFilter', 'actionFilter'];
  filteredValues = {
    group_name: '',
    headquarter: '',
    school_member: '',
    rncp_title: '',
  };

  groupCount = 0;
  noData: any;

  sortValue = null;
  isReset = false;
  dataLoaded = false;
  isWaitingForResponse = false;

  groupNameFilterList = [];
  groupNameFilter = new UntypedFormControl('');
  filteredGroupName: Observable<string[]>;

  headQuarterFilterList = [];
  headQuarterFilter = new UntypedFormControl('');
  filteredHeadQuearter: Observable<string[]>;

  schoolMemberFilterList = [];
  schoolMemberFilter = new UntypedFormControl('');
  filteredSchoolMember: Observable<string[]>;

  rncpTitleFilterList = [];
  rncpTitleFilter = new UntypedFormControl('');
  filteredRncpTitle: Observable<string[]>;

  private intVal: any;
  private timeOutVal: any;

  constructor(
    private rncpTitleService: RNCPTitlesService,
    private schoolService: SchoolService,
    private router: Router,
    public dialog: MatDialog,
    private globalErrorService: GlobalErrorService,
    private permissions: NgxPermissionsService,
    private utilService: UtilityService,
    private translate: TranslateService,
    private mailboxService: MailboxService,
    private pageTitleService: PageTitleService,
    public permissionService: PermissionService
  ) {}

  ngOnInit() {
    this.pageTitleService.setTitle('List of Group of School');
    this.dataSource.data = [];
    this.sort.direction = 'asc';
    this.sort.active = 'group_name';
    this.sortValue = { group_name: 'asc' };
    this.getAllGroupOfSchools();
    this.initDropdownData();
    this.initFilter();
    // this.getUrgentMail();
  }

  ngAfterViewInit() {
    // this.dataSource.sort = this.sort;
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (!this.isReset) {
            this.getAllGroupOfSchools();
          }
          this.dataLoaded = true;
        }),
      )
      .subscribe();
  }

  getAllGroupOfSchools() {
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.isWaitingForResponse = true;
    this.subs.sink = this.schoolService.getAllGroupOfSchools(this.filteredValues, this.sortValue, pagination).subscribe((resp: any) => {

      if (resp && resp.length) {
        this.dataSource.data = resp;
        this.groupCount = resp[0].count_document;
        this.isWaitingForResponse = false;
      } else {
        this.dataSource.data = [];
        this.groupCount = 0;
        this.isWaitingForResponse = false;
      }

      this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
      this.isReset = false;
    });
  }

  initDropdownData() {
    const forkJoinParam = [];
    forkJoinParam.push(this.schoolService.getAllGroupOfSchoolsDropdown());
    forkJoinParam.push(this.schoolService.getAllSchoolMemberDropdown('headquarter'));
    forkJoinParam.push(this.schoolService.getAllSchoolMemberDropdown('school_member'));
    forkJoinParam.push(this.schoolService.getTitleinGroupofSchoolDropdown());

    this.subs.sink = forkJoin(forkJoinParam).subscribe(resp => {
      let count = 0;
      if (resp && resp.length) {
        if (resp[count]) {
          let temp = _.cloneDeep(resp[count]);
          if (temp) {
            temp = temp.sort((groupA, groupB) => {
              if (this.utilService.simplifyRegex(groupA.group_name) < this.utilService.simplifyRegex(groupB.group_name)) {
                return -1;
              } else if (this.utilService.simplifyRegex(groupA.group_name) > this.utilService.simplifyRegex(groupB.group_name)) {
                return 1;
              } else {
                return 0;
              }
            })
          }
          this.groupNameFilterList = _.cloneDeep(temp);
          this.filteredGroupName = of(this.groupNameFilterList);
          count += 1;
        }
        if (resp[count]) {
          this.headQuarterFilterList = _.cloneDeep(resp[count]);
          this.filteredHeadQuearter = of(this.headQuarterFilterList);
          count += 1;
        }
        if (resp[count]) {
          this.schoolMemberFilterList = _.cloneDeep(resp[count]);
          this.filteredSchoolMember = of(this.schoolMemberFilterList);
          count += 1;
        }
        if (resp[count]) {
          this.rncpTitleFilterList = _.cloneDeep(resp[count]);
          this.filteredRncpTitle = of(this.rncpTitleFilterList);
          count += 1;
        }
      }
      this.initFilter();
    })
  }

  initFilter() {
    this.subs.sink = this.groupNameFilter.valueChanges.pipe(debounceTime(100)).subscribe((input) => {
      if (typeof input === 'string') {
        const result = this.groupNameFilterList.filter((group) =>
          this.utilService.simplifyRegex(group.group_name).includes(this.utilService.simplifyRegex(input)),
        );

        this.filteredGroupName = of(result);
      }
    });

    this.subs.sink = this.headQuarterFilter.valueChanges.pipe(debounceTime(100)).subscribe((input) => {
      if (typeof input === 'string') {
        const result = this.headQuarterFilterList.filter((school) =>
          this.utilService.simplifyRegex(school.short_name).includes(this.utilService.simplifyRegex(input)),
        );

        this.filteredHeadQuearter = of(result);
      }
    });

    this.subs.sink = this.schoolMemberFilter.valueChanges.pipe(debounceTime(100)).subscribe((input) => {
      if (typeof input === 'string') {
        const result = this.schoolMemberFilterList.filter((school) =>
          this.utilService.simplifyRegex(school.short_name).includes(this.utilService.simplifyRegex(input)),
        );

        this.filteredSchoolMember = of(result);
      }
    });

    this.subs.sink = this.rncpTitleFilter.valueChanges.pipe(debounceTime(100)).subscribe((input) => {
      if (typeof input === 'string') {
        const result = this.rncpTitleFilterList.filter((title) =>
          this.utilService.simplifyRegex(title.short_name).includes(this.utilService.simplifyRegex(input)),
        );

        this.filteredRncpTitle = of(result);
      }
    });
  }

  setGroupFilter(groupName: string) {
    this.filteredValues.group_name = groupName;
    this.paginator.pageIndex = 0;
    this.getAllGroupOfSchools();
  }

  setHQFilter(HQId: string) {
    this.filteredValues.headquarter = HQId;
    this.paginator.pageIndex = 0;
    this.getAllGroupOfSchools();
  }

  setMemberFilter(memberId: string) {
    this.filteredValues.school_member = memberId;
    this.paginator.pageIndex = 0;
    this.getAllGroupOfSchools();
  }

  setTitleFilter(titleId: string) {
    this.filteredValues.rncp_title = titleId;
    this.paginator.pageIndex = 0;
    this.getAllGroupOfSchools();
  }

  sortData(sort: Sort) {

    if (sort.active === 'group_name') {
      this.sortValue = sort.direction ? { group_name: sort.direction } : null;
    } else if (sort.active === 'headquarter') {
      this.sortValue = sort.direction ? { headquarter: sort.direction } : null;
    }

    this.getAllGroupOfSchools();
  }

  resetSelection() {
    this.isReset = true;
    this.paginator.pageIndex = 0;
    this.sort.sort({ id: 'group_name', start: 'asc', disableClear: false });
    this.filteredValues = {
      group_name: '',
      headquarter: '',
      school_member: '',
      rncp_title: '',
    };

    this.groupNameFilter.setValue('', {emitEvent: false});
    this.headQuarterFilter.setValue('', {emitEvent: false});
    this.schoolMemberFilter.setValue('', {emitEvent: false});
    this.rncpTitleFilter.setValue('', {emitEvent: false});

    this.sort.direction = 'asc';
    this.sort.active = 'group_name';
    this.sortValue = { group_name: 'asc' };
    // this.sortValue = null;
    this.getAllGroupOfSchools();
  }

  onAddGroupSchool() {
    const dialogRef = this.dialog.open(AddGroupOfSchoolDialogComponent, {
      width: '660px',
      // minHeight: '100px',
      panelClass: 'no-padding-pop-up',
      disableClose: true,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getAllGroupOfSchools();
      }
    });
  }

  editGroupOfSchool(groupData) {

    const dialogRef = this.dialog.open(AddGroupOfSchoolDialogComponent, {
      width: '660px',
      // minHeight: '100px',
      panelClass: 'no-padding-pop-up',
      disableClose: true,
      data: groupData,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.getAllGroupOfSchools();
      }
    });
  }

  deleteGroupOfSchool(groupId) {
    let timeDisabled = 6;
    Swal.fire({
      type: 'warning',
      title: 'Are you sure?',
      html: this.translate.instant('This action will delete group of school'),
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('Confirm'),
      cancelButtonText: this.translate.instant('Cancel'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('Confirm') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('Confirm');
          Swal.enableConfirmButton();
          clearInterval(this.intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      if (result.value) {
        this.subs.sink = this.schoolService.deleteGroupOfSchool(groupId).subscribe(
          (resp) => {

            Swal.fire({
              type: 'success',
              title: 'Bravo',
              allowOutsideClick: false,
            }).then(() => {
              this.getAllGroupOfSchools();
            });
          },
          (err) => {
            Swal.fire({
              type: 'error',
              title: 'This school group is already assign by users',
              allowOutsideClick: false,
            });
          },
        );
      }
    });
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

  renderTooltipSchoolMember(schools: any[]): string {
    let tooltip = '';
    let count = 0;
    for (const school of schools) {
      count++;
      if (count > 2) {
        tooltip = tooltip + ', ';
        tooltip = tooltip + `${school.short_name}`;
      } else {
        tooltip = tooltip + `${school.short_name}`;
      }
    }
    return tooltip;
  }

  renderTooltipTitle(titles: any[]): string {
    let tooltip = '';
    let count = 0;
    for (const title of titles) {
      count++;
      if (count > 2) {
        tooltip = tooltip + ', ';
        tooltip = tooltip + `${title.short_name}`;
      } else {
        tooltip = tooltip + `${title.short_name}`;
      }
    }
    return tooltip;
  }

  showAddSchoolGroup() {
    return this.permissionService.showAddGroupofSchoolPerm();
  }

  showEditSchoolGroup() {
    return this.permissionService.showEditGroupofSchoolPerm();
  }

  showDeleteSchoolGroup() {
    return this.permissionService.showDeleteGroupofSchoolPerm();
  }

  ngOnDestroy() {
    this.pageTitleService.setTitle('');
    this.subs.unsubscribe();
  }
}
