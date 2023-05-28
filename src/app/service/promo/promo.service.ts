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
export class PromoService {
  constructor(private httpClient: HttpClient, private apollo: Apollo) {}

  getAllPromosi(pagination, sorting?: any, filter?: any): Observable<any[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllPromos($pagination: PaginationInput, $sorting: PromoSorting) {
            GetAllPromos(pagination: $pagination, sorting: $sorting, ${filter}) {
              _id
              ref
              title
              sub_title
              description
              for_login_page
              for_set_password_page
              for_forgot_password_page
              image_url
              status
              count_document
            }
          }
        `,
        variables: {
          pagination,
          sorting,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllPromos']));
  }

  getAllPromo(): Observable<any[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query {
            GetAllPromos {
              _id
              ref
              title
              sub_title
              description
              for_login_page
              for_set_password_page
              for_forgot_password_page
              image_url
              status
              count_document
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllPromos']));
  }

  getOnePromo(promoId): Observable<any[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query {
            GetOnePromo(_id: "${promoId}") {
              _id
              ref
              title
              sub_title
              description
              for_login_page
              for_set_password_page
              for_forgot_password_page
              image_url
              status
              count_document
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOnePromo']));
  }

  deletePromo(promoId): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation {
          DeletePromo(_id: "${promoId}") {
              _id
              title
            }
          }
        `,
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['DeletePromo']));
  }

  createPromo(payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreatePromo($promo_input: PromoInput) {
            CreatePromo(promo_input: $promo_input) {
              _id
              title
            }
          }
        `,
        variables: {
          promo_input: payload,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['CreatePromo']));
  }

  updatePromo(promoId, payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation UpdatePromo($promo_input: PromoInput) {
          UpdatePromo(_id: "${promoId}", promo_input: $promo_input) {
              _id
              title
            }
          }
        `,
        variables: {
          promo_input: payload,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['UpdatePromo']));
  }

  // @Cacheable()
  // getPromos(): Observable<any[]> {
  //   return this.httpClient.get<any[]>('assets/data/promos.json');
  // }
}
