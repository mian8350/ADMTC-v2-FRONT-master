import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { StudentsService } from 'app/service/students/students.service';
import { UserService } from 'app/service/user/user.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

interface InformInput {
  isFromUserTable: boolean;
  studentId?: string;
  schoolId?: string;
  rncpId?: string;
  lang?: string;
  // below are users
  userId?: string;
  civility?: string;
  firstName?: string;
  lastName?: string;
}

@Component({
  selector: 'ms-incorrect-users-email-dialog',
  templateUrl: './incorrect-users-email-dialog.component.html',
  styleUrls: ['./incorrect-users-email-dialog.component.scss'],
})
export class IncorrectUsersEmailDialogComponent implements OnInit {
  public userInform: UntypedFormGroup;
  isWaitingForResponse = false;
  private subs = new SubSink();

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: InformInput,
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<IncorrectUsersEmailDialogComponent>,
    private translate: TranslateService,
    public utilService: UtilityService,
    private userService: UserService,
    private studentService: StudentsService,
  ) {}

  ngOnInit() {
    this.initForm();

  }

  initForm() {
    this.userInform = this.fb.group({
      reason_inform: [null, Validators.required],
    });
  }

  sendInform() {
    this.data.isFromUserTable ? this.sendUserIncorrectEmail() : this.sendStudentIncorrectEmail();
  }

  // mutation to call if opened from student table
  sendStudentIncorrectEmail() {
    this.studentService
      .RequestStudentEmailChange(this.data.studentId, this.data.rncpId, this.data.schoolId, this.userInform.get('reason_inform').value)
      .subscribe((resp) => {
        if (resp) {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('SUCCESS'),
            allowEscapeKey: true,
            allowOutsideClick: false,
            confirmButtonText: 'OK',
          }).then((res) => {
            this.closeDialog(res);
          });
        }
      });
  }

  // mutation to call if opened from user table
  sendUserIncorrectEmail() {
    const userId = this.data.userId;
    const reason = this.userInform.get('reason_inform').value;

    if (this.userInform.valid) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.userService.inactiveEmail(this.translate.currentLang, userId, reason).subscribe((res) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'success',
          title: 'Bravo!',
          allowOutsideClick: false,
          confirmButtonText: this.translate.instant('OK'),
        }).then(() => {
          this.closeDialog();
        });
      });
    }
  }

  closeDialog(resp?) {
    this.dialogRef.close(resp);
  }
}
