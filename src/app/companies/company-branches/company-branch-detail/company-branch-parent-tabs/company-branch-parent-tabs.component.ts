import { Router, ActivatedRoute } from '@angular/router';
import { SchoolService } from './../../../../service/schools/school.service';
import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { MatTab, MatTabGroup, MatTabHeader } from '@angular/material/tabs';
import { CompanyService } from 'app/service/company/company.service';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { PermissionService } from 'app/service/permission/permission.service';
import { AuthService } from 'app/service/auth-service/auth.service';

@Component({
  selector: 'ms-company-branch-parent-tabs',
  templateUrl: './company-branch-parent-tabs.component.html',
  styleUrls: ['./company-branch-parent-tabs.component.scss'],
})
export class CompanyBranchParentTabsComponent implements OnInit, AfterViewInit {
  selectedIndex = 0;
  @Input() companyId
  @ViewChild('companyMatGroup', { static: false }) companyMatGroup: MatTabGroup

  isWaitingForResponse = false
  userData
  companyTab

  constructor(
    private schoolService: SchoolService,
    private companyService: CompanyService,
    private translate: TranslateService,
    public permissionService: PermissionService,
    private route: ActivatedRoute,
    public authService: AuthService
  ) { }

  ngOnInit() {
    this.getAllUsers();
    const queryParams = this.route.snapshot.queryParams;
    this.companyTab = queryParams && queryParams.companyTab ? queryParams.companyTab : null
  }
  goToTab(destination: string) {
    if (this.companyMatGroup) {
      let index = 0;
      this.companyMatGroup._tabs.forEach((tab, tabIndex) => {
        if (tab.textLabel === destination) {
          index = tabIndex;
          this.selectedIndex = index
        }
      });
    }
  }

  ngAfterViewInit() {
    this.companyMatGroup._handleClick = this.checkIfAnyChildrenFormInvalid.bind(this);
    if (this.companyTab) {
      this.goToTab(this.companyTab)
    }
  }

  getAllUsers() {
    this.userData = [];
    this.isWaitingForResponse = true;
    this.schoolService.getAllUserNote().subscribe(
      (respAdmtc) => {
        this.isWaitingForResponse = false;
        this.userData = respAdmtc;
      },
      (err) => {
        this.userData = [];
        this.authService.postErrorLog(err);
        this.isWaitingForResponse = false;
      },
    );
  }

  checkIfAnyChildrenFormInvalid(tab: MatTab, tabHeader: MatTabHeader, idx: number) {
    if (!this.companyService.childrenFormValidationStatus) {
      return this.fireUnsavedDataWarningSwal(tab, tabHeader, idx);
    }
    return true && MatTabGroup.prototype._handleClick.apply(this.companyMatGroup, [tab, tabHeader, idx]);
  }

  fireUnsavedDataWarningSwal(tab: MatTab, tabHeader: MatTabHeader, idx: number) {
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
        return true && MatTabGroup.prototype._handleClick.apply(this.companyMatGroup, [tab, tabHeader, idx]);
      }
    });
  }
}
