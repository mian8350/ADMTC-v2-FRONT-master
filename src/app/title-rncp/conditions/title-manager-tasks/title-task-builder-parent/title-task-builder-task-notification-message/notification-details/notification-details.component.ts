import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { UserService } from 'app/service/user/user.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { Observable, of } from 'rxjs';
import { map, startWith, tap } from 'rxjs/operators';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import * as _ from 'lodash';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { ActivatedRoute } from '@angular/router';
import { TaskService } from 'app/service/task/task.service';

@Component({
  selector: 'ms-notification-details',
  templateUrl: './notification-details.component.html',
  styleUrls: ['./notification-details.component.scss'],
})
export class NotificationDetailsComponent implements OnInit, OnChanges, OnDestroy {
  @Input() refSelected: any;
  @Input() isPublished: boolean;
  @Output() updateTabs = new EventEmitter();
  @Input() isViewTask;

  @ViewChild('handlePdf', { static: false }) uploadInput: any;
  includePdf = false;
  showDownload = false;
  private subs = new SubSink();
  listData = [];
  isWaitingForResponse = false;
  formDetails: UntypedFormGroup;

  recipientList: any;
  recipientCCList: any;
  signatoryList: any;

  sendingList: any;
  userTypesList: any;
  filteredUserTypesList: Observable<any[]>;

  filterRecipient = new UntypedFormControl('');
  filterRecipientCC = new UntypedFormControl('');
  filterSignatory = new UntypedFormControl('');

  public Editor = DecoupledEditor;
  public config = {
    toolbar: [
      'heading',
      '|',
      'fontSize',
      'fontFamily',
      'fontColor',
      'fontBackgroundColor',
      '|',
      'bold',
      'italic',
      'underline',
      'strikethrough',
      '|',
      'alignment',
      '|',
      'numberedList',
      'bulletedList',
      'todoList',
      '|',
      'indent',
      'outdent',
      '|',
      'link',
      'blockQuote',
      'imageUpload',
      'insertTable',
      'horizontalLine',
      'pageBreak',
      '|',
      'undo',
      'redo',
    ],
    link: {
      addTargetToExternalLinks: true,
    },
    table: {
      contentToolbar: ['tableColumn', 'tableRow', 'mergeTableCells', 'tableProperties', 'tableCellProperties'],
    },
    image: {
      toolbar: [
        {
          name: 'imageStyle:pictures',
          items: ['imageStyle:alignBlockLeft', 'imageStyle:block', 'imageStyle:alignBlockRight'],
          defaultItem: 'imageStyle:block',
        },
        {
          name: 'imageStyle:icons',
          items: ['imageStyle:alignLeft', 'imageStyle:alignRight'],
          defaultItem: 'imageStyle:alignLeft',
        },
      ],
    },
  };
  editor: any;
  timeOutVal: any;
  teacher_as_recipient: any;
  teacher_as_cc: any;
  taskId;
  initialData: any;
  isUploadingFile = false;
  document_name_attachment = new UntypedFormControl('');

  filteredSendingList: Observable<any[]>;
  filteredRecipientList;
  filteredRecipientCCList;
  filteredSignatoryList;

  constructor(
    private utilService: UtilityService,
    private fileUploadService: FileUploadService,
    private translate: TranslateService,
    private fb: UntypedFormBuilder,
    private userService: UserService,
    private rncpTitleService: RNCPTitlesService,
    private route: ActivatedRoute,
    private taskService: TaskService,
  ) {}

