import { AfterViewInit, Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { TranslateService } from '@ngx-translate/core';
import { CertificationRuleService } from 'app/service/certification-rule/certification-rule.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { debounceTime, map, tap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { FormControl } from '@angular/forms';
import * as moment from 'moment';

@Component({
  selector: 'ms-pc-certification-result',
  templateUrl: './pc-certification-result.component.html',
  styleUrls: ['./pc-certification-result.component.scss']
})
export class PcCertificationResultComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  @Input() rncpId;
  @Input() classId;
  private subs = new SubSink();

  dataSource = new MatTableDataSource([]);
  noData;
  dataCount = 0;
  isWaitingForResponse = false;
  sortValue;

  displayedColumns = ['school', 'pcAt', 'signee', 'status', 'signedAt'];
  filterColumns = ['schoolFilter', 'pcAtFilter', 'signeeFilter', 'statusFilter', 'signedAtFilter'];
  filteredValues = {
    signee: '',
    school_name: '',
    pc_at: '',
    status: null,
    signed_at: ''
  }
  userCertificationPC = [];
  schoolDropdownListOri = [];
  schoolDropdownList = [];
  statusList = [
    {value: 'not_receive'},
    {value: 'not_signed'},
    {value: 'signed'},
  ];

  schoolFilter = new FormControl('');
  pcAtFilter = new FormControl('');
  signeeFilter = new FormControl('');
  statusFilter = new FormControl('');
  signedAtFilter = new FormControl('');
  
  constructor(public translate: TranslateService, private certificationRuleService: CertificationRuleService, private rncpTitlesService: RNCPTitlesService) { }

  ngOnInit(): void {
    this.getSchoolDropdown();
    this.initFilter();
    this.getAllUserCertificationPC();
  }

  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        tap(() => {
          this.getAllUserCertificationPC();
        }),
      )
      .subscribe();
  }

  getAllUserCertificationPC() {
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.isWaitingForResponse = true;
    this.subs.sink = this.certificationRuleService.getAllUserCertificationPC(this.rncpId, this.classId, pagination, this.filteredValues, this.sortValue).subscribe(
      (resp) => {
        if(resp) {
          this.isWaitingForResponse = false;
          this.userCertificationPC = resp;
          this.dataSource.data = this.userCertificationPC;
          this.dataCount = this.userCertificationPC?.length ? this.userCertificationPC[0].count_document : 0;
        } else {
          this.isWaitingForResponse = false;
          this.dataSource.data = [];
          this.dataCount = 0;
        }
        this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
      },
      (err) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      }
    )
  }

  getSchoolDropdown() {
    this.subs.sink = this.rncpTitlesService.getSchoolListByClass(this.rncpId, this.classId).subscribe(
      (resp) => {
        if(resp) {
          let schools = _.cloneDeep(resp);
          schools = _.sortBy(schools, 'short_name');
          this.schoolDropdownListOri = schools;
          this.schoolDropdownList = schools;
        } else {
          this.schoolDropdownListOri = [];
          this.schoolDropdownList = [];
        }
      },
      (err) => {
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      }
    )
  }

  initFilter() {
    this.subs.sink = this.schoolFilter.valueChanges.subscribe((school) => {
      this.filteredValues.school_name = school ? school : '';
      this.paginator.pageIndex = 0;
      this.getAllUserCertificationPC();
    });

    this.subs.sink = this.pcAtFilter.valueChanges.subscribe((date) => {
      const dateValue = moment(date).format('DD/MM/YYYY');
      this.filteredValues.pc_at = dateValue ? dateValue : '';
      this.paginator.pageIndex = 0;
      this.getAllUserCertificationPC();
    });

    this.subs.sink = this.signeeFilter.valueChanges.pipe(debounceTime(500)).subscribe((signee) => {
      this.filteredValues.signee = signee ? signee : '';
      this.paginator.pageIndex = 0;
      this.getAllUserCertificationPC();
    });

    this.subs.sink = this.statusFilter.valueChanges.subscribe((status) => {
      this.filteredValues.status = status ? status : null;
      this.paginator.pageIndex = 0;
      this.getAllUserCertificationPC();
    });

    this.subs.sink = this.signedAtFilter.valueChanges.subscribe((date) => {
      const dateValue = moment(date).format('DD/MM/YYYY');
      this.filteredValues.signed_at = dateValue ? dateValue : '';
      this.paginator.pageIndex = 0;
      this.getAllUserCertificationPC();
    });
  }

  sortData(sort: Sort) {
    if (sort.active === 'school_name') {
      this.sortValue = sort.direction ? { school_name: sort.direction } : null;
    } else if (sort.active === 'pc_at') {
      this.sortValue = sort.direction ? { pc_at: sort.direction } : null;
    } else if (sort.active === 'signee') {
      this.sortValue = sort.direction ? { signee: sort.direction } : null;
    } else if (sort.active === 'status') {
      this.sortValue = sort.direction ? { status: sort.direction } : null;
    } else if (sort.active === 'signed_at') {
      this.sortValue = sort.direction ? { signed_at: sort.direction } : null;
    }
    this.paginator.pageIndex = 0;
    this.getAllUserCertificationPC();
  }

  reset() {
    this.schoolFilter.setValue('', {emitEvent: false});
    this.pcAtFilter.setValue('', {emitEvent: false});
    this.signeeFilter.setValue('', {emitEvent: false});
    this.statusFilter.setValue('', {emitEvent: false});
    this.signedAtFilter.setValue('', {emitEvent: false});
    this.filteredValues = {
      signee: '',
      school_name: '',
      pc_at: '',
      status: null,
      signed_at: ''
    };
    this.paginator.pageIndex = 0;
    this.sort.direction = '';
    this.sort.active = '';
    this.sortValue = null;
    this.getAllUserCertificationPC();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

}
