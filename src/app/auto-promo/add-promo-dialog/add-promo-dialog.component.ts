import { Component, OnInit, Inject, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js'
import { SubSink } from 'subsink';
import { AuthService } from 'app/service/auth-service/auth.service';
import { UserService } from 'app/service/user/user.service';
import { UtilityService } from 'app/service/utility/utility.service';
import Swal from 'sweetalert2';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import * as _ from 'lodash';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from 'environments/environment';
import { PromoService } from 'app/service/promo/promo.service';

@Component({
  selector: 'ms-add-promo-dialog',
  templateUrl: './add-promo-dialog.component.html',
  styleUrls: ['./add-promo-dialog.component.scss'],
})
export class AddPromoDialogComponent implements OnInit, OnDestroy {
  public Editor = DecoupledEditor;
  translatePipe: TranslatePipe;
  private subs = new SubSink();
  public config = {
    placeholder: this.translate.instant('promosi.title'),
  };
  public config1 = {
    placeholder: this.translate.instant('promosi.sub title'),
  };
  public config2 = {
    placeholder: this.translate.instant('promosi.description'),
  };
  form: UntypedFormGroup;
  modifyPromo = false;
  isTitleLogoUploading = false;
  @ViewChild('fileUploadDoc', { static: false }) fileUploaderDoc: ElementRef;

  constructor(
    public dialogRef: MatDialogRef<AddPromoDialogComponent>,
    private tutorialService: TutorialService,
    private fb: UntypedFormBuilder,
    public translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private authService: AuthService,
    private userService: UserService,
    private utilService: UtilityService,
    private fileUploadService: FileUploadService,
    private _ref: ChangeDetectorRef,
    private sanitizer: DomSanitizer,
    private promoService: PromoService,
  ) {}

  ngOnInit() {
    this.translatePipe = new TranslatePipe(this.translate, this._ref);
    this.initTutorialForm();

    if (this.data) {
      this.modifyPromo = true;
      this.getform();
    }
  }

  getform() {
    const type = {
      description: this.data.description,
      title: this.data.title,
      ref: this.data.ref,
      sub_title: this.data.sub_title,
      image_url: this.data.image_url,
      for_login_page: this.data.for_login_page,
      for_set_password_page: this.data.for_set_password_page,
      for_forgot_password_page: this.data.for_forgot_password_page,
    };
    this.form.patchValue(type);

  }

  initTutorialForm() {
    this.form = this.fb.group({
      ref: [null, Validators.required],
      title: [null, Validators.required],
      sub_title: [null, Validators.required],
      description: [null, Validators.required],
      for_login_page: [false],
      for_set_password_page: [false],
      for_forgot_password_page: [false],
      image_url: [null],
    });
  }

  downloadFile(fileUrl: string) {
    window.open(fileUrl, '_blank');
  }

  imgURL(src: string) {
    return this.sanitizer.bypassSecurityTrustUrl(src);
  }

  openUploadWindow() {
    this.fileUploaderDoc.nativeElement.click();
  }

  chooseFile(fileUpload: HTMLInputElement) {
    fileUpload.onchange = () => {
      const file = fileUpload.files[0];
      this.isTitleLogoUploading = true;
      if (file && (file.type === 'image/png' || file.type === 'image/jpeg' || file.type === 'image/gif')) {
        const reader = new FileReader();
        reader.onload = () => {
          this.form.patchValue({
            image_url: reader.result,
          });
        };
        reader.readAsDataURL(file);
      }
      this.fileUploadService.singleUpload(file).subscribe((res) => {
        this.isTitleLogoUploading = false;
        const url = `${environment.apiUrl}/fileuploads/${res.s3_file_name}`.replace('/graphql', '')
        this.form.get('image_url').setValue(url);
      });
    };
    fileUpload.click();
  }

  submitPromosi() {

    if (this.data) {
      this.subs.sink = this.promoService.updatePromo(this.data._id, this.form.value).subscribe((resp) => {
        Swal.fire({
          type: 'success',
          title: 'Bravo !',
          // title: this.translate.instant('TUTORIAL_UPDATE.TITLE'),
          // text: this.translate.instant('TUTORIAL_UPDATE.TEXT', {title: this.data.title}),
          confirmButtonText: this.translate.instant('TUTORIAL_UPDATE.BUTTON'),
        });
        this.dialogRef.close();
      });
    } else {
      this.subs.sink = this.promoService.createPromo(this.form.value).subscribe((resp) => {
        Swal.fire({
          type: 'success',
          title: 'Bravo !',
          // title: this.translate.instant('TUTORIAL_SAVE.TITLE'),
          // text: this.translate.instant('TUTORIAL_SAVE.TEXT'),
          confirmButtonText: this.translate.instant('TUTORIAL_SAVE.BUTTON'),
        });
        this.dialogRef.close();
      });
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }
}
