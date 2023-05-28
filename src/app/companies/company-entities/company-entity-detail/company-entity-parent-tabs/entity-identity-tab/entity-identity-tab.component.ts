import { CompanyService } from 'app/service/company/company.service';
import { Component, Input, OnInit, OnChanges } from '@angular/core';
import * as moment from 'moment';
import { AuthService } from 'app/service/auth-service/auth.service';

@Component({
  selector: 'ms-entity-identity-tab',
  templateUrl: './entity-identity-tab.component.html',
  styleUrls: ['./entity-identity-tab.component.scss'],
})
export class EntityIdentityTabComponent implements OnInit, OnChanges {
  @Input() companyId;
  company;
  isWaitingForRespose = false;
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
    this.isWaitingForRespose = true;
    this.companyService.GetOneCompanyEntity(this.companyId).subscribe(
      (resp) => {
        if (resp) {
          this.company = resp;
          this.isWaitingForRespose = false;
        }
      },
      (err) => {
        this.company = null;
        this.authService.postErrorLog(err);

      },
    );
  }
  getDate(data) {
    const datee = moment(data).format('DD/MM/YYYY');
    if (datee !== 'Invalid date') {
      return datee;
    } else {
      return '';
    }
  }
}
