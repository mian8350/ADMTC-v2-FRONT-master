import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as _ from 'lodash';
import { BehaviorSubject } from 'rxjs';
import { TestGroupInput, StudentData, GroupDropdown, SelectedGroup } from 'app/group-creation/group-creation.model';

@Injectable({
  providedIn: 'root',
})
export class GroupCreationService {
  private groupCreationSource = new BehaviorSubject<TestGroupInput[]>(null);
  public groupCreationData$ = this.groupCreationSource.asObservable();

  private groupCreationFirst = new BehaviorSubject<TestGroupInput[]>(null);
  public groupCreationFirst$ = this.groupCreationFirst.asObservable();

  private studentListSource = new BehaviorSubject<StudentData[]>(null);
  public studentListData = this.studentListSource.asObservable();

  private groupListSource = new BehaviorSubject<GroupDropdown[]>(null);
  public groupListData = this.groupListSource.asObservable();

  constructor(private apollo: Apollo) {}

  setGroupCreationData(data: TestGroupInput[]) {
    if (!_.isEqual(data, this.groupCreationSource.value)) {
      this.groupCreationSource.next(data);
    }
  }

  setStudentListData(data) {
    if (!_.isEqual(data, this.studentListSource.value)) {
      this.studentListSource.next(data);
    }
  }

  setGroupFirstData(data) {
    if (!_.isEqual(data, this.groupCreationFirst.value)) {
      this.groupCreationFirst.next(data);
    }
  }

  setGroupListData(data) {
    if (!_.isEqual(data, this.groupListSource.value)) {
      this.groupListSource.next(data);
    }
  }

  resetGroupCreationData() {
    this.groupCreationSource.next(null);
  }

  resetStudentListData() {
    this.studentListSource.next(null);
  }

  resetGroupListData() {
    this.groupListSource.next(null);
  }

  resetGroupFirstData() {
    this.groupCreationFirst.next(null);
  }

  getGroupCreationDataNoSub() {
    return this.groupCreationSource.value;
  }

  getGroupCreationFirstDataNoSub() {
    return this.groupCreationFirst.value;
  }

  getStudentListDataNoSub() {
    return this.studentListSource.value;
  }

  getGroupListDataNoSub() {
    return this.groupListSource.value;
  }

