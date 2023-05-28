import { group } from '@angular/animations';
import { AfterContentInit, AfterViewChecked, Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import {MAT_DIALOG_DATA} from '@angular/material/dialog';
import { TestCorrectionService } from 'app/service/test-correction/test-correction.service';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { TestCorrection } from 'app/test-correction/test-correction.model';
import { ScoreConversion, TestCreationPayloadData } from 'app/test/test-creation/test-creation.model';
import { PRINTSTYLES } from 'assets/scss/theme/doc-style';
import { AnyAaaaRecord } from 'dns';
import { environment } from 'environments/environment';
import cloneDeep from 'lodash/cloneDeep';
import { BehaviorSubject, forkJoin } from 'rxjs';
import { SubSink } from 'subsink';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';

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
  is_do_not_participated: boolean;
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
  selector: 'ms-pdf-group-detail-individual-with-group',
  templateUrl: './pdf-group-detail-individual-with-group.component.html',
  styleUrls: ['./pdf-group-detail-individual-with-group.component.scss'],
  providers: [ParseUtcToLocalPipe]
})
export class PdfGroupDetailIndividualWithGroupComponent implements OnInit, AfterViewChecked {

  @Output() isWaitingDone = new EventEmitter();
  @ViewChild('pagesElement', { static: false }) documentPagesRef: ElementRef;
  @ViewChild('individualElement', {static: false}) individualResultRef: ElementRef;
  testCorrections: TestCorrection[];
  groupCorrections: any;
  sectionsPerPage: any;
  individualGroupId: string;
  sectionType: string;
  juryColumns = [0, 1, 2];
  @Input() data;
  testData: any;
  filteredGroupList: any;
  schoolData: any;
  studentList: any;
  titleData: any;
  maximumFinalMark: any;
  allTestCorrection: any;
  private subs = new SubSink();
  individualStudentId: string;
  studentSectionsPerPage: any[];
  typeAPayLoad = new BehaviorSubject(null);

  constructor(
    private transcriptBuilderService: TranscriptBuilderService,
    private testCorectionService: TestCorrectionService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private translate: TranslateService
  ) {}

  ngOnInit() {
    this.testData = this.data.testData;
    this.filteredGroupList = this.data.filteredGroupList;
    this.schoolData = this.data.schoolData;
    this.studentList = this.data.studentList;
    this.titleData = this.data.titleData;
    this.assignStudentsToGroup();
  }

  ngAfterViewChecked() {
    this.typeAPayLoad.next(this.getTypeAPayLoad());
  }

