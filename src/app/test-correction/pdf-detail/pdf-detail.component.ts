import { Component, OnInit, Input, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { TestCreationPayloadData, ScoreConversion } from 'app/test/test-creation/test-creation.model';
import { PRINTSTYLES } from 'assets/scss/theme/doc-style';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { environment } from 'environments/environment';
import { TestCorrectionService } from 'app/service/test-correction/test-correction.service';
import { TestCorrection, TestCorrectionCorrectionGridInput } from '../test-correction.model';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import cloneDeep from 'lodash/cloneDeep';
import * as _ from 'lodash';
import { UtilityService } from 'app/service/utility/utility.service';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';
interface FilteredStudentList {
  testCorrectionId: string;
  _id: string;
  first_name: string;
  last_name: string;
  doc: string;
  missing_copy: boolean;
  is_do_not_participated: boolean;
  score: number;
  is_justified: boolean | string;
  specialization_id: string;
}

interface StudentCorrection {
  totalPage: number;
  currentPage: number;
  testCorrectionId: string;
  _id: string;
  first_name: string;
  last_name: string;
  doc: string;
  missing_copy: boolean;
  is_do_not_participated: boolean;
  score: number;
  is_justified: boolean | string;
  correction_grid: any;
  isFirstSection?: boolean;
  isLastSection?: boolean;
  school?: any;
  civility?: string;
  company?: any;
  specialization_id?: string;
}

@Component({
  selector: 'ms-pdf-detail',
  templateUrl: './pdf-detail.component.html',
  styleUrls: ['./pdf-detail.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class PdfDetailComponent implements OnInit {
  @Input() testDataOriginal: TestCreationPayloadData;
  @Input() schoolData;
  @Input() titleData;
  @Input() filteredStudentList: FilteredStudentList[];
  @Input() maximumFinalMark: number;
  @Input() studentList;
  @Output() isWaitingDone = new EventEmitter();
  @ViewChild('pagesElement', { static: false }) documentPagesRef: ElementRef;
  @ViewChild('individualElement', { static: false }) individualResultRef: ElementRef;
  testData;
  testCorrections: TestCorrection[];
  studentCorrections: StudentCorrection[];
  sectionsPerPage: StudentCorrection[];
  individualStudentId: string;
  sectionType: string;
  proEvalStudent = [];
  isFromMark = true;
  juryColumns = [0, 1, 2];
  totalPage: any;
  isEvalPro: boolean = false;

  constructor(
    private transcriptBuilderService: TranscriptBuilderService,
    private testCorectionService: TestCorrectionService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private utilService: UtilityService,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.isWaitingDone.emit('start');
    this.testData = _.cloneDeep(this.testDataOriginal);
    this.getAllTestCorrection();
  }

  getAllTestCorrection() {
    if (this.testData && this.testData.correction_type === 'cross_correction') {
      // this.studentList
      const studentIds = this.studentList.map((resp) => resp._id);
      this.testCorectionService.getAllCompleteTestCorrectionCross(this.testData._id, studentIds).subscribe(
        (resp) => {
          this.testCorrections = resp;
          this.studentCorrections = [];
          this.getSectionType();
          if (this.filteredStudentList) {
            this.filteredStudentList.forEach((student) => {
              // find correction grid data and assign it to student
              const correction = this.testCorrections.find((corr) => corr.student && corr.student._id && corr.student._id === student._id);
              this.studentCorrections.push({
                ...student,
                currentPage: 0,
                totalPage: this.testData?.correction_grid?.correction[this.sectionType]?.filter(section => section?.is_selected && (!section?.specialization_id || section?.specialization_id === student?.specialization_id)).length,
                // for the correction grid, if student mark has inputted, then use test correction data, if not, use test creation data
                correction_grid:
                  correction &&
                  (correction.correction_grid.correction.sections.length || correction.correction_grid.correction.sections_evalskill.length)
                    ? correction.correction_grid
                    : this.testData
                    ? this.testData.correction_grid
                    : null,
              });
            });
          }
          this.getSectionsPerPage();
        },
        (err) => {
          this.isWaitingDone.emit('done');
        },
      );
    } else {
      this.testCorectionService.getAllCompleteTestCorrection(this.testData?._id, this.schoolData?._id).subscribe(
        (resp) => {
          this.testCorrections = resp;
          this.studentCorrections = [];
          this.getSectionType();
          if (this.filteredStudentList) {
            this.filteredStudentList.forEach((student) => {
              // find correction grid data and assign it to student
              const correction = this.testCorrections.find((corr) => corr.student && corr.student._id && corr.student._id === student._id);
              this.studentCorrections.push({
                ...student,
                currentPage: 0,
                totalPage: this.testData?.correction_grid?.correction[this.sectionType]?.filter(section => section?.is_selected && (!section?.specialization_id || section?.specialization_id === student?.specialization_id)).length,
                // for the correction grid, if student mark has inputted, then use test correction data, if not, use test creation data
                correction_grid:
                  correction &&
                  (correction.correction_grid.correction.sections.length ||
                    correction.correction_grid.correction.sections_evalskill.length ||
                    (correction.correction_grid.correction.additional_total && this.testData.type === 'free_continuous_control'))
                    ? correction.correction_grid
                    : this.testData
                    ? this.testData.correction_grid
                    : null,
              });
            });
          }
          this.getSectionsPerPage();
        },
        (err) => {
          this.isWaitingDone.emit('done');
        },
      );
    }
  }

  filterDisplayedSection(student) {
    if (this.sectionType === 'sections_evalskill') {
      // remove all the section and subsection that not selected
      if (student?.correctionGrid?.correction?.sections_evalskill) {
        student.correctionGrid.correction.sections_evalskill = student?.correction_grid?.correction?.sections_evalskill?.filter((section) => {
          section.sub_sections = section.sub_sections.filter((subsection) => subsection.is_selected);
          return section.is_selected;
        });
      }
      student.correction_grid.correction.sections_evalskill = student.correction_grid.correction.sections_evalskill.filter((section) => {
        section.sub_sections = section.sub_sections.filter((subsection) => subsection.is_selected);
        return section.is_selected;
      });
      this.testData.correction_grid.correction.sections_evalskill = this.testData.correction_grid.correction.sections_evalskill.filter(
        (section) => {
          section.sub_sections = section.sub_sections.filter((subsection) => subsection.is_selected);
          return section.is_selected;
        },
      );
    }
    return student;
  }

  getSectionsPerPage() {
    // make student's section data to be displayed per page.
    this.sectionsPerPage = [];


    if (this.filteredStudentList && this.filteredStudentList.length) {
      this.proEvalStudent = this.studentList.filter((stud) => stud._id === this.individualStudentId);
    }

    this.studentCorrections.forEach((student, studentIndex) => {
      let sectionsInThisPage = [];
      let isFirstSec = true; // show header if true
      let isLastSec = false; // show penalties, bonuses, total mark, footer if true
      let currentPageCounter = 0
      student = this.filterDisplayedSection(student);
      student.correction_grid.correction[this.sectionType].forEach((section, sectionIdx) => {
        // add maximum_rating peroperty to display maximum rating in every section
        if (this.testData.correction_grid.correction.show_number_marks_column) {
          section.maximum_rating = this.testData.correction_grid.correction[this.sectionType][sectionIdx].maximum_rating;
          section.sub_sections.forEach((subsec, subsecIdx) => {
            // add maximum_rating peroperty to display maximum rating in every sub section
            subsec.maximum_rating =
              this.testData &&
              this.testData.correction_grid &&
              this.testData.correction_grid.correction &&
              this.testData.correction_grid.correction[this.sectionType] &&
              this.testData.correction_grid.correction[this.sectionType][sectionIdx] &&
              this.testData.correction_grid.correction[this.sectionType][sectionIdx].sub_sections &&
              this.testData.correction_grid.correction[this.sectionType][sectionIdx].sub_sections[subsecIdx] &&
              this.testData.correction_grid.correction[this.sectionType][sectionIdx].sub_sections[subsecIdx].maximum_rating
                ? this.testData.correction_grid.correction[this.sectionType][sectionIdx].sub_sections[subsecIdx].maximum_rating
                : null;
          });
        }
        // add score_conversions peroperty every section
        if (this.testData.correction_grid.correction.show_letter_marks_column) {
          if (
            this.testData &&
            this.testData.correction_grid &&
            this.testData.correction_grid.correction &&
            this.testData.correction_grid.correction[this.sectionType] &&
            this.testData.correction_grid.correction[this.sectionType][sectionIdx] &&
            this.testData.correction_grid.correction[this.sectionType][sectionIdx].score_conversions
          ) {
            section.score_conversions = this.testData.correction_grid.correction[this.sectionType][sectionIdx].score_conversions;
          }
        }

        if (section && section.is_selected && section.sub_sections && section.sub_sections.length) {
          section.sub_sections.forEach((subSection, subSectionIndex) => {
            if (subSection && subSection.is_selected && subSection.comments) {
              subSection.comments = subSection.comments.replaceAll(/\&nbsp;/g, ' ');
            }
          });
        }

        sectionsInThisPage.push(section);

        // if there is page break in this section, and next section exist, put the next section in the next page
        // For now will always page break per section. 14/04/2021 Task AV-3867
        // const pageBreakPerSection = this.testData.correction_grid.correction[this.sectionType][sectionIdx].page_break;
        const pageBreakPerSection = true;
        const lastSectionIdx = student.totalPage - 1;
        if (currentPageCounter < student.totalPage) {
          student.currentPage = currentPageCounter + 1
          currentPageCounter += 1
        } else {
          currentPageCounter = 0
        }
        if (pageBreakPerSection && sectionIdx < lastSectionIdx) {
          this.assignSectionsToPage(student, sectionsInThisPage, isFirstSec, isLastSec);
          sectionsInThisPage = [];
          isFirstSec = false;
        }
      });
      if (this.testData.type === 'free_continuous_control') {
        isLastSec = true;
      }
      // start a new page when we loop to another student
      this.assignSectionsToPage(student, sectionsInThisPage, isFirstSec, isLastSec);
    });

     if (
      <any>this.sectionsPerPage[0] &&
      (<any>this.sectionsPerPage[0]).correctionGrid &&
      (<any>this.sectionsPerPage[0]).correctionGrid.correction &&
      ((<any>this.sectionsPerPage[0]).correctionGrid.correction.sections ||
        (<any>this.sectionsPerPage[0]).correctionGrid.correction.sections_evalskill) &&
      ((<any>this.sectionsPerPage[0]).correctionGrid.correction.sections.length ||
        (<any>this.sectionsPerPage[0]).correctionGrid.correction.sections_evalskill.length)
    ) {
      this.totalPage = (<any>this.sectionsPerPage[0]).correctionGrid.correction.sections.length
        ? (<any>this.sectionsPerPage[0]).correctionGrid.correction.sections.length
        : (<any>this.sectionsPerPage[0]).correctionGrid.correction.sections_evalskill.length;
    }
    this.isWaitingDone.emit('done');
  }

  getPageNumber(studentIndex, totalPage) {
    if ((studentIndex + 1) % totalPage > 0) {
      return (studentIndex + 1) % totalPage;
    } else {
      return totalPage;
    }
  }

  getJobDescOfStudent(student, section) {
    // For auto or pro, check for job description and put them into section
    if (this.testData.type === 'academic_auto_evaluation' || this.testData.type === 'academic_pro_evaluation') {
      const selectedStudentData = this.studentList.find((studentData) => studentData._id === student._id);
      let missionActivitiesAutonomy = [];
      if (
        selectedStudentData &&
        selectedStudentData.job_description_id &&
        selectedStudentData.job_description_id.block_of_template_competences &&
        selectedStudentData.job_description_id.block_of_template_competences.length
      ) {
        selectedStudentData.job_description_id.block_of_template_competences.forEach((block) => {
          if (block && block.competence_templates && block.competence_templates.length) {
            const selectedblockTemplate = block.competence_templates.find(
              (competence) =>
                competence &&
                competence.competence_template_id &&
                competence.competence_template_id._id &&
                section.academic_skill_competence_template_id &&
                section.academic_skill_competence_template_id._id === competence.competence_template_id._id &&
                selectedStudentData._id === student._id,
            );
            if (selectedblockTemplate && selectedblockTemplate.missions_activities_autonomy && !missionActivitiesAutonomy.length) {
              missionActivitiesAutonomy = _.cloneDeep(selectedblockTemplate.missions_activities_autonomy);
            }
          }
        });
      }

      if (selectedStudentData) {
        if (!section['job_desc'] && selectedStudentData._id === student._id) {
          return missionActivitiesAutonomy;
          // section['job_desc'] = _.cloneDeep(missionActivitiesAutonomy);
          // missionActivitiesAutonomy = [];
        }
      }
    }

    return null;
  }

  assignSectionsToPage(student: StudentCorrection, sectionsInThisPage: any[], isFirstSection: boolean, isLastSection: boolean) {
    const currentPageData: StudentCorrection = cloneDeep(student);
    currentPageData.correction_grid.correction[this.sectionType] = sectionsInThisPage;
    currentPageData.isFirstSection = isFirstSection;
    currentPageData.isLastSection = isLastSection;

    // To get the job desc for each student in academic auto evaluation, loop here and put the data inside.
    if (this.testData.type === 'academic_auto_evaluation' || this.testData.type === 'academic_pro_evaluation') {
      if (currentPageData?.correction_grid?.correction?.sections_evalskill?.length) {
        for (const section of currentPageData.correction_grid.correction.sections_evalskill) {
          section['missions'] = this.getJobDescOfStudent(student, section);
        }
      }
      this.sectionsPerPage.push(currentPageData);
      this.totalPage = this.sectionsPerPage.length
    } else {
      this.sectionsPerPage.push(currentPageData);
    }
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

  generateStudentPdfHtml(studentId: string, data?, isEvalPro?): string {
    if (isEvalPro) {
      this.totalPage = this.sectionsPerPage.length;
    }
    if (data === 'mark') {
      this.isFromMark = true;
    } else {
      this.isFromMark = false;
    }

    this.individualStudentId = studentId;
    let html = PRINTSTYLES;
    html = html + '<div class="ql-editor document-parent">';
    // get all the children of pagesElement that has class studentId-{id of student}
    const studentHtmlPage = document.getElementById('individualElement').querySelectorAll(`.studentId-${this.individualStudentId}`);
    studentHtmlPage.forEach((page) => {
      html = html + page.innerHTML;
    });
    html = html + '</div>';
    return html;
  }

  downloadPdfDetail() {
    this.individualStudentId = null;
    const ele = document.getElementById('student-list-table');
    let html = PRINTSTYLES;
    html = html + ele.innerHTML;
    const filename = 'Details-' + (this.titleData ? this.titleData.short_name + ' - ' : '') + this.testData.name;

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

    html += `
    <div style="page-break-before: always; position: relative;">
      <div class="ql-editor document-parent">${studentsHtml}</div>
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

  getLetterPhrase(scoreConversionId: string, sectionTitle: string, selector: string, markType: string) {
    let mark = '';
    // get selected section in test creation data
    const sectionSelected = this.testData.correction_grid.correction[selector].find((sec) => sec.title === sectionTitle);
    // get score conversions in the selected section
    const scoreConversions: ScoreConversion[] = sectionSelected ? sectionSelected.score_conversions : [];
    if (scoreConversions && scoreConversions.length && scoreConversionId) {
      // get selected mark according to score conversion id
      const selectedMark = scoreConversions.find((sc) => sc._id === scoreConversionId);
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
      const formattedDate = moment(oldTime).locale(this.translate.currentLang).format('DD MMMM YYYY[,] HH[:]mm, [GMT]ZZ');
      return formattedDate;
    }
    return '';
  }

  getFullTextFromHtml(html: string) {
    const el = document.createElement('div');
    html = html.replace('<p>', '');
    html = html.replace('</p>', '');
    el.innerHTML = html;
    let data = el.textContent || el.innerText || '';
    data = data.replace(/\s+/g, ' ');
    return data;
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
    }
  }

  getTranslatedDateMultiple(date) {
    let localDate = date;
    if (date && date !== 'Invalid date') {
      const time = '00:01';
      localDate = this.parseUTCtoLocal.transformDate(date, time);
    }
    return localDate;
  }

  // getAllMissionsActivitiesAutonomy(sectionIndex: number): any[] {
  //   let missionActivitiesAutonomy: MissionsActivitiesAutonomy[] = []
  //   const templateId = this.student?.correction_grid?.correction?.sections_evalskill[sectionIndex].academic_skill_competence_template_id;
  //   // get template by filtering from competence_template_id
  //   const selectedTemplate = this.studentJobDescriptions.find(template => {
  //     if (template.competence_template_id && template.competence_template_id._id) {
  //       return template.competence_template_id._id === templateId;
  //     }
  //   })
  //   if (selectedTemplate && selectedTemplate.missions_activities_autonomy && selectedTemplate.missions_activities_autonomy.length) {
  //     missionActivitiesAutonomy = _.cloneDeep(selectedTemplate.missions_activities_autonomy);
  //   }
  //   return missionActivitiesAutonomy;
  // }
}
