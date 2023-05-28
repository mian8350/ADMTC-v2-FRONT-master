import { MatTab, MatTabGroup, MatTabHeader } from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  Output,
  EventEmitter,
  HostListener,
  ViewChild,
  OnChanges,
  SimpleChanges,
  AfterViewInit,
} from '@angular/core';
import { RNCPTitlesService } from '../../service/rncpTitles/rncp-titles.service';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import * as _ from 'lodash';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { CertificationRuleComponent } from './certification-rule/certification-rule.component';
import { CertificationRuleService } from 'app/service/certification-rule/certification-rule.service';
import { ConditionsService } from 'app/service/conditions/conditions.service';

@Component({
  selector: 'ms-conditions',
  templateUrl: './conditions.component.html',
  styleUrls: ['./conditions.component.scss'],
})
export class ConditionsComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  private subs = new SubSink();

  @ViewChild('certificationRule', { static: false }) certificationRule: CertificationRuleComponent;
  @Input() selectedRncpTitleId: string;
  selectedRncpTitleName: string;
  selectedRncpTitleLongName: string;
  @Input() selectedClassId: string;
  @Input() selectedClassName: string;
  @Input() classData: any;
  @Input() classIndex: number;
  @Output() updateClass = new EventEmitter();
  @Output() lastTab = new EventEmitter();
  @Input() preSelectedIndex: number;
  @Input() tab;
  @Input() subtab;
  @HostListener('window:scroll', ['$event']) // for window scroll events
  @ViewChild(MatTabGroup, { static: false })
  private tabGroup: MatTabGroup;
  selectedIndex = 0;
  clickedTabIndex;

  constructor(
    private rncpTitlesService: RNCPTitlesService,
    public translate: TranslateService,
    private certificationRuleService: CertificationRuleService,
    private conditionService: ConditionsService,
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    this.getRncpTitleData();
    if (this.preSelectedIndex) {
      this.selectedIndex = this.preSelectedIndex;
    }

    if (this.tab) {
      this.goToTab(this.tab);
    }
  }

  ngAfterViewInit() {
    this.tabGroup._handleClick = this.checkIfAnyChildrenFormInvalid.bind(this);
  }

  ngOnChanges(changes: SimpleChanges): void {


    if (changes && changes.tab && changes.tab.previousValue !== changes.tab.currentValue) {
      this.goToTab(this.tab);
    }
  }

  getRncpTitleData() {
    this.subs.sink = this.rncpTitlesService.getRncpTitleById(this.selectedRncpTitleId).subscribe((resp) => {
      this.selectedRncpTitleName = resp.short_name;
      this.selectedRncpTitleLongName = resp.long_name;
    });
  }

  updateClassParam(event) {


    const result = _.cloneDeep(this.classData);

    if (result && result.length && result[this.classIndex] && event && result[this.classIndex].name !== event.name) {
      result[this.classIndex].name = event.name;
      this.updateClass.emit(result);
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
  onScroll(event) {

  }

  // avoid bug when the user open title manager task tab from another tab, the dialog cancel button won't work.
  onSelectedIndexChange(evt) {

    const tabName = this.translate.instant('Task Manager');
    const tabIdx = this.getTabIndex(tabName);

    if (this.selectedIndex === tabIdx && this.rncpTitlesService.childrenFormValidationStatus) {
      this.router.navigate([], {
        relativeTo: this.route,
        queryParams: {
          ...this.route.snapshot.queryParams,
          tab: 'titlemanagertask',
        },
      });
    }
  }

  getValidTab(tabName: string): any {
    if (tabName === this.translate.instant('Class Parameters')) {
      return true;
    } else if (tabName === this.translate.instant('Conditions')) {
      return true;
    } else if (tabName === this.translate.instant('JURY_PARAM.TITLE')) {
      return true;
    } else if (tabName === this.translate.instant('Jury Organization Parameter')) {
      return true;
    } else if (tabName === this.translate.instant('Final Transcript Parameters')) {
      return true;
    } else if (tabName === this.translate.instant('Certification Rule')) {
      return true;
    } else if (tabName === this.translate.instant('Certificate Parameter')) {
      return true;
    } else if (tabName === this.translate.instant('Connected school / user type')) {
      return true;
    } else if (tabName === this.translate.instant('Task Manager')) {
      return true;
    } else {
      return false;
    }
  }
  goToTab(tabName: string) {

    let idx;
    switch (tabName) {
      case 'classparameters':
        idx = this.getTabIndex(this.translate.instant('Class Parameters'));
        this.clickedTabIndex = idx;
        if (this.tabGroup) this.tabGroup.selectedIndex = idx;
        this.selectedIndex = this.clickedTabIndex;
        break;
      case 'titlemanagertask':
        idx = this.getTabIndex(this.translate.instant('Task Manager'));
        this.clickedTabIndex = idx;


        if (this.tabGroup) this.tabGroup.selectedIndex = idx;
        this.selectedIndex = this.clickedTabIndex;

        break;
      case 'connectedschool':
        idx = this.getTabIndex(this.translate.instant('Connected school / user type'));
        this.clickedTabIndex = idx;
        if (this.tabGroup) this.tabGroup.selectedIndex = idx;
        this.selectedIndex = this.clickedTabIndex;
        break;
      case 'conditions':
        idx = this.getTabIndex(this.translate.instant('Conditions'));
        this.clickedTabIndex = idx;
        if (this.tabGroup) this.tabGroup.selectedIndex = idx;
        this.selectedIndex = this.clickedTabIndex;
        break;
      case 'juryorganizationparameter':
        idx = this.getTabIndex(this.translate.instant('Jury Organization Parameter'));
        this.clickedTabIndex = idx;
        if (this.tabGroup) this.tabGroup.selectedIndex = idx;
        this.selectedIndex = this.clickedTabIndex;
        break;
      case 'certificationrule':
        idx = this.getTabIndex(this.translate.instant('Certification Rule'));
        this.clickedTabIndex = idx;
        if (this.tabGroup) this.tabGroup.selectedIndex = idx;
        this.selectedIndex = this.clickedTabIndex;
        break;
      default:
        break;
    }
  }

  getTabIndex(tabName: string): number {
    if (tabName === this.translate.instant('Class Parameters')) {
      return 0;
    } else if (tabName === this.translate.instant('Task Manager')) {
      return 1;
    } else if (tabName === this.translate.instant('Connected school / user type')) {
      return 2;
    } else if (tabName === this.translate.instant('Conditions')) {
      return 3;
    } else if (tabName === this.translate.instant('Jury Organization Parameter')) {
      return 4;
    } else if (tabName === this.translate.instant('Certification Rule')) {
      return 5;
    } else if (tabName === this.translate.instant('Certificate Parameter')) {
      return 6;
    } else {
      return -1;
    }
  }

  checkValidation(clickEvent: any) {
    let hasChanges = false;

    if (clickEvent && clickEvent.target) {
      // clickEvent.preventDefault();

      const validTab = this.getValidTab(clickEvent.target.innerText);
      if (validTab && this.rncpTitlesService.childrenFormValidationStatus) {

        this.clickedTabIndex = this.getTabIndex(clickEvent.target.innerText);
        if(this.clickedTabIndex === 1) {
          this.lastTab.emit(this.clickedTabIndex);
        } else {
          this.lastTab.emit(-1);
        }
        if (this.selectedIndex !== this.clickedTabIndex) {

          if (
            this.certificationRuleService.getDataCertificationChanged() ||
            (this.selectedIndex === 3 && this.conditionService.hasValidationDataChanged()) ||
            (this.selectedIndex === 3 && this.conditionService.validationAllowUserSave) ||
            (this.selectedIndex === 3 && this.conditionService.isConditionFormChanged)
          ) {
            Swal.fire({
              type: 'warning',
              title: this.translate.instant('TMTC_S01.TITLE'),
              text: this.translate.instant('TMTC_S01.TEXT'),
              footer: `<span style="margin-left: auto">TMTC_S01</span>`,
              confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
              showCancelButton: true,
              cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
              allowEscapeKey: false,
              allowOutsideClick: false,
            }).then((result) => {


              if (result.value) {
                return;
              } else if (result.dismiss) {
                this.certificationRuleService.setDataCertificationChanged(false);
                return (this.selectedIndex = this.clickedTabIndex);
              }
            });
          } else {
            return (this.selectedIndex = this.clickedTabIndex);
          }
        }
      } 
    }
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
        return false;
      } else {
        this.rncpTitlesService.childrenFormValidationStatus = true;
        this.selectedIndex = idx;
        return true && MatTabGroup.prototype._handleClick.apply(this.tabGroup, [tab, tabHeader, idx]);
      }
    });
  }
}
