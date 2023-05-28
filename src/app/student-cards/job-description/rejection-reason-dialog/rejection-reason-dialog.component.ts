import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { VoiceRecognitionService } from 'app/service/voice-recognition/voice-recognition.service';
import { SpeechToTextDialogComponent } from 'app/shared/components/speech-to-text-dialog/speech-to-text-dialog.component';
import { debounceTime } from 'rxjs/operators';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-rejection-reason-dialog',
  templateUrl: './rejection-reason-dialog.component.html',
  styleUrls: ['./rejection-reason-dialog.component.scss']
})
export class RejectionReasonDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  textInput = new UntypedFormControl(['', Validators.required]);

  constructor(
    private dialog: MatDialog,
    private dialogRef: MatDialogRef<RejectionReasonDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit() {
    if (this.data) {

      this.textInput.patchValue(this.data);
    } else {
      this.textInput.patchValue('')
    }
  }

  submit() {
    this.dialogRef.close({reason: this.textInput.value, submit: true });
  }

  closeDialog() {
    this.dialogRef.close();
  }

  recordNote() {
    this.dialog
      .open(SpeechToTextDialogComponent, {
        width: '700px',
        minHeight: '300px',
        panelClass: 'candidate-note-record',
        disableClose: true,
        data: '',
      })
      .afterClosed()
      .subscribe((text) => {
        if(text) {
          const rejectionVoice = this.textInput.value;
          if (text?.trim()) {
            const voiceText = `${text}`;
            let displayText;
            if(!rejectionVoice) {
              displayText = `${rejectionVoice}${voiceText}`;
            } else {
              displayText = `${rejectionVoice} \n${voiceText}`;
            }
            this.textInput.setValue(displayText);
          }      
        }
      });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