  ngOnInit() {
    this.taskId = this.route.snapshot.queryParams['taskId'];
    this.initFormDetails();
    this.initValueChange();
    this.initEditor();
    this.getUserTypes();
    this.getSendingConditionDropdown();

    this.subs.sink = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.getUserTypes();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {

    this.patchNotifForm();
  }

  initEditor() {
    // this.config['isReadOnly']=this.isViewTask
    this.subs.sink = DecoupledEditor.create(document.querySelector('.document-editor__editable'), this.config)
      .then((editor) => {
        const toolbarContainer = document.querySelector('.document-editor__toolbar');
        toolbarContainer.appendChild(editor.ui.view.toolbar.element);
        editor.isReadOnly = this.isViewTask ? true : false;
        editor.model.document.on('change:data', () => {
          const data = editor.getData();
          const control = this.formDetails.get('body');
          if (data && !control.touched) control.markAsTouched();
          if (data && !control.dirty) control.markAsDirty();
          control.patchValue(data);
        });
        this.editor = editor;
      })
      .catch((err) => {
        console.error(err);
      });
    // DecoupledEditor.enableReadOnlyMode( '.document-editor__editable' );
  }

  initFormDetails() {
    this.formDetails = this.fb.group({
      ref_id: [this.refSelected.ref_id, [Validators.required]],
      trigger_condition: [null, [Validators.required]],
      recipient: [null, [Validators.required]],
      recipient_in_cc: [null],
      signatory: [null, [Validators.required]],
      attachments: this.fb.array([]),
      subject: [null, [Validators.required]],
      body: [null, [Validators.required]],
    });
  }

  initAttachmentsForm() {
    return this.fb.group({
      name: ['', [Validators.required]],
      s3_file_name: ['', [Validators.required]],
    });
  }

  getAttachmentsFormarray(): UntypedFormArray {
    return this.formDetails.get('attachments') as UntypedFormArray;
  }

  onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  onValueRecChange() {
    if (this.filterRecipient.value) {
      const searchString = this.filterRecipient.value.toLowerCase().trim();
      this.filteredRecipientList = this.recipientList.filter((test) => test.name.toLowerCase().trim().includes(searchString));
    } else {
      this.filteredRecipientList = this.recipientList;
      this.formDetails.get('recipient').patchValue(null, { emitEvent: false });
    }
  }
  onValueRecCCChange() {
    if (this.filterRecipientCC.value) {
      const searchString = this.filterRecipientCC.value.toLowerCase().trim();
      this.filteredRecipientCCList = this.recipientCCList.filter((test) => test.name.toLowerCase().trim().includes(searchString));
    } else {
      this.filteredRecipientCCList = this.recipientCCList;
      this.formDetails.get('recipient_in_cc').patchValue(null, { emitEvent: false });
    }
  }
  onValueSigChange() {
    if (this.filterSignatory.value) {
      const searchString = this.filterSignatory.value.toLowerCase().trim();
      this.filteredSignatoryList = this.signatoryList.filter((test) => test.name.toLowerCase().trim().includes(searchString));
    } else {
      this.filteredSignatoryList = this.signatoryList;
      this.formDetails.get('signatory').patchValue(null, { emitEvent: false });
    }
  }

  onFilterValue() {
    this.filteredRecipientList = this.filterRecipient.valueChanges.pipe(
      startWith(''),
      map((searchTxt) => {
        if (searchTxt) {
          return this.recipientList.filter((option) =>
            option.name ? option.name.toLowerCase().includes(searchTxt.toLowerCase()) : this.recipientList,
          );
        } else {
          this.formDetails.get('recipient').patchValue('');
          return this.recipientList;
        }
      }),
    );

    this.filteredRecipientCCList = this.filterRecipientCC.valueChanges.pipe(
      startWith(''),
      map((searchTxt) => {
        if (searchTxt) {
          return this.recipientCCList.filter((option) =>
            option.name ? option.name.toLowerCase().includes(searchTxt.toLowerCase()) : this.recipientCCList,
          );
        } else {
          this.formDetails.get('recipient_in_cc').patchValue('');
          return this.recipientCCList;
        }
      }),
    );

    this.filteredSignatoryList = this.filterSignatory.valueChanges.pipe(
      startWith(''),
      map((searchTxt) => {
        if (searchTxt) {
          return this.signatoryList.filter((option) =>
            option.name ? option.name.toLowerCase().includes(searchTxt.toLowerCase()) : this.signatoryList,
          );
        } else {
          this.formDetails.get('signatory').patchValue('');
          return this.signatoryList;
        }
      }),
    );
  }

  selectRecipient(value) {

    const rec = this.recipientList.find((val) => val.name === value);

    if (rec) this.formDetails.get('recipient').patchValue(rec._id);
  }
  selectRecipientCC(value) {
    const recCC = this.recipientCCList.find((val) => val.name === value);

    if (recCC) this.formDetails.get('recipient_in_cc').patchValue(recCC._id);
  }
  selectSignatory(value) {
    const sig = this.signatoryList.find((val) => val.name === value);

    if (sig) this.formDetails.get('signatory').patchValue(sig);
  }

  onFileChange($event) {

    const [file] = $event.target.files;
    const documentName = this.document_name_attachment.value;
    this.isUploadingFile = true;
    this.subs.sink = this.fileUploadService.singleUpload(file, documentName).subscribe(
      (response) => {
        this.isUploadingFile = false;
        const newFileFormGroup = this.initAttachmentsForm();
        newFileFormGroup.patchValue({
          name: documentName,
          s3_file_name: response.s3_file_name,
        });
        this.getAttachmentsFormarray().push(newFileFormGroup);
        this.document_name_attachment.reset();
      },
      (error) => {
        this.isUploadingFile = false;
        console.error(error);
      },
    );
  }

  onDeleteFileAt(id) {
    const attachmentName = this.getAttachmentsFormarray().at(id).get('name').value;
    let timeout = 5;
    let confirmInterval;

    Swal.fire({
      type: 'warning',
      title: this.translate.instant('DELETE_ATTACHMENT_S1.TITLE'),
      html: this.translate.instant('DELETE_ATTACHMENT_S1.HTML_TEXT', { attachmentName }),
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
        this.getAttachmentsFormarray().removeAt(id);
      }
    });
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

  patchNotifForm() {

    this.isWaitingForResponse = true;
    if (this.refSelected) {
      this.subs.sink = this.rncpTitleService.getOneTaskBuilderNotificationAndMessage(this.refSelected._id).subscribe((resp) => {
        if (resp) {
          this.isWaitingForResponse = false;
          let notifData = _.cloneDeep(resp);

          if (notifData.type === 'notification') {
            notifData.recipient = notifData.recipient ? notifData.recipient._id : null;
            notifData.recipient_in_cc = notifData.recipient_in_cc ? notifData.recipient_in_cc._id : null;
            notifData.signatory = notifData.signatory ? notifData.signatory._id : null;
            notifData.trigger_condition = notifData.trigger_condition ? notifData.trigger_condition : null;
            notifData.subject = notifData.subject ? notifData.subject : null;
            notifData.body = notifData.body ? notifData.body : '';
            this.editor.setData(notifData.body);
            notifData = this.formatResponse(notifData);
            this.formDetails.patchValue(notifData);
            this.initialData = this.formDetails.getRawValue();
            this.filterRecipient.patchValue(
              resp.recipient && resp.recipient.name ? this.translate.instant('USER_TYPES.' + resp.recipient.name) : '',
            );

            this.filterRecipientCC.patchValue(
              resp.recipient_in_cc && resp.recipient_in_cc.name ? this.translate.instant('USER_TYPES.' + resp.recipient_in_cc.name) : '',
            );
            this.filterSignatory.patchValue(
              resp.signatory && resp.signatory.name ? this.translate.instant('USER_TYPES.' + resp.signatory.name) : '',
            );



            if (notifData.attachments && notifData.attachments.length) {
              this.getAttachmentsFormarray().clear();
              notifData.attachments.forEach((document) => {
                const newFileFormGroup = this.initAttachmentsForm();
                newFileFormGroup.patchValue({
                  name: document.name,
                  s3_file_name: document.s3_file_name,
                });
                this.getAttachmentsFormarray().push(newFileFormGroup);
              });
            } else {
              this.getAttachmentsFormarray().clear();
            }
          }
        }
      });
    }
  }

  initValueChange() {
    this.formDetails.valueChanges.subscribe(() => {
      this.isFormUnchanged();
    });
  }

  getSendingConditionDropdown() {
    // this.sendingList
    const dataDropdown = [
      { key: 'published', value: 'When the task is Published' },
      { key: 'done', value: 'When the task is Done' },
      { key: 'rejected', value: 'When the task is Rejected' },
      { key: 'approved', value: 'When the task is Approved' },
      { key: 'waiting_for_approval', value: 'When the task is Waiting for approval' },
    ];
    this.subs.sink = this.taskService.getOneTaskBuilder(this.taskId).subscribe((resp) => {
      if (resp) {

        const statusRejection = resp.is_rejection_active;
        if (statusRejection) {
          this.sendingList = dataDropdown;
        } else {
          this.sendingList = dataDropdown.splice(0, 2);
        }
      }
    });
  }

  getUserTypes() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.userService.getAllUserTypeExcludeComp().subscribe(
      (resp) => {
        if (resp) {

          this.isWaitingForResponse = false;
          const userTypesList = resp;
          const acadir = userTypesList.findIndex((acadir) => acadir._id === '5a2e1ecd53b95d22c82f954b');

          userTypesList[acadir].name = 'Title Manager';

          this.recipientList = userTypesList.map((item) => {
            return { _id: item._id, name: this.translate.instant('USER_TYPES.' + item.name) };
          });
          this.recipientCCList = userTypesList.map((item) => {
            return { _id: item._id, name: this.translate.instant('USER_TYPES.' + item.name) };
          });
          this.signatoryList = userTypesList.map((item) => {
            return { _id: item._id, name: this.translate.instant('USER_TYPES.' + item.name) };
          });

          this.filteredRecipientList = this.recipientList;
          this.filteredRecipientCCList = this.recipientCCList;
          this.filteredSignatoryList = this.signatoryList;
        }
      },
      (error) => {
        this.isWaitingForResponse = false;
      },
    );
  }

