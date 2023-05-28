import { CertidegreeService } from './../../../../service/certidegree/certidegree.service';
import { CompanyComponent } from './../../../../student-cards/company/company.component';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { MatTabGroup, MatTabHeader, MatTab } from '@angular/material/tabs';
import { Router } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, AfterViewInit, QueryList, AfterViewChecked } from '@angular/core';
import { PermissionService } from 'app/service/permission/permission.service';
import { StudentsService } from 'app/service/students/students.service';
import { SubSink } from 'subsink';
import { cloneDeep } from 'lodash';
import * as _ from 'lodash';

@Component({
  selector: 'ms-parent-company-tab',
  templateUrl: './parent-company-tab.component.html',
  styleUrls: ['./parent-company-tab.component.scss'],
})
export class ParentCompanyTabComponent implements OnInit, AfterViewInit {
  selectedIndex: number = 0;
  @Output() goNextTab: EventEmitter<any> = new EventEmitter();
  @Input() studentId;
  @Input() schoolId;
  @Input() titleId;
  @Input() classId;
  @Input() studentPrevCourseData;
  @Input() openFromPrevCourseDetail?: boolean;
  @Input() selectedSubTab;
  @ViewChild('tabMatGroup', { static: false }) tabMatGroup: MatTabGroup;
  @ViewChild('company', { static: false }) company: CompanyComponent;
  isClose: Boolean

  _subs = new SubSink();
  studentData: any;
  validation: Boolean

  constructor(public permissionService: PermissionService, private studentService: StudentsService, private route: ActivatedRoute, private router: Router, private translate: TranslateService, private certiDegreeService: CertidegreeService) { }

  ngOnInit() {
    if ((this.permissionService.showCompanyTabStudentCardPerm() && !this.openFromPrevCourseDetail) ||
      (this.permissionService.showJobDescTabStudentCardPerm() &&
        this.studentData &&
        this.studentData.job_description_id &&
        this.studentData.job_description_id.status === 'active' &&
        !this.openFromPrevCourseDetail) ||
      (this.permissionService.showProblematicTabStudentCardPerm() && this.studentData && this.studentData.problematic_id && !this.openFromPrevCourseDetail)
      || !this.openFromPrevCourseDetail) {
      this.isClose = true
    }
  }

  ngOnChanges() {
    this.studentData = null;
    this.getDataStudent();
  }

  ngAfterViewInit() {

    this.tabMatGroup._handleClick = this.checkIfAnyChildrenFormInvalid.bind(this);
  }

  getDataStudent() {
    if (this.studentPrevCourseData) {
      this._subs.sink = this.studentService
        .getStudentsPreviousDetailData(
          this.schoolId,
          this.studentPrevCourseData.rncp_title._id,
          this.studentPrevCourseData.current_class._id,
          this.studentId,
        )
        .subscribe((response) => {
          // student's previous course data
          if (response && response[0]) {
            this.studentData = cloneDeep(response[0]);

            if (this.selectedSubTab) {
              setTimeout(() => {
                this.goToTab(this.selectedSubTab)
              }, 300);
            }
          }
        });
    } else {
      this._subs.sink = this.studentService.getStudentsDetailData(this.studentId, this.titleId, this.classId).subscribe((response) => {
        this.studentData = cloneDeep(response);
        if (this.selectedSubTab) {
          setTimeout(() => {
            this.goToTab(this.selectedSubTab)
          }, 300);
        }
      });
    }
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

  checkIfAnyChildrenFormInvalid(tab: MatTab, tabHeader: MatTabHeader, idx: number) {
    if (!this.certiDegreeService.childrenFormValidationStatus) {
      return this.fireUnsavedDataWarningSwal(tab, tabHeader, idx);
    }
    return true && MatTabGroup.prototype._handleClick.apply(this.tabMatGroup, [tab, tabHeader, idx]);
  }

  fireUnsavedDataWarningSwal(tab: MatTab, tabHeader: MatTabHeader, idx: number) {
    Swal.fire({
      type: 'warning',
      title: this.translate.instant('TMTC_S01.TITLE'),
      text: this.translate.instant('TMTC_S01.TEXT'),
      confirmButtonText: this.translate.instant('TMTC_S01.BUTTON_1'),
      showCancelButton: true,
      cancelButtonText: this.translate.instant('TMTC_S01.BUTTON_2'),
      allowEscapeKey: false,
      allowOutsideClick: false,
    }).then((result) => {
      if (result.value) {
        return false;
      } else {
        this.certiDegreeService.childrenFormValidationStatus = true;
        return true && MatTabGroup.prototype._handleClick.apply(this.tabMatGroup, [tab, tabHeader, idx]);
      }
    });
  }
}
