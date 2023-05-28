import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { Cacheable } from 'ngx-cacheable';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';

@Injectable({
  providedIn: 'root',
})
export class CertidegreeService {
  private statusCertiDegree = new BehaviorSubject<any>(null);
  private currentTabDetail = new BehaviorSubject<any>(null);
  private templateData = new BehaviorSubject<any>(null);
  private studentIssuingData = new BehaviorSubject<any>(null);

  private _currentCertificateProcessData: any;
  private _childrenFormValidationStatus: boolean = true;

  getStatusCertiDegreet$ = this.statusCertiDegree.asObservable();
  getCurrentTabDetail$ = this.currentTabDetail.asObservable();
  getTemplateData$ = this.templateData.asObservable();
  getStudentIssuingData$ = this.studentIssuingData.asObservable();

  setStudentIssuingData(data: any) {
    this.studentIssuingData.next(data);
  }

  setTemplateData(data: any) {
    this.templateData.next(data);
  }

  setStatusCertiDegree(data: any) {
    this.statusCertiDegree.next(data);
  }

  setCurrentTabDetail(data: any) {
    this.currentTabDetail.next(data);
  }

  public get processData() {
    return this._currentCertificateProcessData;
  }

  public set processData(data: any) {
    this._currentCertificateProcessData = data;
  }

  public get childrenFormValidationStatus() {
    return this._childrenFormValidationStatus;
  }

  public set childrenFormValidationStatus(state: boolean) {
    this._childrenFormValidationStatus = state;
  }

  constructor(private httpClient: HttpClient, private apollo: Apollo, private translate: TranslateService) {}

  // =============================================================================================================
  // QUERIES
  // =============================================================================================================

