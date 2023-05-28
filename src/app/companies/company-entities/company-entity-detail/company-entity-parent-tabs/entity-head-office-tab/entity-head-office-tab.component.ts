import { CompanyService } from 'app/service/company/company.service';
import { Component, OnInit, OnChanges, Input } from '@angular/core';
import * as moment from 'moment';
import { AuthService } from 'app/service/auth-service/auth.service';

@Component({
  selector: 'ms-entity-head-office-tab',
  templateUrl: './entity-head-office-tab.component.html',
  styleUrls: ['./entity-head-office-tab.component.scss'],
})
export class EntityHeadOfficeTabComponent implements OnInit, OnChanges {
  @Input() companyId;
  company;
  isWaitingForResponse = false;
  constructor(private companyService: CompanyService, private authService: AuthService) {}

  ngOnInit() {

    this.getOneCompany();
  }
  ngOnChanges() {
    if (this.companyId) {
      this.getOneCompany();
    }
  }
  getOneCompany() {
    this.isWaitingForResponse = true;
    this.companyService.GetOneCompanyEntity(this.companyId).subscribe(
      (resp) => {
        if (resp) {
          this.company = resp;
          this.isWaitingForResponse = false;
        }
      },
      (err) => {
        this.company = null;
        this.authService.postErrorLog(err);

      },
    );
  }
  getDate(data) {
    return moment(data).format('DD/MM/YYYY');
  }
}
