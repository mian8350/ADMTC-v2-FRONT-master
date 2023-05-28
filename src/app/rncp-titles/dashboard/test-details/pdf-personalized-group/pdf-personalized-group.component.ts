import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { TestCorrectionService } from 'app/service/test-correction/test-correction.service';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { TestCorrection } from 'app/test-correction/test-correction.model';
import { ThirdStepComponent } from 'app/test/steps/third-step/third-step.component';
import { ScoreConversion, TestCreationPayloadData } from 'app/test/test-creation/test-creation.model';
import { environment } from 'environments/environment';
import { PRINTSTYLES } from 'assets/scss/theme/doc-style';
import { UtilityService } from 'app/service/utility/utility.service';
import { NgxPermission } from 'ngx-permissions/lib/model/permission.model';
import { NgxPermissionsService } from 'ngx-permissions';
import { AuthService } from 'app/service/auth-service/auth.service';
import { SubSink } from 'subsink';
import { forkJoin } from 'rxjs';
import cloneDeep from 'lodash/cloneDeep';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';

interface GroupCorrection {
  _id: string;
  name: string;
  school: any;
  students: StudentCorrection[];
  correction_grid?: any;
  isFirstSection?: boolean
  isLastSection?: boolean
}

interface StudentCorrection {
  _id: string;
  first_name: string;
  last_name: string;
  school: any;
  correction_grid?: any;
}

