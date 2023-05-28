import { ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { TranscriptProcessService } from 'app/service/transcript-process/transcript-process.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { MatTab, MatTabGroup, MatTabHeader } from '@angular/material/tabs';
import { TranslateService } from '@ngx-translate/core';
import { TranscriptProcessParameterComponent } from '../transcript-process-parameter/transcript-process-parameter.component';
import { TranscriptPublishParameterStepComponent } from '../transcript-publish-parameter-step/transcript-publish-parameter-step.component';
import { TranscriptInputDecisionComponent } from '../transcript-input-decision/transcript-input-decision.component';

@Component({
  selector: 'ms-transcript-process-detail',
  templateUrl: './transcript-process-detail.component.html',
  styleUrls: ['./transcript-process-detail.component.scss'],
})
export class TranscriptProcessDetailComponent implements OnInit, OnDestroy {
  @ViewChild('transcriptMatGroup', { static: false }) transcriptMatGroup: MatTabGroup;
  @ViewChild('processParameter', { static: false }) processParameter: TranscriptProcessParameterComponent;
  @ViewChild('publishParameter', { static: false }) publishParameter: TranscriptPublishParameterStepComponent;
  @ViewChild('transcriptInputDecision', { static: false }) transcriptInputDecision: TranscriptInputDecisionComponent;
  
  private subs = new SubSink();
  transcriptId;

  titleId;
  classId;
  certifierId;

  transcriptData;

  selectedIndex;

  constructor(
    private pageTitleService: PageTitleService,
    private transcriptService: TranscriptProcessService,
    private route: ActivatedRoute,
    private cdRef: ChangeDetectorRef,
    private translate: TranslateService,
  ) {}

  ngOnInit() {



    this.transcriptId = this.route.snapshot.paramMap.get('transcriptId');
    // this.route.snapshot.params

    this.cdRef.detectChanges();

    if (this.transcriptId) {
      this.subs.sink = this.transcriptService.getOneTranscriptProcess(this.transcriptId).subscribe((resp) => {

        this.transcriptData = _.cloneDeep(resp);

        if (this.transcriptData) {
          let transcriptName = '';
          let titleName = '';
          let className = '';
          if (this.transcriptData.name) {
            transcriptName = this.transcriptData.name;
          }
          if (this.transcriptData.rncp_title_id && this.transcriptData.rncp_title_id.short_name) {
            titleName = this.transcriptData.rncp_title_id.short_name;
            this.titleId = this.transcriptData.rncp_title_id._id;
          }
          if (this.transcriptData.class_id && this.transcriptData.class_id.name) {
            className = this.transcriptData.class_id.name;
            this.classId = this.transcriptData.class_id._id;
          }
          if (this.transcriptData.certifier_id && this.transcriptData.certifier_id._id) {
            this.certifierId = this.transcriptData.certifier_id._id;
          }

          // ************** For first time
          this.pageTitleService.setTitle(
            this.translate.instant('Transcript Process of', {
              transcriptName: transcriptName,
              titleName: titleName,
              className: className,
            }),
          );
          this.pageTitleService.setIcon('bullseye-arrow');

          // ************** If there is changes
          this.subs.sink = this.translate.onLangChange.subscribe((langChange) => {
            this.pageTitleService.setTitle(
              this.translate.instant('Transcript Process of', {
                transcriptName: transcriptName,
                titleName: titleName,
                className: className,
              }),
            );
          });

          // ************* Used for validation
          setTimeout(() => {
            this.transcriptMatGroup._handleClick = this.interceptTabChange.bind(this);
          }, 500);

          // ************** Used for routing to tab
          if (this.route.snapshot.queryParamMap.get('tab')) {
            setTimeout(() => this.goToTab(this.route.snapshot.queryParamMap.get('tab')), 500);
          }
        }
      });
    }
  }

  interceptTabChange(tab: MatTab, tabHeader: MatTabHeader, idx: number) {

    let result = false;
    let validation = false;

    if (this.transcriptMatGroup.selectedIndex === idx) {
      result = true;
      return result && MatTabGroup.prototype._handleClick.apply(this.transcriptMatGroup, arguments);
    } else {

      if (this.transcriptMatGroup.selectedIndex === 0) { // ************* For step 1 parameter process

        if (this.processParameter && this.processParameter.parameterForm && this.processParameter.savedForm) {
          const currentData = JSON.stringify(this.processParameter.parameterForm.value);
          const savedData = JSON.stringify(this.processParameter.savedForm);

          if (currentData === savedData) {
            validation = true;
          }
        }
      } else if (this.transcriptMatGroup.selectedIndex === 1) { // ************* For step 2 publish parameter
        if (this.publishParameter && this.publishParameter.publishParameterForm && this.publishParameter.savedForm) {
          const currentData = JSON.stringify(this.publishParameter.publishParameterForm.value);
          const savedData = JSON.stringify(this.publishParameter.savedForm);
          if (currentData === savedData) {
            validation = true;
          }
        }
      }
      else if (this.transcriptMatGroup.selectedIndex === 2) { // ************* For step 3 student result
        validation = this.transcriptInputDecision.checkValidationForm();
      } else {
        validation = true;
      }

      if (!validation) {
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('TMTC_S01.TITLE'),
          text: this.translate.instant('TMTC_S01.TEXT'),
          confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
          showCancelButton: true,
          cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
          allowOutsideClick: false,
        }).then((res) => {
          if (res.dismiss) {
            result = true;
            return result && MatTabGroup.prototype._handleClick.apply(this.transcriptMatGroup, arguments);
          }
        });
      } else {
        result = true;
        return result && MatTabGroup.prototype._handleClick.apply(this.transcriptMatGroup, arguments);
      }
    }
  }

  goToTab(destination: string) {
    if (this.transcriptMatGroup) {
      let index = 0;
      this.transcriptMatGroup._tabs.forEach((tab, tabIndex) => {

        if (tab.textLabel === destination) {
          index = tabIndex;
        }
      });
      this.selectedIndex = index;
    }
  }

  showPublishParameter() {
    const blocks =
      this.transcriptData && this.transcriptData.block_competence_condition_details
        ? this.transcriptData.block_competence_condition_details
        : [];
    const filteredblock = blocks.filter((block) => block.is_block_selected);

    if (filteredblock && filteredblock.length) {
      return true;
    } else {
      return false;
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.pageTitleService.setIcon('');
    this.pageTitleService.setTitle('');
  }
}
