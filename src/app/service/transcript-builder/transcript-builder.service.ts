import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cacheable } from 'ngx-cacheable';
import { environment } from './../../../environments/environment';
import { Apollo } from 'apollo-angular';
import gql from 'graphql-tag';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TranscriptBuilderService {
  constructor(private httpClient: HttpClient, private apollo: Apollo) {}

  @Cacheable()
  getTranscriptData(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/transcript-builder.json');
  }

  generatePdf(html, filename, isLandscape?: boolean) {
    return this.httpClient.post(`${environment.PDF_SERVER_URL}admtc/generate-pdf/`, {
      html: html,
      autoMargin: true,
      landscape: isLandscape,
      filename: filename,
    });
  }

  generatePdfDynamic(html, filename, isLandscape?: boolean, autoMargin?: boolean) {
    return this.httpClient.post(`${environment.PDF_SERVER_URL}admtc/generate-pdf/`, {
      html: html,
      autoMargin: autoMargin,
      landscape: isLandscape,
      filename: filename,
    });
  }

  generateJobDescPDF(job_desc_id, student_id): Observable<any[]> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation GenerateJobDescPDF($job_desc_id: ID!, $student_id: ID!) {
            GenerateJobDescPDF(job_desc_id: $job_desc_id, student_id: $student_id)
          }
        `,
        variables: {
          job_desc_id,
          student_id,
        },
      })
      .pipe(map((resp) => resp.data['GenerateJobDescPDF']));
  }

  generateProblematicPDF(problematic_id, student_id): Observable<any[]> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation GenerateProblematicPDF($problematic_id: ID!, $student_id: ID!) {
            GenerateProblematicPDF(problematic_id: $problematic_id, student_id: $student_id)
          }
        `,
        variables: {
          problematic_id,
          student_id,
        },
      })
      .pipe(map((resp) => resp.data['GenerateProblematicPDF']));
  }
}
