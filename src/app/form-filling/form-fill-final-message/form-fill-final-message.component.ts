import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl } from '@angular/forms';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { environment } from 'environments/environment';
import { SubSink } from 'subsink';
import { FormFillingService } from '../form-filling.service';

@Component({
  selector: 'ms-form-fill-final-message',
  templateUrl: './form-fill-final-message.component.html',
  styleUrls: ['./form-fill-final-message.component.scss'],
})
export class FormFillFinalMessageComponent implements OnInit, OnDestroy {
  @Input() stepData: any;
  config = {
    toolbar: [],
    minHeight: '20rem',
  };
  editor: any;
  Editor = DecoupledEditor;
  headerMsg = new UntypedFormControl(null);
  footerMsg = new UntypedFormControl(null);
  imgURL: string;
  headerText = '';
  footerText = '';

  private subs: SubSink = new SubSink();

  constructor(private formFillingServ: FormFillingService) {}

  ngOnInit() {

    this.formatStepData();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  formatStepData() {
    if (
      this.stepData &&
      this.stepData.segments &&
      this.stepData.segments.length &&
      this.stepData.segments[0] &&
      this.stepData.segments[0].questions &&
      this.stepData.segments[0].questions &&
      this.stepData.segments[0].questions.length &&
      this.stepData.segments[0].questions[0] &&
      this.stepData.segments[0].questions[0].final_message_question &&
      this.stepData.segments[0].questions[0].final_message_question.final_message_image &&
      this.stepData.segments[0].questions[0].final_message_question.final_message_image.s3_file_name
      // this.stepData.segments[0].questions[0].final_message_question.final_message_summary_header &&
      // this.stepData.segments[0].questions[0].final_message_question.final_message_summary_footer
    ) {
     
      const filename = this.stepData.segments[0].questions[0].final_message_question.final_message_image.s3_file_name;
      this.imgURL = environment.apiUrl.replace('/graphql', '/fileuploads/') + filename;

    }

    if (
      this.stepData &&
      this.stepData.segments &&
      this.stepData.segments.length &&
      this.stepData.segments[0] &&
      this.stepData.segments[0].questions &&
      this.stepData.segments[0].questions &&
      this.stepData.segments[0].questions.length &&
      this.stepData.segments[0].questions[0] &&
      this.stepData.segments[0].questions[0].final_message_question) {
        const header = this.stepData.segments[0].questions[0].final_message_question.final_message_summary_header;
        const footer = this.stepData.segments[0].questions[0].final_message_question.final_message_summary_footer;
        this.headerMsg.patchValue(header);
        this.footerMsg.patchValue(footer);
        this.headerText = header;
        this.footerText = footer;
      }
  }
}
