import { AfterContentChecked, Component, Inject, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { JuryOrganizationService } from 'app/service/jury-organization/jury-organization.service';
import { UtilityService } from 'app/service/utility/utility.service';
import * as _ from 'lodash';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
@Component({
  selector: 'ms-grand-oral-exemption-dialog',
  templateUrl: './grand-oral-exemption-dialog.component.html',
  styleUrls: ['./grand-oral-exemption-dialog.component.scss'],
})
export class GrandOralExemptionDialogComponent implements OnInit {
  studentNames = [];
  schoolName;
  blockData = [];
  exemptionForm: UntypedFormGroup;
  private subs = new SubSink();
  isWaitingForResponse = false;

  is_student_exempted_from_grand_oral = new UntypedFormControl(false);

  constructor(
    public dialogRef: MatDialogRef<GrandOralExemptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: any,
    private fb: UntypedFormBuilder,
    public utilService: UtilityService,
    private juryService: JuryOrganizationService,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.initForm();
    this.populatedData();
    this.getBlock();
  }

  isAtleastOneChecklist() {
    let countChecklist = 0;
    this.exemptionForm.value.block_for_grand_oral.forEach((element) => {
      if (element.is_exempted) {
        countChecklist++;
      }
    });
    if (countChecklist > 0) {
      return false;
    } else {
      return true;
    }
  }

  closeDialog(isReloadData?: boolean) {
    this.dialogRef.close(isReloadData);
  }

  populatedData() {


    this.studentNames = this.parentData.students.map((name) => {
      return `${this.translate.instant(name.student_id.civility)} ${name.student_id.first_name} ${name.student_id.last_name}`;
    });

    this.parentData.students.forEach((school) => {
      this.schoolName = school.school.short_name;
    });

    this.blockData = this.parentData.students.map((block) => {
      return block.blocks_for_grand_oral;
    });

    this.blockData = _.flatten(this.blockData);
    this.blockData = _.uniqBy(this.blockData, 'block_id._id');
    this.blockData = _.filter(this.blockData, (block) => block.is_selected);

    if (this.parentData.students && this.parentData.students.length > 1) {
      this.is_student_exempted_from_grand_oral.setValue(false);
    } else {
      this.is_student_exempted_from_grand_oral.setValue(
        this.parentData.students[0].is_student_exempted_from_grand_oral
          ? this.parentData.students[0].is_student_exempted_from_grand_oral
          : false,
      );
    }
  }

  initForm() {
    this.exemptionForm = this.fb.group({
      block_for_grand_oral: this.fb.array([]),
    });
  }

  get blockConditionDetails(): UntypedFormArray {
    return this.exemptionForm.get('block_for_grand_oral') as UntypedFormArray;
  }

  initBlockForm(blockId, isBlockSelected, isBlockExempted) {
    return this.fb.group({
      _id: [blockId ? blockId : ''],
      is_selected: [isBlockSelected ? isBlockSelected : false],
      is_exempted: [isBlockExempted ? isBlockExempted : false],
    });
  }

  getBlock() {
    this.blockData.forEach((block) => {
      this.blockConditionDetails.push(this.initBlockForm(block.block_id._id, block.is_selected, block.is_exempted));
    });

    this.blockConditionDetails.controls.forEach((control) => {
      control.get('is_exempted').patchValue(true);
    });
  }

  createPayload() {
    let payload = null;

    const jury_ids = this.parentData.students.map((id) => {
      return id._id;
    });

    const selected_block_ids = [];
    const unselected_block_ids = [];
    this.exemptionForm.value.block_for_grand_oral.forEach((block) => {
      if (this.is_student_exempted_from_grand_oral.value) {
        unselected_block_ids.push(block._id);
      } else {
        if (block.is_exempted) {
          selected_block_ids.push(block._id);
        } else {
          unselected_block_ids.push(block._id);
        }
      }
    });

    payload = {
      jury_schedule_ids: jury_ids,
      selected_block_ids: selected_block_ids,
      unselected_block_ids: unselected_block_ids,
    };

    if (this.parentData.isAllSelected) {
      const filter = this.parentData.filteredValues;
      delete payload.jury_schedule_ids;
      payload.jury_id = this.parentData.juryData._id;
      payload.filter = filter;
    }

    payload.filter = { is_student_exempted_from_grand_oral: this.is_student_exempted_from_grand_oral.value ? true : false };



    return payload;
  }

  submit() {
    if (this.is_student_exempted_from_grand_oral.value) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('GO_S5.TITLE'),
        html: this.translate.instant('GO_S5.TEXT'),
        footer: `<span style="margin-left: auto">GO_S5</span>`,
        confirmButtonText: this.translate.instant('GO_S5.BUTTON1'),
        cancelButtonText: this.translate.instant('GO_S5.BUTTON2'),
        showCancelButton: true,
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      }).then((res) => {
        if (res.value) {
          this.closeDialog(true);
          this.exemptBlockJuryOrganizationSchedule();
        } else {
          return;
        }
      });
    } else {
      this.exemptBlockJuryOrganizationSchedule();
    }
  }

  exemptBlockJuryOrganizationSchedule() {
    this.isWaitingForResponse = true;
    const payload = this.createPayload();
    this.subs.sink = this.juryService
      .exemptBlockJuryOrganizationSchedule(
        payload.jury_schedule_ids,
        payload.jury_id,
        payload.selected_block_ids,
        payload.unselected_block_ids,
        payload.filter,
      )
      .subscribe((resp) => {

        this.isWaitingForResponse = false;
        if (resp.message === 'Some data already published and will be skipped') {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('GO_S4.TITLE'),
            text: this.translate.instant('GO_S4.TEXT'),
            footer: `<span style="margin-left: auto">GO_S4</span>`,
            confirmButtonText: this.translate.instant('GO_S4.BUTTON'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then(() => {
            this.closeDialog(true);
          });
        } else {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo !'),
            confirmButtonText: this.translate.instant('Ok'),
            allowEnterKey: false,
            allowEscapeKey: false,
            allowOutsideClick: false,
          }).then(() => {
            this.closeDialog(true);
          });
        }
      });
  }
}
