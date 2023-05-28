import { Router, ActivatedRoute } from '@angular/router';
import { MatTabGroup } from '@angular/material/tabs';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, AfterViewInit } from '@angular/core';
import { PermissionService } from 'app/service/permission/permission.service';
import { TranscriptProcessService } from 'app/service/transcript-process/transcript-process.service';
import { SubSink } from 'subsink';

@Component({
  selector: 'ms-parent-certification-tab',
  templateUrl: './parent-certification-tab.component.html',
  styleUrls: ['./parent-certification-tab.component.scss'],
})
export class ParentCertificationTabComponent implements OnInit, AfterViewInit {
  selectedIndex = 0;
  @Output() goNextTab: EventEmitter<any> = new EventEmitter();
  @Input() studentId;
  @Input() schoolId;
  @Input() titleId;
  @Input() classId;
  @Input() studentPrevCourseData;
  @Input() openFromPrevCourseDetail?: boolean;
  @Input() selectedSubTab
  @ViewChild('tabMatGroup', { static: false }) tabMatGroup: MatTabGroup;
  isClose: Boolean = false;
  _subs = new SubSink();
  showCertificationTab: boolean;
  constructor(public permissionService: PermissionService, private transcriptService: TranscriptProcessService, private router: Router, private route: ActivatedRoute) { }

  ngOnInit() {
    if ((this.permissionService.showSubjectCertTabStudentCardPerm() && !this.openFromPrevCourseDetail) ||
      (this.permissionService.showCertificationTabStudentCardPerm() && this.showCertificationTab) ||
      (this.permissionService.showDetailCertificationTabStudentCardPerm())) {
      this.isClose = true
    }
    this.getStudentTranscript();
  }
  ngAfterViewInit(): void {
    this.goToTab(this.selectedSubTab)
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

  getStudentTranscript() {
    let titleId = this.titleId;
    let classId = this.classId;
    if (this.studentPrevCourseData) {
      titleId = this.studentPrevCourseData.rncp_title._id;
      classId = this.studentPrevCourseData.current_class._id;
    }
    this._subs.sink = this.transcriptService.getOneStudentTranscriptsAll(this.studentId, titleId, classId).subscribe(
      (resp) => {
        if (resp && resp.length) {
          // AV-4982 previously checking translist is_latest & is_published has to be true to show.
          // Now just make sure its published, no need for latest
          const data = resp.find((transcript) => transcript.is_published);
          if (data) {
            this.showCertificationTab = true;
          } else {
            this.showCertificationTab = false;
          }
        }
      },
      (err) => {
        this.showCertificationTab = false;
      },
    );
  }

  nextTab(event) {
    this.goNextTab.emit(event);
  }
}
