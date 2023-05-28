import { TranslateService } from '@ngx-translate/core';
import { cloneDeep } from 'lodash';
import { CompanyService } from 'app/service/company/company.service';
import { UntypedFormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, OnInit, Inject } from '@angular/core';
import Swal from 'sweetalert2';
@Component({
  selector: 'ms-validate-siret-dialog',
  templateUrl: './validate-siret-dialog.component.html',
  styleUrls: ['./validate-siret-dialog.component.scss'],
})
export class ValidateSiretDialogComponent implements OnInit {
  siret = new UntypedFormControl('');
  companyData;
  isWaitingForResponse = false;
  caseMessage = null

  constructor(
    private dialogRef: MatDialogRef<ValidateSiretDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private companyService: CompanyService,
    private translate: TranslateService,
  ) {}

  ngOnInit() {}
  checkSiret() {
    this.caseMessage = null
    if (this.siret.invalid) {
      Swal.fire({
        type: 'warning',
        title: this.translate.instant('FormSave_S1.TITLE'),
        html: this.translate.instant('FormSave_S1.TEXT'),
        confirmButtonText: this.translate.instant('FormSave_S1.BUTTON_1'),
        footer: `<span style="margin-left: auto">FormSave_S1</span>`,
        allowEnterKey: false,
        allowEscapeKey: false,
        allowOutsideClick: false,
      });
      this.siret.markAllAsTouched();
      return;
    }
    const siret = this.siret.value;
    const companyId = this.data;
    this.isWaitingForResponse = true;
    this.companyService.checkCompanySiret(siret.toString(), companyId).subscribe(
      (resp) => {
        this.isWaitingForResponse = false;
        if (resp) {
          this.companyData = cloneDeep(resp);
          this.caseCompanySiret();
        }
      },
      (err) => {

        this.caseMessage = err.message
        this.isWaitingForResponse = false;
        Swal.fire({
          type: 'error',
          title: 'Error',
          text: err && err['message'] ? err['message'] : err,
          confirmButtonText: 'OK',
        });
      },
    );
  }
  caseCompanySiret() {
    if (this.companyData && this.companyData.message === 'case 1') {
      this.isWaitingForResponse = true;
      this.companyService.validateCompanyBySiret(this.companyData.siret, this.companyData.message, this.data).subscribe(
        (resp) => {
          if (resp) {
            this.isWaitingForResponse = false;
            Swal.fire({
              type: 'success',
              title: this.translate.instant('Bravo !'),
              confirmButtonText: this.translate.instant('OK'),
            }).then((result) => {
              this.closeDialog(resp);
            });
          }
        },
        (err) => {

          this.isWaitingForResponse = false;
          Swal.fire({
            type: 'error',
            title: 'Error',
            text: err && err['message'] ? err['message'] : err,
            confirmButtonText: 'OK',
          });
        },
      );
    } else if (this.companyData && this.companyData.message === 'case 2') {
      if (this.companyData.companies && this.companyData.companies.length) {
        const current = this.companyData.companies.filter((company) => company.company_type === 'current_company');
        const target = this.companyData.companies.filter((company) => company.company_type === 'target_company');
        if (current.length && target.length) {
          this.isWaitingForResponse = true;
          this.companyService
            .validateCompanyBySiret(this.companyData.siret, this.companyData.message, current[0]._id, target[0]._id)
            .subscribe(
              (resp) => {
                if (resp) {
                  this.isWaitingForResponse = false;
                  Swal.fire({
                    type: 'success',
                    title: this.translate.instant('Bravo !'),
                    confirmButtonText: this.translate.instant('OK'),
                  }).then((result) => {
                    this.closeDialog(resp);
                  });
                }
              },
              (err) => {

                this.isWaitingForResponse = false;
                Swal.fire({
                  type: 'error',
                  title: 'Error',
                  text: err && err['message'] ? err['message'] : err,
                  confirmButtonText: 'OK',
                });
              },
            );
        }
      }
    }
  }
  closeDialog(resp) {
    this.dialogRef.close(resp);
  }
}
