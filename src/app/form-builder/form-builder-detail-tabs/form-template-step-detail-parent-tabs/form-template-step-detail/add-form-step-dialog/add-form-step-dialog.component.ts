import { Component, Inject, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-add-form-step-dialog',
  templateUrl: './add-form-step-dialog.component.html',
  styleUrls: ['./add-form-step-dialog.component.scss'],
})
export class AddFormStepDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  addStepForm: UntypedFormGroup;

  initialType;
  initialForm;
  isFormChanged;
  stepTypeList;
  filteredStepType;
  filterStepType = new UntypedFormControl('');

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<AddFormStepDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private translate: TranslateService,
    private formBuilderService: FormBuilderService,
  ) {}

  ngOnInit() {
    this.initAddStepForm();
    this.getStepType();
    if (this.data) {

    }
    this.subs.sink = this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.getStepType();
    });

    this.patchEditStep();
  }

  patchEditStep() {
    if (this.data.edit) {
      this.isFormChanged = true;
      this.addStepForm.patchValue(this.data.stepData);
      this.initialType = this.addStepForm.get('step_type').value;
      this.initialForm = this.addStepForm.getRawValue();
      this.stepTypeList.forEach((step) => (step.value === this.data.stepData.step_type ? this.filterStepType.setValue(step.key) : ''));
      this.checkFormChange();
    }
  }

  initAddStepForm() {
    this.addStepForm = this.fb.group({
      step_title: ['', [Validators.required, removeSpaces]],
      step_type: ['', [Validators.required]],
    });
  }

  checkFormChange() {
    this.subs.sink = this.addStepForm.valueChanges.subscribe((res) => {
      const currentForm = JSON.stringify(this.addStepForm.getRawValue());
      const initialForm = JSON.stringify(this.initialForm);
      this.isFormChanged = currentForm === initialForm;
    });
  }

  submit() {

    this.checkStepTitle(this.addStepForm.get('step_title').value);
    // this.dialogRef.close(this.addStepForm.value);
  }

  checkStepTitle(stepTitle) {
    if (this.data && this.data.length) {

      let textFound = this.data.filter((text) => text.step_title.toLowerCase() === stepTitle.toLowerCase());

      if (textFound && textFound.length) {
        this.swalError();
        return;
      } else {

        this.checkStepType(this.addStepForm.get('step_type').value);
        // this.dialogRef.close(this.addStepForm.value);
      }
    } else {

      this.checkStepType(this.addStepForm.get('step_type').value);
      // this.dialogRef.close(this.addStepForm.value);
    }
  }

  checkStepType(stepType) {
    const currentType = this.addStepForm.get('step_type').value;
    const initialType = this.initialType;
    const isTypeChanged = currentType === initialType;
    if (this.data && !isTypeChanged) {
      const dataSteps = this.data.edit ? this.data.templateSteps : this.data;
      let typeFound;
      if (stepType === 'final_message') {
        typeFound = dataSteps.filter((step) => step.step_type === stepType);
        if (typeFound && typeFound.length) this.swallStepTypeDuplicate(stepType);
        else this.dialogRef.close(this.addStepForm.value);
      } else if (stepType === 'step_with_signing_process') {
        typeFound = dataSteps.filter((step) => step.step_type === stepType);
        if (typeFound && typeFound.length) this.swallStepTypeDuplicate(stepType);
        else this.dialogRef.close(this.addStepForm.value);
      } else {
        this.dialogRef.close(this.addStepForm.value);
      }
    } else {
      this.dialogRef.close(this.addStepForm.value);
    }
  }

  selectType(value) {
    const type = this.stepTypeList.find((val) => val.key === value);
    if (type) this.addStepForm.get('step_type').patchValue(type.value);
  }

  getStepType() {
    this.stepTypeList = this.formBuilderService.getStepTypeList().map((item) => {
      return { value: item, key: this.translate.instant('ERP_009_TEACHER_CONTRACT.' + item) };
    });
    this.filteredStepType = this.stepTypeList;
  }

  onValueTypeChange() {
    if (this.filterStepType.value) {
      const searchString = this.filterStepType.value.toLowerCase().trim();
      this.filteredStepType = this.stepTypeList.filter((step) => step.key.toLowerCase().trim().includes(searchString));
    } else {
      this.filteredStepType = this.stepTypeList;
      this.addStepForm.get('step_type').patchValue(null, { emitEvent: false });
    }
  }

  swalError() {
    Swal.fire({
      type: 'error',
      title: this.translate.instant('UserForm_S14.TITLE'),
      text: this.translate.instant('UserForm_S14.TEXT'),
      confirmButtonText: this.translate.instant('UserForm_S14.CONFIRM'),
    }).then(() => {
      this.addStepForm.get('step_title').reset('', { emitEvent: true });
    });
  }

  swallStepTypeDuplicate(stepType) {
    if (stepType === 'final_message') {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('Form_S1.TITLE'),
        text: this.translate.instant('Form_S1.TEXT'),
        confirmButtonText: this.translate.instant('Form_S1.BUTTON1'),
      }).then(() => {
        this.addStepForm.get('step_type').reset('', { emitEvent: true });
        this.filterStepType.reset();
      });
    } else if (stepType === 'step_with_signing_process') {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('Form_S3.TITLE'),
        text: this.translate.instant('Form_S3.TEXT'),
        confirmButtonText: this.translate.instant('Form_S3.BUTTON1'),
      }).then(() => {
        this.addStepForm.get('step_type').reset('', { emitEvent: true });
        this.filterStepType.reset();
      });
    }
  }
   
  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
