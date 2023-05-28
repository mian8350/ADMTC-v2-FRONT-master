import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'ms-reason-of-deactivation-dialog',
  templateUrl: './reason-of-deactivation-dialog.component.html',
  styleUrls: ['./reason-of-deactivation-dialog.component.scss']
})
export class ReasonOfDeactivationDialogComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<ReasonOfDeactivationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  ngOnInit(): void {
  }

  closeDialog() {
    this.dialogRef.close();
  }

}
