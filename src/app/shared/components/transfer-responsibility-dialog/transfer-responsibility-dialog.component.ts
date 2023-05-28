import { Component, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { TransferResponsibilityService } from 'app/service/transfer-responsibility/transfer-responsibility.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { Observable, of } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { TransferResponsibilityPayload } from './transfer-responsibility-model';
import * as _ from 'lodash';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-transfer-responsibility-dialog',
  templateUrl: './transfer-responsibility-dialog.component.html',
  styleUrls: ['./transfer-responsibility-dialog.component.scss']
})
export class TransferResponsibilityDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  transferResponsibilityForm: UntypedFormGroup;
  isWaitingForResponse = false;

  schoolFilterList = [];
  schoolFilter = new UntypedFormControl('');
  filteredSchoolList: Observable<{_id: string, short_name: string}[]>;

  titleFilterList = [];
  titleFilter = new UntypedFormControl('');
  filteredTitleList: Observable<{_id: string, short_name: string}[]>;

  classFilterList = [];
  classFilter = new UntypedFormControl('');
  filteredClassList: Observable<{_id: string, short_name: string}[]>;

  userTypeFilterList = [
    {
      name: 'Academic Director',
      _id: '5a2e1ecd53b95d22c82f9554',
      transfer_for: 'acad_dir'
    },
    {
      name: 'Certifier Admin',
      _id: '5a2e1ecd53b95d22c82f9550',
      transfer_for: 'cert_admin'
    }
  ]

  userFromFilterList = [];
  userFromFilter = new UntypedFormControl('');
  filteredUserFromList: Observable<{_id: string, short_name: string}[]>;

  userToFilterList = [];
  userToFilter = new UntypedFormControl('');
  filteredUserToList: Observable<{_id: string, short_name: string}[]>;

  constructor(
    public dialogRef: MatDialogRef<TransferResponsibilityDialogComponent>,
    private fb: UntypedFormBuilder,
    private utilService: UtilityService,
    public translate: TranslateService,
    private transferRespService: TransferResponsibilityService
  ) { }

  ngOnInit() {
    this.initForm();
    this.getDataDropdown();
    this.initFilterListener();
  }

  initForm() {
    this.transferResponsibilityForm = this.fb.group({
      schoolId: [null, [Validators.required]],
      rncpId: [null, [Validators.required]],
      classId: [null],
      userTypeId: [null, [Validators.required]],
      transferFor: [null, [Validators.required]],
      lang: [this.translate.currentLang, [Validators.required]],
      transfer_from: [null, [Validators.required]],
      transfer_to: [null, [Validators.required]],
    });
  }

  getDataDropdown() {
    this.subs.sink = this.transferRespService.getSchoolsForTransferDropdown().subscribe(response => {
      this.schoolFilterList = _.cloneDeep(response);
      this.filteredSchoolList = of(this.schoolFilterList);
    })
  }

  setSchool(schoolId) {
    this.transferResponsibilityForm.get('schoolId').patchValue(schoolId);
    this.setTitle(null);
    this.titleFilter.patchValue('');
    // this.transferResponsibilityForm.get('rncpId').patchValue(null);
    // this.titleFilter.patchValue('');
    // this.transferResponsibilityForm.get('classId').patchValue(null);
    // this.classFilter.patchValue('');
    // this.transferResponsibilityForm.get('userTypeId').patchValue(null);
    // this.transferResponsibilityForm.get('transferFor').patchValue(null);
    // this.transferResponsibilityForm.get('transfer_from').patchValue(null);
    // this.userFromFilter.patchValue('');
    // this.transferResponsibilityForm.get('transfer_to').patchValue(null);
    // this.userToFilter.patchValue('');

    if (schoolId) {
      this.subs.sink = this.transferRespService.getTitleDropdownBySchool([schoolId]).subscribe(response => {
        this.titleFilterList = _.cloneDeep(response);
        this.filteredTitleList = of(this.titleFilterList);
      })
    }
  }

  setTitle(titleId) {

    this.transferResponsibilityForm.get('rncpId').patchValue(titleId);
    this.setClass(null);
    this.classFilter.patchValue('');
    // this.transferResponsibilityForm.get('classId').patchValue(null);
    // this.classFilter.patchValue('');
    // this.transferResponsibilityForm.get('userTypeId').patchValue(null);
    // this.transferResponsibilityForm.get('transferFor').patchValue(null);
    // this.transferResponsibilityForm.get('transfer_from').patchValue(null);
    // this.userFromFilter.patchValue('');
    // this.transferResponsibilityForm.get('transfer_to').patchValue(null);
    // this.userToFilter.patchValue('');
    if (titleId) {
      this.subs.sink = this.transferRespService.getClassDropdownByTitle(titleId).subscribe(response => {
        this.classFilterList = _.cloneDeep(response);
        this.filteredClassList = of(this.classFilterList);
      })
    }
  }

  setUserType(userType: {name: string, _id: string, transfer_for: string}) {


    if (userType) {
      this.transferResponsibilityForm.get('transferFor').patchValue(userType.transfer_for);
    } else {
      this.transferResponsibilityForm.get('transferFor').patchValue(null);
    }
    this.transferResponsibilityForm.get('classId').patchValue(null);
    this.setClass(null);
    this.classFilter.patchValue('');
    this.transferResponsibilityForm.get('transfer_from').patchValue(null);
    this.userFromFilter.patchValue('');
    this.transferResponsibilityForm.get('transfer_to').patchValue(null);
    this.userToFilter.patchValue('');
    this.getUserFromData()
  }

  getUserFromData() {
    const schoolId = this.transferResponsibilityForm.get('schoolId').value;
    const titleId = this.transferResponsibilityForm.get('rncpId').value;
    const classId = this.transferResponsibilityForm.get('classId').value;
    const userTypeId = this.transferResponsibilityForm.get('userTypeId').value;
    let needClass = false;

    if (this.transferResponsibilityForm.get('transferFor').value === 'cert_admin') {
      needClass = true;
    } else if (this.transferResponsibilityForm.get('transferFor').value === 'acad_dir' && classId) {
      needClass = true;
    }

    if (schoolId && titleId && userTypeId && needClass) {
      this.subs.sink = this.transferRespService.getUserFromDropdown([schoolId], [titleId], classId, [userTypeId]).subscribe(response => {

        if (response && response.length) {
          this.userFromFilterList = _.cloneDeep(response);
          this.filteredUserFromList = of(this.userFromFilterList);
        } else {
          this.userFromFilterList = [];
          this.filteredUserFromList = of(this.userFromFilterList);
          Swal.fire({
            type: 'error',
            title: this.translate.instant('no_user_from_045.TITLE'),
            text: this.translate.instant('no_user_from_045.TEXT'),
            confirmButtonText: this.translate.instant('no_user_from_045.BUTTON'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false
          })
        }
      })
    }
  }

  setClass(classId) {
    this.transferResponsibilityForm.get('classId').patchValue(classId);
    this.transferResponsibilityForm.get('transfer_from').patchValue(null);
    this.userFromFilter.patchValue('');
    this.transferResponsibilityForm.get('transfer_to').patchValue(null);
    this.userToFilter.patchValue('');

    this.getUserFromData()
  }

  setUserFrom(userFromId) {
    this.transferResponsibilityForm.get('transfer_from').patchValue(userFromId);
    this.transferResponsibilityForm.get('transfer_to').patchValue(null);
    this.userToFilter.patchValue('');

    this.getUserToData();

    // this.getUserFromData()
  }

  getUserToData() {
    const schoolId = this.transferResponsibilityForm.get('schoolId').value;
    const usersFor = this.transferResponsibilityForm.get('transferFor').value;
    const transferFromId = this.transferResponsibilityForm.get('transfer_from').value;

    if (schoolId && usersFor && transferFromId) {
      this.subs.sink = this.transferRespService.getUserToDropdown(schoolId, usersFor, transferFromId).subscribe(response => {

        if (response && response.length) {
          this.userToFilterList = _.cloneDeep(response);
          this.filteredUserToList = of(this.userToFilterList);
        } else {
          this.userToFilterList = [];
          this.filteredUserToList = of(this.userToFilterList);
          Swal.fire({
            type: 'error',
            title: this.translate.instant('no_user_from_045.TITLE'),
            text: this.translate.instant('no_user_from_045.TEXT'),
            confirmButtonText: this.translate.instant('no_user_from_045.BUTTON'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false
          })
        }
      })
    }
  }

  setUserTo(userToId) {
    this.transferResponsibilityForm.get('transfer_to').patchValue(userToId);


  }

  initFilterListener() {
    // *************** Start Listening For valuechanges so we can update the value of dropdown
    this.subs.sink = this.schoolFilter.valueChanges.pipe(debounceTime(100)).subscribe((input) => {
      if (typeof input === 'string' && !this.utilService.checkIfStringMongoDBID(input)) {
        const result = this.schoolFilterList.filter((school) =>
          this.utilService.simplifyRegex(school.short_name).includes(this.utilService.simplifyRegex(input)),
        );

        this.filteredSchoolList = of(result);
      }
    });

    this.subs.sink = this.titleFilter.valueChanges.pipe(debounceTime(100)).subscribe((input) => {
      if (typeof input === 'string' && !this.utilService.checkIfStringMongoDBID(input)) {
        const result = this.titleFilterList.filter((title) =>
          this.utilService.simplifyRegex(title.short_name).includes(this.utilService.simplifyRegex(input)),
        );

        this.filteredTitleList = of(result);
      }
    });

    this.subs.sink = this.classFilter.valueChanges.pipe(debounceTime(100)).subscribe((input) => {
      if (typeof input === 'string' && !this.utilService.checkIfStringMongoDBID(input)) {
        const result = this.classFilterList.filter((classData) =>
          this.utilService.simplifyRegex(classData.name).includes(this.utilService.simplifyRegex(input)),
        );

        this.filteredClassList = of(result);
      }
    });

    this.subs.sink = this.userFromFilter.valueChanges.pipe(debounceTime(100)).subscribe((input) => {
      if (typeof input === 'string' && !this.utilService.checkIfStringMongoDBID(input)) {
        const result = this.userFromFilterList.filter((userFrom) =>
          this.utilService.simplifyRegex(userFrom.last_name).includes(this.utilService.simplifyRegex(input)),
        );

        this.filteredUserFromList = of(result);
      }
    });

    this.subs.sink = this.userToFilter.valueChanges.pipe(debounceTime(100)).subscribe((input) => {
      if (typeof input === 'string' && !this.utilService.checkIfStringMongoDBID(input)) {
        const result = this.userToFilterList.filter((userTo) =>
          this.utilService.simplifyRegex(userTo.last_name).includes(this.utilService.simplifyRegex(input)),
        );

        this.filteredUserToList = of(result);
      }
    });
  }

  transferStudent() {
    this.isWaitingForResponse = true;
    const payload: TransferResponsibilityPayload = this.transferResponsibilityForm.value;


    this.subs.sink = this.transferRespService.submitTransferResponsibility(payload).subscribe(response => {

      this.isWaitingForResponse = false;
      if (response) {
        Swal.fire({
          type: 'success',
          title: 'Bravo!'
        }).then(result => {
          this.dialogRef.close();
        })
      }
    })
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
