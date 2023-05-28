import { Component, OnInit, Input, OnDestroy, ViewChild } from '@angular/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { ConditionsService } from 'app/service/conditions/conditions.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { ThirdStepScoreComponent } from './score/third-step-score/third-step-score.component';

@Component({
  selector: 'ms-class-condition',
  templateUrl: './class-condition.component.html',
  styleUrls: ['./class-condition.component.scss'],
})
export class ClassConditionComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  @ViewChild('ThirdStepScoreComponent', { static: false }) ThirdStepScoreComponent: ThirdStepScoreComponent;
  typeEvaluation;
  subTypeEvaluation;
  evaMaxPoint;
  className;
  titleName;
  titleLongName;
  evaluationStep;
  classConditionData;
  isClassDataLoaded = false;
  isWaitingForResponse = false;

  selectedIndex = 0;
  private timeOutVal: any;

  constructor(
    private rncpTitleService: RNCPTitlesService,
    public translate: TranslateService,
    private conditionService: ConditionsService,
  ) {}

  ngOnInit() {
    this.getClassData();
  }

  getValidTab(tabName: string): any {
    if (tabName === this.translate.instant('Step 1 : Evaluation Type')) {
      return true;
    } else if (tabName === this.translate.instant('CONDITION_SCORE.Step 2 : Condition')) {
      return true;
    } else if (tabName === this.translate.instant('CONDITION_SCORE.Step 3 : Validation')) {
      return true;
    } else {
      return false;
    }
  }

  // getTabIndex(tabName: string): number {
  //   if (tabName === this.translate.instant('Step 1 : Evaluation Type')) {
  //     return 0;
  //   } else if (tabName === this.translate.instant('CONDITION_SCORE.Step 2 : Condition')) {
  //     return 1;
  //   } else if (tabName === this.translate.instant('CONDITION_SCORE.Step 3 : Validation')) {
  //     return 2;
  //   } else {
  //     return -1;
  //   }
  // }

  setActiveTab(clickEvent: any, tabIndex: any) {
    clickEvent.preventDefault();
    const validTab = this.getValidTab(clickEvent.target.innerText);
    if (validTab) {
      // tabIndex = this.getTabIndex(clickEvent.target.innerText);
      if (this.selectedIndex !== tabIndex) {
        // if (this.selectedIndex !== 2 || tabIndex === 2) {
        if (
          this.conditionService.hasValidationDataChanged() ||
          (this.selectedIndex === 2 && this.conditionService.validationAllowUserSave) ||
          (this.selectedIndex === 2 && this.conditionService.isConditionFormChanged)
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
            } else this.selectedIndex = tabIndex;
            this.conditionService.validationAllowUserSave = false;
          });
        } else {
          return (this.selectedIndex = tabIndex);
        }
      }
    }
  }

  getClassData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.getClassCondition(this.selectedClassId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        this.classConditionData = _.cloneDeep(resp);
        if (this.classConditionData) {
          if (!this.classConditionData.competency) {
            this.classConditionData.competency = {
              allow_competency_auto_evaluation: true,
              allow_competency_pro_evaluation: true,
            };
          }
          if (!this.classConditionData.soft_skill) {
            this.classConditionData.soft_skill = {
              allow_soft_skill: true,
              allow_soft_skill_auto_evaluation: true,
              allow_soft_skill_pro_evaluation: true,
              allow_pc_soft_skill_eval: true
            };
          }
        }

        if (resp.type_evaluation) {
          this.typeEvaluation = resp.type_evaluation;
        }
        if (resp.sub_type_evaluation) {
          this.subTypeEvaluation = resp.sub_type_evaluation;
        }
        if (resp && resp.evaluation_max_point) {
          this.evaMaxPoint = resp.evaluation_max_point;
        }
        if (resp && resp.evaluation_step) {
          this.evaluationStep = resp.evaluation_step;
        }
        if (resp.name) {
          this.className = resp.name;
        }
        if (resp.parent_rncp_title && resp.parent_rncp_title.short_name) {
          this.titleName = resp.parent_rncp_title.short_name;
        }
        if (resp.parent_rncp_title && resp.parent_rncp_title.long_name) {
          this.titleLongName = resp.parent_rncp_title.long_name;
        }
      }
      this.isClassDataLoaded = true;
    });
  }

  assignTypeEva(emittedValue: string) {

    if (emittedValue) {
      this.typeEvaluation = emittedValue;
    }
  }

  assignSubTypeEva(emittedValue: string) {

    if (emittedValue) {
      this.subTypeEvaluation = emittedValue;
    }
  }

  goToNextTab(destination: number) {
    this.timeOutVal = setTimeout(() => {
      this.selectedIndex = destination;
    }, 500);
    // clearTimeout(this.timeOutVal);
  }

  updateStep(event: any) {

    if (
      event &&
      typeof event === 'string' &&
      (event === 'none' || event === 'first' || event === 'second' || event === 'third' || event === 'fourth' || event === 'fifth' || event === 'sixth')
    ) {
      this.evaluationStep = event;
      this.goToNextTab(this.selectedIndex + 1);
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
