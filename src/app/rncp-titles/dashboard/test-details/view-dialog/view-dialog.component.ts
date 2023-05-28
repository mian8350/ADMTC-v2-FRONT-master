import { Component, OnInit, Inject, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UtilityService } from 'app/service/utility/utility.service';
import { TestCreationPayloadData } from 'app/test/test-creation/test-creation.model';
import { TestCreationService } from 'app/service/test/test-creation.service';
import * as _ from 'lodash';
import * as moment from 'moment';
import { DatePipe } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';
import { ActivatedRoute } from '@angular/router';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { RncpTitleCardData } from 'app/rncp-titles/RncpTitle.model';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { SubSink } from 'subsink';
import { PRINTSTYLES } from 'assets/scss/theme/doc-style';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { environment } from 'environments/environment';
import { TestCorrectionService } from 'app/service/test-correction/test-correction.service';
import { PdfPersonalizedStudentComponent } from '../pdf-personalized-student/pdf-personalized-student.component';
import { PdfPersonalizedGroupComponent } from '../pdf-personalized-group/pdf-personalized-group.component';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-view-dialog',
  templateUrl: './view-dialog.component.html',
  styleUrls: ['./view-dialog.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class ViewDialogComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  test: TestCreationPayloadData;
  rncpTitle: RncpTitleCardData;
  expanded = true;
  datePipe: DatePipe;
  userTypes = [];
  students: number[] = [];
  addedDocuments = [];
  pages: number;
  pageSectionsArray: any[] = [];
  visiblePage = 1;
  docFooterText = '';
  scholarSeason = '2019-2020';
  dt = new Date();
  currentYear = this.dt.getFullYear();
  nextYear = this.dt.getFullYear() + 1;
  isWaitingForResponse = false;
  isWaitingForPdf = false;

  @ViewChild(PdfPersonalizedStudentComponent, { static: false }) pdfDetailRef: PdfPersonalizedStudentComponent;
  @ViewChild(PdfPersonalizedGroupComponent, { static: false }) pdfGroupDetailRef: PdfPersonalizedGroupComponent;
  @ViewChild('document', { static: true }) el: ElementRef;
  @ViewChild('pagesElement', { static: false }) documentPagesRef: ElementRef;
  @ViewChild('docRender', { static: true }) elRend: ElementRef;
  @ViewChild('documentLink', { static: true }) docLink: ElementRef;

  documentTypes = [
    {
      value: 'guideline',
      view: 'Guidelines',
    },
    {
      value: 'test',
      view: 'Test',
    },
    {
      value: 'scoring-rules',
      view: 'Scoring Rules',
    },
    {
      value: 'studentnotification',
      view: 'Notification to Student',
    },
    {
      value: 'other',
      view: 'Other',
    },
  ];

  constructor(
    public utilService: UtilityService,
    public dialogref: MatDialogRef<ViewDialogComponent>,
    private testCreationService: TestCreationService,
    private testCorrectionService: TestCorrectionService,
    @Inject(MAT_DIALOG_DATA) public parentData: TestCreationPayloadData,
    private translate: TranslateService,
    private route: ActivatedRoute,
    private rncpTitlesService: RNCPTitlesService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private transcriptBuilderService: TranscriptBuilderService,
  ) {}

  ngOnInit() {

    if (this.parentData) {
      this.isWaitingForResponse = true;
      this.subs.sink = this.testCreationService.getTestCreationData(this.parentData._id).subscribe(resp => {
        // this.isWaitingForResponse = false;
        this.test = _.cloneDeep(this.formatInitializationTestData(resp));

        this.rncpTitle = this.rncpTitlesService.getSelectedTitle();



        this.docFooterText =
        'ADMTC – ' +
        this.translate.instant('TEST.EVALUATIONGRID') +
        ' ' +
        this.test && this.test.name ? this.test.name : '' +
        ' – ' +
        this.rncpTitle.short_name +
        ' – ' +
        this.currentYear +
        ' / ' +
        this.nextYear;

        if (this.test && !this.test.correction_grid.orientation) {
          this.test.correction_grid.orientation = 'portrait';
        }
        this.renderData();
        this.addedDocuments = this.parentData.documents;

        this.subs.sink = this.testCreationService.getAllUserType().subscribe(response => {
          this.userTypes = response;
        })
        this.students = this.test.correction_grid.group_detail && this.test.correction_grid.group_detail.no_of_student
          ? Array(this.test.correction_grid.group_detail.no_of_student)
          : [];
      })
    }
    // this.subs.sink = this.testCorrectionService.statusLoading.subscribe((val: any) => {
    //     this.isWaitingForPdf = val;
    // });

    if (!this.utilService.isUserAcadDirAdmin()) {
      this.isWaitingDone(true);
    }
  }

  closeDialog() {
    this.dialogref.close();
  }

  renderData() {
    // *************** get the data from sections_evalskill if test is evaluation by competence
    let sections: any = this.test.correction_grid.correction.sections;
    if (this.test.block_type === 'competence' || this.test.block_type === 'soft_skill') {
      sections = this.test.correction_grid.correction.sections_evalskill;
    }
    this.pageSectionsArray = [[]];
    let pageArrayIndex = 0;
    for (let i = 0; i <= sections.length - 1; i++) {
      const section = sections[i];
      if (this.pageSectionsArray[pageArrayIndex]) {
        this.pageSectionsArray[pageArrayIndex].push(section);
      } else {
        this.pageSectionsArray.push([section]);
      }
      if (section.page_break && i !== sections.length - 1) {
        pageArrayIndex = pageArrayIndex + 1;
        this.pageSectionsArray.push([]);
      }
    }
    this.pages = this.pageSectionsArray.length;
  }

  downloadPDFPersonalized() {
    const target = this.documentPagesRef.nativeElement.children;
    const outer = document.createElement('div');
    outer.innerHTML = '';
    let html = PRINTSTYLES;
    html += `<div class="ql-editor document-parent"><div>`;
    // for (const element of target) {
    //   const wrap = document.createElement('div');
    //   const el = element.cloneNode(true);
    //   el.style.display = 'block';
    //   wrap.appendChild(el);
    //   html += wrap.innerHTML;
    // }
    html += `</div></div>`;
    html += this.getLastPage();
    const filename = this.rncpTitle && this.rncpTitle.short_name ? this.rncpTitle.short_name + '_' + this.test.name : this.test.name;
    const landscape = this.test.correction_grid.orientation === 'landscape' ? true : false;
    this.transcriptBuilderService.generatePdf(html, filename, landscape).subscribe((res: any) => {
      const element = document.createElement('a');
      element.href = environment.PDF_SERVER_URL + res.filePath;
      element.target = '_blank';
      element.setAttribute('download', res.filename);
      element.click();
    });
  }

  downloadPDF(isWithIdentity: boolean) {
    const target = this.documentPagesRef.nativeElement.children;
    const outer = document.createElement('div');
    outer.innerHTML = '';
    let html = PRINTSTYLES;
    html += `<div class="ql-editor document-parent"><div>`;
    for (const element of target) {
      const wrap = document.createElement('div');
      const el = element.cloneNode(true);
      el.style.display = 'block';
      wrap.appendChild(el);
      html += wrap.innerHTML;
    }
    html += `</div></div>`;

    if (isWithIdentity) {
      html += this.getLastPage();
    }

    const filename = this.rncpTitle.short_name + '_' + this.test.name;
    const landscape = this.test.correction_grid.orientation === 'landscape' ? true : false;
    this.transcriptBuilderService.generatePdf(html, filename, landscape).subscribe((res: any) => {
      const element = document.createElement('a');
      element.href = environment.PDF_SERVER_URL + res.filePath;
      element.target = '_blank';
      element.setAttribute('download', res.filename);
      element.click();
    });
  }

  getLastPage(): string {
    let testDetails =
      `<div style="font-size: 14px; padding: 1rem; page-break-before: always;">` +
      `<h2>` +
      this.translate.instant('TEST.IDENTITY') +
      `</h2>` +
      `<p>` +
      this.translate.instant('TEST.TESTNAME') +
      ` : ` +
      this.test.name +
      `</p>` +
      `<p>` +
      this.translate.instant('TEST.TESTTYPE') +
      ` : ` +
      this.translate.instant('PARAMETERS-RNCP.TEST.TYPE.' + this.test.type) +
      `</p>` +
      `<p>` +
      this.translate.instant('TEST.TESTDATE') +
      ` : ` +
      this.getTranslatedDate(this.test.date) +
      `</p>` +
      `<p>` +
      this.translate.instant('TEST.DATETYPE') +
      ` : ` +
      this.translate.instant('TEST.DATETYPES.' + this.test.date_type.toUpperCase()) +
      `</p>` +
      // `<p>` + this.translate.instant('TEST.MAXSCORE') + ` : ` + this.test.maxScore + `</p>` +
      `<p>` +
      `${this.test.coefficient ? `${this.translate.instant('TEST.COEFFICIENT')} : ${this.test.coefficient}` : ''}` +
      `</p>` +
      `<p>` +
      this.translate.instant('TEST.CORRECTIONTYPE') +
      ` : ` +
      this.translate.instant('TEST.CORRECTIONTYPES.' + this.test.correction_type) +
      `</p>` +
      //  `<p>` + this.translate.instant('TEST.ORGANISER') + ` : ` + this.test.organiser + `</p>` +
      `<h2>` +
      this.translate.instant('TEST.CALENDERSTEPS') +
      `</h2>`;

    if (this.test.calendar.steps.length > 0) {
      for (let i = 0; i < this.test.calendar.steps.length; i++) {
        let dateString = '';
        if (this.test.calendar.steps[i].date.type === 'fixed') {
          dateString = this.getTranslatedDateDocument(this.test.calendar.steps[i].date['value']);
        } else {
          dateString =
            this.translate.instant(this.test.calendar.steps[i].date['before'] ? 'BEFORE' : 'AFTER') +
            ' ' +
            this.test.calendar.steps[i].date['day'] +
            ' ' +
            this.translate.instant('DAYS');
        }
        testDetails += `<p>` + (i + 1) + '.  ' + this.getTranslateWhat(this.test.calendar.steps[i].text) + ' : ' + dateString + `</p>`;
      }
    } else {
      testDetails += `<p>` + this.translate.instant('TEST.NOSTEPS') + `</p>`;
    }

    testDetails += `<h2>` + this.translate.instant('DOCUMENT.DOCUMENTS') + `</h2>`;

    if (this.test.documents.length && typeof this.test.documents[0] === 'object') {
      for (let i = 0; i < this.test.documents.length; i++) {
        let dateString = '';
        if (this.test.documents[i].publication_date.type === 'fixed') {
          dateString = this.getTranslatedDateDocument(this.test.documents[i].publication_date['publication_date']);
        } else {
          dateString =
            this.translate.instant(this.test.documents[i].publication_date['before'] ? 'BEFORE' : 'AFTER') +
            ' ' +
            this.test.documents[i].publication_date['days'] +
            ' ' +
            this.translate.instant('DAYS');
        }
        testDetails +=
          `<p>` +
          (i + 1) +
          '.  ' +
          this.test.documents[i].document_name +
          ' : ' +
          this.translate.instant('DOCUMENTTYPES.' + this.test.documents[i].type_of_document.toUpperCase()) +
          ' : ' +
          dateString +
          `</p>`;
      }
    } else {
      testDetails += `<p>` + this.translate.instant('DOCUMENT.NODOCUMENTS') + `</p>`;
    }

    testDetails += `<h2>` + this.translate.instant('TEST.DOCUMENTSEXPECTED') + `</h2>`;

    if (this.test.expected_documents.length > 0) {
      for (let i = 0; i < this.test.expected_documents.length; i++) {
        let dateString = '';
        if (this.test.expected_documents[i].deadline_date.type === 'fixed') {
          dateString = this.getTranslatedDateDocument(this.test.expected_documents[i].deadline_date['deadline']);
        } else {
          dateString =
            this.translate.instant(this.test.expected_documents[i].deadline_date['before'] ? 'BEFORE' : 'AFTER') +
            ' ' +
            this.test.expected_documents[i].deadline_date['day'] +
            ' ' +
            this.translate.instant('DAYS');
        }
        testDetails += `<p>` + (i + 1) + '.  ' + this.test.expected_documents[i].document_name + ' : ' + dateString + `</p>`;
      }
    } else {
      testDetails += `<p>` + this.translate.instant('EXPECTEDDOCUMENT.NODOCUMENTS') + `</p>`;
    }
    testDetails += `</div>`;
    return testDetails;
  }

  formatInitializationTestData(response) {
    if (response) {
      if (response.parent_rncp_title && response.parent_rncp_title._id) {
        response.parent_rncp_title = response.parent_rncp_title._id
      }
      if (response.parent_category && response.parent_category._id) {
        response.parent_category = response.parent_category._id
      }
      if (response.class_id && response.class_id._id) {
        response.class_id = response.class_id._id
      }
      if (response.block_of_competence_condition_id && response.block_of_competence_condition_id._id) {
        response.block_of_competence_condition_id = response.block_of_competence_condition_id._id
      }
      if (response.subject_id && response.subject_id._id) {
        response.subject_id = response.subject_id._id
      }
      if (response.evaluation_id && response.evaluation_id._id) {
        response.evaluation_id = response.evaluation_id._id
      }
      if (response.schools && response.schools.length) {
        response.schools.forEach(test_date => {
          if (test_date.school_id && test_date.school_id._id) {
            test_date.school_id = test_date.school_id._id
          }
        });
      }
      if (response.documents && response.documents.length) {
        // this one to store behavioursubjects
        const tempAddedDocumentData = [];
        const tempDocumentsID = [];
        response.documents.forEach(addedDocument => {
          tempAddedDocumentData.push(_.cloneDeep(addedDocument));

          if (addedDocument && addedDocument._id) {
            tempDocumentsID.push(addedDocument._id);
          }
        });
        this.testCreationService.setAddedDocumentData(tempAddedDocumentData);
        response.documents = tempDocumentsID;
      }
      if (response.expected_documents && response.expected_documents.length) {
        response.expected_documents.forEach(expectedDocument => {
          if (expectedDocument.document_user_type && expectedDocument.document_user_type._id) {
            expectedDocument.document_user_type = expectedDocument.document_user_type._id
          }
        });
      }
      response.calendar.steps.forEach(task => {
        if (task.actor && task.actor._id) {
          task.actor = task.actor._id;
        }
        if (task.sender_type && task.sender_type._id) {
          task.sender_type = task.sender_type._id
        }
        if (task.sender && task.sender._id) {
          task.senderData = task.sender;
          task.sender = task.senderData._id;
        }
      });
    }
    return response;
  }

  showBottomGrid(index) {
    return this.pages === index;
  }

  getArrayExceptFirst() {
    return this.pageSectionsArray.slice(1);
  }

  showPreviousPage() {
    if (this.visiblePage > 1) {
      this.visiblePage = this.visiblePage - 1;
    }
  }

  showNextPage() {
    if (this.visiblePage < this.pages) {
      this.visiblePage = this.visiblePage + 1;
    }
  }

  setNoOfStudents() {
    this.students =
      this.test.correction_grid.group_detail && this.test.correction_grid.group_detail.no_of_student
        ? Array(this.test.correction_grid.group_detail.no_of_student)
        : [];
  }

  getTitleWidth() {
    const correction = this.test.correction_grid.correction;
    if (correction.comment_for_each_sub_section) {
      if (correction.show_direction_column) {
        if (correction.show_letter_marks_column && correction.show_number_marks_column) {
          return '30%';
        } else {
          return '35%';
        }
      } else {
        return '35%';
      }
    } else {
      if (correction.show_direction_column) {
        if (correction.show_letter_marks_column && correction.show_number_marks_column) {
          return '35%';
        } else {
          return '40%';
        }
      } else {
        return '70%';
      }
    }
  }

  getDirectionWidth() {
    const correction = this.test.correction_grid.correction;
    if (correction.comment_for_each_sub_section) {
      return '30%';
    } else {
      return '40%';
    }
  }

  getMaxScore() {
    let a = 0;
    let penalty = 0;
    let bonus = 0;
    if (this.test.type === 'free_continuous_control') {
      a = 20;
    } else {
      this.test.correction_grid.correction.sections.forEach((section, index) => {
        a += section.maximum_rating;
      });
    }
    return a;
  }

  getMaxCustomScore() {
    return this.test.correction_grid.correction.total_zone.additional_max_score;
  }

  getDDMMYY() {
    const date = new Date();
    const yy = date.getFullYear().toString().substr(2, 2);
    const mm = date.getMonth() < 9 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1; // getMonth() is zero-based
    const dd = date.getDate() < 10 ? '0' + date.getDate() : date.getDate();
    const d = '' + dd + mm + yy;
    return d;
  }

  getPrintDate(d) {
    let date: any = new Date(d);
    let dd: any = date.getDate();
    let mm: any = date.getMonth() + 1; // January is 0!

    const yyyy = date.getFullYear();
    if (dd < 10) {
      dd = '0' + dd;
    }
    if (mm < 10) {
      mm = '0' + mm;
    }
    date = dd + '/' + mm + '/' + yyyy;
    return date;
  }


  getDocumentUserType(documentUserType: string) {
    for (const element of this.userTypes) {
      if (element._id === documentUserType) {
        return element.name;
      }
    }
  }

  getDocType(val) {
    return this.documentTypes.find((doc) => {
      return doc.value === val;
    }).view;
  }

  getTranslateWhat(name) {
    if (name) {
      const value = this.translate.instant('TEST.AUTOTASK.' + name.toUpperCase());
      return value !== 'TEST.AUTOTASK.' + name.toUpperCase() ? value : name;
    } else {
      return '';
    }
  }

  getTranslateADMTCSTAFFKEY(name) {
    if (name) {
      const value = this.translate.instant('ADMTCSTAFFKEY.' + name.toUpperCase());
      return value !== 'ADMTCSTAFFKEY.' + name.toUpperCase() ? value : name;
    }
  }

  getTranslatedDate(dateRaw) {
    if (dateRaw && dateRaw.date_utc && dateRaw.time_utc) {
      return this.parseUTCtoLocal.transformDate(dateRaw.date_utc, dateRaw.time_utc);
    } else if (typeof dateRaw === 'object') {
      const date = new Date(dateRaw.year, dateRaw.month, dateRaw.date, dateRaw.hour, dateRaw.minute);
      this.datePipe = new DatePipe(this.translate.currentLang);
      return this.datePipe.transform(date, 'EEE d MMM, y');
    } else {
      let date = dateRaw;
      if (typeof date === 'number') {
        date = date.toString();
      }
      if (date.length === 8) {
        const year: number = parseInt(date.substring(0, 4));
        const month: number = parseInt(date.substring(4, 6));
        const day: number = parseInt(date.substring(6, 8));
        date = new Date(year, month, day);
      }
      this.datePipe = new DatePipe(this.translate.currentLang);
      return this.datePipe.transform(date, 'EEE d MMM, y');
    }
  }

  getTranslatedDateDocument(dateRaw) {
    if (dateRaw && dateRaw.date && dateRaw.time) {
      return this.parseUTCtoLocal.transformDate(dateRaw.date, dateRaw.time);
    } else if (typeof dateRaw === 'object') {
      const date = new Date(dateRaw.year, dateRaw.month, dateRaw.date, dateRaw.hour, dateRaw.minute);
      this.datePipe = new DatePipe(this.translate.currentLang);
      return this.datePipe.transform(date, 'EEE d MMM, y');
    } else {
      let date = dateRaw;
      if (typeof date === 'number') {
        date = date.toString();
      }
      if (date.length === 8) {
        const year: number = +date.substring(0, 4);
        const month: number = +date.substring(4, 6);
        const day: number = +date.substring(6, 8);
        date = new Date(year, month, day);
      }
      this.datePipe = new DatePipe(this.translate.currentLang);
      return this.datePipe.transform(date, 'EEE d MMM, y');
    }
  }

  downloadDocumentAdded(documentData) {
    window.open(documentData.file_path, '_blank');
  }


  getLocalDate(date) {
    if (this.translate.currentLang.toLowerCase() === 'en') {
      return moment(date).format('MM/DD/YYYY');
    }
    return moment(date).format('DD/MM/YYYY');
  }

  getTaskTranslation(task: any): string {
    const isAutomaticTask = task.is_automatic_task ? task.is_automatic_task : '';
    const taskType = task.text;

    if (isAutomaticTask) {
      // convert taskType from assign_corrector to be ASSIGN CORRECTOR
      const convertedTaskType = taskType.replace(/_/g, ' ').toUpperCase();
      return this.translate.instant('TEST.AUTOTASK.' + convertedTaskType);
    }
    return taskType;
  }

  isWaitingDone(event) {
    if (event) {

      this.isWaitingForResponse = false;
    }
  }

  getPdfPersonalizedInZip() {

    const currentUser = JSON.parse(localStorage.getItem('userProfile'));
    const currentEntity = currentUser && currentUser.entities && currentUser.entities[0] ? currentUser.entities[0] : null;

    const titleName = this.rncpTitle && this.rncpTitle.short_name ? this.rncpTitle.short_name : '';
    const testName = this.test && this.test.name ? this.test.name : '';
    const schoolName = currentEntity && currentEntity.school && currentEntity.school.short_name ? currentEntity.school.short_name : '';

    if (this.test && this.test.group_test) {
      const groupPdfResults = this.pdfGroupDetailRef.generateMultipleGroupPdfHtml();
      if (groupPdfResults && groupPdfResults.length) {
        const payload = {
          pdfs: groupPdfResults,
          zip_name: `${titleName} - ${testName} - ${schoolName}`,
          test_id: this.test._id,
          lang: this.translate.currentLang
        }
        this.subs.sink = this.testCorrectionService.getPdfPersonalizedInZip(payload).subscribe(resp => {

          if (resp) {
            Swal.fire({
              type: 'success',
              title: this.translate.instant('PROEVAL_S4.TITLE'),
              html: this.translate.instant('PROEVAL_S4.TEXT'),
              footer: `<span style="margin-left: auto">PROEVAL_S4</span>`,
              confirmButtonText: this.translate.instant('PROEVAL_S4.BUTTON')
            })
          }
        });
      } else {
        Swal.fire({
          type: 'error',
          title: this.translate.instant('NOMINATIF_S1.TITLE'),
          html: this.translate.instant('NOMINATIF_S1.TEXT'),
          footer: `<span style="margin-left: auto">NOMINATIF_S1</span>`,
          confirmButtonText: this.translate.instant('NOMINATIF_S1.BUTTON')
        })
      }
    } else {
      const studentPdfResults = this.pdfDetailRef.generateMultipleStudentPdfHtml();
      const payload = {
        pdfs: studentPdfResults,
        zip_name: `${titleName} - ${testName} - ${schoolName}`,
        test_id: this.test._id,
        lang: this.translate.currentLang
      }

      this.subs.sink = this.testCorrectionService.getPdfPersonalizedInZip(payload).subscribe(resp => {

        if (resp) {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('PROEVAL_S4.TITLE'),
            html: this.translate.instant('PROEVAL_S4.TEXT'),
            footer: `<span style="margin-left: auto">PROEVAL_S4</span>`,
            confirmButtonText: this.translate.instant('PROEVAL_S4.BUTTON')
          })
        }
      })
    }
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

