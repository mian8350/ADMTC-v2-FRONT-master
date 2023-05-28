import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Cacheable } from 'ngx-cacheable';
import { Apollo } from 'apollo-angular';
import { ClassIdAndName, RncpTitleIdAndName, ClassInput, RncpTitleCardData, ClassData } from 'app/rncp-titles/RncpTitle.model';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { environment } from 'environments/environment';

@Injectable({
  providedIn: 'root',
})
export class RNCPTitlesService {
  private selectedTitleSource = new BehaviorSubject<RncpTitleCardData>(null);
  private scrollEvent = new BehaviorSubject<any>(null);
  private _childrenFormValidationStatus: boolean = true;

  getScrollEvent$ = this.scrollEvent.asObservable();

  setEventScroll(data: any) {
    this.scrollEvent.next(data);
  }

  setSelectedTitle(title: RncpTitleCardData) {
    this.selectedTitleSource.next(title);
  }

  getSelectedTitle() {
    return this.selectedTitleSource.value;
  }

  public get childrenFormValidationStatus() {
    return this._childrenFormValidationStatus;
  }

  public set childrenFormValidationStatus(state: boolean) {
    this._childrenFormValidationStatus = state;
  }

  constructor(private httpClient: HttpClient, private apollo: Apollo, private translate: TranslateService) {}

  private scoreData = new BehaviorSubject<any>(null);

  selectedDataStudent$ = this.scoreData.asObservable();

  setDataScore(data: any) {
    this.scoreData.next(data);
  }

  downloadFile(params) {
    const url = environment.apiUrl.replace('/graphql', '');
    return this.httpClient.post(`${url}/download/statusUpdateCsv`, params, { responseType: 'text' }).pipe(map((res: any) => res));
  }

  downloadGrandOralResult(payload) {
    const url = environment.apiUrl.replace('/graphql', '');
    return this.httpClient.post(`${url}/download/grandOralPdfFinalTranscript`, payload, { responseType: 'json' }).pipe(map((res) => res));
  }

  getCountries() {
    return [
      'Albania',
      'Armenia',
      'Austria',
      'Belarus',
      'Belgium',
      'Bolivia',
      'Bosnia and Herzegovina',
      'Croatia',
      'Cyprus',
      'Czech Republic',
      'Denmark',
      'Estonia',
      'Ethiopia',
      'Finland',
      'France',
      'Georgia',
      'Germany',
      'Greece',
      'Greenland',
      'Hungary',
      'Iceland',
      'Ireland',
      'Isle of Man',
      'Israel',
      'Italy',
      'Latvia',
      'Lesotho',
      'Liberia',
      'Liechtenstein',
      'Lithuania',
      'Luxembourg',
      'Maldives',
      'Netherlands',
      'Netherlands',
      'Norway',
      'Poland',
      'Portugal',
      'Romania',
      'Senegal',
      'Serbia and Montenegro',
      'Slovakia',
      'Slovenia',
      'Spain',
      'Sweden',
      'Switzerland',
      'United Kingdom',
      'Venezuela',
    ];
  }

  getEnumTaskType() {
    return [
      {
        name: 'Assign Corrector',
        value: 'Assign Corrector',
      },
      {
        name: 'Assign Grand Oral Corrector',
        value: 'assign_corrector_grand_oral',
      },
      {
        name: 'Marks Entry',
        value: 'Marks Entry',
      },
      {
        name: 'Mark Entry Grand Oral',
        value: 'mark_entry_grand_oral',
      },
      {
        name: 'Mark Entry Retake Grand Oral',
        value: 'mark_entry_retake_grand_oral',
      },
      {
        name: 'Validate Test',
        value: 'Validate Test',
      },
      {
        name: 'Document Expected',
        value: 'document_expected',
      },
      {
        name: 'Create Groups',
        value: 'Create Groups',
      },
      {
        name: 'Assign Student',
        value: 'assign_student_for_jury',
      },
      {
        name: 'Upload Grand Oral CV',
        value: 'student_upload_grand_oral_cv',
      },
      {
        name: 'Upload Grand Oral Certification Passport',
        value: 'student_upload_grand_oral_presentation',
      },
      {
        name: 'Student Upload Retake Grand Oral Certification Passport',
        value: 'student_upload_retake_grand_oral_presentation',
      },
      {
        name: 'Student Upload Retake Grand Oral CV',
        value: 'student_upload_retake_grand_oral_cv',
      },
      {
        name: 'Complete Admission form',
        value: 'student_complete_admission_process',
      },
      {
        name: 'Validate Step of Admission Process',
        value: 'validate_admission_process',
      },
      {
        name: 'Validate Admission form',
        value: 'final_validate_admission_process',
      },
      {
        name: 'Revision Student Admission Process',
        value: 'revision_admission_proses',
      },
      {
        name: 'Activate Student Contract',
        value: 'activate_student_contract',
      },
      {
        name: 'Student Admission - Contract to sign',
        value: 'sign_contract_process_student_admission',
      },
      {
        name: 'Quality Form to complete',
        value: 'complete_form_process',
      },
      {
        name: 'Quality Form to revision',
        value: 'revision_form_proses',
      },
      {
        name: 'Quality Form to validate',
        value: 'validate_form_process',
      },
      {
        name: 'Quality form - Contract to sign',
        value: 'sign_contract_process_quality_form',
      },
      {
        name: 'Quality Form to final validate',
        value: 'final_validate_form_process',
      },
      {
        name: 'Employability Survey to complete',
        value: 'complete_employability_survey',
      },
      {
        name: 'Employability Survey to revision',
        value: 'revision_employability_survey',
      },
      {
        name: 'Employability Survey to validate',
        value: 'validate_employability_survey',
      },
      {
        name: 'Employability Survey to final validate',
        value: 'final_validate_employability_survey',
      },
      {
        name: 'Task Builder',
        value: 'task_builder',
      },
    ];
  }

  getTaskTypeList() {
    return [
      {
        name: 'Assign Corrector',
        value: 'Assign Corrector',
      },
      {
        name: 'Assign Grand Oral Corrector',
        value: 'assign_corrector_grand_oral',
      },
      {
        name: 'Marks Entry',
        value: 'Marks Entry',
      },
      {
        name: 'Mark Entry Grand Oral',
        value: 'mark_entry_grand_oral',
      },
      {
        name: 'Mark Entry Retake Grand Oral',
        value: 'mark_entry_retake_grand_oral',
      },
      {
        name: 'Validate Test',
        value: 'Validate Test',
      },
      {
        name: 'Document Expected',
        value: 'document_expected',
      },
      {
        name: 'Create Groups',
        value: 'Create Groups',
      },
      {
        name: 'Assign Student',
        value: 'assign_student_for_jury',
      },
      {
        name: 'Upload Grand Oral CV',
        value: 'student_upload_grand_oral_cv',
      },
      {
        name: 'Upload Grand Oral Certification Passport',
        value: 'student_upload_grand_oral_presentation',
      },
      {
        name: 'Student Upload Retake Grand Oral Certification Passport',
        value: 'student_upload_retake_grand_oral_presentation',
      },
      {
        name: 'Student Upload Retake Grand Oral CV',
        value: 'student_upload_retake_grand_oral_cv',
      },
      {
        name: 'Complete Admission form',
        value: 'student_complete_admission_process',
      },
      {
        name: 'Validate Step of Admission Process',
        value: 'validate_admission_process',
      },
      {
        name: 'Validate Admission form',
        value: 'final_validate_admission_process',
      },
      {
        name: 'Revision Student Admission Process',
        value: 'revision_admission_proses',
      },
      {
        name: 'Activate Student Contract',
        value: 'activate_student_contract',
      },
      {
        name: 'Student Admission - Contract to sign',
        value: 'sign_contract_process_student_admission',
      },
      {
        name: 'Quality Form to complete',
        value: 'complete_form_process',
      },
      {
        name: 'Quality Form to revision',
        value: 'revision_form_proses',
      },
      {
        name: 'Quality Form to validate',
        value: 'validate_form_process',
      },
      {
        name: 'Quality form - Contract to sign',
        value: 'sign_contract_process_quality_form',
      },
      {
        name: 'Quality Form to final validate',
        value: 'final_validate_form_process',
      },
      {
        name: 'Employability Survey to complete',
        value: 'complete_employability_survey',
      },
      {
        name: 'Employability Survey to revision',
        value: 'revision_employability_survey',
      },
      {
        name: 'Employability Survey to validate',
        value: 'validate_employability_survey',
      },
      {
        name: 'Employability Survey to final validate',
        value: 'final_validate_employability_survey',
      },
      {
        name: 'Task Builder',
        value: 'task_builder',
      },
      {
        name: 'Calendar Steps',
        value: 'calendar_step',
      },
      {
        name: 'complete job description',
        value: 'complete_job_description',
      },
      {
        name: 'Add Task',
        value: 'add_task',
      },
      {
        name: 'revision job description',
        value: 'revision_job_description',
      },
      {
        name: 'validate job description',
        value: 'validate_job_description',
      },
      {
        name: 'Send Job description',
        value: 'job_description_task',
      },
    ];
  }

