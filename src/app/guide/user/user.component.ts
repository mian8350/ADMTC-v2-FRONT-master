import { UserService } from './../../service/user/user.service';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatSort, MatSortable } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import { ExportCsvService } from './../../service/export-csv/export-csv.service';
import Swal from 'sweetalert2';
import { CustomValidators } from 'ng2-validation';
import { SelectionModel } from '@angular/cdk/collections';
import { SubSink } from 'subsink';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-user',
  templateUrl: './user.component.html',
  styleUrls: ['./user.component.scss'],
})
export class UserComponent implements OnInit, OnDestroy {
  displayedColumns: string[] = ['select', 'lastName', 'cide', 'school', 'advisor', 'etablissement', 'status', 'action'];
  filterColumns: string[] = [
    'selectFilter',
    'lastNameFilter',
    'cideFilter',
    'schoolFilter',
    'advisorFilter',
    'etablissementFilter',
    'statusFilter',
    'actionFilter',
  ];
  dataSource = new MatTableDataSource([]);
  selection = new SelectionModel<any>(true, []);

  nameFilter = new UntypedFormControl();
  etablissementFilter = new UntypedFormControl();
  cideFilter = new UntypedFormControl('all');
  schoolFilter = new UntypedFormControl('all');
  advisorFilter = new UntypedFormControl('all');
  statusFilter = new UntypedFormControl('all');
  exportName: 'Export';
  filteredValues = {
    name: '',
    etablissement: '',
    cide: 'all',
    school: 'all',
    advisor: 'all',
    status: 'all',
  };

  userForm: UntypedFormGroup;
  operation = 'Add';
  selectedIndex = null;
  userEntities: any[];
  private subs = new SubSink();

  @ViewChild(MatSort, { static: true }) sort: MatSort;
  private intVal: any;
  private timeOutVal: any;

