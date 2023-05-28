import { Component, OnInit } from '@angular/core';
import { SubSink } from 'subsink';
import { StudentDetailService } from 'app/service/student-detail-service/student-detail.service';
import * as _ from 'lodash';

@Component({
  selector: 'ms-student-subject-certification',
  templateUrl: './student-subject-certification.component.html',
  styleUrls: ['./student-subject-certification.component.scss']
})
export class StudentSubjectCertificationComponent implements OnInit {
  private subs = new SubSink();
  subjectsList = [];

  constructor(private studentDetailService: StudentDetailService) { }

  ngOnInit() {
    this.subs.sink = this.studentDetailService.getSubjects().subscribe((subjectList: any[]) => {
      this.subjectsList = subjectList;
    })
  }

  ngOnDestroy() {
    this.subs.unsubscribe();
  }

}
