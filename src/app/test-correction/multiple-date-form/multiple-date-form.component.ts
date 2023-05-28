import { Component, OnInit, Input, ViewChild, OnDestroy } from '@angular/core';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js'
import { UntypedFormGroup, Validators, UntypedFormBuilder, UntypedFormArray } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelectChange } from '@angular/material/select';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import { Correction, TestCreationRespData, ScoreConversion } from 'app/test/test-creation/test-creation.model';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { SpeechToTextDialogComponent } from 'app/shared/components/speech-to-text-dialog/speech-to-text-dialog.component';
import * as _ from 'lodash';
import * as moment from 'moment';
import { ParseUtcToLocalPipe } from 'app/shared/pipes/parse-utc-to-local.pipe';
import { ParseLocalToUtcPipe } from 'app/shared/pipes/parse-local-to-utc.pipe';
import { TranslateService } from '@ngx-translate/core';
import { CompetenceJobDescriptionResponse, MissionsActivitiesAutonomy } from 'app/student-cards/job-description/job-desc.model';

@Component({
  selector: 'ms-multiple-date-form',
  templateUrl: './multiple-date-form.component.html',
  styleUrls: ['./multiple-date-form.component.scss'],
  providers: [ParseUtcToLocalPipe, ParseLocalToUtcPipe],
})
export class MultipleDateFormComponent implements OnInit, OnDestroy {

  private subs = new SubSink();
  @ViewChild('autosize', { static: false }) autosize: CdkTextareaAutosize;
  @Input() testCorrectionForm: UntypedFormGroup;
  @Input() testData: TestCreationRespData;
  @Input() multipleDatesFormArray: UntypedFormArray;
  @Input() taskData;
  @Input() containerWidth: number;
  @Input() studentJobDescriptions: CompetenceJobDescriptionResponse[];
  tableWidthInPx = '0px';
  tableWidth = 0;

  // table variables
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = [];
  filterColumns: string[] = [];

  // CKEditor Config
  Editor = DecoupledEditor;
  config = {
    toolbar: ['bold', 'italic', 'Underline'],
  };

  // utility variable
  isWaitingForResponse = false;
  correctionData: Correction;
  maximumFinalMark: number;
  myInnerHeight = 960;
  sectionWidth: any;
  refWidth: any;
  directiveWidth: any;
  markScoreWidth: any;
  markLetterWidth: any;
  markPharseWidth: any;
  commentWidth: any;

