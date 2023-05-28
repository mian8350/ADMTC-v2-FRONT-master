import { environment } from 'environments/environment';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ChangeDetectorRef, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { FormArray, UntypedFormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AuthService } from 'app/service/auth-service/auth.service';
import { CustomValidators } from 'ng2-validation';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { Router } from '@angular/router';
import { UserService } from 'app/service/user/user.service';
import { TranslateService } from '@ngx-translate/core';
import { CoreService } from 'app/service/core/core.service';

@Component({
  selector: 'ms-add-user-dialog',
  templateUrl: './add-user-dialog.component.html',
  styleUrls: ['./add-user-dialog.component.scss'],
})
export class AddUserDialogComponent implements OnInit {
  @ViewChild('mobileNumber', { static: false }) mobileNumberInput;
  private subs = new SubSink();
  addNewUserForm: UntypedFormGroup;

  isWaitingForResponse = false;
  currentUser: any;
  isAlreadyRegistered = true;
  emailStatus: string = null;
  isVerifyingEmail: boolean;
  @ViewChild('fileUploadDoc', { static: false }) fileUploaderDoc: ElementRef;

  constructor(
    @Inject(MAT_DIALOG_DATA) public parentData: any,
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<AddUserDialogComponent>,
    private authService: AuthService,
    private router: Router,
    private userService: UserService,
    private translate: TranslateService,
    public coreService: CoreService,
    private utilService: UtilityService,
    private fileUploadService: FileUploadService,
  ) { }

  ngOnInit() {

    this.currentUser = this.authService.getLocalStorageUser();
    this.initForm();
  }

  initForm() {
    this.addNewUserForm = this.fb.group({
      civility: ['MR', [Validators.required]],
      email: ['', [CustomValidators.email, Validators.required]],
      first_name: ['', [Validators.required]],
      last_name: ['', [Validators.required]],
      office_phone: ['', [Validators.maxLength(11), CustomValidators.number]],
      portable_phone: ['', [CustomValidators.number]],
      position: [null],
      direct_line: ['', [CustomValidators.number]],
      curriculum_vitae: this.fb.group({
        s3_path: [''],
        file_path: [''],
        name: [''],
      }),
    });
  }

  openUploadWindow() {
    this.fileUploaderDoc.nativeElement.click();
  }

  chooseFile(fileInput: Event) {
    const acceptable = ['pdf'];
    if ((<HTMLInputElement>fileInput.target).files.length > 0) {
      const file = (<HTMLInputElement>fileInput.target).files[0];
      const fileType = this.utilService.getFileExtension(file.name).toLocaleLowerCase();
      if (acceptable.includes(fileType)) {
        this.subs.sink = this.fileUploadService.singleUpload(file).subscribe(
          (resp) => {
            if (resp) {
              this.addNewUserForm.get('curriculum_vitae').get('s3_path').setValue(resp.s3_file_name);
              this.addNewUserForm.get('curriculum_vitae').get('file_path').setValue(resp.file_url);
            }
          },
          (err) => {
            Swal.fire({
              type: 'error',
              title: 'Error !',
              confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
            }).then((res) => {

            });
          },
        );
      } else {
        Swal.fire({
          type: 'error',
          title: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TITLE'),
          text: this.translate.instant('UPLOAD_ERROR.WRONG_TYPE_TEXT', { file_exts: '.pdf' }),
          allowEscapeKey: false,
          allowOutsideClick: false,
          allowEnterKey: false,
        });
      }
    }
  }

  downloadCV() {
    const fileUrl = this.addNewUserForm.get('curriculum_vitae').get('s3_path').value;
    const a = document.createElement('a');
    a.target = 'blank';
    a.href = `${environment.apiUrl}/fileuploads/${fileUrl}?download=true`.replace('/graphql', '');
    a.click();
    a.remove();
  }

  editCV() {
    this.addNewUserForm.get('curriculum_vitae').get('s3_path').setValue('');
    this.addNewUserForm.get('curriculum_vitae').get('file_path').setValue('');
  }

  deleteCV() {
    this.addNewUserForm.get('curriculum_vitae').get('s3_path').setValue('');
    this.addNewUserForm.get('curriculum_vitae').get('file_path').setValue('');
    this.addNewUserForm.get('curriculum_vitae').get('name').setValue('');
  }

