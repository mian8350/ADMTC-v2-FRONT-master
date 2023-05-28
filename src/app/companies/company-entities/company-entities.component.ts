import { CompanyService } from 'app/service/company/company.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { SubSink } from 'subsink';
import { MatPaginator } from '@angular/material/paginator';
import { tap } from 'rxjs/operators';
import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { PageTitleService } from 'app/core/page-title/page-title.service';

@Component({
  selector: 'ms-company-entities',
  templateUrl: './company-entities.component.html',
  styleUrls: ['./company-entities.component.scss'],
})
export class CompanyEntitiesComponent implements OnInit, OnDestroy {
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  private subs = new SubSink();
  isWaitingForResponse = false;
  myInnerHeight = 1920;
  companies: any[] = [];
  isFirstLoad: boolean = true;
  selectedEntityRC: string;

  currentUser;
  userLogin;
  isUserAdmtc;
  isUserAcadir;
  isUserAcadAdmin;

  filteredValues = {
    no_RC: null,
    company_name: null,
  };
  pageIndex = 0;
  school_id;
  dataCount = 0;
  search;
  mentorSearch;

  curSelected = null;
  curSelectedId = null;

  constructor(
    private companyService: CompanyService, 
    private authService: AuthService, 
    private utilService: UtilityService,
    private pageTitleService: PageTitleService
  ) { }

  ngOnInit() {
    this.pageTitleService.setTitle('NAV.Companies Entity');
    this.paginator.pageIndex = 0;
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
    this.getAllCompany();
    this.setupFilterListener();
    this.setupMentorListener();
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
    this.companyService.companyFilter$.subscribe((resp) => {
      if (resp !== null) {
        this.search = resp;
        this.curSelectedId = null;
        this.paginator.pageIndex = 0;
        this.getAllCompany();
      }
    });
  }

  setupMentorListener() {
    this.companyService.mentorFilter$.subscribe((resp) => {
      if (resp !== null) {
        this.mentorSearch = resp;
        this.curSelectedId = null;
        this.paginator.pageIndex = 0;
        this.getAllCompany();
      }
    });
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
    this.subs.sink = this.companyService.getAllCompanyEntity(this.search, pagination, this.school_id, this.userLogin, filter).subscribe(
      (resp) => {
        this.isFirstLoad = false;
        if (resp) {
          this.companies = resp;
          this.paginator.length = resp && resp.length && resp[0].count_document ? resp[0].count_document : 0;
          this.dataCount = resp && resp.length && resp[0].count_document ? resp[0].count_document : 0;

          // select first company after search
          if (this.search || this.mentorSearch) {
            const selectedCompany = this.companies[0];
            selectedCompany && this.updatedSelectedCompany(selectedCompany._id);
          } else {
            this.curSelected = null;
            this.curSelectedId = null;
          }
        } else {
          this.companies = [];
          this.paginator.length = 0;
        }
        this.isWaitingForResponse = false;
      },
      (err) => {
        this.isWaitingForResponse = false;
        this.isFirstLoad = false;
        this.companies = [];
        this.paginator.length = 0;
        this.authService.postErrorLog(err);

      },
    );
  }

  updatedSelectedCompany(newSelection) {
    this.curSelectedId = null;
    this.curSelectedId = newSelection;
    const filteredCompany = this.companies.filter((company) => newSelection === company._id);
    this.curSelected = filteredCompany[0];
    this.selectedEntityRC = filteredCompany && filteredCompany[0] && filteredCompany[0].no_RC ? filteredCompany[0].no_RC : null;
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
      this.mentorSearch = null;
      this.getAllCompany();
    }
  }

  ngOnDestroy(): void {
    this.pageTitleService.setTitle('');
    this.subs.unsubscribe();
  }
}