  assignStudentsToGroup() {
    // get students of a group data from API
    this.testCorectionService.getAllGroup(this.data.testId, this.data.schoolId).subscribe((resp) => {
      if (resp) {
        if(this.filteredGroupList) {
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
      }
    }, (err) => { this.isWaitingDone.emit('done') });
  }

  // getAllTestCorrection() {
  //   // let groupTestCorrections = this.testCorectionService.getAllGroupTestCorrection(this.data.testId, this.data.schoolId)
  //   // let individualTestCorrections = this.testCorectionService.getAllCompleteTestCorrection(this.data.testId, this.data.schoolId);
  //   // get test correction data of each group
  //   this.testCorectionService.getAllCompleteTestCorrection(this.data.testId, this.data.schoolId).subscribe((resp) => {

  //     this.allTestCorrection = resp.filter(entry => entry.student).map(entry => {
  //         let studentObject = this.studentList.find(x => x._id === entry.student._id);
  //         let matchedGroup = this.filteredGroupList.find(group => group._id === studentObject.groupId);
  //         let newEntry = Object.assign({}, entry);
  //         newEntry.student = studentObject;
  //         newEntry.groupData = matchedGroup;
  //         return newEntry;
  //     }); 

  //     this.getSectionType();
  //     this.getSectionsPerPage();
  //   });
  // }

  getAllGroupTestCorrection() {
    let groupTestCorrections = this.testCorectionService.getAllGroupTestCorrection(this.data?.testId, this.data?.schoolId);
    let individualTestCorrections = this.testCorectionService.getAllCompleteTestCorrection(this.data?.testId, this.data?.schoolId);
    // get test correction data of each group
    this.subs.sink = forkJoin([groupTestCorrections, individualTestCorrections]).subscribe((resp) => {
      // filter to get correction data from the same school as corrector's school. so group from other school will removed
      this.groupCorrections = [];
      this.filteredGroupList.forEach((groupData) => {
        // find correction grid data and assign it to group
        const correction = resp[0].find((corr) => corr.test_group_id._id === groupData._id);
        //get all the students ._ids of that particular group and map it into array
        const students = groupData.students.map(x => x._id);
        //get all the individual test corrections and create an array of it from the getAllTestCorrections
        const testCorrections = resp[1].filter(test => test.student && students.includes(test.student._id));
        let groupEntry: any = Object.assign({}, groupData);
        groupEntry.correction_grid =  correction &&
          (correction.correction_grid.correction.sections.length || correction.correction_grid.correction.sections_evalskill.length)
          ? correction.correction_grid
          : this.testData ? this.testData.correction_grid : null;
        groupEntry.students_corrections = testCorrections;
        this.groupCorrections.push(groupEntry);
      });
      this.getSectionType();
      this.getSectionsPerPage();
      this.getStudentSectionsPerPage();

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

  //this loops through each group and populate the sectionPerPage which is to be displayed in the HTML
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

  //below function is a replicate to the upper function but it loops through the student corrections list per group.
  getStudentSectionsPerPage() {
    // make group's section data to be displayed per page.
    this.studentSectionsPerPage = [];
    this.groupCorrections.forEach((group:any) => {
      group.students_corrections.forEach((corr:any) => {
        let sectionsInThisPage = [];
        let isFirstSec = true; // show header if true
        let isLastSec = false; // show penalties, bonuses, total mark, footer if true
        corr = this.filterDisplayedSection(corr);
        corr.correction_grid.correction[this.sectionType].forEach((section, sectionIdx) => {
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
            this.assignStudentSectionsToPage(corr, sectionsInThisPage, isFirstSec, isLastSec);
            sectionsInThisPage = [];
            isFirstSec = false;
          }
        });
        isLastSec = !!sectionsInThisPage.length;
        // start a new page when we loop to another group
        this.assignStudentSectionsToPage(corr, sectionsInThisPage, isFirstSec, isLastSec);
      })
    })
    this.isWaitingDone.emit('done')

  }

  //assign all the student corrections into a page
  assignStudentSectionsToPage(group: any, sectionsInThisPage: any[], isFirstSection: boolean, isLastSection: boolean) {
    const currentPageData: GroupCorrection = cloneDeep(group);
    currentPageData.correction_grid.correction[this.sectionType] = sectionsInThisPage;
    currentPageData.isFirstSection = isFirstSection;
    currentPageData.isLastSection = isLastSection;
    this.studentSectionsPerPage.push(currentPageData);
  }

  //assign all the group corrections into a page
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
  
  //filter all the group score based on the current group
  filterSectionPerPage(groupId:string) {
    return this.sectionsPerPage.filter(section => section._id === groupId);
  }
 
  //filter all the student corrections to display based on the current group
  filterStudentSectionPerPage(groupId: string) {
    let group = this.groupCorrections.find((x => x._id === groupId));
    let studentsCorrectionsOfThisGroup = group.students_corrections.map(x => x._id);
    return group && studentsCorrectionsOfThisGroup
     ? this.studentSectionsPerPage.filter(corr => studentsCorrectionsOfThisGroup.includes(corr._id)).map(entry => {
       let studentObject = this.studentList.find(x => x._id === entry.student._id);
       let newEntry = Object.assign({}, entry);
       newEntry.student = studentObject;
       return newEntry;
     }) :
     [];
  }


  // generateStudentPdfHtml(studentId: string, data?): string {
  //   this.individualStudentId = studentId;
  //   let html = PRINTSTYLES;
  //   html = html + '<div class="ql-editor document-parent">';
  //   // get all the children of pagesElement that has class studentId-{id of student}
  //   const studentHtmlPage = document.getElementById('pagesElementTypeB').querySelectorAll(`.groupId-${this.individualStudentId}`);
  //   studentHtmlPage.forEach((page) => {
  //     html = html + page.innerHTML;
  //   });
  //   html = html + '</div>';
  //   return html;
  // }

  // generateAllStudentPDFResult() {
  //   let html = PRINTSTYLES;
  //   html = html + '<div class="ql-editor document-parent">';
  //   // get all the children of pagesElement that has class studentId-{id of student}
  //   const allStudentHtmlPage = document.getElementById('group-list-table');
  //   html = html + allStudentHtmlPage.innerHTML;
  //   html = html + '</div>';
  //   this.transcriptBuilderService.generatePdf(html, `Example All Students`).subscribe((res: any) => {
  //         const link = document.createElement('a');
  //         link.setAttribute('type', 'hidden');
  //         link.download = res.filename;
  //         link.href = environment.PDF_SERVER_URL + res.filePath;
  //         link.target = '_blank';
  //         document.body.appendChild(link);
  //         link.click();
  //         link.remove();
  //       });
  //   return html;
  // }

  // get the HTML per group
  generatePerGroupPDFResult(groupId: string) {
    let html = PRINTSTYLES;
    html = html + '<div class="ql-editor document-parent">';
    const groupTablePage = document.querySelector(`.parentGroupId-${groupId}`);
    if (groupTablePage) {
      html = html + groupTablePage.innerHTML;
    }
    html = html + '</div>';
    return html;
  }

    //generate payload including the html per group correction
    getTypeAPayLoad() {
    if(this.filteredGroupList) {
      const groupResults = this.filteredGroupList.map((group) => 
        (
          {
            corrector: group.correctorId,
            document_name: `${group.name}`,
            group: group._id,
            html: this. generatePerGroupPDFResult(group._id),
            test_correction: group.groupTestCorrectionId,
          }
        )
      );
      return groupResults;
    } else {
      return []
    }
  }

  // getAllStudentPDFResult() {
  //     document_name: `${section.student.last_name} ${section.student.first_name}`,
  //     html: this.generateStudentPdfHtml(section._id),
  //     test_correction: section.student.testCorrectionId,
  //     student: section.student._id,
  //     corrector: section.corrector._id,
  // }

  // getPerStudentPdfResults() {
  //   const studentResults = this.allTestCorrection.filter(section => section.student).map((section) => ({
  //     document_name: `${section.student.last_name} ${section.student.first_name}`,
  //     html: this.generateStudentPdfHtml(section._id),
  //     test_correction: section.student.testCorrectionId,
  //     student: section.student._id,
  //     corrector: section.corrector._id,
  //   }));

  //   this.transcriptBuilderService.generatePdf(studentResults[0].html, studentResults[0].filename, ).subscribe((res: any) => {
  //     const link = document.createElement('a');
  //     link.setAttribute('type', 'hidden');
  //     link.download = res.filename;
  //     link.href = environment.PDF_SERVER_URL + res.filePath;
  //     link.target = '_blank';
  //     document.body.appendChild(link);
  //     link.click();
  //     link.remove();
  //   });
  //   return studentResults;
  // }
  
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

  trackByFn(index, item) {
    if (!item) return null;
    return index;
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
