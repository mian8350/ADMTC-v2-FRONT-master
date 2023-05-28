import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

interface ParentData {
  date: string
  reason: string
}

@Component({
  selector: 'ms-deactivation-reason-dialog',
  templateUrl: './deactivation-reason-dialog.component.html',
  styleUrls: ['./deactivation-reason-dialog.component.scss']
})
export class DeactivationReasonDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DeactivationReasonDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public parentData: ParentData,
  ) { }

  ngOnInit() {
  }

  closeDialog() {
    this.dialogRef.close();
  }


}
