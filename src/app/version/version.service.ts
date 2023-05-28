import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VersionService {

  constructor(
    private apollo: Apollo,
  ) { }

  getBackendVersion(): Observable<string> {
    return this.apollo.watchQuery({
      query: gql`
        query {
          GetVersion
        }
      `,
      fetchPolicy: 'network-only'
    })
    .valueChanges.pipe(map(resp => resp.data['GetVersion']));
  }
}
