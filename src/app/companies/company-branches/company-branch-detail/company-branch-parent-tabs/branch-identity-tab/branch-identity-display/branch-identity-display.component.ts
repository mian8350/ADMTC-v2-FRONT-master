import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CompanyService } from 'app/service/company/company.service';
import * as moment from 'moment';

@Component({
  selector: 'ms-branch-identity-display',
  templateUrl: './branch-identity-display.component.html',
  styleUrls: ['./branch-identity-display.component.scss']
})
export class BranchIdentityDisplayComponent implements OnInit {
  @Input() branchId;
  @Input() company;
  

  constructor(private companyService: CompanyService) { }

  ngOnInit() {
  }

  getDate(data){
    return moment(data).format('DD/MM/YYYY')
  }

}

