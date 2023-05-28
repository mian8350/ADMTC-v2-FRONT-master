import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PreviousCourseService {
  constructor(private apollo: Apollo) {}

  getStudentPreviousCourse(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query {
        GetOneStudent(_id: "${studentId}") {
          previous_courses_id {
            rncp_id {
              _id
              short_name
              long_name
              rncp_level
            }
            school_id {
              _id
              short_name
            }
            class_id {
              _id
              name
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }
}
