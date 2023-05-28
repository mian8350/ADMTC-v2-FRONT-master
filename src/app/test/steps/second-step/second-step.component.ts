import { Component, OnInit, OnDestroy, AfterViewChecked, ChangeDetectorRef } from '@angular/core';
import { TestService } from '../../../service/test/test.service';
import { MatCheckboxChange } from '@angular/material/checkbox';
import { DateAdapter } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { MatTableDataSource } from '@angular/material/table';
import { Router, ActivatedRoute } from '@angular/router';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { UntypedFormArray, UntypedFormBuilder, UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { CkeditorInputDialogComponent } from 'app/shared/components/ckeditor-input-dialog/ckeditor-input-dialog.component';
import { TestCreationService } from 'app/service/test/test-creation.service';
import { TestCreationPayloadData, HeaderFooterFieldType, DuplicateDialogData } from 'app/test/test-creation/test-creation.model';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import * as _ from 'lodash';
import { GlobalErrorService } from 'app/service/global-error-service/global-error-service.service';
import { debounceTime } from 'rxjs/operators';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { DuplicateTestDialogComponent } from '../first-step/duplicate-test-dialog/duplicate-test-dialog.component';
import { ConditionsService } from 'app/service/conditions/conditions.service';

@Component({
  selector: 'ms-second-step',
  templateUrl: './second-step.component.html',
  styleUrls: ['./second-step.component.scss'],
})
export class SecondStepComponent implements OnInit, OnDestroy, AfterViewChecked {
  private subs = new SubSink();

  formData: TestCreationPayloadData; // hold the form data from step 1 to step 5
  secondStepForm: UntypedFormGroup;
  testProgress;
  blockType: string;
  testId = '';
  titleId = '';
  categoryId = '';

  isTestAutoProEval = false;
  blockList = [];

  // score conversion table
  scoreConversionColumns: string[] = ['score', 'phrase', 'letters', 'action'];
  scoreConversionDataSource = [];

  // dropdown and utility variables
  headerFooterFieldTypes: HeaderFooterFieldType[] = [];
  decimalPlacesValues = [0, 1, 2];
  showOptions = false;
  isWaitingForResponse = false;
  isOnInit = true;
  isSectionForm: any;
  alignments = [
    { value: 'left', label: 'LEFT' },
    { value: 'right', label: 'RIGHT' },
  ];

  // ckeditor config
  public Editor = DecoupledEditor;
  private timeOutVal: any;
  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  constructor(
    private testService: TestService,
    private fb: UntypedFormBuilder,
    private router: Router,
    private dialog: MatDialog,
    private translate: TranslateService,
    public testCreationService: TestCreationService,
    private route: ActivatedRoute,
    private globalErrorService: GlobalErrorService,
    private cdr: ChangeDetectorRef,
    private conditionService: ConditionsService,
    private dateAdapter: DateAdapter<Date>,
  ) {}

  ngOnInit() {
    this.headerFooterFieldTypes = this.testCreationService.getHeaderFooterFieldTypes();
    this.setHeaderTranslation();

    // Caught error from global error handler
    this.subs.sink = this.globalErrorService.globalErrorData$.subscribe((isError) => {
      if (isError) {
        this.isWaitingForResponse = false;
        this.globalErrorService.setGlobalError(false);
      }
    });

    this.subs.sink = this.route.parent.paramMap.subscribe((params) => {
      this.titleId = params.get('titleId');
      this.categoryId = params.get('categoryId');
      this.testId = params.get('testId');
      this.getTestCreationData();
    });
  }

  setHeaderTranslation() {
    this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
      if (['Establishment', 'Etablissement'].includes(this.headerFieldForm.at(0).value.value)) {
        this.headerFieldForm.at(0).patchValue({
          value: this.translate.instant('Establishment'),
        });
      }

      if (['Name', 'Nom'].includes(this.headerFieldForm.at(1).value.value)) {
        this.headerFieldForm.at(1).patchValue({
          value: this.formData.group_test ? this.translate.instant('Nom du Groupe') : this.translate.instant('Nom'),
        });
      }

      if (['Company', 'Entreprise'].includes(this.headerFieldForm.at(1).value.value)) {
        this.headerFieldForm.at(1).patchValue({
          value: this.translate.instant('Company'),
        });
      }

      if (['Name', 'Nom'].includes(this.headerFieldForm.at(2).value.value)) {
        this.headerFieldForm.at(2).patchValue({
          value: this.formData.group_test ? this.translate.instant('Nom du Groupe') : this.translate.instant('Nom'),
        });
      }

      if (['Mentor', 'Tuteur'].includes(this.headerFieldForm.at(3).value.value)) {
        this.headerFieldForm.at(3).patchValue({
          value: this.translate.instant('Mentor'),
        });
      }
    });
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    clearTimeout(this.timeOutVal);
    this.testCreationService.removePreviousButton();
    this.testCreationService.removeContinueButton();
    this.subs.unsubscribe();
  }

  initSecondStepFormData() {
    this.secondStepForm = this.fb.group({
      correction_grid: this.fb.group({
        orientation: [''], // toggle if true, this value will be "landscape"
        // header tab
        header: this.fb.group({
          text: [''],
          fields: this.fb.array([]),
          directive_long: [''],
        }),
        group_detail: this.fb.group({
          header_text: [''],
          no_of_student: [null],
        }),
        // notation tab
        correction: this.fb.group({
          show_as_list: [false], // toggle if true = view 2. false = view 1
          show_notation_marks: [false],
          show_direction_column: [false],
          directions_column_header: ['', [removeSpaces]],
          show_number_marks_column: [false],
          number_marks_column_header: ['', [removeSpaces]],
          show_letter_marks_column: [false],
          letter_marks_column_header: ['', [removeSpaces]],
          show_phrase_marks_column: [false],
          phrase_marks_column_header: ['', [removeSpaces]],
          comment_area: [false],
          comments_header: ['', [removeSpaces]],
          comment_for_each_section: [false],
          comment_for_each_section_header: ['', [removeSpaces]],
          comment_for_each_sub_section: [false],
          comment_for_each_sub_section_header: ['', [removeSpaces]],
          show_final_comment: [false],
          final_comment_header: ['', [removeSpaces]],
          display_final_total: [true],
          total_zone: this.fb.group({
            display_additional_total: [true],
            additional_max_score: [20],
            decimal_place: [2],
          }),
          show_penalty: [false],
          penalty_header: ['', [removeSpaces]],
          show_bonus: [false],
          bonus_header: ['', [removeSpaces]],
          show_elimination: [false],
          sections: this.fb.array([]),
          sections_evalskill: this.fb.array([]),
          // penalties and bonuses tab will appear beside notation tab if show_penalty or show_bonus true
          penalties: this.fb.array([]),
          bonuses: this.fb.array([]),
        }),
        // footer tab
        footer: this.fb.group({
          text: [''],
          text_below: [false],
          fields: this.fb.array([]),
        }),
      }),
    });
  }

  getTestCreationData() {
    // tiggered when API request finish
    this.subs.sink = this.testCreationService.isTestCreationLoaded$.subscribe((isLoaded) => {
      // populate form data after GetOneTest request finish
      if (isLoaded) {
        this.initSecondStepFormData();
        this.formData = _.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe());
        this.blockType = this.formData.block_type;
        this.getAllBlockEvalByCompetenceData();
        this.populateForm();
        this.updateTestCreationData();
        // this.dynamicOptionValidation();


        if (this.formData.is_published) {
          // Get Test Progress
          this.subs.sink = this.testCreationService.testProgressData$.subscribe((testProgress) => {
            this.testProgress = testProgress;
            if (this.testProgress && this.testProgress.is_mark_entry_done) {
              this.secondStepForm.disable();


              this.secondStepForm.get('correction_grid').get('header').enable();
            }
          });
        }

        // *************** If test date is multiple dates and has more than 2, then make slider to be landscape
        if (
          this.formData &&
          this.formData.date_type === 'multiple_date' &&
          this.formData.multiple_dates &&
          this.formData.multiple_dates.length > 2
        ) {
          const event = {
            checked: true,
            source: null,
          };
          this.toggleOrientation(event);
        }
      }
    });

    // triggered when click previous button in top left corner
    this.subs.sink = this.testCreationService.updateTestPreviousData$.subscribe((data) => {

      if (data === 'second') {
        this.goToStep('first');
      }
    });
    // triggered when click continue button in top right corner
    this.subs.sink = this.testCreationService.updateTestContinueData$.subscribe((data) => {
      if (data === 'second') {
        // this.saveTest(true);
        this.goToStep('third');
      }
    });

    if (this.formData.type === 'academic_recommendation') {
      this.secondStepForm.patchValue({
        correction_grid: {
          correction: {
            comment_for_each_sub_section: true,
            comment_for_each_sub_section_header: 'Opinion Pédagogique',
            show_number_marks_column: false,
            show_letter_marks_column: false,
            show_phrase_marks_column: false,
            display_final_total: false,
            total_zone: {
              display_additional_total: false,
            },
            show_penalty: false,
            show_bonus: false,
            show_elimination: false,
          },
        },
      });
    }


  }

  goToStep(selectedStep: string, duplicateTestId?: string, ishardRefresh?: boolean) {
    this.subs.sink = this.route.parent.paramMap.subscribe((params) => {
      const titleId = params.get('titleId');
      const categoryId = params.get('categoryId');
      const testId = params.get('testId');
      if (ishardRefresh && duplicateTestId) {
        this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
          this.router.navigate(['/create-test', titleId, { categoryId: categoryId, testId: testId }, selectedStep], {
            queryParams: duplicateTestId ? { duplicate: duplicateTestId } : null,
          });
        });
      } else {
        this.router.navigate(['/create-test', titleId, { categoryId: categoryId, testId: testId }, selectedStep], {
          queryParams: duplicateTestId ? { duplicate: duplicateTestId } : null,
        });
      }
    });
  }

  getAllBlockEvalByCompetenceData() {
    const autoprotype = ['academic_auto_evaluation', 'academic_pro_evaluation', 'soft_skill_auto_evaluation', 'soft_skill_pro_evaluation', 'preparation_center_eval_soft_skill'];
    if (this.formData.type && autoprotype.includes(this.formData.type.toLowerCase())) {
      this.isTestAutoProEval = true;
    }
    if (this.isTestAutoProEval) {
      // get all block data if test is auto/pro eval so we can group each section to their block
      if (this.formData.block_type === 'competence') {
        this.subs.sink = this.conditionService
          .getBlockAcademicTemplateAutoProEval(this.titleId, this.formData.class_id)
          .subscribe((resp) => {
            this.blockList = _.cloneDeep(resp);

          });
      } else if (this.formData.block_type === 'soft_skill') {
        this.subs.sink = this.conditionService
          .getBlockSoftSkillTemplateAutoProEval(this.titleId, this.formData.class_id)
          .subscribe((resp) => {
            this.blockList = _.cloneDeep(resp);

          });
      }
    }
  }

  populateForm() {

    if (this.formData.correction_grid) {
      // add form arrays
      this.formData.correction_grid.header.fields.forEach((field) => this.addHeaderFieldForm());
      this.formData.correction_grid.footer.fields.forEach((field) => this.addFooterFieldForm());
      this.formData.correction_grid.correction.penalties.forEach((field) => this.addPenaltyFieldForm());
      this.formData.correction_grid.correction.bonuses.forEach((field) => this.addBonusFieldForm());
      this.formData.correction_grid.correction.sections.forEach((section, sectionIndex) => {
        this.addSectionForm();
        section.sub_sections.forEach((subsec, subsecIndex) => {
          if (subsecIndex > 0) {
            this.addSubSectionForm(sectionIndex);
          }
        });
        section.score_conversions.forEach((scoreConversion, scoreConversionIndex) => {
          this.addScoreConversionForm(sectionIndex);
          if (this.formData.type === 'academic_recommendation') {
            this.getScoreConversionForm(sectionIndex).controls.forEach((elem) => {
              elem.get('score').clearValidators();
              elem.get('score').updateValueAndValidity();
              elem.get('phrase').clearValidators();
              elem.get('phrase').updateValueAndValidity();
              elem.get('letter').clearValidators();
              elem.get('letter').updateValueAndValidity();
            });
          }
        });
      });
      this.formData.correction_grid.correction.sections_evalskill.forEach((section, sectionIndex) => {
        this.addSectionEvalskillForm();
        section.score_conversions.forEach((scoreConv, scoreConvIdx) => {
          this.addSectionEvalskillScoreConversionForm(sectionIndex);
        });
        section.sub_sections.forEach((subsec, subsecIndex) => {
          this.addSubSectionEvalskillForm(sectionIndex);
        });
      });
      // populate whole form
      this.secondStepForm.get('correction_grid').patchValue(this.formData.correction_grid);
    }
    if (!this.formData.correction_grid.header.fields.length) {
      this.addInitialHeaderFields();
    }
    if (!this.formData.correction_grid.correction.sections.length && this.blockType !== 'competence' && this.blockType !== 'soft_skill') {
      this.addSectionForm();
    }


  }

  updateTestCreationData() {
    // update the test creation form data everytime there is change in step 2 form fields
    this.subs.sink = this.secondStepForm.valueChanges.pipe(debounceTime(200)).subscribe((changes) => {
      const payload = this.secondStepForm.getRawValue();

      // reset the formarray data before merging
      this.formData.correction_grid.header = null;
      this.formData.correction_grid.footer = null;
      this.formData.correction_grid.correction.sections = null;
      this.formData.correction_grid.correction.penalties = null;
      this.formData.correction_grid.correction.bonuses = null;

      this.testCreationService.setTestCreationData(_.merge(_.cloneDeep(this.formData), payload));

      if (this.isOnInit) {
        this.testCreationService.setSavedTestCreationData(_.merge(_.cloneDeep(this.formData), payload));
      }
      this.isOnInit = false;
    });
    // trigger valueChanges manually so the data will show up in test sheet
    this.secondStepForm.updateValueAndValidity({ emitEvent: true });
  }

  dynamicOptionValidation() {


    this.subs.sink = this.correctionForm
      .get('show_direction_column')
      .valueChanges.pipe(debounceTime(100))
      .subscribe((data) => {
        if (data) {
          this.correctionForm.get('directions_column_header').setValidators([Validators.required, removeSpaces]);
        } else {
          this.correctionForm.get('directions_column_header').setValidators([removeSpaces]);
        }
        this.correctionForm.get('directions_column_header').updateValueAndValidity();
      });
  }

  get isNotationView2(): boolean {
    return this.secondStepForm.get('correction_grid').get('correction').get('show_as_list').value;
  }

  get correctionForm() {
    return this.secondStepForm.get('correction_grid').get('correction') as UntypedFormGroup;
  }

  addInitialHeaderFields() {
    this.addHeaderFieldForm();
    this.addHeaderFieldForm();

    this.headerFieldForm.at(0).patchValue({
      value: this.translate.instant('Establishment'),
      type: 'etablishmentname',
      data_type: 'text',
      align: 'left',
      // isEditMode: false
      isEditMode: true,
    });
    this.headerFieldForm.at(1).patchValue({
      value: this.formData.group_test ? this.translate.instant('Nom du Groupe') : this.translate.instant('Nom'),
      type: this.formData.group_test ? 'groupname' : 'studentname',
      data_type: 'text',
      align: 'left',
      // isEditMode: false
      isEditMode: true,
    });

    // ********************* add mentor and company header on the right (AV-3964) *********************
    if (this.formData.type === 'academic_pro_evaluation' || this.formData.type === 'soft_skill_pro_evaluation') {
      this.addHeaderFieldForm();
      this.addHeaderFieldForm();
      this.headerFieldForm.at(1).patchValue({
        value: this.translate.instant('Company'),
        type: 'companyname',
        data_type: 'text',
        align: 'right',
        isEditMode: true,
      });
      this.headerFieldForm.at(2).patchValue({
        value: this.formData.group_test ? this.translate.instant('Nom du Groupe') : this.translate.instant('Nom'),
        type: this.formData.group_test ? 'groupname' : 'studentname',
        data_type: 'text',
        align: 'left',
        isEditMode: true,
      });
      this.headerFieldForm.at(3).patchValue({
        value: this.translate.instant('Mentor'),
        type: 'mentorname',
        data_type: 'text',
        align: 'right',
        isEditMode: true,
      });
    }
  }

  addHeaderText() {
    const headerText = this.secondStepForm.get('correction_grid').get('header').get('text').value;
    this.subs.sink = this.dialog
      .open(CkeditorInputDialogComponent, {
        disableClose: true,
        width: '1000px',
        data: headerText,
      })
      .afterClosed()
      .subscribe((val) => {
        if (val !== false) {
          this.secondStepForm.get('correction_grid').get('header').get('text').setValue(val);
        }
      });
  }

  addFooterText() {
    const footerText = this.secondStepForm.get('correction_grid').get('footer').get('text').value;
    this.subs.sink = this.dialog
      .open(CkeditorInputDialogComponent, {
        disableClose: true,
        width: '1000px',
        data: footerText,
      })
      .afterClosed()
      .subscribe((val) => {
        if (val !== false) {
          this.secondStepForm.get('correction_grid').get('footer').get('text').setValue(val);
        }
      });
  }

  isHeaderAlreadyExist(headerType: string, index: number): boolean {
    let isExist = false;
    for (const field of this.headerFieldForm.value) {
      if (field.type === headerType && this.headerFieldForm.at(index).get('type').value !== headerType) {
        isExist = true;
        break;
      }
    }
    // hide groupname option if test is not group test
    if (!this.formData.group_test && headerType === 'groupname') {
      isExist = true;
    } else if (this.formData.group_test && headerType === 'studentname') {
      // hide studentname option if test is group test
      isExist = true;
    }
    return isExist;
  }

  isFooterAlreadyExist(footerType: string, index: number): boolean {
    let isExist = false;
    for (const field of this.footerFieldForm.value) {
      if (field.type === footerType && this.footerFieldForm.at(index).get('type').value !== footerType) {
        isExist = true;
        break;
      }
    }
    // hide groupname option if test is not group test
    if (!this.formData.group_test && footerType === 'groupname') {
      isExist = true;
    } else if (this.formData.group_test && footerType === 'studentname') {
      // hide studentname option if test is group test
      isExist = true;
    }
    return isExist;
  }

  setHeaderDataType(index: number, headerField) {
    this.headerFieldForm.at(index).get('data_type').setValue(headerField.data_type);
  }

  setFooterDataType(index: number, footerField) {
    this.footerFieldForm.at(index).get('data_type').setValue(footerField.data_type);
  }

  initHeaderFooterFieldForm() {
    return this.fb.group({
      value: ['', [Validators.required, removeSpaces]],
      type: ['', Validators.required],
      data_type: [''],
      align: ['', Validators.required],
      isEditMode: [true],
    });
  }

  toggleHeaderEditMode(index: number, isEdit: boolean) {
    this.headerFieldForm.at(index).get('isEditMode').setValue(isEdit);
  }

  toggleFooterEditMode(index: number, isEdit: boolean) {
    this.footerFieldForm.at(index).get('isEditMode').setValue(isEdit);
  }

  get headerFieldForm() {
    return this.secondStepForm.get('correction_grid').get('header').get('fields') as UntypedFormArray;
  }

  addHeaderFieldForm() {
    this.headerFieldForm.push(this.initHeaderFooterFieldForm());
  }

  removeHeaderFieldForm(index: number) {
    const emptyHeader = JSON.stringify(this.initHeaderFooterFieldForm().value);
    const selectedHeader = JSON.stringify(this.headerFieldForm.at(index).value);

    if (emptyHeader === selectedHeader) {
      this.headerFieldForm.removeAt(index);
      Swal.fire({
        type: 'success',
        title: this.translate.instant('EVENT_S1.TITLE'),
        html: this.translate.instant('Header field deleted'),
        confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
      });
    } else {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('this action will delete Header field !'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.headerFieldForm.removeAt(index);
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('Header field deleted'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        }
      });
    }
  }

  get footerFieldForm() {
    return this.secondStepForm.get('correction_grid').get('footer').get('fields') as UntypedFormArray;
  }

  addFooterFieldForm() {
    this.footerFieldForm.push(this.initHeaderFooterFieldForm());
  }

  removeFooterFieldForm(index: number) {
    const emptyFooter = JSON.stringify(this.initHeaderFooterFieldForm().value);
    const selectedFooter = JSON.stringify(this.footerFieldForm.at(index).value);

    if (emptyFooter === selectedFooter) {
      this.footerFieldForm.removeAt(index);
      Swal.fire({
        type: 'success',
        title: this.translate.instant('EVENT_S1.TITLE'),
        html: this.translate.instant('Bonus field deleted'),
        confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
      });
    } else {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('this action will delete Bonus field !'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.footerFieldForm.removeAt(index);
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('Bonus field deleted'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        }
      });
    }
  }

  initSectionForm() {
    return this.fb.group({
      title: ['', Validators.required],
      maximum_rating: [10],
      page_break: [false],
      score_conversions: this.fb.array([]),
      sub_sections: this.fb.array([this.initSubSectionForm()]),
    });
  }

  get sectionForm() {
    return this.secondStepForm.get('correction_grid').get('correction').get('sections') as UntypedFormArray;
  }

  addSectionForm(addScoreConversion?: boolean) {
    this.sectionForm.push(this.initSectionForm());
    this.scoreConversionDataSource.push(new MatTableDataSource([]));
    this.updateScoreConversionTable(this.sectionForm.length - 1);
    if (addScoreConversion) {
      this.addScoreConversionForm(this.sectionForm.length - 1);
      if (this.formData.type === 'academic_recommendation') {
        this.getScoreConversionForm(this.sectionForm.length - 1).controls.forEach((elem) => {
          elem.get('score').clearValidators();
          elem.get('score').updateValueAndValidity();
          elem.get('phrase').clearValidators();
          elem.get('phrase').updateValueAndValidity();
          elem.get('letter').clearValidators();
          elem.get('letter').updateValueAndValidity();
        });
      }
    }
  }

  addSectionTitle(sectionTitleControl: UntypedFormControl) {
    this.subs.sink = this.dialog
      .open(CkeditorInputDialogComponent, {
        disableClose: true,
        width: '1000px',
        data: sectionTitleControl.value,
      })
      .afterClosed()
      .subscribe((val) => {
        if (val !== false) {
          sectionTitleControl.setValue(val);
        }
      });
  }

  toggleSectionPageBreak(index: number, status: boolean) {
    this.testService.triggerResetTestDocumentPage(true);
    this.sectionForm.at(index).get('page_break').setValue(status);
  }

  toggleSectionEvalskillPageBreak(index: number, status: boolean) {
    this.testService.triggerResetTestDocumentPage(true);
    this.getSectionEvalskill().at(index).get('page_break').setValue(status);


    const payload = this.secondStepForm.getRawValue();


    // reset the formarray data before merging
    // this.formData.correction_grid.header = null;
    // this.formData.correction_grid.footer = null;
    // this.formData.correction_grid.correction.sections = null;
    // this.formData.correction_grid.correction.penalties = null;
    // this.formData.correction_grid.correction.bonuses = null;



    // this.testCreationService.setTestCreationData(_.merge(_.cloneDeep(this.formData), payload));
    // this.updateTestCreationData();





  }

  removeSectionForm(index: number) {
    this.sectionForm.removeAt(index);
  }

  toggleNumberMark(event: MatCheckboxChange) {
    if (event.checked) {
      // if number mark checked, then turn off letter mark and phrase mark
      this.correctionForm.get('show_letter_marks_column').setValue(false);
      this.correctionForm.get('show_phrase_marks_column').setValue(false);
    } else {
      // if number mark toggled off, then toggle on the letter mark
      this.correctionForm.get('show_letter_marks_column').setValue(true);
    }
    this.resetScoreConversionForm('number');
  }

  toggleLetterMark(event: MatCheckboxChange) {
    if (event.checked) {
      this.correctionForm.get('show_number_marks_column').setValue(false);
      this.correctionForm.get('show_phrase_marks_column').setValue(false);
    } else {
      // if letter or phrase mark toggled off, then toggle on the number mark
      this.correctionForm.get('show_number_marks_column').setValue(true);
    }
    this.resetScoreConversionForm('letter');
  }

  togglePhraseMark(event: MatCheckboxChange) {
    if (event.checked) {
      this.correctionForm.get('show_number_marks_column').setValue(false);
      this.correctionForm.get('show_letter_marks_column').setValue(false);
    } else {
      // if letter or phrase mark toggled off, then toggle on the number mark
      this.correctionForm.get('show_number_marks_column').setValue(true);
    }
    this.resetScoreConversionForm('phrase');
  }

  changeToggleScore(sectionIndex, who) {
    const emptyScore = JSON.stringify(this.initScoreConversionForm().value);
    const dataScore = this.getScoreConversionForm(sectionIndex).value;
    const tempScore = JSON.stringify(dataScore[0]);


    if (emptyScore !== tempScore) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('NOTATION_S1.TITLE'),
        html: this.translate.instant('NOTATION_S1.TEXT'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('NOTATION_S1.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('NOTATION_S1.CANCEL'),
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('NOTATION_S1.CONFIRM') + ` (${timeDisabled})`;
          }, 1000);
          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('NOTATION_S1.CONFIRM');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.getScoreConversionForm(sectionIndex).clear();
          this.updateScoreConversionTable(sectionIndex);
        } else {
          if (who === 'phrase') {
            this.correctionForm.get('show_number_marks_column').setValue(false);
            this.correctionForm.get('show_letter_marks_column').setValue(false);
            this.correctionForm.get('show_phrase_marks_column').setValue(true);
          } else if (who === 'letter') {
            this.correctionForm.get('show_number_marks_column').setValue(false);
            this.correctionForm.get('show_letter_marks_column').setValue(true);
            this.correctionForm.get('show_phrase_marks_column').setValue(false);
          }
        }
      });
    } else {
      this.getScoreConversionForm(sectionIndex).clear();
      this.updateScoreConversionTable(sectionIndex);
    }
  }

  initScoreConversionForm() {
    return this.fb.group({
      _id: [null],
      score: [null, Validators.required],
      phrase: ['', [Validators.required, removeSpaces]],
      letter: ['', [Validators.required, removeSpaces]],
    });
  }

  getScoreConversionForm(sectionIndex: number): UntypedFormArray {
    return this.sectionForm.at(sectionIndex).get('score_conversions') as UntypedFormArray;
  }

  addScoreConversionForm(sectionIndex: number) {
    this.getScoreConversionForm(sectionIndex).push(this.initScoreConversionForm());
    this.updateScoreConversionTable(sectionIndex);
  }

  removeScoreConversionForm(sectionIndex: number, scoreConversionIndex: number) {
    this.getScoreConversionForm(sectionIndex).removeAt(scoreConversionIndex);
    this.updateScoreConversionTable(sectionIndex);
  }

  resetScoreConversionForm(who) {
    this.sectionForm.controls.forEach((section, sectionIndex) => {
      if (this.correctionForm.get('show_number_marks_column').value) {
        // reset score conversion form array if user check number mark
        this.changeToggleScore(sectionIndex, who);
      } else if (!this.getScoreConversionForm(sectionIndex).length) {
        // if there is no score conversion yet, add one data
        this.addScoreConversionForm(sectionIndex);
      }
    });
  }

  updateScoreConversionTable(sectionIndex: number) {
    this.scoreConversionDataSource[sectionIndex].data = this.getScoreConversionForm(sectionIndex).controls;
  }

  validateScore(sectionIndex: number, scoreConversionIndex: number, maxScore: number) {
    const score = this.getScoreConversionForm(sectionIndex).at(scoreConversionIndex).get('score').value;
    const max = maxScore ? maxScore : 0;
    if (!score) {
      this.getScoreConversionForm(sectionIndex).at(scoreConversionIndex).get('score').setValue(null);
    } else if (score < 0) {
      this.getScoreConversionForm(sectionIndex).at(scoreConversionIndex).get('score').setValue(0);
    } else if (score > maxScore) {
      this.getScoreConversionForm(sectionIndex).at(scoreConversionIndex).get('score').setValue(maxScore);
    }
  }

  removeScoreConversion(sectionIndex: number, scoreConversionIndex: number) {
    const scoreConversion = this.getScoreConversionForm(sectionIndex).at(scoreConversionIndex).value;
    if (scoreConversion.score || scoreConversion.phrase || scoreConversion.letter) {
      // if there are data in the row, then show swal
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('ARE_YOU_SURE'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('No'),
        confirmButtonText: this.translate.instant('Yes'),
      }).then((result) => {
        if (result.value) {
          this.removeScoreConversionForm(sectionIndex, scoreConversionIndex);
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
          });
        }
      });
    } else {
      this.removeScoreConversionForm(sectionIndex, scoreConversionIndex);
    }
  }

  isSomeSubsectionSelected(sectionIndex: number) {
    // when some subsection checked, some not, the section checkbox icon should be indeterminate
    let isUncheckedExist = false;
    let isCheckedExist = false;
    this.getSubSectionEvalskillForm(sectionIndex).controls.forEach((subsection) => {
      if (!subsection.get('is_selected').value) {
        isUncheckedExist = true;
      }
      if (subsection.get('is_selected').value) {
        isCheckedExist = true;
      }
    });
    return isUncheckedExist && isCheckedExist;
  }

  toggleSectionEvalskill(event: MatCheckboxChange, sectionIndex: number) {
    // if section checked, then check all of the sub section and vice versa
    this.getSubSectionEvalskillForm(sectionIndex).controls.forEach((subsection) => {
      subsection.get('is_selected').setValue(event.checked);
    });
  }

  toggleSubSectionEvalskill(event: MatCheckboxChange, sectionIndex: number, subSectionIndex: number) {
    if (event.checked) {
      // if one of the subsection is checked, then check the section too
      this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('is_selected').setValue(true);
      this.getSectionEvalskill().at(sectionIndex).get('is_selected').setValue(true);
    } else {
      // if all subsection is unchecked, then uncheck the section too
      let isAnySubsectionChecked = false;
      this.getSubSectionEvalskillForm(sectionIndex).at(subSectionIndex).get('is_selected').setValue(false);
      this.getSubSectionEvalskillForm(sectionIndex).controls.forEach((subsection) => {
        if (subsection.get('is_selected').value) {
          isAnySubsectionChecked = true;
        }
      });
      if (!isAnySubsectionChecked) {
        this.getSectionEvalskill().at(sectionIndex).get('is_selected').setValue(false);
      }
    }
  }

  getSectionEvalskill() {
    return this.correctionForm.get('sections_evalskill') as UntypedFormArray;
  }

  initSectionEvalskillForm() {
    return this.fb.group({
      ref_id: [''],
      is_selected: [false],
      title: ['', Validators.required],
      page_break: [false],
      academic_skill_competence_template_id: [null],
      soft_skill_competence_template_id: [null],
      academic_skill_block_template_id: [null],
      soft_skill_block_template_id: [null],
      score_conversions: this.fb.array([]),
      sub_sections: this.fb.array([]),
    });
  }

  addSectionEvalskillForm() {
    this.getSectionEvalskill().push(this.initSectionEvalskillForm());
  }

  getSectionEvalskillScoreConversionForm(sectionIndex: number) {
    return this.getSectionEvalskill().at(sectionIndex).get('score_conversions') as UntypedFormArray;
  }

  initSectionEvalskillScoreConversionForm() {
    return this.fb.group({
      _id: [null],
      score: [null],
      phrase: [''],
      letter: [''],
      academic_skill_score_conversion_id: [null],
      soft_skill_score_conversion_id: [null],
    });
  }

  addSectionEvalskillScoreConversionForm(sectionIndex: number) {
    this.getSectionEvalskillScoreConversionForm(sectionIndex).push(this.initSectionEvalskillScoreConversionForm());
  }

  getSubSectionEvalskillForm(sectionIndex: number) {
    return this.getSectionEvalskill().at(sectionIndex).get('sub_sections') as UntypedFormArray;
  }

  initSubSectionEvalskillForm() {
    return this.fb.group({
      ref_id: [''],
      is_selected: [false],
      title: ['', Validators.required],
      direction: [''],
      maximum_rating: [null],
      academic_skill_criteria_of_evaluation_competence_id: [null],
      soft_skill_criteria_of_evaluation_competence_id: [null],
      academic_skill_competence_template_id: [null],
      soft_skill_competence_template_id: [null],
    });
  }

  addSubSectionEvalskillForm(sectionIndex: number) {
    this.getSubSectionEvalskillForm(sectionIndex).push(this.initSubSectionEvalskillForm());
  }

  initSubSectionForm() {
    return this.fb.group({
      title: ['', Validators.required],
      maximum_rating: [10],
      direction: [''],
    });
  }

  getSubSectionForm(sectionIndex: number) {
    return this.sectionForm.at(sectionIndex).get('sub_sections') as UntypedFormArray;
  }

  addSubSectionForm(sectionIndex: number) {
    this.getSubSectionForm(sectionIndex).push(this.initSubSectionForm());
  }

  addSubSectionTitle(subSectionTitleControl: UntypedFormControl) {
    this.subs.sink = this.dialog
      .open(CkeditorInputDialogComponent, {
        disableClose: true,
        width: '1000px',
        data: subSectionTitleControl.value,
      })
      .afterClosed()
      .subscribe((val) => {
        if (val !== false) {
          subSectionTitleControl.setValue(val);
        }
      });
  }

  addSubSectionDirection(directionControl: UntypedFormControl) {
    this.subs.sink = this.dialog
      .open(CkeditorInputDialogComponent, {
        disableClose: true,
        width: '1000px',
        data: directionControl.value,
      })
      .afterClosed()
      .subscribe((val) => {
        if (val !== false) {
          directionControl.setValue(val);
        }
      });
  }

  removeSubSectionForm(sectionIndex: number, subSectionIndex: number) {
    this.getSubSectionForm(sectionIndex).removeAt(subSectionIndex);
  }

  initBonusPenaltyFieldForm() {
    return this.fb.group({
      title: ['', Validators.required],
      count: [1, Validators.required],
      isEditMode: [true],
    });
  }

  validatePenaltyBonusNumberInput(field: UntypedFormGroup) {
    if (field.get('count').value < 0) {
      field.get('count').setValue(null);
    }
  }

  get penaltiesFieldForm() {
    return this.secondStepForm.get('correction_grid').get('correction').get('penalties') as UntypedFormArray;
  }

  togglePenalties(event: MatCheckboxChange) {
    if (event.checked) {
      this.addPenaltyFieldForm();
    } else {
      this.penaltiesFieldForm.clear();
    }
  }

  togglePenaltyFieldEditMode(index: number, isEdit: boolean) {
    this.penaltiesFieldForm.at(index).get('isEditMode').setValue(isEdit);
  }

  addPenaltyFieldForm() {
    this.penaltiesFieldForm.push(this.initBonusPenaltyFieldForm());
  }

  removePenaltyFieldForm(index: number) {
    if (!this.penaltiesFieldForm.at(index).get('title').value) {
      this.penaltiesFieldForm.removeAt(index);
      Swal.fire({
        type: 'success',
        title: this.translate.instant('EVENT_S1.TITLE'),
        html: this.translate.instant('penalties field deleted'),
        confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
      });
    } else {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('this action will delete penalties field !'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.penaltiesFieldForm.removeAt(index);
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('penalties field deleted'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        }
      });
    }
  }

  get bonusesFieldForm() {
    return this.secondStepForm.get('correction_grid').get('correction').get('bonuses') as UntypedFormArray;
  }

  toggleBonuses(event: MatCheckboxChange) {
    if (event.checked) {
      this.addBonusFieldForm();
    } else {
      this.bonusesFieldForm.clear();
    }
  }

  toggleBonusFieldEditMode(index: number, isEdit: boolean) {
    this.bonusesFieldForm.at(index).get('isEditMode').setValue(isEdit);
  }

  addBonusFieldForm() {
    this.bonusesFieldForm.push(this.initBonusPenaltyFieldForm());
  }

  removeBonusFieldForm(index: number) {
    if (!this.bonusesFieldForm.at(index).get('title').value) {
      this.bonusesFieldForm.removeAt(index);
      Swal.fire({
        type: 'success',
        title: this.translate.instant('EVENT_S1.TITLE'),
        html: this.translate.instant('Bonus field deleted'),
        confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
      });
    } else {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('this action will delete Bonus field !'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.bonusesFieldForm.removeAt(index);
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('Bonus field deleted'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        }
      });
    }
  }

  toggleOrientation(event: MatSlideToggleChange) {
    this.secondStepForm
      .get('correction_grid')
      .get('orientation')
      .setValue(event.checked ? 'landscape' : 'portrait');
  }

  saveTest() {
    // update test creation form
    const formId = this.formData._id;
    const formData = _.cloneDeep(this.testCreationService.getCleanTestCreationData());
    if (formData.current_tab && formData.current_tab === 'second') {
      formData.current_tab = 'fourth';
    }

    this.isWaitingForResponse = true;
    this.subs.sink = this.testCreationService.updateTest(formId, formData).subscribe((response) => {
      if (response) {
        // get latest test creation data from API
        this.testCreationService.getTestCreationData(formId).subscribe((resp) => {
          this.isWaitingForResponse = false;
          const testData: TestCreationPayloadData = this.testCreationService.getTestCreationDataWithoutSubscribe();
          if (testData.current_tab && testData.current_tab === 'second') {
            testData.current_tab = 'fourth';
          }
          // update id of newly created score conversion so it will not be null
          resp.correction_grid.correction.sections.forEach((section, sectionIndex) => {
            section.score_conversions.forEach((scoreCon, scoreConIndex) => {
              testData.correction_grid.correction.sections[sectionIndex].score_conversions[scoreConIndex]._id = scoreCon._id;
            });
          });
          this.testCreationService.setTestCreationData(testData);
          this.testCreationService.setSavedTestCreationData(this.testCreationService.getTestCreationDataWithoutSubscribe());
          Swal.fire({
            type: 'success',
            title: 'Bravo !',
            text: this.translate.instant('TEST.SAVE_FIRST_TAB.TITLE_CREATE'),
          });
        });
      } else {
        this.isWaitingForResponse = false;
      }
    });
  }

  getTextFromHtml(html: string) {
    const el = document.createElement('div');
    el.innerHTML = html;
    let data = el.textContent || el.innerText || '';
    data = data.replace(/\s+/g, ' ');
    return data.length > 35 ? data.substr(0, 35) + '...' : data;
  }

  getFullTextFromHtml(html: string) {
    const el = document.createElement('div');
    el.innerHTML = html;
    let data = el.textContent || el.innerText || '';
    data = data.replace(/\s+/g, ' ');
    return data;
  }

  getTotalSubSectionScore(index: number): number {
    const section = this.sectionForm.at(index).value;
    let totalSubSectionScore = 0;
    for (const subsection of section.sub_sections) {
      totalSubSectionScore += subsection.maximum_rating;
    }
    return totalSubSectionScore;
  }

  editSectionTotal(index: number) {
    const section = this.sectionForm.at(index).value;
    const totalSubSectionScore = this.getTotalSubSectionScore(index);
    // show error when max_score of section is lower than total score of subsections
    if ((section.maximum_rating < 0 || section.maximum_rating < totalSubSectionScore) && this.formData.type !== 'academic_recommendation') {
      this.sectionForm.at(index).get('maximum_rating').setValue(totalSubSectionScore);
      Swal.fire({
        title: 'Error!',
        text: 'Cannot save section, Max Score exceeded for notations.',
        type: 'warning',
      });
    }
  }

  removeSection(index: number) {
    let isSubSectionExist = false;
    this.getSubSectionForm(index).value.forEach((subsection) => {
      if (subsection.title) {
        isSubSectionExist = true;
      }
    });
    if (isSubSectionExist || this.sectionForm.at(index).get('title').value) {
      // if there are subsections or the title already filled, then show sweet alert with countdown
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('TEST.MESSAGES.CONFIRMREMOVESECTION'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.removeSectionForm(index);
          this.testService.triggerResetTestDocumentPage(true);
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('section deleted'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        }
      });
    } else {
      this.removeSectionForm(index);
      this.testService.triggerResetTestDocumentPage(true);
      Swal.fire({
        type: 'success',
        title: this.translate.instant('EVENT_S1.TITLE'),
        html: this.translate.instant('section deleted'),
        confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
      });
    }
  }

  addSubSection(index: number) {
    const section = this.sectionForm.at(index).value;
    const totalSubSectionScore = this.getTotalSubSectionScore(index);
    // show error when max_score of section is lower or equal than total score of subsections
    if (
      (section.maximum_rating < 0 || section.maximum_rating <= totalSubSectionScore) &&
      this.formData.type !== 'academic_recommendation'
    ) {
      Swal.fire({
        title: 'Error!',
        text: this.translate.instant('TEST.ERRORS.CANNOTADDMORENOTATION'),
        type: 'warning',
      });
    } else {
      // calculate the right maximum_rating for this sub section
      const subSectionIndex = this.getSubSectionForm(index).length;
      const subSectionScore = section.maximum_rating - totalSubSectionScore;
      this.addSubSectionForm(index);
      this.getSubSectionForm(index).at(subSectionIndex).get('maximum_rating').setValue(subSectionScore);
    }
  }

  editNotationTotal(secIndex: number, subSecIndex: number) {
    const section = this.sectionForm.at(secIndex).value;
    const totalSubSectionScore = this.getTotalSubSectionScore(secIndex);
    // calculate the right maximum_rating for this sub section
    let subSectionScore = totalSubSectionScore - this.getSubSectionForm(secIndex).at(subSecIndex).get('maximum_rating').value;
    subSectionScore = section.maximum_rating - subSectionScore;

    // show error when max_score of section is lower than total score of subsections
    if ((section.maximum_rating < 0 || section.maximum_rating < totalSubSectionScore) && this.formData.type !== 'academic_recommendation') {
      this.getSubSectionForm(secIndex).at(subSecIndex).get('maximum_rating').setValue(subSectionScore);
      Swal.fire({
        title: 'Error!',
        text: 'Cannot save notation, Max Score exceeded for notations.',
        type: 'warning',
      });
    }
  }

  removeSubSection(sectionIndex: number, subSectionIndex: number) {
    if (this.getSubSectionForm(sectionIndex).at(subSectionIndex).get('title').value) {
      // if subsection has title, then show sweet alert with countdown
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('TEST.MESSAGES.CONFIRMREMOVESUBSECTION'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('THUMBSUP.SWEET_ALERT.CONFIRM', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('DASHBOARD_DELETE.NO'),
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((res) => {
        clearTimeout(this.timeOutVal);
        if (res.value) {
          this.removeSubSectionForm(sectionIndex, subSectionIndex);
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('subsection deleted'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        }
      });
    } else {
      this.removeSubSectionForm(sectionIndex, subSectionIndex);
      Swal.fire({
        type: 'success',
        title: this.translate.instant('EVENT_S1.TITLE'),
        html: this.translate.instant('subsection deleted'),
        confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
      });
    }
  }

  isDisplayFinalTotal(event: MatCheckboxChange) {
    if (!event.checked) {
      this.correctionForm.get('total_zone').get('display_additional_total').setValue(false);
    }
  }

  updateCheckboxAdditionalTotal(event: MatCheckboxChange) {

    // *************** If there is a changes to turn on or off the checkbox, then make the form to be defaulted to be 20 additional max score and 2 decimal place
    this.correctionForm.get('total_zone').get('additional_max_score').setValue(20);
    this.correctionForm.get('total_zone').get('decimal_place').setValue(2);
  }

  openDuplicateDialog() {
    const formData = _.cloneDeep(this.testCreationService.getTestCreationDataWithoutSubscribe());
    const dialogRef = this.dialog.open(DuplicateTestDialogComponent, {
      minWidth: '400px',
      minHeight: '100px',
      panelClass: 'certification-rule-pop-up',
      disableClose: true,
      data: {
        titleId: this.titleId,
        testId: this.testId,
        // we pass class, block, subject, and evaluation id when duplicate in edit test
        // so the duplicate target will auto populated with current test data
        classId: formData && formData.class_id ? formData.class_id : '',
        subjectId: formData && formData.subject_id ? formData.subject_id : '',
        blockId: formData && formData.block_of_competence_condition_id ? formData.block_of_competence_condition_id : '',
        evalId: formData && formData.evaluation_id ? formData.evaluation_id : '',
      },
    });
    dialogRef.afterClosed().subscribe((data: DuplicateDialogData) => {
      if (data?.duplicateFrom && this.titleId && this.categoryId) {
        if (this.testId) {
          // when duplicate in edit test page, we send testId in url
          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate(['/create-test', this.titleId, { categoryId: this.categoryId, testId: this.testId }, 'first'], {
              queryParams: this.getDuplicateUrlParam(data),
            });
          });
        } else {
          // when duplicate in create test page
          this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
            this.router.navigate(['/create-test', this.titleId, { categoryId: this.categoryId }, 'first'], {
              queryParams: this.getDuplicateUrlParam(data),
            });
          });
        }
      }
    });
  }

  getDuplicateUrlParam(data: DuplicateDialogData) {
    if (data && data.duplicateFrom) {
      return {
        duplicate: data.duplicateFrom,
        class: data.classId,
        block: data.blockId,
        subject: data.subjectId,
        eval: data.evalId,
      };
    } else {
      return null;
    }
  }
}
