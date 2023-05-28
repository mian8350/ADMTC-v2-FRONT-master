import { Component, OnInit, Inject, OnDestroy, ViewChild } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormControl } from '@angular/forms';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { SchoolService } from 'app/service/schools/school.service';
import { SchoolPreparationCenterAndCertifierTable, Specialization, Title } from 'app/school/School.model';
import Swal from 'sweetalert2';
import { SubSink } from 'subsink';
import { MatSelect } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-edit-connected-title-dialog',
  templateUrl: './edit-connected-title-dialog.component.html',
  styleUrls: ['./edit-connected-title-dialog.component.scss'],
})
export class EditConnectedTitleDialogComponent implements OnInit, OnDestroy {
  @ViewChild('selectSpecialization') select: MatSelect;
  private subs = new SubSink();
  titleDropdownData: Title;
  selected_specializations = new UntypedFormControl(null);
  isWaitingForResponse = false;
  specializations: any;
  allSelected = false;

  constructor(
    private dialogRef: MatDialogRef<EditConnectedTitleDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: { schoolId: string; title: SchoolPreparationCenterAndCertifierTable },
    private rncpTitleService: RNCPTitlesService,
    private schoolService: SchoolService,
    public translate: TranslateService,
  ) {}

  ngOnInit() {
    this.getSpecializationFromClass();
  }

  getSpecializationFromClass() {
    this.isWaitingForResponse = true;
    // get "specialization" dropdown list of selected class
    this.subs.sink = this.rncpTitleService.getClassSpecializations(this.parentData.title.class_id._id).subscribe((resp: any) => {
      if (resp) {

        this.isWaitingForResponse = false;
        if(resp.specializations && resp.specializations.length) {
          this.specializations = resp.specializations.sort((a, b) => a.name.localeCompare(b.name));
          } else {
            this.specializations = [];
          }
        
        this.patchCurrentSpecialization(resp.specializations);
        this.isWaitingForResponse = false;
        // for (const title of resp) {
        //   if (title._id === this.parentData.title._id) {
        //     this.titleDropdownData = title;
        //     this.setSpecializationFormData();
        //     break;
        //   }
        // }
      }
    });
  }

  patchCurrentSpecialization(fetchedSpecs: Specialization[]) {
    if (this.parentData && this.parentData.title && this.parentData.title.specializations && this.parentData.title.specializations.length) {
      //filter to include only the specializations that belongs to this currently selected class
      //prevents patching the wrong specs from issue before where multiple class of same title is patched same spec
      const specs = this.parentData.title.specializations.filter((spec) =>
        fetchedSpecs.map((fetchedSpec) => fetchedSpec._id).includes(spec._id),
      )
      .map(spec => spec._id); //only return the Ids
      this.selected_specializations.patchValue(specs);
    }
  }

  setSpecializationFormData() {
    const specs =
      this.parentData && this.parentData.title && this.parentData.title.specializations && this.parentData.title.specializations.length
        ? this.parentData.title.specializations.map((spec) => spec._id)
        : [];
    this.selected_specializations.setValue(specs);
  }

  submit() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.schoolService.getSchool(this.parentData.schoolId).subscribe((resp) => {
      const schoolData = {
        long_name: resp.long_name,
        short_name: resp.short_name,
        preparation_center_ats: [],
      };
      // get selected school data to get all of the connected title
      this.subs.sink = this.schoolService.getSchoolPreparationCenterAndCertifier(this.parentData.schoolId).subscribe(
        (school) => {
        if (school && school.preparation_center_ats && school.preparation_center_ats.length) {
          school.preparation_center_ats.forEach((prep) => {
            // update connected title's specializations data with selected_specializations formcontrol data
            if (
              prep &&
              prep.rncp_title_id &&
              prep.class_id &&
              this.parentData &&
              this.parentData.title &&
              this.parentData.title.class_id &&
              prep.rncp_title_id._id === this.parentData.title._id &&
              prep.class_id._id === this.parentData.title.class_id._id
            ) {
              schoolData.preparation_center_ats.push({
                rncp_title_id: prep.rncp_title_id._id,
                class_id: prep.class_id._id,
                selected_specializations: this.formSelectedSpecialization(),
              });
            } else {
              schoolData.preparation_center_ats.push({
                rncp_title_id: prep.rncp_title_id._id,
                class_id: prep.class_id._id,
                selected_specializations:
                  prep.selected_specializations && prep.selected_specializations.length
                    ? prep.selected_specializations.map((spec) => spec._id)
                    : [],
              });
            }
          });
          this.isWaitingForResponse = false;

          this.updateSchool(schoolData);
        }
      }
      );
    });
  }

  formSelectedSpecialization(){
    const filterArray = [null, 'AllM'];
    return (this.selected_specializations?.value || []) // sanity check
      .filter(item => !filterArray.includes(item));
  }

  toggleAllSelection() {
    if (this.allSelected) {
      this.allSelected = false;
      this.select?.options?.forEach((item: MatOption) => item.deselect());
    } else {
      this.allSelected = true;
      this.select?.options?.forEach((item: MatOption) => {  
        if (item.value !== null) {
          item.select()
        } else if (item.value === null) {
          item.deselect()
        }
      });
    }
  }

  selectItem() {
    for (const item of this.select?.options) {
      if (item.value === 'AllM' || item.value === null) {
        item.deselect()
      }
    }
    this.allSelected = false;
  }

  unSelectedAllItems() {
    this.allSelected = false
    for (const item of this.select?.options) {
      if (item.value !== null) {
        item.deselect()
      }
    }
  }

  getSelectedSpecializations() {
    if (!this.specializations?.length || !this.selected_specializations.value?.length) return
    return this.specializations?.filter(item => this.selected_specializations.value?.includes(item?._id)).map(item => item?.name).join(', ')
  }

  updateSchool(payload: any) {
    this.subs.sink = this.schoolService.updateSchool(this.parentData.schoolId, payload).subscribe((resp) => {
      if (resp) {
        Swal.fire({ type: 'success', title: 'Bravo!', allowOutsideClick: false, confirmButtonText: 'ok' });
      } else {
        Swal.fire({ type: 'error', title: 'Error', allowOutsideClick: false, confirmButtonText: 'ok' });
      }
      this.dialogRef.close(true);
    },
    (error) => {

      this.isWaitingForResponse = false;
      if (error['message'] === 'GraphQL error: Specialization is either connected to student or the test related to specialization is already publish') {
        Swal.fire({
          title: this.translate.instant('Specialization_S3.TITLE'),
          html: this.translate.instant('Specialization_S3.TEXT'),
          footer: `<span style="margin-left: auto">Specialization_S3</span>`,
          confirmButtonText: this.translate.instant('Specialization_S3.BUTTON'),
          type: 'warning',
          allowOutsideClick: false,
        }).then((result) => {
          this.getSpecializationFromClass();
        });
      }
    }
    );
  }

  closeDialog() {
    this.dialogRef.close(false);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
