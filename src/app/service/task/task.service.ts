import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cacheable } from 'ngx-cacheable';
import { map } from 'rxjs/operators';
import gql from 'graphql-tag';
import { Apollo } from 'apollo-angular';

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  constructor(private httpClient: HttpClient, private apollo: Apollo) { }

  private _childrenFormValidationStatus: boolean = true;

  @Cacheable()
  getTask(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/task.json');
  }

  public get childrenFormValidationStatus() {
    return this._childrenFormValidationStatus;
  }

  public set childrenFormValidationStatus(state: boolean) {
    this._childrenFormValidationStatus = state;
  }

  // getMyTask(): Observable<any> {

  // }

  getUserTypesCorrectorsID() {
    return [
      {
        _id: '5a2e1ecd53b95d22c82f9559',
        name: 'Corrector',
      },
      {
        _id: '5b210d24090336708818ded1',
        name: 'Corrector Certifier',
      },
      {
        _id: '5a2e1ecd53b95d22c82f954e',
        name: 'ADMTC Admin',
      },
    ];
  }

  getMarkEntryProgress(testId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
            query {
              GetTestProgress(_id: "${testId}") {
                mark_entry_done {
                  _id
                }
              }
            }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetTestProgress']));
  }

  getTestProgress(testId: string, schoolId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
            query {
              GetTestProgress(_id: "${testId}", school_id: "${schoolId}") {
                mark_entry_done {
                  _id
                }
                validate_done {
                  _id
                }
              }
            }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetTestProgress']));
  }

  checkMarkEntryStarted(testId: string, schoolId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
            query {
              GetAllTestCorrections(test_id: "${testId}", school_id: "${schoolId}") {
                _id
              }
            }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTestCorrections']));
  }

  getTestDetail(testId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetOneTest(_id: "${testId}") {
              _id
              correction_type
              group_test
              block_type
              is_retake_test
              parent_rncp_title {
                long_name
              }
              class_id {
                name
                type_evaluation
              }
              evaluation_id {
                _id
                evaluation
              }
              subject_id {
                subject_name
              }
              date {
                date_utc
                time_utc
              }
              corrector_assigned {
                corrector_id {
                  _id
                  first_name
                  last_name
                  civility
                }
                school_id {
                  _id
                }
                no_of_student
              }
              block_of_competence_condition_id {
                _id
                specialization {
                  _id
                }
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTest']));
  }

  getStudentCount(
    titleId: string,
    schoolId: string,
    classId: string,
    specializationId: string,
    blockCompId: string,
    include_deactivated_student: boolean,
    student_deactivated_tests_keep: string[],
    pagination = { limit: 1, page: 0 },
    status = 'active_pending',
  ) {
    return this.apollo
      .query({
        query: gql`
          query GetAllStudentsForAssignCorrector(
            $titleId: ID
            $classId: ID
            $schoolId: ID
            $pagination: PaginationInput
            $status: EnumFilterStatus
            $include_deactivated_student: Boolean
            $student_deactivated_tests_keep: [ID]
          ) {
            GetAllStudents(
              rncp_title: $titleId,
              current_class: $classId,
              school: $schoolId,
              ${specializationId ? `specialization_id: "${specializationId}"` : ''}
              ${blockCompId ? `block_of_competence_condition_id: "${blockCompId}"` : ``}
              pagination: $pagination,
              status: $status,
              include_deactivated_student: $include_deactivated_student
              student_deactivated_tests_keep: $student_deactivated_tests_keep
            ) {
              count_document
            }
          }
        `,
        variables: {
          titleId,
          classId,
          schoolId,
          pagination,
          status,
          include_deactivated_student,
          student_deactivated_tests_keep,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getRetakeStudentCount(
    titleId: string,
    schoolId: string,
    classId: string,
    specializationId: string,
    blockCompId: string,
    testId: string,
    evaluationId: string,
    include_deactivated_student,
    pagination = { limit: 1, page: 0 },
    status = 'retaking',
  ) {
    return this.apollo
      .query({
        query: gql`
          query GetAllRetakeStudentsForAssignCorrector(
            $titleId: ID
            $classId: ID
            $schoolId: ID
            $testId: ID
            $evaluationId: ID
            $pagination: PaginationInput
            $status: EnumFilterStatus
            $include_deactivated_student: Boolean
          ) {
            GetAllStudents(
              rncp_title: $titleId,
              current_class: $classId,
              school: $schoolId,
              for_final_retake_test: true,
              test_for_final_retake: $testId,
              evaluation_for_final_retake: $evaluationId,
              ${specializationId ? `specialization_id: "${specializationId}"` : ''}
              ${blockCompId ? `block_of_competence_condition_id: "${blockCompId}"` : ``}
              pagination: $pagination,
              status: $status,
              include_deactivated_student: $include_deactivated_student,
              student_deactivated_tests_keep: "[${testId}]"
            ) {
              count_document
            }
          }
        `,
        variables: {
          titleId,
          classId,
          schoolId,
          testId,
          evaluationId,
          pagination,
          status,
          include_deactivated_student,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getTestGroups(testId: string, schoolId: string) {
    return this.apollo
      .query({
        query: gql`
      query getAllGroupsOfAssignCorrector{
        GetAllTestGroups(test_id: "${testId}", school_id: "${schoolId}") {
          _id
          test {
            _id
          }
          name
          students {
            student_id {
              _id
            }
          }
          school {
            _id
          }
          rncp {
            _id
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTestGroups']));
  }

  getCorrectorUsers(title, school, user_type, class_id) {
    return this.apollo
      .query({
        query: gql`
          query GetAllUsers($title: [ID!], $school: [ID!], $user_type: [ID!], $class_id: ID) {
            GetAllUsers(title: $title, school: $school, user_type: $user_type, class_id: $class_id) {
              _id
              civility
              first_name
              last_name
            }
          }
        `,
        variables: {
          title,
          school,
          user_type,
          class_id,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  getCorrectorCertifierUsers(title, user_type) {
    return this.apollo
      .query({
        query: gql`
          query GetAllUsersCertifierCorrector($title: [ID!], $user_type: [ID!], $sorting: UserSorting) {
            GetAllUsers(title: $title, user_type: $user_type, sorting: $sorting) {
              _id
              civility
              first_name
              last_name
            }
          }
        `,
        variables: {
          title,
          user_type,
          sorting: {
            full_name: 'asc'
          }
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllUsers']));
  }

  countStudentOrGroupTestPerCorrector(test_id, school_id, correctors_id, update_corrector) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CountStudentOrGroupTestPerCorrector($test_id: ID, $school_id: ID, $correctors_id: [ID], $update_corrector: Boolean) {
            CountStudentOrGroupTestPerCorrector(
              test_id: $test_id
              school_id: $school_id
              corrector_id: $correctors_id
              update_corrector: $update_corrector
            ) {
              corrector_id {
                _id
                first_name
                last_name
                entities {
                  _id
                  entity_name
                }
              }
              test_groups {
                _id
              }
              students {
                _id
                first_name
                last_name
              }
              school_id {
                _id
              }
            }
          }
        `,
        variables: {
          test_id,
          school_id,
          correctors_id,
          update_corrector,
        },
      })
      .pipe(map((resp) => resp.data['CountStudentOrGroupTestPerCorrector']));
  }

  assignCorrector(test_id, school_id, correctors_id, update_corrector, corrector_assigned) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SaveAssignedCorrector($test_id: ID!, $school_id: ID!, $correctors_id: [ID!], $update_corrector: Boolean, $corrector_assigned: [StudentsOrGroupTestPerCorrectorInput]) {
            SaveAssignedCorrector(
              test_id: $test_id
              school_id: $school_id
              correctors_id: $correctors_id
              update_corrector: $update_corrector,
              correctorAssigned: $corrector_assigned
            ) {
              _id
            }
          }
        `,
        variables: {
          test_id,
          school_id,
          correctors_id,
          update_corrector,
          corrector_assigned
        },
      })
      .pipe(map((resp) => resp.data['SaveAssignedCorrector']));
  }

  assignJuryCorrector(jury_id, jury_correctors) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation AssignJuryCorrectors($jury_id: ID!, $jury_correctors: [ID]) {
            AssignJuryCorrectors(jury_id: $jury_id, jury_correctors: $jury_correctors) {
              _id
            }
          }
        `,
        variables: {
          jury_id,
          jury_correctors,
        },
      })
      .pipe(map((resp) => resp.data['AssignJuryCorrectors']));
  }

  studentJustification(task_id, reason) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation StudentJustification($task_id: ID, $reason: String) {
            StudentJustification(task_id: $task_id, reason: $reason) {
              _id
            }
          }
        `,
        variables: {
          task_id,
          reason,
        },
      })
      .pipe(map((resp) => resp.data['StudentJustification']));
  }

  juryJustification(task_id, reason) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation JuryJustification($task_id: ID, $reason: String) {
            JuryJustification(task_id: $task_id, reason: $reason) {
              _id
            }
          }
        `,
        variables: {
          task_id,
          reason,
        },
      })
      .pipe(map((resp) => resp.data['JuryJustification']));
  }

  assignCorrectorForRetake(test_id, school_id, correctors_id, update_corrector, taskId) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SaveAssignedCorrectorForFinalRetake(
            $test_id: ID!
            $school_id: ID!
            $correctors_id: [ID!]
            $update_corrector: Boolean
            $taskId: ID
          ) {
            SaveAssignedCorrectorForFinalRetake(
              test_id: $test_id
              school_id: $school_id
              correctors_id: $correctors_id
              update_corrector: $update_corrector
              task_id: $taskId
            ) {
              _id
            }
          }
        `,
        variables: {
          test_id,
          school_id,
          correctors_id,
          update_corrector,
          taskId,
        },
      })
      .pipe(map((resp) => resp.data['SaveAssignedCorrectorForFinalRetake']));
  }

  startNextTask(done_task_id, next_assigned_users, update_assigned_user, lang) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation DoneAndStartNextTask($done_task_id: ID!, $next_assigned_users: [ID!], $update_assigned_user: Boolean, $lang: String) {
            DoneAndStartNextTask(
              done_task_id: $done_task_id
              next_assigned_users: $next_assigned_users
              update_assigned_user: $update_assigned_user
              lang: $lang
            ) {
              _id
            }
          }
        `,
        variables: {
          done_task_id,
          next_assigned_users,
          update_assigned_user,
          lang,
        },
      })
      .pipe(map((resp) => resp.data['DoneAndStartNextTask']));
  }

  startNextTaskForGroup(done_task_id, next_assigned_groups, update_assigned_group, lang) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation DoneAndStartNextTask($done_task_id: ID!, $next_assigned_groups: [ID!], $update_assigned_group: Boolean, $lang: String) {
            DoneAndStartNextTask(
              done_task_id: $done_task_id
              next_assigned_groups: $next_assigned_groups
              update_assigned_group: $update_assigned_group
              lang: $lang
            ) {
              _id
            }
          }
        `,
        variables: {
          done_task_id,
          next_assigned_groups,
          update_assigned_group,
          lang,
        },
      })
      .pipe(map((resp) => resp.data['DoneAndStartNextTask']));
  }

  getMyTask(pagination, sorting, filter) {
    return this.apollo
      .query({
        query: gql`
          query GetAllTasks($pagination: PaginationInput, $sorting: TaskSortingInput, $filter: TaskFilterInput) {
            GetAllTasks(pagination: $pagination, sorting: $sorting, filter: $filter) {
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
              school {
                _id
                short_name
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
                entities{
                  _id
                  type{
                    name
                  }
                }
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
                employability_survey_process_id{
                   is_es_new_flow_form_builder
                   name
                }
                form_process_id{
                  _id
                }
              }
              jury_member_id
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
              form_process_step_id{
                step_title
                step_type
              }
              validation_status
              task_builder_id {
                is_rejection_active
              }
              form_process_id{
                form_builder_id{
                  template_type
                }
              }
            }
          }
        `,
        variables: {
          sorting,
          pagination,
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

  getOneTask(taskId) {
    return this.apollo
      .query({
        query: gql`
          query GetOneTask($_id: ID!) {
            GetOneTask(_id: $_id) {
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
                employability_survey_process_id{
                  name
                }
              }
              jury_id {
                _id
                name
                type
                jury_activity
              }
            }
          }
        `,
        variables: {
          _id: taskId,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetOneTask'];
        }),
      );
  }

  getOneTaskOffPlatform(taskId) {
    return this.apollo
      .query({
        query: gql`
          query GetOneTask($_id: ID!) {
            GetOneTask(_id: $_id) {
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
                long_name
              }
              school {
                _id
                short_name
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
              }
            }
          }
        `,
        variables: {
          _id: taskId,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetOneTask'];
        }),
      );
  }

  GetADMTCTitleDropdownList() {
    return this.apollo
      .query({
        query: gql`
          query {
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

  updateManualTask(taskId, payload) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateTask($_id: ID!, $task_input: AcadTaskInput) {
            UpdateTask(_id: $_id, task_input: $task_input) {
              _id
            }
          }
        `,
        variables: {
          _id: taskId,
          task_input: payload,
        },
      })
      .pipe(map((resp) => resp.data['UpdateTask']));
  }

  doneManualTask(taskId: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation DoneAndStartNextTaskManualTask($done_task_id: ID!) {
            DoneAndStartNextTask(done_task_id: $done_task_id) {
              _id
            }
          }
        `,
        variables: {
          done_task_id: taskId,
        },
      })
      .pipe(map((resp) => resp.data['DoneAndStartNextTask']));
  }

  deleteManualTask(taskId: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation DeleteManualTask($_id: ID!) {
            DeleteTask(_id: $_id) {
              _id
            }
          }
        `,
        variables: {
          _id: taskId,
        },
      })
      .pipe(map((resp) => resp.data['DeleteTask']));
  }

  getTaskForJury(_id) {
    return this.apollo
      .query({
        query: gql`
          query {
            GetOneTask(_id: "${_id}") {
              jury_member_id
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetOneTask'];
        }),
      );
  }

  getJuryFromTask(_id) {
    return this.apollo
      .query({
        query: gql`
          query {
            GetOneJuryMember(_id: "${_id}") {
              students {
                student_id {
                  _id
                }
                date_test
                test_hours_start
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetOneJuryMember'];
        }),
      );
  }

  getJuryMarkEntryOffPlatform(user_type_login_id, jury_id, mark_entry_not_done = true): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllScheduleJuries($user_type_login_id: ID!, $jury_id: ID, $mark_entry_not_done: Boolean) {
            GetAllScheduleJurys(user_type_login_id: $user_type_login_id, jury_id: $jury_id, mark_entry_not_done: $mark_entry_not_done) {
              _id
              mark_entry_task_status
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          user_type_login_id,
          jury_id,
          mark_entry_not_done,
        },
      })
      .pipe(map((resp) => resp.data['GetAllScheduleJurys']));
  }

  getOneTaskBuilder(taskId) {
    const query = gql`
      query GetOneTaskBuilder($taskId: ID!) {
        GetOneTaskBuilder(_id: $taskId) {
          ref_id
          task_title
          task_scope
          description
          is_other_task_active
          is_already_generated
          is_rejection_active
          is_published
          due_date {
            date
            time
          }
          assigner_id {
            _id
            name
          }
          assign_to_id {
            _id
            name
          }
          attachments {
            file_name
            s3_file_name
          }
          expected_documents {
            expected_document_name
            is_required
          }
          previous_task_builder_id {
            _id
            ref_id
            task_title
            is_published
          }
          next_task_builder_id {
            _id
            ref_id
            task_title
            is_published
          }
          label_submit
          label_cancel
          label_reject
          label_validate
        }
      }
    `;
    const variables = { taskId };
    return this.apollo.query({ query, variables, fetchPolicy: 'network-only' }).pipe(map((response) => response.data['GetOneTaskBuilder']));
  }

  getOneRandomTaskBuilder(taskBuilderId) {
    const query = gql`
      query GetTaskBuilderPreview($taskBuilderId: ID) {
        GetTaskBuilderPreview(task_builder_id: $taskBuilderId) {
          ref_id
          task_title
          description
          due_date {
            date
            time
          }
          assigner_id {
            name
          }
          assign_to_id {
            name
          }
          attachments {
            file_name
            s3_file_name
          }
          expected_documents {
            expected_document_name
            is_required
          }
          label_submit
          label_cancel
          label_reject
          label_validate
        }
      }
    `;
    const variables = { taskBuilderId };
    return this.apollo.query({ query, variables, fetchPolicy: 'network-only' }).pipe(map((resp) => resp.data['GetTaskBuilderPreview']));
  }

  createTaskBuilder(payload) {
    const mutation = gql`
      mutation CreateTaskBuilder($payload: TaskBuilderInput) {
        CreateTaskBuilder(task_builder_input: $payload) {
          _id
          ref_id
        }
      }
    `;
    const variables = { payload };
    return this.apollo.mutate({ mutation, variables }).pipe(map((response) => response.data['CreateTaskBuilder']));
  }

  updateOneTaskBuilder(taskId, payload) {
    const mutation = gql`
      mutation UpdateTaskBuilder($taskId: ID!, $payload: TaskBuilderInput) {
        UpdateTaskBuilder(_id: $taskId, task_builder_input: $payload) {
          _id
        }
      }
    `;
    const variables = { taskId, payload };
    return this.apollo.mutate({ mutation, variables }).pipe(map((response) => response.data['UpdateTaskBuilder']));
  }

  getTaskMessageAndNotificationKey(lang, sortValue) {
    return this.apollo
      .query({
        query: gql`
          query GetTaskMessageAndNotificationKey($lang: String, $sort: SortingTaskMessageAndNotifKey) {
            GetTaskMessageAndNotificationKey(lang: $lang, sorting: $sort) {
              key
              description
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          lang,
          sort: sortValue ? sortValue : {},
        },
      })
      .pipe(map((resp) => resp.data['GetTaskMessageAndNotificationKey']));
  }

  SendPreviewNotification(task_builder_id: string, lang) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SendTaskNotificationPreview($_id: ID, $lang: String) {
            SendTaskNotificationPreview(task_builder_id: $_id, lang: $lang) {
              _id
              ref_id
            }
          }
        `,
        variables: {
          _id: task_builder_id,
          lang,
        },
      })
      .pipe(map((resp) => resp.data['SendTaskNotificationPreview']));
  }

  getTaskMessage(task_builder_id, is_preview, trigger_condition) {
    return this.apollo
      .query({
        query: gql`
          query GetTaskMessage(
            $task_builder_id: ID
            $is_preview: Boolean
            $trigger_condition: EnumTaskBuilderNotificationAndMessageTriggerCondition
          ) {
            GetTaskMessage(task_builder_id: $task_builder_id, is_preview: $is_preview, trigger_condition: $trigger_condition) {
              _id
              status
              ref_id
              subject
              body
              trigger_condition
              image
              label_back
              label_continue
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          task_builder_id,
          is_preview,
          trigger_condition,
        },
      })
      .pipe(map((resp) => resp.data['GetTaskMessage']));
  }

  getTaskMessageWithTaskId(task_builder_id, is_preview, trigger_condition, task_id) {
    return this.apollo
      .query({
        query: gql`
          query GetTaskMessage(
            $task_builder_id: ID
            $is_preview: Boolean
            $trigger_condition: EnumTaskBuilderNotificationAndMessageTriggerCondition
            $task_id: ID
          ) {
            GetTaskMessage(
              task_builder_id: $task_builder_id
              is_preview: $is_preview
              trigger_condition: $trigger_condition
              task_id: $task_id
            ) {
              _id
              status
              ref_id
              subject
              body
              trigger_condition
              image
              label_back
              label_continue
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          task_builder_id,
          is_preview,
          trigger_condition,
          task_id,
        },
      })
      .pipe(map((resp) => resp.data['GetTaskMessage']));
  }

  duplicateTaskBuilder(payload: {
    originalRNCPTitleId: string;
    original_class_id: string;
    destination_rncp_title_id: string;
    destination_class_id: string;
  }) {
    const mutation = gql`
      mutation DuplicateTaskBuilder(
        $original_rncp_title_id: ID
        $original_class_id: ID
        $destination_rncp_title_id: ID
        $destination_class_id: ID
      ) {
        DuplicateTaskBuilder(
          original_rncp_title_id: $original_rncp_title_id
          original_class_id: $original_class_id
          destination_rncp_title_id: $destination_rncp_title_id
          destination_class_id: $destination_class_id
        ) {
          _id
        }
      }
    `;
    const variables = payload;
    return this.apollo.mutate({ mutation, variables }).pipe(map((res) => res.data['DuplicateTaskBuilder']));
  }

  deleteTaskBuilderNotificationAndMessage(_id: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation DeleteTaskBuilderNotificationAndMessage($_id: ID) {
            DeleteTaskBuilderNotificationAndMessage(_id: $_id) {
              _id
            }
          }
        `,
        variables: {
          _id,
        },
      })
      .pipe(map((resp) => resp.data['DeleteTaskBuilderNotificationAndMessage']));
  }

  generateAllTaskBuilders(rncp_title_id: string, class_id: string, task_builder_id) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation GenerateTaskBuilders($rncp_title_id: ID, $class_id: ID, $task_builder_id: [ID]) {
            GenerateTaskBuilders(rncp_title_id: $rncp_title_id, class_id: $class_id, task_builder_id: $task_builder_id)
          }
        `,
        variables: {
          rncp_title_id,
          class_id,
          task_builder_id,
        },
      })
      .pipe(map((resp) => resp.data['GenerateTaskBuilders']));
  }

  generateTaskBuilders(rncp_title_id: string, class_id: string, task_builder_id) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation GenerateTaskBuilders($rncp_title_id: ID, $class_id: ID, $task_builder_id: [ID]) {
            GenerateTaskBuilders(rncp_title_id: $rncp_title_id, class_id: $class_id, task_builder_id: $task_builder_id)
          }
        `,
        variables: {
          rncp_title_id,
          class_id,
          task_builder_id,
        },
      })
      .pipe(map((resp) => resp.data['GenerateTaskBuilders']));
  }

  unpublishTaskBuilder(taskBuilderId: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UnPublishTaskBuilder($_id: ID!) {
            UnPublishTaskBuilder(_id: $_id) {
              _id
            }
          }
        `,
        variables: {
          _id: taskBuilderId,
        },
      })
      .pipe(map((resp) => resp.data['UnPublishTaskBuilder']));
  }

  publishGeneratedTaskBuilder(rncp_title_id: string, class_id: string, task_ids?: string[]) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation PublishGeneratedTaskBuilder($rncp_title_id: ID!, $class_id: ID!, $task_id: [ID], $lang: String!) {
            PublishGeneratedTaskBuilder(rncp_title_id: $rncp_title_id, class_id: $class_id, task_id: $task_id, lang: $lang) {
              _id
            }
          }
        `,
        variables: {
          rncp_title_id,
          class_id,
          task_id: task_ids ? task_ids : null,
          lang: localStorage.getItem('currentLang'),
        },
      })
      .pipe(map((resp) => resp.data['PublishGeneratedTaskBuilder']));
  }

  getGeneratedTaskBuilderIdPreview(rncp_title_id: string, class_id: string, filter?: any, sorting?: any) {
    return this.apollo
      .query({
        query: gql`
          query GetGeneratedTaskBuilderIDPreview(
            $rncp_title_id: ID
            $class_id: ID
            $filter: GeneratedTaskBuilderPreviewFilter
            $sorting: GeneratedTaskBuilderPreviewSorting
          ) {
            GetGeneratedTaskBuilderPreview(rncp_title_id: $rncp_title_id, class_id: $class_id, filter: $filter, sorting: $sorting) {
              _id
            }
          }
        `,
        variables: {
          rncp_title_id,
          class_id,
          filter,
          sorting,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetGeneratedTaskBuilderPreview']));
  }

  getGeneratedTaskBuilderPreview(
    rncp_title_id: string,
    class_id: string,
    pagination?: { limit: number; page: number },
    filter?: any,
    sorting?: any,
  ) {
    return this.apollo
      .query({
        query: gql`
          query GetGeneratedTaskBuilderPreview(
            $rncp_title_id: ID
            $class_id: ID
            $filter: GeneratedTaskBuilderPreviewFilter
            $sorting: GeneratedTaskBuilderPreviewSorting
            $pagination: PaginationInput
          ) {
            GetGeneratedTaskBuilderPreview(
              rncp_title_id: $rncp_title_id
              class_id: $class_id
              filter: $filter
              sorting: $sorting
              pagination: $pagination
            ) {
              _id
              school {
                _id
                short_name
              }
              task_builder_id {
                ref_id
              }
              due_date {
                date
                time
              }
              description
              created_by {
                _id
                first_name
                last_name
                civility
              }
              user_selection {
                user_id {
                  _id
                  first_name
                  last_name
                  civility
                }
              }
              is_task_published
              is_rejection_active
              previous_tasks {
                _id
                task_status
                task_builder_id {
                  ref_id
                }
              }
              task_status
              status
              validation_status
              task_builder_id {
                _id
                ref_id
              }
              count_document
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          rncp_title_id,
          class_id,
          filter,
          sorting,
          pagination,
        },
      })
      .pipe(map((resp) => resp.data['GetGeneratedTaskBuilderPreview']));
  }

  getOneTaskAutoTaskBuilder(taskId) {
    return this.apollo
      .query({
        query: gql`
          query GetOneTask($_id: ID!) {
            GetOneTask(_id: $_id) {
              _id
              task_builder_id {
                _id
                ref_id
                task_title
                description
                due_date {
                  date
                  time
                }
                assigner_id {
                  name
                }
                assign_to_id {
                  name
                }
                attachments {
                  file_name
                  s3_file_name
                }
                expected_documents {
                  expected_document_name
                  is_required
                }
                label_submit
                label_cancel
                label_reject
                label_validate
                is_rejection_active
                is_other_task_active
              }
              auto_generated_task_description
              validation_status
              scope
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
                is_required
                s3_file_name
              }
            }
          }
        `,
        variables: {
          _id: taskId,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(
        map((resp) => {
          return resp.data['GetOneTask'];
        }),
      );
  }

  doneTaskBuilder(taskBuilderId, payload) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation DoneTaskBuilder($_id: ID!, $action_taken: String, $document_expecteds: [DocumentExpectedSchemaInput]) {
            DoneTaskBuilder(_id: $_id, action_taken: $action_taken, document_expecteds: $document_expecteds) {
              _id
            }
          }
        `,
        variables: {
          _id: taskBuilderId,
          action_taken: payload.action_taken,
          document_expecteds: payload.document_expecteds,
        },
      })
      .pipe(map((resp) => resp.data['DoneTaskBuilder']));
  }

  rejectTaskBuilder(taskBuilderId, payload) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation RejectTaskBuilder($_id: ID!) {
            RejectTaskBuilder(_id: $_id) {
              _id
            }
          }
        `,
        variables: {
          _id: taskBuilderId,
          payload,
        },
      })
      .pipe(map((resp) => resp.data['RejectTaskBuilder']));
  }

  unpublishGeneratedTaskBuilder(task_id: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UnPublishGeneratedTaskBuilder($task_id: ID!) {
            UnPublishGeneratedTaskBuilder(task_id: $task_id) {
              _id
            }
          }
        `,
        variables: {
          task_id,
        },
      })
      .pipe(map((resp) => resp.data['UnPublishGeneratedTaskBuilder']));
  }

  updateMultipleTaskBuilderDueDate({ _ids, due_date }) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateMultipleTaskBuilderDueDate($_ids: [ID!]!, $due_date: TaskBuilderDueDateInput) {
            UpdateMultipleTaskBuilderDueDate(_ids: $_ids, due_date: $due_date) {
              _id
            }
          }
        `,
        variables: {
          _ids,
          due_date,
        },
      })
      .pipe(map((resp) => resp.data['UpdateMultipleTaskBuilderDueDate']));
  }
}
