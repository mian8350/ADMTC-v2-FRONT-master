import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, ViewChild, HostListener, ViewChildren, ElementRef, QueryList } from '@angular/core';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js'
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormArray, PatternValidator, UntypedFormControl } from '@angular/forms';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { Observable } from 'rxjs';
import { debounceTime, startWith, map } from 'rxjs/operators';
import * as _ from 'lodash';
import { SubSink } from 'subsink';
import { GlobalErrorService } from 'app/service/global-error-service/global-error-service.service';
import { removeSpaces } from 'app/service/customvalidator.validator';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { environment } from 'environments/environment';
import { ConditionScorePreviewComponent } from './condition-score-preview/condition-score-preview.component';
import { STYLE } from './condition-score-preview/pdf-styles';
import { isNull } from 'util';
import { AddBlockConditionDialogComponent } from '../../expertise/add-block-condition-dialog/add-block-condition-dialog.component';
import { UtilityService } from 'app/service/utility/utility.service';
import { ConditionsService } from 'app/service/conditions/conditions.service';

interface EvaluationRetakeBlock {
  selected_evaluation_retake_block: string; // fill with evaluation id
  selected_evaluation_retake_block_temp: {
    block_of_competence_condition_name: string; // block name
    subject_name: string; // subject name
    selected_evaluation_retake_block_name: string; // evaluation name
  };
}

@Component({
  selector: 'ms-second-step-score',
  templateUrl: './second-step-score.component.html',
  styleUrls: ['./second-step-score.component.scss'],
})
export class SecondStepScoreComponent implements OnInit, OnDestroy {
  private subs = new SubSink();
  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  @Input() typeEvaluation: string;
  @Input() subTypeEvaluation: string;
  @Input() className: string;
  @Input() titleName: string;
  @Input() titleLongName: string;
  @Input() evaMaxPoint: number;
  @Input() evaluationStep: string;
  @Output() updateStep = new EventEmitter<string>();
  @Output() update = new EventEmitter<any>();
  @ViewChild('conditionPdf', { static: false }) conditionPdf: ConditionScorePreviewComponent;
  @ViewChildren('blockPanel') blockPanel: QueryList<ElementRef>;
  blockValue = null;

  formTotalPoint: number;
  blockList = [];
  filteredBlock: Observable<any[]>;
  savedBlockList = [];
  savedSubjectOfTranversal = [];
  maxValue;
  conditionData;

  evaluationRetakeBlockMap = new Map<string, EvaluationRetakeBlock[]>();
  selectedEvaluationRetakeBlock = new UntypedFormControl(null);

  // forms
  conditionOfAwardForm: UntypedFormGroup;

  // spinner on waiting for be
  isWaitingForResponse = false;

  // retake block data
  retakeBlockList = [];

  // transversal subject list;
  transversalSubjectList = [];

  // Is condition has transversal block
  isTransversalBlockExist = false;

  // Dummy data to play around
  competencyList = ['COmp A', 'Comp B', 'coMp C'];
  competencyDisabled = [true, true, true, true];
  subjectList = ['SubJ A', 'SuBj B'];
  subjectDisabled = [true, true, true];
  testList = ['Test A'];
  evaluationDisabled = [true, true, true];
  isSubjectTranversal = false;

  specializations = [];
  selectedSpec = [];

  // Test Type Evaluation
  evaluationTyoe = [
    {
      name: 'Oral',
      value: 'oral',
    },
    {
      name: 'Written',
      value: 'written',
    },
    {
      name: 'Memoire-ECRIT',
      value: 'memoire_ecrit',
    },
    {
      name: 'Memoire-ORAL',
      value: 'memoire_oral',
    },
    {
      name: 'free-continuous-control',
      value: 'free_continuous_control',
    },
    {
      name: 'mentor-evaluation',
      value: 'mentor_evaluation',
    },
    {
      name: 'Memoire oral non jury',
      value: 'memoire_oral_non_jury',
    },
  ];

  resultVisibility = [
    {
      name: 'Visible after Correction Finish',
      value: 'after_correction',
    },
    {
      name: 'Visible after Jury Decission for Final Transcript is Finish',
      value: 'after_jury_decision',
    },
    {
      name: 'Never Visible to Student',
      value: 'never_visible',
    },
  ];

  // ckeditor configuration
  public Editor = DecoupledEditor;
  private timeOutVal: any;
  tempEvalPoint: any;

  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  constructor(
    private fb: UntypedFormBuilder,
    private rncpTitleService: RNCPTitlesService,
    private translate: TranslateService,
    private globalErrorService: GlobalErrorService,
    private transcriptBuilderService: TranscriptBuilderService,
    public dialog: MatDialog,
    private utilService: UtilityService,
    private conditionService: ConditionsService,
  ) {}

  ngOnInit() {
    this.competencyList.forEach((comp) => {
      if (comp) {
        this.competencyDisabled.push(false);
      }
    });

    // Caught error from global error handler
    this.subs.sink = this.globalErrorService.globalErrorData$.subscribe((isError) => {
      if (isError) {
        this.isWaitingForResponse = false;
        this.globalErrorService.setGlobalError(false);
      }
    });



    this.getSpecList();
    this.initConditionOfAwardForm();
    this.populateBlockData();
  }

  initConditionOfAwardForm() {
    this.conditionOfAwardForm = this.fb.group({
      rncp_title_id: [this.selectedRncpTitleId],
      class_id: [this.selectedClassId],
      block_of_competence_condition_input: this.fb.array([]),
    });
  }

  initBlockFormArray(isTranversal?: boolean) {
    let currentBlockTotal = 0;
    if (this.subTypeEvaluation === 'point_weight' || this.subTypeEvaluation === 'point_coefficient') {
      currentBlockTotal = this.calculateTotalBlock();
    }
    return this.fb.group({
      _id: [null],
      block_rncp_reference: [null, [removeSpaces]],
      rncp_title: [this.selectedRncpTitleId],
      class_id: [this.selectedClassId],
      block_of_competence_condition: ['', [Validators.required, removeSpaces]],
      description: [''],
      max_point:
        this.subTypeEvaluation &&
        (this.subTypeEvaluation === 'point_weight' || this.subTypeEvaluation === 'point_coefficient') &&
        !isTranversal
          ? [
              this.evaMaxPoint > currentBlockTotal ? this.evaMaxPoint - currentBlockTotal : null,
              [Validators.required, Validators.pattern('^[0-9]+[0-9]*$')],
            ]
          : [null],
      min_score: [null],
      block_of_competence_condition_credit: [null, Validators.pattern('^[0-9]+(\.[0-9]{1,2})?$')],
      transversal_block: [false],
      is_retake_by_block: [false],
      selected_block_retake: [null],
      selected_block_retake_name: [null],
      is_specialization: [false],
      specialization: [null],
      count_for_title_final_score: [false],
      page_break: [false],
      subjects: this.fb.array([]),
      order: [null],
      is_one_of_test_published: [false],
    });
  }

  initSubjectFormArray(maxTotal?: number, isTranversalSubject?: boolean) {
    return this.fb.group({
      _id: [null],
      rncp_title: [this.selectedRncpTitleId],
      class_id: [this.selectedClassId],
      is_subject_transversal_block: [false],
      subject_transversal_block_id: [null],
      add_subject_transversal_block: this.fb.group({
        subject_transversal_block_name: [null],
        block_of_competence_condition: [null],
      }),
      subject_name: !isTranversalSubject ? ['', [Validators.required, removeSpaces]] : [null],
      minimum_score_for_certification: [0],
      coefficient: this.subTypeEvaluation === 'mark' ? (isTranversalSubject ? [null] : [0, Validators.required]) : [null],
      max_point:
        (this.subTypeEvaluation === 'point_weight' || this.subTypeEvaluation === 'point_coefficient')
          ? isTranversalSubject
            ? [null]
            : [maxTotal >= 0 ? maxTotal : 0, [Validators.required, Validators.pattern('^[0-9]+[0-9]*$')]]
          : [null],
      count_for_title_final_score: [true],
      credit: [null],
      evaluations: this.fb.array([]),
      order: [null]
    });
  }

  initEvaluationFormArray() {
    return this.fb.group({
      _id: [null],
      evaluation: ['', [Validators.required, removeSpaces]],
      type: [null, Validators.required],
      weight: [null, (this.subTypeEvaluation === 'point_weight' || this.subTypeEvaluation === 'mark') ? Validators.required : null],
      coefficient: [null, this.subTypeEvaluation === 'point_coefficient' ? Validators.required : null],
      minimum_score: [null, Validators.min(0)],
      result_visibility: [null, Validators.required],
      parallel_intake: [false],
      auto_mark: [null, Validators.pattern('^[0-9]$|^0[1-9]$|^1[0-9]$|^20$')], // regex to allow 0 to 20
      retake_during_the_year: [false],
      student_eligible_to_join: [null, Validators.pattern('^[0-9]$|^0[1-9]$|^1[0-9]$|^20$')],
      retake_when_absent_justified: [false],
      retake_when_absent_not_justified: [false],
      use_different_notation_grid: [false],
      retake_evaluation: this.fb.group({
        _id: [null],
        evaluation: [null],
        type: [null],
      }),
      score_not_calculated_for_retake_block: [false],
      test_is_not_retake_able_in_retake_block: [false], // show or hide Evaluation dropdown in Retake Block section
      selected_evaluation_retake_block: [null], // fill with evaluation id from response
      selected_evaluation_retake_block_temp: this.fb.group({
        // data for "Select Evaluation in Retake Block"
        block_of_competence_condition_name: [null], // block name
        subject_name: [null], // subject name
        selected_evaluation_retake_block_name: [null], // evaluation name
      }),
      order: [null]
    });
  }

  getSpecList() {
    this.subs.sink = this.rncpTitleService.getSpecializationByClass(this.selectedClassId).subscribe((response) => {
      if (response) {
        if (response.specializations && response.specializations.length) {
          this.specializations = response.specializations;
        } else {
          this.specializations = [];
        }
      }

    });
  }

  /*
   * set the dropdown list in 'Select Evaluation in Retake Block' section
   * Map the data with selected_block_retake as key and evalRetakeBlockArray as value
   */
  setEvaluationRetakeBlockMap(conditionData) {
    const resp = _.cloneDeep(conditionData);
    if (resp && resp.length) {
      this.subs.sink = resp.forEach((blockData, blockIndex) => {
        if (blockData && blockData.subjects && blockData.subjects.length >= 0) {
          blockData.subjects.forEach((subjectData, subjectIndex) => {
            const evalRetakeBlockArray = [];
            if (subjectData && subjectData.evaluations && subjectData.evaluations.length) {
              subjectData.evaluations.forEach((evalData, evalIndex) => {
                // create array to add dropdown data for 'Select Evaluation in Retake Block' section
                evalRetakeBlockArray.push({
                  selected_evaluation_retake_block: evalData._id ? evalData._id : null,
                  selected_evaluation_retake_block_temp: {
                    block_of_competence_condition_name: blockData.block_of_competence_condition
                      ? blockData.block_of_competence_condition
                      : '',
                    subject_name: subjectData.subject_name ? subjectData.subject_name : '',
                    selected_evaluation_retake_block_name: evalData.evaluation ? evalData.evaluation : '',
                  },
                });
              });
              if (blockData.selected_block_retake) {
                // if key already exist, add the value of it with current block's evalRetakeBlockArray
                const existingEvalRetakeBlock = this.evaluationRetakeBlockMap.get(blockData.selected_block_retake._id);
                let retakeTest = existingEvalRetakeBlock ? [...existingEvalRetakeBlock, ...evalRetakeBlockArray] : evalRetakeBlockArray;
                retakeTest = _.uniqBy(retakeTest, 'selected_evaluation_retake_block');
                this.evaluationRetakeBlockMap.set(blockData.selected_block_retake._id, retakeTest);
              }
            }
          });
        }
      });

    }
  }

