import { Component, OnInit, ViewEncapsulation, OnDestroy, ViewChild, OnChanges, Input, EventEmitter, Output } from '@angular/core';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { CompanyService } from 'app/service/company/company.service';
import { UntypedFormControl } from '@angular/forms';
import { startWith, debounceTime } from 'rxjs/operators';
import { AuthService } from 'app/service/auth-service/auth.service';
import { SubSink } from 'subsink';
import { UtilityService } from 'app/service/utility/utility.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { MatSelect } from '@angular/material/select';
import { DomSanitizer } from '@angular/platform-browser';
import { PermissionService } from 'app/service/permission/permission.service';
import { ActivatedRoute } from '@angular/router';
import { NgxPermissionsService } from 'ngx-permissions';
import { CheckCompanyDialogComponent } from 'app/companies/check-company-dialog/check-company-dialog.component';
import { CompanyCreationTabComponent } from 'app/companies/company-creation-tab/company-creation-tab.component';

@Component({
  selector: 'ms-company-list',
  templateUrl: './company-list.component.html',
  styleUrls: ['./company-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class CompanyListComponent implements OnInit, OnDestroy {
  @Input() companies: any[]
  @Input() isWaitingForResponse
  @Input() set curCompanyId(id: string) {
    this._curCompanyId = id;
    this.companyId = id;
  }
  @Input() formBranch: boolean
  @Output() selectedChange = new EventEmitter<string>();
  @Output() reload = new EventEmitter<boolean>();


  get curCompanyId() {
    return this._curCompanyId;
  }
  @ViewChild('companyCreate', { static: false }) companyCreate: CompanyCreationTabComponent;
  private subs = new SubSink();
  companiesData: any;
  _curCompanyId: string;
  indexLogo: any;
  countries;
  config: MatDialogConfig = {};
  companyId = '';
  dataPass: any;
  companyData: any;
  entityData: any;
  isLoading = true;
  searchCompany = new UntypedFormControl('');
  searchCountry = new UntypedFormControl('');
  searchZipCode = new UntypedFormControl('');
  searchComp = '';
  searchCoun = '';
  searchZip = '';
  tabIndex;
  filteredCompanies: any[] = [];
  companyCreation = false;
  connectCompany = false;
  CurUser: any;
  companyList: any;
  companyDataList: any;
  isUserAdmtc = false;
  isUserAcadir = false;
  isUserAdmtcDir = false;
  isUserAcadAdmin = false;
  companySelectName: any;
  pageIndex = 0;
  nowIndex = 0;
  checkIndex = 0;
  buttonNext = true;
  buttonPreviouse = false;
  totalData = 0;
  start = 0;
  end = 1;
  messageDataEmpty = false;
  isLoadingPagination = false;
  companyReload = false;
  timeOutSwal: any;
  isSubmitRequest = false;
  myInnerHeight = 1920;
  isDeleteAction = false;
  isReset = false;
  isFilterQuickSearch = false;
  quickSearchCompanyId;
  quickSearchCompanyName;
  quickSearchMentorId;
  companyTab;

  constructor(
    public dialog: MatDialog,
    private companyService: CompanyService,
    private utilService: UtilityService,
    private CurUserService: AuthService,
    private translate: TranslateService,
    public sanitizer: DomSanitizer,
    public permissionService: PermissionService,
    private route: ActivatedRoute,
    private permissions: NgxPermissionsService,
  ) { }

  ngOnInit() {
    const openTab = this.route.snapshot.queryParamMap.get('open');
    const country = this.route.snapshot.queryParamMap.get('country');
    const company = this.route.snapshot.queryParamMap.get('company');
    const code = this.route.snapshot.queryParamMap.get('code');
    // ************** SchoolId, titleId, classId, studentId are passed from student card create new company, will be used to route back
    const schoolId = this.route.snapshot.queryParamMap.get('schoolId');
    const titleId = this.route.snapshot.queryParamMap.get('titleId');
    const classId = this.route.snapshot.queryParamMap.get('classId');
    const studentId = this.route.snapshot.queryParamMap.get('studentId');
    // ************* These variable used for quick search, it will search the company, and then open the tabs
    const companyTab = this.route.snapshot.queryParamMap.get('companyTab');
    const companyId = this.route.snapshot.queryParamMap.get('selectedCompanyId');
    const companyName = this.route.snapshot.queryParamMap.get('selectedCompanyName');
    const mentorId = this.route.snapshot.queryParamMap.get('selectedMentorId');
    if (companyId && companyName) {

      this.companyTab = companyTab;
      this.searchCompany.patchValue(companyName);
      this.setCompanyFilter(companyName);
      this.isFilterQuickSearch = true;
      this.quickSearchCompanyId = companyId;
      this.quickSearchCompanyName = companyName;
      this.quickSearchMentorId = mentorId;
    }



    if (openTab && openTab === 'company-creation') {
      const dataPass = {
        company_name: company,
        country: country,
        postal_code: code,
        zip_code: code,
        schoolId: schoolId,
        titleId: titleId,
        classId: classId,
        studentId: studentId
      };
      this.dataPass = dataPass;
      this.companyCreation = true;
    }

    this.subs.sink = this.companyService.getCountry().subscribe((list: any[]) => {
      this.countries = list;
    });
    this.getAutomaticHeight();
    // *************** Cek User Type & Permission Access User to Company Data
    this.isUserAcadir = !!this.permissions.getPermission('Academic Director');
    this.isUserAdmtcDir = !!this.permissions.getPermission('ADMTC Director');
    this.isUserAcadAdmin = !!this.permissions.getPermission('Academic Admin');
    this.isUserAdmtc = this.utilService.isUserEntityADMTC();
    // *************** Get Data Current User and find entitites as ACAD Admin/Dir
    this.CurUser = this.CurUserService.getLocalStorageUser();
    this.entityData = this.CurUser.entities.find(
      (entity) => entity.type.name === 'Academic Director' || entity.type.name === 'Academic Admin',
    );
    if (this.isUserAcadir || this.isUserAcadAdmin) {
      this.getCardCompanyByAcadir('');
    } else if (this.isUserAdmtc || this.isUserAdmtcDir) {
      this.getCardCompanyADMTC('');
    }
    // ======================================================

    // this.countries = this.companyService.getCountries();
    this.filterCompaniesList();
    this.filterCompany();
    this.initZipCode();
  }

  // *************** To Get Height window screen and put in style css height
  getAutomaticHeight() {
    this.myInnerHeight = window.innerHeight - 266;
    return this.myInnerHeight;
  }

  // *************** To Get Company Data based on selected
  selectCompany(companySelect, name) {
    if (!this.isDeleteAction) {
      if(!this.companyService.childrenFormValidationStatus){
        return this.fireUnsavedDataWarningSwal(companySelect);
      } else {
        this.companyId = companySelect;
        this.selectedChange.emit(this.companyId);
      }
      // this.companyData = this.companiesData[companySelect];
      // this.companyService.setCompanyName(name);
      // this.companySelectName = name;
      // if (!this.isSubmitRequest) {

      //   if (this.indexLogo >= 0) {
      //     this.filteredCompanies[this.indexLogo].company_logo = null;
      //     this.indexLogo = -1;
      //   }
      // } else {
      //   this.indexLogo = -1;
      //   this.isSubmitRequest = false;
      // }
    }
  }

  // *************** Filter Search Company
  filterCompaniesList() {
    this.subs.sink = this.searchCountry.valueChanges.pipe(startWith('')).subscribe((searchString: string) => {
      if (this.tabIndex !== 0) {
        this.tabIndex = 0;
      }
      this.searchCoun = searchString ? searchString.toLowerCase() : '';
      this.isLoading = true;
      this.filteredCompanies = null;
      this.companyId = null;
      this.pageIndex = 0;
      if (!this.isReset) {
        if (this.isUserAcadir || this.isUserAcadAdmin) {
          this.getCardCompanyByAcadir('');
        } else if (this.isUserAdmtc || this.isUserAdmtcDir) {
          this.getCardCompanyADMTC('');
        }
      }
    });
  }
  initZipCode() {
    this.subs.sink = this.searchZipCode.valueChanges.pipe(debounceTime(400)).subscribe((statusSearch) => {
      const symbol = /[-!$%^&*()_+|~=`{}\[\]:";'<>?,.\/]/;
      const symbol1 = /\\/;
      if (!statusSearch.match(symbol) && !statusSearch.match(symbol1)) {
        if (this.tabIndex !== 0) {
          this.tabIndex = 0;
        }
        this.searchZip = statusSearch;
        this.isLoading = true;
        this.filteredCompanies = null;
        this.companyId = null;
        this.pageIndex = 0;
        if (!this.isReset) {
          if (this.isUserAcadir || this.isUserAcadAdmin) {
            this.getCardCompanyByAcadir('');
          } else if (this.isUserAdmtc || this.isUserAdmtcDir) {
            this.getCardCompanyADMTC('');
          }
        }
      } else {
        this.searchZipCode.setValue('');
        if (this.tabIndex !== 0) {
          this.tabIndex = 0;
        }
        this.searchZip = '';
        this.isLoading = true;
        this.filteredCompanies = null;
        this.companyId = null;
        this.pageIndex = 0;
        if (!this.isReset) {
          if (this.isUserAcadir || this.isUserAcadAdmin) {
            this.getCardCompanyByAcadir('');
          } else if (this.isUserAdmtc || this.isUserAdmtcDir) {
            this.getCardCompanyADMTC('');
          }
        }
      }
    });
  }
  filterCompany() {
    this.subs.sink = this.searchCompany.valueChanges.pipe(debounceTime(100)).subscribe((search) => {
      if (search && search.length >= 3) {
        if (this.isUserAdmtc) {
          this.subs.sink = this.companyService.getCompanyDropdownList(search.toLowerCase()).subscribe((comp) => {
            this.companyList = comp;
          });
        } else {
          this.subs.sink = this.companyService
            .getCompanyWithSchool(search.toLowerCase(), this.entityData.school._id)
            .subscribe((comp) => {
              this.companyList = comp;
            });
        }
      }
    });
  }
  setCompanyFilter(data) {

    this.searchComp = data === 'AllM' ? '' : data.toLowerCase();
    this.isLoading = true;
    this.pageIndex = 0;
    this.filteredCompanies = null;
    this.companyId = null;
    if (this.tabIndex !== 0) {
      this.tabIndex = 0;
    }

    if (!this.isReset) {
      if (this.isUserAcadir || this.isUserAcadAdmin) {
        this.getCardCompanyByAcadir('');
      } else if (this.isUserAdmtc || this.isUserAdmtcDir) {
        this.getCardCompanyADMTC('');
      }
    }
  }
  // *************** End of Filter Search Company

  // *************** Reset Search Company
  resetSearch() {
    this.isReset = true;
    this.tabIndex = 0;
    this.searchCompany.setValue('');
    this.searchCountry.setValue('');
    this.searchZipCode.setValue('');
    this.companyList = [];
    this.searchCoun = '';
    this.searchComp = '';
    this.searchZip = '';
    this.pageIndex = 0;

    if (this.isUserAcadir || this.isUserAcadAdmin) {
      this.getCardCompanyByAcadir('');
    } else if (this.isUserAdmtc || this.isUserAdmtcDir) {
      this.getCardCompanyADMTC('');
    }
  }

  // *************** Call Check Company Dialog before create company
  onAddCompany() {
    this.subs.sink = this.dialog
      .open(CheckCompanyDialogComponent, {
        minWidth: '400px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
      })
      .afterClosed()
      .subscribe((e) => {
        if (e) {
          this.companyCreation = e.createCompany;
          this.companyId = e.companyId;
          this.dataPass = e.dataAdd;
          this.connectCompany = e.connectCompany;
          this.pageIndex = 0;
          this.buttonPreviouse = false;
          this.start = this.pageIndex;
          this.end = this.pageIndex + 1;
          if (this.connectCompany) {
            this.connectingCompany();
          }
          if (!this.isReset) {
            if (this.isUserAcadir || this.isUserAcadAdmin) {
              this.getCardCompanyByAcadir('');
            } else if (this.isUserAdmtc || this.isUserAdmtcDir) {
              this.getCardCompanyADMTC('');
            }
          }
        }
      });
  }

  // *************** Get Data Company when user is ACAD Dir/Admin
  getCardCompanyByAcadir(data) {
    const pagination = {
      limit: 10,
      page: this.pageIndex ? this.pageIndex : 0,
    };
    const country = this.searchCoun ? this.searchCoun : '';
    const search = this.searchComp ? this.searchComp : '';
    const zipCode = this.searchZip ? this.searchZip : '';
    this.subs.sink = this.companyService.getAllCompanyByAcadir(this.entityData.school._id, country, search, pagination, zipCode).subscribe(
      (resp) => {
        this.isReset = false;
        this.isLoadingPagination = false;
        this.messageDataEmpty = false;
        if (resp && resp.length) {
          this.companiesData = resp;
          this.filteredCompanies = this.companiesData;
          this.isLoading = false;
          this.totalData = resp[0].count_document ? resp[0].count_document : 0;
          if (this.nowIndex > this.totalData) {
            this.buttonNext = false;
          } else {
            this.buttonNext = true;
          }
          if (data) {
            this.goLastPage();
          }
        } else {
          this.isLoading = false;
          this.messageDataEmpty = true;
          this.totalData = 0;
          if (data) {
            this.goLastPage();
          }
        }

        // ************* Call function to autoscroll to user, set time out used to wait for render
        if (this.isFilterQuickSearch) {
          setTimeout(() => {
            this.checkItemScrollTo();
            this.selectCompany(this.quickSearchCompanyId, this.quickSearchCompanyName);
            this.isFilterQuickSearch = false;
          }, 200);
        } else {
          this.companyTab = '';
          this.quickSearchMentorId = '';
        }
      },
      (err) => {
        this.isReset = false;
        this.CurUserService.postErrorLog(err);

      },
    );
  }

  // *************** Paginator Card Company
  setNextPage(currentIndex: number) {
    this.isLoadingPagination = true;
    this.pageIndex = this.pageIndex + 1;
    this.start = this.pageIndex;
    this.end = this.pageIndex + 1;
    this.nowIndex = this.end * 10;
    this.checkIndex = this.pageIndex * 10;

    if (currentIndex > this.totalData) {
      this.buttonNext = false;
    } else {
      this.buttonNext = true;
    }
    if (this.pageIndex === 0) {
      this.buttonPreviouse = false;
    } else {
      this.buttonPreviouse = true;
    }

    if (!this.isReset) {
      if (this.isUserAcadir || this.isUserAcadAdmin) {
        this.getCardCompanyByAcadir('');
      } else if (this.isUserAdmtc || this.isUserAdmtcDir) {
        this.getCardCompanyADMTC('');
      }
    }
  }
  setPreviousePage(currentIndex: number) {
    this.isLoadingPagination = true;
    this.pageIndex = this.pageIndex - 1;
    this.start = this.pageIndex;
    this.end = this.pageIndex + 1;
    this.nowIndex = this.pageIndex * 10;
    this.checkIndex = this.pageIndex * 10;

    if (this.pageIndex === 0) {
      this.buttonPreviouse = false;
    } else {
      this.buttonPreviouse = true;
    }
    if (this.nowIndex > this.totalData) {
      this.buttonNext = false;
    } else {
      this.buttonNext = true;
    }

    if (!this.isReset) {
      if (this.isUserAcadir || this.isUserAcadAdmin) {
        this.getCardCompanyByAcadir('');
      } else if (this.isUserAdmtc || this.isUserAdmtcDir) {
        this.getCardCompanyADMTC('');
      }
    }
  }
  goLastPage() {
    this.isLoadingPagination = true;
    const index = this.totalData / 10;
    const lastIndex = Math.floor(index);
    this.start = lastIndex;
    this.end = lastIndex + 1;
    this.pageIndex = lastIndex;
    this.nowIndex = this.end * 10;
    this.checkIndex = this.end * 10;

    this.buttonNext = false;
    this.buttonPreviouse = true;

    if (!this.isReset) {
      if (this.isUserAcadir || this.isUserAcadAdmin) {
        this.getCardCompanyByAcadir('');
      } else if (this.isUserAdmtc || this.isUserAdmtcDir) {
        this.getCardCompanyADMTC('');
      }
    }
  }
  goFirstPage() {
    this.isLoadingPagination = true;
    this.pageIndex = 0;
    this.buttonNext = true;
    this.buttonPreviouse = false;
    this.start = 0;
    this.end = 1;
    this.nowIndex = 1;
    this.checkIndex = 1;

    if (!this.isReset) {
      if (this.isUserAcadir || this.isUserAcadAdmin) {
        this.getCardCompanyByAcadir('');
      } else if (this.isUserAdmtc || this.isUserAdmtcDir) {
        this.getCardCompanyADMTC('');
      }
    }
  }
  // *************** End of Paginator Card Company

  // *************** Get Data Company when user is ADMTC Dir/Admin
  getCardCompanyADMTC(data) {
    const pagination = {
      limit: 10,
      page: this.pageIndex ? this.pageIndex : 0,
    };
    const country = this.searchCoun ? this.searchCoun : '';
    const search = this.searchComp ? this.searchComp : '';
    const zipCode = this.searchZip ? this.searchZip : '';
    this.subs.sink = this.companyService.getAllCompanyByAdmtc(country, search, pagination, zipCode).subscribe(
      (resp) => {
        this.isReset = false;
        this.isLoadingPagination = false;
        this.messageDataEmpty = false;
        if (resp && resp.length) {
          this.companiesData = resp;
          this.filteredCompanies = this.companiesData;
          this.isLoading = false;
          this.totalData = resp[0].count_document ? resp[0].count_document : 0;
          if (this.checkIndex + 10 > this.totalData) {
            this.buttonNext = false;
          } else {
            this.isLoading = false;
            this.buttonNext = true;
          }
          if (data) {
            this.goLastPage();
          }
        } else {
          this.isLoading = false;
          this.messageDataEmpty = true;
          this.totalData = 0;
          if (data) {
            this.goLastPage();
          }
        }

        // ************* Call function to autoscroll to user, set time out used to wait for render
        setTimeout(() => {
          this.checkItemScrollTo();
        }, 200);
      },
      (err) => {
        this.isReset = false;
        this.CurUserService.postErrorLog(err);

      },
    );
  }

  // *************** Get Data new Company mark as selected
  selectCompanyCard(companyId: string) {
    this.companyId = companyId;
    this.companyService.setCompanyId(this.companyId);
  }

  selectNewCompany(company) {
    this.goLastPage();
    this.selectCompany(company.companyId, company.company_name);
  }

  // *************** Function to Connecting Company to user school
  connectingCompany(withoutSwal?: boolean) {
    const schoolId = this.entityData.school._id;
    this.subs.sink = this.companyService.connectSchoolToCompany(this.companyId, schoolId).subscribe(
      (resp) => {
        if (resp) {
          if (withoutSwal) {
            if (!this.isReset) {
              if (this.isUserAcadir || this.isUserAcadAdmin) {
                this.getCardCompanyByAcadir('');
              } else if (this.isUserAdmtc || this.isUserAdmtcDir) {
                this.getCardCompanyADMTC('');
              }
            }
          } else {
            Swal.fire({
              type: 'success',
              title: 'Bravo !',
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            }).then((res) => {
              if (!this.isReset) {
                if (this.isUserAcadir || this.isUserAcadAdmin) {
                  this.getCardCompanyByAcadir('');
                } else if (this.isUserAdmtc || this.isUserAdmtcDir) {
                  this.getCardCompanyADMTC('');
                }
              }
            });
          }
        }
      },
      (err) => {

        this.CurUserService.postErrorLog(err);
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  // *************** Functional reload after create Company
  afterCreation(data) {

    this.companyCreation = data.createCompany;
    this.companyId = data.companyId;
    this.connectCompany = data.connectCompany;
    this.pageIndex = 0;
    this.buttonPreviouse = false;
    this.start = this.pageIndex;
    this.end = this.pageIndex + 1;
    if (this.connectCompany && (this.isUserAcadir || this.isUserAcadAdmin) && this.companyId) {
      const withoutSwal = true;;
      this.connectingCompany(withoutSwal);
    }

    if (!this.isReset) {
      if (this.isUserAcadir || this.isUserAcadAdmin) {
        this.getCardCompanyByAcadir('');
      } else if (this.isUserAdmtc || this.isUserAdmtcDir) {
        this.getCardCompanyADMTC('');
      }
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  // *************** Function to remove Company from card
  deleteCompany(dataId, dataName) {
    this.isDeleteAction = true;
    let timeDisabled = 5;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('Attention'),
      html: this.translate.instant('DISCONNECT_SCHOOL.DELETED', {
        name: dataName,
      }),
      footer: `<span style="margin-left: auto">DISCONNECT_SCHOOL.DELETED</span>`,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('SWEET_ALERT.DELETE.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('SWEET_ALERT.DELETE.CANCEL'),
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const time = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM') + ' in ' + timeDisabled + ' sec';
        }, 1000);

        this.timeOutSwal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('SWEET_ALERT.DELETE.CONFIRM');
          Swal.enableConfirmButton();
          clearTimeout(time);
        }, timeDisabled * 1000);
      },
    }).then((isConfirm) => {
      clearTimeout(this.timeOutSwal);
      if (isConfirm.value) {
        this.isDeleteAction = false;
        this.subs.sink = this.companyService.deleteCompany(dataId).subscribe(
          (resp) => {
            Swal.fire({
              type: 'success',
              title: 'Bravo!',
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            }).then(resp => {
              this.reload.emit(true)
            })
          },
          (err) => {
            // let index = err.indexOf("");
            const text = String(err);
            const index = text.indexOf('/');
            const message = text.slice(21, index);
            const alert = message;

            this.CurUserService.postErrorLog(err);
            Swal.fire({
              type: 'error',
              title: this.translate.instant('DISCONNECT_SCHOOL.TITLE'),
              text: this.translate.instant('DISCONNECT_SCHOOL.INVALID'),
              footer: `<span style="margin-left: auto">DISCONNECT_SCHOOL.INVALID</span>`,
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            });
          },
        );
      } else {
        this.isDeleteAction = false;
      }
    });
  }

  // *************** Validation Can Deactivated Guard
  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    let validation: Boolean;
    validation = false;
    if (this.companyCreate && this.companyCreate.companyCreation) {
      validation = true;
    }
    if (validation) {
      return new Promise((resolve, reject) => {
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('TMTC_S01.TITLE'),
          text: this.translate.instant('TMTC_S01.TEXT'),
          confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
          showCancelButton: true,
          cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
          footer: `<span style="margin-left: auto">TMTC_S01</span>`,
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((result) => {
          if (result.value) {
            resolve(false);
          } else {
            resolve(true);
          }
        });
      });
    } else {
      return true;
    }
  }

  // *************** Function to reset dropdown list filter company
  resetCompanyFilter() {
    this.isLoading = true;
    this.pageIndex = 0;
    this.searchCountry.setValue('');
    this.searchCoun = '';
    this.companyId = null;
    if (this.tabIndex !== 0) {
      this.tabIndex = 0;
    }

    if (!this.isReset) {
      if (this.isUserAcadir || this.isUserAcadAdmin) {
        this.getCardCompanyByAcadir('');
      } else if (this.isUserAdmtc || this.isUserAdmtcDir) {
        this.getCardCompanyADMTC('');
      }
    }
  }

  // *************** Function to get company by inputted user
  getCompany() {
    this.subs.sink = this.searchCountry.valueChanges.subscribe((search) => {
      this.isLoading = true;
      this.filteredCompanies = null;
      this.companyId = null;
      if (this.tabIndex !== 0) {
        this.tabIndex = 0;
      }
      this.searchComp = search.toLowerCase();

    });
  }

  // *************** Function to call image uploaded
  imgURL(src: string) {
    return this.sanitizer.bypassSecurityTrustUrl(src);
  }

  // *************** Function to reload company detail after update data
  submitRequest(event) {

    this.isSubmitRequest = true;
    if (event) {
      if (!this.isReset) {
        if (this.isUserAcadir || this.isUserAcadAdmin) {
          this.getCardCompanyByAcadir('');
        } else if (this.isUserAdmtc || this.isUserAdmtcDir) {
          this.getCardCompanyADMTC('');
        }
      }
    }
  }

  // *************** Function to patch image from s3 to populate in card
  imgRequest(event) {

    if (event) {
      this.filteredCompanies.forEach((element, index) => {
        if (element._id === this.companyId) {

          this.filteredCompanies[index].company_logo = event;
          this.indexLogo = index;
        }
      });
      this.imgURL(event);
    }
  }

  // To Scroll to selected compay card
  checkItemScrollTo() {
    const itemToScrollTo = document.getElementById('item-' + this.companyId);


    if (itemToScrollTo) {
      itemToScrollTo.scrollIntoView(true);
    }
  }

  // Swal Validation Edit Form 
  fireUnsavedDataWarningSwal(companySelect) {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('TMTC_S01.TITLE'),
      text: this.translate.instant('TMTC_S01.TEXT'),
      confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        return false;
      } else {
        this.companyId = companySelect;
        this.companyService.childrenFormValidationStatus = true;
        this.selectedChange.emit(this.companyId);
      }
    });
  }
}
