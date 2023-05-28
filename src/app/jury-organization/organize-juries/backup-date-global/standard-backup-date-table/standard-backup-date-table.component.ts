import { Component, OnInit, ViewChild } from '@angular/core';
import { UntypedFormArray } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { MyErrorStateMatcher } from 'app/service/customvalidator.validator';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-standard-backup-date-table',
  templateUrl: './standard-backup-date-table.component.html',
  styleUrls: ['./standard-backup-date-table.component.scss']
})
export class StandardBackupDateTableComponent implements OnInit {
  private subs = new SubSink();
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @ViewChild(MatTable, { static: true }) table: MatTable<any>;
  @ViewChild('f', { static: false }) form: any;

  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['startDate', 'startTime', 'breakTime', 'breakDuration', 'numberOfSession', 'endTime', 'action'];

  dummyFormArray: UntypedFormArray;

  juryOrgId;

  initialJuryDataHolder = [];
  juryDataHolder = [];

  matcher = new MyErrorStateMatcher();

  minDate: Date;

  constructor() { }

  ngOnInit() {
  }

  addDate() {
    this.juryDataHolder.push({
      break_duration: 60,
      break_time: '12:00',
      date_start: '',
      number_students: null,
      start_time: '09:00',
      end_time: '',
      tempDate: '',
      // test_id: this.testId,
    });
    this.table.renderRows();
  }

  deleteDate(index) {
    this.juryDataHolder.pop();
  }

  checkIsFormInvalid() {
    if (this.form && this.form.valid) {
      return false;
    } else {
      return true;
    }
  }

}
