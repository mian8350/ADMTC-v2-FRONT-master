import { MatTabGroup } from '@angular/material/tabs';
import { Component, EventEmitter, Input, OnInit, Output, AfterViewInit, ViewChild } from '@angular/core';
import { CertificationRuleService } from 'app/service/certification-rule/certification-rule.service';
import { PermissionService } from 'app/service/permission/permission.service';
import { RNCPTitlesService } from 'app/service/rncpTitles/rncp-titles.service';
import { StudentsService } from 'app/service/students/students.service';
import { SubSink } from 'subsink';
import { cloneDeep } from 'lodash';

@Component({
  selector: 'ms-parent-admission-tab',
  templateUrl: './parent-admission-tab.component.html',
  styleUrls: ['./parent-admission-tab.component.scss'],
})
export class ParentAdmissionTabComponent implements OnInit, AfterViewInit {
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
  _subs = new SubSink();

  isWaitingForResponse = false;
  selectedRncpTitleName: string;
  selectedRncpTitleLongName: string;
  certificationRuleAvailable;
  admissionStatus;
  formId;
  studentData;
  admissionData: any;
  admissionHasAcadJourneyTab: any;
  acadJourneyStepId: any;
  isReceiveCertRule: boolean = false;

  constructor(
    public permissionService: PermissionService,
    private rncpTitleService: RNCPTitlesService,
    private certificationRuleService: CertificationRuleService,
    private studentService: StudentsService
  ) { }

  ngOnInit() {
    this.getRncpTitleData();
  }

  ngOnChanges() {
    this.getDataStudent();
  }

  ngAfterViewInit(): void {
    this.goToTab(this.selectedSubTab)
  }

  getRncpTitleData() {
    this._subs.sink = this.rncpTitleService.getRncpTitleById(this.titleId).subscribe((resp) => {
      this.selectedRncpTitleName = resp.short_name;
      this.selectedRncpTitleLongName = resp.long_name;
    });
  }

  getDataStudent() {
    this.isWaitingForResponse = true;

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
            this.setDataStudent();
          }
        });
    } else {
      this._subs.sink = this.studentService.getStudentsDetailData(this.studentId, this.titleId, this.classId).subscribe((response) => {
        this.studentData = cloneDeep(response);
        this.setDataStudent();
      });
    }
  }

  setDataStudent() {
    // *************** Check admission status to check for Academic Journey Tab and Admission Form Tab
    this.formId = this.studentData?.admission_process_id?._id ? this.studentData.admission_process_id._id : null;
    this.admissionStatus = this.studentData?.admission_status ? this.studentData.admission_status : null;
    this.admissionData = this.studentData?.admission_process_id ? this.studentData.admission_process_id : null;

    if (this.admissionData?.steps?.length) {
      this.admissionHasAcadJourneyTab = this.admissionData.steps.some(step => step?.step_type === 'academic_journey');
      const acadJourneyStep = this.admissionData.steps.find(step => step?.step_type === 'academic_journey');
      this.acadJourneyStepId = acadJourneyStep?._id ? acadJourneyStep._id : null;
    }

    this.checkReceivedCertRule();
  }

  checkReceivedCertRule() {
    const titleId = this.titleId;
    const classId = this.classId;
    const userId = this.studentData?.user_id?._id;

    if (!userId) return;

    this._subs.sink = this.certificationRuleService.getCertificationRuleSentAdmissionTab(titleId, classId, userId).subscribe((resp) => {
      this.isReceiveCertRule = !!resp;
      this.isWaitingForResponse = false;
    });
  }

  goToTab(destination: string) {
    if (this.tabMatGroup) {
      let index = 0;

      this.tabMatGroup._tabs.forEach((tab, tabIndex) => {
        if (tab.textLabel === destination) {
          index = tabIndex;
        }
      });

      this.selectedIndex = index;
    }
  }

  nextTab(event) {
    this.goNextTab.emit(event);
  }
}
