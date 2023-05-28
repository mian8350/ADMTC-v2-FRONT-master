import { JuryOrganizationService } from './../../service/jury-organization/jury-organization.service';
import { Component, OnInit, ViewChild, OnDestroy, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSort } from '@angular/material/sort';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormControl, UntypedFormArray } from '@angular/forms';
import * as _ from 'lodash';
import { SubSink } from 'subsink';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { AuthService } from 'app/service/auth-service/auth.service';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { Router } from '@angular/router';
import { PermissionService } from 'app/service/permission/permission.service';
import { TutorialService } from 'app/service/tutorial/tutorial.service';
@Component({
  selector: 'ms-jury-organization-dialog',
  templateUrl: './jury-organization-dialog.component.html',
  styleUrls: ['./jury-organization-dialog.component.scss'],
})
export class JuryOrganizationDialogComponent implements OnInit, OnDestroy {
  juryForm: UntypedFormGroup;

  userEntities: any[];
  private subs = new SubSink();

  isEditing = false;
  isWaitingForResponse = false;

  savedForm;

  selectCertifierForm = new UntypedFormControl('');
  certifierList: any[] = [];

  selectRncpTitleForm = new UntypedFormControl('');
  rncpTitleList: any[] = [];
  rncpTitleId: string;

  selectClassForm = new UntypedFormControl('');
  classList: any[] = [];
  classId: string;

  selectTestForm = new UntypedFormControl('');
  testList: any[] = [];

  certifierListOriginal = [];
  titleListOriginal = [];
  classListOriginal = [];
  testListOriginal = [];
  invalidFormControls = [];

  isToggleDisable: boolean = false;

  juryType = [
    {value: 'retake_jury', key: '055_JURY.RETAKE_JURY'},
    {value: 'final_jury', key: '055_JURY.FINAL_JURY'},
    {value: 'grand_oral', key: '055_JURY.GRAND_ORAL'},
    {value: 'retake_grand_oral', key: '055_JURY.RETAKE_GRAND_ORAL'}
  ]

  juryActivity = [
    {value: 'visio_jury', key: '136_GO.visio_jury'},
    {value: 'offline_jury', key: '136_GO.offline_jury'},
    {value: 'off_platform_jury', key: '136_GO.off_platform_jury'}
  ]

  @ViewChild(MatSort, { static: true }) sort: MatSort;
  constructor(
    @Inject(MAT_DIALOG_DATA) public parentData: any,
    public dialogRef: MatDialogRef<JuryOrganizationDialogComponent>,
    private fb: UntypedFormBuilder,
    private juryService: JuryOrganizationService,
    private authService: AuthService,
    private translate: TranslateService,
    private router: Router,
    public permissionService: PermissionService,
    private tutorialService: TutorialService,
  ) {}

  ngOnInit() {
    this.createForm();
    this.getDropdownData();
    const juryType = this.juryType.map((item) => {
      return {value: item.value, key: this.translate.instant(item.key)}
    }).sort((a, b) => a.key.localeCompare(b.key));
    this.juryType = juryType;

    const juryActivity = this.juryActivity.map((item) => {
      return { value: item.value, key: this.translate.instant(item.key) }
    }).sort((a, b) => a.key.localeCompare(b.key));
    this.juryActivity = juryActivity;

    // If there is data being passed, mean its an edit
    if (this.parentData && this.parentData.data) {

      this.patchEditData();
    }
  }

  createForm() {
    this.juryForm = this.fb.group({
      name: ['', [Validators.required, removeSpaces]],
      type: [null, Validators.required],
      jury_activity: [null, Validators.required],
      certifier: [null, Validators.required],
      is_published: [true],
      jury_created_by: [this.authService.getCurrentUser()._id, Validators.required],
      rncp_titles: this.fb.array([this.initTitlesFormArray()]),
      safety_room: [false],
    });
  }

  getRncpTitlesFormArray(): UntypedFormArray {
    return this.juryForm.get('rncp_titles') as UntypedFormArray;
  }

