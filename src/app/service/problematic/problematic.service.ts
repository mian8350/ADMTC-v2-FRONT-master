import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { RespProblematicImported } from 'app/student-cards/problematic/problematic.model';

import gql from 'graphql-tag';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ProblematicService {
  constructor(private apollo: Apollo) {}

  getStudentsDataForProblematic(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query GetStudentsDataForProblematic {
          GetOneStudent(_id: "${studentId}"){
            _id
            civility
            first_name
            last_name
            problematic_id{
              _id
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }

  getStudentsPrevCourseProblematic(schoolId: string, rncpId: string, classId: string, studentId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
        query GetStudentsDataForProblematic {
          GetAllStudents(
            sorting: { last_name: asc },
            school: "${schoolId}",
            rncp_title: "${rncpId}",
            current_class: "${classId}",
            status: student_card_active_completed,
            student_ids: ["${studentId}"]
          ){
            _id
            civility
            first_name
            last_name
            problematic_id{
              _id
            }
          }
        }`,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getOneProblematic(problematicId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneProblematic(_id: "${problematicId}") {
            _id
            problematic_status
            questionnaire_template_response_id {
              _id
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneProblematic']));
  }

  getOneProblematicImported(problematicId: string): Observable<RespProblematicImported> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneProblematic(_id: "${problematicId}") {
            _id
            number_of_rejection
            problematic_status
            student_id{
              _id
            }
            school_id{
              _id
            }
            rncp_id{
              _id
            }
            class_id{
              _id
            }
            date {
              date_utc
              time_utc
            }
            question_1{
              question
              answer
              comments{
                comment
                date{
                  date_utc
                  time_utc
                }
              }
            }
            question_2{
              question
              answer
              comments{
                comment
                date{
                  date_utc
                  time_utc
                }
              }
            }
            question_3{
              question
              answer
              comments{
                comment
                date{
                  date_utc
                  time_utc
                }
              }
            }
            signature_of_the_student
            signature_of_the_acad_dir
            signature_of_the_certifier
            general_comments{
              comment
              date{
                date_utc
                time_utc
              }
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneProblematic']));
  }

  getOneProblematicTemplate(problematicId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneProblematic(_id: "${problematicId}") {
            _id
            number_of_rejection
            problematic_status
            student_id{
              _id
            }
            school_id{
              _id
            }
            rncp_id{
              _id
            }
            class_id{
              _id
            }
            date {
              date_utc
              time_utc
            }
            signature_of_the_student
            signature_of_the_acad_dir
            signature_of_the_certifier
            general_comments{
              comment
              date{
                date_utc
                time_utc
              }
            }
            questionnaire_template_response_id{
              _id
              questionnaire_status
              questionnaire_name
              questionnaire_type
              questionnaire_grid{
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
                  fields{
                    type
                    value
                    data_type
                    align
                  }
                }
              }
              competence{
                competence_name
                sort_order
                block_type
                tied_to_option {
                  block
                  segment
                  question
                  answer
                }
                segment {
                  segment_name
                  sort_order
                  question {
                    question_name
                    sort_order
                    question_type
                    questionnaire_field_key
                    is_field
                    is_answer_required
                    answer
                    answer_number
                    answer_date {
                      date
                      time
                    }
                    answer_multiple
                    options{
                      option_text
                      position
                      related_block_index
                      tied_to_block
                    }
                    missions_activities_autonomy{
                      mission
                      activity
                      autonomy_level
                    }
                    multiple_textbox {
                      text
                    }
                    comments {
                      comment
                      date {
                        date_utc
                        time_utc
                      }
                    }
                    parent_child_options{
                      option_text
                      position
                      questions {
                        question_name
                        sort_order
                        question_type
                        questionnaire_field_key
                        is_field
                        is_answer_required
                        answer
                        answer_multiple
                        options{
                          option_text
                          position
                          related_block_index
                          tied_to_block
                        }
                        missions_activities_autonomy{
                          mission
                          activity
                          autonomy_level
                        }
                        parent_child_options{
                          option_text
                          position
                          questions{
                            question_name
                            sort_order
                            question_type
                            questionnaire_field_key
                            is_field
                            is_answer_required
                            answer
                            answer_multiple
                            options{
                              option_text
                              position
                              related_block_index
                              tied_to_block
                            }
                            missions_activities_autonomy{
                              mission
                              activity
                              autonomy_level
                            }
                            parent_child_options{
                              option_text
                              position
                              questions{
                                question_name
                                sort_order
                                question_type
                                questionnaire_field_key
                                is_field
                                is_answer_required
                                answer
                                answer_multiple
                                options{
                                  option_text
                                  position
                                  related_block_index
                                  tied_to_block
                                }
                                missions_activities_autonomy{
                                  mission
                                  activity
                                  autonomy_level
                                }
                                parent_child_options{
                                  option_text
                                  position
                                  questions{
                                    question_name
                                    sort_order
                                    question_type
                                    questionnaire_field_key
                                    is_field
                                    is_answer_required
                                    answer
                                    answer_multiple
                                    options {
                                      option_text
                                      position
                                      related_block_index
                                      tied_to_block
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
      .pipe(map((resp) => resp.data['GetOneProblematic']));
  }

  getAllProblematicCorrector(rncpId: string, schoolId: string, userLoginId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetAllProblematicCorrectors(rncp_title: "${rncpId}", school: "${schoolId}", user_login_id: "${userLoginId}") {
            _id
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllProblematicCorrectors']));
  }

  sendOneProblematic(payload, lang: string): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateProblematic($problematic_input: ProblematicInput, $lang: String) {
            CreateProblematic(problematic_input: $problematic_input, lang: $lang) {
              _id
            }
          }
        `,
        variables: {
          problematic_input: payload,
          lang,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['CreateProblematic']));
  }

  updateProblematic(payload, _id: string, lang: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation UpdateProblematic($problematic_input: ProblematicInput, $_id: ID!, $lang: String) {
          UpdateProblematic(_id: $_id, problematic_input: $problematic_input, lang: $lang) {
            _id
          }
        }
      `,
      variables: {
        _id: _id,
        problematic_input: payload,
        lang,
      },
      errorPolicy: 'all',
    });
  }

  submitStudentFormProblematic(_id: string, lang: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation SubmitProblematic($_id: ID!, $lang: String) {
          SubmitProblematic(_id: $_id, lang: $lang) {
            _id
          }
        }
      `,
      variables: {
        _id: _id,
        lang,
      },
      errorPolicy: 'all',
    });
  }

  rejectFormProblematicAcad(payload: {
    _id: string;
    reason_of_rejection: string;
    rejection_date: any;
    task_input: any;
    lang: string;
  }): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation RejectProblematic(
          $_id: ID!
          $reason_of_rejection: String
          $rejection_date: RejectionDateInput
          $task_input: AcadTaskInput
          $lang: String
        ) {
          RejectProblematic(
            _id: $_id
            reason_of_rejection: $reason_of_rejection
            rejection_date: $rejection_date
            task_input: $task_input
            lang: $lang
          ) {
            _id
          }
        }
      `,
      variables: {
        _id: payload._id,
        reason_of_rejection: payload.reason_of_rejection,
        rejection_date: payload.rejection_date,
        task_input: payload.task_input,
        lang: payload.lang,
      },
      errorPolicy: 'all',
    });
  }

  rejectFormProblematicCertifier(payload: { _id: string; rejection_date: any; lang: string }): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation RejectProblematic($_id: ID!, $rejection_date: RejectionDateInput, $lang: String) {
          RejectProblematic(_id: $_id, rejection_date: $rejection_date, lang: $lang) {
            _id
          }
        }
      `,
      variables: {
        _id: payload._id,
        rejection_date: payload.rejection_date,
        lang: payload.lang,
      },
      errorPolicy: 'all',
    });
  }

  getAllSchoolsProblematic(rncp_title_ids, class_id): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
          query GetAllSchoolsForCorrectorProblematic($rncp_title_ids: [ID], $class_id: ID) {
            GetAllSchools(rncp_title_ids: $rncp_title_ids, class_id: $class_id) {
              _id
              short_name
              count_document
            }
          }
        `,
        variables: {
          rncp_title_ids: rncp_title_ids,
          class_id: class_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllSchools']));
  }

  getProblematicCorrectorDropdown(title, user_type): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
          query GetAllUsers($title: [ID!], $user_type: [ID!]) {
            GetAllUsers(title: $title, user_type: $user_type) {
              _id
              civility
              first_name
              last_name
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          title: title,
          user_type: user_type,
        },
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getOneDetailedTask(taskId: string): Observable<RespProblematicImported> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneTask(_id: "${taskId}") {
            _id
            rncp {
              _id
              short_name
              long_name
            }
            class_id {
              _id
              name
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTask']));
  }

  assignCorrectorProblematic(payload): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation AssignCorrectorProblematic($rncp_title: ID, $class_id: ID, $task_id: ID, $corrector_problematic: [ID], $lang: String) {
          AssignCorrectorProblematic(
            rncp_title: $rncp_title
            class_id: $class_id
            task_id: $task_id
            corrector_problematic: $corrector_problematic
            lang: $lang
          )
        }
      `,
      errorPolicy: 'all',
      variables: {
        rncp_title: payload.rncp_title,
        class_id: payload.class_id,
        task_id: payload.task_id,
        corrector_problematic: payload.corrector_problematic,
        lang: payload.lang,
      },
    });
  }

  updateQuestionnaireResponse(payload, _id: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation UpdateQuestionnaireTemplateResponse($ques_temp_response_input: QuestionnaireTemplateResponseInput, $_id: ID!) {
          UpdateQuestionnaireTemplateResponse(_id: $_id, ques_temp_response_input: $ques_temp_response_input) {
            _id
          }
        }
      `,
      variables: {
        _id: _id,
        ques_temp_response_input: payload,
      },
      errorPolicy: 'all',
    });
  }

  sendMultipleProblematic(student_ids, lang: string): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateProblematic($student_ids: [ID], $lang: String) {
            CreateProblematic(student_ids: $student_ids, lang: $lang) {
              _id
            }
          }
        `,
        variables: {
          student_ids: student_ids,
          lang,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['CreateProblematic']));
  }
}