  displayUserTypeNameFn(name) {
    if (name) {
      const foundRec = _.find(this.recipientList, (type) => type.name === name);
      const foundRecCC = _.find(this.recipientCCList, (type) => type.name === name);
      const foundSig = _.find(this.signatoryList, (type) => type.name === name);
      let result = '';
      if (foundRec) {
        result = this.translate.instant('USER_TYPES.' + foundRec.name);
      } else if (foundRecCC) {
        result = this.translate.instant('USER_TYPES.' + foundRecCC.name);
      } else if (foundSig) {
        result = this.translate.instant('USER_TYPES.' + foundSig.name);
      }
      return result;
    }
  }

  displaySendingConditionFn(value) {
    if (value === 'published') {
      return this.translate.instant('When the task is Published');
    } else if (value === 'rejected') {
      return this.translate.instant('When the task is Rejected');
    } else if (value === 'approved') {
      return this.translate.instant('When the task is Approved');
    } else if (value === 'done') {
      return this.translate.instant('When the task is Done');
    } else if (value === 'waiting_for_approval') {
      return this.translate.instant('When the task is Waiting for approval');
    }
  }

  alreadyUploadFileSwal() {
    Swal.fire({
      type: 'info',
      title: this.translate.instant('Sorry'),
      text: this.translate.instant('Please remove the uploaded pdf attachment first before can upload another PDF'),
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    });
  }

