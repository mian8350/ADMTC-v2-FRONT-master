import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js'
import { UserService } from 'app/service/user/user.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SubSink } from 'subsink';
import { debounceTime } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
import * as _ from 'lodash';
import { NgxPermissionsService } from 'ngx-permissions';
import { UtilityService } from 'app/service/utility/utility.service';

@Component({
  selector: 'ms-forward-tutorial-dialog',
  templateUrl: './forward-tutorial-dialog.component.html',
  styleUrls: ['./forward-tutorial-dialog.component.scss'],
})
export class ForwardTutorialDialogComponent implements OnInit {
  forwardTutorialForm: UntypedFormGroup;
  private subs = new SubSink();
  public Editor = DecoupledEditor;
  public config = {
    //  placeholder: this.translate.instant('')
  };
  userTypes = [];
  userList = [];
  rncpTitles = [];
  schools = [];
  currentUser: any;
  userTypesList: any;
  userRecipientList: any;
  rncpTitlesList: any;
  originalUserTypesList: any;
  originalUserList: any;
  originalRncpTitlesList: any;
  isWaitingForResponse = false;
  titleReady = false;
  userReady = false;
  userTypeReady = false;
  selectedTitleId: string[] = [];
  selectedUserTypeId: string[] = [];

  isUserAcadDir = false;
  isUserAcadAdmin = false;

  constructor(
    public dialogRef: MatDialogRef<ForwardTutorialDialogComponent>,
    private fb: UntypedFormBuilder,
    public translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private userService: UserService,
    private autService: AuthService,
    private rncpTitleService: RNCPTitlesService,
    private tutorialService: TutorialService,
    private utilService: UtilityService,
    private ngxPermissionService: NgxPermissionsService,
  ) {}

  ngOnInit() {
    this.isUserAcadAdmin = !!this.ngxPermissionService.getPermission('Academic Admin');
    this.isUserAcadDir = !!this.ngxPermissionService.getPermission('Academic Director');
    this.currentUser = this.autService.getLocalStorageUser();

    this.initializeForm();
    this.getTitleList();
    this.getSchoolList('');
    this.getUserTypeList();
  }

  getUserList(titleId, schoolId) {
    this.subs.sink = this.userService.getUserByTitleIdSchool(titleId, schoolId).subscribe((resp) => {
      this.userList = resp.map((user) => {
        return { name: this.translate.instant(user.civility) + ' ' + user.first_name + ' ' + user.last_name, id: user._id };
      });
      this.originalUserList = resp.map((user) => {
        return { name: this.translate.instant(user.civility) + ' ' + user.first_name + ' ' + user.last_name, id: user._id };
      });
    });
  }
  getSchoolList(titleId) {
    if (this.isUserAcadAdmin || this.isUserAcadDir) {
      const dataSchool = [];
      const schoolId = this.currentUser.entities ? this.currentUser.entities[0].school._id : '';
      this.subs.sink = this.rncpTitleService.getAllSchoolDropdown(titleId).subscribe((resp) => {
        if (resp) {
          this.schools = resp;
          dataSchool.push(schoolId);
          this.forwardTutorialForm.get('school_ids').patchValue(dataSchool);
          this.forwardTutorialForm.get('school_ids').disable();

        }
      });
    } else {
      this.subs.sink = this.rncpTitleService.getAllSchoolDropdown(titleId).subscribe((resp) => {
        this.schools = resp;
      });
    }
  }
  getTitleList() {
    if (this.isUserAcadAdmin || this.isUserAcadDir) {
      const userType = this.currentUser.entities ? this.currentUser.entities[0].type.name : '';
      this.subs.sink = this.autService.getUserById(this.currentUser._id).subscribe((res) => {
        const dataUSer = res.entities.filter((ent) => ent.type.name === userType);
        const title_ids = this.utilService.getAcademicAllAssignedTitle(dataUSer);
        this.subs.sink = this.rncpTitleService.getRncpTitlesForTutorialAcad(title_ids).subscribe((resp) => {
          this.rncpTitlesList = resp;
          this.originalRncpTitlesList = resp;
        });
      });
    } else {
      this.subs.sink = this.rncpTitleService.getRncpTitlesForTutorial().subscribe((resp) => {
        this.rncpTitlesList = resp;
        this.originalRncpTitlesList = resp;
      });
    }
  }
  getUserTypeList() {
    if (this.isUserAcadAdmin || this.isUserAcadDir) {
      this.subs.sink = this.userService.getUserTypesByEntityAndSchoolType('academic', 'preparation_center').subscribe((userTypes) => {
        this.userTypesList = userTypes;
        this.originalUserTypesList = userTypes;
      });
    } else {
      this.subs.sink = this.userService.getUserTypesByEntitywithStudent('academic').subscribe((userTypes) => {
        this.userTypesList = userTypes;
        this.originalUserTypesList = userTypes;
      });
    }
  }

  selectedTitle() {
    const data = this.forwardTutorialForm.get('rncp_ids').value;
    this.selectedTitleId = this.forwardTutorialForm.get('rncp_ids').value;
    this.userReady = false;
    this.getSchoolList(data);
    this.getUserList(data, '');
  }

