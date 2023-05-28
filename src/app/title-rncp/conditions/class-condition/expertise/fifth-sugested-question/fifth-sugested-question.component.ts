import {
  Component,
  OnInit,
  Input,
  ViewChild,
  ViewChildren,
  QueryList,
  Output,
  EventEmitter,
  OnDestroy,
  ChangeDetectorRef,
  AfterViewChecked,
  HostListener,
  OnChanges,
} from '@angular/core';
import { BlockCompetencyModel, CompetencyModel, EvaluationCriteriaModel } from './blocks.model';
import { moveItemInArray } from '@angular/cdk/drag-drop';
import { MatDialog } from '@angular/material/dialog';
import { MatTable } from '@angular/material/table';
// import { BlockCompetencyDialogComponent } from './popup/block-competency-dialog/block-competency-dialog.component';
import * as _ from 'lodash';
import Swal from 'sweetalert2';
// import { CompetencyDialogComponent } from './popup/competency-dialog/competency-dialog.component';
// import { CriteriaEvaluationDialogComponent } from './popup/criteria-evaluation-dialog/criteria-evaluation-dialog.component';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { TranslateService } from '@ngx-translate/core';
import { UntypedFormGroup, UntypedFormBuilder, Validators, UntypedFormArray } from '@angular/forms';
import { last } from 'rxjs/operators';
import { SubSink } from 'subsink';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { AddEditPhraseDialogComponent } from '../add-edit-phrase-dialog.component';
import { UtilityService } from 'app/service/utility/utility.service';
import { ImportTemplateEvalCompetenceDialogComponent } from '../import-template-eval-competence-dialog/import-template-eval-competence-dialog.component';
import { ExportCsvService } from 'app/service/export-csv/export-csv.service';
import * as moment from 'moment';
import { environment } from 'environments/environment';
import { CriteriaEvaluationDialogComponent } from '../second-step-expertise/popup/criteria-evaluation-dialog/criteria-evaluation-dialog.component';
import { CompetencyDialogComponent } from '../second-step-expertise/popup/competency-dialog/competency-dialog.component';
import { BlockCompetencyDialogComponent } from '../second-step-expertise/popup/block-competency-dialog/block-competency-dialog.component';
import { QuestionDialogComponent } from './popup/question-dialog/question-dialog.component';
import { UploadQuestionDialogComponent } from './popup/upload-question-dialog/upload-question-dialog.component';
import { TestCorrectionService } from 'app/service/test-correction/test-correction.service';

@Component({
  selector: 'ms-fifth-sugested-question',
  templateUrl: './fifth-sugested-question.component.html',
  styleUrls: ['./fifth-sugested-question.component.scss'],
})
export class FifthSugestedQuestionComponent implements OnInit, OnDestroy {
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  @Input() evaluationStep: string;
  @Output() updateStep = new EventEmitter<string>();
  @HostListener('window:scroll', ['$event']) // for window scroll events
  @ViewChildren(MatTable)
  matTables: QueryList<MatTable<any>>;
  templateForm: UntypedFormGroup;
  private subs = new SubSink();
  displayedScoreColumns = ['score', 'phrase', 'letter', 'action'];
  displayedParameterColumns = ['correlation', 'validation_type', 'validation_parameter', 'pass_mark', 'action'];
  isWaitingForResponse = false;
  className: any;
  scroll = false;

  classConditionData: any;
  blocks: BlockCompetencyModel[] = [];
  scoreConversion: any = [];

  // default form to check if there is a change
  defaultForm: any;
  scrollEvent: any;
  exportName: 'Export';
  dataBlock: any;
  private timeOutVal: any;
  private intVal: any;
  constructor(
    public dialog: MatDialog,
    private rncpTitleService: RNCPTitlesService,
    private translate: TranslateService,
    private fb: UntypedFormBuilder,
    public utilService: UtilityService,
    private cdr: ChangeDetectorRef,
    private exportCsvService: ExportCsvService,
    private testCorrectionService: TestCorrectionService,
  ) {}

  ngOnInit() {
    this.getClassConditionData();
    this.initForm();
    this.defaultForm = _.cloneDeep(this.templateForm.value);
    this.populateData();
    // this.subs.sink = this.rncpTitleService.getScrollEvent$.subscribe((resp) => (this.scrollEvent = resp));
  }

  getClassConditionData() {
    this.subs.sink = this.rncpTitleService.getClassCondition(this.selectedClassId, 'competence').subscribe((resp) => {
      this.classConditionData = _.cloneDeep(resp);
    });
  }

  initForm() {
    this.templateForm = this.fb.group({
      rncp_title_id: [this.selectedRncpTitleId, Validators.required],
      class_id: [this.selectedClassId, Validators.required],
      block_of_competence_template_input: this.fb.array([]),
    });
  }

  initBlockForm() {
    return this.fb.group({
      _id: [''],
      ref_id: [''],
      name: ['', Validators.required],
      description: [''],
      note: [''],
      // block_rncp_reference: [''],
      // block_included_in_auto_pro_eval: [true],
      // block_automatic_generated_in_step_four: [true],
      rncp_title_id: [this.selectedRncpTitleId, Validators.required],
      class_id: [this.selectedClassId, Validators.required],
      // max_score: [null, [Validators.required, Validators.pattern('^[1-9]+[0-9]*$')]],
      // score_conversions: this.fb.array([]),
      phrase_names: this.fb.array([]),
      competence_templates_id: this.fb.array([]),
      criteria_of_evaluation_question_id: this.fb.array([]),
      isExpanded: [false],
    });
  }

  initCompetenceForm(): UntypedFormGroup {
    return this.fb.group({
      _id: [''],
      ref_id: [''],
      name: ['', Validators.required],
      description: [''],
      note: [''],
      phrase_names: this.fb.array([]),
      criteria_of_evaluation_templates_id: this.fb.array([]),
      isExpanded: [false],
    });
  }

  initEvaluationForm(): UntypedFormGroup {
    return this.fb.group({
      _id: [''],
      ref_id: [''],
      name: ['', Validators.required],
      description: [''],
      question: this.fb.array([]),
    });
  }

  initScoreConversionForm(): UntypedFormGroup {
    return this.fb.group({
      _id: [null],
      sign: ['', Validators.required],
      score: [null, Validators.required],
      phrase: ['', [Validators.required, removeSpaces]],
      letter: ['', [Validators.required, removeSpaces]],
    });
  }

  initQuestionForm(): UntypedFormGroup {
    return this.fb.group({
      _id: [null],
      question: [null],
    });
  }

  initPhraseNameForm(): UntypedFormGroup {
    return this.fb.group({
      name: ['', [Validators.required, removeSpaces]],
      phrase_parameters: this.fb.array([]),
    });
  }

  initBlockPhraseParametersForm(): UntypedFormGroup {
    return this.fb.group({
      correlation: [null],
      validation_type: [''],
      validation_parameter: this.fb.group({
        parameter_type: [null],
        percentage_value: [null, Validators.max(100)],
        competence_id: [null],
        criteria_of_evaluation_template_id: [null],
        sign: [null],
      }),
      pass_mark: ['', Validators.required],
    });
  }

  initCompetencePhraseParametersForm(): UntypedFormGroup {
    return this.fb.group({
      correlation: [null],
      validation_type: [''],
      validation_parameter: this.fb.group({
        parameter_type: [null],
        percentage_value: [null, Validators.max(100)],
        criteria_of_evaluation_template_id: [null],
        sign: [null],
      }),
      pass_mark: ['', Validators.required],
    });
  }

  initEvaluationQuestionForm(): UntypedFormGroup {
    return this.fb.group({
      _id: [null],
      s3_file_name: [''],
    });
  }

  // Function to get each formarray
  get getBlockFormArray(): UntypedFormArray {
    return this.templateForm.get('block_of_competence_template_input') as UntypedFormArray;
  }

  getCompetenceFormArray(blockIndex: number): UntypedFormArray {
    return this.getBlockFormArray.at(blockIndex).get('competence_templates_id') as UntypedFormArray;
  }

