import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import { Observable, BehaviorSubject } from 'rxjs';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import {
  TestCreationRespData,
  TestCreationPayloadData,
  HeaderFooterFieldType,
  AddedDocumentData,
  AutomaticTask,
  TestProgress,
} from 'app/test/test-creation/test-creation.model';
import * as _ from 'lodash';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from 'environments/environment';
import { HttpLinkModule, HttpLink } from 'apollo-angular-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { ApolloLink } from 'apollo-link';

@Injectable({
  providedIn: 'root',
})
export class TestCreationService {
  // object as payload for test creation first to fifth step
  private testCreationSource = new BehaviorSubject<TestCreationPayloadData>(new TestCreationPayloadData());
  public testCreationData$ = this.testCreationSource.asObservable();

  // object to save saved formData to check validation when changing tab
  private savedTestCreationSource = new BehaviorSubject<TestCreationPayloadData>(new TestCreationPayloadData());
  public savedTestCreationData$ = this.testCreationSource.asObservable();

  // to check if test test creation data has arrived or request has finished
  private isTestCreationLoadedSource = new BehaviorSubject<boolean>(false);
  public isTestCreationLoaded$ = this.isTestCreationLoadedSource.asObservable();

  // To store the data of academic document
  private addedDocumentSource = new BehaviorSubject<AddedDocumentData[]>(null);
  public addedDocumentData$ = this.addedDocumentSource.asObservable();

  // To Store the test progress, if the test is already published
  private testProgressSource = new BehaviorSubject<TestProgress>(null);
  public testProgressData$ = this.testProgressSource.asObservable();

  private selectedTestIdSource = new BehaviorSubject<string>('');
  public selectedTestId$ = this.selectedTestIdSource.asObservable();

  private firstTabValidSource = new BehaviorSubject<boolean>(false);
  public firstTabValidData$ = this.firstTabValidSource.asObservable();

  private updateTestContinueSource = new BehaviorSubject<string>('');
  public updateTestContinueData$ = this.updateTestContinueSource.asObservable();

  private updateTestPreviousSource = new BehaviorSubject<string>('');
  public updateTestPreviousData$ = this.updateTestPreviousSource.asObservable();

  private updateTestPublishSource = new BehaviorSubject<string>('');
  public updateTestPublishData$ = this.updateTestPublishSource.asObservable();

  private schoolCountSource = new BehaviorSubject<any[]>([]);
  public schoolCountData$ = this.schoolCountSource.asObservable();

  public sharedData = false;

  constructor(private apollo: Apollo, private httpClient: HttpClient, httpLink: HttpLink) {
    const uriTask = environment.apiUrlTask;
    const options2: any = { uri: uriTask };

    apollo.createNamed('taskService', {
      link: httpLink.create(options2),
      cache: new InMemoryCache({
        addTypename: false,
      }),
    });
  }

  getTestCreationDataWithoutSubscribe() {
    return _.cloneDeep(this.testCreationSource.getValue());
  }

  getCleanTestCreationData() {
    // this function will return clean test creation data without dummy fields like isEditMode, etc.
    // so the data can be saved normally
    const data: TestCreationPayloadData = _.cloneDeep(this.testCreationSource.getValue());
    delete data._id;
    // delete data.correction_grid.header.directive_long;
    data.correction_grid.header.fields.forEach((field) => {
      delete field.isEditMode;
    });
    data.correction_grid.footer.fields.forEach((field) => {
      delete field.isEditMode;
    });
    data.correction_grid.correction.penalties.forEach((field) => {
      delete field.isEditMode;
    });
    data.correction_grid.correction.bonuses.forEach((field) => {
      delete field.isEditMode;
    });
    data.calendar.steps.forEach((field) => {
      delete field.isEditMode;
      delete field.senderData;
    });
    data.correction_grid.correction.sections.forEach((section, sectionIndex) => {
      section.score_conversions.forEach((scoreConversion, scoreConversionIndex) => {
        if (!scoreConversion._id) {
          delete scoreConversion._id;
        }
      });
    });
    // fix corrector_assigned payload
    if (data.corrector_assigned && data.corrector_assigned.length) {
      data.corrector_assigned.forEach((corr) => {
        corr.corrector_id = corr.corrector_id && corr.corrector_id._id ? corr.corrector_id._id : null;
        corr.school_id = corr.school_id && corr.school_id._id ? corr.school_id._id : null;
        corr.students = corr.students && corr.students.length ? corr.students.map((student) => student._id) : [];
        corr.test_groups = corr.test_groups && corr.test_groups.length ? corr.test_groups.map((grp) => grp._id) : [];
      });
    }
    return data;
  }

