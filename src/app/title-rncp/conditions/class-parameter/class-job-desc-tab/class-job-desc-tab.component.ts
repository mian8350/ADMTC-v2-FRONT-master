import { Component, Input, OnInit, OnDestroy, OnChanges, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import * as moment from 'moment';
import { forkJoin } from 'rxjs';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-class-job-desc-tab',
  templateUrl: './class-job-desc-tab.component.html',
  styleUrls: ['./class-job-desc-tab.component.scss'],
})
export class ClassJobDescTabComponent implements OnInit, OnDestroy, OnChanges, AfterViewChecked {
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
  // ************* For Job Desc Template
  quetionaireList: any;
  originalQuetionaireList: any;
  jobDescriptionForm: UntypedFormGroup;
  constructor(
    private fb: UntypedFormBuilder,
    public translate: TranslateService,
    private rncpTitleService: RNCPTitlesService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.initJobForm();
    this.getFormData();
    this.getDataQuestionaire();
    // this.subs.sink = this.jobDescriptionForm.get('time').valueChanges.subscribe((time) => {

    //   this.onChangesFormJob();
    // });
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
    this.jobDescriptionForm = this.fb.group({
      name: [this.selectedClassName],
      allow_job_description: [true],
      parent_rncp_title: [this.selectedRncpTitleId],
      questionnaire_template_id: [''],
      job_desc_activation_date: this.fb.group({
        date: [''],
        time: [''],
      }),
      is_mentor_selected_in_job_description: [false],
    });
  }

  getDataQuestionaire() {
    const forkParam = [];
    forkParam.push(this.rncpTitleService.getQuestionaireJobDesc());
    // forkParam.push(this.rncpTitleService.getQuestionaireProblematic());

    this.subs.sink = forkJoin(forkParam).subscribe((resp) => {
      if (resp && resp.length) {
        let count = 0;
        if (resp[count]) {
          this.quetionaireList = resp[count];
          this.originalQuetionaireList = resp[count];
          count++;
        }
      }
    });
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
      this.classData = _.cloneDeep(resp);
      if (resp.questionnaire_template_id && resp.questionnaire_template_id._id) {
        resp.questionnaire_template_id = resp.questionnaire_template_id._id
      }
      if (resp.job_desc_activation_date) {
        resp.job_desc_activation_date.date = this.parseStringDatePipe.transformStringToDate(
          this.parseUTCToLocalPipe.transformDate(resp.job_desc_activation_date.date, resp.job_desc_activation_date.time),
        );
        resp.job_desc_activation_date.time = this.parseUTCToLocalPipe.transform(resp.job_desc_activation_date.time);
      }
      const omitResp = _.omitBy(resp, _.isNil);
      this.jobDescriptionForm.patchValue(omitResp);
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
    const payload = _.cloneDeep(this.jobDescriptionForm.value);
    if (payload.parent_rncp_title && payload.parent_rncp_title._id) {
      payload.parent_rncp_title = payload.parent_rncp_title._id;
    }
    payload.job_desc_activation_date = {
      date: this.getConvertDate(payload.job_desc_activation_date.date, payload.job_desc_activation_date.time),
      time: this.getTodayTime(payload.job_desc_activation_date.time),
    };
    if (this.classData && this.classData.type_evaluation === 'expertise') {
      delete payload.questionnaire_template_id;
    }
    payload.allow_job_description = true;




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
        });
      }
    }, (err) => {

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
    });
  }
}
