import { CompanyService } from 'app/service/company/company.service';
import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';
import { AuthService } from 'app/service/auth-service/auth.service';

@Component({
  selector: 'ms-company-branch-summary',
  templateUrl: './company-branch-summary.component.html',
  styleUrls: ['./company-branch-summary.component.scss']
})
export class CompanyBranchSummaryComponent implements OnInit {
  @Input() companyId
  @Output() isRefresh = new EventEmitter<boolean>();
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
    this.companyService.getOneCompany(this.companyId).subscribe(resp => {
      if (resp) {
        this.company = resp
      }
      this.isWaitingForResponse = false
    }, err => {
      this.company = null

      this.isWaitingForResponse = false
    })
  }
  refresh() {
    this.isWaitingForResponse = true
    this.companyService.RefreshCompany(this.companyId).subscribe(resp => {
      if(resp){
        this.isRefresh.emit(true)
      }
      this.isWaitingForResponse = false
    },
      err => {

        this.authService.postErrorLog(err);
        this.isWaitingForResponse = false
      })
  }

}
