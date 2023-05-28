import { Component, OnInit, Input, ViewChild, OnDestroy } from '@angular/core';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { UntypedFormGroup, Validators, UntypedFormBuilder, UntypedFormArray } from '@angular/forms';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SubSink } from 'subsink';
import { Correction, TestCreationRespData, ScoreConversion } from 'app/test/test-creation/test-creation.model';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { SpeechToTextDialogComponent } from 'app/shared/components/speech-to-text-dialog/speech-to-text-dialog.component';
import { CkeditorInputDialogComponent } from 'app/shared/components/ckeditor-input-dialog/ckeditor-input-dialog.component';
import * as _ from 'lodash';
import { CompetenceJobDescriptionResponse, MissionsActivitiesAutonomy } from 'app/student-cards/job-description/job-desc.model';
import { NgxPermissionsService } from 'ngx-permissions';
import { UtilityService } from 'app/service/utility/utility.service';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-eval-by-competence-form',
  templateUrl: './eval-by-competence-form.component.html',
  styleUrls: ['./eval-by-competence-form.component.scss'],
})
export class EvalByCompetenceFormComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @ViewChild('autosize', { static: false }) autosize: CdkTextareaAutosize;
  @Input() testCorrectionForm: UntypedFormGroup;
  @Input() testData: any;
  @Input() studentJobDescriptions: CompetenceJobDescriptionResponse[];

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

  public config2 = {
    placeholder:
      "Justification obligatoire (merci de prendre le temps d'argumenter le résultat afin de permettre à l'apprenant de mesurer son niveau d'acquisition des compétences)",
    height: '20rem',
    toolbar: [
      'heading',
      '|',
      'fontsize',
      '|',
      'bold',
      'italic',
      'Underline',
      'strikethrough',
      'highlight',
      '|',
      'alignment',
      '|',
      'numberedList',
      'bulletedList',
      '|',
    ],
  };

  // utility variable
  isWaitingForResponse = false;
  correctionData: Correction;
  maximumFinalMark: number;
  myInnerHeight = 960;
  sectionWidth: number;
  evaluationCheckboxWidth: number;
  refWidth: number;
  directiveWidth: number;
  markScoreWidth: number;
  markLetterWidth: number;
  markPharseWidth: number;
  commentWidth: number;
  evaluationMatrix: boolean[] = []
  isCertifierAdmin = false;
  isAcadir = false;
  isCorrector = false;
  schoolId = null
  disabledCke = false;
  onReady(editor) {

    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  constructor(
    private fb: UntypedFormBuilder,
    public dialog: MatDialog,
    private permissions: NgxPermissionsService,
    private utilService: UtilityService,
    private route: ActivatedRoute,
    private translate: TranslateService,
  ) {}

  ngOnInit() {
    this.isCorrector = this.utilService.isCorrector() || this.utilService.isCorrectorCertifier() || this.utilService.isCorrectorOfProblematic() || this.utilService.isCorrectorQuality();
    this.isCertifierAdmin = this.utilService.isUserCRDirAdmin();
    if (!!this.permissions.getPermission('Academic Director') || !!this.permissions.getPermission('Academic Admin')) {
      this.isAcadir = true;
    }
    this.subs.sink = this.route.queryParamMap.subscribe((queryParams) => {
      this.schoolId = queryParams.get('school');
    });
    this.isValidatedByAcadirOrCertAdmin();
    this.addTableColumn();
    this.getColumnSectionWidth();

    this.populateEvaluationMatrix()
  }
  isValidatedByAcadirOrCertAdmin() {
    this.disabledCke = false;
    if (this.testData) {
      const schoolCorrectionStatus: { school: { _id: string }; correction_status: string }[] = this.testData?.correction_status_for_schools;
      if (schoolCorrectionStatus?.length) {
        const correctionStatus = schoolCorrectionStatus.find((correction) => correction?.school?._id === this.schoolId);
        // ***************** Condition Below to avoid Acadir and Cert Admin Modify Test Mark Entry that already validated by they self
        if (
          correctionStatus &&
          ((this.isAcadir && ['validated_by_acad_dir', 'validated_by_certi_admin'].includes(correctionStatus?.correction_status)) ||
            (this.isCertifierAdmin && ['validated_by_acad_dir', 'validated_by_certi_admin'].includes(correctionStatus?.correction_status)))
        ) {
          this.disabledCke = true;
        }
        // ***************** Condition Below to avoid Acadir and Cert Admin Modify Test Mark Entry that already validated
        // ***************** and for correction type admtc
        if (
          correctionStatus &&
          ((this.isAcadir && correctionStatus?.correction_status === 'corrected' && this.testData?.correction_type === 'admtc') ||
            (this.isCertifierAdmin && correctionStatus?.correction_status === 'corrected' && this.testData?.correction_type === 'admtc'))
        ) {
          this.disabledCke = true;
        }
      }
    }
  }
  populateEvaluationMatrix() {
    for (const section of this.getSectionForm().controls) {
      const allNotEvaluated = section.get('sub_sections').value?.every(subSection => subSection?.is_criteria_evaluated === false)
      this.evaluationMatrix.push(!allNotEvaluated)
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
      if (this.correctionData.sections_evalskill.length) {
        this.displayedColumns.push('isEvaluated');
      }
      if (this.correctionData.show_number_marks_column) {
        this.displayedColumns.push('markNumber');
      }
      if (this.correctionData.show_letter_marks_column) {
        this.displayedColumns.push('markLetter');
      }
      if (this.correctionData.show_phrase_marks_column) {
        this.displayedColumns.push('markPhrase');
      }
      if (this.correctionData.comment_for_each_sub_section) {
        this.displayedColumns.push('comment');
      }
    }
  }

  getMissionsActivitiesAutonomy(type: string, sectionIndex: number): string[] {
    let missionActivitiesAutonomy: MissionsActivitiesAutonomy[] = [];
    const templateId = this.getSectionForm().at(sectionIndex).get('academic_skill_competence_template_id').value;
    // get template by filtering from competence_template_id
    const selectedTemplate = this.studentJobDescriptions.find((template) => {
      if (template.competence_template_id && template.competence_template_id._id) {
        return template.competence_template_id._id === templateId;
      }
    });
    if (selectedTemplate && selectedTemplate.missions_activities_autonomy && selectedTemplate.missions_activities_autonomy.length) {
      missionActivitiesAutonomy = _.cloneDeep(selectedTemplate.missions_activities_autonomy);
    }
    if (type === 'mission') {
      return missionActivitiesAutonomy.map((data) => data.mission);
    } else if (type === 'activity') {
      return missionActivitiesAutonomy.map((data) => data.activity);
    } else if (type === 'autonomy') {
      return missionActivitiesAutonomy.map((data) => data.autonomy_level);
    } else {
      return [];
    }
  }

  getAllMissionsActivitiesAutonomy(sectionIndex: number): any[] {
    let missionActivitiesAutonomy: MissionsActivitiesAutonomy[] = [];
    const templateId = this.getSectionForm().at(sectionIndex).get('academic_skill_competence_template_id').value;
    // get template by filtering from competence_template_id
    const selectedTemplate = this.studentJobDescriptions.find((template) => {
      if (template.competence_template_id && template.competence_template_id._id) {
        return template.competence_template_id._id === templateId;
      }
    });
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

  toggleCriteriaEvaluated(event: MatCheckboxChange, sectionIndex: number, subSectionIndex: number) {
    if (!event.checked) {
      if (
        (this.isAcadir || this.isCorrector) &&
        (this.testData.type !== 'academic_auto_evaluation' &&
        this.testData.type !== 'academic_pro_evaluation' &&
        this.testData.type !== 'soft_skill_auto_evaluation' &&
        this.testData.type !== 'soft_skill_pro_evaluation')
      ) {
        Swal.fire({
          type: 'info',
          title: this.translate.instant('CRITERIA_EVALUATED_S1.TITLE'),
          html: this.translate.instant('CRITERIA_EVALUATED_S1.TEXT'),
          footer: `<span style="margin-left: auto">CRITERIA_EVALUATED_S1</span>`,
          showCancelButton: false,
          confirmButtonText: this.translate.instant('CRITERIA_EVALUATED_S1.BUTTON_1'),
          allowOutsideClick: false
        })

        return this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('is_criteria_evaluated').patchValue(true);
      }
    }

    if (event.checked) {
      // add validation when checked
      this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValidators([Validators.required]);
      this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
    } else {
      // remove validation if not checked
      this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').clearValidators();
      this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').updateValueAndValidity();
      // remove mark and comment
      this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValue(null);
      this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('score_conversion_id').setValue(null);
      this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').setValue('');
    }

    const subSection = this.getSubSectionForm(sectionIndex).value;
    if (subSection && subSection.length) {
      let allNotEvaluated = subSection.every((subs) => {
        return subs.is_criteria_evaluated === false;
      });


      this.evaluationMatrix[sectionIndex] = !allNotEvaluated
      if (allNotEvaluated) {
        this.getSectionForm().at(sectionIndex).get('comment').patchValue('<p>Non évalué</p>');
      }
    }
  }

  isEvaluated(sectionIndex: number, subSectionIndex: number): boolean {
    return this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('is_criteria_evaluated').value;
  }

  validateNumeric(sectionIndex: number, subSectionIndex: number, maxRating: number) {
    if (maxRating === null) {
      maxRating = 5;
    }

    if (maxRating) {
      const mark = this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').value;
      if (mark > maxRating) {
        this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValue(maxRating);
      } else if (mark < 0) {
        this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValue(0);
      } else if (mark % 1 !== 0) {
        // if decimal number, set only 1 number behind comma
        const val = parseFloat(mark).toFixed(1).replace(',', '.');
        this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValue(val);
      }
      // set additional total and total as 1 just to mark the test correction has inputted
      this.getCorrectionForm().get('additional_total').setValue(1);
      this.getCorrectionForm().get('total').setValue(1);
    }
  }

  getLetterPhraseMark(selectedScoreConversion: ScoreConversion, sectionIndex: number, subSectionIndex: number) {
    const selectedScore = selectedScoreConversion.score;
    this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('rating').setValue(selectedScore);
    // set additional total and total as 1 just to mark the test correction has inputted
    this.getCorrectionForm().get('additional_total').setValue(1);
    this.getCorrectionForm().get('total').setValue(1);
  }

  openVoiceRecog(data, sectionIndex, subSectionIndex) {



    this.dialog
      .open(SpeechToTextDialogComponent, {
        width: '800px',
        minHeight: '300px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: '',
      })
      .afterClosed()
      .subscribe((resp) => {

        if (resp.trim()) {
          const voiceText = `${resp}`;
          const justification = this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('comments').value;
          this.getSubSectionForm(sectionIndex)
            .at(subSectionIndex)
            .get('comments')
            .setValue(justification ? justification + ' ' + voiceText : voiceText);
        }
      });
  }

  openSectionVoiceRecog(data, sectionIndex) {
    this.dialog
      .open(SpeechToTextDialogComponent, {
        width: '800px',
        minHeight: '300px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: '',
      })
      .afterClosed()
      .subscribe((resp) => {

        if (resp.trim()) {
          const voiceText = `${resp}`;
          const justification = this.getSectionForm().at(sectionIndex).get('comment').value;
          this.getSectionForm()
            .at(sectionIndex)
            .get('comment')
            .setValue(justification ? justification + ' ' + voiceText : voiceText);
        }
      });
  }

  openEditComment(data, sectionIndex, subSectionIndex) {
    this.dialog
      .open(CkeditorInputDialogComponent, {
        width: '995px',
        minHeight: '300px',
        disableClose: true,
        data: data,
      })
      .afterClosed()
      .subscribe((resp) => {

        if(resp) {
          this.getSubSectionForm(sectionIndex)
            .at(subSectionIndex)
            .get('comments')
            .setValue(resp);
        }
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
        (correctionData.show_number_marks_column || correctionData.show_letter_marks_column || correctionData.show_phrase_marks_column) &&
        correctionData.comment_for_each_sub_section
      ) {
        // column section, direction, mark, and comment displayed
        this.sectionWidth = 25;
        this.refWidth = 10;
        this.directiveWidth = 30;
        this.evaluationCheckboxWidth = 4;
        this.markLetterWidth = 7;
        this.markPharseWidth = 7;
        this.markScoreWidth = 7;
        this.commentWidth = 26;
      } else if (
        correctionData.sections_evalskill.length &&
        correctionData.show_direction_column &&
        (correctionData.show_number_marks_column || correctionData.show_letter_marks_column || correctionData.show_phrase_marks_column) &&
        !correctionData.comment_for_each_sub_section
      ) {
        // column section, direction, and mark displayed
        this.sectionWidth = 35;
        this.refWidth = 10;
        this.evaluationCheckboxWidth = 4;
        this.directiveWidth = 41;
        this.markLetterWidth = 7;
        this.markPharseWidth = 7;
        this.markScoreWidth = 7;
      } else if (
        correctionData.sections_evalskill.length &&
        !correctionData.show_direction_column &&
        (correctionData.show_number_marks_column || correctionData.show_letter_marks_column || correctionData.show_phrase_marks_column) &&
        !correctionData.comment_for_each_sub_section
      ) {
        // column section and mark displayed
        this.sectionWidth = 46;
        this.refWidth = 10;
        this.evaluationCheckboxWidth = 4;
        this.markLetterWidth = 5;
        this.markPharseWidth = 5;
        this.markScoreWidth = 5;
      } else if (
        correctionData.sections_evalskill.length &&
        !correctionData.show_direction_column &&
        (correctionData.show_number_marks_column || correctionData.show_letter_marks_column || correctionData.show_phrase_marks_column) &&
        correctionData.comment_for_each_sub_section
      ) {
        // column section, mark, and comment displayed
        this.sectionWidth = 40;
        this.refWidth = 10;
        this.evaluationCheckboxWidth = 4;
        this.markLetterWidth = 7;
        this.markPharseWidth = 7;
        this.markScoreWidth = 7;
        this.commentWidth = 36;
      }
    }
  }

  checkRequiredComments(sectionIndex, subSectionIndex) {
    let isRequired = false;
    const isMissingCopy = this.testCorrectionForm.get('missing_copy').value;
    const isSelected = this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('is_selected').value;
    const isEvaluated = this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('is_criteria_evaluated').value;
    if (isSelected && !isMissingCopy && isEvaluated) {
      isRequired = true;
    }
    return isRequired;
  }

  checkIsMissingCopy() {
    return this.testCorrectionForm.get('missing_copy').value;
  }
}
