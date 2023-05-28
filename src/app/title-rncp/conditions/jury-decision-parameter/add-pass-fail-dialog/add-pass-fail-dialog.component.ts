import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ConditionsService } from 'app/service/conditions/conditions.service';

@Component({
  selector: 'ms-add-pass-fail-dialog',
  templateUrl: './add-pass-fail-dialog.component.html',
  styleUrls: ['./add-pass-fail-dialog.component.scss']
})
export class AddPassFailDialogComponent implements OnInit {

  passFailConditions: { value: string; label: string }[];

  condition: string;
  conditionName: string;

  constructor(
    public dialogRef: MatDialogRef<AddPassFailDialogComponent>,
    private conditionService: ConditionsService
  ) { }

  ngOnInit() {
    this.passFailConditions = this.conditionService.getConditionTypes();
  }

  closeDialog() {
    this.dialogRef.close();
  }

  getConditionData() {
    return {
      condition: this.condition,
      name: this.conditionName
    }
  }

}
