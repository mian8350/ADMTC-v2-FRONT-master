import { Injectable } from '@angular/core';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AcademicJourneyService {
  constructor(private apollo: Apollo, private translate: TranslateService, private httpClient: HttpClient) {}
  getMonths() {
    return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  }
  // getScore() {
  //   let score = [];
  //   for (let i = 1; i < 11; i++) {
  //     score.push(i);
  //   }
  //   return score;
  // }

  getYears() {
    let now = new Date().getFullYear();
    let min = now - 20;
    let max = now + 2;
    const years = [];
    for (let i = min; i <= max; i++) {
      years.push(i.toString());
    }
    return years;
  }

  addAcademicJourney(_id, data) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateStudentInAcademicJourney($id: ID!, $lang: String!, $student_input: StudentInput) {
            UpdateStudent(_id: $id, lang: $lang, student_input: $student_input) {
              _id
              last_name
              first_name
              date_of_birth
              nationality
              place_of_birth
              professional_email
              photo
              is_photo_in_s3
              photo_s3_path
              description
              identification_type
              identification_number
              student_address {
                address
                city
                country
                department
                is_main_address
                postal_code
                region
              }
            }
          }
        `,
        variables: {
          lang: this.translate.currentLang,
          id: '5aa91e19155c845d8f80ddb6',
          student_input: data,
        },
      })
      .pipe(
        map((resp) => {
          return resp.data['UpdateStudent'];
        }),
      );
  }

  // Get single user type
  GetOneUser(ID: String): Observable<any> {
    return this.apollo
      .query({
        query: gql`
          query{
              GetOneUser(_id:"${ID}"){
                  _id
                  student_id{
                      _id
                  }
                  email
              }
              }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneUser']));
  }

  GetOneStudentdetails(_idStudent: any) {
    return this.apollo
      .query({
        query: gql`
          query{
              GetOneStudent(_id:"${_idStudent}")
              {
                  _id
                  last_name
                  civility
                  first_name
                  date_of_birth
                  nationality
                  tele_phone
                  place_of_birth
                  professional_email
                  photo
                  is_photo_in_s3
                  photo_s3_path
                  description
                  identification_type
                  identification_number
                  student_address {
                      address
                      city
                      country
                      department
                      is_main_address
                      postal_code
                      region
                  }
                  academic_journey_id {
                    diplomas {
                      institute_name
                      graduation_date{
                          month
                          year
                      }
                      qualification
                      location
                      field_of_study
                      major
                      grade
                      score
                      out_of_score
                      additional_information
                      diploma_upload_date
                      diploma_photo
                    }
                    experiences {
                      description
                      position_name
                      position_level
                      company_name
                      location
                      join_duration_from {
                          month
                          year
                      }
                      join_duration_to {
                          month
                          year
                      }
                      present
                      role
                      country
                      industry
                      monthly_salary
                      monthly_salary_currency
                      specialization_name
                    }
                    skills {
                      skill
                      level
                    }
                    languages {
                        language
                        spoken
                        written
                        primary
                    }
                    interests
                  }
                }
              }
      `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }

  // Get Student Id
  GetStudentId(userID: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query GetStudentId {
          GetOneUser(_id:"${userID}"){
            student_id{
                _id
            }
          }
        }
    `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneUser']));
  }

  // Get Student Data to populate my profile the first time
  GetStudentDataProfileFirstTime(studentID: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query GetStudentDataToPopulateProfile {
          GetOneStudent(_id:"${studentID}"){
            first_name
            last_name
            age
            email
            photo
            civility
            tele_phone
            date_of_birth
            place_of_birth
            nationality
            identification_type
            identification_number
            student_address{
              address
              postal_code
              city
              region
              department
              country
              is_main_address
            }
          }
        }
    `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }

  getMySummary(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query GetMyProfile {
          GetOneAcademicJourney(student_id:"${studentId}"){
            _id
            student_id {
              _id
            }
            general_presentation {
              first_name
              last_name
              age
              email
              description
              photo
              civility
              tele_phone
              date_of_birth
              place_of_birth
              nationality
              identification_type
              identification_number
              address {
                address
                postal_code
                city
                region
                department
                country
                is_main_address
              }
            }
            diplomas {
              institute_name
              graduation_date {
                date
                time
              }
              diploma_name
              city
              country
              qualification
              location
              field_of_study
              major
              grade
              score
              out_of_score
              additional_information
              diploma_upload_date
              diploma_photo
            }
            experiences {
              description
              position_name
              position_level
              company_name
              location
              join_duration_from {
                month
                year
              }
              join_duration_to {
                month
                year
              }
              present
              role
              country
              monthly_salary
              industry
              monthly_salary_currency
              specialization_name
            }
            skills {
              skill
              level
            }
            languages {
              language
              spoken
              written
              primary
            }
            interests {
              text
            }
          }
        }
    `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneAcademicJourney']));
  }

  checkHasAcadJourney(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query checkHasAcadJourney {
          GetOneAcademicJourney(student_id:"${studentId}"){
            _id
          }
        }
    `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneAcademicJourney']));
  }

  getMyProfile(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query GetMyProfile {
          GetOneAcademicJourney(student_id:"${studentId}"){
            _id
            student_id {
              _id
            }
            general_presentation {
              first_name
              last_name
              age
              email
              description
              photo
              civility
              tele_phone
              date_of_birth
              place_of_birth
              nationality
              identification_type
              identification_number
              address {
                address
                postal_code
                city
                region
                department
                country
                is_main_address
              }
            }
          }
        }
    `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneAcademicJourney']));
  }

  getMyDiplomas(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query GetMyDiplomas {
          GetOneAcademicJourney(student_id:"${studentId}"){
            _id
            student_id {
              _id
              certification_process_status
              certificate_diploma_details {
                diploma_name
                graduation_date
                pc_long_name
                rncp_level
                pc_city
                pc_country
                additional_info
                certificate_s3_file_name
              }
            }
            diplomas {
              institute_name
              graduation_date {
                date
                time
              }
              diploma_name
              city
              country
              qualification
              location
              field_of_study
              major
              grade
              score
              out_of_score
              additional_information
              diploma_upload_date
              diploma_photo
            }
          }
        }
    `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneAcademicJourney']));
  }

  getMySkills(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query GetMySkills {
          GetOneAcademicJourney(student_id:"${studentId}"){
            _id
            student_id {
              _id
            }
            skills {
              skill
              level
            }
          }
        }
    `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneAcademicJourney']));
  }

  getMylanguages(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query GetMyLanguage {
          GetOneAcademicJourney(student_id:"${studentId}"){
            _id
            student_id {
              _id
            }
            languages {
              language
              spoken
              written
              primary
            }
          }
        }
    `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneAcademicJourney']));
  }

  getMyInterest(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query getMyInterest {
          GetOneAcademicJourney(student_id:"${studentId}"){
            _id
            student_id {
              _id
            }
            interests {
              text
            }
          }
        }
    `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneAcademicJourney']));
  }

  getMyExperience(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query getMyExperience {
          GetOneAcademicJourney(student_id:"${studentId}"){
            _id
            student_id {
              _id
            }
            experiences {
              description
              position_name
              position_level
              company_name
              location
              join_duration_from {
                month
                year
              }
              join_duration_to {
                month
                year
              }
              present
              role
              country
              monthly_salary
              industry
              monthly_salary_currency
              specialization_name
            }
          }
        }
    `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneAcademicJourney']));
  }

  createAcademicJourney(payload) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation CreateAcademicJourney($academic_journey_input: AcademicJourneyInput) {
            CreateAcademicJourney(academic_journey_input: $academic_journey_input) {
              _id
            }
          }
        `,
        variables: {
          academic_journey_input: payload,
        },
      })
      .pipe(map((resp) => resp.data['CreateAcademicJourney']));
  }

  updateAcademicJourney(_id, payload) {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation UpdateAcademicJourney($_id: ID!, $academic_journey_input: AcademicJourneyInput) {
            UpdateAcademicJourney(_id: $_id, academic_journey_input: $academic_journey_input) {
              _id
              general_presentation {
                photo
              }
            }
          }
        `,
        variables: {
          _id: _id,
          academic_journey_input: payload,
        },
      })
      .pipe(map((resp) => resp.data['UpdateAcademicJourney']));
  }
  getCurrency(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/currency.json');
  }

  getMyDerogation(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query getMyDerogation {
          GetOneAcademicJourney(student_id:"${studentId}"){
            _id
            derogations {
              file_name
              s3_file_name
            }
          }
        }
    `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneAcademicJourney']));
  }

  getMyExemptionDocuments(studentId: string): Observable<any> {
    return this.apollo
      .query({
        query: gql`
        query getMyExemptionDocuments {
          GetOneStudent(_id:"${studentId}"){
            _id
            exemption_block_justifications {
              s3_file_name
              document_name
            }
          }
        }
    `,
        fetchPolicy: 'network-only',
      })
      .pipe(map((resp) => resp.data['GetOneStudent']));
  }
}
