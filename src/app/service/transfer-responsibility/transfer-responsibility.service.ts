import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { TransferResponsibilityPayload } from 'app/shared/components/transfer-responsibility-dialog/transfer-responsibility-model';
import gql from 'graphql-tag';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TransferResponsibilityService {
  constructor(private apollo: Apollo, private http: HttpClient) {}

  getSchoolsForTransferDropdown(): Observable<{ _id: string; short_name: string }[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query getSchoolDropdownTransferResponsibility {
            GetAllSchools(sorting: { short_name: asc }) {
              _id
              short_name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllSchools']));
  }

  getTitleDropdownBySchool(school_id): Observable<{ _id: string; short_name: string }[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query getTitleDropdownTransferResponsibility($school_id: [String]) {
            GetAllTitles(school_id: $school_id) {
              _id
              short_name
            }
          }
        `,
        variables: {
          school_id: school_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getClassDropdownByTitle(rncp_id): Observable<{ _id: string; short_name: string }[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query getTitleDropdownTransferResponsibility($rncp_id: String) {
            GetAllClasses(rncp_id: $rncp_id) {
              _id
              name
            }
          }
        `,
        variables: {
          rncp_id: rncp_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllClasses']));
  }

  getUserFromDropdown(
    school: string[],
    title: string[],
    class_id: string,
    user_type: string[],
  ): Observable<{ _id: string; first_name: string; last_name: string; civility: string }[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query getUserFromDropdownForTransferResponsibility($school: [ID!], $title: [ID!], $class_id: ID, $user_type: [ID!]) {
            GetAllUsers(school: $school, title: $title, class_id: $class_id, user_type: $user_type) {
              _id
              first_name
              last_name
              civility
            }
          }
        `,
        variables: {
          school: school,
          title: title,
          class_id: class_id,
          user_type: user_type,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getUserToDropdown(
    schoolId: string,
    usersFor: string,
    transferFromId: string,
  ): Observable<{ _id: string; first_name: string; last_name: string; civility: string }[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query getUserToDropdownForTransferResponsibility($schoolId: ID!, $usersFor: EnumTransferResp, $transferFromId: ID!) {
            GetUsersForTransferResponsibility(schoolId: $schoolId, usersFor: $usersFor, transferFromId: $transferFromId) {
              _id
              first_name
              last_name
              civility
            }
          }
        `,
        variables: {
          schoolId: schoolId,
          usersFor: usersFor,
          transferFromId: transferFromId
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetUsersForTransferResponsibility']));
  }

  submitTransferResponsibility(payload: TransferResponsibilityPayload) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SubmitTransferResponsibility($lang: String!, $schoolId: ID!, $rncpId: ID!, $userTypeId: ID!, $transferFor: EnumTransferResp, $transfer_from: ID!, $transfer_to: ID!, $classId: ID) {
            TransferResponsibility(lang: $lang, schoolId: $schoolId, rncpId: $rncpId, userTypeId: $userTypeId, transferFor: $transferFor, transfer_from: $transfer_from, transfer_to: $transfer_to, classId: $classId) {
              _id
            }
          }
        `,
        variables: {
          lang: payload.lang,
          schoolId: payload.schoolId,
          rncpId: payload.rncpId,
          userTypeId: payload.userTypeId,
          transferFor: payload.transferFor,
          transfer_from: payload.transfer_from,
          transfer_to: payload.transfer_to,
          classId: payload.classId
        },
      })
      .pipe(map((resp) => resp.data['TransferResponsibility']));
  }
}
