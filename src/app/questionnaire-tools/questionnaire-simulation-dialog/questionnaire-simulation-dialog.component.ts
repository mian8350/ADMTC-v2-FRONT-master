import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Competence, EmployibilitySurvey, Questionnaire } from '../questionaire.model';
import Swal from 'sweetalert2';
import * as _ from 'lodash';
import { QuetionaireService } from '../quetionaire.service';
import { MatDialogRef } from '@angular/material/dialog';

interface CompetenceModel {
  competence_name: string;
  segment: [
    {
      segment_name: string;
      question: [
        {
          sort_order: number;
          question_type: string;
          answer: string;
          is_field: boolean;
          is_answer_required: boolean;
          options?: [
            {
              _id: string;
              option_text: string;
              position: number;
            },
          ];
          child_options: any[];
          question_name: string;
          questionnaire_field_key: string;
          parent_child_options: any[];
          answer_multiple: string[]
        },
      ];
    },
  ];
  pageBreak: boolean;
}

@Component({
  selector: 'ms-questionnaire-simulation-dialog',
  templateUrl: './questionnaire-simulation-dialog.component.html',
  styleUrls: ['./questionnaire-simulation-dialog.component.scss'],
})
export class QuestionnaireSimulationDialogComponent implements OnInit, OnChanges {
  isPreviousCourse = false;
  survey = new EmployibilitySurvey();
  questionnaire: Questionnaire;
  competences: Competence[];
  questionBlock = [];
  data = [];
  rejectDisabled = false;
  isOnceSaved = false;
  jobSituation = [
    {
      key: 'INITIAL_TRAINING',
      queContinue: false,
    },
    {
      key: 'LEARNING',
      queContinue: false,
    },
    {
      key: 'PRO_CONTRACT',
      queContinue: false,
    },
    {
      key: 'JOB_SEARCH',
      queContinue: false,
    },
    {
      key: 'INTERIM',
      queContinue: true,
    },
    {
      key: 'CSD',
      queContinue: true,
    },
    {
      key: 'CDI',
      queContinue: true,
    },
    {
      key: 'AUTO_ENTREPRENEUR',
      queContinue: true,
    },
    {
      key: 'BUSINESS_CREATION',
      queContinue: true,
    },
    {
      key: 'CIVIC_SERVICE',
      queContinue: false,
    },
    {
      key: 'OTHER',
      queContinue: false,
    },
  ];
  showProfActivityAndContractBlock = false;
  isAcadDir = false;
  isAcadAdmin = false;
  relatedBlockIndex = [];

  constructor(
    private translate: TranslateService,
    private questService: QuetionaireService,
    public dialogRef: MatDialogRef<QuestionnaireSimulationDialogComponent>,
  ) {}

  ngOnInit() {
    this.questService.getQuestionnaire().subscribe((resp) => {
      this.questionnaire = resp;
      this.competences = resp['competence'];

      this.updateActivatedBlock();
    });
  }

  ngOnChanges(changes: SimpleChanges) {

    this.isOnceSaved = false;
    this.showProfActivityAndContractBlock = false;
  }

  getSurvey() {
    this.rejectDisabled = false;
  }


  setOptionalFieldstoDefault() {
    if (this.survey.experience_marketingExperience === 'NO') {
      this.survey.experience_marketingExperienceYes_experienceInMonths = 0;
      this.survey.experience_marketingExperienceYes_jobStatus = '';
      this.survey.experience_marketingExperienceYes_positionOccupied = '';
      this.survey.experience_marketingExperienceYes_practicingActivity = '';
    }

    if (this.survey.currentSituation_currentJob !== 'OTHER') {
      this.survey.currentSituation_comments = '';
    }
  }

  getTitleForExperienceBlock(titleString) {
    let translatedTitlewithRNCP: string = this.translate.instant(titleString);
    if (this.survey && this.survey.rncpId) {
      translatedTitlewithRNCP = translatedTitlewithRNCP.replace('{title}', this.survey.rncpId.shortName);
    }
    return translatedTitlewithRNCP;
  }

  selectJobStatus(job) {
    const obj = _.find(this.jobSituation, { key: job });
    if (obj && obj.queContinue) {
      this.showProfActivityAndContractBlock = true;
    } else {
      this.showProfActivityAndContractBlock = false;
    }
  }

  onChangeMultipleQuestion(
    value,
    indexValue: { competences: number; segment: number; question: number },
    optionValue,
    listValue: string[],
  ) {
    if (value.checked) {
      listValue.push(optionValue);
      this.competences[indexValue.competences].segment[indexValue.segment].question[indexValue.question].answer_multiple = listValue;
    } else {
      const index = listValue.indexOf(optionValue);

      if (index > -1) {
        listValue.splice(index, 1);
        this.competences[indexValue.competences].segment[indexValue.segment].question[indexValue.question].answer_multiple = listValue;
      }
    }
  }

