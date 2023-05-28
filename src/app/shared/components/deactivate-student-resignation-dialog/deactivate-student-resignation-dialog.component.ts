import { SubSink } from 'subsink';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { FormControl, UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';
import { StudentsService } from 'app/service/students/students.service';

@Component({
  selector: 'ms-deactivate-student-resignation-dialog',
  templateUrl: './deactivate-student-resignation-dialog.component.html',
  styleUrls: ['./deactivate-student-resignation-dialog.component.scss']
})
export class DeactivateStudentResignationDialogComponent implements OnInit {
  private subs = new SubSink();
  isWaitingForResponse = false;

  reasonDeactive = new UntypedFormControl(null, Validators.required);

  constructor(
    private dialogref: MatDialogRef<DeactivateStudentResignationDialogComponent>, 
    @Inject(MAT_DIALOG_DATA) public deactivateData:any,
    private studentService: StudentsService,
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
  }

  deactivateStudent(){
    this.isWaitingForResponse = true;
    const payload = {
      student_id : this.deactivateData?.student_id,
      reason_for_resignation: this.reasonDeactive?.value,
      date_of_resignation: this.deactivateData?.date_of_resignation,
      student_deactivated_tests_keep: this.deactivateData?.student_deactivated_tests_keep
    }
    this.subs.sink = this.studentService.deactiveStudentResignation(payload).subscribe(
      (resp)=>{
        this.isWaitingForResponse = false;
        if (resp) {
          Swal.fire({
            title: this.translate.instant('DEACTIVATEDSUCCESS.TITLE'),
            html: this.translate.instant('DEACTIVATEDSUCCESS.TEXT', {
              LName: resp.last_name,
              FName: resp.first_name,
            }),
            footer: `<span style="margin-left: auto">DEACTIVATEDSUCCESS</span>`,
            allowEscapeKey: true,
            type: 'success',
            confirmButtonText: this.translate.instant('DEACTIVATEDSUCCESS.OK'),
          })
          .then((result) => {
            if (result.value) {
              this.dialogref.close(true);
            }
          });
        }
      },
      (err) => {
        Swal.fire({
          type: 'error',
          title: 'Error !',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: this.translate.instant('DISCONNECT_SCHOOL.BUTTON3'),
        }).then((res) => {
          console.log('[BE Message] Error is : ', err);
        });
      }
    )
  }

  closeDialog(){
    this.dialogref.close(false);
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }
}
