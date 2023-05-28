import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Cacheable } from 'ngx-cacheable';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { Apollo } from 'apollo-angular';

@Injectable({
  providedIn: 'root',
})
export class TutorialService {
  public tutorialData: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public dataEditTutorial: BehaviorSubject<any> = new BehaviorSubject<any>(null);
  public tutorialStep: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public currentStep: BehaviorSubject<number> = new BehaviorSubject<number>(0);
  public juryName: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  setTutorialStep(value: number) {
    this.tutorialStep.next(value);
  }

  setCurrentStep(value: number) {
    this.currentStep.next(value);
  }

  setTutorialView(value: any) {
    this.tutorialData.next(value);
  }

  setTutorialEdit(value: any) {
    this.dataEditTutorial.next(value);
  }

  setJuryName(value: any) {
    this.juryName.next(value);
  }

  constructor(private httpClient: HttpClient, private apollo: Apollo) { }

  @Cacheable()
  getModuleJson(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/module-menu.json');
  }

  GetOneInAppTutorial(filter): Observable<any[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query {
            GetOneInAppTutorial(${filter}) {
              _id
              module
              sub_modules {
                sub_module
                items {
                  title
                  description
                }
              }
              scenario_checklist_url
              video_presentation
              video_url
              qa_checklist_url
              is_published
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneInAppTutorial']));
  }

  DeleteInAppTutorial(tutorialId): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation {
          DeleteInAppTutorial(_id: "${tutorialId}") {
              _id
            }
          }
        `,
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['DeleteInAppTutorial']));
  }

  CreateInAppTutorial(payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateInAppTutorial($in_app_tutorial_input: InAppTutorialInput!) {
            CreateInAppTutorial(in_app_tutorial_input: $in_app_tutorial_input) {
              _id
            }
          }
        `,
        variables: {
          in_app_tutorial_input: payload,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['CreateInAppTutorial']));
  }

