import { CertidegreeService } from './../../../../service/certidegree/certidegree.service';
import { DiplomaComponent } from './../../../../student-cards/diploma/diploma.component';
import { ParentsComponent } from './../../../../student-cards/parents/parents.component';
import { TranslateService } from '@ngx-translate/core';
import Swal from 'sweetalert2';
import { IdentityComponent } from './../../../../student-cards/identity/identity.component';
import { CourseComponent } from './../../../../student-cards/course/course.component';
import { MatTabGroup, MatTabHeader, MatTab } from '@angular/material/tabs';
import { Router, ActivatedRoute } from '@angular/router';
import { Component, EventEmitter, Input, OnInit, Output, ViewChild, AfterViewInit } from '@angular/core';
import { PermissionService } from 'app/service/permission/permission.service';
import * as _ from 'lodash';

@Component({
  selector: 'ms-parent-identity-tab',
  templateUrl: './parent-identity-tab.component.html',
  styleUrls: ['./parent-identity-tab.component.scss']
})
export class ParentIdentityTabComponent implements OnInit, AfterViewInit {
  selectedIndex = 0;
  @Output() goNextTab: EventEmitter<any> = new EventEmitter();
  @Input() studentId;
  @Input() schoolId;
  @Input() studentPrevCourseData;
  @Input() openFromPrevCourseDetail?: boolean;
  @Input() selectedSubTab;
  @Input() isStatusStudent;
  @ViewChild('tabMatGroup', { static: false }) tabMatGroup: MatTabGroup;
  @ViewChild('identity', { static: false }) identity: IdentityComponent;
  @ViewChild('course', { static: false }) course: CourseComponent;
  @ViewChild('parents', { static: false }) parents: ParentsComponent;
  @ViewChild('diploma', { static: false }) diploma: DiplomaComponent;
  validation: Boolean = false;

  constructor(public permissionService: PermissionService, private router: Router, private route: ActivatedRoute, private translate: TranslateService, private certiDegreeService: CertidegreeService) { }

  ngOnInit() {

  }
  ngAfterViewInit() {
    this.goToTab(this.selectedSubTab)
    // this.onTabChanged(this.selectedSubTab)
    this.tabMatGroup._handleClick = this.checkIfAnyChildrenFormInvalid.bind(this);
  }

  nextTab(event) {
    this.goNextTab.emit(event);
  }

  goToTab(destination: string, checkVal?) {
    if (this.tabMatGroup) {
      let index = 0;
      this.tabMatGroup._tabs.forEach((tab, tabIndex) => {
        if (tab.textLabel === destination) {
          index = tabIndex;
        }
      });
      if (checkVal) {
        return index
      }
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

  // getChanger(value, temp) {

  //   return _.isEqual(value, temp);
  // }
  // checkValidation() {
  //   let indexTab;
  //   this.validation = false
  //   if (this.identity) {
  //     indexTab = this.goToTab('Identity', true)
  //   }
  //   else if (this.course) {
  //     indexTab = this.goToTab('Course', true)
  //   }
  //   else if (this.parents) {
  //     indexTab = this.goToTab('Parents', true)
  //   }
  //   let index = this.selectedIndex
  //   this.selectedIndex = indexTab

  //   if (indexTab === 0) {
  //     if ((this.course && this.course.courseForm && !this.getChanger(this.course.courseForm.value, this.course.couseTemp))) {
  //       this.validation = true
  //     }
  //   }
  //   else if (indexTab === 1) {
  //     if ((this.identity && this.identity.identityForm && !this.getChanger(this.identity.identityForm.value, this.identity.studentDataTemp))) {
  //       this.validation = true
  //     }
  //   }
  //   else if (indexTab === 2) {
  //     if (((this.parents && this.parents.parentsForm && !this.getChanger(this.parents.parentsForm.value, this.parents.parentsTemp)))) {
  //       this.validation = true
  //     }
  //   }
  //   if (indexTab !== index) {
  //     if (this.validation) {
  //       Swal.fire({
  //         type: 'warning',
  //         title: this.translate.instant('TMTC_S01_IMPORT.TITLE'),
  //         text: this.translate.instant('TMTC_S01_IMPORT.TEXT'),
  //         confirmButtonText: this.translate.instant('TMTC_S01_IMPORT.BUTTON_1'),
  //         showCancelButton: true,
  //         cancelButtonText: this.translate.instant('TMTC_S01_IMPORT.BUTTON_2'),
  //         allowEscapeKey: false,
  //         allowOutsideClick: false,
  //       }).then((result) => {
  //         if (result.value) {
  //           this.selectedIndex = indexTab

  //           this.validation = false
  //         } else {
  //           this.selectedIndex = index
  //           this.validation = false
  //         }
  //       });

  //     } else {
  //       this.selectedIndex = index
  //     }
  //   }

  // }


}
