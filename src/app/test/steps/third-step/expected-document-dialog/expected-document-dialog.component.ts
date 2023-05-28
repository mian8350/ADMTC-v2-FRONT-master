import { Component, OnInit, ElementRef, ViewChild, Renderer2, Inject, AfterViewChecked, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { CustomValidators } from 'ng2-validation';
import { DateAdapter } from '@angular/material/core';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { ExpectedDocuments } from '../../../../models/expectedDocument.model';
import { Test } from '../../../../models/test.model';
import { TestService } from '../../../../service/test/test.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TestCreationService } from 'app/service/test/test-creation.service';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ExpectedDocumentForTestInput } from 'app/test/test-creation/test-creation.model';
import { SubSink } from 'subsink';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { AcademicKitService } from 'app/service/rncpTitles/academickit.service';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-expected-document-dialog',
  templateUrl: './expected-document-dialog.component.html',
  styleUrls: ['./expected-document-dialog.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe],
})
export class ExpectedDocumentDialogComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('testTimeDiv', { static: false }) testTimeDiv: ElementRef;
  private subs = new SubSink();
  newExpectedDoc = false;
  expectedForm: UntypedFormGroup;
  form: UntypedFormGroup;
  isStudent = false;
  mdDate: any;
  today: any;
  prepCenterDropdwon: any;
  test = new Test();
  userTypePC = [];
  relativeDate = false;
  sliderRelative = new UntypedFormControl(false);
  loadingUserType = false;
  certifierAdminId: string;
  studentId = '5a067bba1c0217218c75f8ab';
  autoProType = ['academic_auto_evaluation', 'academic_pro_evaluation', 'soft_skill_auto_evaluation', 'soft_skill_pro_evaluation', 'preparation_center_eval_soft_skill'];
  isAutoProMultipleDateTest = false;
  fileTypes = [];

  constructor(
    private fb: UntypedFormBuilder,
    private testService: TestService,
    public dialogRef: MatDialogRef<ExpectedDocumentDialogComponent>,
    private testCreationService: TestCreationService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    el: ElementRef,
    private renderer: Renderer2,
    private acadKitService: AcademicKitService,
    private dateAdapter: DateAdapter<Date>,
    private translate: TranslateService,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {
    this.fileTypes = this.acadKitService.getFileTypes();
    this.expectedForm = this.fb.group({
      document_name: ['', [Validators.required, removeSpaces]],
      document_user_type: ['', Validators.required],
      is_for_all_student: [false],
      is_for_all_group: [false],
      doc_upload_date_retake_exam: [''],
      doc_upload_for_final_retake: [''],
      file_type: ['', Validators.required],
      deadline_date: this.fb.group({
        type: [''],
        before: [null],
        day: [null],
        deadline: this.fb.group({
          date: [''],
          time: [''],
        }),
      }),
    });
  }

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
    this.today = new Date();
    const temp = this.testCreationService.getTestCreationDataWithoutSubscribe();
    if (temp) {
      this.test = _.cloneDeep(temp);

      if (this.autoProType.includes(this.test.type) && this.test.date_type === 'multiple_date') {
        this.isAutoProMultipleDateTest = true;
        this.sliderRelative.setValue(true);
      }
    }
    this.mdDate = this.getDate();
    this.getUserTypePC();

    if (this.data) {

      if (this.data.type && this.data.type === 'edit') {
        this.patchDocumentEditIntoForm(this.data.documentData);
      }
    }

    this.changeValidators();
  }

  ngAfterViewChecked() {
    if (this.testTimeDiv && this.testTimeDiv.nativeElement) {
      const hostElem = this.testTimeDiv.nativeElement;
      this.renderer.setStyle(hostElem.children[0].children[0].children[0].children[1], 'align-self', 'end');
    }
  }

  patchDocumentEditIntoForm(documentData: ExpectedDocumentForTestInput) {
    const formattedData = _.cloneDeep(documentData);
    if (formattedData.deadline_date.type === 'fixed') {
      formattedData.deadline_date.deadline.date = this.parseStringDatePipe.transformStringToDate(
        this.parseUTCToLocalPipe.transformDate(formattedData.deadline_date.deadline.date, formattedData.deadline_date.deadline.time),
      );
      formattedData.deadline_date.deadline.time = this.parseUTCToLocalPipe.transform(formattedData.deadline_date.deadline.time);
    }
    this.expectedForm.patchValue(formattedData);
    if (this.expectedForm.get('deadline_date').get('type').value === 'relative') {
      this.sliderRelative.patchValue(true);
    } else {
      this.sliderRelative.patchValue(false);
    }
    // this.changeValidators();
  }

  cancelNewExpectedDoc() {
    this.newExpectedDoc = false;
    this.expectedForm.reset();
    // this.expectedForm.patchValue({
    //   daysBefore: 'before'
    // });
    this.relativeDate = false;
    // this.form.controls['publicationDate'].setValue(
    //   new Date().toLocaleString('en-GB')
    // );
    this.isStudent = false;
    this.dialogRef.close();
  }

  getDate() {
    const d = new Date();
    const dformat =
      [d.getMonth() + 1, d.getDate(), d.getFullYear()].join('/') + ' ' + [d.getHours(), d.getMinutes(), d.getSeconds()].join(':');
    return dformat;
  }

  getUserTypePC() {
    this.loadingUserType = true;
    this.subs.sink = this.testCreationService.getAllUserTypePC().subscribe((response) => {
      this.loadingUserType = false;
      if (response && response.length) {
        this.userTypePC = _.filter(response, (usertype) => usertype.name !== 'Online_Student');
      }
      // ********** new requirement to add certifier admin to list (AV-2381)
      this.testCreationService.getCertifierAdmin().subscribe(user => {
        if (user && user[0] && user[0]._id) {
          this.certifierAdminId = user[0]._id;
          this.userTypePC.unshift(user[0]);
          this.userTypePC = this.userTypePC.sort((a, b) => (this.translate.instant('USER_TYPES.' + a.name) > this.translate.instant('USER_TYPES.' + b.name) ? 1 : this.translate.instant('USER_TYPES.' + b.name) > this.translate.instant('USER_TYPES.' + a.name) ? -1 : 0))
        }
      })
    });
  }

  changeDateType(event: MatSlideToggleChange) {
    this.relativeDate = event.checked;

    if (!this.relativeDate) {
      this.expectedForm = this.fb.group({
        document_name: new UntypedFormControl(this.expectedForm.value.document_name, [Validators.required, Validators.minLength(2)]),
        document_user_type: new UntypedFormControl(this.expectedForm.value.document_user_type, Validators.required),
        is_for_all_student: new UntypedFormControl(this.expectedForm.value.is_for_all_student, Validators.required),
        deadline_date: new UntypedFormControl('', [CustomValidators.date, Validators.required]),
        docUploadDateRetakeExam: this.expectedForm.value.docUploadDateRetakeExam,
      });
    } else {
      this.expectedForm = this.fb.group({
        document_name: new UntypedFormControl(this.expectedForm.value.document_name, [Validators.required, Validators.minLength(2)]),
        document_user_type: new UntypedFormControl(this.expectedForm.value.document_user_type, Validators.required),
        is_for_all_student: new UntypedFormControl(this.expectedForm.value.is_for_all_student, Validators.required),
        numberOfDays: new UntypedFormControl('', [CustomValidators.gte(0), Validators.required]),
        daysBefore: new UntypedFormControl('before'),
        docUploadDateRetakeExam: this.expectedForm.value.docUploadDateRetakeExam,
      });
    }
  }

  changeValidators() {
    this.relativeDate = this.sliderRelative.value;
    if (!this.relativeDate) {
      this.expectedForm.get('deadline_date').get('before').patchValue(null);
      this.expectedForm.get('deadline_date').get('day').patchValue(null);
      this.expectedForm.get('deadline_date').get('day').clearValidators();
      this.expectedForm.get('deadline_date').get('before').clearValidators();
      this.expectedForm.get('deadline_date').get('before').updateValueAndValidity();
      this.expectedForm.get('deadline_date').get('day').clearValidators();
      this.expectedForm.get('deadline_date').get('day').updateValueAndValidity();

      this.expectedForm.get('deadline_date').get('deadline').get('date').setValidators([Validators.required]);
      this.expectedForm.get('deadline_date').get('deadline').get('date').updateValueAndValidity();
      this.expectedForm.get('deadline_date').get('deadline').get('time').setValidators([Validators.required]);
      this.expectedForm.get('deadline_date').get('deadline').get('time').updateValueAndValidity();
    } else {
      this.expectedForm.get('deadline_date').get('deadline').get('date').patchValue('');
      this.expectedForm.get('deadline_date').get('deadline').get('time').patchValue('');
      this.expectedForm.get('deadline_date').get('deadline').get('date').clearValidators();
      this.expectedForm.get('deadline_date').get('deadline').get('date').updateValueAndValidity();
      this.expectedForm.get('deadline_date').get('deadline').get('time').clearValidators();
      this.expectedForm.get('deadline_date').get('deadline').get('time').updateValueAndValidity();

      this.expectedForm.get('deadline_date').get('before').setValidators([Validators.required]);
      this.expectedForm.get('deadline_date').get('before').updateValueAndValidity();
      this.expectedForm.get('deadline_date').get('day').setValidators([Validators.required]);
      this.expectedForm.get('deadline_date').get('day').updateValueAndValidity();
    }
  }

  checkNumberOfDays() {
    if (this.expectedForm.get('deadline_date').get('day').value < 0) {
      this.expectedForm.get('deadline_date').get('day').setValue(1);
    }
  }

  studentCheck(event) {


    // check by id
    if (event && event.value === this.studentId) {
      this.isStudent = true;
      this.expectedForm.get('is_for_all_student').patchValue(false);
      this.expectedForm.get('is_for_all_group').patchValue(false);
    } else {
      this.isStudent = false;
      this.expectedForm.get('is_for_all_student').patchValue(false);
      this.expectedForm.get('is_for_all_group').patchValue(false);
    }
  }

  passExpectedFormData() {
    const data = _.cloneDeep(this.expectedForm.value);

    if (this.relativeDate === false) {
      data.deadline_date.type = 'fixed';
      data.deadline_date.before = null;
      data.deadline_date.day = null;
      const newDate = new Date(data.deadline_date.deadline.date);
      const utcDate = this.parseLocalToUTCPipe.transformDate(moment(newDate).format('DD/MM/YYYY'), data.deadline_date.deadline.time);
      const utcTime = this.parseLocalToUTCPipe.transform(data.deadline_date.deadline.time);
      data.deadline_date.deadline.date = utcDate;
      data.deadline_date.deadline.time = utcTime;
    } else if (this.relativeDate === true) {
      data.deadline_date.type = 'relative';
    }

    const payload = _.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe());

    if (this.data && this.data.type) {
      // update expected document
      payload.expected_documents[this.data.index] = data;
    } else {
      // create and push expected document
      if (payload.expected_documents && payload.expected_documents.length) {
        payload.expected_documents.push(data);
      } else {
        payload.expected_documents = [];
        payload.expected_documents.push(data);
      }
    }

    this.testCreationService.setTestCreationData(
      _.merge(_.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe()), payload),
    );

    this.cancelNewExpectedDoc();
  }

  close() {
    this.dialogRef.close();
  }

  inputName(event) {
    this.expectedForm.get('document_name').markAsTouched();
    this.expectedForm.get('document_name').markAsDirty();
  }

  // *************** If Date is picked and time is not yet, it will auto populate time to be 07:00
  datePicked() {
    if (
      this.expectedForm.get('deadline_date').get('deadline').get('date').value &&
      !this.expectedForm.get('deadline_date').get('deadline').get('time').value
    ) {
      this.expectedForm.get('deadline_date').get('deadline').get('time').patchValue('07:00');
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
