import { Component, OnInit, Output, Input, EventEmitter, OnChanges, OnDestroy, ViewChild } from '@angular/core';
import { UntypedFormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { FileUploadService } from 'app/service/file-upload/file-upload.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { StudentsService } from 'app/service/students/students.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import * as moment from 'moment';
import { DatePipe } from '@angular/common';
import { TranscriptProcessService } from 'app/service/transcript-process/transcript-process.service';
import { STYLE } from 'app/title-rncp/conditions/class-condition/score/second-step-score/condition-score-preview/pdf-styles';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { environment } from 'environments/environment';
import { StudenntTranscriptDetailComponent } from './student-transcript-detail/student-transcript-detail.component';
import { JOBSTYLES } from '../job-description/job-description-pdf/job-pdf-style';
import { PDFResultService } from 'app/service/transcript-pdf-result/transcript-pdf-result.service';
import { DateAdapter } from '@angular/material/core';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-certification',
  templateUrl: './certification.component.html',
  styleUrls: ['./certification.component.scss'],
  providers: [ParseStringDatePipe, ParseLocalToUtcPipe, ParseUtcToLocalPipe, DatePipe],
})
export class CertificationComponent implements OnInit, OnChanges, OnDestroy {
  private subs = new SubSink();
  @Input() studentId = '';
  @Input() studentPrevCourseData?: any;
  @Input() schoolId: string;
  @Input() classId: string;
  @Input() titleId: string;
  @Output() continue = new EventEmitter<boolean>();
  myInnerHeight = 600;
  today = new Date();
  isWaitingForResponse = false;
  studentData: any;
  studentDetailData: any;
  transcriptData: any;
  datePipe: DatePipe;
  juryForStudent: any;
  juryRetakeBlock: any;
  statusCard = {
    transcript: false,
    school_board: false,
    student: false,
    final_result: false,
    transcript_status: '',
    school_board_status: '',
    student_status: '',
    final_result_status: '',
    transcript_icon: '',
    school_board_icon: '',
    student_icon: '',
    final_result_icon: '',
  };

  dataDates = {
    transcript_date: '',
    school_date: '',
    student_date: '',
    retake_result_date: '',
    after_final_retake_date: '',
  };

