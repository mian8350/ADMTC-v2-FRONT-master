import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  OnDestroy,
  ViewChild,
  ChangeDetectorRef,
  AfterViewChecked,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { UntypedFormBuilder, Validators, UntypedFormGroup, UntypedFormControl, UntypedFormArray, AbstractControl } from '@angular/forms';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { TranslateService } from '@ngx-translate/core';

import * as DecoupledEditor from 'assets/ckeditor5-custom/ckeditor.js';
import * as _ from 'lodash';
import { BehaviorSubject, Observable } from 'rxjs';
import Swal from 'sweetalert2';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectChange } from '@angular/material/select';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';
import { SubSink } from 'subsink';
import { UtilityService } from 'app/service/utility/utility.service';
import { TranscriptBuilderService } from 'app/service/transcript-builder/transcript-builder.service';
import { STYLE } from '../../score/second-step-score/condition-score-preview/pdf-styles';
import { ConditionScorePreviewComponent } from '../../score/second-step-score/condition-score-preview/condition-score-preview.component';
import { environment } from 'environments/environment';
import { AddBlockConditionDialogComponent } from '../add-block-condition-dialog/add-block-condition-dialog.component';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { removeSpaces } from 'app/service/customvalidator.validator';

interface EvaluationRetakeBlock {
  selected_evaluation_retake_block: string; // fill with evaluation id
  selected_evaluation_retake_block_temp: {
    block_of_competence_condition_name: string; // block name
    subject_name: string; // subject name
    selected_evaluation_retake_block_name: string; // evaluation name
  };
}

@Component({
  selector: 'ms-fourth-step-expertise',
  templateUrl: './fourth-step-expertise.component.html',
  styleUrls: ['./fourth-step-expertise.component.scss'],
})
export class FourthStepExpertiseComponent implements OnInit, OnDestroy, AfterViewChecked {
  private subs = new SubSink();
  blockValue = null;

  @Input() selectedRncpTitleId: string;
  @Input() selectedClassId: string;
  @Input() className: string;
  @Input() titleName: string;
  @Input() titleLongName: string;
  @Input() evaluationStep: string;
  @Output() updateStep = new EventEmitter<string>();
  @ViewChild('conditionPdf', { static: false }) conditionPdf: ConditionScorePreviewComponent;
  @ViewChildren('blockPanel') blockPanel: QueryList<ElementRef>;

  // forms
  conditionOfAwardForm: UntypedFormGroup;

  evaluationRetakeBlockMap = new Map<string, EvaluationRetakeBlock[]>();
  selectedEvaluationRetakeBlock = new UntypedFormControl(null);

  blockList = [];
  initBlockList = [];
  filteredBlock: Observable<any[]>;
  savedBlockList = [];
  savedSubjectOfTranversal = [];

  specializations = [];
  selectedSpec = [];

  // retake block data
  retakeBlockList = [];

  // transversal subject list;
  transversalSubjectList = [];

  // Is condition has transversal block
  isTransversalBlockExist = false;

  // Trigger for expand/close
  competencyDisabled = [true, true, true, true];
  subjectDisabled = [true, true, true];
  evaluationDisabled = [true, true, true];
  isSubjectTranversal = false;

  // Type Evaluation List
  evaluationList = [];
  evaluationListFiltered = [];
  oriEvaluationList = [
    {
      option: 'Oral',
      value: 'oral',
    },
    {
      option: 'Written',
      value: 'written',
    },
    {
      option: 'Memoire-ECRIT',
      value: 'memoire_ecrit',
    },
    // {
    //   option: 'Memoire-ORAL',
    //   value: 'memoire_oral',
    // },
    {
      option: 'free-continuous-control',
      value: 'free_continuous_control',
    },
    {
      option: 'mentor-evaluation',
      value: 'mentor_evaluation',
    },
    // {
    //   option: 'Memoire oral non jury',
    //   value: 'memoire_oral_non_jury',
    // },
  ];

  evaluationListAcademicRecommendation = [];
  evaluationListAcademicRecommendationFiltered = [];
  oriEvaluationListAcademicRecommendation = [
    {
      option: 'academic_recommendation',
      value: 'academic_recommendation',
    },
  ];

  evaluationListSoftSkill = [];
  evaluationListSoftSkillFiltered = [];
  oriEvaluationListSoftSkill = [
    {
      option: 'soft_skill_auto_evaluation',
      value: 'soft_skill_auto_evaluation',
    },
    {
      option: 'soft_skill_pro_evaluation',
      value: 'soft_skill_pro_evaluation',
    },
    { 
      option: 'preparation_center_eval_soft_skill', 
      value: 'preparation_center_eval_soft_skill' 
    }
  ];

  evaluationListCompetence = [];
  evaluationListCompetenceFiltered = [];
  oriEvaluationListCompetence = [
    {
      option: 'academic_auto_evaluation',
      value: 'academic_auto_evaluation',
    },
    {
      option: 'academic_pro_evaluation',
      value: 'academic_pro_evaluation',
    },
  ];

  evaluationListRetake = [];
  evaluationListRetakeFiltered = [];
  oriEvaluationListRetake = [
    {
      option: 'Oral',
      value: 'oral',
    },
    {
      option: 'Written',
      value: 'written',
    },
    {
      option: 'Memoire-ECRIT',
      value: 'Memoire-ECRIT',
    },
  ];

  // spinner on waiting for be
  isWaitingForResponse = false;
  headerCompetency: any;
  headerSoftSkill: any;
  fullBlockData = [];

  // ckeditor configuration
  public Editor = DecoupledEditor;
  private timeOutVal: any;
  private intVal: any;
  public onReady(editor) {
    editor.ui.getEditableElement().parentElement.insertBefore(editor.ui.view.toolbar.element, editor.ui.getEditableElement());
  }

  constructor(
    private fb: UntypedFormBuilder,
    private rncpTitleService: RNCPTitlesService,
    private translate: TranslateService,
    public utilService: UtilityService,
    private transcriptBuilderService: TranscriptBuilderService,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog,
  ) {}

