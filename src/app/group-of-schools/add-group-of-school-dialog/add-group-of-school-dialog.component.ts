import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SubSink } from 'subsink';
import { removeSpaces } from 'app/service/customvalidator.validator';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { SchoolService } from 'app/service/schools/school.service';
import { Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { UtilityService } from 'app/service/utility/utility.service';
import { PermissionService } from 'app/service/permission/permission.service';

@Component({
  selector: 'ms-add-group-of-school-dialog',
  templateUrl: './add-group-of-school-dialog.component.html',
  styleUrls: ['./add-group-of-school-dialog.component.scss'],
})
export class AddGroupOfSchoolDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();

  addGroupofSchoolForm: UntypedFormGroup;

  originalPCList = [];
  filteredHQList = [];
  filteredPCList = [];
  HQSelected: any;

  isEdit = false;

  headQuarterFilterList = [];
  headQuarterFilter = new UntypedFormControl('');
  filteredHeadQuearter: Observable<string[]>;

  schoolMemberFilterList = [];
  schoolMemberFilter = new UntypedFormControl('');
  filteredSchoolMember: Observable<string[]>;

  constructor(
    private fb: UntypedFormBuilder,
    private schoolService: SchoolService,
    public dialogRef: MatDialogRef<AddGroupOfSchoolDialogComponent>,
    private translate: TranslateService,
    private utilService: UtilityService,
    private permissionService: PermissionService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit() {
    this.getAllPC();
    this.initForm();
  }

  getAllPC() {
    this.subs.sink = this.schoolService.getGroupMemberDropdownSchool().subscribe((resp) => {

      this.originalPCList = resp;
      this.filteredHQList = _.cloneDeep(this.originalPCList);
      this.filteredPCList = _.cloneDeep(this.originalPCList);
      if (this.data && this.data._id) {
        this.patchEdit();
      }
    });
  }

  initForm() {
    this.addGroupofSchoolForm = this.fb.group({
      group_name: ['', [Validators.required, removeSpaces]],
      headquarter: [null, [Validators.required, removeSpaces]],
      school_members: [[], [Validators.required]],
    });
  }

  patchEdit() {
    this.isEdit = true;
    const data = _.cloneDeep(this.data);
    if (data && data.headquarter && data.headquarter._id) {
      this.originalPCList.push(data.headquarter);
      data.headquarter = data.headquarter._id;
    }
    if (data && data.school_members && data.school_members.length) {
      this.originalPCList = this.originalPCList.concat(data.school_members);
      data.school_members = data.school_members.map((school) => school._id);
    }

    const temp = this.originalPCList.sort((school_1, school_2) => {
      if (this.utilService.simplifyRegex(school_1.short_name) < this.utilService.simplifyRegex(school_2.short_name)) {
        return -1;
      } else if (this.utilService.simplifyRegex(school_1.short_name) > this.utilService.simplifyRegex(school_2.short_name)) {
        return 1;
      } else {
        return 0;
      }
    });
    this.originalPCList = _.cloneDeep(_.uniqBy(temp, 'short_name'));
    this.filteredHQList = _.cloneDeep(this.originalPCList);
    this.filteredPCList = _.cloneDeep(this.originalPCList);
    this.addGroupofSchoolForm.patchValue(data);
    this.filterOutHQ();
    this.filterOutSchoolMember();
  }

  filterOutHQ() {

    this.HQSelected = this.addGroupofSchoolForm.get('headquarter').value;
    this.filteredPCList = this.originalPCList.filter((PC) => PC._id !== this.HQSelected);
  }

  filterOutSchoolMember() {
    const data = this.addGroupofSchoolForm.get('school_members').value;
    this.filteredHQList = this.originalPCList.filter((PC) => {
      return data.filter((member) => member === PC._id).length === 0
    });
  }

  submit() {

    if (this.isEdit) {
      this.schoolService.editGroupOfSchool(this.data._id, this.addGroupofSchoolForm.value).subscribe(
        (resp) => {

          if (resp) {
            Swal.fire({
              type: 'success',
              title: 'Bravo',
            }).then(() => {
              this.dialogRef.close('reset');
            });
          }
        },
        (err) => {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('GROUPOFSCHOOL.Name must be unique'),
            allowOutsideClick: false,
          });
        },
      );
    } else {
      this.schoolService.createGroupOfSchool(this.addGroupofSchoolForm.value).subscribe(
        (resp) => {

          if (resp) {
            Swal.fire({
              type: 'success',
              title: 'Bravo',
            }).then(() => {
              this.dialogRef.close('reset');
            });
          }
        },
        (err) => {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('GROUPOFSCHOOL.Name must be unique'),
            allowOutsideClick: false,
          });
        },
      );
    }
  }

  closeDialog() {
    this.dialogRef.close();
    this.subs.unsubscribe();
  }

  showButtonCancel() {
    if(this.data?._id) {
      return this.permissionService.btnCancelEditGroupofSchoolPerm()
    } else {
      return this.permissionService.showBtnCancelAddGroupofSchoolPerm()
    }
  }

  showButtonSubmit() {
    if(this.data?._id) {
      return this.permissionService.btnSubmitEditGroupofSchoolPerm()
    } else {
      return this.permissionService.showBtnSubmitAddGroupofSchoolPerm()
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.originalPCList = [];
  }
}
