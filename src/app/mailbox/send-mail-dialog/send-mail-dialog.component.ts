import { Component, OnInit, ViewChild, Input, ElementRef, Output, EventEmitter, OnDestroy } from '@angular/core';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { TranslateService } from '@ngx-translate/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators, EmailValidator } from '@angular/forms';
import { Observable, forkJoin } from 'rxjs';
import { MatAutocomplete, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatChipInputEvent } from '@angular/material/chips';
import { MatDialogRef } from '@angular/material/dialog';
import swal from 'sweetalert2';
import * as _ from 'lodash';
import { AuthService } from 'app/service/auth-service/auth.service';
import { MailStudentDialogComponent } from 'app/students/mail-student-dialog/mail-student-dialog.component';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { SubSink } from 'subsink';
import { debounceTime, startWith, map } from 'rxjs/operators';
import { ENTER, COMMA } from '@angular/cdk/keycodes';
import Swal from 'sweetalert2';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { DatePipe } from '@angular/common';
import { UtilityService } from 'app/service/utility/utility.service';
import { NgxPermissionsService } from 'ngx-permissions';
import { removeSpaces } from 'app/service/customvalidator.validator';

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
  selector: 'ms-send-mail-dialog',
  templateUrl: './send-mail-dialog.component.html',
  styleUrls: ['./send-mail-dialog.component.scss'],
})
export class SendMailDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  sendEmailForm: UntypedFormGroup;
  duplicateForm: UntypedFormGroup;
  datePipe: DatePipe;
  public Editor = DecoupledEditor;
  @ViewChild('myInput', { static: false }) currentFile: any;
  showCC = false;
  showBCC = false;
  dragging = false;
  loaded = false;
  imageLoaded = false;
  imageSrc = [];
  public config = {
    // placeholder: this.translate.instant('Description')
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
  selectedEmailTo = [];
  selectedEmailCc = [];
  selectedEmailBcc = [];

  public isDraftMail = false;
  public DraftData: any = [];
  visible = true;
  selectable = true;
  removable = true;
  addOnBlur = false;
  addOnBlurCc = false;
  addOnBlurBcc = false;
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

  public currentMailData = [];
  public tags = [];
  private isUrgentFlag = false;
  public isSenderReq = true;
  userTypeToggle = false;

  composeProcess = false;
  showSubject = true;
  isGroupEmail = false;
  composeMailMessage: string;
  typeReply: string;
  public mailForm: UntypedFormGroup;
  attachmnetsPaths = [];
  currentUser;
  academicUser;
  userData;
  categoryName: any;
  subjectName: any;
  mailData: any;
  isSugesstion = false;
  subject: string;
  showCCInput = false;
  showBCCInput = false;
  check = false;
  populated = true;

  disableAddEditing = true;
  displayBCC = false;
  displayCC = false;

  // mail = new Mail();
  recepientsList: Observable<Array<string>>;
  ccrecepientsList: Observable<Array<string>>;
  bccrecepientsList: Observable<Array<string>>;
  isShared = false;
  selectedRecepientsList = [];
  ccselectedRecepientsList = [];
  bccselectedRecepientsList = [];
  recpList = [];
  recpListCc = [];
  recpListBcc = [];
  usersList = [];
  isUserAcadir = false;
  isUserAcadAdmin = false;
  isUserCrossCor = false;
  isUserCorrector = false;
  isUserAnimator = false;
  isUserDirector = false;
  isUserTeacher = false;
  isUserPJM = false;
  isUserAJM = false;
  isUserCorrectorQuality = false;
  isUserCorrectorProblematic = false;
  isUserCertifierCorrector = false;
  isuserPresidentJury = false;
  isUserChiefGroupAcademic = false;
  isUserCertifierAdmin = false;
  isUserCertifierDir = false;
  isUserStudent = false;
  isPermission: any;

  acadDirId = '5a2e1ecd53b95d22c82f9554';
  acadAdminId = '5a2e1ecd53b95d22c82f9555';
  certDirId = '5a2e1ecd53b95d22c82f954f';
  certAdminId = '5a2e1ecd53b95d22c82f9550';

  acadamicJuryMemberId = '5cdbdeaf4b1f6a1b5a0b3fb6';
  professionalJuryMemberId = '5cdbde9b4b1f6a1b5a0b3fb5';
  correctorId = '5a2e1ecd53b95d22c82f9559';
  crossCorrectorId = '5a9e7ddf8228f45eb2e9bc77';
  pcSchoolDirector = '5a2e1ecd53b95d22c82f9553';
  teacherId = '5a2e1ecd53b95d22c82f9558';
  studentId = '5a067bba1c0217218c75f8ab';
  isLoading = false;

  pcRoleIds = [
    this.acadDirId,
    this.pcSchoolDirector,
    this.acadAdminId,
    this.acadamicJuryMemberId,
    this.professionalJuryMemberId,
    this.teacherId,
    this.correctorId,
    this.crossCorrectorId,
    this.studentId,
  ];

  emailAddressesListTo = [];
  emailAddressesListCc = [];
  emailAddressesListBcc = [];
  filteredOptions: Observable<string[]>;
  @ViewChild('languagesInput', { static: false }) languagesInput: ElementRef<HTMLInputElement>;
  @ViewChild('recipientCc', { static: false }) recipientCc: ElementRef<HTMLInputElement>;
  @ViewChild('recipientBcc', { static: false }) recipientBcc: ElementRef<HTMLInputElement>;
  @ViewChild('auto', { static: false }) matAutocomplete: MatAutocomplete;

  constructor(
    public translate: TranslateService,
    private userService: AuthService,
    private mailboxService: MailboxService,
    public dialogref: MatDialogRef<SendMailDialogComponent>,
    private fileUploadService: FileUploadService,
    private fb: UntypedFormBuilder,
    private utilService: UtilityService,
    private permissions: NgxPermissionsService,
  ) {
    this.sendEmailForm = this.fb.group({
      to: ['', [Validators.required, removeSpaces]],
      cc: ['', [Validators.required, removeSpaces]],
      bcc: ['', [Validators.required, removeSpaces]],
      subject: ['', [Validators.required, removeSpaces]],
      message: ['', Validators.required],
      rncp_titles: [''],
      user_type_selection: [''],
      user_types: [''],
    });
  }

  ngOnInit() {
    this.isPermission = this.userService.getPermission();
    this.getCurrentUser();
    this.mailSignature();
    // this.getRecipientsData();
    this.CheckforDraft();
  }

  public onReady(editor) {

    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
    // editor.config.removeButtons = 'Image,Table,HorizontalRule,SpecialChar,Undo,Redo';
    // editor.config.removePlugins = 'Insert';
  }

  setSelectedEmailTo(event: MatAutocompleteSelectedEvent): void {    
    this.addOnBlur = false;
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
    this.addOnBlurCc = false;
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
    this.addOnBlurBcc = false;
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

  validateEmail(email) {
    const re =
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
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

  saveDraft() {
    if (this.isDraftMail) {
      const formValues = this.sendEmailForm.value;
      if (formValues.subject !== '' || (formValues.message !== '' && formValues.message !== undefined)) {
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


        this.subs.sink = this.mailboxService.updateSingleMail(this.DraftData['_id'], this.mailData).subscribe((data: any) => {
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
      const formValues = this.sendEmailForm.value;
      if (formValues.subject !== '' || (formValues.message !== '' && formValues.message !== undefined)) {
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

        this.subs.sink = this.mailboxService.createMail(this.mailData).subscribe((data: any) => {
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

  sendMail(): void {
    if (this.isDraftMail) {
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

        this.subs.sink = this.mailboxService.sendMail(this.DraftData['_id'], this.mailData).subscribe(
          (data: any) => {
            //  this.MailService.contactSendMail(new_mail).then(
            this.composeProcess = false;
            this.dialogref.close('updateMailList');
            swal.fire({
              title: this.translate.instant('MailBox.composeMail.MESSAGES.TITLE'),
              text: this.translate.instant('MailBox.composeMail.MESSAGES.TEXT'),
              footer: `<span style="margin-left: auto">MailBox.composeMail.MESSAGES</span>`,
              allowEscapeKey: true,
              type: 'success',
              confirmButtonText: this.translate.instant('MailBox.composeMail.MESSAGES.CONFIRMBTN'),
            });
            // this.deleteOldDraftMail();
          },
          (error) => {
            // swal({ type: 'error', title: 'Mail Saved to Draft', text: error });
            swal.fire({
              title: this.translate.instant('STUDENT.MESSAGE.ERRORTIT'),
              text: this.translate.instant('STUDENT.MESSAGE.ERRORMSG'),
              footer: `<span style="margin-left: auto">STUDENT.MESSAGE.ERRORTIT</span>`,
              allowEscapeKey: true,
              type: 'error',
            });
            // this.snackBar.open(error, 'Ok', { duration: 2000 });
            this.composeProcess = false;
          },
        );
      }
    } else {
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

        this.subs.sink = this.mailboxService.createMail(this.mailData).subscribe(
          (data: any) => {
            //  this.MailService.contactSendMail(new_mail).then(
            this.composeProcess = false;
            this.dialogref.close('updateMailList');
            swal.fire({
              title: this.translate.instant('MailBox.composeMail.MESSAGES.TITLE'),
              text: this.translate.instant('MailBox.composeMail.MESSAGES.TEXT'),
              footer: `<span style="margin-left: auto">MailBox.composeMail.MESSAGES</span>`,
              allowEscapeKey: true,
              type: 'success',
              confirmButtonText: this.translate.instant('MailBox.composeMail.MESSAGES.CONFIRMBTN'),
            });
            // this.deleteOldDraftMail();
          },
          (error) => {
            this.composeProcess = false;
          },
        );
      }
    }
  }

  deleteOldDraftMail() {
    if (this.isDraftMail && this.DraftData['_id']) {
      this.selectedEmailTo = [];
      this.selectedEmailTo.push(this.DraftData['_id']);
      this.subs.sink = this.mailboxService.deleteMail(this.selectedEmailTo).subscribe();
    }
  }

  getTranslateUserType(name) {
    const value = this.translate.instant('ADMTCSTAFFKEY.' + name.toUpperCase());
    return value !== 'ADMTCSTAFFKEY.' + name.toUpperCase() ? value : name;
  }

  getCurrentUser() {
    this.currentUser = this.userService.getLocalStorageUser();
    this.subs.sink = this.userService.getUserById(this.currentUser._id).subscribe((resp) => {
      this.userData = resp;
      this.userTypeChecking();
    });
  }
  computeGroupDetails() {
    const rncp_titles = this.sendEmailForm.get('rncp_titles').value.map((rncpItem) => rncpItem.id);
    let user_types = [];
    if (this.sendEmailForm.get('user_type_selection').value) {
      user_types = this.sendEmailForm.get('user_types').value.map((user_type_item) => user_type_item.id);
    }
    return { rncp_titles, user_types };
  }

  simpleDiacriticSensitiveRegex(text: string): string {
    if (text) {
      return text
        .replace(/[a,á,à,ä]/g, 'a')
        .replace(/[e,é,ë,è]/g, 'e')
        .replace(/[i,í,ï,Î,î]/g, 'i')
        .replace(/[o,ó,ö,ò,ô]/g, 'o')
        .replace(/[u,ü,ú,ù]/g, 'u')
        .replace(/[ ,-]/g, ' ');
    } else {
      return '';
    }
  }

  handleDragEnter() {
    this.dragging = true;
  }

  handleDragLeave() {
    this.dragging = false;
  }

  handleDrop(e) {
    e.preventDefault();
    this.dragging = false;
    this.handleInputChange(e);
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
  resetFileState() {
    this.currentFile.nativeElement.value = '';
  }

  removeAttachment(file) {
    this.attachmnetsPaths.splice(this.attachmnetsPaths.indexOf(file), 1);
  }

  _handleReaderLoaded({ file_name }, e) {
    const reader = e.target;
    const fileType = reader.result.split(';')[0].split(':')[1];
    this.imageSrc.push({
      type: fileType,
      name: file_name,
      data: reader.result,
    });
    this.loaded = true;
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

  getRecipientsData() {
    this.subs.sink = this.sendEmailForm
      .get('to')
      .valueChanges.pipe(debounceTime(400))
      .subscribe((full_name) => {
        this.emailAddressesListTo = [];
        if (full_name && full_name.length) {
          this.isLoading = true;
          this.subs.sink = this.mailboxService.getRecipientDataUsingName(full_name.toString()).subscribe((mailList: any[]) => {
            this.isLoading = false;
            if (mailList && mailList.length) {
              this.addOnBlur = true;
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
                } else {
                  this.addOnBlur = false;
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
          this.isLoading = true;
          this.subs.sink = this.mailboxService.getRecipientDataUsingName(full_name.toString()).subscribe((mailList: any[]) => {
            this.isLoading = false;
            if (mailList && mailList.length) {
              this.addOnBlurCc = true;
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
                } else {
                  this.addOnBlurCc = false;
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
          this.isLoading = true;
          this.subs.sink = this.mailboxService.getRecipientDataUsingName(full_name.toString()).subscribe((mailList: any[]) => {
            this.isLoading = false;
            if (mailList && mailList.length) {
              this.addOnBlurBcc = true;
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
                } else {
                  this.addOnBlurBcc = false;
                }
              });
            }
          });
        }
      });
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
        if ((value || '').trim() && this.allowOther) {
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
        if ((value || '').trim() && this.allowOther) {
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
          this.userTypeToggle = this.DraftData['user_type_selection'];
        }
      }
    }
  }

  LoadRecipientReplyAll(receivers, typeReply: string) {
    if (Array.isArray(receivers)) {

      receivers.forEach((element) => {
        if (typeReply === 'to') {
          this.subs.sink = this.mailboxService.getRecipientDataEmail(element.sender.email.toString()).subscribe((mailList) => {
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
          });
        } else if (typeReply === 'cc') {
          this.subs.sink = this.mailboxService.getRecipientDataEmail(element.recipients[0].email.toString()).subscribe((mailList) => {
            if (element.rank === 'a') {
              if (this.currentUser.email !== mailList.email) {
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
            }
            // if (element.rank === 'c') {
            //   if (this.currentUser.email !== mailList.email) {
            //     this.recpListBcc.push(mailList.email);
            //     this.showBCC = true;
            //     this.selectedEmailBcc.push(
            //       mailList.civility + ' ' + mailList.first_name + ' ' + mailList.last_name + ' ' + '<' + mailList.email + '>',
            //     );
            //   }
            // }
            if (element.rank === 'cc') {
              if (this.currentUser.email !== mailList.email) {
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
            }
          });
        }
      });
    } else {

      if (typeReply === 'to') {
        this.subs.sink = this.mailboxService.getRecipientDataEmail(receivers.sender.email.toString()).subscribe((mailList) => {
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
        });
      } else if (typeReply === 'cc') {
        this.subs.sink = this.mailboxService.getRecipientDataEmail(receivers.sender.email.toString()).subscribe((mailList) => {
          if (receivers.rank === 'a') {
            if (this.currentUser.email !== mailList.email) {
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
          }

          // if (receivers.rank === 'c') {
          //   if (this.currentUser.email !== mailList.email) {
          //     this.recpListBcc.push(mailList.email);
          //     this.showBCC = true;
          //     this.selectedEmailBcc.push(
          //       mailList.civility + ' ' + mailList.first_name + ' ' + mailList.last_name + ' ' + '<' + mailList.email + '>',
          //     );
          //   }
          // }
          if (receivers.rank === 'cc') {
            if (this.currentUser.email !== mailList.email) {
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
          }
        });
      }
    }
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
      if (this.tags.indexOf('reply-mail') > -1 && this.currentMailData) {
        this.subs.sink = this.mailboxService.getRecipientDataEmail(receivers.sender.email.toString()).subscribe((mailList) => {
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
        });
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
  }

  if(isSenderReq) {
    const sender = this.currentMailData['sender_property'].sender;
    this.selectedRecepientsList.push({
      email: sender,
    });
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

  // Mail Signature
  mailSignature() {
    this.composeMailMessage = '<p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p>';
    this.composeMailMessage +=
      this.translate.instant(this.currentUser.civility) + ' ' + this.currentUser.first_name + ' ' + this.currentUser.last_name;
    const entity = this.currentUser.entities.filter((ent) => ent.type.name === this.isPermission[0]);
    const dataUnix = _.uniqBy(entity, 'school.short_name');
    const userPosition = this.currentUser?.position
    if (userPosition) {
      this.composeMailMessage += ',<br>' + userPosition
    } else if (this.isPermission[0]) {
      this.composeMailMessage += ',<br>' + this.translate.instant(this.isPermission[0])
    }
    this.composeMailMessage += dataUnix?.length && dataUnix[0]?.school?.short_name ? ',<br>' + dataUnix[0].school.short_name : '';
    if (this.tags.indexOf('reply-mail') > -1 && this.currentMailData) {
      this.sendEmailForm.get('subject').setValue('RE : ' + this.currentMailData['subject']);
      const receivers = this.currentMailData['sender_property'];
      this.LoadRecepient(receivers, [], this.isSenderReq);
      this.LoadAttachments(this.currentMailData['attachments']);
      this.composeMailMessage = this.AddMailBody('Message');
    } else if (this.tags.indexOf('foward-mail') > -1 && this.currentMailData) {
      this.LoadAttachments(this.currentMailData['attachments']);
      this.sendEmailForm.get('subject').setValue('FW : ' + this.currentMailData['subject']);
      this.composeMailMessage = this.AddMailBody('Forwarded message');
      this.sendEmailForm.get('message').setValue(this.composeMailMessage);
    } else if (this.tags.indexOf('reply-all') > -1 && this.currentMailData) {
      this.LoadAttachments(this.currentMailData['attachments']);
      this.sendEmailForm.get('subject').setValue('RE : ' + this.currentMailData['subject']);

      const sender = this.currentMailData['sender_property'];
      this.LoadRecipientReplyAll(sender, 'to');

      const receivers = this.currentMailData['recipient_properties'];
      this.LoadRecipientReplyAll(receivers, 'cc');

      this.composeMailMessage = this.AddMailBody('Message');
    }

    this.sendEmailForm.get('message').setValue(this.composeMailMessage);
  }

  /* for share mail to 1001 ideas */
  getSignatureForShare() {
    let body = '<br/><br/>';
    // body += '<br/><br/><br/><br/><br/>';
    this.composeMailMessage += ' ' + this.currentUser.first_name + ' ' + this.currentUser.last_name;
    body += ',</br>' + this.currentUser.position;
    body += '<br/><br/>';
    body += '------------' + 'Forward Message' + '------------';
    body += '<br/><b> ' + this.translate.instant('dashboardMessage.FROM') + '</b> : ';
    body += '<br/><b> ' + this.translate.instant('dashboardMessage.TO') + '</b> : ';
    body += this.getRecipientFullNameShare(this.currentUser);
    // this.replyMailForm.controls['subject'].setValue(this.categoryName);
    this.subject = this.categoryName;
    body += '<br/><b> ' + this.translate.instant('MailBox.composeMail.subject') + ' </b> : ' + this.subject;
    body += '<br/><br/>';

    this.composeMailMessage = body;
    this.subjectName = this.translate.instant('1001 Ideas');

    this.mailForm.controls['subject'].setValue(this.subjectName + ' : ' + this.subject);
    // return body;
  }

  AddMailBody(Caption) {
    let body = '';
    body += '<p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p>';
    body += '------------' + Caption + '------------';
    body += '<br/><b> ' + this.translate.instant('MailBox.from') + '</b> : ';
    body += this.getSenderFullName(this.currentMailData['sender_property']);
    body += '<br/><b> ' + this.translate.instant('MailBox.to') + '</b> : ';
    // body += this.getSenderFullName(this.currentMailData['sender_property']);
    body += this.getRecipientFullName(this.currentMailData['recipient_properties']);
    body += '<br/><b> Date </b> : ' + this.getTranslatedDate(this.currentMailData['created_at']);
    body += '<br/><b> ' + this.translate.instant('MailBox.composeMail.subject') + ' </b> : ' + this.currentMailData['subject'];
    body += '<br/><br/>';
    body += this.currentMailData['message'];
    return body;
  }
  getSenderFullName(sender_propertys) {
    const sender_property = sender_propertys;
    if (sender_property) {
      if (sender_property.sender) {
        if (sender_property.sender.hasOwnProperty('sender')) {
          const recObj =
            this.translate.instant(sender_property.sender.civility) +
            ' ' +
            sender_property.sender.first_name +
            ' ' +
            sender_property.sender.last_name;
          return recObj;
        } else {
          return (
            this.translate.instant(sender_property.sender.civility) +
            ' ' +
            sender_property.sender.first_name +
            ' ' +
            sender_property.sender.last_name
          );
        }
      } else {
        return '';
      }
    } else {
      return '';
    }
  }

  /* for share mail to 1001 ideas */
  getSenderFullNameShare(sender) {
    const sender_property = sender;
    if (sender_property) {
      if (sender_property.hasOwnProperty('sender')) {
        const recObj = sender_property;
        return recObj.sender;
      } else {
        return sender_property.sender;
      }
    } else {
      return '';
    }
  }

  getRecipientFullName(recipient_propertiess) {
    const recipient_properties = recipient_propertiess;
    if (recipient_properties) {
      if (recipient_properties[0].recipients[0]) {
        if (recipient_properties[0].hasOwnProperty('recipients')) {
          const senderObj = recipient_properties[0].recipients[0];
          return this.translate.instant(senderObj.civility) + ' ' + senderObj.first_name + ' ' + senderObj.last_name;
        } else {
          return (
            this.translate.instant(recipient_properties[0].recipients[0].civility) +
            ' ' +
            recipient_properties[0].recipients[0].first_name +
            ' ' +
            recipient_properties[0].recipients[0].last_name
          );
        }
      } else {
        return '';
      }
    } else {
      return '';
    }
  }

  /* for share mail to 1001 ideas */
  getRecipientFullNameShare(recipient) {
    const recipients = recipient;
    if (recipients) {
      if (recipients) {
        if (recipients.hasOwnProperty('recipients')) {
          const senderObj = recipients;
          return senderObj.recipients;
        } else {
          return recipients;
        }
      } else {
        return '';
      }
    } else {
      return '';
    }
  }

  getTranslatedDate(dateRaw) {


    if (typeof dateRaw === 'object') {
      const date = new Date(dateRaw.year, dateRaw.month, dateRaw.date, dateRaw.hour, dateRaw.minute);
      this.datePipe = new DatePipe(this.translate.currentLang);
      return this.datePipe.transform(date, 'EEE d MMM, y');
    } else {
      let date = dateRaw;
      if (typeof date === 'number') {
        date = date.toString();
      }
      if (date.length === 8) {
        const year: number = parseInt(date.substring(0, 4));
        const month: number = parseInt(date.substring(4, 6));
        const day: number = parseInt(date.substring(6, 8));
        date = new Date(year, month, day);
      }
      this.datePipe = new DatePipe(this.translate.currentLang);
      return this.datePipe.transform(date, 'EEE d MMM, y');
    }
  }

  validateTo(event: MatChipInputEvent): void {
    const input = event.chipInput.inputElement;
    const value = event.value;
  }

  userTypeChecking() {

    this.isUserAcadir = this.permissions.getPermission('Academic Director') ? true : false;
    this.isUserAcadAdmin = this.permissions.getPermission('Academic Admin') ? true : false;
    this.isUserCorrector = this.permissions.getPermission('Corrector') ? true : false;
    this.isUserAnimator = this.permissions.getPermission('Animator Business game') ? true : false;
    this.isUserCrossCor = this.permissions.getPermission('Cross Corrector') ? true : false;
    this.isUserDirector = this.permissions.getPermission('PC School Director') ? true : false;
    this.isUserTeacher = this.permissions.getPermission('Teacher') ? true : false;
    this.isUserPJM = this.permissions.getPermission('Professional Jury Member') ? true : false;
    this.isUserAJM = this.permissions.getPermission('Academic Final Jury Member') ? true : false;
    this.isUserCertifierCorrector = this.permissions.getPermission('Corrector Certifier') ? true : false;
    this.isuserPresidentJury = this.permissions.getPermission('President of Jury') ? true : false;
    this.isUserCorrectorProblematic = this.permissions.getPermission('Corrector of Problematic') ? true : false;
    this.isUserCorrectorQuality = this.permissions.getPermission('Corrector Quality') ? true : false;
    this.isUserChiefGroupAcademic = this.permissions.getPermission('Chief Group Academic') ? true : false;
    this.isUserCertifierAdmin = this.permissions.getPermission('Certifier Admin') ? true : false;
    this.isUserCertifierDir = this.permissions.getPermission('CR School Director') ? true : false;
    this.isUserStudent = this.permissions.getPermission('Student') ? true : false;
    if (this.isUserAcadir || this.isUserAcadAdmin) {
      this.getRecipientForAcadDirAndAcadAdmin();
      // this.getRecipientBySchool();
      // this.getRecipientsFromSchool();
    } else if (this.isUserCrossCor) {
      this.getRecipientByUserType();
    } else if (this.isUserCorrector) {
      this.getRecipientByUserType();
    } else if (this.isUserAnimator) {
      this.getRecipientByUserType();
    } else if (this.isUserDirector) {
      // this.getRecipientByUserType();

      this.getRecipientForAcadDirAndAcadAdmin();
    } else if (this.isUserTeacher) {
      this.getRecipientByUserType();
    } else if (this.isUserPJM) {
      this.getRecipientByUserType();
    } else if (this.isUserAJM) {
      this.getRecipientByUserType();
    } else if (this.isUserCertifierCorrector) {
      this.getRecipientByUserType();
    } else if (this.isuserPresidentJury) {
      this.getRecipientByUserType();
    } else if (this.isUserCorrectorProblematic) {
      this.getRecipientByUserType();
    } else if (this.isUserCorrectorQuality) {
      this.getRecipientByUserType();
    } else if (this.isUserChiefGroupAcademic) {
      this.getRecipientByUserType();
    } else if (this.isUserCertifierDir || this.isUserCertifierAdmin) {
      this.getRecipientByUserType();
    } else if (this.isUserStudent) {
      this.getRecipientByUserType();
    } else {
      this.getRecipientsData();
    }
  }

  getRecipientForAcadDirAndAcadAdmin() {
    if (this.permissions.getPermission('Academic Admin')) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'Academic Admin');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.academicUser = this.userData.entities.filter((ent) => ent.type.name === userType);
      const titleIds = this.utilService.getAcademicAllAssignedTitle(this.academicUser);
      const schoolIds = this.utilService.getUserAllAssignedSchool();
      dataUnix.forEach((login) => {
        this.subs.sink = this.mailboxService
          .geUserStudentListBySchoolAndTitleAndUsertype(schoolIds, titleIds, this.pcRoleIds, 'include_student')
          .subscribe((resp) => {
            if (resp && resp.length) {
              const filteredUser = _.filter(resp, (user) => user._id !== this.currentUser._id);


              this.usersList = _.concat(this.usersList, filteredUser);
            }
          });
      });

      this.getAllRecipientWithoutFilter();
      this.getRecipientsFromSchool();
    } else if (this.permissions.getPermission('Academic Director')) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'Academic Director');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.academicUser = this.userData.entities.filter((ent) => ent.type.name === userType);
      const titleIds = this.utilService.getAcademicAllAssignedTitle(this.academicUser);
      const schoolIds = this.utilService.getUserAllAssignedSchool();
      dataUnix.forEach((login) => {
        this.subs.sink = this.mailboxService
          .geUserStudentListBySchoolAndTitleAndUsertype(schoolIds, titleIds, this.pcRoleIds, 'include_student')
          .subscribe((resp) => {
            if (resp && resp.length) {
              const filteredUser = _.filter(resp, (user) => user._id !== this.currentUser._id);
              this.usersList = _.concat(this.usersList, filteredUser);
            }
          });
      });

      this.getAllRecipientWithoutFilter();
      this.getRecipientsFromSchool();
    } else if (this.isUserDirector) {

      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'PC School Director');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.academicUser = this.userData.entities.filter((ent) => ent.type.name === userType);
      const titleIds = this.utilService.getAcademicAllAssignedTitle(this.academicUser);
      const schoolIds = this.utilService.getUserAllAssignedSchool();
      dataUnix.forEach((login) => {
        this.subs.sink = this.mailboxService
          .geUserStudentListBySchoolAndTitleAndUsertype(schoolIds, titleIds, this.pcRoleIds, 'include_student')
          .subscribe((resp) => {
            if (resp && resp.length) {
              const filteredUser = _.filter(resp, (user) => user._id !== this.currentUser._id);
              this.usersList = _.concat(this.usersList, filteredUser);
            }
          });
      });

      this.getAllRecipientWithoutFilter();
      this.getRecipientsFromSchool();
    }
  }

  getRecipientByUserType() {
    this.usersList = [];
    if (this.isUserCorrector) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'Corrector');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.academicUser = this.userData.entities.filter((ent) => ent.type.name === userType);
      const titleIds = this.utilService.getAcademicAllAssignedTitle(this.academicUser);
      const schoolIds = this.utilService.getUserAllAssignedSchool();
      dataUnix.forEach((login) => {
        this.subs.sink = this.mailboxService
          .geUserListBySchoolAndTitleAndUsertype(schoolIds, titleIds, [this.acadDirId, this.acadAdminId])
          .subscribe((resp) => {
            this.usersList = _.concat(this.usersList, resp);
          });
      });
      this.getAllRecipientWithoutFilter();
      this.getRecipientsFromSchool();
    } else if (this.isUserAnimator) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'Animator Business game');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.academicUser = this.userData.entities.filter((ent) => ent.type.name === userType);
      const titleIds = this.utilService.getAcademicAllAssignedTitle(this.academicUser);
      const schoolIds = this.utilService.getUserAllAssignedSchool();
      dataUnix.forEach((login) => {
        this.subs.sink = this.mailboxService
          .geUserListBySchoolAndTitleAndUsertype(schoolIds, titleIds, [this.acadDirId, this.acadAdminId])
          .subscribe((resp) => {
            this.usersList = _.concat(this.usersList, resp);
          });
      });
      this.getAllRecipientWithoutFilter();
      this.getRecipientsFromSchool();
    } else if (this.isUserCrossCor) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'Cross Corrector');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.academicUser = this.userData.entities.filter((ent) => ent.type.name === userType);
      const titleIds = this.utilService.getAcademicAllAssignedTitle(this.academicUser);
      const schoolIds = this.utilService.getUserAllAssignedSchool();
      dataUnix.forEach((login) => {
        this.subs.sink = this.mailboxService
          .geUserListBySchoolAndTitleAndUsertype(schoolIds, titleIds, [this.acadDirId, this.acadAdminId])
          .subscribe((resp) => {
            this.usersList = _.concat(this.usersList, resp);
          });
      });

      this.getAllRecipientWithoutFilter();
      this.getRecipientsFromSchool();
    } else if (this.isUserTeacher) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'Teacher');
      const dataUnix = _.uniqBy(entity, 'school.short_name');

      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.academicUser = this.userData.entities.filter((ent) => ent.type.name === userType);
      const titleIds = this.utilService.getAcademicAllAssignedTitle(this.academicUser);
      const schoolIds = this.utilService.getUserAllAssignedSchool();
      dataUnix.forEach((login) => {
        this.subs.sink = this.mailboxService
          .geUserListBySchoolAndTitleAndUsertype(schoolIds, titleIds, [this.acadDirId, this.acadAdminId])
          .subscribe((resp) => {
            this.usersList = _.concat(this.usersList, resp);
          });
      });

      this.getAllRecipientWithoutFilter();
      this.getRecipientsFromSchool();
    } else if (this.isUserPJM) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'Professional Jury Member');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      dataUnix.forEach((login) => {
        this.subs.sink = this.mailboxService
          .geUserListBySchoolAndUsertype([login.school._id], [this.acadDirId, this.acadAdminId])
          .subscribe((resp) => {
            this.usersList = _.concat(this.usersList, resp);
          });
      });

      this.getAllRecipientWithoutFilter();
      this.getRecipientsFromSchool();
    } else if (this.isUserAJM) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'Academic Final Jury Member');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      dataUnix.forEach((login) => {
        this.subs.sink = this.mailboxService
          .geUserListBySchoolAndUsertype([login.school._id], [this.acadDirId, this.acadAdminId])
          .subscribe((resp) => {
            this.usersList = _.concat(this.usersList, resp);
          });
      });

      this.getAllRecipientWithoutFilter();
      this.getRecipientsFromSchool();
    } else if (this.isUserCertifierCorrector) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'Corrector Certifier');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.academicUser = this.userData.entities.filter((ent) => ent.type.name === userType);
      const titleIds = this.utilService.getAcademicAllAssignedTitle(this.academicUser);
      const schoolIds = this.utilService.getUserAllAssignedSchool();
      dataUnix.forEach((login) => {
        this.subs.sink = this.mailboxService
          .geUserListBySchoolAndTitleAndUsertype(schoolIds, titleIds, [this.certDirId, this.certAdminId])
          .subscribe((resp) => {
            this.usersList = _.concat(this.usersList, resp);
          });
      });

      this.getAllRecipientWithoutFilter();
      this.getRecipientsFromSchool();
    } else if (this.isuserPresidentJury) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'President of Jury');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.academicUser = this.userData.entities.filter((ent) => ent.type.name === userType);
      const titleIds = this.utilService.getAcademicAllAssignedTitle(this.academicUser);
      const schoolIds = this.utilService.getUserAllAssignedSchool();
      dataUnix.forEach((login) => {
        this.subs.sink = this.mailboxService
          .geUserListBySchoolAndTitleAndUsertype(schoolIds, titleIds, [this.certDirId, this.certAdminId])
          .subscribe((resp) => {
            this.usersList = _.concat(this.usersList, resp);
          });
      });

      this.getAllRecipientWithoutFilter();
      this.getRecipientsFromSchool();
    } else if (this.isUserCorrectorProblematic) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'Corrector of Problematic');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.academicUser = this.userData.entities.filter((ent) => ent.type.name === userType);
      const titleIds = this.utilService.getAcademicAllAssignedTitle(this.academicUser);
      const schoolIds = this.utilService.getUserAllAssignedSchool();
      dataUnix.forEach((login) => {
        this.subs.sink = this.mailboxService
          .geUserListBySchoolAndTitleAndUsertype(schoolIds, titleIds, [this.certDirId, this.certAdminId])
          .subscribe((resp) => {
            this.usersList = _.concat(this.usersList, resp);
          });
      });

      this.getAllRecipientWithoutFilter();
      this.getRecipientsFromSchool();
    } else if (this.isUserCorrectorQuality) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'Corrector Quality');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.academicUser = this.userData.entities.filter((ent) => ent.type.name === userType);
      const titleIds = this.utilService.getAcademicAllAssignedTitle(this.academicUser);
      const schoolIds = this.utilService.getUserAllAssignedSchool();
      dataUnix.forEach((login) => {
        this.subs.sink = this.mailboxService
          .geUserListBySchoolAndTitleAndUsertype(schoolIds, titleIds, [this.certDirId, this.certAdminId])
          .subscribe((resp) => {
            this.usersList = _.concat(this.usersList, resp);
          });
      });

      this.getAllRecipientWithoutFilter();
      this.getRecipientsFromSchool();
    } else if (this.isUserChiefGroupAcademic) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'Chief Group Academic');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.academicUser = this.userData.entities.filter((ent) => ent.type.name === userType);
      const titleIds = this.utilService.getAcademicAllAssignedTitle(this.academicUser);
      const schoolIds = this.utilService.getAllSchoolFromChiefGroupUser();
      dataUnix.forEach((login) => {
        this.subs.sink = this.mailboxService.geUserListBySchoolAndTitle(schoolIds, titleIds).subscribe((resp) => {
          this.usersList = _.concat(this.usersList, resp);
        });
        // this.subs.sink = this.mailboxService
        //   .geUserListBySchoolAndTitleAndUsertype(schoolIds, titleIds, [this.certDirId, this.certAdminId])
        //   .subscribe((resp) => {
        //     this.usersList = _.concat(this.usersList, resp);
        //   });
      });

      this.getAllRecipientWithoutFilter();
      this.getRecipientsFromSchool();
    } else if (this.isUserCertifierDir) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'CR School Director');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      dataUnix.forEach((login) => {
        this.subs.sink = this.mailboxService.getUserBySchoolId(login.school._id).subscribe((resp) => {
          this.usersList = _.filter(resp, function (user) {
            return _.find(user.entities, function (option) {
              const data =
                option && option.type && option.type.name
                  ? option.type.name !== 'Academic Director'
                  : '' && option && option.type && option.type.name
                  ? option.type.name !== 'Academic Admin'
                  : '' && option && option.type && option.type.name
                  ? option.type.name !== 'Certifier Admin'
                  : '' && option && option.type && option.type.name
                  ? option.type.name !== 'Academic Final Jury Member'
                  : '' && option && option.type && option.type.name
                  ? option.type.name !== 'ADMTC Admin'
                  : '' && option && option.type && option.type.name
                  ? option.type.name !== 'ADMTC Director'
                  : '';
              return data;
            });
          });

          this.getAllRecipientWithoutFilter();
          this.getRecipientsFromSchool();
        });
      });
    } else if (this.isUserCertifierAdmin) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'Certifier Admin');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      dataUnix.forEach((login) => {
        this.subs.sink = this.mailboxService.getUserBySchoolId(login.school._id).subscribe((resp) => {
          this.usersList = _.filter(resp, function (user) {
            return _.find(user.entities, function (option) {
              return option && option.type && option.type.name
                ? option.type.name !== 'Academic Director'
                : '' || (option && option.type && option.type.name)
                ? option.type.name !== 'Academic Admin'
                : '' || (option && option.type && option.type.name)
                ? option.type.name !== 'Certifier Admin'
                : '' || (option && option.type && option.type.name)
                ? option.type.name !== 'Academic Final Jury Member'
                : '' || (option && option.type && option.type.name)
                ? option.type.name !== 'ADMTC Admin'
                : '' || (option && option.type && option.type.name)
                ? option.type.name !== 'ADMTC Director'
                : '';
            });
          });

          this.getAllRecipientWithoutFilter();
          this.getRecipientsFromSchool();
        });
      });
    } else if (this.isUserDirector) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'PC School Director');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      dataUnix.forEach((login) => {
        this.subs.sink = this.mailboxService.getUserBySchoolId(login.school._id).subscribe((resp) => {
          this.usersList = _.filter(resp, function (user) {
            return _.filter(user.entities, function (option) {
              return option && option.type && option.type.name ? option.type.name !== 'Academic Director' : '';
            });
          });

          this.getAllRecipientWithoutFilter();
          this.getRecipientsFromSchool();
        });
      });
    } else if (this.isUserStudent) {
      const entity = this.currentUser.entities.filter((ent) => ent.type.name === 'Student');
      const dataUnix = _.uniqBy(entity, 'school.short_name');
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.academicUser = this.userData.entities.filter((ent) => ent.type.name === userType);
      const titleIds = this.utilService.getAcademicAllAssignedTitle(this.academicUser);
      const schoolIds = this.utilService.getUserAllAssignedSchool();
      dataUnix.forEach((login) => {
        this.subs.sink = this.mailboxService
          .geUserListBySchoolAndTitleAndUsertype(schoolIds, titleIds, [this.acadDirId])
          .subscribe((resp) => {
            this.usersList = _.concat(this.usersList, resp);
          });
      });
      this.getAllRecipientWithoutFilter();
      this.getRecipientsFromSchool();
    }
  }

  getRecipientBySchool() {
    this.usersList = [];
    this.subs.sink = this.mailboxService.getUserBySchool().subscribe((resp) => {

      if (resp && resp.length) {
        resp.forEach((school) => {
          this.usersList.push(school.users);
          this.subs.sink = this.mailboxService.getStudent(school._id).subscribe((response) => {
            if (response && response.length) {
              this.usersList = [];
              this.usersList = _.concat(school.users, response);
            }
          });
        });
        this.usersList = this.usersList.filter((el) => {
          return el != null;
        });

        this.getAllRecipientWithoutFilter();
        this.getRecipientsFromSchool();
      }
    });
  }

  getRecipientByCross() {
    this.usersList = [];
    this.subs.sink = this.mailboxService.getUserBySchool().subscribe((resp) => {

      if (resp && resp.length) {
        let dataFound: any;
        let usersData: any;
        resp.forEach((school) => {
          dataFound = _.cloneDeep(school.users);
          dataFound = dataFound.filter((el) => {
            return el != null;
          });
        });
        dataFound.forEach((user) => {
          usersData = user.entities.filter((entity) => entity.type.name === 'Academic Director');
          this.usersList.push(usersData);
        });

        // this.usersList = _.filter(dataFound.entities, function (entity) {
        //   return entity.type.name === 'Academic Director' || entity.type.name === 'Academic Admin';
        // });

        this.getAllRecipientWithoutFilter();
        this.getRecipientsFromSchool();
      }
    });
  }

  getRecipientsFromSchool() {
    this.subs.sink = this.sendEmailForm
      .get('to')
      .valueChanges.pipe(debounceTime(400))
      .subscribe((full_name) => {
        this.emailAddressesListTo = [];
        // if (full_name && full_name.length >= 3) {
        this.usersList = _.uniqBy(this.usersList, 'email');
        const dataFilter = _.filter(this.usersList, function (option) {
          const name = option ? option.first_name + ' ' + option.last_name : '';
          return name ? name.toLowerCase().includes(full_name ? full_name.toLowerCase() : '') : '';
        });
        const difference = dataFilter
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
        // }
      });
    this.subs.sink = this.sendEmailForm
      .get('cc')
      .valueChanges.pipe(debounceTime(400))
      .subscribe((full_name) => {
        this.emailAddressesListCc = [];
        // if (full_name && full_name.length >= 3) {
        this.usersList = _.uniqBy(this.usersList, 'email');
        const dataFilter = _.filter(this.usersList, function (option) {
          const name = option ? option.first_name + ' ' + option.last_name : '';
          return name ? name.toLowerCase().includes(full_name ? full_name.toLowerCase() : '') : '';
        });
        const difference = dataFilter
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
        // }
      });
    this.subs.sink = this.sendEmailForm
      .get('bcc')
      .valueChanges.pipe(debounceTime(400))
      .subscribe((full_name) => {
        this.emailAddressesListBcc = [];
        // if (full_name && full_name.length >= 3) {
        this.usersList = _.uniqBy(this.usersList, 'email');
        const dataFilter = _.filter(this.usersList, function (option) {
          const name = option ? option.first_name + ' ' + option.last_name : '';
          return name ? name.toLowerCase().includes(full_name ? full_name.toLowerCase() : '') : '';
        });
        const difference = dataFilter
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
        // }
      });
  }

  getAllRecipientWithoutFilter() {
    // if (this.populated) {

    this.populated = false;
    this.emailAddressesListTo = [];
    this.usersList = _.uniqBy(this.usersList, 'email');
    const difference = this.usersList
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

    this.emailAddressesListCc = [];
    this.usersList = _.uniqBy(this.usersList, 'email');
    const differenceCc = this.usersList
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

    this.emailAddressesListBcc = [];
    this.usersList = _.uniqBy(this.usersList, 'email');
    const differenceBcc = this.usersList
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
    // }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
