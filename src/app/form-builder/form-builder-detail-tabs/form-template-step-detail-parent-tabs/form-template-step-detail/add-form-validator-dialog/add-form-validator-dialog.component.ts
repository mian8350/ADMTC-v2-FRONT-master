import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormControl, Validators, UntypedFormBuilder } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilderService } from 'app/service/form-builder/form-builder.service';
import { Observable } from 'rxjs';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-add-form-validator-dialog',
  templateUrl: './add-form-validator-dialog.component.html',
  styleUrls: ['./add-form-validator-dialog.component.scss'],
})
export class AddFormValidatorDialogComponent implements OnInit, OnDestroy {
  addValidatorForm: UntypedFormGroup;
  private subs = new SubSink();

  userTypeCtrl = new UntypedFormControl(null, [Validators.required]);
  userTypeList: any[] = [];
  filtereduserType: Observable<any[]>;

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<AddFormValidatorDialogComponent>,
    private formBuilderService: FormBuilderService,
    @Inject(MAT_DIALOG_DATA) public parentData,
  ) {}

  ngOnInit() {
    this.getUserTypeList();
  }

  getUserTypeList() {
    const userTypes = [
      {
        _id: '5a2e1ecd53b95d22c82f954b',
        name: 'ADMTC Director',
      },
      {
        _id: '5a2e1ecd53b95d22c82f9550',
        name: 'Certifier Admin',
      },
      {
        _id: '5a2e1ecd53b95d22c82f9554',
        name: 'Academic Director',
      },
    ];

    if (this.parentData && this.parentData.templateType && this.parentData.templateType === 'student_admission') {
      userTypes.push({ _id: '5a067bba1c0217218c75f8ab', name: 'Student' });
    }

    if (this.parentData && this.parentData.signatory && this.parentData.signatory.length) {
      const signatory = this.parentData.signatory;
      this.userTypeList = userTypes.filter((userType) => !signatory.find((validator) => validator._id === userType._id));
    } else {
      this.userTypeList = [...userTypes];
    }

    /* this.subs.sink = this.formBuilderService.getUserTypesForValidator().subscribe((resp) => {

      let tempData = resp;
      if (this.parentData && this.parentData.signatory && this.parentData.signatory.length) {
        const signatory = this.parentData.signatory;
        tempData = tempData.filter((userType) => !signatory.find((validator) => validator._id === userType._id));
      }
      this.userTypeList = tempData;
    }); */
  }

  filterOutStudentAsFinalValidator(userTypes: { name: string; _id: string }[]) {
    return userTypes.filter((type) => type._id !== '5a067bba1c0217218c75f8ab' || type.name !== 'Student');
  }

  submit() {

    this.dialogRef.close(this.userTypeCtrl.value);
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
