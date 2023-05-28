import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserPermissionService {
  constructor(private apollo: Apollo) {}

  getAllUserPermissions(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllUserPermissionTableMatrix {
            GetAllUserPermissionTable {
              menus {
                menu
                sub_menu {
                  name
                  actions {
                    name
                    permissions_actions {
                      user_type_id {
                        _id
                      }
                      user_type_name
                      show_perm
                      edit_perm
                      home_page
                    }
                  }
                  permissions_menu {
                    user_type_id {
                      _id
                    }
                    user_type_name
                    show_perm
                    edit_perm
                    home_page
                  }
                }
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUserPermissionTable']));
  }

  getAllUserTypes(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllUserTypesForPermissions {
            GetAllUserTypes {
              _id
              name
              entity
              role
            }
          }
        `,
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllUserTypes'];
        }),
      );
  }
}
