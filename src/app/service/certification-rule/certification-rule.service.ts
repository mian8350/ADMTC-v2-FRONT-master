import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { CertificationRuleInput, CertificationRule } from 'app/title-rncp/conditions/certification-rule/certification-rule.model';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { BehaviorSubject, Observable } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root'
})
export class CertificationRuleService {
  private isSaved = new BehaviorSubject<Boolean>(false);
  private isChanged = new BehaviorSubject<Boolean>(false);

  setDataCertificationStatus(isSave: Boolean) {
    this.isSaved.next(isSave);
  }

  getDataCertificationStatus() {
    return this.isSaved.value;
  }
  setDataCertificationChanged(isChange: Boolean) {
    this.isChanged.next(isChange);
  }

  getDataCertificationChanged() {
    return this.isChanged.value;
  }
  constructor(
    private apollo: Apollo,
    private translate: TranslateService
  ) { }

  getCertificationRule(titleId: string, classId: string, is_for_preparation_center?: boolean, is_preview?: boolean): Observable<CertificationRule> {
    return this.apollo.query({
      query: gql`
        query GetOneCertificationRule(
          $titleId: ID, 
          $classId: ID, 
          $is_for_preparation_center: Boolean, 
          $is_preview: Boolean
        ) {
          GetOneCertificationRule(
            rncp_id: $titleId, 
            class_id: $classId, 
            is_for_preparation_center: $is_for_preparation_center,
            is_preview: $is_preview
          ) {
            _id
            title
            message
            header
            documents {
              s3_file_name
              document_name
              file_path
              document_id {
                _id
              }
            }
          }
        }
      `,
      variables: { titleId, classId, is_for_preparation_center, is_preview},
      fetchPolicy: 'network-only'
    })
    .pipe(map(resp => resp.data['GetOneCertificationRule']))
  }

  getCertificationRuleSentAdmissionTab(rncp_id: string, class_id: string, user_accepted_id?: string) {
    return this.apollo.query({
      query: gql`
      query getCertificationRuleSentAdmissionTab($rncp_id: ID, $class_id: ID, $user_accepted_id: ID) {
        GetOneCertificationRuleSent(rncp_id: $rncp_id, class_id: $class_id, user_accepted_id: $user_accepted_id) {
          _id
          title
          message
          documents {
            s3_file_name
            document_name
            file_path
            document_id {
              _id
            }
          }
          students_accepted {
            student_id {
              _id
            }
            acceptance_date {
              date_utc
              time_utc
            }
          }
        }
      }      
      `,
      variables: { rncp_id, class_id, user_accepted_id },
      fetchPolicy: 'network-only'
    })
    .pipe(map(resp => resp.data['GetOneCertificationRuleSent']))
  }

  getCertificationRuleSent(titleId: string, classId: string, user_id?: string): Observable<CertificationRule> {
    return this.apollo.query({
      query: gql`
        query GetOneCertificationRuleSent(
          $titleId: ID
          $classId: ID
          $user_id: ID
        ) {
          GetOneCertificationRuleSent(
            rncp_id: $titleId 
            class_id: $classId
            user_id: $user_id
          ) {
            _id
            title
            message
            documents {
              s3_file_name
              document_name
              file_path
              document_id {
                _id
              }
            }
            students_accepted {
              student_id {
                _id
              }
              acceptance_date {
                date_utc
                time_utc
              }
            }
          }
        }
      `,
      variables: { titleId, classId, user_id },
      fetchPolicy: 'network-only'
    })
    .pipe(map(resp => resp.data['GetOneCertificationRuleSent']))
  }

  getCertificationRuleSentStudentAdmissionTab(titleId: string, classId: string, user_accepted_id?: string): Observable<CertificationRule> {
    return this.apollo.query({
      query: gql`
        query getCertificationRuleSentStudentAdmissionTab(
          $titleId: ID
          $classId: ID
          $user_accepted_id: ID
        ) {
          GetOneCertificationRuleSent(
            rncp_id: $titleId 
            class_id: $classId
            user_accepted_id: $user_accepted_id
          ) {
            _id
            title
            message
            documents {
              s3_file_name
              document_name
              file_path
              document_id {
                _id
              }
            }
            students_accepted {
              student_id {
                _id
              }
              acceptance_date {
                date_utc
                time_utc
              }
            }
          }
        }
      `,
      variables: { titleId, classId, user_accepted_id },
      fetchPolicy: 'network-only'
    })
    .pipe(map(resp => resp.data['GetOneCertificationRuleSent']))
  }

