import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  ViewChildren,
  ElementRef,
  QueryList,
} from '@angular/core';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js'
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { UntypedFormBuilder, UntypedFormGroup, Validators, UntypedFormArray, UntypedFormControl } from '@angular/forms';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { MatTable } from '@angular/material/table';
import { Observable } from 'rxjs';
import * as _ from 'lodash';
import { SubSink } from 'subsink';
import { GlobalErrorService } from 'app/service/global-error-service/global-error-service.service';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { UtilityService } from 'app/service/utility/utility.service';
import { ConditionsService } from 'app/service/conditions/conditions.service';
import { AddPassFailDialogComponent } from 'app/title-rncp/conditions/jury-decision-parameter/add-pass-fail-dialog/add-pass-fail-dialog.component';

interface EvaluationRetakeBlock {
  selected_evaluation_retake_block: string; // fill with evaluation id
  selected_evaluation_retake_block_temp: {
    block_of_competence_condition_name: string; // block name
    subject_name: string; // subject name
    selected_evaluation_retake_block_name: string; // evaluation name
  };
}

@Component({
  selector: 'ms-third-step-score',
  templateUrl: './third-step-score.component.html',
  styleUrls: ['./third-step-score.component.scss'],
})
export class ThirdStepScoreComponent implements OnInit, OnDestroy {
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
  @ViewChildren('blockPanel') blockPanel: QueryList<ElementRef>;
  blockValue = null;

  listOfSubject: any[][] = [];
  listOfEvaluation: any[][] = [];
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
  juryDecisionParameterForm: UntypedFormGroup;

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
  isFinalTranscript = false;

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
  dataClass: any;
  @ViewChildren(MatTable)
  matTables: QueryList<MatTable<any>>;