//   downloadPDF() {}

//   closeDialog(object?: any) {
//     this.dialogref.close();
//   }

//   renderData() {
//     const sections = this.test.correction_grid.correction.sections;
//     this.pageSectionsArray = [[]];
//     let pageArrayIndex = 0;
//     for (let i = 0; i <= sections.length - 1; i++) {
//       const section = sections[i];
//       if (this.pageSectionsArray[pageArrayIndex]) {
//         this.pageSectionsArray[pageArrayIndex].push(section);
//       } else {
//         this.pageSectionsArray.push([section]);
//       }
//       if (section.page_break && i !== sections.length - 1) {
//         pageArrayIndex = pageArrayIndex + 1;
//         this.pageSectionsArray.push([]);
//       }
//     }
//     this.pages = this.pageSectionsArray.length;

//   }

//   getArrayExceptFirst() {
//     return this.pageSectionsArray.slice(1);
//   }

//   showPreviousPage() {
//     if (this.visiblePage > 1) {
//       this.visiblePage = this.visiblePage - 1;
//     }
//   }

//   showNextPage() {
//     if (this.visiblePage < this.pages) {
//       this.visiblePage = this.visiblePage + 1;
//     }
//   }

//   setNoOfStudents() {
//     this.students =
//       this.test.correction_grid.group_detail && this.test.correction_grid.group_detail.no_of_student
//         ? Array(this.test.correction_grid.group_detail.no_of_student)
//         : [];
//   }