  ngOnInit() {
    // this.competencyList.forEach(comp => {
    //   if (comp) {
    //     this.competencyDisabled.push(false);
    //   }
    // });
    this.getSpecList();
    this.initConditionOfAwardForm();
    this.populateBlockData();

    // ************** used to update the preview, need to debounce to improve performance
    this.subs.sink = this.conditionOfAwardForm
      .get('block_of_competence_condition_input')
      .valueChanges.pipe(debounceTime(800))
      .pipe(distinctUntilChanged())
      .subscribe((resp) => {

        this.blockValue = resp;
      });
    
    //********** First Time Translate option
    this.evaluationList = this.oriEvaluationList.map((elem) => {
      return {
        value: elem.value,
        option: this.translate.instant('PARAMETERS-RNCP.TEST.TYPE.' + elem.option)
      }
    });
    this.evaluationListCompetence = this.oriEvaluationListCompetence.map((elem) => {
      return {
        value: elem.value,
        option: this.translate.instant('PARAMETERS-RNCP.TEST.TYPE.' + elem.option)
      }
    });
    this.evaluationListSoftSkill = this.oriEvaluationListSoftSkill.map((elem) => {
      return {
        value: elem.value,
        option: this.translate.instant('PARAMETERS-RNCP.TEST.TYPE.' + elem.option)
      }
    });
    this.evaluationListRetake = this.oriEvaluationListRetake.map((elem) => {
      return {
        value: elem.value,
        option: this.translate.instant('PARAMETERS-RNCP.TEST.TYPE.' + elem.option)
      }
    });
    this.evaluationListAcademicRecommendation = this.oriEvaluationListAcademicRecommendation.map((elem) => {
      return {
        value: elem.value,
        option: this.translate.instant('PARAMETERS-RNCP.TEST.TYPE.' + elem.option)
      }
    });
    
    //**********  Listen on language change then translate option again
    this.subs.sink = this.translate.onLangChange.subscribe(() => {
      this.evaluationList = this.oriEvaluationList.map((elem) => {
        return {
          value: elem.value,
          option: this.translate.instant('PARAMETERS-RNCP.TEST.TYPE.' + elem.option)
        }
      });
      this.evaluationListFiltered = this.evaluationList;

      this.evaluationListCompetence = this.oriEvaluationListCompetence.map((elem) => {
        return {
          value: elem.value,
          option: this.translate.instant('PARAMETERS-RNCP.TEST.TYPE.' + elem.option)
        }
      });
      this.evaluationListCompetenceFiltered = this.evaluationListCompetence;

      this.evaluationListSoftSkill = this.oriEvaluationListSoftSkill.map((elem) => {
        return {
          value: elem.value,
          option: this.translate.instant('PARAMETERS-RNCP.TEST.TYPE.' + elem.option)
        }
      });
      this.evaluationListSoftSkillFiltered = this.evaluationListSoftSkill;


      this.evaluationListRetake = this.oriEvaluationListRetake.map((elem) => {
        return {
          value: elem.value,
          option: this.translate.instant('PARAMETERS-RNCP.TEST.TYPE.' + elem.option)
        }
      });
      this.evaluationListRetakeFiltered = this.evaluationListRetake;

      this.evaluationListAcademicRecommendation = this.oriEvaluationListAcademicRecommendation.map((elem) => {
        return {
          value: elem.value,
          option: this.translate.instant('PARAMETERS-RNCP.TEST.TYPE.' + elem.option)
        }
      });
      this.evaluationListAcademicRecommendationFiltered = this.evaluationListAcademicRecommendation;
    });
  }

  ngAfterViewChecked() {
    this.cdr.detectChanges();
  }

  initConditionOfAwardForm() {
    this.conditionOfAwardForm = this.fb.group({
      rncp_title_id: [this.selectedRncpTitleId],
      class_id: [this.selectedClassId],
      block_of_competence_condition_input: this.fb.array([]),
    });
  }

  initBlockFormArray(isTranversal?: boolean) {
    return this.fb.group({
      _id: [null],
      block_rncp_reference: [null, [removeSpaces]],
      rncp_title: [this.selectedRncpTitleId],
      class_id: [this.selectedClassId],
      block_of_competence_condition: ['', Validators.required],
      description: [''],
      block_of_competence_condition_credit: [null],
      transversal_block: [false],
      is_retake_by_block: [false],
      is_one_of_test_published: [false],
      selected_block_retake: [null],
      selected_block_retake_name: [null],
      is_specialization: [false],
      specialization: [null],
      count_for_title_final_score: [false],
      page_break: [false],
      subjects: this.fb.array([]),
      block_of_tempelate_competence: [null],
      block_of_tempelate_soft_skill: [null],
      block_type: ['manual'],
      is_auto_pro_eval: [false],
      ref_id: [null],
      is_academic_recommendation: [false],
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
      subject_name: !isTranversalSubject ? ['', Validators.required] : [null],
      minimum_score_for_certification: !isTranversalSubject ? [null, Validators.pattern('^[0-9]+(.[0-9]{1,2})?$')] : [null],
      coefficient: isTranversalSubject ? [null] : [0, Validators.required],
      count_for_title_final_score: [true],
      credit: [null],
      evaluations: this.fb.array([]),
    });
  }

  initEvaluationFormArray() {
    return this.fb.group({
      _id: [null],
      evaluation: [null, Validators.required],
      type: [null, Validators.required],
      weight: [null, Validators.required],
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
    });
  }

  getSpecList() {
    this.subs.sink = this.rncpTitleService.getSpecializationByClass(this.selectedClassId).subscribe((response) => {
      if (response) {
        if (response.specializations && response.specializations.length) {
          this.specializations = response.specializations.sort((a, b) => a.name.localeCompare(b.name)); 
        } else {
          this.specializations = [];
        }
      }

    });
  }

