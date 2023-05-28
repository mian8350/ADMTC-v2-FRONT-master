import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import {
  ExpertiseBlockDropdown,
  JuryDecisionParameterPayload,
  JuryDecisionParameterResponseData,
  SubjectDropdown,
  TestDropdown,
} from 'app/title-rncp/conditions/jury-decision-parameter/jury-decision-parameter.model';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { BlockSubjectTestIdAndName, BlockTemplate } from 'app/test/test-creation/test-creation.model';

@Injectable({
  providedIn: 'root',
})
export class ConditionsService {
  constructor(private apollo: Apollo) {}

  saveConditionForAward(expertisePayload: any, classId: string, titleId: string) {
    return this.apollo.mutate({
      mutation: gql`
          mutation CreateExpertise($expertiseInput: [ExpertiseInput]) {
              CreateUpdateExpertise(class_id: "${classId}", rncp_title_id: "${titleId}", expertise_input: $expertiseInput) {
                  _id
                  block_of_experise
                  class_id {
                      _id
                  }
                  rncp_title {
                      _id
                  }
                  description
              }
          }
      `,
      variables: {
        expertiseInput: expertisePayload,
      },
    });
  }

  // Remove Expertise
  removeExpertise(expertiseId: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation {
              DeleteExpertise(_id: "${expertiseId}") {
                  _id
              }
          }
      `,
      })
      .pipe(
        map((resp) => {
          return resp.data;
        }),
      );
  }

  // Remove expertise
  removeSubject(subjectId: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation {
              DeleteSubject(_id: "${subjectId}") {
                  _id
              }
          }
      `,
      })
      .pipe(
        map((resp) => {
          return resp.data;
        }),
      );
  }

  // Remove test
  removeSubjectTest(testId: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation {
              DeleteSubjectTest(_id: "${testId}") {
                  _id
              }
          }
      `,
      })
      .pipe(
        map((resp) => {
          return resp.data;
        }),
      );
  }

  // get the condition
  getConditionsByTitleAndClass(rncpId: string, classId: string) {
    return this.apollo
      .query({
        query: gql`
          query {
              GetAllExpertises(class_id: "${classId}", rncp_title_id: "${rncpId}") {
                  _id
                  block_of_experise
                  count_for_title_final_score
                  expertise_credit
                  expertise_credit
                  field_index
                  description
                  is_specialization
                  max_point
                  method_of_evaluation
                  min_score
                  order
                  page_break
                  transversal_block
                  is_retake_by_block
                  selected_block_retake {
                      _id
                  }
                  specialization {
                      _id
                      name
                  }
                  status
                  subjects {
                      _id
                      coefficient
                      count_for_title_final_score
                      credit
                      is_pfe
                      is_specialization
                      max_point
                      minimum_score_for_certification
                      order
                      page_break
                      status
                      subject_name
                      is_subject_transversal_block
                      subject_transversal_block_id {
                          _id
                      }
                      subject_tests {
                          _id
                          auto_mark
                          evaluation
                          initial_subject_id {
                              _id
                          }
                          initial_subject_test {
                              _id
                          }
                          is_different_condition
                          is_retake_test
                          is_specialization
                          never_visible_for_student
                          minimum_score
                          parallel_intake
                          retake_when_absent_justified
                          retake_when_absent_not_justified
                          type
                          weight
                          visible_before_decision_jury
                          use_best_mark
                          selected_test_retake_block {
                              _id
                          }
                          score_not_calculated_for_retake_block
                          test_is_not_retake_able_in_retake_block
                          retake_subject_test {
                              _id
                              evaluation
                              type
                              weight
                          }
                      }
                  }
              }
          },
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllExpertises'];
        }),
      );
  }

  getConditionTypes(): { value: string; label: string }[] {
    return [
      { value: 'pass', label: 'pass' },
      // { value: 'pass_with_jury_kindness', label: 'pass_with_jury_kindness' },
      { value: 'retake', label: 'retake' },
      { value: 'fail', label: 'fail' },
      { value: 'eliminated', label: 'eliminee' },
    ];
  }

  getCorrelations(): { value: string; label: string }[] {
    return [
      { value: 'AND', label: 'AND' },
      { value: 'OR', label: 'OR' },
    ];
  }

  getValidationTypes(): { value: string; label: string }[] {
    return [
      { value: 'overall_score', label: 'Overall Score' },
      { value: 'block', label: 'JURY_PARAM.BLOCK' },
      { value: 'subject', label: 'JURY_PARAM.SUBJECT' },
      { value: 'evaluation', label: 'JURY_PARAM.TEST' },
      // { value: 'average_block', label: 'JURY_PARAM.AVG_BLOCK' },
      // { value: 'average_subject', label: 'JURY_PARAM.AVG_SUBJECT' },
      // { value: 'average_test', label: 'JURY_PARAM.AVG_TEST' },
    ];
  }

  getValidationTypesBlock(): { value: string; label: string }[] {
    return [
      { value: 'block', label: 'JURY_PARAM.BLOCK' },
      { value: 'subject', label: 'JURY_PARAM.SUBJECT' },
      { value: 'evaluation', label: 'JURY_PARAM.TEST' },
      // { value: 'average_block', label: 'JURY_PARAM.AVG_BLOCK' },
      // { value: 'average_subject', label: 'JURY_PARAM.AVG_SUBJECT' },
      // { value: 'average_test', label: 'JURY_PARAM.AVG_TEST' },
    ];
  }

  getParameterSigns(): string[] {
    return ['>', '<', '>=', '<=', '='];
  }

  getParameterSignPassFail(): { value: string; label: string }[] {
    return [
      { value: 'less_than', label: '<' },
      { value: 'less_than_or_equal', label: '<=' },
      { value: 'equal', label: '=' },
      { value: 'more_than_or_equal', label: '>=' },
      { value: 'more_than', label: '>' },
    ];
  }

  getExpertiseDropdownData(titleId: string, classId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllBlockOfCompetenceConditions(
                  rncp_title_id: "${titleId}"
                  class_id: "${classId}"
                  count_for_title_final_score: true
              ) {
                  _id
                  block_of_competence_condition
                  subjects {
                    _id
                    subject_name
                    evaluations {
                      _id
                      evaluation
                    }
                 }
              }
          }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllBlockOfCompetenceConditions']));
  }

  getSubjectDropdownData(titleId: string, classId: string): Observable<SubjectDropdown[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllSubjects (filter: {rncp_title_id: "${titleId}", class_id: "${classId}", count_for_title_final_score: true}) {
              _id
              subject_name
              evaluations {
                _id
                evaluation
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllSubjects']));
  }

  getTestDropdownData(titleId: string, classId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllEvaluations (filter: {rncp_title_id: "${titleId}", class_id: "${classId}", count_for_title_final_score: true}) {
              _id
              evaluation
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllEvaluations']));
  }

  getSubjectBlockDropdownData(titleId: string, classId: string, blockId: string): Observable<SubjectDropdown[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllSubjects (filter: {rncp_title_id: "${titleId}", class_id: "${classId}", count_for_title_final_score: true, block_of_competence_condition_id: "${blockId}"}) {
              _id
              subject_name
              evaluations {
                _id
                evaluation
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllSubjects']));
  }

  getTestBlockDropdownData(titleId: string, classId: string, blockId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllEvaluations (filter: {rncp_title_id: "${titleId}", class_id: "${classId}", count_for_title_final_score: true, block_of_competence_condition_id: "${blockId}"}) {
              _id
              evaluation
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllEvaluations']));
  }

  getJuryDecisionParameter(titleId: string, classId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
              GetOneJuryDecisionParameter(
                  rncp_id: "${titleId}"
                  class_id: "${classId}"
              ) {
                  _id
                  decision_parameters {
                      condition_type
                      condition_name
                      parameters {
                          correlation
                          validation_type
                          block_parameters {
                              _id
                              block_of_competence_condition
                          }
                          subject_parameters {
                              _id
                              subject_name
                          }
                          evaluation_parameters {
                              _id
                              evaluation
                          }
                          sign
                          score
                      }
                  }
              }
          }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneJuryDecisionParameter']));
  }

  createJuryDecisionParameter(payload: JuryDecisionParameterPayload): Observable<{ _id: string }> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateJuryDecisionParameter($inputData: JuryDecisionParameterInput) {
            CreateJuryDecisionParameter(jury_decision_parameter_input: $inputData) {
              _id
            }
          }
        `,
        variables: {
          inputData: payload,
        },
      })
      .pipe(map((resp) => resp.data['CreateJuryDecisionParameter']));
  }

  updateJuryDecisionParameter(decisionParamId: string, payload: JuryDecisionParameterPayload): Observable<{ _id: string }> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateJuryDecisionParameter($id: ID!, $inputData: JuryDecisionParameterInput) {
            UpdateJuryDecisionParameter(_id: $id, jury_decision_parameter_input: $inputData) {
              _id
            }
          }
        `,
        variables: {
          inputData: payload,
          id: decisionParamId,
        },
      })
      .pipe(map((resp) => resp.data['UpdateJuryDecisionParameter']));
  }

  /* Duplicate title parameters*/
  duplicateParametersTitle(payload: {
    rncp_title_id: string;
    class_id: string;
    rncp_title_destination: string;
    class_id_destination: string;
  }) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation {
            DuplicateExpertise(
              rncp_title_id: "${payload.rncp_title_id}",
              class_id: "${payload.class_id}",
              rncp_title_destination: "${payload.rncp_title_destination}",
              class_id_destination: "${payload.class_id_destination}"
            ) {
              _id
              block_of_experise
            }
          }
      `,
      })
      .pipe(
        map((resp) => {
          return resp.data['DuplicateExpertise'];
        }),
      );
  }

  // Update class max point
  updateClassMaxPoint(classId: string, payload: { expertise_max_point: number; expertise_mark_point_status: boolean }) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateClass($id: ID!, $inputData: ClassInput) {
            UpdateClass(_id: $id, class_input: $inputData) {
              _id
              expertise_max_point
              expertise_mark_point_status
            }
          }
        `,
        variables: {
          inputData: payload,
          id: classId,
        },
      })
      .pipe(
        map((resp) => {
          return resp.data['UpdateClass'];
        }),
      );
  }

  getBlockSubjectTestIdAndName(titleId: string, classId: string): Observable<BlockSubjectTestIdAndName[]> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetAllExpertises(rncp_title_id: "${titleId}", class_id: "${classId}") {
            _id
            block_of_experise
            subjects {
              _id
              subject_name
              subject_tests {
                _id
                evaluation
                weight
                type
              }
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllExpertises']));
  }

  getBlockCondition(titleId: string, classId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetAllBlockOfCompetenceConditions(rncp_title_id:"${titleId}", class_id:"${classId}"){
          _id
          block_of_competence_condition
          subjects {
            _id
            subject_name
            coefficient
            evaluations {
              _id
              evaluation
              weight
              type
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllBlockOfCompetenceConditions']));
  }

  getFilteredBlockCondition(titleId: string, classId: string, testNotCreated: boolean, testId?: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetAllBlockOfCompetenceConditions(
          rncp_title_id:"${titleId}",
          class_id:"${classId}",
          test_id:"${testId}",
          test_not_created:${testNotCreated}
        ){
          _id
          is_specialization
          is_retake_by_block
          is_specialization
          block_of_competence_condition
          block_type
          block_of_tempelate_competence {
            _id
            ref_id
            name
            competence_templates_id {
              _id
              ref_id
              name
              criteria_of_evaluation_templates_id {
                _id
                ref_id
                name
              }
            }
          }
          block_of_tempelate_soft_skill {
            _id
            ref_id
            name
            competence_softskill_templates_id {
              _id
              ref_id
              name
              criteria_of_evaluation_softskill_templates_id {
                _id
                ref_id
                name
              }
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllBlockOfCompetenceConditions']));
  }

  getFilteredSubjectCondition(filter): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllSubjects($filter: FilterSubjectInput) {
            GetAllSubjects(filter: $filter) {
              _id
              subject_name
              coefficient
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          filter: filter,
        },
      })
      .pipe(map((resp) => resp.data['GetAllSubjects']));
  }

  getFilteredEvaluationCondition(filter): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllEvaluations($filter: FilterEvaluationInput) {
            GetAllEvaluations(filter: $filter) {
              _id
              evaluation
              weight
              type
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          filter: filter,
        },
      })
      .pipe(map((resp) => resp.data['GetAllEvaluations']));
  }

  getBlockAcademicTemplateAutoProEval(titleId: string, classId: string): Observable<BlockTemplate[]> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetAllBlockOfCompetenceTemplates(rncp_title_id:"${titleId}", class_id:"${classId}"){
          _id
          ref_id
          name
          is_test_created
          competence_templates_id {
            _id
            ref_id
            name
            criteria_of_evaluation_templates_id {
              _id
              ref_id
              name
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllBlockOfCompetenceTemplates']));
  }

  getBlockSoftSkillTemplateAutoProEval(titleId: string, classId: string): Observable<BlockTemplate[]> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetAllSoftSkillBlockTemplates(rncp_title_id:"${titleId}", class_id:"${classId}"){
          _id
          ref_id
          name
          is_test_created
          competence_softskill_templates_id {
            _id
            ref_id
            name
            criteria_of_evaluation_softskill_templates_id {
              _id
              ref_id
              name
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllSoftSkillBlockTemplates']));
  }

  validationDataFormControls;
  hasValidationDataChanged() {
    if (!this.validationDataFormControls) {
      return false;
    }
    if (this.validationDataFormControls.length) {
      return this.validationDataFormControls.some(formControl => {
        return formControl.dirty;
      });
    } else {
      return this.validationDataFormControls.dirty;
    }
  }

  validationAllowUserSave;
  isConditionFormChanged;
}
