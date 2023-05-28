import { Component, OnInit, OnDestroy, ViewChild, Output, EventEmitter, Input, HostListener, AfterViewInit } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router, RoutesRecognized } from '@angular/router';
import { RNCPTitlesService } from '../../service/rncpTitles/rncp-titles.service';
import { PageTitleService } from '../../core/page-title/page-title.service';
import { TitleIdentityComponent } from '../title-identity/title-identity.component';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { MatTab, MatTabChangeEvent, MatTabGroup, MatTabHeader } from '@angular/material/tabs';
import { UntypedFormControl } from '@angular/forms';
import { SubSink } from 'subsink';
import { CertificationRuleService } from 'app/service/certification-rule/certification-rule.service';
import { ConditionsService } from 'app/service/conditions/conditions.service';
import { filter, pairwise } from 'rxjs/operators';

@Component({
  selector: 'ms-title-rncp-details',
  templateUrl: './title-rncp-details.component.html',
  styleUrls: ['./title-rncp-details.component.scss'],
})
export class TitleRncpDetailsComponent implements OnInit, OnDestroy, AfterViewInit{
  private subs = new SubSink();
  rncpId = '';
  rncpData;
  classData = [];
  classList: any = [];
  matTabDisabled = true;
  tabIndex = 0;
  conditionPreSelectedIndex: number;
  clickedTabIndex;
  @Output()
  @HostListener('window:scroll', ['$event']) // for window scroll events
  selectedTabChange = new EventEmitter<MatTabChangeEvent>();

  @ViewChild(MatTabGroup, { static: false }) private tabGroup: MatTabGroup;
  @ViewChild('titleIdentity', { static: false }) titleIdentity: TitleIdentityComponent;
  private selectedIndex;
  selected = new UntypedFormControl(0);
  subtab: string;
  tab;
  previousLastTab: any;
  constructor(
    private activatedRoute: ActivatedRoute,
    private rncpTitlesService: RNCPTitlesService,
    private pageTitleService: PageTitleService,
    private translate: TranslateService,
    private certificationRuleService: CertificationRuleService,
    private conditionService: ConditionsService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.subs.sink = this.activatedRoute.queryParams.subscribe(() => {
      // ************* if has params tab and subtab, then navigate to that particular tab
      if (this.activatedRoute.snapshot.queryParamMap.get('tab')) {
        this.subtab = this.activatedRoute.snapshot.queryParamMap.get('subtasks') || null;
        this.tab = this.activatedRoute.snapshot.queryParamMap.get('tab');

        // this.goToTab(this.activatedRoute.snapshot.queryParamMap.get('tab'));
      }
    });
    this.subs.sink = this.activatedRoute.params.subscribe((param) => {
      if (param.hasOwnProperty('rncpId')) {
        this.rncpId = param.rncpId;
        this.subs.sink = this.rncpTitlesService.getClassByRncpTitle(param.rncpId).subscribe((data: any) => {
          data.forEach((element) => {
            this.subs.sink = this.rncpTitlesService.getClassById(element._id).subscribe((data) => {
              let job_description;
              let mentor_evaluation;
              let problematic;

              if (data.job_description) {
                job_description = 'active';
              } else {
                job_description = 'not active';
              }

              if (data.mentor_evaluation) {
                mentor_evaluation = 'active';
              } else {
                mentor_evaluation = 'not active';
              }

              if (data.problematic) {
                problematic = 'active';
              } else {
                problematic = 'not active';
              }

              this.classList.push({
                description: data.description,
                job_description: job_description,
                mentor_evaluation: mentor_evaluation,
                name: data.name,
                problematic: problematic,
                _id: data._id,
              });
            });
          });
          this.classData = data && data.length > 0 ? data : [];

          // ************* if has params tab and subtab, then navigate to that particular tab
          if (this.activatedRoute.snapshot.queryParamMap.get('tab')) {
            this.subtab = this.activatedRoute.snapshot.queryParamMap.get('subtasks') || null;
            this.tab = this.activatedRoute.snapshot.queryParamMap.get('tab');
          }

          // *************** if has class queryparam, then we need to go to that class
          if (this.activatedRoute.snapshot.queryParamMap.get('classId')) {
            const classSelected = {
              _id: this.activatedRoute.snapshot.queryParamMap.get('classId'),
            };
            this.goToClass(classSelected);
          }

          // *************** Check if from prev route is jury-organization so that we can automatically route
          // user to a tab inside the condition component called "Jury Organization Parameter"
          const navigatedFrom = this.activatedRoute.snapshot.queryParamMap.get('navigatedFrom');
          if (navigatedFrom && navigatedFrom.split('/')[1] === 'jury-organization') {
            // Below is 2 because the "Jury Organization Parameter Tab in the condition component is the second index"
            this.conditionPreSelectedIndex = 2;
          } else if (navigatedFrom && navigatedFrom === 'certification-rule') {
            this.conditionPreSelectedIndex = 3;
          }
        });
        this.subs.sink = this.rncpTitlesService.getRncpTitleById(param.rncpId).subscribe((rncp) => {
          this.rncpData = rncp;
          this.pageTitleService.setTitle(rncp.short_name);
          this.pageTitleService.setIcon('rncp-titres');
        });
        this.setPageTitle();
      }
    });
  }

  ngAfterViewInit() {
    this.tabGroup._handleClick = this.checkIfAnyChildrenFormInvalid.bind(this);
  }