  getCertificationRuleSentWithStudent(titleId: string, classId: string, studentId: string): Observable<CertificationRule> {
    return this.apollo.query({
      query: gql`
        query {
          GetOneCertificationRuleSent(rncp_id: "${titleId}", class_id: "${classId}", user_id: "${studentId}") {
            _id
            title
            message
            documents {
              s3_file_name
              document_name
              file_path
              document_id {
                _id
              }
            }
          }
        }
      `,
      fetchPolicy: 'network-only'
    })
    .pipe(map(resp => resp.data['GetOneCertificationRuleSent']))
  }

  getAllCertificationRule(): Observable<CertificationRule> {
    return this.apollo.query({
      query: gql`
        query {
          GetAllCertificationRule() {
            _id
            title
            message
            documents {
              file_name
              file_path
            }
          }
        }
      `,
      fetchPolicy: 'network-only'
    })
    .pipe(map(resp => resp.data['GetOneCertificationRule']))
  }

  createCertificationRuleSent(certRule: any): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation SentCertificationRule($dataInput: CertificationRuleSentInput) {
          SentCertificationRule(certification_rule_sent_input: $dataInput) {
            _id
          }
        }
      `,
      variables: {dataInput: certRule}
    })
    .pipe(map(resp => resp.data['SentCertificationRule']))
  }

  downloadDocumentAsZipFile(rncpId: string, classId: string, is_for_preparation_center?: boolean): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
      mutation DownloadDocumentAsZipFile(
        $rncpId: ID!
        $classId: ID!
        $is_for_preparation_center: Boolean
      ) {
        DownloadDocumentAsZipFile (
          rncpId: $rncpId
          classId: $classId
          is_for_preparation_center: $is_for_preparation_center
        ) {
          pathName
        }
      }
      `,
      variables: { rncpId, classId, is_for_preparation_center }
    })
    .pipe(map(resp => resp.data['DownloadDocumentAsZipFile']))
  }

  studentAcceptCertificationRule(rncp_id: any, class_id: any, user_id: any): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation {
          StudentAcceptanceCertificationRule(rncp_id: "${rncp_id}", class_id: "${class_id}", user_id: "${user_id}") {
            _id
            students_accepted {
              student_id {
                _id
              }
              acceptance_date {
                date_utc
                time_utc
              }
            }
          }
        }
      `,
    })
    .pipe(map(resp => resp.data['StudentAcceptanceCertificationRule']))
  }

  createCertificationRule(certRule: CertificationRuleInput): Observable<CertificationRule> {
    return this.apollo.mutate({
      mutation: gql`
        mutation CreateCertificationRule($dataInput: CertificationRuleInput) {
          CreateCertificationRule(certification_rule_input: $dataInput) {
            _id
          }
        }
      `,
      variables: {dataInput: certRule}
    })
    .pipe(map(resp => resp.data['CreateCertificationRule']))
  }

  updateCertificationRule(certId: string, certRule: CertificationRuleInput): Observable<CertificationRule> {
    return this.apollo.mutate({
      mutation: gql`
        mutation UpdateCertificationRule($id: ID!, $dataInput: CertificationRuleInput) {
          UpdateCertificationRule(_id: $id, certification_rule_input: $dataInput) {
            _id
          }
        }
      `,
      variables: {
        id: certId,
        dataInput: certRule
      }
    })
    .pipe(map(resp => resp.data['UpdateCertificationRule']))
  }
  
  downloadDocumentCertificationRule(rncp_id, class_id, student_id): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation DownloadDocumentCertificationRule($rncp_id: ID, $class_id: ID, $student_id: ID, $lang: String) {
          DownloadDocumentCertificationRule(rncp_id: $rncp_id, class_id: $class_id, student_id: $student_id, lang: $lang)
        }
      `,
      variables: {
        rncp_id, 
        class_id, 
        student_id, 
        lang: this.translate.currentLang,
      }
    })
    .pipe(map(resp => resp.data['DownloadDocumentCertificationRule']))
  }

  createCertificationRuleForPC(certification_rule_input) {
    return this.apollo.mutate({
      mutation: gql`
        mutation CreateCertificationRule($certification_rule_input: CertificationRuleInput) {
          CreateCertificationRule(certification_rule_input: $certification_rule_input) {
            _id
            class_id {
              name
            }
          }
        }
      `,
      variables: {certification_rule_input: certification_rule_input}
    })
    .pipe(map(resp => resp.data['CreateCertificationRule']))
  }

  updateCertificationRuleForPC(_id, certification_rule_input) {
    return this.apollo.mutate({
      mutation: gql`
        mutation UpdateCertificationRule($_id: ID!, $certification_rule_input: CertificationRuleInput) {
          UpdateCertificationRule(_id: $_id, certification_rule_input: $certification_rule_input) {
            _id
            class_id {
              name
            }
          }
        }
      `,
      variables: {
        _id: _id,
        certification_rule_input: certification_rule_input
      }
    })
    .pipe(map(resp => resp.data['UpdateCertificationRule']))
  }

  deleteCertificationRuleForPC(_id) {
    return this.apollo.mutate({
      mutation: gql`
        mutation DeleteCertificationRule($_id: ID!) {
          DeleteCertificationRule(_id: $_id) {
            _id
          }
        }
      `,
      variables: {
        _id: _id
      }
    })
    .pipe(map(resp => resp.data['DeleteCertificationRule']))
  }

  getAllCertificationRules(filter): Observable<any> {
    return this.apollo.query({
      query: gql`
        query GetAllCertificationRules($filter: CertificationRuleInput) {
          GetAllCertificationRules(filter: $filter) {
            _id
            documents {
              document_name
              s3_file_name
              file_path
            }
            rncp_id {
              _id
            }
            class_id {
              _id
            }
            header
            name
            is_for_preparation_center
            is_published
          }
        }
      `,
      fetchPolicy: 'network-only',
      variables: {
        filter
      }
    })
    .pipe(map(resp => resp.data['GetAllCertificationRules']))
  }

  sentCertificationRule(certRule: any): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation SentCertificationRule($dataInput: CertificationRuleSentInput) {
          SentCertificationRule(certification_rule_sent_input: $dataInput) {
            _id
          }
        }
      `,
      variables: {dataInput: certRule}
    })
    .pipe(map(resp => resp.data['SentCertificationRule']))
  }

  getOneCertificationRuleSentForPC(rncp_id, class_id, user_id, school_id): Observable<any> {
    return this.apollo.query({
      query: gql`
        query GetOneCertificationRuleSent($rncp_id: ID, $class_id: ID, $user_id: ID, $school_id: ID){
          GetOneCertificationRuleSent(rncp_id: $rncp_id, class_id: $class_id, user_id: $user_id, school_id: $school_id) {
            _id
            rncp_id {
                _id
                short_name
                long_name
              }
              class_id {
                _id
                name
              }
              name
              header
              is_for_preparation_center
              documents {
                s3_file_name
                document_name
                file_path
              }
            }
        }
      `,
      fetchPolicy: 'network-only',
      variables: {
        rncp_id,
        class_id,
        user_id,
        school_id,
      }
    })
    .pipe(map(resp => resp.data['GetOneCertificationRuleSent']))
  }

  userAcceptanceCertificationRule(rncp_id, class_id, user_id, school_id, certification_rule_sent_id) {
    return this.apollo.mutate({
      mutation: gql`
        mutation UserAcceptanceCertificationRule($rncp_id: ID, $class_id: ID, $user_id: ID, $school_id: ID, $certification_rule_sent_id: ID) {
          UserAcceptanceCertificationRule(rncp_id: $rncp_id, class_id: $class_id, user_id: $user_id, school_id: $school_id, certification_rule_sent_id: $certification_rule_sent_id) {
            _id
            users_accepted {
              user_id {
                _id
                first_name
                last_name
              }
              acceptance_date {
                date_utc
                time_utc
              }
            }
          }
        }
      `,
      variables: {
        rncp_id,
        class_id,
        user_id,
        school_id,
        certification_rule_sent_id
      }
    })
    .pipe(map(resp => resp.data['UserAcceptanceCertificationRule']))
  }

  createUpdateCertificationRule(certification_rules_input: any): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation CreateUpdateCertificationRule($certification_rules_input: [CertificationRuleInput]) {
          CreateUpdateCertificationRule(certification_rules_input: $certification_rules_input) {
            _id
            class_id {
              name
            }
          }
        }
      `,
      variables: {
        certification_rules_input
      }
    })
    .pipe(map(resp => resp.data['CreateUpdateCertificationRule']))
  }

  getAllUserCertificationPC(rncp_title, class_id, pagination, filter, sorting): Observable<any> {
    return this.apollo.query({
      query: gql`
        query GetAllUserCertificationPC(
            $rncp_title: ID,
            $class_id: ID,
            $pagination: PaginationInput, 
            $filter: UserCertificationPCFilterInput,
            $sorting: UserCertificationPCSortingInput
          ) {
          GetAllUserCertificationPC(rncp_title: $rncp_title, class_id: $class_id, pagination: $pagination, filter: $filter, sorting: $sorting) {
            user_id {
              _id
              civility
              first_name
              last_name
            }
            school_short_name
            pc_at
            status
            signed_at
            count_document
          }
        }
      `,
      fetchPolicy: 'network-only',
      variables: {
        rncp_title,
        class_id,
        pagination,
        filter,
        sorting
      }
    })
    .pipe(map(resp => resp.data['GetAllUserCertificationPC']))
  }
}
