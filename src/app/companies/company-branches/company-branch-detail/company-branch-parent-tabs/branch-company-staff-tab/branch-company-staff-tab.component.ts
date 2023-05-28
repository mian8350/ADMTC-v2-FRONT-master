import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'ms-branch-company-staff-tab',
  templateUrl: './branch-company-staff-tab.component.html',
  styleUrls: ['./branch-company-staff-tab.component.scss']
})
export class BranchCompanyStaffTabComponent implements OnInit {
  @Input() companyId

  constructor() { }

  ngOnInit() {
  }

}
