import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Questionnaire } from './questionaire.model';
import * as _ from 'lodash';

@Injectable({
  providedIn: 'root',
})
export class QuetionaireService {
  private messageSource = new BehaviorSubject<string>('default message');
  questionnaireDetail = this.messageSource.asObservable();
  questionnaire = new BehaviorSubject<Questionnaire>(new Questionnaire());
  questionnaireMentorEvaluationResponse = new BehaviorSubject<any>({});
  formValid = new BehaviorSubject<boolean>(false);
  formSubmited = new BehaviorSubject<boolean>(false);
  isNestedValid = true;
  isContinueStudyExist = false;
  isReadyToPublish = true;

  selectedTemplateId = new BehaviorSubject<string>('');

  constructor(private apollo: Apollo) {}

  questionnaireData(message: string) {
    this.messageSource.next(message);
  }

  checkIsContinueStudyExist(questionnaire): boolean {
    // check if its ES, because es has its own rules which are quertion type
    if (questionnaire.questionnaire_type === 'employability_survey') {
      let isContinueStudyExist = false;
      if (questionnaire.competence && questionnaire.competence.length) {
        for (const comp of questionnaire.competence) {
          if (isContinueStudyExist) {
            break;
          }
          for (const segment of comp.segment) {
            if (isContinueStudyExist) {
              break;
            }
            for (const question of segment.question) {
              if (isContinueStudyExist) {
                break;
              }
              if (question.question_type === 'continues_student') {
                isContinueStudyExist = true;
                break;
              }
            }
          }
        }
      }
      this.isContinueStudyExist = isContinueStudyExist;
      return isContinueStudyExist;
    } else {
      return true;
    }
  }

  updateQuestionnaire(questionnaire) {
    this.questionnaire.next(questionnaire);


    // ************** Check if its published, then will check if data has question
    if (questionnaire) {
      if (questionnaire.is_published === true) {
        this.isReadyToPublish = this.checkHasQuestion(questionnaire);

        // check if its ES, because es has its own rules which are quertion type
        // if (questionnaire.questionnaire_type === 'employability_survey') {
        //   let isContinueStudyExist = false;
        //   if (questionnaire.competence && questionnaire.competence.length) {
        //     for (const comp of questionnaire.competence) {
        //       if (isContinueStudyExist) {
        //         break;
        //       }
        //       for (const segment of comp.segment) {
        //         if (isContinueStudyExist) {
        //           break;
        //         }
        //         for (const question of segment.question) {
        //           if (isContinueStudyExist) {
        //             break;
        //           }
        //           if (question.question_type === 'continues_student') {
        //             isContinueStudyExist = true;
        //             break;
        //           }
        //         }
        //       }
        //     }
        //   }
        //   this.isContinueStudyExist = isContinueStudyExist;
        //   if (isContinueStudyExist) {
        //     this.isReadyToPublish = true;
        //   } else {
        //     this.isReadyToPublish = false;
        //   }
        // }
      } else {
        this.isReadyToPublish = true;
      }
    }


  }

  resetQuestionnaire() {
    this.questionnaire.next(new Questionnaire());
  }

  updatePublishedStatus(status: boolean) {
    const data = this.questionnaire.value;
    data.is_published = status;

    this.updateQuestionnaire(data);
  }

  updateSelectedTemplate(templateId) {
    this.selectedTemplateId.next(templateId);
  }

  getQuestionnaire() {
    return this.questionnaire;
  }

  getSelectedTemplateId() {
    return this.selectedTemplateId;
  }

  updateFormValidateStatus(status) {
    this.formValid.next(status);
  }

  getFormValidateStatus() {
    return this.formValid;
  }

  updateFormValidateIndicate(status) {
    this.formSubmited.next(status);
  }
  getFormValidateIndicate() {
    return this.formSubmited;
  }

  getQuestionnaireMentorEvaluationResponse() {
    return this.questionnaireMentorEvaluationResponse.value;
  }

  updateQuestionnaireMentorEvaluationResponse(data) {
    this.questionnaireMentorEvaluationResponse.next(data);
  }

  setNestedValidation(validate) {
    this.isNestedValid = validate;
  }

  getNestedValidation() {
    return this.isNestedValid;
  }

  isPublishedValidation(): boolean {
    let result = false;
    const data = this.questionnaire.getValue();


    return result;
  }

  updateQuestionData(is_published?: boolean) {
    const data = this.questionnaire.getValue();
    data.is_published = is_published;



    return this.createQuestionnaireTemplate(data);
  }

  checkHasQuestion(questionnaire) {
    let result = false;
    const data = _.cloneDeep(questionnaire);
    if (data && data.competence && data.competence.length) {
      for (const comp of data.competence) {
        if (comp && comp.segment && comp.segment) {
          for (const segment of comp.segment) {
            if (segment && segment.question && segment.question.length) {
              result = true;
              break;
            }
          }
        }
      }
    }
    return result;
  }

