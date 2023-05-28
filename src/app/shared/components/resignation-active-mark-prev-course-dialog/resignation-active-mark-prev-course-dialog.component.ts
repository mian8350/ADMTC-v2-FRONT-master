import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'ms-resignation-active-mark-prev-course-dialog',
  templateUrl: './resignation-active-mark-prev-course-dialog.component.html',
  styleUrls: ['./resignation-active-mark-prev-course-dialog.component.scss']
})
export class ResignationActiveMarkPrevCourseDialogComponent implements OnInit {
  constructor(private dialogRef:MatDialogRef<ResignationActiveMarkPrevCourseDialogComponent>, @Inject(MAT_DIALOG_DATA) public studentData:any) { }

  ngOnInit(): void {
  }

  transferStudent() {
    const payload = {
      ...this.studentData, action: 'transfer', transfer_from: 'ResignationStud_S3'
    }
    this.dialogRef.close(payload);
  }

  closeDialog(){
    this.dialogRef.close()
  }

  suspendStudent() {
    const param = {
      ...this.studentData,
      action: 'suspend'
    }

    this.dialogRef.close(param)
  }

}
