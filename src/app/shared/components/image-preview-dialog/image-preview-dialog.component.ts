import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Inject, NgZone } from '@angular/core';
import { VoiceRecognitionService } from 'app/service/voice-recognition/voice-recognition.service';
import { SubSink } from 'subsink';
import { FormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { debounceTime, take } from 'rxjs/operators';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';

@Component({
  selector: 'ms-image-preview-dialog',
  templateUrl: './image-preview-dialog.component.html',
  styleUrls: ['./image-preview-dialog.component.scss'],
})
export class ImagePreviewDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();

  constructor(
    private dialogRef: MatDialogRef<ImagePreviewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit() {

  }

  closeDialog() {
    this.dialogRef.close(this.data ? this.data : '');
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
