import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Apollo } from 'apollo-angular';
import { StudentTranscript } from 'app/transcript-process/transcript-process.model';
import gql from 'graphql-tag';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TranscriptProcessService {
  public tableAttribute: BehaviorSubject<number> = new BehaviorSubject<number>(450);

  setTableAttribute(value: number) {
    this.tableAttribute.next(value);
  }

  private isTranscriptCompletedSource = new BehaviorSubject<boolean>(false);
  isTranscriptCompleted$ = this.isTranscriptCompletedSource.asObservable();
  setTranscriptCompleted(decision: boolean) {
    this.isTranscriptCompletedSource.next(decision);
  }

  isReloadAfterSave = new BehaviorSubject<boolean>(false);
  isReloadAfterSave$ = this.isReloadAfterSave.asObservable();

  constructor(private apollo: Apollo) {}

  getCertifiersDropdown(): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query getCertifierSchoolJury {
            GetAllSchools(school_type: certifier) {
              _id
              short_name
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllSchools']));
  }

  getRncpTitlesDropdown(school_id: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
      query {
        GetAllTitles(school_id: "${school_id}", school_type:"certifier") {
          _id
          short_name
        }
      }
    `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllTitles']));
  }

  getTitleDropdownListForFinalTranscript(school_id: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
      query getTitleDropdownListForFinalTranscript {
        GetTitleDropdownListForFinalTranscript(school_id: "${school_id}") {
          _id
          short_name
        }
      }
    `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetTitleDropdownListForFinalTranscript']));
  }

  getClassesDropdown(rncp_id: string): Observable<any[]> {
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
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllClasses']));
  }

  getClassDropdownListForFinalTranscript(school_id: string, rncp_id: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
      query GetClassDropdownListForFinalTranscript {
        GetClassDropdownListForFinalTranscript(school_id: "${school_id}", rncp_id: "${rncp_id}") {
          _id
          name
        }
      }
    `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetClassDropdownListForFinalTranscript']));
  }

  getSchoolPCList(rncp_title_ids, class_id): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query getSchoolPcListFirstStep($rncp_title_ids: [ID], $class_id: ID) {
            GetAllSchools(school_type: preparation_center, rncp_title_ids: $rncp_title_ids, class_id: $class_id) {
              _id
              short_name
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          rncp_title_ids,
          class_id,
        },
      })
      .pipe(map((resp) => resp.data['GetAllSchools']));
  }

  getBlockDecisionDropdown(rncpId: string, classId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
      query getAllBlocksForTranscript {
        GetAllBlockOfCompetenceConditions(rncp_title_id:"${rncpId}", class_id:"${classId}", count_for_title_final_score: true){
          _id
          block_of_tempelate_competence {
            _id
            phrase_names {
              _id
              name
              phrase_type
            }
          }
          block_of_tempelate_soft_skill {
            _id
            phrase_names {
              _id
              name
              phrase_type
            }
          }
          pass_fail_conditions {
            _id
            condition_name
            condition_type
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllBlockOfCompetenceConditions']));
  }

  cancelStudentTranscriptRetake(
    lang: string,
    transcriptProcessId: string,
    studentTranscriptId: string,
    testIds: string[],
  ): Observable<any[]> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CancelStudentTranscriptRetake($lang: String, $transcriptProcessId: ID, $studentTranscriptId: ID, $testIds: [ID]) {
            CancelStudentTranscriptRetake(
              lang: $lang
              transcript_process_id: $transcriptProcessId
              student_transcript_id: $studentTranscriptId
              test_ids: $testIds
            ) {
              _id
            }
          }
        `,
        variables: { lang, transcriptProcessId, studentTranscriptId, testIds },
      })
      .pipe(map((resp) => resp.data['CancelStudentTranscriptRetake']));
  }

  getClassPassFailParameter(classId: string): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
      query {
        GetOneClass(_id: "${classId}") {
          pass_fail_conditions {
            _id
            condition_name
            condition_type
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneClass']));
  }

  getAllBlocksForTranscript(rncpId: string, classId: string, isExpertise?): Observable<any[]> {
    return this.apollo
      .query({
        query: gql`
      query getAllBlocksForTranscript ($block_type: EnumBlockType) {
        GetAllBlockOfCompetenceConditions(rncp_title_id:"${rncpId}", class_id:"${classId}", is_retake_by_block: false, count_for_title_final_score: true, block_type: $block_type){
          _id
          block_of_competence_condition
          block_rncp_reference
          description
          count_for_title_final_score
          subjects {
            _id
            subject_name
            is_subject_transversal_block
            subject_transversal_block_id {
              _id
              subject_name
            }
            evaluations {
              _id
              evaluation
            }
          }
          block_of_tempelate_competence{
            _id
            ref_id
          }
          block_of_tempelate_soft_skill{
            _id
            ref_id
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
        variables: {
          block_type: isExpertise ? 'competence' : null,
        },
      })
      .pipe(map((resp) => resp.data['GetAllBlockOfCompetenceConditions']));
  }

  createTranscriptProcess(payload) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateTranscriptProcess($transcript_process_input: TranscriptProcessInput) {
            CreateTranscriptProcess(transcript_process_input: $transcript_process_input) {
              _id
              name
            }
          }
        `,
        variables: {
          transcript_process_input: payload,
        },
      })
      .pipe(map((resp) => resp.data['CreateTranscriptProcess']));
  }

  getTableTranscriptProcess(pagination, sorting, filter): Observable<any> {
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
              name
              class_id {
                _id
                name
              }
              rncp_title_id {
                _id
                short_name
              }
              type
              certifier_id {
                _id
                short_name
              }
              transcript_process_status
              is_final_transcript
              count_document
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          pagination,
          sorting,
          filter,
        },
      })
      .pipe(map((resp) => resp.data['GetAllTranscriptProcess']));
  }

  getOneTranscriptProcess(transcriptProcessId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query GetOneTranscriptProcess {
          GetOneTranscriptProcess(_id: "${transcriptProcessId}") {
            _id
            name
            class_id {
              _id
              name
            }
            rncp_title_id{
              _id
              short_name
            }
            certifier_id{
              _id
              short_name
            }
            block_competence_condition_details {
              block_id {
                _id
                block_of_competence_condition
              }
              is_block_selected
              is_block_coming_from_previous_process
            }
            transcript_process_status
            is_final_transcript
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTranscriptProcess']));
  }

  getAllCertidegreeStudent(rncpTitle: string, pagination: any, sort: any, filter: any): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllStudents($rncpTitle: ID, $pagination: PaginationInput, $sort: StudentSorting, $filter: FilterStudent) {
            GetAllStudents(rncp_title: $rncpTitle, pagination: $pagination, sorting: $sort, filter: $filter, status: completed) {
              count_document
              first_name
              last_name
              civility
              school {
                short_name
              }
              identity_verification_status
              allow_final_transcript_gen
              certificate_issuance_status
              multi_employability_survey_ids {
                survey_status
                validator
              }
              academic_journey_id {
                diplomas {
                  diploma_name
                }
              }
              final_transcript_id {
                _id
                status
                final_transcript_status
                certification_status
                jury_decision_for_final_transcript
                input_final_decision_status
                is_validated
                student_decision
                after_final_retake_decision
                has_jury_finally_decided
                retake_test_for_students {
                  test_id {
                    _id
                  }
                }
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: { rncpTitle, pagination, sort, filter },
      })
      .pipe(map((resp) => resp.data['GetAllStudents']));
  }

  getOneTranscriptDetailProcess(transcriptProcessId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query getOneTranscriptDetailProcess {
          GetOneTranscriptProcess(_id: "${transcriptProcessId}") {
            _id
            name
            class_id {
              name
              type_evaluation
              sub_type_evaluation
              jury_process_name
            }
            rncp_title_id {
              short_name
            }
            is_final_transcript
            jury_decision
            school_ids {
              _id
              short_name
            }
            block_competence_condition_details {
              block_id {
                _id
                block_of_competence_condition
                is_specialization
              }
              is_block_selected
              is_block_coming_from_previous_process
            }
            transcript_process_status
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTranscriptProcess']));
  }

  getOneTranscriptPublishParameter(transcriptProcessId): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query getOneTranscriptPublishParameter {
          GetOneTranscriptProcess(_id: "${transcriptProcessId}") {
            _id
            name
            is_diploma_must_uploaded
            is_employability_survey_must_completed
            is_administrative_must_completed
            is_student_can_give_decision
            final_n2_text
            transcript_n2b
            block_competence_condition_details {
              block_id {
                _id
                block_of_competence_condition
              }
              is_block_selected
              is_block_coming_from_previous_process
            }
            transcript_process_status
            # Class id is used to check the type to display/hide slider for automatically accept retake
            class_id {
              type_evaluation
              jury_process_name
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneTranscriptProcess']));
  }

  getAllStudentTranscripts(
    transcriptId: string,
    titleId: string,
    classId: string,
    pagination: any,
    sorting: any,
    filter: string,
    isTranscriptCompleted: boolean,
    filteredValue,
    is_published?
  ): Observable<StudentTranscript[]> {
    return this.apollo
      .query({
        query: gql`
      query GetAllStudentTranscripts(
        $transcriptId: ID
        $titleId: ID,
        $classId: ID,
        $pagination: PaginationInput,
        $sorting: StudentTranscriptProcessSorting
        $filteredValue: StudentTranscriptProcessFilter
        $is_published: EnumTrueFalse
      ) {
        GetAllStudentTranscripts(
          transcript_process_id: $transcriptId
          rncp_id: $titleId,
          class_id: $classId,
          pagination: $pagination,
          sorting: $sorting,
          filter: $filteredValue,
          is_published: $is_published
          ${isTranscriptCompleted ? '' : `is_latest: yes`}
          ${filter ? filter : ''}
        ) {
          _id
          school_id {
            _id
            short_name
          }
          student_id {
            _id
            civility
            first_name
            last_name
            student_title_status
            jury_organization_id {
              _id
            }
            final_transcript_result_id {
              total_mark
              total_point
              pass_fail_status
              block_of_competence_conditions {
                total_mark
                total_point
                pass_fail_status
                block_id {
                  _id
                }
              }
              block_of_competence_templates {
                grand_oral_block_phrase_obtained_id {
                  name
                  phrase_type
                }
                block_id {
                  _id
                }
              }
              block_of_soft_skill_templates {
                grand_oral_block_phrase_obtained_id {
                  name
                  phrase_type
                }
                block_id {
                  _id
                }
              }
            }
            final_transcript_pdf_histories {
              transcript_process_id {
                _id
              }
              student_transcript_id {
                _id
              }
              final_transcript_pdf_link
            }
          }
          student_accept_retake
          block_competence_condition_details {
            block_id {
              _id
              block_of_tempelate_competence {
                _id
              }
            }
            decision_school_board_id {
              _id
              condition_name
              condition_type
              name
              phrase_type
              phrase_parameters {
                validation_type
              }
            }
            pass_fail_decision_obtained_id {
              _id
              condition_name
              condition_type
              name
            }
            decision_school_board
            retake_blocks {
              decision_student
            }
          }
          pass_fail_decision_obtained_id {
            _id
            condition_name
            condition_type
          }
          decision_school_board_id {
            _id
            condition_name
            condition_type
          }
          decision_platform
          decision_school_board
          is_published
          suggested_decision_grand_oral {
            name
            phrase_type
          }
          grand_oral_decision {
            name
            phrase_type
          }
          count_document
        }
      }
      `,
        fetchPolicy: 'network-only',
        variables: { transcriptId, titleId, classId, pagination, sorting, filteredValue, is_published },
      })
      .pipe(map((resp) => resp.data['GetAllStudentTranscripts']));
  }

  GetRetakeBlocks(transcriptId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query {
        GetRetakeBlockForStudent(student_transcript_id: "${transcriptId}") {
          _id
          block_of_competence_condition
          selected_block_retake {
            _id
          }
          subjects {
            _id
            subject_name
            evaluations {
              _id
              evaluation
              published_test_id {
                _id
              }
            }
          }
        }
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetRetakeBlockForStudent']));
  }

  getOneStudentTranscripts(transcriptId: string, studentId: string, titleId: string, classId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllStudentTranscripts($transcriptId: ID, $studentId: ID, $titleId: ID, $classId: ID) {
            GetAllStudentTranscripts(
              transcript_process_id: $transcriptId
              student_id: $studentId
              rncp_id: $titleId
              class_id: $classId
              sorting: { date_creation: desc }
            ) {
              _id
              is_published
              cancel_retake
              student_id {
                _id
                first_name
                last_name
                civility
                specialization {
                  _id
                }
              }
              school_id {
                _id
                short_name
              }
              decision_school_board
              decision_school_board_id {
                condition_name
                condition_type
              }
              date_decision_school_board {
                date
                time
              }
              retake_date {
                date
                time
              }
              decision_platform
              date_decision_platform {
                date
                time
              }
              pass_fail_decision_obtained_id {
                _id
                condition_name
                condition_type
              }
              is_latest
              transcript_process_id {
                _id
                name
              }
              latest_created_number
              student_accept_retake
              block_competence_condition_details {
                block_id {
                  _id
                  block_of_competence_condition
                  ref_id
                  specialization {
                    _id
                  }
                  is_specialization
                  subjects {
                    _id
                    subject_name
                    evaluations {
                      _id
                      evaluation
                    }
                  }
                  block_of_tempelate_competence {
                    phrase_names {
                      _id
                      name
                      phrase_type
                    }
                  }
                  block_of_tempelate_soft_skill {
                    phrase_names {
                      _id
                      name
                      phrase_type
                    }
                  }
                }
                decision_school_board
                date_decision_school_board {
                  date
                  time
                }
                decision_school_board_id {
                  _id
                  condition_name
                  condition_type
                  name
                  phrase_type
                }
                decision_platform
                date_decision_platform {
                  date
                  time
                }
                overall_decision
                date_overall_decision {
                  date
                  time
                }
                pass_fail_decision_obtained_id {
                  _id
                  condition_name
                  condition_type
                  name
                }
                retake_blocks {
                  block_id {
                    _id
                    block_of_competence_condition
                    subjects {
                      _id
                      subject_name
                      evaluations {
                        _id
                        evaluation
                      }
                    }
                  }
                  test_id {
                    _id
                  }
                  evaluation_id {
                    _id
                  }
                  decision_student
                  date_decision_student {
                    date
                    time
                  }
                }
                is_block_selected_in_transcript_process
              }
              is_download_button_appear
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: { titleId, classId, studentId, transcriptId },
      })
      .pipe(map((resp) => resp.data['GetAllStudentTranscripts']));
  }

  getOneStudentTranscriptsDetails(transcriptId: string, studentId: string, titleId: string, classId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query GetAllStudentTranscripts($transcriptId: ID, $studentId: ID, $titleId: ID, $classId: ID) {
            GetAllStudentTranscripts(
              transcript_process_id: $transcriptId
              student_id: $studentId
              rncp_id: $titleId
              class_id: $classId
              sorting: { date_creation: desc }
              is_published: yes
            ) {
              _id
              student_id {
                _id
                first_name
                last_name
                civility
              }
              class_id {
                type_evaluation
              }
              school_id {
                _id
                short_name
              }
              decision_school_board
              decision_school_board_id {
                condition_name
                condition_type
              }
              date_decision_school_board {
                date
                time
              }
              retake_date {
                date
                time
              }
              decision_platform
              date_decision_platform {
                date
                time
              }
              pass_fail_decision_obtained_id {
                _id
                condition_name
                condition_type
              }
              is_latest
              transcript_process_id {
                _id
                name
              }
              latest_created_number
              student_accept_retake
              block_competence_condition_details {
                block_id {
                  _id
                  block_of_competence_condition
                  ref_id
                  subjects {
                    _id
                    subject_name
                    evaluations {
                      _id
                      evaluation
                    }
                  }
                }
                decision_school_board
                date_decision_school_board {
                  date
                  time
                }
                decision_school_board_id {
                  _id
                  condition_name
                  condition_type
                  name
                  phrase_type
                }
                decision_platform
                date_decision_platform {
                  date
                  time
                }
                overall_decision
                date_overall_decision {
                  date
                  time
                }
                pass_fail_decision_obtained_id {
                  _id
                  condition_name
                  condition_type
                }
                retake_blocks {
                  block_id {
                    _id
                    block_of_competence_condition
                    subjects {
                      _id
                      subject_name
                      evaluations {
                        _id
                        evaluation
                      }
                    }
                  }
                  test_id {
                    _id
                  }
                  evaluation_id {
                    _id
                  }
                  decision_student
                  date_decision_student {
                    date
                    time
                  }
                }
                is_block_selected_in_transcript_process
              }
              is_download_button_appear
              cancel_retake
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: { titleId, classId, studentId, transcriptId },
      })
      .pipe(map((resp) => resp.data['GetAllStudentTranscripts']));
  }

  getOneStudentTranscriptsBeforeChangeDecision(transcriptId: string, studentId: string, titleId: string, classId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query getOneStudentTranscriptsBeforeChangeDecision($transcriptId: ID, $studentId: ID, $titleId: ID, $classId: ID) {
            GetAllStudentTranscripts(
              transcript_process_id: $transcriptId
              student_id: $studentId
              rncp_id: $titleId
              class_id: $classId
              sorting: { date_creation: desc }
            ) {
              _id
              student_id {
                _id
                first_name
                last_name
                civility
              }
              rncp_id {
                _id
                short_name
              }
              class_id {
                _id
                name
              }
              school_id {
                _id
                short_name
              }
              decision_school_board
              decision_school_board_id {
                condition_name
                condition_type
              }
              date_decision_school_board {
                date
                time
              }
              retake_date {
                date
                time
              }
              decision_platform
              date_decision_platform {
                date
                time
              }
              pass_fail_decision_obtained_id {
                _id
                condition_name
                condition_type
              }
              is_latest
              transcript_process_id {
                _id
                name
              }
              latest_created_number
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: { titleId, classId, studentId, transcriptId },
      })
      .pipe(map((resp) => resp.data['GetAllStudentTranscripts']));
  }

  getCpebFinalTranscriptPdf(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query {
        GetOneStudent(_id: "${studentId}") {
          _id
          cpeb_ft_pdf
        }
      }
      `,
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }

  getOneStudentTranscriptsPublished(studentId: string, titleId: string, classId: string): Observable<any> {
    return this.apollo.query({
      query: gql`
      query GetAllStudentTranscripts(
        $studentId: ID,
        $titleId: ID,
        $classId: ID,
      ) {
        GetAllStudentTranscripts(
          student_id: $studentId,
          rncp_id: $titleId,
          class_id: $classId,
          sorting: {date_creation: desc},
          is_published: yes
        ) {
          _id
          student_id{
            _id
            first_name
            last_name
            civility
            final_transcript_pdf_histories {
              transcript_process_id {
                _id
              }
              student_transcript_id {
                _id
              }
              final_transcript_pdf_link
            }
          }
          rncp_id {
            _id
            short_name
          }
          class_id {
            _id
            type_evaluation
            sub_type_evaluation
            jury_process_name
          }
          school_id {
            _id
            short_name
          }
          decision_school_board
          date_decision_school_board {
            date
            time
          }
          decision_platform
          date_decision_platform {
            date
            time
          }
          is_latest
          is_published
          transcript_process_id {
            _id
            name
          }
          latest_created_number
          block_competence_condition_details{
            is_block_selected_in_transcript_process
            decision_school_board
            date_decision_school_board{
              date
              time
            }
            decision_platform
            date_decision_platform{
              date
              time
            }
            overall_decision
            date_overall_decision{
              date
              time
            }
            retake_blocks{
              decision_student
              date_decision_student{
                date
                time
              }
            }
            block_id{
              _id
              block_of_competence_condition
              ref_id
              subjects{
                _id
                subject_name
                evaluations{
                  _id
                  evaluation
                }
              }
            }
            decision_school_board_id {
              _id
              condition_name
              condition_type
              name
              phrase_type
            }
            pass_fail_decision_obtained_id {
              _id
              condition_name
              condition_type
            }
          }
          pass_fail_decision_obtained_id {
            _id
            condition_name
            condition_type
          }
          decision_school_board_id {
            _id
            condition_name
            condition_type
          }
          grand_oral_decision {
            _id
            name
            phrase_type
          }
          is_download_button_appear
          student_id {
            jury_organization_id {
              _id
            }
          }
        }
      }
      `,
      fetchPolicy: 'network-only',
      variables: { titleId, classId, studentId }
    })
    .pipe(map((resp) => resp.data['GetAllStudentTranscripts']));
  }

  getOneStudentTranscriptsAll(studentId: string, titleId: string, classId: string): Observable<any> {
    return this.apollo.query({
      query: gql`
      query GetAllStudentTranscripts(
        $studentId: ID,
        $titleId: ID,
        $classId: ID,
      ) {
        GetAllStudentTranscripts(
          student_id: $studentId,
          rncp_id: $titleId,
          class_id: $classId,
          sorting: {date_creation: desc}
        ) {
          _id
          student_id{
            _id
            first_name
            last_name
            civility
            final_transcript_pdf_histories {
              transcript_process_id {
                _id
              }
              student_transcript_id {
                _id
              }
              final_transcript_pdf_link
            }
          }
          rncp_id {
            _id
            short_name
          }
          class_id {
            _id
            type_evaluation
            sub_type_evaluation
          }
          school_id {
            _id
            short_name
          }
          decision_school_board
          date_decision_school_board {
            date
            time
          }
          decision_platform
          date_decision_platform {
            date
            time
          }
          is_latest
          is_published
          transcript_process_id {
            _id
            name
          }
          latest_created_number
          block_competence_condition_details{
            is_block_selected_in_transcript_process
            decision_school_board
            date_decision_school_board{
              date
              time
            }
            decision_platform
            date_decision_platform{
              date
              time
            }
            overall_decision
            date_overall_decision{
              date
              time
            }
            retake_blocks{
              decision_student
              date_decision_student{
                date
                time
              }
            }
            block_id{
              _id
              block_of_competence_condition
              ref_id
              subjects{
                _id
                subject_name
                evaluations{
                  _id
                  evaluation
                }
              }
            }
            decision_school_board_id {
              _id
              condition_name
              condition_type
              name
              phrase_type
            }
            pass_fail_decision_obtained_id {
              _id
              condition_name
              condition_type
            }
          }
          pass_fail_decision_obtained_id {
            _id
            condition_name
            condition_type
          }
          decision_school_board_id {
            _id
            condition_name
            condition_type
          }
          grand_oral_decision {
            _id
            name
            phrase_type
          }
          is_download_button_appear
          student_id {
            jury_organization_id {
              _id
            }
          }
        }
      }
      `,
      fetchPolicy: 'network-only',
      variables: { titleId, classId, studentId }
    })
    .pipe(map((resp) => resp.data['GetAllStudentTranscripts']));
  }

  getAllStudentAdmitted(pagination, titleId: string, classId: string, schoolId, student_name, decision, sorting, date_of_issuance): Observable<any> {
    return this.apollo.query({
      query: gql`
      query GetAllStudentTranscripts(        
        $pagination: PaginationInput
        $titleId: ID,
        $classId: ID,
        $schoolId: ID,
        $student_name: String,
        $decision: EnumDecisionSchoolBoard
        $sorting: StudentTranscriptProcessSorting
        $isLatest: EnumTrueFalse,
        $dateOfIssuance: String
      ) {
        GetAllStudentTranscripts(          
          pagination: $pagination,
          rncp_id: $titleId,
          class_id: $classId,          
          school_id: $schoolId,
          student_name: $student_name,
          decision: $decision,
          sorting: $sorting,
          is_latest: $isLatest,
          date_of_issuance: $dateOfIssuance
        ) {
          _id
          count_document
          student_id{
            _id
            first_name
            last_name
            civility            
          }
          rncp_id {
            _id
            short_name
          }
          class_id {
            _id
            type_evaluation
            sub_type_evaluation
          }
          school_id {
            _id
            short_name
          }
          decision_school_board   
          student_accept_retake
          date_of_issuance                 
        }        
      }
      `,
      fetchPolicy: 'network-only',
      variables: { pagination, titleId, classId, schoolId,student_name, decision, sorting, isLatest: 'yes', dateOfIssuance: date_of_issuance}
    })
    .pipe(map((resp) => resp.data['GetAllStudentTranscripts']));
  }

  getSchoolsOfRncpTitle(title: string) {
    return this.apollo
      .query({
        query: gql`
      query {
        GetAllSchools(rncp_title_ids: ["${title}"]) {
          _id
          short_name
        }
      }
      `,
      })
      .pipe(map((resp) => resp.data['GetAllSchools']));
  }

  deleteTranscriptProcess(transcriptId): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
      mutation deleteTranscriptProcess{
        DeleteTranscriptProcess(_id: "${transcriptId}") {
          _id
        }
      }
      `,
      })
      .pipe(map((resp) => resp));
  }

  saveTranscriptProcessStepOne(transcriptId, payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateTranscriptProcess($_id: ID!, $transcript_process_input: TranscriptProcessInput) {
            UpdateTranscriptProcess(_id: $_id, transcript_process_input: $transcript_process_input) {
              _id
            }
          }
        `,
        variables: {
          _id: transcriptId,
          transcript_process_input: payload,
        },
      })
      .pipe(map((resp) => resp.data['UpdateTranscriptProcess']));
  }

  publishStudentTranscript(transcript_process_id, student_transcript_ids, is_all, school_id, student_name): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation PublishStudentTranscript(
            $transcript_process_id: ID
            $student_transcript_ids: [ID]
            $is_all: Boolean
            $school_id: ID
            $student_name: String
          ) {
            PublishStudentTranscript(
              transcript_process_id: $transcript_process_id
              student_transcript_ids: $student_transcript_ids
              is_all: $is_all
              school_id: $school_id
              student_name: $student_name
            ) {
              _id
            }
          }
        `,
        variables: {
          transcript_process_id,
          student_transcript_ids,
          is_all,
          school_id,
          student_name,
        },
      })
      .pipe(map((resp) => resp.data['PublishStudentTranscript']));
  }

  publishStudentTranscriptOne(transcript_process_id, student_transcript_ids): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation PublishStudentTranscript($transcript_process_id: ID, $student_transcript_ids: [ID]) {
            PublishStudentTranscript(transcript_process_id: $transcript_process_id, student_transcript_ids: $student_transcript_ids) {
              _id
            }
          }
        `,
        variables: {
          transcript_process_id,
          student_transcript_ids,
        },
      })
      .pipe(map((resp) => resp.data['PublishStudentTranscript']));
  }

  CheckRetakeBlockWhenPublishStudentTranscript(
    transcript_process_id,
    student_transcript_ids,
    is_all,
    school_id,
    student_name,
  ): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query CheckRetakeBlockWhenPublishStudentTranscript(
            $transcript_process_id: ID
            $student_transcript_ids: [ID]
            $is_all: Boolean
            $school_id: ID
            $student_name: String
          ) {
            CheckRetakeBlockWhenPublishStudentTranscript(
              transcript_process_id: $transcript_process_id
              student_transcript_ids: $student_transcript_ids
              is_all: $is_all
              school_id: $school_id
              student_name: $student_name
            ) {
              _id
              block_of_competence_condition
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          transcript_process_id,
          student_transcript_ids,
          is_all,
          school_id,
          student_name,
        },
      })
      .pipe(map((resp) => resp.data['CheckRetakeBlockWhenPublishStudentTranscript']));
  }

  CheckRetakeBlockWhenPublishStudentTranscriptOne(transcript_process_id, student_transcript_ids): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query CheckRetakeBlockWhenPublishStudentTranscript($transcript_process_id: ID, $student_transcript_ids: [ID]) {
            CheckRetakeBlockWhenPublishStudentTranscript(
              transcript_process_id: $transcript_process_id
              student_transcript_ids: $student_transcript_ids
            ) {
              _id
              block_of_competence_condition
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          transcript_process_id,
          student_transcript_ids,
        },
      })
      .pipe(map((resp) => resp.data['CheckRetakeBlockWhenPublishStudentTranscript']));
  }

  updateStudentTranscript(transcriptId, payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateStudentTranscript($_id: ID, $student_transcript_input: StudentTranscriptInput) {
            UpdateStudentTranscript(_id: $_id, student_transcript_input: $student_transcript_input) {
              _id
            }
          }
        `,
        variables: {
          _id: transcriptId,
          student_transcript_input: payload,
        },
      })
      .pipe(map((resp) => resp.data['UpdateStudentTranscript']));
  }

  createStudentTranscriptForChangeDecision(payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateStudentTranscriptForChangeDecision($student_transcript_input: StudentTranscriptInput) {
            CreateStudentTranscript(student_transcript_input: $student_transcript_input, is_plus_button: true) {
              _id
            }
          }
        `,
        variables: {
          student_transcript_input: payload,
        },
      })
      .pipe(map((resp) => resp.data['CreateStudentTranscript']));
  }

  submitStudentDecision(transcriptId, payload): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation SubmitStudentDecision($_id: ID, $student_transcript_input: StudentTranscriptInput) {
            SubmitStudentDecision(_id: $_id, student_transcript_input: $student_transcript_input) {
              _id
            }
          }
        `,
        variables: {
          _id: transcriptId,
          student_transcript_input: payload,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp));
  }

  startTransriptProcess(transcriptId): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation StartInputDecision($_id: ID!) {
            StartTranscriptProcess(transcript_process_id: $_id) {
              _id
            }
          }
        `,
        variables: {
          _id: transcriptId,
        },
      })
      .pipe(map((resp) => resp.data['StartTranscriptProcess']));
  }

  checkAllTestInBlockValidated(payload): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query CheckAllTestsInBlockValidated($block_ids: [ID]) {
            CheckAllTestsInBlockValidated(block_ids: $block_ids)
          }
        `,
        fetchPolicy: 'network-only',
        variables: { block_ids: payload },
      })
      .pipe(map((resp) => resp.data['CheckAllTestsInBlockValidated']));
  }

  getBlockNotHavePassFailCondition(rncp_title_id, class_id, block_ids): Observable<any> {
    return this.apollo
      .query({
        query: gql`
      query GetBlockNotHavePassFailCondition ($block_ids: [ID!]!){
        GetBlockNotHavePassFailCondition(rncp_title_id: "${rncp_title_id}", class_id: "${class_id}", block_ids: $block_ids) {
          _id
          block_of_competence_condition
        }
      }
      `,
        fetchPolicy: 'network-only',
        variables: {
          block_ids,
        },
      })
      .pipe(map((resp) => resp.data['GetBlockNotHavePassFailCondition']));
  }

  checkAllTestsInBlockValidatedUpdated(payload): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query CheckAllTestsInBlockValidatedUpdated($block_ids: [ID]) {
            CheckAllTestsInBlockValidatedUpdated(block_ids: $block_ids) {
              block_id {
                _id
                block_of_competence_condition
              }
              test_id {
                _id
                name
              }
              evaluation_id {
                _id
                evaluation
              }
            }
          }
        `,
        fetchPolicy: 'network-only',
        variables: { block_ids: payload },
      })
      .pipe(map((resp) => resp.data['CheckAllTestsInBlockValidatedUpdated']));
  }

  checkTranscriptProcessAlreadyCreated(rncp_title_id, class_id): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query CheckTranscriptProcessAlreadyCreated($rncp_title_id: ID, $class_id: ID) {
            CheckTranscriptProcessAlreadyCreated(rncp_title_id: $rncp_title_id, class_id: $class_id)
          }
        `,
        fetchPolicy: 'network-only',
        variables: { rncp_title_id, class_id },
      })
      .pipe(map((resp) => resp.data['CheckTranscriptProcessAlreadyCreated']));
  }

  checkUniqueNameForTranscript(payload): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query CheckUniqueNameForTranscript($transcript_process_input: TranscriptProcessInput) {
            CheckUniqueNameForTranscript(transcript_process_input: $transcript_process_input)
          }
        `,
        fetchPolicy: 'network-only',
        variables: {
          transcript_process_input: payload,
        },
      })
      .pipe(map((resp) => resp.data['CheckUniqueNameForTranscript']));
  }

  checkStudentAlreadyHaveSubmissionDecision(payload, lang, file: File, is_for_eval_comp): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CheckStudentAlreadyHaveSubmissionDecision(
            $import_scholar_board_submission_input: ImportScolarBoardSubmissionIinput!
            $lang: String
            $file: Upload!
            $is_for_eval_comp: Boolean
          ) {
            CheckStudentAlreadyHaveSubmissionDecision(
              import_scholar_board_submission_input: $import_scholar_board_submission_input
              lang: $lang
              file: $file
              is_for_eval_comp: $is_for_eval_comp
            ) {
              _id
            }
          }
        `,
        variables: {
          import_scholar_board_submission_input: payload,
          file: file,
          lang,
          is_for_eval_comp,
        },
        context: {
          useMultipart: true,
        },
      })
      .pipe(map((resp) => resp.data['CheckStudentAlreadyHaveSubmissionDecision']));
  }

  importScholarBoardDecision(payload, lang, file: File): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ImportScholarBoardSubmissionCSV(
            $import_scholar_board_submission_input: ImportScolarBoardSubmissionIinput!
            $lang: String
            $file: Upload!
          ) {
            ImportScholarBoardSubmissionCSV(
              import_scholar_board_submission_input: $import_scholar_board_submission_input
              lang: $lang
              file: $file
            ) {
              _id
              decision_school_board
            }
          }
        `,
        variables: {
          import_scholar_board_submission_input: payload,
          file: file,
          lang,
        },
        context: {
          useMultipart: true,
        },
      })
      .pipe(map((resp) => resp.data['ImportScholarBoardSubmissionCSV']));
  }

  importScholarBoardSubmissionCSVForEvalByExpertise(import_scholar_board_submission_input, lang, file: File): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ImportScholarBoardSubmissionCSVForEvalByExpertise(
            $import_scholar_board_submission_input: ImportScolarBoardSubmissionIinput!
            $lang: String
            $file: Upload!
          ) {
            ImportScholarBoardSubmissionCSVForEvalByExpertise(
              import_scholar_board_submission_input: $import_scholar_board_submission_input
              lang: $lang
              file: $file
            ) {
              _id
              decision_school_board
            }
          }
        `,
        variables: {
          import_scholar_board_submission_input,
          file: file,
          lang,
        },
        context: {
          useMultipart: true,
        },
      })
      .pipe(map((resp) => resp.data['ImportScholarBoardSubmissionCSVForEvalByExpertise']));
  }

  getAllDateOfIssuanceDropdown(title_id: string, class_id: string, selecttion_type: string): Observable<any>{
    return this.apollo.query({
      query: gql`
      query GetAllDateOfIssuanceDropdown($rncpId: ID, $classId: ID, $selectionType: String) {
        GetAllDateOfIssuanceDropdown(rncp_id: $rncpId, class_id: $classId, selection_type: $selectionType)
      }`,
      variables: {
        rncpId: title_id,
        classId: class_id,
        selectionType: selecttion_type,
      },
      fetchPolicy: 'network-only'
    }).pipe(map((resp) => resp.data['GetAllDateOfIssuanceDropdown']));
  }
}
