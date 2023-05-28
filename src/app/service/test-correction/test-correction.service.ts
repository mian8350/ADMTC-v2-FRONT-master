import { Injectable } from '@angular/core';

import gql from 'graphql-tag';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Apollo } from 'apollo-angular';
import { TestCorrection } from 'app/test-correction/test-correction.model';
import { BehaviorSubject } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TestCorrectionService {
  public statusLoading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  httpOptions = {
    headers: new HttpHeaders({
      Authorization: JSON.parse(localStorage.getItem('admtc-token-encryption')),
    }),
  };

  setStatusLoading(value: boolean) {
    this.statusLoading.next(value);
  }

  constructor(private apollo: Apollo, private httpClient: HttpClient) {}

  getPdfPersonalizedInZip(payload) {
    const url = environment.apiUrl.replace('/graphql', '');
    return this.httpClient.post(`${url}/download/generatePDFNominatifPerStudentOrGroup`, payload, this.httpOptions).pipe(map((res) => res));
  }

  getPublishedAutoProEvalInZip(payload) {
    const url = environment.apiUrl.replace('/graphql', '');
    return this.httpClient.post(`${url}/download/generatePDFPublishedAutoProEvalTest`, payload, this.httpOptions).pipe(map((res) => res));
  }

  getTitle(titleId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query getTitleDataOfTestCorrection {
        GetOneTitle(_id: "${titleId}") {
          _id
          short_name
          long_name
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTitle']));
  }

  createCriteriaOfEvaluationTemplateQuestion(
    criteria_of_evaluation_template_id,
    question,
    block_of_template_competence_id,
  ): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation {
          CreateCriteriaOfEvaluationTemplateQuestion(criteria_of_evaluation_template_question_input: {
            criteria_of_evaluation_template_id: "${criteria_of_evaluation_template_id}",
            block_of_template_competence_id: "${block_of_template_competence_id}"
            question: "${question}"
          }) {
            s3_file_name
            block_of_template_competence_id {
              _id
              name
            }
            status
          }
        }
        `,
      })
      .pipe(map((resp) => resp.data['CreateCriteriaOfEvaluationTemplateQuestion']));
  }

  updateCriteriaOfEvaluationTemplateQuestion(
    _id,
    criteria_of_evaluation_template_id,
    question,
    block_of_template_competence_id,
  ): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation {
          UpdateCriteriaOfEvaluationTemplateQuestion(_id: "${_id}", criteria_of_evaluation_template_question_input: {
            criteria_of_evaluation_template_id: "${criteria_of_evaluation_template_id}",
            block_of_template_competence_id: "${block_of_template_competence_id}",
            question: "${question}"
          }) {
            s3_file_name
            block_of_template_competence_id {
              _id
              name
            }
            status
          }
        }
        `,
      })
      .pipe(map((resp) => resp.data['UpdateCriteriaOfEvaluationTemplateQuestion']));
  }

  deleteCriteriaOfEvaluationTemplateQuestion(id): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation {
          DeleteCriteriaOfEvaluationTemplateQuestion(_id: "${id}") {
            _id
          }
        }
        `,
      })
      .pipe(map((resp) => resp.data['DeleteCriteriaOfEvaluationTemplateQuestion']));
  }
  saveNewQuestion(s3_file_name, block_of_template_competence_id): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation {
          CreateCriteriaOfEvaluationTemplateQuestion(criteria_of_evaluation_template_question_input: {
            s3_file_name: "${s3_file_name}",
            block_of_template_competence_id: "${block_of_template_competence_id}"
          }) {
            s3_file_name
            block_of_template_competence_id {
              _id
              name
            }
            status
          }
        }
        `,
      })
      .pipe(map((resp) => resp));
  }
  
  getDocumentExpectedDueDatePassed(test_id: string, student_ids?: string[], group_test_id?: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetDocumentExpectedDueDatePassed($test_id: ID, $student_ids: [ID], $group_test_id: ID) {
            GetDocumentExpectedDueDatePassed(test_id: $test_id, student_ids: $student_ids, group_test_id: $group_test_id)
          }
        `,
        variables: { test_id, student_ids, group_test_id },
        fetchPolicy: 'network-only'
      })
      .pipe(map((resp) => resp.data['GetDocumentExpectedDueDatePassed']));
  }

  getTest(testId: string, schoolId?): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query getTestDataOfTestCorrection($test_id: ID!, $school_id: ID) {
            GetOneTest(_id: $test_id, school_id: $school_id) {
              _id
              type
              name
              correction_type
              date_type
              block_type
              is_retake_test
              parent_rncp_title {
                _id
              }
              class_id {
                _id
              }
              date {
                date_utc
                time_utc
              }
              schools {
                school_id {
                  _id
                  short_name
                  students {
                    _id
                    first_name
                    last_name
                  }
                }
              }
              correction_grid {
                header {
                  text
                  fields {
                    type
                    value
                    data_type
                    align
                  }
                  directive_long
                }
                correction {
                  show_as_list
                  show_notation_marks
                  show_direction_column
                  directions_column_header
                  show_number_marks_column
                  number_marks_column_header
                  show_letter_marks_column
                  letter_marks_column_header
                  show_phrase_marks_column
                  phrase_marks_column_header
                  comment_area
                  comments_header
                  comment_for_each_section
                  comment_for_each_section_header
                  comment_for_each_sub_section
                  comment_for_each_sub_section_header
                  show_final_comment
                  final_comment_header
                  display_final_total
                  total_zone {
                    display_additional_total
                    additional_max_score
                    decimal_place
                  }
                  show_penalty
                  penalty_header
                  show_bonus
                  bonus_header
                  show_elimination
                  sections {
                    title
                    maximum_rating
                    page_break
                    sub_sections {
                      title
                      maximum_rating
                      direction
                    }
                    score_conversions {
                      _id
                      score
                      phrase
                      letter
                    }
                  }
                  sections_evalskill {
                    specialization_id
                    academic_skill_competence_template_id {
                      _id
                      short_name
                    }
                    soft_skill_competence_template_id {
                      _id
                      short_name
                    }
                    academic_skill_block_template_id {
                      _id
                    }
                    soft_skill_block_template_id {
                      _id
                    }
                    ref_id
                    is_selected
                    title
                    maximum_rating
                    page_break
                    sub_sections {
                      academic_skill_criteria_of_evaluation_competence_id {
                        _id
                      }
                      soft_skill_criteria_of_evaluation_competence_id {
                        _id
                      }
                      academic_skill_competence_template_id {
                        _id
                      }
                      soft_skill_competence_template_id {
                        _id
                      }
                      ref_id
                      is_selected
                      title
                      direction
                      maximum_rating
                    }
                    score_conversions {
                      _id
                      score
                      phrase
                      letter
                    }
                  }
                  penalties {
                    title
                    count
                  }
                  bonuses {
                    title
                    count
                  }
                }
                footer {
                  text
                  text_below
                  fields {
                    value
                    type
                    data_type
                    align
                  }
                }
                group_detail {
                  no_of_student
                  header_text
                  min_no_of_student
                  group_allocation
                }
                orientation
              }
              corrector_assigned(school_id: $school_id) {
                corrector_id {
                  _id
                  first_name
                  last_name
                }
                school_id {
                  _id
                }
                students {
                  _id
                  first_name
                  last_name
                  civility
                  specialization {
                    _id
                  }
                  soft_skill_pro_evaluation {
                    status
                  }
                  academic_pro_evaluation {
                    status
                  }
                  companies {
                    status
                    company {
                      _id
                      company_name
                    }
                    mentor {
                      _id
                      first_name
                      last_name
                      civility
                    }
                  }
                  job_description_id {
                    block_of_template_competences {
                      competence_templates {
                        competence_template_id {
                          _id
                        }
                        missions_activities_autonomy {
                          mission
                          activity
                          autonomy_level
                        }
                      }
                    }
                  }
                }
                test_groups {
                  _id
                  name
                  students {
                    student_id {
                      _id
                      first_name
                      last_name
                      civility
                      email
                    }
                    individual_test_correction_id {
                      _id
                    }
                  }
                }
              }
              corrector_assigned_for_final_retake {
                corrector_id {
                  _id
                  first_name
                  last_name
                }
                school_id {
                  _id
                }
                students {
                  _id
                  first_name
                  last_name
                  civility
                  specialization {
                    _id
                  }
                  job_description_id {
                    block_of_template_competences {
                      competence_templates {
                        competence_template_id {
                          _id
                        }
                        missions_activities_autonomy {
                          mission
                          activity
                          autonomy_level
                        }
                      }
                    }
                  }
                }
                test_groups {
                  _id
                  name
                  students {
                    student_id {
                      _id
                      first_name
                      last_name
                      civility
                      email
                    }
                    individual_test_correction_id {
                      _id
                    }
                  }
                }
              }
              jury_max
              president_jury_assigned {
                corrector_id {
                  _id
                }
                jury_member_id {
                  _id
                  jury_organization_id {
                    _id
                  }
                }
                students {
                  _id
                  first_name
                  last_name
                  civility
                  school {
                    _id
                  }
                  specialization {
                    _id
                  }
                }
                test_groups {
                  _id
                  name
                  students {
                    student_id {
                      _id
                      first_name
                      last_name
                      civility
                      email
                    }
                    individual_test_correction_id {
                      _id
                    }
                  }
                }
              }
              documents {
                document_name
                s3_file_name
              }
              group_test
              expected_documents {
                document_name
                is_for_all_student
                is_for_all_group
                document_user_type {
                  name
                  description
                }
              }
              parent_category {
                _id
              }
              correction_status
              correction_status_for_schools {
                school {
                  _id
                }
                correction_status
                modification_period_date {
                  date
                  time
                }
              }
              block_of_competence_condition_id {
                count_for_title_final_score
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          school_id: schoolId,
          test_id: testId,
        },
      })
      .pipe(map((resp) => resp.data['GetOneTest']));
  }

  getTestEvalPro(testId: string, student_id, school_id): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query getTestDataOfTestCorrection {
        GetOneTest(_id: "${testId}") {
          _id
          type
          name
          correction_type
          date_type
          block_type
          class_id {
            _id
          }
          date {
            date_utc
            time_utc
          }
          correction_grid {
            header {
              text
              fields {
                type
                value
                data_type
                align
              }
              directive_long
            }
            correction {
              show_as_list
              show_notation_marks
              show_direction_column
              directions_column_header
              show_number_marks_column
              number_marks_column_header
              show_letter_marks_column
              letter_marks_column_header
              show_phrase_marks_column
              phrase_marks_column_header
              comment_area
              comments_header
              comment_for_each_section
              comment_for_each_section_header
              comment_for_each_sub_section
              comment_for_each_sub_section_header
              show_final_comment
              final_comment_header
              display_final_total
              total_zone {
                display_additional_total
                additional_max_score
                decimal_place
              }
              show_penalty
              penalty_header
              show_bonus
              bonus_header
              show_elimination
              sections {
                title
                maximum_rating
                page_break
                sub_sections {
                  title
                  maximum_rating
                  direction
                }
                score_conversions {
                  _id
                  score
                  phrase
                  letter
                }
              }
              sections_evalskill {
                specialization_id
                academic_skill_competence_template_id {
                  _id
                  short_name
                }
                soft_skill_competence_template_id {
                  _id
                  short_name
                }
                academic_skill_block_template_id {
                  _id
                }
                soft_skill_block_template_id {
                  _id
                }
                ref_id
                is_selected
                specialization_id
                title
                maximum_rating
                page_break
                sub_sections {
                  academic_skill_criteria_of_evaluation_competence_id {
                    _id
                  }
                  soft_skill_criteria_of_evaluation_competence_id {
                    _id
                  }
                  academic_skill_competence_template_id {
                    _id
                  }
                  soft_skill_competence_template_id {
                    _id
                  }
                  ref_id
                  is_selected
                  title
                  direction
                  maximum_rating
                }
                score_conversions {
                  _id
                  score
                  phrase
                  letter
                  academic_skill_score_conversion_id {
                    _id
                    sign
                    score
                    phrase
                    letter
                  }
                  soft_skill_score_conversion_id {
                    _id
                    sign
                    score
                    phrase
                    letter
                  }
                }
              }
              penalties {
                title
                count
              }
              bonuses {
                title
                count
              }
            }
            footer {
              text
              text_below
              fields {
                value
                type
                data_type
                align
              }
            }
            group_detail {
              no_of_student
              header_text
              min_no_of_student
              group_allocation
            }
            orientation
          }
          corrector_assigned(school_id: "${school_id}", student_id: "${student_id}") {
            corrector_id {
              _id
              first_name
              last_name
            }
            school_id {
              _id
            }
          }
          corrector_assigned_for_final_retake {
            corrector_id {
              _id
              first_name
              last_name
            }
            school_id {
              _id
            }
          }
          jury_max
          documents {
            document_name
            s3_file_name
          }
          group_test
          expected_documents {
            document_name
            is_for_all_student
            is_for_all_group
            document_user_type {
              name
              description
            }
          }
          parent_category {
            _id
          }
          correction_status
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTest']));
  }

  getTask(taskId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query getTaskDataOfTestCorrection{
        GetOneTask(_id: "${taskId}") {
          _id
          type
          description
          user_selection {
            user_id {
              _id
              first_name
              last_name
            }
          }
          task_status
          due_date {
            date
            time
          }
          jury_member_id
          jury_id {
            _id
          }
          student_id {
            _id
            specialization {
              _id
            }
          }
          transcript_process_id {
            _id
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTask']));
  }

  getSchool(schoolId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query getSchoolDataOfTestCorrection {
        GetOneSchool(_id: "${schoolId}") {
          _id
          short_name
          long_name
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneSchool']));
  }

  getAllTestCorrection(testId, correctorId, schoolId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query getAllTestCorrection {
        GetAllTestCorrections(test_id: "${testId}", corrector_id: "${correctorId}", school_id: "${schoolId}") {
          _id
          corrector {
            _id
          }
          missing_copy
          is_justified
          student {
            _id
            first_name
            last_name
            civility
          }
          correction_grid {
            correction {
              total
              additional_total
              final_comment
            }
          }
          expected_documents {
            document_name
            document {
              s3_file_name
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTestCorrections']));
  }

  getAllTestCorrectionWithStudents(testId, studentIds, schoolId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query getAllTestCorrectionWithStudent($test_id: ID, $school_id: ID, $students_id: [ID]) {
            GetAllTestCorrections(test_id: $test_id, school_id: $school_id, students_id: $students_id) {
              _id
              is_saved
              is_saved_as_draft
              corrector {
                _id
              }
              missing_copy
              is_do_not_participated
              is_justified
              student {
                _id
                first_name
                last_name
                civility
              }
              correction_grid {
                correction {
                  sections {
                    sub_sections {
                      rating
                    }
                  }
                  sections_evalskill {
                    specialization_id
                    sub_sections {
                      rating
                    }
                  }
                  total
                  additional_total
                  final_comment
                }
              }
              expected_documents {
                document_name
                document {
                  _id
                  s3_file_name
                }
                is_uploaded
                validation_status
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          test_id: testId,
          school_id: schoolId,
          students_id: studentIds,
        },
      })
      .pipe(map((resp) => resp.data['GetAllTestCorrections']));
  }

  getAllTestCorrectionNonCorrector(testId, schoolId): Observable<TestCorrection[]> {
    return this.apollo
      .query({
        query: gql`
      query getAllTestCorrectionNonCorrector {
        GetAllTestCorrections(test_id: "${testId}", school_id: "${schoolId}") {
          _id
          is_saved
          is_saved_as_draft
          corrector {
            _id
          }
          missing_copy
          is_do_not_participated
          is_justified
          student {
            _id
            first_name
            last_name
            civility
          }
          correction_grid {
            correction {
              sections {
                sub_sections {
                  rating
                }
              }
              sections_evalskill {
                specialization_id
                sub_sections {
                  is_criteria_evaluated
                  rating
                }
              }
              total
              additional_total
              final_comment
            }
          }
          element_of_proof_doc {
            _id
          }
          expected_documents {
            document_name
            document {
              _id
              s3_file_name
            }
            validation_status
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTestCorrections']));
  }

  getAllTestCorrectionNonCorrectorByCross(testId, studentIds): Observable<TestCorrection[]> {
    return this.apollo
      .query({
        query: gql`
          query getAllCompleteTestCorrectionWithStudent($test_id: ID, $students_id: [ID]) {
            GetAllTestCorrections(test_id: $test_id, students_id: $students_id) {
              _id
              is_saved
              is_saved_as_draft
              corrector {
                _id
              }
              missing_copy
              is_do_not_participated
              is_justified
              student {
                _id
                first_name
                last_name
                civility
              }
              correction_grid {
                correction {
                  sections {
                    sub_sections {
                      rating
                    }
                  }
                  sections_evalskill {
                    specialization_id
                    sub_sections {
                      rating
                    }
                  }
                  total
                  additional_total
                  final_comment
                }
              }
              element_of_proof_doc {
                _id
              }
              expected_documents {
                document_name
                document {
                  _id
                  s3_file_name
                }
                validation_status
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          test_id: testId,
          students_id: studentIds,
        },
      })
      .pipe(map((resp) => resp.data['GetAllTestCorrections']));
  }

  getTestCorrection(testCorrectionId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query getOneStudentTestCorrection {
        GetOneTestCorrection(_id:"${testCorrectionId}") {
          _id
          is_saved
          is_saved_as_draft
          test {
            _id
          }
          corrector {
            _id
          }
          student {
            _id
          }
          school_id {
            _id
          }
          date {
            date_utc
            time_utc
          }
          final_retake
          missing_copy
          is_justified
          reason_for_missing_copy
          document_for_missing_copy {
            _id
            document_name
            s3_file_name
          }
          element_of_proof_doc {
            _id
            document_name
            s3_file_name
          }
          expected_documents {
            document_name
            document {
              _id
            }
            is_uploaded
            validation_status
          }
          jury_enabled_list {
            position
            state
          }
          correction_grid {
            header {
              fields {
                type
                label
                data_type
                align
                value {
                  date {
                    date
                    time
                  }
                  text
                  number
                  pfereferal
                  jury_member
                  long_text
                  signature
                  correcter_name
                  mentor_name
                }
              }
            }
            correction {
              sections {
                title
                rating
                comment
                sub_sections {
                  title
                  rating
                  score_conversion_id
                  comments
                  directions
                  marks_number
                  marks_letter
                  jurys {
                    name
                    marks
                    score_conversion_id
                  }
                }
              }
              sections_evalskill {
                ref_id
                is_selected
                title
                rating
                comment
                specialization_id
                academic_skill_competence_template_id {
                  _id
                }
                soft_skill_competence_template_id {
                  _id
                }
                academic_skill_block_template_id {
                  _id
                }
                soft_skill_block_template_id {
                  _id
                }
                sub_sections {
                  ref_id
                  is_selected
                  is_criteria_evaluated
                  title
                  rating
                  comments
                  directions
                  marks_number
                  marks_letter
                  score_conversion_id
                  academic_skill_criteria_of_evaluation_competence_id {
                    _id
                  }
                  soft_skill_criteria_of_evaluation_competence_id {
                    _id
                  }
                  academic_skill_competence_template_id {
                    _id
                  }
                  soft_skill_competence_template_id {
                    _id
                  }
                  jurys {
                    name
                    marks
                    score_conversion_id
                  }
                  multiple_dates {
                    date
                    marks
                    score_conversion_id
                    observation
                  }
                }
              }
              penalties {
                title
                rating
              }
              bonuses {
                title
                rating
              }
              elimination
              elimination_reason
              total
              total_jury_avg_rating
              additional_total
              final_comment
            }
            footer {
              fields {
                type
                label
                data_type
                align
                value{
                  date {
                    date
                    time
                  }
                  text
                  number
                  pfereferal
                  jury_member
                  long_text
                  signature
                  correcter_name
                  mentor_name
                }
              }
            }
          }
          is_do_not_participated
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTestCorrection']));
  }

  checkIfTestCorrectionExistsForStudent(studentId, testId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query checkIfTestCorrectionExistsForStudent {
        checkIfTestCorrectionExistsForStudent(studentId:"${studentId}", testId:"${testId}") {
          _id
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['checkIfTestCorrectionExistsForStudent']));
  }

  getAllCompleteTestCorrection(testId: string, schoolId?: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query getAllTestCorrection {
        GetAllTestCorrections(test_id: "${testId}", ${schoolId ? `school_id: "${schoolId}"` : ''}) {
          _id
          test {
            _id
          }
          corrector {
            _id
          }
          student {
            _id
          }
          school_id {
            _id
          }
          date {
            date_utc
            time_utc
          }
          final_retake
          missing_copy
          correction_grid {
            header {
              fields {
                type
                label
                data_type
                align
                value {
                  date {
                    date
                    time
                  }
                  text
                  number
                  pfereferal
                  jury_member
                  long_text
                  signature
                  correcter_name
                  mentor_name
                }
              }
            }
            correction {
              sections {
                title
                rating
                comment
                sub_sections {
                  title
                  rating
                  score_conversion_id
                  comments
                  directions
                  marks_number
                  marks_letter
                  jurys {
                    name
                    marks
                    score_conversion_id
                  }
                }
              }
              sections_evalskill {
                ref_id
                is_selected
                title
                rating
                comment
                specialization_id
                academic_skill_competence_template_id {
                  _id
                }
                soft_skill_competence_template_id {
                  _id
                }
                academic_skill_block_template_id {
                  _id
                }
                soft_skill_block_template_id {
                  _id
                }
                sub_sections {
                  ref_id
                  is_selected
                  is_criteria_evaluated
                  title
                  rating
                  score_conversion_id
                  comments
                  directions
                  marks_number
                  marks_letter
                  jurys {
                    name
                    marks
                    score_conversion_id
                  }
                  multiple_dates {
                    date
                    marks
                    score_conversion_id
                    observation
                  }
                }
              }
              penalties {
                title
                rating
              }
              bonuses {
                title
                rating
              }
              elimination
              elimination_reason
              total
              total_jury_avg_rating
              additional_total
              final_comment
            }
            footer {
              fields {
                type
                label
                data_type
                align
                value{
                  date {
                    date
                    time
                  }
                  text
                  number
                  pfereferal
                  jury_member
                  long_text
                  signature
                  correcter_name
                  mentor_name
                }
              }
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTestCorrections']));
  }

  getAllCompleteTestCorrectionCross(testId: string, students_id?: any[]): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query getAllTestCorrection($students_id: [ID]) {
        GetAllTestCorrections(test_id: "${testId}", students_id: $students_id) {
          _id
          test {
            _id
          }
          corrector {
            _id
          }
          student {
            _id
          }
          school_id {
            _id
          }
          date {
            date_utc
            time_utc
          }
          final_retake
          missing_copy
          correction_grid {
            header {
              fields {
                type
                label
                data_type
                align
                value {
                  date {
                    date
                    time
                  }
                  text
                  number
                  pfereferal
                  jury_member
                  long_text
                  signature
                  correcter_name
                  mentor_name
                }
              }
            }
            correction {
              sections {
                title
                rating
                comment
                sub_sections {
                  title
                  rating
                  score_conversion_id
                  comments
                  directions
                  marks_number
                  marks_letter
                  jurys {
                    name
                    marks
                    score_conversion_id
                  }
                }
              }
              sections_evalskill {
                ref_id
                is_selected
                title
                rating
                comment
                specialization_id
                academic_skill_competence_template_id {
                  _id
                }
                soft_skill_competence_template_id {
                  _id
                }
                academic_skill_block_template_id {
                  _id
                }
                soft_skill_block_template_id {
                  _id
                }
                sub_sections {
                  ref_id
                  is_selected
                  is_criteria_evaluated
                  title
                  rating
                  score_conversion_id
                  comments
                  directions
                  marks_number
                  marks_letter
                  jurys {
                    name
                    marks
                    score_conversion_id
                  }
                  multiple_dates {
                    date
                    marks
                    score_conversion_id
                    observation
                  }
                }
              }
              penalties {
                title
                rating
              }
              bonuses {
                title
                rating
              }
              elimination
              elimination_reason
              total
              total_jury_avg_rating
              additional_total
              final_comment
            }
            footer {
              fields {
                type
                label
                data_type
                align
                value{
                  date {
                    date
                    time
                  }
                  text
                  number
                  pfereferal
                  jury_member
                  long_text
                  signature
                  correcter_name
                  mentor_name
                }
              }
            }
          }
        }
      }
      `,
        variables: {
          students_id: students_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTestCorrections']));
  }

  getAllCompleteTestCorrectionWithStudent(testId, studentIds): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query getAllCompleteTestCorrectionWithStudent($test_id: ID, $students_id: [ID]) {
            GetAllTestCorrections(test_id: $test_id, students_id: $students_id) {
              _id
              test {
                _id
              }
              corrector {
                _id
              }
              student {
                _id
              }
              school_id {
                _id
              }
              date {
                date_utc
                time_utc
              }
              final_retake
              missing_copy
              correction_grid {
                header {
                  fields {
                    type
                    label
                    data_type
                    align
                    value {
                      date {
                        date
                        time
                      }
                      text
                      number
                      pfereferal
                      jury_member
                      long_text
                      signature
                      correcter_name
                      mentor_name
                    }
                  }
                }
                correction {
                  sections {
                    title
                    rating
                    comment
                    sub_sections {
                      title
                      rating
                      score_conversion_id
                      comments
                      directions
                      marks_number
                      marks_letter
                      jurys {
                        name
                        marks
                        score_conversion_id
                      }
                    }
                  }
                  sections_evalskill {
                    ref_id
                    is_selected
                    title
                    rating
                    comment
                    specialization_id
                    academic_skill_competence_template_id {
                      _id
                    }
                    soft_skill_competence_template_id {
                      _id
                    }
                    academic_skill_block_template_id {
                      _id
                    }
                    soft_skill_block_template_id {
                      _id
                    }
                    sub_sections {
                      ref_id
                      is_selected
                      is_criteria_evaluated
                      title
                      rating
                      score_conversion_id
                      comments
                      directions
                      marks_number
                      marks_letter
                      jurys {
                        name
                        marks
                        score_conversion_id
                      }
                      multiple_dates {
                        date
                        marks
                        score_conversion_id
                        observation
                      }
                    }
                  }
                  penalties {
                    title
                    rating
                  }
                  bonuses {
                    title
                    rating
                  }
                  elimination
                  elimination_reason
                  total
                  total_jury_avg_rating
                  additional_total
                  final_comment
                }
                footer {
                  fields {
                    type
                    label
                    data_type
                    align
                    value {
                      date {
                        date
                        time
                      }
                      text
                      number
                      pfereferal
                      jury_member
                      long_text
                      signature
                      correcter_name
                      mentor_name
                    }
                  }
                }
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          test_id: testId,
          students_id: studentIds,
        },
      })
      .pipe(map((resp) => resp.data['GetAllTestCorrections']));
  }

  createTestCorrection(payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateOneTestCorrection($test_correction_input: TestCorrectionInput) {
            createTestCorrection(test_correction_input: $test_correction_input) {
              _id
            }
          }
        `,
        variables: {
          test_correction_input: payload,
        },
      })
      .pipe(map((resp) => resp.data['createTestCorrection']));
  }

  updateTestCorrection(testCorrectionID: string, payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateOneTestCorrection($_id: ID!, $test_correction_input: TestCorrectionInput) {
            updateTestCorrection(_id: $_id, test_correction_input: $test_correction_input) {
              _id
            }
          }
        `,
        variables: {
          test_correction_input: payload,
          _id: testCorrectionID,
        },
      })
      .pipe(map((resp) => resp.data['updateTestCorrection']));
  }

  submitMarkEntry(test_id: string, school_id: string, task_id: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SubmitMarkEntry($test_id: ID!, $school_id: ID!, $task_id: ID, $is_submit_from_acad_kit: Boolean) {
            SubmitMarksEntry(
              test_id: $test_id
              school_id: $school_id
              task_id: $task_id
              is_submit_from_acad_kit: $is_submit_from_acad_kit
            ) {
              _id
            }
          }
        `,
        variables: {
          test_id: test_id,
          school_id: school_id,
          task_id: task_id,
          is_submit_from_acad_kit: task_id ? false : true,
        },
      })
      .pipe(map((resp) => resp.data['SubmitMarksEntry']));
  }

  submitMarkEntryAcadRec(test_id: string, school_id: string, task_id: string, pdf_results) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SubmitMarksEntryAcadRec(
            $test_id: ID!
            $school_id: ID!
            $task_id: ID
            $is_submit_from_acad_kit: Boolean
            $pdf_results: [PDFResultInput]
          ) {
            SubmitMarksEntry(
              test_id: $test_id
              school_id: $school_id
              task_id: $task_id
              is_submit_from_acad_kit: $is_submit_from_acad_kit
              pdf_results: $pdf_results
            ) {
              _id
            }
          }
        `,
        variables: {
          test_id: test_id,
          school_id: school_id,
          task_id: task_id,
          is_submit_from_acad_kit: task_id ? false : true,
          pdf_results,
        },
      })
      .pipe(map((resp) => resp.data['SubmitMarksEntry']));
  }

  submitMarkEntryMentor(test_id: string, school_id: string, pdf_results) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SubmitMarkEntry($test_id: ID!, $school_id: ID!, $pdf_results: [PDFResultInput]) {
            SubmitMarksEntry(test_id: $test_id, school_id: $school_id, pdf_results: $pdf_results) {
              _id
            }
          }
        `,
        variables: {
          test_id: test_id,
          school_id: school_id,
          pdf_results: pdf_results,
        },
      })
      .pipe(map((resp) => resp.data['SubmitMarksEntry']));
  }

  submitFinalRetakeMarkEntry(test_id: string, school_id: string, task_id: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SubmitMarksEntryForFinalRetake($test_id: ID!, $school_id: ID!, $task_id: ID, $is_submit_from_acad_kit: Boolean) {
            SubmitMarksEntryForFinalRetake(
              test_id: $test_id
              school_id: $school_id
              task_id: $task_id
              is_submit_from_acad_kit: $is_submit_from_acad_kit
            ) {
              _id
            }
          }
        `,
        variables: {
          test_id: test_id,
          school_id: school_id,
          task_id: task_id,
          is_submit_from_acad_kit: task_id ? false : true,
        },
      })
      .pipe(map((resp) => resp.data['SubmitMarksEntryForFinalRetake']));
  }

  SubmitMarksEntryForJury(test_id: string, school_id: string, task_id: string, jury_id: string, jury_member_id: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SubmitMarksEntryForJury(
            $test_id: ID
            $school_id: ID!
            $task_id: ID
            $jury_id: ID!
            $jury_member_id: ID!
            $is_submit_from_acad_kit: Boolean
          ) {
            SubmitMarksEntryForJury(
              test_id: $test_id
              school_id: $school_id
              task_id: $task_id
              is_submit_from_acad_kit: $is_submit_from_acad_kit
              jury_id: $jury_id
              jury_member_id: $jury_member_id
            ) {
              _id
            }
          }
        `,
        variables: { test_id, school_id, task_id, jury_id, jury_member_id, is_submit_from_acad_kit: task_id ? false : true },
      })
      .pipe(map((resp) => resp.data['SubmitMarksEntryForJury']));
  }

  markDoneTask(done_task_id: string, lang: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation doneTaskMarkEntry($done_task_id: ID!, $lang: String) {
            DoneAndStartNextTask(done_task_id: $done_task_id, lang: $lang) {
              _id
            }
          }
        `,
        variables: {
          done_task_id: done_task_id,
          lang: lang,
        },
      })
      .pipe(map((resp) => resp.data['DoneAndStartNextTask']));
  }

  SingleUploadDocumentExpected(file: File, docName: string, docTitle: string, docIndustry: string, taskId: string, lang: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SingleUploadDocumentExpected(
            $file: Upload!
            $docName: String
            $docTitle: String
            $docIndustry: String
            $taskId: ID
            $lang: String
          ) {
            SingleUploadDocumentExpected(
              file: $file
              document_name: $docName
              document_title: $docTitle
              document_industry: $docIndustry
              task_id: $taskId
              lang: $lang
            ) {
              _id
              s3_file_name
            }
          }
        `,
        variables: {
          file,
          docName,
          docTitle,
          docIndustry,
          taskId,
          lang,
        },
        context: {
          useMultipart: true,
        },
      })
      .pipe(map((resp) => resp.data['SingleUploadDocumentExpected']));
  }

  validateTestCorrection(test_id: string, school_id: string, pdfResults: any[]) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ValidateMarkEntry($test_id: ID!, $school_id: ID!, $pdfResults: [PDFResultInput]) {
            ValidateMarksEntry(test_id: $test_id, school_id: $school_id, pdf_results: $pdfResults) {
              _id
            }
          }
        `,
        variables: {
          test_id: test_id,
          school_id: school_id,
          pdfResults: pdfResults && pdfResults.length ? pdfResults : [],
        },
      })
      .pipe(map((resp) => resp.data['ValidateMarksEntry']));
  }

  validateFinalRetakeTestCorrection(test_id: string, school_id: string, pdfResults: any[]) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ValidateMarksEntryForFinalRetake($test_id: ID!, $school_id: ID!, $pdfResults: [PDFResultInput]) {
            ValidateMarksEntryForFinalRetake(test_id: $test_id, school_id: $school_id, pdf_results: $pdfResults) {
              _id
            }
          }
        `,
        variables: {
          test_id: test_id,
          school_id: school_id,
          pdfResults: pdfResults && pdfResults.length ? pdfResults : [],
        },
      })
      .pipe(map((resp) => resp.data['ValidateMarksEntryForFinalRetake']));
  }

  validateStudentMissingCopyForGroup(test_id: string, school_id: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ValidateStudentMissingCopyForGroup($test_id: ID!, $school_id: ID!) {
            ValidateStudentMissingCopy(test_id: $test_id, school_id: $school_id) {
              _id
            }
          }
        `,
        variables: {
          test_id: test_id,
          school_id: school_id,
        },
      })
      .pipe(map((resp) => resp.data['ValidateStudentMissingCopy']));
  }

  getAllGroup(testId: string, schoolId?: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query GetAllTestGroups {
        GetAllTestGroups(test_id: "${testId}", ${schoolId ? `school_id: "${schoolId}"` : ''}) {
          _id
          test {
            _id
          }
          name
          students {
            student_id {
              _id
              first_name
              last_name
              civility
              email
              school {
                short_name
              }
            }
            individual_test_correction_id {
              _id
              correction_grid {
                correction {
                  total
                  additional_total
                }
              }
            }
          }
          school {
            _id
            short_name
            long_name
          }
          status
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTestGroups']));
  }

  GetOneTestGroup(groupId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query GetOneTestGroup {
        GetOneTestGroup(_id: "${groupId}") {
          _id
          test {
            _id
          }
          name
          students {
            student_id {
              _id
              first_name
              last_name
              civility
              email
            }
            individual_test_correction_id {
              _id
            }
          }
          status
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTestGroup']));
  }

  getOneGroupTestCorrection(testCorrectionId): Observable<any> {
    return this.apollo
      .query({
        query: gql`query getOneGroupTestCorrection {
        GetOneGroupTestCorrection(_id: "${testCorrectionId}") {
          _id
          is_saved
          is_saved_as_draft
          test {
            _id
          }
          corrector {
            _id
          }
          school_id {
            _id
          }
          date {
            date_utc
            time_utc
          }
          test_group_id {
            _id
          }
          expected_documents {
            document_name
            document {
              _id
              document_name
              s3_file_name
              status
            }
            is_uploaded
            validation_status
          }
          missing_copy
          is_justified
          is_do_not_participated
          reason_for_missing_copy
          document_for_missing_copy {
            _id
            document_name
            s3_file_name
          }
          element_of_proof_doc {
            _id
            document_name
            s3_file_name
          }
          correction_grid {
            header {
              fields {
                type
                label
                data_type
                align
                value {
                  date {
                    date
                    time
                  }
                  text
                  number
                  pfereferal
                  jury_member
                  long_text
                  signature
                  correcter_name
                  mentor_name
                }
              }
            }
            correction {
              sections {
                title
                rating
                comment
                sub_sections {
                  title
                  rating
                  score_conversion_id
                  comments
                  directions
                  marks_number
                  marks_letter
                  jurys {
                    name
                    marks
                    score_conversion_id
                  }
                }
              }
              sections_evalskill {
                ref_id
                is_selected
                title
                rating
                comment
                academic_skill_competence_template_id {
                  _id
                }
                soft_skill_competence_template_id {
                  _id
                }
                academic_skill_block_template_id {
                  _id
                }
                soft_skill_block_template_id {
                  _id
                }
                sub_sections {
                  ref_id
                  is_selected
                  is_criteria_evaluated
                  title
                  rating
                  comments
                  directions
                  marks_number
                  marks_letter
                  score_conversion_id
                  academic_skill_criteria_of_evaluation_competence_id {
                    _id
                  }
                  soft_skill_criteria_of_evaluation_competence_id {
                    _id
                  }
                  academic_skill_competence_template_id {
                    _id
                  }
                  soft_skill_competence_template_id {
                    _id
                  }
                  jurys {
                    name
                    marks
                    score_conversion_id
                  }
                }
              }
              penalties {
                title
                rating
              }
              bonuses {
                title
                rating
              }
              elimination
              elimination_reason
              total
              total_jury_avg_rating
              additional_total
              final_comment
            }
            footer {
              fields {
                type
                label
                data_type
                align
                value {
                  date {
                    date
                    time
                  }
                  text
                  number
                  pfereferal
                  jury_member
                  long_text
                  signature
                  correcter_name
                  mentor_name
                }
              }
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneGroupTestCorrection']));
  }

  getAllGroupTestCorrection(test_id, school_id?): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query getAllGroupTestCorrections($test_id: ID, $school_id: ID) {
            GetAllGroupTestCorrections(test_id: $test_id, school_id: $school_id) {
              _id
              is_saved
              is_saved_as_draft
              test {
                _id
              }
              corrector {
                _id
              }
              school_id {
                _id
              }
              date {
                date_utc
                time_utc
              }
              test_group_id {
                _id
              }
              expected_documents {
                document_name
                document {
                  _id
                  document_name
                  s3_file_name
                  status
                }
                is_uploaded
                validation_status
              }
              missing_copy
              is_justified
              is_do_not_participated
              correction_grid {
                header {
                  fields {
                    type
                    label
                    data_type
                    align
                    value {
                      date {
                        date
                        time
                      }
                      text
                      number
                      pfereferal
                      jury_member
                      long_text
                      signature
                      correcter_name
                      mentor_name
                    }
                  }
                }
                correction {
                  sections {
                    title
                    rating
                    comment
                    sub_sections {
                      title
                      rating
                      score_conversion_id
                      comments
                      directions
                      marks_number
                      marks_letter
                      jurys {
                        name
                        marks
                        score_conversion_id
                      }
                    }
                  }
                  sections_evalskill {
                    ref_id
                    is_selected
                    title
                    rating
                    comment
                    academic_skill_competence_template_id {
                      _id
                    }
                    soft_skill_competence_template_id {
                      _id
                    }
                    academic_skill_block_template_id {
                      _id
                    }
                    soft_skill_block_template_id {
                      _id
                    }
                    sub_sections {
                      ref_id
                      is_selected
                      is_criteria_evaluated
                      title
                      rating
                      score_conversion_id
                      comments
                      directions
                      marks_number
                      marks_letter
                      jurys {
                        name
                        marks
                        score_conversion_id
                      }
                    }
                  }
                  penalties {
                    title
                    rating
                  }
                  bonuses {
                    title
                    rating
                  }
                  elimination
                  elimination_reason
                  total
                  total_jury_avg_rating
                  additional_total
                  final_comment
                }
                footer {
                  fields {
                    type
                    label
                    data_type
                    align
                    value {
                      date {
                        date
                        time
                      }
                      text
                      number
                      pfereferal
                      jury_member
                      long_text
                      signature
                      correcter_name
                      mentor_name
                    }
                  }
                }
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          test_id,
          school_id,
        },
      })
      .pipe(map((resp) => resp.data['GetAllGroupTestCorrections']));
  }

  createGroupTestCorrection(payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation createGroupTestCorrection($group_test_correction_input: GroupTestCorrectionInput) {
            CreateGroupTestCorrection(group_test_correction_input: $group_test_correction_input) {
              _id
            }
          }
        `,
        variables: {
          group_test_correction_input: payload,
        },
      })
      .pipe(map((resp) => resp.data['CreateGroupTestCorrection']));
  }

  updateGroupTestCorrection(testCorrectionID: string, payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation updateGroupTestCorrection($_id: ID!, $group_test_correction_input: GroupTestCorrectionInput) {
            UpdateGroupTestCorrection(_id: $_id, group_test_correction_input: $group_test_correction_input) {
              _id
            }
          }
        `,
        variables: {
          group_test_correction_input: payload,
          _id: testCorrectionID,
        },
      })
      .pipe(map((resp) => resp.data['UpdateGroupTestCorrection']));
  }

  updateJustifyTestCorrection(testCorrectionId: string, payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateOneTestCorrectionForJustification($_id: ID!, $test_correction_input: TestCorrectionInput) {
            updateTestCorrection(_id: $_id, test_correction_input: $test_correction_input) {
              _id
            }
          }
        `,
        variables: {
          test_correction_input: payload,
          _id: testCorrectionId,
        },
      })
      .pipe(map((resp) => resp.data['updateTestCorrection']));
  }

  getDocExpectedByTestCorrection(_id): Observable<any> {
    return this.apollo
      .query({
        query: gql`query getOneTestCorrection {
          GetOneTestCorrection(_id: "${_id}") {
            _id
            expected_documents {
              document_name
              document {
                _id
                s3_file_name
                moved_to_s3
                document_name
              }
              validation_status
            }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTestCorrection']));
  }

  checkProEvalUserAccess(user_id, test_id, school_id, student_id): Observable<any> {
    return this.apollo
      .query({
        query: gql`query {
          CheckProEvalUserAccess(user_id: "${user_id}", test_id: "${test_id}", school_id: "${school_id}", student_id: "${student_id}") {
            _id
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['CheckProEvalUserAccess']));
  }

  downloadMultipleDocumentsAsZip(docIds: string[], studentId: string): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation DownloadMultipleDocumentsAsZip($docIds: [ID], $studentId: ID) {
            DownloadMultipleDocumentsAsZip(docIds: $docIds, studentId: $studentId) {
              pathName
            }
          }
        `,
        variables: { docIds, studentId },
      })
      .pipe(map((resp) => resp.data['DownloadMultipleDocumentsAsZip']));
  }

  downloadMultipleDocumentsAsZipGroup(docIds: string[], groupId: string): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation DownloadMultipleDocumentsAsZip($docIds: [ID], $groupId: ID) {
            DownloadMultipleDocumentsAsZip(docIds: $docIds, groupId: $groupId) {
              pathName
            }
          }
        `,
        variables: { docIds, groupId },
      })
      .pipe(map((resp) => resp.data['DownloadMultipleDocumentsAsZip']));
  }

  getStudentForCrossCorrMarksEntry(taskId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query GetStudentForCrossCorrMarksEntry {
        GetStudentForCrossCorrMarksEntry(taskId: "${taskId}") {
          _id
          first_name
          last_name
          civility
          school {
            _id
            short_name
          }
          specialization {
            _id
          }
          job_description_id {
            block_of_template_competences {
              competence_templates {
                competence_template_id {
                  _id
                }
                missions_activities_autonomy {
                  mission
                  activity
                  autonomy_level
                }
              }
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetStudentForCrossCorrMarksEntry']));
  }

  submitMarkEntryCrossCorrection(taskId: string, rncpId: string, classId: string, lang, pdf_results) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SubmitCrossCorrection($taskId: ID!, $rncpId: ID!, $classId: ID, $lang: String, $pdf_results: [PDFResultInput]) {
            SubmitCrossCorrection(taskId: $taskId, rncpId: $rncpId, classId: $classId, lang: $lang, pdf_results: $pdf_results)
          }
        `,
        variables: {
          taskId,
          rncpId,
          classId,
          pdf_results,
          lang,
        },
      })
      .pipe(map((resp) => resp.data['SubmitCrossCorrection']));
  }

  getStudentsByTestAndSchoolForCrossCorrection(test_id, school_id): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetStudentsByTestAndSchool($test_id: ID!, $school_id: ID!) {
            GetStudentsByTestAndSchool(test_id: $test_id, school_id: $school_id) {
              _id
              first_name
              last_name
              school {
                _id
                short_name
              }
              specialization {
                _id
              }
              corrected_tests {
                correction {
                  correction_grid {
                    correction {
                      total
                    }
                  }
                  should_retake_test
                }
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          test_id,
          school_id,
        },
      })
      .pipe(map((resp) => resp.data['GetStudentsByTestAndSchool']));
  }

  submitMarkEntryCrossCorrectionFromAcadKit(rncpId: string, schoolId: string, testId: string, classId: string, lang, pdf_results) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SubmitCrossCorrection(
            $rncpId: ID!
            $schoolId: ID
            $testId: ID
            $classId: ID
            $lang: String
            $pdf_results: [PDFResultInput]
          ) {
            SubmitCrossCorrection(
              rncpId: $rncpId
              schoolId: $schoolId
              testId: $testId
              classId: $classId
              lang: $lang
              pdf_results: $pdf_results
            )
          }
        `,
        variables: {
          rncpId,
          schoolId,
          testId,
          classId,
          pdf_results,
          lang,
        },
      })
      .pipe(map((resp) => resp.data['SubmitCrossCorrection']));
  }

  validatesMarkEntryPDF(test_id: string, school_id: string, pdfResults?: any[], pdf_results_students_in_group?: any[]) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ValidateMarkEntry(
            $test_id: ID!
            $school_id: ID!
            $pdfResults: [PDFResultInput]
            $pdf_results_students_in_group: [PDFResultInput]
          ) {
            ValidateMarksEntry(
              test_id: $test_id
              school_id: $school_id
              pdf_results: $pdfResults
              pdf_results_students_in_group: $pdf_results_students_in_group
            ) {
              _id
            }
          }
        `,
        variables: {
          test_id: test_id,
          school_id: school_id,
          pdfResults: pdfResults && pdfResults.length ? pdfResults : [],
          pdf_results_students_in_group:
            pdf_results_students_in_group && pdf_results_students_in_group.length ? pdf_results_students_in_group : [],
        },
      })
      .pipe(map((resp) => resp.data['ValidateMarksEntry']));
  }

  validateFinalRetakeMarkEntryPDF(test_id: string, school_id: string, pdfResults?: any[], pdf_results_students_in_group?: any[]) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ValidateMarksEntryForFinalRetake(
            $test_id: ID!
            $school_id: ID!
            $pdfResults: [PDFResultInput]
            $pdf_results_students_in_group: [PDFResultInput]
          ) {
            ValidateMarksEntryForFinalRetake(
              test_id: $test_id
              school_id: $school_id
              pdf_results: $pdfResults
              pdf_results_students_in_group: $pdf_results_students_in_group
            ) {
              _id
            }
          }
        `,
        variables: {
          test_id: test_id,
          school_id: school_id,
          pdfResults: pdfResults && pdfResults.length ? pdfResults : [],
          pdf_results_students_in_group:
            pdf_results_students_in_group && pdf_results_students_in_group.length ? pdf_results_students_in_group : [],
        },
      })
      .pipe(map((resp) => resp.data['ValidateMarksEntryForFinalRetake']));
  }
}