  onReady(editor) {

    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  constructor(
    private fb: UntypedFormBuilder,
    public dialog: MatDialog,
    private parseUTCtoLocal: ParseUtcToLocalPipe,
    private translate: TranslateService,
    private parseLocalToUTCPipe: ParseLocalToUtcPipe,
  ) {}

  ngOnInit() {
    this.addTableColumn();
    this.calculateTableWidth();
  }

  // *************** To Get Height window screen and put in style css height
  getAutomaticHeight() {
    this.myInnerHeight = window.innerHeight - 333;
    return this.myInnerHeight;
  }
  addTableColumn() {
    if (this.testData && this.testData.correction_grid && this.testData.correction_grid.correction) {
      this.correctionData = this.testData.correction_grid.correction;
      if (this.correctionData.sections_evalskill.length) {
        this.displayedColumns.push('refId');
        this.displayedColumns.push('section');
      }
      if (this.correctionData.show_direction_column) {
        this.displayedColumns.push('directives');
      }
      if (this.multipleDatesFormArray && this.multipleDatesFormArray.controls && this.multipleDatesFormArray.controls.length) {
        this.multipleDatesFormArray.controls.forEach((dateData, dateIndex) => {
          if (this.correctionData.show_number_marks_column) {
            this.displayedColumns.push('markNumber' + dateIndex);
          }
          if (this.correctionData.show_letter_marks_column) {
            this.displayedColumns.push('markLetter' + dateIndex);
          }
          if (this.correctionData.show_phrase_marks_column) {
            this.displayedColumns.push('markPhrase' + dateIndex);
          }
          if (this.correctionData.comment_for_each_sub_section) {
            this.displayedColumns.push('comment' + dateIndex);
          }
        })
      }
    }
  }

  translateDate(date) {
    let localDate = date;
    if (date && date !== 'Invalid date') {
      const time = '00:01';
      localDate = this.parseUTCtoLocal.transformDate(date, time);
    }
    return localDate;
  }

  calculateTableWidth() {
    // calculate table width based on displayed column. you can find the width for each column in scss file with class .mat-column-

    this.tableWidth = 0;

    if (this.testData && this.testData.correction_grid && this.testData.correction_grid.correction) {
      this.correctionData = this.testData.correction_grid.correction;
      if (this.correctionData.sections_evalskill.length) {
        // ref id column width
        this.tableWidth = this.tableWidth + 70;
        // section column width
        this.tableWidth = this.tableWidth + 450;
      }
      if (this.correctionData.show_direction_column) {
        // directive column width
        this.tableWidth = this.tableWidth + 250;
      }
      if (this.multipleDatesFormArray && this.multipleDatesFormArray.controls && this.multipleDatesFormArray.controls.length) {
        this.multipleDatesFormArray.controls.forEach((dateData, dateIndex) => {
          if (this.correctionData.show_number_marks_column) {
            // mark number column width
            this.tableWidth = this.tableWidth + 100;
          }
          if (this.correctionData.show_letter_marks_column) {
            // mark letter column width
            this.tableWidth = this.tableWidth + 100;
          }
          if (this.correctionData.show_phrase_marks_column) {
            // mark phrase column width
            this.tableWidth = this.tableWidth + 150;
          }
          if (this.correctionData.comment_for_each_sub_section) {
            // comment column width
            this.tableWidth = this.tableWidth + 300;
          }
        })
      }
      this.tableWidthInPx = this.tableWidth.toString() + 'px';
    }
  }

  getMissionsActivitiesAutonomy(type: string, sectionIndex: number): string[] {
    let missionActivitiesAutonomy: MissionsActivitiesAutonomy[] = []
    const templateId = this.getSectionForm().at(sectionIndex).get('academic_skill_competence_template_id').value;
    // get template by filtering from competence_template_id
    const selectedTemplate = this.studentJobDescriptions.find(template => {
      if (template.competence_template_id && template.competence_template_id._id) {
        return template.competence_template_id._id === templateId;
      }
    })
    if (selectedTemplate && selectedTemplate.missions_activities_autonomy && selectedTemplate.missions_activities_autonomy.length) {
      missionActivitiesAutonomy = _.cloneDeep(selectedTemplate.missions_activities_autonomy);
    }
    if (type === 'mission') {
      return missionActivitiesAutonomy.map(data => data.mission);
    } else if (type === 'activity') {
      return missionActivitiesAutonomy.map(data => data.activity);
    } else if (type === 'autonomy') {
      return missionActivitiesAutonomy.map(data => data.autonomy_level);
    } else {
      return [];
    }
  }

  getAllMissionsActivitiesAutonomy(sectionIndex: number): any[] {
    let missionActivitiesAutonomy: MissionsActivitiesAutonomy[] = []
    const templateId = this.getSectionForm().at(sectionIndex).get('academic_skill_competence_template_id').value;
    // get template by filtering from competence_template_id
    const selectedTemplate = this.studentJobDescriptions.find(template => {
      if (template.competence_template_id && template.competence_template_id._id) {
        return template.competence_template_id._id === templateId;
      }
    })
    if (selectedTemplate && selectedTemplate.missions_activities_autonomy && selectedTemplate.missions_activities_autonomy.length) {
      missionActivitiesAutonomy = _.cloneDeep(selectedTemplate.missions_activities_autonomy);
    }
    return missionActivitiesAutonomy;
  }

  getCorrectionForm() {
    return this.testCorrectionForm.get('correction_grid').get('correction') as UntypedFormGroup;
  }

  getSectionForm() {
    return this.getCorrectionForm().get('sections_evalskill') as UntypedFormArray;
  }

  getSubSectionForm(sectionIndex: number) {
    return this.getSectionForm().at(sectionIndex).get('sub_sections') as UntypedFormArray;
  }

  getMultipleDatesSubSectionForm(sectionIndex: number, subSectionIndex: number) {
    return this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('multiple_dates') as UntypedFormArray;
  }

  toggleTitle(sectionIndex: number, subSectionIndex: number, status: boolean) {
    this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('showFullTitle').setValue(status);
  }

  toggleDirection(sectionIndex: number, subSectionIndex: number, status: boolean) {
    this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('showFullDirection').setValue(status);
  }

  getJurysSubSectionForm(sectionIndex: number, subSectionIndex: number) {
    return this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('jurys') as UntypedFormArray;
  }

  getPenaltiesFieldForm() {
    return this.getCorrectionForm().get('penalties') as UntypedFormArray;
  }

  getBonusesFieldForm() {
    return this.getCorrectionForm().get('bonuses') as UntypedFormArray;
  }

  validateNumeric(sectionIndex: number, subSectionIndex: number, dateIndex: number, maxRating: number) {
    if (maxRating) {
      const mark = this.getMultipleDatesSubSectionForm(sectionIndex, subSectionIndex).at(dateIndex).get('marks').value;
      if (mark > maxRating) {
        this.getMultipleDatesSubSectionForm(sectionIndex, subSectionIndex).at(dateIndex).get('marks').setValue(maxRating);
      } else if (mark < 0) {
        this.getMultipleDatesSubSectionForm(sectionIndex, subSectionIndex).at(dateIndex).get('marks').setValue(0);
      } else if (mark % 1 !== 0) {
        // if decimal number, set only 1 number behind comma
        const val = parseFloat(mark).toFixed(1).replace(',', '.');
        this.getMultipleDatesSubSectionForm(sectionIndex, subSectionIndex).at(dateIndex).get('marks').setValue(val);
      }
      // set additional total and total as 1 just to mark the test correction has inputted
      this.getCorrectionForm().get('additional_total').setValue(1);
      this.getCorrectionForm().get('total').setValue(1);
    }

  }

  isDateHasPassed(sectionIndex: number, subSectionIndex: number, dateIndex: number): boolean {
    // *********** disable all previous date field of the test so student cant edit their mark on previous date
    // const latestDate = this.getMultipleDatesSubSectionForm(sectionIndex, subSectionIndex).at(0).get('date').value;
    // const testDate = this.getMultipleDatesSubSectionForm(sectionIndex, subSectionIndex).at(dateIndex).get('date').value;
    // const isNotLatestDateField = testDate !== latestDate;
    // return isNotLatestDateField;

    const today = moment();
    let testDate = this.translateDate(this.getMultipleDatesSubSectionForm(sectionIndex, subSectionIndex).at(dateIndex).get('date').value);
    testDate = moment(testDate, 'DD/MM/YYYY').add(14, 'days');

    return today.isAfter(testDate);

  }

  getLetterPhraseMark(selectedScoreConversion: ScoreConversion, sectionIndex: number, subSectionIndex: number) {
    const selectedScore = selectedScoreConversion.score;
    this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValue(selectedScore);
    // set additional total and total as 1 just to mark the test correction has inputted
    this.getCorrectionForm().get('additional_total').setValue(1);
    this.getCorrectionForm().get('total').setValue(1);
  }

  openVoiceRecog(data, sectionIndex, subSectionIndex, dateIndex) {
    if (!this.isDateHasPassed(sectionIndex, subSectionIndex, dateIndex)) {
      this.dialog
        .open(SpeechToTextDialogComponent, {
          width: '800px',
          minHeight: '300px',
          panelClass: 'certification-rule-pop-up',
          disableClose: true,
          data: this.getMultipleDatesSubSectionForm(sectionIndex, subSectionIndex).at(dateIndex).get('observation').value,
        })
        .afterClosed()
        .subscribe((resp) => {

          this.getMultipleDatesSubSectionForm(sectionIndex, subSectionIndex).at(dateIndex).get('observation').setValue(resp)
        });
    }
  }

  openSectionVoiceRecog(data, sectionIndex) {
    this.dialog
      .open(SpeechToTextDialogComponent, {
        width: '800px',
        minHeight: '300px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: this.getSectionForm().at(sectionIndex).get('comment').value,
      })
      .afterClosed()
      .subscribe((resp) => {

        this.getSectionForm().at(sectionIndex).get('comment').setValue(resp)
      });
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

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

  // *************** To Get Width Section Column and put in style css height
  getColumnSectionWidth() {
    if (this.testData && this.testData.correction_grid && this.testData.correction_grid.correction) {
      const correctionData = this.testData.correction_grid.correction;
      if (
        correctionData.sections_evalskill.length &&
        correctionData.show_direction_column &&
        (correctionData.show_number_marks_column ||
          correctionData.show_letter_marks_column ||
          correctionData.show_phrase_marks_column) &&
        correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 25;
        this.refWidth = 10;
        this.directiveWidth = 30;
        this.markLetterWidth = 7;
        this.markPharseWidth = 7;
        this.markScoreWidth = 7;
        this.commentWidth = 30;
      } else if (
        correctionData.sections_evalskill.length &&
        correctionData.show_direction_column &&
        (correctionData.show_number_marks_column ||
          correctionData.show_letter_marks_column ||
          correctionData.show_phrase_marks_column) &&
        !correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 35;
        this.refWidth = 10;
        this.directiveWidth = 45;
        this.markLetterWidth = 7;
        this.markPharseWidth = 7;
        this.markScoreWidth = 7;
      } else if (
        correctionData.sections.length &&
        correctionData.show_direction_column &&
        !(correctionData.show_number_marks_column ||
          correctionData.show_letter_marks_column ||
          correctionData.show_phrase_marks_column) &&
        !correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 45;
        this.directiveWidth = 45;
      } else if (
        correctionData.sections.length &&
        !correctionData.show_direction_column &&
        !(correctionData.show_number_marks_column ||
          correctionData.show_letter_marks_column ||
          correctionData.show_phrase_marks_column) &&
        correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 45;
        this.commentWidth = 45;
      } else if (
        correctionData.sections_evalskill.length &&
        !correctionData.show_direction_column &&
        (correctionData.show_number_marks_column ||
          correctionData.show_letter_marks_column ||
          correctionData.show_phrase_marks_column) &&
        !correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 50;
        this.refWidth = 10;
        this.markLetterWidth = 5;
        this.markPharseWidth = 5;
        this.markScoreWidth = 5;
      } else if (
        correctionData.sections_evalskill.length &&
        !correctionData.show_direction_column &&
        (correctionData.show_number_marks_column ||
          correctionData.show_letter_marks_column ||
          correctionData.show_phrase_marks_column) &&
        correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 40;
        this.refWidth = 10;
        this.markLetterWidth = 7;
        this.markPharseWidth = 7;
        this.markScoreWidth = 7;
        this.commentWidth = 40;
      } else if (
        correctionData.sections_evalskill.length &&
        !correctionData.show_direction_column &&
        !(correctionData.show_number_marks_column ||
          correctionData.show_letter_marks_column ||
          correctionData.show_phrase_marks_column) &&
        !correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 90;
        this.refWidth = 10;
      } else if (
        correctionData.sections_evalskill.length &&
        correctionData.show_direction_column &&
        !(correctionData.show_number_marks_column ||
          correctionData.show_letter_marks_column ||
          correctionData.show_phrase_marks_column) &&
        !correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 40;
        this.refWidth = 10;
        this.directiveWidth = 50;
      } else if (
        correctionData.sections_evalskill.length &&
        !correctionData.show_direction_column &&
        !(correctionData.show_number_marks_column ||
          correctionData.show_letter_marks_column ||
          correctionData.show_phrase_marks_column) &&
        correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 40;
        this.refWidth = 10;
        this.commentWidth = 50;
      } else if (
        correctionData.sections_evalskill.length &&
        correctionData.show_direction_column &&
        !(correctionData.show_number_marks_column ||
          correctionData.show_letter_marks_column ||
          correctionData.show_phrase_marks_column) &&
        correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 30;
        this.refWidth = 10;
        this.directiveWidth = 30;
        this.commentWidth = 30;
      }
    }
  }
}
