import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { TranslateService } from '@ngx-translate/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialogRef } from '@angular/material/dialog';
import swal from 'sweetalert2';
import { UrgentMessageService } from 'app/service/urgent-message/urgent-message.service';
import { SubSink } from 'subsink';
import { debounceTime } from 'rxjs/operators';
import { Observable } from 'apollo-link';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { UserService } from 'app/service/user/user.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import Swal from 'sweetalert2';
import * as _ from 'lodash';

export interface UserType {
  id: string;
  text: string;
}

export interface RncpTitles {
  isPublished: string;
  longName: string;
  rncpLevel: string;
  shortName: string;
  _id: string;
}
enum ReturnType {
  LABEL = 'LABEL',
  VALUE = 'VALUE',
  OBJECT = 'OBJECT',
}
interface InputType {
  label: string;
  value: string;
}

@Component({
  selector: 'ms-mail-to-group-dialog',
  templateUrl: './mail-to-group-dialog.component.html',
  styleUrls: ['./mail-to-group-dialog.component.scss'],
})
export class MailToGroupDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  sendEmailForm: UntypedFormGroup;
  public Editor = DecoupledEditor;
  showCC = false;
  showBCC = false;
  userTypes: UserType[] = [];
  rncpTitles: RncpTitles[] = [];
  checked;
  isWaitingForResponse = false;

  currentUser: any;
  userTypesList: any;
  userList: any;
  userRecipientList: any;
  rncpTitlesList: any;
  originalUserTypesList: any;
  originalUserList: any;
  originalRncpTitlesList: any;
  titleReady = false;
  userReady = false;
  userTypeReady = false;
  titles = [];
  mailData: any;
  autocompleteUsers = [];
  autocompleteUserTypes = [];
  filteredTitles: Observable<string[]>;
  filteredUsers: Observable<string[]>;
  filteredUserTypes: Observable<string[]>;
  selectedTitleId: string[] = [];
  selectedUserTypeId: string[] = [];
  composeMailMessage: string;
  selectedEmailTo = [];
  selectedEmailCc = [];
  selectedEmailBcc = [];

  selectedRecepientsList = [];
  ccselectedRecepientsList = [];
  bccselectedRecepientsList = [];

  recepientsList: Observable<Array<string>>;
  ccrecepientsList: Observable<Array<string>>;
  bccrecepientsList: Observable<Array<string>>;

  emailAddressesListTo = [];
  emailAddressesListCc = [];
  emailAddressesListBcc = [];
  filteredOptions: Observable<string[]>;
  @ViewChild('languagesInput', { static: false }) languagesInput: ElementRef<HTMLInputElement>;
  @ViewChild('recipientCc', { static: false }) recipientCc: ElementRef<HTMLInputElement>;
  @ViewChild('recipientBcc', { static: false }) recipientBcc: ElementRef<HTMLInputElement>;
  @ViewChild('auto', { static: false }) matAutocomplete: MatAutocomplete;
  @ViewChild('myInput', { static: false }) currentFile: any;

  public isDraftMail = false;
  public DraftData: any = [];
  attachmnetsPaths = [];
  visible = true;
  showCCInput = false;
  showBCCInput = false;
  selectable = true;
  removable = true;
  addOnBlur = true;
  addOnBlurCc = true;
  addOnBlurBcc = true;
  @Input() allowOther = false;
  @Input() returnType: ReturnType = ReturnType.LABEL;
  @Output() optionSelected: EventEmitter<(string | InputType)[]> = new EventEmitter();
  separatorKeysCodes: number[] = [ENTER, COMMA];
  separatorKeysCodesCc: number[] = [ENTER, COMMA];
  separatorKeysCodesBcc: number[] = [ENTER, COMMA];
  languagesCtrl = new UntypedFormControl();
  filteredLanguages: Observable<(string | InputType)[]>;
  languages: (string | InputType)[] = [];
  allLanguages: (string | InputType)[];
  inputOptionsArray: (string | InputType)[];
  recpList = [];
  recpListCc = [];
  recpListBcc = [];
  rncpTitleList = [];
  userTypeList = [];
  isPermission: any;
  public currentMailData = [];
  public config = {
    toolbar: [
      'heading',
      '|',
      'fontsize',
      '|',
      'bold',
      'italic',
      'Underline',
      'strikethrough',
      'highlight',
      '|',
      'alignment',
      '|',
      'numberedList',
      'bulletedList',
      '|',
    ],
  };
  constructor(
    public translate: TranslateService,
    public dialogref: MatDialogRef<MailToGroupDialogComponent>,
    private fb: UntypedFormBuilder,
    private urgentMessageService: UrgentMessageService,
    private userService: UserService,
    private autService: AuthService,
    private fileUploadService: FileUploadService,
    private rncpTitleService: RNCPTitlesService,
    private mailboxService: MailboxService,
  ) {}

  ngOnInit() {
    this.isPermission = this.autService.getPermission();
    this.currentUser = this.autService.getLocalStorageUser();
    this.initFormField();
    this.mailSignature();
    this.getTitleList();
    this.getUserTypeList();
    this.CheckforDraft();
  }

  initFormField() {
    this.sendEmailForm = this.fb.group({
      to: ['', [removeSpaces]],
      cc: ['', [removeSpaces]],
      bcc: ['', [removeSpaces]],
      subject: ['', [Validators.required, removeSpaces]],
      message: ['', Validators.required],
      rncpTitle: [[], Validators.required],
      categoryChecked: [false],
      userTypes: [[]],
      originalRncpTitle: [''],
      originalUserTypes: [''],
    });
  }

  handleInputChange(fileInput: Event) {
    const file = (<HTMLInputElement>fileInput.target).files[0];
    if (file) {
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe(
        (resp) => {
          if (resp) {
            this.attachmnetsPaths.push({
              path: resp.file_url,
              name: resp.file_name,
            });
          }
        },
        (err) => {

          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: 'OK',
          });
        },
      );
    }
    this.resetFileState();
  }

  removeAttachment(file) {
    this.attachmnetsPaths.splice(this.attachmnetsPaths.indexOf(file), 1);
  }

  resetFileState() {
    this.currentFile.nativeElement.value = '';
  }
  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  setSelectedEmail(emails: string[], formControl: any) {
    formControl.setValue(emails);
  }

  closeDialog(): void {
    swal
      .fire({
        title: this.translate.instant('MailBox.composeMail.DRAFT.TITLE'),
        html: this.translate.instant('MailBox.composeMail.DRAFT.TEXT'),
        footer: `<span style="margin-left: auto">MailBox.composeMail.DRAFT</span>`,
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: this.translate.instant('MailBox.composeMail.DRAFT.CONFIRMBTN'),
        cancelButtonText: this.translate.instant('MailBox.composeMail.DRAFT.DECBTN'),
      })
      .then((result) => {
        if (result.value) {
          this.saveDraft();
          this.dialogref.close();
        } else {
          this.dialogref.close();
        }
      });
  }

  categoryChange(event) {
    if (event.checked) {

      this.sendEmailForm.get('userTypes').setValidators([Validators.required]);
      this.sendEmailForm.get('userTypes').updateValueAndValidity();
    } else {

      this.sendEmailForm.get('userTypes').patchValue(null);
      this.sendEmailForm.get('userTypes').updateValueAndValidity();
      this.sendEmailForm.get('userTypes').clearValidators();
      this.sendEmailForm.get('userTypes').updateValueAndValidity();
    }
    this.resetRecipientList();

  }

  saveDraft() {
    if (this.isDraftMail) {
      this.isWaitingForResponse = true;
      const formValues = this.sendEmailForm.value;
      if (formValues.subject !== '' || (formValues.message !== '' && formValues.message !== undefined)) {
        const receiversArray = [];
        this.mailData = {};
        const recipient = this.recpList;
        const recipientCc = this.recpListCc;
        const recipientBcc = this.recpListBcc;
        this.currentUser = this.autService.getLocalStorageUser();
        const senderArray = {
          sender: this.currentUser.email,
          is_read: false,
          mail_type: 'draft',
        };
        if (recipient) {
          const str_array = recipient.toString().split(',');

          for (let i = 0; i < str_array.length; i++) {
            str_array[i] = str_array[i].replace(/^\s*/, '').replace(/\s*$/, '');

            if (this.validateEmail(str_array[i])) {
              receiversArray.push({ recipients: [str_array[i]], rank: 'a', is_read: false, mail_type: 'draft' });
            }
          }
        }

        if (recipientCc) {
          const str_array_cc = recipientCc.toString().split(',');
          for (let i = 0; i < str_array_cc.length; i++) {
            str_array_cc[i] = str_array_cc[i].replace(/^\s*/, '').replace(/\s*$/, '');

            if (this.validateEmail(str_array_cc[i])) {
              receiversArray.push({ recipients: [str_array_cc[i]], rank: 'cc', is_read: false, mail_type: 'draft' });
            }
          }
        }

        if (recipientBcc) {
          const str_array_bcc = recipientBcc.toString().split(',');
          for (let i = 0; i < str_array_bcc.length; i++) {
            str_array_bcc[i] = str_array_bcc[i].replace(/^\s*/, '').replace(/\s*$/, '');

            if (this.validateEmail(str_array_bcc[i])) {
              receiversArray.push({ recipients: [str_array_bcc[i]], rank: 'c', is_read: false, mail_type: 'draft' });
            }
          }
        }
        const MailAttachment = [];
        const MailAttachment1 = [];
        this.attachmnetsPaths.forEach((files) => {
          const obj = {
            file_name: files.name,
            path: files.path,
          };
          MailAttachment1.push(files.name);
          MailAttachment.push(obj);
        });
        this.mailData.sender_property = senderArray;
        this.mailData.recipient_properties = receiversArray;
        this.mailData.subject = formValues.subject;
        this.mailData.message = formValues.message;
        this.mailData.is_sent = false;
        this.mailData.status = 'active';
        this.mailData.is_urgent_mail = false;
        this.mailData.attachments = MailAttachment1;
        this.mailData.file_attachments = MailAttachment;
        this.mailData.tags = ['draft'];

        this.mailData.is_group_parent = true;
        this.mailData.user_type_selection = this.sendEmailForm.get('categoryChecked').value;
        this.mailData.group_detail = {
          rncp_titles: this.sendEmailForm.get('originalRncpTitle').value,
          user_types: this.sendEmailForm.get('originalUserTypes').value,
        };

        this.subs.sink = this.mailboxService.updateSingleMail(this.DraftData['_id'], this.mailData).subscribe((data: any) => {
          this.isWaitingForResponse = false;
          swal.fire({
            type: 'info',
            title: this.translate.instant('MailBox.MESSAGES.DRAFTMSG'),
            text: '',
            footer: `<span style="margin-left: auto">MailBox.MESSAGES.DRAFTMSG</span>`,
            confirmButtonText: this.translate.instant('MailBox.MESSAGES.THANK'),
          });
        });
      }
    } else {
      this.isWaitingForResponse = true;
      const formValues = this.sendEmailForm.value;
      if (formValues.subject !== '' || (formValues.message !== '' && formValues.message !== undefined)) {
        const receiversArray = [];
        this.mailData = {};
        const recipient = this.recpList;
        const recipientCc = this.recpListCc;
        const recipientBcc = this.recpListBcc;
        this.currentUser = this.autService.getLocalStorageUser();
        const senderArray = {
          sender: this.currentUser.email,
          is_read: false,
          mail_type: 'draft',
        };
        if (recipient) {
          const str_array = recipient.toString().split(',');

          for (let i = 0; i < str_array.length; i++) {
            str_array[i] = str_array[i].replace(/^\s*/, '').replace(/\s*$/, '');

            if (this.validateEmail(str_array[i])) {
              receiversArray.push({ recipients: [str_array[i]], rank: 'a', is_read: false, mail_type: 'draft' });
            }
          }
        }

        if (recipientCc) {
          const str_array_cc = recipientCc.toString().split(',');
          for (let i = 0; i < str_array_cc.length; i++) {
            str_array_cc[i] = str_array_cc[i].replace(/^\s*/, '').replace(/\s*$/, '');

            if (this.validateEmail(str_array_cc[i])) {
              receiversArray.push({ recipients: [str_array_cc[i]], rank: 'cc', is_read: false, mail_type: 'draft' });
            }
          }
        }

        if (recipientBcc) {
          const str_array_bcc = recipientBcc.toString().split(',');
          for (let i = 0; i < str_array_bcc.length; i++) {
            str_array_bcc[i] = str_array_bcc[i].replace(/^\s*/, '').replace(/\s*$/, '');

            if (this.validateEmail(str_array_bcc[i])) {
              receiversArray.push({ recipients: [str_array_bcc[i]], rank: 'c', is_read: false, mail_type: 'draft' });
            }
          }
        }
        const MailAttachment = [];
        const MailAttachment1 = [];
        this.attachmnetsPaths.forEach((files) => {
          const obj = {
            file_name: files.name,
            path: files.path,
          };
          MailAttachment1.push(files.name);
          MailAttachment.push(obj);
        });
        this.mailData.sender_property = senderArray;
        this.mailData.recipient_properties = receiversArray;
        this.mailData.subject = formValues.subject;
        this.mailData.message = formValues.message;
        this.mailData.is_sent = false;
        this.mailData.status = 'active';
        this.mailData.is_urgent_mail = false;
        this.mailData.attachments = MailAttachment1;
        this.mailData.file_attachments = MailAttachment;
        this.mailData.tags = ['draft'];

        this.mailData.is_group_parent = true;
        this.mailData.user_type_selection = this.sendEmailForm.get('categoryChecked').value;
        this.mailData.group_detail = {
          rncp_titles: this.sendEmailForm.get('rncpTitle').value,
          user_types: this.sendEmailForm.get('userTypes').value,
        };

        this.subs.sink = this.mailboxService.createMail(this.mailData).subscribe((data: any) => {
          this.isWaitingForResponse = false;
          swal.fire({
            type: 'info',
            title: this.translate.instant('MailBox.MESSAGES.DRAFTMSG'),
            text: '',
            footer: `<span style="margin-left: auto">MailBox.MESSAGES.DRAFTMSG</span>`,
            confirmButtonText: this.translate.instant('MailBox.MESSAGES.THANK'),
          });
        });
      }
    }
  }

  sendMail() {
    if (this.isDraftMail) {
      this.isWaitingForResponse = true;
      const formValues = this.sendEmailForm.value;
      if (formValues.subject !== '' || (formValues.message !== '' && formValues.message !== undefined)) {
        const receiversArray = [];
        this.mailData = {};
        const recipient = this.recpList;
        const recipientCc = this.recpListCc;
        const recipientBcc = this.recpListBcc;
        this.currentUser = this.autService.getLocalStorageUser();
        const senderArray = {
          sender: this.currentUser.email,
          is_read: false,
          mail_type: 'sent',
        };
        if (recipient) {
          const str_array = recipient.toString().split(',');

          for (let i = 0; i < str_array.length; i++) {
            str_array[i] = str_array[i].replace(/^\s*/, '').replace(/\s*$/, '');

            if (this.validateEmail(str_array[i])) {
              receiversArray.push({ recipients: [str_array[i]], rank: 'a', is_read: false, mail_type: 'inbox' });
            }
          }
        }

        if (recipientCc) {
          const str_array_cc = recipientCc.toString().split(',');
          for (let i = 0; i < str_array_cc.length; i++) {
            str_array_cc[i] = str_array_cc[i].replace(/^\s*/, '').replace(/\s*$/, '');

            if (this.validateEmail(str_array_cc[i])) {
              receiversArray.push({ recipients: [str_array_cc[i]], rank: 'cc', is_read: false, mail_type: 'inbox' });
            }
          }
        }

        if (recipientBcc) {
          const str_array_bcc = recipientBcc.toString().split(',');
          for (let i = 0; i < str_array_bcc.length; i++) {
            str_array_bcc[i] = str_array_bcc[i].replace(/^\s*/, '').replace(/\s*$/, '');

            if (this.validateEmail(str_array_bcc[i])) {
              receiversArray.push({ recipients: [str_array_bcc[i]], rank: 'c', is_read: false, mail_type: 'inbox' });
            }
          }
        }
        const MailAttachment = [];
        const MailAttachment1 = [];
        this.attachmnetsPaths.forEach((files) => {
          const obj = {
            file_name: files.name,
            path: files.path,
          };
          MailAttachment1.push(files.name);
          MailAttachment.push(obj);
        });
        this.mailData.sender_property = senderArray;
        this.mailData.recipient_properties = receiversArray;
        this.mailData.subject = formValues.subject;
        this.mailData.message = formValues.message;
        this.mailData.is_sent = true;
        this.mailData.status = 'active';
        this.mailData.is_urgent_mail = false;
        this.mailData.attachments = MailAttachment1;
        this.mailData.file_attachments = MailAttachment;
        this.mailData.tags = ['sent'];

        this.mailData.is_group_parent = true;
        this.mailData.user_type_selection = this.sendEmailForm.get('categoryChecked').value;
        this.mailData.group_detail = {
          rncp_titles: this.sendEmailForm.get('originalRncpTitle').value,
          user_types: this.sendEmailForm.get('originalUserTypes').value,
        };

        this.subs.sink = this.mailboxService.updateSingleMail(this.DraftData['_id'], this.mailData).subscribe((data: any) => {
          this.isWaitingForResponse = false;
          this.dialogref.close();
          swal.fire({
            title: this.translate.instant('MailBox.composeMail.MESSAGES.TITLE'),
            text: this.translate.instant('MailBox.composeMail.MESSAGES.TEXT'),
            footer: `<span style="margin-left: auto">MailBox.composeMail.MESSAGES</span>`,
            allowEscapeKey: true,
            type: 'success',
            confirmButtonText: this.translate.instant('MailBox.composeMail.MESSAGES.CONFIRMBTN'),
          });
        });
      }
    } else {
      this.isWaitingForResponse = true;
      const formValues = this.sendEmailForm.value;
      if (formValues.subject !== '' || (formValues.message !== '' && formValues.message !== undefined)) {
        const receiversArray = [];
        this.mailData = {};
        const recipient = this.recpList;
        const recipientCc = this.recpListCc;
        const recipientBcc = this.recpListBcc;
        this.currentUser = this.autService.getLocalStorageUser();
        const senderArray = {
          sender: this.currentUser.email,
          is_read: false,
          mail_type: 'sent',
        };
        if (recipient) {
          const str_array = recipient.toString().split(',');

          for (let i = 0; i < str_array.length; i++) {
            str_array[i] = str_array[i].replace(/^\s*/, '').replace(/\s*$/, '');

            if (this.validateEmail(str_array[i])) {
              receiversArray.push({ recipients: [str_array[i]], rank: 'a', is_read: false, mail_type: 'inbox' });
            }
          }
        }

        if (recipientCc) {
          const str_array_cc = recipientCc.toString().split(',');
          for (let i = 0; i < str_array_cc.length; i++) {
            str_array_cc[i] = str_array_cc[i].replace(/^\s*/, '').replace(/\s*$/, '');

            if (this.validateEmail(str_array_cc[i])) {
              receiversArray.push({ recipients: [str_array_cc[i]], rank: 'cc', is_read: false, mail_type: 'inbox' });
            }
          }
        }

        if (recipientBcc) {
          const str_array_bcc = recipientBcc.toString().split(',');
          for (let i = 0; i < str_array_bcc.length; i++) {
            str_array_bcc[i] = str_array_bcc[i].replace(/^\s*/, '').replace(/\s*$/, '');

            if (this.validateEmail(str_array_bcc[i])) {
              receiversArray.push({ recipients: [str_array_bcc[i]], rank: 'c', is_read: false, mail_type: 'inbox' });
            }
          }
        }
        const MailAttachment = [];
        const MailAttachment1 = [];
        this.attachmnetsPaths.forEach((files) => {
          const obj = {
            file_name: files.name,
            path: files.path,
          };
          MailAttachment1.push(files.name);
          MailAttachment.push(obj);
        });
        this.mailData.sender_property = senderArray;
        this.mailData.recipient_properties = receiversArray;
        this.mailData.subject = formValues.subject;
        this.mailData.message = formValues.message;
        this.mailData.is_sent = true;
        this.mailData.status = 'active';
        this.mailData.attachments = MailAttachment1;
        this.mailData.file_attachments = MailAttachment;
        this.mailData.tags = ['sent'];

        this.mailData.is_group_parent = true;
        this.mailData.user_type_selection = this.sendEmailForm.get('categoryChecked').value;
        this.mailData.group_detail = {
          rncp_titles: this.sendEmailForm.get('rncpTitle').value,
          user_types: this.sendEmailForm.get('userTypes').value,
        };

        this.subs.sink = this.mailboxService.createMail(this.mailData).subscribe(
          (data: any) => {
            this.dialogref.close();
            this.isWaitingForResponse = false;
            swal.fire({
              title: this.translate.instant('MailBox.composeMail.MESSAGES.TITLE'),
              text: this.translate.instant('MailBox.composeMail.MESSAGES.TEXT'),
              footer: `<span style="margin-left: auto">MailBox.composeMail.MESSAGES</span>`,
              allowEscapeKey: true,
              type: 'success',
              confirmButtonText: this.translate.instant('MailBox.composeMail.MESSAGES.CONFIRMBTN'),
            });
          },
          (error) => {
            this.isWaitingForResponse = false;
          },
        );
      }
    }
  }

  getTitleList() {
    const search = '';
    this.rncpTitleService.getRncpTitlesForUrgent(search).subscribe((resp) => {
      this.rncpTitlesList = resp;
      this.originalRncpTitlesList = resp;
      this.subs.sink = this.sendEmailForm
        .get('rncpTitle')
        .valueChanges.pipe(debounceTime(400))
        .subscribe((searchString) => {
          if (!Array.isArray(searchString)) {
            this.rncpTitleService.getRncpTitlesForUrgent(searchString.toLowerCase()).subscribe((respp) => {
              this.rncpTitlesList = respp;
              this.originalRncpTitlesList = respp;
            });
          }
        });
    });
  }
  getUserTypeList() {
    this.subs.sink = this.userService.getUserTypesGroupMail().subscribe((userTypes) => {
      this.userTypesList = userTypes;
      this.originalUserTypesList = userTypes;
      this.subs.sink = this.sendEmailForm
        .get('userTypes')
        .valueChanges.pipe(debounceTime(400))
        .subscribe((searchString) => {
          if (!Array.isArray(searchString)) {
            this.userTypesList = this.originalUserTypesList.filter((com) =>
              com.name
                .toLowerCase()
                .trim()
                .includes(searchString && searchString.length ? searchString.toLowerCase() : ''),
            );
          }
        });
    });
  }
  selectedTitle(selectedTitle) {
    this.userReady = false;

    const title = this.sendEmailForm.get('rncpTitle').value;
    this.selectedTitleId = title;
    if (this.sendEmailForm.get('categoryChecked').value) {
      this.getRecipientsDataWithType(title, this.selectedUserTypeId);
    } else {
      this.getRecipientsData(title);
    }
    this.resetRecipientList();
  }
  selectedUserType(selectedUserType) {
    this.userReady = false;

    const userTypes = this.sendEmailForm.get('userTypes').value;
    const data = this.sendEmailForm.get('rncpTitle').value;
    const isTrue = selectedUserType.filter((dataa) => dataa === '5a067bba1c0217218c75f8ab');
    if (isTrue) {
      this.userService.getUserTypeStudent(data, userTypes).subscribe((resp) => {
        this.userRecipientList = resp;
      });
    } else {
      this.userService.getUserType(data, userTypes).subscribe((resp) => {
        this.userRecipientList = resp;
      });
    }
    this.resetRecipientList();
    this.selectedUserTypeId = userTypes;
    this.getRecipientsDataWithType(this.selectedTitleId, userTypes);
  }
  keyupUser(event) {
    this.userReady = true;
  }
  keyupUserType(event) {
    this.userTypeReady = true;
  }
  keyupTitle(event) {
    this.titleReady = true;
  }

  resetRecipientList() {
    this.recpList = [];
    this.recpListCc = [];
    this.recpListBcc = [];
    this.selectedEmailTo = [];
    this.selectedEmailCc = [];
    this.selectedEmailBcc = [];
    this.selectedRecepientsList = [];
    this.ccselectedRecepientsList = [];
    this.bccselectedRecepientsList = [];
    this.sendEmailForm.get('bcc').setValue('');
    this.sendEmailForm.get('cc').setValue('');
    this.sendEmailForm.get('to').setValue('');
  }

  valueChange(event) {
    if (event === 'title') {
      this.titleReady = false;
    } else if (event === 'user') {
      this.userReady = false;
    } else if (event === 'type') {
      this.userTypeReady = false;
    }

  }

  emitSelectedLanguagesTo() {
    if (this.returnType === ReturnType.OBJECT) {
      this.optionSelected.emit(this.selectedEmailTo);
    } else if (this.returnType === ReturnType.VALUE) {
      this.optionSelected.emit(this.selectedEmailTo.map((o: InputType) => o.value));
    } else {
      this.optionSelected.emit(this.selectedEmailTo.map((o: InputType) => o.label));
    }
  }
  emitSelectedLanguagesCc() {
    if (this.returnType === ReturnType.OBJECT) {
      this.optionSelected.emit(this.selectedEmailCc);
    } else if (this.returnType === ReturnType.VALUE) {
      this.optionSelected.emit(this.selectedEmailCc.map((o: InputType) => o.value));
    } else {
      this.optionSelected.emit(this.selectedEmailCc.map((o: InputType) => o.label));
    }
  }
  emitSelectedLanguagesBcc() {
    if (this.returnType === ReturnType.OBJECT) {
      this.optionSelected.emit(this.selectedEmailBcc);
    } else if (this.returnType === ReturnType.VALUE) {
      this.optionSelected.emit(this.selectedEmailBcc.map((o: InputType) => o.value));
    } else {
      this.optionSelected.emit(this.selectedEmailBcc.map((o: InputType) => o.label));
    }
  }

  removeTo(language: InputType): void {
    const index = this.selectedEmailTo.findIndex((i: InputType) => i === language);
    const globalIndex = this.selectedRecepientsList.findIndex((i: InputType) => i === language);

    if (index >= 0) {
      this.selectedEmailTo.splice(index, 1);
    }
    if (globalIndex >= 0) {
      this.selectedRecepientsList.splice(globalIndex, 1);
    }
    this.emitSelectedLanguagesTo();
  }

  removeCc(language: InputType): void {
    const index = this.selectedEmailCc.findIndex((i: InputType) => i === language);
    const globalIndex = this.selectedRecepientsList.findIndex((i: InputType) => i === language);

    if (index >= 0) {
      this.selectedEmailCc.splice(index, 1);
    }
    if (globalIndex >= 0) {
      this.selectedRecepientsList.splice(globalIndex, 1);
    }
    this.emitSelectedLanguagesCc();
  }

  removeBcc(language: InputType): void {
    const index = this.selectedEmailBcc.findIndex((i: InputType) => i === language);
    const globalIndex = this.selectedRecepientsList.findIndex((i: InputType) => i === language);

    if (index >= 0) {
      this.selectedEmailBcc.splice(index, 1);
    }
    if (globalIndex >= 0) {
      this.selectedRecepientsList.splice(globalIndex, 1);
    }
    this.emitSelectedLanguagesBcc();
  }
  addTo(event: MatChipInputEvent): void {
    if (!this.matAutocomplete.isOpen) {
      const input = event.chipInput.inputElement;
      const value = event.value;
      const dataEmailSelect = value.split(' ');
      let emailSelect = '';
      dataEmailSelect.forEach((data) => {
        emailSelect = data;
      });
      const sel = emailSelect.replace('<', '');
      const se = sel.replace('>', '');
      if (this.validateEmail(se)) {
        // Add our language
        if ((value || '').trim() && this.allowOther) {
          this.selectedEmailTo.push({ label: value.trim(), value: value.trim() });
        }
      } else {

      }

      // Reset the input value
      if (input) {
        input.value = '';
      }

      this.sendEmailForm.get('to').setValue(null);
      this.sendEmailForm.get('to').setValue('');
    }
    this.emitSelectedLanguagesTo();
  }

  addCc(event: MatChipInputEvent): void {
    if (!this.matAutocomplete.isOpen) {
      const input = event.chipInput.inputElement;
      const value = event.value;
      const dataEmailSelect = value.split(' ');
      let emailSelect = '';
      dataEmailSelect.forEach((data) => {
        emailSelect = data;
      });
      const sel = emailSelect.replace('<', '');
      const se = sel.replace('>', '');
      if (this.validateEmail(se)) {
        // Add our language
        if ((value || '').trim() || this.allowOther) {
          this.selectedEmailCc.push({ label: value.trim(), value: value.trim() });
        }
      } else {

      }

      // Reset the input value
      if (input) {
        input.value = '';
      }

      this.sendEmailForm.get('cc').setValue(null);
      this.sendEmailForm.get('cc').setValue('');
    }
    this.emitSelectedLanguagesCc();
  }

  addBcc(event: MatChipInputEvent): void {
    if (!this.matAutocomplete.isOpen) {
      const input = event.chipInput.inputElement;
      const value = event.value;
      const dataEmailSelect = value.split(' ');
      let emailSelect = '';
      dataEmailSelect.forEach((data) => {
        emailSelect = data;
      });
      const sel = emailSelect.replace('<', '');
      const se = sel.replace('>', '');
      if (this.validateEmail(se)) {
        // Add our language
        if ((value || '').trim() || this.allowOther) {
          this.selectedEmailBcc.push({ label: value.trim(), value: value.trim() });
        }
      } else {

      }

      // Reset the input value
      if (input) {
        input.value = '';
      }

      this.sendEmailForm.get('bcc').setValue(null);
      this.sendEmailForm.get('bcc').setValue('');
    }
    this.emitSelectedLanguagesBcc();
  }

  validateTo(event: MatChipInputEvent): void {
    const input = event.chipInput.inputElement;
    const value = event.value;
  }
  validateEmail(email) {
    const re =
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }
  setSelectedEmailTo(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.value;
    const dataEmailSelect = value.split(' ');
    let emailSelect = '';
    dataEmailSelect.forEach((data) => {
      emailSelect = data;
    });
    const sel = emailSelect.replace('<', '');
    const se = sel.replace('>', '');
    if (this.validateEmail(se)) {
      this.selectedEmailTo.push(value);
      this.selectedRecepientsList.push(value);

    } else {

    }
    const dataEmail = value.split(' ');
    let newEmail = '';
    dataEmail.forEach((data) => {
      newEmail = data;
    });
    const ne = newEmail.replace('<', '');
    const e = ne.replace('>', '');
    this.recpList.push(e);
    this.languagesInput.nativeElement.value = '';
    this.sendEmailForm.get('to').setValue(null);
    // this.sendEmailForm.get('to').setValue('');

    this.emitSelectedLanguagesTo();
  }

  setSelectedEmailCc(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.value;
    const dataEmailSelect = value.split(' ');
    let emailSelect = '';
    dataEmailSelect.forEach((data) => {
      emailSelect = data;
    });
    const sel = emailSelect.replace('<', '');
    const se = sel.replace('>', '');
    if (this.validateEmail(se)) {
      this.selectedEmailCc.push(value);
      this.selectedRecepientsList.push(value);

    } else {

    }
    const dataEmail = value.split(' ');
    let newEmail = '';
    dataEmail.forEach((data) => {
      newEmail = data;
    });
    const ne = newEmail.replace('<', '');
    const e = ne.replace('>', '');
    this.recpListCc.push(e);
    this.recipientCc.nativeElement.value = '';
    this.sendEmailForm.get('cc').patchValue('', { emitEvent: true });
    this.sendEmailForm.get('cc').setValue('');
  }

  setSelectedEmailBcc(event: MatAutocompleteSelectedEvent): void {
    const value = event.option.value;
    const dataEmailSelect = value.split(' ');
    let emailSelect = '';
    dataEmailSelect.forEach((data) => {
      emailSelect = data;
    });
    const sel = emailSelect.replace('<', '');
    const se = sel.replace('>', '');
    if (this.validateEmail(se)) {
      this.selectedEmailBcc.push(value);
      this.selectedRecepientsList.push(value);

    } else {

    }
    const dataEmail = value.split(' ');
    let newEmail = '';
    dataEmail.forEach((data) => {
      newEmail = data;
    });
    const ne = newEmail.replace('<', '');
    const e = ne.replace('>', '');
    this.recpListBcc.push(e);
    this.sendEmailForm.get('bcc').setValue(null);
    this.sendEmailForm.get('bcc').setValue('');
    this.recipientBcc.nativeElement.value = '';
  }
  resetValueTo() {
    this.sendEmailForm.get('to').patchValue('', { emitEvent: true });
  }
  resetValueCc() {
    this.sendEmailForm.get('cc').patchValue('', { emitEvent: true });
  }
  resetValueBcc() {
    this.sendEmailForm.get('bcc').patchValue('', { emitEvent: true });
  }
  getRecipientsData(titleId) {
    this.subs.sink = this.sendEmailForm
      .get('to')
      .valueChanges.pipe(debounceTime(400))
      .subscribe((full_name) => {
        this.emailAddressesListTo = [];
        if (full_name && full_name.length) {
          this.subs.sink = this.mailboxService
            .getRecipientDataUsingNameForGroup(full_name.toString(), titleId)
            .subscribe((mailList: any[]) => {
              if (mailList && mailList.length) {
                const difference = mailList
                  .filter(
                    (mail) =>
                      !this.selectedRecepientsList.includes(
                        this.translate.instant(mail.civility) + ' ' + mail.first_name + ' ' + mail.last_name + ' ' + '<' + mail.email + '>',
                      ),
                  )
                  .concat(
                    this.selectedRecepientsList.filter(
                      (mail) =>
                        !this.selectedRecepientsList.includes(
                          this.translate.instant(mail.civility) +
                            ' ' +
                            mail.first_name +
                            ' ' +
                            mail.last_name +
                            ' ' +
                            '<' +
                            mail.email +
                            '>',
                        ),
                    ),
                  );
                difference.forEach((mail) => {
                  if (mail.email !== undefined) {
                    this.emailAddressesListTo.push(
                      this.translate.instant(mail.civility) + ' ' + mail.first_name + ' ' + mail.last_name + ' ' + '<' + mail.email + '>',
                    );
                  }
                });
              }
            });
        }
      });
    this.subs.sink = this.sendEmailForm
      .get('cc')
      .valueChanges.pipe(debounceTime(400))
      .subscribe((full_name) => {
        this.emailAddressesListCc = [];
        if (full_name && full_name.length) {
          this.subs.sink = this.mailboxService
            .getRecipientDataUsingNameForGroup(full_name.toString(), titleId)
            .subscribe((mailList: any[]) => {
              if (mailList && mailList.length) {
                const difference = mailList
                  .filter(
                    (mail) =>
                      !this.selectedRecepientsList.includes(
                        this.translate.instant(mail.civility) + ' ' + mail.first_name + ' ' + mail.last_name + ' ' + '<' + mail.email + '>',
                      ),
                  )
                  .concat(
                    this.selectedRecepientsList.filter(
                      (mail) =>
                        !this.selectedRecepientsList.includes(
                          this.translate.instant(mail.civility) +
                            ' ' +
                            mail.first_name +
                            ' ' +
                            mail.last_name +
                            ' ' +
                            '<' +
                            mail.email +
                            '>',
                        ),
                    ),
                  );
                difference.forEach((mail) => {
                  if (mail.email !== undefined) {
                    this.emailAddressesListCc.push(
                      this.translate.instant(mail.civility) + ' ' + mail.first_name + ' ' + mail.last_name + ' ' + '<' + mail.email + '>',
                    );
                  }
                });
              }
            });
        }
      });
    this.subs.sink = this.sendEmailForm
      .get('bcc')
      .valueChanges.pipe(debounceTime(400))
      .subscribe((full_name) => {
        this.emailAddressesListBcc = [];
        if (full_name && full_name.length) {
          this.subs.sink = this.mailboxService
            .getRecipientDataUsingNameForGroup(full_name.toString(), titleId)
            .subscribe((mailList: any[]) => {
              if (mailList && mailList.length) {
                const difference = mailList
                  .filter(
                    (mail) =>
                      !this.selectedRecepientsList.includes(
                        this.translate.instant(mail.civility) + ' ' + mail.first_name + ' ' + mail.last_name + ' ' + '<' + mail.email + '>',
                      ),
                  )
                  .concat(
                    this.selectedRecepientsList.filter(
                      (mail) =>
                        !this.selectedRecepientsList.includes(
                          this.translate.instant(mail.civility) +
                            ' ' +
                            mail.first_name +
                            ' ' +
                            mail.last_name +
                            ' ' +
                            '<' +
                            mail.email +
                            '>',
                        ),
                    ),
                  );
                difference.forEach((mail) => {
                  if (mail.email !== undefined) {
                    this.emailAddressesListBcc.push(
                      this.translate.instant(mail.civility) + ' ' + mail.first_name + ' ' + mail.last_name + ' ' + '<' + mail.email + '>',
                    );
                  }
                });
              }
            });
        }
      });
  }
  getRecipientsDataWithType(titleId, typeId) {
    this.subs.sink = this.sendEmailForm
      .get('to')
      .valueChanges.pipe(debounceTime(400))
      .subscribe((full_name) => {
        this.emailAddressesListTo = [];
        if (full_name && full_name.length) {
          this.subs.sink = this.mailboxService
            .getRecipientDataUsingNameAndTypeForGroup(full_name.toString(), titleId, typeId)
            .subscribe((mailList: any[]) => {
              if (mailList && mailList.length) {
                const difference = mailList
                  .filter(
                    (mail) =>
                      !this.selectedRecepientsList.includes(
                        this.translate.instant(mail.civility) + ' ' + mail.first_name + ' ' + mail.last_name + ' ' + '<' + mail.email + '>',
                      ),
                  )
                  .concat(
                    this.selectedRecepientsList.filter(
                      (mail) =>
                        !this.selectedRecepientsList.includes(
                          this.translate.instant(mail.civility) +
                            ' ' +
                            mail.first_name +
                            ' ' +
                            mail.last_name +
                            ' ' +
                            '<' +
                            mail.email +
                            '>',
                        ),
                    ),
                  );
                difference.forEach((mail) => {
                  if (mail.email !== undefined) {
                    this.emailAddressesListTo.push(
                      this.translate.instant(mail.civility) + ' ' + mail.first_name + ' ' + mail.last_name + ' ' + '<' + mail.email + '>',
                    );
                  }
                });
              }
            });
        }
      });
    this.subs.sink = this.sendEmailForm
      .get('cc')
      .valueChanges.pipe(debounceTime(400))
      .subscribe((full_name) => {
        this.emailAddressesListCc = [];
        if (full_name && full_name.length) {
          this.subs.sink = this.mailboxService
            .getRecipientDataUsingNameAndTypeForGroup(full_name.toString(), titleId, typeId)
            .subscribe((mailList: any[]) => {
              if (mailList && mailList.length) {
                const difference = mailList
                  .filter(
                    (mail) =>
                      !this.selectedRecepientsList.includes(
                        this.translate.instant(mail.civility) + ' ' + mail.first_name + ' ' + mail.last_name + ' ' + '<' + mail.email + '>',
                      ),
                  )
                  .concat(
                    this.selectedRecepientsList.filter(
                      (mail) =>
                        !this.selectedRecepientsList.includes(
                          this.translate.instant(mail.civility) +
                            ' ' +
                            mail.first_name +
                            ' ' +
                            mail.last_name +
                            ' ' +
                            '<' +
                            mail.email +
                            '>',
                        ),
                    ),
                  );
                difference.forEach((mail) => {
                  if (mail.email !== undefined) {
                    this.emailAddressesListCc.push(
                      this.translate.instant(mail.civility) + ' ' + mail.first_name + ' ' + mail.last_name + ' ' + '<' + mail.email + '>',
                    );
                  }
                });
              }
            });
        }
      });
    this.subs.sink = this.sendEmailForm
      .get('bcc')
      .valueChanges.pipe(debounceTime(400))
      .subscribe((full_name) => {
        this.emailAddressesListBcc = [];
        if (full_name && full_name.length) {
          this.subs.sink = this.mailboxService
            .getRecipientDataUsingNameAndTypeForGroup(full_name.toString(), titleId, typeId)
            .subscribe((mailList: any[]) => {
              if (mailList && mailList.length) {
                const difference = mailList
                  .filter(
                    (mail) =>
                      !this.selectedRecepientsList.includes(
                        this.translate.instant(mail.civility) + ' ' + mail.first_name + ' ' + mail.last_name + ' ' + '<' + mail.email + '>',
                      ),
                  )
                  .concat(
                    this.selectedRecepientsList.filter(
                      (mail) =>
                        !this.selectedRecepientsList.includes(
                          this.translate.instant(mail.civility) +
                            ' ' +
                            mail.first_name +
                            ' ' +
                            mail.last_name +
                            ' ' +
                            '<' +
                            mail.email +
                            '>',
                        ),
                    ),
                  );
                difference.forEach((mail) => {
                  if (mail.email !== undefined) {
                    this.emailAddressesListBcc.push(
                      this.translate.instant(mail.civility) + ' ' + mail.first_name + ' ' + mail.last_name + ' ' + '<' + mail.email + '>',
                    );
                  }
                });
              }
            });
        }
      });
  }
  // Mail Signature
  mailSignature() {
    this.composeMailMessage = '<p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p>';
    this.composeMailMessage +=
      this.translate.instant(this.currentUser.civility) + ' ' + this.currentUser.first_name + ' ' + this.currentUser.last_name;
    const entity = this.currentUser.entities.filter((ent) => ent.type.name === this.isPermission[0]);
    const dataUnix = _.uniqBy(entity, 'school.short_name');
    this.composeMailMessage +=
      this.isPermission && this.isPermission.length && this.isPermission[0] && this.isPermission[0] ? ',<br>' + this.isPermission[0] : '';
    this.composeMailMessage +=
      dataUnix && dataUnix.length && dataUnix[0].school && dataUnix[0].school.short_name ? ',<br>' + dataUnix[0].school.short_name : '';

    this.sendEmailForm.get('message').setValue(this.composeMailMessage);
  }
  CheckforDraft() {
    if (this.isDraftMail) {
      if (this.DraftData && this.DraftData['_id']) {
        this.sendEmailForm.get('subject').setValue(this.DraftData['subject']);
        this.composeMailMessage = this.DraftData['message'];
        this.sendEmailForm.get('message').setValue(this.composeMailMessage);
        this.selectedEmailTo = [];
        this.selectedEmailCc = [];
        this.selectedEmailBcc = [];
        if (this.DraftData['recipient_properties']) {
          const receivers = this.DraftData.recipient_properties;
          this.LoadRecepient(receivers, ['a', 'c', 'cc']);
        }
        this.LoadAttachments(this.DraftData['attachments']);
        if (this.DraftData.is_group_parent) {
          this.sendEmailForm.get('categoryChecked').setValue(this.DraftData['user_type_selection']);
          this.computeGroupDetails(this.DraftData);
        }
      }
    }
  }
  computeGroupDetails(data) {

    const rncp_titles: any[] = data.group_detail.rncp_titles.map((rncpItem) => {
      let id: any;
      id = rncpItem._id;
      return id;
    });
    const user_types: any[] = data.group_detail.user_types.map((user_type_item) => {
      let id: any;
      id = user_type_item._id;
      return id;
    });
    const rncp_titles_name: any[] = data.group_detail.rncp_titles.map((rncpItem) => {
      let id: any;
      id = rncpItem.short_name;
      return id;
    });
    const user_types_name: any[] = data.group_detail.user_types.map((user_type_item) => {
      let id: any;
      id = user_type_item.name;
      return id;
    });
    this.sendEmailForm.get('rncpTitle').setValue(rncp_titles_name);
    this.sendEmailForm.get('userTypes').setValue(user_types_name);
    this.sendEmailForm.get('originalRncpTitle').setValue(rncp_titles);
    this.sendEmailForm.get('originalUserTypes').setValue(user_types);
  }
  LoadAttachments(attachments) {
    if (attachments && Array.isArray(attachments)) {
      const self = this;
      attachments.forEach((file) => {
        self.attachmnetsPaths.push({
          path: file,
          name: self.getFileName(file),
        });
      });
    }
  }

  getFileName(fileName: String): string {
    if (fileName) {
      return fileName.substring(fileName.lastIndexOf('/') + 1);
    }
    return '';
  }
  LoadRecepient(receivers, RecAry, isSenderReq = false) {
    if (Array.isArray(receivers)) {
      receivers.forEach((element) => {
        this.subs.sink = this.mailboxService.getRecipientDataEmail(element.recipients[0].email.toString()).subscribe((mailList) => {
          if (element.rank === 'a') {
            if (mailList && mailList.length) {
              this.recpList.push(mailList.email);
              this.selectedEmailTo.push(
                this.translate.instant(mailList.civility) +
                  ' ' +
                  mailList.first_name +
                  ' ' +
                  mailList.last_name +
                  ' ' +
                  '<' +
                  mailList.email +
                  '>',
              );
            } else if (element && element.recipients[0]) {
              this.recpList.push(element.recipients[0].email);
              this.selectedEmailTo.push(
                (element.recipients[0].civility ? this.translate.instant(element.recipients[0].civility) : '') +
                  ' ' +
                  element.recipients[0].first_name +
                  ' ' +
                  element.recipients[0].last_name +
                  ' ' +
                  '<' +
                  element.recipients[0].email +
                  '>',
              );
            }
          }
          if (element.rank === 'c') {
            this.recpListBcc.push(mailList.email);
            this.showBCC = true;
            this.selectedEmailBcc.push(
              this.translate.instant(mailList.civility) +
                ' ' +
                mailList.first_name +
                ' ' +
                mailList.last_name +
                ' ' +
                '<' +
                mailList.email +
                '>',
            );
          }
          if (element.rank === 'cc') {
            this.recpListCc.push(mailList.email);
            this.showCC = true;
            this.selectedEmailCc.push(
              this.translate.instant(mailList.civility) +
                ' ' +
                mailList.first_name +
                ' ' +
                mailList.last_name +
                ' ' +
                '<' +
                mailList.email +
                '>',
            );
          }
          if (element.rank === null) {
            this.recpList.push(mailList.email);
            this.selectedEmailTo.push(
              this.translate.instant(mailList.civility) +
                ' ' +
                mailList.first_name +
                ' ' +
                mailList.last_name +
                ' ' +
                '<' +
                mailList.email +
                '>',
            );
          }
        });
      });

      if (isSenderReq) {
        const sender = this.currentMailData['sender_property'].sender;
        this.selectedRecepientsList.push({
          email: sender,
        });
      }
    } else {
      this.subs.sink = this.mailboxService.getRecipientDataEmail(receivers.recipients[0].email.toString()).subscribe((mailList) => {
        if (receivers.rank === 'a') {
          if (mailList && mailList.length) {
            this.recpList.push(mailList.email);
            this.selectedEmailTo.push(
              this.translate.instant(mailList.civility) +
                ' ' +
                mailList.first_name +
                ' ' +
                mailList.last_name +
                ' ' +
                '<' +
                mailList.email +
                '>',
            );
          } else if (receivers && receivers.recipients[0]) {
            this.recpList.push(receivers.recipients[0].email);
            this.selectedEmailTo.push(
              (receivers.recipients[0].civility ? this.translate.instant(receivers.recipients[0].civility) : '') +
                ' ' +
                receivers.recipients[0].first_name +
                ' ' +
                receivers.recipients[0].last_name +
                ' ' +
                '<' +
                receivers.recipients[0].email +
                '>',
            );
          }
        }
        if (receivers.rank === 'c') {
          this.recpListBcc.push(mailList.email);
          this.showBCC = true;
          this.selectedEmailBcc.push(
            this.translate.instant(mailList.civility) +
              ' ' +
              mailList.first_name +
              ' ' +
              mailList.last_name +
              ' ' +
              '<' +
              mailList.email +
              '>',
          );
        }
        if (receivers.rank === 'cc') {
          this.recpListCc.push(mailList.email);
          this.showCC = true;
          this.selectedEmailCc.push(
            this.translate.instant(mailList.civility) +
              ' ' +
              mailList.first_name +
              ' ' +
              mailList.last_name +
              ' ' +
              '<' +
              mailList.email +
              '>',
          );
        }
        if (receivers.rank === null) {
          this.recpList.push(mailList.email);
          this.selectedEmailTo.push(
            this.translate.instant(mailList.civility) +
              ' ' +
              mailList.first_name +
              ' ' +
              mailList.last_name +
              ' ' +
              '<' +
              mailList.email +
              '>',
          );
        }
      });
    }
  }
  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
