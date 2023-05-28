import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { SubSink } from 'subsink';
import { cloneDeep } from 'lodash';
import { TaskService } from 'app/service/task/task.service';
import * as moment from 'moment';
import * as _ from 'lodash';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { environment } from 'environments/environment';
import { TaskDynamicMessageDialogComponent } from '../task-dynamic-message-dialog/task-dynamic-message-dialog.component';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UtilityService } from 'app/service/utility/utility.service';

@Component({
  selector: 'ms-task-builder-action-dialog',
  templateUrl: './task-builder-action-dialog.component.html',
  styleUrls: ['./task-builder-action-dialog.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseLocalToUtcPipe],
})
export class TaskBuilderActionDialogComponent implements OnInit, OnDestroy {
  isRequired = false;
  public Editor = DecoupledEditor;
  public config = {
    toolbar: [
      'heading',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      'highlight:redPen',
      'highlight:greenPen',
      'removeHighlight',
      'numberedList',
      'bulletedList',
      'link',
      'undo',
      'redo',
    ],
  };

  taskBuilderForm: UntypedFormGroup;
  taskData: any;
  isWaitingForResponse: boolean = false;
  actionTaken = new UntypedFormControl('');
  notifMessageData: any;
  isUploadingFile: boolean = false;
  taskBuilderId: any;
  currentUser: any;
  isAssigner: boolean = false;
  isUserADMTC: any;

  private subs: SubSink = new SubSink();
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private taskService: TaskService,
    private rncpTitleService: RNCPTitlesService,
    public dialogRef: MatDialogRef<TaskBuilderActionDialogComponent>,
    private fb: UntypedFormBuilder,
    private fileUploadService: FileUploadService,
    private translate: TranslateService,
    private acadKitService: AcademicKitService,
    public dialog: MatDialog,
    private parseUtcToLocalPipe: ParseUtcToLocalPipe,
    private userService: AuthService,
    private utilService: UtilityService,
  ) {}

  get taskBuilderFormValue() {
    return this.taskBuilderForm.value;
  }

  ngOnInit() {

    this.currentUser = this.userService.getLocalStorageUser();
    this.isUserADMTC = this.utilService.isUserEntityADMTC();
    this.initTaskBuilderForm();
    if (this.data && this.data.taskId && this.data.type && this.data.type === 'preview') {
      this.getRandomTaskData();
    } else if (this.data && this.data.taskId && this.data.type && (this.data.type === 'task' || this.data.type === 'done')) {
      this.getOneTask();
    }
  }

  onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  // parseUTCDateToLocal(obj: { date: string; time: string }) {
  //   const dateUTC = moment.utc(obj.date + obj.time, 'DD/MM/YYYYhh:mm');
  //   const dateLocal = moment(dateUTC);
  // }

  parseUTCDateToLocalDateString(date: { date: string; time: string }) {
    if (!date || !date.date || !date.time) return '-';
    return this.parseUtcToLocalPipe.transformDate(date.date, date.time);
  }

  parseUTCDateToLocalTimeString(date: { date: string; time: string }) {
    if (!date || !date.date || !date.time) return '-';
    return this.parseUtcToLocalPipe.transform(date.time);
  }

  initTaskBuilderForm() {
    this.taskBuilderForm = this.fb.group({
      _id: [''],
      ref_id: this.fb.control({ value: null, disabled: true }),
      task_title: [null],
      description: [null],
      attachments: this.fb.array([]),
      expected_documents: this.fb.array([]),
      label_submit: ['Submit'],
      label_cancel: ['Cancel'],
      label_reject: ['Reject'],
      label_validate: ['Validate'],
      due_date: this.fb.group({
        date: [null],
        time: [null],
      }),
      assign_to_id: this.fb.group({
        name: [null],
      }),
      assigner_id: this.fb.group({
        name: [null],
      }),
    });
  }

  initDocumentExpected() {
    return this.fb.group({
      expected_document_name: [''],
      is_required: [false],
      document_id: [null],
      s3_file_name: [null],
    });
  }

  initDocumentAttached(): UntypedFormGroup {
    return this.fb.group({
      file_name: [null],
      s3_file_name: [null],
    });
  }

  getDocumentExpectedFormarray(): UntypedFormArray {
    return this.taskBuilderForm.get('expected_documents') as UntypedFormArray;
  }

  getAttachmentsFormArray(): UntypedFormArray {
    return this.taskBuilderForm.get('attachments') as UntypedFormArray;
  }

  getRandomTaskData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.taskService.getOneRandomTaskBuilder(this.data.taskId).subscribe(
      (response) => {
        this.isWaitingForResponse = false;
        if (response) {

          if (!response.assign_to_id) delete response.assign_to_id;
          if (!response.assigner_id) delete response.assigner_id;
          if (!response.label_cancel) response.label_cancel = 'Cancel';
          if (!response.label_reject) response.label_reject = 'Reject';
          if (!response.label_submit) response.label_submit = 'Submit';
          if (!response.label_validate) response.label_validate = 'Validate';

          this.taskBuilderForm.patchValue(response);

          if (response && response.assign_to_id) {
            if (response.assign_to_id.name && response.assign_to_id.name === 'ADMTC Director') {
              response.assign_to_id.name = 'Title Manager';
            }
            // translate here because the dialog will be used for the students as well.
            // hence avoiding the assigner/assigned person name to be translated i.e. 'USER_TYPES.Mme. Amandine Cenatiempo'
            this.taskBuilderForm.get('assign_to_id').patchValue({
              name: this.translate.instant('USER_TYPES.' + response.assign_to_id.name),
            });
          }
          if (response && response.assigner_id) {
            if (response.assigner_id.name && response.assigner_id.name === 'ADMTC Director') {
              response.assigner_id.name = 'Title Manager';
            }
            // translate here because the dialog will be used for the students as well.
            // hence avoiding the assigner/assigned person name to be translated i.e. 'USER_TYPES.Mme. Amandine Cenatiempo'
            this.taskBuilderForm.get('assigner_id').patchValue({
              name: this.translate.instant('USER_TYPES.' + response.assigner_id.name),
            });
          }

          if (response.attachments && response.attachments.length) {
            for (let i = 0; i < response.attachments.length; i++) {
              const attachments = this.taskBuilderForm.get('attachments') as UntypedFormArray;
              const group = this.initDocumentAttached();
              group.patchValue(response.attachments[i]);
              attachments.push(group);
            }
          }

          if (response.expected_documents && response.expected_documents.length) {
            for (let i = 0; i < response.expected_documents.length; i++) {
              const expectedDocs = this.taskBuilderForm.get('expected_documents') as UntypedFormArray;
              const group = this.initDocumentExpected();
              group.patchValue(response.expected_documents[i]);
              expectedDocs.push(group);
            }
          }

          this.taskBuilderForm.markAsPristine();
          this.taskBuilderForm.markAsUntouched();
        }
      },
      (error) => {
        this.isWaitingForResponse = false;
        console.error(error);
      },
    );
  }

  chooseFile(fileInput: Event, docExpIndex) {
    this.isUploadingFile = true;
    const file = (<HTMLInputElement>fileInput.target).files[0];
    if (file.type === 'application/pdf') {
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe(
        (resp) => {
          this.isUploadingFile = false;
          if (resp) {
            this.getDocumentExpectedFormarray().at(docExpIndex).get('s3_file_name').patchValue(resp.s3_file_name);
            const form = this.getDocumentExpectedFormarray().at(docExpIndex).value;
            // We call createAcadDoc to get document_id
            this.createAcadDoc(form, 'task_builder', docExpIndex);
          } else {
            Swal.fire({
              type: 'error',
              title: 'Error',
              allowOutsideClick: false,
              confirmButtonText: this.translate.instant('ok'),
            });
          }
        },
        (err) => {

          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          });
        },
      );
    } else {
      this.isUploadingFile = false;
    }
  }

  createAcadDoc(resp, type, docExpIndex) {
    // call mutation create acad doc
    const payload = {
      document_name: resp.name,
      type_of_document: type,
      document_generation_type: type,
      s3_file_name: resp.s3_file_name,
      parent_rncp_title: this.taskData.rncp._id,
      parent_class_id: [this.taskData.class_id._id],
      task_id: this.taskData._id,
      visible_to_school: true
    };
    this.isUploadingFile = true;
    this.subs.sink = this.acadKitService.createAcadDoc(payload).subscribe((response) => {
      if (response) {
        this.getDocumentExpectedFormarray().at(docExpIndex).get('document_id').patchValue(response._id);
      }
      this.isUploadingFile = false;
    });
  }

  getOneTask() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.taskService.getOneTaskAutoTaskBuilder(this.data.taskId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          this.taskData = _.cloneDeep(resp);
          const data = _.cloneDeep(resp.task_builder_id);
          const response = {
            ...data,
            description: this.taskData.auto_generated_task_description,
            expected_documents: this.taskData.document_expecteds,
          };
          // check is current user is ADMTC or is ASSIGNER allow user loggin to submit her/his task
          if (this.isUserADMTC || this.taskData?.user_selection?.user_id?._id === this.currentUser?._id) {
            this.isAssigner = false;
          } else if (this.taskData?.created_by?._id === this.currentUser?._id) {
            this.isAssigner = true;
          }
          if (response.expected_documents && response.expected_documents.length) {
            response.expected_documents.forEach((item) => {
              item.expected_document_name = item.name;
              delete item.name;
            });
          }

          if (this.taskData && this.taskData.created_by && this.taskData.created_by) {
            response.assigner_id.name =
              this.taskData.created_by.last_name +
              ' ' +
              this.taskData.created_by.first_name +
              ' ' +
              this.translate.instant(this.taskData.created_by.civility);
          }
          if (this.taskData && this.taskData.user_selection && this.taskData.user_selection.user_id) {
            response.assign_to_id.name =
              this.taskData.user_selection.user_id.last_name +
              ' ' +
              this.taskData.user_selection.user_id.first_name +
              ' ' +
              this.translate.instant(this.taskData.user_selection.user_id.civility);
          }
          // If no button label given set default value
          if (!response.label_cancel) response.label_cancel = 'Annuler';
          if (!response.label_reject) response.label_reject = 'Rejeter';
          if (!response.label_submit) response.label_submit = 'Soumettre';
          if (!response.label_validate) response.label_validate = 'Valider';

          if (this.taskData.validation_status === 'validation_in_process') {
            response.task_title = this.translate.instant('validation_task', {
              title: response.task_title ? response.task_title : '',
            });
          }

          // check attachment then push new form group
          if (response.attachments && response.attachments.length) {
            this.getAttachmentsFormArray().clear();
            for (let i = 0; i < response.attachments.length; i++) {
              const attachments = this.taskBuilderForm.get('attachments') as UntypedFormArray;
              const group = this.initDocumentAttached();
              attachments.push(group);
            }
          }
          // check doc_expected then push new form group
          if (response.expected_documents && response.expected_documents.length) {
            this.getDocumentExpectedFormarray().clear();
            response.expected_documents.forEach((item) => {
              const expectedDocs = this.taskBuilderForm.get('expected_documents') as UntypedFormArray;
              const group = this.initDocumentExpected();
              if (item.is_required) {
                group.get('s3_file_name').setValidators(Validators.required);
              }
              expectedDocs.push(group);
            });
          }
          this.actionTaken.patchValue(this.taskData.action_taken);
          if (this.data.type === 'done' || this.isAssigner) {
            this.actionTaken.disable();
          }
          this.taskData.task_builder_id = response;

          this.taskBuilderForm.patchValue(response);
          this.taskBuilderId = response._id;
          this.getOneNotificationAndMessage(response._id);
        }
      },
      (error) => {
        this.isWaitingForResponse = false;
        console.error(error);
      },
    );
  }

  getOneNotificationAndMessage(taskBuilderId) {
    const filter = { task_builder_id: taskBuilderId };
    this.subs.sink = this.rncpTitleService.getAllTaskBuilderMessages(filter).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp && resp.length) {
          this.notifMessageData = _.cloneDeep(resp);

        } else {
          this.notifMessageData = [];
        }
      },
      (error) => {

        this.isWaitingForResponse = false;
      },
    );
  }

  createPayload() {
    const form = _.cloneDeep(this.taskBuilderForm.getRawValue());
    if (form.expected_documents && form.expected_documents.length) {
      form.expected_documents.forEach((item) => {
        if (item) {
          item.name = item.expected_document_name;
          delete item.expected_document_name;
        }
      });
    }

    return {
      _id: this.taskData._id,
      action_taken: this.actionTaken.value,
      document_expecteds: form.expected_documents ? form.expected_documents.filter( data => data?.document_id) : null
    };
  }

  submitAndValidate() {
    if (this.checkFormValidity()) {
      return;
    } else {
      this.isWaitingForResponse = true;
      const payload = this.createPayload();

      this.subs.sink = this.taskService.doneTaskBuilder(payload._id, payload).subscribe(
        (resp) => {
          this.isWaitingForResponse = false;
          if (resp) {
            const isMessageExist = this.notifMessageData.filter((item) => item.type === 'message');
            if (isMessageExist && isMessageExist.length) {
              let stepMessage;
              const isRejectionFlow = this.taskData.task_builder_id.is_rejection_active;
              if (isRejectionFlow && this.taskData.validation_status === 'pending') {
                stepMessage = 'waiting_for_approval';
              } else if (
                isRejectionFlow &&
                (this.taskData.validation_status === 'validation_in_process' || this.taskData.validation_status === 'rejected')
              ) {
                stepMessage = 'approved';
              } else if (!isRejectionFlow && this.taskData.validation_status === 'pending') {
                stepMessage = 'done';
              }
              this.callCustomStepMessage(stepMessage);
            } else {
              this.callSwalBravo();
            }
          }
        },
        (error) => {
          this.isWaitingForResponse = false;
          console.error(error);
        },
      );
    }
  }

  rejectTask() {
    this.isWaitingForResponse = true;
    const payload = this.createPayload();

    this.subs.sink = this.taskService.rejectTaskBuilder(payload._id, payload).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          const isMessageExist = this.notifMessageData.filter((item) => item.type === 'message');
          if (isMessageExist && isMessageExist.length) {
            let stepMessage;
            const isRejectionFlow = this.taskData.task_builder_id.is_rejection_active;
            if (
              isRejectionFlow &&
              (this.taskData.validation_status === 'validation_in_process' || this.taskData.validation_status === 'rejected')
            ) {
              stepMessage = 'rejected';
            }
            this.callCustomStepMessage(stepMessage);
          } else {
            this.callSwalBravo();
          }
        }
      },
      (error) => {
        this.isWaitingForResponse = false;
        console.error(error);
      },
    );
  }

  openAttachment(s3_file_name) {
    if (s3_file_name && this.taskData && (this.data.type === 'task' || this.data.type === 'done')) {
      const url = `${environment.apiUrl}/fileuploads/${s3_file_name}?download=true`.replace('/graphql', '');
      window.open(url, '_blank');
    }
  }

  callCustomStepMessage(stepMessage) {
    const payload = this.createPayload();
    this.subs.sink = this.taskService.getTaskMessageWithTaskId(this.taskBuilderId, false, stepMessage, payload._id).subscribe((ressp) => {
      if (ressp) {
        this.subs.sink = this.dialog
          .open(TaskDynamicMessageDialogComponent, {
            width: '600px',
            minHeight: '100px',
            panelClass: 'certification-rule-pop-up',
            disableClose: true,
            data: {
              task_builder_id: this.taskBuilderId,
              isPreview: false,
              trigger_condition: stepMessage,
              task_id: payload._id,
            },
          })
          .afterClosed()
          .subscribe((resp) => {
            if (resp) {
              this.dialogRef.close(true);
            }
          });
      }
    });
  }

  callSwalBravo() {
    Swal.fire({
      type: 'success',
      title: this.translate.instant('Bravo'),
      confirmButtonText: this.translate.instant('OK'),
      allowOutsideClick: false,
      allowEscapeKey: false,
    }).then((res) => {
      if (res.value) {
        this.dialogRef.close(true);
      }
    });
  }

  checkFormValidity(): boolean {

    if (this.taskBuilderForm.invalid) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
      this.taskBuilderForm.markAllAsTouched();
      return true;
    } else {
      return false;
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
