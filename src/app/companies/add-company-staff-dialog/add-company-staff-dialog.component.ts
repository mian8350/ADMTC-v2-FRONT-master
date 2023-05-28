import { Component, OnInit, Inject, OnDestroy, ViewChild } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormArray } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialog } from '@angular/material/dialog';
import { UserService } from 'app/service/user/user.service';
import { SchoolService } from 'app/service/schools/school.service';
import { TranslateService } from '@ngx-translate/core';
import { CustomValidators } from 'ng2-validation';
import { CompanyService } from 'app/service/company/company.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { AuthService } from 'app/service/auth-service/auth.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { AskRevisionDialogComponent } from '../ask-revision-dialog/ask-revision-dialog.component';
import { NgxPermissionsService } from 'ngx-permissions';
import { interval, PartialObserver, Subject, Observable } from 'rxjs';
import { debounceTime, switchMap, takeUntil } from 'rxjs/operators';
import { removeSpaces } from 'app/service/customvalidator.validator';

interface Entity {
  entity_name: string;
  school_type: string;
  group_of_schools: string;
  school: string;
  assigned_rncp_title: string;
  class: string;
  type: string;
}
@Component({
  selector: 'ms-add-company-staff-dialog',
  templateUrl: './add-company-staff-dialog.component.html',
  styleUrls: ['./add-company-staff-dialog.component.scss'],
})
export class AddCompanyStaffDialogComponent implements OnInit, OnDestroy {
  @ViewChild('swalMentS4Ref', { static: true }) swalMentS4Ref: any;
  @ViewChild('errorSwal', { static: true }) errorSwal: any;
  private subs = new SubSink();
  userForm: UntypedFormGroup;
  currentUser: any;
  currentUserTypeId: string;
  companyId: any;
  schoolId: string = '';
  operation: string;
  isRegistered: boolean;
  selectedEntity: string;
  selectedSchoolType: string;
  selectedSchool: string;
  selectedRncpTitle: string;
  companyName: string;
  isLoading = true;
  companySelect = [];
  nameMentor: string;
  emailValidated: null | 'no' | 'yes' | 'invalid' | 'registered' = null;
  payloadd;
  validateWithoutSubmit: boolean = false;
  // dropdown data

  companyList: any;
  // companies = [{ company_name: 'Company 1', _id: '5b3e06e727a41d7a83376066' }];
  companies: any;
  tempEmail: any;

  schools: any[] = [];
  userTypes: any[] = [];
  CurUser: any;
  isUserAdmtc = false;
  isUserAcadir = false;
  isUserAcadAdmin = false;
  isSubmit = true;
  isMentorDeactivated: boolean;
  companyData: any;
  currentCompanyName: any;
  mentorData: any;
  entityData: any;
  companyPass: any;
  dataSwal: any;
  disableForm = true;
  countdownHabis = false;
  isDisabled = true;
  isCase3 = false;
  private intVal: any;
  private timeOutVal: any;
  userTypeList: any[][] = [];

  ispause = new Subject();
  public time = 120;
  timer: Observable<number>;
  timerObserver: PartialObserver<number>;

  selectedUsertype = [];

  isWaitingForResponse;
  dataUserExisting;

  isEmailValid = true;
  tempMentorData;

  constructor(
    @Inject(MAT_DIALOG_DATA) public parentData: any, // data that come from parent component's dialog.open()
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<AddCompanyStaffDialogComponent>,
    private userService: UserService,
    private schoolService: SchoolService,
    public translate: TranslateService,
    private companyService: CompanyService,
    private utilService: UtilityService,
    private CurUserService: AuthService,
    private dialog: MatDialog,
    private permission: NgxPermissionsService,
  ) {}

  ngOnInit() {
    this.isRegistered = false;
    this.selectedEntity = 'company';
    this.initUserForm();

    this.getUserTypesByEntity();
    if (this.parentData) {
      this.currentUser = this.parentData.userData;
      this.currentUserTypeId = this.parentData.userTypeId;
      this.operation = this.parentData.operation;
      this.companyId = this.parentData.companyId;
      this.schoolId = this.parentData.schoolId;
      if (this.operation === 'edit') {
        this.companyPass = this.parentData.companyData;
        this.tempEmail = this.companyPass && this.companyPass.email ? this.companyPass.email : '';

        this.addEntitiesForm();
      } else {
        this.disableFormField();
        const MENTOR_USER_TYPE_ID = '5a2e603f53b95d22c82f9590';
        const data = {
          entity_name: 'company',
          companies: this.companyId,
          type: this.parentData?.schoolId ? MENTOR_USER_TYPE_ID : null,
          school: this.parentData?.schoolId || null,
        };
        this.entities.get('0').patchValue(data);
        this.isLoading = false;
      }
    }
    this.keyupEmail();
    this.getCompanyData();

    // *************** Function to get data current user
    this.CurUser = this.CurUserService.getLocalStorageUser();
    this.entityData = this.CurUser?.entities?.find((entity) => entity?.type?.name === 'Academic Director' || entity?.type?.name === 'Academic Admin');

    // *************** Cek User Type & Permission Access User to Company Data
    this.isUserAcadir = !!this.permission.getPermission('Academic Director');
    this.isUserAcadAdmin = !!this.permission.getPermission('Academic Admin');
    this.isUserAdmtc = this.utilService.isUserEntityADMTC();

    // ======================================================
    this.timer = interval(1000).pipe(takeUntil(this.ispause));
    this.timerObserver = {
      next: (a: number) => {
        if (this.time === 0) {
          this.ispause.next();
        }
        this.time -= 1;
      },
    };
  }