  getTitle(titleId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query getTitleDataOfGroupCreation {
        GetOneTitle(_id: "${titleId}") {
          _id
          short_name
          long_name
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTitle']));
  }

  getTest(testId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query getTestDataOfGroupCreation {
        GetOneTest(_id: "${testId}") {
          _id
          name
          date_type
          block_type
          date {
            date_utc
            time_utc
          }
          correction_grid {
            group_detail {
              no_of_student
              min_no_of_student
            }
          }
          corrector_assigned {
            corrector_id {
              _id
              first_name
              last_name
            }
            students {
              _id
              first_name
              last_name
            }
          }
          class_id {
            type_evaluation
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

  getTask(taskId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query getTaskDataOfGroupCreation{
        GetOneTask(_id: "${taskId}") {
          _id
          description
          task_status
          user_selection {
            user_id {
              _id
              first_name
              last_name
            }
          }
          school {
            _id
          }
          class_id {
            _id
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTask']));
  }

  getTestProgress(testId: string, schoolId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query getTestProgressOfGroupCreation{
        GetTestProgress(_id: "${testId}", school_id: "${schoolId}") {
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
          }
          mark_entry_done {
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

  CheckIfTestCorrectionMarkExistsForStudentGroupTest(testId: string, schoolId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query CheckIfTestCorrectionMarkExistsForStudentGroupTestOfGroupCreation{
        CheckIfTestCorrectionMarkExistsForStudentGroupTest(test_id: "${testId}", school_id: "${schoolId}")
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['CheckIfTestCorrectionMarkExistsForStudentGroupTest']));
  }

  getAllStudentForGroupCreation(
    schoolId: string,
    titleID: string,
    classId: string,
    include_deactivated_student: boolean,
    testIds: string[],
    specializationId?: string,
    blockCompId?: string,
  ): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query getStudentListOfGroupCreation{
        GetAllStudents(
          school: "${schoolId}",
          rncp_title: "${titleID}",
          status: active_completed,
          current_class: "${classId}",
          include_deactivated_student: ${include_deactivated_student},
          student_deactivated_tests_keep: "${testIds}",
          ${specializationId ? `specialization_id: "${specializationId}"` : ``}
          ${blockCompId ? `block_of_competence_condition_id: "${blockCompId}"` : ``},
        ) {
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

  getTestGroups(testId: string, schoolId: string) {
    return this.apollo
      .query({
        query: gql`
      query getAllGroupsOfGroupCreation{
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
          is_published
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTestGroups']));
  }

  createTestGroups(payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateGroupsForTest($test_group_inputs: [TestGroupInput]) {
            CreateTestGroups(test_group_inputs: $test_group_inputs) {
              _id
            }
          }
        `,
        variables: {
          test_group_inputs: payload,
        },
      })
      .pipe(map((resp) => resp.data['CreateTestGroups']));
  }

  updateTestGroups(payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateGroupsForTest($test_group_inputs: [TestGroupUpdateInput]) {
            UpdateTestGroups(test_group_inputs: $test_group_inputs) {
              _id
            }
          }
        `,
        variables: {
          test_group_inputs: payload,
        },
      })
      .pipe(map((resp) => resp.data['UpdateTestGroups']));
  }

  deleteTestGroups(payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation DeleteTestGroupsForGroupCreation($_ids: [ID]!) {
            DeleteTestGroups(_ids: $_ids)
          }
        `,
        variables: {
          _ids: payload,
        },
      })
      .pipe(map((resp) => resp.data['DeleteTestGroups']));
  }

  createAutomaticTestGroups(testId: string, schoolId: string) {
    return this.apollo
      .mutate({
        mutation: gql`
      mutation createAutomaticTestGroupsForGroupCreation{
        CreateAutomaticTestGroup(test_id: "${testId}", school_id: "${schoolId}") {
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
      })
      .pipe(map((resp) => resp.data['CreateAutomaticTestGroup']));
  }

  markDoneTask(done_task_id: string, lang: string, nextAssignedGroups: string[]) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation doneTaskCreateGroup($done_task_id: ID!, $lang: String, $nextAssignedGroups: [ID!]) {
            DoneAndStartNextTask(done_task_id: $done_task_id, lang: $lang, next_assigned_groups: $nextAssignedGroups) {
              _id
            }
          }
        `,
        variables: {
          done_task_id: done_task_id,
          lang: lang,
          nextAssignedGroups,
        },
      })
      .pipe(map((resp) => resp.data['DoneAndStartNextTask']));
  }

  getAllTest(titleId: string, classId: string, schoolId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query getAllTestForDuplicateDropdown($rncp_title_id: ID, $class_id: ID, $school_id: ID, $is_group_test: Boolean) {
            GetAllTests(rncp_title_id: $rncp_title_id, class_id: $class_id, school_id: $school_id, is_group_test: $is_group_test) {
              _id
              name
            }
          }
        `,
        variables: {
          rncp_title_id: titleId,
          class_id: classId,
          school_id: schoolId,
          is_group_test: true,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTests']));
  }

  getTotalGroupStudent(school: string, rncp_title: string, current_class: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetTotalGroupStudent($school: ID, $rncp_title: ID, $current_class: ID) {
            GetTotalGroupStudent(school: $school, rncp_title: $rncp_title, current_class: $current_class) {
              total_student
              total_complete_admission
            }
          }
        `,
        variables: {
          school,
          rncp_title,
          current_class,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetTotalGroupStudent']));
  }
}
