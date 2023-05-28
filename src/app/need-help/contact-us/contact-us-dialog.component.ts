import { Component, OnInit, ViewChild, Input, ElementRef, Output, EventEmitter, OnDestroy } from '@angular/core';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js'
import { TranslateService } from '@ngx-translate/core';
import { UntypedFormBuilder, FormControl, UntypedFormGroup, Validators, EmailValidator } from '@angular/forms';
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
import { UserService } from 'app/service/user/user.service';
import { TutorialService } from 'app/service/tutorial/tutorial.service';

@Component({
  selector: 'ms-contact-us-dialog',
  templateUrl: './contact-us-dialog.component.html',
  styleUrls: ['./contact-us-dialog.component.scss'],
})
export class ContactUsDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  sendEmailForm: UntypedFormGroup;
  duplicateForm: UntypedFormGroup;
  datePipe: DatePipe;
  public Editor = DecoupledEditor;
  @ViewChild('myInput', { static: false }) currentFile: any;
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

  public isDraftMail = false;
  public DraftData: any = [];

  public currentMailData = [];
  public tags = [];
  private isUrgentFlag = false;
  public isSenderReq = true;
  userTypeToggle = false;

  composeProcess = false;
  showSubject = true;
  isGroupEmail = false;
  adminMail = 'Mr ADMTC < aide@admtc.info >';
  composeMailMessage: string;
  typeReply: string;
  public mailForm: UntypedFormGroup;
  attachmnetsPaths = [];
  currentUser;
  senderUser;
  categoryName: any;
  subjectName: any;
  mailData: any;
  isSugesstion = false;
  subject: string;
  showCCInput = false;
  showBCCInput = false;
  check = false;
  populated = true;
  aideId = '5b10ca4ed8912448ac5d93d8';
  adminData;
  dragging = false;
  loaded = false;
  imageLoaded = false;
  imageSrc = [];
  disableAddEditing = true;
  isShared = false;
  usersList = [];
  isPermission: any;
  operatorName: any;

  constructor(
    public translate: TranslateService,
    public tutorialService: TutorialService,
    private authService: AuthService,
    private mailboxService: MailboxService,
    public dialogref: MatDialogRef<ContactUsDialogComponent>,
    private fileUploadService: FileUploadService,
    private fb: UntypedFormBuilder,
    private utilService: UtilityService,
    private permissions: NgxPermissionsService,
    private userService: UserService,
  ) {
    this.sendEmailForm = this.fb.group({
      message: ['', Validators.required],
    });
  }

  ngOnInit() {
    this.currentUser = this.authService.getLocalStorageUser();
    this.senderUser =
      this.translate.instant(this.currentUser.civility) + ' ' + this.currentUser.first_name + ' ' + this.currentUser.last_name;
    this.isPermission = this.authService.getPermission();
    this.mailSignature();
    this.getUserAdmin();
    this.getOperator();
  }

  public onReady(editor) {

    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  getUserAdmin() {
    this.subs.sink = this.userService.getUserById(this.aideId).subscribe((resp) => {
      this.adminData = resp;
      this.adminMail = this.translate.instant(resp.civility) + ' ' + resp.first_name + ' ' + resp.last_name + ' < ' + resp.email + ' > ';
    });
  }

  getOperator() {
    this.subs.sink = this.tutorialService.getOperatorName().subscribe((resp) => {
      this.operatorName = resp;
    });
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
    if (formValues.message !== '' && formValues.message !== undefined) {
      const receiversArray = [];
      // const senderArray = [];
      this.mailData = {};
      const recipient = this.adminData;
      const senderArray = {
        sender: this.currentUser.email,
        is_read: false,
        mail_type: 'draft',
      };
      if (recipient) {
        if (this.validateEmail(recipient.email)) {
          receiversArray.push({ recipients: [recipient.email], rank: 'a', is_read: false, mail_type: 'draft' });
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
      this.mailData.subject = this.translate.instant('subject_helps', { sender: this.senderUser, operator: this.operatorName.group_name });
      this.mailData.message = formValues.message;
      this.mailData.is_sent = false;
      this.mailData.status = 'active';
      this.mailData.is_urgent_mail = false;
      this.mailData.attachments = MailAttachment1;
      this.mailData.file_attachments = MailAttachment;
      this.mailData.tags = ['draft'];

      this.subs.sink = this.mailboxService.createMail(this.mailData).subscribe((data: any) => {
        this.dialogref.close();
        swal.fire({
          type: 'info',
          title: this.translate.instant('MailBox.MESSAGES.DRAFTMSG'),
          text: '',
          confirmButtonText: this.translate.instant('MailBox.MESSAGES.THANK'),
        });
      });
    }
  }

  sendMail(): void {
    const formValues = this.sendEmailForm.value;
    if (formValues.message !== '' && formValues.message !== undefined) {
      const receiversArray = [];
      this.mailData = {};
      const recipient = this.adminData;
      const senderArray = {
        sender: this.currentUser.email,
        is_read: false,
        mail_type: 'sent',
      };
      if (recipient) {
        if (this.validateEmail(recipient.email)) {
          receiversArray.push({ recipients: [recipient.email], rank: 'a', is_read: false, mail_type: 'inbox' });
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
      this.mailData.subject = this.translate.instant('subject_helps', { sender: this.senderUser, operator: this.operatorName.group_name });
      this.mailData.message = this.mailSendSignature();
      this.mailData.is_sent = true;
      this.mailData.status = 'active';
      // this.mailData.is_urgent_mail = this.isUrgentFlag;
      this.mailData.attachments = MailAttachment1;
      this.mailData.file_attachments = MailAttachment;
      this.mailData.tags = ['sent'];

      this.subs.sink = this.mailboxService.createMail(this.mailData).subscribe(
        (data: any) => {
          //  this.MailService.contactSendMail(new_mail).then(
          this.composeProcess = false;
          this.dialogref.close('updateMailList');
          swal.fire({
            title: this.translate.instant('MailBox.composeMail.MESSAGES.TITLE'),
            text: this.translate.instant('MailBox.composeMail.MESSAGES.TEXT'),
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

  getTranslateUserType(name) {
    const value = this.translate.instant('ADMTCSTAFFKEY.' + name.toUpperCase());
    return value !== 'ADMTCSTAFFKEY.' + name.toUpperCase() ? value : name;
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
      this.subs.sink = this.fileUploadService.singleUpload(file).subscribe((resp) => {
        if (resp) {
          this.attachmnetsPaths.push({
            path: resp.file_url,
            name: resp.file_name,
          });
        } else {
          Swal.fire({
            type: 'error',
            title: 'Error',
            allowOutsideClick: false,
            confirmButtonText: this.translate.instant('OK'),
          });
        }
      });
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

  getFileName(fileName: String): string {
    if (fileName) {
      return fileName.substring(fileName.lastIndexOf('/') + 1);
    }
    return '';
  }

  // Mail Signature
  mailSignature() {
    const entity = this.currentUser.entities.filter((ent) => ent.type.name === this.isPermission[0]);
    const dataUnix = _.uniqBy(entity, 'school.short_name');
    this.composeMailMessage = '<p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p><p>&nbsp;</p>';
    this.composeMailMessage +=
      this.translate.instant(this.currentUser.civility) + ' ' + this.currentUser.first_name + ' ' + this.currentUser.last_name;
    this.composeMailMessage +=
      this.isPermission && this.isPermission.length && this.isPermission[0] && this.isPermission[0] ? ',<br>' + this.isPermission[0] : '';
    this.composeMailMessage +=
      dataUnix && dataUnix.length && dataUnix[0].school && dataUnix[0].school.short_name ? ',<br>' + dataUnix[0].school.short_name : '';
    this.composeMailMessage +=
      dataUnix && dataUnix.length && dataUnix[0].school && dataUnix[0].school.short_name ? ',<br>' + dataUnix[0].school.short_name : '';

    this.sendEmailForm.get('message').setValue(this.composeMailMessage);
  }

  // Mail Signature
  mailSendSignature() {
    const entity = this.currentUser.entities.filter((ent) => ent.type.name === this.isPermission[0]);
    const dataUnix = _.uniqBy(entity, 'school.short_name');
    let composeMailMessage =
      this.translate.instant('mail.username') +
      ' : ' +
      this.translate.instant(this.currentUser.civility) +
      ' ' +
      this.currentUser.first_name +
      ' ' +
      this.currentUser.last_name +
      ' <br><br>';
    composeMailMessage += this.translate.instant('mail.mail') + ' : ' + this.currentUser.email + ' <br><br>';
    composeMailMessage +=
      dataUnix && dataUnix.length && dataUnix[0].assigned_rncp_title
        ? this.translate.instant('mail.title') + ' : ' + dataUnix[0].assigned_rncp_title.short_name + ' <br><br>'
        : '';
    composeMailMessage +=
      dataUnix && dataUnix.length && dataUnix[0].type
        ? this.translate.instant('mail.user_type') + ' : ' + dataUnix[0].type.name + ' <br><br>'
        : '';
    composeMailMessage +=
      dataUnix && dataUnix.length && dataUnix[0].school
        ? this.translate.instant('mail.school') + ' : ' + dataUnix[0].school.short_name + ' <br><br><br>'
        : '';
    composeMailMessage += this.sendEmailForm.get('message').value;
    return composeMailMessage;
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

  validateEmail(email) {
    const re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
