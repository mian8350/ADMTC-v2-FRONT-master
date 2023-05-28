import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { TranscriptProcessService } from 'app/service/transcript-process/transcript-process.service';
import { Observable } from 'rxjs';
import { startWith, map } from 'rxjs/operators';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import Swal from 'sweetalert2';

interface IdShortName {
  _id: string;
  short_name: string;
}
interface IdName {
  _id: string;
  name: string;
}

@Component({
  selector: 'ms-transcript-process-dialog',
  templateUrl: './transcript-process-dialog.component.html',
  styleUrls: ['./transcript-process-dialog.component.scss'],
})
export class TranscriptProcessDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();

  transcriptForm: UntypedFormGroup;
  isWaitingForResponse = false;

  // certifier dropdown
  certifierControl = new UntypedFormControl('');
  certifiers: IdShortName[] = [];
  filteredCertifiers: Observable<IdShortName[]>;

  // title dropdown
  titleControl = new UntypedFormControl('');
  rncpTitles: IdShortName[] = [];
  filteredTitles: Observable<any[]>;

  // class dropdown
  classControl = new UntypedFormControl('');
  classes: IdName[] = [];
  filteredClasses: Observable<IdName[]>;

  private timeOutVal: any;

  constructor(
    @Inject(MAT_DIALOG_DATA) public parentData: any,
    public dialogRef: MatDialogRef<TranscriptProcessDialogComponent>,
    private fb: UntypedFormBuilder,
    private translate: TranslateService,
    private transcriptService: TranscriptProcessService,
  ) {}

  ngOnInit() {
    this.initForm();
    this.getCertifierSchoolData();
  }

  initForm() {
    this.transcriptForm = this.fb.group({
      name: ['', [Validators.required]],
      certifier_id: ['', Validators.required],
      rncp_title_id: ['', Validators.required],
      class_id: ['', Validators.required],
    });
  }

  getCertifierSchoolData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.transcriptService.getCertifiersDropdown().subscribe((resp) => {
      this.isWaitingForResponse = false;
      this.certifiers = resp;
      this.filteredCertifiers = this.certifierControl.valueChanges.pipe(
        startWith(''),
        map((searchTxt) => this.certifiers.filter((sch) => sch.short_name.toLowerCase().includes(searchTxt.toLowerCase().trim()))),
      );
    });
  }

  selectCertifier(certifierId: string) {
    this.transcriptForm.get('certifier_id').setValue(certifierId);
    this.resetTitle();
    this.resetClass();

    this.isWaitingForResponse = true;
    this.subs.sink = this.transcriptService.getTitleDropdownListForFinalTranscript(certifierId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      this.rncpTitles = resp;
      this.filteredTitles = this.titleControl.valueChanges.pipe(
        startWith(''),
        map((searchTxt) => this.rncpTitles.filter((ttl) => ttl.short_name.toLowerCase().includes(searchTxt.toLowerCase().trim()))),
      );
    });
  }

  selectTitle(titleId: string) {
    this.transcriptForm.get('rncp_title_id').setValue(titleId);
    this.resetClass();

    const certifierId = this.transcriptForm.get('certifier_id').value;

    this.isWaitingForResponse = true;
    this.subs.sink = this.transcriptService.getClassDropdownListForFinalTranscript(certifierId, titleId).subscribe((resp) => {
      this.isWaitingForResponse = false;
      this.classes = resp;
      this.filteredClasses = this.classControl.valueChanges.pipe(
        startWith(''),
        map((searchTxt) => this.classes.filter((ttl) => ttl.name.toLowerCase().includes(searchTxt.toLowerCase().trim()))),
      );
    });
  }

  selectClass(classId: string) {
    this.transcriptForm.get('class_id').setValue(classId);
  }

  resetCertifierKey() {
    if (this.transcriptForm.get('certifier_id').value) {
      this.transcriptForm.get('certifier_id').setValue('');
      this.transcriptForm.get('rncp_title_id').setValue('');
      this.transcriptForm.get('class_id').setValue('');
      this.titleControl.setValue('');
      this.classControl.setValue('');
    }
  }

  resetTitleKey() {
    if (this.transcriptForm.get('rncp_title_id').value) {
      this.transcriptForm.get('rncp_title_id').setValue('');
      this.transcriptForm.get('class_id').setValue('');
      this.classControl.setValue('');
    }
  }

  resetClassKey() {
    if (this.transcriptForm.get('class_id').value) {
      this.transcriptForm.get('class_id').setValue('');
    }
  }

  resetTitle() {
    this.transcriptForm.get('rncp_title_id').setValue('');
    this.titleControl.setValue('');
    this.filteredTitles = new Observable();
    this.rncpTitles = [];
  }

  resetClass() {
    this.transcriptForm.get('class_id').setValue('');
    this.classControl.setValue('');
    this.filteredClasses = new Observable();
    this.classes = [];
  }

  submitForm() {

    const titleName = this.titleControl.value;
    const className = this.classControl.value;



    let timeDisabled = 5;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('TRANSCRIPT_S1.TITLE', { titleName: titleName, className: className}),
      html: this.translate.instant('TRANSCRIPT_S1.TEXT', { titleName: titleName, className: className}),
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('TRANSCRIPT_S1.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('TRANSCRIPT_S1.CANCEL'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('TRANSCRIPT_S1.CONFIRM') + ` (${timeDisabled})`;
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('TRANSCRIPT_S1.CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      if (res.value) {
        this.callSubmitAPI();
      }
    });

    // const payload = this.transcriptForm.value;
    // this.isWaitingForResponse = true;
    // this.subs.sink = this.transcriptService.checkUniqueNameForTranscript(payload).subscribe(response => {
    //   this.isWaitingForResponse = false;
    //   if (!response) {
    //     this.isWaitingForResponse = true;
    //     this.subs.sink = this.transcriptService
    //       .checkTranscriptProcessAlreadyCreated(payload.rncp_title_id, payload.class_id)
    //       .subscribe((resp) => {
    //         this.isWaitingForResponse = false;

    //         if (resp) {
    //           this.swalConfirmPreviousTranscript();
    //         } else {
    //           this.callSubmitAPI();
    //         }
    //       }, (err) => {
    //         this.isWaitingForResponse = false;
    //         this.swalError(err);
    //       });
    //   }
    // }, (err) => {
    //   this.swalError(err);
    // })
  }

  swalConfirmPreviousTranscript() {
    let timeDisabled = 5;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('SWAL_CONFIRM_HAS_PREV_TRANSCRIPT.TITLE'),
      html: this.translate.instant('There is previous transcript for this title and class'),
      allowEscapeKey: true,
      showCancelButton: true,
      confirmButtonText: this.translate.instant('SWAL_CONFIRM_HAS_PREV_TRANSCRIPT.CONFIRM', { timer: timeDisabled }),
      cancelButtonText: this.translate.instant('SWAL_CONFIRM_HAS_PREV_TRANSCRIPT.CANCEL'),
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('SWAL_CONFIRM_HAS_PREV_TRANSCRIPT.CONFIRM') + ` (${timeDisabled})`;
        }, 1000);
        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('SWAL_CONFIRM_HAS_PREV_TRANSCRIPT.CONFIRM');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      if (res.value) {
        this.callSubmitAPI();
      }
    });
  }

  callSubmitAPI() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.transcriptService.createTranscriptProcess(this.transcriptForm.value).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          Swal.fire({
            type: 'success',
            title: 'Bravo !',
          }).then(() => {

            this.dialogRef.close(resp._id);
          });
        }
      },
      (err) => {
        this.isWaitingForResponse = false;


        if (err['message'] === 'GraphQL error: transcript name already exist') {
          Swal.fire({
            type: 'error',
            title: this.translate.instant('TRANSCRIPT_S4.TITLE'),
            html: this.translate.instant('TRANSCRIPT_S4.TEXT'),
            confirmButtonText: this.translate.instant('TRANSCRIPT_S4.BUTTON'),
          });
        }
        // else if (err['message'] === 'GraphQL error: All Block Must Have Pass Fail Condition') {
        //   Swal.fire({
        //     type: 'error',
        //     title: this.translate.instant('SWAL_ERROR_TRANSCRIPT_PASS_FAIL_PARAMETER.TITLE'),
        //     html: this.translate.instant('All Block Must Have Pass Fail Condition'),
        //     confirmButtonText: this.translate.instant('SWAL_ERROR_TRANSCRIPT_PASS_FAIL_PARAMETER.BUTTON'),
        //   });
        // }
      },
    );
  }

  swalError(err) {

    Swal.fire({
      type: 'error',
      title: 'Error',
      text: err && err['message'] ? err['message'] : err,
      confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
    });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
