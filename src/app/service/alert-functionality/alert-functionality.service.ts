import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cacheable } from 'ngx-cacheable';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { Apollo } from 'apollo-angular';

@Injectable({
  providedIn: 'root',
})
export class AlertService {
  constructor(private httpClient: HttpClient, private apollo: Apollo) {}

  @Cacheable()
  getAlert(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/alert-functionality.json');
  }
  // @Cacheable()
  GetAllAlertFunctionalities(pagination, filter, sorting): Observable<any[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllAlertFunctionalities(
            $pagination: PaginationInput
            $filter: AlertFunctionalityFilter
            $sorting: AlertFunctionalitySorting
          ) {
            GetAllAlertFunctionalities(pagination: $pagination, filter: $filter, sorting: $sorting) {
              _id
              published_date {
                date
                time
              }
              name
              recipients {
                _id
                name
              }
              message
              creator {
                _id
              }
              published
              required_response
              count_document
              button1
              button2
              responses {
                user_id {
                  _id
                  civility
                  first_name
                  last_name
                  entities {
                    type {
                      _id
                      name
                    }
                    school {
                      short_name
                    }
                  }
                }
                response
                responsed_at {
                  date
                  time
                }
              }
            }
          }
        `,
        variables: {
          pagination,
          filter,
          sorting: sorting ? sorting : null,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllAlertFunctionalities']));
  }
  getAlertUserTypes(show_student_type?): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
          query GetAllUserTypes($show_student_type: EnumShowStudent) {
            GetAllUserTypes(show_student_type: $show_student_type) {
              _id
              name
              name_with_entity
              entity
            }
          }
        `,
        variables: {
          show_student_type: 'include_student',
        },
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllUserTypes'];
        }),
      );
  }
  createAlertFunctionality(alert_functionality_input): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateAlertFunctionality($alert_functionality_input: AlertFunctionalityInput) {
            CreateAlertFunctionality(alert_functionality_input: $alert_functionality_input) {
              _id
            }
          }
        `,
        variables: {
          alert_functionality_input,
        },
      })
      .pipe(map((resp) => resp));
  }

  updateAlertFunctionality(_id, alert_functionality_input): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateAlertFunctionality($_id: ID!, $alert_functionality_input: AlertFunctionalityInput) {
            UpdateAlertFunctionality(_id: $_id, alert_functionality_input: $alert_functionality_input) {
              _id
            }
          }
        `,
        variables: {
          _id,
          alert_functionality_input,
        },
      })
      .pipe(map((resp) => resp));
  }

  DeleteAlertFunctionality(_id): Observable<any[]> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation {
            DeleteAlertFunctionality(_id: "${_id}") {
              _id
            }
          }
        `,
      })
      .pipe(map((resp) => resp.data['DeleteAlertFunctionality']));
  }
  getAlertFunctionalityForUser(user_type_id): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
          query GetAlertFunctionalityForUser($user_type_id: ID) {
            GetAlertFunctionalityForUser(user_type_id: $user_type_id) {
              _id
              name
              message
              required_response
              button1
              button2
              published_date {
                date
                time
              }
            }
          }
        `,
        variables: {
          user_type_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAlertFunctionalityForUser'];
        }),
      );
  }
  giveResponseToAlertFunctionality(_id, response_input): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation GiveResponseToAlertFunctionality($_id: ID!, $response_input: ResponseInput) {
            GiveResponseToAlertFunctionality(_id: $_id, response_input: $response_input) {
              _id
            }
          }
        `,
        variables: {
          _id,
          response_input,
        },
      })
      .pipe(map((resp) => resp.data['GiveResponseToAlertFunctionality']));
  }
}