  selectedSchool() {
    const data = this.forwardTutorialForm.get('rncp_ids').value;
    const school = this.forwardTutorialForm.get('school_ids').value;
    this.userReady = false;
    this.getUserList(data, school);
  }
  selectedUser() {
    this.userReady = false;
  }

  selectedUserType() {
    this.userReady = false;
    const data = this.forwardTutorialForm.get('rncp_ids').value;
    // if selected user type is student, call API getUserTypeStudent
    if (this.forwardTutorialForm.get('user_type_id').value === '5a067bba1c0217218c75f8ab') {
      this.subs.sink = this.userService.getUserTypeStudent(data, this.forwardTutorialForm.get('user_type_id').value).subscribe((resp) => {
        this.userRecipientList = resp;
      });
    } else {
      this.subs.sink = this.userService.getUserType(data, this.forwardTutorialForm.get('user_type_id').value).subscribe((resp) => {
        this.userRecipientList = resp;
      });
    }
    this.selectedUserTypeId = this.forwardTutorialForm.get('user_type_id').value;
  }

  initializeForm() {
    this.forwardTutorialForm = this.fb.group({
      rncp_ids: [[], Validators.required],
      school_ids: [[], Validators.required],
      category: [true],
      user_id: [[]],
      user_type_id: [[], Validators.required],
      subject: [this.data.title, Validators.required],
      message: [this.translate.instant('TUTORIAL_MENU.MESSAGE_TEMPLATE'), Validators.required],
    });
  }

  userCategeryChanged(event) {
    this.forwardTutorialForm.controls['category'].setValue(event.checked);
  }

  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  categoryChange(event) {
    if (event.checked) {

      this.forwardTutorialForm.get('user_id').patchValue(null);
      this.forwardTutorialForm.get('user_id').updateValueAndValidity();
      this.forwardTutorialForm.get('user_id').clearValidators();
      this.forwardTutorialForm.get('user_id').updateValueAndValidity();
      this.forwardTutorialForm.get('user_type_id').setValidators([Validators.required]);
      this.forwardTutorialForm.get('user_type_id').updateValueAndValidity();
    } else {

      this.forwardTutorialForm.get('user_type_id').patchValue(null);
      this.forwardTutorialForm.get('user_type_id').updateValueAndValidity();
      this.forwardTutorialForm.get('user_type_id').clearValidators();
      this.forwardTutorialForm.get('user_type_id').updateValueAndValidity();
      this.forwardTutorialForm.get('user_id').setValidators([Validators.required]);
      this.forwardTutorialForm.get('user_id').updateValueAndValidity();
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

  forwardTutorial() {

    let titleName;
    let long_title = [];
    this.selectedTitleId.forEach((element) => {
      titleName = this.rncpTitlesList.filter((title) => {
        return title._id === element;
      });
      long_title = long_title.concat(titleName);
    });
    let name = '';
    if (long_title && long_title.length) {
      let count = 0;
      long_title.forEach((element) => {
        if (element.long_name) {
          count++;
          if (count > 1) {
            name = name + ', ';
            name = name + element.long_name;
          } else {
            name = name + element.long_name;
          }
        }
      });
    }

    const payload = _.cloneDeep(this.forwardTutorialForm.value);
    const user_type = this.currentUser.entities ? this.currentUser.entities[0].type._id : '';
    if (this.forwardTutorialForm.get('category').value) {
      payload.recipient_type = `user_type`;
      payload.user_id = [];
    } else {
      payload.recipient_type = `user`;
      payload.user_type_id = [];
    }
    payload.tutorial_id = this.data._id;
    let type = '';
    if (this.data.user_type_ids && this.data.user_type_ids.length) {
      let count = 0;
      this.data.user_type_ids.forEach((element) => {
        if (element.name) {
          count++;
          if (count > 1) {
            type = type + ', ';
            type = type + element.name;
          } else {
            type = type + element.name;
          }
        }
      });
    }
    delete payload.category;
    Swal.fire({
      title: this.translate.instant('TUTORIAL_SEND2.TITLE', { title: this.data.title }),
      html: this.translate.instant('TUTORIAL_SEND2.TEXT', { title: this.data.title, usertype: type, nametitle: name }),
      footer: `<span style="margin-left: auto">TUTORIAL_SEND2</span>`,
      type: 'question',
      allowEscapeKey: true,
      showCancelButton: true,
      allowOutsideClick: false,
      confirmButtonText: this.translate.instant('TUTORIAL_SEND2.BUTTON_1'),
      cancelButtonText: this.translate.instant('TUTORIAL_SEND2.BUTTON_2'),
    }).then((res) => {
      if (res.value) {
        this.subs.sink = this.tutorialService.sendTutorial(user_type, payload).subscribe((respp) => {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('TUTORIAL_SEND1.TITLE'),
            html: this.translate.instant('TUTORIAL_SEND1.TEXT'),
            footer: `<span style="margin-left: auto">TUTORIAL_SEND1</span>`,
            allowEscapeKey: true,
            allowOutsideClick: false,
            confirmButtonText: this.translate.instant('TUTORIAL_SEND1.BUTTON'),
          });
          this.dialogRef.close();
        });
      }
    });
  }
}
