import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { StudentsService } from 'app/service/students/students.service';
import Swal from 'sweetalert2';

interface ParentData {
  docId: string
  studentId: string
  testId: string
  correctionId: string
}

@Component({
  selector: 'ms-validate-student-doc-expected',
  templateUrl: './validate-student-doc-expected.component.html',
  styleUrls: ['./validate-student-doc-expected.component.scss']
})
export class ValidateStudentDocExpectedComponent implements OnInit {
  isWaitingForResponse = false;

  constructor(
    public dialogRef: MatDialogRef<ValidateStudentDocExpectedComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: ParentData,
    private studentService: StudentsService,
    private translate: TranslateService
  ) { }

  ngOnInit() {

  }

  closeDialog() {
    this.dialogRef.close();
  }

  validate() {
    this.isWaitingForResponse = true;
    this.studentService.validateOrRejectStudentDocumentExpected(
      this.parentData.docId,
      this.parentData.studentId,
      this.parentData.testId,
      this.parentData.correctionId,
      'validated',
      this.translate.currentLang
    ).subscribe(resp => {
      this.isWaitingForResponse = false;
      Swal.fire({
        type: 'success',
        title: this.translate.instant('SUCCESS'),
      })
      this.dialogRef.close(true);
    }, err => this.isWaitingForResponse = false)
  }

  reject() {
    this.isWaitingForResponse = true;
    this.studentService.validateOrRejectStudentDocumentExpected(
      this.parentData.docId,
      this.parentData.studentId,
      this.parentData.testId,
      this.parentData.correctionId,
      'rejected',
      this.translate.currentLang
    ).subscribe(resp => {
      this.isWaitingForResponse = false;
      Swal.fire({
        type: 'success',
        title: this.translate.instant('SUCCESS'),
      })
      this.dialogRef.close(true);
    }, err => this.isWaitingForResponse = false)
  }
}
