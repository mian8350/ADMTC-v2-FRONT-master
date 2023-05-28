import { Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { DateAdapter } from '@angular/material/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { SubSink } from 'subsink';
import * as moment from 'moment';
import * as _ from 'lodash';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { VoiceRecognitionService } from 'app/service/voice-recognition/voice-recognition.service';
import { debounceTime } from 'rxjs/operators';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { UtilityService } from 'app/service/utility/utility.service';

@Component({
  selector: 'ms-problematic-rejection-dialog',
  templateUrl: './problematic-rejection-dialog.component.html',
  styleUrls: ['./problematic-rejection-dialog.component.scss'],
  providers: [ParseLocalToUtcPipe],
})
export class ProblematicRejectionDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  isWaitingForResponse = false;
  form: UntypedFormGroup;
  currentUser;
  titleName = new UntypedFormControl({value: '', disabled: true});
  studentName = new UntypedFormControl({value: '', disabled: true});
  @ViewChild('descriptionInput', {static: false}) descriptionInput: ElementRef;

  constructor(
    private fb: UntypedFormBuilder,
    @Inject(MAT_DIALOG_DATA) public data,
    public dialogRef: MatDialogRef<ProblematicRejectionDialogComponent>,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    public voiceRecogService: VoiceRecognitionService,
    private translate: TranslateService,
    private utilService: UtilityService,
    private dateAdapter: DateAdapter<Date>
  ) {}

  ngOnInit() {
    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });

    // *************** Get current user login
    this.currentUser = this.utilService.getCurrentUser();

    // *************** Functionality for the form
    this.initForm();
    this.titleName.patchValue(this.data && this.data.rncp_title && this.data.rncp_title.short_name ? this.data.rncp_title.short_name : '');
    this.studentName.patchValue(
      this.data && this.data.civility && this.data.first_name && this.data.last_name
        ? this.translate.instant(this.data.civility) + ' ' + this.data.first_name + ' ' + this.data.last_name
        : '',
    );

    // *************** Functionality of Voice Recognition
    this.voiceRecogService.init();
    this.listenFormControl();
    this.listenVoice();
    this.startListening();
  }

  initForm() {
    this.form = this.fb.group({
      rncp: [this.data && this.data.rncp_title && this.data.rncp_title._id ? this.data.rncp_title._id : '', [Validators.required]],
      created_by: [this.currentUser && this.currentUser._id ? this.currentUser._id : '', [Validators.required]],
      student_id: [this.data && this.data._id ? this.data._id : '', [Validators.required]],
      priority: [1, [Validators.required]],
      description: ['', [Validators.required]],
      due_date: this.fb.group({
        date: ['', [Validators.required]],
        time: ['00:01', [Validators.required]],
      }),
    });
  }

  listenFormControl() {
    this.form
      .get('description')
      .valueChanges.pipe(debounceTime(800))
      .subscribe((result) => {
        if (result !== this.voiceRecogService.getText()) {
          this.voiceRecogService.updateText(result);
        }
      });
  }

  listenVoice() {
    this.subs.sink = this.voiceRecogService.textData$.subscribe((text) => {
      this.form.get('description').patchValue(text);
      if (this.descriptionInput && this.descriptionInput.nativeElement) {
        this.descriptionInput.nativeElement.focus();
      }
    });
  }

  startListening() {
    this.voiceRecogService.startListening();
  }

  createPayload() {
    const payload = _.cloneDeep(this.form.value);

    if (payload.due_date) {
      // payload.due_date.date = this.parseLocalToUTCPipe.transformDate(
      //   moment(payload.due_date.date).format('DD/MM/YYYY'),
      //   payload.due_date.time,
      // );
      // payload.due_date.time = this.parseLocalToUTCPipe.transform(payload.due_date.time);
      payload.due_date.date = this.getDueDate(payload.due_date.date);
      payload.due_date.time = this.getTodayTime();
    }

    return payload;
  }

  getDueDate(date) {
    if (date) {
      return moment(date).format('DD/MM/YYYY');
    }
    return moment().format('DD/MM/YYYY');
  }

  getTodayTime() {
    return '15:59'
  }

  closeDialog() {
    const payload = this.createPayload();


    this.dialogRef.close()
  }

  submit() {
    const payload = this.createPayload();
    this.dialogRef.close(payload);
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.voiceRecogService.abort();
    this.voiceRecogService.resetText();
  }
}