  addRncpTitles() {
    this.getRncpTitlesFormArray().push(this.initTitlesFormArray());
  }

  initTitlesFormArray() {
    return this.fb.group({
      rncp_id: [null, Validators.required],
      class_id: [null, Validators.required],
      test_id: [null],
    });
  }

  updateTestData(value) {
    // Retake Grand Oral cannot have off platform at the moment, so incase user already select grand oral with off platform,
    // and then change to retake, we need to clear the jury activity field
    if (value === 'retake_grand_oral' && this.juryForm.get('jury_activity').value === 'off_platform_jury') {
      this.juryForm.get('jury_activity').patchValue('');
    }
    this.selectCertifierForm.patchValue(null);
    this.juryForm.get('certifier').patchValue(null, { emitEvent: false });
    this.getTitleList(null);
    if (value !== 'retake_jury' && value !== 'final_jury') {
      this.getRncpTitlesFormArray().at(0).get('test_id').clearValidators();
      this.getRncpTitlesFormArray().at(0).get('test_id').updateValueAndValidity();
      this.getCertifierSchoolForGrandOralList();
    } else {
      this.getRncpTitlesFormArray().at(0).get('test_id').setValidators(Validators.required);
      this.getRncpTitlesFormArray().at(0).get('test_id').updateValueAndValidity();
      this.getCertifierSchoolList();
    }
  }

  updateSafetyRoomData(value) {
    if (value !== 'visio_jury') {
      this.juryForm.get('safety_room').setValue(false);
    } else {
      this.isToggleDisable = false;
    }
  }

  patchEditData() {
    this.isEditing = true;
    const tempData = _.cloneDeep(this.parentData.data);
    if (tempData) {
      if (tempData.certifier && tempData.certifier._id) {
        this.certifierList.push(tempData.certifier);
        tempData.certifier = tempData.certifier._id;
      }
      // tempData.jury_member_required = !tempData.jury_member_not_required;
      if (tempData.jury_created_by && tempData.jury_created_by._id) {
        tempData.jury_created_by = tempData.jury_created_by._id;
      }
      if (tempData.rncp_titles && tempData.rncp_titles.length) {
        tempData.rncp_titles = tempData.rncp_titles.map((title) => {
          this.rncpTitleList.push(title.rncp_id);
          this.titleListOriginal.push(title.rncp_id);
          this.classList.push(title.class_id);
          this.classListOriginal.push(title.class_id);
          if (title.test_id && title.test_id._id) {
            this.testList.push(title.test_id);
            this.testListOriginal.push(title.test_id);
          }
          return {
            class_id: title.class_id && title.class_id._id ? title.class_id._id : null,
            rncp_id: title.rncp_id && title.rncp_id._id ? title.rncp_id._id : null,
            test_id: title.test_id && title.test_id._id ? title.test_id._id : null,
          };
        });

      }
    }

    const tempResult = _.omitBy(tempData, _.isNil);

    this.juryForm.patchValue(tempResult);
    this.savedForm = _.cloneDeep(this.juryForm.getRawValue());

    this.selectCertifierForm.patchValue(tempData.certifier);
    this.selectRncpTitleForm.patchValue(tempData.rncp_titles[0].rncp_id ? tempData.rncp_titles[0].rncp_id : '');
    this.selectClassForm.patchValue(tempData.rncp_titles[0].class_id ? tempData.rncp_titles[0].class_id : '');
    this.selectTestForm.patchValue(tempData.rncp_titles[0].test_id ? tempData.rncp_titles[0].test_id : '');
    this.selectCertifierForm.disable({ emitEvent: false });
    this.selectRncpTitleForm.disable({ emitEvent: false });
    this.selectClassForm.disable({ emitEvent: false });
    this.selectTestForm.disable({ emitEvent: false });
  }

  getDropdownData() {
    this.getCertifierSchoolList();
  }

