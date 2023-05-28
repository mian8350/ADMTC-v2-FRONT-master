import { Injectable } from '@angular/core';
import gql from 'graphql-tag';
import { Observable } from 'rxjs';
import { Apollo } from 'apollo-angular';
import { map } from 'rxjs/operators';
@Injectable({
  providedIn: 'root',
})
export class FormFollowUpService {
  constructor(private apollo: Apollo) { }

  getAllFormFollowUp(filter, sorting, pagination): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllFormFollowUp($pagination: PaginationInput, $sorting: FormFollowUpSortingInput) {
            GetAllFormFollowUp(filter : {${filter}}, sorting : $sorting, pagination : $pagination) {
              count_document
              class_id {
                _id
                name
                parent_rncp_title {
                  _id
                  long_name
                  short_name
                  admtc_dir_responsible {
                    _id
                    first_name
                    last_name
                    civility
                  }
                }
              }
              form_builder_id {
                _id
                form_builder_name
                template_type
              }
            }
          }
        `,
        variables: {
          pagination,
          sorting: sorting ? sorting : null,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllFormFollowUp']));
  }

  getRncpClass(filter, pagination): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllFormFollowUp($pagination: PaginationInput) {
            GetAllFormFollowUp(filter : {${filter}},  pagination : $pagination) {
              count_document
              class_id {
                _id
                name
                parent_rncp_title {
                  _id
                  long_name
                  short_name
                  admtc_dir_responsible {
                    _id
                    first_name
                    last_name
                  }
                }
              }
              form_builder_id {
                _id
                form_builder_name
                template_type
              }
            }
          }
        `,
        variables: {
          pagination
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllFormFollowUp']));
  }

  getAllStudentAdmissionProcesses(pagination, filter, sorting): Observable<any> {
    return this.apollo
      .query({
        query: gql`query GetAllStudentAdmissionProcesses($pagination: PaginationInput, $filter:StudentAdmissionProcessFilterInput, $sorting: StudentAdmissionProcessSortingInput)  {
        GetAllStudentAdmissionProcesses (
          filter: $filter
          pagination: $pagination,
          sorting: $sorting 
          ) {
          student_id {
            _id
            first_name
            last_name
            civility
            admission_process_id {
              _id
            }
            user_id {
              _id
              first_name
              last_name
            }
          }
          school_id {
            _id
            short_name
            long_name
          }
          rncp_title_id {
            _id
            short_name
            long_name
            admtc_dir_responsible{
              _id
              first_name
              last_name
              civility
            }
          }
          steps{
            _id
            step_title
						step_type
            step_status
          }
          class_id{
            _id
            name
          }
          count_document
        }
      }`,
        variables: {
          pagination: pagination,
          sorting: sorting ? sorting : {},
          filter: filter
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudentAdmissionProcesses']));
  }
  getAllFormProcesses(pagination, filter, sorting): Observable<any> {
    return this.apollo
      .query({
        query: gql`query GetAllFormProcesses($pagination: PaginationInput, $filter: FormProcessFilterInput, $sorting: FormProcessSortingInput)  {
        GetAllFormProcesses (
          filter: $filter
          pagination: $pagination,
          sorting: $sorting 
          ) {
            _id
          student_id {
            _id
            first_name
            last_name
            civility
            admission_process_id {
              _id
            }
            user_id {
              _id
              first_name
              last_name
            }
          }
          school_id {
            _id
            short_name
            long_name
          }
          rncp_title_id {
            _id
            short_name
            long_name
            admtc_dir_responsible{
              _id
              first_name
              last_name
              civility
            }
          }
          form_builder_id {
            _id
            steps {
              _id
              step_title
            }
          }
          steps{
            _id
            step_title
						step_type
            step_status
            is_only_visible_based_on_condition
            form_builder_step{
              _id
            }
          }
          class_id{
            _id
            name
          }
          admission_status
          created_at
          count_document
          user_id {
            _id
            first_name
            last_name
            civility
          }
        }
      }`,
        variables: {
          pagination: pagination,
          sorting: sorting ? sorting : {},
          filter: filter
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllFormProcesses']));
  }

  getStepTypeNotificationMessage(form_builder_id): Observable<any> {
    return this.apollo
      .query({
        query: gql`query GetAllStepNotificationsAndMessages($form_builder_id: ID!) {
          GetAllStepNotificationsAndMessages(form_builder_id: $form_builder_id) {
            _id
            type
            trigger_condition
          }
        }`,
        variables: {
          form_builder_id: form_builder_id,
          
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStepNotificationsAndMessages']));
  }

  sendReminderFormProcess(form_process_id, lang) {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation {
          SendReminderFormProcess(form_process_id: "${form_process_id}", lang:"${lang}")
        }
        `,
      })
      .pipe(map((resp) => resp.data['SendReminderFormProcess']));
  }

}
