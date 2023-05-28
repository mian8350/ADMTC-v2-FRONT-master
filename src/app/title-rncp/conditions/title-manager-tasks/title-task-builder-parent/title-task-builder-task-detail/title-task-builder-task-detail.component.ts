import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogConfig, MatDialogRef } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { TaskService } from 'app/service/task/task.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { ChangeDueDateTaskDialogComponent } from 'app/shared/components/change-due-date-task-dialog/change-due-date-task-dialog.component';
import { ApplicationUrls } from 'app/shared/settings';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import * as moment from 'moment';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { TitleTaskBuilderTaskAttachmentDialogComponent } from '../title-task-builder-task-dialogs/title-task-builder-task-attachment-dialog/title-task-builder-task-attachment-dialog.component';
import { TitleTaskBuilderTaskDocumentExpectedDialogComponent } from '../title-task-builder-task-dialogs/title-task-builder-task-document-expected-dialog/title-task-builder-task-document-expected-dialog.component';
import { TaskBuilderActionDialogComponent } from './../../../../../shared/components/task-builder-action-dialog/task-builder-action-dialog.component';
import * as _ from 'lodash';
@Component({
  selector: 'ms-title-task-builder-task-detail',
  templateUrl: './title-task-builder-task-detail.component.html',
  styleUrls: ['./title-task-builder-task-detail.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseLocalToUtcPipe],
})
export class TitleTaskBuilderTaskDetailComponent implements OnInit, OnDestroy {
  Editor = DecoupledEditor;
  editorConfig = {
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
    link: {
      addTargetToExternalLinks: true,
    },
  };
  generalDialogConfig: MatDialogConfig = {
    disableClose: true,
    width: '800px',
  };
  attachmentDialogRef: MatDialogRef<TitleTaskBuilderTaskAttachmentDialogComponent>;

  // @Input() type: string | undefined;
  // @Input() taskId: string;
  @Input() titleId: string;
  @Input() classId: string;

  @Output() formValueChange = new EventEmitter<boolean>();
  @Output() onLeaveEmitter = new EventEmitter<boolean>(null);
  @Output() saveReload = new EventEmitter<any>();

  private subs: SubSink = new SubSink();

  isEditTask = false;
  isViewTask = false;

  taskForm: UntypedFormGroup;
  timeOutVal: any;
  isSaved: boolean = true;
  isSaving: boolean = false;
  initialForm: any;
  type: string;
  taskId: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public dialog: MatDialog,
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private taskService: TaskService,
    private parseUtcToLocal: ParseUtcToLocalPipe,
    private parseLocalToUtc: ParseLocalToUtcPipe,
  ) {}

  ngOnInit() {
    this.getQueryParams();

    this.initTaskForm();

    this.subs.sink = this.taskForm.valueChanges.subscribe(() => {
      // this.isSaved = false;
      // this.formValueChange.emit(true);
      this.isFormChanged();
    });
    if (this.type === 'edit' && this.taskId) {
      this.isEditTask = true;
      this.populateTaskForm();
    }else if (this.type === 'view' && this.taskId) {
      this.isViewTask = true;
      this.populateTaskForm();
    }else {
      this.initialForm = this.taskForm.getRawValue();
    }
  }

  getQueryParams() {
    if (this.route && this.route.snapshot) {
      this.type = this.route.snapshot.queryParamMap.get('type');
      this.taskId = this.route.snapshot.queryParams['taskId'];

      this.isViewTask=false
      if (this.type === 'edit') {
        this.isEditTask = true;
      }else if (this.type === 'view') {
        this.isViewTask = true;
      }
    }
  }

  isFormChanged() {
    if (!this.taskForm || !this.initialForm) return;
    const secondForm = JSON.stringify(this.initialForm);
    const firstForm = JSON.stringify(this.taskForm.getRawValue());
    if (firstForm === secondForm) {
      this.taskService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.taskService.childrenFormValidationStatus = false;
      return false;
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  initTaskForm() {
    this.taskForm = this.fb.group({
      ref_id: this.fb.control({ value: null, disabled: true }),
      task_title: [null, Validators.required],
      description: [null],
      attachments: this.fb.array([]),
      expected_documents: this.fb.array([]),
      label_submit: ['Soumettre', Validators.required],
      label_cancel: ['Annuler', Validators.required],
      label_reject: ['Rejeter', Validators.required],
      label_validate: ['Valider', Validators.required],
      due_date: [null],
      assign_to_id: this.fb.group({
        _id: [null],
        name: [null],
      }),
      assigner_id: this.fb.group({
        _id: [null],
        name: [null],
      }),
    });
  }

  initDocumentAttached() {
    return this.fb.group({
      file_name: [null],
      s3_file_name: [null],
    });
  }

  initDocumentExpected() {
    return this.fb.group({
      expected_document_name: [''],
      is_required: [false],
    });
  }

  getDocumentExpectedFormarray(): UntypedFormArray {
    return this.taskForm.get('expected_documents') as UntypedFormArray;
  }

  createPayload() {
    const payload = {
      rncp_title_id: this.titleId,
      class_id: this.classId,
      ...this.taskForm.value,
      assign_to_id: this.taskForm.value.assign_to_id._id,
      assigner_id: this.taskForm.value.assigner_id._id,
    };
    return payload;
  }

  formatResponse(obj) {
    // return only the string _id of all object variables with key "_id"
    Object.entries(obj).forEach(([key, value]: any) => {
      if (value && typeof value === 'object' && value.hasOwnProperty('_id')) {
        obj[key] = value._id;
      }
    });
    return obj;
  }

  populateTaskForm() {
    this.subs.sink = this.taskService.getOneTaskBuilder(this.taskId).subscribe((response) => {
      if (response) {

        if (!response.label_cancel) response.label_cancel = 'Annuler';
        if (!response.label_reject) response.label_reject = 'Rejeter';
        if (!response.label_submit) response.label_submit = 'Soumettre';
        if (!response.label_validate) response.label_validate = 'Valider';

        const tempResult = _.omitBy(response, _.isNil);

        this.taskForm.patchValue(tempResult);

        if (response.due_date) {
          response.due_date.date = this.parseUTCDateToLocalDateString(response.due_date);
          response.due_date.time = this.parseUTCDateToLocalTimeString(response.due_date);
        }

        if (response.attachments && response.attachments.length) {
          for (let i = 0; i < response.attachments.length; i++) {
            const attachments = this.taskForm.get('attachments') as UntypedFormArray;
            const group = this.initDocumentAttached();
            group.patchValue(response.attachments[i]);
            attachments.push(group);
          }
        }

        if (response.expected_documents && response.expected_documents.length) {
          for (let i = 0; i < response.expected_documents.length; i++) {
            const expectedDocs = this.taskForm.get('expected_documents') as UntypedFormArray;
            const group = this.initDocumentExpected();
            group.patchValue(response.expected_documents[i]);
            expectedDocs.push(group);
          }
        }

        this.initialForm = this.taskForm.getRawValue();
        // this.taskForm.markAsPristine();
        // this.taskForm.markAsUntouched();
        // this.isSaved = true;
        // this.formValueChange.emit(false);
      }
    });
  }

  addExpectedDoc() {
    this.subs.sink = this.dialog
      .open(TitleTaskBuilderTaskDocumentExpectedDialogComponent, {
        disableClose: true,
        minWidth: '650px',
        maxWidth: '650px',
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          resp.data.forEach((doc) => {
            const expectedDoc = this.initDocumentExpected();
            expectedDoc.patchValue({
              expected_document_name: doc.document_expected_name,
              is_required: doc.is_required,
            });
            this.getDocumentExpectedFormarray().push(expectedDoc);
          });
        }
      });
  }

  onSave() {
    if(this.taskForm.invalid){
      this.taskForm.markAllAsTouched();
      Swal.fire({
        type: 'error',
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        footer: `<span style="margin-left: auto">FormSave_S1</span>`,
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
      return;
    }
    const payload = this.createPayload();
    this.isSaving = true;
    if (this.isEditTask) {
      this.subs.sink = this.taskService.updateOneTaskBuilder(this.taskId, payload).subscribe((response) => {
        this.isSaving = false;
        if (response) {

          // this.isSaved = true;
          // this.formValueChange.emit(false);
          this.initialForm = this.taskForm.getRawValue();
          this.isFormChanged();
          Swal.fire({
            type: 'success',
            title: 'Bravo!',
          });
        }
      });
    } else {
      this.subs.sink = this.taskService.createTaskBuilder(payload).subscribe((response) => {
        this.isSaving = false;
        if (response) {

          // this.isSaved = true;
          // this.formValueChange.emit(false);
          this.taskForm.get('ref_id').setValue(response.ref_id);
          this.initialForm = this.taskForm.getRawValue();
          this.isFormChanged();
          Swal.fire({
            type: 'success',
            title: 'Bravo!',
          }).then(() => {
            this.saveReload.emit({ taskId: response._id });
          });
        }
      });
    }
  }

  onDeleteDocumentExpected(idx: number) {
    const expectedDocumentName = this.getDocumentExpectedFormarray().at(idx).get('expected_document_name').value;
    let timeDisabled = 5;
    let confirmInterval;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('DELETE_EXPECTED_DOCUMENT_S1.TITLE'),
      html: this.translate.instant('DELETE_EXPECTED_DOCUMENT_S1.TEXT', { expectedDocumentName }),
      footer: `<span style="margin-left: auto">DELETE_EXPECTED_DOCUMENT_S1</span>`,
      confirmButtonText: this.translate.instant('DELETE_EXPECTED_DOCUMENT_S1.BUTTON1'),
      cancelButtonText: this.translate.instant('DELETE_EXPECTED_DOCUMENT_S1.BUTTON2'),
      showCancelButton: true,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_EXPECTED_DOCUMENT_S1.BUTTON1') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_EXPECTED_DOCUMENT_S1.BUTTON1');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      clearInterval(confirmInterval);
      if (res.value) {
        this.getDocumentExpectedFormarray().removeAt(idx);
      }
    });
  }

  onEditorReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  openTableKey() {
    const url = this.router.createUrlTree(['title-rncp/task-builder/key-tables', 'taskBuilder'], {
      queryParams: { lang: this.translate.currentLang },
    });
    window.open(url.toString(), '_blank', 'height=570,width=520,scrollbars=yes,top=250,left=900');
  }

  onPreview() {
    if(!this.isFormChanged()) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Preview_S1.TITLE'),
        text: this.translate.instant('Preview_S1.TEXT'),
        footer: `<span style="margin-left: auto">Preview_S1</span>`,
        showConfirmButton: true,
        confirmButtonText: this.translate.instant('Preview_S1.BUTTON')
      });
      return;
    }

    this.dialog.open(TaskBuilderActionDialogComponent, {
      width: '800px',
      disableClose: true,
      data: {
        taskId: this.taskId,
        type: 'preview',
      },
    });
  }

  onLeave() {
    this.onLeaveEmitter.emit(true);
  }

  onViewAttachedDoc(documentNameInS3) {
    if (typeof documentNameInS3 === 'string') {
      const url = ApplicationUrls.baseApi.replace('graphql', 'fileuploads/') + documentNameInS3;
      window.open(url, '_blank');
    }
  }

  onDeleteAttachedDocAt(idx) {
    if (typeof idx === 'number') {
      const attachmentName = this.taskForm.get('attachments').value[idx].file_name;
      let timeout = 5;
      let confirmInterval;

      Swal.fire({
        type: 'warning',
        title: this.translate.instant('DELETE_ATTACHMENT_S1.TITLE'),
        html: this.translate.instant('DELETE_ATTACHMENT_S1.HTML_TEXT', { attachmentName }),
        footer: `<span style="margin-left: auto">DELETE_ATTACHMENT_S1</span>`,
        confirmButtonText: this.translate.instant('DELETE_ATTACHMENT_S1.CONFIRM_BUTTON_TIMEOUT', { timeout }),
        cancelButtonText: this.translate.instant('NO'),
        showCancelButton: true,
        onOpen: () => {
          timeout--;
          Swal.disableConfirmButton();
          const confirmButtonRef = Swal.getConfirmButton();
          confirmInterval = setInterval(() => {
            if (timeout > 0) {
              confirmButtonRef.innerText = this.translate.instant('DELETE_ATTACHMENT_S1.CONFIRM_BUTTON_TIMEOUT', { timeout });
              timeout--;
            } else {
              Swal.enableConfirmButton();
              confirmButtonRef.innerText = this.translate.instant('YES');
              clearInterval(confirmInterval);
            }
          }, 1000);
        },
      }).then((result) => {
        clearInterval(confirmInterval);
        if (result.value) {
          const attachments = this.taskForm.get('attachments') as UntypedFormArray;
          attachments.removeAt(idx);
        }
      });
    }
  }

  openAttachmentDialog() {
    this.attachmentDialogRef = this.dialog.open(TitleTaskBuilderTaskAttachmentDialogComponent, this.generalDialogConfig);
    this.subs.sink = this.attachmentDialogRef.afterClosed().subscribe((result) => {
      if (result && result.attachments) {
        result.attachments.forEach((attachment) => {
          const attachments = this.taskForm.get('attachments') as UntypedFormArray;
          const group = this.initDocumentAttached();
          group.patchValue(attachment);
          attachments.push(group);
        });

      }
    });
  }

  parseUTCDateToLocal(obj: { date: string; time: string }) {
    const dateUTC = moment.utc(obj.date + obj.time, 'DD/MM/YYYYhh:mm').toDate();
    const dateMomentLocal = moment(dateUTC);
    return dateMomentLocal;
  }

  parseUTCDateToLocalDateString(date: { date: string; time: string }) {
    if (!date || !date.date || !date.time) return '-';
    return this.parseUTCDateToLocal(date).format('DD/MM/YYYY');
  }

  parseUTCDateToLocalTimeString(date: { date: string; time: string }) {
    if (!date || !date.date || !date.time) return '-';
    return this.parseUTCDateToLocal(date).format('hh:mm');
  }
}
