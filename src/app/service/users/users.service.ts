import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, pipe } from 'rxjs';
import { Cacheable } from 'ngx-cacheable';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { UserTableData } from 'app/users/user.model';

@Injectable({
  providedIn: 'root',
})
export class UsersService {
  // PC usertypes ID
  acadAdminId = '5a2e1ecd53b95d22c82f9555';
  acadDirId = '5a2e1ecd53b95d22c82f9554';
  academicFinalJuryMemberId = '5cdbdeaf4b1f6a1b5a0b3fb6';
  correctorId = '5a2e1ecd53b95d22c82f9559';
  crossCorrectorId = '5a9e7ddf8228f45eb2e9bc77';
  pcSchoolDirectorId = '5a2e1ecd53b95d22c82f9553';
  professionalJuryMemberId = '5cdbde9b4b1f6a1b5a0b3fb5';
  teacherId = '5a2e1ecd53b95d22c82f9558';
  // ---------------------------
  animatorDmoe2020 = '5db0902b4ecfb421990f2cd4';
  animatorRmo2020 = '5db08f8f4ecfb421990f2cc8';
  academicAdmin = '5a2e1ecd53b95d22c82f9555';
  academicDirector = '5a2e1ecd53b95d22c82f9554';
  academicFinalJury = '5cdbdeaf4b1f6a1b5a0b3fb6';
  animatorCdrh2021 = '5fd9dd5ab270ea23e4f9dc92';
  animatorDmoe2019 = '5bbcc95a9241912fe42d63d8';
  animatorDmoe2021 = '5fd9dc5db270ea23e4f9dc8e';
  animatorDrh2021 = '5fd9dcc8b270ea23e4f9dc90';
  animatorRdc2021 = '5fd9ddd5b270ea23e4f9dc96';
  animatorRgp2020 = '5e4a7c0066416218157d821e';
  animatorRmo2019 = '5bbcc8f69241912fe42d63d5';
  animatorRmo2021 = '5fd9dd9ab270ea23e4f9dc94';
  correctorCroiseDmoe2017 = '5cc172e112b9ef6372797b56';
  correctorCroiseRmo2019 = '5cc08ebe35b14e520b7654ed';
  corrector = '5a2e1ecd53b95d22c82f9559';
  crossCorrector = '5a9e7ddf8228f45eb2e9bc77';
  chiefGroupAcademic = '5a2e1ecd53b95d22c82f9556';
  pcSchoolDirector = '5a2e1ecd53b95d22c82f9553';
  professionalJuryMember = '5cdbde9b4b1f6a1b5a0b3fb5';
  teacher = '5a2e1ecd53b95d22c82f9558';
  animatorBG = "6163f6bb3edc852cf45d4bb6"

  // New type cross corrector
  crossCorrectorCDCMBA2021 = '60a2137ce9b9795c40175d08';
  crossCorrectorCGRHP2021 = '60a2133ee9b9795c40175d06';
  correcteurCroiséCDCM2021 = '60a21305e9b9795c40175d02';
  correcteurCroiséDMOE2021 = '60a212cde9b9795c40175d00';
  correcteurCroiséRMO2021 = '60a20fb4e9b9795c40175ce5';
  correcteurCDCM2021 = '609894ae395d243f3bc19b90';
  correcteurCDCMBA2021 = '609894c0395d243f3bc19b91';
  correcteurCGRHP2021 = '609894c7395d243f3bc19b92';
  mentor = '5a2e603f53b95d22c82f9590';

  PCUsertypeList = [
    this.animatorDmoe2020,
    this.animatorRmo2020,
    this.academicAdmin,
    this.academicDirector,
    this.academicFinalJury,
    this.animatorCdrh2021,
    this.animatorDmoe2019,
    this.animatorDmoe2021,
    this.animatorDrh2021,
    this.animatorRdc2021,
    this.animatorRgp2020,
    this.animatorRmo2019,
    this.animatorRmo2021,
    this.correctorCroiseDmoe2017,
    this.correctorCroiseRmo2019,
    this.corrector,
    this.crossCorrector,
    this.chiefGroupAcademic,
    this.pcSchoolDirector,
    this.professionalJuryMember,
    this.teacher,
    this.crossCorrectorCDCMBA2021,
    this.crossCorrectorCGRHP2021,
    this.correcteurCroiséCDCM2021,
    this.correcteurCroiséDMOE2021,
    this.correcteurCroiséRMO2021,
    this.correcteurCDCM2021,
    this.correcteurCDCMBA2021,
    this.correcteurCGRHP2021,
    this.animatorBG
  ];
  // CR usertypes ID
  crSchoolDirectorId = '5a2e1ecd53b95d22c82f954f';
  certAdminId = '5a2e1ecd53b95d22c82f9550';
  correctorOfProblematicId = '5a2e1ecd53b95d22c82f9551';
  correctorOfQualityId = '5a2e1ecd53b95d22c82f9552';
  presidentOfJuryId = '5a3cd5e7e6fae44c7c11561e';
  correctorCertifierId = '5b210d24090336708818ded1';
  teacherCertifierId = '5e93dd18ef9a2925e85eeb29';
  juryCorrectorId = '62298c90604bb15fd819bd73';

