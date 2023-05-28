import { Component, OnInit, Input, ViewChild, OnDestroy, OnChanges } from '@angular/core';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { UntypedFormGroup, Validators, UntypedFormBuilder, UntypedFormArray } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSelectChange } from '@angular/material/select';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'apollo-link';
import { SubSink } from 'subsink';
import * as _ from 'lodash';
import {
  TestCorrectionCorrectionGridCorrectionSectionInput,
  TestCorrectionCorrectionGridCorrectionSubSectionInput,
  TestCorrectionCorrectionGridCorrectionPenaltyBonusInput,
} from '../test-correction.model';
import { Correction, TestCreationRespData, ScoreConversion } from 'app/test/test-creation/test-creation.model';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { SpeechToTextDialogComponent } from 'app/shared/components/speech-to-text-dialog/speech-to-text-dialog.component';

@Component({
  selector: 'ms-jury-organization-form',
  templateUrl: './jury-organization-form.component.html',
  styleUrls: ['./jury-organization-form.component.scss'],
})
export class JuryOrganizationFormComponent implements OnInit, OnDestroy, OnChanges {
  private subs = new SubSink();
  @ViewChild('autosize', { static: false }) autosize: CdkTextareaAutosize;
  @Input() testCorrectionForm: UntypedFormGroup;
  @Input() testData: TestCreationRespData;
  @Input() loadReady;

  // table variables
  @ViewChild(MatPaginator, { static: true }) paginator: MatPaginator;
  @ViewChild(MatSort, { static: true }) sort: MatSort;
  dataSource = new MatTableDataSource([]);
  displayedColumns: string[] = [];
  filterColumns: string[] = [];
  juryColumns = [];

  // CKEditor Config
  Editor = DecoupledEditor;
  config = {
    toolbar: ['bold', 'italic', 'Underline'],
  };
  // utility variable
  firstLoadOnly = true;
  selector = 'sections';
  isWaitingForResponse = false;
  correctionData: Correction;
  maximumFinalMark: number;
  myInnerHeight = 960;
  myInnerWidth = 730;
  sectionWidth: any;
  directiveWidth: any;
  evaluationCheckboxWidth: number;
  markScoreWidth: any;
  markLetterWidth: any;
  markPharseWidth: any;
  commentWidth: any;

