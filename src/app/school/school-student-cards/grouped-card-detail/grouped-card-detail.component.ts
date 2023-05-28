import { CommentariesComponent } from './commentaries/commentaries.component';
import { TranslateService } from '@ngx-translate/core';
import { CertidegreeService } from './../../../service/certidegree/certidegree.service';
import { CoreService } from 'app/service/core/core.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Component, Input, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { MatTab, MatTabGroup, MatTabChangeEvent, MatTabHeader } from '@angular/material/tabs';
import { PermissionService } from 'app/service/permission/permission.service';
import { SubSink } from 'subsink';
import Swal from 'sweetalert2';
import { SchoolService } from 'app/service/schools/school.service';

@Component({
  selector: 'ms-grouped-card-detail',
  templateUrl: './grouped-card-detail.component.html',
  styleUrls: ['./grouped-card-detail.component.scss'],
})
export class GroupedCardDetailComponent implements OnInit, AfterViewInit {
  private subs = new SubSink();
  @Input() hasAcceptedCertRule: Boolean;
  @Input() studentId = '';
  selectedRncpTitleName: string;
  selectedRncpTitleLongName: string;
  @Input() schoolId: string;
  @Input() classId: string;
  @Input() titleId: string;
  @Input() studentTabSelected: string;
  @Input() studentPrevCourseData: any;
  @Input() openFromPrevCourseDetail?: boolean;
  @Input() studentData: any
  @ViewChild('studentMatGroup', { static: false }) studentMatGroup: MatTabGroup;
  selectedTab: any
  selectedSubTab: any
  @Input() isMentor: boolean=false
  @Input() isOpenMentor: boolean=true


  selectedIndex = 0;
  myInnerHeight = 1920;
  isStatusStudent:string ;
  constructor(
    private schoolService: SchoolService,
    public permissionService: PermissionService,
    private router: Router,
    private route: ActivatedRoute,
    private coreService: CoreService,
    private certiDegreeService: CertidegreeService,
    private translate: TranslateService
  ) { }

  ngOnInit() {
    this.subs.sink =  this.schoolService.selectedStatusId$.subscribe((resp) => {
      this.isStatusStudent = resp;
    })

    if (this.studentTabSelected) {
      this.selectedTab = this.studentTabSelected
    } else {
      this.selectedTab = this.route.snapshot.queryParamMap.get('selectedTab')
    }
    this.selectedSubTab = this.route.snapshot.queryParamMap.get('selectedSubTab')

    // if(this.selectedTab){
    //   // this.onTabChanged(this.selectedTab)
    // }
    this.coreService.sidenavOpen = false
    if(this.isMentor){
      if(this.permissionService.showAcadJourneyTabStudentCardPerm()||this.permissionService.showCertificationRuleTabStudentCardPerm()){
        this.isOpenMentor = true
      }else{
        this.isOpenMentor = false
      }

    }
  }
  ngAfterViewInit(): void {
    this.studentMatGroup._handleClick = this.checkIfAnyChildrenFormInvalid.bind(this);
    this.goToTab(this.selectedTab)
  }

  getCardHeight() {
    this.myInnerHeight = window.innerHeight - 193;
    return this.myInnerHeight;
  }

  goToTab(destination: string) {
    if (this.studentMatGroup) {
      let index = 0;
      this.studentMatGroup._tabs.forEach((tab, tabIndex) => {
        if (tab.textLabel === destination) {
          index = tabIndex;
          this.selectedIndex = index
        }
      });
    }
  }

  continue(event: any) {
    if (event && this.studentMatGroup) {
      this.selectedIndex++
    }
  }

  checkIfAnyChildrenFormInvalid(tab: MatTab, tabHeader: MatTabHeader, idx: number) {
    if (!this.certiDegreeService.childrenFormValidationStatus) {
      return this.fireUnsavedDataWarningSwal(tab, tabHeader, idx);
    }
    return true && MatTabGroup.prototype._handleClick.apply(this.studentMatGroup, [tab, tabHeader, idx]);
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
        return true && MatTabGroup.prototype._handleClick.apply(this.studentMatGroup, [tab, tabHeader, idx]);
      }
    });
  }

}