  // *************** Function to generate entity form
  addEntitiesForm() {
    let entities = [];
    this.companyPass.entities?.forEach((el) => {
      el.companies?.forEach((element) => {
        if (element._id === this.companyId) {
          entities.push(el);
        }
      });
    });
    entities = _.uniqBy(entities, 'type._id');
    for (let i = 0; i < entities.length; i++) {
      if (i > 0) {
        this.addEntities();
      }
    }
    this.getEntitiesData();
  }

  // *************** Function to get data entity
  getEntitiesData() {
    this.subs.sink = this.userService.getUserDialogData(this.companyPass._id).subscribe(
      (resp) => {
        this.currentUser = resp;
        let currCompany = _.cloneDeep(resp);
        let currEntities = [];
        currCompany.entities?.forEach((el) => {
          el.companies?.forEach((element) => {
            if (element?._id === this.companyId) {
              currEntities.push(el);
            }
          });
        });

        currEntities = _.uniqBy(currEntities, 'type._id');
        currCompany.entities = currEntities;
        this.userForm.patchValue(currCompany);



        const entities: any[] = currEntities.map((entity) => {
          const data = {};
          data['entity_name'] = entity.entity_name;
          if (entity.type) {
            data['type'] = entity.type._id;
          }
          if (entity.group_of_school) {
            data['group_of_school'] = entity.group_of_school._id;
          }
          if (entity.school) {
            data['school'] = entity.school._id;
          }
          if (entity.assigned_rncp_title) {
            data['assigned_rncp_title'] = entity.assigned_rncp_title._id;
          }
          if (entity.class) {
            data['class'] = entity.class._id;
          }
          data['school_type'] = entity.school_type;

          return data;
        });

        for (let i = 0; i < entities.length; i++) {
          this.schools.push([]);

          this.entities.get(i.toString()).patchValue(entities[i]);
          this.entities.get(i.toString()).get('companies').setValue(this.companyId);

          this.getUserTypes(entities[i].entity_name, i.toString());
        }
        if (entities.length > 1) {
          this.userTypeList[0] = _.filter(this.userTypes, function (data) {
            return data.value === entities[0].type;
          });
        }
        this.userTypeList[1] = _.filter(this.userTypes, function (data) {
          return data.value !== entities[0].type;
        });

        if (entities && entities.length) {
          entities.forEach((entity) => {

            this.selectedUsertype.push(entity.type);
          });
        }

        this.isLoading = false;
      },
      (err) => {
        // this.CurUserService.postErrorLog(err);

        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
        this.isLoading = false;
      },
    );
  }

  // *************** Function to initialize form field
  initUserForm() {
    this.userForm = this.fb.group({
      entities: this.fb.array([this.initEntitiesFormGroup()]),
      civility: [null, Validators.required],
      first_name: [null, [Validators.required, removeSpaces]],
      last_name: [null, [Validators.required, removeSpaces]],
      email: [null, [CustomValidators.email, Validators.required, removeSpaces]],
      position: [null, [removeSpaces]],
      office_phone: ['', [Validators.maxLength(11), CustomValidators.number, removeSpaces]],
      direct_line: ['', [CustomValidators.number, removeSpaces]],
      portable_phone: ['', [Validators.maxLength(11), CustomValidators.number, removeSpaces]],
    });
  }

  initEntitiesFormGroup() {
    return this.fb.group({
      entity_name: [this.selectedEntity, Validators.required],
      companies: [this.parentData.companyId],
      type: [null, Validators.required],
      school_type: [null],
      assigned_rncp_title: [null],
      school: [null],
      class: [null],
      group_of_school: [null],
    });
  }
  // *************** End of Function to initialize form field

  // *************** Function to add new entity
  addEntities() {
    const dataType = this.userForm.get('entities').get('0').get('type').value;
    this.userTypeList[1] = _.filter(this.userTypes, function (data) {
      return data.value !== dataType;
    });
    const dataType1 = _.filter(this.userTypes, function (data) {
      return data.value !== dataType;
    });
    this.userTypeList[0] = _.filter(this.userTypes, function (data) {
      return data.value === dataType;
    });

    this.entities.push(this.initEntitiesFormGroup());
    this.userForm.get('entities').get('0').get('type').setValue(dataType);
    this.userForm
      .get('entities')
      .get('1')
      .get('type')
      .setValue(dataType1 && dataType1.length ? dataType1[0].value : dataType1);
  }

  // *************** Function to add check entity
  addEntitiesCheck() {
    this.entities.push(this.initEntitiesFormGroup());
  }

