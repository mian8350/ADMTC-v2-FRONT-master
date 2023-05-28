import { UntypedFormControl } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort, Sort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { SubSink } from 'subsink';
import { CompanyService } from 'app/service/company/company.service';
import { cloneDeep } from 'lodash';
import { debounceTime, map } from 'rxjs/operators';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'ms-entity-branches-tab',
  templateUrl: './entity-branches-tab.component.html',
  styleUrls: ['./entity-branches-tab.component.scss'],
})
export class EntityBranchesTabComponent implements OnInit {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  currentUser: any;
  isUserAdmtc: any;
  isUserAcadir: boolean;
  isUserAcadAdmin: boolean;
  userLogin: string;
  school_id: any;
  _entityRC: string;
  _entityId: string;
  sortValue: { [x: string]: "asc" | "desc"; };
  @Input() set entityRC(siren: string) {
    this._entityRC = siren;
    this.branches = [];
    siren ? this.getCurrentUserDetail(siren) : null;
  }
  @Input() set companyId(entityId: string) {
    this._entityId = entityId;
    // entityId ? this.getCurrentUserDetail(entityId) : null;
  }
  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = ['Siret', 'Branch', 'Address', 'Action'];
  filterColumns: string[] = ['SiretFilter', 'BranchFilter', 'AddressFilter', 'ActionFilter'];
  dataCount = 0;
  siretFilter = new UntypedFormControl('');
  addressFilter = new UntypedFormControl('');
  branchFilter = new UntypedFormControl(null);
  _subs = new SubSink();
  isWaitingForResponse = false;
  noData: any;
  filteredValues = {
    no_RC: null,
    company_name: null,
    company_address: null,
  };
  branches = [];

  constructor(
    private companyService: CompanyService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private utilService: UtilityService,
    private router: Router,
  ) {}

  get entityRC() {
    return this._entityRC;
  }

  get entityId() {
    return this._entityId;
  }

  ngOnInit() {
    this.initFilters();
  }

  // getAllBranchesOfEntity(entityId: string) {
  //   this.isWaitingForResponse = true;
  //   this._subs.sink = this.companyService.GetAllBranchesOfCompanyEntity(entityId).subscribe((resp: any) => {
  //     if (resp) {
  //       this.dataSource.data = cloneDeep(resp.company_branches_id);
  //       this.dataCount =
  //         resp.company_branches_id && resp.company_branches_id.length && resp.company_branches_id[0].count_document
  //           ? resp.company_branches_id[0].count_document
  //           : 0;
  //     }
  //     this.isWaitingForResponse = false;
  //     this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
  //   });
  // }

  getCurrentUserDetail(siren: string) {
    this.currentUser = this.authService.getLocalStorageUser();
    this.isUserAdmtc = this.utilService.isUserEntityADMTC();
    this.isUserAcadir = this.utilService.isUserAcadir();
    this.isUserAcadAdmin = this.utilService.isUserAcadAdmin();
    if (this.isUserAdmtc) {
      this.userLogin = 'admtc';
    } else {
      this.userLogin = 'acad';
      this.school_id = this.currentUser.entities[0].school._id;
    }
    this.getAllBranchesOfEntity(siren);
  }

  getAllBranchesOfEntity(siren: string) {
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    this.isWaitingForResponse = true;
    const searchValue = siren;
    this._subs.sink = this.companyService
      .getAllCompanies(searchValue, pagination, this.school_id, this.userLogin, this.filteredValues, this.sortValue)
      .subscribe(
        (resp) => {
          if (resp) {
            this.dataSource.data = cloneDeep(resp);
            this.branches = cloneDeep(resp);
            this.branches = this.branches.sort((a,b)=> (a.company_name>b.company_name?1 : a.company_name<b.company_name? -1:0 ) )
            this.paginator.length = resp && resp.length && resp[0].count_document ? resp[0].count_document : 0;
            this.dataCount = resp && resp.length && resp[0].count_document ? resp[0].count_document : 0;
          } else {
            this.dataSource.data = [];
            this.paginator.length = 0;
          }
          this.noData = this.dataSource.connect().pipe(map((data) => data.length === 0));
          this.isWaitingForResponse = false;
        },
        (err) => {
          this.isWaitingForResponse = false;
          this.dataSource.data = [];
          this.paginator.length = 0;
          this.authService.postErrorLog(err);

        },
      );
  }

  initFilters() {
    this._subs.sink = this.siretFilter.valueChanges.pipe(debounceTime(500)).subscribe((value) => {
      this.filteredValues.no_RC = value;
      this.paginator.pageIndex = 0;
      this.getAllBranchesOfEntity(this.entityRC);
    });

    this._subs.sink = this.addressFilter.valueChanges.pipe(debounceTime(500)).subscribe((value) => {
      this.filteredValues.company_address = value;
      this.paginator.pageIndex = 0;
      this.getAllBranchesOfEntity(this.entityRC);
    });

    this._subs.sink = this.branchFilter.valueChanges.subscribe((value) => {
      this.filteredValues.company_name = value;
      this.paginator.pageIndex = 0;
      this.getAllBranchesOfEntity(this.entityRC);
    });
  }

  sortData(sort: Sort) {
    this.sortValue = sort.direction ? { [sort.active]: sort.direction ? sort.direction : `asc` } : null;
      this.paginator.pageIndex = 0;
      this.getAllBranchesOfEntity(this.entityRC);
  }

  reset() {
    this.filteredValues = {
      no_RC: null,
      company_name: null,
      company_address: null,
    };
    this.sortValue = null;

    this.siretFilter.patchValue(null, { emitEvent: false });
    this.addressFilter.patchValue(null, { emitEvent: false });
    this.branchFilter.patchValue(null, { emitEvent: false });

    this.getAllBranchesOfEntity(this.entityRC);
  }

  viewBranchDetail(siret: string) {
    this.router.navigate(['../branches'], { relativeTo: this.route, queryParams: { siren: this.entityRC, siret: siret } });
  }
}
