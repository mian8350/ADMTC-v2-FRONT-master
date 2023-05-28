import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Cacheable } from 'ngx-cacheable';

@Injectable({
  providedIn: 'root'
})
export class StudentDetailService {

  constructor(private httpClient: HttpClient) {}

  @Cacheable()
  getDocuments(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/student-documents.json');
  }

  @Cacheable()
  getSubjects(): Observable<any[]> {
    return this.httpClient.get<any[]>('assets/data/student-subject-certification.json');
  }
}