  getCertifierSchoolList() {
    this.subs.sink = this.juryService.getCertifierSchoolJury().subscribe((resp) => {
      const result = _.cloneDeep(resp);
      this.certifierList = _.cloneDeep(result);
      this.certifierListOriginal = _.cloneDeep(result);
      this.certifierList = _.sortBy(this.certifierList, 'short_name');
      this.certifierListOriginal = _.sortBy(this.certifierListOriginal, 'short_name');
    });
  }

  getCertifierSchoolForGrandOralList() {
    this.subs.sink = this.juryService.getCertifierSchoolGrandOral().subscribe((resp) => {
      const result = _.cloneDeep(resp);
      this.certifierList = _.cloneDeep(result);
      this.certifierListOriginal = _.cloneDeep(result);
      this.certifierList = _.sortBy(this.certifierList, 'short_name');
      this.certifierListOriginal = _.sortBy(this.certifierListOriginal, 'short_name');
    });
  }

  getDropdownTitleGrand(certifierId) {
    this.subs.sink = this.juryService.getTitleListGrand(certifierId).subscribe((resp) => {
      const result = _.cloneDeep(resp);
      this.rncpTitleList = _.cloneDeep(result);
      this.titleListOriginal = _.cloneDeep(result);

    });
  }

  getDropdownTitleListJury(certifierId) {
    this.subs.sink = this.juryService.getTitleListJury(certifierId).subscribe((resp) => {
      const result = _.cloneDeep(resp);
      this.rncpTitleList = _.cloneDeep(result);
      this.titleListOriginal = _.cloneDeep(result);

    });
  }

  getTitleList(certifierId) {
    // Reset All dropdown and form control value after certifier form field
    this.rncpTitleList = [];
    this.titleListOriginal = [];
    this.classList = [];
    this.classListOriginal = [];
    this.testList = [];
    this.testListOriginal = [];
    this.selectRncpTitleForm.patchValue(null, { emitEvent: false });
    this.selectClassForm.patchValue(null, { emitEvent: false });
    this.selectTestForm.patchValue(null, { emitEvent: false });
    this.getRncpTitlesFormArray().at(0).get('rncp_id').patchValue(null, { emitEvent: false });
    this.getRncpTitlesFormArray().at(0).get('class_id').patchValue(null, { emitEvent: false });
    this.getRncpTitlesFormArray().at(0).get('test_id').patchValue(null, { emitEvent: false });


    const grandOralTypes = ['grand_oral', 'retake_grand_oral'];
    if (grandOralTypes.includes(this.juryForm.get('type').value)) {
      if (certifierId === null) {
        this.juryForm.get('certifier').patchValue(null, { emitEvent: false });
      } else {
        this.juryForm.get('certifier').patchValue(certifierId, { emitEvent: false });
        this.getDropdownTitleGrand(certifierId);
      }
    } else {
      if (certifierId === null) {
        this.juryForm.get('certifier').patchValue(null, { emitEvent: false });
      } else {
        this.juryForm.get('certifier').patchValue(certifierId, { emitEvent: false });
        this.getDropdownTitleListJury(certifierId);
      }
    }
  }

  getDropdownClassGO(titleId) {
    this.subs.sink = this.juryService.getClassGrandOralListJury(titleId).subscribe((resp) => {
      const result = _.cloneDeep(resp);
      this.classList = _.cloneDeep(result);
      this.classListOriginal = _.cloneDeep(result);

    });
  }

  getDropdownClassJury(titleId, isForRetake) {
    this.subs.sink = this.juryService.getClassListJury(titleId, isForRetake).subscribe((resp) => {
      const result = _.cloneDeep(resp);
      this.classList = _.cloneDeep(result);
      this.classListOriginal = _.cloneDeep(result);
    });
  }