  getSavedTestCreationDataWithoutSubscribe() {
    return this.savedTestCreationSource.getValue();
  }

  isTestCreationLoaded() {
    return this.isTestCreationLoadedSource.value;
  }

  getTestCreationLoadedWithoutSubscribe() {
    return this.isTestCreationLoadedSource.getValue();
  }

  setTestCreationLoadedStatus(status: boolean) {
    this.isTestCreationLoadedSource.next(status);
  }

  setTestCreationData(data: TestCreationPayloadData) {
    this.testCreationSource.next(data);
  }

  setSavedTestCreationData(data: TestCreationPayloadData) {
    this.savedTestCreationSource.next(data);
  }

  resetSavedTestCreationData() {
    this.savedTestCreationSource.next(null);
    const tempTest = new TestCreationPayloadData();
    this.savedTestCreationSource.next(tempTest);
  }

  removeTestCreationData() {
    this.testCreationSource.next(null);
  }

  setTestProgressData(data: TestProgress) {
    this.testProgressSource.next(data);
  }

  getTestProgressDataWithoutSubscribe(): TestProgress {
    return this.testProgressSource.getValue();
  }

  removeTestProgressData() {
    this.testProgressSource.next(null);
  }

  setSelectedTestId(testId: string) {
    this.selectedTestIdSource.next(testId);
  }

  resetTestCreationData() {
    this.testCreationSource.next(null);
    const tempTest = new TestCreationPayloadData();
    this.testCreationSource.next(tempTest);
  }

  setFirstTabValidation(validation: boolean) {
    this.firstTabValidSource.next(validation);
  }

  getFirstTabValidationWithoutSubscribe(): boolean {
    return this.firstTabValidSource.getValue();
  }

  setContinueButton(currentStep: string) {
    this.updateTestContinueSource.next(currentStep);
  }

  setPreviousButton(currentStep: string) {
    this.updateTestPreviousSource.next(currentStep);
  }

  setPublishButton(currentStep: string) {
    this.updateTestPublishSource.next(currentStep);
  }

  removeContinueButton() {
    this.updateTestContinueSource.next('');
  }

  removePreviousButton() {
    this.updateTestPreviousSource.next('');
  }

  removePublishButton() {
    this.updateTestPublishSource.next('');
  }

  getAddedDocumentDataWithoutSubscribe() {
    return this.addedDocumentSource.getValue();
  }

  resetAddedDocumentData() {
    this.addedDocumentSource.next(null);
  }

  setAddedDocumentData(data) {
    this.addedDocumentSource.next(data);
  }

  resetSchoolData() {
    this.schoolCountSource.next([]);
  }

  setSchoolData(data) {
    this.schoolCountSource.next(data);
  }

  getSchoolDataWithoutSubscribe() {
    return this.schoolCountSource.getValue();
  }

  isTestDataNotchanged(): boolean {
    const formData = _.cloneDeep(this.getTestCreationDataWithoutSubscribe());
    const apiData = _.cloneDeep(this.getSavedTestCreationDataWithoutSubscribe());

    // dont compare evaluation's weight because it always changin in condition page.
    if (formData && formData.weight) {
      delete formData.weight;
    }
    if (apiData && apiData.weight) {
      delete apiData.weight;
    }

    return _.isEqual(formData, apiData);
  }

