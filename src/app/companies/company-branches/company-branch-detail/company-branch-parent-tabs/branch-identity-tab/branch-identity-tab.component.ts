import { AfterViewInit, Component, Input, OnChanges, OnInit, ViewChild } from '@angular/core';
import { MatTab, MatTabGroup, MatTabHeader } from '@angular/material/tabs';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/service/auth-service/auth.service';
import { CompanyService } from 'app/service/company/company.service';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-branch-identity-tab',
  templateUrl: './branch-identity-tab.component.html',
  styleUrls: ['./branch-identity-tab.component.scss'],
})
export class BranchIdentityTabComponent implements OnInit, OnChanges {
  @Input() branchId;
  selectedIndex = 0;
  editMode = false;
  companyLocation;
  companyData;

  constructor(private companyService: CompanyService, private translate: TranslateService, private authService: AuthService) {}

  ngOnInit() {
    this.getOneCompany();

  }

  ngOnChanges() {
    if (this.branchId) {
      this.editMode = false;
      this.getOneCompany();
    }
  }

  getOneCompany() {
    this.companyService.getOneCompany(this.branchId).subscribe(
      (resp) => {
        if (resp) {
          this.companyData = resp;

          this.outCompanyLocation();
        }
      },
      (err) => {
        this.companyData = null;
        this.authService.postErrorLog(err);

      },
    );
  }

  outCompanyLocation() {
    const companyAddress = this.companyData.company_addresses.find((country) => country.is_main_address === true);
    const getCompanyLocation = companyAddress ? companyAddress.country : 0;
    this.companyLocation = getCompanyLocation;


  }

  editForm() {
    this.editMode = true;
  }

  onCancel() {
    if (!this.companyService.childrenFormValidationStatus) {
      return this.fireUnsavedDataWarningSwal();
    } else {
      this.editMode = false;
    }
  }

  isSaveForm(event) {
    if (event === true) {
      this.editMode = false;
      // this.getOneCompany()
    }
  }

  fireUnsavedDataWarningSwal() {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('TMTC_S01.TITLE'),
      text: this.translate.instant('TMTC_S01.TEXT'),
      confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
      showCancelButton: true,
      footer: `<span style="margin-left: auto">TMTC_S01</span>`,
      cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        return false;
      } else {
        this.companyService.childrenFormValidationStatus = true;
        this.editMode = false;
      }
    });
  }
}