  getClassList(titleId) {
    // Reset All dropdown list and form control after rncp title form field
    this.classList = [];
    this.classListOriginal = [];
    this.testList = [];
    this.testListOriginal = [];
    this.selectClassForm.patchValue(null, { emitEvent: false });
    this.selectTestForm.patchValue(null, { emitEvent: false });
    this.getRncpTitlesFormArray().at(0).get('class_id').patchValue(null, { emitEvent: false });
    this.getRncpTitlesFormArray().at(0).get('test_id').patchValue(null, { emitEvent: false });


    const isForRetake = this.juryForm.get('type').value === 'retake_jury' ? true : false;
    const grandOralTypes = ['grand_oral', 'retake_grand_oral'];
    if (grandOralTypes.includes(this.juryForm.get('type').value)) {
      if (titleId === null) {
        this.getRncpTitlesFormArray().at(0).get('rncp_id').patchValue(null, { emitEvent: false });
        this.rncpTitleId = null;
      } else {
        this.getRncpTitlesFormArray().at(0).get('rncp_id').patchValue(titleId, { emitEvent: false });
        this.rncpTitleId = titleId;
        this.getDropdownClassGO(titleId);
      }
    } else {
      if (titleId === null) {
        this.getRncpTitlesFormArray().at(0).get('rncp_id').patchValue(null, { emitEvent: false });
        this.rncpTitleId = null;
      } else {
        this.getRncpTitlesFormArray().at(0).get('rncp_id').patchValue(titleId, { emitEvent: false });
        this.rncpTitleId = titleId;
        this.getDropdownClassJury(titleId, isForRetake);
      }
    }
  }

  getDropDownTestJury(rncpId, classId, isForRetake) {
    this.subs.sink = this.juryService.getTestsListJury(rncpId, classId, isForRetake).subscribe((resp) => {
      const result = _.cloneDeep(resp);

      this.testList = _.cloneDeep(result);
      this.testListOriginal = _.cloneDeep(result);
    });
  }

  getTestList(classId) {
    // Reset Test Dropdown list and form control value
    this.testList = [];
    this.testListOriginal = [];
    this.selectTestForm.patchValue(null, { emitEvent: false });
    this.getRncpTitlesFormArray().at(0).get('test_id').patchValue(null, { emitEvent: false });


    const isForRetake = this.juryForm.get('type').value === 'retake_jury' ? true : false;
    if (this.rncpTitleId && classId) {

      this.getRncpTitlesFormArray().at(0).get('class_id').patchValue(classId, { emitEvent: false });
      this.classId = classId;
      this.getDropDownTestJury(this.rncpTitleId, classId, isForRetake);
    } else if (classId === null) {
      this.getRncpTitlesFormArray().at(0).get('class_id').patchValue(null, { emitEvent: false });
      this.classId = null;
    }
  }

  selectedTest(testId) {
    if (testId === null) {
      this.getRncpTitlesFormArray().at(0).get('test_id').patchValue(null, { emitEvent: false });
    } else {
      this.getRncpTitlesFormArray().at(0).get('test_id').patchValue(testId, { emitEvent: false });
    }
  }

  filterCertifier() {
    if (this.selectCertifierForm.value) {
      const searchString = this.selectCertifierForm.value.toLowerCase().trim();
      this.certifierList = this.certifierListOriginal.filter((cert) => cert.short_name.toLowerCase().trim().includes(searchString));
    } else {
      this.certifierList = this.certifierListOriginal;
      this.juryForm.get('certifier').patchValue(null, { emitEvent: false });
    }
  }

  filterRncpTitle() {
    if (this.selectRncpTitleForm.value) {
      const searchString = this.selectRncpTitleForm.value.toLowerCase().trim();
      this.rncpTitleList = this.titleListOriginal.filter((title) => title.short_name.toLowerCase().trim().includes(searchString));
    } else {
      this.rncpTitleList = this.titleListOriginal;
      this.getRncpTitlesFormArray().at(0).get('rncp_id').patchValue(null, { emitEvent: false });
    }
  }

  filterClass() {
    if (this.selectClassForm.value) {
      const searchString = this.selectClassForm.value.toLowerCase().trim();
      this.classList = this.classListOriginal.filter((className) => className.name.toLowerCase().trim().includes(searchString));
    } else {
      this.classList = this.classListOriginal;
      this.getRncpTitlesFormArray().at(0).get('class_id').patchValue(null, { emitEvent: false });
    }
  }

