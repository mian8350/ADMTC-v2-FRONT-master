import { Component, Inject, OnInit } from '@angular/core';
import { UntypedFormControl, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { TranslateService } from '@ngx-translate/core';
import { CertidegreeService } from 'app/service/certidegree/certidegree.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-student-certification-date-dialog',
  templateUrl: './student-certification-date-dialog.component.html',
  styleUrls: ['./student-certification-date-dialog.component.scss'],
})
export class StudentCertificationDateDialogComponent implements OnInit {
  certificationDate = new UntypedFormControl(null, Validators.required);
  subs = new SubSink();

  constructor(
    @Inject(MAT_DIALOG_DATA) public parentData: any,
    private translate: TranslateService,
    public dialogRef: MatDialogRef<StudentCertificationDateDialogComponent>,
    private certidegreeService: CertidegreeService,
  ) {}

  ngOnInit() {

    if(this.parentData && this.parentData.certificate_process_pdfs && this.parentData.certificate_process_pdfs.date_issuance) {
      const dateArray = this.parentData.certificate_process_pdfs.date_issuance.split('/');
      const dateObj = new Date(+dateArray[2], +dateArray[1] - 1, +dateArray[0]);
      this.certificationDate.patchValue(dateObj);
    }
  }

  onSubmit() {
    if (
      this.parentData.certificate_process_pdfs.certification_process_status === 'certificate_published' ||
      this.parentData.certificate_process_pdfs.certification_process_status === 'certificate_issued'
    ) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('CERT_S10_CHANGE_DATE.TITLE'),
        html: this.translate.instant('CERT_S10_CHANGE_DATE.TEXT'),
        confirmButtonText: this.translate.instant('CERT_S10_CHANGE_DATE.BUTTON_1'),
        showCancelButton: true,
        cancelButtonText: this.translate.instant('CERT_S10_CHANGE_DATE.BUTTON_2'),
        allowOutsideClick: false,
        allowEscapeKey: false,
      }).then(resp => {
        if(resp.value) {
          this.subs.sink = this.updateIssuanceDate().subscribe(resp => {
            if(resp) {
              Swal.fire({
                type: 'success',
                title: this.translate.instant('Bravo !'),
              }).then(() => this.dialogRef.close("Updated"))
            } else {
              return;
            }
          })
        } else {
          return;
        }
      })
    } else {
      this.subs.sink = this.updateIssuanceDate().subscribe(resp => {
        if(resp) {
          Swal.fire({
            type: 'success',
            title: this.translate.instant('Bravo !'),
          }).then(() => this.dialogRef.close("Updated"))
        }
      })
    }
  }

  updateIssuanceDate() {
    return this.certidegreeService.updateCertificatePdfForStudent(
      this.parentData.certificate_process_pdfs.certificate_process_id._id,
      this.parentData.rncp_title._id,
      this.parentData._id,
      this.certificationDate.value.toLocaleDateString('en-GB')
    )
  }

  closeDialog() {
    this.dialogRef.close();
  }
}
