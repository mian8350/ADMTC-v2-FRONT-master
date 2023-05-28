import { CompanyHeaderBarComponent } from './../shared-company-components/company-header-bar/company-header-bar.component';
import { MatPaginator } from '@angular/material/paginator';
import { UtilityService } from 'app/service/utility/utility.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { CompanyService } from 'app/service/company/company.service';
import { Component, OnInit, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { tap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { ActivatedRoute } from '@angular/router';
import { cloneDeep } from 'lodash';
import { PageTitleService } from 'app/core/page-title/page-title.service';

@Component({
  selector: 'ms-company-branches',
  templateUrl: './company-branches.component.html',
  styleUrls: ['./company-branches.component.scss'],
})
export class CompanyBranchesComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  private subs = new SubSink();
  isWaitingForResponse = false;
  myInnerHeight = 1920;
  companies: any[] = [];
  isFirstLoad = true;
  siret: string;

  currentUser;
  userLogin;
  isUserAdmtc;
  isUserAcadir;
  isUserAcadAdmin;

  filteredValues = {
    no_RC: null,
    company_name: null,
  };
  search;
  mentorSearch;
  pageIndex = 0;
  school_id;
  dataCount = 0;
  refreshCompanyId;

  curSelected = null;
  curSelectedId = null;

  compId;

  constructor(
    private companyService: CompanyService,
    private authService: AuthService,
    private utilService: UtilityService,
    private route: ActivatedRoute,
    private pageTitleService: PageTitleService
  ) {}

  ngOnInit() {
    this.pageTitleService.setTitle('NAV.Companies Branches');
    this.companyService.filterCompany(null);
    this.companyService.filterMentor(null);
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
    this.subs.sink = this.route.queryParams.subscribe((params) => {
      if (params && params.hasOwnProperty('siren')) {
        this.search = params['siren'];
        this.siret = params['siret'];
        this.compId = params['id'];
      } else {
        this.search = null;
        this.siret = null;
        this.compId = null;
        this.curSelectedId = null;
      }
      this.getAllCompany();
      this.setupFilterListener();
      this.setupMentorListener();
    });
    this.companyService.refreshCompany$.subscribe((resp) => {
      if (resp) {
        this.refreshCompanyId = this.curSelectedId;
        this.curSelectedId = null;
        this.getAllCompany();
      }
    });
  }
  ngAfterViewInit() {
    this.subs.sink = this.paginator.page
      .pipe(
        tap(() => {
          !this.isFirstLoad ? this.getAllCompany() : null;
        }),
      )
      .subscribe();
  }

  setupFilterListener() {
    this.subs.sink = this.companyService.companyFilter$.subscribe((resp) => {
      if (resp !== null) {
        this.search = resp;
        this.curSelectedId = null;
        this.paginator.pageIndex = 0;
        this.getAllCompany();
      }
    });
  }

  setupMentorListener() {
    this.subs.sink = this.companyService.mentorFilter$.subscribe((resp) => {
      if (resp !== null) {
        this.mentorSearch = resp;
        this.curSelectedId = null;
        this.paginator.pageIndex = 0;
        this.getAllCompany();
      }
    });
  }

  refreshCompanyBranch(event) {
    if (event) {
      this.refreshCompanyId = this.curSelectedId;
      this.curSelectedId = null;
      this.getAllCompany();
    }
  }

  getAllCompany() {
    const pagination = {
      limit: this.paginator.pageSize ? this.paginator.pageSize : 10,
      page: this.paginator.pageIndex ? this.paginator.pageIndex : 0,
    };
    const filter = {
      mentor_name: this.mentorSearch ? this.mentorSearch : null,
    };
    this.isWaitingForResponse = true;
    this.subs.sink = this.companyService.getAllCompanies(this.search, pagination, this.school_id, this.userLogin, filter).subscribe(
      (resp) => {
        this.isFirstLoad = false;
        if (resp) {
          this.companies = cloneDeep(resp);
          this.paginator.length = resp && resp.length && resp[0].count_document ? resp[0].count_document : 0;
          this.dataCount = resp && resp.length && resp[0].count_document ? resp[0].count_document : 0;


          // select first company after search
          if (this.search || this.mentorSearch) {
            const selectedCompany = this.companies[0];
            selectedCompany && this.updatedSelectedCompany(selectedCompany._id);
          }

          if (this.siret) {
            const selectedCompany = this.companies.find((company) => company.no_RC === this.siret);

            selectedCompany ? this.updatedSelectedCompany(selectedCompany._id) : null;
          } else if (this.compId) {
            const selectedCompany = this.companies.find((company) => company._id === this.compId);

            selectedCompany ? this.updatedSelectedCompany(selectedCompany._id) : null;
          } else if (this.refreshCompanyId) {
            this.curSelectedId = this.refreshCompanyId;
          }
        } else {
          this.companies = [];
          this.paginator.length = 0;
        }
        this.isWaitingForResponse = false;
      },
      (err) => {
        this.isFirstLoad = false;
        this.isWaitingForResponse = false;
        this.companies = [];
        this.paginator.length = 0;
        this.authService.postErrorLog(err);

      },
    );
  }

  reset(event) {
    if (event) {
      this.search = null;
      this.getAllCompany();
    }
  }

  updatedSelectedCompany(newSelection) {
    this.curSelectedId = null;
    this.curSelectedId = newSelection;
    const filteredCompany = this.companies.filter((company) => newSelection === company._id);
    this.curSelected = filteredCompany[0];
  }

  getAutomaticHeight() {
    this.myInnerHeight = window.innerHeight - 231;
    return this.myInnerHeight;
  }
  getCardHeight() {
    this.myInnerHeight = window.innerHeight - 200;
    return this.myInnerHeight;
  }

  reload(event) {
    if (event) {
      this.search = null;
      this.curSelectedId = null;
      this.getAllCompany();
    }
  }

  ngOnDestroy(): void {
    this.pageTitleService.setTitle('');
    this.subs.unsubscribe();
  }
}
