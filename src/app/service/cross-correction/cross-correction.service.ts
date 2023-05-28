import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Cacheable } from 'ngx-cacheable';
import { map } from 'rxjs/operators';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { CrossCorrection } from 'app/cross-correction/cross-correction.model';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class CrossCorrectionService {
  private AllStudentsSource = new BehaviorSubject<any[]>([]);
  public AllStudentsLists$ = this.AllStudentsSource.asObservable();

  isStudentAllAssigned = false;

  constructor(private httpClient: HttpClient, private apollo: Apollo, private translate: TranslateService) {}

  setAllStudentsLists(data) {
    this.AllStudentsSource.next(data);
  }

  resetAllStudentsLists() {
    this.AllStudentsSource.next([]);
  }

  getValuetAllStudentsLists() {
    this.AllStudentsSource.getValue();
  }

  @Cacheable()
  getCrossCorrectionStudents(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/cross-correction-students.json');
  }

  @Cacheable()
  getCrossCorrectionSchools(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/cross-correction-schools.json');
  }

  getTaskCrossCorrectionList(correction_type, pagination, sorting, rncp_title_id?, class_id?, keyword?) {
    return this.apollo
      .query({
        query: gql`
          query GetAllTests(
            $correction_type: EnumCorrectionType
            $pagination: PaginationInput
            $rncp_title_id: ID
            $class_id: ID
            $keyword: String
            $sorting: TestSorting
          ) {
            GetAllTests(
              correction_type: $correction_type
              pagination: $pagination
              rncp_title_id: $rncp_title_id
              class_id: $class_id
              keyword: $keyword
              sorting: $sorting
            ) {
              _id
              name
              parent_rncp_title {
                _id
                short_name
              }
              class_id {
                _id
                name
              }
              count_document
            }
          }
        `,
        variables: {
          correction_type,
          pagination,
          sorting,
          rncp_title_id,
          class_id,
          keyword,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTests']));
  }

  getCrossCorrectionList(filter): Observable<CrossCorrection[]> {
    return this.apollo
      .query({
        query: gql`
          query GetAllCrossCorrectors($filter: crossCorrectionFilter) {
            GetAllCrossCorrectors(filter: $filter) {
              _id
              scholar_season_id {
                _id
              }
              test_id {
                _id
              }
              rncp_title_id {
                _id
              }
              class_id {
                _id
              }
              student_id {
                _id
                first_name
                last_name
              }
              school_origin_id {
                _id
                short_name
              }
              school_correcting_id {
                _id
                short_name
              }
              school_correcting_corrector_id {
                _id
                first_name
                last_name
              }
              status
              count_document
            }
          }
        `,
        variables: {
          filter,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllCrossCorrectors']));
  }

  getCorrectorsAndStudents(rncpId, testId, classId) {
    return this.apollo
      .query({
        query: gql`
          query GetCorrectorsAndStudents($rncpId: ID, $testId: ID, $classId: ID) {
            GetCorrectorsAndStudents(rncpId: $rncpId, testId: $testId, classId: $classId) {
              acadDirDetails {
                _id
                first_name
                last_name
              }
              schoolDetails {
                _id
                short_name
              }
              studentsAssignToSchoolCorrecting {
                _id
                first_name
                last_name
              }
            }
          }
        `,
        variables: {
          rncpId,
          testId,
          classId,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetCorrectorsAndStudents']));
  }

  GetDataForCrossCorrectorCsv(rncp_id, test_id) {
    return this.apollo
      .query({
        query: gql`
          query {
            GetDataForCrossCorrectorCsv(rncp_id: "${rncp_id}", test_id: "${test_id}") {
                rncp
                school_origin
                school_origin_address
                school_correcting
                school_correcting_address
                students_count_school_origin
                students_count_school_correcting
              }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetDataForCrossCorrectorCsv']));
  }

  getSchoolsAndCrossCorrectors(rncpId, classId) {
    return this.apollo
      .query({
        query: gql`
          query GetSchoolsAndCrossCorrectors($rncpId: ID!, $classId: ID!) {
            GetSchoolsAndCrossCorrectors(rncpId: $rncpId, classId: $classId) {
              school {
                _id
                short_name
              }
            }
          }
        `,
        variables: {
          rncpId,
          classId,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetSchoolsAndCrossCorrectors']));
  }

  getSchoolsCorrectingDropdown(rncpId, classId) {
    return this.apollo
      .query({
        query: gql`
          query GetSchoolsAndCrossCorrectors($rncpId: ID!, $classId: ID!) {
            GetSchoolsAndCrossCorrectors(rncpId: $rncpId, classId: $classId) {
              school {
                _id
                short_name
              }
              cross_correctors {
                _id
                first_name
                last_name
              }
            }
          }
        `,
        variables: {
          rncpId,
          classId,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetSchoolsAndCrossCorrectors']));
  }

  getAllTitlesDropdown() {
    return this.apollo
      .query({
        query: gql`
          query GetAllTitles {
            GetAllTitles {
              _id
              short_name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getAllClassesDropdown() {
    return this.apollo
      .query({
        query: gql`
          query GetAllClasses {
            GetAllClasses {
              _id
              name
              parent_rncp_title {
                _id
                short_name
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllClasses']));
  }

  getAllTestsDropdown() {
    return this.apollo
      .query({
        query: gql`
          query GetAllTests {
            GetAllTests {
              _id
              name
              class_id {
                _id
                name
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTests']));
  }

  CreateAndUpdateCrossCorrector(payload: any[]) {
    return this.apollo.mutate({
      mutation: gql`
        mutation CreateAndUpdateCrossCorrector($payload: [CrossCorrectorInput]) {
          CreateAndUpdateCrossCorrector(cross_corrector_input: $payload) {
            _id
          }
        }
      `,
      variables: { payload },
    });
  }

  sendNotificationButton(rncpId, classId, testId) {
    return this.apollo.mutate({
      mutation: gql`
        mutation SendNotificationButton($rncpId: ID!, $classId: ID!, $testId: ID!, $lang: String) {
          SendNotificationButton(rncpId: $rncpId, classId: $classId, testId: $testId, lang: $lang)
        }
      `,
      variables: { rncpId, classId, testId, lang: this.translate.currentLang },
    });
  }

  getCrossCorrectorDropdown(filter) {
    return this.apollo
      .query({
        query: gql`
          query GetAllCrossCorrectors($filter: crossCorrectionFilter) {
            GetAllCrossCorrectors(filter: $filter) {
              school_correcting_corrector_id {
                _id
                civility
                first_name
                last_name
              }
            }
          }
        `,
        variables: {
          filter,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllCrossCorrectors']));
  }

  getSchoolOriginDropdown(filter) {
    return this.apollo
      .query({
        query: gql`
          query GetAllCrossCorrectors($filter: crossCorrectionFilter) {
            GetAllCrossCorrectors(filter: $filter) {
              school_origin_id {
                _id
                short_name
              }
            }
          }
        `,
        variables: {
          filter,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllCrossCorrectors']));
  }

  getCorrectorCsv(filter) {
    return this.apollo
      .query({
        query: gql`
          query GetAllCrossCorrectors($filter: crossCorrectionFilter) {
            GetAllCrossCorrectors(filter: $filter) {
              school_correcting_id {
                short_name
                school_address {
                  address1
                  postal_code
                  city
                }
              }
            }
          }
        `,
        variables: {
          filter,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllCrossCorrectors']));
  }

  getSchoolCorrectingDropdown(filter) {
    return this.apollo
      .query({
        query: gql`
          query GetAllCrossCorrectors($filter: crossCorrectionFilter) {
            GetAllCrossCorrectors(filter: $filter) {
              school_correcting_id {
                _id
                short_name
              }
            }
          }
        `,
        variables: {
          filter,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllCrossCorrectors']));
  }

  getOneTest(_id) {
    return this.apollo
      .query({
        query: gql`
          query GetOneTest($_id: ID!) {
            GetOneTest(_id: $_id) {
              _id
              name
              parent_rncp_title {
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
        variables: {
          _id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTest']));
  }

  getAllStudentCrossCorrectionFirstTime(titleId, classId) {
    return this.apollo
      .query({
        query: gql`
          query GetAllStudents {
            GetAllStudents(rncp_title: "${titleId}", current_class: "${classId}", status: active_pending) {
              _id
              school {
                _id
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getCorrectorsAndStudentsSendCopies(rncpId, testId, classId, taskId) {
    return this.apollo
      .query({
        query: gql`
          query GetCorrectorsAndStudents($rncpId: ID, $testId: ID, $classId: ID, $taskId: ID) {
            GetCorrectorsAndStudents(rncpId: $rncpId, testId: $testId, classId: $classId, taskId: $taskId) {
              acadDirDetails {
                _id
                first_name
                last_name
                civility
              }
              schoolDetails {
                _id
                short_name
                long_name
              }
              studentsAssignToSchoolCorrecting {
                _id
                first_name
                last_name
                school {
                  _id
                  short_name
                }
                civility
              }
            }
          }
        `,
        variables: {
          rncpId,
          testId,
          classId,
          taskId,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetCorrectorsAndStudents']));
  }

  markSendCopiesAsDoneAndCreateMarkEntry(taskId, actionTaken) {
    return this.apollo.mutate({
      mutation: gql`
        mutation MarkSendCopiesAsDoneAndCreateMarkEntry($taskId: ID!, $actionTaken: String, $lang: String) {
          MarkSendCopiesAsDoneAndCreateMarkEntry(taskId: $taskId, actionTaken: $actionTaken, lang: $lang)
        }
      `,
      variables: { taskId, actionTaken, lang: this.translate.currentLang },
    });
  }

  getValidateSendCopies(taskId) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ValidateSendCopies($taskId: ID!) {
            ValidateSendCopies(taskId: $taskId) {
              adminCertifier {
                _id
                first_name
                last_name
                civility
              }
              school {
                _id
                short_name
                long_name
                school_address {
                  address1
                  address2
                  postal_code
                  city
                  region
                }
              }
            }
          }
        `,
        variables: { taskId },
      })
      .pipe(map((resp) => resp.data['ValidateSendCopies']));
  }

  markSendCopiesValidateAsDone(taskId, actionTaken) {
    return this.apollo.mutate({
      mutation: gql`
        mutation MarkSendCopiesValidateAsDone($taskId: ID!, $actionTaken: String) {
          MarkSendCopiesValidateAsDone(taskId: $taskId, actionTaken: $actionTaken)
        }
      `,
      variables: { taskId, actionTaken },
    });
  }
}
