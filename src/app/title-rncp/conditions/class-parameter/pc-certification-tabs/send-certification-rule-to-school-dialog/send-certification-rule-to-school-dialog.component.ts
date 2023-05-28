import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';
import { CertificationRuleService } from 'app/service/certification-rule/certification-rule.service';

@Component({
  selector: 'ms-send-certification-rule-to-school-dialog',
  templateUrl: './send-certification-rule-to-school-dialog.component.html',
  styleUrls: ['./send-certification-rule-to-school-dialog.component.scss']
})
export class SendCertificationRuleToSchoolDialogComponent implements OnInit {

  private subs = new SubSink()
  isWaitingForResponse: boolean = false;
  schoolForm: FormGroup;
  schoolDropdownListOri = [];
  schoolDropdownList = [];
  selectedSchoolList = [];

  certRuleDatas = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<SendCertificationRuleToSchoolDialogComponent>,
    private fb: FormBuilder,
    private rncpTitlesService: RNCPTitlesService,
    private translate: TranslateService,
    private certificationRuleService: CertificationRuleService
  ) { }

  ngOnInit(): void {

    this.initForm();
    this.getSchoolDropdown();
    if(this.data?.certificationStudent) {
      this.certRuleDatas = _.cloneDeep(this.data.certificationStudent);
    } else {
      this.getAllCertificationRules();
    }
  }

  initForm() {
    this.schoolForm = this.fb.group({
      school_ids: [[]]
    });
  }

  getSchoolDropdown() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitlesService.getSchoolListByClass(this.data.rncpId, this.data.classId).subscribe(
      (resp) => {
        if(resp) {
          this.isWaitingForResponse = false;
          let schools = _.cloneDeep(resp);
          schools = _.sortBy(schools, 'short_name');
          this.schoolDropdownListOri = schools;
          this.schoolDropdownList = schools;
        } else {
          this.isWaitingForResponse = false;
          this.schoolDropdownListOri = [];
          this.schoolDropdownList = [];
        }
      },
      (err) => {
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      }
    )
  }

  getAllCertificationRules() {
    this.isWaitingForResponse = true;
    const filter = {
      rncp_id: this.data.rncpId,
      class_id: this.data.classId,
    }
    this.subs.sink = this.certificationRuleService.getAllCertificationRules(filter).subscribe((resp) => {
      this.isWaitingForResponse = false;
      if (resp && resp.length) {
        this.certRuleDatas = _.cloneDeep(resp);
      }
    })
  }

  selectSchool() {
    const selectedSchool = this.schoolForm.get('school_ids').value;
    
    if(selectedSchool && selectedSchool.length) {
      let schoolSelected = [];
      let schoolUnselected = [];

      selectedSchool.forEach((selectedSchoolId) => {
        // add selected school
        schoolSelected = this.schoolDropdownListOri.filter((school) => school._id === selectedSchoolId);
        this.selectedSchoolList.push(...schoolSelected);

        // remove selected school from dropdown
        schoolUnselected = this.schoolDropdownList.filter((school) => school._id !== selectedSchoolId);
        this.schoolDropdownList = schoolUnselected;
      });
      
      this.schoolForm.get('school_ids').patchValue([]);
    }
  }

  unselectSchool(school) {
    // remove school from UI tag
    let schoolSelected = this.selectedSchoolList.filter((selectedSchool) => selectedSchool._id !== school._id);
    this.selectedSchoolList = schoolSelected;

    // add school into dropdown
    let schoolUnselected = this.schoolDropdownListOri.filter((schoolOri) => schoolOri._id === school._id);
    this.schoolDropdownList.push(...schoolUnselected);
    this.schoolDropdownList = _.sortBy(this.schoolDropdownList, 'short_name');
  }

  checkBox() {
    const schoolInput = this.schoolForm.get('school_ids').value.length;
    const schoolDropdown = this.schoolDropdownList.length;
    if (schoolInput === schoolDropdown) {
      return true;
    } else {
      return false;
    }
  }

  checkBoxIndeterminate() {
    const schoolInput = this.schoolForm.get('school_ids').value.length;
    const schoolDropdown = this.schoolDropdownList.length;
    if (schoolInput !== schoolDropdown && schoolInput !== 0) {
      return true;
    } else {
      return false;
    }
  }

  selectedAllSchool(event) {
    const schoolDropdown = this.schoolDropdownList.map((school) => school._id)
    const schoolInput = this.schoolForm.get('school_ids');
    if (event.checked) {
      schoolInput.patchValue(schoolDropdown, { emitEvent: false });
    } else {
      schoolInput.patchValue([], { emitEvent: false });
    }
  }

  createPayload() {
    const forPC = this.data.origin === 'pc-certification-parameter'
    const schoolIds = this.selectedSchoolList.map((school) => school._id);
    const published = this.certRuleDatas.find((cert) => cert.is_published && cert.is_for_preparation_center === forPC);
    const payload = {
      certification_rule_id: published?._id,
      name: published?.name,
      header: published?.header,
      is_for_preparation_center: published?.is_for_preparation_center,
      documents: published?.documents.map((doc) => {
        return {
          document_name: doc?.document_name,
          s3_file_name: doc?.s3_file_name,
          file_path: doc?.file_path,
        }
      }),
      rncp_id: published?.rncp_id?._id,
      class_id: published?.class_id?._id,
      school_ids_recipient: schoolIds,
    }
    return payload;
  }

  sendCertificationRule() {
    const payload = this.createPayload();

    this.isWaitingForResponse = true;
    this.subs.sink = this.certificationRuleService.sentCertificationRule(payload).subscribe(
      (resp) => {
        if(resp) {
          this.isWaitingForResponse = false;
          Swal.fire({
            type: 'success',
            title: 'Bravo',
            confirmButtonText: this.translate.instant('OK'),
          }).then(() => {
            this.dialogRef.close();
          });
        } else {
          this.isWaitingForResponse = false;
        }
      },
      (err) => {
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        });
      }
    )
  }

  closeDialog() {
    this.dialogRef.close();
  }

}
