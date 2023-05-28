import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class JobDescService {
  constructor(private httpClient: HttpClient, private apollo: Apollo) {}

  getOneJobDescOldNew(jobDescId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneJobDescription(_id: "${jobDescId}") {
            _id
            is_old_job_desc
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneJobDescription']));
  }

  sendReminderToCompleteJobDescription(jobDescId: string, lang: string) {
    return this.apollo.mutate({
      mutation: gql`
      mutation {
        ReminderToCompleteJobDescription(_id: "${jobDescId}", lang: "${lang}")
      }
      `
    })
    .pipe(map((resp) => resp.data['ReminderToCompleteJobDescription']));
  }

  getOneJobDescEval(jobDescId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneJobDescription(_id: "${jobDescId}") {
            _id
            job_description_status
            rncp_id {
              _id
            }
            school_id {
              _id
            }
            student_id{
              _id
            }
            job_name
            date_of_the_mission{
              from {
                date
                time
              }
              to {
                date
                time
              }
            }
            main_mission_of_the_department
            organization_of_the_department
            main_mission
            company_web_url
            company_presentation {
              file_name
              file_url
            }
            company_main_activity
            industry_sector
            signature_of_the_student
            signature_of_the_company_mentor
            signature_of_the_acadir
            block_of_template_competences{
              block_of_template_competence_id{
                _id
              }
              competence_templates{
                competence_template_id{
                  _id
                }
                is_mission_related_to_competence
                missions_activities_autonomy{
                  mission
                  activity
                  autonomy_level
                }
              }
            }
            job_desc_rejections {
              rejection_date {
                date
                time
              }
              reason_of_rejection
            }
            number_of_rejection
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneJobDescription']));
  }

  getOneJobDescEvalMentor(jobDescId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneJobDescription(_id: "${jobDescId}") {
            _id
            job_description_status
            block_of_template_competences{
              block_of_template_competence_id{
                _id
              }
              competence_templates{
                competence_template_id{
                  _id
                  ref_id
                }
                is_mission_related_to_competence
                missions_activities_autonomy{
                  mission
                  activity
                  autonomy_level
                }
              }
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneJobDescription']));
  }
  getOneJobDescNewScore(jobDescId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query GetOneJobDescNewScore {
          GetOneJobDescription(_id: "${jobDescId}") {
            _id
            job_description_status
            rncp_id {
              _id
            }
            school_id {
              _id
            }
            student_id{
              _id
            }
            job_name
            date_of_the_mission{
              from {
                date
                time
              }
              to {
                date
                time
              }
            }
            main_mission_of_the_department
            organization_of_the_department
            main_mission
            company_web_url
            company_presentation {
              file_name
              file_url
            }
            company_main_activity
            industry_sector
            signature_of_the_student
            signature_of_the_company_mentor
            signature_of_the_acadir
            job_desc_rejections {
              rejection_date {
                date
                time
              }
              reason_of_rejection
            }
            number_of_rejection
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
      .pipe(map((resp) => resp.data['GetOneJobDescription']));
  }

  getOneJobDesStatus(jobDescId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneJobDescription(_id: "${jobDescId}") {
            _id
            job_description_status
            status
            date_send {
              date
              time
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneJobDescription']));
  }

  updateJobDescription(payload, _id: string, lang: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation UpdateJobDescription($job_desc_input: JobDescriptionInput, $_id: ID!, $lang: String) {
          UpdateJobDescription(_id: $_id, job_desc_input: $job_desc_input, lang: $lang) {
            _id
          }
        }
      `,
      variables: {
        _id: _id,
        job_desc_input: payload,
        lang,
      },
      errorPolicy: 'all',
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
        ques_temp_response_input: payload
      },
      errorPolicy: 'all',
    });
  }

  submitStudentFormEval(_id: string, lang: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation SubmitJobDescription($_id: ID!, $lang: String) {
          SubmitJobDescription(_id: $_id, lang: $lang) {
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

  rejectStudentFormEval(
    _id: string,
    lang: string,
    reason_of_rejection: string,
    rejection_date: { date: string; time: string },
  ): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation RejectJobDescription($_id: ID!, $lang: String, $reason_of_rejection: String, $rejection_date: RejectionDateInput) {
          RejectJobDescription(_id: $_id, lang: $lang, reason_of_rejection: $reason_of_rejection, rejection_date: $rejection_date) {
            _id
          }
        }
      `,
      variables: {
        _id: _id,
        rejection_date: rejection_date,
        reason_of_rejection: reason_of_rejection,
        lang: lang,
      },
      errorPolicy: 'all',
    });
  }

  getOneJobDescImported(jobDescId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneJobDescription(_id: "${jobDescId}") {
            _id
            job_description_status
            rncp_id {
              _id
            }
            school_id {
              _id
            }
            student_id{
              _id
            }
            job_name
            date_of_the_mission{
              from {
                date
                time
              }
              to {
                date
                time
              }
            }
            main_mission_of_the_department
            organization_of_the_department
            main_mission
            company_web_url
            company_presentation {
              file_name
              file_url
            }
            company_main_activity
            industry_sector
            signature_of_the_student
            signature_of_the_company_mentor
            signature_of_the_acadir
            old_job_desc {
              student_identity {
                first_name
                last_name
                email
              }
              knowledges
              know_how
              objectives_of_the_department
              expected_from_the_students {
                contribution
                objective
              }
              missions_activities_autonomy {
                mission
                activity
                autonomy_level
              }
            }
            job_desc_rejections {
              rejection_date {
                date
                time
              }
              reason_of_rejection
            }
            number_of_rejection
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneJobDescription']));
  }

  getIndustrySectorList(): string[] {
    return [
      'food',
      'bank',
      'wood_paper_cardboard_printing',
      'building_construction_materials',
      'chemistry_parachemistry',
      'sales_trading_distribution',
      'education',
      'edition_communication_multimedia',
      'electronics_electricity',
      'studies_and_consultancy',
      'professional_training',
      'pharmaceutical_industry',
      'it_telecom',
      'machinery_and_equipment_automotive',
      'metallurgy_metal_working',
      'plastic_rubber',
      'business_services',
      'textile_clothing_shoes',
      'transport_logistics',
      'other'
    ]
    // return [
    //   'Food',
    //   'Bank',
    //   'Wood / Paper / Cardboard / Printing',
    //   'Building / Construction Materials',
    //   'Chemistry / Parachemistry',
    //   'Sales / Trading / Distribution',
    //   'Education',
    //   'Edition / Communication / Multimedia',
    //   'Electronics / Electricity',
    //   'Studies and consultancy',
    //   'Professional Training',
    //   'Pharmaceutical industry',
    //   'IT / Telecom',
    //   'Machinery and equipment / Automotive',
    //   'Metallurgy / Metal Working',
    //   'Plastic / Rubber',
    //   'Business services',
    //   'Textile / Clothing / Shoes',
    //   'Transport / Logistics'
    // ]
  }
}
