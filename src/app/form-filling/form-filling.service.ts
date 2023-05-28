import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class FormFillingService {
  private formFillChangeEvent = new BehaviorSubject<boolean>(false);
  public formFillChangeEvent$ = this.formFillChangeEvent.asObservable();

  triggerFormFillChangeEvent(value: boolean) {
    this.formFillChangeEvent.next(value);
  }

  constructor(private apollo: Apollo, private translate: TranslateService) {}

  getOneFormBuilder(templateId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetOneFormBuilder($templateId: ID!) {
            GetOneFormBuilder(_id: $templateId) {
              _id
              form_builder_name
              is_published
              created_by {
                _id
              }
              steps {
                _id
                step_title
                step_type
                is_validation_required
                direction
                status
                segments {
                  _id
                  segment_title
                  questions {
                    _id
                    is_field
                    field_type
                    field_position
                    is_editable
                    is_required
                    ref_id
                    answer_type
                    question_label
                    options {
                      option_name
                      is_continue_next_step
                      is_go_to_final_step
                      additional_step_id
                      is_go_to_final_message
                    }
                    count_document
                  }
                }
              }
              is_contract_signatory_in_order
              contract_signatory {
                _id
                name
              }
            }
          }
        `,
        variables: {
          templateId,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneFormBuilder']));
  }

  GetOneRandomStudentAdmissionProcess(form_builder_id): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetOneRandomFormProcess($form_builder_id: ID!) {
            GetOneRandomFormProcess(form_builder_id: $form_builder_id) {
              _id
              student_id {
                _id
                first_name
                last_name
              }
              class_id {
                _id
                name
              }
              rncp_title_id {
                _id
                short_name
              }
              school_id {
                _id
                short_name
              }
              status
              steps {
                _id
                step_title
                step_type
                is_validation_required
                direction
                status
                is_only_visible_based_on_condition
                step_status
                user_who_complete_step
                segments {
                  _id
                  segment_title
                  acceptance_pdf
                  acceptance_text
                  questions {
                    _id
                    is_field
                    field_type
                    field_position
                    is_editable
                    is_required
                    ref_id
                    answer_type
                    question_label
                    final_message_question {
                      final_message_image {
                        name
                        s3_file_name
                      }
                      final_message_summary_header
                      final_message_summary_footer
                    }
                    options {
                      option_name
                      is_continue_next_step
                      is_go_to_final_step
                      additional_step_id
                      is_go_to_final_message
                    }
                    answer
                    answer_multiple
                    answer_number
                    document_validation_status
                    is_document_validated
                    date_format
                    date_value
                    answer_date {
                      date
                      time
                    }
                    text_validation {
                      condition
                      number
                      custom_error_text
                    }
                    answer_time
                    answer_duration
                    numeric_validation {
                      condition
                      number
                      min_number
                      max_number
                      custom_error_text
                    }
                    multiple_option_validation {
                      condition
                      number
                      custom_error_text
                    }
                  }
                }
              }
              is_final_validator_active
              final_validators {
                _id
                name
                entity
              }
            }
          }
        `,
        variables: {
          form_builder_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneRandomFormProcess']));
  }

  getOneStudentAdmissionProcess(formId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetOneFormProcess($formId: ID!) {
            GetOneFormProcess(_id: $formId) {
              _id
              admission_status
              is_final_validator_active
              signature_date {
                date
                time
              }
              revision_user_type {
                _id
                name
              }
              final_validators {
                _id
                name_with_entity
              }
              final_validator_statuses {
                user_id {
                  _id
                }
                is_already_sign
              }
              student_id {
                _id
                civility
                first_name
                last_name
              }
              class_id {
                _id
                name
              }
              rncp_title_id {
                _id
                short_name
              }
              school_id {
                _id
                short_name
              }
              steps {
                _id
                step_title
                step_type
                step_status
                is_validation_required
                direction
                status
                step_status
                contract_signatory_status {
                  is_already_sign
                  sign_url
                  latest_requested_url
                  recipient_id
                  client_id
                  user_type_id {
                    _id
                    name
                  }
                  user_id {
                    _id
                    first_name
                    last_name
                  }
                }
                user_recipient_signatory {
                  user_id {
                    _id
                    first_name
                    last_name
                  }
                  is_already_sign
                  latest_requested_url
                  sign_url
                  recipient_id
                  client_id
                }
                signature_date {
                  date
                  time
                }
                revision_user_type {
                  _id
                  name
                }
                validator {
                  _id
                  name
                }
                revise_request_messages {
                  created_date
                  created_time
                  created_by {
                    _id
                    civility
                    first_name
                    last_name
                  }
                  user_type_id {
                    _id
                    name
                  }
                  message
                }
                segments {
                  _id
                  segment_title
                  acceptance_pdf
                  acceptance_text
                  document_for_condition
                  is_upload_pdf_acceptance
                  questions {
                    _id
                    is_field
                    field_type
                    field_position
                    is_editable
                    is_required
                    ref_id
                    answer_type
                    question_label
                    options {
                      option_name
                      is_continue_next_step
                      is_go_to_final_step
                      additional_step_id
                      is_go_to_final_message
                    }
                    answer
                    answer_multiple
                    answer_number
                    answer_time
                    answer_duration
                    document_validation_status
                    is_document_validated
                    date_format
                    date_value
                    answer_date {
                      date
                      time
                    }
                    parent_child_options {
                      option_text
                      position
                      questions {
                        question_name
                        sort_order
                        answer_type
                        answer
                        answer_number
                        answer_date {
                          date
                          time
                        }
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
                            answer_type
                            answer_number
                            answer_date {
                              date
                              time
                            }
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
                                answer_type
                                answer
                                answer_number
                                answer_date {
                                  date
                                  time
                                }
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
                                    answer_type
                                    answer
                                    answer_number
                                    answer_date {
                                      date
                                      time
                                    }
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
                                        answer_type
                                        answer
                                        answer_number
                                        answer_date {
                                          date
                                          time
                                        }
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
                                            answer_type
                                            answer
                                            answer_number
                                            answer_date {
                                              date
                                              time
                                            }
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
                custom_button_text {
                  save_text
                  submit_text
                  ask_revision_text
                  validate_text
                  complete_revision_text
                  sign_contract_text
                }
              }
              revise_request_messages {
                created_date
                created_time
                created_by {
                  _id
                  civility
                  first_name
                  last_name
                }
                user_type_id {
                  _id
                  name
                }
                message
              }
            }
          }
        `,
        variables: {
          formId,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneFormProcess']));
  }
  getOneRandomFormProcess(form_builder_id): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetOneRandomFormProcess($form_builder_id: ID!) {
            GetOneRandomFormProcess(form_builder_id: $form_builder_id) {
              _id
              student_id {
                _id
                civility
                first_name
                last_name
                tele_phone
                email
                date_of_birth
                place_of_birth
                nationality
                student_address {
                  address
                  postal_code
                  country
                  city
                  department
                  region
                }
                rncp_title {
                  short_name
                }
                current_class {
                  name
                }
                specialization {
                  name
                }
                parents {
                  relation
                  civility
                  name
                  family_name
                  tele_phone
                  email
                  parent_address {
                    address
                    postal_code
                    country
                    city
                    department
                    region
                  }
                }
              }
              class_id {
                _id
                name
              }
              rncp_title_id {
                _id
                short_name
              }
              school_id {
                _id
                short_name
              }
              status
              steps {
                _id
                step_title
                step_type
                is_validation_required
                is_only_visible_based_on_condition
                step_status
                direction
                status
                user_who_complete_step
                segments {
                  _id
                  segment_title
                  acceptance_pdf
                  acceptance_text
                  is_rejection_allowed
                  is_on_reject_complete_the_step
                  is_download_mandatory
                  accept_button
                  reject_button
                  questions {
                    _id
                    is_field
                    field_type
                    field_position
                    is_editable
                    is_required
                    ref_id
                    answer_type
                    question_label
                    final_message_question {
                      final_message_image {
                        name
                        s3_file_name
                      }
                      final_message_summary_header
                      final_message_summary_footer
                    }
                    options {
                      option_name
                      is_continue_next_step
                      is_go_to_final_step
                      additional_step_id
                      is_go_to_final_message
                    }
                    answer
                    answer_multiple
                    answer_number
                    document_validation_status
                    is_document_validated
                    date_format
                    date_value
                    answer_date {
                      date
                      time
                    }
                    text_validation {
                      condition
                      number
                      custom_error_text
                    }
                    answer_time
                    answer_duration
                    numeric_validation {
                      condition
                      number
                      min_number
                      max_number
                      custom_error_text
                    }
                    multiple_option_validation {
                      condition
                      number
                      custom_error_text
                    }
                    parent_child_options {
                      option_text
                      position
                      questions {
                        question_name
                        sort_order
                        answer_type
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
                            answer_type
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
                                answer_type
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
                                    answer_type
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
                                        answer_type
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
                custom_button_text {
                  save_text
                  submit_text
                  ask_revision_text
                  validate_text
                  complete_revision_text
                  sign_contract_text
                }
              }
              is_final_validator_active
              final_validators {
                _id
                name
                entity
              }
            }
          }
        `,
        variables: {
          form_builder_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneRandomFormProcess']));
  }
  getOneFormProcess(formId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetOneFormProcess($formId: ID!) {
            GetOneFormProcess(_id: $formId) {
              _id
              admission_status
              is_final_validator_active
              status
              signature_date {
                date
                time
              }
              revision_user_type {
                _id
                name
              }
              final_validators {
                _id
                name_with_entity
              }
              final_validator_statuses {
                user_id {
                  _id
                }
                is_already_sign
              }
              student_id {
                admission_process_id {
                  _id
                }
                user_id {
                  _id
                  entities {
                    type {
                      _id
                    }
                  }
                }
                _id
                civility
                first_name
                last_name
                tele_phone
                email
                date_of_birth
                place_of_birth
                nationality
                postal_code_of_birth
                student_address {
                  address
                  postal_code
                  country
                  city
                  department
                  region
                }
                rncp_title {
                  _id
                  short_name
                }
                current_class {
                  _id
                  name
                }
                specialization {
                  name
                }
                school {
                  _id
                  short_name
                }
                parents {
                  relation
                  civility
                  name
                  family_name
                  tele_phone
                  email
                  parent_address {
                    address
                    postal_code
                    country
                    city
                    department
                    region
                  }
                }
                previous_courses_id {
                  rncp_id {
                    _id
                    short_name
                  }
                  school_id {
                    _id
                    short_name
                  }
                  class_id {
                    _id
                    name
                  }
                  specialization {
                    name
                  }
                }
              }
              user_id {
                _id
                civility
                first_name
                last_name
                office_phone
                portable_phone
                email
                address {
                  address
                  postal_code
                  country
                  city
                  department
                  region
                }
                entities {
                  type {
                    _id
                  }
                }
              }
              class_id {
                _id
                name
                specializations {
                  _id
                  name
                  class_id {
                    _id
                  }
                  rncp_title_id {
                    _id
                  }
                }
              }
              rncp_title_id {
                _id
                short_name
              }
              school_id {
                _id
                short_name
              }
              form_builder_id {
                _id
              }
              steps {
                _id
                step_title
                step_type
                step_status
                is_validation_required
                is_only_visible_based_on_condition
                direction
                status
                step_status
                form_builder_step {
                  _id
                }
                contract_signatory_status {
                  is_already_sign
                  sign_url
                  latest_requested_url
                  recipient_id
                  client_id
                  user_type_id {
                    _id
                    name
                  }
                  user_id {
                    _id
                    first_name
                    last_name
                  }
                }
                is_contract_signatory_in_order
                contract_signatory {
                  _id
                  name
                  description
                }
                contract_template_pdf
                user_recipient_signatory {
                  user_id {
                    _id
                    first_name
                    last_name
                  }
                  is_already_sign
                  latest_requested_url
                  sign_url
                  recipient_id
                  client_id
                }
                is_include_in_summary
                is_final_step
                user_who_complete_step {
                  _id
                  name
                }
                signature_date {
                  date
                  time
                }
                revision_user_type {
                  _id
                  name
                }
                validator {
                  _id
                  name
                }
                revise_request_messages {
                  created_date
                  created_time
                  created_by {
                    _id
                    civility
                    first_name
                    last_name
                  }
                  user_type_id {
                    _id
                    name
                  }
                  message
                }
                segments {
                  _id
                  segment_title
                  acceptance_pdf
                  acceptance_text
                  document_for_condition
                  is_upload_pdf_acceptance
                  is_rejection_allowed
                  is_download_mandatory
                  accept_button
                  reject_button
                  use_total_mandatory_documents
                  total_mandatory_document
                  questions {
                    _id
                    is_field
                    field_type
                    field_position
                    is_editable
                    is_required
                    is_router_on
                    ref_id
                    answer_type
                    question_label
                    special_question {
                      step_type
                      summary_header
                      summary_footer
                    }
                    multiple_option_validation {
                      condition
                      number
                      custom_error_text
                    }
                    options {
                      option_name
                      is_continue_next_step
                      is_go_to_final_step
                      additional_step_id
                      is_go_to_final_message
                    }
                    answer
                    answer_multiple
                    answer_number
                    answer_time
                    answer_duration
                    document_validation_status
                    is_document_validated
                    final_message_question {
                      final_message_image {
                        name
                        s3_file_name
                      }
                      final_message_summary_header
                      final_message_summary_footer
                    }
                    date_format
                    date_value
                    answer_date {
                      date
                      time
                    }
                    numeric_validation {
                      condition
                      number
                      min_number
                      max_number
                      custom_error_text
                    }
                    multiple_option_validation {
                      condition
                      number
                      custom_error_text
                    }
                    text_validation {
                      condition
                      number
                      custom_error_text
                    }
                    final_message_question {
                      final_message_image {
                        name
                        s3_file_name
                      }
                      final_message_summary_header
                      final_message_summary_footer
                    }
                    parent_child_options {
                      option_text
                      position
                      questions {
                        question_name
                        sort_order
                        answer_type
                        answer_number
                        answer_date {
                          date
                          time
                        }
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
                            answer_type
                            answer
                            answer_number
                            answer_date {
                              date
                              time
                            }
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
                                answer_type
                                answer
                                answer_number
                                answer_date {
                                  date
                                  time
                                }
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
                                    answer_type
                                    answer
                                    answer_number
                                    answer_date {
                                      date
                                      time
                                    }
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
                                        answer_type
                                        answer
                                        answer_number
                                        answer_date {
                                          date
                                          time
                                        }
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
                custom_button_text {
                  save_text
                  submit_text
                  ask_revision_text
                  validate_text
                  complete_revision_text
                  sign_contract_text
                }
              }
              revise_request_messages {
                created_date
                created_time
                created_by {
                  _id
                  civility
                  first_name
                  last_name
                }
                user_type_id {
                  _id
                  name
                }
                message
              }
            }
          }
        `,
        variables: {
          formId,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneFormProcess']));
  }

  getOneUser(_id): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetOneUser($_id: ID) {
            GetOneUser(_id: $_id) {
              _id
              entities {
                entity_name
                type {
                  _id
                  name
                }
              }
              first_name
              last_name
              civility
              student_id {
                _id
                admission_process_id {
                  _id
                  steps {
                    _id
                    step_type
                    step_status
                  }
                }
              }
            }
          }
        `,
        variables: {
          _id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneUser']));
  }

  createUpdateStudentAdmissionProcessStepAndQuestion(student_admission_process_step_input: any) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation saveStudentAdmissionStep($student_admission_process_step_input: CreateUpdateStudentAdmissionProcessStepInput) {
            CreateUpdateStudentAdmissionProcessStepAndQuestion(
              student_admission_process_step_input: $student_admission_process_step_input
            ) {
              _id
            }
          }
        `,
        variables: {
          student_admission_process_step_input,
        },
      })
      .pipe(map((resp) => resp.data['CreateUpdateStudentAdmissionProcessStepAndQuestion']));
  }
  createUpdateFormProcessStepAndQuestion(form_process_step_input: any) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation saveStudentAdmissionStep($form_process_step_input: CreateUpdateFormProcessStepInput) {
            CreateUpdateFormProcessStepAndQuestion(form_process_step_input: $form_process_step_input) {
              _id
            }
          }
        `,
        variables: {
          form_process_step_input,
        },
      })
      .pipe(map((resp) => resp.data['CreateUpdateFormProcessStepAndQuestion']));
  }

  acceptStudentAdmissionProcessStep(student_admission_process_id, _id?: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation AcceptStudentAdmissionProcessStep($_id: ID, $student_admission_process_id: ID!) {
            AcceptStudentAdmissionProcessStep(_id: $_id, student_admission_process_id: $student_admission_process_id) {
              _id
            }
          }
        `,
        variables: {
          _id: _id ? _id : null,
          student_admission_process_id,
        },
      })
      .pipe(map((resp) => resp.data['AcceptStudentAdmissionProcessStep']));
  }
  acceptFormProcessStep(form_process_id, _id?: string, acceptance?: 'accepted' | 'rejected' | null) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation AcceptFormProcessStep($_id: ID, $form_process_id: ID!, $acceptance: EnumConditionAcceptanceStatus) {
            AcceptFormProcessStep(_id: $_id, form_process_id: $form_process_id, condition_acceptance_status: $acceptance) {
              _id
            }
          }
        `,
        variables: {
          _id: _id ? _id : null,
          form_process_id,
          acceptance,
        },
      })
      .pipe(map((resp) => resp.data['AcceptFormProcessStep']));
  }

  askRevisionStudentAdmissionProcessStep(_id: string, revise_request_messages: any) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation AskRevisionStudentAdmissionProcessStep(
            $_id: ID
            $revise_request_messages: [StudentAdmissionProcessStepReviseRequestMessageInput]
          ) {
            AskRevisionStudentAdmissionProcessStep(_id: $_id, revise_request_messages: $revise_request_messages) {
              _id
            }
          }
        `,
        variables: {
          _id,
          revise_request_messages,
        },
      })
      .pipe(map((resp) => resp.data['AskRevisionStudentAdmissionProcessStep']));
  }

  askRevisionFormProcessStep(_id: string, revise_request_messages: any) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation AskRevisionFormProcessStep($_id: ID, $revise_request_messages: [FormProcessStepReviseRequestMessageInput]) {
            AskRevisionFormProcessStep(_id: $_id, revise_request_messages: $revise_request_messages) {
              _id
            }
          }
        `,
        variables: {
          _id,
          revise_request_messages,
        },
      })
      .pipe(map((resp) => resp.data['AskRevisionFormProcessStep']));
  }

  askRevisionFormProcess(_id: string, revise_request_messages: any) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation AskRevisionFormProcess($_id: ID, $revise_request_messages: [FormProcessReviseRequestMessageInput]) {
            AskRevisionFormProcess(_id: $_id, revise_request_messages: $revise_request_messages) {
              _id
            }
          }
        `,
        variables: {
          _id,
          revise_request_messages,
        },
      })
      .pipe(map((resp) => resp.data['AskRevisionFormProcess']));
  }

  replyRevisionMessageFormProcessStep(_id: string, revise_request_message: any) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ReplyRevisionMessageFormProcessStep($_id: ID, $revise_request_message: FormProcessStepReviseRequestMessageInput) {
            ReplyRevisionMessageFormProcessStep(_id: $_id, revise_request_message: $revise_request_message) {
              _id
            }
          }
        `,
        variables: {
          _id,
          revise_request_message,
        },
      })
      .pipe(map((resp) => resp.data['ReplyRevisionMessageFormProcessStep']));
  }

  replyRevisionMessageFormProcess(_id: string, revise_request_message: any) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ReplyRevisionMessageFormProcess($_id: ID, $revise_request_message: FormProcessReviseRequestMessageInput) {
            ReplyRevisionMessageFormProcess(_id: $_id, revise_request_message: $revise_request_message) {
              _id
            }
          }
        `,
        variables: {
          _id,
          revise_request_message,
        },
      })
      .pipe(map((resp) => resp.data['ReplyRevisionMessageFormProcess']));
  }

  askRevisionStudentAdmissionProcess(_id: string, revise_request_messages: any) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation AskRevisionStudentAdmissionProcess(
            $_id: ID
            $revise_request_messages: [StudentAdmissionProcessReviseRequestMessageInput]
          ) {
            AskRevisionStudentAdmissionProcess(_id: $_id, revise_request_messages: $revise_request_messages) {
              _id
            }
          }
        `,
        variables: {
          _id,
          revise_request_messages,
        },
      })
      .pipe(map((resp) => resp.data['AskRevisionStudentAdmissionProcess']));
  }

  replyRevisionMessageStudentAdmissionProcessStep(_id: string, revise_request_message: any) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ReplyRevisionMessageStudentAdmissionProcessStep(
            $_id: ID
            $revise_request_message: StudentAdmissionProcessStepReviseRequestMessageInput
          ) {
            ReplyRevisionMessageStudentAdmissionProcessStep(_id: $_id, revise_request_message: $revise_request_message) {
              _id
            }
          }
        `,
        variables: {
          _id,
          revise_request_message,
        },
      })
      .pipe(map((resp) => resp.data['ReplyRevisionMessageStudentAdmissionProcessStep']));
  }

  replyRevisionMessageStudentAdmissionProcess(_id: string, revise_request_message: any) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ReplyRevisionMessageStudentAdmissionProcess(
            $_id: ID
            $revise_request_message: StudentAdmissionProcessReviseRequestMessageInput
          ) {
            ReplyRevisionMessageStudentAdmissionProcess(_id: $_id, revise_request_message: $revise_request_message) {
              _id
            }
          }
        `,
        variables: {
          _id,
          revise_request_message,
        },
      })
      .pipe(map((resp) => resp.data['ReplyRevisionMessageStudentAdmissionProcess']));
  }

  getOneStudentAdmissionProcessStep(_id: string) {
    return this.apollo
      .query({
        query: gql`
          query GetOneStudentAdmissionProcessStep($_id: ID!) {
            GetOneStudentAdmissionProcessStep(_id: $_id) {
              _id
              step_title
              step_type
              is_validation_required
              direction
              status
              validator {
                _id
                name
              }
              revision_user_type {
                _id
                name
              }
              revise_request_messages {
                created_date
                created_time
                created_by {
                  _id
                  civility
                  first_name
                  last_name
                }
                user_type_id {
                  _id
                  name
                }
                message
              }
              segments {
                _id
                segment_title
                acceptance_pdf
                acceptance_text
                document_for_condition
                is_upload_pdf_acceptance
                questions {
                  _id
                  is_field
                  field_type
                  field_position
                  is_editable
                  is_required
                  ref_id
                  answer_type
                  question_label
                  options
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
        `,
        variables: {
          _id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudentAdmissionProcessStep']));
  }

  acceptStudentAdmissionSummary(student_admission_process_id) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation AcceptFormProcessStep($student_admission_process_id: ID!) {
            AcceptFormProcessStep(student_admission_process_id: $student_admission_process_id) {
              _id
            }
          }
        `,
        variables: {
          student_admission_process_id,
        },
      })
      .pipe(map((resp) => resp.data['AcceptFormProcessStep']));
  }

  AcceptFormProcessStep(form_process_id) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation AcceptFormProcessStep($form_process_id: ID!) {
            AcceptFormProcessStep(form_process_id: $form_process_id) {
              _id
            }
          }
        `,
        variables: {
          form_process_id,
        },
      })
      .pipe(map((resp) => resp.data['AcceptFormProcessStep']));
  }

  validateStudentAdmissionProcess(_id: string, user_type_id?: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ValidateStudentAdmissionProcess($_id: ID!, $user_type_id: ID) {
            ValidateStudentAdmissionProcess(_id: $_id, user_type_id: $user_type_id) {
              _id
            }
          }
        `,
        variables: {
          _id,
          user_type_id: user_type_id ? user_type_id : null,
        },
      })
      .pipe(map((resp) => resp.data['ValidateStudentAdmissionProcess']));
  }

  validateFormProcess(_id: string, user_type_id?: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ValidateFormProcess($_id: ID!, $user_type_id: ID) {
            ValidateFormProcess(_id: $_id, user_type_id: $user_type_id) {
              _id
            }
          }
        `,
        variables: {
          _id,
          user_type_id: user_type_id ? user_type_id : null,
        },
      })
      .pipe(map((resp) => resp.data['ValidateFormProcess']));
  }

  getOneTaskForFormFilling(taskId) {
    return this.apollo
      .query({
        query: gql`
          query GetOneTaskForFormFilling($_id: ID!) {
            GetOneTask(_id: $_id) {
              _id
              task_status
              user_selection {
                user_id {
                  _id
                  civility
                  first_name
                  last_name
                  student_id {
                    _id
                  }
                }
                user_type_id {
                  _id
                  name
                }
              }
              description
              type
              form_process_step_id {
                _id
              }
              form_process_id {
                _id
                form_builder_id {
                  template_type
                }
              }
            }
          }
        `,
        variables: {
          _id: taskId,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetOneTask'];
        }),
      );
  }

  generateAdmissionProcessSumarry(_id: any, for_summary_tab: boolean = false) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation GenerateAdmissionProcessSummaryPDF($_id: ID!, $for_summary_tab: Boolean, $lang: String) {
            GenerateAdmissionProcessSummaryPDF(_id: $_id, for_summary_tab: $for_summary_tab, lang: $lang)
          }
        `,
        variables: {
          _id,
          for_summary_tab,
          lang: this.translate.currentLang,
        },
      })
      .pipe(map((resp) => resp.data['GenerateAdmissionProcessSummaryPDF']));
  }
  generateFormBuilderContractTemplatePDF(_id, is_preview, lang, form_process_step_id): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation GenerateFormBuilderContractTemplatePDF($_id: ID, $is_preview: Boolean, $lang: String, $form_process_step_id: ID) {
            GenerateFormBuilderContractTemplatePDF(
              _id: $_id
              is_preview: $is_preview
              lang: $lang
              form_process_step_id: $form_process_step_id
            )
          }
        `,
        variables: {
          _id,
          is_preview,
          lang,
          form_process_step_id,
        },
      })
      .pipe(map((resp) => resp.data['GenerateFormBuilderContractTemplatePDF']));
  }
  getOneFormProcessStep(_id) {
    return this.apollo
      .query({
        query: gql`
          query GetOneFormProcessStep($_id: ID) {
            GetOneFormProcessStep(_id: $_id) {
              _id
              step_title
              contract_template_pdf
              form_builder_step {
                _id
              }
            }
          }
        `,
        variables: {
          _id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetOneFormProcessStep'];
        }),
      );
  }
  acceptFormProcessStepSigningProcess(form_process_id, _id, urlRedirect) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation AcceptFormProcessStep($_id: ID, $form_process_id: ID!, $urlRedirect: String) {
            AcceptFormProcessStep(_id: $_id, form_process_id: $form_process_id, urlRedirect: $urlRedirect) {
              _id
            }
          }
        `,
        variables: {
          form_process_id,
          _id,
          urlRedirect,
        },
      })
      .pipe(map((resp) => resp.data['AcceptFormProcessStep']));
  }
  getContractProcessURL(_id, form_process_id, urlRedirect): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation GetContractProcessURL($_id: ID, $form_process_id: ID, $urlRedirect: String) {
            GetContractProcessURL(_id: $_id, form_process_id: $form_process_id, urlRedirect: $urlRedirect)
          }
        `,
        variables: {
          _id,
          form_process_id,
          urlRedirect,
        },
      })
      .pipe(map((resp) => resp.data['GetContractProcessURL']));
  }

  getAllFormBuilderFieldTypesStudent(student_id): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllFormBuilderFieldTypes($student_id: ID) {
            GetAllFormBuilderFieldTypes(student_id: $student_id) {
              student_id {
                _id
                first_name
                last_name
              }
              count_document
              question_label
              question_answer
            }
          }
        `,
        variables: {
          student_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllFormBuilderFieldTypes']));
  }

  getAllFormBuilderFieldTypesUser(user_id): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllFormBuilderFieldTypes($user_id: ID) {
            GetAllFormBuilderFieldTypes(user_id: $user_id) {
              user_id {
                _id
                first_name
                last_name
              }
              count_document
              question_label
              question_answer
            }
          }
        `,
        variables: {
          user_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllFormBuilderFieldTypes']));
  }
}