  getAllQuestionnaireTemplate(filter, sorting, pagination) {
    return this.apollo
      .query({
        query: gql`
          query GetAllQuestionnaireTemplateForTable(
            $pagination: PaginationInput
            $sorting: QuesTemplateSortingInput
            $filter: QuesTempFilter
          ) {
            GetAllQuestionnaireTemplate(pagination: $pagination, sorting: $sorting, filter: $filter) {
              _id
              is_published
              questionnaire_name
              questionnaire_type
              date_created
              count_document
              created_by {
                _id
                first_name
                last_name
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          sorting,
          pagination,
          filter,
        },
      })
      .pipe(map((resp) => resp.data['GetAllQuestionnaireTemplate']));
  }

  getOneQuestionnaireTemplateById(_id: string) {
    return this.apollo
      .query({
        query: gql`
      query {
        GetOneQuestionnaire(_id: "${_id}") {
          _id
          is_published
          questionnaire_name
          questionnaire_type
          date_created
          questionnaire_grid {
            orientation
            header {
              title
              text
              direction
              fields {
                type
                value
                data_type
                align
              }
            }
            footer {
              text
              text_below
              fields {
                type
                value
                data_type
                align
              }
            }
          }
          competence {
            competence_name
            block_type
            sort_order
            page_break
            segment {
              segment_name
              sort_order
              question {
                question_name
                sort_order
                question_type
                answer
                answer_multiple
                questionnaire_field_key
                is_field
                is_answer_required
                options {
                  option_text
                  position
                  related_block_index
                }
                parent_child_options {
                  option_text
                  position
                  questions {
                    question_name
                    sort_order
                    question_type
                    answer
                    answer_multiple
                    questionnaire_field_key
                    is_field
                    is_answer_required
                    options {
                      option_text
                      position
                      related_block_index
                    }
                    parent_child_options {
                      option_text
                      position
                      questions {
                        question_name
                        sort_order
                        question_type
                        answer
                        answer_multiple
                        questionnaire_field_key
                        is_field
                        is_answer_required
                        options {
                          option_text
                          position
                          related_block_index
                        }
                        parent_child_options {
                          option_text
                          position
                          questions {
                            question_name
                            sort_order
                            question_type
                            answer
                            answer_multiple
                            questionnaire_field_key
                            is_field
                            is_answer_required
                            options {
                              option_text
                              position
                              related_block_index
                            }
                            parent_child_options {
                              option_text
                              position
                              questions {
                                question_name
                                sort_order
                                question_type
                                answer
                                answer_multiple
                                questionnaire_field_key
                                is_field
                                is_answer_required
                                options {
                                  option_text
                                  position
                                  related_block_index
                                }
                                parent_child_options {
                                  option_text
                                  position
                                  questions {
                                    question_name
                                    sort_order
                                    question_type
                                    answer
                                    answer_multiple
                                    questionnaire_field_key
                                    is_field
                                    is_answer_required
                                    options {
                                      option_text
                                      position
                                      related_block_index
                                    }
                                    parent_child_options {
                                      option_text
                                      position
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneQuestionnaire']));
  }

  createQuestionnaireTemplate(payload): Observable<any[]> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateQuestionnaireTemplate($payload: QuestionnaireTemplateInput!) {
            CreateQuestionnaireTemplate(quesTempInput: $payload) {
              _id
              is_published
            }
          }
        `,
        variables: {
          payload,
        },
      })
      .pipe(map((resp) => resp.data['CreateQuestionnaireTemplate']));
  }

  updateQuestionnaireTemplate(_id: string): Observable<any[]> {
    const payload = this.questionnaire.getValue();
    delete payload._id;
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateQuestionnaireTemplate($payload: QuestionnaireTemplateInput!, $_id: ID!) {
            UpdateQuestionnaireTemplate(quesTempInput: $payload, _id: $_id) {
              _id
              is_published
            }
          }
        `,
        variables: {
          payload,
          _id,
        },
      })
      .pipe(map((resp) => resp.data['UpdateQuestionnaireTemplate']));
  }

  deleteQuestionnaireTemplate(_id): Observable<any[]> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation {
            DeleteQuestionnaireTemplate(_id: "${_id}") {
              _id
            }
          }
        `,
      })
      .pipe(map((resp) => resp.data['DeleteQuestionnaireTemplate']));
  }

  duplicateQuestionnaireTemplate(payload: { ques_id: string; ques_name: string }): Observable<any[]> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation {
            DuplicateQuestionnaire(ques_id: "${payload.ques_id}", ques_name: "${payload.ques_name}") {
              _id
            }
          }
        `,
      })
      .pipe(map((resp) => resp.data['DuplicateQuestionnaire']));
  }
}
