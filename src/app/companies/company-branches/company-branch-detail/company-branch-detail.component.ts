import { Component, Input, OnInit, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'ms-company-branch-detail',
  templateUrl: './company-branch-detail.component.html',
  styleUrls: ['./company-branch-detail.component.scss']
})
export class CompanyBranchDetailComponent implements OnInit {
  @Input() companyId;
  @Input() company
  @Output() isRefresh = new EventEmitter<boolean>();

  constructor() { }

  ngOnInit() {
  }
  refresh(event){
    this.isRefresh.emit(event)
  }

}
