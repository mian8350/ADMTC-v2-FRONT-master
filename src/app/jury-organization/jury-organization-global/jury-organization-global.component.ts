import { Component, OnInit, ViewChild, OnDestroy, AfterViewInit } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { MatDialog, MatDialogRef, MatDialogConfig } from '@angular/material/dialog';
import { RNCPTitlesService } from '../../service/rncpTitles/rncp-titles.service';
import { UsersService } from 'app/service/users/users.service';
import { SubSink } from 'subsink';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { SelectionModel } from '@angular/cdk/collections';
import { JuryOrganizationDialogComponent } from '../jury-organization-dialog/jury-organization-dialog.component';
import { Observable, of } from 'rxjs';
import { debounceTime, map, startWith, tap } from 'rxjs/operators';
import { ReplyUrgentMessageDialogComponent } from 'app/mailbox/reply-urgent-message-dialog/reply-urgent-message-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { Router } from '@angular/router';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { UtilityService } from 'app/service/utility/utility.service';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/service/auth-service/auth.service';
@Component({
  selector: 'ms-jury-organization-global',
  templateUrl: './jury-organization-global.component.html',
  styleUrls: ['./jury-organization-global.component.scss'],
})
export class JuryOrganizationGlobalComponent implements OnInit, AfterViewInit, OnDestroy {
  replyUrgentMessageDialogComponent: MatDialogRef<ReplyUrgentMessageDialogComponent>;
  displayedColumns: string[] = ['name', 'title', 'status', 'action'];
  filterColumns: string[] = ['nameFilter', 'titleFilter', 'statusFilter', 'actionFilter'];
  dataSource = new MatTableDataSource([]);
  noData: any;
  juryDialogComponent: MatDialogRef<JuryOrganizationDialogComponent>;
  selection = new SelectionModel<any>(true, []);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  private subs = new SubSink();
  titlesArray: any[] = [];
  filteredTitles: Observable<string[]>;
  nameFilter = new UntypedFormControl('');

  titleFilter = new UntypedFormControl('');
  rncpTitleFilterList = [];
  filteredRncpTitle: Observable<string[]>;

  filteredValues = {
    name: '',
    rncp_title: '',
  };

  configCat: MatDialogConfig = {
    disableClose: true,
    width: '55%',
    height: '68%',
  };
  userForm: UntypedFormGroup;
  operation = 'Add';
  selectedIndex = null;
  isWaitingForResponse = false;
  userEntities: any[];
  sortValue = null;
  dataCount = 0;
  LoggedInUserTypeId: string;

  constructor(
    private fb: UntypedFormBuilder,
    private usersService: UsersService,
    public dialog: MatDialog,
    private mailboxService: MailboxService,
    public permissionService: PermissionService,
    private router: Router,
    private juryService: JuryOrganizationService,
    private utilService: UtilityService,
    private translate: TranslateService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    // this.subs.sink = this.usersService.getUserDetails().subscribe((users: any) => {
    //   this.dataSource.data = users;
    // });

    this.getAllJuryOrganizationData();
    this.getAllTitlesDropdown();


    this.subs.sink = this.nameFilter.valueChanges.pipe(debounceTime(500)).subscribe(name => {
      this.filteredValues['name'] = name;
      this.paginator.pageIndex = 0;
      this.getAllJuryOrganizationData();
      // this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.titleFilter.valueChanges.pipe(debounceTime(500)).subscribe(input => {
      if (typeof input === 'string') {
        const result = this.rncpTitleFilterList.filter((title) =>
          this.utilService.simplifyRegex(title.short_name).includes(this.utilService.simplifyRegex(input)),
        );

        this.filteredRncpTitle = of(result);
      }
    });

    this.dataSource.filterPredicate = this.customFilterPredicate();
    // this.getUrgentMail();
  }

