import { Component, OnInit, ViewEncapsulation, OnDestroy } from '@angular/core';
import { PermissionService } from 'app/service/permission/permission.service';
import { PageTitleService } from 'app/core/page-title/page-title.service';

@Component({
  selector: 'ms-users-parent-tabs',
  templateUrl: './users-parent-tabs.component.html',
  styleUrls: ['./users-parent-tabs.component.scss'],
  encapsulation: ViewEncapsulation.Emulated,
})
export class UsersParentTabsComponent implements OnInit, OnDestroy {
  constructor(public permisionService: PermissionService, private pageTitleService: PageTitleService) {}

  ngOnInit() {
    this.pageTitleService.setTitle('List of users');
  }

  ngOnDestroy(): void {
    this.pageTitleService.setTitle('');
  }
}
