import { Component, OnInit, OnDestroy, ViewEncapsulation, OnChanges, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { RNCPTitlesService } from '../../service/rncpTitles/rncp-titles.service';
import { SubSink } from 'subsink';
import { Router, ActivatedRoute } from '@angular/router';
import * as _ from 'lodash';
import { UntypedFormControl } from '@angular/forms';
import { startWith } from 'rxjs/operators';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { UserService } from 'app/service/user/user.service';
import { PageTitleService } from 'app/core/page-title/page-title.service';

@Component({
  selector: 'ms-rncp-titles',
  templateUrl: './rncp-titles.component.html',
  styleUrls: ['./rncp-titles.component.scss'],
})
export class RncpTitlesComponent implements OnInit, OnDestroy, OnChanges, AfterViewInit {
  rncpTitles: any[] = [];
  searchForm = new UntypedFormControl('');
  filteredTitles: any[] = [];
  listOfCertifier = [];
  selectedCertifier = '';
  private subs = new SubSink();
  tabIndex;
  isADMTCAdmin = false;
  isADMTCDir = false;
  isAdminDir = false;
  isLoading = false;
  init = false
  schoolId;
  currentUser;
  academicUser;
  isUserType;

  isACADIRMIN = false;
  userData;

  constructor(
    private rncpTitleService: RNCPTitlesService,
    private router: Router,
    private authService: AuthService,
    private route: ActivatedRoute,
    private utilService: UtilityService,
    private userService: UserService,
    private pageTitleService: PageTitleService,
    private ngxPermissionService: NgxPermissionsService,
  ) {}

  ngOnInit() {
    this.rncpTitles = [];
    this.listOfCertifier = [];
    this.isADMTCAdmin = false;
    this.isADMTCDir = false;
    this.isAdminDir = false;
    this.schoolId = '';
    this.currentUser = '';
    this.academicUser = '';
    this.isUserType = '';
    this.pageTitleService.setTitle('List of RNCP Title');

    if (
      !!this.ngxPermissionService.getPermission('Academic Director') || 
      !!this.ngxPermissionService.getPermission('Academic Admin') ||
      !!this.ngxPermissionService.getPermission('PC School Director')
    ) {
      this.isACADIRMIN = true; 
    }

    this.resetSearch()
  }

  ngOnChanges() {
    this.subs.unsubscribe();
    this.rncpTitles = [];
    this.listOfCertifier = [];
    this.isADMTCAdmin = false;
    this.isADMTCDir = false;
    this.isAdminDir = false;
    this.schoolId = '';
    this.currentUser = '';
    this.academicUser = '';
    this.isUserType = '';
    this.resetSearch()
  }

  ngAfterViewInit() {
    this.initTitle();
  }

  initTitle() {        
    this.isADMTCAdmin = !!this.ngxPermissionService.getPermission('ADMTC Admin');
    this.isADMTCDir = !!this.ngxPermissionService.getPermission('ADMTC Director');
    this.isAdminDir = !!this.ngxPermissionService.getPermission('Academic Director');
    this.currentUser = this.authService.getLocalStorageUser();
    // this.subs.sink = this.route.queryParamMap.subscribe(queryParams => {

    //   this.schoolId = queryParams.get('schoolId');
    // })
    
    
    if (this.authService.getLocalStorageUser()) {
      // ************** Check if entity is ADMTC, else non-ADMTC
      if (this.utilService.isUserOneOfADMTCEntity()) {
        // *************** Check if user is ADMTC Admin/Director, else it should be sales, or visitor
        if (this.isADMTCAdmin || this.isADMTCDir) {
          this.subs.sink = this.rncpTitleService.getPublishedRncpTitlesWithNonNullClass().subscribe((titles: any[]) => {
            this.rncpTitles = titles;
            this.filteredTitles = titles;
            this.rncpTitles = _.orderBy(this.rncpTitles, ['short_name'], ['asc']);
            this.filteredTitles = _.orderBy(this.filteredTitles, ['short_name'], ['asc']);
            this.rncpTitles = this.rncpTitles.sort((a, b) => {
              return a.short_name.toLowerCase().localeCompare(b.short_name.toLowerCase());
            });
            this.filteredTitles = this.filteredTitles.sort((a, b) => {
              return a.short_name.toLowerCase().localeCompare(b.short_name.toLowerCase());
            });
            this.rncpTitles.forEach((title) => {
              if (title.certifier) {
                this.listOfCertifier.push(title.certifier.short_name);
              }
            });
            this.listOfCertifier = [...new Set(this.listOfCertifier)];
            this.listOfCertifier = this.listOfCertifier.sort((a, b) => {
              return a.toLowerCase().localeCompare(b.toLowerCase());
            });
          });
        } else {
          this.subs.sink = this.rncpTitleService.getPublishedRncpTitlesWithNonNullClass().subscribe((titles: any[]) => {
            const titleId = this.utilService.getUserAllAssignedTitle();


            this.rncpTitles = titles.filter((title) => {
              if (title.is_published !== false && titleId.includes(title._id)) {
                return title;
              }
            });
            this.filteredTitles = titles.filter((title) => {
              if (titleId.includes(title._id)) {
                return title;
              }
            });
            // this.filteredTitles = titles.filter((t) => t.is_published !== false);


            this.rncpTitles = _.orderBy(this.rncpTitles, ['short_name'], ['asc']);
            this.filteredTitles = _.orderBy(this.filteredTitles, ['short_name'], ['asc']);
            this.rncpTitles = this.rncpTitles.sort((a, b) => {
              return a.short_name.toLowerCase().localeCompare(b.short_name.toLowerCase());
            });
            this.filteredTitles = this.filteredTitles.sort((a, b) => {
              return a.short_name.toLowerCase().localeCompare(b.short_name.toLowerCase());
            });
            this.rncpTitles.forEach((title) => {
              if (title.certifier) {
                this.listOfCertifier.push(title.certifier.short_name);
              }
            });
            this.listOfCertifier = [...new Set(this.listOfCertifier)];
            this.listOfCertifier = this.listOfCertifier.sort((a, b) => {
              return a.toLowerCase().localeCompare(b.toLowerCase());
            });
          });
        }
      } else {
        // *************** if there is school id, meaning its coming from school-group, accessed by Chief Group Academic
        // Else its non-ADMTC, and non-Chief Group Academic



        if (this.route.snapshot.queryParamMap.get('schoolId')) {
          this.schoolId = this.route.snapshot.queryParamMap.get('schoolId');
        }

        // For chief group academic
        if (this.schoolId) {
          this.subs.sink = this.rncpTitleService.getSchoolConnectedTitleClass(this.schoolId).subscribe(schoolData => {
            let classes = [];
            if (schoolData && schoolData.preparation_center_ats) {
              classes = schoolData.preparation_center_ats.map((schoolPC) => {
                if (schoolPC && schoolPC.class_id && schoolPC.class_id._id) {
                  return schoolPC.class_id._id;
                }
              })
            }

            this.subs.sink = this.rncpTitleService.getRncpTitlesBySchoolChiefGroup(true, [this.schoolId], true, classes).subscribe((titles: any[]) => {
              this.rncpTitles = titles.filter((t) => t.is_published !== false);
              this.filteredTitles = titles.filter((t) => t.is_published !== false);
              this.rncpTitles = _.orderBy(this.rncpTitles, ['short_name'], ['asc']);
              this.filteredTitles = _.orderBy(this.filteredTitles, ['short_name'], ['asc']);
              this.rncpTitles = this.rncpTitles.sort((a, b) => {
                return a.short_name.toLowerCase().localeCompare(b.short_name.toLowerCase());
              });
              this.filteredTitles = this.filteredTitles.sort((a, b) => {
                return a.short_name.toLowerCase().localeCompare(b.short_name.toLowerCase());
              });
              this.rncpTitles.forEach((title) => {
                if (title.certifier) {
                  this.listOfCertifier.push(title.certifier.short_name);
                }
              });
              this.listOfCertifier = [...new Set(this.listOfCertifier)];
              this.listOfCertifier = this.listOfCertifier.sort((a, b) => {
                return a.toLowerCase().localeCompare(b.toLowerCase());
              });
            });
          })
        } else {
          // *************** For user entity certifier or PC, need to pass titles ID of their entities
          let titleId = null;
          this.subs.sink = this.authService.getUserById(this.currentUser._id).subscribe((resp) => {
            this.userData = resp;
            if (this.utilService.isUserAcadDirAdmin()) {
              // filter user's entity that we get from getUserById by user type and school from user data in localstorage
              this.getTitleForACADIRMIN('active');
            } else {
              // filter user's entity that we get from getUserById by user type and school from user data in localstorage
              const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
              const school = this.currentUser.entities ? this.currentUser.entities[0].school._id : '';
              this.academicUser = resp.entities.filter((ent) => ent.type.name === userType && ent.school._id === school);
              titleId = this.utilService.getAcademicAllAssignedTitle(this.academicUser);
              const classes = this.utilService.getAcademicAllAssignedClass(this.academicUser);
              if (this.utilService.isUserLoginCRStaff() || !(classes && classes.length)) {
                this.subs.sink = this.rncpTitleService.getRncpTitlesByUserForCertifierDirMin(true, titleId, true, true).subscribe((titles: any[]) => {
                  this.rncpTitles = titles.filter((t) => t.is_published !== false);
                  this.filteredTitles = titles.filter((t) => t.is_published !== false);
                  this.rncpTitles = _.orderBy(this.rncpTitles, ['short_name'], ['asc']);
                  this.filteredTitles = _.orderBy(this.filteredTitles, ['short_name'], ['asc']);
                  this.rncpTitles = this.rncpTitles.sort((a, b) => {
                    return a.short_name.toLowerCase().localeCompare(b.short_name.toLowerCase());
                  });
                  this.filteredTitles = this.filteredTitles.sort((a, b) => {
                    return a.short_name.toLowerCase().localeCompare(b.short_name.toLowerCase());
                  });
                  this.rncpTitles.forEach((title) => {
                    if (title.certifier) {
                      this.listOfCertifier.push(title.certifier.short_name);
                    }
                  });
                  this.listOfCertifier = [...new Set(this.listOfCertifier)];
                  this.listOfCertifier = this.listOfCertifier.sort((a, b) => {
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                  });
                });
              } else {
                // For PC User that has class
                this.subs.sink = this.rncpTitleService.getRncpTitlesByUserForAcademic(true, titleId, true, classes).subscribe((titles: any[]) => {
                  this.rncpTitles = titles.filter((t) => t.is_published !== false);
                  this.filteredTitles = titles.filter((t) => t.is_published !== false);
                  this.rncpTitles = _.orderBy(this.rncpTitles, ['short_name'], ['asc']);
                  this.filteredTitles = _.orderBy(this.filteredTitles, ['short_name'], ['asc']);
                  this.rncpTitles = this.rncpTitles.sort((a, b) => {
                    return a.short_name.toLowerCase().localeCompare(b.short_name.toLowerCase());
                  });
                  this.filteredTitles = this.filteredTitles.sort((a, b) => {
                    return a.short_name.toLowerCase().localeCompare(b.short_name.toLowerCase());
                  });
                  this.rncpTitles.forEach((title) => {
                    if (title.certifier) {
                      this.listOfCertifier.push(title.certifier.short_name);
                    }
                  });
                  this.listOfCertifier = [...new Set(this.listOfCertifier)];
                  this.listOfCertifier = this.listOfCertifier.sort((a, b) => {
                    return a.toLowerCase().localeCompare(b.toLowerCase());
                  });
                });
              }
            }
            this.init = true
          });
        }
      }
    }

    this.filterRncpTitle();
  }

  getTitleForACADIRMIN(tab) {
    let is_archived: boolean
    this.isLoading = true
    if(tab === 'active'){
      is_archived = false
    }
    else if (tab === 'archived'){
      is_archived = true
    }
    this.rncpTitles = []
    this.filteredTitles = []
    this.listOfCertifier = []
    const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
    const school = this.currentUser.entities ? this.currentUser.entities[0].school._id : '';
    this.academicUser = this.userData?.entities.filter((ent) => ent.type.name === userType && ent.school._id === school);
    const titleId = this.utilService.getAcademicAllAssignedTitle(this.academicUser);
    const classes = this.utilService.getAcademicAllAssignedClass(this.academicUser);
    this.subs.sink = this.rncpTitleService.getRncpTitlesByUserForAcademic(true, titleId, true, classes, is_archived).subscribe((titles: any[]) => {
      this.isLoading = false
      this.rncpTitles = titles.filter((t) => t.is_published !== false);
      this.filteredTitles = titles.filter((t) => t.is_published !== false);
      this.rncpTitles = _.orderBy(this.rncpTitles, ['short_name'], ['asc']);
      this.filteredTitles = _.orderBy(this.filteredTitles, ['short_name'], ['asc']);
      this.rncpTitles = this.rncpTitles.sort((a, b) => {
        return a.short_name.toLowerCase().localeCompare(b.short_name.toLowerCase());
      });
      this.filteredTitles = this.filteredTitles.sort((a, b) => {
        return a.short_name.toLowerCase().localeCompare(b.short_name.toLowerCase());
      });
      this.rncpTitles.forEach((title) => {
        if (title.certifier) {
          this.listOfCertifier.push(title.certifier.short_name);
        }
      });
      this.listOfCertifier = [...new Set(this.listOfCertifier)];
      this.listOfCertifier = this.listOfCertifier.sort((a, b) => {
        return a.toLowerCase().localeCompare(b.toLowerCase());
      });
    });
  }

  ngOnDestroy() {
    this.pageTitleService.setTitle('');
    this.subs.unsubscribe();
  }

  filterRncpTitle() {
    this.subs.sink = this.searchForm.valueChanges.pipe(startWith('')).subscribe((searchString: string) => {
      if (this.tabIndex !== 0) {
        this.tabIndex = 0;
      }
      setTimeout(() => {        
        this.filteredTitles = this.rncpTitles.filter((title) => {
          if (title.short_name || title.long_name) {
            return (
              this.utilService
                .simpleDiacriticSensitiveRegex(title.short_name)
                .toLowerCase()
                .indexOf(this.utilService.simpleDiacriticSensitiveRegex(searchString).toLowerCase().trim()) !== -1 ||
              this.utilService
                .simpleDiacriticSensitiveRegex(title.long_name)
                .toLowerCase()
                .indexOf(this.utilService.simpleDiacriticSensitiveRegex(searchString).toLowerCase().trim()) !== -1
            );
          } else {
            return false;
          }
        });
      }, 500);
    });
  }

  // Filter title by certifier
  filterTitleByCertifier(certifier: string, event: any) {
    if (certifier === 'all' || certifier === '' || certifier === 'All' || certifier === 'Tous') {
      this.resetSearch();
      // this.filteredTitles = this.rncpTitles;
    } else {
      this.filteredTitles = this.rncpTitles.filter((title) => {
        const certi = title.certifier ? title.certifier.short_name === certifier : '';
        return certi;
      });
    }
  }

  selectTab(tab){
    if(this.init)
    {
      this.resetSearch()    
      this.getTitleForACADIRMIN(tab);
    }
  }

  resetSearch() {
    this.tabIndex = 0;
    this.searchForm.setValue('');
    this.filteredTitles = this.rncpTitles;
    this.selectedCertifier = 'all';
  }
}