  UpdateInAppTutorial(tutorialId, payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation UpdateInAppTutorial($in_app_tutorial_input: InAppTutorialInput) {
          UpdateInAppTutorial(_id: "${tutorialId}", in_app_tutorial_input: $in_app_tutorial_input) {
              _id
            }
          }
        `,
        variables: {
          in_app_tutorial_input: payload,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['UpdateInAppTutorial']));
  }

  getAllTutorial(pagination, sorting?: any, filter?: any, user_type_id?: any): Observable<any[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllTutorials($pagination: PaginationInput, $sorting: TutorialSorting) {
            GetAllTutorials(pagination: $pagination, sorting: $sorting, ${filter}) {
              _id
              title
              description
              link
              message
              user_type_ids {
                _id
                name
              }
              status
              count_document
            }
          }
        `,
        variables: {
          pagination,
          sorting,
          user_type_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTutorials']));
  }

  getAllTutorialPC(pagination, sorting?: any, filter?: any, user_type_id?: any): Observable<any[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllTutorials($pagination: PaginationInput, $sorting: TutorialSorting) {
            GetAllTutorials(pagination: $pagination, sorting: $sorting, ${filter}, filterForPCAndCertifier: pc) {
              _id
              title
              description
              link
              message
              user_type_ids {
                _id
                name
              }
              status
              count_document
            }
          }
        `,
        variables: {
          pagination,
          sorting,
          user_type_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTutorials']));
  }

  getTutorialNonOperator(pagination, sorting?: any, filter?: any, user_type_id?: any): Observable<any[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllTutorials($pagination: PaginationInput, $sorting: TutorialSorting, $user_type_id: ID) {
            GetAllTutorials(pagination: $pagination, sorting: $sorting, ${filter}, user_type_id: $user_type_id) {
              _id
              title
              description
              link
              message
              user_type_ids {
                _id
                name
              }
              status
              count_document
            }
          }
        `,
        variables: {
          pagination,
          sorting,
          user_type_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTutorials']));
  }

  checkIfModuleExitsForUsertype(module, user_types?: any): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query CheckIfModuleExitsForUsertype($module: String, $user_types: [ID]) {
            CheckIfModuleExitsForUsertype(module: $module, user_types: $user_types)
          }
        `,
        variables: {
          module,
          user_types,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['CheckIfModuleExitsForUsertype']));
  }

  getOneTutorial(tutorialId): Observable<any[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query {
            GetOneTutorial(_id: "${tutorialId}") {
              _id
              title
              description
              link
              message
              user_type_ids {
                _id
                name
              }
              status
              count_document
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTutorial']));
  }

  getOperatorName(): Observable<any[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query {
            GetAppPermission {
              group_name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAppPermission']));
  }

  deleteTutorial(tutorialId): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation {
            DeleteTutorial(_id: "${tutorialId}") {
              _id
              title
            }
          }
        `,
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['DeleteTutorial']));
  }

  sendTutorial(loginType, payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation SendTutorial($send_tutorial_input: TutorialSendInput, $lang: String!) {
          SendTutorial(send_tutorial_input: $send_tutorial_input, user_login_type: "${loginType}", lang: $lang)
          }
        `,
        variables: {
          send_tutorial_input: payload,
          lang: localStorage.getItem('currentLang'),
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['SendTutorial']));
  }

  createTutorial(payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateTutorial($tutorial_input: TutorialInput!) {
            CreateTutorial(tutorial_input: $tutorial_input) {
              _id
              title
            }
          }
        `,
        variables: {
          tutorial_input: payload,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['CreateTutorial']));
  }

  updateTutorial(tutorialId, payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation UpdateTutorial($tutorial_input: TutorialInput!) {
          UpdateTutorial(_id: "${tutorialId}", tutorial_input: $tutorial_input) {
              _id
              title
            }
          }
        `,
        variables: {
          tutorial_input: payload,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['UpdateTutorial']));
  }

  GetAllInAppTutorial(filter, sorting, pagination): Observable<any[]> {
    return this.apollo
      .watchQuery<any[]>({
        query: gql`
          query GetAllInAppTutorial($filter: InAppTutorialFilterInput, $sorting: InAppTutorialSortingInput, $pagination: PaginationInput) {
            GetAllInAppTutorial(filter: $filter, sorting: $sorting, pagination: $pagination) {
              _id
              module
              sub_modules {
                sub_module
                items {
                  title
                  description
                }
              }
              scenario_checklist_url
              video_presentation
              qa_checklist_url
              count_document
              is_published
              user_types {
                _id
                name
              }
              video_url
            }
          }
        `,
        variables: {
          filter,
          sorting,
          pagination,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllInAppTutorial']));
  }

  GetAllInAppTutorials(): Observable<any[]> {
    return this.apollo
      .watchQuery<any[]>({
        query: gql`
          query {
            GetAllInAppTutorial {
              _id
              module
              sub_modules {
                sub_module
                items {
                  title
                  description
                }
              }
              scenario_checklist_url
              video_presentation
              qa_checklist_url
              count_document
              video_url
              user_types {
                _id
                name
              }
              is_published
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllInAppTutorial']));
  }

  GetAllInAppTutorialsByModule(moduleName, userType): Observable<any[]> {
    return this.apollo
      .watchQuery<any[]>({
        query: gql`
          query GetAllInAppTutorialByModule ($filter: InAppTutorialFilterInput){
            GetAllInAppTutorial (filter: $filter) {
              _id
              module
              sub_modules {
                sub_module
                items {
                  title
                  description
                }
              }
              scenario_checklist_url
              video_presentation
              qa_checklist_url
              count_document
              video_url
              is_published
            }
          }
        `,
        variables: {
          filter: {
            module: moduleName,
            is_published: true,
            user_type_name: userType ? userType : ''
          }
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllInAppTutorial']));
  }

  GetListTutorialAdded(): Observable<any[]> {
    return this.apollo
      .watchQuery<any[]>({
        query: gql`
          query {
            GetAllInAppTutorial {
              _id
              module
              is_published
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllInAppTutorial']));
  }

  // @Cacheable()
  // getTutotrials(): Observable<any[]> {
  //   return this.httpClient.get<any[]>('assets/data/tutorial.json');
  // }
}