  getEvaluationFormArray(blockIndex: number, competenceIndex: number): UntypedFormArray {
    return this.getCompetenceFormArray(blockIndex).at(competenceIndex).get('criteria_of_evaluation_templates_id') as UntypedFormArray;
  }

  getQuestionFormArray(blockIndex: number, competenceIndex: number, criteria: number): UntypedFormArray {
    return this.getEvaluationFormArray(blockIndex, competenceIndex).at(criteria).get('question') as UntypedFormArray;
  }

  getBlockPhraseNameFormArray(blockIndex): UntypedFormArray {
    return this.getBlockFormArray.at(blockIndex).get('phrase_names') as UntypedFormArray;
  }

  getCompetencePhraseNameFormArray(blockIndex: number, competenceIndex): UntypedFormArray {
    return this.getCompetenceFormArray(blockIndex).at(competenceIndex).get('phrase_names') as UntypedFormArray;
  }

  getBlockPhraseParameterFormArray(blockIndex: number, phraseIndex: number): UntypedFormArray {
    return this.getBlockPhraseNameFormArray(blockIndex).at(phraseIndex).get('phrase_parameters') as UntypedFormArray;
  }

  getCompetencePhraseParameterFormArray(blockIndex: number, competenceIndex: number, phraseIndex: number): UntypedFormArray {
    return this.getCompetencePhraseNameFormArray(blockIndex, competenceIndex).at(phraseIndex).get('phrase_parameters') as UntypedFormArray;
  }

  getEvaluationQuestionFormArray(blockIndex: number): UntypedFormArray {
    return this.getBlockFormArray.at(blockIndex).get('criteria_of_evaluation_question_id') as UntypedFormArray;
  }
  // Get End