  populateBlockData() {
    this.isWaitingForResponse = true;
    let getFirstIndexCompetency = false;
    let getFirstIndexSoftSkill = false;
    this.subs.sink = this.rncpTitleService
      .getAllBlockOfCompetenceConditions(this.selectedRncpTitleId, this.selectedClassId)
      .subscribe((resp) => {
        const response = _.cloneDeep(resp);
        if (response && response.length) {

          this.initBlockList = _.cloneDeep(response);
          this.fullBlockData = _.cloneDeep(response);
          const resp = _.cloneDeep(response);
          this.initList(resp);
          this.setEvaluationRetakeBlockMap(resp);
          resp.forEach((blockData, blockIndex) => {
            this.isWaitingForResponse = false;

            if (blockData.block_type === 'competence' && !getFirstIndexCompetency) {
              getFirstIndexCompetency = true;
              this.headerCompetency = blockIndex;
            }
            if (blockData.block_type === 'soft_skill' && !getFirstIndexSoftSkill) {
              getFirstIndexSoftSkill = true;
              this.headerSoftSkill = blockIndex;
            }
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
            if (blockData.block_of_tempelate_competence && blockData.block_of_tempelate_competence._id) {
              // blockData.ref_id = blockData.block_of_tempelate_competence.ref_id
              blockData.ref_id = blockData.block_of_tempelate_competence.ref_id;
              blockData.block_of_tempelate_competence = blockData.block_of_tempelate_competence._id;
            }
            if (blockData.block_of_tempelate_soft_skill && blockData.block_of_tempelate_soft_skill._id) {
              blockData.ref_id = blockData.block_of_tempelate_soft_skill.ref_id;
              blockData.block_of_tempelate_soft_skill = blockData.block_of_tempelate_soft_skill._id;
            }
            blockData.block_type = blockData.block_type ? blockData.block_type : 'manual';

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

              this.blockFormArray.at(blockIndex).get('is_academic_recommendation').reset();
              this.blockFormArray.at(blockIndex).get('is_academic_recommendation').disable();
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
              this.blockFormArray.at(blockIndex).get('block_of_competence_condition_credit').reset();
              this.blockFormArray.at(blockIndex).get('is_retake_by_block').disable();
              this.blockFormArray.at(blockIndex).get('is_specialization').reset();
              this.blockFormArray.at(blockIndex).get('is_specialization').disable();
              this.blockFormArray.at(blockIndex).get('count_for_title_final_score').reset();
              this.blockFormArray.at(blockIndex).get('count_for_title_final_score').disable();
              this.blockFormArray.at(blockIndex).get('is_academic_recommendation').reset();
              this.blockFormArray.at(blockIndex).get('is_academic_recommendation').disable();
            } else if (blockData && blockData.is_retake_by_block) {
              this.blockFormArray.at(blockIndex).get('transversal_block').reset();
              this.blockFormArray.at(blockIndex).get('transversal_block').disable();
              this.blockFormArray.at(blockIndex).get('is_specialization').reset();
              this.blockFormArray.at(blockIndex).get('is_specialization').disable();
              this.blockFormArray.at(blockIndex).get('count_for_title_final_score').reset();
              this.blockFormArray.at(blockIndex).get('count_for_title_final_score').disable();
              this.blockFormArray.at(blockIndex).get('is_academic_recommendation').reset();
              this.blockFormArray.at(blockIndex).get('is_academic_recommendation').disable();
            } else if ((blockData && blockData.is_specialization) || blockData.count_for_title_final_score) {
              this.blockFormArray.at(blockIndex).get('transversal_block').reset();
              this.blockFormArray.at(blockIndex).get('transversal_block').disable();
              this.blockFormArray.at(blockIndex).get('is_retake_by_block').reset();
              this.blockFormArray.at(blockIndex).get('is_retake_by_block').disable();
              this.blockFormArray.at(blockIndex).get('is_academic_recommendation').reset();
              this.blockFormArray.at(blockIndex).get('is_academic_recommendation').disable();
            } else if (blockData && blockData.is_academic_recommendation) {
              this.blockFormArray.at(blockIndex).get('is_retake_by_block').reset();
              this.blockFormArray.at(blockIndex).get('is_retake_by_block').disable();
              this.blockFormArray.at(blockIndex).get('transversal_block').reset();
              this.blockFormArray.at(blockIndex).get('transversal_block').disable();
              this.blockFormArray.at(blockIndex).get('is_specialization').reset();
              this.blockFormArray.at(blockIndex).get('is_specialization').disable();
              this.blockFormArray.at(blockIndex).get('count_for_title_final_score').reset();
              this.blockFormArray.at(blockIndex).get('count_for_title_final_score').disable();
            }

            // Create empty subject form
            if (blockData && blockData.subjects && blockData.subjects.length >= 0) {
              blockData.subjects.forEach((subjectData, subjectIndex) => {
                const tempSubjectData = _.cloneDeep(subjectData);
                let isTranversalSubject = false;
                if (
                  tempSubjectData &&
                  tempSubjectData.subject_transversal_block_id &&
                  typeof tempSubjectData.subject_transversal_block_id === 'object' &&
                  tempSubjectData.subject_transversal_block_id._id
                ) {
                  subjectData.subject_transversal_block_id = tempSubjectData.subject_transversal_block_id._id;
                  isTranversalSubject = true;
                }

                if (subjectData && subjectData.rncp_title && typeof subjectData.rncp_title === 'object' && subjectData.rncp_title._id) {
                  subjectData.rncp_title = subjectData.rncp_title._id;
                }
                if (subjectData && subjectData.class_id && typeof subjectData.class_id === 'object' && subjectData.class_id._id) {
                  subjectData.class_id = subjectData.class_id._id;
                }

                if (
                  tempSubjectData &&
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
          this.setBlockConditionArray(resp);

          // this.blockFormArray.patchValue(resp);

          this.isWaitingForResponse = false;
        }
        this.isWaitingForResponse = false;
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
      this.blockFormArray.at(blockIndex).get('count_for_title_final_score').setValue(blockData.count_for_title_final_score);
      if (blockData.description) {
        this.blockFormArray.at(blockIndex).get('description').setValue(blockData.description);
      }
      this.blockFormArray.at(blockIndex).get('is_retake_by_block').setValue(blockData.is_retake_by_block);
      if (blockData.block_of_tempelate_competence) {
        this.blockFormArray.at(blockIndex).get('block_of_tempelate_competence').setValue(blockData.block_of_tempelate_competence);
      }
      if (blockData.block_of_tempelate_soft_skill) {
        this.blockFormArray.at(blockIndex).get('block_of_tempelate_soft_skill').setValue(blockData.block_of_tempelate_soft_skill);
      }
      this.blockFormArray.at(blockIndex).get('is_specialization').setValue(blockData.is_specialization);
      if (blockData.specialization) {
        this.blockFormArray.at(blockIndex).get('specialization').setValue(blockData.specialization);
      }
      this.blockFormArray.at(blockIndex).get('page_break').setValue(blockData.page_break);
      if (blockData.selected_block_retake) {
        this.blockFormArray.at(blockIndex).get('selected_block_retake').setValue(blockData.selected_block_retake);
      }
      if (blockData.block_type) {
        this.blockFormArray.at(blockIndex).get('block_type').setValue(blockData.block_type);
      }
      if (blockData.is_auto_pro_eval && blockData.is_auto_pro_eval !== undefined && blockData.is_auto_pro_eval !== null) {
        this.blockFormArray.at(blockIndex).get('is_auto_pro_eval').setValue(blockData.is_auto_pro_eval);
      }
      if (blockData.ref_id) {
        this.blockFormArray.at(blockIndex).get('ref_id').setValue(blockData.ref_id);
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
          if (subjectsData.coefficient) {
            this.getSubjectArray(blockIndex).at(subjectsIndex).get('coefficient').setValue(subjectsData.coefficient);
          }
          if (subjectsData.credit) {
            this.getSubjectArray(blockIndex).at(subjectsIndex).get('credit').setValue(subjectsData.credit);
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
              .setValue(subjectsData.minimum_score_for_certification);
          }
          if (subjectsData.subject_name) {
            this.getSubjectArray(blockIndex).at(subjectsIndex).get('subject_name').setValue(subjectsData.subject_name);
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
            });
          }
        });
      }
      this.blockFormArray.at(blockIndex).get('is_academic_recommendation').setValue(blockData.is_academic_recommendation);
    });
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

  // Form array get
  get blockFormArray(): UntypedFormArray {
    return this.conditionOfAwardForm.get('block_of_competence_condition_input') as UntypedFormArray;
  }

  getSubjectArray(competencyIndex: number): UntypedFormArray {
    return this.blockFormArray.at(competencyIndex).get('subjects') as UntypedFormArray;
  }

  getEvaluationFormArray(competencyIndex: number, subjectIndex: number): UntypedFormArray {
    return this.getSubjectArray(competencyIndex).at(subjectIndex).get('evaluations') as UntypedFormArray;
  }
  // End of get array form

  // Add data into array
  addEmptyBlockFormArray(isInterval?: boolean) {
    this.blockFormArray.push(this.initBlockFormArray(isInterval ? isInterval : false));
  }

  addBlockFormArray() {
    const dialogRef = this.dialog
      .open(AddBlockConditionDialogComponent, {
        width: '600px',
        panelClass: 'certification-rule-pop-up',
        disableClose: true,
      })
      .afterClosed()
      .subscribe((resp) => {
        if (resp && resp.name) {
          if (this.isBlockAlreadyExist(resp.name)) {
            Swal.fire({
              type: 'error',
              title: this.translate.instant('block_already_exist'),
            });
            return;
          }
          this.blockFormArray.push(this.initBlockFormArray());
          const lastIndex = this.blockFormArray.length - 1;
          this.blockFormArray.at(lastIndex).get('block_of_competence_condition').patchValue(resp.name);




          if (
            this.blockFormArray.at(lastIndex).get('is_retake_by_block').value ||
            this.blockFormArray.at(lastIndex).get('is_specialization').value ||
            this.blockFormArray.at(lastIndex).get('count_for_title_final_score').value
          ) {
            this.blockFormArray.at(lastIndex).get('is_academic_recommendation').reset();
            this.blockFormArray.at(lastIndex).get('is_academic_recommendation').disable();
          }
          setTimeout(() => {
            if (this.blockPanel && this.blockPanel.last && this.blockPanel.length) {


              this.blockPanel.toArray()[this.blockPanel.length - 1].nativeElement.scrollIntoView({ behavior: 'smooth' });
            }
          }, 1000);
        }
      });
  }

  isBlockAlreadyExist(blockName: string): boolean {
    // check if manual block name already exist
    let isBlockExist = false;
    const blocks = this.blockFormArray.value;
    if (blocks && blocks.length && blockName) {
      for (const block of blocks) {
        if (!block.ref_id && block.block_of_competence_condition && block.block_of_competence_condition === blockName) {
          isBlockExist = true;
          break;
        }
      }
    }
    return isBlockExist;
  }

  addEmptySubjectFormArray(competencyIndex: number, isTranversalSubject?: boolean) {
    this.getSubjectArray(competencyIndex).push(this.initSubjectFormArray(0, isTranversalSubject));
  }

  addSubjectFormArray(competencyIndex: number) {
    if (
      this.blockFormArray.at(competencyIndex).get('is_academic_recommendation').value &&
      this.getSubjectArray(competencyIndex).length >= 1
    ) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('RECOM_S2.TITLE'),
        text: this.translate.instant('RECOM_S2.TEXT'),
        footer: `<span style="margin-left: auto">RECOM_S2</span>`,
        confirmButtonText: this.translate.instant('RECOM_S2.BUTTON')
      });
      return;
    } else {
      this.getSubjectArray(competencyIndex).push(this.initSubjectFormArray());
    }
  }

  addEmptyEvaluationFormArray(competencyIndex: number, subjectIndex: number) {
    this.getEvaluationFormArray(competencyIndex, subjectIndex).push(this.initEvaluationFormArray());
  }

  addEvaluationFormArray(competencyIndex: number, subjectIndex: number) {
    const evalData = _.cloneDeep(this.getEvaluationFormArray(competencyIndex, subjectIndex).value);

    if (this.calculateTotalEval(evalData) < 100) {
      // add form to evaluations form array
      if (
        this.blockFormArray.at(competencyIndex).get('is_academic_recommendation').value &&
        this.getEvaluationFormArray(competencyIndex, subjectIndex).length >= 1
      ) {
        Swal.fire({
          type: 'warning',
          title: 'Can only have one evaluation',
        });
        return;
      } else {
        this.getEvaluationFormArray(competencyIndex, subjectIndex).push(this.initEvaluationFormArray());
        if (this.blockFormArray.at(competencyIndex).get('is_academic_recommendation').value) {
          this.getEvaluationFormArray(competencyIndex, subjectIndex).at(evalData.length).get('type').setValue('academic_recommendation');
        }
        // assign weight automatically to the latest evaluation
        const assignWeight = 100 - this.calculateTotalEval(evalData);
        this.getEvaluationFormArray(competencyIndex, subjectIndex).at(evalData.length).get('weight').setValue(assignWeight);
      }
    } else {
      Swal.fire({
        type: 'error',
        title: this.translate.instant('EXPERTISE.WEIGHTSHOUDBEHUNDREDTitle'),
        html: this.translate.instant('EXPERTISE.WEIGHTSHOUDBEHUNDREDText'),
        confirmButtonText: 'OK',
      });
    }
  }
  // End of add data into formarray

  // Remove data from array
  removeBlockFormArray(blockIndex: number) {
    const emptyBlock = JSON.stringify(this.initBlockFormArray().value);
    const selectedBlock = JSON.stringify(this.blockFormArray.at(blockIndex).value);

    if (emptyBlock !== selectedBlock) {
      let timeDisabled = 5;
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('CC2T_S01.TITLE'),
        text: this.translate.instant('CC2T_S01.TEXT'),
        footer: `<span style="margin-left: auto">CC2T_S01</span>`,
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
            // clearTimeout(time);
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
                  this.updateSelectedSpec();
                  Swal.fire({
                    allowOutsideClick: false,
                    type: 'success',
                    title: this.translate.instant('CC2T_S01b.TITLE'),
                    text: this.translate.instant('CC2T_S01b.TEXT'),
                    footer: `<span style="margin-left: auto">CC2T_S01b</span>`,
                    confirmButtonText: this.translate.instant('CC2T_S01b.BUTTON_1'),
                  });
                } else if (resp.errors && resp.errors.length && resp.errors[0].message) {
                  Swal.fire({
                    allowOutsideClick: false,
                    type: 'error',
                    title: this.translate.instant('CC2T_S01C.TITLE'),
                    html: this.translate.instant('CC2T_S01C.TEXT'),
                    footer: `<span style="margin-left: auto">CC2T_S01C</span>`,
                    confirmButtonText: this.translate.instant('CC2T_S01C.BUTTON_1'),
                  });
                }
              });
          } else {
            this.blockFormArray.removeAt(blockIndex);
            this.updateSelectedSpec();
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
    } else {
      if (this.blockFormArray.at(blockIndex).get('_id').value) {
        this.isWaitingForResponse = true;
        this.subs.sink = this.rncpTitleService
          .deleteBlockCompetence(this.blockFormArray.at(blockIndex).get('_id').value)
          .subscribe((resp) => {
            this.isWaitingForResponse = false;

            if (resp && !resp.errors) {
              this.blockFormArray.removeAt(blockIndex);
              this.updateSelectedSpec();
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
        this.updateSelectedSpec();
        Swal.fire({
          allowOutsideClick: false,
          type: 'success',
          title: this.translate.instant('CC2T_S01b.TITLE'),
          text: this.translate.instant('CC2T_S01b.TEXT'),
          confirmButtonText: this.translate.instant('CC2T_S01b.BUTTON_1'),
        });
      }
    }
  }

  removeSubjectFormArray(competencyIndex: number, subjectIndex: number) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('PARAMETERS-RNCP.TEST.deletedSubjectWarningTitle'),
      text: this.translate.instant('PARAMETERS-RNCP.TEST.deletedSubjectWarningMessage'),
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

  removeEvaluationFormArray(competencyIndex: number, subjectIndex: number, evaluationIndex: number) {
    let timeDisabled = 5;
    Swal.fire({
      title: this.translate.instant('PARAMETERS-RNCP.TEST.deletedTestWarningTitle'),
      text: this.translate.instant('PARAMETERS-RNCP.TEST.deletedTestWarningMessage'),
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
  // End of remove data from array

  // function related to page break
  addPageBreak(blockIndex: number) {
    this.blockFormArray.at(blockIndex).get('page_break').patchValue(true);
  }

  removePageBreak(blockIndex: number) {
    this.blockFormArray.at(blockIndex).get('page_break').patchValue(false);
  }
  // End of page break functions

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
    const formEvaluationData: string[] = this.getEvaluationFormArray(blockIndex, subjectIndex)
      .at(evalIndex)
      .get('selected_evaluation_retake_block').value;

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

  displayRetakeDuringTheYear(blockIndex: number, subjectIndex: number, evalIndex: number): boolean {
    const evalType = this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('type').value;
    return evalType === 'Oral' || evalType === 'Written' || evalType === 'Memoire - ECRIT' || evalType === 'Jury';
  }

  // Get data from transversal block
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
  // End get data from transversal block

  // Function to select transversal subject
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

  // Change conditions for block slider
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
          this.blockFormArray.at(blockIndex).get('block_of_competence_condition_credit').reset();
          this.blockFormArray.at(blockIndex).get('is_retake_by_block').disable({ emitEvent: false });
          this.blockFormArray.at(blockIndex).get('is_specialization').reset();
          this.blockFormArray.at(blockIndex).get('is_specialization').disable({ emitEvent: false });
          this.blockFormArray.at(blockIndex).get('count_for_title_final_score').reset();
          this.blockFormArray.at(blockIndex).get('count_for_title_final_score').disable({ emitEvent: false });
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
        this.blockFormArray.at(blockIndex).get('is_retake_by_block').enable();
        this.blockFormArray.at(blockIndex).get('is_specialization').enable();
        this.blockFormArray.at(blockIndex).get('count_for_title_final_score').enable();
      } else {
        Swal.fire({
          type: 'error',
          title: this.translate.instant('CC2T_S04.TITLE'),
          text: this.translate.instant('CC2T_S04.TEXT'),
          footer: `<span style="margin-left: auto">CC2T_S04</span>`,
          confirmButtonText: this.translate.instant('CC2T_S04.BUTTON'),
          allowEscapeKey: false,
          allowOutsideClick: false,
          allowEnterKey: false,
        }).then(() => {
          this.blockFormArray.at(blockIndex).get('transversal_block').patchValue(true, { emitEvent: false, onlySelf: true });
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

  changeAcademicRecommendation(event: MatSlideToggleChange, blockIndex: number) {
    if (this.onlyOneAcademicRecomendation(blockIndex)) {
      return;
    } else {
      if (event && event.checked) {
        this.blockFormArray.at(blockIndex).get('is_retake_by_block').reset();
        this.blockFormArray.at(blockIndex).get('is_retake_by_block').disable({ emitEvent: false });
        this.blockFormArray.at(blockIndex).get('transversal_block').reset();
        this.blockFormArray.at(blockIndex).get('transversal_block').disable({ emitEvent: false });
        this.blockFormArray.at(blockIndex).get('is_specialization').reset();
        this.blockFormArray.at(blockIndex).get('is_specialization').disable({ emitEvent: false });
        this.blockFormArray.at(blockIndex).get('count_for_title_final_score').reset();
        this.blockFormArray.at(blockIndex).get('count_for_title_final_score').disable({ emitEvent: false });
        this.getSubjectArray(blockIndex).clear();
        this.addSubjectFormArray(blockIndex);
        if (this.getSubjectArray(blockIndex).length && this.getSubjectArray(blockIndex).length >= 1) {
          this.addEvaluationFormArray(blockIndex, 0);
          if (this.getEvaluationFormArray(blockIndex, 0).length >= 1) {
            this.getEvaluationFormArray(blockIndex, 0).at(0).get('weight').patchValue(100, {emitEvent: false});
          }
        }
      } else {
        this.blockFormArray.at(blockIndex).get('is_retake_by_block').reset();
        this.blockFormArray.at(blockIndex).get('is_retake_by_block').enable();
        this.blockFormArray.at(blockIndex).get('transversal_block').reset();
        this.blockFormArray.at(blockIndex).get('transversal_block').enable();
        this.blockFormArray.at(blockIndex).get('is_specialization').reset();
        this.blockFormArray.at(blockIndex).get('is_specialization').enable();
        this.blockFormArray.at(blockIndex).get('count_for_title_final_score').reset();
        this.blockFormArray.at(blockIndex).get('count_for_title_final_score').enable();
        this.getSubjectArray(blockIndex).clear();
      }
    }
  }

  changeRetakeBlock(event: MatSlideToggleChange, blockIndex: number) {
    if (event && event.checked) {
      this.getRetakeBlock();
      this.blockFormArray.at(blockIndex).get('transversal_block').reset();
      this.blockFormArray.at(blockIndex).get('transversal_block').disable({ emitEvent: false });
      this.blockFormArray.at(blockIndex).get('is_specialization').reset();
      this.blockFormArray.at(blockIndex).get('is_specialization').disable({ emitEvent: false });
      this.blockFormArray.at(blockIndex).get('count_for_title_final_score').reset();
      this.blockFormArray.at(blockIndex).get('count_for_title_final_score').disable({ emitEvent: false });
      this.blockFormArray.at(blockIndex).get('is_academic_recommendation').reset();
      this.blockFormArray.at(blockIndex).get('is_academic_recommendation').disable({ emitEvent: false });
    } else {
      this.removeConnectedRetakeBlock(blockIndex);
      this.blockFormArray.at(blockIndex).get('selected_block_retake').reset();
      this.blockFormArray.at(blockIndex).get('selected_block_retake_name').reset();
      this.blockFormArray.at(blockIndex).get('transversal_block').enable();
      this.blockFormArray.at(blockIndex).get('is_specialization').enable();
      this.blockFormArray.at(blockIndex).get('count_for_title_final_score').enable();
      this.blockFormArray.at(blockIndex).get('is_academic_recommendation').reset();
      this.blockFormArray.at(blockIndex).get('is_academic_recommendation').enable();
    }
  }

  changeSpecializationOrCountForFinal(event: MatSlideToggleChange, blockIndex: number) {
    if (event && event.checked) {
      this.blockFormArray.at(blockIndex).get('transversal_block').reset();
      this.blockFormArray.at(blockIndex).get('transversal_block').disable({ emitEvent: false });
      this.blockFormArray.at(blockIndex).get('is_retake_by_block').reset();
      this.blockFormArray.at(blockIndex).get('is_retake_by_block').disable({ emitEvent: false });
      this.blockFormArray.at(blockIndex).get('is_academic_recommendation').reset();
      this.blockFormArray.at(blockIndex).get('is_academic_recommendation').disable({ emitEvent: false });
    } else {
      this.blockFormArray.at(blockIndex).get('specialization').patchValue(null);
      this.updateSelectedSpec();
      if (
        !this.blockFormArray.at(blockIndex).get('is_specialization').value &&
        !this.blockFormArray.at(blockIndex).get('count_for_title_final_score').value
      ) {
        this.blockFormArray.at(blockIndex).get('transversal_block').enable();
        this.blockFormArray.at(blockIndex).get('is_retake_by_block').enable();
        this.blockFormArray.at(blockIndex).get('is_academic_recommendation').reset();
        this.blockFormArray.at(blockIndex).get('is_academic_recommendation').enable();
      }
    }
  }

  onlyOneAcademicRecomendation(blockIndex: number) {
    let allow = false;
    for (let i = this.blockFormArray.controls.length - 1; i>=0; i--) {
      if (i !== blockIndex) {
        if (this.blockFormArray.at(i).get('is_academic_recommendation').value) {
          this.blockFormArray.at(blockIndex).get('is_academic_recommendation').patchValue(false);
          Swal.fire({
            type: 'warning',
            title: this.translate.instant('RECOM_S1.TITLE'),
            text: this.translate.instant('RECOM_S1.TEXT'),
            footer: `<span style="margin-left: auto">RECOM_S1</span>`,
            confirmButtonText: this.translate.instant('RECOM_S1.BUTTON')
          });
          allow = true;
        }
      }
    }
    return allow;
  }

  getRetakeBlock() {
    const currentBlock = _.cloneDeep(this.conditionOfAwardForm.get('block_of_competence_condition_input').value);
    if (currentBlock && currentBlock.length) {
      this.blockList = _.filter(currentBlock, (block) => !block.transversal_block && !block.is_retake_by_block);
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
  // End of condition of sliders block

  // Change condition of evaluations
  changeUseDifferentNotationGrid(event: MatSlideToggleChange, blockIndex: number, subjectIndex: number, evalIndex: number) {
    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('retake_evaluation').get('_id').reset();
    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('retake_evaluation').get('evaluation').reset();
    this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('retake_evaluation').get('type').reset();

    if (event && event.checked) {
      this.getEvaluationFormArray(blockIndex, subjectIndex)
        .at(evalIndex)
        .get('retake_evaluation')
        .get('evaluation')
        .setValidators([Validators.required]);
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
      this.getSubjectTransversalData(blockIndex, subjectIndex);
    } else {
      this.getSubjectArray(blockIndex).at(subjectIndex).get('count_for_title_final_score').patchValue(true);
      this.getSubjectArray(blockIndex).at(subjectIndex).get('add_subject_transversal_block').get('subject_transversal_block_name').reset();
      this.getSubjectArray(blockIndex).at(subjectIndex).get('subject_name').reset();
    }

  }
  // End of conditional evaluations

  // Function for retake block changes
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
  // End of function for retake block changes

  calculateTotalBlock(): number {
    return 0;
  }

  calculateTotalSubject(blockIndex: number): number {
    return 0;
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

  // Event for close/open panel accordion
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
  // End for close/open panel accordion

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

  formatPayload(blocks: any[]) {
    // translate block, subject, and evaluation name before saving
    blocks.forEach((block) => {
      block.block_of_competence_condition = block.block_of_competence_condition
        ? this.translate.instant(block.block_of_competence_condition)
        : '';
      block.subjects.forEach((subject) => {
        subject.subject_name = subject.subject_name ? this.translate.instant(subject.subject_name) : '';
        subject.evaluations.forEach((evaluation) => {
          evaluation.evaluation = evaluation.evaluation ? this.translate.instant(evaluation.evaluation) : '';
        });
      });
    });
    return blocks;
  }

  save() {

    if (this.conditionOfAwardForm.valid) {
      const blocks = this.conditionOfAwardForm.get('block_of_competence_condition_input').value;
      const payload = this.formatPayload(_.cloneDeep(blocks));
      // delete the is_one_of_test_published key as it is not existing in accepted input format
      payload.forEach(block => {
        if (block.hasOwnProperty('is_one_of_test_published')) {
          delete block['is_one_of_test_published'];
        }
      })
      this.isWaitingForResponse = true;

      if (this.isEvaluationTotalWeightMoreThan100(blocks)) {
        Swal.fire({
          allowOutsideClick: false,
          type: 'error',
          title: this.translate.instant('CC2T_S03.TITLE'),
          html: this.translate.instant('CC2T_S03.TEXT'),
          footer: `<span style="margin-left: auto">CC2T_S03</span>`,
          confirmButtonText: this.translate.instant('CC2T_S03.BUTTON'),
        });
        this.isWaitingForResponse = false;
      } else {

        this.subs.sink = this.rncpTitleService
          .createUpdateBlockOfCompetenceCondition(this.selectedRncpTitleId, this.selectedClassId, payload)
          .subscribe((resp) => {
            this.isWaitingForResponse = false;
            if (resp && resp.errors && resp.errors[0] && resp.errors[0].message) {
              Swal.fire({
                type: 'error',
                title: this.translate.instant(resp.errors[0].message),
              }).then((result) => {
                this.conditionOfAwardForm.reset();
                this.ngOnInit();
              });
            } else {
              this.isWaitingForResponse = false;
              Swal.fire({
                type: 'success',
                allowOutsideClick: false,
                title: this.translate.instant('CCED_S01.TITLE'),
                text: this.translate.instant('CCED_S01.TEXT'),
                confirmButtonText: this.translate.instant('CCED_S01.BUTTON_1'),
              }).then(() => {
                if (this.evaluationStep === 'third') {
                  const payloadStep = {
                    evaluation_step: 'fourth',
                  };
                  this.subs.sink = this.rncpTitleService.saveFirstCondition(this.selectedClassId, payloadStep).subscribe((response) => {

                    if (response) {
                      this.updateStep.emit('fourth');
                    }
                  });
                }
                this.conditionOfAwardForm.reset();
                this.ngOnInit();
                // this.initConditionOfAwardForm();
                // this.populateBlockData();
              });
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
            (name.evalName ? this.translate.instant('GNS_S02.EVALUATION', { evalName: name.evalName }) : '') +
            '</li>';
        });
        textHtml += '</ul>';
      }

      Swal.fire({
        allowOutsideClick: false,
        type: 'error',
        title: this.translate.instant('GNS_S02.TITLE'),
        html: textHtml,
        footer: `<span style="margin-left: auto">GNS_S02</span>`,
        confirmButtonText: this.translate.instant('GNS_S02.BUTTON_1'),
      }).then(() => {
        this.conditionOfAwardForm.markAllAsTouched();
      });
    }
  }

  selectRetakeBlock(event: MatSelectChange, blockIndex: number) {
    if (event && event && event.value) {
      const selectedBlock = _.filter(this.blockList, (block) => block.block_of_competence_condition === event.value);
      if (selectedBlock && selectedBlock.length && selectedBlock[0]._id) {
        this.blockFormArray.at(blockIndex).get('selected_block_retake').patchValue(selectedBlock[0]._id);
      }

    }
  }

  exportPdf() {


    const html = STYLE + this.conditionPdf.getPdfHtmlEval();
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

  selectSpecialization(event: MatSelectChange, blockIndex: number) {
    this.updateSelectedSpec();
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

  getRefID(blockIndex: number) {
    let result = '';
    if (this.initBlockList && this.initBlockList[blockIndex] && this.initBlockList[blockIndex].block_type === 'competence') {
      if (
        this.initBlockList[blockIndex].block_of_tempelate_competence &&
        this.initBlockList[blockIndex].block_of_tempelate_competence.ref_id
      ) {
        result = this.initBlockList[blockIndex].block_of_tempelate_competence.ref_id + ' - ';
      }
    } else if (this.initBlockList && this.initBlockList[blockIndex] && this.initBlockList[blockIndex].block_type === 'soft_skill') {
      if (
        this.initBlockList[blockIndex].block_of_tempelate_soft_skill &&
        this.initBlockList[blockIndex].block_of_tempelate_soft_skill.ref_id
      ) {
        result = this.initBlockList[blockIndex].block_of_tempelate_soft_skill.ref_id + ' - ';
      }
    }
    return result;
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

        if (
          controlIndex === invalidControls.length - 1 &&
          (curBlock !== null ||
            (curBlock !== null && curSubject !== null) ||
            (curBlock !== null && curSubject !== null && curEval !== null))
        ) {
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

  filterTypeNormal(blockIndex, subjectIndex, evalIndex) {
    if (this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('type').value) {
      let searchString = this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('type').value.toLowerCase().trim();
      searchString = this.utilService.simpleDiacriticSensitiveRegex(searchString);
      this.evaluationListFiltered = this.evaluationList.filter((elem) =>
      this.utilService.simpleDiacriticSensitiveRegex(elem.option).toLowerCase().trim().includes(searchString),
      );
    } else {
      this.evaluationListFiltered = this.evaluationList;
      this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('type').patchValue(null, {emitEvent: false});
    }
  }
  
  filterTypeComp(blockIndex, subjectIndex, evalIndex) {
    if (this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('type').value) {
      let searchString = this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('type').value.toLowerCase().trim();
      searchString = this.utilService.simpleDiacriticSensitiveRegex(searchString);
      this.evaluationListCompetenceFiltered = this.evaluationListCompetence.filter((elem) =>
      this.utilService.simpleDiacriticSensitiveRegex(elem.option).toLowerCase().trim().includes(searchString),
      );
    } else {
      this.evaluationListCompetenceFiltered = this.evaluationListCompetence;

      this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('type').patchValue(null, {emitEvent: false});
    }
  }
  
  filterTypeSkill(blockIndex, subjectIndex, evalIndex) {
    if (this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('type').value) {
      let searchString = this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('type').value.toLowerCase().trim();
      searchString = this.utilService.simpleDiacriticSensitiveRegex(searchString);
      this.evaluationListSoftSkillFiltered = this.evaluationListSoftSkill.filter((elem) =>
      this.utilService.simpleDiacriticSensitiveRegex(elem.option).toLowerCase().trim().includes(searchString),
      );
    } else {
      this.evaluationListSoftSkillFiltered = this.evaluationListSoftSkill;
      this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('type').patchValue(null, {emitEvent: false});
    }
  }
  
  filterTypeRetake(blockIndex, subjectIndex, evalIndex) {
    if (this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('type').value) {
      let searchString = this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('type').value.toLowerCase().trim();
      searchString = this.utilService.simpleDiacriticSensitiveRegex(searchString);
      this.evaluationListRetakeFiltered = this.evaluationListRetake.filter((elem) =>
      this.utilService.simpleDiacriticSensitiveRegex(elem.option).toLowerCase().trim().includes(searchString),
      );
    } else {
      this.evaluationListRetakeFiltered = this.evaluationListRetake;
      this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('type').patchValue(null, {emitEvent: false});
    }
  }
  
  filterTypeAcad(blockIndex, subjectIndex, evalIndex) {
    if (this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('type').value) {
      let searchString = this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('type').value.toLowerCase().trim();
      searchString = this.utilService.simpleDiacriticSensitiveRegex(searchString);
      this.evaluationListAcademicRecommendationFiltered = this.evaluationListAcademicRecommendation.filter((elem) =>
      this.utilService.simpleDiacriticSensitiveRegex(elem.option).toLowerCase().trim().includes(searchString),
      );
    } else {
      this.evaluationListAcademicRecommendationFiltered = this.evaluationListAcademicRecommendation;
      this.getEvaluationFormArray(blockIndex, subjectIndex).at(evalIndex).get('type').patchValue(null, {emitEvent: false});
    }
  }

  displayFnNormal(selectedValue: any) {

    if (selectedValue) {
      let list = [
        ...this.evaluationList,
        ...this.evaluationListCompetence,
        ...this.evaluationListSoftSkill,
        ...this.evaluationListRetake,
        ...this.evaluationListAcademicRecommendation
      ];
      list = _.uniqBy(list, 'value');
      const found = _.find(list, (res) => res.value === selectedValue);
      let result = '';
      if (found) {
        result = found.option;
      }
      return result;
    }
  }

  ngOnDestroy(): void {
    clearTimeout(this.timeOutVal);
    this.subs.unsubscribe();
  }
}
