import { Injectable } from '@angular/core';
import gql from 'graphql-tag';

@Injectable({
  providedIn: 'root',
})
export class UserGqlService {
  constructor() {}

  queryGetAllUserType() {
    return gql`
      query {
        get_all_user_types {
          name
          _id
          role
        }
      }
    `;
  }
}
