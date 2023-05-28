import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { StudentsService } from 'app/service/students/students.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-validate-student-cv-presentation',
  templateUrl: './validate-student-cv-presentation.component.html',
  styleUrls: ['./validate-student-cv-presentation.component.scss'],
})
export class ValidateStudentCvPresentationComponent implements OnInit {
  private subs = new SubSink();

  isWaitingForResponse = false;

  constructor(
    public dialogRef: MatDialogRef<ValidateStudentCvPresentationComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: any,
    private studentService: StudentsService,
    private translate: TranslateService,
  ) {}

  ngOnInit() {

  }

  closeDialog() {
    this.dialogRef.close();
  }

  validateRejectCvPresentation(validationStatus: string) {
    this.subs.sink = this.studentService
      .validateOrRejectStudentCvPresentation(this.parentData.document._id, validationStatus, this.translate.currentLang)
      .subscribe((resp) => {

        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'success',
          title: this.translate.instant('SUCCESS'),
        });
        this.dialogRef.close(true);
      }, (err) => {
        this.isWaitingForResponse = false;
      });
  }
}
