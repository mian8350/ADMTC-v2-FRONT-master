import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { UntypedFormBuilder, FormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import * as moment from 'moment';
import * as _ from 'lodash';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import Swal from 'sweetalert2';
import { SubSink } from 'subsink';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { CertificationRuleService } from 'app/service/certification-rule/certification-rule.service';
import { Router } from '@angular/router';

@Component({
  selector: 'ms-class-admission-tab',
  templateUrl: './class-admission-tab.component.html',
  styleUrls: ['./class-admission-tab.component.scss'],
  providers: [ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class ClassAdmissionTabComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @Input() classForm: any;
  @Input() classFormData: any;
  @Input() selectedClassId: any;
  @Input() admissionData: any;
  @Output() refreshData = new EventEmitter();

  admissionFormGroup: UntypedFormGroup;

  templateTypeFiltered: Observable<any[]>;
  templateTypeList = [];
  selectedId: any;
  dataDueDate: any;
  isAdmissionDueDataEnabled:boolean = false;
  savedFormData;
  isSaved = false;

  isWaitingForResponse = false;

  constructor(
    private fb: UntypedFormBuilder,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private rncpTitleService: RNCPTitlesService,
    private translate: TranslateService,
    private formBuilderService: FormBuilderService,
    private certificationRuleService: CertificationRuleService,
    private router: Router,
  ) {}

  ngOnInit() {
    this.initForm();
    this.getDropdownFormList();

    this.selectedId =
      this.admissionData && this.admissionData.form_builder_id && this.admissionData.form_builder_id._id
        ? this.admissionData.form_builder_id._id
        : '';
    this.dataDueDate = this.admissionData && this.admissionData.due_date ? this.admissionData.due_date : null;
    this.isAdmissionDueDataEnabled = this.admissionData?.is_admission_due_date_enabled ? this.admissionData?.is_admission_due_date_enabled : false;

    const data = {
      form_builder_id: this.selectedId,
      due_date: this.dataDueDate,
      is_admission_due_date_enabled: this.isAdmissionDueDataEnabled
    };

    this.admissionFormGroup.patchValue(data);

    if(this.admissionFormGroup.get('due_date').value) {
      this.admissionFormGroup.get('due_date').setValidators([Validators.required]);
      this.admissionFormGroup.get('due_date').updateValueAndValidity();
    }
    this.savedFormData = _.cloneDeep(this.admissionFormGroup.value);
    this.admissionFormGroup.updateValueAndValidity();
    this.isSaved = false;
  }

  getDropdownFormList() {
    const filter = {
      status: true,
      template_type: 'student_admission'
    }
    this.subs.sink = this.formBuilderService.getAllFormBuildersDropdown(filter).subscribe((res) => {
      if (res) {
        this.templateTypeList = _.cloneDeep(res);
        this.admissionFormGroup.get('form_builder_id').patchValue(this.selectedId);
        this.templateTypeFiltered = this.admissionFormGroup.get('form_builder_id').valueChanges.pipe(
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

  initForm() {
    this.admissionFormGroup = this.fb.group({
      form_builder_id: [null, [Validators.required]],
      due_date: [null],
      is_admission_due_date_enabled: [false]
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
    const dueDateValue = this.admissionFormGroup.get('is_admission_due_date_enabled').value ? this.admissionFormGroup.get('due_date').value : null;
    const payload = {
      parent_rncp_title: tempPayload.parent_rncp_title._id,
      is_admission_enabled: true,
      admission_process: {
        form_builder_id: this.admissionFormGroup.get('form_builder_id').value,
        due_date: dueDateValue,
      },
      is_admission_due_date_enabled: this.admissionFormGroup.get('is_admission_due_date_enabled').value
    };
    return payload;
  }

  save() {
    const payload = this.createPayload();

    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService.updateClassParameterAdmissionTab(this.selectedClassId, payload).subscribe(
      (response) => {
        this.isWaitingForResponse = false;

        if (response && response.data && response.data.UpdateClass && !response.errors) {
          const resp = response.data.UpdateClass;
          this.isSaved = true;
          this.savedFormData = this.admissionFormGroup.value;
          this.certificationRuleService.setDataCertificationChanged(false);
          Swal.fire({
            type: 'success',
            title: 'Bravo!',
            text: this.translate.instant('CLASS_UPDATED_SWAL', { className: resp.name }),
          }).then((result) => {
            if(result.value) {
              this.refreshData.emit('admission');
            }
          })
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

  getConvertDate(date, time) {
    const today = moment(date).format('DD/MM/YYYY');
    return this.parseLocalToUTCPipe.transformDate(today, time);
  }

  getTodayTime(time) {
    return this.parseLocalToUTCPipe.transform(time);
  }

  compareChanges() {
    const initForm = JSON.stringify(this.savedFormData);
    const form = JSON.stringify(this.admissionFormGroup.value);
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
    const form = this.admissionFormGroup.get('due_date').value;


    if (form === null || form === 0 || input === '-') {
      if (input <= 0 && input !== null || input === '-' ) {
        this.admissionFormGroup.get('due_date').patchValue(1);
      } 
    }
  }

  routingToCertificationTab() {

    // **************** Need to reset the ischanged to false so routing swal confirmation are not triggered
    this.admissionFormGroup.patchValue(this.savedFormData);
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

  toggleDueDateSlider(event){
    if(event?.checked) {
      this.admissionFormGroup.get('due_date').setValidators([Validators.required]);
      this.admissionFormGroup.get('due_date').setValue(null);
      this.admissionFormGroup.get('due_date').updateValueAndValidity();
      this.admissionFormGroup.get('due_date').markAsUntouched();
    } else {
      this.admissionFormGroup.get('due_date').clearValidators();
      this.admissionFormGroup.get('due_date').setValue(null);
      this.admissionFormGroup.get('due_date').updateValueAndValidity();
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.certificationRuleService.setDataCertificationChanged(false);
  }
}
