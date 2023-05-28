import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { TestCreationPayloadData, ScoreConversion } from 'app/test/test-creation/test-creation.model';
import { PRINTSTYLES } from 'assets/scss/theme/doc-style';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { environment } from 'environments/environment';
import { TestCorrectionService } from 'app/service/test-correction/test-correction.service';
import { TestCorrection, TestCorrectionCorrectionGridInput } from '../test-correction.model';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import cloneDeep from 'lodash/cloneDeep';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
import * as _ from 'lodash';

interface FilteredGroupList {
  groupTestCorrectionId: string;
  _id: string;
  name: string;
  doc: string;
  missing_copy: boolean;
  is_do_not_participated: boolean;
  score: number;
  is_justified: string;
  students: StudentCorrection[];
}

interface GroupCorrection {
  groupTestCorrectionId: string;
  _id: string;
  name: string;
  doc: string;
  missing_copy: boolean;
  is_do_not_participated;
  score: number;
  is_justified: string;
  students: StudentCorrection[];
  correction_grid: any;
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
  selector: 'ms-pdf-group-detail',
  templateUrl: './pdf-group-detail.component.html',
  styleUrls: ['./pdf-group-detail.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class PdfGroupDetailComponent implements OnInit {
  @Input() testDataOriginal: TestCreationPayloadData;
  @Input() schoolData;
  @Input() titleData;
  @Input() filteredGroupList: FilteredGroupList[];
  @Input() maximumFinalMark: number;
  @Output() isWaitingDone = new EventEmitter();
  @ViewChild('pagesElement', { static: false }) documentPagesRef: ElementRef;
  @ViewChild('individualElement', {static: false}) individualResultRef: ElementRef;
  testCorrections: TestCorrection[];
  groupCorrections: GroupCorrection[];
  sectionsPerPage: GroupCorrection[];
  individualGroupId: string;
  sectionType: string;
  juryColumns = [0, 1, 2];
  testData;

  constructor(
    private transcriptBuilderService: TranscriptBuilderService,
    private testCorectionService: TestCorrectionService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.isWaitingDone.emit('start');
    this.testData = _.cloneDeep(this.testDataOriginal);
    this.assignStudentsToGroup();
  }

  assignStudentsToGroup() {
    // get students of a group data from API
    this.testCorectionService.getAllGroup(this.testData._id, this.schoolData._id).subscribe((resp) => {
      if (resp) {
        this.filteredGroupList.forEach(group => {
          const groupFound = resp.find(grp => grp._id === group._id);
          if (groupFound) {
            // assign students to the group
            group.students = groupFound.students.map((student) => ({
              _id: student.student_id._id,
              first_name: student.student_id.first_name,
              last_name: student.student_id.last_name,
              school: student.student_id.school.short_name,
              correction_grid: student.individual_test_correction_id ? student.individual_test_correction_id.correction_grid : null,
            }))
          }
        })
        this.getAllGroupTestCorrection();
      }
    }, (err) => { this.isWaitingDone.emit('done') });
  }

  getAllGroupTestCorrection() {
    // get test correction data of each group
    this.testCorectionService.getAllGroupTestCorrection(this.testData._id, this.schoolData && this.schoolData._id ? this.schoolData._id : null).subscribe((resp) => {
      // filter to get correction data from the same school as corrector's school. so group from other school will removed
      this.testCorrections = resp.filter(corr => {
        if (corr.school_id && corr.school_id._id === this.schoolData._id) {
          return true;
        }
        return false;
      });
      this.groupCorrections = [];
      this.filteredGroupList.forEach((groupData) => {
        // find correction grid data and assign it to group
        const correction = resp.find((corr) => corr.test_group_id._id === groupData._id);
        this.groupCorrections.push({
          ...groupData,
          // for the correction grid, if group mark has inputted, then use test correction data, if not, use test creation data
          correction_grid: correction &&
          (correction.correction_grid.correction.sections.length || correction.correction_grid.correction.sections_evalskill.length)
            ? correction.correction_grid
            : this.testData ? this.testData.correction_grid : null,
        });
      });
      this.getSectionType();
      this.getSectionsPerPage();

    });
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
    this.isWaitingDone.emit('done')

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

  generateGroupPdfHtml(groupId: string): string {
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

  downloadPdfDetail() {
    this.individualGroupId = null;
    const ele = document.getElementById('group-list-table');
    let html = PRINTSTYLES;
    html = html + ele.innerHTML;
    const filename = 'Details-' + this.titleData.short_name + ' - ' + this.testData.name;

    const target = this.documentPagesRef.nativeElement.children;
    const outer = document.createElement('div');
    outer.innerHTML = '';

    let groupsHtml = '';
    for (const element of target) {
      const wrap = document.createElement('div');
      const el = element.cloneNode(true);
      el.style.display = 'block';
      wrap.appendChild(el);
      groupsHtml += wrap.innerHTML;
    }
    groupsHtml = groupsHtml.replace(/\$/g, ' ');

    html +=  `
    <div style="page-break-before: always; position: relative;">
      <div class="ql-editor document-parent">${groupsHtml}</div>
    </div>`;

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

  getAdditionalScore() {
    if (this.testData && this.testData.correction_grid && this.testData.correction_grid.correction) {
      if (this.testData.correction_grid.correction.total_zone.display_additional_total) {
        return this.testData.correction_grid.correction.total_zone.additional_max_score;
      } else {
        return '';
      }
    }
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
}
