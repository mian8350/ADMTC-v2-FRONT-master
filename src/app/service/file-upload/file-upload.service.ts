import { Injectable } from '@angular/core';
import { map } from 'rxjs/operators';
import gql from 'graphql-tag';
import { Apollo } from 'apollo-angular';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FileUploadService {
  constructor(private apollo: Apollo) {}

  singleUpload(
    file: File,
    custom_file_name?: string,
  ): Observable<{ s3_file_name: string; file_url: string; file_name: string; _id: string }> {
    return this.apollo
      .mutate({
        mutation: gql`
          mutation ($file: Upload!, $custom_file_name: String) {
            SingleUpload(file: $file, custom_file_name: $custom_file_name) {
              s3_file_name
              file_url
              file_name
              mime_type
            }
          }
        `,
        variables: {
          file: file,
          custom_file_name,
        },
        context: {
          useMultipart: true,
        },
      })
      .pipe(map((resp) => resp.data['SingleUpload']));
  }

  deleteFileUpload(file_name: string) {
    return this.apollo.mutate({
      mutation: gql`
        mutation {
          DeleteFileUpload(file_name:"${file_name}")
        }
      `,
    });
  }
}
