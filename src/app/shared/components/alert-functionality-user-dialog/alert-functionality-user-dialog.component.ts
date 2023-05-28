import { AlertService } from './../../../service/alert-functionality/alert-functionality.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { ParseUtcToLocalPipe } from './../../pipes/parse-utc-to-local.pipe';
import { SubSink } from 'subsink';
import { UntypedFormGroup, UntypedFormBuilder, UntypedFormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { Component, OnInit, Inject  } from '@angular/core';
import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import Swal from 'sweetalert2';
import * as moment from 'moment';

@Component({
  selector: 'ms-alert-functionality-user-dialog',
  templateUrl: './alert-functionality-user-dialog.component.html',
  styleUrls: ['./alert-functionality-user-dialog.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class AlertFunctionalityUserDialogComponent implements OnInit {
  replyForm = new UntypedFormControl('');
  isWaitingForResponse = false;
  alertForm: UntypedFormGroup;
  currentUser;
  private subs = new SubSink();
  public Editor = DecoupledEditor;

  constructor(
    public dialogRef: MatDialogRef<AlertFunctionalityUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: any,
    public translate: TranslateService,
    private fb: UntypedFormBuilder,
    public dialog: MatDialog,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private authService: AuthService,
    private alertService: AlertService,
  ) {}

  ngOnInit() {

    this.currentUser = this.authService.getCurrentUser();

    this.initForm();
    this.authService.isLoggedIn$.subscribe((resp) => {
      if (resp === false) {
        this.dialogRef.close();
      }

    });
  }
  initForm() {
    this.alertForm = this.fb.group({
      user_id: this.currentUser && this.currentUser._id ? this.currentUser._id : null,
      response: [''],
    });
  }
  transformDate(date) {
    moment.locale(this.translate.currentLang);
    if (date && date.date && date.time) {
      const local = this.parseUTCToLocalPipe.transformDate(date.date, date.time);
      if (local && local !== 'Invalid date') {
        return moment(local, 'DD/MM/YYYY').format('dddd,MMMM DD, YYYY');
      } else {
        return '';
      }
    } else {
      return '';
    }
  }
  onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }
  createPayload() {
    const payload = this.alertForm.value;
    return payload;
  }
  setResponse(button) {
    this.alertForm.get('response').setValue(button);

    this.submit();
  }
  onReply() {
    if (this.alertForm.invalid) {
      this.swalInvalid();

      return;
    }
    this.submit();
  }
  submit() {
    this.isWaitingForResponse = true;
    const id = this.parentData && this.parentData._id ? this.parentData._id : null;
    const payload = this.createPayload();
    this.subs.sink = this.alertService.giveResponseToAlertFunctionality(id, payload).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp) {
        Swal.fire({
          type: 'success',
          title: this.translate.instant('Bravo !'),
          allowOutsideClick: false,
          confirmButtonText: this.translate.instant('OK'),
        }).then((response) => {
          this.dialogRef.close();
        });
      }
    });
  }
  swalInvalid() {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('FormSave_S1.TITLE'),
      html: this.translate.instant('FormSave_S1.TEXT'),
      confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
      allowEnterKey: false,
      allowEscapeKey: false,
      allowOutsideClick: false,
    });
    this.alertForm.markAllAsTouched();
  }
}
