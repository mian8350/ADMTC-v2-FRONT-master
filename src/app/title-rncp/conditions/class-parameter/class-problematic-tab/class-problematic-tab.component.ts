import { Component, Input, OnInit, OnDestroy, OnChanges, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { FormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import * as moment from 'moment';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'ms-class-problematic-tab',
  templateUrl: './class-problematic-tab.component.html',
  styleUrls: ['./class-problematic-tab.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe]
})
export class ClassProblematicTabComponent implements OnInit, OnDestroy, OnChanges, AfterViewChecked {
  private subs = new SubSink();
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  @Input() selectedClassName: string;
  @Input() classData: any;
  @Input() classForm: any;

  selectedIndex = 0;
  isWaitingForResponse = false;
  contractActive = false;
  jobActive = false;
  problemActive = false;
  esActive = false;
  mentorActive = false;
  isDisabledButton = false;

  today = new Date();
  problematicQuetionaireList: any;
  problematicForm: UntypedFormGroup;

  constructor(
    private fb: UntypedFormBuilder,
    public translate: TranslateService,
    private rncpTitleService: RNCPTitlesService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private cdr: ChangeDetectorRef,
    ) { }

  ngOnInit() {
    this.initJobForm();
    this.getFormData();
    this.getDataQuestionaire();
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
  ngOnChanges() {
    this.initJobForm();
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }
  initJobForm() {
    this.problematicForm = this.fb.group({
      name: [this.selectedClassName],
      allow_problematic: [true],
      parent_rncp_title: [this.selectedRncpTitleId],
      problematic_questionnaire_template_id: [null],
      problematic_send_to_certifier_time: ['after_all_student_in_one_school'],
      problematic_activation_date: this.fb.group({
        date: [''],
        time: ['']
      })
    });
  }

  getDataQuestionaire() {
    const forkParam = [];
    forkParam.push(this.rncpTitleService.getQuestionaireProblematic());

    this.subs.sink = forkJoin(forkParam).subscribe(resp => {
      if (resp && resp.length) {
        let count = 0;
        if (resp[count]) {
          this.problematicQuetionaireList = resp[count];
          count++;
        }
      }
    })
  }

  contractControl(data) {
    if (data.allow_job_description || data.allow_problematic || data.allow_mentor_evaluation || data.allow_employability_survey) {
      this.contractActive = true;
    }

    this.jobActive = data.allow_job_description;
    this.problemActive = data.allow_problematic;
    this.mentorActive = data.allow_mentor_evaluation;
    this.esActive = data.allow_employability_survey;

    this.checkTabActive();
  }

  checkTabActive() {
    if (this.jobActive || this.problemActive || this.mentorActive || this.esActive) {
      if (this.jobActive) {
        this.selectedIndex = 0;
      } else if (this.problemActive) {
        this.selectedIndex = 1;
      } else if (this.mentorActive) {
        this.selectedIndex = 2;
      } else if (this.esActive) {
        this.selectedIndex = 3;
      }
    }
  }
  getFormData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.getClassById(this.selectedClassId).subscribe((response) => {
      this.isWaitingForResponse = false;
      const resp = _.cloneDeep(response);
      if (resp.parent_rncp_title && resp.parent_rncp_title._id) {
        resp.parent_rncp_title = resp.parent_rncp_title._id;
      }
      if (resp && resp.problematic_questionnaire_template_id && resp.problematic_questionnaire_template_id._id) {
        resp.problematic_questionnaire_template_id = resp.problematic_questionnaire_template_id._id;
      }
      if (resp.problematic_activation_date) {
        resp.problematic_activation_date.date = this.parseStringDatePipe.transformStringToDate(
          this.parseUTCToLocalPipe.transformDate(resp.problematic_activation_date.date, resp.problematic_activation_date.time),
        );
        resp.problematic_activation_date.time = this.parseUTCToLocalPipe.transform(resp.problematic_activation_date.time);
      }
      this.classData = _.cloneDeep(resp);
      const omitResp = _.omitBy(resp, _.isNil);
      this.problematicForm.patchValue(omitResp);

    });
  }
  getConvertDate(date, time) {
    const today = moment(date).format('DD/MM/YYYY');
    return this.parseLocalToUTCPipe.transformDate(today, time);
  }

  getTodayTime(time) {
    return this.parseLocalToUTCPipe.transform(time);
  }

  createPayload() {
    const payload = _.cloneDeep(this.problematicForm.value);
    if (payload.problematic_activation_date && payload.problematic_activation_date.date && payload.problematic_activation_date.time) {
      payload.problematic_activation_date = {
        date: this.getConvertDate(payload.problematic_activation_date.date, payload.problematic_activation_date.time),
        time: this.getTodayTime(payload.problematic_activation_date.time),
      }
    }
    payload.allow_problematic = true;
    return payload;
  }

  save() {
    const payload = this.createPayload();
    this.subs.sink = this.rncpTitleService.updateClassParameter(this.selectedClassId, payload).subscribe((response) => {
      this.isWaitingForResponse = false;

      if (response && response.data && response.data.UpdateClass && !response.errors) {
        const resp = response.data.UpdateClass;
        Swal.fire({
          type: 'success',
          title: 'Bravo!',
          text: this.translate.instant('CLASS_UPDATED_SWAL', { className: resp.name }),
        })
      }
    });
  }
}
