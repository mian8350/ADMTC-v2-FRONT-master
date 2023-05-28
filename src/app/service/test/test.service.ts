import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Test } from '../../models/test.model';
import { RNCPTitlesService } from '../../service/rncpTitles/rncp-titles.service';
import { HttpClient } from '@angular/common/http';
import { Cacheable } from 'ngx-cacheable';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';

declare var _: any;
@Injectable({
  providedIn: 'root',
})
export class TestService {
  test = new BehaviorSubject<Test>(new Test());
  testChanged = new Subject<Test>();
  emptyTest = new Test();
  categoryStack: number[] = [];
  editing: boolean;
  index: number;
  rncpTitleID: string;
  combinedList;
  validate;

  private resetTestDocumentPageSource = new BehaviorSubject<boolean>(true);
  public resetTestDocumentPage$ = this.resetTestDocumentPageSource.asObservable();

  // statusUpdateUrl = AppSettings.urls.academic.statusUpdateForTest;
  correction_gridSections: boolean[] = [];
  retakeTestInformation: any;

  constructor(private rNCPTitlesService: RNCPTitlesService, private httpClient: HttpClient, private apollo: Apollo) {}

  triggerResetTestDocumentPage(status: boolean) {
    this.resetTestDocumentPageSource.next(status);
  }

  updateNewTest(test) {
    this.test.next(test);
    this.editing = false;
  }

  updateTest(test) {
    this.test.next(test);
  }

  resetTest() {
    // this.test = new BehaviorSubject<Test>(new Test());
    this.test.next(null);
    const tempTest = new Test();
    this.test.next(tempTest);
    return this.test;
  }

  submitTest(save?: boolean, isPublish?: boolean) {

    return Observable.create(
      function(observer) {
        const t = this.test.getValue();


        // VERY CRITICAL LINE, IF THE BELOW GIVEN LINE IS REMOVED, DAY - 1 ISSUE WILL HAPPEN AGAIN
        t.date = new Date(t.date).toDateString();

        if (t.date_retake_exam) {
          t.date_retake_exam = new Date(t.date_retake_exam).toDateString();
        }

        if (t.schools && t.schools.length > 1) {
          t.schools.forEach(s => {
            s.test_date = new Date(s.test_date).toDateString();
          });
        }

        // remove the below field if tes is NOT RETAKE
        if (t.expected_document && t.expected_document.length) {
          for (const ed of t.expected_document) {
            if (!t.allow_retake_exam) {
              delete ed['docUploadDateRetakeExam'];
            }
            // VERY CRITICAL LINE, IF THE BELOW GIVEN LINE IS REMOVED, DAY - 1 ISSUE WILL HAPPEN AGAIN
            if (ed.deadline_date.type === 'fixed') {
              ed.deadline_date.deadline = new Date(ed.deadline_date.deadline).toDateString();
            }
          }
        }
        if (isPublish) {
          t['is_published'] = true;
        } else {
          t['is_published'] = t['is_published'] ? t['is_published'] : false;
        }

        if (save) {
          t.incomplete_creation = false;
        } else {
          t.incomplete_creation = false;
        }
        // t.parentRNCPTitle = this.rncpTitleID;

        if (this.editing) {
          delete t.type;
          delete t.documents;
          delete t.correction_grid.footer.text_below;
          delete t.weight;

          this.editTest(t._id, t).subscribe(
            function(status) {

              //  this.editing = false;
              if (status) {
                // this.test.next(new Test());
                this.editing = false;
                // this.categoryStack = [];
                observer.next(true);
              } else {
                observer.next(false);
              }
            }.bind(this),
          );
        } else {
          delete t.type;
          delete t.documents;
          delete t.correction_grid.footer.text_below;
          delete t.weight;
          delete t.schools;
          this.addTest(t).subscribe(
            function(status) {

              //  this.editing = false;
              if (status) {
                // this.test.next(new Test());
                this.editing = false;
                // this.categoryStack = [];
                observer.next(true);
              } else {
                observer.next(false);
              }
            }.bind(this),
          );
        }
      }.bind(this),
    );
  }

