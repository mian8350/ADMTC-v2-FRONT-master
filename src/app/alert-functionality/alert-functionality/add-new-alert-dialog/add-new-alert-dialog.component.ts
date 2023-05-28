import { AuthService } from './../../../service/auth-service/auth.service';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { cloneDeep, uniqBy } from 'lodash';
import { SubSink } from 'subsink';
import { AlertService } from './../../../service/alert-functionality/alert-functionality.service';
import { UntypedFormControl, UntypedFormGroup, UntypedFormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import * as moment from 'moment';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
@Component({
  selector: 'ms-add-new-alert-dialog',
  templateUrl: './add-new-alert-dialog.component.html',
  styleUrls: ['./add-new-alert-dialog.component.scss'],
  providers: [ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class AddNewAlertDialogComponent implements OnInit, OnDestroy {
  public Editor = DecoupledEditor;
  public config = {};
  private subs = new SubSink();

  button1 = new UntypedFormControl('');
  button2 = new UntypedFormControl('');
  alertForm: UntypedFormGroup;
  type;
  data;
  userTypeDropdown = [];
  isWaitingForResponse = false;
  currentUser;
  isPublished = false;
  timeOutVal;
  isPermission;

  constructor(
    @Inject(MAT_DIALOG_DATA) public parentData: any,
    public dialogRef: MatDialogRef<AddNewAlertDialogComponent>,
    private fb: UntypedFormBuilder,
    private alertService: AlertService,
    private translate: TranslateService,
    private authService: AuthService,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
  ) {}

  ngOnInit() {
    this.isPublished = false;
    this.currentUser = this.authService.getCurrentUser();

    this.isPermission = this.authService.getPermission();
    this.initForm();
    if (this.currentUser) {
      this.sendSignature();
    }
    if (this.parentData && this.parentData.type) {
      this.type = this.parentData.type;

      if ((this.parentData.type === 'edit' || this.parentData.type === 'duplicate') && this.parentData.alertData) {
        this.data = this.parentData.alertData;
        this.getEditData();
      }
    }
    this.getUserType();
    this.setRequired();
  }

  getEditData() {
    if (this.data) {
      const tempData = cloneDeep(this.data);
      if (this.data.recipients && this.data.recipients.length) {
        const category = [];
        this.data.recipients.forEach((user) => {
          category.push(user._id);
        });
        tempData['recipients'] = category;
      }
      if (this.type === 'duplicate') {
        tempData.name = null;
        this.type = 'create';
      }

      this.alertForm.patchValue(tempData);

    }
  }

  initForm() {
    this.alertForm = this.fb.group({
      name: ['', [Validators.required]],
      recipients: [[], [Validators.required]],
      required_response: [false],
      message: ['', [Validators.required]],
      button1: [],
      button2: [],
      creator: [this.currentUser ? this.currentUser._id : null, [Validators.required]],
    });
  }
  sendSignature() {
    let composeMailMessage =
      ' <br>' +
      this.translate.instant(this.currentUser.civility) +
      ' ' +
      this.currentUser.first_name +
      ' ' +
      this.currentUser.last_name +
      ' <br>';
    if (this.currentUser.position) {
      composeMailMessage += this.currentUser.position;
    } else if (this.isPermission && this.isPermission.length && this.isPermission[0] && this.isPermission[0]) {
      composeMailMessage += this.translate.instant('USER_TYPES.' + this.isPermission[0]);

    }
    composeMailMessage += this.alertForm.get('message').value;

    this.alertForm.get('message').patchValue(composeMailMessage);
  }

  getUserType() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.alertService.getAlertUserTypes().subscribe(
      (resp) => {
        if (resp) {
          const temp = cloneDeep(resp);
          this.userTypeDropdown = temp
            .map((type) => {
              return { _id: type._id, name: this.translate.instant('USER_TYPES.' + type.name) };
            })
            .sort((a: any, b: any) => (a.name > b.name ? 1 : a.name < b.name ? -1 : 0));

        }
        this.isWaitingForResponse = false;
      },
      (err) => {
        this.isWaitingForResponse = false;

      },
    );
  }

  onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }
  setRequired() {
    if (this.alertForm.get('required_response').value === false) {
      this.alertForm.get('button1').setValidators([Validators.required]);
      this.alertForm.get('button2').setValidators([Validators.required]);
      this.alertForm.get('button1').updateValueAndValidity();
      this.alertForm.get('button2').updateValueAndValidity();
    } else {
      this.alertForm.get('button1').clearValidators();
      this.alertForm.get('button2').clearValidators();
      this.alertForm.get('button1').updateValueAndValidity();
      this.alertForm.get('button2').updateValueAndValidity();
    }
  }

  save() {
    if (this.alertForm.invalid) {
      this.swalInvalid();
      return;
    }
    if (this.type === 'create') {
      this.create();
    } else if (this.type === 'edit') {
      this.update();
    }
  }
  swalInvalid() {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('FormSave_S1.TITLE'),
      html: this.translate.instant('FormSave_S1.TEXT'),
      confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
      footer: `<span style="margin-left: auto">FormSave_S1</span>`,
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    });
    this.alertForm.markAllAsTouched();
  }

  createPayload() {
    const payload = this.alertForm.value;

    // payload.recipients = payload.category;
    // delete payload.category;
    payload.creator = this.currentUser._id;

    // Set button 1 and 2 as null if required response is true so we use messages
    if (payload.required_response) {
      payload.button1 = null;
      payload.button2 = null;
    }

    if (this.isPublished) {
      payload.published = true;
    }

    // Set published_date as today when we save/publish
    payload.published_date = {
      date: this.getTodayDate(),
      time: this.getTodayTime(),
    };

    return payload;
  }

  create() {
    const payload = this.createPayload();

    const usertype = this.alertForm.get('recipients').value;

    let currUserType = [];
    if (this.userTypeDropdown && this.userTypeDropdown.length && usertype && usertype.length) {
      this.userTypeDropdown.forEach((user) => {
        usertype.forEach((type) => {
          if (user._id === type) {
            currUserType.push(user.name);
          }
        });
      });

    }
    this.isWaitingForResponse = true;
    this.subs.sink = this.alertService.createAlertFunctionality(payload).subscribe(
      (resp) => {
        if (resp) {

          if (!this.isPublished) {
            Swal.fire({
              type: 'info',
              title: this.translate.instant('ALERT_S1.TITLE'),
              html: this.translate.instant('ALERT_S1.TEXT'),
              allowOutsideClick: false,
              footer: `<span style="margin-left: auto">ALERT_S1</span>`,
              confirmButtonText: this.translate.instant('ALERT_S1.BUTTON'),
            }).then((response) => {
              this.close(true);
            });
          } else {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('ALERT_S3.TITLE'),
              html: this.translate.instant('ALERT_S3.TEXT', {
                category: currUserType.join(','),
              }),
              allowOutsideClick: false,
              footer: `<span style="margin-left: auto">ALERT_S3</span>`,
              confirmButtonText: this.translate.instant('ALERT_S3.BUTTON'),
            }).then((respon) => {
              this.close(true);
            });
          }
        }
        this.isWaitingForResponse = false;
      },
      (err) => {
        this.isWaitingForResponse = false;

        if (err && err['message'] && err['message'].includes('Alert Name Already Exist')) {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('ALERT_S9.TITLE'),
            html: this.translate.instant('ALERT_S9.TEXT'),
            allowOutsideClick: false,
            footer: `<span style="margin-left: auto">ALERT_S9</span>`,
            confirmButtonText: this.translate.instant('ALERT_S9.BUTTON'),
          });
        }
      },
    );
  }

  update() {
    const payload = this.createPayload();

    const usertype = this.alertForm.get('recipients').value;

    let currUserType = [];
    if (this.userTypeDropdown && this.userTypeDropdown.length && usertype && usertype.length) {
      this.userTypeDropdown.forEach((user) => {
        usertype.forEach((type) => {
          if (user._id === type) {
            currUserType.push(user.name);
          }
        });
      });

    }
    this.isWaitingForResponse = true;
    this.subs.sink = this.alertService.updateAlertFunctionality(this.data._id, payload).subscribe((resp) => {
      if (resp) {
        if (this.isPublished) {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('ALERT_S3.TITLE'),
            html: this.translate.instant('ALERT_S3.TEXT', {
              category: currUserType.join(','),
            }),
            allowOutsideClick: false,
            confirmButtonText: this.translate.instant('ALERT_S3.BUTTON'),
          }).then((respon) => {
            this.close(true);
          });
        } else {
          // Swal.fire({
          //   type: 'success',
          //   title: this.translate.instant('Bravo !'),
          //   allowOutsideClick: false,
          //   confirmButtonText: this.translate.instant('OK'),
          // }).then((response) => {
          //   this.close(true);
          // });
          Swal.fire({
            type: 'info',
            title: this.translate.instant('ALERT_S1.TITLE'),
            html: this.translate.instant('ALERT_S1.TEXT'),
            allowOutsideClick: false,
            footer: `<span style="margin-left: auto">ALERT_S1</span>`,
            confirmButtonText: this.translate.instant('ALERT_S1.BUTTON'),
          }).then((response) => {
            this.close(true);
          });
        }
      }
      this.isWaitingForResponse = false;
    });
  }

  publish() {
    this.isPublished = true;
    let timeDisabled = 3;
    Swal.fire({
      title: this.translate.instant('ALERT_S2.TITLE'),
      html: this.translate.instant('ALERT_S2.TEXT', {
        name: this.alertForm.get('name').value,
      }),
      type: 'question',
      allowEscapeKey: true,
      showCancelButton: true,
      footer: `<span style="margin-left: auto">ALERT_S2</span>`,
      confirmButtonText: this.translate.instant('ALERT_S2.BUTTON1', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('ALERT_S2.BUTTON2'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('ALERT_S2.BUTTON1') + ` (${timeDisabled})`;
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('ALERT_S2.BUTTON1');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((response) => {
      clearTimeout(this.timeOutVal);

      if (response.value) {
        this.save();
      } else {
        this.close();
      }
    });
  }

  getTodayTime() {
    return this.parseLocalToUTCPipe.transform(this.parseUTCToLocalPipe.transform('15:59'));
  }

  getTodayDate() {
    const today = moment().format('DD/MM/YYYY');
    return this.parseLocalToUTCPipe.transformDate(today, this.parseUTCToLocalPipe.transform('15:59'));
  }

  close(isNeedRefresh = false) {
    this.dialogRef.close(isNeedRefresh);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