  onReady(editor) {

    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  constructor(private fb: UntypedFormBuilder, public dialog: MatDialog) {}

  ngOnInit() {
    if (this.testData.block_type === 'competence' || this.testData.block_type === 'soft_skill') {
      // when test is eval by competence, we take data from field sections_evalskill instead of sections
      this.selector = 'sections_evalskill';
    }
    this.addTableColumn();
    this.getColumnSectionWidth();
  }

  ngOnChanges() {
    if (this.testData && this.testData.correction_grid && this.testData.correction_grid.correction) {
      this.correctionData = this.testData.correction_grid.correction;
    }
    if (this.loadReady) {
      if (this.firstLoadOnly) {
        this.firstLoadOnly = false;
        this.reCaluculateScoreMarkJury();
      }
    }
  }

  // *************** To Get Width Comment Column and put in style css height
  getAutomaticWidth() {
    this.myInnerWidth = window.innerWidth - 642;
    return this.myInnerWidth;
  }

  addTableColumn() {
    if (this.testData && this.testData.correction_grid && this.testData.correction_grid.correction) {
      this.correctionData = this.testData.correction_grid.correction;
      if (this.selector === 'sections_evalskill') {
        // when test is eval by competence, display column refId
        this.displayedColumns.push('refId');
      }
      if (this.correctionData[this.selector].length) {
        this.displayedColumns.push('section');
      }
      if (this.correctionData.show_direction_column) {
        this.displayedColumns.push('directives');
      }
      if (this.selector === 'sections_evalskill') {
        this.displayedColumns.push('isEvaluated');
      }
      if (this.testData.jury_max) {
        for (let i = 0; i < this.testData.jury_max; i++) {
          const juryColumnName = 'Jury - ' + (i + 1);
          this.juryColumns.push(juryColumnName);
          this.displayedColumns.push(juryColumnName);



        }
      }
      if (this.correctionData.show_number_marks_column) {
        this.displayedColumns.push('markColumn');
        // this.displayedColumns.push('markNumber');
      }
      // if (this.correctionData.show_letter_marks_column) {
      //   this.displayedColumns.push('markLetter');
      // }
      // if (this.correctionData.show_phrase_marks_column) {
      //   this.displayedColumns.push('markPhrase');
      // }
      if (this.correctionData.comment_for_each_sub_section) {
        this.displayedColumns.push('comment');
      }


    }
  }

  isEvaluated(sectionIndex: number, subSectionIndex: number): boolean {
    return this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('is_criteria_evaluated').value;
  }

  disableJuryInput(juryColumnIndex: number, sectionIndex: number, subSectionIndex: number): boolean {
    if (this.selector === 'sections_evalskill') {
      // when test is eval by competence, we need also check the checkbox is_criteria_evaluated
      return !this.getJuryEnabledListForm().at(juryColumnIndex).get('state').value || !this.isEvaluated(sectionIndex, subSectionIndex);
    } else {
      return !this.getJuryEnabledListForm().at(juryColumnIndex).get('state').value;
    }
  }

  getCorrectionForm() {
    return this.testCorrectionForm.get('correction_grid').get('correction') as UntypedFormGroup;
  }

  getSectionForm() {
    return this.getCorrectionForm().get(this.selector) as UntypedFormArray;
  }

  getSubSectionForm(sectionIndex: number) {
    return this.getSectionForm().at(sectionIndex).get('sub_sections') as UntypedFormArray;
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

  getJuryEnabledListForm() {
    return this.testCorrectionForm.get('jury_enabled_list') as UntypedFormArray;
  }

  validateNumeric(sectionIndex: number, subSectionIndex: number, maxRating: number) {
    if (maxRating) {
      const mark = +this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').value;
      if (mark > maxRating) {
        this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValue(maxRating);
      } else if (mark < 0) {
        this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValue(0);
      } else if (mark % 1 !== 0) {
        // if decimal number, set only 2 number behind comma
        const val = parseFloat(mark.toFixed(2));
        this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValue(val);
      }
      this.getTotalSectionMark(sectionIndex);

    }
  }

  validateJuryNumeric(sectionIndex: number, subSectionIndex: number, juryIndex: number, maxRating: number) {
    if (maxRating) {
      const mark = +this.getJurysSubSectionForm(sectionIndex, subSectionIndex).at(juryIndex).get('marks').value;
      if (mark > maxRating) {
        this.getJurysSubSectionForm(sectionIndex, subSectionIndex).at(juryIndex).get('marks').setValue(maxRating);
      } else if (mark < 0) {
        this.getJurysSubSectionForm(sectionIndex, subSectionIndex).at(juryIndex).get('marks').setValue(0);
      } else if (mark % 1 !== 0) {
        // if decimal number, set only 2 number behind comma
        const val = parseFloat(mark.toFixed(2));
        this.getJurysSubSectionForm(sectionIndex, subSectionIndex).at(juryIndex).get('marks').setValue(val);
      }
      // dont calculate subsection that not evaluated in test eval by competence
      if (this.selector === 'sections_evalskill' && this.isEvaluated(sectionIndex, subSectionIndex)) {
        this.calculateRatingSubSection(sectionIndex, subSectionIndex);
      } else {
        this.calculateRatingSubSection(sectionIndex, subSectionIndex);
      }

    }
  }

  validateJuryLetterPhrase(sectionIndex: number, subSectionIndex: number, juryIndex: number, selectedScoreConversion: ScoreConversion) {
    const selectedScore = selectedScoreConversion.score;
    this.getJurysSubSectionForm(sectionIndex, subSectionIndex).at(juryIndex).get('marks').setValue(selectedScore);
    // dont calculate subsection that not evaluated in test eval by competence
    if (this.selector === 'sections_evalskill' && this.isEvaluated(sectionIndex, subSectionIndex)) {
      this.calculateRatingSubSection(sectionIndex, subSectionIndex);
    } else {
      this.calculateRatingSubSection(sectionIndex, subSectionIndex);
    }

  }

  calculateRatingSubSection(sectionIndex: number, subSectionIndex: number) {

    const dataEnabledJury = this.getJuryEnabledListForm().value;
    let totalEnabledJury = 0;
    let totalRating = 0;

    if (dataEnabledJury && dataEnabledJury.length) {
      dataEnabledJury.forEach((juryEnabled, juryEnabledIndex) => {
        if (juryEnabled && juryEnabled.state) {
          totalEnabledJury++;
          totalRating += this.getJurysSubSectionForm(sectionIndex, subSectionIndex).at(juryEnabledIndex).get('marks').value;
        }
      });
    }

    const result =
      (totalRating / totalEnabledJury).toFixed(2) && (totalRating / totalEnabledJury).toFixed(2) !== '0.00'
        ? (totalRating / totalEnabledJury).toFixed(2)
        : '0';


    this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValue(result);
    this.getTotalSectionMark(sectionIndex);
  }

  updateSliderEnabledJury(event: MatSlideToggleChange, juryEnabledIndex) {
    const correctionData = this.getCorrectionForm().value;

    if (event && !event.checked) {
      // remove mark when slide toggle is turned off
      if (correctionData && correctionData[this.selector] && correctionData[this.selector].length) {
        correctionData[this.selector].forEach((section, sectionIndex) => {
          if (section && section.sub_sections && section.sub_sections.length) {
            section.sub_sections.forEach((subSection, subSectionIndex) => {
              if (subSection && subSection.jurys && subSection.jurys.length) {
                subSection.jurys.forEach((jury, juryIndex) => {
                  if (juryEnabledIndex === juryIndex) {
                    this.getJurysSubSectionForm(sectionIndex, subSectionIndex).at(juryIndex).get('marks').setValue(null);
                    this.getJurysSubSectionForm(sectionIndex, subSectionIndex).at(juryIndex).get('score_conversion_id').setValue(null);
                  }
                });
              }
              this.calculateRatingSubSection(sectionIndex, subSectionIndex);
            });
          }
        });
      }
    } else if (event && event.checked) {
      // calculate total mark when slide toggle is turned on
      if (correctionData && correctionData[this.selector] && correctionData[this.selector].length) {
        correctionData[this.selector].forEach((section, sectionIndex) => {
          if (section && section.sub_sections && section.sub_sections.length) {
            section.sub_sections.forEach((subSection, subSectionIndex) => {
              this.calculateRatingSubSection(sectionIndex, subSectionIndex);
            });
          }
        });
      }
    }
  }

  getLetterPhraseMark(selectedScoreConversion: ScoreConversion, sectionIndex: number, subSectionIndex: number) {
    // calculate score: (score in score conversion table / maximum score) * sub section maximum score
    const selectedScore = selectedScoreConversion.score;
    const maximumScore = this.correctionData[this.selector][sectionIndex].maximum_rating;
    const subSectionMaxScore = this.correctionData[this.selector][sectionIndex].sub_sections[subSectionIndex].maximum_rating;
    const total: number = (selectedScore / maximumScore) * subSectionMaxScore;

    // if whole number, display total without comma
    if (total % 1 === 0) {
      this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValue(total);
    } else {
      this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValue(total.toFixed(2));
    }
    this.getTotalSectionMark(sectionIndex);

  }

  getTotalSectionMark(sectionIndex: number) {
    const subSections: TestCorrectionCorrectionGridCorrectionSubSectionInput[] = this.getSectionForm()
      .at(sectionIndex)
      .get('sub_sections').value;

    let totalMark = 0;
    subSections.forEach((subSection) => {
      totalMark = totalMark + (subSection.rating ? +subSection.rating : 0);
    });
    if (totalMark % 1 === 0) {
      this.getSectionForm().at(sectionIndex).get('rating').setValue(totalMark.toFixed(2));
    } else {
      this.getSectionForm().at(sectionIndex).get('rating').setValue(totalMark);
    }
    // calculate final mark only if user not check elimination (student not eliminated)
    this.getFinalMark();
  }

  getFinalMark() {
    this.getMaximumFinalMark();
    if (!this.getCorrectionForm().get('elimination').value) {
      const sections: TestCorrectionCorrectionGridCorrectionSectionInput[] = this.getSectionForm().value;
      const penalties: TestCorrectionCorrectionGridCorrectionPenaltyBonusInput[] = this.getPenaltiesFieldForm().value;
      const bonuses: TestCorrectionCorrectionGridCorrectionPenaltyBonusInput[] = this.getBonusesFieldForm().value;

      let total = 0;
      sections.forEach((section) => {
        total = total + (section.rating ? +section.rating : 0);
      });
      penalties.forEach((penalty) => {
        const totalMinusPenalty = total - (penalty.rating ? +penalty.rating : 0);
        total = totalMinusPenalty >= 0 ? totalMinusPenalty : 0;
      });
      bonuses.forEach((bonus) => {
        const totalPlusBonus = total + (bonus.rating ? +bonus.rating : 0);
        total = totalPlusBonus <= this.maximumFinalMark ? totalPlusBonus : this.maximumFinalMark;
      });

      if (total % 1 === 0) {
        this.getCorrectionForm().get('total').setValue(total);
      } else {
        this.getCorrectionForm().get('total').setValue(total.toFixed(2));
      }
      this.getAdditionalTotal();
    }
  }

  getAdditionalTotal() {
    const finalMark = +this.getCorrectionForm().get('total').value;
    let additionalTotal = 0;
    if (this.testData.correction_grid.correction.total_zone && this.testData.correction_grid.correction.total_zone.additional_max_score) {
      additionalTotal = (this.testData.correction_grid.correction.total_zone.additional_max_score / this.maximumFinalMark) * finalMark;
    } else {
      additionalTotal = (20 / this.maximumFinalMark) * finalMark;
    }
    const decimalPlace = this.testData.correction_grid.correction.total_zone.decimal_place;
    this.getCorrectionForm().get('additional_total').setValue(additionalTotal.toFixed(decimalPlace));
    this.getCorrectionForm().get('total_jury_avg_rating').setValue(additionalTotal.toFixed(decimalPlace));
  }

  getMaximumFinalMark() {
    this.maximumFinalMark = 0;
    this.correctionData[this.selector].forEach((section) => {
      this.maximumFinalMark = this.maximumFinalMark + (section.maximum_rating ? +section.maximum_rating : 0);
    });
  }

  openVoiceRecog(data, sectionIndex, subSectionIndex) {



    this.dialog
      .open(SpeechToTextDialogComponent, {
        width: '800px',
        minHeight: '300px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').value,
      })
      .afterClosed()
      .subscribe((resp) => {

        this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').patchValue(resp);
      });
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

        this.getSectionForm().at(sectionIndex).get('comment').setValue(resp);
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

  toggleCriteriaEvaluated(event: MatCheckboxChange, sectionIndex: number, subSectionIndex: number) {
    if (event.checked) {
      // add validation when checked
      this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValidators([Validators.required]);
      this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
    } else {
      // remove validation if not checked
      this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').clearValidators();
      this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
      // remove mark and comment
      this.getJurysSubSectionForm(sectionIndex, subSectionIndex).controls.forEach((juryForm) => {
        juryForm.get('marks').setValue(null);
      });
      this.getJurysSubSectionForm(sectionIndex, subSectionIndex).controls.forEach((juryForm) => {
        juryForm.get('score_conversion_id').setValue(null);
      });
      this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValue(null);
      this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('score_conversion_id').setValue(null);
      this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').setValue('');
    }
  }

  // *************** To Get Width Section Column and put in style css width
  getColumnSectionWidth() {
    if (this.testData && this.testData.correction_grid && this.testData.correction_grid.correction) {
      const correctionData = this.testData.correction_grid.correction;
      if (
        correctionData[this.selector].length &&
        correctionData.show_direction_column &&
        (correctionData.show_number_marks_column || correctionData.show_letter_marks_column || correctionData.show_phrase_marks_column) &&
        correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 25;
        this.evaluationCheckboxWidth = 4;
        this.directiveWidth = 35;
        this.markLetterWidth = 5;
        this.markPharseWidth = 10;
        this.markScoreWidth = 5;
        this.commentWidth = 30;
      } else if (
        correctionData[this.selector].length &&
        correctionData.show_direction_column &&
        (correctionData.show_number_marks_column || correctionData.show_letter_marks_column || correctionData.show_phrase_marks_column) &&
        !correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 45;
        this.evaluationCheckboxWidth = 4;
        this.directiveWidth = 45;
        this.markLetterWidth = 5;
        this.markPharseWidth = 10;
        this.markScoreWidth = 5;
      } else if (
        correctionData[this.selector].length &&
        correctionData.show_direction_column &&
        !(correctionData.show_number_marks_column || correctionData.show_letter_marks_column || correctionData.show_phrase_marks_column) &&
        !correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 45;
        this.evaluationCheckboxWidth = 4;
        this.directiveWidth = 45;
      } else if (
        correctionData[this.selector].length &&
        !correctionData.show_direction_column &&
        !(correctionData.show_number_marks_column || correctionData.show_letter_marks_column || correctionData.show_phrase_marks_column) &&
        correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 45;
        this.evaluationCheckboxWidth = 4;
        this.commentWidth = 45;
      } else if (
        correctionData[this.selector].length &&
        !correctionData.show_direction_column &&
        (correctionData.show_number_marks_column || correctionData.show_letter_marks_column || correctionData.show_phrase_marks_column) &&
        !correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 95;
        this.evaluationCheckboxWidth = 4;
        this.markLetterWidth = 5;
        this.markPharseWidth = 10;
        this.markScoreWidth = 5;
      } else if (
        correctionData[this.selector].length &&
        !correctionData.show_direction_column &&
        (correctionData.show_number_marks_column || correctionData.show_letter_marks_column || correctionData.show_phrase_marks_column) &&
        correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 45;
        this.evaluationCheckboxWidth = 4;
        this.markLetterWidth = 5;
        this.markPharseWidth = 10;
        this.markScoreWidth = 5;
        this.commentWidth = 45;
      } else if (
        correctionData[this.selector].length &&
        !correctionData.show_direction_column &&
        !(correctionData.show_number_marks_column || correctionData.show_letter_marks_column || correctionData.show_phrase_marks_column) &&
        !correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 100;
        this.evaluationCheckboxWidth = 4;
      } else if (
        correctionData[this.selector].length &&
        correctionData.show_direction_column &&
        !(correctionData.show_number_marks_column || correctionData.show_letter_marks_column || correctionData.show_phrase_marks_column) &&
        !correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 45;
        this.evaluationCheckboxWidth = 4;
        this.directiveWidth = 55;
      } else if (
        correctionData[this.selector].length &&
        !correctionData.show_direction_column &&
        !(correctionData.show_number_marks_column || correctionData.show_letter_marks_column || correctionData.show_phrase_marks_column) &&
        correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 45;
        this.evaluationCheckboxWidth = 4;
        this.commentWidth = 55;
      } else if (
        correctionData[this.selector].length &&
        correctionData.show_direction_column &&
        !(correctionData.show_number_marks_column || correctionData.show_letter_marks_column || correctionData.show_phrase_marks_column) &&
        correctionData.comment_for_each_sub_section
      ) {
        this.sectionWidth = 30;
        this.evaluationCheckboxWidth = 4;
        this.directiveWidth = 35;
        this.commentWidth = 35;
      }
    }
  }
  // *************** To Get Height window screen and put in style css height
  getAutomaticHeight() {
    if (
      this.testData.correction_grid.header.fields &&
      this.testData.correction_grid.header.fields.length &&
      this.testData.correction_grid.footer.fields &&
      this.testData.correction_grid.footer.fields.length < 1 &&
      !this.testData.correction_grid.correction.show_final_comment
    ) {
      this.myInnerHeight = window.innerHeight - 333;
      return this.myInnerHeight;
    } else if (
      this.testData.correction_grid.footer.fields &&
      this.testData.correction_grid.footer.fields.length &&
      this.testData.correction_grid.header.fields &&
      this.testData.correction_grid.header.fields.length < 1 &&
      !this.testData.correction_grid.correction.show_final_comment
    ) {
      this.myInnerHeight = window.innerHeight - 318;
      return this.myInnerHeight;
    } else if (
      this.testData.correction_grid.header.fields &&
      this.testData.correction_grid.header.fields.length &&
      this.testData.correction_grid.footer.fields &&
      this.testData.correction_grid.footer.fields.length &&
      !this.testData.correction_grid.correction.show_final_comment
    ) {
      this.myInnerHeight = window.innerHeight - 363;
      return this.myInnerHeight;
    } else if (
      this.testData.correction_grid.header.fields &&
      this.testData.correction_grid.header.fields.length &&
      this.testData.correction_grid.footer.fields &&
      this.testData.correction_grid.footer.fields.length &&
      this.testData.correction_grid.correction.show_final_comment
    ) {
      this.myInnerHeight = window.innerHeight - 433;
      return this.myInnerHeight;
    } else if (
      this.testData.correction_grid.header.fields &&
      this.testData.correction_grid.header.fields.length &&
      this.testData.correction_grid.footer.fields &&
      this.testData.correction_grid.footer.fields.length < 1 &&
      this.testData.correction_grid.correction.show_final_comment
    ) {
      this.myInnerHeight = window.innerHeight - 333;
      return this.myInnerHeight;
    } else if (
      this.testData.correction_grid.header.fields &&
      this.testData.correction_grid.header.fields.length < 1 &&
      this.testData.correction_grid.footer.fields &&
      this.testData.correction_grid.footer.fields.length &&
      this.testData.correction_grid.correction.show_final_comment
    ) {
      this.myInnerHeight = window.innerHeight - 378;
      return this.myInnerHeight;
    } else if (
      this.testData.correction_grid.header.fields &&
      this.testData.correction_grid.header.fields.length < 1 &&
      this.testData.correction_grid.footer.fields &&
      this.testData.correction_grid.footer.fields.length < 1 &&
      this.testData.correction_grid.correction.show_final_comment
    ) {
      this.myInnerHeight = window.innerHeight - 328;
      return this.myInnerHeight;
    } else {
      this.myInnerHeight = window.innerHeight - 333;
      return this.myInnerHeight;
    }
  }

  reCaluculateScoreMarkJury() {
    const payload = _.cloneDeep(this.testCorrectionForm.value);

    if (
      this.selector &&
      this.correctionData &&
      payload &&
      payload.correction_grid &&
      payload.correction_grid.correction &&
      payload.correction_grid.correction[this.selector] &&
      payload.correction_grid.correction[this.selector].length
    ) {
      payload.correction_grid.correction[this.selector].forEach((section, InSection) => {
        if (section && section.sub_sections && section.sub_sections.length) {
          section.sub_sections.forEach((subSections, subSectionIndex) => {
            const maxRating = this.correctionData[this.selector][InSection].sub_sections[subSectionIndex].maximum_rating;
            if (subSections && subSections.jurys && subSections.jurys.length) {
              subSections.jurys.forEach((jury, juryIndex) => {
                if (maxRating) {
                  const mark = +this.getJurysSubSectionForm(InSection, subSectionIndex).at(juryIndex).get('marks').value;
                  if (mark > maxRating) {
                    this.getJurysSubSectionForm(InSection, subSectionIndex).at(juryIndex).get('marks').setValue(maxRating);
                  } else if (mark < 0) {
                    this.getJurysSubSectionForm(InSection, subSectionIndex).at(juryIndex).get('marks').setValue(0);
                  } else if (mark % 1 !== 0) {
                    // if decimal number, set only 2 number behind comma
                    const val = parseFloat(mark.toFixed(2));
                    this.getJurysSubSectionForm(InSection, subSectionIndex).at(juryIndex).get('marks').setValue(val);
                  }
                  // dont calculate subsection that not evaluated in test eval by competence
                  if (this.selector === 'sections_evalskill' && this.isEvaluated(InSection, subSectionIndex)) {
                    this.calculateRatingSubSection(InSection, subSectionIndex);
                  } else {
                    this.calculateRatingSubSection(InSection, subSectionIndex);
                  }

                }
              });
            }
          });
        }
      });
    }
  }
}