  openUploadQuestionDialog() {
    const dialogRef = this.dialog
      .open(UploadQuestionDialogComponent, {
        width: '500px',
        data: this.dataBlock,
        disableClose: true,
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.ngOnInit();
        }
      });
  }

  // Add into array
  addBlockFormArray() {
    this.getBlockFormArray.push(this.initBlockForm());
  }

  addCompetenceFormArray(blockIndex: number) {
    this.getCompetenceFormArray(blockIndex).push(this.initCompetenceForm());
  }

  addEvaluationFormArray(blockIndex: number, competenceIndex: number) {
    this.getEvaluationFormArray(blockIndex, competenceIndex).push(this.initEvaluationForm());
  }

  addQuestionFormArray(blockIndex: number, competenceIndex: number, critIndex: number) {
    this.getQuestionFormArray(blockIndex, competenceIndex, critIndex).push(this.initQuestionForm());
  }

  addBlockPhraseNameFormArray(blockIndex) {
    this.getBlockPhraseNameFormArray(blockIndex).push(this.initPhraseNameForm());

  }

  addCompetencePhraseNameFormArray(blockIndex: number, competenceIndex: number) {
    this.getCompetencePhraseNameFormArray(blockIndex, competenceIndex).push(this.initPhraseNameForm());

  }

  addBlockPhraseNameFormArrayDialog(blockIndex) {
    this.subs.sink = this.dialog
      .open(AddEditPhraseDialogComponent, {
        width: '400px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          type: 'add',
          list: this.getBlockPhraseNameFormArray(blockIndex).value,
        },
      })
      .afterClosed()
      .subscribe((response) => {

        if (response && response.name) {

          this.getBlockPhraseNameFormArray(blockIndex).push(this.initPhraseNameForm());
          const lastIndex = this.getBlockPhraseNameFormArray(blockIndex).length - 1;
          this.getBlockPhraseNameFormArray(blockIndex).at(lastIndex).get('name').patchValue(response.name);
          this.addBlockPhraseParameterFormArray(blockIndex, lastIndex);
        }
      });

    // this.getBlockPhraseNameFormArray(blockIndex).push(this.initPhraseNameForm());

  }

  addCompetencePhraseNameFormArrayDialog(blockIndex: number, competenceIndex: number) {
    this.subs.sink = this.dialog
      .open(AddEditPhraseDialogComponent, {
        width: '400px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          type: 'add',
          list: this.getCompetencePhraseNameFormArray(blockIndex, competenceIndex).value,
        },
      })
      .afterClosed()
      .subscribe((response) => {

        if (response && response.name) {

          this.getCompetencePhraseNameFormArray(blockIndex, competenceIndex).push(this.initPhraseNameForm());
          const lastIndex = this.getCompetencePhraseNameFormArray(blockIndex, competenceIndex).length - 1;
          this.getCompetencePhraseNameFormArray(blockIndex, competenceIndex).at(lastIndex).get('name').patchValue(response.name);
          this.addCompetencePhraseParameterFormArray(blockIndex, competenceIndex, lastIndex);

          // Update phrase name to be the same with other
          this.updateCompetencyPhraseName('add', blockIndex, competenceIndex, lastIndex);
        }
      });
    // this.getCompetencePhraseNameFormArray(blockIndex, competenceIndex).push(this.initPhraseNameForm());

  }

  addEvaluationQuestionFormArray(blockIndex: number) {
    this.getEvaluationQuestionFormArray(blockIndex).push(this.initEvaluationQuestionForm());
  }

  editBlockPhraseName(blockIndex: number, phraseIndex: number) {
    const temp = this.getBlockPhraseNameFormArray(blockIndex).value;
    const list = _.cloneDeep(temp.splice(phraseIndex, 1));
    this.subs.sink = this.dialog
      .open(AddEditPhraseDialogComponent, {
        width: '400px',
        minHeight: '100px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          type: 'edit',
          name: this.getBlockPhraseNameFormArray(blockIndex).at(phraseIndex).get('name').value,
          list: list,
        },
      })
      .afterClosed()
      .subscribe((response) => {

        if (response && response.name) {

          this.getBlockPhraseNameFormArray(blockIndex).at(phraseIndex).get('name').patchValue(response.name);
        }
      });
  }

  editCompPhraseName(blockIndex: number, compIndex: number, phraseIndex: number) {
    if (!this.isCompPhraseSelected(blockIndex, compIndex, phraseIndex)) {
      const temp = this.getCompetencePhraseNameFormArray(blockIndex, compIndex).value;
      const list = _.cloneDeep(temp.splice(phraseIndex, 1));

      this.subs.sink = this.dialog
        .open(AddEditPhraseDialogComponent, {
          width: '400px',
          minHeight: '100px',
          panelClass: 'certification-rule-pop-up',
          disableClose: true,
          data: {
            type: 'edit',
            name: this.getCompetencePhraseNameFormArray(blockIndex, compIndex).at(phraseIndex).get('name').value,
            list: this.getCompetencePhraseNameFormArray(blockIndex, compIndex).value,
          },
        })
        .afterClosed()
        .subscribe((response) => {

          if (response && response.name) {
            this.getCompetencePhraseNameFormArray(blockIndex, compIndex).at(phraseIndex).get('name').patchValue(response.name);
            this.updateCompetencyPhraseName('edit', blockIndex, compIndex, phraseIndex);

          }
        });
    } else {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('Error'),
        text: this.translate.instant('Please unselect Phrase from Condition in Phrase for Block'),
      });
    }
  }

  deleteBlockPhraseName(blockIndex: number, phraseIndex: number) {
    this.removeBlockPhraseNameFormArray(blockIndex, phraseIndex);
  }

  deleteCompPhraseName(blockIndex: number, compIndex: number, phraseIndex: number) {
    if (!this.isCompPhraseSelected(blockIndex, compIndex, phraseIndex)) {
      this.removeCompetencePhraseNameFormArray(blockIndex, compIndex, phraseIndex);
      this.updateCompetencyPhraseName('delete', blockIndex, compIndex, phraseIndex);
    } else {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('Error'),
        text: this.translate.instant('Please unselect Phrase from Condition in Phrase for Block'),
      });
    }
  }

  addBlockPhraseParameterFormArray(blockIndex: number, phraseIndex: number) {
    this.getBlockPhraseParameterFormArray(blockIndex, phraseIndex).push(this.initBlockPhraseParametersForm());
    this.matTables.forEach((each) => each.renderRows());
  }

  addCompetencePhraseParameterFormArray(blockIndex: number, competenceIndex: number, phraseIndex: number) {
    this.getCompetencePhraseParameterFormArray(blockIndex, competenceIndex, phraseIndex).push(this.initCompetencePhraseParametersForm());
    this.matTables.forEach((each) => each.renderRows());
  }
  // Add End

  // Remove from array
  removeBlockFormArray(blockIndex) {
    this.getBlockFormArray.removeAt(blockIndex);
  }

  removeCompetenceFormArray(blockIndex: number, competenceIndex: number) {
    const temp = _.cloneDeep(this.getCompetenceFormArray(blockIndex).at(competenceIndex).value);
    // this.removeDataFromCondition('competence', temp);
    this.getCompetenceFormArray(blockIndex).removeAt(competenceIndex);
    this.matTables.forEach((each) => each.renderRows());
  }

  removeEvaluationFormArray(blockIndex: number, competenceIndex: number, evaluationIndex: number) {
    const temp = _.cloneDeep(this.getEvaluationFormArray(blockIndex, competenceIndex).at(evaluationIndex).value);
    // this.removeDataFromCondition('criteria', temp);
    this.getEvaluationFormArray(blockIndex, competenceIndex).removeAt(evaluationIndex);
    this.matTables.forEach((each) => each.renderRows());
  }

  removeQuestionFormArray(blockIndex: number, competenceIndex: number, evaluationIndex: number, questionIndex: number) {
    this.getQuestionFormArray(blockIndex, competenceIndex, evaluationIndex).removeAt(questionIndex);
  }

  removeBlockPhraseNameFormArray(blockIndex, phraseIndex) {
    this.getBlockPhraseNameFormArray(blockIndex).removeAt(phraseIndex);
  }

  removeCompetencePhraseNameFormArray(blockIndex, competenceIndex, phraseIndex) {
    this.getCompetencePhraseNameFormArray(blockIndex, competenceIndex).removeAt(phraseIndex);
  }

  removeBlockPhraseParameterFormArray(blockIndex: number, phraseIndex, parameterIndex: number) {
    const data = this.getBlockPhraseParameterFormArray(blockIndex, phraseIndex).at(parameterIndex).value;
    // const result = this.getBlockPhraseParameterFormArray(blockIndex, phraseIndex).at(parameterIndex).pristine;
    const emptyParameter = JSON.stringify(this.initBlockPhraseParametersForm().value);
    const selectedAddress = JSON.stringify(data);
    const result = emptyParameter === selectedAddress;
    if (!result) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
        html: this.translate.instant('DELETE_PHRASE_PARAMETER'),
        type: 'warning',
        allowEscapeKey: false,
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
          this.getBlockPhraseParameterFormArray(blockIndex, phraseIndex).removeAt(parameterIndex);
          this.matTables.forEach((each) => each.renderRows());
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            html: this.translate.instant('PHRASE_PARAMETER_DELETED'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        }
      });
    } else {
      this.getBlockPhraseParameterFormArray(blockIndex, phraseIndex).removeAt(parameterIndex);
      this.matTables.forEach((each) => each.renderRows());
    }
    // this.getBlockPhraseParameterFormArray(blockIndex, phraseIndex).removeAt(parameterIndex);
    // this.matTables.forEach((each) => each.renderRows());
  }

  removeCompetencePhraseParameterFormArray(blockIndex: number, competenceIndex: number, phraseIndex: number, parameterIndex: number) {
    this.getCompetencePhraseParameterFormArray(blockIndex, competenceIndex, phraseIndex).removeAt(parameterIndex);
    this.matTables.forEach((each) => each.renderRows());
  }
  // Remove end

  getBlockScoreDropdown(blockIndex) {
    let result = [];
    if (this.getCompetenceFormArray(blockIndex).length && this.getCompetencePhraseNameFormArray(blockIndex, 0).value) {
      result = this.getCompetencePhraseNameFormArray(blockIndex, 0).value;
    }
    return result;
  }

  removeDataFromCondition(type: string, data: any) {
    const currentData = this.getBlockFormArray.value;


    if (type === 'score') {
      if (currentData && currentData.length) {
        currentData.forEach((block, blockIndex) => {
          // Start removing value from parameter which has deleted phrase
          if (block.phrase_names && block.phrase_names.length) {
            block.phrase_names.forEach((phrase_name, phraseIndex) => {
              if (phrase_name.phrase_parameters && phrase_name.phrase_parameters.length) {
                phrase_name.phrase_parameters.forEach((parameter, parameterIndex) => {
                  if (parameter && parameter.pass_mark && data && data.phrase && parameter.pass_mark === data.phrase) {
                    this.getBlockPhraseParameterFormArray(blockIndex, phraseIndex).at(parameterIndex).get('pass_mark').patchValue('');
                  }
                });
              }
            });
          }
          if (block.competence_templates_id && block.competence_templates_id.length) {
            block.competence_templates_id.forEach((competency, compIndex) => {
              if (competency.phrase_names && competency.phrase_names.length) {
                competency.phrase_names.forEach((phrase_name, phraseIndex) => {
                  if (phrase_name.phrase_parameters && phrase_name.phrase_parameters.length) {
                    phrase_name.phrase_parameters.forEach((parameter, parameterIndex) => {
                      if (parameter && parameter.pass_mark && data && data.phrase && parameter.pass_mark === data.phrase) {
                        this.getCompetencePhraseParameterFormArray(blockIndex, compIndex, phraseIndex)
                          .at(parameterIndex)
                          .get('pass_mark')
                          .patchValue('');
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    } else if (type === 'competence') {
      if (currentData && currentData.length) {
        currentData.forEach((block, blockIndex) => {
          // Start removing value from parameter which has deleted phrase
          if (block.phrase_names && block.phrase_names.length) {
            block.phrase_names.forEach((phrase_name, phraseIndex) => {
              if (phrase_name.phrase_parameters && phrase_name.phrase_parameters.length) {
                phrase_name.phrase_parameters.forEach((parameter, parameterIndex) => {
                  if (
                    parameter &&
                    parameter.validation_parameter &&
                    parameter.validation_parameter.competence_id &&
                    data &&
                    data._id &&
                    parameter.validation_parameter.competence_id === data._id
                  ) {
                    this.getBlockPhraseParameterFormArray(blockIndex, phraseIndex)
                      .at(parameterIndex)
                      .get('validation_parameter')
                      .get('competence_id')
                      .patchValue(null);
                  }
                });
              }
            });
          }
        });
      }
    } else if (type === 'criteria') {
      if (currentData && currentData.length) {
        currentData.forEach((block, blockIndex) => {
          if (block.phrase_names && block.phrase_names.length) {
            block.phrase_names.forEach((phrase_name, phraseIndex) => {
              if (phrase_name.phrase_parameters && phrase_name.phrase_parameters.length) {
                phrase_name.phrase_parameters.forEach((parameter, parameterIndex) => {
                  if (
                    parameter &&
                    parameter.validation_parameter &&
                    parameter.validation_parameter.criteria_of_evaluation_template_id &&
                    data &&
                    data._id &&
                    parameter.validation_parameter.criteria_of_evaluation_template_id === data._id
                  ) {
                    this.getBlockPhraseParameterFormArray(blockIndex, phraseIndex)
                      .at(parameterIndex)
                      .get('validation_parameter')
                      .get('criteria_of_evaluation_template_id')
                      .patchValue(null);
                  }
                });
              }
            });
          }
          if (block.competence_templates_id && block.competence_templates_id.length) {
            block.competence_templates_id.forEach((competency, compIndex) => {
              if (competency.phrase_names && competency.phrase_names.length) {
                competency.phrase_names.forEach((phrase_name, phraseIndex) => {
                  if (phrase_name.phrase_parameters && phrase_name.phrase_parameters.length) {
                    phrase_name.phrase_parameters.forEach((parameter, parameterIndex) => {
                      if (
                        parameter &&
                        parameter.validation_parameter &&
                        parameter.validation_parameter.criteria_of_evaluation_template_id &&
                        data &&
                        data._id &&
                        parameter.validation_parameter.criteria_of_evaluation_template_id === data._id
                      ) {
                        this.getCompetencePhraseParameterFormArray(blockIndex, compIndex, phraseIndex)
                          .at(parameterIndex)
                          .get('validation_parameter')
                          .get('criteria_of_evaluation_template_id')
                          .patchValue(null);
                      }
                    });
                  }
                });
              }
            });
          }
        });
      }
    }
  }

  isUsedByCondition(type: string, data: any): boolean {
    const currentBlocks = this.getBlockFormArray.value;


    if (type === 'score') {
      if (currentBlocks && currentBlocks.length) {
        for (const block of currentBlocks) {
          // Start Check if score already used in condition to pass block
          if (block && block.condition_parameters && block.condition_parameters.length) {
            for (const condition of block.condition_parameters) {
              if (condition && condition.pass_mark && data && data.phrase && condition.pass_mark === data.phrase) {
                return true;
              }
            }
          }
          // End Check if score already used in condition to pass block

          // Now go to each competency to check its condition to pass
          if (block && block.competence_templates_id && block.competence_templates_id.length) {
            for (const competence of block.competence_templates_id) {
              if (competence && competence.condition_parameters && competence.condition_parameters.length) {
                for (const condition of competence.condition_parameters) {
                  if (condition && condition.pass_mark && data && data.phrase && condition.pass_mark === data.phrase) {
                    return true;
                  }
                }
              }
            }
          }
          // End of competency condition check
        }
      }
    } else if (type === 'competency') {
      if (currentBlocks && currentBlocks.length) {
        for (const block of currentBlocks) {
          // Start Check if score already used in condition to pass block
          if (block && block.condition_parameters && block.condition_parameters.length) {
            for (const condition of block.condition_parameters) {
              if (
                condition &&
                condition.validation_type &&
                condition.validation_type === 'competence' &&
                condition.validation_parameter &&
                condition.validation_parameter.competence_id &&
                data &&
                data._id &&
                condition.validation_parameter.competence_id === data._id
              ) {
                return true;
              }
            }
          }
          // End Check if score already used in condition to pass block
        }
      }
    } else if ((type = 'criteria')) {
      if (currentBlocks && currentBlocks.length) {
        for (const block of currentBlocks) {
          // Start Check if score already used in condition to pass block
          if (block && block.condition_parameters && block.condition_parameters.length) {
            for (const condition of block.condition_parameters) {
              if (
                condition &&
                condition.validation_type &&
                condition.validation_type === 'criteria' &&
                condition.validation_parameter &&
                condition.validation_parameter.criteria_of_evaluation_template_id &&
                data &&
                data._id &&
                condition.validation_parameter.criteria_of_evaluation_template_id === data._id
              ) {
                return true;
              }
            }
          }
          // End Check if score already used in condition to pass block

          // Now go to each competency to check its condition to pass
          if (block && block.competence_templates_id && block.competence_templates_id.length) {
            for (const competence of block.competence_templates_id) {
              if (competence && competence.condition_parameters && competence.condition_parameters.length) {
                for (const condition of competence.condition_parameters) {
                  if (
                    condition &&
                    condition.validation_type &&
                    condition.validation_type === 'criteria' &&
                    condition.validation_parameter &&
                    condition.validation_parameter.criteria_of_evaluation_template_id &&
                    data &&
                    data._id &&
                    condition.validation_parameter.criteria_of_evaluation_template_id === data._id
                  ) {
                    return true;
                  }
                }
              }
            }
          }
          // End of competency condition check
        }
      }
    }
    return false;
  }

  populateData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService
      .getAllBlockOfCompetenceTemplate(this.selectedRncpTitleId, this.selectedClassId)
      .subscribe((response) => {
        this.isWaitingForResponse = false;
        const res = _.cloneDeep(response);
        this.dataBlock = res;
        if (res && res.length) {
          res.forEach((block, blockIndex) => {
            this.addBlockFormArray();
            if (block && block.score_conversions_competency && block.score_conversions_competency.length) {
              block.score_conversions_competency.forEach((scoreConversion) => {});
            } else {
              block.score_conversions_competency = [];
            }

            if (block.phrase_names && block.phrase_names.length) {
              block.phrase_names.forEach((phraseName, phraseIndex) => {
                this.addBlockPhraseNameFormArray(blockIndex);
                if (phraseName.phrase_parameters && phraseName.phrase_parameters.length) {
                  phraseName.phrase_parameters.forEach((parameter, parameterIndex) => {
                    this.addBlockPhraseParameterFormArray(blockIndex, phraseIndex);
                    if (
                      parameter &&
                      parameter.validation_parameter &&
                      parameter.validation_parameter.competence_id &&
                      parameter.validation_parameter.competence_id._id
                    ) {
                      parameter.validation_parameter.competence_id = parameter.validation_parameter.competence_id._id;
                    }
                    if (
                      parameter &&
                      parameter.validation_parameter &&
                      parameter.validation_parameter.criteria_of_evaluation_template_id &&
                      parameter.validation_parameter.criteria_of_evaluation_template_id._id
                    ) {
                      parameter.validation_parameter.criteria_of_evaluation_template_id =
                        parameter.validation_parameter.criteria_of_evaluation_template_id._id;
                    }
                  });
                } else {
                  phraseName.phrase_parameters = [];
                }
              });
            }

            if (block && block.competence_templates_id && block.competence_templates_id.length) {
              block.competence_templates_id.forEach((competence, compIndex) => {
                this.addCompetenceFormArray(blockIndex);
                if (competence.phrase_names && competence.phrase_names.length) {
                  competence.phrase_names.forEach((phraseName, phraseIndex) => {
                    this.addCompetencePhraseNameFormArray(blockIndex, compIndex);
                    if (phraseName && phraseName.phrase_parameters && phraseName.phrase_parameters.length) {
                      phraseName.phrase_parameters.forEach((parameter, parameterIndex) => {
                        this.addCompetencePhraseParameterFormArray(blockIndex, compIndex, phraseIndex);
                        if (
                          parameter &&
                          parameter.validation_parameter &&
                          parameter.validation_parameter.criteria_of_evaluation_template_id &&
                          parameter.validation_parameter.criteria_of_evaluation_template_id._id
                        ) {
                          parameter.validation_parameter.criteria_of_evaluation_template_id =
                            parameter.validation_parameter.criteria_of_evaluation_template_id._id;
                        }
                      });
                    } else {
                      phraseName.phrase_parameters = [];
                    }
                  });
                } else {
                  let result = this.checkIsPhraseCompExist(block.competence_templates_id);
                  if (result && result.result) {
                    const dataComp = _.cloneDeep(block.competence_templates_id[result.compIndex]);

                    if (dataComp && dataComp.phrase_names && dataComp.phrase_names.length) {
                      dataComp.phrase_names.forEach((phrase) => {
                        this.addCompetencePhraseNameFormArray(blockIndex, compIndex);
                        this.addCompetencePhraseParameterFormArray(blockIndex, compIndex, 0);
                        phrase.phrase_parameters = [];
                      });
                    }
                    competence.phrase_names = dataComp.phrase_names;
                  }
                }

                if (competence && competence.criteria_of_evaluation_templates_id && competence.criteria_of_evaluation_templates_id.length) {
                  competence.criteria_of_evaluation_templates_id.forEach((evaluation, evaIndex) => {
                    this.addEvaluationFormArray(blockIndex, compIndex);
                  });
                } else {
                  competence.criteria_of_evaluation_templates_id = [];
                }
              });
            } else {
              block.competence_templates_id = [];
            }

            if (block && block.criteria_of_evaluation_question_id && block.criteria_of_evaluation_question_id.length) {
              block.criteria_of_evaluation_question_id.forEach((question, questIndex) => {
                this.addEvaluationQuestionFormArray(blockIndex);
              });
            }
          });
          this.templateForm.get('block_of_competence_template_input').patchValue(res);
        }
      });
  }

  save() {}
  checkValidation(): boolean {
    return true;
  }

  checkUniquePhraseScoreLetters(): boolean {
    const source = this.templateForm.get('block_of_competence_template_input').value;
    if (source && source.length) {
      for (const [blockIndex, block] of source.entries()) {
        // Start validating unique name of phrase within the block
        if (
          block.score_conversions_competency &&
          block.score_conversions_competency.length &&
          this.hasDuplicates(block.score_conversions_competency)
        ) {
          return false;
        } else {
          return true;
        }
        // End validating unique name of phrase within the block
      }
    } else {
      return true;
    }
  }

  openBlockCompetencyDialog(type: string, blockIndex?: number) {
    const dialogRef = this.dialog.open(BlockCompetencyDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        type: type,
        data: type === 'edit' ? this.getBlockFormArray.at(blockIndex).value : null,
        competency: true,
        soft_skill: false,
      },
    });
    this.subs.sink = dialogRef.afterClosed().subscribe((result) => {

      if (result) {
        if (type === 'add') {
          if (result && result._id === null) {
            delete result._id;
          }
          this.subs.sink = this.rncpTitleService
            .createOneBlockOfCompetenceTemplate(this.selectedRncpTitleId, this.selectedClassId, result)
            .subscribe((res) => {

              if (res) {
                this.addBlockFormArray();
                this.getBlockFormArray.at(this.getBlockFormArray.length - 1).patchValue(res);
              } else {
                Swal.fire({
                  type: 'error',
                  text: 'Failed to create block',
                  allowOutsideClick: false,
                  confirmButtonText: this.translate.instant('ok'),
                });
              }
            });
        } else {
          this.getBlockFormArray.at(blockIndex).patchValue(result);
        }
      }
    });
  }

  deleteBlockCompetency(blockIndex: number) {
    let timeDisabled = 5;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('DELETE_ITEM_TEMPLATE.TITLE'),
      text: this.translate.instant('DELETE_ITEM_TEMPLATE.TEXT'),
      footer: `<span style="margin-left: auto">DELETE_ITEM_TEMPLATE</span>`,
      confirmButtonText: this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_2'),
      allowEscapeKey: false,
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
          // clearTimeout(time);
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((result) => {
      clearTimeout(this.timeOutVal);
      if (result.value) {
        this.subs.sink = this.rncpTitleService
          .deleteBlockOfCompetenceTemplate(this.getBlockFormArray.at(blockIndex).get('_id').value)
          .subscribe((res) => {

            if (res && !res.errors) {
              this.removeBlockFormArray(blockIndex);
              Swal.fire({
                type: 'success',
                allowOutsideClick: false,
                title: this.translate.instant('DELETE_BLOCK_S1.TITLE'),
                html: this.translate.instant('DELETE_BLOCK_S1.TEXT'),
                footer: `<span style="margin-left: auto">DELETE_BLOCK_S1</span>`,
                confirmButtonText: this.translate.instant('DELETE_BLOCK_S1.BUTTON'),
              });
            } else if (res && res.errors && res.errors.length) {
              if (res.errors[0] && res.errors[0].message && res.errors[0].message === 'block condition still have evaluation') {
                Swal.fire({
                  type: 'error',
                  allowOutsideClick: false,
                  title: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S7.TITLE'),
                  text: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S7.TEXT_BLOCK'),
                  footer: `<span style="margin-left: auto">EVAL_S7</span>`,
                  confirmButtonText: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S7.BUTTON'),
                });
              } else if (res.errors[0] && res.errors[0].message && res.errors[0].message === 'block condition already used in the test') {
                Swal.fire({
                  type: 'error',
                  allowOutsideClick: false,
                  title: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S8.TITLE'),
                  html: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S8.TEXT_BLOCK'),
                  footer: `<span style="margin-left: auto">EVAL_S8</span>`,
                  confirmButtonText: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S8.BUTTON'),
                });
              }
            }
          });
      }
    });
  }

  openCompetencyDialog(type: string, blockIndex: number, compIndex?: number) {
    const blockId = this.getBlockFormArray.at(blockIndex).get('_id').value;
    const dialogRef = this.dialog.open(CompetencyDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        type: type,
        data: type === 'edit' ? this.getCompetenceFormArray(blockIndex).at(compIndex).value : null,
      },
    });
    this.subs.sink = dialogRef.afterClosed().subscribe((result) => {

      if (result) {
        if (type === 'add') {
          if (result && result._id === null) {
            delete result._id;
          }
          this.subs.sink = this.rncpTitleService.createOneCompetenceTemplate(blockId, result).subscribe(
            (res) => {
              if (res) {
                this.addCompetenceFormArray(blockIndex);
                this.getCompetenceFormArray(blockIndex)
                  .at(this.getCompetenceFormArray(blockIndex).length - 1)
                  .patchValue(res);
                const lastIndex = this.getCompetenceFormArray(blockIndex).length - 1;
                this.updateCompetency('add', blockIndex, lastIndex);
              } else {
                Swal.fire({
                  type: 'error',
                  text: 'Failed to create competency',
                  allowOutsideClick: false,
                  confirmButtonText: this.translate.instant('ok'),
                });
              }
            },
            (err) => {
              if (err['message'] === 'GraphQL error: Criteria Of Evaluation Already Used In Published Test') {
                let criteria = this.translate.instant('EVAL_BY_EXPERTISE.Competency');
                Swal.fire({
                  allowOutsideClick: false,
                  confirmButtonText: this.translate.instant('EVAL_S9.BUTTON'),
                  type: 'error',
                  title: this.translate.instant('EVAL_S9.TITLE'),
                  html: this.translate.instant('EVAL_S9.TEXT', {
                    criteria,
                  }),
                  footer: `<span style="margin-left: auto">EVAL_S9</span>`,
                });
              } else {
                Swal.fire({
                  allowOutsideClick: false,
                  confirmButtonText: this.translate.instant('EVAL_S9.BUTTON'),
                  type: 'error',
                  text: err['message'],
                });
              }
            },
          );
        } else {
          this.getCompetenceFormArray(blockIndex).at(compIndex).patchValue(result);
        }
      }
    });
  }

  deleteEvalQuest(idEvalQuest) {
    let timeDisabled = 5;
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('DELETE_QUESTION_FILE.TITLE'),
      footer: `<span style="margin-left: auto">DELETE_QUESTION_FILE</span>`,
      confirmButtonText: this.translate.instant('DELETE_QUESTION_FILE.BUTTON_1'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('DELETE_QUESTION_FILE.BUTTON_2'),
      allowEscapeKey: false,
      allowOutsideClick: false,
      allowEnterKey: false,
      onOpen: () => {
        Swal.disableConfirmButton();
        const confirmBtnRef = Swal.getConfirmButton();
        const intVal = setInterval(() => {
          timeDisabled -= 1;
          confirmBtnRef.innerText = this.translate.instant('DELETE_QUESTION_FILE.BUTTON_1') + ` (${timeDisabled})`;
        }, 1000);

        this.timeOutVal = setTimeout(() => {
          confirmBtnRef.innerText = this.translate.instant('DELETE_QUESTION_FILE.BUTTON_1');
          Swal.enableConfirmButton();
          clearInterval(intVal);
          clearTimeout(this.timeOutVal);
        }, timeDisabled * 1000);
      },
    }).then((res) => {
      if (res.value) {
        this.subs.sink = this.rncpTitleService.deleteCriteriaOfEvaluationTemplateQuestion(idEvalQuest).subscribe(() => {
          this.ngOnInit();
          Swal.fire({
            type: 'success',
            allowOutsideClick: false,
            title: this.translate.instant('EVENT_S1.TITLE'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        });
      }
    });
  }

  deleteCompetency(blockIndex: number, compIndex: number) {
    const temp = _.cloneDeep(this.getCompetenceFormArray(blockIndex).at(compIndex).value);
    if (!this.isUsedByCondition('competency', temp)) {
      let timeDisabled = 5;
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('DELETE_ITEM_TEMPLATE.TITLE'),
        text: this.translate.instant('DELETE_ITEM_TEMPLATE.TEXT'),
        footer: `<span style="margin-left: auto">DELETE_ITEM_TEMPLATE</span>`,
        confirmButtonText: this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_2'),
        allowEscapeKey: false,
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
            // clearTimeout(time);
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((result) => {
        clearTimeout(this.timeOutVal);
        if (result.value) {
          this.subs.sink = this.rncpTitleService
            .deleteCompetencyTemplate(this.getCompetenceFormArray(blockIndex).at(compIndex).get('_id').value)
            .subscribe((res) => {

              if (res && !res.errors) {
                this.removeCompetenceFormArray(blockIndex, compIndex);
                Swal.fire({
                  type: 'success',
                  allowOutsideClick: false,
                  title: this.translate.instant('EVENT_S1.TITLE'),
                  html: this.translate.instant('competency deleted'),
                  confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
                });
              } else if (res && res.errors && res.errors.length) {
                if (res.errors[0] && res.errors[0].message && res.errors[0].message === 'block condition still have evaluation') {
                  Swal.fire({
                    type: 'error',
                    allowOutsideClick: false,
                    title: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S7.TITLE'),
                    text: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S7.TEXT_COMP'),
                    footer: `<span style="margin-left: auto">EVAL_S7</span>`,
                    confirmButtonText: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S7.BUTTON'),
                  });
                } else if (res.errors[0] && res.errors[0].message && res.errors[0].message === 'block condition already used in the test') {
                  Swal.fire({
                    type: 'error',
                    allowOutsideClick: false,
                    title: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S8.TITLE'),
                    html: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S8.TEXT_COMP'),
                    footer: `<span style="margin-left: auto">EVAL_S8</span>`,
                    confirmButtonText: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S8.BUTTON'),
                  });
                }
              }
            });
        }
      });
    } else {
      Swal.fire({
        type: 'error',
        allowOutsideClick: false,
        title: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S4.TITLE'),
        text: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S4.TEXT_COMP'),
        footer: `<span style="margin-left: auto">EVAL_S4</span>`,
        confirmButtonText: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S4.BUTTON'),
      });
    }
  }

  openCriteriaEvaluationDialog(type: string, blockIndex: number, compIndex: number, evaIndex?: number) {
    const competenceId = this.getCompetenceFormArray(blockIndex).at(compIndex).get('_id').value;
    const dialogRef = this.dialog.open(CriteriaEvaluationDialogComponent, {
      width: '500px',
      disableClose: true,
      data: {
        type: type,
        data: type === 'edit' ? this.getEvaluationFormArray(blockIndex, compIndex).at(evaIndex).value : null,
      },
    });
    this.subs.sink = dialogRef.afterClosed().subscribe((result) => {

      if (result) {
        if (type === 'add') {
          if (result && result._id === null) {
            delete result._id;
          }
          this.subs.sink = this.rncpTitleService.createOneCriteriaOfEvaluationTemplate(competenceId, result).subscribe(
            (res) => {

              if (res) {
                this.addEvaluationFormArray(blockIndex, compIndex);
                this.getEvaluationFormArray(blockIndex, compIndex)
                  .at(this.getEvaluationFormArray(blockIndex, compIndex).length - 1)
                  .patchValue(res);

              } else {
                Swal.fire({
                  type: 'error',
                  text: 'Failed to create competency',
                  allowOutsideClick: false,
                  confirmButtonText: this.translate.instant('ok'),
                });
              }
            },
            (error) => {
              if (error['message'] === 'GraphQL error: Criteria Of Evaluation Already Used In Published Test') {
                const criteria = this.translate.instant('Criteria');
                Swal.fire({
                  allowOutsideClick: false,
                  confirmButtonText: this.translate.instant('EVAL_S9.BUTTON'),
                  type: 'error',
                  title: this.translate.instant('EVAL_S9.TITLE'),
                  html: this.translate.instant('EVAL_S9.TEXT', {
                    criteria,
                  }),
                  footer: `<span style="margin-left: auto">EVAL_S9</span>`,
                });
              } else {
                Swal.fire({
                  allowOutsideClick: false,
                  confirmButtonText: this.translate.instant('EVAL_S9.BUTTON'),
                  type: 'error',
                  text: error['message'],
                });
              }
            },
          );
        } else {
          this.getEvaluationFormArray(blockIndex, compIndex).at(evaIndex).patchValue(result);
        }
      }
    });
  }

  deleteCriteriaEvaluation(blockIndex: number, compIndex: number, evaIndex: number) {
    const temp = _.cloneDeep(this.getEvaluationFormArray(blockIndex, compIndex).at(evaIndex).value);
    if (!this.isUsedByCondition('criteria', temp)) {
      let timeDisabled = 5;
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('DELETE_ITEM_TEMPLATE.TITLE'),
        text: this.translate.instant('DELETE_ITEM_TEMPLATE.TEXT'),
        footer: `<span style="margin-left: auto">DELETE_ITEM_TEMPLATE</span>`,
        confirmButtonText: this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_2'),
        allowEscapeKey: false,
        allowOutsideClick: false,
        allowEnterKey: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          this.intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1') + ` (${timeDisabled})`;
          }, 1000);
          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('DELETE_ITEM_TEMPLATE.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(this.intVal);
            // clearTimeout(time);
          }, timeDisabled * 1000);
          // clearTimeout(this.timeOutVal);
        },
      }).then((result) => {
        if (result.value) {
          this.subs.sink = this.rncpTitleService
            .deleteCriteriaEvaluationTemplate(this.getEvaluationFormArray(blockIndex, compIndex).at(evaIndex).get('_id').value)
            .subscribe((res) => {

              if (res && !res.errors) {
                this.removeEvaluationFormArray(blockIndex, compIndex, evaIndex);
              } else if (res && res.errors && res.errors.length) {
                if (res.errors[0] && res.errors[0].message && res.errors[0].message === 'block condition still have evaluation') {
                  Swal.fire({
                    allowOutsideClick: false,
                    type: 'error',
                    title: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S7.TITLE'),
                    text: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S7.TEXT_CRIT'),
                    footer: `<span style="margin-left: auto">EVAL_S7</span>`,
                    confirmButtonText: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S7.BUTTON'),
                  });
                } else if (res.errors[0] && res.errors[0].message && res.errors[0].message === 'block condition already used in the test') {
                  Swal.fire({
                    type: 'error',
                    allowOutsideClick: false,
                    title: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S8.TITLE'),
                    html: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S8.TEXT_CRIT'),
                    footer: `<span style="margin-left: auto">EVAL_S8</span>`,
                    confirmButtonText: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S8.BUTTON'),
                  });
                }
              }
            });
        }
      });
    } else {
      Swal.fire({
        allowOutsideClick: false,
        type: 'error',
        title: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S4.TITLE'),
        text: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S4.TEXT_CRIT'),
        footer: `<span style="margin-left: auto">EVAL_S4</span>`,
        confirmButtonText: this.translate.instant('EVAL_BY_EXPERTISE.EVAL_S4.BUTTON'),
      });
    }
  }

  getDataQuestionTemplate(blockIndex: number, compIndex?: number, critIndex?: number) {
    const criteriaId = this.getEvaluationFormArray(blockIndex, compIndex).at(critIndex).get('_id').value;
    this.subs.sink = this.rncpTitleService.getAllCriteriaOfEvaluationTemplateQuestions(criteriaId).subscribe((resp) => {

      if (resp && resp.length) {
        const control = this.getQuestionFormArray(blockIndex, compIndex, critIndex).controls;
        for (let i = control.length - 1; i >= 0; i--) {
          this.removeQuestionFormArray(blockIndex, compIndex, critIndex, i);
        }
        resp.forEach((element) => {
          this.addQuestionFormArray(blockIndex, compIndex, critIndex);
        });
        this.getQuestionFormArray(blockIndex, compIndex, critIndex).patchValue(resp);
      } else {
        const control = this.getQuestionFormArray(blockIndex, compIndex, critIndex).controls;
        for (let i = control.length - 1; i >= 0; i--) {
          this.removeQuestionFormArray(blockIndex, compIndex, critIndex, i);
        }
      }
    });
  }

  deleteQuestion(blockIndex: number, compIndex?: number, critIndex?: number, queIndex?: number) {
    const id = this.getQuestionFormArray(blockIndex, compIndex, critIndex).at(queIndex).get('_id').value;
    this.subs.sink = this.testCorrectionService.deleteCriteriaOfEvaluationTemplateQuestion(id).subscribe((resp) => {
      if (resp) {
        this.getDataQuestionTemplate(blockIndex, compIndex, critIndex);
      }
    });
  }

  openQuestionDialog(type: string, blockIndex, compIndex, evaIndex) {
    this.subs.sink = this.dialog
      .open(QuestionDialogComponent, {
        width: '500px',
        disableClose: true,
        data: {
          type: type,
          criteria_of_evaluation_template_id: this.getEvaluationFormArray(blockIndex, compIndex).at(evaIndex).get('_id').value,
          block_of_template_competence_id: this.getBlockFormArray.at(blockIndex).get('_id').value,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        this.getDataQuestionTemplate(blockIndex, compIndex, evaIndex);
      });
  }

  editQuestionDialog(type: string, blockIndex, compIndex, evaIndex, quesIndex) {
    this.subs.sink = this.dialog
      .open(QuestionDialogComponent, {
        width: '500px',
        disableClose: true,
        data: {
          type: type,
          criteria_of_evaluation_template_id: this.getEvaluationFormArray(blockIndex, compIndex).at(evaIndex).get('_id').value,
          block_of_template_competence_id: this.getBlockFormArray.at(blockIndex).get('_id').value,
          _id: this.getQuestionFormArray(blockIndex, compIndex, evaIndex).at(quesIndex).get('_id').value,
          name: this.getQuestionFormArray(blockIndex, compIndex, evaIndex).at(quesIndex).get('question').value,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        this.getDataQuestionTemplate(blockIndex, compIndex, evaIndex);
      });
  }

  dropBlock(event: any) {

    moveItemInArray(this.blocks, event.previousIndex, event.currentIndex);
  }

  dropCompetency(event: any, blockIndex: number) {

    moveItemInArray(this.blocks[blockIndex].competence_templates_id, event.previousIndex, event.currentIndex);
  }

  dropEvaluation(event: any, blockIndex: number, competencyIndex: number) {

    moveItemInArray(
      this.blocks[blockIndex].competence_templates_id[competencyIndex].criteria_of_evaluation_templates_id,
      event.previousIndex,
      event.currentIndex,
    );
  }

  hasDuplicates(scoreArray) {
    return (
      _.uniqBy(scoreArray, (score) => score.sign + score.score).length !== scoreArray.length ||
      _.uniqBy(scoreArray, 'phrase').length !== scoreArray.length ||
      _.uniqBy(scoreArray, 'letter').length !== scoreArray.length
    );
  }

  isScoreConversionClean(data) {
    let result = false;
    const isEmpty = !Object.values(data).some((x) => x !== null && x !== '');
    if (isEmpty) {
      result = true;
      return result;
    }
    return result;
  }

  isPhraseParameterClean(data) {
    let result = false;
    const isEmpty = !Object.values(data).some((x) => x !== null && x !== '');
    if (isEmpty) {
      result = true;
      return result;
    }
    return result;
  }

  checkIsBiggerThanMax(scoreIndex: number) {}

  isOneCompNotHavePhrase(blockIndex) {
    let result = true;
    const tempData = this.getBlockFormArray.value;
    if (tempData[blockIndex]) {
      const data = tempData[blockIndex];
      if (data.competence_templates_id && data.competence_templates_id.length) {
        for (const competence of data.competence_templates_id) {
          if (competence && competence.phrase_names && !competence.phrase_names.length) {
            result = true;
            break;
          } else {
            result = false;
          }
        }
      }
    }
    return result;
  }

  handlePercentChange(blockIndex, compIndex, phraseIndex, i) {

    let a = this.getCompetencePhraseParameterFormArray(blockIndex, compIndex, phraseIndex)
      .at(i)
      .get('validation_parameter')
      .get('percentage_value');
    if (a.value < 0) a.patchValue(0);
    if (a.value > 100) a.patchValue(100);
  }

  handlePercentageChange(blockIndex, phraseIndex, i) {
    let x = this.getBlockPhraseParameterFormArray(blockIndex, phraseIndex).at(i).get('validation_parameter').get('percentage_value');
    if (x.value < 0) x.patchValue(0);
    if (x.value > 100) x.patchValue(100);
  }

  updateCompetency(type, blockIndex, compIndex) {
    if (type === 'add') {
      if (this.getBlockFormArray.length && this.getCompetencePhraseNameFormArray(blockIndex, 0).length) {
        const tempData = this.getCompetencePhraseNameFormArray(blockIndex, 0).value;


        if (tempData && tempData.length) {
          tempData.forEach((phrase, phraseIndex) => {
            phrase.phrase_parameters = phrase.phrase_parameters.filter(
              (parameter) => parameter && parameter.validation_type === 'all_criteria',
            );

            this.addCompetencePhraseNameFormArray(blockIndex, compIndex);
            if (phrase && phrase.phrase_parameters && phrase.phrase_parameters.length) {
              phrase.phrase_parameters.forEach((parameter) => {
                this.addCompetencePhraseParameterFormArray(blockIndex, compIndex, phraseIndex);
              });
            } else {
              phrase.phrase_parameters = [];
              this.addCompetencePhraseParameterFormArray(blockIndex, compIndex, phraseIndex);
            }
          });
          this.getCompetencePhraseNameFormArray(blockIndex, compIndex).patchValue(tempData);
        }
      }
    }
  }

  updateCompetencyPhraseName(type, blockIndex, compIndex, phraseIndex) {
    const data = this.getCompetenceFormArray(blockIndex).value;

    if (type === 'add') {
      const tempData = this.getCompetenceFormArray(blockIndex).value;

      if (tempData && tempData.length) {
        tempData.forEach((comp, tempIndex) => {
          if (tempIndex !== compIndex) {
            this.addCompetencePhraseNameFormArray(blockIndex, tempIndex);
            const lastIndex = this.getCompetencePhraseNameFormArray(blockIndex, tempIndex).length - 1;
            this.addCompetencePhraseParameterFormArray(blockIndex, tempIndex, lastIndex);
            this.getCompetencePhraseNameFormArray(blockIndex, tempIndex)
              .at(lastIndex)
              .patchValue(this.getCompetencePhraseNameFormArray(blockIndex, compIndex).at(phraseIndex).value);
          }
        });
      }
    } else if (type === 'edit') {
      const tempData = this.getCompetenceFormArray(blockIndex).value;

      if (tempData && tempData.length) {
        tempData.forEach((comp, tempIndex) => {
          if (tempIndex !== compIndex) {
            this.getCompetencePhraseNameFormArray(blockIndex, tempIndex)
              .at(phraseIndex)
              .get('name')
              .patchValue(this.getCompetencePhraseNameFormArray(blockIndex, compIndex).at(phraseIndex).get('name').value);
          }
        });
      }
    } else if (type === 'delete') {
      const tempData = this.getCompetenceFormArray(blockIndex).value;

      if (tempData && tempData.length) {
        tempData.forEach((comp, tempIndex) => {
          if (tempIndex !== compIndex) {
            this.removeCompetencePhraseNameFormArray(blockIndex, tempIndex, phraseIndex);
          }
        });
      }
    }
  }

  isCompPhraseSelected(blockIndex, compIndex, phraseIndex): boolean {
    let result = false;
    const blockPhraseData = this.getBlockPhraseNameFormArray(blockIndex).value;
    const data = this.getCompetencePhraseNameFormArray(blockIndex, compIndex).at(phraseIndex).value;

    if (blockPhraseData && blockPhraseData.length) {
      for (const phrase of blockPhraseData) {
        if (phrase.phrase_parameters && phrase.phrase_parameters.length) {
          for (const parameter of phrase.phrase_parameters) {
            if (parameter && this.utilService.simplifyRegex(parameter.pass_mark) === this.utilService.simplifyRegex(data.name)) {
              result = true;
              return result;
            }
          }
        }
      }
    }

    return result;
  }

  allowSelectBlockScorePhrase(blockIndex, phraseIndex, paramIndex) {
    let result = false;
    const temp = this.getBlockPhraseParameterFormArray(blockIndex, phraseIndex).at(paramIndex).value;
    if (
      temp.validation_parameter &&
      (temp.validation_parameter.parameter_type ||
        temp.validation_parameter.competence_id ||
        temp.validation_parameter.criteria_of_evaluation_template_id)
    ) {
      result = true;
    }
    return result;
  }

  allowSelectCompetencyScorePhrase(blockIndex, compIndex, phraseIndex, paramIndex) {
    let result = false;
    // const temp = this.getBlockPhraseParameterFormArray(blockIndex, phraseIndex).at(paramIndex).value;
    const temp = this.getCompetencePhraseParameterFormArray(blockIndex, compIndex, phraseIndex).at(paramIndex).value;
    if (
      temp.validation_parameter &&
      (temp.validation_parameter.parameter_type ||
        temp.validation_parameter.competence_id ||
        temp.validation_parameter.criteria_of_evaluation_template_id)
    ) {
      result = true;
    }
    return result;
  }

  checkIsPhraseCompExist(data): { result: boolean; compIndex: number } {

    const result = {
      result: false,
      compIndex: 0,
    };
    if (data && data.length) {
      for (const [compIndex, competence] of data.entries()) {
        if (competence && competence.phrase_names && competence.phrase_names.length) {

          result.result = true;
          result.compIndex = compIndex;
          break;
        }
      }
    }
    return result;
  }

  csvTypeSelectionUpload() {
    const inputOptions = {
      ',': this.translate.instant('IMPORT_TEMPLATE_S1.COMMA'),
      ';': this.translate.instant('IMPORT_TEMPLATE_S1.SEMICOLON'),
      tab: this.translate.instant('IMPORT_TEMPLATE_S1.TAB'),
    };

    Swal.fire({
      type: 'question',
      title: this.translate.instant('IMPORT_TEMPLATE_S1.TITLE'),
      footer: `<span style="margin-left: auto">IMPORT_TEMPLATE_S1</span>`,
      width: 465,
      allowEscapeKey: true,
      showCancelButton: true,
      cancelButtonText: this.translate.instant('IMPORT_TEMPLATE_S1.CANCEL'),
      confirmButtonText: this.translate.instant('IMPORT_TEMPLATE_S1.OK'),
      input: 'radio',
      inputOptions: inputOptions,
      inputValidator: (value) => {
        return new Promise((resolve, reject) => {
          if (value) {
            resolve(value);
            Swal.enableConfirmButton();
          } else {
            Swal.disableConfirmButton();
            reject(this.translate.instant('IMPORT_TEMPLATE_S1.INVALID'));
          }
        });
      },
      onOpen: function () {
        Swal.disableConfirmButton();
        Swal.getContent().addEventListener('click', function (e) {
          Swal.enableConfirmButton();
        });
      },
    }).then((separator) => {
      if (separator.value) {
        const fileType = separator.value;
        this.openImportDialog(fileType);
      }
    });
  }

  openImportDialog(fileType) {
    this.dialog
      .open(ImportTemplateEvalCompetenceDialogComponent, {
        width: '500px',
        minHeight: '200px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
        data: {
          titleId: this.selectedRncpTitleId,
          classId: this.selectedClassId,
          type: 'academic',
          delimeter: fileType,
        },
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp) {
          this.ngOnInit();
        }
      });
  }

  openBlock(blockIndex: number) {
    this.getBlockFormArray.at(blockIndex).get('isExpanded').setValue(true);
    this.getCompetenceFormArray(blockIndex).controls.forEach((competence) => {
      competence.get('isExpanded').setValue(true);
    });
  }

  closeBlock(blockIndex: number) {
    this.getBlockFormArray.at(blockIndex).get('isExpanded').setValue(false);
    this.getCompetenceFormArray(blockIndex).controls.forEach((competence) => {
      competence.get('isExpanded').setValue(false);
    });
  }

  openCompetence(blockIndex: number, compIndex: number) {
    this.getCompetenceFormArray(blockIndex).at(compIndex).get('isExpanded').setValue(true);
  }

  closeCompetence(blockIndex: number, compIndex: number) {
    this.getCompetenceFormArray(blockIndex).at(compIndex).get('isExpanded').setValue(false);
  }

  csvTypeSelectionDownload() {
    const inputOptions = {
      ',': this.translate.instant('IMPORT_TEMPLATE_S1.COMMA'),
      ';': this.translate.instant('IMPORT_TEMPLATE_S1.SEMICOLON'),
      tab: this.translate.instant('IMPORT_TEMPLATE_S1.TAB'),
    };

    Swal.fire({
      type: 'question',
      title: this.translate.instant('IMPORT_TEMPLATE_S1.TITLE'),
      footer: `<span style="margin-left: auto">IMPORT_TEMPLATE_S1</span>`,
      width: 465,
      allowEscapeKey: true,
      showCancelButton: true,
      cancelButtonText: this.translate.instant('IMPORT_TEMPLATE_S1.CANCEL'),
      confirmButtonText: this.translate.instant('IMPORT_TEMPLATE_S1.OK'),
      input: 'radio',
      inputOptions: inputOptions,
      inputValidator: (value) => {
        return new Promise((resolve, reject) => {
          if (value) {
            resolve(value);
            Swal.enableConfirmButton();
          } else {
            Swal.disableConfirmButton();
            reject(this.translate.instant('IMPORT_TEMPLATE_S1.INVALID'));
          }
        });
      },
      onOpen: function () {
        Swal.disableConfirmButton();
        Swal.getContent().addEventListener('click', function (e) {
          Swal.enableConfirmButton();
        });
      },
    }).then((separator) => {
      if (separator.value) {
        const fileType = separator.value;
        this.downloadCSVTemplate(fileType);
      }
    });
  }

  downloadCSVTemplate(fileType) {
    let url = environment.apiUrl;
    url = url.replace('graphql', '');
    const element = document.createElement('a');
    let path = '';
    const lang = this.translate.currentLang.toLowerCase();
    if (lang === 'en') {
      if (fileType === ',') {
        path = 'comma_en.csv';
      } else if (fileType === ';') {
        path = 'semicolon_en.csv';
      } else if (fileType === 'tab') {
        path = 'tab_en.csv';
      }
    } else {
      if (fileType === ',') {
        path = 'comma_fr.csv';
      } else if (fileType === ';') {
        path = 'semicolon_fr.csv';
      } else if (fileType === 'tab') {
        path = 'tab_fr.csv';
      }
    }
    let importStudentTemlate = 'download/file?type=template&name=';
    importStudentTemlate = importStudentTemlate + '_academic_skill_';
    element.href = url + importStudentTemlate + path;

    element.target = '_blank';
    element.download = 'Template Import CSV';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }

  onScroll(event) {
    this.scroll = true;

  }
  exportData() {
    Swal.close();
    const data = [];
    this.dataBlock.forEach((block) => {
      let obj = [];
      let name = this.utilService.cleanHTML(block.name);
      obj[0] = block.ref_id + ' ' + name;
      data.push(obj);
      if (block.competence_templates_id && block.competence_templates_id.length) {
        block.competence_templates_id.forEach((competence) => {
          name = this.utilService.cleanHTML(competence.name);
          obj = [];
          obj[0] = competence.ref_id + ' ' + name;
          data.push(obj);
          if (competence.criteria_of_evaluation_templates_id && competence.criteria_of_evaluation_templates_id.length) {
            competence.criteria_of_evaluation_templates_id.forEach((criteria) => {
              name = this.utilService.cleanHTML(criteria.name);
              obj = [];
              obj[0] = criteria.ref_id + ' ' + name;
              data.push(obj);
            });
          }
        });
      }
      obj = [];
      obj[0] = '';
      data.push(obj);
    });

    const valueRange = { values: data };
    const today = moment().format('DD-MM-YYYY');
    const title = this.exportName + '_' + today;
    const sheetID = 0;
    const sheetData = {
      spreadsheetId: '17EO0Hu53An7LS6OcXmx3BwOTlm9kkLurbRfOLSGe5Mc',
      sheetId: sheetID,
      range: 'A1',
    };
    this.exportCsvService.createAndUpdateSpreadsheet(valueRange, title, sheetData);
  }

  downloadQuestion(fileUrl: string) {
    const url = `${environment.apiUrl}/fileuploads/${fileUrl}?download=true`.replace('/graphql', '');
    window.open(url, '_blank');
  }
}
