import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UntypedFormControl } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';


@Component({
  selector: 'ms-close-company-contract-dialog',
  templateUrl: './close-company-contract-dialog.component.html',
  styleUrls: ['./close-company-contract-dialog.component.scss']
})
export class CloseCompanyContractDialogComponent implements OnInit {
  resignationDate = new UntypedFormControl('');
  reason = new UntypedFormControl('');

  constructor(
    public dialogRef: MatDialogRef<CloseCompanyContractDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    public translate: TranslateService,
  ) { }

  ngOnInit(): void {
  }

  submit() {
    const data = {
      resignationDate: this.resignationDate.value,
      resignationReason: this.reason.value
    };
    this.dialogRef.close(data)
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