  filterTest() {
    if (this.selectTestForm.value) {
      const searchString = this.selectTestForm.value.toLowerCase().trim();
      this.testList = this.testListOriginal.filter((test) => test.name.toLowerCase().trim().includes(searchString));
    } else {
      this.testList = this.testListOriginal;
      this.getRncpTitlesFormArray().at(0).get('test_id').patchValue(null, { emitEvent: false });
    }
  }

  createPayload() {
    const payload = _.cloneDeep(this.juryForm.getRawValue());

    // todo: should use map instead of foreach here
    // if (payload && payload.rncp_titles && payload.rncp_titles.length) {
    //   payload.rncp_titles.forEach((eachTitle) => {
    //     eachTitle.rncp_id = eachTitle.rncp_id && eachTitle.rncp_id._id ? eachTitle.rncp_id._id : null;
    //     eachTitle.class_id = eachTitle.class_id && eachTitle.class_id._id ? eachTitle.class_id._id : null;
    //     eachTitle.test_id = eachTitle.test_id && eachTitle.test_id._id ? eachTitle.test_id._id : null;
    //   });
    // }

    // If editing, we should not pass anything other than name and sliders
    if (this.isEditing) {
      const tempPayload = {
        name: payload.name,
        safety_room: payload.safety_room,
      };
      return tempPayload;
    }

    // payload.jury_member_not_required = !payload.jury_member_required;
    // delete payload.jury_member_required;
    // delete payload.online_jury_organization;
    return payload;
  }

