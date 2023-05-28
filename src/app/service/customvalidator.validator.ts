import { UntypedFormGroup, AbstractControl, Validators, UntypedFormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

// To validate password and confirm password
export function ComparePassword(
  controlName: string,
  matchingControlName: string
) {
  return (formGroup: UntypedFormGroup) => {
    const control = formGroup.controls[controlName];
    const matchingControl = formGroup.controls[matchingControlName];

    if (matchingControl.errors && !matchingControl.errors.mustMatch) {
      return;
    }

    if (control.value !== matchingControl.value) {
      matchingControl.setErrors({ mustMatch: true });
    } else {
      matchingControl.setErrors(null);
    }
  };
}

export function removeSpaces(control: AbstractControl) {
  if (control && control.value && typeof control.value === 'string' && !control.value.replace(/\s/g, '').length) {
    control.setValue('');
  }
  return null;
}

export function requiredIfValidator(predicate) {
  return (formControl => {
    if (!formControl.parent) {
      return null;
    }
    if (predicate()) {
      return Validators.required(formControl);
    }
    return null;
  })
}

export function requiredTrueIfValidator(predicate) {
  return (formControl => {
    if (!formControl.parent) {
      return null;
    }
    if (predicate()) {
      return Validators.requiredTrue(formControl);
    }
    return null;
  })
}

export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: UntypedFormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    // const isSubmitted = form && form.submitted;
    return (control && control.invalid);
  }
}

// export function removeSpaces(control: AbstractControl) {
//   if (control && control.value && !control.value.replace(/\s/g, '').length) {
//     control.setValue('');
//   }
//   return null;
// }