  CRUsertypeList = [
    this.crSchoolDirectorId,
    this.certAdminId,
    this.correctorOfProblematicId,
    this.correctorOfQualityId,
    this.presidentOfJuryId,
    this.correctorCertifierId,
    this.teacherCertifierId,
    this.juryCorrectorId
  ];
  CRList = [
    { _id: '5a2e1ecd53b95d22c82f954f', name: 'CR School Director' },
    { _id: '5a2e1ecd53b95d22c82f9550', name: 'Certifier Admin' },
    { _id: '5a2e1ecd53b95d22c82f9551', name: 'Corrector of Problematic' },
    { _id: '5a2e1ecd53b95d22c82f9552', name: 'Corrector Quality' },
    { _id: '5a3cd5e7e6fae44c7c11561e', name: 'President of Jury' },
    { _id: '5b210d24090336708818ded1', name: 'Corrector Certifier' },
    { _id: '5e93dd18ef9a2925e85eeb29', name: 'Teacher Certifier' },
    { _id: '5b1ffb5c9e25da6d30bde480', name: 'Correcteur PFE Oral' },
  ];
  PCList = [
    { _id: '5a2e1ecd53b95d22c82f9555', name: 'Academic Admin' },
    { _id: '5a2e1ecd53b95d22c82f9554', name: 'Academic Director' },
    { _id: '5cdbdeaf4b1f6a1b5a0b3fb6', name: 'Academic Final Jury Member' },
    { _id: '5a2e1ecd53b95d22c82f9559', name: 'Corrector' },
    { _id: '5a9e7ddf8228f45eb2e9bc77', name: 'Cross Corrector' },
    { _id: '5a2e1ecd53b95d22c82f9553', name: 'PC School Director' },
    { _id: '5cdbde9b4b1f6a1b5a0b3fb5', name: 'Profesional Jury Member' },
    { _id: '5a2e1ecd53b95d22c82f9558', name: 'Teacher' },
    { _id: '5f33552b683818419d13028b', name: 'Animator Business game' },
  ];
  UserTypeAcademicList = [
    { _id: '5a2e1ecd53b95d22c82f9555', name: 'Academic Admin' },
    { _id: '5a2e1ecd53b95d22c82f9554', name: 'Academic Director' },
    { _id: '5cdbdeaf4b1f6a1b5a0b3fb6', name: 'Academic Final Jury Member' },
    { _id: '5f33552b683818419d13028b', name: 'Animator Business game' },
    { _id: '5a2e1ecd53b95d22c82f9550', name: 'Certifier Admin' },
    { _id: '5a2e1ecd53b95d22c82f9559', name: 'Corrector' },
    { _id: '5b210d24090336708818ded1', name: 'Corrector Certifier' },
    { _id: '5a2e1ecd53b95d22c82f9551', name: 'Corrector of Problematic' },
    { _id: '5a2e1ecd53b95d22c82f9552', name: 'Corrector Quality' },
    { _id: '5b1ffb5c9e25da6d30bde480', name: 'Correcteur PFE Oral' },
    { _id: '5a9e7ddf8228f45eb2e9bc77', name: 'Cross Corrector' },
    { _id: '5a2e1ecd53b95d22c82f954f', name: 'CR School Director' },
    { _id: '5a2e1ecd53b95d22c82f9553', name: 'PC School Director' },
    { _id: '5cdbde9b4b1f6a1b5a0b3fb5', name: 'Profesional Jury Member' },
    { _id: '5a3cd5e7e6fae44c7c11561e', name: 'President of Jury' },
    { _id: '5a2e1ecd53b95d22c82f9558', name: 'Teacher' },
    { _id: '5e93dd18ef9a2925e85eeb29', name: 'Teacher Certifier' },
  ];

  constructor(private httpClient: HttpClient, private apollo: Apollo) {}

