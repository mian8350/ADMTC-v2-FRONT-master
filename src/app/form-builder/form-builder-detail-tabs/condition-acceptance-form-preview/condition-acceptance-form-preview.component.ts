import { Component, Input, OnInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { ApplicationUrls } from 'app/shared/settings';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-condition-acceptance-form-preview',
  templateUrl: './condition-acceptance-form-preview.component.html',
  styleUrls: ['./condition-acceptance-form-preview.component.scss']
})
export class ConditionAcceptanceFormPreviewComponent implements OnInit {
  _stepId: string;
  @Input() currentStepIndex: number;
  @Input() set stepId(value: string) {
    this._stepId = value;
    this.fetchStepData(value);
  }
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');

  get stepId(): string {
    return this._stepId;
  }

  documentOnPreviewUrl: any;
  stepData: any;
  private subs = new SubSink();


  constructor(private sanitizer: DomSanitizer, private formBuilderService: FormBuilderService) { }

  ngOnInit() {
    if(!this.stepId) {
      this.initStepContractFormListener();
    }
  }
  
  fetchStepData(stepId) {
    this.subs.sink = this.formBuilderService.getOneFormBuilderStep(stepId).subscribe(step => {
      this.populateStepData(step);
    })
  }

  initStepContractFormListener() {
    this.subs.sink = this.formBuilderService.stepData$.subscribe(formData => {
      if(formData) {
        this.populateStepData(formData);
      }
    })
  }
  

  populateStepData(step) {
    this.stepData = step;
    if(step && step.segments[0] && step.segments[0].acceptance_pdf) {
      if(step.segments[0].document_for_condition === 'use_from_certification_rule') {
        this.documentOnPreviewUrl = null;
        return;
      }
  
      this.setPreviewUrl(step.segments[0].acceptance_pdf)
    } else {
      this.documentOnPreviewUrl = null;
    }
  }

  setPreviewUrl(url: string) {
    const result = this.serverimgPath + url + '#view=fitH';
    this.documentOnPreviewUrl = this.cleanUrlFormat(result);
  }

  cleanUrlFormat(url: string) {
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
