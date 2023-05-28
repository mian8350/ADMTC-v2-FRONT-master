import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { StudentsService } from 'app/service/students/students.service';
import { TranscriptProcessService } from 'app/service/transcript-process/transcript-process.service';
import { environment } from 'environments/environment';
import * as _ from 'lodash';
import { switchMap, take } from 'rxjs/operators';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-final-transcript-view',
  templateUrl: './final-transcript-view.component.html',
  styleUrls: ['./final-transcript-view.component.scss'],
})
export class FinalTranscriptViewComponent implements OnInit, OnDestroy {
  @Input() studentId = '';
  @Input() schoolId: string;

  private subs = new SubSink();

  public isWaitingForResponse: boolean = true;
  public studentTranscripts: any[] = [];

  constructor(
    private transcriptService: TranscriptProcessService,
    private studentsService: StudentsService,
    public translate: TranslateService,
  ) {}

  ngOnInit() {
    this.populateStudentTranscript();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  populateStudentTranscript() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.studentsService
      .getOneStudent(this.studentId)
      .pipe(
        take(1),
        switchMap((response) => {

          const studentId = this.studentId;
          const titleId = '';
          const classId = '';

          return this.transcriptService.getOneStudentTranscriptsPublished(studentId, titleId, classId);
        }),
      )
      .subscribe((response) => {
        this.isWaitingForResponse = false;
        this.studentTranscripts = _.cloneDeep(response);
      });
  }

  openFinalTranscriptPdf(studentTranscript) {
    if (!studentTranscript.student_id.final_transcript_pdf_histories) {
      this.regeneratePDF(studentTranscript);
      return;
    }

    const pdfGenerationLink = studentTranscript.student_id.final_transcript_pdf_histories.find((list) => {
      // Checking only if transcirpt process id exist in history
      return list.transcript_process_id._id === studentTranscript.transcript_process_id._id;
    });

    if (!pdfGenerationLink.final_transcript_pdf_link) {
      this.regeneratePDF(studentTranscript);
      return;
    }

    const link = document.createElement('a');
    link.setAttribute('type', 'hidden');
    link.href = `${environment.apiUrl}/fileuploads/${pdfGenerationLink.final_transcript_pdf_link}`.replace('/graphql', '');
    link.target = '_blank';
    link.click();
    link.remove();
  }

  regeneratePDF(studentTranscript) {
    this.isWaitingForResponse = true;

    const transcriptProccessId = studentTranscript.transcript_process_id._id;
    const studentId = studentTranscript.student_id._id;

    this.subs.sink = this.studentsService.GenerateFinalTranscriptPDF(transcriptProccessId, studentId).subscribe(
      (data) => {
        this.isWaitingForResponse = false;
        this.populateStudentTranscript();
        const link = document.createElement('a');
        link.setAttribute('type', 'hidden');
        link.href = `${environment.apiUrl}/fileuploads/${data}`.replace('/graphql', '');
        link.target = '_blank';
        link.click();
        link.remove();
      },
      (err) => {
        this.isWaitingForResponse = false;
      },
    );
  }
}
