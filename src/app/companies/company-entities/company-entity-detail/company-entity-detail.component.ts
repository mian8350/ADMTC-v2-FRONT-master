import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'ms-company-entity-detail',
  templateUrl: './company-entity-detail.component.html',
  styleUrls: ['./company-entity-detail.component.scss']
})
export class CompanyEntityDetailComponent implements OnInit {
  @Input() companyId;
  @Input() entityRC;

  constructor() { }

  ngOnInit() {
  }

}
