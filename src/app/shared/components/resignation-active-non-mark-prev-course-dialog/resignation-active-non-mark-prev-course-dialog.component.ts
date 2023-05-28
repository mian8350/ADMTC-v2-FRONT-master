import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { StudentsService } from 'app/service/students/students.service';
import { SubSink } from 'subsink';
import * as moment from 'moment';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-resignation-active-non-mark-prev-course-dialog',
  templateUrl: './resignation-active-non-mark-prev-course-dialog.component.html',
  styleUrls: ['./resignation-active-non-mark-prev-course-dialog.component.scss']
})
export class ResignationActiveNonMarkPrevCourseDialogComponent implements OnInit {

  constructor(
    private dialog: MatDialogRef<ResignationActiveNonMarkPrevCourseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public studentData: any)
  {}

  ngOnInit(): void {
    
  }

  closeDialog() {
     this.dialog.close()
  }

  transferStudent() {
    const param = {
      ...this.studentData, action: 'transfer'
    }
    this.dialog.close(param)
  }

  deactivateStudent() { 
    const payload = {
      student_id : this.studentData._id,
      reason_for_resignation: null,
      date_of_resignation: this.getTodayDate(),
      student_deactivated_tests_keep: null,
      action: 'deactivate'
    }

    this.dialog.close(payload);
  }

  getTodayDate() {
    return moment().format('DD/MM/YYYY');
  }
}