  SubmitWithSwalConfirmation(){
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('CREATE_JURY_S1.TITLE'),
      html: this.translate.instant('CREATE_JURY_S1.TEXT'),
      footer: `<span style="margin-left: auto">CREATE_JURY_S1</span>`,
      allowOutsideClick: false,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('CREATE_JURY_S1.BUTTON 1'),
      cancelButtonText: this.translate.instant('CREATE_JURY_S1.BUTTON 2'),
    }).then((resp)=>{
      if (resp.value) {
        this.submitForm()
      }else{
        return
      }
    })
  }

  submitForm() {
    this.isWaitingForResponse = true;
    this.invalidFormControls = [];
    const payload = this.createPayload();
    if (this.juryForm.invalid || this.selectCertifierForm.invalid || this.selectRncpTitleForm.invalid || this.selectClassForm.invalid) {
      this.checkIsFormInvalid(this.juryForm);
      // this.checkIsFormInvalid(this.selectCertifierForm);
      // this.checkIsFormInvalid(this.selectRncpTitleForm);
      // this.checkIsFormInvalid(this.selectClassForm);

      let li = '';
      this.invalidFormControls.forEach((item) => {
        return (li = li + `<li>${item}</li>`);
      });
      const formatTextSwal = `<ul style="text-align: start;">${li}</ul>`;
      this.formInvalidSwal(formatTextSwal);
      this.isWaitingForResponse = false;
      this.juryForm.markAllAsTouched();
      this.selectCertifierForm.markAsTouched();
      this.selectRncpTitleForm.markAsTouched();
      this.selectClassForm.markAsTouched();
      this.selectTestForm.markAsTouched();
      // Swal.fire({
      //   type: 'warning',
      //   title: this.translate.instant('FormSave_S1.TITLE'),
      //   html: this.translate.instant('FormSave_S1.TEXT'),
      //   confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
      //   allowEnterKey: false,
      //   allowEscapeKey: false,
      //   allowOutsideClick: false,
      // });
    } else {

      if (this.isEditing) {
        this.subs.sink = this.juryService.updateJuryOrganization(this.parentData.data._id, payload).subscribe(
          (resp) => {
            if (resp) {
              Swal.fire({
                type: 'success',
                title: this.translate.instant('JURY_ORGANIZATION.JURY_S1b.TITLE', {
                  jury_Organization_Name: this.juryForm.get('name').value,
                }),
                footer: `<span style="margin-left: auto">JURY_S1b</span>`,
                allowEscapeKey: true,
                allowOutsideClick: false,
                confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S1b.CONFIRM_BTN'),
              }).then(() => {
                this.isWaitingForResponse = false;
                this.closeDialog(true);
              });
            }
          },
          (err) => this.swalError(err),
        );
      } else {
        payload.is_new_flow = true;
        this.subs.sink = this.juryService.createJuryOrganization(payload).subscribe(
          (resp) => {
            if (resp) {
              Swal.fire({
                type: 'success',
                title: this.translate.instant('JURY_ORGANIZATION.JURY_S1.TITLE', {
                  jury_Organization_Name: this.juryForm.get('name').value,
                }),
                footer: `<span style="margin-left: auto">JURY_S1</span>`,
                allowEscapeKey: true,
                allowOutsideClick: false,
                confirmButtonText: this.translate.instant('JURY_ORGANIZATION.JURY_S1.CONFIRM_BTN'),
              }).then(() => {
                this.isWaitingForResponse = false;
                this.closeDialog(true);
              });
            }
          },
          (err) => this.swalError(err),
        );
      }
    }
  }

  formInvalidSwal(formatTextSwal) {
    Swal.fire({
      type: 'error',
      title: this.translate.instant('TMTC_S02.TITLE'),
      html: `${this.translate.instant('TMTC_S02.TEXT')} <br><br>
             ${this.translate.instant('Required section')} : <br> 
             ${formatTextSwal}`,
      footer: `<span style="margin-left: auto">TMTC_S02</span>`,
      confirmButtonText: this.translate.instant('TMTC_S02.BUTTON_1'),
      allowOutsideClick: false,
    });
  }

  checkIsFormInvalid(form) {

    Object.keys(form.controls).forEach((controlEl) => {
      const control = form.get(controlEl);
      if (control instanceof UntypedFormControl) {
        control.markAsTouched();
        if (control.parent && control.invalid && control.parent.get('question_name')) {
          this.invalidFormControls.push(control.parent.get('question_name').value);
        }
        if (control.invalid) {
          switch (controlEl) {
            case 'name':
              this.invalidFormControls.push(this.translate.instant('JURY_ORGANIZATION.NAME'));
              break;
            case 'type':
              this.invalidFormControls.push(this.translate.instant('JURY_ORGANIZATION.JURY_TYPE'));
              break;
            case 'jury_activity':
              this.invalidFormControls.push(this.translate.instant('136_GO.Jury characteristic'));
              break;
            case 'certifier':
              this.invalidFormControls.push(this.translate.instant('Select Certifier'));
              break;
            case 'rncp_id':
              this.invalidFormControls.push(this.translate.instant('Select RNCP Title'));
              break;
            case 'class_id':
              this.invalidFormControls.push(this.translate.instant('Export_S1.SELECTCLASS'));
              break;
            case 'test_id':
              this.invalidFormControls.push(this.translate.instant('Export_S1.SELECTTEST'));
              break;
            default:
              break;
          }
        }
      } else if (control instanceof UntypedFormGroup || control instanceof UntypedFormArray) {
        control.markAllAsTouched();
        this.checkIsFormInvalid(control);
      }
    });
  }

  swalError(err) {
    this.isWaitingForResponse = false;

    if (err['message'] === 'GraphQL error: Cannot create. retake already exists due end date') {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('RGO_S11.TITLE'),
        html: this.translate.instant('RGO_S11.TEXT'),
        footer: `<span style="margin-left: auto">RGO_S11</span>`,
        confirmButtonText: this.translate.instant('RGO_S11.BUTTON 1'),
      });
    } else if (err['message'] === 'GraphQL error: Jury with this name already exists') {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('Uniquename_S1.TITLE'),
        text: this.translate.instant('Uniquename_S1.TEXT'),
        footer: `<span style="margin-left: auto">Uniquename_S1</span>`,
        confirmButtonText: this.translate.instant('Uniquename_S1.BUTTON'),
      });
    } else {
      // Message : "Jury with this title and class already exists, Test 3, id 62da1c7de774ce0a23f2ed60",
      if (err['message'].split(',').length > 1) {
        let errorMessage = err['message'].split(',')[0];
        let juryName = err['message'].split(',')[1];
        let juryId = err['message'].split(',')[2].split(' ')[2];
        if (errorMessage === 'GraphQL error: Jury with this title and class already exists') {
          Swal.fire({
            type: 'warning',
            title: this.translate.instant('GO_S7.TITLE'),
            html: this.translate.instant('GO_S7.TEXT', { jury_organization_name: juryName }),
            footer: `<span style="margin-left: auto">GO_S7</span>`,
            confirmButtonText: this.translate.instant('GO_S7.BUTTON_1'),
            showCancelButton: true,
            cancelButtonText: this.translate.instant('GO_S7.BUTTON_2'),
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then((result) => {
            if (result.value) {
              this.isWaitingForResponse = true;
              this.subs.sink = this.juryService.getOneJuryOrganizationDataById(juryId).subscribe((resp) => {
                this.isWaitingForResponse = false;
                this.goToJuryDetail(resp);
                this.dialogRef.close();
                return;
              });
            }
          });
        }
      } else {
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      }
    }
  }

  goToJuryDetail(juryData) {
    if (juryData && juryData.name) {
      this.tutorialService.setJuryName(juryData.name);
    }
    const juryOrgId = juryData && juryData._id ? juryData._id : '';

    const grandOralTypes = ['grand_oral', 'retake_grand_oral'];
    if (juryData && grandOralTypes.includes(juryData.type)) {
      if (this.permissionService.showMenu('certifications.jury_organization.organize_juries.show_perm')) {
        if (
          juryData.current_status === 'set_up_grand_oral_parameter' &&
          this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_jury.show_perm')
        ) {
          this.router.navigate(['jury-organization', juryOrgId, 'organize-juries', 'grand-oral-jury-parameter']);
        } else if (
          juryData.current_status === 'assign_number_jury' &&
          this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_jury.show_perm')
        ) {
          if (juryData.is_new_flow) {
            this.router.navigate(['jury-organization', 'setup-schedule-go'], { queryParams: { id: juryOrgId } });
          } else {
            this.router.navigate(['jury-organization', juryOrgId, 'organize-juries', 'assign-jury']);
          }
        } else if (
          juryData.current_status === 'assign_president_jury' &&
          this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_president_jury.show_perm')
        ) {
          if (juryData.is_new_flow) {
            this.router.navigate(['jury-organization', 'setup-schedule-go'], { queryParams: { id: juryOrgId } });
          } else {
            this.router.navigate(['jury-organization', juryOrgId, 'organize-juries', 'assign-president-jury']);
          }
        } else if (
          (juryData.current_status === 'assign_member_jury' || juryData.current_status === 'assign_student_jury') &&
          this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_student.show_perm')
        ) {
          if (juryData.type === 'grand_oral') {
            if (juryData.is_new_flow) {
              this.router.navigate(['jury-organization', 'setup-schedule-go'], { queryParams: { id: juryOrgId } });
            } else {
              this.router.navigate(['jury-organization', juryOrgId, 'organize-juries', 'assign-student-table']);
            }
          } else if (juryData.type === 'retake_grand_oral') {
            this.router.navigate(['jury-organization', 'setup-schedule'], { queryParams: { id: juryOrgId } });
          }
        } else if (
          juryData.current_status === 'done' &&
          this.permissionService.showMenu('certifications.jury_organization.jury_organization_schedule_jury.show_perm')
        ) {
          if (juryData.jury_activity === 'off_platform_jury' && juryData.is_new_flow === true) {
            this.router.navigate(['jury-organization', juryOrgId, 'jury-mark-entry']);
          } else {
            this.router.navigate(['jury-organization', juryOrgId, 'schedule-juries']);
          }
        } else if (this.permissionService.showMenu('certifications.jury_organization.jury_organization_schedule_jury.show_perm')) {
          if (juryData.jury_activity === 'off_platform_jury' && juryData.is_new_flow === true) {
            this.router.navigate(['jury-organization', juryOrgId, 'jury-mark-entry']);
          } else {
            this.router.navigate(['jury-organization', juryOrgId, 'schedule-juries']);
          }
        }
      } else if (this.permissionService.showMenu('certifications.jury_organization.schedule_juries.show_perm')) {
        if (juryData.jury_activity === 'off_platform_jury' && juryData.is_new_flow === true) {
          this.router.navigate(['jury-organization', juryOrgId, 'jury-mark-entry']);
        } else {
          this.router.navigate(['jury-organization', juryOrgId, 'schedule-juries']);
        }
      }
    } else {
      if (this.permissionService.showMenu('certifications.jury_organization.organize_juries.show_perm')) {
        if (
          juryData.current_status === 'assign_number_jury' &&
          this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_jury.show_perm')
        ) {
          this.router.navigate(['jury-organization', juryOrgId, 'organize-juries', 'assign-jury']);
        } else if (
          juryData.current_status === 'assign_president_jury' &&
          this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_president_jury.show_perm')
        ) {
          this.router.navigate(['jury-organization', juryOrgId, 'organize-juries', 'assign-president-jury']);
        } else if (
          (juryData.current_status === 'assign_member_jury' || juryData.current_status === 'assign_student_jury') &&
          this.permissionService.showMenu('certifications.jury_organization.jury_organization_assign_student.show_perm')
        ) {
          this.router.navigate(['jury-organization', juryOrgId, 'organize-juries', 'assign-student-table']);
        } else if (
          juryData.current_status === 'done' &&
          this.permissionService.showMenu('certifications.jury_organization.jury_organization_schedule_jury.show_perm')
        ) {
          this.router.navigate(['jury-organization', juryOrgId, 'schedule-juries']);
        } else if (this.permissionService.showMenu('certifications.jury_organization.jury_organization_schedule_jury.show_perm')) {
          this.router.navigate(['jury-organization', juryOrgId, 'schedule-juries']);
        }
      } else if (this.permissionService.showMenu('certifications.jury_organization.schedule_juries.show_perm')) {
        this.router.navigate(['jury-organization', juryOrgId, 'schedule-juries']);
      }
    }
  }

  validateSafetyRoom(event: MatSlideToggleChange) {

    if (event && !event.checked) {
      this.juryForm.get('safety_room').patchValue(false);
    }
  }

  isDataChanged() {
    const savedData = JSON.stringify(this.savedForm);
    const currentData = JSON.stringify(this.juryForm.getRawValue());
    if (savedData !== currentData) {
      return true;
    } else {
      return false;
    }
  }

  closeDialog(isReloadData?: boolean) {
    this.dialogRef.close(isReloadData);
  }

  displayFnCertifier(value: any) {

    if (value) {
      const list = this.certifierList;
      const found = _.find(list, (res) => res._id === value);
      let result = '';
      if (found) {
        result = found.short_name;
      }
      return result;
    }
  }

  displayFnTitle(value: any) {

    if (value) {
      const list = this.rncpTitleList;
      const found = _.find(list, (res) => res._id === value);
      let result = '';
      if (found) {
        result = found.short_name;
      }
      return result;
    }
  }

  displayFnClass(value: any) {

    if (value) {
      const list = this.classList;
      const found = _.find(list, (res) => res._id === value);
      let result = '';
      if (found) {
        result = found.name;
      }
      return result;
    }
  }

  displayFnTest(value: any) {

    if (value) {
      const list = this.testList;
      const found = _.find(list, (res) => res._id === value);
      let result = '';
      if (found) {
        result = found.name;
      }
      return result;
    }
  }

  clearJuryType() {
    this.juryForm.get('jury_activity').patchValue(null);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  // isAvailable(title) {
  //   return !this.getRncpTitlesFormArray().value.some((addedTitle) => {
  //     return title.class_id._id === addedTitle.class_id._id;
  //   })
  // }
}