  onChangeParentChild(
    value,
    option,
    index: { competenceIndex: number; segmentIndex: number; questionIndex: number },
    parent: number,
    child: number,
  ) {


    const parentChild1 = this.competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex]
      .parent_child_options;
    for (let p1 = 0; p1 < parentChild1.length; p1++) {
      for (
        let p2 = 0;
        p2 <
        this.competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[p1].questions
          .length;
        p2++
      ) {
        this.competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[
          p1
        ].questions[p2].answer = '';
        for (
          let p3 = 0;
          p3 <
          this.competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[p1]
            .questions[p2].parent_child_options.length;
          p3++
        ) {
          for (
            let p4 = 0;
            p4 <
            this.competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[p1]
              .questions[p2].parent_child_options[p3].questions.length;
            p4++
          ) {
            this.competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[
              p1
            ].questions[p2].parent_child_options[p3].questions[p4].answer = '';
            for (
              let p5 = 0;
              p5 <
              this.competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[p1]
                .questions[p2].parent_child_options[p3].questions[p4].parent_child_options.length;
              p5++
            ) {
              for (
                let p6 = 0;
                p6 <
                this.competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[p1]
                  .questions[p2].parent_child_options[p3].questions[p4].parent_child_options[p5].questions.length;
                p6++
              ) {
                this.competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[
                  p1
                ].questions[p2].parent_child_options[p3].questions[p4].parent_child_options[p5].questions[p6].answer = '';
              } // End for p6
            } // End for p5
          } // End for p4
        } // End for p3
      } // End for p2
    } // End for p1
  } // End if checking parentChild type

  onChangeParentChild2(
    value,
    option,
    index: { competenceIndex: number; segmentIndex: number; questionIndex: number },
    parent: number,
    child: number,
  ) {
    for (
      let i = 0;
      i <
      this.competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[parent]
        .questions[child].parent_child_options.length;
      i++
    ) {
      // this.competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[parent].questions[child].parent_child_options[i] = '';
      if (
        this.competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[parent]
          .questions[child].parent_child_options[i].questions[child] !== undefined
      ) {
        this.competences[index.competenceIndex].segment[index.segmentIndex].question[index.questionIndex].parent_child_options[
          parent
        ].questions[child].parent_child_options[i].questions[child].answer = '';
      }
    }
  }

  onChangeSingleOption(comp: Competence) {
    if (comp.block_type === 'router') {
      this.updateActivatedBlock();
      this.removeUnSelectedIndexBlock();
    }
  }

  renderBlockHideAndShow(competence: Competence, compIndex: number) {
    if (competence.block_type === 'always_visible') {
      return true;
    } else if (competence.block_type === 'router') {
      return true;
    }
    let finalDecide = false;

    for (let i = 0; i < this.relatedBlockIndex.length; i++) {
      if (compIndex === this.relatedBlockIndex[i]) {
        finalDecide = true;
        break;
      }
    }
    return finalDecide;
  }

  updateActivatedBlock() {
    this.relatedBlockIndex = [];
    if (this.competences && this.competences.length) {
      for (let i = 0; i < this.competences.length; i++) {
        if (this.competences[i].block_type === 'router') {
          for (let j = 0; j < this.competences[i].segment.length; j++) {
            for (let k = 0; k < this.competences[i].segment[j].question.length; k++) {
              if (this.competences[i].segment[j].question[k].question_type === 'single_option') {
                const options = this.competences[i].segment[j].question[k].options;
                for (let l = 0; l < options.length; l++) {
                  if (this.competences[i].segment[j].question[k].answer === options[l]['option_text']) {
                    if (options[l]['related_block_index'] !== undefined) {
                      this.relatedBlockIndex.push(Number(options[l]['related_block_index']));
                    }
                  }
                }
              }
            } // End loop index k
          } // End loop index j
        } // End if
      } // End loop with index i
    }
  }
  removeUnSelectedIndexBlock() {
    for (let i = 0; i < this.competences.length; i++) {
      if (this.competences[i].block_type === 'visible-on-option') {
        const findIndex = _.find(this.relatedBlockIndex, function (element) {
          return element == i;
        });
        if (findIndex === undefined) {
          for (let j = 0; j < this.competences[i].segment.length; j++) {
            for (let k = 0; k < this.competences[i].segment[j].question.length; k++) {
              this.competences[i].segment[j].question[k].answer = '';
              this.competences[i].segment[j].question[k].answer_multiple = [];

              if (this.competences[i].segment[j].question[k].question_type === 'parent_child') {
                const parentChild1 = this.competences[i].segment[j].question[k].parent_child_options;
                for (let p1 = 0; p1 < parentChild1.length; p1++) {
                  for (let p2 = 0; p2 < this.competences[i].segment[j].question[k].parent_child_options[p1].questions.length; p2++) {
                    this.competences[i].segment[j].question[k].parent_child_options[p1].questions[p2].answer = '';
                    for (
                      let p3 = 0;
                      p3 < this.competences[i].segment[j].question[k].parent_child_options[p1].questions[p2].parent_child_options.length;
                      p3++
                    ) {
                      for (
                        let p4 = 0;
                        p4 <
                        this.competences[i].segment[j].question[k].parent_child_options[p1].questions[p2].parent_child_options[p3].questions
                          .length;
                        p4++
                      ) {
                        this.competences[i].segment[j].question[k].parent_child_options[p1].questions[p2].parent_child_options[
                          p3
                        ].questions[p4].answer = '';
                        for (
                          let p5 = 0;
                          p5 <
                          this.competences[i].segment[j].question[k].parent_child_options[p1].questions[p2].parent_child_options[p3]
                            .questions[p4].parent_child_options.length;
                          p5++
                        ) {
                          for (
                            let p6 = 0;
                            p6 <
                            this.competences[i].segment[j].question[k].parent_child_options[p1].questions[p2].parent_child_options[p3]
                              .questions[p4].parent_child_options[p5].questions.length;
                            p6++
                          ) {
                            this.competences[i].segment[j].question[k].parent_child_options[p1].questions[p2].parent_child_options[
                              p3
                            ].questions[p4].parent_child_options[p5].questions[p6].answer = '';
                          } // End for p6
                        } // End for p5
                      } // End for p4
                    } // End for p3
                  } // End for p2
                } // End for p1
              } // End if checking parentChild type
            } // End loop index k
          } // End loop index j
        }
      } // End if
    } // End loop with index i
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