  ngAfterViewInit() {
    // this.dataSource.sort = this.sort;
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          this.getAllJuryOrganizationData();
          // if (!this.isReset) {
          //   this.getAllJuryOrganizationData();
          // }
          // this.dataLoaded = true;
        }),
      )
      .subscribe();
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

      const titleFound =
        data.title
          .toString()
          .trim()
          .toLowerCase()
          .indexOf(searchString.title.toLowerCase()) !== -1;

      return nameFound && titleFound;
    };
  }

  getAllJuryOrganizationData() {
    // get user type id first before get jury organization table data
    const loggedInUserType = this.authService.getPermission();
    if (loggedInUserType[0]) {
      this.isWaitingForResponse = true;
      this.usersService.getUserTypeId(loggedInUserType[0]).subscribe(resp => {
        this.isWaitingForResponse = false;
        if (resp && resp[0] && resp[0]._id) {
          this.LoggedInUserTypeId = resp[0]._id;
          this.getJuryOrganizationTableData();
        }
      })
    }
  }

  getJuryOrganizationTableData() {
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.isWaitingForResponse = true;
    this.subs.sink = this.juryService.getAllJuryOrganizationsList(
      pagination, this.sortValue,
      this.filteredValues,
      this.LoggedInUserTypeId
    ).subscribe(resp => {
      this.isWaitingForResponse = false;

      const response = _.cloneDeep(resp);
      this.dataSource.data = response;
      // this.dataSource.sort = this.sort;
      // this.dataSource.paginator = this.paginator;
      this.dataCount = response && response[0] && response[0].count_document ? response[0].count_document : 0;
      this.noData = this.dataSource.connect().pipe(map(data => data.length === 0));

    }, (err) => {
      this.isWaitingForResponse = false;
    })
  }

  getAllTitlesDropdown() {
    this.subs.sink = this.juryService.getTitleDropdownFilterList().subscribe(resp => {
      this.rncpTitleFilterList = _.cloneDeep(resp);
      this.filteredRncpTitle = of(this.rncpTitleFilterList);
    }, (err) => {
      this.isWaitingForResponse = false;
    })
  }

  setTitleFilter(titleId: string) {
    this.filteredValues['rncp_title'] = titleId;
    this.paginator.pageIndex = 0;
    this.getAllJuryOrganizationData();
  }

  sortData(sort: Sort) {
    this.sortValue = sort.active ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
    this.paginator.pageIndex = 0;
    this.getAllJuryOrganizationData();
    // if (this.dataLoaded) {
    //   this.paginator.pageIndex = 0;
    //   this.getAllJuryOrganizationsList();
    //   if (!this.isReset) {
    //     this.getAllJuryOrganizationsList();
    //   }
    // }
  }

  resetAllFilter() {
    this.filteredValues = {
      name: '',
      rncp_title: '',
    };
    // this.dataSource.filter = JSON.stringify(this.filteredValues);
    this.nameFilter.setValue('');
    this.titleFilter.setValue('');
  }

  JuryDialog(record) {
    this.dialog.open(JuryOrganizationDialogComponent, {
      disableClose: true,
      width: '650px',
      panelClass: 'certification-rule-pop-up',
    }).afterClosed().subscribe(result => {
      if (result) {
        this.getAllJuryOrganizationData();
      }
    })
  }

  editJuryDialog(data) {
    this.dialog.open(JuryOrganizationDialogComponent, {
      disableClose: true,
      width: '650px',
      panelClass: 'certification-rule-pop-up',
      data: {
        data: data
      }
    }).afterClosed().subscribe(result => {
      if (result) {
        this.getAllJuryOrganizationData();
      }
    })
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.dataSource.data.forEach(row => this.selection.select(row));
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  createForm() {
    this.userForm = this.fb.group({
      userEntity: [null],
      civility: [null, Validators.required],
      firstName: [null, Validators.required],
      lastName: [null],
      address: [null],
      mobilePhone: [null],
      email: [null, CustomValidators.email],
      position: [null],
    });
    this.userEntities = [
      {
        label: 'Admin',
        value: 'Admin',
      },
      {
        label: 'Advisor',
        value: 'Advisor',
      },
      {
        label: 'School',
        value: 'School',
      },
      {
        label: 'School User',
        value: 'School User',
      },
    ];
  }

  goToJuryDetail(juryOrgId) {
    this.router.navigate(['jury-organization/organize-juries', juryOrgId]);
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

  deleteJuryOrg(jury) {

    const juryId = jury._id;
    const juryName = jury.name;
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('Jury_S26.TITLE'),
      html: this.translate.instant('Jury_S26.TEXT', {juryName: juryName}),
      footer: `<span style="margin-left: auto">Jury_S26</span>`,
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant(
        'Jury_S26.BUTTON_YES'
      ),
      cancelButtonText: this.translate.instant(
        'Jury_S26.BUTTON_NO'
      ),
      onOpen: () => {
        Swal.disableConfirmButton();
        // const cancelBtnRef = swal.cancelButtonText;
        const confirmBtnRef = Swal.getConfirmButton();
        const time = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText =
            this.translate.instant('Jury_S26.BUTTON_YES') + ` (${timeDisabled})`;
          // cancelBtnRef.innerText = this.translate.instant('Jury_S26.PUBLISH.CANCEL');
        }, 1000);

        setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant(
            'Jury_S26.BUTTON_YES'
          );
          // Swal.showCancelButton = this.translate.instant(
          //   'Jury_S26.BUTTON_NO'
          // );
          Swal.enableConfirmButton();
          clearTimeout(time);
        }, timeDisabled * 1000);
      }
    }).then((result) => {
      if (result) {
        const deleteJuryOrg = this.juryService.deleteJuryOrganization(juryId).subscribe(resp => {
          if (resp && resp.status) {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Jury_S26b.TITLE'),
              text: this.translate.instant('Jury_S26b.TEXT', {juryName: juryName}),
              footer: `<span style="margin-left: auto">Jury_S26b</span>`,
              confirmButtonText: this.translate.instant('Jury_S26b.BUTTON')
            }).then(() => {
              this.getAllJuryOrganizationData();
            })
          }
        })
        this.subs.add(deleteJuryOrg);
      }
    })
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