  verifyEmail() {
    this.isVerifyingEmail = true;
    this.subs.sink = this.userService.checkActiveEmail(this.addNewUserForm.get('email').value).subscribe(
      (resp) => {

        this.emailStatus = 'valid';
        if (resp) {
          this.isVerifyingEmail = false;
          Swal.fire({
            type: 'warning',
            title: this.translate.instant('SWAL_USER_EXIST.TITLE'),
            text: this.translate.instant('SWAL_USER_EXIST.TEXT'),
            confirmButtonText: this.translate.instant('SWAL_USER_EXIST.BUTTON_1'),
            showCancelButton: true,
            cancelButtonText: this.translate.instant('SWAL_USER_EXIST.BUTTON_2'),
          }).then((action) => {
            if (action.value) {
              this.router.navigate(['/users/user-management-detail'], { queryParams: { userId: resp._id, isFromActiveUserTab:true } });
            }
            this.dialogRef.close();
          });
          return;
        } else {
          this.isAlreadyRegistered = false;
          this.isVerifyingEmail = false;
        }
      },
      (error) => {
        this.isVerifyingEmail = false;

        if (error['message'].includes('GraphQL error: email is not valid')) {
          this.emailStatus = 'not_valid';
          Swal.fire({
            type: 'warning',
            title: this.translate.instant('usermailvalidation_S1.TITLE'),
            html: this.translate.instant('usermailvalidation_S1.Text'),
            confirmButtonText: this.translate.instant('usermailvalidation_S1.BUTTON 1'),
          }).then(() => {
            this.checkUserRegistered();
          });
        } else {
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: error && error['message'] ? error['message'] : error,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          });
        }
        return;
      }
    )
  }

  checkUserRegistered() {
    this.isVerifyingEmail = true;
    this.subs.sink = this.userService.getOneUser(this.addNewUserForm.get('email').value).subscribe(
      (resp) => {

        if (resp) {
          this.isVerifyingEmail = false;
          Swal.fire({
            type: 'warning',
            title: this.translate.instant('SWAL_USER_EXIST.TITLE'),
            text: this.translate.instant('SWAL_USER_EXIST.TEXT'),
            confirmButtonText: this.translate.instant('SWAL_USER_EXIST.BUTTON_1'),
            showCancelButton: true,
            cancelButtonText: this.translate.instant('SWAL_USER_EXIST.BUTTON_2'),
          }).then((action) => {
            if (action.value) {
              this.router.navigate(['/users/user-management-detail'], { queryParams: { userId: resp._id, isFromActiveUserTab:true } });
            }
            this.dialogRef.close();
          });
          return;
        } else {
          this.isAlreadyRegistered = false;
          this.isVerifyingEmail = false;
        }
      },
      (error) => {
        this.isVerifyingEmail = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: error && error['message'] ? error['message'] : error,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
        return;
      }
    )
  }

  checkFormValidity(): boolean {
    if (this.addNewUserForm.invalid) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Invalid_Form_Warning.TITLE'),
        html: this.translate.instant('Invalid_Form_Warning.TEXT'),
        confirmButtonText: this.translate.instant('Invalid_Form_Warning.BUTTON'),
      });
      this.addNewUserForm.markAllAsTouched();
      return true;
    } else {
      return false;
    }
  }

  submit() {
    if (this.checkFormValidity()) {
      return;
    }
    this.isWaitingForResponse = true;
    const payload = _.cloneDeep(this.addNewUserForm.value);
    this.createUser(payload);
  }

  createUser(payload) {
    this.subs.sink = this.userService.registerUser(payload).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'success',
          title: this.translate.instant('Bravo!'),
          confirmButtonText: this.translate.instant('OK'),
          allowEnterKey: false,
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then(() => {
          this.router.navigate(['/users/user-management-detail'], { queryParams: { userId:resp._id, isFromActiveUserTab:true } });
          this.dialogRef.close(resp);
        });
      },
      (error) => {
        this.isWaitingForResponse = false;

        if (error.message && error.message === 'GraphQL error: Phone Number Exist') {
          Swal.fire({
            type: 'warning',
            title: this.translate.instant('SWAL_PHONE_EXIST.TITLE'),
            text: this.translate.instant('SWAL_PHONE_EXIST.TEXT'),
            confirmButtonText: this.translate.instant('SWAL_PHONE_EXIST.BUTTON_1'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then((action) => {
            if (action.value) {
              (this.mobileNumberInput.nativeElement as HTMLInputElement).focus();
              return;
            }
          });
        }
        if (error.message && error.message === 'GraphQL error: user was already created but the status is deleted') {
          this.isWaitingForResponse = true;
          this.subs.sink = this.userService.registerUserExisting(payload).subscribe(
            (resp) => {
              this.isWaitingForResponse = false;
              Swal.fire({
                type: 'success',
                title: this.translate.instant('Bravo!'),
                confirmButtonText: this.translate.instant('OK'),
                allowEnterKey: false,
                allowEscapeKey: false,
                allowOutsideClick: false,
              }).then(() => {
                this.dialogRef.close(resp);
              });
            },
            (error) => {
              this.isWaitingForResponse = false;
              this.swalEmailInvalid(error);
              return;
            },
          );
        }
        if (error['message'].includes('GraphQL error: this email is not valid')) {
          this.swalEmailInvalid(error);
        }
        if (error['message'].includes('Email Exist')) {
          const dataText = { 
            civility: payload && payload.civility ? payload.civility : '',
            firstName: payload && payload.first_name ? payload.first_name : '',
            lastName: payload && payload.last_name ? payload.last_name : '',
          };
          const user = error['message'].replace('GraphQL error: Email Exist ', '');
          Swal.fire({
            type: 'warning',
            title: this.translate.instant('USERCREATE_S2.TITLE'),
            html: this.translate.instant('USERCREATE_S2.TEXT', dataText),
            confirmButtonText: this.translate.instant('USERCREATE_S2.BUTTON 1'),
            cancelButtonText: this.translate.instant('USERCREATE_S2.BUTTON 2'),
            showCancelButton: true,
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then((action) => {
            if (action.value) {
              this.router.navigate(['/users/user-management-detail'], { queryParams: { userId: user, isFromActiveUserTab:true } });
              this.dialogRef.close(true);
            }
            return;
          });
        }
      },
    );
  }

  swalEmailInvalid(error) {
    if (error['message'].includes('GraphQL error: this email is not valid')) {
      const user = error['message'].replace('GraphQL error: this email is not valid ', '');

      this.emailStatus = 'not_valid';
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('usermailvalidation_S1.TITLE'),
        html: this.translate.instant('usermailvalidation_S1.Text'),
        confirmButtonText: this.translate.instant('usermailvalidation_S1.BUTTON 1'),
      }).then(() => {
        this.router.navigate(['/users/user-management-detail'], { queryParams: { userId:user, isFromActiveUserTab:true } });
        this.dialogRef.close(true);
      });
    } else {
      Swal.fire({
        type: 'error',
        title: 'Error',
        text: error && error['message'] ? error['message'] : error,
        confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
      });
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
