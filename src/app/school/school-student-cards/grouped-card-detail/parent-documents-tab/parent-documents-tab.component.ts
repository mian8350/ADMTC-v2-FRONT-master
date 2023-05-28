import { MatTabGroup } from '@angular/material/tabs';
import { Router, ActivatedRoute } from '@angular/router';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, AfterViewInit } from '@angular/core';
import { PermissionService } from 'app/service/permission/permission.service';

@Component({
  selector: 'ms-parent-documents-tab',
  templateUrl: './parent-documents-tab.component.html',
  styleUrls: ['./parent-documents-tab.component.scss']
})
export class ParentDocumentsTabComponent implements OnInit, AfterViewInit {
  selectedIndex: number = 0;
  @Output() goNextTab: EventEmitter<any> = new EventEmitter();
  @Input() studentId;
  @Input() schoolId;
  @Input() titleId;
  @Input() classId;
  @Input() studentPrevCourseData;
  @Input() openFromPrevCourseDetail?: boolean;
  @Input() selectedSubTab
  @ViewChild('tabMatGroup', { static: false }) tabMatGroup: MatTabGroup;
  isClose: Boolean

  constructor(public permissionService: PermissionService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    if ((this.permissionService.showMyDocumentTabStudentCardPerm() && !this.openFromPrevCourseDetail) ||
      (this.permissionService.showDocumentTabStudentCardPerm() && !this.openFromPrevCourseDetail)) {
      this.isClose = true
    }
  }
  ngAfterViewInit(): void {
    this.goToTab(this.selectedSubTab)
  }
  nextTab(event) {
    this.goNextTab.emit(event);
  }

  goToTab(destination: string) {
    if (this.tabMatGroup) {
      let index = 0;
      this.tabMatGroup._tabs.forEach((tab, tabIndex) => {
        if (tab.textLabel === destination) {
          index = tabIndex;
        }
      });
      this.selectedIndex = index

    }
  }

}
