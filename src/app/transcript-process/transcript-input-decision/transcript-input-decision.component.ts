import { ChangeDetectorRef, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PDFResultService } from 'app/service/transcript-pdf-result/transcript-pdf-result.service';
import * as _ from 'lodash';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { TranscriptDecisionComponent } from './transcript-decision/transcript-decision.component';

@Component({
  selector: 'ms-transcript-input-decision',
  templateUrl: './transcript-input-decision.component.html',
  styleUrls: ['./transcript-input-decision.component.scss'],
})
export class TranscriptInputDecisionComponent implements OnInit, OnDestroy {
  @Input() titleId: string;
  @Input() classId: string;
  @Input() certifierId: string;
  @Input() transcriptId: string;
  @ViewChild('transcriptStudentTableContainer', { static: true }) transcriptStudentTableContainer: ElementRef;
  @ViewChild('transcriptDecision', { static: false }) transcriptDecision: TranscriptDecisionComponent;

  studentId: string;
  transcriptDetail: any;
  refreshTable: boolean;
  isWaitingForResponse: boolean;
  classType: string;
  private subs = new SubSink();
  transcriptData: any;

  constructor(
    private router: Router,
    private cdRef: ChangeDetectorRef,
    private translate: TranslateService,
    private pdfResultService: PDFResultService,
  ) {}

  ngOnInit() {
    this.cdRef.detectChanges();
    this.subs.sink = this.pdfResultService.isWaitingResponseChange$.subscribe((value) => (this.isWaitingForResponse = value));
  }

  onTranscriptData(event: any) {
    this.transcriptData = event;
  }

  selectStudent(studentId) {
    const validated = this.checkValidationForm();

    if (validated) {
      this.studentId = studentId;
    } else {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('TMTC_S01.TITLE'),
        text: this.translate.instant('TMTC_S01.TEXT'),
        confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
        allowOutsideClick: false,
      }).then((res) => {
        if (res.dismiss) {
          this.studentId = studentId;
        }
      });
    }
  }

  checkValidationForm(transcriptDecision?) {
    let result = false;
    // *************** Take form of child component decision form to check if the form is changes but unsaved

    if (transcriptDecision || this.transcriptDecision) {
      const currentData = JSON.stringify((this.transcriptDecision || transcriptDecision).inputDecisionForm.value);
      const savedData = JSON.stringify((this.transcriptDecision || transcriptDecision).savedForm);
      if (currentData === savedData) {
        result = true;
      }
    } else {
      result = true;
    }

    return result;
  }

  setTranscriptDetail(data) {
    this.transcriptDetail = data;
  }

  triggerRefreshTable(isRefresh: boolean) {
    this.refreshTable = isRefresh;
  }

  triggerLoadTable(isLoad: boolean) {
    this.isWaitingForResponse = isLoad;
  }

  getClassType(type){
    this.classType = type;
  }

  getContainerWidth() {
    let offsetWidth = this.transcriptStudentTableContainer.nativeElement.offsetWidth;
    offsetWidth = offsetWidth ? +offsetWidth : 0;
    return offsetWidth;
  }

  leave() {
    this.router.navigate(['/transcript-process']);
  }

  ngOnDestroy() {
    this.studentId = null;
    this.subs.unsubscribe();
  }
}
