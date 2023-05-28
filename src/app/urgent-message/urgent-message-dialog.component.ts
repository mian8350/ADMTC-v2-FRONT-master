import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/service/auth-service/auth.service';
import { MailboxService } from 'app/service/mailbox/mailbox.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { UrgentMessageService } from 'app/service/urgent-message/urgent-message.service';
import { UserService } from 'app/service/user/user.service';
import { Observable } from 'rxjs';
import { debounceTime, map } from 'rxjs/operators';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-urgent-message-dialog',
  templateUrl: './urgent-message-dialog.component.html',
  styleUrls: ['./urgent-message-dialog.component.scss'],
})
export class UrgentMessageDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  urgentMessageForm: UntypedFormGroup;
  mailData: any;
  recpList: any;
  // users: any;
  // userTypes: any;
  // userList: any;
  currentUser: any;
  rncpTitles: any;
  userTypesList: any;
  userList: any;
  userRecipientList: any;
  originalUserTypesList: any;
  rncpTitlesList: any;
  originalUserList: any;
  originalRncpTitlesList: any;
  checked;
  isWaitingForResponse = false;
  titleReady = false;
  userReady = false;
  userTypeReady = false;
  titles = [];
  titleClasses = [];
  autocompleteUsers = [];
  autocompleteUserTypes = [];
  filteredTitles: Observable<string[]>;
  filteredUsers: Observable<string[]>;
  filteredUserTypes: Observable<string[]>;
  selectedTitleId: string[] = [];
  selectedUserTypeId: string[] = [];
  titleSelection = new UntypedFormControl(null);
  classSelection = new UntypedFormControl(null);
  selectionTextList: string[] = [];

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<UrgentMessageDialogComponent>,
    private urgentMessageService: UrgentMessageService,
    private userService: UserService,
    private autService: AuthService,
    private rncpTitleService: RNCPTitlesService,
    private mailboxService: MailboxService,
    public translate: TranslateService,
  ) {}

  get titleFormArray() {
    return this.urgentMessageForm.get('titles') as UntypedFormArray;
  }

  ngOnInit() {
    // this.isWaitingForResponse = true;
    // this.subs.sink = this.urgentMessageService.geturgentMessages().subscribe((data: any) => {
    //   this.userTypes = data.userTypes
    //   this.userList = data.userList
    //   this.rncpTitles = data.rncpTitles
    //   this.rncpTitles.forEach(el => {
    //     this.titles.push(el.shortName)
    //   })
    //   this.userList.forEach(el => {
    //     this.autocompleteUsers.push(el.lastName + ' ' + el.firstName + ' ' + el.civility)
    //   })
    //   this.userTypes.forEach(el => {
    //     this.autocompleteUserTypes.push(el.text)
    //   })
    //   this.isWaitingForResponse = false;
    // })

    this.initializeForm();
    this.currentUser = this.autService.getLocalStorageUser();
    this.getTitleList();
    this.getUserTypeList();
  }

  getUserList(titleId) {
    this.userService.getUserAcademicByTitleId(titleId).subscribe((resp) => {
      this.userList = resp;
      this.originalUserList = resp;
      this.subs.sink = this.urgentMessageForm
        .get('users')
        .valueChanges.pipe(debounceTime(400))
        .subscribe((searchString) => {
          this.userList = this.originalUserList.filter((com) =>
            com.last_name
              .toLowerCase()
              .trim()
              .includes(searchString && searchString.length ? searchString.toLowerCase() : ''),
          );
        });
    });
  }
  getTitleList() {
    const search = '';
    this.rncpTitleService.getRncpTitlesForUrgent(search).subscribe((resp) => {
      this.rncpTitlesList = resp;
      this.originalRncpTitlesList = resp;
    });
  }
  getUserTypeList() {
    this.subs.sink = this.userService.getUserTypesByEntitywithStudent('academic').subscribe((userTypes) => {
      this.userTypesList = userTypes;
      this.originalUserTypesList = userTypes;
      this.subs.sink = this.urgentMessageForm
        .get('userTypes')
        .valueChanges.pipe(debounceTime(400))
        .subscribe((searchString) => {
          this.userTypesList = this.originalUserTypesList.filter((com) =>
            com.name
              .toLowerCase()
              .trim()
              .includes(searchString && searchString.length ? searchString.toLowerCase() : ''),
          );
        });
    });
  }

  getTitleClasses(titleId: string) {
    this.titleClasses = [];
    this.classSelection.setValue(null);
    if (titleId) {
      this.subs.sink = this.rncpTitleService
        .getClassByRncpTitle(titleId)
        .pipe(map((resp) => resp.map(({ _id, name }) => ({ _id, name }))))
        .subscribe((resp) => {
          if (resp && resp.length) this.titleClasses = [...resp];
        });
    }
  }

  selectedTitle() {
    this.userReady = false;

    const titleSelected = this.titleSelection.value && this.titleSelection.value._id ? this.titleSelection.value._id : null;
    this.getTitleClasses(titleSelected);
    this.urgentMessageForm.get('originalRncpTitle').setValue(titleSelected);
    this.urgentMessageForm.get('rncpTitle').setValue(titleSelected);
    if (!this.urgentMessageForm.get('categoryChecked').value) {
      this.getUserList(titleSelected);
    } else {
      const selectedUserType = this.urgentMessageForm.get('originalUserTypes').value;
      if (selectedUserType === '5a067bba1c0217218c75f8ab') {
        this.userService.getUserTypeStudent(titleSelected, selectedUserType).subscribe((resp) => {
          this.userRecipientList = resp;
        });
      } else {
        this.userService.getUserType(titleSelected, selectedUserType).subscribe((resp) => {
          this.userRecipientList = resp;
        });
      }
    }
  }
  selectedUser(selectedUser) {
    this.userReady = false;

    this.urgentMessageForm.get('originalUser').setValue(selectedUser._id);
    this.urgentMessageForm.get('email').setValue(selectedUser.email);
  }
  selectedUserType(selectedUserType) {
    this.userReady = false;

    this.urgentMessageForm.get('originalUserTypes').setValue(selectedUserType);
    const data = this.urgentMessageForm.get('originalRncpTitle').value;
    // if selected user type is student, call API getUserTypeStudent
    if (selectedUserType === '5a067bba1c0217218c75f8ab') {
      this.userService.getUserTypeStudent(data, selectedUserType).subscribe((resp) => {
        this.userRecipientList = resp;
      });
    } else {
      this.userService.getUserType(data, selectedUserType).subscribe((resp) => {
        this.userRecipientList = resp;
      });
    }
    this.selectedTitleId = this.urgentMessageForm.get('rncpTitle').value;
    this.selectedUserTypeId = [selectedUserType];
  }

  initializeForm() {
    this.urgentMessageForm = this.fb.group({
      rncpTitle: [[], Validators.required],
      originalRncpTitle: [''],
      titles: this.fb.array([], [Validators.required]),
      subject: ['', Validators.required],
      categoryChecked: [false, Validators.required],
      users: [[], Validators.required],
      originalUser: [''],
      userTypes: [[]],
      originalUserTypes: [''],
      message: ['', Validators.required],
      email: [''],
    });
  }

  createTitleForm() {
    return this.fb.group({
      title_id: [null, [Validators.required]],
      class_ids: [[], [Validators.minLength(1)]],
    });
  }

  addSelection() {
    const group = this.createTitleForm();
    const titleName = this.titleSelection.value.short_name;
    const classNames = this.classSelection.value.map(({ name }) => name || null).join(', ');
    const text = `${titleName} - ${classNames}`;
    group.patchValue({
      title_id: this.titleSelection.value._id,
      class_ids: this.classSelection.value.map(({ _id }) => _id || null),
    });
    this.titleFormArray.push(group);
    this.selectionTextList.push(text);
    this.titleSelection.setValue(null);
    this.classSelection.setValue(null);
    this.titleReady = true;
  }

  removeSelectionAt(idx: number) {
    this.titleFormArray.removeAt(idx);
    this.selectionTextList.splice(idx, 1);
  }

  sendMessage(): void {
    const formValues = this.urgentMessageForm.value;
    if (formValues.subject !== '' || (formValues.message !== '' && formValues.message !== undefined)) {
      this.isWaitingForResponse = true;
      const receiversArray = [];
      this.mailData = {};
      const recipient = this.userRecipientList;
      // let senderArray = {
      //   sender: this.currentUser.email,
      //   is_read: false,
      //   mail_type: 'sent',
      // };
      if (formValues.categoryChecked) {
        recipient.forEach((element) => {
          receiversArray.push({ recipients: element.email, rank: 'a', is_read: false, mail_type: 'inbox' });
        });
      } else {
        receiversArray.push({ recipients: formValues.email, rank: 'a', is_read: false, mail_type: 'inbox' });
      }
      const MailAttachment = [];
      const MailAttachment1 = [];

      if (this.selectedUserTypeId && this.selectedUserTypeId.length) {
        this.mailData.user_type_selection = true;
        this.mailData.group_detail = {
          title_classes: formValues.titles,
          user_types: this.selectedUserTypeId,
        };
      }
      this.mailData.sender_property = {
        sender: this.currentUser.email,
        is_read: false,
        mail_type: 'sent',
      };
      this.mailData.recipient_properties = receiversArray;
      this.mailData.subject = formValues.subject;
      this.mailData.message = formValues.message;
      this.mailData.is_sent = true;
      this.mailData.status = 'active';
      this.mailData.is_urgent_mail = true;
      // this.mailData.is_urgent_mail = this.isUrgentFlag;
      this.mailData.tags = ['sent'];

      this.subs.sink = this.mailboxService.createMail(this.mailData).subscribe(
        (data: any) => {
          this.isWaitingForResponse = false;
          this.dialogRef.close();
          Swal.fire({
            title: this.translate.instant('URGENTMESSAGE_S1.TITLE'),
            html: this.translate.instant('URGENTMESSAGE_S1.TEXT'),
            footer: `<span style="margin-left: auto">URGENTMESSAGE_S1</span>`,
            allowEscapeKey: true,
            type: 'success',
            confirmButtonText: this.translate.instant('URGENTMESSAGE_S1.BUTTON'),
          });
        },
        (error) => {
          this.dialogRef.close();
        },
      );
    }
  }

  categoryChange(event) {
    // event.checked ? this.urgentMessageForm.controls['users'].setValue('') : this.urgentMessageForm.controls['userTypes'].setValue('');
    if (event.checked) {

      this.urgentMessageForm.get('users').patchValue(null);
      this.urgentMessageForm.get('users').updateValueAndValidity();
      this.urgentMessageForm.get('users').clearValidators();
      this.urgentMessageForm.get('users').updateValueAndValidity();
      this.urgentMessageForm.get('userTypes').setValidators([Validators.required]);
      this.urgentMessageForm.get('userTypes').updateValueAndValidity();
    } else {

      this.urgentMessageForm.get('userTypes').patchValue(null);
      this.urgentMessageForm.get('userTypes').updateValueAndValidity();
      this.urgentMessageForm.get('userTypes').clearValidators();
      this.urgentMessageForm.get('userTypes').updateValueAndValidity();
      this.urgentMessageForm.get('users').setValidators([Validators.required]);
      this.urgentMessageForm.get('users').updateValueAndValidity();
    }

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

  valueChange(event) {
    if (event === 'title') {
      this.titleReady = false;
    } else if (event === 'user') {
      this.userReady = false;
    } else if (event === 'type') {
      this.userTypeReady = false;
    }

  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
