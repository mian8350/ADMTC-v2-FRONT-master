import { AfterViewInit, Component, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { SubSink } from 'subsink';
import { UntypedFormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { TranslateService } from '@ngx-translate/core';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { UserService } from 'app/service/user/user.service';
import * as _ from 'lodash';
import { map, startWith, tap } from 'rxjs/operators';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { SchoolService } from 'app/service/schools/school.service';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { UserEmailDialogComponent } from 'app/users/user-email-dialog/user-email-dialog.component';

@Component({
  selector: 'ms-title-manager-follow-up-school',
  templateUrl: './title-manager-follow-up-school.component.html',
  styleUrls: ['./title-manager-follow-up-school.component.scss'],
})
export class TitleManagerFollowUpSchoolComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {
  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['selection', 'school_short_name', 'task_academic_director_late', 'task_student_late', 'actions'];
  filterColumns: String[] = ['selectFilter', 'schoolFilter', 'taskAcadFilter', 'taskStudent', 'actionFilter'];
  dataCount: number;
  noData: any;
  isLoading: Boolean;
  tasks: any[];
  testColumns = [];
  titleId: string;
  classId: string;
  sortValue: any = null;
  dataColumnStatus: any;
  dataLoaded: boolean = false;
  isFirstCall: boolean = true;

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  mailUser: MatDialogRef<UserEmailDialogComponent>;

  private subs: SubSink = new SubSink();
  schoolFilterList = [];
  schoolFilter = new UntypedFormControl(null);

  filteredValues = {
    school_id: null,
    task_builder_id: null,
    task_status: null,
  };

  taskFilterDropdown = [
    { value: '', key: 'AllM' },
    { value: 'done', key: 'Task Done' },
    { value: 'not_done', key: 'Task Not Done' },
    { value: 'no_task', key: 'No Task' },
  ];

  taskDynamic = [];

  selection = new SelectionModel<any>(true, []);
  isCheckedAll = false;
  disabledButton = true;

  constructor(
    private route: ActivatedRoute,
    private schoolService: SchoolService,
    private pageTitleService: PageTitleService,
    private academicKitService: AcademicKitService,
    public dialog: MatDialog,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.pageTitleService.setTitle('General Follow Up');
    this.getMetaDataFromURL();
    this.getSchoolDropdownList();
    this.populateDataSource();
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        startWith(null),
        tap(() => {
          if (this.dataLoaded) this.populateDataSource();
        }),
      )
      .subscribe();
  }

  ngOnChanges() {}

  ngOnDestroy() {
    this.pageTitleService.setTitle('');
    this.subs.unsubscribe();
  }

  getMetaDataFromURL() {
    this.titleId = this.route.snapshot.params['titleId'];
    this.classId = this.route.snapshot.params['classId'];
  }

  getSchoolDropdownList() {
    const schoolType = 'preparation_center';
    this.subs.sink = this.schoolService.getAllSchoolAsDropdownList(schoolType, this.titleId, this.classId).subscribe((response) => {
      if (response) {
        this.schoolFilterList = response;
        this.schoolFilterList.sort((a: any, b: any) => a.short_name.localeCompare(b.short_name));

      }
    });
  }

  selectSchool() {
    this.filteredValues.school_id = this.schoolFilter.value ? this.schoolFilter.value : null;
    this.paginator.pageIndex = 0;
    this.populateDataSource();
  }

  populateDataSource() {
    const payload = {
      titleId: this.titleId,
      classId: this.classId,
    };
    const filter = _.cloneDeep(this.filteredValues);
    const pagination = {
      page: this.paginator.pageIndex,
      limit: 10,
    };
    const sorting = this.sortValue;

    this.isLoading = true;
    this.dataLoaded = false;
    this.subs.sink = this.schoolService.getAllSchoolTaskProgress(payload, filter, pagination, sorting).subscribe((response) => {
      if (response) {
        this.dataSource.data = _.cloneDeep(response);
        this.isLoading = false;
        this.dataLoaded = true;
        this.paginator.length = response && response.length && response[0].count_document ? response[0].count_document : 0;
        this.dataCount = response && response.length && response[0].count_document ? response[0].count_document : 0;

        if (this.isFirstCall && response[0] && response[0].tasks && response[0].tasks.length) {
          this.isFirstCall = false;
          this.tasks = _.cloneDeep(response[0].tasks);
          this.dataColumnStatus = _.cloneDeep(response);
          this.testColumns = [];
          for (let i = 0; i < response[0].tasks.length; i++) {
            this.taskDynamic[`T${i}`] = '';
            this.testColumns.push((i + 1).toString());
            this.displayedColumns.splice(2 + i, 0, (i + 1).toString());
            this.filterColumns.splice(2 + i, 0, (i + 1).toString() + '_filter');
          }

        }
      }
    });
  }

  updateFilterTask(id, status) {
    if (status === '') {
      this.filteredValues.task_status = null;
    } else if (status === 'done') {
      this.filteredValues.task_status = 'done';
    } else if (status === 'not_done') {
      this.filteredValues.task_status = 'not_task_done';
    } else if (status === 'no_task') {
      this.filteredValues.task_status = 'no_task';
    }

    this.populateDataSource();
  }

  sortData($event: any) {

    if ($event.active && $event.active.includes('task_status')) {

      const status = $event.active.split('_')
      if (status && status.length && status[2]) {
        const taskStatus = {
          task_status: $event.direction ? $event.direction : `asc`,
          task_builder_id: status[2]
        }
        this.sortValue = $event.direction ? { acad_task_status: taskStatus } : null;
      }
    } else {
      this.sortValue = $event.direction ? { [$event.active]: $event.direction ? $event.direction : `asc` } : null;
    }
    // if ($event.active.split('-')[0] === 'step') {
    //   this.sortValue = { steps: { step_id: $event.active.split('-')[2], value: $event.direction ? $event.direction : `asc` }};
    // } else {
    //   this.sortValue = $event.active ? { [$event.active]: $event.direction ? $event.direction : `asc` } : null;
    // }
    if (this.dataLoaded) {
      this.paginator.pageIndex = 0;
      this.populateDataSource();
    }
  }

  reset() {
    this.dataLoaded = false;
    this.paginator.pageIndex = 0;
    this.filteredValues = {
      school_id: null,
      task_builder_id: null,
      task_status: null,
    };
    this.isCheckedAll = false;
    this.schoolFilter = new UntypedFormControl(null);
    for (const key of Object.keys(this.taskDynamic)) {
      this.taskDynamic[key] = '';
    }
    this.sortValue = null;

    this.populateDataSource();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows || numSelected > numRows;
  }

  selected() {
    const numSelected = this.selection.selected.length;
    numSelected > 0 ? (this.disabledButton = false) : (this.disabledButton = true);
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    if (this.isAllSelected()) {
      this.selection.clear();
      this.isCheckedAll = false;
    } else {
      this.selection.clear();
      this.isCheckedAll = true;
      this.dataSource.data.forEach((row) => this.selection.select(row));
    }
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  sendMail(data) {
    const dataMail = {
      school: data.school_id,
      rncp_title: data.rncp_title_id,
    };
    this.mailUser = this.dialog.open(UserEmailDialogComponent, {
      disableClose: true,
      width: '750px',
      data: { ...dataMail, sendToAcadir: true, titleManagerFollowUpSchool: true },
    });
  }

  sendMultipleMail() {
    const selectedData = this.selection.selected;
    let multipleMail = false;
    let schoolIds = [];

    if (selectedData.length > 1) {
      multipleMail = true;
    } else {
      multipleMail = false;
    }

    if (multipleMail) {
      selectedData.forEach((schoolId) => {
        schoolIds.push(schoolId.school_id._id);
      });
    } else {
      schoolIds = selectedData[0].school_id;
    }

    const dataMail = {
      school: schoolIds,
      rncp_title: selectedData[0].rncp_title_id,
    };

    this.mailUser = this.dialog.open(UserEmailDialogComponent, {
      disableClose: true,
      width: '750px',
      data: { ...dataMail, sendToAcadir: true, titleManagerFollowUpSchool: true, multipleMail },
    });
  }

  sendReminder(data) {
    const rncpId = data.rncp_title_id._id;
    const classId = data.class_id._id;
    const schoolId = [data.school_id._id];
    const schoolName = data.school_id.short_name;
    this.swalReminder(rncpId, classId, schoolId, schoolName);
  }

  sendReminderMultiple() {
    const selectedData = this.selection.selected;
    const rncpId = selectedData[0].rncp_title_id._id;
    const classId = selectedData[0].class_id._id;
    const schoolId = [];
    const schoolList = [];

    selectedData.forEach((school) => {
      schoolId.push(school.school_id._id);
      schoolList.push(school.school_id.short_name);
    });

    const schoolName = schoolList.join(', ');

    this.swalReminder(rncpId, classId, schoolId, schoolName);
  }

  swalReminder(rncpId, classId, schoolId, schoolName) {
    let timeout = 2;
    let confirmInterval;
    Swal.fire({
      type: 'warning',
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
      showCancelButton: true,
      title: this.translate.instant('REMINDER_S1.TITLE'),
      html: this.translate.instant('REMINDER_S1.TEXT', { schoolName: schoolName }),
      confirmButtonText: this.translate.instant('REMINDER_S1.BUTTON1'),
      cancelButtonText: this.translate.instant('REMINDER_S1.BUTTON2'),
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmButtonRef = Swal.getConfirmButton();
        confirmInterval = setInterval(() => {
          if (timeout > 0) {
            (confirmButtonRef.innerText = this.translate.instant(`REMINDER_S1.BUTTON1`) + ` (${timeout})`), timeout--;
          } else {
            Swal.enableConfirmButton();
            confirmButtonRef.innerText = this.translate.instant(`REMINDER_S1.BUTTON1`);
            clearInterval(confirmInterval);
          }
        }, 1000);
      },
    }).then((resp) => {
      if (resp.value) {
        const filter = _.cloneDeep(this.filteredValues);
        this.subs.sink = this.schoolService.sendReminderSchoolFollowUp(rncpId, classId, schoolId, filter).subscribe((confirm) => {
          Swal.fire({
            type: 'success',
            title: 'Bravo!',
            confirmButtonText: 'OK',
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then(() => {});
        });
      }
    });
  }

  setToolTip(status, element, i) {
    if (status === 'done') {
      return this.translate.instant('Task Done');
    } else {
      return this.translate.instant('Task Not Done');
    }
  }
}
