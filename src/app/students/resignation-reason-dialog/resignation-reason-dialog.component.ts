import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface ParentData {
  date: string
  reason: string
}

@Component({
  selector: 'ms-resignation-reason-dialog',
  templateUrl: './resignation-reason-dialog.component.html',
  styleUrls: ['./resignation-reason-dialog.component.scss']
})
export class ResignationReasonDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<ResignationReasonDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: ParentData,
  ) { }

  ngOnInit() {
  }

  closeDialog() {
    this.dialogRef.close();
  }

}
