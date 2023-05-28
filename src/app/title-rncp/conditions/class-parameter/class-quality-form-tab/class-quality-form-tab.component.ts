import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CertificationRuleService } from 'app/service/certification-rule/certification-rule.service';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import * as _ from 'lodash';

@Component({
  selector: 'ms-class-quality-form-tab',
  templateUrl: './class-quality-form-tab.component.html',
  styleUrls: ['./class-quality-form-tab.component.scss'],
})
export class ClassQualityFormTabComponent implements OnInit {
  @Input() classForm: any;
  @Input() classFormData: any;
  @Input() selectedClassId: any;
  @Input() qualityFormData;

  private subs = new SubSink();

  quality_form: UntypedFormGroup;

  templateTypeFiltered: Observable<any[]>;
  templateTypeList = [];
  savedFormData;
  isSaved = false;
  selectedId: any;
  dataDueDate: any;

  isWaitingForResponse = false;

  constructor(
    private formBuilderService: FormBuilderService,
    private fb: UntypedFormBuilder,
    private certificationRuleService: CertificationRuleService,
    private rncpTitleService: RNCPTitlesService,
    private translate: TranslateService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.initForm();
    this.getDropdownFormList();

    this.selectedId =
      this.qualityFormData && this.qualityFormData.form_builder_id && this.qualityFormData.form_builder_id._id
        ? this.qualityFormData.form_builder_id._id
        : '';
    this.dataDueDate = this.qualityFormData && this.qualityFormData.due_date ? this.qualityFormData.due_date : null;

    const data = {
      form_builder_id: this.selectedId,
      due_date: this.dataDueDate,
    };

    this.quality_form.patchValue(data);
    this.savedFormData = _.cloneDeep(this.quality_form.value);
    this.quality_form.updateValueAndValidity();
    this.isSaved = false;

    if(this.qualityFormData) {
      this.quality_form.disable();
    }
  }

  initForm() {
    this.quality_form = this.fb.group({
      form_builder_id: [null, Validators.required],
      due_date: [null, Validators.required],
    });
  }

  getDropdownFormList() {
    const filter = {
      status: true,
      template_type: 'quality_file',
    };
    this.subs.sink = this.formBuilderService.getAllFormBuildersDropdown(filter).subscribe((res) => {
      if (res) {
        this.templateTypeList = _.cloneDeep(res);
        this.quality_form.get('form_builder_id').patchValue(this.selectedId);
        this.templateTypeFiltered = this.quality_form.get('form_builder_id').valueChanges.pipe(
          startWith(''),
          map((searchText) =>
            searchText
              ? this.templateTypeList
                  .filter((type) => (type ? type.form_builder_name.toLowerCase().includes(searchText.toLowerCase()) : false))
                  .sort((a: any, b: any) => a.form_builder_name.localeCompare(b.form_builder_name))
              : this.templateTypeList,
          ),
        );
      }
    });
  }

  displayFn(selectedValue: any) {
    if (selectedValue) {
      const found = this.templateTypeList.find((res) => res._id === selectedValue);
      if (found) {
        return found.form_builder_name;
      }
    }
  }

  createPayload() {
    const tempPayload = _.cloneDeep(this.classFormData);
    const payload = {
      parent_rncp_title: tempPayload.parent_rncp_title._id,
      is_quality_form_enabled: true,
      quality_form: {
        form_builder_id: this.quality_form.get('form_builder_id').value,
        due_date: this.quality_form.get('due_date').value,
      },
    };

    return payload;
  }

  save() {
    Swal.fire({
      title: this.translate.instant('QUALITY_S1.TITLE'),
      html: this.translate.instant('QUALITY_S1.HTML'),
      footer: `<span style="margin-left: auto">QUALITY_S1</span>`,
      type: 'question',
      allowEscapeKey: true,
      showCancelButton: true,
      allowOutsideClick: false,
      confirmButtonText: this.translate.instant('QUALITY_S1.BUTTON_1'),
      cancelButtonText: this.translate.instant('QUALITY_S1.BUTTON_2'),
    }).then((res) => {
      if (res.value) {
        const payload = this.createPayload();
        this.isWaitingForResponse = true;
        this.subs.sink = this.rncpTitleService.updateClass(this.selectedClassId, payload).subscribe(
          (resp) => {
            this.isWaitingForResponse = false;
            if (resp) {
              this.quality_form.disable();
              this.isSaved = true;
              this.savedFormData = this.quality_form.value;
              this.certificationRuleService.setDataCertificationChanged(false);
              Swal.fire({
                type: 'success',
                title: 'Bravo!',
                text: this.translate.instant('CLASS_UPDATED_SWAL', { className: resp.name }),
              });
            }
          },
          (err) => {
            this.isWaitingForResponse = false;

            if (err['message'] === 'GraphQL error: class must have certification rule') {
              Swal.fire({
                type: 'warning',
                title: this.translate.instant('UserForm_S16.TITLE'),
                html: this.translate.instant('UserForm_S16.TEXT'),
                footer: `<span style="margin-left: auto">UserForm_S16</span>`,
                confirmButtonText: this.translate.instant('UserForm_S16.CONFIRM'),
                cancelButtonText: this.translate.instant('UserForm_S16.CANCEL'),
                showCancelButton: true,
                allowEnterKey: false,
                allowEscapeKey: false,
                allowOutsideClick: false,
              }).then((result) => {
                if (result.value) {
                  this.routingToCertificationTab();
                }
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
    });
  }

  compareChanges() {
    const initForm = JSON.stringify(this.savedFormData);
    const form = JSON.stringify(this.quality_form.value);
    if (initForm === form) {
      this.certificationRuleService.setDataCertificationChanged(false);
      return true;
    } else {
      this.certificationRuleService.setDataCertificationChanged(true);
      return false;
    }
  }

  preventLeadingZero(event) {
    const input = event.data;
    const form = this.quality_form.get('due_date').value;
    if (form === null || form === 0 || input === '-') {
      if ((input <= 0 && input !== null) || input === '-') {
        this.quality_form.get('due_date').patchValue(1);
      }
    }
  }

  routingToCertificationTab() {

    // **************** Need to reset the ischanged to false so routing swal confirmation are not triggered
    this.quality_form.patchValue(this.savedFormData);
    this.certificationRuleService.setDataCertificationChanged(false);

    // **************** Routing to certification rule. Need to pass classId, and navigatedFrom queryparam
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() =>
      this.router.navigate(['title-rncp/details/', this.classFormData.parent_rncp_title._id], {
        queryParams: {
          classId: this.selectedClassId,
          navigatedFrom: 'certification-rule',
        },
      }),
    );
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.certificationRuleService.setDataCertificationChanged(false);
  }
}
