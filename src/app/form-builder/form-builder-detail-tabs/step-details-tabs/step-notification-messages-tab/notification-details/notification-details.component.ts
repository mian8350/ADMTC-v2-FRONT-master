import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AbstractControl, FormControl, UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { UserService } from 'app/service/user/user.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { Observable, of } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import * as _ from 'lodash';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';

@Component({
  selector: 'ms-notification-details',
  templateUrl: './notification-details.component.html',
  styleUrls: ['./notification-details.component.scss'],
})
export class NotificationDetailsComponent implements OnInit, OnDestroy {
  @Input()
  set refSelected(input) {
    this.refData = input;
    this.initFormDetails();
    this.getNotifData();
  }
  @Input() templateType: any;
  @Input() stepType: any;
  @Input() isPublished: boolean;
  @Output() updateTabs = new EventEmitter();
  @Input() stepData: any;

  @ViewChild('handlePdf', { static: false }) uploadInput: any;
  refData: any;
  includePdf = false;
  showDownload = false;
  private subs = new SubSink();
  listData = [];
  isWaitingForResponse = false;
  formDetails: UntypedFormGroup;

  recipientList: any;
  recipientCCList: any;
  signatoryList: any;
  sendingList = [];
  userTypesList: any;

  filterRecipient = new UntypedFormControl('', [Validators.required]);
  filterRecipientCC = new UntypedFormControl('');
  filterSignatory = new UntypedFormControl('', [Validators.required]);
  trigerCondition = new UntypedFormControl('', [Validators.required]);

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
  initialData: any;
  isUploadingFile = false;
  document_name_attachment = new UntypedFormControl('');

  filteredRecipientList;
  filteredRecipientCCList;
  filteredSignatoryList;
  sendingFilterList = [];
  isSaveNotifDetail = false;

  constructor(
    private utilService: UtilityService,
    private fileUploadService: FileUploadService,
    private translate: TranslateService,
    private fb: UntypedFormBuilder,
    private userService: UserService,
    private formBuilderService: FormBuilderService,
  ) {}

