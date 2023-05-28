import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormGroup } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { SpeechToTextDialogComponent } from 'app/shared/components/speech-to-text-dialog/speech-to-text-dialog.component';
import { Correction, TestCreationRespData } from 'app/test/test-creation/test-creation.model';
import { SubSink } from 'subsink';
import { NgxPermissionsService } from 'ngx-permissions';
import { UtilityService } from 'app/service/utility/utility.service';
import { ActivatedRoute } from '@angular/router';
@Component({
  selector: 'ms-academic-recommendation-form',
  templateUrl: './academic-recommendation-form.component.html',
  styleUrls: ['./academic-recommendation-form.component.scss'],
})
export class AcademicRecommendationFormComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @ViewChild('autosize', { static: false }) autosize: CdkTextareaAutosize;
  @Input() testCorrectionForm: UntypedFormGroup;
  @Input() testData: any;

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
  myInnerHeight = 960;
  myInnerWidth = 730;
  sectionWidth: any;
  directiveWidth: any;
  commentWidth: any;
  isCertifierAdmin = false;
  isAcadir = false;
  schoolId = null;
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
  ) {}

  ngOnInit() {
    this.isCertifierAdmin = this.utilService.isUserCRDirAdmin();
    if (!!this.permissions.getPermission('Academic Director') || !!this.permissions.getPermission('Academic Admin')) {
      this.isAcadir = true;
    }
    this.subs.sink = this.route.queryParamMap.subscribe((queryParams) => {
      this.schoolId = queryParams.get('school');
    });
    if (this.testData && this.testData.type === 'academic_recommendation') {
      this.config2['placeholder'] = '';
    }
    this.addTableColumn();
    this.getColumnSectionWidth();
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
  // *************** To Get Width Comment Column and put in style css height
  getAutomaticWidth() {
    this.myInnerWidth = window.innerWidth - 642;
    return this.myInnerWidth;
  }

  addTableColumn() {
    if (this.testData && this.testData.correction_grid && this.testData.correction_grid.correction) {
      this.correctionData = this.testData.correction_grid.correction;
      if (this.correctionData.sections.length) {
        this.displayedColumns.push('section');
      }
      if (this.correctionData.show_direction_column) {
        this.displayedColumns.push('directives');
      }
      if (this.correctionData.comment_for_each_sub_section) {
        this.displayedColumns.push('comment');
      }
    }
  }

  getCorrectionForm() {
    return this.testCorrectionForm.get('correction_grid').get('correction') as UntypedFormGroup;
  }

  getSectionForm() {
    return this.getCorrectionForm().get('sections') as UntypedFormArray;
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

  openSectionVoiceRecog(sectionIndex) {
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

  // *************** To Get Width Section Column and put in style css width
  getColumnSectionWidth() {
    if (this.testData && this.testData.correction_grid && this.testData.correction_grid.correction) {
      const correctionData = this.testData.correction_grid.correction;
      if (correctionData.sections.length && correctionData.show_direction_column && correctionData.comment_for_each_sub_section) {
        this.sectionWidth = 30;
        this.directiveWidth = 35;
        this.commentWidth = 30;
      } else if (correctionData.sections.length && correctionData.show_direction_column && !correctionData.comment_for_each_sub_section) {
        this.sectionWidth = 50;
        this.directiveWidth = 50;
      } else if (correctionData.sections.length && !correctionData.show_direction_column && correctionData.comment_for_each_sub_section) {
        this.sectionWidth = 50;
        this.commentWidth = 50;
      } else if (correctionData.sections.length && !correctionData.show_direction_column && !correctionData.comment_for_each_sub_section) {
        this.sectionWidth = 100;
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
}