  getCalendarSteps(testId: string): Observable<TestCreationRespData> {
    return this.apollo
      .query({
        query: gql`
      query {
        GetOneTest(_id: "${testId}") {
          calendar {
            steps {
              text
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTest']));
  }

  isBlockCompetencyExist(blockId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query{
        CheckCompleteTemplate(block_id: "${blockId}") {
          have_score_conversion
          have_complete_template
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['CheckCompleteTemplate']));
  }

  CheckPhraseNameCompleted(testId: string) {
    return this.apollo
      .query({
        query: gql`
      query {
        CheckPhraseNameCompleted(test_id: "${testId}")
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['CheckPhraseNameCompleted']));
  }

  getTestCreationData(testId: string): Observable<TestCreationRespData> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetOneTest(_id: "${testId}") {
              _id
              is_published
              is_retake_test
              parent_rncp_title {
                _id
              }
              parent_category {
                _id
              }
              name
              class_id{
                _id
              }
              block_of_competence_condition_id {
                _id
              }
              block_type
              subject_id {
                _id
              }
              evaluation_id {
                _id
              }
              max_score
              coefficient
              type
              correction_type
              date {
                date_utc
                time_utc
              }
              send_date_to_mentor {
                date_utc
                time_utc
              }
              date_type
              weight
              quality_control
              student_per_school_for_qc
              quality_control_difference
              group_test
              controlled_test
              with_assign_corrector
              multiple_dates {
                date_utc
                time_utc
              }
              schools {
                school_id {
                  _id
                }
                test_date {
                  date_utc
                  time_utc
                }
              }
              calendar {
                steps {
                  created_from
                  text
                  task_type
                  start_after
                  sender_entity
                  sender_type {
                    _id
                  }
                  sender {
                    _id
                    civility
                    first_name
                    last_name
                  }
                  actor {
                    _id
                    name
                  }
                  date {
                    type
                    before
                    day
                    value {
                      date
                      time
                    }
                  }
                  is_automatic_task
                }
              }
              correction_grid {
                orientation
                header {
                  text
                  fields {
                    value
                    type
                    data_type
                    align
                  }
                  directive_long
                }
                group_detail {
                  header_text
                  no_of_student
                  min_no_of_student
                  group_allocation
                }
                correction {
                  show_as_list
                  show_notation_marks
                  show_direction_column
                  directions_column_header
                  show_number_marks_column
                  number_marks_column_header
                  show_letter_marks_column
                  letter_marks_column_header
                  show_phrase_marks_column
                  phrase_marks_column_header
                  comment_area
                  comments_header
                  comment_for_each_section
                  comment_for_each_section_header
                  comment_for_each_sub_section
                  comment_for_each_sub_section_header
                  show_final_comment
                  final_comment_header
                  display_final_total
                  total_zone {
                    display_additional_total
                    additional_max_score
                    decimal_place
                  }
                  show_penalty
                  penalty_header
                  show_bonus
                  bonus_header
                  show_elimination
                  sections {
                    title
                    maximum_rating
                    page_break
                    sub_sections {
                      title
                      maximum_rating
                      direction
                    }
                    score_conversions {
                      _id
                      score
                      phrase
                      letter
                    }
                  }
                  sections_evalskill {
                    academic_skill_competence_template_id {
                      _id
                    }
                    soft_skill_competence_template_id {
                      _id
                    }
                    academic_skill_block_template_id {
                      _id
                    }
                    soft_skill_block_template_id {
                      _id
                    }
                    ref_id
                    is_selected
                    title
                    page_break
                    sub_sections {
                      academic_skill_criteria_of_evaluation_competence_id {
                        _id
                      }
                      soft_skill_criteria_of_evaluation_competence_id {
                        _id
                      }
                      academic_skill_competence_template_id {
                        _id
                      }
                      soft_skill_competence_template_id {
                        _id
                      }
                      ref_id
                      is_selected
                      title
                      direction
                      maximum_rating
                    }
                    score_conversions {
                      _id
                      score
                      phrase
                      letter
                    }
                  }
                  penalties {
                    title
                    count
                  }
                  bonuses {
                    title
                    count
                  }
                }
                footer {
                  text
                  text_below
                  fields {
                    value
                    type
                    data_type
                    align
                  }
                }
              }
              corrector_assigned {
                corrector_id {
                  _id
                  first_name
                  last_name
                }
                school_id {
                  _id
                }
                students {
                  _id
                  first_name
                  last_name
                  civility
                  school {
                    _id
                    short_name
                  }
                  job_description_id {
                    block_of_template_competences {
                      competence_templates {
                        competence_template_id {
                          _id
                        }
                        missions_activities_autonomy {
                          mission
                          activity
                          autonomy_level
                        }
                      }
                    }
                  }
                }
                test_groups {
                  _id
                  name
                  students {
                    student_id {
                      _id
                      first_name
                      last_name
                      civility
                      email
                    }
                    individual_test_correction_id {
                      _id
                    }
                  }
                }
              }
              documents{
                _id
                document_name
                type_of_document
                s3_file_name
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
              expected_documents {
                _id
                document_name
                document_user_type {
                  _id
                }
                file_type
                is_for_all_student
                is_for_all_group
                deadline_date {
                  type
                  before
                  day
                  deadline {
                    date
                    time
                  }
                }
              }
              current_tab
              cross_corr_paperless
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTest']));
  }

  getTestDetail(testId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetOneTest(_id: "${testId}") {
              _id
              is_published
              group_test
              block_type
              parent_rncp_title {
                _id
              }
              class_id {
                _id
                name
              }
              parent_category {
                _id
              }
              name
              max_score
              type
              coefficient
              date {
                date_utc
                time_utc
              }
              calendar {
                steps {
                  text
                  date {
                    type
                    before
                    day
                    value {
                      date
                      time
                    }
                  }
                  is_automatic_task
                }
              }
              correction_type
              date_type
              organiser
              status
              documents{
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
                  schools {
                    school_id {
                      _id
                    }
                    test_date {
                      date_utc
                      time_utc
                    }
                  }
                }
              }
              expected_documents {
                document_name
                document_user_type {
                  _id
                }
                is_for_all_student
                deadline_date {
                  type
                  before
                  day
                  deadline {
                    date
                    time
                  }
                }
              }
              correction_grid {
                orientation
                header {
                  text
                  fields {
                    value
                    type
                    data_type
                    align
                  }
                  directive_long
                }
                group_detail {
                  header_text
                  no_of_student
                  min_no_of_student
                  group_allocation
                }
                correction {
                  show_as_list
                  show_notation_marks
                  show_direction_column
                  directions_column_header
                  show_number_marks_column
                  number_marks_column_header
                  show_letter_marks_column
                  letter_marks_column_header
                  comment_area
                  comments_header
                  comment_for_each_section
                  comment_for_each_section_header
                  comment_for_each_sub_section
                  comment_for_each_sub_section_header
                  show_final_comment
                  final_comment_header
                  display_final_total
                  total_zone {
                    display_additional_total
                    additional_max_score
                    decimal_place
                  }
                  show_penalty
                  penalty_header
                  show_bonus
                  bonus_header
                  show_elimination
                  sections {
                    title
                    maximum_rating
                    page_break
                    sub_sections {
                      title
                      maximum_rating
                      direction
                    }
                  }
                  penalties {
                    title
                    count
                  }
                  bonuses {
                    title
                    count
                  }
                }
                footer {
                  text
                  text_below
                  fields {
                    value
                    type
                    data_type
                    align
                  }
                }
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTest']));
  }

  createTest(payload: TestCreationPayloadData): Observable<TestCreationRespData> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateTest($input: TestInput) {
            CreateTest(test_input: $input) {
              _id
              expected_documents {
                document_name
                deadline_date {
                  type
                }
              }
            }
          }
        `,
        variables: {
          input: payload,
        },
      })
      .pipe(map((resp) => resp.data['CreateTest']));
  }

  updateTest(testId: string, payload: TestCreationPayloadData): Observable<TestCreationRespData> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateTest($id: ID!, $input: TestInput) {
            UpdateTest(_id: $id, test_input: $input) {
              _id
              expected_documents {
                _id
                document_name
                deadline_date {
                  type
                }
              }
            }
          }
        `,
        variables: {
          id: testId,
          input: payload,
        },
      })
      .pipe(map((resp) => resp.data['UpdateTest']));
  }

