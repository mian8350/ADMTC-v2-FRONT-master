import { Component, OnDestroy, OnInit } from '@angular/core';
import { TestService } from 'app/service/test/test.service';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { UntypedFormBuilder, UntypedFormGroup, UntypedFormControl, Validators } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { CustomValidators } from 'ng2-validation';
import { Test } from 'app/models/test.model';
import { TestCreationService } from 'app/service/test/test-creation.service';
import swal from 'sweetalert2';
import { DatePipe } from '@angular/common';
import { Observable } from 'apollo-link';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-add-task-dialog',
  templateUrl: './add-task-dialog.component.html',
  styleUrls: ['./add-task-dialog.component.scss'],
})
export class AddTaskDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  form: UntypedFormGroup;
  relativeDate = false;
  test = new Test();
  academicStaffUsers = [];
  userTypes = [];
  acadUserTypes = [];
  newStep = false;
  today: any;
  datePipe: DatePipe;
  filteredOptions: Observable<any[]>;
  constructor(
    private testService: TestService,
    private translate: TranslateService,
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<AddTaskDialogComponent>,
    private testCreationService: TestCreationService,
    private dateAdapter: DateAdapter<Date>
  ) {
    this.form = new UntypedFormGroup({
      text: new UntypedFormControl('', Validators.required),
      sender: new UntypedFormControl('', Validators.required),
      actor: new UntypedFormControl('', Validators.required),
      date: new UntypedFormControl(null, [CustomValidators.date, Validators.required]),
      numberOfDays: new UntypedFormControl('', [CustomValidators.gte(0), Validators.required]),
      daysBefore: new UntypedFormControl('before'),
    });
  }

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.today = new Date();
    this.subs.sink = this.testService.getTest().subscribe((test) => {
      this.test = test;
    });
    this.initForm();
    this.populateStudent();
    this.getRequiredUserTypes();
  }

  populateStudent() {
    this.subs.sink = this.testCreationService.testCreationData$.subscribe((respClass) => {

      this.subs.sink = this.testCreationService.getStudentByClass(respClass.class_id).subscribe((resp) => {

        for (const res of resp) {
          this.academicStaffUsers.push(res);
        }
      });
    });
  }

  initForm() {
    this.form = new UntypedFormGroup({
      text: new UntypedFormControl('', Validators.required),
      sender: new UntypedFormControl('', Validators.required),
      actor: new UntypedFormControl('', Validators.required),
      date: new UntypedFormControl(null, [CustomValidators.date]),
      numberOfDays: new UntypedFormControl('', [CustomValidators.gte(0)]),
      daysBefore: new UntypedFormControl('before'),
    });
    this.newStep = true;
  }

  changeDateType(event: MatSlideToggleChange) {
    this.relativeDate = event.checked;
    this.initFormRelativeDate();
  }

  initFormRelativeDate() {
    if (!this.relativeDate) {
      this.form = this.fb.group({
        text: new UntypedFormControl(this.form.value.text, Validators.required),
        sender: new UntypedFormControl(this.form.value.sender, Validators.required),
        actor: new UntypedFormControl(this.form.value.actor, Validators.required),
        date: new UntypedFormControl(null, [CustomValidators.date, Validators.required]),
      });
    } else {
      this.form = this.fb.group({
        text: new UntypedFormControl(this.form.value.text, Validators.required),
        sender: new UntypedFormControl(this.form.value.sender, Validators.required),
        actor: new UntypedFormControl(this.form.value.actor, Validators.required),
        numberOfDays: new UntypedFormControl('', [CustomValidators.gte(0), Validators.required]),
        daysBefore: new UntypedFormControl('before'),
      });
    }
  }

  checkNumberOfDays() {
    if (this.form.value.numberOfDays < 0) {
      this.form.patchValue({
        numberOfDays: 0,
      });
    }
  }

  getRequiredUserTypes() {
    this.subs.sink = this.testCreationService.getAllUserTypesThird().subscribe((data) => {
      this.userTypes = data;
    });
  }

  getUserTypeName(id) {
    for (const utype of this.userTypes) {
      if (utype._id === id) {
        return utype.name;
      }
    }
  }

  getSenderName(id) {
    for (const utypename of this.academicStaffUsers) {
      if (utypename._id === id) {
        return utypename.firstName + ' ' + utypename.lastName;
      }
    }
    for (const utypename of this.acadUserTypes) {
      if (utypename._id === id) {
        const value = this.translate.instant('ADMTCSTAFFKEY.' + utypename.name.toUpperCase());
        return value !== 'ADMTCSTAFFKEY.' + utypename.name.toUpperCase() ? value : name;
      }
    }
  }

  getTranslateADMTCSTAFFKEY(name) {
    if (name) {
      const value = this.translate.instant('ADMTCSTAFFKEY.' + name.toUpperCase());
      return value !== 'ADMTCSTAFFKEY.' + name.toUpperCase() ? value : name;
    }
  }

  cancelNewStep() {
    this.newStep = false;
    this.form.patchValue({
      daysBefore: 'before',
    });
    this.form.reset();
    this.relativeDate = false;
    this.dialogRef.close();
  }

  addStepToTest() {
    const ctls = this.form.controls;
    ctls['text'].markAsTouched();
    ctls['sender'].markAsTouched();
    ctls['actor'].markAsTouched();
    const sender = this.getSenderName(this.form.value.sender);
    if (!this.relativeDate) {
      if (ctls['text'].valid && ctls['sender'].valid && ctls['actor'].valid && ctls['date'].valid) {
        this.test.calendar.steps.push({
          text: this.form.value.text,
          sender: this.form.value.sender,
          actor: this.form.value.actor,
          date: {
            type: 'fixed',
            value: this.form.value.date.toISOString(),
          },
          created_from: 'manual',
        });
        this.newStep = false;
        this.form.reset();
        this.form.patchValue({
          daysBefore: 'before',
        });
        this.relativeDate = false;
        this.testService.updateTest(this.test);
        this.dialogRef.close();

      } else {
        swal.fire({
          title: 'Attention',
          text: this.translate.instant('TEST.ERRORS.FILLALL'),
          allowEscapeKey: true,
          type: 'warning',
          allowOutsideClick: false,
          confirmButtonText : this.translate.instant('OK'),
        });
      }
    } else {
      if (ctls['text'].valid && ctls['sender'].valid && ctls['actor'].valid && ctls['numberOfDays'].valid) {
        this.test.calendar.steps.push({
          text: this.form.value.text,
          sender: this.form.value.sender,
          actor: this.form.value.actor,
          date: {
            type: 'relative',
            before: this.form.value.daysBefore === 'before',
            day: this.form.value.numberOfDays,
          },
          created_from: 'manual',
        });
        this.newStep = false;
        this.form.reset();
        this.form.patchValue({
          daysBefore: 'before',
        });
        this.relativeDate = false;
        this.testService.updateTest(this.test);
        this.dialogRef.close();
      } else {
        swal.fire({
          title: 'Attention',
          text: this.translate.instant('TEST.ERRORS.FILLALL'),
          allowEscapeKey: true,
          type: 'warning',
          allowOutsideClick: false,
          confirmButtonText : this.translate.instant('OK'),
        });
      }
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
