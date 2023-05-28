import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatTabGroup } from '@angular/material/tabs';
import { ActivatedRoute } from '@angular/router';
import { PermissionService } from 'app/service/permission/permission.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-company-parent-tabs',
  templateUrl: './company-parent-tabs.component.html',
  styleUrls: ['./company-parent-tabs.component.scss']
})
export class CompanyParentTabsComponent implements OnInit {
  private subs = new SubSink();
  @Input() companyData: any;
  @Input() companyId: string;
  @Input() companyTab: any;
  @Input() quickSearchMentorId: any;
  @Output() submitRequest = new EventEmitter<any>();
  @Output() imgRequest = new EventEmitter<any>();
  @ViewChild('companyMatGroup', { static: false }) companyMatGroup: MatTabGroup;

  selectedIndex = 0;

  constructor(
    public permissionService: PermissionService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {

    if (this.companyTab) {
      setTimeout(() => this.goToTab(this.companyTab), 200);
    }
  }

  // *************** Function to reload company detail after update data
  submitRequestParent(event) {

    if (event) {
      this.submitRequest.emit(event);
    }
  }

  // *************** Function to patch image from s3 to populate in card
  imgRequestParent(event) {

    if (event) {
      this.imgRequest.emit(event);
    }
  }

  // ************** Function to auto route tab
  goToTab(destination: string) {
    if (this.companyMatGroup) {
      let index = 0;
      this.companyMatGroup._tabs.forEach((tab, tabIndex) => {
        if (tab.textLabel === destination) {
          index = tabIndex;
        }
      });
      this.selectedIndex = index;
    }
  }

}