  getAllPDFTemplates(certifier_school_id?: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            GetAllPDFTemplates(pdf_type: "certificate") {
              _id
              pdf_type
              pdf_name
              status
              pdf_gen_for
              htmls {
                page_name
              }
              certifier_school_id {
                _id
                short_name
              }
              s3_template
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllPDFTemplates']));
  }

  checkCertificateIssuanceTemplateForCertifier(rncp_title_id?: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query {
            CheckCertificateIssuanceTemplateForCertifier(rncp_title_id: "${rncp_title_id}") {
              toShowUploadField
              pdf_template_id
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['CheckCertificateIssuanceTemplateForCertifier']));
  }

  checkCertificateGeneratedForStudents(_id, student_ids): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query CheckCertificateGeneratedForStudents($student_ids: [ID]) {
            CheckCertificateGeneratedForStudents(_id: "${_id}", student_ids: $student_ids)
          }
        `,
        variables: {
          student_ids: student_ids,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['CheckCertificateGeneratedForStudents']));
  }

  getOneCertificateIssuanceProcess(_id: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneCertificateIssuanceProcess(_id: "${_id}") {
            _id
            current_tab
            rncp_id {
              _id
              short_name
            }
            class_id {
              _id
              name
            }
            certifier_school_id {
              _id
              short_name
            }
            transcript_process_id {
              _id
              name
            }
            certificate_process_status
            certificate_type {
              parchemin {
                for_pass_student
                for_retake_student
                for_fail_student
              }
              supplement_certificate {
                is_enabled
                for_pass_student
                for_retake_student
                for_fail_student
              }
              block_certificate {
                is_enabled
                for_pass_student
                for_retake_student
                for_fail_student
              }
            }
            date_of_certificate_issuance
            certificate_template_selected_id
            certifier_signature {
              _id
              s3_file_name
            }
            certifier_stamp {
              _id
              s3_file_name
            }
            parchemin_certificate_background {
              _id
              s3_file_name
            }
            certificate_preview
            is_published
            is_pdf_generated_for_all_student
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneCertificateIssuanceProcess']));
  }

  getOneCertificateIssuanceProcessClassId(_id: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query {
          GetOneCertificateIssuanceProcess(_id: "${_id}") {
            rncp_id {
              _id
              short_name
            }
            class_id {
              _id
              name
            }
          }
        }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneCertificateIssuanceProcess']));
  }

  GetAllCertificateIssuanceProcess(pagination?: any, filter?: any, sorting?: any) {

    return this.apollo
      .query({
        query: gql`
          query GetAllCertificateIssuanceProcess(
            $pagination: PaginationInput
            $filter: FilterForCertificateIssuanceProcess
            $sorting: SortingForCertificateIssuanceProcess
          ) {
            GetAllCertificateIssuanceProcess(pagination: $pagination, filter: $filter, sorting: $sorting) {
              _id
              rncp_id {
                _id
                short_name
              }
              class_id {
                _id
                name
              }
              certifier_school_id {
                _id
                short_name
              }
              transcript_process_id {
                _id
                name
              }
              status
              certificate_process_status
              count_document
              current_tab
            }
          }
        `,
        variables: {
          pagination: pagination ? pagination : null,
          filter: filter ? filter : null,
          sorting: sorting ? sorting : null,
        },
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetAllCertificateIssuanceProcess']));
  }

  getCertificateGenerateStatus(_id: string) {
    return this.apollo
      .query({
        query: gql`
      query {
        CheckIfCertificateIsGeneratedForAllStudents(_id: "${_id}")
      }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['CheckIfCertificateIsGeneratedForAllStudents']));
  }

  getCertificateIssuanceProcessDropdown() {
    return this.apollo
      .query({
        query: gql`
          query {
            GetCertificateIssuanceProcessDropdown {
              rncp_titles {
                _id
                short_name
                certifier {
                  _id
                  short_name
                }
                classes {
                  _id
                  name
                }
              }
              classes {
                _id
                name
              }
              certifier_schools {
                _id
                short_name
              }
              transcript_processes {
                _id
                name
              }
              certificate_process_status
            }
          }
        `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetCertificateIssuanceProcessDropdown']));
  }

  getAllSchoolsCertidegree(certificate_issuance_id): Observable<any[]> {
    return this.apollo
      .watchQuery<any[]>({
        query: gql`
          query GetAllCertificateIssuanceProcessSchools($certificate_issuance_id: ID!) {
            GetAllCertificateIssuanceProcessSchools(certificate_issuance_id: $certificate_issuance_id) {
              _id
              school_id {
                _id
                short_name
              }
              school_issuance_date
              school_issuance_date_retake
              count_document
            }
          }
        `,
        variables: {
          certificate_issuance_id: certificate_issuance_id,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['GetAllCertificateIssuanceProcessSchools']));
  }

  checkStudentsReadyToPublishCertificate(id, student_ids): Observable<any[]> {
    return this.apollo
      .watchQuery<any[]>({
        query: gql`
          query CheckStudentsReadyToPublishCertificate($_id: ID!, $student_ids: [ID]) {
            CheckStudentsReadyToPublishCertificate(_id: $_id, student_ids: $student_ids, status: active_completed_suspended)
          }
        `,
        variables: {
          _id: id,
          student_ids: student_ids,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['CheckStudentsReadyToPublishCertificate']));
  }

  checkStudentsReadyToPublishCertificateAllStudent(id, filter): Observable<any[]> {
    return this.apollo
      .watchQuery<any[]>({
        query: gql`
          query CheckStudentsReadyToPublishCertificate($_id: ID!, $filter: FilterStudent) {
            CheckStudentsReadyToPublishCertificate(_id: $_id, filter: $filter, status: active_completed_suspended)
          }
        `,
        variables: {
          _id: id,
          filter: filter,
        },
        fetchPolicy: 'network-only',
      })
      .valueChanges.pipe(map((resp) => resp.data['CheckStudentsReadyToPublishCertificate']));
  }

  // =============================================================================================================
  // MUTATIONS
  // =============================================================================================================

  updateCertificatePdfForStudent(certificate_issuance_id: string, rncp_id: string, student_id: string, date_issuance_for_student: string) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateCertificatePdfForStudent($certificate_issuance_id: ID!, $rncp_id: ID!, $student_id: ID!, $date_issuance_for_student: String) {
            UpdateCertificatePdfForStudent(
              certificate_issuance_id: $certificate_issuance_id
              student_id: $student_id
              rncp_id: $rncp_id
              date_issuance_for_student: $date_issuance_for_student
            )
          }
        `,
        variables: {
          certificate_issuance_id,
          rncp_id,
          student_id,
          date_issuance_for_student,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['UpdateCertificatePdfForStudent']));
  }
  
  generateParcheminCertificatePreview(certificate_issuance_id: any, rncp_id: any, class_id: any, is_preview: boolean): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation GenerateParcheminCertificate($certificate_issuance_id: ID!, $rncp_id: ID!, $class_id: ID!, $is_preview: Boolean) {
            GenerateParcheminCertificate(
              certificate_issuance_id: $certificate_issuance_id
              is_preview: $is_preview
              rncp_id: $rncp_id
              class_id: $class_id
            )
          }
        `,
        variables: {
          certificate_issuance_id: certificate_issuance_id,
          rncp_id: rncp_id,
          class_id: class_id,
          is_preview: is_preview,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['GenerateParcheminCertificate']));
  }

  downloadCertificatePdf(
    certificate_issuance_id: any,
    rncp_title_id: any,
    class_id: string,
    is_download_multiple: boolean,
    status: string,
    student_ids?: any,
    filter?: any,
  ): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation DownloadCertificatePdf(
            $certificate_issuance_id: ID!
            $rncp_title_id: ID!
            $current_class: ID!
            $student_ids: [ID]
            $is_download_multiple: Boolean
            $status: EnumFilterStatus
            $filter: FilterStudent
          ) {
            DownloadCertificatePdf(
              certificate_issuance_id: $certificate_issuance_id
              rncp_title_id: $rncp_title_id
              current_class: $current_class
              student_ids: $student_ids
              is_download_multiple: $is_download_multiple
              status: $status
              filter: $filter
            )
          }
        `,
        variables: {
          certificate_issuance_id: certificate_issuance_id,
          rncp_title_id: rncp_title_id,
          current_class: class_id,
          student_ids: student_ids ? student_ids : null,
          is_download_multiple,
          status,
          filter: filter ? filter : null,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['DownloadCertificatePdf']));
  }

  downloadCertificatePdfSingle(certificate_issuance_id, rncp_title_id, student_id): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation DownloadCertificatePdfSingleStudent($certificate_issuance_id: ID!, $rncp_title_id: ID!, $student_id: ID!) {
            DownloadCertificatePdfSingleStudent(
              certificate_issuance_id: $certificate_issuance_id
              rncp_title_id: $rncp_title_id
              student_id: $student_id
            )
          }
        `,
        variables: {
          certificate_issuance_id: certificate_issuance_id,
          rncp_title_id: rncp_title_id,
          student_id: student_id,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['DownloadCertificatePdfSingleStudent']));
  }

  createCertificateIssuanceProcess(payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateCertificateIssuanceProcess($cert_issuance_process_input: CertificateIssuanceProcessInput) {
            CreateCertificateIssuanceProcess(cert_issuance_process_input: $cert_issuance_process_input) {
              _id
            }
          }
        `,
        variables: {
          cert_issuance_process_input: payload,
        },
      })
      .pipe(map((resp) => resp));
  }

  updateCertificateIssuanceProcess(id: string, payload: any): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateCertificateIssuanceProcess($_id: ID!, $cert_issuance_process_input: CertificateIssuanceProcessInput) {
            UpdateCertificateIssuanceProcess(_id: $_id, cert_issuance_process_input: $cert_issuance_process_input) {
              _id
            }
          }
        `,
        variables: {
          _id: id,
          cert_issuance_process_input: payload,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp));
  }

  deleteCertificateIssuanceProcess(id: string): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation DeleteCertificateIssuanceProcess($_id: ID!) {
            DeleteCertificateIssuanceProcess(_id: $_id) {
              _id
            }
          }
        `,
        variables: {
          _id: id,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp));
  }

  publishCertificatePdf(certificate_issuance_id: any, student_ids: any) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation PublishCertificateStudents($certificate_issuance_id: ID!, $student_ids: [ID]) {
            PublishCertificateStudents(
              certificate_issuance_id: $certificate_issuance_id
              student_ids: $student_ids
              status: active_completed_suspended
            )
          }
        `,
        variables: {
          certificate_issuance_id: certificate_issuance_id,
          student_ids: student_ids,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['PublishCertificateStudents']));
  }

  publishCertificatePdfAll(certificate_issuance_id: any, filter: any) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation PublishCertificateStudents($certificate_issuance_id: ID!, $filter: FilterStudent) {
            PublishCertificateStudents(
              certificate_issuance_id: $certificate_issuance_id
              filter: $filter
              status: active_completed_suspended
            )
          }
        `,
        variables: {
          certificate_issuance_id: certificate_issuance_id,
          filter: filter,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['PublishCertificateStudents']));
  }

  updateCertificateIssuanceProcessSchool(certificate_issuance_id, school_id, cert_issuance_process_school_input): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateCertificateIssuanceProcessSchool(
            $certificate_issuance_id: ID!
            $certificate_issuance_school_id: ID!
            $cert_issuance_process_school_input: CertificateIssuanceProcessSchoolInput
          ) {
            UpdateCertificateIssuanceProcessSchool(
              certificate_issuance_id: $certificate_issuance_id
              certificate_issuance_school_id: $certificate_issuance_school_id
              cert_issuance_process_school_input: $cert_issuance_process_school_input
            ) {
              _id
              school_id {
                _id
                short_name
              }
            }
          }
        `,
        variables: {
          certificate_issuance_id: certificate_issuance_id,
          certificate_issuance_school_id: school_id,
          cert_issuance_process_school_input: cert_issuance_process_school_input,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['UpdateCertificateIssuanceProcessSchool']));
  }

  updateCertificateIssuanceProcessSchools(certificate_issuance_id, school_issuance_date, school_issuance_date_retake): Observable<any> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateCertificateIssuanceProcessSchools(
            $certificate_issuance_id: ID!
            $school_issuance_date: String
            $school_issuance_date_retake: String
          ) {
            UpdateCertificateIssuanceProcessSchools(
              certificate_issuance_id: $certificate_issuance_id
              school_issuance_date: $school_issuance_date
              school_issuance_date_retake: $school_issuance_date_retake
            ) {
              schools {
                _id
                school_id {
                  _id
                  short_name
                }
                school_issuance_date
                school_issuance_date_retake
              }
            }
          }
        `,
        variables: {
          certificate_issuance_id: certificate_issuance_id,
          school_issuance_date: school_issuance_date,
          school_issuance_date_retake: school_issuance_date_retake,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['UpdateCertificateIssuanceProcessSchools']));
  }

  publishCertificateSingleStudent(certificate_issuance_id: any, student_id: any) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation PublishCertificateSingleStudent($certificate_issuance_id: ID!, $student_id: ID!) {
            PublishCertificateSingleStudent(certificate_issuance_id: $certificate_issuance_id, student_id: $student_id)
          }
        `,
        variables: {
          certificate_issuance_id: certificate_issuance_id,
          student_id: student_id,
        },
        errorPolicy: 'all',
      })
      .pipe(map((resp) => resp.data['PublishCertificateSingleStudent']));
  }

  // =============================================================================================================
  // OTHERS
  // =============================================================================================================

  @Cacheable()
  getAlert(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/alert-functionality.json');
  }

  @Cacheable()
  getDropdownTemplate(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/certidegree.json');
  }

  generateParcheminCertificate(certificate_issuance_id, rncp_id, class_id){
    return this.apollo
      .mutate({
        mutation: gql`
          mutation GenerateParcheminCertificate($certificate_issuance_id: ID!, $rncp_id: ID!, $class_id: ID!){
            GenerateParcheminCertificate(certificate_issuance_id: $certificate_issuance_id, rncp_id: $rncp_id, class_id: $class_id)
          }
        `,
        variables: {
          certificate_issuance_id: certificate_issuance_id,
          rncp_id: rncp_id,
          class_id: class_id
        },
        errorPolicy: 'all'
      })
      .pipe(map((resp) => resp.data['GenerateParcheminCertificate']));
  }
}
