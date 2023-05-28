import { CompanyService } from 'app/service/company/company.service';
import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { AuthService } from 'app/service/auth-service/auth.service';

@Component({
  selector: 'ms-company-entity-summary',
  templateUrl: './company-entity-summary.component.html',
  styleUrls: ['./company-entity-summary.component.scss']
})
export class CompanyEntitySummaryComponent implements OnInit, OnChanges {
  @Input() companyId
  company
  isWaitingForResponse = false

  constructor(private companyService: CompanyService, private authService: AuthService) { }

  ngOnInit() {
    this.getOneCompany()
  }
  ngOnChanges() {
    if (this.companyId) {
      this.getOneCompany()
    }
  }
  getOneCompany() {
    this.isWaitingForResponse = true
    this.companyService.GetOneCompanyEntity(this.companyId).subscribe(resp => {
      if (resp) {
        this.company = resp
        this.isWaitingForResponse = false
      }
    }, err => {
      this.company = null
      this.authService.postErrorLog(err);

      this.isWaitingForResponse = false
    })
  }

}
