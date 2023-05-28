import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { MatTab, MatTabGroup, MatTabHeader } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { PageTitleService } from 'app/core/page-title/page-title.service';
import { CertidegreeService } from 'app/service/certidegree/certidegree.service';
import { CoreService } from 'app/service/core/core.service';
import { Observable } from 'rxjs';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';

@Component({
  selector: 'ms-certificate-details',
  templateUrl: './certificate-details.component.html',
  styleUrls: ['./certificate-details.component.scss'],
})
export class CertificateDetailsComponent implements OnInit, AfterViewInit {
  private subs = new SubSink();
  @ViewChild(MatTabGroup, { static: true }) tabs: MatTabGroup;
  statusCertiDegree = 'first';
  statusPreviewList = ['first', 'second'];

  selectedIndex;
  certiIssuenceId;
  clickedTabIndex: any;

  constructor(
    private certiDegreeService: CertidegreeService,
    private route: ActivatedRoute,
    private pageTitleService: PageTitleService,
    public translate: TranslateService,
    public coreService: CoreService,
  ) {}

  ngOnInit() {
    if (this.route && this.route.snapshot) {
      const params = this.route.snapshot.params;
      this.certiIssuenceId = params && params.id ? params.id : '';
    }
    this.subs.sink = this.certiDegreeService.getStatusCertiDegreet$.subscribe((resp) => {
      if (resp) {

        this.statusCertiDegree = resp;
      }
    });
    this.subs.sink = this.certiDegreeService.getCurrentTabDetail$.subscribe((resp) => {
      if (resp) {

        this.checkCurrentTab(resp);
      }
    });

    if (this.certiIssuenceId) {
      this.getCertificateData();
    }
    this.pageTitleService.setTitle('Detail of CertiDegree');
    this.pageTitleService.setIcon('');
    this.pageTitleService.setAdditionalInfo("");
    this.certiDegreeService.processData = null;
  }

  ngAfterViewInit() {
    //below we intercept the default click handler of tab change and replace it with our check function
    this.tabs._handleClick = this.checkIfAnyChildrenFormInvalid.bind(this);
    this.hideSideNav();
  }

  hideSideNav() {

    this.coreService.sidenavOpen = false;
  }

  getCertificateData() {

    this.subs.sink = this.certiDegreeService.getOneCertificateIssuanceProcess(this.certiIssuenceId).subscribe((resp) => {
      if (resp) {

        if (resp.current_tab) {
          this.certiDegreeService.setStatusCertiDegree(resp.current_tab);
          this.certiDegreeService.processData = resp;
          this.pageTitleService.setAdditionalInfo(`— ${resp.rncp_id.short_name} — ${resp.class_id.name}`);
          this.checkCurrentTab(resp.current_tab);
        } else {
          this.selectedIndex = 0;
        }
      }
    });
  }

  checkCurrentTab(current_tab) {
    switch (current_tab) {
      case 'first':
        this.selectedIndex = 0;
        // this.statusCertiDegree = 'first';
        break;
      case 'second':
        this.selectedIndex = 1;
        // this.statusCertiDegree = 'second';
        break;
      case 'third':
        this.selectedIndex = 2;
        // this.statusCertiDegree = 'third';
        break;
      case 'fourth':
        this.selectedIndex = 3;
        // this.statusCertiDegree = 'fourth';
        break;
    }
  }

  checkValidation(tab) {
    this.certiDegreeService.setStudentIssuingData(null);
  }

  //below function we check if any of the children has an unsaved forms
  checkIfAnyChildrenFormInvalid(tab: MatTab, tabHeader: MatTabHeader, idx: number) {
    if (!this.certiDegreeService.childrenFormValidationStatus) {
      return this.fireUnsavedDataWarningSwal(tab, tabHeader, idx);
    }
    return true && MatTabGroup.prototype._handleClick.apply(this.tabs, [tab, tabHeader, idx]);
  }

  fireUnsavedDataWarningSwal(tab: MatTab, tabHeader: MatTabHeader, idx: number) {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('TMTC_S01.TITLE'),
      text: this.translate.instant('TMTC_S01.TEXT'),
      confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        return false;
      } else {
        this.certiDegreeService.childrenFormValidationStatus = true;
        return true && MatTabGroup.prototype._handleClick.apply(this.tabs, [tab, tabHeader, idx]);
      }
    });
  }

  canDeactivate(): Observable<boolean> | Promise<boolean> | boolean {
    let isValidated: Boolean;
    isValidated = true;
    if (!this.certiDegreeService.childrenFormValidationStatus) {
      isValidated = false;
    }
    if (!isValidated) {
      return new Promise((resolve) => {
        Swal.fire({
          type: 'warning',
          title: this.translate.instant('TMTC_S01_IMPORT.TITLE'),
          text: this.translate.instant('TMTC_S01_IMPORT.TEXT'),
          confirmButtonText: this.translate.instant('TMTC_S01_IMPORT.BUTTON_1'),
          showCancelButton: true,
          cancelButtonText: this.translate.instant('TMTC_S01_IMPORT.BUTTON_2'),
          allowEscapeKey: false,
          allowOutsideClick: false,
        }).then((result) => {
          if (result.value) {
            resolve(false);
          } else {
            resolve(true);
            this.certiDegreeService.childrenFormValidationStatus = true;
          }
        });
      });
    } else {
      return new Promise((resolve) => {
        resolve(true);
        this.certiDegreeService.childrenFormValidationStatus = true;
      });
    }
  }

  // checkCurrentTab(status) {
  //   switch (status) {
  //     case 'initial':
  //       this.selectedIndex = 0;
  //       break;
  //     case 'setup_design':
  //       this.selectedIndex = 1;
  //       break;
  //     case 'review_certificate':
  //       this.selectedIndex = 2;
  //       break;
  //     case 'issuing':
  //       this.selectedIndex = 3;
  //       break;
  //   }
  // }
}