  setPageTitle() {
    this.subs.sink = this.rncpTitlesService.getRncpTitleById(this.rncpId).subscribe((rncp) => {
      this.rncpData = rncp;
      this.pageTitleService.setTitle(rncp.short_name);
      // add .svg icon inside src/assets/icons then register it in app.module
      this.pageTitleService.setIcon('certificate');
    });
  }

  ngOnDestroy() {
    this.pageTitleService.setTitle('');
    this.pageTitleService.setIcon('');
    this.subs.unsubscribe();
  }

  Exist(name: String) {
    for (let i = 0; i < this.classData.length; i++) {
      if (this.translate.instant('Class') + ' : ' + this.classData[i]['name'] === name) {
        return i;
      }
    }
    return -1;
  }

  getTabIndex(tabName: string): number {
    if (tabName === this.translate.instant('Title Identity')) {
      return 0;
    } else if (tabName === this.translate.instant('List of Class')) {
      return 1;
    } else if (tabName === this.translate.instant('Documents')) {
      return 2;
    } else {
      return this.Exist(tabName) + 3;
    }
  }

  checkValidation(clickEvent: any) {
    let validation = true;

    if (clickEvent.target.className === 'matTabNavication ng-star-inserted') {
      this.clickedTabIndex = this.getTabIndex(clickEvent.target.innerText);
      const indexFrom = this.selected.value;
      if (!(this.selected.value === this.clickedTabIndex)) {
        if (this.titleIdentity && this.titleIdentity.savedForm && this.titleIdentity.titleIdentityForm) {
          validation = _.isEqual(this.titleIdentity.savedForm, this.titleIdentity.titleIdentityForm.getRawValue());
        }
        if (
          (this.selected.value > 2 && this.conditionService.hasValidationDataChanged()) ||
          (this.selected.value > 2 && this.conditionService.validationAllowUserSave) ||
          (this.selected.value > 2 && this.conditionService.isConditionFormChanged)
        ) {
          validation = false;
        }

        if (!validation) {
          Swal.fire({
            type: 'warning',
            title: this.translate.instant('TMTC_S01.TITLE'),
            text: this.translate.instant('TMTC_S01.TEXT'),
            footer: `<span style="margin-left: auto">TMTC_S01</span>`,
            confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
            showCancelButton: true,
            cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
            allowOutsideClick: false,
          }).then((result) => {
            if (result.value) {
              this.selected.patchValue(indexFrom);
            } else {
              this.selected.patchValue(this.clickedTabIndex);
              this.conditionService.validationDataFormControls = [];
              this.conditionService.validationAllowUserSave = false;
            }
          });
        } else if (!this.rncpTitlesService.childrenFormValidationStatus) {
          this.selected.patchValue(indexFrom);
        } else {
          this.selected.patchValue(this.clickedTabIndex);
        }
        
      }
      // if click was not on a tab label, do nothing
    }
    if (this.clickedTabIndex === -1) {
      return;
    }
    // if current tab is same as clicked tab, no need to change.
    // Otherwise check whether editing is going on and decide
  }

  goToClass(event: any) {
    if (event && this.classData && this.classData.length) {
      const result = _.findIndex(this.classData, (data) => data._id === event._id);
      if (result >= 0 && this.rncpTitlesService.childrenFormValidationStatus) {
        this.tabIndex = 2 + (result + 1);
        this.selected.patchValue(this.tabIndex);
      }
    }
  }

  updateClass(event: any) {
    if (event && event.length) {
      this.classData = event;

    } else {
      this.classData = [];
    }
  }

  lastTab(event: any) {
    if (event) {
      if (event !== 1) { 
        this.router.navigate([], {
          relativeTo: this.activatedRoute
        });
        this.subs.sink = this.activatedRoute.queryParams.subscribe(() => { 
          this.tab = this.activatedRoute.snapshot.queryParamMap.get('tab');
        })
      }
    }
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    let validation = true;
    const isChanged = this.certificationRuleService.getDataCertificationChanged();
    const isSaved = this.certificationRuleService.getDataCertificationStatus();
    if (this.titleIdentity && this.titleIdentity.savedForm && this.titleIdentity.titleIdentityForm) {
      validation = _.isEqual(this.titleIdentity.savedForm, this.titleIdentity.titleIdentityForm.getRawValue());
    } else if (isChanged && !isSaved) {
      validation = false;
    }
    if (!validation) {
      return new Promise((resolve, reject) => {
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
  onScroll(event) {

  }

  checkIfAnyChildrenFormInvalid(tab: MatTab, tabHeader: MatTabHeader, idx: number) {
    if (!this.rncpTitlesService.childrenFormValidationStatus) {
      return this.fireUnsavedDataWarningSwal(tab, tabHeader, idx);
    }
    return true && MatTabGroup.prototype._handleClick.apply(this.tabGroup, [tab, tabHeader, idx]);
  }

  fireUnsavedDataWarningSwal(tab: MatTab, tabHeader: MatTabHeader, idx: number) {
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
        this.selected.patchValue(this.selected.value);
        return false;
      } else {
        this.rncpTitlesService.childrenFormValidationStatus = true;
        this.selected.patchValue(idx);
        return true && MatTabGroup.prototype._handleClick.apply(this.tabGroup, [tab, tabHeader, idx]);
      }
    });
  }
}
