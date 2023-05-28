import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Cacheable } from 'ngx-cacheable';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { UserDialogData, UserDialogEntityData, RegisterUserResp, UserProfileData } from 'app/users/user.model';
import { NgxPermissionsService } from 'ngx-permissions';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  // to renew username in navigation when we login as different user (incognito button)
  reloadCurrentUserSource = new BehaviorSubject<boolean>(false);
  reloadPhotoUserSource = new BehaviorSubject<boolean>(false);
  reloadCurrentUser$ = this.reloadCurrentUserSource.asObservable();
  reloadPhotoUser$ = this.reloadPhotoUserSource.asObservable();

  public refresh: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(null);
  private _childrenFormValidationStatus: boolean = true;

  public get childrenFormValidationStatus() {
    return this._childrenFormValidationStatus;
  }

  public set childrenFormValidationStatus(state: boolean) {
    this._childrenFormValidationStatus = state;
  }

  reloadCurrentUser(status: boolean) {
    this.reloadCurrentUserSource.next(status);
  }

  triggerRefresh(value: boolean) {
    this.refresh.next(value);
  }

  reloadPhotoUser(status: boolean) {
    this.reloadPhotoUserSource.next(status);
  }

  constructor(private httpClient: HttpClient, private apollo: Apollo, private permissions: NgxPermissionsService) { }

  getEntitiesName(): string[] {
    if (this.permissions.getPermission('PC School Director')) {
      return ['academic'];
    }
    return ['admtc', 'academic', 'company', 'group_of_schools'];
  }

  getEntitiesNameToUserMenu(): string[] {
    return ['admtc', 'academic', 'group_of_schools', 'company'];
  }

  getEntitiesNameForAcadir(): string[] {
    return ['academic'];
  }

  getSchoolType(): string[] {
    if (this.permissions.getPermission('PC School Director')) {
      return ['preparation_center'];
    }
    return ['certifier', 'preparation_center'];
  }

  getSchoolTypeForAcadir(): string[] {
    return ['preparation_center'];
  }

  getSchoolTypeForCertifier(): string[] {
    return ['certifier'];
  }

  getUserTypesByEntity(entityName: string): Observable<{ _id: string; name: string }[]> {
    return this.apollo
      .watchQuery<{ _id: string; name: string }[]>({
        query: gql`
        query {
          GetAllUserTypes(entity: "${entityName}") {
            _id
            name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  getUserTypesByEntitywithStudent(entityName: string): Observable<{ _id: string; name: string }[]> {
    return this.apollo
      .watchQuery<{ _id: string; name: string }[]>({
        query: gql`
        query {
          GetAllUserTypes(entity: "${entityName}", show_student_type: include_student) {
            _id
            name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  getUserTypesForTutorial(): Observable<{ _id: string; name: string }[]> {
    return this.apollo
      .watchQuery<{ _id: string; name: string }[]>({
        query: gql`
          query {
            GetAllUserTypes(show_student_type: include_student) {
              _id
              name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  getUserTypesGroupMail(): Observable<{ _id: string; name: string }[]> {
    return this.apollo
      .watchQuery<{ _id: string; name: string }[]>({
        query: gql`
          query {
            GetAllUserTypes(search: "") {
              _id
              name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  getUserTypesAddTasks(): Observable<{ _id: string; name: string }[]> {
    return this.apollo
      .watchQuery<{ _id: string; name: string }[]>({
        query: gql`
          query {
            GetAllUserTypes(show_student_type: include_student) {
              _id
              name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  getUserTypesByEntityAndSchoolType(entityName: string, schoolType: string, include_mentor?): Observable<{ _id: string; name: string }[]> {
    return this.apollo
      .watchQuery<{ _id: string; name: string }[]>({
        query: gql`
        query GetAllUserTypes($include_mentor: Boolean){
          GetAllUserTypes(entity: "${entityName}", role:"${schoolType}", include_mentor: $include_mentor) {
            _id
            name
          }
        }
      `,
        fetchPolicy: 'network-only',
        variables: {
          include_mentor,
        },
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  getAllUserType(): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUserTypes {
              _id
              name
              entity
            }
          }
        `,
      })
      .pipe(
        map((response) => {
          if (response.data) {
            return response.data['GetAllUserTypes'];
          }
        }),
      );
  }

  getAllUserTypeNames(): Observable<{ name: string }[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUserTypes(search: "") {
              _id
              name_with_entity
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  getAllUserTypeDropdown(): Observable<{ name: string }[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUserTypes(search: "") {
              _id
              name_with_entity
              name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  getAllUserTypePCStudentDropdown(entityName, role): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUserTypes(entity: "${entityName}", role: "${role}", show_student_type: include_student) {
              _id
              name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  getAllTypeUserMenu(search): Observable<{ name: string }[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUserTypes(search: "${search}") {
              _id
              name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  getAllUserTypeExcludeComp(): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUserTypes(exclude_company: true, search: "") {
              _id
              name
              name_with_entity
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  getAllUserWithStudent(): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUserTypes(exclude_company: true, search: "", show_student_type: include_student) {
              _id
              name
              name_with_entity
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  getAllUserTypeForUser(schoolType): Observable<{ name: string }[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUserTypes(exclude_company: true, search: "", role:"${schoolType}") {
              _id
              name_with_entity
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  getAllUserTypeNonOp(schoolType): Observable<{ name: string }[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUserTypes(search: "", role:"${schoolType}") {
              _id
              name_with_entity
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  getAllUserTypeNonOpEntity(schoolType): Observable<{ name: string }[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUserTypes(role:"${schoolType}", show_student_type: include_student) {
              _id
              name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  getAllUserTypeStaff(): Observable<{ name: string }[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUserTypes(exclude_company: true, search: "") {
              _id
              name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  registerUser(payload: any): Observable<RegisterUserResp> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation registerUser($lang: String!, $userInput: UserInput) {
            RegisterUser(lang: $lang, user_input: $userInput) {
              _id
              civility
              first_name
              last_name
              email
            }
          }
        `,
        variables: {
          lang: localStorage.getItem('currentLang'),
          userInput: payload,
        },
      })
      .pipe(map((resp) => resp.data['RegisterUser']));
  }

  updateUser(id: string, payload: any, reactivate_user?: boolean): Observable<{ email: string; status: String }> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ($id: ID!, $lang: String!, $inputUser: UserInput!, $reactivate_user: Boolean) {
            UpdateUser(_id: $id, lang: $lang, user_input: $inputUser, reactivate_user: $reactivate_user) {
              _id
              email
              status
            }
          }
        `,
        variables: {
          id: id,
          lang: localStorage.getItem('currentLang'),
          inputUser: payload,
          reactivate_user
        },
      })
      .pipe(
        map((resp) => {
          if (resp.errors) {
            throw new Error(resp.errors['message']);
          } else {
            return resp.data['UpdateUser'];
          }
        }),
      );
  }

  MakeUserAsCompanyMember(user_id: string, payload: any): Observable<{ email: string }> {
    return this.apollo
      .mutate<{ email: string }>({
        mutation: gql`
          mutation MakeUserAsCompanyMember($user_id: ID!, $entities: [EntityInput!]) {
            MakeUserAsCompanyMember(user_id: $user_id, entities: $entities) {
              _id
            }
          }
        `,
        variables: {
          user_id: user_id,
          entities: payload,
        },
      })
      .pipe(
        map((resp) => {
          if (resp.errors) {
            throw new Error(resp.errors['message']);
          } else {
            return resp.data['MakeUserAsCompanyMember'];
          }
        }),
      );
  }

  registerUserExisting(payload: any): Observable<RegisterUserResp> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation registerUser($lang: String!, $userInput: UserInput) {
            RegisterUser(lang: $lang, user_input: $userInput, delete_user_and_create: true) {
              _id
              civility
              first_name
              last_name
            }
          }
        `,
        variables: {
          lang: localStorage.getItem('currentLang'),
          userInput: payload,
        },
      })
      .pipe(map((resp) => resp.data['RegisterUser']));
  }

  updateUserExisting(id: string, payload: any): Observable<any> {
    return this.apollo
      .mutate<{ email: string }>({
        mutation: gql`
          mutation ($id: ID!, $lang: String!, $inputUser: UserInput!) {
            UpdateUser(_id: $id, lang: $lang, user_input: $inputUser, reactivate_deleted_user: true) {
              _id
              email
            }
          }
        `,
        variables: {
          id: id,
          lang: localStorage.getItem('currentLang'),
          inputUser: payload,
        },
      })
      .pipe(
        map((resp) => {
          if (resp.errors) {
            throw new Error(resp.errors['message']);
          } else {
            return resp.data['UpdateUser'];
          }
        }),
      );
  }

  inactiveEmail(lang: string, user_id: string, reason: string): Observable<{ email: string }> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation incorrectEmail($lang: String, $user_id: ID, $reason: String) {
            IncorrectEmail(lang: $lang, user_id: $user_id, reason: $reason) {
              email
            }
          }
        `,
        variables: { lang: lang, user_id: user_id, reason },
      })
      .pipe(map((resp) => resp.data['IncorrectEmail']));
  }

  deleteUser(userId: string): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation deleteUser($id: ID!) {
            DeleteUser(_id: $id) {
              email
            }
          }
        `,
        variables: { id: userId },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp));
  }
  deactivateUser(userId: string, reason: string, date: string): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation DeleteUser($id: ID!, $reason: String, $date: String) {
            DeleteUser(_id: $id, reason_for_resignation: $reason, date_of_resignation: $date) {
              _id
              email
              first_name
              date_of_resignation
              reason_for_resignation
            }
          }
        `,
        variables: {
          id: userId,
          reason: reason,
          date: date,
        },
      })
      .pipe(map((resp) => resp.data['DeleteUser']));
  }

  reactivateUser(userId: string): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation reactiveUser($id: ID!) {
            ReactiveUser(user_id: $id) {
              _id
              email
            }
          }
        `,
        variables: { id: userId },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp));
  }
  getUserDeactivation(userId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetOneUser($id: ID, $status: EnumStatus) {
            GetOneUser(_id: $id, status: $status) {
              _id
              civility
              first_name
              last_name
              email
              position
              office_phone
              direct_line
              portable_phone
              created_at
              updated_at
              user_status
              profile_picture
              address {
                address
                postal_code
                city
                region
                department
                country
                is_main_address
              }
              curriculum_vitae {
                name
                file_path
                s3_path
              }
              entities {
                class {
                  _id
                  name
                }
                school {
                  _id
                  short_name
                }
                school_type
                group_of_schools {
                  _id
                  short_name
                }
                group_of_school {
                  _id
                  headquarter {
                    _id
                    short_name
                    preparation_center_ats {
                      rncp_title_id {
                        _id
                        short_name
                      }
                    }
                  }
                  school_members {
                    _id
                    short_name
                    preparation_center_ats {
                      rncp_title_id {
                        _id
                        short_name
                      }
                    }
                  }
                }
                assigned_rncp_title {
                  _id
                  short_name
                }
                type {
                  _id
                  name
                }
                entity_name
              }
              user_status
            }
          }
        `,
        variables: { id: userId, status: 'deleted' },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['GetOneUser']));
  }

  getUserDialogData(userId: string): Observable<UserDialogData> {
    return this.apollo
      .watchQuery<UserDialogData>({
        query: gql`
        query {
          GetOneUser(_id: "${userId}") {
            _id
            civility
            first_name
            last_name
            email
            position
            office_phone
            direct_line
            portable_phone
            created_at
            updated_at
            user_status
            profile_picture
            address{
              address
              postal_code
              city
              region
              department
              country
              is_main_address
            }
            curriculum_vitae {
              name
              file_path
              s3_path
            }
            entities {
              entity_name
              school_type
              group_of_school {
                _id
                group_name
              }
              school {
                _id
                short_name
              }
              assigned_rncp_title {
                _id
                short_name
              }
              class {
                _id
              }
              type {
                _id
              }
              companies {
                _id
                company_name
              }
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetOneUser']));
  }

  getOneUserCard(_id: string, status?): Observable<UserDialogData> {
    return this.apollo
      .watchQuery<UserDialogData>({
        query: gql`
          query GetOneUser($_id: ID, $status: EnumStatus) {
            GetOneUser(_id: $_id, status: $status) {
              _id
              civility
              first_name
              last_name
              email
              position
              office_phone
              direct_line
              portable_phone
              created_at
              updated_at
              user_status
              profile_picture
              incorrect_email
              students_connected {
                _id
              }
              address {
                address
                postal_code
                city
                region
                department
                country
                is_main_address
              }
              curriculum_vitae {
                name
                file_path
                s3_path
              }
              entities {
                entity_name
                school_type
                group_of_school {
                  _id
                  group_name
                }
                school {
                  _id
                  short_name
                }
                assigned_rncp_title {
                  _id
                  short_name
                }
                class {
                  _id
                  name
                }
                type {
                  _id
                  name
                }
                companies {
                  _id
                  company_name
                }
                titles_in_charge {
                  _id
                  short_name
                }
              }
              last_login {
                date
                time
              }
            }
          }
        `,
        variables: {
          _id,
          status: status ? status : null,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetOneUser']));
  }

  getUserEditData(userId: string, status: string): Observable<UserDialogData> {
    return this.apollo
      .watchQuery<UserDialogData>({
        query: gql`
          query GetOneUser($id: ID, $status: EnumStatus) {
            GetOneUser(_id: $id, status: $status) {
              _id
              civility
              first_name
              last_name
              email
              position
              office_phone
              direct_line
              portable_phone
              curriculum_vitae {
                name
                file_path
                s3_path
              }
              entities {
                entity_name
                school_type
                group_of_school {
                  _id
                  group_name
                }
                school {
                  _id
                  short_name
                }
                assigned_rncp_title {
                  _id
                  short_name
                }
                class {
                  _id
                }
                type {
                  _id
                }
                companies {
                  _id
                  company_name
                }
              }
            }
          }
        `,
        variables: { id: userId, status: status },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetOneUser']));
  }

  getUserById(id: string): Observable<UserDialogData> {
    return this.apollo
      .watchQuery<UserDialogData>({
        query: gql`
        query {
          GetOneUser(_id: "${id}") {
            _id
            civility
            first_name
            last_name
            email
            position
            office_phone
            direct_line
            portable_phone
            profile_picture
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetOneUser']));
  }

  getUserEntities(email: string): Observable<UserDialogEntityData[]> {
    return this.apollo
      .watchQuery<UserDialogEntityData[]>({
        query: gql`
        query {
          GetOneUser(email: "${email}") {
            entities {
              entity_name
              school_type
              group_of_schools {
                _id
              }
              school {
                _id
              }
              assigned_rncp_title {
                _id
              }
              class {
                _id
              }
              type {
                _id
                  name
              }
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetOneUser']));
  }

  getUserProfileData(email: string): Observable<UserProfileData> {
    return this.apollo
      .query<UserProfileData>({
        query: gql`
        query {
          GetOneUser(email: "${email}") {
            _id
            student_id {
              _id
              type_of_formation
              vae_access
              postal_code_of_birth
            }
            civility
            first_name
            last_name
            email
            position
            office_phone
            direct_line
            portable_phone
            profile_picture
            entities {
              entity_name
              school_type
              group_of_schools {
                _id
                short_name
              }
              school {
                _id
                short_name
              }
              assigned_rncp_title {
                _id
                short_name
              }
              class {
                _id
                name
              }
              type {
                _id
                name
              }
            }
          }
        }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneUser']));
  }

  getUserByEmail(email: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneUser(email: "${email}") {
            _id
            student_id {
              _id
              type_of_formation
              vae_access
              postal_code_of_birth
            }
            civility
            first_name
            last_name
            email
            position
            office_phone
            direct_line
            portable_phone
            profile_picture
            entities {
              entity_name
              school_type
              group_of_schools {
                _id
                short_name
              }
              school {
                _id
                short_name
              }
              assigned_rncp_title {
                _id
                short_name
              }
              class {
                _id
                name
              }
              type {
                _id
                name
              }
              companies {
                _id
                company_name
              }
            }
          }
        }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneUser']));
  }

  getOneUser(email: string): Observable<UserProfileData> {
    return this.apollo
      .query({
        query: gql`
          query GetOneUser($email: String) {
            GetOneUser(email: $email) {
              _id
              first_name
              last_name
              civility
              email
            }
          }
        `,
        variables: {
          email,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneUser']));
  }

  checkActiveEmail(email): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query CheckActiveEmail($email: String) {
            CheckActiveEmail(email: $email) {
              _id
              first_name
              last_name
              civility
              email
            }
          }
        `,
        variables: {
          email,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneUser']));
  }

  getUserBySchoolId(school, classId?): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query {
            GetAllUsers(school: "${school}", ${classId ? `class_id: "${classId}"` : ``}) {
              _id
              first_name
              last_name
              civility
              email
              full_name
              entities {
                entity_name
                type {
                  name
                }
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getUserBySchoolTitleClass(school, titleId, classId): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query getUserBySchoolTitleClass($school: [ID!], $title: [ID!], $class_id: ID) {
            GetAllUsers(school: $school, title: $title, class_id: $class_id) {
              _id
              first_name
              last_name
              civility
              email
              full_name
              entities {
                entity_name
                type {
                  name
                }
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          school,
          title: titleId,
          class_id: classId,
        },
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getAllUserAcadirFromSchool(school, title, classId, user_type): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllUsers($title: [ID!], $school: [ID!], $user_type: [ID!]) {
            GetAllUsers(title: $title, school: $school, ${classId ? `class_id: "${classId}"` : ``}, user_type: $user_type) {
              _id
              first_name
              last_name
              civility
              email
              full_name
              entities {
                entity_name
                school {
                  _id
                  short_name
                }
                type {
                  name
                }
              }
            }
          }
        `,
        variables: {
          title: title ? title : '',
          school: school ? school : '',
          user_type: user_type ? user_type : '',
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getAllUserMentorFromSchool(school, title, classId, user_type): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllUsers($title: [ID!], $school: [ID!], $user_type: [ID!]) {
            GetAllUsers(title: $title, school: $school, ${classId ? `class_id: "${classId}"` : ``}, user_type: $user_type) {
              _id
              first_name
              last_name
              civility
              email
              full_name
              entities {
                entity_name
                school {
                  _id
                  short_name
                }
                type {
                  name
                }
              }
            }
          }
        `,
        variables: {
          title: title ? title : '',
          school: school ? school : '',
          user_type: user_type ? user_type : '',
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getUserAcademicByTitleId(title, classId?): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllUsers($title: [ID!]) {
            GetAllUsers(title: $title, entity: academic, show_student: include_student, ${classId ? `class_id: "${classId}"` : ``}) {
              _id
              first_name
              last_name
              civility
              email
              full_name
              entities {
                entity_name
                type {
                  name
                }
                school {
                  _id
                  short_name
                }
              }
            }
          }
        `,
        variables: {
          title: title ? title : '',
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getUserByTitleIdSchool(title, school): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllUsers($title: [ID!], $school: [ID!]) {
            GetAllUsers(title: $title, school: $school, entity: academic, show_student: include_student) {
              _id
              first_name
              last_name
              civility
              email
              full_name
              entities {
                entity_name
                type {
                  name
                }
              }
            }
          }
        `,
        variables: {
          title: title ? title : '',
          school: school ? school : '',
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getUserType(title, user_type): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllUsers($title: [ID!], $user_type: [ID!]) {
            GetAllUsers(title: $title, user_type: $user_type) {
              _id
              first_name
              last_name
              civility
              email
              full_name
            }
          }
        `,
        variables: {
          title: title ? title : '',
          user_type: user_type ? user_type : '',
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getUserTypeStudent(title, user_type): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllUsers($title: [ID!], $user_type: [ID!]) {
            GetAllUsers(title: $title, user_type: $user_type, show_student: student_only) {
              _id
              first_name
              last_name
              civility
              email
              full_name
            }
          }
        `,
        variables: {
          title: title ? title : '',
          user_type: user_type ? user_type : '',
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  // *************** Query for Quick Search
  getStudentQuickSearch(filter, schoolId = null, is_for_quick_search): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllStudents($filter: FilterStudent, $school_ids: [ID], $is_for_quick_search: Boolean) {
            GetAllStudents(filter: $filter, school_ids: $school_ids, is_for_quick_search: $is_for_quick_search) {
              _id
              first_name
              last_name
              civility
              user_id {
                _id
                entities {
                  entity_name
                  school_type
                  school {
                    _id
                  }
                  type {
                    name
                  }
                }
              }
              school {
                _id
                short_name
              }
              rncp_title {
                _id
                short_name
              }
              current_class {
                _id
                name
              }
              student_title_status
            }
          }
        `,
        variables: {
          filter: filter,
          school_ids: schoolId,
          is_for_quick_search,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getSchoolQuickSearch(school_name, schoolId = null): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllSschools($school_name: String, $school_ids: [ID]) {
            GetAllSchools(school_name: $school_name, school_ids: $school_ids) {
              _id
              short_name
            }
          }
        `,
        variables: {
          school_name: school_name,
          school_ids: schoolId,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllSchools']));
  }

  getUserQuickSearch(
    last_name,
    school = null,
    title = null,
    entity = null,
    user_type = null,
    company_schools = null,
    exclude_company = null,
  ): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllUsers(
            $last_name: String
            $school: [ID!]
            $title: [ID!]
            $exclude_company: Boolean
            $entity: [EnumEntityType!]
            $user_type: [ID!]
            $company_schools: [ID]
          ) {
            GetAllUsers(
              last_name: $last_name
              school: $school
              title: $title
              exclude_company: $exclude_company
              entity: $entity
              user_type: $user_type
              company_schools: $company_schools
            ) {
              _id
              first_name
              last_name
              civility
              entities {
                school {
                  _id
                  short_name
                }
                companies {
                  _id
                  company_name
                  school_ids {
                    _id
                    short_name
                  }
                }
                assigned_rncp_title {
                  _id
                  short_name
                }
                type {
                  _id
                  name
                  role
                }
                entity_name
              }
            }
          }
        `,
        variables: {
          last_name: last_name,
          school: school,
          title: title,
          exclude_company: exclude_company,
          entity: entity,
          user_type: user_type,
          company_schools: company_schools,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getTitleQuickSearch(title_name: string, user_type_login: string) {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllTitles($title_name: String, $user_type_login: ID) {
            GetAllTitles(title_name: $title_name, user_type_login: $user_type_login) {
              _id
              short_name
              long_name
            }
          }
        `,
        variables: {
          title_name,
          user_type_login,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getAllSchool(school_ids = null): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllSchools($school_ids: [ID]) {
            GetAllSchools(school_ids: $school_ids) {
              _id
              short_name
            }
          }
        `,
        variables: {
          school_ids,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllSchools']));
  }

  GetAllTitles(rncp_title_ids = null, school_id?): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllTitles($rncp_title_ids: [ID], $school_id: [String]) {
            GetAllTitles(rncp_title_ids: $rncp_title_ids, school_id: $school_id) {
              _id
              short_name
              classes {
                _id
                name
              }
            }
          }
        `,
        variables: {
          rncp_title_ids,
          school_id: school_id ? school_id : null,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  updateUserEntities(_id, user_input): Observable<any> {
    return this.apollo
      .mutate<any>({
        mutation: gql`
          mutation UpdateUserEntities($_id: ID!, $user_input: UserEntityInput!, $lang: String) {
            UpdateUserEntities(_id: $_id, user_input: $user_input, lang: $lang) {
              _id
              status
            }
          }
        `,
        variables: {
          _id,
          user_input,
          lang: localStorage.getItem('currentLang'),
        },
      })
      .pipe(map((resp) => resp.data['UpdateUserEntities']));
  }

  getScheduleJuryBasedOnName(user_name, year_of_certification): Observable<any> {
    return this.apollo
      .watchQuery<any[]>({
        query: gql`
          query GetScheduleJuryBasedOnName($user_name: String, $year_of_certification: String) {
            QuickSearchJurySchedule(user_name: $user_name, year_of_certification: $year_of_certification) {
              schedules {
                schedule {
                  _id
                  rncp_title {
                    _id
                    year_of_certification
                  }
                }
                position
                user {
                  _id
                  first_name
                  last_name
                  entities {
                    school {
                      _id
                      short_name
                    }
                    companies {
                      _id
                      company_name
                      school_ids {
                        _id
                        short_name
                      }
                    }
                    assigned_rncp_title {
                      _id
                      short_name
                    }
                    type {
                      _id
                      name
                      role
                    }
                    entity_name
                  }
                }
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          user_name,
          year_of_certification,
        },
      })
      .valueChanges.pipe(map((resp) => resp.data['QuickSearchJurySchedule']));
  }
  getUserQuickSearchEmail(email, school, title, pagination): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllUsers(  
            $email: String,
            $school: [ID!],
            $title: [ID!],
            $show_student: EnumShowStudent,
            $pagination: PaginationInput
            ) {
            GetAllUsers(
              email:$email,
              school:$school,
              title:$title,
              pagination:$pagination
              show_student:$show_student
            ) {
              _id
              first_name
              last_name
              count_document
              civility
              student_id{
                _id
                school {
                  _id
                  short_name
                }
                rncp_title {
                  _id
                  short_name
                }
                current_class{
                  _id
                  name
                }
              }
              entities {
                school {
                  _id
                  short_name
                }
                assigned_rncp_title {
                  _id
                  short_name
                }
                type {
                  _id
                  name
                  role
                }
                entity_name
              }
            }
          }
        `,
        variables: {
          email, 
          pagination,
          school, 
          title, 
          show_student:"include_student"
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }


  // ----------------------------------------------------------
  // ===================== MOCK DATA =========================
  // ----------------------------------------------------------

  @Cacheable()
  getUsers(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/users.json');
  }
}