  populateBlockData() {
    this.isWaitingForResponse = true;
    this.subs.sink = this.rncpTitleService
      .getAllBlockOfCompetenceConditions(this.selectedRncpTitleId, this.selectedClassId)
      .subscribe((response) => {
        const resp = _.cloneDeep(response);
        if (resp && resp.length >= 0) {
          this.conditionData = resp;
          this.initList(resp);
          this.setEvaluationRetakeBlockMap(resp);
          resp.forEach((blockData, blockIndex) => {
            // Change block format data and create empty block form
            if (blockData && blockData.rncp_title && typeof blockData.rncp_title === 'object' && blockData.rncp_title._id) {
              blockData.rncp_title = blockData.rncp_title._id;
            }
            if (blockData && blockData.class_id && typeof blockData.class_id === 'object' && blockData.class_id._id) {
              blockData.class_id = blockData.class_id._id;
            }
            if (blockData && blockData.selected_block_retake && typeof blockData.selected_block_retake === 'object') {
              const tempData = blockData.selected_block_retake;

              if (tempData && tempData._id) {
                blockData.selected_block_retake = tempData._id;
              }
              if (tempData && tempData.block_of_competence_condition) {
                blockData.selected_block_retake_name = tempData.block_of_competence_condition;
              }


            }

            // check if transversal block
            let isTranversal = false;
            if (blockData && blockData.transversal_block) {
              isTranversal = true;
              this.isTransversalBlockExist = true;
            }
            if (blockData && !blockData.subjects) {
              blockData.subjects = [];
            }

            // add initialization
            if (blockData && blockData.specialization && typeof blockData.specialization === 'object' && blockData.specialization._id) {
              blockData.specialization = blockData.specialization._id;
              this.selectedSpec.push(blockData.specialization);
            }

            // check if last index, always set page break to false
            if (blockIndex + 1 === resp.length) {
              blockData.page_break = false;
            }

            this.addEmptyBlockFormArray(isTranversal);
            this.competencyDisabled.push(true);

            // Condition for slider
            if (blockData && blockData.is_one_of_test_published) {
              this.blockFormArray.at(blockIndex).get('is_retake_by_block').reset();
              this.blockFormArray.at(blockIndex).get('is_retake_by_block').disable();
              this.blockFormArray.at(blockIndex).get('transversal_block').reset();
              this.blockFormArray.at(blockIndex).get('transversal_block').disable();
              this.blockFormArray.at(blockIndex).get('is_specialization').reset();
              this.blockFormArray.at(blockIndex).get('is_specialization').disable();
              this.blockFormArray.at(blockIndex).get('count_for_title_final_score').reset();
              this.blockFormArray.at(blockIndex).get('count_for_title_final_score').disable();
              this.blockFormArray.at(blockIndex).updateValueAndValidity();
            } else if (blockData && blockData.transversal_block) {
              this.blockFormArray.at(blockIndex).get('max_point').reset();
              this.blockFormArray.at(blockIndex).get('max_point').disable();
              this.blockFormArray.at(blockIndex).get('min_score').disable();
              this.blockFormArray.at(blockIndex).get('min_score').reset();
              this.blockFormArray.at(blockIndex).get('block_of_competence_condition_credit').reset();
              this.blockFormArray.at(blockIndex).get('is_retake_by_block').disable();
              this.blockFormArray.at(blockIndex).get('is_specialization').reset();
              this.blockFormArray.at(blockIndex).get('is_specialization').disable();
              this.blockFormArray.at(blockIndex).get('count_for_title_final_score').reset();
              this.blockFormArray.at(blockIndex).get('count_for_title_final_score').disable();
            } else if (blockData && blockData.is_retake_by_block) {
              this.blockFormArray.at(blockIndex).get('transversal_block').reset();
              this.blockFormArray.at(blockIndex).get('transversal_block').disable();
              this.blockFormArray.at(blockIndex).get('is_specialization').reset();
              this.blockFormArray.at(blockIndex).get('is_specialization').disable();
              this.blockFormArray.at(blockIndex).get('count_for_title_final_score').reset();
              this.blockFormArray.at(blockIndex).get('count_for_title_final_score').disable();
            } else if ((blockData && blockData.is_specialization) || blockData.count_for_title_final_score) {
              this.blockFormArray.at(blockIndex).get('transversal_block').reset();
              this.blockFormArray.at(blockIndex).get('transversal_block').disable();
              this.blockFormArray.at(blockIndex).get('is_retake_by_block').reset();
              this.blockFormArray.at(blockIndex).get('is_retake_by_block').disable();
            }

            // Create empty subject form
            if (blockData && blockData.subjects && blockData.subjects.length >= 0) {
              blockData.subjects.forEach((subjectData, subjectIndex) => {
                const tempSubjectData = _.cloneDeep(subjectData);

                let isTranversalSubject = false;
                if (
                  tempSubjectData && tempSubjectData.is_subject_transversal_block &&
                  tempSubjectData.subject_transversal_block_id &&
                  typeof tempSubjectData.subject_transversal_block_id === 'object' &&
                  tempSubjectData.subject_transversal_block_id._id
                ) {
                  subjectData.subject_transversal_block_id = tempSubjectData.subject_transversal_block_id._id;
                  isTranversalSubject = true;
                } else {
                  subjectData.subject_transversal_block_id = null;
                }

                if (subjectData && subjectData.rncp_title && typeof subjectData.rncp_title === 'object' && subjectData.rncp_title._id) {
                  subjectData.rncp_title = subjectData.rncp_title._id;
                }
                if (subjectData && subjectData.class_id && typeof subjectData.class_id === 'object' && subjectData.class_id._id) {
                  subjectData.class_id = subjectData.class_id._id;
                }

                if (
                  tempSubjectData && tempSubjectData.is_subject_transversal_block &&
                  tempSubjectData.subject_transversal_block_id &&
                  typeof tempSubjectData.subject_transversal_block_id === 'object' &&
                  tempSubjectData.subject_transversal_block_id.subject_name
                ) {
                  subjectData.subject_name = tempSubjectData.subject_transversal_block_id.subject_name;
                  subjectData.add_subject_transversal_block = {
                    subject_transversal_block_name: tempSubjectData.subject_transversal_block_id.subject_name,
                    block_of_competence_condition: blockData.block_of_competence_condition,
                  };
                }
                this.addEmptySubjectFormArray(blockIndex, isTranversalSubject);
                this.subjectDisabled.push(true);

                if (subjectData && subjectData.evaluations && subjectData.evaluations.length) {
                  subjectData.evaluations.forEach((evalData, evalIndex) => {
                    this.addEmptyEvaluationFormArray(blockIndex, subjectIndex);
                    this.evaluationDisabled.push(true);
                    if (evalData.selected_evaluation_retake_block) {
                      this.fillRetakeByBlockForm(blockData, subjectData, evalData);

                    }
                  });
                } else if (!subjectData.evaluations) {
                  subjectData.evaluations = [];
                }
              });
            }
          });
          // this.conditionOfAwardForm.get('block_of_competence_condition_input').patchValue(resp);
          this.setBlockConditionArray(resp);
        }
        this.isWaitingForResponse = false;
        this.conditionService.validationDataFormControls = this.conditionOfAwardForm.get('block_of_competence_condition_input')['controls'];
      });
  }

