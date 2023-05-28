import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { ApplicationUrls } from 'app/shared/settings';
import { SubSink } from 'subsink';
import * as _ from 'lodash';

@Component({
  selector: 'ms-final-messages-preview',
  templateUrl: './final-messages-preview.component.html',
  styleUrls: ['./final-messages-preview.component.scss']
})
export class FinalMessagesPreviewComponent implements OnInit, OnDestroy {
  _stepId: string;
  serverimgPath = `${ApplicationUrls.baseApi}/fileuploads/`.replace('/graphql', '');
  private subs = new SubSink();
  @Input() currentStepIndex: number;
  formData: any;
  @Input() set stepId(value: string) {
    this._stepId = value;
    this.fetchStepData(value);
  }

  get stepId(): string {
    return this._stepId;
  }

  constructor(private formBuilderService: FormBuilderService) { }

  ngOnInit() {
    if(!this.stepId) {
      this.initStepFinalFormListener();
    }
  }

  fetchStepData(stepId) {
    this.subs.sink = this.formBuilderService.getOneFormBuilderStep(stepId).subscribe(resp => {
      if(resp) {
        const data = _.cloneDeep(resp);

        this.formData = data;
      }
    })
  }

  initStepFinalFormListener() {
    this.subs.sink = this.formBuilderService.stepData$.subscribe(data => {
      if(data) {
        

        this.formData = data;
        // this.initTemplateStepForm();
        // this.populateStepData(formData);
      }
    })
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