  jurySelectedBlockMap = [];
  indexDetailTrancript: any;
  transcriptId: any;
  isMyFile
  @ViewChild('finalTranscriptPDF', { static: false }) finalTranscriptPDF: StudenntTranscriptDetailComponent;
  numberToAlp = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'W', 'X', 'Y', 'Z'];

  CPEB_BLOC_2020 = '5d67c89d124f9915d4afa186';

  isEvalCompetence = false;
  firstBlockIndex = [];
  firstTimeLoaded = true;

  timeOutVal: any;
  juryProcessName: string;

  constructor(
    private fb: UntypedFormBuilder,
    private studentService: StudentsService,
    private router: Router,
    private rncpTitleService: RNCPTitlesService,
    public utilService: UtilityService,
    public translate: TranslateService,
    private fileUploadService: FileUploadService,
    private parseStringDatePipe: ParseStringDatePipe,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
    private parseUTCToLocalPipe: ParseUtcToLocalPipe,
    private transcriptService: TranscriptProcessService,
    private transcriptBuilderService: TranscriptBuilderService,
    private pdfResultService: PDFResultService,
    private dateAdapter: DateAdapter<Date>,
  ) { }

  ngOnInit() {
    this.getDataStudent();
    this.getDataOneStudent();

    this.dateAdapter.setLocale(this.translate.currentLang);
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      this.dateAdapter.setLocale(this.translate.currentLang);
    });
  }

  ngOnChanges() {
    this.subs.unsubscribe();
    this.getDataStudent();
    this.getDataOneStudent();
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  viewTranscriptDetail(transcriptId, indexTranscript) {
    if (this.isMyFile) {
      this.transcriptId = transcriptId
    } else {
      this.transcriptId = transcriptId._id
    }
    this.indexDetailTrancript = indexTranscript;
  }

  closeTranscriptDetail() {
    this.indexDetailTrancript = '';
  }

  getDataStudent() {
    let titleId = null
    let classId = null
    this.isMyFile = this.router.url.includes('my-file')
    titleId = this.titleId;
    classId = this.classId;
    if (this.studentPrevCourseData) {
      titleId = this.studentPrevCourseData.rncp_title._id;
      classId = this.studentPrevCourseData.current_class._id;
    }

    this.juryForStudent = [];
    this.datePipe = new DatePipe(this.translate.currentLang);
    this.subs.sink = this.transcriptService.getOneStudentTranscriptsPublished(this.studentId, titleId, classId).subscribe((response) => {
      // Check if class is expertise
      // if (response && response[0] && response[0].class_id && response[0].class_id === ) {

      // }
      if (response) {
        this.juryProcessName = response[0]?.class_id?.jury_process_name;
      }
      this.studentData = _.cloneDeep(response);
      if (this.isMyFile) {
        this.studentData = _.chain(this.studentData)
          .groupBy('transcript_process_id._id')
          .map((value, key) => ({ transcript_process_id: key, student_transcript: value }))
          .value();
        if (
          this.firstTimeLoaded &&
          this.studentData &&
          this.studentData.length &&
          this.studentData[0] &&
          this.studentData[0].student_transcript &&
          this.studentData[0].student_transcript[0].block_competence_condition_details &&
          this.studentData[0].student_transcript[0].block_competence_condition_details[0]
        ) {
          this.firstTimeLoaded = false;
          this.firstBlockIndex.push(this.studentData[0].student_transcript[0].block_competence_condition_details[0]);
        }
      }

    });
  }

  getDataOneStudent() {
    this.juryForStudent = [];
    this.datePipe = new DatePipe(this.translate.currentLang);
    if (this.studentPrevCourseData) {
      this.subs.sink = this.studentService
        .getStudentsPreviousCertification(
          this.schoolId,
          this.studentPrevCourseData.rncp_title._id,
          this.studentPrevCourseData.current_class._id,
          this.studentId,
        )
        .subscribe((response) => {
          // student's previous course data
          if (response && response[0]) {
            this.studentDetailData = _.cloneDeep(response[0]);

          }
        });
    } else {
      this.subs.sink = this.studentService.getStudentsCertification(this.studentId).subscribe((response) => {
        this.studentDetailData = _.cloneDeep(response);

      });
    }
  }

  getAutomaticHeight() {
    this.myInnerHeight = window.innerHeight - 435;
    return this.myInnerHeight;
  }

  formatRetakeBlock() {
    const tempData = _.cloneDeep(this.transcriptData);
    const selectedRetakeBlock = tempData.retake_block_for_students;
    this.jurySelectedBlockMap = [];
    if (selectedRetakeBlock && selectedRetakeBlock.length) {
      selectedRetakeBlock.forEach((block) => {

        const findIndex = this.jurySelectedBlockMap.findIndex((blockData) => {
          return block.block_id._id === blockData.id;
        });

        if (findIndex > -1) {
          this.jurySelectedBlockMap[findIndex].test.push({
            test_id: block.test_id._id,
            name: block.name,
            block_id: block.block_id._id,
            position: block.position,
            is_test_accepted_by_student: block.is_test_accepted_by_student,
          });
        } else {
          this.jurySelectedBlockMap.push({
            block_name: block.block_name,
            id: block.block_id._id,
            test: [
              {
                test_id: block.test_id._id,
                name: block.name,
                block_id: block.block_id._id,
                position: block.position,
                is_test_accepted_by_student: block.is_test_accepted_by_student,
              },
            ],
          });
        }
      });

    }
  }

  getDateFinalTranscript(transcriptData) {
    if (transcriptData && transcriptData.date_decision_school_board) {
      return this.translateDate(transcriptData.date_decision_school_board.date, transcriptData.date_decision_school_board.time);
    }
  }

  translateDate(datee, timee) {
    if (datee) {
      const finalTime = timee ? timee : '15:59';
      const date = this.parseStringDatePipe.transformStringToDate(this.parseUTCToLocalPipe.transformDate(datee, finalTime));
      this.datePipe = new DatePipe(this.translate.currentLang);
      return moment(date, 'DD/MM/YYYY');
      // return moment(date, 'DD/MM/YYYY').format('MM/DD/YYYY');
    }
  }

  getJuryDecisionDate(transcriptData) {
    return transcriptData.jury_decision_generated_on && transcriptData.jury_decision_generated_on.year
      ? this.getTranslatedDate(transcriptData.jury_decision_generated_on)
      : this.getTranslatedDate(this.convertDateObject(new Date()));
  }

  getStudentDecisionDate(transcriptData) {
    return transcriptData.student_decision_generated_on && transcriptData.student_decision_generated_on.year
      ? this.getTranslatedDate(transcriptData.student_decision_generated_on)
      : this.getTranslatedDate(this.convertDateObject(new Date()));
  }

  getDateAfterRetake(transcriptData) {
    return transcriptData.after_final_retake_decision_generated_on && transcriptData.after_final_retake_decision_generated_on.year
      ? this.getTranslatedDate(transcriptData.after_final_retake_decision_generated_on)
      : this.getTranslatedDate(this.convertDateObject(new Date()));
  }

  getTranslatedDate(dateObject) {
    if (dateObject) {
      const date = new Date(dateObject.year, dateObject.month - 1, dateObject.date);
      const translateDay = this.translate.instant('certification.day.' + moment(date).format('ddd').toUpperCase());
      return translateDay + ' ' + this.datePipe.transform(date);
    }
  }

  getAcadDisplayBlock(): boolean {
    return this.transcriptData.jury_decision_for_final_transcript && this.transcriptData.jury_decision_for_final_transcript === 'retaking';
  }

  isStudentDecision(): boolean {
    return this.transcriptData.jury_decision_for_final_transcript && this.transcriptData.jury_decision_for_final_transcript === 'retaking';
  }

  convertDateObject(newDAte: Date) {
    return {
      year: newDAte.getFullYear(),
      month: newDAte.getMonth() + 1,
      date: newDAte.getDate(),
    };
  }

  openFinalTranscriptPDF(transcript, index) {
    let studentTranscript
    if (this.isMyFile) {
      studentTranscript = transcript.student_transcript[index]
    } else {
      studentTranscript = transcript
    }

    if (
      studentTranscript.student_id &&
      studentTranscript.student_id.final_transcript_pdf_histories &&
      studentTranscript.student_id.final_transcript_pdf_histories.length
    ) {
      // Checking only if transcirpt process id exist in history
      const checkStudentTranscript = studentTranscript.student_id.final_transcript_pdf_histories.find(
        (list) =>{
          if(list.student_transcript_id._id === studentTranscript._id) {
            return list
          }
        }    
      );
      const checkTranscriptProcess = studentTranscript.student_id.final_transcript_pdf_histories.filter(
        (list) => {
          if(list.transcript_process_id._id === studentTranscript.transcript_process_id._id) {
            return list
          }
        })
      const pdfGenerationLink = checkStudentTranscript ? checkStudentTranscript : checkTranscriptProcess ;
      if (pdfGenerationLink && pdfGenerationLink.final_transcript_pdf_link) {
        const link = document.createElement('a');
        link.setAttribute('type', 'hidden');
        link.href = `${environment.apiUrl}/fileuploads/${pdfGenerationLink.final_transcript_pdf_link}`.replace('/graphql', '');
        link.target = '_blank';
        link.click();
        link.remove();
      } else {
        this.regeneratePDF(studentTranscript);
      }
    } else {
      this.regeneratePDF(studentTranscript);
    }
  }

  regeneratePDF(element) {
    this.isWaitingForResponse = true;
    this.subs.sink = this.studentService.GenerateFinalTranscriptPDF(element.transcript_process_id._id, element.student_id._id).subscribe(
      (data) => {
        this.isWaitingForResponse = false;
        this.getDataStudent();
        this.getDataOneStudent();
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

  openFinalTranscriptPDFCpebBloc2020() {
    this.transcriptService.getCpebFinalTranscriptPdf(this.studentId).subscribe((resp) => {
      const a = document.createElement('a');
      a.target = 'blank';
      a.href = `${environment.apiUrl}/fileuploads/${resp.cpeb_ft_pdf}?download=true`.replace('/graphql', '');
      a.download = resp.cpeb_ft_pdf;
      a.click();
      a.remove();
    });
  }

  downloadResultFile(data) {

    let timeDisabled = 3;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('FINAL_S9.TITLE'),
      html: this.juryProcessName ? this.translate.instant('Grand_Oral_Improvement.FINAL_S9.TEXT', {processName : this.juryProcessName}) 
      : this.translate.instant('FINAL_S9.TEXT'),
      confirmButtonText: this.translate.instant('FINAL_S9.BUTTON_1'),
      cancelButtonText: this.translate.instant('FINAL_S9.BUTTON_2'),
      footer: `<span style="margin-left: auto">FINAL_S9</span>`,
      showCancelButton: true,
      allowOutsideClick: false,
      allowEnterKey: false,
      allowEscapeKey: true,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('FINAL_S9.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('FINAL_S9.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      if (result.value) {
        this.isWaitingForResponse = true;
        const payload = {
          rncp_id: this.titleId,
          student_id: this.studentId,
          lang: this.translate.currentLang,
          is_from_mark_entry: false,
          student_transcript_id: data?._id,
          grand_oral_id:
            this.isMyFile && data.student_transcript &&
              data.student_transcript.length &&
              data.student_transcript[0].student_id &&
              data.student_transcript[0].student_id.jury_organization_id
              ? data.student_transcript[0].student_id.jury_organization_id._id :
              !this.isMyFile && data &&
                data.student_id &&
                data.student_id.jury_organization_id ? data.student_id.jury_organization_id._id
                : null,
        };
        this.subs.sink = this.rncpTitleService.downloadGrandOralResult(payload).subscribe((resp) => {
          let fileName;
          fileName = _.cloneDeep(resp['fileName']);

          this.isWaitingForResponse = false;
          const a = document.createElement('a');
          a.target = 'blank';
          a.href = `${environment.apiUrl}/fileuploads/${fileName.fileName}?download=true`.replace('/graphql', '');
          a.download = fileName.fileName;
          a.click();
          a.remove();
          // const newBlob = new Blob([resp], { type: "text/pdf" });
          // const data = window.URL.createObjectURL(newBlob);
          // const link = document.createElement('a');
          // link.href = data;
          // link.target = '_blank';
          // link.download = this.translate.instant('Grand Oral Result') + '.pdf';
          // document.body.appendChild(link);
          // link.click();
          // link.remove();
        }, (err) => {
          this.isWaitingForResponse = false;
          console.error('Something went wrong when downloading the grand oral result');
          console.error(err);
        });
      }
    });
  }

  allowedFinalTranscriptPDF() {
    if (
      this.studentDetailData &&
      this.studentDetailData.final_transcript_pdf_link &&
      this.studentDetailData.is_thumbups_green &&
      this.studentDetailData.jury_decision_for_final_transcript !== 'failed'
    ) {
      return true;
    }
    return false;
  }

  exportPdf() {
    const html = STYLE + this.getPdfHtml();
    const filename = `Student Transcript PDF`;
    this.transcriptBuilderService.generatePdf(html, filename).subscribe((res: any) => {
      const link = document.createElement('a');
      link.setAttribute('type', 'hidden');
      link.download = res.filename;
      link.href = environment.PDF_SERVER_URL + res.filePath;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      link.remove();
    });
  }

  getPdfHtml() {

    const fileDoc = document.getElementById('pdf-student-transcript').innerHTML;
    let html = JOBSTYLES;
    html = html + fileDoc;
    return html;
  }
}