  constructor(
    private fb: UntypedFormBuilder,
    private userService: UserService,
    private exportCsvService: ExportCsvService,
    private translate: TranslateService,
  ) {}
  ngOnInit() {
    this.subs.sink = this.userService.getUsers().subscribe((users: any) => {
      this.dataSource.data = users;
    });
    this.sort.sort({ id: 'lastName', start: 'asc' } as MatSortable);
    this.dataSource.sort = this.sort;

    this.subs.sink = this.nameFilter.valueChanges.subscribe((name) => {
      this.filteredValues['name'] = name;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.etablissementFilter.valueChanges.subscribe((etablissement) => {
      this.filteredValues['etablissement'] = etablissement;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.subs.sink = this.cideFilter.valueChanges.subscribe((cide) => {
      this.filteredValues['cide'] = cide;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.schoolFilter.valueChanges.subscribe((school) => {
      this.filteredValues['school'] = school;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.advisorFilter.valueChanges.subscribe((advisor) => {
      this.filteredValues['advisor'] = advisor;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });
    this.subs.sink = this.statusFilter.valueChanges.subscribe((status) => {
      this.filteredValues['status'] = status;
      this.dataSource.filter = JSON.stringify(this.filteredValues);
    });

    this.dataSource.filterPredicate = this.customFilterPredicate();

    this.createForm();
  }

  /** Whether the number of selected elements matches the total number of rows. */
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.data.length;
    return numSelected === numRows;
  }

  /** Selects all rows if they are not all selected; otherwise clear selection. */
  masterToggle() {
    this.isAllSelected() ? this.selection.clear() : this.dataSource.data.forEach((row) => this.selection.select(row));
  }

  /** The label for the checkbox on the passed row */
  checkboxLabel(row?: any): string {
    if (!row) {
      return `${this.isAllSelected() ? 'select' : 'deselect'} all`;
    }
    return `${this.selection.isSelected(row) ? 'deselect' : 'select'} row ${row.position + 1}`;
  }

  customFilterPredicate() {
    return function (data, filter: string): boolean {
      const searchString = JSON.parse(filter);
      const civilityFound = data.civility.toString().trim().toLowerCase().indexOf(searchString.name.toLowerCase()) !== -1;
      const firstNameFound = data.firstName.toString().trim().toLowerCase().indexOf(searchString.name.toLowerCase()) !== -1;
      const lastNameFound = data.lastName.toString().trim().toLowerCase().indexOf(searchString.name.toLowerCase()) !== -1;
      const etablissementFound =
        data.etablissement.toString().trim().toLowerCase().indexOf(searchString.etablissement.toLowerCase()) !== -1;

      const cideFound =
        searchString.cide.toLowerCase() === 'all'
          ? true
          : data.cide.toString().trim().toLowerCase().indexOf(searchString.cide.toLowerCase()) !== -1;

      const schoolFound =
        searchString.school.toLowerCase() === 'all'
          ? true
          : data.school.toString().trim().toLowerCase().indexOf(searchString.school.toLowerCase()) !== -1;

      const advisorFound =
        searchString.advisor.toLowerCase() === 'all'
          ? true
          : data.advisor.toString().trim().toLowerCase().indexOf(searchString.advisor.toLowerCase()) !== -1;

      const statusFound =
        searchString.status.toLowerCase() === 'all'
          ? true
          : data.status.toString().trim().toLowerCase().indexOf(searchString.status.toLowerCase()) !== -1;

      return (
        (civilityFound || firstNameFound || lastNameFound) && etablissementFound && cideFound && schoolFound && advisorFound && statusFound
      );
    };
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

  addUser() {
    if (this.operation === 'Update' && this.selectedIndex > -1) {
      this.dataSource.data[this.selectedIndex] = this.userForm.getRawValue();
      this.operation = 'Add';
      this.selectedIndex = -1;
    } else {
      this.dataSource.data.push(this.userForm.getRawValue());
    }
    this.dataSource.filter = '';
    this.userForm.reset();
    Swal.close();
  }

  editUser(index) {
    this.selectedIndex = index;
    this.operation = 'Update';
    this.userForm.patchValue(this.dataSource.data[index]);
  }

  removeUser(event) {
    let timeDisabled = 5;
    Swal.fire({
      allowOutsideClick: false,
      title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
      html: this.translate.instant('this action will delete user !'),
      type: 'warning',
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);
        clearInterval(this.timeOutVal);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(this.intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      clearTimeout(this.timeOutVal);
      if (res.value) {
        this.dataSource.data.splice(this.selectedIndex, 1);
        this.dataSource.filter = '';
        Swal.fire({
          type: 'success',
          title: this.translate.instant('EVENT_S1.TITLE'),
          html: this.translate.instant('user deleted'),
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          allowOutsideClick: false,
        });
      }
    });
  }

  removeUserCancel(event) {
    this.operation = 'Add';
    this.selectedIndex = -1;
  }

  addUserCancel() {
    this.operation = 'Add';
    this.selectedIndex = -1;
    this.userForm.reset();
  }

  persistElementIndex(index) {
    this.selectedIndex = index;
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    clearInterval(this.intVal);
    this.subs.unsubscribe();
  }

  exportData() {
    /**create array of headerdata if want to send header data from UI if not increase row by 1 in A1 notation
    in params = {'range' : ''}*/
    const header = ['Civility', 'FirstName', 'LastName', 'CIDE', 'School', 'Advisor', 'Establissment', 'Status'];
    let data = [];
    // data.push(header);
    if (this.selection.selected.length) {
      for (let item of this.selection.selected) {
        let obj = [];
        obj[0] = item.school;
        obj[4] = item.civility;
        obj[5] = item.firstName;
        obj[6] = item.lastName;
        data.push(obj);
      }
      let valueRange = { values: data };
      let today = moment().format('DD-MM-YYYY');
      let title = this.exportName + '_' + today;
      let sheetData = {
        spreadsheetId: '1X_RhkiMkoPkQyGBkDQdOnxNy-AexE-bknh-OCf_nc9k',
        sheetId: 1283597750,
        range: 'A6',
      };
      this.exportCsvService.createAndUpdateSpreadsheet(valueRange, title, sheetData);
      Swal.close();
    }
  }
}
