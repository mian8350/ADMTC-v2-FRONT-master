import {
  AfterViewChecked,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  Renderer2,
  ViewChild,
} from '@angular/core';
import { Test } from '../../models/test.model';
import { RNCPTitlesService } from '../../service/rncpTitles/rncp-titles.service';
import { TestService } from '../../service/test/test.service';
import { TranslateService } from '@ngx-translate/core';
import * as moment from 'moment';
declare var jsPDF: any;
declare var html2canvas: any;
import { DatePipe } from '@angular/common';
import { TestCreationService } from 'app/service/test/test-creation.service';
import * as _ from 'lodash';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { SubSink } from 'subsink';
import { environment } from 'environments/environment';
import { ParseStringDatePipe } from 'app/shared/pipes/parse-string-date.pipe';
import { PRINTSTYLES } from 'assets/scss/theme/doc-style';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { TestCreationPayloadData } from '../test-creation/test-creation.model';

@Component({
  selector: 'ms-test-document',
  templateUrl: './test-document.component.html',
  styleUrls: ['./test-document.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseStringDatePipe],
})
export class TestDocumentComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @Output() expandView: EventEmitter<boolean> = new EventEmitter();
  test: any;
  @Input() rncpTitle: any;
  @Input() expanded;
  datePipe: DatePipe;
  userTypes = [];
  // @ViewChild('expectedDocuments') elEx: ElementRef;
  @ViewChild('document', { static: true }) el: ElementRef;
  @ViewChild('pagesElement', { static: true }) documentPagesRef: ElementRef;
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
  students: number[] = [];

  addedDocuments = [];

  pages: number;
  pageSectionsArray: any[] = [];
  visiblePage = 1;
  docFooterText = '';
  scholarSeason = '2019-2020';
  className: any;
  classId: any;
  dt = new Date();
  currentYear = this.dt.getFullYear();
  nextYear = this.dt.getFullYear() + 1;
  constructor(
    private testService: TestService,
    private appService: RNCPTitlesService,
    private renderer: Renderer2,
    private translate: TranslateService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private testCreationService: TestCreationService,
    private parseStringDatePipe: ParseStringDatePipe,
    private rncpTitlesService: RNCPTitlesService,
    private transcriptBuilderService: TranscriptBuilderService,
  ) {}

  ngOnInit() {
    this.subs.sink = this.testCreationService.testCreationData$.subscribe((test) => {
      this.test = _.cloneDeep(test);
      if (this.test) {
        this.classId = this.test.class_id;

        if (this.classId) {
          this.subs.sink = this.rncpTitlesService.getClassName(this.classId).subscribe((resp) => {
            this.className = resp.name;
          });
        }
        if (test) {
          if (test && !test.correction_grid.orientation) {
            test.correction_grid.orientation = 'portrait';
          }
          this.docFooterText =
            'ADMTC – ' + this.translate.instant('TEST.EVALUATIONGRID') + ' ' + test && test.name
              ? test.name
              : '' + ' – ' + this.rncpTitle.short_name + ' – ' + this.currentYear + ' / ' + this.nextYear;
          this.setNoOfStudents();
          this.renderData();
        }
      }
    });

    this.subs.sink = this.testCreationService.addedDocumentData$.subscribe((AddedDocument) => {
      this.addedDocuments = AddedDocument;
    });

    this.subs.sink = this.testCreationService.getAllUserType().subscribe((response) => {
      this.userTypes = response;
    });

    this.subs.sink = this.testService.resetTestDocumentPage$.subscribe((isReset) => {
      if (isReset) {
        this.visiblePage = 1;
        this.testService.triggerResetTestDocumentPage(false);
      }
    });
  }

  showBottomGrid(index) {

    return this.pages === index;
  }

  renderData() {
    // *************** get the data from sections_evalskill if test is evaluation by competence
    let sections = this.test.correction_grid.correction.sections;
    if (this.test.block_type === 'competence' || this.test.block_type === 'soft_skill') {
      sections = this.test.correction_grid.correction.sections_evalskill;
    }
    this.pageSectionsArray = [[]];
    let pageArrayIndex = 0;

    if (this.test && this.test.correction_grid && this.test.correction_grid.header && this.test.correction_grid.header.directive_long) {
      this.pageSectionsArray.push([]);
      pageArrayIndex = pageArrayIndex + 1;
    }

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

    

    // if (this.test && this.test.correction_grid && this.test.correction_grid.header && this.test.correction_grid.header.directive_long) {
    //   this.pageSectionsArray.push([]);
    // }
    // const isDirectiveLong =
    //   this.test && this.test.correction_grid && this.test.correction_grid.header && this.test.correction_grid.header.directive_long ? 1 : 0;

    this.pages = this.pageSectionsArray.length;

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
    const penalty = 0;
    const bonus = 0;
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

  editTest() {
    this.test.name = 'My test 1';
    this.testService.updateTest(this.test);
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

  getLastPage() {
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

    if (this.test.documents[0] && this.test.documents[0].publication_date) {
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

  getDocumentUserType(documentUserType: string) {
    for (const element of this.userTypes) {
      if (element._id === documentUserType) {
        return element.name;
      }
    }
  }

  downloadPDF() {
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
    html += this.getLastPage();
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

  downloadPDF_old() {
    const l = 842,
      b = 595;
    const orientation = this.test.correction_grid.orientation === 'landscape' ? 'l' : 'p';
    const sizeArray = this.test.correction_grid.orientation === 'landscape' ? [l * 2, b * 2] : [b * 2, l * 2];
    const doc = new jsPDF(orientation, 'pt', sizeArray);

    const e = this.documentPagesRef.nativeElement.children[0];
    const rect = e.getBoundingClientRect();
    const canvas = document.createElement('canvas');
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    canvas.style.width = rect.width + 'pt';
    canvas.style.height = rect.height + 'pt';
    const ctx = canvas.getContext('2d');
    ctx.scale(2, 2);
    ctx.translate(-rect.left, -rect.top);

    for (let size = 0; size < this.pages; size++) {
      doc.addPage();
    }
    for (let i = 0; i < this.documentPagesRef.nativeElement.children.length; i++) {
      this.documentPagesRef.nativeElement.children[i].setAttribute('style', 'display: none');
    }

    this.print(doc, 1, canvas);
  }

  print(doc: any, index: number, cnv: any) {
    if (index >= 2) {
      this.documentPagesRef.nativeElement.children[index - 2].setAttribute('style', 'display: none');
    }
    this.documentPagesRef.nativeElement.children[index - 1].setAttribute('style', 'display: block');
    const e = this.documentPagesRef.nativeElement.children[index - 1];
    const rect = e.getBoundingClientRect();
    const ctx = cnv.getContext('2d');
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    html2canvas(e.children[0], {
      canvas: cnv,
      letterRendering: true,
      width: rect.width,
      height: rect.height,
      onrendered: function (canvas: any) {
        doc.setPage(index);
        const data = canvas.toDataURL('image/png');
        doc.addImage(data, 'PNG', 0, 0);
        if (index === this.pages) {
          this.printDoc(doc);
        } else {
          const i = +index + 1;
          this.print(doc, i, cnv);
        }
      }.bind(this),
    });
  }

  printDoc(doc) {
    document.getElementsByTagName('body')[0].style.height = 'auto';
    document.getElementsByTagName('body')[0].style.width = 'auto';

    doc.setPage(this.pages + 1);
    let y = 70;
    doc.setFontSize(28);
    doc.text(20, y, this.translate.instant('TEST.IDENTITY'));
    doc.setFontSize(18);
    doc.text(20, (y = y + 30), this.translate.instant('TEST.TESTNAME') + ' : ' + this.test.name);
    doc.text(
      20,
      (y = y + 24),
      this.translate.instant('TEST.TESTTYPE') + ' : ' + this.translate.instant('PARAMETERS-RNCP.TEST.TYPE.' + this.test.type),
    );

    doc.text(20, (y = y + 24), 'Test ' + this.translate.instant('TEST.TESTDATE') + ' : ' + this.getTranslatedDate(this.test.date));
    doc.text(
      20,
      (y = y + 24),
      this.translate.instant('TEST.DATETYPE') + ' : ' + this.translate.instant('TEST.DATETYPES.' + this.test.date_type.toUpperCase()),
    );
    // doc.text(20, y = y + 24, this.translate.instant('TEST.MAXSCORE') + ' : ' + this.test.maxScore);
    doc.text(20, (y = y + 24), this.translate.instant('TEST.COEFFICIENT') + ' : ' + this.test.coefficient);
    doc.text(
      20,
      (y = y + 24),
      this.translate.instant('TEST.CORRECTIONTYPE') + ' : ' + this.translate.instant('TEST.CORRECTIONTYPES.' + this.test.correction_type),
    );
    //  doc.text(20, y = y + 24, this.translate.instant('TEST.ORGANISER') + ' : ' + this.test.organiser);

    doc.setFontSize(28);
    doc.text(20, (y = y + 60), this.translate.instant('TEST.CALENDERSTEPS'));
    doc.setFontSize(18);
    y = y + 6;
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
        doc.text(20, (y = y + 24), i + 1 + '.  ' + this.getTranslateWhat(this.test.calendar.steps[i].text) + ' : ' + dateString);
      }
    } else {
      doc.text(20, (y = y + 24), this.translate.instant('TEST.NOSTEPS'));
    }
    doc.setFontSize(28);
    doc.text(20, (y = y + 60), this.translate.instant('DOCUMENT.DOCUMENTS'));
    doc.setFontSize(18);
    y = y + 6;
    if (this.test.documents.length > 0) {
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
        doc.text(
          20,
          (y = y + 24),
          i +
            1 +
            '.  ' +
            this.test.documents[i].document_name +
            ' : ' +
            ' : ' +
            this.translate.instant('DOCUMENTTYPES.' + this.test.documents[i].type_of_document.toUpperCase()) +
            dateString,
        );
      }
    } else {
      doc.text(20, (y = y + 24), this.translate.instant('DOCUMENT.NODOCUMENTS'));
    }

    doc.setFontSize(28);
    doc.text(20, (y = y + 60), this.translate.instant('TEST.DOCUMENTSEXPECTED'));
    doc.setFontSize(18);
    y = y + 6;
    if (this.test.expected_documents.length > 0) {
      for (let i = 0; i < this.test.expected_documents.length; i++) {
        let dateString = '';
        if (this.test.expected_documents[i].deadline_date.type === 'fixed') {
          dateString = this.getTranslatedDateDocument(this.test.expected_documents[i].deadline_date['deadline']);
        } else {
          dateString =
            this.translate.instant(this.test.expected_documents[i].deadline_date['before'] ? 'BEFORE' : 'AFTER') +
            ' ' +
            this.test.expected_documents[i].deadline_date['days'] +
            ' ' +
            this.translate.instant('DAYS');
        }
        doc.text(20, (y = y + 24), i + 1 + '.  ' + this.test.expected_documents[i].document_name + ' : ' + dateString);
      }
    } else {
      doc.text(20, (y = y + 24), this.translate.instant('EXPECTEDDOCUMENT.NODOCUMENTS'));
    }
    doc.save(this.rncpTitle.short_name + '_' + this.test.name + '_' + this.getDDMMYY() + '.pdf');
  }

  getDocType(val) {
    return this.documentTypes.find((doc) => {
      return doc.value === val;
    }).view;
  }

  expand() {
    this.expanded = !this.expanded;
    this.expandView.emit(this.expanded);
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
    if (dateRaw && (dateRaw.date_utc === '' || dateRaw.time_utc === '')) {
      return '';
    }

    if (dateRaw && dateRaw.date && dateRaw.time) {
      dateRaw.date_utc = dateRaw.date;
      dateRaw.time_utc = dateRaw.time;
      delete dateRaw.date;
      delete dateRaw.time;
    }
    if (dateRaw && dateRaw.date_utc && dateRaw.time_utc) {
      return this.parseUTCtoLocal.transformDate(dateRaw.date_utc, dateRaw.time_utc);
    } else if (typeof dateRaw === 'object' && dateRaw.year && dateRaw.month && dateRaw.date) {
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

  getTranslatedDateDocument(dateRaw) {
    if (dateRaw && (dateRaw.date_utc === '' || dateRaw.time_utc === '')) {
      return '';
    }

    if (dateRaw && dateRaw.date_utc && dateRaw.time_utc) {
      dateRaw.date = dateRaw.date_utc;
      dateRaw.time = dateRaw.time_utc;
      delete dateRaw.date_utc;
      delete dateRaw.time_utc;
    }
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
    const url = `${environment.apiUrl}/fileuploads/${documentData.s3_file_name}?download=true`.replace('/graphql', '');
    window.open(url, '_blank');
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

  getTranslateTestDate(date) {
    if (date && date.date_utc && date.time_utc) {
      return this.parseUTCtoLocal.transformDate(date.date_utc, date.time_utc);
    } else {
      return this.parseStringDatePipe.transformStringToDate(date);
    }
  }

  getUserTypeToolTip(document) {
    let userTypeList = '';
    if (document.published_for_user_types_id && document.published_for_user_types_id.length) {
      document.published_for_user_types_id.forEach((userType, index) => {
        let text = '';
        if (index !== document.published_for_user_types_id.length - 1) {
          text = `${this.translate.instant(userType.name)}, `;
        } else {
          text = `${this.translate.instant(userType.name)}`;
        }
        userTypeList += text;
      });
    }
    return userTypeList;
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