  addTest(test): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation createTest($test_input: TestInput) {
            CreateTest(test_input: $test_input) {
              name
            }
          }
        `,
        variables: {
          test_input: test,
        },
      })
      .pipe(map(resp => resp.data['CreateTest']));
  }

  editTest(id, test): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation updateTest($id: ID!, $test_input: TestInput) {
            UpdateTest(_id: $id, test_input: $test_input) {
              name
            }
          }
        `,
        variables: {
          id: id,
          test_input: test,
        },
      })
      .pipe(map(resp => resp.data['UpdateTest']));
  }

  computeCivility(gender: string, language: string) {
    let civility = '';

    if (!language) {
      language = 'fr';
    }

    if (language.toLowerCase() === 'en') {
      if (gender) {
        if (gender.toLowerCase().startsWith('m')) {
          civility = 'Mr';
        } else if (gender.toLowerCase().startsWith('f')) {
          civility = 'Mrs';
        }
      } else {
        civility = 'Mr';
      }
    } else if (language.toLowerCase() === 'fr') {
      if (gender) {
        if (gender.toLowerCase().startsWith('m')) {
          civility = 'M.';
        } else if (gender.toLowerCase().startsWith('f')) {
          civility = 'Mme';
        }
      } else {
        civility = 'M.';
      }
    }
    return civility;
  }

  getTitleSubject(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/getOneTitleSubject.json');
  }

  getPreparationCenters(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/prepCenters.json');
  }

  getUserPermissionDummyData(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/dummy-permission.json');
  }

  getclass(rncp_id: any): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
      query {
        GetAllClasses(rncp_id: "${rncp_id}") {
          _id
          name
        }
      }
      `,
      })
      .pipe(
        map(response => {
          if (response.data) {
            return response.data['GetAllClasses'];
          }
        }),
      );
  }

  saveRetakeInformation(retakeInfo) {
    this.retakeTestInformation = retakeInfo;
  }
  getRetakeInformation() {
    return this.retakeTestInformation;
  }

  searchTests(keyword): Observable<[]> {
    return this.apollo
      .watchQuery<{ _id: string; name: string }[]>({
        query: gql`
      query {
        GetAllTests(keyword:"${keyword}"){
          _id
          parent_rncp_title{
            _id
            short_name
          }
          _id
          name
          class{
            name
          }
          max_score
          coefficient
          correction_type
          organiser
          date_type
          date
          group_test
          controlled_test
          documents {
            name
          }
          expected_documents {
            document_name
          }
          test_date_pc {
            preparation_center_id {
              _id
            }
            test_date
          }
          calendar {
            steps {
              text
              sender
              actor {
                name
              }
              date {
                type
                before
                day
                value
              }
            }
          }
          incomplete_creation
          status
          linked_tests {
            test {
              _id
            }
            coefficient
          }
          schools {
            school_details
          }
          weight
          corrector_assigned {
            corrector_id {
              first_name
              last_name
            }
            no_of_student
            students {
              _id
            }
            school_id {
              short_name
            }
          }
          corrector_assigned_for_retake_v2 {
            corrector_id {
              _id
            }
            no_of_student
            students {
              _id
            }
            school_id {
              _id
            }
          }
          corrector_assigned_for_final_retake {
            corrector_id {
              _id
            }
            no_of_student
            students {
              _id
            }
            school_id {
              _id
            }
          }
          corrector_assigned_for_quality_control {
            corrector_id {
              _id
            }
            no_of_student
            students {
              _id
            }
            school_id {
              _id
            }
          }
          president_jury_assigned {
            corrector_id {
              _id
            }
            no_of_student
            students {
              _id
            }
            due_date
          }
          jury_min
          jury_max
          correction_status
          correction_status_for_schools {
            school {
              _id
            }
            correction_status
            modification_period_date
            is_retake_going_on
            is_retake_v2_going_on
          }
          correction_status_for_school_for_retake_v2 {
            school {
              _id
            }
            correction_status
            modification_period_date
            is_retake_going_on
            is_retake_v2_going_on
          }
          allow_retake_exam
          date_retake_exam
          is_published
          published_date
          published_date
          registered_student
          allow_final_retake
          final_retake_date
          is_pfe
          quality_control
          is_quality_n3_sent
          student_per_school_for_qc
          quality_control_difference
          school_count_at_qc_creation {
            _id
          }
          random_students_for_qc {
            _id
          }
          is_already_published
          number_of_times_published
          is_initial_test
          retake_test {
            _id
          }
          student_should_retake {
            student {
              _id
            }
            school {
              _id
            }
            decision
          }
          is_retake_test
          is_different_notation_grid
          initial_test {
            _id
          }
          is_retake_n1_sent
          correction_grid {
            orientation
            header {
              text

            }
            group_detail {
              no_of_student
              header_text
              min_no_of_student
              groups_allocation
            }
            footer {
              text
              text_below
              fields {
                type
                value
                dataType
                align
              }
            }
            correction {
              display_final_total
              total_zone {
                display_additional_total
                additional_max_score
                decimal_place
              }
              show_as_list
              show_final_comments
              final_comments_header
              show_notations_marks
              comment_area
              comments_header
              comment_for_each_section
              comment_for_each_section_header
              comment_for_each_sub_section
              comment_for_each_sub_section_header
              show_directions_column
              directions_column_header
              show_number_marks_column
              number_marks_column_header
              show_letter_marks_column
              letter_marks_column_header
              show_penaltie
              penalties_header
              penalties {
                title
                count
              }
              show_bonuse
              show_eliminations
              bonuses_header
              bonuses {
                title
                count
              }
              sections {
                title
                maximum_rating
                page_break
                sub_section {
                  title
                  maximum_rating
                  direction
                }
              }
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map(resp => resp.data['GetAllTests']));
  }

  getOneTest(testId: string): Observable<{ _id: string; name: string }[]> {
    return this.apollo
      .watchQuery<{ _id: string; name: string }[]>({
        query: gql`
      query {
        GetOneTest(_id:  "${testId}"){
          _id
          block_type
          parent_rncp_title{
            _id
            short_name
          }
          _id
          name
          class{
            name
          }
          max_score
          coefficient
          correction_type
          organiser
          date_type
          date
          group_test
          controlled_test
          documents {
            name
          }
          expected_documents {
            document_name
          }
          test_date_pc {
            preparation_center_id {
              _id
            }
            test_date
          }
          calendar {
            steps {
              text
              sender
              actor {
                name
              }
              date {
                type
                before
                day
                value
              }
            }
          }
          incomplete_creation
          status
          linked_tests {
            test {
              _id
            }
            coefficient
          }
          schools {
            school_details
          }
          weight
          corrector_assigned {
            corrector_id {
              first_name
              last_name
            }
            no_of_student
            students {
              _id
            }
            school_id {
              short_name
            }
          }
          corrector_assigned_for_retake_v2 {
            corrector_id {
              _id
            }
            no_of_student
            students {
              _id
            }
            school_id {
              _id
            }
          }
          corrector_assigned_for_final_retake {
            corrector_id {
              _id
            }
            no_of_student
            students {
              _id
            }
            school_id {
              _id
            }
          }
          corrector_assigned_for_quality_control {
            corrector_id {
              _id
            }
            no_of_student
            students {
              _id
            }
            school_id {
              _id
            }
          }
          president_jury_assigned {
            corrector_id {
              _id
            }
            no_of_student
            students {
              _id
            }
            due_date
          }
          jury_min
          jury_max
          correction_status
          correction_status_for_schools {
            school {
              _id
            }
            correction_status
            modification_period_date
            is_retake_going_on
            is_retake_v2_going_on
          }
          correction_status_for_school_for_retake_v2 {
            school {
              _id
            }
            correction_status
            modification_period_date
            is_retake_going_on
            is_retake_v2_going_on
          }
          allow_retake_exam
          date_retake_exam
          is_published
          published_date
          published_date
          registered_student
          allow_final_retake
          final_retake_date
          is_pfe
          quality_control
          is_quality_n3_sent
          student_per_school_for_qc
          quality_control_difference
          school_count_at_qc_creation {
            _id
          }
          random_students_for_qc {
            _id
          }
          is_already_published
          number_of_times_published
          is_initial_test
          retake_test {
            _id
          }
          student_should_retake {
            student {
              _id
            }
            school {
              _id
            }
            decision
          }
          is_retake_test
          is_different_notation_grid
          initial_test {
            _id
          }
          is_retake_n1_sent
          correction_grid {
            orientation
            header {
              text
              fields {
                type
                value
                dataType
                align
              }
              directive_long
            }
            group_detail {
              no_of_student
              header_text
              min_no_of_student
              groups_allocation
            }
            footer {
              text
              text_below
              fields {
                type
                value
                dataType
                align
              }
            }
            correction {
              display_final_total
              total_zone {
                display_additional_total
                additional_max_score
                decimal_place
              }
              show_as_list
              show_final_comments
              final_comments_header
              show_notations_marks
              comment_area
              comments_header
              comment_for_each_section
              comment_for_each_section_header
              comment_for_each_sub_section
              comment_for_each_sub_section_header
              show_directions_column
              directions_column_header
              show_number_marks_column
              number_marks_column_header
              show_letter_marks_column
              letter_marks_column_header
              show_penaltie
              penalties_header
              penalties {
                title
                count
              }
              show_bonuse
              show_eliminations
              bonuses_header
              bonuses {
                title
                count
              }
              sections {
                title
                maximum_rating
                page_break
                sub_section {
                  title
                  maximum_rating
                  direction
                }
              }
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map(resp => resp.data['GetOneTest']));
  }

  getAllUserType(): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllUserTypes {
              name
              entity
              description
              is_created_by_user
              acad_kit_permissions {
                admissions {
                  status
                  permissions {
                    view
                    update
                    download
                  }
                }
                annales_epreuves {
                  status
                  permissions {
                    view
                    update
                    download
                  }
                }
                boitea_outils {
                  status
                  permissions {
                    view
                    update
                    download
                  }
                }
                communication {
                  status
                  permissions {
                    view
                    update
                    download
                  }
                }
                examens {
                  status
                  permissions {
                    view
                    update
                    download
                  }
                }
                organisation {
                  status
                  permissions {
                    view
                    update
                    download
                  }
                }
                programme {
                  status
                  permissions {
                    view
                    update
                    download
                  }
                }
                epreuves_certification {
                  status
                  permissions {
                    view
                    update
                    download
                  }
                }
                archives {
                  status
                  permissions {
                    view
                    update
                    download
                  }
                }
              }
            }
          }
        `,
      })
      .pipe(
        map(response => {
          if (response.data) {
            return response.data['GetAllUserTypes'];
          }
        }),
      );
  }

  cancelTest() {
    return Observable.create(observer => {
      this.test.next(new Test());
      this.editing = false;
      observer.next(true);
    });
  }

  checkcorrection_gridSections(test) {
    const sections = test.correction_grid.correction.sections;
    let incomplete = false;
    for (const section of sections) {
      if (section.title === '') {
        incomplete = true;
        break;
      } else {
        for (const subsec of section.sub_section) {
          if (subsec.title === '') {
            incomplete = true;
            break;
          }
        }
        if (incomplete) {
          break;
        }
      }
    }
    if (incomplete) {
      return false;
    } else {
      return true;
    }
  }

  getValidation() {
    return this.validate;
  }

  setValidation(data) {
    this.validate = data;
  }

  getTest() {
    // if (!this.editing) {
    //   this.categoryStack = this.acadService.getTestStack();
    // }


    return this.test;
  }

  getDocumentsById(ID: String): Observable<any> {
    return this.apollo.query({
      query: gql `
      query{
        GetOneTest(_id:"${ID}"){
          _id
          controlled_test
          group_test
          block_type
          calendar{
            steps{
              created_from
              text
              sender
              actor{
                _id
                name
              }
              date{
                type
                before
                day
                value
              }
            }
          }
          documents{
            _id
            name
            created_at
            file_path
            file_name
            type
            publication_date{
              type
              before
              day
              publication_date{
                year
                month
                date
                hour
                minute
                time_zone
              }
            }
          }
          expected_documents{
            document_name
            is_for_all_student
            document_user_type{
              _id
            }
            deadline_date{
              deadline
              type
              before
              day
            }
          }
        }
      }
      `,
      fetchPolicy: 'network-only',
    }).pipe(map(resp => resp.data['GetOneTest']));
  }

  createAcadDoc(acadDocument): Observable<any>{
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateAcadDoc($doc_input: AcadDocumentInput) {
            CreateAcadDoc(doc_input: $doc_input) {
              _id
              name
              type
              file_path
              file_name
              created_at
              publication_date{
                type
                before
                day
                publication_date{
                  year
                  month
                  date
                  hour
                  minute
                  time_zone
                }
              }
            }
          }
        `,
        variables: {
          doc_input: acadDocument,
        },
      })
      .pipe(map(resp => resp.data['CreateAcadDoc']));
  }

  @Cacheable()
  getPreviewData(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/testPreviewData.json');
  }

  @Cacheable()
  getAllUserTypeDummyData(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/usertype.json');
  }

  @Cacheable()
  getAllUserTypeDummyData1(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/usertype.json');
  }

  @Cacheable()
  getUserTypesByEntity(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/getuserbyentity.json');
  }
}
