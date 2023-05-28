import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'ms-branch-school-connected-tab',
  templateUrl: './branch-school-connected-tab.component.html',
  styleUrls: ['./branch-school-connected-tab.component.scss']
})
export class BranchSchoolConnectedTabComponent implements OnInit {
  @Input() companyId

  constructor() { }

  ngOnInit() {
  }

}
