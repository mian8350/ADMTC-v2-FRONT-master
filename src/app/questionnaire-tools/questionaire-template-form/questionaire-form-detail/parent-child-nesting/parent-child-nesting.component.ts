import { Component, Input, OnInit } from '@angular/core';
import { UntypedFormArray, UntypedFormBuilder } from '@angular/forms';
import { ChildOptions, Questionnaire } from 'app/questionnaire-tools/questionaire.model';
import { QuetionaireService } from 'app/questionnaire-tools/quetionaire.service';

@Component({
  selector: 'ms-parent-child-nesting',
  templateUrl: './parent-child-nesting.component.html',
  styleUrls: ['./parent-child-nesting.component.scss']
})
export class ParentChildNestingComponent implements OnInit {

  @Input('parent_child_options') parent_child_options: ChildOptions;
  @Input('optionIndex') optionIndex: number;
  @Input('competenceIndex') competenceIndex: number;
  @Input('segmentIndex') segmentIndex: number;
  @Input('questionIndex') questionIndex: number;
  @Input('questionnaireWholeObj') questionnaireWholeObj: Questionnaire;
  @Input('questionnaireForm') questionnaireForm;
  @Input('question') question;
  @Input('isViewOnly') isViewOnly;
  @Input('isForPDF') isForPDF;

  counter = 0;
  isNestingValid = true;
  questions: UntypedFormArray;

  constructor(
    private fb: UntypedFormBuilder,
    public questionnaireService: QuetionaireService
  ) { }

  ngOnInit() {
    // this.questions = new FormArray(this.addQuestions());



  }

  // *************** Code Copied from V1

  checkNestingValid() {
    const formValue = [...this.questionnaireForm];
    for (const form of formValue) {
      for (const segment of form.segment) {
        for (const question of segment.question) {
          if (question.question_type === 'parent_child') {
            this.isNestingValid = this.validateParentChild(question);
            this.questionnaireService.setNestedValidation(this.isNestingValid);

          }
        }
      }
    }
  }

  validateParentChild(question) {
    if (question.parent_child_options.length) {
      for (const parentChild of question.parent_child_options) {
        if (!parentChild.option_text) {
          return false;
        }

        if (parentChild.questions.length) {
          for (const question of parentChild.questions) {
            if (!question.question_name) {
              return false;
            }

            const valid = this.validateParentChild(question);
            if (!valid) {
              return false;
            }
          }
        }
      }
    }
    return true;
  }

  removeOption(optionIndex) {
    this.question.parent_child_options.splice(optionIndex, 1);
    this.checkNestingValid();
    this.questionnaireService.updateQuestionnaire(this.questionnaireWholeObj);
  }

  removeQuestion(questionIndex) {
    this.parent_child_options.questions.splice(questionIndex, 1);
    this.questionnaireService.updateQuestionnaire(this.questionnaireWholeObj);
    this.checkNestingValid();
  }

  addQuestion() {
    this.parent_child_options.questions.push({
      'question_type': 'parent_child',
      'question_name': '',
      // '_id': [q ? q._id ? q._id : q.id ? q.id : '' : ''],
      'is_field': false,
      'is_answer_required': false,
      'options': [],
      'answer': '',
      'questionnaire_field_key': '',
      'sort_order': 1,
      'parent_child_options': [],
      'answer_multiple': [],
    });
    this.questionnaireService.updateQuestionnaire(this.questionnaireWholeObj);
    this.checkNestingValid();
  }

  addOption(question, questionIndex) {
    const temp = Math.random().toString();
    if (question) {
      // this.question.value.parent_child_options[this.optionIndex].questions[questionIndex].parent_child_options.push({option_text: 'A' + this.counter, position: 1, questions: []});
      this.parent_child_options.questions[questionIndex].parent_child_options.push({option_text: '', position: 1, questions: []});
      // question.value.parent_child_options.push({option_text: 'A' + temp, position: 1, questions: []});

    } else {
      this.question.parent_child_options.push({option_text: '', position: 1, questions: []});

    }
    this.questionnaireService.updateQuestionnaire(this.questionnaireWholeObj);
    this.checkNestingValid();
  }

  updatequestion_name(questionIndex, name) {
    this.parent_child_options.questions[questionIndex].question_name = name.value;
    this.questionnaireService.updateQuestionnaire(this.questionnaireWholeObj);
    this.checkNestingValid();
  }

  updateOptionName(name) {
    this.parent_child_options.option_text = name.value;
    this.questionnaireService.updateQuestionnaire(this.questionnaireWholeObj);
    this.checkNestingValid();
  }

}
