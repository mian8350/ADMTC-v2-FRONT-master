import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { Observable } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-president-juries-list-table',
  templateUrl: './president-juries-list-table.component.html',
  styleUrls: ['./president-juries-list-table.component.scss'],
})
export class PresidentJuriesListTableComponent implements OnInit, OnDestroy {
  @Input() juryOrgId;
  @Output() selectPresident = new EventEmitter<string>();
  @Output() selectGlobalId = new EventEmitter<string>();
  @Input() isSaved;
  private subs = new SubSink();
  dataSource = new MatTableDataSource([]);
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;

  displayedColumns: string[] = ['president_of_jury', 'status', 'action'];
  filterColumns: string[] = ['presidentFilter', 'statusFilter', 'actionFilter'];
  isWaitingForResponse: boolean = false;

  presidentFilter = new UntypedFormControl('');

  statusList = [
    {
      key: 'AllM',
      name: 'AllM',
    },
    {
      key: 'Has Backup',
      name: 'has_backup',
    },
    {
      key: 'Has no Backup',
      name: 'hasnt_backup',
    },
  ];
  filteredStatus: Observable<any[]>;
  statusFilter = new UntypedFormControl('AllM');

  dataCount: number;
  noData: any;

  filteredValues = {
    president: '',
    status: '',
  };

  backupScheduleId;

  constructor(private juryOrganizationService: JuryOrganizationService) {}

  ngOnInit() {
    // const dummyData = {
    //   president: 'Mr Ana',
    //   hasBackup: true,
    // };
    // let number = 1;
    // let data = [];
    // while (number <= 5) {
    //   data.push(dummyData);
    //   number++;
    // }
    // const dummyData2 = {
    //   president: 'Mr Fail',
    //   hasBackup: false,
    // };
    // data.push(dummyData2);

    this.getPresidentJuryList();
  }

  ngOnChanges() {
    if (this.isSaved) {
      this.getPresidentJuryList();
    }
  }

  getPresidentJuryList() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.juryOrganizationService.getPresidentJuryListGlobalBackupSchedule(this.juryOrgId).subscribe(
      (resp) => {
        if (resp && resp.president_of_juries && resp.president_of_juries.length) {


          this.backupScheduleId = resp._id;
          this.isWaitingForResponse = false;
          const data = resp.president_of_juries;
          // this.subs.sink = this.jury
          this.dataCount = data.length;
          this.dataSource.data = data;
          this.dataSource.paginator = this.paginator;
          this.subs.sink = this.presidentFilter.valueChanges.pipe(debounceTime(200)).subscribe((pres) => {

            if (pres === '' || pres) {
              this.filteredValues.president = pres;
              this.dataSource.filter = JSON.stringify(this.filteredValues);
            }
          });
          this.subs.sink = this.statusFilter.valueChanges.subscribe((stat) => {

            if (stat) {
              this.filteredValues.status = stat;
              this.dataSource.filter = JSON.stringify(this.filteredValues);
            }
          });
          this.dataSource.filterPredicate = this.customFilterPredicate();
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  customFilterPredicate() {
    return function (data, filter: string): boolean {
      const searchString = JSON.parse(filter);



      const nameFound =
        searchString.president === ''
          ? data
          : (data.president_of_jury_id.last_name + ' ' + data.president_of_jury_id.first_name)
              .toString()
              .trim()
              .toLowerCase()
              .indexOf(searchString.president.toLowerCase()) !== -1;

      let statusFound;
      if (searchString.status === 'AllM' || searchString.status === '') {
        statusFound = true;
      } else if (searchString.status === 'has_backup') {
        statusFound = data.dates.length > 0;
      } else if (searchString.status === 'hasnt_backup') {
        statusFound = data.dates.length === 0;
      }

      return statusFound && nameFound;
    };
  }

  openPresidentJury(president) {

    if (president && president.president_of_jury_id && president.president_of_jury_id._id) {
      this.selectPresident.emit(president.president_of_jury_id._id);
      this.selectGlobalId.emit(this.backupScheduleId);
    } else {
      this.selectPresident.emit(null);
    }
    // this.selectPresident.
  }

  resetSelection() {
    this.presidentFilter.patchValue('', { emitEvent: false });
    this.statusFilter.patchValue('AllM', { emitEvent: false });
    this.filteredValues = {
      president: '',
      status: '',
    };
    this.dataSource.filter = JSON.stringify(this.filteredValues);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