  getAllUserADMTCDir(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUsers(user_type: "5a2e1ecd53b95d22c82f954b") {
              _id
              first_name
              last_name
              civility
            }
          }
        `,
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getAllUsersUnderADMTC(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUsers(entity_name: admtc) {
              _id
              first_name
              last_name
              civility
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getSenderUsers(entity: string, type: string, titleId?: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query {
        GetAllUsers(entity: ${entity}, user_type: "${type}", title: "${titleId}") {
          _id
          civility
          first_name
          last_name
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getAllUserBySchool(schoolId: string): Observable<UserTableData[]> {
    return this.apollo
      .query<UserTableData[]>({
        query: gql`
        query {
          GetAllUsers(school:"${schoolId}") {
            _id
            email
            civility
            first_name
            last_name
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
              }
              entity_name
            }
            user_status
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getAllUserInStaffSchool(
    school,
    pagination,
    sorting,
    filter,
    user_type,
    user_type_login,
    titles?,
    table_from?,
  ): Observable<UserTableData[]> {
    return this.apollo
      .query<UserTableData[]>({
        query: gql`
        query GetAllUsers($pagination: PaginationInput, $sorting: UserSorting, $user_type: [ID!], $user_type_login: ID, $title: [ID!], $table_from: EnumTableFrom){
          GetAllUsers(
            ${filter}
            school: "${school}",
            pagination: $pagination,
            sorting: $sorting,
            user_type: $user_type
            user_type_login: $user_type_login,
            is_for_school_staff: true,
            title: $title,
            table_from: $table_from
            ) {
            _id
            email
            civility
            first_name
            last_name
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
              }
              entity_name
            }
            user_status
            count_document
          }
        }
      `,
        variables: {
          pagination,
          sorting: sorting ? sorting : {},
          user_type,
          title: titles,
          user_type_login: user_type_login,
          is_for_school_staff: true,
          table_from: table_from,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getOneUserInStaffSchool(userId): Observable<UserTableData> {
    return this.apollo
      .query<UserTableData>({
        query: gql`
        query GetOneUser{
          GetOneUser(_id: "${userId}") {
            _id
            email
            civility
            first_name
            last_name
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
              }
              entity_name
            }
            user_status
            count_document
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneUser']));
  }

  getAllStaffExport(school): Observable<UserTableData[]> {
    return this.apollo
      .query<UserTableData[]>({
        query: gql`
        query {
          GetAllUsers(
            school: "${school}"
            ) {
            _id
            email
            civility
            first_name
            last_name
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
              }
              entity_name
            }
            user_status
            count_document
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getAllUser(pagination, sortValue, filter): Observable<UserTableData[]> {
    // Previously there is exclude_company : true, now removed
    return this.apollo
      .watchQuery<UserTableData[]>({
        query: gql`
          query GetAllUsers($page: PaginationInput, $sort: UserSorting) {
              GetAllUsers(
              ${filter}
              pagination: $page
              sorting: $sort
              ) {
              _id
              email
              civility
              first_name
              last_name
              students_connected {
                _id
              }
              entities {
                  school {
                      _id
                      short_name
                  }
                  school_type
                  group_of_schools{
                    _id
                    short_name
                  }
                  group_of_school{
                    _id
                    headquarter {
                      _id
                      short_name
                      preparation_center_ats{
                        rncp_title_id{
                          _id
                          short_name
                        }
                        class_id {
                          _id
                          name
                        }
                      }
                    }
                    school_members {
                      _id
                      short_name
                      preparation_center_ats{
                        rncp_title_id{
                          _id
                          short_name
                        }
                      }
                    }
                  }
                  titles_in_charge {
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
                    jury_process_name
                  }
                  type {
                      _id
                      name
                  }
                  companies{
                    _id
                    company_name
                    school_ids {
                      _id
                      short_name
                      companies{
                        mentor_ids{
                          _id
                        }
                        company_id{
                          _id
                        }
                      }
                    }
                  }
                  entity_name
              }
              created_at
              user_status
              count_document,
              status
          }
          }
      `,
        variables: {
          page: pagination,
          sort: sortValue ? sortValue : {},
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getAllUserManagement(
    pagination,
    sortValue,
    last_name?,
    school?,
    title?,
    class_id?,
    exclude_company?,
    school_type?,
    is_for_school_staff?,
    user_type_login?,
    user_type?,
    status?,
  ): Observable<UserTableData[]> {
    // Previously there is exclude_company : true, now removed
    return this.apollo
      .watchQuery<UserTableData[]>({
        query: gql`
          query GetAllUsers(
            $page: PaginationInput
            $sort: UserSorting
            $last_name: String
            $school: [ID!]
            $title: [ID!]
            $class_id: ID
            $exclude_company: Boolean
            $school_type: [EnumSchoolType]
            $is_for_school_staff: Boolean
            $user_type_login: ID
            $user_type: [ID!]
            $status: EnumStatus
          ) {
            GetAllUsers(
              pagination: $page
              sorting: $sort
              last_name: $last_name
              school: $school
              title: $title
              class_id: $class_id
              exclude_company: $exclude_company
              school_type: $school_type
              is_for_school_staff: $is_for_school_staff
              user_type_login: $user_type_login
              user_type: $user_type
              status: $status
            ) {
              _id
              email
              civility
              first_name
              last_name
              position
              profile_picture
              entities {
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
                      class_id {
                        _id
                        name
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
                  school_ids {
                    _id
                    short_name
                  }
                }
                entity_name
              }
              user_status
              count_document
              status
            }
          }
        `,
        variables: {
          page: pagination,
          sort: sortValue ? sortValue : {},
          last_name: last_name ? last_name : null,
          school: school ? school : null,
          title: title ? title : null,
          class_id: class_id ? class_id : null,
          exclude_company: exclude_company ? exclude_company : null,
          school_type: school_type ? school_type : null,
          is_for_school_staff: is_for_school_staff ? is_for_school_staff : null,
          user_type_login: user_type_login ? user_type_login : null,
          user_type: user_type ? user_type : null,
          status: status ? status : null,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getAllUserDeactivate(pagination, sortValue, filter, status): Observable<UserTableData[]> {
    // Previously there is exclude_company : true, now removed
    return this.apollo
      .watchQuery<UserTableData[]>({
        query: gql`
          query GetAllUsers($page: PaginationInput, $sort: UserSorting, $status:EnumStatus) {
              GetAllUsers(
              ${filter}
              pagination: $page
              sorting: $sort,
              status: $status
              ) {
              _id
              email
              civility
              first_name
              last_name
              entities {
                  school {
                      _id
                      short_name
                  }
                  school_type
                  group_of_schools{
                    _id
                    short_name
                  }
                  group_of_school{
                    _id
                    headquarter {
                      _id
                      short_name
                      preparation_center_ats{
                        rncp_title_id{
                          _id
                          short_name
                        }
                        class_id {
                          _id
                          name
                        }
                      }
                    }
                    school_members {
                      _id
                      short_name
                      preparation_center_ats{
                        rncp_title_id{
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
                  class {
                    _id
                    name
                  }
                  type {
                      _id
                      name
                  }
                  companies{
                    _id
                    company_name
                    school_ids {
                      _id
                      short_name
                    }
                  }
                  entity_name
              }
              user_status
              count_document,
              status
          }
          }
      `,
        variables: {
          page: pagination,
          sort: sortValue ? sortValue : {},
          status: status,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllUsers']));
  }
  getOneUserForTableUser(userId): Observable<UserTableData> {
    // Previously there is exclude_company : true, now removed
    return this.apollo
      .query({
        query: gql`
          query GetOneUserForTable {
            GetOneUser(_id: "${userId}") {
              _id
              email
              civility
              first_name
              last_name
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
                group_of_schools{
                  _id
                  short_name
                }
                group_of_school{
                  _id
                  headquarter {
                    _id
                    short_name
                    preparation_center_ats{
                      rncp_title_id{
                        _id
                        short_name
                      }
                    }
                  }
                  school_members {
                    _id
                    short_name
                    preparation_center_ats{
                      rncp_title_id{
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
              created_at
              user_status
          }
          }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneUser']));
  }

  getOneUserToEdit(userId): Observable<UserTableData> {
    return this.apollo
      .watchQuery<UserTableData[]>({
        query: gql`
        query GetOneUser {
            GetOneUser(_id: "${userId}") {
            _id
            email
            civility
            first_name
            last_name
            entities {
                school {
                    _id
                    short_name
                }
                school_type
                group_of_schools{
                  _id
                  short_name
                }
                group_of_school{
                  _id
                  headquarter {
                    _id
                    short_name
                    preparation_center_ats{
                      rncp_title_id{
                        _id
                        short_name
                      }
                    }
                  }
                  school_members {
                    _id
                    short_name
                    preparation_center_ats{
                      rncp_title_id{
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
            count_document
        }
        }
    `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetOneUser']));
  }

  getOneUserForLoginAs(userId: string): Observable<UserTableData[]> {
    // Previously there is exclude_company : true, now removed
    return this.apollo
      .watchQuery<UserTableData[]>({
        query: gql`
        query GetOneUser {
          GetOneUser(_id: "${userId}") {
            _id
            civility
            email
            first_name
            last_name
            user_status
            entities{
              entity_name
              school_type
              assigned_rncp_title{
                _id
                short_name
              }
              class{
                _id
                name
              }
              school{
                _id
                short_name
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

  getAllUserFromCR(pagination, sortValue, filter, title): Observable<UserTableData[]> {
    return this.apollo
      .watchQuery<UserTableData[]>({
        query: gql`
          query GetAllUsers($page: PaginationInput, $sort: UserSorting, $title: [ID!]) {
              GetAllUsers(
              ${filter}
              title: $title
              exclude_company: true
              pagination: $page
              sorting: $sort
              ) {
              _id
              email
              civility
              first_name
              last_name
              entities {
                  school {
                      _id
                      short_name
                  }
                  group_of_schools{
                    _id
                    short_name
                  }
                  group_of_school{
                    _id
                    headquarter {
                      _id
                      short_name
                      preparation_center_ats{
                        rncp_title_id{
                          _id
                          short_name
                        }
                      }
                    }
                    school_members {
                      _id
                      short_name
                      preparation_center_ats{
                        rncp_title_id{
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
              count_document
          }
          }
      `,
        variables: {
          page: pagination,
          sort: sortValue ? sortValue : {},
          title: title,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getAllUserFromCRWithSchool(pagination, sortValue, filter, title, school): Observable<UserTableData[]> {
    return this.apollo
      .watchQuery<UserTableData[]>({
        query: gql`
          query GetAllUsers($page: PaginationInput, $sort: UserSorting, $title: [ID!], $school: [ID!]) {
              GetAllUsers(
              ${filter}
              title: $title
              exclude_company: true
              pagination: $page
              sorting: $sort
              school: $school
              school_type: certifier
              ) {
              _id
              email
              civility
              first_name
              last_name
              students_connected {
                _id
              }
              entities {
                  school {
                      _id
                      short_name
                  }
                  class {
                    _id
                    name
                    jury_process_name
                  }
                  school_type
                  group_of_schools{
                    _id
                    short_name
                  }
                  group_of_school{
                    _id
                    headquarter {
                      _id
                      short_name
                      preparation_center_ats{
                        rncp_title_id{
                          _id
                          short_name
                        }
                      }
                    }
                    school_members {
                      _id
                      short_name
                      preparation_center_ats{
                        rncp_title_id{
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
                  companies{
                    _id
                    company_name
                    school_ids {
                      _id
                      short_name
                      companies{
                        mentor_ids{
                          _id
                        }
                        company_id{
                          _id
                        }
                      }
                    }
                    mentor_ids{
                      _id
                    }
                  }
                  entity_name
              }
              created_at
              user_status
              count_document
          }
          }
      `,
        variables: {
          page: pagination,
          sort: sortValue ? sortValue : {},
          title: title,
          school: school,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getAllUserExport(): Observable<UserTableData[]> {
    return this.apollo
      .watchQuery<UserTableData[]>({
        query: gql`
          query {
            GetAllUsers(exclude_company: true) {
              _id
              email
              civility
              first_name
              last_name
              entities {
                school {
                  _id
                  short_name
                }
                group_of_schools {
                  _id
                  short_name
                  long_name
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
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getGroupChiefAcademicData(userId: string) {
    return this.apollo
      .query({
        query: gql`
      query {
        GetOneUser(_id: "${userId}") {
          _id
          email
          entities {
            entity_name
            group_of_schools {
              _id
              short_name
              logo
            }
            group_of_school{
              _id
              headquarter {
                _id
                short_name
              }
              school_members {
                _id
                short_name
              }
            }
          }
        }
      }
    `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneUser']));
  }

  getUserTypeId(userType: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query {
        GetAllUserTypes(search: "${userType}") {
          _id
          name
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  sendReminderUserN1(lang, userId): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ($lang: String, $user_id: ID!) {
            SendReminderUserN1(lang: $lang, user_id: $user_id)
          }
        `,
        variables: {
          lang,
          user_id: userId,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['SendReminderUserN1']));
  }

  updateUser(_id: string, user_input: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateUser($_id: ID!, $lang: String!, $user_input: UserInput!) {
            UpdateUser(_id: $_id, lang: $lang, user_input: $user_input) {
              _id
            }
          }
        `,
        variables: {
          _id,
          lang: localStorage.getItem('currentLang'),
          user_input,
        },
      })
      .pipe(map((resp) => resp.data['UpdateUser']));
  }

  // ----------------------------------------------------------
  // ===================== DUMMY DATA =========================
  // ----------------------------------------------------------

  @Cacheable()
  getUserDetails(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/user-details.json');
  }
}
