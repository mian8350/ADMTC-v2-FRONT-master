import { Component, OnInit } from '@angular/core';
import { SubSink } from 'subsink';
import { StudentDetailService } from 'app/service/student-detail-service/student-detail.service';
import * as _ from 'lodash';

@Component({
  selector: 'ms-student-documents',
  templateUrl: './student-documents.component.html',
  styleUrls: ['./student-documents.component.scss'],
})
export class StudentDocumentsComponent implements OnInit {
  private subs = new SubSink();
  documentsList = [];

  constructor(private studentDetailService: StudentDetailService) {}

  ngOnInit() {
    this.subs.sink = this.studentDetailService.getDocuments().subscribe((documentList: any[]) => {
      this.documentsList = documentList;
    });
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }
}