  deleteTest(testId: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation DeleteTest($_id: ID!) {
            DeleteTest(_id: $_id) {
              _id
            }
          }
        `,
        variables: {
          _id: testId,
        },
      })
      .pipe(map((resp) => resp.data['DeleteTest']));
  }

  getTestProgress(testId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query GetTestProgressTestCreation{
        GetTestProgress(_id:"${testId}"){
          document_expected_count {
            document_expected_id
            count
          }
          document_expected_done_count {
            document_expected_id
            count
          }
          create_group {
            _id
            short_name
          }
          create_group_done {
            _id
            short_name
          }
          assign_corrector {
            _id
          }
          assign_corrector_done {
            _id
          }
          mark_entry {
            _id
          }
          mark_entry_done {
            _id
          }
          validate {
            _id
          }
          validate_done {
            _id
          }
          school_count
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetTestProgress']));
  }

  getTestProgressTestDetail(testId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query GetTestProgressTestDetail{
        GetTestProgress(_id:"${testId}"){
          document_expected_done_count {
            document_expected_id
            count
          }
          create_group_done {
            _id
            short_name
          }
          assign_corrector_done {
            _id
            count_document
          }
          mark_entry_done {
            _id
            count_document
          }
          validate_done {
            _id
            count_document
          }
          create_group_done {
            _id
            count_document
          }
          school_count
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetTestProgress']));
  }

  getAllUserTypesThird(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUserTypes {
              _id
              name
              entity
              role
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

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

  getOneUserTypesName(ID: String): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetOneUserType(_id:"${ID}"){
          _id
          name
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneUserType']));
  }

  getAcaddirId() {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUserTypes(search: "academic director") {
              _id
              name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  getAcadirOftitle(usertTypeId: string[], titleId: string[], class_id: string) {
    return this.apollo
      .query({
        query: gql`
          query checkAcadDir($title: [ID!], $user_type: [ID!], $class_id: ID) {
            GetAllUsers(user_type: $user_type, title: $title, class_id: $class_id) {
              _id
              first_name
              last_name
              entities {
                type {
                  _id
                  name
                }
                entity_name
                school {
                  _id
                }
                assigned_rncp_title {
                  _id
                }
                class {
                  _id
                }
              }
            }
          }
        `,
        variables: {
          user_type: usertTypeId,
          title: titleId,
          class_id: class_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getCertAdminOftitle(usertTypeId: string[], titleId: string[], pagination = { limit: 1, page: 0 }) {
    return this.apollo
      .query({
        query: gql`
          query checkCertAdmin($title: [ID!], $user_type: [ID!], $pagination: PaginationInput) {
            GetAllUsers(user_type: $user_type, title: $title, pagination: $pagination) {
              _id
            }
          }
        `,
        variables: {
          user_type: usertTypeId,
          title: titleId,
          pagination: pagination,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getStudentByClass(ID: String): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query{
        GetAllStudents(current_class:"${ID}"){
          _id
          first_name
          last_name
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getSortFourthStepTask() {
    return [
      {
        value: 'text',
        text: 'Text',
      },
      {
        value: 'sender',
        text: 'Sender',
      },
      {
        value: 'actor',
        text: 'Actor',
      },
      {
        value: 'date',
        text: 'Date',
      },
    ];
  }

  getHeaderFooterFieldTypes(): HeaderFooterFieldType[] {
    return [
      {
        type: 'etablishmentname',
        data_type: 'text',
        view: 'Etablissement Name',
      },
      {
        type: 'studentname',
        data_type: 'text',
        view: 'Student Name',
      },
      {
        type: 'groupname',
        data_type: 'text',
        view: 'Group Name',
      },
      {
        type: 'eventName',
        data_type: 'text',
        view: 'Name of the Event',
      },
      {
        type: 'dateRange',
        data_type: 'date',
        view: 'Date Range',
      },
      {
        type: 'dateFixed',
        data_type: 'date',
        view: 'Date Fixed',
      },
      {
        type: 'titleName',
        data_type: 'text',
        view: 'Title Name',
      },
      {
        type: 'status',
        data_type: 'text',
        view: 'Status',
      },
      {
        type: 'date',
        data_type: 'date',
        view: 'Date',
      },
      {
        type: 'text',
        data_type: 'text',
        view: 'Text',
      },
      {
        type: 'number',
        data_type: 'number',
        view: 'Number',
      },
      {
        type: 'pfereferal',
        data_type: 'text',
        view: 'PFE Referal',
      },
      {
        type: 'jurymember',
        data_type: 'text',
        view: 'Jury Member',
      },
      {
        type: 'longtext',
        data_type: 'text',
        view: 'Long Text',
      },
      {
        type: 'signature',
        data_type: 'checkbox',
        view: 'Signature',
      },
      {
        type: 'correctername',
        data_type: 'text',
        view: 'Corrector Name',
      },
      {
        type: 'mentorname',
        data_type: 'text',
        view: 'Mentor Name',
      },
      {
        type: 'companyname',
        data_type: 'text',
        view: 'Company Name',
      },
    ];
  }

  getAllUserTypePC(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUserTypes(role: "preparation_center", show_student_type: include_student) {
              _id
              name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  getCertifierAdmin(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUserTypes(search: "Certifier Admin") {
              _id
              name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  getAllUserType(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUserTypes(show_student_type: include_student) {
              _id
              name
              entity
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUserTypes']));
  }

  createAcadDoc(doc_input: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateAcadDoc($doc_input: AcadDocumentInput) {
            CreateAcadDoc(doc_input: $doc_input) {
              _id
              document_name
              type_of_document
              s3_file_name
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
          }
        `,
        variables: {
          doc_input: doc_input,
        },
      })
      .pipe(map((resp) => resp.data['CreateAcadDoc']));
  }

  updateAcadDoc(_id: string, doc_input: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateAcadDoc($doc_input: AcadDocumentInput, $_id: ID!) {
            UpdateAcadDoc(_id: $_id, doc_input: $doc_input) {
              _id
              document_name
              type_of_document
              s3_file_name
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
          }
        `,
        variables: {
          _id: _id,
          doc_input: doc_input,
        },
      })
      .pipe(map((resp) => resp.data['UpdateAcadDoc']));
  }

  acadFileUpload(file: File, custom_file_name: string): Observable<{ file_url: string; file_name: string; s3_file_name; stored_in_s3 }> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ($file: Upload!, $custom_file_name: String) {
            SingleUpload(file: $file, custom_file_name: $custom_file_name) {
              file_url
              file_name
              s3_file_name
              stored_in_s3
              mime_type
            }
          }
        `,
        variables: {
          file: file,
          custom_file_name: custom_file_name,
        },
        context: {
          useMultipart: true,
        },
      })
      .pipe(map((resp) => resp.data['SingleUpload']));
  }

  getAutomaticTask(taskId: string): Observable<AutomaticTask> {
    return this.apollo
      .query({
        query: gql`
      query {
        GetAutomaticTasks(test_id: "${taskId}") {
          tasks_list {
            actor {
              _id
              name
            }
            task_type
            reminder {
              _id
              civility
              first_name
              last_name
            }
            date {
              type
              before
              day
              value {
                date
                time
              }
            }
            description
            start_after
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAutomaticTasks']));
  }

  createBatchTask(task_input: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateBatchTask($tasks_input: [BatchTaskInput]) {
            CreateBatchTask(tasks_input: $tasks_input) {
              _id
            }
          }
        `,
        variables: {
          tasks_input: task_input,
        },
      })
      .pipe(map((resp) => resp.data['CreateBatchTask']));
  }

  generateTasks(payload: any): Observable<any> {
    return this.apollo.use('taskService').mutate({
      mutation: gql`
        mutation GenerateTasks($task_input: GenerateTaskInput!) {
          GenerateTasks(task_input: $task_input) {
            school {
              _id
              short_name
            }
            tasks {
              rncp
              class_id
              school {
                _id
                short_name
              }
              test
              task_status
              created_by
              created_date {
                date
                time
              }
              priority
              description
              user_selection {
                selection_type
                user_type_id {
                  _id
                  name
                }
                user_id {
                  _id
                  first_name
                  last_name
                  civility
                }
              }
              due_date {
                date
                time
              }
              type
              is_parent_task
              related_notification_sent
              for_each_student
              for_each_group
              expected_document_id
              child_tasks {
                for_each_student
                for_each_group
                student_id {
                  _id
                }
                expected_document_id
                rncp
                type
                class_id
                school {
                  _id
                  short_name
                }
                test
                task_status
                created_by
                created_date {
                  date
                  time
                }
                priority
                description
                related_notification_sent
                parent_task
                is_parent_task
                due_date {
                  date
                  time
                }
                user_selection {
                  selection_type
                  user_type_id {
                    _id
                    name
                  }
                  user_id {
                    _id
                    first_name
                    last_name
                    civility
                  }
                }
                next_tasks {
                  rncp
                  class_id
                  school {
                    _id
                    short_name
                  }
                  test
                  task_status
                  created_by
                  created_date {
                    date
                    time
                  }
                  priority
                  description
                  user_selection {
                    selection_type
                    user_type_id {
                      _id
                      name
                    }
                    user_id {
                      _id
                      first_name
                      last_name
                      civility
                    }
                  }
                  due_date {
                    date
                    time
                  }
                  type
                  is_parent_task
                  related_notification_sent
                  child_tasks {
                    for_each_student
                    for_each_group
                    student_id {
                      _id
                    }
                    expected_document_id
                    type
                    rncp
                    class_id
                    school {
                      _id
                      short_name
                    }
                    test
                    task_status
                    created_by
                    created_date {
                      date
                      time
                    }
                    priority
                    description
                    related_notification_sent
                    parent_task
                    is_parent_task
                    due_date {
                      date
                      time
                    }
                    user_selection {
                      selection_type
                      user_type_id {
                        _id
                        name
                      }
                      user_id {
                        _id
                        first_name
                        last_name
                        civility
                      }
                    }
                    next_tasks {
                      rncp
                      class_id
                      school {
                        _id
                        short_name
                      }
                      test
                      task_status
                      created_by
                      created_date {
                        date
                        time
                      }
                      priority
                      description
                      user_selection {
                        selection_type
                        user_type_id {
                          _id
                          name
                        }
                        user_id {
                          _id
                          first_name
                          last_name
                          civility
                        }
                      }
                      due_date {
                        date
                        time
                      }
                      type
                      is_parent_task
                      related_notification_sent
                      child_tasks {
                        for_each_student
                        for_each_group
                        student_id {
                          _id
                        }
                        expected_document_id
                        type
                        rncp
                        class_id
                        school {
                          _id
                          short_name
                        }
                        test
                        task_status
                        created_by
                        created_date {
                          date
                          time
                        }
                        priority
                        description
                        related_notification_sent
                        parent_task
                        is_parent_task
                        due_date {
                          date
                          time
                        }
                        user_selection {
                          selection_type
                          user_type_id {
                            _id
                            name
                          }
                          user_id {
                            _id
                            first_name
                            last_name
                            civility
                          }
                        }
                        next_tasks {
                          rncp
                          class_id
                          school {
                            _id
                            short_name
                          }
                          test
                          task_status
                          created_by
                          created_date {
                            date
                            time
                          }
                          priority
                          description
                          user_selection {
                            selection_type
                            user_type_id {
                              _id
                              name
                            }
                            user_id {
                              _id
                              first_name
                              last_name
                              civility
                            }
                          }
                          due_date {
                            date
                            time
                          }
                          type
                          is_parent_task
                          related_notification_sent
                          child_tasks {
                            for_each_student
                            for_each_group
                            student_id {
                              _id
                            }
                            expected_document_id
                            type
                            rncp
                            class_id
                            school {
                              _id
                              short_name
                            }
                            test
                            task_status
                            created_by
                            created_date {
                              date
                              time
                            }
                            priority
                            description
                            related_notification_sent
                            parent_task
                            is_parent_task
                            due_date {
                              date
                              time
                            }
                            user_selection {
                              selection_type
                              user_type_id {
                                _id
                                name
                              }
                              user_id {
                                _id
                                first_name
                                last_name
                                civility
                              }
                            }
                            next_tasks {
                              rncp
                              class_id
                              school {
                                _id
                                short_name
                              }
                              test
                              task_status
                              created_by
                              created_date {
                                date
                                time
                              }
                              priority
                              description
                              user_selection {
                                selection_type
                                user_type_id {
                                  _id
                                  name
                                }
                                user_id {
                                  _id
                                  first_name
                                  last_name
                                  civility
                                }
                              }
                              due_date {
                                date
                                time
                              }
                              type
                              is_parent_task
                              related_notification_sent
                              child_tasks {
                                for_each_student
                                for_each_group
                                student_id {
                                  _id
                                }
                                expected_document_id
                                type
                                rncp
                                class_id
                                school {
                                  _id
                                  short_name
                                }
                                test
                                task_status
                                created_by
                                created_date {
                                  date
                                  time
                                }
                                priority
                                description
                                related_notification_sent
                                parent_task
                                is_parent_task
                                due_date {
                                  date
                                  time
                                }
                                user_selection {
                                  selection_type
                                  user_type_id {
                                    _id
                                    name
                                  }
                                  user_id {
                                    _id
                                    first_name
                                    last_name
                                    civility
                                  }
                                }
                                next_tasks {
                                  rncp
                                  class_id
                                  school {
                                    _id
                                    short_name
                                  }
                                  test
                                  task_status
                                  created_by
                                  created_date {
                                    date
                                    time
                                  }
                                  priority
                                  description
                                  user_selection {
                                    selection_type
                                    user_type_id {
                                      _id
                                      name
                                    }
                                    user_id {
                                      _id
                                      first_name
                                      last_name
                                      civility
                                    }
                                  }
                                  due_date {
                                    date
                                    time
                                  }
                                  type
                                  is_parent_task
                                  related_notification_sent
                                  child_tasks {
                                    for_each_student
                                    for_each_group
                                    student_id {
                                      _id
                                    }
                                    expected_document_id
                                    type
                                    rncp
                                    class_id
                                    school {
                                      _id
                                      short_name
                                    }
                                    test
                                    task_status
                                    created_by
                                    created_date {
                                      date
                                      time
                                    }
                                    priority
                                    description
                                    related_notification_sent
                                    parent_task
                                    is_parent_task
                                    due_date {
                                      date
                                      time
                                    }
                                    user_selection {
                                      selection_type
                                      user_type_id {
                                        _id
                                        name
                                      }
                                      user_id {
                                        _id
                                        first_name
                                        last_name
                                        civility
                                      }
                                    }
                                    next_tasks {
                                      rncp
                                      class_id
                                      school {
                                        _id
                                        short_name
                                      }
                                      test
                                      task_status
                                      created_by
                                      created_date {
                                        date
                                        time
                                      }
                                      priority
                                      description
                                      user_selection {
                                        selection_type
                                        user_type_id {
                                          _id
                                          name
                                        }
                                        user_id {
                                          _id
                                          first_name
                                          last_name
                                          civility
                                        }
                                      }
                                      due_date {
                                        date
                                        time
                                      }
                                      type
                                      is_parent_task
                                      related_notification_sent
                                      child_tasks {
                                        for_each_student
                                        for_each_group
                                        student_id {
                                          _id
                                        }
                                        expected_document_id
                                        type
                                        rncp
                                        class_id
                                        school {
                                          _id
                                          short_name
                                        }
                                        test
                                        task_status
                                        created_by
                                        created_date {
                                          date
                                          time
                                        }
                                        priority
                                        description
                                        related_notification_sent
                                        parent_task
                                        is_parent_task
                                        due_date {
                                          date
                                          time
                                        }
                                        user_selection {
                                          selection_type
                                          user_type_id {
                                            _id
                                            name
                                          }
                                          user_id {
                                            _id
                                            first_name
                                            last_name
                                            civility
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      `,
      variables: {
        task_input: payload,
      },
      context: {
        headers: {
          Authorization: localStorage.getItem(environment.tokenKey) ? `Bearer ${localStorage.getItem(environment.tokenKey)}` : '',
        },
      },
      errorPolicy: 'all',
    });
    // .pipe(map((resp) => resp.data['GenerateTasks']));
  }

  getJSONTasksList() {
    return this.httpClient.get<any[]>('assets/data/responseTasks.json');
  }
}