  displayedScoreColumns = ['correlation', 'validation_type', 'validation_parameters', 'score', 'action'];
  passFailConditions: { value: string; label: string }[];
  correlations: { value: string; label: string }[];
  validationTypes: { value: string; label: string }[];
  validationTypesBlock: { value: string; label: string }[];
  signs: { value: string; label: string }[];
  expertises: any[];
  subjects: any[];
  tests: any[];
  evaluationList = [];

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
    public passFailDialog: MatDialog,
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
    this.initJuryDecisionParameterForm();
    this.populateBlockData();
    this.getConditionDropdownData();
    this.populateClassData();
    this.checkFinalTranscript()
    
  }

  checkFinalTranscript(){
    const filter = {
      rncp_title_id: this.selectedRncpTitleId, 
      class_id : this.selectedClassId,
      is_already_started: true,
    }

    this.subs.sink = this.rncpTitleService.checkTranscriptProcess(filter).subscribe((resp)=>{

      if(resp && resp.length){
       this.isFinalTranscript = true
      }
    })
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
      block_rncp_reference: [null],
      rncp_title: [this.selectedRncpTitleId],
      class_id: [this.selectedClassId],
      block_of_competence_condition: [''],
      description: [''],
      max_point: [null],
      min_score: [null],
      block_of_competence_condition_credit: [null],
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
      pass_fail_conditions: this.fb.array([]),
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
      subject_name: [null],
      minimum_score_for_certification: [0],
      coefficient: [null],
      max_point: [null],
      count_for_title_final_score: [true],
      credit: [null],
      evaluations: this.fb.array([]),
      order: [null],
    });
  }

  initEvaluationFormArray() {
    return this.fb.group({
      _id: [null],
      evaluation: [''],
      type: [null],
      weight: [null],
      coefficient: [null],
      minimum_score: [null],
      result_visibility: [null],
      parallel_intake: [false],
      auto_mark: [null], // regex to allow 0 to 20
      retake_during_the_year: [false],
      student_eligible_to_join: [null],
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
      order: [null],
    });
  }

  initPassFailFormArray(condition?: string, name?: string) {
    return this.fb.group({
      condition_type: [condition ? condition : null, Validators.required],
      condition_name: [name ? name : '', Validators.required],
      condition_parameters: this.fb.array([]),
    });
  }

  initParameterFormArray() {
    return this.fb.group({
      correlation: [null],
      validation_type: [null, Validators.required],
      pass_mark: [null],
      validation_parameter: this.fb.group({
        parameter_type: [null],
        percentage_value: [null],
        block_id: [null],
        subject_id: [null],
        evaluation_id: [null],
        sign: [null],
      }),
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
      .getAllBlockConditionsForValidation(this.selectedRncpTitleId, this.selectedClassId)
      .subscribe((response) => {
        const resp = _.cloneDeep(response);
        if (resp && resp.length >= 0) {
          this.conditionData = _.cloneDeep(resp);
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
            if (blockData && blockData.subjects && !blockData.subjects.length ) {
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
            if (blockData && blockData.transversal_block) {
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
                  tempSubjectData &&
                  tempSubjectData.is_subject_transversal_block &&
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
                  tempSubjectData &&
                  tempSubjectData.is_subject_transversal_block &&
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
        this.conditionService.validationDataFormControls = this.conditionOfAwardForm.get('block_of_competence_condition_input')['controls'];
      });
  }

  setBlockConditionArray(resp) {
    this.isWaitingForResponse = Boolean(resp?.length);

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

      if (blockData.pass_fail_conditions && blockData.pass_fail_conditions.length) {
        blockData.pass_fail_conditions.forEach((element, passIndex) => {
          this.addpassFailDecisionParameters('', '', blockIndex.toString());
          if (element.condition_parameters && element.condition_parameters.length) {
            element.condition_parameters.forEach((parameter, paramIndex) => {
              this.addParameters(blockIndex.toString(), passIndex.toString());
              if (parameter.validation_type === 'subject') {
                this.subs.sink = this.conditionService
                  .getSubjectBlockDropdownData(this.selectedRncpTitleId, this.selectedClassId, blockData._id)
                  .subscribe((subj) => {
                    this.listOfSubject[blockIndex] = subj;
                    this.isWaitingForResponse = false;
                  });
              } else if (parameter.validation_type === 'evaluation') {
                this.subs.sink = this.conditionService
                  .getSubjectBlockDropdownData(this.selectedRncpTitleId, this.selectedClassId, blockData._id)
                  .subscribe((test) => {
                    this.listOfSubject[blockIndex] = test;
                  });

                this.subs.sink = this.conditionService
                  .getTestBlockDropdownData(this.selectedRncpTitleId, this.selectedClassId, blockData._id)
                  .subscribe((test) => {
                    this.listOfEvaluation[blockIndex] = test;
                    this.isWaitingForResponse = false;
                  });
              } else {
                this.isWaitingForResponse = false;
              }
              if (parameter.validation_parameter.block_id) {
                blockData.pass_fail_conditions[passIndex].condition_parameters[paramIndex].validation_parameter.block_id =
                  parameter.validation_parameter.block_id._id;
              }
              if (parameter.validation_parameter.subject_id) {
                // blockData.pass_fail_conditions[passIndex].condition_parameters[paramIndex].validation_parameter.subject_id =
                //   parameter.validation_parameter.subject_id._id;
                parameter.validation_parameter.subject_id = parameter.validation_parameter.subject_id._id;
              }
              if (parameter.validation_parameter.evaluation_id) {
                blockData.pass_fail_conditions[passIndex].condition_parameters[paramIndex].validation_parameter.evaluation_id =
                  parameter.validation_parameter.evaluation_id._id;
              }
            });
          }
        });
        this.blockFormArray.get(blockIndex.toString()).get('pass_fail_conditions').patchValue(blockData.pass_fail_conditions);

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
          if (
            subjectsData.add_subject_transversal_block &&
            subjectsData.add_subject_transversal_block.subject_transversal_block_name &&
            subjectsData.add_subject_transversal_block.block_of_competence_condition
          ) {
            if (!subjectsData.subject_name) {
              this.getSubjectArray(blockIndex)
                .at(subjectsIndex)
                .get('subject_name')
                .patchValue(subjectsData.add_subject_transversal_block.subject_transversal_block_name);
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
                this.getEvaluationFormArray(blockIndex, subjectsIndex)
                  .at(evaluationsIndex)
                  .get('coefficient')
                  .setValue(evaluationsData.coefficient);
              }
              if (evaluationsData.order) {
                this.getEvaluationFormArray(blockIndex, subjectsIndex).at(evaluationsIndex).get('order').setValue(evaluationsData.order);
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
      const evalRetakeBlockDatas = [];
      for (const retakeTest of evalData.selected_evaluation_retake_block) {
        const selectedRetakeTest = selectedEvaluationRetake.find((retakeMap) => {
          return retakeMap.selected_evaluation_retake_block === retakeTest._id;
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

  isEvaluationTotalWeightLessThan100(blocks: any): { isLessThan100: boolean; subjectList: string[] } {
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
    return { isLessThan100: isLessThan100, subjectList: subjectsName };
  }

  convertStringToNumberType(blocks) {
    // loop all the block to change data from string to number
    blocks.forEach((blockData) => {
      blockData.max_point = blockData.max_point ? +blockData.max_point : 0;
      blockData.min_score = +blockData.min_score;
      blockData.block_of_competence_condition_credit = +blockData.block_of_competence_condition_credit;
      if (blockData.subjects) {
        blockData.subjects.forEach((subject) => {
          if (subject.evaluations) {
            subject.evaluations.forEach((evaluation) => {
              // if (evaluation.selected_evaluation_retake_block && evaluation.selected_evaluation_retake_block.length) {
              //   evaluation.selected_evaluation_retake_block = evaluation.selected_evaluation_retake_block.map(
              //     (retakeTest) => retakeTest._id,
              //   );
              // }
              let evalRetakeBlock = [];
              evalRetakeBlock =
                evaluation.selected_evaluation_retake_block && evaluation.selected_evaluation_retake_block.length
                  ? evaluation.selected_evaluation_retake_block.map((retakeTest) => retakeTest._id)
                  : [];
              evaluation.selected_evaluation_retake_block = evalRetakeBlock;
            });
          }
        });
      }
    });
    return blocks;
  }

  save() {}

  showData() {

  }

  get blockFormArray(): UntypedFormArray {
    return this.conditionOfAwardForm.get('block_of_competence_condition_input') as UntypedFormArray;
  }

  addEmptyBlockFormArray(isInterval?: boolean) {
    this.blockFormArray.push(this.initBlockFormArray(isInterval ? isInterval : false));
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

    this.getEvaluationFormArray(blockIndex, subjectIndex)
      .at(evalIndex)
      .get('selected_evaluation_retake_block')
      .setValue(event && event.value ? event.value : null);

    const evaluations = this.evaluationRetakeBlockMap.get(this.blockFormArray.at(blockIndex).get('_id').value);

    if (event && event.value && event.value.length) {
      for (const evaluationId of event.value) {
        for (const evaluation of evaluations) {
          if (evaluation.selected_evaluation_retake_block === evaluationId) {
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

  reCalculateGrandOralResult() {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('TRANSCRIPT_S22.TITLE'),
      text: this.translate.instant('TRANSCRIPT_S22.TEXT'),
      confirmButtonText: this.translate.instant('TRANSCRIPT_S22.BUTTON 1'),
      cancelButtonText: this.translate.instant('TRANSCRIPT_S22.BUTTON 2'),
      showCancelButton: true,
      allowOutsideClick: false,
    }).then((resp) => {
      if (resp.value) {
        this.subs.sink = this.rncpTitleService
          .reCalculateGrandOralCorrectionDecision(this.selectedRncpTitleId, this.selectedClassId)
          .subscribe(
            (resp) => {
              if (resp && resp === 'calculation process on progress') {
                Swal.fire({
                  type: 'success',
                  title: this.translate.instant('TRANSCRIPT_S24.TITLE'),
                  text: this.translate.instant('TRANSCRIPT_S24.TEXT'),
                  confirmButtonText: this.translate.instant('TRANSCRIPT_S24.BUTTON 1'),
                });
              }
            },
            (err) => {
              if (err['message'] === 'GraphQL error: calculation process still on progress') {
                Swal.fire({
                  type: 'warning',
                  title: this.translate.instant('TRANSCRIPT_S23.TITLE'),
                  text: this.translate.instant('TRANSCRIPT_S23.TEXT'),
                  confirmButtonText: this.translate.instant('TRANSCRIPT_S23.BUTTON 1'),
                });
              }
            },
          );
      }
    });
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

  exportPdf() {}

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

  updateSelectedSpec() {
    const data = this.blockFormArray.value;
    const temp = [];
    if (data.length) {
      data.forEach((block) => {
        if (block && block.specialization) {
          temp.push(block.specialization);
        }
      });
    }
    this.selectedSpec = temp;
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
    this.conditionService.validationAllowUserSave = false;
    this.conditionService.isConditionFormChanged = false;

  }

  getPassFailDecisionParameters(index): UntypedFormArray {
    return this.blockFormArray.get(index).get('pass_fail_conditions') as UntypedFormArray;
  }

  getParameters(passIndex, index): UntypedFormArray {
    return this.getPassFailDecisionParameters(passIndex).get(index).get('condition_parameters') as UntypedFormArray;
  }

  populateClassData() {
    this.subs.sink = this.rncpTitleService.getClassForValidation(this.selectedClassId).subscribe((resp) => {
      if (resp) {
        this.dataClass = resp;
        const payload = _.cloneDeep(resp);
        if (this.dataClass.pass_fail_conditions && this.dataClass.pass_fail_conditions.length) {
          this.dataClass.pass_fail_conditions.forEach((element, passIndex) => {
            this.addpassFailDecisionParametersScore();
            if (element.condition_parameters && element.condition_parameters.length) {
              element.condition_parameters.forEach((parameter, paramIndex) => {
                this.addParametersScore(passIndex.toString());
                if (parameter.validation_parameter.block_id) {
                  payload.pass_fail_conditions[passIndex].condition_parameters[paramIndex].validation_parameter.block_id =
                    parameter.validation_parameter.block_id._id;
                }
                if (parameter.validation_parameter.subject_id) {
                  payload.pass_fail_conditions[passIndex].condition_parameters[paramIndex].validation_parameter.subject_id =
                    parameter.validation_parameter.subject_id._id;
                }
                if (parameter.validation_parameter.evaluation_id) {
                  payload.pass_fail_conditions[passIndex].condition_parameters[paramIndex].validation_parameter.evaluation_id =
                    parameter.validation_parameter.evaluation_id._id;
                }
              });
            }
          });
          this.juryDecisionParameterForm.patchValue(payload);
        }
      }
      this.conditionService.validationDataFormControls = this.juryDecisionParameterForm.get('pass_fail_conditions')['controls'];
    });
  }

  getTypeSekected(data, index, i: string, j: string, k: string) {
    const blockId = this.blockFormArray.get(k).get('_id').value;
    if (this.getParameters(k, i).get(j).get('validation_type').value === 'subject') {
      this.subs.sink = this.conditionService
        .getSubjectBlockDropdownData(this.selectedRncpTitleId, this.selectedClassId, blockId)
        .subscribe((subj) => {
          this.listOfSubject[index] = subj;
        });
    } else if (this.getParameters(k, i).get(j).get('validation_type').value === 'evaluation') {
      this.subs.sink = this.conditionService
        .getTestBlockDropdownData(this.selectedRncpTitleId, this.selectedClassId, blockId)
        .subscribe((test) => {
          this.listOfEvaluation[index] = test;
        });
      this.subs.sink = this.conditionService
        .getSubjectBlockDropdownData(this.selectedRncpTitleId, this.selectedClassId, blockId)
        .subscribe((subj) => {
          this.listOfSubject[index] = subj;
        });
    }
    if (this.getParameters(k, i).get(j).get('validation_type').value === 'block') {
      this.getParameters(k, i).get(j).get('validation_parameter').get('subject_id').setValue(null);
      this.getParameters(k, i).get(j).get('validation_parameter').get('subject_id').clearValidators();
      this.getParameters(k, i).get(j).get('validation_parameter').get('subject_id').updateValueAndValidity();
      this.getParameters(k, i).get(j).get('validation_parameter').get('evaluation_id').setValue(null);
      this.getParameters(k, i).get(j).get('validation_parameter').get('evaluation_id').clearValidators();
      this.getParameters(k, i).get(j).get('validation_parameter').get('evaluation_id').updateValueAndValidity();
      this.getParameters(k, i).get(j).get('validation_parameter').get('parameter_type').setValue(null);
      this.getParameters(k, i).get(j).get('validation_parameter').get('parameter_type').clearValidators();
      this.getParameters(k, i).get(j).get('validation_parameter').get('parameter_type').updateValueAndValidity();
      this.getParameters(k, i).get(j).get('validation_parameter').get('sign').setValue(null);
      this.getParameters(k, i).get(j).get('validation_parameter').get('sign').clearValidators();
      this.getParameters(k, i).get(j).get('validation_parameter').get('sign').updateValueAndValidity();
      this.getParameters(k, i).get(j).get('pass_mark').setValue(null);
      this.getParameters(k, i).get(j).get('pass_mark').clearValidators();
      this.getParameters(k, i).get(j).get('pass_mark').updateValueAndValidity();
    } else if (this.getParameters(k, i).get(j).get('validation_type').value === 'subject') {
      this.getParameters(k, i).get(j).get('validation_parameter').get('block_id').setValue(null);
      this.getParameters(k, i).get(j).get('validation_parameter').get('block_id').clearValidators();
      this.getParameters(k, i).get(j).get('validation_parameter').get('block_id').updateValueAndValidity();
      this.getParameters(k, i).get(j).get('validation_parameter').get('evaluation_id').setValue(null);
      this.getParameters(k, i).get(j).get('validation_parameter').get('evaluation_id').clearValidators();
      this.getParameters(k, i).get(j).get('validation_parameter').get('evaluation_id').updateValueAndValidity();
      this.getParameters(k, i).get(j).get('validation_parameter').get('parameter_type').setValue(null);
      this.getParameters(k, i).get(j).get('validation_parameter').get('parameter_type').clearValidators();
      this.getParameters(k, i).get(j).get('validation_parameter').get('parameter_type').updateValueAndValidity();
      this.getParameters(k, i).get(j).get('validation_parameter').get('sign').setValue(null);
      this.getParameters(k, i).get(j).get('validation_parameter').get('sign').clearValidators();
      this.getParameters(k, i).get(j).get('validation_parameter').get('sign').updateValueAndValidity();
      this.getParameters(k, i).get(j).get('pass_mark').setValue(null);
      this.getParameters(k, i).get(j).get('pass_mark').clearValidators();
      this.getParameters(k, i).get(j).get('pass_mark').updateValueAndValidity();
    } else if (this.getParameters(k, i).get(j).get('validation_type').value === 'evaluation') {
      this.getParameters(k, i).get(j).get('validation_parameter').get('subject_id').setValue(null);
      this.getParameters(k, i).get(j).get('validation_parameter').get('subject_id').clearValidators();
      this.getParameters(k, i).get(j).get('validation_parameter').get('subject_id').updateValueAndValidity();
      this.getParameters(k, i).get(j).get('validation_parameter').get('block_id').setValue(null);
      this.getParameters(k, i).get(j).get('validation_parameter').get('block_id').clearValidators();
      this.getParameters(k, i).get(j).get('validation_parameter').get('block_id').updateValueAndValidity();
      this.getParameters(k, i).get(j).get('validation_parameter').get('parameter_type').setValue(null);
      this.getParameters(k, i).get(j).get('validation_parameter').get('parameter_type').clearValidators();
      this.getParameters(k, i).get(j).get('validation_parameter').get('parameter_type').updateValueAndValidity();
      this.getParameters(k, i).get(j).get('validation_parameter').get('sign').setValue(null);
      this.getParameters(k, i).get(j).get('validation_parameter').get('sign').clearValidators();
      this.getParameters(k, i).get(j).get('validation_parameter').get('sign').updateValueAndValidity();
      this.getParameters(k, i).get(j).get('pass_mark').setValue(null);
      this.getParameters(k, i).get(j).get('pass_mark').clearValidators();
      this.getParameters(k, i).get(j).get('pass_mark').updateValueAndValidity();
    }
  }

  getValidationType(i: string, j: string, k: string) {
    if (this.getParameters(k, i).get(j).get('validation_type').value === 'block') {
      const blockId = this.blockFormArray.get(k).get('_id').value;
      this.getParameters(k, i).get(j).get('validation_parameter').get('block_id').setValue(blockId);
    }
    return this.getParameters(k, i).get(j).get('validation_type').value;
  }

  openPassFailDialog(blockIndex) {
    const dialogRef = this.passFailDialog.open(AddPassFailDialogComponent, {
      width: '560px',
      disableClose: true,
      panelClass: 'pass-fail-pop-up',
    });
    this.subs.sink = dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.addpassFailDecisionParameters(result.condition, result.name, blockIndex);
      }
    });
  }

  addpassFailDecisionParameters(condition?: string, name?: string, indexs?: string) {
    this.getPassFailDecisionParameters(indexs).push(this.initPassFailFormArray(condition, name));

    this.matTables.forEach((each) => each.renderRows());
  }

  removepassFailDecisionParameters(indexs, index: number) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
      html: this.translate.instant('DELETE_PASS_FAIL_DECISION'),
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
        this.getPassFailDecisionParameters(indexs).removeAt(index);

        this.matTables.forEach((each) => each.renderRows());
        Swal.fire({
          type: 'success',
          title: this.translate.instant('EVENT_S1.TITLE'),
          html: this.translate.instant('PASS_FAIL_DELETED'),
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
        });
        this.conditionService.isConditionFormChanged = true;
      }
    });
  }

  getConditionDropdownData() {
    this.isWaitingForResponse = true;
    this.passFailConditions = this.conditionService.getConditionTypes();
    this.correlations = this.conditionService.getCorrelations();
    this.validationTypes = this.conditionService.getValidationTypes();
    this.validationTypesBlock = this.conditionService.getValidationTypesBlock();
    this.signs = this.conditionService.getParameterSignPassFail();
    this.subs.sink = this.conditionService.getExpertiseDropdownData(this.selectedRncpTitleId, this.selectedClassId).subscribe((exp) => {
      this.expertises = exp;

      this.subs.sink = this.conditionService.getSubjectDropdownData(this.selectedRncpTitleId, this.selectedClassId).subscribe((subj) => {
        this.subjects = subj;
        this.subs.sink = this.conditionService.getTestDropdownData(this.selectedRncpTitleId, this.selectedClassId).subscribe((test) => {
          this.evaluationList = test;
          this.isWaitingForResponse = false;
        });
      });
    });
  }

  addParameters(passIndex, index: string) {

    this.getParameters(passIndex, index).push(this.initParameterFormArray());

    this.matTables.forEach((each) => each.renderRows());
  }

  removeParameters(indexPass, indexDecisionParameter, indexParameter) {
    const conditionBlock = this.conditionOfAwardForm.value;
    const paramData =
      conditionBlock.block_of_competence_condition_input[indexPass].pass_fail_conditions[indexDecisionParameter].condition_parameters[
        indexParameter
      ];

    if (
      paramData &&
      (paramData.correlation ||
        paramData.pass_mark ||
        paramData.validation_type ||
        paramData.validation_parameter.sign ||
        paramData.validation_parameter.evaluation_id ||
        paramData.validation_parameter.parameter_type ||
        paramData.validation_parameter.percentage_value ||
        paramData.validation_parameter.subject_id ||
        paramData.validation_parameter.block_id)
    ) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('PARAM_S1.deletedTitle'),
        html: this.translate.instant('PARAM_S1.deletedMessage'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('PARAM_S1.button 1', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('PARAM_S1.button 2'),
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
          this.getParameters(indexPass.toString(), indexDecisionParameter.toString()).removeAt(+indexParameter);

          this.matTables.forEach((each) => each.renderRows());
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        }
      });
    } else {
      this.getParameters(indexPass.toString(), indexDecisionParameter.toString()).removeAt(+indexParameter);

      this.matTables.forEach((each) => each.renderRows());
      Swal.fire({
        type: 'success',
        title: this.translate.instant('EVENT_S1.TITLE'),
        confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
      });
    }
  }

  initJuryDecisionParameterForm() {
    this.juryDecisionParameterForm = this.fb.group({
      // _id: [this.selectedClassId],
      parent_rncp_title: [this.selectedRncpTitleId],
      pass_fail_conditions: this.fb.array([]),
    });
  }

  initDecisionParameterFormArray(condition?: string, name?: string) {
    return this.fb.group({
      condition_type: [condition ? condition : null, Validators.required],
      condition_name: [name ? name : '', Validators.required],
      condition_parameters: this.fb.array([]),
    });
  }

  initParameterFormArrayScore() {
    return this.fb.group({
      correlation: [null],
      validation_type: [null, Validators.required],
      pass_mark: [null],
      validation_parameter: this.fb.group({
        parameter_type: [null],
        percentage_value: [null],
        block_id: [null],
        subject_id: [null],
        evaluation_id: [null],
        sign: [null],
      }),
    });
  }

  setFormDataScore() {
    // fill form with existing data
    this.subs.sink = this.conditionService.getJuryDecisionParameter(this.selectedRncpTitleId, this.selectedClassId).subscribe((resp) => {
      if (resp) {
        // path value for each decision parameter block (the block that has yellow border)
        resp.decision_parameters.forEach((decisionParameter, i) => {
          if (i > 0) {
            this.addpassFailDecisionParameters();
          }
          this.passFailDecisionParameters.get(i.toString()).patchValue(decisionParameter);
          decisionParameter.parameters.forEach((param, j) => {
            const blocks = [];
            const subjects = [];
            const tests = [];

            // convert object { subject_name, _id } to be string array of _id
            if (param.block_parameters.length > 0) {
              param.block_parameters.forEach((block) => {
                blocks.push(block._id);
              });
              // if blocks is more than one,
              // it mean the user select average block on validation type,
              // so the parameter dropdown is multiple.

              // if blocks has only one element,
              // it mean the user select block on validation type,
              // so the parameter dropdown is not multiple
              param.block_parameters = blocks.length > 1 ? blocks : blocks[0];
            }
            if (param.subject_parameters.length > 0) {
              param.subject_parameters.forEach((subject) => {
                subjects.push(subject._id);
              });
              param.subject_parameters = subjects.length > 1 ? subjects : subjects[0];
            }
            if (param.evaluation_parameters.length > 0) {
              param.evaluation_parameters.forEach((test) => {
                tests.push(test._id);
              });
              param.evaluation_parameters = tests.length > 1 ? tests : tests[0];
            }

            if (j > 0) {
              this.addParametersScore(i.toString());
            }

            this.getParametersScore(i.toString()).get(j.toString()).patchValue(param);
          });
        });
      } else {
      }
    });
  }

  get passFailDecisionParameters() {
    return this.juryDecisionParameterForm.get('pass_fail_conditions') as UntypedFormArray;
  }

  getPassFailDecisionParametersScore(): UntypedFormArray {
    return this.juryDecisionParameterForm.get('pass_fail_conditions') as UntypedFormArray;
  }

  addpassFailDecisionParametersScore(condition?: string, name?: string) {
    this.passFailDecisionParameters.push(this.initDecisionParameterFormArray(condition, name));

    this.matTables.forEach((each) => each.renderRows());
  }

  removepassFailDecisionParametersScore(index: number) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('DASHBOARD_DELETE.deletedTitle'),
      html: this.translate.instant('DELETE_PASS_FAIL_DECISION'),
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
        this.passFailDecisionParameters.removeAt(index);

        this.matTables.forEach((each) => each.renderRows());
        Swal.fire({
          type: 'success',
          title: this.translate.instant('EVENT_S1.TITLE'),
          html: this.translate.instant('PASS_FAIL_DELETED'),
          confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
        });
        this.conditionService.isConditionFormChanged = true;
      }
    });
  }

  getParametersScore(index): UntypedFormArray {
    return this.passFailDecisionParameters.get(index).get('condition_parameters') as UntypedFormArray;
  }

  addParametersScore(index: string) {

    this.getParametersScore(index).push(this.initParameterFormArrayScore());

    this.matTables.forEach((each) => each.renderRows());
  }

  removeParametersScore(indexDecisionParameter, indexParameter) {
    const classData = this.juryDecisionParameterForm.value;
    const paramData = classData.pass_fail_conditions[indexDecisionParameter].condition_parameters[indexParameter];

    if (
      paramData &&
      (paramData.correlation ||
        paramData.pass_mark ||
        paramData.validation_type ||
        paramData.validation_parameter.sign ||
        paramData.validation_parameter.evaluation_id ||
        paramData.validation_parameter.parameter_type ||
        paramData.validation_parameter.percentage_value ||
        paramData.validation_parameter.subject_id ||
        paramData.validation_parameter.block_id)
    ) {
      let timeDisabled = 5;
      Swal.fire({
        title: this.translate.instant('PARAM_S1.deletedTitle'),
        html: this.translate.instant('PARAM_S1.deletedMessage'),
        type: 'warning',
        allowEscapeKey: true,
        showCancelButton: true,
        confirmButtonText: this.translate.instant('PARAM_S1.button 1', { timer: timeDisabled }),
        cancelButtonText: this.translate.instant('PARAM_S1.button 2'),
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
          this.getParametersScore(indexDecisionParameter.toString()).removeAt(+indexParameter);

          this.matTables.forEach((each) => each.renderRows());
          Swal.fire({
            type: 'success',
            title: this.translate.instant('EVENT_S1.TITLE'),
            confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
          });
        }
      });
    } else {
      this.getParametersScore(indexDecisionParameter.toString()).removeAt(+indexParameter);

      this.matTables.forEach((each) => each.renderRows());
      Swal.fire({
        type: 'success',
        title: this.translate.instant('EVENT_S1.TITLE'),
        confirmButtonText: this.translate.instant('EVENT_S1.BUTTON'),
      });
    }
  }

  getValidationTypeScore(i: string, j: string) {
    return this.getParametersScore(i).get(j).get('validation_type').value;
  }

  openPassFailDialogScore() {
    const dialogRef = this.passFailDialog.open(AddPassFailDialogComponent, {
      width: '560px',
      disableClose: true,
      panelClass: 'pass-fail-pop-up',
    });
    this.subs.sink = dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.addpassFailDecisionParametersScore(result.condition, result.name);
      }
    });
  }
  allowUserSave() {
    let allow = false;
    const conditionBlock = this.conditionOfAwardForm.value;
    const classData = this.juryDecisionParameterForm.value;

    if (conditionBlock.block_of_competence_condition_input && conditionBlock.block_of_competence_condition_input.length) {
      conditionBlock.block_of_competence_condition_input.forEach((element) => {
        if (element.pass_fail_conditions && element.pass_fail_conditions.length) {
          element.pass_fail_conditions.forEach((passFail) => {
            if (passFail.condition_parameters.length < 1) {
              allow = true;
            }
          });
        }
      });
    }
    if (classData.pass_fail_conditions && classData.pass_fail_conditions.length) {
      classData.pass_fail_conditions.forEach((element) => {
        if (element.condition_parameters.length < 1) {
          allow = true;
        }
      });
    }
    if (this.conditionOfAwardForm.invalid || this.juryDecisionParameterForm.invalid) {
      allow = true;
    }
    this.conditionService.validationAllowUserSave = allow;
    return allow;
  }

  saves() {

    let blocks = this.conditionOfAwardForm.get('block_of_competence_condition_input').value;
    const payloads = this.juryDecisionParameterForm.value;
    blocks = this.convertStringToNumberType(blocks);
    this.isWaitingForResponse = true;


    this.conditionData.forEach((blockData, blockIndex) => {
      if (blockData.pass_fail_conditions && blockData.pass_fail_conditions.length) {
        blockData.pass_fail_conditions.forEach((element, passIndex) => {

          if (
            element._id &&
            blocks &&
            blocks[blockIndex] &&
            blocks[blockIndex].pass_fail_conditions &&
            blocks[blockIndex].pass_fail_conditions[passIndex] &&
            !blocks[blockIndex].pass_fail_conditions[passIndex]._id &&
            element.condition_type === blocks[blockIndex].pass_fail_conditions[passIndex].condition_type
          ) {
            blocks[blockIndex].pass_fail_conditions[passIndex]._id = element._id;
          }
        });
      }
      if (this.dataClass.pass_fail_conditions && this.dataClass.pass_fail_conditions.length) {
        this.dataClass.pass_fail_conditions.forEach((element, passIndex) => {
          if (
            element._id &&
            payloads.pass_fail_conditions &&
            payloads.pass_fail_conditions[passIndex] &&
            !payloads.pass_fail_conditions[passIndex]._id &&
            blocks[blockIndex] &&
            blocks[blockIndex].pass_fail_conditions[passIndex] &&
            blocks[blockIndex].pass_fail_conditions[passIndex].condition_type &&
            element.condition_type === blocks[blockIndex].pass_fail_conditions[passIndex].condition_type
          ) {
            payloads.pass_fail_conditions[passIndex]._id = element._id;
          }
        });
      }
    });





    this.subs.sink = this.rncpTitleService.updateMaxPoint(this.selectedClassId, payloads).subscribe((resps) => {
      this.subs.sink = this.rncpTitleService
        .createUpdateBlockOfCompetenceCondition(this.selectedRncpTitleId, this.selectedClassId, blocks)
        .subscribe((resp) => {
          if (resp && resp.data && resp.data.CreateUpdateBlockOfCompetenceCondition && !resp.errors) {
            this.isWaitingForResponse = false;
            Swal.fire({
              allowOutsideClick: false,
              type: 'success',
              title: this.translate.instant('CCED_S01.TITLE'),
              text: this.translate.instant('CCED_S01.TEXT'),
              confirmButtonText: this.translate.instant('CCED_S01.BUTTON_1'),
            }).then(() => {
              // this.ngOnInit();
              this.conditionOfAwardForm.reset();
              this.initConditionOfAwardForm();
              this.initJuryDecisionParameterForm();
              this.populateClassData();
              this.populateBlockData();
              this.conditionService.isConditionFormChanged = false;
            });
          }
        });
    });
  }

  initFormValidationParameter(data, i: string, j: string) {
    if (this.getParametersScore(i).get(j).get('validation_type').value === 'block') {
      this.getParametersScore(i).get(j).get('validation_parameter').get('subject_id').setValue(null);
      this.getParametersScore(i).get(j).get('validation_parameter').get('subject_id').clearValidators();
      this.getParametersScore(i).get(j).get('validation_parameter').get('subject_id').updateValueAndValidity();
      this.getParametersScore(i).get(j).get('validation_parameter').get('parameter_type').setValue(null);
      this.getParametersScore(i).get(j).get('validation_parameter').get('parameter_type').clearValidators();
      this.getParametersScore(i).get(j).get('validation_parameter').get('parameter_type').updateValueAndValidity();
      this.getParametersScore(i).get(j).get('validation_parameter').get('evaluation_id').setValue(null);
      this.getParametersScore(i).get(j).get('validation_parameter').get('evaluation_id').clearValidators();
      this.getParametersScore(i).get(j).get('validation_parameter').get('evaluation_id').updateValueAndValidity();
      this.getParametersScore(i).get(j).get('validation_parameter').get('sign').setValue(null);
      this.getParametersScore(i).get(j).get('validation_parameter').get('sign').clearValidators();
      this.getParametersScore(i).get(j).get('validation_parameter').get('sign').updateValueAndValidity();
      this.getParametersScore(i).get(j).get('pass_mark').setValue(null);
      this.getParametersScore(i).get(j).get('pass_mark').clearValidators();
      this.getParametersScore(i).get(j).get('pass_mark').updateValueAndValidity();
    } else if (this.getParametersScore(i).get(j).get('validation_type').value === 'subject') {
      this.getParametersScore(i).get(j).get('validation_parameter').get('block_id').setValue(null);
      this.getParametersScore(i).get(j).get('validation_parameter').get('block_id').clearValidators();
      this.getParametersScore(i).get(j).get('validation_parameter').get('block_id').updateValueAndValidity();
      this.getParametersScore(i).get(j).get('validation_parameter').get('evaluation_id').setValue(null);
      this.getParametersScore(i).get(j).get('validation_parameter').get('evaluation_id').clearValidators();
      this.getParametersScore(i).get(j).get('validation_parameter').get('evaluation_id').updateValueAndValidity();
      this.getParametersScore(i).get(j).get('validation_parameter').get('parameter_type').setValue(null);
      this.getParametersScore(i).get(j).get('validation_parameter').get('parameter_type').clearValidators();
      this.getParametersScore(i).get(j).get('validation_parameter').get('parameter_type').updateValueAndValidity();
      this.getParametersScore(i).get(j).get('validation_parameter').get('sign').setValue(null);
      this.getParametersScore(i).get(j).get('validation_parameter').get('sign').clearValidators();
      this.getParametersScore(i).get(j).get('validation_parameter').get('sign').updateValueAndValidity();
      this.getParametersScore(i).get(j).get('pass_mark').setValue(null);
      this.getParametersScore(i).get(j).get('pass_mark').setValidators([Validators.required]);
      this.getParametersScore(i).get(j).get('pass_mark').updateValueAndValidity();
    } else if (this.getParametersScore(i).get(j).get('validation_type').value === 'evaluation') {
      this.getParametersScore(i).get(j).get('validation_parameter').get('subject_id').setValue(null);
      this.getParametersScore(i).get(j).get('validation_parameter').get('subject_id').clearValidators();
      this.getParametersScore(i).get(j).get('validation_parameter').get('subject_id').updateValueAndValidity();
      this.getParametersScore(i).get(j).get('validation_parameter').get('block_id').setValue(null);
      this.getParametersScore(i).get(j).get('validation_parameter').get('block_id').clearValidators();
      this.getParametersScore(i).get(j).get('validation_parameter').get('block_id').updateValueAndValidity();
      this.getParametersScore(i).get(j).get('validation_parameter').get('parameter_type').setValue(null);
      this.getParametersScore(i).get(j).get('validation_parameter').get('parameter_type').clearValidators();
      this.getParametersScore(i).get(j).get('validation_parameter').get('parameter_type').updateValueAndValidity();
      this.getParametersScore(i).get(j).get('validation_parameter').get('sign').setValue(null);
      this.getParametersScore(i).get(j).get('validation_parameter').get('sign').clearValidators();
      this.getParametersScore(i).get(j).get('validation_parameter').get('sign').updateValueAndValidity();
      this.getParametersScore(i).get(j).get('pass_mark').setValue(null);
      this.getParametersScore(i).get(j).get('pass_mark').setValidators([Validators.required]);
      this.getParametersScore(i).get(j).get('pass_mark').updateValueAndValidity();
    } else if (this.getParametersScore(i).get(j).get('validation_type').value === 'overall_score') {
      this.getParametersScore(i).get(j).get('validation_parameter').get('parameter_type').setValue(null);
      this.getParametersScore(i).get(j).get('validation_parameter').get('parameter_type').clearValidators();
      this.getParametersScore(i).get(j).get('validation_parameter').get('parameter_type').updateValueAndValidity();
      this.getParametersScore(i).get(j).get('validation_parameter').get('block_id').setValue(null);
      this.getParametersScore(i).get(j).get('validation_parameter').get('block_id').clearValidators();
      this.getParametersScore(i).get(j).get('validation_parameter').get('block_id').updateValueAndValidity();
      this.getParametersScore(i).get(j).get('validation_parameter').get('subject_id').setValue(null);
      this.getParametersScore(i).get(j).get('validation_parameter').get('subject_id').clearValidators();
      this.getParametersScore(i).get(j).get('validation_parameter').get('subject_id').updateValueAndValidity();
      this.getParametersScore(i).get(j).get('validation_parameter').get('evaluation_id').setValue(null);
      this.getParametersScore(i).get(j).get('validation_parameter').get('evaluation_id').clearValidators();
      this.getParametersScore(i).get(j).get('validation_parameter').get('evaluation_id').updateValueAndValidity();
      this.getParametersScore(i).get(j).get('validation_parameter').get('sign').setValue(null);
      this.getParametersScore(i).get(j).get('validation_parameter').get('sign').clearValidators();
      this.getParametersScore(i).get(j).get('validation_parameter').get('sign').updateValueAndValidity();
      this.getParametersScore(i).get(j).get('pass_mark').setValue(null);
      this.getParametersScore(i).get(j).get('pass_mark').setValidators([Validators.required]);
      this.getParametersScore(i).get(j).get('pass_mark').updateValueAndValidity();
    }
  }

  generateTooltipClass(i: string, j: string) {
    let tooltip = '';
    if (this.getParametersScore(i).get(j).get('validation_type').value === 'block') {
      if (this.getParametersScore(i).get(j).get('validation_parameter').get('block_id').value) {
        if (this.expertises && this.expertises.length) {
          const tooltipArray = this.expertises.filter(
            (list) => list._id === this.getParametersScore(i).get(j).get('validation_parameter').get('block_id').value,
          );
          if (tooltipArray && tooltipArray.length) {
            tooltip = tooltipArray[0].block_of_competence_condition;
          }
        }
      }
    } else if (this.getParametersScore(i).get(j).get('validation_type').value === 'subject') {
      if (this.getParametersScore(i).get(j).get('validation_parameter').get('subject_id').value) {
        if (this.subjects && this.subjects.length) {
          const tooltipArray = this.subjects.filter(
            (list) => list._id === this.getParametersScore(i).get(j).get('validation_parameter').get('subject_id').value,
          );
          if (tooltipArray && tooltipArray.length) {
            tooltip = tooltipArray[0].subject_name;
          }
        }
      }
    } else if (this.getParametersScore(i).get(j).get('validation_type').value === 'evaluation') {
      if (this.getParametersScore(i).get(j).get('validation_parameter').get('evaluation_id').value) {
        if (this.evaluationList && this.evaluationList.length) {
          const tooltipArray = this.evaluationList.filter(
            (list) => list._id === this.getParametersScore(i).get(j).get('validation_parameter').get('evaluation_id').value,
          );
          if (tooltipArray && tooltipArray.length) {
            tooltip = tooltipArray[0].evaluation;
          }
        }
      }
    }
    return tooltip;
  }

  generateTooltipBlock(i: string, j: string, k: string, indexList) {
    let tooltip = '';
    if (this.getParameters(k, i).get(j).get('validation_type').value === 'subject') {
      if (this.getParameters(k, i).get(j).get('validation_parameter').get('subject_id').value) {
        if (this.listOfSubject && this.listOfSubject[indexList]) {
          const tooltipArray = this.listOfSubject[indexList].filter(
            (list) => list._id === this.getParameters(k, i).get(j).get('validation_parameter').get('subject_id').value,
          );
          if (tooltipArray && tooltipArray.length) {
            tooltip = tooltipArray[0].subject_name;
          }
        }
      }
    } else if (this.getParameters(k, i).get(j).get('validation_type').value === 'evaluation') {
      if (this.getParameters(k, i).get(j).get('validation_parameter').get('evaluation_id').value) {
        if (this.listOfEvaluation && this.listOfEvaluation[indexList]) {
          const tooltipArray = this.listOfEvaluation[indexList].filter(
            (list) => list._id === this.getParameters(k, i).get(j).get('validation_parameter').get('evaluation_id').value,
          );
          if (tooltipArray && tooltipArray.length) {
            tooltip = tooltipArray[0].evaluation;
          }
        }
      }
    }
    return tooltip;
  }
  getTooltipMinimum(i: string, j: string) {
    let tooltip = '';
    if (
      this.passFailDecisionParameters.get(i).get('condition_parameters').get(j).get('validation_parameter').get('sign').value === 'pass'
    ) {
      tooltip = this.translate.instant('Validated');
    } else {
      tooltip = this.translate.instant('Not Validated');
    }
    return tooltip;
  }
}
