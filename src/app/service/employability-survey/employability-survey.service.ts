import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EmployabilitySurveyService {
  isDataSaved = new BehaviorSubject(false);
  private _childrenFormValidationStatus: boolean = true;

  constructor(private httpClient: HttpClient, private apollo: Apollo, private translate: TranslateService) {}

  get isDataSavedStatus() {
    return this.isDataSaved.value;
  }

  set isDataSavedStatus(isSaved: boolean) {
    this.isDataSaved.next(isSaved);
  }

  public get childrenFormValidationStatus() {
    return this._childrenFormValidationStatus;
  }

  public set childrenFormValidationStatus(state: boolean) {
    this._childrenFormValidationStatus = state;
  }

  // ========================= QUERY ===============================================================================================

  getAllEmployabilitySurveyProcess(pagination: any, filter: any, sorting: any) {
    return this.apollo
      .query({
        query: gql`
          query GetAllEmployabilitySurveyProcess(
            $pagination: PaginationInput
            $filter: EmployabilitySurveyProcessFilterInput
            $sorting: EmployabilitySurveyProcessSortingInput
          ) {
            GetAllEmployabilitySurveyProcess(pagination: $pagination, filter: $filter, sorting: $sorting) {
              _id
              rncp_title_id {
                _id
                short_name
                long_name
              }
              class_id {
                _id
                name
              }
              name
              employability_survey_type
              employability_survey_completed_status
              count_document
              is_es_new_flow_form_builder
              employability_surveys {
                _id
                questionnaire_template_id {
                  _id
                  questionnaire_name
                }
                form_builder_id {
                  _id
                  form_builder_name
                }
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          pagination,
          filter,
          sorting,
        },
      })
      .pipe(map((resp) => resp.data['GetAllEmployabilitySurveyProcess']));
  }

  getAllESForDynamicCol(filter) {
    return this.apollo.query({
      query: gql`
      query GetAllESForDynamicCol($filter: EmployabilitySurveyProcessFilterInput) {
        GetAllEmployabilitySurveyProcess(filter: $filter) {
          employability_surveys {
            _id
          }
        }
      }
      `,
      variables: {
        filter
      },
      fetchPolicy: 'network-only',
    }).pipe(map(res => res.data['GetAllEmployabilitySurveyProcess']))
  }

  getAllEmployabilitySurveyProcessStudentsResult(pagination: any, filter: any, sorting: any, esId, is_for_result_table) {
    return this.apollo
      .query({
        query: gql`
          query GetAllEmployabilitySurveyProcessStudents(
            $pagination: PaginationInput
            $sorting: StudentOfEmployabilitySurveyProcessSortingInput
            $is_for_result_table: Boolean
          ) {
            GetAllEmployabilitySurveyProcessStudents(employability_survey_process_id: "${esId}" pagination: $pagination, ${filter}, sorting: $sorting, is_for_result_table: $is_for_result_table) {
              student_id {
                _id
                first_name
                last_name
                civility
                status
                student_title_status
                incorrect_email
                school {
                  _id
                  short_name
                }
                final_transcript_id {
                  _id
                  status
                  final_transcript_status
                  certification_status
                  jury_decision_for_final_transcript
                  input_final_decision_status
                  is_validated
                  student_decision
                  after_final_retake_decision
                  has_jury_finally_decided
                  retake_test_for_students {
                    test_id {
                      _id
                    }
                  }
                }
                latest_employability_survey_status(
                  employability_survey_process_id: "${esId}"
                )
                employability_survey_ids {
                  _id
                  survey_status
                  employability_survey_process_id {
                    _id
                    name
                  }
                  rncp_id {
                    _id
                    short_name
                  }
                  class_id {
                    _id
                    name
                  }
                  school_id {
                    _id
                    short_name
                  }
                }
                previous_courses_id {
                  rncp_id {
                    _id
                    short_name
                  }
                  class_id {
                    _id
                    name
                  }
                  school_id {
                    _id
                    short_name
                  }
                }
              }
              employability_surveys {
                _id
                survey_status
                school_id {
                  _id
                  short_name
                }
              }
              is_send_to_student
              is_already_send_to_student
              count_document
              school_employability
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          pagination,
          sorting,
          is_for_result_table
        },
      })
      .pipe(map((resp) => resp.data['GetAllEmployabilitySurveyProcessStudents']));
  }

  getAllEmployabilitySurveyProcessStudentsResultIDs(filter: any, sorting: any, esId) {
    return this.apollo
      .query({
        query: gql`
          query getAllEmployabilitySurveyProcessStudentsResultIDs(
            $sorting: StudentOfEmployabilitySurveyProcessSortingInput
          ) {
            GetAllEmployabilitySurveyProcessStudents(employability_survey_process_id: "${esId}", ${filter}, sorting: $sorting) {
              student_id {
                _id
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          sorting,
        },
      })
      .pipe(map((resp) => resp.data['GetAllEmployabilitySurveyProcessStudents']));
  }

  getAllEmployabilitySurveyProcessStudentsParameter(pagination: any, filter: any, sorting: any, esId) {
    return this.apollo
      .query({
        query: gql`
          query GetAllEmployabilitySurveyProcessStudents(
            $pagination: PaginationInput
            $sorting: StudentOfEmployabilitySurveyProcessSortingInput
          ) {
            GetAllEmployabilitySurveyProcessStudents(employability_survey_process_id: "${esId}" pagination: $pagination, ${filter}, sorting: $sorting) {
              student_id {
                _id
                first_name
                last_name
                civility
                status
                incorrect_email
                student_title_status
                previous_courses_id {
                  _id
                  school_id {
                    _id
                    short_name
                  }
                }
                school {
                  _id
                  short_name
                }
                latest_employability_survey_status(
                  employability_survey_process_id: "${esId}"
                )
                final_transcript_id {
                  _id
                  status
                  final_transcript_status
                  certification_status
                  jury_decision_for_final_transcript
                  input_final_decision_status
                  is_validated
                  student_decision
                  after_final_retake_decision
                  has_jury_finally_decided
                  retake_test_for_students {
                    test_id {
                      _id
                    }
                  }
                }
              }
              school_employability
              is_send_to_student
              is_already_send_to_student
              is_already_generated
              count_document
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          pagination,
          sorting,
        },
      })
      .pipe(map((resp) => resp.data['GetAllEmployabilitySurveyProcessStudents']));
  }

  checkAllResultIsSent(pagination: any, filter: any, sorting: any, esId) {
    return this.apollo
      .query({
        query: gql`
          query GetAllEmployabilitySurveyProcessStudents(
            $pagination: PaginationInput
            $sorting: StudentOfEmployabilitySurveyProcessSortingInput
          ) {
            GetAllEmployabilitySurveyProcessStudents(employability_survey_process_id: "${esId}" pagination: $pagination, ${filter}, sorting: $sorting) {
              is_send_to_student
              is_already_send_to_student
              count_document
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          pagination,
          sorting,
        },
      })
      .pipe(map((resp) => resp.data['GetAllEmployabilitySurveyProcessStudents']));
  }

  getOneESData(esId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query getOneESData {
          GetOneEmployabilitySurvey(_id: "${esId}") {
            _id
            survey_status
            employability_survey_process_id{
              _id
              is_es_new_flow_form_builder
            }
            form_process_id{
              _id
            }
            rncp_id {
              _id
              short_name
            }
            school_id {
              _id
            }
            class_id {
              _id
              name
            }
            student_id{
              _id
            }
            send_date
            send_time
            validator
            rejection_details {
              date {
                date
                time
              }
              reason
            }
            with_rejection_flow
            form_process_id {
              _id
              admission_status
            }
            questionnaire_response_id{
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
            employability_survey_process_id {
              _id
              is_es_new_flow_form_builder
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneEmployabilitySurvey']));
  }

  getAllClass(rncp_id) {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllClasses(rncp_id: "${rncp_id}") {
              _id
              name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllClasses']));
  }

  getEmployabilitySurveyCSV(employability_survey_process_id, student_ids): Observable<any[]> {
    return this.apollo
      .watchQuery<any[]>({
        query: gql`
          query GetEmployabilitySurveyCSV($employability_survey_process_id: ID, $student_ids: [ID]) {
            GetEmployabilitySurveyCSV(employability_survey_process_id: $employability_survey_process_id, student_ids: $student_ids) {
              student_responses {
                questionnaire_response_id {
                  competence {
                    segment {
                      segment_name
                      question {
                        question_name
                        questionnaire_field_key
                        answer
                      }
                    }
                  }
                }
                rncp_id {
                  short_name
                }
                class_id {
                  name
                }
                school_id {
                  short_name
                }
                student_id {
                  _id
                  first_name
                  last_name
                  civility
                  email
                  final_transcript_id {
                    _id
                    status
                    final_transcript_status
                    certification_status
                    jury_decision_for_final_transcript
                    input_final_decision_status
                    is_validated
                    student_decision
                    after_final_retake_decision
                    has_jury_finally_decided
                    retake_test_for_students {
                      test_id {
                        _id
                      }
                    }
                  }
                }
                status
                first_name
                last_name
                postal_address
                postal_code
                city
                phone
                cell_phone
                personal_mail
                professional_mail
                form_process_id {
                  _id
                  steps {
                    segments {
                      questions {
                        _id
                        answer_type
                        is_field
                        field_type
                        question_label
                        answer_time
                        answer_duration
                        answer
                        answer_multiple
                        answer_number
                        answer_date {
                          date
                          time
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          employability_survey_process_id,
          student_ids,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetEmployabilitySurveyCSV']));
  }

  getEmployabilitySurveyCSVDialog(employability_survey_process_id, student_ids, employability_survey_id): Observable<any[]> {
    return this.apollo
      .watchQuery<any[]>({
        query: gql`
          query GetEmployabilitySurveyCSV($employability_survey_process_id: ID, $student_ids: [ID], $employability_survey_id: ID) {
            GetEmployabilitySurveyCSV(
              employability_survey_process_id: $employability_survey_process_id
              student_ids: $student_ids
              employability_survey_id: $employability_survey_id
            ) {
              student_responses {
                questionnaire_response_id {
                  competence {
                    segment {
                      segment_name
                      question {
                        question_name
                        questionnaire_field_key
                        answer
                      }
                    }
                  }
                }
                rncp_id {
                  short_name
                }
                class_id {
                  name
                }
                school_id {
                  short_name
                }
                student_id {
                  _id
                  first_name
                  last_name
                  civility
                  email
                  final_transcript_id {
                    _id
                    status
                    final_transcript_status
                    certification_status
                    jury_decision_for_final_transcript
                    input_final_decision_status
                    is_validated
                    student_decision
                    after_final_retake_decision
                    has_jury_finally_decided
                    retake_test_for_students {
                      test_id {
                        _id
                      }
                    }
                  }
                }
                status
                first_name
                last_name
                postal_address
                postal_code
                city
                phone
                cell_phone
                personal_mail
                professional_mail
                form_process_id {
                  _id
                  steps {
                    segments {
                      questions {
                        _id
                        answer_type
                        is_field
                        field_type
                        question_label
                        answer_time
                        answer_duration
                        answer
                        answer_multiple
                        answer_number
                        answer_date {
                          date
                          time
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          employability_survey_process_id,
          student_ids,
          employability_survey_id,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetEmployabilitySurveyCSV']));
  }

  getEmployabilitySurveyCSVForExport(employability_survey_process_id, filter): Observable<any[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetEmployabilitySurveyCSVForExport($employability_survey_process_id: ID, $student_ids: [ID]) {
            GetEmployabilitySurveyCSV(employability_survey_process_id: $employability_survey_process_id, student_ids: $student_ids) {
              student_responses {
                questionnaire_response_id {
                  competence {
                    segment {
                      segment_name
                      question {
                        question_name
                        questionnaire_field_key
                        answer
                      }
                    }
                  }
                }
                rncp_id {
                  short_name
                }
                class_id {
                  name
                }
                school_id {
                  short_name
                }
                student_id {
                  _id
                  first_name
                  last_name
                  civility
                  email
                  final_transcript_id {
                    _id
                    status
                    final_transcript_status
                    certification_status
                    jury_decision_for_final_transcript
                    input_final_decision_status
                    is_validated
                    student_decision
                    after_final_retake_decision
                    has_jury_finally_decided
                    retake_test_for_students {
                      test_id {
                        _id
                      }
                    }
                  }
                }
                status
                first_name
                last_name
                postal_address
                postal_code
                city
                phone
                cell_phone
                personal_mail
                professional_mail
              }
            }
          }
        `,
        variables: {
          employability_survey_process_id,
          filter,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetEmployabilitySurveyCSV']));
  }

  // ========================= MUTATION ===============================================================================================

  createEmployabilitySurveyProcess(payload): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation CreateEmployabilitySurveyProcess($employability_survey_process_input: EmployabilitySurveyProcessInput) {
          CreateEmployabilitySurveyProcess(employability_survey_process_input: $employability_survey_process_input) {
            _id
          }
        }
      `,
      variables: {
        employability_survey_process_input: payload,
      },
      errorPolicy: 'all',
    });
  }

  updateQuestionnaireResponse(payload, _id: string): Observable<any> {
    return this.apollo
      .mutate({
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
      })
      .pipe(map((resp) => resp.data['UpdateQuestionnaireTemplateResponse']));
  }

  submitStudentFormES(_id: string): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SubmitEmployabilitySurvey($_id: ID!) {
            SubmitEmployabilitySurvey(_id: $_id) {
              _id
            }
          }
        `,
        variables: {
          _id: _id,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['SubmitEmployabilitySurvey']));
  }

  rejectFormESReason(_id: string, payload): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation UpdateEmployabilitySurvey($_id: ID!, $emploability_survey_input: EmployabilitySurveyInput) {
          UpdateEmployabilitySurvey(_id: $_id, emploability_survey_input: $emploability_survey_input) {
            _id
          }
        }
      `,
      variables: {
        _id: _id,
        emploability_survey_input: payload,
      },
      errorPolicy: 'all',
    });
  }

  rejectFormESStatus(_id: string, lang): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation RejectEmployabilitySurvey($_id: ID!, $lang: String) {
          RejectEmployabilitySurvey(_id: $_id, lang: $lang) {
            _id
          }
        }
      `,
      variables: {
        _id: _id,
        lang: lang,
      },
      errorPolicy: 'all',
    });
  }

  deleteEmployabilitySurveyProcess(_id: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation DeleteEmployabilitySurveyProcess($_id: ID!) {
          DeleteEmployabilitySurveyProcess(_id: $_id) {
            _id
          }
        }
      `,
      variables: {
        _id: _id,
      },
      errorPolicy: 'all',
    });
  }

  getOneESProcess(esId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query GetOneEmployabilitySurveyProcess {
          GetOneEmployabilitySurveyProcess(_id: "${esId}") {
            _id
            name
            employability_survey_type
            is_published
            is_es_new_flow_form_builder
            rncp_title_id {
              _id
              short_name
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
      .pipe(map((resp) => resp.data['GetOneEmployabilitySurveyProcess']));
  }

  getOneEmployabilitySurveyProcess(esId: string) {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneEmployabilitySurveyProcess(_id: "${esId}") {
            _id
            rncp_title_id{
              _id
              short_name
              long_name
            }
            class_id {
              _id
              name
            }
            name
            employability_survey_type
            employability_surveys{
              _id
              is_already_sent
              is_already_triggered
              questionnaire_template_id{
                _id
              }
              send_date
              send_time
              date_type
              expiration_date
              expiration_time
              expiration_date_type
              send_only_to_pass_student
              send_only_to_not_mention_continue_study
              with_rejection_flow
              is_required_for_certificate
              validator
              students_already_sent {
                _id
              }
              send_date_continuous
              expiration_date_continous
              is_send_es_if_prev_not_answered
              form_builder_id {
                _id
                form_builder_name
              }
              is_send_es_based_on_prev_question
              es_condition_questions {
                _id
                connection
                question {
                  _id
                }
                answer
              }
            }
            is_published
            is_have_student_participant
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetOneEmployabilitySurveyProcess'];
        }),
      );
  }

  checkEmplyabilitySurveyType(esId: string) {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneEmployabilitySurveyProcess(_id: "${esId}") {
            _id
            name
            employability_survey_type
            employability_surveys {
              _id
              is_already_sent
              questionnaire_template_id{
                _id
              }
              send_date
              send_time
              expiration_date
              expiration_time
              send_only_to_pass_student
              send_only_to_not_mention_continue_study
              with_rejection_flow
              is_required_for_certificate
              validator
              students_already_sent {
                _id
              }
              send_date_continuous
              is_send_es_if_prev_not_answered
            }
            is_published
            is_have_student_participant
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetOneEmployabilitySurveyProcess'];
        }),
      );
  }

  getOneESProcessStudents(esId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query GetOneEmployabilitySurveyProcess {
          GetOneEmployabilitySurveyProcess(_id: "${esId}") {
            name
            employability_survey_type
            students{
              student_id {
                _id
                first_name
                last_name
                civility
                school{
                  _id
                  short_name
                }
                latest_employability_survey_status(employability_survey_process_id: "${esId}")
              }
              is_send_to_student
              is_already_send_to_student
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneEmployabilitySurveyProcess']));
  }

  updateESParameters(payload, _id: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation UpdateEmployabilitySurveyProcess($employability_survey_process_input: EmployabilitySurveyProcessInput, $_id: ID!) {
          UpdateEmployabilitySurveyProcess(_id: $_id, employability_survey_process_input: $employability_survey_process_input) {
            _id
          }
        }
      `,
      variables: {
        _id: _id,
        employability_survey_process_input: payload,
      },
      errorPolicy: 'all',
    });
  }

  sendEmployabilitySurvey(_id: string, lang: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation SendEmployabilitySurvey($_id: ID!, $lang: String) {
          SendEmployabilitySurvey(_id: $_id, lang: $lang) {
            _id
          }
        }
      `,
      variables: {
        _id: _id,
        lang: lang,
      },
      errorPolicy: 'all',
    });
  }

  sendEmployabilitySurvey_N4(student_id: string, ES_process_id: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation SendEmployabilitySurvey_N4($student_id: ID!, $ES_process_id: ID!, $lang: String) {
          SendEmployabilitySurvey_N4(student_id: $student_id, ES_process_id: $ES_process_id, lang: $lang) {
            _id
          }
        }
      `,
      variables: {
        student_id: student_id,
        ES_process_id: ES_process_id,
        lang: this.translate.currentLang,
      },
      errorPolicy: 'all',
    });
  }

  toggleSendSurveyToMultipleAllStudents(ES_process_id: string, filter): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation {
          ToggleSendSurveyToMultipleStudents(
            employability_survey_process_id: "${ES_process_id}"
            is_select_all: true
            ${filter}
          ) {
            _id
          }
        }
      `,
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['ToggleSendSurveyToMultipleStudents']));
  }

  toggleSendSurveyToMultipleStudents(employability_survey_process_id: string, student_ids): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation ToggleSendSurveyToMultipleStudents($student_ids: [ID]) {
          ToggleSendSurveyToMultipleStudents(
            employability_survey_process_id: "${employability_survey_process_id}"
            is_select_all: false
            student_ids: $student_ids
          ) {
            _id
          }
        }
      `,
        variables: {
          student_ids: student_ids,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['ToggleSendSurveyToMultipleStudents']));
  }

  toggleExcludeSurveyToMultipleAllStudents(ES_process_id: string, filter): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation {
          ToggleExcludeSurveyToMultipleStudent(
            employability_survey_process_id: "${ES_process_id}"
            is_select_all: true
            ${filter}
          ) {
            _id
          }
        }
      `,
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['ToggleExcludeSurveyToMultipleStudent']));
  }

  toggleExcludeSurveyToMultipleStudents(employability_survey_process_id: string, student_ids): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation ToggleExcludeSurveyToMultipleStudent($student_ids: [ID]) {
          ToggleExcludeSurveyToMultipleStudent(
            employability_survey_process_id: "${employability_survey_process_id}"
            is_select_all: false
            student_ids: $student_ids
          ) {
            _id
          }
        }
      `,
        variables: {
          student_ids: student_ids,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['ToggleExcludeSurveyToMultipleStudent']));
  }

  toggleSendSurveyToStudent(employability_survey_process_id: string, student_id: string, is_send_to_student: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ToggleSendSurveyToStudent($employability_survey_process_id: ID, $student_id: ID, $is_send_to_student: Boolean) {
            ToggleSendSurveyToStudent(
              employability_survey_process_id: $employability_survey_process_id
              student_id: $student_id
              is_send_to_student: $is_send_to_student
            ) {
              _id
            }
          }
        `,
        variables: {
          employability_survey_process_id: employability_survey_process_id,
          student_id: student_id,
          is_send_to_student: is_send_to_student,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['ToggleSendSurveyToStudent']));
  }

  getAllRequiredQuestionES(form_builder_id: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query GetAllRequiredQuestionES($form_builder_id: ID) {
          GetAllRequiredQuestionES(form_builder_id: $form_builder_id) {
            _id
            question_label
            options {
              option_name
            }
          }
        }
      `,
        variables: {
          form_builder_id
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllRequiredQuestionES']));
  }

  GenerateEmployabilitySurveyCSV(employability_survey_process_id, student_ids, employability_survey_id, delimiter, file_name): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation GenerateEmployabilitySurveyCSV(
          $employability_survey_process_id: ID, 
          $student_ids: [ID], 
          $employability_survey_id: ID, 
          $lang: String, 
          $delimiter: EnumDelimiter, 
          $file_name: String
        ) {
          GenerateEmployabilitySurveyCSV(
            employability_survey_process_id: $employability_survey_process_id
            student_ids: $student_ids
            employability_survey_id: $employability_survey_id,
            lang: $lang
            delimiter: $delimiter
            file_name: $file_name
          )
        }
      `,
        variables: {
          employability_survey_process_id,
          student_ids,
          employability_survey_id,
          lang: this.translate.currentLang,
          delimiter,
          file_name
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['GenerateEmployabilitySurveyCSV']));
  } 
}