//   getTitleWidth() {
//     const correction = this.test.correction_grid.correction;
//     if (correction.comment_for_each_sub_section) {
//       if (correction.show_direction_column) {
//         if (correction.show_letter_marks_column && correction.show_number_marks_column) {
//           return '30%';
//         } else {
//           return '35%';
//         }
//       } else {
//         return '35%';
//       }
//     } else {
//       if (correction.show_direction_column) {
//         if (correction.show_letter_marks_column && correction.show_number_marks_column) {
//           return '35%';
//         } else {
//           return '40%';
//         }
//       } else {
//         return '70%';
//       }
//     }
//   }

//   getDirectionWidth() {
//     const correction = this.test.correction_grid.correction;
//     if (correction.comment_for_each_sub_section) {
//       return '30%';
//     } else {
//       return '40%';
//     }
//   }

//   getMaxScore() {
//     let a = 0;
//     let penalty = 0;
//     let bonus = 0;
//     if (this.test.type === 'free_continuous_control') {
//       a = 20;
//     } else {
//       this.test.correction_grid.correction.sections.forEach((section, index) => {
//         a += section.maximum_rating;
//       });
//     }
//     return a;
//   }

//   getMaxCustomScore() {
//     return this.test.correction_grid.correction.total_zone.additional_max_score;
//   }

//   showBottomGrid(index) {

//     return this.pages === index;
//   }
}
