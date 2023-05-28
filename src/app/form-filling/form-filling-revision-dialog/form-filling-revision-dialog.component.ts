import { Component, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { SpeechToTextDialogComponent } from 'app/shared/components/speech-to-text-dialog/speech-to-text-dialog.component';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { CKEditorComponent } from '@ckeditor/ckeditor5-angular';
import { UntypedFormControl } from '@angular/forms';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { FormFillingService } from '../form-filling.service';
import Swal from 'sweetalert2';
import * as moment from 'moment';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { StepDynamicMessageDialogComponent } from 'app/shared/components/step-dynamic-message-dialog/step-dynamic-message-dialog.component';
import { SubSink } from 'subsink';
@Component({
  selector: 'ms-form-filling-revision-dialog',
  templateUrl: './form-filling-revision-dialog.component.html',
  styleUrls: ['./form-filling-revision-dialog.component.scss'],
  providers: [ParseLocalToUtcPipe],
})
export class FormFillingRevisionDialogComponent implements OnInit, OnDestroy {
  public Editor = DecoupledEditor;
  @ViewChild('editor', { static: true }) editor: CKEditorComponent;
  text_message = new UntypedFormControl(null);
  isWaitingForResponse = false;
  messageDialogRef: MatDialogRef<StepDynamicMessageDialogComponent>;
  private subs = new SubSink();

  constructor(
    private dialog: MatDialog,
    private translate: TranslateService,
    private dialogRef: MatDialogRef<FormFillingRevisionDialogComponent>,
    private parseToUTC: ParseLocalToUtcPipe,
    private formFillingService: FormFillingService,
    private formBuilderService: FormBuilderService,
    @Inject(MAT_DIALOG_DATA) public data: { formData: any; stepId: string; existingMessages?: any[]; type?: string, formBuilderStepId: string },
  ) {}

  public config = {
    height: '20rem',
  };

  ngOnInit() {
    if (this.data.existingMessages) {
      this.data.existingMessages = this.formatExistingMessages(this.data.existingMessages);
    }
  }

  formatExistingMessages(messages) {
    return messages.map((message) => {
      if (message && message.created_by && typeof message.created_by === 'object') {
        return {
          ...message,
          created_by: message.created_by._id,
          user_type_id: message && message.user_type_id && message.user_type_id._id ? message.user_type_id._id : null,
        };
      }
    });
  }

  onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  recordNote() {
    this.dialog
      .open(SpeechToTextDialogComponent, {
        width: '700px',
        minHeight: '300px',
        panelClass: 'candidate-note-record',
        disableClose: true,
        data: '',
      })
      .afterClosed()
      .subscribe((text) => {
        const editorInstance = this.editor.editorInstance;
        if (text.trim()) {
          const voiceText = `${text}`;
          const displayText = editorInstance.getData() + voiceText;
          editorInstance.setData(displayText);
        }
      });
  }

  onSubmit() {
    if (this.data && this.data.type === 'reply') {
      this.reply();
    } else {
      this.askForRevision();
    }
  }

  askForRevision() {
    if (this.data.formData.userId) {
      this.isWaitingForResponse = true;
      const today = new Date();
      let payloadArray = this.data && this.data.existingMessages ? this.data.existingMessages : [];

      payloadArray.push({
        created_date: this.parseToUTC.transformDate(today.toLocaleDateString('en-GB'), '15:59'),
        created_time: this.parseToUTC.transform(moment().format('hh:mm')),
        created_by: this.data.formData.userId,
        message: this.text_message.value,
        user_type_id: this.data.formData && this.data.formData.userTypeId ? this.data.formData.userTypeId : null,
      });

      if (this.data.stepId) {
        // Ask Revision for Step
        this.formFillingService.askRevisionFormProcessStep(this.data.stepId, payloadArray).subscribe((resp) => {
          if (resp) {
            this.getStepMessage()
          }
        });
      } else {
        // Ask Revision for process
        this.formFillingService.askRevisionFormProcess(this.data.formData.formId, payloadArray).subscribe((resp) => {
          if (resp) {
            this.getStepMessage()
          }
        });
      }
    }
  }

  getStepMessage() {
    const stepID = this.data.formBuilderStepId;
    const formProcessID = this.data.formData.formId;
    const isPreview = false;
    const triggerCondition = 'rejected';
    this.subs.sink = this.formBuilderService.generateFormBuilderStepMessage(stepID, formProcessID, isPreview, triggerCondition).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          this.subs.sink = this.dialog
          .open(StepDynamicMessageDialogComponent, {
            minWidth: '600px',
            minHeight: '100px',
            maxWidth: '75vw',
            maxHeight: '75vh',
            panelClass: 'certification-rule-pop-up',
            disableClose: true,
            data: {
              step_id: stepID,
              form_process_id: formProcessID,
              is_preview: isPreview,
              dataPreview: null,
              triggerCondition: triggerCondition
            },
          })
          .afterClosed()
          .subscribe((result) => {
            this.isWaitingForResponse = true;
            this.closeDialog(resp);
          });
        } else {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo!'),
            confirmButtonText: this.translate.instant('OK'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          });
          this.closeDialog(true);
        }
      }
    )
  }

  reply() {
    if (this.data.formData.userId) {
      this.isWaitingForResponse = true;
      const today = new Date();
      const payload = {
        created_date: this.parseToUTC.transformDate(today.toLocaleDateString('en-GB'), '15:59'),
        created_time: this.parseToUTC.transform(moment().format('hh:mm')),
        created_by: this.data.formData.userId,
        message: this.text_message.value,
        user_type_id: this.data.formData && this.data.formData.userTypeId ? this.data.formData.userTypeId : null,
      };

      if (this.data.stepId) {
        // Ask Revision for Step
        this.formFillingService.replyRevisionMessageFormProcessStep(this.data.stepId, payload).subscribe((resp) => {
          if (resp) {
            this.isWaitingForResponse = false;
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo!'),
              confirmButtonText: this.translate.instant('OK'),
              allowEnterKey: false,
              allowEscapeKey: false,
              allowOutsideClick: false,
            }).then((resp) => {
              this.closeDialog(resp);
            });
          }
        });
      } else {
        // Ask Revision for process
        this.formFillingService.replyRevisionMessageFormProcess(this.data.formData.formId, payload).subscribe((resp) => {
          if (resp) {
            this.isWaitingForResponse = false;
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo!'),
              confirmButtonText: this.translate.instant('OK'),
              allowEnterKey: false,
              allowEscapeKey: false,
              allowOutsideClick: false,
            }).then((resp) => {
              this.closeDialog(resp);
            });
          }
        });
      }
    }
  }

  closeDialog(resp?: any) {
    this.dialogRef.close(resp);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
}
}