  alreadyUploadFileSwalForIncludePDF() {
    Swal.fire({
      type: 'info',
      title: this.translate.instant('Sorry'),
      text: this.translate.instant(
        'Please remove the uploaded pdf attachment first before can check the checkbox for Include attachment PDF of the step',
      ),
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    });
  }

  saveNotifData() {

    if (this.isPublished) {
      Swal.fire({
        type: 'info',
        title: this.translate.instant('UserForm_S18.TITLE'),
        text: this.translate.instant('UserForm_S18.TEXT'),
        confirmButtonText: this.translate.instant('UserForm_S18.CONFIRM'),
      });
    } else {
      this.formDetails.get('body').patchValue(this.editor.getData());

      if (this.checkFormValidity()) {
        return;
      } else {
        this.isWaitingForResponse = true;
        const formValue = this.formDetails.getRawValue();
        let payload = {
          type: 'notification',
          task_builder_id: this.taskId,
          recipient: formValue.recipient,
          recipient_in_cc: formValue.recipient_in_cc,
          signatory: formValue.signatory,
          trigger_condition: formValue.trigger_condition,
          subject: formValue.subject,
          body: formValue.body,
          attachments: formValue.attachments,
        };

        this.cleanNullValues(payload);
        payload = this.formatResponse(payload);

        this.rncpTitleService.updateTaskBuilderNotificationAndMessage(this.refSelected._id, payload).subscribe((resp) => {
          if (resp) {
            this.isWaitingForResponse = false;

            this.initialData = _.cloneDeep(this.formDetails.getRawValue());
            this.isFormUnchanged();
            this.isWaitingForResponse = false;
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo!'),
              confirmButtonText: this.translate.instant('OK'),
              allowEnterKey: false,
              allowEscapeKey: false,
              allowOutsideClick: false,
            }).then((action) => {
              this.updateTabs.emit(true);
            });
          } else {
            this.isWaitingForResponse = false;
          }
        });
      }
    }
  }

  checkFormValidity(): boolean {
    if (this.formDetails.invalid) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Invalid_Form_Warning.TITLE'),
        html: this.translate.instant('Invalid_Form_Warning.TEXT'),
        confirmButtonText: this.translate.instant('Invalid_Form_Warning.BUTTON'),
      });
      this.formDetails.markAllAsTouched();
      return true;
    } else {
      return false;
    }
  }

  cleanNullValues(obj) {
    return Object.keys(obj).forEach((key) => {
      if (obj[key] && typeof obj[key] === 'object') {
        this.cleanNullValues(obj[key]);
      } else if (obj[key] === null) {
        delete obj[key];
      }
    });
  }

  isFormUnchanged() {
    if (!this.initialData || !this.formDetails) return;
    const initialData = JSON.stringify(this.initialData);
    const currentData = JSON.stringify(this.formDetails.getRawValue());
    if (initialData === currentData) {
      this.taskService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.taskService.childrenFormValidationStatus = false;
      return false;
    }
  }

  setTeacherRecipient(item: any) {

    const isTeacher = item.filter((e) => e === 'Teacher');
    if (isTeacher && isTeacher.length) {
      this.teacher_as_recipient = true;
    } else {
      this.teacher_as_recipient = false;
    }
  }

  setTeacherCC(item: any) {
    const isTeacher = item.filter((e) => e === 'Teacher');
    if (isTeacher && isTeacher.length) {
      this.teacher_as_cc = true;

    } else {
      this.teacher_as_cc = false;
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