@Component({
  selector: 'ms-pdf-personalized-group',
  templateUrl: './pdf-personalized-group.component.html',
  styleUrls: ['./pdf-personalized-group.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class PdfPersonalizedGroupComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @Input() testData: TestCreationPayloadData;
  @Input() titleData: any;
  @Input() lastPageText: string;
  @Output() isWaitingDone = new EventEmitter();
  @ViewChild('pagesElement', { static: false }) documentPagesRef: ElementRef;

  schoolId = null;
  isUserAcadir;
  isUserAcadAdmin;
  currentUser;
  fullUserData;
  entityData;

  groupCorrections: GroupCorrection[] = [];
  testCorrections: TestCorrection[];
  sectionsPerPage: GroupCorrection[];
  sectionType: string;
  juryColumns = [0, 1, 2];

  individualGroupId;

  constructor(
    private testCorectionService: TestCorrectionService,
    private transcriptBuilderService: TranscriptBuilderService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private utilService: UtilityService,
    private permission: NgxPermissionsService,
    private authService: AuthService,
    private translate: TranslateService
  ) {}

  ngOnInit() {


    this.isUserAcadir = !!this.permission.getPermission('Academic Director');
    this.isUserAcadAdmin = !!this.permission.getPermission('Academic Admin');
    this.currentUser = this.utilService.getCurrentUser();

    const forkParam = [];
    const getUserData = this.authService.getUserById(this.currentUser._id);
    forkParam.push(getUserData);

    this.subs.sink = forkJoin(forkParam).subscribe(resp => {

      if (resp && resp.length) {
        if (resp[0]) {
          this.fullUserData = resp[0];
          if (this.isUserAcadir) {
            this.entityData = this.fullUserData.entities.find(
              (entity) => entity.type.name === 'Academic Director' && entity.assigned_rncp_title._id === this.titleData._id,
            );

            this.schoolId = this.entityData.school._id;
          } else if (this.isUserAcadAdmin) {
            this.entityData = this.fullUserData.entities.find(
              (entity) => entity.type.name === 'Academic Admin' && entity.assigned_rncp_title._id === this.titleData._id,
            );

            this.schoolId = this.entityData.school._id;
          }
        }
      }
      this.getGroups();
    })
  }

  getGroups() {
    this.testCorectionService.setStatusLoading(true);
    let groups: GroupCorrection[] = [];
    // get group data and it's student's test correction
    this.subs.sink = this.testCorectionService.getAllGroup(this.testData._id, this.schoolId).subscribe((resp) => {

      if (resp && resp.length) {
        groups = resp.map((group) => ({
          _id: group._id,
          name: group.name,
          school: group.school.short_name + ' - ' + group.school.long_name,
          students: group.students.map((student) => ({
            _id: student.student_id._id,
            first_name: student.student_id.first_name,
            last_name: student.student_id.last_name,
            school: student.student_id.school.short_name,
            correction_grid: student.individual_test_correction_id ? student.individual_test_correction_id.correction_grid : null,
          })),
        }));
        this.getAllGroupTestCorrection(groups);
      } else {
        this.isWaitingDone.emit(true);
      }
    });
  }

  getAllGroupTestCorrection(groups: GroupCorrection[]) {

    // get test correction data of each group
    this.groupCorrections = [];
    groups.forEach((groupData) => {
      this.groupCorrections.push({
        ...groupData,
        // for the correction grid, if group mark has inputted, then use test correction data, if not, use test creation data
        correction_grid: this.testData ? this.testData.correction_grid : null,
      });
    });
    this.getSectionType();
    this.getSectionsPerPage();

  }

  filterDisplayedSection(group) {
    if (this.sectionType === 'sections_evalskill') {
      // remove all the section and subsection that not selected
      group.correction_grid.correction.sections_evalskill = group.correction_grid.correction.sections_evalskill.filter(section => {
        section.sub_sections = section.sub_sections.filter(subsection => subsection.is_selected);
        return section.is_selected;
      });
      this.testData.correction_grid.correction.sections_evalskill = this.testData.correction_grid.correction.sections_evalskill
      .filter(section => {
        section.sub_sections = section.sub_sections.filter(subsection => subsection.is_selected);
        return section.is_selected;
      });
    }
    return group;
  }

  getSectionsPerPage() {
    // make group's section data to be displayed per page.
    this.sectionsPerPage = [];
    this.groupCorrections.forEach(group => {
      let sectionsInThisPage = [];
      let isFirstSec = true; // show header if true
      let isLastSec = false; // show penalties, bonuses, total mark, footer if true
      group = this.filterDisplayedSection(group);
      group.correction_grid.correction[this.sectionType].forEach((section, sectionIdx) => {
        // add maximum_rating peroperty to display maximum rating in every section
        if (this.testData.correction_grid.correction.show_number_marks_column) {
          section.maximum_rating = this.testData.correction_grid.correction[this.sectionType][sectionIdx].maximum_rating;
          section.sub_sections.forEach((subsec, subsecIdx) => {
            // add maximum_rating peroperty to display maximum rating in every sub section
            subsec.maximum_rating =
            this.testData.correction_grid.correction[this.sectionType][sectionIdx].sub_sections[subsecIdx].maximum_rating;
          });
        }
        // add score_conversions peroperty every section
        if (this.testData.correction_grid.correction.show_letter_marks_column ||
          this.testData.correction_grid.correction.show_letter_marks_column) {
          section.score_conversions = this.testData.correction_grid.correction[this.sectionType][sectionIdx].score_conversions
        }

        sectionsInThisPage.push(section);

        // if there is page break in this section, and next section exist, put the next section in the next page
        const lastSection = this.testData.correction_grid.correction[this.sectionType].length - 1;
        if (this.testData.correction_grid.correction[this.sectionType][sectionIdx].page_break && sectionIdx < lastSection) {
          this.assignSectionsToPage(group, sectionsInThisPage, isFirstSec, isLastSec);
          sectionsInThisPage = [];
          isFirstSec = false;
        }
      });
      isLastSec = !!sectionsInThisPage.length;
      // start a new page when we loop to another group
      this.assignSectionsToPage(group, sectionsInThisPage, isFirstSec, isLastSec);
    })
    // this.isWaitingForResponse = false;
    this.isWaitingDone.emit(true);

  }

  assignSectionsToPage(group: GroupCorrection, sectionsInThisPage: any[], isFirstSection: boolean, isLastSection: boolean) {
    const currentPageData: GroupCorrection = cloneDeep(group);
    currentPageData.correction_grid.correction[this.sectionType] = sectionsInThisPage;
    currentPageData.isFirstSection = isFirstSection;
    currentPageData.isLastSection = isLastSection;
    this.sectionsPerPage.push(currentPageData);
  }

  getSectionType() {
    // determine we should get data from sections or sections_evalskill field
    if (this.testData.block_type === 'competence' || this.testData.block_type === 'soft_skill') {
      // if evaluation by expertise test, take data from sections_evalskill array
      this.sectionType = 'sections_evalskill';
    } else {
      // if normal test, get data from sections array
      this.sectionType = 'sections';
    }
  }

  downloadPDFPersonalized() {
    let html = PRINTSTYLES;
    const target = this.documentPagesRef.nativeElement.children;
    const outer = document.createElement('div');
    outer.innerHTML = '';

    let studentsHtml = '';
    for (const element of target) {
      const wrap = document.createElement('div');
      const el = element.cloneNode(true);
      el.style.display = 'block';
      wrap.appendChild(el);
      studentsHtml += wrap.innerHTML;
    }
    studentsHtml = studentsHtml.replace(/\$/g, ' ');

    html +=  `
    <div style="page-break-before: always; position: relative;">
      <div class="ql-editor document-parent">${studentsHtml}</div>
    </div>`;
    html += this.lastPageText;

    const filename = 'Details-' + this.titleData.short_name + ' - ' + this.testData.name;
    const isLandscape = this.testData.correction_grid.orientation === 'landscape';
    this.transcriptBuilderService.generatePdf(html, filename, isLandscape).subscribe((res: any) => {
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

  getLetterPhrase(scoreConversionId: string, sectionTitle: string, selector: string, markType: string) {
    let mark = '';
    // get selected section in test creation data
    const sectionSelected = this.testData.correction_grid.correction[selector].find(sec => sec.title === sectionTitle);
    // get score conversions in the selected section
    const scoreConversions: ScoreConversion[] = sectionSelected ? sectionSelected.score_conversions : [];
    if (scoreConversions && scoreConversions.length && scoreConversionId) {
      // get selected mark according to score conversion id
      const selectedMark = scoreConversions.find(sc => sc._id === scoreConversionId);
      if (selectedMark) {
        mark = selectedMark[markType];
      }
    }
    return mark;
  }

  getScorePhrase(scoreConversionId: string, scoreConversions: ScoreConversion[]) {
    let score = '';
    scoreConversions.forEach((scoreConversion) => {
      if (scoreConversion._id === scoreConversionId) {
        score = scoreConversion.phrase;
      }
    });
    return score;
  }

  getScoreLetter(scoreConversionId: string, scoreConversions: ScoreConversion[]) {
    let score = '';
    scoreConversions.forEach((scoreConversion) => {
      if (scoreConversion._id === scoreConversionId) {
        score = scoreConversion.letter;
      }
    });
    return score;
  }

  getAdditionalScore() {
    if (this.testData && this.testData.correction_grid && this.testData.correction_grid.correction) {
      if (this.testData.correction_grid.correction.total_zone.display_additional_total) {
        return this.testData.correction_grid.correction.total_zone.additional_max_score;
      } else {
        return '';
      }
    }
  }

  getTitleWidth() {
    const correction = this.testData.correction_grid.correction;
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

  parseHeaderFooterDate(date) {
    if (date && date.date && date.time) {
      // return this.parseUTCtoLocal.transformDateToJavascriptDate(date.date, date.time);
      const oldTime = this.parseUTCtoLocal.transformDateToJavascriptDate(date.date, date.time);
      const formattedDate = moment(oldTime).locale(this.translate.currentLang).format('DD MMMM YYYY[,] HH[:]mm, [GMT]ZZ')
      return formattedDate;
    }
    return '';
  }

  generateMultipleGroupPdfHtml() {
    const groupResults = this.groupCorrections.map(grp => ({
      document_name: `${grp.name}`,
      html: this.generateGroupPdfHtml(grp._id),
      landscape: this.testData && this.testData.correction_grid && this.testData.correction_grid.orientation === 'landscape' ? true : false
    }))

    return groupResults;
  }

  generateGroupPdfHtml(groupId) {
    this.individualGroupId = groupId;
    let html = PRINTSTYLES;
    html = html + '<div class="ql-editor document-parent">';
    // get all the children of pagesElement that has class groupId-{id of student}
    const studentHtmlPage = document.getElementById('pagesElement').querySelectorAll(`.groupId-${this.individualGroupId}`);
    studentHtmlPage.forEach(page => {
      html = html + page.innerHTML;
    })
    html = html + '</div>';
    return html;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
