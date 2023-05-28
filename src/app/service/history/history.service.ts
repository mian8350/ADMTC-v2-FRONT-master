import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cacheable } from 'ngx-cacheable';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { NotificationHistory } from 'app/models/notification-history.model';
import * as moment from 'moment';

@Injectable({
  providedIn: 'root'
})
export class HistoryService {

  constructor(private httpClient: HttpClient, private apollo: Apollo) {}

  getNotificationHistories(pagination, sortValue, filter, date_thirty_day?): Observable<NotificationHistory[]> {
    return this.apollo.query({
      query: gql`
      query GetAllNotificationHistories($page: PaginationInput, $sort: NotificationHistorySorting, $date_thirty_day: EnumFilterDateThirtyDay, $offset: Int) {
        GetAllNotificationHistories(
          pagination: $page
          sorting: $sort
          ${filter}
          date_thirty_day: $date_thirty_day
          offset: $offset
        ) {
          count_document
          _id
          sent_date {
            date_utc
            time_utc
          }
          notification_reference
          notification_subject
          notification_message
          rncp_titles {
            _id
            short_name
          }
          schools {
            _id
            short_name
          }
          from {
            last_name
            first_name
            civility
          }
          to {
            last_name
            first_name
            civility
          }
          subject {
            subject_name
          }
          test {
            name
          }
        }
      }
      `,
      variables: {
        page: pagination,
        sort: sortValue ? sortValue : {},
        date_thirty_day,
        offset: moment().utcOffset()
      },
      fetchPolicy: 'network-only'
    })
    .pipe(map((resp) => resp.data['GetAllNotificationHistories']));
  }

  GetNotificationReferences(): Observable<string[]> {
    return this.apollo.query({
      query: gql`
      query {
        GetNotificationReferences
      }
      `,
      fetchPolicy: 'network-only'
    })
    .pipe(map((resp) => resp.data['GetNotificationReferences']));
  }

  @Cacheable()
  getHistory(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/history.json');
  }

}
