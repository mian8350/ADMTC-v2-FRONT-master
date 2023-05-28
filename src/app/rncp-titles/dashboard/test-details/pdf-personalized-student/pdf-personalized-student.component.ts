import { Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild } from '@angular/core';
import { AuthService } from 'app/service/auth-service/auth.service';
import { StudentsService } from 'app/service/students/students.service';
import { TestCorrectionService } from 'app/service/test-correction/test-correction.service';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { TestCorrection } from 'app/test-correction/test-correction.model';
import { ScoreConversion, TestCreationPayloadData } from 'app/test/test-creation/test-creation.model';
import { PRINTSTYLES } from 'assets/scss/theme/doc-style';
import { environment } from 'environments/environment';
import { NgxPermissionsService } from 'ngx-permissions';
import { forkJoin } from 'rxjs';
import { SubSink } from 'subsink';
import cloneDeep from 'lodash/cloneDeep';
import * as _ from 'lodash';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';

interface StudentCorrection {
  _id: string
  first_name: string
  last_name: string
  civility: string
  school: any
  correction_grid?: any
  companies?: any[]
  isFirstSection?: boolean
  isLastSection?: boolean
}

@Component({
  selector: 'ms-pdf-personalized-student',
  templateUrl: './pdf-personalized-student.component.html',
  styleUrls: ['./pdf-personalized-student.component.scss'],
  providers: [ParseUtcToLocalPipe],
})
export class PdfPersonalizedStudentComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @Input() testData: TestCreationPayloadData;
  @Input() titleData: any;
  @Input() lastPageText: string;
  // *************** school id, title id, class id, studentIds input is used by send-pro-evaluation-dialog. User from school student table.
  @Input() schoolId?: string;
  @Input() titleId?: string;
  @Input() classId?: string;
  @Input() studentIds?: string[];
  @Output() isWaitingDone = new EventEmitter();
  @ViewChild('pagesElement', {static: false}) documentPagesRef: ElementRef;

  studentCorrections: StudentCorrection[];
  testCorrections: TestCorrection[];
  sectionsPerPage: StudentCorrection[];

  // schoolId: string;
  // titleId: string;
  // classId: string;

  isUserAcadir = false;
  isUserAcadAdmin = false;

  currentUser: any;
  fullUserData: any;
  entityData: any;
  sectionType: string;
  juryColumns = [0, 1, 2];

  studentList;
  individualStudentId: string;

  constructor(
    private testCorectionService: TestCorrectionService,
    private transcriptBuilderService: TranscriptBuilderService,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private utilService: UtilityService,
    private permission: NgxPermissionsService,
    private authService: AuthService,
    private studentService: StudentsService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.isUserAcadir = !!this.permission.getPermission('Academic Director');
    this.isUserAcadAdmin = !!this.permission.getPermission('Academic Admin');
    this.currentUser = this.utilService.getCurrentUser();


    if (this.titleId && this.classId && this.schoolId) {
      this.getStudents();
    } else {
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
            } else if (this.isUserAcadAdmin) {
              this.entityData = this.fullUserData.entities.find(
                (entity) => entity.type.name === 'Academic Admin' && entity.assigned_rncp_title._id === this.titleData._id,
              );
            }
            if (this.entityData) {
              this.schoolId = this.entityData.school && this.entityData.school._id ? this.entityData.school._id : null;
              this.titleId = this.entityData.assigned_rncp_title && this.entityData.assigned_rncp_title._id
                            ? this.entityData.assigned_rncp_title._id
                            : null;
              this.classId = this.entityData.class && this.entityData.class._id ? this.entityData.class._id : null;
              this.getStudents();
            }
          }
        }
      })
    }
  }

  getStudents() {
    this.testCorectionService.setStatusLoading(true);
    let students: StudentCorrection[] = [];
    if (this.testData.corrector_assigned && this.testData.corrector_assigned.length) {
      // filter to get corrector data from the same school as logged in user. so student from other school will removed
      this.testData.corrector_assigned = this.testData.corrector_assigned.filter(corrrector => {
        if (corrrector.school_id && corrrector.school_id._id === this.schoolId) {
          return true;
        }
        return false;
      })
      // get students based on corrector assigned array
      this.testData.corrector_assigned.forEach(corr => {
        students.push(...corr.students)
      });
    }

    // if there is no student from corrector assigned array, take student data from GetAllStudents query
    this.studentService.getStudentsPdfPersonalized(this.schoolId, this.titleId, this.classId, this.studentIds).subscribe(resp => {
      students = resp;
      // this.studentList = _.cloneDeep(resp);
      this.mapStudentsData(students);
    })

    this.testCorectionService.setStatusLoading(false);
    this.studentList = _.cloneDeep(students);
  }

  mapStudentsData(students: StudentCorrection[]) {
    students = students.map(student => ({
      _id: student._id,
      first_name: student.first_name,
      last_name: student.last_name,
      civility: student.civility,
      school: student.school,
      correction_grid: this.testData.correction_grid,
      company: student.companies && student.companies.length ? this.getCompanyAndMentor(student.companies) : null
    }))
    this.getAllTestCorrection(students);
  }

  getCompanyAndMentor(companies: any[]) {
    const company = companies.find(comp => comp.status === 'active');
    return company ? company : null;
  }

  getAllTestCorrection(students: StudentCorrection[]) {
    this.studentCorrections = [];
    if (students && students.length) {
      students.forEach(student => {
        // find correction grid data and assign it to student
        this.studentCorrections.push({
          ...student,
          // for the correction grid, if student mark has inputted, then use test correction data, if not, use test creation data
          correction_grid: this.testData ? this.testData.correction_grid : null
        })
      })
    }
    this.getSectionType();
    this.getSectionsPerPage();
  }

  filterDisplayedSection(student) {
    if (this.sectionType === 'sections_evalskill') {
      // remove all the section and subsection that not selected
      student.correction_grid.correction.sections_evalskill = student.correction_grid.correction.sections_evalskill.filter(section => {
        section.sub_sections = section.sub_sections.filter(subsection => subsection.is_selected);
        return section.is_selected;
      });
      this.testData.correction_grid.correction.sections_evalskill = this.testData.correction_grid.correction.sections_evalskill
      .filter(section => {
        section.sub_sections = section.sub_sections.filter(subsection => subsection.is_selected);
        return section.is_selected;
      });
    }
    return student;
  }

  getSectionsPerPage() {
    // make student's section data to be displayed per page.
    this.sectionsPerPage = [];
    this.studentCorrections.forEach(student => {
      let sectionsInThisPage = [];
      let isFirstSec = true; // show header if true
      let isLastSec = false; // show penalties, bonuses, total mark, footer if true
      student = this.filterDisplayedSection(student);
      student.correction_grid.correction[this.sectionType].forEach((section, sectionIdx) => {
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

        // For now will always page break per section. 14/04/2021 Task AV-3867
        // const pageBreakPerSection = this.testData.correction_grid.correction[this.sectionType][sectionIdx].page_break;
        const pageBreakPerSection = true;
        const lastSection = this.testData.correction_grid.correction[this.sectionType].length - 1;
        if (pageBreakPerSection && sectionIdx < lastSection) {
          this.assignSectionsToPage(student, sectionsInThisPage, isFirstSec, isLastSec);
          sectionsInThisPage = [];
          isFirstSec = false;
        }

        // if there is page break in this section, and next section exist, put the next section in the next page
        // const lastSection = this.testData.correction_grid.correction[this.sectionType].length - 1;
        // if (this.testData.correction_grid.correction[this.sectionType][sectionIdx].page_break && sectionIdx < lastSection) {
        //   this.assignSectionsToPage(student, sectionsInThisPage, isFirstSec, isLastSec);
        //   sectionsInThisPage = [];
        //   isFirstSec = false;
        // }
      });
      isLastSec = true;
      // start a new page when we loop to another student
      this.assignSectionsToPage(student, sectionsInThisPage, isFirstSec, isLastSec);
    })
    // this.isWaitingForResponse = false;
    this.isWaitingDone.emit(true);
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
                selectedStudentData._id === student._id
            );
            if (selectedblockTemplate && selectedblockTemplate.missions_activities_autonomy && !missionActivitiesAutonomy.length) {
              missionActivitiesAutonomy = _.cloneDeep(selectedblockTemplate.missions_activities_autonomy)
            }
          }
        });
      }
      if (!section['job_desc'] && selectedStudentData && selectedStudentData._id === student._id) {
        return missionActivitiesAutonomy;
      }
    }

    return null;
  }

  assignSectionsToPage(student: StudentCorrection, sectionsInThisPage: any[], isFirstSection: boolean, isLastSection: boolean) {
    const currentPageData: StudentCorrection = cloneDeep(student);
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
    scoreConversions.forEach(scoreConversion => {
      if (scoreConversion._id === scoreConversionId) {
        score = scoreConversion.phrase;
      }
    })
    return score;
  }

  getScoreLetter(scoreConversionId: string, scoreConversions: ScoreConversion[]) {
    let score = '';
    scoreConversions.forEach(scoreConversion => {
      if (scoreConversion._id === scoreConversionId) {
        score = scoreConversion.letter;
      }
    })
    return score;
  }

  getAdditionalScore() {
    if (this.testData && this.testData.correction_grid && this.testData.correction_grid.correction) {
      if (this.testData.correction_grid.correction.total_zone.display_additional_total) {
        return this.testData.correction_grid.correction.total_zone.additional_max_score
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

  getFullTextFromHtml(html: string) {
    const el = document.createElement('div');
    html = html.replace('<p>', '');
    html = html.replace('</p>', '');
    el.innerHTML = html;
    let data = el.textContent || el.innerText || '';
    data = data.replace(/\s+/g, ' ');
    return data;
  }

  getTranslatedDateMultiple(dateRaw) {
    if (dateRaw && (dateRaw.date === '' || dateRaw.time === '')) {
      return '';
    }
    if (dateRaw && dateRaw.date && dateRaw.time) {
      return this.parseUTCtoLocal.transformDate(dateRaw.date, dateRaw.time);
    }
  }

  getTranslatedDateDocument(dateRaw) {
    if (dateRaw && (dateRaw.date === '' || dateRaw.time_utc === '')) {
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

  generateMultipleStudentPdfHtml() {
    const studentResults = this.studentCorrections.map(student => ({
      document_name: `${student.last_name} ${student.first_name}`,
      html: this.generateStudentPdfHtml(student._id),
      landscape: this.testData && this.testData.correction_grid && this.testData.correction_grid.orientation === 'landscape' ? true : false
    }))
    return studentResults;
  }

  generateStudentPdfHtml(studentId) {
    this.individualStudentId = studentId;
    let html = PRINTSTYLES;
    html = html + '<div class="ql-editor document-parent">';
    // get all the children of pagesElement that has class studentId-{id of student}
    const studentHtmlPage = document.getElementById('pagesElement').querySelectorAll(`.studentId-${this.individualStudentId}`);
    studentHtmlPage.forEach((page) => {
      html = html + page.innerHTML;
    });
    html = html + '</div>';
    return html;
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
