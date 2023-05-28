import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Inject, NgZone } from '@angular/core';
import { VoiceRecognitionService } from 'app/service/voice-recognition/voice-recognition.service';
import { SubSink } from 'subsink';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { debounceTime, take } from 'rxjs/operators';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';

@Component({
  selector: 'ms-speech-to-text-dialog',
  templateUrl: './speech-to-text-dialog.component.html',
  styleUrls: ['./speech-to-text-dialog.component.scss'],
})
export class SpeechToTextDialogComponent implements OnInit, OnDestroy {
  @ViewChild('autosize', {static: false}) autosize: CdkTextareaAutosize;
  private subs = new SubSink();
  textInput = new UntypedFormControl(['', Validators.required]);

  constructor(
    public voiceRecogService: VoiceRecognitionService,
    private dialogRef: MatDialogRef<SpeechToTextDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  ngOnInit() {
    this.voiceRecogService.init();
    this.listenFormControl();
    this.listenVoice();
    this.startListening();

    if (this.data) {

      this.textInput.patchValue(this.data);
    }
  }

  listenFormControl() {
    this.textInput.valueChanges.pipe(debounceTime(800)).subscribe((result) => {
      if (result !== this.voiceRecogService.getText()) {
        this.voiceRecogService.updateText(result);
      }
    });
  }

  listenVoice() {
    this.subs.sink = this.voiceRecogService.textData$.subscribe((text) => {
      this.textInput.patchValue(text);
    });
  }

  startListening() {
    this.voiceRecogService.startListening();
  }

  submit() {
    this.voiceRecogService.abort();
    this.dialogRef.close(this.textInput.value);
  }

  closeDialog() {
    this.voiceRecogService.abort();
    this.dialogRef.close(this.data ? this.data : '');
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
    this.voiceRecogService.abort();
    this.voiceRecogService.resetText();
  }
}