  // *************** Function to remove entity
  removeEntities(index: number) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
      html: this.translate.instant('this action will delete entity !'),
      type: 'warning',
      footer: `<span style="margin-left: auto">DASHBOARD_DELETE</span>`,
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        this.intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);
        clearInterval(this.timeOutVal);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(this.intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      clearTimeout(this.timeOutVal);
      if (res.value) {
        this.userTypeList[0] = this.userTypes;
        this.entities.removeAt(index);
        Swal.fire({
          type: 'success',
          title: this.translate.instant('EVENT_S1.TITLE'),
          html: this.translate.instant('entity deleted'),
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          footer: `<span style="margin-left: auto">EVENT_S1</span>`,
          allowOutsideClick: false,
        });
      }
    });
  }

  get entities(): UntypedFormArray {
    return this.userForm.get('entities') as UntypedFormArray;
  }

  // *************** Function to disable/enable form field
  disableFormField() {
    this.userForm.get('civility').disable();
    this.userForm.get('first_name').disable();
    this.userForm.get('last_name').disable();
    this.userForm.get('position').disable();
    this.userForm.get('office_phone').disable();
    this.userForm.get('direct_line').disable();
    this.userForm.get('portable_phone').disable();
  }
  enableFormField() {
    this.userForm.get('civility').enable();
    this.userForm.get('first_name').enable();
    this.userForm.get('last_name').enable();
    this.userForm.get('position').enable();
    this.userForm.get('office_phone').enable();
    this.userForm.get('direct_line').enable();
    this.userForm.get('portable_phone').enable();
  }
  // *************** End of Function to disable/enable form field

  validateMessageCase(resp) {
    const payload = this.userForm.getRawValue();
    const email = payload.email;
    const msg = String(resp?.message)
    const clonedMentorData = _.omitBy(_.cloneDeep(resp?.mentor), _.isNil)
    if (clonedMentorData) {
      delete clonedMentorData.entities
      delete clonedMentorData.email
    }

    if (resp.mentor !== null) {
      this.mentorData = _.omitBy(_.cloneDeep(resp?.mentor), _.isNil)
      this.nameMentor = [this.translate.instant(resp.mentor?.civility), resp.mentor?.first_name, resp.mentor?.last_name].filter(Boolean).join(' ')
      this.isMentorDeactivated = resp.mentor?.status === 'deleted'
      this.operation = 'edit'
      this.currentUser = _.cloneDeep(this.mentorData)
      this.currentCompanyName = this.mentorData?.entities?.find(entity => entity?.entity_name === 'company' && entity?.companies?.length)?.companies[0]?.company_name || ''
    }

    this.isLoading = false;
    if (msg.includes('case 1')) {
      // Case 1: Mentor Active and already connect to the same company but in different school
      if (this.isUserAcadir || this.isUserAcadAdmin) {
        this.swalMent1()
      } else if (this.isUserAdmtc) {
        this.swalMent2(clonedMentorData)
      }
    } else if (msg.includes('case 2')) {
      // Case 2: Mentor Active and already connect to the different company
      if (this.isUserAcadir || this.isUserAcadAdmin) {
        // new_ment_s4 uses ngx-sweetalert2
        this.subs.sink = this.timer.subscribe(this.timerObserver);
        this.swalMentS4Ref.show();
      } else if (this.isUserAdmtc) {
        this.swalMent3(resp)
      }
    } else if (msg.includes('case 3')) {
      // Case 3: Mentor Active and already connect to the same company + connect to the same school
      this.swalMent2(clonedMentorData)
      this.validateWithoutSubmit = true;
      this.isCase3 = true;
    } else if (msg.includes('case 4')) {
      // Case 4: Email not registered on the platform
      Swal.fire({
        type: 'success',
        title: 'Bravo!',
        html: this.translate.instant('EMAIL_VALID'),
        confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        allowOutsideClick: false,
      }).then(() => {
        this.emailValidated = 'yes';
        this.isSubmit = true;
        this.isDisabled = true;
        this.disableForm = false;
        this.resetUserForm(['entities'])
        this.userForm.get('email').setValue(email);
        this.enableFormField()
        this.tempEmail = email;
      })
    } else if (msg.includes('case 5')) {
      // Case 5: Email of active user outside mentor but already registered on the platform as user non-mentor
      Swal.fire({
        type: 'success',
        title: 'Bravo!',
        html: this.translate.instant('EMAIL_VALID'),
        confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        allowOutsideClick: false,
      }).then(() => {
        this.emailValidated = 'yes';
        this.isSubmit = true;
        this.isDisabled = true;
        this.disableForm = true;
        this.resetUserForm(['entities'], { emitEvent: false })
        this.userForm.patchValue(clonedMentorData, { emitEvent: false })
        this.userForm.get('email').setValue(email, { emitEvent: false });
        this.disableFormField()
        this.tempEmail = email;
      })
    }
  }

  // *************** Function to check/validate email only
  validateEmail() {
    this.isLoading = true;
    const payload = this.userForm.getRawValue();
    const companyId = this.companyId;
    const schoolId = this.parentData?.schoolId
    const email = payload.email;

    this.subs.sink = this.companyService.validateEmailMentor(email, companyId, schoolId).subscribe(
      (resp) => {
        if (resp?.email_message === 'email is not valid') {
          this.emailValidated = 'invalid';
          Swal.fire({
            title: this.translate.instant('usermailvalidation_S1.TITLE'),
            html: this.translate.instant('usermailvalidation_S1.Text'),
            type: 'warning',
            footer: `<span style="margin-left: auto">usermailvalidation_S1</span>`,
            confirmButtonText: this.translate.instant('usermailvalidation_S1.BUTTON 1'),
          }).then(() => this.validateMessageCase(resp));
        } else {
          this.emailValidated = 'yes';
          this.validateMessageCase(resp);
        }
      },
      (err) => {
        this.CurUserService.postErrorLog(err);
        this.emailValidated = null;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });

      },
    );
  }

  // *************** Function to check/validate mentor data
  validateMentor() {
    this.isLoading = true;
    if (this.checkFormValidity()) {
      this.isLoading = false;
      return;
    } else if (this.validateWithoutSubmit && !this.isMentorDeactivated) {
      this.dialogRef.close({
        mentorId: this.mentorData?._id
      })
    } else {
      this.submit()
    }
  }

  // ==============Swal For Email Validity================================

  swalCheckEmailValid() {
    Swal.fire({
      title: this.translate.instant('usermailvalidation_S1.TITLE'),
      html: this.translate.instant('usermailvalidation_S1.Text'),
      type: 'warning',
      confirmButtonText: this.translate.instant('usermailvalidation_S1.BUTTON 1'),
      footer: `<span style="margin-left: auto">usermailvalidation_S1</span>`,
    });
  }

  // *************** Function to open sweat alert NewMent_1 until NewMent_7 based on case mentor creation
  swalMent1() {
    this.isLoading = false;
    Swal.fire({
      title: this.translate.instant('NEW_MENT_S1.TITLE'),
      html: this.translate.instant('NEW_MENT_S1.TEXT', {
        nameMentor: this.nameMentor,
      }),
      type: 'warning',
      footer: `<span style="margin-left: auto">NEW_MENT_S1</span>`,
      confirmButtonText: this.translate.instant('NEW_MENT_S1.BUTTON1'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('NEW_MENT_S1.BUTTON2'),
      allowOutsideClick: false,
      width: 560,
    }).then((result) => {
      if (result && result.value) {
        const dataClose = {
          regitered: this.isRegistered,
          connectToCompany: true,
          dataMentor: this.mentorData,
        };
        this.dialogRef.close(dataClose);
      } else {
        this.resetUserForm(['entities'])
      }
    });
  }
  swalMent2(clonedMentorData: any) {
    this.isLoading = false;
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('NEW_MENT_S2.TITLE'),
      html: this.translate.instant('NEW_MENT_S2.TEXT', { nameMentor: this.nameMentor }),
      type: 'warning',
      allowOutsideClick: false,
      showCancelButton: true,
      footer: `<span style="margin-left: auto">NEW_MENT_S2</span>`,
      confirmButtonText: this.translate.instant('NEW_MENT_S2.BUTTON1_TIMED', { timeDisabled }),
      cancelButtonText: this.translate.instant('NEW_MENT_S2.BUTTON2'),
      onOpen: () => {
        const confirmBtnRef = Swal.getConfirmButton();
        confirmBtnRef.setAttribute('disabled', 'true')
        const time = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('NEW_MENT_S2.BUTTON1_TIMED', { timeDisabled });
        }, 1000);
        const timeout = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('NEW_MENT_S2.BUTTON1');
          confirmBtnRef.removeAttribute('disabled')
          clearInterval(time);
          clearTimeout(timeout);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      /* 
      const dataClose = {
        regitered: this.isRegistered,
        connectToCompany: false,
        dataMentor: null,
        cancel: false,
      };
      this.dialogRef.close(dataClose);
      */
      if (result.value) {
        this.userForm.patchValue(clonedMentorData)
      }
    });
  }
  swalMent3(resp) {
    const mentor = resp && resp.mentor ? resp.mentor : '';
    const company =
      mentor &&
      mentor.entities &&
      mentor.entities[0] &&
      mentor.entities[0].companies &&
      mentor.entities[0].companies[0] &&
      mentor.entities[0].companies[0].company_name
        ? mentor.entities[0].companies[0].company_name
        : '';
    const html = company
      ? this.translate.instant('NEW_MENT_S3.TEXT', {
          nameMentor:
            (mentor && mentor.civility ? mentor.civility : '') +
            ' ' +
            (mentor && mentor.first_name ? mentor.first_name : '') +
            ' ' +
            (mentor && mentor.last_name ? mentor.last_name : ''),
          current: company,
          NewCompanyName: this.companyName,
        })
      : this.translate.instant('NEW_MENT_S3B.TEXT', {
          nameMentor:
            (mentor && mentor.civility ? mentor.civility : '') +
            ' ' +
            (mentor && mentor.first_name ? mentor.first_name : '') +
            ' ' +
            (mentor && mentor.last_name ? mentor.last_name : ''),
          NewCompanyName: this.companyName,
        });
    this.isLoading = false;
    Swal.fire({
      title: this.translate.instant('NEW_MENT_S3.TITLE'),
      html: html,
      type: 'question',
      confirmButtonText: this.translate.instant('NEW_MENT_S3.BUTTON1'),
      showCancelButton: true,
      footer: `<span style="margin-left: auto">NEW_MENT_S3</span>`,
      cancelButtonText: this.translate.instant('NEW_MENT_S3.BUTTON2'),
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        const payload = this.userForm.getRawValue();
        const email = payload.email;
        this.isLoading = true;
        this.isRegistered = true;
        this.subs.sink = this.companyService.connectSchoolToMentor(this.currentUserTypeId, this.mentorData?._id, this.companyId, this.parentData?.schoolId, this.isMentorDeactivated).subscribe((response) => {
          this.isLoading = false
          Swal.fire({
            type: 'success',
            title: this.translate.instant('USER_UPDATED.TITLE'),
            text: this.translate.instant('USER_UPDATED.TEXT'),
            confirmButtonText: this.translate.instant('USER_UPDATED.OK'),
            footer: `<span style="margin-left: auto">USER_UPDATED</span>`,
          }).then(() => {
            const data = {
              mentorId: this.mentorData?._id,
              connectToCompany: false,
            }
            this.dialogRef.close(data)
          });
        })
      } else {
        this.resetUserForm(['entities'])
      }
    });
  }

  swalMent4() {
    Swal.close();
    this.isLoading = true;
    this.subs.sink = this.companyService
      .connectSchoolToMentor(this.currentUserTypeId, this.mentorData?._id, this.companyId, this.entityData?.school?._id, this.isMentorDeactivated)
      .subscribe((response) => {
        this.isLoading = false;
        this.isRegistered = true;
        Swal.fire({
          type: 'success',
          title: this.translate.instant('USER_UPDATED.TITLE'),
          text: this.translate.instant('USER_UPDATED.TEXT'),
          confirmButtonText: this.translate.instant('USER_UPDATED.OK'),
          footer: `<span style="margin-left: auto">USER_UPDATED</span>`,
        }).then(() => {
          this.dialogRef.close({
            regitered: this.isRegistered,
            connectToCompany: false,
            dataMentor: null,
            mentorId: response?._id,
            cancel: false,
          });
        });
      });
  }
  swalMent5(resp) {
    this.isSubmit = true;
    this.isLoading = false;
    const mentor = resp && resp.mentor ? resp.mentor : '';
    const company =
      mentor &&
      mentor.entities &&
      mentor.entities[0] &&
      mentor.entities[0].companies &&
      mentor.entities[0].companies[0] &&
      mentor.entities[0].companies[0].company_name
        ? mentor.entities[0].companies[0].company_name
        : '';
    const userType =
      mentor && mentor.entities && mentor.entities[0] && mentor.entities[0].type && mentor.entities[0].type.name
        ? mentor.entities[0].type.name
        : '';
    Swal.fire({
      cancelButtonText: this.translate.instant('NEW_MENT_S5.BUTTON2'),
      showCancelButton: true,
      title: this.translate.instant('NEW_MENT_S5.TITLE', { companyName: company }),
      html: this.translate.instant('NEW_MENT_S5.TEXT', {
        mentorCivility: mentor && mentor.civility ? this.translate.instant(mentor.civility) : '',
        mentorFirstName: mentor && mentor.first_name ? mentor.first_name : '',
        mentorLastName: mentor && mentor.last_name ? mentor.last_name : '',
        companyName: company,
        userType: this.translate.instant(userType),
      }),
      footer: `<span style="margin-left: auto">NEW_MENT_S5</span>`,
      type: 'warning',
      confirmButtonText: this.translate.instant('NEW_MENT_S5.BUTTON1'),
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        this.closeDialog();
        window.open(`./users/user-management-detail/?userId=${mentor._id}&isFromActiveUserTab=true`, '_blank');
      } else {
        this.resetUserForm(['entities'])
      }
    });
  }
  swalMent6() {
    this.isLoading = false;
    Swal.fire({
      title: this.translate.instant('NEW_MENT_S6.TITLE'),
      type: 'error',
      footer: `<span style="margin-left: auto">NEW_MENT_S6</span>`,
      confirmButtonText: this.translate.instant('NEW_MENT_S6.BUTTON1'),
      allowOutsideClick: false,
    }).then((result) => {
      this.isRegistered = true;
      const dataClose = {
        regitered: this.isRegistered,
        connectToCompany: false,
        dataMentor: null,
        cancel: false,
      };
      this.dialogRef.close(dataClose);
    });
  }
  swalMent7(resp) {
    const mentor = resp && resp.mentor ? resp.mentor : '';
    this.isLoading = false;
    Swal.fire({
      title: this.translate.instant('NEW_MENT_S7.TITLE'),
      html: this.translate.instant('NEW_MENT_S7.TEXT', {
        nameMentor:
          (mentor && mentor.civility ? mentor.civility : '') +
          ' ' +
          (mentor && mentor.first_name ? mentor.first_name : '') +
          ' ' +
          (mentor && mentor.last_name ? mentor.last_name : ''),
      }),
      type: 'error',
      footer: `<span style="margin-left: auto">NEW_MENT_S7</span>`,
      confirmButtonText: this.translate.instant('NEW_MENT_S7.BUTTON1'),
      allowOutsideClick: false,
    }).then((result) => {
      this.isRegistered = true;
      const dataClose = {
        regitered: this.isRegistered,
        connectToCompany: false,
        dataMentor: null,
        cancel: false,
      };
      this.dialogRef.close(dataClose);
    });
  }
  // *************** End of Function to open sweat alert NewMent_1 until NewMent_7 based on case mentor creation

  resetUserForm(fieldsExcepted: string[] = [], options?: { emitEvent?: boolean, onlySelf?: boolean }) {
    const exceptions = {}
    fieldsExcepted.forEach(fieldName => {
      exceptions[fieldName] = _.cloneDeep(this.userForm.get(fieldName).value)
    })
    this.userForm.reset(options)
    this.userForm.patchValue(exceptions, options)
  }

  // *************** Function to get All mentor from school
  getAllMentorFromSchool() {
    this.subs.sink = this.companyService.populateDataMentor(this.companyId, this.entityData.school._id).subscribe((resp) => {
      const entities: any[] = resp.map((entity) => entity._id);
    });
  }

  // *************** Function to create/update data mentor
  submit() {
    this.isLoading = true;
    const USER_TYPE_HR = '5a2e603c53b95d22c82f958f'
    const entities = this.userForm.get('entities').value || []
    const hrEntity = entities.find(entity => entity?.type === USER_TYPE_HR)
    if (!this.mentorData?._id) {
      const payload = this.userForm.getRawValue()
      payload.entities = []
      this.subs.sink = this.userService.registerUser(payload).pipe(switchMap(resp => {
        return this.companyService.connectSchoolToMentor(
          this.currentUserTypeId,
          resp._id,
          this.companyId,
          this.schoolId,
          this.isMentorDeactivated,
          Boolean(hrEntity),
        )
      })).subscribe(response => {
        this.isLoading = false;
        if (response?._id) {
          this.dialogRef.close({
            mentorId: response._id
          })
        }
      })
    } else {
      this.subs.sink = this.companyService.connectSchoolToMentor(
        this.currentUserTypeId,
        this.mentorData._id,
        this.companyId,
        this.schoolId,
        this.isMentorDeactivated,
        Boolean(hrEntity),
      ).subscribe(response => {
        this.isLoading = false;
        if (response?._id) {
          this.dialogRef.close({
            mentorId: response._id
          })
        }
      })
    }
  }

  checkFormValidity(): boolean {

    if (this.userForm.invalid) {
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
      this.userForm.markAllAsTouched();
      return true;
    } else {
      return false;
    }
  }

  // *************** Called when user is already registered
  submitCase3(resp) {

    const payload = this.userForm.getRawValue();
    if (resp && resp.mentor) {
      const user = _.cloneDeep(resp.mentor);

      // const tempPayload = payload.entities;


      const tempEntitiies = [];
      if (payload && payload.entities && payload.entities.length) {
        payload.entities.forEach((entity) => {
          tempEntitiies.push(_.omitBy(entity, _.isNil));
        });
      }


      const tempPayload = tempEntitiies;

      this.subs.sink = this.userService.MakeUserAsCompanyMember(user._id, tempPayload).subscribe((response) => {

        this.isLoading = false;
        Swal.fire({
          type: 'success',
          title: this.translate.instant('USER_UPDATED.TITLE'),
          text: this.translate.instant('USER_UPDATED.TEXT'),
          confirmButtonText: this.translate.instant('USER_UPDATED.OK'),
          footer: `<span style="margin-left: auto">USER_UPDATED</span>`,
        }).then(() => {
          this.isRegistered = true;
          const dataClose = {
            regitered: this.isRegistered,
            connectToCompany: false,
            dataMentor: null,
            cancel: false,
          };
          if (this.isUserAcadir || this.isUserAcadAdmin) {
            dataClose.connectToCompany = true;
            dataClose.dataMentor = response;
          }

          this.dialogRef.close(dataClose);
        });
        // this.isRegistered = true;
        // const dataClose = {
        //   regitered: this.isRegistered,
        //   connectToCompany: false,
        //   dataMentor: null,
        //   cancel: false,
        // };
        // this.dialogRef.close(dataClose);
      });
    }



  }

  // *************** Function to close dialog
  closeDialog() {
    const dataClose = {
      regitered: this.isRegistered,
      connectToCompany: false,
      dataMentor: null,
      cancel: true,
    };
    this.dialogRef.close(dataClose);
  }

  // *************** Function to get data user type company
  getUserTypes(event, index?: string) {
    this.selectedEntity = event;

    if (this.selectedEntity === 'company') {
      this.subs.sink = this.schoolService.getAllSchoolIdAndShortName().subscribe(
        (schools) => {
          const schoolArray = schools.map((school) => {
            return { value: school._id, label: school.short_name };
          });
          this.schools = schoolArray;
        },
        (err) => {
          this.CurUserService.postErrorLog(err);

        },
      );
    }
  }

  // *************** Function to get company data
  getCompanyData() {
    this.subs.sink = this.companyService.getOneCompany(this.companyId).subscribe(
      (resp: any) => {
        // this.companyList = resp;
        this.companies = resp;

        this.companyName = resp.company_name ? resp.company_name : '';
      },
      (err) => {
        this.CurUserService.postErrorLog(err);

      },
    );
  }

  // *************** Function to get data user type based on entity selected
  getUserTypesByEntity() {
    this.subs.sink = this.companyService.getUserTypesByEntity(this.selectedEntity).subscribe(
      (userTypes) => {
        const userTypesArray = userTypes.map((type) => {
          return { value: type._id, label: type.name };
        });
        this.userTypes = userTypesArray;
        this.userTypeList[0] = userTypesArray;
        this.userTypeList[1] = userTypesArray;
      },
      (err) => {
        this.CurUserService.postErrorLog(err);

      },
    );
  }

  // *************** Function to patch data mentor (Operation edit mentor)
  patchMentorData(id, email) {
    this.subs.sink = this.companyService.getOneMentor(id, email).subscribe(
      (resp: any) => {
        this.currentUser = resp;

        const entities: any[] = resp.entities.map((entity) => {
          const data = {};
          data['entity_name'] = entity.entity_name;
          if (entity.type) {
            data['type'] = entity.type._id;
          }
          return data;
        });
        if (entities.length > 1) {
          this.addEntitiesCheck();
        }
        this.userForm.patchValue(resp);
        for (let i = 0; i < entities.length; i++) {
          this.entities.get(i.toString()).patchValue(entities[i]);
          this.entities.get(i.toString()).get('companies').setValue(this.companyId);
          // this.entities.get(i.toString()).get('type').setValue(entities[i].type._id);

          this.getUserTypes(entities[i].entity_name, i.toString());
        }
        this.isLoading = false;
        // this.operation = 'edit';
        this.disableForm = false;
        this.enableFormField();
      },
      (err) => {
        // this.CurUserService.postErrorLog(err);

      },
    );
  }

  // *************** Function to event listener key up email
  keyupEmail() {
    this.subs.sink = this.userForm
      .get('email')
      .valueChanges.pipe(debounceTime(200))
      .subscribe((search) => {
        if (search && search.length >= 3) {
          this.isDisabled = false;
          if (this.tempEmail && this.tempEmail === search) {
            this.enableFormField();
            this.isSubmit = true;
            this.disableForm = false;
            this.isDisabled = true;
          } else {
            this.isDisabled = false;
            this.disableForm = true;
            this.disableFormField();
          }
        } else {
          this.isDisabled = true;
          this.disableForm = true;
          this.disableFormField();
        }
      });
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }

  // *************** Function to dispaying error phone field
  showErrors() {


  }

  // *************** Function to close sweat alert NewMent_S4
  closeSwal() {
    Swal.close();
    this.isLoading = false;
    this.isRegistered = true;
    const dataClose = {
      regitered: this.isRegistered,
      connectToCompany: false,
      dataMentor: null,
      cancel: false,
    };
    this.dialogRef.close(dataClose);
  }

  // *************** Function to open ask revision dialog
  openRevisionMentor() {
    Swal.close();
    this.isLoading = false;
    this.dialog
      .open(AskRevisionDialogComponent, {
        minWidth: '505px',
        width: '590px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          reqNumber: '_2',
          companyId: this.companyId,
          userLogin: this.CurUser._id,
          dataMentor: this.mentorData,
        },
      })
      .afterClosed()
      .subscribe((e) => {
        this.isRegistered = true;
        const dataClose = {
          regitered: this.isRegistered,
          connectToCompany: false,
          dataMentor: null,
          cancel: false,
        };
        this.dialogRef.close(dataClose);
      });
  }

  // *************** Function to countdown button submit in newMent_S4
  secondsToHms(d) {
    d = Number(d);
    const s = Math.floor((d % 25) % 5);
    let sDisplay = s > 0 ? s + (s === 1 ? '' : '') : '5';
    sDisplay = sDisplay + 's';
    if (s === 1) {
      this.countdownHabis = true;
    }
    if (this.countdownHabis) {
      sDisplay = this.translate.instant('NEW_MENT_S4.BUTTON1');
    }
    return sDisplay;
  }

  // *************** Function to validate user type
  userTypeValidate(event) {
    this.userTypeList[1] = _.filter(this.userTypes, function (data) {
      return data.value !== event.value;
    });
  }

  registerExistingUser() {
    // to prevent adding 2 same entity
    const selectedEntity: Entity = this.entities.value;
    const entities: Entity[] = this.entities.value;
    let isEntityExist = false;
    entities.forEach((entity) => {
      isEntityExist = JSON.stringify(selectedEntity) === JSON.stringify(entity);
    });
    if (isEntityExist) {
      Swal.fire({ type: 'warning', title: this.translate.instant('ENTITY_EXIST') });
      return;
    }

    let payload = this.userForm.getRawValue();
    const payloadEntity = this.entities.getRawValue();

    for (let i = 0; i < payload.entities.length; i++) {
      // dont send school_type if the value is empty
      if (!payload.entities[i]['school_type']) {
        delete payload.entities[i]['school_type'];
      }
    }

    this.isWaitingForResponse = true;
    this.subs.sink = this.userService.registerUserExisting(payload).subscribe(
      (resp) => {
        Swal.fire({
          type: 'success',
          title: this.translate.instant('USER_S9.TITLE'),
          text: this.translate.instant('USER_S9.TEXT', {
            civility: this.translate.instant(resp.civility),
            lastName: resp.first_name,
            firstName: resp.last_name,
          }),
          footer: `<span style="margin-left: auto">USER_S9</span>`,
          confirmButtonText: this.translate.instant('USER_S9.OK'),
        });
        this.isWaitingForResponse = false;
        this.isRegistered = true;

        const dataClose = {
          regitered: this.isRegistered,
          connectToCompany: false,
          dataMentor: null,
          cancel: false,
          mentorResp: resp,
        };
        if (this.isUserAcadir || this.isUserAcadAdmin) {
          dataClose.connectToCompany = true;
          dataClose.dataMentor = resp;
        }

        this.dialogRef.close(dataClose);
      },
      (err) => {
        this.CurUserService.postErrorLog(err);
        this.isWaitingForResponse = false;
        if (err['message'] === 'GraphQL error: Selected Class Already Have Academic Director') {
          Swal.fire({
            title: this.translate.instant('USER_S15.TITLE'),
            html: this.translate.instant('USER_S15.TEXT'),
            type: 'error',
            showConfirmButton: true,
            footer: `<span style="margin-left: auto">USER_S15</span>`,
            confirmButtonText: this.translate.instant('USER_S15.OK'),
          });
        } else if (err['message'] === 'GraphQL error: Email Exist') {
          Swal.fire({
            title: this.translate.instant('USER_S16.TITLE'),
            html: this.translate.instant('USER_S16.TEXT'),
            type: 'error',
            showConfirmButton: true,
            footer: `<span style="margin-left: auto">USER_S16</span>`,
            confirmButtonText: this.translate.instant('USER_S16.OK'),
          });
        } else if (err['message'] === 'User was already created but the status is deleted') {
          this.timer.subscribe(this.timerObserver);
          this.errorSwal.show();
        } else {
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          });
        }
      },
    );
  }

  openUpdateUser() {
    // to prevent adding 2 same entity
    // const selectedEntity: Entity = this.userEntityForm.value;
    const entities: Entity[] = this.entities.value;

    const payload = _.cloneDeep(this.dataUserExisting);
    // const payloadEntity = this.userEntityForm.getRawValue();
    payload.status = 'active';
    delete payload._id;
    delete payload.entities;
    this.isWaitingForResponse = true;
    this.subs.sink = this.userService.updateUserExisting(this.dataUserExisting._id, payload).subscribe(
      (resp) => {
        Swal.fire({
          type: 'success',
          title: this.translate.instant('USER_UPDATED.TITLE'),
          text: this.translate.instant('USER_UPDATED.TEXT'),
          confirmButtonText: this.translate.instant('USER_UPDATED.OK'),
          footer: `<span style="margin-left: auto">USER_UPDATED</span>`,
        });
        this.isWaitingForResponse = false;
        this.isRegistered = true;

        const dataClose = {
          regitered: this.isRegistered,
          connectToCompany: false,
          dataMentor: null,
          cancel: false,
        };
        // If user is acad dir/acad admin or dialog is accessed via student card, then open then close the dialog
        // so the update is done in main component(So the connection also connect the school as ADMTC)
        if (this.isUserAcadir || this.isUserAcadAdmin || this.parentData?.schoolId) {
          dataClose.connectToCompany = true;
          dataClose.dataMentor = resp;
          this.dialogRef.close(dataClose);
        } else {
          this.subs.sink = this.companyService.connectSchoolToMentorADMTC(resp._id, this.companyId).subscribe((response) => {
            this.isLoading = false;
            Swal.fire({
              type: 'success',
              title: this.translate.instant('USER_UPDATED.TITLE'),
              text: this.translate.instant('USER_UPDATED.TEXT'),
              confirmButtonText: this.translate.instant('USER_UPDATED.OK'),
            });
            this.isRegistered = true;
            const dataCloseADMTC = {
              regitered: this.isRegistered,
              connectToCompany: false,
              dataMentor: null,
              cancel: false,
            };
            this.dialogRef.close(dataCloseADMTC);
          });
        }

      },
      (err) => {
        this.CurUserService.postErrorLog(err);
        this.isWaitingForResponse = false;
        if (err['message'] === 'GraphQL error: Selected Class Already Have Academic Director') {
          Swal.fire({
            title: this.translate.instant('USER_S15.TITLE'),
            html: this.translate.instant('USER_S15.TEXT'),
            type: 'error',
            showConfirmButton: true,
            footer: `<span style="margin-left: auto">USER_S15</span>`,
            confirmButtonText: this.translate.instant('USER_S15.OK'),
          });
        } else {
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
          });
        }
      },
    );
  }

  getDataUser() {
    this.subs.sink = this.userService.getUserDialogData(this.currentUser._id).subscribe((resp) => {

      this.dataUserExisting = resp;
      this.timer.subscribe(this.timerObserver);
      this.errorSwal.show();
    });
  }
}