  setBlockConditionArray(resp) {

    resp.forEach((blockData, blockIndex) => {
      if (blockData._id) {
        this.blockFormArray.at(blockIndex).get('_id').setValue(blockData._id);
      }
      if (blockData.block_rncp_reference) {
        this.blockFormArray.at(blockIndex).get('block_rncp_reference').setValue(blockData.block_rncp_reference);
      }
      if (blockData.block_of_competence_condition) {
        this.blockFormArray.at(blockIndex).get('block_of_competence_condition').setValue(blockData.block_of_competence_condition);
      }
      if (blockData.block_of_competence_condition_credit) {
        this.blockFormArray
          .at(blockIndex)
          .get('block_of_competence_condition_credit')
          .setValue(blockData.block_of_competence_condition_credit);
      }
      this.blockFormArray.at(blockIndex).get('is_one_of_test_published').setValue(blockData.is_one_of_test_published);
      if (blockData.count_for_title_final_score) {
        this.blockFormArray.at(blockIndex).get('count_for_title_final_score').setValue(blockData.count_for_title_final_score);
      }
      if (blockData.description) {
        this.blockFormArray.at(blockIndex).get('description').setValue(blockData.description);
      }
      if (blockData.max_point >= 0) {
        this.blockFormArray.at(blockIndex).get('max_point').setValue(blockData.max_point);
      }
      if (blockData.min_score) {
        this.blockFormArray.at(blockIndex).get('min_score').setValue(blockData.min_score);
      }
      if (blockData.is_retake_by_block) {
        this.blockFormArray.at(blockIndex).get('is_retake_by_block').setValue(blockData.is_retake_by_block);
      }
      if (blockData.block_of_tempelate_competence) {
        this.blockFormArray.at(blockIndex).get('block_of_tempelate_competence').setValue(blockData.block_of_tempelate_competence);
      }
      if (blockData.block_of_tempelate_soft_skill) {
        this.blockFormArray.at(blockIndex).get('block_of_tempelate_soft_skill').setValue(blockData.block_of_tempelate_soft_skill);
      }
      if (blockData.is_specialization) {
        this.blockFormArray.at(blockIndex).get('is_specialization').setValue(blockData.is_specialization);
      }
      if (blockData.specialization) {
        this.blockFormArray.at(blockIndex).get('specialization').setValue(blockData.specialization);
      }
      if (blockData.page_break) {
        this.blockFormArray.at(blockIndex).get('page_break').setValue(blockData.page_break);
      }
      if (blockData.transversal_block) {
        this.blockFormArray.at(blockIndex).get('transversal_block').setValue(blockData.transversal_block);
      }
      if (blockData.selected_block_retake) {
        this.blockFormArray.at(blockIndex).get('selected_block_retake').setValue(blockData.selected_block_retake);
      }
      if (blockData.order) {
        this.blockFormArray.at(blockIndex).get('order').setValue(blockData.order);
      }
      if (blockData.subjects && blockData.subjects.length) {
        blockData.subjects.forEach((subjectsData, subjectsIndex) => {
          if (subjectsData._id) {
            this.getSubjectArray(blockIndex).at(subjectsIndex).get('_id').setValue(subjectsData._id);
          }
          if (subjectsData.count_for_title_final_score) {
            this.getSubjectArray(blockIndex)
              .at(subjectsIndex)
              .get('count_for_title_final_score')
              .setValue(subjectsData.count_for_title_final_score);
          }
          if (subjectsData.block_of_competence_condition) {
            this.getSubjectArray(blockIndex)
              .at(subjectsIndex)
              .get('block_of_competence_condition')
              .setValue(subjectsData.block_of_competence_condition);
          }
          if (subjectsData.subject_transversal_block_name) {
            this.getSubjectArray(blockIndex)
              .at(subjectsIndex)
              .get('subject_transversal_block_name')
              .setValue(subjectsData.subject_transversal_block_name);
          }
          if (subjectsData.subject_transversal_block_id) {
            this.getSubjectArray(blockIndex)
              .at(subjectsIndex)
              .get('subject_transversal_block_id')
              .setValue(subjectsData.subject_transversal_block_id);
          }
          if (subjectsData.max_point >= 0) {
            this.getSubjectArray(blockIndex).at(subjectsIndex).get('max_point').setValue(subjectsData.max_point);
          }
          if (subjectsData.coefficient) {
            this.getSubjectArray(blockIndex).at(subjectsIndex).get('coefficient').setValue(subjectsData.coefficient);
          }
          if (subjectsData.credit) {
            this.getSubjectArray(blockIndex).at(subjectsIndex).get('credit').setValue(subjectsData.credit);
          }
          if (subjectsData.order) {
            this.getSubjectArray(blockIndex).at(subjectsIndex).get('order').setValue(subjectsData.order);
          }
          if (subjectsData.is_subject_transversal_block) {
            this.getSubjectArray(blockIndex)
              .at(subjectsIndex)
              .get('is_subject_transversal_block')
              .setValue(subjectsData.is_subject_transversal_block);
          }
          if (subjectsData.minimum_score_for_certification) {
            this.getSubjectArray(blockIndex)
              .at(subjectsIndex)
              .get('minimum_score_for_certification')
              .setValue(subjectsData.minimum_score_for_certification ? subjectsData.minimum_score_for_certification : 0);
          }
          if (subjectsData.subject_name) {
            this.getSubjectArray(blockIndex).at(subjectsIndex).get('subject_name').setValue(subjectsData.subject_name);
          }
          if (subjectsData.add_subject_transversal_block && subjectsData.add_subject_transversal_block.subject_transversal_block_name && subjectsData.add_subject_transversal_block.block_of_competence_condition) {
            if (!subjectsData.subject_name) {
              this.getSubjectArray(blockIndex).at(subjectsIndex).get('subject_name').patchValue(subjectsData.add_subject_transversal_block.subject_transversal_block_name);
            }
            this.getSubjectArray(blockIndex)
              .at(subjectsIndex)
              .get('add_subject_transversal_block')
              .get('subject_transversal_block_name')
              .patchValue(subjectsData.add_subject_transversal_block.subject_transversal_block_name);
            this.getSubjectArray(blockIndex)
              .at(subjectsIndex)
              .get('add_subject_transversal_block')
              .get('block_of_competence_condition')
              .patchValue(subjectsData.add_subject_transversal_block.block_of_competence_condition);
          }
          if (subjectsData.evaluations && subjectsData.evaluations.length) {
            subjectsData.evaluations.forEach((evaluationsData, evaluationsIndex) => {
              if (evaluationsData._id) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex).at(evaluationsIndex).get('_id').setValue(evaluationsData._id);
              }
              if (evaluationsData.auto_mark) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex)
                  .at(evaluationsIndex)
                  .get('auto_mark')
                  .setValue(evaluationsData.auto_mark);
              }
              if (evaluationsData.evaluation) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex)
                  .at(evaluationsIndex)
                  .get('evaluation')
                  .setValue(evaluationsData.evaluation);
              }
              if (evaluationsData.minimum_score) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex)
                  .at(evaluationsIndex)
                  .get('minimum_score')
                  .setValue(evaluationsData.minimum_score);
              }
              if (evaluationsData.parallel_intake) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex)
                  .at(evaluationsIndex)
                  .get('parallel_intake')
                  .setValue(evaluationsData.parallel_intake);
              }
              if (evaluationsData.result_visibility) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex)
                  .at(evaluationsIndex)
                  .get('result_visibility')
                  .setValue(evaluationsData.result_visibility);
              }
              if (evaluationsData.retake_during_the_year) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex)
                  .at(evaluationsIndex)
                  .get('retake_during_the_year')
                  .setValue(evaluationsData.retake_during_the_year);
              }
              if (evaluationsData.retake_evaluation) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex)
                  .at(evaluationsIndex)
                  .get('retake_evaluation')
                  .setValue(evaluationsData.retake_evaluation);
              }
              if (evaluationsData.retake_when_absent_justified) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex)
                  .at(evaluationsIndex)
                  .get('retake_when_absent_justified')
                  .setValue(evaluationsData.retake_when_absent_justified);
              }
              if (evaluationsData.retake_when_absent_not_justified) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex)
                  .at(evaluationsIndex)
                  .get('retake_when_absent_not_justified')
                  .setValue(evaluationsData.retake_when_absent_not_justified);
              }
              if (evaluationsData.score_not_calculated_for_retake_block) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex)
                  .at(evaluationsIndex)
                  .get('score_not_calculated_for_retake_block')
                  .setValue(evaluationsData.score_not_calculated_for_retake_block);
              }
              if (evaluationsData.selected_evaluation_retake_block) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex)
                  .at(evaluationsIndex)
                  .get('selected_evaluation_retake_block')
                  .setValue(evaluationsData.selected_evaluation_retake_block);
              }

              if (evaluationsData.student_eligible_to_join) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex)
                  .at(evaluationsIndex)
                  .get('student_eligible_to_join')
                  .setValue(evaluationsData.student_eligible_to_join);
              }
              if (evaluationsData.test_is_not_retake_able_in_retake_block) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex)
                  .at(evaluationsIndex)
                  .get('test_is_not_retake_able_in_retake_block')
                  .setValue(evaluationsData.test_is_not_retake_able_in_retake_block);
              }
              if (evaluationsData.type) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex).at(evaluationsIndex).get('type').setValue(evaluationsData.type);
              }
              if (evaluationsData.use_different_notation_grid) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex)
                  .at(evaluationsIndex)
                  .get('use_different_notation_grid')
                  .setValue(evaluationsData.use_different_notation_grid);
              }
              if (evaluationsData.weight) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex).at(evaluationsIndex).get('weight').setValue(evaluationsData.weight);
              }
              if (evaluationsData.coefficient) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex).at(evaluationsIndex).get('coefficient')
                .setValue(evaluationsData.coefficient);
              }
              if (evaluationsData.order) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex).at(evaluationsIndex).get('order')
                .setValue(evaluationsData.order);
              }
            });
          }
        });
      }
    });

  }

  /*
   * @param blockData, subjectData, evalData come from API response of GetAllBlockOfCompetenceConditions
   * fill the selected_evaluation_retake_block and selected_evaluation_retake_block_temp field in evaluation form
   */
  fillRetakeByBlockForm(blockData, subjectData, evalData) {
    const selectedEvaluationRetake = this.evaluationRetakeBlockMap.get(blockData._id);


    // get selected value in evaluationRetakeBlockMap, then populate that value to form
    if (selectedEvaluationRetake && selectedEvaluationRetake.length) {
      const evalRetakeBlockIds = [];
      const evalRetakeBlockDatas = []
      for (const retakeTest of evalData.selected_evaluation_retake_block) {
        const selectedRetakeTest = selectedEvaluationRetake.find(retakeMap => {
          return retakeMap.selected_evaluation_retake_block === retakeTest._id
        });
        if (selectedRetakeTest) {
          evalRetakeBlockIds.push(selectedRetakeTest.selected_evaluation_retake_block);
          evalRetakeBlockDatas.push(selectedRetakeTest.selected_evaluation_retake_block_temp);
        }
      }
      evalData['selected_evaluation_retake_block'] = evalRetakeBlockIds;
      evalData['selected_evaluation_retake_block_temp'] = evalRetakeBlockDatas;
    }
  }

  initList(blocks) {
    // Init block list
    const currentBlock = _.cloneDeep(blocks);
    if (currentBlock && currentBlock.length) {
      this.blockList = _.filter(currentBlock, (block) => !block.transversal_block && !block.is_retake_by_block);
    }

    // Init transversal subject list
    const allTranversalBlock = _.filter(currentBlock, (block) => block.transversal_block);
    if (allTranversalBlock && allTranversalBlock.length) {
      const TranversalBlock = allTranversalBlock[0];
      if (TranversalBlock && TranversalBlock.subjects && TranversalBlock.subjects.length) {
        this.transversalSubjectList = TranversalBlock.subjects;

      }
    }
  }

  isEvaluationTotalWeightMoreThan100(blocks: any): boolean {
    let isMoreThan100 = false;
    blocks.forEach((block, blockIndex) => {
      if (block.subjects && block.subjects.length) {
        block.subjects.forEach((subject, subjIndex) => {
          const evalData = _.cloneDeep(this.getEvaluationFormArray(blockIndex, subjIndex).value);
          if (this.calculateTotalEval(evalData) > 100) {
            isMoreThan100 = true;
          }
        });
      }
    });
    return isMoreThan100;
  }

  isEvaluationTotalWeightLessThan100(blocks: any): {isLessThan100: boolean, subjectList: string[]} {
    let isLessThan100 = false;
    const subjectsName = [];
    blocks.forEach((block, blockIndex) => {
      if (block.subjects && block.subjects.length) {
        block.subjects.forEach((subject, subjIndex) => {

          const evalData = _.cloneDeep(this.getEvaluationFormArray(blockIndex, subjIndex).value);
          // *************** Check per subject, if evaluation inside the subject has less than 100% of weight.
          // Only apply/checked if the subject has evaluation.
          if (evalData && evalData.length && this.calculateTotalEval(evalData) < 100) {
            isLessThan100 = true;
            subjectsName.push(subject.subject_name);
          }
        });
      }
    });
    return {isLessThan100: isLessThan100, subjectList: subjectsName};
  }

  convertStringToNumberType(blocks) {
    // loop all the block to change data from string to number
    blocks.forEach((blockData) => {
      blockData.max_point = blockData.max_point ? +blockData.max_point : 0;
      blockData.min_score = +blockData.min_score;
      blockData.block_of_competence_condition_credit = +blockData.block_of_competence_condition_credit;
      if (blockData.subjects) {
        blockData.subjects.forEach(subject => {
          if (subject.evaluations) {
            subject.evaluations.forEach(evaluation => {
              let evalRetakeBlock = [];
              evalRetakeBlock = evaluation.selected_evaluation_retake_block && evaluation.selected_evaluation_retake_block.length
                ? evaluation.selected_evaluation_retake_block
                : [];
              evaluation.selected_evaluation_retake_block = evalRetakeBlock;
            });
          }
        });
      }
    });
    return blocks;
  }

  save() {

    if (this.conditionOfAwardForm.valid) {
      let blocks = this.conditionOfAwardForm.get('block_of_competence_condition_input').value;
      blocks = this.convertStringToNumberType(blocks);

      // delete the is_one_of_test_published key as it is not existing in accepted input format
      blocks.forEach(block => {
        if (block.hasOwnProperty('is_one_of_test_published')) {
          delete block['is_one_of_test_published'];
        }
      })
      this.isWaitingForResponse = true;

      const dataIsLessThan100 = this.isEvaluationTotalWeightLessThan100(blocks);
      if (this.isEvaluationTotalWeightMoreThan100(blocks)) {
        Swal.fire({
          allowOutsideClick: false,
          type: 'error',
          title: this.translate.instant('CC2T_S03.TITLE'),
          html: this.translate.instant('CC2T_S03.TEXT'),
          confirmButtonText: this.translate.instant('CC2T_S03.BUTTON'),
        });
        this.isWaitingForResponse = false;
      } else if (this.subTypeEvaluation === 'point_weight' && dataIsLessThan100.isLessThan100) {
        // *************** Creating the sweet alert by looping the subject name
        let subjectLoop = '';

        const subjectLessThan100 = dataIsLessThan100.subjectList;

        subjectLessThan100.forEach(subject => {
          subjectLoop += `<li style="text-align: start"> ${subject} </li>`
        })

        Swal.fire({
          allowOutsideClick: false,
          type: 'error',
          title: this.translate.instant('SAVECONDITION_S2.TITLE'),
          html: this.translate.instant('SAVECONDITION_S2.TEXT', {subjectLoop: subjectLoop}),
          confirmButtonText: this.translate.instant('SAVECONDITION_S2.BUTTON'),
        });
        this.isWaitingForResponse = false;

      } else {

        this.subs.sink = this.rncpTitleService
          .createUpdateBlockOfCompetenceCondition(this.selectedRncpTitleId, this.selectedClassId, blocks)
          .subscribe((resp) => {
            if (resp && resp.data && resp.data.CreateUpdateBlockOfCompetenceCondition && !resp.errors) {
              if (this.subTypeEvaluation && (this.subTypeEvaluation === 'point_weight' || this.subTypeEvaluation === 'point_coefficient')) {
                const payload = {
                  name: this.className,
                  parent_rncp_title: this.selectedRncpTitleId,
                  evaluation_max_point: this.evaMaxPoint,
                };
                this.subs.sink = this.rncpTitleService.updateMaxPoint(this.selectedClassId, payload).subscribe((response) => {
                  if (response) {
                    this.update.emit();
                  }
                });
              }

              if (this.evaluationStep === 'first') {
                const payloadStep = {
                  evaluation_step: 'second',
                };
                this.subs.sink = this.rncpTitleService.saveFirstCondition(this.selectedClassId, payloadStep).subscribe((response) => {

                  if (response) {
                    this.updateStep.emit('second');
                  }
                });
              }
              this.isWaitingForResponse = false;
              Swal.fire({
                allowOutsideClick: false,
                type: 'success',
                title: this.translate.instant('CCED_S01.TITLE'),
                text: this.translate.instant('CCED_S01.TEXT'),
                confirmButtonText: this.translate.instant('CCED_S01.BUTTON_1'),
              }).then(() => {
                this.conditionOfAwardForm.reset();
                this.initConditionOfAwardForm();
                this.populateBlockData();
              });
            } else if (resp.errors && resp.errors.length) {
              const errorMsg = resp.errors[0].message;
              resp.errors.forEach(err => {
                // handle error message like "error_coefficient_evaluation:{"blockIndex":0,"subjectsIndex":[0]}"
                if (err.message.includes('error_coefficient_evaluation')) {
                  const errObj = err.message.split('error_coefficient_evaluation:');
                  // parse error message to object that has blockIndex and subjectsIndex
                  const errBlockSubj: {blockIndex: number, subjectsIndex: number[]} = JSON.parse(errObj[1]);
                  errBlockSubj.subjectsIndex.forEach(subj => {
                    this.getEvaluationFormArray(errBlockSubj.blockIndex, subj).controls.forEach(evaluation => {
                      // set all evaluation inside subject to null so user must input it again
                      evaluation.get('coefficient').setValue(null);
                    })
                  })
                }
              });
              if (errorMsg.includes('error_coefficient_evaluation')) {
                Swal.fire({
                  type: 'error',
                  title: 'Invalid Coefficient!'
                })
              } else {
                Swal.fire({
                  type: 'error',
                  title: errorMsg
                })
              }
              this.isWaitingForResponse = false;
            }
          });
      }
    } else {
      const error = this.findInvalidControlsRecursive(this.conditionOfAwardForm);
      const errorPath = this.mappinInvalidControl(error);
      const namedErrorPath = [];



      if (errorPath && errorPath.length) {
        errorPath.forEach((error) => {
          namedErrorPath.push({
            blockName:
              error.blockIndex || error.blockIndex === 0
                ? this.blockFormArray.at(error.blockIndex).get('block_of_competence_condition').value
                : '',
            subjectName:
              error.subjectIndex || error.subjectIndex === 0
                ? this.getSubjectArray(error.blockIndex).at(error.subjectIndex).get('subject_name').value
                : '',
            evalName:
              error.evalIndex || error.evalIndex === 0
                ? this.getEvaluationFormArray(error.blockIndex, error.subjectIndex).at(error.evalIndex).get('evaluation').value
                : '',
          });
        });
      }



      let textHtml = this.translate.instant('GNS_S02.TEXT');

      if (namedErrorPath && namedErrorPath.length) {
        textHtml += '<br> <ul>';
        namedErrorPath.forEach((name) => {
          textHtml +=
            '<li>' +
            (name.blockName ? this.translate.instant('GNS_S02.BLOCK', { blockName: name.blockName }) : '') +
            (name.subjectName ? this.translate.instant('GNS_S02.SUBJECT', { subjectName: name.subjectName }) : '') +
            (name.evalName ? this.translate.instant('GNS_S02.EVALUATION', { evalName: name.evalName }) : '') + '</li>'
        });
        textHtml += '</ul>';
      }

      Swal.fire({
        allowOutsideClick: false,
        type: 'error',
        title: this.translate.instant('GNS_S02.TITLE'),
        html: textHtml,
        confirmButtonText: this.translate.instant('GNS_S02.BUTTON_1'),
      }).then(() => {
        this.conditionOfAwardForm.markAllAsTouched();
      });
    }
  }

  showData() {

  }

  get blockFormArray(): UntypedFormArray {
    return this.conditionOfAwardForm.get('block_of_competence_condition_input') as UntypedFormArray;
  }

  addEmptyBlockFormArray(isInterval?: boolean) {
    this.blockFormArray.push(this.initBlockFormArray(isInterval ? isInterval : false));
  }

  addBlockFormArray() {
    if (this.subTypeEvaluation === 'point_weight' || this.subTypeEvaluation === 'point_coefficient') {
      if (this.evaMaxPoint > this.calculateTotalBlock()) {
        // this.blockFormArray.push(this.initBlockFormArray());
        const dialogRef = this.dialog.open(AddBlockConditionDialogComponent, {
          width: '600px',
          panelClass: 'certification-rule-pop-up',
          disableClose: true,
        })
        .afterClosed()
        .subscribe((resp) => {
          if (resp && resp.name) {
            if (this.isBlockAlreadyExist(this.utilService.cleanHTML(resp.name))) {
              Swal.fire({
                type: 'error',
                title: this.translate.instant('block_already_exist')
              })
              return;
            }
            this.blockFormArray.push(this.initBlockFormArray());
            const lastIndex = this.blockFormArray.length - 1;
            this.blockFormArray.at(lastIndex).get('block_of_competence_condition').patchValue(this.utilService.cleanHTML(resp.name));
            setTimeout(() => {
              if (this.blockPanel && this.blockPanel.last && this.blockPanel.length) {


                this.blockPanel.toArray()[this.blockPanel.length - 1].nativeElement.scrollIntoView({ behavior: 'smooth' });
              }
            }, 1000);
          }
        });

      } else {
        Swal.fire({
          type: 'error',
          title: this.translate.instant('EXPERTISE.ExpertiseMathchWithMaxPointTitle'),
          text: this.translate.instant('EXPERTISE.ExpertiseMathchWithMaxPointText'),
          confirmButtonText: 'OK',
          allowOutsideClick: false,
        });
      }
    } else {
      // this.blockFormArray.push(this.initBlockFormArray());
      const dialogRef = this.dialog.open(AddBlockConditionDialogComponent, {
        width: '600px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp && resp.name) {
          if (this.isBlockAlreadyExist(this.utilService.cleanHTML(resp.name))) {
            Swal.fire({
              type: 'error',
              title: this.translate.instant('block_already_exist')
            })
            return;
          }
          this.blockFormArray.push(this.initBlockFormArray());
          const lastIndex = this.blockFormArray.length - 1;
          this.blockFormArray.at(lastIndex).get('block_of_competence_condition').patchValue(this.utilService.cleanHTML(resp.name));
          setTimeout(() => {
            if (this.blockPanel && this.blockPanel.last && this.blockPanel.length) {


              this.blockPanel.toArray()[this.blockPanel.length - 1].nativeElement.scrollIntoView({ behavior: 'smooth' });
            }
          }, 1000);
        }
      });
    }
  }

  isBlockAlreadyExist(blockName: string): boolean {
    // check if manual block name already exist
    let isBlockExist = false;
    const blocks = this.blockFormArray.value;

    if (blocks && blocks.length && blockName) {
      for (const block of blocks) {
        if (block.block_of_competence_condition && block.block_of_competence_condition === blockName) {
          isBlockExist = true;
          break;
        }
      }
    }
    return isBlockExist;
  }

  removeBlockFormArray(blockIndex: number) {
    // check if the block form is empty. if still emtpy, then dont need to show sweet alert confirmation
    let emptyBlock = _.cloneDeep(this.initBlockFormArray().value);
    let selectedBlock = _.cloneDeep(this.blockFormArray.at(blockIndex).value);
    delete emptyBlock.max_point;
    delete selectedBlock.max_point;
    emptyBlock = JSON.stringify(emptyBlock);
    selectedBlock = JSON.stringify(selectedBlock);

    if (emptyBlock === selectedBlock) {
      this.blockFormArray.removeAt(blockIndex);
      this.updateSelectedSpec()
      Swal.fire({
        allowOutsideClick: false,
        type: 'success',
        title: this.translate.instant('CC2T_S01b.TITLE'),
        text: this.translate.instant('CC2T_S01b.TEXT'),
        confirmButtonText: this.translate.instant('CC2T_S01b.BUTTON_1'),
      });
    } else {
      let timeDisabled = 5;
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('CC2T_S01.TITLE'),
        text: this.translate.instant('CC2T_S01.TEXT'),
        confirmButtonText: this.translate.instant('CC2T_S01.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('CC2T_S01.BUTTON_2'),
        allowEscapeKey: false,
        allowOutsideClick: false,
        onOpen: () => {
          Swal.disableConfirmButton();
          const confirmBtnRef = Swal.getConfirmButton();
          const intVal = setInterval(() => {
            timeDisabled -= 1;
            confirmBtnRef.innerText = this.translate.instant('CC2T_S01.BUTTON_1') + `(${timeDisabled})`;
          }, 1000);

          this.timeOutVal = setTimeout(() => {
            confirmBtnRef.innerText = this.translate.instant('CC2T_S01.BUTTON_1');
            Swal.enableConfirmButton();
            clearInterval(intVal);
            clearTimeout(this.timeOutVal);
          }, timeDisabled * 1000);
        },
      }).then((result) => {
        clearTimeout(this.timeOutVal);
        if (result.value) {
          if (this.blockFormArray.at(blockIndex).get('_id').value) {
            this.isWaitingForResponse = true;
            this.subs.sink = this.rncpTitleService
              .deleteBlockCompetence(this.blockFormArray.at(blockIndex).get('_id').value)
              .subscribe((resp) => {
                this.isWaitingForResponse = false;

                if (resp && !resp.errors) {
                  this.blockFormArray.removeAt(blockIndex);
                  this.updateSelectedSpec()
                  Swal.fire({
                    allowOutsideClick: false,
                    type: 'success',
                    title: this.translate.instant('CC2T_S01b.TITLE'),
                    text: this.translate.instant('CC2T_S01b.TEXT'),
                    confirmButtonText: this.translate.instant('CC2T_S01b.BUTTON_1'),
                  });
                } else if (resp.errors && resp.errors.length && resp.errors[0].message) {
                  Swal.fire({
                    allowOutsideClick: false,
                    type: 'error',
                    title: this.translate.instant('CC2T_S01C.TITLE'),
                    html: this.translate.instant('CC2T_S01C.TEXT'),
                    confirmButtonText: this.translate.instant('CC2T_S01C.BUTTON_1'),
                  });
                }
              });
          } else {
            this.blockFormArray.removeAt(blockIndex);
            this.updateSelectedSpec()
            Swal.fire({
              allowOutsideClick: false,
              type: 'success',
              title: this.translate.instant('CC2T_S01b.TITLE'),
              text: this.translate.instant('CC2T_S01b.TEXT'),
              confirmButtonText: this.translate.instant('CC2T_S01b.BUTTON_1'),
            });
          }
        }
      });
    }
  }

  changeTranversalBlock(event: MatSlideToggleChange, blockIndex: number) {

    if (event && event.checked) {
      this.isTransversalBlockExist = true;
      const blockData = _.cloneDeep(this.conditionOfAwardForm.get('block_of_competence_condition_input').value);
      if (blockData && blockData.length) {
        const blockTranversal = _.filter(blockData, (block) => block.transversal_block);
        if (blockTranversal && blockTranversal.length >= 2) {
          Swal.fire({
            allowOutsideClick: false,
            type: 'error',
            title: this.translate.instant('Tranversal Block already exists'),
            text: this.translate.instant('Please turn off tranversal block condition first to select another transversal block'),
            confirmButtonText: 'OK',
          }).then(() => {
            this.blockFormArray.at(blockIndex).get('transversal_block').reset();
          });
        } else {
          this.blockFormArray.at(blockIndex).get('max_point').reset();
          this.blockFormArray.at(blockIndex).get('max_point').disable();
          this.blockFormArray.at(blockIndex).get('min_score').disable();
          this.blockFormArray.at(blockIndex).get('min_score').reset();
          this.blockFormArray.at(blockIndex).get('block_of_competence_condition_credit').reset();
          this.blockFormArray.at(blockIndex).get('is_retake_by_block').disable();
          this.blockFormArray.at(blockIndex).get('is_specialization').reset();
          this.blockFormArray.at(blockIndex).get('is_specialization').disable();
          this.blockFormArray.at(blockIndex).get('count_for_title_final_score').reset();
          this.blockFormArray.at(blockIndex).get('count_for_title_final_score').disable();
        }
      }
    } else {
      // Check if there is subject refering to transversal block
      const currentBlock = _.cloneDeep(this.conditionOfAwardForm.get('block_of_competence_condition_input').value);
      let isBlockUsed = false;
      if (currentBlock && currentBlock.length) {
        for (const block of currentBlock) {
          if (block && block.subjects && block.subjects.length && !isBlockUsed) {
            for (const subject of block.subjects) {
              if (subject && subject.is_subject_transversal_block) {
                isBlockUsed = true;
              }
            }
          }
        }
      }

      if (!isBlockUsed) {
        this.isTransversalBlockExist = false;
        if (this.subTypeEvaluation === 'point_weight' || this.subTypeEvaluation === 'point_coefficient') {
          this.blockFormArray.at(blockIndex).get('max_point').enable();
        }
        this.blockFormArray.at(blockIndex).get('min_score').enable();
        this.blockFormArray.at(blockIndex).get('is_retake_by_block').enable();
        this.blockFormArray.at(blockIndex).get('is_specialization').enable();
        this.blockFormArray.at(blockIndex).get('count_for_title_final_score').enable();
      } else {
        Swal.fire({
          type: 'error',
          title: this.translate.instant('CC2T_S04.TITLE'),
          text: this.translate.instant('CC2T_S04.TEXT'),
          confirmButtonText: this.translate.instant('CC2T_S04.BUTTON'),
          allowEscapeKey: false,
          allowOutsideClick: false,
          allowEnterKey: false,
        }).then(() => {
          this.blockFormArray.at(blockIndex).get('transversal_block').patchValue(true, { emitEvent: false, onlySelf: true });
          this.blockFormArray.at(blockIndex).get('min_score').clearValidators();
          this.blockFormArray.at(blockIndex).get('min_score').updateValueAndValidity();
          const tempSubjects = this.getSubjectArray(blockIndex).value;
          if (tempSubjects && tempSubjects.length) {
            tempSubjects.forEach((subject, index) => {
              this.getSubjectArray(blockIndex).at(index).get('minimum_score_for_certification').clearValidators();
              this.getSubjectArray(blockIndex).at(index).get('minimum_score_for_certification').updateValueAndValidity();
            });
          }

        });
      }
    }
  }

  changeRetakeBlock(event: MatSlideToggleChange, blockIndex: number) {
    if (event && event.checked) {

      // *************** If Transversal Block is on, then reset the value of max point because max_point will be hidden START AV-2492
      this.blockFormArray.at(blockIndex).get('max_point').reset();
      this.blockFormArray.at(blockIndex).get('max_point').disable();
      // *************** If Transversal Block is on, then reset the value of max point because max_point will be hidden END AV-2492

      this.getRetakeBlock();
      this.blockFormArray.at(blockIndex).get('transversal_block').reset();
      this.blockFormArray.at(blockIndex).get('transversal_block').disable();
      this.blockFormArray.at(blockIndex).get('is_specialization').reset();
      this.blockFormArray.at(blockIndex).get('is_specialization').disable();
      this.blockFormArray.at(blockIndex).get('count_for_title_final_score').reset();
      this.blockFormArray.at(blockIndex).get('count_for_title_final_score').disable();
    } else {
      this.removeConnectedRetakeBlock(blockIndex);
      this.blockFormArray.at(blockIndex).get('selected_block_retake').reset();
      this.blockFormArray.at(blockIndex).get('selected_block_retake_name').reset();
      this.blockFormArray.at(blockIndex).get('transversal_block').enable();
      this.blockFormArray.at(blockIndex).get('is_specialization').enable();
      this.blockFormArray.at(blockIndex).get('count_for_title_final_score').enable();

      // *************** If Transversal Block is on, then reset the value of max point because max_point will be hidden START AV-2492
      this.blockFormArray.at(blockIndex).get('max_point').reset();
      this.blockFormArray.at(blockIndex).get('max_point').enable();
      // *************** If Transversal Block is on, then reset the value of max point because max_point will be hidden END AV-2492
    }
  }

  removeConnectedRetakeBlock(blockIndex: number) {
    const selectedRetakeBlockId = _.cloneDeep(this.blockFormArray.at(blockIndex).get('selected_block_retake').value);
    // remove selected_block_retake key from evaluationRetakeBlockMap
    // so the "retake by block" section won't show in the connected block
    if (this.evaluationRetakeBlockMap.has(selectedRetakeBlockId)) {
      this.evaluationRetakeBlockMap.delete(selectedRetakeBlockId);
    }
    // remove "retake by block" data in connected block
    for (const [i, block] of this.blockFormArray.controls.entries()) {
      if (block.get('_id').value === selectedRetakeBlockId) {
        for (const [j, subject] of this.getSubjectArray(i).controls.entries()) {
          for (const [k, evaluation] of this.getEvaluationFormArray(i, j).controls.entries()) {
            evaluation.get('score_not_calculated_for_retake_block').setValue(false);
            evaluation.get('test_is_not_retake_able_in_retake_block').setValue(false);
            evaluation.get('selected_evaluation_retake_block').setValue(null);
            evaluation.get('selected_evaluation_retake_block_temp').get('block_of_competence_condition_name').setValue(null);
            evaluation.get('selected_evaluation_retake_block_temp').get('subject_name').setValue(null);
            evaluation.get('selected_evaluation_retake_block_temp').get('selected_evaluation_retake_block_name').setValue(null);
            this.changeConnectEvaluationRetakeBlock({ checked: false }, i, j, k);
          }
        }
        break;
      }
    }
    // remove selected_block_retake data from selected block
    this.blockFormArray.at(blockIndex).get('selected_block_retake').setValue(null);
    this.blockFormArray.at(blockIndex).get('selected_block_retake_name').setValue(null);
  }

  changeSpecializationOrCountForFinal(event: MatSlideToggleChange, blockIndex: number, type?: string) {
    if (event && event.checked) {
      if (type && type === 'isSpecialization') {
        // *************** If Transversal Block is on, then reset the value of max point because max_point will be hidden START AV-2492
        this.blockFormArray.at(blockIndex).get('max_point').setValue(0);
        this.blockFormArray.at(blockIndex).get('max_point').disable();
        this.blockFormArray.at(blockIndex).get('max_point').clearValidators();
        this.blockFormArray.at(blockIndex).get('max_point').updateValueAndValidity();
        this.getSubjectArray(blockIndex).controls.forEach(subj => {
          subj.get('max_point').setValue(0);
        })
        // *************** If Transversal Block is on, then reset the value of max point because max_point will be hidden END AV-2492
      }

      this.blockFormArray.at(blockIndex).get('transversal_block').reset();
      this.blockFormArray.at(blockIndex).get('transversal_block').disable();
      this.blockFormArray.at(blockIndex).get('is_retake_by_block').reset();
      this.blockFormArray.at(blockIndex).get('is_retake_by_block').disable();
    } else {
      this.blockFormArray.at(blockIndex).get('specialization').patchValue(null);
      this.updateSelectedSpec();
      if (
        !this.blockFormArray.at(blockIndex).get('is_specialization').value &&
        !this.blockFormArray.at(blockIndex).get('count_for_title_final_score').value
      ) {
        this.blockFormArray.at(blockIndex).get('transversal_block').enable();
        this.blockFormArray.at(blockIndex).get('is_retake_by_block').enable();
      }

      if (type && type === 'isSpecialization') {
        // *************** If Transversal Block is on, then reset the value of max point because max_point will be hidden START AV-2492
        this.blockFormArray.at(blockIndex).get('max_point').setValue(0);
        this.blockFormArray.at(blockIndex).get('max_point').enable();
        // *************** If Transversal Block is on, then reset the value of max point because max_point will be hidden END AV-2492
      }
    }
  }

  addPageBreak(blockIndex: number) {
    this.blockFormArray.at(blockIndex).get('page_break').patchValue(true);
  }

  removePageBreak(blockIndex: number) {
    this.blockFormArray.at(blockIndex).get('page_break').patchValue(false);
  }

  getSubjectArray(competencyIndex: number): UntypedFormArray {
    return this.blockFormArray.at(competencyIndex).get('subjects') as UntypedFormArray;
  }

  addEmptySubjectFormArray(competencyIndex: number, isTranversalSubject?: boolean) {
    this.getSubjectArray(competencyIndex).push(this.initSubjectFormArray(0, isTranversalSubject));
  }

  addSubjectFormArray(competencyIndex: number) {
    if (
      (this.subTypeEvaluation === 'point_weight' || this.subTypeEvaluation === 'point_coefficient') &&
      !(
        this.blockFormArray.at(competencyIndex).get('transversal_block').value ||
        this.blockFormArray.at(competencyIndex).get('is_specialization').value ||
        this.blockFormArray.at(competencyIndex).get('is_retake_by_block').value
      )
    ) {
      const blockTotal = this.blockFormArray.at(competencyIndex).get('max_point').value;
      const currentTotal = this.calculateTotalSubject(competencyIndex);


      if (blockTotal) {

        if (blockTotal > currentTotal) {
          this.getSubjectArray(competencyIndex).push(this.initSubjectFormArray(blockTotal - currentTotal));
        } else {
          Swal.fire({
            allowOutsideClick: false,
            type: 'error',
            title: this.translate.instant('EXPERTISE.SubjectMathchWithMaxPointTitle'),
            text: this.translate.instant('EXPERTISE.SubjectMathchWithMaxPointText'),
            confirmButtonText: 'OK',
          });
        }
      } else {
        const isSpecializationBlock = this.blockFormArray.at(competencyIndex).get('is_specialization').value;
        const isCountInFinalTranscript = this.blockFormArray.at(competencyIndex).get('count_for_title_final_score').value;
        if (isSpecializationBlock && !isCountInFinalTranscript) {
          this.getSubjectArray(competencyIndex).push(this.initSubjectFormArray(0));
        }
      }
    } else {
      this.getSubjectArray(competencyIndex).push(this.initSubjectFormArray());
    }
  }

  removeSubjectFormArray(competencyIndex: number, subjectIndex: number) {
    // check if the subject form is empty. if still emtpy, then dont need to show sweet alert confirmation
    let emptySubject = _.cloneDeep(this.initSubjectFormArray().value);
    let selectedSubject = _.cloneDeep(this.getSubjectArray(competencyIndex).at(subjectIndex).value);
    delete emptySubject.max_point;
    delete selectedSubject.max_point;
    emptySubject = JSON.stringify(emptySubject);
    selectedSubject = JSON.stringify(selectedSubject);

    if (emptySubject === selectedSubject) {
      this.getSubjectArray(competencyIndex).removeAt(subjectIndex);
      Swal.fire({
        allowOutsideClick: false,
        type: 'success',
        title: this.translate.instant('PARAMETERS-RNCP.TEST.deletedSubjectSuccess'),
        confirmButtonText: this.translate.instant('Yes'),
      });
    } else {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('PARAMETERS-RNCP.TEST.deletedSubjectWarningTitle'),
        text: this.translate.instant('PARAMETERS-RNCP.TEST.deletedSubjectWarningMessage'),
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


          if (this.getSubjectArray(competencyIndex).at(subjectIndex).get('_id').value) {
            this.isWaitingForResponse = true;
            this.subs.sink = this.rncpTitleService
              .deleteSubjectCompetence(this.getSubjectArray(competencyIndex).at(subjectIndex).get('_id').value)
              .subscribe((resp) => {
                this.isWaitingForResponse = false;
                if (resp && !resp.errors) {
                  this.getSubjectArray(competencyIndex).removeAt(subjectIndex);
                  Swal.fire({
                    allowOutsideClick: false,
                    type: 'success',
                    title: this.translate.instant('PARAMETERS-RNCP.TEST.deletedSubjectSuccess'),
                    confirmButtonText: this.translate.instant('Yes'),
                  });
                } else if (resp.errors && resp.errors.length && resp.errors[0].message) {
                  Swal.fire({
                    allowOutsideClick: false,
                    type: 'error',
                    title: this.translate.instant('CC2T_S01C.TITLE'),
                    html: this.translate.instant('CC2T_S01C.TEXT'),
                    confirmButtonText: this.translate.instant('CC2T_S01C.BUTTON_1'),
                  });
                }
              });
          } else {
            this.getSubjectArray(competencyIndex).removeAt(subjectIndex);
            Swal.fire({
              allowOutsideClick: false,
              type: 'success',
              title: this.translate.instant('PARAMETERS-RNCP.TEST.deletedSubjectSuccess'),
              confirmButtonText: this.translate.instant('Yes'),
            });
          }
        }
      });
    }
  }

  changeUseDifferentNotationGrid(event: MatSlideToggleChange, blockIndex: number, subjectIndex: number, evalIndex: number) {
    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('retake_evaluation').get('_id').reset();
    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('retake_evaluation').get('evaluation').reset();
    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('retake_evaluation').get('type').reset();

    if (event && event.checked) {
      this.getEvaluationFormArray(blockIndex, subjectIndex)
        .at(evalIndex)
        .get('retake_evaluation')
        .get('evaluation')
        .setValidators([Validators.required, removeSpaces]);
      this.getEvaluationFormArray(blockIndex, subjectIndex)
        .at(evalIndex)
        .get('retake_evaluation')
        .get('type')
        .setValidators([Validators.required]);
    } else {
      this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('retake_evaluation').get('evaluation').clearValidators();
      this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('retake_evaluation').get('type').clearValidators();
    }

    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('retake_evaluation').get('evaluation').updateValueAndValidity();
    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('retake_evaluation').get('type').updateValueAndValidity();

  }

  changeParallelIntake(event: MatSlideToggleChange, blockIndex: number, subjectIndex: number, evalIndex: number) {
    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('auto_mark').reset();

    if (event && event.checked) {
      this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('auto_mark').setValidators([Validators.required]);
    } else {
      this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('auto_mark').clearValidators();
    }

    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('auto_mark').updateValueAndValidity();

  }

  changeRetakeDuringTheYear(event: MatSlideToggleChange, blockIndex: number, subjectIndex: number, evalIndex: number) {
    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('student_eligible_to_join').reset();
    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('retake_when_absent_justified').setValue(false);
    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('retake_when_absent_not_justified').setValue(false);
    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('use_different_notation_grid').setValue(false);

    if (event && event.checked) {
      this.getEvaluationFormArray(blockIndex, subjectIndex)
        .at(evalIndex)
        .get('student_eligible_to_join')
        .setValidators([Validators.required]);
    } else {
      this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('student_eligible_to_join').clearValidators();
    }

    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('student_eligible_to_join').updateValueAndValidity();

  }

  changeSubjectIsTranversal(event: MatSlideToggleChange, blockIndex: number, subjectIndex: number) {
    if (event && event.checked) {
      this.getSubjectArray(blockIndex).at(subjectIndex).get('count_for_title_final_score').patchValue(false);
      this.getSubjectArray(blockIndex).at(subjectIndex).get('subject_name').reset();
      // this.getSubjectArray(blockIndex)
      //   .at(subjectIndex)
      //   .get('subject_name')
      //   .disable();
      // this.getSubjectArray(blockIndex)
      //   .at(subjectIndex)
      //   .get('subject_name')
      //   .setValidators([Validators.required]);
      this.getSubjectTransversalData(blockIndex, subjectIndex);
    } else {
      this.getSubjectArray(blockIndex).at(subjectIndex).get('count_for_title_final_score').patchValue(true);
      this.getSubjectArray(blockIndex).at(subjectIndex).get('add_subject_transversal_block').get('subject_transversal_block_name').reset();
      this.getSubjectArray(blockIndex).at(subjectIndex).get('subject_name').reset();
      // this.getSubjectArray(blockIndex)
      //   .at(subjectIndex)
      //   .get('subject_name')
      //   .reset();
      // this.getSubjectArray(blockIndex)
      //   .at(subjectIndex)
      //   .get('subject_name')
      //   .enable();
      // this.getSubjectArray(blockIndex)
      //   .at(subjectIndex)
      //   .get('subject_name')
      //   .clearValidators();
    }

    // this.getSubjectArray(blockIndex)
    //   .at(subjectIndex)
    //   .get('subject_name')
    //   .updateValueAndValidity();
  }

  getSubjectTransversalData(blockIndex: number, subjectIndex: number) {
    const currentBlock = _.cloneDeep(this.conditionOfAwardForm.get('block_of_competence_condition_input').value);
    const allTranversalBlock = _.filter(currentBlock, (block) => block.transversal_block);
    if (allTranversalBlock && allTranversalBlock.length) {
      const TranversalBlock = allTranversalBlock[0];
      if (TranversalBlock && TranversalBlock.subjects && TranversalBlock.subjects.length) {
        this.transversalSubjectList = TranversalBlock.subjects;
      }
    }
  }

  changeConnectEvaluationRetakeBlock(event: MatSlideToggleChange | any, blockIndex: number, subjectIndex: number, evalIndex: number) {
    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('score_not_calculated_for_retake_block').setValue(false);

    if (event && event.checked) {
      const blockName = this.blockFormArray.at(blockIndex).get('block_of_competence_condition').value;
      const subjName = this.getSubjectArray(blockIndex).at(subjectIndex).get('subject_name').value;

      this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('selected_evaluation_retake_block').reset();
      this.getEvaluationFormArray(blockIndex, subjectIndex)
        .at(evalIndex)
        .get('selected_evaluation_retake_block_temp')
        .get('block_of_competence_condition_name')
        .setValue(blockName);
      this.getEvaluationFormArray(blockIndex, subjectIndex)
        .at(evalIndex)
        .get('selected_evaluation_retake_block_temp')
        .get('subject_name')
        .setValue(subjName);
      this.getEvaluationFormArray(blockIndex, subjectIndex)
        .at(evalIndex)
        .get('selected_evaluation_retake_block_temp')
        .get('selected_evaluation_retake_block_name')
        .setValidators([Validators.required]);
    } else {
      this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('selected_evaluation_retake_block').reset();
      this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('selected_evaluation_retake_block').clearValidators();
      this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('selected_evaluation_retake_block').updateValueAndValidity();
      this.getEvaluationFormArray(blockIndex, subjectIndex)
        .at(evalIndex)
        .get('selected_evaluation_retake_block_temp')
        .get('block_of_competence_condition_name')
        .reset();
      this.getEvaluationFormArray(blockIndex, subjectIndex)
        .at(evalIndex)
        .get('selected_evaluation_retake_block_temp')
        .get('subject_name')
        .reset();
      this.getEvaluationFormArray(blockIndex, subjectIndex)
        .at(evalIndex)
        .get('selected_evaluation_retake_block_temp')
        .get('selected_evaluation_retake_block_name')
        .reset();
      this.getEvaluationFormArray(blockIndex, subjectIndex)
        .at(evalIndex)
        .get('selected_evaluation_retake_block_temp')
        .get('selected_evaluation_retake_block_name')
        .clearValidators();
    }

    this.getEvaluationFormArray(blockIndex, subjectIndex)
      .at(evalIndex)
      .get('selected_evaluation_retake_block_temp')
      .get('selected_evaluation_retake_block_name')
      .updateValueAndValidity();
  }

  changeScoreNotCalculatedForRetakeBlock(blockIndex: number, subjectIndex: number, evalIndex: number) {
    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('test_is_not_retake_able_in_retake_block').setValue(false);
    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('test_is_not_retake_able_in_retake_block').setValue(false);
  }

  getRetakeBlock() {
    const currentBlock = _.cloneDeep(this.conditionOfAwardForm.get('block_of_competence_condition_input').value);
    if (currentBlock && currentBlock.length) {
      this.blockList = _.filter(currentBlock, (block) => !block.transversal_block && !block.is_retake_by_block);
    }
  }

  getSubjectsOfTransversal() {
    const currentBlock = _.cloneDeep(this.conditionOfAwardForm.get('block_of_competence_condition_input').value);
    if (currentBlock && currentBlock.length) {
      this.savedSubjectOfTranversal = _.filter(currentBlock, (block) => block.transversal_block);
    }

  }

  selectRetakeBlock(event: MatSelectChange, blockIndex: number) {
    if (event && event && event.value) {
      const selectedBlock = _.filter(this.blockList, (block) => block.block_of_competence_condition === event.value);
      if (selectedBlock && selectedBlock.length && selectedBlock[0]._id) {
        this.blockFormArray.at(blockIndex).get('selected_block_retake').patchValue(selectedBlock[0]._id);
        this.blockFormArray.at(blockIndex).get('selected_block_retake_name').patchValue(selectedBlock[0].block_of_competence_condition);
      }

    }
  }

  selectSpecialization(event: MatSelectChange, blockIndex: number) {
    this.updateSelectedSpec();
  }

  selectTransversalSubject(event: MatSelectChange, blockIndex: number, subjectIndex: number) {

    if (event && event.value) {
      const selectedSubject = _.filter(this.transversalSubjectList, (subject) => subject.subject_name === event.value);
      const currentBlockName = this.blockFormArray.at(blockIndex).get('block_of_competence_condition').value;

      if (selectedSubject && selectedSubject.length) {
        if (selectedSubject[0]._id) {
          this.getSubjectArray(blockIndex).at(subjectIndex).get('subject_transversal_block_id').patchValue(selectedSubject[0]._id);
        }
        this.getSubjectArray(blockIndex).at(subjectIndex).get('subject_name').patchValue(selectedSubject[0].subject_name);
        this.getSubjectArray(blockIndex)
          .at(subjectIndex)
          .get('add_subject_transversal_block')
          .get('subject_transversal_block_name')
          .patchValue(selectedSubject[0].subject_name);
        this.getSubjectArray(blockIndex)
          .at(subjectIndex)
          .get('add_subject_transversal_block')
          .get('block_of_competence_condition')
          .patchValue(currentBlockName);
      }
    }
  }

  displayRetakeDuringTheYear(blockIndex: number, subjectIndex: number, evalIndex: number): boolean {
    const evalType = this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('type').value;
    return evalType === 'oral' || evalType === 'written' || evalType === 'memoire_ecrit' || evalType === 'memoire_oral_non_jury';
  }

  getEvaluationFormArray(competencyIndex: number, subjectIndex: number) {
    return this.getSubjectArray(competencyIndex).at(subjectIndex).get('evaluations') as UntypedFormArray;
  }

  addEmptyEvaluationFormArray(competencyIndex: number, subjectIndex: number) {
    this.getEvaluationFormArray(competencyIndex, subjectIndex).push(this.initEvaluationFormArray());
  }

  addEvaluationFormArray(competencyIndex: number, subjectIndex: number) {
    const evalData = _.cloneDeep(this.getEvaluationFormArray(competencyIndex, subjectIndex).value);

    if (this.subTypeEvaluation === 'point_weight') {
      if (this.calculateTotalEval(evalData) < 100) {
        // add form to evaluations form array
        this.getEvaluationFormArray(competencyIndex, subjectIndex).push(this.initEvaluationFormArray());
        // assign weight automatically to the latest evaluation
        const assignWeight = 100 - this.calculateTotalEval(evalData);
        this.getEvaluationFormArray(competencyIndex, subjectIndex).at(evalData.length).get('weight').setValue(assignWeight);
      } else {
        Swal.fire({
          allowOutsideClick: false,
          type: 'error',
          title: this.translate.instant('EXPERTISE.WEIGHTSHOUDBEHUNDREDTitle'),
          html: this.translate.instant('EXPERTISE.WEIGHTSHOUDBEHUNDREDText'),
          confirmButtonText: 'OK',
        });
      }
    } else {
      this.getEvaluationFormArray(competencyIndex, subjectIndex).push(this.initEvaluationFormArray());
    }
  }

  /*
   * return true if there is block that choose this block as 'Set This Block of competency as Block of Retake'
   */
  hasConnectedRetakeByBlock(blockIndex: number) {
    const blockId = _.cloneDeep(this.blockFormArray.at(blockIndex).get('_id').value);
    const evaluations = this.evaluationRetakeBlockMap.get(blockId);
    return evaluations && evaluations.length;
  }

  /*
   * set selected_evaluation_retake_block and selected_evaluation_retake_block_temp in evaluation form
   */
  selectEvaluationRetakeBlock(event: MatSelectChange, blockIndex: number, subjectIndex: number, evalIndex: number) {
    // ******* event.value: all of the selected option in mat-select

    // ******* update value of selected_evaluation_retake_block field
    this.getEvaluationFormArray(blockIndex, subjectIndex)
      .at(evalIndex)
      .get('selected_evaluation_retake_block')
      .setValue(event && event.value ? event.value : null);

    // ******* evaluations: all of the retake evaluations in this block.
    // ******* ex: "retake block 1" connected to "initial block 1", so the value will be all of the evaluations of "retake block 1"
    const evaluations = this.evaluationRetakeBlockMap.get(this.blockFormArray.at(blockIndex).get('_id').value);

    if (event && event.value && event.value.length) {
      for (const evaluationId of event.value) {
        for (const evaluation of evaluations) {
          if (evaluation.selected_evaluation_retake_block === evaluationId) {
            // ******* update value of selected_evaluation_retake_block_temp field
            this.getEvaluationFormArray(blockIndex, subjectIndex)
              .at(evalIndex)
              .get('selected_evaluation_retake_block_temp')
              .setValue(
                evaluation && evaluation.selected_evaluation_retake_block_temp ? evaluation.selected_evaluation_retake_block_temp : null,
              );
            break;
          }
        }
      }
    }
  }

  isRetakeEvaluationAlreadySelected(blockIndex: number, subjectIndex: number, evalIndex: number, selectedEvaluationId: string) {
    // ******* check if evaluation option already exist in evaluation form array in this block and subject
    // ******* if already exist, dont show that option in dropdown 'Select Evaluation in Retake Block
    const formEvaluationData: string[] =
    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('selected_evaluation_retake_block').value;

    let isExist = false;
    for (const retakeEval of this.getEvaluationFormArray(blockIndex, subjectIndex).controls) {
      const retakeEvalids: string[] = retakeEval.get('selected_evaluation_retake_block').value;
      if (retakeEvalids && retakeEvalids.includes(selectedEvaluationId)) {
        isExist = true;
        break;
      }
    }
    // ******* if the dropdown option is the one that selected in mat-select, dont hide that dropdown option
    if (formEvaluationData && formEvaluationData.includes(selectedEvaluationId)) {
      isExist = false;
    }
    return isExist;
  }

  calculateTotalEval(evalData: any) {
    let tempTotal = 0;
    if (evalData && evalData.length) {
      evalData.forEach((evaluation) => {
        if (evaluation && evaluation.weight) {
          tempTotal += evaluation.weight;
        }
      });
    }
    return tempTotal;
  }

  removeEvaluationFormArray(competencyIndex: number, subjectIndex: number, evaluationIndex: number) {
    // check if the subject form is empty. if still emtpy, then dont need to show sweet alert confirmation
    let emptyEval = _.cloneDeep(this.initEvaluationFormArray().value);
    let selectedEval = _.cloneDeep(this.getEvaluationFormArray(competencyIndex, subjectIndex).at(evaluationIndex).value);
    delete emptyEval.weight;
    delete selectedEval.weight;
    emptyEval = JSON.stringify(emptyEval);
    selectedEval = JSON.stringify(selectedEval);

    if (emptyEval === selectedEval) {
      this.getEvaluationFormArray(competencyIndex, subjectIndex).removeAt(evaluationIndex);
      Swal.fire({
        allowOutsideClick: false,
        type: 'success',
        title: this.translate.instant('PARAMETERS-RNCP.TEST.deletedTestSuccess'),
      });
    } else {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('PARAMETERS-RNCP.TEST.deletedTestWarningTitle'),
        text: this.translate.instant('PARAMETERS-RNCP.TEST.deletedTestWarningMessage'),
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
          if (this.getEvaluationFormArray(competencyIndex, subjectIndex).at(evaluationIndex).get('_id').value) {
            this.isWaitingForResponse = true;
            this.subs.sink = this.rncpTitleService
              .deleteEvaluationCompetence(this.getEvaluationFormArray(competencyIndex, subjectIndex).at(evaluationIndex).get('_id').value)
              .subscribe((resp) => {
                this.isWaitingForResponse = false;
                if (resp && !resp.errors) {
                  this.getEvaluationFormArray(competencyIndex, subjectIndex).removeAt(evaluationIndex);
                  Swal.fire({
                    allowOutsideClick: false,
                    type: 'success',
                    title: this.translate.instant('PARAMETERS-RNCP.TEST.deletedTestSuccess'),
                    confirmButtonText: this.translate.instant('Yes'),
                  });
                } else if (resp.errors && resp.errors.length && resp.errors[0].message) {
                  Swal.fire({
                    allowOutsideClick: false,
                    type: 'error',
                    title: this.translate.instant('CC2T_S01C.TITLE'),
                    html: this.translate.instant('CC2T_S01C.TEXT'),
                    confirmButtonText: this.translate.instant('CC2T_S01C.BUTTON_1'),
                  });
                }
              });
          } else {
            this.getEvaluationFormArray(competencyIndex, subjectIndex).removeAt(evaluationIndex);
            Swal.fire({
              allowOutsideClick: false,
              type: 'success',
              title: this.translate.instant('PARAMETERS-RNCP.TEST.deletedTestSuccess'),
              confirmButtonText: this.translate.instant('Yes'),
            });
          }
        }
      });
    }
  }

  calculateTotalBlock(): number {
    if (this.subTypeEvaluation === 'point_weight' || this.subTypeEvaluation === 'point_coefficient') {
      const conditionData = _.cloneDeep(this.conditionOfAwardForm.get('block_of_competence_condition_input').value);
      let tempTotal = 0;
      if (conditionData && conditionData.length) {
        conditionData.forEach((block) => {
          if (block && block.max_point) {
            tempTotal += parseInt(block.max_point);
          }
        });
      }
      return tempTotal;
    } else {
      return 0;
    }
  }

  calculateTotalSubject(blockIndex: number): number {
    if (this.subTypeEvaluation === 'point_weight' || this.subTypeEvaluation === 'point_coefficient') {
      const subjectData = _.cloneDeep(this.blockFormArray.at(blockIndex).get('subjects').value);
      let tempTotal = 0;
      if (subjectData && subjectData.length) {

        subjectData.forEach((subject) => {
          if (subject && subject.max_point) {
            tempTotal += +subject.max_point;
          }
        });
      }
      return tempTotal;
    } else {
      return 0;
    }
  }

  dropComp(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.competencyList, event.previousIndex, event.currentIndex);
  }

  dropSub(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.subjectList, event.previousIndex, event.currentIndex);
  }

  dropEval(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.testList, event.previousIndex, event.currentIndex);
  }

  closeCompPanel(index: number) {
    if (typeof index === 'number' && index >= 0) {
      this.competencyDisabled[index] = false;
    }
  }

  openCompPanel(index: number) {
    if (typeof index === 'number' && index >= 0) {
      this.competencyDisabled[index] = true;
    }
  }

  closeSubPanel(index: number) {
    if (typeof index === 'number' && index >= 0) {
      this.subjectDisabled[index] = false;
    }
  }

  openSubPanel(index: number) {
    if (typeof index === 'number' && index >= 0) {
      this.subjectDisabled[index] = true;
    }
  }

  closeEvalPanel(index: number) {
    if (typeof index === 'number' && index >= 0) {
      this.evaluationDisabled[index] = false;
    }
  }

  openEvalPanel(index: number) {
    if (typeof index === 'number' && index >= 0) {
      this.evaluationDisabled[index] = true;
    }
  }

  displayBlockName(data: string): string | undefined {
    const filteredData = this.blockList.filter((block) => block._id === data);
    if (filteredData && filteredData.length > 0) {
      return filteredData[0].block_of_competence_condition;
    } else {
      const filteredSavedData = this.savedBlockList.filter((block) => block._id === data);
      if (filteredSavedData && filteredSavedData.length > 0) {
        return filteredSavedData[0].block_of_competence_condition;
      } else {
        return '';
      }
    }
  }

  exportPdf() {
    const html = STYLE + this.conditionPdf.getPdfHtml();
    const filename = `ADMTC ${this.titleName} - ${this.className} - CONDITIONS - 2019-2020`;
    this.transcriptBuilderService.generatePdf(html, filename).subscribe((res: any) => {
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

  simpleDiacriticSensitiveRegex(text: string): string {
    if (text) {
      return text
        .replace(/[a,á,à,ä]/g, 'a')
        .replace(/[e,é,ë,è]/g, 'e')
        .replace(/[i,í,ï,Î,î]/g, 'i')
        .replace(/[o,ó,ö,ò,ô]/g, 'o')
        .replace(/[u,ü,ú,ù]/g, 'u')
        .replace(/[ ,-]/g, ' ');
    } else {
      return '';
    }
  }

  validateMaxPoint(event) {
    const decimal = /^[1-9]+[0-9]*$/;
    if (this.evaMaxPoint && !this.evaMaxPoint.toString().match(decimal)) {
      this.evaMaxPoint = 0;
    } else if (this.evaMaxPoint && this.evaMaxPoint <= -1) {
      this.evaMaxPoint = 0;
    } else if (this.evaMaxPoint < this.calculateTotalBlock()) {
      this.evaMaxPoint = this.calculateTotalBlock();
    } else {
      this.evaMaxPoint = this.evaMaxPoint;
    }
  }

  validateNumberMinimumScore(blockIndex, subjectIndex, evalIndex) {
    const dataScore = this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('minimum_score').value;
    if (dataScore) {
      const decimal = /^[0-9]+(\.[0-9]{1,2})?$/;
      // const numberRegex = /[0-9]+/;
      if (dataScore && !dataScore.toString().match(decimal)) {
        this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('minimum_score').setValue(null);
      } else if (dataScore < 0) {
        this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('minimum_score').setValue(null);
      } else {
        this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('minimum_score').setValue(dataScore);
      }
    } else {
      this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('minimum_score').setValue(null);
    }
  }

  validateNumberEcts(blockIndex, subjectIndex) {
    const dataScore = this.getSubjectArray(blockIndex).at(subjectIndex).get('credit').value;
    if (dataScore) {
      const decimal = /^[0-9]+(\.[0-9]{1,2})?$/;
      // const numberRegex = /[0-9]+/;
      if (dataScore && !dataScore.toString().match(decimal)) {
        this.getSubjectArray(blockIndex).at(subjectIndex).get('credit').setValue(null);
      } else if (dataScore < 0) {
        this.getSubjectArray(blockIndex).at(subjectIndex).get('credit').setValue(null);
      } else {
        this.getSubjectArray(blockIndex).at(subjectIndex).get('credit').setValue(dataScore);
      }
    } else {
      this.getSubjectArray(blockIndex).at(subjectIndex).get('credit').setValue(null);
    }
  }

  validateNumberMaxPoint(blockIndex, subjectIndex) {
    const dataScore = this.getSubjectArray(blockIndex).at(subjectIndex).get('max_point').value;
    if (dataScore) {
      const numberRegex = /[0-9]+/;
      if (dataScore && !dataScore.toString().match(numberRegex)) {
        this.getSubjectArray(blockIndex).at(subjectIndex).get('max_point').setValue(null);
      } else if (dataScore < 0) {
        this.getSubjectArray(blockIndex).at(subjectIndex).get('max_point').setValue(isNull);
      } else {
        this.getSubjectArray(blockIndex).at(subjectIndex).get('max_point').setValue(dataScore);
      }
    } else {
      this.getSubjectArray(blockIndex).at(subjectIndex).get('max_point').setValue(null);
    }
  }

  validateBlockName(blockIndex: number) {
    // this function to prevent a block have same name with other block
    const selectedBlockName = this.blockFormArray.at(blockIndex).get('block_of_competence_condition');
    const blocks = this.blockFormArray.value;
    for (let i = 0; i < blocks.length; i++) {
      if (i !== blockIndex && blocks[i].block_of_competence_condition === selectedBlockName.value) {
        selectedBlockName.setValue('');
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('SORRY'),
          text: this.translate.instant('NAME_EXIST'),
        });
        break;
      }
    }
  }

  validateSubjectName(blockIndex: number, subjectIndex: number) {
    // this function to prevent a subject have same name with other subject
    const selectedSubj = this.getSubjectArray(blockIndex).at(subjectIndex).get('subject_name');
    const subjects = this.getSubjectArray(blockIndex).value;
    for (let i = 0; i < subjects.length; i++) {
      if (i !== subjectIndex && subjects[i].subject_name === selectedSubj.value) {
        selectedSubj.setValue('');
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('SORRY'),
          text: this.translate.instant('NAME_EXIST'),
        });
        break;
      }
    }
  }

  validateEvaluationName(blockIndex: number, subjectIndex: number, evalIndex: number) {
    // this function to prevent an evaluation have same name with other evaluation
    const selectedEval = this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('evaluation');
    const evaluations = this.getEvaluationFormArray(blockIndex, subjectIndex).value;
    for (let i = 0; i < evaluations.length; i++) {
      if (i !== evalIndex && evaluations[i].evaluation === selectedEval.value) {
        selectedEval.setValue('');
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('SORRY'),
          text: this.translate.instant('NAME_EXIST'),
        });
        break;
      }
    }
  }

  validateBlockMaxPoint(blockIndex: number) {
    // ************** this function is to validate max_point of a block so it will not exceed the condition max point.
    if (this.subTypeEvaluation === 'point_weight' || this.subTypeEvaluation === 'point_coefficient') {
      const selectedBlockMaxPoint = this.blockFormArray.at(blockIndex).get('max_point');
      const totalSubjectPoint = this.calculateTotalSubject(blockIndex);
      // ************** Condition is 1. Block Max point cannot be less than 0,
      // 2. Total point of all block cannot be max than max point of condition
      // 3. Max Point of block cannot be less than total of max point of its subjects
      if (selectedBlockMaxPoint.value < 0 || this.calculateTotalBlock() > this.evaMaxPoint || selectedBlockMaxPoint.value < totalSubjectPoint) {
        // ************** calculate and input the right point to max point field
        if (this.calculateTotalBlock() > this.evaMaxPoint) {
          Swal.fire({
            title: this.translate.instant('PARAMETERS-RNCP.EXPERTISE.MaxPointValidatiionMessageTitle'),
            html: this.translate.instant('PARAMETERS-RNCP.EXPERTISE.MaxPointValidatiionMessageText',{ MAXPOINTOFTHETITLE: this.evaMaxPoint }),
            type: 'warning',
            showCancelButton: false,
            allowEscapeKey: true,
            confirmButtonText: this.translate.instant('SETTINGS.USERTYPES.S1.Ok'),
          })
        } else if (selectedBlockMaxPoint.value < totalSubjectPoint) {
          Swal.fire({
            title: this.translate.instant('PARAMETERS-RNCP.EXPERTISE.MaxPointSubjectValidatiionMessageTitle'),
            html: this.translate.instant('PARAMETERS-RNCP.EXPERTISE.MaxPointSubjectValidatiionMessageText',{ MAXPOINTOFTHETITLE: selectedBlockMaxPoint.value }),
            type: 'warning',
            showCancelButton: false,
            allowEscapeKey: true,
            confirmButtonText: this.translate.instant('SETTINGS.USERTYPES.S1.Ok'),
          })
        }

        const remainingBlockPoint = this.calculateTotalBlock() - selectedBlockMaxPoint.value;
        const point = this.evaMaxPoint - remainingBlockPoint;
        selectedBlockMaxPoint.setValue(point);
      }
    }
  }

  validateSubjectMaxPoint(blockIndex: number, subjectIndex: number) {
    // this function is to validate max_point of a subject so it will not exceed it's block's max point.
    if (this.subTypeEvaluation === 'point_weight' || this.subTypeEvaluation === 'point_coefficient') {
      const selectedSubjMaxPoint = this.getSubjectArray(blockIndex).at(subjectIndex).get('max_point');
      const blockMaxPoint = this.blockFormArray.at(blockIndex).get('max_point').value;
      const totalSubjectPoint = this.calculateTotalSubject(blockIndex);
      if (selectedSubjMaxPoint.value < 0 || totalSubjectPoint > blockMaxPoint) {
        if (totalSubjectPoint > blockMaxPoint) {
          Swal.fire({
            title: this.translate.instant('PARAMETERS-RNCP.EXPERTISE.MaxPointSubjectValidatiionMessageTitle'),
            html: this.translate.instant('PARAMETERS-RNCP.EXPERTISE.MaxPointSubjectValidatiionMessageText',{ MAXPOINTOFTHETITLE: blockMaxPoint }),
            type: 'warning',
            showCancelButton: false,
            allowEscapeKey: true,
            confirmButtonText: this.translate.instant('SETTINGS.USERTYPES.S1.Ok'),
          })
        }
        const remainingSubjPoint = totalSubjectPoint - selectedSubjMaxPoint.value;
        const point = blockMaxPoint - remainingSubjPoint;
        selectedSubjMaxPoint.setValue(point);
      }
    }
  }

  validateEvalWeight(blockIndex: number, subjectIndex: number, evalIndex: number) {
    // *************** Previously weight is not shown for score mark but now it is after AV-2898
    const selectedEvalWeight = this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('weight');
    const evalData = _.cloneDeep(this.getEvaluationFormArray(blockIndex, subjectIndex).value);
    const totalEvalWeight = this.calculateTotalEval(evalData);
    if (selectedEvalWeight.value < 0 || totalEvalWeight > 100) {
      const remainingEvalPoint = totalEvalWeight - selectedEvalWeight.value;
      const point = 100 - remainingEvalPoint; // 100 because total weight must be 100%
      selectedEvalWeight.setValue(point);
    }


    // this function is to validate weight of an evaluation so it will not exceed it's subject's max point.
    // if (this.subTypeEvaluation === 'point_weight' || this.subTypeEvaluation === 'point_coefficient') {
    //   const selectedEvalWeight = this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('weight');
    //   const evalData = _.cloneDeep(this.getEvaluationFormArray(blockIndex, subjectIndex).value);
    //   const totalEvalWeight = this.calculateTotalEval(evalData);
    //   if (selectedEvalWeight.value < 0 || totalEvalWeight > 100) {
    //     const remainingEvalPoint = totalEvalWeight - selectedEvalWeight.value;
    //     const point = 100 - remainingEvalPoint; // 100 because total weight must be 100%
    //     selectedEvalWeight.setValue(point);
    //   }
    // }
  }

  validateSubjectScore(blockIndex: number, subjectIndex: number) {
    const decimal = /^[-+]?[0-9]+\.[0-9]+$/;
    // this function is to validate weight of an evaluation so it will not exceed it's subject's max point.
    const selectedSubjectScore = this.getSubjectArray(blockIndex).at(subjectIndex).get('minimum_score_for_certification');
    if (selectedSubjectScore.value < 0) {
      const point = 0; // 100 because total weight must be 100%
      selectedSubjectScore.setValue(point);
    } else if (selectedSubjectScore.value >= 1000) {
      const point = 999; // 100 because total weight must be 100%
      selectedSubjectScore.setValue(point);
    } else if (selectedSubjectScore.value % 1 !== 0) {
      // const point = Number(selectedSubjectScore.value).toFixed(3);
      const desc = selectedSubjectScore.value.toString().split('.');
      selectedSubjectScore.setValue(selectedSubjectScore.value);
      if (desc[1].length > 2) {
        const val = parseFloat(selectedSubjectScore.value).toFixed(2).replace(',', '.');
        selectedSubjectScore.setValue(val);
      }
    }
  }

  validateSubjectCoefficient(blockIndex: number, subjectIndex: number) {
    const decimal = /^[-+]?[0-9]+\.[0-9]+$/;
    // this function is to validate weight of an evaluation so it will not exceed it's subject's max point.
    const selectedCoefficient = this.getSubjectArray(blockIndex).at(subjectIndex).get('coefficient');
    if (selectedCoefficient.value < 0) {
      const point = 0; // 100 because total weight must be 100%
      selectedCoefficient.setValue(point);
    } else if (selectedCoefficient.value >= 1000) {
      const point = 999; // 100 because total weight must be 100%
      selectedCoefficient.setValue(point);
    } else if (selectedCoefficient.value % 1 !== 0) {
      // const point = Number(selectedSubjectScore.value).toFixed(3);
      const desc = selectedCoefficient.value.toString().split('.');
      selectedCoefficient.setValue(selectedCoefficient.value);
      if (desc[1].length > 2) {
        const val = parseFloat(selectedCoefficient.value).toFixed(2).replace(',', '.');
        selectedCoefficient.setValue(val);
      }
    }
  }

  validateMinScore(blockIndex: number) {
    const decimal = /^[-+]?[0-9]+\.[0-9]+$/;
    // this function is to validate weight of an evaluation so it will not exceed it's subject's max point.
    const selectedScore = this.blockFormArray.at(blockIndex).get('min_score');
    if (selectedScore.value < 0) {
      const point = 0; // 100 because total weight must be 100%
      selectedScore.setValue(point);
    } else if (selectedScore.value >= 1000) {
      const point = 999; // 100 because total weight must be 100%
      selectedScore.setValue(point);
    } else if (selectedScore.value % 1 !== 0) {
      // const point = Number(selectedSubjectScore.value).toFixed(3);
      const desc = selectedScore.value.toString().split('.');
      selectedScore.setValue(selectedScore.value);
      if (desc[1].length > 2) {
        const val = parseFloat(selectedScore.value).toFixed(2).replace(',', '.');
        selectedScore.setValue(val);
      }
    }
  }

  validateEvalMinScore(blockIndex: number, subjectIndex: number, evalIndex: number) {
    const decimal = /^[-+]?[0-9]+\.[0-9]+$/;
    // this function is to validate weight of an evaluation so it will not exceed it's subject's max point.
    const selectedScore = this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('minimum_score');
    if (selectedScore.value < 0) {
      const point = 0; // 100 because total weight must be 100%
      selectedScore.setValue(point);
    } else if (selectedScore.value >= 1000) {
      const point = 999; // 100 because total weight must be 100%
      selectedScore.setValue(point);
    } else if (selectedScore.value % 1 !== 0) {
      // const point = Number(selectedSubjectScore.value).toFixed(3);
      const desc = selectedScore.value.toString().split('.');
      selectedScore.setValue(selectedScore.value);
      if (desc[1].length > 2) {
        const val = parseFloat(selectedScore.value).toFixed(2).replace(',', '.');
        selectedScore.setValue(val);
      }
    }
  }

  validateEvaCoefficient(blockIndex: number, subjectIndex: number, evalIndex: number) {
    const decimal = /^[-+]?[0-9]+\.[0-9]+$/;
    // this function is to validate weight of an evaluation so it will not exceed it's subject's max point.
    const selectedScore = this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('coefficient');
    if (selectedScore.value < 0) {
      const point = 0; // 100 because total weight must be 100%
      selectedScore.setValue(point);
    } else if (selectedScore.value >= 1000) {
      const point = 999; // 100 because total weight must be 100%
      selectedScore.setValue(point);
    } else if (selectedScore.value % 1 !== 0) {
      // const point = Number(selectedSubjectScore.value).toFixed(3);
      const desc = selectedScore.value.toString().split('.');
      selectedScore.setValue(selectedScore.value);
      if (desc[1].length > 2) {
        const val = parseFloat(selectedScore.value).toFixed(2).replace(',', '.');
        selectedScore.setValue(val);
      }
    }
  }

  updateSelectedSpec() {
    const data = this.blockFormArray.value;
    const temp = [];
    if (data.length) {
      data.forEach(block => {
        if (block && block.specialization) {
          temp.push(block.specialization);
        }
      });
    }
    this.selectedSpec = temp;
  }

  findInvalidControlsRecursive(formToInvestigate: UntypedFormGroup | UntypedFormArray): string[] {
    var invalidControls: string[] = [];
    let recursiveFunc = (form: UntypedFormGroup | UntypedFormArray) => {
      Object.keys(form.controls).forEach((field) => {
        const control = form.get(field);
        if (control.invalid) {
          invalidControls.push(field);
        }
        if (control instanceof UntypedFormGroup) {
          recursiveFunc(control);
        } else if (control instanceof UntypedFormArray) {
          recursiveFunc(control);
        }
      });
    };
    recursiveFunc(formToInvestigate);
    return invalidControls;
  }

  mappinInvalidControl(invalidControls: string[]): { blockIndex: number; subjectIndex: number; evalIndex: number }[] {
    const result = [];
    const pattern = /^[0-9]+$/;
    if (invalidControls && invalidControls.length) {
      let curBlock = null;
      let curSubject = null;
      let curEval = null;
      invalidControls.forEach((control, controlIndex) => {
        if (
          control &&
          control.match(pattern) &&
          invalidControls[controlIndex - 1] !== 'subjects' &&
          invalidControls[controlIndex - 1] !== 'evaluations'
        ) {
          if (curBlock !== null) {
            result.push({
              blockIndex: curBlock,
              subjectIndex: curSubject,
              evalIndex: curEval,
            });
            curBlock = parseInt(control);
          } else {
            curBlock = parseInt(control);
          }
          curSubject = null;
          curEval = null;
        }
        if (control === 'subjects' && invalidControls[controlIndex + 1] && invalidControls[controlIndex + 1].match(pattern)) {
          if (curSubject !== null) {
            result.push({
              blockIndex: curBlock,
              subjectIndex: curSubject,
              evalIndex: curEval,
            });
            curSubject = parseInt(invalidControls[controlIndex + 1]);
          } else {
            curSubject = parseInt(invalidControls[controlIndex + 1]);
          }
          curEval = null;
        }
        if (control === 'evaluations' && invalidControls[controlIndex + 1] && invalidControls[controlIndex + 1].match(pattern)) {
          if (curEval !== null) {
            result.push({
              blockIndex: curBlock,
              subjectIndex: curSubject,
              evalIndex: curEval,
            });
            curEval = parseInt(invalidControls[controlIndex + 1]);
          } else {
            curEval = parseInt(invalidControls[controlIndex + 1]);
          }
        }

        if (controlIndex === invalidControls.length - 1 && (curBlock !== null || (curBlock !== null && curSubject !== null) || (curBlock !== null && curSubject !== null && curEval !== null))) {
          result.push({
            blockIndex: curBlock,
            subjectIndex: curSubject,
            evalIndex: curEval,
          });
        }
      });
    }

    return result;
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
