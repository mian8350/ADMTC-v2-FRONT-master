import { Component, OnInit, Inject, ViewChild, ElementRef, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { TranslateService } from '@ngx-translate/core';
import { FormControl, UntypedFormGroup, Validators, UntypedFormBuilder } from '@angular/forms';
import swal from 'sweetalert2';
import { MatAutocompleteSelectedEvent, MatAutocomplete } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import { AuthService } from 'app/service/auth-service/auth.service';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import Swal from 'sweetalert2';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { debounceTime } from 'rxjs/operators';
import { from } from 'rxjs';
import { SubSink } from 'subsink';
import { UtilityService } from 'app/service/utility/utility.service';
import * as _ from 'lodash';

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
  selector: 'ms-company-compose-email-dialog',
  templateUrl: './company-compose-email-dialog.component.html',
  styleUrls: ['./company-compose-email-dialog.component.scss'],
})
export class CompanyComposeEmailDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  sendEmailForm: UntypedFormGroup;
  public Editor = DecoupledEditor;
  showCC = false;
  showBCC = false;
  public config = {};

  @ViewChild('languagesInput', { static: false }) languagesInput: ElementRef<HTMLInputElement>;
  @ViewChild('recipientCc', { static: false }) recipientCc: ElementRef<HTMLInputElement>;
  @ViewChild('recipientBcc', { static: false }) recipientBcc: ElementRef<HTMLInputElement>;
  @ViewChild('auto', { static: false }) matAutocomplete: MatAutocomplete;
  @ViewChild('myInput', { static: false }) currentFile: any;

  preSelectedEmail: string;
  selectedEmailTo = [];
  selectedEmailCc = [];
  selectedEmailBcc = [];
  isPermission: any;

  selectedRecepientsList = [];
  ccselectedRecepientsList = [];
  bccselectedRecepientsList = [];

  recpList = [];
  recpListCc = [];
  recpListBcc = [];

  emailAddressesListTo = [];
  emailAddressesListCc = [];
  emailAddressesListBcc = [];

  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = true;
  addOnBlurCc = true;
  addOnBlurBcc = true;
  showCCInput = false;
  showBCCInput = false;
  @Input() allowOther = false;
  @Input() returnType: ReturnType = ReturnType.LABEL;
  @Output() optionSelected: EventEmitter<(string | InputType)[]> = new EventEmitter();
  separatorKeysCodes: number[] = [ENTER, COMMA];
  separatorKeysCodesCc: number[] = [ENTER, COMMA];
  separatorKeysCodesBcc: number[] = [ENTER, COMMA];

  attachmnetsPaths = [];
  currentUser;
  categoryName: any;
  entityData: any;
  subjectName: any;
  mailData: any;
  isGroupEmail = false;
  isUserAdmtc = false;
  isUserAcadir = false;

  isWaitingForResponse = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public translate: TranslateService,
    private userService: AuthService,
    private mailboxService: MailboxService,
    private fileUploadService: FileUploadService,
    public dialogref: MatDialogRef<CompanyComposeEmailDialogComponent>,
    private fb: UntypedFormBuilder,
    private utilService: UtilityService,
  ) {
    this.sendEmailForm = this.fb.group({
      to: ['', Validators.required],
      cc: ['', Validators.required],
      bcc: ['', Validators.required],
      subject: ['', Validators.required],
      message: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.isPermission = this.userService.getPermission();
    this.getCurrentUser();
    this.getRecipientsData();
    this.getSchoolAcadirData();
  }

  getSchoolAcadirData() {
    if (Array.isArray(this.data)) {
      for (const mydata of this.data) {
        this.preSelectedEmail = mydata.civility + ' ' + mydata.first_name + ' ' + mydata.last_name + ' <' + mydata.email + '>';
        this.selectedEmailTo.push(
          this.translate.instant(mydata.civility) + ' ' + mydata.first_name + ' ' + mydata.last_name + ' <' + mydata.email + '>',
        );
        this.emailAddressesListTo.push(this.preSelectedEmail);
        if (this.validateEmail(mydata.email)) {
          this.selectedRecepientsList.push(mydata.email);
        }
        this.recpList.push(mydata.email);
        this.sendEmailForm.get('to').setValue(null);
        this.getEmailMessage();
      }
    } else {
      this.preSelectedEmail = this.data.civility + ' ' + this.data.first_name + ' ' + this.data.last_name + ' <' + this.data.email + '>';
      this.selectedEmailTo.push(
        this.translate.instant(this.data.civility) + ' ' + this.data.first_name + ' ' + this.data.last_name + ' <' + this.data.email + '>',
      );
      this.emailAddressesListTo.push(this.preSelectedEmail);
      if (this.validateEmail(this.data.email)) {
        this.selectedRecepientsList.push(this.data.email);
      }
      this.recpList.push(this.data.email);
      this.sendEmailForm.get('to').setValue(null);
      this.getEmailMessage();
    }
  }

  getEmailMessage() {
    if (Array.isArray(this.data)) {
      let recipient = '';
      for (const mydata of this.data) {
        recipient = recipient + this.translate.instant(mydata.civility) + ' ' + mydata.first_name + ' ' + mydata.last_name + ', ';
      }
      let text =
        recipient +
        `<p></p><p></p><p></p><p></p>` +
        this.translate.instant(this.currentUser.civility) +
        ' ' +
        this.currentUser.first_name +
        ' ' +
        this.currentUser.last_name;
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === this.isPermission[0]);
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      const userPosition = this.currentUser?.position
      if (userPosition) {
        text += ',<br>' + userPosition
      } else if (this.isPermission[0]) {
        text += ',<br>' + this.translate.instant(this.isPermission[0])
      }
      text += dataUnix?.length && dataUnix[0]?.school?.short_name ? ',<br>' + dataUnix[0].school.short_name : '';
      this.sendEmailForm.get('message').setValue(text);
    } else {
      debugger
      let recipient = '';
      recipient = recipient + this.translate.instant(this.data.civility) + ' ' + this.data.first_name + ' ' + this.data.last_name + ', ';
      let text =
        recipient +
        `<p></p><p></p><p></p><p></p>` +
        this.translate.instant(this.currentUser.civility) +
        ' ' +
        this.currentUser.first_name +
        ' ' +
        this.currentUser.last_name;
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === this.isPermission[0]);
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      const userPosition = this.currentUser?.position
      if (userPosition) {
        text += ',<br>' + userPosition
      } else if (this.isPermission[0]) {
        text += ',<br>' + this.translate.instant(this.isPermission[0])
      }
      text += dataUnix?.length && dataUnix[0]?.school?.short_name ? ',<br>' + dataUnix[0].school.short_name : '';
      this.sendEmailForm.get('message').setValue(text);
    }
  }

  validateEmail(email) {
    const re =
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
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
        type: 'warning',
        showCancelButton: true,
        confirmButtonText: this.translate.instant('MailBox.composeMail.DRAFT.CONFIRMBTN'),
        cancelButtonText: this.translate.instant('MailBox.composeMail.DRAFT.DECBTN'),
      })
      .then((result) => {
        if (result.value) {
          this.saveDraft();
        } else {
          this.dialogref.close();
        }
      });
  }

  saveDraft() {
    const formValues = this.sendEmailForm.value;
    if (formValues.subject !== '' && formValues.message !== '' && formValues.message !== undefined) {
      const receiversArray = [];
      // const senderArray = [];
      this.mailData = {};
      const recipient = this.recpList;
      const recipientCc = this.recpListCc;
      const recipientBcc = this.recpListBcc;
      this.currentUser = this.userService.getLocalStorageUser();
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

      if (this.isGroupEmail) {
        this.mailData.is_group_parent = this.isGroupEmail;
        this.mailData.user_type_selection = formValues.user_type_selection;
        this.mailData.group_detail = this.computeGroupDetails();
      }

      this.mailboxService.createMail(this.mailData).subscribe((data: any) => {
        this.dialogref.close();
        swal.fire({
          type: 'info',
          title: this.translate.instant('MailBox.MESSAGES.DRAFTMSG'),
          text: '',
          confirmButtonText: this.translate.instant('MailBox.MESSAGES.THANK'),
        });
      });
    } else {
      swal.fire({
        type: 'warning',
        title: this.translate.instant('MENTOREVALUATION.EMAILTEMPLATE.SUBJECT.validation1'),
        text: '',
        confirmButtonText: 'OK',
      });
    }
  }

  sendMail() {
    this.isWaitingForResponse = true;
    const formValues = this.sendEmailForm.value;
    if (formValues.subject !== '' || (formValues.message !== '' && formValues.message !== undefined)) {
      const receiversArray = [];
      this.mailData = {};
      const recipient = this.recpList;
      const recipientCc = this.recpListCc;
      const recipientBcc = this.recpListBcc;
      this.currentUser = this.userService.getLocalStorageUser();
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
      // this.mailData.is_urgent_mail = this.isUrgentFlag;
      this.mailData.attachments = MailAttachment1;
      this.mailData.file_attachments = MailAttachment;
      this.mailData.tags = ['sent'];

      if (this.isGroupEmail) {
        this.mailData.is_group_parent = this.isGroupEmail;
        this.mailData.user_type_selection = formValues.user_type_selection;
        this.mailData.group_detail = this.computeGroupDetails();
      }
      this.mailboxService.createMail(this.mailData).subscribe(
        (data: any) => {
          this.isWaitingForResponse = false;
          this.dialogref.close();
          swal.fire({
            title: this.translate.instant('MailBox.composeMail.MESSAGES.TITLE'),
            text: this.translate.instant('MailBox.composeMail.MESSAGES.TEXT'),
            allowEscapeKey: true,
            type: 'success',
            confirmButtonText: this.translate.instant('MailBox.composeMail.MESSAGES.CONFIRMBTN'),
          });
          // this.deleteOldDraftMail();
        },
        (error) => {},
      );
    }
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

  resetValueTo() {
    this.sendEmailForm.get('to').patchValue('', { emitEvent: true });
  }
  resetValueCc() {
    this.sendEmailForm.get('cc').patchValue('', { emitEvent: true });
  }
  resetValueBcc() {
    this.sendEmailForm.get('bcc').patchValue('', { emitEvent: true });
  }

  computeGroupDetails() {
    const rncp_titles = this.sendEmailForm.get('rncp_titles').value.map((rncpItem) => rncpItem.id);
    let user_types = [];
    if (this.sendEmailForm.get('user_type_selection').value) {
      user_types = this.sendEmailForm.get('user_types').value.map((user_type_item) => user_type_item.id);
    }
    return { rncp_titles, user_types };
  }

  handleInputChange(fileInput: Event) {
    const file = (<HTMLInputElement>fileInput.target).files[0];
    if (file) {
      this.fileUploadService.singleUpload(file).subscribe(
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
  resetFileState() {
    this.currentFile.nativeElement.value = '';
  }

  getRecipientsData() {
    this.subs.sink = this.sendEmailForm
      .get('to')
      .valueChanges.pipe(debounceTime(800))
      .subscribe((full_name) => {
        this.emailAddressesListTo = [];
        if (full_name && full_name.length) {
          this.subs.sink = this.mailboxService.getRecipientDataUsingName(full_name.toString()).subscribe((mailList: any[]) => {
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
                        mail.civility + ' ' + mail.first_name + ' ' + mail.last_name + ' ' + '<' + mail.email + '>',
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
      .valueChanges.pipe(debounceTime(800))
      .subscribe((full_name) => {
        this.emailAddressesListCc = [];
        if (full_name && full_name.length) {
          this.subs.sink = this.mailboxService.getRecipientDataUsingName(full_name.toString()).subscribe((mailList: any[]) => {
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
                        mail.civility + ' ' + mail.first_name + ' ' + mail.last_name + ' ' + '<' + mail.email + '>',
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
      .valueChanges.pipe(debounceTime(800))
      .subscribe((full_name) => {
        this.emailAddressesListBcc = [];
        if (full_name && full_name.length) {
          this.subs.sink = this.mailboxService.getRecipientDataUsingName(full_name.toString()).subscribe((mailList: any[]) => {
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
                        mail.civility + ' ' + mail.first_name + ' ' + mail.last_name + ' ' + '<' + mail.email + '>',
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

  getCurrentUser() {
    this.currentUser = this.userService.getLocalStorageUser();
    this.entityData = this.currentUser.entities.find((entity) => entity.type.name === 'ADMTC Admin');
    this.isUserAdmtc = this.utilService.isUserEntityADMTC();
    this.isUserAcadir = this.utilService.isUserAcadir();
    if (this.isUserAdmtc) {
      this.entityData = this.currentUser.entities.find((entity) => entity.type.name === 'ADMTC Admin');
    } else if (this.isUserAcadir) {
      this.entityData = this.currentUser.entities.find((entity) => entity.type.name === 'Academic Director');
    }
  }

  removeAttachment(file) {
    this.attachmnetsPaths.splice(this.attachmnetsPaths.indexOf(file), 1);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