  getTitleDropdown(shouldHaveClass: boolean) {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
        query {
          GetAllTitles(should_have_class: ${shouldHaveClass}) {
            _id
            short_name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getTitleDropdownHaveStudent(shouldHaveClass: boolean, shouldHaveStudent: boolean) {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
        query {
          GetAllTitles(should_have_class: ${shouldHaveClass}, should_have_student: ${shouldHaveStudent}) {
            _id
            short_name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getTitleDropdownForUserType(shouldHaveClass: boolean, user_login_type, filter_by_user_login) {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
        query {
          GetAllTitles(should_have_class: ${shouldHaveClass}, user_login_type: "${user_login_type}", filter_by_user_login: ${filter_by_user_login}) {
            _id
            short_name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getAllPublishedWithClassTitleDropdown(shouldHaveClass: boolean) {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
        query {
          GetAllTitles(should_have_class: ${shouldHaveClass}, is_published: true) {
            _id
            short_name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getTitleSearchDropdown(search: string) {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
        query {
          GetTitleDropdownList(should_have_class: ${true}, search: "${search}") {
            _id
            short_name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetTitleDropdownList']));
  }

  getAllTitleWithClasses() {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
          query {
            GetAllTitles(should_have_class: true) {
              _id
              short_name
              certifier {
                _id
              }
              classes {
                _id
                name
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getScholarSeasons() {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllScholarSeasons {
              _id
              scholar_season
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllScholarSeasons']));
  }

  getTitleConditionSearchDropdown(evaType: string, subType: string) {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
        query {
          GetTitleDropdownList(
            should_have_class_with_condition: ${true},
            type_evaluation: ${evaType},
            sub_type_evaluation: ${subType}
            ) {
            _id
            short_name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetTitleDropdownList']));
  }

  getTitleConditionSearchNotScore(evaType: string) {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
        query {
          GetTitleDropdownList(
            should_have_class_with_condition: ${true},
            type_evaluation: ${evaType}
            ) {
            _id
            short_name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetTitleDropdownList']));
  }

  getClassDropdown(id: string, search: string) {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
        query {
          GetClassDropdownList(rncp_id: "${id}", search: "${search}") {
            _id
            name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetClassDropdownList']));
  }

  getClassConditionDropdown(id: string, search: string, evaType: string) {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
        query {
          GetClassDropdownList(should_have_condition: ${true}, rncp_id: "${id}", search: "${search}", type_evaluation: ${evaType}) {
            _id
            name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetClassDropdownList']));
  }

  getClassConditionDropdownWithScore(id: string, search: string, evaType: string, subType: string) {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
        query {
          GetClassDropdownList(
            should_have_condition: ${true},
            rncp_id: "${id}",
            search: "${search}",
            type_evaluation: ${evaType},
            sub_type_evaluation : ${subType}) {
            _id
            name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetClassDropdownList']));
  }

  getOneTitleById(id: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneTitle(_id: "${id}") {
            _id
            rncp_logo
            is_certifier_also_pc
            short_name
            long_name
            rncp_code
            rncp_level
            rncp_level_europe
            is_published
            journal_text
            journal_date
            certifier {
              _id
              short_name
              long_name
              logo
              school_address {
                region
                postal_code
                department
                city
                country
                address1
                address2
                is_main_address
              }
            }
            admtc_dir_responsible {
              _id
              first_name
              last_name
              civility
            }
            secondary_admtc_dir_responsible {
              _id
              first_name
              last_name
              civility
            }
            year_of_certification
            name_of_signatory
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTitle']));
  }

  // getSchoolList(titleId: string): Observable<any> {
  //   return this.apollo
  //     .query({
  //       query: gql`
  //       query {
  //         GetOneTitle(_id: "${titleId}") {
  //           _id
  //           preparation_centers {
  //             _id
  //             short_name
  //           }
  //         }
  //       }
  //     `,
  //       fetchPolicy: 'network-only',
  //     })
  //     .pipe(map((resp) => resp.data['GetOneTitle']['preparation_centers']));
  // }

  getSchoolListByClass(titleId: string, classId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllSchoolsForTest($rncp_title_ids: [ID], $class_id: ID) {
            GetAllSchools(rncp_title_ids: $rncp_title_ids, class_id: $class_id) {
              _id
              short_name
            }
          }
        `,
        variables: {
          rncp_title_ids: [titleId],
          class_id: classId,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllSchools']));
  }

  getSchoolListBySchoolId(titleId: string, classId: string, school_ids?): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllSchoolsForTileGov($rncp_title_ids: [ID], $class_id: ID, $school_ids: [ID]) {
            GetAllSchools(rncp_title_ids: $rncp_title_ids, class_id: $class_id, school_ids: $school_ids) {
              _id
              short_name
            }
          }
        `,
        variables: {
          rncp_title_ids: [titleId],
          class_id: classId,
          school_ids: [school_ids],
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllSchools']));
  }

  getAllZipCode(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllZipCodes {
              city
              province
              country
            }
          }
        `,
      })
      .pipe(map((resp) => resp.data['GetAllZipCodes']));
  }

  getFilteredZipCode(zip_code: string, country: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetAllZipCodes(zip_code: "${zip_code}", country: "${country}") {
          city
          province
          academy
          department
        }
      }
      `,
      })
      .pipe(map((resp) => resp.data['GetAllZipCodes']));
  }

  getPublishedRncpTitlesWithNonNullClass(): Observable<RncpTitleCardData[]> {
    return this.apollo
      .query<RncpTitleCardData[]>({
        query: gql`
          query {
            GetAllTitles(is_published: true, should_have_class: true) {
              _id
              short_name
              long_name
              rncp_level
              rncp_level_europe
              is_published
              certifier {
                _id
                short_name
                logo
              }
              admtc_dir_responsible {
                _id
                first_name
                last_name
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getRncpTitlesDetails(is_published?: boolean, should_have_class?: boolean): Observable<RncpTitleCardData[]> {
    return this.apollo
      .query<RncpTitleCardData[]>({
        query: gql`
          query {
            GetAllTitles {
              _id
              short_name
              long_name
              rncp_level
              rncp_level_europe
              is_published
              certifier {
                _id
                short_name
                logo
              }
              admtc_dir_responsible {
                _id
                first_name
                last_name
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }
  getRncpTitlesManager(admtc_dir_responsible?): Observable<RncpTitleCardData[]> {
    return this.apollo
      .query<RncpTitleCardData[]>({
        query: gql`
          query GetAllTitles($admtc_dir_responsible: ID) {
            GetAllTitles(admtc_dir_responsible: $admtc_dir_responsible) {
              _id
              short_name
              long_name
              rncp_level
              rncp_level_europe
              is_published
              certifier {
                _id
                short_name
                logo
              }
              admtc_dir_responsible {
                _id
                first_name
                last_name
              }
            }
          }
        `,
        variables: {
          admtc_dir_responsible: admtc_dir_responsible ? admtc_dir_responsible : null,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getRncpTitlesForUrgent(search): Observable<RncpTitleCardData[]> {
    return this.apollo
      .query<RncpTitleCardData[]>({
        query: gql`
          query {
            GetTitleDropdownList(search: "${search}") {
              _id
              short_name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetTitleDropdownList']));
  }

  getRncpTitlesForTutorial(): Observable<any[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query {
            GetAllTitles {
              _id
              short_name
              long_name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getRncpTitlesForTutorialAcad(rncp_title_ids): Observable<any[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query ($rncp_title_ids: [ID]) {
            GetAllTitles(rncp_title_ids: $rncp_title_ids) {
              _id
              short_name
              long_name
            }
          }
        `,
        variables: {
          rncp_title_ids: rncp_title_ids,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getRncpTitlesByUser(isPublished: boolean, filterByUsedLogin = 'all'): Observable<RncpTitleCardData[]> {
    return this.apollo
      .query<RncpTitleCardData[]>({
        query: gql`
          query ($is_published: Boolean, $filter_by_user_login: EnumFilterByUserLogin) {
            GetAllTitles(is_published: $is_published, filter_by_user_login: $filter_by_user_login) {
              _id
              short_name
              long_name
              rncp_level
              rncp_level_europe
              is_published
              certifier {
                _id
                short_name
              }
              admtc_dir_responsible {
                _id
                first_name
                last_name
              }
            }
          }
        `,
        variables: {
          is_published: isPublished,
          filter_by_user_login: filterByUsedLogin,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getRncpTitlesByUserForAcademic(
    isPublished: boolean,
    titleId: string[],
    should_have_class: boolean,
    class_ids_should_have_academic_kit: string[],
    is_archived?: boolean,
  ): Observable<RncpTitleCardData[]> {
    return this.apollo
      .query<RncpTitleCardData[]>({
        query: gql`
          query getAllTitleAcademicPC(
            $is_published: Boolean
            $rncp_title_ids: [ID]
            $should_have_class: Boolean
            $class_ids_should_have_academic_kit: [ID]
            $is_archived: Boolean
          ) {
            GetAllTitles(
              is_published: $is_published
              rncp_title_ids: $rncp_title_ids
              should_have_class: $should_have_class
              class_ids_should_have_academic_kit: $class_ids_should_have_academic_kit
              is_archived: $is_archived
            ) {
              _id
              short_name
              long_name
              rncp_level
              rncp_level_europe
              is_published
              certifier {
                _id
                short_name
                logo
              }
              admtc_dir_responsible {
                _id
                first_name
                last_name
              }
            }
          }
        `,
        variables: {
          is_published: isPublished,
          rncp_title_ids: titleId,
          should_have_class: should_have_class ? should_have_class : false,
          class_ids_should_have_academic_kit: class_ids_should_have_academic_kit,
          is_archived: is_archived,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getRncpTitlesByUserForCertifierDirMin(
    isPublished: boolean,
    titleId: string[],
    should_have_class: boolean,
    is_any_class_should_have_academic_kit: boolean,
  ): Observable<RncpTitleCardData[]> {
    return this.apollo
      .query<RncpTitleCardData[]>({
        query: gql`
          query getAllTitleAcademicPC(
            $is_published: Boolean
            $rncp_title_ids: [ID]
            $should_have_class: Boolean
            $is_any_class_should_have_academic_kit: Boolean
          ) {
            GetAllTitles(
              is_published: $is_published
              rncp_title_ids: $rncp_title_ids
              should_have_class: $should_have_class
              is_any_class_should_have_academic_kit: $is_any_class_should_have_academic_kit
            ) {
              _id
              short_name
              long_name
              rncp_level
              rncp_level_europe
              is_published
              certifier {
                _id
                short_name
                logo
              }
              admtc_dir_responsible {
                _id
                first_name
                last_name
              }
            }
          }
        `,
        variables: {
          is_published: isPublished,
          rncp_title_ids: titleId,
          should_have_class: should_have_class ? should_have_class : false,
          is_any_class_should_have_academic_kit: is_any_class_should_have_academic_kit ? is_any_class_should_have_academic_kit : false,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getRncpTitlesForAcademic(titleId: string[]): Observable<RncpTitleCardData[]> {
    return this.apollo
      .query<RncpTitleCardData[]>({
        query: gql`
          query ($rncp_title_ids: [ID]) {
            GetAllTitles(rncp_title_ids: $rncp_title_ids) {
              _id
              short_name
              long_name
              rncp_level
              rncp_level_europe
              is_published
              certifier {
                _id
                short_name
              }
              admtc_dir_responsible {
                _id
                first_name
                last_name
              }
            }
          }
        `,
        variables: {
          rncp_title_ids: titleId,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getRncpTitlesBySchoolChiefGroup(
    isPublished: boolean,
    schoolId,
    should_have_class: boolean,
    class_ids_should_have_academic_kit: string[],
  ): Observable<RncpTitleCardData[]> {
    return this.apollo
      .query<RncpTitleCardData[]>({
        query: gql`
          query ($is_published: Boolean, $school_id: [String], $should_have_class: Boolean, $class_ids_should_have_academic_kit: [ID]) {
            GetAllTitles(
              is_published: $is_published
              school_id: $school_id
              should_have_class: $should_have_class
              class_ids_should_have_academic_kit: $class_ids_should_have_academic_kit
            ) {
              _id
              short_name
              long_name
              rncp_level
              rncp_level_europe
              is_published
              certifier {
                _id
                short_name
                logo
              }
              admtc_dir_responsible {
                _id
                first_name
                last_name
              }
            }
          }
        `,
        variables: {
          is_published: isPublished,
          school_id: schoolId,
          should_have_class: should_have_class ? should_have_class : false,
          class_ids_should_have_academic_kit: class_ids_should_have_academic_kit,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getRncpTitlesBySchoolTypeAndId(schoolType: string, schoolId: string): Observable<RncpTitleIdAndName[]> {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
        query getAllTitleDropdownUserDialog {
          GetAllTitles(school_type: "${schoolType}", school_id: "${schoolId}") {
            _id
            short_name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getRncpTitlesBySchoolTypeAndUserLogin(
    schoolType: string,
    schoolId: string,
    filter_by_user_login: string,
  ): Observable<RncpTitleIdAndName[]> {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
        query getAllTitleDropdownUserDialog($filter_by_user_login: EnumFilterByUserLogin) {
          GetAllTitles(school_type: "${schoolType}", school_id: "${schoolId}", filter_by_user_login: $filter_by_user_login) {
            _id
            short_name
          }
        }
      `,
        variables: {
          filter_by_user_login,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getRncpTitlesBySchoolId(schoolId: string): Observable<RncpTitleIdAndName[]> {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
        query GetTitleDropdown {
          GetAllTitles(school_id: "${schoolId}", school_type: "preparation_center") {
            _id
            short_name
          }
        }
      `,
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getRncpTitlesDropdownForCorrectorProblematic(schoolId: string, usertypeId: string): Observable<RncpTitleIdAndName[]> {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
        query GetTitleDropdownProblematic {
          GetAllTitles(school_id: "${schoolId}", user_login_type: "${usertypeId}") {
            _id
            short_name
          }
        }
      `,
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getClassDropdownForCorrectorProblematic(rncpId: string, usertypeId: string): Observable<RncpTitleIdAndName[]> {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
        query GetClassDropdownProblematic {
          GetAllClasses(rncp_id: "${rncpId}", user_login_type: "${usertypeId}") {
            _id
            name
            status
          }
        }
      `,
      })
      .pipe(map((resp) => resp.data['GetAllClasses']));
  }

  getRncpTitlesCompany(): Observable<RncpTitleIdAndName[]> {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
          query {
            GetAllTitles(school_type: "preparation_center") {
              _id
              short_name
            }
          }
        `,
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getTitleByAcadir(schoolId: string): Observable<RncpTitleIdAndName[]> {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
        query{
          GetAllTitles(filter_by_user_login: acadir, school_id: "${schoolId}"){
            _id
            short_name
          }
        }
      `,
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getClasses(): Observable<ClassIdAndName[]> {
    return this.apollo
      .query<ClassIdAndName[]>({
        query: gql`
          query {
            GetAllClasses {
              _id
              name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllClasses']));
  }

  getClassesByTitle(rncpId: string): Observable<ClassIdAndName[]> {
    return this.apollo
      .query<ClassIdAndName[]>({
        query: gql`
        query {
          GetAllClasses(rncp_id: "${rncpId}") {
            _id
            name
            type_evaluation
            already_have_jury_decision
            specializations {
              _id
              name
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllClasses']));
  }

  getClassesByTitleAndHasStudent(rncpId: string, shouldHaveStudent: boolean): Observable<ClassIdAndName[]> {
    return this.apollo
      .query<ClassIdAndName[]>({
        query: gql`
        query {
          GetAllClasses(rncp_id: "${rncpId}", should_have_student: ${shouldHaveStudent}) {
            _id
            name
            type_evaluation
            already_have_jury_decision
            specializations {
              _id
              name
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllClasses']));
  }

  getClassesByTitleAndPC(rncpId: string, pcId: string): Observable<ClassIdAndName[]> {
    return this.apollo
      .query<ClassIdAndName[]>({
        query: gql`
        query getClassesByTitleAndPC($filter: ClassFilterInput){
          GetAllClasses(rncp_id: "${rncpId}", filter: $filter) {
            _id
            name
            status
            type_evaluation
            already_have_jury_decision
            specializations {
              _id
              name
            }
            registration_period {
              start_date {
                date
                time
              }
              end_date {
                date
                time
              }
            }
          }
        }
      `,
        variables: {
          filter: {
            preparation_center_school_id: pcId,
          },
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllClasses']));
  }

  getClassOfTitle(rncpId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneTitle(_id: "${rncpId}") {
            classes {
              _id
              name
              status
              academic_kit {
                is_created
              }
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTitle']['classes']));
  }

  getSpecializations(rncpId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneTitle(_id: "${rncpId}") {
            specializations {
              _id
              name
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTitle']['specializations']));
  }

  getSelectedRncpTitle() {
    return {
      long_name: 'Responsable Administratif Bilingue - Office Manager',
      rncp_level: '6',
      short_name: 'S-RAB 2020',
      _id: '5b69d1c481935943d24d25e8',
      is_published: true,
    };
  }

  createNewTitle(payload: any): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation createTitle($title_input: RncpTitleInput) {
          CreateTitle(title_input: $title_input) {
            _id
          }
        }
      `,
      variables: {
        title_input: payload,
      },
      errorPolicy: 'all',
    });
  }

  createTask(payload: any, schoolId): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateTask($task_input: AcadTaskInput, $lang: String!, $user_login_school_id: ID) {
            CreateTask(task_input: $task_input, lang: $lang, user_login_school_id: $user_login_school_id) {
              _id
            }
          }
        `,
        variables: {
          user_login_school_id: schoolId,
          task_input: payload,
          lang: localStorage.getItem('currentLang'),
        },
      })
      .pipe(map((resp) => resp.data['CreateTask']));
  }

  updateTask(payload: any, taskId): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateTask($task_input: AcadTaskInput, $_id: ID!) {
            UpdateTask(task_input: $task_input, _id: $_id) {
              _id
            }
          }
        `,
        variables: {
          _id: taskId,
          task_input: payload,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['UpdateTask']));
  }

  createTaskNonSchool(payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateTask($task_input: AcadTaskInput, $lang: String!) {
            CreateTask(task_input: $task_input, lang: $lang) {
              _id
            }
          }
        `,
        variables: {
          task_input: payload,
          lang: localStorage.getItem('currentLang'),
        },
      })
      .pipe(map((resp) => resp.data['CreateTask']));
  }

  getFilteredCertifierSchool(search: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetSchoolDropdownList(search: "${search}", school_type:"certifier") {
            _id
            short_name
            long_name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetSchoolDropdownList']));
  }

  getAllCertifierSchool(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllCertifierSchool {
            GetSchoolDropdownList(school_type: "certifier") {
              _id
              long_name
              short_name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetSchoolDropdownList']));
  }

  getFilteredAllSchool(search: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetSchoolDropdownList(search: "${search}") {
            _id
            short_name
            long_name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetSchoolDropdownList']));
  }

  getOneCertifierSchool(schoolId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneSchool(_id:"${schoolId}") {
            _id
            short_name
            long_name
            logo
            school_address {
              address1
              address2
              postal_code
              country
              city
              region
              department
              is_main_address
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneSchool']));
  }

  getSchoolName(schoolId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneSchool(_id:"${schoolId}") {
            _id
            short_name
            long_name
            logo
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneSchool']));
  }

  getSchoolConnectedTitleClass(schoolId: string): Observable<any> {
    return this.apollo
      .watchQuery<any>({
        query: gql`
      query {
        GetOneSchool(_id: "${schoolId}") {
          _id
          preparation_center_ats {
            rncp_title_id {
              _id
            }
            class_id {
              _id
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetOneSchool']));
  }

  getCertifierSchool(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllSchools(school_type: "certifier") {
              _id
              short_name
              long_name
              logo
              school_address {
                address1
                address2
                postal_code
                city
                country
                region
                department
              }
            }
          }
        `,
      })
      .pipe(map((resp) => resp.data['GetAllSchools']));
  }

  getAllSchoolDropdown(rncp_title_ids): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllSchools($rncp_title_ids: [ID]) {
            GetAllSchools(rncp_title_ids: $rncp_title_ids) {
              _id
              short_name
              long_name
              logo
              school_address {
                address1
                address2
                postal_code
                city
                country
                region
                department
              }
            }
          }
        `,
        variables: {
          rncp_title_ids: rncp_title_ids ? rncp_title_ids : '',
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllSchools']));
  }

  // getPendingTask(): Observable<any> {
  // }

  // ----------------------------------------------------------
  // ===================== DUMMY DATA =========================
  // ----------------------------------------------------------

  @Cacheable()
  getRncpTitles(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/rncp-titles.json');
  }

  @Cacheable()
  getShortRncpTitles(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/short-rncp-titles.json');
  }

  @Cacheable()
  getPendingTask(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/pendingtask.json');
  }

  @Cacheable()
  getCalendar(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/calendar.json');
  }

  @Cacheable()
  getAcademicKit(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/academickit.json');
  }

  @Cacheable()
  getAcadClass(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/acadClass.json');
  }

  @Cacheable()
  getAcadDocuments(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/acadDocuments.json');
  }

  // ----------------------------------------------------------
  // ===================== END OF DUMMY DATA ==================
  // ----------------------------------------------------------

  getTitleName(titleId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetOneTitle($titleId: ID!) {
            GetOneTitle(_id: $titleId) {
              short_name
              long_name
            }
          }
        `,
        variables: {
          titleId,
        },
      })
      .pipe(
        map((resp) => {
          return resp.data['GetOneTitle'];
        }),
      );
  }

  // Pending Task CRUD
  getAllPendingTasks(titleId: string, pagination, sorting, filter, userTypeId) {
    return this.apollo
      .query({
        query: gql`
          query GetPendingTasks(
            $titleId: ID
            $pagination: PaginationInput
            $sorting: PendingTaskSorting
            $filter: PendingTaskFilter
            $userTypeId: ID
          ) {
            GetPendingTasks(rncp_id: $titleId, pagination: $pagination, sorting: $sorting, filter: $filter, user_login_type: $userTypeId) {
              _id
              test_group_id {
                _id
                name
              }
              jury_id {
                _id
                name
                type
              }
              due_date {
                date
                time
              }
              created_date {
                date
                time
              }
              school {
                _id
                short_name
              }
              rncp {
                _id
                short_name
                admtc_dir_responsible {
                  _id
                  first_name
                  last_name
                }
                secondary_admtc_dir_responsible {
                  _id
                  first_name
                  last_name
                }
              }
              class_id {
                _id
                name
                jury_process_name
              }
              created_by {
                _id
                civility
                first_name
                last_name
              }
              user_selection {
                user_id {
                  _id
                  civility
                  first_name
                  last_name
                  student_id {
                    _id
                  }
                }
                user_type_id {
                  _id
                  name
                }
              }
              description
              type
              test {
                _id
                date_type
                name
                group_test
                correction_type
                subject_id {
                  subject_name
                }
                evaluation_id {
                  _id
                  evaluation
                }
                parent_category {
                  _id
                  folder_name
                }
              }
              jury_id {
                _id
                name
                type
                jury_activity
                jury_correctors {
                  _id
                  first_name
                  last_name
                }
                jury_members {
                  _id
                  students {
                    student_id {
                      _id
                    }
                    date_test
                    test_hours_start
                  }
                }
              }
              priority
              count_document
              expected_document_id
              task_status
              for_each_student
              for_each_group
              expected_document {
                file_type
              }
              student_id {
                _id
                first_name
                last_name
                civility
              }
              action_taken
              document_expecteds {
                name
              }
              employability_survey_id {
                _id
                employability_survey_process_id {
                  name
                }
              }
              form_process_id {
                _id
                form_builder_id {
                  template_type
                }
              }
              form_process_step_id {
                step_title
                step_type
              }
            }
          }
        `,
        variables: {
          titleId,
          sorting,
          pagination,
          filter,
          userTypeId,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetPendingTasks'];
        }),
      );
  }

  getAllPendingTasksBySchool(titleId: string, pagination, sorting, filter, schoolId, userTypeId) {
    return this.apollo
      .query({
        query: gql`
          query GetPendingTasks(
            $titleId: ID
            $pagination: PaginationInput
            $sorting: PendingTaskSorting
            $filter: PendingTaskFilter
            $school_id: ID
            $userTypeId: ID
          ) {
            GetPendingTasks(
              rncp_id: $titleId
              pagination: $pagination
              sorting: $sorting
              filter: $filter
              school_id: $school_id
              user_login_type: $userTypeId
            ) {
              _id
              test_group_id {
                _id
                name
              }
              created_date {
                date
                time
              }
              due_date {
                date
                time
              }
              school {
                _id
                short_name
              }
              rncp {
                _id
                short_name
                admtc_dir_responsible {
                  _id
                  first_name
                  last_name
                }
                secondary_admtc_dir_responsible {
                  _id
                  first_name
                  last_name
                }
              }
              class_id {
                _id
                name
                jury_process_name
              }
              created_by {
                _id
                civility
                first_name
                last_name
              }
              user_selection {
                user_id {
                  _id
                  civility
                  first_name
                  last_name
                  student_id {
                    _id
                  }
                }
                user_type_id {
                  _id
                  name
                }
              }
              description
              type
              test {
                _id
                date_type
                name
                group_test
                correction_type
                subject_id {
                  subject_name
                }
                evaluation_id {
                  _id
                  evaluation
                }
                parent_category {
                  _id
                  folder_name
                }
              }
              priority
              count_document
              expected_document_id
              task_status
              for_each_student
              for_each_group
              expected_document {
                file_type
              }
              student_id {
                _id
                first_name
                last_name
                civility
              }
              action_taken
              document_expecteds {
                name
              }
              jury_id {
                _id
                name
                type
                jury_activity
                jury_correctors {
                  _id
                  first_name
                  last_name
                }
                jury_members {
                  _id
                  students {
                    student_id {
                      _id
                    }
                    date_test
                    test_hours_start
                  }
                }
              }
              form_process_id {
                _id
                form_builder_id {
                  template_type
                }
              }
              form_process_step_id {
                step_title
                step_type
              }
            }
          }
        `,
        variables: {
          titleId,
          sorting,
          pagination,
          filter,
          school_id: schoolId,
          userTypeId,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetPendingTasks'];
        }),
      );
  }

  checkPendingTask(rncp_id, school_id, filter, pagination = { limit: 1, page: 0 }) {
    return this.apollo
      .query({
        query: gql`
          query GetPendingTasks($school_id: ID, $rncp_id: ID, $filter: PendingTaskFilter, $pagination: PaginationInput) {
            GetPendingTasks(school_id: $school_id, rncp_id: $rncp_id, filter: $filter, pagination: $pagination) {
              _id
            }
          }
        `,
        variables: {
          rncp_id,
          pagination,
          school_id,
          filter,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetPendingTasks'];
        }),
      );
  }

  // End of Pending Task CRUD

  // Get all rncpTitle only short name and long name
  getRncpTitleListData(should_have_condition_of_award?: boolean): Observable<any[]> {
    const shouldHaveCondition: boolean = should_have_condition_of_award ? should_have_condition_of_award : false;
    return this.apollo
      .query({
        query: gql`
        query {
          GetAllTitles(should_have_condition_of_award: ${shouldHaveCondition}) {
            _id
            short_name
            long_name
            classes {
              _id
              name
            }
          }
        }
      `,
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllTitles'];
        }),
      );
  }

  // Get all rncpTitle only short name and long name
  getAllRncpTitleListData(should_have_condition_of_award, rncp_title_ids): Observable<any[]> {
    const shouldHaveCondition: boolean = should_have_condition_of_award ? should_have_condition_of_award : false;
    return this.apollo
      .query({
        query: gql`
        query($rncp_title_ids: [ID]) {
          GetAllTitles(should_have_condition_of_award: ${shouldHaveCondition}, rncp_title_ids: $rncp_title_ids) {
            _id
            short_name
            long_name
          }
        }
      `,
        variables: {
          rncp_title_ids: rncp_title_ids,
        },
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllTitles'];
        }),
      );
  }

  getRncpTitleListSearch(school_id): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetAllTitles(school_id: "${school_id}") {
            _id
            short_name
            long_name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllTitles'];
        }),
      );
  }

  getUserTypeListSearch(school_id): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
        query GetDropdownUserType($exclude_company: Boolean){
          GetAllUserTypes(school: "${school_id}", exclude_company: $exclude_company) {
            _id
            name
            entity
          }
        }
      `,
        variables: {
          exclude_company: true,
        },
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllUserTypes'];
        }),
      );
  }

  getClassByRncpTitleDuplicate(rncpId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetAllClasses(rncp_id: "${rncpId}") {
            _id
            name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp['data']['GetAllClasses'];
        }),
      );
  }

  // Get all class by rncp title
  getClassByRncpTitle(rncpId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetAllClasses(rncp_id: "${rncpId}") {
            _id
            name
            description
            type_evaluation
            is_class_header
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp['data']['GetAllClasses'];
        }),
      );
  }

  getAllClassByRncpTitleForAcadKit(rncpId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetAllClasses(rncp_id: "${rncpId}") {
            _id
            name
            jury_process_name
            description
            academic_kit {
              is_created
            }
            is_class_header
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp['data']['GetAllClasses'];
        }),
      );
  }

  deleteClass(id: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
      mutation {
        DeleteClass(_id : "${id}") {
          _id
        }
      }
      `,
      errorPolicy: 'all',
    });
  }

  updateRncpTitle(id: string, titleData: any): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation UpdateTitle($id: ID!, $titleData: RncpTitleUpdateInput) {
          UpdateTitle(_id: $id, title_input: $titleData) {
            _id
            is_published
          }
        }
      `,
      variables: {
        id,
        titleData,
      },
      errorPolicy: 'all',
    });
    // .pipe(map(resp => resp.data['UpdateTitle']));
  }

  // Get single rncp title
  getRncpTitleById(rncpId: string) {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneTitle(_id: "${rncpId}") {
            short_name
            long_name
            _id
          }
        }
      `,
      })
      .pipe(
        map((resp) => {
          return resp.data['GetOneTitle'];
        }),
      );
  }

  // Get single user type
  getOneUserTypes(ID: String): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetOneUserType(_id:"${ID}"){
          _id
          name
          entity
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneUserType']));
  }

  // Get single class
  getClassById(classId: string) {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneClass(_id: "${classId}") {
            _id
            name
            class_duplication_status
            jury_process_name
            origin_class{
              _id
              name
            }
            parent_rncp_title {
              _id
            }
            description
            type_evaluation
            allow_job_description
            allow_problematic
            allow_mentor_evaluation
            allow_employability_survey
            is_mentor_selected_in_job_description
            is_job_desc_active
            is_problematic_active
            is_employability_survey_active
            problematic_send_to_certifier_time
            is_admission_enabled
            year_of_certification
            admission_process {
              form_builder_id {
                _id
                form_builder_name
              }
              due_date
            }
            is_admission_due_date_enabled
            job_desc_activation_date {
              date
              time
            }
            questionnaire_template_id {
              _id
            }
            problematic_questionnaire_template_id {
              _id
            }
            problematic_activation_date {
              date
              time
            }
            identity_verification {
              allow_auto_send_identity_verification
              identity_verification_activation_date {
                date_utc
                time_utc
              }
              identity_verification_due_date {
                date_utc
                time_utc
              }
            }
            specializations {
              _id
              name
              is_specialization_assigned
            }
            registration_period {
              start_date {
                date
                time
              }
              end_date {
                date
                time
              }
            }
            title_government_registration {
              s3_file_name
              date_generated_at
              time_generated_at
              selection_type
            }
            is_quality_form_enabled
            quality_form{
              form_builder_id{
                _id
                form_builder_name
              }
              due_date
            }
            is_class_header
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetOneClass'];
        }),
      );
  }

  getOneClassForAcadKit(classId: string) {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneClass(_id: "${classId}") {
            _id
            name
            academic_kit {
              is_created
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetOneClass'];
        }),
      );
  }

  // Get single class
  getClassByIdOnCompany(classId: string) {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneClass(_id: "${classId}") {
            _id
            name
            description
            type_evaluation
            allow_job_description
            allow_problematic
            allow_mentor_evaluation
            allow_employability_survey
            is_mentor_selected_in_job_description
            is_job_desc_active
            is_problematic_active
            is_employability_survey_active
            problematic_send_to_certifier_time
            job_desc_activation_date {
              date
              time
            }
            questionnaire_template_id {
              _id
            }
            problematic_questionnaire_template_id {
              _id
            }
            problematic_activation_date {
              date
              time
            }
            identity_verification {
              allow_auto_send_identity_verification
              identity_verification_activation_date {
                date_utc
                time_utc
              }
            }
            test_auto_pro_published(class_id: "${classId}")
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetOneClass'];
        }),
      );
  }

  // Get single class
  getClassForValidation(classId: string) {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneClass(_id: "${classId}") {
            _id
            name
            pass_fail_conditions {
              _id
              condition_name
              condition_type
              condition_parameters {
                correlation
                validation_type
                validation_parameter {
                  parameter_type
                  percentage_value
                  block_id {
                    _id
                    block_of_competence_condition
                  }
                  subject_id {
                    _id
                    subject_name
                  }
                  evaluation_id {
                    _id
                    evaluation
                  }
                  sign
                }
                pass_mark
              }
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetOneClass'];
        }),
      );
  }

  getClassESById(classId: string) {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneClass(_id: "${classId}") {
            _id
            parent_rncp_title{
              _id
            }
            employability_surveys{
              _id
              employability_survey_sent
              questionnaire_template_id{
                _id
              }
              send_date
              send_time
              expiration_date
              expiration_time
              send_only_to_pass_student
              send_only_to_not_mention_continue_study
              send_only_to_pass_latest_retake_student
              with_rejection_flow
              is_required_for_certificate
              validator
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetOneClass'];
        }),
      );
  }

  // Get single class
  getClassScoreConversionById(classId: string): Observable<ClassData> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneClass(_id: "${classId}") {
            _id
            name
            description
            type_evaluation
            allow_job_description
            allow_problematic
            allow_mentor_evaluation
            score_conversions_competency {
              _id
              sign
              score
              phrase
              letter
            }
            score_conversions_soft_skill {
              _id
              sign
              score
              phrase
              letter
            }
            max_score_competency
            max_score_soft_skill
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetOneClass'];
        }),
      );
  }

  // Get single class
  getQuestionaireJobDesc(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllQuestionnaireTemplate(filter: { questionnaire_type: job_description }) {
              _id
              questionnaire_name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllQuestionnaireTemplate'];
        }),
      );
  }

  getQuestionaireProblematic(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllQuestionnaireTemplate(filter: { questionnaire_type: problematic }) {
              _id
              questionnaire_name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllQuestionnaireTemplate'];
        }),
      );
  }

  getQuestionaireES(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllQuestionnaireTemplate(filter: { questionnaire_type: employability_survey, published_status: publish }) {
              _id
              questionnaire_name
              is_continue_study
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllQuestionnaireTemplate'];
        }),
      );
  }

  getESFormBuilderTemplate(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllFormBuilders(filter: { template_type: employability_survey, status: true }) {
              _id
              form_builder_name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllFormBuilders'];
        }),
      );
  }

  /* Create new class*/
  createNewClass(classData): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation CreateClass($classData: ClassInput) {
          CreateClass(class_input: $classData) {
            _id
            description
            name
          }
        }
      `,
      variables: {
        classData,
      },
      errorPolicy: 'all',
    });
  }
  createNewClassDuplicate(classData, duplicateClass): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation CreateClass($classData: ClassInput, $duplicateClass: DuplicateClassInput) {
          CreateClass(class_input: $classData, duplicate_class: $duplicateClass) {
            _id
            description
            name
          }
        }
      `,
      variables: {
        classData,
        duplicateClass,
      },
      errorPolicy: 'all',
    });
  }

  updateClassParameter(classId: string, classData: ClassInput): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateClassParameter($classId: ID!, $classData: ClassInput) {
            UpdateClass(_id: $classId, class_input: $classData) {
              name
              max_score_soft_skill
              max_score_competency
              score_conversions_competency {
                sign
                score
                phrase
                letter
              }
              score_conversions_soft_skill {
                sign
                score
                phrase
                letter
              }
            }
          }
        `,
        variables: { classId, classData },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp));
  }

  updateClassParameterAdmissionTab(classId: string, classData: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateClassParameterAdmission($classId: ID!, $classData: ClassInput) {
            UpdateClass(_id: $classId, class_input: $classData) {
              name
              max_score_soft_skill
              max_score_competency
              score_conversions_competency {
                sign
                score
                phrase
                letter
              }
              score_conversions_soft_skill {
                sign
                score
                phrase
                letter
              }
            }
          }
        `,
        variables: { classId, classData },
      })
      .pipe(map((resp) => resp));
  }

  updateClass(classId: string, classData: ClassInput): Observable<{ name: string }> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateClass($classId: ID!, $classData: ClassInput) {
            UpdateClass(_id: $classId, class_input: $classData) {
              name
            }
          }
        `,
        variables: { classId, classData },
      })
      .pipe(map((resp) => resp.data['UpdateClass']));
  }

  updateScore(classId: string, classData: ClassInput): Observable<{ name: string }> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateClassOnEvalExpertise($classId: ID!, $classData: ClassInput) {
            UpdateClass(_id: $classId, class_input: $classData) {
              max_score_competency
              score_conversions_competency {
                sign
                score
                phrase
                letter
              }
              max_score_soft_skill
              score_conversions_soft_skill {
                sign
                score
                phrase
                letter
              }
            }
          }
        `,
        variables: { classId, classData },
      })
      .pipe(map((resp) => resp.data['UpdateClass']));
  }

  getAllFinalTranscriptParameters(): Observable<any> {
    return this.apollo.query({
      query: gql`
        query {
          GetAllFinalTranscriptParameter {
            final_n2_deadline
            final_n3_deadline
            final_n3_special_text
            final_n7_jury_decision
            final_n7_extra_retake
          }
        }
      `,
    });
  }

  getOneFinalTranscriptParameter(rncp_id: string, class_id: string): Observable<any> {
    return this.apollo.query({
      query: gql`
      query {
        GetOneFinalTranscriptParameter(rncp_id : "${rncp_id}", class_id : "${class_id}") {
          _id
          final_n2_deadline
          final_n3_deadline
          final_n3_special_text
          final_n7_jury_decision
          final_n7_extra_retake
        }
      }
      `,
      fetchPolicy: 'network-only',
    });
  }

  createFinalTranscriptParameter(data: any): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
      mutation {
        CreateFinalTranscriptParameter(final_transcript_parameter_input : {
          rncp_id : "${data.rncp_id}",
          class_id : "${data.class_id}",
          final_n2_deadline : "${data.N2_Deadline}",
          final_n3_deadline : "${data.N3_Deadline}",
          final_n3_special_text : "${data.N3_Special_Text}",
          final_n7_jury_decision : "${data.N7_Date_Jury_Decision}",
          final_n7_extra_retake : "${data.N7_Retake_Date}"
        }) {
          _id
          final_n2_deadline
          final_n3_deadline
          final_n3_special_text
          final_n7_jury_decision
          final_n7_extra_retake
        }
      }`,
    });
  }

  updateFinalTranscriptParameter(paramID: string, data: any): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
      mutation{
        UpdateFinalTranscriptParameter(_id:"${paramID}", final_transcript_parameter_input:{
          rncp_id : "${data.rncp_id}",
          class_id : "${data.class_id}",
          final_n2_deadline : "${data.N2_Deadline}",
          final_n3_deadline : "${data.N3_Deadline}",
          final_n3_special_text : "${data.N3_Special_Text}",
          final_n7_jury_decision : "${data.N7_Date_Jury_Decision}",
          final_n7_extra_retake : "${data.N7_Retake_Date}"
        }){
          final_n2_deadline
          final_n3_deadline
          final_n3_special_text
          final_n7_jury_decision
          final_n7_extra_retake
        }
      }`,
    });
  }

  createCertificateParameter(data: any): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
      mutation{
        CreateCertificateParameter(certificate_parameter_input:{
          rncp_id : "${data.rncp_id}",
          class_id : "${data.class_id}",
          rncp_logo : {
            file_name : "",
            file_path : ""
          },
          certifier_logo : {
            file_name : "",
            file_path : ""
          },
          certifier_admin_signature : {
            file_name : "${data.adminName}",
            file_path : "${data.adminSrc}"
          },
          certifier_stamp :{
            file_name : "${data.stampName}",
            file_path : "${data.stampSrc}"
          },
          certificate_background_image: {
            file_name : "${data.BGName}",
            file_path : "${data.BGSrc}"
          },
          font_type :"${data.fontType}",
          font_size: ${data.fontSize},
          header : "${data.headers}",
          footer : "${data.footers}",
          certificate_issuance_date : "${data.date}"
        }){
          certifier_admin_signature{
            file_name
            file_path
          }
          certifier_stamp{
            file_name
            file_path
          }
          certificate_background_image{
            file_name
            file_path
          }
          font_type
          font_size
          header
          footer
          certificate_issuance_date
        }
      }
      `,
    });
  }

  updateCertificateParameter(data: any): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
      mutation{
        UpdateCertificateParameter(_id : "${data._id}", certificate_parameter_input:{
          rncp_id : "${data.rncp_id}",
          class_id : "${data.class_id}",
          rncp_logo : {
            file_name : "",
            file_path : ""
          },
          certifier_logo : {
            file_name : "",
            file_path : ""
          },
          certifier_admin_signature : {
            file_name : "${data.adminName}",
            file_path : "${data.adminSrc}"
          },
          certifier_stamp :{
            file_name : "${data.stampName}",
            file_path : "${data.stampSrc}"
          },
          certificate_background_image: {
            file_name : "${data.BGName}",
            file_path : "${data.BGSrc}"
          },
          font_type :"${data.fontType}",
          font_size: ${data.fontSize},
          header : "${data.headers}",
          footer : "${data.footers}",
          certificate_issuance_date : "${data.date}"
        }){
          certifier_admin_signature{
            file_name
            file_path
          }
          certifier_stamp{
            file_name
            file_path
          }
          certificate_background_image{
            file_name
            file_path
          }
          font_type
          font_size
          header
          footer
          certificate_issuance_date
        }
      }
      `,
    });
  }

  getOneCertificateParameter(data: any): Observable<any> {
    return this.apollo.query({
      query: gql`
      query{
        GetOneCertificateParameter(rncp_id:"${data.rncp_id}", class_id:"${data.class_id}"){
          _id
          certifier_admin_signature{
            file_name
            file_path
          }
          certifier_stamp{
            file_name
            file_path
          }
          certificate_background_image{
            file_name
            file_path
          }
          font_type
          font_size
          header
          footer
          certificate_issuance_date
        }
      }
      `,
      fetchPolicy: 'network-only',
    });
  }

  getFirstCondition(rncpId: string, classId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetFirstConditionSetUp (rncp_id:"${rncpId}", class_id:"${classId}"){
          type_evaluation
          sub_type_evaluation
          evaluation_step
          evaluation_max_point
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetFirstConditionSetUp']));
  }

  saveFirstCondition(classId: string, firstStepData): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation CreateUpdateCondition($classId: ID!, $firstStepData: FirstConditionSetUpInput) {
          CreateUpdateCondition(class_id: $classId, first_step_input: $firstStepData) {
            type_evaluation
            sub_type_evaluation
          }
        }
      `,
      variables: {
        classId,
        firstStepData,
      },
      errorPolicy: 'all',
    });
  }

  duplicateCondition(classId: string, duplicateConditionInput): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation CreateUpdateCondition($classId: ID!, $duplicateConditionInput: DuplicateConditionInput) {
          CreateUpdateCondition(class_id: $classId, duplicate_condition: $duplicateConditionInput) {
            type_evaluation
            sub_type_evaluation
          }
        }
      `,
      variables: {
        classId,
        duplicateConditionInput,
      },
      errorPolicy: 'all',
    });
  }

  getTitleShortName(rncpId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetOneTitle(_id:"${rncpId}"){
          short_name
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTitle']));
  }

  getClassName(classId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetOneClass(_id:"${classId}"){
          name
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneClass']));
  }

  GetBlockOfCompetenceConditionDropdownList(typeEva: string, subTypeEva: string, search: string) {
    return this.apollo
      .query({
        query: gql`
      query{
        GetBlockOfCompetenceConditionDropdownList(type_evaluation:${typeEva}, sub_type_evaluation:${subTypeEva}, search:"${search}"){
          _id
          block_of_competence_condition
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetBlockOfCompetenceConditionDropdownList']));
  }

  getClassCondition(classId: string, blockType?: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetOneClass(_id:"${classId}"){
          name
          type_evaluation
          sub_type_evaluation
          evaluation_step
          evaluation_max_point
          parent_rncp_title {
            short_name
            long_name
          }
          competency {
            allow_competency_auto_evaluation
            allow_competency_pro_evaluation
          }
          soft_skill {
            allow_soft_skill
            allow_soft_skill_auto_evaluation
            allow_pc_soft_skill_eval
            allow_soft_skill_pro_evaluation
          }
          test_eval_by_preparation_center_created
          test_auto_pro_created(class_id:"${classId}", ${blockType ? `block_type: ${blockType}` : ''})
          test_auto_pro_published(class_id:"${classId}", ${blockType ? `block_type: ${blockType}` : ''})
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneClass']));
  }

  getAllBlockOfCompetenceConditions(rncpId: string, classId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetAllBlockOfCompetenceConditions(rncp_title_id:"${rncpId}", class_id:"${classId}"){
          _id
          block_rncp_reference
          rncp_title {
            _id
          }
          class_id {
            _id
          }
          block_of_competence_condition
          description
          max_point
          min_score
          block_of_competence_condition_credit
          transversal_block
          is_retake_by_block
          selected_block_retake {
            _id
            block_of_competence_condition
          }
          is_specialization
          specialization {
            _id
          }
          count_for_title_final_score
          page_break
          block_of_tempelate_competence {
            _id
            ref_id
          }
          block_of_tempelate_soft_skill {
            _id
            ref_id
          }
          block_type
          is_auto_pro_eval
          ref_id
          order
          subjects {
            _id
            rncp_title {
              _id
            }
            class_id {
              _id
            }
            is_subject_transversal_block
            subject_transversal_block_id {
              _id
              subject_name
            }
            subject_name
            max_point
            minimum_score_for_certification
            coefficient
            count_for_title_final_score
            credit
            order
            evaluations {
              _id
              evaluation
              type
              weight
              coefficient
              minimum_score
              result_visibility
              parallel_intake
              auto_mark
              retake_during_the_year
              student_eligible_to_join
              retake_when_absent_justified
              retake_when_absent_not_justified
              use_different_notation_grid
              retake_evaluation {
                _id
                evaluation
                type
              }
              score_not_calculated_for_retake_block
              test_is_not_retake_able_in_retake_block
              selected_evaluation_retake_block {
                _id
                evaluation
              }
              order
              published_test_id {
                is_published
              }
            }
          }
          is_academic_recommendation
          is_one_of_test_published
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllBlockOfCompetenceConditions']));
  }

  getAllBlockConditionsForValidation(rncpId: string, classId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetAllBlockOfCompetenceConditions(rncp_title_id:"${rncpId}", class_id:"${classId}", count_for_title_final_score: true){
          _id
          block_rncp_reference
          rncp_title {
            _id
          }
          class_id {
            _id
          }
          block_of_competence_condition
          description
          max_point
          min_score
          block_of_competence_condition_credit
          transversal_block
          is_retake_by_block
          selected_block_retake {
            _id
            block_of_competence_condition
          }
          is_specialization
          specialization {
            _id
          }
          count_for_title_final_score
          page_break
          block_of_tempelate_competence {
            _id
            ref_id
          }
          block_of_tempelate_soft_skill {
            _id
            ref_id
          }
          block_type
          is_auto_pro_eval
          ref_id
          order
          subjects {
            _id
            rncp_title {
              _id
            }
            class_id {
              _id
            }
            is_subject_transversal_block
            subject_transversal_block_id {
              _id
              subject_name
            }
            subject_name
            max_point
            minimum_score_for_certification
            coefficient
            count_for_title_final_score
            credit
            order
            evaluations {
              _id
              evaluation
              type
              weight
              coefficient
              minimum_score
              result_visibility
              parallel_intake
              auto_mark
              retake_during_the_year
              student_eligible_to_join
              retake_when_absent_justified
              retake_when_absent_not_justified
              use_different_notation_grid
              retake_evaluation {
                _id
                evaluation
                type
              }
              score_not_calculated_for_retake_block
              test_is_not_retake_able_in_retake_block
              selected_evaluation_retake_block {
                _id
                evaluation
              }
              order
            }
          }
          pass_fail_conditions {
            _id
            condition_name
            condition_type
            condition_parameters {
              correlation
              validation_type
              validation_parameter {
                parameter_type
                percentage_value
                block_id {
                  _id
                  block_of_competence_condition
                }
                subject_id {
                  _id
                  subject_name
                }
                evaluation_id {
                  _id
                  evaluation
                }
                sign
              }
              pass_mark
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllBlockOfCompetenceConditions']));
  }

  getAllFinalTranscriptResult(rncpId: string, classId: string, studentId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllFinalTranscriptResult(rncp_title_id: "${rncpId}", class_id: "${classId}", student_id: "${studentId}") {
              student_id {
                _id
                first_name
                last_name
                civility
                email
                date_of_birth
                place_of_birth
              }
              rncp_id {
                _id
                short_name
                long_name
                rncp_level
                journal_text
                certifier {
                  _id
                  short_name
                  long_name
                  logo
                  school_address {
                    address1
                    postal_code
                    city
                    is_main_address
                  }
                }
                preparation_centers {
                  _id
                  short_name
                  long_name
                }
              }
              class_id {
                _id
                name
                pass_fail_conditions {
                  condition_name
                  condition_type
                  condition_parameters {
                    validation_type
                    pass_mark
                    correlation
                    validation_parameter {
                      parameter_type
                      percentage_value
                      block_id {
                        _id
                        block_of_competence_condition
                      }
                      subject_id {
                        _id
                        subject_name
                      }
                      evaluation_id {
                        _id
                        evaluation
                      }
                      sign
                    }
                  }
                }
              }
              school_id {
                _id
                short_name
                long_name
              }
              total_mark
              total_point
              max_point
              pass_fail_status
              parameter_obtained_name
              parameter_obtained_id {
                condition_name
              }
              block_of_competence_conditions {
                block_id {
                  _id
                  block_of_competence_condition
                  max_point
                  min_score
                  block_of_competence_condition_credit
                  description
                  pass_fail_conditions {
                    _id
                    condition_name
                    condition_type
                    condition_parameters {
                      correlation
                      validation_type
                      validation_parameter {
                        block_id {
                          _id
                        }
                      }
                      pass_mark
                    }
                  }
                }
                pass_fail_status
                total_mark
                total_point
                total_coefficient
                max_point
                subjects {
                  subject_id {
                    _id
                    subject_name
                  }
                  total_mark
                  total_point
                  coefficient
                  total_coefficient
                  total_credit
                  total_weight
                  max_point
                  pass_fail_status
                  evaluations {
                    evaluation_id {
                      _id
                      evaluation
                      weight
                      coefficient
                      minimum_score
                    }
                    total_mark
                    total_point
                    mark
                    weight
                    coefficient
                    pass_fail_status
                  }
                }
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllFinalTranscriptResult']));
  }

  createUpdateBlockOfCompetenceCondition(rncpId, classId, blocks): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateUpdateBlockOfCompetenceCondition($rncpId: ID!, $classId: ID!, $blocks: [BlockOfCompetenceConditionInput]) {
            CreateUpdateBlockOfCompetenceCondition(
              rncp_title_id: $rncpId
              class_id: $classId
              block_of_competence_condition_input: $blocks
            ) {
              _id
              rncp_title {
                _id
              }
              class_id {
                _id
              }
              block_of_competence_condition
              description
              max_point
              min_score
              block_of_competence_condition_credit
              transversal_block
              is_retake_by_block
              selected_block_retake {
                _id
              }
              is_specialization
              count_for_title_final_score
            }
          }
        `,
        variables: {
          rncpId,
          classId,
          blocks,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp));
  }

  updateMaxPoint(classId, classInput): Observable<any[]> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation updateMaxPoint($classId: ID!, $classInput: ClassInput) {
            UpdateClass(_id: $classId, class_input: $classInput) {
              _id
              name
              evaluation_max_point
            }
          }
        `,
        variables: {
          classId,
          classInput,
        },
      })
      .pipe(map((resp) => resp.data['UpdateClass']));
  }

  deleteBlockCompetence(blockId): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
      mutation {
        DeleteBlockOfCompetenceCondition(_id: "${blockId}"){
          _id
        }
      }
      `,
      errorPolicy: 'all',
    });
  }

  deleteEvaluationCompetence(evalId): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
      mutation {
        DeleteEvaluation(_id: "${evalId}"){
          _id
        }
      }
      `,
      errorPolicy: 'all',
    });
  }

  deleteSubjectCompetence(subId): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
      mutation {
        DeleteSubject(_id: "${subId}"){
          _id
        }
      }
      `,
      errorPolicy: 'all',
    });
  }

  // Start of Second step eval by expertise
  getAllBlockOfCompetenceTemplateDropdown(titleID: string, classID: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetAllBlockOfCompetenceTemplates(rncp_title_id:"${titleID}", class_id:"${classID}"){
          _id
          ref_id
          name
          phrase_names {
            phrase_type
            name
          }
          competence_templates_id {
            _id
            ref_id
            name
            short_name
            phrase_names {
              name
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllBlockOfCompetenceTemplates']));
  }
  // Start of Third step eval by expertise
  getAllBlockOfSoftSkillTemplateDropdown(titleID: string, classID: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetAllSoftSkillBlockTemplates(rncp_title_id:"${titleID}", class_id:"${classID}"){
          _id
          ref_id
          name
          phrase_names {
            name
            phrase_type
          }
          competence_softskill_templates_id {
            _id
            ref_id
            name
            short_name
            phrase_names {
              name
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllSoftSkillBlockTemplates']));
  }

  // Start of Second step eval by expertise
  getAllBlockOfCompetenceTemplate(titleID: string, classID: string, studentID?: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query GetAllBlockOfCompetenceTemplates($student_id: ID) {
        GetAllBlockOfCompetenceTemplates(rncp_title_id:"${titleID}", class_id:"${classID}", student_id: $student_id){
          _id
          ref_id
          name
          description
          note
          is_test_created
          phrase_names {
            _id
            phrase_type
            name
            phrase_parameters {
              correlation
              pass_mark
              validation_type
              validation_parameter {
                parameter_type
                percentage_value
                ratio_value
                sign
                competence_id {
                  _id
                }
                criteria_of_evaluation_template_id  {
                  _id
                }
              }
            }
          }
          competence_templates_id {
            _id
            ref_id
            name
            short_name
            description
            phrase_names {
              _id
              name
              phrase_type
              phrase_parameters {
                correlation
                pass_mark
                validation_type
                validation_parameter {
                  parameter_type
                  percentage_value
                  ratio_value
                  sign
                  criteria_of_evaluation_template_id  {
                    _id
                  }
                }
              }
            }
            criteria_of_evaluation_templates_id {
              _id
              ref_id
              name
              description
            }
          }
          criteria_of_evaluation_question_id{
            _id
            s3_file_name
          }
        }
      }
      `,
        variables: {
          student_id: studentID,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllBlockOfCompetenceTemplates']));
  }

  // Start of Second step eval by expertise
  getAllCriteriaOfEvaluationTemplateQuestions(criteria_of_evaluation_template_id: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetAllCriteriaOfEvaluationTemplateQuestions(
          criteria_of_evaluation_template_id: "${criteria_of_evaluation_template_id}"
        ) {
        _id
        question
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllCriteriaOfEvaluationTemplateQuestions']));
  }

  saveOneBlockOfCompetenceTemplate(rncpId: string, classId: string, payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateUpdateBlockOfCompetenceTemplate($rncpId: ID!, $classId: ID!, $payload: [BlockOfCompetenceTemplateInput]) {
            CreateUpdateBlockOfCompetenceTemplate(
              rncp_title_id: $rncpId
              class_id: $classId
              block_of_competence_template_input: $payload
            ) {
              _id
            }
          }
        `,
        variables: {
          rncpId,
          classId,
          payload,
        },
      })
      .pipe(map((resp) => resp.data['CreateUpdateBlockOfCompetenceTemplate']));
  }

  deleteBlockOfCompetenceTemplate(blockId: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
      mutation {
        DeleteBlockOfCompetenceTemplate(_id: "${blockId}")
      }
      `,
      errorPolicy: 'all',
    });
  }

  deleteCriteriaOfEvaluationTemplateQuestion(evalQuest): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
      mutation {
        DeleteCriteriaOfEvaluationTemplateQuestion(_id: "${evalQuest}"){
          _id
        }
      }
      `,
      errorPolicy: 'all',
    });
  }

  deleteCompetencyTemplate(compId: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
      mutation {
        DeleteCompetenceTemplate(_id: "${compId}")
      }
      `,
      errorPolicy: 'all',
    });
  }

  deleteCriteriaEvaluationTemplate(evaId: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
      mutation {
        DeleteCriteriaOfEvaluationTemplate(_id: "${evaId}")
      }
      `,
      errorPolicy: 'all',
    });
  }

  createOneBlockOfCompetenceTemplate(rncpId: string, classId: string, payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateBlockOfCompetenceTemplate($rncpId: ID!, $classId: ID!, $payload: BlockOfCompetenceTemplateInput) {
            CreateBlockOfCompetenceTemplate(rncp_title_id: $rncpId, class_id: $classId, block_of_competence_template_input: $payload) {
              _id
              ref_id
              name
              description
              note
            }
          }
        `,
        variables: {
          rncpId,
          classId,
          payload,
        },
      })
      .pipe(map((resp) => resp.data['CreateBlockOfCompetenceTemplate']));
  }

  // Start of Sixth step Grand Oral Validation
  getOneGrandOralValidation(titleID: string, classID: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetOneGrandOralValidation(rncp_id:"${titleID}", class_id:"${classID}"){
          _id
          rncp_id {
            _id
          }
          class_id {
            _id
            jury_process_name
          }
          phrase_names {
            _id
            name
            phrase_type
            phrase_parameters {
              correlation
              validation_type
              min_level_mastery
              validation_parameter {
                parameter_type
                percentage_value
                ratio_value
                sign
                block_id {
                  _id
                }
                competence_id {
                  _id
                }
              }
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneGrandOralValidation']));
  }

  createGrandOralValidation(payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateGrandOralValidation($payload: GrandOralValidationInput) {
            CreateGrandOralValidation(grand_oral_validation_input: $payload) {
              _id
              rncp_id {
                _id
              }
              class_id {
                _id
              }
              phrase_names {
                _id
                name
                phrase_type
                phrase_parameters {
                  correlation
                  validation_type
                  min_level_mastery
                  validation_parameter {
                    parameter_type
                    percentage_value
                    ratio_value
                    sign
                    block_id {
                      _id
                    }
                    competence_id {
                      _id
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          payload,
        },
      })
      .pipe(map((resp) => resp.data['CreateGrandOralValidation']));
  }

  updateGrandOralValidation(payload: any, _id?: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateGrandOralValidation($payload: GrandOralValidationInput, $_id: ID) {
            UpdateGrandOralValidation(grand_oral_validation_input: $payload, _id: $_id) {
              _id
              rncp_id {
                _id
              }
              class_id {
                _id
              }
              phrase_names {
                _id
                name
                phrase_type
                phrase_parameters {
                  correlation
                  validation_type
                  min_level_mastery
                  validation_parameter {
                    parameter_type
                    percentage_value
                    ratio_value
                    sign
                    block_id {
                      _id
                    }
                    competence_id {
                      _id
                    }
                  }
                }
              }
            }
          }
        `,
        variables: {
          payload,
          _id,
        },
      })
      .pipe(map((resp) => resp.data['UpdateGrandOralValidation']));
  }

  deleteGrandOralValidation(_id: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation DeleteGrandOralValidation($_id: ID) {
            DeleteGrandOralValidation(_id: $_id) {
              rncp_id
              class_id
            }
          }
        `,
        variables: {
          _id,
        },
      })
      .pipe(map((resp) => resp.data['DeleteGrandOralValidation']));
  }

  createOneCompetenceTemplate(blockId: string, payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateCompetenceTemplate($blockId: ID!, $payload: CompetenceTemplateInput) {
            CreateCompetenceTemplate(block_of_competence_template_id: $blockId, competence_template_input: $payload) {
              _id
              ref_id
              name
              short_name
              description
            }
          }
        `,
        variables: {
          blockId,
          payload,
        },
      })
      .pipe(map((resp) => resp.data['CreateCompetenceTemplate']));
  }

  createOneCriteriaOfEvaluationTemplate(competenceId: string, payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateCriteriaOfEvaluationTemplate($competenceId: ID!, $payload: CriteriaOfEvaluationTemplateInput) {
            CreateCriteriaOfEvaluationTemplate(competence_template_id: $competenceId, criteria_of_evaluation_template_input: $payload) {
              _id
              ref_id
              name
              description
            }
          }
        `,
        variables: {
          competenceId,
          payload,
        },
      })
      .pipe(map((resp) => resp.data['CreateCriteriaOfEvaluationTemplate']));
  }

  saveAllCompetencyTemplate(rncpId, classId, payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateUpdateBlockOfCompetenceTemplate($rncpId: ID!, $classId: ID!, $payload: [BlockOfCompetenceTemplateInput]) {
            CreateUpdateBlockOfCompetenceTemplate(
              rncp_title_id: $rncpId
              class_id: $classId
              block_of_competence_template_input: $payload
            ) {
              _id
              name
              description
              note
            }
          }
        `,
        variables: {
          rncpId,
          classId,
          payload,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp));
  }
  // End of Second step eval by experise

  // Start of Third step eval by expertise
  getAllBlockOfSoftSkillTemplate(titleID: string, classID: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetAllSoftSkillBlockTemplates(rncp_title_id:"${titleID}", class_id:"${classID}"){
          _id
          ref_id
          name
          description
          note
          is_test_created
          phrase_names {
            _id
            name
            phrase_type
            phrase_parameters {
              correlation
              pass_mark
              validation_type
              validation_parameter {
                parameter_type
                percentage_value
                ratio_value
                sign
                competence_softskill_template_id {
                  _id
                }
                criteria_of_evaluation_softskill_template_id {
                  _id
                }
              }
            }
          }
          competence_softskill_templates_id {
            _id
            ref_id
            name
            short_name
            description
            phrase_names {
              _id
              name
              phrase_parameters {
                correlation
                pass_mark
                validation_type
                validation_parameter {
                  parameter_type
                  percentage_value
                  ratio_value
                  sign
                  criteria_of_evaluation_softskill_template_id {
                    _id
                  }
                }
              }
            }
            criteria_of_evaluation_softskill_templates_id {
              _id
              ref_id
              name
              description
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllSoftSkillBlockTemplates']));
  }

  createOneBlockOfSoftSkillTemplate(rncpId: string, classId: string, payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateSoftSkillBlockTemplate($rncpId: ID!, $classId: ID!, $payload: SoftSkillBlockTemplateInput) {
            CreateSoftSkillBlockTemplate(rncp_title_id: $rncpId, class_id: $classId, soft_skill_block_template_input: $payload) {
              _id
              ref_id
              name
              description
              note
            }
          }
        `,
        variables: {
          rncpId,
          classId,
          payload,
        },
      })
      .pipe(map((resp) => resp.data['CreateSoftSkillBlockTemplate']));
  }

  createOneSoftSkillCompetenceTemplate(blockId: string, payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateSoftSkillCompetenceTemplate($blockId: ID!, $payload: SoftSkillCompetenceTemplateInput) {
            CreateSoftSkillCompetenceTemplate(soft_skill_block_template_id: $blockId, soft_skill_competence_template_input: $payload) {
              _id
              ref_id
              name
              short_name
              description
            }
          }
        `,
        variables: {
          blockId,
          payload,
        },
      })
      .pipe(map((resp) => resp.data['CreateSoftSkillCompetenceTemplate']));
  }

  createOneSoftSkillCriteriaOfEvaluationTemplate(competenceId: string, payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateSoftSkillEvaluationTemplate($competenceId: ID!, $payload: SoftSkillEvaluationTemplateInput) {
            CreateSoftSkillEvaluationTemplate(
              soft_skill_competence_template_id: $competenceId
              soft_skill_evaluation_template_input: $payload
            ) {
              _id
              ref_id
              name
              description
            }
          }
        `,
        variables: {
          competenceId,
          payload,
        },
      })
      .pipe(map((resp) => resp.data['CreateSoftSkillEvaluationTemplate']));
  }

  saveAllSoftSkillTemplate(rncpId, classId, payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateUpdateSoftSkillBlockOfCompetenceTemplate($rncpId: ID!, $classId: ID!, $payload: [SoftSkillBlockTemplateInput]) {
            CreateUpdateSoftSkillBlockOfCompetenceTemplate(
              rncp_title_id: $rncpId
              class_id: $classId
              soft_skill_block_template_input: $payload
            ) {
              _id
              name
              description
              note
            }
          }
        `,
        variables: {
          rncpId,
          classId,
          payload,
        },
      })
      .pipe(map((resp) => resp));
  }

  GetAllTitleDropdownListBySchool(school_id) {
    return this.apollo
      .query({
        query: gql`
        query {
          GetTitleDropdownList(school_id: "${school_id}") {
            _id
            short_name
            specializations {
              _id
              name
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetTitleDropdownList']));
  }

  GetAllDocs(rncp_title_id, student_id, userTypeId, classId, is_from_student_card = false): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetAllDocs(
            rncp_title_id: "${rncp_title_id}"
            student_id: "${student_id}"
            class_id: "${classId}"
            type_of_documents: [document_expected, pdf_result, student_upload_grand_oral_presentation, student_upload_grand_oral_cv, grand_oral_pdf, grand_oral_result_pdf, elementOfProof]
            uploaded_for_student_group: true
            is_from_student_card: ${is_from_student_card}
          ) {
            _id
            status
            document_name
            type_of_document
            document_generation_type
            s3_file_name
            parent_folder {
              _id
              class {
                jury_process_name
              }
              parent_rncp_title {
                _id
                short_name
              }
              school {
                _id
              }
              folder_name
              documents {
                _id
                document_name
                type_of_document
                s3_file_name
                published_for_student
                document_generation_type
                parent_class_id {
                  _id
                  name
                }
                parent_test {
                  expected_documents {
                    _id
                    document_name
                  }
                  date_type
                  date {
                    date_utc
                    time_utc
                  }
                  _id
                }
                uploaded_for_student {
                  first_name
                  last_name
                }
                uploaded_for_other_user {
                  first_name
                  last_name
                }
                uploaded_for_group {
                  _id
                  name
                }
                document_expected_id {
                  _id
                  document_name
                }
                publication_date {
                  type
                  before
                  day
                  publication_date {
                    date
                    time
                  }
                  relative_time
                }
                published_for_user_types_id {
                  _id
                  name
                }
              }
              type_b_documents {
                _id
                document_name
                type_of_document
                s3_file_name
                parent_test {
                  expected_documents {
                    _id
                    document_name
                  }
                  date_type
                  date {
                    date_utc
                    time_utc
                  }
                  _id
                }
                uploaded_for_student {
                  first_name
                  last_name
                }
                uploaded_for_other_user {
                  first_name
                  last_name
                }
                uploaded_for_group {
                  _id
                  name
                }
              }
              grand_oral_pdfs {
                _id
                document_name
                s3_file_name
                type_of_document
                jury_organization_id {
                  _id
                }
                uploaded_for_student {
                  _id
                  first_name
                  last_name
                }
              }
              grand_oral_result_pdfs(logged_in_user_type_id: "${userTypeId}") {
                _id
                document_name
                s3_file_name
                type_of_document
                jury_organization_id {
                  _id
                }
                uploaded_for_student {
                  _id
                  first_name
                  last_name
                }
              }
              cv_docs{
                _id
                document_name
                type_of_document
                s3_file_name
                published_for_student
                parent_class_id {
                  _id
                  name
                }
                parent_rncp_title {
                  _id
                  short_name
                }
                parent_test {
                  expected_documents {
                    _id
                    document_name
                  }
                  date_type
                  date {
                    date_utc
                    time_utc
                  }
                  _id
                }
                uploaded_for_student {
                  first_name
                  last_name
                }
                uploaded_for_other_user {
                  first_name
                  last_name
                }
                uploaded_for_group {
                  _id
                  name
                }
                document_expected_id {
                  _id
                  document_name
                }
                publication_date {
                  type
                  before
                  day
                  publication_date {
                    date
                    time
                  }
                  relative_time
                }
                published_for_user_types_id {
                  _id
                  name
                }
              }
              presentation_docs {
                _id
                document_name
                type_of_document
                s3_file_name
                published_for_student
                parent_class_id {
                  _id
                  name
                }
                parent_rncp_title {
                  _id
                  short_name
                }
                parent_test {
                  expected_documents {
                    _id
                    document_name
                  }
                  date_type
                  date {
                    date_utc
                    time_utc
                  }
                  _id
                }
                uploaded_for_student {
                  first_name
                  last_name
                }
                uploaded_for_other_user {
                  first_name
                  last_name
                }
                uploaded_for_group {
                  _id
                  name
                }
                document_expected_id {
                  _id
                  document_name
                }
                publication_date {
                  type
                  before
                  day
                  publication_date {
                    date
                    time
                  }
                  relative_time
                }
                published_for_user_types_id {
                  _id
                  name
                }
              }
              tests {
                _id
                name
                group_test
                correction_type
                is_published
                documents {
                  _id
                  document_generation_type
                  document_name
                  type_of_document
                  s3_file_name
                  published_for_student
                  parent_class_id {
                    _id
                    name
                  }
                }
              }
              parent_folder_id {
                _id
                is_default_folder
                folder_name
              }
              jury_id {
                _id
                type
              }
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllDocs']));
  }

  deleteBlockOfSoftSkillTemplate(blockId: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
      mutation {
        DeleteSoftSkillBlockTemplate(_id: "${blockId}")
      }
      `,
      errorPolicy: 'all',
    });
  }

  deleteSoftSkillCompetencyTemplate(compId: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
      mutation {
        DeleteSoftSkillCompetenceTemplate(_id: "${compId}")
      }
      `,
      errorPolicy: 'all',
    });
  }

  deleteSoftSkillCriteriaEvaluationTemplate(evaId: string): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
      mutation {
        DeleteSoftSkillEvaluationTemplate(_id: "${evaId}")
      }
      `,
      errorPolicy: 'all',
    });
  }
  // End of Third step eval by experise

  GetAllTitleDropdownList(search: string) {
    return this.apollo
      .query({
        query: gql`
        query {
          GetTitleDropdownList(search: "${search}") {
            _id
            short_name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetTitleDropdownList']));
  }

  GetAllTitlePublish(search: string) {
    return this.apollo
      .query({
        query: gql`
        query {
          GetTitleDropdownList(search: "${search}", isPublished: publish) {
            _id
            short_name
            specializations {
              _id
              name
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetTitleDropdownList']));
  }

  getAllClassDropdownList(rncpId: string) {
    return this.apollo
      .query({
        query: gql`
      query {
        GetClassDropdownList(rncp_id : "${rncpId}"){
          _id
          name
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetClassDropdownList'];
        }),
      );
  }

  getAllFormFollowUpDropdown(filter) {
    return this.apollo
      .query({
        query: gql`
          query GetAllFormFollowUpDropdown($filter: FormFollowUpDropdownFilterInput) {
            GetAllFormFollowUpDropdown(filter: $filter) {
              rncp_title_id {
                _id
                short_name
              }
              class_ids {
                _id
                name
              }
            }
          }
        `,
        variables: {
          filter,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllFormFollowUpDropdown']));
  }

  getAllClassDropdownListByEvaluationType(rncpId: string, evaluationType: string) {
    return this.apollo
      .query({
        query: gql`
          query getAllClassDropdownListByEvaluationType($rncp_id: ID, $type_evaluation: EnumTypeEvaluation) {
            GetClassDropdownList(rncp_id: $rncp_id, type_evaluation: $type_evaluation) {
              _id
              name
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          rncp_id: rncpId,
          type_evaluation: evaluationType,
        },
      })
      .pipe(
        map((resp) => {
          return resp.data['GetClassDropdownList'];
        }),
      );
  }

  getAlltestDropdownList(rncpId: string, classId: string) {
    return this.apollo
      .query({
        query: gql`
      query {
        GetAllTests(rncp_title_id : "${rncpId}", class_id : "${classId}"){
          _id
          name
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllTests'];
        }),
      );
  }

  getAlltestDropdownListMultipleClass(rncp_title_id: string, class_ids) {
    return this.apollo
      .query({
        query: gql`
          query GetAllTests($rncp_title_id: ID, $class_ids: [ID]) {
            GetAllTests(rncp_title_id: $rncp_title_id, class_ids: $class_ids) {
              _id
              name
              class_id {
                _id
                name
              }
            }
          }
        `,
        variables: {
          rncp_title_id,
          class_ids,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllTests'];
        }),
      );
  }

  getAllManualTask(filter: any) {
    return this.apollo
      .query({
        query: gql`
          query GetAllTasks($filter: TaskFilterInput) {
            GetAllTasks(filter: $filter) {
              _id
              test_group_id {
                _id
                name
              }
              task_status
              due_date {
                date
                time
              }
              created_date {
                date
                time
              }
              rncp {
                _id
                short_name
              }
              school {
                _id
                short_name
              }
              class_id {
                _id
                name
              }
              created_by {
                _id
                civility
                first_name
                last_name
              }
              user_selection {
                user_id {
                  _id
                  civility
                  first_name
                  last_name
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
                  student_id {
                    _id
                  }
                }
                user_type_id {
                  _id
                  name
                }
              }
              description
              type
              test {
                _id
                date_type
                type
                date_type
                name
                group_test
                correction_type
                subject_id {
                  subject_name
                }
                evaluation_id {
                  _id
                  evaluation
                }
                parent_category {
                  _id
                  folder_name
                }
              }
              priority
              count_document
              expected_document_id
              task_status
              for_each_student
              for_each_group
              expected_document {
                file_type
              }
              student_id {
                _id
                first_name
                last_name
                civility
              }
              action_taken
              document_expecteds {
                name
              }
              employability_survey_id {
                _id
                employability_survey_process_id {
                  name
                }
              }
              jury_member_id
              jury_id {
                _id
                name
                type
                jury_members {
                  _id
                  students {
                    student_id {
                      _id
                    }
                    date_test
                    test_hours_start
                  }
                }
              }
              form_process_step_id {
                step_title
              }
            }
          }
        `,
        variables: {
          filter,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllTasks'];
        }),
      );
  }

  getAllTestGroupTestDropdownList(rncpId: string, classId: string) {
    return this.apollo
      .query({
        query: gql`
      query {
        GetAllTests(rncp_title_id : "${rncpId}", class_id : "${classId}", is_group_test: true){
          _id
          name
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllTests'];
        }),
      );
  }

  getOneTitleByIdForCourse(titleId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneTitle(_id: "${titleId}") {
            _id
            short_name
            classes {
              _id
              name
              registration_period {
                start_date {
                  date
                  time
                }
                end_date {
                  date
                  time
                }
              }
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTitle']));
  }

  getSpecializationByClass(classId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneClass(_id: "${classId}") {
            _id
            name
            specializations {
              _id
              name
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneClass']));
  }

  GetAllDocuments(rncpId: string, customRequest: string) {
    return this.apollo
      .query({
        query: gql`
        query {
          GetAllDocs(published_for_student: true, rncp_title_id: "${rncpId}") {
            _id
            document_name
            ${customRequest}
            parent_class_id{
              _id
              name
            }
            published_for_student
            s3_file_name
            type_of_document
            document_generation_type
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllDocs']));
  }

  CountParentFolderDeepForDocument(rncpId: string): Observable<number> {
    return this.apollo
      .query({
        query: gql`
        query {
          CountParentFolderDeepForDocument(rncp_title_id: "${rncpId}")
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['CountParentFolderDeepForDocument']));
  }

  getClassSpecializations(classId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetOneClass(_id:"${classId}"){
          _id
          name
          specializations {
            _id
            name
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneClass']));
  }

  getClassNameFromId(classId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneClass(_id: "${classId}") {
            name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneClass']));
  }

  getTitlesOfCurrentUser(schoolId: string): Observable<RncpTitleIdAndName[]> {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
        query{
          GetAllTitles(filter_by_user_login: all, school_id: "${schoolId}"){
            _id
            short_name
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
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

  importStep2Template(payload, file: File): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ImportAcademicSkillTemplate($import_block_template_input: ImportBlockTemplateInput, $file: Upload!) {
            ImportAcademicSkillTemplate(import_block_template_input: $import_block_template_input, file: $file) {
              _id
              ref_id
            }
          }
        `,
        variables: {
          import_block_template_input: payload,
          file: file,
        },
        context: {
          useMultipart: true,
        },
      })
      .pipe(map((resp) => resp.data['ImportAcademicSkillTemplate']));
  }

  importStep3Template(payload, file: File): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ImportSoftSkillTemplate($import_block_template_input: ImportBlockTemplateInput, $file: Upload!) {
            ImportSoftSkillTemplate(import_block_template_input: $import_block_template_input, file: $file) {
              _id
              ref_id
            }
          }
        `,
        variables: {
          import_block_template_input: payload,
          file: file,
        },
        context: {
          useMultipart: true,
        },
      })
      .pipe(map((resp) => resp.data['ImportSoftSkillTemplate']));
  }

  exportGroupCSV(rncp_id, class_id, test_id, delimiter, lang): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
      mutation {
        ExportGroups(rncp_id: "${rncp_id}", class_id: "${class_id}", test_id: "${test_id}", delimiter: "${delimiter}", lang: "${lang}")
      }
      `,
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['ExportGroups']));
  }

  TaskN7ForStatusUpdate(payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation TaskN7ForStatusUpdate($rncp_id: ID!, $class_id: ID!, $test_id: [ID], $delimiter: EnumDelimiter) {
            TaskN7ForStatusUpdate(rncp_id: $rncp_id, class_id: $class_id, test_id: $test_id, delimiter: $delimiter, lang: "${this.translate.currentLang}")
          }
        `,
        variables: {
          rncp_id: payload.rncp_id,
          class_id: payload.class_id,
          test_id: payload.test_id,
          delimiter: payload.file_delimeter,
        },
      })
      .pipe(map((resp) => resp.data['TaskN7ForStatusUpdate']));
  }

  TaskN7ForStatusUpdateManualTask(payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation TaskN7ForStatusUpdate($rncp_id: ID!, $class_id: ID!, $manual_parent_task_id: [ID], $delimiter: EnumDelimiter) {
            TaskN7ForStatusUpdate(rncp_id: $rncp_id, class_id: $class_id, manual_parent_task_id: $manual_parent_task_id, delimiter: $delimiter, lang: "${this.translate.currentLang}")
          }
        `,
        variables: {
          rncp_id: payload.rncp_id,
          class_id: payload.class_id,
          manual_parent_task_id: payload.test_id,
          delimiter: payload.file_delimeter,
        },
      })
      .pipe(map((resp) => resp.data['TaskN7ForStatusUpdate']));
  }

  GetResponseForStatusUpdate(rncpId: string, classId: string): Observable<any> {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
          query GetResponseForStatusUpdate($rncp_id: ID, $class_id: [ID]) {
            GetResponseForStatusUpdate(rncp_id: $rncp_id, class_id: $class_id)
          }
        `,
        fetchPolicy: 'network-only',
        variables: { rncpId, classId },
      })
      .pipe(map((resp) => resp.data['GetResponseForStatusUpdate']));
  }

  GetResponseForExportStatusUpdate(rncpId: string, classId: string, testId: string): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetResponseForExportStatusUpdate($lang: String!) {
            GetResponseForExportStatusUpdate(lang: $lang, rncp_id: "${rncpId}", class_id: "${classId}", test_id: "${testId}") {
              _id
              school {
                _id
                short_name
                long_name
              }
              rncp_title {
                _id
                short_name
                long_name
              }
              current_class {
                _id
                name
              }
              first_name
              last_name
              civility
              email
              test_name
              document_name
              student_document_name
              document_link
              upload_date
              upload_time
              student_score
              group_name
            }
          }
        `,
        variables: {
          lang: localStorage.getItem('currentLang'),
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetResponseForExportStatusUpdate']));
  }

  SendEmailStatusUpdate(test_id, delimiter): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SendEmailStatusUpdate($test_id: [ID], $delimiter: EnumDelimiter) {
            SendEmailStatusUpdate(test_id:$test_id , delimiter: $delimiter, lang: "${this.translate.currentLang}")
          }
        `,
        variables: {
          test_id,
          delimiter,
        },
      })
      .pipe(map((resp) => resp.data['SendEmailStatusUpdate']));
  }

  SendEmailStatusUpdateManualTask(manual_parent_task_id, delimiter): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SendEmailStatusUpdate($manual_parent_task_id: [ID], $delimiter: EnumDelimiter) {
            SendEmailStatusUpdate(manual_parent_task_id: $manual_parent_task_id, delimiter: $delimiter, lang: "${this.translate.currentLang}")
          }
        `,
        variables: {
          manual_parent_task_id,
          delimiter,
        },
      })
      .pipe(map((resp) => resp.data['SendEmailStatusUpdate']));
  }

  saveNewQuestion(payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
        mutation {
          CreateCriteriaOfEvaluationTemplateQuestion(criteria_of_evaluation_template_question_input: {
            s3_file_name: "${payload.s3_file_name}",
            block_of_template_competence_id: "${payload.block_of_template_competence_id}"
          }) {
            s3_file_name
            block_of_template_competence_id {
              _id
              name
            }
            status
          }
        }
        `,
      })
      .pipe(map((resp) => resp));
  }

  getLimitationForDocument(doc_id): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetLimitationForDocument($doc_id: ID) {
            GetLimitationForDocument(doc_id: $doc_id) {
              student_allow
              operator_allow
              acad_allow
            }
          }
        `,
        variables: {
          doc_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetLimitationForDocument']));
  }

  getGrandOralPDF(jury_id, student_id, user_type_id) {
    return this.apollo
      .query({
        query: gql`
          query GetGrandOralPDF($jury_id: ID, $student_id: ID, $user_type_id: ID) {
            GetGrandOralPDF(jury_id: $jury_id, student_id: $student_id, user_type_id: $user_type_id)
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          jury_id,
          student_id,
          user_type_id,
        },
      })
      .pipe(
        map((resp) => {
          return resp.data['GetGrandOralPDF'];
        }),
      );
  }

  getAllSchoolConnectWithClass(origin_class_id, target_class_id) {
    return this.apollo
      .query({
        query: gql`
          query GetAllSchoolConnectWithClass($origin_class_id: ID, $target_class_id: ID) {
            GetAllSchoolConnectWithClass(origin_class_id: $origin_class_id, target_class_id: $target_class_id) {
              school_id {
                _id
                short_name
                long_name
              }
              connect_to_class
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          origin_class_id,
          target_class_id,
        },
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllSchoolConnectWithClass'];
        }),
      );
  }

  getAllUserConnectWithClass(origin_class_id, current_class_id) {
    return this.apollo
      .query({
        query: gql`
          query GetAllUserConnectWithClass($origin_class_id: ID, $current_class_id: ID) {
            GetAllUserConnectWithClass(origin_class_id: $origin_class_id, current_class_id: $current_class_id) {
              user_id {
                _id
                first_name
                last_name
                civility
                full_name
              }
              entity {
                school {
                  _id
                  short_name
                }
                companies {
                  _id
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
                entity_name
              }
              connect_to_class
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          origin_class_id,
          current_class_id,
        },
      })
      .pipe(
        map((resp) => {
          return resp.data['GetAllUserConnectWithClass'];
        }),
      );
  }

  connectMultipleSchoolToClass(class_id: any, schools): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ConnectMultipleSchoolToClass($class_id: ID, $schools: [ConnectMultipleSchoolToClassSchoolInput]) {
            ConnectMultipleSchoolToClass(class_id: $class_id, schools: $schools) {
              school_id {
                _id
              }
            }
          }
        `,
        variables: {
          class_id,
          schools,
        },
        errorPolicy: 'all',
      })
      .pipe(
        map((resp) => {
          return resp.data['ConnectMultipleSchoolToClass'];
        }),
      );
  }
  connectMultipleUserToClass(class_id, entities_input: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ConnectMultipleUserToClass($class_id: ID, $entities_input: [ConnectUserToClassEntityInput], $lang: String) {
            ConnectMultipleUserToClass(class_id: $class_id, entities_input: $entities_input, lang: $lang) {
              user_id {
                _id
              }
              school_has_acad_dir {
                short_name
              }
            }
          }
        `,
        variables: {
          class_id,
          entities_input,
          lang: localStorage.getItem('currentLang'),
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['ConnectMultipleUserToClass']));
  }

  checkActiveTaskInTitleSchoolAndClass(user_id, rncp_id, school_id, class_id): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query CheckActiveTaskInTitleSchoolAndClass($user_id: ID!, $rncp_id: ID!, $school_id: ID!, $class_id: ID!) {
            CheckActiveTaskInTitleSchoolAndClass(user_id: $user_id, rncp_id: $rncp_id, school_id: $school_id, class_id: $class_id)
          }
        `,
        variables: {
          user_id,
          rncp_id,
          school_id,
          class_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['CheckActiveTaskInTitleSchoolAndClass']));
  }
  getAllTaskBuilder(pagination, sorting, filter): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllTaskBuilder($pagination: PaginationInput, $sorting: TaskBuilderSorting, $filter: TaskBuilderFilter) {
            GetAllTaskBuilder(pagination: $pagination, sorting: $sorting, filter: $filter) {
              _id
              is_published
              ref_id
              task_scope
              task_title
              is_already_generated
              assigner_id {
                _id
                name
              }
              assign_to_id {
                _id
                name
              }
              due_date {
                date
                time
              }
              class_id {
                _id
                is_task_builder_generated
              }
              count_document
            }
          }
        `,
        variables: {
          pagination,
          sorting,
          filter,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTaskBuilder']));
  }

  getAllTaskBuilderDropdown(filter): Observable<any> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllTaskBuilder($filter: TaskBuilderFilter) {
            GetAllTaskBuilder(filter: $filter) {
              _id
              ref_id
              task_title
            }
          }
        `,
        variables: {
          filter,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTaskBuilder']));
  }

  getAllSchool(schoolType, class_id): Observable<any[]> {
    return this.apollo
      .query<any[]>({
        query: gql`
          query GetAllSchools($school_type: EnumSchoolType, $class_id: ID) {
            GetAllSchools(school_type: $school_type, class_id: $class_id) {
              _id
              short_name
            }
          }
        `,
        variables: {
          schoolType,
          class_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllSchools']));
  }
  publishTaskBuilder(_id): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation PublishTaskBuilder($_id: ID!) {
            PublishTaskBuilder(_id: $_id) {
              _id
            }
          }
        `,
        variables: {
          _id,
        },
      })
      .pipe(map((resp) => resp.data['PublishTaskBuilder']));
  }
  removeTaskBuilder(_id): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation RemoveTaskBuilder($_id: ID!) {
            RemoveTaskBuilder(_id: $_id) {
              _id
            }
          }
        `,
        variables: {
          _id,
        },
      })
      .pipe(map((resp) => resp.data['RemoveTaskBuilder']));
  }
  getAllTaskBuilderNotificationAndMessages(filter, pagination) {
    return this.apollo
      .query({
        query: gql`
          query GetAllTaskBuilderNotificationAndMessages(
            $filter: TaskBuilderNotificationAndMessageFilterInput
            $pagination: PaginationInput
          ) {
            GetAllTaskBuilderNotificationAndMessages(filter: $filter, pagination: $pagination) {
              _id
              status
              type
              ref_id
              subject
              body
              trigger_condition
              attachments {
                name
                s3_file_name
              }
              recipient {
                _id
                name
              }
              recipient_in_cc {
                _id
                name
              }
              signatory {
                _id
                name
              }
              image
              label_back
              label_continue
              count_document
            }
          }
        `,
        variables: {
          filter,
          pagination,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTaskBuilderNotificationAndMessages']));
  }

  updateTaskBuilderNotificationAndMessage(_id, task_builder_notification_and_message) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateTaskBuilderNotificationAndMessage(
            $_id: ID
            $task_builder_notification_and_message: TaskBuilderNotificationAndMessageInput
          ) {
            UpdateTaskBuilderNotificationAndMessage(
              _id: $_id
              task_builder_notification_and_message: $task_builder_notification_and_message
            ) {
              _id
              status
              type
              task_builder_id {
                _id
              }
              ref_id
              recipient {
                _id
                name
              }
              recipient_in_cc {
                _id
                name
              }
              signatory {
                _id
                name
              }
              sending_condition
              subject
              body
              attachments {
                name
                s3_file_name
              }
            }
          }
        `,
        variables: {
          _id,
          task_builder_notification_and_message,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['UpdateTaskBuilderNotificationAndMessage']));
  }

  getOneTaskBuilderNotificationAndMessage(_id) {
    return this.apollo
      .query({
        query: gql`
          query GetOneTaskBuilderNotificationAndMessage($_id: ID!) {
            GetOneTaskBuilderNotificationAndMessage(_id: $_id) {
              _id
              status
              type
              ref_id
              task_builder_id {
                _id
                task_title
                rncp_title_id {
                  short_name
                }
                class_id {
                  name
                }
              }
              recipient {
                _id
                name
              }
              recipient_in_cc {
                _id
                name
              }
              signatory {
                _id
                name
              }
              sending_condition
              subject
              body
              trigger_condition
              image
              label_back
              label_continue
              attachments {
                name
                s3_file_name
              }
            }
          }
        `,
        variables: {
          _id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTaskBuilderNotificationAndMessage']));
  }

  createNotificationAndMessage(task_builder_notification_and_message) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateNotificationAndMessage($task_builder_notification_and_message: TaskBuilderNotificationAndMessageInput) {
            CreateNotificationAndMessage(task_builder_notification_and_message: $task_builder_notification_and_message) {
              _id
              status
              type
              task_builder_id {
                _id
              }
              ref_id
              recipient {
                _id
                name
              }
              recipient_in_cc {
                _id
                name
              }
              signatory {
                _id
                name
              }
              sending_condition
              subject
              body
              attachments {
                name
                s3_file_name
              }
            }
          }
        `,
        variables: {
          task_builder_notification_and_message,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['CreateNotificationAndMessage']));
  }
  getAllUserADMTC(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUsers(user_type: ["5a2e1ecd53b95d22c82f954b"]) {
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

  getClassAutomaticTask(classId: string) {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneClass(_id: "${classId}") {
            _id
            name
            is_task_builder_selected
            is_task_builder_generated
            is_all_task_builder_published
            parent_rncp_title {
              _id
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetOneClass'];
        }),
      );
  }

  getTitleManagerSchoolSizeGraphic(rncp_title, class_id) {
    return this.apollo
      .query({
        query: gql`
          query GetTitleManagerSchoolSizeGraphic($rncp_title: ID!, $class_id: ID!) {
            GetTitleManagerSchoolSizeGraphic(rncp_title: $rncp_title, class_id: $class_id) {
              school_id {
                _id
                short_name
              }
              total_student
            }
          }
        `,
        variables: {
          rncp_title,
          class_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetTitleManagerSchoolSizeGraphic']));
  }
  getAllManagerTasks(filter, sorting, pagination) {
    return this.apollo
      .query({
        query: gql`
          query GetAllManagerTasks($filter: ManagerTaskFilterInput, $sorting: ManagerTaskSortingInput, $pagination: PaginationInput) {
            GetAllManagerTasks(filter: $filter, sorting: $sorting, pagination: $pagination) {
              _id
              scope
              description
              validation_status
              due_date {
                date
                time
              }
              school {
                short_name
                _id
              }
              class_id {
                _id
                name
              }
              rncp {
                _id
                short_name
                admtc_dir_responsible {
                  first_name
                  last_name
                  civility
                }
              }
              created_by {
                _id
                first_name
                last_name
              }
              user_selection {
                user_id {
                  _id
                  first_name
                  last_name
                  civility
                }
                user_type_id {
                  _id
                  name
                }
              }
              count_document
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
      .pipe(map((resp) => resp.data['GetAllManagerTasks']));
  }

  getTitleHaveTaskBuilder() {
    return this.apollo
      .query<RncpTitleIdAndName[]>({
        query: gql`
          query {
            GetAllTitles(should_have_class: true, is_already_have_task_builder: true) {
              _id
              short_name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getClassHaveTaskBuilder(titleId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query getClassListJury{
            GetAllClasses(rncp_id: "${titleId}", is_already_have_task_builder: true){
              _id
              name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllClasses']));
  }

  getTitleManagerRegistration(rncp_title, class_id) {
    return this.apollo
      .query({
        query: gql`
      query GetTitleManagerRegistrationGraphic {
        GetTitleManagerRegistrationGraphic(rncp_title: "${rncp_title}", class_id: "${class_id}") {
          school_id {
            _id
            short_name
            long_name
          }
          completed_registration_count
          not_completed_registration_count
          total_student
        }
      }
      
      `,
        variables: {
          rncp_title,
          class_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetTitleManagerRegistrationGraphic']));
  }

  getTitleManagerTaskGraphic(rncp_title, class_id) {
    return this.apollo
      .query({
        query: gql`
          query GetTitleManagerTaskGraphic($rncp_title: ID!, $class_id: ID!) {
            GetTitleManagerTaskGraphic(rncp_title: $rncp_title, class_id: $class_id) {
              school_id {
                _id
                short_name
              }
              total_task_late
            }
          }
        `,
        variables: {
          rncp_title,
          class_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetTitleManagerTaskGraphic']));
  }

  getAllStudentAdmissionProcesses(filter, sorting, pagination): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllStudentAdmissionProcesses(
            $filter: StudentAdmissionProcessFilterInput
            $sorting: StudentAdmissionProcessSortingInput
            $pagination: PaginationInput
          ) {
            GetAllStudentAdmissionProcesses(filter: $filter, sorting: $sorting, pagination: $pagination) {
              _id
              admission_status
              count_document
              rncp_title_id {
                _id
                short_name
              }
              student_id {
                _id
                first_name
                last_name
                civility
                email
              }
              school_id {
                _id
                short_name
              }
              form_builder_id {
                _id
                form_builder_name
                steps {
                  _id
                  index
                  step_title
                }
              }
              steps {
                _id
                index
                step_title
                step_status
                form_builder_step {
                  _id
                }
              }
              signature_date {
                date
                time
              }
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
      .pipe(map((resp) => resp.data['GetAllStudentAdmissionProcesses']));
  }

  getSchoolDropDown(titleId: string, classId: string, school_type): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllSchoolsForTest($rncp_title_ids: [ID], $class_id: ID, $school_type: EnumSchoolType) {
            GetAllSchools(rncp_title_ids: $rncp_title_ids, class_id: $class_id, school_type: $school_type) {
              _id
              short_name
            }
          }
        `,
        variables: {
          rncp_title_ids: [titleId],
          class_id: classId,
          school_type: school_type,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllSchools']));
  }

  getTitleManagerCompanyGraphic(rncp_title_id, class_id) {
    return this.apollo
      .query({
        query: gql`
          query GetTitleManagerCompanyGraphic($rncp_title_id: ID!, $class_id: ID!) {
            GetTitleManagerCompanyGraphic(rncp_title_id: $rncp_title_id, class_id: $class_id) {
              total_student_with_active_contract
              total_student
            }
          }
        `,
        variables: {
          rncp_title_id,
          class_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetTitleManagerCompanyGraphic']));
  }

  getCompanayProcess(rncp_title_id, class_id) {
    return this.apollo
      .query({
        query: gql`
          query GetCompanyProcess($rncp_title_id: ID!, $class_id: ID!) {
            GetCompanyProcess(rncp_title_id: $rncp_title_id, class_id: $class_id) {
              school_id {
                _id
                short_name
              }
              total_student
              student_with_active_contract_count
              job_description_done_count
              problematic_done_count
              mentor_evaluation_done_count
              pro_evaluation_done_count
              soft_skill_pro_evaluation_done_count
            }
          }
        `,
        variables: {
          rncp_title_id,
          class_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetCompanyProcess']));
  }
  getOneTask(_id) {
    return this.apollo
      .query({
        query: gql`
          query GetOneTask($_id: ID!) {
            GetOneTask(_id: $_id) {
              _id
              due_date {
                date
                time
              }
              scope
              description
              created_by {
                _id
                civility
                first_name
                last_name
              }
              user_selection {
                user_id {
                  _id
                  civility
                  first_name
                  last_name
                }
                user_type_id {
                  _id
                  name
                }
              }
            }
          }
        `,
        variables: {
          _id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTask']));
  }

  getAllTaskBuilderMessages(filter) {
    return this.apollo
      .query({
        query: gql`
          query GetAllTaskBuilderNotificationAndMessages(
            $filter: TaskBuilderNotificationAndMessageFilterInput
            $pagination: PaginationInput
          ) {
            GetAllTaskBuilderNotificationAndMessages(filter: $filter, pagination: $pagination) {
              _id
              status
              type
              ref_id
              subject
              body
              trigger_condition
              attachments {
                name
                s3_file_name
              }
              recipient {
                _id
                name
              }
              recipient_in_cc {
                _id
                name
              }
              signatory {
                _id
                name
              }
              image
              label_back
              label_continue
              count_document
            }
          }
        `,
        variables: {
          filter,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTaskBuilderNotificationAndMessages']));
  }

  exportTitleGovernmentRegistration(
    rncp_title_id: string,
    class_id: string,
    selection_type: string,
    school_id: string,
    student_ids,
    date_of_issuance,
  ) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ExportTitleGovernmentRegistration(
            $rncp_title_id: ID
            $class_id: ID
            $selection_type: String
            $school_id: ID
            $student_ids: [ID]
            $date_of_issuance: String
          ) {
            ExportTitleGovernmentRegistration(
              rncp_title_id: $rncp_title_id
              class_id: $class_id
              selection_type: $selection_type
              school_id: $school_id
              student_ids: $student_ids
              date_of_issuance: $date_of_issuance
            ) {
              s3_file_name
            }
          }
        `,
        variables: {
          rncp_title_id: rncp_title_id,
          class_id: class_id,
          selection_type,
          school_id,
          student_ids,
          date_of_issuance,
        },
      })
      .pipe(map((resp) => resp.data['ExportTitleGovernmentRegistration']));
  }

  getTitleManager(titleId) {
    return this.apollo
      .query({
        query: gql`
          query GetTitleManager($titleId: ID!) {
            GetOneTitle(_id: $titleId) {
              _id
              short_name
              admtc_dir_responsible {
                _id
                first_name
                last_name
                civility
                email
              }
              secondary_admtc_dir_responsible {
                _id
                first_name
                last_name
                civility
                email
              }
            }
          }
        `,
        variables: {
          titleId,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTitle']));
  }

  getTitleDropdownList(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetTitleDropdownList {
            GetTitleDropdownList {
              _id
              short_name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetTitleDropdownList']));
  }

  getClassDropdownList(rncp_ids): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetClassDropdownList($rncp_ids: [ID]) {
            GetClassDropdownList(rncp_ids: $rncp_ids) {
              _id
              name
            }
          }
        `,
        variables: {
          rncp_ids: rncp_ids && rncp_ids.length ? rncp_ids : null,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetClassDropdownList']));
  }
  reCalculateGrandOralCorrectionDecision(rncp_title_id: string, class_id: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ReCalculateGrandOralCorrectionDecision($rncp_title_id: ID!, $class_id: ID!, $lang: String) {
            ReCalculateGrandOralCorrectionDecision(rncp_title_id: $rncp_title_id, class_id: $class_id, lang: $lang)
          }
        `,
        variables: {
          rncp_title_id: rncp_title_id,
          class_id: class_id,
          lang: this.translate.currentLang,
        },
      })
      .pipe(map((resp) => resp.data['ReCalculateGrandOralCorrectionDecision']));
  }

  checkTranscriptProcess(filter) {
    return this.apollo
      .query({
        query: gql`
          query GetAllTranscriptProcess(
            $pagination: PaginationInput
            $sorting: TranscriptProcessSorting
            $filter: TranscriptProcessFilter
          ) {
            GetAllTranscriptProcess(pagination: $pagination, sorting: $sorting, filter: $filter) {
              _id
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          pagination: {
            limit: 10,
            page: 0,
          },
          sorting: null,
          filter,
        },
      })
      .pipe(map((resp) => resp.data['GetAllTranscriptProcess']));
  }

  DownloadDocumentCertificationRuleForUser(rncp_id: string, class_id: string, school_id: string, s3_file_name: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation DownloadDocumentCertificationRuleForUser(
            $rncp_id: ID!
            $class_id: ID!
            $school_id: ID!
            $s3_file_name: String!
            $lang: String!
          ) {
            DownloadDocumentCertificationRuleForUser(
              rncp_id: $rncp_id
              class_id: $class_id
              school_id: $school_id
              s3_file_name: $s3_file_name
              lang: $lang
            )
          }
        `,
        variables: {
          rncp_id: rncp_id,
          class_id: class_id,
          school_id: school_id,
          s3_file_name: s3_file_name,
          lang: this.translate.currentLang,
        },
      })
      .pipe(map((resp) => resp.data['DownloadDocumentCertificationRuleForUser']));
  }

  getAllAcadKitForQuickSearch(payload, pagination, sorting, userTypeId) {
    return this.apollo
      .query({
        query: gql`
          query GetAllAcadKitForQuickSearch(
            $class_id: ID, 
            $rncp_title_id: ID,
            $pagination: Pagination,
            $document_name: String,
            $sorting: AcadKitQuickSearchSortingInput,
            $userTypeId: ID
          ) {
            GetAllAcadKitForQuickSearch(
              class_id: $class_id, 
              rncp_title_id: $rncp_title_id, 
              pagination: $pagination,
              document_name: $document_name,
              sorting: $sorting,
              user_type_id: $userTypeId
            ) {
              document_id
              row_id
              document_name
              s3_file_name
              evaluation_name
              folder_name
              document_generation_type
              test_type
              type_of_document
              school_id {
                _id
                short_name
              }
              count_document
            }
          }
        `,
        variables: {
          class_id: payload?.class_id, 
          rncp_title_id: payload?.rncp_title_id,
          document_name: payload?.document_name,
          pagination,
          sorting,
          userTypeId
        }, fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllAcadKitForQuickSearch']));
  }

  deleteTitleGovFile(payload): Observable<any> {
    return this.apollo.mutate({
      mutation: gql`
        mutation DeleteTitleGovernmentRegistration($classId: ID, $fileName: String, $dateGenerated: String, $timeGenerated: String) {
          DeleteTitleGovernmentRegistration(
            classId: $classId
            fileName: $fileName
            dateGenerated: $dateGenerated
            timeGenerated: $timeGenerated
          ) {
            _id
            name
          }
        }
      `,
      variables: {
        classId: payload?.classId,
        fileName: payload?.s3_file_name,
        dateGenerated: payload?.original_date_generated_at,
        timeGenerated: payload?.original_time_generated_at,
      },
      errorPolicy: 'all',
    });
  }
}
