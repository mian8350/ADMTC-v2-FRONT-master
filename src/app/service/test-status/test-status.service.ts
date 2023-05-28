import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class TestStatusService {

  constructor(
    private httpClient: HttpClient,
    private apollo: Apollo,
    private translate: TranslateService
  ) { }

  getRncpTitlesDropdownForTestStatus(): Observable<any[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
        query GetRncpTitlesDropdownForTestStatus {
          GetAllTitles {
            _id
            short_name
            year_of_certification
          }
        }
      `,
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getClassForTestStatus(rncpId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query getClassForTestStatus {
          GetAllClasses(rncp_id: "${rncpId}") {
            _id
            name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllClasses']));
  }

  getSchoolTestStatus(rncpId: string, classId: string, pagination, sorting, filter): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query getSchoolTestStatus ($rncp_title_ids: [ID], $class_id: ID, $pagination: PaginationInput, $sorting: SchoolSorting, $filter: SchoolFilterInput) {
          GetAllSchools(rncp_title_ids: $rncp_title_ids, class_id: $class_id, pagination: $pagination, sorting: $sorting, filter: $filter) {
            _id
            short_name
            count_document
            test_correction_statuses(rncp_id: "${rncpId}", class_id: "${classId}") {
              test_id {
                _id
                name
              }
              correction_status
            }
          }
        }
      `,
        variables: {
          rncp_title_ids: [rncpId],
          class_id: classId,
          pagination,
          sorting,
          filter: filter ? filter : null
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllSchools']));
  }

  getSchoolTestStatusDropdown(rncpId: string, classId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query getSchoolTestStatus ($rncp_title_ids: [ID], $class_id: ID) {
          GetAllSchools(rncp_title_ids: $rncp_title_ids, class_id: $class_id) {
            _id
            short_name
          }
        }
      `,
        variables: {
          rncp_title_ids: [rncpId],
          class_id: classId
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllSchools']));
  }
}