  ngOnInit() {
    this.initFormDetails();
    this.initEditor();
    this.getUserTypes();
    this.populateTriggerConditions();

    this.subs.sink = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.getUserTypes();
    });

    if (this.isPublished && this.templateType !== 'employability_survey') {
      this.formDetails.disable();
      this.trigerCondition.disable();
      this.filterRecipient.disable();
      this.filterRecipientCC.disable();
      this.filterSignatory.disable();
    }
  }

  populateTriggerConditions() {
    if (this.stepType === 'step_with_signing_process') {
      this.sendingList.push(
        {
          key: 'all_signatory_signed',
          value: 'When All Signatory finish the contract signing',
        },
        {
          key: 'need_to_sign_contract',
          value: 'When signatory is needed to sign the contract',
        },
      );
    } else {
      this.sendingList.push({ key: 'validated', value: 'When step is Validated' }, { key: 'send', value: 'When step is Send' });

      if (this.stepData && this.stepData.is_validation_required) {
        this.sendingList.push(
          { key: 'rejected', value: 'When step is Rejected' },
          { key: 'waiting_for_validation', value: 'When step is Submit and waiting for validation' },
        );
      }
    }

    if (this.stepType !== 'final_message') {
      this.sendingList.push({ key: 'reminder', value: 'Reminder' });
    }
  }

  getNotifData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.formBuilderService.getOneStepNotificationAndMessage(this.refData._id).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        if (resp.type === 'notification') {
          let data = _.cloneDeep(resp);
          if (data.pdf_attachments && data.pdf_attachments.length) {
            this.getAttachmentsFormarray().clear();
            data.pdf_attachments.forEach(() => {
              this.getAttachmentsFormarray().push(this.initAttachmentsForm());
            });
          } else {
            this.getAttachmentsFormarray().clear();
          }
          data.recipient_id = data.recipient_id && data.recipient_id._id ? data.recipient_id._id : null;
          data.recipient_cc_id = data.recipient_cc_id && data.recipient_cc_id._id ? data.recipient_cc_id._id : null;
          data.signatory_id = data.signatory_id && data.signatory_id._id ? data.signatory_id._id : null;

          this.formDetails.patchValue(data);
          this.initialData = _.cloneDeep(this.formDetails.value);
          this.editor.setData(data.body);
          if (this.isPublished && this.templateType !== 'employability_survey') this.editor.isReadOnly = true;
          // this is to patch filter autocomplete form control
          this.trigerCondition.patchValue(resp.trigger_condition ? this.displaySendingConditionFn(resp.trigger_condition) : '');
          this.filterRecipient.patchValue(
            resp.recipient_id && resp.recipient_id.name ? this.translate.instant('USER_TYPES.' + resp.recipient_id.name) : '',
          );
          this.filterRecipientCC.patchValue(
            resp.recipient_cc_id && resp.recipient_cc_id.name ? this.translate.instant('USER_TYPES.' + resp.recipient_cc_id.name) : '',
          );
          this.filterSignatory.patchValue(
            resp.signatory_id && resp.signatory_id.name ? this.translate.instant('USER_TYPES.' + resp.signatory_id.name) : '',
          );
          //******************/

          this.initValueChange();
          this.markControlsAsUntouched([this.trigerCondition, this.filterRecipient, this.filterRecipientCC, this.filterSignatory]);
          this.markControlsAsPristine([this.trigerCondition, this.filterRecipient, this.filterRecipientCC, this.filterSignatory]);
        }
      }
    });
  }

  initEditor() {
    this.subs.sink = DecoupledEditor.create(document.querySelector('.document-editor__editable'), this.config)
      .then((editor) => {
        const toolbarContainer = document.querySelector('.document-editor__toolbar');
        toolbarContainer.appendChild(editor.ui.view.toolbar.element);
        // editor.model.document.on('change:data', () => {
        //   // const data = editor.getData();
        //   // const control = this.formDetails.get('body');
        //   // if (data && !control.touched) control.markAsTouched();
        //   // if (data && !control.dirty) control.markAsDirty();
        //   // control.patchValue(data);
        // });
        this.editor = editor;
      })
      .catch((err) => {
        console.error(err);
      });
  }

  initFormDetails() {
    this.formDetails = this.fb.group({
      _id: [null],
      ref_id: [this.refData.ref_id, [Validators.required]],
      trigger_condition: [null, [Validators.required]],
      recipient_id: [null, [Validators.required]],
      recipient_cc_id: [null],
      signatory_id: [null, [Validators.required]],
      pdf_attachments: this.fb.array([]),
      subject: [null, [Validators.required]],
      body: [null, [Validators.required]],
      is_include_pdf_this_step: [false],
    });
  }

  initAttachmentsForm() {
    return this.fb.group({
      name: ['', [Validators.required]],
      s3_file_name: ['', [Validators.required]],
    });
  }

  getAttachmentsFormarray(): UntypedFormArray {
    return this.formDetails.get('pdf_attachments') as UntypedFormArray;
  }

  onEditableContainerFocusOut() {
    const group = this.formDetails.get('body');
    if (!group.touched) group.markAsTouched();
    this.formDetails.get('body').patchValue(this.editor.getData());
  }

  onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  initValueChange() {
    this.isFormUnchanged();
    this.subs.sink = this.formDetails.valueChanges.subscribe(() => {
      this.isFormUnchanged();
    });

    this.subs.sink = this.formDetails.get('trigger_condition').valueChanges.subscribe(() => {
      if (
        (this.templateType === 'student_admission' || this.templateType === 'employability_survey' ) &&
        this.stepType === 'step_with_signing_process' &&
        this.formDetails.get('trigger_condition').value === 'need_to_sign_contract'
      ) {
        this.recipientList = this.stepData.contract_signatory.map((item) => {
          return { _id: item._id, name: this.translate.instant('USER_TYPES.' + item.name) };
        });
        const studentType = { _id: '5a067bba1c0217218c75f8ab', name: this.translate.instant('USER_TYPES.Student') };
        this.recipientList.push(studentType);
        this.recipientList = _.uniqBy(this.recipientList, '_id');
        this.filteredRecipientList = this.recipientList;

        if (this.formDetails.get('recipient_id').value) {
          this.formDetails.get('recipient_id').patchValue(null);
          this.filterRecipient.patchValue(null);
        }
      } else if (
        this.templateType === 'quality_file' &&
        this.stepType === 'step_with_signing_process' &&
        this.formDetails.get('trigger_condition').value === 'need_to_sign_contract'
      ) {
        this.recipientList = this.stepData.contract_signatory.map((item) => {
          return { _id: item._id, name: this.translate.instant('USER_TYPES.' + item.name) };
        });
        const acadDirType = { _id: '5a2e1ecd53b95d22c82f9554', name: this.translate.instant('USER_TYPES.Academic Director') };
        this.recipientList.push(acadDirType);
        this.recipientList = _.uniqBy(this.recipientList, '_id');
        this.filteredRecipientList = this.recipientList;
      } else {
        this.getUserTypes();
      }
    });
  }

  markControlsAsUntouched(controls: AbstractControl[]): void {
    for (const c of controls) c.markAsUntouched()
  }

  markControlsAsPristine(controls: AbstractControl[]): void {
    for (const c of controls) c.markAsPristine()
  }

  onFileChange($event) {
    const acceptable = ['pdf'];
    const [file] = $event.target.files;
    const documentName = this.document_name_attachment.value;
    const fileType = this.utilService.getFileExtension(file.name).toLocaleLowerCase();
    if (acceptable.includes(fileType)) {
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
    } else {
      this.isUploadingFile = false;
      Swal.fire({
        type: 'info',
        title: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TITLE'),
        text: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TEXT', { file_exts: '.pdf' }),
        allowEscapeKey: false,
        allowOutsideClick: false,
        allowEnterKey: false,
      });
    }
  }

  onDeleteFileAt(id) {
    const attachmentName = this.getAttachmentsFormarray().at(id).get('name').value;
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
        this.getAttachmentsFormarray().removeAt(id);
      }
    });
  }

  getUserTypes() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.userService.getAllUserWithStudent().subscribe(
      (resp) => {
        if (resp) {
          this.isWaitingForResponse = false;
          const userTypesList = resp;          
          // Only for step type signing process get recepient list from contract signatory table
          if (
            (this.templateType === 'student_admission' || this.templateType === 'employability_survey' ) &&
            this.stepType === 'step_with_signing_process' &&
            this.formDetails.get('trigger_condition').value === 'need_to_sign_contract'
          ) {
            this.recipientList = this.stepData.contract_signatory.map((item) => {
              return { _id: item._id, name: this.translate.instant('USER_TYPES.' + item.name) };
            });
            const studentType = { _id: '5a067bba1c0217218c75f8ab', name: this.translate.instant('USER_TYPES.Student') };
            this.recipientList.push(studentType);
          } else if (
            this.templateType === 'quality_file' &&
            this.stepType === 'step_with_signing_process' &&
            this.formDetails.get('trigger_condition').value === 'need_to_sign_contract'
          ) {
            this.recipientList = this.stepData.contract_signatory.map((item) => {
              return { _id: item._id, name: this.translate.instant('USER_TYPES.' + item.name) };
            });
            const acadDirType = { _id: '5a2e1ecd53b95d22c82f9554', name: this.translate.instant('USER_TYPES.Academic Director') };
            this.recipientList.push(acadDirType);
          } else {
            this.recipientList = userTypesList.map((item) => {
              return { _id: item._id, name: this.translate.instant('USER_TYPES.' + item.name) };
            });
          }
          if (this.sendingList && this.sendingList.length) {
            this.sendingFilterList = this.sendingList.map((item) => {
              return { key: item.key, value: this.translate.instant(item.value) };
            });
          }
          // ****END If

          this.recipientCCList = userTypesList.map((item) => {
            return { _id: item._id, name: this.translate.instant('USER_TYPES.' + item.name) };
          });
          this.signatoryList = userTypesList.map((item) => {
            return { _id: item._id, name: this.translate.instant('USER_TYPES.' + item.name) };
          });

          // Clear recipientList Array from duplicate user type id
          this.recipientList = _.uniqBy(this.recipientList, '_id');

          this.filteredRecipientList = this.recipientList;
          this.filteredRecipientCCList = this.recipientCCList;
          this.filteredSignatoryList = this.signatoryList;

          if (this.filterRecipient.value && this.recipientList && this.recipientList.length) {
            const recip = this.recipientList.find((recp) => recp._id === this.formDetails.get('recipient_id').value);
            if (recip) {
              this.filterRecipient.patchValue(recip.name);
            }
          }
          if (this.filterRecipientCC.value && this.recipientCCList && this.recipientCCList.length) {
            const recip = this.recipientCCList.find((recp) => recp._id === this.formDetails.get('recipient_cc_id').value);
            if (recip) {
              this.filterRecipientCC.patchValue(recip.name);
            }
          }
          if (this.filterSignatory.value && this.signatoryList && this.signatoryList.length) {
            const recip = this.signatoryList.find((recp) => recp._id === this.formDetails.get('signatory_id').value);
            if (recip) {
              this.filterSignatory.patchValue(recip.name);
            }
          }
          if (this.formDetails.get('trigger_condition').value) {
            const recip = this.sendingList.find((recp) => recp.key === this.formDetails.get('trigger_condition').value);
            this.trigerCondition.patchValue(this.translate.instant(recip.value));
          }
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? this.translate.instant(err['message'].replaceAll('GraphQL error: ', '')) : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      },
    );
  }

  displayUserTypeNameFn(id) {
    if (!id || !(this.recipientList && this.recipientList.length)) {
      return '';
    }
    // since recipient, signatory, and cc list all contain same object, it doesn't matter where it search value from
    const index = this.recipientList.findIndex((type) => type._id === id);
    return index >= 0 ? this.translate.instant('USER_TYPES.' + this.recipientList[index].name) : '';
  }
  selectTrigerCondition(value) {
    const rec = this.sendingFilterList.find((val) => val.value === value);
    if (rec) this.formDetails.get('trigger_condition').patchValue(rec.key);
  }
  selectRecipient(value) {
    const rec = this.recipientList.find((val) => val.name === value);
    if (rec) this.formDetails.get('recipient_id').patchValue(rec._id);
  }
  selectRecipientCC(value) {
    const recCC = this.recipientCCList.find((val) => val.name === value);
    if (recCC) this.formDetails.get('recipient_cc_id').patchValue(recCC._id);
  }
  selectSignatory(value) {
    const sig = this.signatoryList.find((val) => val.name === value);
    if (sig) this.formDetails.get('signatory_id').patchValue(sig._id);
  }

  hasIncludePDFStep() {
    Swal.fire({
      type: 'info',
      title: this.translate.instant('Sorry'),
      text: this.translate.instant('Please uncheck the checkbox for Include attachment PDF of the step first before upload document pdf'),
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    });
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

  onValueRecChange() {
    if (this.filterRecipient.value) {
      const searchString = this.utilService.simpleDiacriticSensitiveRegex(this.filterRecipient.value).toLowerCase().trim();
      this.filteredRecipientList = this.recipientList.filter((test) =>
        this.utilService.simpleDiacriticSensitiveRegex(test.name).toLowerCase().trim().includes(searchString),
      );
    } else {
      this.filteredRecipientList = this.recipientList;
      this.formDetails.get('recipient_id').patchValue(null);
      this.formDetails.get('recipient_id').updateValueAndValidity();
    }
  }
  onValueRecCCChange() {
    if (this.filterRecipientCC.value) {
      const searchString = this.utilService.simpleDiacriticSensitiveRegex(this.filterRecipientCC.value).toLowerCase().trim();
      this.filteredRecipientCCList = this.recipientCCList.filter((test) =>
        this.utilService.simpleDiacriticSensitiveRegex(test.name).toLowerCase().trim().includes(searchString),
      );
    } else {
      this.filteredRecipientCCList = this.recipientCCList;
      this.formDetails.get('recipient_cc_id').patchValue(null);
      this.formDetails.get('recipient_cc_id').updateValueAndValidity();
    }
  }
  onValueSigChange() {
    if (this.filterSignatory.value) {
      const searchString = this.utilService.simpleDiacriticSensitiveRegex(this.filterSignatory.value).toLowerCase().trim();
      this.filteredSignatoryList = this.signatoryList.filter((test) =>
        this.utilService.simpleDiacriticSensitiveRegex(test.name).toLowerCase().trim().includes(searchString),
      );
    } else {
      this.filteredSignatoryList = this.signatoryList;
      this.formDetails.get('signatory_id').patchValue(null);
      this.formDetails.get('signatory_id').updateValueAndValidity();
    }
  }

  saveNotifData() {
    if (this.isPublished && this.templateType !== 'employability_survey') {
      Swal.fire({
        type: 'info',
        title: this.translate.instant('UserForm_S18.TITLE'),
        text: this.translate.instant('UserForm_S18.TEXT'),
        confirmButtonText: this.translate.instant('UserForm_S18.CONFIRM'),
      });
    } else {
      this.formDetails.get('body').markAsTouched();
      this.formDetails.get('body').markAsDirty();
      if (this.checkFormValidity()) {
        return;
      } else {
        this.isWaitingForResponse = true;
        const formData = this.formDetails.getRawValue();
        const payload = {
          type: formData.type,
          trigger_condition: formData.trigger_condition,
          recipient_id: formData.recipient_id,
          recipient_cc_id: formData.recipient_cc_id,
          signatory_id: formData.signatory_id,
          pdf_attachments: formData.pdf_attachments && formData.pdf_attachments.length ? formData.pdf_attachments : null,
          subject: formData.subject,
          body: formData.body,
          is_include_pdf_this_step: formData.is_include_pdf_this_step,
        };
        this.cleanNullValues(payload);
        
        this.subs.sink = this.formBuilderService.updateStepNotificationAndMessage(this.refData._id, payload).subscribe((resp) => {
          if (resp) {
            this.initialData = _.cloneDeep(this.formDetails.getRawValue());
            this.isFormUnchanged();
            this.isWaitingForResponse = false;
            this.isSaveNotifDetail = true;
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
      const value = this.formDetails.value;
      if (!value.trigger_condition || !value.recipient_id || !value.recipient_cc_id || !value.signatory_id || !value.body || !value.subject) {
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('Invalid_Form_Warning.TITLE'),
          html: this.translate.instant('Invalid_Form_Warning.TEXT'),
          footer: `<span style="margin-left: auto">Invalid_Form_Warning</span>`,
          confirmButtonText: this.translate.instant('Invalid_Form_Warning.BUTTON'),
        });
        this.trigerCondition.markAsTouched();
        this.filterRecipient.markAsTouched();
        this.filterSignatory.markAsTouched();
        this.trigerCondition.markAsTouched();
        this.formDetails.markAllAsTouched();
        this.formDetails.updateValueAndValidity();
        return true;
      } else if (!value.trigger_condition || !value.recipient_id || !value.recipient_cc_id || !value.signatory_id || !value.body || !value.subject) {
        return false;
      }
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
    const initialData = JSON.stringify(this.initialData);
    const currentData = JSON.stringify(this.formDetails.getRawValue());
    if (initialData === currentData && !this.formDetails.invalid) {
      this.formBuilderService.childrenFormValidationStatus = true;
      return true;
    } else {
      this.formBuilderService.childrenFormValidationStatus = false;
      return false;
    }
  }

  displaySendingConditionFn(value) {
    if (value === 'validated') {
      return this.translate.instant('When step is Validated');
    } else if (value === 'rejected') {
      return this.translate.instant('When step is Rejected');
    } else if (value === 'send') {
      return this.translate.instant('When step is Send');
    } else if (value === 'done') {
      return this.translate.instant('When the task is Done');
    } else if (value === 'waiting_for_validation') {
      return this.translate.instant('When step is Submit and waiting for validation');
    } else if (value === 'need_to_sign_contract') {
      return this.translate.instant('When signatory is needed to sign the contract');
    } else if (value === 'all_signatory_signed') {
      return this.translate.instant('When All Signatory finish the contract signing');
    } else if (value === 'reminder') {
      return this.translate.instant('Reminder');
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
