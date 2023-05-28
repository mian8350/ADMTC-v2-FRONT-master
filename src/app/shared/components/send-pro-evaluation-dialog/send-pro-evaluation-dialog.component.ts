import { AfterViewInit, ChangeDetectorRef, Component, Inject, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { PdfPersonalizedStudentComponent } from 'app/rncp-titles/dashboard/test-details/pdf-personalized-student/pdf-personalized-student.component';
import { TestCorrectionService } from 'app/service/test-correction/test-correction.service';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { environment } from 'environments/environment';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import { debounceTime } from 'rxjs/operators';

@Component({
  selector: 'ms-send-pro-evaluation-dialog',
  templateUrl: './send-pro-evaluation-dialog.component.html',
  styleUrls: ['./send-pro-evaluation-dialog.component.scss']
})
export class SendProEvaluationDialogComponent implements OnInit {
  // @ViewChildren('pdfNominatif') pdfDetailRef: QueryList<PdfPersonalizedStudentComponent>;
  @ViewChild('pdfNominatifAcademic', { static: false }) pdfNominatifAcademic: PdfPersonalizedStudentComponent;
  @ViewChild('pdfNominatifSoftSkill', { static: false }) pdfNominatifSoftSkill: PdfPersonalizedStudentComponent;
  private subs = new SubSink();

  isWaitingForResponse = true;
  waitingDoneCount = 0;

  testAcademic;
  testSoftSkill;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    public dialogRef: MatDialogRef<SendProEvaluationDialogComponent>,
    private translate: TranslateService,
    private testCorrectionService: TestCorrectionService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {

    if (this.data && this.data.testData && this.data.testData.length) {
      this.data.testData.forEach(test => {
        if (test && test.block_type === 'competence') {
          this.testAcademic = _.cloneDeep(test);
        } else if (test && test.block_type === 'soft_skill') {
          this.testSoftSkill = _.cloneDeep(test);
        }
      });
    }
  }

  isWaitingDone(event) {
    if (event) {
      this.waitingDoneCount++;

      if (this.waitingDoneCount === this.data.testData.length) {
        this.isWaitingForResponse = false;
        setTimeout(time => {
          this.printPDF();
        }, 500);
        ;
      }
    }
  }

  printPDF() {

    const studentPdfResults = [];
    // if (this.pdfDetailRef && this.pdfDetailRef.length) {
    //   this.pdfDetailRef.forEach((component, index) => {
    //     const temp = _.cloneDeep(component.generateMultipleStudentPdfHtml());
    //     studentPdfResults.push(temp);
    //   })
    // }

    if (this.pdfNominatifAcademic) {

      studentPdfResults.push(this.pdfNominatifAcademic.generateMultipleStudentPdfHtml());
      this.pdfNominatifAcademic.ngOnDestroy();
      this.testAcademic = null;
      this.cdr.detectChanges();
    }
    if (this.pdfNominatifSoftSkill) {

      studentPdfResults.push(this.pdfNominatifSoftSkill.generateMultipleStudentPdfHtml());
      this.pdfNominatifSoftSkill.ngOnDestroy();
      this.testSoftSkill = null;
      this.cdr.detectChanges();
    }


     // this.dialogRef.close('success');

    const result = [];
    if (studentPdfResults && studentPdfResults.length) {
      studentPdfResults.forEach(studentPerTest => {
        if (studentPerTest && studentPerTest.length) {
          studentPerTest.forEach(student => {
            const foundStudentPDF = result.find(studentResult => studentResult.document_name === student.document_name)
            if (foundStudentPDF) {
              foundStudentPDF.html += student.html;
              if (student.landscape) {
                foundStudentPDF.landscape = true;
              }
            } else {
              result.push(student);
            }
          });
        }
      })
    }

    const payload = {
      pdfs: result,
      zip_name: this.translate.instant('Evaluation Pro'),
      lang: this.translate.currentLang,
      rncp_title_id: this.data.rncpTitle._id,
      class_id: this.data.classId
    }

    this.subs.sink = this.testCorrectionService.getPublishedAutoProEvalInZip(payload).subscribe(resp => {

      if (resp) {
        this.dialogRef.close('success');
      }
    })
  }

}
